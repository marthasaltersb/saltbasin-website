import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const router = Router();

const VALID_SOURCES = new Set(['joinNetwork', 'forCompanies', 'assessments', 'contact']);

// Naive in-process rate limiter — 5 submissions per IP per minute is plenty
// for a single-tenant CMS during Phase 2. Swap for express-rate-limit if abuse
// shows up.
const recent = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (recent.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > 5;
}

router.post('/', (req, res) => {
  const { source, email, name, message } = req.body || {};
  if (!VALID_SOURCES.has(source)) return res.status(400).json({ error: 'invalid source' });
  if (!email || typeof email !== 'string' || !email.includes('@'))
    return res.status(400).json({ error: 'valid email required' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'slow down a moment' });

  db.prepare(
    'INSERT INTO leads (source, email, name, message) VALUES (?, ?, ?, ?)'
  ).run(source, email.trim().toLowerCase(), name?.slice(0, 200) || null, message?.slice(0, 2000) || null);
  res.json({ ok: true });
});

router.get('/', requireAdmin, (req, res) => {
  const rows = db
    .prepare('SELECT id, source, email, name, message, created_at FROM leads ORDER BY id DESC LIMIT 500')
    .all();
  res.json({ leads: rows });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  res.json({ ok: true });
});

export default router;
