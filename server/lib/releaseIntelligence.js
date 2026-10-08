// Queries and actions behind the Release intelligence screen: release
// records, per-feature reconciliation, failed runs, outputs, trends.
// Everything is read from the additive release_* tables (filled by
// releaseLogImporter.js or entered on the screen); nothing is estimated.

import { db } from '../db.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import { loadRules } from './releaseIntelligenceConfig.js';
import { mergeRounds, reconcileFeature, roundsToPass } from './releaseReconcile.js';
import { ensureRelease, recordEvent, attributeOrphans } from './releaseLogImporter.js';

const n = (v) => (v == null ? null : Number(v));

function mapRound(r) {
  return {
    featureKey: r.feature_key, roundNo: Number(r.round_no), commitSha: r.commit_sha, testedOn: r.tested_on, passed: r.passed,
    stepsPassed: n(r.steps_passed), stepsTotal: n(r.steps_total), consoleErrors: n(r.console_errors), failedRequests: n(r.failed_requests),
    reportPath: r.report_path, sourcePath: r.source_path,
  };
}

function mapRun(r) {
  return {
    id: Number(r.id), releaseId: n(r.release_id), featureKey: r.feature_key, runKind: r.run_kind, role: r.role, label: r.label, state: r.state,
    failureClass: r.failure_class, description: r.description, stateLeft: r.state_left, roundNo: n(r.round_no), disposition: r.disposition,
    dispositionNote: r.disposition_note, dispositionBy: r.disposition_by, dispositionAt: n(r.disposition_at), sourcePath: r.source_path,
  };
}

function mapOutput(o) {
  return {
    id: Number(o.id), path: o.path, kind: o.output_kind, featureKey: o.feature_key, releaseId: n(o.release_id), linkedBy: o.linked_by,
    specVersion: o.spec_version, docDate: o.doc_date, title: o.title, traces: o.traces || [], importedAt: n(o.imported_at),
  };
}

function featureOutcome(feature, rounds) {
  if (feature.final_status) return feature.final_status;
  if (feature.tracker_status) return feature.tracker_status;
  const last = rounds[rounds.length - 1];
  if (!last) return 'unknown';
  return last.passed === true ? 'passed' : last.passed === false ? 'failing' : 'unknown';
}
const isPassed = (outcome) => /^pass/i.test(outcome || '');

async function loadReleaseBundle(releaseId) {
  const [features, rounds, runs, fixes, metrics, outputs, allOutputs] = await Promise.all([
    db.prepare(`SELECT * FROM release_features WHERE release_id=$1 ORDER BY feature_key`).all(releaseId),
    db.prepare(`SELECT * FROM release_rounds WHERE release_id=$1`).all(releaseId),
    db.prepare(`SELECT * FROM release_failed_runs WHERE release_id=$1 ORDER BY id`).all(releaseId),
    db.prepare(`SELECT * FROM release_fixes WHERE release_id=$1 ORDER BY round_no NULLS LAST, (source_path LIKE 'tracker:%'), id`).all(releaseId),
    db.prepare(`SELECT * FROM release_metrics WHERE release_id=$1`).all(releaseId),
    db.prepare(`SELECT id,path,output_kind,feature_key,release_id,linked_by,spec_version,doc_date,title,traces,imported_at FROM release_outputs WHERE release_id=$1 ORDER BY path`).all(releaseId),
    db.prepare(`SELECT path FROM release_outputs`).all(),
  ]);
  return { features, rounds: rounds.map(mapRound), runs: runs.map(mapRun), fixes, metrics, outputs: outputs.map(mapOutput), knownPaths: new Set(allOutputs.map((o) => o.path)) };
}

async function specFor(kind, featureKey) {
  const row = await db.prepare(`SELECT id,path,output_kind,feature_key,release_id,linked_by,spec_version,doc_date,title,traces,imported_at FROM release_outputs WHERE output_kind=$1 AND feature_key=$2 ORDER BY imported_at DESC LIMIT 1`).get(kind, featureKey);
  return row ? mapOutput(row) : null;
}

