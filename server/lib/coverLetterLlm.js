// LLM step of the cover-letter agent (2026-10-02) — reached only when the package search and
// the deterministic rules could not satisfy a request.
//
// The model sees: the request, the search hits (package text only) and ONLY the affected
// paragraph(s). It must answer through a forced tool call whose arguments are edit
// OPERATIONS. Anything that is not a targeted edit set (too many operations, paragraphs
// outside the context it was given, a near-total rewrite, oversized text) is rejected and
// retried once with the reason; if the retry is rejected too the turn fails visibly and the
// letter is untouched.
//
// Providers: 'anthropic' (the existing ANTHROPIC_API_KEY / member BYO key via getAnthropicKey,
// same SDK + forced-tool pattern as coverLetterTargeting.js) and 'stub' (offline, deterministic,
// for tests and demos; says so in every result).
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicKey } from '../routes/memberAgent.js';
import { checkAndRecordRunAllowance } from './agentRunGovernance.js';
import { assertTargetedEditSet, EditSetError, MAX_OPS } from './coverLetterEdits.js';

export class LlmUnavailableError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const EDIT_TOOL = {
  name: 'propose_edits',
  description: 'Propose a small set of edit operations to the cover letter. Never return the whole letter.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'One sentence describing what the edits do.' },
      operations: {
        type: 'array',
        maxItems: MAX_OPS,
        items: {
          type: 'object',
          properties: {
            op: { type: 'string', enum: ['replace', 'insert_after', 'delete'] },
            paragraph: { type: 'integer', description: 'Paragraph number from the context (insert_after: the paragraph to insert after).' },
            text: { type: 'string', description: 'New paragraph text for replace / insert_after. Omit for delete.' },
          },
          required: ['op', 'paragraph'],
          additionalProperties: false,
        },
      },
    },
    required: ['summary', 'operations'],
    additionalProperties: false,
  },
};

const SYSTEM = [
  'You edit ONE cover letter by returning edit operations through the propose_edits tool. Never return the whole letter.',
  'You may only change the paragraphs listed under "paragraphs" (replace / delete them, or insert a new paragraph after one of them).',
  'Use at most a few operations. Keep each text a single paragraph.',
  'Use ONLY facts that appear in "evidence" or in the paragraphs themselves. If the evidence does not support the request, return the smallest harmless edit you can, or an empty operations list — never invent employers, dates, metrics or claims.',
].join(' ');

function buildPayload({ request, letter, affected, hits, jobTitle }) {
  return {
    request,
    jobTitle: jobTitle || null,
    totalParagraphs: letter.length,
    paragraphs: affected.map((n) => ({ paragraph: n, text: letter[n - 1].text })),
    evidence: hits.slice(0, 5).map((h) => ({ source: h.sourceLabel, paragraph: h.index, text: h.text.length > 300 ? `${h.text.slice(0, 299)}…` : h.text })),
  };
}

const estimateTokens = (text) => Math.ceil(String(text || '').length / 4);

// ── providers ───────────────────────────────────────────────────────────────

async function callStub({ payload }) {
  const first = payload.paragraphs[0];
  const trigger = /stub:regenerate/i.test(payload.request);
  const operations = trigger
    ? Array.from({ length: MAX_OPS + 1 }, (_, i) => ({ op: 'replace', paragraph: Math.min(i + 1, payload.totalParagraphs), text: `Regenerated paragraph ${i + 1}.` }))
    : [{ op: 'replace', paragraph: first.paragraph, text: `${first.text} [Test stub edit for: "${payload.request.slice(0, 80)}"]` }];
  const input = estimateTokens(JSON.stringify(payload));
  const output = estimateTokens(JSON.stringify(operations));
  return { summary: trigger ? 'Stub regeneration (should be rejected).' : 'Offline test stub edit — not a real model.', operations, usage: { input, output, estimated: true } };
}

async function requireAnthropicKey(userId) {
  const apiKey = await getAnthropicKey(userId);
  if (!apiKey) {
    throw new LlmUnavailableError('No Anthropic API key is configured. Nothing was sent to a model and the letter is unchanged. Add a key in your Config panel (Bring Your Own Claude) or ask your admin to set ANTHROPIC_API_KEY — or pick the offline test stub under Settings to try the flow.', 'no_api_key');
  }
  return apiKey;
}

async function callAnthropic({ userId, model, payload, feedback }) {
  const apiKey = await requireAnthropicKey(userId);
  const anthropic = new Anthropic({ apiKey });
  const content = `${JSON.stringify(payload, null, 2)}${feedback ? `\n\nYour previous answer was rejected: ${feedback}\nReturn a targeted edit set through propose_edits.` : ''}`;
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1200,
    system: SYSTEM,
    tools: [EDIT_TOOL],
    tool_choice: { type: 'tool', name: 'propose_edits' },
    messages: [{ role: 'user', content }],
  });
  const tool = response.content.find((b) => b.type === 'tool_use');
  if (!tool) throw new EditSetError('The model did not return an edit proposal.');
  return {
    summary: String(tool.input?.summary || ''),
    operations: tool.input?.operations,
    usage: { input: response.usage?.input_tokens ?? null, output: response.usage?.output_tokens ?? null, estimated: false },
  };
}

/**
 * Asks the configured provider for edit operations. Returns
 * { ops, summary, usage:{input,output,estimated}, attempts, latencyMs, model, provider }.
 * Throws LlmUnavailableError (no key / cap) before any call, or Error with `details` if the model
 * never produced a targeted edit set (usage of the failed attempts is attached as err.usage).
 */
export async function proposeEditsWithLlm({ userId, settings, request, letter, affected, hits, jobTitle }) {
  const provider = settings.provider;
  const model = provider === 'stub' ? 'offline-test-stub' : settings.model;
  const payload = buildPayload({ request, letter, affected, hits, jobTitle });
  const allowed = new Set(affected);
  if (provider === 'anthropic') {
    // Fail before spending: key check first (clear message), then the daily run cap.
    await requireAnthropicKey(userId);
    try {
      await checkAndRecordRunAllowance(userId, 'cover_letter_agent', 'llm_edit');
    } catch (e) {
      throw new LlmUnavailableError(`${e.message} Nothing was sent to a model and the letter is unchanged.`, 'run_cap');
    }
  }
  const started = Date.now();
  const usage = { input: 0, output: 0, estimated: false };
  let feedback = null;
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let raw;
    try {
      raw = provider === 'stub' ? await callStub({ payload }) : await callAnthropic({ userId, model, payload, feedback });
    } catch (e) {
      if (e instanceof EditSetError) { lastError = e; feedback = e.message; continue; }
      const err = new Error(`The language model call failed: ${e.message}. The letter is unchanged.`);
      err.usage = usage; err.attempts = attempt; err.latencyMs = Date.now() - started; err.model = model; err.provider = provider;
      throw err;
    }
    usage.input += raw.usage.input || 0;
    usage.output += raw.usage.output || 0;
    usage.estimated = usage.estimated || raw.usage.estimated;
    try {
      const ops = assertTargetedEditSet(raw.operations, letter, allowed);
      return { ops, summary: raw.summary, usage, attempts: attempt, latencyMs: Date.now() - started, model, provider };
    } catch (e) {
      if (!(e instanceof EditSetError)) throw e;
      lastError = e; feedback = e.message;
    }
  }
  const err = new Error(`The model did not return a targeted edit set after 2 attempts (${lastError?.message}). The proposal was rejected and the letter is unchanged.`);
  err.usage = usage; err.attempts = 2; err.latencyMs = Date.now() - started; err.model = model; err.provider = provider; err.rejected = true;
  throw err;
}
