#!/usr/bin/env node
// Records a narrated training walkthrough as a video: a real browser follows a short script, a caption bar
// says what is happening, and the control about to be used is outlined before it is clicked.
//
//   node scripts/record-training-video.mjs --script docs/training/videos/<name>.json --out <dir> [--base http://127.0.0.1:3001]
//        [--chromium /path/to/chrome] [--size 1280x800 | --phone] [--storage-state <file>]
//
// Output: <dir>/<name>.mp4 (H.264, plays on phones) when ffmpeg is installed, always <dir>/<name>.webm, and
// <dir>/<name>.steps.json (each step, its caption, start time and result). A step that fails stops the
// recording and exits 1 with the step and the reason; nothing fails silently.
//
// Script format (JSON, fictional data only; the repo is public):
//   { "title": "...", "start": "/path", "init"?: "js run before page scripts (e.g. a data stub)",
//     "steps": [ { "caption": "...", "do": "goto|click|fill|press|wait|scroll|hover|eval|pause",
//                  "target"?: {"role":"button","name":"Save"} | {"text":"..."} | {"testid":"..."} | {"css":"..."},
//                  "value"?: "...", "ms"?: 1800 } ] }
// Captions stay on screen for `ms` (default 2200) after the action so a viewer can read them.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const fail = (m) => { console.error(m); process.exit(1); };
const scriptPath = opt('--script') || fail('Give the walkthrough with --script <file.json>.');
const outDir = path.resolve(opt('--out') || fail('Give an output folder with --out <dir>.'));
const base = (opt('--base') || 'http://127.0.0.1:3001').replace(/\/$/, '');
const chromium = opt('--chromium') || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const phone = argv.includes('--phone');
const [w, h] = (phone ? '390x844' : opt('--size', '1280x800')).split('x').map(Number);
let spec;
try { spec = JSON.parse(fs.readFileSync(scriptPath, 'utf8')); } catch (e) { fail(`The walkthrough file could not be read as JSON: ${scriptPath}\n${e.message}`); }
const name = path.basename(scriptPath, '.json') + (phone ? '-phone' : '');
fs.mkdirSync(outDir, { recursive: true });

let pw;
for (const p of [process.env.PLAYWRIGHT_MODULE, '/var/tmp/sbpg/node_modules/playwright/index.mjs', 'playwright']) {
  if (!p) continue;
  try { pw = await import(p); break; } catch { /* try the next */ }
}
if (!pw) fail('Playwright is not installed. Install it (npm i playwright) or set PLAYWRIGHT_MODULE to its index.mjs.');

const OVERLAY = `(() => {
  if (window.__sbCap) return;
  const bar = document.createElement('div'); bar.id = '__sb_caption';
  bar.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;max-width:min(92vw,980px);'
    + 'background:rgba(20,28,32,.92);color:#fff;font:600 ${phone ? 15 : 19}px/1.35 system-ui,sans-serif;padding:12px 18px;border-radius:12px;'
    + 'box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none;text-align:center;transition:opacity .2s';
  const ring = document.createElement('div'); ring.id = '__sb_ring';
  ring.style.cssText = 'position:fixed;z-index:2147483646;border:3px solid #E0A458;border-radius:10px;box-shadow:0 0 0 4000px rgba(0,0,0,.18);pointer-events:none;display:none;transition:all .25s';
  const add = () => { document.body.appendChild(bar); document.body.appendChild(ring); };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  window.__sbCap = (t) => { bar.textContent = t; bar.style.opacity = t ? 1 : 0; };
  window.__sbRing = (r) => { if (!r) { ring.style.display = 'none'; return; } Object.assign(ring.style, { display: 'block', left: (r.x - 6) + 'px', top: (r.y - 6) + 'px', width: (r.width + 12) + 'px', height: (r.height + 12) + 'px' }); };
})();`;

