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
| **Journey model** | `journey_data_rods` (`server/db.js:411`) with persistent identity, `parent_rod_id`, `org_id`/`user_id`; `journey_rod_events` (466, append-only log beside the mutable rod row); `journey_rod_types` (735); stages in `src/config/journeys/journeyDefinitions.js`; gates in `journey_stage_gates` (398) / `journey_gate_definitions` (496); Currents in `journey_current_definitions` (5006, `port_stages`, `transition_rules`, org-override seam). Evidence atoms: `journey_metadata_molecules` (479, definitions) + `journey_rod_evidence` (504, instances, `effective_from/to`); Molecules computed by `server/lib/eidosBonding.js`. | **Yes — as Journey Staffs.** Per Betsy 2026-10-10 (DEC-SLT-04): the existing `journey_data_rods` rows are *sequential processes* and become **Journey Staffs** in the theory vocabulary. The spec's **Journey Data Rod** is a new concept: a persistent chord (data combination). | Map existing Channel Rod (`journey_data_rods` row) → Journey Staff; Note → evidence atom; new Journey Data Rod → a persistent composition (see Phase 2). Sheet/Measure/Beat/Clef/Universal C/Rest are **new vocabulary** (zero occurrences in code — verified by grep). |
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
`/channel-journey-architecture` checklist can't express. Result: **seven new tables** (not 49; the
seventh, `theory_arrangements`, added 2026-10-10 for Arrangements), five code registries (with
`instrumentRegistry.js`), and reuse of the existing surfaces listed below.

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
| **Journey Staff** (journey cycle, sequential process) | existing `journey_data_rods` rows (today's Channel Rods) + `journey_rod_types` | **Decided by Betsy 2026-10-10.** The table is **never renamed** (additive-only invariant; members' data depends on it). In theory vocabulary, a `journey_data_rods` row *is* a Staff and a `journey_rod_types` row is a Staff type. Its cycle (intervals/measures) is defined as a Current — see below. |
| Note | `journey_metadata_molecules` + `journey_rod_evidence` | A Note is an evidence atom. Note instances are recorded on a Staff (`journey_rod_evidence.rod_id`). |
| **Journey Data Rod** (persistent chord identity) | `theory_relations` row with `relation_kind='journey_data_rod'` (proposed table below) | **Decided by Betsy 2026-10-10:** the Rod is the data combination, not the process. Its identity is permanent; its member Notes are `theory_relation_participants` rows (`participant_kind='evidence'`) with `effective_from/to`, so membership changes never create a new Rod. Its placement on a Staff is a participant row (`participant_kind='staff'`, role `placed_on`, with measure/beat refs). |
| Chord | Derived, never stored: the Rod's members effective at time *t* | Chord(Rod, *t*) = participants effective at *t*. `eidosBonding.js` may **propose** members (bonding affinity), but adding/removing a member is a governed, provenance-carrying change — this is how the Rod avoids the channel-journey "static pre-declared membership list" anti-pattern. |
| **Score** (cross-Staff composition) | new `rod_type` `score_staff` (one `journey_data_rods` row per Score's Staff) + new Tributary type `score_source` (peer/reference link from the Score's Staff to each source Staff) | **Decided by Betsy 2026-10-10 (DEC-SLT-09).** Notes from several Staffs can only be combined by creating a Score; its chords live on the Score's single Staff. Notes are **referenced** (participant → source `journey_rod_evidence` row), never copied, so canonical identity and provenance hold. Validation: a Rod's Note participants must come from its own Staff, or — only for a Score's Staff — from that Score's registered source Staffs. A Score is a composition, never evidence of an agreement between the parties (spec §6). Whether Score = Journey Sheet: DEC-SLT-11. |
| **Instrument** (delivery of a Note) | new code registry `src/config/theory/instrumentRegistry.js` (append-only), each entry pointing at a delivery surface that already exists: World Shell desktop, 390px mobile, API, MCP tool, email (`server/lib/email.js`), generated document/PDF (`outputRendering.js`), 3D world (`SpatialJourneyWorld.jsx`), BestyStaff chat | **Introduced by Betsy 2026-10-10.** No table. The instrument list itself is DEC-SLT-12. Interface parity (UI / mobile / API / MCP) already guarantees the same capability is playable on several instruments. |
| **Player** (end user who plays an Instrument) | the Staff's existing owner (`journey_data_rods.user_id`, or a `persons` row for someone without an account) | **Introduced by Betsy 2026-10-10.** Who may be a Player is DEC-SLT-15. |
| **Part** (one Player + Instrument on a Sheet) | a Staff (`journey_data_rods` row) that is a child of a `journey_sheet` rod via the hierarchical Tributary, plus a new nullable additive column `instrument_key` on `journey_data_rods` (the part's default instrument) | **Introduced by Betsy 2026-10-10:** several Staffs on one Sheet = several Players/Instruments playing at the same time, the same or different Notes. Additive column only; existing rows stay NULL. |
| **Played Note** (a Note delivered by an Instrument to a Player at a beat) | `theory_relation_participants` row on the part's Rod (`participant_kind='evidence'`) with added columns `instrument_key` (override, if allowed — DEC-SLT-13), `measure_ref`, `beat_ref` | The Note's identity stays canonical; each part's playing of it is a separate participation, so 3 Players playing the same Note is 3 participations of one Note, never 3 copies. Vertical alignment across a Sheet at a beat = every part's chord at that beat (harmony). Rest becomes per part: one Player can hold an authorized Rest while the others play. |
| **Composer** (defines the rules of a Score) | The people and tools that can already write rules: platform admins (`requireAdmin`), configurators editing methodology envelopes, Currents and gate definitions, developers through code registries, and AI tools through `agent_definitions` | **Introduced by Betsy 2026-10-10:** a Composer is an admin, developer, configurator or builder, or a tool, writing and creating the Score. No table — a Composer is a permission on writing rule records, recorded as `author` / `created_by` on every rule and definition version. An AI tool's composition is a **proposal** that waits for a human Composer (existing platform rule: everything an agent writes waits for a person). Role split: DEC-SLT-16. |
| **Score rules** | `journey_current_definitions` (`cycleModel` + transition rules), `journey_gate_definitions`, methodology envelopes, theory concept definitions | Unchanged design; now named as "what the Composer writes." |
| **Arrangement** (an alternative presentation of the same Score for an audience) | new table `theory_arrangements` (below) + existing style surfaces: World Variant Engine (`worldVariantRegistry.js`, `salt-basin-world-variants`), themes (`src/brand.css`), Instruments (`instrumentRegistry.js`) | **Introduced by Betsy 2026-10-10.** An Arrangement may choose parts, order, Instruments, emphasis, style and level of detail for an audience. It **never** changes a Note's value, a rule, or a calculation — two viewers of different Arrangements see the same facts. An Arrangement is not a security boundary: what a viewer may see is still enforced by entitlements (`data_entitlements`, org roles), and an Arrangement cannot reveal a Note the viewer isn't entitled to. |
| Journey Sheet | new `rod_type` `journey_sheet` + hierarchical Tributary to its Staffs | Config rows, not schema. A Sheet is itself a `journey_data_rods` row of that type, so it is a "Staff of Staffs" in storage — label it Sheet in theory screens. |
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
| `theory_relation_participants` | Typed participation: `participant_kind` (entity, person, staff, evidence, relation, concept), id, role, clef key, direction, effective dates, measure/beat refs. `participant_kind='relation'` gives relationship-of-relationship; `'evidence'` gives a Journey Data Rod its Notes; `'staff'` places a Rod on a Staff. | NEW TABLE, JUSTIFIED — n-ary typed participation with effective dating. Staff participants additionally register through a `'reference'` Tributary so Staff (`journey_data_rods`) lookups stay on the one generic path. |

| *(no table)* Arranging allowance | Stored on the Score's rule record (the Composer's Current / score definition) as `arrangingAllowance: { audiences, styles, instruments, parts, requiresApproval }`, enforced when an Arranger saves an Arrangement | Reuses the rule record — Composer ⊇ Arranger (DEC-SLT-16); limits pending DEC-SLT-19. |
| `theory_arrangements` | Versioned Arrangements of a Score: score ref, arrangement key, audience (DEC-SLT-17), style (world variant / theme / layout key), part selection and order, Instrument per part, detail level, `is_default`, status (draft / proposed / approved), version, effective dates, arranger / composer. One active version per (score, arrangement key). | NEW TABLE, JUSTIFIED — several versioned, audience-targeted presentations per Score; not a process (so not a rod_type), not a rule (so not a Current), not a shared site setting (so not `config_state`). |

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
| **DEC-SLT-04** | Confirm the musical mappings. | — | **Partly answered 2026-10-10 (Betsy):** existing Channel Rods (`journey_data_rods`, sequential processes) = **Journey Staffs**; **Journey Data Rods** = data combinations, i.e. persistent chords. **Still to confirm:** Note = evidence atom; Clef = a party's role-context in a bilateral relation; Universal C = the canonical relation definition; Journey Sheet = parent over several Staffs; Measure = interval; Beat = sub-interval; Musical section = stage (may overlap measures); default equivalence class = design analogy. | Phase 4 seeds |
| **DEC-SLT-09** | Can one Journey Data Rod draw its Notes from more than one Staff? | — | **Answered 2026-10-10 (Betsy):** a Rod is always placed on a single Staff. Combining Notes from more than one Staff **creates a new Score**, whose chords sit on one new Staff. The source Staffs are unchanged. | Phase 5b |
| **DEC-SLT-12** | What are the Instruments? Candidates already in the platform: website (desktop), website (phone), API, AI agent via MCP, email, generated document/PDF, 3D world, BestyStaff chat. | Confirm / add / remove. | — | Phase 3 seeds |
| **DEC-SLT-13** | Does each Player play one Instrument for their whole part (like a violinist), or can the same Player switch instruments note by note (e.g. one Note by email, the next on the dashboard)? | One per part / per note. | One per part by default, with a per-note override. | Phase 5b |
| **DEC-SLT-14** | Where do a Sheet's Notes live? If Notes belong to the Sheet, every part can play them without "pulling from another Staff," and DEC-SLT-09's new-Score rule applies only when Notes come from outside the Sheet. If Notes belong to each part's Staff, three parts playing the same Note would trigger the Score rule. | Notes belong to the Sheet / to each Staff. | Belong to the Sheet. | Phase 5b |
| **DEC-SLT-15** | Who can be a Player: only signed-in Salt Basin users, also people without an account (e.g. a customer contact who receives an email), and can an AI agent be a Player? | Users only / users + people / users + people + agents. | Users + people; agents deliver (they are Instruments), not Players — unless you see it differently. | Phase 5b |
| **DEC-SLT-11** | Is a "Score" the same as the spec's Journey Sheet (a coordinated collection of Staffs), or a separate concept? And does the new Score keep its link to the source Staffs (so it can show where each Note came from and update when they change), or is it a fixed snapshot at creation? | Score = Sheet / Score is new. Live link / snapshot. | Updated 2026-10-10 after Composers/Arrangements: **Score** = the canonical composition (rules + Notes, written by Composers); **Arrangement** = a version of it for an audience; **Journey Sheet** = the set of Staffs (parts, Players, Instruments) as laid out by one Arrangement. Keep a live link with provenance. | Phase 5b |
| **DEC-SLT-16** | Are Arrangers the same as Composers? | — | **Answered 2026-10-10 (Betsy):** a Composer can do everything an Arranger does and more; an Arranger can only create *certain* Arrangements. Composer ⊇ Arranger. | Phase 4 |
| **DEC-SLT-19** | What limits which Arrangements an Arranger may create? Proposed: the Composer sets an **arranging allowance** on each Score — which audiences, styles, Instruments and parts an Arranger may use (e.g. only their own organization's audience, only approved styles). Should an Arranger's new Arrangement go live immediately within that allowance, or wait for a Composer's approval? | Allowance set by Composer: yes / other rule. Live within allowance / always approved. | Composer-set allowance per Score; live immediately inside the allowance, Composer approval for anything outside it. | Phase 4 |
| **DEC-SLT-17** | How is an "audience or viewer" defined for choosing an Arrangement? By platform role (admin / member / viewer), by organization, by product, by named personas you define (e.g. PE buyer, operator, end customer), or a mix? And does the viewer pick an Arrangement, or is it assigned with a default? | Role / org / product / personas / mix. Pick / assigned. | Named audiences you define, each mapped to roles or orgs; assigned with a default, and the viewer may switch among Arrangements they're entitled to. | Phase 5b |
| DEC-SLT-18 | Does "style" mean the existing 3D World Variants (Crystal Basin, Orbital Intelligence, …) and site themes, plus document layouts — or something else (e.g. tone of voice, level of detail)? | Visual only / visual + tone + detail. | Visual (world variant + theme + layout) plus detail level; tone of voice only if you want written Notes reworded per audience (that needs its own approval rule, since rewording must not change meaning). | Phase 5b (non-blocking) |
| DEC-SLT-10 | Should today's "Channel Rod" labels across the platform UI be renamed "Journey Staff" now, or only inside the theory screens until the engine ships? | Platform-wide now / theory screens first. | Theory screens first — members already see "Channel Rod" labels, and a platform-wide rename is its own change. | Phase 4 (non-blocking) |
| **DEC-SLT-05** | Which products appear in the Product selector, and what are their canonical keys? (Found in code: `handoveros`, `finbridgeco`; in your docs: HOS, SaltTide, SaltLedger, Salt Covenant Solutions, HERQ.) | List them. | — | Phase 3 |
| DEC-SLT-06 | Bar for "published baseline": only universal math / music / science definitions with a cited reference (e.g. graph theory, Allen's interval algebra, standard music theory texts) get that status; everything else is `proposed`. | Confirm / tighten. | Confirm. | Phase 3 seeds (non-blocking) |
| DEC-SLT-07 | Who may edit product-specific definitions — platform admin only, or can an org override them (existing `org_id` NULL = default / set = override pattern)? | Admin only / org-overridable. | Admin only for v1. | Phase 4 (non-blocking) |
| DEC-SLT-08 | The repo is public. Product-specific definitions are your IP — keep them in the database only, never in git seeds? | Yes / no. | Yes. | Phase 3 (non-blocking) |

---

## Changelog

- **2026-10-10 (Arrangers)** — DEC-SLT-16 answered: Composer ⊇ Arranger; an Arranger can create only certain Arrangements. Proposed a Composer-set arranging allowance on each Score (no new table); added DEC-SLT-19 for its limits and approval rule.

- **2026-10-10 (Composers & Arrangements)** — Betsy introduced Composers (admins, developers, configurators, builders or tools that define a Score's rules) and Arrangements (alternative arrangements and styles of a Score for different audiences). Composer = permission plus authorship on rule records, no table; AI composition is a proposal awaiting a person. Added `theory_arrangements` (seventh new table) reusing World Variants, themes and Instruments for style. Arrangements never change facts and are not a security boundary. Proposed answer to DEC-SLT-11 (Score / Arrangement / Sheet). Added DEC-SLT-16 – 18.

- **2026-10-10 (Instruments)** — Betsy introduced Instruments (the delivery of a Note) and Players (the end user who plays it), with several Staffs on one Sheet as simultaneous parts. Modeled as an `instrumentRegistry.js` code registry, a nullable `instrument_key` column on `journey_data_rods` (part default), and `instrument_key` / `measure_ref` / `beat_ref` on played-Note participants. Still six new tables. Added DEC-SLT-12 – 15.

- **2026-10-10 (later still)** — DEC-SLT-09 answered: a Rod is always on one Staff; combining Notes across Staffs creates a new Score with its own single Staff. Modeled as a `score_staff` rod_type plus a `score_source` Tributary — config only, still six new tables. Added DEC-SLT-11 (Score vs Journey Sheet; live link vs snapshot).

- **2026-10-10 (later)** — Betsy answered part of DEC-SLT-04: existing Channel Rods (`journey_data_rods`) are **Journey Staffs**; **Journey Data Rods** are new persistent chords (data combinations). Design updated: a Rod is a `theory_relations` row (`relation_kind='journey_data_rod'`) whose Notes are effective-dated `evidence` participants and which is placed on a Staff via a `staff` participant; Chord = membership at time *t*, derived. Still six new tables. Added DEC-SLT-09 (cross-Staff Rods) and DEC-SLT-10 (UI renaming scope). Phase 2 remains `awaiting review`.

- **2026-10-10** — Command `/seven-layer-theory` and skill `salt-basin-seven-layer-theory` created; spec stored verbatim. Phase 1 discovery run against `main` @ `bd6a576`: compatibility assessment filled. Key findings: no diagram/process-flow builder exists; no RLS exists; canonical entities and versioned-definition, calculation-lineage and approval-path precedents all exist and are reused; layer numbering collides. Phase 2 architecture drafted (6 new tables, 4 code registries, 11 reused surfaces) and set to `awaiting review`. No schema, route, or UI code changed.
