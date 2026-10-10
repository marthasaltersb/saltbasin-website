#!/usr/bin/env node
// Production smoke + read-only regression for https://saltbasin.net (feature production-smoke-regression).
//
//   node scripts/production-smoke.mjs [--base https://saltbasin.net] [--out smoke-out] [--round N]
//        [--backend https://saltbasin-website.onrender.com]   (the server behind the site; '' skips S6)
//        [--ignore-blocked-external]   (local rehearsal behind a CDN-blocking proxy only)
//
// Spec: docs/training/production-smoke-regression.md (step ids S*.*, R*.* are stable, never renumbered).
// Runs from GitHub Actions (.github/workflows/production-smoke.yml) because the cloud sandbox cannot reach
// production. Writes <out>/report.json (score block + every step + every frozen-baseline step it mapped)
// and <out>/screens/*.png.
//
// Read-only by construction:
//   - never signs in, never submits a form, never sends a write request of its own except the one
//     unauthenticated POST /mcp (refused with 401 before anything runs);
//   - every non-GET request a page makes to the production origin (page-view tracking and similar) is
//     answered in the browser with a stub and listed in the report under suppressedWrites; it never
//     reaches the server.
// Steps that need a signed-in account are reported not_run (no fictional production test account exists).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const BASE = String(opt('--base', process.env.SMOKE_BASE_URL || 'https://saltbasin.net')).replace(/\/$/, '');
const OUT = path.resolve(opt('--out', 'smoke-out'));
const ROUND = Number(opt('--round', process.env.SMOKE_ROUND || 0)) || null;
const ORIGIN = new URL(BASE).origin;
// The server behind the public site. saltbasin.net is Netlify (frontend + /api proxy) in front of Render; S6.*
// compare the two so a stale frontend or a missing proxy rule shows up as such. Empty string skips S6.
const BACKEND = String(opt('--backend', process.env.SMOKE_BACKEND_URL ?? 'https://saltbasin-website.onrender.com')).replace(/\/$/, '');
// Local rehearsal only (a sandbox whose proxy blocks CDNs): drop load failures of OTHER hosts that the
// proxy refused. Never set on the GitHub runner, where every console error counts.
const IGNORE_BLOCKED_EXTERNAL = argv.includes('--ignore-blocked-external');
const SHOTS = path.join(OUT, 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
const NAV_TIMEOUT = 90_000; // a cold Render container can take 30s+ to wake
const SETTLE_MS = 2_500;

const steps = [];
const record = (id, title, status, detail = {}) => {
  steps.push({ id, title, status, ...detail });
  console.log(`${status.toUpperCase().padEnd(7)} ${id} ${title}${detail.actual ? ` - ${String(detail.actual).slice(0, 200)}` : ''}`);
};
const suppressedWrites = [];
const slug = (s) => String(s || 'home').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 60) || 'home';

