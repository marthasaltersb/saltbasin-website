// Editable presentation and interaction contract for the Spatial Journey
// World. Semantic evaluation remains in the journey/maturity engines; this
// registry controls how those configured facts become a playable world.

export const JOURNEY_WORLD_EXPERIENCE = Object.freeze({
  schemaVersion: 1,
  scene: {
    stageSpacing: 8,
    path: { style: 'tidal_curve', tension: 0.4, amplitudeX: 5.5, amplitudeY: 0.8, tubeRadius: 0.72 },
    seabed: { color: '#172433', gridOpacity: 0.06, particleCount: 110 },
    camera: { overviewRadius: 58, focusRadius: 24, stageFocusRadius: 13 },
  },
  visibility: {
    atoms: 'progressive',
    molecules: 'progressive',
    showUnpopulatedAtoms: false,
    showAtomsOnStageFocus: true,
    userControls: ['journey', 'structures', 'all'],
    defaultLayer: 'journey',
  },
  formation: {
    atomAppearsWhen: 'value_present',
    moleculeAppearsWhen: 'member_atom_present',
    mineralAppearsWhen: 'molecule_gate_passed',
    transitionDurationMs: 900,
  },
  objectTypes: {
    ion: { enabled: false, persistence: 'free', geometry: 'point_charge' },
    atom: { enabled: true, persistence: 'free', geometry: 'faceted_crystal' },
    molecule: { enabled: true, persistence: 'bounded', geometry: 'open_lattice_shell' },
    mineral: { enabled: true, persistence: 'journey', geometry: 'crystal_cluster' },
    crystallography: { enabled: true, persistence: 'journey', geometry: 'crystal_lattice' },
  },
  groups: [
    { key: 'lead', label: 'Lead & Source', matchTags: ['lead', 'identity'], color: '#C4843A', geometry: 'octahedron' },
    { key: 'deal', label: 'Deal Dimensions', matchTags: ['dealDimension', 'pricing'], color: '#D7A45B', geometry: 'bipyramid' },
    { key: 'diligence', label: 'Diligence', matchTags: ['diligence', 'risk'], color: '#4A7C8E', geometry: 'icosahedron' },
    { key: 'contract', label: 'Contract & Terms', matchTags: ['contractTerms'], color: '#785D69', geometry: 'hex_crystal' },
    { key: 'billing', label: 'Billing & Revenue', matchTags: ['billing'], color: '#6B8F71', geometry: 'prism' },
    { key: 'security', label: 'Security & Access', matchTags: ['security', 'personalScope'], color: '#9A7185', geometry: 'tetrahedron' },
    { key: 'default', label: 'Other Evidence', matchTags: [], color: '#DAD3CE', geometry: 'bipyramid' },
  ],
  stage: {
    geometry: 'coral_checkpoint',
    activeColor: '#C4843A',
    populatedColor: '#4A7C8E',
    emptyColor: '#785D69',
    pathColor: '#4A7C8E',
  },
  panels: {
    inspectorPlacement: 'bottom',
    legendPlacement: 'right',
    customerCardFields: ['healthScore', 'openDealAmount', 'openDealStage', 'conflictCount'],
  },
});

export function resolveJourneyObjectGroup(atom, config = JOURNEY_WORLD_EXPERIENCE) {
  const tags = new Set(atom?.magneticProperties || []);
  return config.groups.find((group) => group.key !== 'default' && group.matchTags.some((tag) => tags.has(tag)))
    || config.groups.find((group) => group.key === 'default')
    || config.groups[config.groups.length - 1];
}

export function validateJourneyWorldExperience(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return ['value must be an object'];
  if (value.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Array.isArray(value.groups) || !value.groups.length) errors.push('groups must be a non-empty array');
  const keys = new Set();
  for (const [index, group] of (value.groups || []).entries()) {
    if (!group?.key) errors.push(`groups[${index}].key is required`);
    if (keys.has(group?.key)) errors.push(`groups[${index}].key duplicates "${group.key}"`);
    keys.add(group?.key);
    if (!/^#[0-9a-fA-F]{6}$/.test(group?.color || '')) errors.push(`groups[${index}].color must be #rrggbb`);
    if (!Array.isArray(group?.matchTags)) errors.push(`groups[${index}].matchTags must be an array`);
  }
  if (!keys.has('default')) errors.push('groups must include a default group');
  for (const key of ['atoms', 'molecules']) {
    if (!['progressive', 'visible', 'hidden'].includes(value.visibility?.[key])) {
      errors.push(`visibility.${key} must be progressive, visible, or hidden`);
    }
  }
  return errors;
}
