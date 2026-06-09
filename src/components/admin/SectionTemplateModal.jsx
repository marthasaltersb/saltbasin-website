/**
 * SectionTemplateModal
 * Step 1 → choose a template from a categorized grid
 * Step 2 → name the section, set columns, confirm
 */
import React, { useState } from 'react';

// ── Template definitions ──────────────────────────────────────────────────────
const TEMPLATE_CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    icon: '⬜',
    templates: [
      {
        id: 'blank', type: 'text', label: 'Blank', icon: '⬜',
        desc: 'Empty section — start from scratch.',
        accent: '#8b9bae',
        fields: { heading: '', intro: '' },
        defaultCols: 1,
      },
      {
        id: 'hero', type: 'hero', label: 'Hero', icon: '✦',
        desc: 'Full-width headline with CTA buttons.',
        accent: '#1b2a3b', preview: 'bg-navy',
        fields: { heading: 'Your Headline Here', subtitle: 'A compelling sub-headline that sets the stage.', cta1: 'Get Started', cta1Link: '#contact', cta2: 'Learn More', cta2Link: '#about' },
        defaultCols: 1,
      },
      {
        id: 'twoCol', type: 'twoCol', label: 'Two Column', icon: '⬛⬛',
        desc: 'Side-by-side text and media layout.',
        accent: '#02a1a6',
        fields: { heading: '', body: '', imageUrl: '' },
        defaultCols: 2,
      },
      {
        id: 'cta', type: 'cta', label: 'Call to Action', icon: '📣',
        desc: 'Centered CTA with headline and button.',
        accent: '#1b2a3b', preview: 'bg-navy',
        fields: { heading: 'Ready to Get Started?', intro: "Let's talk.", cta1: 'Contact Us', cta1Link: '#contact' },
        defaultCols: 1,
      },
      {
        id: 'statGrid', type: 'statGrid', label: 'Stat Grid', icon: '🔢',
        desc: 'Large number callouts.',
        accent: '#5271ff',
        fields: { heading: 'By the Numbers', stat1Value: '0', stat1Label: 'Metric One', stat2Value: '0', stat2Label: 'Metric Two', stat3Value: '0', stat3Label: 'Metric Three' },
        defaultCols: 3,
      },
    ],
  },
  {
    id: 'member-profile',
    label: 'Member Profile',
    icon: '👤',
    templates: [
      {
        id: 'careerTimeline', type: 'timeline', label: 'Career Timeline', icon: '💼',
        desc: 'Interactive horizontal career history — click a role to expand.',
        accent: '#c4843a',
        fields: {
          eyebrow: 'Experience',
          heading: 'Career History',
          intro: 'A walkthrough of the roles and companies that shaped my expertise.',
          actions: [{ label: 'Download Resume', href: '/output/resume', style: 'gold' }],
        },
        defaultCols: 1,
      },
      {
        id: 'caseStudies', type: 'caseStudies', label: 'Case Studies', icon: '📁',
        desc: 'Dynamic case studies with problem, KPI, methods, challenges, and impact.',
        accent: '#5271ff', preview: 'bg-navy',
        fields: {
          eyebrow: 'Work',
          heading: 'Case Studies',
          intro: 'Deep-dives into selected engagements.',
          cases: [
            { title: 'Case Study Title', clientSummary: 'Brief client context.', problemStatement: '', kpiImprovement: '', methodsTaken: '', challenges: '', impact: '', tags: '' },
          ],
        },
        defaultCols: 1,
      },
      {
        id: 'clientSnapshot', type: 'clientSnapshot', label: 'Client Snapshot', icon: '🗂',
        desc: 'Grouped rollup view of all clients — by industry, capability, or revenue.',
        accent: '#02a1a6',
        fields: {
          eyebrow: 'Portfolio',
          heading: 'Client Snapshot',
          intro: 'A rolled-up view of clients served, grouped by dimension.',
          defaultGroupBy: 'industry',
          clients: [],
        },
        defaultCols: 1,
      },
      {
        id: 'skills', type: 'skills', label: 'Skills', icon: '🛠',
        desc: 'Skill groups with expert/proficient/familiar levels and years.',
        accent: '#24bb7f',
        fields: {
          eyebrow: 'Skills',
          heading: 'Technical & Domain Skills',
          intro: 'A breakdown of skills by category and proficiency.',
          skills: [
            { category: 'ERP & Billing', items: [{ name: 'Salesforce CPQ', level: 'expert', years: '8' }, { name: 'NetSuite', level: 'proficient', years: '5' }] },
            { category: 'Integration', items: [{ name: 'MuleSoft', level: 'expert', years: '6' }] },
          ],
        },
        defaultCols: 3,
      },
      {
        id: 'technology', type: 'technology', label: 'Technology', icon: '⚙️',
        desc: 'Technology stack grouped by hands-on, integration, and adjacent.',
        accent: '#5271ff',
        fields: { heading: 'Technology Experience', eyebrow: 'Technical' },
        defaultCols: 3,
      },
      {
        id: 'industryWheel', type: 'industryWheel', label: 'Industry Wheel', icon: '🌐',
        desc: 'Interactive SVG wheel of industries and domains served.',
        accent: '#c4843a',
        fields: { heading: 'Industries & Domains', eyebrow: 'Expertise' },
        defaultCols: 1,
      },
      {
        id: 'executiveSummary', type: 'executiveSummary', label: 'Executive Summary', icon: '📋',
        desc: 'Two-col layout with key stats and contact card.',
        accent: '#ed7843',
        fields: {
          eyebrow: 'About',
          heading: 'Executive Summary',
          intro: 'Brief overview of your background and strengths.',
          stats: [{ value: '0+', label: 'Years Experience' }, { value: '$0M', label: 'Revenue Impact' }],
          cardHeading: 'Contact',
          contacts: [{ icon: '📧', label: 'Email', value: 'you@example.com', href: 'mailto:you@example.com' }],
        },
        defaultCols: 2,
      },
      {
        id: 'choiceGrid', type: 'choiceGrid', label: 'Services / Offerings', icon: '🎨',
        desc: 'Interactive tiles — great for service offerings or specialties.',
        accent: '#f08cae',
        fields: {
          eyebrow: 'Services',
          heading: 'How I Help',
          intro: 'Click a tile to learn more.',
          choices: [
            { icon: '🎯', title: 'Strategy', description: 'Align on vision and priorities.', color: '#f08cae', cta: 'Learn More', ctaLink: '#contact' },
            { icon: '⚙️', title: 'Execution', description: 'Build with speed and precision.', color: '#c99ee7', cta: 'Learn More', ctaLink: '#contact' },
          ],
        },
        defaultCols: 3,
      },
      {
        id: 'resume', type: 'resume', label: 'Resume Block', icon: '📄',
        desc: 'Dynamic role list — add as many jobs as your career needs.',
        accent: '#8b9bae',
        fields: {
          heading: 'Professional Background',
          intro: 'A short framing paragraph for your career.',
          roles: [{ title: '', company: '', start: '', end: '', current: true, description: '' }],
        },
        defaultCols: 1,
      },
    ],
  },
  {
    id: 'org-profile',
    label: 'Org Profile',
    icon: '🏢',
    templates: [
      {
        id: 'orgTimeline', type: 'timeline', label: 'Company Timeline', icon: '🏛',
        desc: 'Organization milestones and history.',
        accent: '#c4843a',
        fields: {
          eyebrow: 'History',
          heading: 'Company Milestones',
          intro: 'Key moments in the organization\'s journey.',
          actions: [{ label: 'Learn More', href: '#about', style: 'gold' }],
        },
        defaultCols: 1,
      },
      {
        id: 'roadmap', type: 'roadmap', label: 'Roadmap', icon: '🗺',
        desc: 'Horizontal timeline with colored milestone nodes.',
        accent: '#f950b8',
        fields: {
          eyebrow: 'Strategic Roadmap',
          heading: 'Where We\'re Going',
          intro: 'Our plan for the next 12 months.',
          milestones: [
            { date: 'Q1', title: 'Discovery', description: 'Research and alignment.', status: 'complete' },
            { date: 'Q2', title: 'Design', description: 'Prototypes and architecture.', status: 'in-progress' },
            { date: 'Q3', title: 'Build', description: 'Core development.', status: 'planned' },
            { date: 'Q4', title: 'Launch', description: 'Go-to-market rollout.', status: 'planned' },
          ],
        },
        defaultCols: 4,
      },
      {
        id: 'appMockup', type: 'appMockup', label: 'Product Mockup', icon: '📱',
        desc: 'Phone/tablet frame with content overlay.',
        accent: '#0077b6', preview: 'bg-navy',
        fields: {
          eyebrow: 'Product',
          heading: 'See It In Action',
          intro: 'A visual walkthrough of the key features.',
          cta1: 'Request a Demo', cta1Link: '#contact',
          layout: 'phone',
          screens: [{ title: 'Dashboard', description: 'Real-time metrics at a glance.', tag: 'Home' }],
        },
        defaultCols: 2,
      },
      {
        id: 'leaderboard', type: 'leaderboard', label: 'Team / Leaderboard', icon: '🏆',
        desc: 'Ranked list with gold/silver/bronze highlights.',
        accent: '#C4843A',
        fields: {
          eyebrow: 'Team',
          heading: 'Our Team',
          entries: [
            { name: 'Team Member', subtitle: 'Role', value: '', icon: '👤' },
          ],
        },
        defaultCols: 1,
      },
    ],
  },
  {
    id: 'project-mgmt',
    label: 'Project Management',
    icon: '📊',
    templates: [
      {
        id: 'kpiDashboard', type: 'kpiDashboard', label: 'KPI Dashboard', icon: '📊',
        desc: 'Pastel metric panels — revenue, pipeline, activity.',
        accent: '#5271ff',
        fields: {
          eyebrow: 'Performance',
          heading: 'Key Metrics',
          panels: [
            { label: 'Metric One', value: '0', change: '+0%', caption: 'Period', color: '#c4e7e3' },
            { label: 'Metric Two', value: '0', change: '+0%', caption: 'Period', color: '#b1f3fe' },
            { label: 'Metric Three', value: '0', change: '+0%', caption: 'Period', color: '#fbd1f5' },
            { label: 'Metric Four', value: '0', change: '+0%', caption: 'Period', color: '#e4cafc' },
          ],
        },
        defaultCols: 4,
      },
      {
        id: 'heatmap', type: 'heatmap', label: 'Status Heatmap', icon: '🗂',
        desc: 'Color-coded status grid — initiatives × periods.',
        accent: '#24bb7f',
        fields: {
          eyebrow: 'Project Status',
          heading: 'Initiative Tracker',
          rowLabel: 'Initiative',
          columns: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          rows: [
            { label: 'Initiative One', values: ['green', 'green', 'yellow', 'green', 'green', 'green'] },
            { label: 'Initiative Two', values: ['blue', 'blue', 'yellow', 'green', 'green', 'green'] },
          ],
        },
        defaultCols: 1,
      },
      {
        id: 'projectTimeline', type: 'roadmap', label: 'Project Timeline', icon: '📅',
        desc: 'Phase-by-phase project timeline with status.',
        accent: '#f950b8',
        fields: {
          eyebrow: 'Project Plan',
          heading: 'Project Timeline',
          milestones: [
            { date: 'Phase 1', title: 'Discovery', description: 'Requirements and stakeholder alignment.', status: 'complete' },
            { date: 'Phase 2', title: 'Design', description: 'Architecture and UX.', status: 'in-progress' },
            { date: 'Phase 3', title: 'Build', description: 'Development sprint.', status: 'planned' },
            { date: 'Phase 4', title: 'Deploy', description: 'Go-live and hypercare.', status: 'planned' },
          ],
        },
        defaultCols: 4,
      },
      {
        id: 'cards', type: 'cards', label: 'Feature Cards', icon: '🃏',
        desc: 'Grid of feature or workstream cards with icons.',
        accent: '#5271ff',
        fields: {
          heading: 'Workstreams',
          cards: [
            { title: 'Workstream One', desc: 'Description.', icon: '🎯' },
            { title: 'Workstream Two', desc: 'Description.', icon: '⚙️' },
            { title: 'Workstream Three', desc: 'Description.', icon: '📈' },
          ],
        },
        defaultCols: 3,
      },
      {
        id: 'decisionTree', type: 'decisionTree', label: 'Decision Tree', icon: '🌿',
        desc: 'Interactive YES/NO branching flowchart.',
        accent: '#324b9a',
        fields: {
          eyebrow: 'Evaluation',
          heading: 'Decision Framework',
          rootId: 'q1',
          nodes: [
            { id: 'q1', question: 'Is this in scope?', yes: 'q2', no: 'end-out' },
            { id: 'q2', question: 'Has it been approved?', yes: 'end-proceed', no: 'end-escalate' },
            { id: 'end-out', type: 'end', answer: 'Out of scope. Log as backlog.' },
            { id: 'end-proceed', type: 'end', answer: 'Proceed with execution.' },
            { id: 'end-escalate', type: 'end', answer: 'Escalate for approval before proceeding.' },
          ],
        },
        defaultCols: 1,
      },
      {
        id: 'outputGenerator', type: 'outputGenerator', label: 'Output Generator', icon: '✦',
        desc: 'Drag-and-drop AI output builder with audience targeting.',
        accent: '#c4843a',
        fields: { heading: 'Generate Output', intro: 'Select content blocks and generate a tailored document.', defaultOutputType: 'one-pager' },
        defaultCols: 1,
      },
    ],
  },
];

