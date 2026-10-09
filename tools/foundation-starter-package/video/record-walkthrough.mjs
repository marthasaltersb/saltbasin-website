#!/usr/bin/env node
// Records the training walkthrough of the Salt Basin tracker demo and the mapping guide as a video with
// on-screen captions (no audio). Captions, the pointer and highlights are injected only while
// recording; the pages themselves are unchanged.
//
//   node record-walkthrough.mjs <out-dir> [--three <local three.min.js>] [--playwright <path to playwright>]
//
// Writes <out-dir>/walkthrough.webm, walkthrough.mp4 (if ffmpeg is installed) and chapters.json.
// chapters.json times come from the script's clock and drift a few seconds behind the video when 3D
// rendering is slow; check them against the video before publishing (6-training.md lists measured times).
// --three serves a local three.js r128 build when the machine can't reach the CDN.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const out = argv[0];
if (!out || out.startsWith('--')) { console.error('usage: record-walkthrough.mjs <out-dir> [--three file] [--playwright path]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const pwPath = opt('--playwright');
const { chromium } = pwPath ? createRequire(import.meta.url)(pwPath) : await import('playwright');

const W = 1280; const H = 720;
const wrap = (file) => {   // the artifact host adds a document skeleton at publish time; do the same locally
  const body = fs.readFileSync(path.join(here, file), 'utf8');
  const p = path.join(out, `_${file}`);
  fs.writeFileSync(p, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>${body}</body></html>`);
  return pathToFileURL(p).href;
};

const OVERLAY = `
(() => {
  if (document.getElementById('wt-cap')) return;
  const css = document.createElement('style');
  css.textContent = \`
  #wt-cap{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:980px;width:calc(100% - 80px);z-index:99999;
    background:rgba(17,25,40,.94);color:#F5F0E8;border-top:2px solid #C4843A;padding:14px 20px 16px;font:500 19px/1.45 "DM Sans",system-ui,sans-serif;
    box-shadow:0 10px 40px rgba(0,0,0,.45);border-radius:2px;transition:opacity .25s}
  #wt-cap b{color:#DDAA66;font-weight:600}
  #wt-chap{position:fixed;left:24px;top:18px;z-index:99999;font:500 12px "Jost",system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;
    color:#DDAA66;background:rgba(17,25,40,.9);padding:7px 12px;border:1px solid rgba(212,184,150,.3)}
  #wt-ptr{position:fixed;width:22px;height:22px;border-radius:50%;border:2px solid #F5F0E8;background:rgba(196,132,58,.55);z-index:100000;
    pointer-events:none;transform:translate(-50%,-50%);transition:left .7s ease,top .7s ease;left:640px;top:360px;box-shadow:0 0 0 4px rgba(196,132,58,.25)}
  #wt-ptr.click{animation:wtclick .45s ease}
  @keyframes wtclick{50%{transform:translate(-50%,-50%) scale(.6)}}
  .wt-hl{position:fixed;z-index:99998;pointer-events:none;border:2px solid #DDAA66;box-shadow:0 0 0 9999px rgba(10,18,28,.45);border-radius:3px;transition:all .5s ease}
  #wt-card{position:fixed;inset:0;z-index:100001;background:radial-gradient(120% 90% at 50% 40%,#24384E,#111928 70%);color:#F5F0E8;
    display:grid;place-content:center;text-align:center;padding:40px;gap:16px}
  #wt-card h1{font:600 54px/1.05 "Cormorant Garamond",Georgia,serif;margin:0}
  #wt-card p{font:400 21px/1.5 "DM Sans",system-ui,sans-serif;color:#B5C4C1;max-width:860px;margin:0 auto}
  #wt-card .eb{font:500 13px "Jost",system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#DDAA66}
  #wt-card pre{font:15px/1.7 ui-monospace,Menlo,monospace;color:#F5F0E8;background:rgba(17,25,40,.7);border-left:2px solid #4A7C8E;
    padding:16px 22px;text-align:left;margin:6px auto 0;max-width:900px;white-space:pre-wrap}\`;
  document.head.appendChild(css);
  const cap = document.createElement('div'); cap.id = 'wt-cap'; cap.style.opacity = 0; document.body.appendChild(cap);
  const chap = document.createElement('div'); chap.id = 'wt-chap'; chap.style.opacity = 0; document.body.appendChild(chap);
  const ptr = document.createElement('div'); ptr.id = 'wt-ptr'; document.body.appendChild(ptr);
})();`;

const chapters = [];
let t0 = 0;
const now = () => (Date.now() - t0) / 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } }, colorScheme: 'dark' });
  const three = opt('--three');
  if (three) await ctx.route(/three(\.min)?\.js/, (r) => r.fulfill({ path: three, contentType: 'text/javascript' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());   // offline-safe; the CSS has fallbacks
  try { localStorage; } catch { /* node */ }
  const page = await ctx.newPage();
  t0 = Date.now();

  const overlay = () => page.evaluate(OVERLAY);
  const chapter = async (title) => { chapters.push({ at: Math.round(now()), title }); await page.evaluate((t) => { const c = document.getElementById('wt-chap'); c.textContent = t; c.style.opacity = 1; }, title); };
  const say = async (html, ms = 5200) => { await page.evaluate((h) => { const c = document.getElementById('wt-cap'); c.innerHTML = h; c.style.opacity = 1; }, html); await sleep(ms); };
  const hush = () => page.evaluate(() => { document.getElementById('wt-cap').style.opacity = 0; });
  const card = async (html, ms) => { await page.evaluate((h) => { let c = document.getElementById('wt-card'); if (!c) { c = document.createElement('div'); c.id = 'wt-card'; document.body.appendChild(c); } c.innerHTML = h; c.style.display = 'grid'; }, html); await sleep(ms); };
  const uncard = () => page.evaluate(() => { const c = document.getElementById('wt-card'); if (c) c.style.display = 'none'; });
  const box = async (sel) => { const el = await page.$(sel); if (!el) return null; await el.scrollIntoViewIfNeeded(); await sleep(350); return el.boundingBox(); };
  const highlight = async (sel, pad = 8) => {
    const b = await box(sel);
    await page.evaluate(({ b, pad }) => {
      document.querySelectorAll('.wt-hl').forEach((e) => e.remove());
      if (!b) return;
      const h = document.createElement('div'); h.className = 'wt-hl';
      Object.assign(h.style, { left: `${b.x - pad}px`, top: `${b.y - pad}px`, width: `${b.width + pad * 2}px`, height: `${b.height + pad * 2}px` });
      document.body.appendChild(h);
    }, { b, pad });
    return b;
  };
  const unhighlight = () => page.evaluate(() => document.querySelectorAll('.wt-hl').forEach((e) => e.remove()));
  const pointTo = async (x, y, click = false) => {
    await page.evaluate(({ x, y }) => { const p = document.getElementById('wt-ptr'); p.style.left = `${x}px`; p.style.top = `${y}px`; }, { x, y });
    await sleep(800);
    if (click) { await page.evaluate(() => { const p = document.getElementById('wt-ptr'); p.classList.remove('click'); void p.offsetWidth; p.classList.add('click'); }); await page.mouse.click(x, y); await sleep(500); }
  };
  const scrollTo = (sel) => page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), sel).then(() => sleep(900));

  // ── Part 1: the 3D tracker ──
  await page.goto(wrap('salt-basin-tracker-demo.html'));
  await page.evaluate(() => { try { localStorage.removeItem('rt-filter'); } catch {} });
  await page.waitForTimeout(1500);
  await overlay();
  await chapter('Welcome');
  await card(`<div class="eb">Training walkthrough</div><h1>Salt Basin Release Tracker</h1><p>How the board works, how to read it, and how it was built. Everything shown uses fictional demo data.</p>`, 5000);
  await uncard();

  await chapter('1 · The board at a glance');
  await highlight('.hero-copy');
  await say('This is the <b>release tracker</b>. It follows every feature through <b>build → validate in the browser → triage → fix → re-test</b> until every journey passes.');
  await highlight('#sync', 6);
  await say('The status line shows <b>when the board last updated</b>. On a live board it refreshes on its own as agents and pipelines report in.');

  await chapter('2 · The release crystal');
  const stage = await highlight('#stage', 0);
  await say('The 3D view is the <b>release crystal</b>. The centre is the release. Each <b>gem is a feature</b>, coloured by its status (see the legend underneath).', 6000);
  await say('Small red shards circling a gem are <b>open bugs</b>. A pink outline means the feature <b>needs a person</b>. Teal satellites are <b>agents working</b> on it right now.', 6200);
  if (stage) {
    const cx = stage.x + stage.width / 2; const cy = stage.y + stage.height / 2;
    await pointTo(cx - 120, cy + 40);
    await say('You can <b>drag to turn</b> the crystal and see every feature from any side.', 1200);
    await page.mouse.move(cx - 120, cy + 40); await page.mouse.down();
    for (let i = 0; i <= 24; i++) { const x = cx - 120 + i * 10; await page.mouse.move(x, cy + 40); await page.evaluate(({ x, y }) => { const p = document.getElementById('wt-ptr'); p.style.transition = 'none'; p.style.left = `${x}px`; p.style.top = `${y}px`; }, { x, y: cy + 40 }); await sleep(45); }
    await page.mouse.up();
    await page.evaluate(() => { document.getElementById('wt-ptr').style.transition = ''; });
    await sleep(2400);
  }

  await chapter('3 · Focus on one feature');
  await unhighlight();
  const chip = await box('#filters button[data-k="bravo-forms"]');
  await say('Select a gem, or a feature name above it, to <b>focus the whole board</b> on that one feature.', 1800);
  if (chip) await pointTo(chip.x + chip.width / 2, chip.y + chip.height / 2, true);
  await say('Now everything below shows only <b>bravo-forms</b>, and its gem grows and gets a gold halo.', 5200);
  await scrollTo('#strip');
  await highlight('#bugs', 4);
  await say('bravo-forms has a bug that survived <b>two fix attempts</b>, so it left the automated loop and now <b>needs a person</b>. A second item needs a <b>business decision</b>, with the exact question shown.', 7000);
  await scrollTo('.wrap');
  const all = await box('#filters button[data-k="all"]');
  if (all) await pointTo(all.x + all.width / 2, all.y + all.height / 2, true);
  await say('Select <b>All features</b> to go back to the full view.', 3000);

  await chapter('4 · Summary and alerts');
  await scrollTo('#strip');
  await highlight('#strip', 6);
  await say('The summary strip answers the first questions: <b>how many features passed</b>, how many agents are running, open bugs, bugs <b>verified fixed</b>, and what <b>needs a person</b>.', 6500);
  await highlight('#humanCallout', 6);
  await say('Anything that needs a person is <b>called out on its own</b>. These items are out of the automated loop until someone decides.', 5500);

  await chapter('5 · Agents working now');
  await scrollTo('#now');
  await highlight('#now', 6);
  await say('Each card is an <b>agent running right now</b>: its role, its feature, what it is doing this minute, and any failures it has already seen, before triage even starts.', 6500);

  await chapter('6 · Features');
  await scrollTo('#features');
  await highlight('#features', 4);
  await say('Every feature with its status, its <b>latest browser test</b> (steps passed out of total) and how many rounds it has taken. A feature is only <b>Passed</b> when its latest round passed every step.', 7000);

  await chapter('7 · Bugs and their history');
  await scrollTo('#bugs');
  await highlight('#bugs', 4);
  const sum = await box('#bugs details summary');
  if (sum) await pointTo(sum.x + 40, sum.y + 12, true);
  await say('Open any bug to see its <b>full history</b>: when it was found, each fix attempt, each re-test. Bugs <b>never leave the board</b>; they end as verified fixed.', 7000);

  await chapter('8 · Every agent run');
  await scrollTo('#agents');
  await highlight('#agents', 4);
  await say('The ledger lists <b>every agent run</b>, its result and its token use. A run that died without a result shows as <b>failed, never as done</b>.', 6500);
  await unhighlight(); await hush();

  // ── Part 2: how it was built ──
  await chapter('9 · How it was built');
  await card(`<div class="eb">How it was built</div><h1>From events to a living board</h1>
  <pre>your CI, scripts or agents
   └─ log.mjs start | result | fail | step   → journal.jsonl + step logs
        └─ sync.mjs  (rules from tracker.config.json)  → snapshot.json
             └─ the board (any web host, or a claude.ai page)</pre>
  <p>The board never invents anything. It only shows what was reported, and anything missing reads "not recorded".</p>`, 9000);
  await card(`<div class="eb">The method</div><h1>One request at a time</h1>
  <p>1. Ask for one thing. &nbsp;2. Check what already exists. &nbsp;3. Build it or write it down as a versioned spec. &nbsp;4. Record the decision and the open questions. &nbsp;5. Ask the next question.</p>
  <p>Generic kit → Salt Basin 3D demo → scenes defined step by step → the seven mapping questions → foundations per person and organization → seeds → features only from seeds, with every piece of work traced to its seeds.</p>`, 10000);

  // ── Part 3: the mapping guide ──
  await uncard();
  await page.goto(wrap('mapping-guide.html'));
  await page.waitForTimeout(800);
  await overlay();
  await chapter('10 · Bring your own system');
  await highlight('header', 8);
  await say('Other teams keep their own tools. They answer <b>seven mapping questions once</b>, and their status changes flow into the same board.', 6000);
  await scrollTo('ol.q');
  await highlight('ol.q', 6);
  await say('What is a feature? Which statuses mean each stage? What is one test round? How is a bug tied to its feature? How do you spot a returning bug? What needs a business decision? When does a person take over?', 9000);
  await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' })); await sleep(900);
  await say('In Salt Basin these seven answers become your <b>foundation</b>. You build everything else on top of it, scene by scene.', 6000);
  await scrollTo('pre');
  await highlight('pre', 6);
  await say('A worked example: a Jira epic fails 2 of 12 checks, triage files a bug, and the board shows it failing at <b>10/12 with one open bug</b>.', 6500);
  await unhighlight(); await hush();

  await chapter('11 · Make it yours');
  await card(`<div class="eb">Make it yours</div><h1>Foundation Starter Package</h1>
  <p>Read <b style="color:#DDAA66">1-concepts</b>, follow <b style="color:#DDAA66">2-setup-with-your-own-claude</b>, keep <b style="color:#DDAA66">3-rules</b> in your CLAUDE.md, work through <b style="color:#DDAA66">4-your-setup-checklist</b>, and paste the prompts from <b style="color:#DDAA66">prompts.md</b> into Claude Code.</p>
  <p>Working today: the tracker kit and this demo. Designed and ready to build: foundations, seeds, features from seeds, and scenes.</p>`, 9000);

  const video = page.video();
  await ctx.close(); await browser.close();
  const raw = await video.path();
  const webm = path.join(out, 'walkthrough.webm');
  fs.renameSync(raw, webm);
  for (const f of fs.readdirSync(out)) if (f.startsWith('_')) fs.rmSync(path.join(out, f));
  fs.writeFileSync(path.join(out, 'chapters.json'), JSON.stringify({ duration: Math.round(now()), chapters }, null, 2));
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '23', '-movflags', '+faststart', path.join(out, 'walkthrough.mp4')]);
  } catch (e) { console.warn('mp4 conversion skipped:', e.message); }
  console.log(JSON.stringify({ out, chapters }, null, 1));
}
run().catch((e) => { console.error(e); process.exit(1); });
