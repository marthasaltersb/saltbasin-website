// Config Envelope — a reusable, repeatable engine for making a static config
// registry admin-editable at runtime, without an engineer or a deploy, while
// never breaking if no override has ever been saved. Built 2026-07-12 per
// Betsy's direction ("everything needs to be editable without an engineer in
// this product") — see docs/salt-basin-runtime-config-audit-2026-07-12.md for
// the full inventory this is the pilot implementation for.
//
// Modeled on the shape server/lib/provisioningPolicyRegistry.js already
// documents and uses: "global by default, scoped by override... kept as a
// function (not a bare export) so callers already have the override seam
// when that day comes." This module is the generalized, reusable version of
// that one-off pattern — extend it to new registries by calling
// defineConfigEnvelope(), don't build a second bespoke mechanism.
//
// Storage: the existing config_state table (id TEXT PRIMARY KEY, data TEXT,
// updated_at BIGINT) — same row shape already used for admin_nav and
// page_type_definitions. config_state.data is plain TEXT, not JSONB (see
// CLAUDE.md's jsonb param convention note), so every read/write here
// JSON.stringify/parses by hand. Envelope rows are namespaced `envelope:<id>`
// so they're trivially distinguishable from the platform's other config_state
// rows without colliding with them.
//
// Org-level overrides are an explicit non-goal of this pass — no org has
// asked to diverge from a platform default yet, matching
// provisioningPolicyRegistry.js's own stated restraint against speculative
// scope-table building. Add org scoping here (a second lookup keyed by
// org_id before falling back to the platform row) only when a real org needs
// it, not ahead of time.

import { db } from '../db.js';

const REGISTRY = new Map();

function rowId(envelopeId) {
  return `envelope:${envelopeId}`;
}

// { id, label, description, defaultValue, validate(value) => string[], publicRead? }
// defaultValue is the JS-coded fallback — used until a row exists, or if a
// stored row fails validation, so a corrupted or mid-edit config_state row
// can never break the reading application. validate must be pure and return
// an array of human-readable error strings (empty = valid).
//
// publicRead (default false) opts a single envelope into unauthenticated GET.
// Set it only for presentation/methodology config that a public, logged-out
// surface has to render correctly — the `/output/*` routes are unauthenticated,
// so without this their envelope fetch 401s and they silently fall back to the
// shipped default, which makes an admin's saved override look like it did
// nothing. Writes are always admin-only regardless of this flag, so never set
// it on anything carrying credentials, pricing a customer shouldn't see, or
// per-member data.
export function defineConfigEnvelope({ id, label, description, defaultValue, validate, publicRead = false }) {
  if (!id) throw new Error('Config envelope needs an id');
  if (REGISTRY.has(id)) throw new Error(`Config envelope "${id}" already defined`);
  if (typeof validate !== 'function') throw new Error(`Config envelope "${id}" needs a validate(value) function`);
  const envelope = Object.freeze({ id, label: label || id, description: description || '', defaultValue, validate, publicRead: !!publicRead });
  REGISTRY.set(id, envelope);
  return envelope;
}

export function getConfigEnvelope(id) {
  return REGISTRY.get(id) || null;
}

export function listConfigEnvelopes() {
  return [...REGISTRY.values()];
}

// { value, source: 'default' | 'stored', updatedAt, invalidStoredValueErrors? }
export async function resolveConfigEnvelope(id) {
  const envelope = REGISTRY.get(id);
  if (!envelope) throw new Error(`Unknown config envelope "${id}"`);
  const row = await db.prepare('SELECT data, updated_at FROM config_state WHERE id = $1').get(rowId(id));
  if (!row) return { value: envelope.defaultValue, source: 'default', updatedAt: null };
  let parsed;
  try {
    parsed = JSON.parse(row.data);
  } catch {
    return { value: envelope.defaultValue, source: 'default', updatedAt: null, invalidStoredValueErrors: ['stored value is not valid JSON'] };
  }
  const errors = envelope.validate(parsed);
  if (errors.length) return { value: envelope.defaultValue, source: 'default', updatedAt: null, invalidStoredValueErrors: errors };
  return { value: parsed, source: 'stored', updatedAt: Number(row.updated_at) };
}

// { ok: true, updatedAt } | { ok: false, errors }
export async function writeConfigEnvelope(id, value) {
  const envelope = REGISTRY.get(id);
  if (!envelope) throw new Error(`Unknown config envelope "${id}"`);
  const errors = envelope.validate(value);
  if (errors.length) return { ok: false, errors };
  const now = Date.now();
  await db.prepare(`
    INSERT INTO config_state (id, data, updated_at) VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $3
  `).run(rowId(id), JSON.stringify(value), now);
  return { ok: true, updatedAt: now };
}

export async function resetConfigEnvelope(id) {
  const envelope = REGISTRY.get(id);
  if (!envelope) throw new Error(`Unknown config envelope "${id}"`);
  await db.prepare('DELETE FROM config_state WHERE id = $1').run(rowId(id));
  return { ok: true };
}
