// Render bindings: the Data map for any rendered object, the Pending changes queue, and binding Settings
// (2026-10-09, docs/changes/render-bindings.md). A rendering only draws values bound to a source field; this
// screen shows every binding (source, freshness, policy), lets a permitted role change a value live or propose it
// for approval, shows the proposed value as a ghost, shows the impact of a change before it is approved, and
// replays history with a time slider. Errors are always shown inline (role="alert") and never swallowed.
// Approving goes through useToolCategoryGate().run like every other finalize path.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';

const CSS = `
.rb-root { --rb-ink:#1b2a3b; --rb-sec:#536173; --rb-line:#e5ded3; --rb-soft:#f6f2ea; --rb-bg:#ffffff; --rb-accent:#c4843a; --rb-teal:#2e7f9c; --rb-bad:#a5391f; --rb-ok:#2f7d4f; --rb-human:#7a5aa6; --rb-muted:#8a96a3; --rb-alert:#fbeae5; --rb-note:#eef5f8;
  background:var(--rb-bg); color:var(--rb-ink); border-radius:12px; padding:1.1rem; max-width:1180px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.88rem; box-sizing:border-box; overflow-wrap:anywhere; }
@media (prefers-color-scheme: dark) { .rb-root { --rb-ink:#ece7de; --rb-sec:#a9b4c0; --rb-line:#33414d; --rb-soft:#1a242d; --rb-bg:#10181f; --rb-alert:#3b1d17; --rb-note:#14303b; --rb-muted:#7d8996; } }
.rb-root * { box-sizing:border-box; }
.rb-h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.rb-sub { color:var(--rb-sec); font-size:.8rem; margin:.25rem 0 .9rem; line-height:1.5; }
.rb-tabs { display:flex; gap:.3rem; border-bottom:1px solid var(--rb-line); margin-bottom:1rem; flex-wrap:wrap; }
.rb-tab { border:0; background:transparent; color:var(--rb-ink); padding:.55rem .95rem; border-radius:8px 8px 0 0; cursor:pointer; font:inherit; min-height:44px; }
.rb-tab[aria-selected="true"] { background:var(--rb-ink); color:var(--rb-bg); font-weight:700; }
.rb-card { border:1px solid var(--rb-line); border-radius:10px; padding:.9rem; margin-bottom:1rem; background:var(--rb-bg); }
.rb-card h3 { margin:0 0 .5rem; font-size:.92rem; }
.rb-btn { border:0; background:var(--rb-ink); color:var(--rb-bg); border-radius:8px; padding:.5rem .9rem; cursor:pointer; font:inherit; min-height:44px; }
.rb-btn2 { border:1px solid var(--rb-line); background:var(--rb-bg); color:var(--rb-ink); border-radius:8px; padding:.5rem .9rem; cursor:pointer; font:inherit; min-height:44px; }
.rb-btn:disabled, .rb-btn2:disabled { opacity:.5; cursor:not-allowed; }
.rb-input { padding:.5rem .6rem; border-radius:8px; border:1px solid var(--rb-line); font:inherit; background:var(--rb-bg); color:var(--rb-ink); min-height:44px; min-width:0; max-width:100%; }
.rb-row { display:flex; gap:.6rem; flex-wrap:wrap; align-items:flex-end; margin-bottom:.6rem; }
.rb-label { display:flex; flex-direction:column; gap:.2rem; font-size:.74rem; color:var(--rb-sec); }
.rb-alert { background:var(--rb-alert); border:1px solid var(--rb-bad); color:var(--rb-bad); border-radius:8px; padding:.55rem .7rem; margin:.5rem 0; font-size:.8rem; }
.rb-note { background:var(--rb-note); border:1px solid var(--rb-teal); border-radius:8px; padding:.55rem .7rem; margin:.5rem 0; font-size:.8rem; }
.rb-empty { color:var(--rb-sec); border:1px dashed var(--rb-line); border-radius:8px; padding:.8rem; font-size:.82rem; }
.rb-pill { display:inline-block; padding:.05rem .55rem; border-radius:999px; font-size:.7rem; font-weight:700; color:#fff; }
.rb-pill.live { background:var(--rb-teal); } .rb-pill.approval { background:var(--rb-accent); } .rb-pill.bad { background:var(--rb-bad); } .rb-pill.mut { background:var(--rb-muted); }
.rb-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:.8rem; }
.rb-subj { text-align:left; border:1px solid var(--rb-line); background:var(--rb-soft); color:var(--rb-ink); border-radius:12px; padding:.7rem; cursor:pointer; font:inherit; min-height:44px; display:block; width:100%; }
.rb-subj:focus-visible, .rb-btn:focus-visible, .rb-btn2:focus-visible, .rb-tab:focus-visible, .rb-input:focus-visible { outline:3px solid var(--rb-accent); outline-offset:2px; }
.rb-map { display:grid; gap:.6rem; }
.rb-chan { border:1px solid var(--rb-line); border-radius:10px; padding:.65rem .75rem; background:var(--rb-soft); }
.rb-chan.unmapped { border-style:dashed; }
.rb-chan-top { display:flex; justify-content:space-between; gap:.6rem; flex-wrap:wrap; align-items:baseline; }
.rb-val { font-weight:700; font-size:1rem; }
.rb-muted { color:var(--rb-sec); font-size:.78rem; }
.rb-src { font-family:ui-monospace,Menlo,monospace; font-size:.74rem; color:var(--rb-sec); }
.rb-facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.2rem .8rem; margin:.35rem 0; font-size:.76rem; }
.rb-ghost { margin-top:.35rem; padding:.35rem .5rem; border:1px dashed var(--rb-accent); border-radius:8px; font-size:.78rem; background:transparent; }
.rb-two { display:grid; grid-template-columns:minmax(200px,260px) 1fr; gap:1rem; align-items:start; }
.rb-feed li { margin:.2rem 0; }
.rb-slider { width:100%; min-height:44px; }
@keyframes rbpulse { 0% { opacity:.15; } 50% { opacity:.6; } 100% { opacity:.15; } }
.rb-pulse { animation:rbpulse 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .rb-pulse { animation:none; opacity:.4; } }
@media (max-width:700px) { .rb-root { padding:.8rem; } .rb-two { grid-template-columns:1fr; } .rb-input { font-size:16px; width:100%; } .rb-row > * { flex:1 1 100%; } .rb-btn, .rb-btn2 { width:100%; } .rb-tab { flex:1 1 auto; } }
`;

