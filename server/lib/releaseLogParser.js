// Pure parsers for release-loop documents (no DB, no filesystem) so they can
// be tested directly. The conventions they read are documented in
// docs/changes/release-intelligence.md ("Document conventions").
//
// Nothing is guessed: a field the document does not state comes back null,
// and anything the parser could not interpret is returned in `warnings` so the
// importer can surface it.

export const OUTPUT_KINDS = ['release_log', 'test_result', 'triage', 'reconciliation', 'change_spec', 'training_spec'];

const clean = (s) => String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

// ── Markdown helpers ────────────────────────────────────────────────────────

/** All pipe tables: [{ heading, headers (lowercased), rows: [{header: cell}] }] */
export function parseTables(text) {
  const lines = String(text).split(/\r?\n/);
  const tables = [];
  let heading = '';
  for (let i = 0; i < lines.length; i += 1) {
    const h = /^#{1,6}\s+(.*)$/.exec(lines[i]);
    if (h) { heading = clean(h[1]); continue; }
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || '')) continue;
    const split = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => clean(c.replace(/\\\|/g, '|')));
    const headers = split(lines[i]).map((c) => c.toLowerCase());
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) {
      const cells = split(lines[j]);
      const row = {};
      headers.forEach((hd, k) => { row[hd] = cells[k] ?? ''; });
      rows.push(row);
      j += 1;
    }
    tables.push({ heading, headers, rows });
    i = j - 1;
  }
  return tables;
}

/** "Key: value" header lines in the first `limit` lines (bold/backticks stripped). */
export function parseHeaderFields(text, limit = 60) {
  const fields = {};
  for (const line of String(text).split(/\r?\n/).slice(0, limit)) {
    const m = /^\s*(?:[-*]\s+)?\**([A-Za-z][A-Za-z ]{1,30}?)\**\s*:\s*\**\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    if (!(key in fields)) fields[key] = clean(m[2]);
  }
  return fields;
}

/** "Version 2 · 2026-10-02" (first 20 lines) -> { version, date } */
export function parseVersionLine(text) {
  for (const line of String(text).split(/\r?\n/).slice(0, 20)) {
    const m = /^\W*version\s+v?([\w.]+)\s*(?:[·|,\-—–]\s*(\d{4}-\d{2}-\d{2}))?/i.exec(clean(line));
    if (m) return { version: m[1], date: m[2] || null };
  }
  return { version: null, date: null };
}

function section(text, headingRe) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let on = false;
  let level = 0;
  for (const line of lines) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      if (on && h[1].length <= level) break;
      if (!on && headingRe.test(clean(h[2]))) { on = true; level = h[1].length; continue; }
    }
    if (on) out.push(line);
  }
  return out.join('\n');
}

const SPEC_REF = /docs\/(?:changes|training)\/[\w.\-/]+\.md/g;

/**
 * Parse the "Traces to" section of a spec.
 * Returns [{ kind: 'spec', ref, version }] and [{ kind: 'commit', ref }].
 * A version is read from a "(v2)" / "v2" / "version 2" that follows the path.
 */
