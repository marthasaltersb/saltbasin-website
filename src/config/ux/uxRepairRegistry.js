// Approved repair vocabulary for deterministic UX work orders. Detection is
// automatic; design-changing recipes remain approval-bound.
export const UX_REPAIR_REGISTRY = Object.freeze({
  'ensure-minimum-tap-target': { taskType: 'css-token-patch', automatic: true, allowedSurfaces: ['css', 'inline-style'], verify: ['target-size', 'responsive-overflow'] },
  'add-accessible-name': { taskType: 'jsx-attribute-patch', automatic: true, allowedSurfaces: ['jsx'], verify: ['accessible-name'] },
  'add-main-landmark': { taskType: 'semantic-wrapper-patch', automatic: true, allowedSurfaces: ['jsx'], verify: ['single-main-landmark'] },
  'normalize-heading-order': { taskType: 'semantic-heading-patch', automatic: false, allowedSurfaces: ['jsx', 'content-schema'], verify: ['heading-order'] },
  'repair-horizontal-overflow': { taskType: 'responsive-layout-patch', automatic: false, allowedSurfaces: ['css', 'jsx'], verify: ['mobile', 'tablet', 'desktop'] },
  'add-3d-navigation-alternative': { taskType: '3d-accessibility-contract', automatic: false, allowedSurfaces: ['jsx', 'scene-manifest'], verify: ['keyboard', 'screen-reader-equivalent', 'state-parity'] },
  'bind-3d-event-state': { taskType: 'engine-state-binding', automatic: false, allowedSurfaces: ['jsx', 'engine-registry'], verify: ['event-transition', 'visual-state'] },
  'progressive-disclosure': { taskType: 'information-architecture-change', automatic: false, allowedSurfaces: ['jsx', 'content-config', 'navigation-config'], verify: ['goal-path', 'keyboard', 'responsive'] },
  'split-experience-into-goal-based-paths': { taskType: 'navigation-architecture-change', automatic: false, allowedSurfaces: ['routes', 'navigation-config', 'content-config'], verify: ['goal-path', 'back-navigation', 'deep-link'] },
  'restructure-information-architecture': { taskType: 'navigation-architecture-change', automatic: false, allowedSurfaces: ['routes', 'navigation-config', 'content-config'], verify: ['goal-path', 'findability'] },
  'clarify-primary-actions': { taskType: 'action-hierarchy-change', automatic: false, allowedSurfaces: ['jsx', 'content-config'], verify: ['primary-action-count', 'goal-path'] },
});

export function getUxRepairRecipe(recipeId) {
  return UX_REPAIR_REGISTRY[recipeId] || null;
}
