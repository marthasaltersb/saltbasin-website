# Source Register

Inventory date: 2026-09-05. All revisions below are as of commit `e8e25e15bd69404ba4aab498ec04907190250ea2` on branch `claude/local-repo-export-2ap4hx` unless noted. This register lists what was actually inspected and how — it is not a claim of exhaustive line-by-line review for every file listed; depth of inspection is noted per row.

Source IDs use the prefix `SRC-`.

## Repositories and environments

| Source ID | Type | Location | Revision/date | Scope inspected | Access limitations |
|---|---|---|---|---|---|
| SRC-REPO-01 | Git repository | `github.com/marthasaltersb/saltbasin-website` | `e8e25e1` (2026-08-10 merge of `origin/main`), working branch `claude/local-repo-export-2ap4hx` | Full working tree listing (`git ls-files`-equivalent via directory listing); targeted file reads per rows below | Only repository attached to this session. No other repository (e.g. a separate infra/ops repo, if one exists) was named or made available — none was assumed to exist. |
| SRC-ENV-01 | Deployment environment (declared, not live) | Render service `saltbasin-website` (backend), per `render.yaml` and `DEPLOY.md` | render.yaml/DEPLOY.md content as of SRC-REPO-01 revision | Declared configuration only (build/start commands, env var names, disk policy) | No live access to the Render dashboard, running service, or its logs. Cannot confirm the declared config matches what is actually deployed. |
| SRC-ENV-02 | Deployment environment (declared, not live) | Netlify site fronting `saltbasin.net`, per `netlify.toml` and `DEPLOY.md` | same | Declared build command, publish dir, proxy redirects | No live access to the Netlify dashboard or deployed site. |
| SRC-ENV-03 | Database (declared, not live) | Supabase Postgres, connection via `DATABASE_URL` | Schema as declared in `server/db.js` at inspected revision | `CREATE TABLE` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements in `server/db.js` (190 `CREATE TABLE` statements, 172 idempotent `ADD COLUMN` migration statements counted at this revision) | **No live Supabase/Postgres connection is available in this session** — no Supabase MCP connector is authorized (`ListConnectors` returned none matching supabase/postgres/database), and no `DATABASE_URL` credential was supplied. Every statement about the database in this and later documents is a **declaration from code**, not a live observation. Live schema, actual row counts, live RLS policies, live grants, and any drift between deployed schema and this repository's `db.js` are **unverified** and must be treated as a distinct, open item (see `02-coverage-and-limitations.md`). |
| SRC-ENV-04 | CI/CD | `.github/workflows/*.yml` in SRC-REPO-01 | 4 workflow files at inspected revision | Full read of `promote-production.yml`, `scheduled-production-promotion.yml`; header/trigger read of `render-deploy-verify.yml`, `render-deploy-monitor.yml` | No access to GitHub Actions run history, secrets, or repository variables (e.g. actual value of `PROMOTION_AGENT_ENABLED`, whether `production-ready`/`do-not-merge` labels exist and are in active use). |

## Repository-guidance documents (inspected first, per program instructions)

| Source ID | Type | Location | Scope inspected | Notes |
|---|---|---|---|---|
| SRC-DOC-01 | Project instructions | `CLAUDE.md` (repo root) | Full document, read prior to this session's other work | Authoritative for conventions per repo owner. Contains at least one statement contradicted by other evidence in this repo — see `07-decision-log.md` DEC-001. |
| SRC-DOC-02 | Project instructions | `AGENTS.md` (repo root) | Existence confirmed; full content not yet read into this register | Flagged for Stage 2 — not yet reconciled against `CLAUDE.md`. |

## Product / architecture documentation already in the repository

The repository already contains a very large volume of prior Claude-session-authored documentation (this matters directly for the program's premise that "existing Claude features" includes prior Claude documentation). This register does not re-derive that content — it records that it exists and where, so Stage 2/3 can treat it as source material to reconcile, not as ground truth by default (per the objective's instruction that authorship does not establish correctness).

