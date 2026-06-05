import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Smart back link. Uses browser history if there's anything to go back to —
// otherwise falls back to a route (default '/'). Solves "Return to home"
// buttons that should actually take you to the page you came from when
// possible.
export default function BackLink({
  children = '← Back',
  fallback = '/',
  className = 'sb-btn sb-btn-outline',
  style,
  ...rest
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // history.length > 1 means there's at least one prior entry. We also check
  // that the previous entry was on this site (best-effort via document.referrer).
  const canGoBack =
    typeof window !== 'undefined' &&
    window.history.length > 1 &&
    (document.referrer === '' || document.referrer.startsWith(window.location.origin));

  if (canGoBack) {
    return (
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <Link to={fallback} className={className} style={style} {...rest}>
      {children}
    </Link>
  );
}
