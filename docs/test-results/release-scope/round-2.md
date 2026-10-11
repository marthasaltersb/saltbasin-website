# Test result: release-scope, round 2

```json
{
  "feature": "release-scope",
  "baseline": 2,
  "specSha256": "25eac2dd68b28f2bff8ff648b8b90596f3412e6dff169ee83efada9fbfaa02fe",
  "total": 25,
  "passed": 20,
  "failed": ["J3.1", "J3.2", "J4.1", "J5.1", "J5.3"],
  "blocked": [],
  "notRun": [],
  "preconditionsFailed": [],
  "observations": []
}
```

Commit tested: `829da7a` (integration head). Baseline v2 (amendment A1), `check` passed. Steps log:
`/var/tmp/sbpg/release-loop/release-scope/round-2/steps.jsonl`; screenshots in the same folder.
Environment: fresh database per pass (reset between the desktop and the phone pass so the paste step could be seen storing),
`npm run seed`, `create-test-member.mjs`, built client served by the API on port 16604, Chromium 1280x900 and 390x844 touch,
light, en-US, TZ=UTC. Result: **passed = false (20 of 25)**.

## Baseline diff (v1 -> v2)

Comparable 23. Same: P.1, P.2, P.3, J1.3, J2.1-J2.5, J3.1, J3.2, J4.1-J4.3, J5.1, J5.3, J5.4, J5.5, J6.2, E.1-E.4.
Changed by A1: J1.1, J1.2, J1.4, J5.2, J6.1. Round 1 scored 24/25 on v1; round 2 is 20/25 on v2, so the numbers are not like for like
(the release file moved on after the cut; see J3/J4/J5.3 below).

## Failures

| Step | Expected | Observed |
|---|---|---|
| J3.1 | no file in `$FX/wf` containing `qr-gated-outputs` | `rl-7000-qr-gated-outputs.js` exists. stderr prints the correct "Not launched (backlog...)" line with all nine backlog features, but also "Launched for their production bugs only: qr-gated-outputs". career-application-journey and global-change-standard have no file; release-scope has one. |
| J3.2 | no "Not launched" line | AMBIGUOUS: the backlog line is gone and `rl-5100-qr-gated-outputs.js` exists, but stderr still prints "Not launched locally (validated on production): production-smoke-regression.", which literally contains "Not launched". Proposed wording: "expect no line starting `Not launched (backlog,`". |
| J4.1 | stderr `...backlog of release 0.3.0 (added after the cut), not its planned work; recorded as outOfScope.` | stderr is `Note: global-change-standard is in the backlog of release 0.3.0, not its planned work; recorded as outOfScope.` (missing "(added after the cut)"). stdout matched. J4.2 passes. |
| J5.1 | Snapshot N stored toast (desktop) | UI passed on both surfaces ("Snapshot 1 stored", no red error). Failed on desktop as MCP_GAP: pasting a snapshot (`POST /api/release-tracker/snapshots`) has no MCP tool; `tools/list` for an admin token (created through Connected Agents) shows only `release_tracker_read` and `release_tracker_get_state`. `scripts/check-interface-parity.mjs` reports the same single gap (`release-tracker-admin`). |
| J5.3 | four notes; release-scope counted, other three kept in backlog | Nine notes, all "added 2026-10-10": 3 "kept in backlog" and 6 "counted in this release" (release-scope, journey-flow-studio, journey-flow-experience-mapping, graphify-data-model-map, tracker-world-navigation, journey-flow-import-existing). Each ends with its reason. This is the amendment A1 follow-up: the spec text is stale, the product is consistent with `show --json` (6 counted, 3 backlog). |

## Passed

P.1-P.3; J1.1-J1.4 (18 planned, 9 added with 6 counted, 6 backlog; every one of 33 keys in exactly one array; scopeDecision.decidedBy owner);
J2.1-J2.5; J4.2, J4.3; J5.2 (headings in order, P=18, A=9, B=6, "Other tracked work (1)", no "Features" heading); J5.4; J5.5 (UI JSON and MCP
`release_tracker_get_state` identical: release-scope planned with `added.decidedBy` owner, qr-gated-outputs backlog with no `added`); J6.1 (scrollWidth 390,
tiles stacked, table rows are stacked label/value cards); J6.2 (nine notes inside x 61..329, 6px apart, readable); E.1-E.4.
J1.2, J1.3, J2.2, J2.3, J2.5, J3.2, J4.2, J4.3 and E.4 list desktop+mobile but are terminal-only; the same terminal result was recorded on both surfaces.

Page errors: none. Failed app requests: none. The only console errors are the blocked external three.js CDN (`external_blocked`).

## Fix verification (open bugs)

| Bug | Step | Result |
|---|---|---|
| release-scope-F1-3 (MCP tools for tracker admin routes) | J5.1 / parity | NOT fixed. Only `release_tracker_get_state` and `release_tracker_read` exist. Recurrence of F1-3 at J5.1 (MCP_GAP). |
| release-scope-F1-4 (scope changed only by repo tooling) | interface parity | Still repo tooling only. The spec documents this as an open owner question and no baseline step covers it (observation). |
| release-scope-F1-5 (capabilityParity merge) | integrate | Verified: `check-interface-parity.mjs` registry matches the code; only gap is release-tracker-admin. |
| release-scope-F1-6 (sync bug budget) | P.2 | Verified: sync exit 0 and the snapshot stored and rendered. |
| release-scope-F1-7 (no seeded snapshot) | J5.5 | Verified: J5.5 passes against the pasted snapshot. |

## Observations (no step covers these, not scored)

- On the phone the "Added after the cut" notes sit in one bordered box with 6px between them and some lines touch the box's right edge (for example the CLAUDE.md quote in global-change-standard). Readable, but tight.
- The J5.1 toast disappears within a few seconds; it was only visible because the test polled for it. A second paste of an identical snapshot shows "Nothing new: identical to the latest snapshot" instead.
- Release key in the tracker is `2026-10-10-production-hardening` while the scope headings say "Release 0.3.0"; both appear on screen.
- J1.2, J1.3 and the other terminal steps listed as desktop+mobile have no browser counterpart. Changing scope has no screen or MCP tool (documented exclusion).

## Cleanup

`git status --short` empty, scratch removed, server stopped by PID file, database `sb_rl_val_16600_2` dropped, port 16604 closed.
