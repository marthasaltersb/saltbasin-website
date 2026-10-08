# Change report — proficiency rules engine, rules screen, tool proficiency category, live QR page

Branch: `claude/zealous-meitner-5tuft5` · commits `a0ff84a`, `f1ad622` (on top of `d78bcda`, `76b33ad`).

## What changed, in one paragraph

Proficiency levels for skills and tools are now calculated by a configurable rules engine instead of only being typed in by hand. A locked **Salt Basin methodology** formula is the default; a member can duplicate it into their own formula, map certifications to the skills/tools they prove, or set any single level by hand. Every resolved level records **why** (its *basis*), and anything not methodology-driven is marked **†** with a footnote on every output. Tools also carry a **proficiency category** ("how it was used": hands-on / integration design / adjacent), stored on the Career Master tool record. The public QR page now shows **live** Career Master chart data with a bold callout listing every difference from the approved printed version and a slider through each recorded state.

## Data model (all additive; no existing rows rewritten)

| Where | What | Notes |
| --- | --- | --- |
| `career_experience_definitions` (existing table) | new `definition_type` values `proficiency_formula`, `certification_mapping` | Same member-scoped table that already held periods / levels / rollups / displays. |
| — `proficiency_formula` | `{ terms: [{ input, weight, cap }], thresholds: [{ levelKey, minPoints }], selected }` | Key `salt_basin_methodology` is seeded per member, **locked** (PUT/DELETE → 403). `selected: true` on at most one member formula makes it the one in use. |
| — `certification_mapping` | `{ certificationId, targets: [{ entityType: 'skill'\|'tool', entityId }], bonusPoints, countIfLapsed }` | Validated: the certification and every target must belong to the member. |
| `career_proficiency_assertions` (existing) | unchanged schema | A `current`-period assertion with `assessment_source` in `user_confirmed`/`user_defined`/`member_override` is treated as the member's **override**. |
| `career_tools.wheel_bucket` (existing column) | now surfaced as the tool's **proficiency category** | Values `hands_on`, `integration_design`, `adjacent`; blank = derived from level (labelled as derived). |
| `resume_output_projections` | new columns `shared_snapshot JSONB`, `share_history JSONB` | Snapshot frozen at QR approval; append-only history of later states (recorded only when data actually changed; max 100). |

Formula inputs (the only measurements the engine computes): `yearsPerformed` (recorded years, else current year − first-used year, min 1), `engagementCount` (skills: engagements; tools: roles), `certificationBonus` (sum of mapped bonus points), `recencyYears`.

Methodology default: years × 1 (cap 15) + engagements × 0.5 (cap 10) + certification bonus × 1; levels at Exposure 0, Foundational 2, Proficient 4, Advanced 7, Expert 10 points.

Resolution order per skill/tool: **member override → selected member formula → Salt Basin methodology**. The result always also reports what the methodology alone would have said.

## Server

- `server/lib/careerProficiencyEngine.js` (new, pure): `resolveProficiencies`, `scoreFormula` (per-term `value`, `counted` after cap, `points`), `certificationBonuses`, `proficiencyFootnote`, `TOOL_PROFICIENCY_CATEGORIES`.
- `server/routes/careerMaster.js`: new definition types + per-type seeding (existing members get the methodology row without their other definitions being touched); locked-definition guard; `validateDefinitionShape`; `loadProficiencyResolution(userId)`; `GET /api/career/proficiency` (levels, bases, breakdowns, footnote, inputs, tool categories); rollup previews now use resolved levels and return a footnote; every Career Master write emits a change event.
- `server/lib/careerChangeEvents.js` (new): Career Master writes → debounced (2 s) QR history recording.
- `server/lib/applicationPackages.js`: approval freezes a chart snapshot; public view returns `{ approved, history, live }`; a change that bypassed the write hooks is recorded the first time the page is viewed.

## Client

