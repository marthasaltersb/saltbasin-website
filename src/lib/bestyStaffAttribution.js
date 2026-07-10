const KEY = 'sb_besty_attribution_v1';

export function recordBestyTouch(source, details = {}) {
  if (typeof window === 'undefined') return null;
  const now = new Date().toISOString();
  let current = null;
  try { current = JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch { current = null; }
  const touch = { source, path: window.location.pathname + window.location.search + window.location.hash, at: now, ...details };
  const next = {
    firstTouch: current?.firstTouch || touch,
    latestTouch: touch,
    touches: [...(current?.touches || []), touch].slice(-20),
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function readBestyAttribution() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
