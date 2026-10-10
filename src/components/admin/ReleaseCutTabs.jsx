// Release loop > Releases and Session plans (docs/changes/release-cut-and-session-plans.md).
// Releases: every release, frozen ones exactly as they were cut, the open one as it stands.
// Session plans: what each session expected before it started, and the score at each merge (never filled in
// by hand; "not validated" is never shown as 0). Closing a session is a finalize path (useToolCategoryGate().run).
// Same endpoints as the release_cut_* MCP tools (server/routes/releaseCut.js).
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const S = {
  sub: { color: C.sec, fontSize: '.8rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.85rem', marginBottom: '1rem', background: '#fff', minWidth: 0 },
  cardTitle: { fontWeight: 700, fontSize: '.92rem', marginBottom: '.5rem' },
  input: { padding: '.4rem .55rem', minHeight: 44, borderRadius: 7, border: '1px solid rgba(27,42,59,.3)', font: 'inherit', fontSize: '.88rem', background: '#fff', color: C.ink, width: '100%', boxSizing: 'border-box' },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '0 1rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  btn2: { border: '1px solid rgba(27,42,59,.3)', background: '#fff', color: C.ink, borderRadius: 7, padding: '0 .9rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.76rem', color: C.sec, flex: '1 1 160px', minWidth: 0 },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.82rem' },
  meta: { color: C.sec, fontSize: '.78rem', lineHeight: 1.5 },
  pill: (color) => ({ display: 'inline-block', padding: '.05rem .55rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, color: '#fff', background: color }),
};
const Pill = ({ color, children }) => <span style={S.pill(color)}>{children}</span>;
const ErrorBox = ({ error }) => (error ? <div role="alert" style={S.alert}>{error}</div> : null);
const Field = ({ label, children }) => <label style={S.label}><span>{label}</span>{children}</label>;

// ── Releases ────────────────────────────────────────────────────────────────
function ReleaseDetail({ version, onBack }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getReleaseCutRelease(version).then(setD).catch((e) => setError(e.message)); }, [version]);
  return (
    <div>
      <button type="button" style={S.btn2} onClick={onBack}>← All releases</button>
      <ErrorBox error={error} />
      {!d ? (!error && <div>Loading…</div>) : (
        <div data-testid={`release-detail-${d.version}`}>
          <h2 style={{ fontSize: '1.05rem', margin: '.8rem 0 .2rem' }}>Release {d.version} — {d.state === 'frozen' ? 'frozen' : 'open'}</h2>
          <div style={S.meta}>{d.release}{d.title ? ` · ${d.title}` : ''}</div>
          {d.state === 'frozen'
            ? <div style={S.note}>Frozen {String(d.frozenAt).slice(0, 10)} at commit {d.frozenCommit}. This record is never rewritten.</div>
            : <div style={S.note}>This release is still open: scores are the latest validated round and change until it is cut.</div>}
          <div style={S.meta} data-testid="release-counts">{d.counts.delivered} of {d.counts.planned} features delivered · {d.counts.carried} carried{d.bugs ? ` · bugs: ${d.bugs.verified} verified, ${d.bugs.open} open` : ''}</div>
          <div style={{ ...S.cardTitle, marginTop: '1rem' }}>Features</div>
          {d.features.map((f) => (
            <div key={f.key} style={S.card} data-testid={`release-feature-${f.key}`}>
              <div><b>{f.key}</b> <Pill color={f.delivered ? C.ok : C.sec}>{f.delivered ? 'delivered' : f.status}</Pill></div>
              <div style={S.meta}>{f.title}</div>
              <div style={S.meta}>{f.kind} · {f.lastScore ? `last score ${f.lastScore} on baseline v${f.baseline ?? '?'}` : 'not validated'}</div>
            </div>
          ))}
          <div style={{ ...S.cardTitle, marginTop: '1rem' }}>Sessions</div>
          {d.sessions?.length ? d.sessions.map((s) => (
            <div key={s.session} style={S.card}><b>{s.session}</b><div style={S.meta}>{s.intent}</div></div>
          )) : <div style={S.empty}>No session plans were recorded for this release.</div>}
        </div>
      )}
    </div>
  );
}

