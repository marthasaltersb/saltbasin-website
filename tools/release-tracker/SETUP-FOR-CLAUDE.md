# Release tracker — setup guide for Claude

Give this file to Claude (Claude Code, or claude.ai with Artifacts) and say:

> Set up the release tracker from this guide for my project.

Everything Claude needs is below: what the tracker is, the rules it enforces, the data it reads, how to publish it and keep it live, and the full page source.

---

## What it is

A live, clickable status board for a **build → test → triage → fix → re-test** loop, usually run by parallel AI agents. It answers:

- What is every agent doing right now?
- Which features have passed, and which are still failing?
- Which bugs are open, being fixed, waiting for a re-test, or **verified fixed**?
- Which bugs belong to this work, and which were already broken or belong to someone else?
- Which bugs need a person?

The board works in **layers**: click any number, feature, round, bug or agent to go one layer deeper. The **breadcrumb trail is the path you took**, so you can always click back to the summary page you came from, and it restores your scroll position there. Browser Back works, and every layer has its own link you can share.

The **World** view draws the same release as one full-width 3D scene: the Sun is the release, three rings are the scope groups (**This release**, **Added after the cut**, **Backlog**), each feature is a labelled crystal on its ring, and its bugs, test rounds and agents are satellites. Clicking any object opens its data view over the world, lights up everything related to it and dims the rest, and the **Current / Historic** switch plus the time slider replay the recorded states and mark what changed since. World and Board share one trail (the same `#/` tokens), so Back pops exactly one layer in both. The world engine is the same code the platform screen uses (`src/lib/trackerWorld/trackerWorldEngine.js`); in the page below it sits between the `world-engine:begin` and `world-engine:end` markers and is generated, never edited by hand. After changing that source run `node tools/release-tracker/sync-setup-guide.mjs --write` (it refreshes the page block and this guide's copy).

---

## Instructions for Claude

### 1. Rules the tracker enforces

Treat these as requirements, not suggestions.

1. **Bugs never disappear.** Keep a permanent ledger keyed by bug id. If a later run no longer reports a bug, keep its last state and mark it `carriedOver`.
2. **Bug lifecycle.** A bug moves `open → fixing → fixed_awaiting_retest → retesting → verified`. It can also go to `recurred`, `retest_failed_pending_triage`, `needs_human` or `needs_business_definition`.
3. **Verified means re-tested.** A fix is never "verified" on its own. A bug is `verified` only when the next browser test round passes. If that round has other failures, the bug is verified only if triage doesn't report this bug again. Record the commit tested.
4. **Fix-attempt limit.** After N fix attempts (default 2) on the same bug, set it to `needs_human` and take it out of the automated loop.
5. **Never "done" with unreconciled failures.** If an agent reports failed commands that nobody has reconciled, its status is `done_unreconciled`, not `done`.
6. **Awaiting retest is not passed.** If a fix landed after the last test round, the feature's status is `awaiting_retest`.
7. **Scope check: whose bug is it?** After triage, classify each bug, with evidence:

   | Scope | Meaning | Blocks the feature? | Status |
   |---|---|---|---|
   | `this_feature` | The feature's own change or spec caused it | Yes | (normal lifecycle) |
   | `pre_existing` | Reproduces on the base without this feature's commits | No | `backlog_pre_existing` |
   | `other_feature` | Another feature's change caused it | No (moves to the owner) | `reassigned`, with `scope.owner` |
   | `process_note` | Test harness, environment or spec wording, not a product bug | No | `process_note` |

   A feature whose only remaining bugs are out of scope is `passed_with_backlog`. When unsure, reproduce it on the base; if it doesn't reproduce there, it is `this_feature`.
8. **Live test logs.** Test agents should append one JSON line per checked step (`{step, ok, expect, seen}`) to a log while they run, so failures show up before the round ends (`liveSteps`).
9. **No transcript text.** The snapshot holds labels, statuses, summaries and counts only.

### 2. Produce a snapshot

Whatever runs the loop (a Claude Code workflow, CI, or agents you launch by hand) writes one JSON snapshot in this shape:

```json
{
  "syncedAt": "2026-01-15T10:30:00.000Z",
  "runId": "run-42",
  "repoUrl": "https://github.com/OWNER/REPO",
  "maxFixAttemptsPerBug": 2,
  "maxFixRounds": 4,
  "totals": { "input": 1200, "cacheWrite": 50000, "cacheRead": 900000, "output": 30000 },
  "features": [
    { "key": "checkout-flow", "status": "failing", "rounds": 2,
      "lastResult": { "round": 2, "passed": false, "stepsPassed": 18, "stepsTotal": 20 },
      "openBugs": 2, "backlog": 1, "reassignedIn": 0, "agents": 7 }
  ],
  "agents": [
    { "id": "a1", "label": "validate:checkout-flow:r2", "role": "validate", "feature": "checkout-flow", "round": 2,
      "status": "running", "activity": "$ node walk-journey-3.mjs", "summary": null,
      "startedAt": "2026-01-15T10:01:00Z", "lastActivityAt": "2026-01-15T10:29:00Z",
      "tokens": { "input": 10, "cacheWrite": 4000, "cacheRead": 90000, "output": 2500 },
      "liveSteps": { "checked": 12, "passed": 11, "failed": [ { "step": "J3.2", "expect": "Total shows $40", "seen": "Total shows $0" } ], "errors": [] },
      "signals": [], "failures": [] }
  ],
  "bugs": [
    { "id": "checkout-flow-B3", "feature": "checkout-flow", "status": "fixed_awaiting_retest", "class": "rendering",
      "attempts": 1, "step": "J3.2 order total", "rootCause": "Total computed before discounts load", "files": ["src/cart.js"],
      "scope": { "scope": "this_feature", "owner": null, "evidence": "Introduced by abc1234", "decidedBy": "scope:checkout-flow:r1" },
      "history": [
        { "round": 1, "event": "found", "note": "Total shows $0" },
        { "round": 1, "event": "fixed", "note": "Wait for discounts", "commit": "def5678" }
      ] }
  ]
}
```

Notes:
- Agent `role` is one of `build`, `integrate`, `validate`, `triage`, `scope`, `fix`, `reconcile`, `record`. Label agents `<role>:<feature>:r<round>` so they group by feature and round.
- Agent `status`: `running`, `done`, `failed`, `done_unreconciled`. Feature `status`: `queued`, a running role name, `failing`, `awaiting_retest`, `passed`, `passed_with_backlog`, `needs_human`, `failed`.
- History `event`: `found`, `recurred`, `fixed`, `not_fixed`, `verified`, `seen`.
- Bug ids stay stable across rounds: triage links a re-reported bug to its earlier id (`recurrenceOf`).

### 3. Publish the page (claude.ai Artifacts)

1. Save the page source at the end of this guide as `release-tracker.html`.
2. Publish it as an Artifact with the **`db` capability**. Use one rule: collection `tracker`, read for anyone who can **view** the artifact, write for the **owner** only. Load the `artifact-capabilities` skill first for the exact capability syntax.
3. Write the snapshot to the artifact database: collection `tracker`, document `current`, a single field `json` holding the **stringified** snapshot. Use `ArtifactData` `set`, passing the `file_path` of a file containing `{"json": "<snapshot as a string>"}`, and `if_version` once the document exists.
4. The page subscribes to that document and re-renders on every write. Nothing else is needed.

### 4. Keep it live

- After every stage finishes (an agent starts or ends), rebuild the snapshot and write it again. A simple approach is a watcher on the run's event log that triggers a sync. Also sync on a 15-minute heartbeat so "last activity" times stay honest.
- Keep the bug ledger (rule 1) in a file the sync reads and updates.
- Optionally commit an exported state file after each sync, so a new Claude session can resume the loop without re-instruction.

### 5. Without Artifacts

- **Local preview:** put a stub before the page script so it reads a local snapshot:
  `<script>window.claude={use:async()=>({doc:()=>({onSnapshot:(cb)=>cb({json: JSON.stringify(SNAPSHOT)})})})};</script>`
- **Markdown report:** render the same snapshot as Markdown with the same layers (overview → features → feature detail → bug detail), joined by anchor links, and commit it next to your release log.

---

## Page source

Single file, no build step. It uses Google Fonts (optional), handles light and dark mode, and works at phone width.

```html
<title>Salt Basin Release Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Jost:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<style>
/* Layout: control-room board — summary strip, then feature lanes, live agents, bug queue, agent ledger */
/* Salt Basin design language: cream / parchment surfaces, teal + gold structure, Fraunces + Jost.
   Chart series (--s1..--s4) are validated for CVD separation, chroma and contrast in each mode. */
:root {
  --bg: #F8F4EC; --panel: #FFFCF6; --panel-2: #F1EBDD; --ink: #2B2A28; --muted: #6B665E; --line: #E4DCCB;
  --teal: #345A68; --teal-soft: #DCE9EC; --gold: #9A5F1C; --gold-soft: #F3E3CE;
  --good: #2F6B45; --good-soft: #DCEFE2; --warn: #8A5A12; --warn-soft: #F6E7CC;
  --bad: #A4432F; --bad-soft: #F6DED7; --human: #6E4B7E; --human-soft: #ECE1F1;
  --s1: #0B79A8; --s2: #B0661A; --s3: #9C4A8C; --s4: #4A8C2A; --grid: rgba(43,42,40,.08);
  --water-top: #D3EDF2; --water-mid: #8FC4D1; --water-deep: #4A8BA1; --sand: #8FB3AE;
  --display: "Fraunces", Georgia, serif;
  --body: "Jost", "Segoe UI", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #161A1C; --panel: #1E2325; --panel-2: #252B2E; --ink: #EFE8DC; --muted: #A9A296; --line: #2F3639;
  --teal: #8CC3D3; --teal-soft: #22343B; --gold: #E0A458; --gold-soft: #3A2C17;
  --good: #7CC99A; --good-soft: #163327; --warn: #F0B85A; --warn-soft: #372A10;
  --bad: #EE9580; --bad-soft: #3D1D17; --human: #C7A3D6; --human-soft: #2C2236;
  --s1: #2794C9; --s2: #C27C28; --s3: #B566A6; --s4: #6BA642; --grid: rgba(239,232,220,.08); --water-top: #16404E; --water-mid: #0D2A35; --water-deep: #061820; --sand: #1F332F; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #161A1C; --panel: #1E2325; --panel-2: #252B2E; --ink: #EFE8DC; --muted: #A9A296; --line: #2F3639;
  --teal: #8CC3D3; --teal-soft: #22343B; --gold: #E0A458; --gold-soft: #3A2C17;
  --good: #7CC99A; --good-soft: #163327; --warn: #F0B85A; --warn-soft: #372A10;
  --bad: #EE9580; --bad-soft: #3D1D17; --human: #C7A3D6; --human-soft: #2C2236;
  --s1: #2794C9; --s2: #C27C28; --s3: #B566A6; --s4: #6BA642; --grid: rgba(239,232,220,.08); --water-top: #16404E; --water-mid: #0D2A35; --water-deep: #061820; --sand: #1F332F; color-scheme: dark }
body { background: var(--bg); color: var(--ink); font: 15px/1.5 var(--body); }
.wrap { max-width: 1180px; margin: 0 auto; padding-inline: 16px; padding-block: 20px 48px; display: grid; gap: 22px; }
header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 20px; }
h1 { font: 600 28px/1.15 var(--display); letter-spacing: -0.01em; margin: 0; text-wrap: balance; }
h2 { font: 500 12px/1.2 var(--body); text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); margin: 0 0 10px; }
.sync { font: 12px var(--mono); color: var(--muted); }
.sync b { color: var(--ink); font-weight: 600; }
.live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--good); margin-right: 6px; vertical-align: 1px; }
.stale .live-dot { background: var(--warn); }
.strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.stat { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
.stat .n { font: 600 28px/1 var(--display); font-variant-numeric: tabular-nums; }
.stat .l { font-size: 13px; color: var(--muted); margin-top: 4px; }
.stat.human .n { color: var(--human); } .stat.bad .n { color: var(--bad); } .stat.good .n { color: var(--good); }
.filters { display: flex; flex-wrap: wrap; gap: 6px; }
.filters button { font: 600 13px var(--body); border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
.filters button[aria-pressed="true"] { background: var(--teal); border-color: var(--teal); color: var(--panel); }
.filters button:focus-visible, summary:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
section { min-width: 0; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; font: 600 12px var(--body); color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 9px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td { padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
tr:last-child td { border-bottom: 0; }
.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.muted { color: var(--muted); }
.pill { display: inline-block; font: 600 12px/1 var(--body); padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
.s-running { background: var(--teal-soft); color: var(--teal); }
.s-passed, .s-verified, .s-done { background: var(--good-soft); color: var(--good); }
.s-stalled, .s-failing, .s-open, .s-recurred, .s-retest_failed, .s-failed, .s-done_unreconciled, .s-seen_in_test { background: var(--bad-soft); color: var(--bad); }
.s-fixing, .s-fixed_awaiting_retest, .s-between_stages, .s-awaiting_retest, .s-retesting, .s-retest_failed_pending_triage { background: var(--gold-soft); color: var(--gold); }
.s-needs_human, .s-needs_business_definition { background: var(--human-soft); color: var(--human); }
.s-passed_with_backlog { background: var(--good-soft); color: var(--good); }
.s-backlog_pre_existing, .s-reassigned, .s-process_note, .s-queued, .s-idle_or_done, .s-stopped { background: var(--line); color: var(--muted); }
.bar { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; min-width: 80px; }
.bar i { display: block; height: 100%; background: var(--good); border-radius: 3px; }
.now { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.agent { background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--teal); border-radius: 8px; padding: 12px 14px; min-width: 0; }
.agent .role { font: 600 12px var(--body); text-transform: uppercase; letter-spacing: 0.06em; color: var(--teal); }
.agent .feat { font-weight: 600; margin: 2px 0 6px; overflow-wrap: anywhere; }
.agent .act { font: 12.5px/1.45 var(--mono); color: var(--muted); overflow-wrap: anywhere; }
.agent .meta { font-size: 12px; color: var(--muted); margin-top: 6px; }
.empty { padding: 18px; color: var(--muted); }
details summary { cursor: pointer; list-style: none; }
details summary::-webkit-details-marker { display: none; }
.hist { margin: 8px 0 2px; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 13px; }
a { color: var(--teal); }
.hist li { display: grid; grid-template-columns: 44px 120px 1fr; gap: 8px; }
.callout { background: var(--human-soft); color: var(--ink); border: 1px solid var(--human); border-radius: 8px; padding: 12px 14px; }
.callout b { color: var(--human); }
@media (max-width: 640px) { .hist li { grid-template-columns: 36px 1fr; } .hist li span:last-child { grid-column: 1 / -1; } }
@media (prefers-reduced-motion: no-preference) { .running-anim { animation: pulse 1.6s ease-in-out infinite; } @keyframes pulse { 50% { opacity: .45 } } }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; font-size: 14px; }
.crumbs a { text-decoration: none; font-weight: 600; }
.crumbs a:hover { text-decoration: underline; }
.crumbs .sep { color: var(--muted); }
.crumbs .here { font-weight: 700; overflow-wrap: anywhere; }
.layer-title { font: 600 23px/1.2 var(--display); margin: 0; overflow-wrap: anywhere; }
.layer-sub { color: var(--muted); margin-top: 4px; }
a.stat { display: block; color: inherit; text-decoration: none; transition: border-color .15s, transform .15s; }
a.stat:hover, a.stat:focus-visible { border-color: var(--teal); }
@media (prefers-reduced-motion: no-preference) { a.stat:hover { transform: translateY(-1px); } .layer { animation: enter .22s ease-out; } @keyframes enter { from { opacity: 0; transform: translateY(6px) } } }
a.stat .go, .rowlink .go { color: var(--teal); font-size: 12px; font-weight: 600; }
tr.rowlink { cursor: pointer; }
tr.rowlink:hover td, tr.rowlink:focus-within td { background: var(--teal-soft); }
tr.rowlink a.cell { color: inherit; text-decoration: none; font-weight: 700; }
a.agent { display: block; color: inherit; text-decoration: none; }
a.agent:hover, a.agent:focus-visible { border-color: var(--teal); }
a:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.kv { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; padding: 14px; font-size: 14px; }
.kv dt { color: var(--muted); } .kv dd { margin: 0; overflow-wrap: anywhere; }
.layer { display: grid; gap: 22px; min-width: 0; }
.update { display: block; background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--gold); border-radius: 8px; padding: 14px 16px; color: inherit; text-decoration: none; }
a.update:hover, a.update:focus-visible { border-color: var(--teal); border-left-color: var(--gold); }
.update .ver { font: 600 12px var(--body); text-transform: uppercase; letter-spacing: .06em; color: var(--gold); }
.update .head { font: 600 18px/1.3 var(--display); margin: 4px 0 6px; }
.update ul { margin: 6px 0 0; padding-left: 18px; font-size: 14px; }
.update .note { font-size: 14px; color: var(--ink); }
.md b, .md strong { font-weight: 700; }
/* Trends panel */
.trends { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 18px; display: grid; gap: 14px; min-width: 0; }
.trends-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 6px 16px; }
.trends-head h3 { font: 600 21px/1.2 var(--display); margin: 0; }
.controls { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; padding: 2px; background: var(--panel-2); }
.seg button { font: 500 13px var(--body); border: 0; background: transparent; color: var(--ink); border-radius: 999px; padding: 5px 12px; cursor: pointer; min-height: 32px; }
.seg button[aria-pressed="true"] { background: var(--teal); color: var(--panel); }
.controls select { font: 500 13px var(--body); border: 1px solid var(--line); border-radius: 999px; background: var(--panel-2); color: var(--ink); padding: 6px 12px; min-height: 34px; max-width: 100%; }
.controls label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; display: inline-flex; gap: 8px; align-items: center; }
.legend { display: flex; flex-wrap: wrap; gap: 6px; }
.legend button { font: 500 13px var(--body); display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 999px; padding: 4px 11px; cursor: pointer; min-height: 30px; }
.legend button[aria-pressed="false"] { color: var(--muted); opacity: .6; }
.legend .sw { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
.legend button[aria-pressed="false"] .sw { opacity: .35; }
.asof-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.asof-tiles .stat { padding: 10px 12px; }
.asof-tiles .d { font-size: 12px; color: var(--muted); margin-top: 2px; font-variant-numeric: tabular-nums; }
.chartbox { position: relative; height: 290px; min-width: 0; }
.slider { display: grid; gap: 6px; }
.slider-row { display: flex; align-items: center; gap: 8px; }
.slider input[type=range] { flex: 1; min-width: 0; accent-color: var(--teal); height: 28px; }
.slider .step { font: 600 13px var(--body); border: 1px solid var(--line); background: var(--panel-2); color: var(--ink); border-radius: 999px; min-width: 34px; min-height: 32px; cursor: pointer; }
.slider .live { padding: 0 12px; }
.slider .live[aria-pressed="true"] { background: var(--teal); color: var(--panel); }
.asof { font-size: 13px; color: var(--muted); }
.asof b { color: var(--ink); font-weight: 600; }
.ticks { position: relative; height: 16px; margin: 0 42px 0 42px; }
.ticks span { position: absolute; transform: translateX(-50%); font: 600 11px var(--body); color: var(--gold); white-space: nowrap; }
.update-note { border-left: 3px solid var(--gold); padding: 6px 12px; background: var(--panel-2); border-radius: 0 8px 8px 0; font-size: 14px; }
.spark-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
a.spark { display: block; border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; color: inherit; text-decoration: none; background: var(--panel); min-width: 0; }
a.spark:hover, a.spark:focus-visible { border-color: var(--teal); }
.spark .k { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.spark .v { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.spark svg { display: block; width: 100%; height: 34px; margin-top: 4px; }
.tableview { overflow-x: auto; }
.relpick { font: 500 13px var(--body); color: var(--muted); display: flex; align-items: center; gap: 6px; }
.relpick select { font: 500 13px var(--body); border: 1px solid var(--line); border-radius: 999px; background: var(--panel-2); color: var(--ink); padding: 6px 12px; min-height: 34px; max-width: 100%; }
.frozen-note { background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; margin: 0 0 14px; }
html[data-rt-view="world"] .wrap { max-width: none; padding-inline: 12px; }
html[data-rt-view="world"] header > div:first-child .muted { display: none; }
.rt-world { display: block; }
.head-right { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.bindings { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bindings th, .bindings td { padding: 6px 8px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.bindings th { font: 600 11px var(--body); color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
.src { font: 12px var(--mono); color: var(--teal); overflow-wrap: anywhere; }
.bind-list { display: grid; gap: 8px; }
.bind { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; display: grid; gap: 3px; font-size: 13px; background: var(--panel); }
.bind-top { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.bind-val { font-weight: 600; text-align: right; }
.bind-foot { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 12px; }
.policy { display: inline-block; font: 600 11px/1 var(--body); padding: 3px 7px; border-radius: 999px; background: var(--teal-soft); color: var(--teal); }
.policy.approval { background: var(--gold-soft); color: var(--gold); }
.pending-card { border: 1px dashed var(--gold); border-radius: 10px; padding: 10px 12px; background: var(--gold-soft); font-size: 13px; display: grid; gap: 4px; }
.pending-card ul { margin: 2px 0 0; padding-left: 18px; }
@media (max-width: 640px) { .chartbox { height: 240px; } .trends { padding: 12px; } .ticks { margin: 0 34px; } }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-block; border: 1px solid var(--line); background: var(--panel); border-radius: 999px; padding: 3px 10px; font-size: 13px; font-weight: 600; text-decoration: none; color: var(--ink); }
.chip:hover { border-color: var(--teal); }
.timeline { list-style: none; margin: 0; padding: 14px; display: grid; gap: 10px; }
.timeline li { display: grid; grid-template-columns: 60px 130px 1fr; gap: 10px; font-size: 14px; }
@media (max-width: 640px) { .timeline li { grid-template-columns: 44px 1fr; } .timeline li > :last-child { grid-column: 1 / -1; } .kv { grid-template-columns: 1fr; } .kv dt { margin-top: 6px; } .kv dt:first-child { margin-top: 0; } }
@media (max-width: 640px) {
  /* Tables become stacked cards so nothing needs sideways scrolling; the panel's overflow-x stays as a fallback. */
  .panel table, .panel tbody, .panel tr, .panel td { display: block; width: 100%; box-sizing: border-box; }
  .panel thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .panel tr { padding: 10px 12px; border-bottom: 1px solid var(--line); }
  .panel tr:last-child { border-bottom: 0; }
  .panel td { border: 0; padding: 3px 0; overflow-wrap: anywhere; }
  .panel td[data-label]::before { content: attr(data-label); display: block; font: 600 11px var(--body); color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .panel td .bar { max-width: 100%; }
}
</style>

<div class="wrap">
  <header>
    <div>
      <h1>Release tracker</h1>
      <div class="muted">Click any number, feature, round, bug or agent to go one layer deeper. The trail at the top takes you back.</div>
    </div>
    <div class="head-right">
      <div class="seg" role="group" aria-label="View"><button type="button" data-mode="board" aria-pressed="true">Board</button><button type="button" data-mode="world" aria-pressed="false">World</button></div>
      <label class="relpick">Release <select id="release" aria-label="Release"><option value="">Live release</option></select></label>
      <div class="sync" id="sync"><span class="live-dot"></span>Waiting for the first update…</div>
    </div>
  </header>
  <nav class="crumbs" id="crumbs" aria-label="Where you are"></nav>
  <main id="view"><div class="panel empty">Waiting for the first update…</div></main>
</div>

<script>
const ROLE = { build: 'Build', integrate: 'Integrate', validate: 'Validate', triage: 'Triage', scope: 'Scope check', fix: 'Fix', record: 'Record', reconcile: 'Reconcile' };
const BACKLOG = ['backlog_pre_existing', 'reassigned', 'process_note'];
const STATUS = {
  stalled: 'Stalled (no sign of life)', running: 'Running', passed: 'Passed', failing: 'Failing', queued: 'Queued', between_stages: 'Between stages',
  needs_human: 'Needs a person', needs_business_definition: 'Needs a business decision', open: 'Open', recurred: 'Came back',
  fixing: 'Being fixed', fixed_awaiting_retest: 'Fixed, awaiting re-test', retest_failed: 'Re-test failed', verified: 'Verified fixed',
  done: 'Done', failed: 'Agent stopped', idle_or_done: 'Idle', done_unreconciled: 'Finished, failures not reconciled',
  seen_in_test: 'Seen in test, awaiting triage', retesting: 'Fixed, being retested now',
  retest_failed_pending_triage: 'Retest failed, being triaged', passed_with_backlog: 'Passed (backlog elsewhere)',
  backlog_pre_existing: 'Backlog: was already broken', reassigned: 'Belongs to another feature', process_note: 'Test or process note', stopped: 'Stopped (run replaced)', awaiting_retest: 'Fixed, awaiting retest',
};
const EVENT = { found: 'Found', recurred: 'Came back', fixed: 'Fix applied', not_fixed: 'Not fixed', seen: 'Seen in test', verified: 'Verified fixed' };
const SCOPE = { this_feature: 'This feature', pre_existing: 'Was already broken before this work', other_feature: 'Another feature', process_note: 'Test or process note, not a product bug' };
const BUG_ORDER = { needs_human: 0, needs_business_definition: 1, recurred: 2, retest_failed: 3, open: 4, seen_in_test: 5, fixing: 6, fixed_awaiting_retest: 7, reassigned: 8, backlog_pre_existing: 9, process_note: 10, verified: 11 };
let snap = null;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pill = (s) => `<span class="pill s-${esc(s)}">${esc(STATUS[s] || String(s).replace(/_/g, ' '))}</span>`;
const featStatus = (s) => (STATUS[s] ? pill(s) : `<span class="pill s-running running-anim">${esc(String(s).split(', ').map((r) => ROLE[r] || r).join(' + '))}</span>`);
const ago = (iso) => { if (!iso) return '—'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`; };
const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n || 0));
const enc = encodeURIComponent;
// The URL is the path the viewer took: one token per layer (#/stat:open-bugs/bug:<id>). A link goes one
// layer deeper from where the viewer is; if that layer is already on the path, it returns to it.
let path = [];
const tok = (...parts) => parts.map((p) => enc(p)).join(':');
const href = (...parts) => {
  const t = parts[0] === 'feature' && parts[2] === 'round' ? tok('round', parts[1], parts[3]) : tok(...parts);
  const i = path.indexOf(t);
  const next = i >= 0 ? path.slice(0, i + 1) : [...path, t];
  return `#/${next.join('/')}`;
};
const commit = (c) => (c ? ` <a class="mono" href="${esc((snap.repoUrl || '') + '/commit/' + c)}" target="_blank" rel="noopener">${esc(String(c).slice(0, 7))}</a>` : '');
const mdb = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const updateLabel = (u) => `${u.version} · ${u.at.replace('T', ' ').slice(0, 16)} UTC`;
const sortBugs = (list) => [...list].sort((a, b) => (BUG_ORDER[a.status] ?? 7) - (BUG_ORDER[b.status] ?? 7));
const ownBugs = (key) => (snap.bugs || []).filter((b) => b.status !== 'seen_in_test' && ((b.feature === key && !BACKLOG.includes(b.status)) || (b.status === 'reassigned' && b.scope?.owner === key)));
const agentName = (a) => `${ROLE[a.role] || a.role || 'Agent'}${a.round ? ` · round ${a.round}` : ''}`;

