// Lightweight in-process rate limiter.
//
// Usage:
//   const limiter = makeRateLimiter({ windowMs: 60_000, max: 10 });
//   router.post('/login', limiter, async (req, res) => { ... });
//
// Key is req.ip (Express sets this from X-Forwarded-For when trust proxy is on).
// The store is in-process and resets on restart — acceptable for a single-server
// deployment. Entries prune themselves lazily so memory stays bounded.

export function makeRateLimiter({ windowMs = 60_000, max = 10, message = 'Too many requests — please wait a moment' } = {}) {
  const store = new Map(); // ip → [timestamp, ...]

  function prune(ip) {
    const cutoff = Date.now() - windowMs;
    const hits = (store.get(ip) || []).filter(t => t > cutoff);
    if (hits.length === 0) store.delete(ip);
    else store.set(ip, hits);
    return hits;
  }

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const hits = prune(ip);
    if (hits.length >= max) {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: message, retryAfter });
    }
    hits.push(Date.now());
    store.set(ip, hits);
    next();
  };
}

/**
 * Keyed sliding-window counter for callers that need to count only SOME requests (for example failed
 * authentications) or key by something other than the IP (for example an access token id).
 *   const c = makeHitCounter({ windowMs, max });
 *   c.blocked(key)  -> seconds to wait when the key is at its limit, else 0
 *   c.hit(key)      -> records one hit
 */
export function makeHitCounter({ windowMs = 60_000, max = 10 } = {}) {
  const store = new Map();
  const live = (key) => {
    const cutoff = Date.now() - windowMs;
    const hits = (store.get(key) || []).filter((t) => t > cutoff);
    if (hits.length) store.set(key, hits); else store.delete(key);
    return hits;
  };
  return {
    blocked(key) {
      const hits = live(key);
      return hits.length >= max ? Math.max(1, Math.ceil((hits[0] + windowMs - Date.now()) / 1000)) : 0;
    },
    hit(key) { const hits = live(key); hits.push(Date.now()); store.set(key, hits); },
  };
}
