# Change spec — Journey flow studio: a metadata-driven, persisted, downloadable process flow builder

Feature key: `journey-flow-studio` · Release: `2026-10-10-production-hardening-resume` · Version 1 (built) · 2026-10-10
Training spec: `docs/training/journey-flow-studio.md` (version 1, written by the build agent; the integrator freezes it as baseline v1)

## Owner direction

> Build the process flow builder as a metadata-driven, persisted function that is also easily downloaded, and that becomes the
> user journey definition experience. The configuration studio goes through defining the admin / config setup for the product:
> each shape, colour, relationship, process connection or decision captures gates, variants, actors, decision trees,
> capabilities, system authority, action authority, system name and more. Those then translate to the user experience: which
> static asset, scene, visual animation, interaction or destination link belongs to each one. (2026-10-10)

Source requirements: the owner's prototype and its requirements/coverage spec (`process-flow-builder.html`,
`process-flow-builder-spec.md`, not in git). R1-R7 are all built; the five Part 5 gaps are closed (table below).

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| Process flow builder prototype and spec, R1.1-R7.8 and Part 5 gaps (owner upload, 2026-10-10) | Every requirement ported; gaps closed. Prototype fictional/real-name preset data was NOT copied: seed templates are new fictional data. |
| `render-bindings` (`docs/changes/render-bindings.md` v2, `docs/training/render-bindings.md` v1) | Pattern followed for: one server module shared by routes and MCP tools, impact preview + approval, `config_state` row for configuration, parity rows. |
| `platform-mcp` (`docs/changes/platform-mcp.md`) | MCP registry (append-only), scopes, `capabilityParity.js`, `scripts/check-interface-parity.mjs`. 16 tools / 7 parity rows added. |
| Channel Journey substrate (`journey_data_rods`, `journey_rod_events`, `journey_rod_types`) | Flows and templates are rods of type `journey_flow`; every version is an event. Same approach as `career_opportunity_target`. |
| `world-shell-layers` (`docs/changes/world-shell-layers.md`) | The studio is a World Shell island (`componentId flowStudio`) opened as a layer. |
| `in-app-release-loop` / `platform-agent-runner` | Agent draft uses the in-app agent path conventions (fixture provider when `AGENT_RUNNER_FIXTURE_WORKER=1`). |
| `finalizationGates.js` | Publishing goes through `assertReadyToFinalize` (server) and `useToolCategoryGate().run` (client). |

## Reuse audit (channel-journey-architecture + config-audit, before and after)

| Concept | Classification |
| --- | --- |
| Flow / template documents | REUSES EXISTING SUBSTRATE: `journey_data_rods` row, new `rod_type = 'journey_flow'` (`journey_rod_types` row, insert-only). The two partial unique indexes on `journey_data_rods` gain `journey_flow` in their exclusion lists (same precedent as `career_opportunity_target`): a member holds many flows. |
| Version history, publish, restore, import, archive | REUSES EXISTING SUBSTRATE: `journey_rod_events` rows (`flow_version_saved`, `flow_published`, `flow_imported`, `flow_archived`) carrying the document snapshot, actor, version and a source action. No second history table. |
| Shape types, colours, sizes, execution/concurrency modes, field sections and fields, validation rules and messages, limits, access policy | REUSES EXISTING SUBSTRATE: `config_state` row `flow_studio_definition` (versioned, +1 per save with a note, history kept in the row); platform default in `flowStudioDefinition.js`. Edited on the Settings screen. SHOULD BECOME CONFIGURATION items converted: all of the above. |
| Seed templates | INTENTIONAL PLATFORM CONSTANT: a read-only code registry (`flowStudioSeedTemplates.js`, append-only, fictional); using one copies it into the person's own flow. Never written to member rows by seed/bootstrap. |
| Drawing kinds (`rect`, `diamond`, `circle`, `flag`, `pill`) and validation rule kinds | INTENTIONAL PLATFORM CONSTANT: the renderer/validator primitives; which shapes use which kind, colours, severities, enabled flags and messages are configuration. |
| Experience binding fields (scene/asset, animation, destination link) | Fields in the definition (`binding` section), not columns. Translated to a journey definition by `toJourneyDefinition()`. |
| Agent boundary / fine-grained security | AGENT BOUNDARY / FINE-GRAINED SECURITY GAP: unchanged and not claimed. The studio's access policy is role-based (admin, member) only. |
| New tables | None. |

## What changed

