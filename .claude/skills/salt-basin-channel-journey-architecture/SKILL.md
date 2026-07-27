---
name: salt-basin-channel-journey-architecture
description: Audit a Salt Basin build — before planning and after implementing — for new tables, parallel mechanisms, or bespoke storage that should instead reuse the existing Channel Journey substrate (rod_types, Tributary registry, event-sourced state, tracked interactions, Atom/Molecule/bonding-rule tables, or an additive column). Also the starter-kit reference for a new organization standing up its own Salt Basin instance. Use when Betsy invokes /channel-journey-architecture, references "the reuse-first audit," "the channel journey engine," "are we duplicating language," or before/after implementing any new Riverbed, Channel, Channel Rod, Tributary, Current, Current Arc, Atom, Molecule, or Orbit concept.
---

# Salt Basin Channel Journey Architecture Conformance

The objective is not to make one feature work. The objective is to keep every new concept — no matter which
organization's Salt Basin instance it's built for — expressible through **one reused Channel Journey
substrate**, so a new org can stand up its own Salt Basin by configuring that substrate rather than forking
schema. This audit exists because a real mistake already happened once: Career Molecules were built as a
static, pre-declared `molecule_keys[]` table instead of real dynamic bonding, duplicating a shape the
platform already had a correct answer for (2026-07-16, corrected 2026-07-27). This skill is how that
mistake gets caught before it ships next time, in any domain.

## The core question

For every new Riverbed, Channel, Channel Rod, Tributary, Current, Current Arc, Atom, Molecule, bonding
rule, or Orbit concept:

> Can this be expressed by reusing an existing rod_type, Tributary, event type, tracked interaction, or
> Atom/Molecule table — or does it genuinely need new storage?

If a new table gets proposed before working through the checklist below, that is the failure mode this
skill exists to catch.

## The reuse-first checklist, in order

Work through these six in order. Only fall through to "new table" when all six are a genuine poor fit for a
structurally different shape.

1. **A new `rod_type` in `journey_rod_types`?** Every Channel (Member, Customer, Revenue Lifecycle, Career
   Master, Public Site, Member Entitlement, ...) is a row here, not a new table. Adding a new Channel *type*
   is config, not schema.
2. **A new entry in `server/lib/tributaryRegistry.js`'s `TRIBUTARY_TYPES`?** Every Channel-Journey-to-
   Channel-Journey (or Channel-Journey-to-satellite-table) connection is named here, with one generic insert
   path (`createJourneyTributary`) and one validation gate (`validateTributary`). A new parent→child rod
   relationship, or a new journey→satellite link, is a new registry entry — never bespoke insert code.
3. **A new `event_type` in `journey_rod_events` (event-sourced state)?** Temporal state that evolves over a
   Rod's lifecycle (a Current Arc, a Molecule's evolution, a settlement recomputation) is reconstructed by
   reading events in order, not stored as a second mutable "current state" table. `journey_rod_settlement_states`
   is the one justified exception (a genuinely different queryable-current-value shape needed for fast
   reads) — don't take it as license to add a second one without the same justification.
4. **A new tracked interaction in `server/lib/provisioningPolicyRegistry.js`?** Usage/Orbit tracking (logins,
   queries, projection versions, per module per Member) already exists via `SALT_BASIN_TRACKED_INTERACTIONS`
   feeding `server/lib/usageTracking.js` into the existing `analytics_events` table. A new module needs a new
   entry in that config, not new tracking infrastructure.
5. **A new Atom/Molecule/bonding-rule definition?** `journey_metadata_molecules` (Atom definitions —
   confusingly named, but that's what it holds), `journey_metadata_clusters` (Molecule/Semantic-Field
   definitions), and `journey_atom_affinity_rules` (the real Semantic Affinity Field bonding mechanism —
   tag-based `attraction_tags`/`min_attraction_overlap`, scoped `master_data` or `channel_current`) are the
   existing tables. A new domain's Atoms/Molecules are new rows and new tag values here, computed dynamically
   via `server/lib/eidosBonding.js` — never a static pre-declared membership list (see the Career Molecules
   mistake this skill exists to prevent).
6. **An additive column on an existing table?** If the concept is a genuinely new *fact* about an existing
   row (not a new shape), add a column — matches the existing convention of idempotent `ALTER TABLE ... ADD
   COLUMN IF NOT EXISTS` calls at the bottom of `server/db.js bootstrap()`.

**Only after all six are checked and genuinely don't fit** is a new table justified — and even then, if it
connects to a Channel Journey at all, it must register with `tributaryRegistry.js`'s satellite pattern
(`childKind: 'satellite'`), matching `resume_output_projections`' precedent, not a standalone table with its
own bespoke insert code.

## Check existing configuration surfaces before inventing new ones

