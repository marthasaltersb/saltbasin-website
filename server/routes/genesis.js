import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { db } from '../db.js';
import { genesisCatalog, defaultGenesisConfiguration, findTable, configurationErrors } from '../lib/genesisCatalog.js';
import { GENESIS_OVERLAP_STATUSES, GENESIS_REVIEW_STATUSES } from '../data/genesisOverlapSeeds.js';

const router = Router();
router.use(requireAdmin);

const RESOLUTION_KINDS = ['consolidate', 'reclassify', 'configuration-override', 'retain-projection', 'bind-canonical', 'retire'];

function recommendationFor(overlap) {
  const kind = overlap.overlap_status === 'duplicate-definition' ? 'consolidate'
    : overlap.overlap_status === 'context-bound' ? 'reclassify'
    : overlap.mapping_relation === 'configuration-of' ? 'configuration-override'
    : overlap.mapping_relation === 'projection-of' ? 'retain-projection'
    : 'bind-canonical';
  const alternatives = kind === 'consolidate'
    ? ['Reclassify the implementations if evidence proves distinct meanings.', 'Retire the lower-value implementation without migration if it contains no authoritative records.']
    : kind === 'reclassify'
      ? ['Consolidate if the apparent distinction is only naming or storage.', 'Keep one canonical object and express the difference as R4 configuration.']
      : ['Retain the current implementation temporarily with an explicit exception.', 'Create a new canonical object only after enterprise governance review.'];
  const steps = kind === 'consolidate'
    ? ['Select the authoritative implementation.', 'Stop new writes to the legacy implementation.', 'Backfill canonical IDs and configuration versions.', 'Migrate and reconcile historical records.', 'Validate behavior and retire the legacy path.']
    : kind === 'reclassify'
      ? ['State the semantic distinction without implementation vocabulary.', 'Confirm separate identity, lifecycle, authority or grain.', 'Bind each implementation to the correct canonical target.', 'Add counterexamples and validate downstream behavior.']
      : kind === 'configuration-override'
        ? ['Keep the R2 canonical meaning unchanged.', 'Move local thresholds, aliases and behavior into R4.', 'Version and effective-date the configuration.', 'Rebind runtime readers and validate rollback.']
        : kind === 'retain-projection'
          ? ['Keep the visual/UI object as a projection.', 'Attach canonical ID, configuration version and as-of time.', 'Verify the visual is reversible to source evidence.']
          : ['Add the canonical ID to the implementation record.', 'Attach configuration and effective rule versions.', 'Backfill historical lineage and validate coverage.'];
  return {
    overlapId: overlap.overlap_id,
    recommendedKind: kind,
    headline: `${kind.replaceAll('-', ' ')} ${overlap.source_key}`,
    decidedDefinition: overlap.rationale,
    confidence: Number(overlap.confidence),
    canonicalTarget: `${overlap.canonical_repository}:${overlap.canonical_id}`,
    migrationAction: overlap.migration_action,
    steps,
    alternatives,
    missingContext: ['Confirmed accountable owner', 'Historical row/consumer inventory', 'Rollback and reconciliation criteria'],
    sourceRefs: [overlap.source_path, `Genesis ${overlap.canonical_repository} ${overlap.canonical_id}`].filter(Boolean),
    preview: {
      before: { sourceKey: overlap.source_key, overlapStatus: overlap.overlap_status, mappingRelation: overlap.mapping_relation, reviewStatus: overlap.review_status },
      after: { canonicalTarget: `${overlap.canonical_repository}:${overlap.canonical_id}`, resolutionKind: kind, resolutionStatus: 'approved_plan', implementationStatus: 'pending_migration' },
    },
  };
}

router.get('/summary', (req, res) => {
  const layers = ['scientific', 'enterprise', 'translation'].map((key) => ({
    key,
    repositoryId: genesisCatalog[key].repositoryId,
    label: genesisCatalog[key].label,
    tableCount: genesisCatalog[key].tables.length,
    recordCount: genesisCatalog[key].tables.reduce((sum, table) => sum + table.records.length, 0),
  }));
  res.json({ meta: genesisCatalog.meta, layers });
});

