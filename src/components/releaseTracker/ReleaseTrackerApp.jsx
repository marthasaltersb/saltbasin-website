// Live release tracker screen. Reachable from the World Shell (island "Release tracker"), from Classic
// Tools, as a standalone page (/release-tracker) and, read-only, through a share link
// (/release-tracker/shared/:token). Design: docs/changes/live-release-tracker.md.
//
// Real time: a server-sent-events stream tells this screen the moment a new snapshot lands; it refetches and
// re-renders without a reload. The header always says how fresh the data is ("Updated N s ago") and whether
// the stream is live, reconnecting, or has fallen back to polling. A silent stale screen is never shown.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './releaseTracker.css';
import { api } from '../../lib/api.js';
import {
  STATS, makeHref, parseHash, hashFor, splitTok, agentName,
} from '../../lib/releaseTrackerModel.js';
import { LAYERS, RoundLayer } from './TrackerLayers.jsx';
import TrackerWorld from './TrackerWorld.jsx';
import TrackerSettings from './TrackerSettings.jsx';

const POLL_MS = 10000;
const store = {
  get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

function crumbLabel(t, snap) {
  const [type, a, b] = splitTok(t);
  if (type === 'stat') return STATS[a]?.label || a;
  if (type === 'updates') return 'Status updates';
  if (type === 'update') return `Update ${a}`;
  if (type === 'round') return `${a} · round ${b}`;
  if (type === 'agent') { const ag = (snap.agents || []).find((x) => x.id === a); return ag ? `${agentName(ag)} · ${ag.feature || ''}` : a; }
  return a;
}

function useHashPath() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return useMemo(() => parseHash(hash), [hash]);
}