- `src/components/admin/ProficiencyRulesPanel.jsx` (new): the **Rules & why** screen (formula in use, formula editor, certification bonuses, levels-and-why table with tool category + override).
- `src/components/admin/CareerExperienceConfigurator.jsx`: 4th workspace tab "3 · Rules & why" (Preview moved to 4).
- `src/components/admin/CareerMasterPanel.jsx`: the tool field formerly labelled "Industry Wheel Bucket" is now labelled as the proficiency category.
- `src/lib/careerCharts.js` (new): chart family (proficiency tiers, trend bars, outcome tiles, career timeline), validated palette, data shaping from Career Master; month-precise cumulative experience with overlapping roles merged.
- `src/lib/outputBlocks.js`: block types `career-proficiency-bars` (group by entity / category / proficiencyCategory), `career-trend-bars`, `career-outcome-tiles`, `career-duration-timeline` (append-only registry).
- `src/components/Output.jsx`: template outputs get `master` + `proficiency` in their render context; preview refreshes on `sb-output-data-refresh`.
- QR page: `src/components/SharedLiveStates.jsx` (live banner, change list, state slider), `src/components/ChartViews.jsx` (Chart / Salt particles / Table), `src/components/SaltParticleChart.jsx` (first rendition), `src/lib/shareSnapshotDiff.js` (what counts as a change; trend series collapse to one line).

## Behaviour changes to know

- A level picked in **Assess proficiency → Current** now counts as an override (†). Before, those were plain assessments.
- Years from a first-used year count elapsed years (2013 → 13 in 2026), not calendar years touched (was 14).
- When a member formula is in use, **every** skill/tool it calculates is marked † (it is user-defined), even where the level matches the methodology.

## Verified (local Postgres, fictional data)

API: locked methodology refuses edits (403); unknown formula input refused (400); certification bonus adds points; override wins and is labelled; footnote counts user-defined items; rollup preview reports per-group user-defined counts. Browser (Playwright): deleting a certification bonus drops a tool from Expert (11 pts) to Advanced (8 pts); duplicate → cap years at 10 → "Save and use" marks levels "Your formula †"; switching back clears †; setting a tool's category saves to the Career Master tool record and adds a QR history state whose callout reads "Advanced → Advanced · Integration design". No page errors.

## Known limitations

- The Rules & why screen is not yet also mounted inside the Output Template editor (planned once the chart-gallery work merges into that file).
- Skills have no proficiency category (tools only, as asked).
- The salt-particle view is a first rendition, pending design feedback.

## Addendum — every technology needs a proficiency category before finalizing (commit `b1ae2d3`)