const browser = await pw.chromium.launch({ executablePath: chromium });
const context = await browser.newContext({
  viewport: { width: w, height: h }, ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  recordVideo: { dir: outDir, size: { width: w, height: h } },
  ...(opt('--storage-state') ? { storageState: opt('--storage-state') } : {}),
});
if (spec.init) await context.addInitScript(spec.init);
await context.addInitScript(OVERLAY);
const page = await context.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const locate = (t) => {
  if (!t) return null;
  if (t.role) return page.getByRole(t.role, { name: t.name, exact: !!t.exact }).first();
  if (t.testid) return page.getByTestId(t.testid).first();
  if (t.text) return page.getByText(t.text, { exact: !!t.exact }).first();
  if (t.css) return page.locator(t.css).first();
  return null;
};
const t0 = Date.now(); const log = []; let failed = null;
const url = (u) => (/^https?:|^file:/.test(u) ? u : base + u);
try {
  await page.goto(url(spec.start || '/'), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  if (spec.title) { await page.evaluate((t) => window.__sbCap?.(t), spec.title); await page.waitForTimeout(2600); }
  for (const [i, s] of (spec.steps || []).entries()) {
    const at = Date.now() - t0;
    await page.evaluate((t) => window.__sbCap?.(t), s.caption || '');
    const loc = locate(s.target);
    try {
      if (loc) { await loc.waitFor({ state: 'visible', timeout: 15000 }); await loc.scrollIntoViewIfNeeded(); const box = await loc.boundingBox(); await page.evaluate((r) => window.__sbRing?.(r), box); await page.waitForTimeout(700); }
      if (s.do === 'goto') await page.goto(url(s.value), { waitUntil: 'domcontentloaded' });
      else if (s.do === 'click') await loc.click();
      else if (s.do === 'fill') { await loc.click(); await loc.fill(''); await loc.pressSequentially(String(s.value ?? ''), { delay: 35 }); }
      else if (s.do === 'press') await (loc || page.keyboard).press(s.value);
      else if (s.do === 'hover') await loc.hover();
      else if (s.do === 'scroll') await page.mouse.wheel(0, Number(s.value) || 500);
      else if (s.do === 'eval') await page.evaluate(s.value);
      else if (s.do === 'wait') await (loc ? Promise.resolve() : page.waitForTimeout(Number(s.value) || 1000));
      await page.evaluate(() => window.__sbRing?.(null));
      await page.waitForTimeout(s.ms ?? 2200);
      log.push({ step: i + 1, caption: s.caption, do: s.do, atMs: at, ok: true });
    } catch (e) {
      failed = { step: i + 1, caption: s.caption, reason: e.message.split('\n')[0] };
      log.push({ step: i + 1, caption: s.caption, do: s.do, atMs: at, ok: false, reason: failed.reason });
      break;
    }
  }
  await page.evaluate(() => window.__sbCap?.(''));
  await page.waitForTimeout(600);
} finally {
  await context.close(); await browser.close();
}
const raw = (await page.video()?.path?.()) || null;
const webm = path.join(outDir, `${name}.webm`);
if (raw && fs.existsSync(raw)) fs.renameSync(raw, webm);
let mp4 = null;
try {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-crf', '23', path.join(outDir, `${name}.mp4`)]);
  mp4 = path.join(outDir, `${name}.mp4`);
} catch (e) { console.error(`The MP4 copy was not made (ffmpeg: ${e.message.split('\n')[0]}); the WebM recording is kept.`); }
fs.writeFileSync(path.join(outDir, `${name}.steps.json`), `${JSON.stringify({ title: spec.title, base, size: `${w}x${h}`, steps: log, pageErrors: errors, failed }, null, 2)}\n`);
console.log(`Recorded ${log.filter((l) => l.ok).length}/${(spec.steps || []).length} steps: ${mp4 || webm}`);
if (failed) { console.error(`Step ${failed.step} failed ("${failed.caption}"): ${failed.reason}`); process.exit(1); }
