// Production smoke (2026-10-10): the fictional production test account the smoke and regression suite signs in
// with (feature production-smoke-regression). Reachable from World Shell -> Journeys -> Production smoke (admin).
// The password is typed here (or comes from the provisioning workflow), hashed by the server, and never shown
// again. Every failure shows inline (role="alert") and in a toast. Phone: one column, 44px tap targets.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f', warn: '#a8741a' };
const CSS = `
.sb-ps { background:#fff; color:${C.ink}; border-radius:12px; padding:1.1rem; max-width:860px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.9rem; box-sizing:border-box; overflow-wrap:anywhere; }
.sb-ps * { box-sizing:border-box; }
.sb-ps h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.sb-ps h2 { font-size:.95rem; margin:0 0 .6rem; }
.sb-ps .sub { color:${C.sec}; font-size:.8rem; margin:.25rem 0 1rem; line-height:1.5; }
.sb-ps .card { border:1px solid ${C.line}; border-radius:10px; padding:.9rem; margin-bottom:1rem; }
.sb-ps dl { display:grid; grid-template-columns:max-content 1fr; gap:.35rem .9rem; margin:0 0 .6rem; }
.sb-ps dt { color:${C.sec}; font-size:.78rem; }
.sb-ps dd { margin:0; }
.sb-ps label.field { display:flex; flex-direction:column; gap:.25rem; font-size:.78rem; color:${C.sec}; margin-bottom:.7rem; }
.sb-ps input { min-height:44px; padding:.5rem .6rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); font:inherit; color:${C.ink}; width:100%; background:#fff; }
.sb-ps button { min-height:44px; padding:.5rem 1rem; border-radius:8px; border:1px solid ${C.ink}; background:${C.ink}; color:#fff; font:inherit; cursor:pointer; }
.sb-ps button:disabled { opacity:.55; cursor:default; }
.sb-ps code { font-family:ui-monospace,Menlo,monospace; font-size:.8rem; }
.sb-ps .alert { background:#fbeae5; border:1px solid ${C.bad}; color:${C.bad}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; font-size:.82rem; }
.sb-ps .note { background:#eef5f8; border:1px solid ${C.teal}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; font-size:.82rem; }
.sb-ps .pill { display:inline-block; padding:.05rem .55rem; border-radius:999px; font-size:.72rem; font-weight:700; color:#fff; }
.sb-ps ul { margin:.3rem 0; padding-left:1.1rem; }
.sb-ps li { margin:.3rem 0; }
@media (max-width:700px) { .sb-ps { padding:.8rem; border-radius:0; } .sb-ps dl { grid-template-columns:1fr; } .sb-ps button { width:100%; } }
`;

export default function ProductionSmokePanel() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = useCallback((e, what) => {
    const d = e.body?.details; const detail = Array.isArray(d) && d.length ? ` ${d.join(' ')}` : '';
    const msg = `${what} ${e.message}${detail}`;
    setError(msg);
    toast.error(msg);
  }, []);

  const load = useCallback(async () => {
    try { setStatus(await api.getSmokeAccount()); setError(''); } catch (e) { fail(e, 'The test account status could not be loaded.'); }
  }, [fail]);
  useEffect(() => { load(); }, [load]);

  async function ready(ev) {
    ev.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const out = await api.readySmokeAccount(password);
      setStatus(out); setPassword('');
      setMessage(out.created ? 'The test account was created and is ready.' : 'The test account is ready.');
      toast.success('The test account is ready.');
    } catch (e) { fail(e, 'The test account could not be readied.'); }
    setBusy(false);
  }

  const pill = !status ? null : !status.exists ? ['Not created', C.warn] : status.ready ? ['Ready', C.ok] : ['Not ready', C.bad];

  return (
    <div className="sb-ps">
      <style>{CSS}</style>
      <h1>Production smoke</h1>
      <p className="sub">The smoke and regression suite checks saltbasin.net after every merge to main. Its signed-in steps use one fictional test account with no real data. It is excluded from all email.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {message && <div className="note" role="status">{message}</div>}

      <div className="card">
        <h2>Test account</h2>
        {!status ? <p>Loading…</p> : (
          <>
            <dl>
              <dt>Email</dt><dd><code>{status.account.email}</code></dd>
              <dt>Display name</dt><dd>{status.account.displayName}</dd>
              <dt>Status</dt><dd><span className="pill" style={{ background: pill[1] }}>{pill[0]}</span></dd>
              <dt>Email delivery</dt><dd>{status.emailExcluded ? 'Excluded (reserved .invalid address)' : 'Not excluded'}</dd>
              {status.exists && <><dt>Platform terms</dt><dd>{status.platformTermsCurrent ? 'Current' : 'Not current'}</dd>
                <dt>Career Portfolio terms</dt><dd>{status.careerTermsCurrent ? 'Current' : 'Not current'}</dd>
                <dt>Forced password change</dt><dd>{status.mustChangePassword ? 'Pending' : 'None'}</dd></>}
            </dl>
            {status.problems?.length > 0 && <ul>{status.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          </>
        )}
        <form onSubmit={ready}>
          <label className="field">Password for the test account
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="The value stored as SMOKE_MEMBER_PASSWORD" />
          </label>
          <button type="submit" disabled={busy || !password}>{busy ? 'Working…' : 'Create or ready the test account'}</button>
        </form>
        <p className="sub">The password is hashed and never shown again. Use the same value as the GitHub Actions secret <code>SMOKE_MEMBER_PASSWORD</code>.</p>
      </div>

      <div className="card">
        <h2>GitHub Actions secrets to add</h2>
        <p className="sub">Add these under the repository's Settings, Secrets and variables, Actions. Nothing is committed and the suite never touches the production database.</p>
        {status ? (
          <ul>
            {status.secrets.provisioning.map((n) => <li key={n}><code>{n}</code>: administrator sign-in used only by the provisioning workflow</li>)}
            {status.secrets.account.map((n) => <li key={n}><code>{n}</code>: the test account's password, used by the provisioning workflow and by every signed-in run</li>)}
            {status.secrets.optional.map((n) => <li key={n}><code>{n}</code>: optional, defaults to https://saltbasin.net</li>)}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
