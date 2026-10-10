// Pure unit checks for the platform agent runner (no database, no network, no API key).
// Run: node --test tests/agent-runner.test.js   Fictional data only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkOrder, checkEdit, checkDiff, widenWorkOrder, scopeNeedsOwner, DEFAULT_SIZE_LIMITS } from '../server/lib/agentWorkOrder.js';
import { AGENT_CATALOG, RESULT_SCHEMAS, validateResult, readAgentFiles } from '../server/lib/agentRunnerCatalog.js';
import { buildTestPlan, loadSmoke, loadBaseline, fixturesAllowed } from '../server/lib/agentTestPlan.js';
import { createFixtureAdapter, createAgentSdkAdapter } from '../server/lib/agentRunnerAdapters.js';

const settings = { sizeLimits: { S: 20, M: 100, L: 300 } };
const wo = () => validateWorkOrder({ items: [{ key: 'garden-B1', intent: 'Let the label wrap', files: ['src/label.jsx'], size: 'S', doneWhen: 'J2.1' }] }, settings);

test('a work order needs items, intent, files and a size', () => {
  assert.throws(() => validateWorkOrder({ items: [] }, settings), /at least one item/);
  assert.throws(() => validateWorkOrder({ items: [{ key: 'a', intent: '', files: ['x.js'], size: 'S' }] }, settings), /intent/);
  assert.throws(() => validateWorkOrder({ items: [{ key: 'a', intent: 'x', files: [], size: 'S' }] }, settings), /file it may edit/);
  assert.throws(() => validateWorkOrder({ items: [{ key: 'a', intent: 'x', files: ['x.js'], size: 'XL' }] }, settings), /size of S, M or L/);
  assert.throws(() => validateWorkOrder({ items: [{ key: 'a', intent: 'x', files: ['/etc/passwd'], size: 'S' }] }, settings), /inside the repository/);
  assert.deepEqual(wo().sizeLimits, { S: 20, M: 100, L: 300 });
  assert.equal(DEFAULT_SIZE_LIMITS.S, 40);
});

test('the pre-edit check allows listed files and refuses everything else', () => {
  const w = wo();
  assert.equal(checkEdit(w, 'src/label.jsx').allowed, true);
  assert.equal(checkEdit(w, '/work/run-1/src/label.jsx', { cwd: '/work/run-1' }).allowed, true);
  const other = checkEdit(w, 'src/gate.jsx');
  assert.equal(other.allowed, false); assert.equal(other.code, 'NOT_IN_WORK_ORDER');
  assert.equal(checkEdit(w, 'docs/training/x.md').code, 'FORBIDDEN');
  assert.equal(checkEdit(w, 'package.json').code, 'FORBIDDEN');
  assert.equal(checkEdit(w, '../outside.js').code, 'OUTSIDE_REPOSITORY');
  assert.equal(checkEdit(w, '.agent-scope-requests/s1.json').allowed, true);
});

test('the diff check enforces files, size and commit naming (SCOPE_EXCEEDED)', () => {
  const w = wo();
  const ok = checkDiff(w, { files: [{ file: 'src/label.jsx', added: 10, deleted: 4 }], commits: [{ sha: 'abc1234', message: 'garden-B1: wrap the label' }] });
  assert.equal(ok.ok, true); assert.equal(ok.perItem[0].changed, 14);
  const bad = checkDiff(w, { files: [{ file: 'src/label.jsx', added: 30, deleted: 20 }, { file: 'src/extra.jsx', added: 1, deleted: 0 }], commits: [{ sha: 'def5678', message: 'tidy up' }] });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.violations.map((v) => v.code).sort(), ['COMMIT_UNNAMED', 'NOT_IN_WORK_ORDER', 'OVER_SIZE']);
});

