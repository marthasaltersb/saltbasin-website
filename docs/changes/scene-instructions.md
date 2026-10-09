# Scene Instructions: connected data in 3D, defined step by step

Version 0.1 (proposed design, not built) · 2026-10-09 · Status: **awaiting owner approval**

## Traces to

- `tools/release-tracker-kit/` and the Salt Basin tracker demo (commit 89e3981): the first 3D board.
  There, features orbit as gems, but the rules were hard-coded in the page. This spec makes those rules data.
- World Variant Engine (`docs/salt-basin-world-variants-progress.md`):
  - Phase 3 Visual Encoding Profiles (`src/config/visual/worldVariantEncodingProfiles.js`, `VISUAL_CHANNEL`).
  - Phase 7 Interaction Intent layer. That layer is **not started**; this spec builds its first slice.
  - Phase 8 SYSTEM → ORGANIZATION → USER inheritance.
- Visual semantic registry (`src/config/visual/visualSemanticRegistry.js`) and crystal family
  (`src/lib/crystalGeometry.js`, "never fork a variant locally").
- Definition Studio gated stepper (`src/components/DefinitionStudioJourney.jsx`). This spec reuses its
  step-and-gate UI pattern, but not its localStorage persistence.
- L1 Ports data dictionary (`data_ports` / `port_source_objects` / `port_source_fields`).
- Tributary registry (`server/lib/tributaryRegistry.js`) as the catalogue of real relationships.

## What it is

A **Scene Instruction** is a saved, versioned definition with four parts:
1. **Data:** which data items appear.
2. **Objects:** which crystal object each item becomes, and which field drives which visual channel.
3. **Connections:** which real relationships are drawn between items.
4. **Interactions:** what each gesture does.

Admins and members both build them through a six-step procedure inside the World Shell (`/world`). A
renderer reads a published instruction and draws the user's real connected data. Nothing is hard-coded
in a page.

## The procedure (six steps, each gated)

Each step must validate before the next one unlocks, as in the Definition Studio. The plain-language
explanation of what was chosen stays visible beside every control.

| # | Step | The user decides | Gate (must pass to continue) |
|---|------|------------------|------------------------------|
| 1 | **Choose data** | A source from the Source Catalogue. Examples: "My Channel Rods", "Career Master", "Release features", or a Port object such as "Salesforce · Opportunity". Optionally narrow the items with filters on declared fields. | The source is one this user may read. The live count of matching items is shown, and zero items is allowed with an honest empty state. |
| 2 | **Define objects** | For each object kind in the source: the crystal form (only from `VISUAL_SEMANTIC_REGISTRY`), the label field, and up to 4 encodings: *field → visual channel*, e.g. `status → colour`, `score → crystal_scale`, `maturity → crystal_complexity`. Category colours come from a palette of brand tokens. | Every encoded field has a declared meaning: a Port `business_definition`, a registry metric in `METRIC_DEFINITION_REGISTRY`, or a source-declared field. No two encodings share a channel. Hot pink can only be an outline or line. |
| 3 | **Define connections** | Which relationships to draw, chosen from the ones the source declares. Examples: Tributary types, `journey_rod_entity_links`, evidence → rod, bug → feature. Also how each is drawn (path thickness or continuity; solid = observed, dashed = inferred) and the layout (orbit around parent, lattice, river path, or rings). | Only declared relationships can be picked; there is no free-text join. Each one shows how many links exist in the user's real data. |
| 4 | **Define interactions** | Rows of *when* (hover / select / double-select / drag / key) + *on* (an object kind or a connection) + *only if* (an optional condition on a declared field) → *do* (an Interaction Intent, below). | Every intent is one the active world variant can resolve. Gestures don't conflict. Any intent that changes data goes through the approval gate. |
| 5 | **Preview on my data** | Nothing new is chosen here. The scene renders with the user's own real data in a preview panel, next to a validation report: unmapped fields, items over the object budget, missing values shown as "not recorded", and links that point outside the user's scope. | The report has no blocking items. Missing values are never filled in or drawn as zero. |
| 6 | **Name and publish** | The name and description. The legend is generated from the definition (Explanation Mode), not written by hand. | Publishing goes through `useToolCategoryGate().run`. It creates a new version; earlier versions stay viewable. |

### Interaction Intents (first slice)

These are semantic actions, not camera code. The active world variant's profile decides how each looks,
as the Phase 7 plan says, and nothing moves nodes from inside a click handler.

| Intent | What the viewer gets |
|---|---|
| `SHOW_DETAIL` | A side panel with the item's declared fields and where each value came from. |
| `FOCUS_CONNECTED` | The item and everything one link away are highlighted; everything else dims. |
| `FILTER_TO` | The scene and any linked tables narrow to this item (what clicking a gem does on the tracker demo). |
| `ENTER_OBJECT` | A camera dolly into the item, then its children are shown as the next level (the "enter the object" transition from `OpportunityAgentOrbitWorld.jsx`). |
| `OPEN_RECORD` | Opens the item's existing screen, such as an opportunity, a resume output or a release record. *(slice 2)* |
| `PROPOSE_AGENT_ACTION` | Asks a named agent to propose a change. The proposal goes through the approval gate and never writes directly. *(slice 3; see the Agent Boundary gap)* |

