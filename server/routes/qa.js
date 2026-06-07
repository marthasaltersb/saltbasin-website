// QA: test scenarios, scripts, runs, defects.
//
// Admin-only. Surface area:
//
//   Scenarios
//     GET    /api/qa/scenarios                         → list (filters: capabilityId, backlogItemId)
//     GET    /api/qa/scenarios/:id                     → scenario + ordered steps + latest run
//     POST   /api/qa/scenarios                         → create (with optional inline steps)
//     PATCH  /api/qa/scenarios/:id                     → update (supports optimistic concurrency via expectedUpdatedAt)
//     DELETE /api/qa/scenarios/:id                     → hard delete (cascades to steps + runs)
//
//   Steps
//     POST   /api/qa/scenarios/:scenarioId/steps       → append a step (auto-orders to end if stepOrder omitted)
//     PATCH  /api/qa/steps/:id
//     DELETE /api/qa/steps/:id
//
//   Runs
//     POST   /api/qa/runs                              → log a run with per-step results; auto-creates defects for failed steps
//     GET    /api/qa/runs?scenarioId=...               → recent runs (newest first, capped 100)
//     GET    /api/qa/runs/:id                          → run + per-step results
//
//   Defects
//     GET    /api/qa/defects                           → convenience: backlog_items WHERE kind='defect'
//
// Every mutation writes through writeAudit() with source='manual_ui'. The
// brain-dump reconciler will reuse these same endpoints with source='brain_dump'
// and the optimistic concurrency check on PATCH guards against stale overwrites.

import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { writeAudit, snapshotRow, diffRows } from '../audit.js';

const router = Router();
router.use(requireAdmin);

// ── row mappers (snake_case → camelCase, parse Number ids) ──
function rowToScenario(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    backlogItemId: r.backlog_item_id ? Number(r.backlog_item_id) : null,
    capabilityId: r.capability_id ? Number(r.capability_id) : null,
    title: r.title,
    summary: r.summary,
    preconditions: r.preconditions,
    environmentScope: r.environment_scope,
    priority: r.priority,
    sortOrder: Number(r.sort_order || 0),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

function rowToStep(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    scenarioId: Number(r.scenario_id),
    stepOrder: Number(r.step_order),
    action: r.action,
    expectedOutcome: r.expected_outcome,
    createdAt: Number(r.created_at),
  };
}

function rowToRun(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    scenarioId: Number(r.scenario_id),
    testerUserId: r.tester_user_id ? Number(r.tester_user_id) : null,
    environment: r.environment,
    overallResult: r.overall_result,
    notes: r.notes,
    runAt: Number(r.run_at),
  };
}

function rowToStepResult(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    runId: Number(r.run_id),
    stepId: Number(r.step_id),
    result: r.result,
    notes: r.notes,
    evidenceUrl: r.evidence_url,
    defectBacklogItemId: r.defect_backlog_item_id ? Number(r.defect_backlog_item_id) : null,
    createdAt: Number(r.created_at),
  };
}

const SCENARIO_FIELD_MAP = {
  backlogItemId: 'backlog_item_id',
  capabilityId: 'capability_id',
  title: 'title',
  summary: 'summary',
  preconditions: 'preconditions',
  environmentScope: 'environment_scope',
  priority: 'priority',
  sortOrder: 'sort_order',
};

const STEP_FIELD_MAP = {
  action: 'action',
  expectedOutcome: 'expected_outcome',
  stepOrder: 'step_order',
};

// ──────────────────────── Scenarios ────────────────────────
router.get('/scenarios', async (req, res) => {
  const { capabilityId, backlogItemId } = req.query;
  let query = `SELECT * FROM test_scenarios`;
  const params = [];
  const where = [];
  if (capabilityId) {
    where.push(`capability_id = $${params.length + 1}`);
    params.push(Number(capabilityId));
  }
  if (backlogItemId) {
    where.push(`backlog_item_id = $${params.length + 1}`);
    params.push(Number(backlogItemId));
  }
  if (where.length) query += ` WHERE ${where.join(' AND ')}`;
  query += ` ORDER BY sort_order, id`;
  const rows = await db.prepare(query).all(...params);
  res.json({ scenarios: rows.map(rowToScenario) });
});

