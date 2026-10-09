// Connected Agents (2026-10-09): where a person creates, names, scopes and revokes the access tokens an AI
// agent uses to act as them through the platform MCP server (/mcp). Reachable from World Shell -> Journeys ->
// Connected Agents (and Classic Tools for admins). The token is shown exactly once, at creation; only its hash
// is stored. Every failure shows inline (role="alert") and in a toast - nothing is swallowed.
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const CSS = `
.sb-ca { background:#fff; color:${C.ink}; border-radius:12px; padding:1.1rem; max-width:980px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.9rem; box-sizing:border-box; }
.sb-ca * { box-sizing:border-box; }
.sb-ca h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.sb-ca h2 { font-size:.95rem; margin:0 0 .6rem; }
.sb-ca .sub { color:${C.sec}; font-size:.8rem; margin:.25rem 0 1rem; line-height:1.5; }
.sb-ca .card { border:1px solid ${C.line}; border-radius:10px; padding:.9rem; margin-bottom:1rem; background:#fff; }
.sb-ca label.field { display:flex; flex-direction:column; gap:.25rem; font-size:.78rem; color:${C.sec}; margin-bottom:.7rem; }
.sb-ca input[type=text], .sb-ca input[type=number] { min-height:44px; padding:.5rem .6rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); font:inherit; color:${C.ink}; width:100%; background:#fff; }
.sb-ca .scope { display:flex; gap:.6rem; align-items:flex-start; min-height:44px; padding:.4rem .2rem; font-size:.84rem; color:${C.ink}; cursor:pointer; }
.sb-ca .scope input { width:22px; height:22px; margin-top:.1rem; flex:none; }
.sb-ca .scope small { display:block; color:${C.sec}; font-size:.74rem; }
.sb-ca button { min-height:44px; padding:.5rem 1rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); background:#fff; color:${C.ink}; font:inherit; cursor:pointer; }
.sb-ca button.primary { background:${C.ink}; color:#fff; border-color:${C.ink}; }
.sb-ca button.danger { color:${C.bad}; border-color:${C.bad}; }
.sb-ca button:disabled { opacity:.55; cursor:default; }
.sb-ca code, .sb-ca .mono { font-family:ui-monospace,Menlo,monospace; font-size:.8rem; word-break:break-all; overflow-wrap:anywhere; }
.sb-ca .secret { background:${C.soft}; border:1px dashed ${C.accent}; border-radius:8px; padding:.7rem; margin:.6rem 0; }
.sb-ca .alert { background:#fbeae5; border:1px solid ${C.bad}; color:${C.bad}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; font-size:.82rem; }
.sb-ca .note { background:#eef5f8; border:1px solid ${C.teal}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; font-size:.82rem; }
.sb-ca .row { display:flex; gap:.6rem; flex-wrap:wrap; align-items:center; }
.sb-ca .tok { border:1px solid ${C.line}; border-radius:10px; padding:.75rem; margin-bottom:.7rem; }
.sb-ca .tok.revoked { background:${C.soft}; color:${C.sec}; }
.sb-ca .pill { display:inline-block; padding:.05rem .55rem; border-radius:999px; font-size:.72rem; font-weight:700; color:#fff; }
.sb-ca .meta { color:${C.sec}; font-size:.78rem; margin-top:.3rem; line-height:1.6; }
.sb-ca .tools li { margin:.35rem 0; }
@media (max-width:700px) { .sb-ca { padding:.8rem; border-radius:0; } .sb-ca .row > button { flex:1 1 100%; } }
`;

const fmt = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : 'never');

