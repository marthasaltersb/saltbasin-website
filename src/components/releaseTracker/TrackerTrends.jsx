// Overview trends panel: Show (Bugs / Test scores / Features passed), As (Totals / Change per update),
// feature filter, legend toggles per series, as-of tiles with change vs the previous update, a time slider
// over every recorded state with update markers, prev/next-update and Live, the update note at the slider
// point, per-feature test-score sparklines and a Table view. One value axis per chart. The chart is plain
// SVG (no CDN script) drawn with the validated series colours (--rt-s1..--rt-s4).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MEASURES, VIEWS, STATUS, ROLE, DEFAULT_T, fmtT, measureAt, seriesDefs, pointIndexAt, updateAt, updateIndexes, stepUpdate, changePairs, statusText,
} from '../../lib/releaseTrackerModel.js';

const STORE_KEY = 'rt-trends';
function loadT() {
  try { return { ...DEFAULT_T, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; } catch { return { ...DEFAULT_T }; }
}
function saveT(T) { try { const { at, live, ...keep } = T; localStorage.setItem(STORE_KEY, JSON.stringify(keep)); } catch { /* storage unavailable */ } }

function niceMax(max) {
  if (!(max > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(max)); const f = max / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

function useWidth(ref) {
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(ref.current); setW(Math.max(260, Math.round(ref.current.clientWidth || 640)));
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function Chart({ hist, T, defs, at, onPick, scoresPct }) {
  const box = useRef(null); const width = useWidth(box);
  const [hover, setHover] = useState(null);
  const H = width < 480 ? 240 : 290;
  const m = { l: 40, r: 12, t: 12, b: 26 };
  const iw = width - m.l - m.r; const ih = H - m.t - m.b;
  const hiddenOf = (d) => !!T.hidden[d.key];
  const visible = defs.filter((d) => !hiddenOf(d));
  const totals = T.view === 'totals';
  const pairs = useMemo(() => (totals ? null : changePairs(hist, T)), [hist, T, totals]);
  const labels = totals ? hist.points.map((p) => fmtT(p.t)) : pairs.map((p) => p.label);
  const n = labels.length;
  const data = defs.map((d) => ({
    d,
    vals: totals ? hist.points.map((p) => measureAt(p, T)[d.key]) : pairs.map((p) => (p.a[d.key] != null && p.b[d.key] != null ? Math.round((p.b[d.key] - p.a[d.key]) * 10) / 10 : null)),
  }));
  const all = data.filter((s) => !hiddenOf(s.d)).flatMap((s) => s.vals).filter((v) => v != null);
  let lo = 0; let hi = totals ? (T.measure === 'scores' ? 100 : Math.max(1, ...all)) : Math.max(1, ...all);
  if (!totals) { lo = Math.min(0, ...all); hi = Math.max(1, ...all); }
  let steps = 4;
  if (totals && T.measure !== 'scores') { if (hi <= 4) { hi = Math.max(1, Math.ceil(hi)); steps = hi; } else { hi = Math.ceil(hi / 4) * 4; } }
  const span = hi - lo || 1;
  const y = (v) => m.t + ih - ((v - lo) / span) * ih;
  const x = (i) => (totals ? m.l + (n > 1 ? (i / (n - 1)) * iw : iw / 2) : m.l + ((i + 0.5) / n) * iw);
  const ticks = []; for (let i = 0; i <= steps; i += 1) ticks.push(lo + (span * i) / steps);
  const fmtV = (v) => `${(!totals && v > 0 ? '+' : '')}${Math.round(v * 10) / 10}${scoresPct ? '%' : ''}`;
  const xs = []; const maxTicks = width < 480 ? 3 : 6; for (let i = 0; i < Math.min(n, maxTicks); i += 1) xs.push(Math.round((i * (n - 1)) / Math.max(1, Math.min(n, maxTicks) - 1)));
  const gx = (e) => { const r = box.current.getBoundingClientRect(); return e.clientX - r.left; };
  const nearest = (px) => { let best = 0; for (let i = 0; i < n; i += 1) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; return best; };
  const bw = Math.max(4, Math.min(26, (iw / Math.max(1, n)) / (Math.max(1, visible.length) + 1)));
  const upIdx = totals ? updateIndexes(hist) : [];
  const hoverU = hover != null && totals ? updateAt(hist, hist.points[hover]) : null;
  return (
    <div className="rt-chartbox" ref={box} style={{ height: H }}
      onPointerMove={(e) => setHover(nearest(gx(e)))} onPointerLeave={() => setHover(null)} onClick={(e) => { if (totals) onPick(nearest(gx(e))); }}>
      <svg viewBox={`0 0 ${width} ${H}`} role="img" aria-label={`Release trend chart: ${defs.map((d) => d.label).join(', ')}`}>
        {ticks.map((t, i) => (
          <g key={i}><line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="var(--rt-grid)" /><text x={m.l - 6} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--rt-muted)">{Math.round(t * 10) / 10}{scoresPct ? '%' : ''}</text></g>
        ))}
        {!totals && <line x1={m.l} x2={width - m.r} y1={y(0)} y2={y(0)} stroke="var(--rt-muted)" strokeOpacity=".5" />}
        {xs.map((i, j) => <text key={j} x={x(i)} y={H - 6} textAnchor={j === 0 ? 'start' : j === xs.length - 1 ? 'end' : 'middle'} fontSize="12" fill="var(--rt-muted)">{labels[i]}</text>)}
        {totals && upIdx.map((i, j) => <line key={j} x1={x(i)} x2={x(i)} y1={m.t} y2={m.t + ih} stroke="var(--rt-gold)" strokeDasharray="3 3" />)}
        {totals && data.filter((s) => !hiddenOf(s.d)).map((s) => {
          let dstr = ''; let pen = false;
          s.vals.forEach((v, i) => { if (v == null) { pen = false; return; } dstr += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
          return (
            <g key={s.d.key}>
              <path d={dstr} fill="none" stroke={`var(${s.d.color})`} strokeWidth="2" strokeLinejoin="round" />
              {n <= 40 && s.vals.map((v, i) => (v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={`var(${s.d.color})`} />))}
              {hover != null && s.vals[hover] != null && <circle cx={x(hover)} cy={y(s.vals[hover])} r="5" fill={`var(${s.d.color})`} stroke="var(--rt-panel)" strokeWidth="2" />}
            </g>
          );
        })}
        {!totals && data.filter((s) => !hiddenOf(s.d)).map((s, si) => s.vals.map((v, i) => {
          if (v == null) return null;
          const gw = bw * visible.length; const bx = x(i) - gw / 2 + si * bw;
          const y0 = y(0); const y1 = y(v);
          return <rect key={`${s.d.key}${i}`} x={bx} width={bw - 2} y={Math.min(y0, y1)} height={Math.max(1, Math.abs(y0 - y1))} rx="3" fill={`var(${s.d.color})`} stroke="var(--rt-panel)" strokeWidth="1" />;
        }))}
        {totals && at != null && <line x1={x(at)} x2={x(at)} y1={m.t} y2={m.t + ih} stroke="var(--rt-ink)" strokeOpacity=".55" strokeWidth="1.5" />}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--rt-muted)" strokeOpacity=".4" />}
      </svg>
      {hover != null && (
        <div className="rt-chart-tip" role="status" style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 200), top: 8 }}>
          <div className="rt-tt">{labels[hover]}</div>
          {hoverU ? <div className="rt-muted">after {hoverU.version}</div> : null}
          {data.filter((s) => !hiddenOf(s.d)).map((s) => <div className="rt-tr" key={s.d.key}><span className="rt-sw" style={{ width: 10, height: 10, borderRadius: 2, background: `var(${s.d.color})`, display: 'inline-block' }} />{s.d.label}: {s.vals[hover] == null ? '—' : fmtV(s.vals[hover])}</div>)}
        </div>
      )}
    </div>
  );
}

function Spark({ vals, at }) {
  const W = 200; const H = 34; const n = vals.length;
  const pts = vals.map((v, j) => (v == null ? null : [n > 1 ? (j / (n - 1)) * (W - 8) + 4 : W / 2, H - 4 - (v / 100) * (H - 8)]));
  let d = ''; let pen = false;
  for (const p of pts) { if (!p) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; }
  const mk = pts[at];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="4" x2={W - 4} y1={H - 4} y2={H - 4} stroke="var(--rt-grid)" strokeWidth="1" />
      {d ? <path d={d} fill="none" stroke="var(--rt-s1)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /> : null}
      {mk ? <circle cx={mk[0]} cy={mk[1]} r="4" fill="var(--rt-s1)" stroke="var(--rt-panel)" strokeWidth="2" /> : null}
    </svg>
  );
}

export default function TrackerTrends({ ctx }) {
  const { snap, hist, href } = ctx;
  const [T, setT] = useState(loadT);
  const [at, setAtState] = useState(null);   // null = live (follows the newest recorded state)
  const lastIdx = hist ? hist.points.length - 1 : 0;
  const cur = at == null || at > lastIdx ? lastIdx : at;
  const live = cur === lastIdx;
  const patch = (p) => setT((prev) => { const next = { ...prev, ...p }; saveT(next); return next; });

  const defs = useMemo(() => seriesDefs(T), [T]);
  if (!hist || !hist.points?.length) {
    return <section className="rt-trends"><div className="rt-trends-head"><h3>Release trends</h3></div><div className="rt-empty">Trend history loads with the next update.</div></section>;
  }
  const keys = Object.keys(hist.points[lastIdx].f);
  const pt = hist.points[cur];
  const u = updateAt(hist, pt);
  const prevU = u ? (hist.updates || [])[(hist.updates || []).indexOf(u) - 1] : null;
  const curM = measureAt(pt, T);
  const baseM = prevU ? measureAt(hist.points[pointIndexAt(hist, prevU.at)], T) : null;
  const unit = T.measure === 'scores' ? '%' : '';
  const fullU = u && (snap.updates || []).find((x) => x.version === u.version);
  const setCur = (i) => setAtState(Math.max(0, Math.min(lastIdx, i)) >= lastIdx ? null : Math.max(0, Math.min(lastIdx, i)));
  const seg = (name, opts) => (
    <div className="rt-seg" role="group" aria-label={name}>{opts.map(([v, l]) => <button key={v} type="button" aria-pressed={T[name] === v} onClick={() => patch({ [name]: v, hidden: {} })}>{l}</button>)}</div>
  );
  const rowsKeys = keys.filter((kk) => T.feature === 'all' || kk === T.feature);
  const sparkVals = (kk) => hist.points.map((p) => { const v = p.f[kk]; return v && v[3] ? Math.round((v[2] / v[3]) * 1000) / 10 : null; });
  return (
    <section className="rt-trends" id="rt-trends" aria-label="Release trends">
      <div className="rt-trends-head">
        <h3>Release trends{snap.release?.version ? ` · ${snap.release.version}` : ''}</h3>
        <span className="rt-asof">History since <b>{fmtT(hist.points[0].t)} UTC</b> · {hist.points.length} recorded states · {(hist.updates || []).length} updates</span>
      </div>
      <div className="rt-controls">
        <div className="rt-ctl"><span>Show</span> {seg('measure', MEASURES)}</div>
        <div className="rt-ctl"><span>As</span> {seg('view', VIEWS)}</div>
        <div className="rt-ctl"><span>Feature</span>
          <select aria-label="Feature filter" value={T.feature} onChange={(e) => patch({ feature: e.target.value, hidden: {} })}>
            <option value="all">All features</option>
            {keys.map((kk) => <option key={kk} value={kk}>{kk}</option>)}
          </select>
        </div>
        <div className="rt-seg" role="group" aria-label="Table view"><button type="button" aria-pressed={!!T.table} onClick={() => patch({ table: !T.table })}>Table view</button></div>
      </div>
      <div className="rt-legend" role="group" aria-label="Series">{defs.map((d) => (
        <button key={d.key} type="button" aria-pressed={!T.hidden[d.key]} onClick={() => patch({ hidden: { ...T.hidden, [d.key]: !T.hidden[d.key] } })}><span className="rt-sw" style={{ background: `var(${d.color})` }} />{d.label}</button>
      ))}</div>
      <div className="rt-tiles" aria-label="Values as of the slider position">{defs.map((d) => {
        const v = curM[d.key]; const b = baseM?.[d.key]; const delta = v != null && b != null ? v - b : null;
        return (
          <div className="rt-stat" key={d.key}><div className="rt-n">{v == null ? '—' : `${v}${unit}`}</div><div className="rt-l">{d.label}</div>
            <div className="rt-d">{delta == null ? 'no earlier update to compare' : delta === 0 ? `no change since ${prevU.version}` : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}${unit} since ${prevU.version}`}</div></div>
        );
      })}</div>
      {T.table ? (
        <div className="rt-tableview rt-panel"><table>
          <thead><tr><th>When (UTC)</th><th>Update</th>{defs.map((d) => <th key={d.key} className="rt-num">{d.label}</th>)}</tr></thead>
          <tbody>{[...hist.points].reverse().map((p) => { const mm = measureAt(p, T); const uu = updateAt(hist, p); return (
            <tr key={p.t}><td className="rt-num" data-label="When (UTC)">{fmtT(p.t)}</td><td data-label="Update">{uu ? uu.version : '—'}</td>{defs.map((d) => <td key={d.key} className="rt-num" data-label={d.label}>{mm[d.key] ?? '—'}</td>)}</tr>
          ); })}</tbody>
        </table></div>
      ) : <Chart hist={hist} T={T} defs={defs} at={cur} onPick={setCur} scoresPct={T.measure === 'scores'} />}
      <div className="rt-slider">
        <div className="rt-ticks" aria-hidden="true">{(hist.updates || []).map((uu) => <span key={uu.version} style={{ left: `${lastIdx ? (pointIndexAt(hist, uu.at) / lastIdx) * 100 : 50}%` }}>{uu.version.split('-').pop()}</span>)}</div>
        <div className="rt-slider-row">
          <button type="button" className="rt-step" aria-label="Previous update" title="Previous update" onClick={() => setCur(stepUpdate(hist, cur, -1))}>‹</button>
          <input type="range" min={0} max={lastIdx} step={1} value={cur} aria-label="Move through the release history" aria-valuetext={`${fmtT(pt.t)} UTC${u ? `, after ${u.version}` : ''}`} onChange={(e) => setCur(Number(e.target.value))} />
          <button type="button" className="rt-step" aria-label="Next update" title="Next update" onClick={() => setCur(stepUpdate(hist, cur, 1))}>›</button>
          <button type="button" className="rt-step live" aria-pressed={live} onClick={() => setAtState(null)}>Live</button>
        </div>
        <div className="rt-asof" aria-live="polite">{live ? <b>Live · </b> : null}As of <b>{fmtT(pt.t)} UTC</b> · commit {pt.c ? String(pt.c).slice(0, 7) : '—'}{u ? <> · after update <a href={href('update', u.version)}>{u.version}</a></> : ' · before the first update'}</div>
      </div>
      {fullU ? <div className="rt-update-note"><b>{fullU.version}</b>{fullU.headline ? ` — ${fullU.headline}` : ''} · <a href={href('update', fullU.version)}>Read the update notes ›</a></div> : null}
      <div>
        <h2 style={{ marginTop: 6 }}>Test score by feature</h2>
        <div className="rt-spark-grid">{rowsKeys.map((kk) => {
          const v = hist.points[cur].f[kk]; const vals = sparkVals(kk);
          return (
            <a className="rt-spark" key={kk} href={href('feature', kk)} title={`${kk}: step pass rate over time`}>
              <div className="rt-k">{kk}</div>
              <div className="rt-v">{v && v[3] ? `round ${v[1]}: ${v[2]}/${v[3]} steps (${vals[cur]}%)` : 'not tested yet'} · {STATUS[v?.[0]] || (v?.[0] ? statusText(v[0]) : '—')}</div>
              <Spark vals={vals} at={cur} />
            </a>
          );
        })}</div>
      </div>
    </section>
  );
}
