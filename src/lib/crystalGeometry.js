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

// Projects a world position through `camera` into CSS pixel coordinates
// within an element sized `width` x `height`. Returns null when the point is
// behind the camera (so callers can hide the HTML hit-target instead of
// flinging it across the screen).
export function projectToScreen(THREE, vector3, camera, width, height) {
  const v = vector3.clone().project(camera);
  if (v.z > 1) return null;
  return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height };
}
