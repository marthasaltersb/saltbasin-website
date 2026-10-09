// Release loop, inside the platform (2026-10-09). The in-app twin of the
// Claude Code release loop (server/data/releaseLoop/definition.json): a run
// tracks one feature of one release through the definition's stages, with the
// same gates enforced here, server-side, whichever interface calls them (the
// World Shell "Release loop" screen, the /api/release-loop routes, or an MCP
// tool that calls these exported functions).
//
// Reuse (see docs/changes/in-app-release-loop.md "Reuse audit"):
//   - releases, validation rounds, fixes, reconciliation items (failed runs)
//     and the audit trail live in the existing release_* tables
//     (releaseIntelligenceSchema.js), so Release Intelligence shows a platform
//     run's results with no import step;
//   - roles are agent_definitions rows (releaseLoopAgents.js);
//   - the process itself is releaseLoopDefinition.js.
// New additive tables are only what had no home: the run (stage/status), the
// live step log, and the bug lifecycle.
//
// Gates:
//   done            latest validation round passed AND zero unresolved
//                   reconciliation items AND no blocking bug; goes through
//                   assertReadyToFinalize like every other finalize path; the
//                   run's status becomes `done` and it no longer moves.
//   maxFixRounds    entering "fix" a (max+1)th time is refused: the run ends
//                   `not_passed` with its open items (never reported as done).
//   per-bug limit   a bug re-failing after maxFixAttemptsPerBug fix attempts
//                   becomes needs_human; no fix is accepted on it until a person decides.
//   business def    a needs_business_definition bug needs the exact question and
//                   waits for the owner's answer; nothing is guessed.
import { db } from '../db.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import { ensureRelease, recordEvent, attributeOrphans, dateFromReleaseKey } from './releaseLogImporter.js';
import { addManualFailedRun, setDisposition } from './releaseIntelligence.js';
import { assertReadyToFinalize } from './finalizationGates.js';
import { getEffectiveDefinition } from './releaseLoopDefinition.js';

const err = (m, status = 400, extra) => Object.assign(new Error(m), { status }, extra || {});
const n = (v) => (v == null ? null : Number(v));
const text = (v) => String(v ?? '').trim();

export const STEP_STATUSES = ['pass', 'fail', 'ambiguous', 'info', 'page_error', 'failed_request'];
const FAILING_STEP = ['fail', 'page_error', 'failed_request'];
export const BLOCKING_BUG_STATUSES = ['open', 'fixing', 'fixed_awaiting_retest', 'recurred', 'needs_human', 'needs_business_definition'];
export const SCOPE_STATUSES = ['backlog_pre_existing', 'reassigned', 'process_note'];
// Edges the definition does not spell out as next/onPass/...: a triage item can
// need a spec amendment first, an approved amendment is integrated before the
// next validation, and an escalation returns to triage once the owner answers.
const EXTRA_EDGES = { triage: ['amend'], amend: ['integrate'], escalate: ['triage'] };

