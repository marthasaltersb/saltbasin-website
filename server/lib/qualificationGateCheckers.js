// Qualification gate checkers (2026-08-09) — the checkType -> executor
// registry a qualification-gate Current's gates reference by name (see
// opportunityPipelineRegistry.js's readQualificationGates/applyGateOutcome).
// Each checker returns { passed, detail } and is responsible for its own
// cost governance (checkAndRecordRunAllowance) since it's the thing actually
// spending an Anthropic call — the orchestrator (careerVerificationAgent.js)
// just calls whichever checker a gate names, it doesn't know or care what's
// inside. Adding a new gate check type is additive: register it here, never
// fork the orchestrator.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';

const MODEL = 'claude-opus-4-8';

const POSTING_STATUS_TOOL = {
  name: 'report_posting_status',
  description: 'Report whether a specific job posting is still live/open on the company\'s own careers site or official job board listing.',
  input_schema: {
    type: 'object',
    properties: {
      stillOpen: { type: 'boolean', description: 'True only if you found real, current evidence the posting is still live. False if it 404s, is marked closed/filled, or you cannot find it at all.' },
      evidenceNote: { type: 'string', description: 'One sentence citing what you found (or didn\'t find) and where.' },
    },
    required: ['stillOpen', 'evidenceNote'],
    additionalProperties: false,
  },
};

/**
 * Re-checks whether a tracked opportunity's posting URL is still a live,
 * open listing. Requires the rod to have a URL to check — a rod with no
 * URL on file can't be verified this way, and that's reported honestly
 * (passed: true, "no URL on file to verify") rather than archived on
 * missing information it was never given.
 */
async function postingStillLive(rod, params, userId) {
  const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});
  const url = metadata.url || metadata.officialSource;
  if (!url) return { passed: true, detail: 'No posting URL on file to verify — skipped, not archived on missing information.' };

  await checkAndRecordRunAllowance(userId, 'career_researcher', 'posting_verification');
  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — cannot verify posting status.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
      POSTING_STATUS_TOOL,
    ],
    tool_choice: { type: 'tool', name: 'report_posting_status' },
    system: 'You verify whether a specific job posting is still live. Check the given URL and search for the role/company/title to confirm. Report honestly — if you cannot find current evidence it is still open, report stillOpen: false. Never guess in favor of "still open" without real evidence.',
    messages: [{
      role: 'user',
      content: `Job title: ${metadata.jobTitle || '(unknown)'}\nPosting URL: ${url}\n\nIs this posting still live and open? Call report_posting_status.`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'report_posting_status');
  if (!toolUse) throw new Error('The model did not return a posting-status report — try again.');
  return { passed: !!toolUse.input.stillOpen, detail: toolUse.input.evidenceNote };
}

export const CHECKERS = {
  posting_still_live: postingStillLive,
};
