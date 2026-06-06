// Member templates — Phase A
//
// Endpoints:
//   GET  /api/member-templates           → list available (any logged-in user)
//   GET  /api/member-templates/:slug     → fetch one with pages_preset
//   POST /api/member-templates/seed      → idempotent: populate templates table from
//                                          server/data/memberTemplates.js
//   POST /api/member-templates/:slug/apply
//                                        → apply this template to the current
//                                          member's site (replaces their draft
//                                          pages with the template's preset)
//
// Phase B (next session) wires up the gallery UI. Phase A keeps this purely
// API for now so the data layer is ready.

import { Router } from 'express';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';
import { memberTemplatesSeed } from '../data/memberTemplates.js';

const router = Router();

function rowToTemplate(r, includePreset = false) {
  if (!r) return null;
  return {
    id: Number(r.id),
    slug: r.slug,
    name: r.name,
    archetype: r.archetype,
    tagline: r.tagline,
    description: r.description,
    previewImageUrl: r.preview_image_url,
    brandKit: r.brand_kit ? safeJSON(r.brand_kit) : null,
    sortOrder: Number(r.sort_order || 0),
    ...(includePreset ? { pagesPreset: r.pages_preset ? safeJSON(r.pages_preset) : null } : {}),
  };
}
function safeJSON(s) { try { return JSON.parse(s); } catch { return null; } }

router.get('/', requireUser, async (req, res) => {
  const rows = await db.prepare(`SELECT * FROM member_templates ORDER BY sort_order, name`).all();
  res.json({ templates: rows.map((r) => rowToTemplate(r, false)) });
});

router.get('/:slug', requireUser, async (req, res) => {
  const row = await db.prepare(`SELECT * FROM member_templates WHERE slug = $1`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ template: rowToTemplate(row, true) });
});

router.post('/seed', requireAdmin, async (req, res) => {
  const seeds = memberTemplatesSeed();
  let inserted = 0, skipped = 0;
  for (const t of seeds) {
    const existing = await db.prepare(`SELECT id FROM member_templates WHERE slug = $1`).get(t.slug);
    if (existing) { skipped += 1; continue; }
    await db
      .prepare(
        `INSERT INTO member_templates
          (slug, name, archetype, tagline, description, preview_image_url, brand_kit, pages_preset, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
      )
      .run(
        t.slug, t.name, t.archetype || null, t.tagline || null, t.description || null,
        t.previewImageUrl || null,
        t.brandKit ? JSON.stringify(t.brandKit) : null,
        JSON.stringify(t.pagesPreset),
        t.sortOrder ?? 0
      );
    inserted += 1;
  }
  res.json({ ok: true, inserted, skipped, total: seeds.length });
});

// Apply a template to the current user's member_sites.draft. This replaces
// the member's pages with the template's preset. Placeholders like {NAME}
// and {SLUG} are interpolated from the member's profile + config.
router.post('/:slug/apply', requireUser, async (req, res) => {
  const row = await db.prepare(`SELECT * FROM member_templates WHERE slug = $1`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'template not found' });
  const preset = safeJSON(row.pages_preset);
  if (!preset) return res.status(500).json({ error: 'template has no preset' });

  // Resolve placeholders from the member's profile + draft config.
  const profile = await db
    .prepare(`SELECT slug FROM member_profiles WHERE user_id = $1`)
    .get(req.user.id);
  const cfgRow = await db
    .prepare(`SELECT data FROM member_configs WHERE user_id = $1 AND kind = 'draft'`)
    .get(req.user.id);
  const cfg = cfgRow ? safeJSON(cfgRow.data) : null;
  const ctx = {
    NAME: cfg?.site?.ownerName || (req.user.email || '').split('@')[0],
    SLUG: profile?.slug || 'me',
    AUDIENCE: '<your audience>',
    OUTCOME: '<the outcome you create>',
    PROBLEM: '<the problem you solve>',
    DOMAIN: '<your domain>',
    PRACTICE_NAME: '<Your practice name>',
    INDUSTRY: '<your industry>',
    STATUS: 'between chapters',
    N: '15+',
    YEARS: 'the last decade',
  };
  const interpolated = interpolateTokens(preset, ctx);

  // Write to the member's draft.
  await db
    .prepare(
      `INSERT INTO member_sites (user_id, kind, data, updated_at)
       VALUES ($1, 'draft', $2, $3)
       ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(req.user.id, JSON.stringify(interpolated), Date.now());

  // Also fold the template's brand kit into the member's config draft.
  if (row.brand_kit) {
    const bk = safeJSON(row.brand_kit);
    const mergedCfg = { ...(cfg || {}), brand: { ...(cfg?.brand || {}), ...bk } };
    await db
      .prepare(
        `INSERT INTO member_configs (user_id, kind, data, updated_at)
         VALUES ($1, 'draft', $2, $3)
         ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
      .run(req.user.id, JSON.stringify(mergedCfg), Date.now());
  }

  res.json({ ok: true, appliedSlug: row.slug });
});

function interpolateTokens(obj, ctx) {
  if (typeof obj === 'string') {
    return obj.replace(/\{([A-Z_]+)\}/g, (_, key) => (ctx[key] !== undefined ? String(ctx[key]) : `{${key}}`));
  }
  if (Array.isArray(obj)) return obj.map((x) => interpolateTokens(x, ctx));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = interpolateTokens(obj[k], ctx);
    return out;
  }
  return obj;
}

export default router;
