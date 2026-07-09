import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked, getUserFromCookie } from '../auth.js';
import { captureLineage } from '../lib/lineage.js';
import {
  resumeUrlFromPreset, pickPrimaryPreset, publicPresetView,
  loadResumePresets, siteOwnerUserId,
} from '../lib/resumePresets.js';

const router = Router();

// Public: resolve the site owner's (admin's) primary resume preset into the
// URL the homepage portfolio hub links to. The hub always shows the owner's
// portfolio, so this must not depend on who the viewer is.
router.get('/resume-url', async (req, res) => {
  const ownerId = await siteOwnerUserId();
  const presets = ownerId ? await loadResumePresets(ownerId) : [];
  const primary = pickPrimaryPreset(presets);
  res.json({
    url: resumeUrlFromPreset(primary),
    source: primary ? 'primary_preset' : 'default',
    preset: publicPresetView(primary),
  });
});

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
  const prev = await getJSON('site_state', 'draft');
  await setJSON('site_state', 'draft', incoming);
  const user = await getUserFromCookie(req);
  captureLineage({
    entityType: 'site_state', entityId: 'draft',
    prevData: prev, nextData: incoming,
    sourceType: 'manual',
    authorId: user?.id || null, authorEmail: user?.email || null,
  }).catch(() => {});
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireAdmin, async (req, res) => {
  const draft = await getJSON('site_state', 'draft');
  if (!draft) return res.status(409).json({ error: 'no draft to publish' });
  const prevPublished = await getJSON('site_state', 'published');
  await setJSON('site_state', 'published', draft);
  const draftConfig = await getJSON('config_state', 'draft');
  if (draftConfig) await setJSON('config_state', 'published', draftConfig);
  const user = await getUserFromCookie(req);
  captureLineage({
    entityType: 'site_state', entityId: 'published',
    prevData: prevPublished, nextData: draft,
    sourceType: 'publish',
    authorId: user?.id || null, authorEmail: user?.email || null,
  }).catch(() => {});
  res.json({ ok: true, publishedAt: Date.now() });
});

export default router;
