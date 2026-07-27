# CODEX MASTER BUILD PROMPT
## Build and Instrument the Contribution Intelligence Platform

Act as the principal engineer and technical architect responsible for implementing a production-oriented Contribution Intelligence capability inside the existing codebase.

Do not treat this assignment as a dashboard mockup.

Do not produce only documentation.

Do not build a manually maintained time tracker.

Inspect the actual repository, current schemas, available raw session data, environment configuration, existing agents, APIs, authentication model, organization model, and analytics components before choosing the implementation approach.

The system being built is called:

# CONTRIBUTION INTELLIGENCE

Contribution Intelligence reconstructs how humans, AI models, AI agents, and system processes materially contribute to business outcomes.

The first source to instrument is the real session activity available from Claude.

The architecture must also be capable of supporting Codex session and execution data.

The long-term platform must support multi-human, multi-agent collaborative channels and extensions into sales, marketing, operating model analysis, and business unit carve-outs.

Your job is to implement the underlying configurable platform architecture.

---

# CORE PRINCIPLE

Do not equate:

human prompt count
with
human contribution.

Do not equate:

AI token volume
with
AI value.

Do not equate:

elapsed chat duration
with
human labor hours.

Do not report:

"AI did 80% of the work"

based on message size or token count.

Instead reconstruct bounded Contribution Events.

A Contribution Event is a material action that introduces, changes, validates, rejects, selects, transforms, executes, connects, or preserves something relevant to an outcome.

Example sequence:

1. Human introduces a concept.
2. AI structures it.
3. Human identifies a faulty assumption.
4. Human defines a previously missing constraint.
5. AI regenerates a design.
6. Human chooses a direction.
7. AI implements code.
8. Automated tests identify a defect.
9. AI proposes a correction.
10. Human accepts the correction.

This is a contribution lineage.

Implement the system around that lineage.

---

# PHASE 0 — REPOSITORY AND DATA INSPECTION

Before making architectural changes:

Inspect the repository.

Determine:

- application framework
- frontend framework
- backend framework
- database
- ORM
- migration framework
- authentication approach
- user schema
- organization schema
- project schema
- current analytics
- agent architecture
- background processing framework
- job scheduler
- queue infrastructure
- storage infrastructure
- graph capabilities
- vector infrastructure
- testing framework
- deployment structure

Locate all currently available Claude session data.

Identify whether session data currently exists as:

- export files
- JSON
- JSONL
- database records
- API responses
- logs
- local files
- mounted files
- cached application state

Inspect the real shape.

Do not invent a Claude raw-data schema before inspecting available data.

Also inspect available Codex execution/session metadata in the current environment.

Create source adapters based on observed data.

Document source limitations in code comments and architecture documentation.

After inspection, implement the architecture using the existing stack whenever reasonable.

Do not introduce unnecessary infrastructure.

---

# PHASE 1 — CREATE THE CONTRIBUTION INTELLIGENCE DOMAIN

Implement a canonical domain model.

At minimum create domain concepts for:

Contributor
ContributorIdentity
AIModel
AIAgent
SourcePlatform
RawSourceEvent
SourceSession
NormalizedSessionEvent
ContributionEvent
ContributionClassification
ContributionAttribution
ContributionLineageEdge
Concept
Decision
Constraint
EvidenceReference
Artifact
ArtifactVersion
Outcome
WorkPackage
CostLedgerEntry
TraditionalWorkPackage
DifferentiationProfile
DifferentiationNarrative
ProcessingCheckpoint
AttributionReview
ContributionChannel
ChannelParticipant
AgentPolicy

Use the naming conventions of the existing repository.

Do not force these exact physical table names if the existing architecture uses a different domain naming standard.

Preserve the semantic separation.

---

# RAW SOURCE EVENT REQUIREMENTS

The raw event layer is immutable.

At minimum persist:

id
source_platform
source_account_reference
source_session_id
source_event_id
source_event_type
source_timestamp
ingested_timestamp
source_payload
source_payload_hash
source_version
ingestion_run_id

Create a uniqueness or idempotency strategy using the strongest available source identifier.

When no stable source event identifier exists, create a deterministic hash using normalized source characteristics.

Do not duplicate previously ingested raw events.

Do not overwrite source_payload when upstream source data changes.

Create a new source version or raw event revision.

---

# NORMALIZATION LAYER

Create a source adapter interface.

Use the closest pattern appropriate for the existing language.

Conceptually:

