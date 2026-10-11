# Seven-Layer Theory, Matrix & Journey Engine — Progress Tracker

Mutable state for the `salt-basin-seven-layer-theory` skill (`/seven-layer-theory`). Spec:
`.claude/skills/salt-basin-seven-layer-theory/reference/master-build-prompt.md` (v0.1, verbatim).
Phase definitions: `.claude/skills/salt-basin-seven-layer-theory/reference/phases.md`.

## Phase status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Discovery & Compatibility Assessment | **done** (2026-10-10) | Against `main` @ `bd6a576`. |
| 2 | Architecture & Extension Design | **awaiting review** (2026-10-10) | Proposed design below. Blocked on DEC-SLT-01 – 05. |
| 3 | Persistence & Registry Seeds | not started | Gate: Phase 2 approved + DEC-SLT-02, 03, 05 answered. |
| 4 | Theory Registry & Seven Definitions | not started | Also needs DEC-SLT-04 for musical concept seeds. |
| 5 | Matrix & Hypergraph Engine (5a / 5b) | not started | |
| 6 | Temporal, Calculation & Rest Engine (6a / 6b) | not started | |
| 7 | Builder Integration | **blocked** | DEC-SLT-01 — no diagram or process-flow builder exists in the repo. |
| 8 | Validation & Regression | not started | |

---

## Phase 1 — Compatibility assessment (spec §2 required output)

Inspected 2026-10-10. File/line references are to `main` @ `bd6a576`; re-verify before relying on them.

| Component | Existing implementation | Reusable? | Proposed extension |
|---|---|---|---|
| **Diagram builder** | **None.** No graph/diagram library in `package.json` (no reactflow/xyflow, mermaid, d3, cytoscape, jointjs). Closest: `MetadataModelDiagramBlock` (`src/components/blocks/MetadataModelBlock.jsx:10`, static CMS block, nodes in 3 tier columns, edges as text, list editors in `EditorPane.jsx:1899–1912`); `DecisionTreeBlock` (`blocks/index.jsx:5082`); `CommandCenterPanel.jsx` (read-only 2D node canvas). | **No** — nothing authoring-grade to extend. | Decision **DEC-SLT-01**. |
| **Process-flow builder** | **None.** `DefinitionStudioJourney.jsx` walks 5 fixed gates in Three.js but persists only to browser localStorage (`sb_definition_studio_journey_v1`). `src/lib/worldEngine/graphWorld.js` renders a 3D node graph (no edges, no editing). | Partial — `graphWorld.js` and the crystal design system (`src/lib/crystalGeometry.js`) are reusable *renderers*, not builders. | Decision **DEC-SLT-01**. |
| **Journey model** | `journey_data_rods` (`server/db.js:411`) with persistent identity, `parent_rod_id`, `org_id`/`user_id`; `journey_rod_events` (466, append-only log beside the mutable rod row); `journey_rod_types` (735); stages in `src/config/journeys/journeyDefinitions.js`; gates in `journey_stage_gates` (398) / `journey_gate_definitions` (496); Currents in `journey_current_definitions` (5006, `port_stages`, `transition_rules`, org-override seam). Evidence atoms: `journey_metadata_molecules` (479, definitions) + `journey_rod_evidence` (504, instances, `effective_from/to`); Molecules computed by `server/lib/eidosBonding.js`. | **Yes — strong fit.** Journey Data Rod already *is* a persistent composition identity whose evidence changes over time. | Map Note → evidence atom, Chord → computed Molecule, Rod → `journey_data_rods`. Staff/Sheet/Measure/Beat/Clef/Universal C/Rest are **new vocabulary** (zero occurrences in code — verified by grep). |
| **Supabase schema** | Supabase Postgres through the `postgres` driver (`server/db.js:1–56`, `prepare:false` for the pooler). Schema applied only by idempotent `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` in `bootstrap()` (`db.js:93`, run at import) or lazily by schema modules (`releaseIntelligenceSchema.js`, `ensureAgentRunnerSchema()`). `migrations/20260809_member_crystal_worlds.sql` is never applied by code. No Supabase CLI config. ~230 tables. Supabase JS client used for Storage only. | **Yes** — follow the additive bootstrap / lazy-schema convention. | New tables (Phase 2 list) created by a lazy `server/lib/theorySchema.js` module, additive-only, never touching member rows. |
| **Calculation engine** | Pure, tested: `src/lib/journeyEngine/rodMathematics.js` (position, completeness, readiness/blockers, maturity, confidence, density, coherence, alignment — 18 tests), `maturityEngine.js`, `queryConvergence.js` (7 tests). Untested: `maturity.js evaluateGate` (soft gates), `basin.js`, `divergence.js`, `genesis.js`. Weights via `src/config/metrics/*Methodology.js`, runtime-overridable through `server/lib/methodologyEnvelopes.js` (`/api/config-envelopes`). Result lineage store: `metric_definitions` + `metric_calculations` (`db.js:122–150`: `formula_json`, `inputs_json`, `calculation_version`, `as_of`, `context_json`). | **Yes — strong fit** for spec §9's "inputs / rule versions / method / temporal context / output / timestamp". | New pure modules beside `rodMathematics.js` (eligibility-normalized weights, expected vs actual progression, variance, Rest evaluation); results written to `metric_calculations`; weights in a methodology envelope. |
| **Authentication and RLS** | **No RLS anywhere** (no `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` / `auth.uid` in `server/`, `migrations/`, `scripts/`). Server uses a full-privilege `DATABASE_URL`. Isolation is app-level: `requireAdmin` (`server/auth.js:162`), `requireUser` (:170), `org_memberships` lookups, `req.user.id` scoping; MCP tokens via `platformAccess.js` with the same gates. | **Yes**, as app-level isolation. The spec's "preserve Supabase RLS" has nothing to preserve. | Decision **DEC-SLT-02**. |
| **Audit / versioning** | `audit_log` via `server/lib/audit.js audit()` (best-effort); `audit_events` via `server/audit.js writeAudit()` (fail-closed, backlog entity types only). Versioned-definition precedent: `scenario_definition_versions` (`db.js:181`: immutable by version + hash, `review_status`, `effective_from/to`, one-active partial unique index). Approval-path precedent: render bindings (`renderBindings.js`: proposed evidence + `change_proposed` event with impact snapshot + `agent_approval_workflows` steps). | **Yes.** | Concept definitions copy the `scenario_definition_versions` shape; builder edits copy the render-bindings proposal path; audit via `audit_log`. |

