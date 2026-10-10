# Handover: release 0.3.0 (production hardening)

Written 2026-10-10 at the 0.2.0 cut. Read this first in any session that continues the build or handles production bugs.
Fictional data only in specs, logs and test results (the repo is public).

## Where things stand

- **0.2.0 is frozen** in `docs/release-log/releases/0.2.0/` (`summary.json` plus every release-log file as it was at the cut,
  commit `4df3ff7`). Nothing there is rewritten. Delivered: 4 of 18 features (qr-gated-outputs 38/38, release-loop-tooling
  30/30, release-intelligence 55/55, in-app-release-loop 60/60). The other 14 were carried, unfinished, to 0.3.0.
- **0.2.0 was merged to `main` at the owner's request** before every feature passed. Render deploys `main`, so production
  now runs this code. The last validated score of every carried feature is in `summary.json` and on the tracker.
- **0.3.0 is open**: `docs/release-log/active-release.features.json` (`kind`: `carried` = unfinished from 0.2.0,
  `carried_backlog` = delivered but its open bugs are kept, `new`). `startedAtCommit` scopes the tracker history to this release.
- **Release index**: `docs/release-log/releases/index.json`, one row per release (planned, delivered, carried, bugs, sessions).
- **Bug ledger and tracker carry stay continuous** (`bug-ledger.json`, `tracker-carry.json`): bugs never disappear across releases.

## Tracker

- Artifact: https://claude.ai/artifact/5pmGUtvSVEVEyaTCp3EVma. The **Release** picker in the header switches between the live
  release (`tracker/current`, `tracker/bugs`, `tracker/history`) and frozen ones (`releases/<v>-current|-bugs|-history`,
  index in `releases/index`). The overview shows **Releases: features delivered per release** and **Sessions: estimate
  before the work, test results at each merge**.
- Source: `tools/release-tracker/index.html`. Per-session sync: `scripts/release-tracker-session-sync.sh` (setup steps in its
  header), then publish `doc.json`, `bugs-doc.json`, `history-doc.json` to the three `tracker/*` documents (read their
  versions first and pin `if_version`).

## Every session: estimate first, then compare at each merge

1. Before any work, record what this session is trying to accomplish:
   `node scripts/session-plan.mjs estimate --session <id> --intent "<one line>" --item "feature=<key>;goal=<what>;expect=<passed>/<total>;size=S|M|L"`
   (one `--item` per feature; `expect` is the score you expect on the pinned baseline at the end of the session).
2. Put the id in `/var/tmp/sbpg/tracker/session.txt`. Each tracker sync then records every newly validated round
   against the estimate (`session-plan.mjs merge --if-new`). After a manual merge, run `session-plan.mjs merge --session <id>`.
3. An estimate is fixed once a merge is recorded; a change is `--reestimate "<reason>"`, kept beside the original.
4. At the end: `session-plan.mjs close --session <id> --note "<what happened>"`; `session-plan.mjs report` prints
   expected vs actual (Met / Missed). "Not validated" is never shown as 0.

## Production bugs

- The production smoke/regression session (feature `production-smoke-regression`) tests https://saltbasin.net after each
  merge to `main`. Smoke tests are read-only. Regression tests use only a dedicated, fictional test account, never a real
  member's data. Each production failure is filed as a bug under that feature with the URL, the step, the expected and
  actual result, and a screenshot path. A bug that belongs to another feature is reassigned to it with its baseline step id.
- A production bug that blocks members goes to the owner at once, as a plain-language message, before any fix.

## Continuing the build

- Follow the `salt-basin-release-loop` skill's **Resuming in a new session** steps (copy `tracker-carry.json` to
  `/var/tmp/sbpg/tracker/carry-in.json`, start the sync loop, `node scripts/release-loop-resume.mjs` for Workflow args).
- Order of work: (1) production bugs; (2) carried features closest to passing (platform-mcp 65/65 needs only a re-test;
  session-mapping 56/56; chart-gallery 18/20; proficiency-live-qr 30/32; resume-rollups 30/32; cover-letter-agent 45/48);
  (3) new features that are not blocked: `release-cut-and-session-plans` (write its training spec and validate it),
  `owner-error-messages`, `scoring-preferences-mcp`; (4) the rest.
- **Blocked on the owner** (do not build until answered): `guided-training-agent`, `career-application-journey` and
  `career-master-single-source` (their questions are at the end of each change spec). Also still open: career-bound-outputs A1
  and A3, output-version-history E.2 and A4, resume-rollups A3, proficiency J8.4, release-intelligence B8 and B10, the
  agent-worker host (GitHub Actions, own computer or paid Render), a Graphify trial, and whether to close the step-less
  open bugs on delivered features.
- Rules that still hold: the merge lock (`mkdir /var/tmp/sbpg/integrate.lockdir`, never during a merge, only remove your own),
  never call the real Anthropic API in tests, no spend caps on the agent runner, package JSON never in git, no PR unless asked.

## Closing 0.3.0

`node scripts/release-cut.mjs --next-version 0.4.0 --next-release <name> --next-title "<title>" [--add <new-features.json>] --snapshot <tracker snapshot>`
freezes 0.3.0 the same way. Then publish `releases/0.3.0-current|-bugs|-history` and the new `releases/index` to the artifact.
