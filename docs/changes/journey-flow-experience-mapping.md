# Change spec — Journey flow to experience: structured bindings per shape, mapped to the user experience, compiled into a journey the platform runs

Feature key: `journey-flow-experience-mapping` · Release: `2026-10-10-production-hardening-resume` · Version 1 (built) · 2026-10-11
Training spec: `docs/training/journey-flow-experience-mapping.md` (version 1, written by the build agent; the integrator freezes it as baseline v1)
Depends on: `journey-flow-studio` (baseline v1 frozen at commit 3bfc16e).

## Owner direction

> Build the process flow builder ... that becomes the user journey definition experience. Each shape, colour, relationship, process
> connection or decision captures gates, variants, actors, decision trees, capabilities, system authority, action authority, system
> name and more. Those then translate to the user experience: which static asset, scene, visual animation, interaction or
> destination link belongs to each one. (2026-10-10)

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| `journey-flow-studio` (`docs/changes/journey-flow-studio.md` v1, `docs/training/journey-flow-studio.md` baseline v1, commit 3bfc16e) | The editor, definition row `flow_studio_definition`, flow rods and history events are extended, not forked. Its free-text fields (`gateKey`, `actors`, `systemName`, `systemAuthority`, `actionAuthority`, `sceneAsset`, `animation`, `destinationLink`) keep working unchanged; the new structured fields sit beside them. Its Publish and its four-line impact preview are unchanged (baseline J7.1). |
| `graphify-data-model-map` (`docs/changes/graphify-data-model-map.md`, commit f69013e) | The data objects and fields a step reads or writes, and the field a branch condition tests, are picked from `dataModelMap.loadCatalog()` (the committed catalog); `information_schema` is the fallback when it is not generated. Columns whose names look like secrets are never offered. |
| `render-bindings` (`docs/changes/render-bindings.md` v2, baseline v1) | The experience channels are render bindings: an internal `journey-flow` port + rendering + six default bindings in `renderBindingRegistry.js`. Mapping a channel on or off is an override in `render_binding_overrides`. The internal rendering/port is filtered out of the Render Bindings screens, route and MCP settings tool, so baseline `render-bindings` behaviour is unchanged. |
| `platform-mcp` (`docs/changes/platform-mcp.md`) | 7 MCP tools + 3 parity rows added, append-only manifest updated, `node scripts/check-interface-parity.mjs` passes. Three new scopes (see Behaviour changes). |
| Journey engine (`scenarioLibraryApply.js`, `journey_scenarios`, `journey_gate_definitions`, `journey_metadata_molecules`, `journey_stage_gates`, `journeyDefinitionFromPersistedRod`, `GET /api/journey-rods/me/world`) | The compiled journey is applied through `applyScenarioLibrary()`, the same applier the scenario library uses. `me/world` and `journeyDefinitionFromPersistedRod` pass the stage's `flowJourney` / `experience` through (additive). |
| `world-shell-layers` (`docs/changes/world-shell-layers.md`) | The World Shell layer picker offers `journeys`, `outputs` and `island:<id>` from `ISLAND_REGISTRY` (the vocabulary of the layer stack). |
| `capabilityParity.js`, `finalizationGates.js` | Three parity rows; activation runs `assertReadyToFinalize` (server) and `useToolCategoryGate().run` (client). |
| Global change standard (CLAUDE.md, 2026-10-10) | Activation and channel mapping each return an impact preview and a token (409 `impact_approval_required`); the same call with the token is the one approval and applies automatically; the history row records source action `journey_publish` (or `settings`) and who approved. |

## Reuse audit (channel-journey-architecture + config-audit, before and after)

