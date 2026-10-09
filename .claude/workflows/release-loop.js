export const meta = {
  name: 'release-loop',
  description: 'Build features in parallel, then loop browser validation → triage → fix → re-validate until every training journey passes; log everything',
  whenToUse: 'Any session that changes code: run it for the session\'s features before pushing. Process definition: server/data/releaseLoop/definition.json; standard: .claude/skills/salt-basin-release-loop/SKILL.md',
  phases: [
    { title: 'Build', detail: 'one build agent per feature, own worktree, initial check, change + training specs' },
    { title: 'Integrate', detail: 'serial merges into the integration branch' },
    { title: 'Validate', detail: 'browser validation following the training spec literally' },
    { title: 'Triage', detail: 'root-cause and classify each failure' },
    { title: 'Amend', detail: 'spec amendments reviewed against fixed rules; approved ones freeze the next baseline' },
    { title: 'Fix', detail: 'fix agents, own worktree; fix notes handed to the validator' },
    { title: 'Sweep', detail: 'whole-app triage crawl + end-to-end run across all specs' },
    { title: 'Record', detail: 'release log' },
  ],
}

// args: {
//   release: 'YYYY-MM-DD-name', repo: '/abs/repo', integrationBranch: 'branch',
//   env: '/abs/env.sh' (DATABASE_URL host/port, admin creds), chromium: '/abs/chrome',
//   maxFixRounds: 4, portBase: 3400, commitTrailer: 'the session\'s commit attribution lines',
//   features: [{ key, title, build: 'what to build' | null (validate-only), trainingSpec: 'docs/training/x.md',
//                changeSpec: 'docs/changes/x.md', salvage: 'notes on partial work to reuse', dependsOn: ['key'] }],
//   sweep: true
// }
const A = args || {}
const REPO = A.repo
const BRANCH = A.integrationBranch
const MAX_ROUNDS = A.maxFixRounds || 4
const MAX_ATTEMPTS_PER_BUG = A.maxFixAttemptsPerBug || 2
const RELEASE = A.release
let slot = 0
const nextSlot = () => { slot += 1; return slot }

const COMMON = `
Repository: ${REPO} (integration branch \`${BRANCH}\`). Process definition: ${REPO}/server/data/releaseLoop/definition.json — read it; follow its spec standards exactly. Release: ${RELEASE}.
Rules for every agent:
- This repo is PUBLIC. Use fictional data only. Never write an employer/application-target name or personal data into any committed file, spec or log. Never commit anything under server/data/applicationPackages/ except its README.
- End every commit message with exactly these trailer lines and nothing else model-related:
${A.commitTrailer || 'Co-Authored-By: Claude <noreply@anthropic.com>'}
- Never push. Never touch the user's remote.
- Nothing fails silently: any command that fails, is refused, or partially applies gets reported in your output with the state it left.
- FIXED TEST CONSTRAINTS (definition.json specGovernance): training specs are frozen as versioned baselines (docs/training/baselines/<feature>/v<N>.json) with stable step ids ([J3.2], [E.1], [P.1]) written into the spec. Only the amendment reviewer may change docs/training/*.md or docs/training/baselines/**, and only for an approved amendment in docs/spec-amendments/<feature>/. Every other agent leaves them byte-for-byte unchanged; a step you think is wrong, missing or ambiguous is reported as a proposed amendment, never edited.
- Local test environment: Postgres accepting connections on host /tmp port 5433 (user postgres). \`source ${A.env}\` for SESSION_SECRET, TOKEN_ENCRYPTION_KEY, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD — then OVERRIDE DATABASE_URL and PORT with the ones assigned to you below. Chromium: ${A.chromium}; Playwright module: /var/tmp/sbpg/node_modules/playwright. Do not run "playwright install".
- Kill every process you started (use PID files, never pkill -f) and drop your database when you finish.
`

const TEST_ACCOUNTS = `
Test accounts: after your server has booted once against your fresh database, run \`node scripts/create-test-member.mjs --out /tmp/claude-0/creds-$PORT.json\` (with your DATABASE_URL). It creates member@test.local / TestPass!2345 and readies the admin, both with platform and CAREER TERMS ACCEPTED and no forced password change. Test member journeys as that member and admin journeys as the admin. Use --no-terms (or a second --email) only for a journey that tests the terms flow itself. Never create test users any other way.`

function env(n, role) {
  const port = (A.portBase || 3400) + n * 2
  const db = `sb_rl_${role}_${A.portBase || 3400}_${n}`   // portBase makes it unique across parallel runs
  return `Your own scratch directory (never write scripts, PID files or logs anywhere shared): /var/tmp/sbpg/agents/${role}-${A.portBase || 3400}-${n}/ (mkdir -p it). Your isolated environment: database \`${db}\` (createdb -h /tmp -p 5433 -U postgres ${db}; DATABASE_URL=postgres://postgres@127.0.0.1:5433/${db}), API PORT=${port}, Vite dev port ${port + 1000} proxying /api to ${port} (or build and run \`npm start\` on ${port}).`
}

const WORKTREE_SETUP = `
You are in a fresh git worktree. FIRST: run \`git reset --hard ${BRANCH}\` and confirm \`git log -1\` shows the integration head (the branch ref is shared with the main checkout). If node_modules is missing: \`ln -s ${REPO}/node_modules node_modules\`.`

