// Settings tab (admin): everything configurable about the live release tracker is edited here, never only
// through the API. Source repository + branch + poll interval, the GitHub webhook secret, ingest tokens
// (push), who can view (admins always; members by email; optional revocable share links), a paste-a-snapshot
// box, and the ingest log. Every action surfaces its error inline (role="alert") as well as in a toast.
// Creating a share link publishes the tracker to anyone holding it, so it goes through
// useToolCategoryGate().run (server side: assertReadyToFinalize).
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from '../admin/ToolCategoryGate.jsx';
import { jsonProblem, headlineOf } from '../../lib/friendlyError.js';

const when = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—');
const Field = ({ label, children, hint }) => <label className="rt-field"><span>{label}</span>{children}{hint ? <span style={{ fontSize: 12 }}>{hint}</span> : null}</label>;
const Err = ({ error }) => (error ? <div role="alert" className="rt-alert" style={{ whiteSpace: 'pre-line' }}>{error}</div> : null);

function useAction() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const run = async (fn, okMsg) => {
    setBusy(true); setError('');
    try { const r = await fn(); if (okMsg) toast.success(okMsg); return r; } catch (e) { setError(e.message); toast.error(e.message); return undefined; } finally { setBusy(false); }
  };
  return { busy, error, run, setError };
}

