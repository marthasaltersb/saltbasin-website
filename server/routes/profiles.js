import express from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { audit } from '../lib/audit.js';

const router = express.Router();

async function requireAuth(req, res) {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  return user;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Personal profile ─────────────────────────────────────────────────────────

// GET /api/profiles/me/personal
router.get('/me/personal', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    let profile = await db.prepare(
      `SELECT * FROM personal_profiles WHERE user_id = $1`
    ).get(user.id);
    if (!profile) {
      // Auto-create on first access
      await db.prepare(`
        INSERT INTO personal_profiles (user_id, display_name)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO NOTHING
      `).run(user.id, user.display_name || user.email);
      profile = await db.prepare(`SELECT * FROM personal_profiles WHERE user_id = $1`).get(user.id);
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profiles/me/personal
router.patch('/me/personal', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const b = req.body || {};
    const display_name = b.display_name ?? null;
    const bio          = b.bio ?? null;
    const avatar_url   = b.avatar_url ?? null;
    const location     = b.location ?? null;
    const pronouns     = b.pronouns ?? null;
    const metadataJson = b.metadata !== undefined ? JSON.stringify(b.metadata) : null;
    await db.prepare(`
      INSERT INTO personal_profiles (user_id, display_name, bio, avatar_url, location, pronouns, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, personal_profiles.display_name),
        bio          = COALESCE(EXCLUDED.bio, personal_profiles.bio),
        avatar_url   = COALESCE(EXCLUDED.avatar_url, personal_profiles.avatar_url),
        location     = COALESCE(EXCLUDED.location, personal_profiles.location),
        pronouns     = COALESCE(EXCLUDED.pronouns, personal_profiles.pronouns),
        metadata     = CASE WHEN $8::jsonb IS NOT NULL THEN $8::jsonb ELSE personal_profiles.metadata END,
        updated_at   = EXCLUDED.updated_at
    `).run(user.id, display_name, bio, avatar_url, location, pronouns, Date.now(), metadataJson);
    await audit({ req, actor: user, action: 'profile.personal.update', entityType: 'personal_profile', entityId: user.id, summary: 'Updated personal profile' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Organization profiles ────────────────────────────────────────────────────

// GET /api/profiles/me/orgs — all orgs the user belongs to
router.get('/me/orgs', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const rows = await db.prepare(`
      SELECT op.*, om.role, om.joined_at
      FROM organization_profiles op
      JOIN org_memberships om ON om.org_id = op.id
      WHERE om.user_id = $1
      ORDER BY om.joined_at ASC
    `).all(user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles/me/orgs — create a new org and make user the owner
router.post('/me/orgs', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const { name, org_type = 'llc', description = null, logo_url = null, website = null, industry = null } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    let slug = slugify(name);
    // Ensure slug uniqueness
    const existing = await db.prepare(`SELECT id FROM organization_profiles WHERE slug = $1`).get(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    const [org] = await db.prepare(`
      INSERT INTO organization_profiles (slug, name, org_type, description, logo_url, website, industry)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `).all(slug, name, org_type, description, logo_url, website, industry);

    // Make creator the owner
    await db.prepare(`
      INSERT INTO org_memberships (user_id, org_id, role) VALUES ($1, $2, 'owner')
    `).run(user.id, org.id);

    await audit({ req, actor: user, action: 'org.create', entityType: 'org_profile', entityId: org.id, summary: `Created org: ${name}` });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/orgs/:orgId
router.get('/orgs/:orgId', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const membership = await db.prepare(
      `SELECT role FROM org_memberships WHERE user_id = $1 AND org_id = $2`
    ).get(user.id, req.params.orgId);
    if (!membership) return res.status(403).json({ error: 'Not a member of this org' });

    const org = await db.prepare(`SELECT * FROM organization_profiles WHERE id = $1`).get(req.params.orgId);
    const members = await db.prepare(`
      SELECT u.id, u.email, u.display_name, om.role, om.joined_at
      FROM org_memberships om JOIN users u ON u.id = om.user_id
      WHERE om.org_id = $1 ORDER BY om.joined_at ASC
    `).all(req.params.orgId);

    res.json({ ...org, members, myRole: membership.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profiles/orgs/:orgId
router.patch('/orgs/:orgId', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const mem = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    if (!mem || !['owner', 'admin'].includes(mem.role)) return res.status(403).json({ error: 'Insufficient role' });

    const { name = null, org_type = null, description = null, logo_url = null, website = null, industry = null } = req.body;
    await db.prepare(`
      UPDATE organization_profiles SET
        name = COALESCE($1, name), org_type = COALESCE($2, org_type),
        description = COALESCE($3, description), logo_url = COALESCE($4, logo_url),
        website = COALESCE($5, website), industry = COALESCE($6, industry),
        updated_at = $7
      WHERE id = $8
    `).run(name, org_type, description, logo_url, website, industry, Date.now(), req.params.orgId);

    await audit({ req, actor: user, action: 'org.update', entityType: 'org_profile', entityId: req.params.orgId, summary: 'Updated org profile' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/orgs/:orgId — owner only
router.delete('/orgs/:orgId', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const mem = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    if (!mem || mem.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
    await db.prepare(`DELETE FROM organization_profiles WHERE id = $1`).run(req.params.orgId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Org membership management ────────────────────────────────────────────────

// POST /api/profiles/orgs/:orgId/members — invite user by email
router.post('/orgs/:orgId/members', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const mem = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    if (!mem || !['owner', 'admin'].includes(mem.role)) return res.status(403).json({ error: 'Insufficient role' });

    const { email, role = 'member' } = req.body;
    const invitee = await db.prepare(`SELECT id FROM users WHERE email = $1`).get(email);
    if (!invitee) return res.status(404).json({ error: 'No Salt Basin account found for that email' });

    await db.prepare(`
      INSERT INTO org_memberships (user_id, org_id, role, invited_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role
    `).run(invitee.id, req.params.orgId, role, user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profiles/orgs/:orgId/members/:userId — change role
router.patch('/orgs/:orgId/members/:userId', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const mem = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    if (!mem || !['owner', 'admin'].includes(mem.role)) return res.status(403).json({ error: 'Insufficient role' });
    await db.prepare(`UPDATE org_memberships SET role=$1 WHERE user_id=$2 AND org_id=$3`).run(req.body.role, req.params.userId, req.params.orgId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/orgs/:orgId/members/:userId
router.delete('/orgs/:orgId/members/:userId', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const mem = await db.prepare(`SELECT role FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    // Can remove yourself, or admin/owner can remove others
    const isSelf = String(req.params.userId) === String(user.id);
    if (!isSelf && (!mem || !['owner', 'admin'].includes(mem.role))) return res.status(403).json({ error: 'Insufficient role' });
    await db.prepare(`DELETE FROM org_memberships WHERE user_id=$1 AND org_id=$2`).run(req.params.userId, req.params.orgId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Personal → org links ─────────────────────────────────────────────────────

// POST /api/profiles/me/personal/link-org/:orgId
router.post('/me/personal/link-org/:orgId', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const profile = await db.prepare(`SELECT id FROM personal_profiles WHERE user_id=$1`).get(user.id);
    if (!profile) return res.status(404).json({ error: 'Personal profile not found' });
    const mem = await db.prepare(`SELECT id FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(user.id, req.params.orgId);
    if (!mem) return res.status(403).json({ error: 'Not a member of this org' });
    await db.prepare(`
      INSERT INTO personal_org_links (personal_profile_id, org_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `).run(profile.id, req.params.orgId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/me/personal/link-org/:orgId
router.delete('/me/personal/link-org/:orgId', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const profile = await db.prepare(`SELECT id FROM personal_profiles WHERE user_id=$1`).get(user.id);
    if (!profile) return res.status(404).json({ ok: true });
    await db.prepare(`DELETE FROM personal_org_links WHERE personal_profile_id=$1 AND org_id=$2`).run(profile.id, req.params.orgId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Product licenses ─────────────────────────────────────────────────────────

// GET /api/profiles/me/licenses
router.get('/me/licenses', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const licenses = await db.prepare(`
      SELECT pl.*, op.name as org_name, op.slug as org_slug,
             de.scope as entitlement_scope
      FROM product_licenses pl
      LEFT JOIN organization_profiles op ON op.id = pl.org_id
      LEFT JOIN data_entitlements de ON de.license_id = pl.id
      WHERE pl.user_id = $1 AND pl.is_active = TRUE
        AND (pl.expires_at IS NULL OR pl.expires_at > $2)
      ORDER BY pl.granted_at DESC
    `).all(user.id, Date.now());
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: platform-wide views (Betsy only) ──────────────────────────────────

// GET /api/profiles/admin/orgs — all org profiles
router.get('/admin/orgs', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const orgs = await db.prepare(`
      SELECT op.*, COUNT(om.user_id)::int as member_count
      FROM organization_profiles op
      LEFT JOIN org_memberships om ON om.org_id = op.id
      GROUP BY op.id ORDER BY op.created_at DESC
    `).all();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/admin/licenses — all active licenses
router.get('/admin/licenses', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const licenses = await db.prepare(`
      SELECT pl.*, u.email, u.display_name, op.name as org_name
      FROM product_licenses pl
      JOIN users u ON u.id = pl.user_id
      LEFT JOIN organization_profiles op ON op.id = pl.org_id
      WHERE pl.is_active = TRUE
      ORDER BY pl.granted_at DESC
    `).all();
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles/admin/licenses — grant a license
router.post('/admin/licenses', express.json(), async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { user_id, org_id, product_id, tier = 'standard', expires_at, scope } = req.body;
    if (!user_id || !product_id) return res.status(400).json({ error: 'user_id and product_id required' });

    const [license] = await db.prepare(`
      INSERT INTO product_licenses (user_id, org_id, product_id, tier, granted_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `).all(user_id, org_id || null, product_id, tier, user.id, expires_at || null);

    if (scope) {
      await db.prepare(`INSERT INTO data_entitlements (license_id, scope) VALUES ($1, $2)`).run(license.id, JSON.stringify(scope));
    }

    await audit({ req, actor: user, action: 'license.grant', entityType: 'license', entityId: license.id,
      summary: `Granted ${product_id} (${tier}) to user ${user_id}` });
    res.json(license);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/admin/licenses/:id — revoke
router.delete('/admin/licenses/:id', async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await db.prepare(`UPDATE product_licenses SET is_active = FALSE WHERE id = $1`).run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
