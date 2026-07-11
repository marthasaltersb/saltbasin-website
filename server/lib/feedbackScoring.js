// Beta feedback scoring: score = category weight × (1 + log2(1 + upvotes)).
// Category weights are admin/advisor-configurable (feedback_category_weights)
// — this is the "curated individuals advising on real weights" mechanic.
// Feedback auto-routes into backlog_items once its score clears
// ROUTE_THRESHOLD (see server/routes/feedback.js).
import { db } from '../db.js';

export const ROUTE_THRESHOLD = 5;
export const DEFAULT_CATEGORY_WEIGHT = 1;

export async function categoryWeight(category) {
  const row = await db.prepare(`SELECT weight FROM feedback_category_weights WHERE category = $1`).get(category);
  return row ? Number(row.weight) : DEFAULT_CATEGORY_WEIGHT;
}

export function computeScore(weight, upvotes) {
  return Math.round(weight * (1 + Math.log2(1 + Math.max(0, Number(upvotes) || 0))) * 100) / 100;
}

export async function scoreFeedback(category, upvotes) {
  return computeScore(await categoryWeight(category), upvotes);
}
