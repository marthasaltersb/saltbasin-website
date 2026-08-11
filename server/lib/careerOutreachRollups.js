// Career Outreach Effort rollups (2026-08-09) — the nested Tributary
// process "for hiring manager research and direct job outreach that can
// merge back to the application process." Orchestrates the real agents
// (hiringManagerResearchAgent.js, outreachDraftAgent.js) and the generic
// Tributary primitives (createJourneyTributary, getLinkedPersons) — this
// module doesn't implement research or drafting itself, only the rod
// lifecycle and the merge-back.
import { db } from '../db.js';
import { createJourneyTributary, getLinkedPersons } from './tributaryRegistry.js';
import { advanceOpportunityStage } from './careerOpportunityRollups.js';

function parseMetadata(rod) {
  return typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});
}

async function requireAppliedOpportunity(userId, opportunityRodId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(opportunityRodId);
  if (!rod) throw new Error('Career opportunity not found.');
  if (Number(rod.user_id) !== Number(userId)) throw new Error('Not your career opportunity.');
  if (!['applied', 'interviewing'].includes(rod.current_stage)) {
    throw new Error(`Outreach can only be started once an opportunity is Applied — this one is "${rod.current_stage}".`);
  }
  return rod;
}

/** Finds this opportunity's outreach effort rod, if one exists — never creates one. */
export async function getOutreachEffort(userId, opportunityRodId) {
  const opportunity = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(opportunityRodId);
  if (!opportunity || Number(opportunity.user_id) !== Number(userId)) return null;
  const outreachRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE parent_rod_id=$1 AND rod_type='career_outreach_effort'`).get(opportunityRodId);
  if (!outreachRod) return { opportunityRodId: Number(opportunityRodId), effort: null, contacts: [] };
  const contacts = await getLinkedPersons(opportunityRodId); // persons are linked to the opportunity rod, not the outreach rod — see tributaryRegistry.js's opportunity_person_reference
  return {
    opportunityRodId: Number(opportunityRodId),
    effort: {
      id: Number(outreachRod.id),
      currentStage: outreachRod.current_stage,
      metadata: parseMetadata(outreachRod),
      createdAt: Number(outreachRod.created_at),
    },
    contacts: contacts.map((p) => ({ id: Number(p.id), fullName: p.full_name, publicRole: p.public_role, confidenceLabel: p.confidence_label, sourceReference: p.source_reference })),
  };
}

/** Creates the outreach effort rod if it doesn't already exist (one_to_one cardinality) — the explicit "Start Outreach" action. */
export async function startOutreachEffort(userId, opportunityRodId) {
  const opportunity = await requireAppliedOpportunity(userId, opportunityRodId);
  const existing = await db.prepare(`SELECT * FROM journey_data_rods WHERE parent_rod_id=$1 AND rod_type='career_outreach_effort'`).get(opportunityRodId);
  if (existing) return getOutreachEffort(userId, opportunityRodId);

  await createJourneyTributary({
    parentJourney: opportunity,
    tributaryType: 'career_outreach_provisioning',
    stage: 'in_progress',
    metadata: { jobTitle: parseMetadata(opportunity).jobTitle || null },
  });
  return getOutreachEffort(userId, opportunityRodId);
}

const OUTCOMES = ['response_received', 'interview_scheduled', 'no_response'];

/**
 * Records the real-world outcome of an outreach effort and merges it back
 * into the parent application's stage — "merge back to the application
 * process." Only 'interview_scheduled' auto-advances the parent opportunity
 * (to 'interviewing', via the same validated advanceOpportunityStage() the
 * rest of the stage pipeline uses — if the opportunity isn't in a state
 * that allows that move, this throws rather than silently skipping it).
 * Human-confirmed, not auto-detected — there's no inbox integration in this
 * codebase to detect a reply.
 */
export async function mergeOutreachOutcomeToApplication(userId, outreachRodId, outcome) {
  if (!OUTCOMES.includes(outcome)) throw new Error(`Unknown outreach outcome "${outcome}" — must be one of ${OUTCOMES.join(', ')}.`);
  const outreachRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_outreach_effort'`).get(outreachRodId);
  if (!outreachRod) throw new Error('Outreach effort not found.');
  if (Number(outreachRod.user_id) !== Number(userId)) throw new Error('Not your outreach effort.');

  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, metadata, created_at)
    VALUES ($1,'outreach_outcome_recorded',$2::jsonb,$3)
  `).run(outreachRodId, { outcome }, now);

  let mergedOpportunity = null;
  if (outcome === 'interview_scheduled') {
    mergedOpportunity = await advanceOpportunityStage(userId, Number(outreachRod.parent_rod_id), 'interviewing');
    await db.prepare(`
      INSERT INTO journey_rod_events (rod_id, event_type, metadata, created_at)
      VALUES ($1,'outreach_merged_to_application',$2::jsonb,$3)
    `).run(outreachRodId, { toOpportunityRodId: Number(outreachRod.parent_rod_id), toStage: 'interviewing' }, now);
  }

  return { outreachRodId: Number(outreachRodId), outcome, mergedOpportunity };
}
