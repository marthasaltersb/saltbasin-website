# MASTER BUILD PROMPT — CONTRIBUTION INTELLIGENCE SYSTEM

Verbatim brief supplied by Betsy on 2026-07-12. Read only the section(s) relevant to the current phase (see `phases.md` for the section-to-phase mapping) rather than the whole document, unless the user asks for a full pass.

## Claude-Native Session Intelligence, Human vs. AI Contribution Attribution, Economic Cost Basis, and Multi-Human Agentic Collaboration

You are acting as a principal product architect, enterprise operating model designer, AI systems architect, data architect, financial transformation leader, and forensic contribution analyst.

Your assignment is to design and build a configurable **Contribution Intelligence System**.

This system must use real raw session data, beginning with Claude session data, to reconstruct how human users and AI agents collaboratively create work.

The system is not a time-tracking product.

The system is not an AI usage dashboard.

The system is not a token consumption dashboard.

The system is not a simplistic human-versus-AI productivity calculator.

The system must create an evidence-based model of:

- what work occurred;
- who or what materially contributed;
- what type of contribution was made;
- when the contribution occurred;
- what prior contribution it depended upon;
- what downstream work it changed;
- which contributions created differentiated value;
- which contributions were execution, reasoning, validation, correction, synthesis, or direction;
- the human effort involved;
- the AI effort or computational activity involved;
- the actual economic spend;
- the estimated equivalent cost under a traditional delivery model;
- the economic leverage created by the human-plus-AI operating model;
- and why the remaining human contribution cannot be treated as interchangeable with AI processing time.

The methodology should be called:

# CONTRIBUTION INTELLIGENCE

Contribution Intelligence is the systematic reconstruction, classification, attribution, lineage tracking, and economic valuation of work performed by humans, AI models, agents, and system processes across a shared outcome lifecycle.

The initial implementation should analyze the user's real Claude activity and raw session data.

The architecture must later support:

1. Claude sessions.
2. Codex sessions.
3. Other LLM chats.
4. Agent execution logs.
5. Application activity.
6. Connected business systems.
7. Multi-human shared chats.
8. Multi-agent interactions.
9. Sales teams.
10. Marketing teams.
11. Business unit operating models.
12. Business unit carve-outs.
13. Transformation portfolios.
14. Product development.
15. Consulting delivery.
16. Enterprise operating environments.

---

# I. FOUNDATIONAL CONTRIBUTION MODEL

Create a canonical contribution model that does not begin with elapsed time.

The atomic unit is a:

## Contribution Event

A Contribution Event represents a bounded human, AI, agent, or system action that introduces, transforms, validates, rejects, selects, connects, executes, or preserves something material to an outcome.

Every Contribution Event must have a globally unique immutable identifier.

At minimum capture:

- contribution_event_id
- source_platform
- source_session_id
- source_message_id
- source_event_id
- source_raw_event_reference
- organization_id
- workspace_id
- channel_id
- project_id
- initiative_id
- workstream_id
- outcome_id
- artifact_id
- artifact_version_id
- contributor_type
- contributor_id
- contributor_role
- agent_id
- model_id
- model_version
- session_id
- parent_contribution_event_id
- causal_predecessor_ids
- causal_successor_ids
- created_timestamp
- effective_timestamp
- observed_timestamp
- processing_timestamp
- start_timestamp
- end_timestamp
- estimated_active_duration
- estimated_wait_duration
- contribution_class
- contribution_subclass
- action_type
- reasoning_type
- decision_type
- transformation_type
- evidence_type
- validation_type
- confidence
- novelty_score
- dependency_score
- influence_score
- correction_score
- human_judgment_score
- AI_processing_score
- reuse_score
- downstream_impact_score
- outcome_relevance_score
- economic_value_weight
- raw_input_reference
- raw_output_reference
- normalized_semantic_summary
- evidence_references
- assumptions
- classification_version
- attribution_version

Do not permanently collapse the original raw event into the classified event.

The raw source event is immutable evidence.

The Contribution Event is a governed semantic interpretation of the raw evidence.