// The layers. Each takes the route parts and returns { crumbs: [[label, href]...], html }.
const STATS = {
  'features-passed': { label: 'Features passed', tone: 'good', count: (s) => `${s.features.filter((f) => ['passed', 'passed_with_backlog'].includes(f.status)).length} / ${s.features.length}`, list: 'features', pick: (s) => s.features.filter((f) => ['passed', 'passed_with_backlog'].includes(f.status)), note: 'Features whose latest test round passed every journey step.' },
  'agents-running': { label: 'Agents running', tone: '', count: (s) => s.agents.filter((a) => a.status === 'running').length, list: 'agents', pick: (s) => s.agents.filter((a) => a.status === 'running'), note: 'Agents working right now, with their latest step.' },
  'open-bugs': { label: 'Open bugs (this work)', tone: 'bad', count: (s) => s.bugs.filter((b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status)).length, list: 'bugs', pick: (s) => s.bugs.filter((b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status)), note: 'Bugs caused by this work that are not yet verified fixed. They block their feature.' },
  backlog: { label: 'Backlog: not this work', tone: '', count: (s) => s.bugs.filter((b) => BACKLOG.includes(b.status)).length, list: 'bugs', pick: (s) => s.bugs.filter((b) => BACKLOG.includes(b.status)), note: 'Bugs the scope check placed elsewhere: already broken before this work, another feature’s, or a test/process note. They stay here until fixed and verified.' },
  verified: { label: 'Bugs verified fixed', tone: 'good', count: (s) => s.bugs.filter((b) => b.status === 'verified').length, list: 'bugs', pick: (s) => s.bugs.filter((b) => b.status === 'verified'), note: 'Bugs whose step passed in a later browser test after the fix.' },
  human: { label: 'Need a person', tone: 'human', count: (s) => s.bugs.filter((b) => ['needs_human', 'needs_business_definition'].includes(b.status)).length, list: 'bugs', pick: (s) => s.bugs.filter((b) => ['needs_human', 'needs_business_definition'].includes(b.status)), note: 'Out of the automated loop: fix attempts ran out, or a business decision is missing.' },
  unreconciled: { label: 'Finished with unreconciled failures', tone: 'bad', count: (s) => s.agents.filter((a) => a.status === 'done_unreconciled').length, list: 'agents', pick: (s) => s.agents.filter((a) => a.status === 'done_unreconciled'), note: 'Agents that finished but reported failures nobody has reconciled yet. They are not done.' },
  updates: { label: 'Status updates', tone: '', count: (s) => (s.updates || []).length ? s.updates[s.updates.length - 1].version : '—', list: 'updates', pick: () => [], note: '' },
  tokens: { label: 'Tokens out / cache read', tone: '', count: (s) => `${k(s.totals?.output)} / ${k(s.totals?.cacheRead)}`, list: 'agents', pick: (s) => [...s.agents].sort((a, b) => (b.tokens?.output || 0) - (a.tokens?.output || 0)), note: 'Every agent run, most output tokens first.' },
};

// Release scope (server/lib/releaseScope.js): planned = this release's work, added = joined after the cut,
// backlog = kept on the record but not this release's work. Snapshots from before scopes existed show one list.
function scopeGroups(s) {
  const kinds = s.release?.kinds || {}; const out = { planned: [], added: [], backlog: [], other: [] };
  for (const f of s.features || []) {
    const sc = f.scope || (kinds[f.key] === 'carried_backlog' ? 'backlog' : kinds[f.key] ? 'planned' : 'not_in_release');
    if (f.added) out.added.push(f); else if (sc === 'backlog') out.backlog.push(f); else if (sc === 'planned') out.planned.push(f); else out.other.push(f);
  }
  return out;
}
// The release's scope at a glance (top of the overview): features and their open bugs per group.
const SCOPE_GROUPS = [
  ['planned', 'This release: planned work', 'Planned at the cut plus anything added into planned. Only these count toward the release.'],
  ['added', 'Added after the cut', 'Features that joined after the release was cut, with when, why and whether they count.'],
  ['backlog', 'Backlog: not this release', 'Everything kept on the record but not worked or counted in this release, including features added after the cut into backlog.'],
];
function scopeMembers(s, key) {
  const g = scopeGroups(s);
  if (key === 'planned') return [...g.planned, ...g.added.filter((f) => f.scope === 'planned')];
  if (key === 'backlog') return [...g.backlog, ...g.added.filter((f) => f.scope !== 'planned')];
  return g[key] || [];
}
function scopeSummary(s) {
  if (!(s.features || []).some((f) => f.scope)) return '';
  const openOf = (list) => list.reduce((n, f) => n + ownBugs(f.key).filter((b) => b.status !== 'verified').length, 0);
  const tiles = SCOPE_GROUPS.map(([key, label]) => {
    const list = scopeMembers(s, key); const passed = list.filter((f) => ['passed', 'passed_with_backlog'].includes(f.status)).length;
    const sub = key === 'added' ? `${list.filter((f) => f.scope === 'planned').length} counted in this release · ${list.filter((f) => f.scope !== 'planned').length} in backlog` : `${passed} of ${list.length} passed`;
    return `<a class="stat${key === 'planned' ? ' good' : ''}" href="${href('scope', key)}" data-testid="rt-scope-${key}"><div class="n">${list.length}</div><div class="l">${esc(label)}</div><div class="d muted" style="font-size:12px;margin-top:2px">${esc(sub)} · ${openOf(list)} open bugs</div><div class="go">Open ›</div></a>`;
  }).join('');
  return section(`Release ${s.release?.version || ''} scope: this release vs backlog`, `<div class="strip">${tiles}</div>`);
}
function featureSections(s) {
  if (!(s.features || []).some((f) => f.scope)) return section('Features', featureRows(s.features));
  const g = scopeGroups(s); const done = g.planned.filter((f) => f.status === 'passed' || f.status === 'passed_with_backlog').length;
  const addedNote = g.added.length ? `<div class="panel muted" style="margin-bottom:8px">${g.added.map((f) => `<div style="margin-bottom:6px"><b>${esc(f.key)}</b> · added ${esc(String(f.added.at || '').slice(0, 10))}${f.added.commit ? ` (${esc(f.added.commit)})` : ''} · ${f.scope === 'planned' ? 'counted in this release' : 'kept in backlog'} · ${esc(f.added.reason || '')}</div>`).join('')}</div>` : '';
  return section(`Planned at the cut: ${done} of ${g.planned.length} passed`, featureRows(g.planned))
    + (g.added.length ? section(`Added after the cut (${g.added.length})`, addedNote + featureRows(g.added)) : '')
    + section(`Backlog: kept on the record, not this release's work (${g.backlog.length})`, featureRows(g.backlog))
    + (g.other.length ? section(`Other tracked work (${g.other.length})`, featureRows(g.other)) : '');
}
function featureRows(list) {
  if (!list.length) return '<div class="panel empty">Nothing here.</div>';
  return `<div class="panel"><table><thead><tr><th>Feature</th><th>Status</th><th>Latest test</th><th class="num">Rounds</th><th>Its own bugs verified</th></tr></thead><tbody>${list.map((f) => {
    const r = f.lastResult; const pct = r && r.stepsTotal ? Math.round((r.stepsPassed / r.stepsTotal) * 100) : 0;
    const own = ownBugs(f.key); const v = own.filter((b) => b.status === 'verified').length;
    return `<tr class="rowlink" data-href="${href('feature', f.key)}"><td><a class="cell" href="${href('feature', f.key)}">${esc(f.key)}</a></td><td data-label="Status">${featStatus(f.status)}</td><td data-label="Latest test">${r ? `<div class="num">Round ${r.round}: ${r.stepsPassed}/${r.stepsTotal} steps${r.baseline ? ` · baseline v${r.baseline}` : ''}</div><div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` : '<span class="muted">Not tested yet</span>'}</td><td data-label="Rounds" class="num">${f.rounds}</td><td data-label="Its own bugs verified">${own.length ? `<div class="num">${v} of ${own.length}</div><div class="bar" aria-hidden="true"><i style="width:${Math.round((v / own.length) * 100)}%"></i></div>` : '<span class="muted">None of its own</span>'}${f.backlog ? `<div class="muted">+ ${f.backlog} in backlog</div>` : ''}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function bugRows(list, showFeature = true) {
  if (!list.length) return '<div class="panel empty">No bugs here.</div>';
  return `<div class="panel"><table><thead><tr><th>Bug</th>${showFeature ? '<th>Feature</th>' : ''}<th>Status</th><th class="num">Fix attempts</th><th>What fails</th></tr></thead><tbody>${sortBugs(list).map((b) => `<tr class="rowlink" data-href="${href('bug', b.id)}"><td class="mono"><a class="cell" href="${href('bug', b.id)}">${esc(b.id)}</a>${b.carriedOver ? '<div class="muted">kept from an earlier run</div>' : ''}</td>${showFeature ? `<td data-label="Feature">${esc(b.feature)}${b.status === 'reassigned' && b.scope?.owner ? `<div class="muted">→ ${esc(b.scope.owner)}</div>` : ''}</td>` : ''}<td data-label="Status">${pill(b.status)}</td><td class="num" data-label="Fix attempts">${b.attempts || 0} / ${esc(snap.maxFixAttemptsPerBug)}</td><td data-label="What fails">${esc(b.step)}</td></tr>`).join('')}</tbody></table></div>`;
}
function agentRows(list) {
  const trimmed = snap.agentsTrimmed ? `<div class="muted" style="font-size:13px;margin:6px 0">${snap.agentsTrimmed} older finished agent runs are not shown here to keep the live tracker fast; their full records are in the release logs.</div>` : '';
  if (!list.length) return `${trimmed}<div class="panel empty">No agent runs here.</div>`;
  return `${trimmed}<div class="panel"><table><thead><tr><th>Agent</th><th>Status</th><th>Result</th><th class="num">Tokens (out / cache read)</th><th>Last activity</th></tr></thead><tbody>${list.map((a) => `<tr class="rowlink" data-href="${href('agent', a.id)}"><td><a class="cell" href="${href('agent', a.id)}">${esc(agentName(a))}</a><div class="muted">${esc(a.feature || '—')}</div></td><td data-label="Status">${pill(a.status)}</td><td data-label="Result">${esc(a.summary || '—')}${a.failures?.length ? `<div class="muted">${a.failures.length} command failure${a.failures.length > 1 ? 's' : ''} reported</div>` : ''}</td><td class="num" data-label="Tokens (out / cache read)">${k(a.tokens?.output)} / ${k(a.tokens?.cacheRead)}</td><td class="muted" data-label="Last activity">${esc(ago(a.lastActivityAt))}</td></tr>`).join('')}</tbody></table></div>`;
}
function agentCards(list) {
  if (!list.length) return '<div class="panel empty">No agent is running here right now.</div>';
  return `<div class="now">${list.map((a) => `<a class="agent" href="${href('agent', a.id)}"><div class="role">${esc(agentName(a))}</div><div class="feat">${esc(a.feature)}</div><div class="act">${esc(a.activity || 'Starting…')}</div>${a.role === 'validate' && a.liveSteps ? `<div class="meta">${a.liveSteps.checked} checks · ${a.liveSteps.passed} passed · <b>${a.liveSteps.failed.length} failed</b></div>` : ''}<div class="meta">Started ${esc(ago(a.startedAt))} · last step ${esc(ago(a.lastActivityAt))}</div></a>`).join('')}</div>`;
}
const section = (title, html) => `<section><h2>${esc(title)}</h2>${html}</section>`;


// ---- Trends: graphs over the release's recorded history, with toggles, a feature filter and a time slider.
// History (tracker/history) is every recorded state of the release; nothing is overwritten, so any earlier
// moment can be replayed. Per point: f[key] = [status, round, stepsPassed, stepsTotal, open, verified, backlog, needsPerson].
let hist = null; let chart = null;
const T = { measure: 'bugs', view: 'totals', feature: 'all', at: null, live: true, hidden: {}, table: false };
try { Object.assign(T, JSON.parse(localStorage.getItem('rt-trends') || '{}'), { at: null, live: true }); } catch {}
const saveT = () => { try { const { at, live, ...keep } = T; localStorage.setItem('rt-trends', JSON.stringify(keep)); } catch {} };
const PASSED_S = ['passed', 'passed_with_backlog'];
const BUG_SERIES = [
  { key: 'open', label: 'Open (this work)', idx: 4, color: '--s1' },
  { key: 'verified', label: 'Verified fixed', idx: 5, color: '--s2' },
  { key: 'backlog', label: 'Backlog (not this work)', idx: 6, color: '--s3' },
  { key: 'person', label: 'Waiting on a person', idx: 7, color: '--s4' },
];
const cssv = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmtT = (iso) => { const d = new Date(iso); return `${d.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} ${d.toISOString().slice(11, 16)}`; };
const rows = (pt) => Object.entries(pt.f).filter(([k]) => T.feature === 'all' || k === T.feature);
function measureAt(pt) {
  const r = rows(pt);
  if (T.measure === 'bugs') return Object.fromEntries(BUG_SERIES.map((s) => [s.key, r.reduce((n, [, v]) => n + (v[s.idx] || 0), 0)]));
  if (T.measure === 'features') return { passed: r.filter(([, v]) => PASSED_S.includes(v[0])).length, tested: r.filter(([, v]) => v[3]).length };
  const scored = r.filter(([, v]) => v[3]);
  return { score: scored.length ? Math.round((scored.reduce((n, [, v]) => n + v[2] / v[3], 0) / scored.length) * 1000) / 10 : null };
}
function seriesDefs() {
  if (T.measure === 'bugs') return BUG_SERIES.map((s) => ({ key: s.key, label: s.label, color: s.color }));
  if (T.measure === 'features') return [{ key: 'passed', label: 'Features passed', color: '--s1' }, { key: 'tested', label: 'Features tested at least once', color: '--s2' }];
  return [{ key: 'score', label: T.feature === 'all' ? 'Average step pass rate (tested features)' : 'Step pass rate', color: '--s1' }];
}
// The update in force at a point: the latest update recorded at or before it.
// An update belongs to the recorded state nearest its time (they are written seconds apart).
const pointIndexAt = (iso) => { const t = Date.parse(iso); let best = 0; hist.points.forEach((p, j) => { if (Math.abs(Date.parse(p.t) - t) < Math.abs(Date.parse(hist.points[best].t) - t)) best = j; }); return best; };
const updateAt = (pt) => { const i = hist.points.indexOf(pt); return [...(hist?.updates || [])].reverse().find((u) => pointIndexAt(u.at) <= i) || null; };

function trendsHtml() {
  if (!hist || !hist.points?.length) return `<section class="trends"><div class="trends-head"><h3>Release trends</h3></div><div class="empty">Trend history loads with the next sync.</div></section>`;
  const keys = Object.keys(hist.points[hist.points.length - 1].f);
  const seg = (name, opts) => `<div class="seg" role="group" aria-label="${esc(name)}">${opts.map(([v, l]) => `<button type="button" data-t="${name}" data-v="${v}" aria-pressed="${T[name] === v}">${esc(l)}</button>`).join('')}</div>`;
  return `<section class="trends" id="trends">
    <div class="trends-head"><h3>Release trends${snap.release?.version ? ` · ${esc(snap.release.version)}` : ''}</h3><span class="asof">History since <b>${esc(fmtT(hist.points[0].t))} UTC</b> · ${hist.points.length} recorded states · ${(hist.updates || []).length} updates</span></div>
    <div class="controls">
      <label>Show ${seg('measure', [['bugs', 'Bugs'], ['scores', 'Test scores'], ['features', 'Features passed']])}</label>
      <label>As ${seg('view', [['totals', 'Totals'], ['change', 'Change per update']])}</label>
      <label>Feature <select id="t-feature"><option value="all">All features</option>${keys.map((k) => `<option value="${esc(k)}" ${T.feature === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
      <div class="seg" role="group" aria-label="View"><button type="button" id="t-table" aria-pressed="${T.table}">Table view</button></div>
    </div>
    <div class="legend" id="t-legend"></div>
    <div class="asof-tiles" id="t-tiles"></div>
    <div class="chartbox" id="t-chartbox"><canvas id="t-chart" role="img" aria-label="Release trend chart"></canvas></div>
    <div class="tableview" id="t-tableview" hidden></div>
    <div class="slider">
      <div class="ticks" id="t-ticks" aria-hidden="true"></div>
      <div class="slider-row">
        <button type="button" class="step" id="t-prev" title="Previous update" aria-label="Previous update">‹</button>
        <input type="range" id="t-range" min="0" max="${hist.points.length - 1}" step="1" value="${hist.points.length - 1}" aria-label="Move through the release history">
        <button type="button" class="step" id="t-next" title="Next update" aria-label="Next update">›</button>
        <button type="button" class="step live" id="t-live" aria-pressed="true">Live</button>
      </div>
      <div class="asof" id="t-asof"></div>
    </div>
    <div id="t-note"></div>
    <div><h2 style="margin-top:6px">Test score by feature</h2><div class="spark-grid" id="t-sparks"></div></div>
  </section>`;
}

function renderTiles(i) {
  const pt = hist.points[i]; const cur = measureAt(pt); const u = updateAt(pt);
  const prevU = u ? (hist.updates || [])[(hist.updates || []).indexOf(u) - 1] : null;
  const base = prevU ? measureAt(hist.points[pointIndexAt(prevU.at)]) : null;
  $('t-tiles').innerHTML = seriesDefs().map((d) => {
    const v = cur[d.key]; const b = base?.[d.key];
    const delta = v != null && b != null ? v - b : null;
    const unit = T.measure === 'scores' ? '%' : '';
    return `<div class="stat"><div class="n">${v == null ? '—' : esc(v + unit)}</div><div class="l">${esc(d.label)}</div><div class="d">${delta == null ? 'no earlier update to compare' : delta === 0 ? `no change since ${esc(prevU.version)}` : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}${unit} since ${esc(prevU.version)}`}</div></div>`;
  }).join('');
}

function renderAsOf(i) {
  const pt = hist.points[i]; const u = updateAt(pt); const last = i === hist.points.length - 1;
  $('t-asof').innerHTML = `${last ? '<b>Live</b> · ' : ''}As of <b>${esc(fmtT(pt.t))} UTC</b> · commit ${commit(pt.c) || esc(pt.c)}${u ? ` · after update <a href="${href('update', u.version)}">${esc(u.version)}</a>` : ' · before the first update'}`;
  const full = u && (snap.updates || []).find((x) => x.version === u.version);
  $('t-note').innerHTML = full ? `<div class="update-note"><b>${esc(full.version)}</b>${full.headline ? ` — ${esc(full.headline)}` : ''} · <a href="${href('update', full.version)}">Read the update notes ›</a></div>` : '';
  const live = $('t-live'); live.setAttribute('aria-pressed', String(last));
}

