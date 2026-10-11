// Minimal toast utility — no provider, just a singleton element.
let host;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

export function toast(message, ms = 2400, kind = 'success') {
  // A repeated message replaces its earlier toast instead of stacking another alert.
  if (host) {
    for (const old of Array.from(host.children)) {
      if (old.textContent === message && old.getAttribute('role') === (kind === 'error' ? 'alert' : 'status')) old.remove();
    }
  }
  const el = document.createElement('div');
  el.className = kind === 'error' ? 'sb-toast sb-toast-error' : 'sb-toast';
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.textContent = message;
  ensureHost().appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.18s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, ms);
}

// `toast.success(msg)` / `toast.error(msg)` — the documented convention.
// Errors are styled red (role=alert) and stay up longer (6 s) so a failure
// is never mistaken for success or missed.
toast.success = (message, ms) => toast(message, ms, 'success');
toast.error = (message, ms = 6000) => toast(message, ms, 'error');
