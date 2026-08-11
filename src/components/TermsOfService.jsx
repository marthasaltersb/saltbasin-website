import React from 'react';
import { Link } from 'react-router-dom';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';
import { api } from '../lib/api.js';

const EFFECTIVE_DATE = 'August 10, 2026';

export default function TermsOfService() {
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
            Salt Basin Net Works · Terms of Service
          </p>
          <h1
            className="sb-display"
            style={{ fontSize: '2.8rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}
          >
            Terms of Service
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)', marginBottom: '1.25rem' }}>
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="sb-gold-rule" style={{ marginBottom: '2rem' }} />

          <NoticeBox>
            I wrote these terms myself, in plain language, to set reasonable expectations for using this
            platform today. They are <Em>not a substitute for review by a licensed attorney</Em>, and will be
            updated as the platform matures. See also the{' '}
            <Link to="/privacy" style={{ color: 'var(--sb-gold)', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/data-notice" style={{ color: 'var(--sb-gold)', textDecoration: 'underline' }}>
              Data &amp; Security Notice
            </Link>
            .
          </NoticeBox>

          <SectionHeading>Acceptance</SectionHeading>
          <Para>
            By creating an account or using this platform, you agree to these Terms and the Privacy Policy.
            If you don't agree, please don't create an account.
          </Para>

          <SectionHeading>Who can use this</SectionHeading>
          <Para>
            You must be able to form a binding agreement to use this platform, and the account information you
            provide (name, email) must be accurate. You're responsible for keeping your login credentials
            confidential and for activity that happens under your account.
          </Para>

          <SectionHeading>Your content</SectionHeading>
          <Para>
            You retain ownership of the content you add — your profile, career history, and any documents or
            data you upload. By publishing a public profile or site, you grant this platform the license
            needed to host and display that content as you've configured it. You're responsible for the
            accuracy of what you publish and for not including information you're not entitled to share (for
            example, a former employer's confidential client names).
          </Para>

          <SectionHeading>Career Portfolio data conditions</SectionHeading>
          <Para>
            Career Portfolio members may provide career history, files, profile data, organization links,
            instructions, and corrections for agent-assisted processing. BestyStaff and provisioned agents may
            classify, summarize, transform, and connect that information to produce Career Portfolio records and
            outputs, subject to user, record, module, and organization permissions. You must redact restricted
            information, provide only information you are authorized to use, and review generated claims, dates,
            metrics, client references, and publication settings before relying on or sharing an output.
          </Para>
          <Para>
            Stored information is not made public merely because it is present in the platform; publication requires
            a deliberate approved action. Organization-linked information may also be governed by that organization's
            permissions, licenses, identity provider, and data policies. Career Portfolio records and consent history
            may be retained for service operation, provenance, security, audit, and applicable contractual or legal
            requirements.
          </Para>

          <SectionHeading>Third-party connections</SectionHeading>
          <Para>
            If you connect an external account (CRM, productivity, or data platform) through the platform's
            Integrations panel, you're representing that you're authorized to connect that account and to
            share the scopes you approve. This platform isn't responsible for the availability, accuracy, or
            behavior of third-party providers, and disconnecting a provider is always available to you.
          </Para>

          <SectionHeading>Organization profiles</SectionHeading>
          <Para>
            If you create or are invited into an organization profile, data entered in that context is
            associated with the organization and may be visible to other verified members of it — distinct
            from your personal profile. Creating an organization profile requires a verified organization
            (work) email, and accessing organization data requires the separate acknowledgment shown at that
            time.
          </Para>

          <SectionHeading>Service provided "as-is"</SectionHeading>
          <Para>
            This platform is under active, ongoing development by a single operator. It's provided on an
            "as-is" and "as-available" basis, without warranties of any kind, express or implied — including
            any warranty of uninterrupted availability, security certification, or fitness for a particular
            purpose. See the Data &amp; Security Notice for a candid account of current limitations.
          </Para>

          <SectionHeading>Limitation of liability</SectionHeading>
          <Para>
            To the fullest extent permitted by law, this platform's operator is not liable for indirect,
            incidental, or consequential damages arising from your use of the service. Nothing here limits
            liability that can't be limited under applicable law.
          </Para>

          <SectionHeading>Termination</SectionHeading>
          <Para>
            You can request deletion of your account at any time. The operator may suspend or terminate an
            account that violates these Terms, misuses the platform, or poses a security risk to other
            members.
          </Para>

          <SectionHeading>Changes to these Terms</SectionHeading>
          <Para>
            If a meaningful change is made to these Terms, the effective date above will be updated and, where
            the change affects a consent you've already granted, you'll be asked to re-confirm it.
          </Para>

          <SectionHeading>Governing law</SectionHeading>
          <Para>
            These Terms are governed by the laws of the operator's home jurisdiction, without regard to
            conflict-of-law principles. <Em>[Placeholder — to be confirmed on attorney review.]</Em>
          </Para>

          <SectionHeading>Contact</SectionHeading>
          <Para>
            Questions about these Terms — reach me directly. My contact information is on my resume and
            public profile.
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
              <Link to="/privacy" style={{ color: 'var(--sb-gold)', fontSize: '0.75rem', textDecoration: 'underline' }}>
                Privacy Policy
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
