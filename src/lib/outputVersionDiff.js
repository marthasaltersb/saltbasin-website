// Tracked-changes diff between two versions of an output (2026-10-02, release
// output-version-history). Pure; safe on server and client. Same idea as
// shareSnapshotDiff.js (decide what counts as a change, once, in one place),
// applied to document blocks instead of chart rows.
//
// A version is a list of "items": { type, text } where type is one of the
// document_blocks types or 'header'. diffItems() aligns two item lists with a
// longest-common-subsequence over (type + normalized text) and returns an
// ordered list of
//   { change: 'same' | 'added' | 'removed' | 'changed', type, before, after, parts }
// where, for 'changed', `parts` is a word-level diff [{ op: 'same'|'add'|'del', text }]
// so the screen can show inserted and deleted words inline like tracked changes.

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Plain text of one document_blocks block (what a reader sees). */
export function blockText(block) {
  if (!block) return '';
  if (block.type === 'role') return norm(`${block.title || ''}${block.dates ? `  (${block.dates})` : ''}`);
  if (block.type === 'table') {
    return norm((block.rows || []).map((cells) => (cells || []).map((lines) => (lines || []).join(' ')).join(' | ')).join(' / '));
  }
  if (block.type === 'figure') return '';
  return norm(block.text);
}

/** Turns a version's header + blocks into the item list the diff works on. */
export function toDiffItems(version) {
  const items = [];
  const h = version?.header || {};
  if (norm(h.name)) items.push({ type: 'header', text: norm(h.name), field: 'Name' });
  if (norm(h.headline)) items.push({ type: 'header', text: norm(h.headline), field: 'Headline' });
  if (norm(h.contact)) items.push({ type: 'header', text: norm(h.contact), field: 'Contact' });
  for (const b of version?.blocks || []) {
    if (b?.type === 'figure') continue;
    const text = blockText(b);
    if (text) items.push({ type: b.type, text });
  }
  return items;
}

function tokenize(text) {
  return String(text ?? '').match(/\s+|[^\s]+/g) || [];
}

// Generic LCS alignment. Returns an array of ['same'|'del'|'add', aIndex, bIndex].
function lcsAlign(a, b, eq) {
  const n = a.length; const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) { out.push(['same', i, j]); i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(['del', i, -1]); i += 1; }
    else { out.push(['add', -1, j]); j += 1; }
  }
  while (i < n) { out.push(['del', i, -1]); i += 1; }
  while (j < m) { out.push(['add', -1, j]); j += 1; }
  return out;
}

/** Word-level diff of two strings: [{ op: 'same'|'add'|'del', text }], adjacent same-op parts merged. */
export function diffWords(before, after) {
  const a = tokenize(before); const b = tokenize(after);
  const parts = [];
  for (const [op, i, j] of lcsAlign(a, b, (x, y) => x === y)) {
    const text = op === 'add' ? b[j] : a[i];
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text; else parts.push({ op, text });
  }
  return parts;
}

// How alike two strings are (0..1), by shared words. Used to decide that a
// removed + added pair is really one edited block.
function similarity(x, y) {
  const a = new Set(tokenize(x).filter((t) => t.trim()));
  const b = new Set(tokenize(y).filter((t) => t.trim()));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared += 1;
  return shared / Math.max(a.size, b.size);
}

const CHANGED_THRESHOLD = 0.34;

/** Ordered diff of two item lists (see file header). */
export function diffItems(beforeItems, afterItems) {
  const aligned = lcsAlign(beforeItems, afterItems, (x, y) => x.type === y.type && x.text === y.text);
  const out = [];
  let k = 0;
  while (k < aligned.length) {
    const [op, i, j] = aligned[k];
    if (op === 'same') {
      out.push({ change: 'same', type: afterItems[j].type, field: afterItems[j].field, before: beforeItems[i].text, after: afterItems[j].text });
      k += 1; continue;
    }
    // Gather one run of consecutive removals/additions, then pair like with like.
    const dels = []; const adds = [];
    while (k < aligned.length && aligned[k][0] !== 'same') {
      if (aligned[k][0] === 'del') dels.push(beforeItems[aligned[k][1]]); else adds.push(afterItems[aligned[k][2]]);
      k += 1;
    }
    const usedAdd = new Set();
    const pairs = new Map(); // del index -> add index (kept in increasing order so document order holds)
    let floor = 0;
    for (let d = 0; d < dels.length; d += 1) {
      let best = -1; let bestScore = CHANGED_THRESHOLD;
      for (let a = floor; a < adds.length; a += 1) {
        if (usedAdd.has(a) || adds[a].type !== dels[d].type) continue;
        const s = similarity(dels[d].text, adds[a].text);
        if (s >= bestScore) { best = a; bestScore = s; }
      }
      if (best >= 0) { pairs.set(d, best); usedAdd.add(best); floor = best + 1; }
    }
    // Emit in document order: each removal (or its paired change), with
    // unpaired additions placed before the next pairing they precede.
    let nextAdd = 0;
    const flushAddsBefore = (limit) => {
      while (nextAdd < limit) {
        if (!usedAdd.has(nextAdd)) out.push({ change: 'added', type: adds[nextAdd].type, field: adds[nextAdd].field, before: null, after: adds[nextAdd].text });
        nextAdd += 1;
      }
    };
    for (let d = 0; d < dels.length; d += 1) {
      if (pairs.has(d)) {
        const a = pairs.get(d);
        flushAddsBefore(a);
        out.push({ change: 'changed', type: adds[a].type, field: adds[a].field, before: dels[d].text, after: adds[a].text, parts: diffWords(dels[d].text, adds[a].text) });
        nextAdd = a + 1;
      } else {
        out.push({ change: 'removed', type: dels[d].type, field: dels[d].field, before: dels[d].text, after: null });
      }
    }
    flushAddsBefore(adds.length);
  }
  return out;
}

/** Diff two versions ({ header, blocks }). */
export function diffVersions(before, after) {
  return diffItems(toDiffItems(before), toDiffItems(after));
}

export function countChanges(diff) {
  const c = { added: 0, removed: 0, changed: 0 };
  for (const d of diff) if (d.change !== 'same') c[d.change] += 1;
  return c;
}

/** "2 added, 1 removed, 3 changed" or "No text changes". */
export function summarizeDiff(diff) {
  const c = countChanges(diff);
  const bits = [];
  if (c.added) bits.push(`${c.added} added`);
  if (c.removed) bits.push(`${c.removed} removed`);
  if (c.changed) bits.push(`${c.changed} changed`);
  return bits.length ? bits.join(', ') : 'No text changes';
}
