# HOS™ (Highway Operating System) — Journey Data Rod Methodology

Purpose: preserve the full HOS™ methodology — Journey Data Rods, the metadata crystal model, the agent hierarchy, and the SaltBridge reservoir — as reusable reasoning context, distilled from an extended architecture-design conversation on 2026-07-10.

**Naming correction (2026-07-10):** this content was originally drafted using working-session names ("Salt Basin Highway Operating System / SBHOS," "HandoverOS," "DataBasin"). Per [docs/salt-basin-foundation-source-of-truth.md](salt-basin-foundation-source-of-truth.md) — the canonical entity/product-naming reference, read that doc before any brand-facing use of this material — **HOS™ (Highway Operating System)** is a *methodology*, not a platform or product name. The platform that operationalizes HOS™ is **Salt Basin MRS (Measurement Rendering Systems)**, and each client's resulting ecosystem is a **Salt Basin Net Work**. This document has been updated to use HOS™ throughout; see **Naming Map** at the end.

This is a companion to [salt-basin-brand-context.md](salt-basin-brand-context.md) (visual/verbal standards), [salt-basin-universal-agent-reasoning-context.md](salt-basin-universal-agent-reasoning-context.md) (agent reasoning loop), and [salt-basin-foundation-source-of-truth.md](salt-basin-foundation-source-of-truth.md) (canonical brand/entity/product names — authoritative over this doc wherever they conflict).

**Vocabulary correction (2026-07-10, later same session):** the "Metadata Crystal Model" section below describes a 5-tier exploratory structure (atom → joint → molecule → capability cluster → stage gate) with Journey Data Rods as the top-level container. That is **not** the shipped vocabulary. The canonical, currently-live model is [salt-basin-metadata-model.md](salt-basin-metadata-model.md) — **3 tiers only** (Atom → Joint → Molecule), rendered on the homepage via `src/components/blocks/MetadataModelBlock.jsx`. In that model, **a Journey Data Rod is itself an example of a molecule** (alongside a job, a case study, a capability, and a product) — not a separate container that holds molecules. Read `salt-basin-metadata-model.md` for anything client-facing or homepage-adjacent; treat the section below as historical design exploration that fed the live `journey_data_rods` schema and evaluation engine (see the Status section at the end) but does not reflect current public vocabulary.

## Core Thesis

Traditional CRM/ERP systems track **objects** (Lead, Opportunity, Contract). HOS™ tracks **journeys** — persistent, continuously-evolving truth graphs that are never recreated, only enriched.

```text
Objects get replaced.
Journeys accumulate.
```

A journey advances not because a record changed status, but because enough validated business definition has accumulated to justify the next state. Maturity is a measure of **definition completeness and confidence**, not workflow completion.

## Journey Data Rods (L1)

Every commercial relationship is represented by three **parallel, interdependent** Journey Data Rods — never just one:

| Rod | Truth Domain | Answers |
|---|---|---|
| **Revenue Rod** | Commercial & financial truth | Where did ARR originate? Why did value change? |
| **Customer Rod** | Relationship truth | What promises were made? What predicts churn? |
| **Member Rod** | Entitlement & consumption truth | Who receives value? What is provisioned? |

Extended rods used for portfolio/fund-level and supporting evidence:

```text
Fund Deal Journey Rod        — acquisition pipeline through exit
Portfolio Company Journey Rod — acquisition through operating hold through exit
Contract Obligation Rod       — performance obligations, ASC 606
Financial Transaction Rod     — discrete accounting events
Resource Contribution Rod     — human/agent/system contribution attribution
Confidence Reconciliation Rod — cross-system data trust scoring
Product Definition Rod        — allowed contract/billing/obligation shapes per product
```

A **Value Creation Journey Rod** sits between the Fund Deal Rod and the Portfolio Company Rod, translating investment thesis into measurable operating initiatives with shared ownership across fund, Salt Basin, and the portfolio company.

### Maturity model

Every rod is a normalized 0.000–1.000 maturity curve, not a categorical stage field:

