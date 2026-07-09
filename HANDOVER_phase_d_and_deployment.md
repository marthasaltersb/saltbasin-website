# Handover — Phase D complete; ready for commit + deploy

**Date:** 2026-07-08
**Scope:** Picks up from [HANDOVER_configurable_platform.md](HANDOVER_configurable_platform.md) (Phases A–C, still accurate, read it first for that context). This doc covers Phase D (built + verified this session), backlog logging for all four phases, and everything needed to commit and deploy. **Nothing from Phases A–D is committed yet.**

---

## 1. What's new since the last handover

- **Phase D — button classification (URL/output/popup/custom) + placement** — built and verified live against the QA test account. Full design rationale is in the plan file: `C:\Users\mbets\.claude\plans\deep-munching-dahl.md`.
- **All four phases (A/B/C/D) logged to the backlog** via two new scripts (see §3).
- **Confirmed**: the concurrent Contribution Intelligence/PLM session's `scripts/add-v019-backlog-items.mjs` has now been **run** — items 114/115 exist live under the `v0.19` tag. This work must use `v0.20` or later once a human assigns real version numbers; do not use `v0.19`.

## 2. Phase D — what was built

New explicit `type` field on each `section.fields.actions[]` entry: `'url' | 'output' | 'popup' | 'custom'` (defaults to `'url'` when absent — zero migration, existing content renders unchanged). New `section.fields.actionsPlacement`: `'left'|'center'|'right'|'stacked'`.

