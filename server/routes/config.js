import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked } from '../auth.js';
import { dispatchRaw } from '../lib/email.js';

const router = Router();

// In-memory cache for the public config GET, which is fetched on every
// public page view. Short TTL, invalidated explicitly on publish (called
// from site.js's /publish route, which publishes config_state alongside
// site_state) — never serves stale data past a publish action.
let publicConfigCache = null;
let publicConfigCacheAt = 0;
const PUBLIC_CONFIG_CACHE_MS = 30_000;

export function invalidatePublicConfigCache() {
  publicConfigCache = null;
}

function publicConfig(config) {
  if (!config) return null;
  return {
    site: config.site,
    social: config.social,
    brand: config.brand,
    theme: config.theme,
    bestystaff: config.bestystaff
      ? {
          enabled: config.bestystaff.enabled,
          greeting: config.bestystaff.greeting,
        }
      : null,
  };
}

router.get('/public', async (req, res) => {
  if (!(await isLandingUnlocked(req))) {
    return res.status(403).json({ error: 'landing gate locked' });
  }
  if (publicConfigCache && Date.now() - publicConfigCacheAt < PUBLIC_CONFIG_CACHE_MS) {
    return res.json(publicConfigCache);
  }
  const config = (await getJSON('config_state', 'published')) || {};
  const view = publicConfig(config);
  publicConfigCache = view;
  publicConfigCacheAt = Date.now();
  res.json(view);
});

router.get('/draft', requireAdmin, async (req, res) => {
  const config = (await getJSON('config_state', 'draft')) || {};
  res.json(config);
});

router.put('/draft', requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'expected config object' });
  }
  await setJSON('config_state', 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

// ── Admin nav structure ──
// Stored as a config_state row with id='admin_nav'. Seeded in db.js bootstrap
// if missing, so the GET response is always populated for admins. Shape:
//   { views: [{ id, label, sortOrder, tabs: [{ id, label, componentId, sortOrder }] }] }
//
// componentId references a registry in the React AdminShell — the one piece
// that has to stay in code (components can't be loaded from JSON). Server
// validates structure but not componentId values (the client can fall back
// gracefully if an unknown componentId is referenced).
router.get('/admin-nav', requireAdmin, async (req, res) => {
  const nav = (await getJSON('config_state', 'admin_nav')) || { views: [] };
  res.json(nav);
});

router.put('/admin-nav', requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || !Array.isArray(incoming.views)) {
    return res.status(400).json({ error: 'expected { views: [...] }' });
  }
  // Light structural validation. Bad data here breaks the admin chrome
  // for everyone, so we're strict.
  const seenViewIds = new Set();
  const seenTabIds = new Set();
  for (const v of incoming.views) {
    if (!v.id || !v.label) return res.status(400).json({ error: 'view requires id + label' });
    if (seenViewIds.has(v.id)) return res.status(400).json({ error: `duplicate view id: ${v.id}` });
    seenViewIds.add(v.id);
    if (!Array.isArray(v.tabs)) return res.status(400).json({ error: `view ${v.id} missing tabs[]` });
    for (const t of v.tabs) {
      if (!t.id || !t.label || !t.componentId) {
        return res.status(400).json({ error: `tab requires id + label + componentId (view ${v.id})` });
      }
      if (seenTabIds.has(t.id)) return res.status(400).json({ error: `duplicate tab id: ${t.id}` });
      seenTabIds.add(t.id);
    }
  }
  await setJSON('config_state', 'admin_nav', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

// ── Page type registry ──
// Stored as a config_state row with id='page_type_definitions'. Seeded in
// db.js bootstrap if missing. This is a platform-wide taxonomy (not
// per-member data) — the New Page flow in both admin and member scope reads
// this same row; only admins can edit it (see memberConfig.js for the
// read-only member-scope GET). Shape:
//   { types: [{ id, label, description, defaultSections: [{ type, name, bg, fields }] }] }
router.get('/page-types', requireAdmin, async (req, res) => {
  const data = (await getJSON('config_state', 'page_type_definitions')) || { types: [] };
  res.json(data);
});

router.put('/page-types', requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || !Array.isArray(incoming.types)) {
    return res.status(400).json({ error: 'expected { types: [...] }' });
  }
  const seenIds = new Set();
  for (const t of incoming.types) {
    if (!t.id || !t.label) return res.status(400).json({ error: 'type requires id + label' });
    if (seenIds.has(t.id)) return res.status(400).json({ error: `duplicate type id: ${t.id}` });
    seenIds.add(t.id);
    if (t.defaultSections && !Array.isArray(t.defaultSections)) {
      return res.status(400).json({ error: `type ${t.id} defaultSections must be an array` });
    }
  }
  await setJSON('config_state', 'page_type_definitions', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

// Admin diagnostic: send a test email to a specified address. If
// BREVO_API_KEY isn't set, returns the stub log so admin can see what would
// have been sent.
router.post('/test-email', requireAdmin, async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !to.includes('@')) return res.status(400).json({ error: 'to address required' });
  const result = await dispatchRaw({
    to,
    subject: subject || 'Salt Basin · Test email',
    text: body || 'This is a test email from your Salt Basin admin. If you received this, Brevo (or the console stub) is wired correctly.',
    html: `<p>${body || 'This is a test email from your Salt Basin admin. If you received this, Brevo (or the console stub) is wired correctly.'}</p><p style="font-size:0.75rem;color:#8B9BAE;">— Salt Basin email diagnostic</p>`,
  });
  res.json({
    ...result,
    brevoConfigured: !!process.env.BREVO_API_KEY,
  });
});

export default router;
