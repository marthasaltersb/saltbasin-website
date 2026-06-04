import { Router } from 'express';
import { db } from '../db.js';
import {
  login,
  createSession,
  setAdminCookie,
  requireUser,
  requireAdmin,
  createMember,
} from '../auth.js';
import { defaultMemberProfile } from '../data/defaultMemberProfile.js';

const router = Router();

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function uniqueSlugFor(base) {
  let slug = base || 'operator';
  let n = 0;
  while (true) {
    const exists = await db.prepare('SELECT 1 FROM member_profiles WHERE slug = $1').get(slug);
    if (!exists) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// Public signup — creates a member + their starter profile, optionally linking
// an incoming lead conversion via fromLeadPublicId + fromLeadToken.
router.post('/signup', async (req, res) => {
  const { email, password, displayName, requestedSlug, fromLeadPublicId, fromLeadToken } =
    req.body || {};
  const created = await createMember(email, password, displayName);
  if (created.error) return res.status(400).json({ error: created.error });

  const base = slugify(requestedSlug || displayName || email.split('@')[0]);
  const slug = await uniqueSlugFor(base);
  const profile = defaultMemberProfile({ displayName, email });
  await db
    .prepare(
      'INSERT INTO member_profiles (user_id, slug, draft, published) VALUES ($1, $2, $3, NULL)'
    )
    .run(created.id, slug, JSON.stringify(profile));

  if (fromLeadPublicId && fromLeadToken) {
    const lead = await db
      .prepare('SELECT id, access_token FROM leads WHERE public_id = $1')
      .get(fromLeadPublicId);
    if (lead && lead.access_token === fromLeadToken) {
      await db
        .prepare(
          'UPDATE leads SET converted_user_id = $1, updated_at = $2 WHERE id = $3'
        )
        .run(created.id, Date.now(), Number(lead.id));
    }
  }

  const { token } = await createSession(created.id);
  setAdminCookie(res, token);

  res.json({ ok: true, slug, user: { id: created.id, email: created.email, role: 'member' } });
});

router.get('/me/profile', requireUser, async (req, res) => {
  const row = await db
    .prepare('SELECT slug, draft, published FROM member_profiles WHERE user_id = $1')
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: 'no profile for this user' });
  res.json({
    slug: row.slug,
    draft: JSON.parse(row.draft),
    published: row.published ? JSON.parse(row.published) : null,
  });
});

router.put('/me/profile', requireUser, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !incoming.profile) {
    return res.status(400).json({ error: 'expected { profile, version }' });
  }
  const result = await db
    .prepare(
      'UPDATE member_profiles SET draft = $1, updated_at = $2 WHERE user_id = $3 RETURNING user_id'
    )
    .run(JSON.stringify(incoming), Date.now(), req.user.id);
  if (!result.lastInsertRowid && result.changes === 0) {
    return res.status(404).json({ error: 'no profile' });
  }
  res.json({ ok: true });
});

router.post('/me/profile/publish', requireUser, async (req, res) => {
  const row = await db
    .prepare('SELECT draft FROM member_profiles WHERE user_id = $1')
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: 'no profile' });
  await db
    .prepare(
      'UPDATE member_profiles SET published = draft, updated_at = $1 WHERE user_id = $2'
    )
    .run(Date.now(), req.user.id);
  res.json({ ok: true });
});

router.get('/:slug', async (req, res) => {
  const row = await db
    .prepare('SELECT published FROM member_profiles WHERE slug = $1')
    .get(req.params.slug);
  if (!row || !row.published) return res.status(404).json({ error: 'profile not published' });
  res.json(JSON.parse(row.published));
});

router.get('/', requireAdmin, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.created_at, m.slug,
              (m.published IS NOT NULL) AS published, m.updated_at
       FROM users u LEFT JOIN member_profiles m ON m.user_id = u.id
       WHERE u.role = 'member' ORDER BY u.id DESC`
    )
    .all();
  res.json({
    members: rows.map((r) => ({
      ...r,
      id: Number(r.id),
      created_at: Number(r.created_at),
      updated_at: r.updated_at ? Number(r.updated_at) : null,
    })),
  });
});

export default router;