- **`src/components/admin/EditorPane.jsx`** — `SectionActionsEditor` rewritten: per-row Type select, a Placement control, a `PopupActionConfig` sub-editor (kind: form/media/output — form reuses `FlexColumnsEditor.jsx`'s now-exported `FormConfig`, media reuses `ImageUploadField`, output uses the existing `OUTPUT_ROUTES` list), and a Custom Action dropdown (4 fixed, hardcoded actions — deliberately not arbitrary code, to avoid an injected-JS/XSS surface on a DB-round-tripped field). The redundant second render path for the `actions` field (generic field-iteration dispatch, which duplicated the always-visible "Action Buttons" card) was removed — `actions`/`actionsPlacement` are now explicitly skipped there.
- **`src/components/blocks/index.jsx`** — new `PopupOverlay` (reuses the `backdrop`/`card` modal pattern already established by `ResumePdfButton` — the second consumer of that pattern, not a new one) and `ActionButtons` (extracted from an inline block that used to live only in `TimelineBlock`). Wired into `TimelineBlock` only — the reference implementation, same "not retrofitted everywhere" precedent Phase C set for `CardsBlock`/`StatGridBlock`. `HeroBlock` and the other hardcoded `cta1`/`cta2` sites are untouched.
- **`src/components/blocks/ColumnWidgets.jsx`** — `FormColumnWidget` exported with a new optional `source` prop (popup buttons post with `source: 'action-button-popup'`, distinct from the flexColumns widget's `'flex-columns-form'`).
- **Bug found + fixed during live testing**: the popup's default-field-seeding logic (auto-add a required `email` field) originally only fired on an explicit kind-dropdown change. A row switched straight to `type: 'popup'` (leaving kind at its display-default of `'form'`) got an empty form with no seed. Fixed in the row's Type-select `onChange` in `EditorPane.jsx`.

**Verified live** (QA account, never Betsy's real login): added a Career Timeline section with one button of each type; confirmed url/output render as links with correct hrefs (output-type picker correctly narrows to just the Output Documents group); popup-form auto-seeds the email field, opens the overlay, and a real submission created lead **#13**; custom copy-link fires the handler and shows the failure/success toast (clipboard write itself failed only because the automated browser lacked document focus — an environment limitation, not a code defect); placement=center produced `justifyContent: center`; a pre-existing legacy action with no `type` field rendered unchanged (regression check passed).

**Not exhaustively tested**: the media/output popup kinds and the scrollTop/print/share custom actions were verified by code review + the shared rendering path (same `ActionButtons` dispatch already proven for form/copyLink), not each individually clicked live. Admin-scope UI was not click-tested — same standing reason as Phases A–C (member-scope is a strong proxy since there's zero scope branching in this code).

## 3. Backlog logging — done

Two new scripts, following the established `add-vXXX-backlog-items.mjs` pattern (upsert-by-`externalRef`, `capabilityId` — not the older, buggy `capabilityGroupId` field name used in `add-v018`):

- **`scripts/add-configurable-platform-backlog-items.mjs`** — Phases A/B/C. Ran an automated overlap scan against the live backlog before creating; manually confirmed 3 near-miss candidates (`TT.96`, `PB.2`/`PB.5`, Templates Phase A/B) were NOT true overlaps. Created 3 items: **[116]** Phase A (section layout + drag-reorder), **[117]** Phase B (page type registry), **[118]** Phase C (flex-column widgets). All `admin-experience`, `status: completed`, not yet deployed.
- **`scripts/add-phase-d-backlog-items.mjs`** — Phase D. Overlap scan found one genuine match: **`PB.2` (id 49, was pending)** asked for the same underlying intent (button behavior beyond a bare URL) via a narrower, legacy-`cta1`/`cta2`-specific mechanism. **Updated id 49 in place** (not a new item) to reflect Phase D's actual, broader delivered scope — same principle the concurrent session used for its own Codex-dashboard update in `add-v019-backlog-items.mjs`. Final item count stayed at 118 (no duplicate).

**Hours are real, not guessed** — both scripts derive `hoursClaude`/`hoursBetsy` from `extract-classify-turns.mjs` + `analyze-contribution-sessions.mjs` burst analysis, apportioned across phases/activities by new-file line-count share (a concrete, reproducible split basis, documented in each script's header comment). Sessions added to the classifier's `SESSIONS` map this pass: `4ded6650` (the actual Phase A/B/C build session — found by grepping transcripts for signature files, since the session that read the handover is a *different* session than the one that built it) and `fd26e133` (this session, which did Phase D plus the backlog-logging work itself — apportioned by line count so the backlog-logging script's own lines don't inflate Phase D's hours).

`dataSource: 'measured_burst_analysis'` on all 4 items. **Do not re-run either script with different numbers without re-deriving from the classifier** — this project has a documented history of stale/fabricated cost figures being a recurring landmine (see `8ba0053`, `2af1405` in git log).

## 4. Files touched (for a fresh session's orientation)

**New files, Phase D (safe to keep/commit):**
```
scripts/add-phase-d-backlog-items.mjs
scripts/add-configurable-platform-backlog-items.mjs   (Phase A/B/C backlog logging, written this session)
```

**Modified files that are MINE, Phase D on top of Phase A/B/C's existing edits:**
```
src/components/admin/EditorPane.jsx       (SectionActionsEditor rewrite, PopupActionConfig, seed-bug fix)
src/components/blocks/index.jsx           (PopupOverlay, ActionButtons, runCustomAction; TimelineBlock rewiring)
src/components/blocks/ColumnWidgets.jsx   (FormColumnWidget exported + source prop)
src/components/admin/FlexColumnsEditor.jsx (FormConfig exported)
scripts/extract-classify-turns.mjs        (added sessions 4ded6650 + fd26e133 to SESSIONS map — keep this)
```

All of these were already in the "MINE" list from the Phase A/B/C handover (except the two backlog scripts and the classifier addition) — Phase D added to files already being modified, it didn't touch new files beyond the two backlog scripts.

**⚠️ Shared files — MUST re-reconcile before committing, they have grown since the last check:**
```
server/db.js                        (was 112 lines of diff at last check, now 238 — concurrent session added more)
src/components/admin/AdminShell.jsx (was 152 lines of diff, now 155)
package.json / package-lock.json    (was clean/only my @dnd-kit additions at last check — re-verify)
```
The last full reconciliation pass (this session, before Phase D) found these clean — additive, non-overlapping changes from the concurrent Contribution Intelligence/NRM/PLM session. But more time has passed and that session kept working. **Redo the diff review before staging anything** — `git diff server/db.js src/components/admin/AdminShell.jsx package.json` and read through for genuine overlap, the same way this session did it (see the transcript of this session for the method, or just re-derive: check that additive blocks in `db.js`'s `bootstrap()` don't collide, and that `AdminShell.jsx`'s `FALLBACK_ADMIN_NAV`/state additions from both sessions still coexist without one overwriting the other).

**⚠️ Modified/untracked files in the working tree that are NOT mine — belong to the concurrent session(s), do not stage:**
```
src/components/admin/MemberPlmPanel.jsx, src/data/platformLifecycleConfig.js,
src/data/backlogFieldSchema.js, src/data/platformModules.js,
server/data/defaultSite.js, server/index.js, src/App.jsx, src/components/Output.jsx,
src/components/admin/MyResumePanel.jsx, src/components/admin/SectionTemplateModal.jsx,
src/lib/api.js, server/routes/careerMaster.js, server/data/career/,
src/components/admin/CareerMasterPanel.jsx, src/lib/careerMaster.js,
scripts/reseed-career-skills.mjs, scripts/seed-career-master.mjs,
scripts/add-v019-backlog-items.mjs (already run — see §1),
turn-classification.json (regenerate-able, not meaningful to commit as-is)
```
This list is **longer than it was at the start of this session** — the concurrent work is still active. Run a fresh `git status` at the start of the deployment session; don't trust this list blindly if significant time has passed.

```
backlog-current-for-betsy-recompute.json, backlog-full.json, backlog-snapshot.json,
betsy-hours-recompute.json, correlation-report.json, cost-reconciliation-plan.json,
Tempsite.json, HERQ/, AlgebraTriggerNometryFF07.04.26.zip/.pdf, "output versions/", output/, tmp/,
docs/career-modeled-*.md, docs/gmail-*.md, docs/memory-approval-table-*.md,
docs/salt-basin-email-attachment-memory-ingestion.md, docs/salt-basin-*-playbook.md,
docs/salt-basin-universal-agent-reasoning-context.md, HANDOVER_canva_resume_pdfs.md
```
All untracked, origin unclear or belongs to other sessions — leave alone, don't delete without asking.

**Nothing has been committed.** `git status` is a mix of at least two (possibly more) sessions' uncommitted work. **Do not `git add -A` or commit blindly** — stage Phase A–D's files explicitly by path.

## 5. Test environment state

- **Throwaway QA account** (`claude-phasea-qa-test@example.com` / `Throwaway-QA-Pass-1` / slug `phasea-qa-test`): Home page now also has a **Career Timeline** section (from Phase D testing) with 5 test buttons (url/output/popup-form/custom) and `actionsPlacement: 'center'`. Plus the Phase C `flexColumns`/`industryWheel` test content from before. **Delete or reset whenever convenient** — flagged twice now, still not actioned.
- **Test leads**: id 12 (`phasec-qa-test@example.com`, Phase C form widget) and id **13** (`phasea-qa-popup@example.com`, Phase D popup form) — harmless, safe to delete from the leads/CRM pipeline.
- **Shared dev environment risk learned this session**: this project's `npm run server`/`npm run client` point at the same live Supabase DB and the same source files on disk regardless of which Claude Code session runs them. A concurrent session's HMR-invalidating edit (e.g., to `Output.jsx` or `App.jsx`) can force a full page reload in *your* browser tab too, silently discarding any unsaved admin-editor draft state. **Save Draft immediately after any meaningful admin-editor change** during future live verification passes — don't batch multiple edits before saving. This cost real rework time this session (a fully-configured test section was lost once to exactly this).
- **`.claude/launch.json`** — `saltbasin-api` (port 3001) and `saltbasin-client-2` (port 5175) were used this session because the default ports were occupied by another chat's server. Check `preview_list` / port availability before assuming a port is free.

## 6. Standing policy — do not violate

**Never use Betsy's real admin password for automated testing.** All verification across Phases A–D used the throwaway QA member account. If admin-scope click-testing is ever wanted, it needs Betsy's explicit go-ahead and her doing it herself, or a throwaway admin-equivalent account.

## 7. Suggested next steps for the deployment session

1. **Re-run the reconciliation check** on `server/db.js`, `src/components/admin/AdminShell.jsx`, `package.json` (§4) — confirm still additive/non-overlapping before touching anything.
2. **Stage and commit Phases A–D explicitly by path** (the file lists in §4 of this doc plus the original handover's §3, combined) — never `git add -A`.
3. **Assign a real version number** — `v0.19` is taken (confirmed live, items 114/115). Use `v0.20` or check `server/data/patchNotes.js` for whatever the highest version string is by the time you commit, in case more has landed. Update `patch_note_version` on backlog items 116/117/118/49 via a `PATCH /api/backlog/items/:id` call once decided (don't guess — write a tiny one-off script or curl, following the pattern in the existing `add-*-backlog-items.mjs` scripts).
4. **Write patch notes** in `server/data/patchNotes.js` and update `CHANGELOG.md` for Phases A–D, following the established format (see `v0.18` entries for the level of detail expected).
5. **After deploy is confirmed green**, flip `status`/`deployedGithub`/`deployedRender`/`deployedNetlify` on backlog items 116, 117, 118, 49 to reflect reality (they're currently `status: completed` but `deployed*: false`, which is accurate only until the deploy actually happens).
6. **Clean up the QA test account's test data** (§5) once no longer needed.
7. Continue to Phase E (output configurator generalization) or F (content-mapping) only after Betsy confirms she wants to keep going — both were explicitly deferred pending Phase E's data-path infrastructure per the original scoping decision.
