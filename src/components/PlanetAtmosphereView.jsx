// Planet Atmosphere (2026-09-06) — the dedicated zoomed-in scene WorldShell
// hands off to once its "enter the planet" travel cinematic finishes for an
// 'atmosphere'-kind island (see ISLAND_REGISTRY in ../lib/worldIslands.js and
// WorldShell.jsx's beginAtmosphereTravel). Not a docked panel or a full-size
// embed — this owns its own camera rig (drag-to-orbit around the zoomed
// planet, same interaction language as CrystalSolarSystem.jsx) so the user
// can rotate the planet to see every moon in its orbit, and scroll in/out to
// watch the planet's own material reveal what's inside it.
//
// When an island declares `journeyScenarioKey` (see worldIslands.js's
// 'config' entry, wired 2026-09-06 to design_config_setup_journey), each of
// its moons that also carries a `stageKey` is a real journey stage star:
// its brightness reflects that stage's actual evaluated gate (server/lib/
// journeyRods.js evaluateJourneyRod, called via GET /api/journey-rods/:id),
// never a fabricated or decorative value, and consecutive stages (in
// sort_order) are connected by a real line. An island with no
// journeyScenarioKey renders its moons exactly as before — undimmed,
// unconnected, no journey to reflect.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CRYSTAL_VARIANTS, addCrystalLights } from '../lib/crystalGeometry.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import SiteConfigView from './SiteConfigView.jsx';
import { ISLAND_REGISTRY } from '../lib/worldIslands.js';
import { api } from '../lib/api.js';

const GOLD = 0xc4843a;
const TEAL = 0x4a7c8e;
const CREAM = 0xf5f0e8;

// Small, geometrically distinct per-stage star shapes (worldIslands.js's
// moon.geometry) — never all the same octahedron.
const STAR_GEOMETRIES = {
  tetrahedron: (THREE) => new THREE.TetrahedronGeometry(0.34, 0),
  octahedron: (THREE) => new THREE.OctahedronGeometry(0.32, 0),
  dodecahedron: (THREE) => new THREE.DodecahedronGeometry(0.3, 0),
  icosahedron: (THREE) => new THREE.IcosahedronGeometry(0.32, 0),
  box: (THREE) => new THREE.BoxGeometry(0.44, 0.44, 0.44),
};
function starGeometry(THREE, key) {
  return (STAR_GEOMETRIES[key] || STAR_GEOMETRIES.octahedron)(THREE);
}

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

// Stable empty-array reference — `x || []` would otherwise allocate a new
// array every render, changing dependency identity on every re-render and
// re-tearing-down the scene in a loop. Shared for moons and journey keys.
const EMPTY_ARRAY = [];

// Cosmetic only — the journey keys themselves (definition_journey, etc.)
// are the real data; this just formats one for the toggle label instead of
// fetching the scenario catalog just to read a display label.
function humanizeJourneyKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function moonSubtitle(moon) {
  if (moon.destinationKey) {
    const target = ISLAND_REGISTRY[moon.destinationKey];
    return target?.kind === 'atmosphere' ? 'enter →' : target ? 'open →' : 'not yet defined';
  }
  if (moon.panel) return 'open →';
  return 'not yet defined';
}

