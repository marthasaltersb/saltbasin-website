---
name: salt-basin-seven-layer-theory
description: Repeatable multi-session driver for the "Seven-Layer Theory, Matrix & Journey Engine — Claude Code Implementation Specification v0.1" — seven theory layers (Identity, Relationships, Composition, Time, Business Logic, Measurement, Visual Representation & UX), seven definitions per concept (Mathematical, Musical, Scientific, Business, Computational, Visual, Rest), a 49-family matrix registry with 3D projections, a hypergraph relationship engine, the musical composition model (Note, Chord, Journey Data Rod, Clef, Universal C, Staff, Journey Sheet, Measure, Beat, Rest), a 1–12 interval temporal engine, and integration with the platform's builder. Use when Betsy invokes /seven-layer-theory, references "the seven-layer spec," "the seven definitions," "the matrix registry," "the 49 matrices," "the Rest engine," "Journey Sheet / Staff / Clef / Universal C," "instruments / players / parts," or "the twelve-interval engine."
---

# Salt Basin Seven-Layer Theory, Matrix & Journey Engine

This skill drives Betsy's "Seven-Layer Theory, Matrix & Journey Engine" implementation specification
(v0.1, supplied 2026-10-10) — a 17-section brief that extends the existing Salt Basin platform with a
unified mathematical / musical / scientific / business / computational / visual / Rest modeling framework.

It is a **sibling** to `salt-basin-master-build`, `salt-basin-visual-metrics`, and
`salt-basin-channel-journey-architecture`, not a replacement. The spec's primary engineering principle is
**extend the existing platform and preserve its source of truth** — so most of this skill's work is
mapping each spec concept onto substrate that already exists (Channel Rods, evidence, bonding, metric
definitions, render bindings, versioned definitions) before anything new is created.

## Non-negotiables (apply on every invocation, no exceptions)

- **Discovery and architecture before migrations.** Phases 1–2 produce documents, not schema. Phase 3+
  never starts while Phase 2 is `awaiting review` in the progress tracker, and never starts while any
  decision marked **blocking** in the tracker's decision log is unanswered. Spec §2, §16.
- **Never fork the platform.** No separate app, modeling environment, or database (spec §1). Every new
  concept passes the `/channel-journey-architecture` six-item reuse-first checklist before a table is
  proposed. 49 matrix families are 49 *registry rows*, never 49 tables (spec §5, §17).
- **Universal theory and Salt Basin product definitions are separate records.** Editing a product-specific
  definition never overwrites the universal theoretical one (spec §14).
- **Never invent a Salt Basin product definition.** Unconfirmed mappings are stored with status
  `proposed` or `inferred — needs confirmation`; incomplete definitions are stored as explicitly
  incomplete, never filled with plausible text (spec §4, §13). Business, Computational, Visual and Rest
  definitions for a product come from Betsy, not from Claude.
- **Equivalence class is mandatory and honest.** Every cross-domain definition is labeled `literal
  equivalence`, `structural correspondence`, or `design analogy`. A business analogy is never described
  as a scientifically proven equivalence (spec §4). Music → business mappings default to `design analogy`
  unless Betsy confirms otherwise.
- **The seventh definition is always Rest, and Rest is never missing data.** Authorized Rest requires a
  governing rule, context, effective interval, reason, and authorization reference where required.
  `unknown` and `pending` are distinct participation states (spec §9, §10).
- **Identity is canonical.** An entity keeps one identity regardless of diagram position, relationship
  participation, clef, fund/portfolio membership, or journey. A change in chord membership never creates a
  new Journey Data Rod (spec §6, §7). Never infer a master contract from bilateral contracts; never equate
  a reporting composition with an executed agreement.
- **`journey_data_rods` holds Journey Staffs, not Journey Data Rods.** Decided by Betsy 2026-10-10: the
  existing table's rows are sequential processes (Staffs). The spec's Journey Data Rod is a separate,
  persistent chord identity. The table name is a legacy name and is never renamed; say "Staff" in theory
  screens, docs and code comments, and never write theory logic that treats a `journey_data_rods` row as a
  chord.
