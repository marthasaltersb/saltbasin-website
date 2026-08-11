import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { ensureBacklogIntelligenceSchema } from '../lib/backlogIntelligenceSchema.js';

const router = Router();
router.use(requireAdmin);
router.use(async (_req, _res, next) => { try { await ensureBacklogIntelligenceSchema(); next(); } catch (error) { next(error); } });
const id = (prefix) => `${prefix}.${crypto.randomUUID()}`;

router.get('/', async (_req, res) => {
  const rows = await db.prepare(`SELECT p.*,d.environment,d.git_sha,d.deployed_at FROM backlog_output_publications p LEFT JOIN backlog_deployments d ON d.id=p.deployment_id ORDER BY p.updated_at DESC LIMIT 100`).all();
  res.json({ publications: rows });
});

router.post('/generate', async (req, res) => {
  const deploymentId = Number(req.body?.deploymentId);
  const outputType = req.body?.outputType || 'build_intelligence_report';
  const deployment = await db.prepare(`SELECT * FROM backlog_deployments WHERE id=$1`).get(deploymentId);
  if (!deployment) return res.status(404).json({ error: 'deployment not found' });
  const items = await db.prepare(`SELECT b.*,di.change_type,di.production_confirmed FROM backlog_deployment_items di JOIN backlog_items b ON b.id=di.backlog_item_id WHERE di.deployment_id=$1 ORDER BY b.id`).all(deploymentId);
  const itemIds = items.map((item) => Number(item.id));
  const components = itemIds.length ? await db.prepare(`SELECT * FROM backlog_components WHERE backlog_item_id=ANY($1::bigint[]) ORDER BY backlog_item_id,file_path`).all(itemIds) : [];
  const knowledge = itemIds.length ? await db.prepare(`SELECT * FROM agent_knowledge_records WHERE backlog_item_id=ANY($1::bigint[]) AND status<>'rejected' ORDER BY record_type,created_at`).all(itemIds) : [];
  const contributions = itemIds.length ? await db.prepare(`SELECT backlog_item_id,contributor_type,SUM(allocated_active_minutes)/60.0 hours FROM backlog_contribution_links WHERE backlog_item_id=ANY($1::bigint[]) GROUP BY backlog_item_id,contributor_type`).all(itemIds) : [];
  const tests = itemIds.length ? await db.prepare(`SELECT f.backlog_item_id,s.id scenario_id,s.title,r.overall_result,r.run_at FROM test_scenario_features f JOIN test_scenarios s ON s.id=f.scenario_id LEFT JOIN LATERAL (SELECT * FROM test_runs tr WHERE tr.scenario_id=s.id ORDER BY tr.run_at DESC LIMIT 1) r ON true WHERE f.backlog_item_id=ANY($1::bigint[])`).all(itemIds) : [];
  const workarounds = await db.prepare(`SELECT * FROM tier_workarounds ORDER BY created_at`).all();
  const content = {
    title: `Salt Basin Build Intelligence · ${deployment.environment} · ${new Date(Number(deployment.deployed_at || Date.now())).toLocaleDateString('en-US')}`,
    deployment: { id: deploymentId, environment: deployment.environment, gitSha: deployment.git_sha, deployedAt: deployment.deployed_at, productionCurrent: !!deployment.is_current },
    executiveSummary: `${items.length} backlog item(s) and ${components.length} mapped component(s) are represented in this deployment.`,
    timeline: items.map((item) => ({ backlogItemId: Number(item.id), capabilityId: item.capability_id ? Number(item.capability_id) : null, title: item.title, createdAt: Number(item.created_at), updatedAt: Number(item.updated_at), deployedAt: deployment.deployed_at })),
    architecture: components.map((component) => ({ backlogItemId: Number(component.backlog_item_id), surface: component.runtime_surface, build: component.build_name, folder: component.folder_path, file: component.file_path })),
    requirements: items.map((item) => ({ id: Number(item.id), title: item.title, businessProblem: item.summary, requirement: item.requirement_detail, rules: item.business_rules, design: item.design_definition, productionState: item.production_state })),
    decisions: knowledge.filter((row) => row.record_type === 'decision'),
    lessons: knowledge.filter((row) => row.record_type === 'lesson'),
    businessRules: knowledge.filter((row) => row.record_type === 'business_rule'),
    contributionIntelligence: contributions,
    tests,
    avoidedCosts: workarounds,
    functionalAgentSpecification: { contextProfiles: true, providers: ['openai', 'anthropic'], approvalRequiredForRepositoryExecution: true, promotionRequiresPassingScenarios: true },
  };
  const now = Date.now();
  const outputId = id('output');
  await db.prepare(`INSERT INTO unified_outputs (id,app_id,title,purpose,template_ref,source_item_ids,config,export_status,created_by,updated_at,output_type,template_config) VALUES ($1,'app.herq',$2,$3,$4,$5,$6::jsonb,'draft',$7,$8,$9,$10::jsonb)`).run(outputId, content.title, 'Post-deployment architecture, capability, contribution, decision, lesson, cost, and QA record.', req.body?.herqTemplateRef || null, itemIds.map(String), { deploymentId, reviewRequired: true }, req.user.id, now, outputType, { blocks: content, groupingRules: req.body?.groupingRules || {}, visualRules: req.body?.visualRules || {} });
  const publication = await db.prepare(`INSERT INTO backlog_output_publications (deployment_id,output_type,herq_template_ref,configuration,generated_content,status,review_user_id,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,'review',$6,$7,$7) RETURNING id`).get(deploymentId, outputType, req.body?.herqTemplateRef || null, { unifiedOutputId: outputId, groupingRules: req.body?.groupingRules || {}, visualRules: req.body?.visualRules || {} }, content, req.user.id, now);
  res.status(201).json({ publicationId: Number(publication.id), unifiedOutputId: outputId, status: 'review', content });
});

