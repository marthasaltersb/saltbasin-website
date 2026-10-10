# Triage: Release loop tooling, round 3

- Source: docs/test-results/release-loop-tooling/round-3.md (commit 536aa29 / integration head)
- Earlier triage items: none (round-1 and round-2 scope notes exist but no item ids), so these are new; T3-2 and T3-4 are recurrences of fix-r1 items B2/B3 (release-loop-tooling-F1-2).

## Shared root cause (T3-2, T3-4)

Fix r1 (commit 082eed1, in HEAD) added to `tools/release-tracker/index.html` the `stalled` label, `.s-stalled` pill colour, the 640px stacked-card CSS and `data-label` on table cells. The live-release-tracker work then rewrote the page from an older copy: 9084b2c (trends) removed the data-label and stalled changes (`git log -S"data-label"` shows only bed12f0/082eed1/9084b2c; the string is absent at HEAD), and 44609c2 / 98e05dd added status updates, World view and `failed: 'Agent stopped'`. The "fix" branch `release-loop/release-loop-tooling-fix-r2` (fc60764, "salvaged ... untested", NOT merged into HEAD) contains the hunks again but against the old page; merging it wholesale would revert the newer page. Note the page is now co-owned by the live-release-tracker feature.

## Items

### T3-1  Nine tiles instead of eight (J4/J5 1.2)
- Class: spec_error
- Root cause: `tools/release-tracker/index.html` line ~263 defines a `updates` stat ("Status updates", count = latest version) added by 44609c2 (numbered release status updates), plus the Board/World switch (98e05dd, line ~206), Release trends panel (9084b2c) and render bindings (cd89438). Intentional additions from another feature; `docs/training/release-loop-tooling.md` line 54 still says eight tiles.
- Fix: update spec line 54 to nine tiles (insert `0.2.0-u4 Status updates`, Open, between "Finished with unreconciled failures" and "Tokens out / cache read"; confirm the version string against the fixture, it is data dependent, so say "a Status updates tile showing the latest update version") and mention the Board/World switch and Release trends panel as present but covered by the live-release-tracker spec. Add a `docs/changes/release-loop-tooling.md` fix note.

### T3-2  Status labels: stalled raw, charlie-export "Agent stopped" (J4/J5 1.5, 2.8)  (recurrence of F1-2 / B2)
- Class: defect for `stalled` (page missing the label); spec_error for `Failed` vs `Agent stopped`.
- Root cause (stalled): `tools/release-tracker/index.html` `STATUS` map (line 221) has no `stalled` key, so `pill()` falls back to `String(s).replace(/_/g,' ')` = "stalled"; `.s-stalled` has no CSS rule (line 63), so it is also unstyled. Sync is correct (`scripts/release-tracker-sync.mjs` lines 118-120, 258 emit `stalled`).
- Root cause (Failed): `failed: 'Agent stopped'` set deliberately by 98e05dd (line 221); spec lines 57 still say `Failed`. "Agent stopped" is clearer for an agent that died, and the Stalled label sits beside it.
- Fix: in index.html add `stalled: 'Stalled (no sign of life)'` to `STATUS` and `.s-stalled` to the red pill rule on line 63 (hunks exist in fc60764). Keep `Agent stopped`; change spec lines 57 (charlie-export `Agent stopped`) and any other `Failed` agent-status expectation in docs/training/release-loop-tooling.md.

### T3-3  Page background colours (J4/J5)
- Class: spec_error
- Root cause: spec line 71 expects light `rgb(243, 246, 247)` / dark `rgb(15, 26, 31)` but the page's design tokens (lines 11, 22, 28) are the Salt Basin cream palette `--bg: #F8F4EC` = rgb(248, 244, 236) and dark `#161A1C` = rgb(22, 26, 28), introduced by 9084b2c under the stated "Salt Basin design language" header comment. Not a bug; the spec values are from the original bed12f0 page.
- Fix: update spec line 71 to the two current values.

### T3-4  390px Features table not stacked cards; panels scroll sideways (J5 5.2)  (recurrence of F1-2 / B3)
- Class: defect
- Root cause: the fix-r1 mobile-card CSS (`@media (max-width: 640px)` block turning `.panel table/tr/td` into blocks, `thead` visually hidden, `td[data-label]::before`) and the `data-label` attributes on `featureRows` (line 269), `bugRows` (277) and `agentRows` (282) are absent at HEAD (lost when 9084b2c replaced the page). The `.panel { overflow-x: auto }` (line 52) is the only mitigation, so wide tables clip/scroll. Reproduction is by inspection: `grep -c data-label tools/release-tracker/index.html` gives 0 and the only `max-width: 640px` rules are lines 84, 190, 196.
- Fix: re-apply onto the CURRENT index.html (do not merge fix-r2 wholesale): (1) the 640px card CSS block; (2) `data-label` on every non-first cell in `featureRows`, `bugRows`, `agentRows`, and also the other tables the validator's panel check would reach: the updates list (line ~885), the "Every feature at this update" table (~894) and the trends data table (~397, first cell may stay unlabelled; label the rest with their column names); (3) rerun `node tools/release-tracker/sync-setup-guide.mjs --write` so the copy embedded in SETUP-FOR-CLAUDE.md (currently 0 `stalled`, 0 `data-label`) matches; (4) verify at 390px that no `.panel` has scrollWidth > clientWidth on overview, a feature layer, a round layer and the Tokens layer, and that clicking card text still opens the feature (the `rowlink` handler). Check the round layer and tokens layer tables specifically, they were the other clipped panels; if a long unbreakable value (mono bug id, long summary) still overflows, add `overflow-wrap: anywhere` to `.panel td`.
- Also add a check to the release flow: `sync-setup-guide.mjs` (exit 1 on diff) as part of the initial check so a rewritten page cannot silently drop fixes again (the real process gap: a different feature's edit regressed an already-verified fix with no regression test).

### T3-5  Change spec "Known limitations" bullets false (open bug F1-6)
- Class: spec_error (documentation)
- Root cause: `docs/changes/release-loop-tooling.md` line 51 says an agent with a started entry and no end entry stays `running` forever and the idle check applies only to `--extra` agents; after fix r1 `scripts/release-tracker-sync.mjs` lines 118-120 mark journal-built agents `stalled` past the stale threshold (default; `--stale-minutes 60` gives `running`). Line 53 says 390px tables scroll inside their panel, contradicting training spec step 5.3 (cards).
- Fix: replace line 51 with "An agent with a `started` entry and no end entry is shown `stalled` once it has shown no sign of life for the stale threshold (`--stale-minutes`, default per sync script); a hand-added `--extra` transcript is shown `idle_or_done`." Replace line 53 with "At 390px tables reflow as stacked cards with column labels; the panel's sideways scroll remains only as a fallback." Do line 53 only after T3-4 is fixed so it is true. Also fill the "Fix notes per round" section (currently "(none yet)").

## Decisions needed from the owner
None. F1-5 (agent card counts) remains a separate open owner question carried from round 2, unaffected here.

## Process notes
- Nothing was run that failed or partially applied during this triage; all findings are from reading code and git history in worktree wf_81457852-d94-2 (no code changed, no servers or databases started).
- The browser reproduction was not repeated; the validator's evidence matches the code facts above exactly (label map, absent data-label, CSS tokens).
