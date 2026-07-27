// CareerMasterEntryPoint (2026-07-16) — the member-facing entry point for
// "Career Master": consent gate first, then Choose Your Path (Enter Career
// Orbit / Upload Data / classic editor / public-site career layout). Keeps
// this state out of AdminShell.jsx, which just renders this component for
// the 'careerMaster' tab.
import React, { useState } from 'react';
import CareerConsentGate from './CareerConsentGate.jsx';
import ChooseYourPathScreen from './ChooseYourPathScreen.jsx';
import UploadDataScreen from './UploadDataScreen.jsx';
import CareerMasterPanel from './CareerMasterPanel.jsx';

const S = {
  back: { padding: '1rem 1.5rem 0', fontSize: '0.8rem', color: 'var(--sb-teal-deep, #02a1a6)', cursor: 'pointer' },
  comingSoon: { maxWidth: 640, margin: '3rem auto', padding: '2rem', textAlign: 'center', color: '#888', background: 'white', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12 },
};

export default function CareerMasterEntryPoint({ scope = 'member' }) {
  const [view, setView] = useState('choose'); // choose | upload | orbit | classic

  return (
    <CareerConsentGate>
      {view === 'choose' && (
        <ChooseYourPathScreen
          orbitAvailable={false}
          onEnterOrbit={() => setView('orbit')}
          onUploadData={() => setView('upload')}
          onGoToSiteLayout={() => window.dispatchEvent(new CustomEvent('sb-admin-switch-tab', { detail: { tab: 'content' } }))}
        />
      )}
      {view === 'orbit' && (
        <div style={S.comingSoon}>
          <div onClick={() => setView('choose')} style={{ ...S.back, textAlign: 'center', marginBottom: '1rem' }}>← Back</div>
          Career Orbit Projection is coming soon — the 3D per-job/case-study configuration experience.
        </div>
      )}
      {view === 'upload' && (
        <>
          <div style={S.back} onClick={() => setView('choose')}>← Back to Choose Your Path</div>
          <UploadDataScreen onOpenClassicEditor={() => setView('classic')} />
        </>
      )}
      {view === 'classic' && (
        <>
          <div style={S.back} onClick={() => setView('choose')}>← Back to Choose Your Path</div>
          <CareerMasterPanel scope={scope} />
        </>
      )}
    </CareerConsentGate>
  );
}
