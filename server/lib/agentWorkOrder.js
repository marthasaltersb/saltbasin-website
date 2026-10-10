// Work orders for platform agent sessions (docs/changes/platform-agent-runner.md, "Work orders").
// Pure functions, no database: the website validates a work order when it is written, the worker checks
// every file edit against it BEFORE the edit happens, and checks the branch diff AFTER the run. Both the
// worker and the platform call the same functions, so "allowed" means the same thing everywhere.
//
// A session is capped by the change it may make, not by spend: items (ids), one intent per item, the files
// per item, a size per item (S/M/L = a ceiling on changed lines), forbidden paths and the baseline step ids
// that must pass afterwards (done_when).

export const SIZES = ['S', 'M', 'L'];
export const DEFAULT_SIZE_LIMITS = Object.freeze({ S: 40, M: 150, L: 400 });

/** Always forbidden unless an item is explicitly about them (item.allowForbidden = [patterns]). */
export const DEFAULT_FORBIDDEN = Object.freeze([
  'docs/training/**',
  'docs/spec-amendments/**',
  'server/data/releaseLoop/definition.json',
  'package-lock.json',
  'package.json',
  'server/data/applicationPackages/**',
  '.git/**',
  '.claude/**',
]);

const err = (m, status = 400, extra) => Object.assign(new Error(m), { status }, extra || {});

/** Repo-relative, forward slashes, no leading ./ ; throws for absolute paths and traversal. */
export function normalizePath(p) {
  const s = String(p ?? '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
  if (!s) throw err('A file path is empty');
  if (s.startsWith('/') || /^[a-zA-Z]:/.test(s)) throw err(`"${s}" must be a path inside the repository, not an absolute path`);
  if (s.split('/').includes('..')) throw err(`"${s}" may not leave the repository`);
  return s;
}

/** Glob with ** (any depth) and * (within one segment). Anything else is literal. */
export function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { out += '.*'; i++; if (glob[i + 1] === '/') i++; } else out += '[^/]*';
    } else out += c.replace(/[.+^${}()|[\]\\?]/g, '\\$&');
  }
  return new RegExp(`^${out}$`);
}
export const matchesAny = (file, patterns) => (patterns || []).some((g) => globToRegExp(g).test(file));

export function sizeLimitsFrom(settings) {
  const l = { ...DEFAULT_SIZE_LIMITS, ...(settings?.sizeLimits || {}) };
  return { S: Number(l.S), M: Number(l.M), L: Number(l.L) };
}
export function forbiddenFrom(settings) {
  return [...new Set([...DEFAULT_FORBIDDEN, ...(settings?.forbiddenPatterns || [])])];
}

/** Validates and normalizes a work order written by a person or by triage. Returns the clean object. */
export function validateWorkOrder(input, settings) {
  if (!input || typeof input !== 'object') throw err('A work order is required');
  const items = Array.isArray(input.items) ? input.items : [];
  if (!items.length) throw err('A work order needs at least one item (a bug, amendment or enhancement id)');
  const seen = new Set();
  const clean = items.map((it, i) => {
    const key = String(it?.key ?? '').trim();
    if (!key) throw err(`Item ${i + 1} needs an id (the bug, amendment or enhancement it addresses)`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(key)) throw err(`Item id "${key}" may use letters, digits, ".", "_" and "-" only`);
    if (seen.has(key)) throw err(`Item id "${key}" is listed twice`);
    seen.add(key);
    const intent = String(it?.intent ?? '').trim();
    if (!intent) throw err(`Item ${key} needs its intent: the one change intended, in a sentence`);
    const files = (Array.isArray(it?.files) ? it.files : String(it?.files ?? '').split(/[\n,]/)).map((f) => String(f).trim()).filter(Boolean).map(normalizePath);
    if (!files.length) throw err(`Item ${key} needs at least one file it may edit`);
    const size = String(it?.size ?? '').trim().toUpperCase();
    if (!SIZES.includes(size)) throw err(`Item ${key} needs a size of S, M or L`);
    const doneWhen = (Array.isArray(it?.doneWhen) ? it.doneWhen : String(it?.doneWhen ?? '').split(/[\s,]+/)).map((s) => String(s).trim()).filter(Boolean);
    const allowForbidden = (Array.isArray(it?.allowForbidden) ? it.allowForbidden : []).map(normalizePath);
    return { key, intent, files, size, doneWhen, allowForbidden };
  });
  return { version: 1, items: clean, forbidden: forbiddenFrom(settings), sizeLimits: sizeLimitsFrom(settings), approvals: Array.isArray(input.approvals) ? input.approvals : [] };
}

/** The item whose file list contains this file (first match), or null. */
export function itemForFile(workOrder, file) {
  return (workOrder.items || []).find((it) => matchesAny(file, it.files)) || null;
}
function forbiddenFor(workOrder, file) {
  const hit = (workOrder.forbidden || []).find((g) => globToRegExp(g).test(file));
  if (!hit) return null;
  // An item that is explicitly about this path may touch it.
  const allowed = (workOrder.items || []).some((it) => matchesAny(file, it.allowForbidden || []));
  return allowed ? null : hit;
}

