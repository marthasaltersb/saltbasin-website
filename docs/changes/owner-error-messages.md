# Change spec — Remaining raw error messages rewritten under the owner error rule

Version 1.0 · 2026-10-10 · feature key `owner-error-messages` · release `2026-10-10-production-hardening-resume`

## Traces to

| Earlier work | Version / commit | Relationship |
| --- | --- | --- |
| Owner direction 2026-10-10, recorded in `CLAUDE.md` "Frontend conventions" | rule | The rule this feature applies: the first sentence says what went wrong and what to do in plain words (never a bare parser/HTTP/stack message); technical detail may follow on its own line; red for a failure or rejected input, amber only for a caution where nothing failed |
| `server/data/releaseLoop/definition.json` `specGovernance.reviewChecklist` ("Errors are plain and coloured by severity") | 2026-10-10 | The validator-facing form of the same rule; this feature makes the product meet it |
| `docs/changes/no-silent-failures.md` | v1.1 | Made failures visible; this feature makes the visible ones readable. No failure path was removed |
| `docs/changes/platform-mcp.md` | 2026-10-09 | The MCP tool `release_import_snapshot` shares the rewritten server message |
| `docs/changes/release-intelligence.md`, `docs/changes/live-release-tracker.md` | 2026-10-02 | Owners of the snapshot-import routes and the tracker Settings screen touched here |

Supersedes nothing. No healthy path changed.

## What changed, in one paragraph

A sweep for raw parser/HTTP wording that reached a member or admin. Every JSON-parse failure now reads "The <thing> could not be read because part of its text is mistyped or missing. Check for a missing comma, quote or bracket, fix it, then try again." with the parser's own message on a second line ("Technical detail: ..."). Every fallback "Request failed: 500" / "HTTP 404 Not Found" / bare `statusText` is now a plain sentence chosen by status code, again with the status on a "Technical detail" line. Failure boxes that were amber are red.

## Data model

None. No table, column or config row is added or changed.

## Server

- New `server/lib/friendlyErrors.js` `jsonProblemMessage(what, err)` (one definition of the sentence).
- Used by: `server/routes/releaseTracker.js` (`safeParse`, API `/api/release-tracker/...` snapshot paste), `server/routes/releaseIntelligence.js` (`POST /api/release-intelligence/import/snapshot`), `server/lib/mcpToolRegistry.js` (`release_import_snapshot`, same text), `server/lib/sessionMapping.js` (`importMetricsJson`, MCP/API analysis import).
- `server/lib/releaseTrackerService.js` pull: "The <file> file in the repository could not be read, so nothing was pulled. Fix that file in the repository, then pull again." plus detail.
- Status codes (400/502) are unchanged.

## Client

- New `src/lib/friendlyError.js`: `jsonProblem(what, err)`, `httpProblem(status, serverMessage)` (server's own message wins; otherwise a plain sentence by status: 400, 401, 403, 404, 409, 413, 428, 429, 5xx, other), `headlineOf(message)` (first line, for toasts).
- `src/lib/api.js`: every `Request failed: <status>` fallback uses `httpProblem`.
- JSON-parse sites rewritten: `QualificationRulesPanel.jsx` ("gate list"), `TrackerSettings.jsx` ("snapshot"; inline box has the detail line, the toast only the first sentence), `CareerReconciliationPanel.jsx` ("package"; also the file-read failure), `MyResumePanel.jsx` ("package file"), `MethodologyConfigPanel.jsx` ("configuration"; now `role="alert"`), `EidosOperatingModelPanel.jsx`, `CareerMasterPanel.jsx`, `BoundedCareerAgentPanel.jsx`, `LonetreeMvpPanel.jsx`.
- HTTP wording rewritten: `MemberPanels.jsx` (`statusText`), `OutputTemplateConfigurator.jsx` (`HTTP 404 Not Found - ...`), `resumeRollups.js`, `HerqOutputConfigurator.jsx` ("Error: ..." becomes "Your changes were not saved. ..."), `blocks/index.jsx` (assistant box `Error: ...`).
- Colour: in `CareerReconciliationPanel.jsx` the load/import/decision failure boxes moved from the amber `warnBox` to a new red `errBox` (the per-row "failed sync" cards stay amber: they are a list to review, not a failed action).
- Multi-line messages render with `white-space: pre-line`.

## Interface parity

This changes the wording and colour of existing messages, not a capability. Website: the journeys in the training spec (desktop and 390px). API: the snapshot-import route returns the same sentence (journey step). MCP: `release_import_snapshot` returns the same sentence through `jsonProblemMessage` (no new tool; `server/data/mcpToolManifest.json` unchanged, so there is no parity row to add). Nothing here adds a finalize/approve/publish path.

## Behaviour changes to know

- Anything matching on the old text (`"not valid JSON"`, `"Request failed:"`) no longer matches. A repo search found no such consumer in `src/`, `server/` or `scripts/`; older `docs/test-results` and specs quote the old text as history.
- Server messages now contain a newline; clients that show them must tolerate it (all touched screens do).

## Verified (initial check)

`npm run build` passes; server boots on a fresh database; every journey of `docs/training/owner-error-messages.md` walked once in Chromium at 1280x900 and 390x844. Results: Journeys 1 to 5 and edge cases E.1, E.2, E.4 passed on desktop; Journeys 1 to 4 passed at 390x844 (button heights at least 44px, no horizontal page scroll, red colours as specified). Methodology Config's message was also walked on desktop in Classic Tools (passed). E.3 was covered by the 390px run of Journey 1. During the build, two real defects were found and fixed: the Career Sources to Review import button was 30px tall (now 44px minimum for every button on that screen), and the first wording used the developer term "JSON" in the first sentence (now plain, the term appears only in the technical-detail line). Environment note: the 3D World scene can starve browser automation, so the training spec gives `/world?at=island:<id>` addresses as a fallback.

## Known limitations

- Roughly 200 other `catch (e) { setError(e.message) }` sites pass through whatever message the server sent. Server routes that return developer-style text are not all rewritten; this change covers the parser/HTTP fallbacks that were found. A message the server writes itself is outside the sweep unless listed above.
- `LonetreeMvpPanel.jsx` shows its section-configuration error in its existing neutral status line (shared with the success text), not red.
- Public-site blocks other than the assistant box were not audited.

## Fix notes per round (appended by fix agents)

_None yet._
