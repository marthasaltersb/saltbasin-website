// Live career data on the QR page (2026-10-02). The document text is the
// approved version; the charts read the owner's Career Master live. This
// panel (1) says so boldly, (2) lists every difference from the approved
// printed version, and (3) lets the viewer slide from the frozen printed
// snapshot through each recorded change to live data.
import React, { useMemo, useState } from 'react';
import ChartViews from './ChartViews.jsx';
import { diffSnapshots, snapshotFingerprint } from '../lib/shareSnapshotDiff.js';

function fmt(ms) {
  return ms ? new Date(ms).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
}

function buildStates({ approved, history, live }) {
  const states = [];
  if (approved) states.push({ key: 'approved', label: 'Approved · printed', snapshot: approved, at: approved.capturedAt });
  (history || []).forEach((h, i) => states.push({ key: `h${i}`, label: `Update ${i + 1}`, snapshot: h, at: h.capturedAt }));
  if (live) {
    const last = states[states.length - 1];
    if (last && snapshotFingerprint(last.snapshot) === snapshotFingerprint(live)) {
      last.isLive = true;
      last.label = states.length === 1 ? 'Approved · printed = live now' : `${last.label} · live now`;
    } else {
      states.push({ key: 'live', label: 'Live now', snapshot: live, at: live.capturedAt, isLive: true });
    }
  }
  return states;
}

const CHANGE_STYLE = {
  added: { label: 'Added', color: '#2F9A68' },
  removed: { label: 'Removed', color: '#B04E2A' },
  changed: { label: 'Changed', color: '#C98320' },
};

