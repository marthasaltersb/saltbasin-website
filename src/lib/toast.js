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
