// Agent Hub API — admin-only.
//
//   GET    /api/agent-hub/definitions            → list agent definitions
//   POST   /api/agent-hub/definitions             → create a definition
//   PATCH  /api/agent-hub/definitions/:id         → update a definition
//   DELETE /api/agent-hub/definitions/:id         → remove a definition
//   POST   /api/agent-hub/definitions/:id/run-now → trigger an immediate run
//
//   GET    /api/agent-hub/runs                    → list runs (?definitionId=)
//   GET    /api/agent-hub/runs/:id                → one run + its findings
//   PATCH  /api/agent-hub/findings/:id             → set a finding's status
import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { runByDefinitionId } from '../lib/agentHubRunner.js';
import { isValidCron } from '../lib/cronMatch.js';
import { getAgentLlmUsage } from '../lib/agentLlmUsage.js';
import { hydrateAgentStudioConfig, validateAgentStudioConfig } from '../lib/agentStudioGovernance.js';

const router = Router();
router.use(requireUser);

const KNOWN_KINDS = ['code_review', 'content_research', 'crystal_world_audit', 'lead_intake', 'internal_chat', 'workflow', 'coding', 'platform_config', 'ux', 'engine', 'ui_engine'];
const EXECUTION_MODES = ['interactive', 'scheduled', 'internal_chat'];
const SCOPE_TYPES = ['platform', 'organization', 'member'];

async function manageableScope(user, scopeType, scopeId) {
  if (user.role === 'admin') return true;
  if (scopeType === 'member') return Number(scopeId) === Number(user.id);
  if (scopeType !== 'organization' || !scopeId) return false;
  const row = await db.prepare(`SELECT 1 FROM org_memberships WHERE user_id=$1 AND org_id=$2 AND role IN ('admin','owner')`).get(user.id, scopeId);
  return !!row;
}

async function requireManageableDefinition(req, res) {
  const row = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE id=$1`).get(req.params.id);
  if (!row) { res.status(404).json({ error: 'not found' }); return null; }
  if (!(await manageableScope(req.user, row.scope_type, row.scope_id))) {
    res.status(403).json({ error: 'agent scope is not manageable by this user' }); return null;
  }
  return row;
}

async function ensureWorldAgents(user, scopeType, scopeId) {
  const now = Date.now();
  if (scopeType === 'member') {
    const templates = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE key IN ('member-personal-brand-staff','member-profile-builder-staff','career-world-bestystaff')`).all();
    for (const template of templates) {
      const config = typeof template.config === 'string' ? JSON.parse(template.config) : (template.config || {});
      delete config.templateDefinition;
      config.sourceTemplateKey = template.key;
      await db.prepare(`
        INSERT INTO agent_hub_definitions (key,label,description,kind,execution_mode,scope_type,scope_id,enabled,auto_branch,config,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,'member',$6,$7,false,$8,$9,$9) ON CONFLICT (key) DO NOTHING
      `).run(`member-${user.id}-${template.key}`, template.label, template.description, template.kind, template.execution_mode, user.id, template.enabled, config, now);
    }
  }
  if (scopeType === 'organization' && scopeId) {
    const org = await db.prepare(`SELECT name FROM organization_profiles WHERE id=$1`).get(scopeId);
    const source = await db.prepare(`SELECT config FROM agent_hub_definitions WHERE key='bestystaff-salt-basin'`).get();
    const config = typeof source?.config === 'string' ? JSON.parse(source.config) : structuredClone(source?.config || {});
    config.identity = { ...(config.identity || {}), name: `${org?.name || 'Organization'} Lead Agent`, organizationName: org?.name || 'Member Organization', ownerName: org?.name || 'Organization team' };
    config.deployment = { saltBasinSite: false, memberSubpage: true, externalEmbed: false };
    config.sourceTemplateKey = 'bestystaff-salt-basin';
    await db.prepare(`
      INSERT INTO agent_hub_definitions (key,public_key,label,description,kind,execution_mode,scope_type,scope_id,enabled,auto_branch,config,created_at,updated_at)
      VALUES ($1,$2,$3,$4,'lead_intake','interactive','organization',$5,false,false,$6,$7,$7) ON CONFLICT (key) DO NOTHING
    `).run(`org-${scopeId}-lead-intake`, `org-${scopeId}-lead-intake`, `${org?.name || 'Organization'} Lead Agent`, 'Organization-scoped conversational lead intake and routing.', scopeId, config, now);
  }
}

