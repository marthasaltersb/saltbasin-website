import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { captureLineage } from '../lib/lineage.js';

const router = Router();

async function requireAdmin(req, res) {
  const user = await getUserFromCookie(req);
  if (!user || user.role !== 'admin') { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId(prefix = 'item') {
  return `${prefix}.${crypto.randomUUID().split('-')[0]}`;
}

// ── Series ────────────────────────────────────────────────────────────────────

router.get('/series', async (req, res) => {
  try {
    const series = await db.prepare(`SELECT * FROM herq_series_versions ORDER BY created_at ASC`).all();
    res.json({ series });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load series' });
  }
});

router.put('/series/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { series_title, definition, default_color_token, status, target_audience_refs } = req.body;
    await db.prepare(`
      UPDATE herq_series_versions SET series_title=$1, definition=$2, default_color_token=$3, status=$4, target_audience_refs=$5, updated_at=$6
      WHERE id=$7
    `).run(series_title, definition || null, default_color_token || null, status || 'active', target_audience_refs || null, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update series' });
  }
});

// ── Posts ─────────────────────────────────────────────────────────────────────

router.get('/posts', async (req, res) => {
  try {
    const { status, series } = req.query;
    let q = `SELECT * FROM unified_content_items WHERE app_id = 'app.herq' AND type = 'post'`;
    const params = [];
    if (status) { params.push(status); q += ` AND export_status = $${params.length}`; }
    if (series) { params.push(series); q += ` AND series_ref = $${params.length}`; }
    q += ` ORDER BY created_at DESC LIMIT 500`;
    const posts = await db.prepare(q).all(...params);
    res.json({ posts });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

router.post('/posts', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, topic, summary, body, series_ref, domain_refs, capability_refs, audience_refs, export_status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const id = newId('post');
    const now = Date.now();
    await db.prepare(`
      INSERT INTO unified_content_items
        (id, app_id, type, title, topic, summary, body, series_ref, domain_refs, capability_refs, audience_refs, export_status, created_by, updated_by, created_at, updated_at, metadata)
      VALUES ($1,'app.herq','post',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$12,'{}')
    `).run(id, title, topic || null, summary || null, body ? JSON.stringify(body) : null, series_ref || null, domain_refs || null, capability_refs || null, audience_refs || null, export_status || 'draft', user.id, now);

    res.json({ ok: true, id });
  } catch (e) {
    console.error('[herq] create post error:', e.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await db.prepare(`SELECT * FROM unified_content_items WHERE id = $1 AND app_id = 'app.herq'`).get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json({ post });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load post' });
  }
});

router.put('/posts/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, topic, summary, body, series_ref, domain_refs, capability_refs, audience_refs, export_status } = req.body;
    const now = Date.now();
    await db.prepare(`
      UPDATE unified_content_items SET title=$1, topic=$2, summary=$3, body=$4, series_ref=$5, domain_refs=$6, capability_refs=$7, audience_refs=$8, export_status=$9, updated_by=$10, updated_at=$11
      WHERE id=$12 AND app_id='app.herq'
    `).run(title, topic || null, summary || null, body ? JSON.stringify(body) : null, series_ref || null, domain_refs || null, capability_refs || null, audience_refs || null, export_status || 'draft', user.id, now, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    await db.prepare(`DELETE FROM unified_content_items WHERE id = $1 AND app_id = 'app.herq'`).run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ── Research inputs ───────────────────────────────────────────────────────────

router.get('/research', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`SELECT * FROM herq_research_inputs ORDER BY created_at DESC LIMIT 500`).all();
    res.json({ research: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load research' });
  }
});

router.post('/research', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, source_name, source_type, url, stat, why_it_matters, verification_status, linked_post_refs } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = newId('research');
    await db.prepare(`
      INSERT INTO herq_research_inputs (id, title, source_name, source_type, url, stat, why_it_matters, verification_status, linked_post_refs, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `).run(id, title, source_name || null, source_type || null, url || null, stat || null, why_it_matters || null, verification_status || 'needsVerification', linked_post_refs || null, user.id, Date.now());
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create research input' });
  }
});

// ── Comment Insights ──────────────────────────────────────────────────────────

router.get('/insights', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const rows = await db.prepare(`SELECT * FROM herq_comment_insights ORDER BY created_at DESC LIMIT 500`).all();
    res.json({ insights: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

router.post('/insights', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { body, source_type, author_or_source, sentiment, actionability, linked_post_refs, linked_series_refs, follow_up_needed, notes } = req.body;
    if (!body) return res.status(400).json({ error: 'Body required' });
    const id = newId('insight');
    await db.prepare(`
      INSERT INTO herq_comment_insights (id, body, source_type, author_or_source, sentiment, actionability, linked_post_refs, linked_series_refs, follow_up_needed, notes, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `).run(id, body, source_type || 'user note', author_or_source || null, sentiment || 'neutral', actionability || 'medium', linked_post_refs || null, linked_series_refs || null, follow_up_needed ?? false, notes || null, user.id, Date.now());
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create insight' });
  }
});

// ── Outputs ───────────────────────────────────────────────────────────────────

router.get('/outputs', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const outputs = await db.prepare(`SELECT * FROM unified_outputs WHERE app_id = 'app.herq' ORDER BY updated_at DESC LIMIT 200`).all();
    res.json({ outputs });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load outputs' });
  }
});

