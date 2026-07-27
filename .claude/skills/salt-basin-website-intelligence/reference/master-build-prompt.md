# Master Build Prompt — Autonomous Website Intelligence, Public Site Design, and Configuration Engine

Verbatim brief supplied by Betsy 2026-07-12. Thirty roman-numeral sections (I–XXX) plus a framing preamble.
Read only the section(s) relevant to the current phase — see `phases.md` for the section-to-phase mapping —
rather than the whole document, unless the user asks for a full pass.

---

# MASTER BUILD PROMPT — AUTONOMOUS WEBSITE INTELLIGENCE, PUBLIC SITE DESIGN, AND CONFIGURATION ENGINE
## Automated Website Analysis, Content Architecture, Visual System Recommendation, Page Composition, Content Rendering, and Configuration Updates

Act as a principal website platform architect, AI product engineer, digital strategy leader, information architect, UX architect, visual systems designer, content strategist, SEO strategist, semantic data architect, and configurable website builder engineer.

You are building a reusable:

# WEBSITE INTELLIGENCE AND CONFIGURATION ENGINE

The system must be capable of analyzing an existing public website and available organization context, reconstructing what the organization currently communicates, identifying missing or weak public-site content, proposing a complete future-state public website, rendering the proposed experience, and automatically updating the website configuration model.

The system is not a generic AI landing-page generator.

The system is not a template picker.

The system is not a text-rewrite assistant.

The system is not a single prompt that generates HTML.

The system must create a governed intelligence pipeline that transforms:

EXISTING WEBSITE

+

ORGANIZATION CONTEXT

+

BRAND CONFIGURATION

+

AVAILABLE DATA

+

PUBLIC COMMUNICATION OBJECTIVES

into:

WEBSITE ANALYSIS

→ PUBLIC NARRATIVE MODEL

→ INFORMATION ARCHITECTURE

→ PAGE STRATEGY

→ SECTION STRATEGY

→ CONTENT REQUIREMENTS

→ VISUAL RECOMMENDATIONS

→ INFOGRAPHIC RECOMMENDATIONS

→ GENERATED CONTENT

→ PAGE COMPOSITION

→ RENDERED PREVIEW

→ CONFIGURATION UPDATE

→ VALIDATION

The final website must remain configuration-driven.

Do not hardcode the generated website directly into page components.

The engine should create or update the configuration consumed by the existing website rendering platform.

---

# I. INSPECT THE EXISTING WEBSITE PLATFORM FIRST

Before implementing the Website Intelligence Engine, inspect the actual repository and current website configuration architecture.

Identify:

- frontend framework;
- routing architecture;
- page model;
- section model;
- component registry;
- content model;
- theme model;
- brand configuration;
- typography configuration;
- color configuration;
- asset library;
- image handling;
- icon system;
- chart system;
- infographic system;
- CMS integration;
- database;
- storage;
- authentication;
- organization model;
- Member model;
- Member Organization Admin permissions;
- public website configuration;
- personal brand website configuration;
- current template system;
- current page builder;
- responsive behavior;
- SEO metadata;
- structured data;
- current AI or agent services;
- existing configuration schema;
- current rendering constraints.

Run the website.

Inspect the rendered public site.

Do not redesign based only on source files.

Identify which parts of the current website are:

- hardcoded;
- configuration-driven;
- reusable;
- brand-aware;
- page-specific;
- organization-specific;
- Member-specific;
- technically constrained.

Preserve useful architecture.

Refactor only where necessary to support a fully configurable website intelligence workflow.

---

# II. DEFINE THE CORE METHODOLOGY

Call the methodology:

# WEBSITE INTELLIGENCE

Website Intelligence is the systematic analysis, interpretation, design, configuration, rendering, and continuous refinement of a public website based on available organization evidence, public communication objectives, brand rules, audience needs, and website performance context.

Website Intelligence should answer:

Who is this organization?

What does it actually do?

Who is the public site for?

What should a first-time visitor understand within seconds?

What claims are currently being made?

What claims are supported?

What important ideas are buried?

What is missing?

What content is repetitive?

What content is vague?

What content is technically detailed but publicly important?

What information should be text?

What information should be a diagram?

What information should be a metric?

What information should be a chart?

What information should be an infographic?

What information should be an interactive experience?

What should appear on the home page?

What requires a dedicated page?

What should be progressive disclosure?

What is the desired visitor journey?

What action should each audience take?

How should the site be visually structured?

How should the site configuration change?

The engine must produce evidence-based website recommendations.

Do not automatically assume the current site is correct.

Do not automatically replace all existing content.

Preserve strong existing language and proven brand elements.

---