| Concept | Existing surface |
|---|---|
| Riverbed (client scope: Member or Member Organization) | Not a table — resolved from `journey_data_rods.user_id`/`org_id`. See `server/lib/riverbedRegistry.js`. |
| Channel (definition) / Channel Rod (instance) | `journey_rod_types` / `journey_data_rods` |
| Tributary | `server/lib/tributaryRegistry.js`'s `TRIBUTARY_TYPES` |
| Current (rule set) | `server/lib/currentRegistry.js` — config registry, org-override seam, no table until a real org needs persisted custom Currents |
| Current Arc (resulting temporal state) | `journey_rod_events`, event-sourced, reconstructed on read |
| Evidence Atom (definition / instance) | `journey_metadata_molecules` (definitions) / `journey_rod_evidence` (instances, `magnetic_properties` tags) |
| Semantic Affinity Field / bonding rule | `journey_atom_affinity_rules` (`scope_type`, `current_key`, `minimum_affinity`) + `server/lib/eidosBonding.js` (the real tag-overlap computation, ported from `src/lib/journeyEngine/bonding.js`) |
| Atom Cluster | Never persisted — computed on demand by `eidosBonding.js`'s `computeBonds()`. If you find yourself adding a table for "which atoms belong to this cluster," stop — that's the mistake. |
| Molecule (governed instance) | Reconstructed from `journey_rod_events`, not a separately overwritten snapshot table |
| Orbit (per-module UI + API + usage tracking) | `server/lib/usageTracking.js` + `analytics_events` + `server/lib/provisioningPolicyRegistry.js`'s `SALT_BASIN_TRACKED_INTERACTIONS` |
| Member Entitlement / provisioning process | `server/lib/provisioningPolicyRegistry.js`'s `resolveProvisioningTemplate()` — stages, modules, tracked interactions, security policy, org-overridable when a real org needs it |
| Agent Boundary | Design-stage only — not implemented anywhere. Reserve a nullable `agent_boundary_ref JSONB` column; do not claim enforcement that doesn't exist. |
| Fine-grained per-atom/molecule security | Extend `data_entitlements.scope` JSONB — decided precedent (`docs/salt-basin-master-build-member-org-reconciliation.md`), not a new table |

If a checklist item has no existing surface, that's a real gap — say so explicitly rather than silently
picking the nearest unrelated registry.

## Starter-kit guidance: a new organization standing up its own Salt Basin

This is the repeatable part — the "engine to help organizations create their initial Salt Basins." A new
org does **not** fork the schema. It configures the same substrate:

1. Define its Channels — new rows in `journey_rod_types` (or reuse the existing Member/Customer/Revenue
   Lifecycle types if its business shape matches).
2. Define its Tributaries — new `TRIBUTARY_TYPES` entries describing which Channels connect to which.
3. Define its provisioning template — an override entry `resolveProvisioningTemplate(orgId)` can resolve to
   (stages, modules, tracked interactions, security policy), following the exact seam already built for
   this in `provisioningPolicyRegistry.js` (`org_id NULL` = platform default, `org_id` set = override — same
   pattern the EIDOS definition tables already use).
4. Define its Currents — entries in `currentRegistry.js` describing entry criteria, port rules/stages, and
   minimum carry for its own Channel journeys.
5. Define its bonding rules — new `journey_atom_affinity_rules` rows (master-data scope for canonical rules
   that always apply, channel-current scope for rules specific to one journey context).
6. Wire its own multi-database sources through the existing L1 Ports schema (`data_ports`/
   `port_source_objects`/`port_source_fields`) and the Connected Apps mechanism (`server/routes/oauth.js`,
   `ConnectedAppsCard`) rather than a bespoke integration layer per org.

None of this requires a schema fork for the base case. If a real org's requirements genuinely can't be
expressed this way, that's a signal to extend one of the existing registries — see the checklist above —
not to start a parallel system for that org.

## Resolution rules

- **Prefer an existing registry entry over a new mechanism.** A new table proposal is a signal to re-walk
  the checklist, not a green light.
- Molecule state is **never** a static, pre-declared membership list — it's computed dynamically from
  bonding rules and reconstructed from events. If a "molecule" definition looks like `{ moleculeKeys: [...] }`
  with no attraction/affinity computation behind it, that's the exact anti-pattern this skill exists to stop.
- Usage/Orbit tracking is **already built** — route through `usageTracking.js`/`provisioningPolicyRegistry.js`,
  never a new analytics table.
- Agent Boundary and per-atom/molecule fine-grained security are **not yet implemented anywhere** — don't
  claim enforcement in a comment or doc that doesn't exist in code. Reserve the column, flag the gap.

## End-of-audit classification

For every new concept in the build being audited, classify it:

- **REUSES EXISTING SUBSTRATE** — cite exactly which rod_type/Tributary/event_type/tracked-interaction/
  Atom-Molecule-table/column it extends.
- **NEW TABLE, JUSTIFIED** — all six checklist items were a genuine poor fit; state why, and confirm it
  registers with `tributaryRegistry.js` if it connects to a Channel Journey.
- **NEW TABLE, NOT YET JUSTIFIED** — flag this before it ships. Don't let it through on "it's just a small
  table."
- **AGENT BOUNDARY / FINE-GRAINED SECURITY GAP** — reserved column added, enforcement not implemented,
  recorded explicitly rather than silently claimed.

## Output format

End every audit with:
1. What was rewired to reuse existing substrate in this pass (file + registry entry).
2. The classified list of every new concept found, one line per item, using the four labels above.
3. Any "NEW TABLE, NOT YET JUSTIFIED" items, called out separately so they aren't lost in the general list.
