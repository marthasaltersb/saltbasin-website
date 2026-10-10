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
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { api } from '../lib/api.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights, buildRiverParticles, advanceRiverParticles } from '../lib/crystalGeometry.js';
import { resolveWorldIslands, withPlatformIslandTabs } from '../lib/worldIslands.js';
import { useCareerPlacementAgents, CAREER_DIMENSION_FIELDS, STAGE_LABELS } from '../lib/hooks/useCareerPlacementAgents.js';
import { useCommercialOpportunities, COMMERCIAL_DIMENSION_FIELDS, EXPANSION_RING_OPTIONS } from '../lib/hooks/useCommercialOpportunities.js';
import { usePublicationPipeline } from '../lib/hooks/usePublicationPipeline.js';
import AdminShell from './admin/AdminShell.jsx';
import ConfigPanel from './admin/ConfigPanel.jsx';
import { toast } from '../lib/toast.js';
import { attachSceneManifestTree, publishSceneManifest, removePublishedSceneManifest } from '../lib/sceneManifest.js';
import PlanetAtmosphereView from './PlanetAtmosphereView.jsx';
import OpportunityOutputsSection from './OpportunityOutputsSection.jsx';
import CareerConsentGate from './admin/CareerConsentGate.jsx';
import WorldBreadcrumbs from './WorldBreadcrumbs.jsx';
import { useWorldLayers, WorldLayersProvider, useWorldLayersContext } from '../lib/useWorldLayers.jsx';
import { lastIslandIndex, prefersReducedMotion } from '../lib/worldLayers.js';

// Simple, self-contained panels — no AdminShell-local shared state, so they
// can be lifted straight into a real WorldShell embed (module-by-module
// Classic Tools replacement, 2026-09-06) with nothing more than the
// SiteConfigView-style header wrapper. AdminShell keeps its own copies of
// these render branches for org scope (isOrg has no orbit-world tab yet).
const LeadsPanel = lazy(() => import('./admin/LeadsPanel.jsx'));
const CareerMasterPanel = lazy(() => import('./admin/CareerMasterPanel.jsx'));
const CareerMasterEntryPoint = lazy(() => import('./admin/CareerMasterEntryPoint.jsx'));
import { OutputVersionHistoryModal } from './admin/OutputVersionHistory.jsx';
const OutputTemplateConfiguratorHub = lazy(() => import('./admin/OutputTemplateConfigurator.jsx').then((m) => ({ default: m.OutputTemplateConfiguratorHub })));
const CareerReconciliationPanel = lazy(() => import('./admin/CareerReconciliationPanel.jsx'));
const MyResumePanel = lazy(() => import('./admin/MyResumePanel.jsx'));
const LonetreeMvpPanel = lazy(() => import('./admin/LonetreeMvpPanel.jsx'));
const ReleaseIntelligencePanel = lazy(() => import('./admin/ReleaseIntelligencePanel.jsx'));
const ConnectedAgentsPanel = lazy(() => import('./admin/ConnectedAgentsPanel.jsx'));
const QualificationRulesPanel = lazy(() => import('./admin/QualificationRulesPanel.jsx'));
const CapabilitiesPanel = lazy(() => import('./admin/CapabilitiesPanel.jsx'));
const ReleaseLoopPanel = lazy(() => import('./admin/ReleaseLoopPanel.jsx'));
const ReleaseTrackerApp = lazy(() => import('./releaseTracker/ReleaseTrackerApp.jsx'));
const SessionMappingPanel = lazy(() => import('./admin/SessionMappingPanel.jsx'));
const RenderBindingsPanel = lazy(() => import('./admin/RenderBindingsPanel.jsx'));

const SIMPLE_EMBED_COMPONENTS = {
  leads: { title: 'Leads', render: () => <LeadsPanel /> },
  careerMaster: { title: 'Career Master', render: (scope) => (scope === 'admin' ? <CareerMasterPanel scope="admin" /> : <CareerMasterEntryPoint scope={scope} />) },
  careerReconciliation: { title: 'Career Sources to Review', light: true, render: (scope) => <CareerReconciliationPanel scope={scope} /> },
  // WorldShell is already wrapped in CareerConsentGate (see the default export), so no extra gate here.
  resume: { title: 'My Resume', render: (scope) => <MyResumePanel scope={scope} /> },
  outputTemplates: { title: 'Output Templates', render: (scope) => <OutputTemplateConfiguratorHub scope={scope} /> },
  lonetreeMvp: { title: 'Fund & Portfolio Demo', render: (scope) => <LonetreeMvpPanel scope={scope} /> },
  releaseIntelligence: { title: 'Release Intelligence', render: () => <ReleaseIntelligencePanel /> },
  connectedAgents: { title: 'Connected Agents', render: () => <ConnectedAgentsPanel /> },
  capabilities: { title: 'Capabilities', render: () => <CapabilitiesPanel /> },
  qualificationRules: { title: 'Qualification Rules', render: () => <QualificationRulesPanel /> },
  releaseLoop: { title: 'Release loop', render: () => <ReleaseLoopPanel /> },
  releaseTracker: { title: 'Release tracker', render: () => <ReleaseTrackerApp embedded /> },
  sessionMapping: { title: 'Sessions', render: () => <SessionMappingPanel /> },
  renderBindings: { title: 'Render Bindings', render: () => <RenderBindingsPanel /> },
};

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

// Phone-width layout (390px): the top bar wraps instead of clipping, the
// per-island rail spans the screen instead of a fixed 300px strip, and the
// header stats (also shown on the Journeys cards) step aside.
const MOBILE_CSS = `
@media (max-width: 700px) {
  .sb-world-topbar { gap: 0.5rem !important; padding: 0.5rem 0.75rem !important; flex-wrap: wrap; }
  .sb-world-topbar .sb-world-brandsub { display: none; }
  .sb-world-topbar button { white-space: nowrap; }
  .sb-world-stats .sb-world-stat-avg, .sb-world-profile-text { display: none !important; }
  .sb-world-stats { margin-left: auto; gap: 0.6rem !important; order: 2; }
  .sb-world-topbar > div:first-child { order: 1; }
  .sb-world-topbar > div:nth-child(2) { order: 3; flex-basis: 100%; }
  .sb-world-stats .sb-world-stat { min-width: 0 !important; }
  .sb-world-rail { left: 0.5rem !important; right: 0.5rem !important; width: auto !important; top: auto !important; bottom: 0.5rem !important; height: 66vh !important; max-height: 66vh; border-radius: 14px 14px 12px 12px !important; box-shadow: 0 -8px 24px rgba(0,0,0,0.45); }
  .sb-world-crumbs { padding: 0.35rem 0.75rem !important; }
  .sb-world-rail button, .sb-world-rail select, .sb-world-rail input:not([type=file]), .sb-world-rail [role=button] { min-height: 44px; }
  .sb-world-topbar button { min-height: 44px; }
}
`;