# III. WEBSITE SOURCE ANALYSIS

Create a WebsiteSourceAdapter architecture.

The system should support analysis of:

- public website URLs;
- HTML;
- rendered DOM;
- page metadata;
- navigation;
- internal links;
- page titles;
- headings;
- paragraphs;
- lists;
- images;
- SVGs;
- charts;
- embedded video;
- interactive elements;
- CTA buttons;
- forms;
- footer content;
- schema markup;
- SEO metadata.

Future source adapters may include:

- website sitemap;
- CMS;
- Google Drive;
- documents;
- pitch decks;
- product specifications;
- public filings;
- brand guides;
- sales materials;
- case studies;
- product data;
- approved company knowledge.

Create source types such as:

PUBLIC_WEBSITE
CMS
DOCUMENT
BRAND_GUIDE
PRODUCT_SPEC
SALES_CONTENT
CASE_STUDY
STRUCTURED_DATA
ORGANIZATION_CONFIGURATION
MEMBER_CONFIGURATION

Do not treat all source content as equally authoritative.

Every source must support:

source_id
source_type
source_location
organization_id
source_authority
effective_date
observed_timestamp
content_hash
version
evidence_reference
visibility_classification

The raw source content must remain separate from the generated public site configuration.

---

# IV. AUTOMATIC WEBSITE CRAWL AND PAGE INVENTORY

Create a WebsiteAnalysisAgent.

When given a website origin, it should:

1. identify the primary domain;
2. inspect robots and crawl constraints where applicable;
3. identify sitemap sources where available;
4. discover public internal pages;
5. avoid infinite navigation loops;
6. respect page limits and configured crawl scope;
7. capture page structure;
8. capture meaningful content;
9. capture visual references;
10. classify navigation relationships;
11. identify duplicate or near-duplicate pages;
12. identify inaccessible or failed pages;
13. create a current-state page inventory.

Create:

WebsitePageInventory

At minimum:

- page_id
- source_url
- canonical_url
- page_title
- page_type
- navigation_level
- parent_page_id
- child_page_ids
- heading_structure
- content_blocks
- CTAs
- media_assets
- structured_data
- SEO_metadata
- inferred_audiences
- inferred_page_purpose
- inferred_primary_message
- inferred_secondary_messages
- duplication_score
- content_depth
- content_confidence
- last_observed
- source_hash

The system must create a current-state website map.

---

# V. CURRENT-STATE WEBSITE INTELLIGENCE ANALYSIS

Analyze the current public website.

Create separate analysis dimensions.

## NARRATIVE CLARITY

Can the system determine:

- what the organization is;
- what it does;
- who it serves;
- what problem it addresses;
- how it is differentiated;
- what a visitor should do next?

## INFORMATION ARCHITECTURE

Analyze:

- navigation depth;
- page grouping;
- duplication;
- orphan pages;
- content fragmentation;
- overcrowded pages;
- missing content areas;
- audience mixing.

## CONTENT QUALITY

Analyze:

- specificity;
- clarity;
- unsupported claims;
- vague language;
- generic corporate language;
- repeated concepts;
- overly technical language;
- buried differentiators;
- missing evidence;
- weak CTA language.

Do not classify content as weak simply because it is long.

Determine whether the content communicates useful information.

## VISUAL COMMUNICATION

Analyze:

- text-to-visual balance;
- hierarchy;
- density;
- visual repetition;
- use of images;
- diagrams;
- charts;
- iconography;
- infographics;
- whitespace;
- page rhythm;
- section variation;
- visual storytelling.

## PUBLIC TRUST

Analyze:

- evidence;
- specificity;
- transparency;
- team credibility;
- product clarity;
- case studies;
- metrics;
- methodology explanation;
- privacy;
- legal information;
- contact information.

## AUDIENCE JOURNEYS

Identify likely visitor types and evaluate whether the current site supports them.

Possible examples:

- prospective customer;
- investor;
- partner;
- job candidate;
- media;
- developer;
- business unit leader;
- enterprise executive;
- Member;
- organization administrator.

Do not hardcode these audience types as applicable to every organization.

Infer audiences from evidence and organization configuration.

---

# VI. CREATE A PUBLIC NARRATIVE MODEL

Create:

# PublicNarrativeModel

The model represents the story the public website should communicate.

At minimum support:

- organization_identity
- organization_category
- core_problem
- target_audiences
- audience_priorities
- core_value_proposition
- differentiated_capabilities
- product_or_service_model
- methodology
- operating_model
- evidence
- proof_points
- outcomes
- risks_addressed
- trust_signals
- public_positioning
- desired_actions
- prohibited_claims
- unsupported_claims
- narrative_gaps

