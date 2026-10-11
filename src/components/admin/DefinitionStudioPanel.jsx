// Definition Studio (2026-10-10) — the Composer interface. World Shell -> Journeys -> Definition Studio
// (admin). Design: docs/salt-basin-seven-layer-theory-progress.md, "Definition Studio".
//
// Three tabs:
//   Canvas          — Betsy's process flow builder, served by the platform for the chosen module or product.
//                     Everything it saves is a versioned document in the database (no browser-only storage).
//   Studio settings — what the canvas itself offers: level names, shapes, step fields, option lists,
//                     geometry sizes. Every named item has a plain name, an L-number id and a fixed API name;
//                     items are switched off, never deleted, so saved flows that use them still open.
//   History         — every saved document in this workspace and its versions; restoring adds a new version.
//
// Errors are written for the person reading them, shown inline (role="alert") and as a toast. The layout
// works at 390px: wrapping rows, card lists, 44px tap targets.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const S = {
  root: { background: '#fff', color: C.ink, borderRadius: 12, padding: '1.1rem', margin: '0 auto', fontFamily: 'DM Sans, sans-serif', fontSize: '.88rem', boxSizing: 'border-box', width: '100%', maxWidth: 1400 },
  h1: { fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: 0 },
  sub: { color: C.sec, fontSize: '.8rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  tabs: { display: 'flex', gap: '.3rem', borderBottom: `1px solid ${C.line}`, marginBottom: '1rem', flexWrap: 'wrap' },
  tab: (on) => ({ border: 0, background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink, padding: '.45rem .85rem', minHeight: 44, borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '.84rem', font: 'inherit' }),
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.9rem', marginBottom: '1rem', background: '#fff' },
  cardTitle: { fontWeight: 700, fontSize: '.92rem', marginBottom: '.35rem' },
  input: { padding: '.5rem', minHeight: 44, borderRadius: 7, border: '1px solid rgba(27,42,59,.25)', font: 'inherit', fontSize: '.86rem', background: '#fff', color: C.ink, boxSizing: 'border-box', maxWidth: '100%' },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '.5rem .95rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.84rem' },
  btn2: { border: '1px solid rgba(27,42,59,.25)', background: '#fff', color: C.ink, borderRadius: 7, padding: '.45rem .85rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.82rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.74rem', color: C.sec, minWidth: 0 },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.82rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, color: C.ink, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  ids: { fontFamily: 'ui-monospace, monospace', fontSize: '.7rem', color: C.sec },
  item: { border: `1px solid ${C.line}`, borderRadius: 8, padding: '.6rem', marginBottom: '.5rem', background: C.soft },
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.82rem' },
};
const CSS = `
.ds-root *, .ds-root { box-sizing: border-box; }
.ds-root { overflow-wrap: anywhere; }
.ds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .5rem; }
.ds-frame { width: 100%; height: calc(100vh - 230px); min-height: 640px; border: 1px solid ${C.line}; border-radius: 10px; background: #F8F4EC; }
@media (max-width: 700px) {
  .ds-root { padding: .7rem !important; border-radius: 0 !important; }
  .ds-root input, .ds-root select, .ds-root textarea { width: 100%; }
  .ds-frame { height: 70vh; min-height: 480px; }
}
`;

const GEOMETRIES = ['step', 'subprocess', 'decision', 'parallel', 'event', 'data', 'terminal'];
const OPTION_LISTS = [
  ['executionTypes', 'Execution types', 'EXEC', 'How a step gets done. Shown in the step settings on the canvas.'],
  ['concurrencyTypes', 'Concurrency types', 'CONC', 'Whether a step waits on the one before it.'],
  ['painRootCauses', 'Pain root causes', 'PAIN', 'Categories for current-state pain points.'],
];