All classifications must be reproducible, versioned, and capable of being reprocessed as the Contribution Intelligence methodology matures.

---

# II. CONTRIBUTOR TYPES

At minimum support:

- HUMAN
- AI_MODEL
- AI_AGENT
- SYSTEM_PROCESS
- EXTERNAL_CONTRIBUTOR
- TEAM
- HYBRID_CONTRIBUTION

A Hybrid Contribution must not be used merely because a human sent a prompt and AI returned an answer.

Instead, reconstruct the individual contributions inside the interaction.

Example:

Human:
Introduces a novel enterprise revenue lineage concept.

AI:
Structures the concept into a schema.

Human:
Rejects the schema because it assumes object-based lineage.

Human:
Introduces a rod-based temporal architecture.

AI:
Refactors the schema around the new architecture.

Human:
Defines a new branch-merge rule.

AI:
Implements the rule in code.

These are multiple Contribution Events with distinct contribution classes.

Do not classify the conversation as "50% human / 50% AI."

That loses the intelligence.

Contribution Intelligence should preserve the differentiated roles each contributor played.

---

# III. CONTRIBUTION CLASSIFICATION TAXONOMY

Create a configurable taxonomy.

Initial top-level contribution classes should include:

## HUMAN-ORIENTED INTELLIGENCE CONTRIBUTIONS

- ORIGINAL CONCEPT INTRODUCTION
- PROBLEM RECOGNITION
- PATTERN RECOGNITION
- DOMAIN JUDGMENT
- STRATEGIC DIRECTION
- CONSTRAINT DEFINITION
- BUSINESS RULE DEFINITION
- RISK IDENTIFICATION
- ETHICAL JUDGMENT
- PRIORITY SELECTION
- TRADEOFF DECISION
- ACCEPTANCE DECISION
- REJECTION DECISION
- CORRECTION
- REFRAMING
- EXCEPTION IDENTIFICATION
- CONTEXTUALIZATION
- TACIT KNOWLEDGE
- CROSS-DOMAIN CONNECTION
- NOVEL SYNTHESIS
- PRODUCT VISION
- OPERATING MODEL DESIGN
- ECONOMIC JUDGMENT
- ACCOUNTABILITY OWNERSHIP
- VALIDATION
- EVIDENCE INTERPRETATION

## AI-ORIENTED CONTRIBUTIONS

- STRUCTURING
- FORMAT TRANSFORMATION
- CLASSIFICATION
- LARGE-SCALE COMPARISON
- SEARCH
- RETRIEVAL
- SUMMARIZATION
- CODE GENERATION
- SCHEMA GENERATION
- DOCUMENT GENERATION
- CONTENT EXPANSION
- PATTERN ENUMERATION
- CONSISTENCY ANALYSIS
- DATA TRANSFORMATION
- CALCULATION
- SIMULATION
- TEST GENERATION
- EXECUTION
- REPETITIVE PROCESSING
- NORMALIZATION
- VARIANT GENERATION

## SHARED OR CONTEXT-DEPENDENT CONTRIBUTIONS

- REASONING
- SYNTHESIS
- DESIGN
- ANALYSIS
- HYPOTHESIS CREATION
- ROOT CAUSE ANALYSIS
- ARCHITECTURE
- VALIDATION
- PROBLEM SOLVING
- INNOVATION

For shared classes, determine the differentiated human and AI contributions using the raw lineage.

Example:

AI proposes an architecture from known patterns.

Human identifies why the architecture fails in the specific operating environment.

Human provides a previously unstated constraint.

AI generates a revised architecture.

The architectural outcome may be hybrid.

However:

- architecture pattern retrieval may be AI;
- environment-specific exception recognition may be human;
- constraint creation may be human;
- architecture recomposition may be AI;
- acceptance may be human.

Preserve this distinction.

---

# IV. DIFFERENTIATED CONTRIBUTION JUSTIFICATION

The system must automatically create a plain-language justification for material contribution classifications.

Create a:

## Contribution Differentiation Narrative

For each material contribution or grouped contribution sequence, explain:

1. What the human contributed.
2. What the AI contributed.
3. What depended on prior work.
4. What was novel.
5. What was transformed rather than originated.
6. What required contextual judgment.
7. What could reasonably have been automated.
8. What required human accountability.
9. What materially changed the direction or output.
10. Why the attributed human effort is economically different from AI processing activity.

Example:

"AI generated approximately 3,400 words of structured technical specification content during this sequence. However, the principal differentiated contribution was not text production. The human contributor introduced the three-rod lifecycle architecture, rejected an object-centric interpretation, defined the branch-and-merge behavior, and established the temporal lineage requirement. Claude's primary contribution was structural expansion, schema translation, consistency analysis, and documentation. Under a traditional delivery model, the equivalent work would likely require separate strategy, business architecture, technical architecture, and documentation activities. The human contribution is therefore classified primarily as original concept introduction, domain judgment, architecture direction, correction, and acceptance authority rather than document-production labor."

These narratives must be evidence-based.

Do not flatter users.

Do not automatically label user inputs as strategic or innovative.

Contribution classifications must be defensible from observed behavior.

---

# V. SESSION RECONSTRUCTION

Automatically ingest every available Claude session.

Create an ingestion and session reconstruction architecture.

For every session capture:

- session identifier
- start timestamp
- end timestamp
- total elapsed session window
- likely active human periods
- likely inactive periods
- AI response periods
- tool execution periods
- retry periods
- correction loops
- message count
- user input count
- assistant output count
- tool call count
- token usage when available
- model usage
- estimated compute spend
- API spend when available
- subscription allocation methodology when direct spend is unavailable
- artifacts created
- artifacts modified
- topics
- projects
- outcomes
- contribution events
- decisions
- rejected ideas
- accepted ideas
- unresolved items
- repeated concepts
- newly introduced concepts
- inherited concepts

Raw session data must remain attached to the reconstructed semantic session.

Implement session-level processing automatically.

A newly observed session should be:

INGESTED
→ NORMALIZED
→ SEGMENTED
→ CONTRIBUTION EVENTS IDENTIFIED
→ CONTRIBUTORS ATTRIBUTED
→ LINEAGE CONNECTED
→ TIME ESTIMATED
→ COST ASSIGNED
→ CONTRIBUTIONS SCORED
→ DIFFERENTIATION NARRATIVE GENERATED
→ OUTCOMES LINKED
→ REPORTING UPDATED

The architecture must support incremental processing.

Do not require a complete historical reprocessing of all sessions every time a new session appears.

---

# VI. AUTOMATIC SESSION TRACKING

Design the system so session tracking does not depend upon a user manually remembering to classify work.

Create a Session Intelligence Agent.

The Session Intelligence Agent should:

1. Detect new supported session data.
2. Detect updated session data.
3. Import the immutable raw session.
4. Hash or otherwise identify the source data version.
5. Compare it to prior ingested state.
6. Process only newly observed or materially changed content.
7. Detect contribution events.
8. Link events to existing work.
9. identify new work when no existing work matches.
10. create provisional attribution.
11. create confidence scores.
12. flag genuinely ambiguous attribution for review.
13. update time models.
14. update spend.
15. update traditional cost comparisons.
16. update contribution narratives.
17. update organization and project rollups.

Create processing checkpoints and idempotency controls.

The same raw session event must not create duplicate Contribution Events.

---

# VII. TIME INTELLIGENCE

Time must be modeled carefully.

Do not assume:

number of messages × arbitrary minutes = human hours.

Create separate concepts:

- elapsed session window
- observed interaction time
- inferred active human time
- AI processing time
- agent autonomous execution time
- tool execution time
- review time
- correction time
- decision time
- idle time
- asynchronous elapsed time

Human time should be estimated using evidence such as:

- timestamp spacing
- input size
- revision behavior
- rapid message sequences
- extended gaps
- prompt complexity
- document inspection requirements
- correction loops
- cross-session continuity
- observed external artifact work
- direct user-entered time evidence when available

Store:

- estimated_minutes_low
- estimated_minutes_expected
- estimated_minutes_high
- estimation_method
- estimation_confidence
- supporting_evidence

