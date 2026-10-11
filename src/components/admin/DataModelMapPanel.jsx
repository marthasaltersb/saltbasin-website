// Data model map (World Shell island, datamodel.read permission - administrators by default; docs/changes/graphify-data-model-map.md).
// The platform's own data model drawn as one crystal-family view: every table is a gem (src/lib/crystalGeometry.js
// buildGemMesh), grouped by domain around the core crystal, joined to the tables it references. Built from the
// committed Graphify catalog (docs/data-model/catalog.json) - schema names only, never row data. The 3D view is
// mirrored by a plain list (domain buttons, search, table buttons) that does everything the 3D view does, so it
// works with a finger, a keyboard and a screen reader, and when WebGL is unavailable.
// Hooks are declared before any early return (rules of hooks).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { hasWebGL } from '../SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights, buildGemMesh } from '../../lib/crystalGeometry.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', bad: '#a5391f', ok: '#2f7d4f' };
const CSS = `
.sb-dm { background:#fff; color:${C.ink}; border-radius:12px; padding:1.1rem; max-width:1100px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.88rem; box-sizing:border-box; }
.sb-dm * { box-sizing:border-box; }
.sb-dm h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.sb-dm h2 { font-size:.95rem; margin:1rem 0 .4rem; }
.sb-dm .sub { color:${C.sec}; font-size:.8rem; margin:.25rem 0 .8rem; line-height:1.5; overflow-wrap:anywhere; }
.sb-dm .stats { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:.8rem; }
.sb-dm .stat { border:1px solid ${C.line}; border-radius:10px; padding:.45rem .8rem; flex:1 1 120px; }
.sb-dm .stat b { display:block; font-size:1.15rem; }
.sb-dm .tabs, .sb-dm .chips { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:.8rem; }
.sb-dm button { min-height:44px; padding:.4rem .9rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); background:#fff; color:${C.ink}; font:inherit; cursor:pointer; }
.sb-dm button[aria-pressed=true], .sb-dm button[aria-selected=true] { background:${C.ink}; color:#fff; }
.sb-dm button.primary { background:${C.accent}; border-color:${C.accent}; color:#fff; font-weight:600; }
.sb-dm input[type=text], .sb-dm input[type=search] { min-height:44px; padding:0 .7rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); font:inherit; width:100%; }
.sb-dm .searchrow { display:flex; gap:.5rem; margin-bottom:.8rem; }
.sb-dm .stage { position:relative; width:100%; height:380px; border-radius:12px; overflow:hidden; background:#0f171a; margin-bottom:.8rem; }
.sb-dm .stage canvas { width:100%; height:100%; display:block; touch-action:pan-y; }
.sb-dm .stage .hint { position:absolute; left:.6rem; bottom:.5rem; color:#cdd6d9; font-size:.72rem; pointer-events:none; }
.sb-dm .stage .fallback { color:#f5f0e8; padding:1rem; }
.sb-dm .grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr); gap:1rem; align-items:start; }
.sb-dm .list { max-height:520px; overflow:auto; border:1px solid ${C.line}; border-radius:10px; padding:.4rem; }
.sb-dm .list .dom { font-size:.7rem; color:${C.sec}; margin:.5rem .3rem .2rem; display:flex; align-items:center; gap:.4rem; }
.sb-dm .list .dot { width:.7rem; height:.7rem; border-radius:3px; display:inline-block; transform:rotate(45deg); }
.sb-dm .list button.tbl { display:flex; justify-content:space-between; gap:.5rem; width:100%; text-align:left; border:0; border-radius:6px; background:transparent; overflow-wrap:anywhere; }
.sb-dm .list button.tbl[aria-current=true] { background:${C.soft}; font-weight:700; }
.sb-dm .list button.tbl span.n { color:${C.sec}; font-size:.74rem; white-space:nowrap; }
.sb-dm .detail { border:1px solid ${C.line}; border-radius:10px; padding:.8rem; min-width:0; }
.sb-dm .detail h2 { margin-top:0; font-family:ui-monospace,Menlo,monospace; overflow-wrap:anywhere; }
.sb-dm table { border-collapse:collapse; width:100%; font-size:.78rem; }
.sb-dm th, .sb-dm td { text-align:left; padding:.3rem .4rem; border-bottom:1px solid ${C.line}; overflow-wrap:anywhere; vertical-align:top; }
.sb-dm code { font-family:ui-monospace,Menlo,monospace; font-size:.76rem; overflow-wrap:anywhere; }
.sb-dm .pill { display:inline-block; border-radius:999px; padding:0 .5rem; font-size:.7rem; color:#fff; }
.sb-dm .alert { background:#fbeae5; border:1px solid ${C.bad}; color:${C.bad}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; }
.sb-dm .note { background:${C.soft}; border-radius:8px; padding:.5rem .7rem; margin:.5rem 0; font-size:.8rem; }
.sb-dm .rule { border:1px solid ${C.line}; border-radius:10px; padding:.6rem; margin-bottom:.6rem; display:grid; grid-template-columns:1fr 130px; gap:.5rem; }
.sb-dm .rule label { display:block; font-size:.7rem; color:${C.sec}; margin-bottom:.15rem; }
.sb-dm .rule .wide { grid-column:1 / -1; }
.sb-dm input[type=color] { width:100%; min-height:44px; padding:2px; border-radius:8px; border:1px solid rgba(27,42,59,.3); }
@media (max-width:700px) { .sb-dm { padding:.8rem; border-radius:0; } .sb-dm .grid { grid-template-columns:1fr; } .sb-dm .stage { height:300px; } .sb-dm .rule { grid-template-columns:1fr; } .sb-dm .searchrow { flex-wrap:wrap; } }
`;

