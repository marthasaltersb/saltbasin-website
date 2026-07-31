// Print-friendly "output" pages: Resume, Case Study, Proposal, One-Pager.
//
// Auth gate: visitors who aren't logged in see a teaser (top portion + fade
// overlay + signup CTA). Members and admin see the full output.
//
// Each output is meant to be viewed on screen first, then printed or saved
// as PDF via the browser's "Save as PDF". Print CSS hides nav/footer.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import { api } from '../lib/api.js';
import BackLink from './BackLink.jsx';
import PortfolioRequestPrompt from './PortfolioRequestFlow.jsx';
import { renderBlockToHtml, buildStatBlocksFromLayerConfig, buildInfographicBlocksFromLayerConfig, renderMemberFooterHtml } from '../lib/outputBlocks.js';
import { fetchCareerMaster, tierFillPct, toolWheelBucket } from '../lib/careerMaster.js';
import { RenderSection } from './blocks/index.jsx';

// The Home page's "about" content is split across two sections — the founder
// card (name/photo/howIWork, in the aboutIntro section) and the executive
// dashboard (narrative + highlights, in the execDashboard section). Output
// pages (resume, domains) want a single flat object, so merge them here.
function getHomeAboutFields(page) {
  const exec = page?.sections.find((s) => s.type === 'execDashboard')?.fields || {};
  const founder = page?.sections.find((s) => s.type === 'aboutIntro')?.fields || {};
  return {
    heading: exec.heading || founder.founderName,
    name: founder.founderName || exec.heading,
    title: founder.founderTitle,
    photoUrl: founder.photoUrl,
    p1: exec.p1,
    p2: exec.p2,
    p3: exec.p3,
    howIWork: founder.howIWork,
  };
}

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

// ── LOCKED authorship block ────────────────────────────────────────────────
// These credits are intentionally hardcoded constants (frozen, no props, no
// config/CMS/template path can override them) so no admin UI, output
// template, or member setting can alter or remove the copyright tags.
// Changing them requires editing this source file directly.
const AUTHORSHIP = Object.freeze({
  authorLine: 'Authored by Betsy Salter · Co-Authored with Claude (Anthropic AI)',
  copyright: () => `© ${new Date().getFullYear()} Salt Basin Holdings. All Rights Reserved. This output was generated from saltbasin.net and leverages AI LLM API to render the output formatting.`,
  contact: 'saltbasin.net · betsysalter@saltbasin.net',
  chips: Object.freeze([
    '© Betsy Salter — Author',
    'Claude (Anthropic) — Secondary Author',
    'Image Inspiration — NotebookLM',
    'Design System — Co-Authored with ChatGPT',
  ]),
});

