# Salt Basin — Current Design and Delivery Definition

Version: 0.1.0-draft · Prepared September 5, 2026 · Status: consolidated design, not implementation verification.

## 1. Authority, scope, and reading order

This package consolidates Export Salt Basin Chat, its three design outputs, and the subsequent request in this conversation for configuration-first development, user definition first, release control, reusable Claude workflows, and a branded extension capability. The original conversation and drafts are retained in Sources. They remain evidence, including examples and unresolved proposals; they are not all approved requirements.

Read this specification first, then the three preserved design drafts for their detailed tables, then the requirement register and Claude workflows. The drafts are incorporated as detailed supporting specifications subject to the precedence table below. Original wording is retained separately so consolidation does not erase context. Speech absent from the saved transcript cannot be reconstructed. Earlier Salt Basin chats referenced by the export are not independently complete sources in this package.

Status vocabulary: REQUIRED = explicit user direction; PROPOSED = assistant recommendation; EXAMPLE = illustrative business mapping; OPEN = definition still needed. None means implemented or verified against the repository.

| Earlier wording or ambiguity | Current interpretation | Status |
|---|---|---|
| Home as primarily 2D cards | Orbital Home centers the crystalline sun; tasks, approvals, saved views and configuration coexist as controls | REQUIRED, later direction |
| Crystal core | The crystal core is the sun | REQUIRED |
| Planets as journeys | Planets are modules; journeys are experiences within or associated with modules | REQUIRED, later clarification |
| Revenue, Customer, Member | Preserve three peer Journey Rods; modules can organize capabilities across them | Retained prior terminology |
| Sales/Service/Reports/Admin planet list | Candidate inventory; do not treat all proposed planets as approved product modules | PROPOSED |
| Avatar location cached | Preserve last context; account-backed persistence with local cache is a recommendation, not an inspected implementation | REQUIRED outcome / PROPOSED mechanism |
| Rain, mountains, moons | User-defined examples of configurable business meaning; no invented universal thresholds | REQUIRED configurability / EXAMPLE mappings |
| Existing provisioning application | Reuse it; inspect its actual interfaces before implementation | REQUIRED / unverified current implementation |
| Immutable design/cache | Published version snapshots are immutable; drafts can evolve; caches are replaceable copies, not the authority | REQUIRED version control / PROPOSED mechanism |
| Agent debugging discussion | Diagnostic requirements, not evidence of reproduced product bugs | REQUIRED capability |

## 2. Product structure and navigation

Salt Basin is an immersive enterprise application in which meaningful data, processes, people and agents have spatial representations. A module is a planet. Each module definition maps its purpose, permitted actors, journeys, screens, child objects, fields, rules, assets, interaction entry points and return behavior. A decorative image alone is not a module definition.

The navigation may contain planets, moons, satellites and stars, with distinguishable forms, planet colors and multiple-moon sizes or appearances. Child objects must have an explicit parent and destination. Exact colors, sizes and module inventory remain open; earlier assignments of moons to views and satellites to tools are proposals. Revenue, Customer and Member remain Journey Rods; Data Channels support them and Pricing is a domain.

Orbital Home opens on a central crystalline sun in a dark environment. Hovering activates light toward authorized objects matching the user's saved shine dimensions, such as Sales, Service, application, client, journey, task or report scope. Home configuration also defines initial content, tasks, approvals and resume behavior. Touch and keyboard equivalents, pinned illumination and readable inactive destinations are recommended interaction details. Shine filtering never grants access.

Entering a planet or journey collapses navigation while preserving a way to reopen it and return. A top-right sun/sky view maintains orientation and communicates the current context. Returning from a process workspace restores location and selection. A user can choose Home or resume their last session; the default is a proposal, not settled policy.

## 3. Scene, visual and animation contract

Every visual definition links to an actual entity, process, metric, event or explicitly decorative purpose. Its contract records geometry or image source, material, color, label, relationship, scale, device behavior, interaction, data binding and permissions. Every animation records trigger, source event, rule version, scope, period, thresholds, duration, transition, cancellation, reduced-motion behavior and textual equivalent. Duration and thresholds are unresolved until configured.

