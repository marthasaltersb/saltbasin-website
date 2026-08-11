// Lead-to-Revenue Definition Studio — Current-State Diagnostic engagement
// service (2026-08-09, Phase 2). Reuse-first: rod creation follows the same
// shape as ensureRod()/createUserJourneyRod() in journeyRods.js (not
// duplicated here since an l2r_diagnostic rod isn't scenario-instantiated —
// it accumulates evidence against many capabilities/scenarios at once, not
// one selected scenario's gates); observation/finding capture goes through
// the EXISTING upsertJourneyEvidence() unchanged; the per-domain control-
// coverage score is persisted to the EXISTING journey_rod_settlement_states
// table (2026-07-28 EIDOS schema — "computed per rod+molecule pair, never
// stored on the atom itself," exactly this shape).
//
// molecule_key convention for evidence rows on an l2r_diagnostic rod:
//   - a real capability Atom key (LTR-0001, ...) when the observation/finding
//     is confidently tied to one specific operational capability.
//   - `domain:{domainKey}` (e.g. `domain:billing_intelligence`) when only the
//     broader L2R domain is known — never fabricate a specific capability
//     match that wasn't actually made. Domain-level tagging is a legitimate,
//     honest intermediate state, not a placeholder to "fix later."
import crypto from 'node:crypto';
import { db } from '../db.js';
import { upsertJourneyEvidence } from './journeyRods.js';

function domainMoleculeKey({ capabilityMoleculeKey, domainKey }) {
  if (capabilityMoleculeKey) return capabilityMoleculeKey;
  if (domainKey) return `domain:${domainKey}`;
  return 'domain:unassigned';
}

export async function createDiagnostic({ orgId = null, userId = null, companyName, arr = null, industry = null, segment = null, activeContracts = null, transactionValue = null, notes = null }) {
  if (!companyName) throw new Error('createDiagnostic requires companyName.');
  const now = Date.now();
  const metadata = { companyName, arr, industry, segment, activeContracts, transactionValue, notes };
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, org_id, current_stage, metadata, created_at, updated_at)
    VALUES ('l2r_diagnostic',$1,$2,'intake',$3::jsonb,$4,$4) RETURNING id
  `).run(userId, orgId, metadata, now);
  const rodId = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created','intake',$2::jsonb,$3)`)
    .run(rodId, metadata, now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
}

export async function listDiagnostics() {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='l2r_diagnostic' ORDER BY created_at DESC`).all();
}

export async function getDiagnostic(rodId) {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='l2r_diagnostic'`).get(rodId);
}

/**
 * Records a current-state observation (pain point, existing-system note,
 * business rule, data-extract finding) captured collaboratively by a client
 * user and/or agent. Delegates the actual write to upsertJourneyEvidence()
 * — no bespoke evidence-writing code. sourceReference defaults to a random
 * id (not Date.now()) so rapid successive calls in an import/bulk-capture
 * loop never collide and silently overwrite each other via the evidence
 * table's ON CONFLICT UPDATE.
 */
export async function recordObservation(rodId, {
  domainKey = null, capabilityMoleculeKey = null, linkedScenarioKey = null, linkedStageKey = null,
  title, description = null, submitterRole = null, submitterName = null, sourceType = 'user_input',
  riskLevel = null, hasControls = null, controlDescription = null, frequency = null, owner = null,
  quantifiedImpact = null, sourceReference = null, metadata = {},
}) {
  if (!title) throw new Error('recordObservation requires a title.');
  const moleculeKey = domainMoleculeKey({ capabilityMoleculeKey, domainKey });
  return upsertJourneyEvidence(rodId, {
    moleculeKey,
    value: { observationType: 'pain_point', title, description, riskLevel, hasControls, controlDescription, frequency, owner, quantifiedImpact },
    sourceType,
    sourceReference: sourceReference || `observation:${crypto.randomUUID()}`,
    actorKey: submitterRole ? `${submitterRole}${submitterName ? `:${submitterName}` : ''}` : null,
    metadata: { domainKey, capabilityMoleculeKey, linkedScenarioKey, linkedStageKey, ...metadata },
  });
}

/**
 * Records an agent-synthesized diagnostic finding — a triaged conclusion
 * (not raw input) with a recommendation and a quantified recovery estimate.
 * Same evidence table, sourceType='agent_synthesis' distinguishing it from
 * a raw observation at read time.
 */
