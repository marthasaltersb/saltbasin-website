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
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireUser, getUserFromCookie } from '../auth.js';
import { defaultMemberSite } from '../data/defaultMemberSite.js';
import { audit } from '../lib/audit.js';
import { form, react } from '../lib/molecule.js';
import { resumeUrlFromPreset, pickPrimaryPreset } from '../lib/resumePresets.js';
import { hasCareerPortfolioContent } from '../lib/careerAtomRollups.js';
import { MEMBER_FEATURES, requireMemberFeature } from '../lib/memberAccess.js';
import { VISIBILITY_MODES, siteUnlockCookieName } from '../lib/memberVisibilityRegistry.js';

const router = Router();
const SITE_UNLOCK_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function siteUnlockCookieOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: SITE_UNLOCK_TTL_MS, path: '/' };
}

// Decides whether the requesting visitor (who may be anonymous) may view a
// published member site, per the owner's visibility_mode. The owner can
// always preview their own gated site while logged in.
async function checkSiteAccess(req, profile) {
  const mode = profile.visibility_mode || VISIBILITY_MODES.UNLISTED;
  if (mode === VISIBILITY_MODES.UNLISTED || mode === VISIBILITY_MODES.PUBLIC_SEARCHABLE) {
    return { allowed: true };
  }
  const viewer = await getUserFromCookie(req);
  if (viewer && Number(viewer.id) === Number(profile.user_id)) return { allowed: true };

  if (mode === VISIBILITY_MODES.FRIENDS_ONLY) {
    if (!viewer) return { allowed: false, reason: 'login_required' };
    const conn = await db.prepare(
      `SELECT 1 FROM member_connections
        WHERE status = 'accepted'
          AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))`
    ).get(viewer.id, profile.user_id);
    return conn ? { allowed: true } : { allowed: false, reason: 'friends_only' };
  }

  if (mode === VISIBILITY_MODES.PASSWORD) {
    // No password set yet — fail open rather than lock the member out of
    // their own unfinished setup before they've chosen one.
    if (!profile.site_password_hash) return { allowed: true };
    const token = req.cookies?.[siteUnlockCookieName(profile.user_id)];
    if (!token) return { allowed: false, reason: 'password_required' };
    const row = await db.prepare(
      `SELECT 1 FROM member_site_unlocks WHERE token = $1 AND user_id = $2 AND expires_at > $3`
    ).get(token, profile.user_id, Date.now());
    return row ? { allowed: true } : { allowed: false, reason: 'password_required' };
  }

  return { allowed: true };
}

function primaryResumeUrlFromConfig(config) {
  const presets = Array.isArray(config?.resumePresets) ? config.resumePresets : [];
  const primary = presets.find((p) => p.primaryResume || p.isDefault) || presets[0] || null;
  return resumeUrlFromPreset(primary);
}

async function readState(userId, kind) {
  const row = await db
    .prepare('SELECT data FROM member_sites WHERE user_id = $1 AND kind = $2')
    .get(userId, kind);
  return row ? JSON.parse(row.data) : null;
}

