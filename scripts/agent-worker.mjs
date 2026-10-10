#!/usr/bin/env node
// The Salt Basin agent worker (docs/changes/platform-agent-runner.md). A separate process from the website: it
// claims queued runs from the platform, sets up one working copy per run, runs the agent through the adapter
// interface and reports progress with a worker token. It never reads the database.
//
//   node scripts/agent-worker.mjs [--adapter fixture|sdk] [--api http://127.0.0.1:3001] [--id my-worker] [--token <worker token>]
//                                 [--workdir /var/agent-work] [--repo owner/repo] [--base-branch main]
//                                 [--concurrency 1] [--once]
//   node scripts/agent-worker.mjs --self-test [--live]
//
// Environment (flags win): AGENT_RUNNER_API, AGENT_RUNNER_TOKEN (create it in World Shell > Journeys > Agent runner
// > Settings > Worker token), AGENT_RUNNER_ADAPTER, AGENT_RUNNER_WORKDIR, AGENT_RUNNER_REPO, AGENT_RUNNER_BASE_BRANCH,
// ANTHROPIC_API_KEY (sdk adapter only; read by the Agent SDK, never sent to the platform).
//
// --adapter fixture   replays recorded, fictional run timelines; no network beyond the platform, no API key.
// --adapter sdk       the real Claude Agent SDK (install it in the worker image only: Dockerfile.worker).
// --self-test         a dry run of the Agent SDK adapter against an in-memory stand-in for the SDK: it checks the
//                     pre-edit hook, the result handling and the usage mapping. It needs no key and no network. Add
//                     --live to also run one real one-turn query; that is skipped (exit 0, "SKIPPED") when
//                     ANTHROPIC_API_KEY is not set, and nothing is ever sent without --live.
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createFixtureAdapter, createAgentSdkAdapter } from '../server/lib/agentRunnerAdapters.js';
import { PlatformClient, workerLoop, setupWorkingCopy } from '../server/lib/agentWorker.js';

const sh = promisify(execFile);
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const opt = (k, env, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : (process.env[env] || d); };

async function selfTest() {
  const results = [];
  const ok = (name, cond, detail) => { results.push({ name, ok: !!cond, detail }); };
  // A stand-in SDK: query() runs the PreToolUse hook for an edit outside the work order, then returns a result.
  const events = [];
  const denied = [];
  const stubSdk = {
    query({ options }) {
      const hook = options.hooks.PreToolUse[0].hooks[0];
      return (async function* run() {
        yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Reading the work order' }, { type: 'tool_use', name: 'Edit' }] } };
        const out = await hook({ tool_name: 'Edit', tool_input: { file_path: '/work/src/other.jsx' } });
        denied.push(out.hookSpecificOutput.permissionDecision);
        const out2 = await hook({ tool_name: 'Edit', tool_input: { file_path: '/work/src/label.jsx' } });
        denied.push(out2.hookSpecificOutput.permissionDecision);
        yield { type: 'result', subtype: 'success', structured_output: { ok: true }, total_cost_usd: 0.01, duration_ms: 2500, num_turns: 3, usage: { input_tokens: 10, output_tokens: 5 } };
      }());
    },
  };
  const adapter = createAgentSdkAdapter({ loadSdk: async () => stubSdk });
  const prev = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = prev || 'dry-run-key-not-used';
  try {
    const out = await adapter.execute(
      { agent: { key: 'release_fixer', prompt: 'p', canEditCode: true }, prompt: 'x', cwd: '/work', model: 'sonnet', turnLimit: 5, resultSchema: { type: 'object' } },
      {
        emit: (e) => events.push(e), shouldStop: () => false, sleep: async () => {}, scopeRequest: async () => {},
        checkEdit: (f) => (f.endsWith('label.jsx') ? { allowed: true } : { allowed: false, code: 'NOT_IN_WORK_ORDER', reason: 'not listed' }),
      },
    );
    ok('edit outside the work order is denied before it runs', denied[0] === 'deny');
    ok('edit inside the work order is allowed', denied[1] === 'allow');
    ok('a refusal is reported as an event', events.some((e) => e.type === 'edit_refused'));
    ok('structured output becomes the result', out.result?.ok === true);
    ok('usage is mapped from what the SDK reported', out.usage.inputTokens === 10 && out.usage.listCostUsd === 0.01 && out.usage.activeSeconds === 3);
  } catch (e) { ok('adapter dry run', false, e.message); } finally { if (prev === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prev; }
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
  const bad = results.filter((r) => !r.ok).length;
  if (flag('--live')) {
    if (!process.env.ANTHROPIC_API_KEY) console.log('SKIPPED  live Agent SDK check: ANTHROPIC_API_KEY is not set');
    else {
      try {
        const live = await createAgentSdkAdapter().execute(
          { agent: { key: 'release_test_planner', prompt: 'Answer with the JSON {"ok":true}.', canEditCode: false }, prompt: 'Reply {"ok":true}', cwd: os.tmpdir(), model: process.env.AGENT_RUNNER_MODEL || 'sonnet', turnLimit: 2, resultSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] } },
          { emit: () => {}, shouldStop: () => false, sleep: async () => {}, scopeRequest: async () => {}, checkEdit: () => ({ allowed: false, code: 'READ_ONLY', reason: 'read only' }) },
        );
        console.log(`${live.result?.ok === true ? 'PASS' : 'FAIL'}  live one-turn query`);
        if (live.result?.ok !== true) process.exitCode = 1;
      } catch (e) { console.log(`FAIL  live one-turn query: ${e.message}`); process.exitCode = 1; }
    }
  } else console.log('NOT RUN  live Agent SDK check (pass --live; it is skipped without ANTHROPIC_API_KEY)');
  if (bad) process.exitCode = 1;
}

