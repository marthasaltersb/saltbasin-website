# Master Redesign Prompt — Salt Basin Visual Metrics, Query Convergence, Data Rods, and Maturity Mathematics

Verbatim brief supplied by Betsy 2026-07-12. Twenty roman-numeral sections (I–XX). Read only the
section(s) relevant to the current phase — see `phases.md` for the section-to-phase mapping — rather
than the whole document, unless the user asks for a full pass.

---

Act as a principal data visualization architect, quantitative product designer, semantic systems architect, 3D interaction designer, and enterprise operating model architect.

You are redesigning the mathematical meaning, visual behavior, labels, and user interpretation of the Salt Basin 3D data environment.

The current implementation visually renders data points, Orbits, convergence behavior, rods, maturity values, scores, percentages, coordinates, and other mathematical values.

The problem is that many of these values currently appear mathematically interesting but do not yet have a clearly defined enterprise or user-facing meaning.

For example:

A user clicks the Customer Orbit.

The surrounding data points visually converge.

Mathematical numbers or values are displayed.

The interface appears to be performing a calculation.

However, it is currently unclear:

- what is converging;
- why it is converging;
- what the visual movement represents;
- what each displayed number measures;
- whether higher or lower is better;
- whether the value is observed or calculated;
- whether the value represents maturity, confidence, completeness, relevance, dependency, similarity, agreement, or proximity;
- how the number changes;
- what business action the number should cause;
- and how the visualization relates to Salt Basin Data Rods and journey maturity.

The assignment is to redesign this entire visual measurement system so every visual and mathematical behavior has a defined semantic meaning.

Do not preserve meaningless numbers merely because they currently exist in the code.

Inspect the existing implementation first.

Identify every displayed:

- score;
- percentage;
- decimal;
- coordinate;
- distance;
- radius;
- weight;
- count;
- convergence value;
- maturity value;
- rod value;
- density value;
- confidence value;
- progress indicator;
- animation magnitude;
- cluster metric;
- query result metric.

For each value, determine:

1. Where it is calculated.
2. What variables are used.
3. Whether the calculation currently has business meaning.
4. Whether the value is merely a rendering variable.
5. Whether the value is exposed to the user.
6. Whether it should remain visible.
7. Whether it should be renamed.
8. Whether the calculation should be redesigned.
9. What user decision or system behavior it should support.

The final implementation must clearly separate:

## RENDERING MATHEMATICS

Values used only to render the 3D environment.

Examples:

- x coordinate
- y coordinate
- z coordinate
- camera distance
- interpolation value
- animation progress
- particle velocity
- visual scale
- rendering radius

These values should generally not be presented to the user as business intelligence.

from:

## SEMANTIC MATHEMATICS

Values that describe the meaning or state of Salt Basin data.

Examples:

- query relevance
- evidence coverage
- definition completeness
- confidence
- agreement
- contradiction
- path maturity
- journey maturity
- dependency strength
- temporal freshness
- lineage completeness
- stage readiness

from:

## BUSINESS MATHEMATICS

Values used to support operational or financial decisions.

Examples:

- revenue at risk
- completion threshold
- cost impact
- margin impact
- effort
- cycle time
- control exposure
- exception volume
- reconciliation gap

The user must never mistake rendering mathematics for enterprise intelligence.

---

# I. DEFINE QUERY CONVERGENCE

The interaction currently called "convergence" must be given a precise meaning.

When the user selects an Orbit, such as:

CUSTOMER

the points should not simply move toward the Orbit because it looks visually compelling.

The visual convergence must represent:

## QUERY CONTEXT CONVERGENCE

Query Context Convergence is the process of re-evaluating visible Salt Basin elements against the selected semantic context and visually reorganizing them according to their relationship to that context.

Example:

The user selects:

CUSTOMER

The system establishes:

active_query_context = CUSTOMER

Every visible element is evaluated against Customer context.

The system asks:

How directly does this element describe a customer?

How strongly is this element linked to Customer Journey Data Rods?

How many lineage paths connect this element to customer state?

How important is this element to understanding the selected customer context?

How recent is its evidence?

How reliable is its definition?

Does it support or contradict other evidence?

The data points then visually reorganize according to those calculated relationships.

Therefore:

## CONVERGENCE DOES NOT MEAN MATURITY.