Never present inferred hours as precise observed facts.

Reports must clearly distinguish:

OBSERVED
INFERRED
ESTIMATED
ALLOCATED
CALCULATED

Create a confidence-aware time model.

---

# VIII. ACTUAL SPEND MODEL

Create a Cost Ledger.

Track:

## AI COST

- subscription costs
- API costs
- token input cost
- token output cost
- cached token cost
- tool cost
- infrastructure cost
- storage cost
- vector database cost
- agent runtime cost
- model-specific cost
- allocated platform cost

## HUMAN COST

Allow multiple views:

- actual compensation basis
- salary-loaded basis
- contractor equivalent basis
- role market rate
- consulting rate
- opportunity-cost rate
- user-defined cost basis

Human cost should be:

estimated human effort × selected human rate basis

Do not assume that the user's hourly economic value is the same for every contribution type.

Support contribution-class-based rate assumptions.

Example:

- repetitive formatting
- business analysis
- technical architecture
- executive strategy
- product vision
- forensic review

may have different traditional equivalent rates.

Preserve the selected methodology.

---

# IX. TRADITIONAL BUILD COST BASIS

Create a Traditional Build Comparator.

The comparator should estimate how the observed outcome would traditionally be created without the observed AI-enabled operating model.

Do not simply calculate:

human AI hours × developer hourly rate.

Reconstruct a plausible traditional delivery model.

Potential roles may include:

- Product Manager
- Business Analyst
- Strategy Consultant
- Enterprise Architect
- Solution Architect
- Data Architect
- UX Designer
- Software Engineer
- QA Engineer
- Technical Writer
- Project Manager
- Program Manager
- Finance Analyst
- Subject Matter Expert
- Executive Sponsor

Map Contribution Events to traditional role equivalents.

Create:

## Traditional Work Package

Fields should include:

- traditional_work_package_id
- outcome_id
- contribution_event_ids
- equivalent_role
- seniority
- activity
- estimated_hours_low
- estimated_hours_expected
- estimated_hours_high
- market_rate_low
- market_rate_expected
- market_rate_high
- coordination_overhead
- meeting_overhead
- handoff_overhead
- documentation_overhead
- rework_factor
- management_factor
- elapsed_duration_assumption
- cost_low
- cost_expected
- cost_high
- estimation_source
- methodology_version

Explicitly model traditional handoff cost.

One reason human-plus-AI work may operate differently is that one human can retain contextual continuity while AI performs several role-like execution activities.

The traditional comparator should identify when traditional execution would likely involve multiple people or functions.

Example:

Human concept definition
→ Business Analyst interpretation
→ Product Manager refinement
→ Architect translation
→ Engineer implementation
→ QA validation
→ Technical Writer documentation

Contribution Intelligence should compare this with the actual observed contribution lineage.

---

# X. ECONOMIC LEVERAGE METRICS

At minimum calculate:

- actual human hours
- inferred human hours
- AI processing hours
- autonomous agent hours
- actual AI spend
- allocated platform spend
- estimated human cost
- combined observed cost
- traditional build cost low
- traditional build cost expected
- traditional build cost high
- estimated cost avoided
- cost leverage ratio
- human economic leverage
- AI economic leverage
- output acceleration ratio
- traditional role compression count
- handoff compression estimate
- context continuity benefit
- rework reduction estimate
- decision density
- contribution density
- correction density
- novel concept density
- human judgment density
- AI execution density

Do not use "AI saved X hours" unless the methodology can support the statement.

Prefer:

"Estimated equivalent traditional effort"

and:

"Observed human-plus-AI effort"

The comparison methodology must remain visible.

---

# XI. HUMAN CONTRIBUTION DIFFERENTIATION MODEL

Create a Human Differentiation Index.

The index should not measure how much the human typed.

It should evaluate patterns such as:

- original concept introduction
- novelty
- non-obvious constraint introduction
- correction of AI assumptions
- cross-domain pattern recognition
- decision authority
- acceptance responsibility
- business context
- operating context
- risk recognition
- exception detection
- ethical judgment
- stakeholder knowledge
- temporal continuity
- memory across projects
- synthesis of unrelated evidence
- prioritization
- direction changes initiated
- downstream dependency