Create narrative layers.

## LAYER 1 — IMMEDIATE UNDERSTANDING

What should a new visitor understand in approximately the first interaction?

Examples:

Who are you?

What do you do?

Why should I care?

## LAYER 2 — DIFFERENTIATION

Why is this different?

What is the model?

What has been designed differently?

## LAYER 3 — EVIDENCE

Why should I believe it?

What examples, metrics, processes, demonstrations, or lineage support the claims?

## LAYER 4 — DEPTH

How does the product, platform, methodology, or operating model actually work?

## LAYER 5 — ACTION

What should this visitor do?

The website architecture should progressively reveal these layers.

Do not put all Layer 4 technical detail in the hero.

Do not hide all differentiation behind five navigation clicks.

---

# VII. CREATE AN AUDIENCE INTELLIGENCE MODEL

Create:

AudienceProfile

Fields may include:

- audience_id
- name
- description
- organization_id
- primary_questions
- pain_points
- desired_outcomes
- likely_entry_pages
- evidence_required
- content_depth_preference
- visual_preference
- technical_depth
- CTA_priority
- conversion_goal
- confidence
- evidence

Create inferred Audience Journeys.

Example:

ENTERPRISE EXECUTIVE

Home

→ Platform Overview

→ Operating Intelligence

→ Business Outcome Example

→ Methodology

→ Contact / Schedule Discussion

Example:

TECHNICAL EVALUATOR

Home

→ Platform

→ Architecture

→ Security

→ Data Model

→ Technical Resources

The engine must use audience journeys when recommending site architecture.

Do not generate one universal page journey for all visitors.

---

# VIII. AUTOMATIC INFORMATION ARCHITECTURE GENERATION

Create an InformationArchitectureEngine.

The engine should recommend:

- primary navigation;
- secondary navigation;
- utility navigation;
- footer navigation;
- page hierarchy;
- page grouping;
- standalone pages;
- hub pages;
- progressive detail pages.

Create:

WebsiteArchitectureProposal

At minimum:

- proposal_id
- organization_id
- source_analysis_version
- narrative_model_version
- primary_navigation
- utility_navigation
- pages
- page_relationships
- audience_journey_mappings
- content_migrations
- pages_to_preserve
- pages_to_merge
- pages_to_archive
- pages_to_create
- proposal_reasoning
- confidence
- status

Each proposed page must have a defined purpose.

Do not create pages because traditional websites usually have them.

For each page answer:

Why does this page exist?

Who is it for?

What question does it answer?

What action should follow?

Why does this content require a separate page?

Could this information be better explained visually?

---

# IX. CREATE A PAGE INTELLIGENCE MODEL

For each proposed page create:

PageIntelligenceDefinition

At minimum:

- page_key
- page_name
- page_type
- route
- primary_audience
- secondary_audiences
- page_purpose
- primary_question
- primary_message
- supporting_messages
- evidence_requirements
- visual_story
- desired_emotional_tone
- primary_CTA
- secondary_CTA
- SEO_intent
- page_depth
- recommended_sections
- related_pages
- source_evidence
- confidence

Examples of page types:

HOME
PLATFORM
PRODUCT
SOLUTION
CAPABILITY
METHODOLOGY
USE_CASE
INDUSTRY
ABOUT
TEAM
CASE_STUDY
RESOURCE
CONTACT
CAREERS
INVESTOR
PARTNER
PERSONAL_BRAND
RESUME
CUSTOM

Do not hardcode the layout by page type.

Page type may inform recommendations.

The Page Intelligence Definition determines the actual composition.

---

# X. CREATE A SECTION INTELLIGENCE MODEL

A page should be composed of semantically defined sections.

Create:

SectionIntelligenceDefinition

At minimum:

- section_id
- page_id
- section_order
- section_role
- communication_objective
- primary_message
- supporting_content
- evidence
- visual_recommendation
- rendering_recommendation
- infographic_recommendation
- data_requirements
- CTA
- responsive_priority
- content_density
- transition_from_prior_section
- transition_to_next_section

Section roles may include:

ORIENT
DEFINE_PROBLEM
ESTABLISH_CONTEXT
INTRODUCE_SOLUTION
EXPLAIN_MODEL
COMPARE
SHOW_PROCESS
SHOW_JOURNEY
SHOW_METRIC
SHOW_EVIDENCE
SHOW_OUTCOME
SHOW_CASE_STUDY
SHOW_DIFFERENTIATION
BUILD_TRUST
ADDRESS_RISK
CALL_TO_ACTION

Do not use display component names such as HERO or THREE_COLUMN_GRID as the primary semantic section definition.

