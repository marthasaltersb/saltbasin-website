// Member-scoped output templates (resume, proposal, case-study, one-pager,
// build-summary). Storage was consolidated into unified_outputs (see the
// "Consolidate output_templates into unified_outputs" migration in db.js) —
// this file now reads/writes unified_outputs WHERE app_id='app.career',
// scoped by the additive user_id/output_type/is_primary columns. The API
// surface (endpoints, response shape — `name` not `title`) is unchanged on
// purpose: OutputTemplateConfigurator.jsx and Output.jsx call these same
// routes and needed zero changes.
import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';

const router = express.Router();
const APP_ID = 'app.career';

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function newId() { return `tpl.${crypto.randomUUID().split('-')[0]}`; }

function rowToTemplate(row) {
  if (!row) return null;
  return { ...row, name: row.title };
}

// `config` is opaque JSONB, but when it declares a schemaVersion we validate
// it against known shapes rather than silently persisting an unrecognized
// version — breaking shape changes must be explicit, per CLAUDE.md.
const KNOWN_CONFIG_SCHEMA_VERSIONS = new Set([1, 2]);
function validConfigShape(config) {
  if (config == null || typeof config !== 'object') return true;
  if (config.schemaVersion == null) return true;
  return KNOWN_CONFIG_SCHEMA_VERSIONS.has(Number(config.schemaVersion));
}

// GET /api/output-templates?output_type=resume
// Returns all templates for a given output type for the current user.
router.get('/', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    const { output_type } = req.query;
    let q = `SELECT * FROM unified_outputs WHERE app_id = $1`;
    const params = [APP_ID];
    if (output_type) { params.push(output_type); q += ` AND output_type = $${params.length}`; }
    if (user) { params.push(user.id); q += ` AND (user_id = $${params.length} OR user_id IS NULL)`; }
    else { q += ` AND user_id IS NULL`; }
    q += ` ORDER BY is_primary DESC, updated_at DESC LIMIT 50`;
    const rows = await db.prepare(q).all(...params);
    res.json({ templates: rows.map(rowToTemplate) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

// GET /api/output-templates/primary?output_type=resume
// Returns the primary template for the current user (or global default if not logged in).
router.get('/primary', async (req, res) => {
  try {
    const user = await getUserFromCookie(req);
    const { output_type = 'resume' } = req.query;

    let row = null;
    if (user) {
      row = await db.prepare(`
        SELECT * FROM unified_outputs WHERE app_id = $1 AND user_id = $2 AND output_type = $3 AND is_primary = true LIMIT 1
      `).get(APP_ID, user.id, output_type);
    }
    // Fall back to global primary (user_id IS NULL)
    if (!row) {
      row = await db.prepare(`
        SELECT * FROM unified_outputs WHERE app_id = $1 AND user_id IS NULL AND output_type = $2 AND is_primary = true LIMIT 1
      `).get(APP_ID, output_type);
    }
    res.json({ template: rowToTemplate(row) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/output-templates/portfolio?owner=<slug>&output_type=resume
// Public — lists a member's presets explicitly marked portfolioVisible in
// their layer-config `meta`, for the public Resume Portfolio index
// (Output.jsx's ResumePortfolioOutput). Minimal fields only — never exposes
// unpublished presets even to someone guessing ids.
router.get('/portfolio', async (req, res) => {
  try {
    const { owner, output_type = 'resume' } = req.query;
    if (!owner) return res.json({ templates: [] });
    const profile = await db.prepare(`SELECT user_id FROM member_profiles WHERE slug = $1`).get(owner);
    if (!profile) return res.json({ templates: [] });
    const rows = await db.prepare(`
      SELECT id, title, config FROM unified_outputs
       WHERE app_id = $1 AND user_id = $2 AND output_type = $3
         AND (config->'meta'->>'portfolioVisible')::boolean = true
       ORDER BY updated_at DESC
    `).all(APP_ID, profile.user_id, output_type);
    res.json({
      templates: rows.map((r) => ({
        id: r.id,
        name: r.title,
        meta: (typeof r.config === 'string' ? JSON.parse(r.config) : r.config)?.meta || {},
      })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

// GET /api/output-templates/:id/public
// Public — returns one preset's config only if it's explicitly marked
// portfolioVisible. Additive alongside the owner-authed GET/PUT/DELETE
// below; never exposes a non-published preset even if its id is known.
router.get('/:id/public', async (req, res) => {
  try {
    const row = await db.prepare(`SELECT * FROM unified_outputs WHERE id = $1 AND app_id = $2`).get(req.params.id, APP_ID);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    if (!config?.meta?.portfolioVisible) return res.status(404).json({ error: 'Not found' });
    res.json({ template: { id: row.id, name: row.title, config } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/output-templates
router.post('/', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { output_type, name, config, is_primary } = req.body;
    if (!output_type || !name) return res.status(400).json({ error: 'output_type and name required' });
    if (!validConfigShape(config)) return res.status(400).json({ error: `Unrecognized config.schemaVersion` });
    const id = newId();
    const now = Date.now();
    if (is_primary) {
      await db.prepare(`UPDATE unified_outputs SET is_primary = false WHERE app_id = $1 AND user_id = $2 AND output_type = $3`).run(APP_ID, user.id, output_type);
    }
    await db.prepare(`
      INSERT INTO unified_outputs (id, app_id, user_id, output_type, is_primary, template_ref, title, config, created_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $4, $6, $7, $3, $8)
    `).run(id, APP_ID, user.id, output_type, is_primary ?? false, name, config || {}, now);
    res.json({ ok: true, id });
  } catch (e) {
    console.error('[output-templates] create error:', e.message);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/output-templates/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { name, config, is_primary } = req.body;
    if (!validConfigShape(config)) return res.status(400).json({ error: `Unrecognized config.schemaVersion` });
    const row = await db.prepare(`SELECT * FROM unified_outputs WHERE id = $1 AND app_id = $2 AND user_id = $3`).get(req.params.id, APP_ID, user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (is_primary) {
      await db.prepare(`UPDATE unified_outputs SET is_primary = false WHERE app_id = $1 AND user_id = $2 AND output_type = $3`).run(APP_ID, user.id, row.output_type);
    }
    await db.prepare(`
      UPDATE unified_outputs SET title = COALESCE($1, title), config = COALESCE($2, config), is_primary = $3, updated_at = $4 WHERE id = $5
    `).run(name || null, config || null, is_primary ?? row.is_primary, Date.now(), req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/output-templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    await db.prepare(`DELETE FROM unified_outputs WHERE id = $1 AND app_id = $2 AND user_id = $3`).run(req.params.id, APP_ID, user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
