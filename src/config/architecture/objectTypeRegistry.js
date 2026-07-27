import { SaltBasinLayerIndex as L } from './layerRegistry.js';

export const OBJECT_TYPE_REGISTRY = Object.freeze({
  enterprise_definition: [L.IDENTITY_GOVERNANCE, 'identity_governance'],
  port: [L.PORT_NETWORK, 'port_network'], source_observation: [L.PORT_NETWORK, 'port_network'],
  evidence_atom_definition: [L.EVIDENCE_ATOMS, 'evidence_atoms'], evidence_atom: [L.EVIDENCE_ATOMS, 'evidence_atoms'],
  semantic_affinity_field: [L.SEMANTIC_FIELDS, 'semantic_fields'],
  atom_cluster: [L.CLUSTERS_COMPOSITIONS, 'clusters_compositions'], semantic_composition: [L.CLUSTERS_COMPOSITIONS, 'clusters_compositions'],
  settlement_state: [L.SETTLEMENT, 'settlement'], resuspension_event: [L.SETTLEMENT, 'settlement'],
  journey_definition: [L.JOURNEY_PROJECTION, 'journey_projection'], journey_rod: [L.JOURNEY_PROJECTION, 'journey_projection'],
  journey_tributary: [L.JOURNEY_PROJECTION, 'journey_projection'], confluence: [L.JOURNEY_PROJECTION, 'journey_projection'],
  accounting_topology: [L.ACCOUNTING_PROJECTION, 'accounting_projection'],
  divergence_state: [L.RECIPROCAL_STATE, 'reciprocal_state'], agent_boundary: [L.AGENT_GOVERNANCE, 'agent_governance'],
  visual_semantic: [L.VISUAL_SEMANTICS, 'visual_semantics'],
});
