# Salt Basin Divergent State Mechanics — Invention Framework & Draft Claim Tree

> **Status: draft technical framework for attorney review. Not filed claim
> language. Not a patentability, novelty, or freedom-to-operate opinion.**
> This document reflects an internal prior-art *pressure test* (50+ search
> formulations across patent and technical literature) run against an
> earlier chemistry/oceanography/astrodynamics terminology draft. Several
> original terms were abandoned after direct or near-direct prior-art
> collisions were found (see "Terms abandoned" below); the terminology here
> is the revised, collision-checked version. Formal prior-art search,
> claim drafting, and eligibility/obviousness analysis must be done by
> counsel before any filing decision. Where this document says "prior art
> found," that means informal search results reviewed in this session, not
> a formal search report with citations counsel can rely on as-is.
>
> **Update (later in the same session):** a second 50-search pressure-test
> pass, run specifically against an accounting/journal-entry application of
> this framework, surfaced a fourth invention (§9 below) and reframed the
> count from three disclosures to four, with revised titles for two of the
> original three. See the `salt-basin-dsm-data-model-schema` memory for the
> full consolidated entity model these four inventions now share, and the
> `divergent-state-mechanics-framework` memory for the round-by-round
> pressure-test history. §§3–8 below are left as originally drafted
> (Invention 3's status is uncertain — see the note at the top of §5); only
> §9 and this notice are new.
>
> **Implementation status (later still in the same project):** the
> consolidated entity model referenced above now has a real, running
> implementation — see `docs/eidos-operating-model-playbook.md` and
> `docs/eidos-business-rules-mapping.md`. That build is schema/API/admin-UI
> only ("broad-shallow" phase 1): it gives every layer above a persistence
> shape and a config surface, but does **not** implement the inference
> algorithms these four inventions describe (real settlement-density math,
> real accounting-topology inference, real cross-projection divergence
> beyond a simplified stand-in). Nothing in this claim-tree doc changes as a
> result — building the data model a claim describes is not evidence for or
> against that claim's novelty, and this is not itself prior art against
> the inventions below. Read the playbook doc before assuming any of §§3–9's
> "not yet built" language is stale.

## 1. Background

Salt Basin's product renders enterprise journeys (Revenue, Customer, Member
lifecycle states for one real-world entity — a deal, an organization, or a
person) as a spatial world, and computes state for each on demand rather
than persisting a single denormalized record. Several distinct
architectural questions came up while building the engine, and each
resolved into a candidate invention. As of the latest pressure-test round,
Betsy's own count and preferred titles are:

1. **Field-Derived Semantic Composition** — magnetic-affinity and
   (separately) alignment rules determining which governed evidence units
   cluster into which semantic compositions. Not yet given its own §
   below; currently folded into Invention 1's dependent claims and the
   `bonding.js` implementation. Should be split out as its own §2.5 before
   this document is finalized with counsel.
2. How does the system know when a *declared* value and its *deeper,
   independently-corroborating* evidence disagree — and detect exactly
   where that disagreement begins? → **Invention 2 (retitled): Projection-
   Relative Compositional Settlement and Resuspension** (originally titled
   "Evidence Stratification Gradient / State Pycnocline" — that mechanism
   is still valid and is now a dependent claim within this broader
   invention, whose primary claim center shifted to settlement/density
   being computed per composition+projection+time, not per atom).
