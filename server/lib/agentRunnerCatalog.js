// Catalog of the agents the platform runner can start, and the JSON shape each one must return.
//
// Prompts are versioned files in the repository (agents/release-loop/<role>/prompt.md + agent.json). The
// Claude Code workflow (.claude/workflows/release-loop.js) and the platform worker read the same files, so
// prompting an agent in the platform and running the workflow give the same behaviour. agent.json carries the
// version; a run stores the version it used. Nothing here calls a network.
//
// Result schemas are deliberately small and flat (type / required / enum / items) and checked by
// validateResult() below: a missing or invalid result is a FAILED run with the reason, never a pass.
import fs from 'node:fs';
import path from 'node:path';

export const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const AGENTS_DIR = path.join(REPO_ROOT, 'agents/release-loop');

const str = { type: 'string' };
const nstr = { type: 'string', minLength: 1 };
const strs = { type: 'array', items: { type: 'string' } };

export const RESULT_SCHEMAS = Object.freeze({
  // ── stage agents ──
  validate: {
    type: 'object',
    required: ['passed', 'commitTested', 'baselineVersion', 'stepsTotal', 'stepsPassed', 'notRun', 'failures', 'observations', 'steps'],
    properties: {
      passed: { type: 'boolean' }, commitTested: nstr, baselineVersion: { type: 'integer' }, stepsTotal: { type: 'integer' }, stepsPassed: { type: 'integer' },
      notRun: strs, observations: strs, consoleErrors: { type: 'integer' }, failedRequests: { type: 'integer' },
      failures: { type: 'array', items: { type: 'object', required: ['stepId', 'expected', 'observed'], properties: { stepId: nstr, expected: str, observed: str, surface: str, evidence: str } } },
      steps: { type: 'array', items: { type: 'object', required: ['id', 'surface', 'result'], properties: { id: nstr, surface: { type: 'string', enum: ['desktop', 'mobile', 'cli', 'setup'] }, result: { type: 'string', enum: ['pass', 'fail', 'blocked'] }, seen: str } } },
    },
  },
  fix: {
    type: 'object',
    required: ['branch', 'commit', 'fixed', 'notFixed', 'failures'],
    properties: {
      branch: nstr, commit: nstr, failures: strs,
      fixed: { type: 'array', items: { type: 'object', required: ['id', 'what', 'files', 'selfCheck'], properties: { id: nstr, what: nstr, files: strs, selfCheck: str } } },
      notFixed: { type: 'array', items: { type: 'object', required: ['id', 'why'], properties: { id: nstr, why: nstr } } },
    },
  },
  integrate: {
    type: 'object',
    required: ['merged', 'head', 'conflicts', 'buildPassed', 'notes'],
    properties: { merged: { type: 'boolean' }, head: str, conflicts: strs, buildPassed: { type: 'boolean' }, notes: str },
  },
  // ── quality agents ──
  draft_spec: {
    type: 'object', required: ['feature', 'title', 'markdown'],
    properties: { feature: nstr, title: nstr, markdown: { type: 'string', minLength: 40 } },
  },
  test_results: {
    type: 'object', required: ['feature', 'baselineVersion', 'suite', 'steps'],
    properties: {
      feature: nstr, baselineVersion: { type: 'integer' }, suite: { type: 'string', enum: ['smoke', 'regression'] }, observations: strs,
      steps: { type: 'array', items: { type: 'object', required: ['id', 'surface', 'result'], properties: { id: nstr, surface: { type: 'string', enum: ['desktop', 'mobile', 'cli', 'setup'] }, result: { type: 'string', enum: ['pass', 'fail', 'blocked'] }, seen: str } } },
    },
  },
  amendment_proposal: {
    type: 'object', required: ['feature', 'reason', 'changes'],
    properties: {
      feature: nstr, reason: nstr,
      changes: { type: 'array', minItems: 1, items: { type: 'object', required: ['op', 'after', 'tracesTo', 'whyNeeded'], properties: { op: { type: 'string', enum: ['add', 'change', 'retire'] }, stepId: str, before: str, after: nstr, tracesTo: nstr, whyNeeded: nstr, duplicateOf: str } } },
    },
  },
  bug: {
    type: 'object', required: ['title', 'triageClass', 'observed', 'rootCause', 'files', 'size', 'proposedFix', 'doneWhen'],
    properties: {
      title: nstr, triageClass: { type: 'string', enum: ['defect', 'spec_error', 'environment', 'needs_business_definition', 'coverage_gap'] }, stepId: str, observed: nstr, rootCause: nstr,
      files: strs, size: { type: 'string', enum: ['S', 'M', 'L'] }, proposedFix: nstr, doneWhen: strs, duplicateOf: str, question: str,
    },
  },
  test_plan: {
    type: 'object', required: ['changedFiles', 'rationale'],
    properties: { changedFiles: { type: 'array', minItems: 1, items: nstr }, rationale: nstr },
  },
  enhancement_proposal: {
    type: 'object', required: ['title', 'problem', 'evidence', 'value', 'size'],
    properties: { title: nstr, problem: nstr, evidence: nstr, value: nstr, size: { type: 'string', enum: ['S', 'M', 'L'] } },
  },
  shaped_seed: {
    type: 'object', required: ['seedId', 'problem', 'openQuestions', 'acceptanceCriteria', 'draftChangeSpec', 'draftJourneys', 'size'],
    properties: {
      seedId: { type: 'integer' }, problem: nstr, openQuestions: strs, acceptanceCriteria: strs, draftChangeSpec: str, draftJourneys: strs, size: { type: 'string', enum: ['S', 'M', 'L'] },
    },
  },
});

