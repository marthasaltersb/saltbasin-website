# Foundation and Scenes: build your world from your account, scene by scene

Version 0.3 (proposed design, not built) · 2026-10-09 · Status: **awaiting owner approval**

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-09 | Scene Instructions: six-step procedure for binding 3D objects to connected data (commit 626ec30). |
| 0.3 | 2026-10-09 | A person can hold **many** foundations: a personal career foundation, plus organization foundations reached through membership, each with its own database. The ownership, access, write-back and audit-history model lives in `docs/changes/foundation-rods-and-audit-history.md`, which takes precedence over the "one per account" wording below. |
| 0.2 | 2026-10-09 | Owner direction: the seven mapping questions (`tools/release-tracker-kit/MAPPING.md`) are the **foundation**. You set them up once after logging in, and every scene is built on top of them. |

## Traces to

- `tools/release-tracker-kit/MAPPING.md` (commit 1a91daf): the seven mapping questions this version makes
  foundational.
- `server/lib/releaseIntelligenceConfig.js` (`release_intelligence_rules`): the existing rule vocabulary
  (`failureClasses`, `dispositions`). Questions 6 and 7 reuse it instead of defining a second list.

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

## Your path after login

```
log in at saltbasin.net ─▶ /world
   │
   ├─ 1. Foundation (once per account or organization; editable and versioned later)
   │      the seven mapping questions, one screen each
   │      ─▶ summary in plain language + the release board drawn from your answers ─▶ publish v1
   │
   └─ 2. Scenes (as many as you like, one at a time)
          first scene offered automatically: "Release board", built from the foundation
          each new scene: choose data ─▶ objects ─▶ connections ─▶ interactions ─▶ preview ─▶ publish
```

Everything happens inside the World Shell (`/world`) after the same first steps it already runs (password
change, Career Portfolio consent). There is no admin-only route and no API-only setup. A member, an
organization admin and Betsy all use the same screens, each in their own scope.

## Layer 0: the Foundation (the seven questions)

The foundation answers one question: *what do the words in my project system mean to Salt Basin?* Every
scene later reads that vocabulary, so a scene never has to ask again what a "feature", a "round" or a
"bug" is.

Each question is one screen. A screen must pass its check before the next one opens.

| # | Screen | You answer | Check (must pass to continue) |
|---|---|---|---|
| 1 | **Your system and your feature** | Which system you use (Jira, Azure DevOps, Linear, GitHub, Asana, a spreadsheet, or "my own method"), and which one item type is a feature, plus the key that names it. | At least one real or example item key matches the pattern you gave. |
| 2 | **Your statuses → stages** | Your statuses, typed in or (slice 3) pulled from the system. Each goes to `build`, `integrate`, `validate`, `triage`, `fix`, "not started" or "done". | No status is left unmapped. |
| 3 | **One test round and its results** | What counts as one test pass, and where *steps passed / steps total* come from (test cases, acceptance criteria, checklist, CI report). | A results source is named. "QA said OK" is refused with an explanation. |
| 4 | **Bug → feature link** | How a bug is tied to its feature (parent, link, label, field). | Exactly one rule, so every bug resolves to one feature. |
| 5 | **Returning bugs** | How a reopened bug is recognised (same ID reopened, or a new ID that names the old one). | A rule is chosen. |
| 6 | **Business decisions** | Which status means "needs a business decision". It maps to `needs_business_definition` from `release_intelligence_rules.failureClasses`, so there is no second vocabulary. | Mapped, or explicitly "we don't have one". |
| 7 | **When a person takes over** | How many failed fix attempts before a bug goes to a person (default 2). | A whole number from 1 to 10. |

**Method templates.** Choosing Scrum, Kanban, stage-gate or SAFe on screen 1 pre-fills screens 2–6 from
the tables in `MAPPING.md`. Pre-filled answers are marked "suggested, please confirm" and are never
accepted on your behalf.

**Summary and publish.** After screen 7, you see:
- The foundation in plain language, e.g. "A Jira epic is a feature. *In QA* starts a test round…".
- The release board drawn from your answers, using your real data if connected, otherwise clearly
  labelled example data.

