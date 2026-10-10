// The Salt Basin agent worker's engine (scripts/agent-worker.mjs is the thin command-line wrapper).
//
// The worker is a separate process from the website (a Render background worker, Dockerfile.worker): it claims
// queued runs from the platform, sets up ONE working copy per run, runs the agent through the adapter interface,
// ENFORCES the work order on the way (a pre-edit check on every file edit; the post-run diff check is repeated by
// the platform, which is the authority) and reports progress with a worker token. It never reads the database.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkEdit, checkDiff } from './agentWorkOrder.js';

const sh = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** HTTP client for the platform's worker routes. Every failure throws with the platform's own message. */
export class PlatformClient {
  constructor({ api, token, workerId }) { this.api = api.replace(/\/$/, ''); this.token = token; this.workerId = workerId; }
  async call(method, url, body) {
    const res = await fetch(`${this.api}/api/agent-runner/worker${url}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}`, 'X-Worker-Id': this.workerId }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `Platform answered ${res.status}`), { status: res.status, code: data.code });
    return data;
  }
  heartbeat(info) { return this.call('POST', '/heartbeat', info); }
  claim() { return this.call('POST', '/claim', {}); }
  events(runId, events, workOrderVersion) { return this.call('POST', `/runs/${runId}/events`, { events, workOrderVersion }); }
  scopeRequest(runId, req) { return this.call('POST', `/runs/${runId}/scope-request`, req); }
  complete(runId, payload) { return this.call('POST', `/runs/${runId}/complete`, payload); }
  gitCredential(runId) { return this.call('GET', `/runs/${runId}/git-credential`); }
}

// ── working copy (SDK mode) ─────────────────────────────────────────────────
async function git(cwd, args, env) {
  const { stdout } = await sh('git', args, { cwd, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, ...(env || {}) } });
  return stdout;
}

