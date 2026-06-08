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

import React, { useEffect, useState, useRef } from 'react';
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

  // Build ordered nav items, respecting hideFromNav and navGroup grouping.
  const sortedPages = entries
    .filter(([, p]) => p.status !== 'draft' && !p.hideFromNav)
    .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));

  // Build ordered nav item list: interleave top-level pages and group headers
  // in the order their first member page appears.
  const navItems = [];
  const seenGroups = new Set();
  for (const [k, p] of sortedPages) {
    if (!p.navGroup) {
      navItems.push({ type: 'page', key: k, page: p });
    } else if (!seenGroups.has(p.navGroup)) {
      seenGroups.add(p.navGroup);
      navItems.push({ type: 'group', group: p.navGroup, pages: sortedPages.filter(([, pp]) => pp.navGroup === p.navGroup) });
    }
  }

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

        {navItems.length > 0 && (
          <ProfileNav navItems={navItems} slug={slug} wantSlug={wantSlug} />
        )}
      </nav>

      {(currentPage.sections || []).filter((sec) => {
        // If a default resume preset is defined, filter sections on any page
        // to only those included in the preset.
        const defaultPreset = (config?.resumePresets || []).find((p) => p.isDefault);
        if (!defaultPreset || !defaultPreset.sections?.length) return true;
        return defaultPreset.sections.some((s) => s.sectionId === sec.id && s.pageKey === currentPageKey);
      }).map((sec) => (
        <RenderSection key={sec.id} section={sec} config={config} mode="public" memberSlug={slug} />
      ))}
      <PublicFooter config={config} />
    </div>
  );
}

const navLinkStyle = (active) => ({
  fontFamily: 'var(--sb-font-label)',
  fontSize: '0.66rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: active ? 'var(--sb-gold)' : 'var(--sb-sage)',
  textDecoration: 'none',
  padding: '0.3rem 0.65rem',
  borderBottom: active ? '0.5px solid var(--sb-gold)' : '0.5px solid transparent',
});

function ProfileNav({ navItems, slug, wantSlug }) {
  const [openGroup, setOpenGroup] = React.useState(null);
  const ref = useRef(null);

  // Close dropdown when clicking outside.
  React.useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpenGroup(null); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
      {navItems.map((item, i) => {
        if (item.type === 'page') {
          const p = item.page;
          const href = p.slug ? `/u/${slug}/${p.slug}` : `/u/${slug}`;
          const active = (p.slug || '') === wantSlug || (wantSlug === '' && (!p.slug || item.key === 'home'));
          return (
            <Link key={item.key} to={href} style={navLinkStyle(active)}>
              {p.navLabel || p.name}
            </Link>
          );
        }
        // Group dropdown
        const groupActive = item.pages.some(([, p]) => (p.slug || '') === wantSlug || (wantSlug === '' && !p.slug));
        const isOpen = openGroup === item.group;
        return (
          <div key={item.group} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : item.group)}
              style={{ ...navLinkStyle(groupActive), background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {item.group} <span style={{ fontSize: '0.55rem' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'rgba(27,42,59,0.98)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 'var(--sb-radius)', padding: '0.4rem 0', minWidth: 160, zIndex: 200 }}>
                {item.pages.map(([k, p]) => {
                  const href = p.slug ? `/u/${slug}/${p.slug}` : `/u/${slug}`;
                  const active = (p.slug || '') === wantSlug;
                  return (
                    <Link key={k} to={href} onClick={() => setOpenGroup(null)} style={{ display: 'block', padding: '0.4rem 1rem', fontFamily: 'var(--sb-font-label)', fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? 'var(--sb-gold)' : 'var(--sb-sage)', textDecoration: 'none' }}>
                      {p.navLabel || p.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
