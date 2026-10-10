// Embedded FIXTURE worker (docs/changes/platform-agent-runner.md, "Testing without spending money").
//
// With AGENT_RUNNER_FIXTURE_WORKER=1 the website process runs the same worker engine as scripts/agent-worker.mjs
// (server/lib/agentWorker.js) in-process, with the FIXTURE adapter only: recorded, fictional session timelines, no
// network and no API key. It exists so training journeys can run end to end in a test environment without a second
// process. It calls the same exported functions the worker routes call (so claims, events, scope requests and the
// server-side checks are identical), but it is NEVER started on Render (RENDER is set there) and it can never use
// the Agent SDK adapter, so a deployed platform cannot spend money through it.
import { createFixtureAdapter } from './agentRunnerAdapters.js';
import { workerLoop } from './agentWorker.js';
import * as runner from './agentRunner.js';

const WORKER_ID = 'embedded-fixture-worker';

/** Same method names as PlatformClient (HTTP) but direct calls; plain-JSON round trip so shapes match the wire. */
function inProcessClient() {
  const wire = (v) => JSON.parse(JSON.stringify(v ?? null));
  return {
    heartbeat: async (info) => wire(await runner.workerHeartbeat(WORKER_ID, info)),
    claim: async () => wire((await runner.claimNextRun(WORKER_ID)) || {}),
    events: async (runId, events, v) => wire(await runner.appendEvents(runId, WORKER_ID, events, { workOrderVersion: v })),
    scopeRequest: async (runId, req) => wire(await runner.recordScopeRequest(runId, WORKER_ID, req)),
    complete: async (runId, payload) => wire(await runner.completeRun(runId, WORKER_ID, JSON.parse(JSON.stringify(payload)))),
    gitCredential: async (runId) => wire(await runner.getGitCredential(runId, WORKER_ID)),
  };
}

export function embeddedWorkerEnabled() {
  return process.env.AGENT_RUNNER_FIXTURE_WORKER === '1' && !process.env.RENDER;
}

let controller = null;
export function startEmbeddedFixtureWorker({ log = (m) => console.log(`[agent-runner] ${m}`), pollMs = 700 } = {}) {
  if (!embeddedWorkerEnabled()) return false;
  if (controller) return true;
  controller = new AbortController();
  runner.ensureAgentRunnerSchema().then(() => workerLoop({
    client: inProcessClient(), adapter: createFixtureAdapter(), log, pollMs, localConcurrency: 2, signal: controller.signal,
  })).catch((e) => console.error('[agent-runner] embedded fixture worker stopped:', e.message));
  log('embedded FIXTURE worker started (recorded timelines only; no network, no API key)');
  return true;
}
export function stopEmbeddedFixtureWorker() { controller?.abort(); controller = null; }