interface ContributionSourceAdapter {
  sourcePlatform: SourcePlatform

  discoverSessions(cursor?): Promise<DiscoveredSession[]>

  fetchSession(sessionRef): Promise<RawSessionPayload>

  extractRawEvents(session): Promise<RawSourceEventInput[]>

  getNextCursor(): Promise<SourceCursor | null>
}

Implement:

ClaudeContributionSourceAdapter

Prepare:

CodexContributionSourceAdapter

The Codex adapter may initially support only the real execution/session metadata available in the current environment.

Do not fake unsupported fields.

Create normalized event types such as:

HUMAN_MESSAGE
AI_MESSAGE
AGENT_MESSAGE
TOOL_CALL
TOOL_RESULT
CODE_CHANGE
FILE_CREATE
FILE_UPDATE
COMMAND_EXECUTION
TEST_EXECUTION
ERROR
RETRY
APPROVAL
REJECTION
SESSION_START
SESSION_END
SYSTEM_EVENT

Preserve a pointer to the raw event.

---

# SESSION PROCESSING PIPELINE

Implement an incremental Contribution Intelligence processing pipeline.

Pipeline:

DISCOVER SOURCE SESSION

→ INGEST RAW EVENTS

→ NORMALIZE EVENTS

→ RECONSTRUCT SESSION

→ SEGMENT WORK SEQUENCES

→ IDENTIFY CONTRIBUTION EVENTS

→ CLASSIFY CONTRIBUTIONS

→ RESOLVE CONTRIBUTORS

→ IDENTIFY CONCEPTS, DECISIONS, CONSTRAINTS, AND ARTIFACTS

→ LINK CONTRIBUTION LINEAGE

→ ESTIMATE TIME

→ ASSIGN ACTUAL COST

→ BUILD TRADITIONAL WORK COMPARATOR

→ CALCULATE DIFFERENTIATION PROFILE

→ GENERATE CONTRIBUTION NARRATIVE

→ UPDATE ROLLUPS

→ SAVE PROCESSING CHECKPOINT

Each processor must be capable of being rerun safely.

Implement explicit processing versions.

Example:

contribution_detector_version
contribution_classifier_version
time_model_version
cost_model_version
traditional_comparator_version
differentiation_model_version

Reprocessing using a new methodology version must create updated analytical records without deleting the historical methodology result.

---

# CONTRIBUTION EVENT DETECTION

Implement a ContributionEventDetector.

A Contribution Event should not necessarily equal a message.

One message may contain multiple contribution events.

Multiple messages may form one contribution sequence.

Create detection logic capable of recognizing potential:

CONCEPT_INTRODUCTION
PROBLEM_RECOGNITION
PATTERN_RECOGNITION
DOMAIN_JUDGMENT
STRATEGIC_DIRECTION
CONSTRAINT_DEFINITION
BUSINESS_RULE_DEFINITION
RISK_IDENTIFICATION
PRIORITY_SELECTION
TRADEOFF_DECISION
ACCEPTANCE
REJECTION
CORRECTION
REFRAMING
EXCEPTION_IDENTIFICATION
CROSS_DOMAIN_CONNECTION
NOVEL_SYNTHESIS
PRODUCT_VISION
OPERATING_MODEL_DESIGN
VALIDATION
STRUCTURING
FORMAT_TRANSFORMATION
CLASSIFICATION
SEARCH
RETRIEVAL
SUMMARIZATION
CODE_GENERATION
SCHEMA_GENERATION
DOCUMENT_GENERATION
CONTENT_EXPANSION
PATTERN_ENUMERATION
CONSISTENCY_ANALYSIS
DATA_TRANSFORMATION
CALCULATION
SIMULATION
TEST_GENERATION
EXECUTION
NORMALIZATION

Make the taxonomy configurable.

Do not hardcode classification display values throughout application code.

Use taxonomy records, enums with metadata, or configurable definitions consistent with the repository architecture.

Store:

contribution_event_id
source_session_id
primary_contributor_id
contributor_type
contribution_class
contribution_subclass
semantic_summary
start_event_id
end_event_id
confidence
novelty_score
dependency_score
influence_score
correction_score
human_judgment_score
ai_processing_score
downstream_impact_score
outcome_relevance_score
classification_version

All scores should preserve component or evidence details.

Do not use unexplained black-box scores in the UI.

---

# CONTRIBUTION LINEAGE ENGINE

Implement a ContributionLineageEngine.

Contribution events must support directed relationships.