export function ReleasesTab() {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.listReleaseCutReleases().then(setList).catch((e) => setError(e.message)); }, []);
  if (open) return <ReleaseDetail version={open} onBack={() => setOpen(null)} />;
  return (
    <div>
      <div style={S.sub}>Every release. A frozen release is exactly what was true when it was cut and is never rewritten; the open release shows where things stand now. Cutting a release is done from the repository (node scripts/release-cut.mjs); this screen shows the result.</div>
      <ErrorBox error={error} />
      {!list ? (!error && <div>Loading…</div>) : list.releases.length ? list.releases.map((r) => (
        <div key={r.version} style={S.card} data-testid={`release-${r.version}`}>
          <div><b>Release {r.version}</b> <Pill color={r.state === 'frozen' ? C.sec : C.teal}>{r.state}</Pill></div>
          <div style={S.meta}>{r.release}{r.title ? ` · ${r.title}` : ''}</div>
          <div style={S.meta}>{r.state === 'frozen' ? `${r.delivered} of ${r.planned} delivered · ${r.carried} carried · frozen ${String(r.frozenAt).slice(0, 10)}` : `Started ${String(r.startedAt).slice(0, 10)}`} · {r.sessions} session plan{r.sessions === 1 ? '' : 's'}</div>
          <div style={{ marginTop: '.5rem' }}><button type="button" style={S.btn2} onClick={() => setOpen(r.version)}>Open release {r.version}</button></div>
        </div>
      )) : <div style={S.empty}>No releases are recorded yet.</div>}
    </div>
  );
}

// ── Session plans ───────────────────────────────────────────────────────────
const EMPTY_ITEM = { feature: '', goal: '', expect: '', size: '' };

function SessionCard({ s, onChanged }) {
  const gate = useToolCategoryGate();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const last = s.merges[s.merges.length - 1] || null;
  async function merge() {
    setError('');
    try { const out = await api.recordReleaseCutMerge(s.session, {}); toast.success(out.recorded ? 'Merge recorded' : out.reason); await onChanged(); }
    catch (e) { setError(e.message); toast.error(e.message); }
  }
  async function close() {
    setError('');
    try { await gate.run(() => api.closeReleaseCutSession(s.session, { note })); toast.success('Session closed'); await onChanged(); }
    catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.card} data-testid={`session-${s.session}`}>
      <div><b>{s.session}</b> {s.closedAt ? <Pill color={C.sec}>closed</Pill> : <Pill color={C.teal}>open</Pill>}</div>
      <div style={S.meta}>{s.intent || 'No intent recorded.'}</div>
      <div style={{ marginTop: '.4rem' }}>
        {s.estimate.items.map((it, i) => {
          const r = last?.results.find((x) => x.feature === it.feature);
          const actual = r && r.passed != null ? `${r.passed}/${r.total}` : 'not validated';
          const exp = it.expect ? `${it.expect.passed}/${it.expect.total}` : 'none';
          const met = it.expect && r && r.passed != null ? (r.passed >= it.expect.passed && r.total === it.expect.total ? 'Met' : 'Missed') : null;
          return (
            <div key={`${it.feature}-${i}`} style={{ ...S.meta, borderTop: `1px solid ${C.soft}`, padding: '.35rem 0' }} data-testid={`session-item-${s.session}-${it.feature}`}>
              <b style={{ color: C.ink }}>{it.feature}</b> · size {it.size || '-'} · expected {exp} · {last ? `actual ${actual}` : 'no merge recorded'}{met ? ` · ` : ''}{met ? <Pill color={met === 'Met' ? C.ok : C.bad}>{met}</Pill> : null}
              {it.goal ? <div>{it.goal}</div> : null}
            </div>
          );
        })}
      </div>
      <div style={S.meta}>{s.merges.length} merge{s.merges.length === 1 ? '' : 's'} recorded{s.reEstimates?.length ? ` · ${s.reEstimates.length} re-estimate${s.reEstimates.length === 1 ? '' : 's'} (original kept)` : ''}{s.closeNote ? ` · ${s.closeNote}` : ''}</div>
      <ErrorBox error={error} />
      {!s.closedAt && (
        <div style={{ ...S.row, marginTop: '.5rem' }}>
          <button type="button" style={S.btn2} onClick={merge}>Record merge for {s.session}</button>
          <Field label="Closing note"><input aria-label={`Closing note for ${s.session}`} style={S.input} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button type="button" style={S.btn} onClick={close}>Close session {s.session}</button>
        </div>
      )}
      {gate.modal}
    </div>
  );
}