```text
0.00  Object does not yet exist
0.05  Identified        0.35  Evaluated
0.10  Captured           0.50  Committed
0.20  Qualified          0.70  Operational
0.85  Producing Value    0.95  Stable
1.00  Matured / Complete
```

- Stages define **ranges**, not fixed points — a deal can mature significantly within a stage before transitioning.
- Renewals increment the **whole-number epoch** (1.00 = first renewal begins, 2.00 = second, …).
- Decimal precision is continuous refinement; specific business events (amendment, credit, expansion) are recorded as explicit metadata on the token rather than encoded into decimal position.
- Weighted stage distributions vary **by L2 scenario** — enterprise deals require more definitions per stage than SMB/self-service, so the same rod matures at different speeds for different segments.

### L1 → L2 → L3 hierarchy

```text
L1  Journey Token          — the truth domain (Revenue / Customer / Member / …)
L2  Journey Scenario       — the business-scenario dimension (new sale, renewal,
                              parent pricing agreement, usage-based, government, …)
L3  End-to-End Journey     — the full realized journey for one L2 scenario,
                              spanning every fixed L1 stage with scenario-specific
                              actors, systems, inputs, outputs, and documents
```

L2 scenarios are generated from dimensional variables (customer segment, product type, pricing model, contract structure, Sold-To/Bill-To/Fulfill-To pattern, billing frequency/timing, payment method/collection, renewal model, industry, etc.) rather than hand-authored one at a time. The proliferated scenario library targets ~2,400+ combinations as a starting matrix.

## No Leads — Journey Branches

**Rule:** a Revenue Journey may only enter the Lead state when no existing Customer Journey satisfies identity-resolution confidence thresholds. A new commercial signal for an *existing* customer never creates a Lead — it creates a **Journey Branch**.

```text
Signal → Identity Resolution → Intent Resolution → Definition Collection
       → Confidence → Merge Candidate → Merge
```

- A branch is temporary working state; it accumulates candidate metadata and evidence.
- A merge does not necessarily advance maturity — it may only increase **definition density** and **confidence**.
- Every rod therefore has two independent measures: **Maturity** (how far through the lifecycle) and **Density** (how completely the current state is understood), plus **Confidence** (evidence reliability).

## The Metadata Crystal Model

The reusable Salt Basin crystal motif (see brand context) has a precise semantic structure underneath it:

```text
Metadata Atom → Metadata Joint → Metadata Molecule
             → Capability Metadata Cluster → Stage Gate → Rod State
```

- **Atom** — one irreducible field-level cache (e.g. Billing Start Date). Always the same crystal geometry; differentiated only by color.
- **Joint** — the relationship *and its evolution over time* between two atoms (e.g. "billing begins 30 days after contract activation"). Two atoms grouped together always have exactly one joint; *n* atoms have up to *n×(n−1)/2* joints.
- **Molecule** — the minimum atom+joint grouping that is a valid unit of context for a user-facing agent conversation (e.g. 3 atoms → 3 joints → 1 molecule cache).
- **Capability Cluster** — multiple molecules combined to answer one business capability question (Quote Readiness, Pricing Approval, Contract Activation, …).
- **Stage Gate** — a capability-cluster threshold: `Weighted Data Completion ≥ Stage Threshold AND All Minimum Required Definitions Exist AND Required Validations Complete AND Confidence ≥ Minimum`.

### Classification-path color standard

This is a **global data-model standard**, not decoration:

```text
Color = f(Atom Metadata Type + Cluster Rollup + Hierarchy Rollup)
```

- The same full classification path always resolves to the same color.
- A changed path is a *new* path and receives a *new* color — colors are never reassigned or reused.
- A central **Path Color Registry** stores every path → color mapping and grows automatically as the data model adds new combinations; historical records keep the color assigned at creation time.
- Joints, molecules, and rods inherit visual language from their constituent atom colors; conflict/staleness/pending-validation states are shown via fracture, opacity, and pulse rather than color reassignment.

## Agent Hierarchy & Journey Data Rod Staff

Every Journey Rod and every Journey Branch gets its own **dynamically created agent**. Agents form a hierarchy so a user can converse at whatever level of detail they need; instructions delegate downward to the smallest irreducible agent.

