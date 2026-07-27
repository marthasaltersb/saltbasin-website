---
name: salt-basin-config-audit
description: Audit a Salt Basin build — before planning and after implementing — for hardcoded product assumptions that should instead be configuration, metadata, versioned definitions, policy, formula, semantic mapping, or seeded data. Use when Betsy invokes /config-audit, references "the configuration enforcement prompt," asks to audit for hardcoded assumptions, or before/after implementing any Module, View, Channel, Channel Rod, Agent behavior, simulation rule, or 3D scene element.
---

# Salt Basin Configuration Enforcement

The objective is not to make the current Salt Basin demonstration work. The objective is to preserve
Salt Basin as a **configurable semantic, agentic, spatial operating platform**. Every build task carries
this audit as a first-class step, not an afterthought.

## The core question

For every visible object, business rule, Agent behavior, Channel state, simulation rule, and visual
treatment:

> Would Betsy need to edit source code to change this for another Member, Organization, product,
> Channel, industry, or business scenario?

If yes, it must resolve from **configuration, metadata, a versioned definition, a policy, a formula, a
semantic mapping, or seeded data** — not from a hardcoded value, a conditional branch, a component name,
CSS, JSX, Three.js scene construction, or a comment.

## When to run this

- **Before implementation** — audit the plan/description itself. Walk the checklist below against what's
  being proposed and flag anything that's about to get hardcoded before a line of code is written.
- **After implementation** — audit the actual diff. Re-walk the checklist against the changed files.
- Both passes end with the classification step (below). Don't skip the "before" pass just because the
  "after" pass catches things too — catching an assumption before code exists is cheaper than refactoring
  it out later.

## Check existing configuration surfaces before inventing new ones

This repo already has real registry/config layers. Look here first — the fix is often "route through the
existing registry" rather than "build a new one":

| Category | Existing surface |
|---|---|
| Admin/member nav, Modules, Views | `config_state` rows `admin_nav`, `page_type_definitions` (`server/db.js`); `src/data/platformModules.js`, `src/data/platformLifecycleConfig.js` |
| Member capabilities / Org authority | `org_memberships.role`, `product_licenses.tier`, `data_entitlements.scope` — **do not** add a parallel `authorityProfileIds`-style system without reconciling first (see `docs/salt-basin-master-build-member-org-reconciliation.md`) |
| Channels, Channel Rods, Tributaries, Confluences | `src/lib/journeyEngine/*` (genesis, bonding, divergence, lineage, layout), `src/data/journeyWorldConfig.js`, `journey_data_rods` table, `src/config/journeys/journeyDefinitions.js` |
| Elements, Atoms, Molecules, Magnetic Field rules, Ports | `server/lib/eidos.js` + `server/routes/eidos.js` (9-layer EIDOS schema), `src/config/architecture/objectTypeRegistry.js`, `src/config/architecture/layerRegistry.js`, `src/data/elementRegistry.js` |
| Checkpoints, Handoffs, Stage gates | EIDOS `port_network` / `settlement` layers (`server/lib/eidos.js`) — check before inventing a separate gate system |
| Agent templates, Channel Rod Staff assignments, Agent context sources, cache policy, proximity refresh | `src/lib/journeyEngine/mockAgentProvider.js`, `server/routes/bestyStaff.js`, `server/routes/memberAgent.js` — **these are largely NOT config-driven today.** Treat as a primary audit target, not a solved surface. |
| Questions, required question attributes, Source systems/objects/fields, Semantic mappings | `src/data/capabilityTags.js` (`SOURCE_TYPES`, `MERGED_FIELD_DEFAULTS`, `TAG_CATEGORIES`, `fieldMeta`), `server/lib/oauthProviders.js` (14-provider source config) |
| Security, retention, visibility scopes, write authority | No single registry today — **primary audit target.** Check for scattered role checks in route files before assuming a policy layer exists. |
| Simulation formulas, scenario variables, formula dependencies, risk paths, temporal windows | `src/lib/maturityScoring.js`, `src/lib/journeyEngine/maturity.js`, `src/data/businessDefinitionExperienceConfig.js` |
| Materials, Geometry, Lighting, Opacity, Outlines, Animation, Rotation choreography, Camera paths, Scene transitions, Query convergence, Lineage animation, Result highlighting | `src/config/visual/visualSemanticRegistry.js` (`GEOMETRY_REGISTRY`, `VISUAL_SEMANTIC_REGISTRY` — `colorRule`/`outlineRule`/`lightingRule`/`opacityRule` keys), `src/config/visual/worldRegistry.js`, `src/lib/crystalGeometry.js`, `src/lib/journeyEngine/{pathColor,atomGeometry}.js` |

