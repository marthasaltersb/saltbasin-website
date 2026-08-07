// Career Placement Agents panel (2026-08-06, Phase 2 vertical slice) — the
// real admin/member tab surfacing the data model built in
// server/lib/opportunityPipelineRegistry.js + careerOpportunityRollups.js.
// Member-scoped: every fetch/write is implicitly scoped to the logged-in
// member via the requireUser session cookie, same as CareerIntakePanel.jsx.
import React from 'react';
import OpportunityAgentOrbitWorld from '../OpportunityAgentOrbitWorld.jsx';
import { useCareerPlacementAgents, CAREER_DIMENSION_FIELDS as DIMENSION_FIELDS } from '../../lib/hooks/useCareerPlacementAgents.js';

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

function scoreColor(score) {
  if (score == null) return '#8b877c';
  if (score >= 80) return '#8fbf98';
  if (score >= 60) return '#c4843a';
  return '#d98ca0';
}

export default function CareerPlacementAgentsPanel({ scope }) {
  const {
    loading, agents, workflow, opportunities,
    selectedAgentKey, selectedOpportunityId, selectedAgent, selectedOpportunity,
    selectAgent, selectOpportunity,
    showAddForm, setShowAddForm, addForm, setAddForm, handleAddOpportunity,
    scoreDraft, setScoreDraft, handleSaveScore, saving,
  } = useCareerPlacementAgents();

  if (loading) {
    const { padding: _wrapPadding, ...wrapRest } = S.wrap;
    return <div style={{ ...wrapRest, textAlign: 'center', paddingTop: '4rem', color: '#a9a49a' }}>Loading Career Placement Agents…</div>;
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.eyebrow}>Career Pipeline · Weekly Research &amp; Outreach</div>
        <div style={S.title}>Career Placement Agents</div>
        <div style={S.sub}>
          Agents tracking your career opportunities, scored against your real Career Master profile — nothing here is
          fabricated: an opportunity with no recorded evidence shows no score, not a guess.
        </div>
      </div>

      <div style={S.layout}>
        <div>
          <div style={S.canvasCard}>
            <OpportunityAgentOrbitWorld
              variant="agentHub"
              agents={agents}
              opportunities={opportunities}
              selectedAgentKey={selectedAgentKey}
              selectedOpportunityId={selectedOpportunityId}
              onSelectAgent={selectAgent}
              onSelectOpportunity={selectOpportunity}
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
                  <label style={S.fieldLabel}>Job Title</label>
                  <input style={S.input} value={addForm.jobTitle} onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })} placeholder="e.g. VP Revenue Operations" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Company</label>
                  <input style={S.input} value={addForm.companyName} onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })} placeholder="e.g. Acme Robotics" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Official Posting URL</label>
                  <input style={S.input} value={addForm.url} onChange={(e) => setAddForm({ ...addForm, url: e.target.value })} placeholder="https://…" />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Location</label>
                  <input style={S.input} value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} placeholder="Remote / City" />
                </div>
                <button type="submit" style={S.btn('gold')} disabled={saving}>{saving ? 'Saving…' : 'Track Opportunity'}</button>
              </form>
            )}
            {!opportunities.length && !showAddForm && (
              <div style={{ color: '#8b877c', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Nothing tracked yet — add a role to start scoring it against your Career Master.
              </div>
            )}
            {opportunities.map((o) => (
              <div key={o.id} style={S.listItem(selectedOpportunityId === o.id)} onClick={() => selectOpportunity(o.id)}>
                <span>{o.metadata?.jobTitle}{o.entities?.[0] ? ` — ${o.entities[0].canonicalName}` : ''}</span>
                <span style={{ color: scoreColor(o.score?.score), fontWeight: 600 }}>{o.score ? Math.round(o.score.score) : '—'}</span>
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
              <div style={S.panelTitle}>{selectedOpportunity.metadata?.jobTitle}</div>
              {selectedOpportunity.entities.map((e) => <div key={e.linkId} style={S.metaRow}><span>Company</span><span>{e.canonicalName}</span></div>)}
              {selectedOpportunity.metadata?.location && <div style={S.metaRow}><span>Location</span><span>{selectedOpportunity.metadata.location}</span></div>}
              <div style={S.metaRow}><span>Stage</span><span>{selectedOpportunity.currentStage}</span></div>
              <div style={S.metaRow}><span>Score</span><span style={{ color: scoreColor(selectedOpportunity.score?.score), fontWeight: 600 }}>{selectedOpportunity.score ? `${Math.round(selectedOpportunity.score.score)} / 100` : 'Not yet scored'}</span></div>

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
