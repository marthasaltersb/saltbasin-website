// Journey flow studio (docs/changes/journey-flow-studio.md): the metadata-driven, persisted, downloadable process flow
// builder that becomes the journey definition experience. Shape types, colours, field sections and fields, validation
// rules and the access policy all come from the versioned definition the server returns (Settings edits it); nothing
// about them is hardcoded here. Flows are saved as versioned drafts, published with an impact preview and one
// approval, exported as JSON / a single HTML viewer / a journey definition, and imported back with plain-language
// errors. Errors are always shown inline (role="alert") and never swallowed. Publishing goes through
// useToolCategoryGate().run like every other finalize path.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { LANE_H, shapeOf, edgePath, shapePrims, hasField } from '../../lib/flowGeometry.js';
import { validateFlow } from '../../lib/flowStudioDoc.js';

const CSS = `
.fs-root { --fs-ink:#1b2a3b; --fs-sec:#536173; --fs-line:#e5ded3; --fs-soft:#f6f2ea; --fs-bg:#ffffff; --fs-accent:#c4843a; --fs-teal:#2e7f9c; --fs-bad:#a5391f; --fs-ok:#2f7d4f; --fs-alert:#fbeae5; --fs-note:#eef5f8; --fs-canvas:#F8F4EC;
  background:var(--fs-bg); color:var(--fs-ink); border-radius:12px; padding:1.1rem; max-width:1280px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.88rem; box-sizing:border-box; overflow-wrap:anywhere; }
@media (prefers-color-scheme: dark) { .fs-root { --fs-ink:#ece7de; --fs-sec:#a9b4c0; --fs-line:#33414d; --fs-soft:#1a242d; --fs-bg:#10181f; --fs-alert:#3b1d17; --fs-note:#14303b; } }
.fs-root * { box-sizing:border-box; }
.fs-h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.fs-sub { color:var(--fs-sec); font-size:.8rem; margin:.25rem 0 .9rem; line-height:1.5; }
.fs-tabs { display:flex; gap:.3rem; border-bottom:1px solid var(--fs-line); margin-bottom:1rem; flex-wrap:wrap; }
.fs-tab { border:0; background:transparent; color:var(--fs-ink); padding:.55rem .95rem; border-radius:8px 8px 0 0; cursor:pointer; font:inherit; min-height:44px; }
.fs-tab[aria-selected="true"] { background:var(--fs-ink); color:var(--fs-bg); font-weight:700; }
.fs-card { border:1px solid var(--fs-line); border-radius:10px; padding:.9rem; margin-bottom:1rem; background:var(--fs-bg); }
.fs-card h3 { margin:0 0 .5rem; font-size:.92rem; }
.fs-btn { border:0; background:var(--fs-ink); color:var(--fs-bg); border-radius:8px; padding:.5rem .9rem; cursor:pointer; font:inherit; min-height:44px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; }
.fs-btn2 { border:1px solid var(--fs-line); background:var(--fs-bg); color:var(--fs-ink); border-radius:8px; padding:.5rem .9rem; cursor:pointer; font:inherit; min-height:44px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; }
.fs-btn2[aria-pressed="true"] { background:var(--fs-teal); color:#fff; border-color:var(--fs-teal); }
.fs-btn:disabled, .fs-btn2:disabled { opacity:.5; cursor:not-allowed; }
.fs-input { padding:.5rem .6rem; border-radius:8px; border:1px solid var(--fs-line); font:inherit; background:var(--fs-bg); color:var(--fs-ink); min-height:44px; min-width:0; max-width:100%; }
textarea.fs-input { min-height:70px; width:100%; }
.fs-row { display:flex; gap:.6rem; flex-wrap:wrap; align-items:flex-end; margin-bottom:.6rem; }
.fs-label { display:flex; flex-direction:column; gap:.2rem; font-size:.74rem; color:var(--fs-sec); }
.fs-alert { background:var(--fs-alert); border:1px solid var(--fs-bad); color:var(--fs-bad); border-radius:8px; padding:.55rem .7rem; margin:.5rem 0; font-size:.8rem; }
.fs-note { background:var(--fs-note); border:1px solid var(--fs-teal); border-radius:8px; padding:.55rem .7rem; margin:.5rem 0; font-size:.8rem; }
.fs-empty { color:var(--fs-sec); border:1px dashed var(--fs-line); border-radius:8px; padding:.8rem; font-size:.82rem; }
.fs-pill { display:inline-block; padding:.05rem .55rem; border-radius:999px; font-size:.7rem; font-weight:700; color:#fff; background:var(--fs-sec); }
.fs-pill.error { background:var(--fs-bad); } .fs-pill.warning { background:var(--fs-accent); } .fs-pill.ok { background:var(--fs-ok); }
.fs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:.8rem; }
.fs-item { text-align:left; border:1px solid var(--fs-line); background:var(--fs-soft); color:var(--fs-ink); border-radius:12px; padding:.7rem; cursor:pointer; font:inherit; min-height:44px; display:block; width:100%; }
.fs-muted { color:var(--fs-sec); font-size:.78rem; }
.fs-edit { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:1rem; align-items:start; }
.fs-canvas { border:1px solid var(--fs-line); border-radius:10px; overflow:auto; max-height:62vh; background:var(--fs-canvas); max-width:100%; }
.fs-canvas svg { display:block; }
.fs-node { cursor:grab; touch-action:none; outline:none; }
.fs-node:focus-visible rect.fs-hit, .fs-node:focus-visible .fs-face { stroke:var(--fs-accent); stroke-width:4; }
.fs-side { max-height:78vh; overflow:auto; }
.fs-find li { margin:.25rem 0; }
.fs-table { width:100%; border-collapse:collapse; font-size:.78rem; }
.fs-table th, .fs-table td { border-bottom:1px solid var(--fs-line); padding:.3rem .25rem; text-align:left; vertical-align:middle; }
.fs-table .fs-input { min-height:36px; padding:.2rem .35rem; width:100%; }
.fs-scroll { overflow-x:auto; max-width:100%; }
.fs-btn:focus-visible, .fs-btn2:focus-visible, .fs-tab:focus-visible, .fs-input:focus-visible, .fs-item:focus-visible { outline:3px solid var(--fs-accent); outline-offset:2px; }
@media (max-width:820px) { .fs-edit { grid-template-columns:minmax(0,1fr); } .fs-edit > div { min-width:0; } .fs-side { max-height:none; } .fs-root { padding:.8rem; } .fs-input { font-size:16px; } .fs-row > .fs-btn, .fs-row > .fs-btn2 { flex:1 1 calc(50% - .6rem); } .fs-canvas { max-height:55vh; } }
`;

const clone = (v) => JSON.parse(JSON.stringify(v));
const nextId = (prefix, list) => `${prefix}${list.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, '')) || 0), 0) + 1}`;
const parseTags = (v) => v.split(',').map((t) => t.trim()).filter(Boolean);
const wrapLabel = (label, width) => {
  const max = Math.max(8, Math.floor(width / 7));
  const words = String(label || '').split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
};
const metaOf = (n, scenario) => ({ ...(n.meta?.base || {}), ...(scenario && scenario !== 'base' ? n.meta?.[scenario] || {} : {}) });

function useMessages() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const say = useCallback((m) => { setNotice(m); setError(''); toast.success(m); }, []);
  const fail = useCallback((e) => { const m = e?.message || String(e); setError(m); setNotice(''); toast.error(m); }, []);
  return { notice, error, say, fail, clear: () => { setNotice(''); setError(''); } };
}
const Messages = ({ m }) => (<>
  {m.notice ? <div className="fs-note" role="status" data-testid="fs-notice">{m.notice}</div> : null}
  {m.error ? <div className="fs-alert" role="alert" data-testid="fs-error">{m.error}</div> : null}
</>);

