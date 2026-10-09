# Change spec — After-session context / prompt / cache / memory mapping with token, spend and time trends

Version 1 · 2026-10-09 · feature key `session-mapping` · release `2026-10-02-application-packages-resume` · branch `release-loop/session-mapping-build`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| `docs/changes/release-intelligence.md` | v1, `e4f85ca` | Pattern reused: lazily created additive tables, a `config_state` rules row edited from a Settings tab, an admin `embed` island in the World Shell, trend charts with a timeline slider. Its `release_metrics` table (per release-loop agent, filled from the release tracker) is NOT reused: this feature measures sessions from transcripts. |
| `src/lib/releaseCharts.js` | `dac3ce6` (via release-intelligence) | `stackedBarsHtml()` draws every chart here. One additive, backward-compatible option was added (`valueDigits`, default 2) so spend tooltips can show four decimals. |
| `docs/changes/chart-gallery.md` | v1, `3b198a8` | Validated categorical palette and chart tokens used by those charts. |
| `docs/changes/no-silent-failures.md` | v1.1, `f1ebf29` | Same rule: every action on the screen shows its error inline (`role="alert"`) and in a toast; a capture that fails is a stored row (`session_capture_failures`) closed only by a note. |
| `docs/changes/failed-commands-reconciliation.md` | `dd58da6` | Failed hooks/commands are reconciled rows, never dropped. |
| `docs/changes/world-shell-opportunity-outputs.md` | `7cc95ed` | World Shell "embed island" mounting (`SIMPLE_EMBED_COMPONENTS`, `ISLAND_REGISTRY`). |
| `docs/changes/release-loop-tooling.md` and `server/data/releaseLoop/definition.json` | v4, `dac3ce6` | Interface parity (website desktop + 390px, API, MCP) and spec governance (frozen baseline, stable step ids) this spec is written to. |
| `server/lib/agentLlmUsage.js` | `eb62057` | The in-app agent completion path (`recordAgentLlmUsage`, `assertAgentLlmBudget`) that now also files each run. The monthly cap counter itself is unchanged. |
| `docs/active-universal-salt-basin-agent-memory-register.md` | existing | The default target of the "memory" mapping area. Never edited by this feature. |

Supersedes nothing. No existing table, route or screen changes behaviour; `recordAgentLlmUsage` gains one non-blocking call at its end.

## What changed, in one paragraph

After a Claude Code session ends (SessionEnd hook), or when an admin scans/pastes a transcript, or when an in-app agent completes a run, the platform files a **metrics-only** record: tokens by type (input, cache-write, cache-read, output), cache-hit ratio, agents, active and elapsed time, limit events (usage/rate limits and context compactions), tool and skill names, and spend computed from a **UI-editable price table**. A deterministic rule engine turns each record into **mapping proposals** (suggested edits with evidence) for four areas: **context** (CLAUDE.md / skill references), **prompt** (skills, workflows, agent prompts), **cache** (stable prefixes) and **memory** (the agent memory register). The admin **Sessions** screen shows dated trends (one value axis per chart, a timeline slider) and a before/after for every mapping marked applied.

## Privacy rule (design constraint)