export function parseTraces(text) {
  const body = section(text, /^traces to\b/i);
  const traces = [];
  for (const line of body.split(/\r?\n/)) {
    const cleaned = line.replace(/`/g, '');
    for (const m of cleaned.matchAll(new RegExp(`(${SPEC_REF.source})\\s*(?:\\(|,|:|-|—|–)?\\s*(?:version\\s+|v)?(\\d+(?:\\.\\d+)*)?`, 'g'))) {
      traces.push({ kind: 'spec', ref: m[1], version: m[2] || null });
    }
    for (const m of cleaned.matchAll(/\b([0-9a-f]{7,40})\b/g)) {
      if (/\d/.test(m[1]) && /[a-f]/.test(m[1])) traces.push({ kind: 'commit', ref: m[1], version: null });
    }
  }
  const seen = new Set();
  return traces.filter((t) => { const k = `${t.kind}:${t.ref}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

// ── Classification by path ──────────────────────────────────────────────────

/**
 * Work out what a document is from its repo-relative path and the configured
 * log locations. Returns { kind, featureKey, roundNo } or null.
 */
export function classifyPath(path, locations) {
  const p = String(path).replace(/\\/g, '/').replace(/^\.\//, '');
  const base = p.split('/').pop();
  if (!/\.md$/i.test(p) || /^readme\.md$/i.test(base)) return null;
  const stem = base.replace(/\.md$/i, '');
  if (p.startsWith(locations.releaseLog)) return { kind: 'release_log', featureKey: null, roundNo: null };
  if (p.startsWith(locations.testResult)) {
    const rest = p.slice(locations.testResult.length).split('/');
    const rm = /^round-(\d+)$/i.exec(stem);
    return { kind: 'test_result', featureKey: rest.length > 1 ? rest[0] : null, roundNo: rm ? Number(rm[1]) : null };
  }
  if (p.startsWith(locations.triage)) {
    const rec = /^(.*?)-(?:build|fix)(?:-r\d+)?-reconciliation$/i.exec(stem);
    if (rec) return { kind: 'reconciliation', featureKey: rec[1], roundNo: null };
    const t = /^(.*?)-round-(\d+)$/i.exec(stem);
    return { kind: 'triage', featureKey: t ? t[1] : null, roundNo: t ? Number(t[2]) : null };
  }
  if (p.startsWith(locations.changeSpec)) return { kind: 'change_spec', featureKey: stem, roundNo: null };
  if (p.startsWith(locations.trainingSpec)) return { kind: 'training_spec', featureKey: stem, roundNo: null };
  return null;
}

// ── State / class mapping ───────────────────────────────────────────────────

export function inferRunState(text, allowed) {
  const t = String(text || '').toLowerCase();
  let state = 'failed';
  if (/usage limit|limit reached|hit (?:your|the) limit/.test(t)) state = 'interrupted';
  else if (/refus|denied|reject|declin/.test(t)) state = 'refused';
  else if (/partial/.test(t)) state = 'partial';
  else if (/interrupt|stopped by the user|cancel/.test(t)) state = 'interrupted';
  return allowed.includes(state) ? state : 'failed';
}

const RESOLVED_RE = /\b(resolved|reconciled|fixed|verified|closed)\b/i;
export function dispositionFromStatus(status) {
  const s = clean(status);
  if (!s) return 'open';
  if (/\b(unresolved|not (?:yet )?(?:resolved|fixed)|pending|open|held)\b/i.test(s)) return 'open';
  return RESOLVED_RE.test(s) ? 'reconciled' : 'open';
}

export function normalizeClass(value, allowed) {
  const v = clean(value).toLowerCase().replace(/[\s-]+/g, '_');
  return v && allowed.includes(v) ? v : 'unclassified';
}

const num = (v) => { const m = /\d+/.exec(String(v ?? '')); return m ? Number(m[0]) : null; };
const passWord = (v) => { const s = clean(v).toLowerCase(); if (/^(pass|passed|ok|yes|true)\b/.test(s)) return true; if (/^(fail|failed|no|false|not passed)\b/.test(s)) return false; return null; };

function col(row, ...names) {
  for (const n of names) { for (const k of Object.keys(row)) if (k === n || k.startsWith(n)) return row[k]; }
  return '';
}

// ── Document parsers ────────────────────────────────────────────────────────

function parseReleaseLog(text, ctx) {
  const warnings = [];
  const fields = parseHeaderFields(text);
  const titleMatch = /^#\s+(.*)$/m.exec(text);
  let releaseKey = fields.release || null;
  const fileStem = ctx.path.split('/').pop().replace(/\.md$/i, '');
  if (!releaseKey) { releaseKey = fileStem; warnings.push(`No "Release:" header; using the file name "${fileStem}" as the release key`); }
  const dm = /^(\d{4}-\d{2}-\d{2})/.exec(fields.date || '') || /^(\d{4}-\d{2}-\d{2})/.exec(releaseKey);
  const date = dm ? dm[1] : null;
  if (!date) warnings.push('No release date found (add "Date: YYYY-MM-DD")');

  const features = []; const rounds = []; const fixes = []; const failedRuns = [];
  for (const t of parseTables(text)) {
    const h = t.headers;
    const has = (re) => h.some((x) => re.test(x));
    if (has(/^feature/) && has(/^round/) && (has(/^commit/) || has(/^steps/) || has(/^report/))) {
      for (const r of t.rows) {
        const feature = clean(col(r, 'feature')); const roundNo = num(col(r, 'round'));
        if (!feature || roundNo == null) { warnings.push(`Rounds table: skipped a row without a feature and round number (${JSON.stringify(r).slice(0, 80)})`); continue; }
        const sp = num(col(r, 'steps passed')); let st = num(col(r, 'steps total'));
        const combined = /(\d+)\s*\/\s*(\d+)/.exec(col(r, 'steps'));
        rounds.push({ featureKey: feature, roundNo, commitSha: clean(col(r, 'commit')) || null, testedOn: clean(col(r, 'date', 'tested')) || null, passed: passWord(col(r, 'result', 'status')), stepsPassed: combined ? Number(combined[1]) : sp, stepsTotal: combined ? Number(combined[2]) : st, reportPath: clean(col(r, 'report')) || null });
      }
    } else if (has(/^feature/) && has(/^(result|final|status)/) && !has(/^round$/) && !has(/^state$/)) {
      for (const r of t.rows) {
        const feature = clean(col(r, 'feature'));
        if (!feature) continue;
        features.push({
          featureKey: feature, name: clean(col(r, 'name')) || null,
          finalStatus: clean(col(r, 'result', 'final', 'status')).toLowerCase() || null,
          declaredRounds: num(col(r, 'rounds')),
          declaredChangeSpecVersion: clean(col(r, 'change spec version', 'change spec v')) || null,
          declaredTrainingSpecVersion: clean(col(r, 'training spec version', 'training spec v')) || null,
        });
      }
    } else if ((has(/^bug/) || has(/^fix/)) && has(/^(summary|what|fix)/)) {
      for (const r of t.rows) {
        const bug = clean(col(r, 'bug', 'id', 'fix'));
        if (!bug) continue;
        fixes.push({ featureKey: clean(col(r, 'feature')) || null, roundNo: num(col(r, 'round')), bugId: bug, summary: clean(col(r, 'summary', 'what', 'fix')), files: clean(col(r, 'files')).split(/[,;]\s*/).filter(Boolean) });
      }
    } else if (has(/^state$/) && has(/failed|description|label|what/)) {
      for (const r of t.rows) {
        const description = clean(col(r, 'what failed', 'description', 'failed', 'label'));
        if (!description) continue;
        failedRuns.push({
          featureKey: clean(col(r, 'feature')) || null, runKind: clean(col(r, 'kind', 'type')) || 'command', role: clean(col(r, 'role')) || null,
          label: clean(col(r, 'label')) || null, stateText: clean(col(r, 'state')), classText: clean(col(r, 'class')),
          description, stateLeft: clean(col(r, 'state left', 'left')) || null, roundNo: num(col(r, 'round')), statusText: clean(col(r, 'status', 'disposition')),
        });
      }
    }
  }
  if (!features.length) warnings.push('No features table found (needs a "Feature" column and a "Result" column)');
  return { kind: 'release_log', releaseKey, name: titleMatch ? clean(titleMatch[1]) : null, date, features, rounds, fixes, failedRuns, warnings };
}

function parseTestResult(text, ctx) {
  const warnings = [];
  const fields = parseHeaderFields(text);
  const featureKey = clean(fields.feature || '') || ctx.featureKey;
  const roundNo = fields.round != null ? num(fields.round) : ctx.roundNo;
  if (!featureKey) warnings.push('No feature (add "Feature:" or place the file under docs/test-results/<feature>/)');
  if (roundNo == null) warnings.push('No round number (add "Round:" or name the file round-<n>.md)');
  const tables = parseTables(text);
  let stepsPassed = null; let stepsTotal = null;
  for (const t of tables) {
    const rc = t.headers.find((h) => /^(result|pass\/fail|status)$/.test(h));
    if (!rc || !t.headers.some((h) => /^(step|journey|#|expected)/.test(h))) continue;
    const verdicts = t.rows.map((r) => passWord(r[rc])).filter((v) => v != null);
    if (!verdicts.length) continue;
    stepsTotal = (stepsTotal || 0) + verdicts.length;
    stepsPassed = (stepsPassed || 0) + verdicts.filter(Boolean).length;
  }
  const declared = /(\d+)\s*\/\s*(\d+)/.exec(fields.steps || '');
  if (declared) { stepsPassed = Number(declared[1]); stepsTotal = Number(declared[2]); }
  let passed = fields.result ? passWord(fields.result) : null;
  if (passed == null && stepsTotal) passed = stepsPassed === stepsTotal;
  if (passed == null) warnings.push('No result: add "Result: PASS|FAIL" or a step table with a Result column');
  const commit = /\b[0-9a-f]{7,40}\b/.exec(fields['commit tested'] || fields.commit || '');
  return {
    kind: 'test_result', featureKey, roundNo, releaseKey: fields.release || null,
    round: featureKey && roundNo != null ? {
      featureKey, roundNo, commitSha: commit ? commit[0] : null, testedOn: (/\d{4}-\d{2}-\d{2}/.exec(fields.date || '') || [null])[0],
      passed, stepsPassed, stepsTotal, consoleErrors: fields['console errors'] != null ? num(fields['console errors']) : null,
      failedRequests: fields['failed requests'] != null ? num(fields['failed requests']) : null, reportPath: ctx.path,
    } : null,
    warnings,
  };
}

function parseTriage(text, ctx) {
  const warnings = [];
  const fields = parseHeaderFields(text);
  const featureKey = clean(fields.feature || '') || ctx.featureKey;
  const items = [];
  for (const t of parseTables(text)) {
    if (!t.headers.some((h) => /^(id|item)$/.test(h)) || !t.headers.some((h) => /^class/.test(h))) continue;
    for (const r of t.rows) {
      const id = clean(col(r, 'id', 'item'));
      if (!id) continue;
      items.push({ id, step: clean(col(r, 'journey step', 'step')), observed: clean(col(r, 'observed vs expected', 'observed')), rootCause: clean(col(r, 'root cause')), classText: clean(col(r, 'class')), files: clean(col(r, 'files')), fix: clean(col(r, 'proposed fix')), firstSeen: num(col(r, 'first seen')) });
    }
  }
  // Section form: "### <id>" followed by "- **field:** value" bullets.
  const parts = String(text).split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const [head, ...rest] = part.split(/\r?\n/);
    const f = parseHeaderFields(rest.join('\n'), 40);
    if (!f.class) continue;
    items.push({ id: clean(head), step: f['journey step'] || f.step || '', observed: f['observed vs expected'] || f.observed || '', rootCause: f['root cause'] || '', classText: f.class, files: f.files || '', fix: f['proposed fix'] || '', firstSeen: num(f['first seen round'] || f['first seen']) });
  }
  if (!items.length) warnings.push('No triage items found (table with "id" and "class" columns, or "### <id>" sections with a "class:" line)');
  return { kind: 'triage', featureKey, roundNo: ctx.roundNo, releaseKey: fields.release || null, items, warnings };
}

function parseReconciliation(text, ctx) {
  const warnings = [];
  const fields = parseHeaderFields(text);
  const featureKey = clean(fields.feature || '') || ctx.featureKey;
  const items = [];
  for (const t of parseTables(text)) {
    if (!t.headers.some((h) => /^status/.test(h))) continue;
    for (const r of t.rows) {
      const description = clean(col(r, 'reported', 'what failed', 'failure', 'item', 'step'));
      if (!description) continue;
      items.push({ description, classText: clean(col(r, 'kind', 'class')), statusText: clean(col(r, 'status')), stateLeft: clean(col(r, 'state it left', 'state left')) || null, evidence: clean(col(r, 'evidence', 'reconciled how')) });
    }
  }
  if (!items.length) warnings.push('No reconciliation items found (table with a "Status" column)');
  return { kind: 'reconciliation', featureKey, releaseKey: fields.release || null, items, warnings };
}

function parseSpec(text, ctx) {
  const warnings = [];
  const { version, date } = parseVersionLine(text);
  if (!version) warnings.push('No "Version N · YYYY-MM-DD" line near the top');
  const titleMatch = /^#\s+(.*)$/m.exec(text);
  const fields = parseHeaderFields(text);
  const traces = parseTraces(text);
  if (ctx.kind === 'change_spec' && !/^#{1,6}\s+traces to\b/im.test(text)) warnings.push('No "Traces to" section');
  // A failed-commands style table inside a change doc becomes failed runs.
  const failedRuns = [];
  if (ctx.kind === 'change_spec') {
    for (const t of parseTables(text)) {
      if (!t.headers.some((h) => /what failed/.test(h)) || !t.headers.some((h) => /state it left/.test(h))) continue;
      for (const r of t.rows) {
        const description = clean(col(r, 'what failed'));
        if (!description) continue;
        failedRuns.push({ featureKey: null, runKind: 'command', role: null, label: clean(col(r, '#')) || null, stateText: description + ' ' + clean(col(r, 'state it left')), classText: '', description, stateLeft: clean(col(r, 'state it left')) || null, roundNo: null, statusText: clean(col(r, 'status')), reconciledHow: clean(col(r, 'reconciled how')) });
      }
    }
  }
  return { kind: ctx.kind, featureKey: ctx.featureKey, releaseKey: fields.release || null, specVersion: version, docDate: date, title: titleMatch ? clean(titleMatch[1]) : null, traces, failedRuns, warnings };
}

/**
 * Parse one document. ctx = { path, locations }. Returns the parsed structure
 * (with `kind`, `warnings`) or { kind: null, warnings } when the path is not a
 * release-loop output.
 */
export function parseDocument(path, text, locations) {
  const cls = classifyPath(path, locations);
  if (!cls) return { kind: null, warnings: [`${path} is not under a configured release-loop folder or is not a .md file`] };
  const ctx = { path, ...cls };
  switch (cls.kind) {
    case 'release_log': return parseReleaseLog(text, ctx);
    case 'test_result': return parseTestResult(text, ctx);
    case 'triage': return parseTriage(text, ctx);
    case 'reconciliation': return parseReconciliation(text, ctx);
    default: return parseSpec(text, ctx);
  }
}

// ── Tracker snapshot (scripts/release-tracker-sync.mjs output) ─────────────

const ms = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? t : null; };

/**
 * Normalise a release-tracker snapshot. Tokens and elapsed minutes are null
 * when the snapshot did not record them (never zero).
 */
export function parseTrackerSnapshot(snapshot) {
  const warnings = [];
  if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.agents)) {
    return { agents: [], features: [], bugs: [], warnings: ['Not a tracker snapshot: expected an object with an "agents" list'] };
  }
  const LIMIT_RE = /usage limit|limit reached|hit (?:your|the) limit|rate.?limit|out of (?:usage|credits)/i;
  const agents = snapshot.agents.map((a) => {
    const t = a.tokens && typeof a.tokens === 'object' ? a.tokens : null;
    const recorded = !!t && ['input', 'cacheWrite', 'cacheRead', 'output'].some((k) => Number.isFinite(Number(t[k])) && Number(t[k]) > 0);
    const started = ms(a.startedAt); const ended = ms(a.lastActivityAt);
    return {
      label: a.label || a.id || 'unnamed agent', role: a.role || null, featureKey: a.feature || null, roundNo: Number.isFinite(Number(a.round)) ? Number(a.round) : null,
      status: a.status || null,
      tokens: recorded ? { input: Number(t.input) || 0, cacheWrite: Number(t.cacheWrite) || 0, cacheRead: Number(t.cacheRead) || 0, output: Number(t.output) || 0 } : null,
      startedAt: started, endedAt: ended, elapsedMinutes: started != null && ended != null && ended >= started ? Math.round(((ended - started) / 60000) * 10) / 10 : null,
      failures: Array.isArray(a.failures) ? a.failures.map(String) : [],
      // An agent that died at a usage limit is recorded as such (state 'interrupted'), not as an ordinary failure.
      limitHit: [a.summary, a.activity, ...(Array.isArray(a.failures) ? a.failures : []), ...(Array.isArray(a.signals) ? a.signals.map((x) => x?.detail) : [])]
        .some((x) => typeof x === 'string' && LIMIT_RE.test(x)),
    };
  });
  const features = (snapshot.features || []).map((f) => ({
    featureKey: f.key, trackerStatus: f.status || null, openBugs: Number.isFinite(Number(f.openBugs)) ? Number(f.openBugs) : null,
    lastResult: f.lastResult && f.lastResult.round != null ? { roundNo: Number(f.lastResult.round), passed: typeof f.lastResult.passed === 'boolean' ? f.lastResult.passed : null, stepsPassed: f.lastResult.stepsPassed ?? null, stepsTotal: f.lastResult.stepsTotal ?? null, report: f.lastResult.report || null } : null,
  })).filter((f) => f.featureKey);
  const bugs = (snapshot.bugs || []).map((b) => ({
    id: String(b.id), featureKey: b.feature || null, status: b.status || null, classText: b.class || '', step: b.step || '', rootCause: b.rootCause || '',
    firstRound: b.firstRound ?? null, history: Array.isArray(b.history) ? b.history : [], files: Array.isArray(b.files) ? b.files : [],
  }));
  return { agents, features, bugs, runId: snapshot.runId || null, syncedAt: snapshot.syncedAt || null, warnings };
}
