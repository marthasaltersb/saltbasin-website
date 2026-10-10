// Smoke suites, baselines and the smoke-vs-regression test plan (docs/changes/platform-agent-runner.md,
// "Smoke vs regression"). No database: everything is read from the repository's frozen baselines.
//
//   smoke       a short, fixed list of a feature's most important baseline step ids
//               (docs/training/baselines/<feature>/smoke.json, changed only by amendment). A feature that has no
//               smoke.json yet gets a DERIVED list (labelled as such) so the plan never silently skips it.
//   regression  the whole frozen baseline of every feature the change can affect.
//
// Both use the same pinned baseline files, so a smoke result and a regression result on one step compare.
// Baselines are looked up in docs/training/baselines first; a fixture-adapter run may also use the fictional
// baselines in server/data/agentRunner/fixtureBaselines (never consulted for a real run).
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './agentRunnerCatalog.js';
import { matchesAny } from './agentWorkOrder.js';

const BASE = path.join(REPO_ROOT, 'docs/training/baselines');
const FIXTURE_BASE = path.join(REPO_ROOT, 'server/data/agentRunner/fixtureBaselines');

/** Fictional fixture baselines/scenarios are visible only in test environments, never on a deployed platform. */
export const fixturesAllowed = () => (process.env.AGENT_RUNNER_FIXTURE_WORKER === '1' || process.env.AGENT_RUNNER_ALLOW_FIXTURES === '1') && !process.env.RENDER;

export const DEFAULT_SHARED_MODULES = Object.freeze([
  'server/db.js', 'server/index.js', 'server/auth.js', 'src/lib/api.js', 'src/components/WorldShell.jsx', 'src/lib/worldIslands.js',
  'server/lib/mcpToolRegistry.js', 'server/lib/finalizationGates.js', 'package.json',
]);

const versionsIn = (dir) => (fs.existsSync(dir)
  ? fs.readdirSync(dir).map((f) => /^v(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b)
  : []);

function dirsFor({ allowFixture }) {
  return allowFixture ? [BASE, FIXTURE_BASE] : [BASE];
}

/** Features that have a frozen baseline. */
export function listBaselineFeatures({ allowFixture = false } = {}) {
  const out = new Map();
  for (const base of dirsFor({ allowFixture })) {
    if (!fs.existsSync(base)) continue;
    for (const f of fs.readdirSync(base)) {
      const vs = versionsIn(path.join(base, f));
      if (vs.length && !out.has(f)) out.set(f, { feature: f, dir: path.join(base, f), versions: vs, latest: vs[vs.length - 1], fixture: base === FIXTURE_BASE });
    }
  }
  return [...out.values()].sort((a, b) => a.feature.localeCompare(b.feature));
}

export function latestBaselineVersion(feature, opts) {
  return listBaselineFeatures(opts).find((f) => f.feature === feature)?.latest ?? null;
}

export function loadBaseline(feature, version, opts = {}) {
  const f = listBaselineFeatures(opts).find((x) => x.feature === feature);
  if (!f) return null;
  const v = version ? Number(version) : f.latest;
  const file = path.join(f.dir, `v${v}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const scoredSteps = (b) => (b?.steps || []).filter((s) => s.kind !== 'precondition');

/** Derived smoke list: first journey's opening steps, finalize/approve steps, phone-layout steps. */
export function deriveSmoke(baseline) {
  const steps = scoredSteps(baseline).filter((s) => s.kind === 'step');
  if (!steps.length) return [];
  const firstJourney = steps[0].journey;
  const picked = new Set(steps.filter((s) => s.journey === firstJourney).slice(0, 3).map((s) => s.id));
  steps.filter((s) => /approve|finaliz|publish|mark done|\bqr\b/i.test(s.summary || '')).slice(0, 3).forEach((s) => picked.add(s.id));
  steps.filter((s) => /\b390\b|phone|mobile/i.test(s.summary || '')).slice(0, 2).forEach((s) => picked.add(s.id));
  return steps.filter((s) => picked.has(s.id)).map((s) => s.id);
}

/** The smoke suite of a feature: smoke.json when committed, else a derived list (source says which). */
export function loadSmoke(feature, opts = {}) {
  const f = listBaselineFeatures(opts).find((x) => x.feature === feature);
  const file = f ? path.join(f.dir, 'smoke.json') : path.join(BASE, feature, 'smoke.json');
  const baseline = loadBaseline(feature, null, opts);
  if (fs.existsSync(file)) {
    const smoke = JSON.parse(fs.readFileSync(file, 'utf8'));
    const known = new Set((baseline?.steps || []).map((s) => s.id));
    const unknown = (smoke.steps || []).filter((id) => baseline && !known.has(id));
    return { feature, source: 'smoke.json', stepIds: smoke.steps || [], baselineVersion: smoke.baselineVersion ?? baseline?.version ?? null, unknown };
  }
  if (!baseline) return null;
  return { feature, source: 'derived', stepIds: deriveSmoke(baseline), baselineVersion: baseline.version, unknown: [] };
}

/** Backtick-quoted repository paths in a feature's change spec = its file footprint. */
export function featureFootprint(feature) {
  const features = (() => { try { return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/release-log/active-release.features.json'), 'utf8')).features || []; } catch { return []; } })();
  const spec = features.find((x) => x.key === feature)?.changeSpec || `docs/changes/${feature}.md`;
  const file = path.join(REPO_ROOT, spec);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const out = new Set();
  for (const m of text.matchAll(/`([A-Za-z0-9_@./-]+\/[A-Za-z0-9_.*/-]+)`/g)) {
    const p = m[1];
    if (/\.(js|jsx|mjs|json|md|css|sql|yml|yaml)$/.test(p) || p.endsWith('/**') || p.endsWith('/')) out.add(p.replace(/\/$/, '/**'));
  }
  return [...out];
}

/**
 * The test plan for a change. `changedFiles` are repo-relative paths. `sharedModules` (editable in the UI) force
 * a full regression of every feature. Returns { smoke:[...], regression:[...], totals }.
 */
export function buildTestPlan(changedFiles, { sharedModules = DEFAULT_SHARED_MODULES, allowFixture = false } = {}) {
  const files = [...new Set((changedFiles || []).map((f) => String(f).trim().replace(/\\/g, '/').replace(/^\.\//, '')).filter(Boolean))];
  if (!files.length) { const e = new Error('Give at least one changed file'); e.status = 400; throw e; }
  const feats = listBaselineFeatures({ allowFixture });
  const sharedHit = files.filter((f) => matchesAny(f, sharedModules));
  const smoke = [];
  const regression = [];
  for (const f of feats) {
    const s = loadSmoke(f.feature, { allowFixture });
    smoke.push({ feature: f.feature, baselineVersion: f.latest, source: s?.source || 'none', stepIds: s?.stepIds || [] });
    const baseline = loadBaseline(f.feature, null, { allowFixture });
    const footprint = featureFootprint(f.feature);
    const own = files.filter((file) => matchesAny(file, footprint) || footprint.includes(file));
    const reason = sharedHit.length ? `shared module changed: ${sharedHit.join(', ')}` : own.length ? `its files changed: ${own.join(', ')}` : null;
    if (reason) regression.push({ feature: f.feature, baselineVersion: f.latest, stepCount: scoredSteps(baseline).length, reason });
  }
  return {
    changedFiles: files, sharedModuleHits: sharedHit, smoke, regression,
    totals: { smokeSteps: smoke.reduce((n, s) => n + s.stepIds.length, 0), regressionFeatures: regression.length, regressionSteps: regression.reduce((n, r) => n + r.stepCount, 0) },
  };
}