router.post('/outputs', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, purpose, template_ref, source_item_ids, config } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = newId('output');
    await db.prepare(`
      INSERT INTO unified_outputs (id, app_id, title, purpose, template_ref, source_item_ids, config, export_status, created_by, updated_at)
      VALUES ($1,'app.herq',$2,$3,$4,$5,$6,'draft',$7,$8)
    `).run(id, title, purpose || null, template_ref || null, source_item_ids || null, JSON.stringify(config || {}), user.id, Date.now());
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create output' });
  }
});

router.put('/outputs/:id', async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  try {
    const { title, purpose, template_ref, source_item_ids, config, export_status, output_type, template_config } = req.body;
    const now = Date.now();
    const current = await db.prepare(`SELECT version_history, config, template_config FROM unified_outputs WHERE id=$1`).get(req.params.id);
    if (!current) return res.status(404).json({ error: 'Not found' });

    // Version history on block template changes
    let history = [];
    try { history = JSON.parse(current.version_history || '[]'); } catch {}
    if (template_config && current.template_config) {
      history.unshift({ saved_at: now, template_config: current.template_config });
    } else if (config) {
      history.unshift({ saved_at: now, config: JSON.parse(current.config || '{}') });
    }
    if (history.length > 20) history = history.slice(0, 20);

    const published_at = export_status === 'published' ? now : null;

    // Fetch full previous row before overwriting (for lineage diff)
    const prevFull = await db.prepare(`SELECT * FROM unified_outputs WHERE id=$1`).get(req.params.id);

    await db.prepare(`
      UPDATE unified_outputs
         SET title=$1, purpose=$2, template_ref=$3, source_item_ids=$4, config=$5,
             export_status=$6, published_at=$7, version_history=$8, updated_at=$9,
             output_type=COALESCE($10, output_type),
             template_config=COALESCE($11, template_config)
       WHERE id=$12 AND app_id='app.herq'
    `).run(
      title ?? current.title ?? null,
      purpose || null,
      template_ref || null,
      source_item_ids || null,
      JSON.stringify(config || {}),
      export_status || current.export_status || 'draft',
      published_at,
      JSON.stringify(history),
      now,
      output_type || null,
      template_config || null,
      req.params.id
    );

    const nextFull = { ...prevFull, title, purpose, config: config || {}, export_status, template_config };
    captureLineage({
      entityType: 'herq_output', entityId: req.params.id,
      prevData: prevFull, nextData: nextFull,
      sourceType: export_status === 'published' ? 'publish' : 'manual',
      authorId: user.id, authorEmail: user.email,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (e) {
    console.error('[herq] update output error:', e.message);
    res.status(500).json({ error: 'Failed to update output' });
  }
});

export default router;