const hexInt = (h) => parseInt(String(h).replace('#', ''), 16);

/** Deterministic layout: domains on a ring, each domain's tables on a golden-angle spiral around its centre. */
function layoutSummary(summary) {
  const pos = new Map();
  const centers = [];
  const doms = summary.domains;
  doms.forEach((d, i) => {
    const a = (i / doms.length) * Math.PI * 2;
    const R = 8.5;
    const c = new THREE.Vector3(Math.cos(a) * R, ((i % 3) - 1) * 0.9, Math.sin(a) * R);
    centers.push({ key: d.key, label: d.label, color: d.color, c });
    const mine = summary.tables.filter((t) => t.domain === d.key);
    const rad = 0.8 + Math.sqrt(mine.length) * 0.42;
    mine.forEach((t, j) => {
      const r = rad * Math.sqrt((j + 0.5) / mine.length);
      const th = j * 2.399963;
      pos.set(t.name, new THREE.Vector3(c.x + Math.cos(th) * r, c.y + ((j % 5) - 2) * 0.28, c.z + Math.sin(th) * r));
    });
  });
  return { pos, centers };
}

function labelSprite(text, color) {
  const s = 3; const cv = document.createElement('canvas'); const ctx = cv.getContext('2d');
  ctx.font = `600 ${15 * s}px Jost, sans-serif`;
  cv.width = ctx.measureText(text).width + 20 * s; cv.height = 30 * s;
  ctx.font = `600 ${15 * s}px Jost, sans-serif`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width / 2, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set((cv.width / cv.height) * 0.9, 0.9, 1); sp.renderOrder = 999;
  return sp;
}

