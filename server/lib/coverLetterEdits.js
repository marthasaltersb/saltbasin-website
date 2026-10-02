// Iterative edit operations for the cover letter (2026-10-02).
//
// The agent never regenerates a letter. It proposes a small set of operations against the
// letter's numbered blocks (¶1..¶n, as shown in the editor). Operations are validated here
// whoever produced them (rules or LLM), applied to produce the "after" letter, and diffed
// into tracked changes the member accepts or rejects.
//
//   { op: 'replace',      paragraph: n, text }
//   { op: 'insert_after', paragraph: n, text }   // n = 0 inserts at the very top
//   { op: 'delete',       paragraph: n }
//   { op: 'move',         paragraph: n, after: m }   // rules only; m = 0 moves to the top
//
// All paragraph numbers refer to the ORIGINAL numbering before any operation in the batch.

export const MAX_OPS = 6;
export const MAX_TEXT = 1500;
export const OP_NAMES = ['replace', 'insert_after', 'delete', 'move'];

export class EditSetError extends Error {}

/** Validates an op list against a letter of `count` blocks. `allowed` optionally limits the touched paragraphs. */
export function validateOps(ops, count, { allowedParagraphs = null, allowMove = true, blocks = null } = {}) {
  if (!Array.isArray(ops) || !ops.length) throw new EditSetError('No edit operations were proposed.');
  if (ops.length > MAX_OPS) throw new EditSetError(`${ops.length} operations is more than a targeted edit (maximum ${MAX_OPS}).`);
  const touched = new Set();
  const clean = ops.map((raw, i) => {
    const where = `operation ${i + 1}`;
    if (!raw || typeof raw !== 'object') throw new EditSetError(`${where} is not an object.`);
    if (!OP_NAMES.includes(raw.op)) throw new EditSetError(`${where}: unknown operation "${raw.op}".`);
    if (raw.op === 'move' && !allowMove) throw new EditSetError(`${where}: move is not permitted here.`);
    const p = Number(raw.paragraph);
    const min = raw.op === 'insert_after' || raw.op === 'move' ? 0 : 1;
    if (!Number.isInteger(p) || p < min || p > count) throw new EditSetError(`${where}: paragraph ${raw.paragraph} does not exist (the letter has ${count}).`);
    if (allowedParagraphs && p !== 0 && !allowedParagraphs.has(p)) throw new EditSetError(`${where}: paragraph ${p} was not part of the context the model was given.`);
    const out = { op: raw.op, paragraph: p };
    if (raw.op === 'replace' || raw.op === 'insert_after') {
      const text = String(raw.text ?? '').replace(/\s+\n/g, '\n').trim();
      if (!text) throw new EditSetError(`${where}: ${raw.op} needs non-empty text.`);
      if (text.length > MAX_TEXT) throw new EditSetError(`${where}: text is ${text.length} characters (maximum ${MAX_TEXT}) — that is a rewrite, not an edit.`);
      out.text = text;
      if (typeof raw.evidence === 'string' && raw.evidence.trim()) out.evidence = raw.evidence.trim().slice(0, 200);
    }
    if (raw.op === 'replace' && blocks) {
      const type = blocks[p - 1]?.type;
      if (type && !['paragraph', 'heading', 'bullet'].includes(type)) throw new EditSetError(`${where}: paragraph ${p} is a ${type} block and cannot be edited as text.`);
    }
    if (raw.op === 'move') {
      const after = Number(raw.after);
      if (!Number.isInteger(after) || after < 0 || after > count) throw new EditSetError(`${where}: move target ${raw.after} does not exist.`);
      out.after = after;
    }
    if (raw.op !== 'insert_after') {
      if (touched.has(p) && raw.op !== 'move') throw new EditSetError(`${where}: paragraph ${p} is edited twice in one batch.`);
      touched.add(p);
    }
    return out;
  });
  return clean;
}

