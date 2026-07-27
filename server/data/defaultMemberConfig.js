// Default member-level config. Includes brand colors they can override on
// their own profile, social handles, opt-in for the Salt Basin home page Net
// Works banner, and a placeholder for their BYO Anthropic API key (used by
// the Config Agent once that ships).

export function defaultMemberConfig({ displayName, email }) {
  return {
    // Bump only for breaking shape changes, and pair with an explicit
    // per-member migration — never silently reinterpret old JSON under new
    // assumptions. Mirrors `version` in defaultMemberSite.js.
    schemaVersion: 1,
    navigation: {
      memberTabs: [
        { id: 'content', label: 'My Profile', componentId: 'content', sortOrder: 10 },
        { id: 'products', label: 'Products', componentId: 'products', sortOrder: 20 },
        { id: 'inbox', label: 'Messages', componentId: 'inbox', sortOrder: 30 },
        { id: 'entitlements', label: 'My Access', componentId: 'entitlements', sortOrder: 35 },
        { id: 'resume', label: 'My Resume', componentId: 'resume', sortOrder: 40 },
        { id: 'careerMaster', label: 'Career Master', componentId: 'careerMaster', sortOrder: 45 },
        { id: 'config', label: 'Config', componentId: 'config', sortOrder: 50 },
        { id: 'profiles', label: 'Profiles', componentId: 'profiles', sortOrder: 60 },
        { id: 'stats', label: 'Stats', componentId: 'stats', sortOrder: 70 },
        { id: 'audit', label: 'Activity', componentId: 'audit', sortOrder: 80 },
        { id: 'agent', label: 'Agent', componentId: 'agent', sortOrder: 90 },
        { id: 'memberNrm', label: 'Network', componentId: 'memberNrm', sortOrder: 100 },
        { id: 'memberAnalytics', label: 'Analytics', componentId: 'memberAnalytics', sortOrder: 110 },
        { id: 'memberPlm', label: 'Platform', componentId: 'memberPlm', sortOrder: 120 },
        { id: 'financial', label: 'Financial', componentId: 'financial', sortOrder: 130 },
      ],
    },
    site: {
      tagline: 'Strategic Operator',
      domain: '',
      ownerName: displayName || (email || '').split('@')[0] || 'Operator',
    },
    // Brand colors override the Salt Basin defaults on this member's profile
    // pages only. Keys map 1:1 to the --sb-* CSS vars so we can apply them via
    // an inline <style> block at the top of the profile route. Left empty by
    // default (not pinned to any theme's hex codes) so the Theme picker below
    // has full, visible control out of the box — a brand override always
    // wins over the selected theme, so baking in one theme's exact hex values
    // here would silently defeat a member's theme choice unless they noticed
    // and clicked "Clear overrides." Was previously hardcoded to Strategic
    // Operator's exact values, which is what caused that regression (fixed
    // 2026-07-16).
    brand: {
      primary: '',   // --sb-navy
      accent:  '',   // --sb-gold
      ink:     '',   // --sb-cream
      paper:   '',   // --sb-ivory
    },
    // Named theme applied as data-theme on the profile root (see brand.css
    // [data-theme] blocks). Independent of the `brand` overrides above —
    // `brand` recolors the strategic tokens directly, `theme` swaps in one
    // of the curated palettes (strategic / glow-light / glow-dark /
    // momentum-warm / lagoon / prospect). Additive field — old member rows
    // without it fall back to 'strategic' at the call site, never
    // reinterpreted. New members default to 'prospect' (2026-07-16); existing
    // members keep whatever they already have and can still pick 'strategic'.
    theme: 'prospect',
    social: {
      linkedin: { label: 'LinkedIn', on: false, url: '', color: '#0A66C2' },
      x:        { label: 'X',        on: false, url: '', color: '#000000' },
      github:   { label: 'GitHub',   on: false, url: '', color: '#181717' },
      email:    { label: 'Email',    on: false, url: '', color: '#C4843A' },
    },
    // Salt Basin home page banner opt-in. When `displayOnHome` is true, this
    // member shows up in the Net Works sliding banner under Betsy's About
    // section with `homeLogoUrl` + `homeBlurb`.
    featured: {
      displayOnHome: false,
      homeLogoUrl: '',     // upload-friendly URL; falls back to initials chip
      homeBlurb: '',       // 1–2 sentences shown on the card
      homeCompanyName: '', // optional org / brand name displayed under the logo
    },
    // Named resume presets. Each preset is { id, name, isDefault, sections[] }
    // where sections is an array of { pageKey, sectionId, sectionName }.
    // The preset marked isDefault controls what shows on the public About page.
    // Members create as many named versions as they need (Executive, Technical, etc.)
    resumePresets: [],
    // BYO Anthropic key for the Config Agent (the in-admin Claude-powered
    // editor). Stored encrypted in production; for now plain TEXT so the
    // local dev flow works. Never returned in publicConfig().
    integrations: {
      anthropicKey: '',
      anthropicModel: 'claude-sonnet-4-5',
    },
  };
}