| Concept | Classification |
| --- | --- |
| Structured bindings (variant, actor, capability, system of record, action authority, data read/write, World Shell layer, crystal variant, interaction) | REUSES EXISTING SUBSTRATE: fields in the existing definition row (`config_state` `flow_studio_definition`), values in the flow document `meta`. New field types `pick` / `multipick` with a `source`. No column, no table. |
| Branch condition | Additive `bind.condition` on an edge in the flow document (`schemaVersion` stays 1; absent = no condition). |
| Option lists (actors, licences, interactions) | SHOULD BECOME CONFIGURATION, converted: `definition.lists`, edited on the Settings screen. |
| Capabilities, permissions, data ports, layers, crystal variants, data fields | Read live from `capabilityParity.js`, `MCP_SCOPES`, `renderBindingRegistry.PORTS`, `ISLAND_REGISTRY`, `CRYSTAL_VARIANTS`, the data model catalog. Nothing copied. |
| Experience channels | REUSES the render-bindings registry (see Traces to). Not a parallel mechanism. |
| Compiled journey | REUSES EXISTING SUBSTRATE: `journey_scenarios` + `journey_gate_definitions` (via `applyScenarioLibrary`), `journey_metadata_molecules` (one per step, `source_paths` = the data it reads/writes), `journey_stage_gates` for a new rod type `journey_flow_run` (insert-only row in `journey_rod_types`, created at first activation, never in bootstrap). Branch conditions, experience and bindings ride in `journey_scenarios.metadata.flowJourney`. Activation is a `journey_rod_events` row on the flow rod. No new table. |
| Gate key pattern, condition operator kinds, the "closing stage" key `f<id>__end` | INTENTIONAL PLATFORM CONSTANT (compiler primitives). Operator labels are shown in the UI. |
| Who may activate | CONFIGURATION: `definition.access.activateJourney`, default `admin` only (it changes journeys other members run). A permission any role or profile can be granted, not an admin-role check. |
| Agent boundary / fine-grained security | GAP, unchanged and not claimed: the access policy is role based. |

## What changed

### Studio definition (additive; read-time merge for saved definitions)
- Sections `structured` (Structured bindings) and `extension` (Extension fields; empty by default, hidden while empty; any field an administrator adds there appears on every step).
- Fields: `bindVariants`, `bindActors`, `bindCapabilities`, `bindSystemOfRecord`, `bindActionAuthority`, `bindReads`, `bindWrites` and, in Experience binding, `worldLayer`, `crystalVariant`, `interactionKind`. Gate key and System name stay the existing text fields; the compiler validates the gate key.
- Shape flag `fanout` (the parallel gate: all branches run, so branches need no condition).
- `lists` (actors, licences, interactions) and `access.activateJourney`.
- A definition saved before this feature gets the new sections/fields appended when it is read (by key, never overwriting). The first save stores them and sets `bindingsMerged`, so a later removal sticks. Nothing is written by the read.

### Compiler (`src/lib/flowJourneyCompile.js`, pure)
The Future state compiles into: ordered steps with their bindings; gates (a Decision / Parallel gate, or any step with a Gate key) with branches and conditions; one molecule per ordinary step; per gate the molecules of the steps leading to it (walking back to the previous gate) and the actor roles of those steps; a closing stage `f<id>__end` that asks for any step after the last gate; the path per variant; and the experience of every step per channel. Errors block activation (no steps, no gate, a gate without a valid unique Gate key, a half-filled condition). Warnings do not (a reference not in the platform list, an invalid destination or asset, a gate with several unconditioned branches, a gate with nothing leading into it). Unmapped channel = "not mapped"; mapped with no value = "not set"; a bad value = "invalid". Nothing is invented.

### Server (`server/lib/flowJourney.js`, one implementation behind routes and MCP)
`bindingCatalogs`, `dataObjects` / `dataFieldsOf`, `experienceChannels` / `saveExperienceChannels` (impact + token), `previewJourney` (published or saved draft; includes impact on running journeys and members and the token), `activateJourney` (needs `activateJourney`, the token and the finalization gate; registers molecules, gate stages, then applies the scenario; records `flow_journey_activated` with source action `journey_publish`), `activeJourney` (reads back the platform tables), `startTestJourney` (the existing `createUserJourneyRod`).
Routes under `/api/flow-studio` (`/catalogs`, `/catalogs/data-objects`, `/catalogs/data-fields`, `/experience-channels`, `/flows/:id/journey-preview`, `/flows/:id/journey`, `/flows/:id/journey/activate`, `/flows/:id/journey/test-run`).

### Client
`FlowJourneyParts.jsx` + edits to `FlowStudioPanel.jsx`: structured pickers in the step panel (chips with Remove, selects, two-step data picker), the **Branch condition** group in the connector panel, the **Journey** button and panel (preview, generated user journey per variant, gates, experience map table, impact, **Approve and activate**, active journey read-back, **Start a test journey**), Settings cards **Option lists for structured bindings** and **Experience channels**, and the **Activate a published flow as a journey** access row.

### Interface parity
3 parity rows (`flow-journey-*`), 7 MCP tools in `mcpFlowStudioTools.js` (scopes `flowjourney.read`, `flowjourney.write`, `flowjourney.publish`); parity script reports 131 of 131 capabilities in all three interfaces. Phone (390px): the same single-column screens, every control 44px, the experience table scrolls inside its own box.