| Source ID | Type | Location | Notes |
|---|---|---|---|
| SRC-DOC-10 | Functional spec | `FUNCTIONAL_DESIGN_SPEC.md` / `.docx` | Not yet content-reviewed in this pass |
| SRC-DOC-11 | Technical spec | `TECHNICAL_DESIGN_SPEC.md` / `.docx` | Not yet content-reviewed |
| SRC-DOC-12 | Technical/functional mapping | `FUNCTIONAL_TECHNICAL_MAPPING.md` / `.docx` | Not yet content-reviewed |
| SRC-DOC-13 | Merge/architecture spec | `PLATFORM_MERGE_SPEC.md` | Not yet content-reviewed |
| SRC-DOC-14 | Foundation source of truth | `docs/salt-basin-foundation-source-of-truth.md` + `.registry.json`, `docs/betsy-foundation-source-of-truth.md` | Not yet content-reviewed |
| SRC-DOC-15 | Canonical architecture set | `docs/canon/SB-00` through `SB-25` (14 files, one CSV) | Not yet content-reviewed; titles suggest this is the closest existing analog to a "current-state specification" and should be reconciled against, not duplicated, in Stage 2 |
| SRC-DOC-16 | Progress/handover logs | `docs/salt-basin-*-progress.md` (6 files: master-build, pre-build, contribution-intelligence, visual-metrics, website-intelligence, world-variants), `HANDOVER_*.md` (6 files at repo root) | Each corresponds to one of the repeatable skill-driven build programs already running in this repo (see `.claude/skills/salt-basin-*`). Relevant to Stage 3 because new design documents may target the same subsystems these describe. |
| SRC-DOC-17 | Test/scenario documentation | `docs/TEST-SCENARIOS.md` / `.csv`, `docs/SCENARIO_REGISTRY.md`, `docs/SCENARIO_REGISTRY_ARCHITECTURE_ASSESSMENT.md`, `docs/qa/bestystaff-auth-proposal-*.md`, `docs/testing/crystal-orbit-chat-acceptance.md` | Directly relevant to Stage 5 (verification). Not yet content-reviewed for overlap with `10-test-catalog.md`. |
| SRC-DOC-18 | Deployment guide | `DEPLOY.md` | Fully read this session (see prior turn) — describes Render+Netlify hybrid, both auto-deploying from `main`. No staging tier described. |
| SRC-DOC-19 | Render manifest | `render.yaml` | Fully read — `branch: main`, free-tier ephemeral disk caveat. |
| SRC-DOC-20 | Netlify manifest | `netlify.toml` | Not yet read in full; existence and role confirmed via `DEPLOY.md`. |

**Not yet inspected at all** in this pass (named for completeness, not silently dropped): `RevenueShieldFoundation/`, `HERQ/`, `context-reconciliation/`, `experience-memory/`, `experience-proof/`, `prototypes/`, `pptx_analysis/`, `output`/`outputs`/`output versions`/`generated`/`work`/`tmp` directories, root-level standalone JSON/CSV data dumps (`backlog-*.json`, `correlation-report.json`, `cost-reconciliation-plan.json`, `turn-classification.json`, `Tempsite.json`, etc.), and root-level Python/JS one-off scripts (`analyze_pptx.py`, `build_workbook.py`, `extract_pptx_visuals.py`, `parse_slide_colors.py`, `_verify_check3.mjs`, `_verify_out3.txt`). These appear to be working artifacts from prior sessions rather than current product documentation, but that has not been confirmed — do not treat their absence from later sections as a determination that they contain nothing relevant.

## Code — backend

