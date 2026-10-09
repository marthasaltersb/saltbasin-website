// Shared Three.js crystal recipes. SaltBasinCrystal.jsx (single-object mark/
// hero/backdrop crystal), CrystalOfficeScene.jsx (crystal-city destinations),
// and CrystalRoomScene.jsx (metadata-orbit reveal) all build meshes from this
// one module so every crystal in the product — signature mark, city
// destination, orbit node — comes from the identical geometry/material/
// lighting recipe. Never fork a variant locally in a consuming component;
// add it here so every surface stays visually identical.

export function addCrystalLights(scene, THREE) {
  const key = new THREE.DirectionalLight(0xC4843A, 1.4);
  key.position.set(4, 5, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x4A7C8E, 0.9);
  fill.position.set(-5, -2, 3);
  scene.add(fill);

  const ambient = new THREE.AmbientLight(0xF8F4EC, 0.55);
  scene.add(ambient);

  return { key, fill, ambient };
}

export const CRYSTAL_VARIANTS = {
  signature(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.7, 1),
      new THREE.MeshStandardMaterial({
        color: 0xF1EBDD,
        metalness: 0.25,
        roughness: 0.35,
        flatShading: true,
      })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.86, 1),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      })
    );
    group.add(wire);

    const tealSatellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, flatShading: true, roughness: 0.4 })
    );
    tealSatellite.position.set(2.6, 0.8, -0.5);
    group.add(tealSatellite);

    const pinkSatellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xD98CA0, flatShading: true, roughness: 0.4 })
    );
    pinkSatellite.position.set(-2.3, -1.1, 0.3);
    group.add(pinkSatellite);

    return { spin: [tealSatellite, pinkSatellite], core };
  },

  hourglass(group, THREE) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xF1EBDD,
      metalness: 0.3,
      roughness: 0.35,
      flatShading: true,
    });
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.35, 4), material);
    top.position.y = 0.7;
    group.add(top);

    const bottom = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.35, 4), material);
    bottom.position.y = -0.7;
    bottom.rotation.z = Math.PI;
    group.add(bottom);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xC4843A,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const wireTop = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.46, 4), wireMaterial);
    wireTop.position.y = 0.7;
    group.add(wireTop);

    const wireBottom = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.46, 4), wireMaterial);
    wireBottom.position.y = -0.7;
    wireBottom.rotation.z = Math.PI;
    group.add(wireBottom);

    const star = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.22),
      new THREE.MeshStandardMaterial({ color: 0xD98CA0, flatShading: true })
    );
    star.position.set(0, 1.8, 0);
    group.add(star);

    return { spin: [star], core: top };
  },

  // Salt Tide — the site editor's planet (2026-09-06): "a little less
  // triangles than the crystal core" (detail 0 icosahedron vs. signature's
  // detail 1) and a "luminescent, almost like clear glass" material —
  // MeshPhysicalMaterial's transmission, not a faked transparency hack, so
  // it genuinely reveals whatever sits inside the group at close range.
  salttide(group, THREE) {
    const glass = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xdcf3f0,
        transmission: 0.88,
        thickness: 1.35,
        roughness: 0.06,
        ior: 1.45,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.18,
        emissive: 0x4a7c8e,
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.95,
      })
    );
    group.add(glass);

    // What the glass reveals at close range — not fabricated journey data
    // (none exists for this module's rod_type yet), just a real inner
    // crystal structure, same honesty rule as the rest of this file: never
    // claim data that isn't there.
    const innerGlow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85, 0),
      new THREE.MeshBasicMaterial({ color: 0x9fe0d8, transparent: true, opacity: 0.32 })
    );
    group.add(innerGlow);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 0),
      new THREE.MeshBasicMaterial({ color: 0x8fd8d0, wireframe: true, transparent: true, opacity: 0.3 })
    );
    group.add(wire);

    return { spin: [wire, innerGlow], core: glass, innerGlow };
  },

  engine(group, THREE) {
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.95, 0.3, 110, 16),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.35, roughness: 0.4 })
    );
    group.add(knot);

    const wire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.02, 0.34, 55, 10),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    group.add(wire);

    return { spin: [knot, wire], core: knot };
  },

  rings(group, THREE) {
    const gold = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.14, 16, 60),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.3, roughness: 0.4 })
    );
    gold.rotation.x = Math.PI / 2.4;
    group.add(gold);

    const teal = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.14, 16, 60),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.3, roughness: 0.4 })
    );
    teal.rotation.x = -Math.PI / 2.4;
    teal.rotation.y = Math.PI / 3;
    group.add(teal);

    return { spin: [gold, teal], core: gold };
  },

  token(group, THREE) {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.28, 48),
      new THREE.MeshStandardMaterial({
        color: 0xF1EBDD,
        metalness: 0.45,
        roughness: 0.28,
      })
    );
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.045, 12, 72),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.65, roughness: 0.24 })
    );
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    const facet = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshStandardMaterial({
        color: 0x4A7C8E,
        metalness: 0.34,
        roughness: 0.32,
        flatShading: true,
      })
    );
    facet.position.z = 0.28;
    group.add(facet);

    return { spin: [coin, rim, facet], core: coin };
  },

  table(group, THREE) {
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 0.16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xF8F4EC,
        metalness: 0.2,
        roughness: 0.18,
        transparent: true,
        opacity: 0.78,
      })
    );
    top.position.y = 0.55;
    group.add(top);

    const topRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.36, 0.04, 12, 72),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.62, roughness: 0.25 })
    );
    topRim.position.y = 0.65;
    topRim.rotation.x = Math.PI / 2;
    group.add(topRim);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.52, 1.2, 7),
      new THREE.MeshStandardMaterial({
        color: 0xDCE9EC,
        metalness: 0.28,
        roughness: 0.32,
        flatShading: true,
      })
    );
    pedestal.position.y = -0.08;
    group.add(pedestal);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.16, 7),
      new THREE.MeshStandardMaterial({ color: 0x345A68, metalness: 0.36, roughness: 0.32 })
    );
    base.position.y = -0.78;
    group.add(base);

    return { spin: [topRim, pedestal], core: top };
  },

  founder(group, THREE) {
    const pinkMetal = new THREE.MeshStandardMaterial({
      color: 0xD98CA0,
      metalness: 0.58,
      roughness: 0.24,
      flatShading: true,
    });
    const shell = new THREE.MeshStandardMaterial({
      color: 0xF1EBDD,
      metalness: 0.26,
      roughness: 0.34,
      flatShading: true,
    });

    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), pinkMetal);
    head.position.y = 0.88;
    group.add(head);

    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.86, 0), shell);
    body.position.y = -0.05;
    body.scale.set(0.86, 1.18, 0.72);
    group.add(body);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.035, 10, 64),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        transparent: true,
        opacity: 0.7,
      })
    );
    halo.position.y = 0.86;
    halo.rotation.x = Math.PI / 2.8;
    group.add(halo);

    const signal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.32, roughness: 0.35 })
    );
    signal.position.set(1.22, 0.25, 0.12);
    group.add(signal);

    return { spin: [head, body, halo, signal], core: body };
  },

  // Agent Hub world anchor (2026-08-06, Career Placement Agents) — a
  // governed-orchestration variant: a signature-family icosahedron core (so
  // it reads as the same crystal, not a foreign shape) with a coordinating
  // ring gizmo, echoing 'rings' variant's gold/teal split for the two
  // agent-pipeline accent colors (gold=commercial, teal=shared/orchestration).
  // Every "user world" (Definition Studio, Agent Hub, User Configuration, Day
  // to Day, ...) gets its own named variant here, never bespoke geometry in
  // the consuming panel — see this file's header rule.
  agentHub(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.25, roughness: 0.32, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.64, 1),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const ringGold = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.05, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.3, roughness: 0.4 })
    );
    ringGold.rotation.x = Math.PI / 2.2;
    group.add(ringGold);

    const ringTeal = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.05, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.3, roughness: 0.4 })
    );
    ringTeal.rotation.x = -Math.PI / 2.2;
    ringTeal.rotation.y = Math.PI / 3;
    group.add(ringTeal);

    return { spin: [ringGold, ringTeal], core };
  },

  // Commercial Opportunity Pipeline world anchor (2026-08-06, Career
  // Placement Agents Phase 3) — an expansion/growth variant: a dodecahedron
  // core (a distinct silhouette from agentHub's icosahedron, so the two
  // worlds read as visibly different members of the same family) with an
  // ascending helix of small satellite gems evoking the spec's Ring 0-5
  // target-expansion model, in gold/mauve tones (commercial's accent pair).
  commercialPipeline(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.45, 0),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.28, roughness: 0.3, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.58, 0),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const helixGems = [];
    const helixCount = 6;
    for (let i = 0; i < helixCount; i += 1) {
      const t = i / helixCount;
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14 + t * 0.08, 0),
        new THREE.MeshStandardMaterial({ color: 0x785D69, metalness: 0.3, roughness: 0.4, flatShading: true })
      );
      const angle = t * Math.PI * 2.4;
      const radius = 1.9 + t * 0.5;
      gem.position.set(Math.cos(angle) * radius, -0.9 + t * 1.8, Math.sin(angle) * radius);
      group.add(gem);
      helixGems.push(gem);
    }

    return { spin: helixGems, core };
  },

  // Publication journey world anchor (2026-08-07) — HERQ Publications now,
  // Marketing Ads / Research Reports follow on the same anchor once their
  // islands exist (per this file's own rule: extend the registry, never
  // fork geometry per consumer). An octahedron core (a third distinct
  // silhouette alongside agentHub's icosahedron and commercialPipeline's
  // dodecahedron) with three fanned "page" plates evoking a published
  // output stack.
  publication(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.22, roughness: 0.36, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.54, 0),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const pages = [];
    for (let i = 0; i < 3; i += 1) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.06, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xDCE9EC, metalness: 0.2, roughness: 0.3 })
      );
      plate.position.set(0, -0.6 + i * 0.16, 0);
      plate.rotation.y = (i - 1) * 0.12;
      group.add(plate);
      pages.push(plate);
    }

    return { spin: pages, core };
  },
};

