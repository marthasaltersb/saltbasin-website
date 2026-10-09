// Generic graph world engine: one Salt Basin crystal world for ANY dataset.
//
// It draws a graph contract and knows nothing about what the data is:
//
//   graph = { root: { label, sub },
//             nodes: [{ id, label, sub, status, statusLabel, colorVar, weight 0..1, progress 0..1|null,
//                       active, href, satellites: [{ id, label, catLabel, colorVar, pending, href }] }],
//             unmapped?: [string] }
//
// A new world (opportunities, Career Master, outputs...) supplies an adapter
// that produces this graph; the engine is not forked. Geometry comes ONLY from
// src/lib/crystalGeometry.js: addCrystalLights, CRYSTAL_VARIANTS.signature (the
// "sun"), buildGemMesh (nodes and satellites), buildRiverParticles /
// advanceRiverParticles (a working node), projectToScreen (labels) and
// buildEnvironment (the water). Colours are read from CSS variables named by
// the graph (colorVar), so light and dark themes need no engine change.
//
// Interaction: drag to orbit, wheel / two-finger pinch to zoom, hover tooltip,
// click a node to fly in (the caller opens the same drill-down layer), Pause
// motion, reduced motion = camera cuts and no spin. Screen positions of every
// node are published on the stage as data-crystals (CSS pixels) for tests and
// assistive tooling.
import {
  addCrystalLights, CRYSTAL_VARIANTS, buildGemMesh, buildRiverParticles, advanceRiverParticles, projectToScreen, buildEnvironment,
} from '../crystalGeometry.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function createGraphWorld({ stage, labelsEl, tipEl, environment = 'underwater', reducedMotion = false, onOpen, cssVar, tipText }) {
  const THREE = await import('three');
  const col = (v) => new THREE.Color(cssVar(v) || '#888888');
  let reduce = !!reducedMotion;
  let paused = false;
  let graph = null; let objs = {}; let rivers = []; let focusId = null;
  const pickables = []; const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  const cam = { theta: 0.6, phi: 1.12, dist: 24, target: new THREE.Vector3(), want: { dist: 17, target: new THREE.Vector3() } };
  const pointers = new Map(); let drag = null; let pinch = null; let disposed = false; let raf = 0; let lastPublish = 0;
  const clock = new THREE.Clock();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.prepend(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D world. Every crystal is also listed in the panel beside it.');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  addCrystalLights(scene, THREE);

  const sun = new THREE.Group();
  CRYSTAL_VARIANTS.signature(sun, THREE);
  sun.userData = { kind: 'sun', href: null };
  sun.children.forEach((m) => { m.userData = sun.userData; });
  scene.add(sun);

  const env = buildEnvironment(environment, scene, THREE, { palette: { waterMid: col('--rt-water-mid'), sand: col('--rt-sand') }, keepClear: 31 });

  const dispose = (o) => o.traverse((x) => { x.geometry?.dispose?.(); (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => m?.dispose?.()); });
  const radiusFor = (n) => Math.max(6.5, n * 0.62);

  function build(g) {
    Object.values(objs).forEach((o) => { scene.remove(o.group); dispose(o.group); });
    rivers.forEach((r) => { scene.remove(r); dispose(r); });
    rivers = []; objs = {}; pickables.length = 0; sun.children.forEach((m) => pickables.push(m));
    const n = g.nodes.length; const R = radiusFor(n);
    g.nodes.forEach((node, i) => {
      const a = (i / Math.max(1, n)) * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.cos(a) * R, Math.sin(a * 2) * 0.6, Math.sin(a) * R);
      const size = 0.32 + node.weight * 0.5;
      const tc = col(node.colorVar);
      const gem = buildGemMesh(THREE, { color: tc, size, metalness: 0.15, roughness: 0.45 });
      gem.material.emissive = tc.clone(); gem.material.emissiveIntensity = 0.45; gem.material.transparent = true;
      gem.userData = { kind: 'node', node };
      pickables.push(gem); group.add(gem);
      // White edge lines: separation from the water.
      gem.add(new THREE.LineSegments(new THREE.EdgesGeometry(gem.geometry), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 })));
      const ringR = size + 0.32;
      const track = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: col('--rt-line'), transparent: true, opacity: 0.9 }));
      track.rotation.x = Math.PI / 2; group.add(track);
      if (node.progress != null && node.progress > 0) {
        const arc = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.05, 8, 96, Math.PI * 2 * Math.min(1, node.progress)), new THREE.MeshBasicMaterial({ color: 0xC4843A, transparent: true }));
        arc.rotation.x = Math.PI / 2; group.add(arc);
      }
      const sats = new THREE.Group(); const sCount = node.satellites.length;
      node.satellites.forEach((sat, j) => {
        const sc = col(sat.colorVar);
        const m = buildGemMesh(THREE, { color: sc, size: 0.085, metalness: 0.1, roughness: 0.45 });
        m.material.emissive = sc.clone(); m.material.emissiveIntensity = 0.4; m.material.transparent = true;
        const ang = (j / Math.max(1, sCount)) * Math.PI * 2; const rr = ringR + 0.35 + (j % 3) * 0.16;
        m.position.set(Math.cos(ang) * rr, ((j % 5) - 2) * 0.12, Math.sin(ang) * rr);
        m.userData = { kind: 'sat', sat, node };
        if (sat.pending) {   // a pending (approval-required) change is drawn as a ghost: translucent with a dashed edge
          m.material.opacity = 0.35; m.material.depthWrite = false; m.userData.ghost = true;
          const dash = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineDashedMaterial({ color: 0xC4843A, dashSize: 0.03, gapSize: 0.02, transparent: true }));
          dash.computeLineDistances(); m.add(dash);
        }
        pickables.push(m); sats.add(m);
      });
      group.add(sats);
      scene.add(group);
      objs[node.id] = { group, gem, sats, node, baseY: group.position.y };
      if (node.active) {   // a stream of bubbles from the centre
        const r = buildRiverParticles(THREE, { from: new THREE.Vector3(0, 0, 0), to: group.position, color: 0xE8FBFF, count: 70, curveLift: 0.9 });
        r.material.size = 0.16; scene.add(r); rivers.push(r);
      }
    });
    env.setPalette({ waterMid: col('--rt-water-mid'), sand: col('--rt-sand') });
    labelsEl.innerHTML = `<div class="rt-wl rt-wl-sun" data-id="__sun"><b>${esc(g.root.label)}</b>${esc(g.root.sub)}</div>`
      + g.nodes.map((nd) => `<div class="rt-wl" data-id="${esc(nd.id)}"><b>${esc(nd.label)}</b>${nd.progress != null ? `${Math.round(nd.progress * 100)}% passing` : esc(nd.statusLabel)}</div>`).join('');
    applyFocus();
  }

  function applyFocus() {
    const f = focusId && objs[focusId];
    Object.values(objs).forEach((o) => {
      const on = !f || o === f;
      o.group.traverse((x) => { if (x.material) x.material.opacity = (on ? 1 : 0.18) * (x.userData?.ghost ? 0.35 : 1); });
      o.sats.scale.setScalar(o === f ? 1.6 : 1);
    });
    labelsEl.querySelectorAll('.rt-wl').forEach((el) => el.classList.toggle('rt-dim', !!f && el.dataset.id !== focusId));
    if (f) { cam.want.target.copy(f.group.position); cam.want.dist = 5.2; } else {
      const R = radiusFor(graph?.nodes.length || 10) + 1.8;
      const half = Math.tan((camera.fov * Math.PI) / 360);
      cam.want.target.set(0, -0.4, 0); cam.want.dist = Math.max(18, (R / half / Math.min(1, camera.aspect || 1)) * 1.12);
    }
    if (reduce) { cam.target.copy(cam.want.target); cam.dist = cam.want.dist; }   // reduced motion: a cut, not a flight
  }

  function placeCamera() {
    const k = reduce ? 1 : 0.08;
    cam.target.lerp(cam.want.target, k); cam.dist += (cam.want.dist - cam.dist) * k;
    camera.position.set(cam.target.x + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta), cam.target.y + cam.dist * Math.cos(cam.phi), cam.target.z + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta));
    camera.lookAt(cam.target);
  }

  const v3 = new THREE.Vector3();
  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05); const t = clock.elapsedTime;
    const still = reduce || paused;
    if (!still) {
      sun.rotation.y += dt * 0.18; sun.position.y = Math.sin(t * 0.5) * 0.12;
      Object.values(objs).forEach((o, i) => { o.gem.rotation.y += dt * 0.5; o.sats.rotation.y += dt * (0.25 + (i % 3) * 0.05); o.group.position.y = o.baseY + Math.sin(t * 0.8 + i * 1.3) * 0.18; });
      env.update(t, dt, camera);
      rivers.forEach((r) => advanceRiverParticles(r, dt));
      if (!drag && !pinch && !focusId) cam.theta += dt * 0.02;
    }
    placeCamera();
    renderer.render(scene, camera);
    const w = stage.clientWidth; const h = stage.clientHeight;
    const narrow = w < 640;
    const published = [];
    labelsEl.querySelectorAll('.rt-wl').forEach((el) => {
      const isSun = el.dataset.id === '__sun';
      const o = isSun ? sun : objs[el.dataset.id]?.group; if (!o) return;
      const p = projectToScreen(THREE, o.position, camera, w, h);
      // Phone: crowded labels hide; names live in the panel list. The sun and a focused node keep theirs.
      const hide = !p || p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40 || (narrow && !isSun && el.dataset.id !== focusId);
      el.style.display = hide ? 'none' : '';
      if (!hide) { el.style.left = `${p.x}px`; el.style.top = `${p.y + (isSun ? 30 : el.dataset.id === focusId ? 70 : 14)}px`; }
      if (!isSun && p) published.push({ id: el.dataset.id, x: Math.round(p.x), y: Math.round(p.y), visible: !hide || narrow });
    });
    if (t - lastPublish > 0.25) { lastPublish = t; stage.dataset.crystals = JSON.stringify(published); stage.dataset.world = JSON.stringify({ environment, nodes: Object.keys(objs).length, satellites: pickables.filter((p) => p.userData?.kind === 'sat').length, rivers: rivers.length, focusId, paused, reducedMotion: reduce }); }
  }

  function pick(e) {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickables, false).find((h) => h.object.visible);
    return hit ? hit.object.userData : null;
  }
  const dist2 = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  function onDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    if (pointers.size === 2) { pinch = { d: dist2(), dist: cam.want.dist }; drag = null; } else drag = { x: e.clientX, y: e.clientY, moved: 0 };
  }
  function onMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) { cam.want.dist = Math.max(3, Math.min(60, pinch.dist * (pinch.d / Math.max(1, dist2())))); return; }
    if (drag) {
      cam.theta += (e.clientX - drag.x) * 0.006; cam.phi = Math.max(0.55, Math.min(1.42, cam.phi - (e.clientY - drag.y) * 0.004));
      drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; return;
    }
    const u = pick(e);
    canvas.classList.toggle('rt-pointing', !!u && u.kind !== 'sun');
    if (!u || u.kind === 'sun') { tipEl.style.display = 'none'; return; }
    const r = stage.getBoundingClientRect();
    tipEl.innerHTML = tipText(u);
    tipEl.style.display = 'block'; tipEl.style.left = `${Math.max(0, Math.min(e.clientX - r.left + 14, r.width - 270))}px`; tipEl.style.top = `${e.clientY - r.top + 14}px`;
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const wasDrag = drag && drag.moved > 6; drag = null;
    if (wasDrag) return;
    const u = pick(e); if (!u) return;
    if (u.kind === 'node') onOpen(u.node.href); else if (u.kind === 'sat') onOpen(u.sat.href); else if (u.kind === 'sun') onOpen(null);
  }
  const onLeave = () => { tipEl.style.display = 'none'; };
  const onWheel = (e) => { e.preventDefault(); cam.want.dist = Math.max(3, Math.min(60, cam.want.dist * (1 + Math.sign(e.deltaY) * 0.1))); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  const ro = new ResizeObserver(() => {
    const w = stage.clientWidth; const h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); applyFocus();
  });
  ro.observe(stage);
  frame();

  return {
    setGraph(g) { graph = g; build(g); },
    focus(id) { focusId = id && objs[id] ? id : null; applyFocus(); },
    setReducedMotion(v) { reduce = !!v; applyFocus(); },
    setPaused(v) { paused = !!v; },
    isPaused: () => paused,
    refreshColors() { if (graph) build(graph); },
    state: () => ({ nodes: Object.keys(objs).length, satellites: pickables.filter((p) => p.userData?.kind === 'sat').length, rivers: rivers.length, focusId, paused, reduce }),
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
      Object.values(objs).forEach((o) => dispose(o.group)); rivers.forEach(dispose); dispose(sun); env.dispose();
      renderer.dispose(); canvas.remove();
    },
  };
}