router.get('/catalog/:layer/:table', (req, res) => {
  const { layer, table } = req.params;
  const source = findTable(layer, table);
  if (!source) return res.status(404).json({ error: 'catalog table not found' });
  const q = String(req.query.q || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const records = q
    ? source.records.filter((record) => JSON.stringify(record).toLowerCase().includes(q)).slice(0, limit)
    : source.records.slice(0, limit);
  res.json({ ...source, records, total: source.records.length, returned: records.length });
});

router.get('/catalog/:layer', (req, res) => {
  const source = genesisCatalog[req.params.layer];
  if (!source) return res.status(404).json({ error: 'catalog layer not found' });
  res.json({ repositoryId: source.repositoryId, label: source.label, tables: source.tables.map((table) => ({ name: table.name, description: table.description, recordCount: table.records.length })) });
});

router.get('/configurations', async (req, res) => {
  const rows = await db.prepare(`SELECT * FROM genesis_configurations ORDER BY namespace, updated_at DESC`).all();
  if (!rows.length) return res.json({ configurations: [defaultGenesisConfiguration], persisted: false });
  res.json({ configurations: rows.map((row) => ({ ...row.data, id: row.id, namespace: row.namespace, version: row.version, status: row.status, effectiveFrom: row.effective_from, effectiveTo: row.effective_to, updatedAt: row.updated_at })), persisted: true });
});

router.put('/configurations', async (req, res) => {
  const value = req.body;
  const errors = configurationErrors(value);
  if (errors.length) return res.status(400).json({ error: 'invalid Genesis configuration', details: errors });
  const now = Date.now();
  const effectiveFrom = value.effectiveFrom == null ? null : Number(value.effectiveFrom);
  const effectiveTo = value.effectiveTo == null ? null : Number(value.effectiveTo);
  const stored = { ...value };
  delete stored.id;
  delete stored.updatedAt;
  await db.prepare(`
    INSERT INTO genesis_configurations (namespace, version, status, data, effective_from, effective_to, created_by, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
    ON CONFLICT (namespace, version) DO UPDATE SET status=excluded.status, data=excluded.data,
      effective_from=excluded.effective_from, effective_to=excluded.effective_to, updated_at=excluded.updated_at
  `).run(value.namespace, value.version, value.status, stored, effectiveFrom, effectiveTo, req.user.id, now);
  res.json({ ok: true, namespace: value.namespace, version: value.version, updatedAt: now });
});

router.post('/evaluate', (req, res) => {
  const { transitionId, predicateResults = [] } = req.body || {};
  const transitionTable = findTable('translation', '45_STATE_TRANSITIONS');
  const transition = transitionTable?.records.find((record) => record.Transition_ID === transitionId);
  if (!transition) return res.status(404).json({ error: 'transition not found' });
  if (transition['Transition Status'] === 'prohibited') return res.json({ decision: 'BLOCKED', transition, reasons: ['transition is explicitly prohibited'] });
  const results = new Map(predicateResults.map((item) => [item.predicateId, String(item.result || '').toUpperCase()]));
  const requiredText = transition['Required Predicate_IDs'] || '';
  const required = requiredText.includes('–')
    ? Array.from({ length: 12 }, (_, index) => `PRD${String(index + 1).padStart(4, '0')}`)
    : requiredText.split(';').map((item) => item.trim()).filter(Boolean);
  const failed = required.filter((id) => results.get(id) === 'FAIL');
  const unknown = required.filter((id) => !results.has(id) || !['PASS', 'FAIL'].includes(results.get(id)));
  res.json({ decision: failed.length || unknown.length ? 'BLOCKED' : 'ELIGIBLE', transition, required, failed, unknown, replayable: true });
});

router.get('/overlaps/summary', async (req, res) => {
  const rows = await db.prepare(`
    SELECT domain, overlap_status, review_status, COUNT(*)::int AS count,
      ROUND(AVG(confidence)::numeric, 3) AS average_confidence
    FROM genesis_object_overlaps
    GROUP BY domain, overlap_status, review_status
    ORDER BY domain, overlap_status, review_status
  `).all();
  const totals = await db.prepare(`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE review_status IN ('reviewed','approved'))::int AS reviewed,
      COUNT(*) FILTER (WHERE overlap_status = 'duplicate-definition')::int AS duplicates,
      COUNT(*) FILTER (WHERE overlap_status IN ('unmapped','category-error'))::int AS attention,
      ROUND(AVG(confidence)::numeric, 3) AS average_confidence
    FROM genesis_object_overlaps
  `).get();
  res.json({ totals, breakdown: rows, overlapStatuses: GENESIS_OVERLAP_STATUSES, reviewStatuses: GENESIS_REVIEW_STATUSES });
});

router.get('/overlaps', async (req, res) => {
  const domain = String(req.query.domain || '').trim();
  const status = String(req.query.status || '').trim();
  const reviewStatus = String(req.query.reviewStatus || '').trim();
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
  const rows = await db.prepare(`
    SELECT * FROM genesis_object_overlaps
    WHERE ($1 = '' OR domain = $1)
      AND ($2 = '' OR overlap_status = $2)
      AND ($3 = '' OR review_status = $3)
      AND ($4 = '' OR source_key ILIKE '%' || $4 || '%' OR canonical_id ILIKE '%' || $4 || '%'
        OR rationale ILIKE '%' || $4 || '%' OR migration_action ILIKE '%' || $4 || '%')
    ORDER BY domain, source_kind, source_key
    LIMIT $5
  `).all(domain, status, reviewStatus, q, limit);
  res.json({ overlaps: rows, returned: rows.length });
});

router.patch('/overlaps/:id', async (req, res) => {
  const existing = await db.prepare(`SELECT * FROM genesis_object_overlaps WHERE overlap_id=$1`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'overlap record not found' });
  const next = {
    canonicalId: req.body?.canonicalId ?? existing.canonical_id,
    overlapStatus: req.body?.overlapStatus ?? existing.overlap_status,
    mappingRelation: req.body?.mappingRelation ?? existing.mapping_relation,
    confidence: req.body?.confidence ?? Number(existing.confidence),
    rationale: req.body?.rationale ?? existing.rationale,
    migrationAction: req.body?.migrationAction ?? existing.migration_action,
    configNamespace: req.body?.configNamespace ?? existing.config_namespace,
    reviewStatus: req.body?.reviewStatus ?? existing.review_status,
  };
  if (!GENESIS_OVERLAP_STATUSES.includes(next.overlapStatus)) return res.status(400).json({ error: 'invalid overlap status' });
  if (!GENESIS_REVIEW_STATUSES.includes(next.reviewStatus)) return res.status(400).json({ error: 'invalid review status' });
  if (!Number.isFinite(Number(next.confidence)) || Number(next.confidence) < 0 || Number(next.confidence) > 1) return res.status(400).json({ error: 'confidence must be between 0 and 1' });
  const canonicalObjects = findTable('enterprise', '06_OBJECTS')?.records || [];
  if (!canonicalObjects.some((record) => record.Object_ID === next.canonicalId)) return res.status(400).json({ error: 'canonical R2 object ID does not exist' });
  const now = Date.now();
  const reviewed = next.reviewStatus === 'reviewed' || next.reviewStatus === 'approved';
  await db.prepare(`
    UPDATE genesis_object_overlaps SET canonical_id=$1, overlap_status=$2, mapping_relation=$3,
      confidence=$4, rationale=$5, migration_action=$6, config_namespace=$7,
      review_status=$8, reviewed_by=$9, reviewed_at=$10, updated_at=$11
    WHERE overlap_id=$12
  `).run(next.canonicalId, next.overlapStatus, next.mappingRelation, Number(next.confidence), next.rationale,
    next.migrationAction, next.configNamespace || null, next.reviewStatus,
    reviewed ? req.user.id : null, reviewed ? now : null, now, req.params.id);
  res.json({ ok: true, overlapId: req.params.id, updatedAt: now });
});

