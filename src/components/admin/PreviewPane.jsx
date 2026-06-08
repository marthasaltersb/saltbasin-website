import React from 'react';
import { Link } from 'react-router-dom';
import { styles } from './adminStyles.js';
import PublicNav from '../PublicNav.jsx';
import PublicFooter from '../PublicFooter.jsx';
import { RenderSection } from '../blocks/index.jsx';

// Renders the current draft page in-process (not via iframe). Status='draft'
// sections show with a banner; soon sections show the real content too so the
// editor can iterate without flipping status back and forth.
export default function PreviewPane({ site, config, currentPageKey, isMember = false, slug = '' }) {
  const pages = site?.pages || {};
  const page = pages[currentPageKey];

  // Build grouped nav items matching the public profile logic.
  const sortedNavPages = Object.entries(pages)
    .filter(([, p]) => p.status !== 'draft' && !p.hideFromNav)
    .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));
  const navItems = [];
  const seenGroups = new Set();
  for (const [k, p] of sortedNavPages) {
    if (!p.navGroup) {
      navItems.push({ type: 'page', key: k, page: p });
    } else if (!seenGroups.has(p.navGroup)) {
      seenGroups.add(p.navGroup);
      navItems.push({ type: 'group', group: p.navGroup, pages: sortedNavPages.filter(([, pp]) => pp.navGroup === p.navGroup) });
    }
  }

  const previewUrl = isMember
    ? `saltbasin.net/u/${slug}${page?.slug ? `/${page.slug}` : ''}`
    : (config?.site?.domain || 'saltbasin.net') + '/' + (page?.slug || '');

  return (
    <div style={styles.previewPane}>
      <div style={styles.previewHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-teal-deep)' }}>
            Live Preview · Draft
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)', marginTop: 2 }}>
            {previewUrl}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {page ? (
          <>
            {isMember ? (
              <nav style={{
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
              }}>
                <div>
                  <div className="sb-display" style={{ fontSize: '1.05rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-cream)' }}>
                    ← Salt Basin Net Works
                  </div>
                  <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
                    Operator Profile · {config?.site?.ownerName || slug || 'member'}
                  </div>
                </div>
                {navItems.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {navItems.map((item) => {
                      if (item.type === 'page') {
                        const active = item.key === currentPageKey;
                        return (
                          <span key={item.key} style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.66rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: active ? 'var(--sb-gold)' : 'var(--sb-sage)', padding: '0.3rem 0.65rem', borderBottom: active ? '0.5px solid var(--sb-gold)' : '0.5px solid transparent', cursor: 'default' }}>
                            {item.page.navLabel || item.page.name}
                          </span>
                        );
                      }
                      const groupActive = item.pages.some(([k]) => k === currentPageKey);
                      return (
                        <span key={item.group} style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.66rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: groupActive ? 'var(--sb-gold)' : 'var(--sb-sage)', padding: '0.3rem 0.65rem', borderBottom: groupActive ? '0.5px solid var(--sb-gold)' : '0.5px solid transparent', cursor: 'default' }}>
                          {item.group} ▾
                        </span>
                      );
                    })}
                  </div>
                )}
              </nav>
            ) : (
              <PublicNav site={config?.site || {}} />
            )}
            {(page.sections || []).map((sec) => (
              <RenderSection key={sec.id} section={sec} config={config} mode="preview" />
            ))}
            <PublicFooter config={config} />
          </>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--sb-teal-deep)' }}>
            Select a page to preview.
          </div>
        )}
      </div>
    </div>
  );
}
