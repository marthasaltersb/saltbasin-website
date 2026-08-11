import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import { assembleMolecules } from '../lib/journeyEngine/bonding.js';
import { fromLead, fromMoleculeProduction, buildRodFromPlan, buildRodFromJourneyDefinition } from '../lib/journeyEngine/genesis.js';
import { clamp01, rollupStageMaturity, evaluateGate, computeAtomVisual } from '../lib/journeyEngine/maturity.js';
import { getAtomLineage, lineageValueAtOffset, bumpVersion } from '../lib/journeyEngine/lineage.js';
import { resolvePathColor } from '../lib/journeyEngine/pathColor.js';
import { classifyStratum, computeCrossDomainContributionRatio, contributionRatioBand, basinFor, resuspendAtom } from '../lib/journeyEngine/basin.js';
import { computeHeterosemanticDivergence, classifyDivergence, isReconciliationBoundaryExceedance } from '../lib/journeyEngine/divergence.js';
import {
  getBipyramidParts, getConfiguredAtomParts, buildAtomMaterial, buildStageAnchorMesh, buildMoleculeShellMesh,
  buildHashNodeMesh, buildReconciliationRingMesh, buildHomeAnchorPinMesh, buildGateBeaconMesh, buildGlowSprite,
} from '../lib/journeyEngine/atomGeometry.js';
import { computeRodLayout, computeGateDimensionRibs } from '../lib/journeyEngine/layout.js';
import { triangulateEntity } from '../lib/journeyEngine/rodHash.js';
import { calculateRodCoherence } from '../lib/journeyEngine/rodMathematics.js';
import {
  getPermissionProfile, describeAtomConflict, describeGateStatus, describeMergeProposal,
  describeOutputsAgentAvailability, describeModuleAccess,
} from '../lib/journeyEngine/mockAgentProvider.js';
import { ROD_TEMPLATES, MOLECULE_DEFINITIONS, OBJECTIVES, SEED_LEADS } from '../data/journeyWorldConfig.js';
import { WORLD_REGISTRY, ROTATION_CHOREOGRAPHY_REGISTRY, getWorldDefinition } from '../config/visual/worldRegistry.js';
import { getWorldVariantDefinition } from '../config/visual/worldVariantRegistry.js';
import { resolveWorldComposition } from '../config/visual/worldCompositionRegistry.js';
import { getDashboardDefinition, listDashboardDefinitions } from '../config/experience/dashboardDefinitionRegistry.js';
import { api } from '../lib/api.js';
import { QUERY_INTERACTION_REGISTRY, QUERY_CONTEXT_REGISTRY } from '../config/metrics/queryContextRegistry.js';
import { METRIC_DEFINITION_REGISTRY } from '../config/metrics/metricDefinitionRegistry.js';
import { shellRadiusForBand } from '../config/visual/worldVariantEncodingProfiles.js';
import { describeRelevanceComponents, generateElementBusinessMeaning } from '../config/metrics/queryRelevanceNarrative.js';
import { MATURITY_MODEL, maturityToneFor } from '../config/metrics/maturityModel.js';
import { bandForMaturity } from '../lib/journeyEngine/maturity.js';
import { JOURNEY_WORLD_EXPERIENCE, resolveJourneyObjectGroup } from '../config/visual/journeyWorldExperience.js';
import { DEAL_JOURNEY_EXPERIENCE } from '../data/dealJourneyExperience.js';
import { attachSceneManifest, attachSceneManifestTree, publishSceneManifest, removePublishedSceneManifest } from '../lib/sceneManifest.js';

// ---------------------------------------------------------------------------
// Brand palette read straight from brand.css custom properties at mount, so
// this scene can never drift from the rest of the site's design tokens.
// ---------------------------------------------------------------------------
function hexToNum(cssValue, fallback) {
  if (!cssValue) return fallback;
  const clean = cssValue.trim().replace('#', '');
  const parsed = parseInt(clean, 16);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readBrandPalette() {
  const fallback = { navy: 0x1B2A3B, nearBlack: 0x0A121C, cream: 0xF5F0E8, teal: 0x4A7C8E, gold: 0xC4843A, mauve: 0x785D69, greige: 0x8A8072, champagne: 0xE8DCC4, risk: 0xC44A4A };
  if (typeof window === 'undefined') return fallback;
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fb) => hexToNum(styles.getPropertyValue(name), fb);
  return {
    navy: read('--sb-navy', fallback.navy),
    nearBlack: read('--sb-navy-900', fallback.nearBlack),
    cream: read('--sb-cream', fallback.cream),
    teal: read('--sb-teal', fallback.teal),
    gold: read('--sb-gold', fallback.gold),
    mauve: read('--sbh-mauve', fallback.mauve),
    greige: read('--sb-greige', fallback.greige),
    champagne: read('--sb-champagne', fallback.champagne),
    risk: read('--sb-risk-critical', fallback.risk),
  };
}

const STAGE_SPACING = 8;
const CONVERGE_DURATION = 1.2;
const HOLD_DURATION = 2.6;
const RETURN_DURATION = 1.0;
const HASH_PHASE1 = 1.4;
const HASH_HOLD = 0.5;

