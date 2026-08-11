import React, { useEffect } from 'react';

export default function TestLoginRedirect() {
  const testBaseUrl = String(import.meta.env.VITE_TEST_BASE_URL || '').replace(/\/$/, '');
  useEffect(() => {
    if (testBaseUrl) window.location.replace(`${testBaseUrl}/login?environment=test`);
  }, [testBaseUrl]);
  return <div className="sb-login-brand-page"><div className="sb-login-brand-panel"><div className="sb-eyebrow">Salt Basin Test Environment</div><h2 className="sb-display" style={{ marginTop: '0.75rem' }}>Test Sign In</h2>{testBaseUrl ? <p>Opening the isolated test environment…</p> : <><p>The test environment is not configured for this build.</p><p style={{ fontSize: '0.8rem' }}>Set <code>VITE_TEST_BASE_URL</code> to the replica deployment URL. Production credentials are never submitted from this route.</p><a className="sb-btn sb-btn-outline" href="/login">Return to production sign in</a></>}</div></div>;
}