function rowToDefinition(r) {
  const rawConfig = typeof r.config === 'string' ? JSON.parse(r.config) : (r.config || {});
  return {
    id: Number(r.id),
    key: r.key,
    label: r.label,
    description: r.description,
    kind: r.kind,
    executionMode: r.execution_mode || 'scheduled',
    scopeType: r.scope_type || 'platform',
    scopeId: r.scope_id == null ? null : Number(r.scope_id),
    publicKey: r.public_key || null,
    scheduleCron: r.schedule_cron,
    enabled: !!r.enabled,
    autoBranch: !!r.auto_branch,
    config: rawConfig,
    governance: rawConfig.studioRole ? hydrateAgentStudioConfig(rawConfig) : null,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

function rowToRun(r) {
  return {
    id: Number(r.id),
    definitionId: Number(r.definition_id),
    definitionLabel: r.definition_label,
    status: r.status,
    trigger: r.trigger,
    startedAt: r.started_at ? Number(r.started_at) : null,
    finishedAt: r.finished_at ? Number(r.finished_at) : null,
    summary: r.summary,
    stats: typeof r.stats === 'string' ? JSON.parse(r.stats) : (r.stats || {}),
    branchName: r.branch_name,
    prUrl: r.pr_url,
    reportPath: r.report_path,
    codebaseFingerprint: r.codebase_fingerprint,
    error: r.error,
    createdAt: Number(r.created_at),
  };
}

function rowToFinding(r) {
  return {
    id: Number(r.id),
    runId: Number(r.run_id),
    category: r.category,
    severity: r.severity,
    filePath: r.file_path,
    line: r.line == null ? null : Number(r.line),
    title: r.title,
    detail: r.detail,
    status: r.status,
    createdAt: Number(r.created_at),
  };
}

router.get('/definitions', async (req, res) => {
  const requestedScope = ['platform','member','organization'].includes(req.query.scopeType) ? req.query.scopeType : (req.user.role === 'admin' ? 'platform' : 'member');
  const requestedScopeId = requestedScope === 'platform' ? null : requestedScope === 'member' ? req.user.id : Number(req.query.scopeId);
  if (!(await manageableScope(req.user, requestedScope, requestedScopeId))) return res.status(403).json({ error: 'agent world is not accessible to this user' });
  await ensureWorldAgents(req.user, requestedScope, requestedScopeId);
  const rows = requestedScope === 'platform'
    ? await db.prepare(`SELECT * FROM agent_hub_definitions WHERE scope_type='platform' AND COALESCE(config->>'templateDefinition','false') <> 'true' ORDER BY created_at ASC`).all()
    : await db.prepare(`SELECT * FROM agent_hub_definitions WHERE scope_type=$1 AND scope_id=$2 ORDER BY created_at ASC`).all(requestedScope, requestedScopeId);
  const definitions = await Promise.all(rows.map(async (row) => {
    const definition = rowToDefinition(row);
    const llm = definition.config?.llm;
    return { ...definition, llmUsage: llm?.required === false ? null : await getAgentLlmUsage(definition.id, llm || {}) };
  }));
  res.json({ definitions });
});

router.post('/definitions', async (req, res) => {
  const { key, label, description, kind, executionMode = 'interactive', scopeType: requestedScope, scopeId: requestedScopeId, publicKey, scheduleCron, enabled, autoBranch, config } = req.body || {};
  const scopeType = req.user.role === 'admin' ? (requestedScope || 'platform') : (requestedScope || 'member');
  const scopeId = scopeType === 'platform' ? null : (requestedScopeId || req.user.id);
  if (!key || !label) return res.status(400).json({ error: 'key and label are required' });
  if (kind && !KNOWN_KINDS.includes(kind)) return res.status(400).json({ error: `unknown kind "${kind}"` });
  if (!EXECUTION_MODES.includes(executionMode)) return res.status(400).json({ error: 'invalid executionMode' });
  if (!SCOPE_TYPES.includes(scopeType)) return res.status(400).json({ error: 'invalid scopeType' });
  if (!(await manageableScope(req.user, scopeType, scopeId))) return res.status(403).json({ error: 'agent scope is not manageable by this user' });
  if (scheduleCron && !isValidCron(scheduleCron)) return res.status(400).json({ error: 'scheduleCron is not a valid 5-field cron expression' });
  const studioErrors = validateAgentStudioConfig(config || {});
  if (studioErrors.length) return res.status(400).json({ error: studioErrors.join('; ') });

  const now = Date.now();
  try {
    const { lastInsertRowid } = await db.prepare(`
      INSERT INTO agent_hub_definitions (key, label, description, kind, execution_mode, scope_type, scope_id, public_key, schedule_cron, enabled, auto_branch, config, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
      RETURNING id
    `).run(
      key, label, description || null, kind || 'lead_intake', executionMode, scopeType, scopeId,
      publicKey || null, executionMode === 'scheduled' ? (scheduleCron || null) : null,
      !!enabled, !!autoBranch, config || {}, now
    );
    const row = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE id=$1`).get(lastInsertRowid);
    res.status(201).json({ definition: rowToDefinition(row) });
  } catch (e) {
    if (String(e.message).includes('duplicate key')) return res.status(409).json({ error: `key "${key}" already exists` });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/definitions/:id', async (req, res) => {
  const { label, description, executionMode, publicKey, scheduleCron, enabled, autoBranch, config } = req.body || {};
  if (scheduleCron !== undefined && scheduleCron !== null && !isValidCron(scheduleCron)) {
    return res.status(400).json({ error: 'scheduleCron is not a valid 5-field cron expression' });
  }
  const existing = await requireManageableDefinition(req, res);
  if (!existing) return;
  const studioErrors = validateAgentStudioConfig(config !== undefined ? config : (typeof existing.config === 'string' ? JSON.parse(existing.config) : existing.config));
  if (studioErrors.length) return res.status(400).json({ error: studioErrors.join('; ') });
  if (executionMode !== undefined && !EXECUTION_MODES.includes(executionMode)) return res.status(400).json({ error: 'invalid executionMode' });

  await db.prepare(`
    UPDATE agent_hub_definitions
    SET label=$1, description=$2, execution_mode=$3, public_key=$4, schedule_cron=$5, enabled=$6, auto_branch=$7, config=$8, updated_at=$9
    WHERE id=$10
  `).run(
    label ?? existing.label,
    description !== undefined ? description : existing.description,
    executionMode !== undefined ? executionMode : existing.execution_mode,
    publicKey !== undefined ? (publicKey || null) : existing.public_key,
    scheduleCron !== undefined ? (scheduleCron || null) : existing.schedule_cron,
    enabled !== undefined ? !!enabled : existing.enabled,
    autoBranch !== undefined ? !!autoBranch : existing.auto_branch,
    config !== undefined ? config : (typeof existing.config === 'string' ? JSON.parse(existing.config) : existing.config),
    Date.now(),
    req.params.id
  );
  const row = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE id=$1`).get(req.params.id);
  res.json({ definition: rowToDefinition(row) });
});

router.delete('/definitions/:id', async (req, res) => {
  const existing = await requireManageableDefinition(req, res);
  if (!existing) return;
  await db.prepare(`DELETE FROM agent_hub_definitions WHERE id=$1`).run(req.params.id);
  res.json({ ok: true });
});

router.post('/definitions/:id/run-now', async (req, res) => {
  const existing = await requireManageableDefinition(req, res);
  if (!existing) return;
  if (existing.execution_mode !== 'scheduled') return res.status(400).json({ error: 'interactive agents respond to conversations and cannot be run on a schedule' });
  try {
    // configOverride lets a caller (e.g. a future Topic-level "run research
    // for this topic" action) override this agent's default config for a
    // single run — same default/override seam used elsewhere in the
    // Channel Journey substrate, without a Topic table needing to exist yet.
    const configOverride = req.body?.configOverride && typeof req.body.configOverride === 'object' ? req.body.configOverride : undefined;
    const result = await runByDefinitionId(req.params.id, { trigger: 'manual', configOverride });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/runs', async (req, res) => {
  const { definitionId } = req.query;
  const rows = definitionId
    ? await db.prepare(`
        SELECT r.*, d.label AS definition_label FROM agent_hub_runs r
        JOIN agent_hub_definitions d ON d.id = r.definition_id
        WHERE r.definition_id = $1 ORDER BY r.id DESC LIMIT 100
      `).all(definitionId)
    : await db.prepare(`
        SELECT r.*, d.label AS definition_label FROM agent_hub_runs r
        JOIN agent_hub_definitions d ON d.id = r.definition_id
        ORDER BY r.id DESC LIMIT 100
      `).all();
  res.json({ runs: rows.map(rowToRun) });
});

router.get('/runs/:id', async (req, res) => {
  const row = await db.prepare(`
    SELECT r.*, d.label AS definition_label FROM agent_hub_runs r
    JOIN agent_hub_definitions d ON d.id = r.definition_id
    WHERE r.id = $1
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const findings = await db.prepare(`SELECT * FROM agent_hub_run_findings WHERE run_id=$1 ORDER BY severity DESC, id ASC`).all(req.params.id);
  res.json({ run: rowToRun(row), findings: findings.map(rowToFinding) });
});

router.patch('/findings/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['open', 'addressed', 'dismissed'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  await db.prepare(`UPDATE agent_hub_run_findings SET status=$1 WHERE id=$2`).run(status, req.params.id);
  const row = await db.prepare(`SELECT * FROM agent_hub_run_findings WHERE id=$1`).get(req.params.id);
  res.json({ finding: rowToFinding(row) });
});

export default router;
