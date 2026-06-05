import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

// Configurable breadcrumb trail derived from the current pathname.
// Each segment maps to a display label + an optional href. If the current
// path doesn't have entries here, we render nothing.
function trailFor(pathname, params) {
  const home = { label: 'Home', to: '/' };

  if (pathname === '/' || pathname === '') return null;

  if (pathname.startsWith('/consulting/founder')) {
    return [home, { label: 'Consulting', to: '/consulting/founder' }, { label: 'Meet the Founder' }];
  }
  if (pathname.startsWith('/consulting/services')) {
    return [home, { label: 'Consulting', to: '/consulting/founder' }, { label: 'Services' }];
  }
  if (pathname.startsWith('/consulting/assessments')) {
    return [home, { label: 'Consulting', to: '/consulting/founder' }, { label: 'Self-Service Assessments' }];
  }
  if (pathname.startsWith('/resources')) {
    return [home, { label: 'Resources' }];
  }
  if (pathname.startsWith('/creative')) {
    return [home, { label: 'Creative Storefront' }];
  }
  if (pathname.startsWith('/lead/')) {
    return [home, { label: `Lead #${params.publicId || ''}` }];
  }
  if (pathname.startsWith('/u/')) {
    return [home, { label: 'Operator Profile' }];
  }
  if (pathname.startsWith('/member')) {
    return [home, { label: 'Member Dashboard' }];
  }
  if (pathname.startsWith('/signup')) {
    return [home, { label: 'Sign Up' }];
  }
  if (pathname.startsWith('/data-notice')) {
    return [home, { label: 'Data & Security Notice' }];
  }
  if (pathname.startsWith('/output/resume')) {
    return [home, { label: 'Consulting', to: '/consulting/founder' }, { label: 'Resume Output' }];
  }
  if (pathname.startsWith('/output/case-study')) {
    return [home, { label: 'Consulting', to: '/consulting/founder' }, { label: 'Case Study' }];
  }
  if (pathname.startsWith('/output/proposal')) {
    return [home, { label: 'Consulting', to: '/consulting/services' }, { label: 'Proposal' }];
  }
  return null;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const trail = trailFor(location.pathname, params);
  if (!trail || trail.length < 2) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        background: 'rgba(27,42,59,0.85)',
        borderBottom: '0.5px solid rgba(232,221,208,0.08)',
        padding: '0.45rem 1.5rem',
        fontFamily: 'var(--sb-font-label)',
        fontSize: '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--sb-dusty)',
      }}
    >
      <ol
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
          alignItems: 'center',
        }}
      >
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  style={{ color: 'var(--sb-gold)', textDecoration: 'none' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: last ? 'var(--sb-cream)' : 'var(--sb-dusty)' }}>
                  {crumb.label}
                </span>
              )}
              {!last && <span style={{ color: 'var(--sb-teal-deep)' }}>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
