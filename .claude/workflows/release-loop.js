export const meta = {
  name: 'release-loop',
  description: 'Build features in parallel, then loop browser validation → triage → fix → re-validate until every training journey passes; log everything',
  whenToUse: 'Any session that changes code: run it for the session\'s features before pushing. Process definition: server/data/releaseLoop/definition.json; standard: .claude/skills/salt-basin-release-loop/SKILL.md',
  phases: [
    { title: 'Build', detail: 'one build agent per feature, own worktree, initial check, change + training specs' },
    { title: 'Integrate', detail: 'serial merges into the integration branch' },
    { title: 'Validate', detail: 'browser validation following the training spec literally' },
    { title: 'Triage', detail: 'root-cause and classify each failure' },
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
    passed: { type: 'boolean', description: 'true only if EVERY step of EVERY journey passed' },
    commitTested: { type: 'string' },
    reportPath: { type: 'string' },
    stepsTotal: { type: 'number' }, stepsPassed: { type: 'number' },
    failures: { type: 'array', items: { type: 'object', properties: {
      step: { type: 'string' }, expected: { type: 'string' }, observed: { type: 'string' }, evidence: { type: 'string' },
    }, required: ['step', 'expected', 'observed', 'evidence'] } },
  },
  required: ['passed', 'commitTested', 'reportPath', 'stepsTotal', 'stepsPassed', 'failures'],
}
const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    items: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, step: { type: 'string' }, rootCause: { type: 'string' },
      recurrenceOf: { type: 'string', description: 'id of the earlier triage item this is the same bug as (same root cause, or the same step still failing after its fix); empty if new' },
      class: { type: 'string', enum: ['defect', 'spec_error', 'environment', 'needs_business_definition'] },
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
    failures: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'commit', 'fixed', 'notFixed', 'failures'],
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
Then: \`npm run build\` must pass (fix trivial merge breakage yourself and commit it). Also \`git add docs/test-results docs/triage\` and commit any pending logs (message "Release loop logs: ${feature.key}"). Report the new HEAD sha.`,
  { label: `integrate:${feature.key}`, phase: 'Integrate', schema: INTEGRATE_SCHEMA }))
}

function validate(feature, round, fixNotes) {
  const n = nextSlot()
  const report = `docs/test-results/${feature.key}/round-${round}.md`
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'val')}
${TEST_ACCOUNTS}
You are a VALIDATION agent (round ${round}) for feature "${feature.title}". Your job is real testing, not script checks: start the app (seed with \`npm run seed\` against your database if needed), open it in Chromium via Playwright as a real user would (log in through the login form, navigate by clicking — from the World Shell where the spec says so), and follow the training spec \`${feature.trainingSpec}\` LITERALLY, step by step, comparing what you see to each "Expect". Create the spec's preconditions through the UI as written. Take a screenshot at every expectation (save under /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/). Capture page errors, console errors and failed network requests.
LOG AS YOU GO (the live tracker reads this; nothing may wait until your final report): append one JSON line per checked expectation to /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/steps.jsonl — {"journey":"J1","step":"1.2","expect":"…","result":"pass"|"fail"|"blocked","seen":"…","screenshot":"…","at":"<ISO time>"} — and one line the moment you see any page error or failed app request: {"type":"pageerror"|"requestfailed","detail":"…","url":"…","at":"…"}. External font/CDN requests blocked by the sandbox are type "external_blocked", not failures.
Also apply the regression-gate ground rule: a blank, clipped, unreadable or contextless screen is a failure even without an error. Check the feature at a phone width (390px) once.
${fixNotes ? `This round re-tests after fixes. Fix details handed to you:\n${fixNotes}\nRe-run the WHOLE spec, not only the fixed steps, and say for each fix whether it now passes.` : ''}
Also re-check every requirement gap or carried item named in the fix details, even if no spec step covers it yet. Do NOT change product code or specs. If a step is ambiguous, follow it as literally as possible and record the ambiguity as a failure with what you did.
Write your report (per definition.json specStandards.testResult) to ABSOLUTE path ${REPO}/${report} (the main checkout — do not commit; the integrator commits it). passed=true only if every step passed.`,
  { label: `validate:${feature.key}:r${round}`, phase: 'Validate', schema: VALIDATE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function triage(feature, round, v, priorItems) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'tri')}