## Behaviour changes to know
- New MCP scopes `flowjourney.read|write|publish` appear as three more scope checkboxes on Connected Agents. They are separate from `flows.*` on purpose, so a token that holds only `flows.read` and `flows.write` still lists exactly the same 15 tools (`journey-flow-studio` baseline J13.2). Proposed amendments, not edited here: `platform-mcp` J1.4 (scope checkbox count and order) and the J2.1 tool count were already behind `flows.*`; the new scopes widen that existing drift.
- The Render Bindings screens, `/api/render-bindings/settings` and the settings MCP tool filter out the internal `journey-flow` rendering, port and bindings.
- `GET /api/journey-rods/me/world` stages carry an extra `flowJourney` key (null for every other scenario).
- A first `Journey` panel open on an unpublished flow shows the saved draft; asking for the published version before the first publish answers 409 `not_published` (shown as a plain red message).

## Known limitations
- The World Shell and Spatial Journey World receive the experience and branch data (`stage.flowJourney`, `stage.experience`) but do not yet draw a scene from it; the studio's preview and the read-back are the places to see it. A gate's own "experience" is the gate shape's; the steps that lead to it carry theirs under `flowJourney.steps`.
- A journey's `requiredActorRoles` are enforced by the existing engine only once actors are assigned to the rod, so a test journey stays at its first gate until then (honest platform behaviour, not changed).
- Actor options are a configured list, not read from a profile registry (none exists; `security-provisioning-model` owns it). Licence options are a configured list.
- The condition checks one field with one operator; compound conditions are not modelled.
- Per-scenario overrides apply to the step bindings (as for every field); the compiled journey uses the base values and lists each variant's path.

## Initial check results (build agent, 2026-10-11)
- `npm run build` passes; the server boots on a fresh database; `node scripts/check-interface-parity.mjs` passes (131 of 131); `node scripts/release-spec-baseline.mjs check --all` passes with baseline v1 frozen for this feature (58 scored steps).
- Every journey of the training spec was walked in Chromium against a fresh database: Journeys 1-8 with the member and administrator windows at 1280x900, Journey 9 (token, MCP list/calls, API 403/409/404) and the edge cases E.1-E.4 once each, Journey 10 at 390x844 with touch (no sideways scroll, all targets at least 44px); E.5 checked through the API. All passed. Fixes made during the walk: a success message cleared by the panel reload after activating, a scene key such as `scene.order-check` wrongly flagged invalid, and an unpublished flow opening the Journey panel with a 409 error instead of its saved draft.
- Not verified: drawing a scene from `stage.flowJourney` in the Spatial Journey World (data is passed through only); the real-model agent draft (unchanged).

## Fix notes per round (appended by fix agents)
(none yet)

## Fix notes — round 1
Checks run: `npm run build` passes; `node --check server/lib/flowJourney.js` passes. Not run: a browser walk of J10.4 and the other journeys, and a live activate/test-run call (no browser or database session was used in this fix pass), so T1, B8, B12 and B13 are unverified at runtime.

- **journey-flow-experience-mapping-T1** — CSS only: `.fs-scroll .fs-table { width:max-content; min-width:100%; overflow-wrap:normal; word-break:normal }`, `th/td min-width:5.5rem`, `.fs-pill { white-space:nowrap }`. Files: `src/components/admin/FlowStudioPanel.jsx`. Check: build only; still to re-check at 390px (no page sideways scroll, `.fs-scroll` scrollWidth > clientWidth).
- **journey-flow-experience-mapping-B8** — The Spatial Journey World deal-journey stage panel now lists `stage.experience` (channel, display value, link as an anchor, "not set"/"not mapped" as the channel reports). Files: `src/components/SpatialJourneyWorld.jsx`. Not done: World Shell layer navigation (pushing a world layer through `useWorldLayers`) and a crystal-variant render from the channel; those need an owner decision on how a gate's world-layer value should navigate. Proposed training step in the fix report.
- **journey-flow-experience-mapping-B10** — Not changed. Owner question: is one condition per connector acceptable, or must a connector hold an all/any list of conditions?
- **journey-flow-experience-mapping-B11** — Not changed. Owner question: should each variant compile to its own scenario, or one scenario with per-variant experience and bindings under `flowJourney.variants`?
- **journey-flow-experience-mapping-B12** — `startTestJourney` records the starter as every actor role of the scenario (`journey_rod_actors`, status complete, `contribution.testRun: true`); the journey preview states this. Files: `server/lib/flowJourney.js`.
- **journey-flow-experience-mapping-B13** — The activation token now hashes `runningJourneys` and `atRemovedGates`; `activateJourney` returns ok with `alreadyActive: true` and an "already active" message, writing no event and applying nothing, when the stored `journeyActive.token` equals the new token. Files: `server/lib/flowJourney.js`.
