import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

// Ported from the spatial-viz "Salt Basin Command Center" standalone HTML
// artifact into a real admin tab. The canvas engine (camera/projection/hit
// testing/drawing) is a straight port of that artifact's vanilla JS, adapted
// to live inside a flex pane instead of the full viewport. The "Integrations"
// group of buildings is the only part backed by real data — it comes from
// GET /api/oauth/connections (the same endpoint ProfileHub's IntegrationHub
// uses), so connected/disconnected state here always matches reality.
// "Your platforms" and "Brand & storefront" are curated: Betsy's own product
// lineup isn't modeled as rows anywhere in the DB, so those stay static.

const PLATFORM_NODES = [
  { name: 'HandoverOS', kind: 'Q2R Intelligence Layer', tag: 'Revenue leakage intelligence for PE-backed SaaS. Your flagship.', x: 0, z: 2, h: 27, fp: 9, group: 'platforms', health: 0.9, vel: 0.85, peak: 14, flagship: true },
  { name: 'The Salter Momentum', kind: 'Methodology', tag: 'Understanding, Rendering, Manifesting. The master framework.', x: -11, z: 12, h: 19, fp: 8, group: 'platforms', health: 0.82, vel: 0.4, peak: 10 },
  { name: 'BestyStaff', kind: 'AI proxy agent', tag: 'Your personal agent: intake, routing, follow-through.', x: 11, z: 12, h: 16, fp: 7, group: 'platforms', health: 0.7, vel: 0.7, peak: 15 },
  { name: 'CardWise', kind: 'Debt health tool', tag: 'Credit-card management and decline-prevention concept.', x: 0, z: 23, h: 14, fp: 7, group: 'platforms', health: 0.55, vel: 0.5, peak: 13 },
];
const BRAND_NODES = [
  { name: 'Salt Basin Net Works', kind: 'Command HQ', tag: 'The consulting practice and brand home base.', x: -28, z: -6, h: 21, fp: 8, group: 'brand', health: 0.88, vel: 0.6, peak: 11 },
  { name: 'POP 3D Decor', kind: 'Storefront', tag: '3D-printed boho home decor. Pampas, not florals.', x: -33, z: 10, h: 12, fp: 7, group: 'brand', health: 0.85, vel: 0.55, peak: 20 },
  { name: 'Devotional Blog', kind: 'Writing', tag: 'Faith-and-3D-printing storytelling with SEO.', x: -23, z: 21, h: 11, fp: 6, group: 'brand', health: 0.75, vel: 0.35, peak: 21 },
];
const STATIC_LINKS = [
  ['HandoverOS', 'Salt Basin Net Works'], ['HandoverOS', 'The Salter Momentum'],
  ['CardWise', 'HandoverOS'], ['BestyStaff', 'HandoverOS'],
  ['The Salter Momentum', 'Salt Basin Net Works'],
  ['POP 3D Decor', 'Devotional Blog'], ['Salt Basin Net Works', 'POP 3D Decor'],
];
const GROUPS = {
  platforms: { label: 'Your platforms', rgb: [196, 132, 58] },
  brand: { label: 'Brand & storefront', rgb: [176, 106, 78] },
  connected: { label: 'Integrations', rgb: [74, 124, 142] },
};

function buildIntegrationNodes(connections, available) {
  const items = [
    ...connections.map((c) => ({ ...c, connectedFlag: true })),
    ...available.map((a) => ({ ...a, connectedFlag: false })),
  ];
  items.sort((a, b) => {
    if (a.connectedFlag !== b.connectedFlag) return a.connectedFlag ? -1 : 1;
    return (a.label || a.provider).localeCompare(b.label || b.provider);
  });
  const cols = 4, spacingX = 13, spacingZ = 14, originX = 22, originZ = -22;
  return items.map((it, i) => ({
    name: it.label || it.provider,
    kind: it.connectedFlag ? 'Connected integration' : 'Available integration',
    tag: it.description || (it.connectedFlag ? `Connected as ${it.connectedAs || it.label}.` : 'Not connected yet.'),
    x: originX + (i % cols) * spacingX,
    z: originZ + Math.floor(i / cols) * spacingZ,
    h: it.connectedFlag ? 15 : 10,
    fp: 6,
    group: 'connected',
    health: it.connectedFlag ? 0.85 : 0.3,
    vel: it.connectedFlag ? 0.6 : 0.15,
    peak: (i * 17 + 6) % 24,
    provider: it.provider,
    connected: it.connectedFlag,
  }));
}

