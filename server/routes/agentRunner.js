// Platform agent runner API (docs/changes/platform-agent-runner.md).
//
//   /api/agent-runner/worker/*   the Salt Basin agent worker (scripts/agent-worker.mjs): a worker token, no cookie.
//                                A rejected call is logged (release_reconciliation_events), never silent.
//   everything else              administrators only (cookie), the same functions the MCP tools call.
//
// Approve / promote / widen paths run assertReadyToFinalize inside the library function (userId is passed).
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { FinalizationBlockedError, sendFinalizationError } from '../lib/finalizationGates.js';
import * as runner from '../lib/agentRunner.js';

const router = Router();
const fail = (res, e) => {
  if (e instanceof FinalizationBlockedError) return sendFinalizationError(res, e);
  return res.status(e.status || 500).json({ error: e.message, code: e.code, gaps: e.gaps });
};
const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (e) { fail(res, e); } };
const actorOf = (req) => ({ id: req.user.id, label: req.user.name || req.user.email || `user ${req.user.id}` });
const num = (req, k = 'id') => Number(req.params[k]);

// ── worker protocol (bearer token) ───────────────────────────────────────────
async function requireWorker(req, res, next) {
  try {
    const m = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
    if (!m || !(await runner.authenticateWorker(m[1].trim()))) {
      await runner.logRejectedWorkerCall(m ? 'A worker call used a token that is not the current worker token' : 'A worker call carried no token', { path: req.path, ip: req.ip });
      return res.status(401).json({ error: 'The worker token was not accepted', code: 'bad_worker_token' });
    }
    req.workerId = String(req.get('x-worker-id') || 'worker').slice(0, 80);
    return next();
  } catch (e) { return fail(res, e); }
}
router.post('/worker/heartbeat', requireWorker, wrap(async (req, res) => { res.json(await runner.workerHeartbeat(req.workerId, req.body || {})); }));
router.post('/worker/claim', requireWorker, wrap(async (req, res) => { res.json((await runner.claimNextRun(req.workerId)) || {}); }));
router.post('/worker/runs/:id/events', requireWorker, wrap(async (req, res) => {
  res.json(await runner.appendEvents(num(req), req.workerId, req.body?.events, { workOrderVersion: req.body?.workOrderVersion }));
}));
router.post('/worker/runs/:id/scope-request', requireWorker, wrap(async (req, res) => { res.status(201).json(await runner.recordScopeRequest(num(req), req.workerId, req.body || {})); }));
router.post('/worker/runs/:id/complete', requireWorker, wrap(async (req, res) => { res.json(await runner.completeRun(num(req), req.workerId, req.body || {})); }));
router.get('/worker/runs/:id/git-credential', requireWorker, wrap(async (req, res) => { res.json(await runner.getGitCredential(num(req), req.workerId)); }));

// ── administrators ───────────────────────────────────────────────────────────
router.use(requireAdmin);

router.get('/overview', wrap(async (req, res) => { res.json(await runner.overview()); }));

router.get('/settings', wrap(async (req, res) => { res.json(await runner.settingsView()); }));
router.put('/settings', wrap(async (req, res) => { res.json(await runner.saveSettings(req.body || {}, actorOf(req))); }));
router.put('/settings/github-token', wrap(async (req, res) => { res.json(await runner.setGithubToken(req.body?.token, actorOf(req))); }));
router.delete('/settings/github-token', wrap(async (req, res) => { res.json(await runner.clearGithubToken(actorOf(req))); }));
router.post('/settings/worker-token', wrap(async (req, res) => { res.status(201).json(await runner.rotateWorkerToken(actorOf(req))); }));
router.get('/rejected-worker-calls', wrap(async (req, res) => { res.json({ calls: await runner.listRejectedWorkerCalls(20) }); }));

router.get('/agents', wrap(async (req, res) => { res.json({ agents: await runner.listAgents() }); }));
router.get('/agents/:key/prompt', wrap(async (req, res) => { res.json(await runner.getAgentPrompt(req.params.key)); }));

router.get('/runs', wrap(async (req, res) => {
  res.json({ runs: await runner.listRuns({ status: req.query.status || undefined, loopRunId: req.query.loopRunId || undefined, agentKey: req.query.agentKey || undefined, limit: req.query.limit }) });
}));
router.post('/runs', wrap(async (req, res) => { res.status(201).json(await runner.createRun(req.body || {}, actorOf(req))); }));
router.get('/runs/:id', wrap(async (req, res) => { res.json(await runner.getRun(num(req))); }));
router.post('/runs/:id/stop', wrap(async (req, res) => { res.json(await runner.stopRun(num(req), actorOf(req))); }));
router.post('/runs/:id/requeue', wrap(async (req, res) => { res.json(await runner.requeueRun(num(req), actorOf(req))); }));
router.post('/runs/:id/retry', wrap(async (req, res) => { res.status(201).json(await runner.retryRun(num(req), actorOf(req), { fixtureScenario: req.body?.fixtureScenario })); }));
router.post('/runs/:id/scope-requests/:rid/decision', wrap(async (req, res) => {
  res.json(await runner.decideScopeRequest(num(req), req.params.rid, req.body || {}, actorOf(req), req.user.id));
}));

router.get('/outputs', wrap(async (req, res) => { res.json({ outputs: await runner.listOutputs({ kind: req.query.kind || undefined, status: req.query.status || undefined, limit: req.query.limit }) }); }));
router.get('/outputs/:id', wrap(async (req, res) => { res.json(await runner.getOutput(num(req))); }));
router.post('/outputs/:id/decision', wrap(async (req, res) => { res.json(await runner.decideOutput(num(req), req.body || {}, actorOf(req), req.user.id)); }));
router.get('/outputs/:id/amendment', wrap(async (req, res) => { res.json(await runner.exportAmendment(num(req))); }));

router.get('/baselines', wrap(async (req, res) => { res.json({ baselines: await runner.listBaselines() }); }));
router.post('/test-plan', wrap(async (req, res) => {
  const files = Array.isArray(req.body?.changedFiles) ? req.body.changedFiles : String(req.body?.changedFiles ?? '').split(/[\n,]/);
  res.json(await runner.planTests(files));
}));

router.get('/seeds', wrap(async (req, res) => { res.json({ seeds: await runner.seeds.listSeeds({ stage: req.query.stage || undefined }) }); }));
router.post('/seeds', wrap(async (req, res) => { res.status(201).json(await runner.seeds.createSeed(req.body || {}, actorOf(req))); }));
router.get('/seeds/:id', wrap(async (req, res) => { res.json(await runner.seeds.getSeed(num(req))); }));
router.post('/seeds/:id/answer', wrap(async (req, res) => { res.json(await runner.seeds.answerQuestion(num(req), req.body?.index, req.body?.answer, actorOf(req))); }));
router.post('/seeds/:id/move', wrap(async (req, res) => {
  res.json(await runner.seeds.moveSeed(num(req), req.body?.to, { note: req.body?.note, actor: actorOf(req), userId: req.user.id }));
}));

export default router;
