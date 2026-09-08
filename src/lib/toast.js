// Minimal toast utility — no provider, just a singleton element.
let host;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

export function toast(message, ms = 2400) {
  const el = document.createElement('div');
  el.className = 'sb-toast';
  el.textContent = message;
  ensureHost().appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.18s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, ms);
}

// `toast.success(msg)` / `toast.error(msg)` — the documented convention
// (CLAUDE.md) that most callers across the app already use. Both just show
// the same toast today (no distinct success/error styling yet); defined as
// methods on `toast` itself so `import { toast }` keeps working everywhere.
toast.success = (message, ms) => toast(message, ms);
toast.error = (message, ms) => toast(message, ms);