// Every confirmation is also shown as a status line under the heading that stays until the next action
// (the toast alone disappears after 2.4 seconds).
const Notice = createContext(() => {});

const TONE_COLOR = { good: '#2f7d4f', bad: '#a5391f', human: '#7a5aa6', muted: '#8a96a3', teal: '#2e7f9c', gold: '#c4843a' };
const fmtTime = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');

function ErrorBox({ error }) { return error ? <div role="alert" className="rb-alert">{error}</div> : null; }
const policyPill = (p) => (p === 'live' ? <span className="rb-pill live">Live</span> : <span className="rb-pill approval">Needs approval</span>);

// ── The rendering: a crystal drawn only from bound channel values. ─────────────────────────────
function chanMap(channels, ghost) {
  const m = {};
  for (const c of channels) m[c.channelKey] = ghost && c.ghost ? { ...c, ...c.ghost, mapped: c.mapped } : c;
  return m;
}
function CrystalSvg({ channels, size = 120, label }) {
  const real = chanMap(channels, false); const ghostM = chanMap(channels, true);
  const hasGhost = channels.some((c) => c.ghost);
  const draw = (m, ghost, key) => {
    const col = m['crystal.colour']; const sz = m['crystal.size']; const ring = m['crystal.ring']; const sat = m['crystal.satellites']; const pulse = m['crystal.pulse']; const badge = m['crystal.badge'];
    const fill = col?.mapped && !col.empty ? TONE_COLOR[col.tone] || TONE_COLOR.teal : TONE_COLOR.muted;
    const scale = sz?.mapped && sz.normalized != null ? 0.45 + 0.55 * sz.normalized : 0.6;
    const r = 34 * scale;
    const arc = ring?.mapped && ring.normalized != null ? ring.normalized : null;
    const circ = 2 * Math.PI * 46;
    const n = sat?.mapped && sat.count ? sat.count : 0;
    return (
      <g key={key} opacity={ghost ? 0.55 : 1} data-ghost={ghost ? 'true' : undefined}>
        {arc !== null && <circle cx="60" cy="60" r="46" fill="none" stroke={TONE_COLOR.gold} strokeWidth="4" strokeDasharray={ghost ? `3 3` : `${circ * arc} ${circ}`} strokeDashoffset={ghost ? 0 : 0} transform="rotate(-90 60 60)" opacity={ghost ? 0.9 : 1} />}
        {pulse?.mapped && pulse.normalized != null && !ghost && <circle className="rb-pulse" cx="60" cy="60" r={40 + 8 * pulse.normalized} fill="none" stroke={TONE_COLOR.gold} strokeWidth="2" />}
        <polygon points={`60,${60 - r * 1.25} ${60 + r},60 60,${60 + r * 1.25} ${60 - r},60`} fill={ghost ? 'none' : fill} stroke={fill} strokeWidth={ghost ? 2.5 : 1.5} strokeDasharray={ghost ? '5 4' : undefined} fillOpacity={0.85} />
        {Array.from({ length: Math.min(n, 12) }).map((_, i) => { const a = (i / Math.max(n, 1)) * Math.PI * 2; return <circle key={i} cx={60 + 52 * Math.cos(a)} cy={60 + 52 * Math.sin(a)} r="3.2" fill={TONE_COLOR.bad} />; })}
        {badge?.mapped && !badge.empty && <text x="60" y="116" textAnchor="middle" fontSize="10" fill="currentColor">{badge.display}</text>}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 120 124" width={size} height={size * 124 / 120} role="img" aria-label={label || 'Crystal'} style={{ color: 'inherit', maxWidth: '100%' }}>
      {hasGhost && draw(ghostM, true, 'g')}
      {draw(real, false, 'r')}
    </svg>
  );
}

// ── Data map ────────────────────────────────────────────────────────────────────────────────────
function ChannelRow({ c }) {
  if (!c.mapped) {
    return (
      <div className="rb-chan unmapped" data-testid={`chan-${c.channelKey}`}>
        <div className="rb-chan-top"><b>{c.label}</b><span className="rb-val">not mapped</span></div>
        <div className="rb-muted">{c.legend}</div>
      </div>
    );
  }
  return (
    <div className="rb-chan" data-testid={`chan-${c.channelKey}`}>
      <div className="rb-chan-top"><b>{c.label}</b><span className="rb-val">{c.display}</span></div>
      <div className="rb-muted">{c.legend}</div>
      <div className="rb-src">Source: {c.source.text}</div>
      <div className="rb-facts">
        <span>Source type: {c.source.sourceTypeLabel}</span>
        <span>Observed: {c.observedAt ? fmtTime(c.observedAt) : 'not recorded'}</span>
        <span>Confidence: {c.confidence != null ? `${Math.round(c.confidence * 100)}%` : 'not recorded'}</span>
        <span>Last changed by: {c.changedBy || 'not recorded'}</span>
        <span>Transform: {c.transform}</span>
        <span>Change policy: {policyPill(c.changePolicy)}</span>
      </div>
      {c.source.calculation && <div className="rb-muted">Calculated from: {c.source.calculation.join(' and ')}</div>}
      {c.note && <div className="rb-muted">{c.note}</div>}
      {c.ghost && c.ghost.pending.map((p) => (
        <div key={p.id} className="rb-ghost" data-testid="ghost-note">
          Pending: proposed {String(p.value)} by {p.proposedByLabel}, waiting for step {p.stepNumber} of {p.stepTotal} ({p.stepName}). Shown as a ghost: would draw {c.ghost.display}; the approved value {c.display} is still drawn.
        </div>
      ))}
      {c.writebackFailed && <div role="alert" className="rb-alert" data-testid="writeback-failed">Write-back failed: {c.writebackFailed}</div>}
    </div>
  );
}

function ChangeForm({ rendering, subjectKey, field, onDone }) {
  const { say, sayError } = useContext(Notice);
  const [val, setVal] = useState(field.value ?? (field.options ? field.options[0] : field.min ?? 0));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setVal(field.value ?? (field.options ? field.options[0] : field.min ?? 0)); }, [field.value, field.options, field.min]);
  const approvalPath = field.changePolicy === 'requires_approval';
  async function submit() {
    setBusy(true); setError('');
    try {
      const r = await api.rbChange({ renderingKey: rendering, subjectKey, portKey: field.portKey, objectKey: field.objectKey, fieldKey: field.fieldKey, value: val, note });
      say(r.mode === 'live' ? `${field.label} changed` : `${field.label} proposed, waiting for ${r.step.name}`);
      setNote('');
      await onDone(r);
    } catch (e) { setError(e.message); sayError(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="rb-chan" data-testid={`field-${field.fieldKey}`}>
      <div className="rb-chan-top"><b>{field.label}</b><span className="rb-val">{field.display}</span></div>
      <div className="rb-muted">{field.definition}</div>
      <div className="rb-facts"><span>Source: {field.portKey} &gt; {field.objectKey} &gt; {field.fieldKey}</span><span>Change policy: {policyPill(field.changePolicy)}</span><span>Draws: {field.drives.join(', ')}</span><span>Can edit: {field.editableRoles.join(', ') || 'nobody'}</span></div>
      {field.pending && <div className="rb-ghost">Waiting for approval: {String(field.pending.value)} proposed by {field.pending.proposedByLabel}, step {field.pending.stepNumber} of {field.pending.stepTotal} ({field.pending.stepName}). Decide it in Pending changes.</div>}
      {field.writebackFailed && <div role="alert" className="rb-alert">Write-back failed: {field.writebackFailed}</div>}
      {!field.canEdit ? (
        <div className="rb-muted" data-testid={`readonly-${field.fieldKey}`}>Your role cannot edit this field. Roles that can: {field.editableRoles.join(', ') || 'none (read only)'}.</div>
      ) : field.pending ? null : (
        <>
          <div className="rb-row">
            <label className="rb-label">New {field.label}
              {field.kind === 'enum'
                ? <select className="rb-input" aria-label={`New ${field.label}`} value={val} onChange={(e) => setVal(e.target.value)}>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input className="rb-input" aria-label={`New ${field.label}`} type="number" min={field.min} max={field.max} step="1" value={val} onChange={(e) => setVal(e.target.value)} />}
            </label>
            <label className="rb-label">Note (optional)<input className="rb-input" aria-label={`Note for ${field.label}`} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></label>
            <button type="button" className="rb-btn" disabled={busy} onClick={submit}>{approvalPath ? `Propose ${field.label}` : `Change ${field.label}`}</button>
          </div>
        </>
      )}
      <ErrorBox error={error} />
    </div>
  );
}

function HistoryPanel({ rendering, subjectKey, refreshKey }) {
  const [h, setH] = useState(null);
  const [at, setAt] = useState(0);
  const [error, setError] = useState('');
  const pos = useRef({ at: 0, len: 0 });
  pos.current.at = at;
  useEffect(() => {
    let live = true;
    api.rbHistory(rendering, subjectKey).then((d) => {
      if (!live) return;
      // Stay where the person put the slider; follow the newest step only if they were already on the newest one.
      const wasLatest = pos.current.len === 0 || pos.current.at >= pos.current.len - 1;
      pos.current.len = d.steps.length;
      setH(d); setAt(wasLatest ? d.steps.length - 1 : Math.min(pos.current.at, d.steps.length - 1)); setError('');
    }).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [rendering, subjectKey, refreshKey]);
  if (error) return <ErrorBox error={error} />;
  if (!h) return <div className="rb-muted">Loading history…</div>;
  const step = h.steps[Math.min(at, h.steps.length - 1)];
  return (
    <div data-testid="history">
      <label className="rb-label">Time slider
        <input className="rb-slider" type="range" min="0" max={h.steps.length - 1} step="1" value={at} onChange={(e) => setAt(Number(e.target.value))} aria-label="Time slider" aria-valuetext={`Step ${at + 1} of ${h.steps.length}: ${step.label}`} />
      </label>
      <div className="rb-muted" aria-live="polite" data-testid="slider-caption">Step {at + 1} of {h.steps.length}: {step.label}{step.at ? ` (${fmtTime(step.at)})` : ''}</div>
      <div className="rb-map" style={{ marginTop: '.5rem' }}>
        {step.channels.map((c) => (
          <div key={c.label} className="rb-chan" data-testid="slider-channel">
            <div className="rb-chan-top"><b>{c.label}</b><span className="rb-val">{c.display}</span></div>
            {c.ghost && <div className="rb-ghost">Ghost (pending): {c.ghost.display}</div>}
          </div>
        ))}
      </div>
      {step.pending.length > 0 && <div className="rb-note" data-testid="slider-pending">Pending at this point: {step.pending.join('; ')}</div>}
      <h3 style={{ margin: '1rem 0 .3rem' }}>Event log</h3>
      {h.events.length === 0 ? <div className="rb-empty">No changes recorded yet.</div> : (
        <ol className="rb-feed" style={{ paddingLeft: '1.2rem' }} data-testid="event-log">
          {h.events.map((e) => (
            <li key={e.id}>
              <span className={`rb-pill ${e.type === 'writeback_failed' ? 'bad' : e.type === 'change_proposed' ? 'approval' : 'mut'}`}>{e.type}</span> {e.text} <span className="rb-muted">{fmtTime(e.at)}</span>
              {e.impact && e.impact.length > 0 && <ul style={{ margin: '.2rem 0 0 1rem' }} data-testid="impact-snapshot"><li className="rb-muted">Impact recorded when proposed:</li>{e.impact.map((l) => <li key={l} className="rb-muted">{l}</li>)}</ul>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SubjectDetail({ rendering, subjectKey, onBack, refreshKey, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setD(await api.rbSubject(rendering, subjectKey)); setError(''); } catch (e) { setError(e.message); }
  }, [rendering, subjectKey]);
  useEffect(() => { load(); }, [load, refreshKey]);
  if (!d) return <div>{error ? <ErrorBox error={error} /> : 'Loading…'}</div>;
  return (
    <div data-testid="subject-detail">
      <button type="button" className="rb-btn2" onClick={onBack}>← All items</button>
      <h2 className="rb-h1" style={{ margin: '.7rem 0 .2rem' }}>{d.title}</h2>
      <div className="rb-sub">{d.renderingLabel} · {d.sub}</div>
      <ErrorBox error={error} />
      <div className="rb-two">
        <div className="rb-card" style={{ textAlign: 'center' }}>
          <CrystalSvg channels={d.channels} size={200} label={`Crystal for ${d.title}`} />
          <div className="rb-muted">{d.pendingCount ? `${d.pendingCount} pending change${d.pendingCount === 1 ? '' : 's'}: the dashed ghost shows the proposed value` : 'No pending changes'}</div>
        </div>
        <div>
          <div className="rb-card">
            <h3>Data map</h3>
            <div className="rb-sub" style={{ margin: '0 0 .6rem' }}>Every channel this crystal draws, and the source field it reads. A channel with no mapping draws nothing.</div>
            <div className="rb-map">{d.channels.map((c) => <ChannelRow key={c.channelKey} c={c} />)}</div>
          </div>
        </div>
      </div>
      <div className="rb-card">
        <h3>Change a value</h3>
        <div className="rb-map">
          {d.fields.length === 0 && <div className="rb-empty">No editable source fields are mapped.</div>}
          {d.fields.map((f) => <ChangeForm key={f.portKey + f.fieldKey} rendering={rendering} subjectKey={subjectKey} field={f} onDone={async () => { await load(); onChanged(); }} />)}
        </div>
      </div>
      <div className="rb-card"><h3>History</h3><HistoryPanel rendering={rendering} subjectKey={subjectKey} refreshKey={refreshKey} /></div>
    </div>
  );
}

function RenderingsTab({ refreshKey, onChanged, deepLink, clearDeepLink }) {
  const { say, sayError } = useContext(Notice);
  const [list, setList] = useState(null);
  const [active, setActive] = useState(null);
  const [view, setView] = useState(null);
  const [open, setOpen] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api.rbRenderings().then((r) => { setList(r.renderings); setActive((a) => a || r.renderings[0]?.key || null); }).catch((e) => setError(e.message)); }, []);
  useEffect(() => { if (deepLink) { setActive(deepLink.renderingKey); setOpen(deepLink.subjectKey); clearDeepLink(); } }, [deepLink, clearDeepLink]);
  const reqId = useRef(0);
  const load = useCallback(async () => {
    if (!active) return;
    const mine = ++reqId.current; // a slow answer for a rendering the user has already left must not overwrite the current one
    try { const v = await api.rbRendering(active); if (mine === reqId.current) { setView(v); setError(''); } } catch (e) { if (mine === reqId.current) setError(e.message); }
  }, [active]);
  useEffect(() => { setView(null); load(); }, [load]);
  useEffect(() => { if (refreshKey) load(); }, [refreshKey, load]);
  async function addItem() {
    setError('');
    try { const r = await api.rbAddItem(active, title); setTitle(''); say('Item added'); await load(); setOpen(r.subject.subjectKey); } catch (e) { setError(e.message); sayError(e.message); }
  }
  if (!list) return <div>{error ? <ErrorBox error={error} /> : 'Loading renderings…'}</div>;
  if (open) return <SubjectDetail rendering={active} subjectKey={open} refreshKey={refreshKey} onBack={() => { setOpen(null); load(); }} onChanged={() => { onChanged(); load(); }} />;
  return (
    <div>
      <div className="rb-row" role="group" aria-label="Rendering">
        {list.map((r) => <button key={r.key} type="button" className={active === r.key ? 'rb-btn' : 'rb-btn2'} aria-pressed={active === r.key} onClick={() => setActive(r.key)}>{r.label}</button>)}
      </div>
      <ErrorBox error={error} />
      {view && <div className="rb-sub">{view.rendering.description}</div>}
      {view?.overrideError && <ErrorBox error={view.overrideError} />}
      {view?.rendering.canAddSubjects && (
        <div className="rb-row">
          <label className="rb-label">New item title<input className="rb-input" aria-label="New item title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} /></label>
          <button type="button" className="rb-btn" onClick={addItem}>Add item</button>
        </div>
      )}
      {!view ? <div className="rb-muted">Loading…</div> : view.subjects.length === 0 ? (
        <div className="rb-empty" data-testid="no-subjects">{view.rendering.canAddSubjects ? 'No items yet. Add one above.' : 'Nothing to draw yet. Add a release and features in Release Intelligence first.'}</div>
      ) : (
        <div className="rb-grid" data-testid="subject-grid">
          {view.subjects.map((s) => (
            <button key={s.subjectKey} type="button" className="rb-subj" onClick={() => setOpen(s.subjectKey)} aria-label={`Open ${s.title}`}>
              <div style={{ textAlign: 'center' }}><CrystalSvg channels={s.channels} size={96} label={`Crystal for ${s.title}`} /></div>
              <div style={{ fontWeight: 700 }}>{s.title}</div>
              <div className="rb-muted">{s.sub}</div>
              {s.pendingCount > 0 && <div style={{ marginTop: '.25rem' }}><span className="rb-pill approval">{s.pendingCount} pending</span></div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pending changes ─────────────────────────────────────────────────────────────────────────────
function PendingCard({ p, onDecided, onOpen }) {
  const { say, sayError } = useContext(Notice);
  const [impact, setImpact] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const gate = useToolCategoryGate();
  useEffect(() => { let live = true; api.rbImpact(p.id).then((r) => live && setImpact(r.current)).catch((e) => live && setError(e.message)); return () => { live = false; }; }, [p.id, p.stepNumber]);
  async function decide(kind) {
    setBusy(true); setError('');
    try {
      const r = kind === 'approve' ? await gate.run(() => api.rbApprove(p.id, note)) : await api.rbReject(p.id, note);
      say(kind === 'reject' ? 'Change rejected' : r.decision === 'approved' ? 'Change approved and applied' : `Step approved, now waiting for ${r.nextStep.name}`);
      if (r.writeback?.status === 'failed') sayError(`Write-back failed: ${r.writeback.error}`);
      setNote(''); await onDecided();
    } catch (e) { setError(e.message); sayError(e.message); } finally { setBusy(false); }
  }
  const last = p.stepNumber === p.stepTotal;
  return (
    <div className="rb-card" data-testid="pending-card">
      <div className="rb-chan-top"><b>{p.subjectTitle} · {p.field}</b><span className="rb-pill approval">Step {p.stepNumber} of {p.stepTotal}: {p.stepName}</span></div>
      <div className="rb-muted">{p.renderingLabel} · proposed by {p.proposedByLabel} on {fmtTime(p.proposedAt)}</div>
      <div style={{ margin: '.4rem 0' }}><b>{p.field}:</b> {p.before ?? 'not set'} → <b>{String(p.value)}</b></div>
      {p.note && <div className="rb-muted">Note: {p.note}</div>}
      <div className="rb-note" data-testid="impact-list">
        <b>If approved, this changes:</b>
        {!impact ? <div>Working out the impact…</div> : (
          <ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{impact.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        )}
      </div>
      <ErrorBox error={error} />
      {p.canDecide ? (
        <div className="rb-row">
          <label className="rb-label">Decision note (optional)<input className="rb-input" aria-label="Decision note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></label>
          <button type="button" className="rb-btn" disabled={busy} onClick={() => decide('approve')}>{last ? `Approve and apply (step ${p.stepNumber} of ${p.stepTotal})` : `Approve step ${p.stepNumber} of ${p.stepTotal}`}</button>
          <button type="button" className="rb-btn2" disabled={busy} onClick={() => decide('reject')}>Reject</button>
          <button type="button" className="rb-btn2" onClick={() => onOpen(p)}>Open Data map</button>
        </div>
      ) : (
        <div className="rb-row"><span className="rb-muted">Only an administrator can approve or reject this change.</span><button type="button" className="rb-btn2" onClick={() => onOpen(p)}>Open Data map</button></div>
      )}
      {gate.modal}
    </div>
  );
}

function PendingTab({ refreshKey, onChanged, onOpen }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setRows((await api.rbPending()).pending); setError(''); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  if (!rows) return <div>{error ? <ErrorBox error={error} /> : 'Loading…'}</div>;
  return (
    <div data-testid="pending-queue">
      <div className="rb-sub">Changes to values that need approval. The approved value stays in use everywhere until a change is approved at its last step.</div>
      <ErrorBox error={error} />
      {rows.length === 0 ? <div className="rb-empty" data-testid="pending-empty">No changes are waiting for approval.</div> : rows.map((p) => <PendingCard key={`${p.id}-${p.stepNumber}`} p={p} onDecided={async () => { await load(); onChanged(); }} onOpen={onOpen} />)}
    </div>
  );
}

// ── Settings (administrators) ───────────────────────────────────────────────────────────────────
function SettingsTab() {
  const { say, sayError } = useContext(Notice);
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  const [mapSel, setMapSel] = useState({});
  const load = useCallback(async () => { try { setS(await api.rbSettings()); setError(''); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const overridesFrom = useMemo(() => {
    if (!s) return { bindings: {} };
    const out = {};
    for (const b of s.bindings) if (b.custom || !b.enabled || b.changePolicy !== b.defaultPolicy) out[b.id] = { ...(b.enabled ? {} : { enabled: false }), change_policy: b.changePolicy, ...(b.custom ? { source: b.source, legend: b.legend } : {}) };
    return { bindings: out };
  }, [s]);
  async function save(next, optimistic) {
    if (optimistic) setS((prev) => ({ ...prev, bindings: prev.bindings.map((b) => (b.id === optimistic.id ? { ...b, ...optimistic.patch } : b)) }));
    try { await api.rbSaveBindings(next); say('Binding settings saved'); await load(); } catch (e) { setError(e.message); sayError(e.message); }
  }
  function patchBinding(id, patch) {
    const bindings = { ...overridesFrom.bindings };
    const cur = s.bindings.find((b) => b.id === id);
    bindings[id] = { ...(bindings[id] || {}), change_policy: cur.changePolicy, ...(cur.enabled ? {} : { enabled: false }), ...(cur.custom ? { source: cur.source, legend: cur.legend } : {}), ...patch };
    if (bindings[id].enabled === true) delete bindings[id].enabled;
    return { bindings };
  }
  async function saveRoles(f, port, roles) {
    setS((prev) => ({ ...prev, ports: prev.ports.map((p) => (p.portKey !== port.portKey ? p : { ...p, fields: p.fields.map((x) => (x.objectKey === f.objectKey && x.fieldKey === f.fieldKey ? { ...x, editableRoles: roles } : x)) })) }));
    try { await api.rbSaveFieldRoles(port.portKey, f.objectKey, f.fieldKey, roles); say('Editable roles saved'); await load(); } catch (e) { setError(e.message); sayError(e.message); }
  }
  async function saveStep(step, patch) {
    try { await api.rbSaveStep(step.id, patch); say('Approval step saved'); await load(); } catch (e) { setError(e.message); sayError(e.message); }
  }
  if (!s) return <div>{error ? <ErrorBox error={error} /> : 'Loading settings…'}</div>;
  const rLabel = Object.fromEntries(s.renderings.map((r) => [r.key, r]));
  const allFields = s.ports.flatMap((p) => p.fields.map((f) => ({ p, f, ref: { port_key: p.portKey, object_key: f.objectKey, field_key: f.fieldKey } })));
  const unbound = s.renderings.flatMap((r) => r.channels.filter((c) => !s.bindings.some((b) => b.rendering === r.key && b.channel === c.key && b.enabled)).map((c) => ({ r, c })));
  return (
    <div data-testid="settings">
      <ErrorBox error={error} />
      {s.overrideError && <ErrorBox error={s.overrideError} />}
      <div className="rb-card">
        <h3>Bindings</h3>
        <div className="rb-sub">Each row maps one visual channel to one source field. Turn a row off and the channel shows "not mapped". Change policy decides whether a change to the source field is live or needs approval.</div>
        <div className="rb-map">
          {s.bindings.map((b) => (
            <div key={b.id} className="rb-chan" data-testid={`binding-${b.id}`}>
              <div className="rb-chan-top"><b>{rLabel[b.rendering]?.label} / {rLabel[b.rendering]?.channels.find((c) => c.key === b.channel)?.mark} {rLabel[b.rendering]?.channels.find((c) => c.key === b.channel)?.channel.toLowerCase()}</b><span className="rb-src">{b.source.port_key} &gt; {b.source.object_key} &gt; {b.source.field_key}</span></div>
              <div className="rb-muted">{b.legend}</div>
              <div className="rb-row" style={{ marginTop: '.4rem', marginBottom: 0 }}>
                <label className="rb-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem', minHeight: 44 }}>
                  <input type="checkbox" style={{ width: 24, height: 24 }} checked={b.enabled} aria-label={`Mapped: ${b.id}`} onChange={(e) => save(patchBinding(b.id, e.target.checked ? { enabled: true } : { enabled: false }), { id: b.id, patch: { enabled: e.target.checked } })} /> Mapped
                </label>
                <label className="rb-label">Change policy
                  <select className="rb-input" aria-label={`Change policy: ${b.id}`} value={b.changePolicy} onChange={(e) => save(patchBinding(b.id, { change_policy: e.target.value }), { id: b.id, patch: { changePolicy: e.target.value } })}>
                    <option value="live">Live</option><option value="requires_approval">Needs approval</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
          {unbound.map(({ r, c }) => {
            const id = `custom:${r.key}:${c.key}`;
            const sel = mapSel[id] || '';
            return (
              <div key={id} className="rb-chan unmapped" data-testid={`unbound-${id}`}>
                <div className="rb-chan-top"><b>{r.label} / {c.mark} {c.channel.toLowerCase()}</b><span className="rb-val">not mapped</span></div>
                <div className="rb-row" style={{ marginBottom: 0, marginTop: '.4rem' }}>
                  <label className="rb-label">Source field
                    <select className="rb-input" aria-label={`Source field for ${id}`} value={sel} onChange={(e) => setMapSel({ ...mapSel, [id]: e.target.value })}>
                      <option value="">Choose a field…</option>
                      {allFields.filter((x) => x.f.kind !== 'ratio').map((x) => <option key={`${x.p.portKey}.${x.f.objectKey}.${x.f.fieldKey}`} value={`${x.p.portKey}.${x.f.objectKey}.${x.f.fieldKey}`}>{x.p.portKey} &gt; {x.f.objectKey} &gt; {x.f.fieldKey}</option>)}
                    </select>
                  </label>
                  <button type="button" className="rb-btn" disabled={!sel} onClick={() => { const [port_key, object_key, field_key] = sel.split('.'); save({ bindings: { ...overridesFrom.bindings, [id]: { source: { port_key, object_key, field_key }, change_policy: 'live' } } }); }}>Map channel</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rb-row" style={{ marginTop: '.8rem' }}><button type="button" className="rb-btn2" onClick={() => save({ bindings: {} })}>Reset bindings to platform defaults</button></div>
      </div>
      <div className="rb-card">
        <h3>Who can edit each source field</h3>
        <div className="rb-sub">Enforced when a value is changed, from this screen, the API and any tool.</div>
        {s.ports.map((p) => (
          <div key={p.portKey} style={{ marginBottom: '.8rem' }}>
            <b>{p.name}</b> <span className="rb-muted">({p.portType.replace('_', ' ')}; visible to {p.viewRoles.join(', ')})</span>
            {p.fields.map((f) => (
              <div key={f.fieldKey} className="rb-row" style={{ marginTop: '.3rem', marginBottom: 0 }} data-testid={`roles-${p.portKey}-${f.fieldKey}`}>
                <span style={{ minWidth: 150 }}>{f.fieldKey}</span>
                {f.derived ? <span className="rb-muted">Derived: read only</span> : s.roles.map((role) => (
                  <label key={role} className="rb-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.4rem', minHeight: 44 }}>
                    <input type="checkbox" style={{ width: 24, height: 24 }} checked={f.editableRoles.includes(role)} aria-label={`${role} can edit ${p.portKey} ${f.fieldKey}`}
                      onChange={(e) => saveRoles(f, p, e.target.checked ? [...f.editableRoles, role] : f.editableRoles.filter((r) => r !== role))} /> {role}
                  </label>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="rb-card">
        <h3>Approval steps</h3>
        <div className="rb-sub">A change that needs approval moves through the active steps in order. It is applied only when the last step approves it.</div>
        {s.steps.map((st) => <StepEditor key={st.id} step={st} onSave={saveStep} />)}
      </div>
    </div>
  );
}

function StepEditor({ step, onSave }) {
  const [name, setName] = useState(step.name);
  const [role, setRole] = useState(step.roleLabel || '');
  const [active, setActive] = useState(step.active);
  useEffect(() => setActive(step.active), [step.active]);
  return (
    <div className="rb-row" data-testid={`step-${step.key}`}>
      <label className="rb-label">Step name<input className="rb-input" aria-label={`Step name ${step.key}`} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="rb-label">Approver role label<input className="rb-input" aria-label={`Approver role ${step.key}`} value={role} onChange={(e) => setRole(e.target.value)} /></label>
      <label className="rb-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '.4rem', minHeight: 44 }}><input type="checkbox" style={{ width: 24, height: 24 }} checked={active} aria-label={`Active ${step.key}`} onChange={(e) => { setActive(e.target.checked); onSave(step, { active: e.target.checked }); }} /> Active</label>
      <button type="button" className="rb-btn2" onClick={() => onSave(step, { name, roleLabel: role })}>Save step</button>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────────────────────────
export default function RenderBindingsPanel() {
  const [tab, setTab] = useState('renderings');
  const [me, setMe] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(null);
  const [liveNote, setLiveNote] = useState('');
  const [streamError, setStreamError] = useState('');
  const [deepLink, setDeepLink] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeApi = useMemo(() => ({
    say: (text) => { setNotice({ text, error: false }); toast.success(text); },
    sayError: (text) => { setNotice({ text, error: true }); toast.error(text); },
  }), []);
  const timer = useRef(null);
  useEffect(() => { api.me().then(({ user }) => setMe(user)).catch(() => setMe(null)); }, []);
  const refreshPending = useCallback(() => api.rbPending().then((r) => setPendingCount(r.pending.length)).catch(() => {}), []);
  useEffect(() => { refreshPending(); }, [refreshPending, refreshKey]);
  // Live fan-out: any change notice re-reads whatever is open.
  useEffect(() => {
    if (typeof EventSource === 'undefined') { setStreamError('Live updates are not supported in this browser; reload to see new values.'); return undefined; }
    const es = new EventSource('/api/render-bindings/stream', { withCredentials: true });
    es.addEventListener('change', (e) => {
      let m = {}; try { m = JSON.parse(e.data); } catch { /* shown as a generic update */ }
      setLiveNote(`Updated live: ${m.type || 'change'} by ${m.by || 'someone'}`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRefreshKey((k) => k + 1), 150);
    });
    es.onopen = () => setStreamError('');
    es.onerror = () => setStreamError('Live updates paused: reconnecting…');
    return () => { es.close(); clearTimeout(timer.current); };
  }, []);
  const isAdmin = me?.role === 'admin';
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);
  return (
    <Notice.Provider value={noticeApi}>
    <div className="rb-root" data-testid="render-bindings">
      <style>{CSS}</style>
      <h1 className="rb-h1">Render Bindings</h1>
      <div className="rb-sub">Every rendering is a view over mapped source data. Open an item to see its Data map, change a value live or send it for approval, and replay its history.</div>
      <div role="status" aria-live="polite" className="rb-muted" data-testid="live-note" style={{ minHeight: '1.2em' }}>{liveNote}</div>
      {notice && <div role={notice.error ? 'alert' : 'status'} className={notice.error ? 'rb-alert' : 'rb-note'} data-testid="action-note">{notice.text}</div>}
      <ErrorBox error={streamError} />
      <div className="rb-tabs" role="tablist" aria-label="Render bindings">
        <button type="button" role="tab" aria-selected={tab === 'renderings'} className="rb-tab" onClick={() => setTab('renderings')}>Renderings</button>
        <button type="button" role="tab" aria-selected={tab === 'pending'} className="rb-tab" onClick={() => setTab('pending')}>Pending changes{pendingCount != null ? ` (${pendingCount})` : ''}</button>
        {isAdmin && <button type="button" role="tab" aria-selected={tab === 'settings'} className="rb-tab" onClick={() => setTab('settings')}>Settings</button>}
      </div>
      {tab === 'renderings' && <RenderingsTab refreshKey={refreshKey} onChanged={bump} deepLink={deepLink} clearDeepLink={() => setDeepLink(null)} />}
      {tab === 'pending' && <PendingTab refreshKey={refreshKey} onChanged={bump} onOpen={(p) => { setDeepLink({ renderingKey: p.renderingKey, subjectKey: p.subjectKey }); setTab('renderings'); }} />}
      {tab === 'settings' && isAdmin && <SettingsTab />}
    </div>
    </Notice.Provider>
  );
}
