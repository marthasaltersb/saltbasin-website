// Print-friendly "output" pages: Resume, Case Study, Proposal, One-Pager.
//
// Auth gate: visitors who aren't logged in see a teaser (top portion + fade
// overlay + signup CTA). Members and admin see the full output.
//
// Each output is meant to be viewed on screen first, then printed or saved
// as PDF via the browser's "Save as PDF". Print CSS hides nav/footer.

import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import BackLink from './BackLink.jsx';

// ── Auth state hook ──
function useAuthState() {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setState({ loading: false, user: d.user || null }))
      .catch(() => setState({ loading: false, user: null }));
  }, []);
  return state;
}

// ── Reusable frame ──
function OutputFrame({ title, eyebrow, children, gated }) {
  return (
    <div style={{ background: 'white', color: 'var(--sb-navy)', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .sb-output-toolbar, .sb-output-gate-overlay, footer { display: none !important; }
          .sb-output-page { padding: 0 !important; box-shadow: none !important; }
          body { background: white !important; }
        }
        @page { size: letter; margin: 0.5in; }
      `}</style>
      <div
        className="sb-output-toolbar"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--sb-navy-deep)', color: 'var(--sb-cream)',
          padding: '0.8rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '0.5px solid rgba(196,132,58,0.4)',
        }}
      >
        <div>
          <div className="sb-display" style={{ fontSize: '0.95rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Salt Basin Net Works
          </div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
            {eyebrow || 'Output'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {!gated && (
            <button
              onClick={() => window.print()}
              className="sb-btn sb-btn-gold"
              style={{ padding: '0.45rem 1rem', fontSize: '0.7rem' }}
            >
              ⌘ Print / Save as PDF
            </button>
          )}
          {gated && (
            <span
              style={{
                padding: '0.45rem 1rem', fontSize: '0.7rem',
                background: 'rgba(196,132,58,0.18)', color: 'var(--sb-gold)',
                borderRadius: 'var(--sb-radius)', letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'var(--sb-font-label)',
              }}
            >
              ✦ Member preview
            </span>
          )}
          <BackLink
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.45rem 1rem', fontSize: '0.7rem' }}
          >
            ← Back
          </BackLink>
        </div>
      </div>

      <article
        className="sb-output-page"
        style={{
          maxWidth: 820,
          margin: '2rem auto',
          padding: '2.5rem 3rem',
          background: 'white',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        {title && (
          <header style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--sb-gold)', paddingBottom: '0.75rem' }}>
            <h1
              style={{
                fontFamily: 'var(--sb-font-display)',
                fontSize: '2.4rem',
                color: 'var(--sb-navy)',
                letterSpacing: '0.03em',
                marginBottom: '0.2rem',
              }}
            >
              {title}
            </h1>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
              Salt Basin Net Works · Bottom Lines with a Rising Tide
            </div>
          </header>
        )}
        {children}
        <footer style={{ marginTop: '3rem', paddingTop: '1.25rem', borderTop: '0.5px solid var(--sb-taupe)', fontSize: '0.72rem', color: 'var(--sb-teal-deep)' }}>
          Salt Basin Net Works · saltbasin.net · betsy@saltbasin.net
        </footer>
      </article>
    </div>
  );
}

// ── Preview gate: returned at the top of each output for non-members. Renders
// a small teaser of what the output contains + signup CTA. Members skip this
// entirely. Print is unavailable on the gated view since the full content
// never renders. ──
function GatedPreview({ kind, teaser }) {
  const location = useLocation();
  return (
    <div>
      {/* Brief teaser of what the full output would contain */}
      <section style={{ marginBottom: '1.25rem' }}>
        <OutputHeading>{teaser?.label || 'Preview'}</OutputHeading>
        {teaser?.paragraphs?.map((p, i) => (
          <p key={i} style={paraStyle}>{p}</p>
        ))}
        {teaser?.bullets && (
          <ul style={ulStyle}>
            {teaser.bullets.map((b, i) => (
              <li key={i} style={liStyle}><span style={dotStyle}>·</span>{b}</li>
            ))}
          </ul>
        )}
      </section>

      <div
        style={{
          marginTop: '2rem',
          padding: '2rem',
          background: 'var(--sb-navy)',
          color: 'var(--sb-cream)',
          borderRadius: 'var(--sb-radius)',
          borderTop: '3px solid var(--sb-gold)',
          textAlign: 'center',
        }}
      >
        <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>
          Member access required
        </div>
        <h2 style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
          Sign up to generate Salt Basin outputs
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--sb-sage)', lineHeight: 1.65, maxWidth: 500, margin: '0 auto 1.25rem' }}>
          The full {kind} — including the rest of this content plus print-to-PDF download — is available to Salt Basin members. Free to start. You keep everything you've shared as a lead, plus get a profile site you can point to.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/signup?next=${encodeURIComponent(location.pathname)}`}
            className="sb-btn sb-btn-gold"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.72rem' }}
          >
            ✦ Become a Member
          </Link>
          <Link
            to={`/admin/login?next=${encodeURIComponent(location.pathname)}`}
            className="sb-btn sb-btn-outline"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.72rem' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Industry data — same content used in the wheel section, lifted here so
//    the static resume output can show the same intel without interaction. ──
const INDUSTRIES = [
  { key: 'hightech', label: 'High Tech / SaaS', icon: '◇',
    snapshot: '$50M – $3.7B+ · Q2R + CPQ + billing for high-growth SaaS — $2.6B virtual healthcare platform, $3.7B+ GPS tech, multiple PwC + Slalom engagements.' },
  { key: 'pe', label: 'Private Equity', icon: '◈',
    snapshot: 'Fund-level work — Vista Equity Partners (Senior Consultant) + cross-portfolio system changes tied to pricing strategy and revenue generation.' },
  { key: 'peportco', label: 'PE / VC Portcos', icon: '◉',
    snapshot: '$50M – $615M typical · Crisis advisory, system rebuilds, RevRec stabilization — $615M healthcare IT NASDAQ delisting + Vista portco operating-model resets.' },
  { key: 'mfg', label: 'Manufacturing', icon: '⚙',
    snapshot: '$9B – $38B+ · Q2R transformation for $9B global industrial automation manufacturer + usage-based billing design for $38B+ semiconductor co.' },
  { key: 'finserv', label: 'FinServ / FinTech', icon: '◎',
    snapshot: 'Engagement details available on request.' },
  { key: 're', label: 'Real Estate', icon: '◫',
    snapshot: 'Engagement details available on request.' },
  { key: 'edu', label: 'Education', icon: '◰',
    snapshot: '$4.5B+ · Business analysis and systems integration for global education and publishing company (Accenture).' },
  { key: 'pub', label: 'Publishing', icon: '◱',
    snapshot: '$4.5B+ · Same Accenture engagement — global publishing/education portfolio.' },
];

const DOMAIN_CATEGORIES = [
  { title: 'Strategic', icon: '◆', items: [
    'Executive Strategy & C-Suite Partnership',
    'Financial Modeling & Scenario Planning',
    'Enterprise / Org Intelligence & Infrastructure Scaffolding',
  ]},
  { title: 'Growth & Operational Excellence', icon: '▲', items: [
    'RevOps & GTM Systems',
    'Quote-to-Revenue Transformation',
    'Data & Lead-to-Cash Architecture',
  ]},
  { title: 'Monitoring', icon: '●', items: [
    'Enterprise Risk & Crisis Advisory',
    'Governance',
    'Data Quality',
    'Bookings Reconciliations & Operating Financials',
  ]},
];

const NICHE_SOLUTIONS = [
  { label: 'Private Equity', icon: '◈', items: [
    'Sourcing & Deal Scoring',
    'Due Diligence',
    'Value Creation Planning + Execution',
    'Portfolio Company Monitoring',
    'Specialized Data Platform — fund expectations ↔ portfolio actuals',
  ]},
  { label: 'All Things AI', icon: '✦', items: [
    'Data Readiness Assessment',
    'Data Modeling',
    'AI ROI / business-case quantification',
  ]},
  { label: 'Data Aggregation Intelligence', icon: '◰', items: [
    'Modern MDM Solutions',
    'Zero-Copy for Agentic Layers',
  ]},
];

const SERVICE_OFFERINGS = [
  {
    slug: 'diagnostic-sprint',
    title: 'Diagnostic Sprint',
    tag: '10-day fixed fee',
    summary: 'Rapid Q2R / RevOps / CPQ readiness assessment. Risk map + roadmap.',
    activities: [
      'Stakeholder interviews (8–12) across sales, finance, ops, IT',
      'Systems audit: CRM, CPQ, billing, ledger',
      'Sample data pulls + reconciliation spot-checks',
      'Risk scoring against 8 critical Q2R control points',
      'Quantified gap analysis vs. fast-growth benchmarks',
    ],
    dataNeeds: [
      'Read-only CRM + CPQ access',
      '90 days of pipeline + bookings data',
      'Quote-to-invoice sample set (10–30 deals)',
      'Org chart for Q2R-adjacent roles',
    ],
    cadence: [
      'Day 1: Kickoff + scope confirmation',
      'Days 2–3: Discovery interviews',
      'Days 4–7: Systems audit + analysis',
      'Day 8: Internal readout draft',
      'Day 10: Board-ready presentation + live workshop',
    ],
  },
  {
    slug: 'embedded-operator',
    title: 'Embedded Operator',
    tag: '3–6 month engagement',
    summary: 'Fractional senior leader for system rebuilds and transformation.',
    activities: [
      'Hands-on through design, vendor selection, delivery',
      'Direct C-suite reporting line + weekly cadence',
      'AI-assisted leverage on outputs (decks, models, workflows)',
      'Team coaching + process design + change orchestration',
    ],
    dataNeeds: [
      'Full operating access to systems in scope',
      'Slack/Teams + project tooling access',
      'Quarterly financials + bookings trajectory',
      'Active vendor + contract list',
    ],
    cadence: [
      'Week 1: Embed + access provisioning',
      'Weeks 2–4: Current-state diagnosis + plan',
      'Weeks 5–N: Execution sprints (bi-weekly review)',
      'Month-end: Board-pack updates',
      'Exit: Knowledge transfer + handoff doc',
    ],
  },
  {
    slug: 'advisory-retainer',
    title: 'Advisory Retainer',
    tag: 'Monthly',
    summary: 'Executive-level strategic partner on standing call.',
    activities: [
      'Quarterly planning sessions',
      'Deal-stage triage + pricing strategy reviews',
      'Board-prep + investor narrative review',
      'Strategic talent sounding (hire/promote/let-go)',
    ],
    dataNeeds: [
      'Quarterly board pack',
      'Forecast + pipeline snapshot',
      'Active deals over $250K (if relevant)',
    ],
    cadence: [
      'Monthly 90-minute working session',
      'Bi-weekly 30-minute office hours',
      'Async via shared workspace',
      'Same-day response for urgent matters',
    ],
  },
];

// ── Resume ──
export function ResumeOutput() {
  const { loading, user } = useAuthState();
  const [page, setPage] = useState(null);
  const [wheel, setWheel] = useState(null);
  useEffect(() => {
    api.getPublishedSite()
      .then((site) => {
        setPage(site.pages['consulting-founder']);
        // Industries × Domains wheel section lives on the home page; we pull
        // tech stack fields from it here for the static resume output.
        const home = site.pages['home'];
        setWheel(home?.sections.find((s) => s.type === 'industryWheel')?.fields || {});
      })
      .catch(() => {});
  }, []);
  if (loading || !page) return null;

  if (!user) {
    const about = page.sections.find((s) => s.type === 'about')?.fields || {};
    return (
      <OutputFrame title={about.heading || 'Betsy Salter'} eyebrow="Resume" gated>
        <GatedPreview
          kind="resume"
          teaser={{
            label: 'Profile (preview)',
            paragraphs: [about.p1].filter(Boolean),
          }}
        />
      </OutputFrame>
    );
  }

  const about = page.sections.find((s) => s.type === 'about')?.fields || {};
  const timeline = page.sections.find((s) => s.type === 'timeline')?.fields || {};
  const jobs = [];
  for (let i = 1; i <= 10; i++) {
    if (!timeline[`job${i}Company`]) continue;
    jobs.push({
      company: timeline[`job${i}Company`],
      title: timeline[`job${i}Title`],
      dates: timeline[`job${i}Dates`],
      bullets: (timeline[`job${i}Bullets`] || '').split('\n').filter(Boolean),
    });
  }

  // Parse the tech stack ("Label:slug, Label:slug, ...") into a clean array.
  const parseTech = (s) => (s || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.split(':')[0].trim());
  const handsOn = parseTech(wheel?.handsOn);
  const integrationDesign = parseTech(wheel?.integrationDesign);
  const adjacent = parseTech(wheel?.adjacent);

  return (
    <OutputFrame title={about.heading || 'Betsy Salter'} eyebrow="Resume">
      <>
        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>Profile</OutputHeading>
          {[about.p1, about.p2, about.p3].filter(Boolean).map((p, i) => (
            <p key={i} style={paraStyle}>{p}</p>
          ))}
          {about.howIWork && (
            <p style={{ ...paraStyle, fontStyle: 'italic' }}>
              <strong style={{ color: 'var(--sb-navy)' }}>How I work:</strong> {about.howIWork}
            </p>
          )}
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>Industries Served</OutputHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
            {INDUSTRIES.map((ind) => (
              <div key={ind.key} style={{ pageBreakInside: 'avoid', background: '#FBF6F0', padding: '0.65rem 0.8rem', borderLeft: '3px solid var(--sb-gold)' }}>
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '0.95rem', color: 'var(--sb-navy)', fontWeight: 500 }}>
                  {ind.icon} {ind.label}
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--sb-teal-deep)', marginTop: 3 }}>
                  {ind.snapshot}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>Technology & Capability</OutputHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <TechColumn label="Hands-On" items={handsOn} />
            <TechColumn label="Integration Designs" items={integrationDesign} />
            <TechColumn label="Adjacent Exposure" items={adjacent} />
          </div>
        </section>

        <section>
          <OutputHeading>Professional Experience</OutputHeading>
          {jobs.map((job, i) => (
            <div key={i} style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.05rem', fontWeight: 500, color: 'var(--sb-navy)' }}>
                  {job.company}
                </div>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--sb-teal-deep)' }}>
                  {job.dates}
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--sb-teal-deep)', marginBottom: '0.4rem' }}>
                {job.title}
              </div>
              <ul style={ulStyle}>
                {job.bullets.map((b, j) => (
                  <li key={j} style={liStyle}><span style={dotStyle}>·</span>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {timeline.educationLine && (
          <section style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', background: 'var(--sb-cream)', borderLeft: '3px solid var(--sb-gold)' }}>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>
              Education
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--sb-navy)' }}>{timeline.educationLine}</div>
          </section>
        )}
      </>
    </OutputFrame>
  );
}

function TechColumn({ label, items }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.4rem', paddingBottom: '0.3rem', borderBottom: '0.5px solid var(--sb-taupe)' }}>
        {label}
      </div>
      <ul style={ulStyle}>
        {items.map((t, i) => (
          <li key={i} style={{ ...liStyle, fontSize: '0.78rem', marginBottom: '0.25rem' }}>
            <span style={dotStyle}>·</span>{t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Case Study (one per slug) ──
const CASE_STUDY_SLUGS = {
  'healthcare-nasdaq-relisting': 1,
  'global-tech-usage-billing': 2,
  'global-manufacturing-q2r': 3,
};

export function CaseStudyOutput() {
  const { slug } = useParams();
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);
  useEffect(() => {
    api.getPublishedSite()
      .then((site) => {
        const cases = site.pages['consulting-founder']?.sections.find((s) => s.type === 'caseStudies')?.fields || {};
        setData(cases);
      })
      .catch(() => setData(null));
  }, []);

  if (loading || !data) return null;
  const i = CASE_STUDY_SLUGS[slug];
  if (!i) {
    return (
      <OutputFrame title="Case Study not found" eyebrow="Case Study">
        <p style={{ fontSize: '0.9rem', color: '#4a4a4a' }}>
          The requested case study doesn't exist.
        </p>
      </OutputFrame>
    );
  }
  const title = data[`case${i}Title`];
  const subtitle = data[`case${i}Subtitle`];
  const context = (data[`case${i}Context`] || '').split('\n').filter(Boolean);
  const role = data[`case${i}Role`] || '';
  const actions = (data[`case${i}Actions`] || '').split('\n').filter(Boolean);
  const impact = (data[`case${i}Impact`] || '').split('\n').filter(Boolean);
  const feedback = data[`case${i}Feedback`] || '';

  if (!user) {
    return (
      <OutputFrame title={title} eyebrow={subtitle || 'Case Study'} gated>
        <GatedPreview
          kind="case study"
          teaser={{ label: 'Context (preview)', items: undefined, bullets: context.slice(0, 1) }}
        />
      </OutputFrame>
    );
  }

  return (
    <OutputFrame title={title} eyebrow={subtitle || 'Case Study'}>
      <>
        <CaseSection label="Context" items={context} />
        <CaseSection label="Role" text={role} />
        <CaseSection label="Actions" items={actions} />
        <CaseSection label="Impact" items={impact} highlight />
        {feedback && (
          <section style={{ marginTop: '1.25rem', padding: '0.9rem 1.1rem', background: 'rgba(196,132,58,0.1)', borderLeft: '3px solid var(--sb-gold)', fontStyle: 'italic', fontSize: '0.92rem', color: '#3a3a3a' }}>
            “{feedback}”
          </section>
        )}
      </>
    </OutputFrame>
  );
}

function CaseSection({ label, items, text, highlight }) {
  if (!items?.length && !text) return null;
  return (
    <section style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
      <OutputHeading>{label}</OutputHeading>
      {text && <div style={{ fontSize: '0.88rem', color: 'var(--sb-navy)' }}>{text}</div>}
      {items?.length > 0 && (
        <ul style={ulStyle}>
          {items.map((it, j) => (
            <li key={j} style={{ ...liStyle, color: highlight ? 'var(--sb-navy)' : '#4a4a4a', fontWeight: highlight ? 500 : 400 }}>
              <span style={dotStyle}>·</span>{it}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Proposal ──
const PROPOSAL_TYPES = {
  'diagnostic-sprint': SERVICE_OFFERINGS[0],
  'embedded-operator': SERVICE_OFFERINGS[1],
  'advisory-retainer': SERVICE_OFFERINGS[2],
};

export function ProposalOutput() {
  const { type } = useParams();
  const { loading, user } = useAuthState();
  const data = PROPOSAL_TYPES[type];
  if (!data) {
    return (
      <OutputFrame title="Proposal not found" eyebrow="Proposal">
        <p style={{ fontSize: '0.9rem', color: '#4a4a4a' }}>
          Available: {Object.keys(PROPOSAL_TYPES).join(', ')}
        </p>
      </OutputFrame>
    );
  }
  if (loading) return null;
  if (!user) {
    return (
      <OutputFrame title={data.title} eyebrow={`Proposal · ${data.tag}`} gated>
        <GatedPreview
          kind="proposal"
          teaser={{
            label: 'Summary (preview)',
            paragraphs: [data.summary],
            bullets: data.activities.slice(0, 2),
          }}
        />
      </OutputFrame>
    );
  }
  return (
    <OutputFrame title={data.title} eyebrow={`Proposal · ${data.tag}`}>
      <>
        <p style={paraStyle}>{data.summary}</p>

        <section style={{ marginTop: '1.5rem', pageBreakInside: 'avoid' }}>
          <OutputHeading>Tactical Activities</OutputHeading>
          <ul style={ulStyle}>
            {data.activities.map((a, i) => <li key={i} style={liStyle}><span style={dotStyle}>·</span>{a}</li>)}
          </ul>
        </section>

        <section style={{ marginTop: '1.5rem', pageBreakInside: 'avoid' }}>
          <OutputHeading>Data + System Access Required</OutputHeading>
          <ul style={ulStyle}>
            {data.dataNeeds.map((d, i) => <li key={i} style={liStyle}><span style={dotStyle}>·</span>{d}</li>)}
          </ul>
        </section>

        <section style={{ marginTop: '1.5rem', pageBreakInside: 'avoid' }}>
          <OutputHeading>Meeting Cadence + Milestones</OutputHeading>
          <ul style={ulStyle}>
            {data.cadence.map((c, i) => <li key={i} style={liStyle}><span style={dotStyle}>·</span>{c}</li>)}
          </ul>
        </section>

        <section style={{ marginTop: '1.5rem', padding: '0.9rem 1.1rem', background: 'rgba(196,132,58,0.08)', borderLeft: '3px solid var(--sb-gold)' }}>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
            Coming soon — Interactive scoping
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--sb-navy)' }}>
            Drag-and-drop to reorder, add custom activities, and configure data/cadence to fit your situation. A custom proposal generates from your config and routes to me for review.
          </div>
        </section>

        <section style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--sb-teal-deep)' }}>
          Ready to start? <Link to="/#contact" style={{ color: 'var(--sb-gold)' }}>Get in touch</Link>.
        </section>
      </>
    </OutputFrame>
  );
}

// ── One-Pager: Services + Domains + Niche Solutions ──
export function OnePagerOutput() {
  const { loading, user } = useAuthState();
  if (loading) return null;
  if (!user) {
    return (
      <OutputFrame title="Salt Basin — One-Pager" eyebrow="Capabilities Summary" gated>
        <GatedPreview
          kind="one-pager"
          teaser={{
            label: 'What is included (preview)',
            paragraphs: ['A single-page summary of Salt Basin services, categorized domain expertise, and niche solution areas.'],
            bullets: SERVICE_OFFERINGS.map((s) => `${s.title} · ${s.tag}`),
          }}
        />
      </OutputFrame>
    );
  }
  return (
    <OutputFrame title="Salt Basin — One-Pager" eyebrow="Capabilities Summary">
      <>
        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>Services</OutputHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            {SERVICE_OFFERINGS.map((s) => (
              <div key={s.slug} style={{ pageBreakInside: 'avoid', background: '#FBF6F0', padding: '0.7rem 0.85rem', borderLeft: '3px solid var(--sb-gold)' }}>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>
                  {s.tag}
                </div>
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '0.95rem', color: 'var(--sb-navy)', fontWeight: 500, marginBottom: 4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--sb-teal-deep)' }}>
                  {s.summary}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>Domains of Expertise</OutputHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            {DOMAIN_CATEGORIES.map((cat) => (
              <div key={cat.title} style={{ pageBreakInside: 'avoid' }}>
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '0.95rem', color: 'var(--sb-navy)', fontWeight: 500, marginBottom: 4 }}>
                  {cat.icon} {cat.title}
                </div>
                <ul style={ulStyle}>
                  {cat.items.map((it, i) => (
                    <li key={i} style={{ ...liStyle, fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                      <span style={dotStyle}>·</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <OutputHeading>Niche Solutions</OutputHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            {NICHE_SOLUTIONS.map((n) => (
              <div key={n.label} style={{ pageBreakInside: 'avoid', background: 'var(--sb-navy)', color: 'var(--sb-cream)', padding: '0.7rem 0.85rem', borderLeft: '3px solid var(--sb-gold)' }}>
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '0.95rem', fontWeight: 500, marginBottom: 4 }}>
                  {n.icon} {n.label}
                </div>
                <ul style={ulStyle}>
                  {n.items.map((it, i) => (
                    <li key={i} style={{ ...liStyle, fontSize: '0.75rem', marginBottom: '0.18rem', color: 'var(--sb-sage)' }}>
                      <span style={{ ...dotStyle, color: 'var(--sb-gold)' }}>·</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </>
    </OutputFrame>
  );
}

// ── Shared styles ──
function OutputHeading({ children }) {
  return (
    <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>
      {children}
    </div>
  );
}
const paraStyle = { fontSize: '0.92rem', lineHeight: 1.6, color: '#3a3a3a', marginBottom: '0.55rem' };
const ulStyle = { listStyle: 'none', padding: 0, margin: 0 };
const liStyle = {
  fontSize: '0.85rem', lineHeight: 1.55, color: '#4a4a4a',
  paddingLeft: '1rem', position: 'relative', marginBottom: '0.35rem',
};
const dotStyle = { position: 'absolute', left: 0, color: 'var(--sb-gold)' };

// ──────────────────────────────────────────────────────────────────
// Build Summary — admin-facing one-pager that documents everything we built.
// Headline metrics (days, hours, $ Claude, monthly tier savings), feature
// inventory by capability, tech stack per capability, and the tier
// workarounds we used to stay on free products.
// ──────────────────────────────────────────────────────────────────
export function BuildSummaryOutput() {
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);
  const [err,  setErr]  = useState(null);

  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return;
    fetch('/api/backlog/summary', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [loading, user]);

  if (loading) return null;

  // Auth-gated to admin (not just member) — this is internal build documentation.
  if (!user || user.role !== 'admin') {
    return (
      <OutputFrame title="Build Summary" eyebrow="Internal · One-Pager" gated>
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <OutputHeading>Restricted</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            Build documentation is admin-only
          </h1>
          <p style={paraStyle}>
            This one-pager summarizes every requirement built into Salt Basin Net Works, the tech stack per capability, and the cost workarounds used to stay on free product tiers. It is intended for Betsy\'s personal records.
          </p>
          <Link to="/admin/login" className="sb-btn sb-btn-gold" style={{ marginTop: '1.5rem' }}>
            Sign in as admin →
          </Link>
        </div>
      </OutputFrame>
    );
  }

  if (err) {
    return (
      <OutputFrame title="Build Summary" eyebrow="Internal · One-Pager">
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem' }}>
          <p style={{ color: 'var(--sb-risk-critical)' }}>Failed to load summary: {err}</p>
        </div>
      </OutputFrame>
    );
  }
  if (!data) {
    return (
      <OutputFrame title="Build Summary" eyebrow="Internal · One-Pager">
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--sb-teal-deep)' }}>Loading build summary…</div>
      </OutputFrame>
    );
  }

  const { totals, capabilities, workarounds, items } = data;
  const dollars = (n) => `$${(Math.round((n || 0) * 100) / 100).toFixed(2)}`;
  const annualSavings = (totals.monthlyTierSavings || 0) * 12;
  // Capabilities sorted by first deploy for the timeline
  const timelineCaps = [...capabilities]
    .filter((c) => c.deliveredCount > 0 && c.firstDeployedAt)
    .sort((a, b) => (a.firstDeployedAt || 0) - (b.firstDeployedAt || 0));

  return (
    <OutputFrame title="Salt Basin · Build Progress Report" eyebrow="Internal · To-Date Build">
      <div className="sb-output-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 4rem' }}>

        {/* ── Headline metrics ── */}
        <section style={{ marginBottom: '2rem' }}>
          <OutputHeading>The Build at a Glance</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.4rem', lineHeight: 1.1 }}>
            Salt Basin Net Works · Build to Date
          </h1>
          <p style={{ ...paraStyle, marginBottom: '1.25rem' }}>
            A snapshot of every product feature shipped on saltbasin.net, generated from the live admin backlog. Includes the platform itself, the multi-tenant CMS for member operators, lead capture, email infrastructure, public-site content, and the supporting deployment + observability layers.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
              marginTop: '1rem',
            }}
          >
            <SumChip label="Calendar days" value={totals.elapsedDays} />
            <SumChip label="Requirements delivered" value={`${totals.requirementsDelivered} / ${totals.requirementsTotal}`} />
            <SumChip label="Total hours" value={totals.hoursTotal} />
            <SumChip label="Claude hours" value={totals.hoursClaude} accent />
            <SumChip label="Betsy hours" value={totals.hoursBetsy} accent />
            <SumChip label="Activities (C + B)" value={`${totals.activitiesClaude || 0} + ${totals.activitiesBetsy || 0}`} />
            <SumChip label="Claude Code spend" value={dollars(totals.costUsdClaude)} accent />
            <SumChip label="Avoided tier cost / yr" value={dollars(annualSavings)} accent />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep)', marginTop: '0.75rem', fontStyle: 'italic' }}>
            Methodology: hours by person are explicit per requirement (editable from the Backlog drawer). Claude spend is calculated at $0.02/Claude-minute of focused work — calibration documented in code. Tier savings are listed costs of the paid alternatives that were sidestepped.
          </p>
        </section>

        {/* ── Pre-AI cost comparison ── */}
        <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
          <OutputHeading>What This Would Have Cost Pre-AI</OutputHeading>
          <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
            AI vs traditional dev team comparison
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <SumChip label="Actual AI-augmented cost" value={dollars(totals.costUsdClaude)} accent />
            <SumChip label="Estimated traditional cost" value={dollars(totals.traditionalCostUsd)} />
            <SumChip label="Savings vs traditional" value={dollars(totals.aiSavingsUsd)} accent />
            <SumChip label="Cost multiplier avoided" value={totals.aiSavingsMultiple ? `${totals.aiSavingsMultiple}x` : '—'} />
          </div>
          <p style={{ ...paraStyle, fontSize: '0.85rem' }}>
            Estimate methodology: a traditional senior-dev team delivering the same scope would need approximately <strong>2.5× the effort hours</strong> (accounting for slower context-switching, more debugging cycles, design review, PM overhead, and code review), at a <strong>$150/hour blended rate</strong> (US senior full-stack). Applied to the total hours captured per requirement.
          </p>
        </section>

        {/* ── Delivery timeline by capability ── */}
        {timelineCaps.length > 0 && (
          <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
            <OutputHeading>Delivery Timeline</OutputHeading>
            <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '1rem' }}>
              Capabilities in the order they shipped
            </h2>
            <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '1.5px solid var(--sb-cream)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {timelineCaps.map((c) => (
                <div key={c.group.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute', left: '-2.45rem', top: 6,
                      width: 10, height: 10, borderRadius: '50%',
                      background: c.group.color || 'var(--sb-gold)',
                      border: '2px solid white',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div className="sb-display" style={{ fontSize: '1rem', color: 'var(--sb-navy)' }}>
                        {c.group.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sb-teal-deep)' }}>
                        {c.deliveredCount} requirement{c.deliveredCount === 1 ? '' : 's'} ·{' '}
                        {c.hoursTotal}h ({c.hoursClaude}h Claude + {c.hoursBetsy}h Betsy) ·{' '}
                        ${c.costUsdClaude.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
                      first shipped {formatShortDate(c.firstDeployedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Capability rollup ── */}
        <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
          <OutputHeading>Capabilities — Inventory + Tech Stack + Cost</OutputHeading>
          <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '1rem' }}>
            What was built, in what stack, at what cost
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
            {capabilities.map((cap) => (
              <CapabilityRow key={cap.group.id} cap={cap} items={items.filter((it) => it.capabilityId === cap.group.id)} />
            ))}
          </div>
        </section>

        {/* ── Tier workarounds ── */}
        <section style={{ borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem', marginBottom: '2rem' }}>
          <OutputHeading>Tier Workarounds — How We Stayed Free</OutputHeading>
          <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
            ${(totals.monthlyTierSavings || 0).toLocaleString()}/mo of avoided product upgrades
          </h2>
          <p style={{ ...paraStyle, marginBottom: '1.25rem' }}>
            Each entry below documents a moment where the default path required a paid tier, and the workaround that kept the build on free products without sacrificing the user experience.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
            {workarounds.map((w) => (
              <div
                key={w.id}
                style={{
                  border: '0.5px solid var(--sb-taupe)',
                  borderLeft: '3px solid var(--sb-gold)',
                  borderRadius: 'var(--sb-radius)',
                  padding: '1rem 1.15rem',
                  background: 'rgba(196,132,58,0.04)',
                  breakInside: 'avoid',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div className="sb-display" style={{ fontSize: '1.05rem', color: 'var(--sb-navy)' }}>
                    {w.product}
                  </div>
                  {w.monthlySavings != null && (
                    <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
                      saved {dollars(w.monthlySavings)}/mo
                    </div>
                  )}
                </div>
                {w.tierAvoided && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic', marginBottom: '0.6rem' }}>
                    Avoided: {w.tierAvoided}
                  </div>
                )}
                <div style={{ marginBottom: '0.4rem' }}>
                  <strong style={{ color: 'var(--sb-navy)', fontSize: '0.85rem' }}>Problem.</strong>{' '}
                  <span style={{ fontSize: '0.85rem', color: '#4a4a4a', lineHeight: 1.55 }}>{w.problem}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--sb-navy)', fontSize: '0.85rem' }}>Workaround.</strong>{' '}
                  <span style={{ fontSize: '0.85rem', color: '#4a4a4a', lineHeight: 1.55 }}>{w.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <section style={{ borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--sb-teal-deep)' }}>
          Generated from the live admin Backlog at saltbasin.net/admin · Updated continuously as requirements are edited.
        </section>
      </div>
    </OutputFrame>
  );
}

function SumChip({ label, value, accent }) {
  return (
    <div
      style={{
        padding: '0.7rem 0.9rem',
        background: accent ? 'rgba(168,184,154,0.12)' : 'rgba(196,132,58,0.06)',
        border: accent ? '0.5px solid rgba(168,184,154,0.4)' : '0.5px solid rgba(196,132,58,0.3)',
        borderRadius: 'var(--sb-radius)',
        breakInside: 'avoid',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: accent ? '#5a7d3a' : 'var(--sb-gold)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="sb-display" style={{ fontSize: '1.3rem', color: 'var(--sb-navy)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function formatShortDate(ts) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ──────────────────────────────────────────────────────────────────
// Tech Stack Architecture — layered architecture diagram + full inventory.
// Admin-only.
// ──────────────────────────────────────────────────────────────────
export function TechStackOutput() {
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return;
    fetch('/api/backlog/summary', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [loading, user]);

  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return (
      <OutputFrame title="Tech Stack" eyebrow="Internal · Architecture" gated>
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <OutputHeading>Restricted</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            Tech stack documentation is admin-only
          </h1>
          <Link to="/admin/login" className="sb-btn sb-btn-gold" style={{ marginTop: '1.5rem' }}>Sign in →</Link>
        </div>
      </OutputFrame>
    );
  }
  if (err) return <OutputFrame title="Tech Stack" eyebrow="Architecture"><p style={{ color: 'var(--sb-risk-critical)', padding: '2rem' }}>{err}</p></OutputFrame>;
  if (!data) return <OutputFrame title="Tech Stack" eyebrow="Architecture"><p style={{ padding: '2rem' }}>Loading…</p></OutputFrame>;

  const { capabilities, totals } = data;
  // Architecture layers: Presentation / Application / Data / External
  const LAYERS = [
    {
      title: 'Presentation Layer',
      eyebrow: 'What the visitor sees',
      color: 'var(--sb-gold)',
      tech: ['React 19', 'Vite', 'React Router', 'CSS variables', 'Cormorant Garamond + Inter', 'SVG (custom industry wheel)', 'CSS @media print', 'CSS scroll-snap'],
      note: 'Single React bundle served by Netlify CDN. Admin, member admin, public profile, lead view, and print-friendly outputs are all the same SPA with different routes.',
    },
    {
      title: 'Application / Domain Layer',
      eyebrow: 'Server-side business logic',
      color: 'var(--sb-sage)',
      tech: ['Express 4', 'Node 22', 'bcryptjs (password hashing)', 'cookie-parser', 'multer (uploads)', 'cors', 'middleware: requireAdmin / requireUser / requireLeadAccess', 'libsodium-wrappers (GitHub secret encryption)'],
      note: 'Stateless Express app on Render. All routes under /api/*. Three auth scopes (admin / member / lead) layered as middleware.',
    },
    {
      title: 'Data Layer',
      eyebrow: 'Persistence',
      color: 'var(--sb-teal-deep)',
      tech: ['Supabase Postgres 15', 'postgres (npm pkg, async pool)', 'Supabase Storage (uploaded images)', 'JSON-in-TEXT for flexible state (config, sites)', 'idempotent ALTER TABLE migrations on boot'],
      note: '13 tables: users, sessions, site_state, config_state, leads, lead_emails, lead_activity, lead_sessions, member_profiles, member_sites, member_configs, capability_groups, backlog_items, tier_workarounds. Migrations are idempotent and applied on every boot.',
    },
    {
      title: 'External Services',
      eyebrow: 'Third-party integrations',
      color: 'var(--sb-navy)',
      tech: ['Brevo (transactional email)', 'Zoho Mail (inbound)', 'Wix DNS (DNS authority)', 'Anthropic API (BYO key, member-side)', 'GitHub (source of truth + Actions CI)', 'Render API (deploy automation)', 'Netlify API (deploy automation)', 'UptimeRobot (cold-start pinger)'],
      note: 'Pure HTTPS, no SDKs except Anthropic. Every external call has a fallback (console stub for email, in-memory for cache).',
    },
    {
      title: 'Infrastructure',
      eyebrow: 'Deployment + observability',
      color: 'var(--sb-taupe)',
      tech: ['Render (Express backend host)', 'Netlify (static + CDN + proxy)', 'Supabase (managed Postgres)', 'GitHub Actions (CI + deploy verify + secret rotation)', 'Wix (registrar + DNS)', 'UptimeRobot (free uptime pings)'],
      note: 'Six free-tier products composed to deliver a production website with zero monthly fixed cost. Netlify proxies /api/* to Render via netlify.toml.',
    },
  ];

  return (
    <OutputFrame title="Salt Basin · Tech Stack Architecture" eyebrow="Internal · Architecture">
      <div className="sb-output-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <OutputHeading>System Overview</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.2rem', color: 'var(--sb-navy)', marginBottom: '0.4rem', lineHeight: 1.1 }}>
            Tech Stack Architecture
          </h1>
          <p style={paraStyle}>
            saltbasin.net is delivered by five composable layers — presentation, application, data, external services, and infrastructure. The total stack costs <strong>$0/month</strong> at current volume (free tiers across the board). The diagram below shows the layered architecture; the inventory tables document the specific tools at each layer.
          </p>
        </section>

        {/* ── Architecture diagram (CSS-only) ── */}
        <section style={{ marginBottom: '2rem' }}>
          <OutputHeading>Layered Architecture</OutputHeading>
          <div style={{ display: 'grid', gap: 4, marginTop: '0.5rem' }}>
            {LAYERS.map((L) => (
              <div
                key={L.title}
                style={{
                  border: `0.5px solid ${L.color}`,
                  borderLeft: `4px solid ${L.color}`,
                  borderRadius: 'var(--sb-radius)',
                  padding: '0.9rem 1.1rem',
                  background: 'rgba(245,240,232,0.5)',
                  breakInside: 'avoid',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: L.color }}>
                      {L.eyebrow}
                    </div>
                    <div className="sb-display" style={{ fontSize: '1.1rem', color: 'var(--sb-navy)', marginTop: 2 }}>
                      {L.title}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.55rem', marginBottom: '0.55rem' }}>
                  {L.tech.map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: 'var(--sb-font-label)',
                        fontSize: '0.62rem', letterSpacing: '0.05em',
                        padding: '2px 8px',
                        background: 'white',
                        border: `0.5px solid ${L.color}`,
                        borderRadius: 10,
                        color: 'var(--sb-navy)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#5a5a5a', lineHeight: 1.5, margin: 0 }}>{L.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech by capability ── */}
        <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
          <OutputHeading>Tech by Capability</OutputHeading>
          <h2 className="sb-display" style={{ fontSize: '1.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            What each capability is built from
          </h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {capabilities.map((c) => (
              <div
                key={c.group.id}
                style={{
                  border: '0.5px solid var(--sb-taupe)',
                  borderLeft: `3px solid ${c.group.color || 'var(--sb-gold)'}`,
                  borderRadius: 'var(--sb-radius)',
                  padding: '0.85rem 1rem',
                  breakInside: 'avoid',
                }}
              >
                <div className="sb-display" style={{ fontSize: '1rem', color: 'var(--sb-navy)', marginBottom: 4 }}>
                  {c.group.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {(c.group.techStack || []).map((t, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: 'var(--sb-font-label)',
                        fontSize: '0.6rem',
                        padding: '2px 7px',
                        background: 'rgba(196,132,58,0.08)',
                        border: '0.5px solid rgba(196,132,58,0.3)',
                        borderRadius: 9,
                        color: 'var(--sb-navy)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--sb-teal-deep)' }}>
          Generated live from the admin Backlog · {totals.requirementsDelivered} delivered requirements
        </section>
      </div>
    </OutputFrame>
  );
}

// ──────────────────────────────────────────────────────────────────
// Marketing Product One-Pager — Salt Basin Net Works the product.
// Public-facing, member-gated (members + admin see it).
// ──────────────────────────────────────────────────────────────────
export function ProductOnePagerOutput() {
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (loading) return;
    fetch('/api/backlog/summary', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {});
  }, [loading]);

  if (loading) return null;
  if (!user) {
    return (
      <OutputFrame title="Salt Basin Net Works" eyebrow="Product · One-Pager" gated>
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <OutputHeading>Sign in to view</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            The product one-pager is gated to members.
          </h1>
          <Link to="/signup" className="sb-btn sb-btn-gold" style={{ marginRight: '0.5rem' }}>Become a member</Link>
          <Link to="/admin/login" className="sb-btn sb-btn-outline-dark">Sign in</Link>
        </div>
      </OutputFrame>
    );
  }

  return (
    <OutputFrame title="Salt Basin Net Works" eyebrow="Product · One-Pager">
      <div className="sb-output-page" style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.75rem' }}>
            ✦ Operator Network · Strategic Operator Brand ✦
          </p>
          <h1 className="sb-display" style={{ fontSize: '3.25rem', color: 'var(--sb-navy)', lineHeight: 1.05, marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
            Salt Basin Net Works
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--sb-teal-deep)', maxWidth: 680, margin: '0 auto', lineHeight: 1.65 }}>
            A curated network of senior lead-to-cash, RevOps, and finance-systems operators — and the platform that connects them to PE-backed and high-growth companies that need proven talent, not bench resumes.
          </p>
          <div className="sb-gold-rule" style={{ margin: '1.5rem auto 0' }} />
        </section>

        {/* Three pillars */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[
              {
                eyebrow: 'For Operators',
                title: 'Your profile, your network',
                body: 'Members get a full multi-page profile site (yourname.saltbasin.net or /u/yourname) with their own admin, brand colors, draft/publish workflow, and a place in the curated Net Works banner on the Salt Basin home page.',
                cta: 'Build your profile →',
                color: 'var(--sb-gold)',
              },
              {
                eyebrow: 'For Companies',
                title: 'Proven senior operators',
                body: 'Skip recruiter overhead and junior bench resumes. Reach out and we will help shape the engagement — diagnostic sprint, embedded operator, or advisory retainer.',
                cta: 'Start a conversation →',
                color: 'var(--sb-sage)',
              },
              {
                eyebrow: 'For the Founder',
                title: 'Founder-first portfolio',
                body: 'Salt Basin is also Betsy Salter\'s living portfolio — every case study, proposal, and reference path is reachable here. The platform doubles as her front door.',
                cta: 'Meet Betsy →',
                color: 'var(--sb-teal-deep)',
              },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(245,240,232,0.5)',
                  border: '0.5px solid var(--sb-taupe)',
                  borderTop: `3px solid ${p.color}`,
                  borderRadius: 'var(--sb-radius)',
                  padding: '1.25rem',
                  breakInside: 'avoid',
                }}
              >
                <p style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: p.color, marginBottom: '0.5rem' }}>
                  {p.eyebrow}
                </p>
                <h3 className="sb-display" style={{ fontSize: '1.2rem', color: 'var(--sb-navy)', marginBottom: '0.55rem', lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#4a4a4a', marginBottom: '0.75rem' }}>
                  {p.body}
                </p>
                <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: p.color }}>
                  {p.cta}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Feature inventory by capability */}
        {data && (
          <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.5rem' }}>
            <OutputHeading>Platform Capabilities</OutputHeading>
            <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '1rem' }}>
              {data.totals.requirementsDelivered} features shipped across {data.capabilities.filter((c) => c.deliveredCount > 0).length} capability areas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {data.capabilities
                .filter((c) => c.deliveredCount > 0 && c.group.slug !== 'requirements-mgmt')
                .map((c) => (
                  <div
                    key={c.group.id}
                    style={{
                      padding: '0.75rem 0.95rem',
                      border: '0.5px solid var(--sb-taupe)',
                      borderLeft: `3px solid ${c.group.color || 'var(--sb-gold)'}`,
                      borderRadius: 'var(--sb-radius)',
                      breakInside: 'avoid',
                    }}
                  >
                    <div className="sb-display" style={{ fontSize: '0.95rem', color: 'var(--sb-navy)', marginBottom: 4 }}>
                      {c.group.name}
                    </div>
                    {c.group.description && (
                      <p style={{ fontSize: '0.75rem', color: '#5a5a5a', lineHeight: 1.5, margin: 0 }}>
                        {c.group.description}
                      </p>
                    )}
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginTop: 6 }}>
                      {c.deliveredCount} feature{c.deliveredCount === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ textAlign: 'center', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.5rem' }}>
          <p style={{ ...paraStyle, marginBottom: '0.75rem' }}>
            Salt Basin Net Works is in early access. Join the network, hire from it, or reach out.
          </p>
          <Link to="/" className="sb-btn sb-btn-gold" style={{ marginRight: '0.5rem' }}>Visit saltbasin.net</Link>
          <Link to="/#contact" className="sb-btn sb-btn-outline-dark">Get in touch</Link>
        </section>
      </div>
    </OutputFrame>
  );
}

function CapabilityRow({ cap, items }) {
  const featureCount = cap.deliveredCount;
  const tech = cap.group.techStack || [];
  return (
    <div
      style={{
        border: '0.5px solid var(--sb-taupe)',
        borderLeft: `3px solid ${cap.group.color || 'var(--sb-gold)'}`,
        borderRadius: 'var(--sb-radius)',
        padding: '1rem 1.15rem',
        background: 'white',
        breakInside: 'avoid',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div className="sb-display" style={{ fontSize: '1.05rem', color: 'var(--sb-navy)' }}>
          {cap.group.name}
        </div>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--sb-teal-deep)' }}>
          {featureCount} feature{featureCount === 1 ? '' : 's'} · {cap.hours}h · ${cap.costUsdClaude.toFixed(2)}
        </div>
      </div>
      {cap.group.description && (
        <p style={{ fontSize: '0.78rem', color: '#5a5a5a', lineHeight: 1.55, marginBottom: '0.6rem' }}>
          {cap.group.description}
        </p>
      )}

      {/* Tech stack chips */}
      {tech.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
          {tech.map((t, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--sb-font-label)',
                fontSize: '0.62rem', letterSpacing: '0.05em',
                padding: '2px 8px',
                background: 'rgba(196,132,58,0.08)',
                border: '0.5px solid rgba(196,132,58,0.3)',
                borderRadius: 10,
                color: 'var(--sb-navy)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Feature inventory */}
      <details>
        <summary style={{ fontSize: '0.7rem', cursor: 'pointer', color: 'var(--sb-gold)', letterSpacing: '0.06em' }}>
          {items.length} requirement{items.length === 1 ? '' : 's'} (click to expand)
        </summary>
        <ul style={{ ...ulStyle, marginTop: '0.5rem' }}>
          {items.map((it) => (
            <li key={it.id} style={{ ...liStyle, fontSize: '0.78rem' }}>
              <span style={dotStyle}>·</span>
              <span style={{ color: 'var(--sb-navy)', fontWeight: 500 }}>{it.title}</span>
              {it.summary && (
                <span style={{ color: '#5a5a5a' }}> — {it.summary}</span>
              )}
              {it.status !== 'deployed' && (
                <span style={{ marginLeft: 4, fontSize: '0.62rem', color: 'var(--sb-teal-deep)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  · {it.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