function tokenSum(rows) {
  const recorded = rows.filter((m) => [m.tokens_input, m.tokens_cache_write, m.tokens_cache_read, m.tokens_output].some((v) => v != null));
  if (!recorded.length) return null;
  const t = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const m of recorded) { t.input += Number(m.tokens_input || 0); t.cacheWrite += Number(m.tokens_cache_write || 0); t.cacheRead += Number(m.tokens_cache_read || 0); t.output += Number(m.tokens_output || 0); }
  t.all = t.input + t.cacheWrite + t.cacheRead + t.output;
  return t;
}
function minuteSum(rows) {
  const rec = rows.filter((m) => m.elapsed_minutes != null);
  return rec.length ? Math.round(rec.reduce((s, m) => s + Number(m.elapsed_minutes), 0) * 10) / 10 : null;
}

export async function getReleaseDetail(releaseId) {
  await ensureReleaseIntelligenceSchema();
  const rel = await db.prepare(`SELECT * FROM release_records WHERE id=$1`).get(releaseId);
  if (!rel) return null;
  const b = await loadReleaseBundle(releaseId);
  const merged = mergeRounds(b.rounds);
  const features = [];
  for (const f of b.features) {
    const fRounds = merged.filter((r) => r.featureKey === f.feature_key);
    const changeSpec = await specFor('change_spec', f.feature_key);
    const trainingSpec = await specFor('training_spec', f.feature_key);
    const openRuns = b.runs.filter((r) => r.featureKey === f.feature_key && r.disposition === 'open');
    const rec = reconcileFeature({
      feature: { featureKey: f.feature_key, declaredRounds: n(f.declared_rounds), declaredChangeSpecVersion: f.declared_change_spec_version, declaredTrainingSpecVersion: f.declared_training_spec_version },
      changeSpec, trainingSpec, rounds: fRounds, openRuns, knownPaths: b.knownPaths,
    });
    const outcome = featureOutcome(f, fRounds);
    const mm = b.metrics.filter((m) => m.feature_key === f.feature_key);
    features.push({
      featureKey: f.feature_key, name: f.name, outcome, passed: isPassed(outcome), trackerStatus: f.tracker_status, trackerOpenBugs: n(f.tracker_open_bugs),
      changeSpec, trainingSpec, rounds: fRounds, roundsToPass: roundsToPass(fRounds),
      // The same fix can be reported by a release log and by the tracker; the log's wording wins.
      fixes: b.fixes.filter((x) => x.feature_key === f.feature_key)
        .filter((x, i, all) => all.findIndex((y) => y.bug_id === x.bug_id && y.round_no === x.round_no) === i)
        .map((x) => ({ bugId: x.bug_id, roundNo: n(x.round_no), summary: x.summary, files: x.files || [] })),
      failedRuns: b.runs.filter((r) => r.featureKey === f.feature_key), reconciliation: rec,
      tokens: tokenSum(mm), elapsedMinutes: minuteSum(mm), agents: mm.length,
    });
  }
  const releaseRuns = b.runs.filter((r) => !r.featureKey || !b.features.some((f) => f.feature_key === r.featureKey));
  const openReleaseRuns = releaseRuns.filter((r) => r.disposition === 'open');
  const gaps = [];
  if (!features.length) gaps.push('The release lists no features');
  for (const f of features) for (const g of f.reconciliation.gaps) gaps.push(`${f.featureKey} — ${g}`);
  if (openReleaseRuns.length) gaps.push(`${openReleaseRuns.length} failed run${openReleaseRuns.length === 1 ? '' : 's'} not tied to a feature ${openReleaseRuns.length === 1 ? 'is' : 'are'} still open`);
  const events = await db.prepare(`SELECT * FROM release_reconciliation_events WHERE release_key=$1 ORDER BY id DESC LIMIT 50`).all(rel.release_key);
  return {
    id: Number(rel.id), releaseKey: rel.release_key, name: rel.name, date: rel.release_date, status: rel.status, source: rel.source,
    approvedBy: n(rel.approved_by), approvedAt: n(rel.approved_at), approvalNote: rel.approval_note,
    features, releaseRuns, outputs: b.outputs, reconciled: gaps.length === 0, gaps,
    tokens: tokenSum(b.metrics), elapsedMinutes: minuteSum(b.metrics), agents: b.metrics.length,
    events: events.map((e) => ({ id: Number(e.id), type: e.event_type, kind: e.subject_kind, ref: e.subject_ref, state: e.state, note: e.note, actor: e.actor_label, at: n(e.created_at) })),
  };
}

