// EIDOS Operating Model — server-side helpers for the layers added on top of
// the existing journey_data_rods engine (server/lib/journeyRods.js). See
// docs/eidos-operating-model-playbook.md for the full model.
//
// Phase 1 is broad-shallow: the functions below are real, callable, and
// persist real rows, but intentionally implement only the simplest honest
// version of each computation (not the full settlement/reciprocal-inference
// algorithms described in the DSM claim-tree doc, which remain research
// stage). They exist so the schema has a working read/write path, not to
// claim the final math.

import { db } from '../db.js';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

export function classifySettlementDensity(density) {
  const d = clamp01(density);
  if (d <= 0.2) return 'surface';
  if (d <= 0.42) return 'water';
  if (d <= 0.6) return 'suspended';
  if (d <= 0.85) return 'sediment';
  return 'bedrock';
}

// Settlement density for one (rod, molecule) pair — computed from the
// evidence actually attached to that rod for that molecule, never stored on
// the atom/molecule definition itself. A conflicting pair of evidence rows
// (same molecule, different values, both still current) caps density at the
// "suspended" band regardless of individual confidence.
export async function computeRodSettlement(rodId, moleculeKey) {
  const evidenceRows = await db
    .prepare(`SELECT value, confidence FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2`)
    .all(rodId, moleculeKey);

  let density = 0;
  if (evidenceRows.length) {
    const avgConfidence = evidenceRows.reduce((sum, r) => sum + clamp01(r.confidence ?? 0.5), 0) / evidenceRows.length;
    const distinctValues = new Set(evidenceRows.map((r) => JSON.stringify(r.value))).size;
    const corroboration = distinctValues === 1 ? clamp01((evidenceRows.length - 1) / 2) : 0;
    density = distinctValues > 1 ? Math.min(0.6, avgConfidence) : clamp01(avgConfidence * 0.7 + corroboration * 0.3);
  }

  const now = Date.now();
  const settlementClass = classifySettlementDensity(density);
  await db
    .prepare(
      `INSERT INTO journey_rod_settlement_states (rod_id, molecule_key, settlement_density, settlement_class, computed_at)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (rod_id, molecule_key) DO UPDATE SET settlement_density=EXCLUDED.settlement_density, settlement_class=EXCLUDED.settlement_class, computed_at=EXCLUDED.computed_at`
    )
    .run(rodId, moleculeKey, density, settlementClass, now);

  return { rodId: Number(rodId), moleculeKey, settlementDensity: density, settlementClass, computedAt: now };
}

// Stub Heterosemantic Divergence entry point (L8) — compares two rods'
// stage_score (as a 0-1-ish axial proxy) and their average settlement
// density (from journey_rod_settlement_states, computed above) rather than
// the full state-vector math described in the claim-tree doc. Real enough
// to persist and query, not a claim that this is the final algorithm.
export async function computeDivergenceBetweenRods(rodIdA, rodIdB) {
  const [rodA, rodB] = await Promise.all([
    db.prepare(`SELECT stage_score FROM journey_data_rods WHERE id=$1`).get(rodIdA),
    db.prepare(`SELECT stage_score FROM journey_data_rods WHERE id=$1`).get(rodIdB),
  ]);
  if (!rodA || !rodB) throw new Error('Both rods must exist to compute divergence');

  const [densityA, densityB] = await Promise.all([
    db.prepare(`SELECT AVG(settlement_density) AS avg_density FROM journey_rod_settlement_states WHERE rod_id=$1`).get(rodIdA),
    db.prepare(`SELECT AVG(settlement_density) AS avg_density FROM journey_rod_settlement_states WHERE rod_id=$1`).get(rodIdB),
  ]);

  const coordA = clamp01(Number(rodA.stage_score) / 100);
  const coordB = clamp01(Number(rodB.stage_score) / 100);
  const axialDivergence = Math.abs(coordA - coordB);
  const densityDivergence = Math.abs(clamp01(densityA?.avg_density ?? 0) - clamp01(densityB?.avg_density ?? 0));

  const envelopeTolerance = 0.18;
  const boundaryExceeded = axialDivergence > envelopeTolerance;

  const now = Date.now();
  const row = await db
    .prepare(
      `INSERT INTO divergence_states (rod_id_a, rod_id_b, axial_divergence, density_divergence, divergence_rate, divergence_acceleration, boundary_exceeded, computed_at)
       VALUES ($1,$2,$3,$4,0,0,$5,$6) RETURNING *`
    )
    .get(rodIdA, rodIdB, axialDivergence, densityDivergence, boundaryExceeded, now);

  return row;
}
