// Beta product feedback loop.
//
//   POST   /api/feedback                       (member) submit feedback
//   GET    /api/feedback/mine                   (member) own feedback history
//   POST   /api/feedback/:id/upvote             (member) upvote someone else's feedback
//
//   GET    /api/feedback                        (admin)  full queue, sorted by score desc
//   PATCH  /api/feedback/:id                    (admin)  status/score override
//   POST   /api/feedback/:id/route              (admin)  create + link a backlog_items row
//
//   GET    /api/feedback/category-weights       (admin or active advisor)
//   PATCH  /api/feedback/category-weights/:category  (admin or active advisor)
//
//   GET    /api/feedback/advisors                (admin)  list advisors
//   POST   /api/feedback/advisors                (admin)  add/reactivate an advisor
//   DELETE /api/feedback/advisors/:userId         (admin)  deactivate an advisor
//
// Scoring: server/lib/feedbackScoring.js. Auto-routes to backlog_items once
// score clears ROUTE_THRESHOLD and the item is still 'new'.

import { Router } from 'express';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';
import { audit } from '../lib/audit.js';
import { categoryWeight, computeScore, ROUTE_THRESHOLD } from '../lib/feedbackScoring.js';

const router = Router();
const CATEGORIES = ['bug', 'friction', 'idea', 'praise'];

async function isActiveAdvisor(userId) {
  const row = await db.prepare(`SELECT is_active FROM feedback_advisors WHERE user_id = $1`).get(userId);
  return !!row?.is_active;
}

async function requireAdminOrAdvisor(req, res, next) {
  const user = req.user;
  if (user.role === 'admin' || (await isActiveAdvisor(user.id))) return next();
  return res.status(403).json({ error: 'admin or active feedback advisor only' });
}

// Returns the updated product_feedback row (not just the backlog item id) —
// callers must use this returned row in their response, since the row they
// already hold in memory is stale the instant this function runs.
async function routeToBacklog(feedback) {
  const kind = feedback.category === 'bug' ? 'defect' : 'feature';
  const title = feedback.message.length > 80 ? `${feedback.message.slice(0, 77)}...` : feedback.message;
  const result = await db.prepare(`
    INSERT INTO backlog_items (kind, title, summary, status, external_ref)
    VALUES ($1, $2, $3, 'pending', $4) RETURNING id
  `).run(kind, title, feedback.message, `product_feedback:${feedback.id}`);
  const backlogItemId = Number(result.lastInsertRowid);
  const row = await db.prepare(`
    UPDATE product_feedback SET status = 'routed', routed_backlog_item_id = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `).get(backlogItemId, Date.now(), feedback.id);
  return { backlogItemId, row };
}