### Additional findings that shape the design

- **Canonical entities already exist**: `entities` (`db.js:5106`, `canonical_name`, `entity_type`, `merged_into_id` dedup) and `persons` (5126). Reuse as the hypergraph vertex set V for legal entities and people — never re-store them.
- **Relationships are bilateral only**: `relationships` (5151) is owner-user → one person/entity; `journey_rod_tributary_links` (4988) is rod_a ↔ rod_b. Nothing supports n-ary participation, typed roles across >2 parties, or a relationship participating in another relationship. The hypergraph is a genuine gap.
- **Layer numbering collision**: `src/config/architecture/layerRegistry.js` already defines layers 0–10 (Identity & Governance … Visual Semantics), and the Business Definition Tool spec uses L0–L7 for a different taxonomy. The spec's L1–L7 would be a third. Decision **DEC-SLT-03**.
- **No product registry**: products appear as `product_licenses` keys (`finbridgeco`, `handoveros`) and a hardcoded list in `CommandCenterPanel.jsx:15`. The spec's "Product → Layer → Matrix → Concept" selector needs a canonical list. Decision **DEC-SLT-05**.
- **No 3D matrix/grid visualization** exists; Three.js 0.185 and the crystal design system are available.
- **Repo is public** — universal theory content is fine in git; Salt Basin product-specific definitions are proprietary and should live in the database only.

---

## Phase 2 — Proposed architecture (awaiting review)

### Principle

Everything the spec names maps to existing substrate first. New storage is limited to what the
`/channel-journey-architecture` checklist can't express. Result: **six new tables** (not 49), four code
registries, and reuse of eleven existing surfaces.

### Code registries (config, append-only, `src/config/theory/`, readable without a database)

| Registry | Contents |
|---|---|
| `theoryLayerRegistry.js` | 7 layers, stable keys `theory_identity` … `theory_visual_ux`, display ids per DEC-SLT-03, mathematical / musical / scientific foundations from spec §3, `version`. |
| `definitionTypeRegistry.js` | D1 Mathematical … D7 Rest; D7 fixed as Rest. |
| `matrixFamilyRegistry.js` | The 49 families from spec §5, each `{ familyKey, layerKey, name, status: 'proposed' }`. Extensible by append. |
| `theoryVocabulary.js` | Equivalence classes (literal / structural correspondence / design analogy); definition statuses (published baseline, user-confirmed, proposed, inferred — needs confirmation, conflict, deprecated); participation states (active, sustained, authorized_rest, pending, failed, unknown); time kinds (calendar, effective, recorded, progression, expected_completion). |

