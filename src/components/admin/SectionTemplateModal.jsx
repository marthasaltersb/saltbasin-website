/**
 * SectionTemplateModal
 * Step 1 → choose a visual template (or blank)
 * Step 2 → name the section, set columns, confirm
 *
 * Props:
 *   onConfirm({ name, type, columns, bg, status, fields }) → called with seed data
 *   onClose()
 */
import React, { useState } from 'react';

const TEMPLATES = [
  {
    id: 'blank',
    type: 'text',
    label: 'Blank',
    icon: '⬜',
    desc: 'Empty section — start from scratch.',
    accent: '#8b9bae',
    fields: { heading: 'New Section', intro: '' },
    defaultCols: 1,
  },
  {
    id: 'hero',
    type: 'hero',
    label: 'Hero',
    icon: '✦',
    desc: 'Full-width headline with CTA buttons.',
    accent: 'var(--sb-navy)',
    preview: 'bg-navy',
    fields: { heading: 'Your Headline Here', subtitle: 'A compelling sub-headline that sets the stage.', cta1: 'Get Started', cta1Link: '#contact', cta2: 'Learn More', cta2Link: '#about' },
    defaultCols: 1,
  },
  {
    id: 'kpiDashboard',
    type: 'kpiDashboard',
    label: 'KPI Dashboard',
    icon: '📊',
    desc: 'Pastel metric panels — revenue, pipeline, activity.',
    accent: '#5271ff',
    fields: {
      eyebrow: 'Performance Overview',
      heading: 'Key Metrics',
      intro: 'A snapshot of performance across the business.',
      panels: [
        { label: 'Revenue', value: '$0', change: '+0%', caption: 'Month to date', color: '#c4e7e3' },
        { label: 'Pipeline', value: '$0', change: '+0', caption: 'Active deals', color: '#b1f3fe' },
        { label: 'Conversion', value: '0%', change: '0pp', caption: 'vs. last period', color: '#fbd1f5' },
        { label: 'Customers', value: '0', change: '+0', caption: 'Total accounts', color: '#e4cafc' },
      ],
    },
    defaultCols: 4,
  },
  {
    id: 'roadmap',
    type: 'roadmap',
    label: 'Roadmap',
    icon: '🗺',
    desc: 'Horizontal timeline with colored milestones.',
    accent: '#f950b8',
    fields: {
      eyebrow: 'Strategic Roadmap',
      heading: 'Where We\'re Going',
      intro: 'Our plan for the next 12 months.',
      milestones: [
        { date: 'Q1 2025', title: 'Discovery', description: 'Research and stakeholder alignment.', status: 'complete' },
        { date: 'Q2 2025', title: 'Design', description: 'Prototypes and architecture.', status: 'in-progress' },
        { date: 'Q3 2025', title: 'Build', description: 'Core feature development.', status: 'planned' },
        { date: 'Q4 2025', title: 'Launch', description: 'Go-to-market and rollout.', status: 'planned' },
      ],
    },
    defaultCols: 4,
  },
  {
    id: 'executiveSummary',
    type: 'executiveSummary',
    label: 'Executive Summary',
    icon: '📋',
    desc: 'Two-col layout with stats and contact card.',
    accent: '#ed7843',
    fields: {
      eyebrow: 'About',
      heading: 'Executive Summary',
      intro: 'Brief overview of your organization, mission, and accomplishments.',
      stats: [
        { value: '0+', label: 'Years Experience' },
        { value: '$0M', label: 'Revenue' },
        { value: '0', label: 'Team Members' },
      ],
      cardHeading: 'Contact',
      contacts: [
        { icon: '📧', label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' },
        { icon: '📍', label: 'Location', value: 'City, State' },
        { icon: '🌐', label: 'Web', value: 'example.com', href: 'https://example.com' },
      ],
    },
    defaultCols: 2,
  },
  {
    id: 'heatmap',
    type: 'heatmap',
    label: 'Status Heatmap',
    icon: '🗂',
    desc: 'Color-coded status grid — projects × periods.',
    accent: '#24bb7f',
    fields: {
      eyebrow: 'Project Status',
      heading: 'Initiative Tracker',
      intro: 'Current status across all active programs.',
      rowLabel: 'Initiative',
      columns: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      rows: [
        { label: 'Revenue Growth', values: ['green', 'green', 'yellow', 'green', 'green', 'green'] },
        { label: 'Product Launch', values: ['blue', 'blue', 'in-progress', 'yellow', 'green', 'green'] },
        { label: 'Team Hiring', values: ['green', 'yellow', 'red', 'yellow', 'green', 'green'] },
        { label: 'Customer Success', values: ['green', 'green', 'green', 'green', 'green', 'teal'] },
      ],
    },
    defaultCols: 1,
  },
  {
    id: 'leaderboard',
    type: 'leaderboard',
    label: 'Leaderboard',
    icon: '🏆',
    desc: 'Ranked list with gold/silver/bronze highlights.',
    accent: '#C4843A',
    fields: {
      eyebrow: 'Rankings',
      heading: 'Top Performers',
      intro: 'Our standout team members this period.',
      entries: [
        { name: 'Name One', subtitle: 'Role', value: '0', change: '+0%', icon: '👤' },
        { name: 'Name Two', subtitle: 'Role', value: '0', change: '+0%', icon: '👤' },
        { name: 'Name Three', subtitle: 'Role', value: '0', change: '+0%', icon: '👤' },
      ],
    },
    defaultCols: 1,
  },
  {
    id: 'appMockup',
    type: 'appMockup',
    label: 'App Mockup',
    icon: '📱',
    desc: 'Phone/tablet frame with content overlay.',
    accent: '#0077b6',
    preview: 'bg-navy',
    fields: {
      eyebrow: 'Product',
      heading: 'See It In Action',
      intro: 'A visual walkthrough of the key features.',
      cta1: 'Request a Demo',
      cta1Link: '#contact',
      layout: 'phone',
      screens: [
        { title: 'Dashboard', description: 'Real-time metrics at a glance.', tag: 'Home' },
        { title: 'Reports', description: 'Detailed analytics and exports.', tag: 'Analytics' },
      ],
    },
    defaultCols: 2,
  },
  {
    id: 'choiceGrid',
    type: 'choiceGrid',
    label: 'Choice Grid',
    icon: '🎨',
    desc: 'Interactive colored tiles — use cases, services, options.',
    accent: '#f08cae',
    fields: {
      eyebrow: 'Solutions',
      heading: 'What We Offer',
      intro: 'Click a tile to learn more.',
      choices: [
        { icon: '🚀', title: 'Option One', description: 'Description of this choice.', color: '#f08cae', cta: 'Learn More', ctaLink: '#' },
        { icon: '💡', title: 'Option Two', description: 'Description of this choice.', color: '#c99ee7', cta: 'Learn More', ctaLink: '#' },
        { icon: '🔧', title: 'Option Three', description: 'Description of this choice.', color: '#ffc071', cta: 'Learn More', ctaLink: '#' },
        { icon: '🌊', title: 'Option Four', description: 'Description of this choice.', color: '#73bbce', cta: 'Learn More', ctaLink: '#' },
      ],
    },
    defaultCols: 4,
  },
  {
    id: 'decisionTree',
    type: 'decisionTree',
    label: 'Decision Tree',
    icon: '🌿',
    desc: 'Interactive YES/NO branching flowchart.',
    accent: '#324b9a',
    fields: {
      eyebrow: 'Evaluation',
      heading: 'Is This Right For You?',
      intro: 'Answer a few questions to find out.',
      rootId: 'q1',
      nodes: [
        { id: 'q1', question: 'Are you looking for a B2B solution?', yes: 'q2', no: 'end-consumer' },
        { id: 'q2', question: 'Does your team have 10+ people?', yes: 'end-enterprise', no: 'end-smb' },
        { id: 'end-consumer', type: 'end', answer: 'Our consumer product may be a better fit. Check out our personal plans.' },
        { id: 'end-enterprise', type: 'end', answer: 'You\'re a great fit for our Enterprise tier. Let\'s talk!' },
        { id: 'end-smb', type: 'end', answer: 'Our SMB plan is perfect for teams your size.' },
      ],
    },
    defaultCols: 1,
  },
  {
    id: 'outputGenerator',
    type: 'outputGenerator',
    label: 'Output Generator',
    icon: '✦',
    desc: 'Drag-and-drop AI output builder with audience targeting.',
    accent: 'var(--sb-gold)',
    fields: {
      heading: 'Generate Your Output',
      intro: 'Select content blocks, choose an output type, and tailor it to your audience.',
      defaultOutputType: 'resume',
      summary: '',
      experience: '',
      skills: '',
    },
    defaultCols: 1,
  },
  {
    id: 'cards',
    type: 'cards',
    label: 'Cards',
    icon: '🃏',
    desc: 'Grid of feature/service cards with icons.',
    accent: '#5271ff',
    fields: {
      heading: 'Our Approach',
      intro: 'Three pillars that define how we work.',
      card1Title: 'Strategy', card1Desc: 'Align on vision and priorities.', card1Icon: '🎯',
      card2Title: 'Execution', card2Desc: 'Build with speed and precision.', card2Icon: '⚙️',
      card3Title: 'Impact', card3Desc: 'Measure what matters.', card3Icon: '📈',
    },
    defaultCols: 3,
  },
  {
    id: 'twoCol',
    type: 'twoCol',
    label: 'Two Column',
    icon: '⬛⬛',
    desc: 'Side-by-side text and media layout.',
    accent: '#02a1a6',
    fields: { heading: 'About This', body: 'Describe your content here.', imageUrl: '' },
    defaultCols: 2,
  },
  {
    id: 'timeline',
    type: 'timeline',
    label: 'Timeline',
    icon: '📅',
    desc: 'Vertical event timeline.',
    accent: '#6d2e46',
    fields: { heading: 'Our Story', items: [] },
    defaultCols: 1,
  },
  {
    id: 'statGrid',
    type: 'statGrid',
    label: 'Stat Grid',
    icon: '🔢',
    desc: 'Large number callouts.',
    accent: '#5271ff',
    fields: {
      heading: 'By the Numbers',
      stat1Value: '0', stat1Label: 'Metric One',
      stat2Value: '0', stat2Label: 'Metric Two',
      stat3Value: '0', stat3Label: 'Metric Three',
    },
    defaultCols: 3,
  },
  {
    id: 'cta',
    type: 'cta',
    label: 'Call to Action',
    icon: '📣',
    desc: 'Centered CTA with headline and button.',
    accent: 'var(--sb-navy)',
    preview: 'bg-navy',
    fields: { heading: 'Ready to Get Started?', intro: 'Let\'s talk.', cta1: 'Contact Us', cta1Link: '#contact' },
    defaultCols: 1,
  },
];

const BG_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'cream', label: 'Cream' },
  { value: 'ivory', label: 'Ivory' },
  { value: 'linen', label: 'Linen' },
  { value: 'navy', label: 'Navy' },
  { value: 'teal', label: 'Teal' },
  { value: 'sage', label: 'Sage' },
];