The section's communication purpose must exist independently of visual layout.

---

# XI. CREATE A CONTENT RENDERING INTELLIGENCE ENGINE

Create:

ContentRenderingEngine

The engine determines the best way to communicate each section.

Available rendering modes may include:

- editorial text;
- short-form statement;
- metric callout;
- metric dashboard;
- comparison table;
- timeline;
- journey;
- process flow;
- relationship graph;
- orbit;
- Data Rod;
- crystal atom formation;
- hierarchy diagram;
- Sankey-style flow;
- network;
- radial diagram;
- heatmap;
- matrix;
- card collection;
- quote;
- case-study block;
- interactive demonstration;
- 3D scene;
- video;
- image;
- icon sequence;
- layered infographic.

For each content unit ask:

Should this be written?

Should this be visualized?

Should this be interactive?

Should this be summarized first and expanded later?

Does the viewer need comparison?

Does the viewer need sequence?

Does the viewer need hierarchy?

Does the viewer need relationship?

Does the viewer need magnitude?

Does the viewer need temporal change?

Does the viewer need proof?

Create:

RenderingRecommendation

Fields:

- rendering_recommendation_id
- content_unit_id
- primary_rendering_mode
- alternative_rendering_modes
- reasoning
- required_data
- interaction_model
- accessibility_fallback
- mobile_fallback
- confidence

Example:

Content:
Revenue, Customer, and Member journeys operate as parallel interdependent Data Rods.

Bad default:
Four paragraphs.

Recommended:
Interactive three-rod longitudinal diagram.

Reason:
The concept depends on parallel progression, state relationships, and temporal comparison.

Required data:
Rod definitions
Stage definitions
Cross-Rod relationships

Mobile fallback:
Vertically stacked synchronized stage tracks.

The engine should select rendering based on communication structure.

Do not select visuals only because they look modern.

---

# XII. CREATE AN INFOGRAPHIC INTELLIGENCE SYSTEM

Build or extend a configurable Infographic Registry.

Create:

InfographicDefinition

At minimum:

- infographic_type
- communication_pattern
- required_data_shape
- optional_data_shape
- supported_interactions
- responsive_behavior
- accessibility_behavior
- visual_configuration
- brand_configuration
- example_use_cases

Communication patterns should include:

SEQUENCE
COMPARISON
HIERARCHY
RELATIONSHIP
FLOW
MAGNITUDE
COMPOSITION
CHANGE_OVER_TIME
GEOGRAPHY
MATURITY
READINESS
RISK
CONVERGENCE
LINEAGE
CONTRIBUTION

The Website Intelligence Engine should select an infographic based on the communication pattern.

Example:

Three parallel interdependent journeys.

Pattern:
RELATIONSHIP + SEQUENCE + TIME

Recommended infographic:
Synchronized Multi-Rod Journey

Example:

Human versus AI differentiated contribution.

Pattern:
CONTRIBUTION + LINEAGE + COMPOSITION

Recommended:
Contribution Lineage Split View

Example:

Query convergence around Customer.

Pattern:
CONVERGENCE + RELATIONSHIP

Recommended:
Interactive Context Orbit

Do not hardcode the infographic to a specific organization's content.

Infographics must consume configuration and data.

---

# XIII. VISUAL DIRECTION ENGINE

Create a VisualDirectionEngine.

The engine should use:

- Brand Configuration;
- approved colors;
- typography;
- shape language;
- iconography;
- existing visual identity;
- audience;
- content purpose;
- page density;
- desired emotional tone.

Create:

VisualDirectionDefinition

At minimum:

- page_id
- visual_tone
- spatial_density
- typography_scale
- section_rhythm
- imagery_strategy
- illustration_strategy
- infographic_strategy
- icon_strategy
- motion_strategy
- 3D_strategy
- background_strategy
- surface_strategy
- emphasis_strategy

Examples of visual tone:

EXECUTIVE
EDITORIAL
TECHNICAL
IMMERSIVE
PREMIUM
HUMAN
ANALYTICAL
EXPERIMENTAL

Do not invent new organization brand colors when approved brand configuration already exists.

Use the actual configured brand system.

The engine may recommend additional derived visual treatments.

It must distinguish:

APPROVED BRAND VALUE

from

GENERATED VISUAL RECOMMENDATION.

---

# XIV. PAGE COMPOSITION ENGINE

Create:

PageCompositionEngine

The engine translates Page Intelligence and Section Intelligence into website configuration.

Conceptually:

PageIntelligenceDefinition

+

SectionIntelligenceDefinitions

+

RenderingRecommendations

+

VisualDirectionDefinition

→

PageConfiguration