function sparkSvg(vals, at) {
  const W = 200; const H = 34; const n = vals.length;
  const pts = vals.map((v, j) => (v == null ? null : [n > 1 ? (j / (n - 1)) * (W - 8) + 4 : W / 2, H - 4 - (v / 100) * (H - 8)]));
  let d = ''; let pen = false;
  for (const p of pts) { if (!p) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; }
  const m = pts[at];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><line x1="4" x2="${W - 4}" y1="${H - 4}" y2="${H - 4}" stroke="var(--grid)" stroke-width="1"/>${d ? `<path d="${d}" fill="none" stroke="var(--s1)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>` : ''}${m ? `<circle cx="${m[0]}" cy="${m[1]}" r="4" fill="var(--s1)" stroke="var(--panel)" stroke-width="2"/>` : ''}</svg>`;
}
function renderSparks(i) {
  const keys = Object.keys(hist.points[hist.points.length - 1].f).filter((k) => T.feature === 'all' || k === T.feature);
  $('t-sparks').innerHTML = keys.map((k) => {
    const vals = hist.points.map((p) => { const v = p.f[k]; return v && v[3] ? Math.round((v[2] / v[3]) * 1000) / 10 : null; });
    const v = hist.points[i].f[k];
    return `<a class="spark" href="${href('feature', k)}" title="${esc(k)}: step pass rate over time"><div class="k">${esc(k)}</div><div class="v">${v && v[3] ? `round ${v[1]}: ${v[2]}/${v[3]} steps (${vals[i]}%)` : 'not tested yet'} · ${esc(STATUS[v?.[0]] || (v?.[0] ? String(v[0]).split(', ').map((r) => ROLE[r] || r).join(' + ') : '—'))}</div>${sparkSvg(vals, i)}</a>`;
  }).join('');
}

function renderTable() {
  const box = $('t-tableview'); box.hidden = !T.table; $('t-chartbox').hidden = T.table;
  if (!T.table) return;
  const defs = seriesDefs();
  box.innerHTML = `<table><thead><tr><th>When (UTC)</th><th>Update</th>${defs.map((d) => `<th class="num">${esc(d.label)}</th>`).join('')}</tr></thead><tbody>${[...hist.points].reverse().map((p) => { const m = measureAt(p); const u = updateAt(p); return `<tr><td class="num" data-label="When (UTC)">${esc(fmtT(p.t))}</td><td data-label="Update">${u ? esc(u.version) : '—'}</td>${defs.map((d) => `<td class="num" data-label="${esc(d.label)}">${m[d.key] ?? '—'}</td>`).join('')}</tr>`; }).join('')}</tbody></table>`;
}

const markersPlugin = {
  id: 'rtMarkers',
  afterDatasetsDraw(c) {
    if (T.view !== 'totals') return;
    const { ctx, chartArea: a, scales: { x } } = c;
    ctx.save();
    for (const u of hist.updates || []) {   // update markers: dashed gold rules
      const px = x.getPixelForValue(pointIndexAt(u.at));
      ctx.strokeStyle = cssv('--gold'); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
    }
    const px = x.getPixelForValue(T.at);   // slider cursor: solid ink rule
    ctx.setLineDash([]); ctx.strokeStyle = cssv('--ink'); ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
    ctx.restore();
  },
};

function renderChart() {
  if (!window.Chart) { $('t-chartbox').innerHTML = '<div class="empty">The chart library did not load. Use Table view.</div>'; return; }
  const defs = seriesDefs(); const ink = cssv('--muted'); const grid = cssv('--grid');
  const font = { family: cssv('--body') || 'Jost', size: 12 };
  let labels; let datasets; let type;
  if (T.view === 'totals') {
    type = 'line';
    labels = hist.points.map((p) => fmtT(p.t));
    datasets = defs.map((d) => ({ label: d.label, key: d.key, data: hist.points.map((p) => measureAt(p)[d.key]), borderColor: cssv(d.color), backgroundColor: cssv(d.color), borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHitRadius: 12, tension: 0, spanGaps: true, hidden: !!T.hidden[d.key] }));
  } else {
    // Change per update: each update compared with the one before it, then live vs the last update.
    type = 'bar';
    const ups = hist.updates || []; const marks = ups.map((u) => ({ label: u.version, i: pointIndexAt(u.at) }));
    marks.push({ label: 'Live', i: hist.points.length - 1 });
    const pairs = marks.slice(1).map((m, j) => ({ label: `${marks[j].label} → ${m.label}`, a: measureAt(hist.points[marks[j].i]), b: measureAt(hist.points[m.i]) }));
    labels = pairs.map((p) => p.label);
    datasets = defs.map((d) => ({ label: d.label, key: d.key, data: pairs.map((p) => (p.a[d.key] != null && p.b[d.key] != null ? Math.round((p.b[d.key] - p.a[d.key]) * 10) / 10 : null)), backgroundColor: cssv(d.color), borderRadius: 4, borderSkipped: false, borderColor: cssv('--panel'), borderWidth: 2, maxBarThickness: 26, hidden: !!T.hidden[d.key] }));
  }
  if (chart) chart.destroy();
  chart = new Chart($('t-chart'), {
    type, data: { labels, datasets }, plugins: [markersPlugin],
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: cssv('--panel'), titleColor: cssv('--ink'), bodyColor: cssv('--ink'), borderColor: cssv('--line'), borderWidth: 1, titleFont: font, bodyFont: font, padding: 10, usePointStyle: true,
          callbacks: { afterTitle: (it) => { if (T.view !== 'totals') return ''; const u = updateAt(hist.points[it[0].dataIndex]); return u ? `after ${u.version}` : ''; },
            label: (c) => ` ${c.dataset.label}: ${c.parsed.y == null ? '—' : (T.view === 'change' && c.parsed.y > 0 ? '+' : '') + c.parsed.y + (T.measure === 'scores' ? '%' : '')}` } },
      },
      scales: {
        x: { ticks: { color: ink, font, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false }, border: { color: grid } },
        y: { beginAtZero: T.view === 'totals', suggestedMax: T.measure === 'scores' && T.view === 'totals' ? 100 : undefined, ticks: { color: ink, font, precision: 0, callback: (v) => v + (T.measure === 'scores' ? '%' : '') }, grid: { color: grid }, border: { display: false } },
      },
      onClick: (e, els) => { if (T.view === 'totals' && els.length) setAt(els[0].index); },
    },
  });
}

function renderLegend() {
  $('t-legend').innerHTML = seriesDefs().map((d) => `<button type="button" data-series="${esc(d.key)}" aria-pressed="${!T.hidden[d.key]}"><span class="sw" style="background:var(${d.color})"></span>${esc(d.label)}</button>`).join('');
}
function renderTicks() {
  const n = hist.points.length - 1;
  $('t-ticks').innerHTML = (hist.updates || []).map((u) => `<span style="left:${n ? (pointIndexAt(u.at) / n) * 100 : 50}%">${esc(u.version.split('-').pop())}</span>`).join('');
}
function setAt(i, fromUser = true) {
  T.at = Math.max(0, Math.min(hist.points.length - 1, i)); T.live = T.at === hist.points.length - 1;
  $('t-range').value = T.at; renderTiles(T.at); renderAsOf(T.at); renderSparks(T.at); if (chart) chart.draw();
}
function mountTrends() {
  if (!hist || !$('trends')) return;
  if (T.live || T.at == null || T.at > hist.points.length - 1) T.at = hist.points.length - 1;
  renderLegend(); renderTicks(); renderTable(); if (!T.table) renderChart(); setAt(T.at, false);
  const box = $('trends');
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t) { T[b.dataset.t] = b.dataset.v; T.hidden = {}; saveT(); route(); return; }
    if (b.dataset.series) { T.hidden[b.dataset.series] = !T.hidden[b.dataset.series]; saveT(); renderLegend(); renderChart(); return; }
    if (b.id === 't-table') { T.table = !T.table; saveT(); route(); return; }
    if (b.id === 't-live') { setAt(hist.points.length - 1); return; }
    if (b.id === 't-prev' || b.id === 't-next') {   // step to the previous / next update marker
      const idx = (hist.updates || []).map((u) => pointIndexAt(u.at));
      const target = b.id === 't-prev' ? [...idx].reverse().find((x) => x < T.at) : idx.find((x) => x > T.at);
      setAt(target ?? (b.id === 't-prev' ? 0 : hist.points.length - 1));
    }
  });
  $('t-range').addEventListener('input', (e) => setAt(Number(e.target.value)));
  $('t-feature').addEventListener('change', (e) => { T.feature = e.target.value; saveT(); route(); });
}



// ---- Render bindings: the world is a view. Every visual channel it draws is declared here and points to the
// source field it reads (Port → object → field), how the value is transformed, what the legend says, and how
// changes arrive (live, or requiring approval). The renderer only receives bound values; anything unbound is
// "not mapped", never invented. Platform version: server/lib/renderBindingRegistry.js (docs/changes/render-bindings.md).
const SOURCE_PORT = { key: 'release-tracker', label: 'Release tracker snapshot', type: 'platform_table' };
const BINDINGS = [
  { id: 'crystal.colour', mark: 'Crystal', channel: 'Colour', object: 'features', field: 'status', transform: 'status → tone', legend: 'Feature status', policy: 'live', read: (f) => statusText(f.status) },
  { id: 'crystal.size', mark: 'Crystal', channel: 'Size', object: 'features', field: 'lastResult.stepsTotal', transform: '÷ largest suite → 0.35–1', legend: 'Test steps in the suite', policy: 'live', read: (f) => (f.lastResult ? `${f.lastResult.stepsTotal} steps` : 'not tested') },
  { id: 'crystal.ring', mark: 'Crystal', channel: 'Gold ring', object: 'features', field: 'lastResult.stepsPassed ÷ stepsTotal', transform: 'calculation → arc 0–1', legend: 'Share of steps passing', policy: 'requires_approval', approver: 'a browser test round', read: (f) => (f.lastResult ? `${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal} (${Math.round((f.lastResult.stepsPassed / f.lastResult.stepsTotal) * 100)}%)` : 'not tested') },
  { id: 'crystal.river', mark: 'Crystal', channel: 'Bubble stream', object: 'agents', field: 'status = running (feature)', transform: 'any → on/off', legend: 'An agent is working on it', policy: 'live', read: (f) => (snap.agents.some((a) => a.feature === f.key && a.status === 'running') ? 'yes' : 'no') },
  { id: 'satellite.colour', mark: 'Satellite', channel: 'Colour', object: 'bugs', field: 'status', transform: 'status → series', legend: 'Bug state', policy: 'requires_approval', approver: 'the next browser re-test', read: (f) => { const b = (snap.bugs || []).filter((x) => x.feature === f.key && x.status !== 'seen_in_test'); return `${b.length} bugs`; } },
  { id: 'satellite.ghost', mark: 'Satellite', channel: 'Ghost (translucent)', object: 'bugs', field: 'status ∈ fixed_awaiting_retest, retesting', transform: 'pending → translucent', legend: 'Fix proposed, awaiting re-test', policy: 'requires_approval', approver: 'the next browser re-test', read: (f) => `${pendingFor(f.key).length} pending` },
];
const PENDING = ['fixed_awaiting_retest', 'retesting'];
const pendingFor = (key) => (snap.bugs || []).filter((b) => b.feature === key && PENDING.includes(b.status));
const policyPill = (b) => (b.policy === 'live' ? '<span class="policy">Live</span>' : `<span class="policy approval">Needs approval</span>`);
const srcText = (b) => `${SOURCE_PORT.key} › ${b.object} › ${b.field}`;
function dataMapTable(f) {
  return `<div class="bind-list">${BINDINGS.map((b) => `<div class="bind"><div class="bind-top"><b>${esc(b.mark)} ${esc(b.channel.toLowerCase())}</b>${f ? `<span class="bind-val">${esc(b.read(f))}</span>` : ''}</div><div class="muted">${esc(b.legend)}</div><div class="src">${esc(srcText(b))}</div><div class="bind-foot">${policyPill(b)}<span class="muted">${esc(b.transform)}${b.approver ? ` · approved by ${esc(b.approver)}` : ''}</span></div></div>`).join('')}</div>`;
}
// What changes, everywhere, when a pending change is approved (computed from the bindings, not stored).
function impactOf(bug) {
  const f = snap.features.find((x) => x.key === bug.feature);
  return [
    `Satellite ${bug.id}: colour ${BUG_SERIES[0].label} → ${BUG_SERIES[1].label}; no longer translucent`,
    `Tiles and trend lines: Open (this work) −1, Verified fixed +1`,
    `Crystal ${bug.feature}: gold ring and size update from the re-test result (now ${f?.lastResult ? `${f.lastResult.stepsPassed}/${f.lastResult.stepsTotal}` : 'not tested'})`,
    `Board: bug layer, feature layer, ${f ? statusText(f.status) : ''} → new status after the round; history keeps both states`,
  ];
}
function pendingSection(key) {
  const p = pendingFor(key);
  if (!p.length) return '';
  return `<section><h2>Pending changes (${p.length}) — awaiting approval</h2><div style="display:grid;gap:8px">${p.map((b) => `<div class="pending-card"><div><b>${esc(b.id)}</b> · fix proposed${(b.history || []).filter((h) => h.event === 'fixed').slice(-1).map((h) => h.commit ? ` in ${commit(h.commit)}` : '').join('')} · approver: the next browser re-test</div><div class="muted">${esc(b.step || '')}</div><div><b>If approved, it changes:</b><ul>${impactOf(b).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="muted">If rejected (the re-test still fails), the bug returns to Open and the fix attempt is counted.</div></div>`).join('')}</div></section>`;
}

// ---- World view: the whole view is ONE shared engine (src/lib/trackerWorld/trackerWorldEngine.js, inlined below by
// tools/release-tracker/sync-world-engine.mjs; also used by the platform screen). It draws the release as districts
// (the scope groups) of labelled crystals with bugs, rounds and agents as satellites, and opens each object's data
// view over the world. This page only wires data to it and fills the slot for the board's own layers.
let MODE = 'board'; try { MODE = localStorage.getItem('rt-mode') || 'board'; } catch {}
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
const statusText = (st) => STATUS[st] || (st ? String(st).split(', ').map((r) => ROLE[r] || r).join(' + ') : 'Not started');

/* world-engine:begin (generated by tools/release-tracker/sync-world-engine.mjs from src/lib/crystalGeometry.js and src/lib/trackerWorld/trackerWorldEngine.js; do not edit here) */
const CrystalGeo = (() => {
// Shared Three.js crystal recipes. SaltBasinCrystal.jsx (single-object mark/
// hero/backdrop crystal), CrystalOfficeScene.jsx (crystal-city destinations),
// and CrystalRoomScene.jsx (metadata-orbit reveal) all build meshes from this
// one module so every crystal in the product — signature mark, city
// destination, orbit node — comes from the identical geometry/material/
// lighting recipe. Never fork a variant locally in a consuming component;
// add it here so every surface stays visually identical.

function addCrystalLights(scene, THREE) {
  const key = new THREE.DirectionalLight(0xC4843A, 1.4);
  key.position.set(4, 5, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x4A7C8E, 0.9);
  fill.position.set(-5, -2, 3);
  scene.add(fill);

  const ambient = new THREE.AmbientLight(0xF8F4EC, 0.55);
  scene.add(ambient);

  return { key, fill, ambient };
}

const CRYSTAL_VARIANTS = {
  signature(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.7, 1),
      new THREE.MeshStandardMaterial({
        color: 0xF1EBDD,
        metalness: 0.25,
        roughness: 0.35,
        flatShading: true,
      })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.86, 1),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      })
    );
    group.add(wire);

    const tealSatellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, flatShading: true, roughness: 0.4 })
    );
    tealSatellite.position.set(2.6, 0.8, -0.5);
    group.add(tealSatellite);

    const pinkSatellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0xD98CA0, flatShading: true, roughness: 0.4 })
    );
    pinkSatellite.position.set(-2.3, -1.1, 0.3);
    group.add(pinkSatellite);

    return { spin: [tealSatellite, pinkSatellite], core };
  },

  hourglass(group, THREE) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xF1EBDD,
      metalness: 0.3,
      roughness: 0.35,
      flatShading: true,
    });
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.35, 4), material);
    top.position.y = 0.7;
    group.add(top);

    const bottom = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.35, 4), material);
    bottom.position.y = -0.7;
    bottom.rotation.z = Math.PI;
    group.add(bottom);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xC4843A,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const wireTop = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.46, 4), wireMaterial);
    wireTop.position.y = 0.7;
    group.add(wireTop);

    const wireBottom = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.46, 4), wireMaterial);
    wireBottom.position.y = -0.7;
    wireBottom.rotation.z = Math.PI;
    group.add(wireBottom);

    const star = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.22),
      new THREE.MeshStandardMaterial({ color: 0xD98CA0, flatShading: true })
    );
    star.position.set(0, 1.8, 0);
    group.add(star);

    return { spin: [star], core: top };
  },

  // Salt Tide — the site editor's planet (2026-09-06): "a little less
  // triangles than the crystal core" (detail 0 icosahedron vs. signature's
  // detail 1) and a "luminescent, almost like clear glass" material —
  // MeshPhysicalMaterial's transmission, not a faked transparency hack, so
  // it genuinely reveals whatever sits inside the group at close range.
  salttide(group, THREE) {
    const glass = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xdcf3f0,
        transmission: 0.88,
        thickness: 1.35,
        roughness: 0.06,
        ior: 1.45,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.18,
        emissive: 0x4a7c8e,
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.95,
      })
    );
    group.add(glass);

    // What the glass reveals at close range — not fabricated journey data
    // (none exists for this module's rod_type yet), just a real inner
    // crystal structure, same honesty rule as the rest of this file: never
    // claim data that isn't there.
    const innerGlow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85, 0),
      new THREE.MeshBasicMaterial({ color: 0x9fe0d8, transparent: true, opacity: 0.32 })
    );
    group.add(innerGlow);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 0),
      new THREE.MeshBasicMaterial({ color: 0x8fd8d0, wireframe: true, transparent: true, opacity: 0.3 })
    );
    group.add(wire);

    return { spin: [wire, innerGlow], core: glass, innerGlow };
  },

  engine(group, THREE) {
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.95, 0.3, 110, 16),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.35, roughness: 0.4 })
    );
    group.add(knot);

    const wire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.02, 0.34, 55, 10),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    group.add(wire);

    return { spin: [knot, wire], core: knot };
  },

  rings(group, THREE) {
    const gold = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.14, 16, 60),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.3, roughness: 0.4 })
    );
    gold.rotation.x = Math.PI / 2.4;
    group.add(gold);

    const teal = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.14, 16, 60),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.3, roughness: 0.4 })
    );
    teal.rotation.x = -Math.PI / 2.4;
    teal.rotation.y = Math.PI / 3;
    group.add(teal);

    return { spin: [gold, teal], core: gold };
  },

  token(group, THREE) {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.28, 48),
      new THREE.MeshStandardMaterial({
        color: 0xF1EBDD,
        metalness: 0.45,
        roughness: 0.28,
      })
    );
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.045, 12, 72),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.65, roughness: 0.24 })
    );
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    const facet = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshStandardMaterial({
        color: 0x4A7C8E,
        metalness: 0.34,
        roughness: 0.32,
        flatShading: true,
      })
    );
    facet.position.z = 0.28;
    group.add(facet);

    return { spin: [coin, rim, facet], core: coin };
  },

  table(group, THREE) {
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 0.16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xF8F4EC,
        metalness: 0.2,
        roughness: 0.18,
        transparent: true,
        opacity: 0.78,
      })
    );
    top.position.y = 0.55;
    group.add(top);

    const topRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.36, 0.04, 12, 72),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.62, roughness: 0.25 })
    );
    topRim.position.y = 0.65;
    topRim.rotation.x = Math.PI / 2;
    group.add(topRim);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.52, 1.2, 7),
      new THREE.MeshStandardMaterial({
        color: 0xDCE9EC,
        metalness: 0.28,
        roughness: 0.32,
        flatShading: true,
      })
    );
    pedestal.position.y = -0.08;
    group.add(pedestal);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.16, 7),
      new THREE.MeshStandardMaterial({ color: 0x345A68, metalness: 0.36, roughness: 0.32 })
    );
    base.position.y = -0.78;
    group.add(base);

    return { spin: [topRim, pedestal], core: top };
  },

  founder(group, THREE) {
    const pinkMetal = new THREE.MeshStandardMaterial({
      color: 0xD98CA0,
      metalness: 0.58,
      roughness: 0.24,
      flatShading: true,
    });
    const shell = new THREE.MeshStandardMaterial({
      color: 0xF1EBDD,
      metalness: 0.26,
      roughness: 0.34,
      flatShading: true,
    });

    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), pinkMetal);
    head.position.y = 0.88;
    group.add(head);

    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.86, 0), shell);
    body.position.y = -0.05;
    body.scale.set(0.86, 1.18, 0.72);
    group.add(body);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.035, 10, 64),
      new THREE.MeshBasicMaterial({
        color: 0xC4843A,
        transparent: true,
        opacity: 0.7,
      })
    );
    halo.position.y = 0.86;
    halo.rotation.x = Math.PI / 2.8;
    group.add(halo);

    const signal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.32, roughness: 0.35 })
    );
    signal.position.set(1.22, 0.25, 0.12);
    group.add(signal);

    return { spin: [head, body, halo, signal], core: body };
  },

  // Agent Hub world anchor (2026-08-06, Career Placement Agents) — a
  // governed-orchestration variant: a signature-family icosahedron core (so
  // it reads as the same crystal, not a foreign shape) with a coordinating
  // ring gizmo, echoing 'rings' variant's gold/teal split for the two
  // agent-pipeline accent colors (gold=commercial, teal=shared/orchestration).
  // Every "user world" (Definition Studio, Agent Hub, User Configuration, Day
  // to Day, ...) gets its own named variant here, never bespoke geometry in
  // the consuming panel — see this file's header rule.
  agentHub(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.25, roughness: 0.32, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.64, 1),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const ringGold = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.05, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0xC4843A, metalness: 0.3, roughness: 0.4 })
    );
    ringGold.rotation.x = Math.PI / 2.2;
    group.add(ringGold);

    const ringTeal = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.05, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x4A7C8E, metalness: 0.3, roughness: 0.4 })
    );
    ringTeal.rotation.x = -Math.PI / 2.2;
    ringTeal.rotation.y = Math.PI / 3;
    group.add(ringTeal);

    return { spin: [ringGold, ringTeal], core };
  },

  // Commercial Opportunity Pipeline world anchor (2026-08-06, Career
  // Placement Agents Phase 3) — an expansion/growth variant: a dodecahedron
  // core (a distinct silhouette from agentHub's icosahedron, so the two
  // worlds read as visibly different members of the same family) with an
  // ascending helix of small satellite gems evoking the spec's Ring 0-5
  // target-expansion model, in gold/mauve tones (commercial's accent pair).
  commercialPipeline(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.45, 0),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.28, roughness: 0.3, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.58, 0),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const helixGems = [];
    const helixCount = 6;
    for (let i = 0; i < helixCount; i += 1) {
      const t = i / helixCount;
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14 + t * 0.08, 0),
        new THREE.MeshStandardMaterial({ color: 0x785D69, metalness: 0.3, roughness: 0.4, flatShading: true })
      );
      const angle = t * Math.PI * 2.4;
      const radius = 1.9 + t * 0.5;
      gem.position.set(Math.cos(angle) * radius, -0.9 + t * 1.8, Math.sin(angle) * radius);
      group.add(gem);
      helixGems.push(gem);
    }

    return { spin: helixGems, core };
  },

  // Publication journey world anchor (2026-08-07) — HERQ Publications now,
  // Marketing Ads / Research Reports follow on the same anchor once their
  // islands exist (per this file's own rule: extend the registry, never
  // fork geometry per consumer). An octahedron core (a third distinct
  // silhouette alongside agentHub's icosahedron and commercialPipeline's
  // dodecahedron) with three fanned "page" plates evoking a published
  // output stack.
  publication(group, THREE) {
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: 0xF1EBDD, metalness: 0.22, roughness: 0.36, flatShading: true })
    );
    group.add(core);

    const wire = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.54, 0),
      new THREE.MeshBasicMaterial({ color: 0xC4843A, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(wire);

    const pages = [];
    for (let i = 0; i < 3; i += 1) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.06, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xDCE9EC, metalness: 0.2, roughness: 0.3 })
      );
      plate.position.set(0, -0.6 + i * 0.16, 0);
      plate.rotation.y = (i - 1) * 0.12;
      group.add(plate);
      pages.push(plate);
    }

    return { spin: pages, core };
  },
};

// Small crystal used for metadata-orbit / capability-context nodes — a single
// low-poly gem whose color is driven by the caller (maturity stage, brand
// accent) rather than a fixed material, since these represent live state
// rather than a named product variant.
function buildGemMesh(THREE, { color = 0xC4843A, size = 0.22, metalness = 0.4, roughness = 0.3 } = {}) {
  return new THREE.Mesh(
    new THREE.OctahedronGeometry(size, 0),
    new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true })
  );
}

// A "river of light" flowing from one world position to another — the World
// Shell's islands connect to the Crystal Core this way. A single additive-
// blended THREE.Points stream sampled along a CatmullRomCurve3, each point
// given a random offset along the curve and re-wrapped every frame by the
// caller (see `advanceRiverParticles`) rather than re-created, so the flow
// reads as continuous motion instead of a static dotted line. Reused by any
// world that needs a link between two crystals — never fork a bespoke
// particle system per consumer, per this file's header rule.
function buildRiverParticles(THREE, { from, to, color = 0xC4843A, count = 60, curveLift = 0.6 } = {}) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y += curveLift;
  const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()]);
  const positions = new Float32Array(count * 3);
  const offsets = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    offsets[i] = t;
    const p = curve.getPoint(t);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.09,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.curve = curve;
  points.userData.offsets = offsets;
  points.userData.speed = 0.12 + Math.random() * 0.05;
  return points;
}

// Advances a river's flow by `dt` seconds — call once per animation frame per
// river. Wraps each point back to the curve start once it reaches the end so
// the stream loops seamlessly.
function advanceRiverParticles(points, dt) {
  const { curve, offsets, speed } = points.userData;
  const posAttr = points.geometry.getAttribute('position');
  for (let i = 0; i < offsets.length; i += 1) {
    offsets[i] = (offsets[i] + dt * speed) % 1;
    const p = curve.getPoint(offsets[i]);
    posAttr.setXYZ(i, p.x, p.y, p.z);
  }
  posAttr.needsUpdate = true;
}

// Projects a world position through `camera` into CSS pixel coordinates
// within an element sized `width` x `height`. Returns null when the point is
// behind the camera (so callers can hide the HTML hit-target instead of
// flinging it across the screen).
function projectToScreen(THREE, vector3, camera, width, height) {
  const v = vector3.clone().project(camera);
  if (v.z > 1) return null;
  return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height };
}

// ── Environments ────────────────────────────────────────────────────────────
// The setting a world is drawn in, independent of the data. An environment
// builder sits alongside addCrystalLights and is swappable by name:
//
//   const env = buildEnvironment('underwater', scene, THREE, { palette, keepClear: 31 });
//   env.update(elapsedSeconds, dtSeconds, camera);   // skipped under reduced motion: the water stands still
//   env.setPalette({ waterMid, sand });              // light / dark water
//   env.dispose();
//
// Underwater (2026-10-09): depth-gradient water with exponential fog, a
// sea-tinted sand seabed fading into the blue, moving cellular caustics on the
// sand, swaying light shafts from the surface, rising bubbles, drifting marine
// snow, and kelp anchored OUTSIDE the camera's orbit (`keepClear` radius) so it
// never crosses a crystal. The CSS behind a transparent canvas paints the
// surface-to-deep gradient; the scene supplies fog, seabed and particles.
function canvasTexture(THREE, size, draw) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  return t;
}

function underwaterEnvironment(scene, THREE, { palette = {}, keepClear = 31, seed = 7 } = {}) {
  // Deterministic placement (a seeded sequence), so the scene is the same every visit.
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const parts = [];
  const add = (o) => { scene.add(o); parts.push(o); return o; };
  const col = (v, d) => new THREE.Color(v ?? d);
  scene.fog = new THREE.FogExp2(col(palette.waterMid, 0x8FC4D1), 0.028);
  const hemi = new THREE.HemisphereLight(0xBFEFFF, 0x2A4A3A, 0.45);
  scene.add(hemi); parts.push(hemi);

  const bedGeo = new THREE.PlaneGeometry(200, 200, 90, 90);
  bedGeo.rotateX(-Math.PI / 2);
  const bp = bedGeo.getAttribute('position');
  for (let i = 0; i < bp.count; i += 1) {
    const x = bp.getX(i); const z = bp.getZ(i);
    bp.setY(i, Math.sin(x * 0.18) * 0.35 + Math.cos(z * 0.22) * 0.3 + Math.sin((x + z) * 0.07) * 0.6);
  }
  bedGeo.computeVertexNormals();
  const bed = add(new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: col(palette.sand, 0x8FB3AE), roughness: 0.95, metalness: 0 })));
  bed.position.y = -9;

  const caus = canvasTexture(THREE, 256, (g, n) => {
    g.clearRect(0, 0, n, n);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3; g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 6;
    const cells = 7; const step = n / cells;
    for (let i = 0; i < cells; i += 1) for (let j = 0; j < cells; j += 1) {
      const cx = (i + 0.5 + (rnd() - 0.5) * 0.5) * step; const cy = (j + 0.5 + (rnd() - 0.5) * 0.5) * step; const r = step * (0.42 + rnd() * 0.12);
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) {
        g.beginPath();
        for (let a = 0; a <= 6.3; a += 0.35) {
          const rr = r * (0.85 + 0.15 * Math.sin(a * 3 + i + j));
          const x = cx + dx + Math.cos(a) * rr; const y = cy + dy + Math.sin(a) * rr;
          if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath(); g.stroke();
      }
    }
  });
  const causMats = [0, 1].map((k) => {
    const m = new THREE.MeshBasicMaterial({ map: caus.clone(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    m.map.needsUpdate = true; m.map.repeat.set(9 + k * 4, 9 + k * 4);
    const pl = add(new THREE.Mesh(bedGeo, m)); pl.position.y = -8.95 + k * 0.02;
    return m;
  });

  const shaftTex = canvasTexture(THREE, 64, (g, n) => {
    const gr = g.createLinearGradient(0, 0, n, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    const v = g.createLinearGradient(0, 0, 0, n);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, n, n);
  });
  const shafts = [];
  for (let i = 0; i < 9; i += 1) {
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(2.2 + rnd() * 2.5, 34), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: 0xE8FBFF })));
    m.position.set((rnd() - 0.5) * 34, 9, (rnd() - 0.5) * 34); m.rotation.z = 0.18 + (rnd() - 0.5) * 0.12;
    m.userData.phase = rnd() * 6; shafts.push(m);
  }

  const mkPoints = (n, spread, size, color, opacity) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) pos.set([(rnd() - 0.5) * spread, -9 + rnd() * 24, (rnd() - 0.5) * spread], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const tex = canvasTexture(THREE, 32, (g, kk) => {
      const r = g.createRadialGradient(kk / 2, kk / 2, 1, kk / 2, kk / 2, kk / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.55, 'rgba(255,255,255,0.35)'); r.addColorStop(0.7, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, kk, kk);
    });
    return add(new THREE.Points(geo, new THREE.PointsMaterial({ size, map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })));
  };
  const bubbles = mkPoints(220, 40, 0.28, 0xFFFFFF, 0.55);
  const snow = mkPoints(600, 60, 0.07, 0xF4FBFF, 0.5);

  const kelp = [];
  const kelpMat = new THREE.MeshStandardMaterial({ color: 0x4F7A3A, roughness: 0.8, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 26; i += 1) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.2; const r = keepClear + rnd() * 10; const h = 12 + rnd() * 12;
    const pts = [];
    for (let j = 0; j <= 6; j += 1) pts.push(new THREE.Vector3(Math.sin(j * 0.9 + i) * 0.35, (j / 6) * h, Math.cos(j * 0.7 + i) * 0.25));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 5, false), kelpMat);
    const g = add(new THREE.Group()); g.add(tube); g.position.set(Math.cos(a) * r, -9, Math.sin(a) * r); g.userData.phase = rnd() * 6; kelp.push(g);
  }

  return {
    update(t, dt, camera) {
      causMats[0].map.offset.set(t * 0.012, t * 0.008); causMats[1].map.offset.set(-t * 0.009, t * 0.011);
      shafts.forEach((m) => { m.lookAt(camera.position.x, m.position.y, camera.position.z); m.rotateZ(0.18); m.material.opacity = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.4 + m.userData.phase)); });
      const p = bubbles.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i += 1) {
        let y = p.getY(i) + dt * (0.9 + (i % 7) * 0.12); if (y > 15) y = -9;
        p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 2 + i) * dt * 0.15);
      }
      p.needsUpdate = true;
      snow.rotation.y += dt * 0.01; snow.position.y = Math.sin(t * 0.2) * 0.4;
      kelp.forEach((g) => { g.rotation.z = Math.sin(t * 0.7 + g.userData.phase) * 0.09; g.rotation.x = Math.cos(t * 0.5 + g.userData.phase) * 0.06; });
    },
    setPalette(p = {}) {
      if (p.waterMid != null) scene.fog.color = col(p.waterMid);
      if (p.sand != null) bed.material.color = col(p.sand);
    },
    dispose() {
      parts.forEach((o) => {
        scene.remove(o);
        o.traverse?.((x) => { x.geometry?.dispose?.(); const ms = Array.isArray(x.material) ? x.material : [x.material]; ms.forEach((m) => { m?.map?.dispose?.(); m?.dispose?.(); }); });
      });
      scene.fog = null;
    },
  };
}

const ENVIRONMENTS = { underwater: underwaterEnvironment };
const DEFAULT_ENVIRONMENT = 'underwater';

function buildEnvironment(name, scene, THREE, options = {}) {
  const build = ENVIRONMENTS[name || DEFAULT_ENVIRONMENT];
  if (!build) throw new Error(`Unknown world environment "${name}". Known: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  return build(scene, THREE, options);
}
return { addCrystalLights, CRYSTAL_VARIANTS, buildGemMesh, buildRiverParticles, advanceRiverParticles, projectToScreen, ENVIRONMENTS, DEFAULT_ENVIRONMENT, buildEnvironment };
})();
const TrackerWorldKit = (() => {
// Tracker World engine: ONE implementation shared by both release-tracker surfaces
//   - the platform screen  src/components/releaseTracker/TrackerWorld.jsx  (imports this module), and
//   - the artifact page    tools/release-tracker/index.html                (this file is inlined between the
//     "world-engine:begin/end" markers by tools/release-tracker/sync-world-engine.mjs; never edit that copy).
// Because the artifact cannot import, this file has NO imports and NO JSX: Three.js and the crystal recipes
// (src/lib/crystalGeometry.js) are injected as `THREE` and `geo`. Every `export ` keyword is stripped on inlining.
//
// What it draws (docs/changes/tracker-world-navigation.md):
//   * the Sun = the release; three concentric DISTRICTS (rings) = the release scope groups of
//     server/lib/releaseScope.js: "This release", "Added after the cut", "Backlog";
//   * a crystal per feature on its district's ring (colour = status, size = suite size, gold ring = pass share);
//   * satellites: bugs (octahedra), test rounds (cubes on the feature's ring) and agents (tetrahedra);
//   * a persistent label on everything that matters, a legend in place, and an "Objects" list of every object;
//   * clicking any object opens ITS data view over the world (one layer on the shared #/ trail), highlights what is
//     related to it and dims the rest, and moves the camera to it; Back pops one layer and the camera returns;
//   * Current / Historic: Historic draws the recorded state at the slider point and marks what changed since.
// Nothing is invented: an untested feature has no score ("not tested yet"), never 0.

const BACKLOG = ['backlog_pre_existing', 'reassigned', 'process_note'];
const PERSON = ['needs_human', 'needs_business_definition'];
const PASSED = ['passed', 'passed_with_backlog'];
const PENDING = ['fixed_awaiting_retest', 'retesting'];
const CATS = ['Open (this work)', 'Verified fixed', 'Backlog (not this work)', 'Waiting on a person'];
const EVENT_LABEL = { found: 'Found', recurred: 'Came back', fixed: 'Fix applied', not_fixed: 'Not fixed', seen: 'Seen in test', verified: 'Verified fixed' };
const EVENT_RANK = { found: 0, recurred: 0, seen: 0, fixed: 1, not_fixed: 1, verified: 2 };
const ROLE_LABEL = { build: 'Build', integrate: 'Integrate', validate: 'Validate', triage: 'Triage', scope: 'Scope check', fix: 'Fix', record: 'Record', reconcile: 'Reconcile' };
const STAGES = ['build', 'validate', 'triage', 'scope', 'fix', 'reconcile', 'integrate'];
const DISTRICT_DEFS = [
  ['planned', 'This release', 'Planned work. Only these features count toward the release score.'],
  ['added', 'Added after the cut', 'Joined after the release was cut. Each one says whether it counts in this release or sits in the backlog.'],
  ['backlog', 'Backlog', 'Kept on the record, but not this release\'s work.'],
  ['other', 'Other tracked work', 'Tracked, but not part of this release.'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const enc = encodeURIComponent;
const twTok = (...parts) => parts.map((p) => enc(p)).join(':');
const twSplit = (t) => String(t).split(':').map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
const kfmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n || 0));
const agoText = (iso, now) => { if (!iso) return '—'; const m = Math.round(((now || Date.now()) - Date.parse(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`; };
const toneVar = (t) => `var(--tw-${t})`;
const isOpenBug = (b) => !['verified', 'seen_in_test', ...BACKLOG].includes(b.status);

function toneOfStatus(st) {
  if (PASSED.includes(st) || st === 'verified') return 'good';
  if (['failing', 'done_unreconciled', 'not_passed_after_max_rounds'].includes(st)) return 'bad';
  if (PERSON.includes(st)) return 'human';
  if (!st || ['queued', 'stopped', 'idle_or_done', 'failed'].includes(st)) return 'muted';
  if (['awaiting_retest', 'between_stages'].includes(st)) return 'gold';
  return 'teal';
}
const bugCat = (st) => (st === 'verified' ? 2 : BACKLOG.includes(st) ? 3 : PERSON.includes(st) ? 4 : 1);
const agentTone = (st) => (st === 'running' ? 'teal' : ['failed', 'done_unreconciled'].includes(st) ? 'bad' : st === 'stalled' ? 'gold' : 'muted');
const tokenVarName = (v) => String(v).replace(/^--(rt-)?/, '');

function districtOf(f, hasScopes) {
  if (!hasScopes) return 'planned';
  if (f.scope === 'not_in_release') return 'other';
  if (f.added && typeof f.added === 'object') return 'added';
  return f.scope === 'backlog' ? 'backlog' : 'planned';
}

// ── Rounds of one feature, from the snapshot and the recorded history (never invented) ──────────────────────
function roundsOf(snap, hist, f, maxRound) {
  const nums = new Set();
  (snap.agents || []).forEach((a) => { if (a.feature === f.key && a.round != null) nums.add(a.round); });
  if (f.lastResult?.round) nums.add(f.lastResult.round);
  (snap.bugs || []).forEach((b) => { if (b.feature === f.key) (b.history || []).forEach((h) => { if (h.round) nums.add(h.round); }); });
  (hist?.points || []).forEach((p) => { const v = p.f?.[f.key]; if (v && v[1]) nums.add(v[1]); });
  if (!nums.size && f.rounds > 0) for (let i = 1; i <= f.rounds; i += 1) nums.add(i);
  return [...nums].filter((n) => (maxRound == null || n <= maxRound)).sort((a, b) => a - b).map((n) => {
    let passed = null; let total = null; let status = null; let firstAt = null; let firstIdx = null; let firstStatus = null;
    if (f.lastResult && f.lastResult.round === n) { passed = f.lastResult.stepsPassed; total = f.lastResult.stepsTotal; }
    (hist?.points || []).forEach((p, i) => {
      const v = p.f?.[f.key]; if (!v || v[1] !== n) return;
      if (firstAt == null) { firstAt = p.t; firstIdx = i; firstStatus = v[0]; }
      if (!(f.lastResult && f.lastResult.round === n) && v[3]) { passed = v[2]; total = v[3]; }
    });
    const validate = (snap.agents || []).find((a) => a.feature === f.key && a.role === 'validate' && a.round === n);
    const ok = total ? passed === total : null;
    return { n, passed, total, ok, status: firstStatus, firstAt: firstAt || validate?.startedAt || null, firstIdx, running: validate?.status === 'running', summary: validate?.summary || null, agentId: validate?.id || null };
  });
}

// ── The world model: pure, no DOM, no THREE ──────────────────────────────────────────────────────────────────
// `bind(channelId, entity, ctx)` is optional (the platform maps channels through its render bindings): return the
// mapped value, or undefined for "not mapped" (the world then draws the neutral fallback and says so).
function buildWorldModel({ snap, hist, at, bind, statusText, fmtT }) {
  const live = !hist || at == null || at >= hist.points.length - 1;
  const pt = hist && !live ? hist.points[at] : null;
  const lastPt = hist ? hist.points[hist.points.length - 1] : null;
  const feats = (snap.features || []).filter((f) => f.key !== 'whole-app-sweep');
  const hasScopes = feats.some((f) => f.scope);
  const maxSteps = Math.max(1, ...feats.map((f) => f.lastResult?.stepsTotal || 0), ...(pt ? Object.values(pt.f).map((v) => v[3] || 0) : []));
  const unmapped = new Set();
  const val = (id, entity, ctx, derive) => {
    if (!bind) return derive();
    const v = bind(id, entity, ctx);
    if (v === undefined) { unmapped.add(id); return null; }
    return v;
  };
  const nodes = feats.map((f) => {
    const h = pt?.f?.[f.key];
    const absent = !!pt && !h;
    const status = h ? h[0] : (absent ? null : f.status);
    const total = h ? h[3] : (absent ? null : f.lastResult?.stepsTotal);
    const passed = h ? h[2] : (absent ? null : f.lastResult?.stepsPassed);
    const hctx = { hist: h || null, maxSteps };
    const ownBugs = (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test');
    // satellites
    const sats = [];
    if (h) {
      [[4, 1], [5, 2], [6, 3], [7, 4]].forEach(([idx, cat]) => {
        const n = idx === 4 ? h[4] - h[7] : h[idx];
        for (let i = 0; i < Math.min(n, 8); i += 1) sats.push({ id: `${f.key}|count|${cat}|${i}`, kind: 'count', label: CATS[cat - 1], short: CATS[cat - 1], tone: `s${cat}`, cat, token: twTok('feature', f.key), feature: f.key });
      });
    } else if (!absent) {
      ownBugs.forEach((b) => {
        const cat = bugCat(b.status);
        const color = val('satellite.colour', b, hctx, () => `--rt-s${cat}`);
        const ghost = val('satellite.ghost', b, hctx, () => PENDING.includes(b.status));
        sats.push({ id: twTok('bug', b.id), kind: 'bug', label: `${b.id}: ${b.step || ''}`, short: b.id, tone: color ? tokenVarName(color) : 'muted', cat, pending: !!ghost, token: twTok('bug', b.id), feature: f.key, status: b.status });
      });
    }
    const maxRound = h ? (h[1] || 0) : null;   // a point that records no round has none yet
    const rounds = absent ? [] : roundsOf(snap, hist, f, maxRound);
    rounds.forEach((r) => sats.push({ id: twTok('round', f.key, r.n), kind: 'round', label: `Round ${r.n}${r.total ? `: ${r.passed}/${r.total} steps` : r.running ? ': being tested now' : ': score not recorded'}`, short: `R${r.n}${r.total ? ` ${r.passed}/${r.total}` : ''}`, tone: r.ok == null ? 'muted' : r.ok ? 'good' : 'bad', token: twTok('round', f.key, r.n), feature: f.key, round: r.n }));
    let agentsMore = 0; let agentsAll = 0;
    if (!h && !absent) {
      const ag = (snap.agents || []).filter((a) => a.feature === f.key);
      agentsAll = ag.length;
      const ordered = [...ag].sort((a, b) => (b.status === 'running') - (a.status === 'running') || String(b.startedAt || '').localeCompare(String(a.startedAt || '')));
      ordered.slice(0, 4).forEach((a) => sats.push({ id: twTok('agent', a.id), kind: 'agent', label: `${ROLE_LABEL[a.role] || a.role || 'Agent'}${a.round ? ` · round ${a.round}` : ''}: ${statusText(a.status)}`, short: `${ROLE_LABEL[a.role] || a.role || 'Agent'}${a.round ? ` r${a.round}` : ''}`, tone: agentTone(a.status), token: twTok('agent', a.id), feature: f.key, status: a.status }));
      agentsMore = Math.max(0, ag.length - 4);
    }
    const active = !!val('crystal.river', f, hctx, () => (snap.agents || []).some((a) => a.feature === f.key && a.status === 'running')) && !h && !absent;
    const colour = val('crystal.colour', f, hctx, () => `--rt-${toneOfStatus(status)}`);
    const weightRaw = val('crystal.size', f, hctx, () => (total ? 0.35 + 0.65 * (total / maxSteps) : 0.3));
    const ring = val('crystal.ring', f, hctx, () => (total ? passed / total : null));
    // what changed between the chosen point and now
    let changed = null;
    if (pt) {
      if (absent) changed = { absent: true, lines: ['Not tracked yet at this point in time; it joined the release later.'] };
      else {
        const lines = [];
        if (h[0] !== f.status) lines.push(`Status: ${statusText(h[0])} → ${statusText(f.status)}`);
        const nowTotal = f.lastResult?.stepsTotal; const nowPassed = f.lastResult?.stepsPassed;
        if ((h[3] || 0) !== (nowTotal || 0) || (h[2] || 0) !== (nowPassed || 0)) lines.push(`Test score: ${h[3] ? `${h[2]}/${h[3]} steps` : 'not tested yet'} → ${nowTotal ? `${nowPassed}/${nowTotal} steps` : 'not tested yet'}`);
        const lv = lastPt?.f?.[f.key];
        if (lv) CATS.forEach((c, i) => { if ((h[4 + i] || 0) !== (lv[4 + i] || 0)) lines.push(`${c}: ${h[4 + i] || 0} → ${lv[4 + i] || 0}`); });
        if (lines.length) changed = { absent: false, lines };
      }
    }
    return {
      id: twTok('feature', f.key), kind: 'feature', key: f.key, label: f.key,
      status, statusLabel: absent ? 'Not tracked yet' : statusText(status), tone: absent ? 'muted' : (colour ? tokenVarName(colour) : 'muted'),
      district: districtOf(f, hasScopes), absent,
      scoreText: absent ? 'not tracked yet' : (total ? `${passed}/${total} steps` : 'not tested yet'), pct: total ? Math.round((passed / total) * 100) : null,
      weight: typeof weightRaw === 'number' ? weightRaw : 0.3, progress: typeof ring === 'number' ? ring : null,
      active, changed, sats, agentsMore, agentsAll,
      counts: { bugs: sats.filter((s) => s.kind === 'bug' || s.kind === 'count').length, rounds: rounds.length },
      added: f.added || null, scope: f.scope || null, dependsOn: Array.isArray(f.dependsOn) ? f.dependsOn : [],
    };
  });
  const defs = hasScopes ? DISTRICT_DEFS.filter(([k]) => k !== 'other' || nodes.some((n) => n.district === 'other')) : [['planned', 'All features', 'Every feature in this release.']];
  const districts = defs.map(([key, label, note]) => {
    const members = nodes.filter((n) => n.district === key);
    const ids = new Set(members.map((n) => n.key));
    return {
      id: twTok('scope', key), key, label, note, members: members.map((n) => n.id),
      passed: members.filter((n) => PASSED.includes(n.status)).length, total: members.length,
      openBugs: (snap.bugs || []).filter((b) => ids.has(b.feature) && isOpenBug(b)).length,
    };
  });
  // The release score counts only this release's work (planned, including features added into planned), like the Board.
  const counted = nodes.filter((n) => !hasScopes || (n.scope !== 'backlog' && n.scope !== 'not_in_release'));
  const releaseScore = `${counted.filter((n) => PASSED.includes(n.status)).length} of ${counted.length} passed`;
  return {
    live, at: live ? null : at, pt, hasScopes, nodes, districts, unmapped: [...unmapped],
    root: { label: snap.release?.version ? `Release ${snap.release.version}` : 'Release', sub: pt ? `as of ${fmtT(pt.t)} UTC` : 'live', score: releaseScore },
  };
}

// ── Selection: which object a path (the trail) points at ─────────────────────────────────────────────────────
function selectionOf(path, snap) {
  const last = (path || [])[path.length - 1];
  if (!last) return null;
  const [type, a, b] = twSplit(last);
  if (type === 'feature') { const f = (snap.features || []).find((x) => x.key === a); return f ? { kind: 'feature', id: twTok('feature', a), feature: a } : { kind: 'missing' }; }
  if (type === 'round') { const f = (snap.features || []).find((x) => x.key === a); return f ? { kind: 'round', id: twTok('round', a, b), feature: a, round: Number(b) } : { kind: 'missing' }; }
  if (type === 'bug') { const x = (snap.bugs || []).find((q) => q.id === a); return x ? { kind: 'bug', id: twTok('bug', a), feature: x.feature, bug: a } : { kind: 'missing' }; }
  if (type === 'agent') { const x = (snap.agents || []).find((q) => q.id === a); return x ? { kind: 'agent', id: twTok('agent', a), feature: x.feature || null, agent: a } : { kind: 'missing' }; }
  if (type === 'scope') return DISTRICT_DEFS.some(([k]) => k === a) ? { kind: 'scope', id: twTok('scope', a), scope: a } : { kind: 'missing' };
  return { kind: 'other', id: last };
}

// ── Related objects of the selection (highlighted in the world; the rest is dimmed) ──────────────────────────
function relatedOf(model, snap, sel) {
  const ids = new Set(); const why = {}; const links = [];
  if (!sel || sel.kind === 'other' || sel.kind === 'missing') return { ids, why, links, active: false };
  const add = (id, reason) => { if (id) { ids.add(id); if (reason && !why[id]) why[id] = reason; } };
  const nodeOf = (key) => model.nodes.find((n) => n.key === key);
  const link = (a, b) => { if (a && b && a !== b) links.push([a, b]); };
  const bugsOf = (key) => (snap.bugs || []).filter((b) => b.feature === key || b.scope?.owner === key);
  const featureWide = (key, reasonPrefix) => {
    const n = nodeOf(key); if (!n) return;
    add(n.id, reasonPrefix);
    const dn = model.districts.find((d) => d.members.includes(n.id)); if (dn) add(dn.id, 'its district');
  };
  if (sel.kind === 'scope') {
    const d = model.districts.find((x) => x.id === sel.id); add(sel.id);
    (d?.members || []).forEach((m) => add(m, 'in this district'));
  } else if (sel.kind === 'feature') {
    const n = nodeOf(sel.feature); add(sel.id); featureWide(sel.feature);
    (n?.sats || []).forEach((s) => add(s.id, s.kind === 'bug' ? 'its bug' : s.kind === 'round' ? 'its test round' : s.kind === 'agent' ? 'an agent working on it' : 'its bugs'));
    bugsOf(sel.feature).forEach((b) => {
      const other = b.feature === sel.feature ? b.scope?.owner : b.feature;
      if (other && other !== sel.feature && nodeOf(other)) { add(twTok('feature', other), `shares bug ${b.id}`); link(sel.id, twTok('feature', other)); }
    });
    const f = (snap.features || []).find((x) => x.key === sel.feature);
    (f?.dependsOn || []).forEach((d) => { if (nodeOf(d)) { add(twTok('feature', d), `${sel.feature} depends on it`); link(sel.id, twTok('feature', d)); } });
    model.nodes.forEach((o) => { if (o.dependsOn.includes(sel.feature)) { add(o.id, `depends on ${sel.feature}`); link(sel.id, o.id); } });
  } else if (sel.kind === 'bug') {
    const b = (snap.bugs || []).find((x) => x.id === sel.bug); add(sel.id);
    if (b) {
      featureWide(b.feature, 'reported against');
      if (b.scope?.owner && nodeOf(b.scope.owner)) { add(twTok('feature', b.scope.owner), 'the feature this bug belongs to'); link(twTok('feature', b.feature), twTok('feature', b.scope.owner)); }
      const rounds = [...new Set((b.history || []).map((h) => h.round).filter(Boolean))];
      rounds.forEach((r) => add(twTok('round', b.feature, r), `round it was touched in`));
      (snap.agents || []).filter((a) => a.feature === b.feature && rounds.includes(a.round)).forEach((a) => add(twTok('agent', a.id), 'worked in a round this bug was touched'));
      link(sel.id, twTok('feature', b.feature));
    }
  } else if (sel.kind === 'agent') {
    const a = (snap.agents || []).find((x) => x.id === sel.agent); add(sel.id);
    if (a?.feature) {
      featureWide(a.feature, 'what it works on');
      if (a.round) add(twTok('round', a.feature, a.round), 'its round');
      (snap.bugs || []).filter((b) => b.feature === a.feature && (b.history || []).some((h) => h.round === a.round)).forEach((b) => add(twTok('bug', b.id), 'a bug of that round'));
      link(sel.id, twTok('feature', a.feature));
    }
  } else if (sel.kind === 'round') {
    add(sel.id); featureWide(sel.feature, 'its feature');
    (snap.bugs || []).filter((b) => b.feature === sel.feature && (b.history || []).some((h) => h.round === sel.round)).forEach((b) => add(twTok('bug', b.id), 'touched in this round'));
    (snap.agents || []).filter((a) => a.feature === sel.feature && a.round === sel.round).forEach((a) => add(twTok('agent', a.id), 'worked in this round'));
    link(sel.id, twTok('feature', sel.feature));
  }
  return { ids, why, links, active: true };
}

// ── History helpers ──────────────────────────────────────────────────────────────────────────────────────────
function updateAtPoint(hist, idx, pointIndexAt) {
  return [...(hist.updates || [])].reverse().find((u) => pointIndexAt(u.at) <= idx) || null;
}
function updateMarkIndexes(hist, pointIndexAt) { return (hist?.updates || []).map((u) => pointIndexAt(u.at)); }
/** The index Historic should start at: the update marker before live, else the first recorded point. */
function defaultHistoricIndex(hist, pointIndexAt) {
  if (!hist || hist.points.length < 2) return null;
  const last = hist.points.length - 1;
  const prev = [...updateMarkIndexes(hist, pointIndexAt)].reverse().find((x) => x < last);
  return prev == null ? 0 : prev;
}

// ── The same selection, highlights and journey as plain data (no DOM): the API route and the MCP tool call this, so the
// website, the API and an agent all get the same related objects and journey rows for the same object and moment.
// object: a trail token ("feature:<key>", "bug:<id>", "agent:<id>", "round:<key>:<n>", "scope:<planned|added|backlog>").
// at: a history point index, or null for the current state.
function worldObjectData({ snap, hist, object, at = null }) {
  const live = !hist || at == null || at >= hist.points.length - 1;
  const idx = live ? null : at;
  const sel = selectionOf([object], snap);
  if (!sel || sel.kind === 'missing' || sel.kind === 'other') return null;
  const model = buildWorldModel({ snap, hist, at: idx, statusText: (x) => String(x || 'not started'), fmtT: (x) => String(x) });
  const rel = relatedOf(model, snap, sel);
  const typeOf = (id) => twSplit(id)[0];
  const labelOf = new Map(); model.nodes.forEach((n) => { labelOf.set(n.id, n.label); n.sats.forEach((x) => { if (x.kind !== 'count') labelOf.set(x.id, x.short); }); }); model.districts.forEach((d) => labelOf.set(d.id, d.label));
  const related = [...rel.ids].filter((id) => id !== sel.id && labelOf.has(id)).map((id) => ({ id, type: typeOf(id), label: labelOf.get(id), reason: rel.why[id] || null }));
  const out = { object: sel.id, kind: sel.kind, mode: live ? 'current' : 'historic', at: idx, related, journey: [], changedSince: [], links: rel.links.map(([a, b]) => ({ from: a, to: b })) };
  const f = sel.feature ? (snap.features || []).find((x) => x.key === sel.feature) : null;
  const node = sel.feature ? model.nodes.find((n) => n.key === sel.feature) : null;
  if (node) { out.status = node.status; out.score = node.pct == null ? null : { fraction: Math.round((node.pct / 100) * 1000) / 1000, text: node.scoreText }; out.district = node.district; out.scope = node.scope; out.added = node.added; if (node.changed) out.changedSince = node.changed.lines; }
  if (sel.kind === 'feature' && f) {
    const histRound = idx != null && hist ? (hist.points[idx]?.f?.[f.key]?.[1] ?? 0) : null;
    roundsOf(snap, hist, f, null).forEach((r) => out.journey.push({ type: 'round', round: r.n, passed: r.passed, total: r.total, status: r.status, at: r.firstAt, afterChosenPoint: histRound != null && r.n > histRound }));
    (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test').forEach((b) => (b.history || []).forEach((h) => out.journey.push({ type: 'bug_event', bug: b.id, event: h.event, round: h.round || null, note: h.note || null, commit: h.commit || null, afterChosenPoint: histRound != null && (h.round || 0) > histRound })));
    out.dependsOn = f.dependsOn || [];
  } else if (sel.kind === 'bug') {
    const b = (snap.bugs || []).find((x) => x.id === sel.bug);
    const histRound = idx != null && hist ? (hist.points[idx]?.f?.[b.feature]?.[1] ?? 0) : null;
    out.status = b.status; out.rootCause = b.rootCause || null; out.attempts = b.attempts || 0; out.maxFixAttemptsPerBug = snap.maxFixAttemptsPerBug ?? null; out.scope = b.scope || null; out.question = b.question || null;
    (b.history || []).forEach((h) => out.journey.push({ type: 'bug_event', bug: b.id, event: h.event, round: h.round || null, note: h.note || null, commit: h.commit || null, files: h.files || [], afterChosenPoint: histRound != null && (h.round || 0) > histRound }));
  } else if (sel.kind === 'agent') {
    const a = (snap.agents || []).find((x) => x.id === sel.agent);
    out.status = a.status; out.role = a.role || null; out.round = a.round ?? null; out.tokens = a.tokens || null; out.summary = a.summary || null;
    (snap.agents || []).filter((x) => x.feature === a.feature).forEach((x) => out.journey.push({ type: 'agent', agent: x.id, role: x.role || null, round: x.round ?? null, status: x.status, startedAt: x.startedAt || null }));
  } else if (sel.kind === 'round') {
    out.status = null;
    (snap.bugs || []).filter((b) => b.feature === sel.feature && (b.history || []).some((h) => h.round === sel.round)).forEach((b) => out.journey.push({ type: 'bug_event', bug: b.id, round: sel.round }));
  } else if (sel.kind === 'scope') {
    const d = model.districts.find((x) => x.id === sel.id); out.scopeSummary = d ? { label: d.label, total: d.total, passed: d.passed, openBugs: d.openBugs } : null;
    (d?.members || []).forEach((id) => out.journey.push({ type: 'feature', id }));
  }
  return out;
}

// ── Data views (HTML strings, everything escaped) ────────────────────────────────────────────────────────────
function pill(tone, text) { return `<span class="tw-pill" style="--c:${toneVar(tone)}">${esc(text)}</span>`; }
function kv(rows) { return `<dl class="tw-kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`; }
function sec(title, body, extra = '') { return `<section class="tw-sec"${extra}><h2>${esc(title)}</h2>${body}</section>`; }
const commitLink = (c, snap) => (c ? ` <a class="tw-mono" href="${esc(`${snap.repoUrl || ''}/commit/${c}`)}" target="_blank" rel="noopener noreferrer">${esc(String(c).slice(0, 7))}</a>` : '');
function relatedList(model, snap, sel, rel, href) {
  if (!rel.active) return '';
  const nodeByTok = new Map(); model.nodes.forEach((n) => { nodeByTok.set(n.id, [n.label, 'Feature']); n.sats.forEach((s) => { if (s.kind !== 'count') nodeByTok.set(s.id, [s.short, s.kind === 'bug' ? 'Bug' : s.kind === 'round' ? 'Round' : 'Agent']); }); });
  model.districts.forEach((d) => nodeByTok.set(d.id, [d.label, 'District']));
  const items = [...rel.ids].filter((id) => id !== sel.id && nodeByTok.has(id) && !id.startsWith('scope:')).map((id) => {
    const [label, type] = nodeByTok.get(id); const t = twSplit(id);
    const h = t[0] === 'round' ? href('round', t[1], t[2]) : href(...t);
    return `<li><a href="${esc(h)}" data-id="${esc(id)}"><span class="tw-rtype">${esc(type)}</span> <b>${esc(label)}</b></a>${rel.why[id] ? ` <span class="tw-muted">· ${esc(rel.why[id])}</span>` : ''}</li>`;
  });
  return sec('Related (highlighted in the world)', items.length ? `<ul class="tw-rel">${items.join('')}</ul>` : '<div class="tw-muted">Nothing else is linked to this.</div>', ' data-testid="tw-related"');
}

// The journey of a feature: a pass-rate line over the recorded states, then rounds and bug events in order.
function journeyChart(f, hist, at, fmtT) {
  const pts = (hist?.points || []).map((p, i) => ({ i, t: p.t, v: p.f?.[f.key] || null }));
  if (pts.length < 2) return '<div class="tw-muted">History has fewer than two recorded states, so there is no line to draw yet.</div>';
  const W = 320; const H = 96; const padX = 8; const padT = 8; const padB = 22;
  const x = (i) => padX + (i / (pts.length - 1)) * (W - 2 * padX);
  const y = (p) => padT + (1 - p) * (H - padT - padB);
  let d = ''; let pen = false; const dots = [];
  pts.forEach((p) => {
    if (p.v && p.v[3]) { const pct = p.v[2] / p.v[3]; d += `${pen ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(pct).toFixed(1)} `; pen = true; dots.push([p, pct]); } else pen = false;
  });
  const roundMarks = []; let lastRound = null;
  pts.forEach((p) => { const r = p.v?.[1]; if (r && r !== lastRound) { roundMarks.push([p, r]); lastRound = r; } });
  const cur = at == null ? pts.length - 1 : at;
  return `<svg class="tw-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pass rate of ${esc(f.key)} over the recorded states. Gaps mean not tested yet.">
    <title>Pass rate of ${esc(f.key)} over time (gaps = not tested yet)</title>
    <line x1="${padX}" y1="${y(1)}" x2="${W - padX}" y2="${y(1)}" class="tw-grid"/><line x1="${padX}" y1="${y(0)}" x2="${W - padX}" y2="${y(0)}" class="tw-grid"/>
    ${d ? `<path d="${d}" class="tw-line" fill="none"/>` : ''}
    ${dots.map(([p, pct]) => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(pct).toFixed(1)}" r="3" style="fill:${toneVar(toneOfStatus(p.v[0]))}"><title>${esc(fmtT(p.t))} UTC: ${p.v[2]}/${p.v[3]} steps</title></circle>`).join('')}
    ${roundMarks.map(([p, r]) => `<g><rect x="${(x(p.i) - 5).toFixed(1)}" y="${H - 18}" width="10" height="10" class="tw-rmark"/><text x="${x(p.i).toFixed(1)}" y="${H - 10}" text-anchor="middle" class="tw-rtext">${r}</text></g>`).join('')}
    <line x1="${x(cur).toFixed(1)}" y1="${padT - 4}" x2="${x(cur).toFixed(1)}" y2="${H - padB + 2}" class="tw-here"/>
    <text x="${padX}" y="${padT + 4}" class="tw-axis">100%</text><text x="${padX}" y="${y(0) - 3}" class="tw-axis">0%</text>
  </svg>
  <div class="tw-axis-row"><span>${esc(fmtT(pts[0].t))} UTC</span><span>${at == null ? 'now (live)' : `chosen point · ${esc(fmtT(pts[cur].t))} UTC`}</span><span>${esc(fmtT(pts[pts.length - 1].t))} UTC</span></div>`;
}

function featureJourneyRows(ctx, f) {
  const { snap, hist, at, href, fmtT } = ctx;
  const histRound = at != null && hist ? (hist.points[at]?.f?.[f.key]?.[1] ?? 0) : null;
  const rounds = roundsOf(snap, hist, f, null);
  const bugs = (snap.bugs || []).filter((b) => b.feature === f.key && b.status !== 'seen_in_test');
  const byRound = new Map(); rounds.forEach((r) => byRound.set(r.n, { round: r, events: [] }));
  bugs.forEach((b) => (b.history || []).forEach((h) => { const n = h.round || 0; if (!byRound.has(n)) byRound.set(n, { round: null, n, events: [] }); byRound.get(n).events.push({ b, h }); }));
  const rows = [];
  [...byRound.keys()].sort((a, b) => a - b).forEach((n) => {
    const g = byRound.get(n);
    const after = histRound != null && n > histRound;
    if (g.round) {
      const r = g.round;
      rows.push(`<li class="tw-j${after ? ' tw-after' : ''}"><span class="tw-jt">${r.firstAt ? esc(fmtT(r.firstAt)) : 'time not recorded'}</span><span class="tw-jb"><a href="${esc(href('round', f.key, r.n))}"><b>Round ${r.n}</b></a> ${r.total ? `${r.passed}/${r.total} steps (${Math.round((r.passed / r.total) * 100)}%)` : r.running ? 'being tested now, no score yet' : 'score not recorded'}${r.status ? ` · ${esc(ctx.statusText(r.status))}` : ''}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`);
    }
    g.events.sort((a, b) => (EVENT_RANK[a.h.event] ?? 1) - (EVENT_RANK[b.h.event] ?? 1)).forEach(({ b, h }) => {
      const ev = EVENT_LABEL[h.event] || h.event;
      const tone = h.event === 'verified' ? 'good' : h.event === 'fixed' ? 'gold' : 'bad';
      rows.push(`<li class="tw-j tw-jbug${after ? ' tw-after' : ''}"><span class="tw-jt">${n ? `R${n}` : 'Build'}</span><span class="tw-jb">${pill(tone, ev)} <a href="${esc(href('bug', b.id))}" class="tw-mono">${esc(b.id)}</a> ${esc(h.note || '')}${commitLink(h.commit, snap)}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`);
    });
  });
  return rows.length ? `<ol class="tw-jlist">${rows.join('')}</ol>` : '<div class="tw-muted">No test round has been recorded for this feature yet.</div>';
}

function modeNote(ctx) {
  const { hist, at, fmtT } = ctx;
  if (at == null || !hist) return '<div class="tw-note" data-testid="tw-mode-note"><b>Current</b> state: what the release looks like right now.</div>';
  const pt = hist.points[at]; const u = updateAtPoint(hist, at, ctx.pointIndexAt);
  return `<div class="tw-note tw-note-hist" data-testid="tw-mode-note"><b>Historic</b> state: ${esc(fmtT(pt.t))} UTC${u ? ` · after ${esc(u.version)}` : ''}. Amber items changed since then; rows marked <i>after this point</i> had not happened yet.</div>`;
}

function changedBlock(node, ctx) {
  if (ctx.at == null || !node?.changed) return '';
  return sec('Changed since this point', `<ul class="tw-chg">${node.changed.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`, ' data-testid="tw-changed"');
}

function viewFeature(ctx, sel, rel) {
  const { snap, model, href } = ctx;
  const f = (snap.features || []).find((x) => x.key === sel.feature); const n = model.nodes.find((x) => x.key === sel.feature);
  if (!f || !n) return null;
  const d = model.districts.find((x) => x.members.includes(n.id));
  const r = f.lastResult;
  const own = (snap.bugs || []).filter((b) => b.status !== 'seen_in_test' && ((b.feature === f.key && !BACKLOG.includes(b.status)) || (b.status === 'reassigned' && b.scope?.owner === f.key)));
  const bl = (snap.bugs || []).filter((b) => b.feature === f.key && BACKLOG.includes(b.status));
  const agents = (snap.agents || []).filter((a) => a.feature === f.key);
  const scopeRows = n.added
    ? `<b>${esc(d?.label || 'Added after the cut')}</b> · added ${esc(String(n.added.at || '').slice(0, 10))}${n.added.commit ? ` (${esc(n.added.commit)})` : ''} · ${n.scope === 'planned' ? 'counted in this release' : 'kept in backlog'}<div class="tw-muted">${esc(n.added.reason || 'No reason recorded.')}</div>`
    : `<a href="${esc(href('scope', n.district))}"><b>${esc(d?.label || 'This release')}</b></a>${n.scope === 'backlog' ? ' · not this release\'s work' : n.scope === 'planned' ? ' · counted in this release' : ''}`;
  const bugList = (list) => (list.length ? `<ul class="tw-rel">${list.map((b) => `<li><a href="${esc(href('bug', b.id))}" class="tw-mono">${esc(b.id)}</a> ${pill(`s${bugCat(b.status)}`, ctx.statusText(b.status))} <span class="tw-muted">${esc(b.step || '')}</span></li>`).join('')}</ul>` : '<div class="tw-muted">None.</div>');
  return `<header class="tw-vh"><div class="tw-type">Feature</div><h3>${esc(f.key)}</h3><div>${pill(n.tone, n.statusLabel)} ${n.changed ? '<span class="tw-chip tw-chip-chg">changed since</span>' : ''}</div></header>
  ${modeNote(ctx)}
  ${n.absent ? '<div class="tw-note">This feature was not tracked yet at the chosen point.</div>' : ''}
  ${sec('Where it sits', kv([['District', scopeRows], ['Latest test', n.absent ? '—' : (n.pct == null ? 'Not tested yet' : `${esc(n.scoreText)} (${n.pct}%)${r?.round && ctx.at == null ? ` · round ${r.round}${r.baseline ? ` · baseline v${r.baseline}` : ''}` : ''}`)], ['Test rounds', esc(String(ctx.at == null ? f.rounds : n.counts.rounds))], ['Depends on', f.dependsOn?.length ? f.dependsOn.map((k) => `<a href="${esc(href('feature', k))}">${esc(k)}</a>`).join(', ') : '<span class="tw-muted">Nothing recorded</span>']]))}
  ${changedBlock(n, ctx)}
  ${sec('Journey through the release', `${journeyChart(f, ctx.hist, ctx.at, ctx.fmtT)}${featureJourneyRows(ctx, f)}`, ' data-testid="tw-journey"')}
  ${sec(`Its bugs (${own.length}${bl.length ? ` + ${bl.length} in backlog` : ''})`, ctx.at != null ? `<div class="tw-muted">At this point the record holds counts only: ${CATS.map((c, i) => `${ctx.hist.points[ctx.at]?.f?.[f.key]?.[4 + i] ?? 0} ${c.toLowerCase()}`).join(', ')}. Switch to Current to open the individual bugs.</div>` : bugList([...own, ...bl]))}
  ${sec(`Agents (${agents.length})`, ctx.at != null ? '<div class="tw-muted">Agent runs are shown for the Current state only.</div>' : (agents.length ? `<ul class="tw-rel">${agents.slice(0, 12).map((a) => `<li><a href="${esc(href('agent', a.id))}"><b>${esc(ROLE_LABEL[a.role] || a.role || 'Agent')}${a.round ? ` · round ${a.round}` : ''}</b></a> ${pill(agentTone(a.status), ctx.statusText(a.status))} <span class="tw-muted">${esc(a.summary || a.activity || '')}</span></li>`).join('')}${agents.length > 12 ? `<li class="tw-muted">+ ${agents.length - 12} older runs</li>` : ''}</ul>` : '<div class="tw-muted">No agent runs here.</div>'))}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewBug(ctx, sel, rel) {
  const { snap, href, model } = ctx;
  const b = (snap.bugs || []).find((x) => x.id === sel.bug); if (!b) return null;
  const hist = (b.history || []);
  const touched = [...new Set(hist.map((h) => h.round).filter(Boolean))];
  const stages = [['found', 'Found'], ['fixing', 'Being fixed'], ['verified', 'Verified fixed']];
  const stageIdx = b.status === 'verified' ? 2 : ['fixing', 'fixed_awaiting_retest', 'retesting'].includes(b.status) ? 1 : 0;
  const histRound = ctx.at != null && ctx.hist ? (ctx.hist.points[ctx.at]?.f?.[b.feature]?.[1] ?? 0) : null;
  const ribbon = `<ol class="tw-stages" aria-label="Where this bug is in its journey">${stages.map(([k, l], i) => `<li class="${i < stageIdx ? 'tw-done' : i === stageIdx ? 'tw-cur' : ''}" ${i === stageIdx ? 'aria-current="step"' : ''}>${esc(l)}</li>`).join('')}</ol>`;
  const rows = hist.length ? hist.map((h) => { const after = histRound != null && (h.round || 0) > histRound; return `<li class="tw-j${after ? ' tw-after' : ''}"><span class="tw-jt">${h.round ? `<a href="${esc(href('round', b.feature, h.round))}">R${h.round}</a>` : 'Build'}</span><span class="tw-jb">${pill(h.event === 'verified' ? 'good' : h.event === 'fixed' ? 'gold' : 'bad', EVENT_LABEL[h.event] || h.event)} ${esc(h.note || '')}${h.files?.length ? ` <span class="tw-mono tw-muted">${esc(h.files.join(', '))}</span>` : ''}${commitLink(h.commit, snap)}${after ? ' <span class="tw-chip">after this point</span>' : ''}</span></li>`; }).join('') : '<li class="tw-muted">No history recorded.</li>';
  const own = b.scope?.owner;
  return `<header class="tw-vh"><div class="tw-type">Bug</div><h3>${esc(b.step || b.id)}</h3><div>${pill(`s${bugCat(b.status)}`, ctx.statusText(b.status))} <span class="tw-mono tw-muted">${esc(b.id)}</span> · fix attempts ${b.attempts || 0} of ${esc(snap.maxFixAttemptsPerBug ?? '—')}</div></header>
  ${modeNote(ctx)}
  ${b.question ? `<div class="tw-callout"><b>Question for you:</b> ${esc(b.question)}</div>` : ''}
  ${sec('Journey of this bug', ribbon + `<ol class="tw-jlist">${rows}</ol>`, ' data-testid="tw-journey"')}
  ${sec('Details', kv([
    ['Root cause', esc(b.rootCause || '—')], ['Class', esc(b.class || '—')], ['Files', `<span class="tw-mono">${esc((b.files || []).join(', ') || '—')}</span>`],
    ['Fix attempts', `${b.attempts || 0} of ${esc(snap.maxFixAttemptsPerBug ?? '—')}`],
    ['Whose bug', b.scope ? `${esc(({ this_feature: 'This feature', pre_existing: 'Was already broken before this work', other_feature: 'Another feature', process_note: 'Test or process note, not a product bug' })[b.scope.scope] || b.scope.scope)}${own ? ` — <a href="${esc(href('feature', own))}">${esc(own)}</a>` : ''}<div class="tw-muted">${esc(b.scope.evidence || '')} (${esc(b.scope.decidedBy || '')})</div>` : '<span class="tw-muted">Not scope-checked yet</span>'],
    ['Reported against', `<a href="${esc(href('feature', b.feature))}">${esc(b.feature)}</a>${touched.length ? ` · rounds ${touched.map((n) => `<a href="${esc(href('round', b.feature, n))}">${n}</a>`).join(', ')}` : ''}`],
  ]))}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewAgent(ctx, sel, rel) {
  const { snap, href, model, now } = ctx;
  const a = (snap.agents || []).find((x) => x.id === sel.agent); if (!a) return null;
  const ls = a.liveSteps; const t = a.tokens || {};
  const sameFeature = (snap.agents || []).filter((x) => x.feature === a.feature).sort((p, q) => String(p.startedAt || '').localeCompare(String(q.startedAt || '')));
  const loop = `<ol class="tw-stages" aria-label="Where this agent sits in the release loop">${STAGES.map((s) => `<li class="${s === a.role ? 'tw-cur' : ''}" ${s === a.role ? 'aria-current="step"' : ''}>${esc(ROLE_LABEL[s] || s)}</li>`).join('')}</ol>`;
  return `<header class="tw-vh"><div class="tw-type">Agent</div><h3>${esc(ROLE_LABEL[a.role] || a.role || 'Agent')}${a.round ? ` · round ${a.round}` : ''}${a.feature ? ` — ${esc(a.feature)}` : ''}</h3><div>${pill(agentTone(a.status), ctx.statusText(a.status))} <span class="tw-mono tw-muted">${esc(a.label || a.id)}</span></div></header>
  ${modeNote(ctx)}
  ${sec('Activity', `${loop}${kv([['Result', esc(a.summary || '—')], ['Latest step', `<span class="tw-mono">${esc(a.activity || '—')}</span>`], ['Started', esc(agoText(a.startedAt, now))], ['Last activity', esc(agoText(a.lastActivityAt, now))]])}`)}
  ${sec('Tokens', `<div class="tw-tokens"><div><b>${kfmt(t.output)}</b><span>out</span></div><div><b>${kfmt(t.input)}</b><span>in</span></div><div><b>${kfmt(t.cacheWrite)}</b><span>cache write</span></div><div><b>${kfmt(t.cacheRead)}</b><span>cache read</span></div></div>${t.output == null ? '<div class="tw-muted">Token counts were not recorded for this run.</div>' : ''}`)}
  ${ls ? sec('Live test log', `${kv([['Checks logged', `${ls.checked} (${ls.passed} passed)`]])}${(ls.failed || []).length ? `<ul class="tw-rel">${ls.failed.map((f) => `<li><b>${esc(f.step)}</b> expected: ${esc(f.expect || '—')} · saw: ${esc(f.seen || '—')}</li>`).join('')}</ul>` : ''}`) : ''}
  ${a.failures?.length ? sec(`Command failures it reported (${a.failures.length})`, `<ul class="tw-rel">${a.failures.map((f, i) => `<li>#${i + 1} ${esc(typeof f === 'string' ? f : JSON.stringify(f))}</li>`).join('')}</ul>`) : ''}
  ${a.feature ? sec(`Agents on ${a.feature} in order (${sameFeature.length})`, `<ol class="tw-jlist">${sameFeature.slice(-10).map((x) => `<li class="tw-j${x.id === a.id ? ' tw-me' : ''}"><span class="tw-jt">${x.startedAt ? esc(ctx.fmtT(x.startedAt)) : '—'}</span><span class="tw-jb"><a href="${esc(href('agent', x.id))}">${esc(ROLE_LABEL[x.role] || x.role || 'Agent')}${x.round ? ` · round ${x.round}` : ''}</a> ${pill(agentTone(x.status), ctx.statusText(x.status))}</span></li>`).join('')}</ol>`, ' data-testid="tw-journey"') : ''}
  ${relatedList(model, snap, sel, rel, href)}`;
}

function viewScope(ctx, sel, rel) {
  const { snap, model, href } = ctx;
  const d = model.districts.find((x) => x.id === sel.id); if (!d) return null;
  const rows = d.members.map((id) => model.nodes.find((n) => n.id === id)).filter(Boolean).map((n) => `<tr><td><a href="${esc(href('feature', n.key))}"><b>${esc(n.key)}</b></a></td><td>${pill(n.tone, n.statusLabel)}</td><td class="tw-num">${esc(n.scoreText)}</td><td class="tw-num">${n.counts.bugs}</td></tr>`).join('');
  const added = d.key === 'added' ? `<div class="tw-note">${d.members.map((id) => model.nodes.find((n) => n.id === id)).filter((n) => n?.added).map((n) => `<div><b>${esc(n.key)}</b> · added ${esc(String(n.added.at || '').slice(0, 10))}${n.added.commit ? ` (${esc(n.added.commit)})` : ''} · ${n.scope === 'planned' ? 'counted in this release' : 'kept in backlog'} · ${esc(n.added.reason || '')}</div>`).join('')}</div>` : '';
  return `<header class="tw-vh"><div class="tw-type">District</div><h3>${esc(d.label)}: ${d.total}</h3><div class="tw-muted">${esc(d.note)}</div></header>
  ${modeNote(ctx)}
  ${sec('At a glance', kv([['Features', String(d.total)], ['Passed', `${d.passed} of ${d.total}`], ['Open bugs (this work)', String(d.openBugs)]]))}
  ${added}
  ${sec('Features in this district', d.members.length ? `<div class="tw-tablewrap"><table class="tw-table"><thead><tr><th>Feature</th><th>Status</th><th>Latest test</th><th>Bugs</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="tw-muted">No feature is in this district.</div>')}
  ${relatedList(model, snap, sel, rel, href).replace(/<li><a [^>]*data-id="scope:[^"]*"[\s\S]*?<\/li>/g, '')}`;
}

function viewHtml(ctx, sel, rel) {
  if (!sel) return null;
  if (sel.kind === 'feature') return viewFeature(ctx, sel, rel);
  if (sel.kind === 'bug') return viewBug(ctx, sel, rel);
  if (sel.kind === 'agent') return viewAgent(ctx, sel, rel);
  if (sel.kind === 'scope') return viewScope(ctx, sel, rel);
  return null;
}

// ── Always-visible overlays: legend, headline chips, the Objects list ────────────────────────────────────────
const TONE_KEY = [['teal', 'In progress'], ['good', 'Passed'], ['bad', 'Failing'], ['gold', 'Awaiting re-test'], ['human', 'Needs a person'], ['muted', 'Queued, not started or agent stopped']];
function legendHtml(model) {
  const dist = model.districts.map((d, i) => `<li><span class="tw-ring-sw" style="--c:${toneVar(['teal', 'gold', 'muted', 'human'][i] || 'muted')}"></span><b>${esc(d.label)}</b> <span class="tw-muted">${d.total} feature${d.total === 1 ? '' : 's'}${d.total ? ` · ${d.passed} passed` : ''}</span></li>`).join('');
  return `<div class="tw-leg-body">
    <div class="tw-leg-h">Rings (where a feature sits)</div><ul class="tw-leg-list">${dist}</ul>
    <div class="tw-leg-h">Crystal = a feature</div>
    <div class="tw-leg-row">${TONE_KEY.map(([c, l]) => `<span class="tw-k"><span class="tw-gem" style="background:${toneVar(c)}"></span>${esc(l)}</span>`).join('')}</div>
    <div class="tw-muted">Size = steps in its test suite · gold arc = share of steps passing · bubbles = an agent working on it now</div>
    <div class="tw-leg-h">Satellites</div>
    <div class="tw-leg-row"><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><polygon points="6,0 12,6 6,12 0,6" fill="${toneVar('s1')}"/></svg>Bug (colour = its state)</span><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="${toneVar('good')}"/></svg>Test round (green = all steps passed)</span><span class="tw-k"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><polygon points="6,1 11,11 1,11" fill="${toneVar('teal')}"/></svg>Agent</span></div>
    <div class="tw-leg-row">${CATS.map((c, i) => `<span class="tw-k"><span class="tw-gem" style="background:${toneVar(`s${i + 1}`)}"></span>${esc(c)}</span>`).join('')}</div>
  </div>`;
}
function headlineHtml(snap, href) {
  const bugs = snap.bugs || [];
  const chips = [
    ['open-bugs', 'Open bugs (this work)', bugs.filter(isOpenBug).length], ['verified', 'Bugs verified fixed', bugs.filter((b) => b.status === 'verified').length],
    ['backlog', 'Backlog: not this work', bugs.filter((b) => BACKLOG.includes(b.status)).length], ['human', 'Need a person', bugs.filter((b) => PERSON.includes(b.status)).length],
    ['agents-running', 'Agents running', (snap.agents || []).filter((a) => a.status === 'running').length],
  ];
  return chips.map(([k, l, n]) => `<a class="tw-chipbtn" href="${esc(href('stat', k))}"><b>${n}</b> ${esc(l)}</a>`).join('');
}
function objectsHtml(model, href) {
  return model.districts.map((d) => {
    const members = d.members.map((id) => model.nodes.find((n) => n.id === id)).filter(Boolean);
    return `<section class="tw-ol-d"><h2><a href="${esc(href('scope', d.key))}" data-id="${esc(d.id)}">${esc(d.label)}</a> <span class="tw-muted">${d.total}</span></h2>${members.length ? `<ul class="tw-ol">${members.map((n) => `<li><a class="tw-ol-f" href="${esc(href('feature', n.key))}" data-id="${esc(n.id)}"><span><b>${esc(n.key)}</b><br><span class="tw-muted">${esc(n.statusLabel)}</span></span><span class="tw-num tw-muted">${esc(n.scoreText)}</span></a>${n.sats.filter((s) => s.kind !== 'count').length ? `<ul class="tw-ol-s">${n.sats.filter((s) => s.kind !== 'count').map((s) => { const t = twSplit(s.token); return `<li><a href="${esc(t[0] === 'round' ? href('round', t[1], t[2]) : href(...t))}" data-id="${esc(s.id)}"><span class="tw-rtype">${s.kind === 'bug' ? 'Bug' : s.kind === 'round' ? 'Round' : 'Agent'}</span> ${esc(s.short)}</a></li>`; }).join('')}</ul>` : ''}</li>`).join('')}</ul>` : '<div class="tw-muted">No feature here.</div>'}</section>`;
  }).join('');
}

// ── The shared CSS (tokens --tw-* are set from the host's own variables at mount and on theme change) ─────────
const WORLD_CSS = `
.tw { position: relative; border: 1px solid var(--tw-line); border-radius: 16px; overflow: hidden; background: var(--tw-panel); color: var(--tw-ink); font: 15px/1.45 var(--tw-body, system-ui, sans-serif); }
.tw *, .tw *::before, .tw *::after { box-sizing: border-box; }
.tw a { color: var(--tw-teal); }
.tw-stage { position: relative; height: clamp(560px, calc(100vh - 230px), 900px); overflow: hidden; touch-action: none; outline: none; background: linear-gradient(180deg, var(--tw-waterTop) 0%, var(--tw-waterMid) 45%, var(--tw-waterDeep) 100%); }
.tw-stage:focus-visible { box-shadow: inset 0 0 0 3px var(--tw-gold); }
.tw-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; }
.tw-stage canvas.tw-pointing { cursor: pointer; }
.tw-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.tw-wl { position: absolute; transform: translate(-50%, 14px); font: 500 12px/1.25 var(--tw-body, system-ui, sans-serif); color: var(--tw-ink); text-align: center; white-space: nowrap; background: color-mix(in srgb, var(--tw-panel) 82%, transparent); padding: 2px 8px; border-radius: 8px; border: 1px solid transparent; transition: opacity .2s; }
.tw-wl b { font: 600 13px var(--tw-display, Georgia, serif); display: block; }
.tw-wl .tw-sub { display: block; color: var(--tw-muted); }
.tw-wl .tw-st { display: inline-block; width: 8px; height: 8px; border-radius: 2px; transform: rotate(45deg); margin-right: 5px; vertical-align: 0; }
.tw-wl.tw-dim { opacity: .22; }
.tw-wl.tw-sel { border-color: var(--tw-gold); background: var(--tw-panel); }
.tw-wl.tw-rel { border-color: var(--tw-teal); }
.tw-wl.tw-kbd { outline: 2px solid var(--tw-gold); }
.tw-wl-sun b { font-size: 17px; }
.tw-wl-sat { transform: translate(-50%, 8px); font-size: 11px; padding: 1px 6px; }
.tw-wl-dist { pointer-events: none; text-decoration: none; transform: translate(-50%, -50%); font: 600 11px var(--tw-body, system-ui, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: var(--tw-ink); border: 1px solid var(--c, var(--tw-line)); background: color-mix(in srgb, var(--tw-panel) 88%, transparent); padding: 3px 10px; border-radius: 999px; min-height: 24px; }
.tw-wl-dist .tw-muted { text-transform: none; letter-spacing: 0; font-weight: 500; }
.tw-tip { position: absolute; pointer-events: none; background: var(--tw-panel); border: 1px solid var(--tw-line); border-radius: 8px; padding: 7px 10px; font-size: 13px; box-shadow: 0 8px 22px -12px rgba(0,0,0,.35); max-width: 260px; display: none; z-index: 6; }
.tw-muted { color: var(--tw-muted); }
.tw-mono { font-family: var(--tw-mono, ui-monospace, monospace); font-size: 12.5px; }
.tw-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.tw-hud { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; justify-content: space-between; z-index: 4; pointer-events: none; }
.tw-hud > * { pointer-events: auto; }
.tw-hud-l { display: grid; gap: 8px; justify-items: start; max-width: min(520px, 100%); }
.tw-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tw-chips-panel { display: none; margin-bottom: 8px; }
.tw-chipbtn { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 4px 11px; border-radius: 999px; border: 1px solid var(--tw-line); background: color-mix(in srgb, var(--tw-panel) 90%, transparent); color: var(--tw-ink) !important; text-decoration: none; font-size: 13px; }
.tw-chipbtn b { font-variant-numeric: tabular-nums; }
.tw-legend { width: min(360px, 100%); border: 1px solid var(--tw-line); border-radius: 12px; background: color-mix(in srgb, var(--tw-panel) 92%, transparent); max-width: 100%; }
.tw-legend > summary { cursor: pointer; padding: 8px 12px; min-height: 44px; display: flex; align-items: center; font: 600 13px var(--tw-body, system-ui, sans-serif); list-style: none; }
.tw-legend > summary::-webkit-details-marker { display: none; }
.tw-legend > summary::after { content: '▾'; margin-left: 8px; color: var(--tw-muted); }
.tw-legend:not([open]) > summary::after { content: '▸'; }
.tw-leg-body { padding: 2px 12px 12px; display: grid; gap: 6px; font-size: 12.5px; max-height: 42vh; overflow: auto; }
.tw-leg-h { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .14em; color: var(--tw-muted); margin-top: 4px; }
.tw-leg-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; }
.tw-leg-row { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.tw-k { display: inline-flex; align-items: center; gap: 6px; }
.tw-gem { width: 10px; height: 10px; transform: rotate(45deg); display: inline-block; border-radius: 2px; }
.tw-ring-sw { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--c); vertical-align: -2px; margin-right: 6px; }
.tw-tools { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
.tw-seg { display: inline-flex; border: 1px solid var(--tw-line); border-radius: 999px; padding: 2px; background: color-mix(in srgb, var(--tw-panel2) 92%, transparent); }
.tw-seg button { font: 500 13px var(--tw-body, system-ui, sans-serif); border: 0; background: transparent; color: var(--tw-ink); border-radius: 999px; padding: 5px 14px; cursor: pointer; min-height: 40px; }
.tw-seg button[aria-pressed="true"] { background: var(--tw-teal); color: var(--tw-panel); }
.tw-seg button:disabled { opacity: .5; cursor: not-allowed; }
.tw-btn { font: 600 13px var(--tw-body, system-ui, sans-serif); border: 1px solid var(--tw-line); background: color-mix(in srgb, var(--tw-panel) 92%, transparent); color: var(--tw-ink); border-radius: 999px; padding: 6px 14px; cursor: pointer; min-height: 44px; }
.tw-btn[aria-pressed="true"], .tw-btn[aria-expanded="true"] { border-color: var(--tw-teal); }
.tw button:focus-visible, .tw a:focus-visible, .tw summary:focus-visible, .tw input:focus-visible { outline: 2px solid var(--tw-gold); outline-offset: 2px; }
.tw-hint { position: absolute; left: 10px; bottom: 62px; z-index: 3; font-size: 12px; color: var(--tw-ink); background: color-mix(in srgb, var(--tw-panel) 80%, transparent); padding: 3px 10px; border-radius: 999px; pointer-events: none; }
.tw-bar { position: absolute; left: 10px; right: 10px; bottom: 10px; display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--tw-panel) 90%, transparent); border: 1px solid var(--tw-line); border-radius: 999px; padding: 4px 10px; z-index: 5; }
.tw-bar input[type=range] { flex: 1; min-width: 0; accent-color: var(--tw-teal); height: 44px; }
.tw-bar .tw-asof { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40%; font-size: 13px; }
.tw-step { min-width: 44px; min-height: 44px; border-radius: 999px; border: 1px solid var(--tw-line); background: var(--tw-panel); color: var(--tw-ink); font: 600 16px var(--tw-body, system-ui, sans-serif); cursor: pointer; }
.tw-step[aria-pressed="true"] { background: var(--tw-teal); color: var(--tw-panel); border-color: var(--tw-teal); }
.tw-step:disabled { opacity: .5; cursor: not-allowed; }
.tw-drawer, .tw-objects { position: absolute; z-index: 5; background: var(--tw-panel); border: 1px solid var(--tw-line); box-shadow: 0 12px 36px -16px rgba(0,0,0,.5); display: flex; flex-direction: column; min-height: 0; }
.tw-drawer[hidden], .tw-objects[hidden] { display: none; }
.tw-drawer { top: 62px; right: 10px; bottom: 66px; width: min(430px, calc(100% - 20px)); border-radius: 14px; }
.tw-objects { top: 62px; left: 10px; bottom: 66px; width: min(360px, calc(100% - 20px)); border-radius: 14px; }
.tw-dh { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--tw-line); }
.tw-dh h2 { margin: 0 auto 0 4px; font: 600 12px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); }
.tw-db { overflow: auto; padding: 14px; display: grid; gap: 14px; align-content: start; min-height: 0; overscroll-behavior: contain; }
.tw-vh .tw-type { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); }
.tw-vh h3 { margin: 2px 0 6px; font: 600 21px/1.2 var(--tw-display, Georgia, serif); overflow-wrap: anywhere; color: var(--tw-ink); }
.tw-sec h2 { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; color: var(--tw-muted); margin: 0 0 8px; }
.tw-pill { display: inline-block; font: 600 12px/1 var(--tw-body, system-ui, sans-serif); padding: 4px 9px; border-radius: 999px; color: var(--c); border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); }
.tw-chip { display: inline-block; font: 600 11px/1 var(--tw-body, system-ui, sans-serif); padding: 3px 7px; border-radius: 999px; background: var(--tw-panel2); color: var(--tw-muted); }
.tw-chip-chg { background: var(--tw-goldSoft); color: var(--tw-gold); }
.tw-kv { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 6px 10px; margin: 0; font-size: 14px; }
.tw-kv dt { color: var(--tw-muted); } .tw-kv dd { margin: 0; overflow-wrap: anywhere; }
.tw-note { border: 1px solid var(--tw-line); background: var(--tw-panel2); border-radius: 10px; padding: 8px 12px; font-size: 13px; }
.tw-note-hist { border-color: var(--tw-gold); background: var(--tw-goldSoft); }
.tw-callout { border: 1px solid var(--tw-human); background: var(--tw-humanSoft); border-radius: 10px; padding: 8px 12px; font-size: 14px; }
.tw-jlist { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
.tw-j { display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 8px; font-size: 13.5px; padding: 4px 0; border-bottom: 1px dashed var(--tw-line); }
.tw-jt { color: var(--tw-muted); font-size: 12.5px; }
.tw-jb { overflow-wrap: anywhere; }
.tw-after { opacity: .55; }
.tw-me { background: var(--tw-tealSoft); }
.tw-chg { margin: 0; padding-left: 18px; color: var(--tw-gold); font-weight: 600; }
.tw-rel { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 13.5px; }
.tw-rel li { min-height: 28px; }
.tw-rtype { display: inline-block; font: 600 10.5px/1 var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .08em; padding: 3px 6px; border-radius: 6px; background: var(--tw-panel2); color: var(--tw-muted); }
.tw-chart { width: 100%; height: auto; display: block; }
.tw-grid { stroke: var(--tw-line); stroke-width: 1; }
.tw-line { stroke: var(--tw-s1); stroke-width: 2; }
.tw-here { stroke: var(--tw-gold); stroke-width: 2; stroke-dasharray: 3 3; }
.tw-rmark { fill: var(--tw-panel2); stroke: var(--tw-muted); stroke-width: 1; }
.tw-rtext, .tw-axis { font: 9px var(--tw-body, system-ui, sans-serif); fill: var(--tw-muted); }
.tw-axis-row { display: flex; justify-content: space-between; gap: 6px; font-size: 11.5px; color: var(--tw-muted); }
.tw-stages { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-wrap: wrap; gap: 4px; }
.tw-stages li { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--tw-line); color: var(--tw-muted); }
.tw-stages li.tw-done { background: var(--tw-goodSoft); color: var(--tw-good); border-color: var(--tw-good); }
.tw-stages li.tw-cur { background: var(--tw-teal); color: var(--tw-panel); border-color: var(--tw-teal); font-weight: 600; }
.tw-tokens { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; text-align: center; }
.tw-tokens div { border: 1px solid var(--tw-line); border-radius: 10px; padding: 6px 4px; display: grid; }
.tw-tokens span { font-size: 11.5px; color: var(--tw-muted); }
.tw-tablewrap { overflow-x: auto; }
.tw-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.tw-table th, .tw-table td { text-align: left; padding: 6px 6px; border-bottom: 1px solid var(--tw-line); vertical-align: top; }
.tw-table th { font: 600 11px var(--tw-body, system-ui, sans-serif); color: var(--tw-muted); text-transform: uppercase; letter-spacing: .08em; }
.tw-ol-d { margin-bottom: 10px; } .tw-ol-d h2 { font: 600 11px var(--tw-body, system-ui, sans-serif); text-transform: uppercase; letter-spacing: .16em; margin: 0 0 6px; }
.tw-ol-d h2 a { color: var(--tw-ink); }
.tw-ol, .tw-ol-s { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.tw-ol-f { display: flex; justify-content: space-between; gap: 10px; padding: 8px; border-radius: 8px; text-decoration: none; color: var(--tw-ink) !important; font-size: 13.5px; min-height: 44px; align-items: center; }
.tw-ol-f:hover, .tw-ol-f:focus-visible, .tw-ol-s a:hover { background: var(--tw-tealSoft); }
.tw-ol-s { margin-left: 18px; }
.tw-ol-s a { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 8px; border-radius: 8px; text-decoration: none; font-size: 13px; }
.tw-ol-on { background: var(--tw-goldSoft); }
.tw-sheet-toggle { display: none; }
.tw-fallback { padding: 12px; }
.tw-host { display: grid; gap: 14px; }
.tw-host:empty { display: none; }
.tw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 760px) {
  .tw-stage { height: clamp(520px, calc(100svh - 70px), 820px); }
  .tw-hud { top: 8px; left: 8px; right: 8px; flex-direction: column; flex-wrap: nowrap; gap: 6px; }
  .tw-hud-l { order: 2; } .tw-tools { order: 1; justify-content: flex-start; }
  .tw-hud-l > .tw-chips { display: none; }
  .tw-chips-panel { display: flex; }
  .tw-btn[data-act="pause"] { display: none; }
  .tw-seg button { padding: 5px 11px; min-height: 44px; }
  .tw-btn { padding: 6px 11px; }
  .tw-hint { display: none; }
  .tw-wl-dist { font-size: 10px; padding: 2px 8px; min-height: 20px; }
  .tw-legend:not([open]) { max-width: 150px; }
  .tw-drawer { top: auto; left: 8px; right: 8px; bottom: 64px; width: auto; max-height: 56%; border-radius: 16px 16px 12px 12px; }
  .tw-drawer[data-collapsed="true"] .tw-db { display: none; }
  .tw-drawer[data-collapsed="true"] { max-height: none; }
  .tw-objects { top: auto; left: 8px; right: 8px; bottom: 64px; width: auto; max-height: 62%; }
  .tw-sheet-toggle { display: inline-flex; }
  .tw-bar .tw-asof { display: none; }
  .tw-kv { grid-template-columns: 1fr; gap: 0; } .tw-kv dt { margin-top: 6px; }
  .tw-j { grid-template-columns: 58px minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .tw-wl { transition: none; } }
`;

// ── The controller: DOM + Three.js ───────────────────────────────────────────────────────────────────────────
const TOKENS = ['panel', 'panel2', 'ink', 'muted', 'line', 'teal', 'tealSoft', 'gold', 'goldSoft', 'good', 'goodSoft', 'bad', 'badSoft', 'human', 'humanSoft', 's1', 's2', 's3', 's4', 'waterTop', 'waterMid', 'waterDeep', 'sand'];

/**
 * createTrackerWorld({ THREE, geo, root, host })
 *   host: { cssVar(token) -> css value, hashFor(path[]) -> '#/...', navigate(hash), reducedMotion, statusText, fmtT,
 *           pointIndexAt(iso), bind? (render-binding resolver), environment? }
 *   geo : { addCrystalLights(scene, THREE), signature(group, THREE), buildGemMesh(THREE, opts), buildRiverParticles(THREE, opts),
 *           advanceRiverParticles(points, dt), projectToScreen(THREE, v3, camera, w, h), buildEnvironment(name, scene, THREE, opts) }
 * Returns { update({snap, hist, path, now}), setAt(i|null), refreshColors(), hostSlot, state(), dispose() }.
 */
function createTrackerWorld({ THREE, geo, root, host }) {
  const css = () => { if (!document.getElementById('tw-style')) { const s = document.createElement('style'); s.id = 'tw-style'; s.textContent = WORLD_CSS; document.head.appendChild(s); } };
  css();
  const cv = (t) => host.cssVar(t) || '#888888';
  const col = (t) => new THREE.Color(cv(t));
  let reduce = !!host.reducedMotion; let paused = false;
  const S = { snap: null, hist: null, path: [], now: Date.now(), at: null, lastHistoric: null, model: null, sel: null, rel: { ids: new Set(), why: {}, links: [], active: false }, kbd: -1, collapsed: false, hostOverview: false, viewKey: '', screenPts: [] };

  root.innerHTML = `<div class="tw" data-tw="1">
    <div class="tw-stage" tabindex="0" role="application" aria-label="Release world. Use the arrow keys to move between objects, Enter to open one, Escape to go back. Every object is also in the Objects list.">
      <div class="tw-labels" aria-hidden="true"></div><div class="tw-tip" role="status"></div>
      <div class="tw-hud"><div class="tw-hud-l"><div class="tw-chips"></div><details class="tw-legend" open><summary>Legend</summary><div class="tw-legend-slot"></div></details></div>
        <div class="tw-tools"><div class="tw-seg" role="group" aria-label="World state"><button type="button" data-state="current" aria-pressed="true">Current</button><button type="button" data-state="historic" aria-pressed="false">Historic</button></div>
          <button type="button" class="tw-btn" data-act="objects" aria-expanded="false" aria-controls="tw-objects">Objects</button>${host.overviewSlot ? '<button type="button" class="tw-btn" data-act="datamap" aria-pressed="false">Data map</button>' : ''}<button type="button" class="tw-btn" data-act="pause" aria-pressed="false">Pause motion</button></div></div>
      <div class="tw-hint">Drag to orbit · scroll or pinch to zoom · click an object to open it</div>
      <aside class="tw-objects" id="tw-objects" hidden aria-label="Every object in the world"><div class="tw-dh"><h2>Objects</h2><button type="button" class="tw-btn" data-act="objects-close">Close</button></div><div class="tw-db tw-objects-body"></div></aside>
      <aside class="tw-drawer" hidden aria-label="Data view" aria-live="polite"><div class="tw-dh"><button type="button" class="tw-btn" data-act="back">‹ Back</button><button type="button" class="tw-btn" data-act="overview">Overview</button><h2 class="tw-dtitle">Data view</h2><button type="button" class="tw-btn tw-sheet-toggle" data-act="sheet" aria-expanded="true">Collapse</button></div>
        <div class="tw-db"><div class="tw-own"></div><div class="tw-host"></div></div></aside>
      <div class="tw-bar" hidden><button type="button" class="tw-step" data-act="prev" aria-label="Previous update (world)">‹</button><input type="range" min="0" max="0" step="1" value="0" aria-label="Replay the world at an earlier moment"><button type="button" class="tw-step" data-act="next" aria-label="Next update (world)">›</button><button type="button" class="tw-step" data-act="live" aria-pressed="true" style="padding:0 12px">Live</button><span class="tw-asof" aria-live="polite"></span></div>
    </div></div>`;
  const $ = (sel) => root.querySelector(sel);
  const stage = $('.tw-stage'); const labelsEl = $('.tw-labels'); const tipEl = $('.tw-tip'); const drawer = $('.tw-drawer'); const objectsEl = $('.tw-objects'); const bar = $('.tw-bar');
  const own = $('.tw-own'); const hostSlot = $('.tw-host'); const range = bar.querySelector('input'); const asof = bar.querySelector('.tw-asof');
  const twRoot = $('.tw');

  function syncTokens() { TOKENS.forEach((t) => twRoot.style.setProperty(`--tw-${t}`, cv(t))); twRoot.style.setProperty('--tw-body', host.cssVar('body') || ''); twRoot.style.setProperty('--tw-display', host.cssVar('display') || ''); twRoot.style.setProperty('--tw-mono', host.cssVar('mono') || ''); }
  syncTokens();

  // ---- Three.js scene ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.prepend(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D release world. Every object in it is listed under Objects.');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  geo.addCrystalLights(scene, THREE);
  const sun = new THREE.Group(); (geo.signature || geo.CRYSTAL_VARIANTS.signature)(sun, THREE);
  sun.userData = { kind: 'sun', id: 'sun' }; sun.children.forEach((m) => { m.userData = sun.userData; });
  scene.add(sun);
  const env = geo.buildEnvironment(host.environment || 'underwater', scene, THREE, { palette: { waterMid: col('waterMid'), sand: col('sand') }, keepClear: 80 });
  if (scene.fog && scene.fog.density) scene.fog.density = Math.min(scene.fog.density, 0.009);   // a wider world needs thinner water
  const clock = new THREE.Clock();
  const cam = { theta: 0.6, phi: 0.78, dist: 30, target: new THREE.Vector3(), want: { dist: 30, target: new THREE.Vector3() }, shiftX: 0, shiftY: 0, wantShiftX: 0, wantShiftY: 0 };
  let districtAngles = []; let objs = {}; let rings = []; let rivers = []; let linkLines = []; const pickables = []; let graphSig = ''; let outerR = 20;
  let drag = null; let pinch = null; const pointers = new Map(); let disposed = false; let raf = 0; let lastPublish = 0; let selRing = null;
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); const v3 = new THREE.Vector3();
  const disposeObj = (o) => o.traverse((x) => { x.geometry?.dispose?.(); (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => m?.dispose?.()); });

  const hrefTo = (...parts) => {
    const t = parts[0] === 'round' ? twTok('round', parts[1], parts[2]) : twTok(...parts);
    const i = S.path.indexOf(t);
    return host.hashFor(i >= 0 ? S.path.slice(0, i + 1) : [...S.path, t]);
  };
  const openTok = (id) => { if (!id) { host.navigate(host.hashFor([])); return; } const t = twSplit(id); host.navigate(hrefTo(...t)); };
  const back = () => host.navigate(host.hashFor(S.path.slice(0, -1)));

  function layoutRadii(model) {
    const radii = []; let prev = 0;
    model.districts.forEach((d, i) => { const r = Math.max(i === 0 ? 6.5 : prev + 5, d.total * 0.9, 5); radii.push(r); prev = r; });
    return radii;
  }

  function build(model) {
    Object.values(objs).forEach((o) => { if (o.group) { scene.remove(o.group); disposeObj(o.group); } });
    rings.forEach((r) => { scene.remove(r); disposeObj(r); }); rivers.forEach((r) => { scene.remove(r); disposeObj(r); }); linkLines.forEach((l) => { scene.remove(l.line); disposeObj(l.line); });
    objs = {}; rings = []; rivers = []; linkLines = []; pickables.length = 0; sun.children.forEach((m) => pickables.push(m));
    const radii = layoutRadii(model); outerR = (radii[radii.length - 1] || 7) + 3.2;
    const toneOfDistrict = ['teal', 'gold', 'muted', 'human'];
    model.districts.forEach((d, i) => {
      const r = radii[i]; const c = col(toneOfDistrict[i] || 'muted');
      const g = new THREE.Group();
      const line = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 160), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 })); line.rotation.x = Math.PI / 2; g.add(line);
      const band = new THREE.Mesh(new THREE.RingGeometry(r - 1.5, r + 1.5, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })); band.rotation.x = -Math.PI / 2; g.add(band);
      const hit = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 6, 96), new THREE.MeshBasicMaterial({ visible: false })); hit.rotation.x = Math.PI / 2; hit.userData = { kind: 'district', id: d.id, district: d }; g.add(hit); pickables.push(hit);
      g.position.y = -1.0; scene.add(g); rings.push(g); g.userData.radius = r; g.userData.districtId = d.id;
    });
    // A district's name pill sits where its ring has the widest gap between crystals, so it never covers one.
    districtAngles = model.districts.map((d, i) => {
      const n = Math.max(1, d.members.length); const ang = d.members.map((_, j) => (j / n) * Math.PI * 2 + i * 0.55);
      let best = 0; let bs = -1;
      for (let k = 0; k < 48; k += 1) { const a = (k / 48) * Math.PI * 2; const m = ang.length ? Math.min(...ang.map((x) => { const dd = Math.abs(((a - x + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI); return dd; })) : 9; if (m > bs + 1e-6) { bs = m; best = a; } }
      return best;
    });
    const posByTok = {};
    model.nodes.forEach((node) => {
      const di = Math.max(0, model.districts.findIndex((d) => d.key === node.district)); const d = model.districts[di];
      const j = d.members.indexOf(node.id); const n = Math.max(1, d.members.length);
      const a = (j / n) * Math.PI * 2 + di * 0.55; const R = radii[di];
      const group = new THREE.Group(); group.position.set(Math.cos(a) * R, Math.sin(a * 2) * 0.4, Math.sin(a) * R);
      const size = 0.55 + node.weight * 0.7; const tc = col(node.tone);
      const gem = geo.buildGemMesh(THREE, { color: tc, size, metalness: 0.15, roughness: 0.45 });
      gem.material.emissive = tc.clone(); gem.material.emissiveIntensity = 0.45; gem.material.transparent = true;
      gem.userData = { kind: 'feature', id: node.id, node }; pickables.push(gem); group.add(gem);
      gem.add(new THREE.LineSegments(new THREE.EdgesGeometry(gem.geometry), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 })));
      const hitF = new THREE.Mesh(new THREE.SphereGeometry(size + 0.5, 8, 8), new THREE.MeshBasicMaterial({ visible: false })); hitF.userData = gem.userData; group.add(hitF); pickables.push(hitF);
      const ringR = size + 0.6;
      const track = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.025, 6, 64), new THREE.MeshBasicMaterial({ color: col('line'), transparent: true, opacity: 0.9 })); track.rotation.x = Math.PI / 2; group.add(track);
      if (node.progress != null && node.progress > 0) { const arc = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.055, 8, 96, Math.PI * 2 * Math.min(1, node.progress)), new THREE.MeshBasicMaterial({ color: 0xC4843A, transparent: true })); arc.rotation.x = Math.PI / 2; group.add(arc); }
      if (node.changed) { const ping = new THREE.Mesh(new THREE.TorusGeometry(ringR + 0.55, 0.04, 6, 64), new THREE.MeshBasicMaterial({ color: col('gold'), transparent: true, opacity: 0.95 })); ping.rotation.x = Math.PI / 2; ping.userData.ping = true; group.add(ping); }
      const sats = new THREE.Group(); const satMeshes = {};
      const bugs = node.sats.filter((s) => s.kind === 'bug' || s.kind === 'count'); const rounds = node.sats.filter((s) => s.kind === 'round'); const agents = node.sats.filter((s) => s.kind === 'agent');
      const mkSat = (s, mesh, pos) => {
        mesh.position.copy(pos); mesh.userData = { kind: s.kind, id: s.id, sat: s, node };
        if (mesh.material) { mesh.material.transparent = true; }
        if (s.pending) { mesh.material.opacity = 0.35; mesh.material.depthWrite = false; mesh.userData.ghost = true; const dash = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineDashedMaterial({ color: 0xC4843A, dashSize: 0.03, gapSize: 0.02, transparent: true })); dash.computeLineDistances(); mesh.add(dash); }
        const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.userData = mesh.userData; mesh.add(hit); pickables.push(hit);
        pickables.push(mesh); sats.add(mesh); satMeshes[s.id] = satMeshes[s.id] || mesh;
      };
      const stdMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c.clone(), emissiveIntensity: 0.4, flatShading: true, roughness: 0.45, transparent: true });
      bugs.forEach((s, k) => { const sc = col(s.tone); const m = geo.buildGemMesh(THREE, { color: sc, size: 0.17, metalness: 0.1, roughness: 0.45 }); m.material.emissive = sc.clone(); m.material.emissiveIntensity = 0.4; const ang = (k / Math.max(1, bugs.length)) * Math.PI * 2; const rr = ringR + 0.9 + (k % 3) * 0.3; mkSat(s, m, new THREE.Vector3(Math.cos(ang) * rr, ((k % 5) - 2) * 0.16, Math.sin(ang) * rr)); });
      rounds.forEach((s, k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), stdMat(col(s.tone))); const ang = (k / Math.max(1, rounds.length)) * Math.PI * 2 + 0.4; m.rotation.set(0.4, 0.6, 0); mkSat(s, m, new THREE.Vector3(Math.cos(ang) * ringR, 0, Math.sin(ang) * ringR)); });
      agents.forEach((s, k) => { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22, 0), stdMat(col(s.tone))); const ang = (k / Math.max(1, agents.length)) * Math.PI * 2 + 1.2; mkSat(s, m, new THREE.Vector3(Math.cos(ang) * (ringR * 0.9), 1.15 + (k % 2) * 0.25, Math.sin(ang) * (ringR * 0.9))); });
      group.add(sats); scene.add(group);
      objs[node.id] = { group, gem, sats, node, satMeshes, baseY: group.position.y, ringR };
      Object.keys(satMeshes).forEach((id) => { objs[id] = { satOf: node.id, mesh: satMeshes[id], sat: node.sats.find((s) => s.id === id) }; });
      posByTok[node.id] = group;
      if (node.active) { const rv = geo.buildRiverParticles(THREE, { from: new THREE.Vector3(0, 0, 0), to: group.position, color: 0xE8FBFF, count: 70, curveLift: 0.9 }); rv.material.size = 0.16; scene.add(rv); rivers.push(rv); }
    });
    env.setPalette({ waterMid: col('waterMid'), sand: col('sand') });
    buildLabels(model); applySelection(true);
  }

  function buildLabels(model) {
    const m = model;
    const score = `${m.root.score}${m.hasScopes ? ' (this release)' : ''}`;
    labelsEl.innerHTML = `<div class="tw-wl tw-wl-sun" data-id="sun"><b>${esc(m.root.label)}</b>${esc(m.root.sub)} · ${esc(score)}</div>`
      + m.districts.map((d) => `<a class="tw-wl tw-wl-dist" data-id="${esc(d.id)}" data-district="${esc(d.key)}" href="${esc(hrefTo('scope', d.key))}" style="--c:${toneVar(['teal', 'gold', 'muted', 'human'][m.districts.indexOf(d)] || 'muted')}">${esc(d.label)} <span class="tw-muted">${d.total ? `${d.passed}/${d.total} passed` : 'none'}</span></a>`).join('')
      + m.nodes.map((n) => `<div class="tw-wl" data-id="${esc(n.id)}"><b><span class="tw-st" style="background:${toneVar(n.tone)}"></span>${esc(n.label)}</b><span class="tw-sub">${esc(n.statusLabel)} · ${n.pct != null ? `${esc(n.scoreText)} · ${n.pct}%` : esc(n.scoreText)}</span>${n.changed ? `<span class="tw-sub" style="color:${toneVar('gold')}">${n.changed.absent ? 'not tracked yet then' : 'changed since'}</span>` : ''}</div>`).join('')
      + m.nodes.flatMap((n) => n.sats.filter((s) => s.kind !== 'count').map((s) => `<div class="tw-wl tw-wl-sat" data-id="${esc(s.id)}" data-sat="1" style="display:none"><span class="tw-st" style="background:${toneVar(s.tone)}"></span>${esc(s.short)}</div>`)).join('');
  }

  // ---- selection, highlight, camera ----
  function applySelection(snapCam) {
    const rel = S.rel; const sel = S.sel; const hasSel = rel.active;
    const featureOf = sel && sel.feature ? twTok('feature', sel.feature) : null;
    Object.entries(objs).forEach(([id, o]) => {
      if (o.group) {
        const on = !hasSel || rel.ids.has(id);
        o.group.traverse((x) => { if (x.material && !x.material.userData?.keep && x.userData?.kind !== 'district') { const base = x.userData?.ghost ? 0.35 : 1; const sat = x.userData?.kind && x.userData.kind !== 'feature' && x.userData.id; const satOn = !hasSel || (sat ? rel.ids.has(x.userData.id) || x.userData.id === sel?.id : on); x.material.opacity = (sat ? (satOn ? 1 : 0.14) : (on ? 1 : 0.18)) * base; } });
        o.gem.scale.setScalar(sel && sel.id === id ? 1.3 : on && hasSel ? 1.12 : 1);
      } else if (o.mesh) {
        const isSel = sel && sel.id === id; const on = !hasSel || rel.ids.has(id) || isSel;
        o.mesh.scale.setScalar(isSel ? 2.1 : on && hasSel ? 1.5 : 1);
      }
    });
    rings.forEach((r) => { const on = !hasSel || rel.ids.has(r.userData.districtId); r.traverse((x) => { if (x.material && x.userData?.kind !== 'district') x.material.opacity = (x.geometry.type === 'RingGeometry' ? 0.1 : 0.75) * (on ? 1 : 0.3); }); });
    // relation lines
    linkLines.forEach((l) => { scene.remove(l.line); disposeObj(l.line); }); linkLines = [];
    rel.links.forEach(([a, b]) => {
      const pa = objs[a]?.group || objs[a]?.mesh; const pb = objs[b]?.group || objs[b]?.mesh; if (!pa || !pb) return;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col('gold'), transparent: true, opacity: 0.9 }));
      line.frustumCulled = false; scene.add(line); linkLines.push({ line, pa, pb });
    });
    // camera
    const f = featureOf && objs[featureOf];
    const R = outerR; const half = Math.tan((camera.fov * Math.PI) / 360);
    if (sel && sel.kind === 'scope') {
      const idx = S.model.districts.findIndex((d) => d.id === sel.id); const r = (layoutRadii(S.model)[idx] || 8) + 2.4;
      cam.want.target.set(0, -0.4, 0); cam.want.dist = fitDist(r);
    } else if (f) {
      cam.want.target.copy(f.group.position); cam.want.dist = sel.kind === 'feature' ? 14 : 12;
    } else {
      cam.want.target.set(0, -0.4, 0); cam.want.dist = fitDist(R);
    }
    layoutOffsets();
    if (reduce || snapCam === 'cut') { cam.target.copy(cam.want.target); cam.dist = cam.want.dist; cam.shiftX = cam.wantShiftX; cam.shiftY = cam.wantShiftY; }
    updateLabelClasses();
  }
  // Distance at which a disc of radius R (seen from the camera's tilt) fits the free part of the stage: the part not
  // covered by the legend or the data view, and between the top chips and the time bar. Found by projecting the ring.
  function fitDist(R) {
    const w = stage.clientWidth || 800; const h = stage.clientHeight || 600;
    layoutOffsets();
    const freeW = Math.max(160, w - Math.abs(cam.wantShiftX) * 2 - (narrowStage() ? 0 : 24)); const freeH = Math.max(200, h - (narrowStage() ? 190 : 150));
    const limX = Math.min(0.97, freeW / w); const limY = Math.min(0.97, freeH / h);
    const tmp = new THREE.PerspectiveCamera(camera.fov, camera.aspect || w / h, 0.1, 400); const tg = new THREE.Vector3(0, -0.4, 0); const p = new THREE.Vector3();
    for (let d = 14; d < 110; d += 1.5) {
      tmp.position.set(tg.x + d * Math.sin(cam.phi) * Math.cos(cam.theta), tg.y + d * Math.cos(cam.phi), tg.z + d * Math.sin(cam.phi) * Math.sin(cam.theta)); tmp.lookAt(tg); tmp.updateMatrixWorld(); tmp.updateProjectionMatrix();
      let ok = true;
      for (let k = 0; k < 32 && ok; k += 1) { const a = (k / 32) * Math.PI * 2; p.set(Math.cos(a) * R, 0.6, Math.sin(a) * R).project(tmp); if (Math.abs(p.x) > limX || Math.abs(p.y) > limY) ok = false; }
      if (ok) return d;
    }
    return 110;
  }
  const narrowStage = () => stage.clientWidth < 760;
  function layoutOffsets() {
    const open = !drawer.hidden; const narrow = stage.clientWidth < 760;
    const leg = root.querySelector('.tw-legend'); const legOpen = leg && leg.open && !narrow;
    const rightInset = open && !narrow ? drawer.offsetWidth + 10 : 0; const leftInset = Math.max(legOpen ? leg.offsetWidth + 10 : 0, !objectsEl.hidden && !narrow ? objectsEl.offsetWidth + 10 : 0);
    cam.wantShiftX = (rightInset - leftInset) / 2;
    cam.wantShiftY = open && narrow && !(drawer.dataset.collapsed === 'true') ? drawer.offsetHeight * 0.5 : 0;
  }
  function updateLabelClasses() {
    const rel = S.rel; const sel = S.sel;
    labelsEl.querySelectorAll('.tw-wl').forEach((el) => {
      const id = el.dataset.id; const isSun = id === 'sun';
      const on = !rel.active || rel.ids.has(id) || isSun;
      el.classList.toggle('tw-dim', rel.active && !on);
      el.classList.toggle('tw-sel', !!sel && sel.id === id);
      el.classList.toggle('tw-rel', rel.active && rel.ids.has(id) && !(sel && sel.id === id));
      el.classList.toggle('tw-kbd', S.kbd >= 0 && kbdOrder()[S.kbd] === id);
      if (el.dataset.district) el.setAttribute('href', hrefTo('scope', el.dataset.district));
    });
  }
  const kbdOrder = () => (S.model ? [...S.model.districts.map((d) => d.id), ...S.model.nodes.flatMap((n) => [n.id, ...n.sats.filter((s) => s.kind !== 'count').map((s) => s.id)])] : []);

  function placeCamera(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-(dt || 0.016) * 5);   // time-based
    cam.target.lerp(cam.want.target, k); cam.dist += (cam.want.dist - cam.dist) * k; cam.shiftX += (cam.wantShiftX - cam.shiftX) * k; cam.shiftY += (cam.wantShiftY - cam.shiftY) * k;
    camera.position.set(cam.target.x + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta), cam.target.y + cam.dist * Math.cos(cam.phi), cam.target.z + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta));
    camera.lookAt(cam.target);
    const w = stage.clientWidth; const h = stage.clientHeight;
    if (Math.abs(cam.shiftX) > 0.5 || Math.abs(cam.shiftY) > 0.5) camera.setViewOffset(w, h, cam.shiftX, cam.shiftY, w, h); else camera.clearViewOffset();
  }

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const rdt = clock.getDelta(); const dt = Math.min(rdt, 0.05); const t = clock.elapsedTime; const still = reduce || paused;
    if (!still) {
      sun.rotation.y += dt * 0.18; sun.position.y = Math.sin(t * 0.5) * 0.12;
      Object.values(objs).forEach((o, i) => { if (!o.group) return; o.gem.rotation.y += dt * 0.5; o.sats.rotation.y += dt * (0.22 + (i % 3) * 0.04); o.group.position.y = o.baseY + Math.sin(t * 0.8 + i * 1.3) * 0.15; o.group.traverse((x) => { if (x.userData?.ping) x.scale.setScalar(1 + 0.08 * Math.sin(t * 3)); }); });
      env.update(t, dt, camera); rivers.forEach((r) => geo.advanceRiverParticles(r, dt));
    }
    placeCamera(Math.min(rdt, 0.4));   // the camera follows wall-clock time, so a slow device settles as fast as a quick one
    linkLines.forEach((l) => { const pos = l.line.geometry.getAttribute('position'); l.pa.getWorldPosition(v3); pos.setXYZ(0, v3.x, v3.y, v3.z); l.pb.getWorldPosition(v3); pos.setXYZ(1, v3.x, v3.y, v3.z); pos.needsUpdate = true; });
    renderer.render(scene, camera);
    positionLabels(t);
  }

  function positionLabels(t) {
    const w = stage.clientWidth; const h = stage.clientHeight; const narrow = w < 760; const rel = S.rel; const sel = S.sel;
    const published = []; const items = []; const radii = S.model ? layoutRadii(S.model) : [];
    labelsEl.querySelectorAll('.tw-wl').forEach((el) => {
      const id = el.dataset.id; const isSun = id === 'sun'; const isDist = !!el.dataset.district; const isSat = !!el.dataset.sat;
      let pos = null;
      if (isSun) pos = sun.position;
      else if (isDist) { const i = S.model.districts.findIndex((d) => d.id === id); const r = radii[i] || 6; const a = districtAngles[i] ?? 0; v3.set(Math.cos(a) * r, -1.0, Math.sin(a) * r); pos = v3; }
      else if (isSat) { const o = objs[id]; if (o?.mesh) { o.mesh.getWorldPosition(v3); pos = v3; } }
      else { const o = objs[id]; pos = o?.group?.position || null; if (o?.group) { o.group.getWorldPosition(v3); pos = v3; } }
      if (!pos) { el.style.display = 'none'; return; }
      const p = geo.projectToScreen(THREE, pos.clone(), camera, w, h);
      if (p && isDist) { p.y = Math.min(Math.max(p.y, 150), h - 84); p.x = Math.min(Math.max(p.x, 90), w - 90); }
      let hide = !p || p.x < -60 || p.x > w + 60 || p.y < -30 || p.y > h + 30;
      if (isSat) hide = hide || !(rel.active && (rel.ids.has(id) || (sel && sel.id === id)));
      // Phone: crowded labels collapse into the Objects list; the sun, the districts, the selection and what is related to it stay.
      if (narrow && !isSun && !isDist && !isSat) hide = hide || (rel.active ? !(rel.ids.has(id) || (sel && sel.id === id)) : !(S.model && S.model.nodes.length <= 4));
      if (!isSat && !isSun && !isDist && !p) hide = true;
      el.style.display = hide ? 'none' : '';
      if (!hide) {
        const isSel = !!sel && sel.id === id;
        items.push({ el, x: p.x, y: p.y + (isDist ? 0 : isSun ? -58 : isSel ? 40 : 16), isDist, isSat, prio: isDist ? 0 : isSel ? 1 : isSun ? 2 : isSat ? 4 : 3 });
        el.style.zIndex = isSel ? 3 : isDist ? 1 : 2;
      }
      if (!isSun && !isDist && p) published.push({ id, kind: isSat ? (objs[id]?.sat?.kind || 'sat') : 'feature', x: Math.round(p.x), y: Math.round(p.y), visible: !hide });
    });
    // De-overlap: district pills stay where they are; every other label that would cover an earlier one is moved below it.
    const placed = [];
    items.sort((a, b) => a.prio - b.prio).forEach((it) => {
      const bw = it.el._w || (it.el._w = it.el.offsetWidth || 120); const bh = it.el._h || (it.el._h = it.el.offsetHeight || 34);
      let top = it.y; const left = it.x - bw / 2; const vOff = it.isDist ? -bh / 2 : it.isSat ? 8 : 14;
      if (!it.isDist) {
        for (let k = 0; k < 8; k += 1) {
          const hit = placed.find((r) => left < r.x1 && left + bw > r.x0 && top + vOff < r.y1 && top + vOff + bh > r.y0);
          if (!hit) break;
          const nt = hit.y1 - vOff + 2; if (nt - it.y > 44) break; top = nt;   // never drift far from its own object
        }
      }
      placed.push({ x0: left, x1: left + bw, y0: top + vOff, y1: top + vOff + bh });
      it.el.style.left = `${it.x}px`; it.el.style.top = `${top}px`;
    });
    S.screenPts = published;
    if (t - lastPublish > 0.25) publish(published, t);
    lastPublish = t > lastPublish + 0.25 ? t : lastPublish;
  }
  function publish(published) {
    stage.dataset.crystals = JSON.stringify(published);
    const m = S.model;
    stage.dataset.world = JSON.stringify({
      environment: host.environment || 'underwater', nodes: m ? m.nodes.length : 0,
      satellites: pickables.filter((p) => ['bug', 'count', 'round', 'agent'].includes(p.userData?.kind) && p.geometry?.type !== 'SphereGeometry').length,
      bugs: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'bug' || s.kind === 'count').length, 0) : 0,
      rounds: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'round').length, 0) : 0,
      agents: m ? m.nodes.reduce((n, x) => n + x.sats.filter((s) => s.kind === 'agent').length, 0) : 0,
      rivers: rivers.length, districts: m ? m.districts.map((d) => ({ key: d.key, total: d.total })) : [],
      focusId: S.sel?.feature ? S.sel.feature : null, cameraMode: S.sel && S.sel.kind === 'scope' ? 'district' : S.sel?.feature ? 'object' : 'overview', selected: S.sel?.id || null, related: [...S.rel.ids], mode: S.at == null ? 'current' : 'historic', at: S.at,
      changed: m ? m.nodes.filter((n) => n.changed).map((n) => n.key) : [], paused, reducedMotion: reduce,
    });
  }

  // ---- picking and gestures ----
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(pickables, false);
    const order = { bug: 0, count: 0, round: 0, agent: 0, feature: 1, sun: 2, district: 3 };
    const hit = hits.filter((h) => h.object.visible).sort((a, b) => ((order[a.object.userData.kind] ?? 4) - (order[b.object.userData.kind] ?? 4)) || a.distance - b.distance)[0];
    let direct = hit ? hit.object.userData : null;
    const isSat = !!direct && !['district', 'sun', 'feature'].includes(direct.kind);
    // A fingertip is far wider than a satellite: while nothing is open, a touch on or near a crystal means the crystal.
    if (isSat && e.pointerType === 'touch' && !(S.rel.active && S.rel.ids.has(direct.id))) direct = null;
    else if (isSat) return direct;   // a small satellite under the pointer wins over its crystal
    // Crystals are small and the camera moves: the feature crystal whose centre is nearest the pointer wins over a wider
    // hit area, a ring or the sun. A finger gets a wider reach than a mouse.
    const px = e.clientX - r.left; const py = e.clientY - r.top; const reach = e.pointerType === 'touch' ? 34 : 14;
    let best = null; let bd = reach; const dOf = (id) => { const q = S.screenPts.find((z) => z.id === id); return q ? Math.hypot(q.x - px, q.y - py) : Infinity; };
    S.screenPts.forEach((q) => { if (q.kind !== 'feature') return; const d = Math.hypot(q.x - px, q.y - py); if (d < bd) { bd = d; best = q; } });
    if (best && objs[best.id]?.node && (!direct || direct.kind !== 'feature' || best.id === direct.id || bd + 6 < dOf(direct.id))) return objs[best.id].gem.userData;
    if (direct && direct.kind === 'feature') return direct;
    // A district name pill is part of the scene, not a layer above it: it takes a click only where no crystal does.
    const pill = [...labelsEl.querySelectorAll('.tw-wl-dist')].find((el) => { if (el.style.display === 'none') return false; const q = el.getBoundingClientRect(); return e.clientX >= q.left && e.clientX <= q.right && e.clientY >= q.top && e.clientY <= q.bottom; });
    if (pill) { const d = S.model.districts.find((x) => x.id === pill.dataset.id); if (d) return { kind: 'district', id: d.id, district: d }; }
    return direct;
  }
  canvas.twPick = (cx, cy, detail) => {   // test hook: what is under this page point
    const u = pick({ clientX: cx, clientY: cy });
    if (!detail) return u ? (u.id || u.kind) : null;
    const f = Object.values(objs).find((o) => o.group);
    const fp = f ? f.group.getWorldPosition(new THREE.Vector3()).project(camera) : null;
    return { pick: u ? (u.id || u.kind) : null, n: pickables.length, ndc: [mouse.x, mouse.y], ray: ray.ray.direction.toArray(), org: ray.ray.origin.toArray(), cam: camera.position.toArray(), firstFeatureNdc: fp && fp.toArray(), rect: canvas.getBoundingClientRect().toJSON(), size: [canvas.width, canvas.height] };
  };
  const dist2 = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  function onDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    if (pointers.size === 2) { pinch = { d: dist2(), dist: cam.want.dist }; drag = null; } else drag = { x: e.clientX, y: e.clientY, moved: 0 };
  }
  function tipFor(u) {
    if (u.kind === 'feature') return `<b>${esc(u.node.label)}</b><br>${esc(u.node.statusLabel)} · ${esc(u.node.scoreText)}<br><span class="tw-muted">${u.node.counts.bugs} bug(s), ${u.node.counts.rounds} round(s) · click to open</span>`;
    if (u.kind === 'district') return `<b>${esc(u.district.label)}</b><br><span class="tw-muted">${u.district.total} feature(s) · click to open</span>`;
    if (u.sat) return `<b>${esc(u.sat.label)}</b><br><span class="tw-muted">${esc(u.node.label)}${u.sat.pending ? ' · fix pending approval (re-test)' : ''} · click to open</span>`;
    return '';
  }
  function onMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) { cam.want.dist = Math.max(3, Math.min(70, pinch.dist * (pinch.d / Math.max(1, dist2())))); return; }
    if (drag) { cam.theta += (e.clientX - drag.x) * 0.006; cam.phi = Math.max(0.3, Math.min(1.45, cam.phi - (e.clientY - drag.y) * 0.004)); drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; return; }
    const u = pick(e);
    canvas.classList.toggle('tw-pointing', !!u && u.kind !== 'sun');
    if (!u || u.kind === 'sun') { tipEl.style.display = 'none'; return; }
    const r = stage.getBoundingClientRect();
    tipEl.innerHTML = tipFor(u); tipEl.style.display = 'block'; tipEl.style.left = `${Math.max(0, Math.min(e.clientX - r.left + 14, r.width - 270))}px`; tipEl.style.top = `${Math.max(0, e.clientY - r.top + 14)}px`;
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const wasDrag = drag && drag.moved > 6; drag = null; if (wasDrag) return;
    const u = pick(e); stage.dataset.lastPick = u ? (u.id || u.kind) : 'none'; if (!u) return;
    tipEl.style.display = 'none';
    if (u.kind === 'sun') openTok(null); else openTok(u.kind === 'count' ? u.node.id : u.id);
  }
  const onLeave = () => { tipEl.style.display = 'none'; };
  const onWheel = (e) => { e.preventDefault(); cam.want.dist = Math.max(3, Math.min(70, cam.want.dist * (1 + Math.sign(e.deltaY) * 0.1))); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Keyboard: arrows move a cursor over objects (districts, features, then their satellites), Enter opens, Escape goes back.
  stage.addEventListener('keydown', (e) => {
    if (e.target !== stage) { if (e.key === 'Escape' && S.path.length) { e.preventDefault(); back(); } return; }
    const order = kbdOrder();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); S.kbd = (S.kbd + 1) % Math.max(1, order.length); announceKbd(order); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); S.kbd = (S.kbd - 1 + order.length) % Math.max(1, order.length); announceKbd(order); }
    else if (e.key === 'Enter' && S.kbd >= 0) { e.preventDefault(); openTok(order[S.kbd]); }
    else if (e.key === 'Escape' && S.path.length) { e.preventDefault(); back(); }
    else if (e.key === '+' || e.key === '=') cam.want.dist = Math.max(3, cam.want.dist * 0.85);
    else if (e.key === '-') cam.want.dist = Math.min(70, cam.want.dist * 1.15);
  });
  function announceKbd(order) {
    const id = order[S.kbd]; updateLabelClasses();
    const o = S.model.nodes.find((n) => n.id === id) || S.model.nodes.flatMap((n) => n.sats).find((s) => s.id === id); const d = S.model.districts.find((x) => x.id === id);
    stage.setAttribute('aria-description', `Cursor on ${d ? d.label : o?.label || id}. Press Enter to open.`);
    tipEl.style.display = 'block'; tipEl.style.left = '12px'; tipEl.style.top = '110px'; tipEl.innerHTML = `<b>${esc(d ? d.label : (o?.label || id))}</b><br><span class="tw-muted">Enter to open</span>`;
  }
  stage.addEventListener('blur', () => { S.kbd = -1; tipEl.style.display = 'none'; updateLabelClasses(); });

  // ---- chrome: buttons, slider ----
  const jump = (dir) => {
    const hist = S.hist; if (!hist) return; const last = hist.points.length - 1; const cur = S.at == null ? last : S.at;
    const idx = updateMarkIndexes(hist, host.pointIndexAt); const tgt = dir < 0 ? [...idx].reverse().find((x) => x < cur) : idx.find((x) => x > cur);
    const to = tgt == null ? (dir < 0 ? 0 : last) : tgt; setAt(to >= last ? null : to);
  };
  function setAt(i) { S.at = i == null ? null : i; if (S.at != null) S.lastHistoric = S.at; render(); }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    const act = b.dataset.act; const st = b.dataset.state;
    if (st === 'current') setAt(null);
    else if (st === 'historic') { if (!S.hist) return; const i = S.lastHistoric ?? defaultHistoricIndex(S.hist, host.pointIndexAt); setAt(i); }
    else if (act === 'pause') { paused = !paused; b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? 'Resume motion' : 'Pause motion'; publish(S.screenPts); }
    else if (act === 'objects') { objectsEl.hidden = !objectsEl.hidden; b.setAttribute('aria-expanded', String(!objectsEl.hidden)); renderDrawer(); }
    else if (act === 'objects-close') { objectsEl.hidden = true; root.querySelector('[data-act="objects"]').setAttribute('aria-expanded', 'false'); renderDrawer(); }
    else if (act === 'back') { if (!S.path.length) { S.hostOverview = false; render(); } else back(); }
    else if (act === 'datamap') { S.hostOverview = !S.hostOverview; render(); }
    else if (act === 'overview') host.navigate(host.hashFor([]));
    else if (act === 'sheet') { const c = drawer.dataset.collapsed === 'true'; drawer.dataset.collapsed = String(!c); b.setAttribute('aria-expanded', String(c)); b.textContent = c ? 'Collapse' : 'Expand'; layoutOffsets(); }
    else if (act === 'prev') jump(-1); else if (act === 'next') jump(1); else if (act === 'live') setAt(null);
  });
  range.addEventListener('input', () => { const last = S.hist.points.length - 1; setAt(Number(range.value) >= last ? null : Number(range.value)); });
  objectsEl.addEventListener('click', (e) => { if (e.target.closest('a')) { objectsEl.hidden = true; root.querySelector('[data-act="objects"]').setAttribute('aria-expanded', 'false'); } });

  // ---- render everything from state ----
  const cache = { legend: '', chips: '', objects: '', own: '', title: '' };
  function ctxFor() {
    return { snap: S.snap, hist: S.hist, at: S.at, model: S.model, href: hrefTo, statusText: host.statusText, fmtT: host.fmtT, pointIndexAt: host.pointIndexAt, now: S.now };
  }
  function renderDrawer() {
    const sel = S.sel; const pathOpen = S.path.length > 0 || S.hostOverview;
    const html = sel && ['feature', 'bug', 'agent', 'scope'].includes(sel.kind) ? viewHtml(ctxFor(), sel, S.rel) : null;
    const hasHost = pathOpen && !html;      // a layer the host draws (stat, status updates, a round ...)
    const open = pathOpen && !(objectsEl.hidden === false && stage.clientWidth < 760);
    drawer.hidden = !open;
    if (html !== null && html !== cache.own) { const sc = drawer.querySelector('.tw-db').scrollTop; own.innerHTML = html; cache.own = html; drawer.querySelector('.tw-db').scrollTop = sc; }
    if (html === null && cache.own !== '') { own.innerHTML = ''; cache.own = ''; }
    const title = !S.path.length && S.hostOverview ? 'Data map' : sel && sel.kind === 'round' ? 'Test round' : sel && sel.kind === 'missing' ? 'Not found' : 'Data view';
    if (title !== cache.title) { drawer.querySelector('.tw-dtitle').textContent = title; cache.title = title; }
    drawer.querySelector('[data-act="overview"]').hidden = S.path.length < 2;
    const dm = root.querySelector('[data-act="datamap"]'); if (dm) dm.setAttribute('aria-pressed', String(S.hostOverview && !S.path.length));
    root.dataset.hostLayer = hasHost ? '1' : '0';
    layoutOffsets();
  }
  function render() {
    if (!S.snap) return;
    const last = S.hist ? S.hist.points.length - 1 : 0;
    if (S.hist && S.at != null && S.at >= last) S.at = null;
    S.model = buildWorldModel({ snap: S.snap, hist: S.hist, at: S.at, bind: host.bind, statusText: host.statusText, fmtT: host.fmtT });
    S.sel = selectionOf(S.path, S.snap);
    if (S.sel && S.sel.kind === 'round') { /* the round's own data view is drawn by the host (Board layer) */ }
    S.rel = relatedOf(S.model, S.snap, S.sel);
    const sig = JSON.stringify(S.model.nodes.map((n) => [n.id, n.tone, n.weight, n.progress, n.active, n.absent, !!n.changed, n.sats.map((s) => [s.id, s.tone, s.pending])])) + JSON.stringify(S.model.districts.map((d) => [d.id, d.total])) + S.model.root.sub;
    if (sig !== graphSig) { graphSig = sig; build(S.model); } else { buildLabelsTextOnly(); applySelection(false); }
    // chrome
    const ctx = ctxFor();
    const leg = legendHtml(S.model); if (leg !== cache.legend) { $('.tw-legend-slot').innerHTML = leg; cache.legend = leg; }
    const chips = headlineHtml(S.snap, hrefTo); if (chips !== cache.chips) { $('.tw-hud .tw-chips').innerHTML = chips; cache.chips = chips; }
    const objs2 = '<div class="tw-chips tw-chips-panel"></div>' + objectsHtml(S.model, hrefTo) + `<!--${S.path.join('/')}-->`; if (objs2 !== cache.objects) { $('.tw-objects-body').innerHTML = objs2; cache.objects = objs2; }
    $('.tw-chips-panel').innerHTML = chips;
    objectsEl.querySelectorAll('a[data-id]').forEach((a) => a.classList.toggle('tw-ol-on', !!S.sel && a.dataset.id === S.sel.id));
    const hasHist = !!S.hist && S.hist.points.length > 1;
    bar.hidden = !hasHist;
    root.querySelector('[data-state="historic"]').disabled = !hasHist;
    root.querySelector('[data-state="historic"]').title = hasHist ? '' : 'No history has been recorded yet';
    root.querySelector('[data-state="current"]').setAttribute('aria-pressed', String(S.at == null));
    root.querySelector('[data-state="historic"]').setAttribute('aria-pressed', String(S.at != null));
    if (hasHist) {
      range.min = 0; range.max = last; range.value = S.at == null ? last : S.at;
      bar.querySelector('[data-act="live"]').setAttribute('aria-pressed', String(S.at == null));
      const pt = S.at != null ? S.hist.points[S.at] : null; const u = pt ? updateAtPoint(S.hist, S.at, host.pointIndexAt) : null;
      asof.innerHTML = pt ? `${esc(host.fmtT(pt.t))} UTC${u ? ` · after ${esc(u.version)}` : ''}` : '<b>Live</b>';
    }
    renderDrawer(); void ctx;
    publish(S.screenPts);   // test aids (data-world) follow every state change at once, not only the next animation frame
    stage.classList.toggle('tw-has-sel', !!S.sel);
    const vk = `${S.path.join('/')}|${S.at}|${S.hostOverview}`;
    if (host.onView && (vk !== S.viewKey || S.snap !== S.viewSnap)) { S.viewKey = vk; S.viewSnap = S.snap; host.onView({ sel: S.sel, at: S.at, path: S.path, overview: S.hostOverview && !S.path.length, slot: hostSlot, owns: !!S.sel && ['feature', 'bug', 'agent', 'scope'].includes(S.sel.kind) }); }
  }
  function buildLabelsTextOnly() { /* labels are rebuilt whenever the graph signature changes; text for unchanged graphs is identical */ }

  const ro = new ResizeObserver(() => {
    const w = stage.clientWidth; const h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); if (S.model) applySelection(false);
  });
  ro.observe(stage);
  const ro2 = new ResizeObserver(() => layoutOffsets()); ro2.observe(drawer);
  root.querySelector('.tw-legend').addEventListener('toggle', () => layoutOffsets());
  frame();

  return {
    hostSlot,
    update({ snap, hist, path, now }) {
      const changedPath = S.path.join('/') !== (path || []).join('/');
      if (changedPath && (path || []).length) S.hostOverview = false;
      const legend = root.querySelector('.tw-legend');
      if (legend && (changedPath || !S.snap)) { const wasOpen = S.path.length === 0; const willOpen = (path || []).length === 0; if (!S.snap) { if (stage.clientWidth < 760) legend.open = false; } else if (wasOpen && !willOpen) legend.open = false; else if (!wasOpen && willOpen && stage.clientWidth >= 760) legend.open = true; }
      S.snap = snap; S.hist = hist || null; S.path = path || []; S.now = now || Date.now();
      if (S.at != null && (!S.hist || S.at >= S.hist.points.length - 1)) S.at = null;
      render();
      if (changedPath) { S.kbd = -1; const b = drawer.querySelector('.tw-db'); if (b) b.scrollTop = 0; }
    },
    setAt, getAt: () => S.at,
    refreshColors() { syncTokens(); graphSig = ''; if (S.snap) render(); },
    setReducedMotion(v) { reduce = !!v; applySelection(true); },
    ownsView: () => !!S.sel && ['feature', 'bug', 'agent', 'scope'].includes(S.sel.kind),
    state: () => ({ nodes: S.model ? S.model.nodes.length : 0, selected: S.sel?.id || null, related: [...S.rel.ids], mode: S.at == null ? 'current' : 'historic', paused, reduce }),
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); ro2.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('wheel', onWheel);
      Object.values(objs).forEach((o) => { if (o.group) disposeObj(o.group); }); rings.forEach(disposeObj); rivers.forEach(disposeObj); disposeObj(sun); try { env.dispose(); } catch { /* environment already gone */ }
      renderer.dispose(); canvas.remove(); root.innerHTML = '';
    },
  };
}
return { DISTRICT_DEFS, twTok, twSplit, toneOfStatus, districtOf, buildWorldModel, selectionOf, relatedOf, updateMarkIndexes, defaultHistoricIndex, worldObjectData, viewHtml, legendHtml, headlineHtml, objectsHtml, WORLD_CSS, createTrackerWorld };
})();
/* world-engine:end */