// ── Member: submit feedback ──────────────────────────────────────────────
router.post('/', requireUser, async (req, res) => {
  const { productId, category, message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });
  const cat = CATEGORIES.includes(category) ? category : 'idea';
  try {
    const now = Date.now();
    const score = computeScore(await categoryWeight(cat), 0);
    let row = await db.prepare(`
      INSERT INTO product_feedback (user_id, product_id, category, message, score, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *
    `).get(req.user.id, productId || null, cat, message.trim(), score, now);

    if (score >= ROUTE_THRESHOLD) ({ row } = await routeToBacklog(row));

    await audit({ req, actor: req.user, action: 'feedback.submitted', entityType: 'product_feedback', entityId: row.id,
      summary: `Submitted ${cat} feedback${productId ? ` for ${productId}` : ''}` });

    res.json({ ok: true, feedback: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mine', requireUser, async (req, res) => {
  try {
    const rows = await db.prepare(`SELECT * FROM product_feedback WHERE user_id = $1 ORDER BY created_at DESC`).all(req.user.id);
    res.json({ feedback: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/upvote', requireUser, async (req, res) => {
  try {
    const existing = await db.prepare(`SELECT * FROM product_feedback WHERE id = $1`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const upvotes = Number(existing.upvotes) + 1;
    const score = computeScore(await categoryWeight(existing.category), upvotes);
    let row = await db.prepare(`
      UPDATE product_feedback SET upvotes = $1, score = $2, updated_at = $3 WHERE id = $4 RETURNING *
    `).get(upvotes, score, Date.now(), req.params.id);
    if (score >= ROUTE_THRESHOLD && row.status === 'new') ({ row } = await routeToBacklog(row));
    res.json({ ok: true, feedback: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: feedback queue ────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT pf.*, u.email AS user_email, u.display_name AS user_display_name
      FROM product_feedback pf JOIN users u ON u.id = pf.user_id
      ORDER BY pf.score DESC, pf.created_at DESC
    `).all();
    res.json({ feedback: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { status, score } = req.body || {};
  try {
    const existing = await db.prepare(`SELECT * FROM product_feedback WHERE id = $1`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const row = await db.prepare(`
      UPDATE product_feedback
      SET status = COALESCE($1, status), score = COALESCE($2, score), updated_at = $3
      WHERE id = $4 RETURNING *
    `).get(status || null, score == null ? null : Number(score), Date.now(), req.params.id);
    await audit({ req, actor: req.user, action: 'feedback.updated', entityType: 'product_feedback', entityId: row.id,
      summary: `Updated feedback #${row.id}` });
    res.json({ ok: true, feedback: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/route', requireAdmin, async (req, res) => {
  try {
    const existing = await db.prepare(`SELECT * FROM product_feedback WHERE id = $1`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    if (existing.routed_backlog_item_id) return res.status(400).json({ error: 'already routed' });
    const { backlogItemId } = await routeToBacklog(existing);
    await audit({ req, actor: req.user, action: 'feedback.routed', entityType: 'product_feedback', entityId: existing.id,
      summary: `Routed feedback #${existing.id} to backlog item #${backlogItemId}` });
    res.json({ ok: true, backlogItemId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Category weights (admin or active advisor) ──────────────────────────
router.get('/category-weights', requireUser, requireAdminOrAdvisor, async (req, res) => {
  try {
    const rows = await db.prepare(`SELECT * FROM feedback_category_weights ORDER BY category`).all();
    res.json({ weights: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/category-weights/:category', requireUser, requireAdminOrAdvisor, async (req, res) => {
  const { weight } = req.body || {};
  if (typeof weight !== 'number' || !(weight >= 0)) return res.status(400).json({ error: 'weight must be a non-negative number' });
  try {
    const row = await db.prepare(`
      INSERT INTO feedback_category_weights (category, weight, updated_by, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category) DO UPDATE SET weight = $2, updated_by = $3, updated_at = $4
      RETURNING *
    `).get(req.params.category, weight, req.user.id, Date.now());
    await audit({ req, actor: req.user, action: 'feedback.category_weight.updated', entityType: 'feedback_category_weights', entityId: null,
      summary: `Set ${req.params.category} weight to ${weight}` });
    res.json({ ok: true, categoryWeight: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Advisors (admin only) ────────────────────────────────────────────────
router.get('/advisors', requireAdmin, async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT fa.*, u.email, u.display_name
      FROM feedback_advisors fa JOIN users u ON u.id = fa.user_id
      ORDER BY fa.created_at DESC
    `).all();
    res.json({ advisors: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/advisors', requireAdmin, async (req, res) => {
  const { userId, note } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const row = await db.prepare(`
      INSERT INTO feedback_advisors (user_id, note, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET is_active = true, note = COALESCE($2, feedback_advisors.note)
      RETURNING *
    `).get(userId, note || null, Date.now());
    await audit({ req, actor: req.user, action: 'feedback.advisor.added', entityType: 'feedback_advisors', entityId: null,
      summary: `Added advisor user #${userId}` });
    res.json({ ok: true, advisor: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/advisors/:userId', requireAdmin, async (req, res) => {
  try {
    await db.prepare(`UPDATE feedback_advisors SET is_active = false WHERE user_id = $1`).run(req.params.userId);
    await audit({ req, actor: req.user, action: 'feedback.advisor.deactivated', entityType: 'feedback_advisors', entityId: null,
      summary: `Deactivated advisor user #${req.params.userId}` });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
