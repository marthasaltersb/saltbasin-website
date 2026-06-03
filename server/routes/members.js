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

function uniqueSlugFor(base) {
  let slug = base || 'operator';
  let n = 0;
  while (db.prepare('SELECT 1 FROM member_profiles WHERE slug = ?').get(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// Public signup — creates a member + their starter profile.
router.post('/signup', async (req, res) => {
  const { email, password, displayName, requestedSlug } = req.body || {};
  const created = await createMember(email, password, displayName);
  if (created.error) return res.status(400).json({ error: created.error });

  const base = slugify(requestedSlug || displayName || email.split('@')[0]);
  const slug = uniqueSlugFor(base);
  const profile = defaultMemberProfile({ displayName, email });
  db.prepare(
    'INSERT INTO member_profiles (user_id, slug, draft, published) VALUES (?, ?, ?, NULL)'
  ).run(created.id, slug, JSON.stringify(profile));

  // Auto-login.
  const { token } = createSession(created.id);
  setAdminCookie(res, token);

  res.json({ ok: true, slug, user: { id: created.id, email: created.email, role: 'member' } });
});

// Current member: read their draft profile.
router.get('/me/profile', requireUser, (req, res) => {
  const row = db
    .prepare('SELECT slug, draft, published FROM member_profiles WHERE user_id = ?')
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: 'no profile for this user' });
  res.json({
    slug: row.slug,
    draft: JSON.parse(row.draft),
    published: row.published ? JSON.parse(row.published) : null,
  });
});

router.put('/me/profile', requireUser, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !incoming.profile) {
    return res.status(400).json({ error: 'expected { profile, version }' });
  }
  const result = db
    .prepare(
      'UPDATE member_profiles SET draft = ?, updated_at = ? WHERE user_id = ?'
    )
    .run(JSON.stringify(incoming), Date.now(), req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'no profile' });
  res.json({ ok: true });
});

router.post('/me/profile/publish', requireUser, (req, res) => {
  const row = db.prepare('SELECT draft FROM member_profiles WHERE user_id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'no profile' });
  db.prepare(
    'UPDATE member_profiles SET published = draft, updated_at = ? WHERE user_id = ?'
  ).run(Date.now(), req.user.id);
  res.json({ ok: true });
});

// Public profile read by slug — published only.
router.get('/:slug', (req, res) => {
  const row = db
    .prepare('SELECT published FROM member_profiles WHERE slug = ?')
    .get(req.params.slug);
  if (!row || !row.published) return res.status(404).json({ error: 'profile not published' });
  res.json(JSON.parse(row.published));
});

// Admin: list members.
router.get('/', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.created_at, m.slug, m.published IS NOT NULL AS published, m.updated_at
       FROM users u LEFT JOIN member_profiles m ON m.user_id = u.id
       WHERE u.role = 'member' ORDER BY u.id DESC`
    )
    .all();
  res.json({ members: rows });
});

export default router;
