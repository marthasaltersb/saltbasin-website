import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import BestyStaffContactSection from './BestyStaffContactSection.jsx';
import { RenderSection } from './blocks/index.jsx';

// Short-lived session cache so repeat navigation within the same tab session
// doesn't re-fetch site/config on every route change. Cleared implicitly by
// its own TTL — no manual invalidation needed since it's this short-lived.
const SESSION_CACHE_KEY = 'sb-public-site-cache-v1';
const SESSION_CACHE_MS = 60_000;

function readSessionCache() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.at > SESSION_CACHE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(site, config) {
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ site, config, at: Date.now() }));
  } catch {
    // sessionStorage unavailable (private mode, quota) — fetch just won't be cached.
  }
}

export default function PublicSite() {
  const [site, setSite] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const params = useParams();
  const location = useLocation();

  useEffect(() => {
    const cached = readSessionCache();
    if (cached) {
      setSite(cached.site);
      setConfig(cached.config);
      return;
    }
    Promise.all([api.getPublishedSite(), api.getPublicConfig()])
      .then(([s, c]) => {
        setSite(s);
        setConfig(c);
        writeSessionCache(s, c);
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

  // Full path slug — supports nested like 'consulting'
  const requestedSlug = params['*'] || '';
  const pages = site.pages || {};
  const currentEntry =
    Object.entries(pages).find(([, p]) => (p.slug || '') === requestedSlug) ||
    (requestedSlug === ''
      ? Object.entries(pages).find(([, p]) => p.slug === '' || !p.slug)
      : null);
  if (!currentEntry) return <NotFound />;
  const [, currentPage] = currentEntry;

  const liveSlugs = new Set(
    Object.values(pages)
      .filter((p) => p.status === 'live')
      .map((p) => (p.slug || '').replace(/^\//, '').replace(/\/$/, ''))
  );

  // Apply admin-configured brand color overrides on saltbasin.net. Scoped to
  // .sb-public-site-root so admin chrome (/admin/*) keeps the canonical
  // Salt Basin tokens.
  const brand = config?.brand || {};
  const brandCss = (brand.primary || brand.accent || brand.ink || brand.paper) ? `
    .sb-public-site-root {
      ${brand.primary ? `--sb-navy: ${brand.primary};` : ''}
      ${brand.primary ? `--sb-navy-deep: ${brand.primary};` : ''}
      ${brand.accent  ? `--sb-gold: ${brand.accent};` : ''}
      ${brand.ink     ? `--sb-cream: ${brand.ink};` : ''}
      ${brand.paper   ? `--sb-ivory: ${brand.paper};` : ''}
    }
  ` : '';

  return (
    <div
      className={`sb-public-site-root${requestedSlug === '' ? ' sb-home-redesign' : ''}`}
      data-theme={config?.theme || 'strategic'}
    >
      {brandCss && <style>{brandCss}</style>}
      <PublicNav site={config.site} pages={pages} />
      <Breadcrumbs />
      {(currentPage.sections || [])
        .filter((sec) => requestedSlug !== '' || !['startEngagement', 'conversationalDemo'].includes(sec.type))
        .map((sec) => (
          <RenderSection key={sec.id} section={sec} config={config} mode="public" liveSlugs={liveSlugs} />
        ))}
      {requestedSlug === '' && <BestyStaffContactSection config={config} />}
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
    <div className="sb-coldstart-loader">
      <div className="sb-coldstart-panel">
        <div className="sb-coldstart-mark">
          <SaltBasinCrystal variant="signature" size="mark" />
        </div>
        <div className="sb-coldstart-kicker">Salt Basin Net Works</div>
        <h1>We build for the customer you keep.</h1>
        <p>Not just the deal you close.</p>
        <div className="sb-coldstart-pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {slow && (
          <div className="sb-coldstart-note">
            The site is waking up. Hold tight, content is loading in {elapsedSec}s.
          </div>
        )}
      </div>
    </div>
  );
}