Initial relationship types:

INTRODUCED_BY
GENERATED_BY
TRANSFORMED_BY
CORRECTED_BY
REJECTED_BY
ACCEPTED_BY
VALIDATED_BY
DEPENDS_ON
DERIVED_FROM
EXPANDED_BY
IMPLEMENTED_BY
EXECUTED_BY
REVIEWED_BY
SUPERSEDED_BY
MERGED_WITH
REUSED_IN
INFLUENCED
CONTRIBUTED_TO
PRODUCED
MODIFIED

Store:

lineage_edge_id
from_entity_type
from_entity_id
relationship_type
to_entity_type
to_entity_id
confidence
evidence_reference
created_timestamp
lineage_model_version

Use the current database architecture.

A dedicated graph database is not required for the first vertical slice unless one already exists.

Create the domain interface so graph storage can later be swapped.

Conceptually:

interface ContributionGraphRepository {
  createNode(...)
  createEdge(...)
  getUpstream(...)
  getDownstream(...)
  traceOrigin(...)
  traceOutcomeContributors(...)
}

The UI must eventually allow:

traceOrigin(conceptId)

traceOutcomeContributors(outcomeId)

traceHumanCorrections(sessionId)

traceRejectedAIPaths(projectId)

traceArtifactLineage(artifactId)

---

# CONTRIBUTOR IDENTITY

Implement ContributorIdentityResolver.

The system must distinguish:

HUMAN
AI_MODEL
AI_AGENT
SYSTEM_PROCESS
EXTERNAL_CONTRIBUTOR
TEAM

Do not assume every human message belongs to the authenticated account forever.

The future architecture must support multiple humans in one collaborative channel.

Use:

contributor_id
identity_type
source_identity
user_id when applicable
organization_id
display_name
role
identity_confidence

Prepare speaker resolution.

A contribution must retain the identity of the contributor that actually created it.

---

# TIME INTELLIGENCE ENGINE

Implement a TimeIntelligenceEngine.

Do not calculate human hours as total session elapsed time.

Create time classifications:

ELAPSED_SESSION_WINDOW
OBSERVED_INTERACTION_TIME
INFERRED_ACTIVE_HUMAN_TIME
AI_PROCESSING_TIME
AGENT_AUTONOMOUS_TIME
TOOL_EXECUTION_TIME
REVIEW_TIME
CORRECTION_TIME
DECISION_TIME
IDLE_TIME
ASYNCHRONOUS_ELAPSED_TIME

For every estimated duration store:

minutes_low
minutes_expected
minutes_high
measurement_type
estimation_method
confidence
supporting_evidence
time_model_version

Measurement types:

OBSERVED
INFERRED
ESTIMATED
ALLOCATED
CALCULATED

Initial inference logic may use:

timestamp gaps
message sequence density
input length
input complexity
revision loops
rapid corrections
long inactive windows
artifact inspection indicators
code execution periods
tool runtime
AI response timing

Implement time logic as a replaceable strategy.

interface TimeEstimationStrategy {
  estimate(sequence: ContributionSequence): TimeEstimate
}

Create an initial evidence-based strategy.

Do not present expected estimates to the user without their low/high range and confidence being available on drill-through.

---

# COST LEDGER

Implement a cost ledger.

Cost categories:

AI_SUBSCRIPTION
AI_API_INPUT
AI_API_OUTPUT
AI_CACHE
AGENT_RUNTIME
TOOL
INFRASTRUCTURE
STORAGE
VECTOR_DATABASE
PLATFORM_ALLOCATION
HUMAN_COMPENSATION
HUMAN_MARKET_RATE
HUMAN_CONSULTING_EQUIVALENT
HUMAN_OPPORTUNITY_COST

Each cost entry should contain:

cost_ledger_entry_id
scope_type
scope_id
cost_category
vendor
model
quantity
unit
unit_cost
total_cost
currency
cost_basis
observed_or_allocated
effective_date
source_reference
calculation_method
cost_model_version

Where actual model or API cost data is available, use it.

Where only a subscription fee exists, implement an explicit allocation method.

Do not quietly convert subscription cost into API-equivalent token spend.

Store both views separately when useful.

---

# TRADITIONAL BUILD COMPARATOR

Implement TraditionalBuildComparator.

The comparator estimates the plausible traditional team effort required to reproduce the observed outcome.

Do not multiply total contribution hours by one generic developer rate.

Create TraditionalWorkPackages.

Potential equivalent roles:

PRODUCT_MANAGER
BUSINESS_ANALYST
STRATEGY_CONSULTANT
ENTERPRISE_ARCHITECT
SOLUTION_ARCHITECT
DATA_ARCHITECT
UX_DESIGNER
SOFTWARE_ENGINEER
QA_ENGINEER
TECHNICAL_WRITER
PROJECT_MANAGER
PROGRAM_MANAGER
FINANCE_ANALYST
SUBJECT_MATTER_EXPERT
EXECUTIVE_SPONSOR

Map contribution classes to candidate traditional roles.

Allow several role candidates.

Create methodology configuration for:

role rates
seniority
expected effort ranges
coordination overhead
meeting overhead
handoff overhead
documentation overhead
rework factor
management factor

TraditionalWorkPackage:

id
outcome_id
contribution_event_ids
equivalent_role
seniority
activity
hours_low
hours_expected
hours_high
rate_low
rate_expected
rate_high
coordination_overhead
meeting_overhead
handoff_overhead
documentation_overhead
rework_factor
management_factor
duration_assumption
cost_low
cost_expected
cost_high
methodology_version

Explicitly model role and handoff compression.

Example actual lineage:

Human concept
→ Claude structure
→ Human correction
→ Claude implementation

Plausible traditional lineage:

Executive or SME
→ Product Manager
→ Business Analyst
→ Architect
→ Developer
→ QA
→ Technical Writer

The comparator should identify the traditional work pattern without claiming that the traditional team definitely would have been configured exactly that way.

Use probability or confidence language.

---

# HUMAN DIFFERENTIATION ENGINE

Implement DifferentiationEngine.

The engine should calculate transparent dimensions.

Human dimensions:

ORIGINAL_CONCEPT_INTRODUCTION
NOVELTY
DOMAIN_CONTEXT
CONSTRAINT_DEFINITION
CORRECTION_INFLUENCE
DIRECTION_CHANGE_INFLUENCE
CROSS_DOMAIN_SYNTHESIS
RISK_RECOGNITION
EXCEPTION_DETECTION
DECISION_AUTHORITY
VALIDATION_AUTHORITY
ACCOUNTABILITY
DOWNSTREAM_DEPENDENCY

AI dimensions:

STRUCTURAL_EXPANSION
CONTENT_PRODUCTION
CODE_GENERATION
SEARCH
RETRIEVAL
PATTERN_ENUMERATION
CONSISTENCY_ANALYSIS
TRANSFORMATION
EXECUTION
TEST_GENERATION
REPETITIVE_PROCESSING

Store component scores.

Every score must expose:

score
confidence
supporting_contribution_event_ids
calculation_method
methodology_version

Create a DifferentiationNarrativeGenerator.

Example output style:

"The primary human contribution in this sequence was architecture direction rather than document production. The contributor introduced the lifecycle-rod structure, rejected the initial object-oriented interpretation, and defined a branch reconciliation requirement. AI activity primarily expanded these decisions into schemas, specifications, and implementation structures. The observed output volume is therefore not an appropriate proxy for intellectual contribution."

Narratives must be evidence-based.

Do not generate praise.

Do not infer brilliance, expertise, or strategic value solely from verbose user inputs.

---

# AUTOMATIC SESSION PROCESSING

The system must automatically discover and process every supported new session.

Use the existing application's scheduler, job framework, queue, hooks, filesystem watchers, sync framework, or background workers where available.

Do not add a new orchestration platform solely for this requirement unless technically necessary.

Implement:

ContributionSessionSyncJob

Responsibilities:

discover sessions
compare source cursors
ingest new raw data
detect updated session source data
enqueue semantic processing
maintain checkpoints
record failures
retry safe failures
avoid duplicate processing

Create processing status:

DISCOVERED
INGESTED
NORMALIZED
RECONSTRUCTED
SEGMENTED
CLASSIFIED
LINEAGE_CONNECTED
TIME_ESTIMATED
COSTED
COMPARED
DIFFERENTIATED
ROLLED_UP
COMPLETE
FAILED

Expose processing errors.

Do not silently skip failed sessions.

The system should process historical sessions via backfill and new sessions incrementally.

Create separate commands or jobs for:

historical backfill

incremental sync

single session reprocessing

methodology version reprocessing

---

# CODEX SELF-INSTRUMENTATION

Instrument this repository's Codex-oriented work where real execution data is available.

Capture, when technically available:

