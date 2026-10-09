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

## Career subsystem elements (registered 2026-09-10, linked from `06-reconciliation-matrix.md`'s resume-product reconciliation pass)

These were read in full and linked from real requirement rows — not a speculative enumeration ahead of need, per this register's own rule above.

| Element ID | Kind | Precise location | Responsibility | Inputs/outputs | Dependencies | Linked requirement IDs | Evidence |
|---|---|---|---|---|---|---|---|
| TE-CAREER-01 | DB table (×7) | `server/db.js` — `career_jobs` (~L3680), `career_skills`, `career_tools`, `career_engagements`, `career_domains`, `career_certifications`, `career_deals` | Legacy, per-user flat CRUD career records — the actual editing surface today per `CLAUDE.md`'s "Career Channel Rod" section | In: `CareerMasterPanel.jsx`/`MyResumePanel.jsx` writes. Out: read by TE-CAREER-02's atom mapping | TE-CAREER-02 (kept live-synced by TE-CAREER-12) | NEW-028 | Full read, 2026-09-10 |
| TE-CAREER-02 | server lib module | `server/lib/careerAtomRegistry.js` (174 lines, full read) | Table-driven field-mapping: each of TE-CAREER-01's meaningful columns becomes one governed "Career Atom" (~80 total), one "Career Molecule" per entry type | In: `CAREER_ENTRY_SOURCES` config. Out: `generateCareerAtomDefinitions()`/`generateCareerMoleculeDefinitions()`, consumed by `journey_metadata_molecules` seeding | TE-CAREER-01 | NEW-028 | Full read |
| TE-CAREER-03 | DB table | `server/db.js` `career_intake_documents` (~L3988) | Uploaded source-document metadata + evidence label per document (`source_truth_status`: `source_of_truth`/`primary_validated`/`user_attested`/`synthetic_scenario`) + policy acks (`redaction_ack`, `public_output_validation_ack`, `no_private_name_persistence_ack`) | In: `CareerIntakePanel.jsx` upload form | `career_intake_runs` (TE-CAREER-04) | NEW-020, DEC-011 | Full read |
| TE-CAREER-04 | DB table | `server/db.js` `career_intake_runs` (~L4017) | One analysis run over 1+ intake documents (`status`, `analysis_passes_requested`, `primary_resume_requested`, `resume_preset_created`) | In/out: `document_ids` JSONB, `summary`, `metadata` | TE-CAREER-03 | NEW-028 | Full read |
| TE-CAREER-05 | DB table | `server/db.js` `career_source_mappings` (L4036–4054) | One row per (source document/kind, target Career Atom, target legacy row): `original_value` vs `committed_value`, `match_type`, `affinity` — closest existing analog to the new spec's proposed "Source"/"Claim" records | In: intake-run extraction. Out: read by `detectConflicts()` (TE-CAREER-06) | TE-CAREER-02, TE-CAREER-03 | NEW-028, DEC-011 | Full read |
| TE-CAREER-06 | DB table + server lib module | `server/db.js` `career_reconciliation_tasks` (L4065–4083) + `server/lib/careerReconciliation.js` (221 lines, full read) | Detects `source_conflict` (2+ sources disagree on one atom) and `ambiguous_mapping` (no/weak atom match) from TE-CAREER-05; never auto-picks a value — always a human resolution (UI or BestyStaff tool) | In: `career_source_mappings`. Out: `career_reconciliation_tasks`, `journey_rod_events` | TE-CAREER-05, TE-CAREER-09 | NEW-018, NEW-029, DEC-011 | Full read |
| TE-CAREER-07 | DB table | `server/db.js` `career_reasoning_approvals` (L4088–4103) | Records a member's approval that one AI-proposed reasoning pattern was correct, tied to one resolved reconciliation task | Written by `resolveReconciliationTask()` (TE-CAREER-06) when `reasoningApproved: true` | TE-CAREER-06 | NEW-030, DEC-011 | Full read |
| TE-CAREER-08 | DB table + server lib module + route | `server/db.js` `career_reasoning_cache_candidates` (L4105–4119) + `server/lib/careerReasoningCompiler.js` (76 lines, full read) + `server/routes/careerReasoningAdmin.js` | Cross-user aggregation of approved reasoning patterns (real population denominator: every user who ever had a task of that shape, not just approvers) + admin-gated promotion into a reusable `journey_current_definitions` rule (`career_reasoning_cache_approval`) | In: `career_reasoning_approvals`. Out: admin `approved`/`rejected` decision, `journey_current_definitions` row | TE-CAREER-07 | NEW-022, NEW-023, DEC-009, DEC-011 | Full read |
| TE-CAREER-09 | DB rows + server lib module | `journey_data_rods` (`rod_type='career_master'` / `'career_opportunity_target'`) + `server/lib/careerOpportunityRollups.js` (231 lines, full read) | Per-member tracked job opportunities; validated stage machine `discovered→approved→applied→interviewing→offer/rejected/withdrawn`; each scored via TE-CAREER-10 with an honest `score: null` when unscored | In: member-created or agent-proposed opportunity. Out: `rollupOneOpportunity()` read shape used by `CareerPlacementAgentsPanel.jsx` | TE-CAREER-10 | NEW-026, NEW-027, DEC-006 | Full read |
| TE-CAREER-10 | DB row (config) | `server/db.js` L5342 — `journey_current_definitions` row `current_key='career_match_scoring_v1'` | The actual, live weighted-sum scoring model: `scope_altitude` 0.15, `strategic_ops_transformation` 0.15, `revenue_systems_q2r` 0.15, `ai_validation_data_intel` 0.15, `pe_value_creation_finance` 0.15, `leadership_stakeholder_fit` 0.10, `transferable_industry_fit` 0.05, `practical_fit` 0.10 — **confirmed identical** to `SRC-RESUME-06`/S03 §7's described "15/15/15/15/15/10/5/10" career-opportunity ranking model. **Personally reweightable as of 2026-09-10** (NEW-032): `owner_user_id`-scoped rows now override these weights per member via `setPersonalScoringWeights()`, never changing the platform-default row or another member's row | Interpreted by `evaluateWeightedScore()` in `server/lib/opportunityPipelineRegistry.js`, never silently scores a missing dimension as 0. Resolution now via `getCurrent(key, { ownerUserId })` in `currentRegistry.js` | — | DEC-006, DEC-011, NEW-032 | Full read; direct byte-for-byte weight comparison against `SRC-RESUME-06`'s stated weights, 2026-09-10; 3-tier override built same day |
| TE-CAREER-11 | React components | `src/components/admin/CareerIntakePanel.jsx`, `CareerMappingPreview.jsx`, `CareerReconciliationPanel.jsx`, `CareerReasoningCompilerPanel.jsx`, `CareerMasterPanel.jsx`, `MyResumePanel.jsx`, `CareerPlacementAgentsPanel.jsx` | The real, already-shipped UI surface a member/admin sees today for intake, reconciliation, reasoning-pattern review, legacy CRUD editing, and opportunity tracking | — | TE-CAREER-01–10 | NEW-018, NEW-028 | Header-level read; not yet exercised in a browser this session (no live DB access) |
| TE-CAREER-12 | server lib module | `server/lib/careerAtomMigration.js` (`syncSingleEntry`/`removeEntryEvidence`) | Keeps TE-CAREER-02's Career Atoms live-synced with every TE-CAREER-01 create/update/delete | Called from `careerMaster.js`'s shared `makeResourceRouter` | TE-CAREER-01, TE-CAREER-02 | NEW-028 | Referenced via `CLAUDE.md`; not independently re-read this pass |

## What's already known and will seed this register in Stage 2

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