```text
Portfolio Agent → Enterprise Agent → Customer Agent → Deal Agent
   → Journey Data Rod Agent → Journey Branch Agent → Lifecycle Stage Agent
   → Data Rod Joint Agent (connective tissue between two agents/rods)
   → Journey Data Rod Staff (irreducible: Pricing Staff, Contract Evidence Staff,
       Usage Reconciliation Staff, Revenue Recognition Staff, Materiality Staff, …)
```

- **Data Rod Joint Agents** own the *transformation*, not the data, when context crosses between two autonomous agents (e.g. Revenue Rod ↔ Customer Rod). They log a handoff ledger: what changed, what evidence was added, confidence before/after, human review status.
- **Historical Lineage Agent** — created when branch agents merge; preserves full reconciliation history (conflicting values, chosen authoritative value, rejected alternatives, approvals).
- **Rod Cache Hierarchy** minimizes LLM calls by always starting from the smallest sufficient cache and escalating only when needed:

```text
L0 Live Working Context  → L1 Stage Cache → L2 Rod Cache
→ L3 Deal/Customer Cache → L4 Portfolio/Enterprise Cache
→ L5 Historical Lineage Archive (full immutable record, retrieved only for audit)
```

Cache invalidation is **event-based**, not time-based (contract amendment, corrected invoice, human correction, new pricing version, branch merge, renewal epoch, …), and only the affected cache levels rebuild.

## Time as a First-Class Dimension

Every data element and every journey stage transition carries:

```text
created_at · last_updated_at · updated_by (human|agent) · effective_from/through
stage_entered_at · stage_exited_at · duration · expected_duration · aging_variance
transition_trigger · transition_owner · maturity_before/after · review_status
```

This enables direct answers to "how long has this been in Contract review" and "which stage is this scenario aging worse than comparable deals" without reconstructing history from raw logs.

## Security & Zero-Copy Context

**Agents are the security boundary**, not raw tables. Effective permission is the intersection of agent scope, user identity/active profile, org policy, purpose, and data classification — the most restrictive rule wins. Interaction modes are graded (Discover → Read → Contribute → Propose Write → Approve → Execute Write → Administer), not a flat read/write toggle.

For distributed source systems (data residing on different servers/orgs), Salt Basin acts as a **federated aggregation layer**: source-side execution and derived/aggregate results flow up, raw sensitive records stay in place. A **Zero-Copy Context Fabric** caches intelligence (definitions, confidence, fingerprints, relationships) rather than copies of sensitive source data; live sync is event-driven off source-system change events, not nightly ETL.

## SaltBridge — The M&A / Migration Reservoir

Working name in design discussion: "DataBasin Data Bridge." **Maps to the already-named Salt Basin product `SaltBridge`**, a MES Solutions product (see foundation doc §5 and brand context: "Engine or knot crystal … SaltBridge lineage").

SaltBridge is a **temporary reservoir**, not a permanent system of record: it normalizes, translates, and reconciles data flowing in from legacy/acquired systems before Journey Rods absorb it, and provides the merge engine for combining two existing Journey Rods (e.g. post-acquisition) while preserving full **rod genealogy** (merged-from lineage, never silently deleted). Lifecycle: Intake → Normalization → Conflict Resolution → Simulation → Validation → Migration → Convergence → Archive.

## Assurance, Validation & Institutional Knowledge

- Multi-pass analysis (extraction → relationships → reconciliation → policy validation → exception detection → variance analysis) rather than single-pass LLM output.
- Confidence is multi-dimensional: Data, Extraction, Business Context, Reconciliation, Validation — combined into an overall assurance score; 100% reconciliation confidence requires full evidence coverage, full human-validation coverage, cross-system agreement, repeatability across passes, and an error-free rate.
- Every logged data error is tracked for recurrence over time (new vs. repeated vs. resolved vs. regression) and feeds a **Material Weakness Library** with quantified thresholds (e.g. revenue overstatement % that triggers restatement risk) rather than qualitative Green/Yellow/Red labels.
- **Contribution Intelligence** — collaborative agentic channels attached to a Journey Rod capture how each participant's conversational contribution became a definition, policy, metadata correction, or agent-skill improvement, with estimated downstream value.

