import React, { useState } from 'react';

const journeys = {
  career: ['Career Journey', 'Add missing roles and dates', 'Connect skills and tools to roles', 'Capture measurable outcomes'],
  resume: ['Resume Journey', 'Choose a target role', 'Strengthen priority capability evidence', 'Review output-ready language'],
  caseStudy: ['Case Study Journey', 'Select an engagement', 'Complete context, actions, outcomes, and metrics', 'Confirm privacy and publishing choices'],
};

export default function CareerOrbit() {
  const [active, setActive] = useState('career');
  const [title, ...prompts] = journeys[active];
  return <div style={{ maxWidth: 1100, margin: '1rem auto 2rem', padding: '1.5rem', background: '#101d2b', color: 'white', borderRadius: 18 }}>
    <div style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#e1ba7b' }}>Career Orbit · guided enrichment</div>
    <h2 style={{ margin: '.4rem 0' }}>{title}</h2>
    <p style={{ color: '#b9c5cf', maxWidth: 720 }}>Move from source evidence to complete, output-ready Career Atoms. Each journey surfaces what is present, what is missing, and the next best enrichment step.</p>
    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', margin: '1.2rem 0' }}>
      {Object.entries(journeys).map(([id, item]) => <button key={id} onClick={() => setActive(id)} style={{ padding: '.55rem .9rem', borderRadius: 999, border: '1px solid #536474', background: active === id ? '#c4843a' : 'transparent', color: 'white', cursor: 'pointer' }}>{item[0]}</button>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '.8rem' }}>
      {prompts.map((prompt, i) => <div key={prompt} style={{ padding: '1rem', border: '1px solid #34495b', borderRadius: 12, background: '#172839' }}><strong>{i + 1}. {prompt}</strong><div style={{ color: '#9fb0bd', fontSize: '.76rem', marginTop: '.4rem' }}>Use the matching Career Master table to enrich this layer.</div></div>)}
    </div>
  </div>;
}
