// Release scope (admin, tracker Settings tab): move a feature between planned and backlog, or add one after the
// cut. Calls the same server functions as scripts/release-scope.mjs and the release_tracker_*_scope MCP tools.
// A decider and a reason are required; every move is appended to the feature's scopeHistory.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const STORED = {
  database: 'Saved on the platform, so the tracker shows it now and keeps it across redeploys.',
  file: 'Recorded in the release file in this checkout; commit that file to keep it.',
};

const Field = ({ label, children }) => <label className="rt-field"><span>{label}</span>{children}</label>;

export default function ScopeCard() {
  const [data, setData] = useState(null); const [loadError, setLoadError] = useState('');
  const [key, setKey] = useState(''); const [scope, setScope] = useState('backlog');
  const [by, setBy] = useState(''); const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false); const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState('');
  const load = useCallback(async () => {
    try { setData(await api.releaseTrackerScope()); setLoadError(''); } catch (e) { setLoadError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const all = data ? [...data.planned, ...data.added, ...data.backlog].filter((f, i, a) => a.findIndex((x) => x.key === f.key) === i) : [];
  const cur = all.find((f) => f.key === key);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    setPreview(null);
    if (adding || !key || !cur || cur.scope === scope) return undefined;
    let live = true;
    api.previewReleaseTrackerScope({ key, scope }).then((p) => { if (live) setPreview(p); }).catch(() => {});
    return () => { live = false; };
  }, [adding, key, scope, cur]);
  const submit = async () => {
    setBusy(true); setError(''); setDone('');
    try {
      const r = adding
        ? await api.addReleaseTrackerFeature({ key, title, scope, decidedBy: by, reason, via: 'card' })
        : await api.setReleaseTrackerScope({ key, scope, decidedBy: by, reason, via: 'card' });
      setDone(`${r.message} ${STORED[r.storedIn] || ''}`.trim());
      toast.success(r.message); setReason(''); load();
    } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <section className="rt-card" aria-labelledby="rt-set-scope" data-testid="rt-scope-card">
      <h3 id="rt-set-scope">Release scope</h3>
      <p className="rt-muted">Planned is this release&apos;s work; backlog stays on the record but is not worked or counted. Every change needs a decider and a reason and is kept in the feature&apos;s history.</p>
      {loadError ? <div role="alert" className="rt-alert">{loadError}</div> : null}
      {data ? <p className="rt-muted" data-testid="rt-scope-counts">Release {data.version}: {data.planned.length} planned at the cut, {data.added.length} added after the cut, {data.backlog.length} backlog.</p> : null}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={adding} onChange={(e) => setAdding(e.target.checked)} /> Add a new feature after the cut</label>
      {adding
        ? <><Field label="Feature key"><input aria-label="Feature key" value={key} onChange={(e) => setKey(e.target.value)} /></Field><Field label="Title"><input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field></>
        : <Field label="Feature"><select aria-label="Feature" value={key} onChange={(e) => { setKey(e.target.value); const f = all.find((x) => x.key === e.target.value); if (f) setScope(f.scope === 'planned' ? 'backlog' : 'planned'); }}><option value="">Choose a feature</option>{all.map((f) => <option key={f.key} value={f.key}>{f.key} ({f.scope}{f.added ? ', added after the cut' : ''})</option>)}</select></Field>}
      <Field label="New scope"><select aria-label="New scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="planned">planned</option><option value="backlog">backlog</option></select></Field>
      <Field label="Decided by"><input aria-label="Decided by" value={by} onChange={(e) => setBy(e.target.value)} /></Field>
      <Field label="Reason"><textarea aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      {preview ? (
        <div className="rt-muted" data-testid="rt-scope-preview">
          <strong>What this changes</strong>
          <ul>{preview.impact.effects.map((e) => <li key={e}>{e}</li>)}</ul>
          <p>Planned {preview.impact.before.planned} to {preview.impact.after.planned}, added after the cut {preview.impact.before.added} to {preview.impact.after.added}, backlog {preview.impact.before.backlog} to {preview.impact.after.backlog}. Clicking the button below approves this change together with everything listed.</p>
        </div>
      ) : null}
      {data?.storage === 'file' ? <p className="rt-muted">Changes here are written to the release file in this checkout; commit it to keep them.</p> : null}
      {error ? <div role="alert" className="rt-alert" style={{ whiteSpace: 'pre-line' }}>{error}</div> : null}
      {done ? <div role="status" className="rt-muted" data-testid="rt-scope-done">{done}</div> : null}
      <div className="rt-actions"><button type="button" className="rt-btn primary" disabled={busy || !key || (adding && !title)} onClick={submit}>{adding ? 'Add feature' : cur ? `Move to ${scope}` : 'Change scope'}</button></div>
    </section>
  );
}
