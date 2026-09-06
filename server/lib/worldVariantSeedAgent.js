// World Variant Engine — Phase 8 slice: Variant Creation Studio's prompt interpreter
// (salt-basin-world-variants, 2026-09-06). Same evidence-grounded, forced-tool-choice shape as
// outreachDraftAgent.js/coverLetterTargeting.js. Turns a free-text prompt ("faceted, warm, dense
// cluster like a geode") plus an optional partial geometric spec into a proposed
// GenerativeSeedSpec (worldVariantGenerativeSeed.js) — the model can only choose values the tool
// schema allows, so it is structurally impossible for a prompt to smuggle in a semantic-metric
// field or an off-brand color: the schema simply has no such property.
//
// This agent never writes to WORLD_VARIANT_REGISTRY / worldVariantComponentProfiles.js — those
// stay Object.freeze'd, human-committed source files (the same "config lives in reviewed code, not
// a runtime-mutable registry" convention every other Phase 2-4 file in this build follows). It only
// proposes a seed spec for a human (Betsy) to preview, tune, and hand-copy into a real variant
// profile herself.
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';
import {
  GENERATIVE_PRIMITIVE_FAMILY,
  GENERATIVE_ACCENT_TOKEN,
  DEFAULT_GENERATIVE_SEED_SPEC,
  validateGenerativeSeedSpec,
} from '../../src/config/visual/worldVariantGenerativeSeed.js';
import { WORLD_VARIANT_FAMILY } from '../../src/config/visual/worldVariantRegistry.js';

const MODEL = 'claude-opus-4-8';
const AGENT_KEY = 'world_variant_studio';

const SEED_SPEC_TOOL = {
  name: 'propose_generative_seed_spec',
  description: 'Propose a purely aesthetic/geometric GenerativeSeedSpec for a small preview cluster of elevated 3D objects, plus a one-line rationale and (optionally) which existing world-family this exploration feels closest to.',
  input_schema: {
    type: 'object',
    properties: {
      seed: { type: 'integer', minimum: 1, maximum: 2147483647, description: 'A 32-bit seed. Pick any integer that has not obviously been asked for before, unless the user gave one.' },
      primitiveFamily: { type: 'string', enum: Object.values(GENERATIVE_PRIMITIVE_FAMILY) },
      facetAmount: { type: 'number', minimum: 0, maximum: 1, description: 'Only meaningful for bipyramid; ignored otherwise.' },
      twist: { type: 'number', minimum: 0, maximum: 1 },
      clusterSpread: { type: 'number', minimum: 0, maximum: 1 },
      accentToken: { type: 'string', enum: Object.values(GENERATIVE_ACCENT_TOKEN), description: 'A real Salt Basin brand token — never invent a hex color.' },
      clarity: { type: 'number', minimum: 0, maximum: 1 },
      count: { type: 'integer', minimum: 3, maximum: 24 },
      suggestedWorldFamily: { type: 'string', enum: Object.values(WORLD_VARIANT_FAMILY), description: 'Which existing WORLD_VARIANT_FAMILY this exploration reads closest to — a suggestion only, never a new family.' },
      rationale: { type: 'string', description: 'One or two sentences: what in the prompt drove each dial choice.' },
    },
    required: ['seed', 'primitiveFamily', 'facetAmount', 'twist', 'clusterSpread', 'accentToken', 'clarity', 'count', 'rationale'],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You help translate a free-text creative prompt into a bounded, purely aesthetic 3D geometry spec for the Salt Basin World Variant Engine's Crystal design system.

Hard rules, non-negotiable:
- You are choosing ONLY presentation dials (which real primitive, facet density, rotational twist, cluster spread, one brand accent color token, clarity, instance count). You are never asked for, and must never invent, a business metric, a data value, or a new color outside the given accentToken enum.
- primitiveFamily must be one of the given enum values — these are the real geometry builders already shipped in atomGeometry.js. Never describe a shape outside that list, even if the prompt asks for one; pick the closest real match and say so in the rationale.
- accentToken must be one of the given enum values — these are the real Salt Basin brand tokens. Pink/rose is deliberately not offered (product rule: never a fill color) — if the prompt asks for pink, pick the closest non-pink token and say so.
- Keep the whole cluster within the Strategic Operator / Salt Basin visual quality bar: faceted, jewel-toned, physically-lit crystal forms — not cartoonish, not flat-shaded, not neon outside the given brand tokens.
Call propose_generative_seed_spec exactly once with your best reading of the prompt.`;

/**
 * Interprets a free-text prompt (+ optional partial geometric hints) into a validated
 * GenerativeSeedSpec proposal. Returns { seedSpec, rationale, suggestedWorldFamily }. Throws on any
 * governance, auth, or validation failure — never silently falls back to fabricated output.
 */
export async function interpretVariantPrompt(userId, promptText, hints = {}) {
  await checkAndRecordRunAllowance(userId, AGENT_KEY, 'seed_generate');

  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) throw new Error('No Anthropic key configured — set one in your member config or platform env to use the Variant Creation Studio.');

  const trimmedPrompt = String(promptText || '').trim();
  if (!trimmedPrompt) throw new Error('Prompt text is required.');

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    tools: [SEED_SPEC_TOOL],
    tool_choice: { type: 'tool', name: 'propose_generative_seed_spec' },
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Prompt: ${trimmedPrompt}\n\nAny geometric hints already chosen by the user (may be partial or empty — respect any given value, fill in the rest): ${JSON.stringify(hints)}\n\nDefault spec, for reference on typical ranges: ${JSON.stringify(DEFAULT_GENERATIVE_SEED_SPEC)}`,
    }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('The model did not return a structured seed spec — try again.');

  const { rationale, suggestedWorldFamily, ...seedSpec } = toolUse.input;
  const errors = validateGenerativeSeedSpec(seedSpec);
  if (errors.length) throw new Error(`Model proposed an invalid seed spec: ${errors.join(' ')}`);

  return { seedSpec, rationale, suggestedWorldFamily: suggestedWorldFamily || null };
}
