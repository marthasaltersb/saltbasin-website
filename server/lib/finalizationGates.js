// Finalization gates (2026-10-02) — checks an output must pass before it can
// be approved, published, or approved for QR sharing. Enforced server-side
// (resumeProjection.updateProjectionStatus, applicationPackages.
// approveOutputForSharing) so every path to "final" is covered, whichever
// screen it starts from.
//
// Gate 1 — every technology has a proficiency category. "How it was used"
// (hands-on / integration design / adjacent) lives on the Career Master tool
// record (career_tools.wheel_bucket). A finalized output must never present
// an inferred category as fact, so a missing one blocks finalization and the
// screen prompts for it; saving writes it to Career Master.
import { db } from '../db.js';
import { TOOL_PROFICIENCY_CATEGORIES } from './careerProficiencyEngine.js';

export class FinalizationBlockedError extends Error {
  constructor(message, code, details) {
    super(message);
    this.status = 409;
    this.code = code;
    this.details = details;
  }
}

/** Tools with no recorded proficiency category, for this member. */
export async function toolsMissingCategory(userId) {
  const rows = await db.prepare(`SELECT id, name_used, current_name, wheel_bucket FROM career_tools WHERE user_id=$1 ORDER BY order_index, id`).all(userId);
  return rows
    .filter((r) => !Object.prototype.hasOwnProperty.call(TOOL_PROFICIENCY_CATEGORIES, r.wheel_bucket || ''))
    .map((r) => ({ id: Number(r.id), label: r.current_name || r.name_used }));
}

export async function assertReadyToFinalize(userId) {
  const missing = await toolsMissingCategory(userId);
  if (missing.length) {
    throw new FinalizationBlockedError(
      `${missing.length} technolog${missing.length === 1 ? 'y needs' : 'ies need'} a proficiency category before this output can be finalized.`,
      'tool_category_required',
      { tools: missing, categories: TOOL_PROFICIENCY_CATEGORIES },
    );
  }
}

/** Express helper: send a gate refusal with its details, else a generic 400. */
export function sendFinalizationError(res, e) {
  if (e instanceof FinalizationBlockedError) return res.status(e.status).json({ error: e.message, code: e.code, ...e.details });
  return res.status(400).json({ error: e.message });
}