## CONVERGENCE DOES NOT MEAN COMPLETION.

## CONVERGENCE DOES NOT AUTOMATICALLY MEAN CONFIDENCE.

Convergence means:

### SEMANTIC RELEVANCE TO THE ACTIVE QUERY CONTEXT.

Use this definition consistently unless the existing architecture reveals a more intentional prior methodology.

---

# II. CREATE A QUERY CONVERGENCE MODEL

Create a transparent Query Convergence model.

For every element evaluated against an active query context, calculate:

## Query Relevance Score

Range:

0.00–1.00

Meaning:

How directly relevant is this element to understanding the active query context?

Example:

Active Query Context = CUSTOMER

Customer Master Record Definition:
0.98

Customer Journey Stage:
0.96

Bill-To Party:
0.89

Contract Renewal Term:
0.74

Product Performance Obligation:
0.51

Internal Development Sprint:
0.08

Do not infer relevance from keyword similarity alone.

Use available:

- explicit relationships;
- lineage paths;
- rod associations;
- molecule membership;
- atom metadata type;
- hierarchy paths;
- evidence relationships;
- semantic similarity;
- business rules.

Create a component calculation such as:

Query Relevance Score =
Direct Semantic Relationship
+ Rod Relationship
+ Lineage Relationship
+ Hierarchy Relationship
+ Semantic Similarity

Use configurable weights.

Example conceptual weighting:

Direct Semantic Relationship = 35%
Rod Relationship = 25%
Lineage Relationship = 20%
Hierarchy Relationship = 10%
Semantic Similarity = 10%

Do not hardcode these weights throughout the application.

Create a methodology configuration.

The UI must provide a methodology explanation.

---

# III. DEFINE VISUAL CONVERGENCE DISTANCE

The physical distance of an element from the selected Orbit should represent Query Relevance.

Example:

0.90–1.00:
Core Context

0.70–0.89:
Strongly Related

0.50–0.69:
Contextually Related

0.25–0.49:
Weakly Related

0.00–0.24:
Peripheral

The closer an element moves to the selected Orbit, the more relevant it is to the selected query context.

Use a nonlinear distance function if visually appropriate.

For example:

visual_distance = maxRadius × (1 - relevanceScore)^curveFactor

The exact rendering function may vary.

However, preserve the semantic rule:

CLOSER = MORE RELEVANT TO THE ACTIVE QUERY CONTEXT.

Do not display the raw rendering distance as the primary metric.

Instead display:

QUERY RELEVANCE
0.87

STRONGLY RELATED

Then allow the user to inspect:

Why is this relevant?

Example:

Customer Journey Rod: +0.25
Direct Customer Link: +0.31
Revenue Rod Lineage: +0.18
Semantic Relationship: +0.08
Hierarchy Context: +0.05

Total Query Relevance: 0.87

The user must be able to understand where the number came from.

---

# IV. DEFINE CONVERGENCE COVERAGE

A second metric is needed.

Do not confuse individual element relevance with query completeness.

Create:

## Query Coverage

Range:

0%–100%

Meaning:

How much of the currently defined Salt Basin knowledge required to answer or represent the active query context is present in the convergence result?

Example:

CUSTOMER QUERY COVERAGE
72%

This means:

The system has identified 72% of the defined required semantic coverage for Customer context.

It does NOT mean:

The customer is 72% mature.

It does NOT mean:

The answer is 72% correct.

It does NOT mean:

72% of all company data is present.

Coverage should be calculated against configurable required context dimensions.

For CUSTOMER, possible dimensions might include:

- Customer Definition
- Customer Identity
- Customer Segment
- Sold-To
- Bill-To
- Fulfill-To
- Payer
- End User
- Customer Journey Rod
- Active Revenue Relationships
- Products
- Pricing Relationships
- Contracts
- Orders
- Billing Relationships
- Payment Relationships
- Service Relationships
- Renewal Relationships

Each dimension may contain:

required
conditional
optional

Query Coverage should reflect the applicable required and conditional dimensions for the selected context.

Create the calculation:

Covered Required Weight
÷
Applicable Required Weight

Do not use total data point count.

Ten duplicate data points should not produce greater coverage than one governed authoritative definition.

---

# V. DEFINE QUERY CONFIDENCE

