# Change spec — Career-bound outputs, per-output overrides, and package items in the review queue

Version 1 · 2026-10-02 · release `2026-10-02-application-packages` · feature key `career-bound-outputs`
Branch `release-loop/career-bound-outputs-build`, built on integration head `dd3f321`.

## Traces to

| Earlier spec / commit | Version | How this relates |
| --- | --- | --- |
| `docs/changes/proficiency-rules-and-live-qr.md` (commits `a0ff84a`, `f1ad622`) | v1 | Builds on: Career Master is already the source for proficiency, charts and the QR page. This feature adds the same "Career Master is the source" rule for resume wording. |
| Same spec, addendum (commit `b1ae2d3`) and `server/lib/finalizationGates.js` | addendum | Reused unchanged: every approve / publish / approve-for-QR path still calls `assertReadyToFinalize()` on the server and `useToolCategoryGate().run()` on the client. This feature adds no new finalize path. |
| `docs/changes/failed-commands-reconciliation.md` (commits `8fc685e`, `dd58da6`) | v1 | Followed: no silent failures. Atom-sync failures are stored on the task and shown with a retry; every load error is shown. |
| `docs/training/proficiency-rules-and-live-qr.md` (commit `d502e1c`) | v1 | Not superseded. Its Career Master and My Resume journeys are still valid; this feature adds a card and buttons to My Resume only. |
| `server/lib/packageRoleCheck.js` | — | Its role comparison (company first word, years) is the model for matching a package role to a Career Master job; matching is extended with title/start/end scoring so two roles at one company are told apart. |

Nothing earlier is superseded.

## What changed

Career Master is the source of truth for resume wording ("Career Master + overrides"). A new kind of output, **career-bound**, stores only a *selection* over Career Master — which jobs, which library bullets in what order, which skills, tools and certifications — plus any wording the member changed **for that output only**. It is resolved against Career Master every time it is viewed, downloaded as PDF, or opened from the QR page, so a Career Master edit flows into every career-bound output with no re-save. Anything the member reworded in the output is marked **Overridden for this output** and can be reverted to the Career Master value per field.

An imported application package's roles, bullets, skills and tools that differ from Career Master become reviewable tasks in the existing Career Reconciliation queue ("Career Sources to Review"). **Approve** writes the item to Career Master; **Reject** leaves Career Master as it is and the wording stays in the output as an override. The queue is reachable from the World Shell and from the output editor.

Template-driven outputs already bind to Career Master through the render context (`master`, `proficiency`) and are unchanged.

## Data model (additive only)

