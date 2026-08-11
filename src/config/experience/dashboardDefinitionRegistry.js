// Dashboard Definition Registry — the genuinely new piece of the multi-lens/scenario-scope design
// (DEC-001 amended, DEC-002, 2026-08-10 plan: "flickering-petting-brook"). A DashboardDefinition names a
// set of spatial-variant LENSES to show together over one converged, scoped result — "dashboard definition
// views reorganizing the individual variants together." This is presentation composition, not a new fact
// about a row, so it stays a code-owned config registry (same Object.freeze idiom as every sibling file in
// src/config/visual/ and src/config/experience/) rather than a new database table — matching
// currentRegistry.js's own precedent of staying a config registry "until a real org needs persisted custom
// [definitions]."
//
// Deliberately does NOT duplicate WORLD_VARIANT_REGISTRY or worldCompositionRegistry.js — a
// DashboardDefinition only names variantKeys; resolveDashboardComposition() (worldCompositionRegistry.js)
// resolves each one through the existing single-pair resolveWorldComposition(), never re-deriving world or
// variant definitions here.

import { WORLD_VARIANT_REGISTRY } from '../visual/worldVariantRegistry.js';

export const DASHBOARD_LAYOUTS = Object.freeze({
  SPLIT: 'split',
  GRID: 'grid',
  STACKED: 'stacked',
});

// Only variants with real rendering behind them belong in a seeded definition — seeding a dashboard with a
// structure-only variant (builder: null throughout) would render an empty, non-functional pane, the same
// overclaiming this codebase's convention avoids everywhere else (see worldVariantComponentProfiles.js's own
// "builder: null... honest about that" rule).
export const DASHBOARD_DEFINITION_REGISTRY = Object.freeze({
  'crystal-and-canyon': Object.freeze({
    dashboardId: 'crystal-and-canyon',
    label: 'Crystal Basin + Temporal Canyon',
    description: 'The two variants with real rendering behind them (salt-basin-world-variants Phase 5), shown together over the same converged, scoped result — the first real dashboard definition view.',
    variantKeys: Object.freeze(['CRYSTAL_BASIN', 'TEMPORAL_CANYON']),
    layout: DASHBOARD_LAYOUTS.SPLIT,
  }),
});

export function getDashboardDefinition(dashboardId) {
  return DASHBOARD_DEFINITION_REGISTRY[dashboardId] || null;
}

export function listDashboardDefinitions() {
  return Object.values(DASHBOARD_DEFINITION_REGISTRY);
}

// §VII-style validation, matching every sibling registry: fail if a dashboard references an unknown variant,
// an unknown layout, or has fewer than 2 lenses (a 1-lens "dashboard" is just the existing single-select
// picker, not a real dashboard definition).
export function validateDashboardDefinitionRegistry() {
  const errors = [];
  for (const [key, dashboard] of Object.entries(DASHBOARD_DEFINITION_REGISTRY)) {
    if (dashboard.dashboardId !== key) errors.push(`${key}: dashboardId field (${dashboard.dashboardId}) does not match registry key`);
    if (!Object.values(DASHBOARD_LAYOUTS).includes(dashboard.layout)) errors.push(`${key}: invalid layout "${dashboard.layout}"`);
    if ((dashboard.variantKeys || []).length < 2) errors.push(`${key}: needs at least 2 variantKeys to be a real dashboard, not a single-lens picker`);
    for (const variantKey of dashboard.variantKeys || []) {
      if (!WORLD_VARIANT_REGISTRY[variantKey]) errors.push(`${key}: unknown variantKey "${variantKey}" — not in WORLD_VARIANT_REGISTRY`);
    }
  }
  return errors;
}
