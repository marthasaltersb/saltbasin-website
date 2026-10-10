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
- Changing a scope is repository tooling only (no platform screen or MCP tool; see the change spec's parity note).

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
   - Expect exactly these three headings, in this order: `Planned at the cut (18):`,
     `Added after the cut (4; 1 counted in this release's planned work):`, `Backlog, not this release's work (6):`.
2. [J1.2] Under **Added after the cut**, expect four lines: guided-training-agent, security-provisioning-model and
   global-change-standard each with `scope=backlog` and `0bee332 by owner`, and release-scope with `scope=planned`.
3. [J1.3] Under **Backlog**, expect qr-gated-outputs, release-loop-tooling, release-intelligence and
   in-app-release-loop marked `[carried_backlog]`, and career-application-journey and career-master-single-source
   marked `[new] blocked on owner`.
4. [J1.4] Run `node scripts/release-scope.mjs show --json`. Expect valid JSON whose `planned`, `added`, `backlog`
   arrays have lengths 18, 4 and 6, and whose `scopeDecision.decidedBy` is `owner`.

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

## Journey 3 - Only planned work is launched

1. [J3.1] Run `node scripts/release-loop-resume.mjs --args --scripts $FX/wf`.
   - Expect stderr to contain `Not launched (backlog, not this release's work; --include-backlog to run them):`
     followed by the six backlog features and the three backlog features added after the cut.
   - Expect no file in `$FX/wf` whose name contains `qr-gated-outputs`, `career-application-journey` or
     `global-change-standard`, and one whose name contains `release-scope`.
2. [J3.2] Run it again with `--include-backlog` into `$FX/wf2`. Expect no "Not launched" line and a file whose name
   contains `qr-gated-outputs`.

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
2. [J5.2] Go back to the tracker overview. Expect, in this order, the section headings
   `Planned at the cut: 0 of 18 passed`, `Added after the cut (4)`, `Backlog: kept on the record, not this release's work (6)`
   and `Other tracked work (1)`. There is no heading that is just `Features`.
3. [J5.3] In **Added after the cut**, expect four notes, each with `added 2026-10-10`: release-scope says
   `counted in this release`; the other three say `kept in backlog`. Each note ends with its reason.
4. [J5.4] Click the **release-scope** row. Expect its feature page to open (no blank screen); go back.
5. [J5.5] Open `GET /api/release-tracker/state` in the same signed-in browser. Expect JSON in which the feature
   `release-scope` has `"scope":"planned"` and an `added` object with `decidedBy` `owner`, and `qr-gated-outputs` has
   `"scope":"backlog"` and no `added`.

## Journey 6 - Platform Release tracker, phone

1. [J6.1] At 390x844, open the Release tracker overview. Expect the same four headings as [J5.2], every table row
   readable as stacked label/value cards, and no horizontal page scroll (`document.documentElement.scrollWidth` is 390).
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
