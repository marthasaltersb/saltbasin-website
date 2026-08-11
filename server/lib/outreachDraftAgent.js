// Direct outreach drafting agent (2026-08-09) — real execution for the
// already-seeded 'outreach_strategist' agent role ("Drafts first contacts
// and follow-ups based on verified facts and Betsy's proof points" —
// server/db.js's AGENT_ROSTER). Same evidence-grounded, forced-tool-choice
// shape as coverLetterTargeting.js. Drafts only — never sends (matches that
// agent's own boundary: "Send messages" is explicitly listed as forbidden).
// The draft is persisted through the exact same resume_output_projections
// path as a resume/cover letter (output_type: 'outreach_message'), so it's
// viewable/downloadable/emailable via the identical M1 infrastructure —
// the reuse Betsy explicitly asked for.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { getCareerAtomEntries } from './careerAtomRollups.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';
import { db } from '../db.js';

const MODEL = 'claude-opus-4-8';
const AGENT_KEY = 'outreach_strategist';

const OUTREACH_TOOL = {
  name: 'propose_outreach_message',
  description: 'Propose one individualized outreach message draft citing a verified trigger, one real proof point, and one clear call to action.',
  input_schema: {
    type: 'object',
    properties: {
      subject: { type: 'string' },
      body: { type: 'string', description: 'The full message body — one verified trigger (the role/posting), one real proof point drawn from the given Career Master entries, one clear CTA. No generic filler.' },
      sourceRowId: { type: 'number', description: 'The Career Master job entry the proof point was drawn from — required, every claim must trace back to a real entry.' },
    },
    required: ['subject', 'body', 'sourceRowId'],
    additionalProperties: false,
  },
};

/**
 * Drafts one real, evidence-grounded outreach message for a specific
 * tracked opportunity, citing any hiring contacts already found for it.
 * Returns the draft for review — never persists or sends anything itself;
 * the caller decides what to do with it (same review-then-approve pattern
 * as resume/cover-letter generation).
 */
export async function draftOutreachMessage(userId, opportunityRodId) {
  await checkAndRecordRunAllowance(userId, AGENT_KEY, 'outreach_draft');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to draft outreach.');

  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(opportunityRodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});

  const entries = await getCareerAtomEntries(userId);
  if (!entries.jobs.length) throw new Error('No Career Master job entries on file yet — add your career foundation before drafting outreach.');

  const persons = await db.prepare(`
    SELECT p.* FROM journey_rod_person_links l JOIN persons p ON p.id = l.person_id WHERE l.rod_id=$1
  `).all(opportunityRodId);

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [OUTREACH_TOOL],
    tool_choice: { type: 'tool', name: 'propose_outreach_message' },
    system: "You draft one individualized outreach message for a job seeker reaching out about a specific role — cite one verified trigger (the role/posting), one real proof point from their real Career Master history (with sourceRowId), and one clear call to action. Never invent a fact, employer, date, or metric not present in the data. Address the message to the known contact by name if one is given, otherwise address it generically to the hiring team.",
    messages: [{
      role: 'user',
      content: `Job: ${metadata.jobTitle || '(unknown)'} at ${metadata.companyName || '(company)'}\nPosting: ${metadata.url || '(none on file)'}\nKnown contacts found so far: ${JSON.stringify(persons.map((p) => ({ fullName: p.full_name, publicRole: p.public_role })))}\n\nReal Career Master job entries on file (JSON, sourceRowId is the citation key):\n${JSON.stringify(entries.jobs, null, 2)}\n\nDraft one outreach message, then call propose_outreach_message.`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('The model did not return a structured outreach draft — try again.');
  return toolUse.input;
}