Create component scores.

Do not create a single opaque score without component transparency.

Potential output:

Human Differentiation Profile

Original Concept Introduction: 0.92
Domain Context: 0.88
Constraint Definition: 0.95
Direction Change Influence: 0.84
Validation Authority: 0.91
Cross-Domain Synthesis: 0.89
Execution Activity: 0.31

AI Contribution Profile

Structural Expansion: 0.96
Documentation: 0.94
Code Generation: 0.87
Pattern Enumeration: 0.90
Consistency Checking: 0.82
Original Domain Context: 0.18
Acceptance Authority: 0.00

Scores must be explained with evidence.

---

# XII. CONTRIBUTION LINEAGE GRAPH

Build a contribution lineage graph.

Nodes may include:

- Raw Event
- Contribution Event
- Contributor
- Session
- Decision
- Concept
- Requirement
- Constraint
- Evidence
- Artifact
- Artifact Version
- Work Package
- Outcome
- Project
- Initiative
- Organization

Edges may include:

- INTRODUCED_BY
- GENERATED_BY
- TRANSFORMED_BY
- CORRECTED_BY
- REJECTED_BY
- ACCEPTED_BY
- VALIDATED_BY
- DEPENDS_ON
- DERIVED_FROM
- EXPANDED_BY
- IMPLEMENTED_BY
- EXECUTED_BY
- REVIEWED_BY
- SUPERSEDED_BY
- MERGED_WITH
- REUSED_IN
- INFLUENCED
- CONTRIBUTED_TO
- PRODUCED
- MODIFIED
- CREATED_OUTCOME

The lineage graph must allow a user to ask:

"Where did this concept originate?"

"Did I introduce this or did Claude introduce it?"

"Which AI-generated ideas did I reject?"

"Which human corrections materially changed the architecture?"

"How many hours did I spend creating the conceptual model versus reviewing AI output?"

"What did Claude actually do?"

"What work would traditionally require separate functional roles?"

"Which outputs primarily represent human intellectual contribution?"

"Which outputs primarily represent AI production activity?"

"How much did this outcome actually cost?"

---

# XIII. MULTI-HUMAN CONTRIBUTION INTELLIGENCE

Design the architecture now for multiple humans participating in the same channel.

Do not assume one chat equals one human and one AI.

A future Contribution Intelligence Channel must support:

Human A
Human B
Human C
AI Agent A
AI Agent B
System Agent
External Domain Agent

all participating in the same active collaboration context.

Every message, action, tool event, decision, artifact change, and contribution event must preserve contributor identity.

Create:

## Shared Contribution Channel

Fields:

- channel_id
- organization_id
- channel_type
- project_id
- initiative_id
- participants
- active_agents
- channel_policy
- data_access_policy
- contribution_policy
- attribution_policy
- memory_policy
- retention_policy
- created_timestamp
- last_activity_timestamp

A channel is a persistent collaborative context.

Multiple users must be capable of communicating with:

- each other;
- a shared AI;
- individually scoped agents;
- role-specific agents;
- organization agents.

The AI must recognize different speakers.

Never merge human contributions merely because they occurred in the same conversation.

Track:

- concept originator
- concept challenger
- supporting evidence contributor
- modifier
- decision maker
- approver
- executor
- validator

Example:

Sales Director introduces pricing concern.

Finance Lead provides margin evidence.

Product Manager identifies configuration dependency.

AI Agent maps the relationship.

VP Sales makes the commercial decision.

Engineer implements the change.

Contribution Intelligence must preserve each differentiated contribution.

---

# XIV. AGENT-CENTRIC SECURITY

The Contribution Intelligence architecture must support an agent-centric security model.

Every agent must have:

- agent_id
- organization scope
- channel scope
- permitted source systems
- permitted users
- permitted roles
- allowed transforms
- memory rules
- retention rules
- exposure rules
- action permissions
- write permissions
- evidence access
- contribution visibility policy

