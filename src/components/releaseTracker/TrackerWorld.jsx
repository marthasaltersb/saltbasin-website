// World mode: the same tracker data as a Salt Basin crystal world (underwater by default).
// Everything drawn goes through render bindings (src/lib/releaseTrackerWorld.js) and the generic engine
// (src/lib/worldEngine/graphWorld.js); this component only wires data, the side panel and the history slider.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createGraphWorld } from '../../lib/worldEngine/graphWorld.js';
import { trackerGraph, dataMapFor, impactOf, worldFocusId } from '../../lib/releaseTrackerWorld.js';
import {
  BUG_SERIES, BACKLOG, PERSON, hashFor, tok, splitTok, fmtT, updateAt, stepUpdate, measureAtAll, pendingFor,
} from '../../lib/releaseTrackerModel.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rootHref = (...parts) => hashFor([parts[0] === 'feature' && parts[2] === 'round' ? tok('round', parts[1], parts[3]) : tok(...parts)]);
const TONES = [['--rt-teal', 'In progress'], ['--rt-good', 'Passed'], ['--rt-bad', 'Failing'], ['--rt-gold', 'Awaiting re-test'], ['--rt-human', 'Needs a person'], ['--rt-muted', 'Queued, not started or agent stopped']];

export function DataMap({ rows }) {
  return (
    <div className="rt-bind-list">{rows.map((b) => (
      <div className="rt-bind" key={b.id}>
        <div className="rt-bind-top"><b>{b.mark} {b.channel.toLowerCase()}</b>{b.current != null ? <span className="rt-bind-val">{b.current}</span> : null}</div>
        <div className="rt-muted">{b.legend}</div>
        <div className="rt-src">{b.source}</div>
        <div className="rt-bind-foot">
          {b.changePolicy === 'live' ? <span className="rt-policy">Live</span> : <span className="rt-policy approval">Needs approval</span>}
          <span className="rt-muted">{b.transform}{b.approver ? ` · approved by ${b.approver}` : ''}</span>
        </div>
      </div>
    ))}</div>
  );
}

