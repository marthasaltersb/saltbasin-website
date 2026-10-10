// Production rounds in the release tracker and the release loop (feature production-smoke-regression).
//
// A production round is an ordinary docs/test-results/<feature>/round-N.md whose score block carries a
// "target" URL (written by scripts/production-smoke.mjs; the suite runs on GitHub Actions because the cloud
// sandbox cannot reach production). The bugs a production round finds live beside it in
// docs/test-results/<feature>/bugs.json: each names its owning feature (the one whose code or config must
// change), the baseline step it maps to, and the production steps (prodSteps) that prove it.
//
// Lifecycle, shared with the rest of the loop (definition.json bugEscalation):
//   - the sync adds each production bug to its owner's bugs, so the owner's fix agents get it as a fix note
//     and the fix is recorded (fixed_awaiting_retest) like any other;
//   - a local test round can never verify it (verifyBy: 'production' - the defect exists only on production);
//   - a later production round in which none of its prodSteps failed, was blocked or was not run verifies it;
//     a later production round in which they still fail adds one history note and changes nothing else.
// Read-only helpers: nothing here writes files; release-tracker-sync.mjs writes the ledger as before.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RESULTS = path.join(root, 'docs/test-results');

function scoreBlock(file) {
  const m = fs.readFileSync(file, 'utf8').match(/```json\s*\n(\{[\s\S]*?\})\s*\n```/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// { [feature]: [{ round, target, total, passed, failed[], blocked[], notRun[], report }] }, oldest first.
export function productionRounds() {
  const out = {};
  if (!fs.existsSync(RESULTS)) return out;
  for (const feature of fs.readdirSync(RESULTS)) {
    const dir = path.join(RESULTS, feature);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const n = Number((f.match(/^round-(\d+)\.md$/) || [])[1]);
      if (!n) continue;
      const s = scoreBlock(path.join(dir, f));
      if (!s || !/^https?:\/\//.test(String(s.target || ''))) continue;
      (out[feature] ||= []).push({
        round: n, target: s.target, total: s.total ?? null, passed: s.passed ?? null,
        failed: s.failed || [], blocked: s.blocked || [], notRun: s.notRun || [],
        report: `docs/test-results/${feature}/${f}`,
      });
    }
    out[feature]?.sort((a, b) => a.round - b.round);
  }
  return out;
}

// Production bugs filed beside the rounds (docs/test-results/<feature>/bugs.json), keyed by id.
export function productionBugs() {
  const out = [];
  if (!fs.existsSync(RESULTS)) return out;
  for (const feature of fs.readdirSync(RESULTS)) {
    const file = path.join(RESULTS, feature, 'bugs.json');
    if (!fs.existsSync(file)) continue;
    for (const b of JSON.parse(fs.readFileSync(file, 'utf8')).bugs || []) {
      out.push({ ...b, verifyBy: 'production', foundBy: b.foundBy || feature, roundsFeature: feature });
    }
  }
  return out;
}

// A feature's tracker entry from its production rounds. Status: passed only when nothing failed, was
// blocked or was skipped; failing when a step failed; needs_human when only owner-held steps were not run.
export function productionFeatureEntry(key, rounds) {
  const last = rounds[rounds.length - 1];
  const clean = !last.failed.length && !last.blocked.length;
  return {
    key,
    status: !clean ? 'failing' : last.notRun.length ? 'needs_human' : 'passed',
    rounds: rounds.length,
    lastResult: { round: last.round, passed: clean && !last.notRun.length, stepsPassed: last.passed, stepsTotal: last.total, baseline: null, report: last.report, target: last.target },
    validatedOn: 'production',
  };
}

// Applies later production rounds to a production bug (mutates and returns it).
export function applyProductionRounds(bug, allRounds) {
  if (bug.verifyBy !== 'production' || bug.status === 'verified') return bug;
  const rounds = (allRounds[bug.roundsFeature] || []).filter((r) => r.round > (bug.prodLastRound ?? bug.prodRound ?? 0));
  for (const r of rounds) {
    const bad = (bug.prodSteps || []).filter((s) => r.failed.includes(s) || r.blocked.includes(s) || r.notRun.includes(s));
    bug.history = [...(bug.history || [])];
    if (!bad.length) {
      bug.status = 'verified';
      bug.history.push({ round: r.round, event: 'verified', note: `Production round ${r.round} (${r.target}) passed ${bug.prodSteps.join(', ')}`, report: r.report });
      bug.prodLastRound = r.round;
      break;
    }
    bug.history.push({ round: r.round, event: 'still_failing_in_production', note: `Production round ${r.round}: ${bad.join(', ')} still failing`, report: r.report });
    bug.prodLastRound = r.round;
  }
  return bug;
}
