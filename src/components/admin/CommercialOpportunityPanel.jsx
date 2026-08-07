// Commercial Opportunity Pipeline panel (2026-08-06, Phase 3 vertical slice)
// — the real admin tab surfacing server/lib/commercialOpportunityRollups.js.
// Admin-scoped: Salt Basin's own business-development pipeline, not member
// self-service (mirrors CareerPlacementAgentsPanel.jsx's structure for the
// other pipeline, sharing OpportunityAgentOrbitWorld with a different
// crystal variant per the shared-crystal-family principle).
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import OpportunityAgentOrbitWorld from '../OpportunityAgentOrbitWorld.jsx';

const DIMENSION_FIELDS = [
  { key: 'trigger_strength', label: 'Trigger strength' },
  { key: 'solution_fit', label: 'Salt Basin problem/solution fit' },
  { key: 'economic_materiality', label: 'Economic materiality' },
  { key: 'timing_urgency', label: 'Timing & urgency' },
  { key: 'access_relationship_path', label: 'Access & relationship path' },
  { key: 'evidence_gap_plausibility', label: 'Evidence gap plausibility' },
  { key: 'serviceability', label: 'Serviceability' },
];

const EXPANSION_RING_OPTIONS = [
  { value: '', label: '— none (Ring 0, canonical target) —' },
  { value: 'ring_1', label: 'Ring 1 — Ownership graph' },
  { value: 'ring_2', label: 'Ring 2 — Business-model peers' },
  { value: 'ring_3', label: 'Ring 3 — Event peers' },
  { value: 'ring_4', label: 'Ring 4 — Talent peers' },
  { value: 'ring_5', label: 'Ring 5 — Ecosystem routes' },
];

