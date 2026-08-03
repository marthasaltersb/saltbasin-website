// GTM Deliverable & Benchmark Research Agent -- native platform routes.
// Replaces the standalone Python CLI at agents/gtm-deliverable-agent/.
// Human review gate: every generation path lands at status='draft' and stops
// there. Only an explicit PATCH /:id/status call from an authenticated admin
// moves a deliverable forward -- nothing here sends, publishes, or emails.
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../auth.js';
import { db } from '../db.js';
import { buildClientDataSummary } from '../lib/gtm/clientDataNormalize.js';
import { generateEngagementSync, EXEC_STYLES } from '../lib/gtm/generate.js';
import { runDueSchedules, runScheduleNow, computeNextRunAt } from '../lib/gtm/scheduler.js';
import { pollAndFetchPendingBatches } from '../lib/gtm/batchFetch.js';
import { buildXlsxForDeliverable } from '../lib/gtm/xlsxBuilder.js';
import { ALLOWED_STATUSES, updateDeliverableStatus } from '../lib/gtm/deliverableStatus.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function requireCronSecret(req, res, next) {
  const configured = process.env.GTM_CRON_SECRET;
  if (!configured) {
    return res.status(500).json({ error: 'GTM_CRON_SECRET is not configured on the server.' });
  }
  if (req.headers['x-gtm-cron-secret'] !== configured) {
    return res.status(403).json({ error: 'Invalid or missing cron secret.' });
  }
  next();
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseMaybeJson(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

// ── Scenario library ────────────────────────────────────────────────────

router.get('/scenarios', requireAdmin, async (req, res) => {
  const rows = await db.prepare(`SELECT * FROM gtm_scenario_library ORDER BY sort_order, created_at`).all();
  res.json({ scenarios: rows });
});

router.post('/scenarios', requireAdmin, async (req, res) => {
  const { title, root_cause, ebitda_impact_tier, topic_prompt } = req.body || {};
  if (!title || !root_cause || !ebitda_impact_tier || !topic_prompt) {
    return res.status(400).json({ error: 'title, root_cause, ebitda_impact_tier, and topic_prompt are required.' });
  }
  const scenarioKey = req.body.scenario_key ? slugify(req.body.scenario_key) : slugify(title);
  const now = Date.now();
  try {
    const result = await db
      .prepare(
        `INSERT INTO gtm_scenario_library
           (scenario_key, title, root_cause, ebitda_impact_tier, topic_prompt, source, sort_order, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'manual', $6, $7, $8, $8)
         RETURNING id`
      )
      .run(scenarioKey, title, root_cause, ebitda_impact_tier, topic_prompt, req.body.sort_order ?? 0, req.user.id, now);
    const row = await db.prepare(`SELECT * FROM gtm_scenario_library WHERE id = $1`).get(result.lastInsertRowid);
    res.status(201).json({ scenario: row });
  } catch (e) {
    if (/duplicate key|unique/i.test(e.message)) {
      return res.status(409).json({ error: `A scenario with key "${scenarioKey}" already exists.` });
    }
    throw e;
  }
});

router.patch('/scenarios/:id', requireAdmin, async (req, res) => {
  const editable = ['title', 'root_cause', 'ebitda_impact_tier', 'topic_prompt', 'is_active', 'sort_order'];
  const sets = [];
  const params = [];
  for (const field of editable) {
    if (req.body[field] === undefined) continue;
    params.push(req.body[field]);
    sets.push(`${field} = $${params.length}`);
  }
  if (!sets.length) return res.status(400).json({ error: 'No editable fields provided.' });
  params.push(Date.now());
  sets.push(`updated_at = $${params.length}`);
  params.push(req.params.id);
  const result = await db
    .prepare(`UPDATE gtm_scenario_library SET ${sets.join(', ')} WHERE id = $${params.length}`)
    .run(...params);
  if (!result.changes) return res.status(404).json({ error: 'Scenario not found.' });
  const row = await db.prepare(`SELECT * FROM gtm_scenario_library WHERE id = $1`).get(req.params.id);
  res.json({ scenario: row });
});

// ── Schedules ────────────────────────────────────────────────────────────

router.get('/schedules', requireAdmin, async (req, res) => {
  const rows = await db.prepare(`SELECT * FROM gtm_schedules ORDER BY created_at DESC`).all();
  res.json({ schedules: rows.map((r) => ({ ...r, selected_scenario_ids: parseMaybeJson(r.selected_scenario_ids) })) });
});

router.post('/schedules', requireAdmin, async (req, res) => {
  const {
    name,
    cadence = 'monthly',
    cadence_days = null,
    topic_selection_mode = 'all_active_scenarios',
    selected_scenario_ids = [],
    random_n = null,
    exec_style = 'financial_first',
    enabled = true,
  } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  if (!EXEC_STYLES.includes(exec_style)) {
    return res.status(400).json({ error: `exec_style must be one of ${EXEC_STYLES.join(', ')}` });
  }
  const now = Date.now();
  // Due immediately on creation -- cadence governs the interval *after* the
  // first run, not a delay before it. Admin can also just click "Run Now."
  const result = await db
    .prepare(
      `INSERT INTO gtm_schedules
         (name, cadence, cadence_days, topic_selection_mode, selected_scenario_ids, random_n, exec_style, enabled, next_run_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       RETURNING id`
    )
    .run(name, cadence, cadence_days, topic_selection_mode, selected_scenario_ids, random_n, exec_style, enabled, now, now);
  const row = await db.prepare(`SELECT * FROM gtm_schedules WHERE id = $1`).get(result.lastInsertRowid);
  res.status(201).json({ schedule: { ...row, selected_scenario_ids: parseMaybeJson(row.selected_scenario_ids) } });
});

router.patch('/schedules/:id', requireAdmin, async (req, res) => {
  const editable = ['name', 'cadence', 'cadence_days', 'topic_selection_mode', 'selected_scenario_ids', 'random_n', 'exec_style', 'enabled'];
  const sets = [];
  const params = [];
  for (const field of editable) {
    if (req.body[field] === undefined) continue;
    if (field === 'exec_style' && !EXEC_STYLES.includes(req.body.exec_style)) {
      return res.status(400).json({ error: `exec_style must be one of ${EXEC_STYLES.join(', ')}` });
    }
    params.push(req.body[field]);
    sets.push(`${field} = $${params.length}`);
  }
  if (!sets.length) return res.status(400).json({ error: 'No editable fields provided.' });
  params.push(Date.now());
  sets.push(`updated_at = $${params.length}`);
  params.push(req.params.id);
  const result = await db.prepare(`UPDATE gtm_schedules SET ${sets.join(', ')} WHERE id = $${params.length}`).run(...params);
  if (!result.changes) return res.status(404).json({ error: 'Schedule not found.' });
  const row = await db.prepare(`SELECT * FROM gtm_schedules WHERE id = $1`).get(req.params.id);
  res.json({ schedule: { ...row, selected_scenario_ids: parseMaybeJson(row.selected_scenario_ids) } });
});

router.post('/schedules/:id/run-now', requireAdmin, async (req, res) => {
  try {
    const result = await runScheduleNow(req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Cron entrypoint (shared-secret auth, not cookie session) ─────────────

router.post('/run-due', requireCronSecret, async (req, res) => {
  const dueResults = await runDueSchedules();
  const fetchSummary = await pollAndFetchPendingBatches();
  res.json({ ok: true, due: dueResults, fetched: fetchSummary });
});

// ── Engagement (on-demand, optional client file) ──────────────────────────

router.post('/engagement', requireAdmin, upload.single('clientFile'), async (req, res) => {
  const { topic, clientName, execStyle = 'financial_first' } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'topic is required.' });
  if (!EXEC_STYLES.includes(execStyle)) {
    return res.status(400).json({ error: `execStyle must be one of ${EXEC_STYLES.join(', ')}` });
  }
  if (req.file && !clientName) {
    return res.status(400).json({ error: 'clientName is required when a client file is uploaded.' });
  }

  let clientSummary = null;
  if (req.file) {
    try {
      clientSummary = buildClientDataSummary(req.file.buffer, req.file.originalname, clientName);
    } catch (e) {
      return res.status(400).json({ error: `Could not parse client file: ${e.message}` });
    }
  }

  let generated;
  try {
    generated = await generateEngagementSync(topic, clientSummary, execStyle);
  } catch (e) {
    return res.status(502).json({ error: `Generation failed: ${e.message}` });
  }

  const now = Date.now();
  const result = await db
    .prepare(
      `INSERT INTO gtm_deliverables
         (mode, topic, exec_style, engagement_client_name, client_data_summary, deliverable_json, status, requested_by, created_at, updated_at)
       VALUES ('engagement', $1, $2, $3, $4, $5, 'draft', $6, $7, $7)
       RETURNING id`
    )
    .run(topic, execStyle, clientName || null, clientSummary, generated.deliverable, req.user.id, now);

  const deliverableId = result.lastInsertRowid;
  await buildXlsxForDeliverable(deliverableId).catch((e) =>
    console.warn(`[gtm] xlsx build failed for engagement deliverable ${deliverableId}:`, e.message)
  );

  const row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(deliverableId);
  res.status(201).json({ deliverable: hydrateDeliverable(row) });
});

// ── Deliverables list/detail/status ───────────────────────────────────────

function hydrateDeliverable(row) {
  return {
    ...row,
    client_data_summary: parseMaybeJson(row.client_data_summary),
    deliverable_json: parseMaybeJson(row.deliverable_json),
  };
}

router.get('/', requireAdmin, async (req, res) => {
  const { mode, status } = req.query;
  const conditions = [];
  const params = [];
  if (mode) {
    params.push(mode);
    conditions.push(`mode = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db
    .prepare(
      `SELECT id, mode, schedule_id, topic, exec_style, engagement_client_name, status, batch_id, xlsx_storage_url, created_at, updated_at
       FROM gtm_deliverables ${where} ORDER BY created_at DESC LIMIT 200`
    )
    .all(...params);
  res.json({ deliverables: rows });
});

router.get('/:id', requireAdmin, async (req, res) => {
  const row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Deliverable not found.' });
  const annotations = await db
    .prepare(`SELECT * FROM gtm_deliverable_annotations WHERE deliverable_id = $1 ORDER BY created_at`)
    .all(req.params.id);
  res.json({
    deliverable: hydrateDeliverable(row),
    annotations: annotations.map((a) => ({ ...a, body: parseMaybeJson(a.body) })),
  });
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: `status is required (one of ${ALLOWED_STATUSES.join(', ')}).` });
  try {
    await updateDeliverableStatus(req.params.id, status);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(req.params.id);
  res.json({ deliverable: hydrateDeliverable(row) });
});

router.get('/:id/xlsx', requireAdmin, async (req, res) => {
  let row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Deliverable not found.' });
  if (!row.xlsx_storage_url) {
    try {
      await buildXlsxForDeliverable(req.params.id);
    } catch (e) {
      return res.status(500).json({ error: `Could not build xlsx: ${e.message}` });
    }
    row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(req.params.id);
  }
  if (!row.xlsx_storage_url) {
    return res.status(500).json({ error: 'xlsx storage is not configured on this server (missing SUPABASE_URL/SERVICE_ROLE_KEY).' });
  }
  res.redirect(row.xlsx_storage_url);
});

// ── Annotations ─────────────────────────────────────────────────────────

const ANNOTATION_TYPES = ['new_scenario', 'rule_note', 'decision', 'correction'];

router.post('/:id/annotations', requireAdmin, async (req, res) => {
  const { section_key = null, type, body } = req.body || {};
  if (!ANNOTATION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${ANNOTATION_TYPES.join(', ')}` });
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'body (object) is required.' });
  }
  const deliverable = await db.prepare(`SELECT id FROM gtm_deliverables WHERE id = $1`).get(req.params.id);
  if (!deliverable) return res.status(404).json({ error: 'Deliverable not found.' });

  const now = Date.now();
  const result = await db
    .prepare(
      `INSERT INTO gtm_deliverable_annotations
         (deliverable_id, section_key, type, body, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id`
    )
    .run(req.params.id, section_key, type, body, req.user.id, now);
  const row = await db.prepare(`SELECT * FROM gtm_deliverable_annotations WHERE id = $1`).get(result.lastInsertRowid);
  res.status(201).json({ annotation: { ...row, body: parseMaybeJson(row.body) } });
});