- **A Rod lives on exactly one Staff.** Decided by Betsy 2026-10-10: combining Notes from several Staffs
  creates a new Score whose chords sit on one new Staff; source Staffs are untouched and Notes are
  referenced, never copied.
- **Instruments deliver, Players play, Notes stay canonical.** Introduced by Betsy 2026-10-10: an
  Instrument is the delivery of a Note; a Player is the end user who plays it; several Staffs on one Sheet
  are simultaneous parts. The same Note played by three Players is three participations of one Note,
  never three copies, and Rest is tracked per part.
- **Calculations are reproducible.** Every result records inputs, rule versions, method, temporal context,
  output, validation status and timestamp — reuse `metric_definitions` / `metric_calculations` rather than a
  parallel result store. Weights normalize only across eligible requirements; removing requirements never
  counts as improvement; incompatible financial measures are never aggregated (spec §9). Run
  `salt-basin-config-audit` on any new weighted formula.
- **Visual edits propose; they never silently mutate.** Builder edits flow through validation → rule
  evaluation → dependency analysis → impact preview → authorization → persistence → audit (spec §11). The
  render-bindings approval path already implements this shape — reuse it.
- **Platform rules still apply.** Additive-only DDL in `db.js bootstrap()` or a lazily-created schema
  module (never destructive migrations, never touching member rows); append-only registries; the release
  loop for every code change; interface parity (UI desktop + 390px, API, MCP tool in
  `mcpToolRegistry.js`); fictional data only in specs and logs (public repo).

## Files

- `reference/master-build-prompt.md` — the full verbatim specification (§1–§17). Read only the sections the
  current phase's row cites in `phases.md`.
- `reference/phases.md` — static definition of the 8 phases, which spec sections each covers, and their
  gates. Do not record progress there.
- `docs/salt-basin-seven-layer-theory-progress.md` (repo root, not under this skill) — the **mutable**
  state: phase statuses, the compatibility assessment, the proposed architecture, the decision log, and a
  changelog. Read first, update last, on every invocation.

## Workflow for every invocation

1. Read `docs/salt-basin-seven-layer-theory-progress.md` first — status table, decision log, and the
   compatibility assessment. Later phases build on Phase 1's findings; don't re-derive them.
2. Determine which phase to run (named by the user, or the first `not started` / newly-unblocked phase
   whose dependencies are satisfied). If the next phase is gated by an unanswered blocking decision, do not
   run it — list the exact open questions for Betsy instead.
3. Read only the spec sections that phase cites (Grep/Read, not the whole document).
4. Inspect the real implementation the phase touches before designing anything. Re-verify any
   compatibility-assessment row older than the repo's latest relevant commit — the codebase moves fast.
5. Do the actual work for the phase (assessment, architecture, schema, registry, engine, UI) — not just a
   findings list. For any proposed new table, run the `/channel-journey-architecture` pre-implementation
   pass and record its classification in the tracker.
6. For code phases (3–8): follow `salt-basin-release-loop` — `docs/changes/seven-layer-theory-<phase>.md`,
   `docs/training/seven-layer-theory-<phase>.md`, tests under `tests/` using `node:test` (pure functions
   must run without `DATABASE_URL`), MCP tool + `capabilityParity.js` row for every new capability.
