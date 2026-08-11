// Career Foundation Sourcing & Reconciliation, Phase 4 (2026-08-10) — the
// Salt Basin admin's cross-user reasoning compiler view. Every candidate is
// a reasoning pattern one or more members explicitly approved (see
// CareerReconciliationPanel.jsx's "this reasoning was correct" checkbox);
// approvalRatio (approvedUserCount / totalEligibleUserCount) is the signal
// for how repeatable the pattern is across the population, not just how
// many people happened to approve it. Approving here writes a platform-
// scope journey_rod_decisions row, a journey_current_definitions
// reasoningCacheModel row, and an audit_log entry (server/routes/
// careerReasoningAdmin.js) — the actual "deployment" this compiler exists
// to drive, always still requiring the member's own confirmation at apply
// time (never a silent auto-resolution).
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const S = {
  wrap: { maxWidth: 960, margin: '1rem auto 2rem', padding: '0 1.5rem' },
  banner: { background: 'rgba(2,161,166,0.07)', border: '0.5px solid rgba(2,161,166,0.25)', borderRadius: 10, padding: '0.9rem 1.1rem', fontSize: '0.8rem', color: '#1e565a', marginBottom: '1.25rem', lineHeight: 1.55 },
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.85rem' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' },
  patternKey: { fontSize: '0.85rem', fontWeight: 700, color: '#333', fontFamily: 'monospace' },
  ratio: { fontSize: '0.85rem', fontWeight: 700 },
  shape: { fontSize: '0.72rem', color: '#888', marginBottom: '0.6rem' },
  sample: { fontSize: '0.75rem', color: '#555', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '0.4rem 0.55rem', marginBottom: '0.3rem' },
  statusTag: (status) => ({
    display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    borderRadius: 999, padding: '0.15rem 0.55rem',
    color: status === 'applied' ? '#287a54' : status === 'rejected' ? '#a35' : '#a56b18',
    background: status === 'applied' ? 'rgba(40,122,84,0.1)' : status === 'rejected' ? 'rgba(170,51,85,0.08)' : 'rgba(196,132,58,0.1)',
  }),
  btnRow: { display: 'flex', gap: '0.5rem', marginTop: '0.6rem' },
  btn: (tone = 'outline') => ({
    padding: '0.4rem 0.8rem', borderRadius: 7, border: tone === 'outline' ? '0.5px solid rgba(0,0,0,0.18)' : 'none',
    cursor: 'pointer', fontSize: '0.74rem', fontFamily: 'var(--sb-font-label)',
    background: tone === 'gold' ? 'var(--sb-gold, #c4843a)' : tone === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'white',
    color: tone === 'gold' || tone === 'navy' ? 'white' : '#333',
  }),
  empty: { padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' },
};

function ratioColor(ratio) {
  if (ratio >= 0.66) return '#287a54';
  if (ratio >= 0.34) return '#a56b18';
  return '#888';
}

export default function CareerReasoningCompilerPanel() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const result = await api.listCareerReasoningCandidates();
      setItems((result.items || []).sort((a, b) => b.approval_ratio - a.approval_ratio));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function decide(id, status) {
    setBusyId(id);
    try {
      await api.decideCareerReasoningCandidate(id, { status });
      toast.success(status === 'approved' ? 'Reasoning pattern approved and cached' : 'Candidate rejected');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <div style={S.wrap}><div style={S.empty}>Failed to load: {error}</div></div>;
  if (items === null) return <div style={S.wrap}><div style={S.empty}>Loading…</div></div>;

  return (
    <div style={S.wrap}>
      <div style={S.banner}>
        Every candidate below is a reasoning pattern members explicitly approved while resolving a Career Foundation
        review task. The ratio is approved members ÷ every member who ever hit this exact situation — a real
        repeatability signal, not just a raw approval count. Approving a candidate caches the pattern as a suggestion
        for future members; it never auto-applies without their confirmation.
      </div>
      {items.length === 0 && <div style={S.empty}>No approved reasoning patterns yet.</div>}
      {items.map((item) => (
        <div key={item.id} style={S.card}>
          <div style={S.head}>
            <div>
              <span style={S.patternKey}>{item.pattern_key}</span>
              {' '}<span style={S.statusTag(item.status)}>{item.status.replaceAll('_', ' ')}</span>
            </div>
            <div style={{ ...S.ratio, color: ratioColor(item.approval_ratio) }}>
              {Math.round(item.approval_ratio * 100)}% ({item.approved_user_count}/{item.total_eligible_user_count})
            </div>
          </div>
          <div style={S.shape}>{item.entry_type}{item.atom_key ? ` — ${item.atom_key}` : ''}</div>
          {(item.sample_reasonings || []).map((sample, i) => <div key={i} style={S.sample}>"{sample}"</div>)}
          {item.status === 'pending_review' && (
            <div style={S.btnRow}>
              <button type="button" style={S.btn('gold')} disabled={busyId === item.id} onClick={() => decide(item.id, 'approved')}>
                {busyId === item.id ? 'Applying…' : 'Approve & cache'}
              </button>
              <button type="button" style={S.btn('outline')} disabled={busyId === item.id} onClick={() => decide(item.id, 'rejected')}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
