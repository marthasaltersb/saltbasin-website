// Approval gate — "An entry cannot move into the scheduler until all
// required approvals for that format are complete" (Content Entry Journey
// spec, section 11). Reads the approvals JSONB already on
// unified_content_items (added in the Season/Theme/Topic/Framework
// migration) — no new table. The spec lists 8 possible approval levels
// (framework/research/evidence/copy/visual/channel_adaptation/schedule/
// final_publication); only a subset is universally required across every
// format, so REQUIRED_APPROVAL_LEVELS gates on the four that apply
// regardless of format. The other four remain optional/format-specific and
// are tracked but not gated.
import { db } from '../db.js';

export const REQUIRED_APPROVAL_LEVELS = ['framework', 'research', 'copy', 'schedule'];
export const ALL_APPROVAL_LEVELS = [
  'framework', 'research', 'evidence', 'copy', 'visual', 'channel_adaptation', 'schedule', 'final_publication',
];
export const APPROVAL_OUTCOMES = ['approved', 'approved_with_edits', 'needs_revision', 'needs_more_research', 'on_hold', 'cancelled'];

function isApproved(outcome) {
  return outcome === 'approved' || outcome === 'approved_with_edits';
}

// Returns { ok: boolean, missing: string[] } — missing is empty when every
// required level is approved (or approved_with_edits).
export async function checkApprovalGate(entryRef) {
  if (!entryRef) return { ok: true, missing: [] };
  const row = await db.prepare(`SELECT approvals FROM unified_content_items WHERE id=$1`).get(entryRef);
  if (!row) return { ok: true, missing: [] }; // entry_ref pointing outside unified_content_items (e.g. app.services) — nothing to gate against
  const approvals = typeof row.approvals === 'string' ? JSON.parse(row.approvals) : (row.approvals || {});
  const missing = REQUIRED_APPROVAL_LEVELS.filter((level) => !isApproved(approvals[level]));
  return { ok: missing.length === 0, missing };
}
