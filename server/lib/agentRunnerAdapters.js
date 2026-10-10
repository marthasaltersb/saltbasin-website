// Agent session adapters (docs/changes/platform-agent-runner.md, "Testing without spending money").
//
// ONE interface, two implementations:
//
//   adapter.execute(ctx, hooks) -> { result, usage, diff }
//
//   ctx    { run, agent:{key,prompt,version,canEditCode}, prompt, workOrder, cwd, model, turnLimit, params,
//            pinnedBaseline:{feature,version,steps}|null, fixtureScenario }
//   hooks  { emit(event), checkEdit(file) -> {allowed, reason?, code?}, scopeRequest(req), shouldStop(), sleep(ms) }
//
// The FIXTURE adapter replays recorded, fictional run timelines from server/data/agentRunner/fixtures/*.json.
// It needs no network and no API key; every training journey uses it. The AGENT SDK adapter runs the real
// @anthropic-ai/claude-agent-sdk query() in the worker: it is code-complete, is installed only in the worker
// image (the website never imports it), and is exercised here only by a dry-run self-test that skips cleanly
// when no key is set (scripts/agent-worker.mjs --self-test).
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './agentRunnerCatalog.js';

export const FIXTURE_DIR = path.join(REPO_ROOT, 'server/data/agentRunner/fixtures');

// ── fixture scenarios ───────────────────────────────────────────────────────
export function listFixtureScenarios() {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  return fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort().map((f) => {
    const j = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), 'utf8'));
    return { key: f.replace(/\.json$/, ''), description: j.description || '', agents: j.agents || [] };
  });
}
function loadScenario(key) {
  const file = path.join(FIXTURE_DIR, `${key}.json`);
  if (!/^[a-z0-9_-]+$/.test(key) || !fs.existsSync(file)) throw Object.assign(new Error(`Fixture scenario "${key}" does not exist`), { status: 400 });
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
export function defaultScenarioFor(agentKey) {
  const defaults = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, '_defaults.json'), 'utf8'));
  return defaults[agentKey] || null;
}

const getPath = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
/** Replaces "{{a.b}}" strings; a string that is exactly one placeholder keeps the value's type. */
function fill(value, scope) {
  if (typeof value === 'string') {
    const whole = /^\{\{([\w.]+)\}\}$/.exec(value);
    if (whole) return getPath(scope, whole[1]) ?? null;
    return value.replace(/\{\{([\w.]+)\}\}/g, (_, p) => String(getPath(scope, p) ?? ''));
  }
  if (Array.isArray(value)) return value.map((v) => fill(v, scope));
  if (value && typeof value === 'object') {
    if (value.$validateResult) return validateResultFor(value.$validateResult, scope);
    if (value.$testResults) return testResultsFor(value.$testResults, scope);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, scope)]));
  }
  return value;
}
function stepsFor(baseline, { except = {}, only = null } = {}) {
  const out = [];
  for (const s of baseline?.steps || []) {
    if (s.kind === 'precondition') continue;
    if (only && !only.includes(s.id)) continue;
    for (const surface of s.surfaces) out.push({ id: s.id, surface, result: except[s.id] || 'pass', seen: except[s.id] ? 'Did not match the expected result' : 'Matched the expected result' });
  }
  return out;
}
function validateResultFor(opts, scope) {
  const b = scope.pinnedBaseline;
  const steps = stepsFor(b, opts);
  const failedIds = [...new Set(steps.filter((s) => s.result !== 'pass').map((s) => s.id))];
  const total = (b?.steps || []).filter((s) => s.kind !== 'precondition').length;
  const result = {
    passed: failedIds.length === 0, commitTested: 'fixture0001', baselineVersion: opts.baselineVersion ?? b?.version ?? 1, stepsTotal: total, stepsPassed: total - failedIds.length,
    notRun: [], observations: [], consoleErrors: 0, failedRequests: 0, steps,
    failures: failedIds.map((id) => ({ stepId: id, expected: 'The expected result written in the step', observed: 'Did not match', surface: 'desktop', evidence: 'fixture' })),
  };
  for (const k of opts.omit || []) delete result[k];
  return result;
}
function testResultsFor(opts, scope) {
  const b = scope.pinnedBaseline;
  const only = scope.suiteStepIds || null;
  return { feature: scope.params?.feature || b?.feature, baselineVersion: b?.version ?? 1, suite: scope.params?.suite || 'smoke', steps: stepsFor(b, { ...opts, only }), observations: opts.observations || [] };
}

