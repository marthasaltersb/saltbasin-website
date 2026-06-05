import React from 'react';
import { Link } from 'react-router-dom';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';
import { api } from '../lib/api.js';

// ── Inline disclaimer: a short reusable banner used above every data-collection
// surface (forms, uploads, signup). Links out to the full notice. ──
export function InlineDataNotice({ context = 'sharing', dark = true, compact = false, style }) {
  const palette = dark
    ? { bg: 'rgba(196,132,58,0.1)', border: 'rgba(196,132,58,0.35)', text: 'var(--sb-cream)', sub: 'var(--sb-sage)' }
    : { bg: 'rgba(196,132,58,0.08)', border: 'rgba(196,132,58,0.3)', text: 'var(--sb-navy)', sub: 'var(--sb-teal-deep)' };

  return (
    <div
      style={{
        background: palette.bg,
        border: `0.5px solid ${palette.border}`,
        borderLeft: `3px solid var(--sb-gold)`,
        borderRadius: 'var(--sb-radius)',
        padding: compact ? '0.6rem 0.8rem' : '0.85rem 1rem',
        fontSize: compact ? '0.75rem' : '0.82rem',
        lineHeight: 1.55,
        color: palette.text,
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: compact ? '0.6rem' : '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginRight: '0.5rem',
        }}
      >
        ⚠ Real talk on data security
      </span>
      <span style={{ color: palette.sub }}>
        I built and run this site myself. I'm bringing operator-grade thinking, but I'm still hardening this platform's security — so I can't yet certify your data is bulletproof against breach or misuse. If you wouldn't put it in a LinkedIn DM to me, hold it for now.{' '}
        <Link
          to="/data-notice"
          style={{ color: 'var(--sb-gold)', textDecoration: 'underline', whiteSpace: 'nowrap' }}
        >
          Read the full notice →
        </Link>
      </span>
    </div>
  );
}

// ── Standalone /data-notice page (long-form version) ──
export default function DataNotice() {
  const [config, setConfig] = React.useState(null);
  React.useEffect(() => {
    api.getPublicConfig().then(setConfig).catch(() => {});
  }, []);
  return (
    <div>
      <PublicNav site={config?.site || {}} />
      <div style={{ background: 'var(--sb-navy)', color: 'var(--sb-cream)', padding: '5rem 1.5rem' }}>
        <article style={{ maxWidth: 760, margin: '0 auto' }}>
          <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
            Salt Basin Net Works · Data & Security Notice
          </p>
          <h1
            className="sb-display"
            style={{ fontSize: '2.8rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}
          >
            Real talk on data security.
          </h1>
          <div className="sb-gold-rule" style={{ marginBottom: '2rem' }} />

          <Para>
            Salt Basin Net Works is a deployed, working site run by a single professional operator — me. I've spent a decade building Quote-to-Revenue systems and risk frameworks for companies generating $600M–$40B+ in annual revenue, so I take data discretion seriously.
          </Para>
          <Para>
            But I'm also building this platform in public, on my own. <Em>Security hardening is on my roadmap, not in my rearview mirror.</Em> Until I've completed and verified the full stack — auth, encryption at rest, audit logging, breach response — I cannot certify that anything you share here is invulnerable to attack, accidental exposure, or third-party access.
          </Para>

          <SectionHeading>What I will do</SectionHeading>
          <Para>
            Handle anything you share with the same operator-grade discretion I bring to client engagements. Use your information only for the purpose you submitted it for. Delete on request — immediately, no questions. Never sell, share, or repurpose your data.
          </Para>

          <SectionHeading>What I can't promise yet</SectionHeading>
          <Para>
            That this site is invulnerable to attack while I'm still building. That my security posture matches the SOC 2 environments I've worked in for clients. That a third party couldn't exploit something I haven't found.
          </Para>

          <SectionHeading>The bottom line</SectionHeading>
          <Para>
            Bring me the strategic conversation. Send the documents you'd hand a trusted advisor in a first meeting. Hold the truly sensitive stuff until I've certified — or just call me. My number's on my resume.
          </Para>

          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '0.5px dashed rgba(196,132,58,0.35)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontFamily: 'var(--sb-font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--sb-gold)' }}>
              — Betsy
            </div>
            <BackLink className="sb-btn sb-btn-outline" style={{ fontSize: '0.72rem', padding: '0.5rem 1.1rem' }}>
              ← Back to Salt Basin
            </BackLink>
          </div>
        </article>
      </div>
      <PublicFooter config={config} />
    </div>
  );
}

function Para({ children }) {
  return (
    <p style={{ fontSize: '1.02rem', lineHeight: 1.85, color: 'var(--sb-sage)', marginBottom: '1.25rem' }}>
      {children}
    </p>
  );
}
function SectionHeading({ children }) {
  return (
    <h2
      className="sb-display"
      style={{
        fontSize: '1.4rem',
        color: 'var(--sb-cream)',
        marginTop: '2.25rem',
        marginBottom: '0.5rem',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </h2>
  );
}
function Em({ children }) {
  return <em style={{ color: 'var(--sb-cream)', fontStyle: 'italic' }}>{children}</em>;
}