let TW = null; let curLayer = null;
const worldTokenVar = (t) => (['body', 'display', 'mono'].includes(t) ? `--${t}` : t === 'panel2' ? '--panel-2' : /^s\d$/.test(t) ? `--${t}` : `--${t.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
function worldHostHtml(v) {
  if (v.overview) return `<section><h2>The world is a view — its data map</h2><div class="muted" style="font-size:13px;margin-bottom:6px">Every property the world draws is mapped to a source field. Nothing is drawn without a mapping. Changes marked <b>Needs approval</b> show as translucent ghosts until approved.</div>${dataMapTable(null)}</section>`;
  const sel = v.sel;
  const fobj = sel && sel.kind === 'feature' ? snap.features.find((x) => x.key === sel.feature) : null;
  if (fobj && v.at == null) return `<section><h2>Data map — what this crystal draws, and from where</h2>${dataMapTable(fobj)}</section>${pendingSection(fobj.key)}`;
  if (!v.owns && v.path.length && curLayer) return `<div class="layer">${curLayer.html}</div>`;
  return '';
}
function destroyWorld() { if (TW) { try { TW.dispose(); } catch (e) { console.error(e); } TW = null; } }
function renderWorld(layer) {
  if (!window.THREE) { $('view').innerHTML = '<div class="panel empty" role="alert">The 3D library did not load, so the World cannot be drawn. Switch to Board, which lists every object.</div>'; return; }
  curLayer = layer;
  if (!TW) {
    $('view').innerHTML = '<div id="tw-mount" class="rt-world"></div>';
    try {
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('This browser cannot draw 3D (WebGL is unavailable). Use the Board view, which lists every object.');
      TW = TrackerWorldKit.createTrackerWorld({
        THREE, geo: CrystalGeo, root: $('tw-mount'),
        host: {
          reducedMotion: reduceMotion, environment: 'underwater', overviewSlot: true,
          cssVar: (t) => cssv(worldTokenVar(t)),
          hashFor: (p) => `#/${p.join('/')}`, navigate: (h) => { location.hash = h; },
          statusText, fmtT, pointIndexAt: (iso) => (hist ? pointIndexAt(iso) : 0),
          onView: (v) => { v.slot.innerHTML = worldHostHtml(v); },
        },
      });
    } catch (e) { destroyWorld(); $('view').innerHTML = `<div class="panel empty" role="alert">${esc(e.message)}</div>`; return; }
  }
  TW.update({ snap, hist, path, now: Date.now() });
}