router.get('/scenarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const scenario = await db.prepare(`SELECT * FROM test_scenarios WHERE id = $1`).get(id);
  if (!scenario) return res.status(404).json({ error: 'not found' });
  const steps = await db
    .prepare(`SELECT * FROM test_scenario_steps WHERE scenario_id = $1 ORDER BY step_order, id`)
    .all(id);
  const latestRun = await db
    .prepare(`SELECT * FROM test_runs WHERE scenario_id = $1 ORDER BY run_at DESC LIMIT 1`)
    .get(id);
  const features = await db
    .prepare(
      `SELECT backlog_item_id, is_primary, sort_order
         FROM test_scenario_features
        WHERE scenario_id = $1
        ORDER BY is_primary DESC, sort_order, backlog_item_id`
    )
    .all(id);
  res.json({
    scenario: rowToScenario(scenario),
    steps: steps.map(rowToStep),
    latestRun: rowToRun(latestRun),
    features: features.map((f) => ({
      backlogItemId: Number(f.backlog_item_id),
      isPrimary: !!f.is_primary,
      sortOrder: Number(f.sort_order || 0),
    })),
  });
});

// Internal helper: replace the junction rows for a scenario with the given
// feature ids. Mirrors a set-replace semantics so callers can pass exactly
// what they want, no need to diff.
async function replaceScenarioFeatures(scenarioId, featureIds, primaryId) {
  // Idempotent: drop existing then re-insert in one transaction-ish flow.
  // Postgres handles concurrent edits via the optimistic concurrency check
  // upstream (see PATCH /scenarios/:id).
  await db.prepare(`DELETE FROM test_scenario_features WHERE scenario_id = $1`).run(scenarioId);
  let sortOrder = 0;
  for (const fid of featureIds) {
    const isPrimary = primaryId != null && Number(fid) === Number(primaryId);
    await db
      .prepare(
        `INSERT INTO test_scenario_features (scenario_id, backlog_item_id, is_primary, sort_order)
         VALUES ($1, $2, $3, $4)`
      )
      .run(scenarioId, Number(fid), isPrimary, sortOrder++);
  }
}

router.post('/scenarios', async (req, res) => {
  const { title, steps = [], featureBacklogItemIds = [], primaryBacklogItemId = null } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });

  // Backward-compat: if caller passed legacy backlogItemId and no multi-select
  // list, treat it as a single primary feature.
  let featureIds = Array.from(new Set((featureBacklogItemIds || []).map((n) => Number(n)).filter(Boolean)));
  let primaryId = primaryBacklogItemId != null ? Number(primaryBacklogItemId) : null;
  if (featureIds.length === 0 && req.body.backlogItemId) {
    featureIds = [Number(req.body.backlogItemId)];
    primaryId = Number(req.body.backlogItemId);
  }
  // If features were chosen but no primary specified, default to the first.
  if (featureIds.length > 0 && primaryId == null) primaryId = featureIds[0];
  // Denormalize primary onto test_scenarios.backlog_item_id so defect creation
  // can use it directly without a junction lookup.
  const denormalizedPrimary = primaryId;

  const cols = ['title'];
  const placeholders = ['$1'];
  const vals = [title];
  let i = 2;
  for (const [camel, snake] of Object.entries(SCENARIO_FIELD_MAP)) {
    if (camel === 'title') continue;
    if (camel === 'backlogItemId') continue; // handled via denormalized primary below
    if (req.body[camel] !== undefined) {
      cols.push(snake);
      placeholders.push(`$${i++}`);
      vals.push(req.body[camel]);
    }
  }
  if (denormalizedPrimary != null) {
    cols.push('backlog_item_id');
    placeholders.push(`$${i++}`);
    vals.push(denormalizedPrimary);
  }
  const result = await db
    .prepare(
      `INSERT INTO test_scenarios (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`
    )
    .run(...vals);
  const scenarioId = Number(result.lastInsertRowid);

  if (featureIds.length) {
    await replaceScenarioFeatures(scenarioId, featureIds, primaryId);
  }

  const after = await snapshotRow('test_scenarios', scenarioId);
  await writeAudit({
    userId: req.user.id,
    entityType: 'test_scenario',
    entityId: scenarioId,
    action: 'create',
    afterValue: { ...after, featureIds, primaryFeatureId: primaryId },
    source: req.body._source || 'manual_ui',
    reason: req.body._reason || null,
  });

  // Inline steps — write each + audit each.
  let stepOrder = 1;
  const insertedSteps = [];
  for (const step of steps) {
    if (!step.action || !step.expectedOutcome) continue;
    const sr = await db
      .prepare(
        `INSERT INTO test_scenario_steps (scenario_id, step_order, action, expected_outcome)
         VALUES ($1, $2, $3, $4) RETURNING id`
      )
      .run(scenarioId, step.stepOrder ?? stepOrder, step.action, step.expectedOutcome);
    const newStepId = Number(sr.lastInsertRowid);
    insertedSteps.push(newStepId);
    await writeAudit({
      userId: req.user.id,
      entityType: 'test_scenario_step',
      entityId: newStepId,
      action: 'create',
      afterValue: {
        scenarioId,
        stepOrder: step.stepOrder ?? stepOrder,
        action: step.action,
        expectedOutcome: step.expectedOutcome,
      },
      source: req.body._source || 'manual_ui',
    });
    stepOrder++;
  }

  res.json({ id: scenarioId, stepIds: insertedSteps });
});

