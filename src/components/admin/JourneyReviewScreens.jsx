import React from 'react';

const C = {
  card: { border: '1px solid rgba(139,155,174,.18)', background: 'rgba(5,18,27,.72)', padding: '.85rem' },
  label: { font: '600 .58rem var(--sb-font-label)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--sb-gold)' },
  muted: { color: 'var(--sb-dusty)', fontSize: '.68rem', lineHeight: 1.5 },
  button: (primary = false) => ({ padding: '.48rem .85rem', border: '1px solid var(--sb-gold)', background: primary ? 'var(--sb-gold)' : 'transparent', color: primary ? 'var(--sb-ivory)' : 'var(--sb-gold)', cursor: 'pointer', fontSize: '.7rem' }),
};

// Shared review pattern generalized from BusinessDefinitionExperience.
export function RecommendationReviewScreen({ recommendation, onContinue, onBack }) {
  return <section style={C.card}>
    <div style={C.label}>Recommended resolution · {Math.round(recommendation.confidence * 100)}% confidence</div>
    <h2 style={{ margin: '.35rem 0', font: '400 1.25rem var(--sb-font-display)' }}>{recommendation.headline}</h2>
    <p style={C.muted}>{recommendation.decidedDefinition}</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: '.7rem', marginTop: '.8rem' }}>
      <div style={C.card}><div style={C.label}>Why this resolves the overlap</div><p style={C.muted}>{recommendation.migrationAction}</p><div style={C.label}>Proposed sequence</div><ol style={C.muted}>{recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div style={C.card}><div style={C.label}>Alternatives considered</div><ul style={C.muted}>{recommendation.alternatives.map((item) => <li key={item}>{item}</li>)}</ul><div style={C.label}>Still required</div><ul style={C.muted}>{recommendation.missingContext.map((item) => <li key={item}>{item}</li>)}</ul><div style={C.label}>Sources</div><ul style={C.muted}>{recommendation.sourceRefs.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.45rem', marginTop: '.75rem' }}><button style={C.button()} onClick={onBack}>Back to inventory</button><button style={C.button(true)} onClick={onContinue}>Build change preview</button></div>
  </section>;
}

// Shared explicit-commit pattern generalized from CareerMappingPreview.
export function ChangePreviewScreen({ recommendation, resolutionKind, setResolutionKind, includedSteps, setIncludedSteps, note, setNote, onBack, onPreview, busy }) {
  const kinds = ['consolidate', 'reclassify', 'configuration-override', 'retain-projection', 'bind-canonical', 'retire'];
  const toggle = (step) => setIncludedSteps((current) => current.includes(step) ? current.filter((item) => item !== step) : [...current, step]);
  return <section style={C.card}>
    <div style={{ padding: '.65rem .75rem', border: '1px solid rgba(196,132,58,.45)', background: 'rgba(196,132,58,.08)', color: 'var(--sb-gold)', fontSize: '.72rem' }}>Nothing has been committed. This preview creates a governed migration plan; it does not alter the source object or canonical foundation.</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginTop: '.75rem' }}>
      <div style={C.card}><div style={C.label}>Current implementation</div>{Object.entries(recommendation.preview.before).map(([key, value]) => <p style={C.muted} key={key}><b>{key}:</b> {value}</p>)}</div>
      <div style={C.card}><div style={C.label}>Proposed governed state</div>{Object.entries({ ...recommendation.preview.after, resolutionKind }).map(([key, value]) => <p style={C.muted} key={key}><b>{key}:</b> {value}</p>)}</div>
    </div>
    <label style={{ ...C.label, display: 'block', marginTop: '.8rem' }}>Resolution strategy</label>
    <select value={resolutionKind} onChange={(event) => setResolutionKind(event.target.value)} style={{ width: '100%', marginTop: '.3rem', padding: '.5rem', background: '#091b25', color: 'var(--sb-cream)', border: '1px solid rgba(139,155,174,.3)' }}>{kinds.map((kind) => <option key={kind}>{kind}</option>)}</select>
    <div style={{ ...C.label, marginTop: '.8rem' }}>Included migration steps</div>
    {recommendation.steps.map((step) => <label key={step} style={{ ...C.muted, display: 'block', marginTop: '.35rem' }}><input type="checkbox" checked={includedSteps.includes(step)} onChange={() => toggle(step)} /> {step}</label>)}
    <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Decision context, owner, rollback criteria…" style={{ width: '100%', minHeight: 80, boxSizing: 'border-box', marginTop: '.75rem', padding: '.55rem', background: 'rgba(0,0,0,.22)', color: 'var(--sb-cream)', border: '1px solid rgba(139,155,174,.3)' }} />
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.45rem', marginTop: '.75rem' }}><button style={C.button()} onClick={onBack}>Back</button><button disabled={busy || !includedSteps.length} style={{ ...C.button(true), opacity: busy || !includedSteps.length ? .5 : 1 }} onClick={onPreview}>{busy ? 'Generating…' : 'Generate governed preview'}</button></div>
  </section>;
}