// Serialize everything that touches the main checkout's git state.
let lock = Promise.resolve()
function serial(fn) { const p = lock.then(fn); lock = p.catch(() => {}); return p }

const integrated = {}
const integratedResolvers = {}
for (const f of A.features) integrated[f.key] = new Promise(r => { integratedResolvers[f.key] = r })

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string', description: 'named branch holding your commits (release-loop/<feature>-build)' },
    commit: { type: 'string' },
    initialCheckPassed: { type: 'boolean' },
    initialCheckNotes: { type: 'string' },
    changeSpec: { type: 'string' },
    trainingSpec: { type: 'string' },
    failures: { type: 'array', items: { type: 'string' }, description: 'every failed/refused/partial command and the state it left' },
  },
  required: ['branch', 'commit', 'initialCheckPassed', 'initialCheckNotes', 'changeSpec', 'trainingSpec', 'failures'],
}
const INTEGRATE_SCHEMA = {
  type: 'object',
  properties: {
    merged: { type: 'boolean' }, head: { type: 'string' },
    conflicts: { type: 'array', items: { type: 'string' } }, buildPassed: { type: 'boolean' }, notes: { type: 'string' },
  },
  required: ['merged', 'head', 'conflicts', 'buildPassed', 'notes'],
}
const VALIDATE_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean', description: 'true only if EVERY step of the pinned baseline passed on every required surface' },
    commitTested: { type: 'string' },
    reportPath: { type: 'string' },
    baselineVersion: { type: 'number', description: 'the baseline version you tested (from release-spec-baseline.mjs show)' },
    specSha256: { type: 'string' },
    stepsTotal: { type: 'number', description: 'copied from release-spec-baseline.mjs score: total' }, stepsPassed: { type: 'number', description: 'copied from score: passed' },
    notRun: { type: 'array', items: { type: 'string' }, description: 'copied from score: notRun (must be empty unless blocked)' },
    failures: { type: 'array', items: { type: 'object', properties: {
      stepId: { type: 'string', description: 'baseline step id, e.g. J3.2' },
      step: { type: 'string' }, surface: { type: 'string' }, expected: { type: 'string' }, observed: { type: 'string' }, evidence: { type: 'string' },
    }, required: ['stepId', 'step', 'expected', 'observed', 'evidence'] } },
    observations: { type: 'array', items: { type: 'string' }, description: 'problems seen outside any baseline step (possible coverage gaps); never counted in the score' },
  },
  required: ['passed', 'commitTested', 'reportPath', 'baselineVersion', 'stepsTotal', 'stepsPassed', 'notRun', 'failures', 'observations'],
}
const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    items: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, stepId: { type: 'string', description: 'baseline step id (empty for a coverage gap)' }, step: { type: 'string' }, rootCause: { type: 'string' },
      recurrenceOf: { type: 'string', description: 'id of the earlier triage item this is the same bug as (same root cause, or the same step still failing after its fix); empty if new' },
      class: { type: 'string', enum: ['defect', 'spec_error', 'coverage_gap', 'environment', 'needs_business_definition'] },
      amendment: { type: 'object', description: 'REQUIRED for spec_error and coverage_gap: the proposed spec change', properties: {
        op: { type: 'string', enum: ['add', 'change', 'retire'] }, stepId: { type: 'string' }, before: { type: 'string' }, after: { type: 'string' },
        tracesTo: { type: 'string', description: 'the change-spec requirement or owner direction the step proves' }, reason: { type: 'string' },
      } },
      files: { type: 'array', items: { type: 'string' } }, proposedFix: { type: 'string' },
      question: { type: 'string', description: 'for needs_business_definition: the exact question for the owner' },
    }, required: ['id', 'step', 'rootCause', 'class', 'files', 'proposedFix'] } },
  },
  required: ['reportPath', 'items'],
}
const FIX_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' }, commit: { type: 'string' },
    fixed: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, what: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, selfCheck: { type: 'string' },
    }, required: ['id', 'what', 'files', 'selfCheck'] } },
    notFixed: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, why: { type: 'string' } }, required: ['id', 'why'] } },
    proposedSteps: { type: 'array', description: 'steps that would prove a requirement gap you built; reviewed as a spec amendment, never written into the spec by you', items: { type: 'object', properties: {
      op: { type: 'string', enum: ['add', 'change'] }, stepId: { type: 'string' }, before: { type: 'string' }, after: { type: 'string' }, tracesTo: { type: 'string' }, reason: { type: 'string' },
    }, required: ['op', 'after', 'tracesTo', 'reason'] } },
    failures: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'commit', 'fixed', 'notFixed', 'proposedSteps', 'failures'],
}

const RECONCILE_SCHEMA = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    items: { type: 'array', items: { type: 'object', properties: {
      reported: { type: 'string', description: 'the failure as the agent reported it' },
      kind: { type: 'string', enum: ['product_defect', 'requirement_gap', 'owner_direction_conflict', 'test_harness', 'environment', 'process', 'informational'] },
      status: { type: 'string', enum: ['resolved', 'unresolved'] },
      evidence: { type: 'string', description: 'how you verified it (file:line, command output, re-run) — "resolved" without evidence is not allowed' },
      step: { type: 'string' }, rootCause: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, proposedFix: { type: 'string' },
    }, required: ['reported', 'kind', 'status', 'evidence'] } },
  },
  required: ['reportPath', 'items'],
}