/** Mini JSON-schema check. Returns a list of problems (empty = valid). */
export function validateResult(schema, value, at = 'result') {
  const problems = [];
  const check = (s, v, p) => {
    if (!s) return;
    if (v === undefined || v === null) { problems.push(`${p} is missing`); return; }
    if (s.type === 'object') {
      if (typeof v !== 'object' || Array.isArray(v)) { problems.push(`${p} must be an object`); return; }
      for (const k of s.required || []) if (v[k] === undefined || v[k] === null) problems.push(`${p}.${k} is missing`);
      for (const [k, sub] of Object.entries(s.properties || {})) if (v[k] !== undefined && v[k] !== null) check(sub, v[k], `${p}.${k}`);
    } else if (s.type === 'array') {
      if (!Array.isArray(v)) { problems.push(`${p} must be a list`); return; }
      if (s.minItems && v.length < s.minItems) problems.push(`${p} needs at least ${s.minItems} item${s.minItems === 1 ? '' : 's'}`);
      v.forEach((it, i) => check(s.items, it, `${p}[${i}]`));
    } else if (s.type === 'string') {
      if (typeof v !== 'string') { problems.push(`${p} must be text`); return; }
      if (s.minLength && v.trim().length < s.minLength) problems.push(`${p} must not be empty`);
      if (s.enum && !s.enum.includes(v)) problems.push(`${p} must be one of: ${s.enum.join(', ')}`);
    } else if (s.type === 'integer') {
      if (!Number.isInteger(v)) problems.push(`${p} must be a whole number`);
    } else if (s.type === 'boolean') {
      if (typeof v !== 'boolean') problems.push(`${p} must be true or false`);
    }
  };
  check(schema, value, at);
  return problems;
}

/**
 * The agents. `mode`: 'quality' (prompted by a person, writes a governed proposal or record, never code) or
 * 'stage' (a release-loop stage session). `outputKind` is the governed object a quality agent's result becomes.
 * `params` lists the optional structured inputs the screen offers beside the free-text prompt.
 */
