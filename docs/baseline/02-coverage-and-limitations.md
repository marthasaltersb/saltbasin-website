# Coverage, Exclusions, and Open Access Gaps

**Current pass:** 2026-10-01, revision `e0ea466` (35 commits after the 2026-09-05 pass at `e8e25e1`). This document bounds every completeness claim made elsewhere in `docs/baseline/`. The 2026-09-05 version is preserved in git history.

## What this pass covers

| Area | Coverage | How |
|---|---|---|
| API endpoints | **All** 592 statically declared Express endpoints | Generated: mount prefix, file:line, guard evidence (`inventory/api*`) |
| Database schema (declared) | **All** 191 bootstrap tables with columns, constraints and indexes, plus 20 tables declared elsewhere | Repo `bootstrap()` executed on a throwaway local Postgres 16, then read from the catalog (`inventory/db*`) |
| UI routes | **All** 37 `<Route>`s | Generated |
| Source modules | **All** 424 first-party files in `src/` and `server/` | Generated, with exports and importer counts |
| Registries, env names, jobs, tokens, tests, docs | **All** instances in scope | Generated |
| Module assignment | **All** elements → 27 modules, 0 unassigned | `module-map.json` + `module-coverage.md` |
| Behavior: specified modules | MOD-01, 02, 03, 06, 09, 13 read in depth. MOD-04, 05, 07, 08, 10, 11 read on key paths | Hand-authored rows with file:line evidence |
| Behavior: registered modules | MOD-12, 14–27: elements inventoried, documentation claims recorded as *unverified*, a few rows read directly | Hand-authored |
| Runtime observation | Local boot, build, health, login, lead creation, member gates, member publish, AT-04-001 | [11](./11-verification-and-release-records.md) |
| Existing tests | All 17 test files executed (individually and via `npm test`) | [10](./10-test-catalog.md) Part A |

## What this pass does not cover

- **Frontend visible states:** copy, validation messages, empty/loading/error states, focus and keyboard behavior, for every screen. Route-to-component mapping exists, but no screen's UI states are transcribed. Stage 5 scenarios need this.
- **Per-block field contracts:** the `fields` keys of each of the 67 block types (`blocks/index.jsx`, 5,854 lines).
- **Behavior of 15 registered modules** (see [03](./03-current-state-specification.md#module-register)), including the 76-endpoint Journey Rod substrate and the 96-endpoint Career module.
- **Reconciliation of prior documentation against code:** `docs/canon/SB-*`, `FUNCTIONAL_DESIGN_SPEC.md`, `TECHNICAL_DESIGN_SPEC.md`, `FUNCTIONAL_TECHNICAL_MAPPING.md`, `PLATFORM_MERGE_SPEC.md`, foundation source-of-truth files, `HANDOVER_*.md`, and `AGENTS.md`. These are inventoried with last-commit dates in [`inventory/documentation.md`](./inventory/documentation.md). CLAUDE.md alone was checked statement by statement in the areas read (DEC-019).
- **Accessibility, performance, and security testing** beyond the specific findings logged.
- **Standalone verification scripts** (`scripts/verify-*.mjs`): not run.

## Explicit exclusions

| Excluded | Reason |
|---|---|
| `node_modules/`, `dist/`, `package-lock.json` | Vendor/generated |
| Binary office/PDF/ZIP files (`*.docx`, `*.pdf`, `*.pptx` content, `AlgebraTriggerNometry*.zip/pdf`) | Not text-inspectable here. `.md` twins exist for the three `*_SPEC.docx` files, and equivalence is unverified |
| `tmp/`, `work/`, `output/`, `outputs/`, `output versions/`, `generated/` | Working artifacts of prior sessions |
| Root data dumps and one-off scripts (`backlog-*.json`, `correlation-report.json`, `cost-reconciliation-plan.json`, `turn-classification.json`, `Tempsite.json`, `betsy-hours-recompute.json`, `*.py`, `_verify_*`) | Working artifacts, not product definitions. Whether `Tempsite.json` is a site-state snapshot is unverified |
| `HERQ/`, `RevenueShieldFoundation/`, `pptx_analysis/`, `brand-assets/` contents | Asset folders. Listed by file type only (DEC-016) |
| `scripts/` (61 files) beyond the npm-script entry points | Operational/backfill scripts, many named `add-v0xx-backlog-items`. Not product behavior |

## Access limitations (unchanged unless noted)

| Access | Status 2026-10-01 | Consequence |
|---|---|---|
| Live Supabase / Postgres | **Unavailable.** No connector (`ListConnectors` for supabase/postgres/database → none), no `DATABASE_URL` | Every DB statement is a repository declaration. Live drift, live RLS/policies/grants, row counts, storage buckets, and edge functions are **unverified**. Repo declares 0 RLS policies (DEC-020) |
| Render, Netlify dashboards, DNS | Unavailable | Live env-var presence (`STRIPE_SECRET_KEY`, `RECAPTCHA_SECRET_KEY`, `PUBLIC_MEMBER_SIGNUP_ENABLED`, `ADMIN_INITIAL_PASSWORD`…), live topology and timezone unverified |
| GitHub Actions run history, repo variables | Unavailable | Whether scheduled promotion is enabled is unknown |
| Live application (`saltbasin.net`) | Not accessed. Deliberately not exercised (no authorized test account; production data must not be touched) | All runtime evidence comes from the local scratch environment only |
| Approved design references | None identified (DEC-016) | Visual acceptance criteria can't be grounded yet |
| Local scratch environment | **Available (new).** Throwaway Postgres 16 + production build + Chromium/Playwright 1.56 in the session container | Stage 5 can run locally without production. The container is ephemeral, and `inventory/README.md` documents how to recreate it |

## Blockers to later stages

| Stage | Blocked by | Status |
|---|---|---|
| 2 (current state) | Nothing. Remaining work is listed above | In progress: first full pass done |
| 3 (requirement extraction & mapping) | Read-aloud validation of the 2026-09-05 intake package (doc 12) is paused at the user's direction pending the Configuration Module design. No new documents supplied since 2026-09-06 | Blocked on user input |
| 4 (target spec) | Stage 3, plus decisions in [07](./07-decision-log.md) | Blocked |
| 5 (acceptance automation) | Target decisions, DEC-006 (framework), DEC-016 (visual references), DEC-003 (environment). The local environment is now proven feasible | Partially unblocked: reproduction scenarios can run |
| 6 (release process) | Stages 4–5 | Blocked. The tooling exists (generator, checker, record format) |