const STATUS_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'draft', label: 'Draft' },
  { value: 'hidden', label: 'Hidden' },
];

export function SectionTemplateModal({ onConfirm, onClose }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [cols, setCols] = useState(1);
  const [bg, setBg] = useState('');
  const [status, setStatus] = useState('visible');

  function pickTemplate(tpl) {
    setSelected(tpl);
    setName(tpl.label !== 'Blank' ? tpl.label : '');
    setCols(tpl.defaultCols || 1);
    setStep(2);
  }

  function confirm() {
    if (!name.trim()) { document.getElementById('sec-name-input')?.focus(); return; }
    const tpl = selected || TEMPLATES[0];
    onConfirm({
      name: name.trim(),
      type: tpl.type,
      columns: cols,
      bg,
      status,
      fields: { ...(tpl.fields || {}) },
    });
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  };
  const modal = {
    background: 'var(--sb-ivory, #faf8f4)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
    width: '100%', maxWidth: step === 1 ? 860 : 520, maxHeight: '90vh', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  };
  const header = {
    padding: '1.25rem 1.5rem', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const body = { flex: 1, overflowY: 'auto', padding: '1.5rem' };
  const footer = { padding: '1rem 1.5rem', borderTop: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' };

  const btnPrimary = { padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none', background: 'var(--sb-navy, #1b2a3b)', color: 'white', fontFamily: 'var(--sb-font-label)', fontSize: '0.8rem', letterSpacing: '0.1em', cursor: 'pointer' };
  const btnSecondary = { padding: '0.55rem 1.25rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', background: 'transparent', fontSize: '0.8rem', cursor: 'pointer', color: '#555' };
  const inputStyle = { width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.9rem', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem', fontFamily: 'var(--sb-font-label)' };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-teal-deep, #02a1a6)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.2rem' }}>
              {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--sb-navy, #1b2a3b)' }}>
              {step === 1 ? 'Choose a Template' : 'Configure Section'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888', padding: '0.25rem' }}>✕</button>
        </div>

        {/* Body */}
        <div style={body}>
          {step === 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => pickTemplate(tpl)}
                  style={{
                    textAlign: 'left', padding: '1rem', borderRadius: 10, cursor: 'pointer',
                    background: tpl.preview === 'bg-navy' ? 'var(--sb-navy, #1b2a3b)' : 'white',
                    border: `2px solid ${tpl.accent || 'rgba(0,0,0,0.1)'}22`,
                    transition: 'all 0.15s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tpl.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${tpl.accent}33`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${tpl.accent}22`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{tpl.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: tpl.preview === 'bg-navy' ? 'white' : 'var(--sb-navy, #1b2a3b)', marginBottom: '0.25rem' }}>{tpl.label}</div>
                  <div style={{ fontSize: '0.72rem', color: tpl.preview === 'bg-navy' ? 'rgba(255,255,255,0.6)' : '#888', lineHeight: 1.5 }}>{tpl.desc}</div>
                  {tpl.defaultCols > 1 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', letterSpacing: '0.12em', color: tpl.accent, fontFamily: 'var(--sb-font-label)', textTransform: 'uppercase' }}>
                      {tpl.defaultCols}-col
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Template badge */}
              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: `${selected.accent}12`, border: `1px solid ${selected.accent}30`, borderRadius: 8 }}>
                  <span style={{ fontSize: '1.3rem' }}>{selected.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sb-navy, #1b2a3b)' }}>{selected.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#777' }}>{selected.desc}</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '3px 10px', border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: '#555' }}>Change</button>
                </div>
              )}

              {/* Section name */}
              <div>
                <label htmlFor="sec-name-input" style={labelStyle}>Section Name *</label>
                <input
                  id="sec-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirm()}
                  placeholder="e.g. Q2 Pipeline Dashboard"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Columns */}
              <div>
                <label style={labelStyle}>Columns</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCols(n)}
                      style={{
                        width: 48, height: 42, borderRadius: 8, border: `2px solid ${cols === n ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.15)'}`,
                        background: cols === n ? 'var(--sb-navy, #1b2a3b)' : 'white',
                        color: cols === n ? 'white' : '#555', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <label style={labelStyle}>Background</label>
                <select value={bg} onChange={(e) => setBg(e.target.value)} style={{ ...inputStyle }}>
                  {BG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>Visibility</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setStatus(o.value)}
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: 7, border: `1.5px solid ${status === o.value ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.15)'}`,
                        background: status === o.value ? 'var(--sb-navy, #1b2a3b)' : 'white',
                        color: status === o.value ? 'white' : '#555', fontSize: '0.78rem', cursor: 'pointer',
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footer}>
          {step === 1 ? (
            <button style={btnSecondary} onClick={onClose}>Cancel</button>
          ) : (
            <>
              <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
              <button style={btnPrimary} onClick={confirm} disabled={!name.trim()}>
                Add Section →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionTemplateModal;