export const AGENT_CATALOG = Object.freeze([
  { key: 'release_test_script_writer', mode: 'quality', outputKind: 'draft_spec', schema: 'draft_spec', canEditCode: false,
    youCanAskIt: 'Write the training spec (test script) for a feature or backlog item from its change spec',
    writes: 'A draft training spec with preconditions and journeys (stable step ids are added when it is frozen)',
    governance: 'A new spec becomes baseline v1 only after a person approves it and the amendment reviewer freezes it against the review checklist',
    params: [] },
  { key: 'release_test_runner', mode: 'quality', outputKind: 'test_results', schema: 'test_results', canEditCode: false,
    youCanAskIt: 'Run a feature\'s smoke suite or its full regression baseline, on desktop and phone',
    writes: 'Test results scored against the pinned baseline with the baseline script\'s scorer',
    governance: 'Runs only pinned baselines under the fixed test constraints; cannot edit specs or code',
    params: ['feature', 'suite'] },
  { key: 'release_test_extender', mode: 'quality', outputKind: 'amendment_proposal', schema: 'amendment_proposal', canEditCode: false,
    youCanAskIt: 'Add test steps or scripts for something not covered (a bug that escaped, an edge case)',
    writes: 'An amendment proposal (add steps) with what each step traces to',
    governance: 'The amendment reviewer decides it; an approved one freezes the next baseline',
    params: ['feature'] },
  { key: 'release_bug_triager', mode: 'quality', outputKind: 'bug', schema: 'bug', canEditCode: false,
    youCanAskIt: 'File a bug from what you saw, link duplicates, size it S/M/L and write the work order for its fix',
    writes: 'A bug on a release-loop run with root cause, class, files, size and done-when steps',
    governance: 'Same classes and scope rules as the release loop; owner questions come back to you',
    params: ['loopRunId'] },
  { key: 'release_test_planner', mode: 'quality', outputKind: 'test_plan', schema: 'test_plan', canEditCode: false,
    youCanAskIt: 'Decide what to run after a change',
    writes: 'A test plan: every feature\'s smoke suite plus the regression baselines of features the change touches',
    governance: 'Smoke suites are fixed lists of baseline step ids, changed only by amendment; the plan itself is computed by the platform from the changed files',
    params: ['changedFiles'] },
  { key: 'release_enhancement_proposer', mode: 'quality', outputKind: 'enhancement_proposal', schema: 'enhancement_proposal', canEditCode: false,
    youCanAskIt: 'Suggest improvements from test observations, failed-run patterns, or a direction you give',
    writes: 'An enhancement proposal: problem, evidence, value, rough size. Never code',
    governance: 'You accept (it becomes a backlog seed) or decline it',
    params: [] },
  { key: 'release_backlog_gardener', mode: 'quality', outputKind: 'shaped_seed', schema: 'shaped_seed', canEditCode: false,
    youCanAskIt: 'Grow a one-line backlog seed until it is ready to build',
    writes: 'For one seed: the problem, open questions for you, acceptance criteria, a draft change spec, draft journeys and a size',
    governance: 'A seed is promoted to a feature only when you say so; until then nothing is built',
    params: ['seedId'] },
  { key: 'release_validator', mode: 'stage', stage: 'validate', schema: 'validate', canEditCode: false,
    youCanAskIt: 'Follow the pinned training baseline in a browser and record the round', writes: 'Live steps and a validation round scored from the baseline',
    governance: 'Scored only against the baseline pinned when the run starts', params: [] },
  { key: 'release_fixer', mode: 'stage', stage: 'fix', schema: 'fix', canEditCode: true,
    youCanAskIt: 'Fix the bugs named in a work order, and nothing else', writes: 'Commits on a fix branch, named by item',
    governance: 'Capped by its work order: edits outside it are refused, a branch outside it fails as SCOPE_EXCEEDED and is not merged', params: [] },
  { key: 'release_integrator', mode: 'stage', stage: 'integrate', schema: 'integrate', canEditCode: false,
    youCanAskIt: 'Merge a build or fix branch into the integration branch', writes: 'A merge result',
    governance: 'One integration at a time per branch', params: [] },
]);

export const QUALITY_AGENT_KEYS = AGENT_CATALOG.filter((a) => a.mode === 'quality').map((a) => a.key);
export const getAgent = (key) => AGENT_CATALOG.find((a) => a.key === key) || null;

/** Reads agents/release-loop/<key>/{agent.json,prompt.md}. Missing files are an error, never a silent default. */
export function readAgentFiles(key) {
  const dir = path.join(AGENTS_DIR, key);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'agent.json'), 'utf8'));
  const prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8');
  return { ...meta, prompt, promptPath: `agents/release-loop/${key}/prompt.md` };
}

/** Catalog entry + file metadata (version, prompt). Never throws for one broken agent: the problem is returned. */
export function describeAgent(a, { withPrompt = false } = {}) {
  try {
    const f = readAgentFiles(a.key);
    return { ...a, name: f.name, version: f.version, promptPath: f.promptPath, ...(withPrompt ? { prompt: f.prompt } : {}), problem: null };
  } catch (e) {
    return { ...a, name: a.key, version: null, promptPath: `agents/release-loop/${a.key}/prompt.md`, problem: `Prompt files could not be read: ${e.message}` };
  }
}
