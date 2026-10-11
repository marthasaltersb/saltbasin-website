// World mode of the release tracker: the shared Tracker World engine (src/lib/trackerWorld/trackerWorldEngine.js,
// also inlined in the artifact page tools/release-tracker/index.html) draws the WHOLE view and owns the data views
// for features, bugs, agents and districts. This component only wires data to it and fills the slot the engine
// leaves for platform-only sections: the render-binding data map, pending changes, and the Board's own layers for
// status updates, stat tiles and test rounds.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createTrackerWorld, selectionOf } from '../../lib/trackerWorld/trackerWorldEngine.js';
import { dataMapFor, impactOf, makeTrackerBind } from '../../lib/releaseTrackerWorld.js';
import { hashFor, statusText, fmtT, pendingFor, pointIndexAt } from '../../lib/releaseTrackerModel.js';

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

function PendingSection({ snap, featureKey }) {
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

const TOKEN_VAR = (t) => {
  if (['body', 'display', 'mono'].includes(t)) return `--rt-${t}`;
  if (t === 'panel2') return '--rt-panel-2';
  return `--rt-${t.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
};

export default function TrackerWorld({ ctx, layer, rootRef, themeKey }) {
  const { snap, hist, path } = ctx;
  const mountRef = useRef(null); const worldRef = useRef(null);
  const bindRef = useRef(null); const histRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [view, setView] = useState(null);     // { sel, at, overview, slot, owns } reported by the engine
  bindRef.current = makeTrackerBind(snap); histRef.current = hist;

  useEffect(() => {
    let cancelled = false; let world = null;
    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('This browser cannot draw 3D (WebGL is unavailable). Use the Board view, which lists every object.');
        const [THREE, geo] = await Promise.all([import('three'), import('../../lib/crystalGeometry.js')]);
        if (cancelled) return;
        const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
        world = createTrackerWorld({
          THREE,
          geo: {
            addCrystalLights: geo.addCrystalLights, signature: geo.CRYSTAL_VARIANTS.signature, buildGemMesh: geo.buildGemMesh,
            buildRiverParticles: geo.buildRiverParticles, advanceRiverParticles: geo.advanceRiverParticles, projectToScreen: geo.projectToScreen, buildEnvironment: geo.buildEnvironment,
          },
          root: mountRef.current,
          host: {
            reducedMotion: reduce, environment: 'underwater', overviewSlot: true,
            cssVar: (t) => getComputedStyle(rootRef.current || document.documentElement).getPropertyValue(TOKEN_VAR(t)).trim(),
            hashFor, navigate: (h) => { window.location.hash = h; },
            statusText, fmtT, pointIndexAt: (iso) => (histRef.current ? pointIndexAt(histRef.current, iso) : 0),
            bind: (...a) => bindRef.current(...a),
            onView: (v) => setView(v),
          },
        });
        worldRef.current = world; setReady(true);
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; worldRef.current = null; world?.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready && worldRef.current) worldRef.current.update({ snap, hist, path, now: ctx.now });
  }, [ready, snap, hist, path.join('/'), ctx.now]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) worldRef.current?.refreshColors(); }, [themeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  let hostContent = null;
  if (view?.slot) {
    const sel = selectionOf(path, snap);
    const fobj = sel?.kind === 'feature' ? snap.features.find((x) => x.key === sel.feature) : null;
    if (view.overview) {
      hostContent = (
        <section>
          <h2>The world is a view — its data map</h2>
          <div className="rt-muted" style={{ fontSize: 13, marginBottom: 6 }}>Every property the world draws is mapped to a source field. Nothing is drawn without a mapping. Changes marked <b>Needs approval</b> show as translucent ghosts until approved.</div>
          <DataMap rows={dataMapFor(snap, null)} />
        </section>
      );
    } else if (fobj && view.at == null) {
      hostContent = (<><section><h2>Data map — what this crystal draws, and from where</h2><DataMap rows={dataMapFor(snap, fobj)} /></section><PendingSection snap={snap} featureKey={fobj.key} /></>);
    } else if (!view.owns && path.length) {
      hostContent = <div className="rt-layer">{layer.node}</div>;
    }
  }

  return (
    <div className="rt-world" id="rt-world" data-engine="tracker-world">
      <div ref={mountRef} />
      {error ? <div className="rt-alert" role="alert" style={{ margin: 12 }}>{error}</div> : null}
      {!ready && !error ? <div className="rt-empty" role="status">Drawing the world…</div> : null}
      {view?.slot && hostContent ? createPortal(hostContent, view.slot) : null}
    </div>
  );
}