session
task
user instruction
assistant planning event
file reads
file writes
patches
command execution
test execution
errors
retries
tool activity
completion state

Do not expose private hidden chain-of-thought.

Contribution Intelligence does not require private reasoning text.

Use observable execution evidence.

A Codex contribution may be inferred from:

generated patch
schema change
command
test
artifact creation
file transformation
error correction
tool result

The architecture must explicitly distinguish observable execution telemetry from unavailable private reasoning.

---

# SHARED CONTRIBUTION CHANNEL ARCHITECTURE

Implement the domain model required for future multi-user collaborative channels.

A ContributionChannel is a persistent collaboration environment.

It must support:

multiple humans
shared AI
role-specific AI agents
organization agents
system agents

Channel:

channel_id
organization_id
channel_type
project_id
initiative_id
channel_policy_id
memory_policy_id
contribution_policy_id
attribution_policy_id
created_timestamp
last_activity_timestamp

ChannelParticipant:

channel_participant_id
channel_id
contributor_id
participant_type
role
joined_timestamp
left_timestamp
visibility_scope
write_scope

Future chat architecture must support:

Human A: message
AI Agent: message
Human B: message
Human C: message
Sales Agent: message
Finance Agent: message
Human A: decision

Every message and Contribution Event must preserve speaker identity.

Do not merge human contribution into a generic "user" contributor.

Prepare APIs and schemas now even when the first user experience is single-human.

---

# AGENT POLICY MODEL

Create AgentPolicy.

An agent must have explicit:

organization scope
channel scope
source system permissions
user scope
role scope
read permissions
write permissions
allowed transformations
memory retention
exposure rules
action permissions
evidence access

Contribution Intelligence must be capable of storing semantic contribution metadata without requiring centralized storage of all sensitive source content.

EvidenceReference should support:

SOURCE_POINTER
HASH
DOCUMENT_REFERENCE
EVENT_REFERENCE
QUERY_REFERENCE
SEMANTIC_PROJECTION

Do not assume raw evidence is always directly visible to the viewing user.

---

# SALES EXTENSION DOMAIN

Prepare extension interfaces for Sales Contribution Intelligence.

Sales contribution entities may link to:

Lead
Account
Opportunity
BuyingGroup
Meeting
Email
Demo
Proposal
Quote
PricingDecision
Negotiation
Contract
Renewal

Sales contribution classes:

RELATIONSHIP_ORIGINATION
ACCOUNT_INTELLIGENCE
BUYER_IDENTIFICATION
NEED_DISCOVERY
PROBLEM_REFRAMING
SOLUTION_POSITIONING
TECHNICAL_VALIDATION
EXECUTIVE_ALIGNMENT
COMMERCIAL_STRATEGY
PRICING_JUDGMENT
OBJECTION_RESOLUTION
NEGOTIATION
RISK_RESOLUTION
CLOSE_AUTHORITY

Do not implement first-touch or last-touch attribution as the primary model.

Contribution Intelligence should support event lineage.

Create domain extension points instead of hardcoding sales logic into the core ContributionEvent table.

---

# MARKETING EXTENSION DOMAIN

Prepare extension interfaces for Marketing Contribution Intelligence.

Marketing contribution areas:

AUDIENCE_INSIGHT
CAMPAIGN_THESIS
POSITIONING
MESSAGING
CREATIVE_DIRECTION
COPY_GENERATION
DESIGN_GENERATION
CHANNEL_EXECUTION
TARGETING
MEDIA_BUYING
EXPERIMENT_DESIGN
PERFORMANCE_ANALYSIS
OPTIMIZATION_DECISION

Preserve:

idea origin
production
selection
distribution
performance evidence
optimization decision

Do not claim causal contribution from simple correlation.

Store attribution confidence.

---

# BUSINESS UNIT AND CARVE-OUT EXTENSION

Prepare a ContributionDependency domain.

Entities:

BusinessUnit
Capability
Function
Process
Role
Individual
System
Agent
Vendor
SharedService
DataSource
Decision
Control
Deliverable
BusinessOutcome

Create:

ContributionDependency

fields:

id
business_unit_id
outcome_id
required_contribution_class
current_provider_type
current_provider_id
source_organization
transferability
automation_potential
agent_potential
human_judgment_requirement
organizational_authority_requirement
parent_context_dependency
criticality
replacement_complexity
evidence_reference
confidence

This should support future:

TSA analysis
standalone cost
workforce planning
AI automation planning
Day 1 readiness
Day 2 operating model design