function WorldShellInner() {
  const nav = useNavigate();
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const [user, setUser] = useState(undefined); // undefined = checking, null = redirecting
  const [tabsConfig, setTabsConfig] = useState(null);
  const [tabsError, setTabsError] = useState('');
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
        .catch((e) => { setTabsError(e.message); setTabsConfig([]); });
    } else {
      api.getMemberDraftConfig()
        .then((cfg) => setTabsConfig(cfg?.navigation?.memberTabs || []))
        .catch((e) => { setTabsError(e.message); setTabsConfig([]); });
    }
  }, [user]);

  const islands = useMemo(() => resolveWorldIslands(tabsConfig ? withPlatformIslandTabs(tabsConfig, user?.role) : []), [tabsConfig, user]);
  const hasCareerIsland = islands.some((i) => i.componentId === 'careerPlacementAgents');
  const hasCommercialIsland = islands.some((i) => i.componentId === 'commercialOpportunities');
  const hasHerqIsland = islands.some((i) => i.componentId === 'herqPublications');
  const career = useCareerPlacementAgents({ enabled: hasCareerIsland });
  const commercial = useCommercialOpportunities({ enabled: hasCommercialIsland });
  const herq = usePublicationPipeline({ enabled: hasHerqIsland });

  const scope = user?.role === 'admin' ? 'admin' : 'member';
  const pipelineOf = (island) => (island?.componentId === 'careerPlacementAgents' ? career : island?.componentId === 'commercialOpportunities' ? commercial : null);

  // ── The layer stack (docs/changes/world-shell-layers.md) ──────────────────
  // ONE stack replaces the old per-level state (focusedKey, atmosphereKey,
  // selectedOpportunityId, the editor/history flags, returnKeyRef). The URL
  // (`/world?at=...`) holds it. `validate` drops layers this user can't (or can
  // no longer) open and says why; the hook then fixes the URL and shows a note.
  const validate = (raw) => {
    if (!tabsConfig) return { stack: raw }; // islands not known yet: trust the link for now
    for (let i = 0; i < raw.length; i += 1) {
      const l = raw[i];
      const prev = raw[i - 1];
      if (l.kind === 'island' && !islands.some((x) => x.key === l.key)) {
        return { stack: raw.slice(0, i), problem: { layer: l, why: 'it is not one of your islands' } };
      }
      if (l.kind === 'moon') {
        const isl = islands.find((x) => x.key === prev?.key);
        // A moon that is only a hop (to another planet, or into Classic Tools) is never a layer itself.
        const ok = isl?.moons?.some((m) => m.key === l.key && (!m.scopes || m.scopes.includes(scope)) && !m.destinationKey && m.panel !== 'classicTools');
        if (!ok) return { stack: raw.slice(0, i), problem: { layer: l, why: 'that moon is not available to you' } };
      }
      if (l.kind === 'opp') {
        const pipe = pipelineOf(islands.find((x) => x.key === prev?.key));
        if (!pipe) return { stack: raw.slice(0, i), problem: { layer: l, why: 'this island does not track opportunities' } };
        if (pipe.loaded && !pipe.opportunities.some((o) => String(o.id) === l.key)) {
          return { stack: raw.slice(0, i), problem: { layer: l, why: 'that opportunity no longer exists or is not yours' } };
        }
      }
    }
    return { stack: raw };
  };
  const layers = useWorldLayers(validate);
  const { stack } = layers;
  const top = stack[stack.length - 1] || null;
  const islandIdx = lastIslandIndex(stack);
  const activeIsland = islandIdx >= 0 ? islands.find((i) => i.key === stack[islandIdx].key) || null : null;
  const afterIsland = islandIdx >= 0 ? stack.slice(islandIdx + 1) : [];
  const classicLayer = top?.kind === 'classic' ? top : null;
  const view = classicLayer ? 'classic' : top?.kind === 'journeys' ? 'journeys' : activeIsland?.kind === 'atmosphere' ? 'atmosphere' : 'world';
  const focused = view === 'world' ? activeIsland : null;
  const atmosphereIsland = view === 'atmosphere' ? activeIsland : null;
  const atmosphereMoon = atmosphereIsland && afterIsland[0]?.kind === 'moon' ? afterIsland[0].key : null;
  const classicTargetTab = classicLayer && classicLayer.key !== '_' ? classicLayer.key : null;

  const oppTitle = (o) => o?.metadata?.jobTitle || o?.metadata?.companyName;
  const labelOf = (l, i) => {
    const cached = layers.labels[`${l.kind}:${l.key}`];
    switch (l.kind) {
      case 'journeys': return 'Journeys';
      case 'island': return islands.find((x) => x.key === l.key)?.label || cached || l.key;
      case 'moon': return islands.find((x) => x.key === stack[i - 1]?.key)?.moons?.find((m) => m.key === l.key)?.label || cached || l.key;
      case 'classic': return cached || (l.key === '_' ? 'Classic Tools' : islands.find((x) => x.key === l.key)?.label || 'Classic Tools');
      case 'opp': return oppTitle(pipelineOf(islands.find((x) => x.key === stack[i - 1]?.key))?.opportunities.find((o) => String(o.id) === l.key)) || cached || `Opportunity ${l.key}`;
      case 'outputs': return 'Application outputs';
      case 'output': return cached || `Output ${l.key}`;
      case 'versions': return 'Version history';
      case 'editor': return 'Draft editor';
      default: return l.key;
    }
  };
  const crumbs = [{ label: 'Sun', index: -1 }, ...stack.map((l, i) => ({ label: labelOf(l, i), index: i }))];
  const floatingCrumbs = top?.kind === 'versions' || top?.kind === 'editor';

  // Every click into an object pushes exactly one layer.
  const selectIsland = useCallback((key) => {
    const island = islands.find((i) => i.key === key);
    if (!island) return;
    // 'classic' islands have no in-world view: the click goes straight to Classic Tools at that tab.
    if (island.kind === 'classic') { layers.push({ kind: 'classic', key: island.key, label: island.label }); return; }
    // 'atmosphere' islands: the travel cinematic already ran before this fires (beginAtmosphereTravel).
    layers.push({ kind: 'island', key: island.key, label: island.label });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islands, layers.push]);
  // A shared release-tracker link (/world#/rt/...) with no layer in the URL reopens the tracker island.
  const trackerOpened = useRef(false);
  useEffect(() => {
    if (trackerOpened.current || !islands.length || stack.length || !String(window.location.hash).startsWith('#/rt')) return;
    const island = islands.find((i) => i.componentId === 'releaseTracker');
    if (island) { trackerOpened.current = true; selectIsland(island.key); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islands]);
  const openClassic = useCallback((tabKey = null, label = 'Classic Tools') => {
    layers.push({ kind: 'classic', key: tabKey || '_', label });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.push]);
  const goTab = useCallback((name) => {
    if (name === 'world') layers.reset([]);
    else if (name === 'journeys') layers.reset([{ kind: 'journeys', key: '', label: 'Journeys' }]);
    else layers.reset([{ kind: 'classic', key: '_', label: 'Classic Tools' }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.reset]);
  const openCareerMaster = useCallback(() => {
    const island = islands.find((i) => i.componentId === 'careerMaster');
    if (island) selectIsland(island.key); else openClassic('careerMaster', 'Career Master');
  }, [islands, selectIsland, openClassic]);
  const popLayer = layers.pop;
  // The Sun (crystal or crumb) hands keyboard focus to the first Sun menu entry.
  const focusSunMenu = () => setTimeout(() => document.querySelector('[data-testid=sun-menu-item]')?.focus(), 80);
  const popToLayer = (i) => { layers.popTo(i); if (i === -1) focusSunMenu(); };
  const backLabel = (n = 1) => `← Back to ${crumbs[Math.max(0, crumbs.length - 1 - n)].label}`;

  // Tracking a new item opens it as the next layer (the old "detail view appears" behaviour).
  const handledCreated = useRef({});
  useEffect(() => {
    [['career', career], ['commercial', commercial]].forEach(([k, pipe]) => {
      const c = pipe.lastCreated;
      if (!c || handledCreated.current[k] === c.seq) return;
      handledCreated.current[k] = c.seq;
      if (pipelineOf(activeIsland) === pipe) layers.push({ kind: 'opp', key: c.id, label: c.label });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career.lastCreated, commercial.lastCreated]);

  // Escape pops one layer (not inside text fields, dialogs, Classic Tools or embedded
  // modules, which own Escape; the version-history modal closes itself = pops itself).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (!top || top.kind === 'versions' || view === 'classic') return;
      if (focused?.kind === 'embed') return;
      if (document.querySelector('[role="dialog"]:not([aria-label="Draft editor"]), [aria-modal="true"]')) return;
      popLayer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [top?.kind, view, focused?.kind, popLayer]);

  // Scroll position per layer: recorded as the user scrolls, restored when the layer returns.
  // While a restore is still catching up with late-loading content, scroll events are not
  // recorded (a clamped scroll position must never overwrite the remembered one).
  const saveUi = layers.saveUi;
  const restoringRef = useRef(false);
  useEffect(() => {
    const onScroll = (e) => {
      const t = e.target;
      if (restoringRef.current) return;
      if (t?.dataset && 'layerScroll' in t.dataset) saveUi({ scroll: t.scrollTop });
    };
    const stopRestoring = () => { restoringRef.current = false; };
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('wheel', stopRestoring, true);
    document.addEventListener('touchstart', stopRestoring, true);
    document.addEventListener('keydown', stopRestoring, true);
    return () => {
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('wheel', stopRestoring, true);
      document.removeEventListener('touchstart', stopRestoring, true);
      document.removeEventListener('keydown', stopRestoring, true);
    };
  }, [saveUi]);
  useLayoutEffect(() => {
    const want = layers.getUi().scroll || 0;
    const el0 = document.querySelector('[data-layer-scroll]');
    if (el0 && !want) el0.scrollTop = 0;
    if (!want) { restoringRef.current = false; return undefined; }
    restoringRef.current = true;
    const started = Date.now();
    const apply = () => {
      const el = document.querySelector('[data-layer-scroll]');
      if (el && Math.abs(el.scrollTop - want) > 2) el.scrollTop = want;
      // Content below may still be loading: keep trying until the position holds (or 8 s pass).
      if ((el && Math.abs(el.scrollTop - want) <= 2) || Date.now() - started > 8000) { restoringRef.current = false; clearInterval(timer); }
    };
    const timer = setInterval(apply, 150);
    apply();
    return () => { clearInterval(timer); restoringRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.trailKey, view]);

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
    attachSceneManifestTree(coreGroup, {
      instanceId: 'world-core:salt-basin', semanticId: 'semantic_composition', variantId: 'world-shell',
      source: { type: 'platform-world', id: 'salt-basin', configEnvelope: 'admin_nav/member navigation' },
      visualRules: { geometryId: 'molecule_lattice', materialId: 'crystal-variant-signature', colorRule: 'brand-crystal-core' },
      scene: { component: 'WorldShell', builder: 'CRYSTAL_VARIANTS.signature' },
      interaction: { events: ['SELECT'], stateTarget: 'worldLayers.stack' },
    });
    scene.add(coreGroup);

    const islandsGroup = new THREE.Group();
    scene.add(islandsGroup);
    const riversGroup = new THREE.Group();
    scene.add(riversGroup);

    let orbitAngle = 0.5, orbitElev = 0.32, orbitRadius = 22;
    let dollyTarget = null;
    const cameraTarget = new THREE.Vector3(0, 0.6, 0);
    let pickables = [];

    // "Enter the planet" cinematic (2026-09-06, 'atmosphere'-kind islands):
    // the camera travels directly toward the clicked planet — a straight
    // position lerp along the existing camera->planet line, not an orbit
    // parameter change, so it reads as travel rather than panning — while
    // the crystal core and every other island converge on a single point
    // off in the distance and shrink away, standing in for "collapsing into
    // the overlaying clickable navigation menu" WorldShell shows once the
    // cinematic hands off to the dedicated PlanetAtmosphereView.
    let travel = null;
    const COLLAPSE_ANCHOR = new THREE.Vector3(17, 12, -15);
    const COLLAPSE_SCALE = new THREE.Vector3(0.05, 0.05, 0.05);
    function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function beginAtmosphereTravel(key, worldPos) {
      if (travel) return;
      const approachDir = camera.position.clone().sub(worldPos);
      if (approachDir.lengthSq() < 0.0001) approachDir.set(0, 0.4, 1);
      approachDir.normalize();
      const others = [{ obj: coreGroup, startPos: coreGroup.position.clone(), startScale: coreGroup.scale.clone() }];
      islandsGroup.children.forEach((isl) => {
        if (isl.userData.islandKey !== key) others.push({ obj: isl, startPos: isl.position.clone(), startScale: isl.scale.clone() });
      });
      travel = {
        key,
        startCamPos: camera.position.clone(),
        approachPos: worldPos.clone().add(approachDir.multiplyScalar(4.2)),
        startTarget: cameraTarget.clone(),
        endTarget: worldPos.clone(),
        others,
        duration: prefersReducedMotion() ? 1 : 1650,
        elapsed: 0,
      };
    }

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
      if (travel) return;
      renderer.domElement.setPointerCapture?.(e.pointerId);
      dragStart = { x: e.clientX, y: e.clientY, t: performance.now() };
      didDrag = false;
    }
    function onMove(e) {
      if (travel || !dragStart || e.buttons === 0) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag = true;
      if (didDrag) {
        orbitAngle -= dx * 0.005;
        orbitElev = Math.max(0.08, Math.min(1.1, orbitElev + dy * 0.0035));
        dragStart = { x: e.clientX, y: e.clientY, t: dragStart.t };
      }
    }
    function onUp(e) {
      if (travel) { dragStart = null; didDrag = false; return; }
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
              } else if (found.registryKind === 'atmosphere') {
                beginAtmosphereTravel(found.key, worldPos);
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
      if (travel) return;
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
      const dt = clock.getDelta();
      if (travel) {
        travel.elapsed += dt * 1000;
        const tt = Math.min(1, travel.elapsed / travel.duration);
        const e = easeInOutCubic(tt);
        camera.position.lerpVectors(travel.startCamPos, travel.approachPos, e);
        cameraTarget.lerpVectors(travel.startTarget, travel.endTarget, e);
        camera.lookAt(cameraTarget);
        travel.others.forEach(({ obj, startPos, startScale }) => {
          obj.position.lerpVectors(startPos, COLLAPSE_ANCHOR, e);
          obj.scale.lerpVectors(startScale, COLLAPSE_SCALE, e);
        });
        if (tt > 0.35) riversGroup.visible = false;
        renderer.render(scene, camera);
        if (tt >= 1) {
          const doneKey = travel.key;
          travel = null;
          engineRef.current?.onSelect(doneKey);
        }
        return;
      }
      const t = clock.getElapsedTime();
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
      // `cut` = reduced motion: jump instead of flying.
      dollyTo: (point, radius, cut = false) => {
        if (cut) { cameraTarget.copy(point); orbitRadius = radius; dollyTarget = null; } else dollyTarget = { point, radius };
      },
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
      removePublishedSceneManifest('world-shell');
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
    // The sun (key null) is the root menu: clicking it returns to layer 0.
    if (engineRef.current) engineRef.current.onSelect = (key) => {
      if (key != null) { selectIsland(key); return; }
      // The sun: layer 0. Back to the root menu, and hand keyboard focus to its first entry.
      layers.reset([]);
      focusSunMenu();
    };
  }, [selectIsland, layers.reset, view, ready]);

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
      holder.userData.islandKey = isl.key;

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

      attachSceneManifestTree(holder, {
        instanceId: `world-island:${isl.key}`, semanticId: 'semantic_composition', variantId: isl.variant,
        source: { type: 'navigation-item', id: isl.key, field: 'componentId', configEnvelope: user?.role === 'admin' ? 'admin_nav' : 'member navigation' },
        visualRules: { geometryId: 'molecule_lattice', materialId: `crystal-variant-${isl.variant}`, colorRule: `island-accent-${isl.accent}` },
        scene: { component: 'WorldShell', builder: `CRYSTAL_VARIANTS.${isl.variant}`, parent: 'world-core:salt-basin' },
        interaction: { events: ['SELECT', 'FOCUS'], stateTarget: 'worldLayers.stack' },
      });

      islandsGroup.add(holder);
      pickables.push({ obj: crystalGroup, kind: 'island', key: isl.key, registryKind: isl.kind });

      const river = buildRiverParticles(THREE, {
        from: new THREE.Vector3(0, 0.4, 0),
        to: new THREE.Vector3(x, 0.2, z),
        color: ACCENT_HEX[isl.accent] || ACCENT_HEX.gold,
        count: 46,
      });
      riversGroup.add(river);
      attachSceneManifestTree(river, {
        instanceId: `world-river:${isl.key}`, semanticId: 'journey_tributary', variantId: 'world-shell',
        source: { type: 'navigation-relationship', id: isl.key, configEnvelope: user?.role === 'admin' ? 'admin_nav' : 'member navigation' },
        visualRules: { geometryId: 'tributary_channel', materialId: 'river-particles', colorRule: `island-accent-${isl.accent}` },
        scene: { component: 'WorldShell', builder: 'buildRiverParticles', parent: 'world-core:salt-basin' },
        interaction: { events: [], stateTarget: null },
      });
    });

    engine.setPickables(pickables);
    publishSceneManifest('world-shell', engine.scene);
    // `view` is a dep so returning to the World tab (which unmounts/remounts
    // the renderer via the effect above) re-populates the fresh engine's
    // now-empty islands/rivers groups, not just genuine data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [islands, hasCareerIsland, hasCommercialIsland, hasHerqIsland, career.opportunities.length, commercial.opportunities.length, herq.items.length, view]);

  // The camera follows the stack: the deeper the layer, the closer it moves toward the
  // selected island (reduced motion: it cuts instead of flying).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const cut = prefersReducedMotion();
    if (!focused) { engine.dollyTo(new THREE.Vector3(0, 0.6, 0), 22, cut); return; }
    const idx = islands.findIndex((i) => i.key === focused.key);
    if (idx < 0) return;
    const angle = (idx / islands.length) * Math.PI * 2 + 0.3;
    const point = new THREE.Vector3(Math.cos(angle) * ISLAND_RADIUS, 0.4, Math.sin(angle) * ISLAND_RADIUS);
    const depth = Math.max(0, stack.length - 1 - islandIdx);
    engine.dollyTo(point, Math.max(2.6, 5.2 - depth * 0.7), cut);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, islands, view, layers.trailKey]);

  if (user === undefined || !tabsConfig) {
    return <div style={S.loading}>Entering your world…</div>;
  }

  const ctx = {
    stack, push: layers.push, pop: layers.pop, popTo: layers.popTo, reset: layers.reset, invalidate: layers.invalidate,
    rememberLabel: layers.rememberLabel, saveUi: layers.saveUi, getUi: layers.getUi, trailKey: layers.trailKey,
  };
  const crumbBar = (hidden = false) => (
    <WorldBreadcrumbs crumbs={crumbs} onPopTo={popToLayer} notice={layers.note} onDismissNotice={layers.clearNote} hidden={hidden} />
  );
  // While a modal-like layer (version history, the draft editor) covers the screen, the trail
  // stays visible above it.
  const floating = floatingCrumbs
    ? createPortal(<WorldBreadcrumbs crumbs={crumbs} onPopTo={popToLayer} notice={layers.note} onDismissNotice={layers.clearNote} floating />, document.body)
    : null;
  const framed = (el) => (
    <WorldLayersProvider value={ctx}>
      <div style={S.frame}>
        {crumbBar(floatingCrumbs)}
        <div style={S.frameBody}>{el}</div>
      </div>
      {floating}
    </WorldLayersProvider>
  );

  // A moon is a layer, except the two kinds that are really a hop elsewhere: one that points at
  // another planet pushes that island; one that lives in Classic Tools pushes Classic Tools.
  const onMoonChange = (key) => {
    if (!key) { if (top?.kind === 'moon') popLayer(); return; }
    const moon = atmosphereIsland?.moons?.find((m) => m.key === key);
    if (!moon) return;
    if (moon.destinationKey) {
      const target = islands.find((i) => i.key === moon.destinationKey || i.componentId === moon.destinationKey);
      if (target) { selectIsland(target.key); return; }
    }
    if (moon.panel === 'classicTools') { openClassic(moon.classicTab || null, `${moon.label} (Classic Tools)`); return; }
    layers.push({ kind: 'moon', key: moon.key, label: moon.label });
  };

  if (view === 'classic') {
    return framed(
      <>
        <button style={S.classicBack} onClick={popLayer}>← Back to World</button>
        <AdminShell scope={scope} initialTab={classicTargetTab} />
      </>,
    );
  }

  if (view === 'atmosphere' && atmosphereIsland) {
    return framed(
      <PlanetAtmosphereView
        island={atmosphereIsland}
        scope={scope}
        onClear={popLayer}
        onNavigateToIsland={(k) => selectIsland(islands.find((i) => i.key === k || i.componentId === k)?.key || k)}
        onOpenClassicTools={(tab) => openClassic(tab)}
        moonKey={atmosphereMoon}
        onMoonChange={onMoonChange}
      />,
    );
  }

  if (focused?.kind === 'embed') {
    if (SIMPLE_EMBED_COMPONENTS[focused.componentId]) {
      return framed(<SimpleEmbedView componentId={focused.componentId} scope={scope} onClear={popLayer} />);
    }
    if (focused.componentId === 'config') {
      return framed(<SiteConfigView scope={scope} onClear={popLayer} />);
    }
  }

  return (
    <WorldLayersProvider value={ctx}>
      <div style={S.shell}>
        <style>{MOBILE_CSS}</style>
        <TopBar
          user={user}
          view={view}
          onTab={goTab}
          career={career}
          commercial={commercial}
          hasCareerIsland={hasCareerIsland}
          hasCommercialIsland={hasCommercialIsland}
        />
        {crumbBar(floatingCrumbs)}
        {view === 'journeys' ? (
          <JourneysGrid islands={islands} career={career} commercial={commercial} herq={herq} onOpen={selectIsland} />
        ) : (
          <div style={S.stage}>
            {hasWebGL() ? (
              <>
                <div ref={hostRef} style={S.canvasHost} />
                {!focused && <div style={S.hint}>Click the sun for the menu · drag to orbit · scroll to zoom · click an island to enter{prefersReducedMotion() ? ' · Reduced motion is on: the camera cuts to each layer instead of flying.' : ''}</div>}
              </>
            ) : (
              <div style={S.webglFallback}>
                This device/browser doesn't support WebGL — use the Sun menu on the right, or the Journeys tab above, for a list view.
              </div>
            )}
          </div>
        )}
        {view === 'world' && (
          <RightRail
            focused={focused}
            islands={islands}
            onSelectIsland={selectIsland}
            onOpenJourneys={() => layers.push({ kind: 'journeys', key: '', label: 'Journeys' })}
            islandIdx={islandIdx}
            afterIsland={afterIsland}
            backLabel={backLabel}
            onClear={popLayer}
            onOpenClassic={() => openClassic(focused?.key)}
            career={career}
            commercial={commercial}
            herq={herq}
            hasCareerIsland={hasCareerIsland}
            hasCommercialIsland={hasCommercialIsland}
            onOpenCareerMaster={openCareerMaster}
            loadError={tabsError}
          />
        )}
      </div>
      {floating}
    </WorldLayersProvider>
  );
}

