// Shared client-side accessor for the public Career Master read endpoint.
// Multiple blocks (timeline, industry wheel, case studies, skills grid) on
// the same page all want this data — an in-memory promise cache keyed by
// owner means only one network round-trip per page load per owner, instead
// of one per block.
//
// `ownerSlug` must be the member whose page/panel is actually being
// rendered — pass the block's own `memberSlug` prop (public site pages) or
// `'me'` (a member's own admin/editor surface, e.g. MyResumePanel). Server
// -side, GET /api/career/master resolves an EMPTY/missing owner param to
// the platform admin (server/routes/careerMaster.js resolveOwnerUserId) —
// correct for Betsy's own site, but silently shows Betsy's real career data
// on every OTHER member's page/panel if the caller forgets to pass this.
// Confirmed and fixed 2026-07-28 after it surfaced on a brand-new member's
// otherwise-empty Resume page.
const cachePromises = {};

export function fetchCareerMaster(ownerSlug = '') {
  const key = ownerSlug || '__admin__';
  if (!cachePromises[key]) {
    const ownerParam = ownerSlug ? `?owner=${encodeURIComponent(ownerSlug)}` : '';
    cachePromises[key] = fetch(`/api/career/master${ownerParam}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { jobs: [], skills: [], tools: [], engagements: [], domains: [] }))
      .catch(() => ({ jobs: [], skills: [], tools: [], engagements: [], domains: [] }));
  }
  return cachePromises[key];
}

// Proficiency tier → visual fill percentage, used by any proficiency-bar UI
// (skills grid, resume output tool badges).
export const TIER_FILL_PCT = { Expert: 100, Advanced: 75, Proficient: 50, Foundational: 25 };

export function tierFillPct(tier) {
  return TIER_FILL_PCT[tier] ?? 40;
}

// career_tools.wheel_bucket is an optional manual override; when unset,
// derive the industry-wheel exposure bucket from proficiency tier.
export function toolWheelBucket(tool) {
  if (tool.wheelBucket) return tool.wheelBucket;
  if (tool.tier === 'Expert' || tool.tier === 'Advanced') return 'hands_on';
  if (tool.tier === 'Proficient') return 'integration_design';
  return 'adjacent';
}
