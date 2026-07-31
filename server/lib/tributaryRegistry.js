// Tributary Registry (2026-07-16, extended 2026-07-28) — the one
// config-driven place that names every valid connection between Channel
// Journeys (a Channel instance — a row in journey_data_rods) and, per
// Betsy's own definition given directly during planning: "a Tributary
// connects (a) multiple Channel Journeys that share Atoms/Molecules, and
// (b) a sub-Channel-Journey (an alternate route) to its main-route Channel
// Journey." This is deliberately the ONE mechanism for that pattern — every
// existing Tributary this session built by hand (member->member_entitlement
// ->public_site/career_master) is retrofitted onto this registry, and every
// future one (career_master->resume_output_projections, the future
// organization-provisioning path, anything after that) is a new entry here,
// not new bespoke insert code.
//
// Every entry now carries `relationshipKind`, distinguishing Betsy's two
// shapes above:
//   - 'hierarchical' — shape (b): a sub-Channel-Journey (an alternate route)
//     to its main-route Channel Journey. A genuine containment/ownership
//     relationship (a Member Entitlement instance belongs to one Member).
//     Persisted via parent_rod_id/rod_relationship_type on the child row —
//     createJourneyTributary() below, unchanged.
//   - 'peer' — shape (a): multiple Channel Journeys that share Atoms/
//     Molecules. A lateral business relationship between two INDEPENDENTLY
//     existing rods — never parent_rod_id, never a structural hierarchy.
//     Persisted as a row in journey_rod_tributary_links plus an
//     event-sourced trail on both rods — linkJourneyTributary() below.
//
// Two child shapes for hierarchical Tributaries, because they genuinely are
// different:
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
    relationshipKind: 'hierarchical',
    parentJourneyType: 'member',
    childKind: 'journey',
    childJourneyType: 'member_entitlement',
    cardinality: 'one_to_many',
    description: 'Member Channel Journey provisions a Member Entitlement Channel Journey per module.',
  },
  member_public_site_provisioning: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'member_entitlement',
    childKind: 'journey',
    childJourneyType: 'public_site',
    cardinality: 'one_to_one',
    description: 'Personal Brand Website module entitlement provisions a Public Site Channel Journey.',
  },
  member_career_provisioning: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'member_entitlement',
    childKind: 'journey',
    childJourneyType: 'career_master',
    cardinality: 'one_to_one',
    description: 'Resume/Career module entitlement provisions a Career Master Channel Journey.',
  },
  career_resume_projection: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'career_master',
    childKind: 'satellite',
    childTable: 'resume_output_projections',
    cardinality: 'one_to_many',
    description: 'Career Master Channel Journey projects Resume Output snapshots (a satellite table, not a journey).',
  },
  resume_output_layout_tributary: {
    relationshipKind: 'hierarchical',
    parentKind: 'satellite',
    parentTable: 'resume_output_projections',
    childKind: 'config',
    cardinality: 'one_to_one',
    description: "Lets a Resume Output Projection's layout be configured from the 3D Career Orbit world — same row, layoutConfig field, not a new object. Wired in Phase 3.",
    status: 'not_yet_wired',
  },
  member_organization_provisioning: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'customer',
    childKind: 'journey',
    childJourneyType: 'member',
    cardinality: 'one_to_many',
    description: 'Future: a Member Organization Channel Journey provisions Member Channel Journeys for its people, with email-identifier duplicate-detection.',
    status: 'not_implemented',
  },
  customer_document_delivery: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'customer',
    childKind: 'satellite',
    childTable: 'org_document_projections',
    cardinality: 'one_to_many',
    description: 'Customer Channel Journey projects gated Proposal / Product Resource documents for that organization (a satellite table, not a journey).',
  },
  fund_portfolio_company_provisioning: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'fund_deal',
    childKind: 'journey',
    childJourneyType: 'portfolio_company',
    cardinality: 'one_to_many',
    description: 'A Fund Deal Channel Journey provisions a Portfolio Company Channel Journey per acquired company (2026-07-29, Lonetree MVP build).',
  },
  member_proposal_experience: {
    relationshipKind: 'hierarchical',
    parentJourneyType: 'member',
    childKind: 'journey',
    childJourneyType: 'proposal_experience',
    cardinality: 'one_to_one',
    description: "Member Channel Journey provisions their guided Proposal/Member Experience — the bounded 9-stage (Welcome->Workspace) journey that is now every member's landing experience on login. A sibling shape to fund_deal->portfolio_company, not an overload of the Member rod's own current_stage (2026-07-29, Member Experience Module).",
  },
  member_entitlement_customer_link: {
    relationshipKind: 'peer',
    fromType: 'member_entitlement',
    toType: 'customer',
    cardinality: 'many_to_many',
    description: 'Connects a Member Entitlement Channel Journey to the Customer Channel Journey for the same Member Organization relationship — the two rods share Atoms/Molecules; neither is the other\'s structural parent.',
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
  `).run(def.childJourneyType, parentJourney.user_id, parentJourney.id, tributaryType, moduleKey, provisioningOrigin, stage, metadata, now);
  const id = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created',$2,$3::jsonb,$4)`)
    .run(id, stage, metadata, now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(id);
}

