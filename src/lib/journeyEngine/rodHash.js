// The real-time convergence/query engine.
//
// Molecules and atoms never leave their rod — the rod is the sole source of
// truth. What the world renders as atoms "leaving" for a shared orbit or a
// compound-query hash node is a *computed projection*: this module merges a
// rod's present state with its lineage (past history + pending future
// branches, see lineage.js) into one queryable hash, on demand. That's the
// actual storage/query strategy this product models — query one rod-hash
// instead of joining across many tables.
//
// Compound queries triangulate across the three rod types for one real
// entity (a deal, an org, or a person) to produce a Customer-360 view,
// because RevOps, customer experience, and user experience all connect
// through the same three lifecycle states.

import { getAtomLineage, lineageValueAtOffset } from './lineage.js';
import { QUERY_CONTEXT_REGISTRY } from '../../config/metrics/queryContextRegistry.js';
import { calculateQueryCoverage, calculateQueryRelevance, deriveQueryEvidenceMetrics, deriveRelevanceComponents } from './queryConvergence.js';

// Converges a single rod's atoms at a given lineage offset (0 = present,
// negative = weeks ago, positive = pending branch N) into one hash result.
export function computeRodHash(rod, { atOffset = 0, queryContextId = null } = {}) {
  const atoms = (rod.stages || []).flatMap((stage) => stage.atoms || []);
  const entries = atoms.map((atomInstance) => {
    const lineage = getAtomLineage(atomInstance);
    const valueAtOffset = lineageValueAtOffset(lineage, atOffset);
    return { ...atomInstance, atomId: atomInstance.atomId, name: atomInstance.name, rodType: rod.rodType, magneticProperties: atomInstance.magneticProperties || [], lineage: atomInstance.lineage, ...valueAtOffset };
  });
  const maturity = entries.length ? entries.reduce((sum, entry) => sum + entry.maturity, 0) / entries.length : 0;

  const queryContext = queryContextId ? QUERY_CONTEXT_REGISTRY[queryContextId] : null;
  const relevance = queryContext ? entries.map((entry) => ({ atomId: entry.atomId, ...calculateQueryRelevance(deriveRelevanceComponents(entry, queryContext)) })) : null;
  return { rodId: rod.id, rodType: rod.rodType, entityLabel: rod.entityLabel, maturity, atoms: entries, queryRelevance: relevance };
}

// Headline flow: every rod spawned from the same genesis event shares an
// `entityLabel` (the deal / org / person it represents) — triangulating on
// that label converges all connected rod types into a single Customer-360
// hash, without the caller needing to know the Member-Organization branch
// wiring between them.
export function triangulateEntity(rods, entityLabel, opts = {}) {
  const connectedRods = rods.filter((rod) => rod.entityLabel === entityLabel);
  const perRod = connectedRods.map((rod) => computeRodHash(rod, opts));
  const maturity = perRod.length ? perRod.reduce((sum, hash) => sum + hash.maturity, 0) / perRod.length : 0;

  // §25 DTC rule: a rod can hold a converged semantic role (e.g. a Member
  // rod also holding Customer meaning) without a duplicate rod existing for
  // that role. convergedRodTypes lets a "find all Customer rods" query
  // recognize this rod without forcing a real Customer record into being.
  const convergedRodTypes = connectedRods.flatMap((rod) => rod.convergedRoles || []);
  const queryContext = opts.queryContextId ? QUERY_CONTEXT_REGISTRY[opts.queryContextId] : null;
  const queryCoverage = queryContext ? calculateQueryCoverage(perRod.flatMap((hash) => hash.atoms), queryContext) : null;
  const evidenceMetrics = queryContext ? deriveQueryEvidenceMetrics(perRod.flatMap((hash) => hash.atoms)) : { confidence: null, stability: null };

  return {
    entityLabel,
    rodIds: connectedRods.map((rod) => rod.id),
    rodTypes: connectedRods.map((rod) => rod.rodType),
    convergedRodTypes,
    perRod,
    maturity,
    atomCount: perRod.reduce((sum, hash) => sum + hash.atoms.length, 0),
    queryCoverage,
    queryConfidence: evidenceMetrics.confidence,
    convergenceStability: evidenceMetrics.stability,
  };
}

// Advanced/accessible fallback: converge an arbitrary manual selection of
// stages (possibly spanning rods with different entity labels), mirroring
// the reference prototype's generic multi-stage compound query.
export function triangulateStages(rods, stageIds, opts = {}) {
  const selected = [];
  rods.forEach((rod) => {
    (rod.stages || []).forEach((stage) => {
      if (stageIds.includes(stage.id)) selected.push({ rod, stage });
    });
  });

  const perStage = selected.map(({ rod, stage }) => {
    const entries = (stage.atoms || []).map((atomInstance) => {
      const lineage = getAtomLineage(atomInstance);
      const valueAtOffset = lineageValueAtOffset(lineage, opts.atOffset ?? 0);
      return { atomId: atomInstance.atomId, name: atomInstance.name, ...valueAtOffset };
    });
    const maturity = entries.length ? entries.reduce((sum, entry) => sum + entry.maturity, 0) / entries.length : 0;
    return { rodId: rod.id, rodType: rod.rodType, stageId: stage.id, stageName: stage.name, maturity, atoms: entries };
  });

  const maturity = perStage.length ? perStage.reduce((sum, hash) => sum + hash.maturity, 0) / perStage.length : 0;
  return { perStage, maturity, atomCount: perStage.reduce((sum, hash) => sum + hash.atoms.length, 0) };
}