## How it fits the platform (reuse-first audit, run before planning)

| New concept | Classification | Where it lives |
|---|---|---|
| A Scene Instruction (one definition) | **REUSES EXISTING SUBSTRATE** (recommended) | A new `rod_type` `scene_instruction` row in `journey_rod_types`, with one `journey_data_rods` row per definition. `user_id` / `org_id` is the Riverbed, so the scope comes for free. `current_stage` is the procedure step the author is on. The definition JSON lives in `metadata`. Needs the same `idx_rods_user_type` / `idx_rods_user_org_type` exclusion that `career_opportunity_target` has, because a user has many definitions. |
| Versions and procedure history | **REUSES EXISTING SUBSTRATE** | `journey_rod_events` on that rod: `scene_step_completed`, `scene_published` (full definition snapshot in `metadata`), `scene_retired`. Version history is reconstructed from events, with no second "versions" table. |
| Source Catalogue | **REUSES EXISTING SUBSTRATE** + config registry | `server/lib/sceneSourceRegistry.js`, a config registry in the style of `currentRegistry.js`. Each adapter declares its objects, fields, relationships, scope resolver and read check. External systems come through L1 Ports (`port_source_objects` / `port_source_fields`, whose `business_definition` / `value_domain` give field meaning) rather than a bespoke integration per source. |
| Relationship catalogue | **REUSES EXISTING SUBSTRATE** | `TRIBUTARY_TYPES` plus each adapter's declared links. No relationship can be drawn unless one of these declares it. |
| Object forms and visual channels | **REUSES EXISTING SUBSTRATE** | `VISUAL_SEMANTIC_REGISTRY`, `GEOMETRY_REGISTRY`, `VISUAL_CHANNEL`, `crystalGeometry.js`. Nothing new is invented in the procedure. |
| Interaction Intent enum | **REUSES / COMPLETES PLANNED SUBSTRATE** | New `src/config/visual/interactionIntentRegistry.js`. This *is* World Variant Phase 7's Interaction Intent layer, so it gets recorded in that tracker, not as a parallel mechanism. |
| Admin default → org → member layering | **REUSES EXISTING SUBSTRATE** | Riverbed scope on the rod: `org_id` NULL + `user_id` NULL = platform default (admin), `org_id` set = org, `user_id` set = member. Resolution follows `resolveAgentRoster()`'s 3-tier precedence. |
| Usage tracking | **REUSES EXISTING SUBSTRATE** | New `SALT_BASIN_TRACKED_INTERACTIONS.scene_instructions` entry: `scene_step_complete`, `scene_publish`, `scene_view`, `scene_intent`. |
| Renderer | New component, no new storage | One `ConnectedDataWorld.jsx` built on `crystalGeometry.js`. The server resolves an instruction into `{ nodes, edges, legend }` (`GET /api/scene-instructions/:id/graph`); the client only draws it. `SpatialJourneyWorld.jsx` is left alone, as the earlier risk assessment advised. |
| `PROPOSE_AGENT_ACTION` | **AGENT BOUNDARY GAP** | Reserved only. It uses `agent_definitions` and the approval workflow and proposes changes, never writes them. No sandboxing is claimed. |
| Member read limits on sources | **FINE-GRAINED SECURITY GAP** (partly) | Each adapter reuses the read check of the existing route it wraps. Per-field limits would extend `data_entitlements.scope`, which is not built yet. |

**New tables proposed: none.**

Config-audit self-check:
- Sources, forms, channels, palettes, intents and limits are all registry or definition data.
- The object budget per scene and the max encodings per object are configurable (proposed defaults: 500
  and 4).
- No member, org or source name is hard-coded.

## Proposed build order

1. **Slice 1:**
   - Two sources: "My Channel Rods" (rods + Tributaries + evidence) and "Release features" (the
     `release_*` tables; features, rounds, fixes and failed runs, admin only).
   - The six-step procedure in the World Shell.
   - Intents `SHOW_DETAIL`, `FOCUS_CONNECTED`, `FILTER_TO` and `ENTER_OBJECT`.
   - Preview, publish, version history and the generated legend.
   - Runs through the release loop with a training spec.
2. **Slice 2:**
   - L1 Ports sources (any connected system).
   - `only if` conditions and `OPEN_RECORD`.
   - Org-level instructions that members inherit and can override.
3. **Slice 3:**
   - `PROPOSE_AGENT_ACTION` through the approval gate.
   - Choosing a world variant per instruction (Crystal Basin, Orbital, …), with the semantics unchanged.

## Questions for the owner (needs a business decision)

1. **Storage:** is one Channel Rod per Scene Instruction right? The alternative is a key inside
   `member_configs` / `org_configs`. That is simpler, but it has no version history beyond draft and
   published.
2. **Sharing:** can a member share a published scene with others in their organization? If yes, who
   approves an org-wide scene: an org admin, or any member?
3. **Override:** when an org publishes a scene, can a member change only the look (colours, layout) or
   also which data and interactions it uses?
4. **Object budget:** is 500 objects per scene acceptable as the default limit, with items over it
   grouped into a summary gem?
5. **First data:** are "My Channel Rods" and "Release features" the right two sources for slice 1?