// The two required first steps every other member surface already enforces
// (MemberDashboard.jsx) - without them every member API answers 428 and the
// world renders as an empty page: (1) replace the provisioning password,
// (2) agree to the current Career Portfolio terms. Both return the member here.
export default function WorldShell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api.me()
      .then(({ user: u }) => {
        if (!u) nav('/login', { replace: true });
        else if (u.mustChangePassword) nav('/first-login-password?next=/world', { replace: true });
        else setReady(true);
      })
      .catch(() => nav('/login', { replace: true }));
  }, [nav]);
  if (!ready) return <div style={S.loading}>Entering your world…</div>;
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#05090b' }}>
      <CareerConsentGate><WorldShellInner /></CareerConsentGate>
    </div>
  );
}

function TopBar({ user, view, onTab, career, commercial, hasCareerIsland, hasCommercialIsland }) {
  const trackedCount = hasCareerIsland ? career.opportunities.length : hasCommercialIsland ? commercial.opportunities.length : 0;
  const scored = (hasCareerIsland ? career.opportunities : hasCommercialIsland ? commercial.opportunities : []).filter((o) => o.score);
  const avgScore = scored.length ? Math.round(scored.reduce((s, o) => s + o.score.score, 0) / scored.length) : null;
  const agentCount = hasCareerIsland ? career.agents.length : hasCommercialIsland ? commercial.agents.length : 0;
  return (
    <div className="sb-world-topbar" style={S.topbar}>
      <div style={S.brand}>
        <span style={S.brandMark}>◈</span>
        <div>
          <div style={S.brandTitle}>SALT BASIN</div>
          <div className="sb-world-brandsub" style={S.brandSub}>Your World</div>
        </div>
      </div>
      <div style={S.navTabs}>
        <button style={S.navTab(view === 'world')} onClick={() => onTab('world')}>World</button>
        <button style={S.navTab(view === 'journeys')} onClick={() => onTab('journeys')}>Journeys</button>
        <button style={S.navTab(view === 'classic')} onClick={() => onTab('classic')}>Classic Tools</button>
      </div>
      <div className="sb-world-stats" style={S.stats}>
        <div className="sb-world-stat" style={S.stat}><span style={S.statVal}>{trackedCount}</span><span style={S.statLabel}>Tracked</span></div>
        <div className="sb-world-stat" style={S.stat}><span style={S.statVal}>{agentCount}</span><span style={S.statLabel}>Agents</span></div>
        <div className="sb-world-stat sb-world-stat-avg" style={S.stat}><span style={S.statVal}>{avgScore ?? '—'}</span><span style={S.statLabel}>Avg Score</span></div>
        <div style={S.profileChip}>
          <div style={S.profileAvatar}>{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
          <div className="sb-world-profile-text">
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
    <div style={S.journeysGrid} data-layer-scroll="1" data-testid="journeys-grid">
      {islands.map((isl) => {
        const opp = isl.componentId === 'careerPlacementAgents' ? career : isl.componentId === 'commercialOpportunities' ? commercial : null;
        const sub = opp
          ? `${opp.opportunities.length} tracked · ${opp.agents.length} agents`
          : isl.componentId === 'herqPublications'
            ? `${herq.items.length} items · ${herq.agents.length} agents`
            : isl.componentId === 'careerMaster'
              ? 'Open Career Master journey'
              : isl.componentId === 'connectedAgents'
                ? 'Tokens for AI agents (MCP)'
                : isl.componentId === 'capabilities'
                  ? 'Website, API and MCP parity'
                  : isl.componentId === 'qualificationRules'
                    ? 'Edit the career qualification gates'
              : isl.kind === 'embed'
                ? 'Open configuration'
                : 'Open in Classic Tools';
        return (
          <div key={isl.key} style={S.journeyCard} role="button" tabIndex={0} data-testid="journey-card" onClick={() => onOpen(isl.key)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(isl.key); } }}>
            <div style={{ ...S.journeyAccent, background: '#' + (ACCENT_HEX[isl.accent] || ACCENT_HEX.gold).toString(16).padStart(6, '0') }} />
            <div style={S.journeyLabel}>{isl.label}</div>
            <div style={S.journeySub}>{sub}</div>
          </div>
        );
      })}
    </div>
  );
}

