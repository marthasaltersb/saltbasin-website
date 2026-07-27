import React from 'react';
import { Link } from 'react-router-dom';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';
import { api } from '../lib/api.js';

const EFFECTIVE_DATE = 'July 27, 2026';

export default function PrivacyPolicy() {
  const [config, setConfig] = React.useState(null);
  const [pages, setPages] = React.useState(null);
  React.useEffect(() => {
    api.getPublicConfig().then(setConfig).catch(() => {});
    api.getPublishedSite().then((s) => setPages(s?.pages || {})).catch(() => {});
  }, []);
  return (
    <div>
      <PublicNav site={config?.site || {}} pages={pages} />
      <div style={{ background: 'var(--sb-navy)', color: 'var(--sb-cream)', padding: '5rem 1.5rem' }}>
        <article style={{ maxWidth: 760, margin: '0 auto' }}>
          <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
            Salt Basin Net Works · Privacy Policy
          </p>
          <h1
            className="sb-display"
            style={{ fontSize: '2.8rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', marginBottom: '1.25rem' }}>
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="sb-gold-rule" style={{ marginBottom: '2rem' }} />

          <NoticeBox>
            I wrote this policy myself, in plain language, to describe what this platform actually does with
            your data today. It is <Em>not a substitute for review by a licensed attorney</Em>, and it will be
            updated as the platform and my legal review of it mature. See also the companion{' '}
            <Link to="/data-notice" style={{ color: 'var(--sb-gold)', textDecoration: 'underline' }}>
              Data &amp; Security Notice
            </Link>{' '}
            for a more candid, operator-voice account of where security hardening currently stands.
          </NoticeBox>

          <SectionHeading>What I collect</SectionHeading>
          <Para>
            <Strong>Account &amp; profile information:</Strong> your name, email address(es), password (stored
            as a salted hash, never in plain text), and anything you add to your public profile or personal
            brand site (bio, photo, location, links).
          </Para>
          <Para>
            <Strong>Career &amp; resume history:</Strong> job history, skills, tools, certifications, and
            engagement/deal records you choose to enter into your Career Master, subject to the separate
            career-portfolio consent you grant before that data is used.
          </Para>
          <Para>
            <Strong>Third-party connections you authorize:</Strong> if you connect an external account (CRM,
            productivity, or data platform) through the Integrations panel, I store an encrypted access token
            and the specific scopes you granted — not your third-party password, and never more access than
            the provider's consent screen shows you.
          </Para>
          <Para>
            <Strong>Organization data:</Strong> if you create or join an organization profile, data you enter
            in that context is associated with the organization, not just with you personally — see the
            separate consent step that covers this at the time you set that up.
          </Para>
          <Para>
            <Strong>Usage &amp; security metadata:</Strong> IP address, user-agent, and timestamps on
            account actions (logins, consent grants, content publishes) for audit and abuse-prevention
            purposes.
          </Para>

          <SectionHeading>How I use it</SectionHeading>
          <Para>
            To operate your account and the features you use, to send transactional email (welcome messages,
            password resets, notifications you'd expect), to maintain an audit trail of account and content
            changes, and to improve the platform. I do not sell your data, and I do not use it for anything
            beyond the purpose you provided it for.
          </Para>

          <SectionHeading>How it's stored and protected</SectionHeading>
          <Para>
            Third-party OAuth access/refresh tokens are encrypted at rest (AES-256-GCM) before they touch the
            database. Passwords are hashed, never stored in plain text. Session cookies are HTTP-only and
            marked secure in production.
          </Para>
          <Para>
            <Strong>Being direct about a real limitation:</Strong> most other profile and career data (names,
            job history, bios) is access-controlled but is <Em>not</Em> individually field-encrypted at rest —
            the same posture the platform uses for non-sensitive operational data generally. If that changes
            for a given data category, this policy will be updated to reflect it.
          </Para>

          <SectionHeading>Who it's shared with</SectionHeading>
          <Para>
            Transactional email is sent through Brevo. The application and its data are hosted on Supabase
            (Postgres). If you connect a third-party account (CRM, financial, or productivity provider), that
            provider receives only what its own OAuth consent screen discloses to you at the time you connect
            it — I do not share your data with any other third party, and I never sell it.
          </Para>

          <SectionHeading>Your rights</SectionHeading>
          <Para>
            You can access, correct, or export the data in your own profile and dashboard at any time. You can
            request deletion of your account and associated data by contacting me directly — I will delete it
            promptly and will not ask you to justify the request.
          </Para>

          <SectionHeading>Retention</SectionHeading>
          <Para>
            I keep your data for as long as your account is active, plus a reasonable period for audit and
            legal-compliance purposes after deletion requests, unless a shorter period is legally required.
          </Para>

          <SectionHeading>Cookies</SectionHeading>
          <Para>
            The platform uses a session cookie required for you to stay logged in. It does not currently run
            third-party advertising or cross-site tracking cookies.
          </Para>

          <SectionHeading>Changes to this policy</SectionHeading>
          <Para>
            If I make a meaningful change to this policy, I will update the effective date above and, where
            the change affects a consent you've already granted, I will ask you to re-confirm it.
          </Para>

          <SectionHeading>Contact</SectionHeading>
          <Para>
            Questions about this policy or a request to access/delete your data — reach me directly. My
            contact information is on my resume and public profile.
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/terms" style={{ color: 'var(--sb-gold)', fontSize: '0.75rem', textDecoration: 'underline' }}>
                Terms of Service
              </Link>
              <BackLink className="sb-btn sb-btn-outline" style={{ fontSize: '0.72rem', padding: '0.5rem 1.1rem' }}>
                ← Back to Salt Basin
              </BackLink>
            </div>
          </div>
        </article>
      </div>
      <PublicFooter config={config} />
    </div>
  );
}

function NoticeBox({ children }) {
  return (
    <div
      style={{
        background: 'rgba(196,132,58,0.1)',
        border: '0.5px solid rgba(196,132,58,0.35)',
        borderLeft: '3px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '0.85rem 1rem',
        fontSize: '0.82rem',
        lineHeight: 1.6,
        color: 'var(--sb-sage)',
        marginBottom: '2rem',
      }}
    >
      {children}
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
function Strong({ children }) {
  return <strong style={{ color: 'var(--sb-cream)' }}>{children}</strong>;
}
