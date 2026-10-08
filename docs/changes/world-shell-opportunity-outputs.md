# Change spec — World Shell navigation to a tracked job opportunity, its linked outputs, provenance and the shared editor

Feature key: `world-shell-navigation` · Release: `2026-10-02-application-packages` · Version 1 · 2026-10-02
Branch: `release-loop/world-shell-navigation-build` (built on integration head `dd3f321`)
Training spec: `docs/training/world-shell-opportunity-outputs.md`

## Traces to

| Earlier spec / commit | Version | How this builds on or supersedes it |
| --- | --- | --- |
| `docs/changes/proficiency-rules-and-live-qr.md` | commits `a0ff84a`, `f1ad622`, `b1ae2d3` (+ addendum "every technology needs a proficiency category") | Builds on: the finalization gate (`assertReadyToFinalize`, `useToolCategoryGate().run`) and the live QR page. Approve for QR from the World Shell uses exactly that gate; nothing superseded. |
| `docs/training/proficiency-rules-and-live-qr.md` | commit `d502e1c` | Journey 6 (finalizing requires a category) is re-exercised from the World Shell rather than from My Resume. |
| Application packages + QR-gated outputs | commits `d78bcda`, `76b33ad` (CLAUDE.md "Tailored application packages + QR-gated sharing") | Builds on `importApplicationPackage`, `approveOutputForSharing`, `resume_output_projections` document_blocks. The import script gains `--link-opportunity`. |
| `docs/changes/failed-commands-reconciliation.md` | commits `8fc685e`, `dd58da6` | Same rule applied here: every failure is shown to the user (inline alert + toast), none swallowed. |
| Career Placement Agents Phase 2/3 (CLAUDE.md "Career Placement Agents / Weekly Research & Outreach pipeline") | 2026-08-06 → 2026-08-09 | Builds on: `career_opportunity_target` rods, `resume_output_projections.career_opportunity_rod_id` (the link column already existed since 2026-08-07), the World Shell docked panel. Nothing superseded. |
| Release loop definition | `server/data/releaseLoop/definition.json` v1, commit `2086080` | This spec follows its `specStandards`. |

## What changed, in one paragraph

A member can now do the whole job-application journey from the World Shell (`/world`) alone: log in (the shell now sends a member who still has a provisioning password to the password page, and shows the Career Portfolio terms prompt, instead of rendering an empty world), open **Journeys → Career Placement Agents**, create a placeholder opportunity (company + role), see every application output linked to it with **provenance** (source, imported/generated date, authors, version, lineage, the Career Master state it was filed against, link to the Career Master), open a draft in the **existing shared block editor** (`HerqOutputConfigurator`, via an adapter — no new editor), save it as a **new draft version in the same lineage**, and **Approve for QR** through the finalization gate. A UI action links/unlinks existing outputs; the package import script can create/link the placeholder from the package JSON.

## Data model (additive only)

| Where | What | Notes |
| --- | --- | --- |
| `resume_output_projections.career_opportunity_rod_id` | **Existing** nullable column is the link (no new link table) | A link applies to a whole lineage (`lineage_root_id`), so a newly saved version stays on its opportunity. |
| `resume_output_projections.parent_version_id` | **New** nullable `BIGINT`, added by `ALTER TABLE … ADD COLUMN IF NOT EXISTS` at the end of the existing resume-projection block in `db.js bootstrap()` | The version an edited draft was saved from. Never backfilled; older rows are `NULL`. |
| `journey_data_rods.metadata` (career_opportunity_target) | New optional key `placeholder: true` (JSONB, additive) | Set when an opportunity is tracked with only company + role; cleared when any detail (URL/location/notes) is saved. |
| `src/lib/outputBlocks.js` `BLOCK_DEFS` | Two appended block types: `role-line`, `document-preserved` | Append-only registry rule honoured; `document-preserved` is `hidden` from the add-block palette. |

No seed or bootstrap code writes member rows.

## Server

- `server/lib/opportunityOutputs.js` (new):
  - `listOpportunityOutputs(userId, rodId)` — one entry per document (lineage), newest version, with a computed `provenance` block: source label (`Imported application package` / `Imported document (uploaded by you)` / `Generated from your Career Master`), imported-or-generated date, document-created date, last-changed date, authors, approval, version number of count, lineage chain (with which version holds the QR), `careerState` (fingerprint and atom count the output was filed against vs. the Career Master now, from `computeCareerStateFingerprint`), plus Career Master row counts and whether the member's Salt Basin site is published.
  - `linkOutputToOpportunity` / `unlinkOutputFromOpportunity` (lineage-wide, ownership-checked on both the output and the opportunity), `listUnlinkedOutputs`.
  - `getOutputContentForEdit` / `saveEditedVersion` — `document_blocks` content is edited as-is; an imported plain-text document (`{ rawText }`) opens as paragraph blocks. Saving calls `createResumeOutputProjection({ regenerateFromId })` so the new draft joins the same lineage, keeps authors / source / creation date / opportunity link, and records `parent_version_id`. Unchanged content is refused (`No changes to save.`). Approved versions and their QR are never touched.
  - `ensurePlaceholderOpportunity`, `updateOpportunityDetails`.
