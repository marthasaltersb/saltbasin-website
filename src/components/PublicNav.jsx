import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { recordBestyTouch } from '../lib/bestyStaffAttribution.js';

function buildNav(pages) {
  const ordered = Object.values(pages || {})
    .filter((p) => p.status !== 'draft' && !p.hideFromNav)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return ordered.map((p) => {
    const slug = '/' + (p.slug || '');
    const subPages = (p.sections || []).filter((s) => s.navSubPage && s.status !== 'draft');
    return {
      label: p.navLabel || p.name,
      to: slug,
      children: subPages.length
        ? subPages.map((s) => ({ label: s.navLabel || s.name, anchor: s.id, pageSlug: slug }))
        : undefined,
    };
  });
}

export default function PublicNav({ site, pages }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const nav = buildNav(pages);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthUser(d.user || null))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <nav className="sb-public-nav">
      <Link to="/" className="sb-public-brand">
        <div className="sb-public-brand-name">
          <span>Salt Basin</span>
          <span className="sb-public-brand-network">Net Works</span>
        </div>
        <div className="sb-public-brand-domain">{site?.domain || 'saltbasin.net'}</div>
      </Link>

      <button
        className={`sb-nav-hamburger${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      />

      <ul className={`sb-nav-list${mobileOpen ? ' open' : ''}`}>
        {nav.map((item) => (
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

function AuthButton({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => {
      clearTimeout(closeTimer.current);
      document.removeEventListener('mousedown', close);
    };
  }, []);

  function keepOpen() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }

  if (user) {
    const target = user.role === 'admin' ? '/admin' : '/member';
    const handle = (user.email || '').split('@')[0];
    return (
      <Link className="sb-public-auth sb-public-auth-user" to={target}>
        {handle}
        <span aria-hidden="true">-&gt;</span>
      </Link>
    );
  }

  return (
    <div className="sb-public-auth-wrap" ref={ref} onMouseEnter={keepOpen} onMouseLeave={closeSoon}>
      <button className="sb-public-auth" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Net Works Sign In <span className="sb-public-nav-caret">v</span>
      </button>
      {open && (
        <div className="sb-public-auth-menu">
          <Link to="/login" onClick={() => setOpen(false)}>Sign In</Link>
          <a
            href="/signup?intakeSource=networks-sign-up"
            onClick={() => recordBestyTouch('networks-sign-up', { action: 'sign-up-menu' })}
          >
            Sign Up
          </a>
        </div>
      )}
    </div>
  );
}

function NavItem({ item, pathname, isMobile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimer = useRef(null);
  const hasChildren = !!item.children?.length;
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

  const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));

  return (
    <li
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="sb-public-nav-item"
    >
      <Link
        className={`sb-public-nav-link${isActive ? ' active' : ''}`}
        to={item.to}
        onClick={() => hasChildren && setOpen((current) => !current)}
      >
        {item.label}
        {hasChildren && <span className="sb-public-nav-caret">v</span>}
      </Link>

      {hasChildren && (open || inlineMode) && (
        <div className={`sb-public-nav-menu${inlineMode ? ' inline' : ''}`}>
          {item.children.map((child) => (
            <AnchorLink
              key={child.label}
              label={child.label}
              anchor={child.anchor}
              pageSlug={child.pageSlug}
              onNavigated={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </li>
  );
}

function AnchorLink({ label, anchor, pageSlug, onNavigated }) {
  const location = useLocation();

  function go(e) {
    e.preventDefault();
    if (location.pathname === pageSlug) {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = pageSlug + '#' + anchor;
    }
    onNavigated?.();
  }

  return (
    <a className="sb-public-nav-anchor" href={pageSlug + '#' + anchor} onClick={go}>
      {label}
    </a>
  );
}