export default function ReleaseTrackerApp({ embedded = false, shareToken = null }) {
  const rootRef = useRef(null);
  const path = useHashPath();
  const [data, setData] = useState(null);           // { viewer, state }
  const [fail, setFail] = useState(null);           // { kind: 'auth'|'denied'|'error', message }
  const [conn, setConn] = useState('connecting');   // connecting | live | reconnecting
  const [now, setNow] = useState(() => Date.now());
  const [release, setRelease] = useState(null);
  const [mode, setMode] = useState(() => (store.get('rt-mode', 'board') === 'world' ? 'world' : 'board'));
  const [theme, setTheme] = useState(() => store.get('rt-theme', 'auto'));
  const [dark, setDark] = useState(() => { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } });
  const [worldAt, setWorldAt] = useState(null);
  const seq = useRef(0); const releaseRef = useRef(null); releaseRef.current = release;

  const refetch = useCallback(async () => {
    const my = ++seq.current;
    try {
      const r = shareToken ? await api.releaseTrackerSharedState(shareToken) : await api.releaseTrackerState(releaseRef.current);
      if (my !== seq.current) return;
      setData(r); setFail(null);
    } catch (e) {
      if (my !== seq.current) return;
      const kind = e.status === 401 ? 'auth' : (e.status === 403 ? 'denied' : 'error');
      setFail({ kind, message: e.message });
    }
  }, [shareToken]);

  useEffect(() => { refetch(); }, [refetch, release]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const on = () => setDark(mq.matches);
      mq.addEventListener('change', on); return () => mq.removeEventListener('change', on);
    } catch { return undefined; }
  }, []);

  // Live stream with polling fallback.
  useEffect(() => {
    if (fail && (fail.kind === 'denied' || fail.kind === 'auth')) return undefined;
    let es = null; let poll = null; let retry = null; let closed = false;
    const url = shareToken ? `/api/release-tracker/shared/${encodeURIComponent(shareToken)}/stream` : '/api/release-tracker/stream';
    const stopPoll = () => { if (poll) { clearInterval(poll); poll = null; } };
    const startPoll = () => { if (!poll) poll = setInterval(refetch, POLL_MS); };
    const open = () => {
      if (closed) return;
      setConn('connecting');
      try { es = new EventSource(url, { withCredentials: true }); } catch { setConn('reconnecting'); startPoll(); retry = setTimeout(open, 5000); return; }
      es.addEventListener('hello', () => { setConn('live'); stopPoll(); refetch(); });
      es.addEventListener('snapshot', () => refetch());
      es.addEventListener('denied', () => { es.close(); refetch(); });
      es.onerror = () => {
        setConn('reconnecting'); startPoll();
        if (es.readyState === 2) { es.close(); retry = setTimeout(open, 5000); }   // closed for good: try a fresh connection
      };
    };
    open();
    return () => { closed = true; es?.close(); stopPoll(); clearTimeout(retry); };
  }, [shareToken, refetch, fail?.kind]);

  useEffect(() => { store.set('rt-mode', mode); }, [mode]);
  useEffect(() => { store.set('rt-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.dataset.rtView = mode; return () => { delete document.documentElement.dataset.rtView; }; }, [mode]);

  const state = data?.state || null;
  const snap = useMemo(() => (state ? { ...state.snapshot, features: state.snapshot.features || [], agents: state.snapshot.agents || [], bugs: state.snapshot.bugs || [] } : null), [state]);
  const hist = state?.history || null;
  const isAdmin = data?.viewer === 'admin';
  const onSettings = path[0] === 'settings';
  const pathNoSettings = onSettings ? [] : path;
  const effTheme = theme === 'auto' ? (dark ? 'dark' : 'light') : theme;

  const ctx = useMemo(() => (snap ? { snap, hist, path: pathNoSettings, href: makeHref(pathNoSettings), now } : null), [snap, hist, pathNoSettings.join('/'), now]); // eslint-disable-line react-hooks/exhaustive-deps

  const layer = useMemo(() => {
    if (!ctx || onSettings) return null;
    const last = ctx.path[ctx.path.length - 1] || '';
    const [type, ...args] = splitTok(last);
    const fn = LAYERS[type || ''];
    const out = fn ? fn(ctx, args) : null;
    return out || { crumbs: [], node: <div className="rt-panel rt-empty">That item is no longer in the tracker. Use the trail above to go back.</div>, missing: true };
  }, [ctx, onSettings]);

  const trail = useMemo(() => {
    if (!ctx) return [];
    return [['Overview', hashFor([])], ...ctx.path.map((t, i) => [crumbLabel(t, ctx.snap), hashFor(ctx.path.slice(0, i + 1))])];
  }, [ctx]);

  useEffect(() => {
    if (!embedded && trail.length) document.title = `${onSettings ? 'Settings' : trail[trail.length - 1][0]} · Release tracker`;
  }, [trail, embedded, onSettings]);
  const scrollTop = useRef({});
  useEffect(() => {
    if (embedded) return;
    const key = path.join('/');
    const saved = scrollTop.current[key];
    window.scrollTo(0, saved || 0);
    return () => { scrollTop.current[key] = window.scrollY; };
  }, [path.join('/')]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Freshness line ──
  const recvAgo = state ? Math.max(0, Math.round((now - state.meta.receivedAt) / 1000)) : null;
  const agoText = recvAgo == null ? '' : recvAgo < 60 ? `${recvAgo} s ago` : recvAgo < 3600 ? `${Math.floor(recvAgo / 60)} min ago` : `${Math.floor(recvAgo / 3600)} h ${Math.floor((recvAgo % 3600) / 60)} min ago`;
  const syncState = conn === 'live' ? (recvAgo > 1200 ? 'stale' : 'live') : conn === 'connecting' ? 'live' : 'reconnecting';
  const syncText = conn === 'live' ? 'Live' : conn === 'connecting' ? 'Connecting…' : `Live stream interrupted — checking every ${POLL_MS / 1000} s`;

  const denied = fail && (fail.kind === 'denied' || fail.kind === 'auth');
  const body = (() => {
    if (denied) {
      return (
        <div className="rt-card" role="alert" data-testid="rt-denied">
          <h3>{fail.kind === 'auth' ? 'Sign in to see the release tracker' : 'No access to the release tracker'}</h3>
          <p style={{ margin: 0 }}>{fail.message}</p>
          {fail.kind === 'auth' ? <a className="rt-btn primary" href="/login" style={{ textDecoration: 'none', justifySelf: 'start' }}>Sign in</a> : null}
        </div>
      );
    }
    if (fail && !state) return <div className="rt-alert" role="alert">{fail.message} <button type="button" className="rt-btn" onClick={refetch}>Try again</button></div>;
    if (!data) return <div className="rt-empty" role="status">Loading the release tracker…</div>;
    if (onSettings) return isAdmin ? <TrackerSettings currentRelease={state?.meta.releaseKey || ''} /> : <div className="rt-alert" role="alert">Only an admin can open the settings.</div>;
    if (!state) {
      return (
        <div className="rt-card" data-testid="rt-empty">
          <h3>No release data has arrived yet</h3>
          <p style={{ margin: 0 }}>{isAdmin ? 'Open Settings to point the tracker at a repository and fetch it, create an ingest token for a machine to push with, or paste a snapshot.' : 'An admin has not loaded any release data yet. This screen updates by itself when it arrives.'}</p>
          {isAdmin ? <a className="rt-btn primary" style={{ textDecoration: 'none', justifySelf: 'start' }} href={hashFor(['settings'])}>Open Settings</a> : null}
        </div>
      );
    }
    if (mode === 'world') return <TrackerWorld ctx={ctx} layer={layer} rootRef={rootRef} themeKey={effTheme} worldAt={worldAt} setWorldAt={setWorldAt} />;
    return <div className="rt-layer" key={ctx.path.join('/')}>{layer.node}</div>;
  })();

  return (
    <div className="rt-root" data-rt-theme={theme} ref={rootRef} style={embedded ? undefined : { minHeight: '100vh' }}>
      <div className="rt-wrap">
        <header className="rt-head">
          <div>
            <h1>Release tracker</h1>
            <div className="rt-muted">Click any number, feature, round, bug or agent to go one layer deeper. The trail at the top takes you back.</div>
          </div>
          <div className="rt-head-right">
            {state && !onSettings ? (
              <div className="rt-seg" role="group" aria-label="View">
                <button type="button" aria-pressed={mode === 'board'} onClick={() => setMode('board')}>Board</button>
                <button type="button" aria-pressed={mode === 'world'} onClick={() => setMode('world')}>World</button>
              </div>
            ) : null}
            <div className="rt-seg" role="group" aria-label="Theme">{[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => <button key={v} type="button" aria-pressed={theme === v} onClick={() => setTheme(v)}>{l}</button>)}</div>
            {isAdmin ? (
              <div className="rt-seg" role="group" aria-label="Screen">
                <button type="button" aria-pressed={!onSettings} onClick={() => { window.location.hash = hashFor([]); }}>Tracker</button>
                <button type="button" aria-pressed={onSettings} onClick={() => { window.location.hash = hashFor(['settings']); }}>Settings</button>
              </div>
            ) : null}
            {data && (data.state?.releases || []).length > 1 ? (
              <select className="rt-btn" aria-label="Release" value={release || state?.meta.releaseKey || ''} onChange={(e) => { setRelease(e.target.value); setWorldAt(null); }}>
                {state.releases.map((r) => <option key={r.releaseKey} value={r.releaseKey}>{r.releaseKey}</option>)}
              </select>
            ) : null}
            <div className="rt-sync" data-state={denied ? 'offline' : syncState} role="status" aria-live="polite" data-testid="rt-sync">
              <span className="rt-dot" aria-hidden="true" />{denied ? 'Not connected' : syncText}{state ? <> · Updated <b>{agoText}</b></> : null}
            </div>
          </div>
        </header>
        {state && !onSettings && !denied ? (
          <nav className="rt-crumbs" aria-label="Where you are">
            {trail.map(([label, h], i) => (i === trail.length - 1
              ? <span key={h} className="rt-here" aria-current="page">{label}</span>
              : <React.Fragment key={h}><a href={h}>{label}</a><span className="rt-sep" aria-hidden="true">›</span></React.Fragment>))}
          </nav>
        ) : null}
        {state?.meta.reconcileNote && isAdmin ? <div className="rt-alert" role="alert">{state.meta.reconcileNote}</div> : null}
        <main>{body}</main>
        {shareToken ? <div className="rt-muted" style={{ fontSize: 13 }}>Read-only view shared with a link.</div> : null}
      </div>
    </div>
  );
}
