// Platform agent runner (docs/changes/platform-agent-runner.md, version 2).
//
// Salt Basin runs the release loop's agents itself: the WEBSITE is the orchestrator and the record (this file,
// behind /api/agent-runner/* and the MCP tools); a separate WORKER (scripts/agent-worker.mjs, Dockerfile.worker)
// claims queued runs, sets up a working copy, runs the agent through one adapter interface
// (server/lib/agentRunnerAdapters.js: fixture for tests, Claude Agent SDK for real) and reports progress back
// with a worker token. Sessions are capped by the change they may make (a WORK ORDER, agentWorkOrder.js), not
// by spend: usage is recorded (observed, never invented) but nothing here caps dollars.
//
// Reuse (docs/changes/platform-agent-runner.md "Reuse-first audit"):
//   release_loop_* tables + gates (releaseLoopPlatform.js): live steps, rounds, bugs, fixes, the done gate;
//   release_failed_runs (reconciliation items): every failed / refused / stopped agent run on a loop run;
//   release_reconciliation_events: the audit trail, including rejected worker calls;
//   agent_definitions: the quality-agent roster (pipeline 'release_loop_quality'), + claude_agent_ref;
//   backlog_items: seeds (backlogSeeds.js);   crypto.js: the stored GitHub token;
//   config_state: settings and worker presence (TEXT JSON, so JSON.stringify is correct there).
// New (a proven gap): agent_runner_runs (many sessions per feature run, with queue state, work order,
// timeline) and agent_runner_outputs (governed proposals awaiting a person's decision).
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { db, getJSON, setJSON } from '../db.js';
import { encrypt } from './crypto.js';
import { assertReadyToFinalize } from './finalizationGates.js';
import { recordEvent } from './releaseLogImporter.js';
import { ensureReleaseIntelligenceSchema } from './releaseIntelligenceSchema.js';
import { addManualFailedRun } from './releaseIntelligence.js';
import { ensureReleaseLoopSchema, addStep, recordRound, createBug, startFix, recordFix, getRunDetail as getLoopRunDetail } from './releaseLoopPlatform.js';
import { AGENT_CATALOG, QUALITY_AGENT_KEYS, RESULT_SCHEMAS, REPO_ROOT, getAgent, describeAgent, readAgentFiles, validateResult } from './agentRunnerCatalog.js';
import { validateWorkOrder, checkDiff, widenWorkOrder, scopeNeedsOwner, DEFAULT_SIZE_LIMITS, SIZES } from './agentWorkOrder.js';
import { listFixtureScenarios } from './agentRunnerAdapters.js';
import { buildTestPlan, loadBaseline, latestBaselineVersion, loadSmoke, DEFAULT_SHARED_MODULES } from './agentTestPlan.js';
import * as seeds from './backlogSeeds.js';

const err = (m, status = 400, extra) => Object.assign(new Error(m), { status }, extra || {});
const n = (v) => (v == null ? null : Number(v));
const text = (v) => String(v ?? '').trim();
const SETTINGS_ID = 'agent_runner_settings';
const WORKERS_ID = 'agent_runner_workers';
const TIMELINE_CAP = 300;
export const RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'scope_exceeded', 'stopped'];
const OPEN_STATUSES = ['queued', 'running'];

