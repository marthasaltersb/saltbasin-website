# Technical-Element Register

**Status:** populated (generated) as of revision `e0ea466`, 2026-10-01.

The register is the generated inventory in [`inventory/`](./inventory/README.md). Each element has a stable ID derived from its source identity (path, method, or name), not a sequence number, so IDs survive regeneration and only change when the element itself is renamed. Requirement rows in [`03-modules/`](./03-modules/) link to these IDs. `scripts/baseline/check-traceability.mjs` verifies every cited ID exists.

## Element kinds and where each is registered

| ID prefix | Kind | Register file | Count at `e0ea466` | Precise location given as |
|---|---|---|---|---|
| `TE-API-<METHOD>-<path>` | Express endpoint | [api-endpoints.md](./inventory/api-endpoints.md) → `api/<router>.md` | 592 | `file:line`, mount prefix, guard evidence |
| `TE-DB-<table>` | Table (declared) | [db-schema.md](./inventory/db-schema.md) → `db/<group>.md` | 211 (191 bootstrap, 20 elsewhere) | `server/db.js:line` (or other file); columns, constraints, indexes from the bootstrap catalog |
| `TE-UIR-<path>` | React Router route | [ui-routes.md](./inventory/ui-routes.md) | 37 | `src/App.jsx:line` and resolved component |
| `TE-CMP-<path>` | First-party `src/` module | [modules.md](./inventory/modules.md) | see file | path, lines, exports, importer count |
| `TE-SRV-<path>` | First-party `server/` module | [modules.md](./inventory/modules.md) | see file (424 total with CMP) | as above |
| `TE-BLK-<type>` | Section block type | [registries.md](./inventory/registries.md) | 67 | registry line + component definition line |
| `TE-TAB-<componentId>` | Admin shell tab | [registries.md](./inventory/registries.md) | 32 | `AdminShell.jsx:line` |
| `TE-THM-<theme>` | Named theme | [design-tokens.md](./inventory/design-tokens.md) | 6 | `src/brand.css:line` with every token value |
| `TE-ENV-<NAME>` | Environment variable **name** (never a value) | [env-vars.md](./inventory/env-vars.md) | 78 | first reference locations |
| `TE-JOB-<file>-L<line>` | Scheduled job/timer | [jobs.md](./inventory/jobs.md) | 9 | `file:line`, schedule |
| `TE-TST-<path>` | Test file | [tests.md](./inventory/tests.md) | 17 | path, runner, case names |
| `TE-SCR-<script>` | npm script | [tests.md](./inventory/tests.md) | 23 | command |

Responsibility, inputs/outputs and dependencies: the generated rows record location, exports and (for modules) importer counts. Responsibility and I/O are described in the linked requirement rows rather than duplicated per element. The element register says *where*; the module specs say *what it does*. 39 source modules have **no static importer**. They're listed in [modules.md](./inventory/modules.md) as candidates for dead-code review, which needs confirmation before any is called obsolete.

## Hand-registered elements (not produced by the generator)

These are real, load-bearing mechanisms that don't map to one file-level element:

| Element ID | Kind | Precise location | Responsibility | Inputs → outputs | Linked IDs | Evidence |
|---|---|---|---|---|---|---|
| TE-MW-enforceRequiredPasswordChange | Global Express middleware | `server/auth.js` `enforceRequiredPasswordChange`; mounted `server/index.js:131` | Blocks all non-auth API calls while `must_change_password` | session cookie → 428 or next() | REQ-02-006 | runtime observed 2026-10-01 |
| TE-MW-enforceCurrentCareerTerms | Global Express middleware | `server/auth.js` `enforceCurrentCareerTerms`; mounted `server/index.js:132` | Blocks API calls until current career-portfolio consent | session + consent rows → 428 or next() | REQ-02-007 | runtime observed 2026-10-01 |
| TE-MW-requireMemberFeature | Route middleware factory | `server/lib/memberAccess.js:95` | Feature/subscription gate | user → 402 or next() | REQ-04-001 | static |
| TE-GATE-emailAuthorized | Function gate | `server/lib/email.js:71-82` | Blocks outbound email lacking an authorization mode | authorization object → send/skip | REQ-09-002 | runtime observed 2026-10-01 |
| TE-CACHE-publishedSite | In-process cache | `server/routes/site.js:20-25` | 30 s cache of public site JSON | — | REQ-03-004 | static |
| TE-CACHE-publicConfig | In-process cache | `server/routes/config.js:14-20` | 30 s cache of public config | — | REQ-03-005 | static |
| TE-COOKIE-sb_admin | Cookie | `server/auth.js:6,17-25` | Session token | — | REQ-02-002 | static |
| TE-COOKIE-sb_landing | Cookie | `server/auth.js:7` | Pre-launch unlock | — | REQ-02-012 | static |
| TE-RATE-authLimiter | In-process rate limiter | `server/routes/auth.js:27`; `server/lib/rateLimit.js` | 10/15 min/IP on selected auth routes | IP → 429 | REQ-02-010 | static |
| TE-DDL-bootstrap | Schema mechanism | `server/db.js:93` `bootstrap()` | Boot-time idempotent DDL + platform seed rows | — | REQ-01-001, REQ-01-002 | runtime observed |
| TE-DDL-backlogIntelligence | Schema mechanism | `server/lib/backlogIntelligenceSchema.js:5` | Lazy DDL on first request | — | REQ-01-002 | static |
| TE-DDL-migrations-dir | Schema artifact | `migrations/20260809_member_crystal_worlds.sql` | Unapplied SQL (no code path) | — | REQ-01-002, DEF-17-002 | static |

Hand-registered IDs aren't validated by the checker, which validates generated `TE-` IDs. Keep this table small and move kinds into the generator once they recur.

## No implementation located

Requirements in the 2026-09-05 intake (`NEW-001`…`NEW-017`, pending validation) that have **no** implementing element in this register yet: field-level translation storage and consumers (NEW-005/006, see DEC-005), voice input (NEW-004), the document read-aloud validation capability (NEW-007…011), per-module generative 3D variant provisioning (NEW-016), and client-defined field extensions (NEW-014). This is a search result over the inventoried scope, not a mapping. Formal mapping waits for Stage 3 (06).
