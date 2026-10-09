#!/usr/bin/env node
// Pushes a tracker snapshot (+ history + updates) to the platform's live release tracker.
//
//   PLATFORM_URL=https://example.test RELEASE_TRACKER_INGEST_TOKEN=rti_... node scripts/release-tracker-push.mjs snapshot.json
//
// Also imported by scripts/release-tracker-sync.mjs, which calls pushToPlatform() after writing the snapshot
// when both variables are set. A failed push is LOGGED to stderr and returned as { ok:false } (the sync exits
// non-zero); it is never hidden. The token is read from the environment only, never from a committed file.
import fs from 'node:fs';

export async function pushToPlatform(snapshot, { url = process.env.PLATFORM_URL, token = process.env.RELEASE_TRACKER_INGEST_TOKEN, root = new URL('../docs/release-log/', import.meta.url) } = {}) {
  if (!url || !token) return { ok: null, skipped: 'PLATFORM_URL or RELEASE_TRACKER_INGEST_TOKEN not set' };
  const read = (f) => { try { return JSON.parse(fs.readFileSync(new URL(f, root), 'utf8')); } catch { return undefined; } };
  const body = { snapshot, history: read('history.json'), updates: read('updates.json') };
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/api/release-tracker/snapshots`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    if (!res.ok) { console.error(`[release-tracker] push FAILED: ${res.status} ${text.slice(0, 300)}`); return { ok: false, status: res.status, detail: text.slice(0, 300) }; }
    console.error(`[release-tracker] pushed: ${text.slice(0, 160)}`);
    return { ok: true, status: res.status };
  } catch (e) {
    console.error(`[release-tracker] push FAILED: ${e.message}`);
    return { ok: false, detail: e.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) { console.error('usage: release-tracker-push.mjs <snapshot.json>'); process.exit(2); }
  const r = await pushToPlatform(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (r.ok === null) { console.error(`[release-tracker] not pushed: ${r.skipped}`); process.exit(2); }
  process.exit(r.ok ? 0 : 3);
}