The output should contain:

- route;
- SEO;
- page metadata;
- page theme;
- sections;
- section order;
- component selection;
- content bindings;
- layout configuration;
- responsive configuration;
- animation configuration;
- infographic configuration;
- CTA configuration;
- data binding;
- asset binding.

Do not have the AI directly write JSX for every proposed page.

The AI should create configuration consumed by registered page and section renderers.

Use registered components.

Example:

sectionRole:
EXPLAIN_MODEL

renderingMode:
SYNCHRONIZED_DATA_RODS

componentKey:
DATA_ROD_EXPLAINER

configuration:
{
  rods: [
    "REVENUE_LIFECYCLE",
    "CUSTOMER_JOURNEY",
    "MEMBER_JOURNEY"
  ],
  interactionMode: "SYNC_HOVER",
  showAlignment: true,
  showMaturity: true
}

Do not embed organization-specific content into generic component implementation.

---

# XV. CONTENT GENERATION AND CONTENT LINEAGE

Create:

GeneratedContentUnit

At minimum:

- content_unit_id
- organization_id
- page_id
- section_id
- content_type
- generated_content
- source_evidence_ids
- source_content_ids
- transformation_type
- generation_method
- model
- prompt_version
- confidence
- claim_types
- validation_state
- created_timestamp
- version

Every generated factual or organizational claim must support evidence lineage where evidence exists.

Classify claims:

FACTUAL
POSITIONING
INTERPRETIVE
ASPIRATIONAL
VISION
METHODOLOGY
OPINION

Do not present aspirational language as established fact.

Do not present system architecture concepts as currently deployed functionality unless supported.

Do not fabricate:

- customer counts;
- revenue;
- performance metrics;
- cost savings;
- partnerships;
- case studies;
- user adoption;
- patents;
- certifications.

When evidence is incomplete, use appropriate framing.

Example:

"Designed to support"

instead of:

"Currently supports"

where the capability is conceptual or not yet validated.

The content engine must preserve this distinction.

---

# XVI. PRESERVE HUMAN LANGUAGE AND BRAND VOICE

Do not automatically replace all source wording with generic AI content.

Create a VoicePatternModel.

Analyze approved source content for:

- sentence length;
- directness;
- vocabulary;
- humor;
- formality;
- technical density;
- preferred metaphors;
- first-person versus third-person language;
- strong phrases;
- repeated concepts;
- prohibited generic language.

Preserve strong original wording.

Identify:

SIGNATURE PHRASE

CORE POSITIONING LANGUAGE

EXPLANATORY LANGUAGE

TECHNICAL LANGUAGE

BRAND METAPHOR

Do not rewrite a distinctive phrase merely to make it sound more corporate.

Create a configurable AI-generic-language avoidance model.

Flag language such as:

"revolutionize"

"unlock the power of"

"seamlessly"

"cutting-edge"

"transform your business"

when unsupported or inconsistent with the organization's voice.

Do not globally ban a word.

Evaluate context.

---

# XVII. AUTOMATIC WEBSITE CONFIGURATION UPDATE

Create:

WebsiteConfigurationAgent

The agent must be capable of applying approved Website Intelligence outputs to the site configuration.

Create explicit update scopes:

PREVIEW_ONLY

PROPOSED_CONFIGURATION

DRAFT_SITE

APPROVED_SECTION_UPDATE

APPROVED_PAGE_UPDATE

APPROVED_SITE_UPDATE

Do not silently overwrite the live public site.

The engine may automatically create a proposed or draft configuration.

Production publishing requires the existing site's applicable approval and publication workflow.

The WebsiteConfigurationAgent should:

1. load the current site configuration;
2. load the approved Website Architecture Proposal;
3. identify configuration differences;
4. create required page configuration;
5. create required section configuration;
6. bind generated content;
7. bind existing content to new locations;
8. create visual rendering configuration;
9. configure infographic components;
10. configure data bindings;
11. preserve approved brand settings;
12. preserve protected page settings;
13. validate routes;
14. validate required content;
15. validate component compatibility;
16. save a versioned site configuration;
17. trigger preview rendering;
18. run validation;
19. report changed configuration.

Create:

WebsiteConfigurationChangeSet

At minimum:

- changeset_id
- site_id
- from_configuration_version
- to_configuration_version
- pages_created
- pages_updated
- pages_removed
- pages_archived
- sections_created
- sections_updated
- sections_removed
- content_units_created
- content_units_reused
- visual_config_changes
- data_binding_changes
- SEO_changes
- created_by_agent_id
- created_timestamp
- approval_status

All site configuration changes must be reversible.

---