function PendingSection({ snap, featureKey, href }) {
  const p = pendingFor(snap, featureKey);
  if (!p.length) return null;
  return (
    <section><h2>Pending changes ({p.length}) — awaiting approval</h2>
      <div style={{ display: 'grid', gap: 8 }}>{p.map((b) => (
        <div className="rt-pending" key={b.id}>
          <div><b>{b.id}</b> · fix proposed{(b.history || []).filter((h) => h.event === 'fixed').slice(-1).map((h) => (h.commit ? ` in ${String(h.commit).slice(0, 7)}` : '')).join('')} · approver: the next browser re-test</div>
          <div className="rt-muted">{b.step || ''}</div>
          <div><b>If approved, it changes:</b><ul>{impactOf(snap, b).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          <div className="rt-muted">If rejected (the re-test still fails), the bug returns to Open and the fix attempt is counted.</div>
        </div>
      ))}</div>
    </section>
  );
}

export default function TrackerWorld({ ctx, layer, rootRef, themeKey, worldAt, setWorldAt }) {
  const { snap, hist, path } = ctx;
  const stageRef = useRef(null); const labelsRef = useRef(null); const tipRef = useRef(null);
  const engRef = useRef(null); const sigRef = useRef('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const reduce = useMemo(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } }, []);

  const graph = useMemo(() => trackerGraph({ snap, hist, pointIdx: worldAt, href: rootHref }), [snap, hist, worldAt]);
  const focusKey = useMemo(() => worldFocusId(path, snap, splitTok), [path, snap]);

  useEffect(() => {
    let cancelled = false; let eng = null;
    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('This browser cannot draw 3D (WebGL is unavailable). Use the Board view or the crystal list.');
        eng = await createGraphWorld({
          stage: stageRef.current, labelsEl: labelsRef.current, tipEl: tipRef.current, reducedMotion: reduce,
          cssVar: (v) => getComputedStyle(rootRef.current || document.documentElement).getPropertyValue(v).trim(),
          onOpen: (h) => { window.location.hash = h || hashFor([]); },
          tipText: (u) => (u.kind === 'node'
            ? `<b>${esc(u.node.label)}</b><br>${esc(u.node.statusLabel)} · ${esc(u.node.sub)}<br><span class="rt-muted">${u.node.satellites.length} bug${u.node.satellites.length === 1 ? '' : 's'} in orbit · click to enter</span>`
            : `<b>${esc(u.sat.label)}</b><br><span class="rt-muted">${esc(u.sat.catLabel)}${u.sat.pending ? ' · fix pending approval (re-test)' : ''} · ${esc(u.node.label)}</span>`),
        });
        if (cancelled) { eng.dispose(); return; }
        engRef.current = eng; setReady(true);
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; engRef.current = null; eng?.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    const sig = JSON.stringify(graph);
    if (sig !== sigRef.current) { sigRef.current = sig; engRef.current.setGraph(graph); }
    engRef.current.focus(focusKey);
  }, [ready, graph, focusKey]);
  useEffect(() => { if (ready) { sigRef.current = ''; engRef.current.refreshColors(); sigRef.current = JSON.stringify(graph); } }, [themeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) engRef.current.setPaused(paused); }, [ready, paused]);

  const last = hist ? hist.points.length - 1 : 0;
  const cur = worldAt == null ? last : worldAt;
  const pt = hist && worldAt != null ? hist.points[worldAt] : null;
  const u = pt ? updateAt(hist, pt) : null;
  const counts = pt ? measureAtAll(pt) : {
    open: (snap.bugs || []).filter((b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status)).length,
    verified: (snap.bugs || []).filter((b) => b.status === 'verified').length,
    backlog: (snap.bugs || []).filter((b) => BACKLOG.includes(b.status)).length,
    person: (snap.bugs || []).filter((b) => PERSON.includes(b.status)).length,
  };
  const statTok = { open: 'open-bugs', verified: 'verified', backlog: 'backlog', person: 'human' };
  const fobj = focusKey && snap.features.find((x) => x.key === focusKey);
  const crystalList = (
    <ul className="rt-world-list" aria-label="Every crystal">{graph.nodes.map((n) => (
      <li key={n.id}><a href={n.href}><span><b>{n.label}</b><br /><span className="rt-muted">{n.statusLabel}</span></span><span className="rt-num rt-muted">{n.sub}</span></a></li>
    ))}</ul>
  );
  const jump = (dir) => { if (!hist) return; const to = stepUpdate(hist, cur, dir); setWorldAt(to >= last ? null : to); };

  return (
    <div className="rt-world" id="rt-world">
      <div className="rt-stage" ref={stageRef}>
        <div className="rt-world-hint">Drag to orbit · scroll or pinch to zoom · click a crystal</div>
        <div className="rt-world-tools"><button type="button" className="rt-btn" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume motion' : 'Pause motion'}</button></div>
        <div className="rt-labels" ref={labelsRef} aria-hidden="true" />
        <div className="rt-tip" ref={tipRef} role="status" />
        {error ? <div className="rt-alert" role="alert" style={{ position: 'absolute', left: 12, right: 12, top: 56 }}>{error}</div> : null}
        {hist ? (
          <div className="rt-world-bar">
            <button type="button" className="rt-step" aria-label="Previous update (world)" onClick={() => jump(-1)}>‹</button>
            <input type="range" min={0} max={last} step={1} value={cur} aria-label="Replay the world at an earlier moment" onChange={(e) => setWorldAt(Number(e.target.value) >= last ? null : Number(e.target.value))} />
            <button type="button" className="rt-step" aria-label="Next update (world)" onClick={() => jump(1)}>›</button>
            <button type="button" className="rt-step live" aria-pressed={worldAt == null} onClick={() => setWorldAt(null)}>Live</button>
            <span className="rt-asof" aria-live="polite">{pt ? <>{fmtT(pt.t)} UTC{u ? ` · after ${u.version}` : ''}</> : <b>Live</b>}</span>
          </div>
        ) : null}
      </div>
      <aside className="rt-world-panel" id="rt-world-panel" aria-label="World details" aria-live="polite">
        {path.length === 0 ? (
          <>
            <div><h3 className="rt-layer-title">{graph.root.label}</h3><div className="rt-layer-sub">{graph.root.sub === 'live' ? 'Live' : graph.root.sub} · drag to orbit, scroll to zoom, click a crystal to enter it</div></div>
            <div className="rt-tiles">{BUG_SERIES.map((sr) => <a className="rt-stat" key={sr.key} href={rootHref('stat', statTok[sr.key])}><div className="rt-n">{counts[sr.key]}</div><div className="rt-l">{sr.label}</div></a>)}</div>
            <div className="rt-key"><h2>How to read the world</h2>
              <div><b>Crystal colour</b> = feature status</div>
              <div className="rt-row">{TONES.map(([c, l]) => <span className="rt-kk" key={c}><span className="rt-gem" style={{ background: `var(${c})` }} />{l}</span>)}</div>
              <div><b>Crystal size</b> = how many test steps it has · <b>gold ring</b> = share of steps passing · <b>stream of bubbles</b> from the centre = an agent working on it now</div>
              <div><b>Small satellites</b> = its bugs</div>
              <div className="rt-row">{BUG_SERIES.map((sr) => <span className="rt-kk" key={sr.key}><span className="rt-gem" style={{ background: `var(${sr.color})` }} />{sr.label}</span>)}</div>
            </div>
            <div><h2>The world is a view — its data map</h2>
              <div className="rt-muted" style={{ fontSize: 13, marginBottom: 6 }}>Every property the world draws is mapped to a source field. Nothing is drawn without a mapping. Changes marked <b>Needs approval</b> show as translucent ghosts until approved.</div>
              <DataMap rows={dataMapFor(snap, null)} />
              {graph.unmapped.length ? <div className="rt-alert" role="alert" style={{ marginTop: 8 }}>Not mapped: {graph.unmapped.join(', ')}</div> : null}
            </div>
            <div><h2>Every crystal</h2>{crystalList}</div>
          </>
        ) : (
          <>
            {fobj && worldAt == null ? <section><h2>Data map — what this crystal draws, and from where</h2><DataMap rows={dataMapFor(snap, fobj)} /></section> : null}
            {fobj && worldAt == null ? <PendingSection snap={snap} featureKey={focusKey} href={ctx.href} /> : null}
            {worldAt != null ? <div className="rt-note">Replaying {fmtT(pt.t)} UTC. The data map and individual bugs are shown for the live state only; satellites here are counts from the recorded state.</div> : null}
            <div className="rt-layer">{layer.node}</div>
            <details><summary style={{ cursor: 'pointer', padding: '8px 0' }}>Every crystal</summary>{crystalList}</details>
          </>
        )}
      </aside>
    </div>
  );
}
