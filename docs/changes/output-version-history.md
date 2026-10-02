# Change spec — Output version history: dates, tracked changes and a timeline slider across versions

Feature key: `output-version-history` · Release: `2026-10-02-career-bound-outputs` · Version 1 · 2026-10-02
Branch: `release-loop/output-version-history-build` (built on integration head `8430eae`)
Training spec: `docs/training/output-version-history.md`

## Traces to

| Earlier spec / commit | Version | How this builds on or supersedes it |
| --- | --- | --- |
| `docs/changes/qr-gated-outputs.md` | v1, commits `d78bcda`, `76b33ad`, `aa14653` | Builds on: a document's versions are `resume_output_projections` rows sharing `lineage_root_id`; approval metadata (`approved_by`, `approved_at`, `share_token`) and `shared_snapshot`. Nothing superseded. |
| `docs/changes/career-bound-outputs.md` | v1, commit `9df7a85` | Builds on: `career_bound` content (live-resolved from Career Master) and the frozen `shared_snapshot.document` stored at approval. History shows the frozen wording for approved versions and labels live-resolved wording as such. |
| `docs/changes/world-shell-opportunity-outputs.md` | v1, commits `575f0e6`, `312f128` | Builds on: the World Shell opportunity view, the shared block editor (`OpportunityOutputsSection.jsx`), `lineage_root_id` / `parent_version_id` versioning. History is reachable from both. Its lessons are reused (portal full-screen layers to `document.body`). |
| `docs/changes/cover-letter-agent.md` | v1, commit `a5e7883` | Cover-letter drafts filed by the agent are lineage versions and appear in this history unchanged. |
| `src/lib/shareSnapshotDiff.js`, `src/components/SharedLiveStates.jsx` | commits `d502e1c` and earlier | Reused ideas: one pure function decides what counts as a change; the slider styling of the QR page's "printed to live" timeline. Not modified. |
| Release loop definition | `server/data/releaseLoop/definition.json` v1 | This spec follows its `specStandards`. |

## What changed, in one paragraph

Every output now has a **Version history** view. It lists every version of the output (all rows in its lineage), oldest first, with status, created date, last-modified date, who approved it and when, and a one-line summary of what changed from the previous version. A **timeline slider** scrubs across the versions and re-renders the document as it stood at each one. A **Tracked changes** panel compares any two versions block by block: added blocks, removed blocks, and changed blocks with the inserted and deleted words marked inline. The view is read-only. Re-importing a document with the same file name for the same opportunity now files a new version of that output (same lineage) instead of an unrelated second output, so uploaded revisions can be compared too.

## Data model (additive only)

None. The lineage already is the history. No table, column, seed or bootstrap change; no member row is touched.

## Server

- `server/lib/outputVersionHistory.js` (new): `getOutputVersionHistory(userId, projectionId)` returns `{ lineageRootId, title, versions[] }`, oldest first. Each version carries `versionNo`, `status`, `createdAt` (document's real creation date when recorded, otherwise filed date), `modifiedAt`, `approvedAt`, `approvedBy` (display name), `qrLive`, `header`, `blocks`, `basis`, `warnings`, `changeSummary`. `versionBody()` turns any content shape into document blocks: `document_blocks` as stored; `career_bound` as the wording frozen at approval (`basis: frozen_at_approval`) or, for an unapproved version, resolved against the current Career Master (`basis: current_career_master`, with a note); other generated or imported text flattened into sections without inventing text (`basis: flattened`). A version whose content cannot be read is still listed with an `error` (never dropped) and the failure is logged server-side.
- `GET /api/resume-outputs/:id/versions` (`server/routes/resumeOutputs.js`): member-scoped by `req.user.id` (a foreign id is 404). Read-only, so it adds no finalize path; approving stays on the existing `PATCH /status` / `POST /:id/share` routes that call `assertReadyToFinalize`.
- `POST /api/career-agents/opportunities/:id/import-output` (`server/routes/careerPlacementAgents.js`): when the same member already imported a file with the same name for the same opportunity and output type, the new projection is created with `regenerateFromId` set to the latest of those, so it joins that lineage as the next version.

## Client

- `src/lib/outputVersionDiff.js` (new, pure, shared by server and client): `toDiffItems`, `diffItems`, `diffWords`, `diffVersions`, `summarizeDiff`. Longest-common-subsequence alignment on (type, text); a removed and added block of the same type whose words overlap by at least a third are paired as one **changed** block with a word-level diff.
- `src/components/admin/OutputVersionHistory.jsx` (new): `OutputVersionHistory` (inline) and `OutputVersionHistoryModal` (full-screen, portalled to `document.body`, closes on Escape or backdrop). Failures show an inline alert with Retry and a toast; nothing is swallowed.
- Entry points: My Resume → each Resume Output History row, button **Version history** (`MyResumePanel.jsx`); the career-bound editor, button **Version history** (`CareerBoundOutputEditor.jsx`); World Shell → opportunity detail, section **OUTPUT VERSION HISTORY** with a **Version history** button per output (`WorldShell.jsx`); the World Shell shared block editor bar, button **Version history** (`OpportunityOutputsSection.jsx`).
- `src/lib/api.js`: `getResumeOutputVersions`.

## Behaviour changes to know

- Opening history from a My Resume row starts the slider on that row's version; opening it from the World Shell opportunity list starts on the newest version.
- An unapproved career-bound version shows the **current** Career Master wording (it follows Career Master edits); once approved, its wording is frozen. The view says which applies.
- Importing the same file name again for the same opportunity no longer creates an unrelated output card; it becomes the next version of the existing one (the World Shell outputs list shows one card per lineage).
- Times are shown in UTC.

## Verified (initial check)

- `npm run build` passes.
- Server boots on a fresh database (`sb_rl_bld_4100_3`, port 4106).
- Every journey of `docs/training/output-version-history.md` walked once in Chromium by the build agent; results are in the release log.

## Known limitations

- Comparison is text-level: images and figures are skipped, tables compare as one block per table.
- For an unapproved career-bound version the history can only show the current Career Master wording, because nothing froze it.
- Approved versions created before `shared_snapshot` existed fall back to the current Career Master wording and say so.
- No restore/revert action (read-only by design; to revert, edit and save a new version).

## Fix notes per round

(none yet)