// Small crystal used for metadata-orbit / capability-context nodes — a single
// low-poly gem whose color is driven by the caller (maturity stage, brand
// accent) rather than a fixed material, since these represent live state
// rather than a named product variant.
export function buildGemMesh(THREE, { color = 0xC4843A, size = 0.22, metalness = 0.4, roughness = 0.3 } = {}) {
  return new THREE.Mesh(
    new THREE.OctahedronGeometry(size, 0),
    new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true })
  );
}

// A "river of light" flowing from one world position to another — the World
// Shell's islands connect to the Crystal Core this way. A single additive-
// blended THREE.Points stream sampled along a CatmullRomCurve3, each point
// given a random offset along the curve and re-wrapped every frame by the
// caller (see `advanceRiverParticles`) rather than re-created, so the flow
// reads as continuous motion instead of a static dotted line. Reused by any
// world that needs a link between two crystals — never fork a bespoke
// particle system per consumer, per this file's header rule.
export function buildRiverParticles(THREE, { from, to, color = 0xC4843A, count = 60, curveLift = 0.6 } = {}) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y += curveLift;
  const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()]);
  const positions = new Float32Array(count * 3);
  const offsets = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    offsets[i] = t;
    const p = curve.getPoint(t);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.09,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.curve = curve;
  points.userData.offsets = offsets;
  points.userData.speed = 0.12 + Math.random() * 0.05;
  return points;
}

