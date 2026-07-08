// Redesign of Active Supervision hours: replaces the old session-level
// oversight-weight formula (activeHours * 0.20 for "low" density — which
// conflated typing frequency with presence, crushing Betsy's hours to
// ~5.5 total) with a per-BURST weight based on what kind of work Claude
// was doing in that specific burst:
//   >40 turns/hr   -> 1.0  (active back-and-forth, frequent redirection)
//   15-40 turns/hr -> 0.75 (regular check-ins, steady engagement)
//   <15 turns/hr   -> 0.5  (long autonomous stretch, present but not steering)
//   0 human turns in a burst with real duration -> 0.5 (same: present, not steering)
//   confirmed autonomous/scheduled session (no human at all) -> 0
//
// hoursClaude is untouched — Claude's hours were already full session
// active hours, that formula wasn't the problem.
//
// Sessions with real burst data (Tier 1): recompute directly from JSONL.
// Tier 2 batch (items 1-47, orphaned session with no surviving transcript):
// no per-burst data exists, so apply the "low density" 0.5 default flatly
// to the whole session total (9.92hr Claude-equivalent -> 4.96hr Betsy),
// then re-apportion across items proportional to their CURRENT hoursBetsy
// share (which already preserves relative complexity weighting from the
// original hand estimates).

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BASE  = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_INITIAL_PASSWORD;

// CORRECTED 2026-07-07 (v0.18.5): the original filter let two more
// synthetic patterns through as "real" human turns — Claude Code's
// auto-generated context-compaction summaries ("This session is being
// continued from a previous conversation...", sometimes 10-20K chars)
// and <task-notification>/<scheduled-task> system messages. Both are
// type:"user" with real text content, so the old filter (which only
// excluded tool_result-only content) counted them as if Betsy typed
// them. This flipped at least one burst's density band for session
// 551b4cbf, overstating items 102-104's hoursBetsy (2.94 -> corrected
// 2.02 weighted hours for that session). Corrected here; if this script
// is re-run, results now reflect the fix.
function isRealHumanMessage(o) {
  const content = o.message?.content;
  let text = null;
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    const hasText = content.some((c) => c.type === 'text' && c.text?.trim().length > 0);
    if (!hasText) return false;
    text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  }
  if (!text || !text.trim()) return false;
  const isSynthetic = /^This session is being continued from a previous conversation/.test(text.trim())
    || /<task-notification>/.test(text)
    || /<scheduled-task /.test(text);
  return !isSynthetic;
}

function burstWeight(humanCount, density) {
  if (humanCount === 0) return 0.5;
  if (density > 40) return 1.0;
  if (density >= 15) return 0.75;
  return 0.5;
}

function analyzeWeightedBetsyHours(filePath, idleGapMin = 15) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const events = [];
  for (const line of lines) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (!o.timestamp) continue;
    const t = new Date(o.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    events.push({ t, isHuman: o.type === 'user' && isRealHumanMessage(o) });
  }
  events.sort((a, b) => a.t - b.t);
  if (!events.length) return { totalHrs: 0, weightedBetsyHrs: 0 };
  const gapMs = idleGapMin * 60000;
  const bursts = [];
  let bs = events[0].t, prev = events[0].t, humanCount = events[0].isHuman ? 1 : 0;
  for (let i = 1; i < events.length; i++) {
    if (events[i].t - prev > gapMs) {
      bursts.push({ start: bs, end: prev, humanCount });
      bs = events[i].t; humanCount = 0;
    }
    prev = events[i].t;
    if (events[i].isHuman) humanCount++;
  }
  bursts.push({ start: bs, end: prev, humanCount });

  let totalHrs = 0, weightedBetsyHrs = 0;
  for (const b of bursts) {
    const hrs = (b.end - b.start) / 3600000;
    const density = hrs > 0 ? b.humanCount / hrs : 0;
    totalHrs += hrs;
    weightedBetsyHrs += hrs * burstWeight(b.humanCount, density);
  }
  return { totalHrs: Math.round(totalHrs * 100) / 100, weightedBetsyHrs: Math.round(weightedBetsyHrs * 100) / 100 };
}

