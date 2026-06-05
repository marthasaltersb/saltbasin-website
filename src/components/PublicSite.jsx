import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import { RenderSection } from './blocks/index.jsx';

export default function PublicSite() {
  const [site, setSite] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const params = useParams();
  const location = useLocation();

  useEffect(() => {
    Promise.all([api.getPublishedSite(), api.getPublicConfig()])
      .then(([s, c]) => {
        setSite(s);
        setConfig(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  // After data + DOM exist, scroll to any #anchor in the URL (used by the Home
  // nav dropdown when arriving from another page).
  useEffect(() => {
    if (!site || !config) return;
    if (location.hash) {
      const id = location.hash.replace(/^#/, '');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [site, config, location.hash, location.pathname]);

  if (error) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--sb-risk-critical)' }}>{error}</p>
      </div>
    );
  }
  if (!site || !config) return <ColdStartLoader />;

  // Full path slug — supports nested like 'consulting/founder'
  const requestedSlug = params['*'] || '';
  const pages = site.pages || {};
  const currentEntry =
    Object.entries(pages).find(([, p]) => (p.slug || '') === requestedSlug) ||
    (requestedSlug === ''
      ? Object.entries(pages).find(([, p]) => p.slug === '' || !p.slug)
      : null);
  if (!currentEntry) return <NotFound />;
  const [, currentPage] = currentEntry;

  return (
    <div>
      <PublicNav site={config.site} />
      {(currentPage.sections || []).map((sec) => (
        <RenderSection key={sec.id} section={sec} config={config} mode="public" />
      ))}
      <PublicFooter config={config} />
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'var(--sb-cream)',
        textAlign: 'center',
        padding: '4rem 2rem',
      }}
    >
      <h1 className="sb-display" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Not Found
      </h1>
      <p style={{ color: 'var(--sb-sage)' }}>That page doesn't exist (yet).</p>
    </div>
  );
}

// Branded loading state shown during the initial API fetch. On a warm server
// this flashes for ~300ms and is invisible. On a cold-started Render service
// it shows for 20–30 seconds while the container wakes up, so the visitor
// sees the brand instead of a blank screen.
function ColdStartLoader() {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  React.useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  const slow = elapsedSec >= 3; // show the explainer once we're definitely on a cold start
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--sb-navy)',
        color: 'var(--sb-cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        className="sb-display"
        style={{
          fontSize: '2rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--sb-cream)',
          marginBottom: '0.4rem',
        }}
      >
        Salt Basin
      </div>
      <div
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.65rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginBottom: '2rem',
        }}
      >
        Net Works · Bottom Lines with a Rising Tide
      </div>

      {/* Three-dot pulse */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--sb-gold)',
              animation: 'sb-toast-in 1.1s ease infinite',
              animationDelay: `${delay}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {slow && (
        <div
          style={{
            maxWidth: 460,
            fontSize: '0.82rem',
            color: 'var(--sb-sage)',
            lineHeight: 1.7,
            opacity: 0.8,
          }}
        >
          The site is waking up — this is a small Render free-tier quirk that adds
          a few seconds on the first visit after idle. Hold tight, content is
          loading in {elapsedSec}s.
        </div>
      )}
    </div>
  );
}
