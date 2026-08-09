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
      // Member Experience Module, updated 2026-08-07: Career Placement
      // Agents (the crystal orbit world, OpportunityAgentOrbitWorld.jsx
      // variant='agentHub') is now the member's landing tab — Betsy's
      // direction that logged-in users should land on their orbit world
      // instead of a flat dashboard. Fund & Portfolio Demo (the older
      // Lonetree orbit-ring interaction layer, LonetreeMvpPanel.jsx,
      // landing tab 2026-07-30 through 2026-08-06) stays second. Career
      // Master and Output Templates remain the other two tabs — explicitly
      // NOT the guided Proposal Experience ("Your Experience"), removed from
      // the default nav 2026-07-30. Every other prior member tab (My
      // Profile/site editor, Products, Messages, My Access, Profiles,
      // Stats, Activity, Agent, Network, platform Analytics/PLM, org
      // Documents, Your Experience) is intentionally left out of the
      // default nav, not deleted as code — their panels/routes still exist,
      // just unlinked here. Restore by re-adding an entry, same as
      // 'financial' was previously handled.
      // 'config' (Site Configuration) was re-added 2026-08-07 per the
      // salt-basin-pre-build skill's Phase 2 (Personal Brand Website &
      // World, member-org-admin-config.md §2/§3) — Betsy's explicit
      // direction that members should be able to configure their own public
      // site as a real World Shell island. The full page/section content
      // editor ('content', the Sidebar+EditorPane+PreviewPane composition)
      // stays off for now — the public /u/:slug profile itself remains
      // disabled for members; 'config' only covers identity/theme/social/
      // tagline, not publishing page content.
      // 'resume' (My Resume) was removed 2026-07-30, then explicitly
      // restored 2026-08-09 — the real output-view/download/ZIP/email
      // history (server/lib/outputRendering.js) built that day needs a
      // reachable home; the panel/route never stopped existing, only the
      // nav link was gone. Restoring it here is a read-time-only additive
      // merge for existing members too (memberConfig.js's GET /draft),
      // never a write to their stored row.
      // AdminShell.jsx's initial `tab` state for scope === 'member' mirrors
      // this landing choice (careerPlacementAgents) — keep both in sync if
      // this array's first entry ever changes.
        memberTabs: [
          { id: 'agent-hub-config', label: 'My Agent Orbit', componentId: 'agentHubConfig', sortOrder: 1 },
        { id: 'careerPlacementAgents', label: 'Career Placement Agents', componentId: 'careerPlacementAgents', sortOrder: 0 },
        { id: 'lonetreeMvp', label: 'Fund & Portfolio Demo', componentId: 'lonetreeMvp', sortOrder: 5 },
        { id: 'careerMaster', label: 'Career Master', componentId: 'careerMaster', sortOrder: 10 },
        { id: 'resume', label: 'My Resume', componentId: 'resume', sortOrder: 12 },
        { id: 'outputTemplates', label: 'Output Templates', componentId: 'outputTemplates', sortOrder: 20 },
        { id: 'config', label: 'Site Configuration', componentId: 'config', sortOrder: 15 },
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