function ChangeList({ changes }) {
  const byChart = new Map();
  for (const c of changes) {
    if (!byChart.has(c.chartTitle)) byChart.set(c.chartTitle, []);
    byChart.get(c.chartTitle).push(c);
  }
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {[...byChart.entries()].map(([title, list]) => (
        <div key={title}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{title}</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', lineHeight: 1.55 }}>
            {list.map((c, i) => (
              <li key={i}>
                <strong style={{ color: CHANGE_STYLE[c.change].color }}>{CHANGE_STYLE[c.change].label}:</strong>{' '}
                <strong>{c.label}</strong>
                {c.change === 'changed' && <> — printed <em>{c.from}</em> → now <em>{c.to}</em>{c.note ? ` (${c.note})` : ''}</>}
                {c.change === 'added' && c.to && <> — {c.to}</>}
                {c.change === 'removed' && c.from && <> — was {c.from}</>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Notice({ children }) {
  return <div role="alert" style={{ background: '#FFF4E5', border: '1px solid #C98320', borderRadius: 8, padding: '.7rem .9rem', margin: '1.75rem 0 1rem', fontSize: '.8rem', color: '#1B2A3B', lineHeight: 1.55 }}>{children}</div>;
}

export default function SharedLiveStates({ states: raw, documentState }) {
  const states = useMemo(() => buildStates(raw || {}), [raw]);
  const [index, setIndex] = useState(() => Math.max(0, states.length - 1));
  // Failures are stated, never shown as if the data simply matched.
  if (raw?.approvedMissing) {
    return (
      <>
        <Notice><strong>The printed version's chart snapshot was not captured when it was approved</strong>, so changes since printing can't be compared. {raw.liveError ? raw.liveError : 'Live career data is shown below.'}</Notice>
        {(raw.live?.charts || []).map((chart) => <ChartViews key={`live-${chart.key}`} chart={chart} />)}
      </>
    );
  }
  if (!states.length) return null;
  const approved = states[0];
  const selected = states[Math.min(index, states.length - 1)];
  const liveState = states.find((s) => s.isLive) || states[states.length - 1];
  const liveChanges = diffSnapshots(approved.snapshot, liveState.snapshot);
  const selectedChanges = diffSnapshots(approved.snapshot, selected.snapshot);
  const changedLabels = new Set(selectedChanges.map((c) => `${c.chartKey}|${c.label}`));

  if (raw?.liveError) {
    return (
      <>
        <Notice><strong>{raw.liveError}</strong> Showing the recorded states only; the newest one may be behind Career Master.</Notice>
        <LiveBody documentState={documentState} states={states} index={index} setIndex={setIndex} approved={approved} selected={selected} selectedChanges={selectedChanges} changedLabels={changedLabels} liveChanges={liveChanges} live={false} />
      </>
    );
  }
  return <LiveBody documentState={documentState} states={states} index={index} setIndex={setIndex} approved={approved} selected={selected} selectedChanges={selectedChanges} changedLabels={changedLabels} liveChanges={liveChanges} live />;
}

function wordingSentence(ds) {
  if (ds?.changedSinceApproval) return 'The document wording has changed since approval; use the notice at the top of the page to switch between the printed and current wording.';
  if (ds?.careerBound) return 'The document wording currently matches the printed version.';
  return 'The document text above always stays exactly as approved.';
}

function LiveBody({ documentState, states, index, setIndex, approved, selected, selectedChanges, changedLabels, liveChanges, live }) {
  return (
    <div style={{ marginTop: '1.75rem' }}>
      {/* ── Bold live-data callout ── */}
      <div
        role="status"
        style={{
          background: '#1B2A3B',
          color: '#FFFFFF',
          borderLeft: `6px solid ${liveChanges.length ? '#C98320' : '#2F9A68'}`,
          borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em' }}>
          {live ? 'LIVE DATA' : 'RECORDED DATA'} — {liveChanges.length
            ? `${liveChanges.length} ${live ? '' : 'recorded '}change${liveChanges.length === 1 ? '' : 's'} since the approved printed version`
            : (live ? 'matches the approved printed version' : 'no recorded changes since the approved printed version')}
          {live ? '' : ' (live data unavailable)'}
        </div>
        <div style={{ fontSize: '0.78rem', marginTop: '0.3rem', lineHeight: 1.55, opacity: 0.92 }}>
          {live
            ? 'The career charts on this page update from the Salt Basin Career Master.'
            : 'Live career data could not be loaded, so these charts show the last recorded state.'}
          {' '}The printed copy was approved on{' '}
          <strong>{fmt(approved.at)}</strong>. {wordingSentence(documentState)}
        </div>
        {liveChanges.length > 0 && (
          <div style={{ marginTop: '0.7rem', background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.6rem 0.75rem' }}>
            <ChangeList changes={liveChanges} />
          </div>
        )}
      </div>

      {/* ── State timeline slider ── */}
      {states.length > 1 && (
        <div style={{ border: '1px solid #E3D8C9', borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '1rem', background: '#FFFFFF' }} className="sb-state-slider">
          <label htmlFor="sb-state-range" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1B2A3B' }}>
            Data timeline — slide from the printed version to live
          </label>
          <input
            id="sb-state-range" type="range" min={0} max={states.length - 1} step={1} value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            aria-valuetext={`${selected.label}, ${fmt(selected.at)}`}
            style={{ width: '100%', accentColor: '#C98320', margin: '0.6rem 0 0.2rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#536173', gap: '0.5rem' }}>
            {states.map((s, i) => (
              <button
                key={s.key} type="button" onClick={() => setIndex(i)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: i === index ? '#1B2A3B' : '#536173', fontWeight: i === index ? 700 : 400, fontSize: '0.64rem', textAlign: i === 0 ? 'left' : i === states.length - 1 ? 'right' : 'center', flex: 1 }}
              >
                {s.label}<br />{fmt(s.at)}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '0.6rem', fontSize: '0.76rem', color: '#1B2A3B' }}>
            Viewing <strong>{selected.label}</strong>
            {selected.key === 'approved'
              ? ' — exactly what the printed copy shows.'
              : selectedChanges.length
                ? ` — ${selectedChanges.length} difference${selectedChanges.length === 1 ? '' : 's'} from the printed version:`
                : ' — no differences from the printed version.'}
          </div>
          {selected.key !== 'approved' && selectedChanges.length > 0 && (
            <div style={{ marginTop: '0.4rem', color: '#1B2A3B' }}><ChangeList changes={selectedChanges} /></div>
          )}
        </div>
      )}

      {(selected.snapshot?.charts || []).map((chart) => (
        <ChartViews key={`${selected.key}-${chart.key}`} chart={chart} changedLabels={changedLabels} />
      ))}
    </div>
  );
}
