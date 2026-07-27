import express from 'express';
import { getUserFromCookie } from '../auth.js';
import { db } from '../db.js';
import { ARR_DEFINITION, CORE_METRICS, DEMO_ARR, METRIC_DEPENDENCIES, analyzeChange, calculateMetric, calculateUsageCharge, classifyChangeEvent, serializeDefinition } from '../lib/metricIntelligence.js';

const router = express.Router();
router.use(async (req, res, next) => {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') return res.status(401).json({ error: 'Admin access required' });
  req.user = user; next();
});

router.get('/metrics', (req, res) => res.json({ metrics: CORE_METRICS, dependencies: METRIC_DEPENDENCIES }));
router.post('/registry/sync', async (req, res) => {
  const items = CORE_METRICS.map(serializeDefinition);
  const now = Date.now();
  for (const item of items) await db.prepare(`INSERT INTO metric_definitions
    (metric_id, metric_key, display_name, metric_family, metric_subfamily, definition_json, calculation_version, effective_from, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8)
    ON CONFLICT (metric_id) DO UPDATE SET display_name=excluded.display_name, metric_family=excluded.metric_family,
      metric_subfamily=excluded.metric_subfamily, definition_json=excluded.definition_json,
      calculation_version=excluded.calculation_version, updated_at=excluded.updated_at`).run(
    item.metricId, item.metricKey, item.displayName, item.family, item.subfamily,
    JSON.stringify(item.definition), item.calculationVersion, now
  );
  res.json({ ok: true, synced: items.map((item) => item.metricId) });
});

router.get('/observations', async (req, res) => {
  const rows = await db.prepare(`SELECT o.*, c.metric_id, c.variant_key, c.unit, c.confidence,
    c.calculation_version, c.methodology FROM metric_observations o
    JOIN metric_calculations c ON c.id=o.calculation_id
    WHERE ($1::text IS NULL OR c.metric_id=$1) AND ($2::text IS NULL OR o.entity_id=$2)
    ORDER BY o.period_end DESC LIMIT 100`).all(req.query.metricId || null, req.query.entityId || null);
  res.json({ observations: rows });
});
router.post('/pricing/usage-charge', (req, res) => {
  try { res.json(calculateUsageCharge(req.body)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
router.post('/changes/classify', (req, res) => {
  try { res.json(classifyChangeEvent(req.body)); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
router.get('/metrics/arr/demo', (req, res) => {
  const variantKey = req.query.variant || 'live_arr';
  const prior = calculateMetric({ variantKey, variables: DEMO_ARR.prior, asOf: Date.UTC(2026, 4, 31) });
  const current = calculateMetric({ variantKey, variables: DEMO_ARR.current, asOf: Date.UTC(2026, 5, 30) });
  res.json({ definition: ARR_DEFINITION, observations: [prior, current], analysis: analyzeChange(current, prior) });
});
router.post('/calculate', async (req, res) => {
  try {
    const calculation = calculateMetric(req.body);
    if (!req.body.persist) return res.json(calculation);
    const definition = serializeDefinition(ARR_DEFINITION);
    const now = Date.now();
    await db.prepare(`INSERT INTO metric_definitions
      (metric_id,metric_key,display_name,metric_family,metric_subfamily,definition_json,calculation_version,effective_from,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8) ON CONFLICT (metric_id) DO NOTHING`).run(
      definition.metricId, definition.metricKey, definition.displayName, definition.family,
      definition.subfamily, JSON.stringify(definition.definition), definition.calculationVersion, now);
    const inserted = await db.raw.unsafe(`INSERT INTO metric_calculations
      (metric_id,variant_key,calculation_version,as_of,value,unit,confidence,formula_json,inputs_json,methodology,context_json,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11::jsonb,$12) RETURNING id`, [
      calculation.metricId, calculation.variantKey, calculation.calculationVersion, calculation.asOf,
      calculation.value, calculation.unit, calculation.confidence, JSON.stringify(calculation.formula),
      JSON.stringify(calculation.inputs), calculation.methodology, JSON.stringify(req.body.context || {}), req.user.id]);
    const entityId = req.body.entityId || 'synthetic-portfolio-company';
    await db.prepare(`INSERT INTO metric_observations
      (calculation_id,entity_type,entity_id,period_start,period_end,observed_value)
      VALUES ($1,$2,$3,$4,$5,$6)`).run(inserted[0].id, req.body.entityType || 'portfolio_company', entityId,
      req.body.periodStart || null, calculation.asOf, calculation.value);
    res.status(201).json({ ...calculation, calculationId: inserted[0].id, entityId });
  }
  catch (error) { res.status(400).json({ error: error.message }); }
});

export default router;
