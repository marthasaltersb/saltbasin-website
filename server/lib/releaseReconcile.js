// Pure reconciliation helpers for release intelligence (no DB access, so they
// can be exercised directly with fixtures). Reuses versionParts /
// compareVersions / hashing from the earlier partial build; the backlog and
// patch-note matching it carried is not needed (a release record is built from
// the release-loop logs, not from the backlog).
//
// A release record "reconciles" when, for every feature it lists:
//   - a change spec and a training spec exist among the imported outputs
//   - the spec versions the release log declares match the spec files
//   - every "Traces to" target resolves to an imported output
//   - at least one validation round is recorded and the last one passed
//   - the recorded rounds agree with the rounds the release log declares
//   - no failed run for the feature is still open
// and the release has no open failed run of its own. Anything that fails a
// check is listed with the reason, never summarised away.

import crypto from 'node:crypto';

export function versionParts(version) {
  return String(version || '').replace(/^v/i, '').split('.').map((n) => Number(n) || 0);
}

export function compareVersions(a, b) {
  const pa = versionParts(a);
  const pb = versionParts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** "v2", "2" and "2.0" all compare equal for spec-version matching. */
export function sameVersion(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  return compareVersions(a, b) === 0;
}

export function hashText(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

/** Rounds-to-pass for one feature: the first round that passed, else null (not passed). */
export function roundsToPass(rounds) {
  const sorted = [...rounds].sort((a, b) => a.roundNo - b.roundNo);
  const first = sorted.find((r) => r.passed === true);
  return first ? first.roundNo : null;
}

// Merge rows that describe the same (feature, round) from different sources
// (a release-log table row, a test-result document, the tracker snapshot).
// A value from a test-result document wins over a log table; null never
// overwrites a recorded value.
export function mergeRounds(rows) {
  const byKey = new Map();
  const rank = (r) => (r.reportPath ? 2 : 1);
  for (const r of [...rows].sort((a, b) => rank(a) - rank(b))) {
    const key = `${r.featureKey}#${r.roundNo}`;
    const prev = byKey.get(key) || { featureKey: r.featureKey, roundNo: r.roundNo, sources: [] };
    for (const field of ['commitSha', 'testedOn', 'passed', 'stepsPassed', 'stepsTotal', 'consoleErrors', 'failedRequests', 'reportPath']) {
      if (r[field] != null && r[field] !== '') prev[field] = r[field];
    }
    prev.sources.push(r.sourcePath);
    byKey.set(key, prev);
  }
  return [...byKey.values()].sort((a, b) => a.featureKey.localeCompare(b.featureKey) || a.roundNo - b.roundNo);
}

const pass = (id, label, detail) => ({ id, label, status: 'pass', detail });
const fail = (id, label, detail) => ({ id, label, status: 'fail', detail });
const na = (id, label, detail) => ({ id, label, status: 'na', detail });

/**
 * Run the reconciliation checks for one feature.
 *  feature   { featureKey, finalStatus, declaredRounds, declaredChangeSpecVersion, declaredTrainingSpecVersion }
 *  changeSpec / trainingSpec   imported output rows or null ({ path, specVersion, traces })
 *  rounds    merged rounds for this feature
 *  openRuns  failed runs for this feature whose disposition is 'open'
 *  knownPaths  Set of imported output paths (for trace resolution)
 */
export function reconcileFeature({ feature, changeSpec, trainingSpec, rounds, openRuns, knownPaths }) {
  const checks = [];
  checks.push(changeSpec
    ? pass('change_spec', 'Change spec present', `${changeSpec.path}${changeSpec.specVersion ? ` (version ${changeSpec.specVersion})` : ' (no version stated)'}`)
    : fail('change_spec', 'Change spec present', 'No imported change spec carries this feature key'));
  checks.push(trainingSpec
    ? pass('training_spec', 'Training spec present', `${trainingSpec.path}${trainingSpec.specVersion ? ` (version ${trainingSpec.specVersion})` : ' (no version stated)'}`)
    : fail('training_spec', 'Training spec present', 'No imported training spec carries this feature key'));

  for (const [id, label, declared, spec] of [
    ['change_spec_version', 'Change spec version matches the release log', feature.declaredChangeSpecVersion, changeSpec],
    ['training_spec_version', 'Training spec version matches the release log', feature.declaredTrainingSpecVersion, trainingSpec],
  ]) {
    if (!declared) checks.push(na(id, label, 'The release log declares no version'));
    else if (!spec) checks.push(fail(id, label, `Release log says version ${declared} but the spec is not imported`));
    else if (!spec.specVersion) checks.push(fail(id, label, `Release log says version ${declared} but the spec states no version`));
    else if (sameVersion(declared, spec.specVersion)) checks.push(pass(id, label, `Version ${spec.specVersion}`));
    else checks.push(fail(id, label, `Release log says version ${declared}; the spec file says version ${spec.specVersion}`));
  }

  const traces = [...(changeSpec?.traces || []), ...(trainingSpec?.traces || [])].filter((t) => t.kind === 'spec');
  const unresolved = traces.filter((t) => !knownPaths.has(t.ref));
  if (!traces.length) checks.push(na('traces', 'Traces-to targets resolve', 'No spec traces listed'));
  else if (unresolved.length) checks.push(fail('traces', 'Traces-to targets resolve', `Not found among imported outputs: ${unresolved.map((t) => t.ref).join(', ')}`));
  else checks.push(pass('traces', 'Traces-to targets resolve', `${traces.length} spec trace${traces.length === 1 ? '' : 's'} resolved`));

  if (!rounds.length) checks.push(fail('validated', 'Validated in at least one round', 'No validation round recorded'));
  else checks.push(pass('validated', 'Validated in at least one round', `${rounds.length} round${rounds.length === 1 ? '' : 's'} recorded`));

  const last = rounds[rounds.length - 1];
  if (!last) checks.push(na('last_round', 'Last round passed', 'No rounds'));
  else if (last.passed === true) checks.push(pass('last_round', 'Last round passed', `Round ${last.roundNo} passed`));
  else if (last.passed === false) checks.push(fail('last_round', 'Last round passed', `Round ${last.roundNo} did not pass`));
  else checks.push(fail('last_round', 'Last round passed', `Round ${last.roundNo} has no recorded result`));

  if (feature.declaredRounds == null) checks.push(na('rounds_agree', 'Recorded rounds match the release log', 'The release log declares no round count'));
  else if (rounds.length === feature.declaredRounds) checks.push(pass("rounds_agree", "Recorded rounds match the release log", `${rounds.length} round${rounds.length === 1 ? "" : "s"}`));
  else checks.push(fail('rounds_agree', 'Recorded rounds match the release log', `Release log declares ${feature.declaredRounds} round${feature.declaredRounds === 1 ? '' : 's'}; ${rounds.length} recorded`));

  checks.push(openRuns.length
    ? fail('failed_runs', 'No open failed runs', `${openRuns.length} failed run${openRuns.length === 1 ? ' is' : 's are'} still open`)
    : pass('failed_runs', 'No open failed runs', 'None open'));

  const failing = checks.filter((c) => c.status === 'fail');
  return { checks, reconciled: failing.length === 0, gaps: failing.map((c) => `${c.label}: ${c.detail}`) };
}