/** Applies validated ops. Returns the new block list plus, per resulting block, where it came from. */
export function applyOps(blocks, ops) {
  let items = blocks.map((block, i) => ({ block: { ...block }, origin: i + 1, status: 'same', before: block.text }));
  for (const op of ops) {
    if (op.op === 'replace') {
      const it = items.find((x) => x.origin === op.paragraph && x.status !== 'inserted');
      if (!it) continue;
      it.block = { ...it.block, text: op.text };
      it.status = 'changed';
      it.edited = true;
    } else if (op.op === 'delete') {
      const it = items.find((x) => x.origin === op.paragraph && x.status !== 'inserted');
      if (it) it.deleted = true;
    } else if (op.op === 'insert_after') {
      const fresh = { block: { type: 'paragraph', text: op.text }, origin: null, status: 'inserted' };
      if (op.paragraph === 0) items.unshift(fresh);
      else {
        // After the original paragraph — and after anything already inserted directly below it.
        let idx = items.findIndex((x) => x.origin === op.paragraph && x.status !== 'inserted');
        while (items[idx + 1]?.status === 'inserted') idx += 1;
        items.splice(idx + 1, 0, fresh);
      }
    } else if (op.op === 'move') {
      const from = items.findIndex((x) => x.origin === op.paragraph && x.status !== 'inserted');
      if (from < 0) continue;
      const [it] = items.splice(from, 1);
      if (op.after === 0) items.unshift(it);
      else {
        let to = items.findIndex((x) => x.origin === op.after && x.status !== 'inserted');
        if (to < 0) { items.splice(from, 0, it); continue; }
        while (items[to + 1]?.status === 'inserted') to += 1;
        items.splice(to + 1, 0, it);
      }
      it.moved = true;
      it.status = it.edited ? 'changed' : 'moved';
    }
  }
  return items;
}

/** The after-letter blocks (deleted items dropped). */
export function resultBlocks(blocks, ops) {
  return applyOps(blocks, ops).filter((x) => !x.deleted).map((x) => x.block);
}

function words(text) { return String(text || '').split(/(\s+)/).filter((w) => w !== ''); }

/** Word-level diff segments between two strings: [{t:'same'|'del'|'ins', text}] */
export function wordDiff(a, b) {
  const x = words(a); const y = words(b);
  const m = x.length; const n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const segs = [];
  const push = (t, text) => { const last = segs[segs.length - 1]; if (last && last.t === t) last.text += text; else segs.push({ t, text }); };
  let i = 0; let j = 0;
  while (i < m && j < n) {
    if (x[i] === y[j]) { push('same', x[i]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', x[i]); i++; } else { push('ins', y[j]); j++; }
  }
  while (i < m) push('del', x[i++]);
  while (j < n) push('ins', y[j++]);
  return segs;
}

/**
 * Tracked-changes view: one row per paragraph of the BEFORE letter (with its fate) plus the
 * inserted ones in place. Rows: {status:'same'|'changed'|'deleted'|'inserted'|'moved', n (original ¶, null for inserted), newPosition, before, after, segments}
 */
export function buildDiff(blocks, ops) {
  const items = applyOps(blocks, ops);
  let position = 0;
  return items.map((it) => {
    const after = it.deleted ? null : it.block.text;
    if (!it.deleted) position += 1;
    const status = it.deleted ? 'deleted' : it.status === 'same' ? 'same' : it.status;
    let segments;
    if (status === 'changed') segments = wordDiff(it.before, after);
    else if (status === 'deleted') segments = [{ t: 'del', text: it.before }];
    else if (status === 'inserted') segments = [{ t: 'ins', text: after }];
    else segments = [{ t: 'same', text: after }];
    return { status, n: it.origin, newPosition: it.deleted ? null : position, before: it.before ?? null, after, segments };
  });
}

/** A one-line human description of each op, for the turn summary. */
export function describeOps(ops) {
  return ops.map((o) => {
    if (o.op === 'replace') return `Replace ¶${o.paragraph}`;
    if (o.op === 'delete') return `Delete ¶${o.paragraph}`;
    if (o.op === 'move') return `Move ¶${o.paragraph} ${o.after === 0 ? 'to the top' : `after ¶${o.after}`}`;
    return o.paragraph === 0 ? 'Insert a new paragraph at the top' : `Insert a new paragraph after ¶${o.paragraph}`;
  });
}

/**
 * An LLM answer is accepted only if it is a targeted edit set: few ops, text bounded,
 * touching only the paragraphs it was given, and not a wholesale rewrite.
 */
export function assertTargetedEditSet(ops, blocks, allowedParagraphs) {
  const clean = validateOps(ops, blocks.length, { allowedParagraphs, allowMove: false, blocks });
  const replaced = clean.filter((o) => o.op === 'replace' || o.op === 'delete').length;
  if (blocks.length > 2 && replaced >= Math.ceil(blocks.length * 0.6)) {
    throw new EditSetError(`The proposal rewrites ${replaced} of ${blocks.length} paragraphs — that is a regenerated letter, not a targeted edit.`);
  }
  return clean;
}
