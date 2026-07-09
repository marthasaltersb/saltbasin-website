// Burst-level classification of Strategic Direction / Domain Authoring /
// Active Supervision — v2, replacing the broken per-turn-gap approach
// (which only measured the pause before each human turn and completely
// missed Claude's execution time, undercounting by an order of
// magnitude — see git history for the discarded v1).
//
// Method: for each burst (same unit used for Active Supervision hours),
// classify every real human turn inside it by content. If any turn in
// the burst matches Strategic Direction signals, the WHOLE burst is
// tagged strategic_direction (that decision is what the burst's
// execution time was FOR). Else if any turn matches Domain Authoring
// signals, tag domain_authoring. Else active_supervision.
//
// This is a RECLASSIFICATION of hours already counted, not additional
// hours: a burst's duration still counts once, just bucketed into one of
// three categories instead of always "active supervision". Strategic/
// Domain bursts get full weight (1.0) regardless of subsequent turn
// density -- the density-based discount (1.0/0.75/0.5) exists to
// distinguish supervision *engagement* levels, and doesn't apply to a
// burst whose existence was already justified by a direction-setting
// decision (a detailed spec turn followed by Claude executing it for 40
// minutes at low density is not "less" strategic because Betsy didn't
// keep typing).
//
// Uses the corrected isRealHumanMessage filter (excludes context-
// compaction summaries and task-notification/scheduled-task system
// messages -- see analyze-contribution-sessions.mjs for the same fix).

import fs from 'fs';
import path from 'path';
import os from 'os';

const dir = path.join(os.homedir(), '.claude', 'projects', 'C--Users-mbets-saltbasin-website');

const SESSIONS = {
  '97254a80': '97254a80-feaa-4c85-80fb-f0938a553251.jsonl',
  'de055505': 'de055505-dc52-499d-978f-44e5e9323502.jsonl',
  '551b4cbf': '551b4cbf-3e51-4315-a936-732f68aa348d.jsonl',
  'e3c9236b': 'e3c9236b-fa3f-40be-8418-a807e0c3a21a.jsonl',
  '50a9edca': '50a9edca-f76e-4aad-aeb1-702e16c9b604.jsonl',
  '4ded6650': '4ded6650-5817-4768-a501-7b55b01fb2f6.jsonl',
  'fd26e133': 'fd26e133-8fc2-466d-a852-9bf79328181e.jsonl',
};

function getTurnText(o) {
  const content = o.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return '';
}

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

const STRATEGIC_KEYWORDS = /\b(architecture|platform|vision|pricing|revenue model|roadmap|vendor|tech stack|strategy|rebuild|merge.*(architecture|platform)|unified.*(data model|architecture)|product design)\b/i;
const DOMAIN_KEYWORDS = /\b(requirement|business rule|spec(ification)?|schema|taxonomy|definition|data model|framework|methodology|user stor(y|ies)|acceptance criteria|design spec)\b/i;
const CORRECTION_SIGNAL = /^(no[,.]|yes[,.]|that'?s (wrong|not right|broken)|fix|revert|wrong|not quite|still (broken|not working)|doesn'?t work)/i;

function classifyTurn(text) {
  const len = text.trim().length;
  if (len < 400) return 'active_supervision';
  if (CORRECTION_SIGNAL.test(text.trim())) return 'active_supervision';
  if (STRATEGIC_KEYWORDS.test(text)) return 'strategic_direction';
  if (DOMAIN_KEYWORDS.test(text)) return 'domain_authoring';
  return 'active_supervision';
}

function burstWeight(humanCount, density) {
  if (humanCount === 0) return 0.5;
  if (density > 40) return 1.0;
  if (density >= 15) return 0.75;
  return 0.5;
}

const IDLE_GAP_MIN = 15;
const results = {};

for (const [key, fname] of Object.entries(SESSIONS)) {
  const filePath = path.join(dir, fname);
  if (!fs.existsSync(filePath)) { console.log(key, 'FILE NOT FOUND'); continue; }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const events = [];
  for (const line of lines) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (!o.timestamp) continue;
    const t = new Date(o.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    const isHuman = o.type === 'user' && isRealHumanMessage(o);
    events.push({ t, isHuman, text: isHuman ? getTurnText(o) : null });
  }
  events.sort((a, b) => a.t - b.t);
  if (!events.length) continue;

  const gapMs = IDLE_GAP_MIN * 60000;
  const bursts = [];
  let bs = events[0].t, prev = events[0].t, humanTurns = events[0].isHuman ? [events[0]] : [];
  for (let i = 1; i < events.length; i++) {
    if (events[i].t - prev > gapMs) {
      bursts.push({ start: bs, end: prev, humanTurns });
      bs = events[i].t; humanTurns = [];
    }
    prev = events[i].t;
    if (events[i].isHuman) humanTurns.push(events[i]);
  }
  bursts.push({ start: bs, end: prev, humanTurns });

  const byCategory = { strategic_direction: 0, domain_authoring: 0, active_supervision: 0 };
  const burstDetail = [];
  for (const b of bursts) {
    const hrs = (b.end - b.start) / 3600000;
    const density = hrs > 0 ? b.humanTurns.length / hrs : 0;
    const turnCats = b.humanTurns.map((t) => classifyTurn(t.text));
    let burstCategory = 'active_supervision';
    if (turnCats.includes('strategic_direction')) burstCategory = 'strategic_direction';
    else if (turnCats.includes('domain_authoring')) burstCategory = 'domain_authoring';

    const weight = burstCategory === 'active_supervision' ? burstWeight(b.humanTurns.length, density) : 1.0;
    const weightedHrs = hrs * weight;
    byCategory[burstCategory] += weightedHrs;
    burstDetail.push({
      start: new Date(b.start).toISOString(),
      durMin: Math.round((hrs * 60) * 10) / 10,
      humanTurns: b.humanTurns.length,
      category: burstCategory,
      weight,
      weightedHrs: Math.round(weightedHrs * 100) / 100,
      previews: b.humanTurns.filter((t) => classifyTurn(t.text) !== 'active_supervision').map((t) => t.text.slice(0, 120).replace(/\n/g, ' ')),
    });
  }

  results[key] = {
    hoursByCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    totalWeightedHrs: Math.round(Object.values(byCategory).reduce((s, v) => s + v, 0) * 100) / 100,
    burstCount: bursts.length,
    bursts: burstDetail,
  };
  console.log(key, JSON.stringify(results[key].hoursByCategory), 'total=' + results[key].totalWeightedHrs, 'bursts=' + bursts.length);
}

fs.writeFileSync('turn-classification.json', JSON.stringify(results, null, 2));
console.log('\nWrote turn-classification.json for review.');