// ── schema ──────────────────────────────────────────────────────────────────
let ready;
export function ensureAgentRunnerSchema() {
  if (ready) return ready;
  ready = (async () => {
    await ensureReleaseLoopSchema();
    await ensureReleaseIntelligenceSchema();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS agent_runner_runs (
        id              BIGSERIAL PRIMARY KEY,
        agent_key       TEXT NOT NULL,
        kind            TEXT NOT NULL,
        loop_run_id     BIGINT REFERENCES release_loop_runs(id) ON DELETE SET NULL,
        feature_key     TEXT,
        prompt          TEXT,
        prompt_version  INTEGER,
        params          JSONB NOT NULL DEFAULT '{}',
        work_order      JSONB,
        branch          TEXT,
        pinned_baseline JSONB,
        fixture_scenario TEXT,
        status          TEXT NOT NULL DEFAULT 'queued',
        error           TEXT,
        error_code      TEXT,
        result          JSONB,
        usage           JSONB,
        diff            JSONB,
        checks          JSONB,
        adapter         TEXT,
        timeline        JSONB NOT NULL DEFAULT '[]',
        seq             INTEGER NOT NULL DEFAULT 0,
        scope_requests  JSONB NOT NULL DEFAULT '[]',
        attempts        INTEGER NOT NULL DEFAULT 0,
        claimed_by      TEXT,
        claimed_at      BIGINT,
        started_at      BIGINT,
        finished_at     BIGINT,
        last_event_at   BIGINT,
        stop_requested  BOOLEAN NOT NULL DEFAULT false,
        stopped_by      TEXT,
        created_by      TEXT,
        created_at      BIGINT NOT NULL,
        updated_at      BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_arr_status ON agent_runner_runs (status, id);
      CREATE INDEX IF NOT EXISTS idx_arr_loop ON agent_runner_runs (loop_run_id);
      CREATE TABLE IF NOT EXISTS agent_runner_outputs (
        id           BIGSERIAL PRIMARY KEY,
        run_id       BIGINT REFERENCES agent_runner_runs(id) ON DELETE CASCADE,
        kind         TEXT NOT NULL,
        status       TEXT NOT NULL,
        title        TEXT NOT NULL,
        feature_key  TEXT,
        payload      JSONB NOT NULL,
        ref          JSONB,
        decided_by   TEXT,
        decided_at   BIGINT,
        decision_note TEXT,
        created_at   BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_aro_kind ON agent_runner_outputs (kind, status, id);
      ALTER TABLE agent_definitions ADD COLUMN IF NOT EXISTS claude_agent_ref JSONB;
      ALTER TABLE release_loop_bugs ADD COLUMN IF NOT EXISTS work_order JSONB;
      ALTER TABLE release_loop_bugs ADD COLUMN IF NOT EXISTS size TEXT;
    `);
    await seeds.ensureSeedSchema();
    await seedQualityRoster();
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/** Insert-if-missing platform defaults for the quality roster; records which prompt file/version each runs. */
async function seedQualityRoster() {
  const now = Date.now();
  for (const a of AGENT_CATALOG) {
    const d = describeAgent(a);
    if (d.problem) continue;
    const ref = { promptPath: d.promptPath, version: d.version };
    if (a.mode === 'quality') {
      await db.prepare(
        `INSERT INTO agent_definitions (org_id, owner_user_id, key, name, pipeline, role_description, objective, capabilities, boundaries, reports_to_agent_id, tier, is_active, claude_agent_ref, created_at, updated_at)
         VALUES (NULL, NULL, $1,$2,'release_loop_quality',$3,$4,$5::jsonb,$6::jsonb,NULL,1,true,$7::jsonb,$8,$8)
         ON CONFLICT (key) WHERE org_id IS NULL AND owner_user_id IS NULL DO NOTHING`,
      ).run(a.key, d.name, a.youCanAskIt, `Write only: ${a.writes}`, [a.youCanAskIt, `Writes ${a.writes}`], [a.governance, 'Never edits a training spec, baseline or code', 'Never pushes'], ref, now);
    }
    // Existing release_loop roles (and the quality rows) learn which prompt file they run; only where unset.
    await db.prepare(`UPDATE agent_definitions SET claude_agent_ref=$1::jsonb WHERE key=$2 AND org_id IS NULL AND owner_user_id IS NULL AND claude_agent_ref IS NULL`).run(ref, a.key);
  }
}

// ── settings (config_state, TEXT JSON) ──────────────────────────────────────
export const DEFAULT_SETTINGS = Object.freeze({
  sizeLimits: { ...DEFAULT_SIZE_LIMITS }, turnLimit: 40, concurrency: 2, staleSeconds: 120, model: 'sonnet',
  sharedModules: [...DEFAULT_SHARED_MODULES], forbiddenPatterns: [],
});

async function readSettings() {
  const row = (await getJSON('config_state', SETTINGS_ID)) || {};
  return { ...DEFAULT_SETTINGS, ...row, sizeLimits: { ...DEFAULT_SETTINGS.sizeLimits, ...(row.sizeLimits || {}) }, history: row.history || [] };
}
export async function getSettings() { await ensureAgentRunnerSchema(); return readSettings(); }

/** What the screen/API/MCP get: no secret ever leaves the server. */
export async function settingsView() {
  const s = await getSettings();
  return {
    sizeLimits: s.sizeLimits, turnLimit: s.turnLimit, concurrency: s.concurrency, staleSeconds: s.staleSeconds, model: s.model,
    sharedModules: s.sharedModules, forbiddenPatterns: s.forbiddenPatterns, history: s.history.slice(-10),
    apiKey: { set: !!process.env.ANTHROPIC_API_KEY, note: 'Read from the ANTHROPIC_API_KEY environment variable of the worker; the value is never shown.' },
    githubToken: { stored: !!s.githubTokenEnc, last4: s.githubTokenLast4 || null, savedAt: s.githubTokenSavedAt || null },
    workerToken: { created: !!s.workerTokenHash, last4: s.workerTokenLast4 || null, createdAt: s.workerTokenCreatedAt || null },
    defaults: { sizeLimits: DEFAULT_SIZE_LIMITS },
  };
}

const intIn = (label, v, lo, hi) => {
  const x = Number(v);
  if (!Number.isInteger(x) || x < lo || x > hi) throw err(`${label} must be a whole number from ${lo} to ${hi}`);
  return x;
};
const pathList = (label, v) => {
  const list = (Array.isArray(v) ? v : String(v ?? '').split(/[\n,]/)).map((x) => String(x).trim()).filter(Boolean);
  for (const p of list) if (p.startsWith('/') || p.split('/').includes('..')) throw err(`${label}: "${p}" must be a path inside the repository`);
  return [...new Set(list)];
};

export async function saveSettings(patch, actor) {
  const cur = await getSettings();
  const next = { ...cur };
  if (patch.sizeLimits) {
    const l = { S: intIn('Size S', patch.sizeLimits.S, 1, 5000), M: intIn('Size M', patch.sizeLimits.M, 1, 5000), L: intIn('Size L', patch.sizeLimits.L, 1, 5000) };
    if (!(l.S <= l.M && l.M <= l.L)) throw err('Size limits must grow: S no more than M, M no more than L');
    next.sizeLimits = l;
  }
  if (patch.turnLimit !== undefined) next.turnLimit = intIn('Turn limit', patch.turnLimit, 1, 200);
  if (patch.concurrency !== undefined) next.concurrency = intIn('Concurrency', patch.concurrency, 1, 8);
  if (patch.staleSeconds !== undefined) next.staleSeconds = intIn('Stalled after (seconds)', patch.staleSeconds, 5, 3600);
  if (patch.model !== undefined) {
    const m = text(patch.model);
    if (!m || m.length > 80) throw err('Model must be a model name or alias of at most 80 characters');
    next.model = m;
  }
  if (patch.sharedModules !== undefined) next.sharedModules = pathList('Shared modules', patch.sharedModules);
  if (patch.forbiddenPatterns !== undefined) next.forbiddenPatterns = pathList('Forbidden paths', patch.forbiddenPatterns);
  next.history = [...cur.history, { at: Date.now(), by: actor?.label || 'admin', note: 'Settings saved' }].slice(-30);
  await setJSON('config_state', SETTINGS_ID, next);
  return settingsView();
}

export async function setGithubToken(token, actor) {
  const t = text(token);
  if (t.length < 8) throw err('Paste the fine-grained GitHub token (at least 8 characters)');
  const cur = await getSettings();
  await setJSON('config_state', SETTINGS_ID, { ...cur, githubTokenEnc: encrypt(t), githubTokenLast4: t.slice(-4), githubTokenSavedAt: Date.now(), history: [...cur.history, { at: Date.now(), by: actor?.label || 'admin', note: 'GitHub token stored' }].slice(-30) });
  return settingsView();
}
export async function clearGithubToken(actor) {
  const cur = await getSettings();
  const { githubTokenEnc, githubTokenLast4, githubTokenSavedAt, ...rest } = cur;
  await setJSON('config_state', SETTINGS_ID, { ...rest, history: [...cur.history, { at: Date.now(), by: actor?.label || 'admin', note: 'GitHub token removed' }].slice(-30) });
  return settingsView();
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
/** A new worker token (shown once). The old one stops working immediately. */
export async function rotateWorkerToken(actor) {
  const token = `sbw_${crypto.randomBytes(24).toString('hex')}`;
  const cur = await getSettings();
  await setJSON('config_state', SETTINGS_ID, { ...cur, workerTokenHash: sha256(token), workerTokenLast4: token.slice(-4), workerTokenCreatedAt: Date.now(), history: [...cur.history, { at: Date.now(), by: actor?.label || 'admin', note: 'Worker token created' }].slice(-30) });
  return { token, last4: token.slice(-4), view: await settingsView() };
}
export async function authenticateWorker(token) {
  const s = await getSettings();
  if (!s.workerTokenHash || !token) return false;
  const a = Buffer.from(sha256(String(token)));
  const b = Buffer.from(s.workerTokenHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export async function logRejectedWorkerCall(reason, meta = {}) {
  await ensureReleaseIntelligenceSchema();
  await recordEvent({ kind: 'agent_runner_worker', ref: 'auth', type: 'rejected', state: 'rejected', note: reason, details: meta });
}
export async function listRejectedWorkerCalls(limit = 10) {
  await ensureReleaseIntelligenceSchema();
  const rows = await db.prepare(`SELECT * FROM release_reconciliation_events WHERE subject_kind='agent_runner_worker' ORDER BY id DESC LIMIT $1`).all(limit);
  return rows.map((r) => ({ id: Number(r.id), at: n(r.created_at), reason: r.note, details: r.details || {} }));
}

// ── workers ─────────────────────────────────────────────────────────────────
export async function workerHeartbeat(workerId, info = {}) {
  await ensureAgentRunnerSchema();
  const all = (await getJSON('config_state', WORKERS_ID)) || {};
  const now = Date.now();
  const kept = Object.fromEntries(Object.entries(all).filter(([, w]) => now - w.lastSeen < 24 * 3600 * 1000));
  kept[workerId] = { lastSeen: now, adapter: String(info.adapter || 'unknown'), version: info.version || null, scenarios: Array.isArray(info.scenarios) ? info.scenarios : [] };
  await setJSON('config_state', WORKERS_ID, kept);
  return { ok: true, serverTime: now };
}
export async function workerStatus() {
  await ensureAgentRunnerSchema();
  const s = await readSettings();
  const all = (await getJSON('config_state', WORKERS_ID)) || {};
  const now = Date.now();
  const online = Object.entries(all).map(([id, w]) => ({ id, ...w, online: now - w.lastSeen < 15000 })).sort((a, b) => b.lastSeen - a.lastSeen);
  const live = online.filter((w) => w.online);
  return {
    connected: live.length > 0, workers: online.slice(0, 5), adapter: live[0]?.adapter || null, concurrency: s.concurrency,
    message: live.length ? `${live.length} worker${live.length === 1 ? '' : 's'} connected (${live[0].adapter} adapter)` : 'No worker is connected. Queued runs wait until one starts.',
  };
}

// ── mapping ─────────────────────────────────────────────────────────────────
function mapRun(r, settings, { detail = false } = {}) {
  const now = Date.now();
  const stalled = r.status === 'running' && r.last_event_at != null && now - Number(r.last_event_at) > settings.staleSeconds * 1000;
  const out = {
    id: Number(r.id), agentKey: r.agent_key, kind: r.kind, loopRunId: n(r.loop_run_id), featureKey: r.feature_key, status: r.status, stalled,
    silentSeconds: r.status === 'running' && r.last_event_at != null ? Math.round((now - Number(r.last_event_at)) / 1000) : null,
    error: r.error, errorCode: r.error_code, branch: r.branch, promptVersion: n(r.prompt_version), adapter: r.adapter, fixtureScenario: r.fixture_scenario,
    attempts: Number(r.attempts), stopRequested: r.stop_requested, stoppedBy: r.stopped_by, createdBy: r.created_by,
    createdAt: n(r.created_at), startedAt: n(r.started_at), finishedAt: n(r.finished_at), lastEventAt: n(r.last_event_at), usage: r.usage || null,
    pinnedBaseline: r.pinned_baseline || null, pendingScopeRequests: (r.scope_requests || []).filter((s) => s.status === 'pending').length,
    prompt: r.prompt, params: r.params || {},
  };
  if (detail) {
    Object.assign(out, { timeline: r.timeline || [], seq: Number(r.seq), workOrder: r.work_order || null, scopeRequests: r.scope_requests || [], result: r.result ?? null, diff: r.diff ?? null, checks: r.checks ?? null });
  }
  return out;
}
const mapOutput = (o) => ({
  id: Number(o.id), runId: n(o.run_id), kind: o.kind, status: o.status, title: o.title, featureKey: o.feature_key, payload: o.payload, ref: o.ref || {},
  decidedBy: o.decided_by, decidedAt: n(o.decided_at), decisionNote: o.decision_note, createdAt: n(o.created_at),
});

async function getRunRow(id) {
  await ensureAgentRunnerSchema();
  const row = await db.prepare(`SELECT * FROM agent_runner_runs WHERE id=$1`).get(Number(id));
  if (!row) throw err('Agent run not found', 404);
  return row;
}
async function getLoopRow(id) {
  const row = await db.prepare(`SELECT r.*, rr.release_key FROM release_loop_runs r JOIN release_records rr ON rr.id=r.release_id WHERE r.id=$1`).get(Number(id));
  if (!row) throw err('Release-loop run not found', 404);
  return row;
}

// ── agents (roster) ─────────────────────────────────────────────────────────
export async function listAgents() {
  await ensureAgentRunnerSchema();
  const defs = await db.prepare(`SELECT key, is_active, claude_agent_ref FROM agent_definitions WHERE org_id IS NULL AND owner_user_id IS NULL`).all();
  return AGENT_CATALOG.map((a) => {
    const d = describeAgent(a);
    const def = defs.find((x) => x.key === a.key);
    return { key: a.key, name: d.name, mode: a.mode, stage: a.stage || null, outputKind: a.outputKind || null, youCanAskIt: a.youCanAskIt, writes: a.writes, governance: a.governance, params: a.params, canEditCode: a.canEditCode, promptPath: d.promptPath, promptVersion: d.version, problem: d.problem, active: def ? def.is_active : null, claudeAgentRef: def?.claude_agent_ref || null };
  });
}
export async function getAgentPrompt(key) {
  const a = getAgent(key);
  if (!a) throw err('Unknown agent', 404);
  const f = readAgentFiles(key);
  return { key, name: f.name, version: f.version, promptPath: f.promptPath, prompt: f.prompt };
}

// ── runs ────────────────────────────────────────────────────────────────────
function pinBaseline(feature) {
  const v = latestBaselineVersion(feature, { allowFixture: true });
  if (!v) return null;
  const b = loadBaseline(feature, v, { allowFixture: true });
  return { feature, version: v, specSha256: b.specSha256, scoredSteps: b.steps.filter((s) => s.kind !== 'precondition').length };
}

/**
 * Queues one run. Quality agents take a free-text prompt plus optional structured params. Stage agents are tied to
 * a release-loop run in the matching stage; the fixer additionally needs a work order (written or built from
 * the bugs' own work orders).
 */
export async function createRun(input, actor) {
  await ensureAgentRunnerSchema();
  const agent = getAgent(text(input.agentKey));
  if (!agent) throw err('Choose an agent from the roster');
  const files = describeAgent(agent);
  if (files.problem) throw err(files.problem, 500);
  const settings = await readSettings();
  const params = input.params && typeof input.params === 'object' ? { ...input.params } : {};
  const prompt = text(input.prompt);
  let loopRow = null; let workOrder = null; let pinned = null; let branch = text(input.branch) || null;
  let featureKey = text(params.feature) || null;
  const fixtureScenario = text(input.fixtureScenario) || null;
  if (fixtureScenario && !listFixtureScenarios().some((s) => s.key === fixtureScenario)) throw err(`Fixture scenario "${fixtureScenario}" does not exist`);

  if (agent.mode === 'quality') {
    if (!prompt && !['release_test_runner', 'release_test_planner'].includes(agent.key)) throw err('Write your request for the agent');
    if (agent.key === 'release_test_runner') {
      if (!featureKey) throw err('Choose the feature to test');
      params.suite = params.suite || 'smoke';
      if (!['smoke', 'regression'].includes(params.suite)) throw err('Suite must be smoke or regression');
      pinned = pinBaseline(featureKey);
      if (!pinned) throw err(`No frozen baseline exists for "${featureKey}", so there is nothing pinned to run`, 409);
    }
    if (agent.key === 'release_test_extender') {
      if (!featureKey) throw err('Choose the feature the new steps are for');
      pinned = pinBaseline(featureKey);
      if (!pinned) throw err(`No frozen baseline exists for "${featureKey}", so a step cannot be added to it`, 409);
    }
    if (agent.key === 'release_bug_triager') {
      const lid = Number(params.loopRunId ?? input.loopRunId);
      if (!Number.isInteger(lid) || lid < 1) throw err('Choose the release-loop run the bug belongs to');
      loopRow = await getLoopRow(lid);
      if (loopRow.status !== 'active') throw err('That release-loop run is closed', 409);
      featureKey = loopRow.feature_key;
    }
    if (agent.key === 'release_test_planner') {
      const files2 = (Array.isArray(params.changedFiles) ? params.changedFiles : String(params.changedFiles ?? '').split(/[\n,]/)).map((f) => String(f).trim()).filter(Boolean);
      if (!files2.length) throw err('List at least one changed file');
      params.changedFiles = files2;
    }
    if (agent.key === 'release_backlog_gardener') {
      const sid = Number(params.seedId);
      if (!Number.isInteger(sid)) throw err('Choose the backlog seed to grow');
      const seed = await seeds.getSeed(sid);
      if (!['seed', 'shaped'].includes(seed.stage)) throw err(`A seed that is ${seed.stage} is no longer shaped by the gardener`, 409);
      params.seedId = sid;
    }
  } else if (agent.key === 'release_validator') {
    loopRow = await getLoopRow(input.loopRunId);
    if (loopRow.status !== 'active') throw err('That release-loop run is closed', 409);
    if (loopRow.stage !== 'validate') throw err(`A validation round starts while the run is in the "validate" stage (it is in "${loopRow.stage}")`, 409);
    featureKey = loopRow.feature_key;
    pinned = pinBaseline(featureKey);
    if (!pinned) throw err(`No frozen baseline exists for "${featureKey}": a validation round runs only against a pinned baseline (spec governance)`, 409);
  } else if (agent.key === 'release_fixer') {
    loopRow = await getLoopRow(input.loopRunId);
    if (loopRow.status !== 'active') throw err('That release-loop run is closed', 409);
    if (loopRow.stage !== 'fix') throw err(`A fix run starts while the run is in the "fix" stage (it is in "${loopRow.stage}")`, 409);
    featureKey = loopRow.feature_key;
    let wo = input.workOrder;
    if (!wo) {
      const keys = Array.isArray(input.bugKeys) ? input.bugKeys : [];
      if (!keys.length) throw err('Give the work order, or choose the bugs whose work orders it is built from');
      const bugs = await db.prepare(`SELECT * FROM release_loop_bugs WHERE run_id=$1 AND bug_key = ANY($2)`).all(loopRow.id, keys);
      wo = { items: keys.map((k) => {
        const b = bugs.find((x) => x.bug_key === k);
        if (!b) throw err(`Bug ${k} does not belong to this run`, 404);
        if (!b.work_order) throw err(`Bug ${k} has no work order yet: ask the bug triager to file one, or write it here`, 409);
        return { key: k, ...b.work_order, size: b.work_order.size || b.size };
      }) };
    }
    workOrder = validateWorkOrder(wo, settings);
    const bugs = await db.prepare(`SELECT bug_key, status FROM release_loop_bugs WHERE run_id=$1`).all(loopRow.id);
    for (const it of workOrder.items) {
      const b = bugs.find((x) => x.bug_key === it.key);
      if (!b) throw err(`Item ${it.key} is not a bug of this run`, 404);
      if (!['open', 'recurred', 'fixing'].includes(b.status)) throw err(`Bug ${it.key} is ${b.status.replace(/_/g, ' ')} and cannot be fixed now`, 409);
    }
    branch = branch || `release-loop/${featureKey}-fix-r${loopRow.fix_rounds}`;
  } else if (agent.key === 'release_integrator') {
    if (!branch) throw err('Give the branch to integrate');
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branch)) throw err('Branch names may use letters, digits, ".", "_", "-" and "/" only');
    if (input.loopRunId) { loopRow = await getLoopRow(input.loopRunId); featureKey = loopRow.feature_key; }
    if (input.workOrder) workOrder = validateWorkOrder(input.workOrder, settings);
  }
  if (loopRow) {
    const dup = await db.prepare(`SELECT id FROM agent_runner_runs WHERE loop_run_id=$1 AND agent_key=$2 AND status = ANY($3) LIMIT 1`).get(loopRow.id, agent.key, OPEN_STATUSES);
    if (dup && agent.mode === 'stage' && agent.key !== 'release_integrator') throw err(`${files.name} run #${dup.id} is already queued or running for this release-loop run`, 409);
  }
  const now = Date.now();
  const row = await db.prepare(
    `INSERT INTO agent_runner_runs (agent_key, kind, loop_run_id, feature_key, prompt, prompt_version, params, work_order, branch, pinned_baseline, fixture_scenario, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb,$11,$12,$13,$13) RETURNING *`,
  ).get(agent.key, agent.mode, loopRow ? Number(loopRow.id) : null, featureKey, prompt || null, files.version, params, workOrder, branch, pinned, fixtureScenario, actor?.label || 'admin', now);
  await addTimeline(row.id, [{ type: 'queued', text: `Queued by ${actor?.label || 'admin'}${workOrder ? ` with a work order of ${workOrder.items.length} item${workOrder.items.length === 1 ? '' : 's'}` : ''}` }]);
  await recordEvent({ kind: 'agent_run', ref: String(row.id), type: 'queued', releaseKey: loopRow?.release_key || null, state: 'queued', note: `${agent.key}${featureKey ? ` · ${featureKey}` : ''}`, actor });
  return getRun(row.id);
}

async function addTimeline(runId, events) {
  const row = await db.prepare(`SELECT seq, jsonb_array_length(timeline) AS len FROM agent_runner_runs WHERE id=$1`).get(runId);
  if (!row) return 0;
  let seq = Number(row.seq);
  let room = TIMELINE_CAP - Number(row.len);
  const add = [];
  for (const e of events) {
    const critical = e.type !== 'progress' && e.type !== 'edit_ok';
    if (!critical && room <= 0) continue;
    seq += 1; room -= 1;
    add.push({ seq, at: Date.now(), ...e });
  }
  if (!add.length) return seq;
  await db.prepare(`UPDATE agent_runner_runs SET timeline = timeline || $1::jsonb, seq=$2, last_event_at=$3, updated_at=$3 WHERE id=$4`).run(add, seq, Date.now(), runId);
  return seq;
}

export async function listRuns({ status, loopRunId, agentKey, limit = 50 } = {}) {
  await ensureAgentRunnerSchema();
  const settings = await readSettings();
  const where = []; const args = [];
  if (status) { args.push(status); where.push(`status=$${args.length}`); }
  if (loopRunId) { args.push(Number(loopRunId)); where.push(`loop_run_id=$${args.length}`); }
  if (agentKey) { args.push(agentKey); where.push(`agent_key=$${args.length}`); }
  args.push(Math.min(Number(limit) || 50, 200));
  const rows = await db.prepare(`SELECT * FROM agent_runner_runs ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT $${args.length}`).all(...args);
  const out = [];
  for (const r of rows) out.push({ ...mapRun(r, settings), waitingFor: await waitingFor(r) });
  return out;
}

async function waitingFor(r) {
  if (r.status !== 'queued' || r.agent_key !== 'release_integrator') return null;
  const other = await db.prepare(`SELECT id FROM agent_runner_runs WHERE status='running' AND agent_key='release_integrator' AND COALESCE(branch,'')=COALESCE($1,'') ORDER BY id LIMIT 1`).get(r.branch);
  return other ? `Waiting for integration run #${other.id} on branch ${r.branch} to finish (one integration at a time per branch)` : null;
}

export async function getRun(id) {
  const row = await getRunRow(id);
  const settings = await readSettings();
  const outputs = (await db.prepare(`SELECT * FROM agent_runner_outputs WHERE run_id=$1 ORDER BY id`).all(row.id)).map(mapOutput);
  return { ...mapRun(row, settings, { detail: true }), waitingFor: await waitingFor(row), outputs };
}

export async function stopRun(id, actor) {
  const row = await getRunRow(id);
  const settings = await readSettings();
  if (!OPEN_STATUSES.includes(row.status)) throw err(`This run is already ${row.status.replace('_', ' ')}`, 409);
  const who = actor?.label || 'admin';
  if (row.status === 'queued') {
    await db.prepare(`UPDATE agent_runner_runs SET status='stopped', stop_requested=true, stopped_by=$1, finished_at=$2, updated_at=$2 WHERE id=$3`).run(who, Date.now(), row.id);
    await addTimeline(row.id, [{ type: 'stopped', text: `Stopped by ${who} before it started` }]);
  } else {
    const stalled = row.last_event_at != null && Date.now() - Number(row.last_event_at) > settings.staleSeconds * 1000;
    await db.prepare(`UPDATE agent_runner_runs SET stop_requested=true, stopped_by=$1, updated_at=$2 WHERE id=$3`).run(who, Date.now(), row.id);
    await addTimeline(row.id, [{ type: 'stop_requested', text: `${who} asked the session to stop` }]);
    // A worker that has gone silent cannot acknowledge: the platform closes the run itself and says so.
    if (stalled) {
      await db.prepare(`UPDATE agent_runner_runs SET status='stopped', finished_at=$1, updated_at=$1 WHERE id=$2`).run(Date.now(), row.id);
      await addTimeline(row.id, [{ type: 'stopped', text: `Closed by ${who}: the worker had stopped reporting` }]);
    }
  }
  await recordEvent({ kind: 'agent_run', ref: String(row.id), type: 'stop', state: 'stopped', note: `Stop requested by ${who}`, actor });
  const after = await getRunRow(row.id);
  if (after.status === 'stopped') await afterFailure(row.id, 'stopped', `Stopped by ${who}`);
  return getRun(row.id);
}

/** A run that stopped reporting goes back on the queue; the old claim can no longer complete it. */
export async function requeueRun(id, actor) {
  const row = await getRunRow(id);
  const settings = await readSettings();
  if (row.status !== 'running') throw err('Only a running run can be put back on the queue', 409);
  const stalled = row.last_event_at != null && Date.now() - Number(row.last_event_at) > settings.staleSeconds * 1000;
  if (!stalled) throw err(`This run reported ${Math.round((Date.now() - Number(row.last_event_at)) / 1000)} seconds ago, so it is not stalled (stalled means no update for ${settings.staleSeconds} seconds)`, 409);
  await db.prepare(`UPDATE agent_runner_runs SET status='queued', claimed_by=NULL, claimed_at=NULL, stop_requested=false, stopped_by=NULL, updated_at=$1 WHERE id=$2`).run(Date.now(), row.id);
  await addTimeline(row.id, [{ type: 'requeued', text: `${actor?.label || 'admin'} put the stalled run back on the queue (attempt ${Number(row.attempts) + 1} next)` }]);
  return getRun(row.id);
}

/** A new run with the same inputs and the CURRENT (possibly widened) work order, after a scope decision or a failure. */
export async function retryRun(id, actor) {
  const row = await getRunRow(id);
  if (OPEN_STATUSES.includes(row.status)) throw err('This run is still open', 409);
  const input = {
    agentKey: row.agent_key, prompt: row.prompt, params: row.params || {}, fixtureScenario: row.fixture_scenario, branch: row.branch,
    loopRunId: row.loop_run_id, workOrder: row.work_order || undefined,
  };
  return createRun(input, actor);
}

// ── worker protocol ─────────────────────────────────────────────────────────
export async function claimNextRun(workerId) {
  await ensureAgentRunnerSchema();
  const s = await readSettings();
  const now = Date.now();
  const row = await db.prepare(
    `UPDATE agent_runner_runs SET status='running', claimed_by=$1, claimed_at=$2, started_at=COALESCE(started_at,$2), last_event_at=$2, attempts=attempts+1, updated_at=$2
      WHERE id = (
        SELECT q.id FROM agent_runner_runs q
         WHERE q.status='queued'
           AND (SELECT COUNT(*) FROM agent_runner_runs r WHERE r.status='running') < $3
           AND NOT (q.agent_key='release_integrator' AND EXISTS (
                 SELECT 1 FROM agent_runner_runs r WHERE r.status='running' AND r.agent_key='release_integrator' AND COALESCE(r.branch,'')=COALESCE(q.branch,'')))
         ORDER BY q.id LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING *`,
  ).get(workerId, now, s.concurrency);
  if (!row) return null;
  await addTimeline(row.id, [{ type: 'claimed', text: `Claimed by worker ${workerId}` }]);
  const agent = getAgent(row.agent_key);
  const files = readAgentFiles(row.agent_key);
  // The worker needs everything to run the session; it needs no secret beyond its own API key and (optionally) the GitHub token.
  let pinned = null; let suiteStepIds = null;
  if (row.pinned_baseline) {
    pinned = loadBaseline(row.pinned_baseline.feature, row.pinned_baseline.version, { allowFixture: true });
    if (row.agent_key === 'release_test_runner' && (row.params || {}).suite === 'smoke') suiteStepIds = loadSmoke(row.feature_key, { allowFixture: true })?.stepIds || null;
  }
  return {
    run: mapRun(row, s), agent: { key: agent.key, name: files.name, version: files.version, prompt: files.prompt, canEditCode: agent.canEditCode }, resultSchema: RESULT_SCHEMAS[agent.schema],
    prompt: buildInstruction(row, agent, pinned, suiteStepIds), workOrder: row.work_order || null, params: row.params || {}, fixtureScenario: row.fixture_scenario,
    pinnedBaseline: pinned ? { feature: pinned.feature, version: pinned.version, specSha256: pinned.specSha256, steps: pinned.steps } : null, suiteStepIds,
    branch: row.branch, model: s.model, turnLimit: s.turnLimit, sizeLimits: s.sizeLimits,
  };
}

function buildInstruction(row, agent, pinned, suiteStepIds) {
  const lines = [];
  if (row.prompt) lines.push(`The owner's request:\n${row.prompt}`);
  if (pinned) lines.push(`Pinned baseline: ${pinned.feature} v${pinned.version} (spec sha ${String(pinned.specSha256).slice(0, 12)}). Test only this version.`);
  if (suiteStepIds) lines.push(`Run ONLY these step ids (the smoke suite): ${suiteStepIds.join(', ')}.`);
  if ((row.params || {}).suite === 'regression') lines.push('Run the FULL baseline (regression).');
  if (row.work_order) lines.push(`Your work order (you may do what it lists and nothing else):\n${JSON.stringify(row.work_order.items, null, 2)}\nForbidden: ${row.work_order.forbidden.join(', ')}\nCommit messages must name the item they serve.`);
  if (row.branch) lines.push(`Branch: ${row.branch}`);
  const p = row.params || {};
  if (p.changedFiles) lines.push(`Changed files given: ${p.changedFiles.join(', ')}`);
  if (p.seedId) lines.push(`Backlog seed id: ${p.seedId}`);
  if (row.loop_run_id) lines.push(`Release-loop run id: ${row.loop_run_id}`);
  lines.push(`Return ONE JSON object matching the result schema for ${agent.key}.`);
  return lines.join('\n\n');
}

async function assertClaim(row, workerId) {
  if (row.status !== 'running') throw err(`Run ${row.id} is ${row.status}, not running`, 409, { code: 'not_running' });
  if (row.claimed_by !== workerId) throw err(`Run ${row.id} is not claimed by this worker`, 409, { code: 'not_claimed' });
}

/** Progress from the worker. Also the heartbeat and the stop/work-order channel. */
export async function appendEvents(runId, workerId, events = [], { workOrderVersion = 0 } = {}) {
  const row = await getRunRow(runId);
  await assertClaim(row, workerId);
  const loopRow = row.loop_run_id ? await getLoopRow(row.loop_run_id).catch(() => null) : null;
  const clean = [];
  for (const e of Array.isArray(events) ? events : []) {
    const type = text(e?.type);
    if (!['progress', 'step', 'edit_ok', 'edit_refused', 'usage'].includes(type)) throw err(`Unknown event type "${type}"`);
    if (type === 'step') {
      // Live steps arrive in the Release loop screen as they happen (reuse of release_loop_steps).
      if (loopRow && row.agent_key === 'release_validator' && loopRow.status === 'active' && loopRow.stage === 'validate') {
        const status = ['pass', 'fail', 'ambiguous', 'info', 'page_error', 'failed_request'].includes(e.status) ? e.status : 'info';
        await addStep(loopRow.id, { stepId: e.stepId, surface: e.surface, status, note: e.note });
      }
      clean.push({ type, stepId: e.stepId, surface: e.surface, status: e.status, note: e.note });
    } else if (type === 'edit_refused') clean.push({ type, file: e.file, code: e.code, text: e.reason });
    else if (type === 'edit_ok') clean.push({ type, file: e.file, added: e.added ?? null, deleted: e.deleted ?? null });
    else if (type === 'usage') clean.push({ type, usage: e.usage });
    else clean.push({ type, text: String(e.text ?? '').slice(0, 600) });
  }
  if (clean.length) await addTimeline(row.id, clean);
  else await db.prepare(`UPDATE agent_runner_runs SET last_event_at=$1 WHERE id=$2`).run(Date.now(), row.id);
  const fresh = await getRunRow(runId);
  const approvals = (fresh.work_order?.approvals || []).length;
  return { stop: fresh.stop_requested, workOrder: approvals !== Number(workOrderVersion) ? fresh.work_order : undefined, workOrderVersion: approvals };
}

/** The agent could not edit a file the work order does not list: it files a request instead of working around the refusal. */
export async function recordScopeRequest(runId, workerId, req) {
  const row = await getRunRow(runId);
  await assertClaim(row, workerId);
  if (!row.work_order) throw err('This run has no work order to widen', 409);
  const file = text(req?.file); const item = text(req?.item); const why = text(req?.why);
  if (!file || !why) throw err('A scope request names the file and says why');
  const wo = row.work_order;
  const it = wo.items.find((x) => x.key === item) || wo.items[0];
  let ownerInfo;
  try { ownerInfo = scopeNeedsOwner(file); } catch (e) { throw err(e.message); }
  const ownerRequired = ownerInfo.owner || it.size === 'L';
  const reason = ownerInfo.owner ? ownerInfo.reason : it.size === 'L' ? 'The item is already size L.' : null;
  const list = row.scope_requests || [];
  if (list.some((s) => s.file === file && s.item === it.key && s.status === 'pending')) return list.find((s) => s.file === file && s.item === it.key && s.status === 'pending');
  const entry = { id: `S${list.length + 1}`, file, item: it.key, why, status: 'pending', ownerRequired, ownerReason: reason, requestedAt: Date.now(), decidedBy: null, decidedAt: null, note: null };
  await db.prepare(`UPDATE agent_runner_runs SET scope_requests = scope_requests || $1::jsonb, updated_at=$2 WHERE id=$3`).run([entry], Date.now(), row.id);
  await addTimeline(row.id, [{ type: 'scope_request', text: `Scope request ${entry.id}: ${file} for ${it.key}. ${why}` }]);
  return entry;
}

export async function decideScopeRequest(runId, requestId, { decision, note } = {}, actor, userId) {
  const row = await getRunRow(runId);
  const list = row.scope_requests || [];
  const req = list.find((s) => s.id === requestId);
  if (!req) throw err('Scope request not found', 404);
  if (req.status !== 'pending') throw err(`Scope request ${req.id} was already ${req.status}`, 409);
  if (!['approve', 'decline'].includes(decision)) throw err('Decision must be "approve" or "decline"');
  const n2 = text(note);
  if (!n2) throw err('Say why you decided this');
  let wo = row.work_order;
  if (decision === 'approve') {
    // Widening a work order is an approve path: same server-side gate as every finalize path.
    if (userId != null) await assertReadyToFinalize(userId);
    wo = widenWorkOrder(wo, { file: req.file, item: req.item, approvedBy: actor?.label || 'admin', note: n2 });
  }
  const next = list.map((s) => (s.id === req.id ? { ...s, status: decision === 'approve' ? 'approved' : 'declined', decidedBy: actor?.label || 'admin', decidedAt: Date.now(), note: n2 } : s));
  await db.prepare(`UPDATE agent_runner_runs SET scope_requests=$1::jsonb, work_order=$2::jsonb, updated_at=$3 WHERE id=$4`).run(next, wo, Date.now(), row.id);
  await addTimeline(row.id, [{ type: 'scope_decision', text: `Scope request ${req.id} ${decision === 'approve' ? 'approved' : 'declined'} by ${actor?.label || 'admin'}: ${n2}${decision === 'approve' ? ` (${req.file} added to ${req.item})` : ''}` }]);
  return getRun(row.id);
}

// ── completion ──────────────────────────────────────────────────────────────
async function finish(runId, patch) {
  const sets = []; const args = [];
  const col = { status: 'status', error: 'error', errorCode: 'error_code', result: 'result', usage: 'usage', diff: 'diff', checks: 'checks', adapter: 'adapter' };
  const jsonb = new Set(['result', 'usage', 'diff', 'checks']);
  for (const [k, c] of Object.entries(col)) if (patch[k] !== undefined) { args.push(patch[k]); sets.push(`${c}=$${args.length}${jsonb.has(k) ? '::jsonb' : ''}`); }
  args.push(Date.now()); sets.push(`finished_at=$${args.length}`, `updated_at=$${args.length}`);
  args.push(runId);
  await db.prepare(`UPDATE agent_runner_runs SET ${sets.join(', ')} WHERE id=$${args.length}`).run(...args);
}

/** A failed, refused or stopped run on a release-loop run is a reconciliation item: the run cannot be marked done until a person closes it. */
async function afterFailure(runId, status, description) {
  const row = await getRunRow(runId);
  if (!row.loop_run_id || !['failed', 'scope_exceeded', 'stopped'].includes(status)) return;
  const loopRow = await getLoopRow(row.loop_run_id).catch(() => null);
  if (!loopRow || loopRow.status !== 'active') return;
  const label = `Agent run #${row.id} (${row.agent_key})`;
  const dup = await db.prepare(`SELECT id FROM release_failed_runs WHERE release_id=$1 AND feature_key=$2 AND label=$3 LIMIT 1`).get(loopRow.release_id, loopRow.feature_key, label);
  if (dup) return;
  await addManualFailedRun({
    releaseId: Number(loopRow.release_id), featureKey: loopRow.feature_key, runKind: 'agent_run', role: row.agent_key, label,
    state: status === 'scope_exceeded' ? 'refused' : status === 'stopped' ? 'partial' : 'failed', failureClass: 'unclassified', description,
    stateLeft: status === 'scope_exceeded' ? 'The branch was not merged; the agent\'s notes are kept on the run' : status === 'stopped' ? 'The session was interrupted; nothing was merged' : 'No result was recorded',
  }, { id: null, label: 'agent runner' });
}

/**
 * The worker hands in the end of a session. Everything is verified here, server-side, whatever the worker says:
 * the claim, the result schema, the pinned baseline, the work-order diff. An invalid or missing result is a
 * failed run with the reason, never a pass.
 */
export async function completeRun(runId, workerId, payload = {}) {
  const row = await getRunRow(runId);
  await assertClaim(row, workerId);
  const agent = getAgent(row.agent_key);
  const adapter = text(payload.adapter) || null;
  const usage = payload.usage && typeof payload.usage === 'object' ? payload.usage : null;
  const stoppedBy = row.stopped_by;
  const fail = async (status, error, code, extra = {}) => {
    await finish(row.id, { status, error, errorCode: code || null, usage, adapter, ...extra });
    await addTimeline(row.id, [{ type: status === 'scope_exceeded' ? 'scope_exceeded' : 'failed', text: error }]);
    await recordEvent({ kind: 'agent_run', ref: String(row.id), type: status, state: status, note: error.slice(0, 300), details: { code: code || null } });
    await afterFailure(row.id, status, error);
    return getRun(row.id);
  };
  if (payload.stopped || row.stop_requested) {
    await finish(row.id, { status: 'stopped', error: null, usage, adapter });
    await addTimeline(row.id, [{ type: 'stopped', text: `Stopped by ${stoppedBy || 'admin'}; the session was interrupted` }]);
    await afterFailure(row.id, 'stopped', `Stopped by ${stoppedBy || 'admin'}`);
    return getRun(row.id);
  }
  if (payload.error) return fail('failed', `The session failed: ${text(payload.error)}`, 'session_error', { result: payload.result ?? null });
  if (payload.result === undefined || payload.result === null) return fail('failed', 'The session ended without a result. Nothing was recorded and nothing counts as passed.', 'no_result');
  const problems = validateResult(RESULT_SCHEMAS[agent.schema], payload.result);
  if (problems.length) return fail('failed', `The result does not match its schema: ${problems.slice(0, 6).join('; ')}`, 'invalid_result', { result: payload.result });
  const result = payload.result;

  // Work-order runs: the server re-checks the branch diff, whatever the worker reported.
  let checks = null;
  if (row.work_order && agent.canEditCode) {
    if (!payload.diff || !Array.isArray(payload.diff.files)) return fail('failed', 'The worker did not report the branch diff, so the work order cannot be checked and nothing is merged', 'no_diff', { result });
    checks = checkDiff(row.work_order, payload.diff);
    if (!checks.ok) {
      return fail('scope_exceeded', `SCOPE_EXCEEDED: ${checks.violations.map((v) => v.detail).join('; ')}. The branch was not merged; the agent's notes are kept for triage.`, 'SCOPE_EXCEEDED', { result, diff: payload.diff, checks });
    }
  }
  try {
    const applied = await applyResult(row, agent, result, payload);
    await finish(row.id, { status: 'succeeded', error: null, result, usage, diff: payload.diff ?? null, checks: checks ? { ...checks, ...(applied.checks || {}) } : applied.checks || null, adapter });
    await addTimeline(row.id, [{ type: 'succeeded', text: applied.summary || 'Finished' }]);
    await recordEvent({ kind: 'agent_run', ref: String(row.id), type: 'succeeded', state: 'succeeded', note: (applied.summary || '').slice(0, 300) });
  } catch (e) {
    return fail('failed', e.message, e.code || 'apply_failed', { result, diff: payload.diff ?? null, checks });
  }
  return getRun(row.id);
}

async function scoreAgainstBaseline(baseline, steps, subsetIds) {
  const mod = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts/release-spec-baseline.mjs')).href);
  const b = subsetIds ? { ...baseline, steps: baseline.steps.filter((s) => s.kind === 'precondition' || subsetIds.includes(s.id)) } : baseline;
  return mod.score(b, steps.map((s) => ({ id: s.id, surface: s.surface, result: s.result })));
}

async function applyResult(row, agent, result, payload) {
  const now = Date.now();
  const mk = async (kind, status, title, body, ref = {}) => {
    const o = await db.prepare(
      `INSERT INTO agent_runner_outputs (run_id, kind, status, title, feature_key, payload, ref, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8) RETURNING *`,
    ).get(row.id, kind, status, title, row.feature_key, body, ref, now);
    return mapOutput(o);
  };
  switch (agent.key) {
    case 'release_validator': return applyValidation(row, result);
    case 'release_fixer': return applyFix(row, result);
    case 'release_integrator': return { summary: result.merged ? `Merged ${row.branch} (head ${result.head}); build ${result.buildPassed ? 'passed' : 'FAILED'}` : `Not merged: ${result.conflicts.length} conflict${result.conflicts.length === 1 ? '' : 's'}` };
    case 'release_test_script_writer': {
      const mod = await import(pathToFileURL(path.join(REPO_ROOT, 'scripts/release-spec-baseline.mjs')).href);
      const parsed = mod.parseSpec(result.markdown);
      const journeySteps = parsed.steps.filter((s) => s.kind === 'step');
      const pre = parsed.steps.filter((s) => s.kind === 'precondition');
      if (!journeySteps.length || !pre.length) throw err(`The draft does not parse as a training spec: it needs a "## Preconditions" section and at least one "## Journey <n>" section with numbered steps (found ${pre.length} preconditions and ${journeySteps.length} journey steps)`, 400, { code: 'draft_unparseable' });
      const o = await mk('draft_spec', 'proposed', result.title, { ...result, stepCount: journeySteps.length, preconditionCount: pre.length, edgeCount: parsed.steps.filter((s) => s.kind === 'edge').length });
      return { summary: `Draft spec "${result.title}" parsed: ${pre.length} preconditions, ${journeySteps.length} journey steps. Waiting for a person's decision (output #${o.id})` };
    }
    case 'release_test_runner': {
      const feature = row.pinned_baseline?.feature;
      const baseline = loadBaseline(feature, row.pinned_baseline?.version, { allowFixture: true });
      if (!baseline) throw err(`The pinned baseline ${feature} v${row.pinned_baseline?.version} could not be read`);
      if (result.feature !== feature) throw err(`The results are for "${result.feature}" but the run is pinned to "${feature}"`);
      if (Number(result.baselineVersion) !== Number(baseline.version)) throw err(`The results were scored against baseline v${result.baselineVersion}, not the pinned v${baseline.version}; nothing was recorded`, 409, { code: 'BASELINE_MISMATCH' });
      const subset = (row.params || {}).suite === 'smoke' ? (loadSmoke(feature, { allowFixture: true })?.stepIds || []) : null;
      const score = await scoreAgainstBaseline(baseline, result.steps, subset);
      const o = await mk('test_results', 'recorded', `${feature} ${row.params.suite} v${baseline.version}: ${score.passed} of ${score.total}`, { feature, suite: row.params.suite, baselineVersion: baseline.version, specSha256: baseline.specSha256, score, steps: result.steps, observations: result.observations || [], smokeSource: subset ? loadSmoke(feature, { allowFixture: true })?.source : null });
      return { summary: `${row.params.suite} results recorded (output #${o.id}): ${score.passed} of ${score.total} steps passed on baseline v${baseline.version}`, checks: { score } };
    }
    case 'release_test_extender': {
      const baseline = loadBaseline(row.pinned_baseline?.feature, row.pinned_baseline?.version, { allowFixture: true });
      const known = new Set((baseline?.steps || []).map((s) => s.id));
      const needsOwner = [];
      result.changes.forEach((c, i) => {
        if (c.op !== 'add' && !c.stepId) throw err(`Change ${i + 1}: a "${c.op}" names the step id it changes`);
        if (c.stepId && c.op !== 'add' && !known.has(c.stepId)) throw err(`Change ${i + 1}: baseline v${baseline.version} has no step ${c.stepId}`);
        if (c.op === 'retire' && !text(c.duplicateOf)) needsOwner.push(c.stepId);
      });
      const o = await mk('amendment_proposal', 'proposed', `Amendment for ${row.pinned_baseline.feature}: ${result.changes.length} change${result.changes.length === 1 ? '' : 's'}`, { ...result, fromBaseline: baseline.version, proposedBy: agent.key, needsOwner });
      return { summary: `Amendment proposal recorded (output #${o.id}) against baseline v${baseline.version}${needsOwner.length ? `; removal of ${needsOwner.join(', ')} goes to the owner (no duplicate named)` : ''}` };
    }
    case 'release_bug_triager': {
      const loopRow = await getLoopRow(row.loop_run_id);
      const dupKey = text(result.duplicateOf);
      if (dupKey) {
        const dup = await db.prepare(`SELECT bug_key FROM release_loop_bugs WHERE run_id=$1 AND bug_key=$2`).get(loopRow.id, dupKey);
        if (!dup) throw err(`The agent linked the report to ${dupKey}, which is not a bug of this run`);
        const o = await mk('bug', 'linked', `Duplicate of ${dupKey}: ${result.title}`, result, { duplicateOf: dupKey });
        return { summary: `Linked as a duplicate of ${dupKey}; no new bug filed (output #${o.id})` };
      }
      const bug = await createBug(loopRow.id, { title: result.title, triageClass: result.triageClass, stepId: result.stepId, observed: result.observed, question: result.question || (result.triageClass === 'needs_business_definition' ? result.proposedFix : '') }, { id: null, label: 'Bug triager' });
      const wo = { intent: result.proposedFix, files: result.files, size: result.size, doneWhen: result.doneWhen };
      await db.prepare(`UPDATE release_loop_bugs SET work_order=$1::jsonb, size=$2 WHERE id=$3`).run({ ...wo, rootCause: result.rootCause }, result.size, bug.id);
      const o = await mk('bug', 'filed', `${bug.bugKey}: ${result.title}`, result, { bugId: bug.id, bugKey: bug.bugKey, loopRunId: Number(loopRow.id) });
      return { summary: `Filed bug ${bug.bugKey} (${result.triageClass}, size ${result.size}) with its work order (output #${o.id})` };
    }
    case 'release_test_planner': {
      const settings = await readSettings();
      const plan = buildTestPlan(result.changedFiles, { sharedModules: settings.sharedModules, allowFixture: true });
      const o = await mk('test_plan', 'recorded', `Test plan: ${plan.smoke.length} smoke suites, ${plan.regression.length} regression baseline${plan.regression.length === 1 ? '' : 's'}`, { ...plan, rationale: result.rationale });
      return { summary: `Test plan recorded (output #${o.id}): smoke for ${plan.smoke.length} features, regression for ${plan.regression.length}` };
    }
    case 'release_enhancement_proposer': {
      const o = await mk('enhancement_proposal', 'proposed', result.title, result);
      return { summary: `Enhancement proposal "${result.title}" recorded (output #${o.id}); waiting for your decision` };
    }
    case 'release_backlog_gardener': {
      if (Number(result.seedId) !== Number((row.params || {}).seedId)) throw err(`The gardener answered for seed ${result.seedId} but was asked about seed ${(row.params || {}).seedId}; nothing was changed`);
      const seed = await seeds.applyShaping(Number(result.seedId), result, { by: 'Backlog gardener', runId: row.id });
      const o = await mk('shaped_seed', 'applied', `Seed #${seed.id} ${seed.title}: ${seed.stage}`, { ...result, stageAfter: seed.stage }, { seedId: seed.id });
      return { summary: `Seed #${seed.id} is now "${seed.stage}" with ${seed.data.openQuestions.length} open question${seed.data.openQuestions.length === 1 ? '' : 's'} for you (output #${o.id})` };
    }
    default: throw err(`No handler for ${agent.key}`, 500);
  }
}

async function applyValidation(row, result) {
  const loopRow = await getLoopRow(row.loop_run_id);
  const pin = row.pinned_baseline;
  const baseline = loadBaseline(pin.feature, pin.version, { allowFixture: true });
  if (!baseline) throw err(`The pinned baseline ${pin.feature} v${pin.version} could not be read`);
  // Specification governance: a round scored against any baseline other than the pinned one is refused.
  if (Number(result.baselineVersion) !== Number(pin.version)) {
    throw err(`The agent scored against baseline v${result.baselineVersion}, but v${pin.version} is pinned for this round. Nothing was recorded; a validation round counts only against its pinned baseline.`, 409, { code: 'BASELINE_MISMATCH' });
  }
  const score = await scoreAgainstBaseline(baseline, result.steps);
  const passed = score.total > 0 && score.passed === score.total;
  // Steps the agent reported but never streamed live are added now, so the Live steps card is complete.
  const have = new Set((await db.prepare(`SELECT step_id, surface FROM release_loop_steps WHERE run_id=$1`).all(loopRow.id)).map((s) => `${s.step_id}|${s.surface}`));
  for (const s of result.steps) {
    if (have.has(`${s.id}|${s.surface}`)) continue;
    await addStep(loopRow.id, { stepId: s.id, surface: s.surface, status: s.result === 'pass' ? 'pass' : 'fail', note: s.seen || null });
  }
  const claimedMismatch = result.passed !== passed;
  await recordRound(loopRow.id, {
    passed, stepsPassed: score.passed, stepsTotal: score.total, consoleErrors: result.consoleErrors ?? 0, failedRequests: result.failedRequests ?? 0, commitSha: result.commitTested,
  }, { id: null, label: 'Validation agent' });
  return {
    checks: { score, baselineVersion: pin.version, agentClaimedPassed: result.passed, claimMatchedScore: !claimedMismatch },
    summary: `Round recorded from baseline ${pin.feature} v${pin.version}: ${score.passed} of ${score.total} steps passed (${passed ? 'passed' : 'failed'})${claimedMismatch ? `; the agent claimed ${result.passed ? 'a pass' : 'a failure'}, the baseline score decided` : ''}`,
  };
}

async function applyFix(row, result) {
  const loopRow = await getLoopRow(row.loop_run_id);
  const keys = new Set(row.work_order.items.map((i) => i.key));
  const done = [];
  for (const f of result.fixed) {
    if (!keys.has(f.id)) throw err(`The agent reports a fix for ${f.id}, which is not in the work order`);
    const bug = await db.prepare(`SELECT * FROM release_loop_bugs WHERE run_id=$1 AND bug_key=$2`).get(loopRow.id, f.id);
    if (!bug) throw err(`Bug ${f.id} no longer exists on this run`);
    if (bug.status !== 'fixing') await startFix(bug.id, { id: null, label: 'Fix agent' });
    await recordFix(bug.id, { summary: f.what, files: f.files }, { id: null, label: 'Fix agent' });
    done.push(f.id);
  }
  return { summary: `Fix branch ${result.branch} (${result.commit}): ${done.length} item${done.length === 1 ? '' : 's'} fixed${result.notFixed.length ? `, ${result.notFixed.length} not fixed (${result.notFixed.map((x) => x.id).join(', ')})` : ''}; diff within the work order, ready for the integrator` };
}

// ── outputs (governed objects awaiting a person) ─────────────────────────────
export async function listOutputs({ kind, status, limit = 50 } = {}) {
  await ensureAgentRunnerSchema();
  const where = []; const args = [];
  if (kind) { args.push(kind); where.push(`kind=$${args.length}`); }
  if (status) { args.push(status); where.push(`status=$${args.length}`); }
  args.push(Math.min(Number(limit) || 50, 200));
  return (await db.prepare(`SELECT * FROM agent_runner_outputs ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT $${args.length}`).all(...args)).map(mapOutput);
}
export async function getOutput(id) {
  await ensureAgentRunnerSchema();
  const row = await db.prepare(`SELECT * FROM agent_runner_outputs WHERE id=$1`).get(Number(id));
  if (!row) throw err('Output not found', 404);
  return mapOutput(row);
}

const DECIDABLE = { draft_spec: ['approve', 'reject'], amendment_proposal: ['approve', 'reject'], enhancement_proposal: ['accept', 'decline'] };
const STATUS_AFTER = { approve: 'approved', reject: 'rejected', accept: 'accepted', decline: 'declined' };

/**
 * A person decides a proposal. Approving or accepting is a finalize path: assertReadyToFinalize first.
 * Nothing an agent wrote changes the repository: an approved draft spec / amendment is exported for the amendment
 * reviewer; an accepted enhancement becomes a backlog SEED (never a feature).
 */
export async function decideOutput(id, { decision, note } = {}, actor, userId) {
  const o = await getOutput(id);
  const allowed = DECIDABLE[o.kind];
  if (!allowed) throw err(`A ${o.kind.replace(/_/g, ' ')} is a record, not a proposal, so there is nothing to decide`, 409);
  if (o.status !== 'proposed') throw err(`This ${o.kind.replace(/_/g, ' ')} was already ${o.status}`, 409);
  if (!allowed.includes(decision)) throw err(`Decision must be one of: ${allowed.join(', ')}`);
  const n2 = text(note);
  if (!n2) throw err('Say why you decided this');
  if (decision === 'approve' || decision === 'accept') {
    if (userId != null) await assertReadyToFinalize(userId);
  }
  const ref = { ...o.ref };
  if (decision === 'accept' && o.kind === 'enhancement_proposal') {
    const p = o.payload;
    const seed = await seeds.createSeed({ title: p.title, words: `${p.problem} (Enhancement proposal #${o.id}; evidence: ${p.evidence}; value: ${p.value}; rough size ${p.size})` }, actor);
    ref.seedId = seed.id;
  }
  await db.prepare(`UPDATE agent_runner_outputs SET status=$1, decided_by=$2, decided_at=$3, decision_note=$4, ref=$5::jsonb WHERE id=$6`).run(STATUS_AFTER[decision], actor?.label || 'admin', Date.now(), n2, ref, o.id);
  await recordEvent({ kind: 'agent_output', ref: String(o.id), type: decision, state: STATUS_AFTER[decision], note: n2.slice(0, 300), actor });
  return getOutput(o.id);
}

/** The amendment file an approved proposal becomes (docs/spec-amendments/<feature>/A<n>.json shape); the reviewer commits it. */
export async function exportAmendment(id) {
  const o = await getOutput(id);
  if (o.kind !== 'amendment_proposal') throw err('Only an amendment proposal can be exported', 409);
  const p = o.payload;
  return {
    id: `A?`, feature: p.feature, fromBaseline: p.fromBaseline, proposedBy: p.proposedBy, round: null, triageItems: [], reason: p.reason,
    changes: p.changes.map((c) => ({ op: c.op, stepId: c.stepId || null, before: c.before || null, after: c.after, tracesTo: c.tracesTo, whyNeeded: c.whyNeeded })),
    review: { status: o.status === 'approved' ? 'approved' : 'proposed', reviewer: o.decidedBy || null, checklist: null, note: o.decisionNote || null, at: o.decidedAt ? new Date(o.decidedAt).toISOString() : null },
  };
}

// ── overview / plan ─────────────────────────────────────────────────────────
export async function overview() {
  await ensureAgentRunnerSchema();
  const worker = await workerStatus();
  const counts = Object.fromEntries((await db.prepare(`SELECT status, COUNT(*)::int AS c FROM agent_runner_runs GROUP BY status`).all()).map((r) => [r.status, r.c]));
  const usage = await db.prepare(`SELECT COUNT(*) FILTER (WHERE usage IS NOT NULL)::int AS runs,
        COALESCE(SUM((usage->>'inputTokens')::numeric),0) AS input, COALESCE(SUM((usage->>'outputTokens')::numeric),0) AS output,
        COUNT(*) FILTER (WHERE usage->>'listCostUsd' IS NOT NULL)::int AS costed, COALESCE(SUM((usage->>'listCostUsd')::numeric),0) AS cost
      FROM agent_runner_runs`).get();
  const pendingOutputs = (await db.prepare(`SELECT COUNT(*)::int AS c FROM agent_runner_outputs WHERE status='proposed'`).get()).c;
  const pendingScope = (await db.prepare(`SELECT COUNT(*)::int AS c FROM agent_runner_runs, jsonb_array_elements(scope_requests) e WHERE e->>'status'='pending'`).get()).c;
  return {
    worker, counts, pendingOutputs, pendingScopeRequests: pendingScope,
    usage: { runsWithUsage: usage.runs, inputTokens: Number(usage.input), outputTokens: Number(usage.output), runsWithCost: usage.costed, listCostUsd: usage.costed ? Number(usage.cost) : null, note: 'Observed from finished runs. A run whose worker reported no cost shows "not recorded", never zero. Nothing here caps spend.' },
    fixtureScenarios: listFixtureScenarios(),
  };
}

export async function planTests(changedFiles) {
  const s = await getSettings();
  return buildTestPlan(changedFiles, { sharedModules: s.sharedModules, allowFixture: true });
}

/** Baselines the screens offer (features that have a frozen baseline), with their smoke suite. */
export async function listBaselines() {
  const { listBaselineFeatures } = await import('./agentTestPlan.js');
  return listBaselineFeatures({ allowFixture: true }).map((f) => {
    const smoke = loadSmoke(f.feature, { allowFixture: true });
    return { feature: f.feature, latest: f.latest, smokeSource: smoke?.source || null, smokeSteps: smoke?.stepIds?.length || 0, fixture: f.fixture };
  });
}

export { seeds, QUALITY_AGENT_KEYS, SIZES, getLoopRunDetail };
