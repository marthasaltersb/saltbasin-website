// Server-side evidence posting for the Public Site Dev Lifecycle journeys
// (server/data/scenarioLibrary.js) — called from the real routes that
// already do the work a stage represents (page-type/admin-nav saves,
// site draft saves/publishes), never from a second client-side tracker.
// Best-effort throughout: journey bookkeeping must never fail the caller's
// actual request (saving a page type, publishing a site) if it errors.
import { db } from '../db.js';
import { createUserJourneyRod, upsertJourneyEvidence } from './journeyRods.js';

// createUserJourneyRod() deliberately does not dedupe — "one member may
// configure more than one deal for the same scenario" (its own header
// comment) — so system-observed evidence needs its own find-or-create,
// scoped to one rod per (user, scenario) since these are structural
// journeys, not multi-instance ones like a career opportunity pipeline.
async function ensureRodId(userId, scenarioKey, label) {
  const existing = await db.prepare(
    `SELECT id FROM journey_data_rods WHERE user_id=$1 AND metadata->>'scenarioKey'=$2 LIMIT 1`
  ).get(userId, scenarioKey);
  if (existing) return existing.id;
  const created = await createUserJourneyRod(userId, { scenarioKey, label });
  return created.id;
}

// entries: [[moleculeKey, boolean], ...] — only true entries get posted;
// a false/absent fact is simply not asserted, never posted as a negative
// evidence row (there's no "unset" evidence concept in this schema).
export async function postJourneyEvidence(userId, scenarioKey, label, entries) {
  try {
    const rodId = await ensureRodId(userId, scenarioKey, label);
    await Promise.all(
      entries
        .filter(([, value]) => value)
        .map(([moleculeKey]) =>
          upsertJourneyEvidence(rodId, {
            moleculeKey,
            value: true,
            sourceType: 'system',
            sourceReference: 'server-observed',
          })
        )
    );
  } catch {
    // Non-fatal — the caller's real request (a save, a publish) already
    // succeeded before this was invoked; journey bookkeeping is additive.
  }
}