// Releases (releases/index) and session estimates (snapshot.sessions, from scripts/session-plan.mjs).
let RELEASES = null; let VIEWING = null; const FROZEN = {};
function releasesTable() {
  const list = RELEASES?.releases || [];
  if (!list.length) return '<div class="panel empty">No release has been frozen yet.</div>';
  return `<div class="panel"><table><thead><tr><th>Release</th><th>State</th><th class="num">Planned</th><th class="num">Delivered</th><th class="num">Carried to next</th><th class="num">Bugs verified / open</th><th class="num">Sessions</th></tr></thead><tbody>${list.map((r) => {
    const live = r.state === 'open';
    const cur = live && snap && !VIEWING ? (({ planned, added }) => [...planned, ...added.filter((f) => f.scope === 'planned')])(scopeGroups(snap)) : null;   // planned at the cut + added into planned
    const planned = live ? (cur ? cur.length : '—') : r.planned;
    const delivered = live ? (cur ? cur.filter((f) => f.status === 'passed' || f.status === 'passed_with_backlog').length : '—') : r.delivered;
    return `<tr><td><b>${esc(r.version)}</b><div class="muted">${esc(r.title || r.release || '')}</div></td><td data-label="State">${live ? 'Open (live)' : `Frozen ${esc(String(r.frozenAt || '').slice(0, 10))}`}</td><td class="num" data-label="Planned">${esc(planned)}</td><td class="num" data-label="Delivered">${esc(delivered)}</td><td class="num" data-label="Carried to next">${live ? '—' : esc(r.carried)}</td><td class="num" data-label="Bugs verified / open">${live ? '—' : `${esc(r.bugsVerified)} / ${esc(r.bugsOpen)}`}</td><td class="num" data-label="Sessions">${esc(live ? (snap?.sessions?.length ?? 0) : r.sessions)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function sessionsTable(list) {
  if (!list || !list.length) return `<div class="panel empty">${VIEWING ? 'No session estimates were recorded in this release (they start in 0.3.0).' : 'No session has recorded an estimate yet. Before starting work, run scripts/session-plan.mjs estimate.'}</div>`;
  const rows = list.flatMap((p) => (p.estimate?.items || []).map((it) => {
    const res = [...(p.merges || [])].reverse().flatMap((m) => m.results || []).find((r) => r.feature === it.feature);
    const exp = it.expect ? `${it.expect.passed}/${it.expect.total}` : '—';
    const act = res && res.passed != null ? `${res.passed}/${res.total}` : 'not validated';
    const met = it.expect && res && res.passed != null ? (res.passed >= it.expect.passed && res.total === it.expect.total) : null;
    return `<tr><td class="mono">${esc(p.session)}<div class="muted">${esc(p.intent || '')}</div></td><td data-label="Feature">${esc(it.feature)}${it.outOfScope ? ' <span class="muted">(backlog, outside planned scope)</span>' : ''}<div class="muted">${esc(it.goal || '')}</div></td><td data-label="Size">${esc(it.size || '—')}</td><td class="num" data-label="Expected">${esc(exp)}</td><td class="num" data-label="At last merge">${esc(act)}${res?.round ? `<div class="muted">round ${esc(res.round)}</div>` : ''}</td><td class="num" data-label="Merges">${esc((p.merges || []).length)}</td><td data-label="Result">${met === null ? '<span class="muted">—</span>' : met ? '<b>Met</b>' : '<b>Missed</b>'}</td></tr>`;
  }));
  return `<div class="panel"><table><thead><tr><th>Session</th><th>Feature and goal</th><th>Size</th><th class="num">Expected</th><th class="num">At last merge</th><th class="num">Merges</th><th>Result</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
const LAYERS = {
  '': () => {
    const s = snap; const human = STATS.human.count(s);
    const ups = s.updates || []; const u = ups[ups.length - 1];
    return { crumbs: [], html: `
      ${VIEWING ? `<div class="frozen-note"><b>Release ${esc(VIEWING)} is frozen.</b> This is its final state, recorded ${esc(String(FROZEN[VIEWING]?.frozenAt || '').replace('T', ' ').slice(0, 16))} UTC at commit ${esc(FROZEN[VIEWING]?.frozenCommit || '')}. Nothing here changes; unfinished work moved to the next release.</div>` : ''}
      ${scopeSummary(s)}
      ${trendsHtml()}
      ${section('Releases: features delivered per release', releasesTable())}
      ${section('Sessions: estimate before the work, test results at each merge', sessionsTable(s.sessions))}
      <div class="strip">${Object.entries(STATS).map(([key, st]) => `<a class="stat ${st.tone}" href="${href('stat', key)}"><div class="n">${esc(st.count(s))}</div><div class="l">${esc(st.label)}</div><div class="go">Open ›</div></a>`).join('')}</div>
      ${human ? `<a class="callout" style="display:block;text-decoration:none" href="${href('stat', 'human')}"><b>${human} ${human === 1 ? 'bug needs' : 'bugs need'} a person.</b> Open them ›</a>` : ''}
      ${section('Agents working now', agentCards(s.agents.filter((a) => a.status === 'running')))}
      ${featureSections(s)}` };
  },
  scope: ([key]) => {
    const def = SCOPE_GROUPS.find(([k]) => k === key); if (!def) return null;
    const list = scopeMembers(snap, key);
    const notes = key === 'added' ? `<div class="panel" style="padding:10px 14px">${list.map((f) => `<div style="margin-bottom:6px"><b>${esc(f.key)}</b> · added ${esc(String(f.added?.at || '').slice(0, 10))}${f.added?.commit ? ` (${esc(f.added.commit)})` : ''} · ${f.scope === 'planned' ? 'counted in this release' : 'kept in backlog'} · ${esc(f.added?.reason || '')}</div>`).join('')}</div>` : '';
    return { crumbs: [[def[1]]], html: `<div><h3 class="layer-title">${esc(def[1])}: ${list.length}</h3><div class="layer-sub">${esc(def[2])}</div></div>${notes}${featureRows(list)}` };
  },
  stat: ([key]) => {
    const st = STATS[key]; if (!st) return null;
    if (st.list === 'updates') return LAYERS.updates();
    const items = st.pick(snap);
    const html = st.list === 'features' ? featureRows(items) : st.list === 'bugs' ? bugRows(items) : agentRows(items);
    return { crumbs: [[st.label]], html: `<div><h3 class="layer-title">${esc(st.label)}: ${esc(st.count(snap))}</h3><div class="layer-sub">${esc(st.note)}</div></div>${html}` };
  },
  feature: ([key, sub, n]) => {
    const f = snap.features.find((x) => x.key === key); if (!f) return null;
    const agents = snap.agents.filter((a) => a.feature === key);
    if (sub === 'round') return roundLayer(f, Number(n), agents);
    const own = ownBugs(key); const backlog = snap.bugs.filter((b) => b.feature === key && BACKLOG.includes(b.status));
    const rounds = [...new Set(agents.map((a) => a.round).filter((r) => r != null))].sort((a, b) => a - b);
    const r = f.lastResult;
    return { crumbs: [[key]], html: `
      <div><h3 class="layer-title">${esc(key)}</h3><div class="layer-sub">${featStatus(f.status)} · ${f.rounds} test round${f.rounds === 1 ? '' : 's'}${r ? ` · latest: round ${r.round}, ${r.stepsPassed}/${r.stepsTotal} steps${r.baseline ? ` on baseline v${r.baseline} (scores compare only within one baseline version)` : ''}` : ''}</div></div>
      ${section('Test rounds', rounds.length ? `<div class="chips">${rounds.map((n) => { const v = agents.find((a) => a.role === 'validate' && a.round === n); return `<a class="chip" href="${href('feature', key, 'round', n)}">Round ${n}${v?.summary ? ` · ${esc(v.summary)}` : v ? ` · ${esc(STATUS[v.status] || v.status)}` : ''}</a>`; }).join('')}</div>` : '<div class="panel empty">Not tested yet.</div>')}
      ${section('Working now', agentCards(agents.filter((a) => a.status === 'running')))}
      ${section(`Its own bugs (${own.length})`, bugRows(own, false))}
      ${backlog.length ? section(`Moved to backlog (${backlog.length})`, bugRows(backlog, false)) : ''}
      ${section(`Agent runs (${agents.length})`, agentRows(agents))}` };
  },
  updates: () => {
    const ups = [...(snap.updates || [])].reverse();
    return { html: `<div><h3 class="layer-title">Status updates${snap.release?.version ? ` — release ${esc(snap.release.version)}` : ''}</h3><div class="layer-sub">Each update is numbered, pinned to a commit and compared with the one before. Newest first.</div></div>
      ${ups.length ? `<div class="panel"><table><thead><tr><th>Version</th><th>Headline</th><th>Features passed</th><th class="num">Open bugs</th><th class="num">Verified</th></tr></thead><tbody>${ups.map((u) => `<tr class="rowlink" data-href="${href('update', u.version)}"><td class="num"><a class="cell" href="${href('update', u.version)}">${esc(u.version)}</a><div class="muted">${esc(u.at.replace('T', ' ').slice(0, 16))} UTC</div></td><td data-label="Headline">${esc(u.headline || '—')}</td><td class="num" data-label="Features passed">${u.metrics.featuresPassed} / ${u.metrics.featuresTotal}</td><td class="num" data-label="Open bugs">${u.metrics.openBugs}</td><td class="num" data-label="Verified">${u.metrics.verified}</td></tr>`).join('')}</tbody></table></div>` : '<div class="panel empty">No updates recorded yet.</div>'}` };
  },
  update: ([v]) => {
    const ups = snap.updates || []; const i = ups.findIndex((x) => x.version === v); const u = ups[i]; if (!u) return null;
    const prev = ups[i - 1]; const next = ups[i + 1];
    return { html: `<div><h3 class="layer-title">${esc(u.headline || u.version)}</h3><div class="layer-sub">${esc(updateLabel(u))} · commit ${commit(u.commit)}${prev ? ` · compared with <a href="${href('update', prev.version)}">${esc(prev.version)}</a>` : ' · baseline'}${next ? ` · next: <a href="${href('update', next.version)}">${esc(next.version)}</a>` : ''}</div></div>
      <section><h2>What happened</h2><div class="panel" style="padding:14px 16px">${esc(u.note)}</div></section>
      ${section('Compared with the previous update', `<div class="panel" style="padding:6px 16px"><ul class="md">${(u.comparison?.lines || []).map((l) => `<li>${mdb(l)}</li>`).join('')}</ul></div>`)}
      ${u.comparison?.featureChanges?.length ? section('Feature changes', `<div class="panel" style="padding:6px 16px"><ul class="md">${u.comparison.featureChanges.map((l) => { const k = l.split(':')[0]; return `<li><a href="${href('feature', k)}">${esc(k)}</a>${mdb(l.slice(k.length))}</li>`; }).join('')}</ul></div>`) : ''}
      ${section('Every feature at this update', `<div class="panel"><table><thead><tr><th>Feature</th><th>Status</th><th>Latest test</th></tr></thead><tbody>${Object.entries(u.metrics.features).map(([k, f]) => `<tr class="rowlink" data-href="${href('feature', k)}"><td><a class="cell" href="${href('feature', k)}">${esc(k)}</a></td><td data-label="Status">${featStatus(f.status)}</td><td class="num" data-label="Latest test">${f.round ? `Round ${f.round}: ${esc(f.score)}` : '<span class="muted">Not tested yet</span>'}</td></tr>`).join('')}</tbody></table></div>`)}` };
  },
  bug: ([id]) => {
    const b = (snap.bugs || []).find((x) => x.id === id); if (!b) return null;
    const touched = [...new Set((b.history || []).map((h) => h.round).filter((x) => x))];
    return { crumbs: [[b.feature, href('feature', b.feature)], [id]], html: `
      <div><h3 class="layer-title">${esc(b.step || id)}</h3><div class="layer-sub">${pill(b.status)} · <span class="mono">${esc(id)}</span> · fix attempts ${b.attempts || 0} of ${esc(snap.maxFixAttemptsPerBug)}</div></div>
      ${b.question ? `<div class="callout"><b>Question for you:</b> ${esc(b.question)}</div>` : ''}
      <section><h2>Details</h2><div class="panel"><dl class="kv">
        <dt>Root cause</dt><dd>${esc(b.rootCause || '—')}</dd>
        <dt>Class</dt><dd>${esc(b.class || '—')}</dd>
        <dt>Files</dt><dd class="mono">${esc((b.files || []).join(', ') || '—')}</dd>
        <dt>Whose bug</dt><dd>${b.scope ? `${esc(SCOPE[b.scope.scope] || b.scope.scope)}${b.scope.owner ? ` — <a href="${href('feature', b.scope.owner)}">${esc(b.scope.owner)}</a>` : ''}<div class="muted">${esc(b.scope.evidence)} (${esc(b.scope.decidedBy)})</div>` : '<span class="muted">Not scope-checked yet</span>'}</dd>
        <dt>Reported against</dt><dd><a href="${href('feature', b.feature)}">${esc(b.feature)}</a>${touched.length ? ` · rounds ${touched.map((n) => `<a href="${href('feature', b.feature, 'round', n)}">${n}</a>`).join(', ')}` : ''}</dd>
      </dl></div></section>
      ${section('History', `<div class="panel"><ul class="timeline">${(b.history || []).map((h) => `<li><span class="muted">${h.round ? `<a href="${href('feature', b.feature, 'round', h.round)}">R${h.round}</a>` : 'Build'}</span><span><b>${esc(EVENT[h.event] || h.event)}</b></span><span>${esc(h.note)}${h.files?.length ? ` <span class="mono muted">${esc(h.files.join(', '))}</span>` : ''}${commit(h.commit)}</span></li>`).join('') || '<li class="muted">No history recorded.</li>'}</ul></div>`)}` };
  },
  agent: ([id]) => {
    const a = (snap.agents || []).find((x) => x.id === id); if (!a) return null;
    const ls = a.liveSteps;
    const crumbs = a.feature ? [[a.feature, href('feature', a.feature)], ...(a.round ? [[`Round ${a.round}`, href('feature', a.feature, 'round', a.round)]] : []), [agentName(a)]] : [[agentName(a)]];
    return { crumbs, html: `
      <div><h3 class="layer-title">${esc(agentName(a))}${a.feature ? ` — ${esc(a.feature)}` : ''}</h3><div class="layer-sub">${pill(a.status)} · <span class="mono">${esc(a.label)}</span></div></div>
      <section><h2>Details</h2><div class="panel"><dl class="kv">
        <dt>Result</dt><dd>${esc(a.summary || '—')}</dd>
        <dt>Latest step</dt><dd class="mono">${esc(a.activity || '—')}</dd>
        <dt>Started</dt><dd>${esc(ago(a.startedAt))}</dd>
        <dt>Last activity</dt><dd>${esc(ago(a.lastActivityAt))}</dd>
        <dt>Tokens</dt><dd class="num">${k(a.tokens?.input)} in · ${k(a.tokens?.cacheWrite)} cache write · ${k(a.tokens?.cacheRead)} cache read · ${k(a.tokens?.output)} out</dd>
      </dl></div></section>
      ${ls ? section('Live test log', `<div class="panel"><dl class="kv"><dt>Checks logged</dt><dd>${ls.checked} (${ls.passed} passed)</dd></dl>${ls.failedTotal > ls.failed.length ? `<div class="muted" style="padding:0 14px">Showing ${ls.failed.length} of ${ls.failedTotal} failed checks; the full log is in the round's test report.</div>` : ''}${ls.failed.length ? `<ul class="timeline">${ls.failed.map((f) => `<li><span class="muted">Failed</span><b>${esc(f.step)}</b><span>Expected: ${esc(f.expect || '—')}<br>Saw: ${esc(f.seen || '—')}</span></li>`).join('')}</ul>` : ''}${ls.errors?.length ? `<ul class="timeline">${ls.errors.map((e) => `<li><span class="muted">Error</span><b>${esc(e.type)}</b><span>${esc(e.detail)}</span></li>`).join('')}</ul>` : ''}</div>`) : ''}
      ${a.signals?.length ? section('Page errors and failed requests seen', `<div class="panel"><ul class="timeline">${a.signals.map((e) => `<li><span class="muted">Seen</span><b>${esc(e.type)}</b><span>${esc(e.detail)}</span></li>`).join('')}</ul></div>`) : ''}
      ${a.failures?.length ? section(`Command failures it reported (${a.failures.length})`, `<div class="panel"><ul class="timeline">${a.failures.map((f, i) => `<li><span class="muted">#${i + 1}</span><span></span><span>${esc(typeof f === 'string' ? f : JSON.stringify(f))}</span></li>`).join('')}</ul></div>`) : ''}` };
  },
};
function roundLayer(f, n, agents) {
  const STAGE = ['validate', 'triage', 'scope', 'fix', 'reconcile', 'integrate'];
  const inRound = agents.filter((a) => a.round === n || String(a.label || '').includes(`-r${n}`)).sort((x, y) => STAGE.indexOf(x.role) - STAGE.indexOf(y.role));
  const touched = (snap.bugs || []).filter((b) => b.feature === f.key && (b.history || []).some((h) => h.round === n));
  const v = inRound.find((a) => a.role === 'validate');
  return { crumbs: [[f.key, href('feature', f.key)], [`Round ${n}`]], html: `
    <div><h3 class="layer-title">${esc(f.key)} — round ${n}</h3><div class="layer-sub">${v ? `${pill(v.status)} · ${esc(v.summary || 'Test in progress')}` : 'No browser test recorded for this round yet'}</div></div>
    ${section('Stages in this round', agentRows(inRound))}
    ${section(`Bugs found, fixed or verified in this round (${touched.length})`, bugRows(touched, false))}` };
}

const crumbLabel = (t) => {
  const [type, a, b] = t.split(':').map(decodeURIComponent);
  if (type === 'stat') return STATS[a]?.label || a;
  if (type === 'scope') return (SCOPE_GROUPS.find(([k]) => k === a) || [])[1] || a;
  if (type === 'updates') return 'Status updates';
  if (type === 'update') return `Update ${a}`;
  if (type === 'round') return `${a} · round ${b}`;
  if (type === 'agent') { const ag = snap.agents.find((x) => x.id === a); return ag ? `${agentName(ag)} · ${ag.feature || ''}` : a; }
  return a;
};
function route() {
  if (!snap) return;
  path = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  // Older single-layer links (#/feature/<key>, #/bug/<id>, #/feature/<key>/round/<n>) still open.
  if (path.length >= 2 && !path[0].includes(':')) {
    const [t, a, , n] = path.map(decodeURIComponent);
    path = [t === 'feature' && n ? tok('round', a, n) : tok(t, a)];
  }
  const last = path[path.length - 1] || '';
  const [type, ...args] = last.split(':').map(decodeURIComponent);
  const fn = type === 'round' ? ([key, n]) => { const f = snap.features.find((x) => x.key === key); return f && roundLayer(f, Number(n), snap.agents.filter((a) => a.feature === key)); } : LAYERS[type || ''];
  const layer = (fn && fn(args)) || { html: '<div class="panel empty">That item is no longer in the tracker. Use the trail above to go back.</div>' };
  const trail = [['Overview', '#/'], ...path.map((t, i) => [crumbLabel(t), `#/${path.slice(0, i + 1).join('/')}`])];
  $('crumbs').innerHTML = trail.map(([label, h], i) => (i === trail.length - 1 ? `<span class="here" aria-current="page">${esc(label)}</span>` : `<a href="${h}">${esc(label)}</a><span class="sep" aria-hidden="true">›</span>`)).join('');
  document.documentElement.dataset.rtView = MODE;
  if (MODE === 'world') renderWorld(layer);
  else { destroyWorld(); $('view').innerHTML = `<div class="layer">${layer.html}</div>`; if (!path.length) mountTrends(); }
  document.title = `${trail[trail.length - 1][0]} · Release tracker`;
}
function render() {
  if (!snap || VIEWING) return;
  const age = (Date.now() - Date.parse(snap.syncedAt)) / 60000;
  $('sync').className = `sync${age > 20 ? ' stale' : ''}`;
  $('sync').innerHTML = `<span class="live-dot"></span>Updated <b>${esc(ago(snap.syncedAt))}</b>`;
  route();
}
let lastHash = location.hash;
const scrollAt = {};
window.addEventListener('hashchange', () => {
  scrollAt[lastHash] = window.scrollY;
  const deeper = location.hash.length > lastHash.length; lastHash = location.hash; route();
  window.scrollTo(0, deeper ? 0 : (scrollAt[location.hash] || 0));   // returning to a summary page restores where you were on it
});
// A whole table row is a target; the link inside it stays the keyboard/focus target.
$('view').addEventListener('click', (e) => { if (e.target.closest('a')) return; const row = e.target.closest('tr[data-href]'); if (row) location.hash = row.dataset.href; });
setInterval(render, 30000);
const setModeButtons = () => document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === MODE)));
setModeButtons();
document.querySelector('.head-right').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === MODE) return; MODE = b.dataset.mode; try { localStorage.setItem('rt-mode', MODE); } catch {} setModeButtons(); destroyWorld(); $('view').innerHTML = ''; route(); });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { TW && TW.refreshColors(); render(); }); } catch {}