// Every failure an agent reports is reconciled by a separate agent before the work counts as finished.
function reconcile(feature, who, result, round) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
After the reset, check out the branch under review: \`git checkout --detach ${result.branch}\`.
${env(n, 'rec')}
${TEST_ACCOUNTS}
You are the RECONCILIATION agent for feature "${feature.title}". The ${who} agent finished and reported these failures/notes:
${JSON.stringify(result.failures || [], null, 2)}
${who === 'build' ? `What it was asked to build:\n${feature.build}` : ''}
For EACH item decide, with evidence you check yourself on branch ${result.branch} (read the code, re-run the command, open the page):
- kind: product_defect | requirement_gap (something asked for that is missing or partial — compare against the request above and the change spec's "Known limitations") | owner_direction_conflict (e.g. it adds admin-navigation entry points when the owner said everything comes from the World Shell; uses an admin account where a member journey was asked) | test_harness | environment | process | informational
- status: resolved ONLY if you verified the fix is in the branch and works; otherwise unresolved. Requirement gaps and owner-direction conflicts are unresolved until built/changed.
For unresolved items give step, rootCause, files, proposedFix so a fix agent can act.
Also read the change spec's "Known limitations"/gaps section and add any gap it lists that the reported failures missed.
Write the reconciliation to ABSOLUTE path ${REPO}/docs/triage/${feature.key}-${who}${round ? `-r${round}` : ''}-reconciliation.md (do not commit). Do not change code.`,
  { label: `reconcile:${feature.key}:${who}${round ? `-r${round}` : ''}`, phase: 'Triage', schema: RECONCILE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function integrate(feature, branch, what) {
  return serial(() => agent(`${COMMON}
You are the INTEGRATION agent. Work in the main checkout ${REPO} on branch \`${BRANCH}\` (verify with git branch --show-current; never switch it).
Several release-loop runs share this checkout. Before ANY git command here, take the shared lock: \`until mkdir /var/tmp/sbpg/integrate.lockdir 2>/dev/null; do if [ -n "$(find /var/tmp/sbpg/integrate.lockdir -maxdepth 0 -mmin +45 2>/dev/null)" ]; then rmdir /var/tmp/sbpg/integrate.lockdir; fi; sleep 5; done\` and release it with \`rmdir /var/tmp/sbpg/integrate.lockdir\` when you are done (also if you fail). Keep the lock only while merging/building/committing.
Merge \`${branch}\` (${what} for feature "${feature.title}") into \`${BRANCH}\` with a merge commit (no rebase, no force). Resolve conflicts so neither side loses behaviour — read both sides; if both changed the same logic and you cannot keep both, keep the integration side, and report it as a conflict needing follow-up.
Then: \`npm run build\` must pass (fix trivial merge breakage yourself and commit it).
BASELINE GATE (definition.json specGovernance): if docs/training/baselines/${feature.key}/ has no v*.json yet, run \`node scripts/release-spec-baseline.mjs freeze --feature ${feature.key}${feature.trainingSpec && !feature.trainingSpec.includes('*') ? ` --spec ${feature.trainingSpec}` : ''}\` and commit the spec (now carrying step ids) and the baseline ("Baseline v1: ${feature.key}"). Then run \`node scripts/release-spec-baseline.mjs check --all\`. If it fails, the merge changed a training spec without an approved amendment: undo the merge (\`git reset --hard <the pre-merge HEAD>\` — only your own merge), report merged=false with the check output in notes, and do not commit anything of it.
Also \`git add docs/test-results docs/triage docs/spec-amendments\` and commit any pending logs (message "Release loop logs: ${feature.key}"). Report the new HEAD sha.`,
  { label: `integrate:${feature.key}`, phase: 'Integrate', schema: INTEGRATE_SCHEMA }))
}

function validate(feature, round, fixNotes) {
  const n = nextSlot()
  const report = `docs/test-results/${feature.key}/round-${round}.md`
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'val')}
${TEST_ACCOUNTS}
You are a VALIDATION agent (round ${round}) for feature "${feature.title}". Your job is real testing, not script checks: start the app (seed with \`npm run seed\` against your database), open it in Chromium via Playwright as a real user would (log in through the login form, navigate by clicking — from the World Shell where the spec says so), and follow the training spec \`${feature.trainingSpec}\` LITERALLY, step by step, comparing what you see to each "Expect". Create the spec's preconditions through the UI as written. Take a screenshot at every expectation (save under /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/). Capture page errors, console errors and failed network requests.
PINNED BASELINE — you test a fixed set of steps, the same set every retry (definition.json specGovernance):
- First run \`node scripts/release-spec-baseline.mjs check --feature ${feature.key}\`. If it fails, STOP: report passed=false, one failure with stepId "BASELINE", step "BASELINE_MISMATCH: <check output>", and test nothing (an untested spec change is never validated).
- Run \`node scripts/release-spec-baseline.mjs show --feature ${feature.key}\`: that list of ids, each with its required surfaces, is your whole test. Test every id, in spec order, on every surface it lists (desktop+mobile, cli, or setup for a P. precondition). Never add, skip, merge, split, reorder or reinterpret a step; never test "an equivalent". If a precondition fails, the steps that depend on it are "blocked", not skipped silently.
- Use exactly the fixed constraints in definition.json specGovernance.testConstraints (fresh database + seed, the test accounts, viewports 1280x900 and 390x844 touch, light scheme, en-US, TZ=UTC, the spec's own fixtures). A step that cannot run under them is a failure with the reason, not a reason to change the setup.
- A step you find ambiguous: follow it as literally as possible, mark it fail with step text starting "AMBIGUOUS:" plus the exact wording you propose; that proposal is reviewed as a spec amendment.
- Problems you notice that no step covers go in "observations" (with evidence), not in failures and not in the score.
LOG AS YOU GO (the live tracker reads this; nothing may wait until your final report): append one JSON line per checked expectation to /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/steps.jsonl — {"id":"J1.2","surface":"desktop"|"mobile"|"cli"|"setup","expect":"…","result":"pass"|"fail"|"blocked","seen":"…","screenshot":"…","at":"<ISO time>"} — and one line the moment you see any page error or failed app request: {"type":"pageerror"|"requestfailed","detail":"…","url":"…","at":"…"}. External font/CDN requests blocked by the sandbox are type "external_blocked", not failures.
SCORE: at the end run \`node scripts/release-spec-baseline.mjs score --feature ${feature.key} --steps /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/steps.jsonl\` and copy baseline, total, passed and notRun from its output into your result verbatim; put its JSON at the top of your report with the baseline version and spec sha. Never compute the score yourself.
Also apply the regression-gate ground rule: a blank, clipped, unreadable or contextless screen is a failure even without an error.
INTERFACE PARITY (definition.json interfaceParity — a failure if any is missing):
- Walk EVERY journey twice: (a) desktop, point-and-click only; (b) a full walkthrough at 390px phone width (viewport 390x844, isMobile + hasTouch, tap instead of click). Record both in steps.jsonl with "surface":"desktop"|"mobile" (cli steps once, "surface":"cli").
- Never use typed URLs (other than the app's start page), API calls, curl, scripts or database edits to perform a step or create a precondition; the only setup exception is scripts/create-test-member.mjs. If a step can only be done that way, fail it with step text starting "UI_GAP:" (desktop) or "MOBILE_GAP:" (phone), and say what is missing in the interface.
- For every capability the spec exercises, check the API route the UI calls (from the browser's network log) and the matching MCP tool: if server/lib/mcpToolRegistry.js exists, call the tool through the platform MCP endpoint as the same test user and compare the result to the UI; a missing or mismatching tool is a failure starting "MCP_GAP:". If the platform MCP server does not exist yet, list the capabilities with no tool under one failure "MCP_GAP: platform MCP server not built yet (feature platform-mcp)" so the scope check assigns it there.
${fixNotes ? `This round re-tests after fixes. Fix details handed to you:\n${fixNotes}\nRe-run the WHOLE baseline, not only the fixed steps, and say for each fix (by step id) whether it now passes. If the baseline version changed since the last round, run \`node scripts/release-spec-baseline.mjs diff --feature ${feature.key}\` and put its same/changed/added/retired table in your report so the scores are read like for like.` : ''}
Requirement gaps named in the fix details that no baseline step covers go in observations with what you saw; they become steps only through an approved amendment. Do NOT change product code, specs or baselines.
Write your report (per definition.json specStandards.testResult) to ABSOLUTE path ${REPO}/${report} (the main checkout — do not commit; the integrator commits it). passed=true only if every step passed.`,
  { label: `validate:${feature.key}:r${round}`, phase: 'Validate', schema: VALIDATE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function triage(feature, round, v, priorItems, decided = []) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'tri')}
${TEST_ACCOUNTS}
You are the TRIAGE agent for feature "${feature.title}", round ${round}. The validator reported these failures (full report at ${REPO}/${v.reportPath}):
${JSON.stringify(v.failures, null, 2)}
Earlier triage items for this feature (dedupe against these; reuse their id if it is the same root cause and say it recurred):
${JSON.stringify(priorItems.map(i => ({ id: i.id, rootCause: i.rootCause, class: i.class })), null, 2)}
Spec amendments already decided for this feature (a REJECTED one means the step as written stands: the same failure is now class defect, never spec_error again; needs_owner ones wait for the owner):
${JSON.stringify(decided, null, 2)}
Validator observations (outside the baseline; decide for each whether it is a coverage_gap worth a new step, or nothing):
${JSON.stringify(v.observations || [], null, 2)}
For each failure (keep its baseline stepId): reproduce it (browser or direct request), find the ROOT cause in code (file + line), classify it (defect / spec_error / coverage_gap / environment / needs_business_definition — the last ONLY when the product genuinely lacks a business rule the owner must decide, with the exact question), and propose the fix. "Flaky" is not a root cause.
spec_error means the product matches the change spec and owner direction and the STEP is wrong — show both. For spec_error and coverage_gap fill "amendment" with the exact before/after wording, what it traces to, and why. These go to the amendment reviewer, never to a fix agent; do not edit the spec. A BASELINE_MISMATCH failure is class environment (the integrator gate was bypassed): name the commit that changed the spec.
Write the triage report to ABSOLUTE path ${REPO}/docs/triage/${feature.key}-round-${round}.md (do not commit). Do not change code.`,
  { label: `triage:${feature.key}:r${round}`, phase: 'Triage', schema: TRIAGE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

const SCOPE_SCHEMA = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    items: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      scope: { type: 'string', enum: ['this_feature', 'pre_existing', 'other_feature', 'process_note'] },
      owner: { type: 'string', description: 'for other_feature: the feature key whose change caused it' },
      evidence: { type: 'string', description: 'how you decided: the base commit you reproduced on and what you saw, or the commit/feature that introduced it' },
    }, required: ['id', 'scope', 'evidence'] } },
  },
  required: ['reportPath', 'items'],
}
const BACKLOG_SCOPES = new Set(['pre_existing', 'other_feature', 'process_note'])

