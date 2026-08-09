// Real cover-letter generation (2026-08-09) — a direct sibling of
// resumeTargeting.js's generateResumeContent(): same evidence-grounded,
// forced-tool-choice shape, same getAnthropicKey/getCareerAtomEntries
// sourcing, same "never invent" system-prompt discipline, own tool schema
// (a letter has different structural sections than a resume). Kept as its
// own file rather than folded into resumeTargeting.js because a cover
// letter and a resume are different documents with different section
// shapes — not because the generation pattern differs.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { getCareerAtomEntries } from './careerAtomRollups.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';

const MODEL = 'claude-opus-4-8';

const COVER_LETTER_TOOL = {
  name: 'propose_cover_letter_content',
  description: 'Propose actual cover letter content for a specific job, built only from the real Career Master entries provided.',
  input_schema: {
    type: 'object',
    properties: {
      openingHook: { type: 'string', description: '1-2 sentences establishing genuine, specific fit for this role — never generic filler.' },
      bodyParagraphs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sourceRowId: { type: 'number', description: 'The sourceRowId of the career_job_entry this paragraph draws from — every claim must trace back to one.' },
            text: { type: 'string', description: 'One paragraph connecting this real experience to the role, drawn only from real fields — never an invented outcome or metric.' },
          },
          required: ['sourceRowId', 'text'],
          additionalProperties: false,
        },
      },
      closing: { type: 'string', description: '1-2 sentence closing call to action.' },
    },
    required: ['openingHook', 'bodyParagraphs', 'closing'],
    additionalProperties: false,
  },
};

/**
 * Generates real, evidence-grounded cover letter content for a specific job
 * description. Every body paragraph must cite the real career_job_entry
 * sourceRowId it was drawn from. Throws (never silently fabricates) if the
 * daily run cap is hit, no key is configured, or the member has no Career
 * Atom evidence yet — identical failure discipline to generateResumeContent.
 */
export async function generateCoverLetterContent(userId, jobDescription) {
  if (!jobDescription || !jobDescription.trim()) throw new Error('A job description is required to generate cover letter content.');
  await checkAndRecordRunAllowance(userId, 'cover_letter_generator', 'cover_letter_generation');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to generate cover letter content.');

  const entries = await getCareerAtomEntries(userId);
  if (!entries.jobs.length) throw new Error('No Career Master job entries on file yet — add your career foundation before generating cover letter content.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [COVER_LETTER_TOOL],
    tool_choice: { type: 'tool', name: 'propose_cover_letter_content' },
    system: "You write cover letter content for a job seeker using ONLY the real career entries provided below — never invent a job title, employer, date, metric, outcome, or responsibility not present in the data. Every body paragraph must cite the sourceRowId of the real entry it came from. If the provided entries don't support a strong paragraph, write fewer, honest paragraphs rather than inventing detail. Avoid generic cover-letter filler — every sentence should reflect real, specific fit.",
    messages: [{
      role: 'user',
      content: `Job description:\n${jobDescription}\n\nReal Career Master job entries on file (JSON, one per role, sourceRowId is the citation key):\n${JSON.stringify(entries.jobs, null, 2)}\n\nReal skills on file:\n${JSON.stringify(entries.skills.map((s) => s.category || s.name || s).slice(0, 40), null, 2)}`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('The model did not return structured cover letter content — try again.');
  return toolUse.input;
}
