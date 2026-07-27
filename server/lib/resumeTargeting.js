// Job-description-targeted resume output (2026-07-27). A focused, one-shot
// call — not the tool-calling site-editing agent in memberAgent.js, which is
// the wrong shape for a single text-in/JSON-out transform. Reuses
// getAnthropicKey() (member's own BYO key, falling back to the platform's)
// for the same per-member key resolution memberAgent.js already does, and
// the official SDK + current model, matching careerResumeExtraction.js's
// existing pattern in this codebase.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { buildCareerAtomRollupCatalog } from './careerAtomRollups.js';

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