# XVIII. AUTOMATIC CONTINUOUS WEBSITE ANALYSIS

Create a:

WebsiteIntelligenceSyncAgent

The agent should periodically or event-driven reanalyze supported website context.

Potential triggers:

- website source changed;
- public page changed;
- organization configuration changed;
- brand configuration changed;
- product definition changed;
- new public case study approved;
- new capability approved;
- new site analytics available;
- navigation changed;
- new audience added.

The agent should calculate a source delta.

Do not regenerate the entire website on every change.

Determine:

What changed?

Which narrative claims depend on this?

Which pages depend on this?

Which sections depend on this?

Which visuals depend on this?

Which SEO metadata depends on this?

Create:

WebsiteImpactAnalysis

Example:

Product Definition:
SaltTide changed from "digital payment product" to "StableToken or SmartToken embedded into compatible wallet and bank sponsor architecture."

Affected:

Home Hero Supporting Copy

SaltTide Product Page

Platform Architecture Diagram

FAQ

Investor Narrative

SEO Description

Do not automatically rewrite unrelated pages.

Use content and configuration lineage.

---

# XIX. PAGE AND SECTION DEPENDENCY GRAPH

Create a Website Content Dependency Graph.

Nodes may include:

Source
Claim
Narrative Element
Audience
Page
Section
Content Unit
Visual
Infographic
Metric
CTA
Product
Capability
Methodology

Edges:

SUPPORTED_BY
DERIVED_FROM
COMMUNICATES
TARGETS
RENDERED_BY
USES
LINKS_TO
DEPENDS_ON
VALIDATES
SUPERSEDES

The graph must allow the system to answer:

"Where is this concept used on the website?"

"If this product definition changes, what should be reviewed?"

"Which pages contain unsupported claims?"

"Which sections depend on this visual?"

"Where do we explain the Data Rod methodology?"

"What content is repeated?"

"Which page is the source narrative for this concept?"

Use this graph to drive targeted configuration updates.

---

# XX. WEBSITE PREVIEW AND COMPARISON

Create a Website Intelligence Workspace.

At minimum show:

CURRENT SITE

PROPOSED SITE

CONFIGURATION DIFFERENCE

The system should allow comparison at:

SITE LEVEL

PAGE LEVEL

SECTION LEVEL

CONTENT LEVEL

VISUAL LEVEL

Example:

CURRENT HOMEPAGE

Hero
About
Services
Contact

PROPOSED HOMEPAGE

Orient: Salt Basin identity

Problem: enterprise truth fragmentation

Model: governed semantic operating layer

Visual: three-dimensional semantic world

Methodology: Data Rods, atoms, molecules, Orbits

Evidence: Contribution Intelligence example

Platform pathways

CTA

Show why sections were added, removed, moved, or transformed.

Do not simply show a generated screenshot with no explanation.

---

# XXI. WEBSITE ANALYSIS METRICS

Create clear website intelligence metrics.

Potential metrics:

Narrative Coverage

Audience Coverage

Evidence Coverage

Visual Communication Coverage

Claim Confidence

Page Purpose Clarity

Content Duplication

Navigation Complexity

Content Depth Balance

CTA Coverage

Source Freshness

Do not create an opaque "Website Score."

Each metric must answer a specific question.

Example:

NARRATIVE COVERAGE

What percentage of the defined Public Narrative Model is currently communicated somewhere on the public site?

AUDIENCE COVERAGE

What percentage of defined priority audiences have a viable website journey?

EVIDENCE COVERAGE

What percentage of material factual claims have linked evidence?

VISUAL COMMUNICATION COVERAGE

What percentage of structurally visual concepts are rendered using an appropriate visual or interactive model rather than only prose?

These metrics should support analysis and configuration recommendations.

---

# XXII. PUBLIC SITE DESIGN FOR SALT BASIN

Use the existing Salt Basin concepts and source material when configuring the Salt Basin public website.

Analyze available content for:

Salt Basin Holdings

Salt Basin Highway Operating Systems

Salt Basin Platform

Salt Basin Layer

Data Basin / DataBasin Data Bridge concepts

Salt Basin Data Rods

Revenue Lifecycle Data Rod

Customer Journey Data Rod

Member Journey Data Rod

metadata atoms

metadata molecules

Orbits

Query Context Convergence

Contribution Intelligence

agent-centric security

governed semantic projection

distributed source permissions

SaltTide

Monetary River System

enterprise operating intelligence

business unit carve-out intelligence

sales contribution intelligence

marketing contribution intelligence

Do not put every concept on the homepage.

Create a narrative hierarchy.

Determine:

What must be public now?

What belongs under Platform?

What belongs under Methodology?