Create:

## Query Confidence

Range:

0.00–1.00

Meaning:

How confident is the system that the converged semantic view accurately represents the active query context based on available evidence?

Confidence should consider:

- evidence quality;
- source authority;
- agreement;
- contradiction;
- temporal freshness;
- lineage integrity;
- definition validation status.

Example:

CUSTOMER QUERY CONFIDENCE
0.64

MODERATE CONFIDENCE

Reason:

Customer definitions are complete.

Customer Journey Rod linkage is strong.

However:

2 contradictory Bill-To relationships exist.

1 pricing relationship is based on stale evidence.

Payment ownership is not validated.

Confidence should be calculated separately from coverage.

A query can have:

95% coverage
but
52% confidence.

This means:

Most required areas have data, but the evidence is contradictory or weak.

A query can also have:

45% coverage
and
92% confidence.

This means:

The system knows only part of the context, but what it knows is well-supported.

Preserve this distinction visually.

---

# VI. DEFINE CONVERGENCE STABILITY

Create:

## Convergence Stability

Range:

0.00–1.00

Meaning:

How likely is the current query convergence result to materially change if additional known evidence or currently pending validation is processed?

Stability should consider:

- unresolved contradictions;
- pending evidence;
- incomplete branches;
- rapidly changing source data;
- low-confidence lineage;
- unvalidated definitions.

Example:

QUERY STABILITY
0.38

UNSTABLE

This means:

The current view may materially reorganize as unresolved evidence is processed.

Stability is important for the 3D behavior.

When stability is low:

- elements may subtly pulse;
- paths may remain visually fluid;
- ambiguous elements may orbit within a bounded range;
- conflicting clusters may visually separate.

When stability is high:

- points should visually settle;
- paths should appear more fixed;
- cluster geometry should stabilize.

Do not use random motion merely for visual interest.

Motion should communicate state.

---

# VII. REDESIGN THE DATA ROD MATHEMATICS

Salt Basin Data Rods represent longitudinal journey state.

The three parallel interdependent rods are:

Revenue Lifecycle Data Rod

Customer Journey Data Rod

Member Journey Data Rod

A Data Rod is not a progress bar.

A Data Rod is a temporal and semantic representation of a journey moving through defined states while accumulating metadata, evidence, branches, adjustments, and lineage.

Redesign the rod mathematics accordingly.

Each Rod should expose separate measures:

## 1. Rod Stage Position

The current major stage of the journey.

Represented as:

stage_index + intra_stage_position

Example:

Customer Journey:

Stage 4 = Proposal Negotiation

Value:
4.63

Meaning:

The journey is currently within Proposal Negotiation and has progressed through approximately 63% of the defined stage requirements.

Do not call 4.63 "maturity."

Call it:

ROD POSITION

or:

JOURNEY POSITION

This preserves the existing conceptual use of decimal positions without confusing them with an overall score.

Values greater than the final initial lifecycle stage may represent renewals or repeated cycles only when the lifecycle methodology explicitly defines that behavior.

Do not allow ambiguous numbers such as 12.47 to appear without explaining:

Cycle 2
Stage 4
63% stage position

Prefer user-facing semantic labels over raw decimals.

---

# VIII. DEFINE STAGE COMPLETENESS

Create:

## Stage Completeness

Range:

0%–100%

Meaning:

How much of the applicable required definition, metadata, evidence, and validation for the current stage is present?

Possible calculation:

Applicable Requirement Weight Completed
÷
Total Applicable Requirement Weight

Requirements may include:

- required atoms;
- required molecules;
- required definitions;
- required evidence;
- required validations;
- required relationships.

Example:

PROPOSAL NEGOTIATION
STAGE COMPLETENESS
63%

Breakdown:

Definitions: 80%
Evidence: 52%
Relationships: 74%
Validation: 41%

Stage completeness is not the same as journey maturity.

---

# IX. DEFINE STAGE READINESS

Create:

## Stage Readiness

Range:

0.00–1.00

Meaning:

How prepared is the journey to transition into the next defined stage?

Readiness should consider:

- stage completeness;
- required minimum definitions;
- required evidence;
- critical contradictions;
- dependency state;
- required decisions.

Salt Basin does not use arbitrary hard stops as the primary experience.

