// Shared client-side accessor for the public Career Master read endpoint.
// Multiple blocks (timeline, industry wheel, case studies, skills grid) on
// the same page all want this data — a single in-memory promise cache means
// only one network round-trip per page load instead of one per block.
let cachePromise = null;

export function fetchCareerMaster() {
  if (!cachePromise) {
    cachePromise = fetch('/api/career/master', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { jobs: [], skills: [], tools: [], engagements: [], domains: [] }))
      .catch(() => ({ jobs: [], skills: [], tools: [], engagements: [], domains: [] }));
  }
  return cachePromise;
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
