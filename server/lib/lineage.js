import crypto from 'node:crypto';
import { db } from '../db.js';

// ── JSON flattening ───────────────────────────────────────────────────────────
// Converts { a: { b: 1 }, c: [2, 3] }  →  { 'a.b': 1, 'c.0': 2, 'c.1': 3 }
// Skips keys whose values are objects/arrays (only leaf primitives are tracked).
export function flattenJSON(obj, prefix = '', result = {}) {
  if (obj === null || obj === undefined) {
    if (prefix) result[prefix] = obj;
    return result;
  }
  if (typeof obj !== 'object') {
    if (prefix) result[prefix] = obj;
    return result;
  }
  const entries = Array.isArray(obj)
    ? obj.map((v, i) => [String(i), v])
    : Object.entries(obj);
  for (const [k, v] of entries) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      flattenJSON(v, path, result);
    } else {
      result[path] = v;
    }
  }
  return result;
}

// ── Hashing ───────────────────────────────────────────────────────────────────
// Short 16-char hex prefix of SHA-256 — enough bits for collision resistance
// at this scale while staying readable in the UI.

function sha256short(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

export function contextHash(entityType, entityId, fieldPath, value, capturedAt) {
  return sha256short(`${entityType}\x00${entityId}\x00${fieldPath}\x00${JSON.stringify(value)}\x00${capturedAt}`);
}

export function snapshotHash(fieldHashes) {
  // Sort by path so insertion order doesn't affect the hash
  const sorted = Object.entries(fieldHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return sha256short(sorted);
}

// ── Diff two flat objects → list of changed paths ────────────────────────────
export function diffFlat(prev, next) {
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changes = [];
  for (const key of allKeys) {
    const pv = prev[key];
    const nv = next[key];
    if (JSON.stringify(pv) !== JSON.stringify(nv)) {
      changes.push({ fieldPath: key, prevValue: pv, value: nv });
    }
  }
  return changes;
}

// ── Capture lineage for one save event ───────────────────────────────────────
// Call this on every PUT/POST that mutates tracked content.
//
// entityType  — 'site_state' | 'member_site' | 'herq_output' | 'config_state' | etc.
// entityId    — row identifier (e.g. 'draft', 'published', output.id)
// prevData    — the JSON blob BEFORE the write (null/undefined = first write)
// nextData    — the JSON blob AFTER the write
// sourceType  — 'manual' | 'ai' | 'template' | 'publish' | 'import'
// sourceRef   — optional free-form reference (agent run id, script name, etc.)
// authorId    — users.id (number) or null
// authorEmail — email string or null

export async function captureLineage({
  entityType,
  entityId,
  prevData,
  nextData,
  sourceType = 'manual',
  sourceRef = null,
  authorId = null,
  authorEmail = null,
}) {
  const now = Date.now();
  const prev = flattenJSON(prevData || {});
  const next = flattenJSON(nextData || {});
  const changes = diffFlat(prev, next);

  if (changes.length === 0) return { changes: 0, snapshotId: null };

  const fieldHashes = {};

  for (const { fieldPath, prevValue, value } of changes) {
    const hash = contextHash(entityType, entityId, fieldPath, value, now);
    fieldHashes[fieldPath] = hash;
    const id = `lin.${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    await db.prepare(`
      INSERT INTO field_lineage
        (id, entity_type, entity_id, field_path, value, prev_value,
         source_type, source_ref, author_id, author_email, captured_at, context_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `).run(
      id, entityType, entityId, fieldPath,
      JSON.stringify(value ?? null),
      JSON.stringify(prevValue ?? null),
      sourceType, sourceRef || null,
      authorId || null, authorEmail || null,
      now, hash
    );
  }

  const sHash = snapshotHash(fieldHashes);
  const snapId = `snap.${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  await db.prepare(`
    INSERT INTO data_snapshots
      (id, entity_type, entity_id, snapshot_hash, field_count, changed_count,
       triggered_by, author_id, author_email, captured_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `).run(
    snapId, entityType, entityId, sHash,
    Object.keys(fieldHashes).length, changes.length,
    sourceType, authorId || null, authorEmail || null, now
  );

  return { changes: changes.length, snapshotId: snapId, snapshotHash: sHash };
}