let ready;
export function ensureReleaseLoopSchema() {
  if (ready) return ready;
  ready = (async () => {
    await ensureReleaseIntelligenceSchema();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS release_loop_runs (
        id                 BIGSERIAL PRIMARY KEY,
        release_id         BIGINT NOT NULL REFERENCES release_records(id) ON DELETE CASCADE,
        feature_key        TEXT NOT NULL,
        name               TEXT,
        stage              TEXT NOT NULL DEFAULT 'build',
        status             TEXT NOT NULL DEFAULT 'active',
        fix_rounds         INTEGER NOT NULL DEFAULT 0,
        definition_version INTEGER,
        created_by         TEXT,
        created_at         BIGINT NOT NULL,
        updated_at         BIGINT NOT NULL,
        UNIQUE (release_id, feature_key)
      );
      CREATE TABLE IF NOT EXISTS release_loop_steps (
        id         BIGSERIAL PRIMARY KEY,
        run_id     BIGINT NOT NULL REFERENCES release_loop_runs(id) ON DELETE CASCADE,
        round_no   INTEGER NOT NULL,
        step_id    TEXT,
        surface    TEXT,
        status     TEXT NOT NULL,
        note       TEXT,
        created_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_rls_run ON release_loop_steps (run_id, id);
      CREATE TABLE IF NOT EXISTS release_loop_bugs (
        id           BIGSERIAL PRIMARY KEY,
        run_id       BIGINT NOT NULL REFERENCES release_loop_runs(id) ON DELETE CASCADE,
        bug_key      TEXT NOT NULL,
        title        TEXT NOT NULL,
        triage_class TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'open',
        step_id      TEXT,
        observed     TEXT,
        question     TEXT,
        owner_answer TEXT,
        fix_attempts INTEGER NOT NULL DEFAULT 0,
        history      JSONB NOT NULL DEFAULT '[]',
        created_at   BIGINT NOT NULL,
        updated_at   BIGINT NOT NULL,
        UNIQUE (run_id, bug_key)
      );
    `);
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

// ── mapping ─────────────────────────────────────────────────────────────────
const mapRun = (r) => ({
  id: Number(r.id), releaseId: Number(r.release_id), releaseKey: r.release_key, featureKey: r.feature_key, name: r.name, stage: r.stage, status: r.status,
  fixRounds: Number(r.fix_rounds), definitionVersion: n(r.definition_version), createdBy: r.created_by, createdAt: n(r.created_at), updatedAt: n(r.updated_at),
});
const mapBug = (b) => ({
  id: Number(b.id), runId: Number(b.run_id), bugKey: b.bug_key, title: b.title, triageClass: b.triage_class, status: b.status, stepId: b.step_id,
  observed: b.observed, question: b.question, ownerAnswer: b.owner_answer, fixAttempts: Number(b.fix_attempts), history: b.history || [],
  createdAt: n(b.created_at), updatedAt: n(b.updated_at),
});
const mapStep = (s) => ({ id: Number(s.id), runId: Number(s.run_id), roundNo: Number(s.round_no), stepId: s.step_id, surface: s.surface, status: s.status, note: s.note, at: n(s.created_at) });

async function getRunRow(runId) {
  await ensureReleaseLoopSchema();
  const row = await db.prepare(`SELECT r.*, rr.release_key FROM release_loop_runs r JOIN release_records rr ON rr.id=r.release_id WHERE r.id=$1`).get(Number(runId));
  if (!row) throw err('Run not found', 404);
  return row;
}
async function getBugRow(bugId) {
  await ensureReleaseLoopSchema();
  const row = await db.prepare(`SELECT * FROM release_loop_bugs WHERE id=$1`).get(Number(bugId));
  if (!row) throw err('Bug not found', 404);
  return row;
}
const touch = (runId) => db.prepare(`UPDATE release_loop_runs SET updated_at=$1 WHERE id=$2`).run(Date.now(), runId);

async function loopRounds(run) {
  return (await db.prepare(`SELECT * FROM release_rounds WHERE release_id=$1 AND feature_key=$2 AND source_path=$3 ORDER BY round_no`).all(run.release_id, run.feature_key, `platform:run:${run.id}`))
    .map((r) => ({
      roundNo: Number(r.round_no), commitSha: r.commit_sha, testedOn: r.tested_on, passed: r.passed, stepsPassed: n(r.steps_passed), stepsTotal: n(r.steps_total),
      consoleErrors: n(r.console_errors), failedRequests: n(r.failed_requests),
    }));
}
const currentRoundNo = (rounds) => (rounds.length ? Math.max(...rounds.map((r) => r.roundNo)) : 0) + 1;

async function reconciliationItems(run) {
  const rows = await db.prepare(`SELECT * FROM release_failed_runs WHERE release_id=$1 AND feature_key=$2 ORDER BY id`).all(run.release_id, run.feature_key);
  return rows.map((r) => ({
    id: Number(r.id), runKind: r.run_kind, label: r.label, state: r.state, failureClass: r.failure_class, description: r.description, stateLeft: r.state_left,
    roundNo: n(r.round_no), disposition: r.disposition, dispositionNote: r.disposition_note, dispositionBy: r.disposition_by, dispositionAt: n(r.disposition_at),
  }));
}

function bugHistory(bug, from, to, note, actor, extra) {
  return [...(bug.history || []), { at: Date.now(), by: actor?.label || 'admin', from, to, note: note || null, ...(extra || {}) }];
}
async function saveBug(bug, patch, note, actor, extra) {
  const to = patch.status ?? bug.status;
  const history = bugHistory(bug, bug.status, to, note, actor, extra);
  await db.prepare(
    `UPDATE release_loop_bugs SET status=$1, fix_attempts=$2, owner_answer=$3, triage_class=$4, history=$5::jsonb, updated_at=$6 WHERE id=$7`,
  ).run(to, patch.fixAttempts ?? bug.fix_attempts, patch.ownerAnswer ?? bug.owner_answer, patch.triageClass ?? bug.triage_class, history, Date.now(), bug.id);
  const run = await getRunRow(bug.run_id);
  await recordEvent({ kind: 'loop_bug', ref: `${run.id}:${bug.bug_key}`, type: 'status', releaseKey: run.release_key, state: to, note: note || null, details: { from: bug.status, feature: run.feature_key }, actor });
  await touch(run.id);
  return mapBug(await getBugRow(bug.id));
}

// ── gates ───────────────────────────────────────────────────────────────────
/** Everything that stops this run being "done", listed with the reason. */
export async function doneGate(runId) {
  const run = await getRunRow(runId);
  const gaps = [];
  if (run.status === 'not_passed') gaps.push('The run reached the maximum number of fix rounds and is recorded as not passed');
  const rounds = await loopRounds(run);
  const last = rounds[rounds.length - 1];
  if (!last) gaps.push('No validation round has been recorded');
  else if (last.passed !== true) gaps.push(`Validation round ${last.roundNo} did not pass`);
  const items = (await reconciliationItems(run)).filter((i) => i.disposition === 'open');
  if (items.length) gaps.push(`${items.length} reconciliation item${items.length === 1 ? ' is' : 's are'} unresolved`);
  const bugs = (await db.prepare(`SELECT status FROM release_loop_bugs WHERE run_id=$1`).all(run.id)).filter((b) => BLOCKING_BUG_STATUSES.includes(b.status));
  if (bugs.length) gaps.push(`${bugs.length} bug${bugs.length === 1 ? ' is' : 's are'} not closed (open, fixing, awaiting re-test, recurred, needs a person or needs a business definition)`);
  return { ok: gaps.length === 0, gaps };
}

function stageTargets(def, stageKey) {
  const s = def.stages.find((x) => x.key === stageKey);
  if (!s) return [];
  const out = ['next', 'onPass', 'onFail', 'onFixable', 'onBusinessDefinition'].map((f) => s[f]).filter(Boolean);
  for (const t of EXTRA_EDGES[stageKey] || []) if (def.stages.some((x) => x.key === t)) out.push(t);
  return [...new Set(out)];
}

// ── definition / roster ─────────────────────────────────────────────────────
export async function getDefinitionView() {
  const eff = await getEffectiveDefinition();
  await ensureReleaseLoopSchema();
  const agents = await db.prepare(`SELECT id, key, name, role_description, tier, is_active FROM agent_definitions WHERE pipeline='release_loop' AND org_id IS NULL AND owner_user_id IS NULL ORDER BY id`).all();
  return { ...eff, agents: agents.map((a) => ({ id: Number(a.id), key: a.key, name: a.name, roleDescription: a.role_description, tier: Number(a.tier), active: a.is_active })) };
}

// ── runs ────────────────────────────────────────────────────────────────────
export async function listRuns() {
  await ensureReleaseLoopSchema();
  const rows = await db.prepare(`SELECT r.*, rr.release_key FROM release_loop_runs r JOIN release_records rr ON rr.id=r.release_id ORDER BY r.updated_at DESC, r.id DESC`).all();
  const out = [];
  for (const row of rows) {
    const run = mapRun(row);
    const rounds = await loopRounds(row);
    const bugs = await db.prepare(`SELECT status FROM release_loop_bugs WHERE run_id=$1`).all(run.id);
    out.push({
      ...run, rounds: rounds.length, bugs: bugs.length, openBugs: bugs.filter((b) => BLOCKING_BUG_STATUSES.includes(b.status)).length,
      escalated: bugs.filter((b) => b.status === 'needs_human' || b.status === 'needs_business_definition').length,
    });
  }
  return out;
}

export async function createRun({ releaseKey, featureKey, name, date }, actor) {
  await ensureReleaseLoopSchema();
  const rk = text(releaseKey);
  const fk = text(featureKey);
  if (!rk) throw err('Give the release key (for example 2030-03-01-garden-gate)');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(fk)) throw err('Feature key may use lowercase letters, digits and "-" only');
  if (!date && !dateFromReleaseKey(rk)) throw err('The release key must start with a date (YYYY-MM-DD)');
  const releaseId = await ensureRelease(rk, { name: null, date: date || null, source: 'platform' });
  const dup = await db.prepare(`SELECT id FROM release_loop_runs WHERE release_id=$1 AND feature_key=$2`).get(releaseId, fk);
  if (dup) throw err(`A run for feature "${fk}" already exists in release ${rk}`, 409);
  await db.prepare(
    `INSERT INTO release_features (release_id, feature_key, name, final_status, updated_at) VALUES ($1,$2,$3,NULL,$4)
     ON CONFLICT (release_id, feature_key) DO UPDATE SET name=COALESCE(EXCLUDED.name, release_features.name), updated_at=EXCLUDED.updated_at`,
  ).run(releaseId, fk, text(name) || null, Date.now());
  const { definition } = await getEffectiveDefinition();
  const row = await db.prepare(
    `INSERT INTO release_loop_runs (release_id, feature_key, name, stage, status, definition_version, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,'build','active',$4,$5,$6,$6) RETURNING id`,
  ).get(releaseId, fk, text(name) || null, Number(definition.version), actor?.label || 'admin', Date.now());
  await attributeOrphans();
  await recordEvent({ kind: 'loop_run', ref: String(row.id), type: 'create', releaseKey: rk, state: 'build', note: fk, actor });
  return getRunDetail(row.id);
}

export async function getRunDetail(runId, { stepLimit = 300 } = {}) {
  const row = await getRunRow(runId);
  const run = mapRun(row);
  const { definition: def } = await getEffectiveDefinition();
  const rounds = await loopRounds(row);
  const steps = (await db.prepare(`SELECT * FROM (SELECT * FROM release_loop_steps WHERE run_id=$1 ORDER BY id DESC LIMIT $2) t ORDER BY id`).all(run.id, stepLimit)).map(mapStep);
  const bugs = (await db.prepare(`SELECT * FROM release_loop_bugs WHERE run_id=$1 ORDER BY id`).all(run.id)).map(mapBug);
  const fixes = (await db.prepare(`SELECT * FROM release_fixes WHERE release_id=$1 AND feature_key=$2 AND source_path=$3 ORDER BY id`).all(row.release_id, row.feature_key, `platform:run:${run.id}`))
    .map((f) => ({ id: Number(f.id), bugId: f.bug_id, roundNo: n(f.round_no), summary: f.summary, files: f.files || [] }));
  const reconciliation = await reconciliationItems(row);
  const gate = await doneGate(run.id);
  const stage = def.stages.find((s) => s.key === run.stage);
  const role = def.roles.find((r) => r.key === stage?.role);
  const events = (await db.prepare(`SELECT * FROM release_reconciliation_events WHERE release_key=$1 AND subject_kind LIKE 'loop_%' ORDER BY id DESC LIMIT 100`).all(run.releaseKey))
    .filter((e) => e.subject_ref === String(run.id) || e.subject_ref.startsWith(`${run.id}:`))
    .map((e) => ({ id: Number(e.id), kind: e.subject_kind, ref: e.subject_ref, type: e.event_type, state: e.state, note: e.note, actor: e.actor_label, at: n(e.created_at) }));
  return {
    run, stageRole: role ? { key: role.key, name: role.name } : null,
    maxFixRounds: def.maxFixRounds, maxFixAttemptsPerBug: def.bugEscalation.maxFixAttemptsPerBug,
    allowedTransitions: run.status === 'active' ? stageTargets(def, run.stage) : [],
    currentRoundNo: currentRoundNo(rounds), rounds, steps, bugs, fixes, reconciliation,
    escalations: bugs.filter((b) => b.status === 'needs_human' || b.status === 'needs_business_definition'),
    doneGate: gate, events,
  };
}

export async function transitionRun(runId, to, { note, actor, userId } = {}) {
  const row = await getRunRow(runId);
  const run = mapRun(row);
  const { definition: def } = await getEffectiveDefinition();
  if (run.status !== 'active') throw err(`This run is ${run.status.replace('_', ' ')} and cannot move`, 409);
  if (!stageTargets(def, run.stage).includes(to)) {
    throw err(`From "${run.stage}" a run can only move to: ${stageTargets(def, run.stage).join(', ') || 'nowhere'}`, 409);
  }
  const rounds = await loopRounds(row);
  const last = rounds[rounds.length - 1];

  if (run.stage === 'validate' && to === 'triage') {
    if (!last) throw err('Record the validation round before moving to triage', 409);
    if (last.passed === true) throw err(`Round ${last.roundNo} passed, so the run goes to "done", not to triage`, 409);
  }
  if (to === 'done') {
    // Same gate as every finalize path: server-side, before anything is written.
    if (userId != null) await assertReadyToFinalize(userId);
    const gate = await doneGate(run.id);
    if (!gate.ok) throw err(`This run cannot be marked done: ${gate.gaps.join('; ')}`, 409, { gaps: gate.gaps, code: 'done_gate' });
  }
  if (to === 'fix') {
    if (run.fixRounds >= def.maxFixRounds) {
      await db.prepare(`UPDATE release_loop_runs SET status='not_passed', updated_at=$1 WHERE id=$2`).run(Date.now(), run.id);
      await db.prepare(`UPDATE release_features SET final_status='not passed', updated_at=$1 WHERE release_id=$2 AND feature_key=$3`).run(Date.now(), run.releaseId, run.featureKey);
      await recordEvent({ kind: 'loop_run', ref: String(run.id), type: 'not_passed', releaseKey: run.releaseKey, state: 'not_passed', note: `Still failing after ${def.maxFixRounds} fix rounds`, actor });
      return { outcome: 'not_passed', message: `Still failing after ${def.maxFixRounds} fix rounds: recorded as not passed with its open items, never as done.`, detail: await getRunDetail(run.id) };
    }
    await db.prepare(`UPDATE release_loop_runs SET fix_rounds=fix_rounds+1 WHERE id=$1`).run(run.id);
  }
  if (to === 'escalate') {
    const q = await db.prepare(`SELECT 1 AS x FROM release_loop_bugs WHERE run_id=$1 AND status='needs_business_definition' LIMIT 1`).get(run.id);
    if (!q) throw err('Nothing to escalate: record a bug classed needs_business_definition with its exact question first', 409);
  }
  await db.prepare(`UPDATE release_loop_runs SET stage=$1, status=$2, updated_at=$3 WHERE id=$4`).run(to, to === 'done' ? 'done' : 'active', Date.now(), run.id);
  if (to === 'done') {
    await db.prepare(`UPDATE release_features SET final_status='passed', updated_at=$1 WHERE release_id=$2 AND feature_key=$3`).run(Date.now(), run.releaseId, run.featureKey);
  }
  await recordEvent({ kind: 'loop_run', ref: String(run.id), type: 'transition', releaseKey: run.releaseKey, state: to, note: note || null, details: { from: run.stage }, actor });
  return { outcome: to === 'done' ? 'done' : 'moved', detail: await getRunDetail(run.id) };
}

// ── validation rounds + live steps ──────────────────────────────────────────
export async function recordRound(runId, input, actor) {
  const row = await getRunRow(runId);
  if (row.status !== 'active') throw err('This run is closed', 409);
  if (row.stage !== 'validate') throw err('Rounds are recorded while the run is in the "validate" stage', 409);
  const rounds = await loopRounds(row);
  const roundNo = currentRoundNo(rounds);
  const passed = input.passed === true || input.passed === 'true';
  const sp = input.stepsPassed === '' || input.stepsPassed == null ? null : Number(input.stepsPassed);
  const st = input.stepsTotal === '' || input.stepsTotal == null ? null : Number(input.stepsTotal);
  const ce = input.consoleErrors === '' || input.consoleErrors == null ? null : Number(input.consoleErrors);
  const fr = input.failedRequests === '' || input.failedRequests == null ? null : Number(input.failedRequests);
  for (const [label, v] of [['Steps passed', sp], ['Steps total', st], ['Console errors', ce], ['Failed requests', fr]]) {
    if (v != null && (!Number.isInteger(v) || v < 0)) throw err(`${label} must be a whole number, 0 or more`);
  }
  if (sp != null && st != null && sp > st) throw err('Steps passed cannot be more than steps total');
  if (passed) {
    if (sp != null && st != null && sp < st) throw err(`A round cannot pass with ${sp} of ${st} steps passed`, 409);
    const bad = await db.prepare(`SELECT COUNT(*)::int AS c FROM release_loop_steps WHERE run_id=$1 AND round_no=$2 AND status = ANY($3)`).get(row.id, roundNo, FAILING_STEP);
    if (bad.c) throw err(`A round cannot pass while ${bad.c} live step${bad.c === 1 ? '' : 's'} in it failed or logged a page error or failed request`, 409);
    if ((ce || 0) > 0 || (fr || 0) > 0) throw err('A round cannot pass with console errors or failed requests recorded', 409);
  }
  const key = `round-${roundNo}`;
  await db.prepare(
    `INSERT INTO release_rounds (release_id, feature_key, round_no, commit_sha, tested_on, passed, steps_passed, steps_total, console_errors, failed_requests, source_path, source_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
  ).run(row.release_id, row.feature_key, roundNo, text(input.commitSha) || null, new Date().toISOString().slice(0, 10), passed, sp, st, ce, fr, `platform:run:${row.id}`, key);
  await recordEvent({ kind: 'loop_run', ref: String(row.id), type: 'round', releaseKey: row.release_key, state: passed ? 'passed' : 'failed', note: `Round ${roundNo}`, actor });
  await touch(row.id);
  return getRunDetail(row.id);
}

export async function addStep(runId, input) {
  const row = await getRunRow(runId);
  if (!STEP_STATUSES.includes(input.status)) throw err(`Step status must be one of: ${STEP_STATUSES.join(', ')}`);
  if (!text(input.note) && !text(input.stepId)) throw err('Give the step id or a note');
  if (row.stage !== 'validate') throw err('Live steps are logged while the run is in the "validate" stage', 409);
  const roundNo = currentRoundNo(await loopRounds(row));
  const s = await db.prepare(
    `INSERT INTO release_loop_steps (run_id, round_no, step_id, surface, status, note, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
  ).get(row.id, roundNo, text(input.stepId) || null, text(input.surface) || null, input.status, text(input.note) || null, Date.now());
  await touch(row.id);
  return mapStep(s);
}

export async function listSteps(runId, afterId = 0) {
  const row = await getRunRow(runId);
  const rows = await db.prepare(`SELECT * FROM release_loop_steps WHERE run_id=$1 AND id>$2 ORDER BY id LIMIT 500`).all(row.id, Number(afterId) || 0);
  return rows.map(mapStep);
}

// ── bugs ────────────────────────────────────────────────────────────────────
export async function createBug(runId, input, actor) {
  const run = await getRunRow(runId);
  if (run.status !== 'active') throw err('This run is closed', 409);
  const { definition: def } = await getEffectiveDefinition();
  const title = text(input.title);
  if (!title) throw err('Give the bug a title');
  const cls = text(input.triageClass);
  if (!def.triageClasses.some((c) => c.key === cls)) throw err(`Class must be one of: ${def.triageClasses.map((c) => c.key).join(', ')}`);
  const question = text(input.question);
  if (cls === 'needs_business_definition' && !question) throw err('A needs_business_definition item must carry the exact question for the owner');
  const count = (await db.prepare(`SELECT COUNT(*)::int AS c FROM release_loop_bugs WHERE run_id=$1`).get(run.id)).c;
  const bugKey = `${run.feature_key}-B${count + 1}`;
  const status = cls === 'needs_business_definition' ? 'needs_business_definition' : 'open';
  const history = [{ at: Date.now(), by: actor?.label || 'admin', from: null, to: status, note: 'Created from triage' }];
  const row = await db.prepare(
    `INSERT INTO release_loop_bugs (run_id, bug_key, title, triage_class, status, step_id, observed, question, history, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$10) RETURNING *`,
  ).get(run.id, bugKey, title, cls, status, text(input.stepId) || null, text(input.observed) || null, question || null, history, Date.now());
  await recordEvent({ kind: 'loop_bug', ref: `${run.id}:${bugKey}`, type: 'create', releaseKey: run.release_key, state: status, note: title, actor });
  await touch(run.id);
  return mapBug(row);
}

export async function startFix(bugId, actor) {
  const bug = await getBugRow(bugId);
  const run = await getRunRow(bug.run_id);
  if (bug.status === 'needs_human') throw err('This bug has used its fix attempts and waits for a person to decide', 409);
  if (bug.status === 'needs_business_definition') throw err('This bug waits for the owner to answer its question', 409);
  if (!['open', 'recurred'].includes(bug.status)) throw err(`A bug that is ${bug.status.replace(/_/g, ' ')} cannot start a fix`, 409);
  if (run.stage !== 'fix') throw err('Fixes start while the run is in the "fix" stage', 409);
  return saveBug(bug, { status: 'fixing' }, 'Fix started', actor);
}

export async function recordFix(bugId, input, actor) {
  const bug = await getBugRow(bugId);
  const run = await getRunRow(bug.run_id);
  const { definition: def } = await getEffectiveDefinition();
  if (bug.status === 'needs_human') throw err('This bug has used its fix attempts and waits for a person to decide', 409);
  if (bug.status !== 'fixing') throw err('Start the fix first: only a bug that is "fixing" can have a fix recorded', 409);
  const summary = text(input.summary);
  if (!summary) throw err('Describe the fix');
  const files = Array.isArray(input.files) ? input.files : text(input.files).split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  const attempts = Number(bug.fix_attempts) + 1;
  if (attempts > def.bugEscalation.maxFixAttemptsPerBug) throw err('No fix attempts left for this bug', 409);
  await db.prepare(
    `INSERT INTO release_fixes (release_id, feature_key, round_no, bug_id, summary, files, source_path, source_key)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
  ).run(run.release_id, run.feature_key, run.fix_rounds, bug.bug_key, summary, files, `platform:run:${run.id}`, `fix-${bug.bug_key}-${attempts}`);
  return saveBug(bug, { status: 'fixed_awaiting_retest', fixAttempts: attempts }, summary, actor, { attempt: attempts });
}

export async function retestBug(bugId, input, actor) {
  const bug = await getBugRow(bugId);
  const run = await getRunRow(bug.run_id);
  const { definition: def } = await getEffectiveDefinition();
  if (bug.status !== 'fixed_awaiting_retest') throw err('Only a bug awaiting re-test can be re-tested', 409);
  if (run.stage !== 'validate') throw err('Re-tests are recorded while the run is in the "validate" stage', 409);
  const passed = input.passed === true || input.passed === 'true';
  const note = text(input.note);
  if (!note) throw err('Say what the re-test showed');
  if (passed) return saveBug(bug, { status: 'verified' }, note, actor);
  const limit = def.bugEscalation.maxFixAttemptsPerBug;
  if (Number(bug.fix_attempts) >= limit) {
    return saveBug(bug, { status: 'needs_human' }, `Failed re-test after ${bug.fix_attempts} fix attempts (limit ${limit}): ${note}`, actor);
  }
  return saveBug(bug, { status: 'recurred' }, note, actor);
}

export async function scopeBug(bugId, input, actor) {
  const bug = await getBugRow(bugId);
  if (!SCOPE_STATUSES.includes(input.status)) throw err(`Scope must be one of: ${SCOPE_STATUSES.join(', ')}`);
  if (!['open', 'recurred', 'fixing', 'fixed_awaiting_retest'].includes(bug.status)) throw err(`A bug that is ${bug.status.replace(/_/g, ' ')} cannot be re-scoped`, 409);
  const evidence = text(input.evidence);
  if (!evidence) throw err('Scope decisions carry evidence: a base-branch reproduction, the commit that introduced it, or the file it lives in');
  return saveBug(bug, { status: input.status }, evidence, actor);
}

export async function answerBusinessQuestion(bugId, input, actor) {
  const bug = await getBugRow(bugId);
  if (bug.status !== 'needs_business_definition') throw err('This bug is not waiting for a business definition', 409);
  const answer = text(input.answer);
  if (!answer) throw err('Type the owner\'s answer');
  return saveBug(bug, { status: 'open', ownerAnswer: answer }, `Owner answered: ${answer}`, actor);
}

export async function decideNeedsHuman(bugId, input, actor) {
  const bug = await getBugRow(bugId);
  if (bug.status !== 'needs_human') throw err('This bug is not waiting for a person', 409);
  const note = text(input.note);
  if (!note) throw err('Say why you chose this');
  if (input.decision === 'retry') return saveBug(bug, { status: 'open', fixAttempts: 0 }, `Person chose another round of attempts: ${note}`, actor, { attemptsBefore: Number(bug.fix_attempts) });
  if (input.decision === 'backlog') return saveBug(bug, { status: 'backlog_pre_existing' }, `Person moved it to the backlog: ${note}`, actor);
  throw err('Decision must be "retry" or "backlog"');
}

export async function listEscalations() {
  await ensureReleaseLoopSchema();
  const rows = await db.prepare(
    `SELECT b.*, r.feature_key, rr.release_key FROM release_loop_bugs b JOIN release_loop_runs r ON r.id=b.run_id JOIN release_records rr ON rr.id=r.release_id
      WHERE b.status IN ('needs_human','needs_business_definition') ORDER BY b.updated_at DESC`,
  ).all();
  return rows.map((b) => ({ ...mapBug(b), featureKey: b.feature_key, releaseKey: b.release_key }));
}

// ── reconciliation items (reuse release_failed_runs) ────────────────────────
export async function addReconciliationItem(runId, input, actor) {
  const run = await getRunRow(runId);
  if (run.status !== 'active') throw err('This run is closed', 409);
  const id = await addManualFailedRun({
    releaseId: run.release_id, featureKey: run.feature_key, runKind: input.runKind || 'agent_run', label: input.label,
    state: input.state, failureClass: input.failureClass, description: input.description, stateLeft: input.stateLeft, roundNo: input.roundNo,
  }, actor);
  await touch(run.id);
  return { id };
}

export async function resolveReconciliationItem(runId, itemId, input, actor) {
  const run = await getRunRow(runId);
  const item = await db.prepare(`SELECT id FROM release_failed_runs WHERE id=$1 AND release_id=$2 AND feature_key=$3`).get(Number(itemId), run.release_id, run.feature_key);
  if (!item) throw err('That reconciliation item does not belong to this run', 404);
  const out = await setDisposition(Number(itemId), input, actor);
  await touch(run.id);
  return out;
}
