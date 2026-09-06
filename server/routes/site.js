import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked, getUserFromCookie } from '../auth.js';
import { captureLineage } from '../lib/lineage.js';
import {
  resumeUrlFromPreset, pickPrimaryPreset, publicPresetView,
  loadResumePresets, siteOwnerUserId,
} from '../lib/resumePresets.js';
import { invalidatePublicConfigCache } from './config.js';
import { postJourneyEvidence } from '../lib/journeyEvidenceHelpers.js';

const router = Router();

function pageList(pages) {
  if (Array.isArray(pages)) return pages;
  if (pages && typeof pages === 'object') return Object.values(pages);
  return [];
}

// In-memory cache for the published site GET, fetched on every public page
// view. Short TTL, invalidated explicitly on publish — never serves stale
// data past a publish action.
let publishedSiteCache = null;
let publishedSiteCacheAt = 0;
const PUBLISHED_SITE_CACHE_MS = 30_000;

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
  if (publishedSiteCache && Date.now() - publishedSiteCacheAt < PUBLISHED_SITE_CACHE_MS) {
    return res.json(publishedSiteCache);
  }
  const site = (await getJSON('site_state', 'published')) || { pages: {} };
  const view = publicView(site);
  publishedSiteCache = view;
  publishedSiteCacheAt = Date.now();
  res.json(view);
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
  if (user?.id) {
    const pages = pageList(incoming.pages);
    postJourneyEvidence(user.id, 'site_composition_journey', 'Salt Basin Site', [
      ['site_pages_defined', pages.length > 1],
      ['site_sections_composed', pages.some((p) => (p.sections || []).length > 0)],
    ]);
  }
  res.json({ ok: true, updatedAt: Date.now() });
});

router.post('/publish', requireAdmin, async (req, res) => {
  const draft = await getJSON('site_state', 'draft');
  if (!draft) return res.status(409).json({ error: 'no draft to publish' });
  const prevPublished = await getJSON('site_state', 'published');
  await setJSON('site_state', 'published', draft);
  const draftConfig = await getJSON('config_state', 'draft');
  if (draftConfig) await setJSON('config_state', 'published', draftConfig);
  publishedSiteCache = null;
  invalidatePublicConfigCache();
  const user = await getUserFromCookie(req);
  captureLineage({
    entityType: 'site_state', entityId: 'published',
    prevData: prevPublished, nextData: draft,
    sourceType: 'publish',
    authorId: user?.id || null, authorEmail: user?.email || null,
  }).catch(() => {});
  if (user?.id) postJourneyEvidence(user.id, 'site_composition_journey', 'Salt Basin Site', [['site_published', true]]);
  res.json({ ok: true, publishedAt: Date.now() });
});

export default router;
