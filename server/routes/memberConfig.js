// Member-scoped config routes — same pattern as memberSite.js.
//
// Stores brand colors, social handles, the Net Works opt-in toggle, and the
// BYO Anthropic key for the Config Agent. Never returns the API key to the
// client unless the requesting user owns the record.

import { Router } from 'express';
import { db, getJSON } from '../db.js';
import { requireUser } from '../auth.js';
import { defaultMemberConfig } from '../data/defaultMemberConfig.js';
import { encrypt } from '../lib/crypto.js';
import { hasCareerPortfolioContent } from '../lib/careerAtomRollups.js';
import { MEMBER_FEATURES, requireMemberFeature } from '../lib/memberAccess.js';

const router = Router();

// The BYO Anthropic key is encrypted at rest (like OAuth tokens in
// lib/crypto.js) and never round-tripped to the client. GET responses get
// `anthropicKeyConfigured` instead of the key/blob; PUT only touches the
// stored key when the client explicitly sends `anthropicKey` (non-empty to
// set, '' to clear) — omitting the field entirely leaves the existing
// connection untouched.
function redactForClient(cfg) {
  if (!cfg || typeof cfg !== 'object') return cfg;
  const safe = JSON.parse(JSON.stringify(cfg));
  if (safe.integrations) {
    safe.integrations.anthropicKeyConfigured = !!safe.integrations.anthropicKeyEnc;
    delete safe.integrations.anthropicKeyEnc;
    delete safe.integrations.anthropicKey;
  }
  return safe;
}

// Page types are a platform-wide taxonomy, not per-member data — this reads
// the same config_state row admin edits via PUT /api/config/page-types.
// Read-only here; members don't get their own copy or edit rights.
// Deploy-safety: entries in this row (and admin_nav) are additive-only —
// existing keys are never renamed or removed once members may reference
// them, only appended to.
router.get('/page-types', requireUser, async (req, res) => {
  const data = (await getJSON('config_state', 'page_type_definitions')) || { types: [] };
  res.json(data);
});

async function readState(userId, kind) {
  const row = await db
    .prepare('SELECT data FROM member_configs WHERE user_id = $1 AND kind = $2')
    .get(userId, kind);
  return row ? JSON.parse(row.data) : null;
}

async function writeState(userId, kind, data) {
  // Stamp a schema version if the config predates the field — never touched
  // again unless a future breaking migration explicitly bumps it.
  if (data && typeof data === 'object' && data.schemaVersion === undefined) data.schemaVersion = 1;
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
  const defaults = defaultMemberConfig({ displayName: req.user.displayName, email: req.user.email });
  const navigation = cfg.navigation || defaults.navigation;
  // Additive-only merge (2026-08-06, Career Placement Agents tab): a member
  // whose stored member_configs row predates a newly-added default tab
  // still gets it, appended after their existing tabs (never reordering or
  // overwriting anything they already have) — a read-time overlay, not a
  // persisted write, so this never touches the stored row per the
  // never-write-member-rows-from-seed/bootstrap invariant. Existing tabs
  // (including a member's own customizations, once that's editable) always
  // win; this only fills in tabs missing entirely.
  const existingIds = new Set((navigation.memberTabs || []).map((t) => t.id));
  const missingDefaultTabs = (defaults.navigation.memberTabs || []).filter((t) => !existingIds.has(t.id));
  const mergedNavigation = missingDefaultTabs.length
    ? { ...navigation, memberTabs: [...(navigation.memberTabs || []), ...missingDefaultTabs] }
    : navigation;
  res.json(redactForClient({ ...cfg, navigation: mergedNavigation }));
});

router.put('/draft', requireUser, requireMemberFeature(MEMBER_FEATURES.MEMBER_SITE), async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'expected config object' });
  }
  // Defensive: if a client somehow omits integrations, don't wipe the existing
  // Anthropic key. Merge old into new before persisting.
  const existing = (await readState(req.user.id, 'draft')) || {};
  const mergedIntegrations = {
    ...(existing.integrations || {}),
    ...(incoming.integrations || {}),
  };
  // anthropicKey only appears here when the member pasted a new key (encrypt
  // it) or explicitly cleared the field (''); absent entirely means "leave
  // the existing connection alone" — the client never has the real value to
  // round-trip since GET redacts it.
  if (incoming.integrations && 'anthropicKey' in incoming.integrations) {
    const raw = incoming.integrations.anthropicKey;
    if (raw) mergedIntegrations.anthropicKeyEnc = encrypt(raw);
    else delete mergedIntegrations.anthropicKeyEnc;
  }
  delete mergedIntegrations.anthropicKey; // never persist plaintext

  const merged = { ...incoming, integrations: mergedIntegrations };
  await writeState(req.user.id, 'draft', merged);
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireUser, requireMemberFeature(MEMBER_FEATURES.MEMBER_SITE), async (req, res) => {
  const draft = await readState(req.user.id, 'draft');
  if (!draft) return res.status(404).json({ error: 'no draft to publish' });
  // Rollout gate: mirrors memberSite.js's /publish — a member's public
  // profile can't go live before their Career Master data exists.
  if (!(await hasCareerPortfolioContent(req.user.id))) {
    return res.status(400).json({ error: 'career portfolio not yet defined — add at least one Career Master entry before publishing' });
  }
  await writeState(req.user.id, 'published', draft);
  res.json({ ok: true });
});

export default router;
