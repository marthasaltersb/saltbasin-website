// Non-parallel, gate-driven spatial layout.
//
// Rods are not three parallel corridors. Each rod (other than the root)
// declares `parentRodId` + `originGateId` (the parent stage/gate it branches
// from) plus `branchAngleDeg`/`branchElevation`. A branch rod's stages walk
// outward from its origin gate's world position along a direction rotated
// off its parent's own direction — so Revenue-rooted topologies (internal-
// sourced deals) fan Customer/Member out from Revenue's gates, and
// Member-rooted topologies (external intake) fan Customer/Revenue out from
// the Member rod instead. Which rod is root is decided by genesis.js, not by
// this module — layout only executes whatever parent/gate wiring the rod
// list already encodes.
//
// Deal-dimension metadata (price model, billing terms, segment, parties,
// deal size) isn't a fourth parallel rod either — computeGateDimensionRibs
// fans those atoms out laterally/vertically from a single gate point, which
// is the literal "show the dimensions of a deal."

const STAGE_SPACING = 8;

function findGateStageIndex(parentRod, originGateId) {
  const byGateId = parentRod.stages.findIndex((stage) => stage.gate?.id === originGateId);
  if (byGateId >= 0) return byGateId;
  const byStageId = parentRod.stages.findIndex((stage) => stage.id === originGateId);
  return byStageId >= 0 ? byStageId : parentRod.stages.length - 1;
}

// rods: array of { id, parentRodId, originGateId, branchAngleDeg,
// branchElevation, stages }. Returns { [rodId]: THREE.Vector3[] } aligned
// index-for-index with each rod's `stages` array.
export function computeRodLayout(THREE, rods, { stageSpacing = STAGE_SPACING } = {}) {
  const rodById = new Map(rods.map((rod) => [rod.id, rod]));
  const origins = new Map();
  const positions = new Map();

  function resolveOrigin(rod) {
    if (origins.has(rod.id)) return origins.get(rod.id);
    if (!rod.parentRodId) {
      const rootOrigin = { position: new THREE.Vector3(0, 0, 0), direction: new THREE.Vector3(0, 0, 1) };
      origins.set(rod.id, rootOrigin);
      return rootOrigin;
    }
    const parentRod = rodById.get(rod.parentRodId);
    const parentOrigin = resolveOrigin(parentRod);
    const parentPositions = computeStagePositions(parentRod);
    const gateIndex = findGateStageIndex(parentRod, rod.originGateId);
    const gatePosition = parentPositions[gateIndex] || parentOrigin.position;

    const angleRad = THREE.MathUtils.degToRad(rod.branchAngleDeg || 0);
    const direction = parentOrigin.direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);
    direction.y += rod.branchElevation || 0;
    direction.normalize();

    const branchOrigin = { position: gatePosition.clone(), direction };
    origins.set(rod.id, branchOrigin);
    return branchOrigin;
  }

  function computeStagePositions(rod) {
    if (positions.has(rod.id)) return positions.get(rod.id);
    const { position, direction } = resolveOrigin(rod);
    const startOffset = rod.parentRodId ? stageSpacing : 0;
    const stagePositions = rod.stages.map((_, index) =>
      position.clone().addScaledVector(direction, startOffset + index * stageSpacing)
    );
    positions.set(rod.id, stagePositions);
    return stagePositions;
  }

  rods.forEach(computeStagePositions);

  const result = {};
  positions.forEach((value, key) => { result[key] = value; });
  return result;
}

// Fans a set of atom positions out from a single gate point in a ring —
// used for the Revenue rod's deal-dimension molecule (price model, billing
// terms, segment, bill-to/sold-to party, deal size) so it reads as ribs off
// the spine rather than a parallel rod.
export function computeGateDimensionRibs(THREE, gatePosition, ribCount, { ribLength = 3.2, elevation = 1.4 } = {}) {
  const ribs = [];
  for (let i = 0; i < ribCount; i += 1) {
    const angle = (i / Math.max(ribCount, 1)) * Math.PI * 2;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const position = gatePosition.clone().addScaledVector(direction, ribLength);
    position.y += elevation + Math.sin(angle * 2) * 0.4;
    ribs.push(position);
  }
  return ribs;
}
