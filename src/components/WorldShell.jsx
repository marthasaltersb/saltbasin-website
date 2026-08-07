// World Shell (2026-08-07) — the real, full-screen "world" landing
// experience: a Crystal Core (the exact homepage crystal mesh — CRYSTAL_
// VARIANTS.signature, not a reimplementation) with island crystals orbiting
// it, each island a module this specific user is actually entitled to
// (resolveWorldIslands, driven by their own member_configs.navigation.
// memberTabs or the platform's admin_nav crm tabs — real config, not a
// hardcoded hub list). Dollying into an island opens either a real docked
// data panel (Career Placement Agents, Commercial Opportunity Pipeline —
// the two pipelines with a live useOpportunityPipeline hook) or, for modules
// without one yet, a hand-off into "Classic Tools" (the existing AdminShell/
// MemberDashboard, mounted unchanged — nothing already built is hidden or
// lost). See /root/.claude/plans/nested-tickling-micali.md for the full
// design rationale and the explicitly-deferred Phase 2/3 (governed
// user-customizable world views).
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { api } from '../lib/api.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights, buildRiverParticles, advanceRiverParticles } from '../lib/crystalGeometry.js';
import { resolveWorldIslands } from '../lib/worldIslands.js';
import { useCareerPlacementAgents, CAREER_DIMENSION_FIELDS } from '../lib/hooks/useCareerPlacementAgents.js';
import { useCommercialOpportunities, COMMERCIAL_DIMENSION_FIELDS, EXPANSION_RING_OPTIONS } from '../lib/hooks/useCommercialOpportunities.js';
import { usePublicationPipeline } from '../lib/hooks/usePublicationPipeline.js';
import AdminShell from './admin/AdminShell.jsx';
import ConfigPanel from './admin/ConfigPanel.jsx';
import { toast } from '../lib/toast.js';

const ISLAND_RADIUS = 9;
const ACCENT_HEX = { gold: 0xc4843a, teal: 0x4a7c8e, pink: 0xd98ca0 };

