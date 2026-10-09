// Idempotent importer for release-loop outputs. Reads the docs/ logs
// (release log, test results, triage, reconciliation reports, change and
// training specs) and the tracker snapshot that
// scripts/release-tracker-sync.mjs writes, and files them into the additive
// release_* tables.
//
// Idempotent: a document whose content hash is unchanged is skipped; a changed
// one replaces only the rows it previously produced (keyed by source_path +
// source_key). A reviewer's disposition on a failed run survives re-import.
// Every problem is returned (never logged and dropped): per-document status,
// parser warnings, and errors.

import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import { loadRules } from './releaseIntelligenceConfig.js';
import { hashText } from './releaseReconcile.js';
import {
  parseDocument, parseTrackerSnapshot, dispositionFromStatus, inferRunState, normalizeClass,
} from './releaseLogParser.js';

const now = () => Date.now();

export function dateFromReleaseKey(key) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:-|$)/.exec(String(key || ''));
  return m ? m[1] : null;
}
const dateMs = (d) => Date.parse(`${d}T00:00:00Z`);

async function getRelease(key) {
  return db.prepare(`SELECT * FROM release_records WHERE release_key = $1`).get(key);
}

export async function ensureRelease(key, { name = null, date = null, source = 'imported' } = {}) {
  const existing = await getRelease(key);
  const d = date || dateFromReleaseKey(key);
  if (existing) {
    if (name && !existing.name) await db.prepare(`UPDATE release_records SET name=$1, updated_at=$2 WHERE id=$3`).run(name, now(), existing.id);
    return existing.id;
  }
  if (!d || Number.isNaN(dateMs(d))) {
    throw new Error(`Cannot create release "${key}": it needs a date (start the key with YYYY-MM-DD or give a date)`);
  }
  const row = await db.prepare(
    `INSERT INTO release_records (release_key, name, release_date, release_date_ms, source, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING id`,
  ).get(key, name, d, dateMs(d), source, now());
  return row.id;
}

/** Latest release (by date) that lists this feature, or null. */
async function releaseIdForFeature(featureKey) {
  if (!featureKey) return null;
  const row = await db.prepare(
    `SELECT f.release_id FROM release_features f JOIN release_records r ON r.id = f.release_id
      WHERE f.feature_key = $1 ORDER BY r.release_date_ms DESC, r.id DESC LIMIT 1`,
  ).get(featureKey);
  return row ? Number(row.release_id) : null;
}

async function resolveReleaseId(parsed, warnings) {
  if (parsed.releaseKey) {
    const r = await getRelease(parsed.releaseKey);
    if (r) return Number(r.id);
    warnings.push(`Release "${parsed.releaseKey}" is not known yet; filed as unattributed until its release log is imported`);
    return null;
  }
  return releaseIdForFeature(parsed.featureKey);
}

// Remove rows a source produced earlier that it no longer produces.
async function dropStale(table, sourcePath, keys) {
  await db.prepare(`DELETE FROM ${table} WHERE source_path = $1 AND NOT (source_key = ANY($2::text[]))`).run(sourcePath, keys);
}

async function upsertRound(sourcePath, key, releaseId, r) {
  await db.prepare(
    `INSERT INTO release_rounds (release_id, feature_key, round_no, commit_sha, tested_on, passed, steps_passed, steps_total, console_errors, failed_requests, report_path, source_path, source_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (source_path, source_key) DO UPDATE SET release_id=EXCLUDED.release_id, feature_key=EXCLUDED.feature_key, round_no=EXCLUDED.round_no,
       commit_sha=EXCLUDED.commit_sha, tested_on=EXCLUDED.tested_on, passed=EXCLUDED.passed, steps_passed=EXCLUDED.steps_passed,
       steps_total=EXCLUDED.steps_total, console_errors=EXCLUDED.console_errors, failed_requests=EXCLUDED.failed_requests, report_path=EXCLUDED.report_path`,
  ).run(releaseId, r.featureKey, r.roundNo, r.commitSha ?? null, r.testedOn ?? null, r.passed ?? null, r.stepsPassed ?? null, r.stepsTotal ?? null,
    r.consoleErrors ?? null, r.failedRequests ?? null, r.reportPath ?? null, sourcePath, key);
}