export default function PlanetAtmosphereView({ island, scope, onClear, onNavigateToIsland, onOpenClassicTools }) {
  const hostRef = useRef(null);
  const [activeMoonKey, setActiveMoonKey] = useState(null);
  const allMoons = island.moons || EMPTY_ARRAY;

  // journeyScenarioKeys (plural) — a toggle between an island's connected
  // journeys ("different connections to different journeys depending on
  // which navigation map toggle you'd want," Betsy, 2026-09-06). A plain
  // singular journeyScenarioKey still works (treated as a one-item list).
  const journeyKeys = island.journeyScenarioKeys || (island.journeyScenarioKey ? [island.journeyScenarioKey] : EMPTY_ARRAY);
  const [selectedJourney, setSelectedJourney] = useState(journeyKeys[0] || null);
  useEffect(() => { setSelectedJourney(journeyKeys[0] || null); }, [island.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moons scoped away from this viewer (definition_journey's admin-only
  // stages) or belonging to a journey that isn't the selected toggle are
  // filtered out before the scene is even built — memoized so this doesn't
  // change reference (and re-tear-down the scene) on unrelated re-renders.
  const moons = useMemo(
    () => allMoons.filter((m) => (!m.scopes || m.scopes.includes(scope)) && (!m.journey || m.journey === selectedJourney)),
    [allMoons, scope, selectedJourney]
  );

  // { [stageKey]: boolean } from the real evaluated journey rod — a ref, not
  // state, since animate() reads it every frame directly against meshes it
  // already owns; no React re-render needed to make brightness update.
  const progressRef = useRef({});

  // Real progress fetch — only when a journey is selected. Refetches when
  // the toggle changes or the user returns from a moon's panel (they may
  // have just posted new evidence via a save), not on a timer or a guess.
  useEffect(() => {
    progressRef.current = {}; // don't show the previous journey's brightness while this one loads
    if (!selectedJourney || activeMoonKey) return undefined;
    let cancelled = false;
    api.getMyJourneyRods()
      .then(async ({ rods }) => {
        if (cancelled) return;
        const rod = rods.find((r) => r.metadata?.scenarioKey === selectedJourney);
        if (!rod) return;
        const detail = await api.getJourneyRod(rod.id);
        if (cancelled) return;
        const map = {};
        for (const gate of detail.gates || []) map[gate.stageKey] = !!gate.passed;
        progressRef.current = map;
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedJourney, activeMoonKey]);

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
      holder.userData.stageKey = moon.stageKey || null;
      const material = new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.4 });
      const mesh = new THREE.Mesh(starGeometry(THREE, moon.geometry), material);
      holder.add(mesh);
      const label = labelSprite(moon.label, moonSubtitle(moon), TEAL);
      label.position.y = 0.7;
      holder.add(label);
      scene.add(holder);
      moonHolders.push(holder);
      moonPickables.push({ obj: mesh, key: moon.key });
    });

    // Journey connector — a real line between consecutive stage moons (array
    // order matches journey_gate_definitions.sort_order, per worldIslands.js's
    // authoring order), not drawn at all for islands with no journeyScenarioKey
    // or fewer than two stage-carrying moons.
    const stageHolders = moonHolders.filter((h) => h.userData.stageKey);
    let connectorLine = null;
    if (selectedJourney && stageHolders.length > 1) {
      const connectorGeo = new THREE.BufferGeometry();
      connectorGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(stageHolders.length * 3), 3));
      connectorLine = new THREE.Line(connectorGeo, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.35 }));
      scene.add(connectorLine);
    }

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
        // Real brightness: dim (not reached / no rod yet) vs. lit (the
        // stage's own gate actually passed, per the last-fetched
        // evaluateJourneyRod result) — never a fabricated in-between value.
        if (holder.userData.stageKey) {
          const passed = !!progressRef.current[holder.userData.stageKey];
          const mesh = holder.children[0];
          if (mesh?.material) {
            mesh.material.emissiveIntensity = lerp(mesh.material.emissiveIntensity, passed ? 1.1 : 0.18, 0.06);
            const targetScale = passed ? 1.15 : 0.85;
            mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
          }
        }
      });

      if (connectorLine) {
        const positions = connectorLine.geometry.attributes.position.array;
        stageHolders.forEach((holder, i) => {
          positions[i * 3] = holder.position.x;
          positions[i * 3 + 1] = holder.position.y;
          positions[i * 3 + 2] = holder.position.z;
        });
        connectorLine.geometry.attributes.position.needsUpdate = true;
      }

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
  }, [island, moons, selectedJourney]);

  const activeMoon = moons.find((m) => m.key === activeMoonKey) || null;

  // A moon that references another top-level destination (destinationKey)
  // never renders its own overlay here — if that destination is itself an
  // 'atmosphere' planet, hand navigation back up to WorldShell so it can
  // swap which island's atmosphere is mounted (one shared definition, e.g.
  // 'config', not a duplicated copy living under 'content' too). Runs as an
  // effect, not during render, since it's a side effect on a prop callback.
  useEffect(() => {
    if (!activeMoon?.destinationKey) return;
    const target = ISLAND_REGISTRY[activeMoon.destinationKey];
    if (target?.kind === 'atmosphere') {
      onNavigateToIsland?.(activeMoon.destinationKey);
      setActiveMoonKey(null);
    }
  }, [activeMoon, onNavigateToIsland]);

  // A moon whose real UI lives inside Classic Tools (the page/section
  // editor isn't extracted from AdminShell yet — see worldIslands.js's
  // comment on the 'content' entry) hands off there instead of opening an
  // overlay of its own. Only fires when the caller actually wired
  // onOpenClassicTools; otherwise falls through to the honest
  // "not yet defined" panel below rather than doing nothing silently.
  useEffect(() => {
    if (!activeMoon?.panel || activeMoon.panel !== 'classicTools' || !onOpenClassicTools) return;
    onOpenClassicTools(activeMoon.classicTab || null);
    setActiveMoonKey(null);
  }, [activeMoon, onOpenClassicTools]);

  if (activeMoon?.panel === 'siteConfigView') {
    return <SiteConfigView scope={scope} onClear={() => setActiveMoonKey(null)} />;
  }
  if (activeMoon?.panel === 'classicTools') {
    if (onOpenClassicTools) return null; // one-frame gap before the effect above navigates away
    return (
      <div style={S.embedShell}>
        <div style={S.embedHeader}>
          <button style={S.backBtn} onClick={() => setActiveMoonKey(null)}>← Back to {island.label}</button>
          <div style={S.embedTitle}>{activeMoon.label}</div>
        </div>
        <div style={S.embedBody}>
          <p style={S.placeholderText}>"{activeMoon.label}" opens in Classic Tools, which this view wasn't given a way to reach.</p>
        </div>
      </div>
    );
  }
  if (activeMoon?.destinationKey) {
    const target = ISLAND_REGISTRY[activeMoon.destinationKey];
    if (target?.kind === 'atmosphere') {
      // One-frame gap between the click and the navigation effect above
      // actually firing — render nothing rather than a flash of an
      // incorrect "can't open" message.
      return null;
    }
    // The referenced destination exists but isn't an 'atmosphere' kind (or
    // doesn't resolve at all) — no current registry entry hits this, but
    // don't silently show nothing if one ever does.
    return (
      <div style={S.embedShell}>
        <div style={S.embedHeader}>
          <button style={S.backBtn} onClick={() => setActiveMoonKey(null)}>← Back to {island.label}</button>
          <div style={S.embedTitle}>{activeMoon.label}</div>
        </div>
        <div style={S.embedBody}>
          <p style={S.placeholderText}>
            "{activeMoon.label}" points at "{activeMoon.destinationKey}", which isn't a destination
            PlanetAtmosphereView knows how to open yet.
          </p>
        </div>
      </div>
    );
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
        {journeyKeys.length > 1 && (
          <div style={S.journeyToggle}>
            {journeyKeys.map((key) => (
              <button
                key={key}
                style={key === selectedJourney ? S.journeyToggleBtnActive : S.journeyToggleBtn}
                onClick={() => setSelectedJourney(key)}
              >
                {humanizeJourneyKey(key)}
              </button>
            ))}
          </div>
        )}
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
  journeyToggle: { display: 'flex', gap: '0.4rem', marginLeft: '1rem' },
  journeyToggleBtn: { background: 'transparent', border: '1px solid rgba(245,240,232,0.2)', color: 'rgba(245,240,232,0.65)', padding: '0.3rem 0.65rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.66rem', letterSpacing: '0.02em', fontFamily: 'inherit' },
  journeyToggleBtnActive: { background: 'rgba(74,124,142,0.35)', border: '1px solid #4a7c8e', color: '#f5f0e8', padding: '0.3rem 0.65rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.66rem', letterSpacing: '0.02em', fontFamily: 'inherit' },
  canvasHost: { flex: 1, position: 'relative' },
  hint: { position: 'absolute', left: '1.2rem', bottom: '1rem', fontSize: '0.68rem', color: 'rgba(245,240,232,0.6)', letterSpacing: '0.03em', pointerEvents: 'none' },
  fallback: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.7)' },
  embedShell: { position: 'fixed', inset: 0, background: '#0d1417', color: '#f5f0e8', zIndex: 10, display: 'flex', flexDirection: 'column' },
  embedHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  embedTitle: { fontFamily: 'Jost, sans-serif', fontSize: '1rem' },
  embedBody: { flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: 640 },
  placeholderText: { fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(245,240,232,0.75)' },
};
