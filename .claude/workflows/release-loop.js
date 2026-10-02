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

function env(n, role) {
  const port = (A.portBase || 3400) + n * 2
  const db = `sb_rl_${role}_${n}`
  return `Your isolated environment: database \`${db}\` (createdb -h /tmp -p 5433 -U postgres ${db}; DATABASE_URL=postgres://postgres@127.0.0.1:5433/${db}), API PORT=${port}, Vite dev port ${port + 1000} proxying /api to ${port} (or build and run \`npm start\` on ${port}).`
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

function integrate(feature, branch, what) {
  return serial(() => agent(`${COMMON}
You are the INTEGRATION agent. Work in the main checkout ${REPO} on branch \`${BRANCH}\` (verify with git branch --show-current; never switch it).
Merge \`${branch}\` (${what} for feature "${feature.title}") into \`${BRANCH}\` with a merge commit (no rebase, no force). Resolve conflicts so neither side loses behaviour — read both sides; if both changed the same logic and you cannot keep both, keep the integration side, and report it as a conflict needing follow-up.
Then: \`npm run build\` must pass (fix trivial merge breakage yourself and commit it). Also \`git add docs/test-results docs/triage\` and commit any pending logs (message "Release loop logs: ${feature.key}"). Report the new HEAD sha.`,
  { label: `integrate:${feature.key}`, phase: 'Integrate', schema: INTEGRATE_SCHEMA }))
}

function validate(feature, round, fixNotes) {
  const n = nextSlot()
  const report = `docs/test-results/${feature.key}/round-${round}.md`
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'val')}
You are a VALIDATION agent (round ${round}) for feature "${feature.title}". Your job is real testing, not script checks: start the app (seed with \`npm run seed\` against your database if needed), open it in Chromium via Playwright as a real user would (log in through the login form, navigate by clicking — from the World Shell where the spec says so), and follow the training spec \`${feature.trainingSpec}\` LITERALLY, step by step, comparing what you see to each "Expect". Create the spec's preconditions through the UI as written. Take a screenshot at every expectation (save under /var/tmp/sbpg/release-loop/${feature.key}/round-${round}/). Capture page errors, console errors and failed network requests.
Also apply the regression-gate ground rule: a blank, clipped, unreadable or contextless screen is a failure even without an error. Check the feature at a phone width (390px) once.
${fixNotes ? `This round re-tests after fixes. Fix details handed to you:\n${fixNotes}\nRe-run the WHOLE spec, not only the fixed steps, and say for each fix whether it now passes.` : ''}
Do NOT change product code or specs. If a step is ambiguous, follow it as literally as possible and record the ambiguity as a failure with what you did.
Write your report (per definition.json specStandards.testResult) to ABSOLUTE path ${REPO}/${report} (the main checkout — do not commit; the integrator commits it). passed=true only if every step passed.`,
  { label: `validate:${feature.key}:r${round}`, phase: 'Validate', schema: VALIDATE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function triage(feature, round, v, priorItems) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'tri')}
You are the TRIAGE agent for feature "${feature.title}", round ${round}. The validator reported these failures (full report at ${REPO}/${v.reportPath}):
${JSON.stringify(v.failures, null, 2)}
Earlier triage items for this feature (dedupe against these; reuse their id if it is the same root cause and say it recurred):
${JSON.stringify(priorItems.map(i => ({ id: i.id, rootCause: i.rootCause, class: i.class })), null, 2)}
For each failure: reproduce it (browser or direct request), find the ROOT cause in code (file + line), classify it (defect / spec_error / environment / needs_business_definition — the last ONLY when the product genuinely lacks a business rule the owner must decide, with the exact question), and propose the fix. "Flaky" is not a root cause.
Write the triage report to ABSOLUTE path ${REPO}/docs/triage/${feature.key}-round-${round}.md (do not commit). Do not change code.`,
  { label: `triage:${feature.key}:r${round}`, phase: 'Triage', schema: TRIAGE_SCHEMA, isolation: 'worktree', model: 'sonnet' })
}

function fix(feature, round, items) {
  const n = nextSlot()
  return agent(`${COMMON}${WORKTREE_SETUP}
${env(n, 'fix')}
You are a FIX agent for feature "${feature.title}", round ${round}. Fix the ROOT cause of each triage item below. Keep each fix minimal. For spec_error, correct the training spec \`${feature.trainingSpec}\` and say why. For environment, fix the harness/seed/docs. Never skip, weaken or delete a journey step to get a pass.
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
  try {
    for (const dep of feature.dependsOn || []) {
      log(`${feature.key}: waiting for ${dep} to be integrated`)
      await integrated[dep]
    }
    if (feature.build) {
      const b = await build(feature)
      if (!b) { log_.status = 'build_agent_died'; return log_ }
      log_.build = b
      if (!b.initialCheckPassed) log(`${feature.key}: initial check did not pass — integrating anyway so validation and triage see it (${b.initialCheckNotes})`)
      const ig = await integrate(feature, b.branch, 'build')
      log_.integrations = [ig]
      if (!ig || !ig.merged) { log_.status = 'integration_failed'; return log_ }
    }
    integratedResolvers[feature.key]?.()

    let fixNotes = null
    const allItems = []
    const attempts = {}   // bug id -> fix attempts so far
    log_.needsHuman = []
    for (let round = 1; round <= MAX_ROUNDS + 1; round++) {
      const v = await validate(feature, round, fixNotes)
      if (!v) { log_.status = 'validator_died'; break }
      log_.rounds.push({ round, validation: v })
      log(`${feature.key} r${round}: ${v.stepsPassed}/${v.stepsTotal} steps passed`)
      if (v.passed) { log_.status = 'passed'; break }
      if (round > MAX_ROUNDS) { log_.status = 'not_passed_after_max_rounds'; log(`${feature.key}: still failing after ${MAX_ROUNDS} fix rounds — recorded as NOT passed`); break }
      const t = await triage(feature, round, v, allItems)
      if (!t) { log_.status = 'triage_agent_died'; break }
      allItems.push(...t.items)
      log_.rounds[log_.rounds.length - 1].triage = t
      for (const i of t.items) if (i.recurrenceOf) i.id = i.recurrenceOf   // same bug keeps its id
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
Write ${REPO}/docs/release-log/${RELEASE}.md: one section per feature with status, every round (steps passed/total, failures, triage items with class and root cause, fixes with files), integration commits, every reported failed/refused command, and a top table of final results. List items escalated for a business definition with their exact questions, and bugs that hit the per-bug fix-attempt limit (needsHuman) with their full triage/fix/re-test history so a person can take over. Link each test-result and triage file. State plainly which features did NOT pass.
Then commit docs/release-log, docs/test-results and docs/triage ("Release log ${RELEASE}").
Data:
${JSON.stringify({ features: results, sweep }, null, 2)}`,
{ label: 'record', phase: 'Record' }))

return { results, sweep, summary }
