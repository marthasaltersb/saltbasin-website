// Precise correlation: for each backlog item's createdAt, find which
// session's actual active BURST (not just its overall dateStart-dateEnd
// span) contains it. This matters because several sessions were resumed
// across days/weeks (e.g. 551b4cbf spans 17 calendar days but only 3.93
// active hours) — a timestamp inside the outer date range can still fall
// in a multi-day idle gap. Burst-level containment is the only precise
// signal, since backlog-item-adding scripts are run as a Bash tool call
// INSIDE a session, so their timestamp lands inside a real burst (or at
// most a few seconds past its last event, since the HTTP call happens
// right after the last logged tool_result).
//
// Read-only. Writes correlation-report.json for review before any PATCH.

import fs from 'fs';
import path from 'path';
import os from 'os';

const DIR = path.join(os.homedir(), '.claude', 'projects', 'C--Users-mbets-saltbasin-website');
const IDLE_GAP_MIN = 15;
const TOLERANCE_MS = 3 * 60 * 1000; // 3 min grace past a burst's last event

function isRealHumanMessage(o) {
  const content = o.message?.content;
  if (typeof content === 'string') return content.trim().length > 0;
  if (Array.isArray(content)) return content.some((c) => c.type === 'text' && c.text?.trim().length > 0);
  return false;
}

function analyzeBursts(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const events = [];
  let assistantTurns = 0, realUserTurns = 0;
  for (const line of lines) {
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (!o.timestamp) continue;
    const t = new Date(o.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    events.push(t);
    if (o.type === 'user' && isRealHumanMessage(o)) realUserTurns++;
    if (o.type === 'assistant') assistantTurns++;
  }
  events.sort((a, b) => a - b);
  if (events.length === 0) return null;

  const gapMs = IDLE_GAP_MIN * 60 * 1000;
  const bursts = [];
  let burstStart = events[0];
  let prev = events[0];
  for (let i = 1; i < events.length; i++) {
    const gap = events[i] - prev;
    if (gap > gapMs) {
      bursts.push({ start: burstStart, end: prev });
      burstStart = events[i];
    }
    prev = events[i];
  }
  bursts.push({ start: burstStart, end: prev });

  const activeMs = bursts.reduce((s, b) => s + (b.end - b.start), 0);
  return {
    file: path.basename(filePath, '.jsonl'),
    activeHours: Math.round((activeMs / 3600000) * 100) / 100,
    assistantTurns,
    realUserTurns,
    turnDensity: activeMs > 0 ? Math.round((realUserTurns / (activeMs / 3600000)) * 10) / 10 : 0,
    bursts: bursts.map((b) => ({
      start: b.start, end: b.end,
      startIso: new Date(b.start).toISOString(), endIso: new Date(b.end).toISOString(),
      durationMin: Math.round(((b.end - b.start) / 60000) * 10) / 10,
    })),
  };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));
const sessions = files.map((f) => analyzeBursts(path.join(DIR, f))).filter(Boolean);

// Sessions confirmed by the handover as NOT representing site-backlog work.
const EXCLUDE_SESSIONS = new Set([
  '2d89e945-2078-4752-9dfa-ee561d78e6ce', // spatial/3D visual design exploration
]);

const snapshot = JSON.parse(fs.readFileSync('backlog-snapshot.json', 'utf8'));
const alreadyCorrected = new Set([102, 103, 104, 105, 106, 107, 108, 109, 110]);

const report = [];
for (const item of snapshot.items) {
  if (alreadyCorrected.has(item.id)) {
    report.push({ id: item.id, createdAtIso: item.createdAtIso, status: 'already_corrected' });
    continue;
  }
  const t = item.createdAt;
  const matches = [];
  for (const s of sessions) {
    if (EXCLUDE_SESSIONS.has(s.file)) continue;
    for (const b of s.bursts) {
      if (t >= b.start - TOLERANCE_MS && t <= b.end + TOLERANCE_MS) {
        matches.push({ session: s.file, burstStart: b.startIso, burstEnd: b.endIso, deltaMs: t < b.start ? b.start - t : (t > b.end ? t - b.end : 0) });
      }
    }
  }
  report.push({
    id: item.id,
    title: item.title,
    externalRef: item.externalRef,
    createdAtIso: item.createdAtIso,
    origHoursClaude: item.hoursClaude,
    origHoursBetsy: item.hoursBetsy,
    status: matches.length === 0 ? 'no_burst_match' : (matches.length === 1 ? 'matched' : 'ambiguous_multi_match'),
    matches,
  });
}

fs.writeFileSync('correlation-report.json', JSON.stringify({ sessions, report }, null, 2));

// Console summary
const byStatus = {};
for (const r of report) { byStatus[r.status] = (byStatus[r.status] || 0) + 1; }
console.log('Correlation summary:', byStatus);
console.log('\nWrote correlation-report.json');
