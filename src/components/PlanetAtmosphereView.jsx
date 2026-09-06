// Planet Atmosphere (2026-09-06) — the dedicated zoomed-in scene WorldShell
// hands off to once its "enter the planet" travel cinematic finishes for an
// 'atmosphere'-kind island (see ISLAND_REGISTRY in ../lib/worldIslands.js and
// WorldShell.jsx's beginAtmosphereTravel). Not a docked panel or a full-size
// embed — this owns its own camera rig (drag-to-orbit around the zoomed
// planet, same interaction language as CrystalSolarSystem.jsx) so the user
// can rotate the planet to see every moon in its orbit, and scroll in/out to
// watch the planet's own material reveal what's inside it.
//
// The "journey destinations connected to journey data rods" floating inside
// the planet, per Betsy's spec, aren't rendered yet — no journey_scenarios
// row exists for this module's rod_type today (see the Constellation
// Journey Data Model doc from this same build). Revealing the real inner
// crystal structure honestly as the glass goes more transmissive at close
// range is what's built now; wiring real journey-rod data into that reveal
// is the next, separate piece, once a scenario exists to read.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CRYSTAL_VARIANTS, addCrystalLights } from '../lib/crystalGeometry.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import SiteConfigView from './SiteConfigView.jsx';

const GOLD = 0xc4843a;
const TEAL = 0x4a7c8e;
const CREAM = 0xf5f0e8;