// Advances a river's flow by `dt` seconds — call once per animation frame per
// river. Wraps each point back to the curve start once it reaches the end so
// the stream loops seamlessly.
export function advanceRiverParticles(points, dt) {
  const { curve, offsets, speed } = points.userData;
  const posAttr = points.geometry.getAttribute('position');
  for (let i = 0; i < offsets.length; i += 1) {
    offsets[i] = (offsets[i] + dt * speed) % 1;
    const p = curve.getPoint(offsets[i]);
    posAttr.setXYZ(i, p.x, p.y, p.z);
  }
  posAttr.needsUpdate = true;
}

// Projects a world position through `camera` into CSS pixel coordinates
// within an element sized `width` x `height`. Returns null when the point is
// behind the camera (so callers can hide the HTML hit-target instead of
// flinging it across the screen).
export function projectToScreen(THREE, vector3, camera, width, height) {
  const v = vector3.clone().project(camera);
  if (v.z > 1) return null;
  return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height };
}

// ── Environments ────────────────────────────────────────────────────────────
// The setting a world is drawn in, independent of the data. An environment
// builder sits alongside addCrystalLights and is swappable by name:
//
//   const env = buildEnvironment('underwater', scene, THREE, { palette, keepClear: 31 });
//   env.update(elapsedSeconds, dtSeconds, camera);   // skipped under reduced motion: the water stands still
//   env.setPalette({ waterMid, sand });              // light / dark water
//   env.dispose();
//
// Underwater (2026-10-09): depth-gradient water with exponential fog, a
// sea-tinted sand seabed fading into the blue, moving cellular caustics on the
// sand, swaying light shafts from the surface, rising bubbles, drifting marine
// snow, and kelp anchored OUTSIDE the camera's orbit (`keepClear` radius) so it
// never crosses a crystal. The CSS behind a transparent canvas paints the
// surface-to-deep gradient; the scene supplies fog, seabed and particles.
function canvasTexture(THREE, size, draw) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  return t;
}