| Element | Meaning and interaction | Required mapping or unresolved detail |
|---|---|---|
| Crystalline sun | Home center; scope illumination; visible in journeys | Selected shine dimensions; operational meaning separate from selection |
| Planet | Module destination | Module, identity color, geometry, entry screen, allowed users |
| Moons | Distinct subordinate objects; phases may represent progression | Parent, size/appearance, explicit business role; avoid conflicting meanings |
| Satellites | Navigation object category | Destination and product meaning still to be configured |
| Stars | Scene/navigation category | Decorative versus interactive must be explicit; static or 3D rendering permitted |
| User avatar | Individual geometric identity and position | User profile, saved location, camera, selected work |
| Agent avatar | Distinct geometric agent identity | Agent role, scope, hierarchy, state and destination |
| Data object | Spatial representation of a data element/record/group | Entity reference, level of detail, permitted values and detail surface |
| Process object | Selectable journey stage | Stage data, entry/exit conditions, actions and 2D workspace |
| Connections | Process relationships | Paths, channels, bridges or other defined geometry; valid transitions |
| Mountain | Example goal progression and peer comparison | Metric, target, actors, territory/team, time period, comparison permission |
| Rain/clouds | Example workload/inflow or operating event | Event and metric source; capacity/threshold meaning; never assume 75 tickets is adverse |
| Basin water/evaporation | Example resource or cash condition | Unit, balance/flow, period, calculation and visual scale |
| Sun brightness | Example performance or ambient time | Separate calendar/daylight theme from business condition |
| Moon phase | Example active lifecycle or renewal progression | Business-state-to-phase table and active cycle identity |
| Completed moons | Example renewal history | Completed cycles; three moons mean three years only for annual cycles |
| Reporting geometry | Query results and aggregations | Source, filters, grouping, measures, scale, legend and drill-through |

Retain the previously proposed crystalline style, dark spaces, parchment-toned typography and teal/gold/mauve accents as reference direction. Exact palette values and final assets are not specified. Labels and numerical detail keep visual encodings interpretable. Unknown, loading, stale, empty and failed data must not masquerade as zero or poor performance.

## 4. Journeys, screens and user work

Journeys are navigable places, not flat diagrams on scenery. The user's desired camera resembles a third-person game: avatar ahead of the viewer with the next one or two steps in view. This does not imply a headset, augmented reality or location tracking. Scene types include outdoor hike, salt-flat crossing with deposits, river travel and underwater exploration; final assignments are configurable.

Each journey records actor separately from subject, module associations, business use case, variants, stages, branching, fields collected, entry/exit requirements, qualification evidence, valid actions and resulting state. Internal sales users are not the external customer; external views require their own access and screen mapping. New business, renewal and expansion and the previously suggested sales stages remain examples.

Selecting a step initially opens a 2D form/detail workspace while preserving 3D context. Opening is not completion. Read/write actions use configured field rules, evidence and permissions; completion changes underlying state and its visual representation. Draft recovery is distinct from location recovery. Closing restores position, camera and selection; interrupted or removed destinations need valid fallback behavior.

Every screen definition includes module, actor, entry source, components, 2D/3D treatment, fields, source/persistence bindings, conditions, selection action, destination, data changes, navigation collapse, return/resume, empty/error state and device layout. The detailed screen and interaction tables in the source drafts remain the baseline under section 1 precedence.

Mobile, tablet and laptop are required. Proposed treatments: mobile touch and full-screen workspaces; tablet expandable split views; laptop keyboard/pointer and resizable panels. Essential work and access rules must remain consistent. Hover cannot be the only entry mechanism.

## 5. Reporting, Home and continuity

Users configure their own queries, object selections, filters, client-specific views, grouping, measures, spatial layouts, tasks and summary dashboards. Saved report objects resolve to processes, records or defined aggregates. Their detail exposes exact values and provenance with a 2D alternative. A builder pairs configuration with preview; report navigation preserves return context.

Every user has a personal geometric avatar. Saved state includes destination, client, avatar position, viewpoint, selection, relevant task/workspace and view filters. Resume rechecks permissions and availability. Home provides selected content and initial landing preference, while shine dimensions choose the authorized scope to illuminate.