3. How far have two correlated-but-independently-computed journey states
   drifted apart, and is that drift itself meaningful signal? → **Invention
   3: Heterosemantic State Divergence Kinetics** (a.k.a. "Heterosemantic
   Journey-State Divergence").
4. **Reciprocal Economic-Accounting State Projection** — see §9, added in
   the later pressure-test round.

The original §5 below ("State-Topological Agent Instantiation") was *not*
re-confirmed in Betsy's latest 4-item list, but wasn't explicitly killed
either — that round's search focused on accounting, not agent topology.
Treat it as a candidate 5th/appendix item pending re-evaluation rather than
dropped.

Working name for the overall framework: **Salt Basin Divergent State
Mechanics™ (DSM)**. Internally: DSM.

## 2. Terms abandoned during pressure-testing

| Abandoned term | Why | Replacement |
|---|---|---|
| Isotope / Temporal Isotope | IBM patent application already uses "data isotope" for ML training-data flow visualization — direct collision | No separate term; the underlying mechanic (same identity, temporally-valid value changes, tracked as version history) stands on its own |
| Bond Strength | Prior art already pairs "bond strength" with "semantic distance" for closeness in semantic space | Contribution Affinity — not closeness between two atoms, but one evidence unit's measured capacity to contribute to a shared state composition |
| Journey Orbit / expected trajectory | Process models, digital twins, and lifecycle models already define expected execution/transition behavior | Correlated State Envelope — an expected *range* for one rod derived from another's current position, not a fixed trajectory |
| Data Current (as a claim anchor) | Data flow/propagation modeling is heavily occupied art | Kept only as informal vocabulary (rate/direction of state-changing activity within a Basin), not a claim term |
| State Depth (linear hierarchy) | "Depth" implied an arbitrary manually-ranked hierarchy; layered/hierarchical evidence analysis is itself common | State Density — a *computed*, multi-factor settlement property (persistence, corroboration, temporal stability, lineage attachment, semantic resolution), with sediment/water/surface behavior (settle, stay suspended, or resuspend) rather than a fixed rank |
| Thermocline | Wrong physical property (temperature, not density) for what's actually being modeled | State Pycnocline (the detected boundary) / Evidence Stratification Gradient (the computation that finds it) |
| State Salinity | Kept, renamed for precision | Cross-Domain Contribution Ratio |
| Escape State | Vague "exception" framing | Reconciliation Boundary Exceedance — a defined condition: divergence has moved a projection outside its Correlated State Envelope |

## 3. Invention 1 — Heterosemantic State Divergence Kinetics (HSDK)

**Priority: highest.** This is the concept that survived prior-art review
most cleanly, provided the claims are anchored on the specific mechanic
below and not on "compare two states and flag a difference" in the
abstract.

### 3.1 Technical problem

Existing anomaly detection, process-conformance, and digital-twin systems
generally compare an observed state against *one* expected/reference model,
or replicate *one* deterministic state machine across an event history and
flag deviation from that single machine. They implicitly assume the
compared states are meant to converge or already represent the same
underlying truth.

Salt Basin's problem is different: Revenue, Customer, and Member
projections for one real-world entity are *intentionally* computed from
different, non-overlapping evidence compositions and are not meant to be
identical, or even close, at every point in the lifecycle. The system needs
to determine, for correlated-but-non-equivalent projections, not just *that*
they differ but *how* — in lifecycle position versus in evidentiary
settlement — and whether the rate/trend of separation itself indicates a
developing problem before a fixed threshold is crossed.

### 3.2 Summary of the invention

A system maintains, for a single journey identity, multiple independently
computed state projections, each derived from a distinct admissible
evidence composition associated with a different semantic domain (e.g. a
revenue-domain projection, a customer-domain projection, a member-domain
projection). For a pair of such projections, the system computes:

- an **axial divergence** component (difference in lifecycle/coordinate
  position),
- a **density divergence** component (difference in evidentiary settlement,
  per Invention 2's density model — a domain corroborated by multiple
  independent systems is "denser," hence more settled, than one still
  resting on a single declared field),
- a **Correlated State Envelope**, an expected coordinate range for one
  projection derived dynamically from the other projection's current
  position (not a static/pre-declared trajectory),
- whether the actual position exceeds that envelope (**Reconciliation
  Boundary Exceedance**), and
- the **rate** and **rate of change of the rate** (divergence velocity and
  acceleration) of the divergence measure over a rolling window of prior
  computations, so a system in the process of separating quickly can be
  distinguished from one that is stably, slightly apart.

### 3.3 Distinguishing features versus identified prior art

- **State-machine replication / distributed FSM prior art**: replicates one
  deterministic machine's state across nodes against one ordered event log.
  HSDK computes *multiple, non-equivalent* projections by design and treats
  their designed-in non-convergence as informative, not as replication lag
  to eliminate.
- **Object-centric process mining / process conformance**: compares an
  actual event-log trace's reachability against one process-model graph.
  HSDK does not test conformance against a single canonical model; it
  compares two independently-computed, differently-composed projections
  against each other, using a dynamically derived envelope rather than a
  fixed model.
- **Multidimensional anomaly detection**: aggregates heterogeneous signals
  into one anomaly score. HSDK's divergence is specifically *relative*
  between two named, semantically distinct projections of a shared
  identity, decomposed into axial vs. density components, with an envelope
  that itself moves as the reference projection moves.

### 3.4 Draft independent claims (illustrative only — not filed language)

**Claim 1 (system).**
A computer-implemented system comprising one or more processors and memory
storing instructions that, when executed, cause the system to:
(a) maintain, for a journey identity, a first state projection computed
from a first admissible evidence composition associated with a first
semantic domain, and a second state projection computed from a second,
distinct admissible evidence composition associated with a second semantic
domain, wherein the first and second state projections are not required to
converge to an identical value;
(b) compute a divergence measure between the first and second state
projections, the divergence measure comprising an axial divergence
component representing a difference in lifecycle coordinate position and a
density divergence component representing a difference in a computed
evidentiary-settlement value for each projection;
(c) derive a correlated state envelope for the second state projection as a
function of the current coordinate position of the first state projection;
(d) determine whether the second state projection's coordinate position
exceeds the correlated state envelope, and responsive to such a
determination, generate a reconciliation-boundary-exceedance signal; and
(e) compute a rate of change of the divergence measure over a plurality of
prior computations of the divergence measure, and a rate of change of that
rate of change.

**Claim 2 (method).** A computer-implemented method comprising steps
corresponding to (a)–(e) above.

**Dependent claims (illustrative):**
- wherein the evidentiary-settlement value is computed from a persistence
  factor, a corroboration factor derived from a count of independent
  evidence units, a temporal-stability factor, a lineage-attachment factor,
  and a semantic-resolution factor (ties to Invention 2);
- wherein the correlated state envelope's width is configured per pair of
  semantic domains;
- wherein the reconciliation-boundary-exceedance signal triggers
  instantiation of an agent execution boundary scoped to the journey
  identity (ties to Invention 3);
- wherein the first and second admissible evidence compositions are
  computed on demand from a shared, non-duplicated evidence store rather
  than materialized and persisted as separate denormalized records.

## 4. Invention 2 — Evidence Stratification Gradient / State Pycnocline

**Priority: second.** Survived prior-art review well; ocean-science-adjacent
patents exist (e.g. correcting a forecast state from temperature/salinity/
pressure observations) but none found compute *this* specific gradient over
consequence-ordered evidence strata for a declared assertion.

### 4.1 Summary of the invention

A system re-derives a state value repeatedly across an ordered sequence of
evidence strata, where each stratum represents evidence at a different
computed distance from the original declared assertion (not a manually
assigned tier — see Invention 2's companion density model in Invention 1,
§3.3). For each successive pair of strata, the system computes the change
in derived state value (`ΔS`) and flags a stratification boundary — a
**State Pycnocline** — at the point where `ΔS` exceeds a depth-normalized
transition threshold. The boundary itself, not merely the final state
value, is reported: it identifies *where* declared truth and
evidence-corroborated truth begin to disagree, which evidence unit sits on
each side of that boundary, and by how much.

### 4.2 Distinguishing features versus identified prior art

- **Layered/hierarchical confidence models**: typically report a single
  aggregate confidence score, or fixed confidence tiers. This invention
  reports the *location of the discontinuity* between strata as a
  first-class output, computed from the marginal change between adjacent
  strata rather than an absolute score.
- **Lifecycle/policy-derivation systems** (deriving a policy from object
  content and metadata): operate on declared metadata, not on a
  consequence-distance-ordered evidence sequence with a detected
  discontinuity.

### 4.3 Draft independent claim (illustrative only)

**Claim 1 (method).** A computer-implemented method comprising:
(a) identifying a plurality of evidence units associated with a semantic
assertion, each evidence unit assigned a stratum based on a computed
consequence-distance from the original declaration of the assertion;
(b) computing, for each stratum, a derived state value from the evidence
units at or below that stratum;
(c) computing, for each pair of successive strata, a change in the derived
state value between the two strata;
(d) responsive to a computed change exceeding a depth-normalized transition
threshold, identifying a stratification boundary between the corresponding
pair of strata; and
(e) generating an output identifying the stratification boundary, the
evidence units on each side of it, and the magnitude of the change.

**Dependent claims (illustrative):** wherein the consequence-distance is
computed from the number of independently-operating systems that have
produced evidence consistent with the assertion; wherein an evidence unit
that cannot be assigned to a stable state composition due to conflicting
evidence is classified separately from settled evidence ("suspended");
wherein a previously-settled state composition is returned to an unsettled
classification responsive to a new evidence unit affecting its temporal
validity ("resuspension").

## 5. Invention 3 — State-Topological Agent Instantiation

**Priority: third — the narrowest of the three, but still distinctive if
claimed on the derivation mechanism rather than on "one agent per branch."**
Agent-workflow orchestration (agent selection, parallel execution,
hierarchical context snapshotting) is itself crowded prior art; the
distinguishing element is *what determines an agent's scope*.

### 5.1 Summary of the invention

Responsive to detecting a change in a persistent state topology (e.g. a
branch forming off an existing journey, or a new derived state composition
being produced and requiring reconciliation back into its origin), the
system automatically derives a computational boundary from that topology
change, and instantiates an agent execution boundary whose context scope,
evidence-access policy, and lifecycle are derived from — rather than
manually configured for — the specific branch or derived-state event that
triggered it. The agent's existence and scope are thus a *function of* the
detected state topology, not a pre-assigned role.

### 5.2 Draft independent claim (illustrative only)

**Claim 1 (method).** A computer-implemented method comprising:
(a) detecting formation of a state branch within a persistent state
topology associated with a journey identity;
(b) responsive to the detection, deriving a computational boundary from the
inherited state topology and the branch-specific state topology;
(c) deriving, from the computational boundary, an agent context scope and
an evidence-access policy; and
(d) instantiating an agent execution boundary scoped according to the
derived agent context scope and evidence-access policy, without manual
assignment of the scope or policy.

**Dependent claims (illustrative):** wherein the state branch is produced
by a gate evaluation determining that a derived state composition should be
generated from a set of evidence units (ties to Invention 2's gate
mechanism); wherein the agent execution boundary is retired responsive to
detecting that the state branch has merged back into its origin state
topology under an approval condition.

## 6. Cross-invention framing

The Rod — a persistent temporal state projection axis — is the bridge
entity across all three inventions: it takes evidence composed within a
bounded domain (Invention 2's stratification) and projects it into a
coordinate system where divergence against other correlated projections can
be computed (Invention 1), while topology changes along that axis
determine agent scope (Invention 3). Counsel should evaluate whether a
combined independent claim spanning all three (the "Rod" claim) is stronger
or weaker than three separate, narrower filings — combined claims are
harder to design around but may face a compound obviousness attack
assembled from the individual prior-art families identified per invention.

## 7. Identified prior-art threat requiring formal search (Inventions 1–3)

The most credible combination attack identified informally: **object-centric
process mining** (process topology graphs from object/event types) +
**process-conformance** (reachability vs. actual event-log transitions) +
**multidimensional anomaly detection** (continuous anomaly detection across
heterogeneous information), combined, could plausibly be asserted as
rendering the general "compare computed states, flag deviation" concept
obvious under §103. The claims above are drafted to sit outside that
combination by anchoring on the specific mechanics (non-equivalent
projections by design, dynamically-derived envelopes, stratification
boundary detection, topology-derived agent scope) rather than on the
general comparison/deviation-flagging concept. This still requires a
formal search and an examiner-style rejection attempt by counsel before
relying on it.

## 9. Invention 4 — Reciprocal Economic-Accounting State Projection

**Added in a later, separate 50-search pressure-test pass specifically
targeting an accounting/journal-entry application of Inventions 1–3.** Most
of the obvious framings for "AI + accounting" died hard in that search (see
below); one narrower framing survived cleanly and is the strongest of the
four inventions in this document.

### 9.1 What was tried and killed

Do **not** anchor claims on any of the following — each collided directly
with existing patents/applications found in the informal search:
- **Automated JE generation from business events** — collides with
  computerized-predicate-logic accounting-entry generation art.
- **Predicting/coding a GL account from transaction attributes** — collides
  with existing invoice-processing/GL-coding ML patents.
- **Matching a journal entry to its source transaction, or confidence-
  scoring that match** ("Lineage Attraction Field" in an earlier draft of
  this framework) — this is, structurally, automated account
  reconciliation, which is already patented (information-theoretic/NLP/ML/
  record-linkage matching with confidence thresholds).
- **Tracing a JE backward through its lineage to origin evidence**
  ("reverse mapping") — collides with existing accounting-generation art
  that already describes reverse mapping, and with general data-lineage-
  tracking patents.
- **"Evidence combines and the system explains whether accounting
  treatment is supported"** — collides with existing AI-augmented auditing/
  explainability art (multi-layer evidence processing + policy adjudication
  + traceability).

### 9.2 What survived: topology inference, not matching

The reframe that survived: instead of asking *"which evidence matches this
journal entry,"* ask *"does the economic world required to explain this
journal entry's structure actually exist in the enterprise's evidence."*
An observed journal entry (accounts, debit/credit direction, amounts,
entities, period) is treated as an **observed accounting topology** — a
structural object, not a transaction-to-be-matched. The system:
1. Derives the **economic-state composition that would be required** to
   produce that exact topology under the applicable accounting-policy
   field (not: scores candidate transactions against it).
2. Compares that inferred-required composition against the
   **independently, forward-derived journey state** for the same entity
   (the existing Invention 3/HSDK machinery — same journey identity, two
   non-equivalent projections: journey-derived and accounting-derived).

### 9.3 Summary of the invention

A system derives a governed economic-state composition from distributed
evidence units (Invention 1); independently projects that composition onto
both a temporal journey-state structure (Invention 3's journey projection)
and an accounting-state topology, the latter via an accounting-policy
field analogous to the journey attraction field; extracts a normalized,
reconstructable structural signature from an observed journal entry
(account nodes, debit/credit edges, balance/dimensional/temporal
relations); inversely derives one or more economic-state compositions
admissible as an explanation for that observed signature; and computes
divergence between the inversely-derived economic-state composition and
the independently, forward-derived journey-state composition for the same
journey identity.

Two derived conditions specific to this invention (illustrative, not
formal claim language yet):
- **Accounting Zero-Gravity**: an observed accounting topology for which
  *no* admissible economic-state composition can be constructed that would
  produce it under the applicable policy field — distinguished from an
  "unmatched item" (which is reconciliation-art territory) by being a
  structural admissibility failure, not an absence of a matching record.
- **Accounting Orbital State**: multiple admissible economic-state
  compositions could each explain the observed topology, with no dominant
  candidate — "multiply explainable," not "uncertain GL coding."

### 9.4 Distinguishing features versus identified prior art

The nearest identified prior art (automated reconciliation, accounting-
entry generation, AI-augmented auditing, data lineage tracking) all operate
in one direction — forward generation, or backward matching/tracing to a
specific record — and all terminate in a match/score/explanation for the
*same* record. This invention is bidirectional and comparative across two
independently-derived, non-equivalent projections of a common journey
identity (mirroring Invention 3's core pattern), and its output is a
divergence measure between those two projections, not a match confidence
or a generated entry.

### 9.5 Draft independent claim (illustrative only — not filed language)

**Claim 1 (method).** A computer-implemented method comprising:
(a) deriving a first state projection for a journey identity by projecting
a governed economic-state composition onto a temporal journey-state
structure;
(b) deriving a second, independent state projection for the same journey
identity by projecting an observed accounting topology, extracted from one
or more journal entry records, backward into one or more economic-state
compositions admissible as an explanation for the observed accounting
topology under an applicable accounting-policy field;
(c) computing a divergence measure between the first state projection and
the second state projection; and
(d) responsive to the divergence measure exceeding a threshold, generating
a signal identifying the divergence.

**Dependent claims (illustrative):** wherein step (b) further comprises
determining that no economic-state composition is admissible as an
explanation for the observed accounting topology, and responsive to that
determination, generating an accounting-zero-gravity signal; wherein step
(b) yields a plurality of admissible economic-state compositions with no
dominant candidate, and responsive to that condition, generating an
accounting-orbital-state signal; wherein the observed accounting topology
is a normalized, reconstructable structural signature comprising account
nodes, debit/credit-direction edges, and amount/dimensional/temporal
relations extracted from the journal entry records.

## 10. Recommended next step

For Inventions 1–3: draft the independent claims above as real provisional
claims, then deliberately assemble the strongest prior-art combination
found for each and attempt to reject the claim against it (an internal
§102/§103 self-attack) — this is the fastest way to find out where each
claim actually breaks, before spending on a formal filing. For Invention 4,
the same self-attack should specifically target the killed framings in
§9.1 to confirm the surviving claim in §9.5 doesn't quietly collapse back
into one of them. Before any of this, resolve Invention 3's uncertain
status (see §1) and split "Field-Derived Semantic Composition" out into
its own numbered section — this document is not yet internally consistent
with Betsy's latest 4-invention framing and should not go to counsel as-is.