When readiness is low, the agent should explain:

"What is preventing this journey from naturally advancing?"

Example:

NEXT STAGE READINESS
0.71

Three items are lowering readiness:

Payment responsibility is undefined.

Commercial approval evidence is missing.

One pricing term conflicts with Contract Version 3.

The interface should allow the user or agent to resolve these items.

Do not merely display a red score.

Explain the missing definition, evidence, relationship, or decision.

---

# X. DEFINE ROD MATURITY

Create a precise definition for:

## Rod Maturity

Range:

0.00–1.00

Meaning:

The quality and depth of the semantic definition, evidence, lineage, validation, and temporal continuity accumulated across the journey represented by the Data Rod.

Rod Maturity does NOT mean:

how far the journey has progressed.

A brand-new customer journey could be at an early stage but have highly mature definition and evidence.

A late-stage revenue journey could have low maturity because the process is poorly defined, evidence is missing, and lineage is fragmented.

Calculate Rod Maturity using transparent dimensions:

Definition Maturity

Evidence Maturity

Lineage Maturity

Validation Maturity

Temporal Maturity

Relationship Maturity

Potential conceptual formula:

Rod Maturity =
Definition Maturity × configurable weight
+
Evidence Maturity × configurable weight
+
Lineage Maturity × configurable weight
+
Validation Maturity × configurable weight
+
Temporal Maturity × configurable weight
+
Relationship Maturity × configurable weight

Example:

ROD MATURITY
0.74

Definition: 0.92
Evidence: 0.67
Lineage: 0.81
Validation: 0.58
Temporal: 0.72
Relationships: 0.76

Display the dimensions.

Do not expose only the composite.

---

# XI. DEFINE JOURNEY DENSITY

Create:

## Journey Density

Density should represent:

The amount of meaningful differentiated state, branch, event, decision, adjustment, and lineage accumulated along a journey relative to its active journey duration or defined journey scope.

Do not use raw data point count.

Repeated copies of the same event should not increase density.

Density may be built from:

- unique state transitions;
- unique branches;
- material decisions;
- material adjustments;
- exceptions;
- merge events;
- linked evidence events;
- validated relationship changes.

Example:

JOURNEY DENSITY
HIGH

23 material contribution points
4 branches
3 adjustments
2 branch merges
11 validated decisions

Density should indicate journey complexity and accumulated semantic history.

High density is not automatically good or bad.

A high-density journey may represent:

- a sophisticated enterprise customer;
- complex pricing;
- repeated changes;
- high exception activity;
- significant negotiation.

Therefore never use a simple green-high / red-low model.

---

# XII. DEFINE ROD COHERENCE

Create:

## Rod Coherence

Range:

0.00–1.00

Meaning:

How consistently do the definitions, states, evidence, relationships, and linked parallel rods agree with one another?

Example:

Revenue Rod says:

Customer is active.

Customer Journey Rod says:

Onboarding incomplete.

Member Rod says:

No licensed users activated.

This may create a coherence issue.

ROD COHERENCE
0.56

Possible mismatch:

Revenue Lifecycle: Active Subscription
Customer Journey: Onboarding
Member Journey: No Active Members

Rod Coherence should identify cross-rod contradictions and timing differences.

Do not assume every mismatch is an error.

Some mismatches may be valid temporal states.

Use temporal rules and configured business logic.

---

# XIII. DEFINE CROSS-ROD ALIGNMENT

Create:

## Cross-Rod Alignment

This should explain the relationship between:

Revenue Lifecycle Rod

Customer Journey Rod

Member Journey Rod

The rods run in parallel but do not need to occupy equivalent numbered stages.

Do not calculate alignment using numeric stage equality.

Instead evaluate required state relationships.

Example:

Revenue:
Contract Signed

Customer:
Onboarding

Member:
Admin Provisioning

This may be perfectly aligned.

Create configured state relationship expectations.

Example:

Revenue State:
Active Subscription

Expected Customer States:
Onboarding
Active Customer

Expected Member States:
Provisioning
Active Member

Cross-Rod Alignment should calculate whether observed states fall within allowed or expected state relationships.

Display:

CROSS-ROD ALIGNMENT
0.88

or:

ALIGNED

with exceptions listed.

---

# XIV. CREATE A CONSISTENT METRIC LANGUAGE

