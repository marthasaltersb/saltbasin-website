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
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RenderSection } from './blocks/index.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';
import { track } from '../lib/analytics.js';
import { toast } from '../lib/toast.js';

function ConnectionActions({ slug }) {
  const nav = useNavigate();
  const [connStatus, setConnStatus] = useState(null); // null=loading, {status, connectionId, iAmRequester, targetUserId}
  const [me, setMe] = useState(undefined); // undefined=loading, null=anon
  const [working, setWorking] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setMe(d.user || null);
        if (d.user) {
          fetch(`/api/members/me/connection-status/${encodeURIComponent(slug)}`, { credentials: 'include' })
            .then(r => r.json()).then(setConnStatus).catch(() => setConnStatus({ status: 'none' }));
        } else {
          setConnStatus({ status: 'none' });
        }
      }).catch(() => { setMe(null); setConnStatus({ status: 'none' }); });
  }, [slug]);

  if (me === undefined || connStatus === null) return null;
  if (!me) return null; // anon — no action buttons

  async function sendRequest() {
    setWorking(true);
    try {
      const r = await fetch('/api/members/me/connections/request', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setConnStatus(s => ({ ...s, status: d.status }));
      toast.success(d.existing ? 'Already connected or requested' : 'Connection request sent');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function sendMsg() {
    if (!msgText.trim() || !connStatus?.targetUserId) return;
    setWorking(true);
    try {
      const r = await fetch('/api/members/me/messages', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: connStatus.targetUserId, body: msgText.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success('Message sent');
      setShowMsgBox(false);
      setMsgText('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  }

  const { status } = connStatus;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
      {status === 'none' && (
        <button onClick={sendRequest} disabled={working}
          style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: '0.5px solid var(--sb-gold)', background: 'transparent', color: 'var(--sb-gold)', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>
          {working ? '…' : '+ Connect'}
        </button>
      )}
      {status === 'pending' && (
        <span style={{ padding: '0.35rem 0.9rem', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'var(--sb-dusty)', fontSize: '0.7rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>
          Request Sent
        </span>
      )}
      {status === 'accepted' && (
        <>
          <button onClick={() => setShowMsgBox(v => !v)}
            style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.08em' }}>
            Message
          </button>
          {showMsgBox && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--sb-navy)', border: '0.5px solid rgba(196,132,58,0.3)', borderRadius: 10, padding: '1rem', width: 320, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Send Message</div>
              <textarea value={msgText} onChange={e => setMsgText(e.target.value)} rows={3}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'var(--sb-cream)', fontSize: '0.83rem', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                placeholder="Write a message…" />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowMsgBox(false)} style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--sb-dusty)', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={sendMsg} disabled={working || !msgText.trim()} style={{ padding: '0.35rem 0.8rem', borderRadius: 6, border: 'none', background: 'var(--sb-gold)', color: 'white', fontSize: '0.72rem', cursor: 'pointer' }}>{working ? 'Sending…' : 'Send'}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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

  // Fire page-view beacon when the page + slug resolve
  useEffect(() => {
    if (!data) return;
    track('visit', {
      appId: 'app.member-site',
      objectType: 'member-profile',
      objectId: slug,
      metadata: { pageSlug: subPath || '/', referrer: document.referrer || null },
    });
  }, [slug, subPath, data]);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {navItems.length > 0 && (
            <ProfileNav navItems={navItems} slug={slug} wantSlug={wantSlug} />
          )}
          <div style={{ position: 'relative' }}>
            <ConnectionActions slug={slug} />
          </div>
        </div>
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