| Source ID | Type | Location | Scope inspected |
|---|---|---|---|
| SRC-CODE-01 | Route handlers | `server/routes/*.js` (53 files) | Directory listing only — file names enumerated, contents not yet read. Names suggest module boundaries: auth, members, leads, career*, commercial*, agent*, memberSite/memberConfig (draft/publish pair per `CLAUDE.md`), oauth, resumeOutputs, etc. |
| SRC-CODE-02 | Shared server logic | `server/lib/*.js` and `server/lib/agents/*`, `server/lib/websiteIntelligence/*` (~90 files at top level) | Directory listing only |
| SRC-CODE-03 | Database adapter + schema | `server/db.js` (5,571 lines) | Line count and pattern counts only (`grep -c` for `CREATE TABLE` → 190, `ADD COLUMN IF NOT EXISTS` → 172); full content not yet read |
| SRC-CODE-04 | Auth | `server/auth.js` | Referenced via `CLAUDE.md` description only; not yet independently read |

## Code — frontend

| Source ID | Type | Location | Scope inspected |
|---|---|---|---|
| SRC-CODE-10 | App shell / routing | `src/App.jsx` | Route-tag count only (39 `<Route` occurrences); not yet read for route paths/guards |
| SRC-CODE-11 | Top-level components | `src/components/*.jsx` (34 files) | Directory listing only |
| SRC-CODE-12 | Admin components | `src/components/admin/*` (78 entries) | Directory listing only |
| SRC-CODE-13 | Block/section renderers | `src/components/blocks/*` (7 files incl. `index.jsx` REGISTRY per `CLAUDE.md`) | Directory listing only |
| SRC-CODE-14 | Shared libs/config | `src/lib/`, `src/config/`, `src/data/`, `src/scenarios/` | Referenced indirectly via test imports (see SRC-TEST rows below); not yet independently inventoried |

## Configuration and environment

