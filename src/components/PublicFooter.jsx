import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter({ config }) {
  const site = config?.site || {};
  const social = Object.values(config?.social || {}).filter((s) => s.on && s.url);
  return (
    <footer
      style={{
        background: 'var(--sb-navy-deep)',
        padding: '2.5rem',
        borderTop: '0.5px solid rgba(139,155,174,0.12)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '2rem',
        }}
      >
        <div>
          <div
            className="sb-display"
            style={{
              fontSize: '1.4rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--sb-cream)',
            }}
          >
            {site.name || 'Salt Basin'}
          </div>
          <div
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
              marginTop: 3,
            }}
          >
            Net Works · {site.tagline}
          </div>
          {site.domain && (
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--sb-gold)',
                opacity: 0.6,
                marginTop: 3,
              }}
            >
              {site.domain}
            </div>
          )}
        </div>

        {social.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {social.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.55rem 1rem',
                  background: `${s.color}1c`,
                  border: `0.5px solid ${s.color}50`,
                  borderRadius: 'var(--sb-radius)',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: 'var(--sb-cream)',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <Link
            to="/data-notice"
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
              textDecoration: 'none',
            }}
          >
            Data & Security Notice
          </Link>
          <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', opacity: 0.6 }}>
            {site.copyrightLine || '© Salt Basin Net Works'}
          </div>
        </div>
      </div>
    </footer>
  );
}
