// Applies the resolved `scenario-library` Config Envelope into the two tables
// the evaluation engine actually reads: journey_scenarios and
// journey_gate_definitions.
//
// Two properties this deliberately guarantees:
//
//   1. Reference-safe. Every cluster / atom / stage key in the library is
//      checked against the live vocabulary FIRST, and nothing is written if any
//      reference is dangling. A gate referencing a cluster that does not exist
//      would not error at evaluation time — clusterPassed() would simply treat
//      it as unmet, so the rod would sit blocked at that stage with a confusing
//      "missing cluster" message and no way to satisfy it. Failing loudly at
//      apply time is much cheaper than debugging that later.
//
//   2. Idempotent. Scenarios upsert on scenario_key, gates on
//      (scenario_id, stage_key). Re-applying an unchanged library is a no-op
//      that reports zero changes.
//
// Gates removed from the library are deactivated (is_active=false) rather than
// deleted, so a gate that has already produced journey_rod_decisions keeps its
// referential history intact.

import { db } from '../db.js';

async function loadVocabulary() {
  const [clusters, molecules, stages] = await Promise.all([
    db.prepare('SELECT cluster_key FROM journey_metadata_clusters WHERE is_active = true').all(),
    db.prepare('SELECT molecule_key FROM journey_metadata_molecules WHERE is_active = true').all(),
    db.prepare('SELECT rod_type, stage_key FROM journey_stage_gates WHERE is_active = true').all(),
  ]);
  return {
    clusters: new Set(clusters.map((r) => r.cluster_key)),
    molecules: new Set(molecules.map((r) => r.molecule_key)),
    stagesByRodType: stages.reduce((map, r) => {
      (map[r.rod_type] ||= new Set()).add(r.stage_key);
      return map;
    }, {}),
  };
}

// Returns [] when every reference resolves. Pure once the vocabulary is loaded.
export function checkReferences(library, vocabulary) {
  const errors = [];
  for (const scenario of library.scenarios || []) {
    const at = `scenario "${scenario.scenarioKey}"`;
    const stagesForRodType = vocabulary.stagesByRodType[scenario.rodType];
    if (!stagesForRodType) errors.push(`${at}: rodType "${scenario.rodType}" has no stages in journey_stage_gates`);
    for (const key of scenario.selectedClusterKeys || []) {
      if (!vocabulary.clusters.has(key)) errors.push(`${at}: selectedClusterKeys references unknown cluster "${key}"`);
    }
    for (const gate of scenario.gates || []) {
      const gAt = `${at} gate "${gate.stageKey}"`;
      if (stagesForRodType && !stagesForRodType.has(gate.stageKey)) errors.push(`${gAt}: no such stage for rodType "${scenario.rodType}"`);
      for (const key of gate.requiredClusters || []) {
        if (!vocabulary.clusters.has(key)) errors.push(`${gAt}: requiredClusters references unknown cluster "${key}"`);
        // A gate can only require a cluster the scenario actually selected —
        // evaluateJourneyRod only loads clusters listed in selected_cluster_keys,
        // so an unselected one is permanently unmet.
        else if (!(scenario.selectedClusterKeys || []).includes(key)) errors.push(`${gAt}: requires cluster "${key}" which is not in the scenario's selectedClusterKeys — the engine only loads selected clusters, so this gate could never pass`);
      }
      for (const key of gate.requiredMolecules || []) {
        if (!vocabulary.molecules.has(key)) errors.push(`${gAt}: requiredMolecules references unknown atom "${key}"`);
      }
      for (const role of gate.requiredActorRoles || []) {
        if (!(scenario.actorRoles || []).includes(role)) errors.push(`${gAt}: requires actor role "${role}" which the scenario does not declare in actorRoles`);
      }
    }
  }
  return errors;
}

// { ok, errors?, applied: { scenarios, gates, deactivatedGates } }
export async function applyScenarioLibrary(library, { dryRun = false } = {}) {
  const vocabulary = await loadVocabulary();
  const errors = checkReferences(library, vocabulary);
  if (errors.length) return { ok: false, errors };
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      applied: {
        scenarios: (library.scenarios || []).length,
        gates: (library.scenarios || []).reduce((n, s) => n + (s.gates || []).length, 0),
        deactivatedGates: 0,
      },
    };
  }

  const now = Date.now();
  let gateCount = 0;
  let deactivated = 0;

  for (const scenario of library.scenarios || []) {
    await db.prepare(`
      INSERT INTO journey_scenarios (scenario_key, rod_type, label, description, selected_cluster_keys, dimensions, actor_roles, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,true,$8,$8)
      ON CONFLICT (scenario_key) DO UPDATE SET
        rod_type=EXCLUDED.rod_type, label=EXCLUDED.label, description=EXCLUDED.description,
        selected_cluster_keys=EXCLUDED.selected_cluster_keys, dimensions=EXCLUDED.dimensions,
        actor_roles=EXCLUDED.actor_roles, is_active=true, updated_at=EXCLUDED.updated_at
    `).run(
      scenario.scenarioKey,
      scenario.rodType,
      scenario.label || scenario.scenarioKey,
      scenario.description || null,
      scenario.selectedClusterKeys || [],
      scenario.dimensions || [],
      scenario.actorRoles || [],
      now,
    );

    const row = await db.prepare('SELECT id FROM journey_scenarios WHERE scenario_key=$1').get(scenario.scenarioKey);
    const scenarioId = row.id;
    const keptStageKeys = [];

    for (const gate of scenario.gates || []) {
      keptStageKeys.push(gate.stageKey);
      await db.prepare(`
        INSERT INTO journey_gate_definitions (scenario_id, stage_key, required_clusters, required_molecules, required_dimensions, required_actor_roles, dependency_rules, judgment_policy, human_prompt, sort_order, is_active, created_at, updated_at)
        VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,true,$11,$11)
        ON CONFLICT (scenario_id, stage_key) DO UPDATE SET
          required_clusters=EXCLUDED.required_clusters, required_molecules=EXCLUDED.required_molecules,
          required_dimensions=EXCLUDED.required_dimensions, required_actor_roles=EXCLUDED.required_actor_roles,
          dependency_rules=EXCLUDED.dependency_rules, judgment_policy=EXCLUDED.judgment_policy,
          human_prompt=EXCLUDED.human_prompt, sort_order=EXCLUDED.sort_order, is_active=true,
          updated_at=EXCLUDED.updated_at
      `).run(
        scenarioId,
        gate.stageKey,
        gate.requiredClusters || [],
        gate.requiredMolecules || [],
        gate.requiredDimensions || [],
        gate.requiredActorRoles || [],
        gate.dependencyRules || [],
        gate.judgmentPolicy || 'when_ambiguous',
        gate.humanPrompt || null,
        gate.sortOrder,
        now,
      );
      gateCount += 1;
    }

    // Deactivate, never delete — a gate may already own journey_rod_decisions.
    const removed = await db.raw`
      UPDATE journey_gate_definitions
      SET is_active = false, updated_at = ${now}
      WHERE scenario_id = ${scenarioId} AND is_active = true
        AND NOT (stage_key = ANY(${keptStageKeys}))
      RETURNING stage_key
    `;
    deactivated += removed.length;
  }

  return { ok: true, applied: { scenarios: (library.scenarios || []).length, gates: gateCount, deactivatedGates: deactivated } };
}