7. Update the progress tracker: phase status, assessment changes, decisions, changelog entry (date, what
   changed structurally, what's still open).
8. Report back concisely: phase run, what structurally changed, open/blocked items, next phase.

## Cross-references into the existing codebase (from Phase 1, 2026-10-10 — re-verify before relying on)

| Spec concept | Existing surface | Fit |
|---|---|---|
| Database | Supabase Postgres via `postgres` driver, `server/db.js`; schema via idempotent `bootstrap()` DDL; `migrations/*.sql` is never applied by code | Reuse. No migration runner exists. |
| RLS / tenant isolation | **No RLS anywhere.** App-level: `requireAdmin`/`requireUser` (`server/auth.js`), `org_memberships` lookups, `req.user.id` scoping | Spec assumes RLS — see decision DEC-SLT-02. |
| Diagram / process-flow builder | **None exists.** Closest: `MetadataModelDiagramBlock` (static CMS block), `DecisionTreeBlock`, `DefinitionStudioJourney.jsx` (localStorage only), `worldEngine/graphWorld.js` (3D graph renderer, no edges/editing) | Spec's central assumption fails — see DEC-SLT-01. |
| Canonical entities (V) | `entities`, `persons` (with `merged_into_id` dedup), `journey_rod_entity_links` | Reuse for legal entities / parties. |
| Relationships (𝓔) | `relationships` (owner→person/entity), `journey_rod_tributary_links` (rod↔rod, bilateral), Tributary kinds hierarchical/peer/reference | Bilateral only — no n-ary, no relationship-of-relationship. Hypergraph is a genuine gap. |
| Journey Staff | `journey_data_rods` (today's Channel Rods — sequential processes) + `journey_rod_types` | **Decided by Betsy 2026-10-10.** Never rename the table. |
| Note | Evidence atoms `journey_rod_evidence` + definitions `journey_metadata_molecules` | Strong fit; recorded on a Staff. |
| Journey Data Rod / Chord | **New** — persistent chord identity (proposed `theory_relations` row, `relation_kind='journey_data_rod'`, effective-dated Note participants); Chord = members effective at time *t* | **Decided by Betsy 2026-10-10.** Bonding (`eidosBonding.js`) may propose members; membership changes are governed and provenance-carrying, never a static list. |
| Staff / Measure / Beat / Clef / Universal C / Journey Sheet / Rest | No existing concepts (verified by grep) | New vocabulary — definitions must come from Betsy (DEC-SLT-04). |
| Time | `effective_from/to` on evidence, metric definitions, scenario versions; `journey_rod_events.created_at` = recorded time; stages in `journeyDefinitions.js`, `journey_current_definitions.port_stages` | Partial. No 1–12 interval cycle model. |
| Business logic / gates | `journey_stage_gates`, `journey_gate_definitions` (required clusters/molecules, dependency_rules), `maturity.js evaluateGate` (soft), `qualificationGateCheckers.js` | Reuse; extend for eligibility/authorized Rest. |
| Calculation engine | `rodMathematics.js`, `maturityEngine.js`, `queryConvergence.js` (tested, pure); `methodologyEnvelopes.js` (runtime-overridable weights); `metric_definitions` + `metric_calculations` (inputs, formula, version, as_of) | Strong fit for spec §9 lineage requirements. |
| Definition versioning | `scenario_definition_versions` pattern (immutable by version+hash, review_status, one-active partial index, effective_from/to) | Model for concept-definition versions. |
| Audit | `audit_log` (`server/lib/audit.js`, best-effort), `audit_events` (`server/audit.js`, fail-closed, backlog-scoped) | Reuse `audit_log`, or extend `audit_events` entity types. |
| Visual edit → proposed change → approval | Render bindings (`renderBindings.js`: proposed evidence + `change_proposed` event with impact snapshot + `agent_approval_workflows`) | Direct reuse for spec §11's 7-step pipeline. |
| Layer numbering | `src/config/architecture/layerRegistry.js` (0–10) and Business Definition Tool L0–L7 | Spec's L1–L7 collides — see DEC-SLT-03. |
| 3D projection | Three.js 0.185, `crystalGeometry.js`, `graphWorld.js`, `SpatialJourneyWorld.jsx` | Reuse crystal design system; no matrix/grid viz exists. |

## Scope discipline

Eight phases mirror the spec's §16 sequence. Phases 5 (Matrix + Hypergraph) and 6 (Temporal + Calculation
+ Rest) are each too large for one turn — `phases.md` lists natural splits. Say so and split rather than
doing a shallow pass. Phase 7 (builder integration) cannot be scoped until DEC-SLT-01 is answered.