test('widening is explicit, recorded, and a dependency change needs the owner', () => {
  const w = widenWorkOrder(wo(), { file: 'src/gate.jsx', item: 'garden-B1', approvedBy: 'owner', note: 'root cause' });
  assert.deepEqual(w.items[0].files, ['src/label.jsx', 'src/gate.jsx']);
  assert.equal(w.approvals.length, 1);
  assert.equal(checkEdit(w, 'src/gate.jsx').allowed, true);
  assert.equal(scopeNeedsOwner('package.json').owner, true);
  assert.equal(scopeNeedsOwner('src/gate.jsx').owner, false);
});

test('result schemas: a missing or invalid result is a list of problems, never a pass', () => {
  const p = validateResult(RESULT_SCHEMAS.validate, { passed: true });
  assert.ok(p.some((x) => x.includes('stepsTotal is missing')));
  assert.ok(validateResult(RESULT_SCHEMAS.bug, { title: 'x', triageClass: 'nonsense', observed: 'o', rootCause: 'r', files: [], size: 'S', proposedFix: 'f', doneWhen: [] })[0].includes('triageClass must be one of'));
  assert.deepEqual(validateResult(RESULT_SCHEMAS.enhancement_proposal, { title: 't', problem: 'p', evidence: 'e', value: 'v', size: 'S' }), []);
});

test('every agent has a versioned prompt file in the repository', () => {
  assert.equal(AGENT_CATALOG.length, 10);
  for (const a of AGENT_CATALOG) {
    const f = readAgentFiles(a.key);
    assert.equal(f.version, 1, a.key);
    assert.ok(f.prompt.includes(`ROLE:`), a.key);
    assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(f.prompt), `${a.key} must not carry an email address (public repository)`);
  }
});

test('the test plan always includes every smoke suite and adds regression only where the change reaches', () => {
  const none = buildTestPlan(['docs/fictional-note.md'], { allowFixture: true });
  assert.equal(none.regression.length, 0);
  assert.ok(none.smoke.length >= 1);
  const shared = buildTestPlan(['server/db.js'], { allowFixture: true });
  assert.equal(shared.regression.length, shared.smoke.length);
  assert.ok(shared.regression.every((r) => /shared module changed/.test(r.reason)));
  const custom = buildTestPlan(['server/db.js'], { allowFixture: true, sharedModules: [] });
  assert.ok(custom.regression.length < shared.regression.length);
  assert.throws(() => buildTestPlan([], {}), /at least one changed file/);
});

