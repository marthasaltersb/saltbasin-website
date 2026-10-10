// Shared bits for the Agent runner screens (docs/changes/platform-agent-runner.md). Works at 390px: one column,
// 44px tap targets, no hover-only actions, no horizontal page scroll. Every error is shown inline (role="alert")
// and in a toast; nothing is swallowed.
import React from 'react';

export const C = { ink: '#1b2a3b', sec: '#536173', line: '#e5ded3', soft: '#f6f2ea', accent: '#c4843a', teal: '#2e7f9c', bad: '#a5391f', ok: '#2f7d4f' };
export const S = {
  root: { background: '#fff', color: C.ink, borderRadius: 12, padding: '1rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'DM Sans, sans-serif', fontSize: '.88rem', boxSizing: 'border-box', width: '100%', overflowWrap: 'anywhere' },
  h1: { fontFamily: 'Fraunces, serif', fontSize: '1.25rem', margin: 0 },
  h2: { fontSize: '1rem', margin: '0 0 .4rem' },
  sub: { color: C.sec, fontSize: '.8rem', margin: '.25rem 0 .9rem', lineHeight: 1.5 },
  tabs: { display: 'flex', gap: '.3rem', borderBottom: `1px solid ${C.line}`, marginBottom: '1rem', flexWrap: 'wrap' },
  tab: (on) => ({ border: 0, background: on ? C.ink : 'transparent', color: on ? '#fff' : C.ink, padding: '0 .9rem', minHeight: 44, borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '.85rem', fontWeight: on ? 700 : 500 }),
  card: { border: `1px solid ${C.line}`, borderRadius: 10, padding: '.85rem', marginBottom: '1rem', background: '#fff', minWidth: 0 },
  cardTitle: { fontWeight: 700, fontSize: '.92rem', marginBottom: '.5rem' },
  input: { padding: '.4rem .55rem', minHeight: 44, borderRadius: 7, border: '1px solid rgba(27,42,59,.3)', fontSize: '.88rem', font: 'inherit', background: '#fff', color: C.ink, width: '100%', boxSizing: 'border-box' },
  btn: { border: 0, background: C.ink, color: '#fff', borderRadius: 7, padding: '0 1rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  btn2: { border: '1px solid rgba(27,42,59,.3)', background: '#fff', color: C.ink, borderRadius: 7, padding: '0 .9rem', minHeight: 44, cursor: 'pointer', font: 'inherit', fontSize: '.85rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '.2rem', fontSize: '.76rem', color: C.sec, flex: '1 1 200px', minWidth: 0 },
  row: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '.6rem' },
  alert: { background: '#fbeae5', border: `1px solid ${C.bad}`, color: C.bad, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  note: { background: '#eef5f8', border: `1px solid ${C.teal}`, color: C.ink, borderRadius: 8, padding: '.55rem .7rem', margin: '.5rem 0', fontSize: '.8rem' },
  pill: (color) => ({ display: 'inline-block', padding: '.05rem .55rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, color: '#fff', background: color }),
  empty: { color: C.sec, border: `1px dashed ${C.line}`, borderRadius: 8, padding: '.8rem', fontSize: '.82rem' },
  item: { borderBottom: `1px solid ${C.soft}`, padding: '.6rem 0' },
  meta: { color: C.sec, fontSize: '.74rem' },
  pre: { background: C.soft, borderRadius: 8, padding: '.6rem', fontSize: '.74rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '.4rem 0', maxHeight: 320, overflow: 'auto' },
};

const BAD = /fail|exceeded|stopped|declined|rejected|refused|blocked/i;
const GOOD = /^(succeeded|approved|accepted|recorded|applied|filed|linked|ready|promoted|pass)/i;
export function Pill({ children }) {
  const t = String(children).replace(/_/g, ' ');
  return <span style={S.pill(GOOD.test(t) ? C.ok : BAD.test(t) ? C.bad : C.sec)}>{t}</span>;
}
export function ErrorBox({ error, gaps }) {
  if (!error) return null;
  return (
    <div role="alert" style={S.alert}>
      {error}
      {gaps?.length ? <ul style={{ margin: '.3rem 0 0 1rem', padding: 0 }}>{gaps.map((g) => <li key={g}>{g}</li>)}</ul> : null}
    </div>
  );
}
export function Field({ label, children }) { return <label style={S.label}><span>{label}</span>{children}</label>; }
export const fmt = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '');
export const fmtTime = (ms) => (ms ? new Date(ms).toISOString().slice(11, 19) : '');

export const KIND_LABEL = {
  draft_spec: 'Draft spec', test_results: 'Test results', amendment_proposal: 'Amendment proposal', bug: 'Bug', test_plan: 'Test plan',
  enhancement_proposal: 'Enhancement proposal', shaped_seed: 'Shaped seed',
};
export const STATUS_LABEL = { queued: 'queued', running: 'running', succeeded: 'succeeded', failed: 'failed', scope_exceeded: 'SCOPE_EXCEEDED', stopped: 'stopped' };

/** Runs `fn`, shows its error inline + as a toast (the caller passes setError and toast). */
export const lines = (v) => String(v ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