Redesign all user-facing labels.

Use metric categories:

## POSITION

Where is it?

Examples:

Journey Position
Current Stage
Cycle
Branch Position

## COMPLETENESS

How much required context exists?

Examples:

Stage Completeness
Query Coverage
Definition Coverage

## CONFIDENCE

How strongly do we trust it?

Examples:

Query Confidence
Evidence Confidence
Relationship Confidence

## MATURITY

How well-defined and governed is it?

Examples:

Rod Maturity
Definition Maturity
Lineage Maturity

## READINESS

Can it naturally move forward?

Examples:

Next Stage Readiness
Validation Readiness
Transition Readiness

## ALIGNMENT

Do related states make sense together?

Examples:

Cross-Rod Alignment
State Alignment

## COHERENCE

Does the information agree internally?

Examples:

Rod Coherence
Definition Coherence

## DENSITY

How much meaningful complexity or history has accumulated?

Examples:

Journey Density
Branch Density

## RELEVANCE

How related is it to the active query?

Examples:

Query Relevance
Context Relevance

## STABILITY

How likely is the current interpretation to change?

Examples:

Convergence Stability
Definition Stability

Do not interchange these terms.

Create a centralized Metric Definition Registry.

---

# XV. CREATE A METRIC DEFINITION REGISTRY

Every semantic metric must be defined in a central configurable registry.

At minimum:

metric_id
metric_key
display_name
metric_category
definition
business_question_answered
calculation_method
formula_description
input_dimensions
range_min
range_max
unit
higher_is_better
directionality_description
confidence_supported
calculation_version
visual_encoding
allowed_scope_types
drilldown_type
effective_from
effective_to

Example:

metric_key:
QUERY_RELEVANCE

display_name:
Query Relevance

metric_category:
RELEVANCE

definition:
Measures the semantic relationship of an element to the active query context.

business_question_answered:
"How directly does this element help explain the selected context?"

range:
0.00–1.00

higher_is_better:
NULL

directionality_description:
Higher means more directly relevant. It does not mean better performance.

The interface must use this registry.

Do not hardcode metric meanings only in UI component text.

---

# XVI. REDESIGN THE CUSTOMER ORBIT CLICK EXPERIENCE

When a user clicks the Customer Orbit, create the following experience.

## STEP 1 — CONTEXT ACTIVATION

Display:

CUSTOMER CONTEXT ACTIVATED

or:

VIEWING THE SYSTEM THROUGH CUSTOMER CONTEXT

Do not say:

Running convergence algorithm

unless this is placed in technical methodology detail.

## STEP 2 — VISUAL CONVERGENCE

Data elements reorganize.

Closer elements are more relevant to Customer context.

Paths should appear showing why elements relate to Customer.

Elements should not all move into one undifferentiated cluster.

Create semantic bands:

CORE CUSTOMER CONTEXT

STRONGLY RELATED

CONTEXTUALLY RELATED

PERIPHERAL

## STEP 3 — CONTEXT SUMMARY

Display:

CUSTOMER CONTEXT

Query Coverage: 72%
Query Confidence: 0.81
Convergence Stability: 0.68

Related Data Rods:

Customer Journey: Primary
Revenue Lifecycle: Strong
Member Journey: Conditional

## STEP 4 — WHY THESE POINTS MOVED

Allow the user to select any point.

Display:

WHY THIS ELEMENT CONVERGED

Query Relevance: 0.87

Customer Journey Rod +0.25
Direct Customer Relationship +0.31
Revenue Lineage +0.18
Hierarchy Context +0.05
Semantic Relationship +0.08

This element is classified as:

STRONGLY RELATED TO CUSTOMER CONTEXT

## STEP 5 — SHOW BUSINESS MEANING

Display a plain-language explanation.

Example:

"Bill-To Party moved close to Customer because it is directly related to the customer's financial relationship and is linked to both the Customer Journey and Revenue Lifecycle rods. Its relevance is high. However, the relationship currently has moderate confidence because two competing Bill-To definitions exist."

This sentence is more important than the raw score.

---

# XVII. REDESIGN VISUAL ENCODING

Create a visual grammar.

Distance from selected Orbit:
Query Relevance

Cluster grouping:
Semantic relationship or molecule grouping

