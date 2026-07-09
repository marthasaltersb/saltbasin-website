# Handover — Configurable Platform Initiative (Phases A–C)

**Date:** 2026-07-08
**Scope of this handover:** the multi-phase "configurable page/section/output object model" build (Betsy's original request: page types, section layout, drag-reorder, per-column sub-section widgets, button classification, output configurator, content-mapping). Phases A, B, and C are built and verified this session. This doc also captures everything needed to log this work into the Contribution Intelligence / backlog / deployment pipeline, which is a **separate, actively-developed system** another concurrent session has been working on in parallel — read section 6 before touching `server/db.js`, `backlog_items`, or anything cost/hours-related.

---

## 1. Original request & phasing decision

Betsy asked for a fully configurable platform: page types with editable templates, per-section layout (width/height/columns/theme) with drag-to-reorder, buttons with classification (URL/output/popup/custom) and placement, output template configuration with data-path content mapping and executive-summary rollups, and per-column sub-section display widgets (photo/slideshow/form/infographic-wheel), leveraging/expanding the existing My Resume feature.

Given the size, Betsy chose **"Foundation first"** sequencing. Agreed phase order (A/B/C done, D/E/F not started):

- **Phase A** — Section layout config + drag-to-reorder Layout view. ✅ Built & verified.
- **Phase B** — Page type registry (New Page type picker → editable templates). ✅ Built & verified.
- **Phase C** — Per-column sub-section widgets (photo/slideshow/form/wheel) via a new `flexColumns` section type; generalized the hardcoded `IndustryWheelBlock`. ✅ Built & verified.
- **Phase D** — Button classification (URL/output/popup/custom) + placement. **Not started.**
- **Phase E** — Output configurator generalization: executive-summary rollups, data-path binding, interactive-vs-static content, expand HerqOutputConfigurator + migrate My Resume onto it. **Not started.**
- **Phase F** — Section content-mapping workflow (rollup-type sections like Client Snapshot/Domains select underlying data; wheel node text referencing an existing field elsewhere on the site). **Not started** — explicitly deferred pending Phase E's data-path infrastructure.

Original scoping notes worth preserving:
- The user chose the harder, truer-to-spec option for Phase C: **real per-column widget slots**, not just new top-level section types (this was a genuine architecture fork — see Phase C plan below).
- The user wanted to fix an admin-login 500 error "first" at one point — investigated, found it was transient (DB pool contention during dev-server cold-start bootstrap, not a code bug); confirmed via a wrong-password test against the real admin email (401, not 500) and a working login with a different account. Nothing to fix in that code path.

---

## 2. What was built

### Phase A — Section Layout Foundation
- `section.layout` (optional, additive): `{ width: 'full'|'contained'|'narrow', height: {mode:'auto'|'fixed', px}, padding: {mode:'default'|'custom', top, bottom}, columnGap (reserved, not exposed in UI) }`.
- `src/components/blocks/SectionShell.jsx` — wraps `RenderSection`'s output; `!section.layout` → zero-DOM pass-through (backward compatible). Applies width via outer `maxWidth`/`margin`; height/padding via `useLayoutEffect` + `el.style.setProperty(..., 'important')` reaching into the block's own root `<section>` (blocks set these inline, so CSS alone can't override).
- `src/components/admin/SectionLayoutFields.jsx` — shared width/height/padding/columns/bg controls, used both in `EditorPane`'s new "Layout" card and Phase A's `PageLayoutView`.
- `src/components/admin/PageLayoutView.jsx` — new "Layout" tab in the content editor (`AdminShell.jsx` `view` state), drag-reorder via `@dnd-kit/core` + `@dnd-kit/sortable` (new deps), section summary cards with inline settings drawer.
- `AdminShell.jsx`: `reorderSections(newSections)` mutator (rides the existing `patchDraft` pipeline, no new API call needed — `site_state`/`member_sites` are opaque JSON blobs, zero server changes for this whole phase).
- **Bug found + fixed during testing:** `SectionLayoutFields` originally built layout patches by spreading the *previous* layout from React props — two edits in the same render tick (e.g. fast clicks) clobbered each other. Fixed by moving the merge into `AdminShell.updateSection`, which now special-cases a `layoutPatch` key and merges it against the *live* draft state inside the `patchDraft` functional updater, not a stale prop closure. This is the general fix pattern — see section 4's note on remaining risk in Phase C's nested editors.

### Phase B — Page Type Registry
- New `config_state` row `page_type_definitions`, seeded in `db.js` `bootstrap()` (same check-then-insert pattern as `admin_nav`): 4 default types (Standard/Landing/Blog/Shop), each with a `defaultSections` template.
- `GET`/`PUT /api/config/page-types` (admin-only, `server/routes/config.js`) + read-only `GET /api/member-config/page-types` (`server/routes/memberConfig.js`) — page types are a **platform-wide shared taxonomy**, not per-member data; only admin edits it, both scopes read it.
- `api.js`: `getPageTypes`, `getMemberPageTypes`, `updatePageTypes`.
- `PageModal` in `AdminShell.jsx` is now data-driven (type dropdown + description, from the loaded registry) with an admin-only "Manage Page Types →" link.
- `addPage()` clones the selected type's `defaultSections` (fresh ids, `{{pageName}}` substitution) instead of always seeding one hardcoded Hero. Falls back to today's single-Hero behavior if the registry hasn't loaded — zero regression.
- New `src/components/admin/PageTypeManagerPanel.jsx` — admin CRUD for types + their default sections, reuses `SectionTemplateModal`'s exported `TEMPLATE_CATEGORIES` for the "which block type" picker.

### Phase C — Per-Column Sub-Section Widgets
- New section type `flexColumns`: `section.fields.flexCols = [{ id, widgetType, config }]`. Widget types: `text` (default, matches old `ColumnsBlock` look), `photo`, `photoSlideshow` (auto-advance + prev/next), `userForm` (submits through existing `/api/leads`, zero new backend), `wheelInfographic`.
- New `src/components/blocks/ColumnWidgets.jsx` — `WIDGET_REGISTRY`, `WIDGET_TYPES`, `FlexColumnsBlock`, and the generalized `WheelDisplay(centerLabel, nodes, renderDefaultPanel?)`.
- **`IndustryWheelBlock` generalized**: now reads `section.fields.wheelNodes`/`wheelCenterLabel`, falling back to `DEFAULT_INDUSTRY_WHEEL_NODES` (the original 8 hardcoded industries, `expandText` reformatted from the old structured `{clientCount, revenueRange, description, notable[], workTypes[]}` dashboard into readable prose via `formatDashboardText`). Zero visual change until an admin edits it. **Trade-off flagged to and accepted by Betsy**: the rich structured per-industry dashboard (2 stat boxes + badge list + bulleted list) became one text block — content preserved, layout simplified for reusability.
- New shared files (extracted to avoid circular imports): `src/components/blocks/blockUtils.jsx` (`useViewportWidth`, `PanelCard` — pulled out of `blocks/index.jsx`), `src/components/admin/ImageUploadField.jsx` (pulled out of `EditorPane.jsx`).
- New `src/components/admin/FlexColumnsEditor.jsx` — per-column widget-type picker + widget-specific config UI; exports `WheelNodesEditor` (reused by both the wheel column-widget config AND a new dedicated "Wheel" card in `EditorPane.jsx` for the legacy `industryWheel` section, since that field doesn't exist in `section.fields` on old sections and needed an "always show, seed-from-defaults" card rather than generic field iteration).
- `userForm` submissions: known field keys (`email`/`name`/`phone`) map to `/api/leads`' named columns; any other custom field gets appended to `message` as `"Label: value"` lines. Scoping boundary: custom fields aren't individually queryable later.

**Full verification transcript for all three phases is in this conversation's history** (screenshots/DOM assertions via a throwaway QA test account — see section 5).

---

## 3. Files touched (for a fresh session's orientation)

**New files (all Phase A/B/C, safe to keep):**
```
src/components/blocks/SectionShell.jsx
src/components/blocks/blockUtils.jsx
src/components/blocks/ColumnWidgets.jsx
src/components/admin/SectionLayoutFields.jsx
src/components/admin/PageLayoutView.jsx
src/components/admin/PageTypeManagerPanel.jsx
src/components/admin/FlexColumnsEditor.jsx
src/components/admin/ImageUploadField.jsx
```

**Modified files that are MINE (Phase A/B/C):**
```
server/db.js                              (page_type_definitions seed — additive block near end of bootstrap())
server/routes/config.js                   (GET/PUT /page-types)
server/routes/memberConfig.js             (GET /page-types, read-only)
src/lib/api.js                            (getPageTypes/getMemberPageTypes/updatePageTypes)
src/components/admin/AdminShell.jsx       (pageTypes state, reorderSections, Layout view tab, PageModal changes)
src/components/admin/EditorPane.jsx       (Layout card, Wheel card, flexCols dispatch)
src/components/admin/SectionTemplateModal.jsx  (exported TEMPLATE_CATEGORIES, added Flexible Columns template)
src/components/blocks/index.jsx           (SectionShell wiring, FlexColumnsBlock registry entry, IndustryWheelBlock generalization)
package.json / package-lock.json          (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)
.claude/launch.json                       (added saltbasin-api + saltbasin-client-2 preview configs — see section 5)
```

**⚠️ Modified/untracked files in the working tree that are NOT mine — belong to the concurrent Contribution Intelligence session:**
```
src/components/admin/MemberPlmPanel.jsx   (modified, not by me)
src/data/platformLifecycleConfig.js       (modified, not by me)
src/data/backlogFieldSchema.js            (untracked, not by me)
src/data/platformModules.js               (untracked, not by me)
backlog-current-for-betsy-recompute.json, backlog-full.json, backlog-snapshot.json,
betsy-hours-recompute.json, correlation-report.json, cost-reconciliation-plan.json  (all untracked analysis artifacts, not mine)
Tempsite.json, HERQ/, AlgebraTriggerNometryFF07.04.26.zip/.pdf, "output versions/"  (untracked, origin unclear, not mine — don't delete without asking)
```

**Nothing from this session has been committed.** `git status` is currently a mix of two sessions' uncommitted work in the same working tree. **Do not `git add -A` / commit blindly** — stage Phase A/B/C's files explicitly by path if/when Betsy asks for a commit, and coordinate on `server/db.js` specifically since both sessions have live edits there (my `page_type_definitions` seed block sits near the end of `bootstrap()`; diff carefully before committing to make sure the other session's edits to the same file aren't clobbered).

---

## 4. Known limitations / accepted risks

1. **Nested list editors (Phase C) can theoretically lose an edit** if two different fields in the same array (slideshow images, form fields, wheel nodes) are changed within the same React render tick — same root cause as the Phase A layout bug, not fully re-architected for the deeply-nested case (would require a JSON-patch-path system through `patchDraft`, judged disproportionate effort for the actual risk). Didn't reproduce in realistic one-at-a-time testing. Flag if a "field didn't save" report ever surfaces from a flexColumns section.
2. **Admin-scope UI was never directly click-tested.** `AdminShell`/`EditorPane`/`PageLayoutView` are the exact same components for `scope='admin'` and `scope='member'` with zero scope branching in any new code, so member-scope verification is a strong proxy — but genuine admin-login click-through hasn't happened. Reason: a standing policy this session established — **never use Betsy's real admin password for automated testing** (the auto-mode classifier blocked two attempts; correctly, since it's a live credential against the production Supabase DB). All testing used a throwaway QA member account instead (see section 5).
3. **`PageTypeManagerPanel`'s add/edit/save flow** (Phase B) is code-reviewed but not click-tested — it's admin-only, gated behind the same login policy above.
4. Phase C's `flexColumns` is the reference implementation of per-column widgets. It is **not** retrofitted onto other existing multi-column blocks (`CardsBlock`, `StatGridBlock`, etc.) — that's explicitly out of scope for this pass per the approved plan.

---

## 5. Test environment state — cleanup or reuse

- **Throwaway QA test member account** created for verification (real row in the live Supabase DB, not sensitive): email `claude-phasea-qa-test@example.com`, password `Throwaway-QA-Pass-1`, slug `phasea-qa-test`. Its Home page now has test content added during verification: a "Flexible Columns" section (photo + slideshow + form + wheel columns, all with placeholder picsum.photos images and a test lead submission), and a fresh "Industry Wheel" section with one edited node label. **Delete this account or its test sections whenever convenient** — flagged to Betsy already, not yet actioned.
- Test lead created via the form-widget verification: lead id `12`, public id `GU3DQQ`, email `phasec-qa-test@example.com` — harmless test data in the leads/CRM pipeline, safe to ignore or delete.
- **`.claude/launch.json`** has two new preview configs added this session because the standard ports were occupied by the *other* concurrent session's dev servers:
  - `saltbasin-api` (port 3001, `npm run server`) — standalone API server, useful because running the combined `npm run dev` script through the preview tool causes both Vite and Express to inherit the same injected `PORT` env var and collide on 5173.
  - `saltbasin-client-2` (port 5175, `npm run client -- --port 5175`) — a second Vite instance for when port 5173 is taken by another session; its `/api` calls still proxy to `localhost:3001` (hardcoded in `vite.config.js`), so it works fine against whichever API server is already running.
  - Check `preview_list`/port availability before starting new instances — don't assume 3001/5173 are free.

---

## 6. Contribution Intelligence / Backlog / Deployment context (for logging this session's work)

A separate, actively-developed system (not part of this session's work, maintained by a concurrent session — 10 commits in the last hour of git history, e.g. `2bb3fae`, `751bfa6`, `2af1405`, `8ba0053`) tracks Director (Betsy) vs Claude hours/cost per backlog item and produces patch notes. **Read this before adding backlog items or touching cost fields.**

### Rates & cost formula (current, confirmed correct as of `2af1405`)
- `rate_configs` table (`server/db.js`) + `server/data/contributionMethodology.js` (`RATE_CONFIGS_2026`): **Director $225/hr**, **Claude (ai_senior) $115/hr**, benchmark offshore $65/hr, benchmark onshore $175/hr.
- **`cost_usd_claude = hoursClaude × $115`**
- **`traditional_cost_usd = (hoursClaude + hoursBetsy) × $175`**
- **`activitiesClaude = CEILING(hoursClaude × 6)`**, **`activitiesBetsy = CEILING(hoursBetsy × 3)`**
- Documented at `TECHNICAL_DESIGN_SPEC.md:457,459` and `FUNCTIONAL_TECHNICAL_MAPPING.md:212`. **Do not use** the old `$0.02/min` (`seed.js`) or `totalHours × 2.5 × $150/hr` (old spec docs) formulas — both retired this week (`8ba0053`, `2af1405`).

### `backlog_items` — the relevant Contribution Intelligence columns
`session_id, l2r_stage, contribution_type, est_director_hours, est_claude_hours, actual_director_hours, actual_claude_hours, oversight_intensity, automation_potential, patch_note_version, data_source (default 'estimated'), fee_type, hours_strategic_direction, hours_domain_authoring` — added in the v0.17 migration batch, `server/db.js` ~line 1683.

### How new backlog work gets logged (the actual convention — no generic CLI exists)
Copy the most recent `scripts/add-v0XX-backlog-items.mjs`-style script, write new item objects, run it once. Each script logs in via `POST /api/auth/login` using `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD` from `.env`, then `POST`s to `/api/backlog/items` against **production** (`PUBLIC_BASE_URL`, defaults `https://saltbasin.net`), upserting idempotently by `externalRef`. **This session's Phase A/B/C work has not yet been logged as backlog items** — a fresh session should write e.g. `scripts/add-configurable-platform-backlog-items.mjs` covering the three phases (suggest one item per phase, `externalRef` like `configurable-platform-phase-a/b/c`, `patch_note_version` set once a version number is assigned).

### Hours — not yet computed for this session
`scripts/extract-classify-turns.mjs` parses this session's Claude Code JSONL transcript (from `~/.claude/projects/C--Users-mbets-saltbasin-website/`), classifies bursts into `strategic_direction`/`domain_authoring`/`active_supervision`, and writes `turn-classification.json` — but it requires **manually adding this session's id/filename to its hardcoded `SESSIONS` map** (lines 35–41) first; there's no auto-discovery. Do this before estimating `hours_director`/`hours_claude`/`hours_strategic_direction`/`hours_domain_authoring` for the backlog items above, rather than guessing.

### Patch notes / CHANGELOG / versioning
- `server/data/patchNotes.js` — hardcoded, manually-authored array, newest entry last. Latest is `v0.18.5`. No automatic generation.
- `CHANGELOG.md` — manually maintained; head entry is "Session 9 — 2026-07-07 — Contribution Intelligence Reconciliation (v0.18.1–v0.18.5)."
- No single `CURRENT_VERSION` constant — the highest version string across `patchNotes.js` entries is the de facto current version. This session's work would logically be the next entry (e.g. `v0.19.0`) once logged.
- `build_progress_snapshots` table exists (`server/db.js` ~line 758) but no insert call was located in this pass — grep `server/routes/` for it before assuming how/when it's populated.

### Six untracked root JSON files
All are **one-off analysis artifacts** from the other session's reconciliation work (not a recurring pipeline, not referenced by production code): `backlog-current-for-betsy-recompute.json`, `backlog-full.json`, `backlog-snapshot.json` (via `scripts/fetch-backlog-snapshot.mjs`), `betsy-hours-recompute.json`, `correlation-report.json`, `cost-reconciliation-plan.json` (consumed by `scripts/reconcile-backlog-cost-fields.mjs`). Leave them alone unless the other session's work references needing them updated — they're not yours to regenerate.

---

## 7. Suggested next steps for the next session

1. **Reconcile the shared working tree first** — diff `server/db.js` and `src/components/admin/AdminShell.jsx` carefully; both this session and the concurrent Contribution Intelligence session have live uncommitted edits in them.
2. **Log this session's work into the backlog** per section 6, once hours are computed via `extract-classify-turns.mjs`.
3. **Continue with Phase D** (button classification/placement) if Betsy wants to keep going on the configurable-platform arc — same process as A/B/C: research existing button patterns (`SectionActionsEditor` in `EditorPane.jsx` already has a working buttons-array editor with label/link/style — Phase D generalizes classification beyond plain URLs to output-route/popup/custom), write a plan, get explicit approval via the plan-mode workflow, implement, verify with the QA test account, never touch Betsy's real admin login.
4. Consider deleting or repurposing the throwaway QA test account and its test sections (section 5) once no longer needed for verification.
