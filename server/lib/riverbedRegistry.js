// Riverbed Registry (2026-07-27) — the client-scope object per the Foundation
// doc's Riverbed definition: a Member (no Organization profiles assigned) or
// a Member Organization, owning Channels and Tributaries. Not a stored row —
// resolved purely from existing journey_data_rods/org_memberships data. This
// is the reuse-first answer for "client scope" per the
// salt-basin-channel-journey-architecture skill: no new table.
import { db } from '../db.js';

// A user is Member-scoped (no organization) unless they hold at least one
// org_memberships row. A person can hold both a personal Member Riverbed and
// participate in one or more Member Organization Riverbeds simultaneously —
// canonical identity is one Member, non-exclusive roles (per the Foundation
// doc's "one identity, multiple non-equivalent Channels" law).
export async function resolveRiverbedScope(userId) {
  const memberships = await db.prepare(`SELECT org_id, role FROM org_memberships WHERE user_id=$1`).all(userId);
  if (!memberships.length) {
    return { scopeType: 'member', userId, orgIds: [] };
  }
  return {
    scopeType: 'member_org',
    userId,
    orgIds: memberships.map((m) => Number(m.org_id)),
  };
}

// All Channel Rods belonging to a Member Riverbed (user_id, no org).
export async function resolveMemberRiverbedRods(userId) {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND org_id IS NULL ORDER BY created_at ASC`).all(userId);
}

// All Channel Rods belonging to a Member Organization Riverbed (org_id).
export async function resolveOrgRiverbedRods(orgId) {
  return db.prepare(`SELECT * FROM journey_data_rods WHERE org_id=$1 ORDER BY created_at ASC`).all(orgId);
}

// Every Channel Rod a user can see across both scopes (their own personal
// rods plus any org-scoped rods from organizations they belong to) — the
// full Riverbed view for a Member who may hold both scopes at once.
export async function resolveAllRiverbedRodsForUser(userId) {
  const scope = await resolveRiverbedScope(userId);
  const memberRods = await resolveMemberRiverbedRods(userId);
  const orgRods = scope.orgIds.length
    ? await db.prepare(`SELECT * FROM journey_data_rods WHERE org_id = ANY($1::bigint[]) ORDER BY created_at ASC`).all(scope.orgIds)
    : [];
  return { scope, memberRods, orgRods };
}
