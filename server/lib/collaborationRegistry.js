// Loop 14 (§38 Real-Time Multi-User Collaboration) config. Collaboration
// behavior "must be configurable" per the master prompt — this is that
// registry, not hardcoded values in the presence route.
//
// Reuses the canonical Data Scope enum from financialPolicyRegistry.js
// rather than inventing a second visibility taxonomy (master-build-progress.md
// already decided one canonical enum). That file's name is financial-specific
// even though DATA_SCOPES itself is a general canonical enum — worth a future
// rename to a neutrally-named shared module, not done here to avoid scope
// creep on an unrelated loop.
import { DATA_SCOPES } from './financialPolicyRegistry.js';

export const PRESENCE_ACTION_STATES = Object.freeze(['viewing', 'editing', 'proposing']);

// How long a heartbeat stays valid before a presence row is considered stale
// and excluded from the "who's here" list. Polling-based today (no websocket
// transport), so this is also the effective poll-staleness window.
export const PRESENCE_TTL_MS = 45_000;

// Who may see a presence row at a given visibility_scope, expressed as
// viewer-role predicates rather than a hardcoded if/else chain in the route.
// `viewer` is { userId, isRodOwner, orgRole } — orgRole is org_memberships.role
// for the org the rod belongs to, if any.
export const PRESENCE_VISIBILITY_RULES = Object.freeze({
  MEMBER_PRIVATE: (viewer, presenceUserId) => viewer.userId === presenceUserId,
  MEMBER_PUBLIC: (viewer) => !!viewer.userId,
  ORGANIZATION_PRIVATE: (viewer) => viewer.orgRole === 'admin',
  ORGANIZATION_SHARED: (viewer) => viewer.orgRole === 'admin' || viewer.orgRole === 'member' || viewer.orgRole === 'viewer',
  CROSS_ORGANIZATION_AUTHORIZED: (viewer) => viewer.isRodOwner || viewer.orgRole === 'admin',
  PUBLIC: () => true,
});

export function canViewPresence(row, viewer) {
  const rule = PRESENCE_VISIBILITY_RULES[row.visibility_scope] || PRESENCE_VISIBILITY_RULES.ORGANIZATION_SHARED;
  return rule(viewer, Number(row.user_id));
}

export function isDataScope(value) {
  return DATA_SCOPES.includes(value);
}
