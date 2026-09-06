// Config-driven registry for a member's public-site (/u/:slug) access mode.
// One named list, per this project's config-over-hardcoding convention, so
// the four mode strings aren't scattered/re-typed across memberSite.js,
// members.js, nrm.js and the client. This governs *site access* (can a
// visitor even load the page), which is a distinct concern from the
// six-value Data Scope enum (MEMBER_PRIVATE/.../PUBLIC) that governs
// record/semantic-object visibility inside the platform — not a second
// competing visibility taxonomy, a different layer entirely.
//
// - UNLISTED: default. Anyone with the link can view; not gated, not listed
//   in any directory. This is every existing member's behavior today — the
//   default MUST stay this value so publishing this feature never regresses
//   an already-published site (see CLAUDE.md's deployment-safety invariants).
// - PASSWORD: requires the site's own visitor password (independent of the
//   member's login password) via POST /api/member-site/by-slug/:slug/unlock.
// - FRIENDS_ONLY: requires the viewer to be logged in with an accepted
//   member_connections row with the owner (or to be the owner themselves).
//   Reuses the connection-request system already built in members.js — a
//   "friend request" is exactly a member_connections row.
// - PUBLIC_SEARCHABLE: open, and the member additionally appears in the
//   Salt Basin marketplace directory search (GET /api/nrm/marketplace/search).

export const VISIBILITY_MODES = {
  UNLISTED: 'unlisted',
  PASSWORD: 'password',
  FRIENDS_ONLY: 'friends_only',
  PUBLIC_SEARCHABLE: 'public_searchable',
};

export const VISIBILITY_MODE_VALUES = Object.values(VISIBILITY_MODES);

export function isValidVisibilityMode(mode) {
  return VISIBILITY_MODE_VALUES.includes(mode);
}

export function siteUnlockCookieName(userId) {
  return `sb_site_unlock_${userId}`;
}
