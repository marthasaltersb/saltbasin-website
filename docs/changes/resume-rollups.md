# Change report — configurable resume rollups (KPI tiles, industry buckets, capability groups, Career Atom groupings)

Version 1 · 2026-10-02 · branch `release-loop/resume-rollups-build` (on top of integration head `8430eae`).

## Traces to

- `docs/changes/proficiency-rules-and-live-qr.md` / `docs/training/proficiency-rules-and-live-qr.md` (v1, commits `a0ff84a`, `f1ad622`): the proficiency engine (`server/lib/careerProficiencyEngine.js`), level `basis` and the † footnote. KPI tiles of type "proficiency at or above a level" and the resume footnote reuse that engine unchanged; this change does not alter any level.
- `docs/changes/chart-gallery.md` / `docs/training/chart-gallery.md` (commit `6dd06e5`): added the Career Master → Proficiency & Rollups workspaces "1 … 4"; this change adds workspace "5 · Resume rollups" beside them.
- `docs/changes/career-bound-outputs.md`: outputs read Career Master data; this change makes the Executive Summary figures an output reads configurable instead of hardcoded.
- CLAUDE.md "Career Channel Rod": the Career Atom rollup catalog (`server/lib/careerAtomRollups.js`) that the public `careerRollupShowcase` block reads. It now takes its groupings from the member's definitions.
- Supersedes (removes) the hardcoded `computeExecutiveKPIs`, `computeCapabilityMeters`, `computeIndustryDurations`, `INDUSTRY_DURATION_BUCKETS`, `META_CATEGORY_MAP/ORDER` and the three hardcoded fallback figures in `src/components/Output.jsx` (history: written for a single owner's resume).

## What changed, in one paragraph

Every rollup that feeds the resume outputs is now a per-member, editable definition with a screen and a live preview: the Executive Summary **KPI tiles** (label, note, accent, source metric / aggregation, order, visibility), the **industry buckets** (label, sub-label, keywords), the **capability groups** (which skill categories roll into which Capability Confidence bar), and the **Career Atom groupings** behind the public Career Rollup block. The screen is **Career Master → Proficiency & Rollups → 5 · Resume rollups**. Outputs read the configured values from one endpoint. A tile with no data shows "—" and says why; the old invented fallbacks ($4.6B, $500M+, 12+, 13, "AI-Native", 142%, 4) are gone.

## Data model (additive only)

No new tables or columns. Four new `definition_type` values in the existing member-scoped `career_experience_definitions` table (JSONB `definition` passed as a raw object, never `JSON.stringify`):

| type | `definition` shape |
| --- | --- |
| `kpi_tile` | `{ note, accent: gold\|teal\|green\|plum\|navy, computation: { metric, … } }`; metrics: `years_experience`, `industry_count`, `engagement_count`, `employer_count`, `max_dollar_in_engagement_field {field}`, `arr_automated`, `field_aggregate {entity, field, aggregation}`, `proficiency_at_least {entityType, levelKey}`, `manual {manualValue}` |
| `industry_bucket` | `{ sub, keywords: [string] }` (label is the row label) |
| `category_group` | `{ categories: [string] }` |
| `atom_rollup` | `{ entryType, groupBy, labelPrefix, sort: count\|label }` |

Seeding: the existing per-type seeding (`PER_TYPE_SEEDED_DEFINITION_TYPES`) now includes the four types, so a member is seeded those defaults only when they have none of that type, on their own authenticated request. Nothing is written from `seed.js` / `bootstrap()`. Public/read paths (`GET /api/career/resume-rollups`, the Career Atom catalog) never write: with no stored rows they resolve against the in-memory defaults (`DEFAULT_ROLLUP_DEFINITIONS`), which equal the old hardcoded buckets/groups/tiles. Existing members' other definitions are untouched. The atom defaults keep the keys `skills_by_category`, `jobs_by_industry`, `tools_by_wheel_bucket` (append-only; existing consumers keep working).

## Server

- `server/lib/resumeRollups.js` (new, pure): defaults, `validateRollupDefinition()` (shape errors are surfaced as 400s with the reason), `resolveResumeRollups()` (tiles, industry durations, capability groups, unmapped categories, footnote, UI catalog), `compileKeywordRegex()` (keywords are regex-escaped; keywords of 3 characters or fewer match whole words only), `resolveAtomGroupings()`.
- `server/routes/careerMaster.js`: `GET /api/career/resume-rollups[?owner=][&include=atom]` (public like `/master`, never writes); `POST /api/career/resume-rollups/preview` (member-only, recomputes against unsaved definitions, writes nothing); the generic experience-definitions PUT/DELETE validate the new types; `loadProficiencyResolution(userId, period, { seed:false })` for read-only callers.
- `server/lib/careerAtomRollups.js`: `buildCareerAtomRollupCatalog()` now returns the three legacy keys from the member's definitions (hidden or removed → `[]`) plus `groupings` (every configured grouping, in order); new `resolveCareerAtomGroupings()`.

## Client

- `src/components/admin/RollupGroupingsPanel.jsx` (new) mounted as workspace **5 · Resume rollups** in `CareerExperienceConfigurator.jsx`. Four sections (KPI tiles, Industry buckets, Capability groups, Career Atom rollups) each with add / edit / reorder (↑ ↓) / Shown toggle / remove / save, an "unmapped skill categories" box, and a Live preview that includes unsaved edits. A load failure is shown as an alert with Retry, never as empty lists; a rejected draft pauses the preview and shows the server's reason.
- `src/lib/resumeRollups.js` (new): `fetchResumeRollups`, `useResumeRollups` (uncached; refreshes on the `sb-output-data-refresh` message).
- `src/components/Output.jsx`: Resume (all layouts and template renders), Case Study Portfolio and Strategic Operator read tiles, capability bars and industry bars from the endpoint. Load failures render a visible "Resume rollups could not be loaded" notice, not empty tiles. User-defined tile values are marked † and the response footnote is printed.
- `src/lib/outputBlocks.js`: the `exec-kpi-dashboard` block renders the same configured tiles, escapes member-entered text, and shows the load error / footnote.
- `src/components/blocks/CareerProspectBlocks.jsx` + `EditorPane.jsx`: the Career Rollup block's "Group by" picker also lists the member's own Career Atom groupings (value `atom:<key>`); a grouping later hidden or removed shows the block's honest empty state.

## Behaviour changes to know

- Outputs no longer show invented numbers. A member with no data sees "—" tiles with a reason where the old output showed brand figures. The sixth default tile changed from the hardcoded "AI-Native" text to a computed **Employers** count.
- "Years" now comes from the Career Master trend series (month precision, overlapping roles merged); it was a hardcoded 13.
- The Executive Summary renders as many tiles as are visible (the grid wraps after 6).
- Capability bars show only groups that contain skills; a skill whose category is in no group is listed under "unmapped categories" on the screen instead of silently dropping out.

## Verified (initial check)

- `npm run build` passes (also `npx vite build`).
- Server boots on a fresh database (Postgres 16, port 4202); the screen was driven end to end in Chromium on a fresh database following `docs/training/resume-rollups.md`: all steps of journeys 1–12 pass. Page errors: none. Expected network noise: `404 GET /api/members/me/profile` (the admin test user has no member profile; pre-existing), `400 POST /api/career/resume-rollups/preview` in Journey 11 (the deliberate invalid draft), and sandbox `ERR_CERT_AUTHORITY_INVALID` / `ERR_TUNNEL_CONNECTION_FAILED` for external hosts.

## Known limitations

- Not walked in the browser: the Career Rollup block's new "Group by" option in the Site editor (compiles; the data path is covered by Journey 9 via the API) and a second member with an empty Career Master.
- The capability bar's "N Expert" evidence counts the skill's recorded tier, while the "Expert skills" proficiency tile uses the proficiency engine; they can differ when a formula or override applies.
- Case Study Portfolio / Strategic Operator hero cards keep their fixed narrative labels; only their numbers come from the configuration.
- Equal keyword hits across buckets are all counted (a role can count toward several buckets); capability groups use first-group-wins.
- The last saved row of each type can't be removed (a member with none is given the defaults again); untick **Shown** to show nothing. The screen says so when you try.

## Fix notes per round

(none yet)

## Fix notes — round 1

### RR1-1 (J1.1, mobile 390px: Save clipped on rollup cards)
- Changed: the shared `Footer` in `RollupGroupingsPanel.jsx` now wraps (`flexWrap: 'wrap'` plus a gap on both flex rows, inner row `justifyContent: flex-end`), so Shown / up / down / Remove / Save no longer overflow the `overflow:hidden` ancestor. One component serves KPI, bucket, group and Career Atom cards.
- Files: `src/components/admin/RollupGroupingsPanel.jsx`.
- Checked: browser at 390px as the test member (World Shell > Journeys > Career Master > Proficiency & Rollups > 5 · Resume rollups): all 19 Save buttons have right edge 303px (viewport 390px).

### RR1-5 (MCP_GAP: rollup capabilities had no MCP tools)
- Changed: route bodies extracted into exported functions in `careerMaster.js` (`computeResumeRollups`, `previewResumeRollups`, `listExperienceDefinitions`, `saveExperienceDefinition`, `deleteExperienceDefinition`, `saveProficiencyAssertion`, `deleteProficiencyAssertion`); the routes and the new tools call the same functions, errors carry the same status. Eight append-only tools: `resume_rollups_read`, `resume_rollup_preview`, `career_atom_rollups_read`, `career_experience_definitions_read` (career.read), `career_experience_definition_save`, `career_experience_definition_delete`, `career_proficiency_override_save`, `career_proficiency_override_clear` (career.write). Reorder is a save of `sortOrder`. `capabilityParity.js` now governs `server/routes/careerMaster.js` (`/api/career`) with rows for every route in it; rollup rows have UI, API and MCP, other Career Master rows record an exclusion or an explicit MCP gap. The experience-definition and proficiency-assertion routes gained try/catch with proper status replies.
- Files: `server/routes/careerMaster.js`, `server/lib/mcpToolRegistry.js`, `server/data/mcpToolManifest.json`, `server/lib/capabilityParity.js`.
- Checked: `node scripts/check-interface-parity.mjs` OK and `--self-test` OK; `npm run build` passes; with a token over `/mcp` as the test member, the read tools return data, an invalid preview type returns a 400 error result, and a delete of a missing key returns ok.
- Not done: no MCP tool yet for `GET /proficiency`, `/rollup-preview/:key`, `/rollups` (recorded as gap row `career-proficiency-read`) or intake/mappings (gap rows).

## Fix notes — round 3

- **resume-rollups-RR1-3 (J12.1)** — My Resume preview URLs were built without `owner=me`, so `/output/resume` rendered the platform owner's data for a signed-in member. Added `withOwnerMe()` and an `owner` option to `resumeUrlFromPreset` in `src/lib/resumeUrls.js`; `src/components/admin/MyResumePanel.jsx` now owner-qualifies `presetPreviewUrl`, the initial `previewUrl`, the layout switch buttons and the active-layout comparison (iframe, full-tab link and print fallback all use `previewUrl`). The Public link and `primaryResumeUrl` stay without owner. Checked in the browser as the test member: iframe src is `/output/resume?preset=preset-default&owner=me` and every career master / rollups / resume-rollups request carried `owner=me`.
- **resume-rollups-RR1-4 (E.4)** — `GET /api/output-templates/:id/public` returned 404 for the synthetic `preset-default` id. `server/routes/outputTemplates.js` now answers 200 `{ template: null }` for a missing or non-portfolio-visible preset (`Output.jsx` already treats `template: null` as no template; no change needed there). Checked: the request returns 200 in the browser run, with no new network errors (only the sandbox's external-cert console errors remain). `npm run build` passes.