function CrystalView({ summary, selected, active, onPick }) {
  const mount = useRef(null);
  const api3d = useRef(null);
  const [noGl, setNoGl] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el) return undefined;
    if (!hasWebGL()) { setNoGl(true); return undefined; }
    const { pos, centers } = layoutSummary(summary);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 6, 22);
    camera.lookAt(0, 0, 0);
    addCrystalLights(scene, THREE);
    const world = new THREE.Group();
    scene.add(world);
    const core = new THREE.Group();
    CRYSTAL_VARIANTS.signature(core, THREE);
    core.scale.setScalar(0.7);
    world.add(core);
    const meshes = new Map();
    const colorOf = new Map(summary.tables.map((t) => [t.name, hexInt(t.color)]));
    summary.tables.forEach((t) => {
      const m = buildGemMesh(THREE, { color: colorOf.get(t.name), size: 0.16 + Math.min(0.34, Math.sqrt(t.columnCount) * 0.045) });
      m.material.transparent = true;
      m.position.copy(pos.get(t.name));
      m.userData.name = t.name;
      world.add(m); meshes.set(t.name, m);
    });
    centers.forEach((d) => { const s = labelSprite(d.label, d.color); s.position.set(d.c.x, d.c.y + 2.6, d.c.z); world.add(s); });
    const linkGroup = new THREE.Group(); world.add(linkGroup);
    const ray = new THREE.Raycaster();
    const state = { yaw: 0.4, pitch: 0.1, down: null, moved: 0, auto: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, raf: 0, selected: null };

    const resize = () => { const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; ro?.observe(el);
    const cv = renderer.domElement;
    const onDown = (e) => { state.down = { x: e.clientX, y: e.clientY }; state.moved = 0; state.auto = false; };
    const onMove = (e) => { if (!state.down) return; const dx = e.clientX - state.down.x, dy = e.clientY - state.down.y; state.moved += Math.abs(dx) + Math.abs(dy); state.yaw += dx * 0.006; state.pitch = Math.max(-0.7, Math.min(0.7, state.pitch + dy * 0.004)); state.down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      const was = state.down; state.down = null;
      if (!was || state.moved > 8) return;
      const r = cv.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects([...meshes.values()], false)[0];
      if (hit) onPick(hit.object.userData.name);
    };
    cv.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    const tick = () => {
      state.raf = requestAnimationFrame(tick);
      if (state.auto) state.yaw += 0.0025;
      world.rotation.y = state.yaw; world.rotation.x = state.pitch; core.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    tick();

    api3d.current = {
      reset() { state.yaw = 0.4; state.pitch = 0.1; },
      paint({ selectedName, activeSet }) {
        meshes.forEach((m, name) => {
          const on = !activeSet || activeSet.has(name);
          m.material.opacity = on ? 1 : 0.13;
          const sel = name === selectedName;
          m.scale.setScalar(sel ? 1.9 : 1);
          m.material.emissive = new THREE.Color(sel ? 0xffffff : 0x000000);
          m.material.emissiveIntensity = sel ? 0.55 : 0;
        });
        while (linkGroup.children.length) { const o = linkGroup.children.pop(); o.geometry.dispose(); o.material.dispose(); }
        if (selectedName && pos.has(selectedName)) {
          const pts = [];
          summary.links.forEach((l) => { if ((l.from === selectedName || l.to === selectedName) && pos.has(l.from) && pos.has(l.to)) pts.push(pos.get(l.from), pos.get(l.to)); });
          if (pts.length) linkGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xc4843a })));
        }
      },
    };
    return () => {
      cancelAnimationFrame(state.raf); ro?.disconnect();
      cv.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose(); el.removeChild(cv); api3d.current = null;
    };
    // The scene is built once per catalog; selection and filters repaint through api3d below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  useEffect(() => { api3d.current?.paint({ selectedName: selected, activeSet: active }); }, [selected, active, summary]);

  return (
    <div className="stage" data-testid="dm-crystal" role="img" aria-label="Data model crystal view: every table is a gem, grouped by domain around the core crystal. The list below does everything this view does.">
      <div ref={mount} style={{ width: '100%', height: '100%' }} />
      {noGl && <div className="fallback">The 3D view needs WebGL, which this browser does not have. The domain buttons, search and table list below show the same data map.</div>}
      {!noGl && <div className="hint">Drag to turn. Tap a gem to open its table.</div>}
      {!noGl && <button type="button" onClick={() => api3d.current?.reset()} style={{ position: 'absolute', right: '.5rem', bottom: '.5rem', minHeight: 44 }}>Reset view</button>}
    </div>
  );
}

