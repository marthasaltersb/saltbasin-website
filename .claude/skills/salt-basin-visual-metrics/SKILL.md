---
name: salt-basin-visual-metrics
description: Repeatable multi-session driver for the "Master Redesign Prompt — Salt Basin Visual Metrics, Query Convergence, Data Rods, and Maturity Mathematics" — gives every displayed score, percentage, decimal, and convergence behavior in the 3D data environment a defined, user-explainable semantic meaning, separated from pure rendering math. Use when Betsy invokes /visual-metrics, references "the metrics redesign prompt," "query convergence math," "what does 0.87 mean," "the Orbit click experience," "rod maturity mathematics," or asks why a displayed number in the 3D world doesn't have a clear business meaning.
---

# Salt Basin Visual Metrics, Query Convergence, and Rod Mathematics

This skill drives Betsy's "Master Redesign Prompt — Salt Basin Visual Metrics, Query Convergence, Data
Rods, and Maturity Mathematics" — a 20-section (I–XX) brief that redesigns every mathematical value the 3D
spatial environment currently renders so it answers a defined business or semantic question, or gets
removed from the user-facing experience.

This is a **sibling** to `salt-basin-master-build`, `salt-basin-pre-build`, and
`salt-basin-contribution-intelligence`, not a replacement. It doesn't build new spatial features — it
audits and redesigns the *mathematical meaning* of features that already exist (or are being built) inside
`salt-basin-master-build`'s Loop 9 (Visual Language) and Loop 11 (Query Convergence). Those two loops are
not `done` until their displayed values pass this skill's semantic-meaning bar — see
`salt-basin-master-build/SKILL.md`'s cross-reference to this skill.

## Non-negotiables (apply on every invocation, no exceptions)

