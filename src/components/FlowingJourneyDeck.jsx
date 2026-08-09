import React, { useEffect, useMemo, useState } from 'react';

const LAYERS = [
  { id: 'journey', label: 'Journey' },
  { id: 'structures', label: 'Structures' },
  { id: 'lineage', label: 'Lineage' },
  { id: 'records', label: 'Records' },
];

function savedState(journeyId) {
  try { return { current: 0, completed: [], notes: {}, view: 'journey', ...JSON.parse(localStorage.getItem(`sb_flowing_journey_${journeyId}`) || '{}') }; }
  catch { return { current: 0, completed: [], notes: {}, view: 'journey' }; }
}

export default function FlowingJourneyDeck({ journey, world, onClose, onOpenTools }) {
  const [state, setState] = useState(() => savedState(journey.id));
  const [collapsed, setCollapsed] = useState(false);
  const stages = journey.stages || [];
  const stage = stages[state.current] || stages[0];
  const completion = Math.round((state.completed.length / Math.max(stages.length, 1)) * 100);
  const isResume = /resume|portfolio/i.test(`${journey.id} ${journey.label}`);
  const cards = useMemo(() => isResume ? [
    ['Evidence coverage', `${Math.min(100, 46 + completion)}%`, 'Source records mapped to claims'],
    ['Output readiness', `${Math.min(100, 32 + completion)}%`, 'Target-role aligned content'],
    ['Lineage gaps', String(Math.max(0, 7 - state.completed.length)), 'Claims needing source confirmation'],
    ['Agent reviews', String(Math.max(1, stages.length - state.completed.length)), 'Draft improvements awaiting review'],
  ] : [
    ['Journey health', `${Math.min(100, 54 + completion)}%`, 'Rules, evidence, and approvals'],
    ['Structures formed', String(state.completed.length * 3 + 2), 'Atoms bonded into governed objects'],
    ['Lineage links', String(state.completed.length * 5 + 4), 'Traceable source relationships'],
    ['Agent reviews', String(Math.max(1, stages.length - state.completed.length)), 'Outputs awaiting convergence'],
  ], [completion, isResume, stages.length, state.completed.length]);

  useEffect(() => { localStorage.setItem(`sb_flowing_journey_${journey.id}`, JSON.stringify(state)); }, [journey.id, state]);

  function completeCurrent() {
    setState((value) => {
      const completed = value.completed.includes(state.current) ? value.completed : [...value.completed, state.current];
      return { ...value, completed, current: Math.min(value.current + 1, stages.length - 1) };
    });
  }

  return <section className="fjd-shell" data-layer={state.view}>
    <header className="fjd-header"><button type="button" onClick={onClose}>Exit journey</button><div><span>FLOWING JOURNEY / {world.shortLabel}</span><h2>{journey.label}</h2></div><div className="fjd-progress-ring"><strong>{completion}%</strong><span>formed</span></div></header>
    <nav className="fjd-layers" aria-label="Spatial layers">{LAYERS.map((layer) => <button type="button" key={layer.id} className={state.view === layer.id ? 'active' : ''} onClick={() => setState((value) => ({ ...value, view: layer.id }))}>{layer.label}</button>)}</nav>
    <aside className="fjd-stage-rail"><span>JOURNEY COORDINATES</span>{stages.map((item, index) => <button type="button" key={item} className={`${index === state.current ? 'active' : ''}${state.completed.includes(index) ? ' complete' : ''}`} onClick={() => setState((value) => ({ ...value, current: index }))}><i>{state.completed.includes(index) ? 'OK' : index + 1}</i><div><strong>{item}</strong><small>{state.completed.includes(index) ? 'Structure formed' : index === state.current ? 'Current coordinate' : 'Available path'}</small></div></button>)}</aside>
    <div className="fjd-river-map" aria-hidden="true"><i className="fjd-river" />{stages.map((item, index) => <button type="button" tabIndex="-1" key={item} className={`${index === state.current ? 'active' : ''}${state.completed.includes(index) ? ' complete' : ''}`} style={{ '--coordinate': index, '--coordinate-count': Math.max(stages.length - 1, 1) }}><span>{index + 1}</span><b>{item}</b></button>)}</div>
    <aside className={`fjd-control-panel${collapsed ? ' collapsed' : ''}`}>
      <header><div><span>{state.view.toUpperCase()} INSPECTOR</span><h3>{stage}</h3></div><button type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? 'Expand' : 'Collapse'}</button></header>
      {!collapsed && <><div className="fjd-cards">{cards.map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
      <label className="fjd-note">What should change at this coordinate?<textarea value={state.notes[state.current] || ''} placeholder={isResume ? 'Add evidence, refine the target role, or describe the output change...' : 'Define the decision, evidence, rule, or collaborator needed here...'} onChange={(event) => setState((value) => ({ ...value, notes: { ...value.notes, [state.current]: event.target.value } }))} /></label>
      <section className="fjd-agent"><span>BESTYSTAFF / CONTEXT AGENT</span><p>{isResume ? 'I can trace every claim to its source, identify evidence gaps, and preview how this coordinate changes the resume.' : 'I can explain the active structure, gather missing definitions, and prepare the next bounded action for review.'}</p><button type="button">Ask about this coordinate</button></section>
      <div className="fjd-actions"><button type="button" onClick={onOpenTools}>Open connected tools</button><button type="button" className="primary" onClick={completeCurrent}>Form structure and continue</button></div></>}
    </aside>
    <footer className="fjd-status"><span>CAMERA FOCUS: COORDINATE {state.current + 1}</span><span>{state.view === 'lineage' ? 'Source-to-output paths visible' : state.view === 'structures' ? 'Atoms, molecules, and crystals visible' : state.view === 'records' ? 'Record references visible' : 'Journey river visible'}</span></footer>
  </section>;
}
