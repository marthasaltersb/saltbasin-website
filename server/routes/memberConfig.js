// Member-scoped config routes — same pattern as memberSite.js.
//
// Stores brand colors, social handles, the Net Works opt-in toggle, and the
// BYO Anthropic key for the Config Agent. Never returns the API key to the
// client unless the requesting user owns the record.

import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';

const router = Router();

async function readState(userId, kind) {
  const row = await db
    .prepare('SELECT data FROM member_configs WHERE user_id = $1 AND kind = $2')
    .get(userId, kind);
  return row ? JSON.parse(row.data) : null;
}

async function writeState(userId, kind, data) {
  const json = JSON.stringify(data);
  await db
    .prepare(
      `INSERT INTO member_configs (user_id, kind, data, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(userId, kind, json, Date.now());
}

async function ensureDraft(user) {
  const existing = await readState(user.id, 'draft');
  if (existing) return existing;
  const seeded = defaultMemberConfig({ displayName: user.displayName, email: user.email });
  await writeState(user.id, 'draft', seeded);
  return seeded;
}

router.get('/draft', requireUser, async (req, res) => {
  const cfg = await ensureDraft(req.user);
  res.json(cfg);
});

router.put('/draft', requireUser, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'expected config object' });
  }
  // Defensive: if a client somehow omits integrations, don't wipe the existing
  // Anthropic key. Merge old into new before persisting.
  const existing = (await readState(req.user.id, 'draft')) || {};
  const merged = {
    ...incoming,
    integrations: {
      ...(existing.integrations || {}),
      ...(incoming.integrations || {}),
    },
  };
  await writeState(req.user.id, 'draft', merged);
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireUser, async (req, res) => {
  const draft = await readState(req.user.id, 'draft');
  if (!draft) return res.status(404).json({ error: 'no draft to publish' });
  await writeState(req.user.id, 'published', draft);
  res.json({ ok: true });
});

export default router;
