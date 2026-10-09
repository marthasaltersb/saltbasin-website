/**
 * GtmDeliverableDetail — renders a gtm_deliverables row's deliverable_json
 * section by section (mirroring the xlsx tab structure), with per-section
 * annotation controls (add a new_scenario/rule_note/decision/correction
 * note; promote a new_scenario annotation into the institutional scenario
 * library) and the draft -> reviewed -> approved -> sent status gate.
 * Nothing here sends or publishes anything -- status transitions are the
 * only write path, and 'sent' just records that Betsy sent it herself.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const STATUS_FLOW = { draft: 'reviewed', reviewed: 'approved', approved: 'sent' };
const ANNOTATION_TYPES = ['new_scenario', 'rule_note', 'decision', 'correction'];
const TIERS = ['critical', 'high', 'moderate'];

const S = {
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)' },
  meta: { fontSize: '0.75rem', color: '#777', marginTop: '0.25rem' },
  sectionTitle: { fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sb-gold, #c4843a)', fontWeight: 700, marginBottom: '0.6rem' },
  btn: (style) => ({
    padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.05em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' ? 'white' : '#333',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' },
  th: { textAlign: 'left', padding: '0.4rem 0.5rem', background: 'rgba(0,0,0,0.04)', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#777', fontWeight: 700 },
  td: { padding: '0.4rem 0.5rem', borderTop: '0.5px solid rgba(0,0,0,0.06)', color: '#333', verticalAlign: 'top' },
  input: { padding: '0.45rem 0.65rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  textarea: { padding: '0.45rem 0.65rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem', fontFamily: 'inherit', width: '100%', minHeight: 60, boxSizing: 'border-box', outline: 'none' },
  label: { fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', marginBottom: '0.2rem', display: 'block' },
  field: { marginBottom: '0.6rem' },
  annotationCard: { padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.03)', marginBottom: '0.5rem', fontSize: '0.78rem' },
  flagCard: { padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(181,67,58,0.08)', marginBottom: '0.4rem', fontSize: '0.78rem' },
  empty: { color: '#999', fontSize: '0.8rem' },
};

function Section({ title, children }) {
  return (
    <div style={S.card}>
      <div style={S.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function AnnotationForm({ deliverableId, onAdded }) {
  const [type, setType] = useState('rule_note');
  const [note, setNote] = useState('');
  const [scenario, setScenario] = useState({ title: '', root_cause: '', ebitda_impact_tier: 'high', topic_prompt: '' });
  const [saving, setSaving] = useState(false);

  async function submit() {
    const body = type === 'new_scenario' ? scenario : { note };
    if (type === 'new_scenario' && (!scenario.title || !scenario.root_cause || !scenario.topic_prompt)) {
      toast('Title, root cause, and topic prompt are required for a new scenario.');
      return;
    }
    if (type !== 'new_scenario' && !note) {
      toast('Note text is required.');
      return;
    }
    setSaving(true);
    try {
      await api.createGtmAnnotation(deliverableId, { type, body });
      toast('Annotation added.');
      setNote('');
      setScenario({ title: '', root_cause: '', ebitda_impact_tier: 'high', topic_prompt: '' });
      onAdded();
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={S.field}>
        <label style={S.label}>Annotation Type</label>
        <select style={S.input} value={type} onChange={(e) => setType(e.target.value)}>
          {ANNOTATION_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>
      {type === 'new_scenario' ? (
        <>
          <div style={S.field}><label style={S.label}>Title</label><input style={S.input} value={scenario.title} onChange={(e) => setScenario({ ...scenario, title: e.target.value })} /></div>
          <div style={S.field}><label style={S.label}>Root Cause</label><input style={S.input} value={scenario.root_cause} onChange={(e) => setScenario({ ...scenario, root_cause: e.target.value })} /></div>
          <div style={S.field}>
            <label style={S.label}>EBITDA Impact Tier</label>
            <select style={S.input} value={scenario.ebitda_impact_tier} onChange={(e) => setScenario({ ...scenario, ebitda_impact_tier: e.target.value })}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={S.field}><label style={S.label}>Topic Prompt</label><textarea style={S.textarea} value={scenario.topic_prompt} onChange={(e) => setScenario({ ...scenario, topic_prompt: e.target.value })} /></div>
        </>
      ) : (
        <div style={S.field}>
          <label style={S.label}>Note</label>
          <textarea style={S.textarea} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      )}
      <button style={S.btn('navy')} onClick={submit} disabled={saving}>{saving ? 'Saving…' : '+ Add Annotation'}</button>
    </div>
  );
}

export default function GtmDeliverableDetail({ id, onChange }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const result = await api.getGtmDeliverable(id);
      setData(result);
    } catch (e) {
      toast(e.message);
    }
  }

  useEffect(() => { setData(null); load(); }, [id]);

  async function advanceStatus() {
    const next = STATUS_FLOW[data.deliverable.status];
    if (!next) return;
    setBusy(true);
    try {
      await api.updateGtmDeliverableStatus(id, next);
      toast(`Marked ${next}.`);
      load();
      onChange?.();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function promote(annotationId) {
    try {
      await api.promoteGtmAnnotation(id, annotationId);
      toast('Promoted to the scenario library.');
      load();
    } catch (e) {
      toast(e.message);
    }
  }

  if (!data) return <div style={S.empty}>Loading deliverable…</div>;
  const { deliverable, annotations } = data;
  const dj = deliverable.deliverable_json;
  const nextStatus = STATUS_FLOW[deliverable.status];

  return (
    <div>
      <div style={S.card}>
        <div style={S.headerRow}>
          <div>
            <div style={S.title}>{deliverable.topic}</div>
            <div style={S.meta}>
              {deliverable.mode === 'engagement' ? `Engagement — ${deliverable.engagement_client_name || 'unnamed client'}` : 'Benchmark Refresh'}
              {' · '}status: <strong>{deliverable.status}</strong>{' · '}created {new Date(deliverable.created_at).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {deliverable.xlsx_storage_url && (
              <a href={`/api/gtm-deliverables/${id}/xlsx`} target="_blank" rel="noreferrer">
                <button style={S.btn()}>Download xlsx</button>
              </a>
            )}
            {nextStatus && (
              <button style={S.btn('gold')} onClick={advanceStatus} disabled={busy}>
                {busy ? 'Working…' : `Mark ${nextStatus}`}
              </button>
            )}
          </div>
        </div>
        {deliverable.status === 'generating' && <p style={S.meta}>Still generating — check back shortly.</p>}
        {deliverable.status === 'failed' && <p style={{ ...S.meta, color: '#b5433a' }}>Generation failed: {deliverable.generation_error}</p>}
      </div>

      {dj && (
        <>
          <Section title="Executive Summary">
            <p>{dj.executive_summary}</p>
          </Section>

          <Section title="Benchmark Master">
            {dj.benchmark_master?.length ? (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Value</th><th style={S.th}>Source</th><th style={S.th}>Year</th><th style={S.th}>Relevance</th></tr></thead>
                <tbody>
                  {dj.benchmark_master.map((b, i) => (
                    <tr key={i}>
                      <td style={S.td}>{b.metric}</td><td style={S.td}>{b.value}</td>
                      <td style={S.td}>{b.source}{b.is_secondary_source ? ' (secondary)' : ''}</td>
                      <td style={S.td}>{b.year}</td><td style={S.td}>{b.relevance_note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={S.empty}>None.</p>}
          </Section>

          {dj.industry_breakdown?.length > 0 && (
            <Section title="Industry Breakdown">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Industry</th><th style={S.th}>Mechanism</th><th style={S.th}>Root Cause</th><th style={S.th}>Rate</th></tr></thead>
                <tbody>
                  {dj.industry_breakdown.map((b, i) => (
                    <tr key={i}><td style={S.td}>{b.industry}</td><td style={S.td}>{b.leakage_or_risk_mechanism}</td><td style={S.td}>{b.root_cause}</td><td style={S.td}>{b.rate_estimate}</td></tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Section title="Impact Quantification">
            <p style={S.meta}>Recovery rate: {dj.impact_quantification?.recovery_rate_pct}% — {dj.impact_quantification?.recovery_rate_source_note}</p>
            {dj.impact_quantification?.scenarios?.length > 0 && (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Scenario</th><th style={S.th}>Conservative</th><th style={S.th}>Base</th><th style={S.th}>High</th><th style={S.th}>Confidence</th></tr></thead>
                <tbody>
                  {dj.impact_quantification.scenarios.map((s, i) => (
                    <tr key={i}><td style={S.td}>{s.scenario}</td><td style={S.td}>{s.conservative_rate_pct}%</td><td style={S.td}>{s.base_rate_pct}%</td><td style={S.td}>{s.high_rate_pct}%</td><td style={S.td}>{s.confidence_level}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {dj.client_mapping && (
            <Section title="Client Actuals vs. Benchmark">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Client</th><th style={S.th}>Benchmark</th><th style={S.th}>Delta</th><th style={S.th}>Confidence</th></tr></thead>
                <tbody>
                  {(dj.client_mapping.client_actuals_vs_benchmark || []).map((c, i) => (
                    <tr key={i}><td style={S.td}>{c.metric}</td><td style={S.td}>{c.client_value ?? '—'}</td><td style={S.td}>{c.benchmark_value}</td><td style={S.td}>{c.delta_description}</td><td style={S.td}>{c.confidence_level}</td></tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {dj.data_quality_gaps?.length > 0 && (
            <Section title="Data Quality Gaps">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Description</th><th style={S.th}>Severity</th><th style={S.th}>Variance</th><th style={S.th}>Action</th><th style={S.th}>Exception</th></tr></thead>
                <tbody>
                  {dj.data_quality_gaps.map((g, i) => (
                    <tr key={i}>
                      <td style={S.td}>{g.description}</td><td style={S.td}>{g.severity}</td>
                      <td style={S.td}>{g.variance_pct != null ? `${g.variance_pct}%` : '—'}</td>
                      <td style={S.td}>{(g.threshold_action || '—').replace('_', ' ')}</td>
                      <td style={S.td}>{(g.exception_class || '—').replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {dj.unverified_flags?.length > 0 && (
            <Section title="Unverified Claims — Excluded">
              {dj.unverified_flags.map((f, i) => (
                <div key={i} style={S.flagCard}><strong>{f.claim}</strong><br />{f.reason_unverified}</div>
              ))}
            </Section>
          )}
        </>
      )}

      <Section title="Annotations">
        {annotations.length === 0 ? <p style={S.empty}>None yet.</p> : annotations.map((a) => (
          <div key={a.id} style={S.annotationCard}>
            <strong>{a.type.replace('_', ' ')}</strong>
            {a.section_key ? ` — ${a.section_key}` : ''}
            <br />
            {a.type === 'new_scenario' ? (
              <>
                {a.body.title} — {a.body.root_cause} ({a.body.ebitda_impact_tier})
                <br />
                {a.promoted_to_scenario_id ? (
                  <span style={S.meta}>Promoted to scenario library.</span>
                ) : (
                  <button style={S.btn('gold')} onClick={() => promote(a.id)}>Promote to Scenario Library</button>
                )}
              </>
            ) : (
              a.body?.note
            )}
          </div>
        ))}
        <AnnotationForm deliverableId={id} onAdded={load} />
      </Section>
    </div>
  );
}
