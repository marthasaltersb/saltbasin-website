# Salt Basin Net Works — Foundation Source of Truth

> **Relationship to the Betsy doc:** this file is the canonical **platform/product** architecture — the computational data model every Salt Basin build must conform to (Basin, Port, Riverbed, Channel, Channel Rod, Tributary, Current, Current Arc, Atom, Molecule, Agent Boundary, etc.). Betsy-specific facts (identity, enterprise/legal hierarchy, brand/IP, products, professional background, working preferences) moved to `docs/betsy-foundation-source-of-truth.md` on 2026-07-27 — the two were always conceptually separate and are now separate files so each can be updated independently. Section numbering below is unchanged (starts at 11) because several other docs and skills already cross-reference "§11" by that number; renumbering would have silently broken those pointers.

*Last restructured: 2026-07-27. Architecture content otherwise last updated per the dates noted inline below.*

---

## 11. CANONICAL SALT BASIN COMPUTATIONAL ARCHITECTURE

### Governing chain

**Basin → Ports → Source Observations / Evidence Currents → Elements → Evidence Atoms → Semantic Affinity Fields → Atom Clusters → Semantic Compositions / Molecules → Projection-relative Settlement → Riverbeds → Channels → Channel Rods → Channel Tributaries → Currents → Current Arcs → Confluences → Query Channels / Compressed Query Rods → Accounting Projection → Reciprocal Economic-Accounting State Inference → Heterosemantic Divergence → Policy-bounded Agents / Channel Rod Staff**

These are computational objects with versioned definitions, temporal behavior, security behavior, lineage, visual semantics, and Agent-access rules. They are not decorative metaphors.

### Foundational object definitions

