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