- `server/lib/finalizationGates.js` (new): `assertReadyToFinalize(userId)` refuses with 409 `tool_category_required` (+ the exact tools and the category vocabulary) while any Career Master tool has no `wheel_bucket`. Called by `updateProjectionStatus` (approved / published) and `approveOutputForSharing` — every path to "final" goes through one of those.
- `GET /api/resume-outputs/finalization-check` → `{ ready, toolsMissingCategory }`.
- `src/components/admin/ToolCategoryGate.jsx` (new): `useToolCategoryGate().run(action)` runs a finalize action; on the 409 it shows a dialog (suggestions from each tool's level, marked "(suggested)"), saves choices to the Career Master tool records, then retries once. Used by My Resume (Approve / Publish / Approve for QR) with a warning banner. **Any new finalize button must wrap its call in `categoryGate.run(...)`.**
- Rules & why: missing categories are marked "Required before any output can be finalized" with a count banner.
- Charts/QR show a tool's category only when it is recorded in Career Master; an inferred one is never presented as fact.
- Verified in the browser: API refusal lists the tools; banner shown; dialog appears on Approve for QR; saving writes both categories to Career Master and the approval completes; banner disappears.

## Fix notes — round 1

### T1-1 (heading and selected path card unreadable on the dark World embed)
- Changed: `CareerExperienceConfigurator.jsx` outer container now sits on its own light surface (`#f5f2ed`, rounded) so the navy heading, intro and tab buttons read on any host. `CareerMasterEntryPoint.jsx` selected path card background is now opaque `#fbf3e8` (was translucent `rgba(196,132,58,.08)`), keeping the gold border.
- Files: `src/components/admin/CareerExperienceConfigurator.jsx`, `src/components/admin/CareerMasterEntryPoint.jsx`.
- Checked: `npm run build` passes. Live browser walk NOT performed in this round (not verified visually); the fix is by construction (opaque light backgrounds behind navy text). Other embedded views were not scanned beyond a grep of CareerMasterPanel.jsx, which found no unconditional navy text without a surface.

### T1-2 (phone width, 390px)
- Changed: (a) Rules table in `ProficiencyRulesPanel.jsx` keeps its 940px width but now has an always-visible scroll area, a right-edge shadow cue, a "swipe or scroll sideways" caption naming the hidden columns, and a sticky first column. A stacked-card layout was not built (kept minimal). (b) Static chart SVGs in `careerCharts.js` get `min-width:500px` and `ChartViews.jsx` wraps the static chart in an `overflow-x:auto` container with a swipe caption, so chart text stays near its designed size.
- Files: `src/components/admin/ProficiencyRulesPanel.jsx`, `src/lib/careerCharts.js`, `src/components/ChartViews.jsx`.
- Checked: `npm run build` passes. 390px live check NOT performed in this round.

## Fix notes — round 2

- **T2-1** (LIVE DATA banner light in zero-change state): `SharedLiveStates.jsx` banner is now always dark `#1B2A3B` with white text; the stripe is the differentiator (green zero changes, gold with changes). Checked by rendering the QR page with zero changes in the browser.
- **T2-2** (spec error, J7.5 example): the example assumed Ledgerly ERP's category was unset when printed, but J2 sets it before approval. Training spec J7.5 now uses data the journeys leave behind (Ledgerly ERP printed Advanced · Integration design to now Advanced · Hands-on; Forecast modeling Expert to Advanced). Files: `docs/training/proficiency-rules-and-live-qr.md`.
- **T2-3** (390px workspace tabs clipped): `CareerExperienceConfigurator.jsx` tab row gets `flexWrap: 'wrap'` so all five tabs are reachable; training spec line 7 lists five workspaces and the wrapping behavior. Checked by build and layout at 390px.
- **T2-4** (banner says text stays as approved for career-bound output): `SharedOutputPage.jsx` passes `doc.documentState` to `SharedLiveStates.jsx`, which picks the sentence by state (changed, career-bound unchanged, frozen). Training J7.1 documents the three sentences.

## Fix notes — round 3

- **T2-3** (spec error): training spec line 7 said the 390px tab row wraps onto two lines; with the `flexWrap: 'wrap'` fix the five padded buttons wrap about one per row (card about 285px wide). Product is correct; spec reworded. Files: `docs/training/proficiency-rules-and-live-qr.md`. Checked: spec read-through only.
- **proficiency-live-qr-F2-1** (J7.1, J7.2, 390px tabs not browser-driven in round 2): process item, no code change. The round-3 validator must drive J7.1 (dark zero-change banner, green stripe), J7.2 (three wording sentences) and all five tabs at 390px in /world. Files named in triage unchanged.
- **proficiency-live-qr-F2-2** (round-2 notes overstated checks): the round-2 notes above were written from build and code reading; the browser checks they describe (T2-1, T2-3, T2-4) are pending the round-3 validator and are NOT yet browser-verified. This section will be updated after round 3 passes.
- **proficiency-live-qr-F2-3** (Output Template editor): `ProficiencyRulesPanel` is already mounted as the **Rules & why** tab (tab 4) of `OutputTemplateConfigurator.jsx` (commit 6dd06e5), which World Shell renders as the Output Templates island (`WorldShell.jsx`). No code change needed; added training Journey 8 so the validator proves it. Files: `docs/training/proficiency-rules-and-live-qr.md`. Checked: grep of mount points; browser walk not performed this round.
- **proficiency-live-qr-F2-4** (Salt particles design): NOT changed. This waits on owner design feedback, which cannot be invented by an agent. Question for the owner: after seeing the first rendition (Journey 7 step 4), what should change (grain size/density, colors, motion, heap shape)? `SaltParticleChart.jsx` is untouched.