async function http(url, init = {}) {
  const started = Date.now();
  try {
    const r = await fetch(url, { redirect: 'manual', ...init, signal: AbortSignal.timeout(NAV_TIMEOUT) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: r.status, headers: Object.fromEntries(r.headers), text, json, ms: Date.now() - started };
  } catch (e) {
    return { status: 0, error: e.message, ms: Date.now() - started };
  }
}

// One browser page visit with error capture. Returns what a step needs to judge.
async function visit(browser, surface, pathname, { shot } = {}) {
  const ctx = await browser.newContext({ ...VIEWPORTS[surface], colorScheme: 'light', locale: 'en-US', timezoneId: 'UTC' });
  const page = await ctx.newPage();
  const log = { pageErrors: [], consoleErrors: [], resource4xx: [], http5xx: [], requestFailed: [] };
  await page.route('**/*', (route) => {
    const req = route.request();
    if (new URL(req.url()).origin === ORIGIN && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
      suppressedWrites.push({ page: pathname, surface, method: req.method(), url: req.url().replace(ORIGIN, '') });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"stub":"production-smoke"}' });
    }
    return route.continue();
  });
  page.on('pageerror', (e) => log.pageErrors.push(String(e.message || e).slice(0, 400)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    const where = m.location()?.url || '';
    if (IGNORE_BLOCKED_EXTERNAL && /ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_AUTHORITY_INVALID/.test(text) && where && !where.startsWith(ORIGIN)) return;
    // The browser's own "Failed to load resource: ... status of 4xx" line is judged from the response
    // below (an anonymous visitor legitimately gets 401 from /api/auth/me), not as an app error.
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(text)) return;
    if (/Failed to load resource: the server responded with a status of 5\d\d/.test(text)) return;
    log.consoleErrors.push(`${text.slice(0, 400)}${m.location()?.url ? ` @ ${m.location().url.replace(ORIGIN, '')}` : ''}`);
  });
  page.on('response', (r) => {
    const s = r.status();
    const u = r.url().replace(ORIGIN, '');
    if (s >= 500) log.http5xx.push(`${s} ${r.request().method()} ${u}`);
    else if (s >= 400) log.resource4xx.push(`${s} ${r.request().method()} ${u}`);
  });
  page.on('requestfailed', (r) => {
    const reason = r.failure()?.errorText || 'failed';
    if (/ERR_ABORTED/.test(reason)) return; // navigation away / download, not a failure
    if (IGNORE_BLOCKED_EXTERNAL && !r.url().startsWith(ORIGIN)) return;
    log.requestFailed.push(`${reason} ${r.url().replace(ORIGIN, '')}`);
  });
  let mainStatus = 0; let mainHeaders = {}; let navError = null;
  try {
    const resp = await page.goto(`${BASE}${pathname}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    mainStatus = resp?.status() || 0;
    mainHeaders = resp ? await resp.allHeaders() : {};
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    // The SPA shows a branded loader while /api/site/published loads; wait for it to go.
    await page.waitForFunction(() => !/Waking up|Loading/i.test(document.body?.innerText?.slice(0, 200) || ''), null, { timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(SETTLE_MS);
  } catch (e) { navError = e.message.split('\n')[0]; }
  const shotPath = shot ? path.join(SHOTS, `${shot}-${surface}.png`) : null;
  if (shotPath) await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});
  return { ctx, page, log, mainStatus, mainHeaders, navError, shot: shotPath ? path.relative(OUT, shotPath) : null };
}

const appErrors = (log) => [...log.pageErrors.map((e) => `pageerror: ${e}`), ...log.consoleErrors.map((e) => `console: ${e}`)];

// Overlap check: visible interactive/heading/text-leaf boxes in document coordinates, excluding fixed or
// sticky layers (they legitimately sit over content as the page scrolls) and ancestor/descendant pairs.
async function layout(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const hScroll = Math.max(de.scrollWidth, document.body.scrollWidth) - de.clientWidth;
    const isPinned = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
    const sel = 'a, button, input, select, textarea, label, h1, h2, h3, h4, p, li';
    const boxes = [];
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      if (el.closest('[aria-hidden="true"], canvas, svg, [data-ux-audit-probe]')) continue;
      if (isPinned(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
      if (!text && !/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) continue;
      boxes.push({ el, tag: el.tagName.toLowerCase(), text, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height });
    }
    const overlaps = [];
    for (let i = 0; i < boxes.length && overlaps.length < 20; i++) {
      for (let j = i + 1; j < boxes.length && overlaps.length < 20; j++) {
        const a = boxes[i]; const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix > 4 && iy > 4 && ix * iy > 0.2 * Math.min(a.w * a.h, b.w * b.h)) {
          overlaps.push(`${a.tag}"${a.text}" x ${b.tag}"${b.text}" (${Math.round(ix)}x${Math.round(iy)}px at ${Math.round(Math.max(a.x, b.x))},${Math.round(Math.max(a.y, b.y))})`);
        }
      }
    }
    return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, hScroll, boxes: boxes.length, overlaps };
  });
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`Production smoke against ${BASE}`);

  // ---- S1 health -----------------------------------------------------------------------------
  const health = await http(`${BASE}/api/health`);
  record('S1.1', 'GET /api/health returns ok', health.status === 200 && health.json?.ok === true && health.json?.db === 'ok' ? 'pass' : 'fail', {
    url: `${BASE}/api/health`, expected: 'HTTP 200 {"ok":true,"db":"ok"}', actual: health.error || `HTTP ${health.status} ${health.text?.slice(0, 200)}`,
  });
  if (health.status === 0) {
    // Nothing else can be judged; report honestly rather than a cascade of failures.
    for (const id of ['S2.1', 'S2.2', 'S2.3', 'S2.4', 'S3.1', 'S3.2', 'S3.3', 'S3.4', 'S3.5', 'S3.6', 'S4.1', 'S5.1', 'S5.2', 'S5.3', 'S5.4', 'S5.5', 'S5.6', 'S5.7', 'S5.8', 'S6.1', 'S6.2', 'S6.3', 'R1.1', 'R1.2', 'R1.3']) {
      record(id, 'production unreachable', 'blocked', { actual: health.error });
    }
    return finish(startedAt, null);
  }

  // ---- S2 public pages ------------------------------------------------------------------------
  const gate = await http(`${BASE}/api/auth/landing-gate/status`);
  const published = await http(`${BASE}/api/site/published`);
  const pages = published.json?.pages ? (Array.isArray(published.json.pages) ? published.json.pages : Object.values(published.json.pages)) : [];
  const livePages = pages.filter((p) => p && p.status !== 'draft');
  const pagePaths = [...new Set(['/', ...livePages.map((p) => `/${String(p.slug || '').replace(/^\/+|\/+$/g, '')}`)])].map((p) => (p === '/' ? '/' : p.replace(/\/$/, '')));
  if (published.status === 403 && gate.json?.enabled) {
    record('S2.1', 'Published site_state is readable', 'blocked', { url: `${BASE}/api/site/published`, expected: 'HTTP 200 with pages', actual: 'Prelaunch landing gate is on (HTTP 403); public pages need the landing password, which this suite does not hold' });
  } else {
    record('S2.1', 'Published site_state is readable', published.status === 200 && pages.length > 0 ? 'pass' : 'fail', {
      url: `${BASE}/api/site/published`, expected: 'HTTP 200 with at least one page', actual: `HTTP ${published.status}, ${pages.length} page(s): ${pagePaths.join(', ')}`,
    });
  }

  const browser = await chromium.launch();
  const pageResults = [];
  const memberLinks = new Set();
  for (const p of pagePaths) {
    const v = await visit(browser, 'desktop', p, { shot: `page-${slug(p)}` });
    const text = await v.page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const notFound = /^\s*Not Found\s*$/m.test(text) && /doesn't exist \(yet\)/.test(text);
    const links = await v.page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))).catch(() => []);
    for (const h of links) { const m = String(h).match(/^(?:https?:\/\/[^/]+)?\/u\/([A-Za-z0-9._-]+)/); if (m) memberLinks.add(m[1]); }
    pageResults.push({ path: p, status: v.mainStatus, navError: v.navError, notFound, textLength: text.trim().length, errors: appErrors(v.log), http5xx: v.log.http5xx, resource4xx: v.log.resource4xx, requestFailed: v.log.requestFailed, shot: v.shot });
    await v.ctx.close();
  }
  const badRender = pageResults.filter((r) => r.navError || r.status >= 400 || r.status === 0 || r.notFound || r.textLength < 40);
  record('S2.2', 'Every public page renders (HTTP < 400, not the Not Found page, visible text)', pageResults.length && !badRender.length ? 'pass' : 'fail', {
    url: pagePaths.map((p) => `${BASE}${p}`).join(' '), expected: 'each page HTTP 200 with its content',
    actual: badRender.length ? badRender.map((r) => `${r.path}: ${r.navError || `HTTP ${r.status}${r.notFound ? ' Not Found page' : ''}${r.textLength < 40 ? ` ${r.textLength} chars of text` : ''}`}`).join('; ') : `${pageResults.length} page(s) rendered`,
    evidence: pageResults.map((r) => r.shot),
  });
  const withErrors = pageResults.filter((r) => r.errors.length);
  record('S2.3', 'No page errors or console errors on any public page', withErrors.length ? 'fail' : 'pass', {
    expected: 'no pageerror and no console.error', actual: withErrors.length ? withErrors.map((r) => `${r.path}: ${r.errors.join(' | ')}`).join('; ') : 'none',
    evidence: withErrors.map((r) => r.shot),
  });
  const with5xx = pageResults.filter((r) => r.http5xx.length);
  record('S2.4', 'No 5xx response on any request a public page makes', with5xx.length ? 'fail' : 'pass', {
    expected: 'no HTTP 5xx', actual: with5xx.length ? with5xx.map((r) => `${r.path}: ${r.http5xx.join(', ')}`).join('; ') : 'none',
    evidence: with5xx.map((r) => r.shot),
  });

  // ---- S3 app routes ---------------------------------------------------------------------------
  const routeCheck = async (id, title, pathname, judge) => {
    const v = await visit(browser, 'desktop', pathname, { shot: `route-${slug(pathname)}` });
    const text = await v.page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const extra = judge ? await judge(v, text) : { ok: true };
    const errs = appErrors(v.log);
    const ok = !v.navError && v.mainStatus > 0 && v.mainStatus < 400 && !v.log.http5xx.length && !errs.length && extra.ok;
    record(id, title, ok ? 'pass' : 'fail', {
      url: `${BASE}${pathname}`, expected: extra.expected || 'HTTP 200, page renders, no page/console errors, no 5xx',
      actual: [v.navError, `HTTP ${v.mainStatus}`, extra.actual, errs.length && `errors: ${errs.join(' | ')}`, v.log.http5xx.length && `5xx: ${v.log.http5xx.join(', ')}`].filter(Boolean).join('; '),
      evidence: [v.shot], resource4xx: v.log.resource4xx,
    });
    await v.ctx.close();
    return { v, text, extra };
  };
  await routeCheck('S3.1', '/world loads', '/world', async (v, text) => ({ ok: text.trim().length > 0, actual: `${text.trim().length} chars of text` }));
  await routeCheck('S3.2', '/login loads with an email and a password field', '/login', async (v) => {
    const n = await v.page.evaluate(() => ({ email: document.querySelectorAll('input[type=email], input[name=email], input[autocomplete=username]').length, pw: document.querySelectorAll('input[type=password]').length }));
    return { ok: n.email > 0 && n.pw > 0, expected: 'login form with email and password inputs', actual: `email inputs ${n.email}, password inputs ${n.pw}` };
  });
  const memberSlug = [...memberLinks][0] || null;
  if (memberSlug) {
    await routeCheck('S3.3', `Member public site /u/<slug> loads (slug taken from a public link)`, `/u/${memberSlug}`, async (v, text) => ({
      ok: text.trim().length > 40 && !/not found|no such member/i.test(text.slice(0, 300)), actual: `${text.trim().length} chars; links found: ${memberLinks.size}`,
    }));
  } else {
    record('S3.3', 'Member public site /u/<slug> loads (slug taken from a public link)', 'not_run', { expected: 'a /u/<slug> link on a public page', actual: 'No public page links to a /u/<slug> member site; no slug was guessed' });
  }
  const NOT_AVAILABLE = /This link isn.t available/;
  const rCheck = async (token) => {
    const v = await visit(browser, 'desktop', `/r/${token}`, { shot: `r-${slug(token).slice(0, 12)}` });
    const text = await v.page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const meta = await v.page.evaluate(() => document.querySelector('meta[name=robots]')?.content || null).catch(() => null);
    const api = await http(`${BASE}/api/shared-outputs/${token}`);
    await v.ctx.close();
    return { v, text, meta, api };
  };
  const rLong = await rCheck('AAAAAAAAAAAAAAAAAAAAAAAA');
  const rShort = await rCheck('short');
  const judgeR = (r) => NOT_AVAILABLE.test(r.text) && !r.v.navError && !r.v.log.http5xx.length && !appErrors(r.v.log).length;
  const rActual = (r) => [r.v.navError, `page HTTP ${r.v.mainStatus}`, NOT_AVAILABLE.test(r.text) ? 'heading "This link isn\'t available"' : `text: ${r.text.trim().slice(0, 120)}`, `API HTTP ${r.api.status}`, appErrors(r.v.log).join(' | ')].filter(Boolean).join('; ');
  record('S3.4', 'Invalid /r/<token> shows the not-available page', judgeR(rLong) ? 'pass' : 'fail', {
    url: `${BASE}/r/AAAAAAAAAAAAAAAAAAAAAAAA`, expected: 'heading "This link isn\'t available", no page errors', actual: rActual(rLong), evidence: [rLong.v.shot],
  });
  const xr = rLong.v.mainHeaders['x-robots-tag'] || '';
  const apiXr = rLong.api.headers?.['x-robots-tag'] || '';
  record('S3.5', 'The not-available page is noindex (header and meta)', /noindex/.test(xr) && /noindex/.test(rLong.meta || '') && /noindex/.test(apiXr) ? 'pass' : 'fail', {
    url: `${BASE}/r/AAAAAAAAAAAAAAAAAAAAAAAA`, expected: 'X-Robots-Tag noindex on the page and on /api/shared-outputs/<token>; meta robots "noindex, nofollow, noarchive"',
    actual: `page X-Robots-Tag "${xr}", meta robots "${rLong.meta}", API X-Robots-Tag "${apiXr}", Referrer-Policy "${rLong.v.mainHeaders['referrer-policy'] || ''}"`, evidence: [rLong.v.shot],
  });
  record('S3.6', '/r/short shows the same not-available page', judgeR(rShort) ? 'pass' : 'fail', {
    url: `${BASE}/r/short`, expected: 'same page as S3.4', actual: rActual(rShort), evidence: [rShort.v.shot],
  });

  // ---- S4 MCP ---------------------------------------------------------------------------------
  const mcp = await http(`${BASE}/mcp`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
  });
  record('S4.1', '/mcp without a token returns 401 with a JSON error', mcp.status === 401 && mcp.json && (mcp.json.error || mcp.json.message) ? 'pass' : 'fail', {
    url: `${BASE}/mcp`, expected: 'HTTP 401, JSON body with an error, WWW-Authenticate Bearer',
    actual: mcp.error || `HTTP ${mcp.status} ${String(mcp.headers?.['content-type'] || '')} ${mcp.text?.slice(0, 200)} WWW-Authenticate "${mcp.headers?.['www-authenticate'] || ''}"`,
  });

  // ---- S5 layout ------------------------------------------------------------------------------
  const layoutSteps = [['/', 'desktop', 'S5.1', 'S5.2'], ['/', 'phone', 'S5.3', 'S5.4'], ['/login', 'desktop', 'S5.5', 'S5.6'], ['/login', 'phone', 'S5.7', 'S5.8']];
  for (const [p, surface, idScroll, idOverlap] of layoutSteps) {
    const name = p === '/' ? 'home' : 'login';
    const v = await visit(browser, surface, p, { shot: `layout-${name}` });
    const l = v.navError ? null : await layout(v.page).catch((e) => ({ error: e.message }));
    if (l && !l.error) await v.page.screenshot({ path: path.join(SHOTS, `layout-${name}-${surface}-full.png`), fullPage: true }).catch(() => {});
    const ev = [v.shot, `screens/layout-${name}-${surface}-full.png`];
    if (!l || l.error) {
      record(idScroll, `${name} at ${surface}: no horizontal scroll`, 'blocked', { actual: v.navError || l?.error });
      record(idOverlap, `${name} at ${surface}: nothing overlaps`, 'blocked', { actual: v.navError || l?.error });
    } else {
      record(idScroll, `${name} at ${surface}: no horizontal scroll`, l.hScroll <= 0 ? 'pass' : 'fail', {
        url: `${BASE}${p}`, expected: 'scrollWidth equals clientWidth', actual: `scrollWidth ${l.scrollWidth}, clientWidth ${l.clientWidth}`, evidence: ev,
      });
      record(idOverlap, `${name} at ${surface}: nothing overlaps`, l.overlaps.length ? 'fail' : 'pass', {
        url: `${BASE}${p}`, expected: 'no two visible text/control boxes overlap', actual: l.overlaps.length ? l.overlaps.join('; ') : `${l.boxes} boxes checked, no overlap`, evidence: ev,
      });
    }
    await v.ctx.close();
  }

  // ---- S6 public site vs the server behind it ---------------------------------------------------------
  if (BACKEND && BACKEND !== BASE) {
    const bundle = (html) => [...String(html || '').matchAll(/\/assets\/index-[A-Za-z0-9_-]+\.js/g)].map((m) => m[0])[0] || null;
    const [pub, srv] = await Promise.all([http(`${BASE}/`), http(`${BACKEND}/`)]);
    const a = bundle(pub.text); const b = bundle(srv.text);
    record('S6.1', 'The public site serves the same frontend build as the server', a && b && a === b ? 'pass' : (!b ? 'blocked' : 'fail'), {
      url: `${BASE}/ vs ${BACKEND}/`, expected: 'the same /assets/index-<hash>.js in both pages',
      actual: `public ${a || `none (HTTP ${pub.status})`}, server ${b || `none (HTTP ${srv.status}${srv.error ? ` ${srv.error}` : ''})`}`,
    });
    const mcpB = await http(`${BACKEND}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) });
    record('S6.2', 'The server answers /mcp without a token with 401 JSON', mcpB.status === 401 && mcpB.json ? 'pass' : (mcpB.status === 0 ? 'blocked' : 'fail'), {
      url: `${BACKEND}/mcp`, expected: 'HTTP 401 JSON (so a /mcp proxy rule on the public site has a working target)', actual: mcpB.error || `HTTP ${mcpB.status} ${mcpB.text?.slice(0, 160)}`,
    });
    const rB = await http(`${BACKEND}/r/AAAAAAAAAAAAAAAAAAAAAAAA`);
    record('S6.3', 'The server sends the /r/ privacy headers', /noindex/.test(rB.headers?.['x-robots-tag'] || '') && /no-referrer/.test(rB.headers?.['referrer-policy'] || '') ? 'pass' : (rB.status === 0 ? 'blocked' : 'fail'), {
      url: `${BACKEND}/r/AAAAAAAAAAAAAAAAAAAAAAAA`, expected: 'X-Robots-Tag noindex and Referrer-Policy no-referrer', actual: rB.error || `HTTP ${rB.status}, X-Robots-Tag "${rB.headers?.['x-robots-tag'] || ''}", Referrer-Policy "${rB.headers?.['referrer-policy'] || ''}"`,
    });
  } else {
    for (const id of ['S6.1', 'S6.2', 'S6.3']) record(id, 'public site vs server', 'not_run', { actual: 'no separate server URL (--backend)' });
  }

  // ---- R regression: anonymous, read-only steps of the delivered features' frozen baselines ------
  record('R1.1', 'qr-gated-outputs v2 [J10.1]: /r/AAAAAAAAAAAAAAAAAAAAAAAA shows "This link isn\'t available"', judgeR(rLong) ? 'pass' : 'fail', {
    baseline: 'qr-gated-outputs v2 J10.1', url: `${BASE}/r/AAAAAAAAAAAAAAAAAAAAAAAA`, expected: 'heading "This link isn\'t available", no hint whether the slug existed', actual: rActual(rLong), evidence: [rLong.v.shot],
  });
  record('R1.2', 'qr-gated-outputs v2 [J10.2]: /r/short shows the same page', judgeR(rShort) && rShort.api.status === rLong.api.status ? 'pass' : 'fail', {
    baseline: 'qr-gated-outputs v2 J10.2', url: `${BASE}/r/short`, expected: 'same page and same API status as J10.1', actual: rActual(rShort), evidence: [rShort.v.shot],
  });
  const rl = await http(`${BASE}/api/release-loop/runs`);
  record('R1.3', 'in-app-release-loop v2 [E.6]: GET /api/release-loop/runs with no cookie is 401', rl.status === 401 ? 'pass' : 'fail', {
    baseline: 'in-app-release-loop v2 E.6', url: `${BASE}/api/release-loop/runs`, expected: 'HTTP 401', actual: rl.error || `HTTP ${rl.status} ${rl.text?.slice(0, 160)}`,
  });
  await browser.close();
  return finish(startedAt, { gate: gate.json || null, pages: pageResults, memberLinks: [...memberLinks] });
}

