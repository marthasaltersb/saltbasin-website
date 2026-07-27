import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';
import { computeRodSettlement, computeDivergenceBetweenRods } from '../lib/eidos.js';

const router = Router();

// Resolves "prefer the org-scoped row, fall back to the global (org_id IS
// NULL) row" for a keyed definition table — the read-side of the global/
// scoped config pattern described in docs/eidos-operating-model-playbook.md.
async function listScoped(table, keyCol, orgId, order = keyCol) {
  if (orgId) {
    return db.prepare(`SELECT * FROM ${table} WHERE org_id IS NULL OR org_id=$1 ORDER BY org_id NULLS FIRST, ${order}`).all(orgId);
  }
  return db.prepare(`SELECT * FROM ${table} WHERE org_id IS NULL ORDER BY ${order}`).all();
}

// ── L6 Rod Types ──────────────────────────────────────────────────────────
router.get('/rod-types', requireAdmin, async (_req, res) => {
  res.json({ rodTypes: await db.prepare(`SELECT * FROM journey_rod_types ORDER BY sort_order, id`).all() });
});
router.put('/rod-types/:id', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  if (!b.label) return res.status(400).json({ error: 'label is required' });
  await db.prepare(
    `INSERT INTO journey_rod_types (id,label,description,is_active,sort_order,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6)
     ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label,description=EXCLUDED.description,is_active=EXCLUDED.is_active,sort_order=EXCLUDED.sort_order,updated_at=EXCLUDED.updated_at`
  ).run(req.params.id, b.label, b.description || null, b.isActive !== false, b.sortOrder || 0, now);
  res.json({ ok: true });
});
router.delete('/rod-types/:id', requireAdmin, async (req, res) => {
  if (['revenue_lifecycle', 'member', 'customer'].includes(req.params.id)) return res.status(400).json({ error: 'The 3 live rod types cannot be deleted — deactivate instead.' });
  await db.prepare(`DELETE FROM journey_rod_types WHERE id=$1`).run(req.params.id);
  res.json({ ok: true });
});

// ── L1 Ports ──────────────────────────────────────────────────────────────
router.get('/ports', requireAdmin, async (req, res) => {
  res.json({ ports: await listScoped('data_ports', 'port_key', req.query.orgId ? Number(req.query.orgId) : null) });
});
router.put('/ports/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  if (!b.name) return res.status(400).json({ error: 'name is required' });
  const orgId = b.orgId ? Number(b.orgId) : null;
  const existing = await db.prepare(`SELECT id FROM data_ports WHERE port_key=$1 AND org_id IS NOT DISTINCT FROM $2`).get(req.params.key, orgId);
  if (existing) {
    await db.prepare(
      `UPDATE data_ports SET name=$1,port_type=$2,native_system_type=$3,environment=$4,query_mode=$5,centralization_allowed=$6,policy=$7::jsonb,is_active=$8,updated_at=$9 WHERE id=$10`
    ).run(b.name, b.portType || 'crm', b.nativeSystemType || null, b.environment || 'production', b.queryMode || 'pull', b.centralizationAllowed !== false, JSON.stringify(b.policy || {}), b.isActive !== false, now, existing.id);
  } else {
    await db.prepare(
      `INSERT INTO data_ports (port_key,org_id,name,port_type,native_system_type,environment,query_mode,centralization_allowed,policy,is_active,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$11)`
    ).run(req.params.key, orgId, b.name, b.portType || 'crm', b.nativeSystemType || null, b.environment || 'production', b.queryMode || 'pull', b.centralizationAllowed !== false, JSON.stringify(b.policy || {}), b.isActive !== false, now);
  }
  res.json({ ok: true });
});
router.delete('/ports/:key', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  await db.prepare(`DELETE FROM data_ports WHERE port_key=$1 AND org_id IS NOT DISTINCT FROM $2`).run(req.params.key, orgId);
  res.json({ ok: true });
});
router.get('/ports/:portId/source-objects', requireAdmin, async (req, res) => {
  res.json({ sourceObjects: await db.prepare(`SELECT * FROM port_source_objects WHERE port_id=$1 ORDER BY object_key`).all(req.params.portId) });
});
router.put('/ports/:portId/source-objects/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  await db.prepare(
    `INSERT INTO port_source_objects (port_id,object_key,native_object_name,business_definition,natural_key_definition,system_of_record_claim,metadata,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8)
     ON CONFLICT (port_id,object_key) DO UPDATE SET native_object_name=EXCLUDED.native_object_name,business_definition=EXCLUDED.business_definition,natural_key_definition=EXCLUDED.natural_key_definition,system_of_record_claim=EXCLUDED.system_of_record_claim,metadata=EXCLUDED.metadata,updated_at=EXCLUDED.updated_at`
  ).run(req.params.portId, req.params.key, b.nativeObjectName || req.params.key, b.businessDefinition || null, b.naturalKeyDefinition || null, b.systemOfRecordClaim || null, JSON.stringify(b.metadata || {}), now);
  res.json({ ok: true });
});
router.get('/source-objects/:sourceObjectId/fields', requireAdmin, async (req, res) => {
  res.json({ fields: await db.prepare(`SELECT * FROM port_source_fields WHERE source_object_id=$1 ORDER BY field_key`).all(req.params.sourceObjectId) });
});
router.put('/source-objects/:sourceObjectId/fields/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  await db.prepare(
    `INSERT INTO port_source_fields (source_object_id,field_key,native_field_name,business_definition,value_domain,editable_roles,metadata,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$8)
     ON CONFLICT (source_object_id,field_key) DO UPDATE SET native_field_name=EXCLUDED.native_field_name,business_definition=EXCLUDED.business_definition,value_domain=EXCLUDED.value_domain,editable_roles=EXCLUDED.editable_roles,metadata=EXCLUDED.metadata,updated_at=EXCLUDED.updated_at`
  ).run(req.params.sourceObjectId, req.params.key, b.nativeFieldName || req.params.key, b.businessDefinition || null, b.valueDomain || null, JSON.stringify(b.editableRoles || []), JSON.stringify(b.metadata || {}), now);
  res.json({ ok: true });
});