| Source ID | Type | Location | Notes |
|---|---|---|---|
| SRC-CFG-01 | Env var template | `.env.example` | Fully read. Declares `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `PORT`. **Does not declare `DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`, `APP_BASE_URL`, `BREVO_API_KEY`, or any of the 14 OAuth provider key pairs** — all of which `CLAUDE.md`'s own "Key env vars" section documents as real, required-in-production variables. See `07-decision-log.md` DEC-002. |
| SRC-CFG-02 | Package manifest | `package.json` | Fully read. Node engine `>=22.5.0`. Scripts include `dev`/`client`/`server`/`build`/`start`/`seed` (matches `CLAUDE.md`) plus a large set of scripts `CLAUDE.md` does not mention: `postbuild` (runs `scripts/run-codex-contribution-intelligence.mjs` automatically on every build), `contribution:*`, `backlog:reconcile-history`, `verify:metrics`, `verify:crystal-orbit(:live)`, `test:*`, `scenarios:*`, and a real `test` script running Jest. See DEC-001. |
| SRC-CFG-03 | Build config | `vite.config.js` | Not yet read |
| SRC-CFG-04 | Test config | `jest.config.js` | Fully read. Native-ESM Jest, scoped to `server/**/*.test.js` only; explicitly excludes React/jsdom testing ("a separate future addition — not added here") and explicitly leaves the pre-existing `tests/*.test.js` (`node:test`-based) alone. |

## Migrations

| Source ID | Type | Location | Notes |
|---|---|---|---|
| SRC-MIG-01 | Migration/report artifacts | `migrations/` | Contains one dated SQL file (`20260809_member_crystal_worlds.sql`) plus three non-SQL artifacts: `legacy-object-migration-report.md`, `migrated-data-summary.json`, `terminology-migration-registry.json`. This is **not** the primary migration mechanism — per `CLAUDE.md`, schema migrations actually run as idempotent `ADD COLUMN IF NOT EXISTS` statements inside `server/db.js bootstrap()`, executed at every boot. The `migrations/` directory's relationship to that boot-time mechanism has not yet been confirmed (unclear whether it's a historical record, a parallel mechanism, or dead weight — flagged for Stage 2/DEC log). |

## Tests

| Source ID | Type | Location | Scope inspected |
|---|---|---|---|
| SRC-TEST-01 | Node built-in test runner suite | `tests/*.test.js` (8 files) + `tests/fixtures/*.json` | Full file headers/content read for all 8 files (see `10-test-catalog.md` for what each verifies) |
| SRC-TEST-02 | Jest suite | `server/lib/**/*.test.js` (5 files: `agents/crystalWorldAuditAgent.test.js`, `agents/staticHeuristics.test.js`, `seo.test.js`, `cronMatch.test.js`, `agentStudioGovernance.test.js`) | Located via search; contents not yet read line-by-line |
| SRC-TEST-03 | Verification scripts (non-test-runner) | `scripts/verify-metric-intelligence.mjs`, `scripts/verify-crystal-orbit-chat.mjs`, `scripts/verify-besty-auth-proposal.mjs` | Referenced via `package.json` scripts; not yet read. `CLAUDE.md` states "Verification is done via the `/verify` skill against the running app" — relationship between that skill and these standalone scripts not yet confirmed. |

## CI/CD (full detail)

| Source ID | Type | Location | Key facts confirmed by direct read |
|---|---|---|---|
| SRC-CI-01 | Workflow | `.github/workflows/render-deploy-verify.yml` | Runs on every push to `main`; waits 180s, checks Render created a deploy for that commit, files a GitHub Issue if not. |
| SRC-CI-02 | Workflow | `.github/workflows/render-deploy-monitor.yml` | Runs every 5 minutes on a schedule; opens a GitHub Issue (deduped by `deploy_id`) if the latest Render deploy is in a failure state. |
| SRC-CI-03 | Workflow | `.github/workflows/scheduled-production-promotion.yml` | Sundays 14:00 UTC (or manual dispatch). Requires repo variable `PROMOTION_AGENT_ENABLED=true` to act on schedule. Selects the oldest open, non-draft PR against `main` labeled `production-ready` without `do-not-merge`, checks it out at the PR merge ref, runs `npm ci && npm run build`, and — if not a dry run — squash-merges it directly to `main` with `gh pr merge`. **No test run (`npm test`) is part of this gate — only install + build.** Comments on the PR on success (dry run) or failure. |
| SRC-CI-04 | Workflow | `.github/workflows/promote-production.yml` | `workflow_dispatch`-only (manual, with required inputs referencing "Salt Basin deployment record"/"promotion gate" IDs that imply an external tracking system not identified elsewhere in this pass). Builds, then POSTs to `RENDER_DEPLOY_HOOK_URL` and `NETLIFY_BUILD_HOOK_URL` secrets if set. |

**Material finding surfaced by this row set:** there is no staging/preview environment or branch anywhere in this configuration. `main` is production for both Render and Netlify (`render.yaml` `branch: main`; `DEPLOY.md` "Push to `main` on GitHub. Both Render and Netlify auto-deploy from `main`"). The only gate between a PR and production is build success — never a test run — plus an optional manual label step. This was already communicated to the user in this session prior to this document's creation and is repeated here as a registered, evidenced finding rather than a recalled claim.

## External sources referenced but unavailable

| Reference | Where referenced | Availability |
|---|---|---|
| Supabase project (live) | `CLAUDE.md` "Key env vars" (`DATABASE_URL`), `server/db.js` connection logic | Unavailable — no connector, no credential (SRC-ENV-03) |
| Render dashboard (live) | `DEPLOY.md`, `render.yaml` | Unavailable |
| Netlify dashboard (live) | `DEPLOY.md`, `netlify.toml` | Unavailable |
| GitHub Actions run history / repo variables / secrets | `.github/workflows/*` | Unavailable (only workflow *definitions* were inspected, not their execution history or the live value of `PROMOTION_AGENT_ENABLED`, `production-ready` label usage, etc.) |
| Base44 MCP connector | Surfaced by the environment as requiring authorization | Unavailable — not authorized this session; not yet determined whether it's relevant to this program |
| Canva MCP connector | Surfaced by the environment as requiring authorization | Unavailable — not authorized this session; not yet determined whether it's relevant to this program |
| "New design documents" (the reconciliation input) | Referenced throughout the governing objective | **Not yet supplied.** This is the primary blocker for Stages 3–4 and most of 5–6. |

Coverage boundaries, exclusions, and what "complete" means for this pass are stated separately in `02-coverage-and-limitations.md`.
