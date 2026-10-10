// Sessions screen (2026-10-09): after-session context / prompt / cache / memory
// mapping with token, spend and time trends. Reachable from World Shell ->
// Journeys -> Sessions (admin) and Classic Tools -> Platform Lifecycle
// Management -> Sessions.
//
// Metrics only: nothing on this screen shows transcript text. Every action
// surfaces its error inline (role="alert") as well as in a toast. Marking a
// mapping applied goes through useToolCategoryGate().run like every other
// finalize path. Layout works at 390px: card lists instead of wide tables,
// 44px tap targets, no hover-only actions.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { useToolCategoryGate } from './ToolCategoryGate.jsx';
import { stackedBarsHtml, compact } from '../../lib/releaseCharts.js';

const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
const S = {
  root: { background: '#fff', color: C.ink, borderRadius: 12, padding: '1.1rem', maxWidth: 1180, margin: '0 auto', fontFamily: 'DM Sans, sans-serif', fontSize: '.88rem', boxSizing: 'border-box', width: '100%' },
  h1: { fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: 0 },
  sub: { color: C.sec, fontSize: '.78rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  tabs: { display: 'flex', gap: '.3rem', borderBottom: `1px solid ${C.line}`, marginBottom: '1rem', flexWrap: 'wrap' },
  tab: (on) => ({ border: 0, background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink, padding: '.45rem .85rem', minHeight: 44, borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '.84rem', fontWeight: on ? 700 : 500 }),
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.9rem', marginBottom: '1rem', background: '#fff', boxSizing: 'border-box', maxWidth: '100%' },
  cardTitle: { fontWeight: 700, fontSize: '.9rem', marginBottom: '.5rem' },
  input: { padding: '.5rem', minHeight: 44, borderRadius: 7, border: '1px solid rgba(27,42,59,.25)', fontSize: '.86rem', font: 'inherit', background: '#fff', color: C.ink, boxSizing: 'border-box', maxWidth: '100%' },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '.5rem .95rem', minHeight: 44, cursor: 'pointer', fontSize: '.84rem', font: 'inherit' },
  btn2: { border: '1px solid rgba(27,42,59,.25)', background: '#fff', color: C.ink, borderRadius: 7, padding: '.45rem .85rem', minHeight: 44, cursor: 'pointer', fontSize: '.82rem', font: 'inherit' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.74rem', color: C.sec, minWidth: 0 },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, color: C.ink, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  pill: (color) => ({ display: 'inline-block', padding: '.05rem .5rem', borderRadius: 999, fontSize: '.7rem', fontWeight: 700, color: '#fff', background: color }),
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.82rem' },
  stat: { border: `1px solid ${C.line}`, borderRadius: 8, padding: '.5rem .7rem', minWidth: 120, flex: '1 1 120px', background: C.soft },
  statV: { fontWeight: 700, fontSize: '1.05rem' },
  statL: { fontSize: '.68rem', color: C.sec, textTransform: 'uppercase', letterSpacing: '.06em' },
  textarea: { width: '100%', minHeight: 120, padding: '.5rem', borderRadius: 7, border: '1px solid rgba(27,42,59,.25)', font: '12px/1.4 ui-monospace, monospace', boxSizing: 'border-box' },
};

const CSS = `
.sm-root *, .sm-root { box-sizing: border-box; }
.sm-root { overflow-wrap: anywhere; }
.sm-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.sm-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
.sm-chart svg { max-width: 100%; height: auto; }
@media (max-width: 700px) {
  .sm-grid2, .sm-grid3 { grid-template-columns: minmax(0, 1fr); }
  .sm-root { padding: .7rem !important; border-radius: 0 !important; }
  .sm-root input, .sm-root select, .sm-root textarea { max-width: 100%; width: 100%; }
  .sm-root input[type="range"] { min-height: 44px; }
}
`;

const AREA_LABELS = { context: 'Context', prompt: 'Prompt', cache: 'Cache', memory: 'Memory' };
const AREA_COLORS = { context: '#2e7f9c', prompt: '#c4843a', cache: '#2f7d4f', memory: '#6b5b95' };
const fmt = (v) => (v == null ? 'not recorded' : Number(v).toLocaleString('en-US'));
const pct = (r) => (r == null ? 'not recorded' : `${(r * 100).toFixed(1)}%`);
const money = (v, cur) => `${cur} ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const day = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : 'undated');
const totalTokens = (t) => (t ? (t.input || 0) + (t.cacheWrite || 0) + (t.cacheRead || 0) + (t.output || 0) : null);

function ErrorBox({ error }) { return error ? <div role="alert" style={{ ...S.alert, whiteSpace: 'pre-line' }}>{error}</div> : null; }
function Field({ label, children, style }) { return <label style={{ ...S.label, ...style }}><span>{label}</span>{children}</label>; }
function AreaPill({ area }) { return <span style={S.pill(AREA_COLORS[area] || C.sec)}>{AREA_LABELS[area] || area}</span>; }
function StatusPill({ status }) {
  const color = status === 'applied' ? C.ok : status === 'rejected' ? C.sec : C.bad;
  return <span style={S.pill(color)}>{status}</span>;
}

function spendText(spend, currency) {
  if (!spend) return 'not recorded';
  if (spend.unpriced?.length && spend.total === 0) return `not priced (${spend.unpriced.join(', ')})`;
  return `${money(spend.total, currency)}${spend.unpriced?.length ? ` + not priced: ${spend.unpriced.join(', ')}` : ''}`;
}

// ── Trends ──────────────────────────────────────────────────────────────────
function Delta({ before, after, kind, currency }) {
  if (before == null || after == null) return <span style={{ color: C.sec }}>no comparison</span>;
  const d = after - before;
  const same = Math.abs(d) < 1e-9;
  const fmtV = kind === 'pct' ? `${(d * 100).toFixed(1)} points` : kind === 'money' ? money(Math.abs(d), currency) : Math.abs(d).toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (same) return <span>no change</span>;
  return <span>{d > 0 ? 'up' : 'down'} {kind === 'pct' ? fmtV : fmtV}</span>;
}

function BeforeAfter({ mark, currency }) {
  const b = mark.before; const a = mark.after;
  const rows = [
    ['Sessions', b.sessions, a.sessions, 'plain', (x) => String(x)],
    ['Cache-hit ratio', b.cacheHitRatio, a.cacheHitRatio, 'pct', pct],
    ['Tokens per session', b.perSession?.tokens, a.perSession?.tokens, 'plain', (x) => (x == null ? 'no sessions' : Math.round(x).toLocaleString('en-US'))],
    ['Spend per session', b.perSession?.spend, a.perSession?.spend, 'money', (x) => (x == null ? 'no sessions' : money(x, currency))],
    ['Limit events per session', b.perSession?.limitEvents, a.perSession?.limitEvents, 'plain', (x) => (x == null ? 'no sessions' : x.toFixed(2))],
    ['Active minutes per session', b.perSession?.activeMinutes, a.perSession?.activeMinutes, 'plain', (x) => (x == null ? 'no sessions' : x.toFixed(2))],
  ];
  return (
    <div style={S.card} data-testid={`before-after-${mark.id}`}>
      <div style={S.cardTitle}><AreaPill area={mark.area} /> {mark.title}</div>
      <div style={S.sub}>Applied on {mark.appliedOn} to {mark.targetPath}. Before = sessions that ended before that day; after = sessions that ended on or after it.</div>
      {(b.sessions === 0 || a.sessions === 0) && <div style={S.note}>{b.sessions === 0 ? 'No sessions ended before this change' : 'No sessions have ended since this change'}, so there is nothing to compare yet.</div>}
      <div className="sm-grid3" style={{ fontSize: '.78rem' }}>
        <strong>Metric</strong><strong>Before</strong><strong>After</strong>
        {rows.map(([label, bv, av, kind, f]) => (
          <React.Fragment key={label}>
            <span>{label}</span>
            <span>{kind === 'plain' && label === 'Sessions' ? bv : f(bv)}</span>
            <span>{kind === 'plain' && label === 'Sessions' ? av : f(av)} {label !== 'Sessions' && bv != null && av != null && <em style={{ color: C.sec }}>(<Delta before={bv} after={av} kind={kind} currency={currency} />)</em>}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TrendsTab({ trends }) {
  const days = trends.days;
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(null);
  const last = Math.max(days.length - 1, 0);
  const to = toIdx == null ? last : Math.min(toIdx, last);
  const from = Math.min(fromIdx, to);
  const shown = days.slice(from, to + 1);

  const charts = useMemo(() => {
    const categories = shown.map((d) => ({ key: d.date, label: d.date.slice(5), tip: d.date }));
    const unpricedNote = (d) => (d.unpriced.length && d.spend === 0);
    const TYPES = [['input', 'Input tokens'], ['cacheWrite', 'Cache-write tokens'], ['cacheRead', 'Cache-read tokens'], ['output', 'Output tokens']];
    return {
      tokens: stackedBarsHtml({
        title: 'Tokens by type', subtitle: 'Per day, by the day each session ended (UTC)', categories, unit: 'tokens', axisLabel: 'Tokens',
        series: TYPES.map(([k, label]) => ({ key: k, label, values: shown.map((d) => d.tokens[k]) })),
      }),
      spend: stackedBarsHtml({
        title: 'Spend', subtitle: `Per day, ${trends.currency}, from the saved price table`, categories, unit: trends.currency, axisLabel: `Spend (${trends.currency})`,
        series: [{ key: 'spend', label: 'Spend', values: shown.map((d) => (unpricedNote(d) ? null : Math.round(d.spend * 10000) / 10000)) }],
        emptyMessage: 'Nothing priced yet.', valueDigits: 4,
        formatValue: (v) => (v >= 1 ? compact(v) : String(+v.toFixed(4))),
      }),
      cache: stackedBarsHtml({
        title: 'Cache-hit ratio', subtitle: 'Cache-read tokens as a share of everything read, per day', categories, unit: '%', axisLabel: 'Cache-hit ratio (%)',
        series: [{ key: 'ratio', label: 'Cache-hit ratio', values: shown.map((d) => (d.cacheHitRatio == null ? null : Math.round(d.cacheHitRatio * 1000) / 10)) }],
        formatValue: (v) => `${Math.round(v)}%`,
      }),
      time: stackedBarsHtml({
        title: 'Active time', subtitle: 'Minutes of work per day (idle gaps excluded; inferred from timestamps)', categories, unit: 'minutes', axisLabel: 'Active minutes',
        series: [{ key: 'active', label: 'Active minutes', values: shown.map((d) => d.activeMinutes) }],
      }),
      limits: stackedBarsHtml({
        title: 'Limit events', subtitle: 'Usage and rate limits, and context compactions, per day', categories, unit: 'events', axisLabel: 'Events',
        series: [
          { key: 'limits', label: 'Usage or rate limits', values: shown.map((d) => d.limitEvents) },
          { key: 'compactions', label: 'Compactions', values: shown.map((d) => d.compactions) },
        ],
      }),
    };
  }, [shown, trends.currency]);

  const sum = useMemo(() => {
    const t = { sessions: 0, tokens: 0, spend: 0, unpriced: new Set(), read: 0, denom: 0 };
    for (const d of shown) {
      t.sessions += d.sessions; t.tokens += d.totalTokens; t.spend += d.spend; d.unpriced.forEach((m) => t.unpriced.add(m));
      const den = d.tokens.input + d.tokens.cacheWrite + d.tokens.cacheRead;
      t.read += d.tokens.cacheRead; t.denom += den;
    }
    return t;
  }, [shown]);

  if (!days.length) {
    return (
      <div>
        <div style={S.empty} role="status">No sessions have been filed yet. Open the Import tab to file one.</div>
        {trends.undated > 0 && <div style={S.note}>{trends.undated} filed session{trends.undated === 1 ? ' has' : 's have'} no end time and cannot be placed on the timeline.</div>}
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
        <div style={S.stat}><div style={S.statV} data-testid="stat-sessions">{sum.sessions}</div><div style={S.statL}>Sessions</div></div>
        <div style={S.stat}><div style={S.statV} data-testid="stat-tokens">{sum.tokens.toLocaleString('en-US')}</div><div style={S.statL}>Tokens</div></div>
        <div style={S.stat}><div style={S.statV} data-testid="stat-spend">{sum.unpriced.size && sum.spend === 0 ? 'not priced' : money(sum.spend, trends.currency)}</div><div style={S.statL}>Spend</div></div>
        <div style={S.stat}><div style={S.statV} data-testid="stat-cache">{sum.denom ? pct(sum.read / sum.denom) : 'not recorded'}</div><div style={S.statL}>Cache-hit ratio</div></div>
      </div>
      {sum.unpriced.size > 0 && <div style={S.note} role="status">Not priced (add a price row in Settings): {[...sum.unpriced].join(', ')}. Their spend is left out, not counted as zero.</div>}
      {trends.undated > 0 && <div style={S.note}>{trends.undated} filed session{trends.undated === 1 ? ' has' : 's have'} no end time and is not on the timeline.</div>}
      <div style={S.card}>
        <div style={S.cardTitle}>Timeline</div>
        <div style={S.row}>
          <Field label="Timeline from" style={{ flex: '1 1 220px' }}>
            <input type="range" aria-label="Timeline from" min={0} max={last} value={from} onChange={(e) => setFromIdx(Number(e.target.value))} disabled={days.length < 2} />
          </Field>
          <Field label="Timeline through" style={{ flex: '1 1 220px' }}>
            <input type="range" aria-label="Timeline through" min={0} max={last} value={to} onChange={(e) => setToIdx(Number(e.target.value))} disabled={days.length < 2} />
          </Field>
        </div>
        <div data-testid="timeline-range" style={{ fontSize: '.82rem' }}>Showing {days[from].date} to {days[to].date} ({shown.length} day{shown.length === 1 ? '' : 's'} with sessions)</div>
      </div>
      <div className="sm-grid2">
        {Object.entries(charts).map(([k, html]) => <div key={k} className="sm-chart" style={S.card} data-chart={k} dangerouslySetInnerHTML={{ __html: html }} />)}
      </div>
      <h2 style={{ ...S.h1, fontSize: '1.05rem', margin: '.4rem 0 .5rem' }}>Before and after applied mappings</h2>
      {trends.applied.length === 0
        ? <div style={S.empty} role="status">No mapping has been marked applied yet. Mark one applied in the Mapping queue to see its before and after here.</div>
        : trends.applied.map((m) => <BeforeAfter key={m.id} mark={m} currency={trends.currency} />)}
    </div>
  );
}

// ── Sessions ────────────────────────────────────────────────────────────────
function SessionDetail({ id, onBack, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setD(await api.getSessionAnalysis(id)); setError(''); } catch (e) { setError(e.message); } }, [id]);
  useEffect(() => { load(); }, [load]);
  async function remap() {
    setError('');
    try { setD(await api.remapSessionAnalysis(id)); toast.success('Mapping re-run'); await onChanged(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  if (!d) return <div>{error ? <ErrorBox error={error} /> : 'Loading session…'}</div>;
  const s = d.session;
  const comp = s.limitEvents.filter((e) => e.kind === 'compaction');
  const hard = s.limitEvents.filter((e) => e.kind !== 'compaction');
  const topTools = Object.entries(s.toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div data-testid="session-detail">
      <button type="button" style={S.btn2} onClick={onBack}>← All sessions</button>
      <h2 style={{ ...S.h1, margin: '.7rem 0 .2rem' }}>{s.label}</h2>
      <div style={S.sub}>{s.source === 'in_app_agent' ? 'In-app agent run' : 'Claude Code session'} · ended {day(s.endedAt)} · {s.messages} message{s.messages === 1 ? '' : 's'} (usage counted once per message id)</div>
      <ErrorBox error={error} />
      <div style={S.card}>
        <div style={S.cardTitle}>Tokens, cache and spend</div>
        <div className="sm-grid2" style={{ fontSize: '.84rem' }}>
          <div>Input tokens: <strong data-testid="d-input">{fmt(s.tokens?.input)}</strong></div>
          <div>Cache-write tokens: <strong data-testid="d-cachew">{fmt(s.tokens?.cacheWrite)}</strong></div>
          <div>Cache-read tokens: <strong data-testid="d-cacher">{fmt(s.tokens?.cacheRead)}</strong></div>
          <div>Output tokens: <strong data-testid="d-output">{fmt(s.tokens?.output)}</strong></div>
          <div>Cache-hit ratio: <strong data-testid="d-ratio">{pct(s.cacheHitRatio)}</strong></div>
          <div>Spend: <strong data-testid="d-spend">{spendText(s.spend, d.currency)}</strong></div>
          <div>Active time: <strong>{s.activeMinutes == null ? 'not recorded' : `${s.activeMinutes} min`}</strong></div>
          <div>Elapsed time: <strong>{s.elapsedMinutes == null ? 'not recorded' : `${s.elapsedMinutes} min`}</strong></div>
        </div>
        <div style={{ ...S.sub, margin: '.5rem 0 0' }}>Time is inferred from first and last timestamps. Peak context in one message: {fmt(s.peakContext)} tokens.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Agents ({s.agents.length})</div>
        {s.agents.length === 0 ? <div style={S.empty}>No per-agent breakdown recorded.</div> : s.agents.map((a) => (
          <div key={a.agentId} style={{ padding: '.4rem 0', borderBottom: `1px solid ${C.soft}` }} data-testid="agent-row">
            <strong>{a.label}</strong> · {fmt(a.messages)} message{a.messages === 1 ? '' : 's'} · {fmt(totalTokens(a.tokens))} tokens
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Limit events</div>
        <div data-testid="limit-summary">{hard.length} usage or rate-limit event{hard.length === 1 ? '' : 's'}, {comp.length} compaction{comp.length === 1 ? '' : 's'}</div>
        {s.limitEvents.map((e, i) => (
          <div key={i} style={{ fontSize: '.8rem', color: C.sec, padding: '.2rem 0' }}>
            {e.kind === 'compaction' ? `Compaction${e.trigger ? ` (${e.trigger})` : ''}: ${e.preTokens != null ? `${fmt(e.preTokens)} tokens before` : 'size not recorded'}` : `${e.kind.replace('_', ' ')}${e.status ? ` (HTTP ${e.status})` : ''}`}{e.at ? ` · ${day(e.at)}` : ''}
          </div>
        ))}
        {topTools.length > 0 && <div style={{ ...S.sub, margin: '.6rem 0 0' }}>Most-used tools: {topTools.map(([k, v]) => `${k} ${v}`).join(', ')}</div>}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Mapping proposals ({d.proposals.length})</div>
        <button type="button" style={S.btn2} onClick={remap}>Re-run mapping</button>
        {d.proposals.length === 0 ? <div style={{ ...S.empty, marginTop: '.6rem' }} role="status">No mapping proposed for this session: it is within every threshold.</div>
          : d.proposals.map((p) => (
            <div key={p.id} style={{ padding: '.5rem 0', borderBottom: `1px solid ${C.soft}` }}>
              <AreaPill area={p.area} /> <StatusPill status={p.status} /> {p.title}
              <div style={{ fontSize: '.76rem', color: C.sec }}>{p.targetPath}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function SessionsTab({ list, onChanged }) {
  const [openId, setOpenId] = useState(null);
  if (openId != null) return <SessionDetail id={openId} onBack={() => setOpenId(null)} onChanged={onChanged} />;
  if (!list.sessions.length) return <div style={S.empty} role="status">No sessions have been filed yet. Open the Import tab to file one.</div>;
  return (
    <div>
      {list.sessions.map((s) => (
        <div key={s.id} style={S.card} data-testid={`session-${s.id}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.6rem', flexWrap: 'wrap' }}>
            <div><strong>{s.label}</strong> <span style={S.pill(s.source === 'in_app_agent' ? C.teal : C.ink)}>{s.source === 'in_app_agent' ? 'in-app agent' : 'Claude Code'}</span></div>
            <div style={{ color: C.sec, fontSize: '.78rem' }}>Ended {day(s.endedAt)}</div>
          </div>
          <div style={{ fontSize: '.82rem', margin: '.4rem 0' }}>
            {fmt(totalTokens(s.tokens))} tokens · cache-hit {pct(s.cacheHitRatio)} · spend {spendText(s.spend, list.currency)} · {s.limitCount} limit event{s.limitCount === 1 ? '' : 's'} · {s.compactionCount} compaction{s.compactionCount === 1 ? '' : 's'} · {s.openProposals} open mapping{s.openProposals === 1 ? '' : 's'}
          </div>
          <button type="button" style={S.btn2} onClick={() => setOpenId(s.id)}>Open session details</button>
        </div>
      ))}
    </div>
  );
}