// ── L3 Semantic Field affinity/alignment rules ──────────────────────────
router.get('/affinity-rules', requireAdmin, async (req, res) => {
  res.json({ rules: await listScoped('journey_atom_affinity_rules', 'cluster_key, molecule_key', req.query.orgId ? Number(req.query.orgId) : null) });
});
router.put('/affinity-rules/:clusterKey/:moleculeKey', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  const orgId = b.orgId ? Number(b.orgId) : null;
  try {
    const existing = await db.prepare(`SELECT id FROM journey_atom_affinity_rules WHERE cluster_key=$1 AND molecule_key=$2 AND org_id IS NOT DISTINCT FROM $3`).get(req.params.clusterKey, req.params.moleculeKey, orgId);
    if (existing) {
      await db.prepare(`UPDATE journey_atom_affinity_rules SET minimum_affinity=$1,source_authority_modifier=$2,metadata=$3::jsonb,is_active=$4,updated_at=$5 WHERE id=$6`)
        .run(b.minimumAffinity ?? 0.5, b.sourceAuthorityModifier ?? 0, JSON.stringify(b.metadata || {}), b.isActive !== false, now, existing.id);
    } else {
      await db.prepare(
        `INSERT INTO journey_atom_affinity_rules (cluster_key,molecule_key,org_id,minimum_affinity,source_authority_modifier,metadata,is_active,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$8)`
      ).run(req.params.clusterKey, req.params.moleculeKey, orgId, b.minimumAffinity ?? 0.5, b.sourceAuthorityModifier ?? 0, JSON.stringify(b.metadata || {}), b.isActive !== false, now);
    }
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
router.delete('/affinity-rules/:clusterKey/:moleculeKey', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  await db.prepare(`DELETE FROM journey_atom_affinity_rules WHERE cluster_key=$1 AND molecule_key=$2 AND org_id IS NOT DISTINCT FROM $3`).run(req.params.clusterKey, req.params.moleculeKey, orgId);
  res.json({ ok: true });
});

// ── L5 Settlement ─────────────────────────────────────────────────────────
router.get('/settlement-states/:rodId', requireAdmin, async (req, res) => {
  res.json({ settlementStates: await db.prepare(`SELECT * FROM journey_rod_settlement_states WHERE rod_id=$1 ORDER BY molecule_key`).all(req.params.rodId) });
});
router.post('/settlement-states/:rodId/compute', requireAdmin, async (req, res) => {
  const moleculeKey = req.body?.moleculeKey;
  if (!moleculeKey) return res.status(400).json({ error: 'moleculeKey is required' });
  try { res.json(await computeRodSettlement(Number(req.params.rodId), moleculeKey)); } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── L7 Accounting ─────────────────────────────────────────────────────────
router.get('/accounting-policies', requireAdmin, async (req, res) => {
  res.json({ policies: await listScoped('accounting_policies', 'policy_key', req.query.orgId ? Number(req.query.orgId) : null) });
});
router.put('/accounting-policies/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  const orgId = b.orgId ? Number(b.orgId) : null;
  const existing = await db.prepare(`SELECT id FROM accounting_policies WHERE policy_key=$1 AND org_id IS NOT DISTINCT FROM $2`).get(req.params.key, orgId);
  const args = [b.framework || 'GAAP', b.legalEntity || null, b.jurisdiction || null, JSON.stringify(b.recognitionRules || {}), JSON.stringify(b.measurementRules || {}), JSON.stringify(b.allocationRules || {}), b.isActive !== false, now];
  if (existing) {
    await db.prepare(`UPDATE accounting_policies SET framework=$1,legal_entity=$2,jurisdiction=$3,recognition_rules=$4::jsonb,measurement_rules=$5::jsonb,allocation_rules=$6::jsonb,is_active=$7,updated_at=$8 WHERE id=$9`).run(...args, existing.id);
  } else {
    await db.prepare(`INSERT INTO accounting_policies (policy_key,org_id,framework,legal_entity,jurisdiction,recognition_rules,measurement_rules,allocation_rules,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$10)`).run(req.params.key, orgId, ...args);
  }
  res.json({ ok: true });
});
router.delete('/accounting-policies/:key', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  await db.prepare(`DELETE FROM accounting_policies WHERE policy_key=$1 AND org_id IS NOT DISTINCT FROM $2`).run(req.params.key, orgId);
  res.json({ ok: true });
});

router.get('/gl-accounts', requireAdmin, async (req, res) => {
  res.json({ accounts: await listScoped('gl_accounts', 'account_key', req.query.orgId ? Number(req.query.orgId) : null) });
});
router.put('/gl-accounts/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  const orgId = b.orgId ? Number(b.orgId) : null;
  const existing = await db.prepare(`SELECT id FROM gl_accounts WHERE account_key=$1 AND org_id IS NOT DISTINCT FROM $2`).get(req.params.key, orgId);
  const args = [b.nativeAccountId || null, b.legalEntity || null, b.accountType || 'asset', b.normalBalance || 'debit', b.semanticDefinition || null, JSON.stringify(b.permittedEventClasses || []), b.isActive !== false, now];
  if (existing) {
    await db.prepare(`UPDATE gl_accounts SET native_account_id=$1,legal_entity=$2,account_type=$3,normal_balance=$4,semantic_definition=$5,permitted_event_classes=$6::jsonb,is_active=$7,updated_at=$8 WHERE id=$9`).run(...args, existing.id);
  } else {
    await db.prepare(`INSERT INTO gl_accounts (account_key,org_id,native_account_id,legal_entity,account_type,normal_balance,semantic_definition,permitted_event_classes,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$10)`).run(req.params.key, orgId, ...args);
  }
  res.json({ ok: true });
});
router.delete('/gl-accounts/:key', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  await db.prepare(`DELETE FROM gl_accounts WHERE account_key=$1 AND org_id IS NOT DISTINCT FROM $2`).run(req.params.key, orgId);
  res.json({ ok: true });
});