If a checklist item has no existing surface, that's a real gap — say so explicitly rather than silently
picking the nearest unrelated registry.

## Full audit checklist

Modules · Views · Member capabilities · Organization authority profiles · Channels · Channel Rods ·
Tributaries · Confluences · Elements · Atoms · Molecules · Magnetic Field rules · Ports · Checkpoints ·
Handoffs · Stage gates · Agent templates · Channel Rod Staff assignments · Agent context sources · Agent
cache policies · Agent proximity refresh behavior · Questions · Required question attributes · Source
systems · Source objects · Source fields · Semantic mappings · Security policies · Retention policies ·
Visibility scopes · Write authority · Simulation formulas · Scenario variables · Formula dependencies ·
Risk paths · Temporal windows · Materials · Geometry · Lighting · Opacity · Outlines · Animation behavior
· Rotation choreography · Camera paths · Scene transitions · Query convergence animation · Lineage
animation · Result highlighting.

## Resolution rules

- **Prefer indexed configuration registries over repeated conditional logic.** A `switch`/`if` chain keyed
  on a product/member/channel name is a signal the value belongs in a registry instead.
- Business meaning must not live **only** in component names, CSS, JSX, Three.js scene construction, or
  comments — those are implementation, not the source of truth.
- Visual meaning resolves from semantic configuration (`VISUAL_SEMANTIC_REGISTRY` and friends), not from
  a component hardcoding a color or geometry choice.
- Agent authority resolves from policy, not from a role string compared inline in route handlers.
- Business behavior resolves from rules and definitions, not from behavior embedded in a component.
- Simulation behavior resolves from formula and scenario configuration, not from constants buried in a
  calculation function.
- User experience resolves from interacting-user context, authority, current world, current location, and
  semantic object state — not from a fixed layout.

## The 3D spatial rendering is the brand anchor

The rotating 3D rendered perspective (`SpatialJourneyWorld.jsx`, `CrystalRoomScene.jsx`,
`CrystalOfficeScene.jsx`, `CrystalMarkField.jsx`) is Salt Basin's primary brand anchor — never reduce it to
a decorative dashboard widget. Scene composition must be configurable. When building or extending any of
these: create reusable scene primitives and semantic render mappings (extend `visualSemanticRegistry.js` /
`worldRegistry.js`) so additional elevated rotating 3D experiences can be composed without rebuilding the
renderer.

## End-of-audit classification

For every remaining hardcoded assumption found, classify it — don't leave it unclassified:

- **INTENTIONAL PLATFORM CONSTANT** — same for every Member/Org/product by design (e.g. the
  UNDERSTANDING → RENDERING → MANIFESTING sequence). State why it's constant.
- **FOUNDATION-LOCKED BRAND RULE** — fixed by the Foundation Source of Truth (`BestyStaff` spelling, the
  retired five-pillar model staying retired, etc.). Cite the source.
- **SHOULD BECOME CONFIGURATION** — convert it now if within the current build's scope. Route it through
  an existing surface from the table above where one exists; otherwise propose the smallest new registry
  entry that fits the existing pattern (don't invent a parallel system — flag for Betsy if two existing
  surfaces could both plausibly own it).
- **TEMPORARY PROTOTYPE DEBT** — known hardcoded, not being converted in this pass because it's out of
  scope or blocked. Record it explicitly (e.g. append to `docs/salt-basin-master-build-progress.md`'s
  changelog/conflicts section, or a comment at the call site pointing to that doc) — never leave it silent.

## Output format

End every audit with:
1. What was converted to configuration in this pass (file + registry entry).
2. The classified list of everything else found, one line per item, using the four labels above.
3. Any TEMPORARY PROTOTYPE DEBT items, called out separately so they aren't lost in the general list.
