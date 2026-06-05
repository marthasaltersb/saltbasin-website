// Print-friendly "output" pages: Resume, Case Study, Proposal.
//
// Each is meant to be viewed on-screen first then printed (or saved as PDF
// via the browser's "Save as PDF"). Print CSS hides nav/footer and switches
// to a paper-friendly layout.
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import BackLink from './BackLink.jsx';

// ── Reusable frame: navbar with Print/Back buttons + print CSS that hides them ──
function OutputFrame({ title, eyebrow, children }) {
  return (
    <div style={{ background: 'white', color: 'var(--sb-navy)', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .sb-output-toolbar, footer { display: none !important; }
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
          <button
            onClick={() => window.print()}
            className="sb-btn sb-btn-gold"
            style={{ padding: '0.45rem 1rem', fontSize: '0.7rem' }}
          >
            ⌘ Print / Save as PDF
          </button>
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
          Salt Basin Net Works · saltbasin.net · betsysalter@saltbasin.net
        </footer>
      </article>
    </div>
  );
}

// ── Resume ──
export function ResumeOutput() {
  const [page, setPage] = useState(null);
  useEffect(() => {
    api.getPublishedSite()
      .then((site) => setPage(site.pages['consulting-founder']))
      .catch(() => setPage(null));
  }, []);

  if (!page) return null;
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

  return (
    <OutputFrame title={about.heading || 'Betsy Salter'} eyebrow="Resume">
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>
          Profile
        </div>
        {[about.p1, about.p2, about.p3].filter(Boolean).map((p, i) => (
          <p key={i} style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#3a3a3a', marginBottom: '0.55rem' }}>{p}</p>
        ))}
        {about.howIWork && (
          <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#3a3a3a', marginBottom: '0.55rem', fontStyle: 'italic' }}>
            <strong style={{ color: 'var(--sb-navy)' }}>How I work:</strong> {about.howIWork}
          </p>
        )}
      </section>

      <section>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>
          Professional Experience
        </div>
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {job.bullets.map((b, j) => (
                <li
                  key={j}
                  style={{
                    fontSize: '0.85rem', lineHeight: 1.55, color: '#4a4a4a',
                    paddingLeft: '1rem', position: 'relative', marginBottom: '0.35rem',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>·</span>
                  {b}
                </li>
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
    </OutputFrame>
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
  const [data, setData] = useState(null);
  useEffect(() => {
    api.getPublishedSite()
      .then((site) => {
        const cases = site.pages['consulting-founder']?.sections.find((s) => s.type === 'caseStudies')?.fields || {};
        setData(cases);
      })
      .catch(() => setData(null));
  }, []);

  if (!data) return null;
  const i = CASE_STUDY_SLUGS[slug];
  if (!i) {
    return (
      <OutputFrame title="Case Study not found" eyebrow="Case Study">
        <p style={{ fontSize: '0.9rem', color: '#4a4a4a' }}>
          The requested case study doesn't exist. Available: {Object.keys(CASE_STUDY_SLUGS).join(', ')}
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

  return (
    <OutputFrame title={title} eyebrow={subtitle || 'Case Study'}>
      <CaseSection label="Context" items={context} />
      <CaseSection label="Role" text={role} />
      <CaseSection label="Actions" items={actions} />
      <CaseSection label="Impact" items={impact} highlight />
      {feedback && (
        <section style={{ marginTop: '1.25rem', padding: '0.9rem 1.1rem', background: 'rgba(196,132,58,0.1)', borderLeft: '3px solid var(--sb-gold)', fontStyle: 'italic', fontSize: '0.92rem', color: '#3a3a3a' }}>
          “{feedback}”
        </section>
      )}
    </OutputFrame>
  );
}

function CaseSection({ label, items, text, highlight }) {
  if (!items?.length && !text) return null;
  return (
    <section style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.45rem' }}>
        {label}
      </div>
      {text && <div style={{ fontSize: '0.88rem', color: 'var(--sb-navy)' }}>{text}</div>}
      {items?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it, j) => (
            <li
              key={j}
              style={{
                fontSize: '0.85rem', lineHeight: 1.55,
                color: highlight ? 'var(--sb-navy)' : '#4a4a4a',
                paddingLeft: '1rem', position: 'relative', marginBottom: '0.3rem',
                fontWeight: highlight ? 500 : 400,
              }}
            >
              <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>·</span>
              {it}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Proposal (placeholder template — real content via admin config later) ──
const PROPOSAL_TYPES = {
  'diagnostic-sprint': {
    title: 'Diagnostic Sprint',
    tag: '10-day fixed fee',
    bodyParas: [
      'A focused, time-boxed engagement to map your Quote-to-Revenue, RevOps, or CPQ readiness. By day 10 you have a board-ready risk map, a prioritized roadmap, and clarity on the wedge that buys back the most operational velocity.',
      'Best when a problem is suspected but not yet scoped. Best when you need an objective second look before committing to a multi-quarter program.',
    ],
    sections: [
      { h: 'Discovery (Days 1–3)', bullets: ['Stakeholder interviews across sales, finance, and operations.', 'Systems audit: CRM, CPQ, billing, ledger.', 'Data sample pulls + reconciliation spot-checks.'] },
      { h: 'Analysis (Days 4–7)', bullets: ['Risk scoring across 8 critical Q2R control points.', 'Gap analysis against fast-growth benchmarks.', 'Quantification of revenue leakage / deal-desk drag.'] },
      { h: 'Deliverable (Days 8–10)', bullets: ['Board-ready readout deck + 1-page exec summary.', 'Prioritized 90-day roadmap with named owners.', 'Live workshop to align leadership on what is next.'] },
    ],
    investment: 'Fixed fee — contact for current rate. No long-term commitment. If we are not the right partner after Day 3, you pay only for time delivered.',
  },
  'embedded-operator': {
    title: 'Embedded Operator',
    tag: '3–6 month engagement',
    bodyParas: [
      'Fractional senior leader inside your organization — hands-on through design, vendor selection, and delivery. I become an extension of your leadership team during the work, not a deck-and-leave consultant.',
      'Best when the problem is real, the path forward is somewhat clear, and execution capacity is what is missing.',
    ],
    sections: [
      { h: 'Engagement shape', bullets: ['3–6 month commitment, renewable.', '4 days/week embedded with the team.', 'Direct C-suite reporting line + weekly cadence.'] },
      { h: 'What I bring', bullets: ['Decade of Q2R / RevOps / finance systems experience.', 'AI-assisted leverage on outputs (decks, models, workflows).', 'Operator-grade discretion on team and culture decisions.'] },
      { h: 'What you provide', bullets: ['Clear sponsor + decision rights.', 'Access to the systems and the people doing the work.', 'Willingness to make hard calls when the data demands it.'] },
    ],
    investment: 'Monthly retainer — contact for current rate. Scope adjustments are documented and renegotiated openly, not via change orders that surprise you on month three.',
  },
  'advisory-retainer': {
    title: 'Advisory Retainer',
    tag: 'Monthly',
    bodyParas: [
      'An executive-level strategic partner on standing call. Quarterly planning, deal-stage triage, board prep, talent sounding, and the late-night gut-check on the decision you cannot delegate to your team.',
      'Best for founders and CFOs who want a seasoned operator in their corner without taking on a full hire.',
    ],
    sections: [
      { h: 'Cadence', bullets: ['Monthly 90-minute working session.', 'Bi-weekly 30-minute office hours.', 'Async via shared workspace — same-day for urgent.'] },
      { h: 'Scope', bullets: ['Quarterly planning + board pack review.', 'Deal-stage triage and pricing strategy.', 'Strategic talent sounding (hire / promote / let go).'] },
      { h: 'Boundaries', bullets: ['Not a fractional CFO or COO replacement.', 'Not a recruiter — but I will help you scope the role.', 'Not 24/7 — but always within one business day.'] },
    ],
    investment: 'Monthly retainer — contact for current rate. Month-to-month, cancel with 30 days notice. No annual commitment.',
  },
};

export function ProposalOutput() {
  const { type } = useParams();
  const data = PROPOSAL_TYPES[type];
  if (!data) {
    return (
      <OutputFrame title="Proposal not found" eyebrow="Proposal">
        <p style={{ fontSize: '0.9rem', color: '#4a4a4a' }}>
          Available proposals: {Object.keys(PROPOSAL_TYPES).join(', ')}
        </p>
      </OutputFrame>
    );
  }
  return (
    <OutputFrame title={data.title} eyebrow={`Proposal · ${data.tag}`}>
      {data.bodyParas.map((p, i) => (
        <p key={i} style={{ fontSize: '0.92rem', lineHeight: 1.7, color: '#3a3a3a', marginBottom: '0.85rem' }}>
          {p}
        </p>
      ))}
      {data.sections.map((s, i) => (
        <section key={i} style={{ marginTop: '1.5rem', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.1rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
            {s.h}
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {s.bullets.map((b, j) => (
              <li
                key={j}
                style={{
                  fontSize: '0.88rem', lineHeight: 1.6, color: '#4a4a4a',
                  paddingLeft: '1rem', position: 'relative', marginBottom: '0.3rem',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--sb-gold)' }}>·</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section style={{ marginTop: '1.5rem', padding: '0.9rem 1.1rem', background: 'var(--sb-navy)', color: 'var(--sb-cream)', borderLeft: '3px solid var(--sb-gold)' }}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
          Investment
        </div>
        <div style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{data.investment}</div>
      </section>
      <section style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--sb-teal-deep)' }}>
        Ready to start? <Link to="/#contact" style={{ color: 'var(--sb-gold)' }}>Get in touch</Link>.
      </section>
    </OutputFrame>
  );
}
