// Career Agent Orbit World (2026-08-06, Phase 2 — Career Placement Agents
// vertical slice). Anchored around the same baseline crystal design system
// every user-facing crystal in the product already shares
// (src/lib/crystalGeometry.js's CRYSTAL_VARIANTS + buildGemMesh) — per
// explicit direction: user "world" views are variants of one crystal
// family, orbited by 3D objects, never bespoke geometry invented per panel.
// This world's anchor is the 'agentHub' variant; agents orbit as person
// figures (their own approved shape, distinct from data crystals — agents
// are actors, not data); tracked opportunities orbit as buildGemMesh() gems,
// colored/sized by their real score. Selecting an orbit object animates a
// brief dolly-toward-it ("entering" the object) before the side panel opens.
//
// Deliberately does NOT touch or extend SpatialJourneyWorld.jsx — assessed
// and rejected as disproportionate risk for this phase (see git history);
// this is a second, small, purpose-built scene for a shape (agent org chart
// + scored opportunity ring) that engine doesn't support, not a duplicate.
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { hasWebGL } from './SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights, buildGemMesh } from '../lib/crystalGeometry.js';

function personFigure(color, scale, glow) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.92, roughness: 0.3, metalness: 0.1, emissive: color, emissiveIntensity: glow, flatShading: true });
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.2 * scale, 0), mat);
  head.position.y = 0.82 * scale;
  g.add(head);
  const torso = new THREE.Mesh(new THREE.ConeGeometry(0.27 * scale, 0.66 * scale, 6, 1, true), mat.clone());
  torso.position.y = 0.36 * scale;
  g.add(torso);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.38 * scale, 0.07 * scale, 6), mat.clone());
  g.add(base);
  g.userData.mesh = torso;
  return g;
}

