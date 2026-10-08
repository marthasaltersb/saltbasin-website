// Output version history (2026-10-02, release output-version-history).
//
// Shows every version of one output (its lineage): created / modified dates,
// who approved it, a timeline slider that re-renders the document as it stood
// at each version, and tracked changes (added / removed / changed text,
// changed words marked inline) between any two versions. Read-only: nothing
// here approves, publishes or edits, so it adds no finalize path - approving
// stays in My Resume (assertReadyToFinalize + useToolCategoryGate().run).
// Slider styling follows SharedLiveStates.jsx (the QR page's data timeline).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import DocumentBlocksView from '../DocumentBlocksView.jsx';
import { diffVersions, summarizeDiff } from '../../lib/outputVersionDiff.js';

const INK = '#1B2A3B';
const MUTED = '#536173';

export function fmtStamp(ms) {
  if (!ms) return '-';
  const d = new Date(Number(ms));
  const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  return `${date}, ${time} UTC`;
}

const BASIS_NOTE = {
  frozen_at_approval: 'Wording as frozen when this version was approved.',
  current_career_master: 'Wording is resolved from your current Career Master, so it follows Career Master edits.',
  flattened: 'Generated text shown as plain sections.',
  stored: '',
  empty: '',
};

const S = {
  wrap: { color: INK, fontSize: '0.82rem', lineHeight: 1.5 },
  card: { border: '1px solid #E3D8C9', borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '1rem', background: '#FFFFFF' },
  h: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK, margin: 0 },
  th: { textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.68rem', color: MUTED, borderBottom: '1px solid #E3D8C9', whiteSpace: 'nowrap' },
  td: { padding: '0.35rem 0.5rem', fontSize: '0.74rem', borderBottom: '1px solid #F0E9DE', verticalAlign: 'top' },
  sel: { padding: '0.25rem 0.4rem', borderRadius: 6, border: '1px solid rgba(0,0,0,0.25)', fontSize: '0.76rem', maxWidth: '100%' },
  err: { background: '#FBEAEA', border: '1px solid #E3B4B4', color: '#7A2323', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '0.76rem', marginBottom: '0.7rem' },
  warn: { background: '#FBEBD0', border: '1px solid #E8C98F', color: '#5C3B08', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.74rem', marginBottom: '0.6rem' },
  chip: (bg, fg) => ({ display: 'inline-block', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: bg, color: fg, borderRadius: 999, padding: '0 7px', marginRight: 6, verticalAlign: 'middle' }),
  btn: { padding: '4px 10px', fontSize: '0.72rem', borderRadius: 6, cursor: 'pointer', fontWeight: 600, border: '1px solid rgba(0,0,0,0.25)', background: 'white', color: '#333' },
};

const ADDED = { background: '#DDF3E4', color: '#14532D', textDecoration: 'underline' };
const REMOVED = { background: '#FBE0E0', color: '#7A2323', textDecoration: 'line-through' };

function TrackedLine({ item }) {
  const label = item.type === 'header' ? item.field : item.type;
  if (item.change === 'same') {
    return <div data-change="same" style={{ padding: '0.15rem 0', color: MUTED }}><span style={{ fontSize: '0.62rem', textTransform: 'uppercase', marginRight: 6 }}>{label}</span>{item.after}</div>;
  }
  if (item.change === 'added') {
    return <div data-change="added" style={{ padding: '0.2rem 0' }}><span style={S.chip('#14532D', '#fff')}>Added</span><ins style={ADDED}>{item.after}</ins></div>;
  }
  if (item.change === 'removed') {
    return <div data-change="removed" style={{ padding: '0.2rem 0' }}><span style={S.chip('#7A2323', '#fff')}>Removed</span><del style={REMOVED}>{item.before}</del></div>;
  }
  return (
    <div data-change="changed" style={{ padding: '0.2rem 0' }}>
      <span style={S.chip('#8a5a12', '#fff')}>Changed</span>
      {item.parts.map((p, i) => (p.op === 'add' ? <ins key={i} style={ADDED}>{p.text}</ins> : p.op === 'del' ? <del key={i} style={REMOVED}>{p.text}</del> : <span key={i}>{p.text}</span>))}
    </div>
  );
}

export default function OutputVersionHistory({ projectionId, onClose = null, startAtLatest = false }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(0);
  const [hideSame, setHideSame] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const h = await api.getResumeOutputVersions(projectionId);
      setHistory(h);
      const startAt = startAtLatest ? h.versions.length - 1 : Math.max(0, h.versions.findIndex((v) => v.id === Number(projectionId)));
      setIndex(startAt); setToIdx(startAt); setFromIdx(Math.max(0, startAt - 1));
    } catch (e) {
      setError(e.message);
      toast.error(`Could not load version history: ${e.message}`);
    } finally { setLoading(false); }
  }, [projectionId, startAtLatest]);
  useEffect(() => { load(); }, [load]);

  const versions = history?.versions || [];
  const selected = versions[Math.min(index, versions.length - 1)];
  const fromV = versions[fromIdx];
  const toV = versions[toIdx];
  const diff = useMemo(() => (fromV && toV && !fromV.error && !toV.error ? diffVersions(fromV, toV) : null), [fromV, toV]);

  function slideTo(i) {
    setIndex(i); setToIdx(i); setFromIdx(Math.max(0, i - 1));
  }

  if (loading) return <div style={S.wrap}>Loading version history...</div>;
  if (error) {
    return (
      <div style={S.wrap}>
        <div role="alert" style={S.err}>Could not load version history: {error}</div>
        <button type="button" style={S.btn} onClick={load}>Retry</button>
      </div>
    );
  }
  if (!versions.length) return <div style={S.wrap}>No versions found for this output.</div>;

  const shown = diff ? (hideSame ? diff.filter((d) => d.change !== 'same') : diff) : [];
  const label = (v) => `v${v.versionNo}`;

  return (
    <div style={S.wrap} data-testid="output-version-history">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '0.6rem' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>Version history: {history.title}</div>
          <div style={{ fontSize: '0.72rem', color: MUTED }}>{versions.length} version{versions.length === 1 ? '' : 's'} of this output</div>
        </div>
        {onClose && <button type="button" style={S.btn} onClick={onClose}>Close</button>}
      </div>

      {/* Dates and approvals for every version */}
      <div style={S.card}>
        <h4 style={S.h}>Versions</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.4rem' }}>
            <thead>
              <tr>
                <th style={S.th}>Version</th><th style={S.th}>Status</th><th style={S.th}>Created</th><th style={S.th}>Modified</th><th style={S.th}>Approved by</th><th style={S.th}>Changes from previous</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => (
                <tr key={v.id} data-testid={`version-row-${v.versionNo}`} style={{ background: i === index ? '#FBF4E8' : 'transparent', cursor: 'pointer' }} onClick={() => slideTo(i)}>
                  <td style={S.td}><button type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: INK }} onClick={() => slideTo(i)}>{label(v)}</button>{v.current ? ' (latest)' : ''}</td>
                  <td style={S.td}><span style={{ textTransform: 'capitalize' }}>{v.status}</span>{v.qrLive ? ' · QR live' : ''}</td>
                  <td style={S.td}>{fmtStamp(v.createdAt)}</td>
                  <td style={S.td}>{fmtStamp(v.modifiedAt)}</td>
                  <td style={S.td}>{v.approvedBy ? `${v.approvedBy}, ${fmtStamp(v.approvedAt)}` : 'Not approved'}</td>
                  <td style={S.td}>{v.error ? <span role="alert" style={{ color: '#7A2323' }}>{v.error}</span> : v.changeSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline slider */}
      <div style={S.card} className="sb-state-slider">
        <label htmlFor="sb-version-range" style={{ ...S.h, display: 'block' }}>Timeline: slide across the versions of this output</label>
        <input
          id="sb-version-range" type="range" min={0} max={versions.length - 1} step={1} value={index}
          onChange={(e) => slideTo(Number(e.target.value))}
          disabled={versions.length < 2}
          aria-valuetext={`${label(selected)}, ${selected.status}, ${fmtStamp(selected.modifiedAt)}`}
          style={{ width: '100%', accentColor: '#C98320', margin: '0.6rem 0 0.2rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: MUTED, gap: '0.5rem' }}>
          {versions.map((v, i) => (
            <button
              key={v.id} type="button" onClick={() => slideTo(i)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: i === index ? INK : MUTED, fontWeight: i === index ? 700 : 400, fontSize: '0.64rem', textAlign: i === 0 ? 'left' : i === versions.length - 1 ? 'right' : 'center', flex: 1 }}
            >
              {label(v)}<br />{fmtStamp(v.modifiedAt).split(',').slice(0, 2).join(',')}
            </button>
          ))}
        </div>
        <div role="status" style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}>
          Viewing <strong>{label(selected)}</strong> of {versions.length} ({selected.status}), modified {fmtStamp(selected.modifiedAt)}
          {selected.approvedBy ? `, approved by ${selected.approvedBy}` : ', not approved'}.
        </div>
        {versions.length < 2 && <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: MUTED }}>This output has only one version so far. Editing it after it is approved files the edit as a new version.</div>}
      </div>

      {/* The output as it stood at the selected version */}
      <div style={S.card}>
        <h4 style={{ ...S.h, marginBottom: '0.5rem' }}>{label(selected)} as it stood</h4>
        {selected.error && <div role="alert" style={S.err}>{selected.error}</div>}
        {BASIS_NOTE[selected.basis] && <div style={{ fontSize: '0.7rem', color: MUTED, marginBottom: '0.4rem' }}>{BASIS_NOTE[selected.basis]}</div>}
        {(selected.warnings || []).map((w, i) => <div key={i} role="status" style={S.warn}>{w}</div>)}
        {!selected.error && (
          <div data-testid="version-render" style={{ border: '1px solid #EFE7DA', borderRadius: 8, padding: '0.8rem 1rem', background: '#fff' }}>
            {selected.blocks.length || selected.header?.name
              ? <DocumentBlocksView content={{ header: selected.header, blocks: selected.blocks }} />
              : <div style={{ color: MUTED }}>This version has no text.</div>}
          </div>
        )}
      </div>

      {/* Tracked changes between any two versions */}
      <div style={S.card}>
        <h4 style={S.h}>Tracked changes</h4>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', margin: '0.5rem 0' }}>
          <label htmlFor="sb-diff-from" style={{ fontSize: '0.74rem', fontWeight: 700 }}>Compare from</label>
          <select id="sb-diff-from" style={S.sel} value={fromIdx} onChange={(e) => setFromIdx(Number(e.target.value))}>
            {versions.map((v, i) => <option key={v.id} value={i}>{label(v)} ({v.status})</option>)}
          </select>
          <label htmlFor="sb-diff-to" style={{ fontSize: '0.74rem', fontWeight: 700 }}>to</label>
          <select id="sb-diff-to" style={S.sel} value={toIdx} onChange={(e) => setToIdx(Number(e.target.value))}>
            {versions.map((v, i) => <option key={v.id} value={i}>{label(v)} ({v.status})</option>)}
          </select>
          <label style={{ fontSize: '0.74rem', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <input type="checkbox" checked={hideSame} onChange={(e) => setHideSame(e.target.checked)} /> Hide unchanged text
          </label>
        </div>
        {!diff ? (
          <div role="alert" style={S.err}>One of the selected versions could not be read, so they cannot be compared.</div>
        ) : fromIdx === toIdx ? (
          <div role="status" style={{ fontSize: '0.76rem', color: MUTED }}>Pick two different versions to see what changed.</div>
        ) : (
          <>
            <div role="status" data-testid="diff-summary" style={{ fontSize: '0.78rem', fontWeight: 700, margin: '0.2rem 0 0.5rem' }}>
              {label(fromV)} to {label(toV)}: {summarizeDiff(diff)}
            </div>
            <div data-testid="tracked-changes" style={{ borderTop: '1px solid #EFE7DA', paddingTop: '0.4rem' }}>
              {shown.length ? shown.map((d, i) => <TrackedLine key={i} item={d} />) : <div style={{ color: MUTED }}>No text changes between these versions.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Full-screen overlay wrapper, used from My Resume and the World Shell. */
export function OutputVersionHistoryModal({ projectionId, onClose, startAtLatest = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Portalled to <body>: the World Shell rail uses backdrop-filter, which would
  // otherwise become the containing block for this position:fixed layer.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div role="dialog" aria-label="Output version history" style={{ background: '#FBF8F3', borderRadius: 10, padding: '1.1rem 1.25rem', width: 'min(980px, 96vw)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <OutputVersionHistory projectionId={projectionId} onClose={onClose} startAtLatest={startAtLatest} />
      </div>
    </div>,
    document.body,
  );
}