test('fixture baselines and scenarios are visible only in a test environment', () => {
  const prev = { a: process.env.AGENT_RUNNER_FIXTURE_WORKER, b: process.env.AGENT_RUNNER_ALLOW_FIXTURES, r: process.env.RENDER };
  try {
    delete process.env.AGENT_RUNNER_FIXTURE_WORKER; delete process.env.AGENT_RUNNER_ALLOW_FIXTURES; delete process.env.RENDER;
    assert.equal(fixturesAllowed(), false);
    assert.equal(loadBaseline('seed-catalog', 1, { allowFixture: false }), null);
    process.env.AGENT_RUNNER_FIXTURE_WORKER = '1';
    assert.equal(fixturesAllowed(), true);
    assert.equal(loadSmoke('seed-catalog', { allowFixture: true }).source, 'smoke.json');
    process.env.RENDER = 'true';
    assert.equal(fixturesAllowed(), false, 'never on Render');
  } finally {
    for (const [k, v] of [['AGENT_RUNNER_FIXTURE_WORKER', prev.a], ['AGENT_RUNNER_ALLOW_FIXTURES', prev.b], ['RENDER', prev.r]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test('the fixture adapter replays a recorded session through the work-order hooks', async () => {
  const events = []; const requests = [];
  const w = validateWorkOrder({ items: [{ key: 'garden-B2', intent: 'Let the label wrap', files: ['src/label.jsx'], size: 'S' }] }, settings);
  const hooks = {
    emit: (e) => events.push(e), shouldStop: () => false, sleep: async () => {}, scopeRequest: async (r) => requests.push(r),
    checkEdit: (f) => checkEdit(w, f),
  };
  const out = await createFixtureAdapter().execute({ agent: { key: 'release_fixer' }, fixtureScenario: 'fix_refused_edit', workOrder: w, params: {} }, hooks);
  assert.ok(events.some((e) => e.type === 'edit_refused' && e.file === 'src/gate.jsx'));
  assert.equal(requests.length, 1); assert.equal(requests[0].item, 'garden-B2');
  assert.equal(out.result.fixed.length, 0);
  await assert.rejects(() => createFixtureAdapter().execute({ agent: { key: 'release_fixer' }, fixtureScenario: 'no-such', params: {} }, hooks), /does not exist/);
});

test('the Agent SDK adapter fails clearly without the SDK or a key, and denies edits before they run (dry run)', async () => {
  const hooks = { emit() {}, shouldStop: () => false, sleep: async () => {}, scopeRequest: async () => {}, checkEdit: () => ({ allowed: false, code: 'NOT_IN_WORK_ORDER', reason: 'no' }) };
  const ctx = { agent: { key: 'release_fixer', prompt: 'p', canEditCode: true }, prompt: 'x', cwd: '/w', model: 'sonnet', turnLimit: 3 };
  await assert.rejects(() => createAgentSdkAdapter({ loadSdk: async () => { throw new Error('Cannot find package'); } }).execute(ctx, hooks), /not installed in this worker/);
  const prev = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(() => createAgentSdkAdapter({ loadSdk: async () => ({ query() { throw new Error('must not be called'); } }) }).execute(ctx, hooks), /ANTHROPIC_API_KEY is not set/);
  } finally { if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev; }
});

test('backlog seed rules: shaped needs a problem and criteria, ready needs answers, a size, a spec and a journey', async () => {
  const { seedGaps } = await import('../server/lib/backlogSeedRules.js');
  const seed = (d) => ({ data: { problem: '', openQuestions: [], acceptanceCriteria: [], draftChangeSpec: '', draftJourneys: [], size: null, ...d } });
  assert.equal(seedGaps(seed({}), 'shaped').length, 2);
  assert.equal(seedGaps(seed({ problem: 'p', acceptanceCriteria: ['a'] }), 'shaped').length, 0);
  const gaps = seedGaps(seed({ openQuestions: [{ q: 'q', answer: '' }] }), 'ready');
  assert.equal(gaps.length, 4);
  assert.equal(seedGaps(seed({ problem: 'p', acceptanceCriteria: ['a'], openQuestions: [{ q: 'q', answer: 'a' }], draftChangeSpec: 's', draftJourneys: ['j'], size: 'M' }), 'ready').length, 0);
});

// ── the worker's working copy: clone, branch, diff, push, against a real (local, fictional) repository ──
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { setupWorkingCopy, collectDiff, executeClaim } from '../server/lib/agentWorker.js';

const gitEnv = { GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 't@example.invalid' };
const g = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } });

function fictionalRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-runner-test-'));
  const origin = path.join(root, 'origin.git'); const seed = path.join(root, 'seed');
  execFileSync('git', ['init', '--bare', '--quiet', '-b', 'main', origin]);
  fs.mkdirSync(seed); g(seed, 'init', '--quiet', '-b', 'main');
  fs.mkdirSync(path.join(seed, 'src')); fs.writeFileSync(path.join(seed, 'src/label.jsx'), 'one\ntwo\nthree\n');
  g(seed, 'add', '.'); g(seed, 'commit', '--quiet', '-m', 'seed'); g(seed, 'remote', 'add', 'origin', origin); g(seed, 'push', '--quiet', 'origin', 'main');
  return { root, origin };
}
const claimFor = (w) => ({
  run: { id: 9 }, agent: { key: 'release_fixer', name: 'Fix agent', canEditCode: true }, prompt: 'x', workOrder: w, branch: 'release-loop/garden-fix-r1', params: {},
  model: 'sonnet', turnLimit: 3, resultSchema: null, pinnedBaseline: null, suiteStepIds: null, fixtureScenario: null,
});
function stubClient() {
  const sent = { events: [], complete: null };
  return { sent, events: async (id, ev) => { sent.events.push(...ev); return { stop: false }; }, scopeRequest: async () => ({}), complete: async (id, payload) => { sent.complete = payload; return { status: 'succeeded' }; } };
}