${TEST_ACCOUNTS}
You are the TRIAGE agent for feature "${feature.title}", round ${round}. The validator reported these failures (full report at ${REPO}/${v.reportPath}):
${JSON.stringify(v.failures, null, 2)}
Earlier triage items for this feature (dedupe against these; reuse their id if it is the same root cause and say it recurred):
${JSON.stringify(priorItems.map(i => ({ id: i.id, rootCause: i.rootCause, class: i.class })), null, 2)}
For each failure: reproduce it (browser or direct request), find the ROOT cause in code (file + line), classify it (defect / spec_error / environment / needs_business_definition — the last ONLY when the product genuinely lacks a business rule the owner must decide, with the exact question), and propose the fix. "Flaky" is not a root cause.
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

function fix(feature, round, items) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'fix')}
${TEST_ACCOUNTS}
You are a FIX agent for feature "${feature.title}", round ${round}. Fix the ROOT cause of each triage item below. Keep each fix minimal. For spec_error, correct the training spec \`${feature.trainingSpec}\` and say why. For environment, fix the harness/seed/docs. For a requirement gap or owner-direction conflict, build/change it and ADD journey steps to the training spec that prove it, so the validator tests it. Never skip, weaken or delete a journey step to get a pass.
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
- Every finalize/approve/publish path must go through assertReadyToFinalize (server) and useToolCategoryGate().run (client).
- Errors are surfaced to the user, never swallowed.
- Write the change/design spec \`${feature.changeSpec}\` and the training spec \`${feature.trainingSpec}\` per definition.json specStandards. The change spec's "Traces to" section names the earlier specs (docs/changes/*, docs/training/*) and commits this builds on or supersedes, with their version. The training spec must be precise enough that a separate agent can follow it literally in a browser: exact labels, exact expected text/values, fictional preconditions created through the UI.
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
    for (let round = firstRound; round <= firstRound + MAX_ROUNDS; round++) {
      const v = await validate(feature, round, fixNotes)
      if (!v) { log_.status = 'validator_died'; break }
      log_.rounds.push({ round, validation: v })
      log(`${feature.key} r${round}: ${v.stepsPassed}/${v.stepsTotal} steps passed`)
      if (v.passed && !carry.length) { log_.status = 'passed'; break }
      if (round >= firstRound + MAX_ROUNDS) { log_.status = 'not_passed_after_max_rounds'; log(`${feature.key}: still failing after ${MAX_ROUNDS} fix rounds — recorded as NOT passed`); break }
      const t = v.passed ? { reportPath: null, items: [] } : await triage(feature, round, v, allItems)
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
      const candidates = t.items.filter(i => i.class !== 'needs_business_definition')
      const stuck = candidates.filter(i => (attempts[i.id] || 0) >= MAX_ATTEMPTS_PER_BUG)
      for (const i of stuck) {
        log(`${feature.key}: bug ${i.id} still failing after ${attempts[i.id]} fix attempts — needs a person (removed from the loop)`)
        log_.needsHuman.push({ ...i, attempts: attempts[i.id], history: allItems.filter(x => x.id === i.id) })
      }
      const fixable = candidates.filter(i => (attempts[i.id] || 0) < MAX_ATTEMPTS_PER_BUG)
      if (!fixable.length) {
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
Write ${REPO}/docs/release-log/${RELEASE}.md: one section per feature with status, every round (steps passed/total, failures, triage items with class and root cause, fixes with files), integration commits, every reported failed/refused command, and a top table of final results. List backlog items (pre_existing / other_feature / process_note) separately as NOT blocking this feature, with their evidence and owner. List items escalated for a business definition with their exact questions, and bugs that hit the per-bug fix-attempt limit (needsHuman) with their full triage/fix/re-test history so a person can take over. Link each test-result and triage file. State plainly which features did NOT pass.
Then commit docs/release-log, docs/test-results and docs/triage ("Release log ${RELEASE}").
Data:
${JSON.stringify({ features: results, sweep }, null, 2)}`,
{ label: 'record', phase: 'Record' }))

return { results, sweep, summary }