Publishing makes foundation version 1. Changing an answer later creates version 2. Every earlier version
stays viewable, along with what it changed.

## Layer 1: Scenes

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
| 1 | **Choose data** | A source from the Source Catalogue. The foundation's terms (features, rounds, bugs, agents) come first, in *your* words. Other sources follow. Examples: "My Channel Rods", "Career Master", "Release features", or a Port object such as "Salesforce · Opportunity". Optionally narrow the items with filters on declared fields. | The source is one this user may read. The live count of matching items is shown, and zero items is allowed with an honest empty state. |
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
| The Foundation (one per account or organization) | **REUSES EXISTING SUBSTRATE** | A new `rod_type` `project_foundation`, one `journey_data_rods` row per Riverbed. The existing unique index (one rod per user per rod_type) already enforces "one foundation" with no exclusion needed. `current_stage` is the question you are on. Each confirmed answer is a `foundation_answer_confirmed` event; publishing is `foundation_published` with a snapshot. Versions are rebuilt from events. |
| Your project system and its fields | **REUSES EXISTING SUBSTRATE** + one gap | L1 Ports: `data_ports` (`port_type 'project_management'`, `native_system_type 'jira'` …), the feature item type as a `port_source_objects` row, status/link fields as `port_source_fields` with `business_definition`. The status → stage map goes in that field's `metadata.stageMap`. **Gap:** `data_ports` has `org_id` but no user owner, so a member without an organization can't own a port yet. The fix is an additive `owner_user_id` column (checklist item 6). |
| Questions 6 and 7 per account | **REUSES EXISTING SUBSTRATE** | Values from `release_intelligence_rules` (`failureClasses`) stored on the foundation rod. The tracker resolves *foundation value → platform default*, the same precedence idea as `resolveAgentRoster()`. |
| Scenes hang from the foundation | **REUSES EXISTING SUBSTRATE** | New `TRIBUTARY_TYPES.foundation_scene_provisioning` (hierarchical: `project_foundation` → `scene_instruction`), created through `createJourneyTributary()`. |
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

**New tables proposed: none.** One additive column is proposed: `data_ports.owner_user_id`.

Config-audit self-check:
- Sources, forms, channels, palettes, intents and limits are all registry or definition data.
- The object budget per scene and the max encodings per object are configurable (proposed defaults: 500
  and 4).
- No member, org or source name is hard-coded.

## Proposed build order

1. **Slice 1: Foundation + first scene.**
   - The seven-question procedure in the World Shell, with typed-in answers and method templates.
   - The summary, publishing and version history.
   - The release tracker reads questions 6 and 7 from the foundation.
   - The "Release board" scene is created automatically from the foundation: the 3D crystal board from
     the demo, now driven by data instead of hard-coded rules.
   - Runs through the release loop with a training spec.
2. **Slice 2: the scene builder.**
   - The six-step procedure for any further scene.
   - Sources: foundation terms and "My Channel Rods".
   - Intents `SHOW_DETAIL`, `FOCUS_CONNECTED`, `FILTER_TO` and `ENTER_OBJECT`, and the generated legend.
3. **Slice 3: live systems.**
   - Pull statuses and items from a connected system instead of typing them, plus webhook updates.
   - Jira, Linear and Azure DevOps are **not** in today's 14 OAuth providers
     (`server/lib/oauthProviders.js`), so each one is a new provider entry.
   - `only if` conditions, `OPEN_RECORD`, and org foundations that members inherit.
4. **Slice 4:**
   - `PROPOSE_AGENT_ACTION` through the approval gate.
   - Choosing a world variant per scene, with the meaning unchanged.

## Questions for the owner (needs a business decision)

New in 0.2:

A. **Whose foundation:** one per person, one per organization, or both (the organization sets it,
   members inherit it and can only add to it)?
B. **First login:** should a new account be *required* to finish the foundation before anything else in
   `/world`, or should the foundation just be the first card on the home screen?
C. **First live system:** which system should slice 3 connect to first: Jira, Azure DevOps, Linear,
   GitHub or spreadsheets?

From 0.1, still open:

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