function underwaterEnvironment(scene, THREE, { palette = {}, keepClear = 31, seed = 7 } = {}) {
  // Deterministic placement (a seeded sequence), so the scene is the same every visit.
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const parts = [];
  const add = (o) => { scene.add(o); parts.push(o); return o; };
  const col = (v, d) => new THREE.Color(v ?? d);
  scene.fog = new THREE.FogExp2(col(palette.waterMid, 0x8FC4D1), 0.028);
  const hemi = new THREE.HemisphereLight(0xBFEFFF, 0x2A4A3A, 0.45);
  scene.add(hemi); parts.push(hemi);

  const bedGeo = new THREE.PlaneGeometry(200, 200, 90, 90);
  bedGeo.rotateX(-Math.PI / 2);
  const bp = bedGeo.getAttribute('position');
  for (let i = 0; i < bp.count; i += 1) {
    const x = bp.getX(i); const z = bp.getZ(i);
    bp.setY(i, Math.sin(x * 0.18) * 0.35 + Math.cos(z * 0.22) * 0.3 + Math.sin((x + z) * 0.07) * 0.6);
  }
  bedGeo.computeVertexNormals();
  const bed = add(new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: col(palette.sand, 0x8FB3AE), roughness: 0.95, metalness: 0 })));
  bed.position.y = -9;

  const caus = canvasTexture(THREE, 256, (g, n) => {
    g.clearRect(0, 0, n, n);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3; g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 6;
    const cells = 7; const step = n / cells;
    for (let i = 0; i < cells; i += 1) for (let j = 0; j < cells; j += 1) {
      const cx = (i + 0.5 + (rnd() - 0.5) * 0.5) * step; const cy = (j + 0.5 + (rnd() - 0.5) * 0.5) * step; const r = step * (0.42 + rnd() * 0.12);
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) {
        g.beginPath();
        for (let a = 0; a <= 6.3; a += 0.35) {
          const rr = r * (0.85 + 0.15 * Math.sin(a * 3 + i + j));
          const x = cx + dx + Math.cos(a) * rr; const y = cy + dy + Math.sin(a) * rr;
          if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath(); g.stroke();
      }
    }
  });
  const causMats = [0, 1].map((k) => {
    const m = new THREE.MeshBasicMaterial({ map: caus.clone(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    m.map.needsUpdate = true; m.map.repeat.set(9 + k * 4, 9 + k * 4);
    const pl = add(new THREE.Mesh(bedGeo, m)); pl.position.y = -8.95 + k * 0.02;
    return m;
  });

  const shaftTex = canvasTexture(THREE, 64, (g, n) => {
    const gr = g.createLinearGradient(0, 0, n, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    const v = g.createLinearGradient(0, 0, 0, n);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, n, n);
  });
  const shafts = [];
  for (let i = 0; i < 9; i += 1) {
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2 + rnd() * 2.5, 34), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: 0xE8FBFF })));
    m.position.set((rnd() - 0.5) * 34, 9, (rnd() - 0.5) * 34); m.rotation.z = 0.18 + (rnd() - 0.5) * 0.12;
    m.userData.phase = rnd() * 6; shafts.push(m);
  }

  const mkPoints = (n, spread, size, color, opacity) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) pos.set([(rnd() - 0.5) * spread, -9 + rnd() * 24, (rnd() - 0.5) * spread], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = canvasTexture(THREE, 32, (g, kk) => {
      const r = g.createRadialGradient(kk / 2, kk / 2, 1, kk / 2, kk / 2, kk / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.55, 'rgba(255,255,255,0.35)'); r.addColorStop(0.7, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, kk, kk);
    });
    return add(new THREE.Points(geo, new THREE.PointsMaterial({ size, map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })));
  };
  const bubbles = mkPoints(220, 40, 0.28, 0xFFFFFF, 0.55);
  const snow = mkPoints(600, 60, 0.07, 0xF4FBFF, 0.5);

  const kelp = [];
  const kelpMat = new THREE.MeshStandardMaterial({ color: 0x4F7A3A, roughness: 0.8, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 26; i += 1) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.2; const r = keepClear + rnd() * 10; const h = 12 + rnd() * 12;
    const pts = [];
    for (let j = 0; j <= 6; j += 1) pts.push(new THREE.Vector3(Math.sin(j * 0.9 + i) * 0.35, (j / 6) * h, Math.cos(j * 0.7 + i) * 0.25));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 5, false), kelpMat);
    const g = add(new THREE.Group()); g.add(tube); g.position.set(Math.cos(a) * r, -9, Math.sin(a) * r); g.userData.phase = rnd() * 6; kelp.push(g);
  }

  return {
    update(t, dt, camera) {
      causMats[0].map.offset.set(t * 0.012, t * 0.008); causMats[1].map.offset.set(-t * 0.009, t * 0.011);
      shafts.forEach((m) => { m.lookAt(camera.position.x, m.position.y, camera.position.z); m.rotateZ(0.18); m.material.opacity = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.4 + m.userData.phase)); });
      const p = bubbles.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i += 1) {
        let y = p.getY(i) + dt * (0.9 + (i % 7) * 0.12); if (y > 15) y = -9;
        p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 2 + i) * dt * 0.15);
      }
      p.needsUpdate = true;
      snow.rotation.y += dt * 0.01; snow.position.y = Math.sin(t * 0.2) * 0.4;
      kelp.forEach((g) => { g.rotation.z = Math.sin(t * 0.7 + g.userData.phase) * 0.09; g.rotation.x = Math.cos(t * 0.5 + g.userData.phase) * 0.06; });
    },
    setPalette(p = {}) {
      if (p.waterMid != null) scene.fog.color = col(p.waterMid);
      if (p.sand != null) bed.material.color = col(p.sand);
    },
    dispose() {
      parts.forEach((o) => {
        scene.remove(o);
        o.traverse?.((x) => { x.geometry?.dispose?.(); const ms = Array.isArray(x.material) ? x.material : [x.material]; ms.forEach((m) => { m?.map?.dispose?.(); m?.dispose?.(); }); });
      });
      scene.fog = null;
    },
  };
}

export const ENVIRONMENTS = { underwater: underwaterEnvironment };
export const DEFAULT_ENVIRONMENT = 'underwater';

export function buildEnvironment(name, scene, THREE, options = {}) {
  const build = ENVIRONMENTS[name || DEFAULT_ENVIRONMENT];
  if (!build) throw new Error(`Unknown world environment "${name}". Known: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  return build(scene, THREE, options);
}