function TableDetail({ name, onOpen }) {
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');
  const [picked, setPicked] = useState('');
  useEffect(() => {
    let live = true;
    setT(null); setErr(''); setPicked('');
    api.dmTable(name).then((d) => live && setT(d.table)).catch((e) => { if (live) { const m = `That table could not be opened: ${e.message}`; setErr(m); toast.error(m); } });
    return () => { live = false; };
  }, [name]);
  if (err) return <div className="detail"><div className="alert" role="alert">{err}</div></div>;
  if (!t) return <div className="detail">Loading table...</div>;
  const routes = [...t.usedBy.routes.map((r) => ({ ...r, how: 'directly' })), ...t.usedBy.routesViaModules.map((r) => ({ ...r, how: 'through a module' }))];
  const pick = (key) => { setPicked(key); try { navigator.clipboard?.writeText(key); } catch { /* clipboard is optional */ } };
  return (
    <div className="detail" data-testid="dm-detail">
      <h2>Table: {t.name}</h2>
      <div><span className="pill" style={{ background: t.color }}>{t.domainLabel}</span> <span className="sub">{t.columns.length} columns, primary key {t.primaryKey.join(', ') || 'none'}</span></div>
      <div style={{ margin: '.5rem 0' }}>
        <button type="button" className="primary" data-testid="dm-pick-object" onClick={() => pick(t.name)}>Use as a data object</button>
        {picked && <div className="note" role="status" data-testid="dm-picked">Picker key: <code>{picked}</code> (copied when your browser allows it). A flow builder stores this key.</div>}
      </div>
      <h2>Columns</h2>
      <table data-testid="dm-columns"><thead><tr><th>Column</th><th>Type</th><th>Links to</th><th /></tr></thead><tbody>
        {t.columns.map((c) => (
          <tr key={c.name}><td><code>{c.name}</code>{c.primaryKey ? ' (key)' : ''}</td><td>{c.type}{c.nullable ? '' : ', required'}</td>
            <td>{c.references ? <button type="button" onClick={() => onOpen(c.references.table)} style={{ minHeight: 44 }}>{c.references.table}.{c.references.column}</button> : ''}</td>
            <td><button type="button" aria-label={`Use ${t.name}.${c.name} as a field`} onClick={() => pick(`${t.name}.${c.name}`)} style={{ minHeight: 44 }}>Use field</button></td></tr>
        ))}
      </tbody></table>
      <h2>References ({new Set(t.references.map((r) => r.table)).size})</h2>
      <div className="chips" data-testid="dm-references">{t.references.length ? [...new Set(t.references.map((r) => r.table))].map((n) => <button type="button" key={n} onClick={() => onOpen(n)}>{n}</button>) : <span className="sub">This table references no other table.</span>}</div>
      <h2>Referenced by ({new Set(t.referencedBy.map((r) => r.table)).size})</h2>
      <div className="chips" data-testid="dm-referenced-by">{t.referencedBy.length ? [...new Set(t.referencedBy.map((r) => r.table))].map((n) => <button type="button" key={n} onClick={() => onOpen(n)}>{n}</button>) : <span className="sub">No table references this one.</span>}</div>
      <h2>Used by routes ({routes.length})</h2>
      <div data-testid="dm-routes">{routes.length ? routes.map((r) => <div key={r.file}><code>{r.mount}</code> <span className="sub">{r.file}, {r.how}</span></div>) : <span className="sub">No route file reads or writes this table by name.</span>}</div>
      <h2>Used by server modules ({t.usedBy.modules.length})</h2>
      <div data-testid="dm-modules">{t.usedBy.modules.length ? t.usedBy.modules.map((m) => <div key={m}><code>{m}</code></div>) : <span className="sub">None found (dynamic SQL is invisible to the scan).</span>}</div>
    </div>
  );
}