function toApiName(name) {
  const s = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[a-z]/.test(s) ? s.slice(0, 60) : `item_${s}`.slice(0, 60);
}
function allIds(cfg) {
  const ids = [];
  cfg.levels.forEach((x) => ids.push(x.id));
  cfg.shapes.forEach((x) => ids.push(x.id));
  cfg.fieldSections.forEach((sec) => { ids.push(sec.id); (sec.fields || []).forEach((f) => ids.push(f.id)); });
  OPTION_LISTS.forEach(([k]) => cfg[k].forEach((x) => ids.push(x.id)));
  return ids;
}
// Next free L-number id, e.g. FLOW-L2-SHAPE-008.
function nextId(cfg, kind, levelId = 'FLOW-L2') {
  const prefix = `${levelId}-${kind}-`;
  const max = allIds(cfg).filter((id) => id.startsWith(prefix)).reduce((m, id) => Math.max(m, Number(id.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}
const fmt = (ms) => (ms ? new Date(ms).toLocaleString() : '—');

function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div role="alert" style={S.alert}>
      <div>{error.message}</div>
      {Array.isArray(error.details) && error.details.length > 1 && (
        <ul style={{ margin: '.35rem 0 0', paddingLeft: '1.1rem' }}>{error.details.slice(1, 8).map((d) => <li key={d}>{d}</li>)}</ul>
      )}
    </div>
  );
}

function Ids({ item, newSet }) {
  return <div style={S.ids}>{item.id} · API name {newSet.has(item.id) ? <i>{item.apiName} (fixed once saved)</i> : item.apiName}</div>;
}

// ─── Studio settings ────────────────────────────────────────────────────────────────────────────
function StudioSettings({ onSaved }) {
  const [loaded, setLoaded] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [newIds, setNewIds] = useState(() => new Set());
  // New items' API names follow their plain name until the Composer edits the API name directly.
  const [apiTouched, setApiTouched] = useState(() => new Set());
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getDefinitionStudioConfig();
      setLoaded(r); setCfg(structuredClone(r.config)); setNewIds(new Set()); setError(null);
    } catch (e) { setError(e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => loaded && cfg && JSON.stringify(loaded.config) !== JSON.stringify(cfg), [loaded, cfg]);
  if (!cfg) return error ? <ErrorBox error={error} /> : <div style={S.empty}>Loading Studio settings…</div>;

  const syncNewApiNames = (next) => {
    const visit = (item, isField) => {
      if (!newIds.has(item.id) || apiTouched.has(item.id)) return;
      const api = toApiName(item.name);
      if (api) { item.apiName = api; if (isField) item.key = api; }
    };
    next.shapes.forEach((x) => visit(x));
    next.fieldSections.forEach((sec) => { visit(sec); sec.fields.forEach((f) => visit(f, true)); });
    OPTION_LISTS.forEach(([k]) => next[k].forEach((x) => visit(x)));
  };
  const update = (fn) => setCfg((prev) => { const next = structuredClone(prev); fn(next); syncNewApiNames(next); return next; });
  const markNew = (id) => setNewIds((prev) => new Set(prev).add(id));

  const save = async () => {
    if (!note.trim()) { setError({ message: 'Add a change note saying what changed and why, then save again.' }); return; }
    setSaving(true); setError(null);
    try {
      const r = await api.saveDefinitionStudioConfig(cfg, note.trim());
      setLoaded(r); setCfg(structuredClone(r.config)); setNewIds(new Set()); setApiTouched(new Set()); setNote('');
      toast.success(`Studio settings saved as version ${r.config.version}. The canvas now uses them.`);
      onSaved?.();
    } catch (e) {
      setError({ message: e.message, details: e.body?.details });
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const textField = (label, value, onChange, props = {}) => (
    <label style={S.label}>{label}<input style={S.input} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} /></label>
  );
  const apiField = (item, onChange) => newIds.has(item.id)
    ? textField('API name (fixed once saved)', item.apiName, (v) => {
      setApiTouched((prev) => new Set(prev).add(item.id));
      onChange(toApiName(v) || v);
    })
    : null;
  const enabledToggle = (item, onChange) => (
    <label style={{ ...S.label, flexDirection: 'row', alignItems: 'center', gap: '.4rem', minHeight: 44 }}>
      <input type="checkbox" checked={item.enabled !== false} onChange={(e) => onChange(e.target.checked)} style={{ width: 20, height: 20 }} />
      {item.enabled !== false ? 'On' : 'Off (kept for saved flows)'}
    </label>
  );

  return (
    <div>
      <div style={S.note}>
        These settings shape the canvas for every module and product. Each item has a <b>plain name</b> you can change,
        an <b>L-number id</b> and an <b>API name</b> that never change. Items can be switched off but not deleted,
        so flows that already use them still open. Version {loaded.config.version}{loaded.overridden ? '' : ' (platform defaults)'}.
      </div>
      {loaded.problems?.length > 0 && (
        <div role="alert" style={S.alert}>The saved Studio settings could not be used, so the defaults are showing: {loaded.problems[0]}</div>
      )}

      <section style={S.card}>
        <div style={S.cardTitle}>Levels</div>
        <div style={S.sub}>The three levels of every flow. Rename them; the canvas always shows the L-number beside the name.</div>
        <div className="ds-grid">
          {cfg.levels.map((l, i) => (
            <div key={l.id} style={S.item}>
              {textField(`L${l.level} name`, l.name, (v) => update((c) => { c.levels[i].name = v; }), { 'aria-label': `Name for level L${l.level}` })}
              <Ids item={l} newSet={newIds} />
            </div>
          ))}
        </div>
      </section>

      <section style={S.card}>
        <div style={S.cardTitle}>Shapes on the canvas</div>
        <div style={S.sub}>What a Composer can place. A shape draws with one of the canvas geometries; its colour, name and default label are yours.</div>
        {cfg.shapes.map((s, i) => (
          <div key={s.id} style={S.item}>
            <div style={S.row}>
              {textField('Name', s.name, (v) => update((c) => { c.shapes[i].name = v; }))}
              {apiField(s, (v) => update((c) => { c.shapes[i].apiName = v; }))}
              {textField('Default label', s.defaultLabel, (v) => update((c) => { c.shapes[i].defaultLabel = v; }))}
              <label style={S.label}>Geometry
                <select style={S.input} value={s.geometry} onChange={(e) => update((c) => { c.shapes[i].geometry = e.target.value; })}>
                  {GEOMETRIES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label style={S.label}>Colour<input type="color" style={{ ...S.input, width: 64, padding: 4 }} value={s.color || '#4A7C8E'} onChange={(e) => update((c) => { c.shapes[i].color = e.target.value; })} /></label>
              {enabledToggle(s, (v) => update((c) => { c.shapes[i].enabled = v; }))}
            </div>
            {textField('Hint shown when placing it', s.hint, (v) => update((c) => { c.shapes[i].hint = v; }))}
            <Ids item={s} newSet={newIds} />
          </div>
        ))}
        <button type="button" style={S.btn2} onClick={() => update((c) => {
          const id = nextId(c, 'SHAPE');
          c.shapes.push({ id, levelId: 'FLOW-L2', apiName: `shape_${id.slice(-3)}`, name: 'New shape', geometry: 'step', defaultLabel: 'New step', color: '#4A7C8E', hint: '', enabled: true });
          markNew(id);
        })}>+ Add shape</button>
      </section>

      <section style={S.card}>
        <div style={S.cardTitle}>Step specification fields</div>
        <div style={S.sub}>The questions a Composer answers for each step in "⚙ Configure". Sections can apply to both views or only Current State / Future State.</div>
        {cfg.fieldSections.map((sec, si) => (
          <div key={sec.id} style={{ ...S.item, background: '#fff' }}>
            <div style={S.row}>
              {textField('Section name', sec.name, (v) => update((c) => { c.fieldSections[si].name = v; }))}
              {apiField(sec, (v) => update((c) => { c.fieldSections[si].apiName = v; }))}
              <label style={S.label}>Applies to
                <select style={S.input} value={sec.viewOnly || ''} onChange={(e) => update((c) => {
                  const v = e.target.value || null; c.fieldSections[si].viewOnly = v; c.fieldSections[si].fields.forEach((f) => { f.viewOnly = v; });
                })}>
                  <option value="">Both views</option><option value="current">Current State only</option><option value="future">Future State only</option>
                </select>
              </label>
              {enabledToggle(sec, (v) => update((c) => { c.fieldSections[si].enabled = v; }))}
            </div>
            <Ids item={sec} newSet={newIds} />
            {sec.fields.map((f, fi) => (
              <div key={f.id} style={{ ...S.item, marginTop: '.5rem' }}>
                <div style={S.row}>
                  {textField('Field name', f.name, (v) => update((c) => { c.fieldSections[si].fields[fi].name = v; }))}
                  {apiField(f, (v) => update((c) => { const fld = c.fieldSections[si].fields[fi]; fld.apiName = v; fld.key = v; }))}
                  <label style={S.label}>Answer type
                    <select style={S.input} value={f.type} onChange={(e) => update((c) => { c.fieldSections[si].fields[fi].type = e.target.value; })}>
                      <option value="text">Single line</option><option value="textarea">Paragraph</option>
                    </select>
                  </label>
                  {enabledToggle(f, (v) => update((c) => { c.fieldSections[si].fields[fi].enabled = v; }))}
                </div>
                {textField('Hint', f.hint, (v) => update((c) => { c.fieldSections[si].fields[fi].hint = v; }))}
                <Ids item={f} newSet={newIds} />
              </div>
            ))}
            <button type="button" style={{ ...S.btn2, marginTop: '.5rem' }} onClick={() => update((c) => {
              const id = nextId(c, 'FIELD');
              const apiName = `field_${id.slice(-3)}`;
              c.fieldSections[si].fields.push({ id, levelId: 'FLOW-L2', key: apiName, apiName, name: 'New field', type: 'textarea', hint: '', viewOnly: c.fieldSections[si].viewOnly || null, enabled: true });
              markNew(id);
            })}>+ Add field to "{sec.name}"</button>
          </div>
        ))}
        <button type="button" style={S.btn2} onClick={() => update((c) => {
          const id = nextId(c, 'FIELDSET');
          c.fieldSections.push({ id, levelId: 'FLOW-L2', apiName: `section_${id.slice(-3)}`, name: 'New section', viewOnly: null, enabled: true, fields: [] });
          markNew(id);
        })}>+ Add section</button>
      </section>

      {OPTION_LISTS.map(([key, title, kind, help]) => (
        <section key={key} style={S.card}>
          <div style={S.cardTitle}>{title}</div>
          <div style={S.sub}>{help}</div>
          {cfg[key].map((o, i) => (
            <div key={o.id} style={S.item}>
              <div style={S.row}>
                {textField('Name', o.name, (v) => update((c) => { c[key][i].name = v; }))}
                {apiField(o, (v) => update((c) => { c[key][i].apiName = v; }))}
                {enabledToggle(o, (v) => update((c) => { c[key][i].enabled = v; }))}
              </div>
              <Ids item={o} newSet={newIds} />
            </div>
          ))}
          <button type="button" style={S.btn2} onClick={() => update((c) => {
            const id = nextId(c, kind);
            c[key].push({ id, levelId: 'FLOW-L2', apiName: `${kind.toLowerCase()}_${id.slice(-3)}`, name: 'New option', enabled: true });
            markNew(id);
          })}>+ Add option</button>
        </section>
      ))}

      <section style={S.card}>
        <div style={S.cardTitle}>Geometry sizes</div>
        <div style={S.sub}>Width and height in pixels for each geometry the canvas draws (40–400).</div>
        <div className="ds-grid">
          {GEOMETRIES.map((g) => (
            <div key={g} style={S.item}>
              <div style={{ fontWeight: 600, marginBottom: '.3rem' }}>{g}</div>
              <div style={S.row}>
                {['width', 'height'].map((dim) => (
                  <label key={dim} style={S.label}>{dim}
                    <input type="number" min={40} max={400} style={{ ...S.input, width: 90 }} value={cfg.geometrySizes[g]?.[dim] ?? ''}
                      onChange={(e) => update((c) => { c.geometrySizes[g] = { ...c.geometrySizes[g], [dim]: Number(e.target.value) }; })} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={dirty ? { ...S.card, position: 'sticky', bottom: 0, zIndex: 2, boxShadow: '0 -4px 12px rgba(0,0,0,.06)' } : S.card}>
        <ErrorBox error={error} />
        <div style={S.row}>
          <label style={{ ...S.label, flex: '1 1 260px' }}>Change note (required)
            <input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What changed and why" />
          </label>
          <button type="button" style={{ ...S.btn, opacity: saving || !dirty ? 0.6 : 1 }} disabled={saving || !dirty} onClick={save}>{saving ? 'Saving…' : 'Save settings'}</button>
          <button type="button" style={S.btn2} disabled={saving || !dirty} onClick={() => { setCfg(structuredClone(loaded.config)); setNewIds(new Set()); setError(null); }}>Discard changes</button>
        </div>
        {!dirty && <div style={S.ids}>No unsaved changes.</div>}
      </section>

      {loaded.history?.length > 0 && (
        <section style={S.card}>
          <div style={S.cardTitle}>Settings history</div>
          {[...loaded.history].reverse().map((h) => (
            <div key={h.version} style={{ borderTop: `1px solid ${C.line}`, padding: '.4rem 0' }}>
              <b>Version {h.version}</b> · {fmt(h.at)} · {h.by}<div>{h.note}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────────────────────────────
const KIND_LABEL = {
  working_flow: 'Working canvas (autosave)', template: 'Template', template_index: 'Template list',
  client_instances: 'Clients', business_goals: 'Business goals', vocabulary: 'Vocabulary', other: 'Other',
};
function History({ workspace, onRestored }) {
  const [docs, setDocs] = useState(null);
  const [open, setOpen] = useState(null);
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setDocs((await api.getDefinitionStudioDocuments(workspace)).documents); setError(null); } catch (e) { setError(e); }
  }, [workspace]);
  useEffect(() => { setOpen(null); load(); }, [load]);

  const openDoc = async (key) => {
    setOpen(key);
    try { setVersions((await api.getDefinitionStudioVersions(workspace, key)).versions); setError(null); } catch (e) { setError(e); }
  };
  const restore = async (version) => {
    try {
      const r = await api.restoreDefinitionStudioVersion(workspace, open, version);
      toast.success(`Version ${version} restored as version ${r.version}. Reopen the canvas to see it.`);
      await openDoc(open); await load(); onRestored?.();
    } catch (e) { setError(e); toast.error(e.message); }
  };

  if (!docs) return error ? <ErrorBox error={error} /> : <div style={S.empty}>Loading saved documents…</div>;
  return (
    <div>
      <ErrorBox error={error} />
      {!docs.length && <div style={S.empty}>Nothing saved in this workspace yet. Work on the canvas — it saves automatically.</div>}
      {docs.map((d) => (
        <div key={d.key} style={S.item}>
          <div style={S.row}>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontWeight: 600 }}>{KIND_LABEL[d.kind] || d.kind}</div>
              <div style={S.ids}>{d.key} · version {d.currentVersion} · {fmt(d.updatedAt)}{d.updatedBy ? ` · ${d.updatedBy}` : ''}</div>
            </div>
            <button type="button" style={S.btn2} onClick={() => (open === d.key ? setOpen(null) : openDoc(d.key))}>{open === d.key ? 'Hide versions' : 'Versions'}</button>
          </div>
          {open === d.key && versions.map((v) => (
            <div key={v.version} style={{ borderTop: `1px solid ${C.line}`, padding: '.4rem 0', display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 220px' }}>
                <b>Version {v.version}</b>{v.current ? ' (current)' : ''} · {fmt(v.updatedAt)}{v.createdBy ? ` · ${v.createdBy}` : ''}
                {v.note && <div>{v.note}</div>}
              </div>
              {!v.current && <button type="button" style={S.btn2} onClick={() => restore(v.version)}>Restore this version</button>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Panel ──────────────────────────────────────────────────────────────────────────────────────
export default function DefinitionStudioPanel() {
  const [workspaces, setWorkspaces] = useState(null);
  const [workspace, setWorkspace] = useState(() => {
    try { return localStorage.getItem('sb_definition_studio_workspace') || ''; } catch { return ''; }
  });
  const [tab, setTab] = useState('canvas');
  const [frameKey, setFrameKey] = useState(0);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    try {
      const { workspaces: ws } = await api.getDefinitionStudioWorkspaces();
      setWorkspaces(ws); setError(null);
      setWorkspace((cur) => (ws.some((w) => w.workspaceKey === cur) ? cur : (ws[0]?.workspaceKey || '')));
    } catch (e) { setError(e); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { if (workspace) localStorage.setItem('sb_definition_studio_workspace', workspace); } catch { /* storage unavailable */ } }, [workspace]);

  const current = workspaces?.find((w) => w.workspaceKey === workspace);
  const canvasUrl = workspace ? `/api/definition-studio/canvas?workspace=${encodeURIComponent(workspace)}` : null;

  const create = async () => {
    if (!newName.trim()) { setError({ message: 'Give the new product a name, then create it.' }); return; }
    setCreating(true);
    try {
      const { product } = await api.createDefinitionStudioProduct({ name: newName.trim(), description: newDesc.trim() });
      toast.success(`Created ${product.name} (${product.id}). You're now composing it.`);
      setNewName(''); setNewDesc(''); setShowNew(false);
      await load(); setWorkspace(product.workspaceKey); setTab('canvas');
    } catch (e) { setError(e); toast.error(e.message); } finally { setCreating(false); }
  };

  return (
    <div className="ds-root" style={S.root}>
      <style>{CSS}</style>
      <h1 style={S.h1}>Definition Studio</h1>
      <p style={S.sub}>
        Compose a module or a brand-new product: its flows, steps, decisions, scenarios, Current and Future State,
        clients and goals. Everything saves to Salt Basin automatically, with every version kept.
      </p>
      <ErrorBox error={error} />

      <div style={S.row}>
        <label style={{ ...S.label, flex: '1 1 280px' }}>Working on
          <select style={S.input} value={workspace} onChange={(e) => { setWorkspace(e.target.value); setFrameKey((k) => k + 1); }} aria-label="Module or product">
            {!workspaces && <option>Loading…</option>}
            {workspaces && <optgroup label="Salt Basin modules">{workspaces.filter((w) => w.kind === 'module').map((w) => <option key={w.workspaceKey} value={w.workspaceKey}>{w.name}</option>)}</optgroup>}
            {workspaces?.some((w) => w.kind === 'product') && <optgroup label="Products composed here">{workspaces.filter((w) => w.kind === 'product').map((w) => <option key={w.workspaceKey} value={w.workspaceKey}>{w.name} · {w.id}</option>)}</optgroup>}
          </select>
        </label>
        <button type="button" style={S.btn2} onClick={() => setShowNew((v) => !v)}>{showNew ? 'Cancel' : '+ New product'}</button>
      </div>
      {current && <div style={S.ids}>{current.kind === 'module' ? 'Module' : `Product ${current.id}`} · API name {current.apiName}{current.description ? ` · ${current.description}` : ''}</div>}

      {showNew && (
        <section style={{ ...S.card, marginTop: '.6rem' }}>
          <div style={S.cardTitle}>New product</div>
          <div style={S.sub}>A new product gets its own L-number id and API name, and its own workspace to compose in. It does not become something customers can be granted until it is added to the module list in a separate, reviewed step.</div>
          <div style={S.row}>
            <label style={{ ...S.label, flex: '1 1 220px' }}>Name<input style={S.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Portfolio Company Onboarding" /></label>
            <label style={{ ...S.label, flex: '2 1 280px' }}>What it is for (optional)<input style={S.input} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} /></label>
            <button type="button" style={S.btn} disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create product'}</button>
          </div>
          {newName.trim() && <div style={S.ids}>API name will be {toApiName(newName)}</div>}
        </section>
      )}

      <div role="tablist" style={{ ...S.tabs, marginTop: '.8rem' }}>
        {[['canvas', 'Canvas'], ['settings', 'Studio settings'], ['history', 'History']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'canvas' && (canvasUrl ? (
        <div>
          <div style={{ ...S.row, justifyContent: 'space-between' }}>
            <div style={S.ids}>Tip: on a phone, use "Open full screen" — the canvas needs room to work.</div>
            <a href={canvasUrl} target="_blank" rel="noopener" style={{ ...S.btn2, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Open full screen</a>
          </div>
          <iframe key={`${workspace}-${frameKey}`} title={`Definition Studio canvas — ${current?.name || ''}`} className="ds-frame" src={canvasUrl} />
        </div>
      ) : <div style={S.empty}>Choose a module or product to start.</div>)}
      {tab === 'settings' && <StudioSettings onSaved={() => setFrameKey((k) => k + 1)} />}
      {tab === 'history' && workspace && <History workspace={workspace} onRestored={() => setFrameKey((k) => k + 1)} />}
    </div>
  );
}
