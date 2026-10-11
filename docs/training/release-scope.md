# Training spec: Release scope (planned vs backlog vs added after the cut)

Audience: a test agent with a shell and Chromium. Fictional data only. Paths are relative to the repository root.
`$FX` = your own scratch directory (for example `/var/tmp/sbpg/agents/<you>/fx`; delete it at the end). Steps that
change `docs/release-log/active-release.features.json` or add a session plan are undone at the end ([E.4]); never
commit them.

## Where things are

- Release file: `docs/release-log/active-release.features.json` (each feature's `scope`, `added`, `scopeHistory`; the
  release's `scopeDecision`). Shared logic: `server/lib/releaseScope.js`.
- CLI: `scripts/release-scope.mjs show | add | set`. Also scope-aware: `scripts/release-tracker-sync.mjs`,
  `scripts/release-loop-resume.mjs`, `scripts/session-plan.mjs`, `scripts/release-cut.mjs`.
- Platform screen: World Shell → **Release tracker** island (also `/release-tracker`), admin; its **Settings** has
  **Paste a snapshot**. API: `GET /api/release-tracker/state`.
- Changing a scope works three ways through one function. Screen: World Shell > Release tracker > Settings > Release scope. API: `POST /api/release-tracker/scope`. MCP: `release_tracker_set_scope`.

## Preconditions

1. [P.1] Fresh database per the fixed test constraints: boot the server once against a new empty database, run
   `npm run seed`, then `node scripts/create-test-member.mjs`. Start the API and web client on your assigned ports.
2. [P.2] `mkdir -p $FX`. Write the scratch snapshot:
   `node scripts/release-tracker-sync.mjs --features "$(node -e 'console.log(require("./docs/release-log/active-release.features.json").features.map(f=>f.key).concat("whole-app-sweep").join(","))')" --out $FX/snap.json`
   exits 0. Then wrap it for the paste box:
   `node -e "const fs=require('fs');fs.writeFileSync('$FX/paste.json',JSON.stringify({snapshot:JSON.parse(fs.readFileSync('$FX/snap.json','utf8'))}))"`.
3. [P.3] Browser viewport 1280x900 for the desktop pass and 390x844 with touch for the phone pass. Sign in at
   `/login` as the admin test user.

## Journey 1 - The three groups on the command line

1. [J1.1] Run `node scripts/release-scope.mjs show`.
   - Expect the first line to start `Release 0.3.0 — Owner decision 2026-10-10 ("Recommended, minus added")`.
   - Expect exactly these three headings, in this order: `Planned at the cut (P):`,
     `Added after the cut (A; C counted in this release's planned work):`, `Backlog, not this release's work (B):`,
     where P, A and B are the lengths of `planned`, `added` and `backlog` in `node scripts/release-scope.mjs show --json`,
     and C is the number of `added` entries whose `scope` is `planned`. At 2026-10-10T21:05Z these were 18, 7, 6 and 4.
2. [J1.2] Under **Added after the cut**, expect one line per `added` entry of `show --json`: guided-training-agent,
   security-provisioning-model and global-change-standard each with `scope=backlog` and `0bee332 by owner`; release-scope,
   journey-flow-studio, journey-flow-experience-mapping and graphify-data-model-map each with `scope=planned` and `by owner`.
3. [J1.3] Under **Backlog**, expect qr-gated-outputs, release-loop-tooling, release-intelligence and
   in-app-release-loop marked `[carried_backlog]`, and career-application-journey and career-master-single-source
   marked `[new] blocked on owner`.
4. [J1.4] Run `node scripts/release-scope.mjs show --json`. Expect valid JSON with `planned`, `added` and `backlog` arrays whose
   lengths match the J1.1 headings, every feature key of the release file appearing in exactly one array, and
   `scopeDecision.decidedBy` `owner`.

## Journey 2 - Changing scope is recorded, never silent

1. [J2.1] Run `node scripts/release-scope.mjs set --key release-loop-tooling --scope planned --by tester --reason "training check"`.
   - Expect `release-loop-tooling: backlog -> planned.` and exit 0.
2. [J2.2] Expect release-loop-tooling in `active-release.features.json` to have `"scope": "planned"` and a
   `scopeHistory` whose last entry has `from` `backlog`, `to` `planned`, `decidedBy` `tester`, `reason` `training check`.
3. [J2.3] Run the same command again. Expect exit 1 and exactly `release-loop-tooling is already planned; nothing changed.`
4. [J2.4] Run `node scripts/release-scope.mjs add --key demo-widget --title "Demo widget" --scope backlog --by tester --reason "training check"`.
   - Expect `Added demo-widget to release 0.3.0 after the cut, scope backlog.`; then `show` lists demo-widget under
     **Added after the cut** with `scope=backlog` and `by tester: training check`.
5. [J2.5] Undo J2.1–J2.4 now: `git checkout -- docs/release-log/active-release.features.json`. `show` again prints the
   J1.1 headings exactly.
6. [J2.6] As admin, open the Release tracker **Settings** tab and find the **Release scope** card. Choose `release-loop-tooling (backlog)` in **Feature** (**New scope** then shows `planned` and the button reads **Move to planned**). Leave **Decided by** empty and click **Move to planned**.
   - Expect a red alert reading `Give who decided.` and no change to `active-release.features.json`.
   - Fill **Decided by** with `tester` and **Reason** with `training check`, then click **Move to planned**. Expect the status line to begin `release-loop-tooling: backlog -> planned.`, and the file's `release-loop-tooling` last `scopeHistory` entry to have `from` `backlog`, `to` `planned`, `decidedBy` `tester`, `reason` `training check`.
   - Undo: `git checkout -- docs/release-log/active-release.features.json`.
7. [J2.7] Run `node scripts/mcp-call.mjs --url <API_BASE>/mcp --token <TOKEN_A> call release_tracker_set_scope '{"key": "release-loop-tooling", "scope": "planned", "decidedBy": "tester", "reason": "training check"}'`, where TOKEN_A is an access token the admin created on World Shell > Journeys > Connected Agents with the `release.read` scope ticked, and TOKEN_B the same for member@test.local.
   - Expect `isError: false` and a result with `key` `release-loop-tooling`, `from` `backlog`, `to` `planned` and `message` `release-loop-tooling: backlog -> planned.`
   - Run the same command again. Expect `isError: true` with `status` 409, `code` `no_change` and `message` `release-loop-tooling is already planned; nothing changed.`
   - Run it with `--token <TOKEN_B>`. Expect `isError: true` with `status` 403, `code` `forbidden` and `message` `release_tracker_set_scope is for administrators only. You are signed in as a member.`, and no change to the file beyond the first call.
   - Undo: `git checkout -- docs/release-log/active-release.features.json`.

## Journey 3 - Only planned work is launched

1. [J3.1] Run `node scripts/release-loop-resume.mjs --args --scripts $FX/wf`.
   - Expect stderr to contain `Not launched (backlog, not this release's work; --include-backlog to run them):`
     followed by the six backlog features and the three backlog features added after the cut.
   - Expect no file in `$FX/wf` whose name contains `career-application-journey` or `global-change-standard`, and one
     whose name contains `release-scope`. A file containing `qr-gated-outputs` exists only if stderr also has
     `Launched for their production bugs only:` naming qr-gated-outputs (it has open production bugs); any other
     backlog feature without open production bugs has no file.
2. [J3.2] Run it again with `--include-backlog` into `$FX/wf2`. Expect no stderr line starting `Not launched (backlog,`
   and a file whose name contains `qr-gated-outputs`. (A `Not launched locally (validated on production)` line may appear.)

## Journey 4 - Estimates flag work outside the plan

1. [J4.1] Run `node scripts/session-plan.mjs estimate --session T-scope-check --intent "training" --item "feature=global-change-standard;goal=check;expect=1/1;size=S" --item "feature=platform-mcp;goal=check;expect=65/65;size=S"`.
   - Expect stderr `Note: global-change-standard is in the backlog of release 0.3.0 (added after the cut), not its planned work; recorded as outOfScope.` and stdout `Estimate recorded for T-scope-check: 2 item(s) in release 0.3.0.`
2. [J4.2] In `docs/release-log/session-plans/T-scope-check.json` expect the global-change-standard item to carry
   `"outOfScope": true` and the platform-mcp item to have no `outOfScope` key.
3. [J4.3] Delete `docs/release-log/session-plans/T-scope-check.json`.

## Journey 5 - Platform Release tracker, desktop

1. [J5.1] Open `/world`, then the **Release tracker** island. Click **Open Settings** (or the Settings link). In
   **Paste a snapshot**, paste the full contents of `$FX/paste.json` into the box labelled **Snapshot JSON** and click
   **Store snapshot**. Expect the confirmation `Snapshot 1 stored` (the number may be higher on a reused database) and no red error.
2. [J5.2] Go back to the tracker overview. Expect the first section heading to be
   `Release 0.3.0 scope: this release vs backlog`, and further down, in this order, `Planned at the cut: 0 of P passed`,
   `Added after the cut (A)`, `Backlog: kept on the record, not this release's work (B)` and `Other tracked work (1)`
   (P, A, B as in J1.1). There is no heading that is just `Features`.
3. [J5.3] In **Added after the cut**, expect one note per `added` entry of `node scripts/release-scope.mjs show --json`
   (A of them), each with `added 2026-10-10`; a note whose entry has `scope` `planned` says `counted in this release`
   (C of them), the others say `kept in backlog`. Each note ends with its reason. At 2026-10-10T21:05Z these were 9
   notes, 6 counted, 3 kept in backlog.
4. [J5.4] Click the **release-scope** row. Expect its feature page to open (no blank screen); go back.
5. [J5.5] Open `GET /api/release-tracker/state` in the same signed-in browser. Expect JSON in which the feature
   `release-scope` has `"scope":"planned"` and an `added` object with `decidedBy` `owner`, and `qr-gated-outputs` has
   `"scope":"backlog"` and no `added`.

## Journey 6 - Platform Release tracker, phone

1. [J6.1] At 390x844, open the Release tracker overview. Expect the scope summary first (three tiles stacked or wrapped, all
   text readable), the same headings as [J5.2], every table row readable as stacked label/value cards, and no horizontal page scroll (`document.documentElement.scrollWidth` is 390).
2. [J6.2] Expect the notes in **Added after the cut** to wrap within the screen with space between them.

## Edge cases

1. [E.1] `node scripts/release-scope.mjs set --key platform-mcp --scope later --by tester --reason x` exits 1 with
   `The scope must be one of: planned, backlog. Got "later".` and the release file is unchanged (`git diff --quiet` on it).
2. [E.2] `node scripts/release-scope.mjs set --key platform-mcp --scope backlog --by tester` (no reason) exits 1 with
   `Give the reason with --reason.` and the file is unchanged.
3. [E.3] `node scripts/release-scope.mjs add --key platform-mcp --title x --scope planned --by tester --reason x` exits 1
   with `Feature "platform-mcp" is already in release 0.3.0. Use "set" to change its scope.`
4. [E.4] Clean-up: `git checkout -- docs/release-log/active-release.features.json`, remove `$FX`, stop what you started,
   drop your database. `git status --short` shows nothing you created.
