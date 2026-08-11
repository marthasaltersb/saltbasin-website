export const EXPERIENCE_ARTIFACTS = Object.freeze([
  { artifactId: 'scene.spatial-journey-world', artifactType: 'runtime_scene', source: 'src/components/SpatialJourneyWorld.jsx', status: 'approved-reference', visualFamily: 'crystalline-journey', semanticMeaning: 'Journey rods, evidence, gates, tributaries and reconciliation', reusability: 'high', dependencies: ['journey-engine', 'visual-registries'], approvedPatterns: ['scene-manifest', 'precision-inspector'], rejectedPatterns: [], candidateForReuse: true },
  { artifactId: 'prototype.crystalline-world-v2', artifactType: 'html_prototype', source: 'prototypes/crystalline-world/salt-basin-crystalline-world-v2.html', status: 'candidate-reference', visualFamily: 'crystalline-world', semanticMeaning: 'World entry, progression, companion, build mode and persistence', reusability: 'high', dependencies: ['three-r128-cdn'], approvedPatterns: ['world-entry', 'companion-follow', 'ride', 'reduced-motion'], rejectedPatterns: ['standalone-data-duplication'], candidateForReuse: true },
  { artifactId: 'scene.world-shell', artifactType: 'runtime_scene', source: 'src/components/WorldShell.jsx', status: 'approved', visualFamily: 'orbital-islands', semanticMeaning: 'Permission-derived product/world navigation', reusability: 'high', dependencies: ['world-islands', 'crystalGeometry'], approvedPatterns: ['permission-derived-worlds', 'camera-dolly'], rejectedPatterns: [], candidateForReuse: true },
  { artifactId: 'geometry.crystal-family', artifactType: 'procedural_asset_family', source: 'src/lib/crystalGeometry.js', status: 'approved', visualFamily: 'crystalline', semanticMeaning: 'Shared governed crystal genealogy', reusability: 'high', dependencies: ['three'], approvedPatterns: ['procedural-variation'], rejectedPatterns: ['unrelated-mascots'], candidateForReuse: true },
  { artifactId: 'icons.strategic-operator', artifactType: 'svg_family', source: 'brand-assets/icons/strategic-operator', status: 'approved', visualFamily: 'strategic-operator', semanticMeaning: 'Precision UI and navigation iconography', reusability: 'high', dependencies: [], approvedPatterns: ['coherent-icon-family'], rejectedPatterns: [], candidateForReuse: true },
]);

export function findReusableExperienceArtifacts({ artifactType, visualFamily, semanticMeaning } = {}) {
  return EXPERIENCE_ARTIFACTS.filter((artifact) => artifact.candidateForReuse)
    .map((artifact) => ({ artifact, score: (artifactType && artifact.artifactType === artifactType ? 3 : 0) + (visualFamily && artifact.visualFamily === visualFamily ? 2 : 0) + (semanticMeaning && artifact.semanticMeaning.toLowerCase().includes(semanticMeaning.toLowerCase()) ? 4 : 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

