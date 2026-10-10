// Mapping rules (pure, no database): turn one session's METRICS into proposed
// edits to context / prompt / cache / memory files. Shared by the service, the
// CLI script and the tests. Never reads or emits transcript text.
import { cacheHitRatio, TOKEN_TYPES } from './sessionAnalysis.js';

const pct = (r) => `${(r * 100).toFixed(1)}%`;
const fmtInt = (v) => Number(v).toLocaleString('en-US');
const safeName = (s) => String(s || '').replace(/[^A-Za-z0-9:_.-]/g, '').slice(0, 60);

// ── Mapping proposals (pure) ────────────────────────────────────────────────

/**
 * Deterministic mapping rules over a session's METRICS. Returns proposals
 * { area, ruleKey, targetPath, title, evidence:[{label,value}], suggestedEdit }.
 * Rule keys are append-only: a stored proposal always resolves to its key.
 */
export function proposeMappings(rec, rules) {
  const th = rules.thresholds; const tg = rules.targets; const out = [];
  const t = rec.tokens || {};
  const allTokens = TOKEN_TYPES.reduce((s, k) => s + Number(t[k] || 0), 0);
  const compactions = (rec.limitEvents || []).filter((e) => e.kind === 'compaction');
  const hardLimits = (rec.limitEvents || []).filter((e) => e.kind === 'usage_limit' || e.kind === 'rate_limit');
  const ratio = rec.cacheHitRatio ?? cacheHitRatio(t);

  if (ratio != null && rec.messages >= th.minMessagesForCache && ratio < th.cacheHitRatioMin) {
    out.push({
      area: 'cache', ruleKey: 'cache.low_hit_ratio', targetPath: tg.cache,
      title: `Cache-hit ratio ${pct(ratio)} is below ${pct(th.cacheHitRatioMin)}`,
      evidence: [
        { label: 'Cache-hit ratio', value: pct(ratio) },
        { label: 'Cache-read tokens', value: fmtInt(t.cacheRead || 0) },
        { label: 'Cache-write tokens', value: fmtInt(t.cacheWrite || 0) },
        { label: 'Uncached input tokens', value: fmtInt(t.input || 0) },
        { label: 'Messages', value: fmtInt(rec.messages) },
      ],
      suggestedEdit: `In ${tg.cache}, keep the stable prefix first and identical from turn to turn: move anything that changes per task (dates, branch names, ticket details) below the stable sections, and avoid editing the top of the file mid-session. Goal: cache-hit ratio at or above ${pct(th.cacheHitRatioMin)} (this session: ${pct(ratio)} over ${rec.messages} messages).`,
    });
  }
  if (rec.prefix && rec.prefix.distinctSystemPrefixes > 1) {
    out.push({
      area: 'cache', ruleKey: 'cache.prefix_variants', targetPath: tg.cache,
      title: `${rec.prefix.distinctSystemPrefixes} different system prefixes across subagents`,
      evidence: [
        { label: 'Distinct system prefixes', value: String(rec.prefix.distinctSystemPrefixes) },
        { label: 'Distinct tool sets', value: String(rec.prefix.distinctToolSets) },
        { label: 'Subagents with prefix data', value: String(rec.prefix.subagentsWithPrefix) },
      ],
      suggestedEdit: `Subagents in this session started from ${rec.prefix.distinctSystemPrefixes} different system prefixes, so each paid to write its own cache. In ${tg.cache}, put the shared rules in one stable block and have every agent prompt start from it unchanged.`,
    });
  }
  if (compactions.length > th.compactionsMax) {
    const biggest = Math.max(0, ...compactions.map((c) => Number(c.preTokens || 0)));
    out.push({
      area: 'context', ruleKey: 'context.compaction', targetPath: tg.context,
      title: `Context compacted ${compactions.length} time${compactions.length === 1 ? '' : 's'}`,
      evidence: [
        { label: 'Compactions', value: String(compactions.length) },
        { label: 'Largest context before compaction', value: biggest ? `${fmtInt(biggest)} tokens` : 'not recorded' },
        { label: 'Peak context in one message', value: `${fmtInt(rec.peakContext || 0)} tokens` },
      ],
      suggestedEdit: `The context filled and was compacted ${compactions.length} time${compactions.length === 1 ? '' : 's'}${biggest ? ` (largest ${fmtInt(biggest)} tokens)` : ''}. In ${tg.context}, move rarely used sections into skill reference files that load on demand and keep only always-needed rules inline.`,
    });
    out.push({
      area: 'memory', ruleKey: 'memory.compaction_loss', targetPath: tg.memory,
      title: 'Durable facts at risk after compaction',
      evidence: [
        { label: 'Compactions', value: String(compactions.length) },
        { label: 'Session', value: rec.label },
      ],
      suggestedEdit: `After a compaction, decisions made earlier in the session may be lost. Add this session's durable facts (decisions, constraints, file paths; not conversation text) to ${tg.memory}, dated, so the next session starts with them.`,
    });
  }
  if (hardLimits.length > th.limitEventsMax) {
    out.push({
      area: 'prompt', ruleKey: 'prompt.limit_event', targetPath: tg.prompt,
      title: `${hardLimits.length} usage or rate-limit event${hardLimits.length === 1 ? '' : 's'}`,
      evidence: [
        { label: 'Limit events', value: String(hardLimits.length) },
        { label: 'Kinds', value: [...new Set(hardLimits.map((e) => e.kind))].join(', ') },
        { label: 'Total tokens', value: fmtInt(allTokens) },
      ],
      suggestedEdit: `The session hit ${hardLimits.length} limit event${hardLimits.length === 1 ? '' : 's'}. In ${tg.prompt}, split long agent turns into smaller scoped agents, give each only the files it needs, and ask for a short structured return instead of a full narrative.`,
    });
  }
  const agents = rec.agents || [];
  if (agents.length >= th.minAgentsForShare && allTokens > 0) {
    for (const a of agents) {
      if (a.agentId === 'main') continue; // the main thread is the session, not a delegated agent prompt
      const at = TOKEN_TYPES.reduce((s, k) => s + Number(a.tokens?.[k] || 0), 0);
      const share = at / allTokens;
      if (share > th.agentTokenShareMax) {
        out.push({
          area: 'prompt', ruleKey: `prompt.dominant_agent:${safeName(a.agentId)}`, targetPath: tg.prompt,
          title: `Agent "${a.label}" used ${pct(share)} of all tokens`,
          evidence: [
            { label: 'Agent', value: a.label },
            { label: 'Share of tokens', value: pct(share) },
            { label: 'Agent tokens', value: fmtInt(at) },
            { label: 'Session tokens', value: fmtInt(allTokens) },
          ],
          suggestedEdit: `One agent ("${a.label}") carried ${pct(share)} of the session's tokens. In ${tg.prompt} (or that agent's prompt), narrow its scope, list the exact files it should read, and cap its return to a short structured summary.`,
        });
      }
    }
  }
  for (const [skill, count] of Object.entries(rec.skillCounts || {})) {
    if (count >= th.skillRepeatMin) {
      const nm = safeName(skill);
      out.push({
        area: 'prompt', ruleKey: `prompt.skill_repeat:${nm}`, targetPath: `.claude/skills/${nm.replace(/:/g, '/')}/SKILL.md`,
        title: `Skill "${skill}" invoked ${count} times`,
        evidence: [{ label: 'Skill', value: skill }, { label: 'Invocations', value: String(count) }],
        suggestedEdit: `Skill "${skill}" was invoked ${count} times in one session. Shorten its entry steps, or copy its key steps into the calling prompt so it does not need to be reloaded.`,
      });
    }
  }
  return out;
}

