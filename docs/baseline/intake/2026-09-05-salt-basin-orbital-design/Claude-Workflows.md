# Salt Basin — Reusable Claude Workflows

These are reusable project-work prompts, not commands known to be installed. File references are package-relative. Bind them to the actual repository and pinned published design version before use. Workflows propose implementation tasks; this package itself makes no code changes.

## Shared opening contract — include in every workflow

Read Current-Specification.md, Requirement-Register.md, the three Sources/Design-document files subject to specification precedence, the repository's own instructions and the actual deployed release manifest. Identify the design baseline and current implementation version. Treat historical examples and assistant proposals as such. Inspect existing provisioning, schema, configuration and UI before proposing replacements. Start with configuration feasibility. If existing configuration supports the request, make no code change and do not perform the configuration change: give the user the verified agent/admin view and exact fields/steps to use. If no verified route exists, report the gap. For required code changes, first record whether the behavior should become configurable, remain a justified code primitive, or use a supported alternative. Preserve actor/data/action access distinctions, device support and release traceability. Never invent confirmed bugs, implemented capabilities, routes, rules or thresholds. Report changes, evidence, validation and unresolved decisions.

## 1. Debug and defect triage

Using the shared opening contract, investigate the reported Salt Basin behavior: [insert observed behavior, expected behavior and environment]. The source conversation described diagnostic needs but did not reproduce specific bugs. Separate confirmed defects, unverified reports, missing diagnostic capabilities and design improvements. Identify the affected release, module and configuration versions. Reproduce using available evidence; trace source inputs, translations, rule/formula versions, outputs and downstream consumption. Distinguish recorded inspection, deterministic replay and fresh execution. Use existing configuration guidance when sufficient. If code is necessary, create a ChangeDecision with configuration assessment, minimal remedy, meaningful regression verification and affected/fixed release linkage. Do not describe a hypothesis as a confirmed root cause. Deliver a defect record and, where authorized, the validated change.

## 2. Implement User Definition first

Using the shared opening contract, prioritize the User Definition capability in section 6 before broad module expansion. Inspect and reuse the existing user identity, license provisioning and access systems. Map required logical definitions to actual existing entities and report gaps. Define the user-facing editor and administrator view for identity association, entitlements, data and action scope, avatar, Home/shine preferences, last-session continuity and agent access. Keep license scope distinct from personal filters. Propose migrations only where necessary and record the configurable-versus-code decision. Implement the smallest complete usable capability within the user's authorized scope, including loading/error/access states and mobile/tablet/laptop behavior. Verify provisioning integration, denied access, preference persistence, resume after access changes and audit history. Deliver a version-linked change report; do not invent an orbital placement or pricing policy.

## 3. Implement Builder configuration and editing experiences

Using the shared opening contract, map sections 4, 7 and 8 to existing records and editors. Build versioned definitions for fields, persistence/source bindings, semantics, translations, rules, agent scopes, screens, journeys, visual objects and scenes. For every definition, provide a real editor journey showing what users can create, validate, preview and publish. Map each field to persisted/derived/cached/source-only state and label/object/scene display bindings. Connect permissions and module bundles. Use a representative end-to-end definition to prove the model rather than hard-code every example. Record compatibility and migration requirements. Preserve references from historical runs to the exact definitions used.

## 4. Visual and static asset library

Using the shared opening contract, create an asset inventory from section 3 and all preserved draft tables. Include sun, planets, distinct moons, satellites, stars, human/agent avatars, data/stage objects, paths/connections, mountain, rain/clouds, basin water, moon phases, report objects, labels/icons and device variants. For each asset define identity, meaning, source type, geometry/image/material, data bindings, interaction, state variants, permissions, accessibility and version. Reuse existing code-native geometry and assets where suitable. Identify actual required authored resources before generating them. Do not choose business thresholds or metrics implicitly through art. Produce assets and integration mappings only within the authorized project scope, with previews and verified runtime references. Mark unresolved style values and performance budgets. Link the immutable asset manifest to its release.

## 5. UI or animation change session

Using the shared opening contract, evaluate [requested visual/interaction change]. First determine whether a visual, scene, animation or screen definition already configures it. If so, direct the user to the verified in-product editor without making the change. Otherwise define the missing configurable capability or justify a code primitive. Specify trigger, state transitions, data meaning, navigation/return behavior, camera, reduced-motion behavior and device adaptation. Keep shine selection distinct from operational weather and missing data distinct from adverse performance. Update the versioned definition, preview, meaningful checks and ChangeDecision together with any code.

## 6. Release, patch and administrator audit

Using the shared opening contract, implement or update the release linkage in section 10. Inspect current GitHub and CI/CD setup and actual environments. Link immutable code, design, schema, configuration, UX and asset versions into a manifest. Track bugs, improvements and configuration decisions against affected and fixed releases. Promote the same validated artifact with explicit environment configuration. Define migration compatibility and recovery, and expose actual installed versions and history in the administrator view. Do not deploy without existing authorization. Deliver evidence that the in-product manifest matches the deployed artifact; clearly distinguish a proposed pipeline from a verified one.

## 7. Repeated-pattern and configuration opportunity review

Using the shared opening contract, review authorized change/audit records for repeated fields, values, rules and UI patterns. Propose reusable data or configuration definitions with evidence, semantic boundaries, affected modules, migration impact and estimated reduction in repeated work. Do not automatically collapse similar-looking values with different meanings. Record proposed, accepted, rejected or deferred status and rationale in the administrator audit. Implement only the accepted scope authorized for this session.

## 8. Salt Basin extension capability assessment

Using the shared opening contract, assess whether current declarative definitions, rule expressions or an SDK satisfy builder extensibility before recommending a new language. Compare data typing, permissions, diagnostics, sandboxing, resource limits, packaging, version compatibility and CI/CD integration. Treat Salt Seed as a tentative name. Deliver an architecture decision and smallest representative proof plan; do not implement a new compiler/runtime or assume the user selected a language merely from the exploratory concept.

## Suggested reusable session inputs

Workflow; request; repository; environment; deployed release; pinned design version; module; evidence; scope of authorized implementation. A missing repository route or deployed version is an explicit unknown. Actual command installation syntax depends on the installed Claude tooling and is not asserted here.