// Decides which failures this feature actually owns. Only 'this_feature' items block it; the rest go to
// the platform backlog (pre_existing), to the feature that caused them (other_feature), or to the process
// log (process_note) — all still tracked, none silent.
function scopeCheck(feature, round, items) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'scp')}
${TEST_ACCOUNTS}
You are the SCOPE agent for feature "${feature.title}" (key ${feature.key}), round ${round}. For each triage item below decide who owns it:
- this_feature: this feature's own code/spec causes it, OR it is something this feature was asked to do (the request below) and does not do.
- pre_existing: it happens WITHOUT this feature. Prove it: find the integration-branch commit just before this feature first merged (\`git log --merges --oneline --grep="${feature.key}" ${BRANCH}\` → the earliest merge's first parent, or for an older feature the commit before its first commit), check it out in this worktree, build, run on a fresh database, and try to reproduce. Reproduces → pre_existing. Also pre_existing: a gap that is NOT part of this feature's request.
- other_feature: introduced by a DIFFERENT feature's change (show the commit and which feature it belongs to via git log/blame), owner = that feature key (one of: proficiency-live-qr, qr-gated-outputs, no-silent-failures, release-loop-tooling, world-shell-navigation, career-bound-outputs, output-version-history, resume-rollups, chart-gallery, cover-letter-agent, release-intelligence, in-app-release-loop, session-mapping).
- process_note: not a product or spec problem at all (e.g. commit attribution wording, agent tooling refusals).
If docs/triage/scope-review.json already classifies an id, reuse that decision unless you find contrary evidence. When unsure between this_feature and pre_existing, reproduce — never guess; if you cannot reproduce on the base, it is this_feature.
This feature's request: ${feature.build || feature.title}
Items:
${JSON.stringify(items.map((i) => ({ id: i.id, step: i.step, rootCause: i.rootCause, class: i.class, files: i.files })), null, 2)}
Write ABSOLUTE ${REPO}/docs/triage/${feature.key}-round-${round}-scope.md (do not commit). Do not change code.`,
  { label: `scope:${feature.key}:r${round}`, phase: 'Triage', schema: SCOPE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

const AMEND_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string', description: 'branch with the approved spec changes and the new baseline, or empty if nothing was approved' },
    commit: { type: 'string' },
    newBaselineVersion: { type: 'number', description: 'the baseline version after this review (unchanged if nothing approved)' },
    amendments: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, file: { type: 'string' }, status: { type: 'string', enum: ['approved', 'rejected', 'needs_owner'] },
      triageItems: { type: 'array', items: { type: 'string' } }, note: { type: 'string' },
      question: { type: 'string', description: 'for needs_owner: the exact question for the owner' },
    }, required: ['id', 'file', 'status', 'triageItems', 'note'] } },
    failures: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'commit', 'newBaselineVersion', 'amendments', 'failures'],
}