export default function TrackerSettings({ currentRelease }) {
  const gate = useToolCategoryGate();
  const [settings, setSettings] = useState(null);
  const [emailsText, setEmailsText] = useState('');
  const [tokens, setTokens] = useState([]);
  const [log, setLog] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [secret, setSecret] = useState(null);
  const [newToken, setNewToken] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [pullMsg, setPullMsg] = useState('');
  const [tokLabel, setTokLabel] = useState(''); const [tokRelease, setTokRelease] = useState(currentRelease || '');
  const [shareLabel, setShareLabel] = useState('');
  const src = useAction(); const acc = useAction(); const pull = useAction(); const hook = useAction(); const tok = useAction(); const shr = useAction(); const paste = useAction();

  const load = useCallback(async () => {
    try {
      const [s, t, l] = await Promise.all([api.releaseTrackerSettings(), api.releaseTrackerTokens(), api.releaseTrackerIngestLog()]);
      setSettings(s.settings); setEmailsText((s.settings.memberEmails || []).join('\n')); setTokens(t.tokens); setLog(l.log); setLoadError('');
    } catch (e) { setLoadError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (currentRelease && !tokRelease) setTokRelease(currentRelease); }, [currentRelease]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) return <div role="alert" className="rt-alert">{loadError}</div>;
  if (!settings) return <div className="rt-empty">Loading settings…</div>;
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const setPath = (k, v) => setSettings((s) => ({ ...s, paths: { ...s.paths, [k]: v } }));
  const origin = window.location.origin;
  const emails = () => emailsText.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
  const payload = () => ({ ...settings, memberEmails: emails() });
  const ingestTokens = tokens.filter((t) => t.kind === 'ingest'); const shareTokens = tokens.filter((t) => t.kind === 'share');

  return (
    <div className="rt-layer" data-testid="rt-settings">
      <div><h3 className="rt-layer-title">Release tracker settings</h3><div className="rt-layer-sub">Where the tracker gets its data, who may see it, and the keys that let a machine push to it.</div></div>

      <section className="rt-card" aria-labelledby="rt-set-src">
        <h3 id="rt-set-src">Source repository (pull)</h3>
        <p className="rt-muted" style={{ margin: 0 }}>The platform fetches the committed release-log files from this public repository on a GitHub push webhook and, as a fallback, every poll interval.</p>
        <div className="rt-form">
          <div className="rt-grid2">
            <Field label="Repository (owner/name)"><input value={settings.repo} onChange={(e) => set('repo', e.target.value)} placeholder="demo-org/demo-repo" autoComplete="off" /></Field>
            <Field label="Branch"><input value={settings.branch} onChange={(e) => set('branch', e.target.value)} autoComplete="off" /></Field>
            <Field label="Source base URL" hint="Raw file host. Leave the default for GitHub."><input value={settings.sourceBaseUrl} onChange={(e) => set('sourceBaseUrl', e.target.value)} autoComplete="off" /></Field>
            <Field label="Poll interval (minutes, 0 = off)"><input type="number" min="0" max="1440" value={settings.pullIntervalMinutes} onChange={(e) => set('pullIntervalMinutes', Number(e.target.value))} /></Field>
            <Field label="Default release key" hint="Used when a pulled file does not name its release."><input value={settings.releaseKey} onChange={(e) => set('releaseKey', e.target.value)} autoComplete="off" /></Field>
          </div>
          <details><summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Committed file paths</summary>
            <div className="rt-grid2">{Object.keys(settings.paths).map((k) => <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} file`}><input value={settings.paths[k]} onChange={(e) => setPath(k, e.target.value)} autoComplete="off" /></Field>)}</div>
          </details>
          <Err error={src.error} />
          <div className="rt-actions">
            <button type="button" className="rt-btn primary" disabled={src.busy} onClick={async () => { const r = await src.run(() => api.saveReleaseTrackerSettings(payload()), 'Source settings saved'); if (r) setSettings(r.settings); }}>Save source settings</button>
            <button type="button" className="rt-btn" disabled={pull.busy} onClick={async () => { setPullMsg(''); const r = await pull.run(() => api.releaseTrackerPull()); if (r) { setPullMsg(r.outcome === 'stored' ? `Fetched and stored snapshot ${r.id} for ${r.releaseKey}.${r.missing?.length ? ` Not in the repository: ${r.missing.join(', ')}.` : ''}` : `Nothing new: the repository matches snapshot ${r.id}.`); load(); } else load(); }}>Fetch from repository now</button>
          </div>
          <Err error={pull.error} />
          {pullMsg ? <div className="rt-note" role="status">{pullMsg}</div> : null}
        </div>
      </section>

      <section className="rt-card" aria-labelledby="rt-set-hook">
        <h3 id="rt-set-hook">GitHub webhook</h3>
        <p className="rt-muted" style={{ margin: 0 }}>In the repository settings add a webhook for push events with content type application/json, this payload URL and the secret below.</p>
        <div className="rt-secret" data-testid="rt-webhook-url">{origin}/api/release-tracker/webhook/github</div>
        <div>Secret: <b>{settings.webhookSecretSet ? 'set' : 'not set'}</b></div>
        {secret ? <div className="rt-secret" role="status" data-testid="rt-webhook-secret">New secret (shown once): {secret}</div> : null}
        <Err error={hook.error} />
        <div className="rt-actions">
          <button type="button" className="rt-btn" disabled={hook.busy} onClick={async () => { const r = await hook.run(() => api.releaseTrackerWebhookSecret(false), 'Webhook secret generated'); if (r) { setSecret(r.secret); load(); } }}>{settings.webhookSecretSet ? 'Replace webhook secret' : 'Generate webhook secret'}</button>
          {settings.webhookSecretSet ? <button type="button" className="rt-btn danger" disabled={hook.busy} onClick={async () => { const r = await hook.run(() => api.releaseTrackerWebhookSecret(true), 'Webhook secret removed'); if (r) { setSecret(null); load(); } }}>Remove webhook secret</button> : null}
        </div>
      </section>

      <section className="rt-card" aria-labelledby="rt-set-tok">
        <h3 id="rt-set-tok">Ingest tokens (push)</h3>
        <p className="rt-muted" style={{ margin: 0 }}>A machine that cannot be reached from here (an agent container) pushes its snapshot with <span className="rt-mono">POST {origin}/api/release-tracker/snapshots</span> and the header <span className="rt-mono">Authorization: Bearer &lt;token&gt;</span>. Each token belongs to one release. The token is shown once; only a hash is stored.</p>
        <div className="rt-grid2">
          <Field label="Release key"><input value={tokRelease} onChange={(e) => setTokRelease(e.target.value)} autoComplete="off" /></Field>
          <Field label="Token label"><input value={tokLabel} onChange={(e) => setTokLabel(e.target.value)} autoComplete="off" /></Field>
        </div>
        <Err error={tok.error} />
        <div className="rt-actions"><button type="button" className="rt-btn primary" disabled={tok.busy} onClick={async () => { const r = await tok.run(() => api.createReleaseTrackerToken({ kind: 'ingest', releaseKey: tokRelease, label: tokLabel }), 'Ingest token created'); if (r) { setNewToken({ kind: 'ingest', token: r.token }); setTokLabel(''); load(); } }}>Create ingest token</button></div>
        {newToken?.kind === 'ingest' ? <div className="rt-secret" role="status" data-testid="rt-new-ingest-token">New ingest token (shown once): {newToken.token}</div> : null}
        <TokenTable rows={ingestTokens} onRevoke={async (id) => { await tok.run(() => api.revokeReleaseTrackerToken(id), 'Token revoked'); load(); }} />
      </section>

      <section className="rt-card" aria-labelledby="rt-set-acc">
        <h3 id="rt-set-acc">Who can view</h3>
        <p className="rt-muted" style={{ margin: 0 }}>Admins always can. Add the email of a member (for example a partner) to give them the Release tracker in their World; one email per line. Bug and agent text is the same counts-and-labels data every viewer sees.</p>
        <Field label="Member emails"><textarea aria-label="Member emails" value={emailsText} onChange={(e) => setEmailsText(e.target.value)} style={{ fontFamily: 'inherit', fontSize: 15, minHeight: 90 }} /></Field>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={settings.shareLinksEnabled} onChange={(e) => set('shareLinksEnabled', e.target.checked)} style={{ width: 22, height: 22 }} /> Allow read-only share links</label>
        <Err error={acc.error} />
        <div className="rt-actions"><button type="button" className="rt-btn primary" disabled={acc.busy} onClick={async () => { const r = await acc.run(() => api.saveReleaseTrackerSettings(payload()), 'Access saved'); if (r) { setSettings(r.settings); setEmailsText(r.settings.memberEmails.join('\n')); } }}>Save access</button></div>

        <h3 style={{ marginTop: 8 }}>Share links</h3>
        <div className="rt-grid2"><Field label="Share link label"><input value={shareLabel} onChange={(e) => setShareLabel(e.target.value)} autoComplete="off" /></Field></div>
        <Err error={shr.error} />
        <div className="rt-actions"><button type="button" className="rt-btn" disabled={shr.busy || !settings.shareLinksEnabled} onClick={async () => { const r = await shr.run(() => gate.run(() => api.createReleaseTrackerToken({ kind: 'share', releaseKey: currentRelease || null, label: shareLabel })), 'Share link created'); if (r) { setNewToken({ kind: 'share', token: r.token }); setShareLabel(''); load(); } }}>Create share link</button></div>
        {newToken?.kind === 'share' ? <div className="rt-secret" role="status" data-testid="rt-new-share-link">New share link (shown once): {origin}/release-tracker/shared/{newToken.token}</div> : null}
        <TokenTable rows={shareTokens} share onRevoke={async (id) => { await shr.run(() => api.revokeReleaseTrackerToken(id), 'Share link revoked'); load(); }} />
      </section>

      <section className="rt-card" aria-labelledby="rt-set-paste">
        <h3 id="rt-set-paste">Paste a snapshot</h3>
        <p className="rt-muted" style={{ margin: 0 }}>Store a snapshot by hand (JSON with <span className="rt-mono">snapshot</span>, and optionally <span className="rt-mono">history</span> and <span className="rt-mono">updates</span>). It is added to the recorded history like any other.</p>
        <Field label="Snapshot JSON"><textarea aria-label="Snapshot JSON" value={pasteText} onChange={(e) => setPasteText(e.target.value)} spellCheck="false" /></Field>
        <Err error={paste.error} />
        <div className="rt-actions"><button type="button" className="rt-btn primary" disabled={paste.busy || !pasteText.trim()} onClick={async () => {
          let body; try { body = JSON.parse(pasteText); } catch (e) { const m = jsonProblem('snapshot', e); paste.setError(m); toast.error(headlineOf(m)); return; }
          const r = await paste.run(() => api.releaseTrackerStoreSnapshot(body)); if (r) { toast.success(r.outcome === 'stored' ? `Snapshot ${r.id} stored` : 'Nothing new: identical to the latest snapshot'); setPasteText(''); load(); }
        }}>Store snapshot</button></div>
      </section>

      <section className="rt-card" aria-labelledby="rt-set-log">
        <h3 id="rt-set-log">Recent ingests</h3>
        {log.length ? <div className="rt-panel"><table>
          <thead><tr><th>When</th><th>Via</th><th>Result</th><th>Detail</th></tr></thead>
          <tbody>{log.map((r) => <tr key={r.id}><td className="rt-num" data-label="When">{when(r.at)}</td><td data-label="Via">{r.source}</td><td data-label="Result"><span className={`rt-pill ${r.outcome === 'stored' ? 'rt-s-passed' : r.outcome === 'unchanged' ? 'rt-s-queued' : 'rt-s-failed'}`}>{r.outcome}</span></td><td data-label="Detail">{r.detail}{r.snapshotId ? ` (snapshot ${r.snapshotId})` : ''}</td></tr>)}</tbody>
        </table></div> : <div className="rt-muted">Nothing has been ingested yet.</div>}
      </section>
      {gate.modal}
    </div>
  );
}

function TokenTable({ rows, onRevoke, share = false }) {
  if (!rows.length) return <div className="rt-muted">{share ? 'No share links yet.' : 'No ingest tokens yet.'}</div>;
  return (
    <div className="rt-panel"><table>
      <thead><tr><th>Label</th>{share ? null : <th>Release</th>}<th>Ends in</th><th>Created</th><th>Last used</th><th>Status</th><th /></tr></thead>
      <tbody>{rows.map((t) => (
        <tr key={t.id}>
          <td data-label="Label">{t.label || <span className="rt-muted">(no label)</span>}</td>
          {share ? null : <td className="rt-mono" data-label="Release">{t.releaseKey}</td>}
          <td className="rt-mono" data-label="Ends in">…{t.hint}</td>
          <td className="rt-num" data-label="Created">{when(t.createdAt)}</td>
          <td className="rt-num" data-label="Last used">{when(t.lastUsedAt)}</td>
          <td data-label="Status">{t.revokedAt ? <span className="rt-pill rt-s-failed">Revoked</span> : <span className="rt-pill rt-s-passed">Active</span>}</td>
          <td>{t.revokedAt ? null : <button type="button" className="rt-btn danger" onClick={() => onRevoke(t.id)} aria-label={`Revoke ${share ? 'share link' : 'token'} ${t.label || t.hint}`}>Revoke</button>}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}