async function upsertFix(sourcePath, key, releaseId, f) {
  await db.prepare(
    `INSERT INTO release_fixes (release_id, feature_key, round_no, bug_id, summary, files, source_path, source_key)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
     ON CONFLICT (source_path, source_key) DO UPDATE SET release_id=EXCLUDED.release_id, feature_key=EXCLUDED.feature_key, round_no=EXCLUDED.round_no,
       bug_id=EXCLUDED.bug_id, summary=EXCLUDED.summary, files=EXCLUDED.files`,
  ).run(releaseId, f.featureKey ?? null, f.roundNo ?? null, f.bugId ?? null, f.summary ?? null, f.files || [], sourcePath, key);
}

// A reviewer's disposition (disposition_by set) is never overwritten by import.
async function upsertFailedRun(sourcePath, key, releaseId, run, rules) {
  const state = rules.runStates.includes(run.state) ? run.state : 'failed';
  const disposition = rules.dispositions.includes(run.disposition) ? run.disposition : 'open';
  await db.prepare(
    `INSERT INTO release_failed_runs (release_id, feature_key, run_kind, role, label, state, failure_class, description, state_left, round_no, disposition, disposition_note, source_path, source_key, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (source_path, source_key) DO UPDATE SET release_id=EXCLUDED.release_id, feature_key=EXCLUDED.feature_key, run_kind=EXCLUDED.run_kind,
       role=EXCLUDED.role, label=EXCLUDED.label, state=EXCLUDED.state, description=EXCLUDED.description,
       failure_class = CASE WHEN release_failed_runs.disposition_by IS NULL THEN EXCLUDED.failure_class ELSE release_failed_runs.failure_class END,
       state_left=EXCLUDED.state_left, round_no=EXCLUDED.round_no,
       disposition = CASE WHEN release_failed_runs.disposition_by IS NULL THEN EXCLUDED.disposition ELSE release_failed_runs.disposition END,
       disposition_note = CASE WHEN release_failed_runs.disposition_by IS NULL THEN EXCLUDED.disposition_note ELSE release_failed_runs.disposition_note END`,
  ).run(releaseId, run.featureKey ?? null, run.runKind || 'command', run.role ?? null, run.label ?? null, state,
    normalizeClass(run.failureClass, rules.failureClasses), run.description, run.stateLeft ?? null, run.roundNo ?? null,
    disposition, run.dispositionNote ?? null, sourcePath, key, now());
}

const short = (s) => hashText(s).slice(0, 10);

function logRunToRow(r, rules, fallbackFeature) {
  const state = inferRunState(`${r.stateText} ${r.description}`, rules.runStates);
  return {
    featureKey: r.featureKey || fallbackFeature || null, runKind: r.runKind, role: r.role, label: r.label,
    state: rules.runStates.includes(String(r.stateText).toLowerCase()) ? String(r.stateText).toLowerCase() : state,
    failureClass: r.classText, description: r.description, stateLeft: r.stateLeft, roundNo: r.roundNo,
    disposition: dispositionFromStatus(r.statusText), dispositionNote: r.reconciledHow || null,
  };
}

async function recordEvent({ kind, ref, type, releaseKey = null, state = null, note = null, details = {}, actor }) {
  await db.prepare(
    `INSERT INTO release_reconciliation_events (subject_kind, subject_ref, event_type, release_key, state, note, details, actor_user_id, actor_label, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`,
  ).run(kind, ref, type, releaseKey, state, note, details, actor?.id ?? null, actor?.label ?? null, now());
}
export { recordEvent };