export async function recordFinding(rodId, {
  domainKey = null, capabilityMoleculeKey = null, linkedScenarioKey = null,
  findingType = 'revenue_leak', title, description = null, recommendation = null,
  estimatedAnnualRecovery = 0, priority = 'medium', summary = null,
  sourceReference = null, metadata = {},
}) {
  if (!title) throw new Error('recordFinding requires a title.');
  const moleculeKey = domainMoleculeKey({ capabilityMoleculeKey, domainKey });
  return upsertJourneyEvidence(rodId, {
    moleculeKey,
    value: { observationType: 'finding', findingType, title, description, recommendation, estimatedAnnualRecovery, priority, summary },
    sourceType: 'agent_synthesis',
    sourceReference: sourceReference || `finding:${crypto.randomUUID()}`,
    metadata: { domainKey, capabilityMoleculeKey, linkedScenarioKey, ...metadata },
  });
}

/**
 * The current-state landscape for one diagnostic: every observation/finding
 * grouped by L2R domain, plus a real (not fabricated) per-domain control-
 * coverage ratio derived from recorded hasControls values ('full'=1,
 * 'partial'=0.5, 'none'=0, averaged) — persisted to the existing
 * journey_rod_settlement_states table, keyed by this rod and the domain's
 * molecule_key. Domains with zero observations get no settlement row and no
 * score — never a guessed default.
 */
const CONTROL_COVERAGE = { full: 1, partial: 0.5, none: 0 };

export async function getLandscape(rodId) {
  const rod = await getDiagnostic(rodId);
  if (!rod) throw new Error('Diagnostic not found');
  const evidenceRows = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY observed_at DESC`).all(rodId);

  const byDomain = new Map();
  for (const row of evidenceRows) {
    const domainKey = row.metadata?.domainKey || (row.molecule_key.startsWith('domain:') ? row.molecule_key.slice(7) : null) || 'unassigned';
    if (!byDomain.has(domainKey)) byDomain.set(domainKey, { domainKey, observations: [], findings: [], totalEstimatedRecovery: 0 });
    const bucket = byDomain.get(domainKey);
    const entry = { moleculeKey: row.molecule_key, value: row.value, sourceType: row.source_type, actorKey: row.actor_key, observedAt: Number(row.observed_at), linkedScenarioKey: row.metadata?.linkedScenarioKey || null };
    if (row.value?.observationType === 'finding') {
      bucket.findings.push(entry);
      bucket.totalEstimatedRecovery += Number(row.value?.estimatedAnnualRecovery) || 0;
    } else {
      bucket.observations.push(entry);
    }
  }

  const now = Date.now();
  for (const bucket of byDomain.values()) {
    const coverageValues = bucket.observations
      .map((o) => CONTROL_COVERAGE[o.value?.hasControls])
      .filter((v) => v !== undefined);
    if (coverageValues.length) {
      const density = coverageValues.reduce((sum, v) => sum + v, 0) / coverageValues.length;
      const settlementClass = density >= 0.75 ? 'bedrock' : density >= 0.4 ? 'sediment' : density > 0 ? 'suspended' : 'surface';
      const moleculeKey = `domain:${bucket.domainKey}`;
      await db.prepare(`
        INSERT INTO journey_rod_settlement_states (rod_id, molecule_key, settlement_density, settlement_class, computed_at, metadata)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb)
        ON CONFLICT (rod_id, molecule_key) DO UPDATE SET settlement_density=EXCLUDED.settlement_density, settlement_class=EXCLUDED.settlement_class, computed_at=EXCLUDED.computed_at, metadata=EXCLUDED.metadata
      `).run(rodId, moleculeKey, density, settlementClass, now, { basis: 'control_coverage_ratio', sampleSize: coverageValues.length });
      bucket.controlCoverage = { density, settlementClass, sampleSize: coverageValues.length };
    } else {
      bucket.controlCoverage = null;
    }
  }

  const domains = Array.from(byDomain.values()).sort((a, b) => a.domainKey.localeCompare(b.domainKey));
  return {
    rod,
    domains,
    totals: {
      observationCount: evidenceRows.filter((r) => r.value?.observationType !== 'finding').length,
      findingCount: evidenceRows.filter((r) => r.value?.observationType === 'finding').length,
      totalEstimatedRecovery: domains.reduce((sum, d) => sum + d.totalEstimatedRecovery, 0),
    },
  };
}
