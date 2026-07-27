export const WORLD_REGISTRY = Object.freeze({
  foundation: { id: 'foundation', label: 'Foundation World', product: 'foundation', choreography: 'basin-drift', focus: 'definitions', description: 'Customer-owned identities, ports, atoms, fields, compositions, policies, and Agent boundaries.' },
  journey: { id: 'journey', canonicalId: 'channel', label: 'Channel Rod', product: 'channel', legacyAliases: ['Journey Rod'], choreography: 'rod-traverse', focus: 'channel', description: 'Temporal-destination axes, Tributaries, Confluences, settlement, and divergence.' },
  query: { id: 'query', canonicalId: 'query-channel', label: 'Query Channel', product: 'query', legacyAliases: ['Query Journey'], choreography: 'query-compression', focus: 'lineage', description: 'Content-addressed retrieval with every contributing Channel Rod, Atom, rule version, and effective period.' },
  career: { id: 'career', label: 'Career World', product: 'career', choreography: 'career-constellation-traverse', focus: 'career', description: 'Roles, outcomes, capabilities, evidence, resumes, and public-safe outputs.' },
  pricing: { id: 'pricing', label: 'Pricing World', product: 'pricing', choreography: 'pricing-field-orbit', focus: 'pricing', description: 'Offers, meters, tiers, commitments, economics, and governed price versions.' },
  infrastructure: { id: 'infrastructure', label: 'Infrastructure World', product: 'infrastructure', choreography: 'infrastructure-flythrough', focus: 'topology', description: 'Ports, databases, cloud services, racks, dependencies, controls, and operating state.' },
  templates: { id: 'templates', label: 'Template World', product: 'templates', choreography: 'portfolio-observatory', focus: 'outputs', description: 'Reusable resume, executive-summary, capability-card, process, and architecture compositions.' },
});

export const ROTATION_CHOREOGRAPHY_REGISTRY = Object.freeze({
  'basin-drift': { angularVelocity: 0.035, elevation: 0.22, distance: 38, easing: 'sine' },
  'rod-traverse': { angularVelocity: 0.018, elevation: 0.12, distance: 32, easing: 'cubic' },
  'query-compression': { angularVelocity: 0.08, elevation: 0.28, distance: 26, easing: 'exponential' },
  'career-constellation-traverse': { angularVelocity: 0.045, elevation: 0.3, distance: 36, easing: 'sine' },
  'pricing-field-orbit': { angularVelocity: 0.055, elevation: 0.2, distance: 30, easing: 'cubic' },
  'infrastructure-flythrough': { angularVelocity: 0.025, elevation: 0.08, distance: 42, easing: 'cubic' },
  'portfolio-observatory': { angularVelocity: 0.03, elevation: 0.26, distance: 40, easing: 'sine' },
});

export function getWorldDefinition(worldId) {
  return WORLD_REGISTRY[worldId] || WORLD_REGISTRY.journey;
}
