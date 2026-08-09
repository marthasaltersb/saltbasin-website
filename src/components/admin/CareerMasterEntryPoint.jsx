import React, { useState } from 'react';
import CareerConsentGate from './CareerConsentGate.jsx';
import UploadDataScreen from './UploadDataScreen.jsx';
import CareerMasterPanel from './CareerMasterPanel.jsx';
import CareerOrbit from './CareerOrbit.jsx';
import CareerExperienceConfigurator from './CareerExperienceConfigurator.jsx';
import BoundedCareerAgentPanel from './BoundedCareerAgentPanel.jsx';

const choices = [
  ['orbit', 'Career Orbit', 'Guided maturity, resume, and case-study journeys.'],
  ['upload', 'Upload & Map', 'Attach a resume or workbook, then review every mapped fact.'],
  ['manual', 'Manual Intake', 'Add and maintain Career Master records directly.'],
  ['configure', 'Proficiency & Rollups', 'Define time periods, proficiency vocabulary, aggregation policies, and display views.'],
  ['assistant', 'Career World BestyStaff', 'Make bounded Career Master updates without an LLM or metered model call.'],
];

export default function CareerMasterEntryPoint({ scope = 'member' }) {
  const [view, setView] = useState('manual');
  return <CareerConsentGate>
    <div className="career-master-entry-layout">
      <div className="career-master-paths">
        {choices.map(([id, title, desc]) => <button className="career-master-path-card" key={id} onClick={() => setView(id)} style={{ border: view === id ? '2px solid var(--sb-gold, #c4843a)' : '1px solid rgba(0,0,0,.12)', background: view === id ? 'rgba(196,132,58,.08)' : '#fff' }}>
          <div style={{ fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)' }}>{title}</div>
          <div style={{ fontSize: '.76rem', color: '#6d7278', lineHeight: 1.45, marginTop: '.25rem' }}>{desc}</div>
        </button>)}
      </div>
      <div className="career-master-active-view">
        {view === 'orbit' && <CareerOrbit />}
        {view === 'upload' && <UploadDataScreen onOpenClassicEditor={() => setView('manual')} onCommitted={() => setView('manual')} />}
        {view === 'manual' && <CareerMasterPanel scope={scope} />}
        {view === 'configure' && <CareerExperienceConfigurator />}
        {view === 'assistant' && <BoundedCareerAgentPanel />}
      </div>
    </div>
  </CareerConsentGate>;
}