export function SessionPlansTab() {
  const [releases, setReleases] = useState([]);
  const [release, setRelease] = useState('');
  const [openFeatures, setOpenFeatures] = useState([]);
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ session: '', intent: '', reestimate: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const out = await api.listReleaseCutReleases();
        setReleases(out.releases);
        const open = out.releases.find((r) => r.state === 'open');
        if (open) { setRelease(open.version); setOpenFeatures((await api.getReleaseCutRelease(open.version)).features.map((f) => f.key)); }
      } catch (e) { setError(e.message); }
    })();
  }, []);
  const load = useCallback(async () => {
    if (!release) return;
    try { setPlans((await api.listReleaseCutSessions(release)).sessions); setError(''); } catch (e) { setError(e.message); }
  }, [release]);
  useEffect(() => { load(); }, [load]);

  const isOpen = releases.find((r) => r.version === release)?.state === 'open';
  const setItem = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  async function save() {
    setFormError('');
    try {
      const out = await api.recordReleaseCutEstimate({ session: form.session, intent: form.intent, reestimate: form.reestimate, items: items.map((it) => ({ ...it, expect: it.expect || null, size: it.size || null })) });
      toast.success(out.reEstimated ? 'Re-estimate recorded (original kept)' : 'Estimate recorded');
      setForm({ session: '', intent: '', reestimate: '' }); setItems([{ ...EMPTY_ITEM }]); await load();
    } catch (e) { setFormError(e.message); toast.error(e.message); }
  }
  return (
    <div>
      <div style={S.sub}>What each session expected to deliver before it started, and the score at every merge. The score at a merge is read from the latest validated round, never typed in; a feature with no validated round shows "not validated", never 0. An estimate is fixed once a merge is recorded; a later change is a re-estimate with a reason, kept beside the original.</div>
      <ErrorBox error={error} />
      <div style={S.row}>
        <Field label="Release">
          <select aria-label="Release" style={S.input} value={release} onChange={(e) => setRelease(e.target.value)}>
            {releases.map((r) => <option key={r.version} value={r.version}>{r.version} ({r.state})</option>)}
          </select>
        </Field>
      </div>
      {isOpen && (
        <div style={S.card}>
          <div style={S.cardTitle}>Record an estimate</div>
          <div style={S.row}>
            <Field label="Session id"><input aria-label="Session id" style={S.input} placeholder="S-0.3.0-01-garden" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} /></Field>
            <Field label="Intent"><input aria-label="Intent" style={S.input} value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value })} /></Field>
          </div>
          {items.map((it, i) => (
            <div key={i} style={S.row}>
              <Field label="Feature">
                <select aria-label={`Feature ${i + 1}`} style={S.input} value={it.feature} onChange={(e) => setItem(i, 'feature', e.target.value)}>
                  <option value="">Choose a feature</option>
                  {openFeatures.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Goal"><input aria-label={`Goal ${i + 1}`} style={S.input} value={it.goal} onChange={(e) => setItem(i, 'goal', e.target.value)} /></Field>
              <Field label="Expected score"><input aria-label={`Expected score ${i + 1}`} style={S.input} placeholder="30/32" value={it.expect} onChange={(e) => setItem(i, 'expect', e.target.value)} /></Field>
              <Field label="Size">
                <select aria-label={`Size ${i + 1}`} style={S.input} value={it.size} onChange={(e) => setItem(i, 'size', e.target.value)}>
                  <option value="">-</option><option value="S">S</option><option value="M">M</option><option value="L">L</option>
                </select>
              </Field>
            </div>
          ))}
          <div style={S.row}>
            <button type="button" style={S.btn2} onClick={() => setItems([...items, { ...EMPTY_ITEM }])}>Add item</button>
            <Field label="Re-estimate reason (only after a merge)"><input aria-label="Re-estimate reason" style={S.input} value={form.reestimate} onChange={(e) => setForm({ ...form, reestimate: e.target.value })} /></Field>
            <button type="button" style={S.btn} onClick={save}>Save estimate</button>
          </div>
          <ErrorBox error={formError} />
        </div>
      )}
      <div style={S.cardTitle}>Session plans for release {release}</div>
      {!plans ? (!error && <div>Loading…</div>) : plans.length ? plans.map((s) => <SessionCard key={s.session} s={s} onChanged={load} />) : <div style={S.empty}>No session plans were recorded for this release.</div>}
    </div>
  );
}