// Every other step of the frozen suites, mapped honestly. Nothing here is guessed as passed.
function baselineMapping() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); } catch { return null; } };
  const ran = { 'qr-gated-outputs': { J10_1: 'R1.1', J10_2: 'R1.2' }, 'in-app-release-loop': { E_6: 'R1.3' } };
  const out = [];
  const suites = [
    ['qr-gated-outputs', 2], ['release-loop-tooling', 3], ['release-intelligence', 3], ['in-app-release-loop', 2],
  ];
  for (const [feature, v] of suites) {
    const b = read(`docs/training/baselines/${feature}/v${v}.json`);
    for (const s of b?.steps || []) {
      const key = s.id.replace('.', '_');
      if (ran[feature]?.[key]) { out.push({ feature, baseline: v, step: s.id, status: 'ran', as: ran[feature][key] }); continue; }
      const reason = feature === 'release-loop-tooling'
        ? 'local_only: repository tooling and fixtures (CLI, tracker preview), not a production surface'
        : (s.surfaces || []).includes('cli') && /psql|ls server|check-interface-parity|import-release-logs/.test(s.summary)
          ? 'local_only: needs the repository or the database directly'
          : 'needs_test_account: needs a signed-in account and/or writes data; no fictional production test account exists';
      out.push({ feature, baseline: v, step: s.id, status: 'not_run', reason });
    }
  }
  const smokeDir = path.join(root, 'docs/training/baselines');
  for (const f of fs.existsSync(smokeDir) ? fs.readdirSync(smokeDir) : []) {
    const sm = read(`docs/training/baselines/${f}/smoke.json`);
    for (const id of sm?.steps || []) {
      out.push({ feature: f, baseline: sm.baselineVersion, step: id, suite: 'smoke', status: 'not_run', reason: 'needs_test_account: admin sign-in and writes; the agent runner fixture worker is never enabled on Render' });
    }
  }
  return out;
}