// Flatten all templates for lookup
const ALL_TEMPLATES = TEMPLATE_CATEGORIES.flatMap(c => c.templates);

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
  const [activeCategory, setActiveCategory] = useState('general');
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
    const tpl = selected || ALL_TEMPLATES[0];
    onConfirm({ name: name.trim(), type: tpl.type, columns: cols, bg, status, fields: { ...(tpl.fields || {}) } });
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };
  const modal = { background: 'var(--sb-ivory, #faf8f4)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', width: '100%', maxWidth: step === 1 ? 920 : 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
  const header = { padding: '1.25rem 1.5rem', borderBottom: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 };
  const footer = { padding: '1rem 1.5rem', borderTop: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 };
  const btnPrimary = { padding: '0.55rem 1.5rem', borderRadius: 8, border: 'none', background: 'var(--sb-navy, #1b2a3b)', color: 'white', fontFamily: 'var(--sb-font-label)', fontSize: '0.8rem', letterSpacing: '0.1em', cursor: 'pointer' };
  const btnSecondary = { padding: '0.55rem 1.25rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.2)', background: 'transparent', fontSize: '0.8rem', cursor: 'pointer', color: '#555' };
  const inputStyle = { width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.9rem', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem', fontFamily: 'var(--sb-font-label)' };

  const currentCat = TEMPLATE_CATEGORIES.find(c => c.id === activeCategory) || TEMPLATE_CATEGORIES[0];

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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', height: '100%' }}>
              {/* Category sidebar */}
              <div style={{ width: 160, flexShrink: 0, borderRight: '0.5px solid rgba(0,0,0,0.08)', padding: '1rem 0', background: '#f5f2ed' }}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.55rem 1rem', border: 'none', background: activeCategory === cat.id ? 'white' : 'transparent', borderLeft: activeCategory === cat.id ? '3px solid var(--sb-gold, #c4843a)' : '3px solid transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: activeCategory === cat.id ? 600 : 400, color: activeCategory === cat.id ? 'var(--sb-navy, #1b2a3b)' : '#666' }}>
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {/* Template grid */}
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>{currentCat.label} — {currentCat.templates.length} templates</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
                  {currentCat.templates.map((tpl) => (
                    <button key={tpl.id} onClick={() => pickTemplate(tpl)} style={{ textAlign: 'left', padding: '1rem', borderRadius: 10, cursor: 'pointer', background: tpl.preview === 'bg-navy' ? 'var(--sb-navy, #1b2a3b)' : 'white', border: `2px solid ${tpl.accent || 'rgba(0,0,0,0.1)'}22`, transition: 'all 0.15s', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = tpl.accent; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${tpl.accent}33`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${tpl.accent}22`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{tpl.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: tpl.preview === 'bg-navy' ? 'white' : 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' }}>{tpl.label}</div>
                      <div style={{ fontSize: '0.68rem', color: tpl.preview === 'bg-navy' ? 'rgba(255,255,255,0.6)' : '#888', lineHeight: 1.45 }}>{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <div>
                <label htmlFor="sec-name-input" style={labelStyle}>Section Name *</label>
                <input id="sec-name-input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm()} placeholder="e.g. Q2 Pipeline Dashboard" style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Columns</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setCols(n)} style={{ width: 48, height: 42, borderRadius: 8, border: `2px solid ${cols === n ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.15)'}`, background: cols === n ? 'var(--sb-navy, #1b2a3b)' : 'white', color: cols === n ? 'white' : '#555', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Background</label>
                <select value={bg} onChange={e => setBg(e.target.value)} style={{ ...inputStyle }}>
                  {BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Visibility</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {STATUS_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setStatus(o.value)} style={{ flex: 1, padding: '0.4rem', borderRadius: 7, border: `1.5px solid ${status === o.value ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.15)'}`, background: status === o.value ? 'var(--sb-navy, #1b2a3b)' : 'white', color: status === o.value ? 'white' : '#555', fontSize: '0.78rem', cursor: 'pointer' }}>
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
          {step === 1
            ? <button style={btnSecondary} onClick={onClose}>Cancel</button>
            : <>
                <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
                <button style={btnPrimary} onClick={confirm} disabled={!name.trim()}>Add Section →</button>
              </>
          }
        </div>
      </div>
    </div>
  );
}

export default SectionTemplateModal;
