import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();

function isValidSource(s) {
  return typeof s === 'string' && s.length > 0 && s.length <= 64 && /^[A-Za-z0-9_-]+$/.test(s);
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function newPublicId() {
  let id;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    id = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
    const exists = await db.prepare('SELECT 1 FROM leads WHERE public_id = $1').get(id);
    if (!exists) return id;
  }
}

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Naive in-process rate limiter — 5 submissions per IP per minute.
const recent = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (recent.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > 5;
}

// ── Public: create or merge a lead ──
router.post('/', async (req, res) => {
  const { source, email, name, message } = req.body || {};
  if (!isValidSource(source)) return res.status(400).json({ error: 'invalid source' });
  if (!email || typeof email !== 'string' || !email.includes('@'))
    return res.status(400).json({ error: 'valid email required' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'slow down a moment' });

  const normEmail = email.trim().toLowerCase();
  const trimmedName = name?.slice(0, 200) || null;
  const trimmedMsg = message?.slice(0, 2000) || null;

  const existing = await db
    .prepare(`SELECT id, public_id, access_token, name FROM leads WHERE email = $1`)
    .get(normEmail);

  let leadId, publicId, accessToken, isExisting;
  if (existing) {
    leadId = Number(existing.id);
    publicId = existing.public_id;
    accessToken = existing.access_token;
    isExisting = true;
    if (trimmedName && !existing.name) {
      await db
        .prepare('UPDATE leads SET name = $1, updated_at = $2 WHERE id = $3')
        .run(trimmedName, Date.now(), leadId);
    } else {
      await db
        .prepare('UPDATE leads SET updated_at = $1 WHERE id = $2')
        .run(Date.now(), leadId);
    }
  } else {
    publicId = await newPublicId();
    accessToken = newToken();
    const result = await db
      .prepare(
        `INSERT INTO leads (source, email, name, message, public_id, access_token)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
      )
      .run(source, normEmail, trimmedName, trimmedMsg, publicId, accessToken);
    leadId = Number(result.lastInsertRowid);
    isExisting = false;
  }

  await db
    .prepare('INSERT INTO lead_activity (lead_id, source, message) VALUES ($1, $2, $3)')
    .run(leadId, source, trimmedMsg);

  res.json({
    ok: true,
    leadId,
    publicId,
    token: accessToken,
    leadUrl: `/lead/${publicId}?t=${accessToken}`,
    existing: isExisting,
  });
});

// Verify lead-facing access. Admin sessions bypass the token check.
async function getLeadByPublic(req) {
  const { publicId } = req.params;
  const token = req.query.t;
  const row = await db
    .prepare(
      `SELECT id, source, email, name, message, public_id, access_token, answers, created_at, updated_at, converted_user_id
       FROM leads WHERE public_id = $1`
    )
    .get(publicId);
  if (!row) return { error: 'not found', status: 404 };
  const adminCookie = req.cookies?.sb_admin;
  if (adminCookie) {
    const session = await db
      .prepare(
        `SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > $2`
      )
      .get(adminCookie, Date.now());
    if (session?.role === 'admin') return { lead: row };
  }
  if (!token || token !== row.access_token) return { error: 'unauthorized', status: 401 };
  return { lead: row };
}

router.get('/public/:publicId', async (req, res) => {
  const { lead, error, status } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  const activity = await db
    .prepare(
      `SELECT id, source, message, created_at FROM lead_activity
       WHERE lead_id = $1 ORDER BY created_at ASC, id ASC`
    )
    .all(Number(lead.id));
  res.json({
    publicId: lead.public_id,
    source: lead.source,
    email: lead.email,
    name: lead.name,
    message: lead.message,
    answers: lead.answers ? JSON.parse(lead.answers) : {},
    activity,
    createdAt: Number(lead.created_at),
    updatedAt: Number(lead.updated_at),
    convertedUserId: lead.converted_user_id ? Number(lead.converted_user_id) : null,
  });
});

router.patch('/public/:publicId', async (req, res) => {
  const { lead, error, status } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  const { name, answers } = req.body || {};
  const nextName = typeof name === 'string' ? name.slice(0, 200) : lead.name;
  const nextAnswers = answers && typeof answers === 'object'
    ? JSON.stringify({ ...(lead.answers ? JSON.parse(lead.answers) : {}), ...answers })
    : lead.answers;
  await db
    .prepare(`UPDATE leads SET name = $1, answers = $2, updated_at = $3 WHERE id = $4`)
    .run(nextName, nextAnswers, Date.now(), Number(lead.id));
  res.json({ ok: true });
});

router.post('/public/:publicId/chat', async (req, res) => {
  const { error, status } = await getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  res.status(501).json({
    error: 'BestyStaff agent comes online in Phase 5 / when ANTHROPIC_API_KEY is set.',
  });
});

router.get('/', requireAdmin, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT id, source, email, name, message, public_id, answers, created_at, updated_at
       FROM leads ORDER BY id DESC LIMIT 500`
    )
    .all();
  res.json({
    leads: rows.map((r) => ({
      ...r,
      id: Number(r.id),
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at),
      answers: r.answers ? JSON.parse(r.answers) : null,
    })),
  });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  await db.prepare('DELETE FROM leads WHERE id = $1').run(id);
  res.json({ ok: true });
});

export default router;
