// Geometry/material builders for the Spatial Journey World's own object
// vocabulary — this is deliberately separate from crystalGeometry.js, whose
// contract is named product-mark variants for SaltBasinCrystal/
// CrystalOfficeScene (signature, hourglass, engine, ...), not domain-driven
// journey atoms. Every builder here takes `THREE` as a parameter (loaded via
// ensureThree() in SaltBasinCrystal.jsx) rather than importing it, matching
// every other Three.js module in this repo.
//
// Legend (see the in-world legend panel, not floating per-object labels):
//   bipyramid          -> atom (master-data crystal)
//   hex drum            -> stage anchor
//   wire icosahedron     -> molecule shell
//   large icosahedron    -> compound-query / Customer-360 hash node
//   torus                -> Confluence reconciliation zone
//   cone pin             -> home-anchor tether (where an atom is contextually owned)
//   thin light column    -> gate / objective beacon

const geometryCache = {};
const textureCache = {};

// A bipyramid is two cones joined base-to-base — the atom's facet count
// (radial segments) is one of the visual channels driven by maturity.
export function getBipyramidParts(THREE, radialSegments) {
  const key = `bipyramid-${radialSegments}`;
  if (geometryCache[key]) return geometryCache[key];
  const top = new THREE.ConeGeometry(0.72, 1.15, radialSegments, 1, false);
  top.translate(0, 0.55, 0);
  const bottom = new THREE.ConeGeometry(0.72, 0.68, radialSegments, 1, false);
  bottom.rotateX(Math.PI);
  bottom.translate(0, -0.78, 0);
  geometryCache[key] = { top, bottom };
  return geometryCache[key];
}

export function buildAtomMaterial(THREE, visual) {
  return new THREE.MeshPhysicalMaterial({
    color: visual.colorHex,
    metalness: visual.metalness,
    roughness: visual.roughness,
    transparent: true,
    opacity: visual.opacity,
    emissive: visual.emissiveColor,
    emissiveIntensity: visual.emissiveIntensity,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5,
  });
}

export function buildStageAnchorMesh(THREE, { color, radiusTop = 2.05, radiusBottom = 2.4, height = 0.45 }) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 6);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.25, transparent: true, opacity: 0.88 });
  return new THREE.Mesh(geometry, material);
}

export function buildMoleculeShellMesh(THREE, { color = 0xffffff, radius = 3.4 } = {}) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.12 });
  return new THREE.Mesh(geometry, material);
}

export function buildHashNodeMesh(THREE, { color, radius = 2.6 }) {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const material = new THREE.MeshPhysicalMaterial({
    color, emissive: color, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.2, clearcoat: 0.6, transparent: true, opacity: 0,
  });
  return new THREE.Mesh(geometry, material);
}

export function buildReconciliationRingMesh(THREE, { color, radius = 1.85, tube = 0.16 }) {
  const geometry = new THREE.TorusGeometry(radius, tube, 14, 44);
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, metalness: 0.45, roughness: 0.28 });
  return new THREE.Mesh(geometry, material);
}

export function buildHomeAnchorPinMesh(THREE, { color }) {
  const geometry = new THREE.ConeGeometry(0.14, 0.8, 6);
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });
  return new THREE.Mesh(geometry, material);
}

// A thin vertical additive-blended column marking a gate or objective in
// world space — deliberately not a floating text label; the legend panel
// explains what a beacon means.
export function buildGateBeaconMesh(THREE, { color, height = 6, radius = 0.05 }) {
  const geometry = new THREE.CylinderGeometry(radius, radius * 0.4, height, 8, 1, true);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y += height / 2;
  return mesh;
}

function getGlowTexture(THREE, colorHex) {
  const key = `glow-${colorHex}`;
  if (textureCache[key]) return textureCache[key];
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = new THREE.Color(colorHex);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${rgb},0.85)`);
  gradient.addColorStop(0.4, `rgba(${rgb},0.35)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

export function buildGlowSprite(THREE, colorHex, scale) {
  const material = new THREE.SpriteMaterial({
    map: getGlowTexture(THREE, colorHex), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}