function smoothstep(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

function pctLabel(v) { return `${Math.round(clamp01(v) * 100)}%`; }

export default function SpatialJourneyWorld() {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const apiRef = useRef(null);

  const [worldEntered, setWorldEntered] = useState(false);
  const [worldId, setWorldId] = useState('journey');
  // Only Crystal Basin and Temporal Canyon have any real rendering behind them
  // (salt-basin-world-variants Phase 5) — the other five registered variants
  // are structure-only (builder: null throughout), so they're deliberately
  // left out of this live selector rather than offered as a non-functional option.
  const [variantKey, setVariantKey] = useState('CRYSTAL_BASIN');
  const [scenarioScopeId, setScenarioScopeId] = useState('');
  const [timeOffset, setTimeOffset] = useState(0);
  const [dashboardId, setDashboardId] = useState('');
  const [role, setRole] = useState('reviewer');
  const [selection, setSelection] = useState(null);
  const [objectives, setObjectives] = useState(() => OBJECTIVES.map((o) => ({ ...o })));
  const [legendOpen, setLegendOpen] = useState(false);
  const [atomIndexOpen, setAtomIndexOpen] = useState(false);
  const [atomIndexRows, setAtomIndexRows] = useState([]);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState(null);
  const [customerOrbitOpen, setCustomerOrbitOpen] = useState(false);
  const [entityOptions, setEntityOptions] = useState([]);
  const [hashProgress, setHashProgress] = useState({ active: false, pct: 0 });
  const [toast, setToast] = useState('');
  const [viewingLabel, setViewingLabel] = useState('');
  const [devStatsOpen, setDevStatsOpen] = useState(false);
  const [devStats, setDevStats] = useState({ fps: 0, meshes: 0, atoms: 0 });
  const [ready, setReady] = useState(false);
  const [worldLayer, setWorldLayer] = useState('journey');

  const toastTimeoutRef = useRef(null);
  const viewingTimeoutRef = useRef(null);
  // Resolved server-side once on mount (Config Envelope: 'rod-mathematics-methodology',
  // see server/lib/configEnvelope.js) — a ref, not state, so the imperative scene closures
  // below always read the latest value without re-running the mount effect. Stays null
  // until the fetch resolves; calculateRodCoherence() already defaults to its own
  // DEFAULT_METHODOLOGY when passed undefined, so a slow/failed fetch degrades safely.
  const rodMathematicsMethodologyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.getConfigEnvelope('rod-mathematics-methodology')
      .then((res) => { if (!cancelled) rodMathematicsMethodologyRef.current = res.value; })
      .catch(() => { /* stays null; calculateRodCoherence falls back to its own default */ });
    return () => { cancelled = true; };
  }, []);

  // Maturity Model (Config Envelope: 'maturity-model', publicRead — this is an
  // unauthenticated /output route, so it must not need a session to get the
  // admin's saved override). Held twice on purpose: a ref for the imperative
  // Three.js closures below, and state so the React inspector panels re-render
  // with new band labels/colors when it arrives. Both start from the shipped
  // MATURITY_MODEL so nothing renders unbanded during the fetch.
  const maturityModelRef = useRef(MATURITY_MODEL);
  const journeyExperienceRef = useRef(JOURNEY_WORLD_EXPERIENCE);
  const [maturityModel, setMaturityModel] = useState(MATURITY_MODEL);

  useEffect(() => {
    let cancelled = false;
    api.getConfigEnvelope('maturity-model')
      .then((res) => {
        if (cancelled || !res?.value) return;
        maturityModelRef.current = res.value;
        setMaturityModel(res.value);
        // The scene is built imperatively, so a model that lands after first
        // paint has to be pushed onto the existing meshes.
        apiRef.current?.refreshAllVisuals?.();
      })
      .catch(() => { /* keeps the shipped default */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getConfigEnvelope('journey-world-experience')
      .then((res) => {
        if (cancelled || !res?.value) return;
        journeyExperienceRef.current = res.value;
        apiRef.current?.applyLayerVisibility?.('journey');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    apiRef.current?.applyLayerVisibility?.(worldLayer);
  }, [worldLayer]);

  // Enterprise Objectives from the SEEDED value-creation initiatives (per
  // Betsy 2026-07-29: "objectives seem to be hardcoded... match the seeded
  // data value creation initiatives at least"). The static OBJECTIVES config
  // stays as the fallback for logged-out viewers of this public /output route
  // (the lonetree-mvp API requires an authenticated session) — real data
  // replaces it whenever the fetch succeeds.
  useEffect(() => {
    let cancelled = false;
    api.getLonetreeMvpValueCreation()
      .then((initiatives) => {
        if (cancelled || !Array.isArray(initiatives) || initiatives.length === 0) return;
        setObjectives(initiatives.map((i) => ({
          id: i.initiativeId,
          title: i.Initiative_Name || i.initiativeId,
          complete: /complete|done|closed|delivered/i.test(String(i.Status || '')),
          initiativeDetail: [i.Objective, i.Status && `Status: ${i.Status}`].filter(Boolean).join(' — '),
        })));
      })
      .catch(() => { /* not authenticated or demo not seeded — keep static fallback objectives */ });
    return () => { cancelled = true; };
  }, []);

  const pulseToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const pulseViewingLabel = useCallback((label) => {
    setViewingLabel(label);
    clearTimeout(viewingTimeoutRef.current);
    viewingTimeoutRef.current = setTimeout(() => setViewingLabel(''), 6000);
  }, []);

  // -------------------------------------------------------------------------
  // Scene mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()) return undefined;
    const container = hostRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let disposed = false;
    let frame = 0;
    const mountTime = performance.now();
    const palette = readBrandPalette();
    const pinnedRodColors = { revenue: palette.gold, customer: palette.teal, member: palette.mauve };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(palette.nearBlack, 0.01);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 600);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Skybox: a vertical gradient sphere, navy -> near-black.
    (function buildSkybox() {
      const gradCanvas = document.createElement('canvas');
      gradCanvas.width = 4; gradCanvas.height = 256;
      const ctx = gradCanvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      const navyHex = `#${palette.navy.toString(16).padStart(6, '0')}`;
      const blackHex = `#${palette.nearBlack.toString(16).padStart(6, '0')}`;
      grad.addColorStop(0, navyHex);
      grad.addColorStop(0.6, navyHex);
      grad.addColorStop(1, blackHex);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, 256);
      const tex = new THREE.CanvasTexture(gradCanvas);
      const geo = new THREE.SphereGeometry(240, 24, 16);
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
      const background = new THREE.Mesh(geo, mat);
      attachSceneManifest(background, { instanceId: 'journey-world:background', decorative: true, scene: { component: 'SpatialJourneyWorld', builder: 'buildGradientBackground' } });
      scene.add(background);
    }());

    scene.add(new THREE.AmbientLight(palette.cream, 0.32));
    const key = new THREE.DirectionalLight(palette.champagne, 1.1);
    key.position.set(24, 44, 14);
    scene.add(key);
    const rim = new THREE.DirectionalLight(palette.teal, 0.5);
    rim.position.set(-32, 12, -22);
    scene.add(rim);
    const gold = new THREE.PointLight(palette.gold, 0.4, 60);
    gold.position.set(-16, 10, 20);
    scene.add(gold);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: palette.navy, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.25;
    attachSceneManifest(ground, { instanceId: 'journey-world:ground', decorative: true, scene: { component: 'SpatialJourneyWorld', builder: 'buildGroundPlane' } });
    scene.add(ground);
    const grid = new THREE.GridHelper(220, 56, palette.teal, palette.navy);
    grid.position.y = -1.24;
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    attachSceneManifest(grid, { instanceId: 'journey-world:grid', decorative: true, scene: { component: 'SpatialJourneyWorld', builder: 'GridHelper' } });
    scene.add(grid);

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    // ------------------------- world domain state -------------------------
    const world = {
      rods: [],
      tributaryRods: [],
      builtRodIds: new Set(),
      moleculesByRod: {},
      stagePositions: {},
      meshRegistry: new Map(),
      raycastMeshes: [],
      atomGroups: {},
      atomParts: {},
      atomHalos: {},
      atomLines: {},
      atomConflictRings: {},
      stageMeshes: {},
      connectors: {},
      moleculeShells: {},
      gateBeacons: {},
      reconciliationZones: {},
      canyonWalls: {},
      activeVariantKey: 'CRYSTAL_BASIN',
      activeScenarioScopeId: null,
      activeTimeOffset: 0,
      dashboardActive: null,
      orbitCenter: new THREE.Vector3(0, 15, 10),
      hashNodePos: new THREE.Vector3(0, 30, 10),
      hashNode: null,
      hashGlow: null,
      hashActive: false,
      hashAtomKeys: [],
      highlightedKeys: null,
    };

    function pathColorFor(rod) {
      if (rod.rodType === 'masterData') return palette.gold;
      return resolvePathColor(rod.rodType, { pinned: pinnedRodColors });
    }

    // TEMPORAL_CANYON_COMPONENT_PROFILE's rod.geometry: "canyon wall segments
    // along computeRodLayout() — the primary visual structure of this entire
    // variant." Two vertical wall ribbons follow the rod's real stage
    // positions (same computeRodLayout() output every other variant uses —
    // no second layout algorithm). Wall height/width is driven by the rod's
    // average stage maturity ("local environment richness scales with
    // maturity" per the profile's maturityEncoding) — deliberately NOT a
    // literal completeness percentage, matching that profile's explicit
    // warning against the "literal wall-fraction" trap. Hidden by default;
    // only visible while TEMPORAL_CANYON is the active variant (see
    // activateVariant below) so it never competes with Crystal Basin's
    // default rendering.
    function buildCanyonWalls(rod, positions) {
      if (!positions || positions.length < 2) return;
      const maturities = (rod.stages || []).map((s) => s.maturity || 0);
      const richness = maturities.length ? clamp01(maturities.reduce((a, b) => a + b, 0) / maturities.length) : 0;
      const halfWidth = 3 + richness * 1.5;
      const wallHeight = 3 + richness * 6;
      const floorY = -1.2;
      const curve = new THREE.CatmullRomCurve3(positions, false, 'catmullrom', 0.15);
      const segments = Math.max(positions.length * 6, 12);
      const verts = [];
      const uvs = [];
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const p = curve.getPointAt(Math.min(t, 1));
        const tangent = curve.getTangentAt(Math.min(t, 0.999)).normalize();
        const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const left = p.clone().addScaledVector(side, halfWidth);
        const right = p.clone().addScaledVector(side, -halfWidth);
        verts.push(left.x, floorY, left.z, left.x, floorY + wallHeight, left.z, right.x, floorY, right.z, right.x, floorY + wallHeight, right.z);
        uvs.push(0, t, 0, t, 1, t, 1, t);
      }
      const indices = [];
      for (let i = 0; i < segments; i += 1) {
        const a = i * 4; const b = (i + 1) * 4;
        indices.push(a, a + 1, b + 1, a, b + 1, b); // left wall quad
        indices.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3); // right wall quad
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: pathColorFor(rod), roughness: 0.85, metalness: 0.05, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = world.activeVariantKey === 'TEMPORAL_CANYON';
      attachSceneManifestTree(mesh, {
        instanceId: `journey-canyon-wall:${rod.id}`, semanticId: 'journey_rod', variantId: 'TEMPORAL_CANYON',
        source: { type: 'journey-rod', id: rod.id, field: 'stageMaturityAverage' },
        visualRules: { geometryId: 'canyon_wall', materialId: 'canyon-terrain', colorRule: 'global-path-color' },
        scene: { component: 'SpatialJourneyWorld', builder: 'buildCanyonWalls', parent: `journey-rod:${rod.id}` },
        interaction: { events: [], stateTarget: null },
      });
      scene.add(mesh);
      world.canyonWalls[rod.id] = mesh;
    }

    // Shared by activateVariant() (single-lens picker) and the Dashboard Definition View's split-viewport
    // render passes (animate(), below) — one place toggles which mesh layer represents which variant's
    // terrain, never duplicated per caller. Returns whether canyon terrain is now active, so callers can
    // branch camera behavior without re-deriving the same check.
    function applyVariantVisualState(nextVariantKey) {
      const canyonActive = nextVariantKey === 'TEMPORAL_CANYON';
      Object.values(world.canyonWalls).forEach((mesh) => { mesh.visible = canyonActive; });
      ground.visible = !canyonActive;
      grid.material.opacity = canyonActive ? 0.04 : 0.12;
      return canyonActive;
    }

    function keyFor(rod, item) { return `${rod.id}::${item.id ?? item.atomId}`; }

    function allAtomsOf(rod) {
      const fromStages = (rod.stages || []).flatMap((stage) => (stage.atoms || []).map((a) => ({ atomInstance: a, stage, rod })));
      const fromTributary = rod.tributary ? rod.tributary.stages.flatMap((stage) => (stage.atoms || []).map((a) => ({ atomInstance: a, stage, rod }))) : [];
      return fromStages.concat(fromTributary);
    }

    function findAtomEverywhere(globalKey) {
      for (const rod of world.rods) {
        for (const entry of allAtomsOf(rod)) {
          if (keyFor(rod, entry.atomInstance) === globalKey) return entry;
        }
      }
      return null;
    }

    function recomputeMoleculesForRod(rod) {
      const atoms = allAtomsOf(rod).map((e) => e.atomInstance);
      const dimensionValues = {};
      atoms.forEach((a) => { if (a.elementId === 'PricingModelEnum' && a.value) dimensionValues.pricingModel = a.value; });
      world.moleculesByRod[rod.id] = assembleMolecules(atoms, MOLECULE_DEFINITIONS, dimensionValues);
    }

    // ------------------------------ layout ---------------------------------
    function syncBranchPseudoRods() {
      world.tributaryRods = [];
      world.rods.forEach((rod) => {
        if (rod.tributary) {
          world.tributaryRods.push({
            id: `${rod.id}::branch`,
            rodType: rod.rodType,
            isBranch: true,
            hostRod: rod,
            parentRodId: rod.id,
            originGateId: rod.tributary.originStageId,
            branchAngleDeg: 62,
            branchElevation: 0.42,
            stages: rod.tributary.stages,
          });
        }
      });
    }

    function recomputeLayout() {
      syncBranchPseudoRods();
      const all = world.rods.concat(world.tributaryRods);
      world.stagePositions = computeRodLayout(THREE, all, {
        stageSpacing: journeyExperienceRef.current.scene.stageSpacing || STAGE_SPACING,
        rootPath: journeyExperienceRef.current.scene.path,
      });
      recomputeOrbitCenter();
    }

    function recomputeOrbitCenter() {
      const all = Object.values(world.stagePositions).flat();
      if (!all.length) return;
      const center = all.reduce((acc, p) => acc.add(p), new THREE.Vector3());
      center.divideScalar(all.length);
      center.y += 16;
      world.orbitCenter.copy(center);
      world.hashNodePos.copy(center).add(new THREE.Vector3(0, 14, 0));
      if (world.hashNode) { world.hashNode.position.copy(world.hashNodePos); world.hashGlow.position.copy(world.hashNodePos); }
    }

    // -------------------------- orbit params --------------------------------
    function stableHash(str) { let h = 0; for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
    function orbitParamsFor(globalKey) {
      const h = stableHash(globalKey);
      return {
        baseTheta: (h % 1000) / 1000 * Math.PI * 2,
        radius: 30 + ((h >> 4) % 700) / 700 * 22,
        height: 4 + ((h >> 8) % 500) / 500 * 12,
        speed: 0.03 + ((h >> 12) % 100) / 100 * 0.02,
      };
    }
    function orbitPosition(params, elapsed, target) {
      const theta = params.baseTheta + elapsed * params.speed;
      target.set(
        world.orbitCenter.x + Math.cos(theta) * params.radius,
        world.orbitCenter.y + params.height + Math.sin(elapsed * 0.4 + params.baseTheta) * 0.6,
        world.orbitCenter.z + Math.sin(theta) * params.radius
      );
      return target;
    }

    function registerInteractive(mesh, entry) {
      world.meshRegistry.set(mesh.uuid, entry);
      world.raycastMeshes.push(mesh);
    }

    // ------------------------------ builders --------------------------------
    function buildAtomMesh(rod, stage, atomInstance, homePos) {
      const gKey = keyFor(rod, atomInstance);
      const rodColor = pathColorFor(rod);
      const groupDefinition = resolveJourneyObjectGroup(atomInstance, journeyExperienceRef.current);
      const groupColor = hexToNum(groupDefinition.color, rodColor);
      const visual = computeAtomVisual(atomInstance, groupColor, { riskColor: palette.risk, paleColor: palette.champagne, dimColor: palette.greige, model: maturityModelRef.current });
      const parts = getConfiguredAtomParts(THREE, groupDefinition.geometry, visual.facet);
      const matTop = buildAtomMaterial(THREE, visual);
      const topMesh = new THREE.Mesh(parts.primary || parts.top, matTop);
      const bottomMesh = parts.bottom ? new THREE.Mesh(parts.bottom, matTop.clone()) : null;
      const group = new THREE.Group();
      group.add(topMesh);
      if (bottomMesh) group.add(bottomMesh);
      const orbitParams = orbitParamsFor(gKey);
      const initial = orbitPosition(orbitParams, 0, new THREE.Vector3());
      group.position.copy(initial);
      group.scale.set(0.8, visual.scaleY * 0.85, 0.8);
      group.userData = {
        state: 'orbit', orbitParams, homePos: homePos.clone(), globalKey: gKey,
        objectLayer: 'atom', populated: atomInstance.value !== null && atomInstance.value !== undefined && atomInstance.value !== '',
        groupKey: groupDefinition.key,
      };
      const atomManifest = {
        instanceId: `journey-atom:${gKey}`, semanticId: 'evidence_atom', variantId: 'CRYSTAL_BASIN',
        source: { type: 'journey-atom', id: gKey, field: atomInstance.elementId || atomInstance.atomId },
        visualRules: { geometryId: 'atom_crystal', materialId: 'crystalline-metal', colorRule: 'global-path-color', outlineRule: 'validation-state', lightingRule: 'observation-state', opacityRule: 'contribution-state' },
        scene: { component: 'SpatialJourneyWorld', builder: 'buildAtomMesh', parent: `journey-stage:${rod.id}::${stage.id}` },
        interaction: { events: ['SELECT', 'FOCUS'], stateTarget: 'selection' },
      };
      attachSceneManifestTree(group, atomManifest);
      scene.add(group);

      const halo = buildGlowSprite(THREE, atomInstance.conflict ? palette.risk : visual.colorHex, 2 + visual.haloIntensity * 2);
      halo.userData.globalKey = gKey;
      halo.material.opacity = visual.haloIntensity * 0.55;
      halo.position.copy(initial);
      attachSceneManifest(halo, atomManifest);
      scene.add(halo);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([homePos, initial]),
        new THREE.LineBasicMaterial({ color: rodColor, transparent: true, opacity: 0.1 })
      );
      attachSceneManifest(line, atomManifest);
      scene.add(line);

      const pin = buildHomeAnchorPinMesh(THREE, { color: rodColor });
      pin.position.copy(homePos);
      attachSceneManifestTree(pin, atomManifest);
      scene.add(pin);

      let conflictRing = null;
      if (atomInstance.conflict) {
        conflictRing = buildReconciliationRingMesh(THREE, { color: palette.risk, radius: 1.3, tube: 0.035 });
        conflictRing.rotation.x = Math.PI / 2;
        conflictRing.position.copy(initial);
        attachSceneManifestTree(conflictRing, atomManifest);
        scene.add(conflictRing);
      }

      world.atomGroups[gKey] = group;
      world.atomParts[gKey] = [topMesh, bottomMesh].filter(Boolean);
      world.atomHalos[gKey] = halo;
      world.atomLines[gKey] = line;
      if (conflictRing) world.atomConflictRings[gKey] = conflictRing;

      const entry = { kind: 'atom', atomInstance, stage, rod, globalKey: gKey };
      registerInteractive(topMesh, entry);
      if (bottomMesh) registerInteractive(bottomMesh, entry);
      registerInteractive(pin, entry);
    }

    function buildStageMesh(rod, stage, pos) {
      const sKey = keyFor(rod, stage);
      const color = pathColorFor(rod);
      const mesh = buildStageAnchorMesh(THREE, { color, geometryStyle: journeyExperienceRef.current.stage.geometry });
      mesh.position.copy(pos);
      mesh.position.y = -0.95;
      const stageManifest = {
        instanceId: `journey-stage:${sKey}`, semanticId: 'journey_rod', variantId: 'TEMPORAL_CANYON',
        source: { type: 'journey-stage', id: sKey, field: 'maturity' },
        visualRules: { geometryId: 'journey_rod', materialId: 'machined-metal', colorRule: 'journey-identity', outlineRule: 'none', lightingRule: 'coordinate-activity', opacityRule: 'always-visible' },
        scene: { component: 'SpatialJourneyWorld', builder: 'buildStageMesh', parent: `journey-rod:${rod.id}` },
        interaction: { events: ['SELECT', 'FOCUS'], stateTarget: 'selection' },
      };
      attachSceneManifestTree(mesh, stageManifest);
      scene.add(mesh);
      world.stageMeshes[sKey] = { mesh, rod, stage };
      registerInteractive(mesh, { kind: 'stage', stage, rod, globalKey: sKey });

      const floorGlow = buildGlowSprite(THREE, color, 6.5);
      floorGlow.position.copy(pos);
      floorGlow.position.y = -1.15;
      floorGlow.material.opacity = 0.2;
      attachSceneManifest(floorGlow, { ...stageManifest, instanceId: `${stageManifest.instanceId}:glow` });
      scene.add(floorGlow);

      if (stage.gate) {
        const beacon = buildGateBeaconMesh(THREE, { color: palette.champagne, height: 7 });
        beacon.position.copy(pos);
        beacon.position.y = -0.7;
        attachSceneManifestTree(beacon, { ...stageManifest, instanceId: `${stageManifest.instanceId}:gate:${stage.gate.id}`, source: { type: 'journey-gate', id: stage.gate.id, field: 'status' } });
        scene.add(beacon);
        world.gateBeacons[`${sKey}::${stage.gate.id}`] = { mesh: beacon, rod, stage };
      }
    }

    function buildConnector(posA, posB, color, key) {
      const mid = posA.clone().lerp(posB, 0.5);
      mid.y += 0.3;
      const curve = new THREE.QuadraticBezierCurve3(posA.clone().setY(0.2), mid, posB.clone().setY(0.2));
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 8, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 }));
      attachSceneManifest(mesh, {
        instanceId: `journey-connector:${key}`, semanticId: key.includes('branch') ? 'journey_tributary' : 'journey_rod', variantId: 'TEMPORAL_CANYON',
        source: { type: 'journey-transition', id: key },
        visualRules: { geometryId: key.includes('branch') ? 'tributary_channel' : 'journey_rod', materialId: 'lineage-metal', colorRule: 'global-path-color' },
        scene: { component: 'SpatialJourneyWorld', builder: 'buildConnector' }, interaction: { events: [], stateTarget: null },
      });
      scene.add(mesh);
      world.connectors[key] = mesh;
    }

    function buildMoleculeShells(rod) {
      const molecules = world.moleculesByRod[rod.id] || [];
      molecules.forEach((molecule) => {
        const memberPositions = molecule.memberAtomIds
          .map((atomId) => world.atomGroups[`${rod.id}::${atomId}`])
          .filter(Boolean)
          .map((g) => g.position);
        if (!memberPositions.length) return;
        const center = memberPositions.reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3()).divideScalar(memberPositions.length);
        const populated = molecule.memberAtomIds.some((atomId) => world.atomGroups[`${rod.id}::${atomId}`]?.userData.populated);
        const shell = buildMoleculeShellMesh(THREE, { color: pathColorFor(rod), radius: 3.2 });
        shell.position.copy(center);
        shell.userData = { objectLayer: 'molecule', populated };
        attachSceneManifestTree(shell, {
          instanceId: `journey-molecule:${rod.id}::${molecule.moleculeId}`, semanticId: 'semantic_composition', variantId: 'MATURITY_LATTICE',
          source: { type: 'journey-molecule', id: `${rod.id}::${molecule.moleculeId}`, field: 'memberAtomIds' },
          visualRules: { geometryId: 'molecule_lattice', materialId: 'settlement-material', colorRule: 'global-path-color' },
          scene: { component: 'SpatialJourneyWorld', builder: 'buildMoleculeShells', parent: `journey-rod:${rod.id}` }, interaction: { events: [], stateTarget: null },
        });
        scene.add(shell);
        world.moleculeShells[`${rod.id}::${molecule.moleculeId}`] = { mesh: shell, rod, molecule, memberKeys: molecule.memberAtomIds.map((id) => `${rod.id}::${id}`) };
      });
    }

    function buildDimensionRibs(rod, stage, pos) {
      if (!stage.gate || stage.gate.moleculeId !== 'dealDimensionMolecule') return;
      const ribCount = stage.atoms.length;
      const ribs = computeGateDimensionRibs(THREE, pos, ribCount, { ribLength: 3.6, elevation: 1.6 });
      stage.atoms.forEach((atomInstance, i) => {
        const gKey = keyFor(rod, atomInstance);
        buildAtomMesh(rod, stage, atomInstance, ribs[i]);
        const line = world.atomLines[gKey];
        if (line) line.material.opacity = 0.22;
      });
    }

    function buildRodVisual(rod) {
      const positions = world.stagePositions[rod.id];
      if (!positions) return;
      rod.stages.forEach((stage, i) => {
        const pos = positions[i];
        buildStageMesh(rod, stage, pos);
        if (stage.gate && stage.gate.moleculeId === 'dealDimensionMolecule') {
          buildDimensionRibs(rod, stage, pos);
        } else {
          stage.atoms.forEach((atomInstance, ai) => {
            const angle = (ai / Math.max(stage.atoms.length, 1)) * Math.PI * 2;
            const homePos = new THREE.Vector3(pos.x + Math.cos(angle) * 2.3, 0.15, pos.z + Math.sin(angle) * 2.3);
            buildAtomMesh(rod, stage, atomInstance, homePos);
          });
        }
      });
      for (let i = 0; i < positions.length - 1; i += 1) {
        const strength = clamp01(((rod.stages[i].maturity || 0) + (rod.stages[i + 1].maturity || 0)) / 2);
        buildConnector(positions[i], positions[i + 1], pathColorFor(rod), `${rod.id}::${i}`);
        world.connectors[`${rod.id}::${i}`].material.opacity = lerp(0.15, 0.85, strength);
      }
      recomputeMoleculesForRod(rod);
      buildMoleculeShells(rod);
      evaluateStageGates(rod); // sets stage.maturity — must run before buildCanyonWalls reads it
      buildCanyonWalls(rod, positions);
    }

    function buildBranchVisual(branchPseudoRod) {
      const positions = world.stagePositions[branchPseudoRod.id];
      if (!positions) return;
      const hostRod = branchPseudoRod.hostRod;
      const color = pathColorFor(hostRod);
      branchPseudoRod.stages.forEach((stage, i) => {
        const pos = positions[i];
        buildStageMesh(hostRod, stage, pos);
        stage.atoms.forEach((atomInstance, ai) => {
          const angle = (ai / Math.max(stage.atoms.length, 1)) * Math.PI * 2;
          const homePos = new THREE.Vector3(pos.x + Math.cos(angle) * 2.1, 0.15, pos.z + Math.sin(angle) * 2.1);
          buildAtomMesh(hostRod, stage, atomInstance, homePos);
        });
      });
      const originIdx = hostRod.stages.findIndex((s) => s.id === hostRod.tributary.originStageId);
      const originPos = world.stagePositions[hostRod.id]?.[originIdx];
      if (originPos) buildConnector(originPos, positions[0], color, `${branchPseudoRod.id}::origin`);
      for (let i = 0; i < positions.length - 1; i += 1) buildConnector(positions[i], positions[i + 1], color, `${branchPseudoRod.id}::${i}`);
      buildCanyonWalls(branchPseudoRod, positions);

      const mergeIdx = hostRod.stages.findIndex((s) => s.id === hostRod.tributary.confluenceStageId);
      const mergePos = world.stagePositions[hostRod.id]?.[mergeIdx];
      const lastBranchPos = positions[positions.length - 1];
      if (mergePos) {
        buildConnector(lastBranchPos, mergePos, palette.gold, `${branchPseudoRod.id}::merge`);
        const ring = buildReconciliationRingMesh(THREE, { color: palette.gold });
        ring.position.copy(mergePos);
        ring.position.y = 1.2;
        ring.rotation.x = Math.PI / 2;
        attachSceneManifestTree(ring, {
          instanceId: `journey-reconciliation:confluence:${hostRod.tributary.id}`, semanticId: 'journey_tributary', variantId: 'TEMPORAL_CANYON',
          source: { type: 'tributary-confluence', id: hostRod.tributary.id, field: 'confluenceStageId' },
          visualRules: { geometryId: 'tributary_channel', materialId: 'lineage-metal', colorRule: 'persistent-tributary-lineage' },
          scene: { component: 'SpatialJourneyWorld', builder: 'buildBranchVisual' }, interaction: { events: ['SELECT'], stateTarget: 'selection' },
        });
        scene.add(ring);
        registerInteractive(ring, { kind: 'reconciliation', target: 'tributary', hostRod, globalKey: `confluence::${hostRod.tributary.id}` });
        world.reconciliationZones[`confluence::${hostRod.tributary.id}`] = { ring, hostRod, kind: 'tributary' };
      }
      recomputeMoleculesForRod(hostRod);
    }

    function buildMasterDataVisual(rod) {
      const positions = world.stagePositions[rod.id];
      if (!positions) return;
      rod.stages.forEach((stage, i) => buildStageMesh(rod, stage, positions[i]));

      const sourceRod = world.rods.find((r) => r.id === rod.sourceRodId);
      const targetIdx = sourceRod?.stages.findIndex((s) => s.id === rod.mergeBackStageId);
      const targetPos = targetIdx >= 0 ? world.stagePositions[sourceRod.id]?.[targetIdx] : null;
      if (targetPos) {
        buildConnector(positions[0], targetPos, palette.gold, `${rod.id}::merge`);
        const ring = buildReconciliationRingMesh(THREE, { color: palette.gold, radius: 1.5 });
        ring.position.copy(targetPos);
        ring.position.y = 1.4;
        ring.rotation.x = Math.PI / 2;
        attachSceneManifestTree(ring, {
          instanceId: `journey-reconciliation:master-data:${rod.sourceMoleculeId}`, semanticId: 'semantic_composition', variantId: 'MATURITY_LATTICE',
          source: { type: 'master-data-merge', id: rod.sourceMoleculeId, field: 'mergeBackStageId' },
          visualRules: { geometryId: 'molecule_lattice', materialId: 'settlement-material', colorRule: 'global-path-color' },
          scene: { component: 'SpatialJourneyWorld', builder: 'buildMasterDataVisual' }, interaction: { events: ['SELECT'], stateTarget: 'selection' },
        });
        scene.add(ring);
        registerInteractive(ring, { kind: 'reconciliation', target: 'masterData', masterDataRod: rod, sourceRod, globalKey: `masterdata-merge::${rod.sourceMoleculeId}` });
        world.reconciliationZones[`masterdata-merge::${rod.sourceMoleculeId}`] = { ring, masterDataRod: rod, sourceRod, kind: 'masterData' };
      }
    }

    function addRodsToWorld(newRods, entityLabel) {
      newRods.forEach((r) => { if (entityLabel) r.entityLabel = entityLabel; world.rods.push(r); });
      recomputeLayout();
      newRods.forEach((rod) => {
        if (world.builtRodIds.has(rod.id)) return;
        if (rod.rodType === 'masterData') buildMasterDataVisual(rod); else buildRodVisual(rod);
        world.builtRodIds.add(rod.id);
      });
      // any newly-synced branch pseudo-rods need building too
      world.tributaryRods.forEach((br) => {
        if (world.builtRodIds.has(br.id)) return;
        buildBranchVisual(br);
        world.builtRodIds.add(br.id);
      });
      publishSceneManifest('spatial-journey-world', scene);
    }

    // --------------------------- gate + molecule production -----------------
    function evaluateStageGates(rod) {
      rod.stages.forEach((stage) => {
        if (!stage.gate) return;
        const atomsById = {};
        stage.atoms.forEach((a) => { atomsById[a.atomId] = a; });
        const result = evaluateGate(stage.gate, atomsById, maturityModelRef.current);
        stage.gate._result = result;
        if (result.producesMolecule && !stage.gate._produced) {
          stage.gate._produced = true;
          const plan = fromMoleculeProduction({ moleculeId: result.moleculeId, gate: result, sourceRodId: rod.id, mergeBackStageId: stage.gate.mergeBackStageId });
          if (plan) {
            const { rods: masterRods } = buildRodFromPlan(plan, { rodTemplates: ROD_TEMPLATES, entityLabel: rod.entityLabel });
            addRodsToWorld(masterRods);
            pulseToast(`${result.message} A Master Data Journey Lifecycle Rod was produced from ${result.moleculeId}.`);
          }
        } else if (result.met && !stage.gate._notified) {
          stage.gate._notified = true;
          pulseToast(result.message);
        }
      });
    }

    // ------------------------------ visual refresh --------------------------
    function refreshAtomVisual(rod, atomInstance) {
      const gKey = keyFor(rod, atomInstance);
      const group = world.atomGroups[gKey];
      const parts = world.atomParts[gKey];
      if (!group || !parts) return;
      const visual = computeAtomVisual(atomInstance, pathColorFor(rod), { riskColor: palette.risk, paleColor: palette.champagne, dimColor: palette.greige, model: maturityModelRef.current });
      group.userData.targetScaleY = visual.scaleY * 0.85;
      // Facet count is a structural (geometry) channel, not a material one —
      // it can't be smoothly lerped frame-by-frame like color/opacity below,
      // so swap the shared cached geometry outright when maturity has moved
      // the atom into a different facet band (e.g. after a resolve action).
      const [topMesh, bottomMesh] = parts;
      if (topMesh?.geometry?.parameters?.radialSegments !== visual.facet) {
        const newParts = getBipyramidParts(THREE, visual.facet);
        topMesh.geometry = newParts.top;
        if (bottomMesh) bottomMesh.geometry = newParts.bottom;
      }
      parts.forEach((mesh) => { mesh.userData.targetVisual = visual; });
      const halo = world.atomHalos[gKey];
      if (halo) halo.userData = { targetOpacity: visual.haloIntensity * 0.55 };
      if (!atomInstance.conflict && world.atomConflictRings[gKey]) {
        scene.remove(world.atomConflictRings[gKey]);
        delete world.atomConflictRings[gKey];
      }
    }

    function refreshStageVisual(rod, stage) {
      const sKey = keyFor(rod, stage);
      const entry = world.stageMeshes[sKey];
      if (!entry) return;
      entry.mesh.userData.targetScaleY = lerp(0.6, 1.3, clamp01(stage.maturity));
    }

    function refreshConnectorsForRod(rod) {
      const positions = world.stagePositions[rod.id];
      if (!positions) return;
      for (let i = 0; i < rod.stages.length - 1; i += 1) {
        const mesh = world.connectors[`${rod.id}::${i}`];
        if (!mesh) continue;
        const strength = clamp01(((rod.stages[i].maturity || 0) + (rod.stages[i + 1].maturity || 0)) / 2);
        mesh.userData.targetOpacity = lerp(0.15, 0.85, strength);
      }
    }

    // ------------------------------ actions ---------------------------------
    function resolveAtomConflict(globalKey, chosenSource, chosenValue) {
      const found = findAtomEverywhere(globalKey);
      if (!found) return null;
      const { atomInstance, stage, rod } = found;
      atomInstance.maturity = 1;
      atomInstance.conflict = false;
      atomInstance.value = chosenValue;
      atomInstance.chosenSource = chosenSource;
      stage.maturity = rollupStageMaturity(stage);
      refreshAtomVisual(rod, atomInstance);
      refreshStageVisual(rod, stage);
      refreshConnectorsForRod(rod);
      recomputeMoleculesForRod(rod);
      evaluateStageGates(rod);
      setObjectives((prev) => prev.map((o) => (o.targetAtomId === atomInstance.atomId ? { ...o, complete: true } : o)));
      return found;
    }

    function runOutputsAgentAction(rod, stage, { newVersion } = {}) {
      const gate = stage.gate;
      if (!gate?._result) return null;
      if (newVersion) {
        const representativeAtomId = gate.requiredAtomIds?.[0];
        const atomInstance = stage.atoms.find((a) => a.atomId === representativeAtomId);
        if (atomInstance) {
          // Regenerating a document version disturbs the underlying atom's
          // prior settlement -- it needs to resettle against the new
          // version before it's trustworthy again (State Resuspension), and
          // the version bump records what it's superseding.
          resuspendAtom(atomInstance, { reason: `New document version requires re-corroboration for gate "${gate.label}"` });
          bumpVersion(atomInstance, `Regenerated by Outputs Agent for gate "${gate.label}"`);
          stage.maturity = rollupStageMaturity(stage);
          refreshAtomVisual(rod, atomInstance);
          refreshStageVisual(rod, stage);
          refreshConnectorsForRod(rod);
        }
        return { message: `New document version generated for ${gate.label} — the underlying record has been resuspended pending re-corroboration.` };
      }
      return { message: `Outputs Agent generated a draft output for ${gate.label}.` };
    }

    function approveMerge(globalKey) {
      const zone = world.reconciliationZones[globalKey];
      if (!zone) return null;
      if (zone.kind === 'tributary') {
        zone.hostRod.tributary.status = 'confluenced';
        setObjectives((prev) => prev.map((o) => (o.targetAtomId === globalKey ? { ...o, complete: true } : o)));
      } else if (zone.kind === 'masterData') {
        zone.masterDataRod.status = 'merged';
        const target = zone.sourceRod.stages.find((s) => s.id === zone.masterDataRod.mergeBackStageId);
        if (target) {
          target.maturity = Math.max(target.maturity, 0.9);
          refreshStageVisual(zone.sourceRod, target);
          refreshConnectorsForRod(zone.sourceRod);
        }
        setObjectives((prev) => prev.map((o) => (o.targetAtomId === globalKey ? { ...o, complete: true } : o)));
      }
      return zone;
    }

    function runStageQuery(sKey) {
      const entry = world.stageMeshes[sKey];
      if (!entry) return [];
      const center = entry.mesh.position.clone();
      center.y = 3.4;
      const atoms = allAtomsOf(entry.rod).filter((e) => e.stage.id === entry.stage.id);
      const elapsed = clockElapsed();
      atoms.forEach((e, i) => {
        const gKey = keyFor(entry.rod, e.atomInstance);
        const group = world.atomGroups[gKey];
        if (!group) return;
        const angle = (i / Math.max(atoms.length, 1)) * Math.PI * 2;
        const target = new THREE.Vector3(center.x + Math.cos(angle) * 1.6, center.y, center.z + Math.sin(angle) * 1.6);
        group.userData.state = 'converging';
        group.userData.convergeFrom = group.position.clone();
        group.userData.convergeTarget = target;
        group.userData.stateStart = elapsed;
      });
      return atoms.map((e) => keyFor(entry.rod, e.atomInstance));
    }

    let convergenceProgressInterval = null;
    function runCustomerOrbit(entityLabel, onProgress, onComplete) {
      const involvedRods = world.rods.filter((r) => r.entityLabel === entityLabel);
      const focusedPositions = involvedRods.flatMap((rod) => world.stagePositions[rod.id] || []);
      if (focusedPositions.length) {
        const sphere = new THREE.Box3().setFromPoints(focusedPositions).getBoundingSphere(new THREE.Sphere());
        cameraTargetGoal = sphere.center.clone().setY(2.5);
        sphericalGoal.radius = Math.max(18, Math.min(72, sphere.radius * 3.1));
      }
      // Time Scope + Scenario Scope both flow through the existing triangulateEntity() opts — no
      // engine change needed, only exposing what was already threaded (rodHash.js's atOffset) and
      // unifying "the scope you're browsing" with "the scope that converges" (world-variants design,
      // 2026-08-10). Falls back to the Customer Orbit's own default context when no scope is selected.
      const queryResult = triangulateEntity(world.rods, entityLabel, {
        atOffset: world.activeTimeOffset || 0,
        queryContextId: world.activeScenarioScopeId || QUERY_INTERACTION_REGISTRY.customerOrbit.contextId,
      });
      const relevanceByKey = new Map(queryResult.perRod.flatMap((rod) => (rod.queryRelevance || []).map((entry) => [`${rod.rodId}::${entry.atomId}`, entry])));
      const allAtomKeys = [];
      const elapsed0 = clockElapsed();
      involvedRods.forEach((rod) => {
        const positions = world.stagePositions[rod.id];
        if (!positions) return;
        const centroid = positions.reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3()).divideScalar(positions.length);
        centroid.y = 5;
        const atoms = allAtomsOf(rod);
        atoms.forEach((e, i) => {
          const gKey = keyFor(rod, e.atomInstance);
          const group = world.atomGroups[gKey];
          if (!group) return;
          group.visible = true;
          if (world.atomHalos[gKey]) world.atomHalos[gKey].visible = true;
          const angle = (i / Math.max(atoms.length, 1)) * Math.PI * 2;
          const target = new THREE.Vector3(centroid.x + Math.cos(angle) * 2.2, centroid.y, centroid.z + Math.sin(angle) * 2.2);
          group.userData.state = 'converging';
          group.userData.convergeFrom = group.position.clone();
          group.userData.convergeTarget = target;
          group.userData.stateStart = elapsed0;
          allAtomKeys.push(gKey);
        });
      });
      world.hashAtomKeys = allAtomKeys;
      world.hashActive = true;
      if (world.hashNode) {
        world.hashNode.userData.compiling = true; world.hashNode.userData.compiled = false;
        world.hashNode.userData.compileStart = elapsed0; world.hashNode.userData.compileDuration = HASH_PHASE1 + HASH_HOLD + 1.6;
        // Confidence -> crystal clarity and Stability -> bounded motion (Crystal Basin Visual
        // Encoding Profile, worldVariantEncodingProfiles.js) — both real, entity-level values
        // already computed by triangulateEntity(), applied to the one object they're actually
        // available for today. Per-atom confidence/stability isn't calculated anywhere yet.
        world.hashNode.userData.confidenceScore = queryResult.queryConfidence?.score ?? null;
        world.hashNode.userData.stabilityScore = queryResult.convergenceStability?.score ?? null;
      }

      // Crystal Basin §V: "converge into organized dimensional shells rather than one dense
      // ball." Group atoms by their real Query Relevance band, then fan each band out evenly
      // around its own discrete shell radius (shellRadiusForBand) — a readable ring per band,
      // not a single continuous relevance-to-radius gradient.
      const byBand = new Map();
      allAtomKeys.forEach((gKey) => {
        const entry = relevanceByKey.get(gKey);
        const bandKey = entry?.band?.key || 'peripheral';
        if (!byBand.has(bandKey)) byBand.set(bandKey, []);
        byBand.get(bandKey).push(gKey);
      });

      setTimeout(() => {
        byBand.forEach((keysInBand, bandKey) => {
          const shellRadius = shellRadiusForBand(bandKey, 'CRYSTAL_BASIN') ?? 4;
          const n = Math.max(keysInBand.length, 1);
          keysInBand.forEach((gKey, i) => {
            const group = world.atomGroups[gKey];
            if (!group) return;
            const angle = (i / n) * Math.PI * 2;
            const target = new THREE.Vector3(
              world.hashNodePos.x + Math.cos(angle) * shellRadius,
              world.hashNodePos.y + Math.sin(i * 1.7) * 1.2,
              world.hashNodePos.z + Math.sin(angle) * shellRadius,
            );
            group.userData.state = 'hashConverging';
            group.userData.hashFrom = group.position.clone();
            group.userData.hashTarget = target;
            group.userData.hashStateStart = clockElapsed();
          });
        });
      }, (HASH_PHASE1 + HASH_HOLD) * 1000);

      const totalDuration = HASH_PHASE1 + HASH_HOLD + 1.6;
      const start = performance.now();
      clearInterval(convergenceProgressInterval);
      convergenceProgressInterval = setInterval(() => {
        const t = (performance.now() - start) / 1000;
        const pct = clamp01(t / totalDuration);
        onProgress?.(pct);
        if (pct >= 1) {
          clearInterval(convergenceProgressInterval);
          if (world.hashNode) { world.hashNode.userData.compiling = false; world.hashNode.userData.compiled = true; }
          const result = queryResult;
          const involved = world.rods.filter((r) => r.entityLabel === entityLabel && r.rodType !== 'masterData');
          const divergences = [];
          for (let i = 0; i < involved.length; i += 1) {
            for (let j = i + 1; j < involved.length; j += 1) {
              const divergence = computeHeterosemanticDivergence(involved[i], involved[j]);
              divergences.push({
                rodTypeA: involved[i].rodType, rodTypeB: involved[j].rodType,
                ...divergence, classification: classifyDivergence(divergence), boundaryExceeded: isReconciliationBoundaryExceedance(divergence),
                coherence: calculateRodCoherence(
                  { axialDivergence: divergence.axialDivergence, densityDivergence: divergence.densityDivergence },
                  rodMathematicsMethodologyRef.current || undefined
                ),
              });
            }
          }
          onComplete?.({ ...result, divergences });
        }
      }, 80);
    }

    function releaseHash() {
      world.hashActive = false;
      world.highlightedKeys = null;
      world.hashAtomKeys.forEach((gKey) => {
        const group = world.atomGroups[gKey];
        if (!group) return;
        group.userData.state = 'returning';
        group.userData.stateStart = clockElapsed();
        group.userData.returnFrom = group.position.clone();
      });
      world.hashAtomKeys = [];
      if (world.hashNode) { world.hashNode.userData.compiled = false; world.hashNode.userData.compiling = false; }
    }

    function spawnFromLead(leadContext, entityLabel) {
      const plan = fromLead(leadContext);
      const { rods: newRods } = buildRodFromPlan(plan, { rodTemplates: ROD_TEMPLATES, entityLabel });
      addRodsToWorld(newRods, entityLabel);
      setEntityOptions((prev) => (prev.includes(entityLabel) ? prev : prev.concat(entityLabel)));
      return { plan, rods: newRods };
    }

    function spawnConfiguredJourney(definition, entityLabel) {
      const result = buildRodFromJourneyDefinition(definition, { entityLabel });
      addRodsToWorld(result.rods, entityLabel);
      setEntityOptions((prev) => (prev.includes(entityLabel) ? prev : prev.concat(entityLabel)));
      return result;
    }

    // ---------------------------- hash node mesh -----------------------------
    world.hashNode = buildHashNodeMesh(THREE, { color: palette.gold });
    world.hashNode.position.copy(world.hashNodePos);
    world.hashNode.scale.setScalar(0.01);
    world.hashNode.userData = { compiling: false, compiled: false };
    const hashManifest = {
      instanceId: 'journey-hash:active-query', semanticId: 'semantic_composition', variantId: 'CRYSTAL_BASIN',
      source: { type: 'query-context', id: 'active-query', field: 'queryConfidence' },
      visualRules: { geometryId: 'molecule_lattice', materialId: 'settlement-material', colorRule: 'query-confidence' },
      scene: { component: 'SpatialJourneyWorld', builder: 'buildHashNodeMesh' }, interaction: { events: ['SELECT'], stateTarget: 'selection' },
    };
    attachSceneManifestTree(world.hashNode, hashManifest);
    scene.add(world.hashNode);
    world.hashGlow = buildGlowSprite(THREE, palette.gold, 12);
    world.hashGlow.position.copy(world.hashNodePos);
    world.hashGlow.material.opacity = 0;
    attachSceneManifest(world.hashGlow, { ...hashManifest, instanceId: 'journey-hash:active-query:glow' });
    scene.add(world.hashGlow);
    registerInteractive(world.hashNode, { kind: 'hashnode', globalKey: 'hashnode' });

    // ------------------------------ camera -----------------------------------
    let cameraTarget = new THREE.Vector3(0, 4, 10);
    let cameraTargetGoal = cameraTarget.clone();
    let spherical = { radius: 130, theta: 0.4, phi: 1.2 };
    let sphericalGoal = { ...spherical };
    let entered = false;

    function updateCameraFromSpherical() {
      const { radius, theta, phi } = spherical;
      camera.position.set(
        cameraTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        cameraTarget.y + radius * Math.cos(phi),
        cameraTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(cameraTarget.x, cameraTarget.y + 1.2, cameraTarget.z);
    }
    updateCameraFromSpherical();

    function resetView() {
      cameraTargetGoal = world.orbitCenter.clone().setY(3);
      sphericalGoal = { radius: 62, theta: 0.6, phi: 1.05 };
    }
    function focusPoint(pos, radius = 14) {
      cameraTargetGoal = pos.clone();
      sphericalGoal = { radius, theta: spherical.theta, phi: 0.95 };
    }
    function zoomBy(delta) { sphericalGoal.radius = Math.max(6, Math.min(160, sphericalGoal.radius + delta)); }
    function enterWorld() { entered = true; resetView(); }

    // ---------------------------- interaction --------------------------------
    const pointers = new Map();
    let dragId = null; let dragStart = null; let dragMoved = false; let dragTime = 0; let pinchDist = null;

    function handleClick(e) {
      if (world.dashboardActive) return; // split-viewport hit-testing not built yet — see activateDashboard()
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(world.raycastMeshes, false);
      if (!hits.length) return;
      const entry = world.meshRegistry.get(hits[0].object.uuid);
      if (!entry) return;
      apiRef.current?.onSceneEntitySelected?.(entry);
    }

    function bindInteraction() {
      canvas.addEventListener('pointerdown', (e) => {
        if (!entered) return;
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) { const pts = [...pointers.values()]; pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y); dragId = null; }
        else if (pointers.size === 1) { dragId = e.pointerId; dragStart = { x: e.clientX, y: e.clientY }; dragTime = performance.now(); dragMoved = false; }
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!entered || !pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2 && pinchDist !== null) {
          const pts = [...pointers.values()];
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          sphericalGoal.radius = Math.max(6, Math.min(160, sphericalGoal.radius - (dist - pinchDist) * 0.08));
          pinchDist = dist;
          return;
        }
        if (pointers.size === 1 && e.pointerId === dragId && dragStart) {
          const dx = e.clientX - dragStart.x; const dy = e.clientY - dragStart.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) {
            dragMoved = true;
            sphericalGoal.theta -= dx * 0.005;
            sphericalGoal.phi = Math.max(0.28, Math.min(1.5, sphericalGoal.phi - dy * 0.005));
            dragStart = { x: e.clientX, y: e.clientY };
          }
        }
      });
      function release(e) {
        if (!pointers.has(e.pointerId)) return;
        const wasSingle = pointers.size === 1 && e.pointerId === dragId;
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchDist = null;
        if (wasSingle) {
          if (!dragMoved && performance.now() - dragTime < 400) handleClick(e);
          dragId = null;
        }
      }
      canvas.addEventListener('pointerup', release);
      canvas.addEventListener('pointercancel', release);
      canvas.addEventListener('wheel', (e) => { if (!entered) return; e.preventDefault(); sphericalGoal.radius = Math.max(6, Math.min(160, sphericalGoal.radius + e.deltaY * 0.04)); }, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (!entered) return;
        if (e.key === '0') resetView();
        if (e.key === '+' || e.key === '=') zoomBy(-8);
        if (e.key === '-' || e.key === '_') zoomBy(8);
      });
    }
    bindInteraction();

    // ------------------------------ world init --------------------------------
    function clockElapsed() { return (performance.now() - mountTime) / 1000; }
    SEED_LEADS.forEach(({ leadContext, entityLabel }) => spawnFromLead(leadContext, entityLabel));

    // ------------------------------ resize -------------------------------------
    function resize() {
      const rect = container.getBoundingClientRect();
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // ------------------------------ animate ------------------------------------
    let statsAcc = { frames: 0, last: performance.now(), fps: 0 };
    const tmp = new THREE.Vector3();

    function animate() {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const elapsed = clockElapsed();
      const dt = 0.016;

      cameraTarget.lerp(cameraTargetGoal, entered ? 0.07 : 0.012);
      spherical.radius = lerp(spherical.radius, sphericalGoal.radius, entered ? 0.08 : 0.01);
      spherical.theta = lerp(spherical.theta, sphericalGoal.theta, entered ? 0.08 : 0.01);
      spherical.phi = lerp(spherical.phi, sphericalGoal.phi, entered ? 0.08 : 0.01);
      updateCameraFromSpherical();

      Object.keys(world.atomGroups).forEach((gKey) => {
        const group = world.atomGroups[gKey];
        const st = group.userData.state || 'orbit';
        if (st === 'orbit') {
          orbitPosition(group.userData.orbitParams, elapsed, tmp);
          group.position.copy(tmp);
        } else if (st === 'converging') {
          const t = clamp01((elapsed - group.userData.stateStart) / CONVERGE_DURATION);
          group.position.lerpVectors(group.userData.convergeFrom, group.userData.convergeTarget, smoothstep(t));
          if (t >= 1) { group.userData.state = 'atStage'; group.userData.stateStart = elapsed; }
        } else if (st === 'atStage') {
          group.position.y = group.userData.convergeTarget.y + Math.sin(elapsed * 3) * 0.08;
          if (elapsed - group.userData.stateStart > HOLD_DURATION) { group.userData.state = 'returning'; group.userData.stateStart = elapsed; group.userData.returnFrom = group.position.clone(); }
        } else if (st === 'returning') {
          const t = clamp01((elapsed - group.userData.stateStart) / RETURN_DURATION);
          orbitPosition(group.userData.orbitParams, elapsed, tmp);
          group.position.lerpVectors(group.userData.returnFrom, tmp, smoothstep(t));
          if (t >= 1) group.userData.state = 'orbit';
        } else if (st === 'hashConverging') {
          const t = clamp01((elapsed - group.userData.hashStateStart) / 1.6);
          group.position.lerpVectors(group.userData.hashFrom, group.userData.hashTarget, smoothstep(t));
          if (t >= 1) { group.userData.state = 'atHash'; group.userData.stateStart = elapsed; }
        } else if (st === 'atHash') {
          group.position.y = group.userData.hashTarget.y + Math.sin(elapsed * 2.2) * 0.15;
        }
        group.rotation.y += dt * 0.12;

        const line = world.atomLines[gKey];
        if (line) {
          const attr = line.geometry.attributes.position;
          attr.setXYZ(0, group.userData.homePos.x, group.userData.homePos.y, group.userData.homePos.z);
          attr.setXYZ(1, group.position.x, group.position.y, group.position.z);
          attr.needsUpdate = true;
          const active = st !== 'orbit';
          line.material.opacity = lerp(line.material.opacity, active ? 0.6 : 0.1, 0.08);
        }
        const halo = world.atomHalos[gKey];
        if (halo) halo.position.copy(group.position);
        const ring = world.atomConflictRings[gKey];
        if (ring) { ring.position.copy(group.position); ring.material.opacity = 0.5 + Math.sin(elapsed * 4) * 0.3; }
      });

      Object.keys(world.atomParts).forEach((gKey) => {
        const parts = world.atomParts[gKey];
        const group = world.atomGroups[gKey];
        const highlightMode = world.highlightedKeys !== null;
        const isHighlighted = highlightMode && world.highlightedKeys.has(gKey);
        parts.forEach((mesh) => {
          const t = mesh.userData.targetVisual;
          if (!t) return;
          let targetOpacity = t.opacity; let targetEmissive = t.emissiveIntensity;
          if (highlightMode) { targetOpacity = isHighlighted ? 1 : t.opacity * 0.16; targetEmissive = isHighlighted ? Math.max(t.emissiveIntensity, 0.7) : t.emissiveIntensity * 0.3; }
          mesh.material.opacity = lerp(mesh.material.opacity, targetOpacity, 0.08);
          mesh.material.emissiveIntensity = lerp(mesh.material.emissiveIntensity, targetEmissive, 0.08);
          mesh.material.color.lerp(new THREE.Color(t.colorHex), 0.06);
        });
        if (group?.userData.targetScaleY !== undefined) group.scale.y = lerp(group.scale.y, group.userData.targetScaleY * (isHighlighted ? 1.15 : 1), 0.06);
      });

      Object.keys(world.atomHalos).forEach((gKey) => {
        const halo = world.atomHalos[gKey];
        if (halo.userData?.targetOpacity !== undefined) halo.material.opacity = lerp(halo.material.opacity, halo.userData.targetOpacity, 0.05);
      });

      Object.keys(world.connectors).forEach((k) => {
        const mesh = world.connectors[k];
        if (mesh.userData.targetOpacity !== undefined) mesh.material.opacity = lerp(mesh.material.opacity, mesh.userData.targetOpacity, 0.04);
      });
      Object.keys(world.stageMeshes).forEach((k) => {
        const { mesh } = world.stageMeshes[k];
        if (mesh.userData.targetScaleY !== undefined) mesh.scale.y = lerp(mesh.scale.y, mesh.userData.targetScaleY, 0.04);
      });
      Object.keys(world.gateBeacons).forEach((k) => {
        const { mesh } = world.gateBeacons[k];
        mesh.material.opacity = 0.35 + Math.sin(elapsed * 2.4) * 0.15;
      });
      Object.keys(world.reconciliationZones).forEach((k) => { world.reconciliationZones[k].ring.rotation.z += dt * 0.25; });

      if (world.hashNode) {
        const ud = world.hashNode.userData;
        let targetScale = 0.01; let targetOpacity = 0; let targetGlow = 0;
        if (ud.compiling) {
          const t = clamp01((elapsed - ud.compileStart) / Math.max(ud.compileDuration, 0.1));
          targetScale = 0.15 + smoothstep(t) * 0.85; targetOpacity = 0.25 + smoothstep(t) * 0.6; targetGlow = 0.3 + smoothstep(t) * 0.5;
        } else if (ud.compiled) {
          targetScale = 1 + Math.sin(elapsed * 1.4) * 0.04; targetOpacity = 0.9; targetGlow = 0.7;
        }
        world.hashNode.scale.setScalar(lerp(world.hashNode.scale.x, targetScale, 0.06));
        world.hashNode.material.opacity = lerp(world.hashNode.material.opacity, targetOpacity, 0.06);
        world.hashNode.rotation.y += dt * 0.25;
        if (world.hashGlow) world.hashGlow.material.opacity = lerp(world.hashGlow.material.opacity, targetGlow, 0.06);

        // Query Confidence -> crystal clarity. High confidence settles toward a clear, low-
        // roughness/high-clearcoat surface; low confidence stays diffuse/refracted — never just
        // fainter, per §V Variant 1's explicit "do not use simple opacity if it makes the object
        // unreadable." Only meaningful once compiled (a settled query result has a real score).
        if (ud.compiled && ud.confidenceScore !== null && ud.confidenceScore !== undefined) {
          const targetRoughness = lerp(0.55, 0.05, clamp01(ud.confidenceScore));
          const targetClearcoat = lerp(0.15, 0.85, clamp01(ud.confidenceScore));
          world.hashNode.material.roughness = lerp(world.hashNode.material.roughness, targetRoughness, 0.05);
          world.hashNode.material.clearcoat = lerp(world.hashNode.material.clearcoat, targetClearcoat, 0.05);
        }

        // Convergence Stability -> bounded motion vs. settlement. Low stability keeps a subtle
        // bounded oscillation around the hash node's true position (the result may still
        // reorganize); high stability holds it anchored. Motion communicates state — never
        // decorative — so this only runs once compiled, and the wobble amplitude is directly
        // proportional to (1 - stability), collapsing to zero at full stability.
        if (ud.compiled && ud.stabilityScore !== null && ud.stabilityScore !== undefined) {
          const wobble = (1 - clamp01(ud.stabilityScore)) * 0.55;
          world.hashNode.position.set(
            world.hashNodePos.x + Math.sin(elapsed * 1.3) * wobble,
            world.hashNodePos.y + Math.cos(elapsed * 1.7) * wobble * 0.6,
            world.hashNodePos.z + Math.cos(elapsed * 1.1) * wobble,
          );
        } else {
          world.hashNode.position.copy(world.hashNodePos);
        }
        if (world.hashGlow) world.hashGlow.position.copy(world.hashNode.position);
      }

      if (world.dashboardActive) {
        const dashboard = getDashboardDefinition(world.dashboardActive);
        const lensKeys = dashboard?.variantKeys || [];
        if (lensKeys.length) {
          const rect = container.getBoundingClientRect();
          const w = rect.width; const h = Math.max(1, rect.height);
          const paneWidth = Math.floor(w / lensKeys.length);
          camera.aspect = paneWidth / h;
          camera.updateProjectionMatrix();
          renderer.setScissorTest(true);
          lensKeys.forEach((lensVariantKey, i) => {
            applyVariantVisualState(lensVariantKey);
            renderer.setViewport(i * paneWidth, 0, paneWidth, h);
            renderer.setScissor(i * paneWidth, 0, paneWidth, h);
            renderer.render(scene, camera);
          });
          renderer.setScissorTest(false);
          renderer.setViewport(0, 0, w, h);
          applyVariantVisualState(world.activeVariantKey); // leave the scene in the interactive variant's own state, not mid-pass
        } else {
          renderer.render(scene, camera);
        }
      } else {
        renderer.render(scene, camera);
      }

      statsAcc.frames += 1;
      const now = performance.now();
      if (now - statsAcc.last > 500) {
        statsAcc.fps = Math.round((statsAcc.frames * 1000) / (now - statsAcc.last));
        statsAcc.frames = 0; statsAcc.last = now;
        setDevStats({ fps: statsAcc.fps, meshes: renderer.info.render.calls, atoms: Object.keys(world.atomGroups).length });
      }
    }
    animate();
    setReady(true);

    // ------------------------------ public API -----------------------------
    apiRef.current = {
      enterWorld: () => { enterWorld(); },
      resetView,
      zoomBy,
      onSceneEntitySelected: null, // set by React effect below
      resolveAtomConflict,
      runOutputsAgentAction,
      approveMerge,
      runStageQuery,
      runCustomerOrbit,
      releaseHash,
      spawnFromLead,
      spawnConfiguredJourney,
      focusPoint,
      focusStage: (sKey) => { const e = world.stageMeshes[sKey]; if (e) focusPoint(e.mesh.position, 22); },
      focusAtom: (gKey) => { const group = world.atomGroups[gKey]; if (group) focusPoint(group.position, 12); },
      findAtomEverywhere,
      // Repaints every atom/stage against the current Maturity Model. Called
      // when the 'maturity-model' envelope resolves after first paint, so an
      // admin's saved bands/visual ranges reach a scene that is already built.
      refreshAllVisuals: () => {
        world.rods.forEach((rod) => {
          allAtomsOf(rod).forEach(({ atomInstance }) => refreshAtomVisual(rod, atomInstance));
          rod.stages.forEach((stage) => refreshStageVisual(rod, stage));
          refreshConnectorsForRod(rod);
          evaluateStageGates(rod);
        });
      },
      applyLayerVisibility: (layer) => {
        const config = journeyExperienceRef.current;
        Object.values(world.atomGroups).forEach((group) => {
          const progressiveVisible = group.userData.populated || config.visibility.showUnpopulatedAtoms;
          group.visible = layer === 'all' || (layer === 'structures' && progressiveVisible);
        });
        Object.values(world.atomHalos).forEach((halo) => {
          const group = world.atomGroups[halo.userData?.globalKey];
          halo.visible = layer === 'all' || (layer === 'structures' && (group?.userData.populated || config.visibility.showUnpopulatedAtoms));
        });
        Object.values(world.atomLines).forEach((line) => { line.visible = layer === 'all'; });
        Object.values(world.moleculeShells).forEach(({ mesh }) => {
          mesh.visible = layer === 'all' || (layer === 'structures' && mesh.userData.populated);
        });
      },
      activateWorld: (nextWorldId) => {
        const definition = getWorldDefinition(nextWorldId);
        const choreography = ROTATION_CHOREOGRAPHY_REGISTRY[definition.choreography];
        if (choreography) {
          sphericalGoal.radius = choreography.distance;
          sphericalGoal.phi = Math.max(0.35, Math.min(1.45, 1.15 - choreography.elevation));
          sphericalGoal.theta += choreography.angularVelocity * 18;
        }
        if (definition.focus === 'pricing') {
          const keys = Object.entries(world.atomGroups).filter(([, group]) => group.userData.groupKey === 'deal').map(([key]) => key);
          world.highlightedKeys = keys.length ? new Set(keys) : null;
        } else if (definition.focus === 'career') {
          const careerRods = world.rods.filter((rod) => rod.rodType === 'career_master');
          const points = careerRods.flatMap((rod) => world.stagePositions[rod.id] || []);
          if (points.length) cameraTargetGoal = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
          world.highlightedKeys = null;
        } else {
          world.highlightedKeys = null;
          resetView();
        }
      },
      // Minimal, real variant toggle — not Phase 7's full Variant Switcher
      // (no cross-switch semantic-state preservation, no comparison mode,
      // no Interaction Intent dispatch layer). Swaps default terrain for
      // canyon-wall terrain and does a partial rodTraversalBehavior: aligns
      // the camera down the root rod's canyon axis rather than the default
      // top-down orbit. A full moving traversal path along the axis remains
      // "not yet built" per TEMPORAL_CANYON_COMPONENT_PROFILE.
      activateVariant: (nextVariantKey) => {
        world.activeVariantKey = nextVariantKey;
        const canyonActive = applyVariantVisualState(nextVariantKey);
        if (canyonActive) {
          const rootRod = world.rods.find((r) => !r.parentRodId);
          const rootPositions = rootRod ? world.stagePositions[rootRod.id] : null;
          if (rootPositions?.length >= 2) {
            const start = rootPositions[0];
            const end = rootPositions[rootPositions.length - 1];
            cameraTargetGoal = start.clone().lerp(end, 0.5);
            sphericalGoal.theta = Math.atan2(end.x - start.x, end.z - start.z) + Math.PI / 2;
            sphericalGoal.phi = 1.25;
            sphericalGoal.radius = Math.max(24, start.distanceTo(end) * 0.6);
          }
        } else {
          resetView();
        }
      },
      // Dashboard Definition View (2026-08-10 design): several variant lenses shown together over the SAME
      // converged/scoped result — "one scene, N passes" (see the plan's Non-Goals on why not N canvases),
      // implemented in animate()'s render call below. Both panes share the same user-controlled camera this
      // pass; only which mesh layer is visible differs per pane — independent per-lens camera framing is a
      // real, flagged gap, not silently claimed. Click-to-select is disabled while active (handleClick's
      // early return) since split-viewport hit-testing isn't built yet.
      activateDashboard: (dashboardId) => {
        world.dashboardActive = dashboardId || null;
        if (!dashboardId) { resize(); applyVariantVisualState(world.activeVariantKey); resetView(); }
      },
      getGateStatus: (rod, stage) => stage.gate?._result || null,
      getMoleculesForRod: (rodId) => world.moleculesByRod[rodId] || [],
      listAllAtoms: () => world.rods.flatMap((rod) => allAtomsOf(rod).map(({ atomInstance, stage }) => ({
        globalKey: keyFor(rod, atomInstance), rodType: rod.rodType, rodId: rod.id, stageName: stage.name, name: atomInstance.name, conflict: atomInstance.conflict, maturity: atomInstance.maturity,
      }))),
      listEntities: () => [...new Set(world.rods.map((r) => r.entityLabel).filter(Boolean))].map((label) => {
        const rods = world.rods.filter((rod) => rod.entityLabel === label && rod.rodType !== 'masterData');
        const revenueRod = rods.find((rod) => rod.rodType === 'revenue');
        const conflicts = rods.flatMap(allAtomsOf).filter(({ atomInstance }) => atomInstance.conflict).length;
        const currentStage = revenueRod?.stages?.findLast?.((stage) => (stage.atoms || []).some((atom) => atom.value != null))
          || revenueRod?.stages?.[0] || rods[0]?.stages?.[0];
        return {
          label,
          stage: currentStage?.name || 'Not started',
          openAmount: revenueRod?.potentialRevenueCents ? `$${(revenueRod.potentialRevenueCents / 100).toLocaleString()}` : null,
          conflictCount: conflicts,
          journeyCount: rods.length,
        };
      }),
      getRodsByEntity: (entityLabel) => world.rods.filter((r) => r.entityLabel === entityLabel),
      setHighlighted: (keys) => { world.highlightedKeys = keys ? new Set(keys) : null; },
      // Scenario Scope (DEC-001/DEC-002 design, 2026-08-10): QUERY_CONTEXT_REGISTRY is the real,
      // already-scoped "scenario a user clicks" concept — reused as-is, not a new registry. Filtering
      // the non-converged state reuses the existing highlightedKeys mechanism (already driving
      // activateWorld()'s pricing/career focus and handleOutcomeHighlight) rather than a new opacity
      // channel — one highlight system, several callers.
      applyScenarioScope: (contextId) => {
        world.activeScenarioScopeId = contextId || null;
        if (!contextId) { world.highlightedKeys = null; return; }
        const context = QUERY_CONTEXT_REGISTRY[contextId];
        if (!context) { world.highlightedKeys = null; return; }
        const relevantTags = new Set([...(context.coreTags || []), ...(context.relatedTags || [])]);
        const matches = [];
        world.rods.forEach((rod) => {
          allAtomsOf(rod).forEach(({ atomInstance }) => {
            const tags = atomInstance.magneticProperties || [];
            if (tags.some((tag) => relevantTags.has(tag))) matches.push(keyFor(rod, atomInstance));
          });
        });
        world.highlightedKeys = matches.length ? new Set(matches) : null;
      },
      // Time Scope: computeRodHash()/triangulateEntity() already accept atOffset end-to-end (lineage.js's
      // 0=present/negative=weeks-ago/positive=pending-branch convention) — this just exposes it as a
      // world-level control read by runCustomerOrbit() below, instead of only AtomPanel's per-atom slider.
      setTimeOffset: (offset) => { world.activeTimeOffset = Number.isFinite(offset) ? offset : 0; },
      getReconciliationZone: (globalKey) => {
        const zone = world.reconciliationZones[globalKey];
        if (!zone) return null;
        focusPoint(zone.ring.position, 16);
        return zone.kind === 'branch'
          ? { kind: 'reconciliation', globalKey, hostRod: zone.hostRod }
          : { kind: 'reconciliation', globalKey, masterDataRod: zone.masterDataRod, sourceRod: zone.sourceRod };
      },
      pulseToast,
      pulseViewingLabel,
    };
    apiRef.current.applyLayerVisibility(worldLayer);

    setEntityOptions(apiRef.current.listEntities());

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearInterval(convergenceProgressInterval);
      scene.traverse((o) => { o.geometry?.dispose?.(); if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.()); else o.material?.dispose?.(); });
      renderer.dispose();
      removePublishedSceneManifest('spatial-journey-world');
      apiRef.current = null;
    };
  }, [pulseToast, pulseViewingLabel]);

  // -------------------------------------------------------------------------
  // React-facing handlers
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!apiRef.current) return;
    apiRef.current.onSceneEntitySelected = (entry) => {
      if (entry.kind === 'atom') {
        apiRef.current.focusAtom(entry.globalKey);
        setSelection({ kind: 'atom', globalKey: entry.globalKey, atomInstance: entry.atomInstance, stage: entry.stage, rod: entry.rod });
      } else if (entry.kind === 'stage') {
        apiRef.current.focusStage(entry.globalKey);
        setSelection({ kind: 'stage', globalKey: entry.globalKey, stage: entry.stage, rod: entry.rod });
      } else if (entry.kind === 'reconciliation') {
        setSelection({ kind: 'reconciliation', globalKey: entry.globalKey, ...entry });
      } else if (entry.kind === 'hashnode') {
        setSelection({ kind: 'hashnode' });
      }
    };
  }, [ready]);

  const handleEnter = () => { apiRef.current?.enterWorld(); setWorldEntered(true); };
  const closePanel = () => setSelection(null);

  // Clicking a related atom/objective while scrolled down in this panel
  // used to leave the scroll position wherever it was, landing the user
  // mid-way through the NEW selection's content instead of at its top
  // (Betsy 2026-07-30: "the variant data expansion is all the way at the
  // bottom"). Reset to top whenever the selected object actually changes.
  const inspectorScrollRef = useRef(null);
  const selectionKey = selection ? `${selection.kind}::${selection.globalKey || ''}` : null;
  useEffect(() => {
    if (inspectorScrollRef.current) inspectorScrollRef.current.scrollTop = 0;
  }, [selectionKey]);
  const permissions = getPermissionProfile(role);
  // Backward-compatible candidate view: worldId is navigation context and
  // variantKey is the currently active lens. resolveWorldComposition() binds
  // both to one shared semantic/query-state reference; neither owns a data copy.
  const activeComposition = resolveWorldComposition(worldId, variantKey);
  const activeWorld = activeComposition.world;

  const handleResolve = (globalKey, source, value) => {
    const found = apiRef.current?.resolveAtomConflict(globalKey, source, value);
    if (found) {
      apiRef.current.pulseToast(`${found.atomInstance.name} resolved — ${source} adopted.`);
      setSelection({ kind: 'atom', globalKey, atomInstance: found.atomInstance, stage: found.stage, rod: found.rod });
    }
  };

  const handleRunQuery = (rod, stage) => {
    const sKey = `${rod.id}::${stage.id}`;
    apiRef.current?.runStageQuery(sKey);
    apiRef.current?.pulseToast(`Querying ${stage.name} — atoms converging from orbit.`);
  };

  const handleOutputsAgent = (rod, stage, newVersion) => {
    const result = apiRef.current?.runOutputsAgentAction(rod, stage, { newVersion });
    if (result) apiRef.current.pulseToast(result.message);
    setSelection({ kind: 'stage', globalKey: `${rod.id}::${stage.id}`, stage, rod });
  };

  const handleApproveMerge = (globalKey) => {
    const zone = apiRef.current?.approveMerge(globalKey);
    if (zone) apiRef.current.pulseToast('Merge approved — lineage preserved.');
    setSelection(null);
  };

  const handleRunCustomerOrbit = (entityLabel) => {
    setCustomerOrbitOpen(false);
    setHashProgress({ active: true, pct: 0 });
    apiRef.current?.pulseViewingLabel(`Customer Orbit — ${entityLabel}`);
    apiRef.current?.runCustomerOrbit(
      entityLabel,
      (pct) => setHashProgress({ active: true, pct }),
      (result) => {
        setHashProgress({ active: false, pct: 1 });
        setSelection({ kind: 'hashResult', result });
        apiRef.current?.pulseToast('Customer Orbit hash compiled.');
      }
    );
  };

  const handleReleaseHash = () => { apiRef.current?.releaseHash(); closePanel(); };

  const handleOutcomeHighlight = (rodHashEntry) => {
    apiRef.current?.setHighlighted(rodHashEntry.atoms.map((a) => `${rodHashEntry.rodId}::${a.atomId}`));
  };

  const openAtomIndex = () => { setAtomIndexRows(apiRef.current?.listAllAtoms() || []); setAtomIndexOpen(true); };
  const openCustomerOrbitPicker = () => { setEntityOptions(apiRef.current?.listEntities() || []); setCustomerOrbitOpen(true); };

  const handleNewLead = async ({ scenarioKey, scenarioRodType, entityLabel }) => {
    await api.createJourneyRod({ scenarioKey, label: entityLabel });
    const definition = DEAL_JOURNEY_EXPERIENCE.scenarioRodTypes.includes(scenarioRodType) ? DEAL_JOURNEY_EXPERIENCE : null;
    const spawned = definition
      ? apiRef.current?.spawnConfiguredJourney(definition, entityLabel)
      : apiRef.current?.spawnFromLead({ origin: 'internal' }, entityLabel);
    apiRef.current?.applyLayerVisibility?.(worldLayer);
    const primaryRod = spawned?.rods?.[0];
    const entryStage = primaryRod?.stages?.[0];
    if (primaryRod && entryStage) {
      apiRef.current?.focusStage(`${primaryRod.id}::${entryStage.id}`);
      setSelection({ kind: 'stage', globalKey: `${primaryRod.id}::${entryStage.id}`, stage: entryStage, rod: primaryRod });
      if (definition) setActiveDeal({ entityLabel, rod: primaryRod, definition, selectedIndex: 0 });
    }
    apiRef.current?.pulseViewingLabel(`Deal Journey — ${entityLabel}`);
    apiRef.current?.pulseToast(`Deal journey created — ${entityLabel}`);
    setNewLeadOpen(false);
  };

  const handleSelectFromIndex = (row) => {
    setAtomIndexOpen(false);
    const found = apiRef.current?.findAtomEverywhere(row.globalKey);
    if (found) setSelection({ kind: 'atom', globalKey: row.globalKey, atomInstance: found.atomInstance, stage: found.stage, rod: found.rod });
  };

  const handleObjectiveClick = (objective) => {
    // LoneTree-sourced objectives (real seeded value-creation initiatives,
    // wired 2026-07-29) have no matching atom in this world's genesis scene
    // graph — there's nothing to select in 3D, so surface the initiative's
    // own detail instead of silently doing nothing.
    if (objective.initiativeDetail !== undefined) {
      apiRef.current?.pulseToast(objective.initiativeDetail || objective.title);
      return;
    }
    if (objective.targetAtomId?.startsWith('confluence::') || objective.targetAtomId?.startsWith('masterdata-merge::')) {
      const zone = apiRef.current?.getReconciliationZone(objective.targetAtomId);
      if (zone) setSelection(zone);
      return;
    }
    const rows = apiRef.current?.listAllAtoms() || [];
    const row = rows.find((r) => r.globalKey.endsWith(`::${objective.targetAtomId}`));
    if (row) handleSelectFromIndex(row);
  };

  // Prompted real-time update action (per Betsy 2026-07-29): advances a
  // LoneTree value-creation initiative's Status one step and persists it via
  // PATCH /api/lonetree-mvp/value-creation/:id/advance, then reflects the
  // new status straight into the objectives list — no reload.
  const handleAdvanceInitiative = async (event, objective) => {
    event.stopPropagation();
    try {
      const result = await api.advanceLonetreeMvpInitiative(objective.id);
      setObjectives((prev) => prev.map((o) => (o.id === objective.id
        ? { ...o, status: result.status, complete: result.status === 'Complete', initiativeDetail: o.initiativeDetail?.replace(/Status: .+$/, `Status: ${result.status}`) }
        : o)));
      apiRef.current?.pulseToast(`${objective.title} → ${result.status}`);
    } catch (e) {
      apiRef.current?.pulseToast(e.body?.error || 'Could not advance initiative status.');
    }
  };

  return (
    <section className="sjw-shell" aria-label="Salt Basin Spatial Journey World">
      <div ref={hostRef} className="sjw-canvas-host">
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <div className="sjw-vignette" />

      {!worldEntered && (
        <div className="sjw-intro">
          <div className="sjw-intro-mark">Salt Basin Net Works</div>
          <h1>The Spatial Journey World</h1>
          <div className="sjw-tagline">Bottom Lines with a Rising Tide</div>
          <button type="button" className="sjw-enter-btn" onClick={handleEnter}>Enter the World</button>
          <div className="sjw-intro-hint">A rendered enterprise — not a dashboard</div>
        </div>
      )}

      {worldEntered && (
        <React.Fragment>
          <div className="sjw-top-bar">
            <div className="sjw-brand-mark">
              <div className="sjw-title">Salt Basin</div>
              <div className="sjw-subtitle">{activeWorld.label}</div>
            </div>
            <div className="sjw-top-controls">
              <label className="sjw-world-picker">
                <span>Context</span>
                <select value={worldId} onChange={(event) => {
                  setWorldId(event.target.value);
                  apiRef.current?.activateWorld?.(event.target.value);
                  apiRef.current?.pulseViewingLabel(getWorldDefinition(event.target.value).label);
                }}>
                  {Object.values(WORLD_REGISTRY).map((world) => <option key={world.id} value={world.id}>{world.label}</option>)}
                </select>
              </label>
              <label className="sjw-world-picker">
                <span>View Lens (candidate)</span>
                <select value={variantKey} onChange={(event) => {
                  const nextKey = event.target.value;
                  setVariantKey(nextKey);
                  apiRef.current?.activateVariant?.(nextKey);
                  apiRef.current?.pulseViewingLabel(getWorldVariantDefinition(nextKey)?.displayName || nextKey);
                }}>
                  <option value="CRYSTAL_BASIN">Crystal Basin</option>
                  <option value="TEMPORAL_CANYON">Temporal Journey Canyon</option>
                </select>
              </label>
              <label className="sjw-world-picker">
                <span>Scenario Scope</span>
                <select value={scenarioScopeId} onChange={(event) => {
                  const nextId = event.target.value || '';
                  setScenarioScopeId(nextId);
                  apiRef.current?.applyScenarioScope?.(nextId || null);
                  apiRef.current?.pulseViewingLabel(nextId ? `Scenario scope — ${QUERY_CONTEXT_REGISTRY[nextId]?.label}` : 'Scenario scope cleared');
                }}>
                  <option value="">All (no scope)</option>
                  {Object.values(QUERY_CONTEXT_REGISTRY).map((context) => (
                    <option key={context.contextId} value={context.contextId}>{context.label}</option>
                  ))}
                </select>
              </label>
              <label className="sjw-world-picker sjw-time-scope" title="Illustrative history — a deterministic reconstruction, not a replay of recorded events">
                <span>Time Scope · illustrative</span>
                <input
                  type="range" className="sjw-lineage-slider" min={-10} max={2} step={1} value={timeOffset}
                  onChange={(event) => {
                    const next = parseInt(event.target.value, 10);
                    setTimeOffset(next);
                    apiRef.current?.setTimeOffset?.(next);
                  }}
                />
                <span className="sjw-time-scope-readout">
                  {timeOffset === 0 ? 'Present' : timeOffset < 0 ? `${Math.abs(timeOffset)} wks ago` : `Pending branch ${timeOffset}`}
                </span>
              </label>
              <button
                type="button"
                className={`sjw-icon-btn${dashboardId ? ' sjw-role-observer' : ''}`}
                title="Show multiple view lenses together over the same result (view-only — selection is disabled while active)"
                onClick={() => {
                  const definitions = listDashboardDefinitions();
                  const next = dashboardId ? '' : (definitions[0]?.dashboardId || '');
                  setDashboardId(next);
                  apiRef.current?.activateDashboard?.(next || null);
                  apiRef.current?.pulseViewingLabel(next ? `Dashboard view — ${getDashboardDefinition(next)?.label}` : 'Dashboard view exited');
                }}
              >
                {dashboardId ? 'Exit Dashboard View' : 'Dashboard View'}
              </button>
              <button type="button" className="sjw-icon-btn" onClick={openCustomerOrbitPicker}>Customer Orbit</button>
              <button type="button" className={`sjw-icon-btn${role === 'observer' ? ' sjw-role-observer' : ''}`} onClick={() => setRole((r) => (r === 'reviewer' ? 'observer' : 'reviewer'))}>
                Role: {permissions.label}
              </button>
              <button type="button" className="sjw-icon-btn sjw-primary-nav" onClick={() => setNewLeadOpen(true)}>Configure Deal</button>
              <button type="button" className="sjw-icon-btn" onClick={openAtomIndex}>Atom Index</button>
              <button type="button" className="sjw-icon-btn" onClick={() => setLegendOpen((v) => !v)}>Legend</button>
              <button type="button" className="sjw-icon-btn" onClick={() => setDevStatsOpen((v) => !v)}>Stats</button>
            </div>
          </div>

          <div className="sjw-instructions">Drag to orbit · Pinch or scroll to zoom · Click a crystal to inspect · 0 resets view</div>

          <div className="sjw-layer-controls" aria-label="World detail">
            <span>World detail</span>
            {[['journey', 'Journey only'], ['structures', 'Formed structures'], ['all', 'All evidence']].map(([value, label]) => (
              <button key={value} type="button" className={worldLayer === value ? 'active' : ''} onClick={() => setWorldLayer(value)}>{label}</button>
            ))}
          </div>

          {hashProgress.active && (
            <div className="sjw-hash-progress">
              <div className="sjw-hash-label"><span>Compiling data hash…</span><span>{Math.round(hashProgress.pct * 100)}%</span></div>
              <div className="sjw-hash-track"><div className="sjw-hash-fill" style={{ width: `${hashProgress.pct * 100}%` }} /></div>
            </div>
          )}

          {viewingLabel && <div className="sjw-viewing-label sjw-visible"><span className="sjw-viewing-eyebrow">Viewing</span>{viewingLabel}</div>}

          <div className="sjw-zoom-controls">
            <button type="button" className="sjw-zoom-btn" aria-label="Zoom in" onClick={() => apiRef.current?.zoomBy(-8)}>+</button>
            <button type="button" className="sjw-zoom-btn" aria-label="Zoom out" onClick={() => apiRef.current?.zoomBy(8)}>&minus;</button>
            <button type="button" className="sjw-zoom-btn" aria-label="Reset view" onClick={() => apiRef.current?.resetView()}>⟲</button>
          </div>

          <div className="sjw-objectives-panel">
            <h4>Enterprise Objectives</h4>
            <ul className="sjw-objectives-list">
              {objectives.map((o) => (
                <li key={o.id} className={`sjw-objective${o.complete ? ' sjw-objective-done' : ''}`} onClick={() => handleObjectiveClick(o)}>
                  <span className="sjw-obj-check">{o.complete ? '✓' : '○'}</span>
                  <span className="sjw-obj-title">{o.title}</span>
                  {o.initiativeDetail !== undefined && !o.complete && (
                    <button type="button" className="sjw-obj-advance" onClick={(e) => handleAdvanceInitiative(e, o)} title="Advance status">↷</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {selection && (
            <div className="sjw-inspector-panel sjw-panel-open" ref={inspectorScrollRef}>
              <button type="button" className="sjw-panel-close" onClick={closePanel}>&times;</button>
              <div className="sjw-inspector-body">
                {selection.kind === 'atom' && (
                  <AtomPanel
                    selection={selection}
                    role={role}
                    onResolve={handleResolve}
                    onRunOutputsAgent={handleOutputsAgent}
                    maturityModel={maturityModel}
                  />
                )}
                {selection.kind === 'stage' && (
                  <StagePanel selection={selection} role={role} onRunQuery={handleRunQuery} onRunOutputsAgent={handleOutputsAgent} apiRef={apiRef} maturityModel={maturityModel} />
                )}
                {selection.kind === 'reconciliation' && (
                  <ReconciliationPanel selection={selection} role={role} onApprove={handleApproveMerge} />
                )}
                {selection.kind === 'hashResult' && (
                  <HashResultPanel result={selection.result} onHighlight={handleOutcomeHighlight} onRelease={handleReleaseHash} />
                )}
                {selection.kind === 'hashnode' && (
                  <div>
                    <div className="sjw-eyebrow">QUERIED DATA HASH</div>
                    <h3>No compound query yet</h3>
                    <p className="sjw-agent-line">Run "Customer Orbit" to triangulate rods into a single queried data hash.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`sjw-dev-stats${devStatsOpen ? '' : ' sjw-hidden'}`}>
            FPS {devStats.fps}<br />Draw calls {devStats.meshes}<br />Logical atoms {devStats.atoms}
          </div>

          {legendOpen && <LegendPanel onClose={() => setLegendOpen(false)} maturityModel={maturityModel} />}
          {atomIndexOpen && <AtomIndexOverlay rows={atomIndexRows} onSelect={handleSelectFromIndex} onClose={() => setAtomIndexOpen(false)} />}
          {customerOrbitOpen && <CustomerOrbitPicker entities={entityOptions} onRun={handleRunCustomerOrbit} onClose={() => setCustomerOrbitOpen(false)} />}
          {newLeadOpen && <DealConfigForm onSubmit={handleNewLead} onClose={() => setNewLeadOpen(false)} />}
          {activeDeal && <DealJourneyPanel activeDeal={activeDeal} onClose={() => setActiveDeal(null)} onSelectStage={(index) => {
            const stage = activeDeal.rod.stages[index];
            apiRef.current?.focusStage(`${activeDeal.rod.id}::${stage.id}`);
            setSelection({ kind: 'stage', globalKey: `${activeDeal.rod.id}::${stage.id}`, stage, rod: activeDeal.rod });
            setActiveDeal((current) => ({ ...current, selectedIndex: index }));
          }} />}

          {toast && <div className="sjw-toast sjw-toast-visible">{toast}</div>}
        </React.Fragment>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// HUD sub-components
// ---------------------------------------------------------------------------

function AtomPanel({ selection, role, onResolve, onRunOutputsAgent, maturityModel = MATURITY_MODEL }) {
  const { atomInstance, stage, rod, globalKey } = selection;
  const bands = maturityModel.bands;
  const atomBand = bandForMaturity(atomInstance.maturity, bands);
  const lineage = getAtomLineage(atomInstance);
  const [offset, setOffset] = useState(0);
  const [lineageOpen, setLineageOpen] = useState(false);
  const value = lineageValueAtOffset(lineage, offset);
  const conflictInfo = atomInstance.conflict ? describeAtomConflict(atomInstance, rod, { role }) : null;
  const maxOffset = lineage.pendingBranches.length;
  const stratum = classifyStratum(atomInstance);
  const basin = basinFor(rod.rodType);
  const contributionRatio = atomInstance.evidence?.length ? computeCrossDomainContributionRatio(atomInstance, rod.rodType) : null;
  const contributionLevel = contributionRatio !== null ? contributionRatioBand(contributionRatio) : null;

  return (
    <div>
      <div className="sjw-eyebrow">{rod.templateName || rod.rodType} · {stage.name}</div>
      <h3>{atomInstance.name}</h3>
      <div className="sjw-meta-row">
        <span
          className={`sjw-badge ${atomInstance.conflict ? 'sjw-badge-risk' : `sjw-badge-${maturityToneFor(atomInstance.maturity, bands)}`}`}
          style={atomInstance.conflict ? undefined : { borderColor: atomBand?.color }}
        >
          {atomInstance.conflict ? 'Conflict' : `${atomBand?.label || 'Maturity'} · ${pctLabel(atomInstance.maturity)}`}
        </span>
        {' '}
        <span className="sjw-badge sjw-badge-mid" title={stratum.note}>{stratum.label}</span>
        {contributionLevel && contributionLevel !== 'normal' && (
          <React.Fragment>{' '}<span className="sjw-badge sjw-badge-risk">Cross-domain contribution: {contributionLevel} ({Math.round(contributionRatio * 100)}%)</span></React.Fragment>
        )}
      </div>
      {conflictInfo ? (
        <React.Fragment>
          <p className="sjw-agent-line">{conflictInfo.message}</p>
          <div className="sjw-evidence-list">
            {(atomInstance.evidence || []).map((ev) => {
              const inBasin = !basin || basin.expectedSources.includes(ev.source);
              return (
                <div key={ev.source} className="sjw-evidence-card">
                  <div className="sjw-evidence-source">{ev.source}{!inBasin && <em className="sjw-text-risk"> · outside {basin?.name}</em>}</div>
                  <div className="sjw-evidence-value">{ev.value}</div>
                  {role === 'reviewer' ? (
                    <button type="button" className="sjw-btn sjw-btn-primary" onClick={() => onResolve(globalKey, ev.source, ev.value)}>Adopt as authoritative</button>
                  ) : (
                    <button type="button" className="sjw-btn sjw-btn-disabled" disabled>Propose only — switch to Reviewer to commit</button>
                  )}
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ) : (
        <p className="sjw-agent-line">Definition is stable. {atomInstance.meaning}</p>
      )}

      {atomInstance.atomId === 'a-personal-email' && (() => {
        const access = describeModuleAccess(rod, 'personal');
        return (
          <p className="sjw-query-note">
            {access.available ? 'Personal-scope modules (site config, financial management, resume outputs) are unlocked.' : access.reason}
          </p>
        );
      })()}

      <div className="sjw-lineage-block">
        {!lineageOpen ? (
          <button type="button" className="sjw-btn sjw-btn-secondary" onClick={() => setLineageOpen(true)}>View full lineage &amp; time slider</button>
        ) : (
          <React.Fragment>
            <div className="sjw-eyebrow" style={{ marginTop: 2 }}>LINEAGE · {atomInstance.name}</div>
            <input type="range" className="sjw-lineage-slider" min={-10} max={maxOffset} step={1} value={offset} onChange={(e) => setOffset(parseInt(e.target.value, 10))} />
            <div className="sjw-lineage-scale"><span>10 wks ago</span><span>Present</span><span>{maxOffset ? 'Pending branch' : ''}</span></div>
            <div className={`sjw-lineage-readout${value.future ? ' sjw-lineage-future' : ''}`}>
              <div className="sjw-lineage-week-tag">{value.tag}{value.future ? ' · OPEN DECISION' : ''}</div>
              <div className="sjw-lineage-value">Maturity {pctLabel(value.maturity)} — {value.note}</div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function StagePanel({ selection, role, onRunQuery, onRunOutputsAgent, apiRef, maturityModel = MATURITY_MODEL }) {
  const { stage, rod } = selection;
  const gate = stage.gate;
  const gateResult = gate ? apiRef.current?.getGateStatus(rod, stage) : null;
  const agentGate = gate ? describeGateStatus(gateResult, rod) : null;
  const outputsAvailability = gate ? describeOutputsAgentAvailability(gateResult, { role }) : null;

  return (
    <div>
      <div className="sjw-eyebrow">{rod.templateName || rod.rodType}</div>
      <h3>{stage.name}</h3>
      <div className="sjw-meta-row">
        <span
          className={`sjw-badge sjw-badge-${maturityToneFor(stage.maturity, maturityModel.bands)}`}
          style={{ borderColor: bandForMaturity(stage.maturity, maturityModel.bands)?.color }}
        >
          Stage maturity {bandForMaturity(stage.maturity, maturityModel.bands)?.label} · {pctLabel(stage.maturity)}
        </span>
      </div>
      <p className="sjw-agent-line">{stage.atoms.length} metadata atom{stage.atoms.length === 1 ? '' : 's'} live as master data, contextually owned by this stage.</p>
      <button type="button" className="sjw-btn sjw-btn-primary" onClick={() => onRunQuery(rod, stage)}>Run Query — pull master data for this stage</button>

      {gate && (
        <div className="sjw-gate-block">
          <div className="sjw-eyebrow" style={{ marginTop: 12 }}>GATE · {gate.label}</div>
          <p className="sjw-agent-line">{agentGate?.message}</p>
          {outputsAvailability?.available ? (
            <React.Fragment>
              <button type="button" className="sjw-btn sjw-btn-primary" onClick={() => onRunOutputsAgent(rod, stage, false)}>Outputs Agent — generate draft output</button>
              <button type="button" className="sjw-btn sjw-btn-secondary" onClick={() => onRunOutputsAgent(rod, stage, true)}>Regenerate as new version</button>
            </React.Fragment>
          ) : (
            <p className="sjw-query-note">{outputsAvailability?.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ReconciliationPanel({ selection, role, onApprove }) {
  const { globalKey } = selection;
  const isMasterData = globalKey.startsWith('masterdata-merge::');
  const hostRod = selection.hostRod;
  const masterDataRod = selection.masterDataRod;
  const sourceRod = selection.sourceRod;
  const proposal = isMasterData
    ? describeMergeProposal(masterDataRod, sourceRod, { role })
    : { message: `Historical Lineage Agent: the ${hostRod?.tributary?.name} Tributary is contributing at Confluence. Accepted and rejected contributions, decisions, and evidence remain in lineage.`, canApprove: getPermissionProfile(role).canApproveMerges };
  const status = isMasterData ? masterDataRod?.status : hostRod?.tributary?.status;

  return (
    <div>
      <div className="sjw-eyebrow">HISTORICAL LINEAGE AGENT</div>
      <h3>Reconciliation Zone</h3>
      <div className="sjw-meta-row"><span className="sjw-badge sjw-badge-mid">Status: {status}</span></div>
      <p className="sjw-agent-line">{proposal.message}</p>
      {status !== 'merged' && (
        proposal.canApprove ? (
          <button type="button" className="sjw-btn sjw-btn-primary" onClick={() => onApprove(globalKey)}>Approve merge</button>
        ) : (
          <button type="button" className="sjw-btn sjw-btn-disabled" disabled>Pending — switch to Reviewer to approve</button>
        )
      )}
    </div>
  );
}

function ElementRelevanceBreakdown({ atom, relevanceEntry, contextLabel }) {
  const definitions = METRIC_DEFINITION_REGISTRY;
  const rows = describeRelevanceComponents(relevanceEntry);
  const sentence = generateElementBusinessMeaning({ atomName: atom.name, contextLabel, relevanceEntry });
  return (
    <div className="sjw-gate-block" onClick={(e) => e.stopPropagation()}>
      <div className="sjw-eyebrow" style={{ marginTop: 12 }}>Why This Element Converged</div>
      <p className="sjw-agent-line">{definitions.QUERY_RELEVANCE.displayName}: {relevanceEntry.score.toFixed(2)} · {relevanceEntry.band.label}</p>
      {rows.length > 0 && (
        <div className="sjw-evidence-list">
          {rows.map((row) => (
            <div key={row.key} className="sjw-evidence-card">
              <div className="sjw-evidence-source">{row.label}</div>
              <div className="sjw-evidence-value">+{row.contribution.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
      <p className="sjw-query-note">{sentence}</p>
    </div>
  );
}

function HashResultPanel({ result, onHighlight, onRelease }) {
  const interaction = QUERY_INTERACTION_REGISTRY.customerOrbit;
  const definitions = METRIC_DEFINITION_REGISTRY;
  const contextLabel = QUERY_CONTEXT_REGISTRY[interaction.contextId]?.label || interaction.shippedTerm;
  const anyExceeded = (result.divergences || []).some((d) => d.boundaryExceeded);
  const formatMetric = (metric) => metric ? metric.score.toFixed(2) : interaction.unavailableLabel;
  const [selectedAtomKey, setSelectedAtomKey] = useState(null);
  return (
    <div>
      <div className="sjw-eyebrow">{interaction.eyebrow}</div>
      <h3>{interaction.activatedLabel} — {result.entityLabel}</h3>
      <p className="sjw-agent-line">{interaction.summaryTemplate}</p>
      <div className="sjw-evidence-list">
        <div className="sjw-outcome-card"><div className="sjw-evidence-source">Related journeys</div><div className="sjw-outcome-value">{result.perRod.length}</div></div>
        <div className="sjw-outcome-card"><div className="sjw-evidence-source">Journey fields in view</div><div className="sjw-outcome-value">{result.perRod.reduce((sum, rod) => sum + rod.atoms.length, 0)}</div></div>
        <div className="sjw-outcome-card"><div className="sjw-evidence-source">Items requiring review</div><div className="sjw-outcome-value">{result.perRod.reduce((sum, rod) => sum + rod.atoms.filter((atom) => atom.conflict).length, 0)}</div></div>
      </div>
      <div className="sjw-evidence-list">
        {result.perRod.map((r) => {
          const scores = (r.queryRelevance || []).map((entry) => entry.score);
          const relevance = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
          const selectedAtomId = selectedAtomKey && selectedAtomKey.startsWith(`${r.rodId}::`) ? selectedAtomKey.slice(`${r.rodId}::`.length) : null;
          const selectedAtom = selectedAtomId ? r.atoms.find((a) => a.atomId === selectedAtomId) : null;
          const selectedRelevance = selectedAtomId ? r.queryRelevance?.find((e) => e.atomId === selectedAtomId) : null;
          return (
          <div key={r.rodId} className="sjw-outcome-card">
            <div onClick={() => onHighlight(r)}>
              <div className="sjw-evidence-source">{r.rodType}</div>
              <div className="sjw-outcome-value">{definitions.QUERY_RELEVANCE.displayName}: {relevance === null ? interaction.unavailableLabel : relevance.toFixed(2)}</div>
              <div className="sjw-outcome-sources">{r.atoms.length} data elements · {interaction.actions.highlight}</div>
            </div>
            {r.queryRelevance && (
              <div>
                {r.atoms.map((atom) => {
                  const entry = r.queryRelevance.find((e) => e.atomId === atom.atomId);
                  const atomKey = `${r.rodId}::${atom.atomId}`;
                  return (
                    <div key={atomKey} className="sjw-map-row" onClick={(e) => { e.stopPropagation(); setSelectedAtomKey(atomKey === selectedAtomKey ? null : atomKey); }}>
                      <span>{atom.name}</span>
                      <span>{entry ? entry.score.toFixed(2) : interaction.unavailableLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedAtom && selectedRelevance && (
              <ElementRelevanceBreakdown atom={selectedAtom} relevanceEntry={selectedRelevance} contextLabel={contextLabel} />
            )}
          </div>
        );})}
      </div>

      {result.divergences?.length > 0 && (
        <div className="sjw-gate-block">
          <div className="sjw-eyebrow" style={{ marginTop: 12 }}>{interaction.divergence.eyebrow}</div>
          <p className="sjw-query-note">{interaction.divergence.explanation}</p>
          {anyExceeded && <p className="sjw-agent-line" style={{ borderLeftColor: 'var(--sb-risk-critical)' }}>{interaction.divergence.boundaryWarning}</p>}
          <div className="sjw-evidence-list">
            {result.divergences.map((d) => (
              <div key={`${d.rodTypeA}-${d.rodTypeB}`} className={`sjw-evidence-card${d.boundaryExceeded ? ' sjw-badge-risk' : ''}`}>
                <div className="sjw-evidence-source">{d.rodTypeA} ↔ {d.rodTypeB}</div>
                <div className="sjw-evidence-value">{definitions.ROD_COHERENCE.displayName}: {d.coherence.score.toFixed(2)} · {d.classification}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="sjw-btn sjw-btn-secondary" onClick={onRelease}>{interaction.actions.release}</button>
    </div>
  );
}

function LegendPanel({ onClose, maturityModel = MATURITY_MODEL }) {
  return (
    <div className="sjw-legend-panel">
      <button type="button" className="sjw-panel-close" onClick={onClose}>&times;</button>
      <h4>Legend</h4>
      <div className="sjw-legend-section"><b>Evidence structures</b>
        <div className="sjw-shape-legend">
          <div><i className="sjw-shape sjw-shape-atom" /><span>Atom</span><small>One governed field</small></div>
          <div><i className="sjw-shape sjw-shape-molecule" /><span>Molecule</span><small>Bounded compound</small></div>
          <div><i className="sjw-shape sjw-shape-mineral" /><span>Mineral</span><small>Persistent structure</small></div>
          <div><i className="sjw-shape sjw-shape-conflict" /><span>Conflict</span><small>Needs resolution</small></div>
        </div>
      </div>
      <div className="sjw-legend-section"><b>Shape</b>
        <p>Bipyramid — atom · Hex drum — stage anchor · Wire icosahedron — molecule shell · Large icosahedron — Customer-360 hash node · Torus — reconciliation zone · Cone pin — home anchor · Light column — gate beacon</p>
      </div>
      <div className="sjw-legend-section"><b>Color</b>
        <p>Terracotta — Revenue rod · Steel teal — Customer rod · Dusty mauve — Member rod · Risk red — unresolved conflict, overrides rod color</p>
      </div>
      <div className="sjw-legend-section"><b>Maturity bands</b>
        <p>Facet count, metalness and roughness all scale with maturity: an unresolved atom is a rough, low-poly bipyramid, a trusted one a polished many-faceted crystal. Bands come from the Maturity Model config, so this legend always shows what is actually rendering.</p>
        <ul className="sjw-legend-bands">
          {maturityModel.bands.map((band) => (
            <li key={band.label}>
              <span className="sjw-legend-swatch" style={{ background: band.color }} />
              {band.label} <span className="sjw-legend-range">{Math.round(band.min * 100)}–{Math.round(band.max * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="sjw-legend-section"><b>Dimension</b>
        <p>Height reflects completeness · thickness/glow reflects evidence strength or instability.</p>
      </div>
      <div className="sjw-legend-section"><b>Composition</b>
        <p>Governed Evidence Unit — one governed assertion · Contribution Affinity — a bonded pair's capacity to contribute to a shared state, not either atom's own maturity · Semantic State Composition — a converged composition of atoms + bonds.</p>
      </div>
      <div className="sjw-legend-section"><b>Propagation</b>
        <p>Data Basin — the bounded set of expected source systems for a rod type · State Density — a badge showing whether an atom has settled (Bedrock/Sediment) or is still Suspended/Water/Surface · State Pycnocline — the point where evidence density changes sharply as deeper evidence is incorporated · Cross-domain contribution — the share of an atom's evidence from outside its expected basin.</p>
      </div>
      <div className="sjw-legend-section"><b>Divergence</b>
        <p>Each rod is a Projection State Vector. Heterosemantic State Divergence measures how far two correlated but non-equivalent rods (same entity) have separated — shown after Customer Orbit — as Axial Divergence (lifecycle position) and Density Divergence (degree of settlement), with a rate/acceleration and a Reconciliation Boundary Exceedance warning if divergence exceeds the Correlated State Envelope.</p>
      </div>
    </div>
  );
}

function AtomIndexOverlay({ rows, onSelect, onClose }) {
  return (
    <div className="sjw-map-overlay sjw-map-open">
      <button type="button" className="sjw-panel-close" onClick={onClose}>&times;</button>
      <h4>Metadata Atom Index — accessible / text-based view</h4>
      <div>
        {rows.map((row) => (
          <div key={row.globalKey} className="sjw-map-row" onClick={() => onSelect(row)}>
            <span className="sjw-map-rod">{row.rodType}</span>
            <span className="sjw-map-stage">{row.stageName}</span>
            <span>{row.name}</span>
            <span className={`sjw-map-maturity${row.conflict ? ' sjw-text-risk' : ''}`}>{row.conflict ? 'CONFLICT' : pctLabel(row.maturity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerOrbitPicker({ entities, onRun, onClose }) {
  return (
    <div className="sjw-compound-overlay sjw-compound-open">
      <button type="button" className="sjw-panel-close" onClick={onClose}>&times;</button>
      <h4>Customer Orbit</h4>
      <p className="sjw-compound-sub">Pick a real entity — a deal, an org, or a person. Every rod connected to it via Member-Organization branches converges into one triangulated hash.</p>
      <div className="sjw-compound-list">
        {entities.map((entity) => (
          <div key={entity.label || entity} className="sjw-customer-card" onClick={() => onRun(entity.label || entity)}>
            <div className="sjw-customer-card-head"><span>{entity.label || entity}</span><b>{entity.stage || 'Not started'}</b></div>
            <div className="sjw-customer-card-meta">
              <span>{entity.journeyCount || 0} related journeys</span>
              {entity.openAmount && <span>{entity.openAmount} open</span>}
              <span className={entity.conflictCount ? 'risk' : ''}>{entity.conflictCount || 0} conflicts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealJourneyPanel({ activeDeal, onSelectStage, onClose }) {
  const { definition, selectedIndex, entityLabel } = activeDeal;
  const stage = definition.stages[selectedIndex];
  return (
    <div style={{ position: 'absolute', zIndex: 32, left: 18, right: 18, bottom: 18, maxHeight: '46vh', overflowY: 'auto', border: '1px solid var(--sb-teal-400)', borderRadius: 16, background: 'rgba(20,25,31,.96)', boxShadow: '0 -12px 42px rgba(0,0,0,.38)', padding: '1rem 1.1rem', color: 'var(--sb-cream)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div><div className="sjw-eyebrow">Deal Journey · {entityLabel}</div><h3 style={{ margin: '0.25rem 0 0' }}>{stage.title} <span style={{ color: 'var(--sb-gold)', fontSize: '.8rem' }}>· {stage.short}</span></h3></div>
        <button type="button" className="sjw-panel-close" style={{ position: 'static' }} onClick={onClose}>&times;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${definition.stages.length}, minmax(92px, 1fr))`, gap: 8, overflowX: 'auto', padding: '0.9rem 0' }}>
        {definition.stages.map((item, index) => <button key={item.key} type="button" onClick={() => onSelectStage(index)} style={{ border: index === selectedIndex ? '1px solid var(--sb-gold)' : '1px solid rgba(218,211,206,.22)', borderRadius: 10, background: index === selectedIndex ? 'rgba(196,132,58,.18)' : 'rgba(255,255,255,.035)', color: 'var(--sb-cream)', padding: '.6rem', textAlign: 'left', cursor: 'pointer' }}><span style={{ display: 'block', color: item.source === 'live' ? 'var(--sb-teal-300)' : 'var(--sb-dusty)', fontSize: '.62rem', letterSpacing: '.08em' }}>{String(item.id).padStart(2, '0')} · {item.source === 'live' ? 'SOURCED' : 'TEMPLATE'}</span><strong style={{ fontSize: '.76rem' }}>{item.title}</strong></button>)}
      </div>
      <p style={{ color: 'var(--sb-dusty)', fontSize: '.78rem', margin: '0 0 .8rem', maxWidth: 980 }}>{stage.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, .8fr) minmax(320px, 1.2fr)', gap: 18 }}>
        <div><div className="sjw-eyebrow">Metrics</div>{stage.metrics.length ? stage.metrics.map((metric) => <div key={metric.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '.35rem 0', borderBottom: '1px dashed rgba(218,211,206,.14)' }}><span style={{ color: 'var(--sb-dusty)', fontSize: '.74rem' }}>{metric.label}</span><strong style={{ color: metric.flag === 'red' ? 'var(--sb-rose)' : 'var(--sb-cream)', fontSize: '.76rem' }}>{metric.value}</strong></div>) : <span style={{ color: 'var(--sb-dusty)', fontSize: '.74rem' }}>Populates as stage data is entered.</span>}</div>
        <div><div className="sjw-eyebrow">Journey fields</div>{stage.fields.map((field) => <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '.35rem 0', borderBottom: '1px dashed rgba(218,211,206,.14)' }}><span style={{ color: 'var(--sb-dusty)', fontSize: '.74rem' }}>{field.label}</span><strong style={{ color: field.placeholder ? 'var(--sb-dusty)' : 'var(--sb-cream)', fontStyle: field.placeholder ? 'italic' : 'normal', fontSize: '.76rem', textAlign: 'right' }}>{field.value}</strong></div>)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.85rem' }}><button type="button" className="sjw-btn" disabled={selectedIndex === 0} onClick={() => onSelectStage(selectedIndex - 1)}>← Prev Stage</button><button type="button" className="sjw-btn sjw-btn-primary" disabled={selectedIndex === definition.stages.length - 1} onClick={() => onSelectStage(selectedIndex + 1)}>Next Stage →</button></div>
    </div>
  );
}

function DealConfigForm({ onSubmit, onClose }) {
  const [entityLabel, setEntityLabel] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [scenarioKey, setScenarioKey] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getJourneyCatalog()
      .then(({ scenarios: rows }) => {
        setScenarios(rows || []);
        setScenarioKey(rows?.[0]?.scenario_key || '');
      })
      .catch((e) => setError(e.body?.error || 'Sign in to configure a deal journey.'));
  }, []);

  const submit = async () => {
    if (!scenarioKey) {
      setError('Choose a journey definition.');
      return;
    }
    if (!entityLabel.trim()) {
      setError('Enter a deal name before entering the journey.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const scenario = scenarios.find((item) => item.scenario_key === scenarioKey);
      await onSubmit({ scenarioKey, scenarioRodType: scenario?.rod_type, entityLabel: entityLabel.trim() });
    } catch (e) {
      setError(e.body?.error || 'Could not create the deal journey.');
      setSaving(false);
    }
  };

  return (
    <div className="sjw-compound-overlay sjw-compound-open">
      <button type="button" className="sjw-panel-close" onClick={onClose}>&times;</button>
      <h4>Configure Deal Journey</h4>
      <p className="sjw-compound-sub">Choose a configured journey definition. Its stages, gates, fields, business rules, and maturity evaluation come from the editable journey catalog.</p>
      <div className="sjw-new-lead-form">
        <label>Deal name
          <input value={entityLabel} onChange={(e) => setEntityLabel(e.target.value)} placeholder="e.g. Acme Corp acquisition" />
        </label>
        <label>Journey definition
          <select value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)}>
            {scenarios.map((scenario) => <option key={scenario.scenario_key} value={scenario.scenario_key}>{scenario.label}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="sjw-form-error">{error}</p>}
      <button type="button" className="sjw-btn sjw-btn-primary" disabled={saving} onClick={submit}>{saving ? 'Creating…' : 'Enter deal journey'}</button>
    </div>
  );
}

function NewLeadForm({ onSubmit, onClose }) {
  const [origin, setOrigin] = useState('internal');
  const [emailKind, setEmailKind] = useState('work');
  const [capacity, setCapacity] = useState('orgBuyer');
  const [entityLabel, setEntityLabel] = useState('');

  const submit = () => {
    const label = entityLabel.trim() || `New Lead — ${new Date().toLocaleTimeString()}`;
    const leadContext = origin === 'internal' ? { origin: 'internal' } : { origin: 'externalIntake', emailKind, capacity: emailKind === 'personal' ? 'directConsumer' : capacity };
    onSubmit(leadContext, label);
  };

  return (
    <div className="sjw-compound-overlay sjw-compound-open">
      <button type="button" className="sjw-panel-close" onClick={onClose}>&times;</button>
      <h4>+ New Lead</h4>
      <p className="sjw-compound-sub">Submit a lead and watch the genesis rule engine route it into rods in real time.</p>
      <div className="sjw-new-lead-form">
        <label>Entity label
          <input value={entityLabel} onChange={(e) => setEntityLabel(e.target.value)} placeholder="e.g. Acme Corp — renewal" />
        </label>
        <label>Origin
          <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="internal">Internal user</option>
            <option value="externalIntake">External / website intake</option>
          </select>
        </label>
        {origin === 'externalIntake' && (
          <React.Fragment>
            <label>Email kind
              <select value={emailKind} onChange={(e) => setEmailKind(e.target.value)}>
                <option value="work">Work email</option>
                <option value="personal">Personal email</option>
              </select>
            </label>
            {emailKind === 'work' && (
              <label>Capacity
                <select value={capacity} onChange={(e) => setCapacity(e.target.value)}>
                  <option value="orgBuyer">Org buyer</option>
                  <option value="orgInfluencer">Org influencer</option>
                </select>
              </label>
            )}
          </React.Fragment>
        )}
      </div>
      <button type="button" className="sjw-btn sjw-btn-primary" onClick={submit}>Route this lead</button>
    </div>
  );
}
