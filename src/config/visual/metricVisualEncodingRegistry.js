export const METRIC_VISUAL_ENCODING_REGISTRY = Object.freeze({
  distance_from_query_context: Object.freeze({ channel: 'distance', sourceType: 'metric', metricKey: 'QUERY_RELEVANCE', semanticRule: 'closer_is_more_relevant', transform: 'nonlinear_inverse', parameters: Object.freeze({ minRadius: 0.8, maxRadius: 6, curveFactor: 1.6 }) }),
  cluster_grouping: Object.freeze({ channel: 'cluster_grouping', sourceType: 'semantic_relationship', semanticKey: 'MOLECULE_OR_AFFINITY_GROUP', transform: 'group_membership' }),
  crystal_geometry: Object.freeze({ channel: 'geometry', sourceType: 'semantic_metadata', semanticKey: 'ATOM_METADATA_TYPE', transform: 'geometry_registry' }),
  permanent_path_color: Object.freeze({ channel: 'path_color', sourceType: 'semantic_identity', semanticKey: 'GLOBAL_PATH_COMBINATION', transform: 'resolvePathColor' }),
  opacity: Object.freeze({ channel: 'opacity', sourceType: 'metric', metricKey: 'QUERY_CONFIDENCE', semanticRule: 'higher_confidence_is_more_opaque', transform: 'linear' }),
  pulse: Object.freeze({ channel: 'pulse', sourceType: 'semantic_state', semanticKey: 'UNRESOLVED_OR_ACTIVE_CHANGE', transform: 'bounded_frequency' }),
  bounded_movement: Object.freeze({ channel: 'movement', sourceType: 'metric', metricKey: 'CONVERGENCE_STABILITY', semanticRule: 'lower_stability_has_bounded_movement', transform: 'inverse_bounded' }),
  fixed_position: Object.freeze({ channel: 'settlement', sourceType: 'metric', metricKey: 'CONVERGENCE_STABILITY', semanticRule: 'higher_stability_settles', transform: 'threshold' }),
  path_thickness: Object.freeze({ channel: 'path_thickness', sourceType: 'semantic_relationship', semanticKey: 'RELATIONSHIP_OR_LINEAGE_STRENGTH', transform: 'linear' }),
  path_style: Object.freeze({ channel: 'path_style', sourceType: 'semantic_state', semanticKey: 'RELATIONSHIP_OBSERVATION_STATE', values: Object.freeze({ inferred: 'dashed', observed: 'solid', validated: 'solid' }) }),
  branch_geometry: Object.freeze({ channel: 'branch_geometry', sourceType: 'semantic_object', semanticKey: 'JOURNEY_TRIBUTARY', transform: 'tributary_profile' }),
  merge_geometry: Object.freeze({ channel: 'merge_geometry', sourceType: 'semantic_object', semanticKey: 'CONFLUENCE', transform: 'confluence_profile' }),
  rod_segmentation: Object.freeze({ channel: 'rod_segmentation', sourceType: 'metric', metricKey: 'ROD_POSITION', semanticRule: 'segments_are_stages_and_cycles', transform: 'stage_cycle_segments' }),
  rod_fill: Object.freeze({ channel: 'rod_fill', sourceType: 'metric', metricKey: 'STAGE_COMPLETENESS', semanticRule: 'fill_is_stage_completeness_only', transform: 'linear' }),
  rod_crystal_complexity: Object.freeze({ channel: 'crystal_complexity', sourceType: 'metric', metricKey: 'CHANNEL_MATURITY', semanticRule: 'complexity_is_semantic_depth', transform: 'bounded_facets' }),
});

export const ATOM_RENDER_PROFILE = Object.freeze({
  profileId: 'atom-semantic-render-v2',
  channels: Object.freeze({
    scaleY: Object.freeze({ value: 1, semanticKey: 'ATOM_METADATA_TYPE' }),
    // Structural (not just material) maturity encoding, per rod_crystal_complexity
    // above ("complexity_is_semantic_depth" / "bounded_facets") — an Unresolved
    // atom renders as a simple low-poly bipyramid, a Trusted one as a refined
    // many-faceted crystal. min/max are radial segment counts fed straight into
    // atomGeometry.js's getBipyramidParts(THREE, radialSegments).
    facet: Object.freeze({ min: 5, max: 11, metricKey: 'CHANNEL_MATURITY' }),
    opacity: Object.freeze({ min: 0.4, max: 1, metricKey: 'QUERY_CONFIDENCE', missingValue: 1 }),
    metalness: Object.freeze({ value: 0.35, semanticKey: 'MATERIAL_PROFILE' }),
    roughness: Object.freeze({ value: 0.35, semanticKey: 'MATERIAL_PROFILE' }),
    emissive: Object.freeze({ min: 0.08, max: 0.95, semanticKey: 'RISK' }),
    halo: Object.freeze({ min: 0.25, max: 0.75 }),
  }),
  thresholds: Object.freeze({ conflictRiskFloor: 0.6, conflictHalo: 0.85 }),
  paletteRoles: Object.freeze({ conflict: 'risk', default: 'path' }),
});

export function validateVisualEncodingRegistry(registry = METRIC_VISUAL_ENCODING_REGISTRY) {
  const errors = [];
  const channels = new Map();
  for (const [id, entry] of Object.entries(registry)) {
    if (!entry.channel || (!entry.metricKey && !entry.semanticKey)) errors.push(`${id}: missing channel or semantic source`);
    const prior = channels.get(entry.channel);
    const source = entry.metricKey || entry.semanticKey;
    if (prior && prior !== source) errors.push(`${id}: channel ${entry.channel} maps to both ${prior} and ${source}`);
    channels.set(entry.channel, source);
  }
  return errors;
}

export function resolveQueryDistance(relevance, encoding = METRIC_VISUAL_ENCODING_REGISTRY.distance_from_query_context) {
  const score = Math.max(0, Math.min(1, Number(relevance) || 0));
  const { minRadius, maxRadius, curveFactor } = encoding.parameters;
  return minRadius + (maxRadius - minRadius) * ((1 - score) ** curveFactor);
}
