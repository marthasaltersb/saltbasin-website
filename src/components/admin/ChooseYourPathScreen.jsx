// ChooseYourPathScreen (2026-07-16) — shown once Career Portfolio consent is
// granted (see CareerConsentGate.jsx). Two main paths: Enter Career Orbit
// (the 3D per-job/case-study configuration experience) and Upload Data
// (semantic Excel template + resume analysis), plus a link tile to the
// existing site editor for the public-site career layout — reuses the
// already-shipped `content`/`config` member tabs rather than a rebuild.
import React, { useState } from 'react';

const S = {
  wrap: { maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.4rem', textAlign: 'center' },
  sub: { fontSize: '0.85rem', color: '#666', textAlign: 'center', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' },
  tile: (enabled) => ({
    background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: '1.75rem',
    cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.55, textAlign: 'left',
    transition: 'box-shadow 0.15s',
  }),
  tileTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.4rem' },
  tileDesc: { fontSize: '0.8rem', color: '#777', lineHeight: 1.5 },
  badge: { display: 'inline-block', marginTop: '0.75rem', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-gold, #c4843a)', fontWeight: 700 },
  linkTile: { marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' },
};

export default function ChooseYourPathScreen({ onEnterOrbit, onUploadData, onGoToSiteLayout, orbitAvailable = false }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={S.wrap}>
      <div style={S.title}>Choose Your Path</div>
      <div style={S.sub}>How would you like to configure your Career Master and Resume Output today?</div>
      <div style={S.grid}>
        <div
          style={{ ...S.tile(orbitAvailable), boxShadow: hover === 'orbit' && orbitAvailable ? '0 4px 16px rgba(0,0,0,0.08)' : 'none' }}
          onClick={() => orbitAvailable && onEnterOrbit?.()}
          onMouseEnter={() => setHover('orbit')}
          onMouseLeave={() => setHover(null)}
        >
          <div style={S.tileTitle}>◈ Enter Career Orbit</div>
          <div style={S.tileDesc}>Configure each job or case study one at a time in the 3D rendered experience, guided by an agent, with a live maturity readout.</div>
          {!orbitAvailable && <div style={S.badge}>Coming soon</div>}
        </div>
        <div
          style={{ ...S.tile(true), boxShadow: hover === 'upload' ? '0 4px 16px rgba(0,0,0,0.08)' : 'none' }}
          onClick={() => onUploadData?.()}
          onMouseEnter={() => setHover('upload')}
          onMouseLeave={() => setHover(null)}
        >
          <div style={S.tileTitle}>⇪ Upload Data</div>
          <div style={S.tileDesc}>Download a semantic Excel template mapped to real Career Atoms, or upload an existing resume for layout ingestion and agentic mapping suggestions.</div>
        </div>
      </div>
      <div style={S.linkTile}>
        <a href="#" onClick={(e) => { e.preventDefault(); onGoToSiteLayout?.(); }} style={{ color: 'var(--sb-teal-deep, #02a1a6)' }}>
          Configure how your career shows up on your public site →
        </a>
      </div>
    </div>
  );
}