export default function ConnectedAgentsPanel() {
  const [info, setInfo] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState([]);
  const [days, setDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(null); // the just-created token, shown once
  const [confirmId, setConfirmId] = useState(null);

  const fail = useCallback((e, what) => {
    const msg = `${what}: ${e.message}`;
    setError(msg);
    toast.error(msg);
  }, []);

  const load = useCallback(async () => {
    try {
      const [i, t] = await Promise.all([api.getPlatformMcpInfo(), api.listPlatformTokens()]);
      setInfo(i);
      setTokens(t.tokens);
      setError('');
    } catch (e) { fail(e, 'Connected agents could not be loaded'); setTokens((cur) => cur || []); }
  }, [fail]);

  useEffect(() => { load(); }, [load]);

  const toggle = (key) => setScopes((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const create = async (ev) => {
    ev.preventDefault();
    setBusy(true); setError('');
    try {
      const created = await api.createPlatformToken({ name, scopes, expiresInDays: days === '' ? null : Number(days) });
      setFresh(created);
      setName(''); setScopes([]); setDays('');
      toast.success('Token created. Copy it now - it is shown only once.');
      await load();
    } catch (e) { fail(e, 'The token could not be created'); }
    finally { setBusy(false); }
  };

  const revoke = async (t) => {
    setBusy(true); setError('');
    try {
      await api.revokePlatformToken(t.id);
      setConfirmId(null);
      toast.success(`Token "${t.name}" revoked.`);
      await load();
    } catch (e) { fail(e, 'The token could not be revoked'); }
    finally { setBusy(false); }
  };

  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied.`); }
    catch (e) { fail(e, `Could not copy the ${what.toLowerCase()} automatically - select it and copy by hand`); }
  };

  return (
    <div className="sb-ca">
      <style>{CSS}</style>
      <h1>Connected Agents</h1>
      <p className="sub">Let an AI agent work in Salt Basin as you, through MCP. A token acts with your own permissions, never more, and you can revoke it at any time. Tokens are shown once and stored only as a hash.</p>
      {error && <div className="alert" role="alert">{error}</div>}

      <section className="card" aria-label="How to connect">
        <h2>How to connect</h2>
        {info ? (
          <>
            <div className="row" style={{ marginBottom: '.5rem' }}>
              <div style={{ flex: '1 1 260px' }}><div style={{ color: C.sec, fontSize: '.74rem' }}>MCP address</div><code data-testid="mcp-url">{info.url}</code></div>
              <button type="button" onClick={() => copy(info.url, 'MCP address')}>Copy address</button>
            </div>
            <div style={{ color: C.sec, fontSize: '.78rem' }}>Transport: {info.transport}. Send <code>{info.authorization}</code> with every request.</div>
          </>
        ) : <div className="sub">Loading...</div>}
      </section>

      <section className="card" aria-label="Create an access token">
        <h2>Create an access token</h2>
        <form onSubmit={create} noValidate>
          <label className="field">Token name
            <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="For example: Research assistant" />
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: '0 0 .7rem' }}>
            <legend style={{ fontSize: '.78rem', color: C.sec, padding: 0, marginBottom: '.2rem' }}>Scopes (what the token may do)</legend>
            {(info?.scopes || []).map((s) => (
              <label className="scope" key={s.key}>
                <input type="checkbox" checked={scopes.includes(s.key)} onChange={() => toggle(s.key)} />
                <span><b>{s.key}</b>{s.adminOnly ? ' (administrators only)' : ''}<small>{s.description}</small></span>
              </label>
            ))}
          </fieldset>
          <label className="field">Expires in (days, optional)
            <input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} placeholder="No expiry" />
          </label>
          <button type="submit" className="primary" disabled={busy}>Create token</button>
        </form>
        {fresh && (
          <div className="secret" role="status" data-testid="new-token">
            <b>Copy your token now. It will not be shown again.</b>
            <div style={{ margin: '.4rem 0' }}><code>{fresh.token}</code></div>
            <div className="row">
              <button type="button" className="primary" onClick={() => copy(fresh.token, 'Token')}>Copy token</button>
              <button type="button" onClick={() => setFresh(null)}>I have copied it</button>
            </div>
          </div>
        )}
      </section>

      <section className="card" aria-label="Your tokens">
        <h2>Your tokens</h2>
        {tokens == null && <div className="sub">Loading...</div>}
        {tokens && !tokens.length && <div className="note">You have no access tokens yet.</div>}
        {(tokens || []).map((t) => (
          <div className={`tok${t.status !== 'active' ? ' revoked' : ''}`} key={t.id} data-token={t.name}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{t.name}</b>
              <span className="pill" style={{ background: t.status === 'active' ? C.ok : C.sec }}>{t.status === 'active' ? 'Active' : t.status === 'revoked' ? 'Revoked' : 'Expired'}</span>
            </div>
            <div className="meta">
              <span className="mono">{t.prefix}...</span><br />
              Scopes: {t.scopes.join(', ')}<br />
              Created {fmt(t.createdAt)} · Last used {fmt(t.lastUsedAt)} · {t.calls} tool call{t.calls === 1 ? '' : 's'}
              {t.expiresAt ? <><br />Expires {fmt(t.expiresAt)}</> : null}
              {t.revokedAt ? <><br />Revoked {fmt(t.revokedAt)}</> : null}
            </div>
            {t.status === 'active' && (
              confirmId === t.id ? (
                <div className="row" style={{ marginTop: '.6rem' }}>
                  <button type="button" className="danger" disabled={busy} onClick={() => revoke(t)}>Confirm revoke</button>
                  <button type="button" onClick={() => setConfirmId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="row" style={{ marginTop: '.6rem' }}><button type="button" className="danger" onClick={() => setConfirmId(t.id)}>Revoke</button></div>
              )
            )}
          </div>
        ))}
      </section>

      <section className="card" aria-label="Tools agents can call">
        <h2>Tools an agent can call</h2>
        <p className="sub" style={{ margin: '0 0 .4rem' }}>Each tool does exactly what the matching screen does, with the same checks. Approving for QR still stops at the proficiency-category gate.</p>
        <ul className="tools" style={{ paddingLeft: '1.1rem', margin: 0 }}>
          {(info?.tools || []).map((t) => (
            <li key={t.name}><code>{t.name}</code> - {t.title}. <span style={{ color: C.sec }}>Scope {t.scope}{t.permission === 'admin' ? ', administrators only' : ''}.</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
