import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { ChangePreviewScreen, RecommendationReviewScreen } from './JourneyReviewScreens.jsx';

const stages = ['Inventory', 'Recommendation', 'Change preview', 'Authority', 'Decision', 'Migration'];
const B = { padding: '.48rem .85rem', border: '1px solid var(--sb-gold)', background: 'transparent', color: 'var(--sb-gold)', cursor: 'pointer', fontSize: '.7rem' };

export default function OverlapResolutionJourney({ item, onClose, onCompleted }) {
  const [stage, setStage] = useState('recommendation');
  const [recommendation, setRecommendation] = useState(null);
  const [resolutionKind, setResolutionKind] = useState('bind-canonical');
  const [includedSteps, setIncludedSteps] = useState([]);
  const [note, setNote] = useState('');
  const [proposal, setProposal] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStage('recommendation'); setRecommendation(null); setProposal(null);
    api.getGenesisOverlapRecommendation(item.overlap_id).then(({ recommendation: next }) => {
      setRecommendation(next); setResolutionKind(next.recommendedKind); setIncludedSteps(next.steps);
    }).catch((error) => toast.error(error.message || 'Recommendation failed to load'));
  }, [item.overlap_id]);

  async function generatePreview() {
    setBusy(true);
    try { const result = await api.previewGenesisOverlapResolution(item.overlap_id, { resolutionKind, includedSteps, note }); setProposal(result.proposal); setStage('decision'); }
    catch (error) { toast.error(error.message || 'Preview could not be generated'); }
    finally { setBusy(false); }
  }

  async function decide(decision) {
    setBusy(true);
    try {
      await api.decideGenesisOverlapResolution(item.overlap_id, { decision, note });
      setStage('complete'); await onCompleted();
      toast.success(decision === 'approved_plan' ? 'Migration plan approved; implementation remains pending' : `Recommendation ${decision}`);
    } catch (error) { toast.error(error.message || 'Decision could not be saved'); }
    finally { setBusy(false); }
  }

  const activeIndex = stage === 'recommendation' ? 1 : stage === 'preview' ? 2 : stage === 'decision' ? 4 : stage === 'complete' ? 5 : 0;
  return <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.8rem' }}><button style={B} onClick={onClose}>← Overlap inventory</button><div><div style={{ color: 'var(--sb-gold)', fontSize: '.62rem', letterSpacing: '.14em' }}>ADMIN RESOLUTION JOURNEY</div><strong>{item.source_key}</strong> → {item.canonical_id}</div></div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length},1fr)`, gap: '.3rem', marginBottom: '.8rem' }}>{stages.map((name, index) => <div key={name} style={{ padding: '.45rem', borderTop: `2px solid ${index <= activeIndex ? 'var(--sb-gold)' : 'rgba(139,155,174,.2)'}`, color: index <= activeIndex ? 'var(--sb-cream)' : 'var(--sb-dusty)', fontSize: '.62rem' }}>{String(index + 1).padStart(2, '0')} · {name}</div>)}</div>
    {!recommendation ? <div style={{ color: 'var(--sb-dusty)' }}>Compiling recommendation…</div>
      : stage === 'recommendation' ? <RecommendationReviewScreen recommendation={recommendation} onBack={onClose} onContinue={() => setStage('preview')} />
        : stage === 'preview' ? <ChangePreviewScreen recommendation={recommendation} resolutionKind={resolutionKind} setResolutionKind={setResolutionKind} includedSteps={includedSteps} setIncludedSteps={setIncludedSteps} note={note} setNote={setNote} onBack={() => setStage('recommendation')} onPreview={generatePreview} busy={busy} />
          : stage === 'decision' ? <section style={{ border: '1px solid rgba(139,155,174,.18)', padding: '.9rem', background: 'rgba(5,18,27,.72)' }}><div style={{ color: 'var(--sb-gold)', fontSize: '.62rem', letterSpacing: '.14em' }}>AUTHORITY & DECISION</div><h2 style={{ font: '400 1.2rem var(--sb-font-display)' }}>Approve the plan, not a completed migration</h2><p style={{ color: 'var(--sb-dusty)', fontSize: '.72rem' }}>The preview contains {proposal?.includedSteps?.length || 0} controlled steps. Approval records governance intent and sets implementation status to <b>pending migration</b>. Canonical R1/R2/R3 records remain unchanged.</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.45rem' }}><button style={B} onClick={() => setStage('preview')}>Edit preview</button><button style={B} disabled={busy} onClick={() => decide('deferred')}>Defer</button><button style={{ ...B, background: 'var(--sb-gold)', color: 'var(--sb-ivory)' }} disabled={busy} onClick={() => decide('approved_plan')}>Approve migration plan</button></div></section>
            : <section style={{ border: '1px solid rgba(141,185,174,.4)', padding: '1rem', background: 'rgba(38,93,83,.12)' }}><h2 style={{ font: '400 1.25rem var(--sb-font-display)' }}>Plan recorded · migration pending</h2><p style={{ color: 'var(--sb-dusty)', fontSize: '.72rem' }}>This recommendation is resolved at the governance layer. Runtime migration, reconciliation, validation and retirement remain separate executable work.</p><button style={B} onClick={onClose}>Return to inventory</button></section>}
  </div>;
}