Do not build the complete carve-out module during the first vertical slice.

Build clean domain extension points.

---

# REPORTING API

Implement reporting services for:

SESSION
CONTRIBUTOR
AGENT
CHANNEL
ARTIFACT
OUTCOME
PROJECT
INITIATIVE
TEAM
BUSINESS_UNIT
ORGANIZATION

Initial report DTO should expose:

human_minutes_low
human_minutes_expected
human_minutes_high
ai_processing_duration
agent_execution_duration
actual_ai_spend
allocated_platform_spend
estimated_human_cost
observed_combined_cost
traditional_cost_low
traditional_cost_expected
traditional_cost_high
estimated_cost_difference
cost_leverage_ratio
traditional_role_count
role_compression_count
handoff_compression_estimate
contribution_density
human_judgment_density
ai_execution_density
novel_concept_count
material_correction_count
direction_change_count

Also expose:

top_human_contribution_classes
top_ai_contribution_classes
top_contribution_sequences
concept_origins
material_corrections
rejected_ai_paths
top_outcome_dependencies

Every aggregated metric must support drill-through to Contribution Events or calculation detail.

---

# FIRST USER EXPERIENCE

Build an initial Contribution Intelligence dashboard using the application's existing design language.

The first screen should not lead with token counts.

Lead with:

CONTRIBUTION INTELLIGENCE

Observed Human Contribution
AI Execution and Processing
Actual Spend
Estimated Traditional Equivalent Cost
Economic Leverage
Human Differentiation
Contribution Lineage

Create session cards.

Each session should show:

session title or inferred topic
date
processing status
estimated human effort range
AI activity
actual or allocated spend
traditional equivalent cost range
top human contribution classes
top AI contribution classes
contribution confidence

Opening a session should show:

1. Session Overview
2. Contribution Timeline
3. Human Contribution
4. AI Contribution
5. Contribution Lineage
6. Cost Basis
7. Traditional Build Comparison
8. Differentiation Narrative
9. Methodology and Confidence

Create a visual contribution timeline.

Do not use message size as the primary visual weight.

Visual weight should be capable of reflecting contribution significance, confidence, or downstream impact.

---

# TESTING

Create tests for:

raw event idempotency
session deduplication
incremental sync
session reconstruction
multi-event message detection
multi-message sequence detection
contributor resolution
lineage edge creation
reprocessing under a new methodology version
time estimate range integrity
cost ledger calculations
traditional comparator calculations
score component visibility
report rollups
organization isolation
channel participant separation
agent policy enforcement

Create test scenarios including:

Human introduces concept, AI structures it.

AI suggests concept, human accepts it.

AI suggests concept, human rejects it.

Human corrects an AI-generated assumption.

Human introduces constraint after several AI responses.

AI generates code from human architecture.

AI independently fixes a mechanical defect.

Multiple humans contribute separate evidence to one decision.

One human originates an idea and another approves it.

AI output is long but strategically low impact.

Human message is short but materially redirects all downstream work.

The system must not score contribution based on word volume.

---

# FIRST VERTICAL SLICE DEFINITION OF DONE

The implementation is not complete until the repository can:

1. Read real available Claude raw session data.
2. Persist immutable raw events.
3. Avoid duplicate ingestion.
4. Reconstruct a session.
5. Detect bounded Contribution Events.
6. Distinguish human and AI contributors.
7. Classify contribution types.
8. Create contribution lineage.
9. Estimate human active effort as a low/expected/high range.
10. Mark time values as observed, inferred, estimated, allocated, or calculated.
11. Capture actual or explicitly allocated AI cost.
12. Generate a plausible traditional delivery comparator.
13. Calculate transparent human and AI differentiation dimensions.
14. Generate an evidence-based Contribution Differentiation Narrative.
15. Automatically discover and process newly available supported sessions.
16. Reprocess a session under a new methodology version.
17. Display a session-level Contribution Intelligence report.
18. Display a project-level Contribution Intelligence rollup.
19. Preserve architecture for multi-human Contribution Channels.
20. Preserve extension points for sales, marketing, and business unit Contribution Intelligence.

Run the application.

Run migrations.

Run tests.

Fix build errors.

Inspect the rendered implementation.

Do not stop after creating schema files or specifications.

Leave the repository with the working vertical slice implemented to the maximum extent supported by the actual available source data and environment.

Where source telemetry is unavailable, explicitly label the limitation and preserve the adapter interface rather than fabricating data.