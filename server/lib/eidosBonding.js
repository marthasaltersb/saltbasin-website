// Server-side Semantic Affinity Field / Atom Cluster / Molecule / Current Arc
// engine (2026-07-27). Ports the tag-overlap/Contribution-Affinity/
// assembleMolecules math from src/lib/journeyEngine/bonding.js (the working
// client-side prototype used by the 3D spatial world) to operate on real
// journey_rod_evidence rows instead of plain client objects — kept
// numerically identical so the prototype and the persisted engine never
// diverge on what "Contribution Affinity" means.
//
// Per the salt-basin-channel-journey-architecture skill's reuse-first law:
// an Atom Cluster is computed here, on demand, every call — never persisted
// as a static pre-declared definition (that was the Career Molecules
// mistake, 2026-07-16, corrected here). A Molecule's evolving state is
// reconstructed from journey_rod_events (event-sourced), never a separately
// overwritten snapshot table.
import { db } from '../db.js';

function overlap(tagsA = [], tagsB = []) {
  return tagsA.filter((tag) => tagsB.includes(tag));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

// Identical math to journeyEngine/bonding.js's computeContributionAffinity.
function computeContributionAffinity(atomA, atomB) {
  const sharedTags = overlap(atomA.magneticProperties, atomB.magneticProperties).length;
  const maxTags = Math.max(atomA.magneticProperties?.length || 0, atomB.magneticProperties?.length || 0, 1);
  const tagAffinity = sharedTags / maxTags;
  const conflictPenalty = (atomA.conflict ? 0.5 : 0) + (atomB.conflict ? 0.5 : 0);
  return clamp01(tagAffinity - conflictPenalty * 0.3);
}

// Computes every Bond between atoms compatible with a molecule definition's
// field (share >= minAttractionOverlap tags with attractionTags). This *is*
// the Atom Cluster the Foundation doc describes — a temporary, computed
// grouping, never persisted as a static list.
export function computeBonds(atoms, moleculeDef) {
  const minOverlap = moleculeDef.minAttractionOverlap ?? 1;
  const compatible = atoms.filter(
    (atom) => overlap(atom.magneticProperties, moleculeDef.attractionTags).length >= minOverlap
  );

  const bonds = [];
  for (let i = 0; i < compatible.length; i += 1) {
    for (let j = i + 1; j < compatible.length; j += 1) {
      const a = compatible[i];
      const b = compatible[j];
      bonds.push({
        bondId: `bond::${moleculeDef.moleculeKey}::${a.atomId}::${b.atomId}`,
        moleculeKey: moleculeDef.moleculeKey,
        atomIds: [a.atomId, b.atomId],
        affinity: computeContributionAffinity(a, b),
      });
    }
  }
  return { compatibleAtoms: compatible, bonds };
}

// Assembles the current Molecule instance for one molecule definition
// against a set of real evidence atoms. Returns null if zero atoms are
// compatible — a Molecule with nothing bonded to it simply doesn't exist
// yet, it is never rendered/stored as an empty shell.
export function assembleMolecule(atoms, moleculeDef) {
  const { compatibleAtoms, bonds } = computeBonds(atoms, moleculeDef);
  if (!compatibleAtoms.length) return null;
  const maturity = compatibleAtoms.reduce((sum, a) => sum + clamp01(a.maturity), 0) / compatibleAtoms.length;
  const hasConflict = compatibleAtoms.some((a) => a.conflict);
  return {
    moleculeKey: moleculeDef.moleculeKey,
    memberAtomIds: compatibleAtoms.map((a) => a.atomId),
    bonds,
    maturity,
    conflict: hasConflict,
    // The "record/data-model state" this molecule currently represents — a
    // plain map of member atoms' captured values, directly queryable.
    recordState: compatibleAtoms.reduce((state, a) => { state[a.atomId] = a.value ?? null; return state; }, {}),
  };
}

// Loads a Rod's evidence rows shaped for the bonding engine. atomId is the
// atom's molecule_key (e.g. 'career_skill_category'); maturity defaults to
// the evidence row's own confidence (1 for confirmed migration-sourced
// evidence) unless the caller has a richer scoring source.
export async function loadRodAtoms(rodId) {
  const rows = await db.prepare(`
    SELECT id, molecule_key, value, confidence, magnetic_properties
    FROM journey_rod_evidence WHERE rod_id=$1
  `).all(rodId);
  return rows.map((row) => ({
    atomId: row.molecule_key,
    evidenceId: Number(row.id),
    magneticProperties: typeof row.magnetic_properties === 'string' ? JSON.parse(row.magnetic_properties) : (row.magnetic_properties || []),
    value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
    maturity: row.confidence != null ? clamp01(Number(row.confidence)) : 1,
    conflict: false,
  }));
}

// Loads a molecule definition (attractionTags/minAttractionOverlap) from
// journey_metadata_clusters by cluster_key.
export async function loadMoleculeDefinition(moleculeKey) {
  const row = await db.prepare(`SELECT * FROM journey_metadata_clusters WHERE cluster_key=$1`).get(moleculeKey);
  if (!row) return null;
  return {
    moleculeKey: row.cluster_key,
    label: row.label,
    attractionTags: typeof row.attraction_tags === 'string' ? JSON.parse(row.attraction_tags) : (row.attraction_tags || []),
    minAttractionOverlap: Number(row.min_attraction_overlap ?? 1),
  };
}

// ── Current Arc: event-sourced temporal state ──────────────────────────────
// Evaluating a Current's rules against a Rod's shared Atoms/Molecules
// produces a Current Arc — never a new table, an append-only
// journey_rod_events row per evaluation (event_type='current_arc_evaluated').
// Re-evaluating never overwrites a prior arc; it appends the next one.
export async function recordCurrentArc(rodId, { currentKey, portStage, portStageMaturity, stateSnapshot }) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, to_stage, metadata, created_at)
    VALUES ($1, 'current_arc_evaluated', $2, $3::jsonb, $4)
  `).run(rodId, portStage || null, { currentKey, portStage, portStageMaturity, stateSnapshot }, now);
  return { rodId, currentKey, portStage, portStageMaturity, evaluatedAt: now };
}

// Reconstructs the latest Current Arc for a given Current on a rod by
// reading the event log — never a separately maintained "current state" row.
export async function reconstructLatestCurrentArc(rodId, currentKey) {
  const rows = await db.prepare(`
    SELECT * FROM journey_rod_events
    WHERE rod_id=$1 AND event_type='current_arc_evaluated'
    ORDER BY created_at DESC
  `).all(rodId);
  for (const row of rows) {
    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    if (meta?.currentKey === currentKey) return { ...meta, evaluatedAt: Number(row.created_at) };
  }
  return null;
}

// Full ordered history of Current Arc evaluations for a given Current on a
// rod — the reconstructable temporal trajectory the Foundation doc's
// evidence-derivation law requires.
export async function reconstructCurrentArcHistory(rodId, currentKey) {
  const rows = await db.prepare(`
    SELECT * FROM journey_rod_events
    WHERE rod_id=$1 AND event_type='current_arc_evaluated'
    ORDER BY created_at ASC
  `).all(rodId);
  return rows
    .map((row) => {
      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      return meta?.currentKey === currentKey ? { ...meta, evaluatedAt: Number(row.created_at) } : null;
    })
    .filter(Boolean);
}
