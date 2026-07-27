export const SaltBasinLayerIndex = Object.freeze({
  IDENTITY_GOVERNANCE: 0, PORT_NETWORK: 1, EVIDENCE_ATOMS: 2,
  SEMANTIC_FIELDS: 3, CLUSTERS_COMPOSITIONS: 4, SETTLEMENT: 5,
  JOURNEY_PROJECTION: 6, ACCOUNTING_PROJECTION: 7, RECIPROCAL_STATE: 8,
  AGENT_GOVERNANCE: 9, VISUAL_SEMANTICS: 10,
});

export const LAYER_REGISTRY = Object.freeze([
  ['identity_governance', 'Identity & Governance'], ['port_network', 'Port Network'],
  ['evidence_atoms', 'Governed Evidence Atoms'], ['semantic_fields', 'Semantic Affinity Fields'],
  ['clusters_compositions', 'Clusters & Compositions'], ['settlement', 'Projection-relative Settlement'],
  ['journey_projection', 'Journey Projection'], ['accounting_projection', 'Accounting Projection'],
  ['reciprocal_state', 'Reciprocal State'], ['agent_governance', 'Agent Governance'],
  ['visual_semantics', 'Visual Semantics'],
].map(([layerKey, name], layerIndex) => ({ layerIndex, layerKey, name })));

export function semanticIdentity({ objectId, objectType, tenantId = 'salt-basin' }) {
  return `${tenantId}:${objectType}:${objectId}`;
}

export function assertRenderableIdentity(value) {
  for (const key of ['layerIndex', 'layerKey', 'objectType', 'semanticIdentity']) {
    if (value?.[key] === undefined || value[key] === '') throw new Error(`Missing semantic identity field: ${key}`);
  }
  return value;
}