router.patch('/:id', async (req, res) => {
  const current = await db.prepare(`SELECT * FROM backlog_output_publications WHERE id=$1`).get(req.params.id);
  if (!current) return res.status(404).json({ error: 'not found' });
  const allowed = ['review', 'approved', 'published', 'rejected'];
  if (req.body?.status && !allowed.includes(req.body.status)) return res.status(400).json({ error: 'invalid status' });
  await db.prepare(`UPDATE backlog_output_publications SET configuration=COALESCE($1::jsonb,configuration),generated_content=COALESCE($2::jsonb,generated_content),status=COALESCE($3,status),published_at=CASE WHEN $3='published' THEN $4 ELSE published_at END,updated_at=$4 WHERE id=$5`).run(req.body?.configuration ?? null, req.body?.generatedContent ?? null, req.body?.status ?? null, Date.now(), current.id);
  res.json({ ok: true });
});

router.post('/:id/image-jobs', async (req, res) => {
  const publication = await db.prepare(`SELECT id FROM backlog_output_publications WHERE id=$1`).get(req.params.id);
  if (!publication) return res.status(404).json({ error: 'publication not found' });
  if (!req.body?.scenarioPrompt) return res.status(400).json({ error: 'scenarioPrompt is required' });
  const brand = await db.prepare(`SELECT * FROM backlog_output_rule_configs WHERE config_key=$1 AND is_active=true`).get(req.body?.brandConfigKey || 'salt-basin-default');
  const now = Date.now();
  const job = await db.prepare(`INSERT INTO backlog_output_image_jobs (publication_id,scenario_prompt,provider,model,source_asset_urls,logo_asset_ref,copyright_text,status,provenance,created_by,created_at,updated_at) VALUES ($1,$2,'openai',$3,$4::jsonb,$5,$6,'queued',$7::jsonb,$8,$9,$9) RETURNING id`).get(publication.id, req.body.scenarioPrompt, process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5', req.body.sourceAssetUrls || [], brand?.brand_profile?.logoAssetRef || req.body.logoAssetRef || null, req.body.copyrightText || `© ${new Date().getFullYear()} Salt Basin Net Works`, { userPrompt: req.body.scenarioPrompt, brandConfigKey: req.body?.brandConfigKey || 'salt-basin-default', overlayRequired: true, position: 'bottom-right' }, req.user.id, now);
  res.status(201).json({ imageJobId: Number(job.id), status: 'queued', note: 'Generation and deterministic logo/copyright composition run as separate auditable steps.' });
});

export default router;

