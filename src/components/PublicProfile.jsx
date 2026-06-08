// Member-owned public profile site.
//
// Each member runs their own multi-page CMS through the AdminShell (scope =
// member). What they publish lands at /u/:slug — and any deeper paths like
// /u/:slug/about, /u/:slug/contact resolve to the page whose `slug` matches
// the trailing segment. The renderer is the same block library Salt Basin's
// own home page uses.
//
// Member-level brand colors are applied by injecting an inline <style> block
// that overrides the --sb-* CSS variables, scoped to this profile only.

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RenderSection } from './blocks/index.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';

export default function PublicProfile() {
  const params = useParams();
  const slug = params.slug;
  const subPath = params['*'] || ''; // '' for home, 'about' for /u/:slug/about
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/member-site/by-slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Profile not published yet');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'var(--sb-cream)',
          textAlign: 'center',
          padding: '4rem 2rem',
        }}
      >
        <h1 className="sb-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Profile Not Available
        </h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '2rem' }}>{error}</p>
        <BackLink>← Back to Salt Basin</BackLink>
      </div>
    );
  }
  if (!data) return null;

  const { site, config } = data;
  const pages = site?.pages || {};

  // Find the page whose slug matches the URL tail. Empty string ('') means
  // home — try the page explicitly named 'home' first, then fall back to any
  // page with an empty slug.
  const wantSlug = subPath.replace(/\/$/, '');
  const entries = Object.entries(pages);
  const match =
    entries.find(([, p]) => (p.slug || '') === wantSlug) ||
    (wantSlug === '' && entries.find(([k]) => k === 'home')) ||
    null;

  if (!match) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'var(--sb-cream)',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <h1 className="sb-display" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '2rem' }}>
          No page at /u/{slug}/{wantSlug}
        </p>
        <Link to={`/u/${slug}`} className="sb-btn sb-btn-outline">← Back to {site?.pages?.home?.name || 'home'}</Link>
      </div>
    );
  }

  const [currentPageKey, currentPage] = match;
  const navPages = entries
    .filter(([, p]) => p.status !== 'draft')
    .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));

  // Member brand overrides — scoped to this profile via a style block.
  const brand = config?.brand || {};
  const brandCss = brand && Object.keys(brand).length ? `
    .sb-member-profile-root {
      ${brand.primary ? `--sb-navy: ${brand.primary};` : ''}
      ${brand.primary ? `--sb-navy-deep: ${brand.primary};` : ''}
      ${brand.accent  ? `--sb-gold: ${brand.accent};` : ''}
      ${brand.ink     ? `--sb-cream: ${brand.ink};` : ''}
      ${brand.paper   ? `--sb-ivory: ${brand.paper};` : ''}
    }
  ` : '';

  return (
    <div className="sb-member-profile-root">
      {brandCss && <style>{brandCss}</style>}

      <nav
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(27,42,59,0.97)',
          backdropFilter: 'blur(8px)',
          padding: '1rem 2.5rem',
          borderBottom: '0.5px solid rgba(232,221,208,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 100,
          flexWrap: 'wrap',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div
            className="sb-display"
            style={{
              fontSize: '1.05rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-cream)',
            }}
          >
            ← Salt Basin Net Works
          </div>
          <div
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.58rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-gold)',
            }}
          >
            Operator Profile · {config?.site?.ownerName || `/u/${slug}`}
          </div>
        </Link>

        {/* Sub-page nav: config.nav.items takes precedence; falls back to auto page list */}
        {(() => {
          const configNavItems = config?.nav?.items;
          if (configNavItems && configNavItems.length > 0) {
            return (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {configNavItems.map((item, i) => {
                  const active = window.location.pathname === item.href || window.location.pathname + '/' === item.href;
                  return (
                    <Link
                      key={i}
                      to={item.href}
                      style={{
                        fontFamily: 'var(--sb-font-label)',
                        fontSize: '0.66rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: active ? 'var(--sb-gold)' : 'var(--sb-sage)',
                        textDecoration: 'none',
                        padding: '0.3rem 0.65rem',
                        borderBottom: active ? '0.5px solid var(--sb-gold)' : '0.5px solid transparent',
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          }
          if (navPages.length <= 1) return null;
          return (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {navPages.map(([k, p]) => {
                const href = p.slug ? `/u/${slug}/${p.slug}` : `/u/${slug}`;
                const active =
                  (p.slug || '') === wantSlug ||
                  (wantSlug === '' && (!p.slug || k === 'home'));
                return (
                  <Link
                    key={k}
                    to={href}
                    style={{
                      fontFamily: 'var(--sb-font-label)',
                      fontSize: '0.66rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: active ? 'var(--sb-gold)' : 'var(--sb-sage)',
                      textDecoration: 'none',
                      padding: '0.3rem 0.65rem',
                      borderBottom: active ? '0.5px solid var(--sb-gold)' : '0.5px solid transparent',
                    }}
                  >
                    {p.name}
                  </Link>
                );
              })}
            </div>
          );
        })()}
      </nav>

      {(currentPage.sections || []).filter((sec) => {
        // On the about page, respect resume.sections visibility toggles.
        if (currentPageKey !== 'about' && currentPage.slug !== 'about') return true;
        const rs = config?.resume?.sections;
        if (!rs) return true;
        const typeMap = { hero: 'profile', resume: 'experience', domains: 'domains', wheel: 'techStack', techWheel: 'techStack', education: 'education' };
        const flag = typeMap[sec.type];
        return flag ? rs[flag] !== false : true;
      }).map((sec) => (
        <RenderSection key={sec.id} section={sec} config={config} mode="public" memberSlug={slug} />
      ))}
      <PublicFooter config={config} />
    </div>
  );
}