function labelSprite(THREE, title, subtitle, accentHex) {
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
  ctx.fillStyle = '#' + (accentHex || 0xc4843a).toString(16).padStart(6, '0');
  ctx.font = `600 ${15 * scale}px Jost, sans-serif`;
  ctx.fillText(title, w / 2, subtitle ? 34 * scale : 36 * scale);
  if (subtitle) {
    ctx.fillStyle = 'rgba(245,240,232,0.78)';
    ctx.font = `${12 * scale}px Jost, sans-serif`;
    ctx.fillText(subtitle, w / 2, 64 * scale);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const aspect = w / h;
  sprite.scale.set(aspect * 1.15, 1.15, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function buildIslandBase(THREE, accentHex) {
  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.9, 0.5, 7),
    new THREE.MeshStandardMaterial({ color: 0x1c2b30, roughness: 0.85, metalness: 0.08, flatShading: true })
  );
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.52, 0.03, 8, 48),
    new THREE.MeshBasicMaterial({ color: accentHex, transparent: true, opacity: 0.55 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.26;
  const group = new THREE.Group();
  group.add(rock, rim);
  return group;
}

export default function WorldShell() {
  const nav = useNavigate();
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const [user, setUser] = useState(undefined); // undefined = checking, null = redirecting
  const [tabsConfig, setTabsConfig] = useState(null);
  const [view, setView] = useState('world'); // 'world' | 'journeys' | 'classic'
  const [focusedKey, setFocusedKey] = useState(null);

  useEffect(() => {
    api.me()
      .then(({ user: u }) => { if (!u) nav('/login', { replace: true }); else setUser(u); })
      .catch(() => nav('/login', { replace: true }));
  }, [nav]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      api.getAdminNav()
        .then((navData) => {
          // Islands pull from every admin_nav view that has at least one
          // ISLAND_REGISTRY-known componentId, not just 'crm' — e.g. 'content'
          // owns 'config' (Site Configuration). resolveWorldIslands already
          // silently skips anything unregistered, so combining views here is
          // safe even as admin_nav grows tabs with no island yet.
          const tabs = (navData.views || []).flatMap((v) => v.tabs || []);
          setTabsConfig(tabs);
        })
        .catch(() => setTabsConfig([]));
    } else {
      api.getMemberDraftConfig()
        .then((cfg) => setTabsConfig(cfg?.navigation?.memberTabs || []))
        .catch(() => setTabsConfig([]));
    }
  }, [user]);

  const islands = useMemo(() => resolveWorldIslands(tabsConfig || []), [tabsConfig]);
  const hasCareerIsland = islands.some((i) => i.componentId === 'careerPlacementAgents');
  const hasCommercialIsland = islands.some((i) => i.componentId === 'commercialOpportunities');
  const hasHerqIsland = islands.some((i) => i.componentId === 'herqPublications');
  const career = useCareerPlacementAgents({ enabled: hasCareerIsland });
  const commercial = useCommercialOpportunities({ enabled: hasCommercialIsland });
  const herq = usePublicationPipeline({ enabled: hasHerqIsland });

  const focused = islands.find((i) => i.key === focusedKey) || null;

  const selectIsland = useCallback((key) => setFocusedKey(key), []);
  const clearFocus = useCallback(() => setFocusedKey(null), []);

  // Gates when the canvas-host div actually exists in the DOM: on first
  // render (before user/tabsConfig load) the component returns the loading
  // screen instead of the shell, so `hostRef` is still null. Without `ready`
  // in the mount effect's deps below, the effect fires exactly once on that
  // first render, finds no host, and never retries once the real shell (and
  // its host div) mounts a moment later — the classic ref-vs-conditional-
  // render timing bug CLAUDE.md already flags for this codebase.
  const ready = user !== undefined && !!tabsConfig;

  // ── Three.js mount: renderer/scene/camera/core created once ──
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL() || view !== 'world') return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1013, 0.016);
    const width = host.clientWidth || 900;
    const height = host.clientHeight || 640;
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x0a1013);
    host.appendChild(renderer.domElement);

    addCrystalLights(scene, THREE);
    scene.add(new THREE.AmbientLight(0x3a4550, 0.3));

    const coreGroup = new THREE.Group();
    coreGroup.scale.set(1.35, 1.35, 1.35);
    const coreHandles = CRYSTAL_VARIANTS.signature(coreGroup, THREE);
    scene.add(coreGroup);

    const islandsGroup = new THREE.Group();
    scene.add(islandsGroup);
    const riversGroup = new THREE.Group();
    scene.add(riversGroup);

    let orbitAngle = 0.5, orbitElev = 0.32, orbitRadius = 22;
    let dollyTarget = null;
    const cameraTarget = new THREE.Vector3(0, 0.6, 0);
    let pickables = [];

    function render() {
      if (dollyTarget) {
        cameraTarget.lerp(dollyTarget.point, 0.1);
        orbitRadius += (dollyTarget.radius - orbitRadius) * 0.1;
        if (Math.abs(orbitRadius - dollyTarget.radius) < 0.2) dollyTarget = null;
      } else {
        cameraTarget.lerp(new THREE.Vector3(0, 0.6, 0), 0.04);
      }
      camera.position.x = cameraTarget.x + orbitRadius * Math.cos(orbitAngle) * Math.cos(orbitElev);
      camera.position.z = cameraTarget.z + orbitRadius * Math.sin(orbitAngle) * Math.cos(orbitElev);
      camera.position.y = cameraTarget.y + orbitRadius * Math.sin(orbitElev) + 1.4;
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    let dragStart = null, didDrag = false;
    function ndc(cx, cy) {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    }
    function onDown(e) {
      renderer.domElement.setPointerCapture?.(e.pointerId);
      dragStart = { x: e.clientX, y: e.clientY, t: performance.now() };
      didDrag = false;
    }
    function onMove(e) {
      if (!dragStart || e.buttons === 0) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag = true;
      if (didDrag) {
        orbitAngle -= dx * 0.005;
        orbitElev = Math.max(0.08, Math.min(1.1, orbitElev + dy * 0.0035));
        dragStart = { x: e.clientX, y: e.clientY, t: dragStart.t };
      }
    }
    function onUp(e) {
      if (dragStart) {
        const dt = performance.now() - dragStart.t;
        const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
        if (!didDrag && moved < 8 && dt < 600) {
          raycaster.setFromCamera(ndc(e.clientX, e.clientY), camera);
          const hits = raycaster.intersectObjects(pickables.map((p) => p.obj), true);
          if (hits.length) {
            const found = pickables.find((p) => p.obj === hits[0].object || hits[0].object.parent === p.obj);
            if (found) {
              const worldPos = new THREE.Vector3();
              found.obj.getWorldPosition(worldPos);
              if (found.kind === 'core') {
                dollyTarget = { point: new THREE.Vector3(0, 0.6, 0), radius: 22 };
                engineRef.current?.onSelect(null);
              } else {
                dollyTarget = { point: worldPos, radius: 5.2 };
                engineRef.current?.onSelect(found.key);
              }
            }
          }
        }
      }
      dragStart = null; didDrag = false;
    }
    function onWheel(e) {
      e.preventDefault();
      orbitRadius = Math.max(4, Math.min(34, orbitRadius + e.deltaY * 0.02));
    }
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointercancel', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    let rafId;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = clock.getDelta();
      coreGroup.rotation.y = t * 0.08;
      coreHandles.spin.forEach((m, i) => { m.rotation.z += (i % 2 ? -0.008 : 0.01); });
      islandsGroup.children.forEach((isl) => {
        isl.userData.handles?.spin.forEach((m, i) => { m.rotation.y += (i % 2 ? -0.012 : 0.014); });
        isl.rotation.y += isl.userData.driftSpeed || 0;
      });
      riversGroup.children.forEach((r) => advanceRiverParticles(r, dt));
      render();
    }
    animate();

    function handleResize() {
      const w = host.clientWidth || 900, h = host.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);

    engineRef.current = {
      scene, coreGroup, islandsGroup, riversGroup,
      setPickables: (p) => { pickables = p; },
      dollyTo: (point, radius) => { dollyTarget = { point, radius }; },
      onSelect: () => {},
    };

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ready]);

  // Re-attach the click handler every time the mount effect above creates a
  // fresh engine (view/ready in deps, matching that effect exactly) — not
  // just when `selectIsland` itself changes (it never does; it's a stable
  // useCallback). Without `view`/`ready` here, a newly (re)created engine's
  // `onSelect` stays stuck on the mount effect's `() => {}` placeholder
  // forever, since this effect would never fire again to overwrite it —
  // clicks would raycast correctly but silently do nothing.
  useEffect(() => {
    if (engineRef.current) engineRef.current.onSelect = selectIsland;
  }, [selectIsland, view, ready]);

  // ── Data changes: rebuild islands + rivers, don't touch renderer/core ──
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !islands.length) return;
    const { islandsGroup, riversGroup } = engine;
    while (islandsGroup.children.length) islandsGroup.remove(islandsGroup.children[0]);
    while (riversGroup.children.length) riversGroup.remove(riversGroup.children[0]);
    const pickables = [{ obj: engine.coreGroup, kind: 'core', key: null }];

    islands.forEach((isl, i) => {
      const angle = (i / islands.length) * Math.PI * 2 + 0.3;
      const x = Math.cos(angle) * ISLAND_RADIUS;
      const z = Math.sin(angle) * ISLAND_RADIUS;
      const holder = new THREE.Group();
      holder.position.set(x, 0, z);
      holder.userData.driftSpeed = 0.0015 + (i % 3) * 0.0006;

      const base = buildIslandBase(THREE, ACCENT_HEX[isl.accent] || ACCENT_HEX.gold);
      base.position.y = -0.35;
      holder.add(base);

      const crystalGroup = new THREE.Group();
      crystalGroup.scale.set(0.62, 0.62, 0.62);
      crystalGroup.position.y = 0.55;
      const fn = CRYSTAL_VARIANTS[isl.variant] || CRYSTAL_VARIANTS.signature;
      const handles = fn(crystalGroup, THREE);
      holder.add(crystalGroup);
      holder.userData.handles = handles;

      const liveStat = isl.componentId === 'careerPlacementAgents' && hasCareerIsland
        ? `${career.opportunities.length} tracked`
        : isl.componentId === 'commercialOpportunities' && hasCommercialIsland
          ? `${commercial.opportunities.length} tracked`
          : isl.componentId === 'herqPublications' && hasHerqIsland
            ? `${herq.items.length} items`
            : null;
      const label = labelSprite(THREE, isl.label, liveStat, ACCENT_HEX[isl.accent] || ACCENT_HEX.gold);
      label.position.set(0, 2.1, 0);
      holder.add(label);

      islandsGroup.add(holder);
      pickables.push({ obj: crystalGroup, kind: 'island', key: isl.key });

      const river = buildRiverParticles(THREE, {
        from: new THREE.Vector3(0, 0.4, 0),
        to: new THREE.Vector3(x, 0.2, z),
        color: ACCENT_HEX[isl.accent] || ACCENT_HEX.gold,
        count: 46,
      });
      riversGroup.add(river);
    });

    engine.setPickables(pickables);
    // `view` is a dep so returning to the World tab (which unmounts/remounts
    // the renderer via the effect above) re-populates the fresh engine's
    // now-empty islands/rivers groups, not just genuine data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islands, hasCareerIsland, hasCommercialIsland, hasHerqIsland, career.opportunities.length, commercial.opportunities.length, herq.items.length, view]);

  // Dolly the camera when focus changes from outside the canvas (e.g. the
  // right-rail "Back to World" control), not just from an in-canvas click.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!focused) { engine.dollyTo(new THREE.Vector3(0, 0.6, 0), 17); return; }
    const idx = islands.findIndex((i) => i.key === focused.key);
    if (idx < 0) return;
    const angle = (idx / islands.length) * Math.PI * 2 + 0.3;
    const point = new THREE.Vector3(Math.cos(angle) * ISLAND_RADIUS, 0.4, Math.sin(angle) * ISLAND_RADIUS);
    engine.dollyTo(point, 5.2);
  }, [focused, islands, view]);

  if (view === 'classic') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
        <button style={S.classicBack} onClick={() => setView('world')}>← Back to World</button>
        <AdminShell scope={user?.role === 'admin' ? 'admin' : 'member'} />
      </div>
    );
  }

  if (focused?.kind === 'embed' && focused.componentId === 'config') {
    return <SiteConfigView scope={user?.role === 'admin' ? 'admin' : 'member'} onClear={clearFocus} />;
  }

  if (user === undefined || !tabsConfig) {
    return <div style={S.loading}>Entering your world…</div>;
  }

  return (
    <div style={S.shell}>
      <TopBar
        user={user}
        view={view}
        setView={setView}
        career={career}
        commercial={commercial}
        hasCareerIsland={hasCareerIsland}
        hasCommercialIsland={hasCommercialIsland}
      />
      {view === 'journeys' ? (
        <JourneysGrid islands={islands} career={career} commercial={commercial} herq={herq} onOpen={(key) => { setFocusedKey(key); setView('world'); }} />
      ) : (
        <div style={S.stage}>
          {hasWebGL() ? (
            <>
              <div ref={hostRef} style={S.canvasHost} />
              {!focused && <div style={S.hint}>Drag to orbit · scroll to zoom · click an island to enter</div>}
            </>
          ) : (
            <div style={S.webglFallback}>
              This device/browser doesn't support WebGL — switch to the Journeys tab above for a list view.
            </div>
          )}
        </div>
      )}
      {view === 'world' && (
        <RightRail
          focused={focused}
          onClear={clearFocus}
          onOpenClassic={() => setView('classic')}
          career={career}
          commercial={commercial}
          herq={herq}
          hasCareerIsland={hasCareerIsland}
          hasCommercialIsland={hasCommercialIsland}
        />
      )}
    </div>
  );
}