/** One clone per run under WORKDIR; the fix branch is created from the base branch. */
export async function setupWorkingCopy(claim, { workdir, repoUrl, baseBranch, authEnv }) {
  const dir = path.join(workdir, `run-${claim.run.id}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(workdir, { recursive: true });
  await sh('git', ['clone', '--quiet', '--branch', baseBranch, repoUrl, dir], { env: { ...process.env, ...(authEnv || {}) }, maxBuffer: 32 * 1024 * 1024 });
  if (claim.branch && claim.agent.canEditCode) await git(dir, ['switch', '-c', claim.branch]);
  const base = (await git(dir, ['rev-parse', 'HEAD'])).trim();
  return { dir, base };
}

/** The branch diff against the base: files with added/deleted lines, and each commit's message. */
export async function collectDiff(dir, base) {
  const num = await git(dir, ['diff', '--numstat', `${base}...HEAD`]);
  const files = num.split('\n').filter(Boolean).map((l) => { const [a, d, ...f] = l.split('\t'); return { file: f.join('\t'), added: a === '-' ? 0 : Number(a), deleted: d === '-' ? 0 : Number(d) }; });
  const log = await git(dir, ['log', '--format=%H%x1f%B%x1e', `${base}..HEAD`]);
  const commits = log.split('\x1e').map((c) => c.trim()).filter(Boolean).map((c) => { const [sha, ...msg] = c.split('\x1f'); return { sha, message: msg.join('\x1f').trim() }; });
  // Uncommitted changes would escape the diff: the worker counts them as a failure of the run, never ignores them.
  const dirty = (await git(dir, ['status', '--porcelain'])).split('\n').filter(Boolean).filter((l) => !l.slice(3).startsWith('.agent-scope-requests/'));
  return { files, commits, uncommitted: dirty.map((l) => l.slice(3)) };
}

// ── one run ─────────────────────────────────────────────────────────────────
/**
 * Runs one claimed run to its end. `deps` = { adapter, client, log, workspace?: async(claim)=>({dir, base}),
 * flushMs }. Returns the platform's final answer for the run.
 */
export async function executeClaim(claim, deps) {
  const { adapter, client, log = () => {}, workspace, flushMs = 1000 } = deps;
  const runId = claim.run.id;
  const state = { stop: false, workOrder: claim.workOrder, woVersion: (claim.workOrder?.approvals || []).length };
  const queue = [];
  let cwd = os.tmpdir(); let base = null;
  let flushing = Promise.resolve();
  const flush = () => {
    flushing = flushing.then(async () => {
      const batch = queue.splice(0, queue.length);
      try {
        const r = await client.events(runId, batch, state.woVersion);
        if (r.stop) state.stop = true;
        if (r.workOrder) { state.workOrder = r.workOrder; state.woVersion = r.workOrderVersion; }
      } catch (e) {
        // Events must not be lost silently: put the batch back and say so; a claim error ends the session.
        queue.unshift(...batch);
        log(`could not report progress for run ${runId}: ${e.message}`);
        if (e.status === 409) state.stop = true;
      }
    });
    return flushing;
  };
  const timer = setInterval(flush, flushMs);
  try {
    let setupError = null; let extraEnv = {}; let push = null;
    if (workspace) {
      try { const w = await workspace(claim); ({ dir: cwd, base } = w); extraEnv = w.agentEnv || {}; push = w.push || null; }
      catch (e) { setupError = `The working copy could not be set up: ${e.message}`; }
    }
    const hooks = {
      emit: (e) => queue.push(e),
      checkEdit: (file) => {
        if (state.workOrder) return checkEdit(state.workOrder, file, { cwd });
        return claim.agent.canEditCode ? { allowed: true } : { allowed: false, code: 'READ_ONLY', reason: `${claim.agent.name} cannot edit files` };
      },
      scopeRequest: async (req) => { await flush(); await client.scopeRequest(runId, req); queue.push({ type: 'progress', text: `Scope request filed for ${req.file}` }); },
      shouldStop: () => state.stop,
      // A stop request ends a wait early (checked every 250 ms) so a quiet session can be interrupted.
      sleep: async (ms) => { const end = Date.now() + ms; while (Date.now() < end && !state.stop) await sleep(Math.min(250, end - Date.now())); },
    };
    let out;
    try {
      if (setupError) throw new Error(setupError);
      out = await adapter.execute({
        run: claim.run, agent: claim.agent, prompt: claim.prompt, workOrder: state.workOrder, cwd, model: claim.model, turnLimit: claim.turnLimit, params: claim.params,
        pinnedBaseline: claim.pinnedBaseline, suiteStepIds: claim.suiteStepIds, fixtureScenario: claim.fixtureScenario, resultSchema: claim.resultSchema, extraEnv,
      }, hooks);
    } catch (e) {
      out = { error: e.message };
    }
    clearInterval(timer);
    await flush();
    let diff = out.diff ?? null; let pushed = null;
    if (!out.stopped && !out.error && claim.agent.canEditCode && workspace && base) {
      try {
        diff = await collectDiff(cwd, base);
        if (diff.uncommitted?.length) out = { ...out, error: `The agent left uncommitted changes (${diff.uncommitted.join(', ')}); they are not in any commit, so they cannot be checked or merged` };
        else {
          // The worker repeats the platform's check so a violation is visible in the log immediately; the platform decides.
          const local = checkDiff(state.workOrder, diff);
          if (!local.ok) log(`run ${runId}: diff violates the work order: ${local.violations.map((v) => v.detail).join('; ')}`);
          else if (push && claim.branch) {
            // Only a branch that passed the same check the platform repeats is pushed, and only as its own work branch.
            try { await push(); pushed = { ok: true, branch: claim.branch }; } catch (e) { pushed = { ok: false, branch: claim.branch, error: e.message }; }
          }
        }
      } catch (e) { out = { ...out, error: `The branch diff could not be read: ${e.message}` }; }
    }
    return await client.complete(runId, { result: out.result ?? null, usage: out.usage ?? null, diff, error: out.error || null, stopped: !!out.stopped, adapter: adapter.name, push: pushed });
  } finally {
    clearInterval(timer);
  }
}

/** Poll loop: heartbeat, claim, run. Local concurrency is separate from the platform's global concurrency setting. */
export async function workerLoop({ client, adapter, log = console.log, pollMs = 2000, localConcurrency = 1, workspace, once = false, signal }) {
  const active = new Set();
  let rejected = false;
  const info = { adapter: adapter.name, scenarios: adapter.scenarios?.() || [], version: 'agent-worker/1' };
  for (;;) {
    if (signal?.aborted) break;
    try {
      await client.heartbeat(info);
      if (active.size < localConcurrency) {
        const claim = await client.claim();
        if (claim?.run) {
          log(`claimed run ${claim.run.id} (${claim.agent.key})`);
          const p = executeClaim(claim, { adapter, client, log, workspace }).then((r) => log(`run ${claim.run.id}: ${r.status}`)).catch((e) => log(`run ${claim.run.id} could not be completed: ${e.message}`)).finally(() => active.delete(p));
          active.add(p);
          continue;
        }
      }
      if (once && active.size === 0) break;
    } catch (e) {
      log(`platform call failed: ${e.message}`);
      if (e.status === 401) { log('The worker token was rejected; stopping. Create a new token in World Shell > Journeys > Agent runner > Settings.'); rejected = true; break; }
    }
    await sleep(pollMs);
  }
  await Promise.allSettled([...active]);
  return { rejected };
}