A shared channel does not mean every participant can see every underlying raw event.

Contribution Intelligence may operate as a governed semantic projection across distributed systems.

Sensitive data may remain in the native source.

The Contribution Intelligence layer may store:

- normalized contribution classification;
- evidence reference;
- authorized semantic output;
- lineage metadata.

Do not require all source content to be centralized.

---

# XV. SALES CONTRIBUTION INTELLIGENCE

Extend the methodology to a sales team.

Track contributions across:

- Lead
- Account
- Opportunity
- Buying Group
- Meeting
- Email
- Demo
- Proposal
- Quote
- Pricing Decision
- Negotiation
- Contract
- Closed Won
- Closed Lost
- Expansion
- Renewal

Do not use simplistic "last touch" or "first touch" attribution.

Contribution Intelligence should reconstruct:

- who introduced the opportunity;
- who created access;
- who identified the problem;
- who built trust;
- who introduced critical evidence;
- who shaped solution fit;
- who resolved a blocker;
- who approved pricing;
- who negotiated terms;
- which AI agent performed research;
- which AI agent created outreach;
- which human personalized it;
- which content influenced engagement;
- who materially changed close probability.

Create Sales Contribution Events.

Potential classes:

- RELATIONSHIP ORIGINATION
- ACCOUNT INTELLIGENCE
- BUYER IDENTIFICATION
- NEED DISCOVERY
- PROBLEM REFRAMING
- SOLUTION POSITIONING
- TECHNICAL VALIDATION
- EXECUTIVE ALIGNMENT
- COMMERCIAL STRATEGY
- PRICING JUDGMENT
- OBJECTION RESOLUTION
- NEGOTIATION
- RISK RESOLUTION
- CLOSE AUTHORITY

Compare:

Sales Compensation Attribution

versus

Observed Contribution Intelligence.

Do not automatically recommend compensation changes.

Surface contribution evidence.

---

# XVI. MARKETING CONTRIBUTION INTELLIGENCE

Extend the methodology to marketing.

Track:

- original idea
- audience insight
- campaign thesis
- positioning
- messaging
- creative direction
- copy generation
- design generation
- channel execution
- campaign configuration
- targeting
- media buying
- experiment design
- performance analysis
- optimization decision

Separate:

Idea origin
from
Content production
from
Distribution
from
Performance optimization.

Example:

Human identifies a non-obvious customer anxiety.

AI generates 40 headline variants.

Human selects three based on brand knowledge.

AI produces campaign variants.

Performance data identifies one winning message.

Marketing lead reframes the campaign around the insight.

Contribution Intelligence must preserve the lineage.

Connect contributions to:

- campaign
- spend
- impressions
- engagement
- conversion
- pipeline
- revenue

Do not confuse outcome correlation with causal contribution.

Store confidence and attribution methodology.

---

# XVII. BUSINESS UNIT AND CARVE-OUT CONTRIBUTION INTELLIGENCE

Extend the methodology to business unit operating models and carve-outs.

The system should reconstruct what people, systems, processes, agents, and shared services materially contribute to the business unit.

Capture:

- function
- capability
- process
- role
- individual
- system
- agent
- vendor
- shared service
- data source
- decision
- control
- deliverable
- business outcome

For a carve-out, identify:

- contributions currently provided by ParentCo
- contributions embedded in shared systems
- critical tacit human knowledge
- decision dependencies
- data dependencies
- process dependencies
- agent dependencies
- external vendor dependencies
- undocumented work
- coordination work
- duplicated work
- manual control work

Create a:

## Contribution Dependency Map

and a:

## Standalone Contribution Requirement

For every required business outcome ask:

"What differentiated contributions are currently necessary to create this outcome?"

"Who or what currently provides them?"

"Can the contribution transfer?"

"Can it be automated?"

"Can an agent perform it?"

"Does it require human judgment?"

"Does it require organizational authority?"

"Does it rely on ParentCo context?"

"What evidence supports the classification?"

This should support TSA analysis, standalone cost development, operating model design, workforce planning, AI automation planning, and Day 1 / Day 2 carve-out readiness.

---

# XVIII. REPORTING