async function writeState(userId, kind, data) {
  // Stamp a schema version if the draft predates the field — never touched
  // again unless a future breaking migration explicitly bumps it.
  if (data && typeof data === 'object' && data.version === undefined) data.version = 1;
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

router.put('/draft', requireUser, requireMemberFeature(MEMBER_FEATURES.MEMBER_SITE), async (req, res) => {
  const incoming = req.body;

  const result = await form({
    security:   async () => {
      if (!req.user?.id) throw new Error('no authenticated user');
    },
    variables:  async () => {
      if (!incoming || typeof incoming !== 'object' || !incoming.pages) {
        throw new Error('expected { pages, ... }');
      }
    },
    compliance: async () => {
      await audit({
        req,
        actor:      req.user,
        action:     'site.draft.save',
        entityType: 'member_site',
        entityId:   req.user.id,
        summary:    'Member site draft saved',
      });
    },
    commit: async () => {
      await writeState(req.user.id, 'draft', incoming);
      return { updatedAt: Date.now() };
    },
  });

  if (!result.ok) {
    const status = result.bonds?.security ? 403 : 400;
    return res.status(status).json({ error: result.bonds });
  }
  res.json({ ok: true, updatedAt: result.result.updatedAt });
});

router.post('/publish', requireUser, requireMemberFeature(MEMBER_FEATURES.MEMBER_SITE), async (req, res) => {
  const draft = await readState(req.user.id, 'draft');

  const result = await react({
    inputs: { draft, actor: req.user },
    conditions: async () => {
      if (!draft) throw new Error('no draft to publish');
      // draft.pages is a keyed object ({ home: {...}, about: {...} }), not an
      // array — see CLAUDE.md's "Section / block system" note. `.length` on
      // that object is always undefined, so this guard rejected every
      // brand-new member's default-seeded site (defaultMemberSite.js has
      // always produced the keyed shape) with "draft has no pages" —
      // confirmed live against a fresh sandbox member account 2026-09-06.
      if (!Object.keys(draft.pages || {}).length) throw new Error('draft has no pages — cannot publish');
      // Rollout gate: a member's public profile can't go live before their
      // Career Master data exists — see hasCareerPortfolioContent's header.
      if (!(await hasCareerPortfolioContent(req.user.id))) {
        throw new Error('career portfolio not yet defined — add at least one Career Master entry before publishing');
      }
    },
    produce: async () => {
      await form({
        security:   async () => {
          if (!req.user?.id) throw new Error('no authenticated user');
        },
        compliance: async () => {
          await audit({
            req,
            actor:      req.user,
            action:     'site.publish',
            entityType: 'member_site',
            entityId:   req.user.id,
            summary:    'Member site published',
          });
        },
        variables:  async () => {},
        commit:     async () => writeState(req.user.id, 'published', draft),
      });
      return { published: true };
    },
  });

  if (!result.ok) {
    const status = result.reason?.includes('no draft') ? 404 : 400;
    return res.status(status).json({ error: result.reason });
  }
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

// Public — render-ready published site for /u/:slug. Gated by the owner's
// visibility_mode (see memberVisibilityRegistry.js) before any content is
// returned, so a friends_only/password-gated member's draft/section content
// never leaks in the 403 response.
router.get('/by-slug/:slug', async (req, res) => {
  const profile = await db
    .prepare(`SELECT user_id, visibility_mode, site_password_hash FROM member_profiles WHERE slug = $1`)
    .get(req.params.slug);
  if (!profile) return res.status(404).json({ error: 'profile not published yet' });

  const gate = await checkSiteAccess(req, profile);
  if (!gate.allowed) {
    return res.status(403).json({ error: gate.reason, visibilityMode: profile.visibility_mode });
  }

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
    visibilityMode: profile.visibility_mode,
  });
});

// Public — verify a password-gated site's visitor password and set a
// per-member unlock cookie (mirrors auth.js's landing-gate pattern, scoped
// to this one member rather than the whole site).
router.post('/by-slug/:slug/unlock', async (req, res) => {
  const profile = await db
    .prepare(`SELECT user_id, visibility_mode, site_password_hash FROM member_profiles WHERE slug = $1`)
    .get(req.params.slug);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  if (profile.visibility_mode !== VISIBILITY_MODES.PASSWORD || !profile.site_password_hash) {
    return res.status(400).json({ error: 'this profile is not password-gated' });
  }
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'password required' });
  const ok = await bcrypt.compare(password, profile.site_password_hash);
  if (!ok) return res.status(401).json({ error: 'incorrect password' });

  const token = crypto.randomBytes(24).toString('hex');
  await db
    .prepare(`INSERT INTO member_site_unlocks (token, user_id, expires_at) VALUES ($1, $2, $3)`)
    .run(token, profile.user_id, Date.now() + SITE_UNLOCK_TTL_MS);
  res.cookie(siteUnlockCookieName(profile.user_id), token, siteUnlockCookieOptions());
  res.json({ ok: true });
});

// Public resolver for profile-facing resume links. Returns only the computed
// primary resume URL, not the full private member config.
router.get('/by-slug/:slug/resume-url', async (req, res) => {
  const row = await db
    .prepare(
      `SELECT mp.user_id, mc.data AS config_json, mjs.data AS preset_json
         FROM member_profiles mp
         LEFT JOIN member_configs mc ON mc.user_id = mp.user_id AND mc.kind = 'published'
         LEFT JOIN member_json_store mjs ON mjs.user_id = mp.user_id AND mjs.key = 'resume_presets'
        WHERE mp.slug = $1`
    )
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'profile not found' });
  if (row.preset_json) {
    const data = JSON.parse(row.preset_json);
    const presets = Array.isArray(data.presets) ? data.presets : [];
    const primary = pickPrimaryPreset(presets);
    return res.json({ url: resumeUrlFromPreset(primary), source: primary ? 'primary_preset' : 'default' });
  }
  const config = row.config_json ? sanitizeMemberConfig(JSON.parse(row.config_json)) : null;
  res.json({ url: primaryResumeUrlFromConfig(config), source: config?.resumePresets?.length ? 'primary_preset' : 'default' });
});

// Strip secrets (Anthropic key etc.) before sending public config to clients.
function sanitizeMemberConfig(cfg) {
  if (!cfg) return null;
  const { integrations, ...safe } = cfg;
  return safe;
}

export default router;
