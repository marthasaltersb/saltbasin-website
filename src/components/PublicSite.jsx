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
  if (!site || !config) return null;

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