export async function listReleases() {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(`SELECT id FROM release_records ORDER BY release_date_ms DESC, id DESC`).all();
  const out = [];
  for (const r of rows) {
    const d = await getReleaseDetail(Number(r.id));
    out.push({
      id: d.id, releaseKey: d.releaseKey, name: d.name, date: d.date, status: d.status, reconciled: d.reconciled, gapCount: d.gaps.length,
      features: d.features.length, passedFeatures: d.features.filter((f) => f.passed).length,
      failedRuns: d.features.reduce((s, f) => s + f.failedRuns.length, 0) + d.releaseRuns.length,
      openFailedRuns: d.features.reduce((s, f) => s + f.failedRuns.filter((x) => x.disposition === 'open').length, 0) + d.releaseRuns.filter((x) => x.disposition === 'open').length,
    });
  }
  return out;
}

export async function createRelease({ releaseKey, name, date }, actor) {
  await ensureReleaseIntelligenceSchema();
  const key = String(releaseKey || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(key)) throw Object.assign(new Error('Release key may use letters, digits, ".", "_" and "-" only'), { status: 400 });
  if (await db.prepare(`SELECT 1 x FROM release_records WHERE release_key=$1`).get(key)) throw Object.assign(new Error(`Release "${key}" already exists`), { status: 409 });
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Object.assign(new Error('Date must be YYYY-MM-DD'), { status: 400 });
  let id;
  try { id = await ensureRelease(key, { name: name || null, date: date || null, source: 'manual' }); } catch (e) { throw Object.assign(e, { status: 400 }); }
  await recordEvent({ kind: 'release', ref: key, type: 'create', releaseKey: key, note: name || null, actor });
  return getReleaseDetail(id);
}

export async function addManualFeature(releaseId, { featureKey, name, finalStatus }, actor) {
  await ensureReleaseIntelligenceSchema();
  const rel = await db.prepare(`SELECT release_key FROM release_records WHERE id=$1`).get(releaseId);
  if (!rel) throw Object.assign(new Error('Release not found'), { status: 404 });
  const key = String(featureKey || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) throw Object.assign(new Error('Feature key may use lowercase letters, digits and "-" only'), { status: 400 });
  await db.prepare(
    `INSERT INTO release_features (release_id, feature_key, name, final_status, updated_at) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (release_id, feature_key) DO UPDATE SET name=EXCLUDED.name, final_status=EXCLUDED.final_status, updated_at=EXCLUDED.updated_at`,
  ).run(releaseId, key, name || null, finalStatus ? String(finalStatus).toLowerCase() : null, Date.now());
  await attributeOrphans();
  await recordEvent({ kind: 'release', ref: rel.release_key, type: 'add_feature', releaseKey: rel.release_key, note: key, actor });
  return getReleaseDetail(releaseId);
}

export async function addManualFailedRun(input, actor) {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  const description = String(input.description || '').trim();
  if (!description) throw Object.assign(new Error('Describe what failed'), { status: 400 });
  if (!rules.runStates.includes(input.state)) throw Object.assign(new Error(`State must be one of: ${rules.runStates.join(', ')}`), { status: 400 });
  const cls = input.failureClass || 'unclassified';
  if (!rules.failureClasses.includes(cls)) throw Object.assign(new Error(`Failure class must be one of: ${rules.failureClasses.join(', ')}`), { status: 400 });
  let releaseId = null; let releaseKey = null;
  if (input.releaseId) {
    const rel = await db.prepare(`SELECT id, release_key FROM release_records WHERE id=$1`).get(Number(input.releaseId));
    if (!rel) throw Object.assign(new Error('Release not found'), { status: 404 });
    releaseId = Number(rel.id); releaseKey = rel.release_key;
  }
  const key = `manual:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const row = await db.prepare(
    `INSERT INTO release_failed_runs (release_id, feature_key, run_kind, role, label, state, failure_class, description, state_left, round_no, source_path, source_key, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual',$11,$12) RETURNING id`,
  ).get(releaseId, input.featureKey || null, input.runKind || 'command', input.role || null, input.label || null, input.state, cls, description, input.stateLeft || null,
    input.roundNo ? Number(input.roundNo) : null, key, Date.now());
  await recordEvent({ kind: 'failed_run', ref: String(row.id), type: 'create', releaseKey, state: input.state, note: description.slice(0, 200), actor });
  return Number(row.id);
}