function finish(startedAt, context) {
  const mapping = baselineMapping();
  record('R2.1', 'Frozen smoke suites (docs/training/baselines/*/smoke.json) replayed', 'not_run', {
    expected: 'each smoke step passes against production', actual: `${mapping.filter((m) => m.suite === 'smoke').length} smoke step(s) need an admin sign-in and writes; no fictional production test account exists`,
  });
  record('R2.2', 'Signed-in read-only steps of the delivered baselines replayed', 'not_run', {
    expected: 'each step passes against production', actual: `${mapping.filter((m) => !m.suite && m.status === 'not_run' && /needs_test_account/.test(m.reason)).length} baseline step(s) need a signed-in account; no fictional production test account exists`,
  });
  const scored = steps.filter((s) => /^[SR]\d/.test(s.id));
  const score = {
    feature: 'production-smoke-regression', baseline: null, target: BASE, round: ROUND,
    total: scored.length, passed: scored.filter((s) => s.status === 'pass').length,
    failed: scored.filter((s) => s.status === 'fail').map((s) => s.id),
    blocked: scored.filter((s) => s.status === 'blocked').map((s) => s.id),
    notRun: scored.filter((s) => s.status === 'not_run').map((s) => s.id),
    preconditionsFailed: [], observations: [],
  };
  const report = {
    score, startedAt, finishedAt: new Date().toISOString(), base: BASE,
    commit: process.env.GITHUB_SHA || null, runUrl: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
    steps, suppressedWrites, baselineMapping: mapping, context,
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nSCORE ${JSON.stringify(score)}`);
  console.log(`report: ${path.join(OUT, 'report.json')}`);
  // Exit non-zero on a failure so the workflow run shows red; not_run/blocked alone do not fail it.
  process.exitCode = score.failed.length ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 2; });