router.get('/accounting-topologies', requireAdmin, async (req, res) => {
  res.json({ topologies: await listScoped('accounting_topology_definitions', 'topology_key', req.query.orgId ? Number(req.query.orgId) : null) });
});
router.put('/accounting-topologies/:key', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  if (!b.label) return res.status(400).json({ error: 'label is required' });
  const orgId = b.orgId ? Number(b.orgId) : null;
  const existing = await db.prepare(`SELECT id FROM accounting_topology_definitions WHERE topology_key=$1 AND org_id IS NOT DISTINCT FROM $2`).get(req.params.key, orgId);
  const args = [b.label, JSON.stringify(b.economicCompositionRequirements || []), JSON.stringify(b.requiredAccountRoles || []), JSON.stringify(b.balancingConstraints || {}), b.policyId || null, b.isActive !== false, now];
  if (existing) {
    await db.prepare(`UPDATE accounting_topology_definitions SET label=$1,economic_composition_requirements=$2::jsonb,required_account_roles=$3::jsonb,balancing_constraints=$4::jsonb,policy_id=$5,is_active=$6,updated_at=$7 WHERE id=$8`).run(...args, existing.id);
  } else {
    await db.prepare(`INSERT INTO accounting_topology_definitions (topology_key,org_id,label,economic_composition_requirements,required_account_roles,balancing_constraints,policy_id,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$9)`).run(req.params.key, orgId, ...args);
  }
  res.json({ ok: true });
});
router.delete('/accounting-topologies/:key', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  await db.prepare(`DELETE FROM accounting_topology_definitions WHERE topology_key=$1 AND org_id IS NOT DISTINCT FROM $2`).run(req.params.key, orgId);
  res.json({ ok: true });
});

