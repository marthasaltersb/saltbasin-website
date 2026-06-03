import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked } from '../auth.js';

const router = Router();

// Strip draft sections + pages out of the public view.
function publicView(site) {
  if (!site || !site.pages) return site;
  const out = { ...site, pages: {} };
  for (const [k, pg] of Object.entries(site.pages)) {
    if (pg.status === 'draft') continue;
    out.pages[k] = {
      ...pg,
      sections: (pg.sections || []).filter((s) => s.status !== 'draft'),
    };
  }
  return out;
}

// Public read — only published, only non-draft. Blocked if landing gate is on.
router.get('/published', (req, res) => {
  if (!isLandingUnlocked(req)) return res.status(403).json({ error: 'landing gate locked' });
  const site = getJSON('site_state', 'published') || { pages: {} };
  res.json(publicView(site));
});

// Admin: full draft state
router.get('/draft', requireAdmin, (req, res) => {
  const site = getJSON('site_state', 'draft') || { pages: {} };
  res.json(site);
});

// Admin: replace the entire draft (simple v1 semantic — front-end sends back
// the full draft on save). Phase 3 will add scoped agent-tool mutations.
router.put('/draft', requireAdmin, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !incoming.pages) {
    return res.status(400).json({ error: 'expected { pages, version }' });
  }
  setJSON('site_state', 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

// Admin: copy draft → published atomically.
router.post('/publish', requireAdmin, (req, res) => {
  const draft = getJSON('site_state', 'draft');
  if (!draft) return res.status(409).json({ error: 'no draft to publish' });
  setJSON('site_state', 'published', draft);
  // Same publish op applies config as well — config and content publish together.
  const draftConfig = getJSON('config_state', 'draft');
  if (draftConfig) setJSON('config_state', 'published', draftConfig);
  res.json({ ok: true, publishedAt: Date.now() });
});

export default router;
