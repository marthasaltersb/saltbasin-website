// Portfolio-First Site Agent — narrative drafting step (2026-10-01).
//
// Optional, on-demand Claude call that proposes a hero heading/lede and
// headline proof claims from the owner's real Career Master rows. Follows the
// same discipline as coverLetterTargeting.js (run-allowance check before the
// call, per-user key via getAnthropicKey, "never invent" system prompt) and
// adds a hard post-check: every proposed proof is re-verified with the same
// findCareerEvidence() matcher the public block uses, and its figure must
// literally appear in a matched Career Master line. Anything that fails is
// returned in `rejected` with the reason — never silently kept.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../../routes/memberAgent.js';
import { checkAndRecordRunAllowance } from '../agentRunGovernance.js';
import { findCareerEvidence } from '../careerEvidenceMatch.js';
import { AGENT_KEY } from './portfolioFirstAgent.js';

const MODEL = 'claude-opus-5-5';

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    heroHeading: { type: 'string' },
    heroLede: { type: 'string' },
    proofs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          label: { type: 'string' },
          context: { type: 'string' },
          evidenceEmployer: { type: 'string' },
          evidenceTerms: { type: 'array', items: { type: 'string' } },
        },
        required: ['value', 'label', 'context', 'evidenceEmployer', 'evidenceTerms'],
        additionalProperties: false,
      },
    },
    rationale: { type: 'string' },
  },
  required: ['heroHeading', 'heroLede', 'proofs', 'rationale'],
  additionalProperties: false,
};

const SYSTEM = [
  "You draft the opening of a portfolio-first personal website for a senior operator, using ONLY the Career Master records provided.",
  'Never invent an employer, title, date, client, metric, or outcome. Every proof figure must appear verbatim in a record\'s keyMetrics, metrics, outcomes, scale, or context text.',
  'For each proof, set evidenceEmployer to a substring of that record\'s company/employer and evidenceTerms to 1-3 short substrings that appear in the exact line carrying the figure (for example the figure itself, like "500M").',
  'Keep the owner\'s voice: reuse their own phrasing from the current narrative where it still fits rather than making it more generic. Plain, precise, executive language; no hype words.',
  'Carry scope caveats into context (for example "operational contribution within a broader team", or "figures from the client\'s own financials") whenever the record or current narrative states one.',
  'Propose 3 to 6 proofs, strongest first. If the records only support fewer, return fewer.',
].join(' ');

// Only the fields a public visitor could already see — never salary, never
// real client names (loadPublicCareerMaster already strips those).
function promptRecords(master) {
  return {
    jobs: (master.jobs || []).map((j) => ({ company: j.company, title: j.title, startDate: j.startDate, endDate: j.endDate, industry: j.industry, keyMetrics: j.keyMetrics })),
    engagements: (master.engagements || []).map((e) => ({ name: e.clientDisplayName || e.name, employer: e.employer, period: e.period, scale: e.scale, context: e.context, outcomes: e.outcomes, metrics: e.metrics })),
    topSkills: (master.skills || []).filter((s) => s.tier === 'Expert').map((s) => s.skill).slice(0, 25),
  };
}

export function validateProposedProofs(master, proofs) {
  const accepted = [];
  const rejected = [];
  for (const p of proofs || []) {
    if (!findCareerEvidence(master, { employer: p.evidenceEmployer, terms: p.evidenceTerms }).length) {
      rejected.push({ ...p, reason: 'No Career Master record matches this employer and these terms.' });
      continue;
    }
    const evidence = findCareerEvidence(master, { employer: p.evidenceEmployer, terms: p.evidenceTerms, figure: p.value });
    if (!evidence.length) {
      rejected.push({ ...p, reason: `The figure "${p.value}" does not appear in the matched Career Master lines.` });
      continue;
    }
    accepted.push({ ...p, verified: true, evidenceCount: evidence.length });
  }
  return { accepted, rejected };
}

/**
 * @param userId       acting admin (run allowance + key lookup)
 * @param master       loadPublicCareerMaster(ownerUserId) payload
 * @param narrative    current (possibly edited) narrative — voice reference
 * @param brief        optional free text from the owner (target roles, emphasis)
 */
export async function draftPortfolioNarrative({ userId, master, narrative, brief }) {
  if (!(master?.jobs || []).length) throw new Error('No Career Master jobs on file yet. Add your career foundation before drafting.');
  await checkAndRecordRunAllowance(userId, AGENT_KEY, 'narrative_draft');
  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured. Set one in your config or the platform env to draft with the agent.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'high', format: { type: 'json_schema', schema: NARRATIVE_SCHEMA } },
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        `Career Master records (JSON):\n${JSON.stringify(promptRecords(master), null, 2)}`,
        `Current narrative, for voice and caveats (JSON):\n${JSON.stringify({ hero: narrative?.hero, proofs: narrative?.proofs }, null, 2)}`,
        brief && brief.trim() ? `Owner's brief for this draft:\n${brief.trim()}` : 'No extra brief from the owner.',
      ].join('\n\n'),
    }],
  }, { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' } });

  if (response.stop_reason === 'refusal') throw new Error('The model declined to draft this narrative. Edit the narrative manually instead.');
  if (response.stop_reason === 'max_tokens') throw new Error('The draft was cut off before it finished. Try again.');
  const text = (response.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('The agent returned an unreadable draft. Try again.'); }

  const { accepted, rejected } = validateProposedProofs(master, parsed.proofs);
  return {
    hero: { heading: parsed.heroHeading, lede: parsed.heroLede },
    proofs: accepted,
    rejected,
    rationale: parsed.rationale,
    model: response.model,
  };
}