What belongs under Research or Concepts?

What is currently a future capability?

What requires careful aspirational framing?

What should remain internal?

The Website Intelligence Engine must explicitly make these classifications.

---

# XXIII. PERSONAL BRAND WEBSITE CONFIGURATION

The same architecture must support Member personal brand websites.

Every Member may configure their own personal brand public site.

The Website Intelligence Engine may analyze:

- approved Member profile;
- resume data;
- career history;
- selected work examples;
- approved public writing;
- personal brand configuration.

Create a PersonalPublicNarrativeModel.

Potential pages:

HOME

EXPERIENCE

WORK

CASE STUDIES

THINKING

RESUME

ABOUT

CONTACT

Do not automatically publish private Member data.

Respect publication and exposure configuration.

Resume outputs may be:

PRIVATE

DOWNLOADABLE

PUBLIC_SITE_VISIBLE

DIRECT_LINK_ONLY

The site must use only content approved for the configured exposure level.

Do not confuse Member Organization Admin access with a separate Member identity.

Organization Admin permissions extend the same Member identity with additional organization-scoped modules and views.

---

# XXIV. ORGANIZATION ADMIN WEBSITE INTELLIGENCE

Organization Admin users should be able to inspect:

- current website analysis;
- proposed information architecture;
- public narrative;
- audience models;
- page recommendations;
- section recommendations;
- generated content;
- visual recommendations;
- proposed configuration;
- changesets;
- approval state.

The Organization Admin should be able to:

APPROVE

REJECT

EDIT

LOCK

PIN EXISTING CONTENT

MARK AS INTERNAL

MARK AS ASPIRATIONAL

MARK AS VERIFIED

An Admin may lock:

Brand Definition

Page

Section

Content Unit

Visual

CTA

Route

A locked element must not be automatically rewritten by the Website Intelligence Engine.

---

# XXV. AGENTIC CHAT EXPERIENCE

Create an agentic Website Intelligence chat interface.

The user should be capable of asking:

"Analyze my current website."

"What is confusing?"

"What is missing?"

"Build the full recommended public site."

"Show me the new navigation."

"Why did you remove this page?"

"Make the website explain Data Rods better."

"Turn this paragraph into a visual."

"Use the 3D world on the homepage."

"Make the homepage more executive."

"Do not change my About page."

"Apply everything except the SaltTide page."

The Website Intelligence Agent should interact with the configuration model.

Example:

User:
"Turn the Data Rod section into an interactive visual."

Agent should:

1. locate the Data Rod section;
2. identify its current rendering;
3. inspect available Data Rod visual components;
4. select an appropriate rendering mode;
5. create required configuration;
6. preserve existing approved content where appropriate;
7. generate a proposed changeset;
8. update preview.

Do not merely return instructions telling the user how to modify the page.

---

# XXVI. AGENT TO AGENT WEBSITE WORKFLOW

Prepare separate bounded agents.

Potential agents:

WEBSITE ANALYSIS AGENT

PUBLIC NARRATIVE AGENT

AUDIENCE INTELLIGENCE AGENT

INFORMATION ARCHITECTURE AGENT

PAGE STRATEGY AGENT

CONTENT AGENT

VISUAL COMMUNICATION AGENT

INFOGRAPHIC AGENT

SEO AGENT

CONFIGURATION AGENT

VALIDATION AGENT

Each agent should operate under scoped responsibilities.

Example workflow:

Website Analysis Agent
→ Current Website Model

Public Narrative Agent
→ Public Narrative Model

Audience Agent
→ Audience Profiles and Journeys

Information Architecture Agent
→ Website Architecture Proposal

Page Strategy Agent
→ Page Intelligence Definitions

Visual Agent
→ Rendering Recommendations

Content Agent
→ Generated Content Units

Configuration Agent
→ Proposed Configuration

Validation Agent
→ Validation Results

Do not create independent agents that silently generate contradictory versions of the organization's narrative.

Use shared governed narrative and evidence models.

---

# XXVII. VALIDATION ENGINE

Create a WebsiteValidationEngine.

Validate:

## CONFIGURATION

- valid component keys;
- valid routes;
- valid section configuration;
- required data binding;
- responsive configuration.

## CONTENT

- unsupported claims;
- duplicated content;
- broken content lineage;
- missing CTAs;
- excessive content repetition.

## BRAND

- approved colors;
- typography;
- visual language;
- icon consistency;
- logo use.

## ACCESSIBILITY

- heading structure;
- keyboard access;
- contrast;
- alternative text;
- reduced motion;
- infographic fallbacks.

## SEO

- title;
- description;
- canonical path;
- structured metadata;
- page hierarchy.