- **Never preserve a displayed number merely because it already exists in code.** Inspect first, then
  decide KEEP / REMOVE / REPLACE per value — a list of findings alone is not sufficient, the structural
  correction has to land (mirrors master-build §96's closing instruction).
- **Rendering mathematics is never business intelligence.** x/y/z coordinates, camera distance,
  interpolation value, animation progress, particle velocity, and rendering radius must never be the
  primary label a user sees. Keep Rendering / Semantic / Business Mathematics strictly separated in every
  phase's output.
- **Convergence ≠ maturity ≠ completion ≠ confidence.** Four distinct metrics, four distinct meanings,
  never collapsed into each other. The live `{pctLabel(r.maturity)} converged` label in
  `SpatialJourneyWorld.jsx`'s `HashResultPanel` is exactly this conflation — it's the concrete bug this
  skill exists to fix, not a hypothetical example.
- **Never hardcode a calculation weight inline in a component.** Relevance component weights, coverage
  dimension weights, rod maturity dimension weights — all route through a methodology config. Run
  `salt-basin-config-audit` against any phase that adds a new weighted formula.
- **Never display a raw unrounded float with no label in the primary UI.** Full-precision debug values are
  fine behind an explicit debug mode; the primary UI always pairs a number with a semantic label and an
  on-demand plain-language explanation.
- **Build against real `journey_data_rods` / `journeyEngine` data.** Synthetic values are allowed only in
  clearly labeled dev fixtures, never the production view.
- **"Orbit" is canonical — resolved 2026-07-12.** The spec text originally read "Orbin"; Betsy confirmed
  this was shorthand/typo for "Orbit," matching the already-shipped term in `SpatialJourneyWorld.jsx`. No
  further naming decision needed for Phase 7; use "Orbit" throughout.

## Files

- `reference/master-build-prompt.md` — the full verbatim 20-section brief (I–XX plus framing preamble).
  Read only the section(s) relevant to the current phase rather than the whole document.
- `reference/phases.md` — static definition of the 7 build phases, which spec sections each covers, their
  dependencies, and the cross-cutting rules that apply to all of them.
- `docs/salt-basin-visual-metrics-progress.md` (repo root, not under this skill directory) — the
  **mutable** state: phase statuses, the running Current Metric Audit table, and a changelog. Read first,
  update last, on every invocation.

## Workflow for every invocation

1. Read `docs/salt-basin-visual-metrics-progress.md` first, including the audit table — later phases
   build on Phase 1's findings, don't re-derive them.
2. Determine which phase to run:
   - If the user named one (`/visual-metrics phase 3`, `/visual-metrics relevance`, `/visual-metrics
     orbin`), run that phase.
   - Otherwise, pick the first phase in `reference/phases.md` whose status is `not started` or `blocked`
     (with its blocker now resolved) and whose dependencies are satisfied.
3. Read only the master-prompt sections that phase's row in `reference/phases.md` cites — via Grep/Read,
   not the whole document.
4. Do the actual work:
   a. For Phase 1 specifically, inspect the real implementation before writing anything —
      `src/lib/journeyEngine/rodHash.js`, `maturity.js`, `basin.js`, `divergence.js`, `bonding.js`,
      `layout.js`, `src/lib/maturityScoring.js`, `src/data/crystalExperienceConfig.js`,
      `src/components/SpatialJourneyWorld.jsx`, `src/components/CrystalMarkField.jsx` — and produce the
      real audit table (CURRENT DISPLAY / CURRENT FORMULA / CURRENT PURPOSE / BUSINESS MEANING /
      KEEP-REMOVE-REPLACE / NEW METRIC / NEW LABEL) against what's actually there, not a hypothetical.
   b. For every phase, build the actual structural artifact (registry, calculation engine, UI redesign) —
      not just a findings list. Register every new metric in the Phase 2 Metric Definition Registry as it
      lands, even in later phases.
   c. Run `salt-basin-config-audit` against any new weighted formula or config surface this phase adds.
5. Update `docs/salt-basin-visual-metrics-progress.md`: set the phase's status, update the audit table if
   this phase changed it, add a changelog entry (date, what changed structurally, what's still open).
6. Report back concisely: which phase ran, what structurally changed, what's still open or blocked, and
   what phase is next.

## Cross-references into the existing codebase

| Metric bucket | Where it lives today | What's real vs. what's missing |
|---|---|---|
| Rod/atom/molecule/stage maturity (flat average) | `src/lib/journeyEngine/maturity.js` (`rollupStageMaturity`, `rollupMoleculeMaturity`), `src/lib/maturityScoring.js` (`scoreFieldDensity`, `scoreDestinationMaturity`) | Real, weighted, field-density-based — good existing separation between semantic score and rendering (`computeAtomVisual` maps maturity → scaleY/facet/opacity, never the reverse). No Rod Maturity 6-dimension composite (Definition/Evidence/Lineage/Validation/Temporal/Relationship) yet — this is a flat single-dimension average. |
| "Convergence" (`computeRodHash`, `triangulateEntity`) | `src/lib/journeyEngine/rodHash.js` | Computes a rod-hash and averages atom maturity — this average is what `SpatialJourneyWorld.jsx` currently displays as `"{pctLabel} converged"`. No Query Relevance Score, no per-element component breakdown, no Query Coverage, no Query Confidence exists. This is the core Phase 3 gap. |
| Bond/molecule formation | `src/lib/journeyEngine/bonding.js` (`computeContributionAffinity`, `assembleMolecules`) | Real tag-overlap + conflict-penalty affinity calculation — a plausible input component for the future Query Relevance Score's "Rod Relationship"/"Semantic Similarity" terms, not itself a relevance score. |
| Cross-rod divergence | `src/lib/journeyEngine/divergence.js` (`computeStateVector`, `computeHeterosemanticDivergence`, `classifyDivergence`) | Real Axial Divergence / Density Divergence / velocity / acceleration / Correlated State Envelope math, displayed today as raw `.toFixed(2)`/`.toFixed(3)` numbers with a classification string but no plain-language explanation or registry entry. Closest existing analog to Rod Coherence (§XII) — extend, don't replace. |
| Stage gates | `src/lib/journeyEngine/maturity.js` (`evaluateGate`) | Already soft-guidance, never a hard stop — the right shape for Stage Readiness (§IX), just not yet exposing a 0.00–1.00 readiness score or the "what's blocking this" narrative in the UI. |
| Rod stage position | `src/lib/journeyEngine/layout.js`, `genesis.js` (not audited in depth yet) | Spatial layout only (3D positions along a rod) — no `stage_index + intra_stage_position` decimal model surfaced to the user yet. |
| Orbit/Orbit click experience | `src/components/SpatialJourneyWorld.jsx` (`HashResultPanel`, convergence animation state machine ~line 640–900) | The literal UI this skill's Phase 6 redesigns. Current copy already uses "Orbit" ("Customer Orbit — {entityLabel}"), not "Orbit" — see the Phase 7 terminology flag. |
| Visual channel mapping | `src/lib/journeyEngine/maturity.js` (`computeAtomVisual`, `VISUAL_CHANNELS`) | A real, single-metric (maturity → visual channel) encoding already exists and is a good model to extend for Phase 5's broader registry — but it only covers one metric today, not the full XVII visual grammar (distance/cluster/pulse/path style/etc.). |
| Config/registry conventions | `src/config/visual/visualSemanticRegistry.js`, `src/config/visual/worldRegistry.js`, `src/config/architecture/objectTypeRegistry.js` | Existing registry patterns in this repo — Phase 2's Metric Definition Registry and Phase 5's Visual Encoding Registry should follow the same `src/config/*` conventions rather than inventing a new one. |

## Scope discipline

Seven phases. Phases 3 (Query Convergence Model) and 4 (Data Rod Mathematics) are each too large for one
turn if taken whole — `reference/phases.md` already suggests natural splits (Relevance+Coverage vs.
Confidence+Stability for Phase 3; Position+Completeness+Readiness vs.
Maturity+Density+Coherence+Alignment for Phase 4). Say so and split rather than doing a shallow pass across
all sub-models at once.