function ImpactBox({ title, impact, onApprove, onCancel, approveLabel, disabled, children }) {
  return (
    <div className="fs-card" role="group" aria-label={title} data-testid="fs-impact">
      <h3>{title}</h3>
      <ul>{(impact.lines || []).map((l, i) => <li key={i}>{l}</li>)}</ul>
      {children}
      <div className="fs-row">
        <button type="button" className="fs-btn" onClick={onApprove} disabled={disabled}>{approveLabel}</button>
        <button type="button" className="fs-btn2" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Canvas ──────────────────────────────────────────────────────────────────
function Canvas({ def, st, scenario, selection, mode, connectFrom, onSelect, onMoveStart, onMove, onMoveEnd, onNodeClick, onNudge }) {
  const dragRef = useRef(null);
  const byId = useMemo(() => new Map(st.nodes.map((n) => [n.id, n])), [st.nodes]);
  const width = Math.max(900, ...st.nodes.map((n) => n.x + shapeOf(def, n.type).w + 80));
  const height = Math.max(st.lanes.length * LANE_H, ...st.nodes.map((n) => n.y + shapeOf(def, n.type).h + 80), 300);
  const dim = (tags) => Array.isArray(tags) && tags.length > 0 && !(scenario !== 'base' && tags.includes(scenario));
  const loops = {};
  return (
    <div className="fs-canvas" data-testid="fs-canvas">
      <svg width={width} height={height} role="img" aria-label="Flow canvas" onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.dataset.bg) onSelect(null); }}>
        <defs><marker id="fs-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#C4843A" /></marker></defs>
        {st.lanes.map((l, i) => (
          <g key={l.id}>
            <rect data-bg="1" x="0" y={i * LANE_H} width={width} height={LANE_H} fill={i % 2 ? '#fbf9f4' : '#f6f2ea'} stroke="#e5ded3" />
            <text x="8" y={i * LANE_H + 18} fontSize="12" fontWeight="700" fill="#536173">{l.label}</text>
          </g>
        ))}
        {st.edges.map((e) => {
          const f = byId.get(e.from); const t = byId.get(e.to); if (!f || !t) return null;
          const si = e.from === e.to ? (loops[e.from] = (loops[e.from] ?? -1) + 1) : 0;
          const p = edgePath(def, f, t, si);
          const ov = (e.overlays && e.overlays[scenario]) || {};
          const label = ov.label ?? e.label;
          const sel = selection?.kind === 'edge' && selection.id === e.id;
          const lw = Math.max(34, String(label).length * 6.4 + 16);
          return (
            <g key={e.id} opacity={dim(e.scenarioTags) ? 0.3 : 1} style={{ cursor: 'pointer' }} onPointerDown={(ev) => { ev.stopPropagation(); onSelect({ kind: 'edge', id: e.id }); }}>
              <path d={p.d} fill="none" stroke="transparent" strokeWidth="16" />
              <path d={p.d} fill="none" stroke={sel ? '#2e7f9c' : shapeOf(def, f.type).branching ? '#C4843A' : '#345A68'} strokeWidth={sel ? 3.5 : 2} markerEnd="url(#fs-arrow)" strokeDasharray={e.scenarioTags.length ? '6 4' : undefined} />
              {label ? (<><rect x={p.lx - lw / 2} y={p.ly - 11} width={lw} height="22" rx="11" fill="#F8F4EC" stroke="#C4843A" /><text x={p.lx} y={p.ly + 4} textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#345A68">{label}</text></>) : null}
              {Object.keys(e.overlays || {}).length ? <circle cx={p.lx + lw / 2} cy={p.ly - 11} r="4" fill="#2e7f9c"><title>Has scenario overrides</title></circle> : null}
            </g>
          );
        })}
        {st.nodes.map((n) => {
          const { back, face, s, b } = shapePrims(def, n);
          const exec = def.execModes.find((m) => m.key === (n.execMode || ''));
          const par = n.concurrency === 'parallel' ? def.concurrencyModes.find((m) => m.key === 'parallel') : null;
          const meta = metaOf(n, scenario);
          const sel = selection?.kind === 'node' && selection.id === n.id;
          const pain = def.resolveKinds.some((k) => hasField(meta, k.field));
          const hasMeta = Object.values(meta).some((v) => typeof v === 'string' && v.trim());
          const resolves = n.resolves.length > 0;
          const prim = (p, props) => (p.t === 'rect' ? <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} {...props} /> : p.t === 'circle' ? <circle cx={p.cx} cy={p.cy} r={p.r} {...props} /> : <polygon points={p.pts} {...props} />);
          const lines = wrapLabel(n.label, s.kind === 'diamond' ? s.w * 0.7 : s.w - 16);
          return (
            <g key={n.id} className="fs-node" tabIndex={0} role="button" aria-label={`${s.label}: ${n.label || 'no label'}${connectFrom === n.id ? ' (connecting from here)' : ''}`}
              opacity={dim(n.scenarioTags) ? 0.3 : 1}
              onPointerDown={(ev) => {
                ev.stopPropagation(); ev.currentTarget.setPointerCapture?.(ev.pointerId);
                dragRef.current = { id: n.id, sx: ev.clientX, sy: ev.clientY, ox: n.x, oy: n.y, moved: false };
              }}
              onPointerMove={(ev) => {
                const d = dragRef.current; if (!d || d.id !== n.id) return;
                const dx = ev.clientX - d.sx; const dy = ev.clientY - d.sy;
                if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
                if (!d.moved) { d.moved = true; onMoveStart(); }
                onMove(n.id, Math.max(0, Math.round(d.ox + dx)), Math.max(0, Math.round(d.oy + dy)));
              }}
              onPointerUp={() => { const d = dragRef.current; dragRef.current = null; if (d?.moved) onMoveEnd(n.id); else onNodeClick(n.id); }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onNodeClick(n.id); }
                const step = ev.shiftKey ? 40 : 10;
                const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[ev.key];
                if (mv) { ev.preventDefault(); onNudge(n.id, mv[0], mv[1]); }
              }}>
              {prim(back, { fill: s.shadow, opacity: 0.55 })}
              {prim(face, { className: 'fs-face', fill: s.fill, stroke: sel ? '#2e7f9c' : connectFrom === n.id ? '#C4843A' : s.stroke, strokeWidth: sel || connectFrom === n.id ? 4 : 2 })}
              <rect className="fs-hit" x={b.x} y={b.y} width={b.w} height={b.h} fill="transparent" />
              <text x={b.cx} y={b.cy - (lines.length - 1) * 6 + 4} textAnchor="middle" fontSize="12" fill={s.text}>
                {lines.map((l, i) => <tspan key={i} x={b.cx} dy={i === 0 ? 0 : 13}>{l}</tspan>)}
              </text>
              {exec && exec.badge ? (<g><circle cx={b.x + 2} cy={b.y + 2} r="10" fill={exec.color} /><text x={b.x + 2} y={b.y + 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{exec.badge}</text><title>{exec.label}</title></g>) : null}
              {par ? (<g><rect x={b.x + b.w - 20} y={b.y - 8} width="26" height="16" rx="8" fill={par.color} /><text x={b.x + b.w - 7} y={b.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{par.badge}</text><title>{par.label}</title></g>) : null}
              {hasMeta ? <circle cx={b.x + b.w - 4} cy={b.y + 6} r="4" fill="#C4843A"><title>Has a saved spec</title></circle> : null}
              {pain ? <circle cx={b.x + b.w - 4} cy={b.y + b.h - 4} r="5" fill="#a5391f"><title>Pain, handover gap or leakage recorded</title></circle> : null}
              {resolves ? <circle cx={b.x + 6} cy={b.y + b.h - 4} r="5" fill="#2f7d4f"><title>Resolves Current-state problems</title></circle> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Field editor for a step in the active scenario ─────────────────────────
function FieldEditor({ def, node, viewState, scenario, onField, onCopyBase, onClear }) {
  const over = scenario !== 'base' ? (node.meta?.[scenario] || {}) : null;
  return (
    <div>
      {scenario !== 'base' ? (
        <div className="fs-note" data-testid="fs-scenario-banner">Editing scenario overrides for <strong>{scenario}</strong>. Empty boxes inherit the base value shown in grey.
          <div className="fs-row" style={{ marginTop: '.4rem' }}>
            <button type="button" className="fs-btn2" onClick={onCopyBase}>Copy base values into {scenario}</button>
            <button type="button" className="fs-btn2" onClick={onClear}>Clear {scenario} overrides</button>
          </div>
        </div>
      ) : null}
      {def.sections.filter((s) => !s.viewOnly || s.viewOnly === viewState).map((sec) => (
        <fieldset key={sec.key} style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '0 0 .6rem', padding: '.5rem .6rem' }}>
          <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>{sec.label}</legend>
          {def.fields.filter((f) => f.section === sec.key).map((f) => {
            const base = node.meta?.base?.[f.key] || '';
            const value = scenario === 'base' ? base : (over?.[f.key] ?? '');
            const props = { id: `fs-f-${f.key}`, className: 'fs-input', value, placeholder: scenario !== 'base' ? base : (f.hint || ''), 'aria-label': f.label, onChange: (e) => onField(f.key, e.target.value) };
            return (
              <label key={f.key} className="fs-label" style={{ marginBottom: '.45rem' }}>{f.label}
                {f.type === 'textarea' ? <textarea {...props} /> : <input type="text" {...props} />}
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

// ── Flow editor ─────────────────────────────────────────────────────────────
function FlowEditor({ flowId, onBack, m, canShare }) {
  const gate = useToolCategoryGate();
  const [flow, setFlow] = useState(null);
  const [doc, setDoc] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [undo, setUndo] = useState([]);
  const [redo, setRedo] = useState([]);
  const [viewState, setViewState] = useState('current');
  const [scenario, setScenario] = useState('base');
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState('select');
  const [connectFrom, setConnectFrom] = useState(null);
  const [panel, setPanel] = useState(null); // 'publish' | 'history' | 'template' | 'export' | 'lanes'
  const [preview, setPreview] = useState(null);
  const [hist, setHist] = useState(null);
  const [newScenario, setNewScenario] = useState('');
  const [tpl, setTpl] = useState({ name: '', visibility: 'private' });
  const [myTemplates, setMyTemplates] = useState([]);
  const [replaceId, setReplaceId] = useState('');
  const [replaceImpact, setReplaceImpact] = useState(null);
  const [agent, setAgent] = useState({ prompt: '', draft: null, note: '' });
  const [busy, setBusy] = useState(false);
  const coalesce = useRef({ key: null, at: 0 });
  const def = flow?.definition;

  useEffect(() => {
    let live = true;
    api.fsFlow(flowId).then((f) => { if (!live) return; setFlow(f); setDoc(f.doc); }).catch((e) => m.fail(e));
    return () => { live = false; };
  }, [flowId]); // eslint-disable-line react-hooks/exhaustive-deps

  const st = doc?.states[viewState];
  const findings = useMemo(() => (doc && def ? validateFlow(doc, def) : []), [doc, def]);
  const errorCount = findings.filter((f) => f.severity === 'error').length;

  const commit = useCallback((next, key = null) => {
    setDoc((prev) => {
      const now = Date.now();
      const same = key && coalesce.current.key === key && now - coalesce.current.at < 1500;
      if (!same) setUndo((u) => [...u.slice(-99), prev]);
      coalesce.current = { key, at: now };
      setRedo([]);
      return next;
    });
    setDirty(true);
  }, []);
  const edit = (fn, key) => { const next = clone(doc); fn(next.states[viewState], next); commit(next, key); };

  const doUndo = () => { if (!undo.length) return; setRedo((r) => [...r, doc]); setDoc(undo[undo.length - 1]); setUndo((u) => u.slice(0, -1)); setDirty(true); coalesce.current = { key: null, at: 0 }; };
  const doRedo = () => { if (!redo.length) return; setUndo((u) => [...u, doc]); setDoc(redo[redo.length - 1]); setRedo((r) => r.slice(0, -1)); setDirty(true); coalesce.current = { key: null, at: 0 }; };
  useEffect(() => {
    const h = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.target.closest?.('input,textarea,select')) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  });

  if (!flow || !doc || !def) return (<div><button type="button" className="fs-btn2" onClick={onBack}>← All flows</button><Messages m={m} /><div className="fs-empty">Loading the flow…</div></div>);

  const laneAt = (y, lanes) => lanes[Math.min(lanes.length - 1, Math.max(0, Math.floor((y + 30) / LANE_H)))]?.id || null;
  const node = sel?.kind === 'node' ? st.nodes.find((n) => n.id === sel.id) : null;
  const edgeSel = sel?.kind === 'edge' ? st.edges.find((e) => e.id === sel.id) : null;
  const scenarios = st.scenarios;
  const writable = flow.canWrite;

  const addNode = (type) => edit((s) => {
    const sh = shapeOf(def, type); const i = s.nodes.length;
    let x = 40; let y = 40;
    search: for (let row = 0; row < 40; row += 1) for (let col = 0; col < 5; col += 1) {
      x = 40 + col * 190; y = 40 + row * LANE_H;
      if (!s.nodes.some((q) => Math.abs(q.x - x) < 190 && Math.abs(q.y - y) < 110)) break search;
    }
    const id = nextId('n', s.nodes);
    s.nodes.push({ id, type, x, y, label: sh.defaultLabel, lane: null, execMode: '', concurrency: 'sequential', scenarioTags: [], meta: { base: {} }, resolves: [] });
    const n = s.nodes[s.nodes.length - 1]; n.lane = laneAt(n.y, s.lanes);
    setSel({ kind: 'node', id });
  });

  const onNodeClick = (id) => {
    if (mode === 'delete') { removeNode(id); return; }
    if (mode === 'connect') {
      if (!connectFrom) { setConnectFrom(id); m.clear(); return; }
      const from = connectFrom; setConnectFrom(null);
      edit((s) => { const eid = nextId('e', s.edges); s.edges.push({ id: eid, from, to: id, label: '', params: '', notes: '', scenarioTags: [], overlays: {} }); setSel({ kind: 'edge', id: eid }); });
      return;
    }
    setSel({ kind: 'node', id });
  };
  const removeNode = (id) => edit((s, d) => {
    s.nodes = s.nodes.filter((n) => n.id !== id); s.edges = s.edges.filter((e) => e.from !== id && e.to !== id);
    if (viewState === 'current') d.states.future.nodes.forEach((n) => { n.resolves = n.resolves.filter((r) => r.nodeId !== id); });
    setSel(null);
  });
  const removeEdge = (id) => edit((s) => { s.edges = s.edges.filter((e) => e.id !== id); setSel(null); });
  const setNode = (patch, key) => edit((s) => { const n = s.nodes.find((x) => x.id === sel.id); Object.assign(n, patch); }, key && `${key}:${sel?.id}`);
  const setEdge = (patch, key) => edit((s) => { Object.assign(s.edges.find((x) => x.id === sel.id), patch); }, key && `${key}:${sel?.id}`);
  const setField = (k, v) => edit((s) => {
    const n = s.nodes.find((x) => x.id === sel.id); n.meta = n.meta || { base: {} };
    const slot = scenario === 'base' ? 'base' : scenario; n.meta[slot] = { ...(n.meta[slot] || {}) };
    if (scenario !== 'base' && v === '') delete n.meta[slot][k]; else n.meta[slot][k] = v;
  }, `f:${sel.id}:${scenario}:${k}`);
  const setOverlay = (k, v) => edit((s) => {
    const e = s.edges.find((x) => x.id === sel.id); e.overlays = { ...(e.overlays || {}) }; e.overlays[scenario] = { ...(e.overlays[scenario] || {}) };
    if (v === '') delete e.overlays[scenario][k]; else e.overlays[scenario][k] = v;
    if (!Object.keys(e.overlays[scenario]).length) delete e.overlays[scenario];
  }, `o:${sel.id}:${scenario}:${k}`);

  const save = async () => {
    setBusy(true);
    try { const f = await api.fsSave(flowId, { doc, baseVersion: flow.version, sourceAction: 'editor' }); setFlow(f); setDoc(f.doc); setDirty(false); m.say(`Draft saved as version ${f.version}`); } catch (e) { m.fail(e); } finally { setBusy(false); }
  };
  const openPublish = async () => {
    if (dirty) { m.fail(new Error('Save your draft first. Publishing uses the saved draft, not unsaved changes.')); return; }
    try { setPreview(await api.fsPublishPreview(flowId)); setPanel('publish'); m.clear(); } catch (e) { m.fail(e); }
  };
  const doPublish = async () => {
    setBusy(true);
    try { const f = await gate.run(() => api.fsPublish(flowId, preview.token)); if (f) { setFlow(f); setPanel(null); m.say(`Published version ${f.publishedVersion}`); } } catch (e) { m.fail(e); } finally { setBusy(false); }
  };
  const openHistory = async () => { try { setHist((await api.fsHistory(flowId)).history); setPanel('history'); m.clear(); } catch (e) { m.fail(e); } };
  const restore = async (v) => {
    try { const f = await api.fsRestore(flowId, v); setFlow(f); setDoc(f.doc); setDirty(false); setUndo([]); setRedo([]); m.say(`Restored version ${v} as version ${f.version}`); setHist((await api.fsHistory(flowId)).history); } catch (e) { m.fail(e); }
  };
  const saveTemplate = async () => {
    if (dirty) { m.fail(new Error('Save your draft first. The template is made from the saved draft.')); return; }
    try { const t = await api.fsSaveTemplate(flowId, { name: tpl.name, visibility: tpl.visibility }); setPanel(null); m.say(`Template "${t.name}" saved`); } catch (e) { m.fail(e); }
  };
  const startReplace = async () => {
    if (dirty) { m.fail(new Error('Save your draft first. The template is replaced from the saved draft.')); return; }
    try { setReplaceImpact(await api.fsTemplateImpact(Number(replaceId), 'overwrite')); m.clear(); } catch (e) { m.fail(e); }
  };
  const approveReplace = async () => {
    try { const t = await api.fsOverwriteTemplate(Number(replaceId), { flowId, approved: replaceImpact.token }); setReplaceImpact(null); setReplaceId(''); setPanel(null); m.say(`Template "${t.name}" replaced`); } catch (e) { m.fail(e); }
  };
  const askAgent = async () => {
    try {
      const body = sel?.kind === 'edge' ? { kind: 'edge', label: edgeSel?.label, prompt: agent.prompt } : { kind: 'node', label: node?.label, type: node?.type, prompt: agent.prompt };
      const r = await api.fsAgentDraft(flowId, body); setAgent((a) => ({ ...a, draft: r.draft, note: r.note })); m.clear();
    } catch (e) { m.fail(e); }
  };
  const applyDraft = () => {
    if (!agent.draft) return;
    if (sel?.kind === 'edge') edit((s) => { const e = s.edges.find((x) => x.id === sel.id); for (const [k, v] of Object.entries(agent.draft)) if (v) e[k] = v; });
    else edit((s) => { const n = s.nodes.find((x) => x.id === sel.id); const slot = scenario === 'base' ? 'base' : scenario; n.meta[slot] = { ...(n.meta[slot] || {}) }; for (const [k, v] of Object.entries(agent.draft)) if (v) n.meta[slot][k] = v; });
    setAgent({ prompt: '', draft: null, note: '' }); m.say('Draft applied. Review it, then save the draft.');
  };

  const currentProblems = doc.states.current.nodes.flatMap((n) => def.resolveKinds.filter((k) => hasField(n.meta?.base, k.field)).map((k) => ({ nodeId: n.id, kind: k.key, label: `${n.label || n.id}: ${k.label}` })));
  const exportBase = `/api/flow-studio/flows/${flowId}/export`;

  return (
    <div data-testid="fs-editor">
      <div className="fs-row">
        <button type="button" className="fs-btn2" onClick={onBack}>← All flows</button>
        <label className="fs-label" style={{ flex: '1 1 220px' }}>Flow name
          <input className="fs-input" value={doc.name} disabled={!writable} onChange={(e) => { const next = clone(doc); next.name = e.target.value; commit(next, 'name'); }} />
        </label>
        <label className="fs-label" style={{ flex: '1 1 180px' }}>Domain or channel (L1)
          <input className="fs-input" value={doc.domain} disabled={!writable} onChange={(e) => { const next = clone(doc); next.domain = e.target.value; commit(next, 'domain'); }} />
        </label>
      </div>
      <p className="fs-sub" data-testid="fs-status-line">Version {flow.version} · {flow.status}{dirty ? ' · unsaved changes' : ''}{writable ? '' : ' · read only'}</p>
      <Messages m={m} />
      <div className="fs-row">
        <button type="button" className="fs-btn" onClick={save} disabled={!writable || !dirty || busy}>Save draft</button>
        <button type="button" className="fs-btn2" onClick={doUndo} disabled={!undo.length}>Undo</button>
        <button type="button" className="fs-btn2" onClick={doRedo} disabled={!redo.length}>Redo</button>
        <button type="button" className="fs-btn2" onClick={openPublish} disabled={!writable}>Publish</button>
        <button type="button" className="fs-btn2" onClick={openHistory}>History</button>
        <button type="button" className="fs-btn2" aria-pressed={panel === 'export'} onClick={() => setPanel(panel === 'export' ? null : 'export')}>Export</button>
        <button type="button" className="fs-btn2" aria-pressed={panel === 'template'} onClick={() => { setTpl({ name: `${doc.name} template`, visibility: 'private' }); setReplaceId(''); setReplaceImpact(null); api.fsFlows().then((d) => setMyTemplates(d.templates.filter((t) => !t.seed && (t.ownerId === d.meId || d.meRole === 'admin')))).catch((e) => m.fail(e)); setPanel(panel === 'template' ? null : 'template'); }}>Save as template</button>
      </div>

      {panel === 'export' ? (
        <div className="fs-card" aria-label="Export"><h3>Export</h3>
          <div className="fs-row">
            <a className="fs-btn2" href={`${exportBase}?format=json`} download>Export JSON</a>
            <a className="fs-btn2" href={`${exportBase}?format=html`} download>Export HTML viewer</a>
            <a className="fs-btn2" href={`${exportBase}?format=journey&state=future`} download>Export journey definition</a>
          </div>
          <p className="fs-muted">Saved draft only (version {flow.version}). The HTML viewer is one file that opens without a network. The journey definition lists gates, variants, actors, authority and experience bindings.</p>
        </div>
      ) : null}
      {panel === 'template' ? (
        <div className="fs-card" aria-label="Save as template"><h3>Save as template</h3>
          <div className="fs-row">
            <label className="fs-label">Template name<input className="fs-input" value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} /></label>
            <label className="fs-label">Who can use it
              <select className="fs-input" value={tpl.visibility} onChange={(e) => setTpl({ ...tpl, visibility: e.target.value })}>
                <option value="private">Only me</option>
                {canShare ? <option value="org">My organization</option> : null}
                {canShare ? <option value="platform">Whole platform</option> : null}
              </select></label>
            <button type="button" className="fs-btn" onClick={saveTemplate}>Save template</button>
          </div>
          <div className="fs-row">
            <label className="fs-label">Or replace an existing template with this flow
              <select className="fs-input" aria-label="Template to replace" value={replaceId} onChange={(e) => { setReplaceId(e.target.value); setReplaceImpact(null); }}>
                <option value="">Choose a template…</option>
                {myTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></label>
            <button type="button" className="fs-btn2" disabled={!replaceId} onClick={startReplace}>Replace template</button>
          </div>
          {replaceImpact ? <ImpactBox title="Impact of replacing the template" impact={replaceImpact} approveLabel="Approve and replace" onApprove={approveReplace} onCancel={() => setReplaceImpact(null)} /> : null}
        </div>
      ) : null}
      {panel === 'publish' && preview ? (
        <ImpactBox title="Impact of publishing" impact={preview} approveLabel="Approve and publish" disabled={preview.blocked || busy} onApprove={doPublish} onCancel={() => setPanel(null)}>
          {preview.findings.length ? <ul>{preview.findings.map((f, i) => <li key={i}><span className={`fs-pill ${f.severity}`}>{f.severity}</span> {f.message}</li>)}</ul> : null}
        </ImpactBox>
      ) : null}
      {panel === 'history' && hist ? (
        <div className="fs-card" aria-label="History"><h3>History</h3>
          <ol data-testid="fs-history" style={{ paddingLeft: '1.1rem' }}>
            {hist.map((h) => (
              <li key={h.id} style={{ marginBottom: '.4rem' }}>
                <strong>{h.type.replace('flow_', '').replace(/_/g, ' ')}</strong>{h.version ? ` v${h.version}` : ''} · source action: <span className="fs-pill">{h.sourceAction || 'none'}</span> · {h.actor?.label || 'unknown'} · {new Date(h.at).toISOString().slice(0, 16).replace('T', ' ')} UTC{h.note ? ` · ${h.note}` : ''}
                {h.hasDocument && writable ? <> <button type="button" className="fs-btn2" style={{ minHeight: 44 }} onClick={() => restore(h.version)}>Restore v{h.version}</button></> : null}
                {h.impact?.lines ? <ul>{h.impact.lines.map((l, i) => <li key={i} className="fs-muted">{l}</li>)}</ul> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="fs-row">
        {def.states.map((s2) => (
          <button key={s2.key} type="button" className="fs-btn2" aria-pressed={viewState === s2.key} onClick={() => { setViewState(s2.key); setScenario('base'); setSel(null); setConnectFrom(null); }}>{s2.label}</button>
        ))}
        <label className="fs-label">Scenario
          <select className="fs-input" value={scenario} onChange={(e) => setScenario(e.target.value)} aria-label="Scenario">
            <option value="base">Base (L2)</option>
            {scenarios.map((x) => <option key={x} value={x}>{x}</option>)}
          </select></label>
        <label className="fs-label">New scenario name<input className="fs-input" value={newScenario} onChange={(e) => setNewScenario(e.target.value)} /></label>
        <button type="button" className="fs-btn2" disabled={!writable || !newScenario.trim()} onClick={() => { const nm = newScenario.trim(); if (scenarios.includes(nm)) { m.fail(new Error(`A scenario called "${nm}" already exists. Pick another name.`)); return; } edit((s) => { s.scenarios.push(nm); }); setScenario(nm); setNewScenario(''); }}>Add scenario</button>
        <button type="button" className="fs-btn2" aria-pressed={panel === 'lanes'} onClick={() => setPanel(panel === 'lanes' ? null : 'lanes')}>Lanes</button>
      </div>
      {panel === 'lanes' ? (
        <div className="fs-card" aria-label="Lanes"><h3>Swimlanes ({def.states.find((s2) => s2.key === viewState).label})</h3>
          {st.lanes.map((l, i) => (
            <div className="fs-row" key={l.id}>
              <label className="fs-label">Lane {i + 1} name<input className="fs-input" value={l.label} disabled={!writable} onChange={(e) => edit((s) => { s.lanes[i].label = e.target.value; }, `lane:${l.id}`)} /></label>
            </div>
          ))}
          <div className="fs-row">
            <button type="button" className="fs-btn2" disabled={!writable || st.lanes.length >= def.limits.maxLanes} onClick={() => edit((s) => { s.lanes.push({ id: nextId('lane', s.lanes), label: `Lane ${s.lanes.length + 1}` }); })}>Add lane</button>
            <button type="button" className="fs-btn2" disabled={!writable || st.lanes.length <= 1} onClick={() => edit((s) => { const last = s.lanes[s.lanes.length - 1]; s.lanes.pop(); s.nodes.forEach((n) => { if (n.lane === last.id) n.lane = s.lanes[s.lanes.length - 1].id; }); })}>Remove last lane</button>
          </div>
        </div>
      ) : null}

      <div className="fs-row" aria-label="Shapes and modes">
        {def.shapeTypes.map((s2) => <button key={s2.key} type="button" className="fs-btn2" disabled={!writable} onClick={() => addNode(s2.key)}>Add {s2.label}</button>)}
        <button type="button" className="fs-btn2" aria-pressed={mode === 'select'} onClick={() => { setMode('select'); setConnectFrom(null); }}>Select</button>
        <button type="button" className="fs-btn2" aria-pressed={mode === 'connect'} onClick={() => { setMode(mode === 'connect' ? 'select' : 'connect'); setConnectFrom(null); }}>Connect</button>
        <button type="button" className="fs-btn2" aria-pressed={mode === 'delete'} onClick={() => { setMode(mode === 'delete' ? 'select' : 'delete'); setConnectFrom(null); }}>Delete mode</button>
      </div>
      {mode === 'connect' ? <p className="fs-muted" role="status" data-testid="fs-mode-hint">{connectFrom ? 'Now tap the step the arrow should point to. Tap the same step again for a loop.' : 'Tap the step the arrow starts from.'}</p> : null}
      {mode === 'delete' ? <p className="fs-muted" role="status">Tap a step to delete it and its connectors.</p> : null}

      <div className="fs-edit">
        <div>
          <Canvas def={def} st={st} scenario={scenario} selection={sel} mode={mode} connectFrom={connectFrom}
            onSelect={(s2) => { if (mode === 'delete' && s2?.kind === 'edge') { removeEdge(s2.id); return; } setSel(s2); }}
            onMoveStart={() => { setUndo((u) => [...u.slice(-99), doc]); setRedo([]); coalesce.current = { key: null, at: 0 }; }}
            onMove={(id, x, y) => setDoc((prev) => { const next = clone(prev); const n = next.states[viewState].nodes.find((q) => q.id === id); n.x = x; n.y = y; return next; })}
            onMoveEnd={(id) => { setDoc((prev) => { const next = clone(prev); const s = next.states[viewState]; const n = s.nodes.find((q) => q.id === id); n.lane = laneAt(n.y, s.lanes); return next; }); setDirty(true); }}
            onNodeClick={onNodeClick}
            onNudge={(id, dx, dy) => edit((s) => { const n = s.nodes.find((q) => q.id === id); n.x = Math.max(0, n.x + dx); n.y = Math.max(0, n.y + dy); n.lane = laneAt(n.y, s.lanes); }, `nudge:${id}`)} />
          <div className="fs-card" style={{ marginTop: '.8rem' }} aria-label="Steps and connectors" data-testid="fs-outline">
            <h3>Steps and connectors</h3>
            <p className="fs-muted">The same flow as a list. Tap an item to select it, which is easier than the drawing on a phone. In Connect mode, tap two steps here to join them.</p>
            {st.nodes.length === 0 ? <p className="fs-muted">No steps yet. Use the Add buttons above.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {st.nodes.map((n) => (
                  <li key={n.id} style={{ marginBottom: '.3rem' }}>
                    <button type="button" className="fs-btn2" style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }} aria-pressed={sel?.kind === 'node' && sel.id === n.id} aria-label={`List step: ${n.label || '(no label)'}`} onClick={() => onNodeClick(n.id)}>
                      {shapeOf(def, n.type).label}: {n.label || '(no label)'}
                    </button>
                    {st.edges.filter((e) => e.from === n.id).map((e) => (
                      <button key={e.id} type="button" className="fs-btn2" style={{ width: 'calc(100% - 1.5rem)', marginLeft: '1.5rem', marginTop: '.2rem', justifyContent: 'flex-start', textAlign: 'left' }} aria-pressed={sel?.kind === 'edge' && sel.id === e.id} aria-label={`List connector: ${n.label || '(no label)'} to ${st.nodes.find((q) => q.id === e.to)?.label || '(no label)'}`} onClick={() => { if (mode === 'delete') removeEdge(e.id); else setSel({ kind: 'edge', id: e.id }); }}>
                        → {st.nodes.find((q) => q.id === e.to)?.label || '(no label)'}{e.label ? ` (${e.label})` : ''}{e.from === e.to ? ' [loop]' : ''}
                      </button>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="fs-card" style={{ marginTop: '.8rem' }} aria-label="Flow check">
            <h3>Check flow <span className={`fs-pill ${errorCount ? 'error' : findings.length ? 'warning' : 'ok'}`} data-testid="fs-check-count">{findings.length === 0 ? 'no problems' : `${errorCount} error(s), ${findings.length - errorCount} warning(s)`}</span></h3>
            {findings.length ? <ul className="fs-find" data-testid="fs-findings">{findings.map((f, i) => (
              <li key={i}><span className={`fs-pill ${f.severity}`}>{f.severity}</span> {f.message}{f.nodeId && f.state === viewState ? <> <button type="button" className="fs-btn2" style={{ minHeight: 44 }} onClick={() => setSel({ kind: 'node', id: f.nodeId })}>Show</button></> : null}</li>
            ))}</ul> : <p className="fs-muted">Every step is connected and every gate has two or more branches.</p>}
          </div>
        </div>

        <div className="fs-side fs-card" aria-label="Inspector">
          {!node && !edgeSel ? <div className="fs-empty">Select a step or a connector to edit it. Tap Connect, then two steps, to draw an arrow.</div> : null}
          {node ? (
            <div data-testid="fs-node-panel">
              <h3>Step: {node.label || '(no label)'}</h3>
              <label className="fs-label">Label<input className="fs-input" value={node.label} disabled={!writable} onChange={(e) => setNode({ label: e.target.value }, 'label')} /></label>
              <label className="fs-label">Shape
                <select className="fs-input" value={node.type} disabled={!writable} onChange={(e) => setNode({ type: e.target.value })}>{def.shapeTypes.map((s2) => <option key={s2.key} value={s2.key}>{s2.label}</option>)}</select></label>
              <label className="fs-label">Execution
                <select className="fs-input" value={node.execMode} disabled={!writable} onChange={(e) => setNode({ execMode: e.target.value })}>{def.execModes.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
              <label className="fs-label">Dependency
                <select className="fs-input" value={node.concurrency} disabled={!writable} onChange={(e) => setNode({ concurrency: e.target.value })}>{def.concurrencyModes.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
              <label className="fs-label">Scenario tags (comma separated, empty = shared L2 step)
                <input className="fs-input" aria-label="Scenario tags" value={node.scenarioTags.join(', ')} disabled={!writable} onChange={(e) => setNode({ scenarioTags: parseTags(e.target.value) }, 'tags')} /></label>
              {viewState === 'future' ? (
                <fieldset style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '.5rem 0', padding: '.5rem .6rem' }}>
                  <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>Resolves Current-state problems</legend>
                  {node.resolves.length === 0 ? <p className="fs-muted">None linked.</p> : <ul>{node.resolves.map((r, i) => {
                    const t = doc.states.current.nodes.find((c) => c.id === r.nodeId); const k = def.resolveKinds.find((x) => x.key === r.kind);
                    return <li key={i}>{t?.label || r.nodeId}: {k?.label || r.kind} <button type="button" className="fs-btn2" style={{ minHeight: 44 }} disabled={!writable} onClick={() => setNode({ resolves: node.resolves.filter((_, j) => j !== i) })}>Remove link</button></li>;
                  })}</ul>}
                  {currentProblems.length === 0 ? <p className="fs-muted">No Current-state step has a pain point, handover gap or leakage recorded yet.</p> : (
                    <label className="fs-label">Link a Current-state problem
                      <select className="fs-input" aria-label="Link a Current-state problem" value="" disabled={!writable} onChange={(e) => { const p = currentProblems[Number(e.target.value)]; if (p && !node.resolves.some((r) => r.nodeId === p.nodeId && r.kind === p.kind)) setNode({ resolves: [...node.resolves, { nodeId: p.nodeId, kind: p.kind }] }); }}>
                        <option value="">Choose…</option>
                        {currentProblems.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                      </select></label>
                  )}
                </fieldset>
              ) : null}
              <FieldEditor def={def} node={node} viewState={viewState} scenario={scenario} onField={writable ? setField : () => {}}
                onCopyBase={() => edit((s) => { const n = s.nodes.find((x) => x.id === sel.id); n.meta[scenario] = { ...(n.meta.base || {}) }; })}
                onClear={() => edit((s) => { const n = s.nodes.find((x) => x.id === sel.id); delete n.meta[scenario]; })} />
              <fieldset style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '.5rem 0', padding: '.5rem .6rem' }}>
                <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>Draft with agent</legend>
                <label className="fs-label">What should it draft?<input className="fs-input" aria-label="Agent request" value={agent.prompt} onChange={(e) => setAgent({ ...agent, prompt: e.target.value })} /></label>
                <div className="fs-row" style={{ marginTop: '.4rem' }}><button type="button" className="fs-btn2" disabled={!writable} onClick={askAgent}>Draft with agent</button></div>
                {agent.draft ? (<div data-testid="fs-agent-draft"><p className="fs-muted">{agent.note}</p><ul>{Object.entries(agent.draft).map(([k, v]) => <li key={k}><strong>{def.fields.find((f) => f.key === k)?.label || k}</strong>: {v || '(empty)'}</li>)}</ul>
                  <div className="fs-row"><button type="button" className="fs-btn" onClick={applyDraft}>Apply draft</button><button type="button" className="fs-btn2" onClick={() => setAgent({ prompt: '', draft: null, note: '' })}>Discard draft</button></div></div>) : null}
              </fieldset>
              <button type="button" className="fs-btn2" disabled={!writable} onClick={() => removeNode(node.id)}>Delete step</button>
            </div>
          ) : null}
          {edgeSel ? (
            <div data-testid="fs-edge-panel">
              <h3>Connector: {st.nodes.find((n) => n.id === edgeSel.from)?.label} → {st.nodes.find((n) => n.id === edgeSel.to)?.label}</h3>
              {edgeSel.from === edgeSel.to ? <p className="fs-muted">This connector is a self-loop (a repeating sub-process).</p> : null}
              <label className="fs-label">Path label<input className="fs-input" aria-label="Path label" value={edgeSel.label} disabled={!writable} onChange={(e) => setEdge({ label: e.target.value }, 'elabel')} /></label>
              <label className="fs-label">Branch parameters<textarea className="fs-input" aria-label="Branch parameters" value={edgeSel.params} disabled={!writable} onChange={(e) => setEdge({ params: e.target.value }, 'eparams')} /></label>
              <label className="fs-label">Owner, SLA or exception notes<textarea className="fs-input" aria-label="Branch notes" value={edgeSel.notes} disabled={!writable} onChange={(e) => setEdge({ notes: e.target.value }, 'enotes')} /></label>
              <label className="fs-label">Scenario tags (comma separated)<input className="fs-input" aria-label="Connector scenario tags" value={edgeSel.scenarioTags.join(', ')} disabled={!writable} onChange={(e) => setEdge({ scenarioTags: parseTags(e.target.value) }, 'etags')} /></label>
              {scenario !== 'base' ? (
                <fieldset style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '.5rem 0', padding: '.5rem .6rem' }} data-testid="fs-overlay">
                  <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>Overrides for {scenario}</legend>
                  {['label', 'params', 'notes'].map((k) => (
                    <label className="fs-label" key={k}>{k === 'label' ? 'Path label' : k === 'params' ? 'Branch parameters' : 'Notes'} in {scenario}
                      <input className="fs-input" aria-label={`${k === 'label' ? 'Path label' : k === 'params' ? 'Branch parameters' : 'Notes'} in ${scenario}`} value={edgeSel.overlays?.[scenario]?.[k] ?? ''} placeholder={edgeSel[k]} disabled={!writable} onChange={(e) => setOverlay(k, e.target.value)} /></label>
                  ))}
                </fieldset>
              ) : null}
              <fieldset style={{ border: '1px solid var(--fs-line)', borderRadius: 8, margin: '.5rem 0', padding: '.5rem .6rem' }}>
                <legend style={{ fontSize: '.78rem', fontWeight: 700 }}>Draft with agent</legend>
                <label className="fs-label">What should it draft?<input className="fs-input" aria-label="Agent request" value={agent.prompt} onChange={(e) => setAgent({ ...agent, prompt: e.target.value })} /></label>
                <div className="fs-row" style={{ marginTop: '.4rem' }}><button type="button" className="fs-btn2" disabled={!writable} onClick={askAgent}>Draft with agent</button></div>
                {agent.draft ? (<div data-testid="fs-agent-draft"><p className="fs-muted">{agent.note}</p><ul>{Object.entries(agent.draft).map(([k, v]) => <li key={k}><strong>{k}</strong>: {v || '(empty)'}</li>)}</ul>
                  <div className="fs-row"><button type="button" className="fs-btn" onClick={applyDraft}>Apply draft</button><button type="button" className="fs-btn2" onClick={() => setAgent({ prompt: '', draft: null, note: '' })}>Discard draft</button></div></div>) : null}
              </fieldset>
              <button type="button" className="fs-btn2" disabled={!writable} onClick={() => removeEdge(edgeSel.id)}>Delete connector</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Settings (the definition) ───────────────────────────────────────────────
function Settings({ m, definition, onSaved }) {
  const [d, setD] = useState(() => clone(definition));
  const [note, setNote] = useState('');
  const [impact, setImpact] = useState(null);
  useEffect(() => { setD(clone(definition)); }, [definition]);
  const upd = (path, fn) => setD((prev) => { const n = clone(prev); fn(n); return n; });
  const save = async (approved) => {
    try {
      const r = await api.fsSaveDefinition(d, note, approved);
      setImpact(null); setNote(''); onSaved(r.definition); m.say(`Definition saved as version ${r.version}`);
    } catch (e) { if (e.body?.code === 'impact_approval_required') { setImpact(e.body.impact); m.clear(); } else m.fail(e); }
  };
  const reset = async () => { try { const r = await api.fsResetDefinition('Reset to the platform default'); onSaved(r.definition); m.say(`Definition saved as version ${r.version}`); } catch (e) { m.fail(e); } };
  const inp = (v, on, label, type = 'text') => <input className="fs-input" type={type} aria-label={label} value={v} onChange={(e) => on(e.target.value)} />;
  const roles = ['admin', 'member'];
  const accessLabels = { create: 'Create, edit and save flows', publish: 'Publish flows', shareTemplate: 'Share templates with an organization or the platform', editDefinition: 'Change this definition' };
  return (
    <div data-testid="fs-settings">
      <p className="fs-sub">Version {definition.version}. Everything here drives the editor: the shape buttons, colours, step fields, checks and who may do what. Saving makes version {definition.version + 1}.</p>
      <Messages m={m} />
      <div className="fs-card"><h3>Shape types</h3>
        <div className="fs-scroll"><table className="fs-table"><thead><tr><th>Key</th><th>Label</th><th>Drawing</th><th>Fill</th><th>Outline</th><th>Text</th><th>Depth</th><th>Width</th><th>Height</th><th>Gate</th><th>Can start</th><th /></tr></thead>
          <tbody>{d.shapeTypes.map((s, i) => (
            <tr key={i}>
              <td>{inp(s.key, (v) => upd(0, (n) => { n.shapeTypes[i].key = v; }), `Shape ${i + 1} key`)}</td>
              <td>{inp(s.label, (v) => upd(0, (n) => { n.shapeTypes[i].label = v; }), `Shape ${i + 1} label`)}</td>
              <td><select className="fs-input" aria-label={`Shape ${s.key} drawing`} value={s.kind} onChange={(e) => upd(0, (n) => { n.shapeTypes[i].kind = e.target.value; })}>{['rect', 'diamond', 'circle', 'flag', 'pill'].map((k) => <option key={k}>{k}</option>)}</select></td>
              {['fill', 'stroke', 'text', 'shadow'].map((c) => <td key={c}>{inp(s[c], (v) => upd(0, (n) => { n.shapeTypes[i][c] = v; }), `Shape ${s.key} ${c} colour`)}</td>)}
              <td>{inp(String(s.w), (v) => upd(0, (n) => { n.shapeTypes[i].w = Number(v); }), `Shape ${s.key} width`, 'number')}</td>
              <td>{inp(String(s.h), (v) => upd(0, (n) => { n.shapeTypes[i].h = Number(v); }), `Shape ${s.key} height`, 'number')}</td>
              <td><input type="checkbox" aria-label={`Shape ${s.key} is a gate`} checked={!!s.branching} onChange={(e) => upd(0, (n) => { n.shapeTypes[i].branching = e.target.checked; })} style={{ width: 24, height: 24 }} /></td>
              <td><input type="checkbox" aria-label={`Shape ${s.key} can start a flow`} checked={!!s.startCapable} onChange={(e) => upd(0, (n) => { n.shapeTypes[i].startCapable = e.target.checked; })} style={{ width: 24, height: 24 }} /></td>
              <td><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.shapeTypes.splice(i, 1); })}>Remove</button></td>
            </tr>))}</tbody></table></div>
        <div className="fs-row" style={{ marginTop: '.5rem' }}><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.shapeTypes.push({ key: `shape${n.shapeTypes.length + 1}`, label: 'New shape', kind: 'rect', w: 150, h: 64, fill: '#F8F4EC', stroke: '#C7BC9E', text: '#2B2A28', shadow: '#C7BC9E', defaultLabel: 'New shape', branching: false, startCapable: false }); })}>Add shape type</button></div>
      </div>
      <div className="fs-card"><h3>Step fields</h3>
        <div className="fs-scroll"><table className="fs-table"><thead><tr><th>Key</th><th>Label</th><th>Section</th><th>Type</th><th /></tr></thead>
          <tbody>{d.fields.map((f, i) => (
            <tr key={i}>
              <td>{inp(f.key, (v) => upd(0, (n) => { n.fields[i].key = v; }), `Field ${i + 1} key`)}</td>
              <td>{inp(f.label, (v) => upd(0, (n) => { n.fields[i].label = v; }), `Field ${f.key} label`)}</td>
              <td><select className="fs-input" aria-label={`Field ${f.key} section`} value={f.section} onChange={(e) => upd(0, (n) => { n.fields[i].section = e.target.value; })}>{d.sections.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></td>
              <td><select className="fs-input" aria-label={`Field ${f.key} type`} value={f.type} onChange={(e) => upd(0, (n) => { n.fields[i].type = e.target.value; })}><option>text</option><option>textarea</option></select></td>
              <td><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.fields.splice(i, 1); })}>Remove</button></td>
            </tr>))}</tbody></table></div>
        <div className="fs-row" style={{ marginTop: '.5rem' }}><button type="button" className="fs-btn2" onClick={() => upd(0, (n) => { n.fields.push({ key: `field${n.fields.length + 1}`, section: n.sections[0].key, label: 'New field', type: 'text' }); })}>Add field</button></div>
      </div>
      <div className="fs-card"><h3>Checks</h3>
        {d.validationRules.map((r, i) => (
          <div className="fs-row" key={r.key}>
            <label className="fs-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" style={{ width: 24, height: 24 }} aria-label={`Check ${r.label} enabled`} checked={r.enabled} onChange={(e) => upd(0, (n) => { n.validationRules[i].enabled = e.target.checked; })} />{r.label}</label>
            <select className="fs-input" aria-label={`Check ${r.label} severity`} value={r.severity} onChange={(e) => upd(0, (n) => { n.validationRules[i].severity = e.target.value; })}><option>error</option><option>warning</option></select>
            <label className="fs-label" style={{ flex: '1 1 300px' }}>Message{inp(r.message, (v) => upd(0, (n) => { n.validationRules[i].message = v; }), `Check ${r.label} message`)}</label>
          </div>))}
      </div>
      <div className="fs-card"><h3>Who can do what</h3>
        {Object.keys(accessLabels).map((k) => (
          <div className="fs-row" key={k}><span style={{ flex: '1 1 260px' }}>{accessLabels[k]}</span>
            {roles.map((r) => (<label key={r} className="fs-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.4rem' }}>
              <input type="checkbox" style={{ width: 24, height: 24 }} aria-label={`${r} can ${accessLabels[k].toLowerCase()}`} checked={d.access[k].includes(r)} onChange={(e) => upd(0, (n) => { const s = new Set(n.access[k]); if (e.target.checked) s.add(r); else s.delete(r); n.access[k] = [...s]; })} />{r}</label>))}
          </div>))}
      </div>
      <div className="fs-card"><h3>Save</h3>
        <label className="fs-label">Why is it changing?<input className="fs-input" aria-label="Definition change note" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="fs-row" style={{ marginTop: '.5rem' }}>
          <button type="button" className="fs-btn" onClick={() => save()}>Save definition</button>
          <button type="button" className="fs-btn2" onClick={reset}>Reset to platform default</button>
        </div>
        {impact ? <ImpactBox title="Impact on saved flows" impact={impact} approveLabel="Approve and apply" onApprove={() => save(impact.token)} onCancel={() => setImpact(null)} /> : null}
      </div>
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────────────────
export default function FlowStudioPanel() {
  const m = useMessages();
  const [tab, setTab] = useState('flows');
  const [data, setData] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [name, setName] = useState('');
  const [startFrom, setStartFrom] = useState('blank');
  const [pasted, setPasted] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [tplImpact, setTplImpact] = useState(null);
  const fileRef = useRef(null);

  const refresh = useCallback(async () => {
    try { const [d, df] = await Promise.all([api.fsFlows(), api.fsDefinition()]); setData(d); setDefinition(df.definition); if (df.error) m.fail(new Error(df.error)); } catch (e) { m.fail(e); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [refresh]);

  const create = async () => {
    try {
      const body = { name };
      if (startFrom.startsWith('seed:')) body.templateKey = startFrom.slice(5); else if (startFrom.startsWith('tpl:')) body.templateId = Number(startFrom.slice(4));
      const f = await api.fsCreate(body); setName(''); m.say(`Flow "${f.name}" created`); await refresh(); setOpenId(f.id);
    } catch (e) { m.fail(e); }
  };
  const doImport = async (text) => {
    setImportErrors([]);
    try { const r = await api.fsImport({ payload: text }); setPasted(''); m.say(`Imported "${r.flow.name}"`); await refresh(); setOpenId(r.flow.id); } catch (e) { setImportErrors(e.body?.errors || [e.message]); m.fail(e); }
  };
  const useTemplate = async (t) => {
    try { const f = await api.fsCreate(t.seed ? { templateKey: t.key, name: t.name } : { templateId: t.id, name: t.name }); m.say(`Flow "${f.name}" created`); await refresh(); setOpenId(f.id); } catch (e) { m.fail(e); }
  };
  const startTplChange = async (t, op) => { try { setTplImpact({ t, op, ...(await api.fsTemplateImpact(t.id, op)) }); m.clear(); } catch (e) { m.fail(e); } };
  const approveTplChange = async () => {
    try { await api.fsDeleteTemplate(tplImpact.t.id, tplImpact.token); m.say(`Template "${tplImpact.t.name}" deleted`); setTplImpact(null); await refresh(); } catch (e) { m.fail(e); }
  };

  return (
    <div className="fs-root" data-testid="fs-root">
      <style>{CSS}</style>
      <h2 className="fs-h1">Journey Flow Studio</h2>
      {openId ? <FlowEditor flowId={openId} m={m} canShare={!!data?.canShareTemplate} onBack={() => { setOpenId(null); refresh(); }} /> : (
        <>
          <p className="fs-sub">Draw a process as a Current and a Future state, add the metadata that becomes the journey definition, then publish, export or reuse it as a template.</p>
          <div className="fs-tabs" role="tablist">
            {['flows', 'templates', ...(data?.canEditDefinition ? ['settings'] : [])].map((t) => (
              <button key={t} type="button" role="tab" className="fs-tab" aria-selected={tab === t} onClick={() => { setTab(t); m.clear(); refresh(); }}>{t === 'flows' ? 'Flows' : t === 'templates' ? 'Templates' : 'Settings'}</button>
            ))}
          </div>
          {tab !== 'settings' ? <Messages m={m} /> : null}
          {!data || !definition ? <div className="fs-empty">Loading…</div> : null}
          {data && tab === 'flows' ? (
            <>
              <div className="fs-card"><h3>New flow</h3>
                <div className="fs-row">
                  <label className="fs-label">New flow name<input className="fs-input" value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <label className="fs-label">Start from
                    <select className="fs-input" value={startFrom} onChange={(e) => setStartFrom(e.target.value)}>
                      <option value="blank">Blank flow</option>
                      {data.templates.map((t) => <option key={t.seed ? `seed:${t.key}` : `tpl:${t.id}`} value={t.seed ? `seed:${t.key}` : `tpl:${t.id}`}>{t.name}</option>)}
                    </select></label>
                  <button type="button" className="fs-btn" disabled={!data.canCreate} onClick={create}>Create flow</button>
                </div>
                {!data.canCreate ? <p className="fs-muted">Your role cannot create flows. An administrator can allow it in Settings.</p> : null}
              </div>
              <div className="fs-card"><h3>Import a flow</h3>
                <label className="fs-label">Paste flow JSON<textarea className="fs-input" aria-label="Paste flow JSON" value={pasted} onChange={(e) => setPasted(e.target.value)} /></label>
                <div className="fs-row" style={{ marginTop: '.5rem' }}>
                  <button type="button" className="fs-btn" disabled={!pasted.trim()} onClick={() => doImport(pasted)}>Import flow</button>
                  <label className="fs-label">Or choose a .json file<input ref={fileRef} className="fs-input" type="file" accept="application/json,.json" aria-label="Choose a flow file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await doImport(await f.text()); e.target.value = ''; } }} /></label>
                </div>
                {importErrors.length ? <div className="fs-alert" role="alert" data-testid="fs-import-errors"><ul>{importErrors.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null}
              </div>
              <h3 style={{ fontSize: '.95rem' }}>Your flows</h3>
              {data.flows.length === 0 ? <div className="fs-empty">No flows yet. Create one above, or start from a template.</div> : (
                <div className="fs-grid" data-testid="fs-flow-list">{data.flows.map((f) => (
                  <button key={f.id} type="button" className="fs-item" onClick={() => setOpenId(f.id)}>
                    <strong>{f.name}</strong><div className="fs-muted">Version {f.version} · {f.status}</div>{f.domain ? <div className="fs-muted">{f.domain}</div> : null}
                  </button>))}</div>)}
            </>
          ) : null}
          {data && tab === 'templates' ? (
            <>
              <div className="fs-grid" data-testid="fs-template-list">{data.templates.map((t) => (
                <div key={t.seed ? t.key : t.id} className="fs-card" style={{ marginBottom: 0 }}>
                  <strong>{t.name}</strong>
                  <div className="fs-muted">{t.seed ? 'Seed template' : `Template · ${t.visibility === 'org' ? 'My organization' : t.visibility === 'platform' ? 'Whole platform' : 'Only me'}`}</div>
                  <p className="fs-muted">{t.description}</p>
                  <div className="fs-row">
                    <button type="button" className="fs-btn" disabled={!data.canCreate} onClick={() => useTemplate(t)}>Use template</button>
                    <a className="fs-btn2" download href={t.seed ? `/api/flow-studio/templates/seed/${t.key}/export?format=json` : `/api/flow-studio/templates/${t.id}/export?format=json`}>Export JSON</a>
                    <a className="fs-btn2" download href={t.seed ? `/api/flow-studio/templates/seed/${t.key}/export?format=html` : `/api/flow-studio/templates/${t.id}/export?format=html`}>Export HTML viewer</a>
                    {!t.seed && (t.ownerId === data.meId || data.meRole === 'admin') ? <button type="button" className="fs-btn2" onClick={() => startTplChange(t, 'delete')}>Delete template</button> : null}
                  </div>
                </div>))}</div>
              {tplImpact ? <ImpactBox title={`Impact of deleting "${tplImpact.t.name}"`} impact={tplImpact} approveLabel="Approve and delete" onApprove={approveTplChange} onCancel={() => setTplImpact(null)} /> : null}
            </>
          ) : null}
          {data && tab === 'settings' && definition ? <Settings m={m} definition={definition} onSaved={(d) => { setDefinition(d); refresh(); }} /> : null}
        </>
      )}
    </div>
  );
}
