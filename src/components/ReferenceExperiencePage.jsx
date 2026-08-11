import React, { useMemo, useState } from 'react';
import { REFERENCE_JOURNEY_MANIFEST } from '../config/experience/referenceJourneyManifest.js';
import { compileExperience } from '../lib/experienceCompiler.js';

export default function ReferenceExperiencePage() {
  const compiled = useMemo(() => compileExperience(REFERENCE_JOURNEY_MANIFEST), []);
  const [showMap, setShowMap] = useState(false);
  return <main style={{ minHeight: '100vh', background: '#071119', color: '#f5f0e8', fontFamily: 'var(--sb-font-body, sans-serif)' }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '.8rem 1rem', borderBottom: '1px solid rgba(245,240,232,.14)' }}>
      <div style={{ flex: 1 }}><span style={{ color: '#c4843a', letterSpacing: '.14em', fontSize: '.65rem' }}>EXPERIENCE COMPILER · CANDIDATE</span><h1 style={{ margin: '.2rem 0', fontSize: '1.2rem' }}>Member–Organization Relationship Journey</h1></div>
      <span role="status" style={{ color: compiled.valid ? '#9bd2b0' : '#ef9a9a' }}>{compiled.valid ? 'Manifest valid' : `${compiled.diagnostics.length} compiler errors`}</span>
      <button type="button" onClick={() => setShowMap((value) => !value)} style={{ minHeight: 44, padding: '.55rem .9rem', border: '1px solid #c4843a', borderRadius: 8, background: 'transparent', color: '#f5f0e8' }}>{showMap ? 'Return to live world' : 'Open accessible journey map'}</button>
    </header>
    {showMap ? <section aria-label="Reference journey map" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h2>Journey progression</h2>
      <ol style={{ display: 'grid', gap: '.8rem', paddingLeft: '1.4rem' }}>
        {REFERENCE_JOURNEY_MANIFEST.objects.map((object) => <li key={object.experienceObjectId}><strong>{object.information.label}</strong><div style={{ color: 'rgba(245,240,232,.68)' }}>{object.objectClass} · actions: {object.information.actionIds.join(', ') || 'inspect only'} · source: {object.semanticObjectRef.sourceRef}</div></li>)}
      </ol>
      <p>This precision surface is the keyboard and non-visual equivalent for the reference-world objects. Selecting an item in the live prototype must ultimately return focus here or to its originating world object.</p>
    </section> : <iframe title="Salt Basin crystalline reference journey" src="/api/experience/reference-prototype" data-ux-3d-alternative="reference-journey-map" style={{ display: 'block', width: '100%', height: 'calc(100vh - 76px)', border: 0 }} />}
  </main>;
}
