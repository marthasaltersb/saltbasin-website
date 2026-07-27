export const GEOMETRY_REGISTRY = Object.freeze({
  atom_crystal: { geometryId: 'atom_crystal', grammar: 'faceted-crystal' },
  cluster_field: { geometryId: 'cluster_field', grammar: 'spaced-crystal-field' },
  molecule_lattice: { geometryId: 'molecule_lattice', grammar: 'role-positioned-lattice' },
  journey_rod: { geometryId: 'journey_rod', grammar: 'precision-linear-rail' },
  tributary_channel: { geometryId: 'tributary_channel', grammar: 'bounded-divergent-channel' },
});

export const VISUAL_SEMANTIC_REGISTRY = Object.freeze({
  evidence_atom: { visualSemanticId: 'evidence_atom', geometryId: 'atom_crystal', materialId: 'crystalline-metal', colorRule: 'global-path-color', outlineRule: 'validation-state', lightingRule: 'observation-state', opacityRule: 'contribution-state', meaning: 'Independently governed evidence assertion' },
  atom_cluster: { visualSemanticId: 'atom_cluster', geometryId: 'cluster_field', materialId: 'suspended-crystal', colorRule: 'global-path-color', outlineRule: 'alignment-state', lightingRule: 'field-activity', opacityRule: 'cluster-stability', meaning: 'Temporary field-derived high-affinity grouping' },
  semantic_composition: { visualSemanticId: 'semantic_composition', geometryId: 'molecule_lattice', materialId: 'settlement-material', colorRule: 'global-path-color', outlineRule: 'conflict-count', lightingRule: 'settlement-activity', opacityRule: 'projection-settlement', meaning: 'Defined role-based semantic composition' },
  journey_rod: { visualSemanticId: 'journey_rod', geometryId: 'journey_rod', materialId: 'machined-metal', colorRule: 'journey-identity', outlineRule: 'none', lightingRule: 'coordinate-activity', opacityRule: 'always-visible', meaning: 'Persistent temporal-destination reference axis' },
  journey_tributary: { visualSemanticId: 'journey_tributary', geometryId: 'tributary_channel', materialId: 'lineage-metal', colorRule: 'persistent-tributary-lineage', outlineRule: 'confluence-state', lightingRule: 'agent-attention', opacityRule: 'bounded-state', meaning: 'Scenario-specific bounded journey flow' },
});

export const legendEntries = (activeIds = Object.keys(VISUAL_SEMANTIC_REGISTRY)) =>
  activeIds.map((id) => VISUAL_SEMANTIC_REGISTRY[id]).filter(Boolean).map((entry) => ({ ...entry, geometry: GEOMETRY_REGISTRY[entry.geometryId] }));