- `server/routes/careerPlacementAgents.js`: `PATCH /opportunities/:id`; `GET /opportunities/:id/outputs`; `GET /unlinked-outputs`; `POST|DELETE /opportunities/:id/outputs/:outputId/link`; `GET /resume-outputs/:id/content`; `POST /resume-outputs/:id/versions`. `POST /opportunities` marks a company+role-only track as `placeholder`.
- `server/routes/resumeOutputs.js`: `POST /import-package` accepts `linkOpportunity`; validates `company` and `role` in the package **before** importing (a bad package imports nothing); creates or reuses the placeholder (case-insensitive company + role match) and links every imported output. If linking fails after a successful import the error says exactly that (outputs imported, link failed, re-run to retry; unchanged outputs are skipped).
- **Finalize path unchanged and reused:** Approve for QR calls `POST /api/resume-outputs/:id/share` → `approveOutputForSharing` → `assertReadyToFinalize`.
- `scripts/import-application-package.mjs --link-opportunity`; `scripts/extract-application-package.py --role` (writes `role` into the gitignored package JSON). The company and role are read from the package file only.

## Client

- `src/components/OpportunityOutputsSection.jsx` (new), mounted in the World Shell docked career panel for the selected opportunity: placeholder card with "Save details"; linked output cards with the provenance list, **Edit draft**, **Approve for QR** (inline confirmation, then `useToolCategoryGate().run(() => api.shareResumeOutput(id))`), **Unlink**; **Link an Existing Output** select. Errors show in an inline `role="alert"` and a toast. The editor and the gate prompt are portalled to `<body>` because the rail uses `backdrop-filter`, which makes it the containing block for `position: fixed` (without the portal both clipped to the 300px rail — found while building).
- `src/lib/documentBlocksEditor.js` (new): lossless adapter between `document_blocks` v1 and the editor's `{ blocks }` config (each editor block keeps its source document block; tables/figures are carried as read-only "Preserved content" blocks and written back untouched; hidden blocks are left out of the saved document).
- `src/components/admin/HerqOutputConfigurator.jsx`: optional `adapter` + `initialSelectedId` props → "document mode" (content `props.*` fields only, no merge tokens, no Component Review, no Publish; Save goes through the adapter; palette limited to Heading / Body Text / Bullet List / Role Line). Without an adapter behaviour is unchanged. New: stacked layout on narrow screens (≤ 820px) so the editor is usable at 390px.
- `src/components/WorldShell.jsx`: outer `WorldShell` now (1) sends a member with `mustChangePassword` to `/first-login-password?next=/world`, (2) wraps the shell in `CareerConsentGate` — both are the "required first steps" `MemberDashboard` already enforced and the World Shell did not, leaving the world empty with every member API answering 428; (3) a failed island/config load is now shown ("Your islands could not be loaded: …") instead of swallowed; (4) "Open my Career Master" returns to the same opportunity; (5) phone layout (`MOBILE_CSS`, ≤ 700px): top bar wraps, rail spans the screen.

## Behaviour changes to know

- A member's first visit to `/world` now goes through the password page and the Career Portfolio terms prompt when those are outstanding (previously: an empty world).
- Saving in the editor never changes an existing version: it always creates the next draft. If version N is approved for QR, the QR keeps opening version N until the member approves the newer version, then the same link moves to it.
- An imported plain-text document can be edited; the saved version is `document_blocks` and the original text version stays in the lineage.
- Outputs generated in other shapes (AI-generated resume/cover-letter JSON) show "Edit draft" unavailable with the reason; they can still be linked, unlinked and approved.

## Verified (initial check)

- `npm run build` passes (Vite production build).
- Server boots on a fresh Postgres database (the new `ALTER TABLE` is idempotent; two boots checked).
- Every journey in the training spec walked once in Chromium on a fresh database at 1280×900 (28 steps) and at 390×800 (4 steps): all pass; the only non-2xx responses are the intentional ones (the "No changes to save" 400s and the finalization-gate 409s) and the browser's `favicon.ico` 404. External font/CDN requests fail in the sandbox (no internet) and are unrelated.
- No horizontal scroll at 390px; rail, editor, confirmation and gate dialog all inside the viewport.

## Known limitations

- Making the first package output exist still needs a way to file a `document_blocks` package: that is the import script (CLI); there is no in-app upload for a package JSON. The in-app equivalent that exists is "Import Resume (PDF/DOCX/TXT)", which is editable.
- The editor edits text content (headings, paragraphs, bullets, role lines, header, contact line). Tables and figures are preserved, not editable. Style fields (fonts/colours) are intentionally not editable because they do not persist into a document.
- The wide 3D world labels (huge island label while the camera dollies in) are existing behaviour and unchanged.
- The World Shell rail is 300px on desktop, so provenance wraps tightly; it is complete but not spacious.
- The database name assigned to this agent (`sb_rl_bld_1`) was dropped and recreated by another concurrently running workflow using the same name, so verification ran on `sb_wsn_build` (own name). See the failures list in the build report.

## Fix notes per round

(none yet — appended by fix agents)
