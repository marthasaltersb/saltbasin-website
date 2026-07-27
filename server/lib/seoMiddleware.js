// Server-side SEO meta-tag injection for the production Express static
// build. A client-side <head> update (see src/lib/useSeoHead.js) is
// invisible to link-unfurling bots (Slack, Twitter/X, LinkedIn, iMessage) —
// they fetch the HTML once and never execute JS. This middleware rewrites
// the per-request HTML response so those bots see real per-page title/
// description/OG/canonical/JSON-LD data.
//
// Registered ahead of express.static in server/index.js, inside the existing
// `if (isProd)` block. Must never be able to break a page load: any failure
// falls through via next() to the normal static/catch-all handlers.

import fs from 'fs';
import path from 'path';
import { db, getJSON } from '../db.js';
import { buildSeoTags, injectSeoIntoHtml } from './seo.js';

const CACHE_MS = 60_000; // matches the existing publishedSiteCache TTL in routes/site.js

let indexHtmlCache = null;
function loadIndexHtml(distDir) {
  if (!indexHtmlCache) indexHtmlCache = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  return indexHtmlCache;
}

function findPageBySlug(pages, slug) {
  const entries = Object.entries(pages || {});
  return (
    entries.find(([, p]) => (p.slug || '') === slug)?.[1] ||
    (slug === '' ? entries.find(([, p]) => !p.slug)?.[1] : null) ||
    null
  );
}

const siteCache = { data: null, at: 0 };
async function getPublishedSaltBasinSite() {
  if (siteCache.data && Date.now() - siteCache.at < CACHE_MS) return siteCache.data;
  const site = (await getJSON('site_state', 'published')) || { pages: {} };
  siteCache.data = site;
  siteCache.at = Date.now();
  return site;
}

const memberSiteCache = new Map(); // slug -> { data, at }
async function getPublishedMemberSite(slug) {
  const cached = memberSiteCache.get(slug);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  const row = await db
    .prepare(
      `SELECT ms.data AS site_json, mc.data AS config_json
         FROM member_profiles mp
         JOIN member_sites ms ON ms.user_id = mp.user_id AND ms.kind = 'published'
         LEFT JOIN member_configs mc ON mc.user_id = mp.user_id AND mc.kind = 'published'
         WHERE mp.slug = $1`
    )
    .get(slug);
  const data = row
    ? { site: JSON.parse(row.site_json), config: row.config_json ? JSON.parse(row.config_json) : null }
    : null;
  memberSiteCache.set(slug, { data, at: Date.now() });
  return data;
}

export function createSeoMiddleware(distDir) {
  return async function seoMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    if (path.extname(req.path)) return next(); // real static asset (js/css/img/etc) — let express.static handle it

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let page = null;
      let siteName;

      const memberMatch = req.path.match(/^\/u\/([^/]+)(\/(.*))?$/);
      if (memberMatch) {
        const [, slug, , subPath] = memberMatch;
        const member = await getPublishedMemberSite(slug);
        if (member) {
          page = findPageBySlug(member.site?.pages, subPath || '');
          siteName = member.config?.site?.ownerName || member.config?.featured?.homeCompanyName;
        }
      } else {
        const site = await getPublishedSaltBasinSite();
        page = findPageBySlug(site.pages, req.path.replace(/^\//, ''));
      }

      if (!page) return next(); // unknown route — let the SPA fallback + client 404 UI handle it

      const tags = buildSeoTags(page, { baseUrl, pathname: req.path, siteName });
      const html = loadIndexHtml(distDir);
      res.set('Content-Type', 'text/html');
      res.send(injectSeoIntoHtml(html, tags));
    } catch (err) {
      console.error('[seoMiddleware] falling through after error:', err);
      next();
    }
  };
}