(async () => {
  const db = await claude.use('db');
  if (!db) { $('sync').textContent = 'Live updates are unavailable in this view. Open the tracker signed in to claude.ai.'; return; }
  // Live release: tracker/current, tracker/bugs, tracker/history. A frozen release: releases/<v>-current|-bugs|-history.
  // Bugs may span two documents (<bugs> and <bugs>-2) so each stays under the per-document size limit.
  const live = { snap: null, bugs: null, bugs2: [], hist: null }; const frozen = {};
  const parse = (d) => { const data = d && (d.data ? d.data() : d); if (!data || !data.json) return null; try { return JSON.parse(data.json); } catch { return null; } };
  const show = () => {
    const src = VIEWING ? frozen[VIEWING] : live;
    if (!src || !src.snap) { if (VIEWING) $('view').innerHTML = '<div class="panel empty">Loading the frozen release…</div>'; return; }
    snap = { ...src.snap }; snap.features ||= []; snap.agents ||= []; snap.bugs = (snap.bugsSeparate ? (src.bugs ? [...src.bugs, ...(src.bugs2 || [])] : null) : snap.bugs) || []; snap.sessions ||= [];
    hist = src.hist; if (chart) { chart.destroy(); chart = null; } if (typeof T === "object" && T) T.at = null;
    if (VIEWING) { $('sync').className = 'sync'; $('sync').innerHTML = `Frozen release <b>${esc(VIEWING)}</b>`; route(); } else render();
  };
  db.doc('tracker/history').onSnapshot((d) => { const v = parse(d); if (v) { live.hist = v; if (!VIEWING) show(); } }, () => {});
  db.doc('tracker/bugs').onSnapshot((d) => { const v = parse(d); if (v) { live.bugs = v; if (!VIEWING) show(); } }, () => {});
  db.doc('tracker/bugs-2').onSnapshot((d) => { const v = parse(d); live.bugs2 = Array.isArray(v) ? v : []; if (!VIEWING && live.bugs) show(); }, () => {});
  db.doc('tracker/current').onSnapshot((d) => {
    const v = parse(d);
    if (v) { live.snap = v; if (!VIEWING) show(); } else if (!VIEWING) $('sync').textContent = 'The latest update could not be read.';
  }, () => { $('sync').textContent = 'Lost the live connection. Reload the page to reconnect.'; });
  db.doc('releases/index').onSnapshot((d) => {
    const v = parse(d); if (!v) return; RELEASES = v;
    for (const r of v.releases) if (r.state === 'frozen') FROZEN[r.version] = r;
    const sel = $('release'); const keep = sel.value;
    sel.innerHTML = `<option value="">Live release${snap?.release?.version ? ` (${esc(snap.release.version)})` : ''}</option>${v.releases.filter((r) => r.state === 'frozen').map((r) => `<option value="${esc(r.version)}">${esc(r.version)} (frozen)</option>`).join('')}`;
    sel.value = keep; if (snap) route();
  }, () => {});
  $('release').addEventListener('change', (e) => {
    VIEWING = e.target.value || null; try { localStorage.setItem('rt-release', VIEWING || ''); } catch {}
    if (VIEWING && !frozen[VIEWING]) {
      const f = frozen[VIEWING] = { snap: null, bugs: null, bugs2: [], hist: null }; const v = VIEWING;
      db.doc(`releases/${v}-current`).onSnapshot((d) => { f.snap = parse(d); if (VIEWING === v) show(); }, () => {});
      db.doc(`releases/${v}-bugs`).onSnapshot((d) => { f.bugs = parse(d); if (VIEWING === v) show(); }, () => {});
      db.doc(`releases/${v}-bugs-2`).onSnapshot((d) => { const x = parse(d); f.bugs2 = Array.isArray(x) ? x : []; if (VIEWING === v) show(); }, () => {});
      db.doc(`releases/${v}-history`).onSnapshot((d) => { f.hist = parse(d); if (VIEWING === v) show(); }, () => {});
    }
    location.hash = '#/'; show();
  });
})();
</script>
```