// The only path by which a training spec changes during a release. A separate reviewer decides each
// proposal against the fixed checklist; approved ones are written into the spec and frozen as the next
// baseline version on their own branch, so every round still tests one fixed, versioned step set.
function amend(feature, round, proposals) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'amd')}
You are the AMENDMENT REVIEWER for feature "${feature.title}" (key ${feature.key}), after round ${round}. You did not propose any of these changes; your job is to decide them, not to improve them on your own. Read definition.json specGovernance (rule, reviewChecklist, testConstraints), the change spec \`${feature.changeSpec}\`, the training spec \`${feature.trainingSpec}\` and \`node scripts/release-spec-baseline.mjs show --feature ${feature.key}\`.
Proposed changes (from triage, the fix agent, validator AMBIGUOUS steps, or pending proposals already filed under docs/spec-amendments/${feature.key}/ with status "proposed"):
${JSON.stringify(proposals, null, 2)}
First read every existing amendment for this feature: a proposal for a step that already has a needs_owner amendment waiting is NOT filed again — add this round's evidence to that amendment's file and keep its id (the owner gets each question once). Group related proposals into amendments. For each, write docs/spec-amendments/${feature.key}/A<next number>.json (or update the filed proposal) with the fields in specGovernance.amendment.fields: proposedBy and round from the proposal, fromBaseline = current version, every change {op, stepId, before, after, tracesTo, whyNeeded}, and review = { status, reviewer: "amend:${feature.key}:r${round}", checklist: { <each reviewChecklist rule>: "pass" | "fail: why" }, note, at }.
Decide with the checklist only: approved when every rule passes; rejected when the step as written is right (then say what the product must do — the item goes back to the fix loop as a defect); needs_owner when it would remove a non-duplicate step, weaken an expectation, or needs a business rule (give the exact question). Check a claimed spec_error yourself against the change spec and owner direction before approving it.
If any are approved: \`git switch -c release-loop/${feature.key}-spec-r${round}\`, edit the training spec for exactly the approved changes (new steps take the next unused id; write the id tag yourself or let freeze assign it; retired steps are deleted from the text and recorded by the baseline), then run \`node scripts/release-spec-baseline.mjs freeze --feature ${feature.key} --amendment <id>\` once per approved amendment in order, then \`check --feature ${feature.key}\` must pass. Commit the spec, the baseline(s) and the amendment files ("Spec amendment <ids>: ${feature.key} baseline v<N>"). If none are approved, still write the amendment files to the ABSOLUTE path under ${REPO}/docs/spec-amendments/${feature.key}/ (do not commit; the integrator does) and return branch "".`,
  { label: `amend:${feature.key}:r${round}`, phase: 'Amend', schema: AMEND_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function fix(feature, round, items) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'fix')}