/** Import one document. Returns { path, kind, status, warnings, counts }. */
export async function importDocument(docPath, text, { actor = null } = {}) {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  const p = String(docPath).replace(/\\/g, '/').replace(/^\.\//, '');
  const parsed = parseDocument(p, text, rules.logLocations);
  if (!parsed.kind) return { path: p, kind: null, status: 'skipped', warnings: parsed.warnings, counts: {} };
  const warnings = [...parsed.warnings];
  const hash = hashText(text);
  const prior = await db.prepare(`SELECT id, content_hash, linked_by, release_id FROM release_outputs WHERE path = $1`).get(p);
  if (prior && prior.content_hash === hash) return { path: p, kind: parsed.kind, status: 'unchanged', warnings, counts: {} };

  const counts = {};
  let releaseId = null;
  if (parsed.kind === 'release_log') {
    if (!parsed.date) throw Object.assign(new Error(`${p}: the release log has no date (add "Date: YYYY-MM-DD"); nothing was imported from it`), { status: 400 });
    releaseId = await ensureRelease(parsed.releaseKey, { name: parsed.name, date: parsed.date });
    const keep = [];
    for (const f of parsed.features) {
      keep.push(f.featureKey);
      await db.prepare(
        `INSERT INTO release_features (release_id, feature_key, name, final_status, declared_rounds, declared_change_spec_version, declared_training_spec_version, log_path, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (release_id, feature_key) DO UPDATE SET name=EXCLUDED.name, final_status=EXCLUDED.final_status, declared_rounds=EXCLUDED.declared_rounds,
           declared_change_spec_version=EXCLUDED.declared_change_spec_version, declared_training_spec_version=EXCLUDED.declared_training_spec_version,
           log_path=EXCLUDED.log_path, updated_at=EXCLUDED.updated_at`,
      ).run(releaseId, f.featureKey, f.name, f.finalStatus, f.declaredRounds, f.declaredChangeSpecVersion, f.declaredTrainingSpecVersion, p, now());
    }
    // Features this log used to list but no longer does, and that no tracker snapshot reports, are removed.
    await db.prepare(`DELETE FROM release_features WHERE release_id=$1 AND log_path=$2 AND tracker_status IS NULL AND NOT (feature_key = ANY($3::text[]))`).run(releaseId, p, keep);
    counts.features = parsed.features.length;

    const roundKeys = [];
    for (const r of parsed.rounds) { const k = `round:${r.featureKey}:${r.roundNo}`; roundKeys.push(k); await upsertRound(p, k, releaseId, r); }
    await dropStale('release_rounds', p, roundKeys);
    counts.rounds = parsed.rounds.length;

    const fixKeys = [];
    for (const f of parsed.fixes) { const k = `fix:${f.bugId}:${f.roundNo ?? ''}`; fixKeys.push(k); await upsertFix(p, k, releaseId, f); }
    await dropStale('release_fixes', p, fixKeys);
    counts.fixes = parsed.fixes.length;

    const runKeys = [];
    for (const r of parsed.failedRuns) { const k = `run:${short(`${r.featureKey}|${r.label}|${r.description}`)}`; runKeys.push(k); await upsertFailedRun(p, k, releaseId, logRunToRow(r, rules), rules); }
    await dropStale('release_failed_runs', p, runKeys);
    counts.failedRuns = parsed.failedRuns.length;
  } else {
    releaseId = await resolveReleaseId(parsed, warnings);
    if (parsed.kind === 'test_result') {
      const keys = [];
      if (parsed.round) { const k = `round:${parsed.round.featureKey}:${parsed.round.roundNo}`; keys.push(k); await upsertRound(p, k, releaseId, parsed.round); }
      await dropStale('release_rounds', p, keys);
      counts.rounds = keys.length;
    } else if (parsed.kind === 'triage') {
      const keys = [];
      for (const it of parsed.items) {
        const k = `triage:${it.id}`; keys.push(k);
        await upsertFailedRun(p, k, releaseId, {
          featureKey: parsed.featureKey, runKind: 'validation_step', label: it.id, state: 'failed', failureClass: it.classText,
          description: [it.step && `Step ${it.step}`, it.observed, it.rootCause && `Root cause: ${it.rootCause}`].filter(Boolean).join(' — ') || it.id,
          roundNo: it.firstSeen ?? parsed.roundNo, disposition: 'open',
        }, rules);
      }
      await dropStale('release_failed_runs', p, keys);
      counts.failedRuns = keys.length;
    } else if (parsed.kind === 'reconciliation') {
      const keys = [];
      for (const it of parsed.items) {
        const k = `rec:${short(it.description)}`; keys.push(k);
        await upsertFailedRun(p, k, releaseId, {
          featureKey: parsed.featureKey, runKind: 'command', label: 'reconciliation', state: inferRunState(it.description, rules.runStates),
          failureClass: it.classText, description: it.description, stateLeft: it.stateLeft, disposition: dispositionFromStatus(it.statusText), dispositionNote: it.evidence || null,
        }, rules);
      }
      await dropStale('release_failed_runs', p, keys);
      counts.failedRuns = keys.length;
    } else {
      const keys = [];
      for (const r of parsed.failedRuns) {
        const k = `run:${short(`${r.label}|${r.description}`)}`; keys.push(k);
        await upsertFailedRun(p, k, releaseId, logRunToRow(r, rules, null), rules);
      }
      await dropStale('release_failed_runs', p, keys);
      counts.failedRuns = keys.length;
    }
  }

  // The output row itself. A reviewer link (linked_by set) is never overwritten.
  const reviewerLinked = prior?.linked_by;
  const outRelease = reviewerLinked ? prior.release_id : releaseId;
  await db.prepare(
    `INSERT INTO release_outputs (path, output_kind, feature_key, release_id, spec_version, doc_date, title, traces, content, content_hash, imported_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
     ON CONFLICT (path) DO UPDATE SET output_kind=EXCLUDED.output_kind, feature_key=EXCLUDED.feature_key,
       release_id = CASE WHEN release_outputs.linked_by IS NULL THEN EXCLUDED.release_id ELSE release_outputs.release_id END,
       spec_version=EXCLUDED.spec_version, doc_date=EXCLUDED.doc_date, title=EXCLUDED.title, traces=EXCLUDED.traces, content=EXCLUDED.content,
       content_hash=EXCLUDED.content_hash, imported_at=EXCLUDED.imported_at`,
  ).run(p, parsed.kind, parsed.featureKey ?? null, outRelease, parsed.specVersion ?? null, parsed.docDate ?? parsed.date ?? null, parsed.title ?? parsed.name ?? null,
    parsed.traces || [], text, hash, now());
  await recordEvent({ kind: 'document', ref: p, type: 'import', releaseKey: parsed.releaseKey ?? null, state: prior ? 'updated' : 'new', details: { counts, warnings }, actor });
  return { path: p, kind: parsed.kind, status: prior ? 'updated' : 'imported', warnings, counts, releaseId };
}

/** Give feature-keyed rows that have no release the latest release listing their feature. */
export async function attributeOrphans() {
  const latest = `(SELECT DISTINCT ON (f.feature_key) f.feature_key, f.release_id FROM release_features f JOIN release_records r ON r.id=f.release_id ORDER BY f.feature_key, r.release_date_ms DESC, r.id DESC)`;
  let changed = 0;
  for (const table of ['release_rounds', 'release_fixes', 'release_failed_runs', 'release_metrics']) {
    const r = await db.prepare(`UPDATE ${table} t SET release_id = m.release_id FROM ${latest} m WHERE t.release_id IS NULL AND t.feature_key = m.feature_key`).run();
    changed += r.changes;
  }
  const o = await db.prepare(`UPDATE release_outputs t SET release_id = m.release_id FROM ${latest} m WHERE t.release_id IS NULL AND t.linked_by IS NULL AND t.feature_key = m.feature_key`).run();
  return changed + o.changes;
}

/** Import a tracker snapshot for one release. */
export async function importSnapshot(releaseKey, snapshot, { actor = null } = {}) {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  if (!releaseKey) throw Object.assign(new Error('A release key is required to import a tracker snapshot'), { status: 400 });
  const parsed = parseTrackerSnapshot(snapshot);
  if (!parsed.agents.length && !parsed.features.length && parsed.warnings.length) throw Object.assign(new Error(parsed.warnings.join('; ')), { status: 400 });
  const releaseId = await ensureRelease(releaseKey, { source: 'imported' });
  const sp = `tracker:${releaseKey}`;
  const counts = { agents: 0, features: 0, rounds: 0, failedRuns: 0, fixes: 0 };

  const metricKeys = []; const seen = new Map();
  for (const a of parsed.agents) {
    const n = (seen.get(a.label) || 0) + 1; seen.set(a.label, n);
    const key = n > 1 ? `agent:${a.label}#${n}` : `agent:${a.label}`;
    metricKeys.push(key);
    await db.prepare(
      `INSERT INTO release_metrics (release_id, feature_key, role, round_no, agent_label, status, tokens_input, tokens_cache_write, tokens_cache_read, tokens_output, elapsed_minutes, started_at, ended_at, source_path, source_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (source_path, source_key) DO UPDATE SET release_id=EXCLUDED.release_id, feature_key=EXCLUDED.feature_key, role=EXCLUDED.role, round_no=EXCLUDED.round_no,
         status=EXCLUDED.status, tokens_input=EXCLUDED.tokens_input, tokens_cache_write=EXCLUDED.tokens_cache_write, tokens_cache_read=EXCLUDED.tokens_cache_read,
         tokens_output=EXCLUDED.tokens_output, elapsed_minutes=EXCLUDED.elapsed_minutes, started_at=EXCLUDED.started_at, ended_at=EXCLUDED.ended_at`,
    ).run(releaseId, a.featureKey, a.role, a.roundNo, a.label, a.status, a.tokens?.input ?? null, a.tokens?.cacheWrite ?? null, a.tokens?.cacheRead ?? null,
      a.tokens?.output ?? null, a.elapsedMinutes, a.startedAt, a.endedAt, sp, key);
    counts.agents += 1;
  }
  await dropStale('release_metrics', sp, metricKeys);

  const runKeys = [];
  for (const a of parsed.agents) {
    if (a.status === 'failed' || a.status === 'done_unreconciled') {
      const k = `agent:${a.label}`; runKeys.push(k);
      await upsertFailedRun(sp, k, releaseId, {
        featureKey: a.featureKey, runKind: 'agent_run', role: a.role, label: a.label,
        state: a.limitHit && rules.runStates.includes('interrupted') ? 'interrupted' : 'failed', failureClass: '',
        description: a.limitHit ? `Agent run "${a.label}" stopped at a usage limit before it finished`
          : a.status === 'failed' ? `Agent run "${a.label}" ended without a result` : `Agent run "${a.label}" finished with ${a.failures.length} reported failure${a.failures.length === 1 ? '' : 's'} not yet reconciled`,
        roundNo: a.roundNo, disposition: 'open',
      }, rules);
    }
    for (const text of a.failures) {
      const k = `failure:${a.label}:${short(text)}`; runKeys.push(k);
      await upsertFailedRun(sp, k, releaseId, {
        featureKey: a.featureKey, runKind: 'command', role: a.role, label: a.label, state: inferRunState(text, rules.runStates), failureClass: '',
        description: text, roundNo: a.roundNo, disposition: 'open',
      }, rules);
    }
  }
  const fixKeys = [];
  for (const b of parsed.bugs) {
    const k = `bug:${b.id}`; runKeys.push(k);
    await upsertFailedRun(sp, k, releaseId, {
      featureKey: b.featureKey, runKind: 'validation_step', label: b.id, state: 'failed', failureClass: b.classText,
      description: [b.step, b.rootCause && `Root cause: ${b.rootCause}`].filter(Boolean).join(' — ') || b.id,
      roundNo: b.firstRound, disposition: b.status === 'verified' ? 'reconciled' : 'open',
      dispositionNote: b.status === 'verified' ? 'Verified fixed by a later validation round (tracker)' : null,
    }, rules);
    for (const h of b.history) {
      if (h.event !== 'fixed') continue;
      const fk = `fix:${b.id}:${h.round ?? ''}`; fixKeys.push(fk);
      await upsertFix(sp, fk, releaseId, { featureKey: b.featureKey, roundNo: h.round ?? null, bugId: b.id, summary: h.note || '', files: h.files || [] });
      counts.fixes += 1;
    }
  }
  await dropStale('release_failed_runs', sp, runKeys);
  await dropStale('release_fixes', sp, fixKeys);
  counts.failedRuns = runKeys.length;

  const roundKeys = [];
  for (const f of parsed.features) {
    await db.prepare(
      `INSERT INTO release_features (release_id, feature_key, tracker_status, tracker_open_bugs, updated_at) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (release_id, feature_key) DO UPDATE SET tracker_status=EXCLUDED.tracker_status, tracker_open_bugs=EXCLUDED.tracker_open_bugs, updated_at=EXCLUDED.updated_at`,
    ).run(releaseId, f.featureKey, f.trackerStatus, f.openBugs, now());
    counts.features += 1;
    if (f.lastResult) {
      const k = `round:${f.featureKey}:${f.lastResult.roundNo}`; roundKeys.push(k);
      await upsertRound(sp, k, releaseId, { featureKey: f.featureKey, roundNo: f.lastResult.roundNo, passed: f.lastResult.passed, stepsPassed: f.lastResult.stepsPassed, stepsTotal: f.lastResult.stepsTotal, reportPath: null });
      counts.rounds += 1;
    }
  }
  await dropStale('release_rounds', sp, roundKeys);
  await recordEvent({ kind: 'snapshot', ref: sp, type: 'import', releaseKey, details: { counts, warnings: parsed.warnings, runId: parsed.runId, syncedAt: parsed.syncedAt }, actor });
  return { releaseKey, releaseId, counts, warnings: parsed.warnings };
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Import every release-loop document under `root` (the repository root).
 * Release logs go first so the documents that follow can be attributed.
 * Never throws for one bad document: it is reported in `documents`/`errors`.
 */
export async function importRepository(root, { actor = null } = {}) {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  const folders = Object.values(rules.logLocations);
  const files = [];
  const notes = [];
  for (const folder of folders) {
    const abs = path.join(root, folder);
    if (!fs.existsSync(abs)) { notes.push(`${folder} does not exist under ${root}`); continue; }
    files.push(...walk(abs).map((f) => path.relative(root, f).split(path.sep).join('/')));
  }
  if (!files.length && notes.length === folders.length) throw new Error(`No release-loop folders found under ${root}: ${notes.join('; ')}`);
  const order = (f) => (f.startsWith(rules.logLocations.releaseLog) ? 0 : 1);
  files.sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  const documents = []; const errors = [];
  const generated = new Set((rules.generatedFiles || []).map((f) => `${rules.logLocations.releaseLog}${f}`));
  for (const rel of files) {
    if (generated.has(rel)) {
      documents.push({ path: rel, kind: null, status: 'skipped', warnings: ['tracker-generated file listed under "Generated files" in Release Intelligence Settings; not a release log'], counts: {} });
      continue;
    }
    try {
      documents.push(await importDocument(rel, fs.readFileSync(path.join(root, rel), 'utf8'), { actor }));
    } catch (e) {
      documents.push({ path: rel, kind: null, status: 'error', warnings: [], counts: {}, error: e.message });
      errors.push(`${rel}: ${e.message}`);
    }
  }
  const attributed = await attributeOrphans();
  return { filesRead: files.length, documents, errors, notes, attributed };
}