router.patch('/scenarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const before = await snapshotRow('test_scenarios', id);
  if (!before) return res.status(404).json({ error: 'not found' });

  // Optimistic concurrency: if caller asserts a version stamp, reject stale.
  if (req.body.expectedUpdatedAt !== undefined) {
    if (Number(req.body.expectedUpdatedAt) !== Number(before.updated_at)) {
      return res.status(409).json({ error: 'stale', current: rowToScenario(before) });
    }
  }

  // Feature list update? If the caller passed featureBacklogItemIds we
  // replace the junction (and update the denormalized primary on test_scenarios
  // below via the SCENARIO_FIELD_MAP loop using the synthetic backlogItemId).
  let featuresUpdated = false;
  if (Array.isArray(req.body.featureBacklogItemIds)) {
    const featureIds = Array.from(new Set(req.body.featureBacklogItemIds.map((n) => Number(n)).filter(Boolean)));
    let primaryId = req.body.primaryBacklogItemId != null ? Number(req.body.primaryBacklogItemId) : null;
    if (featureIds.length > 0 && (primaryId == null || !featureIds.includes(primaryId))) {
      primaryId = featureIds[0];
    }
    await replaceScenarioFeatures(id, featureIds, primaryId);
    // Sync the denormalized cache so defect creation continues to work.
    req.body.backlogItemId = primaryId;
    featuresUpdated = true;
  }

  const sets = [];
  const vals = [];
  let i = 1;
  for (const [camel, snake] of Object.entries(SCENARIO_FIELD_MAP)) {
    if (req.body[camel] !== undefined) {
      sets.push(`${snake} = $${i++}`);
      vals.push(req.body[camel]);
    }
  }
  if (!sets.length && !featuresUpdated) return res.json({ ok: true, noop: true });
  // Always bump updated_at when anything changed (field edits OR features-only)
  // so the next optimistic concurrency check sees a fresh version stamp.
  sets.push(`updated_at = $${i++}`);
  vals.push(Date.now());
  vals.push(id);
  await db.prepare(`UPDATE test_scenarios SET ${sets.join(', ')} WHERE id = $${i}`).run(...vals);

  const after = await snapshotRow('test_scenarios', id);
  if (diffRows(before, after)) {
    await writeAudit({
      userId: req.user.id,
      entityType: 'test_scenario',
      entityId: id,
      action: 'update',
      beforeValue: before,
      afterValue: after,
      source: req.body._source || 'manual_ui',
      reason: req.body._reason || null,
    });
  }
  res.json({ ok: true, updatedAt: Number(after.updated_at) });
});

router.delete('/scenarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const before = await snapshotRow('test_scenarios', id);
  if (!before) return res.status(404).json({ error: 'not found' });
  await db.prepare(`DELETE FROM test_scenarios WHERE id = $1`).run(id);
  await writeAudit({
    userId: req.user.id,
    entityType: 'test_scenario',
    entityId: id,
    action: 'delete',
    beforeValue: before,
    source: 'manual_ui',
  });
  res.json({ ok: true });
});