test('worker: a real working copy yields the branch diff, and only a clean in-scope branch is pushed', async () => {
  const { root, origin } = fictionalRepo();
  try {
    const w = wo(); const client = stubClient(); let pushed = 0;
    const workspace = async (claim) => {
      const { dir, base } = await setupWorkingCopy(claim, { workdir: path.join(root, 'work'), repoUrl: origin, baseBranch: 'main', authEnv: gitEnv });
      return { dir, base, push: async () => { pushed += 1; g(dir, 'push', '--quiet', 'origin', `HEAD:refs/heads/${claim.branch}`); } };
    };
    const adapter = { name: 'test', async execute(ctx) {
      fs.writeFileSync(path.join(ctx.cwd, 'src/label.jsx'), 'one\nTWO\nthree\nfour\n');
      g(ctx.cwd, 'add', '.'); g(ctx.cwd, 'commit', '--quiet', '-m', 'garden-B1: wrap the label');
      return { result: { branch: 'release-loop/garden-fix-r1', commit: 'x', fixed: [], notFixed: [], failures: [] } };
    } };
    await executeClaim(claimFor(w), { adapter, client, workspace, flushMs: 50 });
    const d = client.sent.complete.diff;
    assert.deepEqual(d.files, [{ file: 'src/label.jsx', added: 2, deleted: 1 }]);
    assert.match(d.commits[0].message, /^garden-B1: wrap the label/);
    assert.equal(checkDiff(w, d).ok, true);
    assert.equal(pushed, 1); assert.equal(client.sent.complete.push.ok, true);
    assert.match(g(origin, 'branch', '--list'), /release-loop\/garden-fix-r1/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('worker: uncommitted changes, an unnamed commit and a failed setup are reported, never merged or hidden', async () => {
  const { root, origin } = fictionalRepo();
  try {
    const w = wo(); let pushed = 0;
    const mk = (adapterBody) => {
      const client = stubClient();
      const workspace = async (claim) => {
        const { dir, base } = await setupWorkingCopy(claim, { workdir: path.join(root, 'work2'), repoUrl: origin, baseBranch: 'main', authEnv: gitEnv });
        return { dir, base, push: async () => { pushed += 1; } };
      };
      return { client, run: () => executeClaim(claimFor(w), { adapter: { name: 'test', execute: adapterBody }, client, workspace, flushMs: 50 }) };
    };
    const dirty = mk(async (ctx) => { fs.writeFileSync(path.join(ctx.cwd, 'src/label.jsx'), 'changed\n'); return { result: {} }; });
    await dirty.run();
    assert.match(dirty.client.sent.complete.error, /uncommitted changes \(src\/label\.jsx\)/);
    const unnamed = mk(async (ctx) => { fs.writeFileSync(path.join(ctx.cwd, 'src/label.jsx'), 'x\n'); g(ctx.cwd, 'add', '.'); g(ctx.cwd, 'commit', '--quiet', '-m', 'tidy up'); return { result: {} }; });
    await unnamed.run();
    assert.equal(checkDiff(w, unnamed.client.sent.complete.diff).ok, false);
    assert.equal(pushed, 0, 'a branch that fails the work order is never pushed');
    const broken = stubClient();
    await executeClaim(claimFor(w), { adapter: { name: 'test', execute: async () => ({ result: {} }) }, client: broken, workspace: async () => { throw new Error('clone refused'); }, flushMs: 50 });
    assert.match(broken.sent.complete.error, /The working copy could not be set up: clone refused/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