function labelSprite(text, color) {
  const scale = 4;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${11 * scale}px Jost, sans-serif`;
  const w = ctx.measureText(text).width + 16 * scale;
  c.width = w;
  c.height = 26 * scale;
  ctx.font = `500 ${11 * scale}px Jost, sans-serif`;
  ctx.fillStyle = color || 'rgba(245,240,232,0.92)';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const aspect = c.width / c.height;
  sprite.scale.set(aspect * 0.85, 0.85, 1);
  sprite.renderOrder = 999;
  return sprite;
}

const AGENT_RING_RADIUS = 3.4;
const OPPORTUNITY_RING_RADIUS = 5.6;

/**
 * Props:
 *   agents          — [{ key, name, tier, reportsToAgentId, id, pipeline }]
 *   opportunities    — [{ id, metadata:{jobTitle}, score:{score}|null }]
 *   selectedAgentKey / selectedOpportunityId — current selection (string/number|null)
 *   onSelectAgent(key) / onSelectOpportunity(id) — click callbacks
 *   height           — canvas height in px (default 440)
 */
export default function CareerAgentOrbitWorld({ agents = [], opportunities = [], selectedAgentKey = null, selectedOpportunityId = null, onSelectAgent, onSelectOpportunity, height = 440 }) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);

  // Mount: create the renderer/scene/camera/anchor crystal/controls once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL()) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1013, 0.01);
    const width = host.clientWidth || 640;
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x0a1013);
    host.appendChild(renderer.domElement);

    addCrystalLights(scene, THREE);
    scene.add(new THREE.AmbientLight(0x3a4550, 0.35));

    // The world anchor — every user world is a variant of the same crystal family.
    const anchorGroup = new THREE.Group();
    const anchorHandles = CRYSTAL_VARIANTS.agentHub(anchorGroup, THREE);
    scene.add(anchorGroup);

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);

    let orbitAngle = 0.4;
    let orbitElev = 0.36;
    let orbitRadius = 13;
    let dollyTarget = null; // { x, y, z, radius } — brief "enter the object" animation
    const cameraTarget = new THREE.Vector3(0, 0.3, 0);
    let pickables = [];

    function render() {
      if (dollyTarget) {
        cameraTarget.lerp(dollyTarget.point, 0.12);
        orbitRadius += (dollyTarget.radius - orbitRadius) * 0.12;
        if (Math.abs(orbitRadius - dollyTarget.radius) < 0.15) dollyTarget = null;
      } else {
        cameraTarget.lerp(new THREE.Vector3(0, 0.3, 0), 0.05);
      }
      camera.position.x = cameraTarget.x + orbitRadius * Math.cos(orbitAngle) * Math.cos(orbitElev);
      camera.position.z = cameraTarget.z + orbitRadius * Math.sin(orbitAngle) * Math.cos(orbitElev);
      camera.position.y = cameraTarget.y + orbitRadius * Math.sin(orbitElev) + 1.2;
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
    }

    // Unified pointer controls — drag to orbit, tap (movement<8px, duration<600ms) to select.
    const raycaster = new THREE.Raycaster();
    let dragStart = null;
    let didDrag = false;
    function ndcFromClient(cx, cy) {
      const rect = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    }
    function onPointerDown(e) {
      renderer.domElement.setPointerCapture?.(e.pointerId);
      dragStart = { x: e.clientX, y: e.clientY, t: performance.now() };
      didDrag = false;
    }
    function onPointerMove(e) {
      if (!dragStart || e.buttons === 0) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (Math.abs(e.clientX - dragStart.x) > 5 || Math.abs(e.clientY - dragStart.y) > 5) didDrag = true;
      if (didDrag) {
        orbitAngle -= dx * 0.006;
        orbitElev = Math.max(0.08, Math.min(1.1, orbitElev + dy * 0.004));
        dragStart = { x: e.clientX, y: e.clientY, t: dragStart.t };
      }
    }
    function onPointerUp(e) {
      if (dragStart) {
        const dt = performance.now() - dragStart.t;
        const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
        if (!didDrag && moved < 8 && dt < 600) {
          const ndc = ndcFromClient(e.clientX, e.clientY);
          raycaster.setFromCamera(ndc, camera);
          const hits = raycaster.intersectObjects(pickables.map((p) => p.obj), false);
          if (hits.length) {
            const found = pickables.find((p) => p.obj === hits[0].object);
            if (found) {
              const worldPos = new THREE.Vector3();
              found.obj.getWorldPosition(worldPos);
              dollyTarget = { point: worldPos, radius: 5.5 };
              if (found.kind === 'agent') onSelectAgent?.(found.id);
              if (found.kind === 'opportunity') onSelectOpportunity?.(found.id);
            }
          }
        }
      }
      dragStart = null;
      didDrag = false;
    }
    function onWheel(e) {
      e.preventDefault();
      orbitRadius = Math.max(5, Math.min(30, orbitRadius + e.deltaY * 0.02));
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    let rafId;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      anchorGroup.rotation.y = t * 0.12;
      anchorHandles.spin.forEach((mesh, i) => { mesh.rotation.z += (i % 2 ? -0.01 : 0.012); });
      contentGroup.children.forEach((c) => {
        if (c.userData?.spin !== undefined) c.rotation.y += c.userData.spin * 0.01;
      });
      render();
    }
    animate();

    function handleResize() {
      const w = host.clientWidth || 640;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);

    engineRef.current = { contentGroup, setPickables: (p) => { pickables = p; } };

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
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
  }, [height]);

  // Data changes: rebuild the orbit rings without recreating the renderer/anchor.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const { contentGroup } = engine;
    while (contentGroup.children.length) contentGroup.remove(contentGroup.children[0]);
    const pickables = [];

    // Inner ring: agent hierarchy (tier 0 leads, tier 1 orbits around its lead).
    const roots = agents.filter((a) => a.tier === 0 || !a.reportsToAgentId);
    roots.forEach((root, ri) => {
      const rootAngle = (ri / Math.max(roots.length, 1)) * Math.PI * 2;
      const rootColor = root.pipeline === 'commercial' ? 0xc4843a : root.pipeline === 'career' ? 0x6b8f71 : 0x4a7c8e;
      const rootPos = new THREE.Vector3(Math.cos(rootAngle) * AGENT_RING_RADIUS, 0, Math.sin(rootAngle) * AGENT_RING_RADIUS);
      const rootFigure = personFigure(rootColor, selectedAgentKey === root.key ? 1.3 : 1.05, selectedAgentKey === root.key ? 0.6 : 0.4);
      rootFigure.position.copy(rootPos);
      rootFigure.userData.spin = 0.4;
      contentGroup.add(rootFigure);
      const rootLabel = labelSprite(root.name, '#f5f0e8');
      rootLabel.position.set(rootPos.x, 1.4, rootPos.z);
      contentGroup.add(rootLabel);
      pickables.push({ obj: rootFigure.userData.mesh, kind: 'agent', id: root.key });

      const children = agents.filter((a) => a.reportsToAgentId === root.id);
      children.forEach((child, ci) => {
        const childAngle = rootAngle + ((ci + 1) / (children.length + 1) - 0.5) * 0.9;
        const cx = Math.cos(childAngle) * (AGENT_RING_RADIUS + 1.5);
        const cz = Math.sin(childAngle) * (AGENT_RING_RADIUS + 1.5);
        const childColor = child.pipeline === 'commercial' ? 0xc4843a : child.pipeline === 'career' ? 0x6b8f71 : 0x4a7c8e;
        const selected = selectedAgentKey === child.key;
        const childFigure = personFigure(childColor, selected ? 0.95 : 0.72, selected ? 0.55 : 0.3);
        childFigure.position.set(cx, 0, cz);
        childFigure.userData.spin = 0.6 + ci * 0.05;
        contentGroup.add(childFigure);
        pickables.push({ obj: childFigure.userData.mesh, kind: 'agent', id: child.key });

        const curve = new THREE.LineCurve3(new THREE.Vector3(rootPos.x, 0.45, rootPos.z), new THREE.Vector3(cx, 0.32, cz));
        contentGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.016, 5, false), new THREE.MeshBasicMaterial({ color: childColor, transparent: true, opacity: 0.4 })));
      });
    });

    // Outer ring: tracked opportunities as real gem crystals (buildGemMesh —
    // the same "live state, not a named variant" node builder every other
    // metadata-orbit surface uses), sized/lit by their real score.
    opportunities.forEach((opp, i) => {
      const angle = (i / Math.max(opportunities.length, 1)) * Math.PI * 2 + 0.3;
      const x = Math.cos(angle) * OPPORTUNITY_RING_RADIUS;
      const z = Math.sin(angle) * OPPORTUNITY_RING_RADIUS;
      const scored = !!opp.score;
      const scoreFrac = scored ? Math.max(0.15, opp.score.score / 100) : 0.2;
      const selected = selectedOpportunityId === opp.id;
      const gem = buildGemMesh(THREE, {
        color: scored ? 0xc4843a : 0x785d69,
        size: (selected ? 0.34 : 0.24) * (0.7 + scoreFrac * 0.6),
        metalness: scored ? 0.35 : 0.2,
        roughness: 0.3,
      });
      const holder = new THREE.Group();
      holder.add(gem);
      holder.position.set(x, 0, z);
      holder.userData.spin = 0.5;
      holder.userData.mesh = gem;
      if (!scored) {
        const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.42, 0)), new THREE.LineBasicMaterial({ color: 0x785d69, transparent: true, opacity: 0.5 }));
        holder.add(cage);
      } else {
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xc4843a, transparent: true, opacity: 0.12 });
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5 + scoreFrac * 0.3, 12, 12), glowMat);
        holder.add(glow);
      }
      contentGroup.add(holder);
      pickables.push({ obj: gem, kind: 'opportunity', id: opp.id });
      const label = labelSprite((opp.metadata?.jobTitle || 'Opportunity').slice(0, 22) + (scored ? ` · ${Math.round(opp.score.score)}` : ''), '#e8dcc4');
      label.position.set(x, 0.9, z);
      contentGroup.add(label);
    });

    engine.setPickables(pickables);
  }, [agents, opportunities, selectedAgentKey, selectedOpportunityId]);

  if (!hasWebGL()) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b877c', fontSize: 12, background: '#0a1013', borderRadius: 10 }}>
        This device/browser does not support WebGL — showing list view only.
      </div>
    );
  }

  return <div ref={hostRef} style={{ height, borderRadius: 10, overflow: 'hidden' }} />;
}
