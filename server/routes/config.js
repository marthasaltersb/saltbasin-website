import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked } from '../auth.js';

const router = Router();

// Public-safe slice of config — what gets exposed to non-authed visitors.
function publicConfig(config) {
  if (!config) return null;
  return {
    site: config.site,
    social: config.social,
    bestystaff: config.bestystaff
      ? {
          enabled: config.bestystaff.enabled,
          greeting: config.bestystaff.greeting,
        }
      : null,
  };
}

router.get('/public', (req, res) => {
  if (!isLandingUnlocked(req)) return res.status(403).json({ error: 'landing gate locked' });
  const config = getJSON('config_state', 'published') || {};
  res.json(publicConfig(config));
});

router.get('/draft', requireAdmin, (req, res) => {
  const config = getJSON('config_state', 'draft') || {};
  res.json(config);
});

router.put('/draft', requireAdmin, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'expected config object' });
  }
  setJSON('config_state', 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

export default router;
