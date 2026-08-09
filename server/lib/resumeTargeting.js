// Job-description-targeted resume output (2026-07-27). A focused, one-shot
// call — not the tool-calling site-editing agent in memberAgent.js, which is
// the wrong shape for a single text-in/JSON-out transform. Reuses
// getAnthropicKey() (member's own BYO key, falling back to the platform's)
// for the same per-member key resolution memberAgent.js already does, and
// the official SDK + current model, matching careerResumeExtraction.js's
// existing pattern in this codebase.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { buildCareerAtomRollupCatalog, getCareerAtomEntries } from './careerAtomRollups.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';

const MODEL = 'claude-opus-4-8';

const TARGETING_TOOL = {
  name: 'propose_resume_targeting',
  description: 'Propose which Career Master categories to emphasize for a specific job description.',
  input_schema: {
    type: 'object',
    properties: {
      prioritizedSkillCategories: { type: 'array', items: { type: 'string' }, description: 'Skill categories to emphasize, most relevant first.' },
      prioritizedIndustries: { type: 'array', items: { type: 'string' }, description: 'Job industries to emphasize, most relevant first.' },
      emphasisNote: { type: 'string', description: 'One or two sentences of guidance on what to foreground for this job description.' },
    },
    required: ['prioritizedSkillCategories', 'prioritizedIndustries', 'emphasisNote'],
    additionalProperties: false,
  },
};

/**
 * Computes a re-prioritization of a member's Career Master content against a
 * specific job description. Returns null (not an error) if no Anthropic key
 * is configured or the member has no Career Atom evidence yet — callers
 * should treat that as "no targeting available", not a failure.
 */
export async function computeResumeTargeting(userId, jobDescription) {
  if (!jobDescription || !jobDescription.trim()) return null;
  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) return null;

  const catalog = await buildCareerAtomRollupCatalog(userId);
  if (!catalog.atomCount) return null;

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [TARGETING_TOOL],
    tool_choice: { type: 'tool', name: 'propose_resume_targeting' },
    system: "You help a job seeker emphasize the most relevant parts of their existing career history for a specific job description. Only work with the categories/industries provided — never invent skills or experience not present in the data.",
    messages: [{
      role: 'user',
      content: `Job description:\n${jobDescription}\n\nCareer Master categories on file:\nSkill categories: ${catalog.skills_by_category.map((s) => s.label).join(', ') || '(none)'}\nJob industries: ${catalog.jobs_by_industry.map((j) => j.label).join(', ') || '(none)'}\nTool buckets: ${catalog.tools_by_wheel_bucket.map((t) => t.label).join(', ') || '(none)'}`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  return toolUse ? toolUse.input : null;
}

const RESUME_CONTENT_TOOL = {
  name: 'propose_resume_content',
  description: 'Propose actual resume section content for a specific job, built only from the real Career Master entries provided.',
  input_schema: {
    type: 'object',
    properties: {
      professionalSummary: { type: 'string', description: '2-4 sentence professional summary, built only from real experience provided.' },
      selectedExperience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sourceRowId: { type: 'number', description: 'The sourceRowId of the career_job_entry this bullet set is drawn from — every bullet must trace back to one.' },
            bullets: { type: 'array', items: { type: 'string' }, description: 'Resume bullets drawn only from this entry’s real fields — never invented outcomes or metrics.' },
          },
          required: ['sourceRowId', 'bullets'],
          additionalProperties: false,
        },
      },
      emphasizedSkills: { type: 'array', items: { type: 'string' } },
    },
    required: ['professionalSummary', 'selectedExperience', 'emphasizedSkills'],
    additionalProperties: false,
  },
};

/**
 * Generates real, evidence-grounded resume section content for a specific
 * job description (2026-08-07 — real on-demand resume generation, not the
 * category-emphasis-only computeResumeTargeting() above). Every experience
 * bullet must cite the real career_job_entry sourceRowId it was drawn from,
 * enforced by the tool schema and the system prompt's explicit constraint —
 * never invents an outcome, metric, or responsibility not present in the
 * member's real Career Atom evidence (getCareerAtomEntries()). Throws
 * (never silently fabricates) if the daily run cap is hit, no key is
 * configured, or the member has no Career Atom evidence yet.
 */
export async function generateResumeContent(userId, jobDescription) {
  if (!jobDescription || !jobDescription.trim()) throw new Error('A job description is required to generate resume content.');
  await checkAndRecordRunAllowance(userId, 'resume_generator', 'resume_generation');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to generate resume content.');

  const entries = await getCareerAtomEntries(userId);
  if (!entries.jobs.length) throw new Error('No Career Master job entries on file yet — add your career foundation before generating resume content.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [RESUME_CONTENT_TOOL],
    tool_choice: { type: 'tool', name: 'propose_resume_content' },
    system: "You write resume content for a job seeker using ONLY the real career entries provided below — never invent a job title, employer, date, metric, outcome, or responsibility not present in the data. Every experience bullet must cite the sourceRowId of the real entry it came from. If the provided entries don't support a strong bullet for a job, write fewer, honest bullets rather than inventing detail.",
    messages: [{
      role: 'user',
      content: `Job description:\n${jobDescription}\n\nReal Career Master job entries on file (JSON, one per role, sourceRowId is the citation key):\n${JSON.stringify(entries.jobs, null, 2)}\n\nReal skills on file:\n${JSON.stringify(entries.skills.map((s) => s.category || s.name || s).slice(0, 40), null, 2)}`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('The model did not return structured resume content — try again.');
  return toolUse.input;
}
