// Release intelligence (2026-10-02): the admin screen where release-loop
// outputs reconcile to release records and contribution trends are read over
// time. Reachable from World Shell -> Release Intelligence (and Classic Tools
// -> Platform Lifecycle Management -> Release Intelligence).
//
// Every action surfaces its error inline (role="alert") as well as in a toast;
// nothing here swallows a failure. Approving a release goes through
// useToolCategoryGate().run like every other finalize path.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { stackedBarsHtml, foldSeries } from '../../lib/releaseCharts.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const S = {
  root: { background: '#fff', color: C.ink, borderRadius: 12, padding: '1.1rem', maxWidth: 1180, margin: '0 auto', fontFamily: 'DM Sans, sans-serif', fontSize: '.86rem' },
  h1: { fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: 0 },
  sub: { color: C.sec, fontSize: '.78rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  tabs: { display: 'flex', gap: '.3rem', borderBottom: `1px solid ${C.line}`, marginBottom: '1rem', flexWrap: 'wrap' },
  tab: (on) => ({ border: 0, background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink, padding: '.45rem .85rem', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '.82rem', fontWeight: on ? 700 : 500 }),
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.9rem', marginBottom: '1rem', background: '#fff' },
  cardTitle: { fontWeight: 700, fontSize: '.88rem', marginBottom: '.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' },
  th: { textAlign: 'left', padding: '.4rem .5rem', borderBottom: `1px solid ${C.line}`, fontSize: '.7rem', color: C.sec, textTransform: 'uppercase', letterSpacing: '.06em' },
  td: { padding: '.45rem .5rem', borderBottom: `1px solid ${C.soft}`, verticalAlign: 'top' },
  input: { padding: '.4rem .5rem', borderRadius: 7, border: `1px solid rgba(27,42,59,.25)`, fontSize: '.82rem', font: 'inherit', background: '#fff', color: C.ink },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '.45rem .85rem', cursor: 'pointer', fontSize: '.8rem', font: 'inherit' },
  btn2: { border: `1px solid rgba(27,42,59,.25)`, background: '#fff', color: C.ink, borderRadius: 7, padding: '.4rem .75rem', cursor: 'pointer', fontSize: '.78rem', font: 'inherit' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.72rem', color: C.sec },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.78rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, color: C.ink, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.78rem' },
  pill: (color) => ({ display: 'inline-block', padding: '.05rem .5rem', borderRadius: 999, fontSize: '.7rem', fontWeight: 700, color: '#fff', background: color }),
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.8rem' },
};

const TOKEN_LABELS = { all: 'All tokens', output: 'Output tokens', input: 'Input tokens', cacheWrite: 'Cache-write tokens', cacheRead: 'Cache-read tokens' };
const COUNT_LABELS = { features: ['feature', 'features'], rounds: ['round', 'rounds'], fixes: ['fix', 'fixes'], failedRuns: ['failed run', 'failed runs'], agents: ['agent', 'agents'] };
const countText = (k, v) => { const l = COUNT_LABELS[k] || [k, k]; return `${v} ${v === 1 ? l[0] : l[1]}`; };
const fmtTime = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');

function ErrorBox({ error }) {
  if (!error) return null;
  return <div role="alert" style={S.alert}>{error}</div>;
}

function Field({ label, children }) {
  return <label style={S.label}><span>{label}</span>{children}</label>;
}

function Statuspill({ status }) {
  const color = /^pass|approved|reconciled/i.test(status) ? C.ok : /fail|not pass|open|needs/i.test(status) ? C.bad : C.sec;
  return <span style={S.pill(color)}>{status}</span>;
}

// ── Disposition editor for one failed run ───────────────────────────────────
function RunRow({ run, dispositions, classes, onSaved }) {
  const [disposition, setDisposition] = useState(run.disposition);
  const [failureClass, setFailureClass] = useState(run.failureClass);
  const [note, setNote] = useState(run.dispositionNote || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setDisposition(run.disposition); setFailureClass(run.failureClass); setNote(run.dispositionNote || ''); }, [run.disposition, run.failureClass, run.dispositionNote]);
  async function save() {
    setBusy(true); setError('');
    try {
      await api.setReleaseRunDisposition(run.id, { disposition, note, failureClass });
      toast.success('Disposition saved');
      await onSaved();
    } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  }
  return (
    <tr data-testid={`run-${run.id}`}>
      <td style={S.td}><Statuspill status={run.state} /></td>
      <td style={S.td}>{run.failureClass}</td>
      <td style={S.td}>
        <div>{run.description}</div>
        {run.stateLeft && <div style={{ color: C.sec, fontSize: '.74rem' }}>State left: {run.stateLeft}</div>}
        <div style={{ color: C.sec, fontSize: '.72rem' }}>{run.runKind}{run.featureKey ? ` · ${run.featureKey}` : ''}{run.roundNo != null ? ` · round ${run.roundNo}` : ''}{run.releaseKey ? ` · ${run.releaseKey}` : ''}</div>
      </td>
      <td style={S.td}>
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
          <select aria-label={`Disposition for ${run.description.slice(0, 40)}`} value={disposition} onChange={(e) => setDisposition(e.target.value)} style={S.input}>
            {dispositions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select aria-label={`Class for ${run.description.slice(0, 40)}`} value={failureClass} onChange={(e) => setFailureClass(e.target.value)} style={S.input}>
            {(classes.includes(failureClass) ? classes : [failureClass, ...classes]).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input aria-label={`Note for ${run.description.slice(0, 40)}`} placeholder="How it was resolved" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...S.input, minWidth: 160 }} />
          <button type="button" style={S.btn2} disabled={busy} onClick={save}>Save disposition</button>
        </div>
        {run.dispositionBy && <div style={{ color: C.sec, fontSize: '.7rem' }}>Set by {run.dispositionBy} {fmtTime(run.dispositionAt)}</div>}
        <ErrorBox error={error} />
      </td>
    </tr>
  );
}

