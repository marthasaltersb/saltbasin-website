import React, { useEffect, useRef, useState } from 'react';
import { CRYSTAL_VARIANTS, addCrystalLights, projectToScreen } from '../lib/crystalGeometry.js';

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let threePromise = null;

export function ensureThree() {
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

export function hasWebGL() {
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

// Ring of small satellite meshes orbiting the core — used by size="backdrop"
// (the full-bleed product hero scene) to match the reference mockup's 14-mesh
// orbit ring. Cycles the same 4 brand colors as the reference script. When
// `orbitItems` is supplied (id + variant per item), each orbit position gets
// a real CRYSTAL_VARIANTS mesh instead of a plain octahedron, and the mesh's
// `userData.orbitId` lets the render loop below project it to a clickable
// screen position — this is what powers the pre-explore capability-context
// picker without falling back to flat CSS gems.
const ORBIT_COLORS = [0x4A7C8E, 0x785D69, 0xC4843A, 0xDAD3CE];

function buildOrbitGroup(count, THREE, orbitItems, orbitColors = ORBIT_COLORS) {
  const orbit = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const item = orbitItems?.[i];
    let mesh;
    if (item) {
      const holder = new THREE.Group();
      const variantFn = CRYSTAL_VARIANTS[item.variant] || CRYSTAL_VARIANTS.signature;
      variantFn(holder, THREE);
      holder.scale.setScalar(0.16);
      mesh = holder;
      mesh.userData.orbitId = item.id;
      mesh.userData.baseScale = 0.16;
    } else {
      mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09 + (i % 3) * 0.03, 0),
        new THREE.MeshStandardMaterial({ color: orbitColors[i % orbitColors.length], flatShading: true, roughness: 0.4 })
      );
    }
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
  orbitItems = null,
  orbitColorOverride = null,
  hoveredOrbitId = null,
  onOrbitLayout = null,
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
  const hoveredOrbitIdRef = useRef(hoveredOrbitId);
  hoveredOrbitIdRef.current = hoveredOrbitId;

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

        const lights = addCrystalLights(scene, THREE);

        const group = new THREE.Group();
        group.rotation.x = 0.3;
        scene.add(group);
        const handles = CRYSTAL_VARIANTS[variant]?.(group, THREE) || CRYSTAL_VARIANTS.signature(group, THREE);

        const orbitTotal = orbitItems?.length || orbitCount;
        const orbitGroup = orbitTotal > 0 ? buildOrbitGroup(orbitTotal, THREE, orbitItems, orbitColorOverride || ORBIT_COLORS) : null;
        if (orbitGroup) group.add(orbitGroup);
        const orbitMeshes = orbitItems ? orbitGroup.children.filter((m) => m.userData.orbitId) : [];

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
        const projected = new THREE.Vector3();
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
          // Freeze all motion that would relocate an orbit item's on-screen
          // position while it's hovered/focused — otherwise the hit-target
          // (repositioned from this same projection every frame) can drift
          // out from under the cursor between mousedown and click, dropping
          // the click through to whatever's behind it.
          const freezeForHover = !!hoveredOrbitIdRef.current;

          if (!freezeForHover) {
            group.rotation.y = (autoRotate ? t * (isHeroScale ? 0.28 : 0.4) * speedMul : 0) + mouse.x * 0.6 * parallax;
            group.rotation.x = (autoRotate ? 0.3 + Math.sin(t * 0.4) * 0.05 : 0.3) + mouse.y * 0.3 * parallax;
            group.position.y = autoRotate ? Math.sin(t * 0.6) * (isHeroScale ? 0.15 : 0.08) : 0;
          }
          if (autoRotate) {
            handles.spin.forEach((mesh, index) => {
              mesh.rotation.x += (index % 2 ? -0.012 : 0.01) * speedMul;
              mesh.rotation.y += (index % 2 ? -0.008 : 0.015) * speedMul;
            });
            if (orbitGroup && !freezeForHover) orbitGroup.rotation.z = t * 0.12 * speedMul;
          }
          lights.key.intensity = pulseActive ? 1.4 + Math.sin(t * 6) * 0.5 : 1.4;

          if (orbitMeshes.length && onOrbitLayout) {
            const rect = hostRef.current.getBoundingClientRect();
            const hoveredId = hoveredOrbitIdRef.current;
            const layout = [];
            orbitMeshes.forEach((mesh) => {
              const isHovered = mesh.userData.orbitId === hoveredId;
              const base = mesh.userData.baseScale || 1;
              const targetScale = base * (isHovered ? 1.65 : 1);
              mesh.scale.x += (targetScale - mesh.scale.x) * 0.18;
              mesh.scale.y = mesh.scale.z = mesh.scale.x;
              mesh.getWorldPosition(projected);
              const point = projectToScreen(THREE, projected, camera, rect.width, rect.height);
              if (point) layout.push({ id: mesh.userData.orbitId, x: point.x, y: point.y });
            });
            onOrbitLayout(layout);
          }

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
  }, [interactive, size, variant, orbitCount, orbitItems?.length, orbitColorOverride]);

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
