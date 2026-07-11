import React, { useEffect, useRef, useState } from 'react';

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let threePromise = null;

function ensureThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threePromise) return threePromise;

  threePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${THREE_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = THREE_CDN;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return threePromise;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function addLights(scene, THREE) {
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

const crystalVariants = {
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

    return { spin: [tealSatellite, pinkSatellite] };
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

    return { spin: [star] };
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

    return { spin: [knot, wire] };
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

    return { spin: [gold, teal] };
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

    return { spin: [coin, rim, facet] };
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

    return { spin: [topRim, pedestal] };
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

    return { spin: [head, body, halo, signal] };
  },
};

// Ring of small satellite meshes orbiting the core — used by size="backdrop"
// (the full-bleed product hero scene) to match the reference mockup's 14-mesh
// orbit ring. Cycles the same 4 brand colors as the reference script.
const ORBIT_COLORS = [0x4A7C8E, 0x785D69, 0xC4843A, 0xDAD3CE];

function buildOrbitGroup(count, THREE) {
  const orbit = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09 + (i % 3) * 0.03, 0),
      new THREE.MeshStandardMaterial({ color: ORBIT_COLORS[i % ORBIT_COLORS.length], flatShading: true, roughness: 0.4 })
    );
    const angle = (i / count) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 2.55, Math.sin(angle) * 1.38, i % 2 ? -0.48 : 0.48);
    orbit.add(mesh);
  }
  return orbit;
}

export default function SaltBasinCrystal({
  variant = 'signature',
  size = 'hero',
  className = '',
  interactive = false,
  orbitCount = 0,
  autoRotate = true,
  pulseActive = false,
}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [rendered, setRendered] = useState(false);

  // Refs, not effect deps — animate() reads these live so toggling
  // autoRotate/pulseActive (e.g. on every BestyStaff send) never tears down
  // and rebuilds the WebGL scene.
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const pulseActiveRef = useRef(pulseActive);
  pulseActiveRef.current = pulseActive;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()) return undefined;

    let disposed = false;
    let frame = 0;
    let renderer = null;
    let scene = null;
    let resizeObserver = null;

    function onPointerMove(event) {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
      };
    }

    ensureThree()
      .then((THREE) => {
        if (disposed || !hostRef.current || !canvasRef.current) return;

        const isHeroScale = size === 'hero' || size === 'backdrop';

        scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, isHeroScale ? 7 : 5.3);

        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isHeroScale ? 2 : 1.5));

        const lights = addLights(scene, THREE);

        const group = new THREE.Group();
        group.rotation.x = 0.3;
        scene.add(group);
        const handles = crystalVariants[variant]?.(group, THREE) || crystalVariants.signature(group, THREE);

        const orbitGroup = orbitCount > 0 ? buildOrbitGroup(orbitCount, THREE) : null;
        if (orbitGroup) group.add(orbitGroup);

        function resize() {
          if (!hostRef.current || !renderer) return;
          const rect = hostRef.current.getBoundingClientRect();
          const width = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }

        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(hostRef.current);

        if (interactive) {
          hostRef.current.addEventListener('pointermove', onPointerMove);
        }

        const clock = new THREE.Clock();
        setRendered(true);

        function animate() {
          if (disposed || !renderer || !scene) return;
          frame = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const mouse = mouseRef.current;
          const parallax = interactive ? 1 : 0;
          const autoRotate = autoRotateRef.current;
          const pulseActive = pulseActiveRef.current;
          const speedMul = pulseActive ? 1.8 : 1;

          group.rotation.y = (autoRotate ? t * (isHeroScale ? 0.28 : 0.4) * speedMul : 0) + mouse.x * 0.6 * parallax;
          group.rotation.x = (autoRotate ? 0.3 + Math.sin(t * 0.4) * 0.05 : 0.3) + mouse.y * 0.3 * parallax;
          group.position.y = autoRotate ? Math.sin(t * 0.6) * (isHeroScale ? 0.15 : 0.08) : 0;
          if (autoRotate) {
            handles.spin.forEach((mesh, index) => {
              mesh.rotation.x += (index % 2 ? -0.012 : 0.01) * speedMul;
              mesh.rotation.y += (index % 2 ? -0.008 : 0.015) * speedMul;
            });
            if (orbitGroup) orbitGroup.rotation.z = t * 0.12 * speedMul;
          }
          lights.key.intensity = pulseActive ? 1.4 + Math.sin(t * 6) * 0.5 : 1.4;
          renderer.render(scene, camera);
        }

        animate();
      })
      .catch(() => setRendered(false));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      if (interactive && hostRef.current) {
        hostRef.current.removeEventListener('pointermove', onPointerMove);
      }
      if (scene) {
        scene.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose?.());
          } else {
            object.material?.dispose?.();
          }
        });
      }
      renderer?.dispose?.();
    };
  }, [interactive, size, variant, orbitCount]);

  return (
    <div
      ref={hostRef}
      className={`sbh-webgl-crystal sbh-webgl-crystal-${size} ${className}`}
      data-rendered={rendered ? 'true' : 'false'}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className={`sbh-crystal sbh-crystal-fallback sbh-crystal-${variant}`} aria-hidden="true">
        <span className="facet facet-a" />
        <span className="facet facet-b" />
        <span className="facet facet-c" />
        <span className="facet facet-d" />
      </div>
    </div>
  );
}
