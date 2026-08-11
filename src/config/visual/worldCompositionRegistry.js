// Candidate view-composition registry. Betsy's 2026-08-10 clarification supersedes the earlier assumption
// that each domain world owns different underlying data: one governed semantic/query state is shared across
// journeys. WORLD_REGISTRY entries are navigation/view contexts, while WORLD_VARIANT_REGISTRY entries are
// presentation lenses over that shared state. Neither selection may create or own another data version.
//
// The current API remains backward-compatible with one context + one active lens while the governed
// multi-lens/scenario-scope model is designed. Every result carries the same immutable state reference so
// consumers cannot reasonably interpret the pair as a separate domain/variant data store.
//
// Not yet wired into any renderer. SpatialJourneyWorld.jsx does not read `activeWorld`/`worldId` for scene
// construction today (confirmed by this skill's Phase 1 audit — `worldId` only drives a cosmetic <select> and
// a toast). Wiring the composed result into the live renderer is the Variant Switcher's job (Phase 7 of
// salt-basin-world-variants), not this decision — this file declares the resolved shape, matching the same
// declare-before-render sequencing every other phase in this build has followed.
//
// One open observation, not resolved here: WORLD_REGISTRY's `choreography` field (resolved through
// ROTATION_CHOREOGRAPHY_REGISTRY — angularVelocity/elevation/distance/easing) is a camera/motion concern, which
// arguably belongs to the variant (spatial-metaphor) axis rather than the content-domain axis it currently
// lives on. Flagged for whoever designs Phase 7's actual switcher — not restructured here, since neither
// registry's shape needed to change to satisfy the composition decision itself.

import { WORLD_REGISTRY, getWorldDefinition } from './worldRegistry.js';
import { WORLD_VARIANT_REGISTRY, getWorldVariantDefinition } from './worldVariantRegistry.js';
import { getDashboardDefinition } from '../experience/dashboardDefinitionRegistry.js';

export const SHARED_WORLD_STATE_REFERENCE = Object.freeze({
  id: 'salt-basin-shared-semantic-query-state',
  ownership: 'shared',
  versioning: 'event-lineage',
});

// Only Crystal Basin has any real rendering behind it yet (this skill's Phase 5, partial). Every content-domain
// world defaults here until a world-specific override is deliberately added below — not because Crystal Basin
// is semantically "correct" for every domain, but because it's the only variant with a live slice to fall back
// to safely.
export const DEFAULT_VARIANT_KEY = 'CRYSTAL_BASIN';

// worldId -> variantKey override. Empty until a real per-domain default is chosen; resolveDefaultVariantForWorld()
// falls back to DEFAULT_VARIANT_KEY for every world not listed here.
export const WORLD_DEFAULT_VARIANT = Object.freeze({});

export function resolveDefaultVariantForWorld(worldId) {
  return WORLD_DEFAULT_VARIANT[worldId] || DEFAULT_VARIANT_KEY;
}

// Resolves one WorldComposition: the content-domain world (data) paired with the spatial-metaphor variant
// (presentation). `world` always resolves (getWorldDefinition falls back to 'journey' for an unknown worldId,
// matching its existing behavior — unchanged here). `variant` is null with a recorded error if variantKey is
// unknown, never silently substituted, so a caller can distinguish "no variant chosen yet" from "bad key".
export function resolveWorldComposition(worldId, variantKey) {
  const world = getWorldDefinition(worldId);
  const resolvedVariantKey = variantKey || resolveDefaultVariantForWorld(world.id);
  const variant = getWorldVariantDefinition(resolvedVariantKey);
  const errors = variant ? [] : [`Unknown variantKey "${resolvedVariantKey}" — no matching entry in WORLD_VARIANT_REGISTRY`];
  return Object.freeze({
    stateReference: SHARED_WORLD_STATE_REFERENCE,
    worldId: world.id,
    world,
    navigationContext: world,
    variantKey: resolvedVariantKey,
    variant,
    activeLens: variant,
    errors,
  });
}

// Confirms every world has a resolvable default variant and every declared override points at a real variant —
// the same "fail rather than let a profile point at an undefined key" discipline every other registry in this
// file family enforces (see worldVariantRegistry.js's validateSemanticInvariantCoverage()).
export function validateWorldCompositionRegistry() {
  const errors = [];
  for (const worldId of Object.keys(WORLD_REGISTRY)) {
    const variantKey = resolveDefaultVariantForWorld(worldId);
    if (!WORLD_VARIANT_REGISTRY[variantKey]) {
      errors.push(`${worldId}: default variant "${variantKey}" not found in WORLD_VARIANT_REGISTRY`);
    }
  }
  for (const worldId of Object.keys(WORLD_DEFAULT_VARIANT)) {
    if (!WORLD_REGISTRY[worldId]) {
      errors.push(`WORLD_DEFAULT_VARIANT: "${worldId}" is not a real entry in WORLD_REGISTRY`);
    }
  }
  return errors;
}

export function listWorldCompositions() {
  return Object.keys(WORLD_REGISTRY).map((worldId) => resolveWorldComposition(worldId, resolveDefaultVariantForWorld(worldId)));
}

// Resolves a DashboardDefinition (dashboardDefinitionRegistry.js) — several variant lenses shown together
// over ONE navigation context — by mapping resolveWorldComposition() over each of the definition's
// variantKeys. Never re-derives world/variant lookups itself; reuses the single-pair resolver per lens so
// there is exactly one place world+variant resolution logic lives. `lenses` carries one resolved composition
// per variantKey, in the definition's declared order (stable for split/grid layout rendering).
export function resolveDashboardComposition(dashboardId, worldId) {
  const dashboard = getDashboardDefinition(dashboardId);
  if (!dashboard) {
    return Object.freeze({ dashboardId, dashboard: null, worldId: null, world: null, lenses: [], errors: [`Unknown dashboardId "${dashboardId}" — no matching entry in DASHBOARD_DEFINITION_REGISTRY`] });
  }
  const lenses = dashboard.variantKeys.map((variantKey) => resolveWorldComposition(worldId, variantKey));
  const errors = lenses.flatMap((lens) => lens.errors);
  const world = lenses[0]?.world || getWorldDefinition(worldId);
  return Object.freeze({
    dashboardId, dashboard, worldId: world.id, world,
    lenses: lenses.map((lens) => Object.freeze({ variantKey: lens.variantKey, variant: lens.variant })),
    errors,
  });
}
