// Resolves a logged-in user's World Shell islands from data that's already
// the real "what can this user see" source of truth — a member's own
// `member_configs` navigation.memberTabs row, or the platform's admin_nav
// `crm` view tabs for admin — rather than a hardcoded four-hub list. No new
// schema: islands are permission-driven because they're derived straight
// from the same config that already gates AdminShell's tab rendering.
//
// Destination metadata (2026-09-06): every island — and every moon inside an
// 'atmosphere' island — is now a full destination definition, not just a
// scene-kind switch. Two new fields, uniform across every entry:
//
//  - dataBinding: { store, fields } — which persisted JSON blob this
//    destination actually reads/writes (`config_state`/`member_configs`
//    ("config"), `site_state`/`member_sites` ("site")), and which top-level
//    keys inside it. This is honest, best-effort documentation of what's
//    real today, not a new runtime data layer — nothing reads dataBinding
//    to fetch data; the panel components still own their own api.* calls.
//  - permission: { requiredRole, crud, enforced } — the intended access
//    rule in the same shape as data_entitlements.scope (capabilities/CRUD-
//    style), but `enforced: false` everywhere: no route or component checks
//    this yet. Recording the intent without claiming enforcement that isn't
//    coded is the same rule this codebase already applies to
//    agent_boundary_ref (see CLAUDE.md's Career Placement Agents section) —
//    don't repeat the mistake in a new place.
//
// Only 'content' and 'config' have been audited field-by-field (they're
// what this pass actually touched). The rest carry a best-effort
// dataBinding from what's already documented elsewhere in this codebase,
// not a fresh line-by-line audit — treat those as a starting point, not a
// verified spec.
//
// Four island "kinds":
//  - 'docked'  — the module has a real data hook (useOpportunityPipeline-
//                based) WorldShell can render inline as a docked inspector
//                panel after the camera dollies in.
//  - 'embed'   — the module has a real, existing full-size component
//                mounted full-screen (the same fixed-overlay pattern
//                Classic Tools already uses) instead of squeezed into the
//                rail. Still fully in-world — a "Back to World" control,
//                not a hand-off to a different surface.
//  - 'classic' — no dedicated in-world view built yet; dollying in hands
//                off to the Classic Tools view (the existing AdminShell/
//                MemberDashboard, mounted unchanged inside WorldShell) at
//                that exact tab. Nothing here is a dead/stubbed link — every
//                island opens real, working functionality.
//  - 'atmosphere' — a full cinematic "enter the planet" mode (2026-09-06,
//                the site editor's first): the click travels the camera
//                toward the planet while the crystal core and every other
//                island converge and shrink away, then hands off to a
//                dedicated zoomed-in scene (PlanetAtmosphereView.jsx) where
//                the planet's own `moons` array orbits it. A moon is itself
//                a small destination definition: either `destinationKey`
//                (points at another top-level ISLAND_REGISTRY entry — if
//                that destination is also 'atmosphere', PlanetAtmosphereView
//                drills straight into ITS moons, one shared definition, not
//                a duplicated copy) or `panel` (mounts a named, real
//                component directly) or neither (renders an honest "not yet
//                defined" panel — never a fabricated one).
export const ISLAND_REGISTRY = {
  // The Salt Basin Website / page-and-section editor (componentId 'content')
  // — admin's own "My Profile" tab (sortOrder 0) and, as of 2026-09-06, a
  // member's "My Website" tab too — had no registry entry here, so
  // resolveWorldIslands silently dropped it per this file's own documented
  // behavior: the platform's most central module had no planet in the world
  // at all. Given its own "Salt Tide" planet variant and moons per Betsy's
  // 2026-09-06 spec.
  content: {
    variant: 'salttide',
    kind: 'atmosphere',
    accent: 'teal',
    dataBinding: { store: 'site', fields: ['pages'] },
    permission: { requiredRole: 'owner', crud: ['read', 'update', 'publish'], enforced: false },
    // Two of this planet's connected journeys now have real stages
    // (server/data/scenarioLibrary.js) — PlanetAtmosphereView shows a
    // toggle between them (Betsy's "different connections to different
    // journeys depending on which navigation map toggle you'd want").
    // definition_journey's moons carry `scopes: ['admin']` since that
    // journey is admin-only per its own scenario metadata
    // (requiresAdminToCreate) — a member has no rod for it, so showing it
    // to them would just be a permanently-dim star for something that was
    // never theirs to start.
    journeyScenarioKeys: ['definition_journey', 'site_composition_journey'],
    moons: [
      // Site Configuration is its OWN planet definition below (Betsy,
      // 2026-09-06: "Site Configuration as a module is the planet
      // definition") — this moon just references it by key rather than
      // duplicating its scene/data/permission definition. Clicking it
      // drills straight into that destination's own moons.
      { key: 'siteConfiguration', label: 'Site Configuration', destinationKey: 'config' },
      // No defined content anywhere in the codebase yet — renders an
      // honest "not yet defined" panel rather than inventing one.
      { key: 'saltTideSettings', label: 'SaltTide Settings' },
      // Definition Journey stages — admin-only (see above).
      // "Define Page Types" has a real UI (PageTypeManagerPanel.jsx) but
      // it's a modal reachable only from inside the 'content' tab's "Add
      // Page" flow (AdminShell.jsx's setPageTypeManagerOpen), not a
      // standalone route — this moon gets you into Classic Tools at
      // 'content', the closest real, honest entry point, not a fabricated
      // direct link into the modal itself.
      { key: 'pageTypesDefined', label: 'Define Page Types', journey: 'definition_journey', stageKey: 'page_types_defined', geometry: 'tetrahedron', scopes: ['admin'], panel: 'classicTools', classicTab: 'content' },
      // No admin UI exists anywhere for editing admin_nav today — only
      // api.updateAdminNav() exists, uncalled by any component. Renders
      // the honest "not yet defined" panel rather than a fabricated link.
      { key: 'navigationStructureDefined', label: 'Define Navigation Structure', journey: 'definition_journey', stageKey: 'navigation_structure_defined', geometry: 'octahedron', scopes: ['admin'] },
      // Site Composition Journey stages — the real page/section editor.
      { key: 'pagesDefined', label: 'Define Site Pages', journey: 'site_composition_journey', stageKey: 'pages_defined', geometry: 'dodecahedron', panel: 'classicTools', classicTab: 'content' },
      { key: 'sectionsComposed', label: 'Compose Sections', journey: 'site_composition_journey', stageKey: 'sections_composed', geometry: 'icosahedron', panel: 'classicTools', classicTab: 'content' },
      { key: 'sitePublished', label: 'Publish Site', journey: 'site_composition_journey', stageKey: 'site_published', geometry: 'box', panel: 'classicTools', classicTab: 'content' },
    ],
  },
  // Promoted from a flat 'embed' (one long ConfigPanel scroll) to its own
  // 'atmosphere' planet (2026-09-06) — real moons matching ConfigPanel.jsx's
  // actual card sections. ConfigPanel itself hasn't been split into
  // separately-routable components yet (it's one 1600+ line file with
  // internally modular cards — ThemeSwatch/ColorField/ResumePresetsCard/
  // EmailManager/JiraCard/ClaudeConnectionCard/MemberDbsCard/
  // ConnectedAppsCard — but no top-level router between them), so every
  // moon below still opens the same SiteConfigView for now. The
  // dataBinding/permission split is real and ready for whenever ConfigPanel
  // is actually split into routable panels — that's the next piece, not
  // done here.
  config: {
    variant: 'table',
    kind: 'atmosphere',
    accent: 'teal',
    dataBinding: { store: 'config', fields: ['theme', 'brand', 'site', 'resumePresets', 'integrations'] },
    permission: { requiredRole: 'owner', crud: ['read', 'update', 'publish'], enforced: false },
    // Every moon below is also a real journey stage in the Design & Config
    // Setup Journey (server/data/scenarioLibrary.js, rod_type
    // public_site_dev_lifecycle) — `stageKey` matches that scenario's
    // journey_gate_definitions.stage_key exactly, and `geometry` gives each
    // one a distinct 3D shape (Betsy, 2026-09-06: stars should be
    // geometrically distinct, not the same octahedron five times).
    // PlanetAtmosphereView reads both to render real progress (brightness
    // from the actual evaluated gate, not decoration) instead of a static
    // moon ring.
    journeyScenarioKey: 'design_config_setup_journey',
    moons: [
      { key: 'themeBrand', label: 'Theme & Brand', panel: 'siteConfigView', stageKey: 'theme_and_brand', geometry: 'tetrahedron', dataBinding: { store: 'config', fields: ['theme', 'brand'] }, permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false } },
      { key: 'socialContact', label: 'Social & Contact', panel: 'siteConfigView', stageKey: 'social_and_contact', geometry: 'octahedron', dataBinding: { store: 'config', fields: ['site'] }, permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false } },
      { key: 'resumePresets', label: 'Resume Presets', panel: 'siteConfigView', stageKey: 'resume_presets', geometry: 'dodecahedron', dataBinding: { store: 'config', fields: ['resumePresets'] }, permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false } },
      { key: 'integrations', label: 'Integrations', panel: 'siteConfigView', stageKey: 'integrations', geometry: 'icosahedron', dataBinding: { store: 'config', fields: ['integrations'] }, permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false } },
      { key: 'publishConfiguration', label: 'Publish Configuration', panel: 'siteConfigView', stageKey: 'publish_configuration', geometry: 'box', dataBinding: { store: 'config', fields: [] }, permission: { requiredRole: 'owner', crud: ['read', 'update', 'publish'], enforced: false } },
    ],
  },
  careerPlacementAgents: {
    variant: 'agentHub', kind: 'docked', accent: 'gold',
    dataBinding: { store: 'journey_data_rods', fields: ['career_opportunity_target rods, journey_rod_evidence'] },
    permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false },
  },
  commercialOpportunities: {
    variant: 'commercialPipeline', kind: 'docked', accent: 'gold',
    dataBinding: { store: 'journey_data_rods', fields: ['commercial_opportunity_target rods, journey_rod_evidence'] },
    permission: { requiredRole: 'admin', crud: ['read', 'update'], enforced: false },
  },
  herqPublications: {
    variant: 'publication', kind: 'docked', accent: 'gold',
    dataBinding: { store: 'publications' },
    permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false },
  },
  lonetreeMvp: {
    variant: 'engine', kind: 'embed', accent: 'teal',
    dataBinding: { store: 'lonetree_demo' },
    permission: { requiredRole: 'owner', crud: ['read'], enforced: false },
  },
  // 'embed' (not 'classic'): dollying in stays in-world — it opens the real
  // Career Master journey chooser (Orbit / Upload & Map / Manual Intake /
  // Proficiency & Rollups / BestyStaff), the same classic AdminShell panels
  // guiding data entry, just without the full multi-tab shell chrome around
  // it. See CareerMasterEmbedView in WorldShell.jsx.
  careerMaster: {
    variant: 'founder', kind: 'embed', accent: 'pink',
    dataBinding: { store: 'career_jobs/skills/tools/engagements/domains/certifications/deals' },
    permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false },
  },
  outputTemplates: {
    variant: 'token', kind: 'embed', accent: 'gold',
    dataBinding: { store: 'output_templates' },
    permission: { requiredRole: 'owner', crud: ['read', 'update'], enforced: false },
  },
  leads: {
    variant: 'rings', kind: 'embed', accent: 'teal',
    dataBinding: { store: 'leads' },
    permission: { requiredRole: 'admin', crud: ['read', 'update'], enforced: false },
  },
};

// `tabs` — an array of `{ id, label, componentId, sortOrder, enabled }`,
// either a member's own `memberTabs` or an admin_nav view's `tabs`. Islands
// come out already ordered and only include modules this user is actually
// entitled to (whatever's present in `tabs`) that also have a registered
// crystal — an entitled tab with no registry entry yet is silently skipped
// rather than crashing the world, so adding a new module to memberTabs/
// admin_nav before it has a crystal variant never breaks the shell.
export function resolveWorldIslands(tabs = []) {
  return [...tabs]
    .filter((t) => t.enabled !== false && ISLAND_REGISTRY[t.componentId])
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((t) => ({
      key: t.id,
      componentId: t.componentId,
      label: t.label,
      ...ISLAND_REGISTRY[t.componentId],
    }));
}