router.get('/overlaps/:id/recommendation', async (req, res) => {
  const overlap = await db.prepare(`SELECT * FROM genesis_object_overlaps WHERE overlap_id=$1`).get(req.params.id);
  if (!overlap) return res.status(404).json({ error: 'overlap record not found' });
  res.json({ recommendation: recommendationFor(overlap), resolutionStatus: overlap.resolution_status, savedProposal: overlap.resolution_proposal });
});

router.post('/overlaps/:id/resolution-preview', async (req, res) => {
  const overlap = await db.prepare(`SELECT * FROM genesis_object_overlaps WHERE overlap_id=$1`).get(req.params.id);
  if (!overlap) return res.status(404).json({ error: 'overlap record not found' });
  const recommendation = recommendationFor(overlap);
  const resolutionKind = req.body?.resolutionKind || recommendation.recommendedKind;
  if (!RESOLUTION_KINDS.includes(resolutionKind)) return res.status(400).json({ error: 'invalid resolution kind' });
  const includedSteps = Array.isArray(req.body?.includedSteps) ? req.body.includedSteps.filter((step) => typeof step === 'string') : recommendation.steps;
  const proposal = { ...recommendation, selectedKind: resolutionKind, includedSteps, note: String(req.body?.note || ''), generatedAt: Date.now(), generatedBy: req.user.id };
  await db.prepare(`UPDATE genesis_object_overlaps SET resolution_kind=$1, resolution_proposal=$2, resolution_status='previewed', updated_at=$3 WHERE overlap_id=$4`)
    .run(resolutionKind, proposal, Date.now(), req.params.id);
  res.json({ proposal, nothingCommitted: true });
});

router.post('/overlaps/:id/resolution-decision', async (req, res) => {
  const overlap = await db.prepare(`SELECT * FROM genesis_object_overlaps WHERE overlap_id=$1`).get(req.params.id);
  if (!overlap) return res.status(404).json({ error: 'overlap record not found' });
  const decision = String(req.body?.decision || '');
  if (!['approved_plan', 'deferred', 'rejected'].includes(decision)) return res.status(400).json({ error: 'invalid resolution decision' });
  if (decision === 'approved_plan' && (!overlap.resolution_proposal || !Object.keys(overlap.resolution_proposal).length)) return res.status(400).json({ error: 'preview a resolution proposal before approval' });
  const now = Date.now();
  await db.prepare(`UPDATE genesis_object_overlaps SET resolution_status=$1, resolution_note=$2, decided_by=$3, decided_at=$4, updated_at=$4 WHERE overlap_id=$5`)
    .run(decision, String(req.body?.note || ''), req.user.id, now, req.params.id);
  res.json({ ok: true, overlapId: req.params.id, resolutionStatus: decision, implementationStatus: decision === 'approved_plan' ? 'pending_migration' : 'not_started', decidedAt: now });
});

export default router;
