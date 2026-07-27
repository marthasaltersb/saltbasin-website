// Agent context cache (master prompt §35). Agents "should not reconstruct
// baseline context from zero for every interaction" — before this module,
// every BestyStaff request re-ran its lead lookup and rebuilt its data
// context from scratch (see bestyStaff.js), which is exactly that anti-
// pattern. This is an in-process TTL cache carrying the full §35 metadata
// shape, not just a bare value — so freshness, source attribution, and
// security scope travel with the cached context instead of being implicit.
//
// Not permanent unrestricted memory (§35): every entry has a
// freshnessThreshold and is recomputed via `loader` once stale. Process-
// local (not cross-instance) — acceptable for the single-process dev/small-
// scale deployment this app runs today; a multi-instance deployment would
// need a shared store (e.g. Postgres or Redis) behind the same shape.

const store = new Map();

function hashSourceState(sourceValues) {
  // Cheap content fingerprint, not a security hash — only used to detect
  // "did the underlying source rows change since last refresh".
  return JSON.stringify(sourceValues ?? null);
}

// entry key: `${agentId}:${contextDomain}:${cacheId}`
function key(agentId, contextDomain, cacheId) {
  return `${agentId}::${contextDomain}::${cacheId}`;
}

/**
 * Returns a cached context record if fresh, otherwise calls `loader` to
 * rebuild it. `loader` must return `{ value, sourceIds, securitySlice,
 * currentChannelCoordinate?, likelyQuestionSet?, contextCompleteness?,
 * contextConfidence? }`.
 */
export async function getOrRefresh({
  cacheId,
  agentId,
  contextDomain,
  freshnessThresholdMs,
  invalidationRules = [],
  loader,
}) {
  if (!Number.isFinite(freshnessThresholdMs) || freshnessThresholdMs <= 0) {
    throw new Error('A configured positive freshnessThresholdMs is required');
  }
  const k = key(agentId, contextDomain, cacheId);
  const now = Date.now();
  const existing = store.get(k);

  if (existing && existing.nextRefreshAt > now) {
    return { ...existing, cacheHit: true };
  }

  const loaded = await loader();
  const sourceStateHash = hashSourceState(loaded.value);

  // If the source content hasn't actually changed, keep the old record's
  // refreshedAt lineage but extend the refresh window — avoids treating an
  // unchanged source as "newly refreshed" for freshness-sensitive callers.
  if (existing && existing.sourceStateHash === sourceStateHash) {
    const extended = { ...existing, nextRefreshAt: now + freshnessThresholdMs };
    store.set(k, extended);
    return { ...extended, cacheHit: false, unchanged: true };
  }

  const record = {
    cacheId,
    agentId,
    contextDomain,
    sourceIds: loaded.sourceIds || [],
    refreshedAt: now,
    freshnessThreshold: freshnessThresholdMs,
    nextRefreshAt: now + freshnessThresholdMs,
    sourceStateHash,
    securitySlice: loaded.securitySlice ?? null,
    invalidationRules,
    currentChannelCoordinate: loaded.currentChannelCoordinate ?? null,
    likelyQuestionSet: loaded.likelyQuestionSet ?? [],
    contextCompleteness: loaded.contextCompleteness ?? null,
    contextConfidence: loaded.contextConfidence ?? null,
    value: loaded.value,
  };
  store.set(k, record);
  return { ...record, cacheHit: false, unchanged: false };
}

// Explicit invalidation — e.g. call after a write that changes the
// underlying source rows a cached context was built from, per an
// invalidationRules entry, rather than waiting out the freshnessThreshold.
export function invalidate(agentId, contextDomain, cacheId) {
  store.delete(key(agentId, contextDomain, cacheId));
}

export function invalidateDomain(agentId, contextDomain) {
  const prefix = `${agentId}::${contextDomain}::`;
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