## VISUAL COMMUNICATION

Identify when a communication pattern is poorly rendered.

Example:

A six-stage journey is rendered as six paragraphs.

Validation warning:

SEQUENCE CONTENT DETECTED

Current Rendering:
Editorial Text

Recommended:
Journey or Timeline

Do not automatically change every validation warning.

Create actionable recommendations.

---

# XXVIII. FIRST WORKING VERTICAL SLICE

The first implementation must use one real configured website.

Prefer the current Salt Basin or Member public-site configuration where available.

The vertical slice must:

1. inspect the current repository;
2. locate the website configuration model;
3. crawl or analyze the current public website source;
4. create a current page inventory;
5. create a current website analysis;
6. create a Public Narrative Model;
7. identify priority audiences;
8. generate a proposed information architecture;
9. create Page Intelligence Definitions;
10. create Section Intelligence Definitions;
11. recommend content rendering types;
12. identify at least five concepts better represented visually than as prose;
13. create visual or infographic configuration recommendations;
14. generate evidence-aware page content;
15. create a proposed site configuration;
16. calculate the configuration difference;
17. save a versioned WebsiteConfigurationChangeSet;
18. render the proposed site preview;
19. validate the preview;
20. allow the user to approve configuration updates.

The system must update configuration.

Do not stop at a written website strategy document.

Do not stop at a sitemap.

Do not stop at a generated homepage mockup.

The engine must translate its intelligence into the site's actual configurable rendering architecture.

---

# XXIX. REQUIRED DEMONSTRATION

Create a demonstration using a real page from the current website.

For example:

Existing Platform Page.

Analyze:

- current content;
- page purpose;
- narrative role;
- audience;
- duplicated content;
- buried concepts;
- missing evidence;
- visual communication opportunities.

Then create:

CURRENT PAGE INTELLIGENCE

PROPOSED PAGE INTELLIGENCE

PROPOSED SECTION FLOW

RENDERING RECOMMENDATIONS

PROPOSED CONTENT

CONFIGURATION DIFFERENCE

RENDERED PREVIEW

Example:

CURRENT SECTION

Four paragraphs describing Revenue, Customer, and Member Data Rods.

Website Intelligence determination:

Communication Pattern:
PARALLEL SEQUENCE + RELATIONSHIP + TEMPORAL STATE

Current Rendering:
EDITORIAL TEXT

Recommended Rendering:
INTERACTIVE SYNCHRONIZED DATA RODS

Then automatically update the section configuration to use the registered Data Rod visual component.

The demonstration must show the actual configuration change.

---

# XXX. DEFINITION OF DONE

The implementation is not complete when the AI produces a website analysis.

It is not complete when the AI creates a sitemap.

It is not complete when the AI writes homepage copy.

It is not complete when the AI generates static HTML.

It is complete when:

1. The system can analyze a real website.
2. The current site is reconstructed into a page inventory.
3. A Public Narrative Model is created.
4. Audience Profiles are created.
5. Audience Journeys are created.
6. A future-state information architecture is generated.
7. Every proposed page has a defined purpose.
8. Every proposed section has a communication objective.
9. Content is mapped to source evidence.
10. Unsupported claims are identified.
11. Visual communication opportunities are identified.
12. Infographics are selected based on communication structure.
13. Content rendering recommendations are generated.
14. Brand configuration is preserved.
15. Generated content preserves source voice where appropriate.
16. Page configurations are generated.
17. Section configurations are generated.
18. Registered website components are used.
19. Organization-specific content is not hardcoded into generic components.
20. A WebsiteConfigurationChangeSet is created.
21. Configuration changes are versioned.
22. Configuration changes are reversible.
23. Proposed pages render in preview.
24. Validation runs against the preview.
25. Website source changes can trigger targeted impact analysis.
26. The system can update only affected page configuration.
27. Organization Admin users can review and approve recommendations.
28. Members can use the architecture for personal brand websites.
29. The system preserves publication and exposure permissions.
30. The agentic chat can directly create proposed website configuration changes.

The core operating principle is:

# ANALYZE THE PUBLIC STORY.
# UNDERSTAND THE COMMUNICATION REQUIREMENT.
# CHOOSE THE CORRECT VISUAL LANGUAGE.
# COMPOSE THE WEBSITE.
# UPDATE THE CONFIGURATION.
# RENDER THE RESULT.
# VALIDATE THE EXPERIENCE.

Do not build an AI copywriter.

Do not build an AI website template picker.

Build an autonomous Website Intelligence and Configuration Engine that can reason about what an organization needs to communicate publicly and translate that reasoning into a governed, configurable, rendered website experience.
