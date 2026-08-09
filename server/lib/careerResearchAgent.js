// Career job research agent (2026-08-07) — the first real (not
// config/tracking-only) agent in this codebase: it actually searches the
// live web and proposes real opportunities, rather than waiting for a human
// to type one in. On-demand only (a human clicks "Run Job Research") — see
// /root/.claude/plans/nested-tickling-micali.md for why this pass doesn't
// build unattended scheduling. Every run goes through
// checkAndRecordRunAllowance() first; every proposed opportunity is created
// via the *existing* createCareerOpportunity() path (never a parallel
// write), tagged proposedByAgent so it's never presented as equivalent to a
// human-verified entry until reviewed.
//
// Grounding: the member's real Career Atom rollup (buildCareerAtomRollupCatalog,
// same source resumeTargeting.js already uses) — skills/industries/tools
// actually on file. This codebase's Career Master schema has no explicit
// job-search-preference fields (target compensation, geography, travel
// tolerance) yet — the research prompt is honest about only using what's
// real, not inventing a persona to fill the gaps Betsy's fuller Career
// Intelligence Agent spec describes.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { buildCareerAtomRollupCatalog } from './careerAtomRollups.js';
import { createCareerOpportunity } from './careerOpportunityRollups.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';

const MODEL = 'claude-opus-4-8';
const AGENT_KEY = 'career_researcher';

const RESEARCH_TOOL = {
  name: 'propose_career_opportunities',
  description: 'Propose real, currently-open job postings found via web search that match the given Career Master profile.',
  input_schema: {
    type: 'object',
    properties: {
      opportunities: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            jobTitle: { type: 'string' },
            companyName: { type: 'string' },
            url: { type: 'string', description: 'The actual posting URL found via search — never a fabricated or guessed URL.' },
            location: { type: 'string' },
            rationale: { type: 'string', description: 'One or two sentences on why this matches the Career Master profile, citing which skills/industries it aligns with.' },
          },
          required: ['jobTitle', 'companyName', 'url', 'rationale'],
          additionalProperties: false,
        },
      },
    },
    required: ['opportunities'],
    additionalProperties: false,
  },
};

/**
 * Runs a real web-search-backed job research pass for this member and
 * creates each proposed opportunity as a real career_opportunity_target rod
 * (proposedByAgent: true). Returns the created opportunities. Throws if the
 * daily run cap is hit, if no Anthropic key is configured, or if the member
 * has no Career Atom evidence yet — never silently returns fabricated results.
 */
export async function researchCareerOpportunities(userId) {
  await checkAndRecordRunAllowance(userId, AGENT_KEY, 'job_research');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to run job research.');

  const catalog = await buildCareerAtomRollupCatalog(userId);
  if (!catalog.atomCount) throw new Error('No Career Master evidence on file yet — add your career foundation before running job research.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
      RESEARCH_TOOL,
    ],
    system: 'You research real, currently-open job postings for a candidate using their real Career Master profile. Search the live web for actual postings — never invent a company, title, or URL. Only propose roles you found real evidence for via search. When you have found up to 5 real candidate postings, call propose_career_opportunities with what you found. If you find none, call it with an empty opportunities array — do not fabricate results to avoid an empty list.',
    messages: [{
      role: 'user',
      content: `Career Master profile on file:\nSkill categories: ${catalog.skills_by_category.map((s) => s.label).join(', ') || '(none)'}\nRole/industry history: ${catalog.jobs_by_industry.map((j) => j.label).join(', ') || '(none)'}\nTool/platform experience: ${catalog.tools_by_wheel_bucket.map((t) => t.label).join(', ') || '(none)'}\n\nSearch for real, currently-open job postings that fit this profile, then call propose_career_opportunities.`,
    }],
  });

  const toolUse = [...response.content].reverse().find((b) => b.type === 'tool_use' && b.name === 'propose_career_opportunities');
  const proposed = toolUse?.input?.opportunities || [];

  const created = [];
  for (const o of proposed) {
    if (!o.jobTitle || !o.companyName) continue;
    const opp = await createCareerOpportunity(userId, {
      jobTitle: o.jobTitle,
      companyName: o.companyName,
      url: o.url || null,
      location: o.location || null,
      proposedByAgent: true,
      agentRationale: o.rationale || null,
    });
    created.push(opp);
  }
  return created;
}