Crystal geometry:
Atom metadata type

Permanent path color:
Unique global path combination based on atom metadata type + atom cluster rollup + hierarchy rollup

Opacity:
Evidence confidence or query confidence, only where semantically appropriate

Pulse:
Unresolved state or active change

Subtle bounded movement:
Low stability

Fixed position:
High stability

Path thickness:
Relationship or lineage strength

Dashed path:
Inferred relationship

Solid path:
Observed or validated relationship

Branching geometry:
Journey branch

Merge geometry:
Branch reconciliation / Historical Lineage Agent creation

Rod length or stage segmentation:
Journey stages and cycles

Rod fill:
Stage completeness only if explicitly labeled

Rod crystal complexity:
Accumulated maturity or semantic definition depth

Do not use one visual property to represent multiple metrics.

For example:

Do not use size to mean maturity in one view and relevance in another without a clear mode change.

Create a Visual Encoding Registry.

---

# XVIII. CREATE USER-FACING METHODOLOGY EXPLANATIONS

Every metric should have:

WHAT THIS MEANS

HOW IT IS CALCULATED

WHY IT MATTERS

WHAT CHANGES IT

WHAT IT DOES NOT MEAN

Example:

QUERY COVERAGE

What this means:
How much of the required Customer context is represented by defined Salt Basin elements.

How it is calculated:
Applicable required Customer context dimensions with sufficient definition divided by total applicable required dimensions.

Why it matters:
Low coverage means important parts of the Customer context are not represented.

What changes it:
Adding or validating required customer definitions and relationships.

What it does not mean:
It does not measure customer health, customer maturity, or answer accuracy.

Build these explanations from the Metric Definition Registry.

---

# XIX. VALIDATE ALL CURRENT NUMBERS

Audit the existing rendered experience.

Create a table in the implementation documentation:

CURRENT DISPLAY
CURRENT FORMULA
CURRENT PURPOSE
BUSINESS MEANING
KEEP / REMOVE / REPLACE
NEW METRIC
NEW USER LABEL

Example:

0.8423 next to Customer point

Current Formula:
1 - normalizedDistance

Current Purpose:
Rendering

Business Meaning:
None

Decision:
REMOVE FROM USER UI

Replacement:
Query Relevance

New Label:
Query Relevance 0.87

Do this for every currently user-visible mathematical value.

Do not allow unexplained floating-point numbers to remain in the primary UI.

Round values based on their semantic meaning.

Examples:

0.87

87%

Stage 4 · 63% Complete

Cycle 2 · Renewal

23 Material Events

Do not display values such as:

0.873498273

unless a technical debug mode is active.

---

# XX. REQUIRED OUTPUT

Inspect the existing code first.

Then produce and implement:

1. Current Metric Audit.
2. Canonical Metric Taxonomy.
3. Metric Definition Registry.
4. Query Convergence methodology.
5. Query Relevance calculation.
6. Query Coverage calculation.
7. Query Confidence calculation.
8. Convergence Stability calculation.
9. Data Rod Position model.
10. Stage Completeness model.
11. Stage Readiness model.
12. Rod Maturity model.
13. Journey Density model.
14. Rod Coherence model.
15. Cross-Rod Alignment model.
16. Visual Encoding Registry.
17. Redesigned Customer Orbit interaction.
18. Plain-language metric explanations.
19. Metric drill-through capability.
20. Updated 3D visualization behavior.

Do not simply rename existing values.

Determine whether the underlying mathematics actually supports the intended semantic meaning.

Where it does not, redesign the calculation.

Use real existing Salt Basin data where available.

Do not generate fake metric outputs in the production view merely to make the dashboard appear complete.

Synthetic test data may be used only in clearly labeled development fixtures.

The final user experience should allow a person with no knowledge of the code to click Customer and answer:

"What am I looking at?"

"Why did these data points move?"

"What does 0.87 mean?"

"Is 72% good or bad?"

"Is this journey mature or just far along?"

"Why can't the journey move to the next stage?"

"Do my Revenue, Customer, and Member rods actually agree?"

"What information is missing?"

"What evidence is weak?"

"What would change these numbers?"

Every mathematical value must answer a defined business or semantic question.

If a number cannot answer a meaningful question, remove it from the user-facing experience.
