# Coverage, Exclusions, and Open Access Gaps

This document defines what "the inventory is complete" means for the current pass, so completeness claims elsewhere in this documentation area are bounded rather than implied.

## What this pass covers

- **Repository structure**: full top-level and one/two-level directory listings across the repository (`server/routes`, `server/lib`, `src`, `src/components`, `src/components/admin`, `src/components/blocks`, `docs`, `migrations`, `.github/workflows`, `tests`).
- **Declared configuration**: full reads of `.env.example`, `package.json`, `jest.config.js`, `render.yaml`, `DEPLOY.md`.
- **CI/CD behavior**: full reads of all four GitHub Actions workflow files, establishing the actual promotion path from PR to production.
- **Existing automated test intent**: full reads of all 8 `tests/*.test.js` files (via headers and key assertions), establishing what is and is not currently verified by automation. See `10-test-catalog.md`.
- **Repository-guidance documents**: `CLAUDE.md` read in full (it is supplied as this session's project instructions and was already in context before this program began).

## What this pass explicitly does not yet cover (Stage 2 scope)

- **Route-by-route and screen-by-screen inventory** of `server/routes/*.js` (53 files) and `src/components/**` (34 top-level + 78 admin + 7 block files) — only directory listings exist so far, not content.
- **Database schema detail** — `server/db.js`'s 190 `CREATE TABLE` statements and 172 additive-migration statements have been counted, not enumerated. No table/column/key/index/policy register exists yet.
- **Content review of the repository's own prior specification documents** (`FUNCTIONAL_DESIGN_SPEC.md`, `TECHNICAL_DESIGN_SPEC.md`, `PLATFORM_MERGE_SPEC.md`, `docs/canon/SB-*`, the foundation-source-of-truth files, and the six `HANDOVER_*.md` files) — their existence and location are registered (SRC-DOC-10 through SRC-DOC-17), but their content has not yet been reconciled against the code. Given their volume, this is expected to be one of the largest parts of Stage 2, since the objective explicitly treats prior Claude documentation as a source to verify against code — not as ground truth.
- **`AGENTS.md`** — existence confirmed, content not yet reconciled against `CLAUDE.md` (they may agree, one may supersede the other, or they may conflict; unknown).
- Large parts of the repository root not yet inspected at all: `RevenueShieldFoundation/`, `HERQ/`, `context-reconciliation/`, `experience-memory/`, `experience-proof/`, `prototypes/`, `pptx_analysis/`, `output*`/`generated`/`work`/`tmp` directories, and the standalone data-dump JSON/CSV files and one-off scripts at repo root (full list in `01-source-register.md`).

## Explicit exclusions

- **`node_modules/`, `package-lock.json` contents, and other vendor/generated output** are excluded from inventory as vendor content, per the program's own instruction to exclude generated/vendor content where appropriate. This exclusion is stated, not silent.
- **Binary/office documents** (`.docx`, `.pdf`, `.pptx`, `.xlsx` files present at repo root and under `pptx_analysis/`, `outputs/`) are catalogued by filename only in this pass, not opened, since their `.md` counterparts appear to hold the same content in several cases (e.g. `FUNCTIONAL_DESIGN_SPEC.md` alongside `FUNCTIONAL_DESIGN_SPEC.docx`) — this assumption is unverified and flagged for Stage 2.

## Live environment / database access — explicit statement

**No live Supabase/Postgres connection, and no live Render or Netlify access, exists in this session.** This was confirmed by:
- `ListConnectors` (Supabase/Postgres/database keywords) returning zero results, and
- no `DATABASE_URL` or hosting-provider credential being available to this session.

Per the governing instructions, this means:
- Every statement in this documentation area about the database is derived from `server/db.js`'s declared schema (code), never from a live inspection of Supabase.
- **Drift between the declared schema and the live database is unverified and unknown** — it is not assumed to be zero, and it is not assumed to exist. It is an open item.
- If authorized read-only Supabase access becomes available later, live-schema findings will be recorded separately from code-declared findings (per the objective's instruction to keep the two separate and surface drift explicitly, not silently reconcile).
- No production migration, schema change, or data operation will be run to "complete" this specification, consistent with the objective.

## Coverage-by-area summary table

| Area | Repos/dirs in scope | Inspected this pass | Not yet inspected | Access limitation |
|---|---|---|---|---|
| Backend routes | `server/routes/*` (53 files) | Directory listing | File contents | None (read access exists; not yet done — time-boxed to Stage 2) |
| Backend shared logic | `server/lib/**` (~95 files) | Directory listing | File contents | Same |
| Database schema | `server/db.js` | Pattern counts | Table/column/policy detail | Same, plus no live DB (see above) |
| Frontend components | `src/components/**` (~119 files) | Directory listing | File contents | Same |
| Frontend routing | `src/App.jsx` | Route-tag count | Actual paths/guards | Same |
| Existing prior specs | `docs/canon/*`, `FUNCTIONAL_*`, `TECHNICAL_*`, `PLATFORM_MERGE_SPEC.md`, foundation-of-truth docs, `HANDOVER_*` | Filenames/location only | Full content reconciliation | None — largest remaining Stage 2 item |
| CI/CD | `.github/workflows/*` (4 files) | Full content | Live run history, secrets/vars values | No GitHub Actions API access this session |
| Tests | `tests/*`, `server/lib/**/*.test.js` | `tests/*` full content; Jest suite located, not read | Jest suite content, `scripts/verify-*.mjs` content | None — time-boxed |
| Live database | Supabase | Not inspected — no access | Everything | No connector/credential authorized |
| Live hosting | Render, Netlify | Not inspected — no access | Everything | No credential authorized |

## Blockers to later stages

| Stage | Blocked by | Status |
|---|---|---|
| 2 (deep current-state inventory) | Nothing blocking — can proceed incrementally; sized to be large, not blocked | Open, not started |
| 3 (new-requirement extraction) | **New design documents not yet supplied by user** | Blocked |
| 4 (target specification) | Depends on 2 and 3 | Blocked |
| 5 (acceptance scenarios + browser verification) | Depends on 4 for anything beyond cataloguing what already exists; also requires authorized test accounts / controlled fixtures / a reachable running instance (local dev per `CLAUDE.md`, or a to-be-created non-production environment) — none confirmed available yet | Partially blocked; `10-test-catalog.md`'s inventory of *existing* tests does not require this |
| 6 (ongoing patch-release process) | Depends on 4 and 5 existing first | Blocked |

## Next concrete step

The single highest-leverage next input is **the new design/product/UX documents** referenced in the objective — without them, Stage 3 (requirement extraction) and everything downstream cannot begin, and continuing to deepen Stage 2 alone risks producing a large current-state inventory that has to be re-walked once real requirements arrive. Recommended order:

1. You review `01-source-register.md` and `07-decision-log.md` and resolve or confirm the open items there (in particular DEC-001, DEC-002, DEC-003 below).
2. You supply the new design documents (or confirm there are none yet and this should proceed as current-state documentation only for now).
3. In parallel, Stage 2 can continue independently on whichever module cluster you'd like prioritized (e.g., "member public sites," "admin CMS," "career pipeline," "commercial opportunity pipeline") — say which, or none, and general breadth-first coverage will be assumed.