router.get('/journal-entries', requireAdmin, async (req, res) => {
  const orgId = req.query.orgId ? Number(req.query.orgId) : null;
  const entries = orgId
    ? await db.prepare(`SELECT * FROM journal_entries WHERE org_id=$1 ORDER BY created_at DESC LIMIT 200`).all(orgId)
    : await db.prepare(`SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 200`).all();
  res.json({ entries });
});
router.get('/journal-entries/:id', requireAdmin, async (req, res) => {
  const entry = await db.prepare(`SELECT * FROM journal_entries WHERE id=$1`).get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
  const lines = await db.prepare(`SELECT * FROM journal_entry_lines WHERE journal_entry_id=$1 ORDER BY line_sequence`).all(req.params.id);
  res.json({ entry, lines });
});
router.post('/journal-entries', requireAdmin, async (req, res) => {
  const b = req.body || {}, now = Date.now();
  if (!Array.isArray(b.lines) || !b.lines.length) return res.status(400).json({ error: 'lines must be a non-empty array' });
  const totalDebit = b.lines.reduce((s, l) => s + Number(l.debitAmount || 0), 0);
  const totalCredit = b.lines.reduce((s, l) => s + Number(l.creditAmount || 0), 0);
  const entry = await db.prepare(
    `INSERT INTO journal_entries (org_id,rod_id,native_journal_id,legal_entity,accounting_date,posting_date,effective_date,currency,total_debit,total_credit,source_type,metadata,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$13) RETURNING *`
  ).get(b.orgId || null, b.rodId || null, b.nativeJournalId || null, b.legalEntity || null, b.accountingDate || now, b.postingDate || now, b.effectiveDate || now, b.currency || 'USD', totalDebit, totalCredit, b.sourceType || 'manual', JSON.stringify(b.metadata || {}), now);
  for (let i = 0; i < b.lines.length; i += 1) {
    const line = b.lines[i];
    await db.prepare(
      `INSERT INTO journal_entry_lines (journal_entry_id,line_sequence,gl_account_id,debit_amount,credit_amount,dimensions,description,metadata)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb)`
    ).run(entry.id, i, line.glAccountId || null, line.debitAmount || 0, line.creditAmount || 0, JSON.stringify(line.dimensions || {}), line.description || null, JSON.stringify(line.metadata || {}));
  }
  res.json({ ok: true, entry });
});

// ── L8 Reciprocal Inference (read-only in this phase, plus the stub compute) ──
router.get('/reciprocal/requirements/:topologyId', requireAdmin, async (req, res) => {
  res.json({ requirements: await db.prepare(`SELECT * FROM economic_composition_requirements WHERE topology_id=$1`).all(req.params.topologyId) });
});
router.get('/reciprocal/comparisons/:rodId', requireAdmin, async (req, res) => {
  res.json({ comparisons: await db.prepare(`SELECT * FROM reciprocity_comparisons WHERE rod_id=$1 ORDER BY computed_at DESC`).all(req.params.rodId) });
});
router.get('/reciprocal/divergences/:rodId', requireAdmin, async (req, res) => {
  res.json({ divergences: await db.prepare(`SELECT * FROM divergence_states WHERE rod_id_a=$1 OR rod_id_b=$1 ORDER BY computed_at DESC`).all(req.params.rodId) });
});
router.post('/reciprocal/divergences/compute', requireAdmin, async (req, res) => {
  const { rodIdA, rodIdB } = req.body || {};
  if (!rodIdA || !rodIdB) return res.status(400).json({ error: 'rodIdA and rodIdB are required' });
  try { res.json(await computeDivergenceBetweenRods(Number(rodIdA), Number(rodIdB))); } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