Create configurable dashboards at:

- Session
- Contributor
- Agent
- Channel
- Artifact
- Outcome
- Project
- Initiative
- Team
- Function
- Business Unit
- Organization

Initial executive reporting should include:

## CONTRIBUTION SUMMARY

Human Contribution Hours
AI Processing Activity
Autonomous Agent Activity
Observed Spend
Estimated Human Cost
Traditional Equivalent Cost
Cost Leverage
Role Compression
Contribution Density

## HUMAN DIFFERENTIATION

Top Human Contribution Classes
Original Concepts Introduced
Material Corrections
Direction Changes
Constraints Introduced
Validation Decisions
Cross-Domain Connections

## AI CONTRIBUTION

Content Generated
Code Generated
Structuring Activity
Analysis Activity
Pattern Enumeration
Execution Activity
Autonomous Tasks

## CONTRIBUTION LINEAGE

Top Outcome Dependencies
Concept Origins
Material Human-to-AI Handoffs
AI-to-Human Validation Loops
Correction Loops
Rejected AI Paths

## ECONOMIC COMPARISON

Observed Model
Traditional Model
Expected Cost Difference
Expected Time Difference
Coordination Overhead Difference
Handoff Difference

Every number must allow drill-through to methodology and supporting Contribution Events.

---

# XIX. REQUIRED IMPLEMENTATION ARCHITECTURE

Create a configurable codebase.

Separate:

1. Raw Source Connectors
2. Immutable Raw Event Store
3. Normalization Layer
4. Session Reconstruction Engine
5. Contribution Event Detector
6. Contribution Classifier
7. Contributor Identity Resolver
8. Contribution Lineage Engine
9. Time Intelligence Engine
10. Cost Ledger
11. Traditional Build Comparator
12. Differentiation Engine
13. Narrative Generator
14. Confidence Engine
15. Review Queue
16. Reporting API
17. Dashboard
18. Channel Collaboration Layer
19. Agent Policy Layer

Use adapters.

Create interfaces such as:

fetchRawEvents(source, cursor)

normalizeRawEvent(rawEvent)

reconstructSession(events)

detectContributionEvents(session)

classifyContribution(event, context)

resolveContributor(event)

connectContributionLineage(event)

estimateContributionTime(event)

assignObservedCost(event)

buildTraditionalComparator(outcome)

scoreDifferentiation(contributionSequence)

generateDifferentiationNarrative(contributionSequence)

updateContributionRollups(scope)

Do not tightly couple the architecture to Claude.

Claude is the first source adapter.

---

# XX. DATA QUALITY AND GOVERNANCE

Every material estimate must have:

- method
- version
- confidence
- evidence
- timestamp
- created_by
- updated_by

Support:

- provisional classification
- human-reviewed classification
- agent-reviewed classification
- approved classification
- disputed classification
- superseded classification

Never silently rewrite historical attribution.

Create a new attribution version.

Preserve prior versions.

---

# XXI. DEVELOPMENT REQUIREMENT

First inspect the existing repository and environment.

Identify:

- current stack
- existing schemas
- existing session data
- Claude data format
- authentication
- organization model
- user model
- project model
- existing analytics components
- existing agent framework
- existing cost tracking

Then create an implementation plan based on the actual codebase.

Do not rebuild existing functionality unnecessarily.

Prefer additive, configurable architecture.

The first working vertical slice must:

1. ingest real Claude session raw data;
2. preserve the raw events;
3. reconstruct sessions;
4. identify human and AI contribution events;
5. estimate human activity time using a range and confidence model;
6. calculate actual or allocated AI spend;
7. create an initial traditional build cost comparison;
8. generate differentiated human-versus-AI contribution narratives;
9. link contributions into a lineage graph;
10. automatically process newly observed sessions;
11. expose a session-level Contribution Intelligence report;
12. expose a project-level rollup.

Do not use fake contribution metrics where real session evidence exists.

Synthetic data may be used only for clearly labeled development and test scenarios.

Build Contribution Intelligence as a reusable methodology and platform capability rather than a personal productivity dashboard.
