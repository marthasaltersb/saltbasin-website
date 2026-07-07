// Burst analysis of Codex's own sandbox activity logs (~/.codex/.sandbox/
// sandbox.YYYY-MM-DD.log), same method as analyze-contribution-sessions.mjs
// applied to Claude Code JSONL: group timestamped command START/SUCCESS
// events into active bursts (15-min idle gap threshold), sum burst
// durations. Only counts lines that reference "saltbasin-website" (the
// sandbox log covers all of Codex's activity on the machine, not just
// this project) to avoid attributing time spent on other projects.

import fs from 'fs';

const FILES = [
  'C:\\Users\\mbets\\.codex\\.sandbox\\sandbox.2026-07-04.log',
  'C:\\Users\\mbets\\.codex\\.sandbox\\sandbox.2026-07-05.log',
  'C:\\Users\\mbets\\.codex\\.sandbox\\sandbox.2026-07-06.log',
  'C:\\Users\\mbets\\.codex\\.sandbox\\sandbox.2026-07-07.log',
];
const IDLE_GAP_MIN = 15;

function parseTimestamp(line) {
  const m = line.match(/^\[(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2}:\d{2})?/);
  if (!m) return null;
  const [, date, time, tz] = m;
  const iso = `${date}T${time}${tz || 'Z'}`;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

let allEvents = [];
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let fileEvents = [];
  for (const line of lines) {
    if (!line.includes('saltbasin-website')) continue;
    const t = parseTimestamp(line);
    if (t != null) fileEvents.push(t);
  }
  console.log(f.split('\\').pop(), '-> saltbasin-referencing timestamped lines:', fileEvents.length);
  allEvents = allEvents.concat(fileEvents);
}

allEvents.sort((a, b) => a - b);
if (allEvents.length === 0) {
  console.log('No saltbasin-website activity found in Codex sandbox logs.');
  process.exit(0);
}

const gapMs = IDLE_GAP_MIN * 60000;
const bursts = [];
let bs = allEvents[0], prev = allEvents[0];
for (let i = 1; i < allEvents.length; i++) {
  if (allEvents[i] - prev > gapMs) {
    bursts.push({ start: bs, end: prev });
    bs = allEvents[i];
  }
  prev = allEvents[i];
}
bursts.push({ start: bs, end: prev });

const activeMs = bursts.reduce((s, b) => s + (b.end - b.start), 0);
console.log('\n=== Bursts ===');
for (const b of bursts) {
  console.log(new Date(b.start).toISOString(), '->', new Date(b.end).toISOString(), `(${Math.round((b.end - b.start) / 60000)} min)`);
}
console.log('\nTotal active hours (15-min gap):', Math.round((activeMs / 3600000) * 100) / 100);
console.log('Total events:', allEvents.length);
console.log('Date range:', new Date(allEvents[0]).toISOString(), '->', new Date(allEvents[allEvents.length - 1]).toISOString());
