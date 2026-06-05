import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Top-level nav items + optional dropdown children. Children can be either a
// route (`to`) or an in-page anchor (`anchor`). Anchor links only navigate
// within the home page; if you're on another page they take you home first.
const NAV = [
  {
    label: 'Home',
    to: '/',
    children: [
      { label: 'About / Intro', anchor: 'about-intro' },
      { label: 'Industries Overview', anchor: 'industryWheel' },
      { label: 'Domains & Niche Expertise', anchor: 'domains-niche' },
    ],
  },
  {
    label: 'Consulting',
    to: '/consulting/founder',
    children: [
      { label: 'Meet the Founder', to: '/consulting/founder' },
      { label: 'Services', to: '/consulting/services' },
      { label: 'Self-Service Assessments', to: '/consulting/assessments' },
    ],
  },
  { label: 'Resources', to: '/resources' },
  { label: 'Creative Storefront', to: '/creative' },
];

export default function PublicNav({ site }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Close the drawer whenever the route changes (after clicking a nav item).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  // Detect whether someone's already signed in. The nav button reflects this
  // so the visitor doesn't see "Sign In" when they're already logged in.
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthUser(d.user || null))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(27, 42, 59, 0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid rgba(232,221,208,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div
          className="sb-display"
          style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--sb-cream)',
          }}
        >
          {site?.name || 'Salt Basin'}
        </div>
        <div
          style={{
            fontFamily: 'var(--sb-font-label)',
            fontSize: '0.55rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--sb-gold)',
          }}
        >
          Net Works · {site?.tagline}
        </div>
      </Link>

      {/* Hamburger — only visible on mobile (CSS media query handles show/hide) */}
      <button
        className="sb-nav-hamburger"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <ul
        className={`sb-nav-list${mobileOpen ? ' open' : ''}`}
        style={{ gap: '1.5rem', listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}
      >
        {NAV.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            pathname={location.pathname}
            isMobile={mobileOpen}
          />
        ))}
        <li>
          <AuthButton user={authUser} />
        </li>
      </ul>
    </nav>
  );
}

// Top-right sign-in pill. When logged out: routes to /admin/login.
// When logged in: shows the user's email handle + routes to their dashboard
// (admin or member, depending on role).
function AuthButton({ user }) {
  if (user) {
    const target = user.role === 'admin' ? '/admin' : '/member';
    const handle = (user.email || '').split('@')[0];
    return (
      <Link
        to={target}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 0.95rem',
          background: 'var(--sb-gold)',
          color: 'var(--sb-ivory)',
          borderRadius: 'var(--sb-radius)',
          fontSize: '0.72rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        {handle} ↗
      </Link>
    );
  }
  return (
    <Link
      to="/admin/login"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.45rem 0.95rem',
        background: 'transparent',
        color: 'var(--sb-cream)',
        border: '0.5px solid rgba(232,221,208,0.35)',
        borderRadius: 'var(--sb-radius)',
        fontSize: '0.72rem',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textDecoration: 'none',
      }}
    >
      Sign In
    </Link>
  );
}

function NavItem({ item, pathname, isMobile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);
  const hasChildren = !!item.children?.length;
  // When the mobile drawer is open, expand submenus inline (no hover, no
  // floating panel) so the whole nav fits in one column.
  const inlineMode = !!isMobile;

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleEnter() {
    clearTimeout(closeTimer.current);
    if (hasChildren) setOpen(true);
  }
  function handleLeave() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  const isActive =
    pathname === item.to ||
    (item.to !== '/' && pathname.startsWith(item.to)) ||
    (item.children || []).some((c) => c.to && pathname.startsWith(c.to));

  return (
    <li
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative' }}
    >
      <Link
        to={item.to}
        onClick={() => hasChildren && setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.8rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isActive ? 'var(--sb-gold)' : 'var(--sb-sage)',
          textDecoration: 'none',
        }}
      >
        {item.label}
        {hasChildren && (
          <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>▾</span>
        )}
      </Link>
      {hasChildren && (open || inlineMode) && (
        <div
          style={
            inlineMode
              ? {
                  marginTop: '0.5rem',
                  paddingLeft: '0.75rem',
                  borderLeft: '0.5px dashed rgba(196,132,58,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                }
              : {
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 240,
                  background: 'var(--sb-navy-deep)',
                  border: '0.5px solid rgba(196,132,58,0.4)',
                  borderTop: '2px solid var(--sb-gold)',
                  borderRadius: 'var(--sb-radius)',
                  padding: '0.5rem 0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  zIndex: 200,
                }
          }
        >
          {item.children.map((child) =>
            child.to ? (
              <Link
                key={child.label}
                to={child.to}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.75rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: pathname === child.to ? 'var(--sb-gold)' : 'var(--sb-cream)',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(196,132,58,0.12)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {child.label}
              </Link>
            ) : (
              <AnchorLink
                key={child.label}
                label={child.label}
                anchor={child.anchor}
                onNavigated={() => setOpen(false)}
              />
            )
          )}
        </div>
      )}
    </li>
  );
}

// Anchor links scroll within the home page. If you're elsewhere, route home
// first and then scroll.
function AnchorLink({ label, anchor, onNavigated }) {
  const location = useLocation();
  function go(e) {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Route home then scroll after a tick
      window.location.href = '/#' + anchor;
    }
    onNavigated?.();
  }
  return (
    <a
      href={'/#' + anchor}
      onClick={go}
      style={{
        display: 'block',
        padding: '0.55rem 1.1rem',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--sb-cream)',
        textDecoration: 'none',
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(196,132,58,0.12)')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </a>
  );
}