function TopBar({ user, view, setView, career, commercial, hasCareerIsland, hasCommercialIsland }) {
  const trackedCount = hasCareerIsland ? career.opportunities.length : hasCommercialIsland ? commercial.opportunities.length : 0;
  const scored = (hasCareerIsland ? career.opportunities : hasCommercialIsland ? commercial.opportunities : []).filter((o) => o.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, o) => s + o.score.score, 0) / scored.length) : null;
  const agentCount = hasCareerIsland ? career.agents.length : hasCommercialIsland ? commercial.agents.length : 0;
  return (
    <div style={S.topbar}>
      <div style={S.brand}>
        <span style={S.brandMark}>◈</span>
        <div>
          <div style={S.brandTitle}>SALT BASIN</div>
          <div style={S.brandSub}>Your World</div>
        </div>
      </div>
      <div style={S.navTabs}>
        <button style={S.navTab(view === 'world')} onClick={() => setView('world')}>World</button>
        <button style={S.navTab(view === 'journeys')} onClick={() => setView('journeys')}>Journeys</button>
        <button style={S.navTab(view === 'classic')} onClick={() => setView('classic')}>Classic Tools</button>
      </div>
      <div style={S.stats}>
        <div style={S.stat}><span style={S.statVal}>{trackedCount}</span><span style={S.statLabel}>Tracked</span></div>
        <div style={S.stat}><span style={S.statVal}>{agentCount}</span><span style={S.statLabel}>Agents</span></div>
        <div style={S.stat}><span style={S.statVal}>{avgScore ?? '—'}</span><span style={S.statLabel}>Avg Score</span></div>
        <div style={S.profileChip}>
          <div style={S.profileAvatar}>{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
          <div>
            <div style={S.profileName}>{user.displayName || user.email}</div>
            <div style={S.profileRole}>{user.role === 'admin' ? 'System Architect' : 'Member'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneysGrid({ islands, career, commercial, herq, onOpen }) {
  return (
    <div style={S.journeysGrid}>
      {islands.map((isl) => {
        const opp = isl.componentId === 'careerPlacementAgents' ? career : isl.componentId === 'commercialOpportunities' ? commercial : null;
        const sub = opp
          ? `${opp.opportunities.length} tracked · ${opp.agents.length} agents`
          : isl.componentId === 'herqPublications'
            ? `${herq.items.length} items · ${herq.agents.length} agents`
            : isl.kind === 'embed'
              ? 'Open configuration'
              : 'Open in Classic Tools';
        return (
          <div key={isl.key} style={S.journeyCard} onClick={() => onOpen(isl.key)}>
            <div style={{ ...S.journeyAccent, background: '#' + (ACCENT_HEX[isl.accent] || ACCENT_HEX.gold).toString(16).padStart(6, '0') }} />
            <div style={S.journeyLabel}>{isl.label}</div>
            <div style={S.journeySub}>{sub}</div>
          </div>
        );
      })}
    </div>
  );
}

function RightRail({ focused, onClear, onOpenClassic, career, commercial, herq, hasCareerIsland, hasCommercialIsland }) {
  if (focused) {
    if (focused.componentId === 'herqPublications') {
      return <PublicationDockedPanel label={focused.label} herq={herq} onClear={onClear} />;
    }
    if (focused.kind === 'docked') {
      const pipeline = focused.componentId === 'careerPlacementAgents' ? career : commercial;
      const dimensionFields = focused.componentId === 'careerPlacementAgents' ? CAREER_DIMENSION_FIELDS : COMMERCIAL_DIMENSION_FIELDS;
      return <DockedPipelinePanel label={focused.label} pipeline={pipeline} dimensionFields={dimensionFields} onClear={onClear} isCommercial={focused.componentId === 'commercialOpportunities'} />;
    }
    return (
      <div style={S.rail}>
        <button style={S.backBtn} onClick={onClear}>← Back to World</button>
        <div style={S.railTitle}>{focused.label}</div>
        <p style={S.railText}>This module doesn't have its own in-world view yet — open it in Classic Tools to work with it directly.</p>
        <button style={S.gold} onClick={onOpenClassic}>Open in Classic Tools</button>
      </div>
    );
  }

  const pipeline = hasCareerIsland ? career : hasCommercialIsland ? commercial : null;
  const label = hasCareerIsland ? 'Career Placement Agents' : hasCommercialIsland ? 'Commercial Opportunity Pipeline' : null;
  if (!pipeline) {
    return (
      <div style={S.rail}>
        <div style={S.railTitle}>Your World</div>
        <p style={S.railText}>Click an island to enter it.</p>
      </div>
    );
  }
  const scored = pipeline.opportunities.filter((o) => o.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, o) => s + o.score.score, 0) / scored.length) : null;
  const top = [...scored].sort((a, b) => b.score.score - a.score.score).slice(0, 5);
  const recentEvidence = pipeline.opportunities
    .flatMap((o) => (o.evidence || []).map((e) => ({ ...e, opp: o })))
    .sort((a, b) => b.observedAt - a.observedAt)
    .slice(0, 5);

  return (
    <div style={S.rail}>
      <div style={S.railTitle}>{label}</div>
      <div style={S.gaugeWrap}>
        <div style={S.gauge}>{avgScore ?? '—'}</div>
        <div style={S.gaugeLabel}>Avg score{avgScore != null ? ' / 100' : ''}</div>
      </div>
      <div style={S.railSubtitle}>Top Tracked</div>
      {top.length === 0 && <div style={S.railEmpty}>Nothing scored yet.</div>}
      {top.map((o) => (
        <div key={o.id} style={S.railRow}>
          <span>{o.metadata?.jobTitle || o.metadata?.companyName}</span>
          <span style={S.railScore}>{Math.round(o.score.score)}</span>
        </div>
      ))}
      <div style={S.railSubtitle}>Recent Activity</div>
      {recentEvidence.length === 0 && <div style={S.railEmpty}>No recorded evidence yet.</div>}
      {recentEvidence.map((e) => (
        <div key={e.id} style={S.railRow}>
          <span>{e.opp.metadata?.jobTitle || e.opp.metadata?.companyName}</span>
          <span style={S.railTime}>{new Date(e.observedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

function scoreColor(score) {
  if (score == null) return '#8b877c';
  if (score >= 80) return '#8fbf98';
  if (score >= 60) return '#c4843a';
  return '#d98ca0';
}

function DockedPipelinePanel({ label, pipeline, dimensionFields, onClear, isCommercial }) {
  const {
    loading, opportunities, selectedOpportunityId, selectedOpportunity, selectOpportunity,
    showAddForm, setShowAddForm, addForm, setAddForm, handleAddOpportunity,
    scoreDraft, setScoreDraft, handleSaveScore, saving,
  } = pipeline;

  return (
    <div style={S.rail}>
      <button style={S.backBtn} onClick={onClear}>← Back to World</button>
      <div style={S.railTitle}>{label}</div>

      {loading ? (
        <div style={S.railEmpty}>Loading…</div>
      ) : selectedOpportunity ? (
        <>
          <div style={S.railSubtitle}>{selectedOpportunity.metadata?.jobTitle || selectedOpportunity.metadata?.companyName}</div>
          <div style={S.railRow}><span>Stage</span><span>{selectedOpportunity.currentStage}</span></div>
          <div style={S.railRow}>
            <span>Score</span>
            <span style={{ color: scoreColor(selectedOpportunity.score?.score), fontWeight: 600 }}>
              {selectedOpportunity.score ? `${Math.round(selectedOpportunity.score.score)} / 100${selectedOpportunity.score.tier ? ` — ${selectedOpportunity.score.tier}` : ''}` : 'Not yet scored'}
            </span>
          </div>
          <div style={S.railSubtitle}>Score (0–5 per dimension)</div>
          <div style={S.dimGrid}>
            {dimensionFields.map((d) => (
              <React.Fragment key={d.key}>
                <label style={S.dimLabel}>{d.label}</label>
                <input
                  type="number" min="0" max="5" step="0.5" style={S.dimInput}
                  value={scoreDraft[d.key] ?? ''}
                  onChange={(e) => setScoreDraft({ ...scoreDraft, [d.key]: e.target.value })}
                />
              </React.Fragment>
            ))}
          </div>
          <button style={S.gold} onClick={handleSaveScore} disabled={saving}>{saving ? 'Saving…' : 'Save Scores'}</button>
          <button style={S.ghost} onClick={() => selectOpportunity(null)}>← Tracked list</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.railSubtitle}>Tracked ({opportunities.length})</div>
            <button style={S.ghostSmall} onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? 'Cancel' : '+ Add'}</button>
          </div>
          {showAddForm && (
            <form onSubmit={handleAddOpportunity} style={S.addForm}>
              {isCommercial ? (
                <>
                  <input style={S.dimInputWide} placeholder="Company" value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} />
                  <input style={S.dimInputWide} placeholder="Event trigger" value={addForm.eventTrigger} onChange={(e) => setAddForm({ ...addForm, eventTrigger: e.target.value })} />
                  <select style={S.dimInputWide} value={addForm.expansionRing} onChange={(e) => setAddForm({ ...addForm, expansionRing: e.target.value })}>
                    {EXPANSION_RING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <input style={S.dimInputWide} placeholder="Job title" value={addForm.jobTitle} onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })} />
                  <input style={S.dimInputWide} placeholder="Company" value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} />
                </>
              )}
              <button type="submit" style={S.gold} disabled={saving}>{saving ? 'Saving…' : 'Track'}</button>
            </form>
          )}
          {!opportunities.length && !showAddForm && <div style={S.railEmpty}>Nothing tracked yet.</div>}
          {opportunities.map((o) => (
            <div key={o.id} style={S.railRow} onClick={() => selectOpportunity(o.id)} className="sb-world-row">
              <span>{o.metadata?.jobTitle || o.metadata?.companyName}</span>
              <span style={{ color: scoreColor(o.score?.score), fontWeight: 600 }}>{o.score ? Math.round(o.score.score) : '—'}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const OUTPUT_DESTINATION_OPTIONS = [
  { value: 'salt_basin_site', label: 'Salt Basin site' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'external', label: 'External / other' },
];

const HERQ_STATUS_COLOR = { idea: '#8b877c', drafting: '#c4843a', scheduled: '#8fadb6', published: '#8fbf98', referenced: '#4a7c8e', paused: '#d98ca0' };

// HERQ Publications docked panel (2026-08-07, Publication journey, first
// slice — see /root/.claude/plans/nested-tickling-micali.md). Shows real
// unified_content_items (app_id='app.herq'), the real HERQ Content &
// Publication Agent + shared approval workflow, its schedule (cadence +
// the new observation-gating flag), and the flow config (criteria/stages/
// output destination) via the config-envelopes API. Agent creation/editing
// and actual publishing are not built here — same "config/tracking
// scaffolding a human operates, real data, no fabricated autonomy" honesty
// as the Career/Commercial docked panels.
function PublicationDockedPanel({ label, herq, onClear }) {
  const { loading, items, workflow, flow, contentAgent, latestSchedule, saveFlow, saveSchedule, saving } = herq;
  const [criteriaDraft, setCriteriaDraft] = useState('');
  const [destinationDraft, setDestinationDraft] = useState('salt_basin_site');
  const [cadenceDraft, setCadenceDraft] = useState('on_demand');
  const [observationRequired, setObservationRequired] = useState(false);
  const [moleculeKeyDraft, setMoleculeKeyDraft] = useState('signal');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && flow) {
      setCriteriaDraft((flow.criteria || []).join(', '));
      setDestinationDraft(flow.outputDestination?.type || 'salt_basin_site');
      setObservationRequired(!!flow.observation?.required);
      setMoleculeKeyDraft(flow.observation?.moleculeKey || 'signal');
      setInitialized(true);
    }
  }, [flow, initialized]);

  useEffect(() => {
    if (latestSchedule) setCadenceDraft(latestSchedule.cadence || 'on_demand');
  }, [latestSchedule]);

  function handleSaveFlow() {
    saveFlow({
      criteria: criteriaDraft.split(',').map((c) => c.trim()).filter(Boolean),
      stages: flow?.stages || ['idea', 'drafting', 'scheduled', 'published', 'referenced', 'paused'],
      outputDestination: { type: destinationDraft, detail: flow?.outputDestination?.detail || '' },
      observation: { required: observationRequired, moleculeKey: observationRequired ? moleculeKeyDraft : null },
    });
  }

  function handleSaveSchedule() {
    saveSchedule({
      cadence: cadenceDraft,
      triggerMode: observationRequired ? 'observation_required' : 'scheduled',
      triggerMoleculeKey: observationRequired ? moleculeKeyDraft : null,
    });
  }

  if (loading) return <div style={S.rail}><div style={S.railEmpty}>Loading…</div></div>;

  return (
    <div style={S.rail}>
      <button style={S.backBtn} onClick={onClear}>← Back to World</button>
      <div style={S.railTitle}>{label}</div>

      {contentAgent && (
        <>
          <div style={S.railSubtitle}>{contentAgent.name}</div>
          <p style={S.railText}>{contentAgent.roleDescription}</p>
        </>
      )}
      {!!workflow.length && (
        <>
          <div style={S.railSubtitle}>Approval Workflow</div>
          {workflow.map((step) => (
            <div key={step.stepKey} style={S.railRow}>
              <span>{step.name}</span>
              <span style={{ color: step.requiredRoleLabel ? '#c4843a' : '#8fbf98' }}>{step.requiredRoleLabel || 'No gate'}</span>
            </div>
          ))}
        </>
      )}

      <div style={S.railSubtitle}>Schedule</div>
      <select style={S.dimInputWide} value={cadenceDraft} onChange={(e) => setCadenceDraft(e.target.value)}>
        {['on_demand', 'daily', 'weekly', 'hourly'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', margin: '0.4rem 0', color: '#cfc9bd' }}>
        <input type="checkbox" checked={observationRequired} onChange={(e) => setObservationRequired(e.target.checked)} />
        Requires an observation before acting
      </label>
      {observationRequired && (
        <input style={S.dimInputWide} placeholder="Molecule key (e.g. signal)" value={moleculeKeyDraft} onChange={(e) => setMoleculeKeyDraft(e.target.value)} />
      )}
      <button style={S.ghost} onClick={handleSaveSchedule} disabled={saving || !contentAgent}>{saving ? 'Saving…' : 'Save Schedule'}</button>

      <div style={S.railSubtitle}>Flow Config</div>
      <label style={S.dimLabel}>Research criteria (comma-separated)</label>
      <input style={S.dimInputWide} value={criteriaDraft} onChange={(e) => setCriteriaDraft(e.target.value)} placeholder="e.g. RevOps trends, PE portfolio ops" />
      <label style={S.dimLabel}>Output destination</label>
      <select style={S.dimInputWide} value={destinationDraft} onChange={(e) => setDestinationDraft(e.target.value)}>
        {OUTPUT_DESTINATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button style={S.gold} onClick={handleSaveFlow} disabled={saving}>{saving ? 'Saving…' : 'Save Flow Config'}</button>

      <div style={S.railSubtitle}>Content Items ({items.length})</div>
      {!items.length && <div style={S.railEmpty}>Nothing published yet.</div>}
      {items.map((it) => (
        <div key={it.id} style={S.railRow}>
          <span>{it.title}</span>
          <span style={{ color: HERQ_STATUS_COLOR[it.exportStatus] || '#8b877c', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>{it.exportStatus}</span>
        </div>
      ))}
    </div>
  );
}

// Public Site Configuration island's full-screen destination (kind:'embed').
// Wraps the existing ConfigPanel.jsx wholesale — it's 1600+ lines (theme,
// brand colors, social, SEO, page types...), far too much for the ~300px
// docked rail, so this island gets real screen space instead of a cut-down
// duplicate. Self-contained data loading/save/publish per role, matching
// the salt-basin-pre-build skill's Phase 2 (Personal Brand Website & World,
// member-org-admin-config.md §2/§3) — "Do not require the Member to edit
// source code," "public / private / draft state." `site` is intentionally
// not fetched/passed — ConfigPanel already defaults it to null and this
// island is scoped to identity/theme/social config, not page content.
function SiteConfigView({ scope, onClear }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const load = scope === 'admin' ? api.getDraftConfig : api.getMemberDraftConfig;
    load().then(setConfig).catch((e) => toast('Failed to load site configuration: ' + e.message));
  }, [scope]);

  async function handleSave() {
    setSaving(true);
    try {
      await (scope === 'admin' ? api.saveDraftConfig(config) : api.saveMemberDraftConfig(config));
      toast('Saved.');
    } catch (e) {
      toast('Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await (scope === 'admin' ? api.saveDraftConfig(config).then(api.publish) : api.saveMemberDraftConfig(config).then(api.publishMemberConfig));
      toast('Published.');
    } catch (e) {
      toast('Could not publish: ' + e.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={S.embedShell}>
      <div style={S.embedHeader}>
        <button style={S.backBtn} onClick={onClear}>← Back to World</button>
        <div style={S.embedTitle}>Site Configuration</div>
        <div style={{ flex: 1 }} />
        <button style={S.ghostSmall} onClick={handleSave} disabled={saving || !config}>{saving ? 'Saving…' : 'Save Draft'}</button>
        <button style={{ ...S.ghostSmall, marginLeft: '0.5rem', background: '#c4843a', color: '#1c1410', border: 'none' }} onClick={handlePublish} disabled={publishing || !config}>{publishing ? 'Publishing…' : 'Publish'}</button>
      </div>
      <div style={S.embedBody}>
        {!config ? <div style={S.railEmpty}>Loading…</div> : <ConfigPanel config={config} onChange={setConfig} scope={scope} site={null} />}
      </div>
    </div>
  );
}

const glass = { background: 'rgba(13,20,23,0.72)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(245,240,232,0.1)' };

const S = {
  shell: { position: 'fixed', inset: 0, background: '#05090b', color: '#f5f0e8', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', zIndex: 5 },
  embedShell: { position: 'fixed', inset: 0, background: '#0d1417', color: '#f5f0e8', zIndex: 10, display: 'flex', flexDirection: 'column' },
  embedHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  embedTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem' },
  embedBody: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
  loading: { position: 'fixed', inset: 0, background: '#05090b', color: '#c4843a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: '1.1rem', letterSpacing: '0.04em' },
  topbar: { ...glass, display: 'flex', alignItems: 'center', gap: '2rem', padding: '0.75rem 1.5rem', flexShrink: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' },
  brand: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  brandMark: { fontSize: '1.4rem', color: '#c4843a' },
  brandTitle: { fontFamily: 'Fraunces, serif', fontSize: '0.95rem', letterSpacing: '0.08em' },
  brandSub: { fontSize: '0.65rem', color: '#8b877c', letterSpacing: '0.06em' },
  navTabs: { display: 'flex', gap: '0.4rem', flex: 1 },
  navTab: (active) => ({
    padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 500, cursor: 'pointer',
    background: active ? 'rgba(196,132,58,0.16)' : 'transparent', color: active ? '#c4843a' : '#cfc9bd',
    border: active ? '0.5px solid rgba(196,132,58,0.4)' : '0.5px solid transparent',
  }),
  stats: { display: 'flex', alignItems: 'center', gap: '1.1rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 },
  statVal: { fontFamily: 'Fraunces, serif', fontSize: '1rem', color: '#f5f0e8' },
  statLabel: { fontSize: '0.6rem', color: '#8b877c', letterSpacing: '0.05em', textTransform: 'uppercase' },
  profileChip: { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '0.5px solid rgba(245,240,232,0.12)' },
  profileAvatar: { width: 30, height: 30, borderRadius: '50%', background: '#c4843a', color: '#1c1410', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' },
  profileName: { fontSize: '0.76rem', fontWeight: 600 },
  profileRole: { fontSize: '0.62rem', color: '#8b877c' },
  stage: { position: 'relative', flex: 1, minHeight: 0 },
  canvasHost: { position: 'absolute', inset: 0 },
  hint: { position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: 'rgba(245,240,232,0.55)', ...glass, padding: '0.4rem 0.9rem', borderRadius: 20 },
  webglFallback: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', color: '#a9a49a', fontSize: '0.85rem' },
  rail: { ...glass, position: 'absolute', top: '5.2rem', right: '1rem', bottom: '1rem', width: 300, borderRadius: 12, padding: '1rem', overflowY: 'auto', fontSize: '0.8rem' },
  railTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem', marginBottom: '0.6rem' },
  railSubtitle: { fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c4843a', margin: '0.9rem 0 0.4rem' },
  railText: { color: '#a9a49a', fontSize: '0.78rem', lineHeight: 1.5 },
  railEmpty: { color: '#8b877c', fontSize: '0.75rem', padding: '0.5rem 0' },
  railRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '0.4rem 0.3rem', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', borderRadius: 4 },
  railScore: { color: '#c4843a', fontWeight: 600 },
  railTime: { color: '#8b877c' },
  gaugeWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8rem 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)' },
  gauge: { fontFamily: 'Fraunces, serif', fontSize: '2rem', color: '#c4843a' },
  gaugeLabel: { fontSize: '0.65rem', color: '#8b877c', letterSpacing: '0.05em' },
  backBtn: { background: 'transparent', border: 'none', color: '#8fadb6', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginBottom: '0.7rem' },
  gold: { width: '100%', padding: '0.55rem', borderRadius: 6, border: 'none', background: '#c4843a', color: '#1c1410', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', marginTop: '0.6rem' },
  ghost: { width: '100%', padding: '0.5rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#f5f0e8', fontSize: '0.74rem', cursor: 'pointer', marginTop: '0.5rem' },
  ghostSmall: { padding: '0.3rem 0.6rem', borderRadius: 6, border: '0.5px solid rgba(196,132,58,0.4)', background: 'transparent', color: '#c4843a', fontSize: '0.68rem', cursor: 'pointer' },
  dimGrid: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.35rem 0.5rem', alignItems: 'center', marginBottom: '0.5rem' },
  dimLabel: { fontSize: '0.68rem', color: '#cfc9bd' },
  dimInput: { width: 52, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 5, color: '#f5f0e8', padding: '0.3rem' },
  dimInputWide: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 5, color: '#f5f0e8', padding: '0.4rem 0.5rem', fontSize: '0.76rem', marginBottom: '0.4rem' },
  addForm: { padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, margin: '0.5rem 0' },
  journeysGrid: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', alignContent: 'start' },
  journeyCard: { ...glass, borderRadius: 12, padding: '1rem', cursor: 'pointer' },
  journeyAccent: { width: 28, height: 4, borderRadius: 2, marginBottom: '0.6rem' },
  journeyLabel: { fontFamily: 'Fraunces, serif', fontSize: '1rem', marginBottom: '0.3rem' },
  journeySub: { fontSize: '0.72rem', color: '#a9a49a' },
  classicBack: { position: 'fixed', top: '0.6rem', left: '0.6rem', zIndex: 20, padding: '0.4rem 0.8rem', borderRadius: 6, border: '0.5px solid rgba(196,132,58,0.4)', background: 'rgba(13,20,23,0.85)', color: '#c4843a', fontSize: '0.74rem', cursor: 'pointer' },
};
