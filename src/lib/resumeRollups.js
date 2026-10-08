// Client accessor for GET /api/career/resume-rollups — the member-configured
// KPI tiles, industry-duration bars and capability groups the resume outputs
// render (computed server-side by server/lib/resumeRollups.js).
//
// A failed load is returned as `error`, never as empty data: callers must
// render it distinctly from an honest '—' tile ("no data recorded").
// Deliberately NOT cached — a member edits their rollup configuration and
// expects the next render (or the template editor's live preview, which posts
// 'sb-output-data-refresh') to reflect it.
import { useEffect, useState } from 'react';

export async function fetchResumeRollups(ownerSlug = '', { atom = false } = {}) {
  const params = [ownerSlug ? `owner=${encodeURIComponent(ownerSlug)}` : '', atom ? 'include=atom' : ''].filter(Boolean);
  const ownerParam = params.length ? `?${params.join('&')}` : '';
  const r = await fetch(`/api/career/resume-rollups${ownerParam}`, { credentials: 'include' });
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.json())?.error || ''; } catch (e) { detail = `unreadable error body (${e.message})`; }
    throw new Error(`Resume rollups request failed (${r.status})${detail ? `: ${detail}` : ''}`);
  }
  return r.json();
}

export function useResumeRollups(ownerSlug = '') {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetchResumeRollups(ownerSlug)
      .then((data) => { if (!cancelled) setState({ loading: false, data, error: null }); })
      .catch((e) => { if (!cancelled) setState({ loading: false, data: null, error: e.message || 'Resume rollups could not be loaded' }); });
    return () => { cancelled = true; };
  }, [ownerSlug, version]);
  useEffect(() => {
    function onRefresh(e) {
      if (e.origin === window.location.origin && e.data?.source === 'sb-output-data-refresh') setVersion((v) => v + 1);
    }
    window.addEventListener('message', onRefresh);
    return () => window.removeEventListener('message', onRefresh);
  }, []);
  return state;
}
