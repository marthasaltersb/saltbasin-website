// Member-scoped CMS routes.
//
// Mirrors the admin /api/site/* routes but is auth-scoped to req.user.id, so
// each member only ever sees and edits their own site. Storage lives in the
// `member_sites` table (user_id, kind ['draft'|'published'], data JSON).
//
// Routes:
//   GET    /api/member-site/draft        (auth: any logged-in user)
//   PUT    /api/member-site/draft        (auth: any logged-in user)
//   POST   /api/member-site/publish      (auth: any logged-in user)
//   GET    /api/member-site/featured     (public — for the Net Works banner)
//   GET    /api/member-site/by-slug/:slug (public — what /u/:slug renders)
//
// The draft is auto-seeded with defaultMemberSite() if the member has no row
// yet. This keeps the signup flow simple — they can sign in and immediately
// have something to edit.

import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberSite } from '../data/defaultMemberSite.js';

const router = Router();

async function readState(userId, kind) {
  const row = await db
    .prepare('SELECT data FROM member_sites WHERE user_id = $1 AND kind = $2')
    .get(userId, kind);
  return row ? JSON.parse(row.data) : null;
}

async function writeState(userId, kind, data) {
  const json = JSON.stringify(data);
  await db
    .prepare(
      `INSERT INTO member_sites (user_id, kind, data, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(userId, kind, json, Date.now());
}

async function ensureDraft(user) {
  const existing = await readState(user.id, 'draft');
  if (existing) return existing;
  const profile = await db
    .prepare('SELECT slug FROM member_profiles WHERE user_id = $1')
    .get(user.id);
  const slug = profile?.slug || '';
  const seeded = defaultMemberSite({ displayName: user.displayName, email: user.email, slug });
  await writeState(user.id, 'draft', seeded);
  return seeded;
}

router.get('/draft', requireUser, async (req, res) => {
  const site = await ensureDraft(req.user);
  res.json(site);
});

router.put('/draft', requireUser, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !incoming.pages) {
    return res.status(400).json({ error: 'expected { pages, ... }' });
  }
  await writeState(req.user.id, 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireUser, async (req, res) => {
  const draft = await readState(req.user.id, 'draft');
  if (!draft) return res.status(404).json({ error: 'no draft to publish' });
  await writeState(req.user.id, 'published', draft);
  res.json({ ok: true });
});

// Public — every opted-in member's profile card for the Salt Basin home banner.
// We join published configs (for featured.displayOnHome) with member_profiles
// (for the slug + display name).
router.get('/featured', async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, mp.slug, mc.data AS config_json
         FROM member_configs mc
         JOIN users u ON u.id = mc.user_id
         LEFT JOIN member_profiles mp ON mp.user_id = u.id
         WHERE mc.kind = 'published'`
    )
    .all();
  const featured = [];
  for (const r of rows) {
    let cfg;
    try { cfg = JSON.parse(r.config_json); } catch { continue; }
    if (!cfg?.featured?.displayOnHome) continue;
    if (!r.slug) continue;
    featured.push({
      slug: r.slug,
      displayName: cfg?.site?.ownerName || r.email,
      companyName: cfg?.featured?.homeCompanyName || '',
      logoUrl: cfg?.featured?.homeLogoUrl || '',
      blurb: cfg?.featured?.homeBlurb || '',
    });
  }
  res.json({ members: featured });
});

// Public — render-ready published site for /u/:slug.
router.get('/by-slug/:slug', async (req, res) => {
  const row = await db
    .prepare(
      `SELECT ms.data AS site_json, mc.data AS config_json
         FROM member_profiles mp
         JOIN member_sites ms ON ms.user_id = mp.user_id AND ms.kind = 'published'
         LEFT JOIN member_configs mc ON mc.user_id = mp.user_id AND mc.kind = 'published'
         WHERE mp.slug = $1`
    )
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'profile not published yet' });
  res.json({
    site: JSON.parse(row.site_json),
    config: row.config_json ? sanitizeMemberConfig(JSON.parse(row.config_json)) : null,
  });
});

// Strip secrets (Anthropic key etc.) before sending public config to clients.
function sanitizeMemberConfig(cfg) {
  if (!cfg) return null;
  const { integrations, ...safe } = cfg;
  return safe;
}

export default router;