// Real DOM text (not CSS-generated content) so it's never stripped by print
// CSS, text-extraction, or an ATS parsing a saved resume PDF. Appears once,
// at the end of the document — browsers don't reliably support true
// per-page running footers (@page margin boxes) via window.print(), so a
// single end-of-document credit is the durable option here. Takes no props
// by design — see the AUTHORSHIP lock note above.
function OutputAuthorshipFooter() {
  return (
    <footer style={{ marginTop: '3rem', paddingTop: '1.25rem', borderTop: '0.5px solid var(--sb-taupe)', fontSize: '0.72rem', color: 'var(--sb-teal-deep)', lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700, color: 'var(--sb-navy)' }}>{AUTHORSHIP.authorLine}</div>
      <div>{AUTHORSHIP.copyright()}</div>
      <div>{AUTHORSHIP.contact}</div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
        {AUTHORSHIP.chips.map((chip) => (
          <span key={chip} style={{
            fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sb-font-label)',
            padding: '0.2rem 0.6rem', borderRadius: 12, border: '0.5px solid var(--sb-gold)', color: 'var(--sb-navy)',
            background: 'rgba(196,132,58,0.08)', whiteSpace: 'nowrap',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </footer>
  );
}

// Robust cross-platform print (Windows / macOS / ChromeOS Chrome et al.):
//  1. Optionally sets document.title first — Chrome/Edge/Safari use it as
//     the default "Save as PDF" filename — and restores it after printing.
//  2. Waits for fonts and any still-loading images before opening the
//     dialog, so the preview never renders half-loaded (the "have to
//     refresh the PDF a few times" symptom).
//  3. window.focus() first and a try/catch fallback: if the environment
//     blocks its print preview ("print preview not supported"), we retry
//     once on the next tick, then leave the user a clear Ctrl/Cmd+P path.
async function safePrint(docTitle) {
  const prevTitle = document.title;
  if (docTitle) document.title = docTitle;
  const restore = () => { document.title = prevTitle; };
  window.addEventListener('afterprint', restore, { once: true });
  try {
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* fonts API unavailable */ } }
    const pending = Array.from(document.images).filter((img) => !img.complete);
    if (pending.length) {
      await Promise.race([
        Promise.all(pending.map((img) => new Promise((r) => { img.onload = r; img.onerror = r; }))),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    window.focus();
    window.print();
  } catch {
    // Some embedded browsers refuse window.print() — retry once, then
    // fall back to instructing the native shortcut (title stays set so
    // the filename is still right when they hit Ctrl/Cmd+P).
    setTimeout(() => {
      try { window.print(); } catch {
        window.removeEventListener('afterprint', restore);
        alert('This browser blocked the print dialog. Press Ctrl+P (Windows/ChromeOS) or Cmd+P (Mac) to print or save as PDF — the filename is already set.');
      }
    }, 250);
  }
}

// Sets printMode (read by the [data-print-mode] CSS rule in OutputFrame)
// then opens the print dialog after React flushes the re-render.
function triggerPrint(setPrintMode, mode, docTitle) {
  setPrintMode(mode);
  setTimeout(() => safePrint(docTitle), 60);
}

// Reusable pair of print/save buttons for any output with its own
// search/filter chrome (marked className="sb-interactive-toolbar" in that
// page) — "Interactive" keeps the chrome visible in the saved PDF,
// "Static" produces a clean export starting at the first content card.
function PrintModeActions({ onPrint }) {
  return (
    <>
      <button onClick={() => onPrint('interactive')} className="sb-btn sb-btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.66rem' }}>
        🔍 Interactive PDF
      </button>
      <button onClick={() => onPrint('static')} className="sb-btn sb-btn-gold" style={{ padding: '0.45rem 0.85rem', fontSize: '0.66rem' }}>
        🖨 Static PDF
      </button>
    </>
  );
}

// ── Reusable frame ──
// printActions: optional custom toolbar buttons (e.g. separate Interactive
// vs Static print/save options) replacing the default single "Print / Save
// as PDF" button. Pages with their own filter/search chrome above their
// content mark that chrome with className="sb-interactive-toolbar" — the
// print rule below strips it whenever the page sets
// data-print-mode="static" before calling window.print(), giving a clean
// static export that starts right at the content instead of the controls.
function OutputFrame({ title, eyebrow, children, gated, hideTitle, printActions, printDocTitle, afterFooter, subHeader }) {
  const { user } = useAuthState();
  const canPrint = !!user;
  return (
    <div
      className="sb-output-shell"
      style={{
        background:
          'radial-gradient(circle at 18% 8%, rgba(217,140,160,0.12), transparent 26%), radial-gradient(circle at 88% 2%, rgba(74,124,142,0.14), transparent 28%), linear-gradient(135deg, var(--sbh-parchment), var(--sbh-cream) 52%, var(--sbh-parchment-deep))',
        color: 'var(--sbh-ink)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @media print {
          .sb-output-toolbar, .sb-output-gate-overlay { display: none !important; }
          /* Zero out screen chrome so the document starts at the top of
             page 1 (no blank header band from the article's screen margin)
             and sections space evenly page over page. */
          .sb-output-page { padding: 0 !important; margin: 0 !important; box-shadow: none !important; max-width: none !important; }
          .sb-output-page section { break-inside: avoid; }
          body { background: white !important; margin: 0 !important; }
          [data-print-mode="static"] .sb-interactive-toolbar { display: none !important; }
        }
        @page { size: letter; margin: 0.45in 0.55in; }
      `}</style>
      <div
        className="sb-output-toolbar"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(248,244,236,0.94)', color: 'var(--sbh-ink)',
          padding: '0.8rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '0.5px solid var(--sbh-line)',
          boxShadow: '0 12px 30px -28px rgba(43,42,40,0.42)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div>
          <div className="sb-display" style={{ fontSize: '1.05rem', letterSpacing: 0, lineHeight: 1 }}>
            Salt Basin <span style={{ color: 'var(--sbh-gold)' }}>Net Works</span>
          </div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sbh-teal-deep)', marginTop: '0.18rem' }}>
            saltbasin.net · {eyebrow || 'Output'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {!gated && canPrint && (printActions || (
            <button
              onClick={() => safePrint(printDocTitle)}
              className="sb-btn sb-btn-gold"
              style={{ padding: '0.45rem 1rem', fontSize: '0.7rem' }}
            >
              ⌘ Print / Save as PDF
            </button>
          ))}
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
          background: 'rgba(255,253,247,0.96)',
          border: '1px solid var(--sbh-line)',
          borderTop: '4px solid var(--sbh-gold)',
          boxShadow: '0 24px 70px -52px rgba(43,42,40,0.42)',
          position: 'relative',
        }}
      >
        {title && !hideTitle && (
          <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--sbh-line)', paddingBottom: '0.9rem' }}>
            <h1
              style={{
                fontFamily: 'var(--sb-font-display)',
                fontSize: '2.4rem',
                color: 'var(--sbh-ink)',
                letterSpacing: 0,
                marginBottom: '0.2rem',
                lineHeight: 1,
              }}
            >
              {title}
            </h1>
            {subHeader && (
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--sbh-ink)', opacity: 0.75, marginBottom: '0.3rem' }}>
                {subHeader}
              </div>
            )}
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sbh-teal-deep)' }}>
              saltbasin.net · We build for the customer you keep
            </div>
          </header>
        )}
        {children}
        <OutputAuthorshipFooter />
        {afterFooter}
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
          Sign in to generate Salt Basin outputs
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--sb-sage)', lineHeight: 1.65, maxWidth: 500, margin: '0 auto 1.25rem' }}>
          The full {kind} — including the rest of this content plus print-to-PDF download — is available to Salt Basin members. Free to start. You keep everything you've shared as a lead, plus get a profile site you can point to.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/login?next=${encodeURIComponent(location.pathname)}`}
            className="sb-btn sb-btn-gold"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.72rem' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// True if the given /api/auth/me user object is the Salt Basin admin.
function isAdminUser(user) {
  return user?.role === 'admin';
}

// Shown to a logged-in-but-non-admin member hitting an admin-only detailed
// output (Career Master Database, Case Study Portfolio, Full Portfolio,
// Portfolio Appendix). Distinct from GatedPreview, which assumes the
// visitor isn't signed up at all — this visitor already is, so "sign up"
// messaging would be wrong.
function AdminOnlyNotice({ kind }) {
  return (
    <div
      style={{
        marginTop: '2rem', padding: '2rem', background: 'var(--sb-navy)', color: 'var(--sb-cream)',
        borderRadius: 'var(--sb-radius)', borderTop: '3px solid var(--sb-gold)', textAlign: 'center',
      }}
    >
      <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.5rem' }}>Admin access only</div>
      <h2 style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
        This {kind} isn't public yet
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--sb-sage)', lineHeight: 1.65, maxWidth: 500, margin: '0 auto' }}>
        The detailed {kind} is limited to Salt Basin Net Works admin access while cost and licensing terms are finalized. The Executive Resume Portfolio is available to members in the meantime.
      </p>
    </div>
  );
}

// Teaser wrapper for the portfolio-request funnel: shows real sample content
// (so visitors see the actual visual quality) capped with a fade-out, ahead
// of the PortfolioRequestPrompt popup.
function TeaserFade({ children, note }) {
  return (
    <div>
      <div style={{ position: 'relative', maxHeight: 560, overflow: 'hidden' }}>
        {children}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 180, background: 'linear-gradient(to bottom, rgba(255,255,255,0), white 88%)', pointerEvents: 'none' }} />
      </div>
      {note && (
        <div style={{ textAlign: 'center', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4843A', fontFamily: 'sans-serif', fontWeight: 700, marginTop: '0.6rem' }}>
          {note}
        </div>
      )}
    </div>
  );
}

// ── Layout: Modern SB ────────────────────────────────────────────────────────
// Inspired by the structured multi-column professional CV format, adapted to
// Salt Basin brand — navy headers, gold accents, ivory section fills.
function SectionHeadingMod({ children }) {
  return (
    <div style={{ fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#1b2a3b', fontFamily: 'Georgia, serif', fontWeight: 700, marginBottom: '0.6rem', paddingBottom: '0.25rem', borderBottom: '1px solid #c4843a' }}>
      {children}
    </div>
  );
}

// ── Salt Basin Net Works Visual Design System v1.0 ────────────────────────
// Exact palette + component treatments from the brand doc, so the Executive
// Summary dashboard reads as "single, recognizable strategy and
// intelligence brand" rather than an ad hoc chart.
const BRAND = {
  navy: '#172A45',       // Deep Basin Navy — primary headers, hero panels, dark cards
  midnight: '#0F1B2D',   // high-contrast backgrounds/footers
  gold: '#C4843A',       // Tide Gold — accent lines, labels, callouts, metric emphasis
  warmShell: '#F7F2E8',  // soft backgrounds, cover pages
  slate: '#536173',      // secondary text, metadata
  mist: '#EEF2F6',       // card backgrounds, table row fills
  teal: '#4A7C8E',        // Harbor Teal — AI/data/network visuals
  green: '#2D5A27',      // Reservoir Green — outcomes, savings, success metrics
  plum: '#7A174E',       // Plum Signal — case-study variation, high-priority callouts
  graphite: '#252A31',   // body text
  fog: '#6D7785',        // captions, notes, helper text
};

// KPI Tile component (design system §5): "White/mist card, soft border,
// gold/teal label, generous padding." Max 6 tiles per dashboard per spec.
function KPITile({ value, label, note, accent }) {
  return (
    <div style={{ background: BRAND.mist, border: `0.5px solid rgba(23,42,69,0.08)`, borderRadius: 10, padding: '1rem 0.9rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: BRAND.navy, fontFamily: 'Georgia, serif', lineHeight: 1.15 }}>{value}</div>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: accent || BRAND.gold, fontWeight: 700, marginTop: '0.4rem', fontFamily: 'sans-serif' }}>{label}</div>
      {note && <div style={{ fontSize: '0.66rem', color: BRAND.slate, marginTop: '0.2rem', lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

// Capability Meter component (design system §5): "Capability name +
// confidence bar + evidence. Use for executive strengths without generic
// bullets."
function CapabilityMeter({ name, pct, evidence, color }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 700, color: BRAND.navy }}>{name}</span>
        <span style={{ color: BRAND.slate, fontSize: '0.66rem' }}>{evidence}</span>
      </div>
      <div style={{ height: 6, background: BRAND.mist, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || BRAND.teal, borderRadius: 3 }} />
      </div>
    </div>
  );
}

// Best-effort live extraction from Career Master engagement text, falling
// back to Betsy's own established brand-level figures (Salt Basin Net Works
// Visual Design System v1.0, p.1) if nothing matches — so the dashboard
// never renders empty/broken on a fresh install with sparse data.
function extractDollarMax(strings) {
  let best = null, bestVal = -1;
  (strings || []).forEach((s) => {
    if (!s) return;
    const m = s.match(/\$[\d.]+[BM]/i);
    if (m) {
      const val = parseFloat(m[0].replace(/[^0-9.]/g, '')) * (/B/i.test(m[0]) ? 1000 : 1);
      if (val > bestVal) { bestVal = val; best = m[0]; }
    }
  });
  return best;
}

function computeExecutiveKPIs(master) {
  if (!master) return [];
  const engagements = master.engagements || [];
  const exitFigure = extractDollarMax(engagements.map((e) => e.exitDetail)) || '$4.6B';
  const arrMatch = engagements.flatMap((e) => e.metrics || []).find((m) => /ARR automated/i.test(m));
  const arrFigure = (arrMatch && arrMatch.match(/\$[\d.]+[BM]\+?/i)?.[0]) || '$500M+';
  return [
    { value: exitFigure, label: 'Exit Signal', note: 'Portfolio value creation proof', accent: BRAND.gold },
    { value: arrFigure, label: 'ARR Automated', note: 'Revenue system credibility', accent: BRAND.teal },
    { value: String(engagements.length), label: 'Engagements', note: 'Case-study depth', accent: BRAND.green },
    { value: '12', label: 'Industries', note: 'Pattern recognition range', accent: BRAND.gold },
    { value: '13', label: 'Years', note: 'Operator track record', accent: BRAND.teal },
    { value: 'AI-Native', label: 'Product Studio', note: 'Future-facing edge', accent: BRAND.plum },
  ];
}

// Skill-proficiency confidence bars, one per meta-capability bucket — reuses
// the same META_CATEGORY_MAP / tierFillPct rollup logic as the Portfolio
// Appendix dashboard so the two stay numerically consistent.
function computeCapabilityMeters(master) {
  if (!master?.skills?.length) return [];
  const colors = [BRAND.gold, BRAND.teal, BRAND.green, BRAND.plum];
  return META_CATEGORY_ORDER.map((meta, i) => {
    const inBucket = master.skills.filter((s) => META_CATEGORY_MAP[s.category] === meta);
    const avgPct = inBucket.length ? inBucket.reduce((sum, s) => sum + tierFillPct(s.tier), 0) / inBucket.length : 0;
    const expertCount = inBucket.filter((s) => s.tier === 'Expert').length;
    return { name: meta, pct: Math.round(avgPct), evidence: `${expertCount} Expert · ${inBucket.length} skills`, color: colors[i % colors.length] };
  });
}

// Executive Summary section (design system §8, Page 1 — "sell the thesis"):
// KPI dashboard (6 tiles max) + capability confidence bars. This is the
// dashboard-level skill-proficiency summary requested for the resume's
// Executive Summary section.
function ExecutiveSummarySection({ execKpis, capabilityMeters }) {
  if (!execKpis?.length) return null;
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: BRAND.navy, fontFamily: 'Georgia, serif', fontWeight: 700, marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: `1px solid ${BRAND.gold}` }}>
        Executive Summary
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {execKpis.map((k) => <KPITile key={k.label} {...k} />)}
      </div>
      {capabilityMeters?.length > 0 && (
        <div style={{ background: BRAND.warmShell, borderRadius: 10, padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.slate, marginBottom: '0.6rem', fontFamily: 'sans-serif' }}>Capability Confidence</div>
          {capabilityMeters.map((c) => <CapabilityMeter key={c.name} {...c} />)}
        </div>
      )}
    </section>
  );
}

// ── Elevated visual sections (design system §5–6, "Strategic Operator" infographic reference) ──
// Live-computed from Career Master, so they update when jobs/tools/engagements
// are edited in the admin panel — no hardcoded figures beyond the bucket labels.

// Industry-duration buckets: ordered keyword rules matched against job +
// engagement industry text. Duration = count of distinct calendar years with
// matching activity, so overlapping engagements never double-count.
const INDUSTRY_DURATION_BUCKETS = [
  { label: 'SaaS & Enterprise Software', sub: 'RevOps & monetization', re: /saas|software|enterprise|technology|tech\b/i },
  { label: 'Private Equity / PortOps', sub: 'Value creation & exit readiness', re: /private equity|pe advisory|portfolio|vista/i },
  { label: 'Healthcare Technology', sub: 'Systems alignment & relisting readiness', re: /health|telehealth/i },
  { label: 'Manufacturing & Industrial', sub: 'Q2R & commodity pricing architecture', re: /manufactur|chemical|industrial|consumer goods|cpg/i },
  { label: 'Education & Publishing', sub: 'Global program delivery', re: /education|publish|edtech/i },
  { label: 'AI-Native Ventures', sub: 'Agentic products & advisory', re: /\bai\b/i },
];

function yearFromDateStr(s) {
  const m = String(s || '').match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function sortableRoleYear(job) {
  const endText = String(job?.endDate || job?.dates || '').toLowerCase();
  if (/present|current|now|ongoing/.test(endText)) return 9999;
  const end = yearFromDateStr(job?.endDate || job?.dates);
  const start = yearFromDateStr(job?.startDate || job?.dates);
  return end ?? start ?? 0;
}

function sortMostRecentRoles(jobs = []) {
  return [...jobs].sort((a, b) => sortableRoleYear(b) - sortableRoleYear(a));
}

function buildResumeJobs(master, timeline) {
  if (master?.jobs?.length) {
    return sortMostRecentRoles(master.jobs).map((j) => ({
      company: j.company,
      title: j.title,
      dates: [j.startDate, j.endDate].filter(Boolean).join(' - '),
      startDate: j.startDate,
      endDate: j.endDate,
      bullets: String(j.keyMetrics || '').split(';').map((s) => s.trim()).filter(Boolean),
    }));
  }
  const jobs = [];
  for (let i = 1; i <= 10; i += 1) {
    if (!timeline?.[`job${i}Company`]) continue;
    jobs.push({
      company: timeline[`job${i}Company`],
      title: timeline[`job${i}Title`],
      dates: timeline[`job${i}Dates`],
      bullets: (timeline[`job${i}Bullets`] || '').split('\n').filter(Boolean),
    });
  }
  return sortMostRecentRoles(jobs);
}

function computeIndustryDurations(master) {
  if (!master) return [];
  const nowYear = new Date().getFullYear();
  const items = [];
  (master.jobs || []).forEach((j) => {
    const start = yearFromDateStr(j.startDate);
    if (!start) return;
    const end = /present|ongoing/i.test(String(j.endDate || '')) ? nowYear : (yearFromDateStr(j.endDate) ?? start);
    items.push({ text: `${j.industry || ''} ${j.jobFunction || ''}`, start, end: Math.max(start, end) });
  });
  (master.engagements || []).forEach((e) => {
    const yearsInPeriod = String(e.period || '').match(/(19|20)\d{2}/g) || [];
    if (!yearsInPeriod.length) return;
    const start = Number(yearsInPeriod[0]);
    const end = /present|ongoing/i.test(String(e.period)) ? nowYear : Number(yearsInPeriod[yearsInPeriod.length - 1]);
    items.push({ text: e.industry || '', start, end: Math.max(start, end) });
  });
  return INDUSTRY_DURATION_BUCKETS.map((b) => {
    const years = new Set();
    items.forEach((it) => {
      if (!b.re.test(it.text)) return;
      for (let y = it.start; y <= it.end; y += 1) years.add(y);
    });
    return { label: b.label, sub: b.sub, years: years.size };
  }).filter((r) => r.years > 0).sort((a, b) => b.years - a.years);
}

// Scaling bars — magnitude encoding, so a single hue (Harbor Teal) with the
// value labeled at the bar end; identity lives in the row label, not color.
function IndustryDurationSection({ rows, heading = 'Industry Experience & Duration' }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => r.years));
  return (
    <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      <SectionHeadingMod>{heading}</SectionHeadingMod>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '1fr 3.4rem', gap: '0.7rem', alignItems: 'center', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.22rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: BRAND.navy }}>{r.label}</span>
              <span style={{ fontSize: '0.62rem', color: BRAND.slate }}>{r.sub}</span>
            </div>
            <div style={{ height: 8, background: BRAND.mist, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((r.years / max) * 100)}%`, background: BRAND.teal, borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: BRAND.navy, fontFamily: 'Georgia, serif', textAlign: 'right' }}>
            {r.years} yr{r.years === 1 ? '' : 's'}
          </div>
        </div>
      ))}
    </section>
  );
}

// Tool-proficiency graphic — the "resume templates showing tool-proficiency
// graphics" ask. Hands-on tiers only (Expert/Advanced); surfaces the
// career_tools product-rename tracking ("Conga CPQ, formerly Apttus CPQ").
function computeToolProficiency(master, limit = 10) {
  if (!master?.tools?.length) return [];
  const order = { Expert: 0, Advanced: 1, Proficient: 2, Foundational: 3 };
  return [...master.tools]
    .filter((t) => t.tier === 'Expert' || t.tier === 'Advanced')
    .sort((a, b) => (order[a.tier] - order[b.tier]) || ((Number(b.numRoles) || 0) - (Number(a.numRoles) || 0)))
    .slice(0, limit)
    .map((t) => {
      const renamed = t.currentName && t.currentName !== t.nameUsed && !/sunset/i.test(t.currentName);
      return {
        name: renamed ? t.currentName : (t.nameUsed || t.currentName),
        formerly: renamed ? t.nameUsed : null,
        tier: t.tier,
        pct: tierFillPct(t.tier),
        evidence: [t.firstUsed ? `since ${t.firstUsed}` : null, t.numRoles ? `${t.numRoles} role${Number(t.numRoles) === 1 ? '' : 's'}` : null].filter(Boolean).join(' · '),
      };
    });
}

function ToolProficiencySection({ tools, heading = 'Platform & Tool Proficiency', columns = 2 }) {
  if (!tools?.length) return null;
  return (
    <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      <SectionHeadingMod>{heading}</SectionHeadingMod>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '0.7rem 1.75rem' }}>
        {tools.map((t) => (
          <div key={t.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: BRAND.navy }}>
                {t.name}
                {t.formerly && <span style={{ fontWeight: 400, fontStyle: 'italic', color: BRAND.fog, fontSize: '0.6rem' }}> · formerly {t.formerly}</span>}
              </span>
              <span style={{ fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'sans-serif', color: t.tier === 'Expert' ? BRAND.gold : BRAND.teal }}>{t.tier}</span>
            </div>
            <div style={{ height: 5, background: BRAND.mist, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${t.pct}%`, background: t.tier === 'Expert' ? BRAND.gold : BRAND.teal, borderRadius: 3 }} />
            </div>
            {t.evidence && <div style={{ fontSize: '0.6rem', color: BRAND.fog, marginTop: '0.15rem' }}>{t.evidence}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// Client-voice pull quote — brand-signature callout: large gold quotation
// mark, serif italic, attributed. Sourced live from engagement testimonials
// (shortest first — the punchiest quotes lead).
function computeClientQuotes(master, limit = 1) {
  return (master?.engagements || [])
    .filter((e) => e.testimonial)
    .map((e) => ({ text: e.testimonial, attr: e.testimonialAttr || e.clientDisplayName || '' }))
    .sort((a, b) => a.text.length - b.text.length)
    .slice(0, limit);
}

function ClientVoiceSection({ quotes }) {
  if (!quotes?.length) return null;
  return (
    <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      {quotes.map((q, i) => (
        <div key={i} style={{ position: 'relative', background: BRAND.warmShell, borderRadius: 10, padding: '1rem 1.25rem 0.9rem 3.1rem', marginBottom: '0.6rem' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: '0.9rem', top: '0.15rem', fontSize: '2.6rem', color: BRAND.gold, fontFamily: 'Georgia, serif', lineHeight: 1 }}>“</span>
          <div style={{ fontSize: '1rem', fontStyle: 'italic', color: BRAND.navy, lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>{q.text}</div>
          {q.attr && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.gold, fontWeight: 700, fontFamily: 'sans-serif' }}>— {q.attr}</div>
          )}
        </div>
      ))}
    </section>
  );
}

// Shared insert for the Modern/Corporate resume layouts: duration bars +
// tool graphics + client voice, each independently toggleable from the
// My Resume preset editor (empty array = toggled off = renders nothing).
function ElevatedVisualSections({ industryDurations, toolBars, clientQuotes }) {
  return (
    <>
      <IndustryDurationSection rows={industryDurations} />
      <ToolProficiencySection tools={toolBars} />
      <ClientVoiceSection quotes={clientQuotes} />
    </>
  );
}

function PrioritizedExperienceSection({ items, summary }) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length && !summary) return null;
  return (
    <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      <SectionHeadingMod>Prioritized Experience for This Role</SectionHeadingMod>
      {summary && <p style={{ fontSize: '0.84rem', lineHeight: 1.65, color: BRAND.graphite, marginBottom: '0.6rem' }}>{summary}</p>}
      {rows.map((item, i) => (
        <div key={i} style={{ marginBottom: '0.45rem', paddingLeft: '0.8rem', position: 'relative', fontSize: '0.8rem', lineHeight: 1.55, color: BRAND.graphite }}>
          <span style={{ position: 'absolute', left: 0, color: BRAND.gold, fontWeight: 700 }}>{i + 1}.</span>
          <strong>{item.label || item.experience || item.title}</strong>
          {item.why && <span> - {item.why}</span>}
          {item.evidence && <span style={{ color: BRAND.fog }}> ({item.evidence})</span>}
        </div>
      ))}
    </section>
  );
}

function ResumeLayoutModern({ about, timeline, jobs, handsOn, integrationDesign, adjacent, execKpis, capabilityMeters, industryDurations = [], toolBars = [], clientQuotes = [], prioritizedExperience = [], agentSummary = '' }) {
  const name = about.name || about.heading || 'Betsy Salter';
  const tagline = about.tagline || 'Strategic Operator · Revenue Systems · Private Equity';
  const photoUrl = about.photoUrl || about.photo || null;

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2.5px solid #c4843a' }}>
        {photoUrl && (
          <img src={photoUrl} alt={name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #c4843a' }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1b2a3b', margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{name}</h1>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4843a', marginTop: '0.3rem', fontFamily: 'sans-serif' }}>{tagline}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#666', lineHeight: 1.9, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, color: '#1b2a3b' }}>saltbasin.net</div>
          <div>betsysalter@saltbasin.net</div>
          {about.location && <div>{about.location}</div>}
        </div>
      </header>

      <PrioritizedExperienceSection items={prioritizedExperience} summary={agentSummary} />
      <ExecutiveSummarySection execKpis={execKpis} capabilityMeters={capabilityMeters} />
      <ElevatedVisualSections industryDurations={industryDurations} toolBars={toolBars} clientQuotes={clientQuotes} />

      {/* ── At a Glance ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionHeadingMod>At a Glance</SectionHeadingMod>
        {[about.p1, about.p2, about.p3].filter(Boolean).map((p, i) => (
          <p key={i} style={{ fontSize: '0.86rem', lineHeight: 1.75, color: '#3a3a3a', marginBottom: '0.45rem' }}>{p}</p>
        ))}
        {about.howIWork && (
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#faf8f4', borderLeft: '2px solid #c4843a', fontSize: '0.82rem', color: '#3a3a3a', fontStyle: 'italic' }}>
            <strong style={{ fontStyle: 'normal', color: '#1b2a3b' }}>How I work:</strong> {about.howIWork}
          </div>
        )}
      </section>

      {/* ── Two column: Domains | Technology ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
        <div>
          <SectionHeadingMod>Core Domains</SectionHeadingMod>
          {DOMAIN_CATEGORIES.map(cat => (
            <div key={cat.title} style={{ marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.2rem' }}>{cat.icon} {cat.title}</div>
              {cat.items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#3a3a3a', paddingLeft: '0.6rem', marginBottom: '0.1rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#c4843a' }}>·</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <SectionHeadingMod>Technology Proficiencies</SectionHeadingMod>
          {[['Hands-On', handsOn], ['Integration & Design', integrationDesign], ['Adjacent', adjacent]].map(([label, items]) => items.length > 0 && (
            <div key={label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.78rem', color: '#3a3a3a', lineHeight: 1.6 }}>{items.join(' · ')}</div>
            </div>
          ))}
          {NICHE_SOLUTIONS.map(ns => (
            <div key={ns.label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#02a1a6', fontFamily: 'sans-serif', marginBottom: '0.2rem' }}>{ns.icon} {ns.label}</div>
              {ns.items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#3a3a3a', paddingLeft: '0.6rem', position: 'relative', marginBottom: '0.1rem' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#02a1a6' }}>·</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Industry Experience — 3-col cards ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionHeadingMod>Industry Experience</SectionHeadingMod>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {INDUSTRIES.map(ind => (
            <div key={ind.key} style={{ background: '#faf8f4', padding: '0.6rem 0.75rem', borderLeft: '2px solid #c4843a', pageBreakInside: 'avoid' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.2rem' }}>{ind.icon} {ind.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#5a5a5a', lineHeight: 1.55 }}>{ind.snapshot}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Philosophy / Work Style — 3-col ── */}
      {(about.philosophy || about.interpersonalStyle || about.workEthic) && (
        <section style={{ marginBottom: '1.5rem' }}>
          <SectionHeadingMod>Philosophy & Work Style</SectionHeadingMod>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[['Philosophy', about.philosophy], ['Interpersonal Style', about.interpersonalStyle], ['Work Ethic', about.workEthic]].filter(([, v]) => v).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.3rem' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: '#3a3a3a', lineHeight: 1.65 }}>{val}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Professional Experience ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionHeadingMod>Professional Experience</SectionHeadingMod>
        {jobs.map((job, i) => (
          <div key={i} style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1b2a3b' }}>{job.company}</div>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', color: '#c4843a', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>{job.dates}</div>
            </div>
            <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#02a1a6', marginBottom: '0.3rem' }}>{job.title}</div>
            {job.bullets.map((b, j) => (
              <div key={j} style={{ fontSize: '0.8rem', color: '#3a3a3a', paddingLeft: '0.75rem', marginBottom: '0.2rem', position: 'relative', lineHeight: 1.55 }}>
                <span style={{ position: 'absolute', left: 0, color: '#c4843a' }}>·</span>{b}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* ── Education ── */}
      {timeline.educationLine && (
        <div style={{ display: 'flex', gap: '1rem', padding: '0.65rem 0.9rem', background: '#faf8f4', borderLeft: '2px solid #c4843a', alignItems: 'center' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>Education</div>
          <div style={{ fontSize: '0.84rem', color: '#1b2a3b' }}>{timeline.educationLine}</div>
        </div>
      )}
    </div>
  );
}

// ── Layout: Corporate SB ──────────────────────────────────────────────────────
// Bold structured layout — clean columns, strong navy headers, gold rule lines.
function ResumeLayoutCorporate({ about, timeline, jobs, handsOn, integrationDesign, adjacent, execKpis, capabilityMeters, industryDurations = [], toolBars = [], clientQuotes = [], prioritizedExperience = [], agentSummary = '' }) {
  const name = about.name || about.heading || 'Betsy Salter';
  const tagline = about.tagline || 'Strategic Operator · Revenue Systems · Private Equity';
  const photoUrl = about.photoUrl || about.photo || null;

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }}>

      {/* ── Header block — full-width navy bar ── */}
      <header style={{ background: '#1b2a3b', color: 'white', padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {photoUrl && (
          <img src={photoUrl} alt={name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c4843a', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{name}</h1>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c4843a', marginTop: '0.35rem', fontFamily: 'sans-serif' }}>{tagline}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.9, flexShrink: 0 }}>
          <div style={{ color: '#c4843a', fontFamily: 'sans-serif', fontSize: '0.7rem' }}>saltbasin.net</div>
          <div>betsysalter@saltbasin.net</div>
          {about.location && <div>{about.location}</div>}
        </div>
      </header>

      <PrioritizedExperienceSection items={prioritizedExperience} summary={agentSummary} />
      <ExecutiveSummarySection execKpis={execKpis} capabilityMeters={capabilityMeters} />
      <ElevatedVisualSections industryDurations={industryDurations} toolBars={toolBars} clientQuotes={clientQuotes} />

      {/* ── Two-panel body: main (left 65%) + sidebar (right 35%) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main column */}
        <div>
          {/* Profile */}
          <section style={{ marginBottom: '1.25rem' }}>
            <CorpHead>Executive Profile</CorpHead>
            {[about.p1, about.p2, about.p3].filter(Boolean).map((p, i) => (
              <p key={i} style={{ fontSize: '0.86rem', lineHeight: 1.75, color: '#3a3a3a', marginBottom: '0.4rem' }}>{p}</p>
            ))}
          </section>

          {/* Professional Experience */}
          <section style={{ marginBottom: '1.25rem' }}>
            <CorpHead>Professional Experience</CorpHead>
            {jobs.map((job, i) => (
              <div key={i} style={{ marginBottom: '1.1rem', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e8ddd0', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1b2a3b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{job.company}</div>
                  <div style={{ fontSize: '0.68rem', color: '#c4843a', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>{job.dates}</div>
                </div>
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#02a1a6', marginBottom: '0.3rem', fontFamily: 'sans-serif' }}>{job.title}</div>
                {job.bullets.map((b, j) => (
                  <div key={j} style={{ fontSize: '0.8rem', color: '#3a3a3a', paddingLeft: '0.75rem', marginBottom: '0.2rem', position: 'relative', lineHeight: 1.55 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#c4843a', fontWeight: 700 }}>—</span>{b}
                  </div>
                ))}
              </div>
            ))}
          </section>

          {/* Industry Experience */}
          <section>
            <CorpHead>Industry Experience</CorpHead>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {INDUSTRIES.map(ind => (
                <div key={ind.key} style={{ pageBreakInside: 'avoid', padding: '0.5rem 0.65rem', background: '#faf8f4', borderLeft: '2px solid #c4843a' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c4843a', fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{ind.icon} {ind.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#5a5a5a', lineHeight: 1.5 }}>{ind.snapshot}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div>
          {/* Core Domains */}
          <section style={{ marginBottom: '1.25rem', padding: '0.9rem', background: '#1b2a3b', color: 'white', borderRadius: 2 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.6rem' }}>Core Domains</div>
            {DOMAIN_CATEGORIES.map(cat => (
              <div key={cat.title} style={{ marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.62rem', color: '#c4843a', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>{cat.title}</div>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', paddingLeft: '0.5rem', marginBottom: '0.1rem' }}>· {item}</div>
                ))}
              </div>
            ))}
          </section>

          {/* Technology */}
          <section style={{ marginBottom: '1.25rem' }}>
            <CorpHead>Technology</CorpHead>
            {[['Hands-On', handsOn], ['Integration', integrationDesign], ['Adjacent', adjacent]].map(([label, items]) => items.length > 0 && (
              <div key={label} style={{ marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#c4843a', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ fontSize: '0.74rem', color: '#3a3a3a', lineHeight: 1.6 }}>{items.join(', ')}</div>
              </div>
            ))}
          </section>

          {/* Niche Solutions */}
          <section style={{ marginBottom: '1.25rem' }}>
            <CorpHead>Niche Solutions</CorpHead>
            {NICHE_SOLUTIONS.map(ns => (
              <div key={ns.label} style={{ marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.62rem', color: '#02a1a6', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>{ns.icon} {ns.label}</div>
                {ns.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.74rem', color: '#3a3a3a', paddingLeft: '0.5rem', marginBottom: '0.1rem' }}>· {item}</div>
                ))}
              </div>
            ))}
          </section>

          {/* Education */}
          {timeline.educationLine && (
            <section>
              <CorpHead>Education</CorpHead>
              <div style={{ fontSize: '0.8rem', color: '#1b2a3b', lineHeight: 1.6 }}>{timeline.educationLine}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function CorpHead({ children }) {
  return (
    <div style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#1b2a3b', fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.55rem', paddingBottom: '0.2rem', borderBottom: '2px solid #c4843a' }}>
      {children}
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

// ── Shared 4-layer output template renderer ──────────────────────────────────
// Used by all 5 output types (resume, proposal, case-study, one-pager,
// build-summary). Fetches the member's primary `output_templates` config for
// the given outputType plus the live Career Master rollup catalog; when the
// config is schemaVersion 2, renders layer1 (header tagline + member
// footer, appended below the LOCKED AUTHORSHIP footer — never in place of
// it), layer2 (stat cards) and layer3 (infographics) via the System B HTML
// block renderer, and layer4 (site sections / per-job experience / custom
// placeholder sections) via System A's RenderSection. When no v2 config
// exists, resolves to `{ config: null }` so callers keep their existing
// hardcoded layout as the fallback — no output type regresses for members
// who haven't configured a template yet.
// `?profile=<slug>` (CareerPortfolioHubOutput's existing convention) or
// `?owner=<slug|me>` (used by the builder's live-preview iframe) — both
// thread through to fetchCareerMaster's owner param so the right member's
// data backs the /output/* page instead of silently defaulting to the
// platform admin's (Betsy's) data (server/routes/careerMaster.js
// resolveOwnerUserId falls back to the admin when no owner is given).
// Shared so every /output/* page resolves this the same way instead of
// duplicating the URLSearchParams read.
function useOutputOwnerSlug() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('owner') || new URLSearchParams(location.search).get('profile') || '';
}

function useOutputTemplateConfig(outputType) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const owner = useOutputOwnerSlug();
  const isPreviewDraft = searchParams.get('previewDraft') === '1';
  // `?preset=<templateId>` — view a specific named preset (e.g. from the
  // Resume Portfolio index) instead of the owner's primary template. Only
  // ever resolves presets explicitly marked portfolioVisible (server-side).
  const presetId = searchParams.get('preset') || '';
  const [state, setState] = useState({ loading: true, config: null, rollupCatalog: null, sitePages: null });

  // ── Live preview mode: the builder (OutputTemplateConfigurator) posts the
  // in-progress, unsaved config via postMessage instead of us fetching the
  // saved primary template — see that component's postTimer effect.
  useEffect(() => {
    console.log('[DEBUG-preview] listener effect running, isPreviewDraft=', isPreviewDraft);
    if (!isPreviewDraft) return undefined;
    function onMessage(e) {
      console.log('[DEBUG-preview] onMessage fired', e.origin, e.data?.source, e.data?.config?.layer2_stats?.cards?.length);
      if (e.origin !== window.location.origin) return;
      if (e.data?.source === 'sb-output-preview') {
        console.log('[DEBUG-preview] setState with config');
        setState((s) => ({ ...s, loading: false, config: e.data.config }));
      }
    }
    window.addEventListener('message', onMessage);
    // Tell the parent we're ready to receive the current draft (handles the
    // iframe finishing load after the parent already has state to send).
    window.parent.postMessage({ source: 'sb-output-preview-ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, [isPreviewDraft]);

  // ── Normal mode: fetch a specific preset (?preset=) or the saved primary
  // template, plus rollups + site.
  useEffect(() => {
    if (isPreviewDraft) return undefined;
    let cancelled = false;
    const ownerParam = owner ? `?owner=${encodeURIComponent(owner)}` : '';
    const templateFetch = presetId
      ? fetch(`/api/output-templates/${encodeURIComponent(presetId)}/public`, { credentials: 'include' })
          .then((r) => r.json()).catch(() => ({ template: null }))
      : fetch(`/api/output-templates/primary?output_type=${encodeURIComponent(outputType)}`, { credentials: 'include' })
          .then((r) => r.json()).catch(() => ({ template: null }));
    Promise.all([
      templateFetch,
      fetch(`/api/career/rollups${ownerParam}`).then((r) => r.json()).catch(() => null),
      api.getPublishedSite().then((site) => site.pages).catch(() => null),
    ]).then(([tplRes, rollupCatalog, sitePages]) => {
      if (cancelled) return;
      let config = null;
      if (tplRes?.template?.config) {
        config = typeof tplRes.template.config === 'string' ? JSON.parse(tplRes.template.config) : tplRes.template.config;
      }
      if (Number(config?.schemaVersion) !== 2) config = null;
      setState({ loading: false, config, rollupCatalog, sitePages });
    });
    return () => { cancelled = true; };
  }, [outputType, owner, presetId, isPreviewDraft]);

  // Preview mode still needs rollupCatalog/sitePages for the renderer even
  // though config comes from postMessage — fetch them once, same as normal
  // mode, but never overwrite a config already received via postMessage.
  useEffect(() => {
    if (!isPreviewDraft) return;
    const ownerParam = owner ? `?owner=${encodeURIComponent(owner)}` : '';
    Promise.all([
      fetch(`/api/career/rollups${ownerParam}`).then((r) => r.json()).catch(() => null),
      api.getPublishedSite().then((site) => site.pages).catch(() => null),
    ]).then(([rollupCatalog, sitePages]) => {
      setState((s) => ({ ...s, rollupCatalog, sitePages }));
    });
  }, [isPreviewDraft, owner]);

  return state;
}

// Layer4 job_experience: proficiency qualifiers (tier language from the
// job's function/duration) alongside the actual activities performed
// (career_jobs.keyMetrics), so each role shows both — not just a bullet list.
function buildJobExperienceHtml(job) {
  const qualifiers = [job.jobFunction, job.industry, job.duration].filter(Boolean).join(' · ');
  const activities = Array.isArray(job.keyMetrics) ? job.keyMetrics : String(job.keyMetrics || '').split('\n').filter(Boolean);
  return renderBlockToHtml({
    type: 'experience-block',
    props: {
      company: job.company,
      title: job.title,
      dates: [job.startDate, job.endDate].filter(Boolean).join(' – '),
      bullets: [qualifiers && `Focus: ${qualifiers}`, ...activities].filter(Boolean),
    },
  }, {});
}

function hasOutputLayerContent(config) {
  if (!config) return false;
  const l1 = !!config.layer1_header?.memberTagline;
  const l2 = (config.layer2_stats?.cards || []).some((c) => c.visible !== false);
  const l3 = (config.layer3_infographics?.items || []).some((i) => i.visible !== false);
  const l4 = (config.layer4_sections?.sections || []).some((s) => s.visible !== false);
  return l1 || l2 || l3 || l4;
}

function OutputTemplateBody({ config, ctx, sitePages, master }) {
  if (!config) return null;
  const items = [];
  let order = 0;

  const tagline = config.layer1_header?.memberTagline;
  if (tagline) {
    items.push({ order: order++, key: 'l1-tagline', kind: 'html', html: `<div style="font-size:0.85rem;color:#8b9bae;font-style:italic;margin-bottom:0.75rem">${tagline}</div>` });
  }

  // Infographics render before Sections content (case studies, job history,
  // site sections) — a dashboard-style overview reads before the detail.
  // Each infographic's own sequence (set in the Infographics tab) controls
  // its position relative to other infographics; buildInfographicBlocksFromLayerConfig
  // already sorts by that field.
  const infographicBlocks = buildInfographicBlocksFromLayerConfig(config);
  for (const block of infographicBlocks) {
    items.push({ order: order++, key: `l3-${block.id}`, kind: 'html', html: renderBlockToHtml(block, ctx) });
  }

  for (const sec of (config.layer4_sections?.sections || []).filter((s) => s.visible !== false)) {
    if (sec.sourceType === 'job_experience') {
      const job = (master?.jobs || []).find((j) => String(j.id) === String(sec.jobId));
      if (job) items.push({ order: order++, key: `l4-job-${sec.id}`, kind: 'html', html: buildJobExperienceHtml(job) });
    } else if (sec.sourceType === 'case_study_engagement') {
      // Reuses the exact same card component as the Case Study Portfolio
      // output (CareerCaseStudyPortfolioOutput) — employer color band,
      // pill badges, dark client-voice quote block — so a case study
      // selected here looks identical to its portfolio-grid appearance.
      const engagement = (master?.engagements || []).find((e) => String(e.id) === String(sec.engagementId));
      if (engagement) items.push({ order: order++, key: `l4-case-${sec.id}`, kind: 'react', element: <div style={{ marginBottom: '1.5rem' }}><CareerCaseStudyCard e={engagement} /></div> });
    } else if (sec.sourceType === 'site_section') {
      const section = sitePages?.[sec.pageKey]?.sections?.find((s) => s.id === sec.sectionId);
      if (section) items.push({ order: order++, key: `l4-site-${sec.id}`, kind: 'react', element: <RenderSection section={section} mode="preview" /> });
    } else if (sec.sourceType === 'custom_placeholder') {
      const section = sitePages?.['_placeholders']?.sections?.find((s) => s.id === sec.customSectionId);
      if (section) items.push({ order: order++, key: `l4-placeholder-${sec.id}`, kind: 'react', element: <RenderSection section={section} mode="preview" /> });
    }
  }

  const statBlocks = buildStatBlocksFromLayerConfig(config, ctx);
  for (const block of statBlocks) {
    items.push({ order: order++, key: `l2-${block.id}`, kind: 'html', html: renderBlockToHtml(block, ctx) });
  }

  if (!items.length) return null;
  // The LOCKED OutputAuthorshipFooter is rendered by the caller's OutputFrame
  // (after `children`, untouched). The member's own footer is rendered
  // separately via OutputFrame's `afterFooter` slot so it always lands BELOW
  // the locked footer — see MemberFooterSlot below.
  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      {items.map((it) => it.kind === 'html'
        ? <div key={it.key} dangerouslySetInnerHTML={{ __html: it.html }} />
        : <div key={it.key}>{it.element}</div>)}
    </div>
  );
}

// Renders the member/org footer BELOW the locked AUTHORSHIP footer — passed
// to OutputFrame's `afterFooter` prop, never merged into the footer itself.
function MemberFooterSlot({ config }) {
  const html = renderMemberFooterHtml(config);
  if (!html) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Resume ──
export function ResumeOutput() {
  const location = useLocation();
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [page, setPage] = useState(null);
  const [wheel, setWheel] = useState(null);
  const [siteError, setSiteError] = useState(null);
  const [primaryTemplate, setPrimaryTemplate] = useState(undefined);
  const [resumePreset, setResumePreset] = useState(undefined);
  const [master, setMaster] = useState(null);
  const templateV2 = useOutputTemplateConfig('resume');
  const searchParams = new URLSearchParams(location.search);
  const requestedPresetId = searchParams.get('preset');
  const layoutParam = searchParams.get('layout') || resumePreset?.layout || 'classic';
  // Set by the resume configurator's Career Master Sections toggles
  // (src/components/admin/MyResumePanel.jsx) — both default on.
  const showExecSummary = searchParams.get('execSummary') !== '0';
  const showCapabilityMeters = searchParams.get('capabilityMeters') !== '0';
  const showIndustryBars = searchParams.get('industryBars') !== '0';
  const showToolBars = searchParams.get('toolBars') !== '0';
  const showClientVoice = searchParams.get('clientVoice') !== '0';

  useEffect(() => {
    api.getPublishedSite()
      .then((site) => {
        const home = site.pages['home'];
        if (!home) { setSiteError('Home page not found — check that the site is published.'); return; }
        setPage(home);
        setWheel(home?.sections.find((s) => s.type === 'industryWheel')?.fields || {});
      })
      .catch((e) => setSiteError(e.message || 'Failed to load'));
    fetchCareerMaster(ownerSlug).then(setMaster);

    fetch('/api/output-templates/primary?output_type=resume')
      .then(r => r.json())
      .then(d => {
        if (d.template?.config) {
          const cfg = typeof d.template.config === 'string' ? JSON.parse(d.template.config) : d.template.config;
          setPrimaryTemplate(cfg);
        } else {
          setPrimaryTemplate(null);
        }
      })
      .catch(() => setPrimaryTemplate(null));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      let selected = null;
      if (user) {
        try {
          const r = await fetch('/api/members/me/resume-presets', { credentials: 'include' });
          const d = r.ok ? await r.json() : { presets: [] };
          const presets = Array.isArray(d.presets) ? d.presets : [];
          selected = presets.find((p) => p.id === requestedPresetId) || presets.find((p) => p.primaryResume) || presets[0] || null;
        } catch { /* fall through to site owner's primary */ }
      }
      if (!selected) {
        // Viewer has no presets of their own (or isn't the owner): this is
        // the site owner's resume, so render the owner's primary preset.
        try {
          const r = await fetch('/api/site/resume-url', { credentials: 'include' });
          const d = r.ok ? await r.json() : null;
          selected = d?.preset || null;
        } catch { /* leave null — layout falls back to query params */ }
      }
      if (!cancelled) setResumePreset(selected);
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, requestedPresetId]);

  const isLoading = authLoading || primaryTemplate === undefined || resumePreset === undefined || !master || (!page && !siteError) || templateV2.loading;

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading resume…
    </div>
  );
  if (siteError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#c44', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      {siteError}
    </div>
  );

  if (!user) {
    return (
      <OutputFrame title="Betsy Salter — Resume" eyebrow="Resume" gated>
        <GatedPreview
          kind="resume"
          teaser={{
            label: 'Strategic Operator · Revenue Systems · Private Equity',
            paragraphs: [
              'Betsy Salter is a fractional CFO and revenue systems architect with a track record across $50M–$3.7B+ engagements in SaaS, PE-backed companies, manufacturing, and professional services.',
              'This resume includes her full career timeline, industry breakdown, technology proficiencies, and domain capabilities — available to Salt Basin members.',
            ],
            bullets: [
              '12+ years · Q2R, RevOps, GTM Systems, Data Architecture',
              'Vista Equity Partners, PwC, Slalom, multiple NASDAQ-listed orgs',
              'Hands-on: Salesforce, Zuora, NetSuite, Snowflake, Tableau, HubSpot',
            ],
          }}
        />
      </OutputFrame>
    );
  }

  const about = getHomeAboutFields(page);
  const timeline = page.sections.find((s) => s.type === 'timeline')?.fields || {};
  const jobs = buildResumeJobs(master, timeline);

  const execKpis = computeExecutiveKPIs(master);
  const capabilityMeters = computeCapabilityMeters(master);

  // Auto filename for print / save-as-PDF (browsers default the filename to
  // document.title): template name + primary-or-not + a section code per
  // enabled section (ES/CC/ID/TP/CV) + the download date.
  const sectionCodes = [
    ['ES', showExecSummary], ['CC', showCapabilityMeters], ['ID', showIndustryBars],
    ['TP', showToolBars], ['CV', showClientVoice],
  ].filter(([, on]) => on).map(([code]) => code).join('-') || 'BASE';
  const templateName = String(resumePreset?.name || layoutParam || 'Resume').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  const printDocTitle = [
    'Betsy-Salter-Resume',
    templateName,
    resumePreset ? (resumePreset.primaryResume ? 'Primary' : 'Alt') : 'Default',
    sectionCodes,
    new Date().toISOString().slice(0, 10),
  ].join('_');

  // ── 4-layer template-driven render (schemaVersion 2) ──
  if (templateV2.config && hasOutputLayerContent(templateV2.config)) {
    const ctx = { about, timeline, jobs, execKpis, capabilityMeters, resumePreset, rollupCatalog: templateV2.rollupCatalog };
    return (
      <OutputFrame title={about.heading || about.name || 'Betsy Salter'} eyebrow="Resume" printDocTitle={printDocTitle} afterFooter={<MemberFooterSlot config={templateV2.config} />}>
        <OutputTemplateBody config={templateV2.config} ctx={ctx} sitePages={templateV2.sitePages} master={master} />
      </OutputFrame>
    );
  }

  // ── Legacy template-driven render (schemaVersion 1, blocks-only) ──
  if (!resumePreset && primaryTemplate?.blocks?.length) {
    const ctx = { about, timeline, jobs, execKpis, capabilityMeters, resumePreset };
    const sorted = [...primaryTemplate.blocks]
      .filter(b => b.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // A custom template's own 'page-header' block already shows the name —
    // suppress OutputFrame's generic h1 so the header isn't repeated.
    const hasOwnHeader = sorted.some((b) => b.type === 'page-header');
    return (
      <OutputFrame title={about.heading || about.name || 'Betsy Salter'} eyebrow="Resume" hideTitle={hasOwnHeader} printDocTitle={printDocTitle}>
        <div style={{ fontFamily: 'Georgia, serif' }}>
          {sorted.map(block => {
            // experience-block with _dynamic = 'jobs' expands into one block per job
            if (block._dynamic === 'jobs' && jobs.length > 0) {
              return jobs.map((job, ji) => (
                <div key={ji} dangerouslySetInnerHTML={{ __html: renderBlockToHtml(
                  { ...block, props: { company: job.company, title: job.title, dates: job.dates, bullets: job.bullets } },
                  ctx
                ) }} />
              ));
            }
            return (
              <div key={block.id} dangerouslySetInnerHTML={{ __html: renderBlockToHtml(block, ctx) }} />
            );
          })}
        </div>
      </OutputFrame>
    );
  }

  // ── Dispatch to layout ──
  const parseTech = (s) => (s || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.split(':')[0].trim());
  const handsOn = parseTech(wheel?.handsOn);
  const integrationDesign = parseTech(wheel?.integrationDesign);
  const adjacent = parseTech(wheel?.adjacent);
  const resumeProps = {
    about, timeline, jobs, wheel, handsOn, integrationDesign, adjacent,
    agentSummary: resumePreset?.agentSummary || '',
    prioritizedExperience: resumePreset?.prioritizedExperience || [],
    execKpis: showExecSummary ? execKpis : [],
    capabilityMeters: showCapabilityMeters ? capabilityMeters : [],
    industryDurations: showIndustryBars ? computeIndustryDurations(master) : [],
    toolBars: showToolBars ? computeToolProficiency(master) : [],
    clientQuotes: showClientVoice ? computeClientQuotes(master, 1) : [],
  };

  if (layoutParam === 'modern') {
    return (
      // ResumeLayoutModern renders its own name/tagline header — hideTitle
      // avoids showing the name twice.
      <OutputFrame title={about.name || about.heading || 'Betsy Salter'} eyebrow="Resume · Modern" hideTitle printDocTitle={printDocTitle}>
        <ResumeLayoutModern {...resumeProps} />
      </OutputFrame>
    );
  }
  if (layoutParam === 'corporate') {
    return (
      // ResumeLayoutCorporate renders its own navy header bar — hideTitle
      // avoids showing the name twice.
      <OutputFrame title={about.name || about.heading || 'Betsy Salter'} eyebrow="Resume · Corporate" hideTitle printDocTitle={printDocTitle}>
        <ResumeLayoutCorporate {...resumeProps} />
      </OutputFrame>
    );
  }

  // Classic fallback
  return (
      <OutputFrame title={about.heading || 'Betsy Salter'} eyebrow="Resume" printDocTitle={printDocTitle}>
      <>
        <PrioritizedExperienceSection items={resumeProps.prioritizedExperience} summary={resumeProps.agentSummary} />
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
                <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.05rem', fontWeight: 500, color: 'var(--sb-navy)' }}>{job.company}</div>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--sb-teal-deep)' }}>{job.dates}</div>
              </div>
              <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--sb-teal-deep)', marginBottom: '0.4rem' }}>{job.title}</div>
              <ul style={ulStyle}>
                {job.bullets.map((b, j) => <li key={j} style={liStyle}><span style={dotStyle}>·</span>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
        {timeline.educationLine && (
          <section style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', background: 'var(--sb-cream)', borderLeft: '3px solid var(--sb-gold)' }}>
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>Education</div>
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
  const ownerSlug = useOutputOwnerSlug();
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);
  const [about, setAbout] = useState({});
  const [master, setMaster] = useState(null);
  const templateV2 = useOutputTemplateConfig('case-study');
  useEffect(() => {
    api.getPublishedSite()
      .then((site) => {
        const cases = site.pages['home']?.sections.find((s) => s.type === 'caseStudies')?.fields || {};
        setData(cases);
        setAbout(getHomeAboutFields(site.pages['home']));
      })
      .catch(() => setData(null));
    fetchCareerMaster(ownerSlug).then(setMaster);
  }, []);

  if (loading || !data || !master || templateV2.loading) return null;

  // engagement-<id> slugs (Career Master, uncapped) take priority over the
  // 3 legacy fixed-slot slugs, which stay supported for old bookmarked links.
  const engagementMatch = /^engagement-(\d+)$/.exec(slug || '');
  const engagement = engagementMatch ? master.engagements.find((e) => String(e.id) === engagementMatch[1]) : null;
  const i = CASE_STUDY_SLUGS[slug];
  if (!engagement && !i) {
    return (
      <OutputFrame title="Case Study not found" eyebrow="Case Study">
        <p style={{ fontSize: '0.9rem', color: '#4a4a4a' }}>
          The requested case study doesn't exist.
        </p>
      </OutputFrame>
    );
  }

  const title = engagement ? engagement.clientDisplayName : data[`case${i}Title`];
  const subtitle = engagement ? [engagement.employer, engagement.industry].filter(Boolean).join(' · ') : data[`case${i}Subtitle`];
  const context = engagement ? [engagement.context].filter(Boolean) : (data[`case${i}Context`] || '').split('\n').filter(Boolean);
  const role = engagement ? (engagement.roles || []).join(' · ') : (data[`case${i}Role`] || '');
  const actions = engagement ? [engagement.actions].filter(Boolean) : (data[`case${i}Actions`] || '').split('\n').filter(Boolean);
  const impact = engagement ? (engagement.outcomes || []) : (data[`case${i}Impact`] || '').split('\n').filter(Boolean);
  const metrics = engagement ? (engagement.metrics || []) : [];
  const feedback = engagement ? (engagement.testimonial || '') : (data[`case${i}Feedback`] || '');
  const feedbackAttr = engagement ? (engagement.testimonialAttr || '') : '';

  // engagement-based (Career Master) case studies are detailed documentation
  // — admin-only while cost/licensing is finalized. The 3 legacy fixed-slot
  // case studies stay member-gated, matching their existing exposure.
  const requiresAdmin = !!engagement;
  if (!user || (requiresAdmin && !isAdminUser(user))) {
    return (
      <OutputFrame title={title} eyebrow={subtitle || 'Case Study'} gated>
        {user ? (
          <AdminOnlyNotice kind="case study" />
        ) : (
        <GatedPreview
          kind="case study"
          teaser={{ label: 'Context (preview)', items: undefined, bullets: context.slice(0, 1) }}
        />
        )}
      </OutputFrame>
    );
  }

  // ── 4-layer template-driven render (schemaVersion 2) ──
  if (templateV2.config && hasOutputLayerContent(templateV2.config)) {
    // When the Sections tab has one or more Career Master case studies
    // selected, this page is functioning as a curated case-study portfolio
    // (potentially several engagements, independent of whichever single
    // engagement the URL slug happens to point at) — the frame title should
    // read as a portfolio, not borrow the URL-slug engagement's own name.
    const isPortfolio = (templateV2.config.layer4_sections?.sections || []).some((s) => s.sourceType === 'case_study_engagement' && s.visible !== false);
    const memberName = about.name || about.heading || 'Betsy Salter';
    const frameTitle = isPortfolio ? `Case Study Portfolio - ${memberName}` : title;
    const frameEyebrow = isPortfolio ? 'Case Study Portfolio' : (subtitle || 'Case Study');
    // Legal-name disclosure line, distinct from the public "Betsy Salter"
    // brand name — shown only on the portfolio-wide render, not per-engagement
    // case study pages.
    const frameSubHeader = isPortfolio ? 'Legal Name: Martha Elizabeth Salter' : undefined;
    const ctx = { title, subtitle, context, role, actions, impact, metrics, engagement, rollupCatalog: templateV2.rollupCatalog };
    return (
      <OutputFrame title={frameTitle} eyebrow={frameEyebrow} subHeader={frameSubHeader} afterFooter={<MemberFooterSlot config={templateV2.config} />}>
        <OutputTemplateBody config={templateV2.config} ctx={ctx} sitePages={templateV2.sitePages} master={master} />
      </OutputFrame>
    );
  }

  // Boho-style multi-section layout for case studies
  const industryLabel = engagement ? engagement.industry : INDUSTRIES.find(ind => title?.toLowerCase().includes(ind.label.toLowerCase().split(' ')[0]))?.label;
  const industryIcon = engagement ? '◆' : INDUSTRIES.find(ind => title?.toLowerCase().includes(ind.label.toLowerCase().split(' ')[0]))?.icon;

  return (
    // The hero block below already shows the title — hideTitle avoids
    // showing it twice.
    <OutputFrame title={title} eyebrow={subtitle || 'Case Study'} hideTitle>
      <div style={{ fontFamily: 'Georgia, serif' }}>

        {/* ── Hero header ── */}
        <div style={{ background: '#faf8f4', border: '0.5px solid #e8ddd0', borderRadius: 4, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.4rem' }}>Case Study · Salt Basin Net Works</div>
            <h2 style={{ fontSize: '1.6rem', color: '#1b2a3b', margin: 0, lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>{title}</h2>
            {subtitle && <div style={{ fontSize: '0.8rem', color: '#02a1a6', marginTop: '0.35rem', fontStyle: 'italic' }}>{subtitle}</div>}
          </div>
          {industryLabel && (
            <div style={{ background: '#1b2a3b', color: 'white', padding: '0.75rem 1rem', textAlign: 'center', minWidth: 100, borderRadius: 2 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{industryIcon}</div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif' }}>{industryLabel}</div>
            </div>
          )}
        </div>

        {/* ── Context ── */}
        {context.length > 0 && (
          <section style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <CaseSectionHead>Context</CaseSectionHead>
            <div style={{ display: 'grid', gridTemplateColumns: context.length > 2 ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
              {context.map((c, j) => (
                <div key={j} style={{ padding: '0.5rem 0.75rem', background: '#faf8f4', borderLeft: '2px solid #c4843a', fontSize: '0.82rem', color: '#3a3a3a', lineHeight: 1.6 }}>{c}</div>
              ))}
            </div>
          </section>
        )}

        {/* ── Role ── */}
        {role && (
          <section style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <CaseSectionHead>My Role</CaseSectionHead>
            <div style={{ fontSize: '0.88rem', color: '#1b2a3b', lineHeight: 1.7, padding: '0.6rem 0.85rem', background: '#f0f8f8', borderLeft: '2px solid #02a1a6' }}>{role}</div>
          </section>
        )}

        {/* ── Actions | Impact side-by-side ── */}
        {(actions.length > 0 || impact.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {actions.length > 0 && (
              <section style={{ pageBreakInside: 'avoid' }}>
                <CaseSectionHead>Actions Taken</CaseSectionHead>
                {actions.map((a, j) => (
                  <div key={j} style={{ fontSize: '0.82rem', color: '#3a3a3a', paddingLeft: '0.75rem', marginBottom: '0.3rem', position: 'relative', lineHeight: 1.55 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#c4843a' }}>·</span>{a}
                  </div>
                ))}
              </section>
            )}
            {impact.length > 0 && (
              <section style={{ pageBreakInside: 'avoid' }}>
                <CaseSectionHead>Impact & Outcomes</CaseSectionHead>
                {impact.map((it, j) => (
                  <div key={j} style={{ fontSize: '0.82rem', color: '#1b2a3b', fontWeight: 500, paddingLeft: '0.75rem', marginBottom: '0.3rem', position: 'relative', lineHeight: 1.55 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#c4843a', fontWeight: 700 }}>▲</span>{it}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {/* ── Key metrics ── */}
        {metrics.length > 0 && (
          <section style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {metrics.map((m, j) => (
              <span key={j} style={{ fontFamily: 'sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#1b2a3b', background: '#faf8f4', border: '1px solid #c4843a', borderRadius: 20, padding: '0.3rem 0.85rem' }}>{m}</span>
            ))}
          </section>
        )}

        {/* ── Feedback/quote ── */}
        {feedback && (
          <section style={{ marginTop: '0.5rem', padding: '1rem 1.25rem', background: '#1b2a3b', color: 'white', borderLeft: '4px solid #c4843a', pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.4rem' }}>Stakeholder Feedback</div>
            <div style={{ fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>"{feedback}"</div>
            {feedbackAttr && <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c4843a' }}>— {feedbackAttr}</div>}
          </section>
        )}
      </div>
    </OutputFrame>
  );
}

function CaseSectionHead({ children }) {
  return (
    <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#1b2a3b', fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.5rem', paddingBottom: '0.2rem', borderBottom: '1.5px solid #c4843a' }}>
      {children}
    </div>
  );
}

// ── Case Study Portfolio (advanced) ───────────────────────────────────────
// Modeled on Betsy's "Case Study Portfolio" Canva reference design: an
// employer-color-banded 2-column card grid with pill badges for roles,
// metrics, and scenario tags, plus a dark "Client Voice" quote block —
// sourced live from career_engagements (uncapped, unlike the 3-slot legacy
// caseStudies section fields).
const EMPLOYER_BAND = {
  'Blackbaud, Inc.': { bg: '#1b2a3b', top: null },
  'Accenture': { bg: '#6b1f4a', top: null },
  'Vista Equity Partners': { bg: '#2d5a27', top: null },
  'TIBCO Software': { bg: '#7a2020', top: null },
  'PwC': { bg: '#b5651d', top: null },
  'Slalom': { bg: '#1a4a5a', top: null },
  'Salt Basin Net Works': { bg: '#0e1620', top: '#c4843a' },
};
function employerBand(employer) {
  return EMPLOYER_BAND[employer] || { bg: '#1b2a3b', top: null };
}

function Pill({ children, tone = 'neutral' }) {
  const TONES = {
    neutral: { bg: 'rgba(255,255,255,0.14)', color: 'white', border: 'rgba(255,255,255,0.3)' },
    role: { bg: '#eef2fb', color: '#2a3f6b', border: '#c9d4ea' },
    metric: { bg: '#eef9ee', color: '#1f6b2f', border: '#bfe3c2' },
    scenario: { bg: '#f4eefb', color: '#5b2f8a', border: '#dcc9ea' },
  };
  const t = TONES[tone];
  return (
    <span style={{ display: 'inline-block', fontFamily: 'sans-serif', fontSize: '0.66rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, marginRight: '0.35rem', marginBottom: '0.35rem' }}>
      {children}
    </span>
  );
}

function CareerCaseStudyCard({ e }) {
  const band = employerBand(e.employer);
  return (
    <div style={{ background: 'white', border: '0.5px solid #e8ddd0', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', pageBreakInside: 'avoid' }}>
      <div style={{ background: band.bg, borderTop: band.top ? `4px solid ${band.top}` : 'none', color: 'white', padding: '1rem 1.25rem' }}>
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '0.4rem' }}>
          Case Study #{String(e.id).padStart(2, '0')} {e.scale && <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.55rem', borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>{e.scale}</span>}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>{e.clientDisplayName || e.name}</div>
        <div>
          <Pill>{e.employer}</Pill>
          <Pill>{e.industry}</Pill>
          <Pill>{e.period}</Pill>
        </div>
      </div>
      <div style={{ padding: '1.1rem 1.25rem' }}>
        {e.roles?.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <CaseSectionHead>Roles</CaseSectionHead>
            {e.roles.map((r, i) => <Pill key={i} tone="role">{r}</Pill>)}
          </div>
        )}
        {e.context && (
          <div style={{ marginBottom: '0.75rem' }}>
            <CaseSectionHead>Business Context / Problem</CaseSectionHead>
            <p style={{ fontSize: '0.8rem', color: '#3a3a3a', lineHeight: 1.6, margin: 0 }}>{e.context}</p>
          </div>
        )}
        {e.actions && (
          <div style={{ marginBottom: '0.75rem' }}>
            <CaseSectionHead>What Betsy Did</CaseSectionHead>
            <p style={{ fontSize: '0.8rem', color: '#3a3a3a', lineHeight: 1.6, margin: 0 }}>{e.actions}</p>
          </div>
        )}
        {e.outcomes?.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <CaseSectionHead>Business Outcomes</CaseSectionHead>
            {e.outcomes.map((o, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#1b2a3b', paddingLeft: '0.9rem', marginBottom: '0.25rem', position: 'relative', lineHeight: 1.55 }}>
                <span style={{ position: 'absolute', left: 0, color: '#c4843a' }}>→</span>{o}
              </div>
            ))}
          </div>
        )}
        {e.metrics?.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <CaseSectionHead>Key Metrics</CaseSectionHead>
            {e.metrics.map((m, i) => <Pill key={i} tone="metric">{m}</Pill>)}
          </div>
        )}
        {e.testimonial && (
          <div style={{ marginBottom: '0.75rem', padding: '0.85rem 1rem', background: '#0e1620', color: 'white', borderRadius: 6 }}>
            <div style={{ fontSize: '1.1rem', color: '#c4843a', lineHeight: 1 }}>"</div>
            <p style={{ fontSize: '0.82rem', fontStyle: 'italic', lineHeight: 1.6, margin: '0.25rem 0 0.5rem' }}>{e.testimonial}</p>
            {e.testimonialAttr && <div style={{ fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c4843a' }}>— {e.testimonialAttr}</div>}
          </div>
        )}
        {e.scenarios?.length > 0 && (
          <div style={{ marginBottom: '0.5rem' }}>
            <CaseSectionHead>Scenarios & Themes</CaseSectionHead>
            {e.scenarios.map((s, i) => <Pill key={i} tone="scenario">{s}</Pill>)}
          </div>
        )}
        <a href={`/output/case-study/engagement-${e.id}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--sb-teal-deep, #02a1a6)', textDecoration: 'none' }}>
          ↗ View full case study
        </a>
      </div>
    </div>
  );
}

// Pre-configured quick filters (design-system §"Case Study Portfolio" quick
// filter row) — curated keyword sets matched against the engagement's
// title/roles/scenarios only (deliberately narrower than the free-text
// search haystack below), since none of these three groupings map onto one
// existing column. A broad match against full context/actions/outcomes text
// was tried first and tested at 24/24 (every engagement's narrative mentions
// "implementation" or "build" somewhere) — useless as a filter. Matching
// only the curated title/roles/scenarios fields against real
// career_engagements data (verified 2026-07-29) gives real separation:
// Salesforce CPQ 13/24, Hands-On Configuration 18/24, Advisory Business
// Architecture 14/24 (overlapping, as expected — many engagements are both).
const QUICK_CASE_STUDY_FILTERS = [
  { id: 'salesforce-cpq', label: 'Salesforce CPQ', keywords: ['cpq', 'apttus'] },
  { id: 'hands-on-configuration', label: 'Hands-On Configuration', keywords: ['implementation', 'build', 'configur', 'specialist', 'integration', 'migration', 'coordinator', 'support', 'uat'] },
  { id: 'advisory-business-architecture', label: 'Advisory Business Architecture', keywords: ['architect', 'advisory', 'strategic operator', 'gtm advisor', 'sme'] },
];

// Narrower field set for the quick filters above — title/roles/scenarios
// only, not free-text narrative (see comment above).
function engagementQuickFilterHaystack(e) {
  return [e.clientDisplayName, e.name, ...(e.roles || []), ...(e.scenarios || [])].filter(Boolean).join(' ').toLowerCase();
}

function engagementSearchHaystack(e) {
  return [
    e.clientDisplayName, e.name, e.employer, e.industry, e.context, e.actions,
    ...(e.roles || []), ...(e.scenarios || []), ...(e.outcomes || []), ...(e.metrics || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function CareerCaseStudyPortfolioOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [master, setMaster] = useState(null);
  const [search, setSearch] = useState('');
  const [employerFilter, setEmployerFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [printMode, setPrintMode] = useState('interactive');
  useEffect(() => { fetchCareerMaster(ownerSlug).then(setMaster); }, [ownerSlug]);

  const isLoading = authLoading || !master;
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading case study portfolio…
    </div>
  );

  const engagements = master.engagements;
  const industries = [...new Set(engagements.map((e) => e.industry).filter(Boolean))].sort();
  const employers = [...new Set(engagements.map((e) => e.employer).filter(Boolean))].sort();
  const allScenarios = [...new Set(engagements.flatMap((e) => e.scenarios || []))].sort();
  // "12 industries · 13 years" is Betsy's established brand tagline (hand-rolled-up
  // industry groupings, career tenure) — kept as fixed copy rather than the more
  // granular live industries.length / computed year-span, which read as noise
  // against her own consistent marketing figures. Engagement count stays live.
  const portfolioTagline = `${engagements.length} engagements · 12 industries · 13 years`;

  // Non-admin visitors get the teaser + portfolio-request funnel: two real
  // engagement cards with a fade-out, then the request/build-your-own popup.
  if (!isAdminUser(user)) {
    const sampleEngagements = engagements.filter((e) => e.testimonial).slice(0, 1)
      .concat(engagements.filter((e) => !e.testimonial).slice(0, 1));
    return (
      <OutputFrame title="Case Study Portfolio" eyebrow="Strategic Operator Portfolio" gated>
        <TeaserFade note={`Preview — ${portfolioTagline} in the full portfolio`}>
          <p style={{ fontSize: '0.85rem', color: '#536173', lineHeight: 1.65, marginBottom: '1.1rem', fontFamily: 'Georgia, serif' }}>
            Every engagement, full context to impact, with quantified business outcomes and client testimonials.
          </p>
          {sampleEngagements.map((e) => (
            <div key={e.id} style={{ border: '0.5px solid #e8ddd0', borderRadius: 8, overflow: 'hidden', marginBottom: '0.9rem' }}>
              <div style={{ background: BRAND.navy, color: 'white', padding: '0.7rem 1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Georgia, serif' }}>{e.clientDisplayName || e.name}</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: BRAND.gold, fontFamily: 'sans-serif', marginTop: '0.2rem' }}>
                  {[e.industry, e.period].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div style={{ padding: '0.85rem 1rem' }}>
                {(e.metrics || []).slice(0, 3).map((m, i) => (
                  <span key={i} style={{ display: 'inline-block', fontSize: '0.66rem', padding: '0.2rem 0.65rem', borderRadius: 12, background: BRAND.mist, color: BRAND.navy, margin: '0 0.35rem 0.35rem 0', fontFamily: 'sans-serif' }}>{m}</span>
                ))}
                {e.testimonial && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: BRAND.navy, marginTop: '0.4rem', fontFamily: 'Georgia, serif' }}>
                    “{e.testimonial}” <span style={{ fontStyle: 'normal', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: BRAND.gold, fontFamily: 'sans-serif' }}>— {e.testimonialAttr}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </TeaserFade>
        <PortfolioRequestPrompt sourceOutput="case-study-portfolio" master={master} user={user} />
      </OutputFrame>
    );
  }

  const activeQuickFilter = QUICK_CASE_STUDY_FILTERS.find((f) => f.id === quickFilter) || null;
  const filtered = engagements.filter((e) => {
    if (employerFilter && e.employer !== employerFilter) return false;
    if (industryFilter && e.industry !== industryFilter) return false;
    if (scenarioFilter && !(e.scenarios || []).includes(scenarioFilter)) return false;
    if (activeQuickFilter) {
      const hay = engagementQuickFilterHaystack(e);
      if (!activeQuickFilter.keywords.some((kw) => hay.includes(kw))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!engagementSearchHaystack(e).includes(q)) return false;
    }
    return true;
  });
  const anyFilterActive = !!(employerFilter || industryFilter || scenarioFilter || quickFilter || search);
  function resetAllFilters() {
    setEmployerFilter(''); setIndustryFilter(''); setScenarioFilter(''); setQuickFilter(''); setSearch('');
  }

  return (
    <OutputFrame title="Case Study Portfolio" eyebrow="Strategic Operator Portfolio" printActions={<PrintModeActions onPrint={(m) => triggerPrint(setPrintMode, m, `Betsy-Salter_Case-Study-Portfolio_${m === 'static' ? 'Static' : 'Interactive'}_${new Date().toISOString().slice(0, 10)}`)} />}>
      <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }} data-print-mode={printMode}>
        {/* ── Interactive chrome — search/filters — stripped in static print ── */}
        <div className="sb-interactive-toolbar">
          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#5a5a5a', marginBottom: '1.5rem' }}>
            {portfolioTagline} · "I build for the customer you keep, not just the deal you close."
          </p>

          {/* ── Pre-configured quick filters — curated one-click groupings,
               separate from the free-text/dropdown filters below ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.85rem', fontFamily: 'sans-serif' }}>
            {QUICK_CASE_STUDY_FILTERS.map((qf) => {
              const active = quickFilter === qf.id;
              return (
                <button
                  key={qf.id}
                  onClick={() => setQuickFilter(active ? '' : qf.id)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                    border: active ? '1.5px solid #c4843a' : '1px solid #e8ddd0',
                    background: active ? '#1b2a3b' : 'white',
                    color: active ? '#f5edd8' : '#1b2a3b',
                  }}
                >
                  {qf.label}
                </button>
              );
            })}
            {anyFilterActive && (
              <button
                onClick={resetAllFilters}
                style={{ padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #e8ddd0', background: 'transparent', color: '#888' }}
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontFamily: 'sans-serif' }}>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case studies…"
              style={{ flex: 1, minWidth: 180, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.8rem' }}
            />
            <select value={employerFilter} onChange={(e) => setEmployerFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.8rem' }}>
              <option value="">All Employers</option>
              {employers.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.8rem' }}>
              <option value="">All Industries</option>
              {industries.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={scenarioFilter} onChange={(e) => setScenarioFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.8rem' }}>
              <option value="">All Scenarios</option>
              {allScenarios.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '1rem', fontFamily: 'sans-serif' }}>{filtered.length} of {engagements.length} case studies</div>
        </div>

        {/* ── Card grid — always shown, reflects current filter state ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((e) => <CareerCaseStudyCard key={e.id} e={e} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#aaa', fontSize: '0.85rem' }}>
              No case studies match your filters.
            </div>
          )}
        </div>
      </div>
    </OutputFrame>
  );
}

// ── Career Master Database (advanced) ─────────────────────────────────────
// Live, data-driven replica of the original career_master_database.html
// reference tool: sortable/filterable/searchable tables per resource
// (Skills, Jobs, Tools, Engagements) plus Vista Portfolio Outcomes and
// Positioning & Ventures tabs — all sourced from Career Master, not a
// static snapshot.
function exportCSV(columns, rows, filename) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    columns.map((c) => escape(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => escape(c.csv ? c.csv(r) : r[c.key])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function DataTable({ columns, rows, searchKeys, filters = [], csvFilename, rowKey = 'id' }) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const filtered = rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const hay = searchKeys.map((k) => r[k]).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const f of filters) {
      if (filterValues[f.key] && String(r[f.key]) !== filterValues[f.key]) return false;
    }
    return true;
  });

  const sorted = sortCol ? [...filtered].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    const an = Number(av), bn = Number(bv);
    const cmp = (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
    return cmp * sortDir;
  }) : filtered;

  function toggleSort(key) {
    if (sortCol === key) setSortDir((d) => -d);
    else { setSortCol(key); setSortDir(1); }
  }

  return (
    <div className="sb-interactive-toolbar">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontFamily: 'sans-serif' }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          style={{ flex: 1, minWidth: 160, padding: '0.4rem 0.65rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.76rem' }}
        />
        {filters.map((f) => (
          <select key={f.key} value={filterValues[f.key] || ''} onChange={(e) => setFilterValues((v) => ({ ...v, [f.key]: e.target.value }))}
            style={{ padding: '0.4rem 0.65rem', borderRadius: 6, border: '1px solid #e8ddd0', fontSize: '0.76rem' }}>
            <option value="">All {f.label}</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={() => exportCSV(columns, sorted, csvFilename)} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: 'none', background: '#1b2a3b', color: 'white', fontSize: '0.7rem', cursor: 'pointer' }}>
          ↓ CSV
        </button>
        <span style={{ fontSize: '0.7rem', color: '#888', alignSelf: 'center' }}>{sorted.length} of {rows.length}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', fontFamily: 'sans-serif' }}>
          <thead>
            <tr style={{ background: '#1b2a3b', color: 'white' }}>
              {columns.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {c.label}{sortCol === c.key ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r[rowKey] ?? i} style={{ background: i % 2 ? '#faf8f4' : 'white' }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#3a3a3a', maxWidth: c.wide ? 360 : undefined }}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CMD_TABS = [
  { id: 'skills', label: 'Skills Master' },
  { id: 'jobs', label: 'Job History' },
  { id: 'tools', label: 'Tools & Tech' },
  { id: 'engagements', label: 'Projects' },
  { id: 'vista', label: 'Vista Portfolio Outcomes' },
  { id: 'investor', label: 'Investor Profile' },
  { id: 'positioning', label: 'Positioning & Ventures' },
];

// ── Investor Profile dashboard (admin-only tab) ───────────────────────────
// Operating-principal / investment-partner view of the Career Master:
// certifications with renewal dates, deal transactions (role-in-deal by
// employer-at-time, investment type, individual return carve-outs), and
// KPIs an actively trading partner would track — deal-over-deal transaction
// size, majority-stake portfolio ARR growth YoY, new investments (12 mo).

// "Aug 2018" / "2019" / "2024-03" → comparable month index (year*12+month).
function entryMonthIndex(s) {
  const str = String(s || '');
  const year = str.match(/(19|20)\d{2}/)?.[0];
  if (!year) return null;
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const named = months.findIndex((m) => new RegExp(m, 'i').test(str));
  const numeric = str.match(/[-/](\d{1,2})/)?.[1];
  const month = named >= 0 ? named : numeric ? Math.min(11, Math.max(0, Number(numeric) - 1)) : 0;
  return Number(year) * 12 + month;
}

function fmtMusd(m) {
  if (m == null || Number.isNaN(Number(m))) return '—';
  const n = Number(m);
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2).replace(/\.?0+$/, '')}B` : `$${Math.round(n)}M`;
}

function InvestorEmptyNote({ children }) {
  return (
    <div style={{ padding: '1rem 1.2rem', background: BRAND.warmShell, borderRadius: 8, fontSize: '0.76rem', color: BRAND.slate, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

// Horizontal magnitude bars (single hue, value-labeled) — shared by the
// deal-size and ARR-growth charts so the Investor Profile reads as one system.
function InvestorBarRow({ label, sub, value, max, display, color }) {
  const pct = max > 0 ? Math.max(2, Math.round((Math.abs(value) / max) * 100)) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 4.2rem', gap: '0.7rem', alignItems: 'center', marginBottom: '0.6rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.22rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: BRAND.navy }}>{label}</span>
          {sub && <span style={{ fontSize: '0.62rem', color: BRAND.slate }}>{sub}</span>}
        </div>
        <div style={{ height: 8, background: BRAND.mist, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color || BRAND.teal, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: BRAND.navy, fontFamily: 'Georgia, serif', textAlign: 'right' }}>{display}</div>
    </div>
  );
}

function InvestorProfileDashboard({ master }) {
  const deals = master.deals || [];
  const certs = master.certifications || [];

  const sortedDeals = [...deals]
    .map((d) => ({ ...d, _month: entryMonthIndex(d.entryDate) }))
    .sort((a, b) => (a._month ?? 0) - (b._month ?? 0));
  const sizedDeals = sortedDeals.filter((d) => Number(d.dealSizeMusd) > 0);

  // KPI: deal-over-deal transaction size change (latest vs prior sized deal)
  let dealOverDeal = null;
  if (sizedDeals.length >= 2) {
    const prev = Number(sizedDeals[sizedDeals.length - 2].dealSizeMusd);
    const last = Number(sizedDeals[sizedDeals.length - 1].dealSizeMusd);
    if (prev > 0) dealOverDeal = Math.round(((last - prev) / prev) * 100);
  }

  const majorityActive = deals.filter((d) => d.isActivePortfolio && /majority/i.test(String(d.stakeType || '')));
  const nowIdx = new Date().getFullYear() * 12 + new Date().getMonth();
  const last12 = sortedDeals.filter((d) => d._month != null && nowIdx - d._month <= 11 && nowIdx - d._month >= 0);
  const measuredExits = deals.filter((d) => Number(d.exitValueMusd) > 0);
  const flaggedIndividual = deals.filter((d) => d.individualReturn);
  const totalVolume = deals.reduce((sum, d) => sum + (Number(d.dealSizeMusd) || 0), 0);

  const kpis = [
    { value: fmtMusd(totalVolume), label: 'Deal Volume Touched', note: `${deals.length} transactions`, accent: BRAND.gold },
    { value: dealOverDeal == null ? '—' : `${dealOverDeal > 0 ? '+' : ''}${dealOverDeal}%`, label: 'Deal-over-Deal Size Δ', note: 'Latest vs prior sized deal', accent: BRAND.teal },
    { value: String(majorityActive.length), label: 'Active Majority Portfolio', note: 'Managing-partner majority stakes', accent: BRAND.plum },
    { value: String(last12.length), label: 'New Investments (12 mo)', note: 'By deal entry date', accent: BRAND.green },
    { value: String(measuredExits.length), label: 'Measured Exits', note: 'Exit value on record', accent: BRAND.gold },
    { value: String(flaggedIndividual.length), label: 'Individual Return Flags', note: 'Carved-out contributor returns', accent: BRAND.teal },
  ];

  // Active majority-stake portfolio ARR growth YoY
  const arrRows = majorityActive
    .filter((d) => Number(d.arrCurrentMusd) > 0 && Number(d.arrPriorYearMusd) > 0)
    .map((d) => ({
      label: d.portfolioCompany || d.dealName,
      growth: Math.round(((Number(d.arrCurrentMusd) - Number(d.arrPriorYearMusd)) / Number(d.arrPriorYearMusd)) * 100),
      sub: `${fmtMusd(d.arrPriorYearMusd)} → ${fmtMusd(d.arrCurrentMusd)} ARR`,
    }));

  // New investments per month, last 12 months
  const monthCells = Array.from({ length: 12 }, (_, i) => {
    const idx = nowIdx - 11 + i;
    const count = sortedDeals.filter((d) => d._month === idx).length;
    const date = new Date(Math.floor(idx / 12), idx % 12, 1);
    return { key: idx, count, label: date.toLocaleString('en-US', { month: 'short' }) };
  });
  const monthMax = Math.max(1, ...monthCells.map((c) => c.count));

  const maxDealSize = Math.max(1, ...sizedDeals.map((d) => Number(d.dealSizeMusd)));
  const maxGrowth = Math.max(1, ...arrRows.map((r) => Math.abs(r.growth)));

  return (
    <div>
      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem', marginBottom: '1.5rem' }}>
        {kpis.map((k) => <KPITile key={k.label} {...k} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '0.5rem' }}>
        {/* ── Deal transaction size, deal over deal ── */}
        <section style={{ pageBreakInside: 'avoid' }}>
          <SectionHeadingMod>Deal Transaction Size — Deal over Deal</SectionHeadingMod>
          {sizedDeals.length === 0 ? (
            <InvestorEmptyNote>No sized deals yet — add Deal Size ($M) to deal records in Career Master → Deals.</InvestorEmptyNote>
          ) : sizedDeals.map((d) => (
            <InvestorBarRow key={d.id} label={d.dealName} sub={`${d.entryDate || ''}${d.investmentType ? ` · ${d.investmentType}` : ''}`}
              value={Number(d.dealSizeMusd)} max={maxDealSize} display={d.dealSize || fmtMusd(d.dealSizeMusd)} color={BRAND.teal} />
          ))}
        </section>

        {/* ── Active portfolio ARR growth YoY ── */}
        <section style={{ pageBreakInside: 'avoid' }}>
          <SectionHeadingMod>Active Portfolio — ARR Growth YoY</SectionHeadingMod>
          {arrRows.length === 0 ? (
            <InvestorEmptyNote>
              No active majority-stake holdings with ARR figures yet. Mark a deal as an active portfolio holding with stake type
              “Managing Partner — Majority” and enter prior-year + current ARR to light this up.
            </InvestorEmptyNote>
          ) : arrRows.map((r) => (
            <InvestorBarRow key={r.label} label={r.label} sub={r.sub} value={r.growth} max={maxGrowth}
              display={`${r.growth > 0 ? '+' : ''}${r.growth}%`} color={r.growth >= 0 ? BRAND.green : BRAND.plum} />
          ))}
        </section>
      </div>

      {/* ── New investments, last 12 months ── */}
      <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
        <SectionHeadingMod>New Investments — Last 12 Months</SectionHeadingMod>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.35rem', alignItems: 'end', height: 74 }}>
          {monthCells.map((c) => (
            <div key={c.key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: c.count ? BRAND.navy : BRAND.fog, fontWeight: c.count ? 700 : 400 }}>{c.count || ''}</div>
              <div style={{ height: Math.max(3, Math.round((c.count / monthMax) * 44)), background: c.count ? BRAND.teal : BRAND.mist, borderRadius: 3 }} />
              <div style={{ fontSize: '0.55rem', color: BRAND.fog, marginTop: '0.2rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
        {last12.length === 0 && (
          <div style={{ fontSize: '0.68rem', color: BRAND.fog, marginTop: '0.5rem' }}>
            No new investments recorded in the last 12 months — new deals appear here by entry date.
          </div>
        )}
      </section>

      {/* ── Deal transactions table ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <SectionHeadingMod>Deal Transactions</SectionHeadingMod>
        {deals.length === 0 ? (
          <InvestorEmptyNote>No deals recorded yet — seed or add them in Career Master → Deals.</InvestorEmptyNote>
        ) : (
          <DataTable
            csvFilename="deal_transactions"
            searchKeys={['dealName', 'portfolioCompany', 'employerAtTime', 'dealRole', 'notes']}
            filters={[
              { key: 'investmentType', label: 'Investment Types', options: [...new Set(deals.map((d) => d.investmentType).filter(Boolean))].sort() },
              { key: 'outcomeStatus', label: 'Outcomes', options: [...new Set(deals.map((d) => d.outcomeStatus).filter(Boolean))].sort() },
            ]}
            rows={deals}
            columns={[
              { key: 'dealName', label: 'Deal', wide: true },
              { key: 'employerAtTime', label: 'Employer at Time' },
              { key: 'dealRole', label: 'Role in Deal', wide: true, render: (r) => <span style={{ fontSize: '0.7rem' }}>{r.dealRole}</span> },
              { key: 'investmentType', label: 'Investment Type' },
              { key: 'dealSize', label: 'Size', render: (r) => r.dealSize || fmtMusd(r.dealSizeMusd) },
              { key: 'entryDate', label: 'Entry' },
              { key: 'exitValue', label: 'Exit', render: (r) => r.exitValue || (r.exitDate ? r.exitDate : '—') },
              { key: 'grossReturnPct', label: 'Gross %', render: (r) => (r.grossReturnPct != null ? `${r.grossReturnPct}%` : '—') },
              { key: 'individualReturn', label: 'Individual Return', render: (r) => r.individualReturn || (r.attributionPct != null ? `${r.attributionPct}% attribution` : '— not carved') },
              { key: 'outcomeStatus', label: 'Status' },
            ]}
          />
        )}
      </section>

      {/* ── Certifications & renewals ── */}
      <section>
        <SectionHeadingMod>Certifications & Renewal Dates</SectionHeadingMod>
        {certs.length === 0 ? (
          <InvestorEmptyNote>No certifications recorded yet — seed or add them in Career Master → Certifications.</InvestorEmptyNote>
        ) : (
          <DataTable
            csvFilename="certifications"
            searchKeys={['name', 'issuer', 'category', 'notes']}
            filters={[
              { key: 'category', label: 'Categories', options: [...new Set(certs.map((c) => c.category).filter(Boolean))].sort() },
              { key: 'status', label: 'Statuses', options: [...new Set(certs.map((c) => c.status).filter(Boolean))].sort() },
            ]}
            rows={certs}
            columns={[
              { key: 'name', label: 'Certification', wide: true },
              { key: 'issuer', label: 'Issuer' },
              { key: 'category', label: 'Category' },
              { key: 'firstEarned', label: 'First Earned', render: (r) => r.firstEarned || '—' },
              { key: 'lastRenewed', label: 'Most Recent Renewal', render: (r) => r.lastRenewed || '— to confirm' },
              { key: 'expires', label: 'Expires', render: (r) => r.expires || '—' },
              { key: 'status', label: 'Status' },
            ]}
          />
        )}
      </section>
    </div>
  );
}

export function CareerMasterDatabaseOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [master, setMaster] = useState(null);
  const [tab, setTab] = useState('skills');
  const [printMode, setPrintMode] = useState('interactive');
  useEffect(() => { fetchCareerMaster(ownerSlug).then(setMaster); }, [ownerSlug]);

  const isLoading = authLoading || !master;
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading career master database…
    </div>
  );

  const profileMeta = master.domains.find((d) => d.groupType === 'profile_meta');
  const jobChain = master.jobs.map((j) => j.company).filter((c, i, arr) => arr.indexOf(c) === i).join(' → ');
  const headerLine = [profileMeta?.extra?.education, jobChain, profileMeta?.extra?.location].filter(Boolean).join('  ·  ');

  // Non-admin visitors get the teaser + portfolio-request funnel: the tier
  // legend and a live sample of the skills table with a fade-out, then the
  // request/build-your-own popup.
  if (!isAdminUser(user)) {
    const sampleSkills = master.skills.slice(0, 7);
    return (
      <OutputFrame title="Career Master Database" eyebrow="Skills · Jobs · Tools · Engagements" gated>
        <TeaserFade note={`Preview — ${master.skills.length} skills · ${master.jobs.length} roles · ${master.tools.length} tools · ${master.engagements.length} engagements in the full database`}>
          <p style={{ fontSize: '0.85rem', color: '#536173', lineHeight: 1.65, marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
            The full searchable, sortable career database — every skill, role, tool, and engagement with quantified detail.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {TIER_LEGEND.map((t) => (
              <span key={t.tier} style={{ fontSize: '0.66rem', padding: '0.22rem 0.65rem', borderRadius: 14, background: '#faf8f4', border: `1px solid ${t.color}`, color: t.color, fontWeight: 700, fontFamily: 'sans-serif' }}>
                {t.tier} — {t.years}
              </span>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'sans-serif' }}>
            <thead>
              <tr>
                {['Skill', 'Category', 'Tier', 'Yrs', 'Engagements'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.45rem 0.6rem', background: BRAND.navy, color: 'white', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleSkills.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 ? '#faf8f4' : 'white' }}>
                  <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: BRAND.navy }}>{s.skill}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#555' }}>{s.category}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: BRAND.gold, fontWeight: 700 }}>{s.tier}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#555' }}>{s.yearsExp}</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#555' }}>{s.numEngagements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TeaserFade>
        <PortfolioRequestPrompt sourceOutput="career-master-database" master={master} user={user} />
      </OutputFrame>
    );
  }

  const vistaEngagements = master.engagements.filter((e) => e.investmentType);
  const domainRows = master.domains.filter((d) => d.groupType === 'domain');
  const ventureRows = master.domains.filter((d) => d.groupType === 'venture');
  const nicheRows = master.domains.filter((d) => d.groupType === 'niche_solution');

  return (
    <OutputFrame title="Career Master Database" eyebrow="Skills · Jobs · Tools · Engagements" printActions={<PrintModeActions onPrint={(m) => triggerPrint(setPrintMode, m, `Betsy-Salter_Career-Master-Database_${m === 'static' ? 'Static' : 'Interactive'}_${new Date().toISOString().slice(0, 10)}`)} />}>
      <div style={{ fontFamily: 'sans-serif', color: '#1b2a3b' }} data-print-mode={printMode}>
        {headerLine && <p className="sb-interactive-toolbar" style={{ fontSize: '0.78rem', color: '#666', marginBottom: '1.25rem' }}>{headerLine}</p>}

        {/* ── Proficiency legend ── */}
        <div className="sb-interactive-toolbar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {TIER_LEGEND.map((t) => (
            <span key={t.tier} style={{ fontSize: '0.68rem', padding: '0.25rem 0.7rem', borderRadius: 14, background: '#faf8f4', border: `1px solid ${t.color}`, color: t.color, fontWeight: 700 }}>
              {t.tier} — {t.years}, {t.engagements}
            </span>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="sb-interactive-toolbar" style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {CMD_TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? '#1b2a3b' : 'rgba(0,0,0,0.06)', color: tab === t.id ? 'white' : '#333' }}>
              {t.label} ({t.id === 'skills' ? master.skills.length : t.id === 'jobs' ? master.jobs.length : t.id === 'tools' ? master.tools.length : t.id === 'engagements' ? master.engagements.length : t.id === 'vista' ? vistaEngagements.length : t.id === 'investor' ? (master.deals?.length || 0) + (master.certifications?.length || 0) : ventureRows.length})
            </button>
          ))}
        </div>

        {tab === 'skills' && (
          <DataTable
            csvFilename="skills_master"
            searchKeys={['skill', 'category', 'resumeLanguage']}
            filters={[
              { key: 'category', label: 'Categories', options: [...new Set(master.skills.map((s) => s.category))].sort() },
              { key: 'tier', label: 'Tiers', options: TIER_ORDER },
            ]}
            rows={master.skills}
            columns={[
              { key: 'skill', label: 'Skill', wide: true },
              { key: 'category', label: 'Category' },
              { key: 'tier', label: 'Tier' },
              { key: 'yearsExp', label: 'Yrs' },
              { key: 'numEngagements', label: 'Engmts' },
              { key: 'firstUsed', label: 'First Used' },
              { key: 'resumeLanguage', label: 'Resume Language', wide: true, render: (r) => <span style={{ fontSize: '0.7rem' }}>{r.resumeLanguage}</span> },
            ]}
          />
        )}

        {tab === 'jobs' && (
          <DataTable
            csvFilename="job_history"
            searchKeys={['company', 'title', 'industry', 'keyMetrics']}
            filters={[{ key: 'industry', label: 'Industries', options: [...new Set(master.jobs.map((j) => j.industry))].sort() }]}
            rows={master.jobs}
            columns={[
              { key: 'company', label: 'Company' },
              { key: 'title', label: 'Title' },
              { key: 'startDate', label: 'Start' },
              { key: 'endDate', label: 'End' },
              { key: 'salary', label: 'Salary' },
              { key: 'jobFunction', label: 'Function' },
              { key: 'industry', label: 'Industry' },
              { key: 'keyMetrics', label: 'Key Metrics', wide: true, render: (r) => <span style={{ fontSize: '0.7rem' }}>{r.keyMetrics}</span> },
            ]}
          />
        )}

        {tab === 'tools' && (
          <DataTable
            csvFilename="tools_technology"
            searchKeys={['nameUsed', 'currentName', 'category', 'notes']}
            filters={[
              { key: 'category', label: 'Categories', options: [...new Set(master.tools.map((t) => t.category))].sort() },
              { key: 'tier', label: 'Tiers', options: TIER_ORDER },
            ]}
            rows={master.tools}
            columns={[
              { key: 'nameUsed', label: 'Name Used' },
              { key: 'currentName', label: 'Current Name' },
              { key: 'category', label: 'Category' },
              { key: 'tier', label: 'Tier' },
              { key: 'firstUsed', label: 'First Used' },
              { key: 'numRoles', label: '# Roles' },
              { key: 'notes', label: 'Notes', wide: true, render: (r) => <span style={{ fontSize: '0.7rem' }}>{r.notes}</span> },
            ]}
          />
        )}

        {tab === 'engagements' && (
          <DataTable
            csvFilename="projects_engagements"
            searchKeys={['clientDisplayName', 'employer', 'industry', 'context']}
            filters={[
              { key: 'employer', label: 'Employers', options: [...new Set(master.engagements.map((e) => e.employer))].sort() },
              { key: 'industry', label: 'Industries', options: [...new Set(master.engagements.map((e) => e.industry))].sort() },
            ]}
            rows={master.engagements}
            columns={[
              { key: 'clientDisplayName', label: 'Project / Client', wide: true, render: (r) => <a href={`/output/case-study/engagement-${r.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--sb-teal-deep, #02a1a6)' }}>{r.clientDisplayName || r.name}</a>, csv: (r) => r.clientDisplayName || r.name },
              { key: 'employer', label: 'Employer' },
              { key: 'industry', label: 'Industry' },
              { key: 'roles', label: 'Role(s)', render: (r) => (r.roles || []).join(' · '), csv: (r) => (r.roles || []).join(' · ') },
              { key: 'period', label: 'Period' },
              { key: 'scale', label: 'Scale', wide: true },
            ]}
          />
        )}

        {tab === 'vista' && (
          <div className="sb-interactive-toolbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
            {vistaEngagements.map((e) => (
              <div key={e.id} style={{ border: '0.5px solid #e8ddd0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ background: '#2d5a27', color: 'white', padding: '0.7rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>{e.clientDisplayName}</div>
                <div style={{ padding: '0.85rem 1rem', fontSize: '0.76rem', lineHeight: 1.9 }}>
                  <div><strong>Investment Type</strong> — {e.investmentType}</div>
                  {e.acquiredDetail && <div><strong>Acquired</strong> — {e.acquiredDetail}</div>}
                  {e.exitDetail && <div><strong>Exit</strong> — {e.exitDetail}</div>}
                  {e.financialReturn && <div><strong>Return</strong> — {e.financialReturn}</div>}
                  {e.outcomeStatus && <div><strong>Outcome</strong> — <span style={{ fontWeight: 700, color: '#2d5a27' }}>{e.outcomeStatus}</span></div>}
                </div>
              </div>
            ))}
            {vistaEngagements.length === 0 && <div style={{ color: '#aaa', padding: '2rem' }}>No portfolio-outcome data recorded.</div>}
          </div>
        )}

        {tab === 'investor' && <InvestorProfileDashboard master={master} />}

        {tab === 'positioning' && (
          <div className="sb-interactive-toolbar">
            {domainRows.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Strategic Domains</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {domainRows.map((d) => (
                    <div key={d.id} style={{ background: '#faf8f4', borderLeft: `3px solid ${d.accentColor || '#c4843a'}`, padding: '0.8rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.3rem' }}>{d.icon} {d.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#555', lineHeight: 1.5 }}>{d.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ventureRows.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Active Ventures</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {ventureRows.map((v) => (
                    <div key={v.id} style={{ background: '#1b2a3b', color: 'white', borderTop: `3px solid ${v.accentColor || '#c4843a'}`, padding: '0.9rem 1rem', borderRadius: 4 }}>
                      {v.extra?.category && <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: v.accentColor || '#c4843a', marginBottom: '0.4rem' }}>{v.extra.category}</div>}
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem' }}>{v.title}</div>
                      <div style={{ fontSize: '0.74rem', opacity: 0.85, lineHeight: 1.5 }}>{v.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {nicheRows.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Niche Solutions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  {nicheRows.map((n) => (
                    <div key={n.id} style={{ background: '#faf8f4', padding: '0.8rem 1rem', borderRadius: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>{n.icon} {n.title}</div>
                      {(n.items || []).map((it, i) => <div key={i} style={{ fontSize: '0.74rem', color: '#555', marginBottom: '0.15rem' }}>· {it}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profileMeta && (
              <div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Target Roles & Credentials</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {(profileMeta.items || []).map((t, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.3rem 0.85rem', borderRadius: 20, background: '#1b2a3b', color: '#c4843a' }}>{t}</span>
                  ))}
                </div>
                <p style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.7 }}>
                  <strong>Location:</strong> {profileMeta.extra?.location} · <strong>Education:</strong> {profileMeta.extra?.education} · <strong>Certifications:</strong> {profileMeta.extra?.certifications} · <strong>Website:</strong> {profileMeta.extra?.website}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </OutputFrame>
  );
}

// ── Portfolio hub ──────────────────────────────────────────────────────────
// Landing screen for the homepage "View Resume" button: pick one of the
// three data-driven portfolio views, or print/save the full combined set.
export function CareerPortfolioHubOutput() {
  const location = useLocation();
  const { loading, user } = useAuthState();
  const [master, setMaster] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('/output/resume');
  const [portfolioPresetCount, setPortfolioPresetCount] = useState(0);
  const targetProfile = new URLSearchParams(location.search).get('profile');
  useEffect(() => { fetchCareerMaster(targetProfile || '').then(setMaster); }, [targetProfile]);
  useEffect(() => {
    // The hub always shows the site owner's portfolio, so without an explicit
    // ?profile= it resolves the owner's primary preset — never the viewer's.
    const url = targetProfile
      ? `/api/member-site/by-slug/${encodeURIComponent(targetProfile)}/resume-url`
      : '/api/site/resume-url';
    fetch(url, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.url) setResumeUrl(d.url); })
      .catch(() => {});
    // Multiple role/industry-tagged resume presets marked portfolioVisible
    // → the resume card points at the Resume Portfolio index instead of a
    // single resume. Only checked when we know whose portfolio this is
    // (?profile=<slug>) — Betsy's own hub (no slug) keeps today's behavior.
    if (targetProfile) {
      fetch(`/api/output-templates/portfolio?owner=${encodeURIComponent(targetProfile)}&output_type=resume`)
        .then((r) => r.json())
        .then((d) => setPortfolioPresetCount((d.templates || []).length))
        .catch(() => setPortfolioPresetCount(0));
    }
  }, [targetProfile]);
  if (loading || !master) return null;

  const CARDS = [
    { title: 'Executive Resume Portfolio', desc: 'Formatted resume — profile, industries, technology, and full professional experience.', href: '/output/resume', stat: `${master.jobs.length} roles · ${master.skills.length} skills` },
    { title: 'Career Master Database', desc: 'Every skill, role, tool, and engagement — searchable, sortable, filterable, exportable to CSV.', href: '/output/career-master-database', stat: `${master.skills.length + master.jobs.length + master.tools.length + master.engagements.length} records` },
    { title: 'Case Study Portfolio', desc: 'Every engagement in full — context, actions, quantified outcomes, and client testimonials.', href: '/output/case-study-portfolio', stat: `${master.engagements.length} engagements` },
    { title: 'The Strategic Operator', desc: 'One-page visual career infographic — outcomes & exits, industry-duration bars, capability confidence, platform proficiency, client voice.', href: '/output/strategic-operator', stat: 'Print-ready infographic' },
  ];

  CARDS[0].href = portfolioPresetCount > 1
    ? `/output/resume-portfolio?profile=${encodeURIComponent(targetProfile)}`
    : resumeUrl;
  if (portfolioPresetCount > 1) {
    CARDS[0].title = 'Resume Portfolio';
    CARDS[0].desc = `${portfolioPresetCount} resume versions by role/industry — pick the one that fits.`;
    CARDS[0].stat = `${portfolioPresetCount} versions`;
  }

  return (
    <OutputFrame title="View My Work" eyebrow="Portfolio">
      {!user ? (
        <GatedPreview kind="portfolio" teaser={{ label: 'Choose a view', paragraphs: ['Three ways to see the work — sign up or sign in to open any of them.'], bullets: CARDS.map((c) => c.title) }} />
      ) : (
        <div style={{ fontFamily: 'Georgia, serif' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {CARDS.map((c) => (
              <a key={c.href} href={c.href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#faf8f4', border: '0.5px solid #e8ddd0', borderTop: '3px solid #c4843a', borderRadius: 4, padding: '1.25rem', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1b2a3b', marginBottom: '0.5rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#5a5a5a', lineHeight: 1.6, marginBottom: '0.75rem' }}>{c.desc}</div>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#02a1a6', fontFamily: 'sans-serif' }}>{c.stat} ↗</div>
                </div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#1b2a3b', borderRadius: 4 }}>
            <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Want everything in one document?</div>
            <a href="/output/full-portfolio" target="_blank" rel="noreferrer" className="sb-btn sb-btn-gold" style={{ padding: '0.6rem 1.5rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block' }}>
              Print / Save Full Portfolio ↗
            </a>
          </div>
        </div>
      )}
    </OutputFrame>
  );
}

// ── Resume Portfolio index — role/industry-tagged presets marked
// portfolioVisible in the output template builder, grouped for browsing.
// Linked from CareerPortfolioHubOutput's resume card when a member has 2+
// such presets; each card opens /output/resume?preset=<id>.
export function ResumePortfolioOutput() {
  const location = useLocation();
  const { loading, user } = useAuthState();
  const [items, setItems] = useState(null);
  const profile = new URLSearchParams(location.search).get('profile') || '';

  useEffect(() => {
    if (!profile) { setItems([]); return; }
    fetch(`/api/output-templates/portfolio?owner=${encodeURIComponent(profile)}&output_type=resume`)
      .then((r) => r.json())
      .then((d) => setItems(d.templates || []))
      .catch(() => setItems([]));
  }, [profile]);

  if (loading || !items) return null;

  if (!user) {
    return (
      <OutputFrame title="Resume Portfolio" eyebrow="Portfolio" gated>
        <GatedPreview kind="portfolio" teaser={{ label: 'Multiple resume versions', paragraphs: ['Sign up or sign in to browse resume versions by role and industry.'] }} />
      </OutputFrame>
    );
  }

  // A portfolio is still useful before named public presets have been saved.
  // Render the owner's configured primary resume (or the canonical v2/default
  // resume configuration) instead of presenting a dead empty state.
  if (items.length === 0) return <ResumeOutput />;

  // Group by roleLabel first, falling back to industryLabel, then "General".
  const groups = new Map();
  for (const item of items) {
    const key = item.meta?.roleLabel || item.meta?.industryLabel || 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return (
    <OutputFrame title="Resume Portfolio" eyebrow="Portfolio">
      <div style={{ fontFamily: 'Georgia, serif' }}>
        {[...groups.entries()].map(([group, groupItems]) => (
          <section key={group} style={{ marginBottom: '2rem' }}>
            <OutputHeading>{group}</OutputHeading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {groupItems.map((it) => (
                <a key={it.id} href={`/output/resume?preset=${encodeURIComponent(it.id)}&profile=${encodeURIComponent(profile)}`}
                  target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: '#faf8f4', border: '0.5px solid #e8ddd0', borderTop: '3px solid #c4843a', borderRadius: 4, padding: '1.1rem', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1b2a3b', marginBottom: '0.35rem' }}>{it.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#888' }}>
                      {[it.meta?.roleLabel, it.meta?.industryLabel].filter(Boolean).join(' · ') || 'View resume'} ↗
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </OutputFrame>
  );
}

// ── Full combined portfolio (Resume + Career Master Database + Case Studies) ──
// A single printable document stacking all three views — for members who
// want the whole thing as one PDF instead of three separate saves.
export function CareerFullPortfolioOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [page, setPage] = useState(null);
  const [wheel, setWheel] = useState(null);
  const [master, setMaster] = useState(null);
  useEffect(() => {
    api.getPublishedSite().then((site) => {
      const home = site.pages['home'];
      setPage(home);
      setWheel(home?.sections.find((s) => s.type === 'industryWheel')?.fields || {});
    }).catch(() => {});
    fetchCareerMaster(ownerSlug).then(setMaster);
  }, []);

  const isLoading = authLoading || !master || !page;
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading full portfolio…
    </div>
  );

  // Detailed documentation — admin-only while cost/licensing is finalized.
  if (!isAdminUser(user)) {
    return (
      <OutputFrame title="Full Portfolio" eyebrow="Resume + Career Database + Case Studies" gated>
        {!user ? (
          <GatedPreview kind="full portfolio" teaser={{ label: 'Everything, in one document', paragraphs: ['The complete resume, career database, and case study portfolio combined into a single printable document.'] }} />
        ) : (
          <AdminOnlyNotice kind="full portfolio" />
        )}
      </OutputFrame>
    );
  }

  const about = getHomeAboutFields(page);
  const jobs = buildResumeJobs(master, {});
  const parseTech = (s) => (s || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.split(':')[0].trim());
  let handsOn = parseTech(wheel?.handsOn), integrationDesign = parseTech(wheel?.integrationDesign), adjacent = parseTech(wheel?.adjacent);
  if (master.tools.length) {
    const bucketed = { hands_on: [], integration_design: [], adjacent: [] };
    master.tools.forEach((t) => { bucketed[toolWheelBucket(t)].push(t.currentName || t.nameUsed); });
    handsOn = bucketed.hands_on; integrationDesign = bucketed.integration_design; adjacent = bucketed.adjacent;
  }

  const SectionDivider = ({ children }) => (
    <div style={{ pageBreakBefore: 'always', marginTop: '2rem', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '3px solid #c4843a' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif' }}>Salt Basin Net Works Portfolio</div>
      <h2 style={{ fontSize: '1.6rem', fontFamily: 'Georgia, serif', color: '#1b2a3b', margin: 0 }}>{children}</h2>
    </div>
  );

  return (
    <OutputFrame title="Full Portfolio" eyebrow="Resume + Career Database + Case Studies" hideTitle printDocTitle={`Betsy-Salter_Full-Portfolio_${new Date().toISOString().slice(0, 10)}`}>
      <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }}>
        <SectionDivider>Executive Resume</SectionDivider>
        <ResumeLayoutModern about={about} timeline={{}} jobs={jobs} handsOn={handsOn} integrationDesign={integrationDesign} adjacent={adjacent} />

        <SectionDivider>Career Master Database — Skills</SectionDivider>
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.76rem' }}>
          <DataTable
            csvFilename="skills_master" searchKeys={['skill']} filters={[]} rows={master.skills}
            columns={[
              { key: 'skill', label: 'Skill', wide: true }, { key: 'category', label: 'Category' }, { key: 'tier', label: 'Tier' },
              { key: 'yearsExp', label: 'Yrs' }, { key: 'numEngagements', label: 'Engmts' },
            ]}
          />
        </div>

        <SectionDivider>Career Master Database — Job History</SectionDivider>
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.76rem' }}>
          <DataTable
            csvFilename="job_history" searchKeys={['company']} filters={[]} rows={master.jobs}
            columns={[
              { key: 'company', label: 'Company' }, { key: 'title', label: 'Title' }, { key: 'startDate', label: 'Start' },
              { key: 'endDate', label: 'End' }, { key: 'industry', label: 'Industry' },
            ]}
          />
        </div>

        <SectionDivider>Career Master Database — Tools & Tech</SectionDivider>
        <div style={{ fontFamily: 'sans-serif', fontSize: '0.76rem' }}>
          <DataTable
            csvFilename="tools_technology" searchKeys={['nameUsed']} filters={[]} rows={master.tools}
            columns={[
              { key: 'nameUsed', label: 'Name Used' }, { key: 'currentName', label: 'Current Name' },
              { key: 'category', label: 'Category' }, { key: 'tier', label: 'Tier' },
            ]}
          />
        </div>

        <SectionDivider>Case Study Portfolio</SectionDivider>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {master.engagements.map((e) => <CareerCaseStudyCard key={e.id} e={e} />)}
        </div>
      </div>
    </OutputFrame>
  );
}

// ── Domains & Niche Solutions output ─────────────────────────────────────────
// Showcases core domains, niche solutions, industry experience, and technology
// in a multi-column boho-style card layout adapted to SB brand.
export function DomainsOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading, user } = useAuthState();
  const [about, setAbout] = useState({});
  const [wheel, setWheel] = useState({});
  const [master, setMaster] = useState(null);
  useEffect(() => {
    api.getPublishedSite().then(site => {
      const home = site.pages['home'];
      setAbout(getHomeAboutFields(home));
      setWheel(home?.sections.find(s => s.type === 'industryWheel')?.fields || {});
    }).catch(() => {});
    fetchCareerMaster(ownerSlug).then(setMaster);
  }, []);

  if (loading || !master) return null;

  // Career Master (career_domains) is the source of truth when populated —
  // falls back to the hardcoded consts below for sites that haven't
  // adopted it.
  const masterDomains = master.domains.filter((d) => d.groupType === 'domain');
  const masterNiche = master.domains.filter((d) => d.groupType === 'niche_solution');
  const masterIndustries = master.domains.filter((d) => d.groupType === 'industry');
  const domainCategories = masterDomains.length
    ? masterDomains.map((d) => ({ title: d.title, icon: d.icon, items: d.items?.length ? d.items : [d.description] }))
    : DOMAIN_CATEGORIES;
  const nicheSolutions = masterNiche.length
    ? masterNiche.map((d) => ({ label: d.title, icon: d.icon, items: d.items || [] }))
    : NICHE_SOLUTIONS;
  const industries = masterIndustries.length
    ? masterIndustries.map((d) => ({ key: d.id, label: d.title, icon: d.icon, snapshot: d.description }))
    : INDUSTRIES;

  const parseTech = (s) => (s || '').split(',').map(p => p.trim()).filter(Boolean).map(p => p.split(':')[0].trim());
  let handsOn = parseTech(wheel?.handsOn);
  let integrationDesign = parseTech(wheel?.integrationDesign);
  let adjacent = parseTech(wheel?.adjacent);
  if (master.tools?.length) {
    const bucketed = { hands_on: [], integration_design: [], adjacent: [] };
    master.tools.forEach((t) => { bucketed[toolWheelBucket(t)].push(t.currentName || t.nameUsed); });
    handsOn = bucketed.hands_on;
    integrationDesign = bucketed.integration_design;
    adjacent = bucketed.adjacent;
  }
  const name = about.name || about.heading || 'Betsy Salter';
  const photoUrl = about.photoUrl || about.photo || null;

  if (!user) {
    return (
      <OutputFrame title={name + ' - Domains & Niche Solutions'} eyebrow="Domains" gated>
        <GatedPreview kind="domains profile" teaser={{ label: 'Core Domains Preview', paragraphs: ['Strategic operator with deep expertise across Revenue Systems, Private Equity, and AI-enabled data architecture.'], bullets: domainCategories.map(c => c.title) }} />
      </OutputFrame>
    );
  }

  return (
    // The header block below already shows the name — hideTitle avoids
    // showing it twice.
    <OutputFrame title={name + ' - Domains & Niche Solutions'} eyebrow="Domains" hideTitle>
      <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2.5px solid #c4843a' }}>
          {photoUrl && <img src={photoUrl} alt={name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c4843a' }} />}
          <div>
            <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1b2a3b', margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{name}</h1>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c4843a', marginTop: '0.3rem', fontFamily: 'sans-serif' }}>Domains · Capabilities · Niche Solutions</div>
          </div>
          <a href="/output/portfolio-appendix" target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--sb-teal-deep, #02a1a6)', textDecoration: 'none', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
            ↗ Full Skills & Proficiency Dashboard
          </a>
        </header>

        {/* ── Core Domains — 3-col card grid ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Core Domain Areas</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {domainCategories.map(cat => (
              <div key={cat.title} style={{ background: '#faf8f4', padding: '0.85rem 1rem', borderTop: '3px solid #c4843a' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', fontFamily: 'sans-serif', marginBottom: '0.5rem' }}>{cat.icon} {cat.title}</div>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#3a3a3a', paddingLeft: '0.6rem', marginBottom: '0.2rem', position: 'relative', lineHeight: 1.55 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#c4843a' }}>·</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Niche Solutions — 3-col ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Niche Solutions</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {nicheSolutions.map(ns => (
              <div key={ns.label} style={{ background: '#1b2a3b', color: 'white', padding: '0.85rem 1rem', borderTop: '3px solid #02a1a6' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#02a1a6', fontFamily: 'sans-serif', marginBottom: '0.5rem' }}>{ns.icon} {ns.label}</div>
                {ns.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', paddingLeft: '0.6rem', marginBottom: '0.2rem', position: 'relative', lineHeight: 1.55 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#02a1a6' }}>·</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── Industry Experience ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Industry Experience</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
            {industries.map(ind => (
              <div key={ind.key} style={{ pageBreakInside: 'avoid', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.65rem 0.8rem', background: '#faf8f4', borderLeft: '3px solid #c4843a' }}>
                <span style={{ fontSize: '1.1rem', marginTop: 2 }}>{ind.icon}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1b2a3b', marginBottom: '0.1rem' }}>{ind.label}</div>
                  <div style={{ fontSize: '0.74rem', color: '#5a5a5a', lineHeight: 1.55 }}>{ind.snapshot}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Technology Proficiencies ── */}
        <section>
          <DomainsHead>Technology Proficiencies</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[['Hands-On', handsOn, '#c4843a'], ['Integration & Design', integrationDesign, '#02a1a6'], ['Adjacent Exposure', adjacent, '#5a5a5a']].map(([label, items, color]) => (
              <div key={label} style={{ borderTop: `3px solid ${color}`, paddingTop: '0.6rem' }}>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color, fontFamily: 'sans-serif', marginBottom: '0.4rem' }}>{label}</div>
                {items.map((t, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: '#3a3a3a', paddingLeft: '0.5rem', marginBottom: '0.15rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color }}>·</span>{t}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </OutputFrame>
  );
}

function DomainsHead({ children }) {
  return (
    <div style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#1b2a3b', fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.7rem', paddingBottom: '0.25rem', borderBottom: '2px solid #c4843a' }}>
      {children}
    </div>
  );
}

// ── Portfolio Appendix / Skills Dashboard ─────────────────────────────────
// Modeled on Betsy's "Portfolio Appendix — Industry & Skills Proficiency
// Dashboard" reference design: proficiency-tier legend, category rollup
// tiles, a proportional Expert/Advanced/Proficient/Foundational bar,
// industry experience table, and the full skills inventory — all computed
// live from Career Master (career_skills / career_engagements) rather than
// a static snapshot.
const TIER_LEGEND = [
  { tier: 'Expert', color: '#2d5a27', years: '7+ years', engagements: '8+ engagements', note: 'Design ownership' },
  { tier: 'Advanced', color: '#1a3a7a', years: '4-7 years', engagements: '4-8 engagements', note: 'Cross-functional lead' },
  { tier: 'Proficient', color: '#7a5500', years: '2-4 years', engagements: '2-5 engagements', note: 'Hands-on delivery' },
  { tier: 'Foundational', color: '#666', years: '<2 years', engagements: '1-2 engagements', note: 'Emerging capability' },
];
const TIER_ORDER = ['Expert', 'Advanced', 'Proficient', 'Foundational'];
const TIER_BAR_COLOR = { Expert: '#2d8a3e', Advanced: '#3a6bb8', Proficient: '#c4843a', Foundational: '#999' };

// Maps career_skills.category (15 fine-grained categories, per the
// Portfolio Appendix skill inventory) onto the 4 meta-buckets the dashboard
// summarizes at the top.
const META_CATEGORY_MAP = {
  'Quote-to-Cash': 'Revenue Operations',
  'Pricing & Subscription': 'Revenue Operations',
  'Business Process': 'Process & Architecture',
  'Integration': 'Process & Architecture',
  'Solution Architecture': 'Process & Architecture',
  'Process Improvement': 'Process & Architecture',
  'Program Mgmt': 'Process & Architecture',
  'CRM & CPQ': 'Data & Integration',
  'Data & MDM': 'Data & Integration',
  'QA & Testing': 'Data & Integration',
  'Training & Change': 'Data & Integration',
  'Stakeholder Mgmt': 'Strategy & Advisory',
  'Business Dev': 'Strategy & Advisory',
  'Financial Strategy': 'Strategy & Advisory',
  'AI Operator': 'Strategy & Advisory',
};
const META_CATEGORY_ORDER = ['Revenue Operations', 'Process & Architecture', 'Data & Integration', 'Strategy & Advisory'];

// Best-effort year span extraction from free-text period strings like
// "Aug 2018–2019" or "2024–Present" — used only for the industry table's
// approximate "experience" column.
function yearSpanFromPeriods(periods) {
  const years = [];
  const now = new Date().getFullYear();
  periods.forEach((p) => {
    (p || '').match(/\d{4}/g)?.forEach((y) => years.push(Number(y)));
    if (/present/i.test(p || '')) years.push(now);
  });
  if (!years.length) return null;
  const span = Math.max(...years) - Math.min(...years);
  return span <= 0 ? '<1 yr' : `~${span} yrs`;
}

// ── Strategic Operator infographic one-pager ──────────────────────────────
// Elevated, print-ready career infographic modeled on the "Strategic
// Operator" reference visual — hero outcome metrics, industry-duration
// scaling bars, capability confidence, platform proficiency, AI-native
// product studio, and client-voice quotes, all live from Career Master.
// Admin-only alongside the other detailed documentation outputs.

function HeroMetricCard({ value, label, note, accent }) {
  return (
    <div style={{ background: BRAND.navy, borderTop: `3px solid ${accent}`, borderRadius: 10, padding: '1.2rem 1.1rem', pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: '2.4rem', fontWeight: 700, color: accent, fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(247,242,232,0.95)', fontWeight: 700, marginTop: '0.45rem', fontFamily: 'sans-serif' }}>{label}</div>
      {note && <div style={{ fontSize: '0.7rem', color: 'rgba(247,242,232,0.7)', marginTop: '0.35rem', lineHeight: 1.55 }}>{note}</div>}
    </div>
  );
}

function computeHeroMetrics(master) {
  const engagements = master?.engagements || [];
  const exitFigure = extractDollarMax(engagements.map((e) => e.exitDetail)) || '$4.6B';
  const arrMatch = engagements.flatMap((e) => e.metrics || []).find((m) => /ARR automated/i.test(m));
  const arrFigure = (arrMatch && arrMatch.match(/\$[\d.]+[BM]\+?/i)?.[0]) || '$500M+';
  const returnPct = engagements
    .flatMap((e) => [e.exitDetail, e.scale])
    .map((s) => String(s || '').match(/~?(\d{2,3})%\s*return/i)?.[1])
    .find(Boolean) || '142';
  const peCount = engagements.filter((e) => e.investmentType).length || 4;
  return [
    { value: exitFigure, label: `Exit · ${returnPct}% Investor Return`, note: 'Led Q2C design for Apptio — Vista acquisition through the IBM exit.', accent: BRAND.gold },
    { value: arrFigure, label: 'Recurring Revenue Automated', note: 'Proprietary data-migration methodology eliminated manual renewal intervention at scale.', accent: '#7FA8B8' },
    { value: String(peCount), label: 'PE Portfolio Transformations', note: 'Post-acquisition value creation across Vista Equity Partners software holdings.', accent: '#C98BAD' },
    { value: String(engagements.length), label: 'Engagements Documented', note: 'Full case-study depth in the Career Master database.', accent: '#9DBB98' },
  ];
}

export function StrategicOperatorOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [master, setMaster] = useState(null);
  useEffect(() => { fetchCareerMaster(ownerSlug).then(setMaster); }, [ownerSlug]);

  const isLoading = authLoading || !master;
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading strategic operator profile…
    </div>
  );

  // Non-admin visitors get the teaser + portfolio-request funnel: the hero
  // band and live outcome metrics with a fade-out, then the popup.
  if (!isAdminUser(user)) {
    const teaserMetrics = computeHeroMetrics(master);
    return (
      <OutputFrame title="The Strategic Operator" eyebrow="Career Infographic" gated hideTitle>
        <TeaserFade note={`Preview — ${master.engagements.length} engagements · ${master.skills.length} skills in the full infographic`}>
          <header style={{ background: BRAND.navy, borderRadius: 10, padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: BRAND.gold, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>
              Salt Basin Net Works · Strategic Operator Profile
            </div>
            <h1 style={{ fontSize: '2rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: BRAND.warmShell, margin: 0, lineHeight: 1.05, fontFamily: 'Georgia, serif' }}>Betsy Salter</h1>
            <div style={{ fontSize: '0.64rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.gold, marginTop: '0.4rem', fontFamily: 'sans-serif' }}>
              AI-Native Revenue &amp; GTM Transformation Leader · Q2R Architect · PE Value Creation
            </div>
            <div style={{ marginTop: '0.8rem', fontStyle: 'italic', fontSize: '0.9rem', color: BRAND.gold, fontFamily: 'Georgia, serif' }}>
              “I build for the customer you keep, not just the deal you close.”
            </div>
          </header>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            {teaserMetrics.map((m) => <HeroMetricCard key={m.label} {...m} />)}
          </div>
        </TeaserFade>
        <PortfolioRequestPrompt sourceOutput="strategic-operator" master={master} user={user} />
      </OutputFrame>
    );
  }

  const heroMetrics = computeHeroMetrics(master);
  const statStrip = computeExecutiveKPIs(master).slice(3);
  const capabilityMeters = computeCapabilityMeters(master);
  const industryDurations = computeIndustryDurations(master);
  const toolBars = computeToolProficiency(master, 12);
  const clientQuotes = computeClientQuotes(master, 3);
  const ventures = (master.domains || [])
    .filter((d) => d.groupType === 'venture')
    .filter((d) => {
      const extra = typeof d.extra === 'string' ? (() => { try { return JSON.parse(d.extra); } catch { return {}; } })() : (d.extra || {});
      return extra.isSaltBasinBrand !== false; // POP Decor is a separate aesthetic — keep it off Salt Basin artifacts
    });

  return (
    <OutputFrame title="Betsy Salter — The Strategic Operator" eyebrow="Career Infographic" hideTitle printDocTitle={`Betsy-Salter_Strategic-Operator-Infographic_${new Date().toISOString().slice(0, 10)}`}>
      <div style={{ fontFamily: 'Georgia, serif', color: BRAND.graphite }}>

        {/* ── Hero band ── */}
        <header style={{ background: BRAND.navy, borderRadius: 10, padding: '1.75rem 2rem', marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: BRAND.gold, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: '0.55rem' }}>
            Salt Basin Net Works · Strategic Operator Profile
          </div>
          <h1 style={{ fontSize: '2.4rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: BRAND.warmShell, margin: 0, lineHeight: 1.05, fontFamily: 'Georgia, serif' }}>
            Betsy Salter
          </h1>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.gold, marginTop: '0.45rem', fontFamily: 'sans-serif' }}>
            AI-Native Revenue &amp; GTM Transformation Leader · Q2R Architect · PE Value Creation
          </div>
          <p style={{ fontSize: '0.88rem', color: 'rgba(247,242,232,0.85)', lineHeight: 1.7, margin: '0.8rem 0 0', maxWidth: 620 }}>
            Bridging complex enterprise operating systems and scalable revenue workflows — automating hundreds of
            millions in recurring revenue, supporting multi-billion-dollar exits, and building AI-native diagnostic
            products for the Private Equity sector.
          </p>
          <div style={{ marginTop: '0.85rem', fontStyle: 'italic', fontSize: '0.92rem', color: BRAND.gold }}>
            “I build for the customer you keep, not just the deal you close.”
          </div>
        </header>

        {/* ── High-impact outcomes & exits ── */}
        <section style={{ marginBottom: '1.5rem' }}>
          <SectionHeadingMod>High-Impact Outcomes &amp; Exits</SectionHeadingMod>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
            {heroMetrics.map((m) => <HeroMetricCard key={m.label} {...m} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.7rem' }}>
            {statStrip.map((k) => <KPITile key={k.label} {...k} />)}
          </div>
        </section>

        {/* ── Industry duration + capability confidence ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <IndustryDurationSection rows={industryDurations} heading="Deep Industry Experience & Duration" />
          {capabilityMeters.length > 0 && (
            <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
              <SectionHeadingMod>Capability Confidence</SectionHeadingMod>
              {capabilityMeters.map((c) => <CapabilityMeter key={c.name} {...c} />)}
            </section>
          )}
        </div>

        {/* ── Platform proficiency ── */}
        <ToolProficiencySection tools={toolBars} heading="Quote-to-Revenue Platform Proficiency" />

        {/* ── AI-native product studio ── */}
        {ventures.length > 0 && (
          <section style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <SectionHeadingMod>AI-Native Product Studio</SectionHeadingMod>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.7rem' }}>
              {ventures.map((v) => {
                const extra = typeof v.extra === 'string' ? (() => { try { return JSON.parse(v.extra); } catch { return {}; } })() : (v.extra || {});
                return (
                  <div key={v.title} style={{ background: BRAND.mist, borderLeft: `3px solid ${v.accentColor || BRAND.teal}`, borderRadius: 6, padding: '0.8rem 0.95rem', pageBreakInside: 'avoid' }}>
                    <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.slate, fontFamily: 'sans-serif', marginBottom: '0.2rem' }}>{extra.category || 'Venture'}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: BRAND.navy, marginBottom: '0.25rem' }}>{v.title}</div>
                    <div style={{ fontSize: '0.72rem', color: BRAND.graphite, lineHeight: 1.6 }}>{v.description}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Client voice ── */}
        {clientQuotes.length > 0 && (
          <section style={{ pageBreakInside: 'avoid' }}>
            <SectionHeadingMod>Client Voice</SectionHeadingMod>
            <ClientVoiceSection quotes={clientQuotes} />
          </section>
        )}
      </div>
    </OutputFrame>
  );
}

export function PortfolioAppendixOutput() {
  const ownerSlug = useOutputOwnerSlug();
  const { loading: authLoading, user } = useAuthState();
  const [master, setMaster] = useState(null);
  const [printMode, setPrintMode] = useState('interactive');
  useEffect(() => { fetchCareerMaster(ownerSlug).then(setMaster); }, [ownerSlug]);

  const isLoading = authLoading || !master;
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontSize: '1rem' }}>
      Loading portfolio appendix…
    </div>
  );

  // Detailed documentation — admin-only while cost/licensing is finalized.
  if (!isAdminUser(user)) {
    return (
      <OutputFrame title="Portfolio Appendix" eyebrow="Skills Dashboard" gated>
        {!user ? (
          <GatedPreview
            kind="portfolio appendix"
            teaser={{
              label: 'Industry & Skills Proficiency Dashboard',
              paragraphs: ['Proficiency-tier breakdown, category rollups, career timeline, tool inventory, and certifications — the full Career Master database.'],
              bullets: [`${master.skills.length} skills tracked`, `${master.jobs.length} roles`, `${master.tools.length} tools`, `${master.engagements.length} engagements`],
            }}
          />
        ) : (
          <AdminOnlyNotice kind="portfolio appendix" />
        )}
      </OutputFrame>
    );
  }

  const skills = master.skills;
  const engagements = master.engagements;
  const jobs = sortMostRecentRoles(master.jobs || []);
  const tools = [...(master.tools || [])].sort((a, b) => (TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)) || (Number(b.numRoles) || 0) - (Number(a.numRoles) || 0));
  const certifications = master.certifications || [];

  const tierCounts = TIER_ORDER.reduce((acc, t) => ({ ...acc, [t]: skills.filter((s) => s.tier === t).length }), {});
  const totalSkills = skills.length || 1;

  const metaRollups = META_CATEGORY_ORDER.map((meta) => {
    const inBucket = skills.filter((s) => META_CATEGORY_MAP[s.category] === meta);
    const expertCount = inBucket.filter((s) => s.tier === 'Expert').length;
    const avgYears = inBucket.length ? (inBucket.reduce((sum, s) => sum + (Number(s.yearsExp) || 0), 0) / inBucket.length) : 0;
    const totalEngagements = inBucket.reduce((sum, s) => sum + (Number(s.numEngagements) || 0), 0);
    return { meta, expertCount, avgYears: avgYears.toFixed(0), totalEngagements };
  });

  const byCategory = new Map();
  skills.forEach((s) => { byCategory.set(s.category, (byCategory.get(s.category) || 0) + 1); });

  const byIndustry = new Map();
  engagements.forEach((e) => {
    const key = e.industry || 'Other';
    const bucket = byIndustry.get(key) || { count: 0, periods: [] };
    bucket.count += 1;
    bucket.periods.push(e.period);
    byIndustry.set(key, bucket);
  });
  const industryRows = Array.from(byIndustry.entries())
    .map(([industry, v]) => ({ industry, count: v.count, span: yearSpanFromPeriods(v.periods) }))
    .sort((a, b) => b.count - a.count);

  const sortedSkills = [...skills].sort((a, b) => (a.category || '').localeCompare(b.category || '') || TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));

  return (
    <OutputFrame title="Portfolio Appendix" eyebrow="Industry & Skills Proficiency Dashboard" printActions={<PrintModeActions onPrint={(m) => triggerPrint(setPrintMode, m, `Betsy-Salter_Portfolio-Appendix_${m === 'static' ? 'Static' : 'Interactive'}_${new Date().toISOString().slice(0, 10)}`)} />}>
      <div style={{ fontFamily: 'Georgia, serif', color: '#1b2a3b' }} data-print-mode={printMode}>

        {/* ── Proficiency Level Definitions ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Proficiency Level Definitions</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {TIER_LEGEND.map((t) => (
              <div key={t.tier} style={{ background: '#faf8f4', borderTop: `3px solid ${t.color}`, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: t.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{t.tier}</div>
                <div style={{ fontSize: '0.72rem', color: '#3a3a3a', lineHeight: 1.6 }}>{t.years}<br />{t.engagements}<br />{t.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Skills Dashboard Summary ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Skills Dashboard Summary</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {metaRollups.map((r) => (
              <div key={r.meta} style={{ background: '#1b2a3b', color: 'white', padding: '0.9rem 1rem', borderRadius: 2 }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4843a', marginBottom: '0.4rem' }}>{r.meta}</div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
                  {r.expertCount} Expert skills<br />
                  {r.avgYears} yrs avg depth<br />
                  {r.totalEngagements} engagements
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Proficiency Distribution ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Proficiency Distribution ({totalSkills} skills)</DomainsHead>
          <div style={{ display: 'flex', height: 22, borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
            {TIER_ORDER.map((t) => tierCounts[t] > 0 && (
              <div key={t} title={`${t}: ${tierCounts[t]}`} style={{ width: `${(tierCounts[t] / totalSkills) * 100}%`, background: TIER_BAR_COLOR[t] }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            {TIER_ORDER.map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#3a3a3a' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: TIER_BAR_COLOR[t], display: 'inline-block' }} />
                {t} ({tierCounts[t]})
              </div>
            ))}
          </div>
        </section>

        {/* ── Skills by Category ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Skills by Category</DomainsHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem 1.5rem' }}>
            {Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} style={{ fontSize: '0.8rem', color: '#3a3a3a' }}>
                <span style={{ color: '#c4843a', fontWeight: 700 }}>{count}</span> {cat}
              </div>
            ))}
          </div>
        </section>

        {/* ── Industry Experience ── */}
        <section style={{ marginBottom: '1.75rem' }}>
          <DomainsHead>Industry Experience ({industryRows.length} sectors)</DomainsHead>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#1b2a3b', color: 'white' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Industry</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Experience</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Engagements</th>
              </tr>
            </thead>
            <tbody>
              {industryRows.map((row, i) => (
                <tr key={row.industry} style={{ background: i % 2 ? '#faf8f4' : 'white' }}>
                  <td style={{ padding: '0.4rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{row.industry}</td>
                  <td style={{ padding: '0.4rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{row.span || '—'}</td>
                  <td style={{ padding: '0.4rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Full Skills Inventory ── */}
        <section>
          <DomainsHead>Skills Inventory ({skills.length} skills)</DomainsHead>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ background: '#1b2a3b', color: 'white' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Skill</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tier</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Yrs</th>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Engmts</th>
              </tr>
            </thead>
            <tbody>
              {sortedSkills.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 ? '#faf8f4' : 'white', pageBreakInside: 'avoid' }}>
                  <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{s.skill}</td>
                  <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{s.category}</td>
                  <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: TIER_BAR_COLOR[s.tier], fontWeight: 700 }}>{s.tier}</td>
                  <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{s.yearsExp}</td>
                  <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{s.numEngagements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Career Timeline (Career Master career_jobs — the full role
             history, not the website's About/timeline copy) ── */}
        {jobs.length > 0 && (
          <section style={{ marginTop: '1.75rem' }}>
            <DomainsHead>Career Timeline ({jobs.length} roles)</DomainsHead>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#1b2a3b', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Employer</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Dates</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Industry / Function</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id} style={{ background: i % 2 ? '#faf8f4' : 'white', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>{j.company}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{j.title}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{[j.startDate, j.endDate].filter(Boolean).join(' – ')}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{[j.industry, j.jobFunction].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Tools & Platform Inventory (career_tools — every tool tracked,
             not just the Expert/Advanced highlight bars used elsewhere) ── */}
        {tools.length > 0 && (
          <section style={{ marginTop: '1.75rem' }}>
            <DomainsHead>Tools &amp; Platform Inventory ({tools.length} tools)</DomainsHead>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ background: '#1b2a3b', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tool</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tier</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>First Used</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Roles</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 ? '#faf8f4' : 'white', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 600 }}>
                      {t.currentName || t.nameUsed}
                      {t.currentName && t.nameUsed && t.currentName !== t.nameUsed && (
                        <span style={{ fontWeight: 400, fontStyle: 'italic', color: '#999', fontSize: '0.68rem' }}> · formerly {t.nameUsed}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{t.category}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: TIER_BAR_COLOR[t.tier] || '#5a5a5a', fontWeight: 700 }}>{t.tier}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{t.firstUsed}</td>
                    <td style={{ padding: '0.35rem 0.6rem', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#5a5a5a' }}>{t.numRoles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Certifications (career_certifications) ── */}
        {certifications.length > 0 && (
          <section style={{ marginTop: '1.75rem' }}>
            <DomainsHead>Certifications ({certifications.length})</DomainsHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ background: '#faf8f4', borderLeft: '3px solid #c4843a', padding: '0.65rem 0.8rem', pageBreakInside: 'avoid' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1b2a3b' }}>{c.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#5a5a5a', marginTop: '0.15rem' }}>{[c.issuer, c.category].filter(Boolean).join(' · ')}</div>
                  <div style={{ fontSize: '0.66rem', color: '#888', marginTop: '0.15rem' }}>{[c.status, c.firstEarned && `Earned ${c.firstEarned}`, c.expires && `Expires ${c.expires}`].filter(Boolean).join(' · ')}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </OutputFrame>
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
  const templateV2 = useOutputTemplateConfig('proposal');
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
  if (loading || templateV2.loading) return null;
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

  // ── 4-layer template-driven render (schemaVersion 2) ──
  if (templateV2.config && hasOutputLayerContent(templateV2.config)) {
    const ctx = { data, rollupCatalog: templateV2.rollupCatalog };
    return (
      <OutputFrame title={data.title} eyebrow={`Proposal · ${data.tag}`} afterFooter={<MemberFooterSlot config={templateV2.config} />}>
        <OutputTemplateBody config={templateV2.config} ctx={ctx} sitePages={templateV2.sitePages} master={null} />
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
  const templateV2 = useOutputTemplateConfig('one-pager');
  if (loading || templateV2.loading) return null;
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

  // ── 4-layer template-driven render (schemaVersion 2) ──
  if (templateV2.config && hasOutputLayerContent(templateV2.config)) {
    const ctx = { rollupCatalog: templateV2.rollupCatalog };
    return (
      <OutputFrame title="Salt Basin — One-Pager" eyebrow="Capabilities Summary" afterFooter={<MemberFooterSlot config={templateV2.config} />}>
        <OutputTemplateBody config={templateV2.config} ctx={ctx} sitePages={templateV2.sitePages} master={null} />
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
  const templateV2 = useOutputTemplateConfig('build-summary');

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
          <Link to="/login" className="sb-btn sb-btn-gold" style={{ marginTop: '1.5rem' }}>
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

  // ── 4-layer template-driven render (schemaVersion 2) ──
  if (!templateV2.loading && templateV2.config && hasOutputLayerContent(templateV2.config)) {
    const ctx = { totals, capabilities, workarounds, items, rollupCatalog: templateV2.rollupCatalog };
    return (
      <OutputFrame title="Salt Basin · Build Progress Report" eyebrow="Internal · To-Date Build" afterFooter={<MemberFooterSlot config={templateV2.config} />}>
        <OutputTemplateBody config={templateV2.config} ctx={ctx} sitePages={templateV2.sitePages} master={null} />
      </OutputFrame>
    );
  }

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
            Methodology: hours by person come from the Contribution Intelligence Methodology — real JSONL session-log burst analysis where a session transcript survives, a disclosed lower-confidence estimate where it doesn't (see the breakdown below). Claude spend is calculated at $115/hr (quality-adjusted rate, RATE_CONFIGS_2026). Tier savings are listed costs of the paid alternatives that were sidestepped.
          </p>
        </section>

        {/* ── Build progress over time ── */}
        <BuildProgressCharts />

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
            <SumChip label="Observed human-plus-AI cost" value={dollars(totals.costUsdClaude)} accent />
            <SumChip label="Estimated equivalent traditional cost" value={dollars(totals.traditionalCostUsd)} />
            <SumChip label="Estimated cost avoided" value={dollars(totals.estimatedCostAvoidedUsd)} accent />
            <SumChip label="Cost leverage ratio" value={totals.costLeverageRatio ? `${totals.costLeverageRatio}x` : '—'} />
          </div>
          <p style={{ ...paraStyle, fontSize: '0.85rem' }}>
            Estimate methodology: a traditional team is assumed to take the <strong>same wall-clock duration</strong> as the AI-augmented build, priced at <strong>$175/hour</strong> (onshore senior-engineer benchmark, RATE_CONFIGS_2026). This is a floor comparison, not a claim about how much longer traditional delivery would actually take, and not a claim that AI "saved" this amount — engineer-equivalent effort (a traditional team doing this same scope from scratch, including its own spec/architecture time) has not been independently estimated and would very likely be higher. See the Contribution Intelligence breakdown below for the activity-type pricing this is built from.
          </p>
        </section>

        {/* ── Contribution Intelligence Methodology breakdown ── */}
        <ContributionBreakdown items={items} />

        {/* ── Why the Director's hours aren't interchangeable ── */}
        <DirectorDifferentiator />

        {/* ── Fee-type breakdown ── */}
        <FeeTypeBreakdown items={items} />

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

// ──────────────────────────────────────────────────────────────────
// ContributionBreakdown — activity-type × pricing breakdown from the
// Contribution Intelligence Methodology. hoursClaude maps to Code
// Generation ($115/hr, RATE_CONFIGS_2026 claude_quality_adjusted);
// hoursStrategicDirection/hoursDomainAuthoring are a sub-breakdown of
// hoursBetsy (real burst-level content classification, see
// turn-classification.json and apportion-strategic-domain-hours.mjs) —
// what's left of hoursBetsy after subtracting those two is Active
// Supervision. All three Betsy types price at $225/hr (betsy_director);
// hoursClaude maps to Code Generation at $115/hr
// (claude_quality_adjusted).
// ──────────────────────────────────────────────────────────────────
const CODE_GEN_RATE = 115;
const DIRECTOR_RATE = 225;

function ContributionBreakdown({ items }) {
  const dollars = (n) => `$${(Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const delivered = (items || []).filter((it) => it.status === 'deployed' || it.status === 'completed');

  const hoursClaude = delivered.reduce((s, it) => s + (it.hoursClaude || 0), 0);
  const hoursBetsy = delivered.reduce((s, it) => s + (it.hoursBetsy || 0), 0);
  const hoursStrategic = delivered.reduce((s, it) => s + (it.hoursStrategicDirection || 0), 0);
  const hoursDomain = delivered.reduce((s, it) => s + (it.hoursDomainAuthoring || 0), 0);
  const hoursSupervision = Math.max(0, hoursBetsy - hoursStrategic - hoursDomain);

  const codeGenCost = hoursClaude * CODE_GEN_RATE;
  const strategicCost = hoursStrategic * DIRECTOR_RATE;
  const domainCost = hoursDomain * DIRECTOR_RATE;
  const supervisionCost = hoursSupervision * DIRECTOR_RATE;

  const measured = delivered.filter((it) => it.dataSource === 'measured_burst_analysis');
  const estimated = delivered.filter((it) => it.dataSource === 'measured_turn_count_estimate');
  const measuredHours = measured.reduce((s, it) => s + (it.hoursClaude || 0) + (it.hoursBetsy || 0), 0);
  const estimatedHours = estimated.reduce((s, it) => s + (it.hoursClaude || 0) + (it.hoursBetsy || 0), 0);

  const rows = [
    { type: 'Code Generation', contributor: 'Claude', hours: hoursClaude, rate: CODE_GEN_RATE, cost: codeGenCost },
    { type: 'Strategic Direction', contributor: 'Betsy Salter', hours: hoursStrategic, rate: DIRECTOR_RATE, cost: strategicCost },
    { type: 'Domain Authoring', contributor: 'Betsy Salter', hours: hoursDomain, rate: DIRECTOR_RATE, cost: domainCost },
    { type: 'Active Supervision', contributor: 'Betsy Salter', hours: hoursSupervision, rate: DIRECTOR_RATE, cost: supervisionCost },
  ];

  return (
    <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
      <OutputHeading>Contribution Intelligence Methodology™</OutputHeading>
      <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
        Activity type → pricing breakdown
      </h2>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--sb-taupe)' }}>
              {['Activity Type', 'Contributor', 'Hours', 'Rate', 'Cost'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Activity Type' || h === 'Contributor' ? 'left' : 'right', padding: '0.5rem 0.6rem', color: 'var(--sb-teal-deep)', fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.type} style={{ borderBottom: '0.5px solid var(--sb-taupe)' }}>
                <td style={{ padding: '0.55rem 0.6rem', color: 'var(--sb-navy)' }}>{r.type}</td>
                <td style={{ padding: '0.55rem 0.6rem' }}>{r.contributor}</td>
                <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>{r.hours.toFixed(2)}</td>
                <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right' }}>${r.rate}/hr</td>
                <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>{dollars(r.cost)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '0.55rem 0.6rem', fontWeight: 700, color: 'var(--sb-navy)' }} colSpan={2}>Total AI-augmented build cost</td>
              <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>{(hoursClaude + hoursBetsy).toFixed(1)}</td>
              <td />
              <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>{dollars(codeGenCost + strategicCost + domainCost + supervisionCost)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <SumChip label="Measured (real session logs)" value={`${measuredHours.toFixed(1)}h`} accent />
        <SumChip label="Estimated (lower confidence)" value={`${estimatedHours.toFixed(1)}h`} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic' }}>
        Strategic Direction / Domain Authoring / Active Supervision are a content-based split of the same hoursBetsy already counted above — not additional hours. Split by classifying real human turn content within each session's bursts (keyword + length heuristics, disclosed and inspectable — not a black box), then relabeling each burst at its existing weight rather than adding new time. Bursts without a matching item still weren't classified (the orphaned pre-2026-06-07 batch has no surviving transcript to classify at all) — those hours remain entirely in Active Supervision by default, which likely understates Strategic Direction/Domain Authoring for that batch specifically.
      </p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// FeeTypeBreakdown — how the underlying Claude usage was actually paid
// for: covered by the Claude Pro subscription's included usage, or
// funded by a "Prepaid extra usage" overage purchase. Classified from
// real Anthropic billing receipts against each item's build-session
// window (purchase-date precision, not per-token metering — disclosed).
// Note this shows the MODELED $115/hr value of the hours in each bucket,
// not a literal allocation of receipt dollars — those are shown
// separately as the real amount paid to Anthropic.
// ──────────────────────────────────────────────────────────────────
const FEE_TYPE_LABELS = {
  ad_hoc_overage: 'Ad hoc (prepaid extra usage)',
  subscription_included: 'Subscription-included',
};

function FeeTypeBreakdown({ items }) {
  const dollars = (n) => `$${(Math.round((n || 0) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const delivered = (items || []).filter((it) => it.status === 'deployed' || it.status === 'completed');
  const classified = delivered.filter((it) => it.feeType);
  const unclassified = delivered.filter((it) => !it.feeType);

  const byType = {};
  for (const it of classified) {
    const key = it.feeType;
    byType[key] = byType[key] || { hours: 0, cost: 0, count: 0 };
    byType[key].hours += (it.hoursClaude || 0);
    byType[key].cost += (it.costUsdClaude || 0);
    byType[key].count += 1;
  }

  return (
    <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
      <OutputHeading>Anthropic Billing — Fee Type</OutputHeading>
      <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
        Subscription-included vs. ad hoc overage
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        {Object.entries(byType).map(([key, v]) => (
          <SumChip
            key={key}
            label={`${FEE_TYPE_LABELS[key] || key} (${v.count} items)`}
            value={`${v.hours.toFixed(1)}h · ${dollars(v.cost)}`}
            accent={key === 'subscription_included'}
          />
        ))}
        {unclassified.length > 0 && (
          <SumChip label={`Not yet classified (${unclassified.length} items)`} value="—" />
        )}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic' }}>
        Classified against real Anthropic receipts (Claude Pro renewals vs. "Prepaid extra usage, Individual plan" purchases) at the build-session date level, not per-token metering. Real Anthropic spend across the build to date: $60 in Pro plan renewals (Apr–Jun 2026) + $265 in ad hoc overage purchases = <strong>$325 actual dollars paid</strong> — a different, much smaller number than the ${(Object.values(byType).reduce((s, v) => s + v.cost, 0)).toFixed(0)} modeled quality-adjusted value of Claude's hours shown above. The $115/hr figure values the work; the $325 figure is what actually left the bank account.
      </p>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// DirectorDifferentiator — the hour count alone doesn't explain why
// Betsy's role isn't interchangeable with a generic "reviewer." Pulls
// the real contribution-type definitions and irreducible/reducible split
// from contributionMethodology.js (via /api/backlog/methodology) so this
// narrative stays a single source of truth instead of duplicated copy.
// ──────────────────────────────────────────────────────────────────
function DirectorDifferentiator() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/backlog/methodology', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;
  const betsyTypes = (data.contributionTypes || []).filter((t) => t.contributor === 'Betsy Salter');
  const irreducible = data.reductionMap?.irreducible;

  return (
    <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
      <OutputHeading>Why the Director's Hours Aren't Interchangeable</OutputHeading>
      <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.5rem' }}>
        Hours measure time. They don't measure judgment.
      </h2>
      <p style={{ ...paraStyle, fontSize: '0.85rem', marginBottom: '1rem' }}>
        The Active Supervision line above is time spent watching a build happen — reading Claude's output, catching problems, redirecting. But Betsy Salter's contribution to this platform isn't just supervision hours; it's the three things below that no amount of AI-augmented execution time can substitute for.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem', marginBottom: '1rem' }}>
        {betsyTypes.map((t) => (
          <div
            key={t.id}
            style={{
              border: '0.5px solid var(--sb-taupe)',
              borderLeft: '3px solid var(--sb-navy)',
              borderRadius: 'var(--sb-radius)',
              padding: '1rem 1.15rem',
              breakInside: 'avoid',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div className="sb-display" style={{ fontSize: '1.05rem', color: 'var(--sb-navy)' }}>{t.name}</div>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.reducible ? 'var(--sb-gold)' : '#5a7d3a' }}>
                {t.reducible ? 'Improves with better process' : 'Irreducible'}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4a4a4a', lineHeight: 1.55, marginBottom: '0.5rem' }}>{t.reducibleNote}</p>
            {t.examples?.length > 0 && (
              <ul style={{ fontSize: '0.78rem', color: 'var(--sb-teal-deep)', paddingLeft: '1.1rem', margin: 0 }}>
                {t.examples.slice(0, 3).map((ex) => <li key={ex}>{ex}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      {irreducible && (
        <div style={{ background: 'rgba(27,42,59,0.04)', border: '0.5px solid var(--sb-taupe)', borderRadius: 'var(--sb-radius)', padding: '1rem 1.15rem' }}>
          <div className="sb-display" style={{ fontSize: '1rem', color: 'var(--sb-navy)', marginBottom: '0.4rem' }}>{irreducible.label}</div>
          <p style={{ fontSize: '0.82rem', color: '#4a4a4a', lineHeight: 1.55, marginBottom: '0.6rem' }}>{irreducible.note}</p>
          <ul style={{ fontSize: '0.8rem', color: '#4a4a4a', lineHeight: 1.7, columns: 2, columnGap: '2rem', paddingLeft: '1.1rem', margin: 0 }}>
            {(irreducible.items || []).map((it) => <li key={it} style={{ breakInside: 'avoid' }}>{it}</li>)}
          </ul>
        </div>
      )}
    </section>
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
// BuildProgressCharts — line charts over the build_progress_snapshots
// time series. Fetches /api/backlog/snapshots. Range selector filters
// to last N days; "all" shows every snapshot. Reference lines drop in
// at any snapshot whose capture_source === 'milestone' so a milestone
// stands out from the daily auto-captures. Early in life there will be
// 0–1 data points — the empty / single-point states are explicit.
// ──────────────────────────────────────────────────────────────────
const CHART_RANGES = [
  { key: '7d',  label: '7 days',  days: 7   },
  { key: '30d', label: '30 days', days: 30  },
  { key: '90d', label: '90 days', days: 90  },
  { key: 'all', label: 'All',     days: null },
];

function BuildProgressCharts() {
  const [snapshots, setSnapshots] = useState(null);
  const [err, setErr] = useState(null);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    fetch('/api/backlog/snapshots', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((d) => setSnapshots(d.snapshots || []))
      .catch((e) => setErr(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(snapshots)) return [];
    const r = CHART_RANGES.find((x) => x.key === range);
    if (!r || r.days == null) return snapshots;
    const cutoff = Date.now() - r.days * 24 * 60 * 60 * 1000;
    return snapshots.filter((s) => s.capturedAt >= cutoff);
  }, [snapshots, range]);

  // Pre-shape each row with the derived hoursTotal so the chart only sees
  // numbers, and a short date label for the x-axis tick.
  const series = useMemo(() => filtered.map((s) => ({
    ...s,
    hoursTotal: (s.hoursClaude || 0) + (s.hoursBetsy || 0),
    dateLabel: formatShortDate(s.capturedAt),
  })), [filtered]);

  const milestones = useMemo(
    () => series.filter((s) => s.captureSource === 'milestone'),
    [series]
  );

  return (
    <section style={{ marginBottom: '2rem', borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <OutputHeading>Build Progress Over Time</OutputHeading>
          <h2 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', marginBottom: '0.25rem' }}>
            Trajectory across requirements, hours, and AI savings
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {CHART_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              style={{
                padding: '0.35rem 0.75rem',
                background: range === r.key ? 'var(--sb-gold)' : 'transparent',
                color: range === r.key ? 'white' : 'var(--sb-navy)',
                border: '0.5px solid var(--sb-taupe)',
                borderRadius: 'var(--sb-radius)',
                fontFamily: 'var(--sb-font-label)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <p style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>
          Failed to load snapshot history: {err}
        </p>
      )}

      {!err && snapshots == null && (
        <p style={{ color: 'var(--sb-teal-deep)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Loading snapshot history…
        </p>
      )}

      {snapshots != null && series.length === 0 && (
        <p style={{ color: 'var(--sb-teal-deep)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          No snapshots in the selected range yet — the daily auto-capture writes the first row when /api/backlog/summary is loaded each UTC day. Try widening the range or check back tomorrow.
        </p>
      )}

      {snapshots != null && series.length === 1 && (
        <p style={{ color: 'var(--sb-teal-deep)', fontSize: '0.78rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
          Only one snapshot in range so far — charts render as a single point. Trend lines appear once a second day's snapshot is captured.
        </p>
      )}

      {snapshots != null && series.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <ProgressChartCard
            title="Requirements delivered"
            color="#c4843a"
            data={series}
            dataKey="requirementsDelivered"
            milestones={milestones}
          />
          <ProgressChartCard
            title="Total hours (Claude + Betsy)"
            color="#8b9bae"
            data={series}
            dataKey="hoursTotal"
            milestones={milestones}
            valueFormatter={(v) => `${Math.round(v * 10) / 10} h`}
          />
          <ProgressChartCard
            title="Estimated cost avoided vs traditional ($)"
            color="#a8b89a"
            data={series}
            dataKey="estimatedCostAvoidedUsd"
            milestones={milestones}
            valueFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
          />
        </div>
      )}
    </section>
  );
}

function ProgressChartCard({ title, color, data, dataKey, milestones, valueFormatter }) {
  const fmt = valueFormatter || ((v) => Math.round(v).toLocaleString());
  return (
    <div
      style={{
        border: '0.5px solid var(--sb-taupe)',
        borderRadius: 'var(--sb-radius)',
        padding: '0.85rem 0.85rem 0.5rem',
        background: 'white',
        breakInside: 'avoid',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eee5d8" strokeDasharray="2 4" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: '#5a7a8e' }}
              stroke="#cdb89a"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#5a7a8e' }}
              stroke="#cdb89a"
              tickFormatter={(v) => fmt(v)}
              width={60}
            />
            <Tooltip
              formatter={(v) => fmt(v)}
              labelStyle={{ color: '#1B2A3B', fontSize: 12 }}
              contentStyle={{ fontSize: 12, borderRadius: 4 }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            {milestones.map((m) => (
              <ReferenceLine
                key={m.id}
                x={m.dateLabel}
                stroke="#c4843a"
                strokeDasharray="3 3"
                label={{
                  value: m.note || 'milestone',
                  position: 'top',
                  fill: '#c4843a',
                  fontSize: 9,
                }}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
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
          <Link to="/login" className="sb-btn sb-btn-gold" style={{ marginTop: '1.5rem' }}>Sign in →</Link>
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
          <Link to="/login" className="sb-btn sb-btn-outline-dark">Sign in</Link>
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

// ──────────────────────────────────────────────────────────────────
// Patch Notes — curated release log shown on /output/patch-notes.
// Admin-only (this is internal release history). Print-friendly.
// ──────────────────────────────────────────────────────────────────
export function PatchNotesOutput() {
  const { loading, user } = useAuthState();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return;
    fetch('/api/backlog/patch-notes', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [loading, user]);

  if (loading) return null;
  if (!user || user.role !== 'admin') {
    return (
      <OutputFrame title="Patch Notes" eyebrow="Internal · Release Log" gated>
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <OutputHeading>Restricted</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.4rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>
            Patch notes are admin-only
          </h1>
          <Link to="/login" className="sb-btn sb-btn-gold" style={{ marginTop: '1.5rem' }}>Sign in →</Link>
        </div>
      </OutputFrame>
    );
  }
  if (err) {
    return (
      <OutputFrame title="Patch Notes" eyebrow="Internal · Release Log">
        <div style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem' }}>
          <p style={{ color: 'var(--sb-risk-critical)' }}>Failed to load patch notes: {err}</p>
        </div>
      </OutputFrame>
    );
  }
  if (!data) {
    return (
      <OutputFrame title="Patch Notes" eyebrow="Internal · Release Log">
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--sb-teal-deep)' }}>Loading patch notes…</div>
      </OutputFrame>
    );
  }

  const releases = data.releases || [];
  const sectionMeta = {
    'New':      { color: 'var(--sb-green)',          glyph: '✦', tone: 'rgba(168,184,154,0.12)' },
    'Changed':  { color: 'var(--sb-gold)',           glyph: '↻', tone: 'rgba(196,132,58,0.12)' },
    'Fixed':    { color: 'var(--sb-teal-deep)',      glyph: '✓', tone: 'rgba(74,102,112,0.12)' },
    'Behind the scenes': { color: 'var(--sb-dusty)', glyph: '◇', tone: 'rgba(139,155,174,0.10)' },
    'Known issues': { color: 'var(--sb-risk-critical)', glyph: '!', tone: 'rgba(196,75,75,0.10)' },
  };

  return (
    <OutputFrame title="Salt Basin · Patch Notes" eyebrow="Internal · Release Log">
      <div className="sb-output-page" style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: '2rem' }}>
          <OutputHeading>Salt Basin Net Works Build Log</OutputHeading>
          <h1 className="sb-display" style={{ fontSize: '2.6rem', color: 'var(--sb-navy)', marginBottom: '0.5rem', lineHeight: 1.05 }}>
            Patch Notes
          </h1>
          <p style={{ ...paraStyle, marginBottom: 4 }}>
            What shipped to saltbasin.net, organized by release. Most recent first.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--sb-teal-deep)', fontStyle: 'italic' }}>
            {releases.length} releases · build started {releases.length ? formatLongDate(releases[releases.length - 1].date) : '—'}
          </p>
        </section>

        {/* ── Releases ── */}
        {releases.map((r, idx) => (
          <section
            key={r.version}
            style={{
              borderTop: '0.5px solid var(--sb-taupe)',
              paddingTop: '1.5rem',
              marginBottom: '1.75rem',
              breakInside: 'avoid',
            }}
          >
            {/* Version header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
                  {r.version} · {formatLongDate(r.date)}
                </div>
                <h2 className="sb-display" style={{ fontSize: '1.7rem', color: 'var(--sb-navy)', marginBottom: '0.35rem', lineHeight: 1.15 }}>
                  {r.name}
                </h2>
              </div>
              {idx === 0 && (
                <span style={{
                  padding: '3px 9px',
                  fontFamily: 'var(--sb-font-label)',
                  fontSize: '0.58rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--sb-green)',
                  border: '0.5px solid var(--sb-green)',
                  borderRadius: 2,
                }}>
                  Latest
                </span>
              )}
            </div>

            {r.summary && (
              <p style={{ ...paraStyle, marginBottom: '1rem' }}>
                {r.summary}
              </p>
            )}

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(r.sections || []).map((sec) => {
                const meta = sectionMeta[sec.heading] || sectionMeta['New'];
                return (
                  <div
                    key={sec.heading}
                    style={{
                      padding: '0.75rem 1rem',
                      background: meta.tone,
                      border: `0.5px solid ${meta.color}`,
                      borderLeft: `3px solid ${meta.color}`,
                      borderRadius: 'var(--sb-radius)',
                      breakInside: 'avoid',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--sb-font-label)',
                      fontSize: '0.62rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: meta.color,
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ marginRight: 5 }}>{meta.glyph}</span>
                      {sec.heading}
                    </div>
                    <ul style={{ ...ulStyle }}>
                      {(sec.items || []).map((it, i) => (
                        <li key={i} style={{ ...liStyle, fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                          <span style={{ ...dotStyle, color: meta.color }}>·</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Footer */}
        <section style={{ borderTop: '0.5px solid var(--sb-taupe)', paddingTop: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--sb-teal-deep)' }}>
          Generated from the curated release log at <code>server/data/patchNotes.js</code>. Future releases append to that file and auto-publish here.
        </section>
      </div>
    </OutputFrame>
  );
}

function formatLongDate(s) {
  if (!s) return '—';
  // s is YYYY-MM-DD
  const d = new Date(s + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
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

// ── IP Artifact shared components ─────────────────────────────────────────

const IP_STYLES = {
  frame: {
    background: 'linear-gradient(135deg, var(--sbh-parchment), var(--sbh-cream) 52%, var(--sbh-parchment-deep))',
    color: 'var(--sbh-ink)',
    minHeight: '100vh',
    fontFamily: 'var(--sb-font-body)',
  },
  header: {
    background: 'rgba(248,244,236,0.95)',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--sbh-line)',
    boxShadow: '0 16px 36px -30px rgba(43,42,40,0.45)',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--sbh-teal-deep)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'var(--sb-font-label)',
  },
  title: { fontSize: 28, fontWeight: 500, color: 'var(--sbh-ink)', marginBottom: 4, fontFamily: 'var(--sb-font-display)', letterSpacing: 0, lineHeight: 1 },
  sub: { fontSize: 12, color: 'var(--sbh-muted)', lineHeight: 1.5, fontFamily: 'var(--sb-font-label)' },
  ipBadge: {
    textAlign: 'right',
    fontSize: 10,
    color: 'var(--sbh-muted)',
    lineHeight: 1.6,
    background: 'rgba(196,132,58,0.09)',
    border: '1px solid rgba(196,132,58,0.28)',
    padding: '6px 12px',
    borderRadius: 8,
  },
  section: { padding: '24px 32px', borderBottom: '1px solid var(--sbh-line)' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--sbh-teal-deep)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 12,
    fontFamily: 'var(--sb-font-label)',
  },
  card: {
    background: 'rgba(255,253,247,0.78)',
    border: '1px solid var(--sbh-line)',
    borderRadius: 8,
    padding: '12px 16px',
    boxShadow: '0 14px 32px -28px rgba(43,42,40,0.35)',
  },
  footer: {
    background: 'var(--sbh-ink)',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(248,244,236,0.14)',
    fontSize: 10,
    color: 'rgba(248,244,236,0.62)',
    fontFamily: 'var(--sb-font-label)',
  },
};

function IpTierBadge({ tier }) {
  const map = {
    public:  { label: 'PUBLIC OVERVIEW', color: '#4caf50', bg: '#4caf5015', border: '#4caf5030' },
    member:  { label: 'MEMBER ACCESS', color: '#c9a84c', bg: '#c9a84c15', border: '#c9a84c30' },
    client:  { label: 'CLIENT DELIVERABLE', color: '#6699ff', bg: '#6699ff15', border: '#6699ff30' },
  };
  const t = map[tier] || map.public;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 10,
      background: t.bg,
      border: `1px solid ${t.border}`,
      color: t.color,
      letterSpacing: '0.08em',
      marginBottom: 16,
    }}>
      {t.label}
    </span>
  );
}

function IpProposalCta({ title = 'Request a Proposal' }) {
  return (
    <div style={{
      background: '#1a1e2a',
      border: '1px solid #c9a84c33',
      borderRadius: 4,
      padding: '16px 20px',
      marginTop: 20,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 12, color: '#e8e4d9', fontWeight: 600, marginBottom: 4 }}>
          Ready to apply this to your revenue architecture?
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          Engagements available as Diagnostic Sprint · Embedded Operator · Advisory Retainer
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a
          href="/#contact"
          style={{
            background: '#c9a84c',
            color: '#0f1117',
            fontSize: 12,
            fontWeight: 700,
            padding: '9px 18px',
            borderRadius: 4,
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </a>
        <a
          href="/consulting"
          style={{
            background: 'transparent',
            color: '#c9a84c',
            fontSize: 12,
            fontWeight: 600,
            padding: '9px 18px',
            borderRadius: 4,
            textDecoration: 'none',
            border: '1px solid #c9a84c44',
          }}
        >
          View Services →
        </a>
      </div>
    </div>
  );
}

// ── MethodologyOutput ──────────────────────────────────────────────────────
// /output/methodology — three tiers: public teaser, member overview, client full

export function MethodologyOutput() {
  const { loading, user } = useAuthState();
  const [stats, setStats] = useState(null);

  const tier = !user ? 'public' : user.role === 'admin' ? 'client' : 'member';

  useEffect(() => {
    if (!user) return;
    fetch('/api/methodology-stats/summary', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [user]);

  const PUBLIC_TEASER = (
    <div>
      <IpTierBadge tier="public" />
      <p style={{ fontSize: 14, color: '#e8e4d9', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 20 }}>
        "Where the practitioner meets AI augmentation — to go from practitioner-derived, AI-augmented, to AI-derived, practitioner-signed."
      </p>
      <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.8, marginBottom: 20 }}>
        A transparent methodology for measuring, attributing, and valuing human + AI contributions in enterprise software delivery.
        Built from the ground up during the Salt Basin Net Works platform build — the platform itself is the proof of concept.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          ['Four Contribution Types', 'Strategic Direction · Domain Authoring · Active Supervision · Code Generation'],
          ['2026 Rate Benchmarks', 'Activity-based rates locked to market equivalents at build date'],
          ['Session Measurement', 'JSONL burst analysis → active hours → turn density → oversight intensity'],
          ['Three-Loop ROI', 'Estimation → Actuals → Variance · Cost Ledger · Business Value'],
        ].map(([h, b]) => (
          <div key={h} style={IP_STYLES.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', marginBottom: 4 }}>{h}</div>
            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>{b}</div>
          </div>
        ))}
      </div>
      <IpProposalCta title="Inquire About This Methodology" />
    </div>
  );

  const MEMBER_OVERVIEW = (
    <div>
      <IpTierBadge tier="member" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'The Core Thesis', body: 'Human expertise is the irreducible input. AI is the execution multiplier. The practitioner\'s authority and accountability — not sole authorship — is what makes the output defensible.' },
          { label: 'What Gets Measured', body: 'Session active hours (JSONL burst analysis), turn density (user_turns / active_hours), contribution type per requirement, estimate vs actual variance per release.' },
          { label: 'Contribution Types', body: 'Strategic Direction · Domain Authoring · Active Supervision · Code Generation. All Betsy contributions at $225/hr (2026). Claude at $115/hr quality-adjusted.' },
          { label: 'Oversight Reduction Path', body: 'Turn density classifies oversight intensity: Critical >120/hr · High 80–120 · Moderate 40–80 · Low <40. Irreducible IP turns vs reducible execution turns are tracked separately.' },
          { label: 'The Cost Leverage Ratio', body: stats?.costLeverageRatio
              ? `traditional_cost_usd / actual_cost_usd, both computed from the same real active hours at their respective rates — an estimated equivalent traditional effort, not a verified savings figure. Salt Basin platform to date: ${stats.costLeverageRatio}× across ${stats.hoursTotal} real active hours (${stats.hoursClaude}h Claude + ${stats.hoursBetsy}h Betsy). A separate "engineer-equivalent effort" leverage figure — how much longer a traditional team would actually take, not just what the same duration would cost — remains an open, unverified estimate.`
              : 'traditional_cost_usd / actual_cost_usd, both computed from the same real active hours at their respective rates — an estimated equivalent traditional effort, not a verified savings figure. A separate "engineer-equivalent effort" leverage figure remains an open, unverified estimate.' },
          { label: 'IP Provenance', body: 'Practitioner-derived from 12+ years of enterprise delivery. AI-assisted structuring. Practitioner-signed. Session JSONL files are the creation record.' },
        ].map(({ label, body }) => (
          <div key={label} style={IP_STYLES.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.7 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ ...IP_STYLES.card, borderColor: '#c9a84c33', marginBottom: 20 }}>
        <div style={IP_STYLES.sectionLabel}>The Derivation Record — How We Got Here</div>
        <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.8 }}>
          This methodology was co-derived by Betsy Salter and Claude (Anthropic) building the Salt Basin Net Works platform{stats ? ` — ${stats.hoursTotal} real active build hours (${stats.hoursClaude}h Claude, ${stats.hoursBetsy}h Betsy) measured across ${stats.requirementsDelivered} delivered requirements to date` : ''}.
          Every rate benchmark, activity classification, and measurement method was proposed, challenged, and confirmed by Betsy before being written into this artifact.
          The session JSONL files are the timestamped creation record. The platform build is the proof of concept — figures update as the build continues, not fixed at first publish.
        </p>
      </div>
      <IpProposalCta title="Request a Proposal" />
    </div>
  );

  const CLIENT_FULL = (
    <div>
      <IpTierBadge tier="client" />
      {MEMBER_OVERVIEW}
      <div style={{ marginTop: 20 }}>
        <div style={IP_STYLES.sectionLabel}>Contribution Type Definitions</div>
        {[
          { type: 'Strategic Direction', who: 'Betsy Salter', rate: '$225/hr', reducible: false, desc: 'Platform vision, architecture decisions, product design, external artifacts. These turns ARE the work — not inefficiency. Irreducible.' },
          { type: 'Domain Authoring', who: 'Betsy Salter', rate: '$225/hr', reducible: false, desc: 'Requirements, business rules, industry content, methodology frameworks. The domain knowledge is irreducible; authoring efficiency improves with better templates.' },
          { type: 'Active Supervision', who: 'Betsy Salter', rate: '$225/hr', reducible: true, desc: 'Real-time course correction, UX decisions, triage during sessions. Reducible through better upfront specs and pre-approved patterns.' },
          { type: 'Code Generation', who: 'Claude (Anthropic)', rate: '$115/hr', reducible: true, desc: 'Wall-clock active coding time from session timestamps. Reducible through automated testing, runbooks, and code templates.' },
        ].map(({ type, who, rate, reducible, desc }) => (
          <div key={type} style={{ ...IP_STYLES.card, marginBottom: 8, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e4d9' }}>{type}</span>
                <span style={{ fontSize: 10, color: '#888' }}>{who}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', fontFamily: 'monospace' }}>{rate}</span>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>{desc}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, flexShrink: 0,
              background: reducible ? '#4caf5015' : '#ff444415',
              color: reducible ? '#4caf50' : '#ff8888',
              border: `1px solid ${reducible ? '#4caf5030' : '#ff444430'}`,
            }}>
              {reducible ? 'REDUCIBLE' : 'IRREDUCIBLE'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const content = tier === 'public' ? PUBLIC_TEASER : tier === 'member' ? MEMBER_OVERVIEW : CLIENT_FULL;

  return (
    <div id="sb-resume-print-root" style={IP_STYLES.frame}>
      <div style={IP_STYLES.header}>
        <div>
          <div style={IP_STYLES.eyebrow}>Master Enterprise Solution Best Bets™ · Methodology · Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works</div>
          <div style={IP_STYLES.title}>Contribution Intelligence Methodology™</div>
          <div style={IP_STYLES.sub}>
            Practitioner-derived · AI-augmented · Practitioner-signed · v1.0 · 2026
          </div>
        </div>
        <div style={IP_STYLES.ipBadge}>
          <div style={{ fontWeight: 700, color: '#c9a84c', marginBottom: 2 }}>INTELLECTUAL PROPERTY</div>
          © 2026 Martha Elizabeth Salter<br />aka Betsy Salter<br />Salt Basin Net Works<br />All rights reserved
        </div>
      </div>

      <div style={IP_STYLES.section}>
        {content}
      </div>

      <div style={IP_STYLES.footer}>
        <span>© 2026 <strong style={{ color: '#888' }}>Martha Elizabeth Salter aka Betsy Salter</strong> · Salt Basin Net Works · Contribution Intelligence Methodology™ · Master Enterprise Solution Best Bets™ · All rights reserved</span>
        <span>saltbasin.net · {tier !== 'public' && user ? `Viewed by: ${user.email}` : 'Public overview'}</span>
      </div>
    </div>
  );
}

// ── L2RModelOutput ─────────────────────────────────────────────────────────
// /output/l2r-model — Lead to Revenue Capability Model, three tiers

export function L2RModelOutput() {
  const { loading, user } = useAuthState();
  const [activeStage, setActiveStage] = useState(0);

  const tier = !user ? 'public' : user.role === 'admin' ? 'client' : 'member';

  const STAGES = [
    { num: '01', name: 'Demand Gen', color: '#1B2A3B', cp: ['Campaign attribution accuracy','Lead source completeness','MQL definition alignment','Lead routing logic'], risk: ['Attribution leakage','MQL/SQL misalignment','Duplicate creation','Dark funnel'] },
    { num: '02', name: 'Lead Qual', color: '#2A3B2A', cp: ['Dedup & identity resolution','Scoring threshold enforcement','MQL→SQL SLA','Routing to segment'], risk: ['Duplicate pipeline','Leads never touched','Score drift','MQL manipulation'] },
    { num: '03', name: 'Pipeline', color: '#3B2A1B', cp: ['Stage definition enforcement','Forecast category discipline','Coverage ratio','Deal velocity'], risk: ['Stage skipping','Forecast manipulation','Stale opportunities','Concentration risk'] },
    { num: '04', name: 'CPQ', color: '#2A1B3B', cp: ['Config accuracy','Discount governance','Quote turnaround SLA','Version control'], risk: ['Ad hoc discounting','Approval bypass','Quote proliferation','Config errors in contract'] },
    { num: '05', name: 'CLM', color: '#3B2A2A', cp: ['Quote→contract consistency','Redline governance','Executed contract storage','RevRec clause tracking'], risk: ['Terms diverge from quote','Non-standard RevRec clause','Missing contracts','Unauthorized signer'] },
    { num: '06', name: 'Order→Book', color: '#1B3B2A', cp: ['Contract→order accuracy','Booking trigger definition','Handoff completeness','Finance notification'], risk: ['Manual re-entry errors','Early booking recognition','Finance not notified','Missing term'] },
    { num: '07', name: 'Deliver', color: '#2A2A3B', cp: ['Milestone tracking','Usage metering accuracy','Customer acceptance','Billing trigger data'], risk: ['Milestone not triggering billing','Silent rejection','Usage not reconciled','Scope creep'] },
    { num: '08', name: 'RevRec·Bill', color: '#3B1B1B', cp: ['ASC 606 compliance','Invoice accuracy & timing','AR aging discipline','Cash application accuracy'], risk: ['RevRec before obligation met','Wrong invoice entity','Deferred rev errors','Unapplied cash'] },
    { num: '09', name: 'Renew·Expand', color: '#1B2A3B', cp: ['Renewal pipeline 90/60/30','Health score accuracy','Expansion identification','Churn signal detection'], risk: ['Late renewal catch','Activity-based health score','Expansion mis-attributed','Churn not root-caused'] },
  ];

  const s = STAGES[activeStage];

  const PUBLIC_TEASER = (
    <div>
      <IpTierBadge tier="public" />
      <p style={{ fontSize: 14, color: '#e8e4d9', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 16 }}>
        "Most revenue problems aren't sales problems. They're architecture problems — gaps between the people, processes, and systems that are supposed to hand work to each other seamlessly."
      </p>
      <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.8, marginBottom: 20 }}>
        The Lead to Revenue Capability Model™ is a practitioner-derived enterprise architecture that spans the full revenue lifecycle — from GTM strategy through product definition, pipeline, CPQ, contract, delivery, billing, and expansion.
        Nine operational stages. Five GTM nodes. Six cross-cutting dimensions. Four player types at every stage.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          ['GTM Architecture', '5 nodes including Product Definition → performance obligations'],
          ['9 Revenue Stages', 'Lead Capture through Renew & Expand, delineated by handoff risk'],
          ['System-Agnostic', 'Maps any stack — Salesforce, SAP, Oracle, NetSuite, Zuora'],
          ['4 Dimensions', 'Players · Processes · Systems · Contributions at every stage'],
          ['2 Paths', 'Market-first (startup) and product-first (mature org)'],
          ['Cross-Cutting', 'Analytics · Governance · Integration · Risk · AI · Change'],
        ].map(([h, b]) => (
          <div key={h} style={IP_STYLES.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', marginBottom: 3 }}>{h}</div>
            <div style={{ fontSize: 10, color: '#aaa', lineHeight: 1.6 }}>{b}</div>
          </div>
        ))}
      </div>
      <IpProposalCta title="Request a Proposal" />
    </div>
  );

  const INTERACTIVE_MODEL = (
    <div>
      <IpTierBadge tier={tier} />
      <div style={{ marginBottom: 8, fontSize: 11, color: '#888' }}>Click any stage to see control points and risk areas.</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {STAGES.map((st, i) => (
          <div
            key={st.num}
            onClick={() => setActiveStage(i)}
            style={{
              background: st.color,
              padding: '8px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              border: i === activeStage ? '2px solid #c9a84c' : '2px solid transparent',
              minWidth: 72,
              flex: '1 1 auto',
            }}
          >
            <div style={{ fontSize: 8, color: '#c9a84c', fontWeight: 700, marginBottom: 2 }}>{st.num}</div>
            <div style={{ fontSize: 10, color: '#e8e4d9', fontWeight: 600, lineHeight: 1.3 }}>{st.name}</div>
          </div>
        ))}
      </div>
      <div style={{ ...IP_STYLES.card, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e4d9', marginBottom: 10 }}>
          {s.num} · {s.name}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Control Points</div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {s.cp.map((c) => (
                <li key={c} style={{ fontSize: 11, color: '#aaa', padding: '2px 0 2px 12px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#c9a84c' }}>–</span>{c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#ff8888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Risk Areas</div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {s.risk.map((r) => (
                <li key={r} style={{ fontSize: 11, color: '#aaa', padding: '2px 0 2px 12px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#ff8888' }}>–</span>{r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <IpProposalCta title="Apply This Model to Your Architecture" />
    </div>
  );

  const content = tier === 'public' ? PUBLIC_TEASER : INTERACTIVE_MODEL;

  return (
    <div id="sb-resume-print-root" style={IP_STYLES.frame}>
      <div style={IP_STYLES.header}>
        <div>
          <div style={IP_STYLES.eyebrow}>Master Enterprise Solution Best Bets™ · IP Artifact · Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works</div>
          <div style={IP_STYLES.title}>Lead to Revenue Capability Model™</div>
          <div style={IP_STYLES.sub}>
            GTM + Q2R · Full revenue lifecycle · Practitioner-derived · AI-assisted organization · v1.0 · 2026
          </div>
        </div>
        <div style={IP_STYLES.ipBadge}>
          <div style={{ fontWeight: 700, color: '#c9a84c', marginBottom: 2 }}>INTELLECTUAL PROPERTY</div>
          © 2026 Martha Elizabeth Salter<br />aka Betsy Salter<br />Salt Basin Net Works<br />All rights reserved
        </div>
      </div>

      <div style={IP_STYLES.section}>
        {content}
      </div>

      <div style={IP_STYLES.footer}>
        <span>© 2026 <strong style={{ color: '#888' }}>Martha Elizabeth Salter aka Betsy Salter</strong> · Salt Basin Net Works · Lead to Revenue Capability Model™ · Master Enterprise Solution Best Bets™ · All rights reserved · Not for redistribution</span>
        <span>saltbasin.net · {tier !== 'public' && user ? `Viewed by: ${user.email}` : 'Public overview'}</span>
      </div>
    </div>
  );
}
