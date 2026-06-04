import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked } from '../auth.js';

const router = Router();

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

router.get('/published', async (req, res) => {
  if (!(await isLandingUnlocked(req))) {
    return res.status(403).json({ error: 'landing gate locked' });
  }
  const site = (await getJSON('site_state', 'published')) || { pages: {} };
  res.json(publicView(site));
});

router.get('/draft', requireAdmin, async (req, res) => {
  const site = (await getJSON('site_state', 'draft')) || { pages: {} };
  res.json(site);
});

router.put('/draft', requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !incoming.pages) {
    return res.status(400).json({ error: 'expected { pages, version }' });
  }
  await setJSON('site_state', 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireAdmin, async (req, res) => {
  const draft = await getJSON('site_state', 'draft');
  if (!draft) return res.status(409).json({ error: 'no draft to publish' });
  await setJSON('site_state', 'published', draft);
  const draftConfig = await getJSON('config_state', 'draft');
  if (draftConfig) await setJSON('config_state', 'published', draftConfig);
  res.json({ ok: true, publishedAt: Date.now() });
});

export default router;
