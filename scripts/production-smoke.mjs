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
// Signed-in steps (R2.x) use ONE dedicated fictional test account (smoke-member@test.saltbasin.invalid, owner
// decision 2026-10-10). Its password comes only from the SMOKE_MEMBER_PASSWORD environment variable (a GitHub
// Actions secret); without it those steps are reported not_run, never guessed. The account is created and
// readied by the "Provision smoke test account" workflow (scripts/provision-smoke-account.mjs). Signed in, the
// suite still only READS: its two direct non-GET requests are the sign-in and the sign-out.
import fs from 'node:fs';
import path from 'node:path';
// Playwright is installed with --no-save on the runner. For a local rehearsal in a sandbox, PLAYWRIGHT_MODULE may
// name its entry file and SMOKE_CHROMIUM_PATH an existing Chromium binary.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? new URL(`file://${process.env.PLAYWRIGHT_MODULE}`).href : 'playwright');

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
const SMOKE_EMAIL = process.env.SMOKE_MEMBER_EMAIL || 'smoke-member@test.saltbasin.invalid';
const SMOKE_PASSWORD = process.env.SMOKE_MEMBER_PASSWORD || '';
const SMOKE_SLUG = 'smoke-test-member';
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
async function visit(browser, surface, pathname, { shot, cookie } = {}) {
  const ctx = await browser.newContext({ ...VIEWPORTS[surface], colorScheme: 'light', locale: 'en-US', timezoneId: 'UTC' });
  if (cookie) await ctx.addCookies([{ name: cookie.name, value: cookie.value, url: ORIGIN }]);
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
    for (const id of ['S2.1', 'S2.2', 'S2.3', 'S2.4', 'S3.1', 'S3.2', 'S3.3', 'S3.4', 'S3.5', 'S3.6', 'S4.1', 'S5.1', 'S5.2', 'S5.3', 'S5.4', 'S5.5', 'S5.6', 'S5.7', 'S5.8', 'S6.1', 'S6.2', 'S6.3', 'R1.1', 'R1.2', 'R1.3', 'R2.1', 'R2.2', 'R2.3']) {
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

  const browser = await chromium.launch(process.env.SMOKE_CHROMIUM_PATH ? { executablePath: process.env.SMOKE_CHROMIUM_PATH } : {});
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
  await runSignedIn(browser);
  await browser.close();
  return finish(startedAt, { gate: gate.json || null, pages: pageResults, memberLinks: [...memberLinks] });
}

// ---- R2 signed-in, read-only replays with the fictional test account --------------------------------
// R2.1 sign in; R2.2 read-only replays as that member; R2.3 the frozen smoke suites (admin + writes + a
// fixture worker never enabled on Render) stay not_run by design. Signs out at the end.
async function runSignedIn(browser) {
  const smokeSteps = (() => { try { return JSON.parse(fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'docs/training/baselines/platform-agent-runner/smoke.json'), 'utf8')).steps.length; } catch { return 0; } })();
  record('R2.3', 'Frozen smoke suites (docs/training/baselines/*/smoke.json) replayed', 'not_run', {
    expected: 'each smoke step passes against production',
    actual: `${smokeSteps} smoke step(s) need an administrator sign-in, write data and run the agent runner's fixture worker, which is never enabled on Render. The test account is a plain member, so they are not replayed (by design, C.2)`,
  });
  if (!SMOKE_PASSWORD) {
    const why = 'SMOKE_MEMBER_PASSWORD is not set, so the test account cannot sign in. Add it as a repository Actions secret and run "Provision smoke test account" (World Shell > Journeys > Production smoke lists the names)';
    record('R2.1', 'Sign in as the fictional smoke test account', 'not_run', { expected: `HTTP 200 for ${SMOKE_EMAIL}`, actual: why });
    record('R2.2', 'Signed-in read-only replays as the test account', 'not_run', { expected: 'every check passes', actual: why });
    return;
  }
  const login = await http(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: SMOKE_EMAIL, password: SMOKE_PASSWORD }) });
  const setCookie = login.headers?.['set-cookie'] || '';
  const m = /(?:^|[,\s])sb_admin=([^;]+)/.exec(setCookie);
  const cookie = m ? { name: 'sb_admin', value: m[1] } : null;
  const user = login.json?.user;
  const signedIn = login.status === 200 && cookie && user?.role === 'member' && user.mustChangePassword === false;
  const loginActual = login.error || (login.status === 200
    ? (cookie ? `HTTP 200, role ${user?.role}, mustChangePassword ${user?.mustChangePassword}` : 'HTTP 200 but no sb_admin cookie was set')
    : `HTTP ${login.status} ${String(login.text || '').slice(0, 160)}${login.status === 401 ? ' (the test account does not exist or its password differs from SMOKE_MEMBER_PASSWORD: run "Provision smoke test account")' : ''}`);
  record('R2.1', 'Sign in as the fictional smoke test account', signedIn ? 'pass' : 'fail', {
    url: `${BASE}/api/auth/login`, expected: `HTTP 200, role member, mustChangePassword false for ${SMOKE_EMAIL}`, actual: loginActual,
  });
  if (!signedIn) { record('R2.2', 'Signed-in read-only replays as the test account', 'blocked', { actual: 'R2.1 failed, so nobody is signed in' }); return; }

  const auth = { headers: { cookie: `sb_admin=${cookie.value}` } };
  const checks = [];
  const check = (name, ok, actual) => checks.push({ name, ok: !!ok, actual });
  const me = await http(`${BASE}/api/auth/me`, auth);
  check('GET /api/auth/me is the test account', me.status === 200 && me.json?.user?.email === SMOKE_EMAIL, `HTTP ${me.status} ${me.json?.user?.email || me.error || ''}`);
  const consent = await http(`${BASE}/api/career/consent-status`, auth);
  check('GET /api/career/consent-status: Career Portfolio terms current (no 428 gate)', consent.status === 200 && consent.json?.granted === true, `HTTP ${consent.status} granted=${consent.json?.granted}`);
  const prof = await http(`${BASE}/api/members/me/profile`, auth);
  check(`GET /api/members/me/profile answers 200 with slug ${SMOKE_SLUG}`, prof.status === 200 && JSON.stringify(prof.json || {}).includes(SMOKE_SLUG), `HTTP ${prof.status}`);
  const outs = await http(`${BASE}/api/resume-outputs`, auth);
  check('GET /api/resume-outputs answers 200 with a projections list (qr-gated-outputs read path)', outs.status === 200 && Array.isArray(outs.json?.projections), `HTTP ${outs.status}`);
  const opps = await http(`${BASE}/api/career-agents/opportunities`, auth);
  check('GET /api/career-agents/opportunities answers 200 (career placement read path)', opps.status === 200, `HTTP ${opps.status}`);
  const rlm = await http(`${BASE}/api/release-loop/runs`, auth);
  check('in-app-release-loop [E.6] member side: GET /api/release-loop/runs is 403 for a member', rlm.status === 403, `HTTP ${rlm.status}`);
  const adm = await http(`${BASE}/api/production-smoke/account`, auth);
  check('GET /api/production-smoke/account is 403 for a member', adm.status === 403, `HTTP ${adm.status}`);

  const shots = [];
  for (const [surface, p, tag] of [['desktop', '/world', 'world'], ['phone', '/world', 'world'], ['desktop', '/member', 'member']]) {
    const v = await visit(browser, surface, p, { shot: `signedin-${tag}`, cookie });
    const text = await v.page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const gated = /password_change_required|Career Portfolio terms|Please sign in|Sign in to/i.test(text) && text.trim().length < 400;
    const errs = appErrors(v.log);
    check(`${p} signed in at ${surface}: loads HTTP < 400, shows content, no sign-in prompt, no terms gate, no page or console error, no 5xx`,
      !v.navError && v.mainStatus > 0 && v.mainStatus < 400 && text.trim().length >= 40 && !gated && !errs.length && !v.log.http5xx.length,
      v.navError || `HTTP ${v.mainStatus}, ${text.trim().length} chars${gated ? ', looks gated: ' + text.trim().slice(0, 120).replace(/\s+/g, ' ') : ''}${errs.length ? '; ' + errs.join('; ') : ''}${v.log.http5xx.length ? '; ' + v.log.http5xx.join('; ') : ''}`);
    shots.push(v.shot);
    await v.ctx.close();
  }
  const bad = checks.filter((c) => !c.ok);
  record('R2.2', 'Signed-in read-only replays as the test account', bad.length ? 'fail' : 'pass', {
    url: BASE, expected: `all ${checks.length} checks pass`,
    actual: bad.length ? bad.map((c) => `${c.name}: ${c.actual}`).join(' | ') : `${checks.length} checks passed`, checks, evidence: shots,
  });
  // Sign out: the session row is the only thing the sign-in created.
  const out = await http(`${BASE}/api/auth/logout`, { method: 'POST', headers: { cookie: `sb_admin=${cookie.value}`, 'content-type': 'application/json' }, body: '{}' });
  if (out.status !== 200) console.warn(`sign-out answered HTTP ${out.status}; the test account's session expires on its own`);
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
          : 'not_replayed: needs an administrator sign-in and/or writes data, or is not mapped to a read-only member check (R2.2 lists the checks it does run)';
      out.push({ feature, baseline: v, step: s.id, status: 'not_run', reason });
    }
  }
  const smokeDir = path.join(root, 'docs/training/baselines');
  for (const f of fs.existsSync(smokeDir) ? fs.readdirSync(smokeDir) : []) {
    const sm = read(`docs/training/baselines/${f}/smoke.json`);
    for (const id of sm?.steps || []) {
      out.push({ feature: f, baseline: sm.baselineVersion, step: id, suite: 'smoke', status: 'not_run', reason: 'not_replayed: admin sign-in and writes; the agent runner fixture worker is never enabled on Render (R2.3)' });
    }
  }
  return out;
}

function finish(startedAt, context) {
  const key = (id) => { const m = /^([A-Z])(\d+)\.(\d+)$/.exec(id); return m ? [m[1], Number(m[2]), Number(m[3])] : [id, 0, 0]; };
  steps.sort((a, b) => { const x = key(a.id); const y = key(b.id); return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1] || x[2] - y[2]; });
  const mapping = baselineMapping();
  // Journey 6 of the training spec lists these steps in this order; the baseline id of production step X is J6.<position>.
  const ORDER = ['S1.1', 'S2.1', 'S2.2', 'S2.3', 'S2.4', 'S3.1', 'S3.2', 'S3.3', 'S3.4', 'S3.5', 'S3.6', 'S4.1', 'S5.1', 'S5.2', 'S5.3', 'S5.4', 'S5.5', 'S5.6', 'S5.7', 'S5.8', 'S6.1', 'S6.2', 'S6.3', 'R1.1', 'R1.2', 'R1.3', 'R2.1', 'R2.2', 'R2.3'];
  for (const st of steps) if (ORDER.includes(st.id)) st.baselineStep = `J6.${ORDER.indexOf(st.id) + 1}`;
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