export async function setDisposition(runId, { disposition, note, failureClass }, actor) {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  if (!rules.dispositions.includes(disposition)) throw Object.assign(new Error(`Disposition must be one of: ${rules.dispositions.join(', ')}`), { status: 400 });
  if (disposition !== 'open' && !String(note || '').trim()) throw Object.assign(new Error('Add a note saying how this was resolved or why it is accepted'), { status: 400 });
  const run = await db.prepare(`SELECT r.*, rr.release_key FROM release_failed_runs r LEFT JOIN release_records rr ON rr.id=r.release_id WHERE r.id=$1`).get(runId);
  if (!run) throw Object.assign(new Error('Failed run not found'), { status: 404 });
  const cls = failureClass || run.failure_class;
  if (!rules.failureClasses.includes(cls)) throw Object.assign(new Error(`Failure class must be one of: ${rules.failureClasses.join(', ')}`), { status: 400 });
  await db.prepare(`UPDATE release_failed_runs SET disposition=$1, disposition_note=$2, disposition_by=$3, disposition_at=$4, failure_class=$5 WHERE id=$6`)
    .run(disposition, note || null, actor?.label || 'admin', Date.now(), cls, runId);
  await recordEvent({ kind: 'failed_run', ref: String(runId), type: 'disposition', releaseKey: run.release_key, state: disposition, note: note || null, details: { was: run.disposition, wasClass: run.failure_class, class: cls }, actor });
  const updated = await db.prepare(`SELECT * FROM release_failed_runs WHERE id=$1`).get(runId);
  return mapRun(updated);
}

export async function listFailedRuns({ releaseId, disposition, failureClass, state } = {}) {
  await ensureReleaseIntelligenceSchema();
  const where = []; const params = [];
  if (releaseId === 'none') where.push('r.release_id IS NULL');
  else if (releaseId) { params.push(Number(releaseId)); where.push(`r.release_id = $${params.length}`); }
  if (disposition) { params.push(disposition); where.push(`r.disposition = $${params.length}`); }
  if (failureClass) { params.push(failureClass); where.push(`r.failure_class = $${params.length}`); }
  if (state) { params.push(state); where.push(`r.state = $${params.length}`); }
  const rows = await db.prepare(
    `SELECT r.*, rr.release_key FROM release_failed_runs r LEFT JOIN release_records rr ON rr.id = r.release_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY rr.release_date_ms DESC NULLS LAST, r.id DESC`,
  ).all(...params);
  return rows.map((r) => ({ ...mapRun(r), releaseKey: r.release_key }));
}

export async function listOutputs() {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(
    `SELECT o.id,o.path,o.output_kind,o.feature_key,o.release_id,o.linked_by,o.spec_version,o.doc_date,o.title,o.traces,o.imported_at, rr.release_key
       FROM release_outputs o LEFT JOIN release_records rr ON rr.id=o.release_id ORDER BY (o.release_id IS NULL) DESC, o.path`,
  ).all();
  return rows.map((o) => ({ ...mapOutput(o), releaseKey: o.release_key }));
}

export async function linkOutput(outputId, releaseId, actor) {
  await ensureReleaseIntelligenceSchema();
  const out = await db.prepare(`SELECT id, path FROM release_outputs WHERE id=$1`).get(outputId);
  if (!out) throw Object.assign(new Error('Output not found'), { status: 404 });
  let rel = null;
  if (releaseId) {
    rel = await db.prepare(`SELECT id, release_key FROM release_records WHERE id=$1`).get(Number(releaseId));
    if (!rel) throw Object.assign(new Error('Release not found'), { status: 404 });
  }
  await db.prepare(`UPDATE release_outputs SET release_id=$1, linked_by=$2 WHERE id=$3`).run(rel ? Number(rel.id) : null, actor?.label || 'admin', outputId);
  // Rows this document produced follow it (unless a feature listing already attributed them).
  const relId = rel ? Number(rel.id) : null;
  for (const t of ['release_rounds', 'release_failed_runs', 'release_fixes']) {
    await db.prepare(`UPDATE ${t} SET release_id=$1 WHERE source_path=$2 AND release_id IS NULL`).run(relId, out.path);
  }
  await recordEvent({ kind: 'output', ref: out.path, type: rel ? 'link' : 'unlink', releaseKey: rel?.release_key ?? null, actor });
  return listOutputs();
}