// ── Mapping queue ───────────────────────────────────────────────────────────
function ProposalCard({ p, onChanged }) {
  const gate = useToolCategoryGate();
  const [mode, setMode] = useState(null); // 'apply' | 'reject'
  const [appliedOn, setAppliedOn] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function apply() {
    setBusy(true); setError('');
    try {
      await gate.run(() => api.applySessionProposal(p.id, { appliedOn, note, ref }));
      toast.success('Mapping marked applied'); setMode(null); await onChanged();
    } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  }
  async function reject() {
    setBusy(true); setError('');
    try { await api.rejectSessionProposal(p.id, note); toast.success('Mapping rejected'); setMode(null); await onChanged(); } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  }
  return (
    <div style={S.card} data-testid={`proposal-${p.id}`}>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.3rem' }}>
        <AreaPill area={p.area} /> <StatusPill status={p.status} /> <strong>{p.title}</strong>
      </div>
      <div style={{ fontSize: '.78rem', color: C.sec }}>Edit target: <code>{p.targetPath}</code> · from {p.sessionLabel}</div>
      <div style={{ margin: '.5rem 0' }}>
        <div style={{ fontSize: '.7rem', color: C.sec, textTransform: 'uppercase', letterSpacing: '.06em' }}>Evidence</div>
        <ul style={{ margin: '.2rem 0 0 1.1rem', padding: 0, fontSize: '.82rem' }}>{p.evidence.map((e, i) => <li key={i}>{e.label}: {e.value}</li>)}</ul>
      </div>
      <div style={{ background: C.soft, borderRadius: 8, padding: '.6rem', fontSize: '.84rem', lineHeight: 1.5 }}>
        <div style={{ fontSize: '.7rem', color: C.sec, textTransform: 'uppercase', letterSpacing: '.06em' }}>Suggested edit</div>
        {p.suggestedEdit}
      </div>
      {p.status === 'applied' && <div style={{ ...S.note }}>Applied on {p.appliedOn}{p.appliedRef ? ` · ${p.appliedRef}` : ''}{p.decisionNote ? ` · ${p.decisionNote}` : ''}</div>}
      {p.status === 'rejected' && <div style={{ ...S.note }}>Rejected: {p.decisionNote}</div>}
      <ErrorBox error={error} />
      {p.status === 'proposed' && !mode && (
        <div style={{ ...S.row, marginTop: '.6rem', marginBottom: 0 }}>
          <button type="button" style={S.btn} onClick={() => setMode('apply')}>Mark applied</button>
          <button type="button" style={S.btn2} onClick={() => setMode('reject')}>Reject</button>
        </div>
      )}
      {mode === 'apply' && (
        <div style={{ marginTop: '.6rem' }}>
          <div style={S.row}>
            <Field label="Applied on"><input style={S.input} type="date" value={appliedOn} onChange={(e) => setAppliedOn(e.target.value)} aria-label="Applied on" /></Field>
            <Field label="Reference (commit or note)" style={{ flex: '1 1 200px' }}><input style={S.input} value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference" /></Field>
          </div>
          <Field label="Note"><input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Apply note" /></Field>
          <div style={{ ...S.row, marginTop: '.6rem', marginBottom: 0 }}>
            <button type="button" style={S.btn} disabled={busy} onClick={apply}>Confirm applied</button>
            <button type="button" style={S.btn2} onClick={() => { setMode(null); setError(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {mode === 'reject' && (
        <div style={{ marginTop: '.6rem' }}>
          <Field label="Why is this rejected?"><input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Rejection note" /></Field>
          <div style={{ ...S.row, marginTop: '.6rem', marginBottom: 0 }}>
            <button type="button" style={S.btn} disabled={busy} onClick={reject}>Confirm reject</button>
            <button type="button" style={S.btn2} onClick={() => { setMode(null); setError(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueTab({ onChanged, version }) {
  const [status, setStatus] = useState('proposed');
  const [area, setArea] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const seq = useRef(0);
  const load = useCallback(async () => {
    // Only the newest request may write: a slow earlier answer must never overwrite a later filter's list.
    const mine = ++seq.current;
    try {
      const r = (await api.listSessionProposals({ status, area })).proposals;
      if (mine === seq.current) { setRows(r); setError(''); }
    } catch (e) { if (mine === seq.current) setError(e.message); }
  }, [status, area]);
  useEffect(() => { load(); }, [load, version]);
  async function changed() { await load(); await onChanged(); }
  return (
    <div>
      <div style={S.row}>
        <Field label="Status">
          <select style={S.input} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            <option value="proposed">Proposed</option><option value="applied">Applied</option><option value="rejected">Rejected</option><option value="">All</option>
          </select>
        </Field>
        <Field label="Area">
          <select style={S.input} value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area filter">
            <option value="">All areas</option>
            {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
      <ErrorBox error={error} />
      {rows == null ? 'Loading…' : rows.length === 0
        ? <div style={S.empty} role="status">No mappings match.</div>
        : <div data-testid="queue-count" style={{ ...S.sub, marginTop: 0 }}>{rows.length} mapping{rows.length === 1 ? '' : 's'}</div>}
      {(rows || []).map((p) => <ProposalCard key={p.id} p={p} onChanged={changed} />)}
    </div>
  );
}

// ── Import ──────────────────────────────────────────────────────────────────
function FailureRow({ f, onSaved }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  async function close(disposition) {
    setError('');
    try { await api.setSessionCaptureFailureDisposition(f.id, { disposition, note }); toast.success('Disposition saved'); setNote(''); await onSaved(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  return (
    <div style={{ padding: '.5rem 0', borderBottom: `1px solid ${C.soft}` }} data-testid={`failure-${f.id}`}>
      <StatusPill status={f.disposition === 'open' ? 'open' : f.disposition === 'reconciled' ? 'applied' : 'rejected'} /> {f.source}{f.ref ? ` · ${f.ref}` : ''}
      <div style={{ fontSize: '.82rem' }}>{f.error}</div>
      {f.disposition !== 'open' ? <div style={{ fontSize: '.78rem', color: C.sec }}>{f.disposition}: {f.dispositionNote}</div> : (
        <div style={{ ...S.row, marginTop: '.4rem', marginBottom: 0 }}>
          <input style={{ ...S.input, flex: '1 1 200px' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done" aria-label={`Disposition note ${f.id}`} />
          <button type="button" style={S.btn2} onClick={() => close('reconciled')}>Mark reconciled</button>
          <button type="button" style={S.btn2} onClick={() => close('accepted')}>Accept as known</button>
        </div>
      )}
      <ErrorBox error={error} />
    </div>
  );
}

function ImportTab({ onChanged }) {
  const [scan, setScan] = useState(null);
  const [scanErr, setScanErr] = useState('');
  const [busy, setBusy] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [main, setMain] = useState('');
  const [subs, setSubs] = useState([]);
  const [pasteMsg, setPasteMsg] = useState('');
  const [pasteErr, setPasteErr] = useState('');
  const [json, setJson] = useState('');
  const [jsonMsg, setJsonMsg] = useState('');
  const [jsonErr, setJsonErr] = useState('');
  const [failures, setFailures] = useState([]);
  const [failErr, setFailErr] = useState('');
  const loadFailures = useCallback(async () => { try { setFailures((await api.listSessionCaptureFailures()).failures); setFailErr(''); } catch (e) { setFailErr(e.message); } }, []);
  useEffect(() => { loadFailures(); }, [loadFailures]);

  async function runScan() {
    setBusy('scan'); setScanErr(''); setScan(null);
    try { const r = await api.scanSessionTranscripts(); setScan(r); await onChanged(); await loadFailures(); toast.success('Scan finished'); } catch (e) { setScanErr(e.message); toast.error(e.message); } finally { setBusy(''); }
  }
  async function sendPaste() {
    setBusy('paste'); setPasteErr(''); setPasteMsg('');
    try {
      const r = await api.importSessionTranscript({ sessionId, main, subagents: subs.map((s) => ({ label: s.label, text: s.text })) });
      setPasteMsg(`Filed as session #${r.id} (${r.created ? 'new' : 'updated'}). ${r.open} mapping proposal${r.open === 1 ? '' : 's'} in the queue.`);
      setMain(''); setSubs([]); await onChanged(); toast.success('Session filed');
    } catch (e) { setPasteErr(e.message); toast.error(e.message); } finally { setBusy(''); }
  }
  async function sendJson() {
    setBusy('json'); setJsonErr(''); setJsonMsg('');
    try {
      const r = await api.importSessionMetrics(json);
      setJsonMsg(`Filed as session #${r.id} (${r.created ? 'new' : 'updated'}). ${r.open} mapping proposal${r.open === 1 ? '' : 's'} in the queue.`);
      setJson(''); await onChanged(); toast.success('Analysis filed');
    } catch (e) { setJsonErr(e.message); toast.error(e.message); } finally { setBusy(''); }
  }
  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Scan server transcripts</div>
        <div style={S.sub}>Reads the Claude Code transcripts folder on the server (set in Settings), including subagents, and files each session as metrics only. Sessions already filed and unchanged are skipped.</div>
        <button type="button" style={S.btn} disabled={busy === 'scan'} onClick={runScan}>{busy === 'scan' ? 'Scanning…' : 'Scan server transcripts'}</button>
        <ErrorBox error={scanErr} />
        {scan && <div style={S.note} role="status" data-testid="scan-result">Found {scan.found} transcript{scan.found === 1 ? '' : 's'}: {scan.imported} new, {scan.updated} updated, {scan.unchanged} unchanged, {scan.failed.length} failed{scan.hookFailuresFiled ? `, ${scan.hookFailuresFiled} hook failure${scan.hookFailuresFiled === 1 ? '' : 's'} filed below` : ''}.</div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Paste a transcript</div>
        <div style={S.sub}>Paste the transcript lines (one JSON object per line, up to about 2 MB). They are read once to count tokens, time and limit events and are not stored.</div>
        <Field label="Session name"><input style={S.input} value={sessionId} onChange={(e) => setSessionId(e.target.value)} aria-label="Session name" /></Field>
        <Field label="Main session transcript" style={{ marginTop: '.5rem' }}><textarea style={S.textarea} value={main} onChange={(e) => setMain(e.target.value)} aria-label="Main session transcript" spellCheck={false} /></Field>
        {subs.map((s, i) => (
          <div key={i} style={{ marginTop: '.5rem' }}>
            <Field label={`Subagent ${i + 1} label`}><input style={S.input} value={s.label} onChange={(e) => setSubs(subs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label={`Subagent ${i + 1} label`} /></Field>
            <Field label={`Subagent ${i + 1} transcript`} style={{ marginTop: '.3rem' }}><textarea style={S.textarea} value={s.text} onChange={(e) => setSubs(subs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} aria-label={`Subagent ${i + 1} transcript`} spellCheck={false} /></Field>
            <button type="button" style={{ ...S.btn2, marginTop: '.3rem' }} onClick={() => setSubs(subs.filter((_, j) => j !== i))}>Remove subagent {i + 1}</button>
          </div>
        ))}
        <div style={{ ...S.row, marginTop: '.6rem', marginBottom: 0 }}>
          <button type="button" style={S.btn2} onClick={() => setSubs([...subs, { label: '', text: '' }])}>Add subagent transcript</button>
          <button type="button" style={S.btn} disabled={busy === 'paste'} onClick={sendPaste}>Analyze and file</button>
        </div>
        <ErrorBox error={pasteErr} />
        {pasteMsg && <div style={S.note} role="status" data-testid="paste-result">{pasteMsg}</div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Paste an analysis (JSON)</div>
        <div style={S.sub}>For output from <code>node scripts/analyze-session.mjs --json</code> (the <code>analysis</code> object), or for an analysis made elsewhere.</div>
        <textarea style={S.textarea} value={json} onChange={(e) => setJson(e.target.value)} aria-label="Analysis JSON" spellCheck={false} />
        <div style={{ marginTop: '.6rem' }}><button type="button" style={S.btn} disabled={busy === 'json'} onClick={sendJson}>File analysis</button></div>
        <ErrorBox error={jsonErr} />
        {jsonMsg && <div style={S.note} role="status" data-testid="json-result">{jsonMsg}</div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Capture failures ({failures.filter((f) => f.disposition === 'open').length} open)</div>
        <div style={S.sub}>A session end, scan or in-app agent run that could not be filed lands here. Only a note saying what was done closes one.</div>
        <ErrorBox error={failErr} />
        {failures.length === 0 ? <div style={S.empty} role="status">No capture failures.</div> : failures.map((f) => <FailureRow key={f.id} f={f} onSaved={loadFailures} />)}
      </div>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
const THRESHOLD_LABELS = {
  cacheHitRatioMin: 'Cache-hit ratio below (0 to 1)',
  minMessagesForCache: 'Minimum messages before judging cache',
  compactionsMax: 'Compactions allowed before proposing',
  agentTokenShareMax: 'One agent’s share of tokens above (0 to 1)',
  minAgentsForShare: 'Minimum agents before judging share',
  limitEventsMax: 'Usage or rate limits allowed before proposing',
  skillRepeatMin: 'Skill invoked this many times',
};

function SettingsTab({ onChanged }) {
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    try { const r = await api.getSessionMappingConfig(); setState(r); setDraft(structuredClone(r.rules)); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function save() {
    setError(''); setMsg('');
    try {
      const r = await api.saveSessionMappingConfig(draft);
      setMsg(`Saved. Mapping re-run for ${r.remapped.sessions} session${r.remapped.sessions === 1 ? '' : 's'}.`);
      toast.success('Settings saved'); await load(); await onChanged();
    } catch (e) { setError(e.message); toast.error(e.message); }
  }
  async function reset() {
    setError(''); setMsg('');
    try { const r = await api.resetSessionMappingConfig(); setMsg(`Defaults restored. Mapping re-run for ${r.remapped.sessions} session${r.remapped.sessions === 1 ? '' : 's'}.`); await load(); await onChanged(); } catch (e) { setError(e.message); toast.error(e.message); }
  }
  if (!draft) return <div>{error ? <ErrorBox error={error} /> : 'Loading settings…'}</div>;
  const setPrice = (i, k, v) => setDraft({ ...draft, prices: draft.prices.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  return (
    <div>
      {state?.overrideError && <ErrorBox error={state.overrideError} />}
      <ErrorBox error={error} />
      {msg && <div style={S.note} role="status" data-testid="settings-result">{msg}</div>}
      <div style={S.card}>
        <div style={S.cardTitle}>Price table</div>
        <div style={S.sub}>Price per million tokens, matched by the start of the model id (first row that matches wins). A model with no row is shown as “not priced”, never as zero. Prices apply to every stored session the moment you save.</div>
        <Field label="Currency" style={{ maxWidth: 140 }}><input style={S.input} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} aria-label="Currency" /></Field>
        {draft.prices.map((p, i) => (
          <div key={i} style={{ ...S.row, marginTop: '.7rem', paddingTop: '.6rem', borderTop: `1px solid ${C.soft}` }} data-testid={`price-row-${i}`}>
            <Field label="Model starts with" style={{ flex: '1 1 160px' }}><input style={S.input} value={p.match} onChange={(e) => setPrice(i, 'match', e.target.value)} aria-label={`Price row ${i + 1} model prefix`} /></Field>
            {['input', 'cacheWrite', 'cacheRead', 'output'].map((k) => (
              <Field key={k} label={{ input: 'Input', cacheWrite: 'Cache write', cacheRead: 'Cache read', output: 'Output' }[k]} style={{ flex: '1 1 90px' }}>
                <input style={S.input} inputMode="decimal" value={p[k]} onChange={(e) => setPrice(i, k, e.target.value)} aria-label={`Price row ${i + 1} ${k}`} />
              </Field>
            ))}
            <button type="button" style={S.btn2} onClick={() => setDraft({ ...draft, prices: draft.prices.filter((_, j) => j !== i) })}>Remove row {i + 1}</button>
          </div>
        ))}
        <button type="button" style={{ ...S.btn2, marginTop: '.6rem' }} onClick={() => setDraft({ ...draft, prices: [...draft.prices, { match: '', input: '', cacheWrite: '', cacheRead: '', output: '' }] })}>Add price row</button>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Capture</div>
        <div style={S.row}>
          <Field label="Idle gap that is not work (minutes)" style={{ flex: '1 1 200px' }}><input style={S.input} inputMode="decimal" value={draft.idleCapMinutes} onChange={(e) => setDraft({ ...draft, idleCapMinutes: e.target.value })} aria-label="Idle gap minutes" /></Field>
          <Field label="Transcripts folder on the server (blank = default)" style={{ flex: '2 1 280px' }}><input style={S.input} value={draft.transcriptsDir} onChange={(e) => setDraft({ ...draft, transcriptsDir: e.target.value })} aria-label="Transcripts folder" /></Field>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>When a mapping is proposed</div>
        <div className="sm-grid2">
          {Object.entries(THRESHOLD_LABELS).map(([k, label]) => (
            <Field key={k} label={label}><input style={S.input} inputMode="decimal" value={draft.thresholds[k]} onChange={(e) => setDraft({ ...draft, thresholds: { ...draft.thresholds, [k]: e.target.value } })} aria-label={label} /></Field>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Where each area’s suggested edit points</div>
        <div className="sm-grid2">
          {Object.entries(AREA_LABELS).map(([k, label]) => (
            <Field key={k} label={`${label} target file`}><input style={S.input} value={draft.targets[k]} onChange={(e) => setDraft({ ...draft, targets: { ...draft.targets, [k]: e.target.value } })} aria-label={`${label} target file`} /></Field>
          ))}
        </div>
      </div>
      <div style={S.row}>
        <button type="button" style={S.btn} onClick={save}>Save settings</button>
        <button type="button" style={S.btn2} onClick={reset}>Restore defaults</button>
      </div>
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────────────────
const TABS = ['Trends', 'Sessions', 'Mapping queue', 'Import', 'Settings'];

export default function SessionMappingPanel() {
  const [tab, setTab] = useState('Trends');
  const [trends, setTrends] = useState(null);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const refreshSeq = useRef(0);
  const refresh = useCallback(async () => {
    const mine = ++refreshSeq.current; // newest request wins; an older, slower answer is dropped
    try {
      const [t, l] = await Promise.all([api.getSessionTrends(), api.listSessionAnalyses()]);
      if (mine === refreshSeq.current) { setTrends(t); setList(l); setError(''); }
    } catch (e) { if (mine === refreshSeq.current) setError(e.message); }
    if (mine === refreshSeq.current) setVersion((v) => v + 1);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  // Opening a tab always shows fresh numbers: clear what is held and reload, so a stale list is never read as current.
  function openTab(t) {
    if (t !== tab) { setTrends(null); setList(null); refresh(); }
    setTab(t);
  }
  return (
    <div className="sm-root" style={S.root} data-testid="session-mapping">
      <style>{CSS}</style>
      <h1 style={S.h1}>Sessions</h1>
      <div style={S.sub}>What each Claude Code session and in-app agent run cost in tokens, money and time, and which edits to context, prompts, cache and memory would improve the next one. Metrics only: no conversation text is stored or shown here.</div>
      <div style={S.tabs} role="tablist">
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} style={S.tab(tab === t)} onClick={() => openTab(t)}>{t}</button>)}
      </div>
      <ErrorBox error={error} />
      {tab === 'Trends' && (trends ? <TrendsTab trends={trends} /> : !error && 'Loading…')}
      {tab === 'Sessions' && (list ? <SessionsTab list={list} onChanged={refresh} /> : !error && 'Loading…')}
      {tab === 'Mapping queue' && <QueueTab onChanged={refresh} version={version} />}
      {tab === 'Import' && <ImportTab onChanged={refresh} />}
      {tab === 'Settings' && <SettingsTab onChanged={refresh} />}
    </div>
  );
}