export function tributaryDefinition(tributaryType) {
  return TRIBUTARY_TYPES[tributaryType] || null;
}

/**
 * Validates that `tributaryType` is a real, implemented, `relationshipKind:
 * 'peer'` Tributary, and that the two given rods (already-existing
 * journey_data_rods rows — a peer Tributary never spawns either side) match
 * its `fromType`/`toType` in either order.
 */
export function validatePeerTributary(tributaryType, rodA, rodB) {
  const def = TRIBUTARY_TYPES[tributaryType];
  if (!def) throw new Error(`Unknown Tributary type: "${tributaryType}"`);
  if (def.status === 'not_implemented') throw new Error(`Tributary type "${tributaryType}" is defined but not implemented yet.`);
  if (def.relationshipKind !== 'peer') throw new Error(`Tributary "${tributaryType}" is relationshipKind="${def.relationshipKind || 'hierarchical'}", not "peer" — use validateTributary()/createJourneyTributary() instead.`);
  const types = [rodA?.rod_type, rodB?.rod_type];
  const matchesForward = types[0] === def.fromType && types[1] === def.toType;
  const matchesReverse = types[0] === def.toType && types[1] === def.fromType;
  if (!matchesForward && !matchesReverse) {
    throw new Error(`Tributary "${tributaryType}" requires rod_types {${def.fromType}, ${def.toType}}, got {${types[0]}, ${types[1]}}.`);
  }
  return def;
}

/**
 * Links two independently-existing rods via a `relationshipKind: 'peer'`
 * Tributary — never a parent_rod_id write. Persists the connection as a row
 * in journey_rod_tributary_links (queryable from either side) plus a
 * `tributary_connected` journey_rod_events row on EACH rod, so the
 * connection has an event-sourced trail, not just a standing reference.
 */
export async function linkJourneyTributary({ tributaryType, rodA, rodB, metadata = {} }) {
  const def = validatePeerTributary(tributaryType, rodA, rodB);
  const now = Date.now();
  const linkResult = await db.prepare(`
    INSERT INTO journey_rod_tributary_links (tributary_type, rod_a_id, rod_b_id, metadata, created_at)
    VALUES ($1,$2,$3,$4::jsonb,$5)
    ON CONFLICT (tributary_type, rod_a_id, rod_b_id) DO NOTHING
    RETURNING id
  `).run(tributaryType, rodA.id, rodB.id, metadata, now);

  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,metadata,created_at) VALUES ($1,'tributary_connected',$2::jsonb,$3)`)
    .run(rodA.id, { tributaryType, relatedRodId: rodB.id, relatedRodType: rodB.rod_type, ...metadata }, now);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,metadata,created_at) VALUES ($1,'tributary_connected',$2::jsonb,$3)`)
    .run(rodB.id, { tributaryType, relatedRodId: rodA.id, relatedRodType: rodA.rod_type, ...metadata }, now);

  return linkResult.lastInsertRowid
    ? db.prepare(`SELECT * FROM journey_rod_tributary_links WHERE id=$1`).get(Number(linkResult.lastInsertRowid))
    : db.prepare(`SELECT * FROM journey_rod_tributary_links WHERE tributary_type=$1 AND rod_a_id=$2 AND rod_b_id=$3`).get(tributaryType, rodA.id, rodB.id);
}

/**
 * Reads every peer-linked rod for a given rod, optionally filtered to one
 * Tributary type — resolves to the OTHER rod id in each link row, checking
 * both directions since a peer link is stored once but queryable from
 * either side.
 */
export async function getLinkedRods(rodId, tributaryType = null) {
  const rows = tributaryType
    ? await db.prepare(`SELECT * FROM journey_rod_tributary_links WHERE (rod_a_id=$1 OR rod_b_id=$1) AND tributary_type=$2`).all(rodId, tributaryType)
    : await db.prepare(`SELECT * FROM journey_rod_tributary_links WHERE rod_a_id=$1 OR rod_b_id=$1`).all(rodId);
  return rows.map((row) => ({
    linkId: row.id,
    tributaryType: row.tributary_type,
    linkedRodId: Number(row.rod_a_id) === Number(rodId) ? row.rod_b_id : row.rod_a_id,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    createdAt: Number(row.created_at),
  }));
}
