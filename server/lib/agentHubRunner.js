// Agent Hub orchestration: creates the agent_hub_runs row, dispatches to the
// agent-kind handler, persists findings + stats, and emits the completion
// notification/task via notificationEngine. New agent kinds register here —
// nothing else in the request path needs to change to add one.
//
// stats/config are JSONB columns — always pass the raw object, never
// JSON.stringify() it (see the "jsonb param convention" note atop db.js).
import { db } from '../db.js';
import * as codeReviewAgent from './agents/codeReviewAgent.js';
import * as contentResearchAgent from './agents/contentResearchAgent.js';
import * as crystalWorldAuditAgent from './agents/crystalWorldAuditAgent.js';
import { emitEvent } from './notificationEngine.js';

const AGENT_KINDS = {
  code_review: codeReviewAgent,
  content_research: contentResearchAgent,
  crystal_world_audit: crystalWorldAuditAgent,
};

export async function runDefinition(definition, { trigger = 'manual', configOverride } = {}) {
  const startedAt = Date.now();
  const { lastInsertRowid: runId } = await db.prepare(`
    INSERT INTO agent_hub_runs (definition_id, status, trigger, started_at)
    VALUES ($1, 'running', $2, $3)
    RETURNING id
  `).run(definition.id, trigger, startedAt);

  const handler = AGENT_KINDS[definition.kind];
  if (!handler) {
    await db.prepare(`UPDATE agent_hub_runs SET status='failed', finished_at=$1, error=$2 WHERE id=$3`)
      .run(Date.now(), `Unknown agent kind "${definition.kind}"`, runId);
    return { runId: Number(runId), status: 'failed' };
  }

  try {
    const result = await handler.run(definition, { runId: Number(runId), configOverride });

    await db.prepare(`
      UPDATE agent_hub_runs
      SET status='completed', finished_at=$1, summary=$2, stats=$3, branch_name=$4, pr_url=$5,
          report_path=$6, codebase_fingerprint=$7
      WHERE id=$8
    `).run(
      Date.now(),
      result.summary || null,
      result.stats || {},
      result.branchName || null,
      result.prUrl || null,
      result.reportPath || null,
      result.fingerprint || null,
      runId
    );

    for (const finding of result.findings || []) {
      await db.prepare(`
        INSERT INTO agent_hub_run_findings (run_id, category, severity, file_path, line, title, detail)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `).run(
        runId, finding.category, finding.severity || 'medium',
        finding.filePath || null, finding.line || null, finding.title, finding.detail || null
      );
    }

    const hasHigh = (result.findings || []).some((f) => f.severity === 'high');
    await emitEvent({
      sourceType: 'agent_hub_run',
      sourceId: Number(runId),
      notifyRole: 'admin',
      actionUrl: `/admin?tab=agent-hub-outputs&run=${runId}`,
      vars: { label: definition.label, status: 'completed' },
      severity: hasHigh ? 'warning' : 'info',
      body: result.summary || null,
    });

    return { runId: Number(runId), status: 'completed', ...result };
  } catch (err) {
    const message = String(err?.message || err);
    await db.prepare(`UPDATE agent_hub_runs SET status='failed', finished_at=$1, error=$2 WHERE id=$3`)
      .run(Date.now(), message, runId);

    await emitEvent({
      sourceType: 'agent_hub_run',
      sourceId: Number(runId),
      notifyRole: 'admin',
      actionUrl: `/admin?tab=agent-hub-outputs&run=${runId}`,
      vars: { label: definition.label, status: 'failed' },
      severity: 'danger',
      body: message,
    });

    return { runId: Number(runId), status: 'failed', error: message };
  }
}

function parseDefinition(row) {
  return { ...row, config: typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {}) };
}

export async function runByDefinitionId(definitionId, opts) {
  const row = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE id=$1`).get(definitionId);
  if (!row) throw new Error('Agent definition not found');
  return runDefinition(parseDefinition(row), opts);
}

export async function runDueDefinitions(isDueFn) {
  const rows = await db.prepare(`SELECT * FROM agent_hub_definitions WHERE enabled = TRUE`).all();
  const results = [];
  for (const row of rows) {
    if (!row.schedule_cron || !isDueFn(row.schedule_cron)) continue;
    results.push(await runDefinition(parseDefinition(row), { trigger: 'schedule' }));
  }
  return results;
}
