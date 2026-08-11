// Career Foundation Sourcing & Reconciliation, Phase 2 (2026-08-10) — the
// review queue a member works through when two equal-standing sources
// (resume, LinkedIn export, Indeed export, Fiverr export, ...) disagree
// about the same fact, or when an AI-proposed mapping had no confident atom
// match. Conflicts are shown first, then ambiguous mappings — the API
// already returns them in that order (task_type is the priority signal, no
// separate priority column). Styling follows CareerMappingPreview.jsx's
// local-style-object convention (no adminStyles.js import), since this
// panel is a close sibling of that screen.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const ENTRY_TYPE_LABELS = {
  career_job_entry: 'Job', career_skill_entry: 'Skill', career_tool_entry: 'Tool',
  career_engagement_entry: 'Engagement / Case Study', career_domain_entry: 'Domain',
  career_certification_entry: 'Certification', career_deal_entry: 'Deal',
};

const S = {
  wrap: { maxWidth: 900, margin: '1rem auto 2rem', padding: '0 1.5rem' },
  banner: { background: 'rgba(2,161,166,0.07)', border: '0.5px solid rgba(2,161,166,0.25)', borderRadius: 10, padding: '0.9rem 1.1rem', fontSize: '0.8rem', color: '#1e565a', marginBottom: '1.25rem', lineHeight: 1.55 },
  groupTitle: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', margin: '1.25rem 0 0.6rem' },
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.85rem' },
  conflictTag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a35', background: 'rgba(170,51,85,0.08)', borderRadius: 999, padding: '0.15rem 0.55rem', marginBottom: '0.6rem' },
  ambiguousTag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a56b18', background: 'rgba(196,132,58,0.1)', borderRadius: 999, padding: '0.15rem 0.55rem', marginBottom: '0.6rem' },
  fieldName: { fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.5rem' },
  sourceRow: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.45rem 0', borderTop: '1px solid rgba(0,0,0,0.06)' },
  sourceValue: { fontSize: '0.8rem', color: '#222', fontWeight: 600 },
  sourceMeta: { fontSize: '0.68rem', color: '#888', marginTop: '0.15rem' },
  excerpt: { fontSize: '0.75rem', color: '#555', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '0.5rem 0.6rem', margin: '0.5rem 0' },
  reasoning: { fontSize: '0.75rem', color: '#555', lineHeight: 1.5, margin: '0.4rem 0' },
  dictateBox: { width: '100%', boxSizing: 'border-box', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 7, padding: '0.5rem 0.65rem', fontSize: '0.78rem', fontFamily: 'inherit', marginTop: '0.5rem' },
  btnRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' },
  btn: (tone = 'outline') => ({
    padding: '0.4rem 0.8rem', borderRadius: 7, border: tone === 'outline' ? '0.5px solid rgba(0,0,0,0.18)' : 'none',
    cursor: 'pointer', fontSize: '0.74rem', fontFamily: 'var(--sb-font-label)',
    background: tone === 'gold' ? 'var(--sb-gold, #c4843a)' : tone === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'white',
    color: tone === 'gold' || tone === 'navy' ? 'white' : '#333',
  }),
  empty: { padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' },
  checkboxLabel: { display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: '#666', marginTop: '0.5rem' },
};

function ConflictCard({ task, onResolved }) {
  const [dictating, setDictating] = useState(false);
  const [dictated, setDictated] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [busy, setBusy] = useState(false);

  async function resolve(resolution) {
    setBusy(true);
    try {
      await api.resolveCareerReconciliationTask(task.id, resolution);
      toast.success('Conflict resolved');
      onResolved(task.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function askBestyStaff() {
    setBusy(true);
    try {
      const result = await api.askBestyStaffCareer(task.id, dictated);
      if (result.offline) {
        setAgentReply('BestyStaff is offline. Your task was not changed; choose a source or try again later.');
        return;
      }
      setAgentReply(result.reply || 'BestyStaff reviewed your correction.');
      if (result.resolved?.status === 'resolved') {
        toast.success('Conflict resolved by BestyStaff');
        onResolved(task.id);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card}>
      <span style={S.conflictTag}>Sources disagree</span>
      <div style={S.fieldName}>{ENTRY_TYPE_LABELS[task.entryType] || task.entryType} — {task.atomKey}</div>
      {task.evidenceRefs.map((ref) => (
        <div key={ref.sourceMappingId} style={S.sourceRow}>
          <div style={{ flex: 1 }}>
            <div style={S.sourceValue}>{String(ref.value ?? '—')}</div>
            <div style={S.sourceMeta}>{ref.sourceFilename || ref.sourceKind || 'source'}{ref.sourceLocation ? ` — ${ref.sourceLocation}` : ''}</div>
          </div>
          <button type="button" style={S.btn('gold')} disabled={busy} onClick={() => resolve({ method: 'chose_source', chosenSourceReference: ref.sourceMappingId })}>
            Use this
          </button>
        </div>
      ))}
      {!dictating && (
        <div style={S.btnRow}>
          <button type="button" style={S.btn('outline')} disabled={busy} onClick={() => setDictating(true)}>Tell BestyStaff what's correct</button>
        </div>
      )}
      {dictating && (
        <div>
          <textarea style={S.dictateBox} rows={2} value={dictated} onChange={(e) => setDictated(e.target.value)} placeholder="e.g. The end date should be March 2024, none of the sources have it exactly right" />
          <div style={S.btnRow}>
            <button type="button" style={S.btn('navy')} disabled={busy || !dictated.trim()} onClick={askBestyStaff}>
              {busy ? 'Asking BestyStaff…' : 'Ask BestyStaff to apply'}
            </button>
            <button type="button" style={S.btn('outline')} disabled={busy} onClick={() => setDictating(false)}>Cancel</button>
          </div>
          {agentReply && <div style={S.reasoning} role="status">{agentReply}</div>}
        </div>
      )}
    </div>
  );
}

function AmbiguousCard({ task, onResolved }) {
  const [reasoningApproved, setReasoningApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = task.evidenceRefs?.[0] || {};
  const reasoning = task.reasoning || {};

  async function acknowledge() {
    setBusy(true);
    try {
      await api.resolveCareerReconciliationTask(task.id, { method: 'acknowledge', reasoningApproved });
      toast.success('Reviewed');
      onResolved(task.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.card}>
      <span style={S.ambiguousTag}>{reasoning.overlap === 'none' ? 'No confident match' : 'Weak match'}</span>
      <div style={S.fieldName}>{ENTRY_TYPE_LABELS[task.entryType] || task.entryType}{task.atomKey ? ` — ${task.atomKey}` : ''}{ref.sourceFilename ? ` (${ref.sourceFilename})` : ''}</div>
      <div style={S.sourceValue}>Proposed value: {String(ref.value ?? '—')}</div>
      {reasoning.sourceExcerpt && <div style={S.excerpt}>"{reasoning.sourceExcerpt}"{reasoning.sourceLocation ? ` — ${reasoning.sourceLocation}` : ''}</div>}
      {reasoning.llmReasoning && <div style={S.reasoning}><strong>Why this was proposed:</strong> {reasoning.llmReasoning}</div>}
      <label style={S.checkboxLabel}>
        <input type="checkbox" checked={reasoningApproved} onChange={(e) => setReasoningApproved(e.target.checked)} />
        This reasoning was correct — worth remembering for similar cases
      </label>
      <div style={S.btnRow}>
        <button type="button" style={S.btn('navy')} disabled={busy} onClick={acknowledge}>{busy ? 'Saving…' : 'Reviewed'}</button>
      </div>
    </div>
  );
}

export default function CareerReconciliationPanel() {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const result = await api.listCareerReconciliationTasks();
      setTasks(result.items || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function onResolved(taskId) {
    setTasks((current) => (current || []).filter((t) => t.id !== taskId));
  }

  if (error) return <div style={S.wrap}><div style={S.empty}>Failed to load: {error}</div></div>;
  if (tasks === null) return <div style={S.wrap}><div style={S.empty}>Loading…</div></div>;

  const conflicts = tasks.filter((t) => t.taskType === 'source_conflict');
  const ambiguous = tasks.filter((t) => t.taskType === 'ambiguous_mapping');

  return (
    <div style={S.wrap}>
      <div style={S.banner}>
        Every source you've attached — resume, LinkedIn, Indeed, Fiverr — carries equal weight. Nothing is picked
        automatically when sources disagree; review each item below and choose the correct source, or tell
        BestyStaff what the right value is.
      </div>
      {tasks.length === 0 && <div style={S.empty}>Nothing needs review right now.</div>}
      {conflicts.length > 0 && (
        <>
          <div style={S.groupTitle}>Source conflicts ({conflicts.length})</div>
          {conflicts.map((task) => <ConflictCard key={task.id} task={task} onResolved={onResolved} />)}
        </>
      )}
      {ambiguous.length > 0 && (
        <>
          <div style={S.groupTitle}>Ambiguous mappings ({ambiguous.length})</div>
          {ambiguous.map((task) => <AmbiguousCard key={task.id} task={task} onResolved={onResolved} />)}
        </>
      )}
    </div>
  );
}
