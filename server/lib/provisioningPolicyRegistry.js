// Member Entitlement Provisioning — global process config (2026-07-13).
//
// "I want the Salt Basin provisioning process to follow a global process for
// all provisioning regardless of sales channel origin, but we're only going
// to build it out for the direct to consumer path for now." This registry is
// that global process definition: stage gates, module→content-rod mapping,
// and security policy are all here so a licensing company can reconfigure
// the process (or override the Salt Basin default template) without a code
// change. Only the direct_to_consumer origin has real formation/provisioning
// logic today (see memberProvisioning.js) — organization_provisioned is
// modeled in schema (journey_data_rods.provisioning_origin,
// rod_relationship_type='member_organization_provisioning') but not
// implemented, per Betsy's explicit scoping.
//
// Global by default, org-scoped by override — same pattern as the EIDOS
// definition tables (org_id NULL = platform default, org_id set = override).
// No override table exists yet (no product/org has asked to diverge from
// the Salt Basin template) — add one only when a real org needs it, not
// speculatively.

// Provisioning origins. Only DIRECT_TO_CONSUMER has real logic; the others
// are recorded so the schema/vocabulary doesn't need to change when the
// organization path is built.
export const PROVISIONING_ORIGINS = Object.freeze({
  DIRECT_TO_CONSUMER: 'direct_to_consumer',
  ORGANIZATION_PROVISIONED: 'organization_provisioned',
});

// Member Entitlement Channel Rod stage gates — the Salt Basin default
// template. `current_stage` on the entitlement rod moves through these in
// order; each stage names the interaction/event that advances it, not a
// fixed timestamp. A licensing company can define its own stage list and
// interaction bindings without touching this module (see
// resolveProvisioningTemplate below).
export const SALT_BASIN_ENTITLEMENT_STAGES = Object.freeze([
  { key: 'requested', label: 'Requested', advanceEvent: 'entitlement_rod_created' },
  { key: 'credentials_prepared', label: 'Credentials prepared', advanceEvent: 'credentials_resolved' },
  { key: 'welcome_email_sending', label: 'Welcome email sending', advanceEvent: 'welcome_email_dispatch_attempted' },
  { key: 'provisioned', label: 'Provisioned', advanceEvent: 'welcome_email_confirmed_sent' },
  { key: 'onboarding', label: 'Onboarding', advanceEvent: 'first_login' },
  { key: 'active', label: 'Active', advanceEvent: 'member_channel_rod_active' },
]);

// Modules a Member Entitlement Channel Rod can represent. Each module that
// has real backing content declares which Channel Rod type it provisions
// alongside the entitlement rod (contentRodType: null = entitlement-only,
// no separate content rod needed).
export const SALT_BASIN_MODULES = Object.freeze({
  personal_brand_website: {
    moduleKey: 'personal_brand_website',
    label: 'Personal Brand Website',
    contentRodType: 'public_site',
    description: "The Member's Personal Brand Website/World configuration.",
  },
  resume_career: {
    moduleKey: 'resume_career',
    label: 'Resume Output Creator (Career Master)',
    contentRodType: 'career_master',
    description: "The Member's Career Master — Career Atoms and Resume Output Projection.",
  },
});

// Configurable interaction types tracked per module (fed into
// analytics_events as event_type, object_type='member_entitlement_rod').
// A licensing company can add/remove tracked interaction types per module
// without a code change to the tracking call sites (see
// server/lib/usageTracking.js), which just look up this list to validate
// what's being recorded.
export const SALT_BASIN_TRACKED_INTERACTIONS = Object.freeze({
  personal_brand_website: ['login', 'site_edit', 'site_publish', 'site_preview'],
  // career_prospect_* entries formalize the Career Prospect public layout
  // (2026-07-27) as this same module's Orbit — a new tracked-interaction
  // entry, not a new module or new tracking infrastructure, per the
  // salt-basin-channel-journey-architecture skill's reuse-first law.
  resume_career: [
    'login', 'career_atom_edit', 'resume_output_generated', 'resume_output_downloaded',
    'career_prospect_page_viewed', 'career_rollup_queried',
  ],
});

// Security policy for the DTC provisioning path.
export const PROVISIONING_SECURITY_POLICY = Object.freeze({
  // If the Member Channel Rod's originating lead has a password_hash on
  // file, copy that hash directly into the new user record rather than
  // re-deriving or emailing a password — the plaintext is never known to
  // this system in either case.
  reuseLeadPasswordHashWhenAvailable: true,
  // Otherwise: issue a password_reset_tokens row and email a "set your
  // password" link (the same mechanism /api/auth/forgot-password already
  // uses) — never generate and email a plaintext password.
  newAccountFlow: 'password_reset_token_link',
  passwordSetTokenTtlMs: 60 * 60 * 1000, // 1 hour, matches server/routes/auth.js RESET_TTL_MS
  // Roadmap, not implemented: tracked here so the requirement is recorded
  // in code, not only in conversation.
  multiFactorAuthentication: { status: 'roadmap', implemented: false },
});

export function resolveProvisioningTemplate(_orgId = null) {
  // No org override table exists yet — always the Salt Basin default until
  // a real org needs to diverge. Kept as a function (not a bare export) so
  // callers already have the override seam when that day comes.
  return {
    stages: SALT_BASIN_ENTITLEMENT_STAGES,
    modules: SALT_BASIN_MODULES,
    trackedInteractions: SALT_BASIN_TRACKED_INTERACTIONS,
    security: PROVISIONING_SECURITY_POLICY,
  };
}

export function isKnownModule(moduleKey) {
  return Object.prototype.hasOwnProperty.call(SALT_BASIN_MODULES, moduleKey);
}