- **Basin:** governed customer or enterprise semantic environment.
- **Port:** governed interface to a source system or external environment.
- **Element:** configurable stable semantic category such as Customer Identity, Contract, Pricing, Revenue, Usage, Ownership, Covenant, Cost, Goal, or Variance.
- **Evidence Atom:** smallest independently governed semantic assertion. An Atom is not merely a database field and may be sourced, calculated, defined, inferred, or validated from multiple observations.
- **Semantic Affinity Field:** contextual rule system that governs Atom attraction, repulsion, relevance, and admissibility — the real bonding-rule mechanism (tag-based attraction/overlap, computed dynamically), not a static pre-declared list. Implemented server-side in `server/lib/eidosBonding.js`, ported from the working client-side prototype `src/lib/journeyEngine/bonding.js`.
- **Atom Cluster:** temporary high-affinity grouping, computed on demand from a Semantic Affinity Field's rules against current Atoms. A Cluster is not yet a governed business state and is never persisted as a static, pre-declared definition — persisting a fixed list of member Atoms per Cluster (as an earlier session mistakenly did for Career Molecules, 2026-07-16, corrected 2026-07-27) collapses the Cluster/Molecule distinction this law depends on.
- **Semantic Composition / Molecule:** governed composition of Atom roles that defines meaningful semantic state. Historical molecule data is never overwritten — a Molecule evolves and matures in place (same identity, updated state) rather than being duplicated on recomputation; its evolution is reconstructable from the event log (`journey_rod_events`), not a separately overwritten snapshot table.
- **Settlement:** projection-relative contribution state. Settled, suspended, resuspended, zero-gravity, and orbital states are derived and reconstructable.
- **Riverbed:** the client scope that owns Channels and Tributaries — a Member (an individual user's platform scope, when they hold no Organization profiles) or a Member Organization. Not a stored row: resolved as the set of `journey_data_rods` sharing a `user_id` (member scope, `org_id IS NULL`) or an `org_id` (organization scope). Atoms and Molecules are shared — referenced, never duplicated — across every Channel instance, Tributary, and sub-journey within a Riverbed.
  - **Member Riverbed modules:** Career Network Management (public site profile, career world Orbit, resume output configuration — built) and Personal Finance Projection (checking/budget/credit-health infrastructure, SaltTide-adjacent — defined, roadmap-only, not built or available to anyone yet).
  - **Member Organization Riverbed scope:** organization-specific modules with their own reflected data model, sensitive to per-organization data-privacy/residency requirements (see Currents' Port rules below), with an organization-scoped Channel Rod Staff member (BestyStaff template) driving a lead through the full Channel Journey to Accounting Projection (journal entries, billing, invoicing) — sequenced future work, not yet built.
- **Channel:** the *definition* of a temporal-destination corridor type — governs what kind of semantic state can be projected, positioned, diverted, recombined, and interpreted along corridors of that type (e.g. Member, Customer, Revenue Lifecycle, Fund Deal, Portfolio Company, Value Creation). A Channel is declared once per type and carries no live state of its own. Backed by `journey_rod_types` (`server/db.js`).
- **Channel Rod:** the persistent *instance* of a Channel definition — one real, live occurrence of that Channel type for a specific entity, carrying actual temporal state, evidence, and settlement. Every `journey_data_rods` row is a Channel Rod instantiating its `rod_type`'s Channel definition. (Decided 2026-07-16, superseding the earlier "reference axis of a Channel" phrasing, which described the same relationship without naming it as definition/instance.)
- **Channel Tributary:** bounded scenario-specific state flow derived from a parent Channel Rod. Only branches with this semantic behavior are Tributaries. The one mechanism for every Tributary connection is `server/lib/tributaryRegistry.js`'s `TRIBUTARY_TYPES` registry — a new Tributary is a new registry entry, never bespoke insert code.
- **Current:** the rule set defining a Channel journey's context — channel entry criteria (minimum Atoms/Molecules/events/interactions that must already exist, evaluated as a criteria expression, gating entry to the Current), derived-data rules, per-current-state user input requirements, maturity progression entry and exit points, minimum carry (what must persist forward as the journey continues), required context data, port stage, and port stage maturity. A Current can exist in a **master data context** (canonical, applies to any evaluation of that Channel type) or a **Channel's own current context** (scoped to one specific Channel Rod's journey) — two separate rule sets evaluated against the same underlying Atoms/Molecules, never duplicating them. Modeled as a config registry (`server/lib/currentRegistry.js`), not a database table, following the same org-override seam already established by `server/lib/provisioningPolicyRegistry.js` — a table is added only if a real organization needs to persist custom Currents dynamically, not speculatively.
- **Current Arc:** the actual temporal data state produced by evaluating a Current's rules against the shared Atoms/Molecules across journey Channels — distinct from the Current itself (rules vs. resulting state). Aggregates into current-channel maturity. Event-sourced as `journey_rod_events` rows (not a new table): each evaluation appends an event carrying the state snapshot, port stage, and port-stage maturity; the Current Arc at any point in time is reconstructed by reading a Rod's events in order, matching this document's own event-sourcing law below.
- **Orbit:** the per-module user interface and usage-tracking surface for every user-facing platform module — formalizes the pre-existing 3D orbit visual metaphor (previously decorative-only) into a real, tracked object: a callable API per module, and usage tracked (logins, queries, projection versions) per module per Member profile. Already implemented, not new infrastructure: `server/lib/usageTracking.js`'s `recordLogin()`/`recordInteraction()` write into the existing `analytics_events` table (`object_type='member_entitlement_rod'`), validated against `server/lib/provisioningPolicyRegistry.js`'s configured `SALT_BASIN_TRACKED_INTERACTIONS` per module — extend that registry's module/interaction lists to formalize a new module's Orbit, don't build new tracking infrastructure.
- **Confluence:** governed reconciliation point preserving accepted and rejected contributions, decisions, evidence, effective time, and lineage.
- **Query Channel:** first-class data experience that assembles governed contributions through a temporal query path.
- **Compressed Query Rod:** persistent query-result object containing the query definition, contributing objects, authority context, effective time, rule versions, lineage graph, and result projections.
- **Query Rod Hash:** deterministic content-addressed retrieval and index key for a Compressed Query Rod. It must retrieve and verify the contributing state; it is not merely a visual compression effect.
- **Accounting Projection:** policy-relative expected accounting state derived from economic compositions.
- **Reciprocal State Inference:** inference from observed accounting topology to the economic world that must or may exist, compared with independently derived economic state.
- **Heterosemantic Divergence:** measured difference among intentionally non-equivalent projections of a shared canonical identity.
- **Agent Boundary:** persistent object-bound scope governing context, sources, memory, retention, exposure, transformation, proposal, staging, commit, and lineage visibility. Design-stage only — not implemented anywhere in the codebase as of 2026-07-27; Currents, Current Arcs, and Molecule Instances carry a reserved, nullable `agent_boundary_ref` slot for it, but nothing enforces it yet.
- **Channel Rod Staff:** named Salt Basin agent workforce assigned to Channels, Rods, Tributaries, Confluences, Molecules, and checkpoints using the reusable BestyStaff template architecture. BestyStaff itself remains Betsy's intentionally named personal AI proxy.

### Reuse-first law (2026-07-27)

Every new concept in this architecture must first be checked against the existing substrate before any new table is proposed, in this order: (1) a new `rod_type` in `journey_rod_types`? (2) a new entry in `tributaryRegistry.js`'s `TRIBUTARY_TYPES`? (3) a new `event_type` in `journey_rod_events` (event-sourced state)? (4) a new tracked interaction in `provisioningPolicyRegistry.js` (Orbit/usage tracking)? (5) a new Atom/Molecule/bonding-rule definition in the existing `journey_metadata_molecules`/`journey_metadata_clusters`/`journey_atom_affinity_rules` tables? (6) an additive column on an existing table? A new table is justified only when all six are a genuine poor fit for a structurally different shape — matching the real precedent of `journey_rod_settlement_states` (a genuinely different queryable-current-value shape) and `resume_output_projections` (a genuinely different satellite shape) — and even then it must register with `tributaryRegistry.js` if it connects to a Channel Journey. See the `salt-basin-channel-journey-architecture` skill for the enforceable audit workflow.

### Evidence and derivation law

Authoritative evidence is never overwritten by derived state. Compositions, settlement, Channel position, accounting projections, divergence, query hashes, and Agent interpretations must remain reconstructable from preserved evidence, rule versions, effective time, security context, and lineage.

Revenue, Customer, and Member Channels may describe the same canonical identity but are intentionally non-equivalent. Their difference is a signal, not an error to erase.

### Channel creation rules

- **External origin:** External Interaction → Member Channel Rod → qualification → Member Tributary → Customer Channel Rod → commercial qualification → Customer Tributary → Revenue Lifecycle Channel Rod.
- **Internal commercial origin:** Internal Lead → Revenue Lifecycle Channel Rod → qualification → Revenue Tributary → Customer Channel Rod → onboarding/provisioning Customer Tributaries → Member Channel Rods.
- **Direct-to-consumer:** A Member Tributary may create a Revenue Lifecycle Channel Rod without a separate Customer Channel Rod. The paying Member also carries a Customer semantic role without duplicating canonical identity.

One identity may hold Member, Customer, Buyer, Payer, Service Recipient, and End User roles. These roles are independently effective and queryable.

### Agent authority law

The Agent is the governed write interface to Salt Basin. Direct persistent state changes must pass through the same proposal, validation, policy, lineage, and commit boundary used by Agents.

At every interaction, effective authority is the intersection of:

1. the authenticated principal's tenant, organization, role, ownership, object, field, action, purpose, and temporal permissions;
2. the Agent Boundary assigned to the target object;
3. applicable data, retention, exposure, transformation, and settlement policies; and
4. the authority required by the requested action.

Persistent Agent identity, memory, background agents, cached context, proximity, or earlier access never expands the current user's authority. The Agent must filter what it retrieves, reasons over, reveals, proposes, stages, and commits under the interacting principal's current context. Every attempted write produces an auditable decision and lineage record, including denials.

**Multi-source Agent access (Member Organization scope, 2026-07-27):** a Member's Agent may hold connections to multiple source-side servers/databases beyond Salt Basin's own (see `server/routes/oauth.js`'s Connected Apps mechanism and the member-supplied Postgres/Supabase connections in `MemberDbsCard`). The Agent itself may hold full access to each connected source, but must filter what it surfaces to the interacting user under the same authority intersection above — full Agent access to a source is never itself expanded user authority. Multiple schema-mapping options must be available per source (extends the existing L1 Ports concept — `data_ports`/`port_source_objects`/`port_source_fields` — rather than a new mechanism) so arbitrary source-side schemas translate into the Salt Basin Atom/Molecule schema while remaining sensitive to source-specific data-privacy/residency requirements. A fully independent, downloadable/customizable backend package is a stated roadmap direction, not yet designed in schema detail.

### Channel Rod Staff

Channel Rod Staff is built from a reusable Agent Template Framework derived from BestyStaff while preserving BestyStaff's identity. Staff configurations define assigned Channels and objects, context hierarchy, source permissions, memory and retention, exposure, transformation, proposal/stage/commit authority, collaboration behavior, escalation rules, visual identity, and lineage visibility.

Staff may prepare, recommend, simulate, or stage changes only within the effective authority intersection above. Human approval requirements remain configurable by action, risk, settlement state, and policy.

### Query Channel experience

A query is a governed temporal traversal, not a decorative animation. The system must expose:

- the requested definition and effective-time window;
- Channels, Rods, Tributaries, Molecules, Atoms, Ports, and rules consulted;
- the interacting authority context and any redactions;
- convergence and compression into a content-addressed Query Rod Hash;
- the answer and confidence/settlement interpretation without collapsing distinct measures;
- result contribution visualization;
- click-through lineage for each contribution;
- historical state, present state, and projected Tributaries;
- reproducibility and retrieval using the hash.

The canonical seed query is ARR across Pipeline, Onboarding, and Adoption state. No artificial delay should be added; choreography reflects actual query progress.

### Cross-product 3D world platform

The persistent rotating 3D perspective is the primary Salt Basin brand and interaction anchor. Build the governed world first; pages, panels, chats, reports, simulations, templates, and documents are context-specific interfaces into it.

The shared renderer consumes canonical semantic IDs, temporal state, lineage, policies, and Visual Semantics across Basin, Foundation, Definition, Channel Rod, Magnetic Field, Molecule Focus, Confluence, Query Channel, Accounting Topology, Executive Portfolio, Infrastructure, Pricing, Simulation, Career, and Template worlds.

The renderer must use versioned registries for geometry, material, color, outline, lighting, opacity, interaction, camera, and rotation choreography. Career, pricing, infrastructure, and templates are product perspectives over the same governed architecture, not isolated visual experiments.

### Collaboration and handoffs

Handoffs are first-class governed events containing participants, Agents, Channel coordinates, transferred and restricted evidence, decisions, unresolved definitions, SLA, acceptance, and temporal state.

Multi-user presence must show interaction location and preserve input provenance. A shared Agent may reason over authorized contributions from multiple participants, but each exposure and action remains filtered for its recipient and actor.

### Foundation as live customer-definition data

This Foundation is a governed configuration source consumed by the product. Each customer's definition dataset must support canonical names, aliases, prior and superseded terms, source context, effective periods, authorship, confidence, validation status, related elements, and implementation references.

Human-readable narrative and machine-readable registries are two projections of the same versioned Foundation state. Customer definitions are drafted, validated, tested, approved, published, and superseded without deleting history.

### Source authority and Currents of Evidence

Evidence enters a Basin through governed Ports and Currents of Evidence. Evidence is not automatically canonical truth. Contradictory observations are preserved until reconciliation and may be classified as authoritative, preferred, supporting, candidate, conflicting, or historical. Authority is semantic-domain-specific: an executed contract may govern contractual terms while an ERP governs posted journal state. Salt Basin does not maintain one universal source-priority list.

Each observation must retain source identity, source object and record reference, observed/effective/received time, authority, confidence, security classification, permitted Agents, related Atoms, supersession links, and contradiction group where applicable.

### Magnetic and gravitational fields

**Magnetic Fields** are configurable semantic attraction and repulsion rule systems. They govern likely Atom convergence into Clusters and Molecules using identity, domain, effective time, source authority, confidence, relationships, Channel position, and security boundaries. A Magnetic Field is not a category tag.

**Gravitational Fields** are distinct destination-projection systems produced by Channel Rods. They attract Semantic Compositions toward governed temporal-destination coordinates according to relevance, maturity, evidence density, readiness, temporal proximity, required definitions, policy, and unresolved decisions.

Depth and Settlement Density express projection-relative accumulation, evidence density, definition maturity, temporal persistence, and readiness. They are not generic completeness, confidence, risk, or progress scores. Zero-gravity is a valid unresolved state in which evidence remains inspectable without being forced into a misleading structure.

### Query convergence metric vocabulary (canonical, per Visual Metrics build, 2026-07-12)

The Gravitational Field law above — attraction "according to relevance, maturity, evidence density, readiness, temporal proximity, required definitions, policy, and unresolved decisions" — is now operationalized as a concrete, versioned Metric Definition Registry (`src/config/metrics/metricDefinitionRegistry.js`), not left as narrative law with nothing computing it. Distance from a selected Channel Rod in the 3D world is Query Relevance, never Rod Maturity mislabeled as convergence — the two are calculated, displayed, and drilled into separately, per this section's own "without collapsing distinct measures" rule.

Eleven canonical metric keys, each with a registry entry (definition, business question answered, calculation method, directionality, range, and visual encoding — never meaning left only in component text):

- **Query Relevance, Query Coverage, Query Confidence, Convergence Stability** — the four Query Channel experience measures (§ Query Channel experience above). Relevance is a configurable-weight component sum (Direct Semantic Relationship, Rod Relationship, Lineage Relationship, Hierarchy Relationship, Semantic Similarity); Coverage is required-dimension weight satisfied ÷ applicable, never raw element count; Confidence is evidence-quality-weighted and calculated independently of Coverage; Stability is inverse unresolved-evidence risk and drives motion semantics (pulse, bounded orbit, settlement) rather than decorative animation.
- **Rod Position, Stage Completeness, Stage Readiness, Rod Maturity, Journey Density, Rod Coherence, Cross-Rod Alignment** — the Depth/Settlement Density measures this section already names as distinct from generic completeness/confidence/risk/progress. Rod Maturity is a six-dimension composite (Definition, Evidence, Lineage, Validation, Temporal, Relationship) independent of lifecycle position; Rod Coherence and Cross-Rod Alignment extend the existing Heterosemantic Divergence measurement (below) into a scored, explained result rather than replacing it.

**"Customer Orbit" is the canonical interaction term.** The master-prompt draft that originated this vocabulary used "Orbin" throughout; Betsy confirmed 2026-07-12 this was shorthand/typo for "Orbit," matching the already-shipped `SpatialJourneyWorld.jsx` term. "Orbin" has no canonical standing anywhere in this Foundation.

### Canonical identity, temporal lineage, and state change

Canonical identity is distinct from Channel state. One identity may participate in multiple non-equivalent Channels and semantic roles without duplication. Every Atom, Molecule, Channel state, Tributary, Confluence contribution, Agent proposal, and accounting projection carries effective-time and recorded-time lineage.

Changes are event-sourced. Proposal, validation, staging, commit, rejection, and supersession remain distinct events. The world timeline must be replayable without replacing source evidence or losing rejected contributions. The system must distinguish what was true, what is true, and what may change.

**Member Organization Admin identity (canonical, per Member Configuration + Member Organization Admin Configuration §1/§20, 2026-07-12).** Member Organization Admin is not a separate user-record type from Member. All interacting users are canonical Members. Member Organization Admin capability is created through Organization-scoped authority, module access, view access, Agent access, and action permissions — `MEMBER CAPABILITY SET + ORG ADMIN MODULE ACCESS + ORG ADMIN VIEW ACCESS + ORG-SCOPED AGENT AUTHORITY`. The same Member may simultaneously act as Individual Member, Customer, Payer, Buyer, Organization Member, Organization Administrator, Executive, Account Executive, Finance User, Definition Owner, and Channel Participant without duplicate Member records. Implementation mechanism: extend the shipped `data_entitlements.scope` JSONB rather than introduce separate `authorityProfileIds`/`moduleAccessProfileIds`/`viewAccessProfileIds` tables — this reuses the entitlement substrate `org_memberships.role` + `product_licenses.tier` + `data_entitlements.scope` already establish and matches the Member Portal Crystal & Agentic Layer spec's existing curation formula, rather than adding a second, finer-grained authorization mechanism alongside it. If a concrete module later needs gating `data_entitlements.scope` can't express, extend that JSONB shape first before adding new tables.

Every Member receives baseline personal configuration capabilities: Personal Brand Website configuration, Resume Template configuration and output generation, optional Resume Output exposure to the Member's Personal Brand Website, and supported connections to external bank accounts and unsecured debt accounts. Personal financial data is Member-private by default and never becomes Organization-visible through inference from Organization Admin authority — only through an explicit authorized sharing action.

**Member Entitlement Provisioning and typed rod relationships (canonical, 2026-07-16).** A Member Channel Rod forms a Member Entitlement Channel Rod per provisioned module (one Member Rod may hold many Entitlement Rods), each optionally linked to a content Channel Rod (Personal Brand Website module → Public Site Channel Rod; Resume/Career module → Career Master Channel Rod). This parent→child rod formation is a **typed rod relationship** (`parent_rod_id` + `rod_relationship_type`), not a Channel Tributary — a Tributary is a bounded scenario divergence within one rod's own lifecycle; spawning a new rod of a different type is rod formation, the same category of relationship already established for "Member Organization Relationship" (rejected as a Tributary for the same reason). An Entitlement Rod not formed via a tributary from a Member Organization Channel Rod is a direct-to-consumer provisioning; the provisioning process itself (stage gates, tracked interactions, security policy) is one global, configurable process regardless of sales-channel origin, with a Salt Basin default template. Login credentials for a newly provisioned Member are the same password already on file from that Member's originating Lead record when one exists (the password hash is copied, never re-derived or exposed); otherwise a secure password-set link is issued — a plaintext password is never generated or emailed. Multi-factor authentication is an explicit roadmap item, not yet implemented.

**Career Atoms and the Career Master Channel Rod (canonical, 2026-07-16).** A Member's career history is governed as Career Atoms (one per irreducible career fact — job title, employer, skill, certification, deal, etc.) composed into Career Molecules (one per entry-type instance — a single job, a single engagement), attached as evidence to that Member's Career Master Channel Rod, per master prompt §77. This is the same Atom/Evidence pattern already governing Revenue/Customer/Member Channel Rods, not a bespoke career-specific model. A Resume Output is a projection of this canonical Career state (per the already-established rule that a Resume Output must never silently diverge from or rewrite the Career Atoms it was generated from).

### Process, handoff, and operating-loop law

L1 through L4 describe configurable process scope and decomposition; they are not universal hardcoded stages. Exact Channel stages remain versioned configuration. Handoffs are first-class governed events, not decorative transitions. Quarterly operating loops recur around a progressing Channel Rod and must not be flattened into a false linear lifecycle.

### Accounting and commercial projection law

Commercial truth and accounting truth are linked but non-equivalent. Contract billing terms, performance obligations, billing schedules, revenue recognition, cash, receivables, deferred revenue, adjustments, and manual journal entries retain separate semantic identity and lineage. Accounting Projection derives expected financial state from governed economic compositions; Reciprocal State Inference compares observed accounting topology back to the economic state that must or may exist. Manual journals never erase upstream causality.

### DataBasin and distributed-source law

DataBasin is the governed bridge between existing systems and the Salt Basin semantic model. It normalizes, translates, reconciles, simulates, validates, and maps distributed evidence without requiring Salt Basin to become the physical system of record. Source credentials and permissions remain source-scoped. Agent access to distributed sources is evaluated under both source authorization and the interacting-principal authority intersection.

### Configuration-first world and rendering law

Governed concepts, Channels, Elements, Agent templates, scenes, geometry, materials, lighting, color, opacity, motion, camera behavior, level of detail, formulas, security, and interaction rules are versioned configuration rather than hardcoded React semantics. Every renderable governed object resolves a canonical semantic identity through shared architecture and visual registries. The Dynamic Legend is generated from the active production Visual Registry and can highlight the objects it explains.

Each stable semantic path receives a deterministic permanent visual identity constrained to the approved Salt Basin spectrum. Materials, geometry, outline, lighting, opacity, and motion carry meaning and are never assigned randomly. The light-background world is the default brand environment; the persistent rotating Channel Rod world is the primary navigation, explanation, simulation, and brand anchor rather than decoration.

### Accessibility, collaboration, export, and performance law

Every spatial scene has a synchronized accessible 2D representation with keyboard navigation, screen-reader semantics, and reduced-motion behavior. Reduced motion preserves explanation and lineage. Authorized exports may include a world snapshot, semantic JSON, and a read-only share view; publication and security rules apply to every export.

Real-time collaboration preserves participant identity, authority, presence, input provenance, and checkpoint state. Shared reasoning never gives one participant access through another participant's authority.

The world architecture targets interactive exploration at 50,000 synthetic nodes through instancing, clustering, level of detail, viewport fetch, lazy relationships, and caching. Fetch time, render time, frame rate, active node count, and level of detail are observable measures. Synthetic scale data is a performance instrument, not a replacement for real Salt Basin data.

### Product perspectives and shared semantic models

Website, admin, product, simulation, executive, infrastructure, career, resume, infographic, and output experiences are perspectives over the same governed semantic world. Resume templates and executive-summary layouts consume one shared Career semantic model rather than duplicating content. Capability mapping connects Business Scenario → Capability → Platform → System → Source → Atom → Molecule → Channel Impact. The Thesis / Tributary Ledger links work, completion state, cost, risk, and outcomes back to Foundation elements, Channels, architecture, products, and value theses.

The Business Definition Context Agent collects definitions, surfaces conflicts and evidence, proposes canonical language, and routes validation. It never silently normalizes disagreement. Product definitions that remain unresolved are labeled unresolved rather than promoted to confirmed Foundation truth.

### Governing source reconciliation

The July 12, 2026 **Salt Basin Holdings — Ultimate Master Build Prompt** is an approved architecture directive and Foundation source with SHA-256 `9FC162DA846C269C570F76E2F8C7E64B5E576FE36FCC5F2CBA68766E74A3DE57`. Its canonical definitions and rules are incorporated in this section and the machine-readable registry. Detailed implementation targets, example scenarios, quality tests, and build loops remain specifications governed by the Foundation; they are not all promoted to universal ontology.

---

*Where earlier sessions invented content that didn't come from Betsy's own source material, that has been explicitly flagged and retired rather than carried forward silently — see `docs/betsy-foundation-source-of-truth.md` for the fullest account of corrections on record.*