const S = {
  wrap: { background: '#0d1417', color: '#f5f0e8', minHeight: '100%', padding: '1.5rem' },
  header: { marginBottom: '1rem' },
  eyebrow: { fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', marginBottom: '0.3rem' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500 },
  sub: { fontSize: '0.8rem', color: '#a9a49a', marginTop: '0.4rem', maxWidth: 640, lineHeight: 1.5 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,1fr)', gap: '1rem', marginTop: '1.25rem', alignItems: 'start' },
  canvasCard: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.6rem' },
  panel: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', fontSize: '0.82rem' },
  panelTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem', marginBottom: '0.5rem' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '0.35rem 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' },
  tag: { fontSize: '0.62rem', letterSpacing: '0.05em', border: '0.5px solid rgba(107,143,113,0.5)', color: '#8fbf98', borderRadius: 10, padding: '0.1rem 0.5rem' },
  listItem: (active) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.6rem', marginBottom: '0.35rem',
    background: active ? 'rgba(196,132,58,0.12)' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${active ? 'rgba(196,132,58,0.4)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem',
  }),
  field: { marginBottom: '0.7rem' },
  fieldLabel: { display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', marginBottom: '0.3rem' },
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.5rem 0.6rem', color: '#f5f0e8', fontSize: '0.8rem' },
  btn: (tone) => ({
    padding: '0.5rem 0.85rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 500,
    background: tone === 'gold' ? '#c4843a' : 'transparent', color: tone === 'gold' ? '#1c1410' : '#f5f0e8',
    borderColor: tone === 'ghost' ? 'rgba(255,255,255,0.2)' : 'transparent', borderWidth: tone === 'ghost' ? '0.5px' : 0, borderStyle: 'solid',
  }),
  dimGrid: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem 0.6rem', alignItems: 'center', marginBottom: '0.6rem' },
};

function tierColor(tier) {
  if (!tier) return '#8b877c';
  if (tier.startsWith('A')) return '#8fbf98';
  if (tier.startsWith('B')) return '#c4843a';
  if (tier.startsWith('C')) return '#d98ca0';
  return '#8b877c';
}

export default function CommercialOpportunityPanel() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ companyName: '', eventTrigger: '', hypothesis: '', expansionRing: '', parentEntityName: '', reason: '' });
  const [scoreDraft, setScoreDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [hub, oppResult] = await Promise.all([api.getCommercialAgentHub(), api.listCommercialOpportunities()]);
      setAgents(hub.agents);
      setWorkflow(hub.workflow);
      setOpportunities(oppResult.opportunities);
    } catch (e) {
      toast('Failed to load Commercial Opportunity Pipeline: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedAgent = agents.find((a) => a.key === selectedAgentKey) || null;
  const selectedOpportunity = opportunities.find((o) => o.id === selectedOpportunityId) || null;

  useEffect(() => {
    if (selectedOpportunity) {
      const next = {};
      DIMENSION_FIELDS.forEach((d) => {
        const existing = selectedOpportunity.score?.components?.find((c) => c.key === d.key);
        next[d.key] = existing?.rawScore ?? '';
      });
      setScoreDraft(next);
    }
  }, [selectedOpportunityId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddOpportunity(e) {
    e.preventDefault();
    if (!addForm.companyName.trim()) { toast('Company name is required.'); return; }
    setSaving(true);
    try {
      const created = await api.createCommercialOpportunity({
        companyName: addForm.companyName.trim(),
        eventTrigger: addForm.eventTrigger.trim() || null,
        hypothesis: addForm.hypothesis.trim() || null,
        expansionRing: addForm.expansionRing || null,
        parentEntityName: addForm.parentEntityName.trim() || null,
        reason: addForm.reason.trim() || null,
      });
      setOpportunities((prev) => [created, ...prev]);
      setSelectedOpportunityId(created.id);
      setShowAddForm(false);
      setAddForm({ companyName: '', eventTrigger: '', hypothesis: '', expansionRing: '', parentEntityName: '', reason: '' });
      toast('Tracked "' + created.metadata.companyName + '".');
    } catch (e) {
      toast('Could not add opportunity: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveScore() {
    if (!selectedOpportunity) return;
    const dimensionScores = {};
    for (const d of DIMENSION_FIELDS) {
      const raw = scoreDraft[d.key];
      if (raw === '' || raw == null) continue;
      dimensionScores[d.key] = Number(raw);
    }
    if (!Object.keys(dimensionScores).length) { toast('Enter at least one dimension score.'); return; }
    setSaving(true);
    try {
      const updated = await api.scoreCommercialOpportunity(selectedOpportunity.id, { dimensionScores, sourceReference: 'manual-review-' + Date.now() });
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast(updated.score?.complete ? `Scored: ${updated.score.score} / 100 (${updated.score.tier})` : 'Scores saved (some dimensions still unscored).');
    } catch (e) {
      toast('Could not save scores: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    const { padding: _wrapPadding, ...wrapRest } = S.wrap;
    return <div style={{ ...wrapRest, textAlign: 'center', paddingTop: '4rem', color: '#a9a49a' }}>Loading Commercial Opportunity Pipeline…</div>;
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.eyebrow}>Commercial Pipeline · Weekly Research &amp; Outreach</div>
        <div style={S.title}>Commercial Opportunity Pipeline</div>
        <div style={S.sub}>
          Salt Basin buyer opportunities — company/event pairs scored against real evidence. An opportunity with no
          recorded evidence shows no score and no tier, not a guess.
        </div>
      </div>

      <div style={S.layout}>
        <div>
          <div style={S.canvasCard}>
            <OpportunityAgentOrbitWorld
              variant="commercialPipeline"
              agents={agents}
              opportunities={opportunities}
              selectedAgentKey={selectedAgentKey}
              selectedOpportunityId={selectedOpportunityId}
              onSelectAgent={(key) => { setSelectedAgentKey(key); setSelectedOpportunityId(null); }}
              onSelectOpportunity={(id) => { setSelectedOpportunityId(id); setSelectedAgentKey(null); }}
              height={420}
            />
          </div>

          <div style={{ ...S.panel, marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={S.panelTitle}>Tracked Opportunities ({opportunities.length})</div>
              <button style={S.btn('gold')} onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? 'Cancel' : '+ Track Opportunity'}</button>
            </div>
            {showAddForm && (
              <form onSubmit={handleAddOpportunity} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Company</label>
                  <input style={S.input} value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} placeholder="e.g. Northwind Data" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Event Trigger</label>
                  <input style={S.input} value={addForm.eventTrigger} onChange={(e) => setAddForm({ ...addForm, eventTrigger: e.target.value })} placeholder="e.g. Series C funding round announced" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Salt Basin Hypothesis</label>
                  <input style={S.input} value={addForm.hypothesis} onChange={(e) => setAddForm({ ...addForm, hypothesis: e.target.value })} placeholder="What Salt Basin need might this create?" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Target Expansion Ring</label>
                  <select style={S.input} value={addForm.expansionRing} onChange={(e) => setAddForm({ ...addForm, expansionRing: e.target.value })}>
                    {EXPANSION_RING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {addForm.expansionRing && (
                  <>
                    <div style={S.field}>
                      <label style={S.fieldLabel}>Parent Target (why this entered the universe)</label>
                      <input style={S.input} value={addForm.parentEntityName} onChange={(e) => setAddForm({ ...addForm, parentEntityName: e.target.value })} placeholder="e.g. Vista Equity Partners" />
                    </div>
                    <div style={S.field}>
                      <label style={S.fieldLabel}>Reason</label>
                      <input style={S.input} value={addForm.reason} onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })} placeholder="e.g. Portfolio company of the parent target" />
                    </div>
                  </>
                )}
                <button type="submit" style={S.btn('gold')} disabled={saving}>{saving ? 'Saving…' : 'Track Opportunity'}</button>
              </form>
            )}
            {!opportunities.length && !showAddForm && (
              <div style={{ color: '#8b877c', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Nothing tracked yet — add a company/event pair to start scoring it.
              </div>
            )}
            {opportunities.map((o) => (
              <div key={o.id} style={S.listItem(selectedOpportunityId === o.id)} onClick={() => { setSelectedOpportunityId(o.id); setSelectedAgentKey(null); }}>
                <span>{o.metadata?.companyName}{o.metadata?.eventTrigger ? ` — ${o.metadata.eventTrigger}` : ''}</span>
                <span style={{ color: tierColor(o.score?.tier), fontWeight: 600 }}>{o.score ? Math.round(o.score.score) : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedAgent && (
            <div style={S.panel}>
              <div style={S.panelTitle}>{selectedAgent.name}</div>
              <span style={S.tag}>{selectedAgent.pipeline.toUpperCase()} · TIER {selectedAgent.tier}</span>
              <p style={{ color: '#a9a49a', margin: '0.7rem 0', lineHeight: 1.5 }}>{selectedAgent.roleDescription}</p>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', marginTop: '0.8rem', marginBottom: '0.3rem' }}>Capabilities</div>
              <ul style={{ paddingLeft: '1.1rem', margin: 0, color: '#cfc9bd', fontSize: '0.76rem', lineHeight: 1.6 }}>
                {selectedAgent.capabilities.map((c) => <li key={c}>{c}</li>)}
              </ul>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d98ca0', marginTop: '0.8rem', marginBottom: '0.3rem' }}>Must Not</div>
              <ul style={{ paddingLeft: '1.1rem', margin: 0, color: '#cfc9bd', fontSize: '0.76rem', lineHeight: 1.6 }}>
                {selectedAgent.boundaries.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}

          {selectedOpportunity && (
            <div style={S.panel}>
              <div style={S.panelTitle}>{selectedOpportunity.metadata?.companyName}</div>
              {selectedOpportunity.metadata?.eventTrigger && <div style={S.metaRow}><span>Event Trigger</span><span>{selectedOpportunity.metadata.eventTrigger}</span></div>}
              {selectedOpportunity.metadata?.hypothesis && <div style={S.metaRow}><span>Hypothesis</span><span>{selectedOpportunity.metadata.hypothesis}</span></div>}
              {selectedOpportunity.entities.map((e) => e.expansionRing && <div key={e.linkId} style={S.metaRow}><span>Expansion Ring</span><span>{e.expansionRing} — {e.reason}</span></div>)}
              <div style={S.metaRow}><span>Stage</span><span>{selectedOpportunity.currentStage}</span></div>
              <div style={S.metaRow}><span>Score</span><span style={{ color: tierColor(selectedOpportunity.score?.tier), fontWeight: 600 }}>{selectedOpportunity.score ? `${Math.round(selectedOpportunity.score.score)} / 100 — ${selectedOpportunity.score.tier}` : 'Not yet scored'}</span></div>

              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', margin: '1rem 0 0.5rem' }}>Score This Opportunity (0–5 per dimension)</div>
              <div style={S.dimGrid}>
                {DIMENSION_FIELDS.map((d) => (
                  <React.Fragment key={d.key}>
                    <label style={{ fontSize: '0.74rem', color: '#cfc9bd' }}>{d.label}</label>
                    <input
                      type="number" min="0" max="5" step="0.5" style={{ ...S.input, width: 64, textAlign: 'center' }}
                      value={scoreDraft[d.key] ?? ''}
                      onChange={(e) => setScoreDraft({ ...scoreDraft, [d.key]: e.target.value })}
                    />
                  </React.Fragment>
                ))}
              </div>
              <button style={S.btn('gold')} onClick={handleSaveScore} disabled={saving}>{saving ? 'Saving…' : 'Save Scores'}</button>
            </div>
          )}

          {!selectedAgent && !selectedOpportunity && (
            <div style={S.panel}>
              <div style={S.panelTitle}>Approval Workflow</div>
              {workflow.map((step) => (
                <div key={step.stepKey} style={S.metaRow}>
                  <span>{step.name}</span>
                  <span style={{ color: step.requiredRoleLabel ? '#c4843a' : '#8fbf98' }}>{step.requiredRoleLabel || 'No gate'}</span>
                </div>
              ))}
              <p style={{ color: '#8b877c', fontSize: '0.72rem', marginTop: '0.8rem', lineHeight: 1.5 }}>
                Click an agent or a tracked opportunity in the scene above for detail. Nothing is ever sent, applied, or
                contacted automatically — outreach drafting is a later phase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