Only metrics are read into a result or stored: counts, model ids, tool names, skill names, timestamps, error statuses, and a short agent label (the subagent's description, cut to 80 characters). `server/lib/sessionAnalysis.js` parses transcript lines in memory and returns numbers; no message text, tool input or output, or file content is returned, stored, logged or sent to the page. Pasted transcripts are read once and discarded. Unreadable lines are counted (`badLines`), never skipped silently.

## Counting rules

- **Usage counted once per message id.** Claude Code writes one line per content block, so one API message appears on several lines; usage per field is the maximum seen for that `message.id`. Subagent files (`<session>/subagents/**/agent-*.jsonl`, with `.meta.json` for the label) are analysed the same way and combined.
- **Cache-hit ratio** = cache-read tokens / (input + cache-write + cache-read). Shown as "not recorded" when the source gave no cache fields (in-app runs without them), never 0.
- **Limit events**: a `compact_boundary` system line is a *compaction* (with trigger and pre/post token sizes); an `isApiErrorMessage` line is a *usage limit* (text matches a usage-limit phrase) or *rate limit* (HTTP 429); other API errors are counted separately and are not limit events. An in-app agent reaching its token cap files a `usage_limit` event.
- **Time is INFERRED** from first/last timestamps: *elapsed* = last minus first; *active* sums the gaps between consecutive lines, each capped at the configurable idle gap (default 10 minutes). Unknown time is "not recorded", never 0.
- **Spend** is computed at read time from the saved price table (`priceSession`): editing a price re-prices every stored session. A model with no matching price row is listed as "not priced" and left out of the total, never counted as 0.

## Data model (additive only)

Created lazily by `ensureSessionMappingSchema()` (`server/lib/sessionMappingSchema.js`); `CREATE TABLE IF NOT EXISTS`, nothing in `bootstrap()` writes rows, no existing table or member row is touched.

| Table | Holds |
| --- | --- |
| `session_analyses` | One row per session / in-app run, unique `session_key` (`claude_code:<session id>` or `in_app_agent:<definition>:<ms>:<rand>`). Token columns (nullable = not recorded), `by_model`, `agents`, `limit_events`, `tool_counts`, `skill_counts`, `prefix` (JSONB), counts, `started_at`/`ended_at` (BIGINT ms). No text columns. |
| `session_mapping_proposals` | One row per (session, `rule_key`, target path): `area` (context/prompt/cache/memory), `title`, `evidence` (JSONB label/value list), `suggested_edit`, `status` (proposed / applied / rejected), decision note and actor, `applied_on` (UTC day the edit took effect), `applied_at`, `applied_ref`. |
| `session_capture_failures` | A hook, scan or in-app capture that failed: `source`, `ref`, `error`, `disposition` (open / reconciled / accepted) with a required note. |

JSONB parameters are passed as raw JS values (never `JSON.stringify`). Config lives in `config_state` row `session_mapping_rules` (TEXT JSON), shallow-merged over `DEFAULT_RULES` in `sessionMappingConfig.js`. **Reuse audit** (channel-journey / config audit): no existing table holds per-session token/cache/limit metrics with a mapping queue (`release_metrics` is per release-loop agent from the tracker; `agent_llm_usage` is a monthly cap counter with no time series or cache split; `raw_events`/`contribution_events` are human-vs-AI evidence), so three narrow tables were justified; rules, prices and targets are configuration, not code.

## Mapping rules (append-only keys)

All thresholds and target files are editable on **Settings** (config-audit). Rule keys are never renamed or removed: a stored proposal always resolves to its key.

| Rule key | Area | Proposed when | Default target |
| --- | --- | --- | --- |
| `cache.low_hit_ratio` | cache | ratio below 0.8 with at least 5 messages | `CLAUDE.md` |
| `cache.prefix_variants` | cache | subagents started from more than one distinct system prefix (from `*.prefix.json`) | `CLAUDE.md` |
| `context.compaction` | context | compactions above 0 | `CLAUDE.md` |
| `memory.compaction_loss` | memory | compactions above 0 | `docs/active-universal-salt-basin-agent-memory-register.md` |
| `prompt.limit_event` | prompt | usage/rate-limit events above 0 | `.claude/workflows/release-loop.js` |
| `prompt.dominant_agent:<agent id>` | prompt | one non-main agent above 60% of all tokens (with at least 2 agents) | `.claude/workflows/release-loop.js` |
| `prompt.skill_repeat:<skill>` | prompt | a skill invoked 5 or more times | `.claude/skills/<skill>/SKILL.md` |

Re-running the rules (a re-filed session, or saving Settings) updates undecided proposals, **withdraws** undecided ones the rules no longer produce, and never alters an applied or rejected one. "Mark applied" records the UTC day the edit took effect; the Trends tab compares sessions that ended before that day with sessions that ended on or after it (sessions, cache-hit ratio, tokens / spend / limit events / active minutes per session), and says so plainly when one side has no sessions.

## Server

- `server/lib/sessionAnalysis.js` — pure transcript parser and filesystem reader (no database).
- `server/lib/sessionMappingRules.js` — pure `proposeMappings()`.
- `server/lib/sessionMappingConfig.js` — defaults, validation, load/save/reset, `priceModel`/`priceSession`.
- `server/lib/sessionMapping.js` — the one service behind every interface: `saveAnalysis`, `remapSession`/`remapAll`, `listSessions`, `getSession`, `listProposals`, `rejectProposal`, `applyProposal`, `getTrends`, `importTranscriptText`, `importMetricsJson`, `scanTranscripts`, capture-failure functions, `recordInAppAgentRun`.
- `server/routes/sessionMapping.js` — `/api/session-mapping/*`, all `requireAdmin` (a member gets 403 `admin only`, no cookie 401). **Mark applied** is a finalize path: `assertReadyToFinalize(req.user.id)` first, then `applyProposal` (409 `tool_category_required` otherwise).
- `server/lib/agentLlmUsage.js` — `recordAgentLlmUsage` now also calls `recordInAppAgentRun` (label = the agent definition's name, never its prompt); `assertAgentLlmBudget` files a `usage_limit` event when it refuses at the cap. `recordInAppAgentRun` never throws into the request: a failure is logged and stored in `session_capture_failures`.
- `scripts/analyze-session.mjs` — command-line analyzer (prints metrics + mapping summary; `--json`; `--import` files it in the database) and the SessionEnd hook entry (`--hook`).
- `.claude/settings.json` — non-blocking `SessionEnd` hook running `node scripts/analyze-session.mjs --hook`. Hook mode always exits 0; on any failure it appends a line to `server/data/sessionMapping/hook-failures.jsonl` (git-ignored) and prints the error. **Scan server transcripts** files those lines as capture failures that a reviewer must dispose.
- `server/index.js` mounts the router; `server/db.js` adds the nav tab `session-mapping` (label **Sessions**, view `plm`) through the existing additive new-tabs list.

## Client

- `src/components/admin/SessionMappingPanel.jsx` — the **Sessions** screen with tabs Trends, Sessions, Mapping queue, Import, Settings. Card lists instead of wide tables, 44 px minimum tap targets, no hover-only actions, no horizontal page scroll at 390 px. Opening a tab clears and reloads its data (never reads a stale list); the newest request always wins (a slow earlier answer cannot overwrite a later filter). Mark applied runs through `useToolCategoryGate().run`.
- `src/components/WorldShell.jsx` (`SIMPLE_EMBED_COMPONENTS.sessionMapping`), `src/lib/worldIslands.js` (island `sessionMapping`, admin, `enforced: true`), `src/components/admin/AdminShell.jsx` (`TAB_COMPONENTS` + fallback nav), `src/lib/api.js` (methods `*SessionAnalys*`, `*SessionProposal*`, ...).

## Interface parity

| Capability | Website | API | MCP |
| --- | --- | --- | --- |
| All capabilities | World Shell -> Journeys -> Sessions, desktop and 390px (training spec walks both) | `/api/session-mapping/*` (same `requireAdmin` + `assertReadyToFinalize`) | **MCP_GAP (recorded, assigned to `platform-mcp`)**: `server/lib/mcpToolRegistry.js` does not exist in this repository, and creating a second registry here would fork it. Planned append-only tools, each a thin call to the same `sessionMapping.js` function with the same admin check: `session_mapping_config`, `session_mapping_sessions`, `session_mapping_trends`, `session_mapping_proposals` (list / reject / apply with the finalize gate), `session_mapping_import`, `session_mapping_failures`. |

## Behaviour changes to know

- Every in-app agent completion (`recordAgentLlmUsage`) now writes one `session_analyses` row. It is awaited but cannot fail the request (errors are stored and logged).
- The new nav tab is added to an existing admin's `admin_nav` by the existing additive migration; no member row is touched.
- Spend figures depend on the price table, which ships with **starter values** (clearly labelled on the screen: edit to match your plan).
- A SessionEnd hook is now part of the repository's project settings; it needs `DATABASE_URL` in the hook's environment to file anything, otherwise it logs a failure line (never blocks).

## Verified (initial check)

Against a fresh database `sb_rl_bld_*` on Postgres 16, Chromium 1194, 2026-10-09:

- `npm run build` passes; the server boots on a fresh database and `npm run seed` runs.
- Every step of `docs/training/session-mapping.md` (47 journey steps, 9 edge cases, fixtures written from the spec's own Appendix A, CLI commands run literally) passed on **desktop 1280x900** and again on a fresh database at **390x844 touch**, with no page errors and only the 400/401/403 responses the spec names.
- `server/lib/sessionAnalysis.test.js` (jest, 8 tests: once-per-message-id counting, compaction and rate-limit events, idle-gap cap, no text carried, price table "not priced", rule validation, mapping rules) passes. Two other suites in `npm test` (`crystalWorldAuditAgent.test.js`, `agentStudioGovernance.test.js`) already failed to run before this change and are untouched.
- Real data: the analyzer run on this repository's own 7-day session transcript (1,074 main messages, 333 subagents, 3 compactions, 211 limit events) printed metrics and four mapping proposals with no transcript text.
- Gate: with a technology lacking a proficiency category, `POST .../proposals/:id/apply` returned 409 `tool_category_required`; after the technology was removed it returned 200.
- Found and fixed while building: a stale-response race (a slower earlier filter answer overwrote the newer list), spend tooltips rounded to two decimals, a re-filed session burning a database id (UPDATE first, INSERT only when new), and Postgres NOTICE lines polluting the CLI output.

## Known limitations

- MCP tools are planned, not built (see Interface parity).
- Spend uses starter prices; there is no live price feed.
- Mapping rules are thresholds on metrics: they point to *where* to edit and *why*; they do not read conversation text, so they cannot say *what* to write beyond the template, and nothing edits files automatically (the reviewer edits, then marks applied).
- Before/after is correlational: sessions differ in task, so a change in a per-session average is evidence, not proof.
- Per-agent token share excludes the main thread by design.
- Request bodies are limited to 2 MB (an oversized paste is refused with the server's error, shown inline); use **Scan server transcripts** or the command line for large sessions.

## Fix notes per round (appended by fix agents)

_None yet._
