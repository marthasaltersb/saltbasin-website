# Salt Basin Visual Metrics — Progress Tracker

Mutable state for the `salt-basin-visual-metrics` skill. Read first, update last, on every invocation.
Static phase definitions live in `.claude/skills/salt-basin-visual-metrics/reference/phases.md` — don't
duplicate that content here, just track status and findings.

## Phase status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Current Metric Audit & Rendering/Semantic/Business Separation | done | See audit table below. |
| 2 | Canonical Metric Taxonomy & Metric Definition Registry | done | `src/config/metrics/metricCategoryRegistry.js` (10 fixed categories) + `src/config/metrics/metricDefinitionRegistry.js` (11 metric entries, seeded from the Phase 1 audit's KEEP/REPLACE rows). See below. |
| 3 | Query Convergence Model (Relevance, Coverage, Confidence, Stability) | done (engine; UI waits for Phase 6) | All four configured engines are real. `rodHash.js` wires Relevance/Coverage plus evidence-derived Confidence/Stability for active query contexts; absent evidence returns null rather than an invented score. |
| 4 | Data Rod Mathematics (Position, Completeness, Readiness, Maturity, Density, Coherence, Alignment) | done (engine; UI waits for Phase 6) | Seven separate configured models are real in `rodMathematics.js`; legacy atom-density weights and correlated-envelope tolerance now resolve through the same methodology registry. |
| 5 | Visual Encoding Registry | done | `metricVisualEncodingRegistry.js` maps every Phase XVII visual channel to exactly one metric or semantic source; validation rejects channel collisions. Legacy atom maturity multi-encoding was removed. |
| 6 | Customer Orbit Interaction Redesign | done | Registry-driven Customer context summary is live; maturity-as-convergence and raw divergence telemetry are removed; final projection radius is driven by Query Relevance. Element-level component drill-through (§XVI Step 4) and generated business-meaning sentences (§XVI Step 5) now live and browser-verified — see below. Regression-gated in Phase 7. |
| 7 | Regression, Foundation Reconciliation & Terminology Decision | done | Architecture-regression checklist run against the full metrics/convergence diff — clean, no violations. Foundation Source of Truth §11 updated with a new "Query convergence metric vocabulary" subsection reconciling the 11 canonical metric keys against the pre-existing Gravitational Field / Depth-Settlement-Density law, plus the "Customer Orbit" terminology confirmation. See below. |

## Open decisions requiring a Betsy answer (do not default)

None open currently — see Resolved decisions below.

## Resolved decisions

1. **"Orbin" vs. "Orbit" — RESOLVED 2026-07-12.** Betsy confirmed "Orbin" (as it appeared in the master
   prompt text) was shorthand/typo for "Orbit," not a new, intentional, distinct term. "Orbit" is canonical
   — matches the already-shipped code (`SpatialJourneyWorld.jsx`'s "Customer Orbit — {entityLabel}"). All
   skill/reference/progress files updated to use "Orbit" throughout. No further action needed in Phase 7's
   Foundation reconciliation beyond confirming this is already consistent.

## Canonical Metric Taxonomy & Metric Definition Registry (Phase 2 — done 2026-07-12)

Built `src/config/metrics/metricCategoryRegistry.js` (the 10 fixed §XIV categories — Position,
Completeness, Confidence, Maturity, Readiness, Alignment, Coherence, Density, Relevance, Stability — each
with its archetype business question) and `src/config/metrics/metricDefinitionRegistry.js` (the §XV
registry: `metricId`/`metricKey`/`displayName`/`metricCategory`/`definition`/
`businessQuestionAnswered`/`calculationMethod`/`formulaDescription`/`inputDimensions`/`rangeMin`/
`rangeMax`/`unit`/`higherIsBetter`/`directionalityDescription`/`confidenceSupported`/
`calculationVersion`/`visualEncoding`/`allowedScopeTypes`/`drilldownType`/`effectiveFrom`/`effectiveTo`,
plus a repo-specific `implementationStatus` field explained in that file's header comment).

Seeded with all 11 metrics named in §II–§XIII, each traced directly to a Phase 1 audit row rather than
invented ahead of it:

| Metric key | implementationStatus | Backing legacy code (if any) |
|---|---|---|
| QUERY_RELEVANCE | `defined_not_calculated` | none — net-new, Phase 3 |
| QUERY_COVERAGE | `defined_not_calculated` | none — net-new, Phase 3 |
| QUERY_CONFIDENCE | `defined_not_calculated` | none — net-new, Phase 3 |
| CONVERGENCE_STABILITY | `defined_not_calculated` | `divergence.js`'s velocity/acceleration are candidate inputs, not a calculation of this metric itself |
| ROD_POSITION | `defined_not_calculated` | none — net-new, Phase 4 |
| STAGE_COMPLETENESS | `defined_not_calculated` | none — net-new, Phase 4 |
| STAGE_READINESS | `partial_legacy_calculation` (`legacy-gate-boolean-v1`) | `maturity.js`'s `evaluateGate()` — boolean met/missing only, no 0–1 score yet |
| ROD_MATURITY | `partial_legacy_calculation` (`legacy-flat-average-v1`) | `maturity.js`'s `rollupStageMaturity`/`rollupMoleculeMaturity`, `maturityScoring.js`'s `scoreFieldDensity` — single-dimension flat average, not the 7-dimension composite (added Reconciliation Maturity 2026-07-12, see changelog) |
| JOURNEY_DENSITY | `defined_not_calculated` | none — raw `atoms.length` exists but is explicitly the wrong basis per §XI |
| ROD_COHERENCE | `partial_legacy_calculation` (`legacy-divergence-v1`) | `divergence.js`'s `computeHeterosemanticDivergence()` — real signal, not yet wrapped as a 0–1 coherence score with a narrative |
| CROSS_ROD_ALIGNMENT | `partial_legacy_calculation` (`legacy-envelope-v1`) | `divergence.js`'s `computeCorrelatedStateEnvelope()`/`boundaryExceeded` — real boundary check, not yet exposed as an ALIGNED/exception label |

**Config-audit pass (per this skill's step 4c):** this registry follows the same source-code-registry
idiom already established by `visualSemanticRegistry.js`, `objectTypeRegistry.js`, and `layerRegistry.js`
in this repo (a versioned `Object.freeze` config object, not a runtime admin-editable table) — consistent
with, not a deviation from, the existing configuration pattern. No hardcoded metric meaning was found
elsewhere to convert in this pass (nothing in `SpatialJourneyWorld.jsx` reads from this registry yet,
because Phase 6 — the UI redesign — hasn't run). Deliberately did **not** include the §II relevance
component weights (35/25/20/10/10 example) or any other calculation weight values in this registry — those
belong to Phase 3's methodology config, not Phase 2's definition registry; this is a planned sequencing
boundary from `reference/phases.md`, not shortcut-driven prototype debt.

**Concurrent-session note:** while this phase was running, a separate `salt-basin-world-variants` skill
appeared (its description already references "Query Relevance/Coverage/Confidence, Rod Maturity,
Cross-Rod Alignment" by name) — another session is building a 3D-world-metaphor-switcher on top of the
same master-prompt vocabulary. Not reconciled here; flagging so a future `/visual-metrics` invocation
checks `.claude/skills/salt-basin-world-variants/` before Phase 5 (Visual Encoding Registry) to avoid two
divergent visual-encoding registries.

## Current Metric Audit (Phase 1 — done 2026-07-12)

Every currently-calculated and currently-displayed score/percentage/decimal/coordinate in the 3D
environment, inspected directly in `src/lib/journeyEngine/*`, `src/lib/maturityScoring.js`, and
`src/components/SpatialJourneyWorld.jsx`.

| # | Current display | Current formula | Current purpose | Business meaning today | Decision | New metric | New label |
|---|---|---|---|---|---|---|---|
| 1 | `"{pctLabel(r.maturity)} converged"` per rod card in `HashResultPanel` (`SpatialJourneyWorld.jsx:1408`) | `computeRodHash()` → flat average of that rod's atom `.maturity` values (`rodHash.js:27`) | Was written as a convergence indicator; is actually a maturity rollup | **None as displayed** — this conflates "how relevant is this rod to the query" (never calculated) with "how mature/well-defined is this rod's data" (the actual formula). Exactly the §I anti-pattern the master prompt names. | REPLACE | Two separate values: **Query Relevance** (§II, per-rod component breakdown) for "converged," and **Rod Maturity** (§X, 6-dimension composite) for the existing average, kept but relabeled and no longer conflated with convergence | `Query Relevance 0.XX · STRONGLY RELATED` (rod card) + `Rod Maturity 0.XX` (separate, on drill-in) |
| 2 | `d.axialDivergence.toFixed(2)` (`SpatialJourneyWorld.jsx:1424`) | `Math.abs(vectorA.coordinate - vectorB.coordinate)` (`divergence.js:81`), where `coordinate` is itself a stage-maturity average (`divergence.js:35`) | Rendering-adjacent debug number surfaced directly to the user with no label beyond "Axial divergence" | Partial — the *concept* (two rods sitting at different lifecycle positions) is real and matches §XII Rod Coherence's example almost exactly, but the raw unlabeled float fails §XIX's "no unexplained floating-point numbers in primary UI" rule | REPLACE | **Rod Coherence** (§XII) — same underlying signal, wrapped in a 0.00–1.00 coherence score with a plain-language mismatch narrative (matches the divergence classification already computed) | `Rod Coherence 0.XX` + narrative: `"Revenue Lifecycle: Active Subscription · Customer Journey: Onboarding — timing mismatch, not necessarily an error"` |
| 3 | `d.densityDivergence.toFixed(2)` (`SpatialJourneyWorld.jsx:1424`) | `Math.abs(vectorA.density - vectorB.density)`, `density` from `computeRodDensity()` in `basin.js` | Same debug-number pattern as #2 | Partial — same issue as #2 | REPLACE | Folded into the same **Rod Coherence** breakdown as a named component ("Density Divergence" line item), not a separate top-level number | Component line under Rod Coherence drill-in, not its own headline metric |
| 4 | `d.velocity.toFixed(3)}/s` and `d.acceleration.toFixed(3)` (`SpatialJourneyWorld.jsx:1425`) | Rate of change of `vectorDistance()` between two consecutive in-memory snapshots (`divergence.js:87-97`) | Debug telemetry for the divergence rate-of-change mechanism | **None as displayed to a non-technical user** — "0.012/s" answers no business question on its own | REMOVE from primary UI (or: fold into **Convergence Stability**, §VI, as an input signal — rapidly changing source data is one of Stability's named inputs) | Convergence Stability (§VI), if kept at all | Not a standalone label; at most contributes to `Convergence Stability 0.XX · UNSTABLE` |
| 5 | `envelope.min.toFixed(2)`, `envelope.max.toFixed(2)` (`SpatialJourneyWorld.jsx:1425`) | `computeCorrelatedStateEnvelope()` — reference coordinate ± flat 0.18 tolerance (`divergence.js:71-75`) | Debug bounds for the boundary-exceedance check | Partial — the underlying concept (expected-state envelope, §XIII Cross-Rod Alignment) is real, but exposing raw envelope bounds as bracketed decimals fails the plain-language bar | REPLACE | Folded into **Cross-Rod Alignment** (§XIII) as "within/outside expected range," not raw bounds | `Cross-Rod Alignment: ALIGNED` or `... : exception — Customer state outside expected range for current Revenue state` |
| 6 | Rod-card `atomCount` (`"{r.atoms.length} data elements"`, `SpatialJourneyWorld.jsx:1409`) | Raw array length of atoms in that rod | Informational count | Weak — raw atom count is explicitly the wrong basis for coverage per §IV ("ten duplicate data points should not produce greater coverage than one governed authoritative definition") | KEEP as a rendering/informational count, but never let it substitute for **Query Coverage** (§IV) once that's built | Query Coverage (separate, dimension-weighted) | Keep `"N data elements"` as-is; add `Query Coverage XX%` as a distinct, separately-computed line once Phase 3 lands |
| 7 | Atom `maturity` value feeding `computeAtomVisual()` (`maturity.js:54-76`) — scaleY, facet count, opacity, metalness, roughness, emissiveIntensity, haloIntensity | Direct `clamp01(atomInstance.maturity)` lerped across `VISUAL_CHANNELS` min/max ranges | **Pure rendering mathematics** — this is the one part of the current implementation that already does the RENDERING vs. SEMANTIC separation correctly: `maturity` (semantic) drives visual channels (rendering), never the reverse, and none of scaleY/facet/opacity/metalness/roughness are themselves displayed as numbers to the user | Correctly separated already — flagged here as the **positive existing pattern** to extend in Phase 5, not a violation | KEEP as-is; use as the template for Phase 5's broader Visual Encoding Registry | Query Relevance / Rod Maturity (whichever metric is selected as the drives-encoding value in a given view) | No change — already correct |
| 8 | `evaluateGate()` threshold check, `gate.atomThreshold ?? 0.75` (`maturity.js:83`) | Boolean met/missing per required atom vs. a flat 0.75 maturity threshold, with named missing-atom guidance | Soft-guidance gate, not exposed as a number at all today — surfaces as qualitative missing-item text | Real and mostly correct already — matches §IX Stage Readiness's "explain what's blocking, don't just show a red score" instruction | KEEP the soft-guidance behavior; ADD the missing 0.00–1.00 Stage Readiness *score* alongside the existing qualitative guidance, since none exists yet | Stage Readiness (§IX), net-new score wrapping the existing gate logic | `Next Stage Readiness 0.XX` + existing missing-item guidance text (unchanged) |
| 9 | `computeContributionAffinity()` per bond (`bonding.js:35-41`) — not currently rendered as a user-facing number, used only to decide which atoms bond into a molecule | Tag-overlap ratio minus a conflict penalty | Internal formation logic, not user-facing | N/A — not currently displayed, so not an audit violation, but a strong candidate **input component** for the future Query Relevance Score's "Rod Relationship" / "Semantic Similarity" terms (§II) | KEEP as internal logic; REUSE as a Phase 3 input, do not duplicate the calculation | Feeds Query Relevance Score's component breakdown | N/A (internal), surfaces indirectly via `"Direct Customer Relationship +0.31"`-style breakdown lines once Phase 3 lands |
| 10 | `triangulateEntity()`'s `maturity` (`rodHash.js:40`) — average of each rod's own `computeRodHash().maturity` | Average of averages (rod-level maturity averaged again across all rods sharing an `entityLabel`) | Displayed nowhere directly today by that exact name, but is the same value feeding item #1's rod cards when compound-queried across multiple rod types | Same conflation risk as #1, one level up | REPLACE (same disposition as #1, at the entity-triangulation level) | Query Relevance / Rod Maturity, computed and displayed per rod, with the entity-level rollup shown only as an explicit "average across N rods" if kept at all | N/A until Phase 3/6 design the entity-level summary view |

### Rendering / Semantic / Business classification summary

- **Rendering mathematics (correctly never shown to the user today):** `computeAtomVisual()`'s scaleY,
  facet, opacity, metalness, roughness, emissiveIntensity, haloIntensity; the convergence animation's
  `lerpVectors`/`smoothstep` position math (`SpatialJourneyWorld.jsx:886-889`); all Three.js world-space
  coordinates from `layout.js`. **No violations found here** — this is the one area already built the
  right way; preserve it as the template.
- **Semantic mathematics (exists, but mislabeled or under-specified):** rod/molecule/stage maturity
  (`maturity.js`, `maturityScoring.js`) — real and weighted, but single-dimension, not the 6-dimension Rod
  Maturity §X calls for; divergence/envelope math (`divergence.js`) — real signal, wrong presentation
  (raw floats, no plain-language layer); gate evaluation (`maturity.js:evaluateGate`) — real soft-guidance,
  missing a numeric Stage Readiness score.
- **Semantic mathematics that does not exist yet (the actual Phase 3/4 gap):** Query Relevance Score,
  Query Coverage, Query Confidence, Convergence Stability, Rod Position (`stage_index + intra_stage`),
  Stage Completeness, Journey Density, Cross-Rod Alignment (as a scored/labeled output, vs. the raw
  envelope-bounds check that already computes the same underlying comparison).
- **Business mathematics:** none found anywhere in the current 3D environment (no revenue-at-risk, cost
  impact, cycle time, or control-exposure values are rendered) — out of scope for this build's current
  phase, noted for completeness per the preamble's three-way split.

## Changelog

- **2026-07-12** — Betsy (via the `salt-basin-world-variants` session, while defining that skill's
  `MATURITY_LATTICE` variant) added a 7th Rod Maturity dimension: **Reconciliation Maturity** — "how well
  do the definitions, evidence and lineage reconcile across departments, systems, users, etc. to produce a
  confidence." Updated `metricDefinitionRegistry.js`'s `ROD_MATURITY` entry (`definition`,
  `formulaDescription`, `inputDimensions`, `directionalityDescription` — the latter now explicitly
  distinguishes Reconciliation Maturity from Rod Coherence: Reconciliation Maturity is cross-*source*
  agreement within one Rod/atom; Coherence is cross-*Rod* agreement between Revenue/Customer/Member).
  Rebalanced `rodMathematicsMethodology.js`'s `rodMaturity.weights` to 7 dimensions summing to exactly 1.0
  (0.18/0.18/0.13/0.13/0.13/0.13/0.12). `rodMathematics.js`'s `calculateRodMaturity()` needed **zero code
  changes** — it derives its dimension set entirely from the methodology config, confirmed live via a
  direct Node import test. This is a metric-definition change this skill owns; recorded here as the
  authoritative source even though the request arrived while working the sibling skill.

- **2026-07-12** — Completed Phase 7, closing out the visual-metrics redesign's 7-phase build. Ran the
  `salt-basin-regression-gate` skill's architecture-regression checklist scoped to the full metrics/
  convergence diff (`src/config/metrics/*`, `src/lib/journeyEngine/{queryConvergence,rodMathematics,
  bonding,divergence,maturity,rodHash}.js`, `SpatialJourneyWorld.jsx`): no reintroduced Journey/Channel
  terminology violation, no duplicate Member types, no hardcoded Organization Admin identity, no broken
  Member/Org scope, no flattened divergent source truth (Heterosemantic Divergence framing untouched), no
  lost effective dating or lineage, no Agent Boundary bypass, no configuration-to-hardcode reversion
  (grepped for hex colors and forbidden `authorityProfileIds`-style patterns across every new/changed file
  — zero hits), no decorative-renderer regression, no unapproved colors. Foundation reconciliation: added a
  new "Query convergence metric vocabulary" subsection to `docs/salt-basin-foundation-source-of-truth.md`
  §11, right after the existing Gravitational Field / Depth-Settlement-Density law — the eleven metric
  keys in `metricDefinitionRegistry.js` are the concrete, versioned registry that operationalizes that
  pre-existing narrative law (relevance/maturity/evidence-density/readiness), not a new competing
  vocabulary. Also recorded "Customer Orbit" as the Foundation-canonical interaction term there, closing
  the "Orbin" naming question at the Foundation level, not just this tracker's. All seven phases now
  `done`. This build is a repeatable skill (`/visual-metrics`) — re-run any phase if the codebase, the
  Foundation, or Betsy's direction moves enough to warrant it, per this skill's own "not done permanently"
  convention.

- **2026-07-12** — Completed Phase 6's two remaining items (§XVI Steps 4–5), closing Phase 6 out. Added
  `src/config/metrics/queryRelevanceNarrative.js`: `RELEVANCE_COMPONENT_LABELS` (friendly names for the
  five relevance component keys) plus `describeRelevanceComponents()` and
  `generateElementBusinessMeaning()`, both operating on the real `components` object
  `calculateQueryRelevance()` already returns per atom — no canned per-atom-name strings. Wired a new
  `ElementRelevanceBreakdown` sub-component into `HashResultPanel` in `SpatialJourneyWorld.jsx`: each rod
  card now lists its individual atoms with their own Query Relevance score (reusing the existing
  `sjw-map-row` style), clicking one shows "Why This Element Converged" — the relevance score/band, a
  ranked list of only the components that actually contributed (`+0.XX` each), and the generated
  plain-language sentence. Browser-verified live (not just syntax-checked): started a scratch client-only
  preview (port 5177, per this project's concurrent-session guidance — never `saltbasin-full`), drove
  `/output/business-definition-experience` as a real user, ran Customer Orbit against the seeded
  "Ridgeline Data — Buyout by Meridian Capital" entity, and clicked "Counterparty Identity" under the
  Customer rod: rendered `Query Relevance: 0.62 · Contextually Related` with real component contributions
  (`Direct Relationship +0.35`, `Rod Relationship +0.25`, `Semantic Relationship +0.02`) and the sentence
  "Counterparty Identity is classified Contextually Related to Customer context, driven mainly by direct
  relationship (+0.35) and rod relationship (+0.25)." Zero console errors. Phase 6 moves to `done (pending
  regression gate)` — Phase 7 is next and should run `/regression-gate` scoped to the full metrics/
  convergence diff before either phase is marked fully `done`.

- **2026-07-12** — Betsy resolved the open "Orbin" vs. "Orbit" naming question: "Orbin is supposed to be
  Orbit." Updated the Open decisions section (moved to Resolved decisions) and corrected every reference to
  "Orbin" in this tracker, `SKILL.md`, `reference/phases.md`, `.claude/commands/visual-metrics.md`, and the
  sibling `salt-basin-world-variants` skill's equivalent files (they shared this same open decision) to read
  "Orbit." No code change needed — shipped code (`SpatialJourneyWorld.jsx`) already said "Orbit."

- **2026-07-12** — Advanced Phase 6. `SpatialJourneyWorld` now activates the configured Customer query context, displays registry labels for Query Coverage/Confidence/Stability, shows actual per-Rod Query Relevance rather than maturity mislabeled as convergence, and replaces raw axial/density/velocity/acceleration telemetry with Rod Coherence. Missing evidence renders a configured unavailable state, never a fabricated score. Final query-projection radius now resolves through `resolveQueryDistance()` using the Visual Encoding Registry's nonlinear inverse transform; higher relevance is provably closer. New interaction labels/actions/divergence explanations resolve from `QUERY_INTERACTION_REGISTRY`. The shipped “Customer Orbit” term is preserved — the "Orbin" vs. "Orbit" naming question is now resolved in favor of "Orbit" (see Resolved decisions above). Remaining: element-level component drill-through, plain-language generated business meaning, and browser regression gate.

- **2026-07-12** — Completed Phase 5. Added `METRIC_VISUAL_ENCODING_REGISTRY` for distance/relevance, semantic grouping, metadata geometry, permanent path identity color, confidence opacity, unresolved-state pulse, stability motion/settlement, relationship path strength/style, Tributary/Confluence geometry, Rod Position segmentation, Stage Completeness fill, and Rod Maturity complexity. Added registry validation enforcing one source per channel. Post-audit caught and removed a legacy violation in `computeAtomVisual`: maturity previously changed scale, facets, opacity, material, halo, and even permanent path color. The v2 atom profile now keeps path color stable, uses confidence only for opacity, risk only for emissive/conflict treatment, and fixed metadata/material profile values until object-type geometry supplies them. Tests pass.

- **2026-07-12** — Completed Phase 4's calculation-engine scope. Added `rodMathematicsMethodology.js` and `rodMathematics.js`: Rod Position separates cycle/stage/intra-stage position; Stage Completeness uses weighted applicable requirements; Readiness is soft guidance with explicit blockers; Rod Maturity exposes six dimensions; Journey Density deduplicates material events; Coherence wraps divergence with mismatch detail; Alignment uses configured expected-state relationships rather than numeric stage equality. Refactored legacy `basin.js` density weights and `divergence.js` envelope tolerance to configuration. Also closed Phase 3's source-adapter gap: rod hashes derive Confidence/Stability only from actual evidence/lineage/validation fields and return null when no evidence signals exist. Metric definitions are `calculated_not_rendered`, versioned `rod-mathematics-v1` / `query-convergence-v1`. Config and semantic tests pass.

- **2026-07-12** — Advanced Phase 3. Added `queryConvergenceMethodology.js` with versioned, normalized weights/bands and `queryConvergence.js` with separate Query Relevance, Query Coverage, Query Confidence, and Convergence Stability engines. Relevance exposes five component contributions; Coverage deduplicates governed dimensions and excludes optional/non-applicable dimensions; Confidence remains evidence-based and independent of Coverage; Stability is inverse unresolved-evidence risk. `rodHash.js` now computes per-atom relevance and entity coverage only when `queryContextId` selects a real `QUERY_CONTEXT_REGISTRY` entry; legacy maturity remains labeled/stored solely as maturity. Metric definitions now report `calculated_not_rendered` with calculation version `query-convergence-v1`. Config audit: weights, bands, tier weights, and context dimensions are registry-driven; normalized-weight tests prevent configuration drift. Tests pass. Phase stays in progress until real source/evidence adapters supply Confidence/Stability signals and Phase 6 replaces the legacy display.

<!-- Newest entry on top. One entry per /visual-metrics invocation. -->

- **2026-07-12** — Ran Phase 2 (Canonical Metric Taxonomy & Metric Definition Registry) via `/visual-metrics`
  with no argument (next-unblocked-phase logic). Built `src/config/metrics/metricCategoryRegistry.js` and
  `src/config/metrics/metricDefinitionRegistry.js`, seeded with all 11 §II–§XIII metrics traced to their
  Phase 1 audit rows — see the table above for which already have a partial legacy calculation
  (`legacy-gate-boolean-v1`, `legacy-flat-average-v1`, `legacy-divergence-v1`, `legacy-envelope-v1`) versus
  which are entirely net-new (`defined_not_calculated`). Ran the config-audit self-check called for in the
  skill's step 4c: the registry follows this repo's existing source-code-registry idiom, no hardcode
  conversions were needed, and the relevance/coverage/maturity calculation *weights* were deliberately left
  out — that's Phase 3/4 scope, not this phase's. Noted a concurrent `salt-basin-world-variants` skill now
  exists and already references these metric names — flagged for reconciliation before Phase 5, not
  resolved here. Phase 3 (Query Convergence Model) is next; it's one of the two largest phases per
  `reference/phases.md` and may need its own Relevance+Coverage / Confidence+Stability split.
- **2026-07-12** — Skill, command, phases reference, and this tracker created (Betsy: "create a command /
  skill for the following and invoke it through the master build"). Invoked immediately via
  `salt-basin-master-build` against Loop 11 (Query Convergence) and Loop 9 (Visual Language): ran Phase 1
  (Current Metric Audit) for real against the live `journeyEngine` code — see the audit table above. Key
  finding: `rodHash.js`'s `computeRodHash()`/`triangulateEntity()` (previously classified in
  `docs/salt-basin-master-build-progress.md` Loop 11 as "substantially implemented") is a flat atom-maturity
  average being displayed as `"% converged"` — this is precisely the convergence/maturity conflation §I
  warns against, not a semantic gap the prior "substantially implemented" classification credited it for.
  Loop 11's real status is: the *mechanism* (Atom → Molecule → Rod → compound hash) is implemented: the
  *meaning* (query relevance vs. maturity vs. confidence vs. coverage, all distinct) is not — flagged back
  into the master-build tracker. One positive finding: `computeAtomVisual()`'s maturity-to-rendering-channel
  mapping already correctly separates semantic math from rendering math and should be the template for
  Phase 5's Visual Encoding Registry, not rebuilt from scratch. One open naming question recorded at the
  time (was "Orbin" a new term or shorthand for "Orbit"?) rather than resolved by fiat — since resolved by
  Betsy in favor of "Orbit," see Resolved decisions above. Phases 2–7 not started.

## 2026-07-29 — Maturity/Confidence split (rod-mathematics-v2)

Betsy supplied a consolidated principle set whose **Maturity principle** ("Maturity is purpose-, stage-,
dependency-, and network-aware. A signed master contract may have 100% legal maturity while participation
coverage, billing readiness, rev-rec readiness, renewal stability, and expected realization remain below
100%.") and **Confidence principle** ("Confidence is separate from maturity. It is calculated from evidence
quality, completeness, recency, consistency, authority, dependency resolution, and scenario-specific risk
adjustments.") are structurally incompatible with the v1 model. Acted on rather than filed:

- **`ROD_MATURITY` -> `CHANNEL_MATURITY`, and it is no longer a composite.** The v1 metric collapsed seven
  abstract dimensions into one 0-1 score per rod, which cannot express "100% legal, 40% billing readiness"
  simultaneously. `calculateChannelMaturity()` now returns a SET of independent purpose scores with **no
  `score` field at all** — averaging them would reintroduce exactly the number the principle rejects. Any
  surface wanting a headline figure must name its purpose. Purposes are configuration, so an org can add
  its own. Dependency capping is real: billing readiness is hard-capped at legal maturity, and the result
  carries `cappedBy` so a UI can say *why* a score is held down.
- **The seven v1 dimensions were retired, not relabelled.** On inspection they described how much we TRUST
  the state, not how far along it is — i.e. the Confidence principle's territory. New `STATE_CONFIDENCE`
  metric: weighted composite of the six positive inputs the principle names, with the seventh
  ("scenario-specific risk adjustments") applied as a **penalty**, so high risk can never raise confidence.
  Distinct from the pre-existing `QUERY_CONFIDENCE`, which scores an answer to an active query;
  `STATE_CONFIDENCE` scores the underlying state with no query context.
- **Key rename follows the canon's own precedent** — `worldRegistry.js` already carries
  `canonicalId: 'channel'` + `legacyAliases: ['Journey Rod']` for the same Journey -> Channel move.
  `ROD_MATURITY` is kept as a `legacyAliases` entry, not deleted. `ROD_POSITION` and `ROD_COHERENCE` are
  stale in the same way but were **not** renamed — out of scope, flag before touching.
- Envelope validator now rejects dependency cycles and unknown `dependsOn` references, and deliberately
  does **not** apply the sum-to-1 constraint to purposes.

`metricDefinitionRegistry.js` is now 12 entries. Both new metrics remain `calculated_not_rendered` — the
math and config are real and unit-tested (11/11 in `tests/rodMathematics.test.js`), but nothing renders a
purpose breakdown yet. That, plus the per-variant Visual Encoding Profile (Phase 3), is the open work.
