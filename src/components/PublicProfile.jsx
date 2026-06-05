import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RenderSection } from './blocks/index.jsx';
import PublicFooter from './PublicFooter.jsx';
import BackLink from './BackLink.jsx';

export default function PublicProfile() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/members/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Profile not published yet');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
    fetch('/api/config/public').then((r) => r.json()).then(setConfig).catch(() => {});
  }, [slug]);

  if (error) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--sb-cream)', textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 className="sb-display" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Profile Not Available
        </h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '2rem' }}>{error}</p>
        <BackLink>← Back to Salt Basin</BackLink>
      </div>
    );
  }
  if (!data) return null;
  const sections = data.profile?.sections || [];

  return (
    <div>
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
          zIndex: 100,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="sb-display" style={{ fontSize: '1.1rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-cream)' }}>
            ← Salt Basin Net Works
          </div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
            Operator Profile
          </div>
        </Link>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-dusty)' }}>
          /u/{slug}
        </div>
      </nav>
      {sections.map((sec) => (
        <RenderSection key={sec.id} section={sec} config={config} mode="public" />
      ))}
      <PublicFooter config={config} />
    </div>
  );
}
