// Career opportunity verification agent (2026-08-09) — "constant check to
// make sure jobs in the open, unapproved pipeline are constantly re-searched
// and removed if the job is no longer on the company career website."
// Orchestrates the generic qualification-gate engine
// (opportunityPipelineRegistry.js's readQualificationGates/applyGateOutcome)
// against a member's real tracked career_opportunity_target rods — it does
// not implement verification logic itself, that lives in
// qualificationGateCheckers.js's checkType registry, and it does not invent
// a new archive mechanism, that's the existing gate action handlers.
//
// Scope: only 'discovered' (unapproved) rods are re-verified — an approved
// opportunity is the member's own confirmed decision and isn't silently
// pulled out from under them by a re-check. On-demand (a human clicks
// "Verify Pipeline Now") or dispatcher-triggered (agentDispatcher.js) —
// same function either way, same as researchCareerOpportunities().
import { db } from '../db.js';
import { getCurrent } from './currentRegistry.js';
import { readQualificationGates, applyGateOutcome } from './opportunityPipelineRegistry.js';
import { getLinkedEntities } from './tributaryRegistry.js';
import { CHECKERS } from './qualificationGateCheckers.js';

async function getOpenUnapprovedCareerOpportunities(userId) {
  const careerRod = await db.prepare(`SELECT id FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
  if (!careerRod) return [];
  return db.prepare(`
    SELECT * FROM journey_data_rods
    WHERE parent_rod_id=$1 AND rod_type='career_opportunity_target' AND current_stage='discovered'
    ORDER BY created_at ASC
  `).all(careerRod.id);
}

/**
 * Runs every gate in career_opportunity_verification_v1 against each of the
 * member's open, unapproved tracked opportunities. Stops early (rather than
 * repeating an identical failure across every remaining rod) if a checker
 * throws — same "systemic failure" reasoning as the resume queue's batch
 * loop. Returns a summary, never throws for an individual rod's gate outcome
 * (archive/flag are successful outcomes, not errors).
 */
export async function runQualificationGatesForUser(userId) {
  const current = await getCurrent('career_opportunity_verification_v1');
  if (!current) throw new Error('career_opportunity_verification_v1 Current is not configured.');
  const gates = readQualificationGates(current);

  const rods = await getOpenUnapprovedCareerOpportunities(userId);
  const results = [];
  let stopped = false;

  for (const rod of rods) {
    if (stopped) break;
    const metadata = typeof rod.metadata === 'string' ? JSON.parse(rod.metadata) : (rod.metadata || {});
    const entities = await getLinkedEntities(rod.id);
    const company = entities[0]?.canonical_name || metadata.companyName || 'the company';

    for (const gate of gates) {
      const checker = CHECKERS[gate.checkType];
      if (!checker) { results.push({ rodId: Number(rod.id), gateKey: gate.key, status: 'skipped', reason: `Unknown checkType "${gate.checkType}"` }); continue; }
      try {
        const outcome = await checker(rod, gate.params, userId);
        const applied = await applyGateOutcome(rod, gate, outcome, { company });
        results.push({ rodId: Number(rod.id), jobTitle: metadata.jobTitle, gateKey: gate.key, status: 'evaluated', passed: outcome.passed, action: applied.action, reason: applied.reason });
      } catch (e) {
        results.push({ rodId: Number(rod.id), jobTitle: metadata.jobTitle, gateKey: gate.key, status: 'failed', error: e.message });
        stopped = true; // systemic (cap hit, no key) — would repeat identically for every remaining rod
        break;
      }
    }
  }

  return {
    totalOpenUnapproved: rods.length,
    checked: results.filter((r) => r.status === 'evaluated').length,
    archived: results.filter((r) => r.status === 'evaluated' && r.action === 'archive').length,
    results,
  };
}