async function main() {
  if (flag('--self-test')) return selfTest();
  const adapterName = opt('--adapter', 'AGENT_RUNNER_ADAPTER', 'fixture');
  const api = opt('--api', 'AGENT_RUNNER_API', 'http://127.0.0.1:3001');
  const token = opt('--token', 'AGENT_RUNNER_TOKEN', '');
  if (!token) { console.error('AGENT_RUNNER_TOKEN (or --token) is not set. Create a worker token in World Shell > Journeys > Agent runner > Settings.'); process.exit(2); }
  const workerId = opt('--id', 'AGENT_RUNNER_WORKER_ID', `${os.hostname()}-${process.pid}`);
  const client = new PlatformClient({ api, token, workerId });
  const log = (m) => console.log(`${new Date().toISOString()} [${workerId}] ${m}`);
  let adapter; let workspace;
  if (adapterName === 'fixture') adapter = createFixtureAdapter();
  else if (adapterName === 'sdk') {
    if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY is not set; the sdk adapter cannot start.'); process.exit(2); }
    adapter = createAgentSdkAdapter();
    const repo = opt('--repo', 'AGENT_RUNNER_REPO', '');
    if (!repo) { console.error('--repo (or AGENT_RUNNER_REPO) is required for the sdk adapter: owner/repo or a git URL.'); process.exit(2); }
    const repoUrl = /^[\w.-]+\/[\w.-]+$/.test(repo) ? `https://github.com/${repo}.git` : repo;
    const baseBranch = opt('--base-branch', 'AGENT_RUNNER_BASE_BRANCH', 'main');
    const workdir = opt('--workdir', 'AGENT_RUNNER_WORKDIR', path.join(os.tmpdir(), 'agent-work'));
    workspace = async (claim) => {
      // The GitHub token stays in this process: it is handed to git through the environment (never a command line or
      // a file), to the worker's own clone/push, and to the integrator's session only (it merges and pushes).
      const cred = await client.gitCredential(claim.run.id);
      const header = cred.token ? `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${cred.token}`).toString('base64')}` : null;
      const authEnv = header ? { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: header } : {};
      const { dir, base } = await setupWorkingCopy(claim, { workdir, repoUrl, baseBranch, authEnv });
      return {
        dir, base,
        agentEnv: claim.agent.key === 'release_integrator' ? authEnv : {},
        push: claim.agent.canEditCode && claim.branch && header
          ? async () => { await sh('git', ['push', '--quiet', 'origin', `HEAD:refs/heads/${claim.branch}`], { cwd: dir, env: { ...process.env, ...authEnv } }); }
          : null,
      };
    };
  } else { console.error(`Unknown adapter "${adapterName}" (use fixture or sdk)`); process.exit(2); }
  const ac = new AbortController();
  process.on('SIGTERM', () => ac.abort());
  process.on('SIGINT', () => ac.abort());
  log(`worker started: adapter ${adapter.name}, platform ${api}`);
  const out = await workerLoop({ client, adapter, log, localConcurrency: Number(opt('--concurrency', 'AGENT_RUNNER_CONCURRENCY', '1')), workspace, once: flag('--once'), signal: ac.signal });
  log('worker stopped');
  if (out?.rejected) process.exitCode = 3; // a rejected token is a failure, never a clean stop
}

main().catch((e) => { console.error(`agent-worker: ${e.message}`); process.exit(1); });
