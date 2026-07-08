// Real burst-based session analysis across every Claude Code JSONL transcript
// on file for this project. No estimates — reads actual message timestamps
// from ~/.claude/projects/<project-dir>/*.jsonl.
//
// This is the reproducible tool behind contributionMethodology.js's
// RETROACTIVE_SESSION_ANALYSIS (added 2026-07-07). Re-run it periodically —
// e.g. before writing a new patch note's metrics block — to keep the
// Contribution Intelligence numbers grounded in real session data instead of
// hand estimates.
//
// Burst rule: consecutive events are "the same active burst" if the gap
// between them is <= IDLE_GAP_MIN minutes. Active hours = sum of burst
// durations (first-to-last timestamp within each burst), NOT wall-clock
// span (which would count multi-day idle gaps between visits as "active").
//
// Critical distinction: "user" type events in the Claude Code transcript
// format include BOTH real human-typed messages AND synthetic tool_result
// echoes (Claude's own tool outputs fed back with role=user). Only the
// former represents an actual human turn — the latter is agentic-loop
// bookkeeping, not oversight. realHumanTurns filters to messages whose
// content is a plain string or contains a text block (not a tool_result-only
// content array).
//
// Usage: node scripts/analyze-contribution-sessions.mjs
//   [--projects-dir <path>]  defaults to the current project's Claude
//                            projects dir on this machine
//   [--gap-min <n>]          idle-gap threshold in minutes, default 15

import fs from 'fs';
import path from 'path';
import os from 'os';

const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
}

const DIR = argVal(
  '--projects-dir',
  path.join(os.homedir(), '.claude', 'projects', 'C--Users-mbets-saltbasin-website')
);
const IDLE_GAP_MIN = Number(argVal('--gap-min', '15'));

if (!fs.existsSync(DIR)) {
  console.error(`No such directory: ${DIR}\nPass --projects-dir <path> if your Claude projects folder lives elsewhere.`);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));

// CORRECTED 2026-07-07 (v0.18.5): also exclude two synthetic patterns
// that pass as type:"user" with real text content but were never typed
// by a human — Claude Code's auto-generated context-compaction summaries
// ("This session is being continued from a previous conversation...",
// sometimes 10-20K chars) and <task-notification>/<scheduled-task>
// system messages. The original filter only excluded tool_result-only
// content, missing these.
function isRealHumanMessage(o) {
  const content = o.message?.content;
  let text = null;
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    const hasText = content.some((c) => c.type === 'text' && c.text?.trim().length > 0);
    if (!hasText) return false;
    text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  }
  if (!text || !text.trim()) return false;
  const isSynthetic = /^This session is being continued from a previous conversation/.test(text.trim())
    || /<task-notification>/.test(text)
    || /<scheduled-task /.test(text);
  return !isSynthetic;
}

function analyze(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const events = [];
  let userEventsRaw = 0, assistantTurns = 0, realUserTurns = 0;
  for (const line of lines) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (!o.timestamp) continue;
    const t = new Date(o.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    events.push(t);
    if (o.type === 'user') {
      userEventsRaw++;
      if (isRealHumanMessage(o)) realUserTurns++;
    }
    if (o.type === 'assistant') assistantTurns++;
  }
  events.sort((a, b) => a - b);
  if (events.length === 0) return null;

  const gapMs = IDLE_GAP_MIN * 60 * 1000;
  let burstCount = 0;
  let activeMs = 0;
  let burstStart = events[0];
  let prev = events[0];
  for (let i = 1; i < events.length; i++) {
    const gap = events[i] - prev;
    if (gap > gapMs) {
      activeMs += (prev - burstStart) || 0;
      burstCount++;
      burstStart = events[i];
    }
    prev = events[i];
  }
  activeMs += (prev - burstStart) || 0;
  burstCount++;

  const activeHours = activeMs / 3600000;
  const totalTurns = realUserTurns + assistantTurns;
  const turnDensity = activeHours > 0 ? realUserTurns / activeHours : 0;
  const dateStart = new Date(events[0]).toISOString();
  const dateEnd = new Date(events[events.length - 1]).toISOString();

  return {
    file: path.basename(filePath, '.jsonl'),
    dateStart, dateEnd,
    totalLines: lines.length,
    assistantTurns, userEventsRaw, realUserTurns,
    totalTurns,
    burstCount,
    activeHours: Math.round(activeHours * 100) / 100,
    turnDensity: Math.round(turnDensity * 10) / 10,
  };
}

const results = files.map((f) => analyze(path.join(DIR, f))).filter(Boolean);
results.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));

console.log(`Analyzing ${results.length} session(s) in ${DIR} (idle gap threshold: ${IDLE_GAP_MIN} min)\n`);
console.log('sessionId'.padEnd(38), 'start'.padEnd(18), 'end'.padEnd(18), 'asstT'.padEnd(7), 'realUserT'.padEnd(10), 'bursts'.padEnd(7), 'activeHrs'.padEnd(10), 'density(human/hr)');
for (const r of results) {
  console.log(
    r.file.padEnd(38),
    r.dateStart.slice(0, 16).padEnd(18),
    r.dateEnd.slice(0, 16).padEnd(18),
    String(r.assistantTurns).padEnd(7),
    String(r.realUserTurns).padEnd(10),
    String(r.burstCount).padEnd(7),
    String(r.activeHours).padEnd(10),
    r.turnDensity
  );
}

const totals = results.reduce((acc, r) => ({
  assistantTurns: acc.assistantTurns + r.assistantTurns,
  realUserTurns: acc.realUserTurns + r.realUserTurns,
  userEventsRaw: acc.userEventsRaw + r.userEventsRaw,
  activeHours: acc.activeHours + r.activeHours,
  burstCount: acc.burstCount + r.burstCount,
}), { assistantTurns: 0, realUserTurns: 0, userEventsRaw: 0, activeHours: 0, burstCount: 0 });

console.log('\n=== TOTALS ACROSS ALL SESSIONS ===');
console.log('Sessions:', results.length);
console.log('Assistant turns:', totals.assistantTurns);
console.log('Real human turns:', totals.realUserTurns, '(raw "user"-type events incl. tool-result echoes:', totals.userEventsRaw, ')');
console.log('Total active hours:', Math.round(totals.activeHours * 100) / 100);
console.log('Total bursts:', totals.burstCount);
console.log('Overall turn density (human turns/active hr):', Math.round((totals.realUserTurns / totals.activeHours) * 10) / 10);

const outPath = path.join(process.cwd(), 'contribution-session-analysis.json');
fs.writeFileSync(outPath, JSON.stringify({ computedAt: new Date().toISOString(), idleGapMin: IDLE_GAP_MIN, perSession: results, totals }, null, 2));
console.log('\nWrote', outPath, '(gitignored — copy relevant figures into contributionMethodology.js RETROACTIVE_SESSION_ANALYSIS by hand)');
