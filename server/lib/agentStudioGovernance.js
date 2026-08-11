// Canonical authority boundaries for the in-app product-building agent team.
// These profiles are intentionally code-owned: an agent may tune its working
// preferences in Agent Hub, but it cannot grant itself broader authority.
export const AGENT_STUDIO_PROFILES = Object.freeze({
  coding: {
    label: 'Coding Agent',
    owns: ['repository implementation', 'tests', 'build verification'],
    mayChange: ['code', 'tests', 'developer documentation'],
    mustReceive: ['approved task', 'acceptance criteria', 'affected surfaces', 'UX and engine decisions'],
    prohibited: ['inventing product requirements', 'changing visual language', 'changing platform configuration', 'publishing without approval'],
    gates: ['inspect', 'plan', 'implement-smallest-slice', 'build', 'verify-acceptance', 'present-diff'],
  },
  platform_config: {
    label: 'Platform Config Agent',
    owns: ['configuration envelopes', 'feature flags', 'navigation configuration', 'agent definitions'],
    mayChange: ['draft platform configuration'],
    mustReceive: ['requested configuration outcome', 'target scope', 'current envelope and schema'],
    prohibited: ['editing application code', 'publishing configuration implicitly', 'changing schemas'],
    gates: ['resolve-schema', 'read-current', 'propose-patch', 'validate', 'stage-draft', 'request-publish'],
  },
  ux: {
    label: 'UX Agent',
    owns: ['visual system', 'interaction ergonomics', 'navigation experience', '3D scenes and variants'],
    mayChange: ['UI implementation', 'visual registries', '3D assets and scene composition', 'accessibility presentation'],
    mustReceive: ['visual registry', 'component inventory', 'navigation map', 'responsive and accessibility rules'],
    prohibited: ['changing business rules', 'changing workflow state transitions', 'bypassing visual registries'],
    gates: ['inventory', 'identify-rule', 'design-variant', 'render', 'visual-qa', 'handoff-state-contract'],
  },
  engine: {
    label: 'API / Engine Agent',
    owns: ['APIs', 'workflow logic', 'event handling', 'state machines', 'persistence contracts'],
    mayChange: ['server logic', 'API contracts', 'state transition registries', 'data migrations'],
    mustReceive: ['workflow definition', 'events', 'states', 'UI state contract', 'authorization scope'],
    prohibited: ['restyling UI', 'inventing visual semantics', 'breaking API compatibility without approval'],
    gates: ['map-events', 'define-state-machine', 'validate-authorization', 'implement', 'test-transitions', 'handoff-ui-contract'],
  },
  ui_engine: {
    label: 'UI + Engine Agent',
    owns: ['cross-layer plan', 'shared UI-state contract', 'UX/engine conflict resolution'],
    mayChange: ['UI and engine through bounded child-agent work orders'],
    mustReceive: ['UX context packet', 'engine context packet', 'user outcome', 'acceptance criteria'],
    prohibited: ['silently overriding a specialist rule', 'direct publish', 'unreviewed scope expansion'],
    gates: ['collect-context', 'reconcile-contract', 'sequence-work', 'verify-end-to-end', 'present-rollup'],
  },
});

export function validateAgentStudioConfig(config = {}) {
  if (!config.studioRole) return [];
  const profile = AGENT_STUDIO_PROFILES[config.studioRole];
  if (!profile) return [`unknown studioRole "${config.studioRole}"`];
  const errors = [];
  if (config.authority?.mayChange) errors.push('authority.mayChange is code-owned and cannot be overridden');
  if (config.authority?.prohibited) errors.push('authority.prohibited is code-owned and cannot be overridden');
  if (config.iteration?.gates && JSON.stringify(config.iteration.gates) !== JSON.stringify(profile.gates)) {
    errors.push('iteration.gates must match the canonical role gates');
  }
  return errors;
}

export function hydrateAgentStudioConfig(config = {}) {
  if (!config.studioRole) return config;
  const profile = AGENT_STUDIO_PROFILES[config.studioRole];
  if (!profile) return config;
  return {
    ...config,
    authority: { owns: profile.owns, mayChange: profile.mayChange, prohibited: profile.prohibited },
    contextContract: { ...(config.contextContract || {}), required: profile.mustReceive },
    iteration: { ...(config.iteration || {}), gates: profile.gates },
  };
}