router.post('/:id/annotations/:aid/promote', requireAdmin, async (req, res) => {
  const annotation = await db
    .prepare(`SELECT * FROM gtm_deliverable_annotations WHERE id = $1 AND deliverable_id = $2`)
    .get(req.params.aid, req.params.id);
  if (!annotation) return res.status(404).json({ error: 'Annotation not found.' });
  if (annotation.type !== 'new_scenario') {
    return res.status(400).json({ error: 'Only new_scenario annotations can be promoted.' });
  }
  if (annotation.promoted_to_scenario_id) {
    return res.status(409).json({ error: 'Annotation already promoted.' });
  }
  const body = parseMaybeJson(annotation.body);
  const { title, root_cause, ebitda_impact_tier, topic_prompt } = body || {};
  if (!title || !root_cause || !ebitda_impact_tier || !topic_prompt) {
    return res.status(400).json({
      error: 'Annotation body must include title, root_cause, ebitda_impact_tier, and topic_prompt to promote.',
    });
  }

  const scenarioKey = slugify(title);
  const now = Date.now();
  let scenarioRow;
  try {
    const result = await db
      .prepare(
        `INSERT INTO gtm_scenario_library
           (scenario_key, title, root_cause, ebitda_impact_tier, topic_prompt, source, promoted_from_annotation_id, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'annotation_promoted', $6, $7, $8, $8)
         RETURNING id`
      )
      .run(scenarioKey, title, root_cause, ebitda_impact_tier, topic_prompt, annotation.id, req.user.id, now);
    scenarioRow = await db.prepare(`SELECT * FROM gtm_scenario_library WHERE id = $1`).get(result.lastInsertRowid);
  } catch (e) {
    if (/duplicate key|unique/i.test(e.message)) {
      return res.status(409).json({ error: `A scenario with key "${scenarioKey}" already exists.` });
    }
    throw e;
  }

  await db
    .prepare(`UPDATE gtm_deliverable_annotations SET promoted_to_scenario_id = $1, updated_at = $2 WHERE id = $3`)
    .run(scenarioRow.id, now, annotation.id);

  res.json({ scenario: scenarioRow });
});

export default router;