## Commercial Intelligence

- **Product Definition Rod**: products define the *allowable* contract structures, billing frequencies/timing, payment methods, and performance-obligation templates; the contract only selects from that space. Billing events and performance obligations are many-to-many via an allocation matrix, not 1:1.
- **Pricing model library**: fixed subscription, tiered usage, included-usage-with-overage, graduated tiers, volume, minimum-commitment, revenue share, dynamic/index pricing — each a reusable equation, simulated side-by-side against cost basis for margin/forecast/risk before a scenario is chosen.
- **Accounting pattern library**: reusable ASC 606-aligned patterns (SaaS subscription, usage-based, milestone, deferred revenue, variable consideration, contract modification, multi-element) tied to the Product Definition Rod rather than embedded in ERP configuration.

## Naming Map (design term → canonical Salt Basin name)

| Design-session term | Use instead | Source |
|---|---|---|
| Salt Basin Highway Operating System (SBHOS) / HandoverOS | **HOS™** — a *methodology*, not a platform | foundation doc §4–5 |
| The platform that runs HOS™ | **Salt Basin MRS** (Measurement Rendering Systems) — trademark symbol unconfirmed, do not add ™ | foundation doc §5 |
| A client's built result | **a Salt Basin Net Work** (deliverable) — distinct from **Salt Basin Net Works** (the brand/company) | foundation doc §5, §2 |
| DataBasin / DataBasin Data Bridge | **SaltBridge** (MES Solutions product) | foundation doc §5 |
| Measured Fund / Enterprise / Member Success Solutions | not yet productized — treat as roadmap concepts, do not publish externally; distinct from the filed **MES Solutions, LLC** / **MESA** entity names, do not conflate | this doc, draft only |
| Metadata Atom / Joint / Molecule / Capability Cluster | keep as-is — internal data-model vocabulary, not public-facing product names | this doc |

Diagnostic layer note: HOS™ operationalizes **RLMM™** (Revenue Lifecycle Mechanics Maturity™), the proprietary diagnostic capability model — see [salt-basin-trademark-methodology-atlas.md](salt-basin-trademark-methodology-atlas.md) for the full IP stack and how it maps to each trademarked methodology.

## Status

**Correction (2026-07-10, later same session):** an earlier version of this doc said this methodology was "architecture/vocabulary reference, not a shipped data model." That was wrong — a real, working implementation already exists:

- `server/lib/journeyRods.js` — `ensureLeadRevenueRod`, `ensureMemberJourneyRods`, `ensureMemberOrganizationRods`, `recordRodEvent`, `evaluateJourneyRod` (the stage-gate evaluation engine: required clusters/molecules/actor roles/dependency rules, weighted dimension combinations, human-judgment escalation via `requestJourneyDecision`), `upsertJourneyEvidence`.
- `server/routes/journeyRods.js` — `/api/journey-rods/*`, including admin CRUD for molecules, clusters, scenarios, and gate definitions, plus per-rod evidence/evaluate/threshold-profile endpoints.
- Tables in `server/db.js`: `journey_data_rods`, `journey_rod_events`, `journey_metadata_molecules`, `journey_metadata_clusters`, `journey_scenarios`, `journey_gate_definitions`, `journey_rod_evidence`, `journey_rod_actors`, `journey_rod_threshold_profiles`, `journey_rod_decisions`, `journey_stage_gates`.

The live schema uses **molecules** (an individual metadata field) and **clusters** (a required grouping of molecules) rather than this doc's atom/joint/molecule/capability-cluster four-level vocabulary — one level flatter, same spirit. Treat `server/lib/journeyRods.js` as the source of truth for how evaluation actually works; use this doc for the broader conceptual vocabulary (branches, rod cache hierarchy, Data Rod Joint Agents, SaltBridge, etc.) that hasn't been built yet. Don't assume something described here is shipped without checking against the files above.