function labelSprite(text, subtitle, color) {
  const scale = 3;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const w = 300 * scale, h = subtitle ? 92 * scale : 60 * scale;
  c.width = w; c.height = h;
  ctx.fillStyle = 'rgba(10,16,19,0.72)';
  const r = 10 * scale;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,240,232,0.14)';
  ctx.lineWidth = scale;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = `600 ${15 * scale}px Jost, sans-serif`;
  ctx.fillText(text, w / 2, subtitle ? 34 * scale : 36 * scale);
  if (subtitle) {
    ctx.fillStyle = 'rgba(245,240,232,0.78)';
    ctx.font = `${12 * scale}px Jost, sans-serif`;
    ctx.fillText(subtitle, w / 2, 64 * scale);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const aspect = w / h;
  sprite.scale.set(aspect * 1.05, 1.05, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Stable reference for islands with no moons defined — `island.moons || []`
// would otherwise allocate a new empty array every render, changing the
// mount effect's dependency identity on every re-render and re-tearing-down
// the scene in a loop.
const EMPTY_MOONS = [];

export default function PlanetAtmosphereView({ island, scope, onClear }) {
  const hostRef = useRef(null);
  const [activeMoonKey, setActiveMoonKey] = useState(null);
  const moons = island.moons || EMPTY_MOONS;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL()) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040a0d);
    scene.fog = new THREE.FogExp2(0x040a0d, 0.02);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    addCrystalLights(scene, THREE);
    scene.add(new THREE.AmbientLight(0x314755, 0.4));

    const starGeo = new THREE.BufferGeometry();
    const stars = new Float32Array(900 * 3);
    for (let i = 0; i < stars.length; i += 3) {
      const r = 30 + Math.random() * 60;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 45;
      stars[i] = Math.cos(a) * r; stars[i + 1] = y; stars[i + 2] = Math.sin(a) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: CREAM, size: 0.08, transparent: true, opacity: 0.6 })));

    const planetGroup = new THREE.Group();
    planetGroup.scale.set(2.05, 2.05, 2.05);
    const fn = CRYSTAL_VARIANTS[island.variant] || CRYSTAL_VARIANTS.signature;
    const handles = fn(planetGroup, THREE);
    scene.add(planetGroup);

    const moonPickables = [];
    const moonHolders = [];
    moons.forEach((moon, i) => {
      const angle = (i / Math.max(moons.length, 1)) * Math.PI * 2 + 0.6;
      const radius = 4.4;
      const holder = new THREE.Group();
      holder.userData.baseAngle = angle;
      holder.userData.radius = radius;
      holder.userData.speed = 0.14 + i * 0.02;
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.4 })
      );
      holder.add(mesh);
      const label = labelSprite(moon.label, moon.target === 'undefined' ? 'not yet defined' : null, TEAL);
      label.position.y = 0.7;
      holder.add(label);
      scene.add(holder);
      moonHolders.push(holder);
      moonPickables.push({ obj: mesh, key: moon.key });
    });

    let azimuth = 0.65, elevation = 0.28, distance = 7, targetDistance = 7;
    const target = new THREE.Vector3(0, 0.2, 0);
    let drag = null, dragged = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function resize() {
      const w = host.clientWidth || 900, h = host.clientHeight || 650;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    function down(e) { drag = { x: e.clientX, y: e.clientY }; dragged = false; renderer.domElement.setPointerCapture?.(e.pointerId); }
    function move(e) {
      if (!drag || e.buttons === 0) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      azimuth -= dx * 0.005;
      elevation = clamp(elevation + dy * 0.0035, 0.08, 1.05);
      drag = { x: e.clientX, y: e.clientY };
    }
    function up(e) {
      if (!dragged) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(moonPickables.map((m) => m.obj), true)[0];
        if (hit) {
          const picked = moonPickables.find((m) => m.obj === hit.object);
          if (picked) setActiveMoonKey(picked.key);
        }
      }
      drag = null;
    }
    function wheel(e) { e.preventDefault(); targetDistance = clamp(targetDistance + e.deltaY * 0.012, 3.2, 15); }
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    renderer.domElement.addEventListener('wheel', wheel, { passive: false });

    const clock = new THREE.Clock();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.04);
      const t = clock.getElapsedTime();
      distance += (targetDistance - distance) * 0.08;
      camera.position.set(
        Math.cos(azimuth) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance + 1.1,
        Math.sin(azimuth) * Math.cos(elevation) * distance
      );
      camera.lookAt(target);

      planetGroup.rotation.y += dt * 0.1;
      handles.spin?.forEach((mesh, i) => { mesh.rotation.y += dt * (i % 2 ? -0.14 : 0.17); });

      // Closer = the glass reveals more of what's inside — a real material
      // response to camera distance, not a fixed decorative transparency.
      const closeness = 1 - clamp((distance - 3.2) / (15 - 3.2), 0, 1);
      if (handles.core?.material) {
        if ('transmission' in handles.core.material) handles.core.material.transmission = lerp(0.86, 0.98, closeness);
        handles.core.material.opacity = lerp(0.95, 0.5, closeness);
      }
      if (handles.innerGlow?.material) handles.innerGlow.material.opacity = lerp(0.28, 0.75, closeness);

      moonHolders.forEach((holder) => {
        holder.userData.baseAngle += dt * holder.userData.speed;
        const a = holder.userData.baseAngle, r = holder.userData.radius;
        holder.position.set(Math.cos(a) * r, Math.sin(a * 1.6) * 0.4, Math.sin(a) * r);
      });

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', up);
      renderer.domElement.removeEventListener('wheel', wheel);
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [island, moons]);

  const activeMoon = moons.find((m) => m.key === activeMoonKey) || null;

  if (activeMoon?.target === 'config') {
    return <SiteConfigView scope={scope} onClear={() => setActiveMoonKey(null)} />;
  }
  if (activeMoon) {
    return (
      <div style={S.embedShell}>
        <div style={S.embedHeader}>
          <button style={S.backBtn} onClick={() => setActiveMoonKey(null)}>← Back to {island.label}</button>
          <div style={S.embedTitle}>{activeMoon.label}</div>
        </div>
        <div style={S.embedBody}>
          <p style={S.placeholderText}>
            "{activeMoon.label}" doesn't have defined content yet — nothing here is fabricated. Say what this
            moon should show and it gets built for real, same as Site Configuration was.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onClear}>← Back to World</button>
        <div style={S.title}>{island.label}</div>
      </div>
      {hasWebGL() ? (
        <>
          <div ref={hostRef} style={S.canvasHost} />
          <div style={S.hint}>Drag to orbit · scroll to zoom · click a moon</div>
        </>
      ) : (
        <div style={S.fallback}>3D navigation requires WebGL.</div>
      )}
    </div>
  );
}

const S = {
  shell: { position: 'fixed', inset: 0, background: '#040a0d', color: '#f5f0e8', display: 'flex', flexDirection: 'column', zIndex: 10, fontFamily: 'Jost, sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'rgba(13,20,23,0.7)', backdropFilter: 'blur(8px)' },
  backBtn: { background: 'none', border: '1px solid rgba(245,240,232,0.25)', color: '#f5f0e8', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' },
  title: { fontSize: '1rem', letterSpacing: '0.02em' },
  canvasHost: { flex: 1, position: 'relative' },
  hint: { position: 'absolute', left: '1.2rem', bottom: '1rem', fontSize: '0.68rem', color: 'rgba(245,240,232,0.6)', letterSpacing: '0.03em', pointerEvents: 'none' },
  fallback: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.7)' },
  embedShell: { position: 'fixed', inset: 0, background: '#0d1417', color: '#f5f0e8', zIndex: 10, display: 'flex', flexDirection: 'column' },
  embedHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  embedTitle: { fontFamily: 'Jost, sans-serif', fontSize: '1rem' },
  embedBody: { flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: 640 },
  placeholderText: { fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(245,240,232,0.75)' },
};