### Reuse map (no new storage)

| Spec concept | Reused surface | How |
|---|---|---|
| Canonical entities V | `entities`, `persons` | Hypergraph participants reference these by id. |
| Journey Data Rod | `journey_data_rods` | Unchanged; identity persists across composition changes. |
| Note | `journey_metadata_molecules` + `journey_rod_evidence` | A Note is an evidence atom. |
| Chord | `eidosBonding.js` computed Molecule, snapshot via `journey_rod_events` | Never a static membership list (channel-journey rule). |
| Journey Sheet | new `rod_type` `journey_sheet` + hierarchical Tributary to its Staff rods | Config rows, not schema. |
| Staff (journey cycle) | a rod's cycle, defined as a Current | See interval cycles below. |
| Interval cycle (1–12), Measure, Beat | `journey_current_definitions` with a new `cycleModel` shape in `entry_criteria` (precedent: `scoringModel`, `cadenceModel`) | Intervals `{sequence, start, end, duration, classification, ruleRefs, measureRefs, requirementRefs}`; beats are sub-intervals. Validation: 1 ≤ count ≤ 12, unequal durations allowed. |
| Participation state / authorized Rest | `journey_rod_events` (`participation_state_set`) + `journey_rod_decisions` for authorization | Event-sourced; Rest event must carry rule, context, interval, reason, authorization ref. Missing evidence → `unknown`, never Rest. |
| Stage gates, dependencies, eligibility | `journey_gate_definitions`, `evaluateGate`, `qualificationGateCheckers.js` | Extend with eligibility predicates; soft-guidance stays. |
| Weights / methodology | `methodologyEnvelopes.js` new `theory-calculation` envelope | Editable on `MethodologyConfigPanel`. |
| Calculation results | `metric_definitions` + `metric_calculations` | Every result carries inputs, rule versions, method, temporal context. |
| Visual edit → change pipeline | render-bindings proposal path + `agent_approval_workflows` (`pipeline='theory_change'`) | Validation → rules → dependency → impact preview → approval → persist → audit. |
| Audit | `audit_log` | Every definition / matrix / relation write. |

### New tables (proposed — channel-journey classification in brackets)

| Table | Purpose | Classification |
|---|---|---|
| `theory_concepts` | Concept identity: `concept_key`, `layer_key`, optional `matrix_family_key`, `org_id` (NULL = universal). | NEW TABLE, JUSTIFIED — a theory concept (e.g. "Chord") is not an evidence atom, rod type, or Current; no existing registry holds cross-domain concept identity. |
| `theory_concept_definition_versions` | One row per (concept, definition type D1–D7, scope, version): text, formal expression, source, equivalence class, validation method, status, effective/superseded dates, author, hash. `scope` = `universal` or a product key. One-active partial unique index per (concept, type, scope). | NEW TABLE, JUSTIFIED — copies `scenario_definition_versions`; universal and product rows never overwrite each other. |
| `theory_matrices` | Configurable matrix instances: family key, axes, dimension types, cell schema, applicable contexts, temporal applicability, calculation / validation rule refs, lineage, version, status, selected 3D projection. | NEW TABLE, JUSTIFIED — no configurable-matrix store exists; 49 families share this one table. |
| `theory_matrix_cells` | Sparse cell values keyed by a coordinate hash, with effective dates and source. | NEW TABLE, JUSTIFIED — sparse n-dimensional values have no existing home. |
| `theory_relations` | Hypergraph edge 𝓔: relation kind (bilateral, multi-party, contract, ownership, composition…), directed flag, effective dates, `derived_from` provenance (source relation ids, governing rule, effective time), Universal C definition ref. | NEW TABLE, JUSTIFIED — `relationships` and Tributaries are bilateral and can't reference other relationships. |
| `theory_relation_participants` | Typed participation: `participant_kind` (entity, person, rod, relation, concept), id, role, clef key, direction, effective dates. `participant_kind='relation'` gives relationship-of-relationship. | NEW TABLE, JUSTIFIED — n-ary typed participation. Rod participants additionally register through a `'reference'` Tributary so rod lookups stay on the one generic path. |

