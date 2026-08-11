import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { ensureBacklogIntelligenceSchema } from '../lib/backlogIntelligenceSchema.js';

const router = Router();

function safeEqual(a, b) {
  const left = Buffer.from(String(a || '')), right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}
async function authorize(req, res, next) {
  const webhookSecret = process.env.GITHUB_DEPLOYMENT_WEBHOOK_SECRET;
  if (webhookSecret && safeEqual(req.get('x-saltbasin-deployment-secret'), webhookSecret)) { req.deploymentActor = 'github'; return next(); }
  return requireAdmin(req, res, next);
}
router.use(authorize);
router.use(async (_req, _res, next) => { try { await ensureBacklogIntelligenceSchema(); next(); } catch (error) { next(error); } });

router.post('/github', async (req, res) => {
  const { environment, environmentSlug, gitSha, gitRef, deploymentRef, status = 'deployed', changedFiles = [], deployedAt = Date.now(), metadata = {} } = req.body || {};
  if (!environment || !gitSha) return res.status(400).json({ error: 'environment and gitSha are required' });
  const now = Date.now();
  const deployment = await db.prepare(`INSERT INTO backlog_deployments (environment,environment_slug,git_sha,git_ref,provider,deployment_ref,deployed_at,status,is_current,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,'github',$5,$6,$7,true,$8::jsonb,$9,$9) RETURNING id`).get(environment, environmentSlug || null, gitSha, gitRef || null, deploymentRef || null, deployedAt, status, metadata, now);
  await db.prepare(`UPDATE backlog_deployments SET is_current=false,updated_at=$1 WHERE environment=$2 AND id<>$3`).run(now, environment, deployment.id);
  const components = changedFiles.length ? await db.prepare(`SELECT * FROM backlog_components WHERE file_path = ANY($1::text[]) OR folder_path = ANY($1::text[])`).all(changedFiles) : [];
  const itemIds = [...new Set(components.map((c) => Number(c.backlog_item_id)))];
  for (const component of components) {
    await db.prepare(`INSERT INTO backlog_deployment_components (deployment_id,component_id,deployed_at,is_current) VALUES ($1,$2,$3,true) ON CONFLICT (deployment_id,component_id) DO UPDATE SET deployed_at=EXCLUDED.deployed_at,is_current=true`).run(deployment.id, component.id, deployedAt);
  }
  for (const itemId of itemIds) {
    await db.prepare(`INSERT INTO backlog_deployment_items (deployment_id,backlog_item_id,change_type,requires_redeployment,production_confirmed) VALUES ($1,$2,'component_change',true,$3) ON CONFLICT (deployment_id,backlog_item_id) DO UPDATE SET production_confirmed=EXCLUDED.production_confirmed`).run(deployment.id, itemId, environment === 'production' && status === 'deployed');
    if (environment === 'production' && status === 'deployed') await db.prepare(`UPDATE backlog_items SET deployed_github=true,status='deployed',production_state=$1::jsonb,updated_at=$2 WHERE id=$3`).run({ gitSha, deploymentId: Number(deployment.id), deployedAt, environment }, now, itemId);
  }
  res.status(201).json({ deploymentId: Number(deployment.id), mappedComponents: components.length, mappedBacklogItems: itemIds });
});

router.post('/:id/evaluate-promotion', async (req, res) => {
  const deployment = await db.prepare(`SELECT * FROM backlog_deployments WHERE id=$1`).get(req.params.id);
  if (!deployment) return res.status(404).json({ error: 'deployment not found' });
  const target = req.body?.toEnvironment || (deployment.environment === 'sandbox' ? 'test' : 'production');
  const scenarios = await db.prepare(`SELECT DISTINCT s.id,s.title,s.required_for_promotion FROM backlog_deployment_items di JOIN test_scenario_features f ON f.backlog_item_id=di.backlog_item_id JOIN test_scenarios s ON s.id=f.scenario_id WHERE di.deployment_id=$1 AND s.required_for_promotion=true`).all(deployment.id);
  const results = [];
  for (const scenario of scenarios) {
    const latest = await db.prepare(`SELECT * FROM test_runs WHERE scenario_id=$1 AND (deployment_id=$2 OR deployment_id IS NULL) ORDER BY run_at DESC LIMIT 1`).get(scenario.id, deployment.id);
    results.push({ scenarioId: Number(scenario.id), title: scenario.title, status: latest?.overall_result || 'missing', runId: latest ? Number(latest.id) : null });
  }
  const passed = results.filter((r) => r.status === 'pass').length;
  const pct = results.length ? Math.round(passed / results.length * 100) : 0;
  const status = results.length > 0 && pct === 100 ? 'eligible' : 'blocked';
  const now = Date.now();
  const gate = await db.prepare(`INSERT INTO backlog_promotion_gates (deployment_id,from_environment,to_environment,required_pass_pct,status,evaluation,evaluated_at,approved_by,created_at,updated_at) VALUES ($1,$2,$3,100,$4,$5::jsonb,$6,$7,$6,$6) RETURNING id`).get(deployment.id, deployment.environment, target, status, { scenarios: results, passPct: pct }, now, req.user?.id || null);
  res.json({ gateId: Number(gate.id), status, passPct: pct, scenarios: results, promotionAuthorized: status === 'eligible' });
});

router.post('/:id/promote-production', async (req, res) => {
  if (req.deploymentActor === 'github') return res.status(403).json({ error: 'Human admin approval is required for production promotion.' });
  if (req.body?.confirmation !== 'PROMOTE TO PRODUCTION') return res.status(400).json({ error: 'confirmation must equal PROMOTE TO PRODUCTION' });
  const deployment = await db.prepare(`SELECT * FROM backlog_deployments WHERE id=$1`).get(req.params.id);
  if (!deployment) return res.status(404).json({ error: 'deployment not found' });
  const gate = await db.prepare(`SELECT * FROM backlog_promotion_gates WHERE deployment_id=$1 AND to_environment='production' ORDER BY evaluated_at DESC LIMIT 1`).get(deployment.id);
  if (!gate || gate.status !== 'eligible') return res.status(409).json({ error: 'The latest production promotion gate is not eligible.' });
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || 'marthasaltersb/saltbasin-website';
  const workflow = process.env.PRODUCTION_PROMOTION_WORKFLOW || 'promote-production.yml';
  if (!token) return res.status(503).json({ error: 'GITHUB_ACTIONS_TOKEN is not configured.' });
  const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'content-type': 'application/json' },
    body: JSON.stringify({ ref: req.body?.ref || deployment.git_ref || 'main', inputs: { source_deployment_id: String(deployment.id), promotion_gate_id: String(gate.id), git_sha: deployment.git_sha, requested_by_user_id: String(req.user.id) } }),
  });
  if (!response.ok) return res.status(502).json({ error: `GitHub workflow dispatch failed (${response.status})`, detail: await response.text() });
  const payload = await response.json().catch(() => ({}));
  const evaluation = typeof gate.evaluation === 'string' ? JSON.parse(gate.evaluation) : (gate.evaluation || {});
  await db.prepare(`UPDATE backlog_promotion_gates SET status='dispatched',evaluation=$1::jsonb,approved_by=$2,updated_at=$3 WHERE id=$4`).run({ ...evaluation, workflow, repository, dispatchedAt: Date.now(), github: payload }, req.user.id, Date.now(), gate.id);
  res.status(202).json({ ok: true, status: 'dispatched', workflow, repository, github: payload });
});

export default router;