function SettingsTab({ onSaved }) {
  const [rules, setRules] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const load = useCallback(() => api.dmRules().then((r) => { setRules(r); setErr(''); }).catch((e) => { const m = `The grouping rules could not be loaded: ${e.message}`; setErr(m); toast.error(m); }), []);
  useEffect(() => { load(); }, [load]);
  if (!rules) return <div>{err ? <div className="alert" role="alert">{err}</div> : 'Loading...'}</div>;
  const setD = (i, patch) => setRules({ ...rules, domains: rules.domains.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  const csv = (v) => (Array.isArray(v) ? v.join(', ') : v);
  const save = async () => {
    setErr(''); setMsg('');
    try {
      const r = await api.dmSaveRules({ domains: rules.domains, note });
      setRules(r); setMsg(`Saved. The grouping is now version ${r.version}.`); toast.success('Domain grouping saved'); onSaved();
    } catch (e) { setErr(e.message); toast.error(e.message); }
  };
  const reset = async () => {
    setErr(''); setMsg('');
    try { const r = await api.dmResetRules(); setRules(r); setMsg('Back to the shipped default grouping.'); toast.success('Default grouping restored'); onSaved(); }
    catch (e) { setErr(e.message); toast.error(e.message); }
  };
  return (
    <div data-testid="dm-settings">
      <p className="sub">A table goes to the domain that names it exactly (an exact name beats a prefix), otherwise to the first domain whose prefix it starts with; anything else is "Other". Changing this regroups the map at once. It does not regenerate the Graphify catalog. Currently: {rules.source === 'saved' ? 'your saved grouping' : 'the shipped default'}.</p>
      {err && <div className="alert" role="alert">{err}</div>}
      {msg && <div className="note" role="status">{msg}</div>}
      {rules.domains.map((d, i) => (
        <div className="rule" key={d.key + i} data-testid="dm-rule">
          <div><label htmlFor={`dm-l-${i}`}>Domain name</label><input id={`dm-l-${i}`} type="text" value={d.label} onChange={(e) => setD(i, { label: e.target.value })} /></div>
          <div><label htmlFor={`dm-c-${i}`}>Colour</label><input id={`dm-c-${i}`} type="color" value={/^#[0-9a-fA-F]{6}$/.test(d.color) ? d.color : '#7c8a90'} onChange={(e) => setD(i, { color: e.target.value })} /></div>
          <div className="wide"><label htmlFor={`dm-p-${i}`}>Table-name prefixes (comma separated)</label><input id={`dm-p-${i}`} type="text" value={csv(d.prefixes)} onChange={(e) => setD(i, { prefixes: e.target.value })} /></div>
          <div className="wide"><label htmlFor={`dm-t-${i}`}>Exact table names (comma separated)</label><input id={`dm-t-${i}`} type="text" value={csv(d.tables)} onChange={(e) => setD(i, { tables: e.target.value })} /></div>
          <div className="wide"><button type="button" onClick={() => setRules({ ...rules, domains: rules.domains.filter((_, j) => j !== i) })}>Remove domain {d.label}</button></div>
        </div>
      ))}
      <div className="chips">
        <button type="button" onClick={() => setRules({ ...rules, domains: [...rules.domains, { key: `new_${rules.domains.length + 1}`, label: 'New domain', color: '#7c8a90', prefixes: [], tables: [] }] })}>Add a domain</button>
      </div>
      <label htmlFor="dm-note" className="sub">Why you are changing it (optional)</label>
      <input id="dm-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="chips" style={{ marginTop: '.8rem' }}>
        <button type="button" className="primary" onClick={save}>Save grouping</button>
        <button type="button" onClick={reset}>Restore default grouping</button>
      </div>
    </div>
  );
}

/** Code-module view: Graphify communities of modules, one module's imports, importers and the tables it uses. */
function CodeTab({ onOpenTable }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState('');
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.dmCode().then(setData).catch((e) => { const m = e.message || 'The code view could not be loaded.'; setError(m); toast.error(m); }); }, []);
  useEffect(() => {
    if (!file) { setDetail(null); return; }
    api.dmCode(file).then((d) => { setDetail(d); setError(''); }).catch((e) => { setError(e.message); toast.error(e.message); });
  }, [file]);
  if (!data) return error ? <div className="alert" role="alert" data-testid="dm-code-error">{error}</div> : <div className="sub">Loading...</div>;
  const needle = q.trim().toLowerCase();
  const groups = data.communities.map((c) => ({ ...c, modules: c.modules.filter((m) => !needle || m.file.toLowerCase().includes(needle)) })).filter((c) => c.modules.length);
  return (
    <div data-testid="dm-code">
      {error && <div className="alert" role="alert">{error}</div>}
      <p className="sub" data-testid="dm-code-counts">{data.counts.modules} code modules, {data.counts.importLinks} import links, {data.counts.tableLinks} module-to-table links. Modules are grouped by Graphify community.</p>
      <div className="searchrow"><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter modules" aria-label="Filter modules" /></div>
      <div className="grid">
        <div className="list" data-testid="dm-code-list">
          {!groups.length && <div className="sub" style={{ padding: '.5rem' }}>No modules match that filter.</div>}
          {groups.map((c) => (
            <div key={c.community}>
              <div className="dom">Community {c.community} ({c.moduleCount} modules)</div>
              {c.modules.map((m) => (
                <button type="button" className="tbl" key={m.file} data-module={m.file} aria-current={file === m.file} onClick={() => setFile(m.file)}>
                  <span>{m.file}</span><span className="n">{m.symbols} symbols</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        {detail ? (
          <div className="detail" data-testid="dm-code-detail">
            <h2>{detail.file}</h2>
            <p className="sub">Community {detail.community}, {detail.symbols} symbols</p>
            <h2>Imports ({detail.imports.length})</h2>
            {detail.imports.map((f) => <div key={f}><button type="button" onClick={() => setFile(f)} style={{ minHeight: 44 }}>{f}</button></div>)}
            <h2>Imported by ({detail.importedBy.length})</h2>
            {detail.importedBy.map((f) => <div key={f}><button type="button" onClick={() => setFile(f)} style={{ minHeight: 44 }}>{f}</button></div>)}
            <h2>Tables used ({detail.tables.length})</h2>
            {detail.tables.map((t) => <div key={t}><button type="button" onClick={() => onOpenTable(t)} style={{ minHeight: 44 }}>{t}</button></div>)}
          </div>
        ) : <div className="detail sub">Pick a module to see what it imports, what imports it and which tables it uses.</div>}
      </div>
    </div>
  );
}

export default function DataModelMapPanel() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('map');
  const [domain, setDomain] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState(null);
  const [selected, setSelected] = useState('');

  const load = useCallback(() => api.dmCatalog()
    .then((d) => { setSummary(d); setError(''); })
    .catch((e) => { const m = e.message || 'The data model map could not be loaded.'; setError(m); toast.error(m); }), []);
  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => {
    if (!summary) return null;
    if (!domain && !search) return null;
    const hits = search ? new Set(search.hits.map((h) => h.table)) : null;
    return new Set(summary.tables.filter((t) => (!domain || t.domain === domain) && (!hits || hits.has(t.name))).map((t) => t.name));
  }, [summary, domain, search]);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!q.trim()) { setSearch(null); return; }
    try { setSearch(await api.dmSearch(q.trim())); setError(''); }
    catch (err) { setSearch(null); setError(err.message); toast.error(err.message); }
  };
  const clear = () => { setQ(''); setSearch(null); setDomain(''); };

  const shown = summary ? summary.tables.filter((t) => !active || active.has(t.name)) : [];
  const byDomain = summary ? summary.domains.map((d) => ({ d, tables: shown.filter((t) => t.domain === d.key) })).filter((g) => g.tables.length) : [];

  return (
    <div className="sb-dm" data-testid="data-model-map">
      <style>{CSS}</style>
      <h1>Data model map</h1>
      <p className="sub">The platform's data model as one crystal view: every table is a gem, grouped by domain, joined to the tables it references, with the routes and modules that use it. Built locally with Graphify (code mode and Postgres introspection, no AI pass) from a fresh database with fictional seed rows, never your live data.</p>
      {error && <div className="alert" role="alert" data-testid="dm-error">{error}</div>}
      {summary && (
        <>
          <p className="sub" data-testid="dm-stamp">Graphify {summary.stamp.graphifyVersion} - generated from commit {String(summary.stamp.generatedFromCommit).slice(0, 9)}{summary.stamp.generatedAt ? ` on ${summary.stamp.generatedAt.slice(0, 10)}` : ''} - AI pass: {summary.stamp.llmPass ? 'yes' : 'none'}</p>
          <div className="stats" data-testid="dm-stats">
            <div className="stat"><b>{summary.counts.tables}</b>tables</div>
            <div className="stat"><b>{summary.counts.columns}</b>columns</div>
            <div className="stat"><b>{summary.counts.foreignKeys}</b>foreign keys</div>
            <div className="stat"><b>{summary.domains.length}</b>domains</div>
          </div>
        </>
      )}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'map'} onClick={() => setTab('map')}>Map</button>
        <button type="button" role="tab" aria-selected={tab === 'code'} onClick={() => setTab('code')}>Code</button>
        <button type="button" role="tab" aria-selected={tab === 'settings'} onClick={() => setTab('settings')}>Settings</button>
      </div>
      {tab === 'settings' ? <SettingsTab onSaved={load} /> : tab === 'code' ? <CodeTab onOpenTable={(t) => { setSelected(t); setTab('map'); }} /> : !summary ? (!error && <div className="sub">Loading...</div>) : (
        <>
          <form className="searchrow" onSubmit={runSearch} role="search">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tables, columns or routes" aria-label="Search tables, columns or routes" />
            <button type="submit" className="primary">Search</button>
            <button type="button" onClick={clear}>Clear</button>
          </form>
          <div className="chips" data-testid="dm-domains">
            <button type="button" aria-pressed={!domain} onClick={() => setDomain('')}>All domains</button>
            {summary.domains.map((d) => <button type="button" key={d.key} aria-pressed={domain === d.key} onClick={() => setDomain(domain === d.key ? '' : d.key)} style={domain === d.key ? undefined : { borderColor: d.color }}>{d.label} ({d.tableCount})</button>)}
          </div>
          <CrystalView summary={summary} selected={selected} active={active} onPick={setSelected} />
          {search && (
            <div className="note" role="status" data-testid="dm-search-summary">
              {search.total} match{search.total === 1 ? '' : 'es'} for "{search.query}".
              {search.hits.slice(0, 8).map((h) => (
                <div key={h.matchedOn + h.type}><button type="button" onClick={() => setSelected(h.table)} style={{ minHeight: 44 }}>{h.type === 'table' ? 'Table' : h.type === 'column' ? 'Column' : 'Route'}: {h.matchedOn}</button></div>
              ))}
              {search.total === 0 && <div>Nothing matches. Try part of a table name, such as "career".</div>}
            </div>
          )}
          <div className="grid">
            <div className="list" data-testid="dm-list">
              {!byDomain.length && <div className="sub" style={{ padding: '.5rem' }}>No tables match the current search and domain.</div>}
              {byDomain.map(({ d, tables }) => (
                <div key={d.key}>
                  <div className="dom"><span className="dot" style={{ background: d.color }} />{d.label} ({tables.length})</div>
                  {tables.map((t) => (
                    <button type="button" className="tbl" key={t.name} data-table={t.name} aria-current={selected === t.name} onClick={() => setSelected(t.name)}>
                      <span>{t.name}</span><span className="n">{t.columnCount} cols</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {selected ? <TableDetail name={selected} onOpen={setSelected} /> : <div className="detail sub">Pick a table from the list, or tap a gem, to see its columns, relations and the routes and modules that use it.</div>}
          </div>
        </>
      )}
    </div>
  );
}
