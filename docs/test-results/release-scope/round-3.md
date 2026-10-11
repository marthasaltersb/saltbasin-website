# Release scope - test round 3

Release 2026-10-10-production-hardening-resume. Commit tested: c603390. Validation agent val-16600-8.

## Score (from `release-spec-baseline.mjs score`, copied verbatim)

```json
{
  "feature": "release-scope",
  "baseline": 3,
  "specSha256": "3999f1104d81bc23470358f4ad886a5d1e19a746e0e65a26f113162f3083292f",
  "total": 25,
  "passed": 25,
  "failed": [],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Baseline v3 (amendment A3). `check` passed. Diff v2 -> v3: same = 22 ids (all except J3.1, J3.2, J5.3); changed = J3.1, J3.2, J5.3; added none; retired none. 25 comparable.

## Fixes re-tested

- release-scope-T2-3 (J4.1, J4.2): PASS. stderr exactly `Note: global-change-standard is in the backlog of release 0.3.0 (added after the cut), not its planned work; recorded as outOfScope.`; stdout `Estimate recorded for T-scope-check: 2 item(s) in release 0.3.0.`; global-change-standard has outOfScope true (and addedAfterCut true), platform-mcp has no outOfScope key.
- release-scope-T2-4 (MCP parity): PASS. As the admin with a token created through Connected Agents (scopes release.read, release.write), tools/list shows all 7 release_tracker_* tools. `release_tracker_get_state` gives release-scope scope planned, added.decidedBy owner, and qr-gated-outputs scope backlog with no `added`, the same as the UI route GET /api/release-tracker/state. `release_tracker_list_snapshots` returned the snapshot the UI stored (id 1). `release_tracker_ingest_snapshot` of the same snapshot gave outcome `unchanged`. `release_tracker_get_settings` returned settings. A malformed snapshot string gave the friendly 400 (json_invalid). No MCP_GAP.
- A3-amended steps J3.1, J3.2, J5.3: all PASS (see below).

## Steps (every id on every listed surface; phone = 390x844 touch)

- P.1, P.2, P.3 (setup): pass. Fresh database and seed (seed printed only a Postgres NOTICE about an existing column), create-test-member, snapshot written (exit 0).
- J1.1 pass: first line as spec; headings Planned (18), Added after the cut (9; 6 counted in this release's planned work), Backlog (6).
- J1.2 pass, J1.3 pass, J1.4 pass (33 keys, each in exactly one array, scopeDecision.decidedBy owner).
- J2.1-J2.5 pass (messages and exit codes exact; scopeHistory last entry correct; undo restores J1.1 headings).
- J3.1 pass: stderr lists the six backlog features and three added-backlog ones; `Launched for their production bugs only: qr-gated-outputs`; wf has release-scope and qr-gated-outputs files, none for career-application-journey, global-change-standard or other backlog. J3.2 pass: no `Not launched (backlog,` line; qr-gated-outputs file present.
- J4.1-J4.3 pass.
- J5.1-J5.5 pass on desktop and phone: `Snapshot 1 stored` appears, no red alert; headings in order with P=18, A=9, B=6, Other tracked work (1); 9 notes, 6 counted, 3 kept, each with date and reason; release-scope feature page opens and the Overview crumb returns; the state API shows the expected scope data.
- J6.1, J6.2 pass on phone and on desktop at 390 wide: scrollWidth 390, scope tiles stacked, notes wrap inside the screen.
- E.1-E.3 pass, E.4 pass (cleanup done).

Screenshots: /var/tmp/sbpg/release-loop/release-scope/round-3/. Log: steps.jsonl.

## Observations (not scored)

- Test-setup note: a second paste of the identical snapshot into the same database shows result `unchanged` ("nothing new since snapshot 1"), not `Snapshot N stored`. I reset to a fresh database for each pass so J5.1 ran as specified; I did not count the unchanged result as a failure.
- The `Snapshot 1 stored` confirmation disappears within about a second (found by polling every 100 ms; a 3-second wait missed it). It is readable but brief; the Recent ingests row stays. Consider a longer or persistent confirmation.
- Tile counts on the overview are 24 / 9 / 9 (planned plus counted-added, added, backlog plus added-backlog) while the section headings use 18 / 9 / 6 as the spec states. Consistent with the spec; two different bases on one screen may confuse readers.
- J1.2 names seven added features but `show` lists nine (tracker-world-navigation and journey-flow-import-existing were added later). Followed the rule "one line per added entry".
- In the same browser tab, navigating after viewing the raw JSON API page timed out (a page load that never finished); I ran J6 in a fresh browser session. The open live stream (`/api/release-tracker/stream`) logs `ERR_ABORTED` on navigation, which is expected. Otherwise only external CDN (three.js) requests failed (blocked by the sandbox).
- Process: the sandbox permission classifier denied two commands in a parallel batch at J2.1/J2.2 (the J2.3 command then applied the change first). I reverted the file and re-ran J2.1-J2.5 sequentially. I also once used `pkill -f` on my own test script by mistake; it only matched my own run.
- J2.2-J2.5, J3.2, J4.2, J4.3 and E.4 are labeled desktop+mobile but are file/CLI checks; the same result was recorded for both.
- No page errors. Failed app request: only the aborted live stream on navigation.