Deferred until DEC-SLT-01: `theory_diagram_bindings` (builder node/edge ↔ matrix / rod / relation).

### API, MCP, UI (Phases 4–7)

- Routes under `/api/theory/*` — universal definitions `requireAdmin` to write, readable by signed-in users; product definitions per DEC-SLT-07.
- One MCP tool per capability in `mcpToolRegistry.js` (`theory_*`), rows in `capabilityParity.js`.
- UI inside World Shell as a Journeys card: Product → Layer → Matrix → Concept → seven definitions, universal baseline shown read-only beside the editable product definition.

---

## Decision log

Blocking decisions must be answered before the phase they gate. Answer with
`/seven-layer-theory approve DEC-SLT-01=<choice> …` or in conversation.

| ID | Question for Betsy | Options | Recommendation | Blocks |
|---|---|---|---|---|
| **DEC-SLT-01** | The spec says to extend "the existing process-flow and diagram builder," but the repo has none. Where is it? | (a) It lives somewhere else — another repo, an HTML artifact, or an external tool (Lucid, Miro, Figma, Whimsical) — point me to it. (b) Build the platform's first builder inside World Shell: 2D authoring with a library such as `@xyflow/react`, 3D projection via `graphWorld.js` + crystal design system. (c) Extend the CMS `MetadataModelDiagramBlock` editor (weak — static, admin-only). | (a) if it exists; otherwise (b), scoped as its own feature. | Phase 7 (blocking); informs Phase 2 bindings. |
| **DEC-SLT-02** | The spec says "preserve Supabase RLS," but no table uses RLS — isolation is in application code. | (a) Keep app-level isolation like every other table. (b) Introduce RLS for the new theory tables only. (c) Platform-wide RLS as a separate project. | (a). (b) would be the only RLS tables and the server connects with full privilege, so it would protect nothing without a role change. | Phase 3 |
| **DEC-SLT-03** | The spec's L1–L7 collides with the existing architecture layers 0–10 and the Business Definition Tool's L0–L7. | (a) Store as `theory_*` keys, display as "TL1–TL7". (b) Store as `theory_*` keys, display as "L1–L7" only inside the Theory screens. (c) Merge into the existing 0–10 registry. | (b) — keeps your vocabulary in the UI, no collision in data. | Phase 3 |
| **DEC-SLT-04** | Confirm the musical mappings: Note = evidence atom; Chord = computed molecule; Rod = Channel Rod; Clef = a party's role-context in a bilateral relation; Universal C = the canonical relation definition; Staff = one rod's journey cycle; Journey Sheet = a parent rod over several Staffs; Measure = interval; Beat = sub-interval; Musical section = stage (may overlap measures). | Confirm / correct each. Default equivalence class for all: design analogy. | Confirm, with design analogy as the default class. | Phase 4 seeds |
| **DEC-SLT-05** | Which products appear in the Product selector, and what are their canonical keys? (Found in code: `handoveros`, `finbridgeco`; in your docs: HOS, SaltTide, SaltLedger, Salt Covenant Solutions, HERQ.) | List them. | — | Phase 3 |
| DEC-SLT-06 | Bar for "published baseline": only universal math / music / science definitions with a cited reference (e.g. graph theory, Allen's interval algebra, standard music theory texts) get that status; everything else is `proposed`. | Confirm / tighten. | Confirm. | Phase 3 seeds (non-blocking) |
| DEC-SLT-07 | Who may edit product-specific definitions — platform admin only, or can an org override them (existing `org_id` NULL = default / set = override pattern)? | Admin only / org-overridable. | Admin only for v1. | Phase 4 (non-blocking) |
| DEC-SLT-08 | The repo is public. Product-specific definitions are your IP — keep them in the database only, never in git seeds? | Yes / no. | Yes. | Phase 3 (non-blocking) |

---

## Changelog

- **2026-10-10** — Command `/seven-layer-theory` and skill `salt-basin-seven-layer-theory` created; spec stored verbatim. Phase 1 discovery run against `main` @ `bd6a576`: compatibility assessment filled. Key findings: no diagram/process-flow builder exists; no RLS exists; canonical entities and versioned-definition, calculation-lineage and approval-path precedents all exist and are reused; layer numbering collides. Phase 2 architecture drafted (6 new tables, 4 code registries, 11 reused surfaces) and set to `awaiting review`. No schema, route, or UI code changed.