### Data model (additive only)
- `journey_rod_types` row `journey_flow` (insert-only, `db.js`). Unique-index exclusions extended. Nothing is backfilled or reseeded for existing rows.
- Flow rod `metadata`: `{ kind: 'flow'|'template', name, domain, description, version, publishedVersion, publishedAt, visibility: 'private'|'org'|'platform', orgId, draft: <doc>, published: <doc>|null, derivedFrom: {type:'seed'|'template'|'flow', key|id}, archived }`.
- The flow document (`schemaVersion 1`, format `salt-basin-journey-flow`): `states.{current,future}.{nodes, edges, lanes:[{id,label}], scenarios[]}`. Node: `id, type, x, y, label, lane, execMode, concurrency, scenarioTags[], meta:{base:{...}, <scenario>:{sparse overrides}}, resolves:[{nodeId, kind}]`. Edge: `id, from, to, label, params, notes, scenarioTags[], overlays:{<scenario>:{label,params,notes}}`. Schema-versioned: a newer schema is refused on import with a plain message; breaking changes would be explicit migrations keyed off `schemaVersion`.
- Config row `flow_studio_definition`: `{ version, definition, history[] }`.

### Part 5 gaps closed
| Gap | Closed by |
| --- | --- |
| Lane labels never persisted (R2.7) | `lanes:[{id,label}]` per state in the document, edited under **Lanes**, saved, exported, templated; nodes carry `lane` by the band they sit in. |
| No Current-to-Future link | Future steps carry `resolves[{nodeId, kind: pain\|handover\|leakage}]`, picked in the step panel; a green dot marks them; validation rule `dangling_resolve` flags a link whose Current step no longer records that problem. |
| No scenario content overlay on connectors | `edge.overlays[scenario]` (label, params, notes), edited in the connector panel when a scenario is active, drawn on the canvas for that scenario, exported in the journey definition. |
| No undo/redo, no structural validation | Undo/Redo (100 steps, typing coalesced, Ctrl+Z / Ctrl+Y) and the **Check flow** panel (orphans, single-branch gates, unreachable steps, missing labels, dangling links), rule severity/enable/message configurable. Publish is blocked by errors, not by warnings. |
| Templates browser-only | Templates are rods: `private` (owner), `org` (members of the owner's organization), `platform` (everyone); sharing needs the `shareTemplate` permission. |

### Server
- `server/lib/flowStudioDefinition.js` (default definition, validation, load/write), `flowStudioSeedTemplates.js`, `flowStudio.js` (all behaviour), `mcpFlowStudioTools.js` (16 tools), `routes/flowStudio.js` mounted at `/api/flow-studio`.
- Pure, shared with the browser: `src/lib/flowStudioDoc.js` (normalise, validate, import check, journey translation, JSON/HTML export) and `src/lib/flowGeometry.js` (shape drawing, connector paths).
- Permission policy in the definition: `access.create` (create/edit/save/import/agent), `access.publish`, `access.shareTemplate`, `access.editDefinition` (roles `admin`, `member`). Defaults: members and admins create and publish; only admins share templates and edit the definition. Enforced in the server functions, so the website, API and MCP tools all obey it. Administrators must always keep `editDefinition`.
- Global change standard: publishing, overwriting/deleting a template, and a definition change that affects saved flows each return an **impact preview** with a token (409 `impact_approval_required`); repeating the call with the token is the one approval and applies automatically. Every history row records its **source action** (`editor`, `template_use`, `import`, `restore`, `publish`, `mcp`, `api`, `agent`, `create`). A definition change that removes a shape used by a saved flow or seed template is refused outright.
- Download: JSON (`format`, `schemaVersion`, whole document), a single self-contained HTML viewer (flow embedded, Current/Future and scenario switch, works offline), and a **journey definition** (steps with actors, system name/authority, action authority, capabilities, gate key, experience binding; gates with branches; variants; transitions; Future-to-Current resolves). Import validates and answers in plain language.
- Agent draft: `agentDraft()` returns a draft for one step or connector, never applied until the person clicks Apply and saves. Provider `fixture` when `AGENT_RUNNER_FIXTURE_WORKER=1` or `FLOW_STUDIO_FIXTURE=1` (tests, no network); otherwise the Anthropic key path with the run-cap check, failing with a plain message and no change when there is no key.

### Client
- `src/components/admin/FlowStudioPanel.jsx`: Flows / Templates / Settings tabs; editor with SVG canvas (extruded 3D shapes in Salt Basin tokens, execution badge U/S/H, parallel badge, dots for saved spec / pain / resolves), add-shape buttons generated from the definition, Select / Connect / Delete modes (tap steps, no hover), drag or arrow-key move, inspector with definition-driven sections, scenario overrides with copy/clear, lanes, check panel, history with restore, publish impact card, export links, save-as-template, agent draft.
- Wired as World Shell island `flowStudio` (nav row `journey-flow-studio`, `defaultMemberConfig.js` member tab, Classic Tools fallback nav, `worldIslands.js`). Existing members get the tab through the existing read-time additive merge.
- Phone (390px): one column, tap targets 44px, canvas scrolls inside its own box, no horizontal page scroll.

### Interface parity
Seven parity rows (`flow-studio-*`) in `capabilityParity.js`; 16 MCP tools in `mcpFlowStudioTools.js` (scopes `flows.read`, `flows.write`, `flows.publish`); `node scripts/check-interface-parity.mjs` passes.


### Added by the second build agent (2026-10-11)
- **Steps and connectors** list under the drawing: the whole flow as tappable buttons (one per step, one indented per outgoing connector). It is the phone and keyboard path for selecting, and for drawing (in Connect mode two taps in the list draw an arrow; the same step twice makes a self-loop) and for Delete mode. The drawing remains for desktop pointing and dragging.
- **Replace an existing template** (R6.3, overwrite and re-save) is now reachable in the Save as template card (**Template to replace** + **Replace template**, impact preview, **Approve and replace**); the server function and MCP tool already existed.
- Flow names are unique per owner: creating, importing or using a template with a name already in use appends ` (2)`, ` (3)`... so a person (and a test) can always tell two flows apart.
- Publish impact preview compares the published document with the draft after normalising both, so a flow no longer reports phantom "changed" steps after a reload.
- Validation messages for gates and missing labels reworded in plain words (a gate needs at least two branches; there is no double-click rename).
- The agent draft goes through the in-app agent governance (`checkAndRecordRunAllowance`, key lookup). It is not filed through `recordAgentLlmUsage` because the studio has no `agent_definitions` row yet (listed under Known limitations).

### Config audit and reuse audit, after the build
Converted to configuration: shape types, colours, sizes, exec/concurrency modes, sections, fields, checks (severity, enabled, message), limits, access policy (`config_state` row `flow_studio_definition`). Classified remainder: drawing kinds and rule kinds (INTENTIONAL PLATFORM CONSTANT: renderer/validator primitives); the Settings screen's two role names `admin`/`member` and the four access labels (TEMPORARY PROTOTYPE DEBT: the platform has no role registry to read them from; the security-provisioning-model feature owns it); seed templates (INTENTIONAL PLATFORM CONSTANT, append-only, fictional); the in-builder list of scenario/lane limits live in the definition. No new table was added; the Channel Journey substrate (`journey_data_rods`, `journey_rod_events`, `journey_rod_types`) carries flows, templates and history.

## Behaviour changes to know
- Unique-index change on `journey_data_rods` (exclusion list only; existing data untouched).
- A saved definition with an invalid shape falls back to the platform default and says why (shown on the screen).
- Publishing replaces the published document in place; history keeps every earlier published version as an event.

## Verified (initial check)
See the end of this file; the builder's walk of every training journey is summarised there.

## Known limitations
- The agent draft call is not yet recorded in `agent_llm_usage` (no `agent_definitions` row for the studio agent); only the run allowance check applies.
- The Graphify visual of the existing data model was not part of this build's task text and is NOT built; the flow studio can host it later by importing a generated flow document.
- Roles are `admin` and `member`; per-organization roles and per-flow sharing lists are not modelled (`org` visibility is "members of the same organization").
- No multi-select or bulk edit; no live collaborative editing (a stale save is refused with a plain message instead).
- Platform-level `visibility: platform` templates are shared by an administrator only.
- "Architecture mapping" and "data model requirements" remain free text (no registry reconciliation).

## Initial check results (build agent, 2026-10-11)
- `npm run build` passes; the server boots on a fresh database; `node scripts/check-interface-parity.mjs` reports no `flow-studio-*` gap (the one listed gap, `release-tracker-admin`, belongs to another feature).
- Every journey of `docs/training/journey-flow-studio.md` (Journeys 1-12 and edge cases E.1-E.7, Journey 13's MCP and API steps) was walked in Chromium against a fresh database: Journeys 1-12 with an automated walker at 1280x900 and again at 390x844 (touch), Journey 13 and the edge cases once each. All checks passed after these fixes made during the walk: phantom "changed" steps in the publish preview, a canvas that overflowed the viewport on a phone (grid column needed `minmax(0,1fr)`), ambiguous duplicate flow names, gate and label messages, a missing UI path for template replacement, and no list alternative to the drawing.
- Not verified: the real-model path of the agent draft (tests use the offline fixture by design), and drag-moving a shape with a finger.

## Fix notes per round (appended by fix agents)
(none yet)