const S = {
  root: { flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sb-navy-deep)' },
  toolbar: { display: 'flex', gap: '0.6rem', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)', flexShrink: 0, flexWrap: 'wrap' },
  label: { fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' },
  input: { padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 2, color: 'var(--sb-cream)', fontSize: '0.78rem', outline: 'none', width: 170 },
  chip: (on) => ({ padding: '0.28rem 0.7rem', borderRadius: 20, fontSize: '0.68rem', letterSpacing: '0.04em', cursor: 'pointer', border: on ? '0.5px solid var(--sb-gold)' : '0.5px solid rgba(139,155,174,0.3)', background: on ? 'var(--sb-gold)' : 'none', color: on ? 'var(--sb-navy-deep)' : 'var(--sb-dusty)' }),
  stat: { marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--sb-dusty)' },
  scene: { flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', background: '#12202E' },
  canvas: { position: 'absolute', inset: 0, display: 'block', touchAction: 'none', cursor: 'grab' },
  tip: { position: 'absolute', zIndex: 7, pointerEvents: 'none', opacity: 0, transform: 'translate(-50%,-120%)', transition: 'opacity 0.14s', background: 'rgba(18,32,46,0.92)', border: '0.5px solid rgba(196,132,58,0.5)', padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap', fontSize: 13, color: 'var(--sb-cream)' },
  timeline: { position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 6, width: 'min(520px,86%)', display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(18,32,46,0.86)', border: '0.5px solid rgba(245,240,232,0.12)', borderRadius: 12, padding: '10px 16px' },
  play: { background: 'var(--sb-gold)', color: 'var(--sb-navy-deep)', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 12, flexShrink: 0 },
  hour: { fontSize: 12, color: 'var(--sb-cream)', minWidth: 56, textAlign: 'right' },
  drawer: (open) => ({ position: 'absolute', top: 0, right: 0, height: '100%', width: 320, maxWidth: '88%', zIndex: 12, background: 'rgba(21,33,49,0.94)', borderLeft: '0.5px solid rgba(196,132,58,0.35)', transform: open ? 'translateX(0)' : 'translateX(102%)', transition: 'transform 0.4s cubic-bezier(0.22,0.61,0.36,1)', padding: '32px 26px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }),
  drawerClose: { position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', color: 'rgba(245,240,232,0.5)', fontSize: 18, cursor: 'pointer' },
  drawerEyebrow: { fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 14 },
  drawerName: { fontFamily: 'var(--sb-font-display)', fontWeight: 600, fontSize: 30, lineHeight: 1.08, color: 'var(--sb-cream)', marginBottom: 4 },
  drawerKind: { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-teal)', marginBottom: 18 },
  rule: { height: '0.5px', background: 'linear-gradient(90deg,var(--sb-gold),transparent)', marginBottom: 18 },
  drawerTag: { fontSize: 14, lineHeight: 1.6, color: 'rgba(245,240,232,0.82)', marginBottom: 20 },
  metrics: { display: 'flex', gap: 10, marginBottom: 'auto' },
  metric: { flex: 1, background: 'rgba(245,240,232,0.05)', borderRadius: 8, padding: '10px 11px' },
  metricVal: { fontSize: 17, fontWeight: 500, color: 'var(--sb-cream)' },
  metricLabel: { fontSize: 11, color: 'rgba(245,240,232,0.5)', marginTop: 2 },
  actionBtn: { fontSize: 13, letterSpacing: '0.04em', background: 'var(--sb-gold)', color: 'var(--sb-navy-deep)', border: 'none', fontWeight: 500, padding: '13px 20px', borderRadius: 8, cursor: 'pointer', width: '100%', marginTop: 20 },
  actionDone: { fontSize: 13, letterSpacing: '0.04em', background: 'var(--sb-teal)', color: 'var(--sb-cream)', border: 'none', fontWeight: 500, padding: '13px 20px', borderRadius: 8, width: '100%', marginTop: 20, textAlign: 'center' },
  note: { fontSize: 12, color: 'var(--sb-dusty)', marginTop: 20, lineHeight: 1.5 },
  empty: { textAlign: 'center', color: 'var(--sb-dusty)', fontSize: '0.85rem', marginTop: '3rem', lineHeight: 1.7 },
};

function neighborsOf(links, name) {
  const set = new Set();
  links.forEach(([a, b]) => { if (a === name) set.add(b); if (b === name) set.add(a); });
  return set;
}

export default function CommandCenterPanel() {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState(null);
  const [links, setLinks] = useState(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [totalIntegrations, setTotalIntegrations] = useState(0);

  const [search, setSearch] = useState('');
  const [layerHealth, setLayerHealth] = useState(false);
  const [layerLinks, setLayerLinks] = useState(false);
  const [layerGroups, setLayerGroups] = useState(false);
  const [filter, setFilter] = useState('all');
  const [hour, setHour] = useState(13);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(null);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const engineApiRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getOAuthConnections();
        if (cancelled) return;
        const integrationNodes = buildIntegrationNodes(data.connections || [], data.available || []);
        const allNodes = [...PLATFORM_NODES, ...BRAND_NODES, ...integrationNodes];
        const allLinks = [...STATIC_LINKS];
        if (integrationNodes.some((n) => n.name === 'Salesforce')) allLinks.push(['HandoverOS', 'Salesforce']);
        if (integrationNodes.some((n) => n.name === 'Microsoft')) allLinks.push(['BestyStaff', 'Microsoft']);
        setNodes(allNodes);
        setLinks(allLinks);
        setConnectedCount((data.connections || []).length);
        setTotalIntegrations((data.connections || []).length + (data.available || []).length);
      } catch (err) {
        toast.error('Could not load integration status — showing platforms only.');
        setNodes([...PLATFORM_NODES, ...BRAND_NODES]);
        setLinks([...STATIC_LINKS]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // The canvas engine mounts once the node/link data is ready. It's a closed
  // imperative loop (camera, hit-testing, drawing) — React only owns the
  // toolbar controls and the detail drawer; everything else is DOM refs.
  useEffect(() => {
    if (!nodes || !links) return;
    const container = containerRef.current, canvas = canvasRef.current, tip = tipRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    const FACE = [26, 40, 56], GOLD = [217, 164, 94], TEAL = [107, 158, 174], CREAM = [245, 240, 232];
    const H_RED = [192, 69, 58], H_MID = [196, 132, 58], H_GRN = [59, 158, 110];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
    function norm(a) { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
    function shade(c, k) { return [clamp(c[0] * k), clamp(c[1] * k), clamp(c[2] * k)]; }
    function rgba(c, a) { return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`; }
    function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function healthColor(h) { return h < 0.5 ? mixc(H_RED, H_MID, h / 0.5) : mixc(H_MID, H_GRN, (h - 0.5) / 0.5); }
    const LIGHT = norm([0.45, 0.82, 0.35]);

    let dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    function resize() {
      const rect = container.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(resize);

    const cam = { radius: 108, theta: Math.PI * 0.25, phi: 0.72, minR: 46, maxR: 180, minPhi: 0.2, maxPhi: 1.24 };
    let target = [0, 6, 4], focusTo = [0, 6, 4], camPos = [0, 0, 0], RIGHT = [1, 0, 0], UPV = [0, 1, 0], FWD = [0, 0, 1], FOCAL = 700;
    function updateCam() {
      const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
      camPos = [target[0] + cam.radius * sp * Math.sin(cam.theta), target[1] + cam.radius * cp, target[2] + cam.radius * sp * Math.cos(cam.theta)];
      FWD = norm(sub(target, camPos)); RIGHT = norm(cross(FWD, [0, 1, 0])); UPV = cross(RIGHT, FWD); FOCAL = Math.min(W, H) * 0.92;
    }
    function project(p) {
      const r = sub(p, camPos), cz = dot(r, FWD);
      if (cz < 2) return { vis: false, depth: cz };
      return { x: W / 2 + dot(r, RIGHT) / cz * FOCAL, y: H / 2 - dot(r, UPV) / cz * FOCAL, depth: cz, vis: true };
    }

    const state = { health: false, links: false, groups: false, filter: 'all', hour: 13, playing: false, highlight: null };

    const buildings = [], byName = {};
    nodes.forEach((a) => {
      const b = { app: a, curH: a.h, accentCur: (a.connected ? TEAL : GOLD).slice(), alpha: 1, edgeA: 0.5, edgeW: 1, lift: 0, beacon: 0.6, act: 0, _P: null, _depth: 0, _hull: null };
      buildings.push(b); byName[a.name] = b;
    });

    const groupMeta = {};
    Object.keys(GROUPS).forEach((k) => {
      const m = buildings.filter((b) => b.app.group === k);
      if (!m.length) return;
      let cx = 0, cz = 0, mh = 0;
      m.forEach((b) => { cx += b.app.x; cz += b.app.z; mh = Math.max(mh, b.app.h); });
      groupMeta[k] = { cx: cx / m.length, cz: cz / m.length, mh };
    });
    let groupOp = 0;

    let pointerPx = { x: -9999, y: -9999 }, hovered = null;

    function activity(a) { const d0 = Math.abs(state.hour - a.peak); const d = Math.min(d0, 24 - d0); return Math.max(0.14, Math.exp(-(d * d) / 32)); }
    function neighbors(name) { const o = {}; links.forEach((p) => { if (p[0] === name) o[p[1]] = 1; if (p[1] === name) o[p[0]] = 1; }); return o; }
    function passesFilter(a) {
      if (state.filter === 'platforms') return a.group === 'platforms';
      if (state.filter === 'risk') return a.health < 0.65;
      return true;
    }

    function hull(pts) {
      const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      let n = p.length, k = 0; const r = [];
      for (let i = 0; i < n; i++) { while (k >= 2 && crs(r[k - 2], r[k - 1], p[i]) <= 0) k--; r[k++] = p[i]; }
      for (let i = n - 2, t = k + 1; i >= 0; i--) { while (k >= t && crs(r[k - 2], r[k - 1], p[i]) <= 0) k--; r[k++] = p[i]; }
      r.length = k - 1; return r;
    }
    function crs(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    function inPoly(px, py, poly) {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    }

    function cornersOf(b) {
      const a = b.app, hw = a.fp / 2, hd = a.fp / 2, x = a.x, z = a.z, h = b.curH, y0 = b.lift;
      return [[x - hw, y0, z - hd], [x + hw, y0, z - hd], [x + hw, y0, z + hd], [x - hw, y0, z + hd], [x - hw, y0 + h, z - hd], [x + hw, y0 + h, z - hd], [x + hw, y0 + h, z + hd], [x - hw, y0 + h, z + hd]];
    }
    const FACES = [{ i: [4, 5, 6, 7], n: [0, 1, 0] }, { i: [0, 1, 5, 4], n: [0, 0, -1] }, { i: [1, 2, 6, 5], n: [1, 0, 0] }, { i: [2, 3, 7, 6], n: [0, 0, 1] }, { i: [3, 0, 4, 7], n: [-1, 0, 0] }];

    function hitTest() {
      let best = null, bd = 1e9;
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        if (!b._hull || b._depth >= 1e9) continue;
        if (inPoly(pointerPx.x, pointerPx.y, b._hull) && b._depth < bd) { bd = b._depth; best = b; }
      }
      return best;
    }

    let selectedLocal = null;
    function focusOn(node) { focusTo = node ? [node.x, 6, node.z] : [0, 6, 4]; }

    function pp(e) {
      const t = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    let dragging = false, lastX = 0, lastY = 0, moved = 0, autoRotate = !reduce;
    function onDown(e) { const p = pp(e); dragging = true; moved = 0; lastX = p.x; lastY = p.y; autoRotate = false; }
    function onMove(e) {
      const p = pp(e); pointerPx.x = p.x; pointerPx.y = p.y;
      if (dragging) {
        const dx = p.x - lastX, dy = p.y - lastY; moved += Math.abs(dx) + Math.abs(dy);
        cam.theta -= dx * 0.005; cam.phi = Math.max(cam.minPhi, Math.min(cam.maxPhi, cam.phi - dy * 0.005));
        lastX = p.x; lastY = p.y;
      }
    }
    function onUp() {
      if (dragging && moved < 6) {
        const b = hitTest();
        if (b) { selectedLocal = b.app; setSelected(b.app); focusOn(b.app); }
      }
      dragging = false;
    }
    function onWheel(e) { e.preventDefault(); cam.radius = Math.max(cam.minR, Math.min(cam.maxR, cam.radius * (1 + e.deltaY * 0.001))); }
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    function drawGround() {
      const lo = -160, hi = 160, st = 20;
      ctx.lineWidth = 1;
      for (let g = lo; g <= hi; g += st) { seg([g, 0, lo], [g, 0, hi]); seg([lo, 0, g], [hi, 0, g]); }
    }
    function seg(a, b) {
      const pa = project(a), pb = project(b);
      if (!pa.vis || !pb.vis) return;
      ctx.strokeStyle = 'rgba(58,80,102,0.28)'; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
    function lerpP(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    function drawBuilding(b) {
      const P = b._P; if (!P) return;
      const a = b.app, c = cornersOf(b);
      const vis = [];
      FACES.forEach((f) => {
        let fc = [0, 0, 0];
        f.i.forEach((i) => { fc[0] += c[i][0]; fc[1] += c[i][1]; fc[2] += c[i][2]; });
        fc = [fc[0] / 4, fc[1] / 4, fc[2] / 4];
        if (dot(f.n, sub(camPos, fc)) > 0) {
          const inten = 0.42 + 0.58 * Math.max(0, dot(f.n, LIGHT));
          const dp = (P[f.i[0]].depth + P[f.i[2]].depth) / 2;
          vis.push({ f, inten, dp });
        }
      });
      vis.sort((x, y) => y.dp - x.dp);
      for (let vi = 0; vi < vis.length; vi++) {
        const v = vis[vi], f = v.f, ids = f.i;
        if (!P[ids[0]].vis || !P[ids[1]].vis || !P[ids[2]].vis || !P[ids[3]].vis) continue;
        let base = FACE;
        if (f.n[1] === 1) base = mixc(FACE, b.accentCur, 0.12 + b.act * 0.22);
        ctx.beginPath(); ctx.moveTo(P[ids[0]].x, P[ids[0]].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(P[ids[k]].x, P[ids[k]].y);
        ctx.closePath();
        ctx.fillStyle = rgba(shade(base, v.inten), b.alpha); ctx.fill();
        if (f.n[1] === 0) {
          ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(b.accentCur, b.edgeA * 0.4); ctx.lineWidth = 1;
          for (let fl = 1; fl <= 3; fl++) {
            const t = fl / 4, A = lerpP(P[ids[0]], P[ids[3]], t), Bp = lerpP(P[ids[1]], P[ids[2]], t);
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Bp.x, Bp.y); ctx.stroke();
          }
          ctx.restore();
        }
        ctx.strokeStyle = rgba(b.accentCur, b.edgeA); ctx.lineWidth = b.edgeW; ctx.stroke();
      }
      if (a.flagship) {
        const mb = project([a.x, b.lift + b.curH, a.z]), mt = project([a.x, b.lift + b.curH + 6, a.z]);
        if (mb.vis && mt.vis) {
          ctx.strokeStyle = rgba(GOLD, 0.85); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(mb.x, mb.y); ctx.lineTo(mt.x, mt.y); ctx.stroke();
          ctx.fillStyle = rgba(GOLD, b.beacon); ctx.beginPath(); ctx.arc(mt.x, mt.y, 3.2, 0, 6.29); ctx.fill();
        }
      }
    }
    function drawGroupPads() {
      if (groupOp < 0.01) return;
      buildings.forEach((b) => {
        const a = b.app, meta = GROUPS[a.group]; if (!meta) return;
        const r = a.fp * 0.95; let pts = [];
        for (let i = 0; i < 20; i++) {
          const an = i / 20 * 6.283, p = project([a.x + Math.cos(an) * r, 0.05, a.z + Math.sin(an) * r]);
          if (!p.vis) { pts = null; break; }
          pts.push(p);
        }
        if (!pts) return;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = rgba(meta.rgb, 0.14 * groupOp); ctx.fill();
        ctx.strokeStyle = rgba(meta.rgb, 0.4 * groupOp); ctx.lineWidth = 1; ctx.stroke();
      });
    }
    function drawGroupLabels() {
      if (groupOp < 0.02) return;
      ctx.font = '500 15px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center';
      Object.keys(groupMeta).forEach((k) => {
        const m = groupMeta[k], p = project([m.cx, m.mh + 9, m.cz]);
        if (!p.vis) return;
        ctx.fillStyle = rgba(GROUPS[k].rgb, 0.95 * groupOp); ctx.fillText(GROUPS[k].label, p.x, p.y);
      });
    }
    function linkArc(l) {
      const a = byName[l[0]].app, b = byName[l[1]].app;
      const p1 = [a.x, a.h * 0.6, a.z], p2 = [b.x, b.h * 0.6, b.z];
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
      const d = len(sub(p2, p1)); mid[1] += d * 0.3;
      return { p1, mid, p2 };
    }
    function bez(a, m, b, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1], u * u * a[2] + 2 * u * t * m[2] + t * t * b[2]]; }
    function drawLinks() {
      const hn = hovered ? hovered.app.name : (state.highlight || null);
      links.forEach((l) => {
        if (!byName[l[0]] || !byName[l[1]]) return;
        const touches = hn && (l[0] === hn || l[1] === hn);
        const op = touches ? 0.9 : (state.links ? 0.3 : 0);
        if (op < 0.02) return;
        const arc = linkArc(l);
        ctx.strokeStyle = rgba(GOLD, op); ctx.lineWidth = touches ? 2 : 1.2; ctx.beginPath();
        for (let t = 0; t <= 1.0001; t += 0.05) {
          const p = project(bez(arc.p1, arc.mid, arc.p2, t));
          if (!p.vis) continue;
          if (t === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      });
    }
    let packetLink = null, packetT = 0;
    function pickPacketLink() {
      let best = null, bs = -1;
      links.forEach((l) => {
        if (!byName[l[0]] || !byName[l[1]]) return;
        const s = activity(byName[l[0]].app) + activity(byName[l[1]].app);
        if (s > bs) { bs = s; best = l; }
      });
      return best;
    }
    function drawPacket() {
      if (!(state.playing && !reduce)) return;
      if (!packetLink || packetT >= 1) { packetLink = pickPacketLink(); packetT = 0; }
      if (!packetLink) return;
      packetT += 0.012;
      const arc = linkArc(packetLink), p = project(bez(arc.p1, arc.mid, arc.p2, Math.min(1, packetT)));
      if (!p.vis) return;
      ctx.fillStyle = rgba(CREAM, 0.95); ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 6.29); ctx.fill();
    }

    let raf = null, last = performance.now(), fcount = 0, tsec = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      try {
        const dt = (now - last) / 1000; last = now; tsec += dt;
        if (state.playing && !reduce) { fcount++; if (fcount % 36 === 0) engineApiRef.current?.setHour((state.hour + 1) % 24); }
        if (autoRotate && !selectedLocal && !state.highlight) cam.theta += 0.0009;
        target[0] += (focusTo[0] - target[0]) * 0.06; target[1] += (focusTo[1] - target[1]) * 0.06; target[2] += (focusTo[2] - target[2]) * 0.06;
        groupOp += ((state.groups ? 1 : 0) - groupOp) * 0.12;
        updateCam();

        const hn0 = hovered ? hovered.app.name : (state.highlight || null);
        const nbrs = hn0 ? neighbors(hn0) : null;
        buildings.forEach((b) => {
          const a = b.app, act = activity(a); b.act = act;
          const isHi = (hovered === b) || (state.highlight === a.name);
          const dimmed = (!passesFilter(a)) || (state.highlight && state.highlight !== a.name && !(nbrs && nbrs[a.name]));
          b.lift += ((isHi ? 1.8 : 0) - b.lift) * 0.15;
          const th = a.h * (0.94 + act * 0.16); b.curH += (th - b.curH) * 0.1;
          const acc = state.health ? healthColor(a.health) : (a.group === 'connected' && a.connected ? TEAL : GOLD);
          b.accentCur = mixc(b.accentCur, acc, 0.12);
          b.alpha += ((dimmed ? 0.4 : 1) - b.alpha) * 0.12;
          const pulse = 1 + 0.18 * Math.sin(tsec * (0.6 + a.vel * 3.2));
          b.edgeA += (((isHi ? 0.95 : (dimmed ? 0.12 : 0.5)) * pulse * (0.6 + act * 0.5)) - b.edgeA) * 0.12;
          b.edgeW = isHi ? 2 : 1;
          b.beacon = 0.6 + Math.sin(tsec * 2.2) * 0.4;
          const c = cornersOf(b); b._P = c.map(project);
          const cen = project([a.x, b.lift + b.curH * 0.5, a.z]); b._depth = cen.vis ? cen.depth : 1e9;
          const hp = []; for (let i = 0; i < 8; i++) { if (b._P[i].vis) hp.push(b._P[i]); }
          b._hull = hp.length >= 3 ? hull(hp) : null;
        });
        if (!dragging) hovered = hitTest();

        ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#12202E'; ctx.fillRect(0, 0, W, H);
        drawGround(); drawGroupPads();
        const order = buildings.slice().sort((x, y) => y._depth - x._depth);
        order.forEach(drawBuilding);
        drawLinks(); drawPacket(); drawGroupLabels();

        if (hovered && tip) {
          const a = hovered.app, p = project([a.x, hovered.lift + hovered.curH + 3, a.z]);
          if (p.vis) {
            tip.style.opacity = '1'; tip.style.left = p.x + 'px'; tip.style.top = p.y + 'px';
            tip.textContent = `${a.name} — ${Math.round(a.health * 100)}% health`;
          }
          canvas.style.cursor = 'pointer';
        } else {
          if (tip) tip.style.opacity = '0';
          canvas.style.cursor = dragging ? 'grabbing' : 'grab';
        }
      } catch (err) {
        console.error('[CommandCenterPanel] render error:', err);
      }
    }
    raf = requestAnimationFrame(frame);

    engineApiRef.current = {
      setLayer(key, val) { state[key] = val; },
      setFilter(val) { state.filter = val; },
      setHour(h) { state.hour = h; setHour(h); },
      setPlaying(val) { state.playing = val; },
      search(q) {
        state.highlight = null;
        const trimmed = q.trim().toLowerCase();
        if (trimmed) {
          const match = nodes.find((n) => n.name.toLowerCase().includes(trimmed));
          if (match) { state.highlight = match.name; focusOn(match); }
        } else {
          focusOn(null);
        }
      },
      closeDrawer() { selectedLocal = null; focusOn(null); },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      canvas.removeEventListener('wheel', onWheel);
      engineApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  function fmtHour(h) { const ap = h < 12 ? 'am' : 'pm'; let hh = h % 12; if (hh === 0) hh = 12; return `${hh}:00 ${ap}`; }

  function handleConnect(node) {
    window.location.href = `/api/oauth/${node.provider}/connect`;
  }

  if (loading) {
    return <div style={S.root}><div style={S.empty}>Loading Command Center…</div></div>;
  }

  const linkCount = selected && links ? [...neighborsOf(links, selected.name)].length : 0;

  return (
    <div style={S.root}>
      <div style={S.toolbar}>
        <span style={S.label}>Command Center</span>
        <input
          style={S.input}
          type="text"
          placeholder="Search apps..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); engineApiRef.current?.search(e.target.value); }}
        />
        <span
          style={S.chip(layerHealth)}
          onClick={() => { const v = !layerHealth; setLayerHealth(v); engineApiRef.current?.setLayer('health', v); }}
        >Health</span>
        <span
          style={S.chip(layerLinks)}
          onClick={() => { const v = !layerLinks; setLayerLinks(v); engineApiRef.current?.setLayer('links', v); }}
        >Links</span>
        <span
          style={S.chip(layerGroups)}
          onClick={() => { const v = !layerGroups; setLayerGroups(v); engineApiRef.current?.setLayer('groups', v); }}
        >Groups</span>
        <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(245,240,232,0.12)' }} />
        {[{ k: 'all', l: 'All' }, { k: 'platforms', l: 'My platforms' }, { k: 'risk', l: 'At-risk' }].map((f) => (
          <span
            key={f.k}
            style={S.chip(filter === f.k)}
            onClick={() => { setFilter(f.k); engineApiRef.current?.setFilter(f.k); }}
          >{f.l}</span>
        ))}
        <span style={S.stat}>{connectedCount}/{totalIntegrations} integrations connected</span>
      </div>

      <div style={S.scene} ref={containerRef}>
        <canvas ref={canvasRef} style={S.canvas} />
        <div ref={tipRef} style={S.tip} />

        <div style={S.timeline}>
          <button
            style={S.play}
            aria-label="Play timeline"
            onClick={() => { const v = !playing; setPlaying(v); engineApiRef.current?.setPlaying(v); }}
          >{playing ? '❚❚' : '▶'}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-teal)', marginBottom: 4 }}>A day of activity</div>
            <input
              type="range" min="0" max="23" step="1" value={hour} style={{ width: '100%' }}
              onChange={(e) => engineApiRef.current?.setHour(parseInt(e.target.value, 10))}
            />
          </div>
          <div style={S.hour}>{fmtHour(hour)}</div>
        </div>

        <div style={S.drawer(!!selected)}>
          {selected && (
            <>
              <button style={S.drawerClose} aria-label="Close" onClick={() => { setSelected(null); engineApiRef.current?.closeDrawer(); }}>✕</button>
              <div style={S.drawerEyebrow}>{selected.group === 'connected' ? (selected.connected ? 'Connected' : 'Not connected') : 'Salt Basin'}</div>
              <div style={S.drawerName}>{selected.name}</div>
              <div style={S.drawerKind}>{selected.kind}</div>
              <div style={S.rule} />
              <div style={S.drawerTag}>{selected.tag}</div>
              <div style={S.metrics}>
                <div style={S.metric}><div style={S.metricVal}>{Math.round(selected.health * 100)}%</div><div style={S.metricLabel}>Health</div></div>
                <div style={S.metric}><div style={S.metricVal}>{Math.round(selected.vel * 100)}%</div><div style={S.metricLabel}>Velocity</div></div>
                <div style={S.metric}><div style={S.metricVal}>{linkCount}</div><div style={S.metricLabel}>Links</div></div>
              </div>
              {selected.group === 'connected' ? (
                selected.connected
                  ? <div style={S.actionDone}>✓ Connected</div>
                  : <button style={S.actionBtn} onClick={() => handleConnect(selected)}>Connect {selected.name}</button>
              ) : (
                <div style={S.note}>Core platform — not an external integration, nothing to connect.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