export function createFixtureAdapter() {
  return {
    name: 'fixture',
    scenarios: () => listFixtureScenarios().map((s) => s.key),
    async execute(ctx, hooks) {
      const key = ctx.fixtureScenario || defaultScenarioFor(ctx.agent.key);
      if (!key) throw Object.assign(new Error(`No fixture scenario is recorded for ${ctx.agent.key}`), { status: 400 });
      const sc = loadScenario(key);
      const scope = { params: ctx.params || {}, workOrder: ctx.workOrder || {}, pinnedBaseline: ctx.pinnedBaseline, suiteStepIds: ctx.suiteStepIds || null, run: ctx.run || {} };
      hooks.emit({ type: 'progress', text: `Fixture adapter replaying "${key}"${sc.description ? `: ${sc.description}` : ''}` });
      for (const ev of sc.events || []) {
        if (hooks.shouldStop()) { hooks.emit({ type: 'progress', text: 'Stop requested: ending the session' }); return { stopped: true }; }
        if (ev.delayMs) {
          await hooks.sleep(ev.delayMs);
          if (hooks.shouldStop()) { hooks.emit({ type: 'progress', text: 'Stop requested: ending the session' }); return { stopped: true }; }
        }
        const e = fill(ev, scope);
        if (e.t === 'progress') hooks.emit({ type: 'progress', text: e.text });
        else if (e.t === 'step') hooks.emit({ type: 'step', stepId: e.stepId, surface: e.surface, status: e.status, note: e.note });
        else if (e.t === 'edit') {
          const d = hooks.checkEdit(e.file);
          if (d.allowed) hooks.emit({ type: 'edit_ok', file: e.file, added: e.added ?? null, deleted: e.deleted ?? null });
          else hooks.emit({ type: 'edit_refused', file: e.file, code: d.code, reason: d.reason });
        } else if (e.t === 'scope_request') await hooks.scopeRequest({ file: e.file, why: e.why, item: e.item });
        else if (e.t === 'silent') await hooks.sleep(e.ms);
        else if (e.t === 'fail') throw new Error(e.message || 'The fixture session failed');
        else throw new Error(`Fixture "${key}" has an unknown event "${e.t}"`);
      }
      return { result: fill(sc.result ?? null, scope), usage: fill(sc.usage || null, scope), diff: fill(sc.diff ?? null, scope) };
    },
  };
}

// ── Claude Agent SDK ────────────────────────────────────────────────────────
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

export function createAgentSdkAdapter({ loadSdk = () => import('@anthropic-ai/claude-agent-sdk') } = {}) {
  return {
    name: 'agent-sdk',
    scenarios: () => [],
    async execute(ctx, hooks) {
      let sdk;
      try { sdk = await loadSdk(); } catch (e) {
        throw new Error(`The Claude Agent SDK is not installed in this worker (${e.message}). Build the worker image (Dockerfile.worker) or run: npm install --no-save @anthropic-ai/claude-agent-sdk@0.3.295`);
      }
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set in the worker environment');
      const abort = new AbortController();
      const stopTimer = setInterval(() => { if (hooks.shouldStop()) abort.abort(); }, 1500);
      const schema = ctx.resultSchema;

      // The pre-edit check: every file-writing tool is checked against the work order BEFORE it runs.
      const preToolUse = async (input) => {
        const tool = input.tool_name;
        const ti = input.tool_input || {};
        if (EDIT_TOOLS.has(tool)) {
          const file = ti.file_path || ti.notebook_path || ti.path;
          const d = hooks.checkEdit(file);
          if (!d.allowed) {
            hooks.emit({ type: 'edit_refused', file, code: d.code, reason: d.reason });
            return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: d.reason } };
          }
          if (d.scopeRequestFile) {
            try { await hooks.scopeRequest(JSON.parse(ti.content || '{}')); } catch (e) { hooks.emit({ type: 'progress', text: `Scope request file could not be read: ${e.message}` }); }
          } else hooks.emit({ type: 'edit_ok', file });
        }
        return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };
      };

      const options = {
        cwd: ctx.cwd,
        model: ctx.model,
        maxTurns: ctx.turnLimit,
        abortController: abort,
        permissionMode: 'acceptEdits',
        systemPrompt: { type: 'preset', preset: 'claude_code', append: ctx.agent.prompt },
        settingSources: [],
        env: { ...process.env, ...(ctx.extraEnv || {}) },
        hooks: { PreToolUse: [{ hooks: [preToolUse] }] },
        ...(schema ? { outputFormat: { type: 'json_schema', schema } } : {}),
        // A non-code agent has no file-writing tools at all; the hook above is the second line of defence.
        ...(ctx.agent.canEditCode ? {} : { disallowedTools: [...EDIT_TOOLS] }),
      };

      let final = null;
      try {
        const q = sdk.query({ prompt: ctx.prompt, options });
        for await (const msg of q) {
          if (msg.type === 'assistant') {
            for (const block of msg.message?.content || []) {
              if (block.type === 'text' && block.text?.trim()) hooks.emit({ type: 'progress', text: block.text.trim().slice(0, 300) });
              if (block.type === 'tool_use') hooks.emit({ type: 'progress', text: `Tool: ${block.name}` });
            }
          } else if (msg.type === 'result') final = msg;
        }
      } finally { clearInterval(stopTimer); }
      if (hooks.shouldStop()) return { stopped: true };
      if (!final) throw new Error('The session ended without a result message');
      const usage = {
        inputTokens: final.usage?.input_tokens ?? null, outputTokens: final.usage?.output_tokens ?? null,
        cacheReadTokens: final.usage?.cache_read_input_tokens ?? null, cacheWriteTokens: final.usage?.cache_creation_input_tokens ?? null,
        listCostUsd: typeof final.total_cost_usd === 'number' ? final.total_cost_usd : null, activeSeconds: final.duration_ms != null ? Math.round(final.duration_ms / 1000) : null,
        turns: final.num_turns ?? null, observed: true,
      };
      if (final.subtype !== 'success') return { result: null, usage, error: `The session ended early: ${final.subtype}${final.errors?.length ? ` (${final.errors.join('; ')})` : ''}` };
      return { result: final.structured_output ?? null, usage };
    },
  };
}
