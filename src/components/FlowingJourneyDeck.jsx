import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import UploadDataScreen from './admin/UploadDataScreen.jsx';

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
  const [careerData, setCareerData] = useState({ master: null, documents: [], runs: [], lineage: [] });
  const stages = journey.stages || [];
  const stage = stages[state.current] || stages[0];
  const completion = Math.round((state.completed.length / Math.max(stages.length, 1)) * 100);
  const isResume = /resume|portfolio/i.test(`${journey.id} ${journey.label}`);
  const calculations = useMemo(() => {
    const master = careerData.master || {};
    const records = ['jobs', 'skills', 'tools', 'engagements'].flatMap((key) => master[key] || []);
    const populated = records.reduce((sum, record) => sum + Object.values(record).filter((value) => value != null && value !== '' && (!Array.isArray(value) || value.length)).length, 0);
    const possible = records.reduce((sum, record) => sum + Object.keys(record).filter((key) => !['id', 'userId', 'orderIndex'].includes(key)).length, 0);
    const completeness = possible ? Math.round((populated / possible) * 100) : 0;
    const mappedFields = new Set(careerData.lineage.map((mapping) => `${mapping.target_table}:${mapping.target_id}:${mapping.atom_key}`)).size;
    const traceability = populated ? Math.min(100, Math.round((mappedFields / populated) * 100)) : 0;
    const validation = careerData.runs.length ? Math.round((careerData.runs.filter((run) => run.status === 'completed').length / careerData.runs.length) * 100) : 0;
    const freshness = careerData.runs.some((run) => run.status === 'completed') ? 100 : 25;
    const integrity = Math.round(completeness * .4 + traceability * .3 + validation * .2 + freshness * .1);
    const evidenceCoverage = Math.round((completeness + traceability) / 2);
    const approvalCoverage = Math.round((validation + completion) / 2);
    const maturity = Math.round(completion * .45 + evidenceCoverage * .3 + approvalCoverage * .15 + traceability * .1);
    return { records: records.length, mappedFields, completeness, traceability, validation, freshness, integrity, evidenceCoverage, approvalCoverage, maturity };
  }, [careerData, completion]);
  const cards = useMemo(() => [
    ['Maturity', `${calculations.maturity}%`, 'Weighted journey readiness'],
    ['Data integrity', `${calculations.integrity}%`, 'Completeness and traceability'],
    ['Career records', String(calculations.records), 'Jobs, skills, tools, and projects'],
    ['Mapped sources', String(careerData.documents.length), 'Uploaded evidence documents'],
  ], [calculations, careerData.documents.length]);

  useEffect(() => { localStorage.setItem(`sb_flowing_journey_${journey.id}`, JSON.stringify(state)); }, [journey.id, state]);
  const refreshCareerData = useCallback(() => {
    if (!/career|resume|placement|application/i.test(`${journey.id} ${journey.label}`)) return;
    Promise.allSettled([api.getCareerMaster(), api.listCareerIntakeDocuments(), api.listCareerIntakeRuns(), api.listCareerMappingLineage()]).then(([master, documents, runs, lineage]) => setCareerData({
      master: master.status === 'fulfilled' ? master.value : null,
      documents: documents.status === 'fulfilled' ? (documents.value.documents || documents.value || []) : [],
      runs: runs.status === 'fulfilled' ? (runs.value.runs || runs.value || []) : [],
      lineage: lineage.status === 'fulfilled' ? (lineage.value.mappings || []) : [],
    }));
  }, [journey.id, journey.label]);
  useEffect(() => { refreshCareerData(); }, [refreshCareerData]);

  const structures = useMemo(() => ['jobs', 'skills', 'tools', 'engagements'].flatMap((type) => (careerData.master?.[type] || []).slice(0, 8).map((record) => ({
    type, id: record.id, label: record.title || record.name || record.company || record.client_name || `${type.slice(0, -1)} ${record.id}`,
  }))), [careerData.master]);

  function careerCommitted() {
    setState((value) => ({ ...value, completed: [...new Set([...value.completed, 0, 1, 2])], current: Math.max(value.current, 3), view: 'structures' }));
    refreshCareerData();
  }

  function completeCurrent() {
    setState((value) => {
      const completed = value.completed.includes(state.current) ? value.completed : [...value.completed, state.current];
      return { ...value, completed, current: Math.min(value.current + 1, stages.length - 1) };
    });
  }
  function openConnectedTools() {
    if (journey.id === 'career-foundation') sessionStorage.setItem('sb_career_entry_view', state.current < 3 ? 'upload' : 'manual');
    onOpenTools();
  }

  return <section className="fjd-shell" data-layer={state.view}>
    <header className="fjd-header"><button type="button" onClick={onClose}>Exit journey</button><div><span>FLOWING JOURNEY / {world.shortLabel}</span><h2>{journey.label}</h2></div><div className="fjd-progress-ring"><strong>{completion}%</strong><span>formed</span></div></header>
    <nav className="fjd-layers" aria-label="Spatial layers">{LAYERS.map((layer) => <button type="button" key={layer.id} className={state.view === layer.id ? 'active' : ''} onClick={() => setState((value) => ({ ...value, view: layer.id }))}>{layer.label}</button>)}</nav>
    <aside className="fjd-stage-rail"><span>JOURNEY COORDINATES</span>{stages.map((item, index) => <button type="button" key={item} className={`${index === state.current ? 'active' : ''}${state.completed.includes(index) ? ' complete' : ''}`} onClick={() => setState((value) => ({ ...value, current: index }))}><i>{state.completed.includes(index) ? 'OK' : index + 1}</i><div><strong>{item}</strong><small>{state.completed.includes(index) ? 'Structure formed' : index === state.current ? 'Current coordinate' : 'Available path'}</small></div></button>)}</aside>
    {journey.id === 'career-foundation' ? <main className="fjd-career-operation">
      {state.view === 'journey' && <><header><span>ACTIVE OPERATION</span><h3>Source evidence → reviewed Career Master</h3><p>Upload a resume or governed workbook. Parsing creates recommendations only; you decide which fields become part of your foundation.</p></header><UploadDataScreen embedded onOpenClassicEditor={openConnectedTools} onCommitted={careerCommitted} /></>}
      {state.view === 'structures' && <section className="fjd-structure-field"><header><span>FORMED CAREER STRUCTURES</span><h3>{structures.length} visible crystals from committed evidence</h3></header><div>{structures.length ? structures.map((item, index) => <article key={`${item.type}-${item.id}`} style={{ '--formation-index': index }}><i /><b>{item.label}</b><span>{item.type}</span></article>) : <p>Commit reviewed mappings to form jobs, skills, tools, and project structures here.</p>}</div></section>}
      {state.view === 'lineage' && <section className="fjd-lineage-field"><header><span>FIELD-LEVEL LINEAGE</span><h3>{calculations.mappedFields} mapped fields retain their source path</h3></header>{careerData.lineage.length ? careerData.lineage.slice(0, 80).map((mapping) => <article key={mapping.id}><span>{mapping.source_filename || mapping.source_kind}</span><i>→</i><b>{mapping.atom_key}</b><small>{mapping.source_location || mapping.source_label || 'Uploaded source'}</small></article>) : <p>No committed source mappings yet. Review and commit an upload to create lineage.</p>}</section>}
      {state.view === 'records' && <section className="fjd-record-field"><header><span>CONNECTED RECORD REFERENCES</span><h3>{calculations.records} Career Master records</h3></header>{structures.map((item) => <article key={`${item.type}-${item.id}`}><b>{item.label}</b><span>{item.type} · record {item.id}</span></article>)}</section>}
    </main> : <div className="fjd-river-map" aria-hidden="true"><i className="fjd-river" />{stages.map((item, index) => <button type="button" tabIndex="-1" key={item} className={`${index === state.current ? 'active' : ''}${state.completed.includes(index) ? ' complete' : ''}`} style={{ '--coordinate': index, '--coordinate-count': Math.max(stages.length - 1, 1) }}><span>{index + 1}</span><b>{item}</b></button>)}</div>}
    <aside className={`fjd-control-panel${collapsed ? ' collapsed' : ''}`}>
      <header><div><span>{state.view.toUpperCase()} INSPECTOR</span><h3>{stage}</h3></div><button type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? 'Expand' : 'Collapse'}</button></header>
      {!collapsed && <><div className="fjd-cards">{cards.map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
      <details className="fjd-calculation"><summary>Show score calculations</summary><div><b>Maturity =</b><span>Gate completion {completion}% x 45%</span><span>Evidence coverage {calculations.evidenceCoverage}% x 30%</span><span>Approval coverage {calculations.approvalCoverage}% x 15%</span><span>Lineage coverage {calculations.traceability}% x 10%</span><strong>= {calculations.maturity}%</strong></div><div><b>Data integrity =</b><span>Field completeness {calculations.completeness}% x 40%</span><span>Source traceability {calculations.traceability}% x 30%</span><span>Mapping validation {calculations.validation}% x 20%</span><span>Evidence freshness {calculations.freshness}% x 10%</span><strong>= {calculations.integrity}%</strong></div></details>
      <label className="fjd-note">What should change at this coordinate?<textarea value={state.notes[state.current] || ''} placeholder={isResume ? 'Add evidence, refine the target role, or describe the output change...' : 'Define the decision, evidence, rule, or collaborator needed here...'} onChange={(event) => setState((value) => ({ ...value, notes: { ...value.notes, [state.current]: event.target.value } }))} /></label>
      <section className="fjd-agent"><span>BESTYSTAFF / CONTEXT AGENT</span><p>{isResume ? 'I can trace every claim to its source, identify evidence gaps, and preview how this coordinate changes the resume.' : 'I can explain the active structure, gather missing definitions, and prepare the next bounded action for review.'}</p><button type="button">Ask about this coordinate</button></section>
      <div className="fjd-actions"><button type="button" onClick={openConnectedTools}>Open connected tools</button><button type="button" className="primary" onClick={completeCurrent}>Form structure and continue</button></div></>}
    </aside>
    <footer className="fjd-status"><span>CAMERA FOCUS: COORDINATE {state.current + 1}</span><span>{state.view === 'lineage' ? 'Source-to-output paths visible' : state.view === 'structures' ? 'Atoms, molecules, and crystals visible' : state.view === 'records' ? 'Record references visible' : 'Journey river visible'}</span></footer>
  </section>;
}
