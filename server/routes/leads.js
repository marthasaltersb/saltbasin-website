import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();

// Source must look like a form key — letters, numbers, dashes, underscores.
// This is loose enough that you can add custom forms with `source: 'pricing-page-cta'`
// without backend changes, but tight enough to reject obviously bad input.
function isValidSource(s) {
  return typeof s === 'string' && s.length > 0 && s.length <= 64 && /^[A-Za-z0-9_-]+$/.test(s);
}

// Short, URL-safe lead id. Length 6 + sanity check for uniqueness.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // dropped 0/O/1/I to reduce confusion
function newPublicId() {
  let id;
  do {
    id = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) id += ALPHABET[bytes[i] % ALPHABET.length];
  } while (db.prepare('SELECT 1 FROM leads WHERE public_id = ?').get(id));
  return id;
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

// ── Public: create a lead ──
router.post('/', (req, res) => {
  const { source, email, name, message } = req.body || {};
  if (!isValidSource(source)) return res.status(400).json({ error: 'invalid source' });
  if (!email || typeof email !== 'string' || !email.includes('@'))
    return res.status(400).json({ error: 'valid email required' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'slow down a moment' });

  const publicId = newPublicId();
  const accessToken = newToken();
  const result = db
    .prepare(
      `INSERT INTO leads (source, email, name, message, public_id, access_token)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      source,
      email.trim().toLowerCase(),
      name?.slice(0, 200) || null,
      message?.slice(0, 2000) || null,
      publicId,
      accessToken
    );
  res.json({
    ok: true,
    leadId: Number(result.lastInsertRowid),
    publicId,
    token: accessToken,
    leadUrl: `/lead/${publicId}?t=${accessToken}`,
  });
});

// Verify lead-facing access. Admin sessions bypass the token check.
function getLeadByPublic(req) {
  const { publicId } = req.params;
  const token = req.query.t;
  const row = db
    .prepare(
      `SELECT id, source, email, name, message, public_id, access_token, answers, created_at, updated_at
       FROM leads WHERE public_id = ?`
    )
    .get(publicId);
  if (!row) return { error: 'not found', status: 404 };
  // Admins can read any lead without the token.
  const adminCookie = req.cookies?.sb_admin;
  if (adminCookie) {
    const session = db
      .prepare(
        `SELECT u.role FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > ?`
      )
      .get(adminCookie, Date.now());
    if (session?.role === 'admin') return { lead: row };
  }
  if (!token || token !== row.access_token) return { error: 'unauthorized', status: 401 };
  return { lead: row };
}

// ── Public: read your own lead ──
router.get('/public/:publicId', (req, res) => {
  const { lead, error, status } = getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  res.json({
    publicId: lead.public_id,
    source: lead.source,
    email: lead.email,
    name: lead.name,
    message: lead.message,
    answers: lead.answers ? JSON.parse(lead.answers) : {},
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  });
});

// ── Public: update name or answers ──
router.patch('/public/:publicId', (req, res) => {
  const { lead, error, status } = getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  const { name, answers } = req.body || {};
  const nextName = typeof name === 'string' ? name.slice(0, 200) : lead.name;
  const nextAnswers = answers && typeof answers === 'object'
    ? JSON.stringify({ ...(lead.answers ? JSON.parse(lead.answers) : {}), ...answers })
    : lead.answers;
  db.prepare(
    `UPDATE leads SET name = ?, answers = ?, updated_at = ? WHERE id = ?`
  ).run(nextName, nextAnswers, Date.now(), lead.id);
  res.json({ ok: true });
});

// ── Public: chat with the agent (stubbed; Slice 2 wires Claude) ──
router.post('/public/:publicId/chat', (req, res) => {
  const { lead, error, status } = getLeadByPublic(req);
  if (error) return res.status(status).json({ error });
  res.status(501).json({
    error: 'BestyStaff agent comes online in Phase 5 / when ANTHROPIC_API_KEY is set.',
  });
});

// ── Admin: list leads ──
router.get('/', requireAdmin, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, source, email, name, message, public_id, answers, created_at, updated_at
       FROM leads ORDER BY id DESC LIMIT 500`
    )
    .all();
  res.json({
    leads: rows.map((r) => ({
      ...r,
      answers: r.answers ? JSON.parse(r.answers) : null,
    })),
  });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