| Where | Change |
| --- | --- |
| `career_jobs.bullet_variants JSONB NOT NULL DEFAULT '[]'` | New column (`ADD COLUMN IF NOT EXISTS` in `db.js bootstrap()`). A per-job library of reusable bullet wordings: `[{ id, text, source: { kind: 'manual'\|'package', ref }, createdAt, tags }]`. `key_metrics` is untouched. Existing rows get `[]`; no member row is rewritten. |
| `resume_output_projections.generated_content` (existing JSONB) | New content format `career_bound` v1 beside the existing `document_blocks` v1 (see below). Existing rows are untouched. |
| `resume_output_projections.shared_snapshot` (existing JSONB) | For a career-bound output, approval also freezes `document` (the printed wording as plain blocks) so the QR page can say whether the wording changed. |
| `career_reconciliation_tasks` (existing) | New `task_type` values (a free-text column, no migration): `package_field_conflict`, `package_new_bullet`, `package_add_job`, `package_new_skill`, `package_new_tool`. `entry_type` / `target_table` are `career_job_entry` / `career_jobs` for the first three, `career_skill_entry` / `career_skills` and `career_tool_entry` / `career_tools` for the last two. A decided task's `atom_key` embeds a hash of the claim, so a re-import of the same claim is suppressed. |
| `config_state` id `admin_nav` | Unchanged (fix round 1 removed the build's one-shot injection of a **Career Sources to Review** admin tab). Members have that tab in `memberTabs`; admin reaches the queue from My Resume. |
| `src/lib/worldIslands.js` `ISLAND_REGISTRY` | New keys `careerReconciliation` and (fix round 1) `resume` (append-only registry): an island for any nav that carries those tabs. |

`career_bound` v1 shape:

```
{ format: 'career_bound', version: 1, header: { name, headline, contact },
  sections: [ <document_blocks block> | { type: 'job', jobId }
            | { type: 'master_list', entity: 'skills'|'tools'|'certifications', title?, ids: [rowId], overrides: { [rowId]: text }, extras: [{ id, text }] } ],
  jobs: [ { jobId, bulletIds: [id], extraBullets?: [{ id, text }], overrides?: { [bulletId]: text },
            titleOverride?, datesOverride?, showKeyMetrics?, keyMetricsOverride? } ],
  source?: { kind: 'package', packageKey, variant, projectionId } }
```

`resolveCareerBound()` turns it into `document_blocks` v1 (blocks that differ from Career Master carry `outputOnly: true`). A job or row deleted from Career Master is reported as a warning in the editor and left out; it is never silently replaced.

## Server

- `server/lib/careerBound.js` (new): bullet-library CRUD (each write runs the Career Atom sync and `notifyCareerChanged`, i.e. the same side effects as the Career Master CRUD routes), validation, resolution, create/update, package-to-career-bound conversion (`buildCareerBoundFromPackage`, `convertPackageToCareerBound`), `listGroupsFromDocument` (finds a package's Skills / Tools / Certifications groups), `defaultCareerBoundContent`. Editing an **approved or published** output never alters it: the edit becomes a new draft version in the same lineage.
- `server/lib/packageReconciliation.js` (new): `detectPackageTasks`, `importPackageAsSource`, `resolvePackageTask` (approve / reject), `retryTaskSync`. Approve for skills and tools inserts a Career Master row and awaits the Career Atom sync; if the sync fails the row stays and the task is stamped `metadata.syncError` and listed under "Applied - sync failed" with **Retry sync**.
- `server/routes/careerBound.js` (new, `/api/career-bound`, member-scoped via `requireUser`): `jobs`, `jobs/:id/bullets`, `convertible`, `convert/:id` (+ `/preview`), `outputs`, `outputs/:id`, `review-count`. **No approve or publish route exists here.**
- `server/routes/careerReconciliation.js`: `POST /package-sources`, `POST /tasks/:id/retry-sync`, `status=sync_failed` list; package tasks are resolved by `resolvePackageTask`.
- `server/lib/applicationPackages.js` / `outputRendering.js`: view, PDF and QR page resolve career-bound content; `publicSharedView` returns `documentState { changedSinceApproval, printed }`. The comparison is key-order-insensitive (JSONB reorders object keys).
- `server/db.js`: the new column and the admin_nav tab above. Also fixed a pre-existing first-boot gap: on a brand-new database the My Resume and Inbox tabs were only injected on the second boot; the idempotent injection now also runs right after the first seed.

## Client

- `src/components/admin/CareerBoundOutputEditor.jsx` (new): the output editor (selection, ordering, per-field override with **Revert to Career Master**, output-only entries, add-to-library, preview, Save, link to the review queue).
- `src/components/admin/MyResumePanel.jsx`: **Career-bound resumes** card (name field, **New career-bound resume from Career Master**, **Career Sources to Review**), an **Edit sections** button on career-bound history rows, the editor dialog. Approve / Publish / Approve for QR are unchanged and still wrapped in `categoryGate.run(...)`. A previously swallowed output-list load error is now shown.
- `src/components/admin/CareerReconciliationPanel.jsx`: package import card, package task cards (before / after, **Approve - apply to Career Master**, **Reject - leave Career Master as is**), "Applied - sync failed" list with **Retry sync**, "Imported resumes you can convert" with the editor.
- `src/components/WorldShell.jsx`, `src/lib/worldIslands.js`: **Career Sources to Review** island (3D world and Journeys list) opening the panel, and (fix round 1) a **My Resume** island mounting `MyResumePanel` (WorldShell already wraps everything in `CareerConsentGate`).
- `src/components/DocumentBlocksView.jsx`: `showOutputOnly` badge (owner views only, never on the QR page or PDF). `SharedOutputPage.jsx`: "wording changed since the printed version was approved" banner with **Show printed wording / Show current wording**.

## Behaviour changes to know

- A career-bound output has no frozen text. Changing a Career Master title, dates, bullet, skill, tool or certification name changes every career-bound output on its next view — including the QR page. The QR page therefore shows a banner when the wording differs from the approved printed version and lets the viewer switch to the printed wording.
- A package item is **never** adopted automatically. Until every task of a package is decided, **Convert to career-bound output** is disabled for that package.
- Rejecting a package task keeps Career Master unchanged and keeps the package's wording in the converted output as an override (badge "Overridden for this output"); re-importing the same package does not re-raise a decided task.
- Approving a new tool task adds a tool with no proficiency category; the finalization gate then asks for one when the member approves or shares an output.
- Saving an edit to an approved/published career-bound output creates a new draft; the approved version and its QR link keep meaning what was approved.

## Verified (initial check)

Environment: local Postgres on a freshly created database, `npm run build`, production server on port 3404, Chromium via Playwright, admin test account, fictional data only.

- `npm run build` passes. The server boots on the fresh database with no errors in its log (only the existing notices).
- Every journey in `docs/training/career-bound-outputs.md` (J1–J8) was walked once in Chromium and passed.
- Bugs found and fixed during this walk: (1) the "wording changed" banner showed immediately after approval because JSONB reorders object keys and the comparison was order-sensitive; (2) on a fresh database the My Resume tab was missing until a second boot.
- Browser console: only `ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED` for external fonts/CDN blocked by the sandbox network, and one expected `409` from the finalization gate (J7.1). No page errors.

## Known limitations

- Skills and tools are matched to Career Master by exact name (case and punctuation ignored); a near-name ("Process Design" vs "Process design") matches, a synonym does not and is raised as new.
- Matching a package role to a job uses company first word plus title/start/end scoring; an ambiguous match is raised as "Add job" rather than guessed.
- The approve / publish / QR buttons stay in My Resume → Resume Output History (by design, so the finalization gate has one home); the editor points there.
- Per-output overrides for template-driven outputs cover job Title, Start date, End date and Key metrics, and (round 2) skill name, tool name and certification name (Output Templates → Sections). The resume layout prints only jobs, so skill/tool/certification overrides show only where a chosen layer renders those names.
- Template-driven overrides live in the template (preset) config, so they apply to every view of that preset, not to a separate saved document.

## Fix notes per round


### Fix notes — round 1

Branch `release-loop/career-bound-outputs-fix-r1`. Environment: fresh local Postgres database, `npm run build`, production server on port 4114, Chromium via Playwright, fictional data only. Journeys J1-J8 were re-walked **as `member@test.local`** (from `/world` → Journeys, no Classic Tools); J9-J11 are new (training spec v2).

**cbo-r1-phone-editor** — The editor grid was a fixed two-column inline grid, unusable at 390 px.
- Changed: `CareerBoundOutputEditor.jsx` `S.wrap` is now `repeat(auto-fit, minmax(min(100%, 360px), 1fr))` so the columns stack on narrow dialogs; the Title/Dates pair in each job card wraps (`flex: 1 1 220px`); `MyResumePanel.jsx` dialog padding is `clamp(0.5rem, 2.5vw, 1.25rem)` and width `min(1200px, 98vw)`.
- Checked: Journey 10. At 390 px the Title box is 330 px wide, Preview is full width below the cards (363 px), no horizontal scroll (document and dialog scrollWidth equal their client width); at 1200 px the two columns sit side by side.

**career-bound-outputs-B9** (commit trailer, process) — Not changed. The task text asks for `Co-Authored-By: Claude Opus 5.5`; the session's own attribution reminder says `Claude Sonnet 5.5`, and this agent is Sonnet. I did not claim to be another model: this branch's commit carries the Sonnet trailer. Owner decides; if the Opus trailer is wanted, amend the trailer locally (`git commit --amend`), do not push.

**career-bound-outputs-B10** (spec gaps G3, G4, G5)
- G3 template overrides: new `src/lib/masterOverrides.js` (`applyMasterOverrides`, `withOverride`); `Output.jsx` `OutputTemplateBody` applies `config.masterOverrides` over `master` and `ctx.master`; `OutputTemplateConfigurator.jsx` (Sections tab) has the card "Career Master wording for this output only" with the `Overridden for this output` badge, the Career Master value and **Revert to Career Master** per field. Additive: the key is absent on every existing template; nothing is rewritten. Checked: Journey 9 (editor badge/revert, configurator live preview, saved `/output/resume?owner=me`, revert flows Career Master back).
- G4 certifications: `packageReconciliation.js` raises `package_new_certification` (entry type `career_certification_entry`, table `career_certifications`), approve inserts the row (status Active) and awaits the Career Atom sync, same retry path as skills/tools; `CareerReconciliationPanel.jsx` labels it **New certification**; `routes/careerReconciliation.js` orders it. Conversion stays blocked until decided. Checked: Journey 6 (6 tasks, approve, Certifications (2), re-import suppressed).
- G5 live preview: new `POST /api/career-bound/outputs/:id/preview` (resolves unsaved content, writes nothing); the editor debounces edits (350 ms) and shows "Preview (live, not saved yet)", or a visible error if the preview call fails. Checked: Journeys 2 and 3.

**career-bound-outputs-B11** (nav) — `server/db.js` no longer injects the `careerReconciliation` tab into `admin_nav`. The World Shell Journeys card (members, via `memberTabs`) is the primary route; `MyResumePanel.jsx` opens the queue as a dialog over itself (portalled to `<body>`) from its **Career Sources to Review** button and from the editor's button, replacing the `sb-admin-switch-tab` event that only worked inside Classic Tools. Checked: Journeys 6.1, 6.10, 11; `admin_nav` row on the fresh database does not contain `careerReconciliation`.

**career-bound-outputs-B12** (World Shell reach) — `src/lib/worldIslands.js` has a `resume` entry and `WorldShell.jsx`'s `SIMPLE_EMBED_COMPONENTS` mounts `MyResumePanel` (member and admin scope). Checked: Journeys 1-8 all start at Journeys → My Resume; Journey 11 for admin.

**career-bound-outputs-B13** (spec and walk written for admin) — `docs/training/career-bound-outputs.md` rewritten to v2 for `member@test.local` (created by `scripts/create-test-member.mjs`), every route starts at `/world` → Journeys; J9-J11 added; J2/J3 gained live-preview steps; J6 gained the certification task. All of J1-J11 were walked in Chromium and passed. Two things in the walk were test-script mistakes, not product: an uppercase-CSS text comparison, and the QR link being text rather than an anchor (spec step 7.3 now says so).

## Fix notes — round 2

- **cbo-r2-inherited-cream-text** — Light cards inherited cream text from the World Shell. Set explicit dark text (`#1b2a3b`) on `S.wrap`/`S.card` in `CareerBoundOutputEditor.jsx` and `OutputTemplateConfigurator.jsx`, on the two white dialog inner divs in `MyResumePanel.jsx` and on the one in `CareerReconciliationPanel.jsx`; darkened the configurator's `S.label` (`#888` to `#5f5f5f`, was 3.35:1 on the cream card) and the job company hint (`#aaa` to `#6a6a6a`). `WorldShell.jsx` left unchanged. Training spec v3 adds a binding "Legibility check" (4.5:1 at 1280 and 390 px) and steps in J9 and J10. Checked: Playwright against a fresh database at 1280 and 390 px, editor labels 14.57:1, template card heading 6.03:1; `npm run build` passes. Sweep of other light-card tools reachable from World Shell was not exhaustive; the four named surfaces were fixed and checked.
- **career-bound-outputs-F1-3** — Added card "Skills, tools and certifications wording for this output only" in `OutputTemplateConfigurator.jsx` (select to pick an item, box, Overridden badge, Career Master line, Revert to Career Master), storing under `config.masterOverrides.skills|tools|certifications` through the existing `withOverride`. Additive; no change to `masterOverrides.js`. Spec J9 steps 6-11 added. Checked: browser walk edited all three, saved preset JSON held `masterOverrides.{skills,tools,certifications}`, revert removed only the skill override, Career Master unchanged.
- **career-bound-outputs-F1-4** — Not changed. Whether overrides may live on the preset rather than on a saved per-document row is an owner decision (see Known limitations); no code change until the owner answers.
- **career-bound-outputs-F1-5** — Spec only. v3 states that J7 (including 7.4) runs before J8 and the ordering is binding; J7 also carries a reminder line. No code change.
- **career-bound-outputs-F1-7** — Not changed. Two conflicting trailers exist (task text says Opus 5.5, the session attribution reminder says Sonnet 5.5); this round's commit follows the session attribution reminder. Owner/orchestrator to decide; nothing was amended or pushed.
- **career-bound-outputs-F1-8** — Process only: this fix round wrote results here, not in `docs/test-results/career-bound-outputs/round-N.md`; the round-2 validation agent writes that file. Nothing to change in code.
