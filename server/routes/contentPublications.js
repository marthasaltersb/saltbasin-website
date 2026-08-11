// Content Publications — generic editorial calendar / scheduler + engagement
// capture for ALL marketing content (app.herq posts, app.services ads,
// future apps). Not HERQ-specific: app_id-scoped the same way
// unified_content_items/unified_outputs already are. See db.js for the
// content_publications / content_interactions table shapes.
import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { checkApprovalGate } from '../lib/approvalGate.js';

const router = Router();

// "An entry cannot move into the scheduler until all required approvals for
// that format are complete" — gate these statuses, not earlier drafting
// stages, against the linked entry's approvals.
const GATED_STATUSES = new Set(['scheduled', 'publishing', 'published', 'partially_published']);

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId(prefix = 'pub') {
  return `${prefix}.${crypto.randomUUID().split('-')[0]}`;
}

// ── Publications ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { app_id, status, channel } = req.query;
    let q = `SELECT * FROM content_publications WHERE 1=1`;
    const params = [];
    if (app_id) { params.push(app_id); q += ` AND app_id = $${params.length}`; }
    if (status) { params.push(status); q += ` AND status = $${params.length}`; }
    if (channel) { params.push(channel); q += ` AND channel = $${params.length}`; }
    q += ` ORDER BY COALESCE(scheduled_at, created_at) DESC LIMIT 500`;
    const publications = await db.prepare(q).all(...params);
    res.json({ publications });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load publications' });
  }
});

// ── Performance dashboard ────────────────────────────────────────────────────
// Read-only rollups, computed on demand (no new storage) — same pattern as
// usageTracking.js's getEntitlementUsageSummary. Registered before /:id so
// "dashboard" is never captured as a publication id.
router.get('/dashboard', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { app_id } = req.query;
    const appFilter = app_id ? `AND cp.app_id = $1` : '';
    const params = app_id ? [app_id] : [];

    const byStatus = await db.prepare(`
      SELECT status, COUNT(*)::int AS count FROM content_publications cp WHERE 1=1 ${appFilter} GROUP BY status ORDER BY count DESC
    `).all(...params);

    const byInteractionType = await db.prepare(`
      SELECT ci.interaction_type, COUNT(*)::int AS count
      FROM content_interactions ci JOIN content_publications cp ON cp.id = ci.publication_ref
      WHERE 1=1 ${appFilter} GROUP BY ci.interaction_type ORDER BY count DESC
    `).all(...params);

    const byChannel = await db.prepare(`
      SELECT cp.channel, COUNT(cp.id)::int AS publication_count, COUNT(ci.id)::int AS interaction_count
      FROM content_publications cp LEFT JOIN content_interactions ci ON ci.publication_ref = cp.id
      WHERE 1=1 ${appFilter} GROUP BY cp.channel ORDER BY interaction_count DESC
    `).all(...params);

    const topEntries = await db.prepare(`
      SELECT cp.id, cp.entry_ref, cp.channel, cp.status, COUNT(ci.id)::int AS interaction_count
      FROM content_publications cp LEFT JOIN content_interactions ci ON ci.publication_ref = cp.id
      WHERE cp.entry_ref IS NOT NULL ${appFilter}
      GROUP BY cp.id, cp.entry_ref, cp.channel, cp.status
      ORDER BY interaction_count DESC LIMIT 10
    `).all(...params);

    const byDayOfWeek = await db.prepare(`
      SELECT EXTRACT(DOW FROM to_timestamp(cp.actual_published_at/1000))::int AS day_of_week, COUNT(ci.id)::int AS interaction_count
      FROM content_publications cp LEFT JOIN content_interactions ci ON ci.publication_ref = cp.id
      WHERE cp.actual_published_at IS NOT NULL ${appFilter}
      GROUP BY day_of_week ORDER BY interaction_count DESC
    `).all(...params);

    res.json({
      byStatus, byInteractionType, byChannel, topEntries, byDayOfWeek,
      // Per the spec's attribution-confidence distinction: "five new
      // followers occurred within 24 hours" is supportable, "this post
      // caused five new followers" is not, without platform/UTM attribution
      // this system doesn't have yet. byDayOfWeek is a correlation, not a
      // causal claim.
      attributionConfidence: 'time_window_correlated',
    });
  } catch (e) {
    console.error('[content-publications] dashboard error:', e.message);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.post('/', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const {
      app_id, entry_ref, variant_ref, long_form_ref, channel, channel_account_ref,
      campaign_ref, scheduled_at, timezone, status, destination_url, metadata,
    } = req.body;
    if (!app_id || !channel) return res.status(400).json({ error: 'app_id and channel are required' });
    if (GATED_STATUSES.has(status)) {
      const gate = await checkApprovalGate(entry_ref);
      if (!gate.ok) return res.status(409).json({ error: 'Missing required approvals', missingApprovals: gate.missing });
    }
    const id = newId();
    const now = Date.now();
    await db.prepare(`
      INSERT INTO content_publications
        (id, app_id, entry_ref, variant_ref, long_form_ref, channel, channel_account_ref, campaign_ref, scheduled_at, timezone, status, destination_url, metadata, created_by, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
    `).run(id, app_id, entry_ref || null, variant_ref || null, long_form_ref || null, channel, channel_account_ref || null, campaign_ref || null, scheduled_at || null, timezone || null, status || 'draft', destination_url || null, metadata || {}, user.id, now);
    res.json({ ok: true, id });
  } catch (e) {
    console.error('[content-publications] create error:', e.message);
    res.status(500).json({ error: 'Failed to create publication' });
  }
});

