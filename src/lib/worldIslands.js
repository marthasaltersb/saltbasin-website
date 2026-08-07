// Resolves a logged-in user's World Shell islands from data that's already
// the real "what can this user see" source of truth — a member's own
// `member_configs` navigation.memberTabs row, or the platform's admin_nav
// `crm` view tabs for admin — rather than a hardcoded four-hub list. No new
// schema: islands are permission-driven because they're derived straight
// from the same config that already gates AdminShell's tab rendering.
//
// Three island "kinds":
//  - 'docked'  — the module has a real data hook (useOpportunityPipeline-
//                based) WorldShell can render inline as a docked inspector
//                panel after the camera dollies in.
//  - 'embed'   — the module has a real, existing full-size component (too
//                big for the ~300px docked rail — e.g. ConfigPanel.jsx is
//                1600+ lines) that gets mounted full-screen (the same
//                fixed-overlay pattern Classic Tools already uses) instead
//                of squeezed into the rail. Still fully in-world — a "Back
//                to World" control, not a hand-off to a different surface.
//  - 'classic' — no dedicated in-world view built yet; dollying in hands
//                off to the Classic Tools view (the existing AdminShell/
//                MemberDashboard, mounted unchanged inside WorldShell) at
//                that exact tab. Nothing here is a dead/stubbed link — every
//                island opens real, working functionality.
export const ISLAND_REGISTRY = {
  careerPlacementAgents: { variant: 'agentHub', kind: 'docked', accent: 'gold' },
  commercialOpportunities: { variant: 'commercialPipeline', kind: 'docked', accent: 'gold' },
  config: { variant: 'table', kind: 'embed', accent: 'teal' },
  herqPublications: { variant: 'publication', kind: 'docked', accent: 'gold' },
  lonetreeMvp: { variant: 'engine', kind: 'classic', accent: 'teal' },
  careerMaster: { variant: 'founder', kind: 'classic', accent: 'pink' },
  outputTemplates: { variant: 'token', kind: 'classic', accent: 'gold' },
  leads: { variant: 'rings', kind: 'classic', accent: 'teal' },
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