function RunsTable({ runs, dispositions, classes, onSaved }) {
  if (!runs.length) return <div style={S.empty}>No failed runs match.</div>;
  return (
    <table style={S.table}>
      <thead><tr><th style={S.th}>State</th><th style={S.th}>Class</th><th style={S.th}>What failed</th><th style={S.th}>Disposition</th></tr></thead>
      <tbody>{runs.map((r) => <RunRow key={r.id} run={r} dispositions={dispositions} classes={classes} onSaved={onSaved} />)}</tbody>
    </table>
  );
}

// ── Trends ──────────────────────────────────────────────────────────────────
function TrendsTab({ trends, rules }) {
  const [measure, setMeasure] = useState(null);
  const [by, setBy] = useState('whole');
  const [idx, setIdx] = useState(null);
  const releases = trends.releases;
  const tokenMeasure = measure || rules.defaultTokenMeasure || 'output';
  const last = releases.length - 1;
  const sel = idx == null ? last : Math.min(idx, last);
  const shown = releases.slice(0, sel + 1);
  const categories = shown.map((r) => ({ key: r.releaseKey, label: r.date, tip: `${r.releaseKey} (${r.date})` }));

  const charts = useMemo(() => {
    const maxSeries = rules.maxSeries || 5;
    const breakdown = (field, pick, label) => {
      const keys = [...new Set(shown.flatMap((r) => Object.keys(r[field])))];
      const rows = keys.map((k) => ({ key: k, label: k, values: shown.map((r) => pick(r[field][k])) }));
      return foldSeries(rows, maxSeries).map((s) => ({ ...s, label: s.label || s.key, hint: label }));
    };
    const tokenPick = (x) => (x?.tokens ? x.tokens[tokenMeasure] : null);
    const minutePick = (x) => (x?.minutes ?? null);
    const tokenSeries = by === 'whole'
      ? [{ key: 'v', label: TOKEN_LABELS[tokenMeasure], values: shown.map((r) => (r.tokens ? r.tokens[tokenMeasure] : null)) }]
      : breakdown(by === 'role' ? 'byRole' : 'byFeature', tokenPick);
    const timeSeries = by === 'whole'
      ? [{ key: 'v', label: 'Elapsed minutes', values: shown.map((r) => r.minutes) }]
      : breakdown(by === 'role' ? 'byRole' : 'byFeature', minutePick);
    const classKeys = (rules.failureClasses || []).filter((c) => shown.some((r) => (r.failureClasses[c] || 0) > 0));
    const classRows = classKeys.map((c) => ({ key: c, label: c, values: shown.map((r) => r.failureClasses[c] || 0) }));
    return {
      tokens: stackedBarsHtml({ title: 'Tokens used', subtitle: `${TOKEN_LABELS[tokenMeasure]} per release${by === 'whole' ? '' : `, by ${by}`} — where the tracker recorded them`, categories, series: tokenSeries, unit: 'tokens', axisLabel: 'tokens', selectedIndex: sel, emptyMessage: 'No tokens recorded for these releases yet. Import a tracker snapshot on the Import tab.' }),
      time: stackedBarsHtml({ title: 'Time spent', subtitle: `Elapsed wall-clock minutes per release${by === 'whole' ? '' : `, by ${by}`} (first to last agent activity, not active time)`, categories, series: timeSeries, unit: 'min', axisLabel: 'minutes', selectedIndex: sel, emptyMessage: 'No elapsed time recorded for these releases yet.' }),
      rounds: stackedBarsHtml({ title: 'Rounds to pass', subtitle: 'Mean validation rounds before a feature first passed', categories, series: [{ key: 'v', label: 'Rounds', values: shown.map((r) => r.roundsToPass.mean) }], unit: 'rounds', axisLabel: 'rounds', selectedIndex: sel, emptyMessage: 'No feature has passed a recorded round yet.' }),
      failures: stackedBarsHtml({ title: 'Failure classes', subtitle: 'Failed, refused and partial runs per release, by class', categories, series: foldSeries(classRows, maxSeries), unit: 'runs', axisLabel: 'failed runs', selectedIndex: sel, emptyMessage: 'No failed runs recorded.' }),
    };
  }, [shown, tokenMeasure, by, sel, rules, categories]);

  if (!releases.length) {
    return <div style={S.empty}>No releases recorded yet. Import release logs on the Import tab, or create a release record on the Releases tab.</div>;
  }
  const cur = releases[sel];
  return (
    <div>
      <div style={S.card}>
        <div style={S.row}>
          <Field label="Token measure">
            <select aria-label="Token measure" value={tokenMeasure} onChange={(e) => setMeasure(e.target.value)} style={S.input}>
              {Object.entries(TOKEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Break down by">
            <select aria-label="Break down by" value={by} onChange={(e) => setBy(e.target.value)} style={S.input}>
              <option value="whole">Whole release</option>
              <option value="role">By role</option>
              <option value="feature">By feature</option>
            </select>
          </Field>
          <Field label={`Timeline: releases up to ${cur.releaseKey}`}>
            <input type="range" aria-label="Timeline slider" min={1} max={releases.length} value={sel + 1} onChange={(e) => setIdx(Number(e.target.value) - 1)} style={{ minWidth: 220 }} />
          </Field>
        </div>
        <div data-testid="basis-note" style={{ fontSize: '.72rem', color: C.sec, marginBottom: '.35rem' }}>
          Basis: tokens are OBSERVED (read from agent transcripts by the release tracker). Minutes are INFERRED from the first to the last recorded activity of each agent, not active time. No spend is shown or estimated here.
        </div>
        <div role="status" data-testid="timeline-label" style={{ fontSize: '.8rem' }}>
          Showing releases up to <strong>{cur.releaseKey}</strong> ({cur.date}) — {sel + 1} of {releases.length}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
        {Object.entries(charts).map(([k, html]) => <div key={k} style={S.card} data-chart={k} dangerouslySetInnerHTML={{ __html: html }} />)}
      </div>
      <div style={S.card} data-testid="as-of">
        <div style={S.cardTitle}>As of {cur.releaseKey}</div>
        <table style={S.table}><tbody>
          <tr><td style={S.td}>Features passed</td><td style={S.td}>{cur.features.passed} of {cur.features.total}</td></tr>
          <tr><td style={S.td}>Agents with recorded tokens</td><td style={S.td}>{cur.agents.withTokens} of {cur.agents.total}</td></tr>
          <tr><td style={S.td}>Agents with recorded time</td><td style={S.td}>{cur.agents.withTime} of {cur.agents.total}</td></tr>
          <tr><td style={S.td}>Mean rounds to pass</td><td style={S.td}>{cur.roundsToPass.mean == null ? 'No feature has passed yet' : cur.roundsToPass.mean}</td></tr>
          <tr><td style={S.td}>Failed runs (open / total)</td><td style={S.td}>{cur.failedRuns.open} / {cur.failedRuns.total}</td></tr>
          <tr><td style={S.td}>Release status</td><td style={S.td}>{cur.status}</td></tr>
        </tbody></table>
      </div>
    </div>
  );
}

// ── Releases ────────────────────────────────────────────────────────────────
function NewReleaseForm({ onCreated }) {
  const [form, setForm] = useState({ releaseKey: '', name: '', date: '' });
  const [error, setError] = useState('');
  async function create() {
    setError('');
    try {
      const rel = await api.createReleaseRecord(form);
      toast.success(`Release record ${rel.releaseKey} created`);
      setForm({ releaseKey: '', name: '', date: '' });
      await onCreated(rel.id);
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>New release record</div>
      <div style={S.row}>
        <Field label="Release key"><input aria-label="Release key" style={S.input} value={form.releaseKey} placeholder="2030-01-05-garden-gate" onChange={(e) => setForm({ ...form, releaseKey: e.target.value })} /></Field>
        <Field label="Release name"><input aria-label="Release name" style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Release date"><input aria-label="Release date" style={S.input} value={form.date} placeholder="YYYY-MM-DD (optional if the key starts with it)" onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <button type="button" style={S.btn} onClick={create}>Create release record</button>
      </div>
      <ErrorBox error={error} />
    </div>
  );
}

function ReleaseDetail({ id, rules, onBack, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [gaps, setGaps] = useState([]);
  const [note, setNote] = useState('');
  const [feat, setFeat] = useState({ featureKey: '', name: '', finalStatus: 'passed' });
  const gate = useToolCategoryGate();
  const load = useCallback(async () => {
    try { setD(await api.getReleaseRecord(id)); setError(''); } catch (e) { setError(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function approve() {
    setError(''); setGaps([]);
    try {
      const next = await gate.run(() => api.approveReleaseRecord(id, note));
      setD(next); toast.success('Release reconciliation approved'); await onChanged();
    } catch (e) {
      setError(e.message); setGaps(e.body?.gaps || []); toast.error(e.message);
    }
  }
  async function reopen() {
    setError(''); setGaps([]);
    try { setD(await api.reopenReleaseRecord(id, note)); toast.success('Release reopened'); await onChanged(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  async function addFeature() {
    setError('');
    try { setD(await api.addReleaseFeature(id, feat)); setFeat({ featureKey: '', name: '', finalStatus: 'passed' }); await onChanged(); toast.success('Feature added'); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  if (!d) return <div>{error ? <ErrorBox error={error} /> : 'Loading release…'}</div>;
  return (
    <div data-testid="release-detail">
      <button type="button" style={S.btn2} onClick={onBack}>← All releases</button>
      <h2 style={{ ...S.h1, margin: '.7rem 0 .2rem' }}>{d.releaseKey} <Statuspill status={d.status === 'approved' ? 'Approved' : 'Open'} /></h2>
      <div style={S.sub}>{d.name ? `${d.name} · ` : ''}{d.date} · {d.reconciled ? 'Reconciled: every check passes' : `${d.gaps.length} gap${d.gaps.length === 1 ? '' : 's'} to reconcile`}
        {d.tokens ? ` · ${d.tokens.output.toLocaleString()} output tokens recorded` : ' · tokens not recorded'}{d.elapsedMinutes != null ? ` · ${d.elapsedMinutes} min elapsed` : ' · time not recorded'}</div>
      <ErrorBox error={error} />
      {gaps.length > 0 && <div role="alert" style={S.alert}><strong>Not approved. Open gaps:</strong><ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{gaps.map((g) => <li key={g}>{g}</li>)}</ul></div>}
      {d.gaps.length > 0 && gaps.length === 0 && d.status !== 'approved' && (
        <div style={S.note} data-testid="gap-list"><strong>Gaps:</strong><ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{d.gaps.map((g) => <li key={g}>{g}</li>)}</ul></div>
      )}
      <div style={S.card}>
        <div style={S.row}>
          <Field label="Approval or reopen note"><input aria-label="Approval note" style={{ ...S.input, minWidth: 320 }} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          {d.status === 'approved'
            ? <button type="button" style={S.btn2} onClick={reopen}>Reopen release</button>
            : <button type="button" style={S.btn} onClick={approve}>Approve reconciliation</button>}
        </div>
        {d.status === 'approved' && <div style={{ color: C.sec, fontSize: '.74rem' }}>Approved {fmtTime(d.approvedAt)}{d.approvalNote ? ` — ${d.approvalNote}` : ''}</div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Features</div>
        {d.features.length === 0 ? <div style={S.empty}>This release lists no features yet.</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Feature</th><th style={S.th}>Outcome</th><th style={S.th}>Specs traced to</th><th style={S.th}>Validation rounds</th><th style={S.th}>Fixes</th><th style={S.th}>Failed runs</th><th style={S.th}>Reconciled</th></tr></thead>
            <tbody>
              {d.features.map((f) => (
                <React.Fragment key={f.featureKey}>
                  <tr data-testid={`feature-${f.featureKey}`}>
                    <td style={S.td}><strong>{f.featureKey}</strong>{f.name ? <div style={{ color: C.sec, fontSize: '.72rem' }}>{f.name}</div> : null}</td>
                    <td style={S.td}><Statuspill status={f.outcome} /></td>
                    <td style={S.td}>
                      <div>Change: {f.changeSpec ? `${f.changeSpec.path} (version ${f.changeSpec.specVersion || 'not stated'})` : 'not imported'}</div>
                      <div>Training: {f.trainingSpec ? `${f.trainingSpec.path} (version ${f.trainingSpec.specVersion || 'not stated'})` : 'not imported'}</div>
                    </td>
                    <td style={S.td}>
                      {f.rounds.length === 0 ? 'none recorded' : f.rounds.map((r) => (
                        <div key={r.roundNo}>Round {r.roundNo}: {r.passed === true ? 'pass' : r.passed === false ? 'fail' : 'no result'}{r.stepsTotal != null ? ` (${r.stepsPassed ?? '?'}/${r.stepsTotal} steps)` : ''}{r.commitSha ? ` · ${r.commitSha.slice(0, 7)}` : ''}</div>
                      ))}
                      <div style={{ color: C.sec, fontSize: '.72rem' }}>{f.roundsToPass != null ? `Passed in round ${f.roundsToPass}` : 'Not passed'}</div>
                    </td>
                    <td style={S.td}>{f.fixes.length ? f.fixes.map((x) => <div key={`${x.bugId}-${x.roundNo}`}>{x.bugId}{x.roundNo != null ? ` (round ${x.roundNo})` : ''}: {x.summary}</div>) : 'none'}</td>
                    <td style={S.td}>{f.failedRuns.length} ({f.failedRuns.filter((r) => r.disposition === 'open').length} open)</td>
                    <td style={S.td}>{f.reconciliation.reconciled ? <span style={S.pill(C.ok)}>Reconciled</span> : <span style={S.pill(C.bad)}>{f.reconciliation.gaps.length} gap{f.reconciliation.gaps.length === 1 ? '' : 's'}</span>}</td>
                  </tr>
                  <tr>
                    <td colSpan={7} style={{ ...S.td, background: C.soft }}>
                      <div style={{ fontSize: '.74rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '.2rem .8rem' }}>
                        {f.reconciliation.checks.map((c) => (
                          <div key={c.id}><strong style={{ color: c.status === 'pass' ? C.ok : c.status === 'fail' ? C.bad : C.sec }}>{c.status === 'pass' ? '✓' : c.status === 'fail' ? '✕' : '–'}</strong> {c.label}: <span style={{ color: C.sec }}>{c.detail}</span></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ ...S.row, marginTop: '.8rem' }}>
          <Field label="Feature key"><input aria-label="Feature key" style={S.input} value={feat.featureKey} placeholder="seed-catalog" onChange={(e) => setFeat({ ...feat, featureKey: e.target.value })} /></Field>
          <Field label="Feature name"><input aria-label="Feature name" style={S.input} value={feat.name} onChange={(e) => setFeat({ ...feat, name: e.target.value })} /></Field>
          <Field label="Final status">
            <select aria-label="Final status" style={S.input} value={feat.finalStatus} onChange={(e) => setFeat({ ...feat, finalStatus: e.target.value })}>
              <option value="passed">passed</option><option value="failing">failing</option><option value="not passed">not passed</option><option value="needs_human">needs_human</option>
            </select>
          </Field>
          <button type="button" style={S.btn2} onClick={addFeature}>Add feature to release</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Failed runs not tied to a listed feature</div>
        <RunsTable runs={d.releaseRuns} dispositions={rules.dispositions} classes={rules.failureClasses} onSaved={async () => { await load(); await onChanged(); }} />
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Reconciliation history</div>
        {d.events.length === 0 ? <div style={S.empty}>No events yet.</div> : (
          <table style={S.table}><tbody>{d.events.map((e) => <tr key={e.id}><td style={S.td}>{fmtTime(e.at)}</td><td style={S.td}>{e.type}</td><td style={S.td}>{e.kind}: {e.ref}</td><td style={S.td}>{e.state || ''} {e.note || ''}</td><td style={S.td}>{e.actor || ''}</td></tr>)}</tbody></table>
        )}
      </div>
      {gate.modal}
    </div>
  );
}

function ReleasesTab({ rules, releases, reload }) {
  const [openId, setOpenId] = useState(null);
  if (openId) return <ReleaseDetail id={openId} rules={rules} onBack={() => setOpenId(null)} onChanged={reload} />;
  return (
    <div>
      <NewReleaseForm onCreated={async (id) => { await reload(); setOpenId(id); }} />
      <div style={S.card}>
        <div style={S.cardTitle}>Release records</div>
        {releases.length === 0 ? <div style={S.empty}>No release records yet.</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Release</th><th style={S.th}>Date</th><th style={S.th}>Status</th><th style={S.th}>Features passed</th><th style={S.th}>Failed runs</th><th style={S.th}>Reconciliation</th><th style={S.th} /></tr></thead>
            <tbody>{releases.map((r) => (
              <tr key={r.id} data-testid={`release-${r.releaseKey}`}>
                <td style={S.td}><strong>{r.releaseKey}</strong>{r.name ? <div style={{ color: C.sec, fontSize: '.72rem' }}>{r.name}</div> : null}</td>
                <td style={S.td}>{r.date}</td>
                <td style={S.td}>{r.status === 'approved' ? 'Approved' : 'Open'}</td>
                <td style={S.td}>{r.passedFeatures} of {r.features}</td>
                <td style={S.td}>{r.failedRuns} ({r.openFailedRuns} open)</td>
                <td style={S.td}>{r.reconciled ? <span style={S.pill(C.ok)}>Reconciled</span> : <span style={S.pill(C.bad)}>{r.gapCount} gap{r.gapCount === 1 ? '' : 's'}</span>}</td>
                <td style={S.td}><button type="button" style={S.btn2} aria-label={`Open ${r.releaseKey}`} onClick={() => setOpenId(r.id)}>Open</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Failed runs ─────────────────────────────────────────────────────────────
function FailedRunsTab({ rules, releases, reloadReleases }) {
  const [runs, setRuns] = useState(null);
  const [filters, setFilters] = useState({ releaseId: '', disposition: '', failureClass: '', state: '' });
  const [error, setError] = useState('');
  const blank = { releaseId: '', featureKey: '', runKind: 'command', state: 'failed', failureClass: 'unclassified', description: '', stateLeft: '', role: '', label: '', roundNo: '' };
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState('');
  const load = useCallback(async () => {
    try { setRuns((await api.listReleaseFailedRuns(filters)).runs); setError(''); } catch (e) { setError(e.message); }
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  async function create() {
    setFormError('');
    try { await api.createReleaseFailedRun(form); toast.success('Failed run recorded'); setForm(blank); await load(); await reloadReleases(); } catch (e) { setFormError(e.message); toast.error(e.message); }
  }
  const sel = (label, key, options, any = 'All') => (
    <Field label={label}>
      <select aria-label={label} style={S.input} value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
        <option value="">{any}</option>{options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </Field>
  );
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Record a failed run</div>
        <div style={S.sub}>Failed, refused and partial commands and failed agent runs are first-class records: they stay listed until a reviewer gives them a disposition with a note.</div>
        <div style={S.row}>
          <Field label="Release">
            <select aria-label="Release for new failed run" style={S.input} value={form.releaseId} onChange={(e) => setForm({ ...form, releaseId: e.target.value })}>
              <option value="">Unattributed</option>{releases.map((r) => <option key={r.id} value={r.id}>{r.releaseKey}</option>)}
            </select>
          </Field>
          <Field label="Feature key (optional)"><input aria-label="Failed run feature key" style={S.input} value={form.featureKey} onChange={(e) => setForm({ ...form, featureKey: e.target.value })} /></Field>
          <Field label="Kind">
            <select aria-label="Failed run kind" style={S.input} value={form.runKind} onChange={(e) => setForm({ ...form, runKind: e.target.value })}>
              <option value="command">command</option><option value="agent_run">agent_run</option><option value="validation_step">validation_step</option>
            </select>
          </Field>
          <Field label="State">
            <select aria-label="Failed run state" style={S.input} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{rules.runStates.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </Field>
          <Field label="Failure class">
            <select aria-label="Failed run class" style={S.input} value={form.failureClass} onChange={(e) => setForm({ ...form, failureClass: e.target.value })}>{rules.failureClasses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </Field>
        </div>
        <div style={S.row}>
          <Field label="What failed"><input aria-label="What failed" style={{ ...S.input, minWidth: 320 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="State it left"><input aria-label="State it left" style={{ ...S.input, minWidth: 240 }} value={form.stateLeft} onChange={(e) => setForm({ ...form, stateLeft: e.target.value })} /></Field>
          <button type="button" style={S.btn} onClick={create}>Record failed run</button>
        </div>
        <ErrorBox error={formError} />
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Failed runs</div>
        <div style={S.row}>
          {sel('Filter by release', 'releaseId', [{ v: 'none', t: 'Unattributed' }, ...releases.map((r) => ({ v: r.id, t: r.releaseKey }))], 'All releases')}
          {sel('Filter by disposition', 'disposition', rules.dispositions.map((d) => ({ v: d, t: d })), 'Any disposition')}
          {sel('Filter by class', 'failureClass', rules.failureClasses.map((d) => ({ v: d, t: d })), 'Any class')}
          {sel('Filter by state', 'state', rules.runStates.map((d) => ({ v: d, t: d })), 'Any state')}
        </div>
        <ErrorBox error={error} />
        {runs == null ? 'Loading…' : <RunsTable runs={runs} dispositions={rules.dispositions} classes={rules.failureClasses} onSaved={async () => { await load(); await reloadReleases(); }} />}
      </div>
    </div>
  );
}

// ── Outputs ─────────────────────────────────────────────────────────────────
function OutputRow({ o, releases, onLinked }) {
  const [rid, setRid] = useState(o.releaseId || '');
  const [error, setError] = useState('');
  async function link() {
    setError('');
    try { await api.linkReleaseOutput(o.id, rid || null); toast.success(rid ? 'Output linked to release' : 'Output unlinked'); await onLinked(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <tr data-testid={`output-${o.path}`}>
      <td style={S.td}>{o.path}</td><td style={S.td}>{o.kind}</td><td style={S.td}>{o.featureKey || '—'}</td>
      <td style={S.td}>{o.specVersion ? `version ${o.specVersion}` : '—'}</td>
      <td style={S.td}>{o.releaseKey ? o.releaseKey : <span style={S.pill(C.bad)}>Unattributed</span>}{o.linkedBy ? <div style={{ color: C.sec, fontSize: '.7rem' }}>linked by {o.linkedBy}</div> : null}</td>
      <td style={S.td}>
        <div style={{ display: 'flex', gap: '.3rem' }}>
          <select aria-label={`Release for ${o.path}`} style={S.input} value={rid} onChange={(e) => setRid(e.target.value)}>
            <option value="">No release</option>{releases.map((r) => <option key={r.id} value={r.id}>{r.releaseKey}</option>)}
          </select>
          <button type="button" style={S.btn2} onClick={link}>Link to release</button>
        </div>
        <ErrorBox error={error} />
      </td>
    </tr>
  );
}

function OutputsTab({ releases, reloadReleases }) {
  const [outputs, setOutputs] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setOutputs((await api.listReleaseOutputs()).outputs); setError(''); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorBox error={error} />;
  if (!outputs) return <div>Loading…</div>;
  const orphans = outputs.filter((o) => !o.releaseId).length;
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Session, design and build outputs</div>
      <div style={orphans ? S.alert : S.note} role="status">{orphans ? `${orphans} output${orphans === 1 ? ' is' : 's are'} not tied to any release. Link each one, or import the release log that lists its feature.` : 'Every imported output is tied to a release.'}</div>
      {outputs.length === 0 ? <div style={S.empty}>No outputs imported yet. Use the Import tab.</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Path</th><th style={S.th}>Kind</th><th style={S.th}>Feature</th><th style={S.th}>Spec version</th><th style={S.th}>Release</th><th style={S.th} /></tr></thead>
          <tbody>{outputs.map((o) => <OutputRow key={o.id} o={o} releases={releases} onLinked={async () => { await load(); await reloadReleases(); }} />)}</tbody>
        </table>
      )}
    </div>
  );
}

// ── Import ──────────────────────────────────────────────────────────────────
function ResultBox({ result }) {
  if (!result) return null;
  const docs = result.documents || (result.path ? [result] : []);
  return (
    <div role="status" style={S.note} data-testid="import-result">
      {result.filesRead != null && <div>Read {result.filesRead} file{result.filesRead === 1 ? '' : 's'}; {result.attributed ?? 0} row{result.attributed === 1 ? '' : 's'} attributed to a release afterwards.</div>}
      {result.releaseKey && <div>Snapshot filed under release {result.releaseKey}: {Object.entries(result.counts || {}).map(([k, v]) => countText(k, v)).join(', ')}.</div>}
      {(result.notes || []).map((n) => <div key={n}>Note: {n}</div>)}
      {docs.map((x) => (
        <div key={x.path}><strong>{x.path}</strong> — {x.status}{x.kind ? ` (${x.kind})` : ''}{x.error ? ` — ${x.error}` : ''}{Object.keys(x.counts || {}).length ? ` — ${Object.entries(x.counts).map(([k, v]) => countText(k, v)).join(', ')}` : ''}
          {(x.warnings || []).map((w) => <div key={w} style={{ color: C.accent }}>Warning: {w}</div>)}</div>
      ))}
      {(result.warnings || []).map((w) => <div key={w} style={{ color: C.accent }}>Warning: {w}</div>)}
    </div>
  );
}

function ImportTab({ reloadAll }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [doc, setDoc] = useState({ path: '', content: '' });
  const [snap, setSnap] = useState({ releaseKey: '', json: '' });
  async function run(name, fn) {
    setBusy(name); setError(''); setResult(null);
    try { const r = await fn(); setResult(r); if ((r.errors || []).length) setError(r.errors.join('\n')); else toast.success('Import finished'); await reloadAll(); } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(''); }
  }
  return (
    <div>
      <ErrorBox error={error} />
      <ResultBox result={result} />
      <div style={S.card}>
        <div style={S.cardTitle}>Import repository docs</div>
        <div style={S.sub}>Reads every release log, test result, triage report, reconciliation report, change spec and training spec under the folders set in Settings. Safe to run again: unchanged files are skipped and a reviewer’s dispositions are kept.</div>
        <button type="button" style={S.btn} disabled={!!busy} onClick={() => run('repo', () => api.importReleaseRepository())}>{busy === 'repo' ? 'Importing…' : 'Import repository docs'}</button>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Import a document</div>
        <div style={S.row}>
          <Field label="Document path"><input aria-label="Document path" style={{ ...S.input, minWidth: 380 }} placeholder="docs/release-log/2030-01-05-garden-gate.md" value={doc.path} onChange={(e) => setDoc({ ...doc, path: e.target.value })} /></Field>
        </div>
        <Field label="Document text"><textarea aria-label="Document text" rows={9} style={{ ...S.input, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }} value={doc.content} onChange={(e) => setDoc({ ...doc, content: e.target.value })} /></Field>
        <div style={{ marginTop: '.5rem' }}><button type="button" style={S.btn} disabled={!!busy} onClick={() => run('doc', () => api.importReleaseDocument(doc.path, doc.content))}>Import document</button></div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Import a tracker snapshot</div>
        <div style={S.sub}>The JSON that scripts/release-tracker-sync.mjs writes. Tokens and elapsed minutes are recorded only where the snapshot has them.</div>
        <div style={S.row}>
          <Field label="Release key for the snapshot"><input aria-label="Release key for the snapshot" style={{ ...S.input, minWidth: 320 }} value={snap.releaseKey} onChange={(e) => setSnap({ ...snap, releaseKey: e.target.value })} /></Field>
        </div>
        <Field label="Snapshot JSON"><textarea aria-label="Snapshot JSON" rows={8} style={{ ...S.input, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }} value={snap.json} onChange={(e) => setSnap({ ...snap, json: e.target.value })} /></Field>
        <div style={{ marginTop: '.5rem' }}><button type="button" style={S.btn} disabled={!!busy} onClick={() => run('snap', () => api.importReleaseSnapshot(snap.releaseKey, snap.json))}>Import snapshot</button></div>
      </div>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
const LOCATION_LABELS = { changeSpec: 'Change specs folder', trainingSpec: 'Training specs folder', testResult: 'Test results folder', triage: 'Triage folder', releaseLog: 'Release logs folder' };
function SettingsTab({ reloadConfig }) {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const c = await api.getReleaseIntelConfig();
      setCfg(c);
      const r = c.rules;
      setForm({ runStates: r.runStates.join(', '), dispositions: r.dispositions.join(', '), failureClasses: r.failureClasses.join(', '), defaultTokenMeasure: r.defaultTokenMeasure, maxSeries: String(r.maxSeries), logLocations: { ...r.logLocations } });
      setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!form) return <div>{error ? <ErrorBox error={error} /> : 'Loading settings…'}</div>;
  const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
  async function save() {
    setError('');
    try {
      await api.saveReleaseIntelConfig({ runStates: list(form.runStates), dispositions: list(form.dispositions), failureClasses: list(form.failureClasses), defaultTokenMeasure: form.defaultTokenMeasure, maxSeries: Number(form.maxSeries), logLocations: form.logLocations });
      toast.success('Settings saved'); await load(); await reloadConfig();
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  async function reset() {
    setError('');
    try { await api.resetReleaseIntelConfig(); toast.success('Settings reset to defaults'); await load(); await reloadConfig(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Release intelligence settings</div>
      <div style={S.sub}>{cfg.overridden ? 'These settings override the built-in defaults.' : 'Showing the built-in defaults. Saving stores an override.'} Values use lowercase letters, digits and underscores, separated by commas.</div>
      {cfg.overrideError && <ErrorBox error={cfg.overrideError} />}
      <ErrorBox error={error} />
      <div style={{ display: 'grid', gap: '.6rem', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <Field label="Run states"><input aria-label="Run states" style={S.input} value={form.runStates} onChange={(e) => setForm({ ...form, runStates: e.target.value })} /></Field>
        <Field label="Dispositions"><input aria-label="Dispositions" style={S.input} value={form.dispositions} onChange={(e) => setForm({ ...form, dispositions: e.target.value })} /></Field>
        <Field label="Failure classes"><input aria-label="Failure classes" style={S.input} value={form.failureClasses} onChange={(e) => setForm({ ...form, failureClasses: e.target.value })} /></Field>
        <Field label="Default token measure">
          <select aria-label="Default token measure" style={S.input} value={form.defaultTokenMeasure} onChange={(e) => setForm({ ...form, defaultTokenMeasure: e.target.value })}>
            {Object.entries(TOKEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Maximum chart series (1 to 5)"><input aria-label="Maximum chart series" style={S.input} value={form.maxSeries} onChange={(e) => setForm({ ...form, maxSeries: e.target.value })} /></Field>
        {Object.entries(LOCATION_LABELS).map(([k, label]) => (
          <Field key={k} label={label}><input aria-label={label} style={S.input} value={form.logLocations[k]} onChange={(e) => setForm({ ...form, logLocations: { ...form.logLocations, [k]: e.target.value } })} /></Field>
        ))}
      </div>
      <div style={{ ...S.row, marginTop: '.8rem' }}>
        <button type="button" style={S.btn} onClick={save}>Save settings</button>
        <button type="button" style={S.btn2} onClick={reset}>Reset to defaults</button>
      </div>
    </div>
  );
}

// ── Shell ───────────────────────────────────────────────────────────────────
const TABS = ['Trends', 'Releases', 'Failed runs', 'Outputs', 'Import', 'Settings'];

export default function ReleaseIntelligencePanel() {
  const [tab, setTab] = useState('Trends');
  const [trends, setTrends] = useState(null);
  const [releases, setReleases] = useState([]);
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');

  const reloadConfig = useCallback(async () => {
    try { setRules((await api.getReleaseIntelConfig()).rules); } catch (e) { setError(e.message); }
  }, []);
  const reloadReleases = useCallback(async () => {
    try { setReleases((await api.listReleaseRecords()).releases); setError(''); } catch (e) { setError(e.message); }
  }, []);
  const reloadTrends = useCallback(async () => {
    try { setTrends(await api.getReleaseTrends()); } catch (e) { setError(e.message); }
  }, []);
  const reloadAll = useCallback(async () => { await Promise.all([reloadReleases(), reloadTrends()]); }, [reloadReleases, reloadTrends]);
  useEffect(() => { reloadConfig(); reloadAll(); }, [reloadConfig, reloadAll]);

  return (
    <div style={S.root}>
      <h1 style={S.h1}>Release Intelligence</h1>
      <p style={S.sub}>Release records reconcile each feature to the spec versions it traces to, its validation rounds, fixes and failed runs. Trends show tokens, time, rounds-to-pass and failure classes across releases, only where they were recorded.</p>
      <ErrorBox error={error} />
      <div role="tablist" style={S.tabs}>
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} style={S.tab(tab === t)} onClick={() => { setTab(t); if (t === 'Trends' || t === 'Releases') reloadAll(); }}>{t}</button>)}
      </div>
      {!rules ? <div>Loading…</div> : (
        <>
          {tab === 'Trends' && (trends ? <TrendsTab trends={trends} rules={rules} /> : <div>Loading trends…</div>)}
          {tab === 'Releases' && <ReleasesTab rules={rules} releases={releases} reload={reloadAll} />}
          {tab === 'Failed runs' && <FailedRunsTab rules={rules} releases={releases} reloadReleases={reloadAll} />}
          {tab === 'Outputs' && <OutputsTab releases={releases} reloadReleases={reloadAll} />}
          {tab === 'Import' && <ImportTab reloadAll={reloadAll} />}
          {tab === 'Settings' && <SettingsTab reloadConfig={reloadConfig} />}
        </>
      )}
    </div>
  );
}