router.get('/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const pub = await db.prepare(`SELECT * FROM content_publications WHERE id=$1`).get(req.params.id);
    if (!pub) return res.status(404).json({ error: 'Not found' });
    res.json({ publication: pub });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load publication' });
  }
});

router.put('/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const {
      entry_ref, variant_ref, long_form_ref, channel, channel_account_ref, campaign_ref,
      scheduled_at, timezone, status, destination_url, external_post_id,
      actual_published_at, failure_reason, retry_count, metadata,
    } = req.body;
    if (GATED_STATUSES.has(status)) {
      const existing = await db.prepare(`SELECT entry_ref FROM content_publications WHERE id=$1`).get(req.params.id);
      const gate = await checkApprovalGate(entry_ref ?? existing?.entry_ref);
      if (!gate.ok) return res.status(409).json({ error: 'Missing required approvals', missingApprovals: gate.missing });
    }
    const now = Date.now();
    await db.prepare(`
      UPDATE content_publications SET
        entry_ref=COALESCE($1,entry_ref), variant_ref=COALESCE($2,variant_ref), long_form_ref=$3,
        channel=COALESCE($4,channel), channel_account_ref=$5, campaign_ref=$6,
        scheduled_at=$7, timezone=$8, status=COALESCE($9,status), destination_url=$10,
        external_post_id=$11, actual_published_at=$12, failure_reason=$13,
        retry_count=COALESCE($14,retry_count), metadata=COALESCE($15,metadata), updated_at=$16
      WHERE id=$17
    `).run(
      entry_ref, variant_ref, long_form_ref || null, channel, channel_account_ref || null, campaign_ref || null,
      scheduled_at || null, timezone || null, status, destination_url || null,
      external_post_id || null, actual_published_at || null, failure_reason || null,
      retry_count, metadata, now, req.params.id,
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[content-publications] update error:', e.message);
    res.status(500).json({ error: 'Failed to update publication' });
  }
});

router.delete('/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    await db.prepare(`DELETE FROM content_publications WHERE id=$1`).run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete publication' });
  }
});

// ── Interactions (manual import for Release 1 — no live platform polling yet) ─

router.get('/:id/interactions', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`SELECT * FROM content_interactions WHERE publication_ref=$1 ORDER BY occurred_at DESC`).all(req.params.id);
    res.json({ interactions: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load interactions' });
  }
});

router.post('/:id/interactions', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const pub = await db.prepare(`SELECT id, channel FROM content_publications WHERE id=$1`).get(req.params.id);
    if (!pub) return res.status(404).json({ error: 'Publication not found' });
    const {
      platform, interaction_type, occurred_at, external_user_ref, public_profile_info,
      comment_content, sentiment, response_status, attribution_confidence, metadata,
    } = req.body;
    if (!interaction_type) return res.status(400).json({ error: 'interaction_type is required' });
    const id = newId('interaction');
    await db.prepare(`
      INSERT INTO content_interactions
        (id, publication_ref, platform, interaction_type, occurred_at, external_user_ref, public_profile_info, comment_content, sentiment, response_status, attribution_confidence, metadata, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    `).run(
      id, req.params.id, platform || pub.channel, interaction_type, occurred_at || Date.now(),
      external_user_ref || null, public_profile_info || {}, comment_content || null, sentiment || null,
      response_status || 'none', attribution_confidence || 'platform_attributed', metadata || {}, user.id, Date.now(),
    );
    res.json({ ok: true, id });
  } catch (e) {
    console.error('[content-publications] create interaction error:', e.message);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

export default router;