/**
 * Pre-edit check. `file` may be absolute (inside `cwd`) or relative. Returns
 * { allowed:true, item } or { allowed:false, code, reason } — the reason is shown to the agent so it can
 * file a scope request instead of working around the refusal.
 */
export function checkEdit(workOrder, file, { cwd } = {}) {
  let rel;
  try {
    let f = String(file ?? '').replace(/\\/g, '/');
    if (cwd) { const base = `${cwd.replace(/\\/g, '/').replace(/\/$/, '')}/`; if (f.startsWith(base)) f = f.slice(base.length); }
    rel = normalizePath(f);
  } catch (e) { return { allowed: false, code: 'OUTSIDE_REPOSITORY', reason: e.message }; }
  if (rel.startsWith('.agent-scope-requests/')) return { allowed: true, item: null, scopeRequestFile: true };
  const forb = forbiddenFor(workOrder, rel);
  if (forb) return { allowed: false, code: 'FORBIDDEN', reason: `${rel} is forbidden by this work order (${forb}). Training specs, baselines, amendments, the process definition, lockfiles and dependency lists are changed only by their own governed paths. File a scope request if the item is about this file.` };
  const item = itemForFile(workOrder, rel);
  if (!item) return { allowed: false, code: 'NOT_IN_WORK_ORDER', reason: `${rel} is not listed in this work order. The files you may edit: ${(workOrder.items || []).flatMap((i) => i.files).join(', ')}. If the root cause is in ${rel}, file a scope request (the file, why, which item) instead of working around this.` };
  return { allowed: true, item };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Item ids named by a commit message, e.g. "seed-catalog-B1: wrap the label". */
export function commitNamesItem(message, workOrder) {
  const m = String(message ?? '');
  return (workOrder.items || []).filter((it) => new RegExp(`(^|[^A-Za-z0-9._-])${escapeRe(it.key)}($|[^A-Za-z0-9._-])`).test(m)).map((it) => it.key);
}

/**
 * Post-run branch check (what the integrator does before a merge). `diff` = { files:[{file, added, deleted}],
 * commits:[{sha, message}] }. Returns { ok, violations:[{code,detail,file?,item?}], perItem:[{key,size,limit,changed}] }.
 * Any violation means the run ends as SCOPE_EXCEEDED and is not merged.
 */
export function checkDiff(workOrder, diff) {
  const violations = [];
  const changedBy = new Map((workOrder.items || []).map((it) => [it.key, 0]));
  for (const f of diff?.files || []) {
    let rel;
    try { rel = normalizePath(f.file); } catch (e) { violations.push({ code: 'OUTSIDE_REPOSITORY', file: String(f.file), detail: e.message }); continue; }
    if (rel.startsWith('.agent-scope-requests/')) continue;
    const forb = forbiddenFor(workOrder, rel);
    if (forb) { violations.push({ code: 'FORBIDDEN', file: rel, detail: `${rel} is forbidden (${forb})` }); continue; }
    const item = itemForFile(workOrder, rel);
    if (!item) { violations.push({ code: 'NOT_IN_WORK_ORDER', file: rel, detail: `${rel} changed but is not listed in the work order` }); continue; }
    changedBy.set(item.key, changedBy.get(item.key) + (Number(f.added) || 0) + (Number(f.deleted) || 0));
  }
  const perItem = (workOrder.items || []).map((it) => {
    const limit = Number(workOrder.sizeLimits?.[it.size] ?? DEFAULT_SIZE_LIMITS[it.size]);
    const changed = changedBy.get(it.key) || 0;
    if (changed > limit) violations.push({ code: 'OVER_SIZE', item: it.key, detail: `${it.key} changed ${changed} lines; size ${it.size} allows ${limit}` });
    return { key: it.key, size: it.size, limit, changed };
  });
  for (const c of diff?.commits || []) {
    if (!commitNamesItem(c.message, workOrder).length) violations.push({ code: 'COMMIT_UNNAMED', detail: `commit ${String(c.sha || '').slice(0, 7)} does not name a work-order item: "${String(c.message || '').split('\n')[0].slice(0, 80)}"` });
  }
  return { ok: violations.length === 0, violations, perItem };
}

/** Widening a work order by an approved scope request: adds the file to the item (never silently). */
export function widenWorkOrder(workOrder, { file, item, approvedBy, note, at }) {
  const rel = normalizePath(file);
  const it = (workOrder.items || []).find((x) => x.key === item);
  if (!it) throw err(`The work order has no item "${item}"`);
  const next = JSON.parse(JSON.stringify(workOrder));
  const target = next.items.find((x) => x.key === item);
  if (!target.files.includes(rel)) target.files.push(rel);
  next.approvals = [...(next.approvals || []), { file: rel, item, approvedBy, note: note || null, at: at ?? Date.now() }];
  return next;
}

/** Files only the owner may add (dependencies, other features' files); everything else the triage agent decides. */
export function scopeNeedsOwner(file, { ownFeatureFiles = [] } = {}) {
  const rel = normalizePath(file);
  if (/(^|\/)(package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(rel)) return { owner: true, reason: 'It adds or changes a dependency.' };
  if (ownFeatureFiles.length && !matchesAny(rel, ownFeatureFiles)) return { owner: true, reason: 'It belongs to another feature.' };
  return { owner: false, reason: null };
}