// Layer 0: the Sun menu. The islands orbiting the sun are the menu; this list mirrors
// them for keyboard and screen-reader users (each island is labelled and focusable).
const KIND_HINT = { docked: 'opens a panel', embed: 'opens full screen', atmosphere: 'enter the planet', classic: 'opens in Classic Tools' };
function SunMenu({ islands, onSelectIsland, onOpenJourneys }) {
  return (
    <nav aria-label="Sun menu" data-testid="sun-menu">
      <div style={S.railTitle}>Sun menu</div>
      <p style={S.railText}>The sun is the root of your world. Pick a destination - every click after this goes one layer deeper, and the trail above always leads back.</p>
      {prefersReducedMotion() && <p style={S.railText} data-testid="reduced-motion-note">Reduced motion is on: the camera cuts to each layer instead of flying.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {islands.map((isl) => (
          <li key={isl.key}>
            <button type="button" style={S.menuItem} data-testid="sun-menu-item" onClick={() => onSelectIsland(isl.key)}>
              <span style={{ ...S.menuDot, background: '#' + (ACCENT_HEX[isl.accent] || ACCENT_HEX.gold).toString(16).padStart(6, '0') }} aria-hidden="true" />
              <span style={{ flex: 1 }}>{isl.label}</span>
              <span style={S.menuHint}>{KIND_HINT[isl.kind] || ''}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" style={S.menuItem} data-testid="sun-menu-item" onClick={onOpenJourneys}>
            <span style={{ ...S.menuDot, background: '#8fadb6' }} aria-hidden="true" />
            <span style={{ flex: 1 }}>Journeys</span>
            <span style={S.menuHint}>card list</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function RightRail({ focused, islands, onSelectIsland, onOpenJourneys, islandIdx, afterIsland, backLabel, onClear, onOpenClassic, career, commercial, herq, hasCareerIsland, hasCommercialIsland, onOpenCareerMaster, loadError }) {
  if (focused) {
    if (focused.componentId === 'herqPublications') {
      return <PublicationDockedPanel label={focused.label} herq={herq} onClear={onClear} />;
    }
    if (focused.kind === 'docked') {
      const pipeline = focused.componentId === 'careerPlacementAgents' ? career : commercial;
      const dimensionFields = focused.componentId === 'careerPlacementAgents' ? CAREER_DIMENSION_FIELDS : COMMERCIAL_DIMENSION_FIELDS;
      return <DockedPipelinePanel label={focused.label} pipeline={pipeline} dimensionFields={dimensionFields} onClear={onClear} isCommercial={focused.componentId === 'commercialOpportunities'} onOpenCareerMaster={onOpenCareerMaster} islandIdx={islandIdx} afterIsland={afterIsland} backLabel={backLabel} />;
    }
    return (
      <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
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
      <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
        {loadError && <div role="alert" style={{ color: '#f0c4d0', border: '0.5px solid rgba(217,140,160,0.7)', borderRadius: 6, padding: '0.5rem', fontSize: '0.74rem', marginBottom: '0.6rem' }}>Your islands could not be loaded: {loadError}</div>}
        <SunMenu islands={islands} onSelectIsland={onSelectIsland} onOpenJourneys={onOpenJourneys} />
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
    <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
      <SunMenu islands={islands} onSelectIsland={onSelectIsland} onOpenJourneys={onOpenJourneys} />
      <div style={{ ...S.railTitle, marginTop: '1.1rem' }}>{label}</div>
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

function DockedPipelinePanel({ label, pipeline, dimensionFields, onClear, isCommercial, onOpenCareerMaster, islandIdx, afterIsland, backLabel }) {
  const layers = useWorldLayersContext();
  const {
    loading, opportunities, selectOpportunity: syncPipelineSelection,
    showAddForm, setShowAddForm, addForm, setAddForm, handleAddOpportunity,
    scoreDraft, setScoreDraft, handleSaveScore, saving,
    runningResearch, runResearch,
    generatingResume, resumeReview, generateResume, discardResumeReview, approvingResume, approveResume,
    importingPipeline, importPipeline,
    generatingQueue, generateQueue,
    approvingOpportunity, approveOpportunity, advanceStage,
    generatingCoverLetter, coverLetterReview, generateCoverLetter, discardCoverLetterReview, approvingCoverLetter, approveCoverLetter,
    verifyingPipeline, verifyPipelineNow, runningAutoQueue, runAutoQueueNow,
    automation, loadingAutomation, loadAutomation, setSchedule,
    importingOutput, importOutputForOpportunity,
    outreach, loadingOutreach, loadOutreach, startingOutreach, startOutreach,
    researchingContacts, researchContacts,
    draftingOutreachMessage, outreachDraft, draftMessage, discardOutreachDraft,
    savingOutreachMessage, saveOutreachMessage,
    mergingOutcome, mergeOutcome, reload,
  } = pipeline;
  const importInputRef = useRef(null);
  const importOutputInputRef = useRef(null);
  const [showAutomation, setShowAutomation] = useState(false);

  // The selected opportunity is a layer, not local state (docs/changes/world-shell-layers.md):
  // island > opp > outputs > output > (editor | versions). Everything below is read from the stack.
  const oppLayer = afterIsland[0]?.kind === 'opp' ? afterIsland[0] : null;
  const selectedOpportunity = oppLayer ? opportunities.find((o) => String(o.id) === oppLayer.key) || null : null;
  const tail = oppLayer ? afterIsland.slice(1) : afterIsland;
  const oppIndex = islandIdx + 1;
  const lastLayer = afterIsland[afterIsland.length - 1] || null;
  const versionsOverEditor = lastLayer?.kind === 'versions' && tail[tail.length - 2]?.kind === 'editor';
  // The pipeline hook still owns score drafts keyed on its own selection, so mirror the layer into it.
  useEffect(() => { syncPipelineSelection(selectedOpportunity ? selectedOpportunity.id : null); }, [selectedOpportunity?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const openOpportunity = (o) => layers.push({ kind: 'opp', key: o.id, label: o.metadata?.jobTitle || o.metadata?.companyName });
  const trackedFilterKey = `${layers.trailKey}`;
  const [trackedFilter, setTrackedFilter] = useState(() => layers.getUi(trackedFilterKey).filter || '');
  useEffect(() => { setTrackedFilter(layers.getUi(trackedFilterKey).filter || ''); }, [trackedFilterKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const changeTrackedFilter = (v) => { setTrackedFilter(v); layers.saveUi({ filter: v }); };
  const shownOpportunities = trackedFilter.trim()
    ? opportunities.filter((o) => `${o.metadata?.jobTitle || ''} ${o.metadata?.companyName || ''}`.toLowerCase().includes(trackedFilter.trim().toLowerCase()))
    : opportunities;

  const outreachEligible = !isCommercial && selectedOpportunity && ['applied', 'interviewing'].includes(selectedOpportunity.currentStage);
  useEffect(() => {
    if (outreachEligible) loadOutreach(selectedOpportunity.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOpportunity?.id, outreachEligible]);

  const oppName = selectedOpportunity ? (selectedOpportunity.metadata?.jobTitle || selectedOpportunity.metadata?.companyName) : '';
  // A versions layer key is "<outputId>" (open at the latest version) or "<outputId>.<versionId>" (open at that version).
  const [versionsOutputId, versionsVersionId] = lastLayer?.kind === 'versions' ? String(lastLayer.key).split('.') : [];
  const versionsModal = lastLayer?.kind === 'versions'
    ? <OutputVersionHistoryModal projectionId={versionsVersionId || versionsOutputId} startAtLatest={!versionsOverEditor && !versionsVersionId} onClose={layers.pop} />
    : null;
  const outputsIdx = tail.findIndex((l) => l.kind === 'outputs');
  const outputIdx = tail.findIndex((l) => l.kind === 'output');
  const editorIdx = tail.findIndex((l) => l.kind === 'editor');
  const editorOverlay = editorIdx >= 0 ? { outputId: tail[editorIdx].key, index: oppIndex + 1 + editorIdx } : null;

  // Layer: Application Outputs (list) and one output (detail), with the editor over it.
  if (selectedOpportunity && !isCommercial && (outputsIdx >= 0 || outputIdx >= 0)) {
    const detail = outputIdx >= 0;
    return (
      <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
        <button style={S.backBtn} onClick={onClear}>{backLabel()}</button>
        <div style={S.railTitle}>{detail ? 'Output' : 'Application Outputs'}</div>
        <div style={S.railSubtitle}>{oppName}</div>
        <OpportunityOutputsSection
          key={detail ? 'detail' : 'list'}
          opportunity={selectedOpportunity}
          mode={detail ? 'detail' : 'list'}
          outputId={detail ? tail[outputIdx].key : null}
          overlay={editorOverlay ? 'editor' : null}
          oppIndex={oppIndex}
          outputIndex={detail ? oppIndex + 1 + outputIdx : null}
          editorIndex={editorOverlay?.index ?? null}
          onOpenCareerMaster={onOpenCareerMaster}
          onOpportunityChanged={reload}
          refreshSignal={[importingOutput, approvingResume, approvingCoverLetter].join('|')}
        />
        {versionsModal}
      </div>
    );
  }

  return (
    <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
      <button style={S.backBtn} onClick={onClear}>{selectedOpportunity ? backLabel() : '← Back to World'}</button>
      <div style={S.railTitle}>{label}</div>
      {versionsModal}

      {loading || (oppLayer && !selectedOpportunity) ? (
        <div style={S.railEmpty}>Loading…</div>
      ) : selectedOpportunity ? (
        <>
          <div style={S.railSubtitle}>{selectedOpportunity.metadata?.jobTitle || selectedOpportunity.metadata?.companyName}</div>
          <div style={S.railRow}><span>Stage</span><span>{STAGE_LABELS[selectedOpportunity.currentStage] || selectedOpportunity.currentStage}</span></div>
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

          {!isCommercial && (
            <>
              {selectedOpportunity.currentStage === 'discovered' && (selectedOpportunity.allowedNextStages || []).includes('approved') && (
                <button style={S.gold} onClick={() => approveOpportunity(selectedOpportunity.id)} disabled={approvingOpportunity}>
                  {approvingOpportunity ? 'Approving…' : 'Approve (eligible for auto-generated outputs)'}
                </button>
              )}
              {selectedOpportunity.currentStage === 'archived' && (
                <div style={{ fontSize: '0.72rem', color: '#c4843a', margin: '0.4rem 0' }}>
                  Archived{selectedOpportunity.metadata?.archiveReason ? `: ${selectedOpportunity.metadata.archiveReason}` : ''}
                </div>
              )}
              {/* Every other stage move — "apply and track to job applications." */}
              {(selectedOpportunity.allowedNextStages || []).filter((s) => s !== 'approved').length > 0 && (
                <div style={{ margin: '0.5rem 0' }}>
                  <div style={{ fontSize: '0.68rem', color: '#8b877c', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Mark as</div>
                  {selectedOpportunity.allowedNextStages.filter((s) => s !== 'approved').map((stage) => (
                    <button
                      key={stage} style={{ ...S.ghost, marginRight: '0.3rem', marginBottom: '0.3rem' }}
                      onClick={() => advanceStage(selectedOpportunity.id, stage)} disabled={approvingOpportunity}
                    >
                      {STAGE_LABELS[stage] || stage}
                    </button>
                  ))}
                </div>
              )}

              <OpportunityOutputsSection
                opportunity={selectedOpportunity}
                mode="summary"
                outputId={editorOverlay?.outputId ?? null}
                overlay={editorOverlay ? 'editor' : null}
                editorIndex={editorOverlay?.index ?? null}
                oppIndex={oppIndex}
                onOpenCareerMaster={onOpenCareerMaster}
                onOpportunityChanged={reload}
                refreshSignal={[importingOutput, approvingResume, approvingCoverLetter].join('|')}
              />

              <div style={S.railSubtitle}>Resume for This Opportunity</div>
              {resumeReview ? (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem', fontSize: '0.74rem', color: '#cfc9bd', marginBottom: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: '#f5f0e8' }}>{resumeReview.content?.professionalSummary}</p>
                  {(resumeReview.content?.selectedExperience || []).map((exp, i) => (
                    <ul key={i} style={{ paddingLeft: '1rem', margin: '0 0 0.4rem' }}>
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  ))}
                  <p style={{ fontSize: '0.68rem', color: '#8b877c', margin: '0.4rem 0' }}>Review before approving — nothing is saved until you approve it.</p>
                  <button style={S.gold} onClick={() => approveResume(selectedOpportunity.id)} disabled={approvingResume}>{approvingResume ? 'Saving…' : 'Approve & Save'}</button>
                  <button style={S.ghost} onClick={discardResumeReview}>Discard</button>
                </div>
              ) : (
                <button style={S.ghost} onClick={() => generateResume(selectedOpportunity.id)} disabled={generatingResume}>
                  {generatingResume ? 'Generating…' : 'Generate Resume for This Opportunity'}
                </button>
              )}

              <div style={S.railSubtitle}>Cover Letter for This Opportunity</div>
              {coverLetterReview ? (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem', fontSize: '0.74rem', color: '#cfc9bd', marginBottom: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: '#f5f0e8' }}>{coverLetterReview.content?.openingHook}</p>
                  {(coverLetterReview.content?.bodyParagraphs || []).map((p, i) => (
                    <p key={i} style={{ margin: '0 0 0.4rem' }}>{p.text}</p>
                  ))}
                  <p style={{ margin: '0 0 0.5rem' }}>{coverLetterReview.content?.closing}</p>
                  <p style={{ fontSize: '0.68rem', color: '#8b877c', margin: '0.4rem 0' }}>Review before approving — nothing is saved until you approve it.</p>
                  <button style={S.gold} onClick={() => approveCoverLetter(selectedOpportunity.id)} disabled={approvingCoverLetter}>{approvingCoverLetter ? 'Saving…' : 'Approve & Save'}</button>
                  <button style={S.ghost} onClick={discardCoverLetterReview}>Discard</button>
                </div>
              ) : (
                <button style={S.ghost} onClick={() => generateCoverLetter(selectedOpportunity.id)} disabled={generatingCoverLetter}>
                  {generatingCoverLetter ? 'Generating…' : 'Generate Cover Letter for This Opportunity'}
                </button>
              )}

              <div style={S.railSubtitle}>Or Import an Existing Document</div>
              <input
                ref={importOutputInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importOutputForOpportunity(selectedOpportunity.id, f, importOutputInputRef.current?.dataset.outputType || 'resume');
                  e.target.value = '';
                }}
              />
              <button
                style={S.ghost} disabled={importingOutput}
                onClick={() => { importOutputInputRef.current.dataset.outputType = 'resume'; importOutputInputRef.current?.click(); }}
              >
                {importingOutput ? 'Importing…' : 'Import Resume (PDF/DOCX/TXT)'}
              </button>{' '}
              <button
                style={S.ghost} disabled={importingOutput}
                onClick={() => { importOutputInputRef.current.dataset.outputType = 'cover_letter'; importOutputInputRef.current?.click(); }}
              >
                {importingOutput ? 'Importing…' : 'Import Cover Letter'}
              </button>

              <OpportunityOutputVersions
                onOpen={(id) => layers.push({ kind: 'versions', key: id, label: 'Version history' })}
                opportunityId={selectedOpportunity.id}
                refreshKey={`${generatingResume}|${approvingResume}|${approvingCoverLetter}|${importingOutput}`}
              />

              {outreachEligible && (
                <OutreachSection
                  opportunityId={selectedOpportunity.id}
                  outreach={outreach}
                  loading={loadingOutreach}
                  startingOutreach={startingOutreach}
                  startOutreach={startOutreach}
                  researchingContacts={researchingContacts}
                  researchContacts={researchContacts}
                  draftingOutreachMessage={draftingOutreachMessage}
                  outreachDraft={outreachDraft}
                  draftMessage={draftMessage}
                  discardOutreachDraft={discardOutreachDraft}
                  savingOutreachMessage={savingOutreachMessage}
                  saveOutreachMessage={saveOutreachMessage}
                  mergingOutcome={mergingOutcome}
                  mergeOutcome={mergeOutcome}
                />
              )}
            </>
          )}
          <button style={S.ghost} onClick={onClear}>← Tracked list</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={S.railSubtitle}>Tracked ({opportunities.length})</div>
            <button style={S.ghostSmall} onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? 'Cancel' : '+ Add'}</button>
          </div>
          {!isCommercial && (
            <>
              <button style={S.ghost} onClick={runResearch} disabled={runningResearch}>
                {runningResearch ? 'Researching…' : 'Run Job Research'}
              </button>
              <input
                ref={importInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importPipeline(f); e.target.value = ''; }}
              />
              <button style={S.ghost} onClick={() => importInputRef.current?.click()} disabled={importingPipeline}>
                {importingPipeline ? 'Importing…' : 'Import Pipeline Spreadsheet'}
              </button>
              <button style={S.ghost} onClick={() => generateQueue(10)} disabled={generatingQueue}>
                {generatingQueue ? 'Generating queue…' : 'Generate Resume Queue (top 10)'}
              </button>
              <button
                style={S.ghost}
                onClick={() => { setShowAutomation((v) => !v); if (!showAutomation && !automation) loadAutomation(); }}
              >
                {showAutomation ? 'Hide Automation' : 'Automation & Scheduling'}
              </button>
              {showAutomation && (
                <AutomationPanel
                  automation={automation}
                  loading={loadingAutomation}
                  setSchedule={setSchedule}
                  verifyingPipeline={verifyingPipeline}
                  verifyPipelineNow={verifyPipelineNow}
                  runningAutoQueue={runningAutoQueue}
                  runAutoQueueNow={runAutoQueueNow}
                />
              )}
            </>
          )}
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
                  <div style={{ fontSize: '0.68rem', color: '#8b877c', margin: '0.3rem 0' }}>Only a job title and company are needed - add details later.</div>
                </>
              )}
              <button type="submit" style={S.gold} disabled={saving}>{saving ? 'Saving…' : 'Track'}</button>
            </form>
          )}
          {opportunities.length > 1 && (
            <input
              aria-label="Filter tracked opportunities" placeholder="Filter tracked..." style={S.dimInputWide}
              value={trackedFilter} onChange={(e) => changeTrackedFilter(e.target.value)}
            />
          )}
          {!opportunities.length && !showAddForm && <div style={S.railEmpty}>Nothing tracked yet.</div>}
          {opportunities.length > 0 && shownOpportunities.length === 0 && <div style={S.railEmpty}>No tracked item matches this filter.</div>}
          {shownOpportunities.map((o) => (
            <div key={o.id} style={S.railRow} onClick={() => openOpportunity(o)} className="sb-world-row" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOpportunity(o); } }}>
              <span>
                {o.metadata?.jobTitle || o.metadata?.companyName}
                {o.metadata?.placeholder && <span style={{ color: '#8fadb6', fontSize: '0.62rem', marginLeft: '0.4rem', textTransform: 'uppercase' }}>Placeholder</span>}
                {o.metadata?.proposedByAgent && <span style={{ color: '#c4843a', fontSize: '0.62rem', marginLeft: '0.4rem', textTransform: 'uppercase' }}>Agent-proposed</span>}
                {o.metadata?.priority && <span style={{ color: '#8fadb6', fontSize: '0.62rem', marginLeft: '0.4rem', textTransform: 'uppercase' }}>{o.metadata.priority}</span>}
                {o.metadata?.applicationStage && o.metadata.applicationStage !== 'Not Started' && (
                  <span style={{ color: '#8fbf98', fontSize: '0.62rem', marginLeft: '0.4rem', textTransform: 'uppercase' }}>{o.metadata.applicationStage}</span>
                )}
              </span>
              <span style={{ color: scoreColor(o.score?.score), fontWeight: 600 }}>{o.score ? Math.round(o.score.score) : '—'}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// "Where can I configure the autonomous agents for scheduling" (2026-08-09)
// — per agent-action cadence, sourced from the platform-configurable
// agent_cadence_presets envelope (GET/POST /api/career-agents/schedule),
// plus on-demand triggers for the same two actions the dispatcher runs
// automatically once a cadence is set, plus a read-only view of the active
// qualification gate chain (editing it is an admin-only JSON surface, not
// built into this member-facing panel — see verification-current's PUT
// route, requireAdmin-gated).
// "After applied, there should be a nested tributary process for hiring
// manager research and direct job outreach that can merge back to the
// application process." Real research (findOrCreatePerson/linkRodToPerson)
// and real drafting (reusing the M1 output pipeline via output_type
// 'outreach_message'), never auto-sent — the member marks the real-world
// outcome, which is what merges back into the parent opportunity's stage.
// Output version history for the selected opportunity: each output (grouped by
// lineage - an approved output edited later is a new version of the same
// output) with a button that opens its dated versions, timeline slider and
// tracked changes (admin/OutputVersionHistory.jsx).
function OpportunityOutputVersions({ opportunityId, refreshKey, onOpen }) {
  const [outputs, setOutputs] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setOutputs(null); setError(null);
    api.listResumeOutputsForOpportunity(opportunityId)
      .then((r) => { if (!cancelled) setOutputs(r.projections || []); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [opportunityId, refreshKey]);

  const lineages = useMemo(() => {
    const byRoot = new Map();
    for (const p of outputs || []) {
      const cur = byRoot.get(p.lineageRootId);
      if (!cur || p.id > cur.id) byRoot.set(p.lineageRootId, p); // ids only grow: highest id = newest version
    }
    return [...byRoot.values()];
  }, [outputs]);

  return (
    <div data-testid="opportunity-output-versions">
      <div style={S.railSubtitle}>Output Version History</div>
      {error && <div role="alert" style={{ color: '#d98ca0', fontSize: '0.72rem' }}>Could not load this opportunity's outputs: {error}</div>}
      {!error && outputs && !lineages.length && <div style={S.railEmpty}>No saved outputs for this opportunity yet.</div>}
      {lineages.map((p) => (
        <div key={p.lineageRootId} style={S.railRow}>
          <span>{p.presetName || p.presetId} <span style={{ color: '#8b877c', textTransform: 'capitalize' }}>({p.outputStatus})</span></span>
          <button style={S.ghostSmall} onClick={() => onOpen(p.id)}>Version history</button>
        </div>
      ))}
    </div>
  );
}

function OutreachSection({
  opportunityId, outreach, loading, startingOutreach, startOutreach,
  researchingContacts, researchContacts, draftingOutreachMessage, outreachDraft, draftMessage, discardOutreachDraft,
  savingOutreachMessage, saveOutreachMessage, mergingOutcome, mergeOutcome,
}) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={S.railSubtitle}>Outreach &amp; Hiring Manager Research</div>
      {loading || !outreach ? (
        <div style={S.railEmpty}>Loading…</div>
      ) : !outreach.effort ? (
        <button style={S.gold} onClick={() => startOutreach(opportunityId)} disabled={startingOutreach}>
          {startingOutreach ? 'Starting…' : 'Start Outreach'}
        </button>
      ) : (
        <>
          <button style={S.ghost} onClick={() => researchContacts(opportunityId)} disabled={researchingContacts}>
            {researchingContacts ? 'Researching…' : 'Research Hiring Manager'}
          </button>
          {outreach.contacts.length > 0 && (
            <div style={{ margin: '0.4rem 0' }}>
              {outreach.contacts.map((c) => (
                <div key={c.id} style={S.railRow}>
                  <span>{c.fullName} — {c.publicRole || '—'}</span>
                  <span style={{ fontSize: '0.62rem', color: '#8b877c', textTransform: 'uppercase' }}>{c.confidenceLabel}</span>
                </div>
              ))}
            </div>
          )}

          {outreachDraft ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem', fontSize: '0.74rem', color: '#cfc9bd', margin: '0.5rem 0' }}>
              <p style={{ margin: '0 0 0.4rem', color: '#f5f0e8', fontWeight: 600 }}>{outreachDraft.subject}</p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{outreachDraft.body}</p>
              <p style={{ fontSize: '0.68rem', color: '#8b877c', margin: '0.4rem 0' }}>Review before saving — never sent automatically.</p>
              <button style={S.gold} onClick={() => saveOutreachMessage(opportunityId)} disabled={savingOutreachMessage}>{savingOutreachMessage ? 'Saving…' : 'Save Draft'}</button>
              <button style={S.ghost} onClick={discardOutreachDraft}>Discard</button>
            </div>
          ) : (
            <button style={S.ghost} onClick={() => draftMessage(opportunityId)} disabled={draftingOutreachMessage}>
              {draftingOutreachMessage ? 'Drafting…' : 'Draft Outreach Message'}
            </button>
          )}

          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#8b877c', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Mark Outcome</div>
            {['response_received', 'interview_scheduled', 'no_response'].map((outcome) => (
              <button
                key={outcome} style={{ ...S.ghostSmall, marginRight: '0.3rem', marginBottom: '0.3rem' }}
                onClick={() => mergeOutcome(outreach.effort.id, outcome, opportunityId)} disabled={mergingOutcome}
              >
                {outcome.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AutomationPanel({ automation, loading, setSchedule, verifyingPipeline, verifyPipelineNow, runningAutoQueue, runAutoQueueNow }) {
  if (loading || !automation) return <div style={S.railEmpty}>Loading automation settings…</div>;
  const { schedules, presets, gates } = automation;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem', margin: '0.4rem 0', fontSize: '0.74rem' }}>
      <div style={S.railSubtitle}>Schedules</div>
      {schedules.map((s) => (
        <div key={`${s.agentKey}:${s.actionKey}`} style={{ marginBottom: '0.5rem' }}>
          <div style={{ color: '#f5f0e8', fontWeight: 600 }}>{s.label}</div>
          <div style={{ color: '#8b877c', fontSize: '0.68rem', marginBottom: '0.25rem' }}>{s.description}</div>
          <select
            style={S.dimInputWide}
            value={s.cadence}
            onChange={(e) => setSchedule(s.agentKey, s.actionKey, e.target.value)}
          >
            {presets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {s.nextRunAt && <div style={{ color: '#8b877c', fontSize: '0.65rem', marginTop: '0.15rem' }}>Next run: {new Date(s.nextRunAt).toLocaleString()}</div>}
        </div>
      ))}

      <div style={S.railSubtitle}>Run Now</div>
      <button style={S.ghostSmall} onClick={verifyPipelineNow} disabled={verifyingPipeline}>
        {verifyingPipeline ? 'Verifying…' : 'Verify Pipeline Now'}
      </button>{' '}
      <button style={S.ghostSmall} onClick={runAutoQueueNow} disabled={runningAutoQueue}>
        {runningAutoQueue ? 'Generating…' : 'Auto-Queue Outputs Now'}
      </button>

      <div style={S.railSubtitle}>Qualification Rule (platform default)</div>
      {gates.map((g) => (
        <div key={g.key} style={{ color: '#cfc9bd', marginBottom: '0.35rem' }}>
          <div>{g.label}</div>
          <div style={{ color: '#8b877c', fontSize: '0.65rem' }}>
            If not still live → {g.onFail?.action || 'none'}{g.onFail?.reasonTemplate ? `: "${g.onFail.reasonTemplate}"` : ''}
          </div>
        </div>
      ))}
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

  if (loading) return <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}><div style={S.railEmpty}>Loading…</div></div>;

  return (
    <div className="sb-world-rail" data-layer-scroll="1" style={S.rail}>
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

// The panel every 'config' island moon opens (Theme & Brand, Social &
// Contact, Resume Presets, Integrations — see worldIslands.js) — extracted
// to SiteConfigView.jsx 2026-09-06 so PlanetAtmosphereView.jsx can reuse it
// without a circular import between the two files. Wraps the existing
// ConfigPanel.jsx wholesale for now (it's 1600+ lines and hasn't been split
// into separately-routable sections yet — see worldIslands.js's comment on
// the 'config' entry), so every moon currently opens the same full panel;
// splitting ConfigPanel itself is the next piece, not done here.

// Generic wrapper for any island whose module is a single, already
// self-contained panel (manages its own data loading/saving) — the panel
// itself needs no shell orchestration, just the same "Back to World" header
// SiteConfigView uses. Modules with real cross-component shared state (the
// site editor's Sidebar+EditorPane+PreviewPane, with its page/section modals
// and split-view resize) aren't safe to lift this way and stay on Classic
// Tools until they get a dedicated extraction.
function SimpleEmbedView({ componentId, scope, onClear }) {
  const entry = SIMPLE_EMBED_COMPONENTS[componentId];
  if (!entry) return null;
  return (
    <div style={S.embedShell}>
      <div style={S.embedHeader}>
        <button style={{ ...S.backBtn, minHeight: 44, padding: '0 0.6rem', marginBottom: 0 }} onClick={onClear}>← Back to World</button>
        <div style={S.embedTitle}>{entry.title}</div>
      </div>
      <div style={S.embedBody}>{entry.light ? <div style={{ background: '#fff', color: '#1b2a3b', borderRadius: 10, minHeight: '100%', boxSizing: 'border-box' }}>{entry.render(scope)}</div> : entry.render(scope)}</div>
    </div>
  );
}

// Career Master's in-world "embed": the camera has already dollied into the
// Career Master crystal island (the game-like part — CRYSTAL_VARIANTS.founder,
// same core/island rendering every world object uses). What opens here is
// the real journey chooser — CareerMasterEntryPoint, unchanged and un-forked
// — so each journey "variant" (Career Orbit, Upload & Map, Manual Intake,
// Proficiency & Rollups, BestyStaff Assistant) is guided by the exact same
// classic AdminShell panels members/admins already use in Classic Tools
// (CareerMasterPanel, UploadDataScreen, CareerExperienceConfigurator,
// BoundedCareerAgentPanel), just reached without leaving the world.
function CareerMasterEmbedView({ scope, onClear }) {
  return (
    <div style={S.embedShell}>
      <div style={S.embedHeader}>
        <button style={S.backBtn} onClick={onClear}>← Back to World</button>
        <div style={S.embedTitle}>Career Master — Journey</div>
      </div>
      <div style={S.embedBody}>
        <Suspense fallback={<div style={S.railEmpty}>Loading…</div>}>
          <CareerMasterEntryPoint scope={scope} />
        </Suspense>
      </div>
    </div>
  );
}

const glass = { background: 'rgba(13,20,23,0.72)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(245,240,232,0.1)' };

const S = {
  shell: { position: 'fixed', inset: 0, background: '#05090b', color: '#f5f0e8', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', zIndex: 5 },
  frame: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#05090b', zIndex: 10 },
  frameBody: { position: 'relative', flex: 1, minHeight: 0, transform: 'translateZ(0)' },
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
  menuItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left', padding: '0.55rem 0.5rem', marginBottom: '0.3rem', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#f5f0e8', cursor: 'pointer', font: 'inherit', fontSize: '0.8rem' },
  menuDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  menuHint: { fontSize: '0.62rem', color: '#8b877c', textTransform: 'uppercase', letterSpacing: '0.05em' },
  classicBack: { position: 'fixed', top: '0.6rem', left: '0.6rem', zIndex: 20, padding: '0.4rem 0.8rem', borderRadius: 6, border: '0.5px solid rgba(196,132,58,0.4)', background: 'rgba(13,20,23,0.85)', color: '#c4843a', fontSize: '0.74rem', cursor: 'pointer' },
};
