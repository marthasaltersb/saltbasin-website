// Tributary Registry (2026-07-16) — the one config-driven place that names
// every valid connection between Channel Journeys (a Channel instance — a
// row in journey_data_rods) and, per Betsy's own definition given directly
// during planning: "a Tributary connects (a) multiple Channel Journeys that
// share Atoms/Molecules, and (b) a sub-Channel-Journey (an alternate route)
// to its main-route Channel Journey." This is deliberately the ONE
// mechanism for that pattern — every existing Tributary this session built
// by hand (member->member_entitlement->public_site/career_master) is
// retrofitted onto this registry, and every future one (career_master-
// >resume_output_projections, the future organization-provisioning path,
// anything after that) is a new entry here, not new bespoke insert code.
//
// Two child shapes, because they genuinely are different:
//   - 'journey': the child is itself a Channel Journey — a plain
//     journey_data_rods row. One generic insert path handles all of these
//     (createJourneyTributary below).
//   - 'satellite': the child is a specialized table with its own typed
//     columns (resume_output_projections has fingerprint/atom_count/
//     output_status — a real, different shape, not a journey_data_rods
//     row pretending to be generic). The registry still validates these —
//     validateTributary() — but the actual INSERT stays with the satellite
//     table's own module (resumeProjection.js), which adds parent_rod_id +
//     rod_relationship_type columns alongside its specific fields.
import { db } from '../db.js';

export const TRIBUTARY_TYPES = Object.freeze({
  member_entitlement_provisioning: {
    parentJourneyType: 'member',
    childKind: 'journey',
    childJourneyType: 'member_entitlement',
    cardinality: 'one_to_many',
    description: 'Member Channel Journey provisions a Member Entitlement Channel Journey per module.',
  },
  member_public_site_provisioning: {
    parentJourneyType: 'member_entitlement',
    childKind: 'journey',
    childJourneyType: 'public_site',
    cardinality: 'one_to_one',
    description: 'Personal Brand Website module entitlement provisions a Public Site Channel Journey.',
  },
  member_career_provisioning: {
    parentJourneyType: 'member_entitlement',
    childKind: 'journey',
    childJourneyType: 'career_master',
    cardinality: 'one_to_one',
    description: 'Resume/Career module entitlement provisions a Career Master Channel Journey.',
  },
  career_resume_projection: {
    parentJourneyType: 'career_master',
    childKind: 'satellite',
    childTable: 'resume_output_projections',
    cardinality: 'one_to_many',
    description: 'Career Master Channel Journey projects Resume Output snapshots (a satellite table, not a journey).',
  },
  resume_output_layout_tributary: {
    parentKind: 'satellite',
    parentTable: 'resume_output_projections',
    childKind: 'config',
    cardinality: 'one_to_one',
    description: "Lets a Resume Output Projection's layout be configured from the 3D Career Orbit world — same row, layoutConfig field, not a new object. Wired in Phase 3.",
    status: 'not_yet_wired',
  },
  member_organization_provisioning: {
    parentJourneyType: 'customer',
    childKind: 'journey',
    childJourneyType: 'member',
    cardinality: 'one_to_many',
    description: 'Future: a Member Organization Channel Journey provisions Member Channel Journeys for its people, with email-identifier duplicate-detection.',
    status: 'not_implemented',
  },
});

/**
 * Validates that `tributaryType` is a real, implemented Tributary and that
 * `parentJourney` (a journey_data_rods row, or null for a satellite-rooted
 * Tributary) is the correct parent type for it. Throws if not — this is the
 * one gate every Tributary creator must pass through, journey or satellite.
 */
export function validateTributary(tributaryType, parentJourney) {
  const def = TRIBUTARY_TYPES[tributaryType];
  if (!def) throw new Error(`Unknown Tributary type: "${tributaryType}"`);
  if (def.status === 'not_implemented') throw new Error(`Tributary type "${tributaryType}" is defined but not implemented yet.`);
  if (def.parentJourneyType) {
    if (!parentJourney) throw new Error(`Tributary "${tributaryType}" requires a parent Channel Journey (rod_type="${def.parentJourneyType}").`);
    if (parentJourney.rod_type !== def.parentJourneyType) {
      throw new Error(`Tributary "${tributaryType}" requires parent rod_type="${def.parentJourneyType}", got "${parentJourney.rod_type}".`);
    }
  }
  return def;
}

/**
 * Generic insert for the 'journey' child case — every child-is-a-Channel-
 * Journey Tributary (member->member_entitlement, member_entitlement->
 * public_site/career_master, and any future one) goes through this same
 * path instead of a bespoke INSERT per feature.
 */
export async function createJourneyTributary({ parentJourney, tributaryType, moduleKey = null, provisioningOrigin = null, stage = 'requested', metadata = {} }) {
  const def = validateTributary(tributaryType, parentJourney);
  if (def.childKind !== 'journey') throw new Error(`Tributary "${tributaryType}" is childKind="${def.childKind}", not "journey" — use the satellite table's own insert instead.`);

  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, parent_rod_id, rod_relationship_type, module_key, provisioning_origin, current_stage, metadata, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9)
    RETURNING id
  `).run(def.childJourneyType, parentJourney.user_id, parentJourney.id, tributaryType, moduleKey, provisioningOrigin, stage, JSON.stringify(metadata), now);
  const id = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created',$2,$3::jsonb,$4)`)
    .run(id, stage, JSON.stringify(metadata), now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(id);
}

export function tributaryDefinition(tributaryType) {
  return TRIBUTARY_TYPES[tributaryType] || null;
}
