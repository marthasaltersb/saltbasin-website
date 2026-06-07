// Audit log helper.
//
// Every mutation on backlog + QA entities (and any future entity we choose to
// track) routes through writeAudit() so we have a complete forensic record of
// who changed what, when, why, and from which interface. The audit_events
// table is defined in db.js bootstrap.
//
// Design principle: auditing is non-optional. Routes call writeAudit() right
// next to the INSERT/UPDATE/DELETE; if it throws, the route should fail too.
// Better a 500 than a silent gap in the history.
//
// Source values:
//   'manual_ui'    — admin clicked a button in QAPanel / BacklogPanel
//   'brain_dump'   — reconciler proposal that the user approved
//   'bulk_script'  — one-off ingestion script (scripts/add-*.mjs etc.)
//   'jira_sync'    — pulled in from JIRA
//   'seed'         — initial seed data loaded into an empty table

import { db } from './db.js';

const VALID_ACTIONS = new Set(['create', 'update', 'delete', 'status_change']);
const VALID_SOURCES = new Set(['manual_ui', 'brain_dump', 'bulk_script', 'jira_sync', 'seed']);
const VALID_ENTITY_TYPES = new Set([
  'backlog_item',
  'capability_group',
  'test_scenario',
  'test_scenario_step',
  'test_run',
  'test_run_step_result',
]);

/**
 * Record a mutation in audit_events.
 *
 * @param {object} evt
 * @param {number|null} [evt.userId]      — logged-in user id, or null for system writes (seed / bulk script with no human actor).
 * @param {string}      evt.entityType    — one of VALID_ENTITY_TYPES.
 * @param {number}      evt.entityId      — the row's primary key.
 * @param {string}      evt.action        — 'create' | 'update' | 'delete' | 'status_change'.
 * @param {object|null} [evt.beforeValue] — row state before the change. Null on create.
 * @param {object|null} [evt.afterValue]  — row state after the change. Null on delete.
 * @param {string}      evt.source        — one of VALID_SOURCES.
 * @param {string|null} [evt.reason]      — free-form context. For brain-dump events, this is the original prompt text.
 */
export async function writeAudit({
  userId = null,
  entityType,
  entityId,
  action,
  beforeValue = null,
  afterValue = null,
  source,
  reason = null,
}) {
  if (!entityType || entityId == null || !action || !source) {
    throw new Error(
      `writeAudit: missing required field — entityType=${entityType}, entityId=${entityId}, action=${action}, source=${source}`
    );
  }
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    throw new Error(`writeAudit: invalid entityType "${entityType}"`);
  }
  if (!VALID_ACTIONS.has(action)) {
    throw new Error(`writeAudit: invalid action "${action}"`);
  }
  if (!VALID_SOURCES.has(source)) {
    throw new Error(`writeAudit: invalid source "${source}"`);
  }

  await db
    .prepare(
      `INSERT INTO audit_events
         (user_id, entity_type, entity_id, action, before_value, after_value, source, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
    )
    .run(
      userId,
      entityType,
      Number(entityId),
      action,
      beforeValue == null ? null : JSON.stringify(beforeValue),
      afterValue == null ? null : JSON.stringify(afterValue),
      source,
      reason
    );
}

/**
 * Fetch a single row by id for use as beforeValue on UPDATE / DELETE.
 * Returns null if the row doesn't exist.
 *
 * @param {string} table — table name (caller-controlled; must be a known table name, never user input)
 * @param {number} id
 */
export async function snapshotRow(table, id) {
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = $1`).get(Number(id));
  return row || null;
}

/**
 * Compute the changed fields between two row snapshots. Used by callers to
 * decide whether an UPDATE is a no-op (no audit row needed) and to give the
 * audit reader a quick "what changed" view at the call site.
 *
 * Returns an object of { field: { before, after } } for fields that differ,
 * or null if the snapshots are identical.
 */
export function diffRows(before, after) {
  if (!before || !after) return null;
  const diff = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const b = before[k];
    const a = after[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diff[k] = { before: b, after: a };
    }
  }
  return Object.keys(diff).length ? diff : null;
}
