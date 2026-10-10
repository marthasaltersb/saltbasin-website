// Capabilities (2026-10-09, admin): the interface-parity map. Every capability, the World Shell path that
// reaches it, the API route(s) behind it and the MCP tool(s) that expose it - with gaps highlighted.
// Source of truth: server/lib/capabilityParity.js (a config registry); `node scripts/check-interface-parity.mjs`
// verifies it against the code. Errors show inline (role="alert") and in a toast.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', bad: '#a5391f', ok: '#2f7d4f', gapBg: '#fff1d6', gapLine: '#c4843a' };
const CSS = `
.sb-cap { background:#fff; color:${C.ink}; border-radius:12px; padding:1.1rem; max-width:1100px; margin:0 auto; font-family:'DM Sans',sans-serif; font-size:.88rem; box-sizing:border-box; }
.sb-cap * { box-sizing:border-box; }
.sb-cap h1 { font-family:Fraunces,serif; font-size:1.25rem; margin:0; }
.sb-cap .sub { color:${C.sec}; font-size:.8rem; margin:.25rem 0 1rem; line-height:1.5; }
.sb-cap .summary { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1rem; }
.sb-cap .stat { border:1px solid ${C.line}; border-radius:10px; padding:.6rem .9rem; min-width:150px; }
.sb-cap .stat b { display:block; font-size:1.3rem; }
.sb-cap .stat.gap { background:${C.gapBg}; border-color:${C.gapLine}; }
.sb-cap .filters { display:flex; gap:.5rem; margin-bottom:1rem; flex-wrap:wrap; }
.sb-cap .filters button { min-height:44px; padding:.45rem 1rem; border-radius:8px; border:1px solid rgba(27,42,59,.3); background:#fff; color:${C.ink}; font:inherit; cursor:pointer; }
.sb-cap .filters button[aria-pressed=true] { background:${C.ink}; color:#fff; }
.sb-cap .group { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em; color:${C.sec}; margin:1.1rem 0 .4rem; }
.sb-cap article { border:1px solid ${C.line}; border-radius:10px; padding:.7rem .8rem; margin-bottom:.6rem; }
.sb-cap article.hasgap { border-color:${C.gapLine}; background:#fffaf0; }
.sb-cap .cells { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; margin-top:.5rem; }
.sb-cap .cell { border-radius:8px; padding:.45rem .55rem; background:${C.soft}; font-size:.78rem; min-width:0; overflow-wrap:anywhere; }
.sb-cap .cell.gap { background:${C.gapBg}; border:1px solid ${C.gapLine}; }
.sb-cap .cell h3 { margin:0 0 .2rem; font-size:.7rem; letter-spacing:.06em; text-transform:uppercase; color:${C.sec}; }
.sb-cap .tag { display:inline-block; font-weight:700; padding:0 .45rem; border-radius:999px; color:#fff; font-size:.7rem; margin-bottom:.2rem; }
.sb-cap .alert { background:#fbeae5; border:1px solid ${C.bad}; color:${C.bad}; border-radius:8px; padding:.6rem .7rem; margin:.6rem 0; }
.sb-cap code { font-family:ui-monospace,Menlo,monospace; font-size:.74rem; }
@media (max-width:700px) { .sb-cap { padding:.8rem; border-radius:0; } .sb-cap .cells { grid-template-columns:1fr; } .sb-cap .stat { flex:1 1 140px; } }
`;

function Cell({ label, status, children, exclusion }) {
  const gap = status === 'gap';
  return (
    <div className={`cell${gap ? ' gap' : ''}`} data-surface={label} data-status={status}>
      <h3>{label}</h3>
      <span className="tag" style={{ background: gap ? C.accent : status === 'excluded' ? C.sec : C.ok }}>{gap ? `${label} GAP` : status === 'excluded' ? `${label} not offered` : `${label} ready`}</span>
      <div>{children}</div>
      {status === 'excluded' && exclusion ? <div style={{ color: C.sec, marginTop: '.2rem' }}>{exclusion}</div> : null}
    </div>
  );
}

export default function CapabilitiesPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);

  useEffect(() => {
    api.getPlatformCapabilities()
      .then((d) => { setData(d); setError(''); })
      .catch((e) => { const m = `The capabilities map could not be loaded: ${e.message}`; setError(m); toast.error(m); });
  }, []);

  const rows = (data?.capabilities || []).filter((r) => !gapsOnly || !r.full);
  const groups = [...new Set(rows.map((r) => r.group))];
  const s = data?.summary;

  return (
    <div className="sb-cap">
      <style>{CSS}</style>
      <h1>Capabilities</h1>
      <p className="sub">Every capability should work three ways: by point-and-click in the World Shell (desktop and phone), through the API, and as an MCP tool for AI agents, with the same permissions. Gaps are highlighted.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      {s && (
        <div className="summary" data-testid="parity-summary">
          <div className="stat"><b>{s.full} of {s.total}</b>capabilities work in all three interfaces</div>
          <div className={`stat${s.uiGaps ? ' gap' : ''}`}><b>{s.uiGaps}</b>website (UI) gaps</div>
          <div className={`stat${s.mcpGaps ? ' gap' : ''}`}><b>{s.mcpGaps}</b>MCP gaps</div>
          <div className={`stat${s.apiGaps ? ' gap' : ''}`}><b>{s.apiGaps}</b>API gaps</div>
        </div>
      )}
      <div className="filters">
        <button type="button" aria-pressed={!gapsOnly} onClick={() => setGapsOnly(false)}>All capabilities</button>
        <button type="button" aria-pressed={gapsOnly} onClick={() => setGapsOnly(true)}>Gaps only</button>
      </div>
      {!data && !error && <div className="sub">Loading...</div>}
      {data && !error && gapsOnly && rows.length === 0 && <div className="sub" role="status">No gaps: every capability works on the website, in the API and as an MCP tool.</div>}
      {groups.map((g) => (
        <div key={g}>
          <div className="group">{g}</div>
          {rows.filter((r) => r.group === g).map((r) => (
            <article key={r.key} className={r.full ? '' : 'hasgap'} data-capability={r.key}>
              <b>{r.title}</b>
              {r.gap ? <div style={{ color: C.bad, fontSize: '.78rem', marginTop: '.2rem' }}>{r.gap}</div> : null}
              <div className="cells">
                <Cell label="Website" status={r.uiStatus}>{r.ui || 'No screen yet'}</Cell>
                <Cell label="API" status={r.apiStatus}>{r.api.map((a) => <div key={a}><code>{a}</code></div>)}</Cell>
                <Cell label="MCP" status={r.mcpStatus} exclusion={r.mcpExclusion}>{r.mcp.length ? r.mcp.map((m) => <div key={m}><code>{m}</code></div>) : 'No tool yet'}</Cell>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