// ──────────────────────── Steps ────────────────────────
router.post('/scenarios/:scenarioId/steps', async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const { action, expectedOutcome, stepOrder } = req.body || {};
  if (!action || !expectedOutcome) {
    return res.status(400).json({ error: 'action and expectedOutcome required' });
  }
  // Auto-position at end if unspecified.
  let order = stepOrder;
  if (order == null) {
    const max = await db
      .prepare(`SELECT MAX(step_order) AS max FROM test_scenario_steps WHERE scenario_id = $1`)
      .get(scenarioId);
    order = (Number(max?.max) || 0) + 1;
  }
  const r = await db
    .prepare(
      `INSERT INTO test_scenario_steps (scenario_id, step_order, action, expected_outcome)
       VALUES ($1, $2, $3, $4) RETURNING id`
    )
    .run(scenarioId, order, action, expectedOutcome);
  const newId = Number(r.lastInsertRowid);
  await writeAudit({
    userId: req.user.id,
    entityType: 'test_scenario_step',
    entityId: newId,
    action: 'create',
    afterValue: { scenarioId, stepOrder: order, action, expectedOutcome },
    source: 'manual_ui',
  });
  res.json({ id: newId, stepOrder: order });
});

router.patch('/steps/:id', async (req, res) => {
  const id = Number(req.params.id);
  const before = await snapshotRow('test_scenario_steps', id);
  if (!before) return res.status(404).json({ error: 'not found' });

  const sets = [];
  const vals = [];
  let i = 1;
  for (const [camel, snake] of Object.entries(STEP_FIELD_MAP)) {
    if (req.body[camel] !== undefined) {
      sets.push(`${snake} = $${i++}`);
      vals.push(req.body[camel]);
    }
  }
  if (!sets.length) return res.json({ ok: true, noop: true });
  vals.push(id);
  await db.prepare(`UPDATE test_scenario_steps SET ${sets.join(', ')} WHERE id = $${i}`).run(...vals);

  const after = await snapshotRow('test_scenario_steps', id);
  if (diffRows(before, after)) {
    await writeAudit({
      userId: req.user.id,
      entityType: 'test_scenario_step',
      entityId: id,
      action: 'update',
      beforeValue: before,
      afterValue: after,
      source: 'manual_ui',
    });
  }
  res.json({ ok: true });
});

router.delete('/steps/:id', async (req, res) => {
  const id = Number(req.params.id);
  const before = await snapshotRow('test_scenario_steps', id);
  if (!before) return res.status(404).json({ error: 'not found' });
  await db.prepare(`DELETE FROM test_scenario_steps WHERE id = $1`).run(id);
  await writeAudit({
    userId: req.user.id,
    entityType: 'test_scenario_step',
    entityId: id,
    action: 'delete',
    beforeValue: before,
    source: 'manual_ui',
  });
  res.json({ ok: true });
});

