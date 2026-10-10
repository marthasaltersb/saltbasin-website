// The World Shell breadcrumb trail (2026-10-09): Sun > island > item > sub-object.
// It is the path the user actually took, summary pages included - every crumb
// before the current one is a button that pops the stack back to that layer.
// At phone width a trail deeper than one layer collapses to "... > current";
// the "..." button opens the full trail as a list.
import { useEffect, useRef, useState } from 'react';

const C = { gold: '#c4843a', text: '#f5f0e8', muted: '#8b877c', teal: '#8fadb6' };
const bar = {
  display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', padding: '0.4rem 1.5rem',
  background: 'rgba(8,13,15,0.92)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', fontSize: '0.74rem',
  color: C.text, fontFamily: 'DM Sans, sans-serif', minHeight: 34, boxSizing: 'border-box', flexShrink: 0, position: 'relative', zIndex: 30,
};
const crumbBtn = { background: 'transparent', border: 'none', color: C.teal, cursor: 'pointer', padding: '0.15rem 0.1rem', fontSize: '0.74rem', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit' };
const current = { color: C.gold, fontWeight: 600, padding: '0.15rem 0.1rem', overflowWrap: 'anywhere' };
const sep = { color: C.muted };
// Phone width: every crumb is a 44px tap target.
const CRUMB_CSS = `@media (max-width: 700px) {
  .sb-world-crumbs button { min-height: 44px; min-width: 44px; padding: 0.4rem 0.55rem !important; font-size: 0.82rem !important; }
  .sb-world-crumbs { font-size: 0.82rem !important; }
}`;
const note = { position: 'absolute', top: '100%', left: '0.75rem', right: '0.75rem', zIndex: 40, margin: '0.25rem 0 0', boxShadow: '0 6px 18px rgba(0,0,0,0.5)', padding: '0.35rem 0.5rem', borderRadius: 6, border: '0.5px solid rgba(196,132,58,0.6)', background: '#2a2014', color: '#f0d9b5', fontSize: '0.72rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' };

function useNarrow() {
  const [narrow, setNarrow] = useState(() => {
    try { return window.matchMedia('(max-width: 700px)').matches; } catch { return false; }
  });
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia('(max-width: 700px)'); } catch { return undefined; }
    const on = () => setNarrow(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return narrow;
}

// crumbs: [{ label, index }] with index -1 for the Sun; the last one is current.
export default function WorldBreadcrumbs({ crumbs, onPopTo, notice, onDismissNotice, floating = false, hidden = false }) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  // "Copy link": the shareable URL of exactly this layer (`/world?at=...`).
  async function copyLink() {
    const url = window.location.href;
    // The link is always shown (selectable text) so it can be shared even where the clipboard is blocked.
    try { await navigator.clipboard.writeText(url); } catch { /* shown below instead */ }
    setCopied(`Link to this layer: ${url}`);
    setTimeout(() => setCopied(''), 12000);
  }
  const last = crumbs.length - 1;
  useEffect(() => { setOpen(false); }, [crumbs.length]);
  // The expanded list closes when anything outside the trail is pressed (it overlays the page while open).
  const navRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [open]);

  const style = {
    ...bar,
    ...(floating ? { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200, background: '#080d0f' } : {}),
    ...(hidden ? { visibility: 'hidden' } : {}),
  };
  const collapsed = narrow && crumbs.length > 2;

  // The Sun is always a control: at layer 0 activating it re-opens the root menu (keyboard focus goes to its first entry).
  const renderCrumb = (c, i) => (i === last
    ? (c.index === -1
      ? <button key={`${c.index}`} type="button" style={{ ...crumbBtn, ...current, textDecoration: 'none' }} aria-current="page" data-testid="crumb-current" onClick={() => onPopTo(-1)}>{c.label}</button>
      : <span key={`${c.index}`} style={current} aria-current="page" data-testid="crumb-current">{c.label}</span>)
    : <button key={`${c.index}`} type="button" style={crumbBtn} data-testid="crumb" onClick={() => onPopTo(c.index)}>{c.label}</button>);

  return (
    <nav ref={navRef} aria-label="Breadcrumb" className="sb-world-crumbs" style={style} data-testid={floating ? 'breadcrumbs-floating' : 'breadcrumbs'} aria-hidden={hidden || undefined}>
      <style>{CRUMB_CSS}</style>
      {collapsed ? (
        <>
          <button type="button" style={crumbBtn} aria-expanded={open} aria-label="Show full trail" onClick={() => setOpen((v) => !v)}>…</button>
          <span style={sep} aria-hidden="true">›</span>
          {renderCrumb(crumbs[last], last)}
          {open && (
            <ol aria-label="Full trail" style={{ flexBasis: '100%', margin: '0.2rem 0 0', paddingLeft: '1.1rem', listStyle: 'decimal' }}>
              {crumbs.map((c, i) => (
                <li key={`${c.index}`} style={{ padding: '0.15rem 0' }}>
                  {i === last
                    ? <span style={current} aria-current="page">{c.label}</span>
                    : <button type="button" style={crumbBtn} data-testid="crumb-full" onClick={() => onPopTo(c.index)}>{c.label}</button>}
                </li>
              ))}
            </ol>
          )}
        </>
      ) : crumbs.map((c, i) => (
        <span key={`${c.index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          {i > 0 && <span style={sep} aria-hidden="true">›</span>}
          {renderCrumb(c, i)}
        </span>
      ))}
      {!hidden && (
        <button type="button" style={{ ...crumbBtn, marginLeft: 'auto', color: C.gold }} data-testid="copy-link" onClick={copyLink}>Copy link</button>
      )}
      {copied && !hidden && <div role="status" style={{ ...note, top: '100%' }} data-testid="link-status">{copied}</div>}
      {notice && !hidden && (
        <div role="status" style={note} data-testid="layer-note">
          <span style={{ flex: 1 }}>{notice}</span>
          <button type="button" style={{ ...crumbBtn, color: '#f0d9b5' }} onClick={onDismissNotice}>Dismiss</button>
        </div>
      )}
    </nav>
  );
}