${TEST_ACCOUNTS}
You are a FIX agent for feature "${feature.title}", round ${round}. Fix the ROOT cause of each triage item below in the PRODUCT (or, for environment, the harness/seed/docs). Keep each fix minimal. You may NOT edit the training spec \`${feature.trainingSpec}\` or anything under docs/training/baselines/ — the integrator rejects a branch that does, and the round is lost. The steps are fixed constraints: make the product meet them. For a requirement gap or owner-direction conflict, build/change it and put the steps that would prove it in proposedSteps (exact action and expected result, tracesTo, reason); the amendment reviewer decides them before the next round. Never weaken a step by proposal either.
Triage items:
${JSON.stringify(items, null, 2)}
After fixing, walk the failed journey steps yourself in the browser and confirm they pass (selfCheck). \`npm run build\` must pass.
Append a "Fix notes — round ${round}" section to the change spec \`${feature.changeSpec}\`: per item id, what changed, files, how you checked it.
Commit on a new branch named \`release-loop/${feature.key}-fix-r${round}\` (git switch -c ...).`,
  { label: `fix:${feature.key}:r${round}`, phase: 'Fix', schema: FIX_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function build(feature) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'bld')}
You are the BUILD agent for feature "${feature.title}" (key ${feature.key}).
What to build:
${feature.build}
${feature.salvage ? `Partial work from an earlier stopped agent you should review and reuse where sound (it was never tested): ${feature.salvage}` : ''}
Standards:
- Read CLAUDE.md conventions you touch (db adapter, JSONB params, async auth, rules of hooks, append-only registries, additive schema, never write member rows from seed/bootstrap).
- Anything configurable must be editable from a UI screen, not only via API.
- INTERFACE PARITY (definition.json interfaceParity): every capability is reachable by point-and-click from the World Shell on desktop AND usable at 390px phone width (tap targets >= 44px, no hover-only actions, no horizontal page scroll); it is served by an API route with the same permission checks as the UI; and, if server/lib/mcpToolRegistry.js exists, it is registered there as an MCP tool that calls the same server function (append-only registry, same permissions). The training spec names, per journey, the UI path, the API route and the MCP tool, and is walkable on desktop and on a phone.
- Every finalize/approve/publish path must go through assertReadyToFinalize (server) and useToolCategoryGate().run (client).
- Errors are surfaced to the user, never swallowed.
- Write the change/design spec \`${feature.changeSpec}\` and the training spec \`${feature.trainingSpec}\` per definition.json specStandards. The change spec's "Traces to" section names the earlier specs (docs/changes/*, docs/training/*) and commits this builds on or supersedes, with their version. The training spec must be precise enough that a separate agent can follow it literally in a browser: exact labels, exact expected text/values, fictional preconditions created through the UI. Structure it for the baseline parser: "## Preconditions" with numbered items, one "## Journey <n> — <title>" per journey with numbered steps (each step = one action and its exact expected result, so it is deterministic under specGovernance.testConstraints and meets every rule in specGovernance.reviewChecklist), and "## Edge cases" as a list. The integrator freezes it as baseline v1 when your branch merges; after that it changes only by approved amendment, so get it right now.
Initial check (gate before handoff): npm run build passes; server boots on a fresh database; you walk every journey of your training spec once in Chromium and they pass. Fix what fails before handing off.
Commit on a new branch \`release-loop/${feature.key}-build\` (git switch -c ...).`,
  { label: `build:${feature.key}`, phase: 'Build', schema: BUILD_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

async function runFeature(feature) {
  const log_ = { key: feature.key, title: feature.title, rounds: [], escalated: [], status: 'not_started' }
  const carry = []   // unresolved items from reconciliation; the feature cannot pass while any remain
  try {
    for (const dep of feature.dependsOn || []) {
      log(`${feature.key}: waiting for ${dep} to be integrated`)
      await integrated[dep]
    }
    if (feature.build || feature.prebuilt) {
      const b = feature.prebuilt ? { initialCheckPassed: false, initialCheckNotes: 'Built by an earlier agent; reconciled here.', ...feature.prebuilt } : await build(feature)
      if (!b) { log_.status = 'build_agent_died'; return log_ }
      log_.build = b
      if (!b.initialCheckPassed) log(`${feature.key}: initial check did not pass — integrating anyway so validation and triage see it (${b.initialCheckNotes})`)
      const rc = await reconcile(feature, 'build', b, null)
      log_.buildReconciliation = rc
      for (const [i, it] of (rc?.items || []).entries()) {
        if (it.status !== 'resolved') carry.push({ id: `${feature.key}-B${i + 1}`, step: it.step || it.reported, rootCause: it.rootCause || it.reported, class: 'defect', files: it.files || [], proposedFix: it.proposedFix || '', source: `build reconciliation (${it.kind})` })
      }
      if (carry.length) log(`${feature.key}: ${carry.length} unresolved item(s) from the build carried into the fix loop`)
      const ig = await integrate(feature, b.branch, 'build')
      log_.integrations = [ig]
      if (!ig || !ig.merged) { log_.status = 'integration_failed'; return log_ }
    }
    integratedResolvers[feature.key]?.()

    let fixNotes = feature.fixNotes || null   // a relaunched feature can continue from a later round
    const allItems = []
    const attempts = {}   // bug id -> fix attempts so far
    log_.needsHuman = []
    // The round budget counts from where this run starts, so a resumed feature (startRound > 1) still gets
    // MAX_ROUNDS fix rounds; per-bug attempt limits still send repeat failures to a person.
    const firstRound = feature.startRound || 1
    // Spec amendments: the only way steps change. Reviewed by a separate agent, integrated before the next
    // validation round, which then tests the new frozen baseline version. Returns notes for the validator.
    const runAmend = async (round, proposals) => {
      if (!proposals.length) return null
      const am = await amend(feature, round, proposals)
      log_.amendments = [...(log_.amendments || []), { round, ...(am || { died: true }) }]
      if (!am) { log(`${feature.key}: amendment reviewer died — proposals stay "proposed"; the next round tests the unchanged baseline`); return null }
      const owner = am.amendments.filter((x) => x.status === 'needs_owner')
      log_.escalated.push(...owner.map((x) => ({ id: x.id, class: 'needs_business_definition', step: `spec amendment ${x.id}`, question: x.question || x.note })))
      log(`${feature.key}: amendments after r${round}: ${am.amendments.map((x) => `${x.id} ${x.status}`).join(', ') || 'none'}${am.branch ? ` → baseline v${am.newBaselineVersion}` : ''}`)
      if (am.branch) {
        const ig = await integrate(feature, am.branch, `spec amendment after round ${round}`)
        log_.integrations = [...(log_.integrations || []), ig]
        if (!ig || !ig.merged) log(`${feature.key}: amendment branch ${am.branch} was not merged — the next round tests the previous baseline`)
      }
      return JSON.stringify(am.amendments.map((x) => ({ id: x.id, status: x.status, note: x.note })), null, 2)
    }
    if (feature.pendingAmendments?.length) {
      const notes = await runAmend(firstRound - 1, feature.pendingAmendments)
      if (notes) fixNotes = `${fixNotes || ''}\nSpec amendments decided before this round:\n${notes}`
    }
    let lastBaseline = null
    for (let round = firstRound; round <= firstRound + MAX_ROUNDS; round++) {
      let v = await validate(feature, round, fixNotes)
      if (!v) { log_.status = 'validator_died'; break }
      // Same baseline, different step count = the validator drifted from the fixed step set: re-run once.
      if (lastBaseline && lastBaseline.version === v.baselineVersion && lastBaseline.total !== v.stepsTotal) {
        log(`${feature.key} r${round}: validator reported ${v.stepsTotal} steps on baseline v${v.baselineVersion} (last round ${lastBaseline.total}) — drift from the fixed step set, re-validating`)
        log_.drift = [...(log_.drift || []), { round, reported: v.stepsTotal, expected: lastBaseline.total }]
        v = await validate(feature, round, `${fixNotes || ''}\nA previous validator this round reported ${v.stepsTotal} steps where baseline v${v.baselineVersion} has ${lastBaseline.total}. Score only with release-spec-baseline.mjs score.`)
        if (!v) { log_.status = 'validator_died'; break }
      }
      lastBaseline = { version: v.baselineVersion, total: v.stepsTotal }
      log_.rounds.push({ round, validation: v, baselineVersion: v.baselineVersion })
      log(`${feature.key} r${round}: ${v.stepsPassed}/${v.stepsTotal} steps passed on baseline v${v.baselineVersion}`)
      if (v.passed && !carry.length) { log_.status = 'passed'; break }
      if (round >= firstRound + MAX_ROUNDS) { log_.status = 'not_passed_after_max_rounds'; log(`${feature.key}: still failing after ${MAX_ROUNDS} fix rounds — recorded as NOT passed`); break }
      const t = v.passed ? { reportPath: null, items: [] } : await triage(feature, round, v, allItems, (log_.amendments || []).flatMap((a) => a.amendments || []))
      if (!t) { log_.status = 'triage_agent_died'; break }
      for (const c of carry.splice(0)) if (!t.items.some((i) => i.id === c.id)) t.items.push(c)
      allItems.push(...t.items)
      log_.rounds[log_.rounds.length - 1].triage = t
      for (const i of t.items) if (i.recurrenceOf) i.id = i.recurrenceOf   // same bug keeps its id
      // Scope check (from the round named in scopeFromRound, so resumed runs keep their cached history):
      // only failures this feature owns block it; the rest are tracked in the backlog.
      if (A.scopeCheck && round >= (feature.scopeFromRound || 1) && t.items.length) {
        const sc = await scopeCheck(feature, round, t.items)
        log_.rounds[log_.rounds.length - 1].scope = sc
        const byId = new Map((sc?.items || []).map((x) => [x.id, x]))
        const moved = t.items.filter((i) => BACKLOG_SCOPES.has(byId.get(i.id)?.scope))
        log_.backlog = [...(log_.backlog || []), ...moved.map((i) => ({ ...i, ...byId.get(i.id), round }))]
        t.items = t.items.filter((i) => !BACKLOG_SCOPES.has(byId.get(i.id)?.scope))
        if (moved.length) log(`${feature.key} r${round}: ${moved.length} item(s) moved out of this feature (pre-existing / other feature / process note)`)
        if (!t.items.length) { log_.status = v.passed ? 'passed' : 'passed_with_backlog'; break }
      }
      log_.escalated.push(...t.items.filter(i => i.class === 'needs_business_definition'))
      // Spec items never reach a fix agent: they become amendment proposals for the reviewer.
      const isSpec = (i) => ['spec_error', 'coverage_gap'].includes(i.class) || /^AMBIGUOUS:/.test(i.step || '')
      const specItems = t.items.filter(isSpec)
      const candidates = t.items.filter(i => i.class !== 'needs_business_definition' && !isSpec(i))
      const stuck = candidates.filter(i => (attempts[i.id] || 0) >= MAX_ATTEMPTS_PER_BUG)
      for (const i of stuck) {
        log(`${feature.key}: bug ${i.id} still failing after ${attempts[i.id]} fix attempts — needs a person (removed from the loop)`)
        log_.needsHuman.push({ ...i, attempts: attempts[i.id], history: allItems.filter(x => x.id === i.id) })
      }
      const fixable = candidates.filter(i => (attempts[i.id] || 0) < MAX_ATTEMPTS_PER_BUG)
      const proposalsFrom = (items) => items.map((i) => ({ proposedBy: `triage:${feature.key}:r${round}`, round, triageItem: i.id, stepId: i.stepId || '', class: i.class, ...(i.amendment || { op: 'change', after: i.step, reason: i.rootCause }) }))
      if (!fixable.length) {
        if (specItems.length) {   // only the steps are in question: review them, then re-test the decided baseline
          const notes = await runAmend(round, proposalsFrom(specItems))
          fixNotes = `No product fixes this round. Spec amendments decided:\n${notes || '(reviewer did not run)'}`
          continue
        }
        log_.status = stuck.length ? 'blocked_on_human_review' : 'blocked_on_business_definition'
        break
      }
      for (const i of fixable) attempts[i.id] = (attempts[i.id] || 0) + 1
      const f = await fix(feature, round, fixable)
      if (!f) { log_.status = 'fix_agent_died'; break }
      log_.rounds[log_.rounds.length - 1].fix = f
      const frc = (f.failures || []).length || (f.notFixed || []).length
        ? await reconcile(feature, 'fix', { ...f, failures: [...(f.failures || []), ...(f.notFixed || []).map((x) => `not fixed ${x.id}: ${x.why}`)] }, round)
        : null
      log_.rounds[log_.rounds.length - 1].fixReconciliation = frc
      for (const [i, it] of (frc?.items || []).entries()) {
        if (it.status !== 'resolved') carry.push({ id: `${feature.key}-F${round}-${i + 1}`, step: it.step || it.reported, rootCause: it.rootCause || it.reported, class: 'defect', files: it.files || [], proposedFix: it.proposedFix || '', source: `fix reconciliation (${it.kind})` })
      }
      const ig = await integrate(feature, f.branch, `fix round ${round}`)
      log_.integrations = [...(log_.integrations || []), ig]
      if (!ig || !ig.merged) { log_.status = 'fix_integration_failed'; break }
      fixNotes = JSON.stringify({ fixed: f.fixed, notFixed: f.notFixed }, null, 2)
      const proposals = [...proposalsFrom(specItems), ...(f.proposedSteps || []).map((x) => ({ proposedBy: `fix:${feature.key}:r${round}`, round, ...x }))]
      const amendNotes = await runAmend(round, proposals)
      if (amendNotes) fixNotes += `\nSpec amendments decided this round:\n${amendNotes}`
    }
  } finally {
    integratedResolvers[feature.key]?.()
  }
  return log_
}

phase('Build')
const results = await parallel(A.features.map(f => () => runFeature(f)))

let sweep = null
if (A.sweep) {
  phase('Sweep')
  const crawl = {
    key: 'whole-app-sweep',
    title: 'Whole-app sweep: every route and every training spec end to end',
    build: null,
    trainingSpec: 'docs/training/*.md (ALL of them, in order) plus a crawl of every World Shell island, every /member and /admin tab, /r/<token>, and /output/* — any page error, failed request, blank/clipped render, or interaction slower than 1s is a failure',
    changeSpec: 'docs/changes/release-sweep.md',
  }
  sweep = await runFeature(crawl)
}

phase('Record')
const summary = await serial(() => agent(`${COMMON}
You are the RELEASE RECORDER. Work in the main checkout ${REPO} on \`${BRANCH}\`.
Write ${REPO}/docs/release-log/${RELEASE}.md: one section per feature with status, every round (steps passed/total ON WHICH BASELINE VERSION — never compare scores across versions without the amendment that changed them, failures, triage items with class and root cause, fixes with files), integration commits, every reported failed/refused command, and a top table of final results. List backlog items (pre_existing / other_feature / process_note) separately as NOT blocking this feature, with their evidence and owner. List every spec amendment (id, status, what changed, reviewer) and any validator drift. List items escalated for a business definition with their exact questions, and bugs that hit the per-bug fix-attempt limit (needsHuman) with their full triage/fix/re-test history so a person can take over. Link each test-result and triage file. State plainly which features did NOT pass.
Then commit docs/release-log, docs/test-results, docs/triage and docs/spec-amendments ("Release log ${RELEASE}").
Data:
${JSON.stringify({ features: results, sweep }, null, 2)}`,
{ label: 'record', phase: 'Record' }))

return { results, sweep, summary }