const dir = path.join(os.homedir(), '.claude', 'projects', 'C--Users-mbets-saltbasin-website');
const SESSION_A = analyzeWeightedBetsyHours(path.join(dir, '97254a80-feaa-4c85-80fb-f0938a553251.jsonl')); // items 81-91
const SESSION_B = analyzeWeightedBetsyHours(path.join(dir, 'de055505-dc52-499d-978f-44e5e9323502.jsonl'));  // items 92-97
const SESSION_C = analyzeWeightedBetsyHours(path.join(dir, '551b4cbf-3e51-4315-a936-732f68aa348d.jsonl'));  // items 102-104
const SESSION_D = analyzeWeightedBetsyHours(path.join(dir, 'e3c9236b-fa3f-40be-8418-a807e0c3a21a.jsonl'));  // items 105-110

console.log('Session weighted Betsy hours:');
console.log('  97254a80 (81-91):', SESSION_A);
console.log('  de055505 (92-97):', SESSION_B);
console.log('  551b4cbf (102-104):', SESSION_C);
console.log('  e3c9236b (105-110):', SESSION_D);

const TIER2_TARGET_BETSY = Math.round(9.92 * 0.5 * 100) / 100; // low-density default applied flatly
console.log('  Tier2 batch (1-47) flat 0.5x default:', TIER2_TARGET_BETSY);

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  return res.headers.get('set-cookie').split(';')[0];
}

async function patchItem(cookie, id, hoursBetsy, traditionalCostUsd, activitiesBetsy) {
  const res = await fetch(`${BASE}/api/backlog/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ hoursBetsy, traditionalCostUsd, activitiesBetsy, actualBetsyHours: hoursBetsy }),
  });
  if (!res.ok) { console.error(`  FAILED [${id}]: ${res.status} ${await res.text()}`); return false; }
  return true;
}

async function main() {
  const cookie = await login();
  const r = await fetch(`${BASE}/api/backlog/`, { headers: { Cookie: cookie } });
  const { items } = await r.json();
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const groups = [
    { ids: [81,82,83,84,85,86,87,88,89,90,91], target: SESSION_A.weightedBetsyHrs, mode: 'equal' },
    { ids: [92,93,94,95,96,97], target: SESSION_B.weightedBetsyHrs, mode: 'equal' },
    { ids: [102,103,104], target: SESSION_C.weightedBetsyHrs, mode: 'proportional' },
    { ids: [105,106,107,108,109,110], target: SESSION_D.weightedBetsyHrs, mode: 'proportional' },
  ];

  let patched = 0;
  let grandTotalBetsy = 0;

  for (const g of groups) {
    const currentSum = g.ids.reduce((s, id) => s + (byId[id]?.hoursBetsy || 0), 0);
    for (const id of g.ids) {
      const it = byId[id];
      const share = g.mode === 'equal' ? 1 / g.ids.length : (it.hoursBetsy || 0) / currentSum;
      const newBetsy = Math.round(g.target * share * 100) / 100;
      const newTrad = Math.round((it.hoursClaude + newBetsy) * 175 * 100) / 100;
      const newActBetsy = Math.max(1, Math.ceil(newBetsy * 3));
      grandTotalBetsy += newBetsy;
      const ok = await patchItem(cookie, id, newBetsy, newTrad, newActBetsy);
      if (ok) { patched++; console.log(`  [${id}] hoursBetsy ${it.hoursBetsy} -> ${newBetsy}`); }
    }
  }

  // Tier 2 batch: rescale proportional to current hoursBetsy share
  const tier2Ids = [];
  for (let id = 2; id <= 47; id++) {
    if ([6, 10].includes(id)) continue; // epics stay 0
    if (byId[id] && byId[id].dataSource === 'measured_turn_count_estimate') tier2Ids.push(id);
  }
  const tier2CurrentSum = tier2Ids.reduce((s, id) => s + (byId[id].hoursBetsy || 0), 0);
  for (const id of tier2Ids) {
    const it = byId[id];
    const share = (it.hoursBetsy || 0) / tier2CurrentSum;
    const newBetsy = Math.round(TIER2_TARGET_BETSY * share * 100) / 100;
    const newTrad = Math.round((it.hoursClaude + newBetsy) * 175 * 100) / 100;
    const newActBetsy = Math.max(1, Math.ceil(newBetsy * 3));
    grandTotalBetsy += newBetsy;
    const ok = await patchItem(cookie, id, newBetsy, newTrad, newActBetsy);
    if (ok) { patched++; console.log(`  [${id}] hoursBetsy ${it.hoursBetsy} -> ${newBetsy}`); }
  }

  console.log(`\nDone. Patched ${patched} items. New platform hoursBetsy total (sum of touched items): ${Math.round(grandTotalBetsy * 100) / 100}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