## 6. First implementation priority: User Definition

The user explicitly prioritizes the User Definition module before broader configuration implementation. Module here means a product capability; its final planet assignment is still open. Reuse existing identity and provisioning rather than creating a parallel licensing system.

| Definition group | Required content |
|---|---|
| Identity/profile | Stable user reference, profile association, lifecycle status and linkage to existing provisioning |
| Entitlements | Provisioned license, available capabilities/modules/orbits and any feature restrictions |
| Authorization | Distinct discover, view, edit, execute, configure and administer rights; client/data scope and field/action access |
| Avatar | Geometric identity, visual definition reference, preferences and permitted customization |
| Home | Shine dimensions, content selections, pinned work, initial landing preference |
| Session | Last valid destination, location/camera, selected object, task and view configuration |
| Agent association | Which agents the user may see/use/configure and the effective scope of those actions |
| Audit/version | Who changed a definition, when, old/new version, reason and provisioning source |

Acceptance scenarios include a provisioned user receiving only permitted destinations; personal filters unable to expand access; restricted fields and actions enforced beyond visibility; mobile parity; saved state restored safely; license changes reconciled with existing sessions; and an administrator inspecting profile/configuration change history. These are proposed verification scenarios implementing explicit requirements, not assertions of existing functionality.

## 7. Agents, rules, integrations and debugging

Users interact with agents by voice or text to navigate, compile information and update data within defined authority. The Agent Hub exposes agent avatars, hierarchy, definition, scope, tools, activity and diagnostics. Each agent operates over explicitly scoped datasets and deterministic rules; a language model on top is not thereby deterministic.

Diagnostics trace source values through external lookups, connector translations, rules, formulas and downstream steps. Record request context, actor, agent, scope, timestamp, step/parent, operation, rule/mapping version, inputs actually used, output, validation result, source freshness, errors and downstream consumers. An authorized administrator can follow a final value backward to the first mismatch. This concerns observable execution evidence, not private model reasoning.

External values needed for evidence may require caching or snapshots; do not describe persisted copies as zero-copy. Capture must respect existing access and retention rules. Recorded inspection, deterministic replay and fresh execution are separate modes. Model reruns and fresh data may differ. Fault reports distinguish missing evidence from failed calculations.

No concrete product defect has been reproduced from these conversations. The bug workflow begins with inspection and reproduction; debugging capability requests and hypothetical examples are tracked separately from confirmed defects.

## 8. Builder configuration and persisted model

Salt Basin must support using the product to define the rest of the product. Configuration journeys cover business semantics, fields, translations, rules, agents, modules, journeys, screens, assets, scenes, metrics, access and business application bundles. Each visual element must have a literal editing experience, not just a backend record.

| Record type | Relationships and essential definition |
|---|---|
| ModuleDefinition | Purpose, capability bundle, entitlement, orbital object, screens and journeys |
| JourneyDefinition / StageDefinition | Actor, subject, variants, stage graph, fields, conditions, actions, scene |
| FieldDefinition | Meaning, type, validation, source, persistence policy, display binding, access |
| RuleDefinition / TranslationDefinition | Versioned inputs, transformations, outputs, validations and agent use |
| VisualDefinition / AnimationDefinition | Asset, entity binding, scene/object/label level, interaction, event mapping |
| ScreenDefinition | Components, fields, device layout, entry/exit, navigation and error states |
| AgentDefinition | Avatar, hierarchy, scoped data, tools, rules and diagnostics |
| UserDefinition | Provisioning link, entitlements, scope, avatar, Home and continuity |
| ViewDefinition | Query, client, filters, grouping, measures, layout and drill-through |
| CapabilityBundle | Go-to-market grouping of modules/features; health-insurance revenue lifecycle is an example |
| ReleaseDefinition | Published manifest and linked code/configuration/schema/asset versions |
| ChangeDecision / DiagnosticRun | Change rationale, configuration assessment, execution evidence and release association |

These record names are proposed logical entities, not instructions to introduce duplicate database tables. An implementation must map them to the actual existing model first. Fields must explicitly distinguish source-only, persisted, derived, cached and displayed values. Display mappings specify label, 3D object or scene level and how agent rules consume or generate them.