export async function approveRelease(releaseId, note, actor) {
  await ensureReleaseIntelligenceSchema();
  const d = await getReleaseDetail(releaseId);
  if (!d) throw Object.assign(new Error('Release not found'), { status: 404 });
  if (!d.reconciled) {
    throw Object.assign(new Error(`This release is not reconciled yet: ${d.gaps.length} gap${d.gaps.length === 1 ? ' remains' : 's remain'}`), { status: 409, code: 'release_not_reconciled', gaps: d.gaps });
  }
  await db.prepare(`UPDATE release_records SET status='approved', approved_by=$1, approved_at=$2, approval_note=$3, updated_at=$2 WHERE id=$4`)
    .run(actor?.id ?? null, Date.now(), note || null, releaseId);
  await recordEvent({ kind: 'release', ref: d.releaseKey, type: 'approve', releaseKey: d.releaseKey, state: 'approved', note: note || null, actor });
  return getReleaseDetail(releaseId);
}

export async function reopenRelease(releaseId, note, actor) {
  await ensureReleaseIntelligenceSchema();
  const rel = await db.prepare(`SELECT release_key FROM release_records WHERE id=$1`).get(releaseId);
  if (!rel) throw Object.assign(new Error('Release not found'), { status: 404 });
  if (!String(note || '').trim()) throw Object.assign(new Error('Say why the release is being reopened'), { status: 400 });
  await db.prepare(`UPDATE release_records SET status='open', approved_by=NULL, approved_at=NULL, approval_note=NULL, updated_at=$1 WHERE id=$2`).run(Date.now(), releaseId);
  await recordEvent({ kind: 'release', ref: rel.release_key, type: 'reopen', releaseKey: rel.release_key, state: 'open', note, actor });
  return getReleaseDetail(releaseId);
}

// ── Trends ──────────────────────────────────────────────────────────────────

export async function getTrends() {
  await ensureReleaseIntelligenceSchema();
  const { rules } = await loadRules();
  const releases = await db.prepare(`SELECT * FROM release_records ORDER BY release_date_ms ASC, id ASC`).all();
  const [metrics, rounds, runs, features] = await Promise.all([
    db.prepare(`SELECT * FROM release_metrics WHERE release_id IS NOT NULL`).all(),
    db.prepare(`SELECT * FROM release_rounds WHERE release_id IS NOT NULL`).all(),
    db.prepare(`SELECT release_id, failure_class, state, disposition FROM release_failed_runs WHERE release_id IS NOT NULL`).all(),
    db.prepare(`SELECT * FROM release_features`).all(),
  ]);
  const series = releases.map((rel) => {
    const rid = Number(rel.id);
    const mm = metrics.filter((m) => Number(m.release_id) === rid);
    const group = (field) => {
      const out = {};
      for (const key of [...new Set(mm.map((m) => m[field] || 'unassigned'))]) {
        const rows = mm.filter((m) => (m[field] || 'unassigned') === key);
        out[key] = { tokens: tokenSum(rows), minutes: minuteSum(rows) };
      }
      return out;
    };
    const merged = mergeRounds(rounds.filter((r) => Number(r.release_id) === rid).map(mapRound));
    const feats = features.filter((f) => Number(f.release_id) === rid);
    const perFeature = {};
    let passedCount = 0;
    for (const f of feats) {
      const fr = merged.filter((r) => r.featureKey === f.feature_key);
      perFeature[f.feature_key] = roundsToPass(fr);
      if (isPassed(featureOutcome(f, fr))) passedCount += 1;
    }
    const counted = Object.values(perFeature).filter((v) => v != null);
    const rr = runs.filter((r) => Number(r.release_id) === rid);
    const classes = {};
    for (const r of rr) classes[r.failure_class] = (classes[r.failure_class] || 0) + 1;
    return {
      id: rid, releaseKey: rel.release_key, name: rel.name, date: rel.release_date, status: rel.status,
      features: { total: feats.length, passed: passedCount },
      agents: { total: mm.length, withTokens: mm.filter((m) => [m.tokens_input, m.tokens_cache_write, m.tokens_cache_read, m.tokens_output].some((v) => v != null)).length, withTime: mm.filter((m) => m.elapsed_minutes != null).length },
      tokens: tokenSum(mm), minutes: minuteSum(mm), byRole: group('role'), byFeature: group('feature_key'),
      roundsToPass: { mean: counted.length ? Math.round((counted.reduce((s, v) => s + v, 0) / counted.length) * 100) / 100 : null, perFeature },
      failureClasses: classes, failedRuns: { total: rr.length, open: rr.filter((r) => r.disposition === 'open').length },
    };
  });
  return { releases: series, rules: { failureClasses: rules.failureClasses, defaultTokenMeasure: rules.defaultTokenMeasure, maxSeries: rules.maxSeries } };
}