// ──────────────────────── Runs ────────────────────────
//
// POST body shape:
// {
//   scenarioId, environment ('test'|'prod'), notes,
//   stepResults: [{ stepId, result ('pass'|'fail'|'blocked'), notes, evidenceUrl }]
// }
//
// Server computes overallResult from the per-step verdicts (fail > blocked >
// pass priority). For every step result with result='fail', the server auto-
// creates a backlog_item kind='defect' linked to the scenario's parent feature
// AND to the scenario itself, then writes the new defect's id onto the step
// result's defect_backlog_item_id so the run UI can navigate to it.
router.post('/runs', async (req, res) => {
  const { scenarioId, environment, notes, stepResults = [] } = req.body || {};
  if (!scenarioId || !environment) {
    return res.status(400).json({ error: 'scenarioId and environment required' });
  }
  if (!['test', 'prod'].includes(environment)) {
    return res.status(400).json({ error: 'environment must be "test" or "prod"' });
  }
  const scenario = await db
    .prepare(`SELECT * FROM test_scenarios WHERE id = $1`)
    .get(Number(scenarioId));
  if (!scenario) return res.status(404).json({ error: 'scenario not found' });

  // Compute overall result. Any fail dominates; blocked beats pass; otherwise pass.
  let overallResult = 'pass';
  for (const sr of stepResults) {
    if (sr.result === 'fail') { overallResult = 'fail'; break; }
    if (sr.result === 'blocked' && overallResult !== 'fail') overallResult = 'blocked';
  }

  const runInsert = await db
    .prepare(
      `INSERT INTO test_runs (scenario_id, tester_user_id, environment, overall_result, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`
    )
    .run(Number(scenarioId), req.user.id, environment, overallResult, notes || null);
  const runId = Number(runInsert.lastInsertRowid);

  await writeAudit({
    userId: req.user.id,
    entityType: 'test_run',
    entityId: runId,
    action: 'create',
    afterValue: {
      scenarioId: Number(scenarioId),
      environment,
      overallResult,
      notes: notes || null,
    },
    source: req.body._source || 'manual_ui',
    reason: req.body._reason || null,
  });

  const createdDefects = [];
  for (const sr of stepResults) {
    if (!sr.stepId || !sr.result) continue;
    if (!['pass', 'fail', 'blocked'].includes(sr.result)) continue;

    let defectId = null;
    if (sr.result === 'fail') {
      const step = await db
        .prepare(`SELECT * FROM test_scenario_steps WHERE id = $1`)
        .get(Number(sr.stepId));
      if (step) {
        const defectTitle = `Defect — ${scenario.title} — step ${step.step_order}`;
        const observed = sr.notes ? ` Observed: ${sr.notes}.` : '';
        const defectSummary =
          `Step "${step.action}" failed during test run #${runId} in ${environment}. ` +
          `Expected: ${step.expected_outcome}.${observed}`;
        const defectInsert = await db
          .prepare(
            `INSERT INTO backlog_items
               (kind, title, summary, status, parent_id, test_scenario_id, capability_id, tags)
             VALUES ('defect', $1, $2, 'pending', $3, $4, $5, $6) RETURNING id`
          )
          .run(
            defectTitle,
            defectSummary,
            scenario.backlog_item_id || null,
            Number(scenarioId),
            scenario.capability_id || null,
            JSON.stringify(['defect', `env-${environment}`, `run-${runId}`])
          );
        defectId = Number(defectInsert.lastInsertRowid);
        createdDefects.push(defectId);

        await writeAudit({
          userId: req.user.id,
          entityType: 'backlog_item',
          entityId: defectId,
          action: 'create',
          afterValue: {
            kind: 'defect',
            title: defectTitle,
            summary: defectSummary,
            status: 'pending',
            parentId: scenario.backlog_item_id ? Number(scenario.backlog_item_id) : null,
            testScenarioId: Number(scenarioId),
            capabilityId: scenario.capability_id ? Number(scenario.capability_id) : null,
          },
          source: req.body._source || 'manual_ui',
          reason: `Auto-created from failed step #${sr.stepId} in test_run #${runId}`,
        });
      }
    }

    const srInsert = await db
      .prepare(
        `INSERT INTO test_run_step_results
           (run_id, step_id, result, notes, evidence_url, defect_backlog_item_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
      )
      .run(
        runId,
        Number(sr.stepId),
        sr.result,
        sr.notes || null,
        sr.evidenceUrl || null,
        defectId
      );
    await writeAudit({
      userId: req.user.id,
      entityType: 'test_run_step_result',
      entityId: Number(srInsert.lastInsertRowid),
      action: 'create',
      afterValue: {
        runId,
        stepId: Number(sr.stepId),
        result: sr.result,
        defectBacklogItemId: defectId,
      },
      source: req.body._source || 'manual_ui',
    });
  }

  res.json({ id: runId, overallResult, createdDefects });
});

router.get('/runs', async (req, res) => {
  const { scenarioId } = req.query;
  let query = `SELECT * FROM test_runs`;
  const params = [];
  if (scenarioId) {
    query += ` WHERE scenario_id = $1`;
    params.push(Number(scenarioId));
  }
  query += ` ORDER BY run_at DESC LIMIT 100`;
  const rows = await db.prepare(query).all(...params);
  res.json({ runs: rows.map(rowToRun) });
});

router.get('/runs/:id', async (req, res) => {
  const id = Number(req.params.id);
  const run = await db.prepare(`SELECT * FROM test_runs WHERE id = $1`).get(id);
  if (!run) return res.status(404).json({ error: 'not found' });
  const stepResults = await db
    .prepare(`SELECT * FROM test_run_step_results WHERE run_id = $1 ORDER BY id`)
    .all(id);
  res.json({ run: rowToRun(run), stepResults: stepResults.map(rowToStepResult) });
});

// ──────────────────────── Defects (convenience) ────────────────────────
router.get('/defects', async (req, res) => {
  const rows = await db
    .prepare(`SELECT * FROM backlog_items WHERE kind = 'defect' ORDER BY created_at DESC`)
    .all();
  res.json({
    defects: rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      summary: r.summary,
      status: r.status,
      parentId: r.parent_id ? Number(r.parent_id) : null,
      testScenarioId: r.test_scenario_id ? Number(r.test_scenario_id) : null,
      capabilityId: r.capability_id ? Number(r.capability_id) : null,
      createdAt: Number(r.created_at),
    })),
  });
});

export default router;
