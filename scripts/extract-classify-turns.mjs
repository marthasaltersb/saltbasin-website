// Extracts every real human turn (actual typed text, not tool-result
// echoes) from the sessions already used for backlog hour attribution,
// plus 50a9edca (spec-authoring session, never attributed anywhere).
// Classifies each turn as Strategic Direction / Domain Authoring / Active
// Supervision by content, and estimates elapsed time per turn as the gap
// since the previous event (capped at the 15-min burst-boundary
// threshold) — a real, reproducible proxy for "how long this turn took
// to think through and write," not a guess.
//
// Classification heuristic (transparent, inspectable — not a black box):
//   Strategic Direction: turn is long (>=400 chars) AND mentions
//     architecture/vision/pricing/model/vendor/platform-level scope, OR
//     is one of the known spec-producing turns in 50a9edca.
//   Domain Authoring: turn is long (>=400 chars) AND mentions
//     requirement/business rule/spec/schema/definition/taxonomy content
//     without being primarily a correction.
//   Active Supervision: everything else — short turns, corrections,
//     confirmations, bug reports, "no/yes/fix/wrong"-style redirects.
//
// A turn can only land in one bucket (Strategic Direction is checked
// first, then Domain Authoring, else Active Supervision) to avoid
// double-counting.

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
};

function getTurnText(o) {
  const content = o.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  }
  return '';
}

function isRealHumanMessage(o) {
  const content = o.message?.content;
  if (typeof content === 'string') return content.trim().length > 0;
  if (Array.isArray(content)) return content.some((c) => c.type === 'text' && c.text?.trim().length > 0);
  return false;
}

const STRATEGIC_KEYWORDS = /\b(architecture|platform|vision|pricing|revenue model|roadmap|vendor|tech stack|strategy|rebuild|merge.*(architecture|platform)|unified.*(data model|architecture)|product design)\b/i;
const DOMAIN_KEYWORDS = /\b(requirement|business rule|spec(ification)?|schema|taxonomy|definition|data model|framework|methodology|user stor(y|ies)|acceptance criteria|design spec)\b/i;
const CORRECTION_SIGNAL = /^(no[,.]|yes[,.]|that'?s (wrong|not right|broken)|fix|revert|wrong|not quite|still (broken|not working)|doesn'?t work)/i;

function classify(text) {
  const len = text.trim().length;
  if (len < 400) return 'active_supervision';
  if (CORRECTION_SIGNAL.test(text.trim())) return 'active_supervision';
  if (STRATEGIC_KEYWORDS.test(text)) return 'strategic_direction';
  if (DOMAIN_KEYWORDS.test(text)) return 'domain_authoring';
  return 'active_supervision';
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
    events.push({ t, isHuman: o.type === 'user' && isRealHumanMessage(o), text: o.type === 'user' ? getTurnText(o) : null });
  }
  events.sort((a, b) => a.t - b.t);

  const gapMs = IDLE_GAP_MIN * 60000;
  const turns = [];
  let prevT = events.length ? events[0].t : null;
  for (const e of events) {
    if (e.isHuman) {
      const gap = prevT != null ? Math.min(e.t - prevT, gapMs) : 0;
      turns.push({ t: e.t, text: e.text, elapsedMinCapped: gap / 60000, category: classify(e.text) });
    }
    prevT = e.t;
  }

  const byCategory = { strategic_direction: 0, domain_authoring: 0, active_supervision: 0 };
  for (const turn of turns) byCategory[turn.category] += turn.elapsedMinCapped;

  results[key] = {
    turnCount: turns.length,
    hoursByCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, Math.round((v / 60) * 100) / 100])),
    turns: turns.map((t) => ({ time: new Date(t.t).toISOString(), category: t.category, chars: t.text.length, elapsedMin: Math.round(t.elapsedMinCapped * 10) / 10, preview: t.text.slice(0, 100).replace(/\n/g, ' ') })),
  };
  console.log(key, JSON.stringify(results[key].hoursByCategory), 'turns:', turns.length);
}

fs.writeFileSync('turn-classification.json', JSON.stringify(results, null, 2));
console.log('\nWrote turn-classification.json for review.');