## 9. Configuration-first development contract

Every debug, design and feature session starts by identifying the relevant version and asking whether existing configuration already supports the request. Inspect the actual definition and interface before concluding.

1. Record request, affected module/version and desired behavior.
2. Locate existing configuration, rule, asset binding and agent/admin view.
3. If configuration suffices, do not change code or perform the configuration for the user. Provide the verified in-product destination, fields and steps so the user makes the change there. If the route is not verified, say so; never invent a menu path.
4. If code is necessary, record why existing configuration cannot express it.
5. Evaluate a new configurable definition, a justified code-only primitive, or another supported mechanism such as a reusable rule/template/extension.
6. Record the decision, rationale, affected schema/UX, migration, tests and release linkage before implementation.
7. Implement within the authorized scope; validate; link the result and diagnostics to a release or patch.
8. Make the decision and outcome visible in the administrator audit view.

Repeated fields, values and patterns can generate recommendations for reusable definitions. Recommendations are proposals until reviewed; recurrence alone must not silently change schemas or business meaning. The audit captures whether a change became configurable, stayed in code, used another mechanism, or was deferred, and why.

## 10. Versioning, releases, GitHub and environment promotion

Published design, data-model and UX definitions are immutable snapshots. Corrections create new versions rather than rewriting history. Proposed lifecycle: draft, validate, preview, approve where required by the team's actual workflow, publish, promote, deprecate. A published definition is referenced by identity and version; runtime caches can be rebuilt from it.

Each release manifest links product version, date, module versions, design snapshot, schema/migrations, configuration snapshot, UX definitions, asset manifest, code commit, GitHub changes, checks, environment and deployment result. Bug records link affected versions, evidence, severity, fix version and patch/release notes. Improvements receive the same traceability. Historical diagnostics retain the versions that produced them.

Proposed promotion flow: development → test/staging → production, using the same immutable build artifact with environment-specific configuration references. Actual environment names are open. Avoid copying a moving repository checkout as the release mechanism. CI/CD validates references, compatible schemas, access rules, required assets and acceptance behavior before promotion. Deployment records capture actor, time, artifact, configuration and outcome.

Rollback must account for data migrations as well as code. A release declares compatibility and recovery approach; some changes require forward correction rather than safe schema reversal. These are design requirements for a future implementation; no GitHub or deployment integration was inspected or changed.

The administrator release view shows installed version by environment, modules/features changed, bugs fixed, known issues, linked evidence, migration status, change decisions and recommended opportunities for configuration. The manifest displayed in-product must correspond to the actual deployed artifact.

## 11. Reusable session contract and extension capability

Reusable Claude workflows load a pinned version of this design, the release manifest and current repository guidance. A mutable conversation cache is not an immutable design authority. Each session records the baseline version and selected workflow; a change to the baseline produces a new published snapshot and reviewed delta.

The user's final concept is a Salt Basin-branded developer extension capability analogous in purpose to a platform language/UI framework: users/builders could define behavior on top of the product. A public API alone is not that entire capability. Options to assess are declarative definitions, a rule expression language, an SDK or a sandboxed language/runtime. Do not build a new language before verifying that simpler existing mechanisms are insufficient.

“Salt Seed” is a proposed working name, not a selected brand. “Salt Basin Net Code” and “Net Seed” were exploratory user phrases. Evaluation must cover permitted operations, type/data model, versioning, debugging, permissions, execution isolation, resource limits, packaging, compatibility and release promotion. The language decision remains open.

## 12. Deliverable boundaries and next sequence

This package defines the design and reusable work instructions; it does not generate the final 3D asset library, implement User Definition, reproduce bugs, deploy releases or select a language. Proposed sequence: verify existing system → implement User Definition → establish persisted configuration/editor contracts → implement asset and scene bindings → extend module journeys → integrate version/release administration → evaluate extension language need.

Open decisions include final module inventory, exact fields and existing schema matches, verified configuration routes, asset formats and budgets, palette values, animation timings, business thresholds, peer visibility, licensing/pricing, environment names, version numbering policy and extension language choice. Unknowns must stay visible rather than be filled with invented policy.
