import { EXPERIENCE_MANIFEST_VERSION } from './experienceManifest.js';

const semanticObject = (id, objectClass, geometryRef, label, actionIds = []) => ({
  experienceObjectId: id,
  semanticObjectRef: { type: objectClass, id, sourceKind: 'journey-engine', sourceRef: 'src/data/journeyWorldConfig.js' },
  objectClass,
  state: { current: 'available', confidence: null, maturity: null, evidenceState: 'inspectable', validationState: 'pending' },
  governance: { semanticMappingId: objectClass === 'signal' ? 'evidence_atom' : objectClass, userPermissions: ['inspect'], agentPermissions: ['observe', 'suggest'] },
  visual: { geometryRef, materialRef: 'governed-default', motionState: 'idle', lodProfileRef: 'default-webgl' },
  interaction: { actionIds, stateTarget: actionIds.length ? 'activeExperienceObject' : null, inspectable: true },
  information: { label, evidenceRefs: [], lineageRefs: [], actionIds },
  accessibility: { nonVisualEquivalentRef: 'reference-journey-map', keyboardActionIds: actionIds, accessibleName: label, reducedMotionProfileRef: 'semantic-static' },
});

export const REFERENCE_JOURNEY_MANIFEST = Object.freeze({
  schemaVersion: EXPERIENCE_MANIFEST_VERSION,
  experienceId: 'reference.member-organization-relationship.v1',
  manifestVersion: 1,
  journeyId: 'member-organization-relationship',
  scenarioId: 'retrade-tributary',
  world: { worldId: 'journey', variantKey: 'TEMPORAL_CANYON', templateId: 'spatial-journey-world' },
  genome: { world: ['journey_corridor', 'basin'], object: ['signal', 'atom', 'molecule', 'rod', 'branch', 'evidence_fragment'], behavior: ['pulse', 'emerge', 'bond', 'crystallize', 'fracture', 'branch', 'merge', 'flow'], interaction: ['inspect', 'compare', 'validate', 'approve', 'rewind'], agent: ['guide', 'validator', 'reconciler', 'historian'], presentation: ['operator', 'micro', 'precision_surface', 'timeline'] },
  inputs: { canonicalSnapshotRef: 'journeyWorldConfig', ontologyVersion: 'journey-v1', journeyStateVersion: 1, userRole: 'operator', designSystemVersion: 'sb-brand-v1' },
  objects: [
    semanticObject('signal.identity', 'signal', 'atom_crystal', 'Identity signal', ['inspect']),
    semanticObject('rod.revenue', 'journey_rod', 'journey_rod', 'Revenue journey', ['inspect', 'enter']),
    semanticObject('molecule.deal-dimensions', 'semantic_composition', 'molecule_lattice', 'Deal dimensions', ['inspect', 'validate']),
    semanticObject('conflict.pricing-version', 'evidence_atom', 'atom_crystal', 'Pricing version conflict', ['inspect', 'compare', 'validate']),
    semanticObject('branch.retrade', 'journey_tributary', 'tributary_channel', 'Re-trade tributary', ['inspect', 'enter', 'approve']),
    semanticObject('history.prior-state', 'evidence_atom', 'atom_crystal', 'Historical state', ['inspect', 'rewind']),
  ],
  characters: [{ id: 'user.operator', profileId: 'operator', role: 'operator' }],
  agents: [{ id: 'agent.guide', profileId: 'guide' }, { id: 'agent.reconciler', profileId: 'reconciler' }, { id: 'agent.historian', profileId: 'historian' }],
  assets: [{ assetId: 'procedural-crystal-family', source: 'procedural' }, { assetId: 'journey-rod', source: 'approved' }, { assetId: 'tributary-channel', source: 'approved' }],
  animations: ['pulse', 'emerge', 'bond', 'crystallize', 'fracture', 'branch', 'merge', 'rewind', 'flow'],
  precisionSurfaces: [{ id: 'reference-journey-map', type: 'inspector', returnFocusPolicy: 'originating-object' }],
  performanceBudget: { maxTriangles: 250000, maxDrawCalls: 350, maxTexturesMb: 96, targetFps: 60, minFps: 30 },
  accessibilityRules: { keyboardComplete: true, screenReaderEquivalent: true, reducedMotion: true, focusRestoration: true },
  outputs: { live: true, hero: true, diagram: true, loop: true, thumbnail: true, reducedMotion: true },
  validation: { status: 'candidate', errors: [], warnings: [] },
});
