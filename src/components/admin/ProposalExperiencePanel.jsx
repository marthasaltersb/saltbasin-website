// Member Experience Module — guided 9-stage Proposal Experience (2026-07-29).
// This is now the landing view a member sees on /member login (AdminShell
// scope="member", componentId="proposalExperience"). Every screen renders
// from the member's own proposal_experience Channel Rod via
// server/routes/proposalExperience.js — no hardcoded LoneTree copy here; a
// member with no seeded content sees an honest empty state (AC01/AC12).
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const STAGE_ORDER = ['J01', 'J02', 'J03', 'J04', 'J05', 'J06', 'J07', 'J08', 'J09'];

export default function ProposalExperiencePanel() {
  const [state, setState] = useState(null); // { rodId, currentStage, stages, actions, decision, viewState }
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);

  useEffect(() => {
    api.getProposalExperienceState()
      .then((s) => { setState(s); setActiveStage(s.currentStage && STAGE_ORDER.includes(s.currentStage) ? s.currentStage : 'J01'); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const goToStage = useCallback((stageId) => {
    setActiveStage(stageId);
    api.recordProposalStageViewed(stageId).catch(() => {});
  }, []);

  if (loading) return <div style={S.loading}>Loading your experience…</div>;
  if (err || !state) return <div style={S.loading}>{err || 'Unable to load your experience.'}</div>;

  const stageDef = state.stages.find((s) => s.stageId === activeStage);

  return (
    <div style={S.wrap}>
      <StageNav stages={state.stages} activeStage={activeStage} onSelect={goToStage} viewState={state.viewState} />
      <div style={S.content} onClick={(event) => { const target = event.target.closest?.('[data-proposal-component]'); if (target) setSelectedComponent(target.getAttribute('data-proposal-component')); }}>
        {state.disclaimer && <div style={S.disclaimer}>{state.disclaimer}</div>}
        <div style={S.stageHeader}>
          <div style={S.stageEyebrow}>{stageDef ? `Stage ${stageDef.sequence} of ${state.stages.length}` : ''}</div>
          <h2 style={S.stageTitle}>{stageDef?.name}</h2>
          <div style={S.stagePurpose}>{stageDef?.purpose}</div>
        </div>
        <StageBody stageId={activeStage} onAdvance={goToStage} onDecided={(s) => setState(s)} />
        {state.activeVersion && <ProposalFeedback version={state.activeVersion} activeStage={activeStage} selectedComponent={selectedComponent} />}
      </div>
    </div>
  );
}

function ProposalFeedback({ version, activeStage, selectedComponent }) {
  const [body, setBody] = useState('');
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const reload = useCallback(() => api.getProposalFeedback(version.id).then((r) => setEntries(r.feedback || [])).catch(() => {}), [version.id]);
  useEffect(() => { reload(); }, [reload]);
  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await api.saveProposalFeedback({ versionId: version.id, componentKey: selectedComponent || `stage:${activeStage}`, visualLayerKey: activeStage, entryType: 'comment', body, context: { entryEvent: 'proposal_component_feedback', stageId: activeStage, selectedComponent: selectedComponent || null } });
      setBody(''); await reload(); toast.success('Feedback saved as a private draft');
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const publish = async () => {
    try { await api.publishProposalFeedback(version.id); await reload(); toast.success('Your saved feedback was published to the proposal team'); }
    catch (e) { toast.error(e.message); }
  };
  const drafts = entries.filter((entry) => entry.status === 'draft').length;
  return <section style={{ ...S.card, marginTop: '2rem', borderColor: 'rgba(196,132,58,.45)' }}>
    <div style={S.stageEyebrow}>Collaborator feedback · proposal v{version.version_number}</div>
    <h3 style={S.cardTitle}>Comment on this visual layer</h3>
    <p style={S.cardBody}>Your entry is automatically linked to {selectedComponent || activeStage}, this proposal version, your account, and the interaction time. Select any highlighted proposal component to target it. Saving keeps it private; only Publish sends it back to the proposal team.</p>
    <textarea className="sb-input" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Add a question, consideration, or requested change…" style={{ width: '100%', marginBottom: '.75rem' }} />
    <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
      <button className="sb-btn" onClick={save} disabled={saving || !body.trim()}>{saving ? 'Saving…' : 'Save private draft'}</button>
      <button className="sb-btn sb-btn-gold" onClick={publish} disabled={!drafts}>Publish feedback {drafts ? `(${drafts})` : ''}</button>
    </div>
    {!!entries.length && <div style={{ marginTop: '1rem', fontSize: '.76rem', color: '#64717d' }}>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {drafts} private draft{drafts === 1 ? '' : 's'}</div>}
  </section>;
}

function StageNav({ stages, activeStage, onSelect, viewState }) {
  return (
    <div style={S.nav}>
      {stages.map((s) => {
        const active = s.stageId === activeStage;
        const visited = viewState?.stagesViewed?.includes(s.stageId);
        return (
          <button key={s.stageId} style={S.navItem(active, visited)} onClick={() => onSelect(s.stageId)}>
            <span style={S.navSeq}>{s.sequence}</span>
            <span>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function StageBody({ stageId, onAdvance, onDecided }) {
  switch (stageId) {
    case 'J01':
    case 'J06':
      return <SectionsStage stageId={stageId} onAdvance={onAdvance} />;
    case 'J02':
      return <DemoStage onAdvance={onAdvance} />;
    case 'J03':
      return <DiagnosticStage onAdvance={onAdvance} />;
    case 'J04':
      return <OpportunityStage onAdvance={onAdvance} />;
    case 'J05':
      return <EvidenceStage onAdvance={onAdvance} />;
    case 'J07':
      return <ImplementationStage onAdvance={onAdvance} />;
    case 'J08':
      return <DecisionStage onAdvance={onAdvance} onDecided={onDecided} />;
    case 'J09':
      return <WorkspaceStage />;
    default:
      return null;
  }
}

function EmptyState({ label }) {
  return <div style={S.empty}>Nothing has been seeded for {label} yet on your account.</div>;
}

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); loader().then(setData).catch(() => setData(null)).finally(() => setLoading(false)); }, deps);
  return [data, loading];
}

function SectionsStage({ stageId, onAdvance }) {
  const [data, loading] = useLoad(() => api.getProposalSections(), []);
  if (loading) return null;
  const sections = (data?.sections || []).filter((s) => s.stageId === stageId);
  if (!sections.length) return <EmptyState label="this section" />;
  return (
    <div>
      {sections.map((s) => (
        <div key={s.id} data-proposal-component={`section:${s.id}`} title="Select this component for feedback" style={S.card}>
          {s.illustrativeFlag && <div style={S.illustrativeBadge}>Illustrative</div>}
          <h3 style={S.cardTitle}>{s.title}</h3>
          <p style={S.cardBody}>{s.narrative}</p>
        </div>
      ))}
      <NextButton stageId={stageId} onAdvance={onAdvance} />
    </div>
  );
}

function DemoStage({ onAdvance }) {
  const [data, loading] = useLoad(() => api.getProposalSections(), []);
  if (loading) return null;
  const scenes = (data?.scenes || []).filter((s) => s.stageId === 'J02');
  const sections = (data?.sections || []).filter((s) => s.stageId === 'J02');
  return (
    <div>
      <div style={S.riverViewport}>
        <div style={S.riverGlow} />
        <div style={S.riverLabel}>Monetary River System</div>
        <div style={S.riverSub}>Commercial · Operational · Financial · Evidence flows, one governed system</div>
      </div>
      {scenes.map((sc) => (
        <div key={sc.id} data-proposal-component={`scene:${sc.id}`} title="Select this component for feedback" style={S.card}>
          {sc.illustrativeFlag && <div style={S.illustrativeBadge}>Illustrative</div>}
          <h3 style={S.cardTitle}>{sc.story}</h3>
          <p style={S.cardBody}>{sc.businessGoal}</p>
        </div>
      ))}
      {sections.map((s) => (
        <div key={s.id} data-proposal-component={`section:${s.id}`} title="Select this component for feedback" style={S.card}>
          <h3 style={S.cardTitle}>{s.title}</h3>
          <p style={S.cardBody}>{s.narrative}</p>
        </div>
      ))}
      {!scenes.length && !sections.length && <EmptyState label="the demonstration" />}
      <NextButton stageId="J02" onAdvance={onAdvance} />
    </div>
  );
}

function DiagnosticStage({ onAdvance }) {
  const [data, loading] = useLoad(() => api.getProposalDiagnostic(), []);
  if (loading) return null;
  const modules = data?.modules || [];
  if (!modules.length) return <EmptyState label="the diagnostic" />;
  return (
    <div>
      <div style={S.grid}>
        {modules.map((m) => (
          <div key={m.id} data-proposal-component={`diagnostic:${m.id}`} title="Select this component for feedback" style={S.gridCard}>
            <div style={S.gridCardEyebrow}>{m.id} · {m.durationDays}d</div>
            <h4 style={S.gridCardTitle}>{m.name}</h4>
            <p style={S.gridCardBody}>{m.objective}</p>
            <div style={S.gridCardMeta}>Owner: {m.ownerRole}</div>
          </div>
        ))}
      </div>
      <NextButton stageId="J03" onAdvance={onAdvance} />
    </div>
  );
}

function OpportunityStage({ onAdvance }) {
  const [data, loading] = useLoad(() => api.getProposalOpportunity(), []);
  const [expanded, setExpanded] = useState(null);
  if (loading) return null;
  const scenarios = data?.scenarios || [];
  if (!scenarios.length) return <EmptyState label="the opportunity landscape" />;
  const toggle = (id) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next) api.recordProposalScenarioExpanded(id).catch(() => {});
  };
  return (
    <div>
      {scenarios.map((s) => (
        <div key={s.id} data-proposal-component={`scenario:${s.id}`} title="Select this component for feedback" style={S.card}>
          {s.illustrativeFlag && <div style={S.illustrativeBadge}>Illustrative</div>}
          <div style={S.scenarioHead} onClick={() => toggle(s.id)}>
            <h4 style={S.cardTitle}>{s.category}: {s.mechanism}</h4>
            <span style={S.chevron}>{expanded === s.id ? '−' : '+'}</span>
          </div>
          <div style={S.scenarioRange}>
            Exposure: {s.exposureBasis} · Range {pct(s.lowRate)}–{pct(s.highRate)} (base {pct(s.baseRate)}) · Confidence: {s.detectionConfidence} · Recoverability: {s.recoverability}
          </div>
          {expanded === s.id && (
            <div style={S.scenarioDetail}>
              {(s.evidence || []).map((e) => (
                <div key={e.id} style={S.evidenceLine}>
                  <strong>{e.publisherOrOwner} ({e.year})</strong> — {e.claimOrAssumption}
                  <div style={S.evidenceMeta}>Confidence: {e.confidence} · {e.limitation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <NextButton stageId="J04" onAdvance={onAdvance} />
    </div>
  );
}

function EvidenceStage({ onAdvance }) {
  const [data, loading] = useLoad(() => api.getProposalEvidence(), []);
  if (loading) return null;
  const evidence = data?.evidence || [];
  if (!evidence.length) return <EmptyState label="the evidence room" />;
  return (
    <div>
      {evidence.map((e) => (
        <div key={e.id} data-proposal-component={`evidence:${e.id}`} title="Select this component for feedback" style={S.card} onClick={() => api.recordProposalEvidenceOpened(e.id).catch(() => {})}>
          {e.illustrativeFlag && <div style={S.illustrativeBadge}>Illustrative</div>}
          <h4 style={S.cardTitle}>{e.evidenceType} — {e.publisherOrOwner} {e.year ? `(${e.year})` : ''}</h4>
          <p style={S.cardBody}>{e.claimOrAssumption}</p>
          <div style={S.gridCardMeta}>Confidence: {e.confidence} · Applicability: {e.applicability}</div>
          <div style={S.gridCardMeta}>Limitation: {e.limitation}</div>
        </div>
      ))}
      <NextButton stageId="J05" onAdvance={onAdvance} />
    </div>
  );
}

function ImplementationStage({ onAdvance }) {
  return (
    <div>
      <SectionsStage stageId="J07" onAdvance={() => {}} />
    </div>
  );
}

function DecisionStage({ onAdvance, onDecided }) {
  const [submitting, setSubmitting] = useState(false);
  const options = [
    { key: 'proceed', label: 'Request Phase 1' },
    { key: 'discuss', label: 'Schedule a Discussion' },
    { key: 'revise', label: 'Request Revision' },
    { key: 'decline', label: 'Not Right Now' },
  ];
  const submit = async (option) => {
    setSubmitting(true);
    try {
      await api.submitProposalDecision(option, null);
      toast.success('Decision recorded');
      const refreshed = await api.getProposalExperienceState();
      onDecided(refreshed);
      onAdvance('J09');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div style={S.decisionGrid}>
      {options.map((o) => (
        <button key={o.key} style={S.decisionBtn} disabled={submitting} onClick={() => submit(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function WorkspaceStage() {
  const [state] = useLoad(() => api.getProposalExperienceState(), []);
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>Your workspace</h3>
        <p style={S.cardBody}>
          {state?.decision
            ? `You selected: ${state.decision.option}. We'll follow up on next steps.`
            : 'Persistent access to your proposal artifacts, evidence, and decision will live here.'}
        </p>
      </div>
    </div>
  );
}

function NextButton({ stageId, onAdvance }) {
  const idx = STAGE_ORDER.indexOf(stageId);
  const next = STAGE_ORDER[idx + 1];
  if (!next) return null;
  return <button style={S.nextBtn} onClick={() => onAdvance(next)}>Continue →</button>;
}

function pct(v) { return v == null ? '—' : `${(v * 100).toFixed(2)}%`; }

const S = {
  wrap: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', minHeight: '60vh' },
  loading: { padding: '3rem', color: '#888', fontSize: '0.9rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200, flexShrink: 0 },
  navItem: (active, visited) => ({
    display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left',
    padding: '0.55rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: active ? 'var(--lt-surface-muted, #F1EBDD)' : visited ? 'rgba(74,124,142,0.08)' : 'transparent',
    color: active ? 'var(--lt-teal-deep, #345A68)' : visited ? 'var(--lt-text, #2B2A28)' : 'var(--lt-text-muted, #5B5750)',
    fontSize: '0.82rem', fontWeight: active ? 600 : 500,
  }),
  navSeq: { fontSize: '0.7rem', opacity: 0.7, minWidth: 14 },
  content: { flex: 1, minWidth: 0 },
  disclaimer: { fontSize: '0.78rem', lineHeight: 1.55, color: '#7a4250', background: 'rgba(170,51,68,0.06)', border: '0.5px solid rgba(170,51,68,0.25)', borderRadius: 8, padding: '0.7rem 0.9rem', marginBottom: '1.1rem' },
  stageHeader: { marginBottom: '1.25rem' },
  stageEyebrow: { fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-gold, #c4843a)', marginBottom: 4 },
  stageTitle: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', margin: 0 },
  stagePurpose: { fontSize: '0.85rem', color: '#666', marginTop: 4 },
  card: { position: 'relative', background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '1.1rem 1.25rem', marginBottom: '0.85rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--sb-navy, #1b2a3b)' },
  cardBody: { fontSize: '0.85rem', color: '#444', lineHeight: 1.6, margin: 0 },
  illustrativeBadge: { position: 'absolute', top: 10, right: 12, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#a34', background: 'rgba(170,51,68,0.08)', padding: '2px 8px', borderRadius: 999 },
  empty: { padding: '2rem', color: '#999', fontSize: '0.85rem', fontStyle: 'italic' },
  riverViewport: { position: 'relative', borderRadius: 12, padding: '2.5rem 1.5rem', marginBottom: '1rem', textAlign: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, var(--lt-surface, #FFFDF8), var(--lt-surface-muted, #F1EBDD))', border: '1px solid var(--lt-border, #D8CCB8)' },
  riverGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(196,132,58,0.35), transparent 60%)' },
  riverLabel: { position: 'relative', color: 'var(--lt-text, #2B2A28)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.02em' },
  riverSub: { position: 'relative', color: 'var(--lt-text-muted, #5B5750)', fontSize: '0.78rem', marginTop: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1rem' },
  gridCard: { background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '0.9rem 1rem' },
  gridCardEyebrow: { fontSize: '0.68rem', color: '#999', marginBottom: 4 },
  gridCardTitle: { fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--sb-navy, #1b2a3b)' },
  gridCardBody: { fontSize: '0.78rem', color: '#555', lineHeight: 1.5, margin: '0 0 0.4rem' },
  gridCardMeta: { fontSize: '0.72rem', color: '#888' },
  scenarioHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  chevron: { fontSize: '1.1rem', color: '#999' },
  scenarioRange: { fontSize: '0.78rem', color: '#666', marginTop: 4 },
  scenarioDetail: { marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '0.5px solid rgba(0,0,0,0.08)' },
  evidenceLine: { fontSize: '0.78rem', color: '#444', marginBottom: '0.5rem' },
  evidenceMeta: { fontSize: '0.7rem', color: '#999', marginTop: 2 },
  nextBtn: { padding: '0.6rem 1.4rem', borderRadius: 8, border: '1px solid var(--lt-gold, #C4843A)', background: 'var(--lt-surface, #FFFDF8)', color: 'var(--lt-text, #2B2A28)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  decisionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' },
  decisionBtn: { padding: '1rem', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.12)', background: 'white', fontSize: '0.85rem', fontWeight: 600, color: 'var(--sb-navy, #1b2a3b)', cursor: 'pointer' },
};
