import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import CrystalMarkField from './CrystalMarkField.jsx';
import BestyStaffContactSection from './BestyStaffContactSection.jsx';
import { RenderSection } from './blocks/index.jsx';
import { defaultSite, defaultConfig } from '../../server/data/defaultSite.js';
import { useSeoHead } from '../lib/useSeoHead.js';

// Short-lived session cache so repeat navigation within the same tab session
// doesn't re-fetch site/config on every route change. Cleared implicitly by
// its own TTL — no manual invalidation needed since it's this short-lived.
const SESSION_CACHE_KEY = `sb-public-site-cache-v2-${import.meta.env.DEV ? 'draft' : 'published'}`;
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

async function retryRequest(load, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await load(); } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  throw lastError;
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
    const loadPublicState = async () => {
      if (!import.meta.env.DEV) return Promise.all([api.getPublishedSite(), api.getPublicConfig()]);
      const session = await api.me().catch(() => ({ user: null }));
      return session?.user
        ? Promise.all([
            api.getDraftSite().catch(() => api.getPublishedSite()),
            api.getDraftConfig().catch(() => api.getPublicConfig()),
          ])
        : Promise.all([api.getPublishedSite(), api.getPublicConfig()]);
    };
    retryRequest(loadPublicState)
      .then(([s, c]) => {
        setError(null);
        setSite(s);
        setConfig(c);
        writeSessionCache(s, c);
      })
      .catch((e) => {
        // Keep the public homepage available through local API cold starts or
        // brief network interruptions. Canonical defaults are preferable to a
        // permanent "Request failed" screen and are replaced on next refresh.
        console.warn('[PublicSite] CMS state unavailable; rendering canonical fallback:', e.message);
        setError(null);
        setSite(defaultSite);
        setConfig(defaultConfig);
      });
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

  // Full path slug — supports nested like 'consulting'. Computed above the
  // loading/error early returns below (not just for the JSX further down) so
  // useSeoHead can be called unconditionally — hooks must run before any
  // conditional return (see the EditorPane.jsx blank-screen bug this rule
  // already caused once, documented in CLAUDE.md).
  const requestedSlug = params['*'] || '';
  const pages = site?.pages || {};
  let currentEntry =
    Object.entries(pages).find(([, p]) => (p.slug || '') === requestedSlug) ||
    (requestedSlug === ''
      ? Object.entries(pages).find(([, p]) => p.slug === '' || !p.slug)
      : null);
  if (!currentEntry && requestedSlug === 'consulting/founder') {
    const fallback = defaultSite.pages['consulting-founder'];
    const capabilitySummary = defaultSite.pages.home?.sections?.find((section) => section.type === 'industryWheel');
    currentEntry = ['consulting-founder', {
      ...fallback,
      sections: [
        ...fallback.sections.filter((section) => ['about', 'timeline'].includes(section.type)),
        ...(capabilitySummary ? [{ ...capabilitySummary, id: 'founder-capability-confidence', name: 'Capability Confidence & Proficiency Summary' }] : []),
      ],
    }];
  }
  const currentPage = currentEntry ? currentEntry[1] : null;

  useSeoHead(currentPage, { siteName: 'Salt Basin Net Works' });

  if (error) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--sb-risk-critical)' }}>{error}</p>
      </div>
    );
  }
  if (!site || !config) return <ColdStartLoader />;
  if (!currentEntry) return <NotFound />;

  const configuredSections = currentPage.sections || [];
  const hasConfiguredBestyStaff = requestedSlug === '' && configuredSections.some(
    (section) => section.status === 'live' && section.type === 'conversationalDemo'
  );

  const liveSlugs = new Set(
    Object.values(pages)
      .filter((p) => p.status === 'live')
      .map((p) => (p.slug || '').replace(/^\//, '').replace(/\/$/, ''))
  );

  // Config-driven brand overrides — matches the pattern already used in
  // PublicProfile.jsx. This used to be a hardcoded static CSS block
  // (fixed navy/teal values, never read from config.brand at all), which
  // silently made the admin-scope "Brand Colors" ConfigPanel card dead code
  // and fought with the [data-theme] system on tokens every theme also
  // overrides (regression-gate audit finding, 2026-07-16) — fixed here to
  // read real config the same way the member profile page already does.
  const brand = config?.brand || {};
  const brandCss = brand && Object.keys(brand).length ? `
    .sb-public-site-root {
      ${brand.primary ? `--sb-navy: ${brand.primary}; --sb-navy-deep: ${brand.primary};` : ''}
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
      <CrystalMarkField />
      <PublicNav site={config.site} pages={pages} />
      <Breadcrumbs />
      {configuredSections.filter((sec) => sec.id !== 'home-founder-highlights' && !['conversationalDemo', 'journeyRods'].includes(sec.type)).map((sec) => (
          <RenderSection key={sec.id} section={sec} config={{ ...config, homepageSections: currentPage.sections }} mode="public" liveSlugs={liveSlugs} />
        ))}
      {requestedSlug === '' && <AudiencePathways />}
      {requestedSlug === '' && <BestyStaffContactSection config={config} />}
      <PublicFooter config={config} />
    </div>
  );
}

function AudiencePathways() {
  const pathways = [
    {
      id: 'individuals', eyebrow: 'For consumers', title: 'Build your Member Career World',
      text: 'Organize career evidence once, then turn it into a portfolio, targeted resumes, case studies, and an approved personal brand—with access to enterprise product simulations.',
      features: ['Career portfolio and case studies', 'Role-targeted resume generation', 'Personal brand publishing', 'Enterprise simulation access'],
      actions: [{ label: 'Build My Career Portfolio', href: '/signup', primary: true }, { label: 'Enter My Member World', href: '/member' }],
    },
    {
      id: 'organizations', eyebrow: 'For organizations', title: 'Render the enterprise you actually operate',
      text: 'Use Salt Basin MRS to connect source evidence, definitions, handoffs, financial exposure, and governed agents into one navigable Enterprise Ecosystem.',
      features: ['Enterprise Ecosystem rendering', 'Evidence normalization and lineage', 'Q2R and financial simulations', 'Policy-bounded agent workforce'],
      actions: [{ label: 'Explore Solutions & Services', href: '/platform', primary: true }, { label: 'Talk with BestyStaff', href: '#bestystaff' }],
    },
  ];
  return (
    <section className="sbh-band sbh-audience-band" id="pathways">
      <div className="sbh-section-head"><p className="sbh-eyebrow">Choose your path</p><h2>For consumers or for organizations</h2><p>Start in the context that matches what you need. Your permissions, products, and simulations adapt to that context.</p></div>
      <div className="sbh-audience-grid">
        {pathways.map((pathway) => <article className={`sbh-audience-card sbh-audience-${pathway.id}`} key={pathway.id}>
          <p className="sbh-card-tag">{pathway.eyebrow}</p><h3>{pathway.title}</h3><p className="sbh-audience-copy">{pathway.text}</p>
          <ul>{pathway.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <div className="sbh-audience-actions">{pathway.actions.map((action) => <a key={action.label} className={`sbh-btn ${action.primary ? 'sbh-btn-primary' : 'sbh-btn-secondary'}`} href={action.href}>{action.label}</a>)}</div>
        </article>)}
      </div>
    </section>
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
