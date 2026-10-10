# Change spec — Render bindings: every rendering is a view over mapped source data

Feature key: `render-bindings` · Release: `2026-10-02-application-packages` (0.2.0) · Version 2 (built) · 2026-10-09
Training spec: `docs/training/render-bindings.md` (version 1, written by the build agent)
Status: built. Version 1 (design, same day) is the owner direction, model, reuse audit and journeys below; the sections from "What changed" on describe what was built.

## Owner direction

> "I want the data to live separately from the rendered 3d crystals so that each rendering has to have a
> mapping back to a foundational database or data mapping source (which may or may not be data that exists in
> the Salt Basin database or through a connector or calculated from manual user entries adjacent or populates
> directly from user entry). The rendering is just how the user can see and interact with the data across
> multiple platforms within one place, and can provide a layer of control for ensuring that underlying data
> changes are updated and rendered not only in real time, but asynchronously as well to handle data changes
> that require approval, but ensure all impacts are handled accurately." — 2026-10-09

## Traces to

| Earlier spec / code | How this builds on it |
| --- | --- |
| Tracker prototype `tools/release-tracker/index.html` (commits `98e05dd`, `a65d21b`) | Its World view already separates an adapter (data → graph) from the renderer. This spec makes the mapping explicit, declarative and auditable, and applies it to every rendering. |
| `live-release-tracker` (feature brief in `docs/release-log/active-release.features.json`) | The platform tracker becomes the first consumer of render bindings. |
| L1 Ports — `data_ports` / `port_source_objects` / `port_source_fields` (`server/db.js`) | The registry of *where data lives*: platform tables, connectors, manual entry and calculations are all Ports. No parallel source registry. |
| Evidence — `journey_rod_evidence` (`source_type`, `source_reference`, `confidence`, `observed_at`) | The record of *a value and where it came from*. Bound values that live on a Channel Rod are read from here. |
| Events — `journey_rod_events` | Real-time and approval state changes are events; history (the time slider) is reconstructed from them. |
| Approvals — `agent_approval_workflows` | The ordered approval steps for changes that need approval (`pipeline = 'data_change'`). |
| Metrics — `server/lib/metricIntelligence.js` (`evaluateFormula`, metric definitions with `variables`) | Calculated sources. Their declared variables are how impact analysis knows what a calculation depends on. |
| Settlement — `journey_rod_settlement_states` (`surface … bedrock`) | A bindable measure of how corroborated a value is. The underwater world can map it to depth. |
| Visual metrics skill (`salt-basin-visual-metrics`) | Same principle: every displayed number has a defined meaning. A binding carries that meaning (business definition, unit, legend). |
| Career reconciliation (`career_reconciliation_tasks`, `careerReconciliation.js`) | The precedent for queued, human-resolved data changes; the generic version below follows its shape. |

## The model

```
 SOURCE (Port)                 VALUE (+ provenance)             BINDING                         RENDERING
 platform table / connector →  evidence row or port field   →   mark.channel ← source           crystal colour, size, ring,
 calculation / manual entry    value, observed_at, source,      + transform + legend            depth, satellites, chart line,
                               confidence, approval state       + change policy                 tile, table cell …
```

1. **Source = a Port.** Every source is a `data_ports` row: `port_type` is `platform_table`, `connector`
   (OAuth/Connected Apps), `calculation` (a `metricIntelligence` metric) or `manual` (user entry).
   Its objects and fields are `port_source_objects` / `port_source_fields`, each with a business definition,
   value domain and `editable_roles`. Data that is not in the Salt Basin database stays where it is; the
   Port describes it.
2. **Binding = one visual channel ← one source field.** A binding declares
   `{ rendering, mark, channel, source: { port_key, object_key, field_key } | { atom_key } | { metric_key },
   transform, legend, change_policy }`. Examples from the release world:

   | Rendering | Mark | Channel | Source | Transform | Legend |
   | --- | --- | --- | --- | --- | --- |
   | release-world | crystal | colour | `release_features.status` | status → tone | Crystal colour = feature status |
   | release-world | crystal | size | `release_features.steps_total` | ÷ max, 0.35–1 | Crystal size = test steps |
   | release-world | crystal | ring | `release_features.steps_passed ÷ steps_total` (calculation) | 0–1 arc | Gold ring = share passing |
   | release-world | satellite | colour | `release_bugs.status` | status → series | Satellite colour = bug state |
   | release-world | crystal | river | `release_agents.status = running` | boolean | Bubbles = agent working |
   | release-world | crystal | depth | settlement class of the feature's evidence | surface…bedrock → y | Depth = how settled |

   Bindings are configuration, not code: platform defaults in a code registry
   (`server/lib/renderBindingRegistry.js`, like `currentRegistry.js`), overridable per org or member through
   the existing config rows. A rendering **cannot draw a channel that has no binding** — the renderer only
   receives bound values. Each bound value carries its provenance, so any mark can answer "where does this
   come from, how fresh is it, who changed it, is a change pending?"
3. **Two update paths, chosen per binding by `change_policy`:**
   - **Real time (`live`).** A source change writes evidence or a port value and appends a
     `journey_rod_events` row (`event_type = 'value_changed'`). A server-sent-events channel tells every open
     rendering bound to that field; it re-reads and redraws. History is the event log, so the time slider
     replays any earlier moment.
   - **Asynchronous (`requires_approval`).** The change is recorded as a **proposal** — evidence with
     `status = 'proposed'` (additive column) plus a `change_proposed` event — and routed through the
     `agent_approval_workflows` steps for `pipeline = 'data_change'`. Renderings show it as **pending**: the
     current approved value stays drawn, the proposed value is drawn as a ghost (translucent mark, dashed
     ring) with its proposer and step. Approve → `change_approved` event, evidence becomes `approved`, the
     previous row `superseded`, all bound renderings update. Reject → `change_rejected`, the ghost disappears.
     Nothing is overwritten; both values and the decision stay in history.
4. **Impact analysis, before approval.** For a proposed change the platform computes, on demand, everything
   it touches: (a) every binding that reads the field (which renderings and marks change, before → after),
   (b) every calculation whose declared variables include it (metric values recomputed, before → after),
   (c) every Channel Rod connected through `tributaryRegistry.js` whose evidence derives from it. The
   approver sees this impact list; the snapshot is stored on the `change_proposed` event so the decision is
   auditable. Impacts are computed, not stored as a dependency table (the same rule as Atom clusters).
5. **Cross-platform.** A rendering can bind fields from several Ports at once (platform table + connector +
   manual), so one world shows data from multiple systems; each mark still points to its own source.
   Write-back to a connector happens only after approval, through the connector's own API, and its success
   or failure is recorded as an event. It is never silent.

## Reuse-first audit (salt-basin-channel-journey-architecture)

| Concept | Classification | Carried by |
| --- | --- | --- |
| Source registry (DB, connector, calculation, manual) | REUSES EXISTING SUBSTRATE | `data_ports` / `port_source_objects` / `port_source_fields`; new `port_type` values `platform_table`, `calculation`, `manual` (data, not schema) |
| Bound value with provenance | REUSES EXISTING SUBSTRATE | `journey_rod_evidence` (`source_type`, `source_reference`, `confidence`, `observed_at`) |
| Approval state of a value | REUSES — additive columns | `journey_rod_evidence.status` (`approved` default, `proposed`, `rejected`, `superseded`), `proposed_by`, `decided_by`, `decided_at`, via `ALTER TABLE … ADD COLUMN IF NOT EXISTS` |
| Change history, real-time feed, slider | REUSES EXISTING SUBSTRATE | `journey_rod_events` event types `value_changed`, `change_proposed`, `change_approved`, `change_rejected`, `writeback_failed` |
| Approval steps | REUSES EXISTING SUBSTRATE | `agent_approval_workflows` with `pipeline = 'data_change'` |
| Calculated sources and their dependencies | REUSES EXISTING SUBSTRATE | `metricIntelligence.js` metric definitions (`variables`, `formula`) |
| Corroboration → depth | REUSES EXISTING SUBSTRATE | `journey_rod_settlement_states.settlement_class` |
| Binding definitions | REUSES — config registry | `server/lib/renderBindingRegistry.js` (code registry with org/member override seam, like `currentRegistry.js`); persisted overrides in existing config rows, no table until a real org needs persisted custom bindings |
| Impact list | REUSES — computed, not stored | Computed from bindings + metric variables + Tributaries; a snapshot rides on the `change_proposed` event's metadata |
| Server-sent-events stream | New infrastructure, no storage | Express SSE endpoint fed by the events above |
| Release tracker data in `release_*` tables | REUSES — described by a Port | A `platform_table` Port describes `release_features` / `release_bugs` / `release_agents`; the data does not move |
| Approver roles | GAP (existing, recorded in `agent_approval_workflows`) | `required_role_label` is free text; there is no approver-role registry yet. Approval is admin-only plus the named label until one exists. |
| Field-level write permission | GAP, recorded | `port_source_fields.editable_roles` is declared but not yet enforced anywhere; enforcement lands with this feature and is tested. |

No new tables are proposed.

## Journeys the training spec must cover

1. Open a crystal → **Data map** shows every visual channel, its source (Port, object, field), the current value,
   observed time, source type and confidence.
2. A **live** source change (fictional fixture) redraws open renderings within seconds without reload.
3. A **requires-approval** change shows as a ghost with proposer and step; the **impact list** names every
   affected rendering, mark and calculated metric with before → after; approve updates everything bound;
   reject leaves the approved value; both decisions remain in history.
4. Time slider before and after the approval shows the old value, the pending ghost and the new value.
5. A manual-entry field: a member without the field's `editable_roles` cannot change it; a member with them
   creates a proposal or live change according to the binding's policy.
6. A connector write-back failure is shown on the mark and in the history, never swallowed.
7. A rendering asked to draw an unbound channel shows "not mapped", never a made-up value.
8. 390px, dark mode, reduced motion; fictional data only.

## What changed (version 2, build)

### Data model (additive only, no new tables)

- `journey_rod_evidence` gains `status TEXT NOT NULL DEFAULT 'approved'` (`approved | proposed | rejected | superseded`),
  `proposed_by BIGINT`, `decided_by BIGINT`, `decided_at BIGINT` (`server/db.js`, idempotent `ADD COLUMN IF NOT EXISTS` in bootstrap).
  Every existing evidence row reads as `approved`; nothing is backfilled.
- Subjects (the thing a rendering draws: a release feature, a board item) get a Channel Rod of rod_type `render_binding_subject`
  (`journey_data_rods`, no owner columns, `metadata.subjectKey` identifies it). Created lazily on the first change, never by seed/bootstrap.
  A bound value that lives on the rod is an evidence row whose `molecule_key` is `<port_key>.<object_key>.<field_key>`
  and whose `source_reference` is `change:<uuid>`.
- Ports are created lazily and insert-only by `ensureSeeded()` (`server/lib/renderBindings.js`): `release-tracker` (platform_table),
  `release-metrics` (calculation), `member-board` (manual), `board-metrics` (calculation), `sandbox-crm` (connector), each with objects and
  fields in `data_ports` / `port_source_objects` / `port_source_fields` (platform-wide rows, `org_id` NULL; never touches member rows).
  Two approval steps are inserted into `agent_approval_workflows` with `pipeline = 'data_change'` (`owner_review`, `final_approval`).
- Event types used on `journey_rod_events`: `value_changed`, `change_proposed`, `change_approved`, `change_rejected`, `writeback_failed`.
- Binding overrides: `config_state` row `render_binding_overrides` (TEXT, `JSON.stringify`), validated on read and write. An override may only
  turn a binding off, change its change policy, or map a channel that has no platform binding.
- Field edit permission: `port_source_fields.editable_roles` is now enforced (roles: `admin`, `member`). Derived and calculation fields are never editable.

### Server

- `server/lib/renderBindingRegistry.js`: code registry (append-only) of Ports, renderings and their channels, default bindings, and the override seam.
- `server/lib/renderBindings.js`: resolver (`readField`, `resolveSubject`: the renderer receives only bound values; unbound or disabled = `not mapped`),
  live path (`submitChange` with a live policy: write the source, record approved evidence, `value_changed`, fan out), approval path
  (`submitChange` with `requires_approval`: `proposed` evidence + `change_proposed` carrying the impact snapshot; `decideChange` moves through the active
  steps; only the last step applies the value; reject records `change_rejected`), ghost values (`assume` map: the same channel recomputed with every
  pending proposal), impact analysis (`computeImpact`: bindings reading the field directly or through a calculation, calculations whose variables include
  it, Tributary-connected and parent/child rods), history + time-slider replay (`subjectHistory`), role enforcement, and the in-process event bus.
- Write-back: platform_table fields are written with `UPDATE` on a whitelisted table/column from the registry (never caller-supplied SQL); connector fields go
  through the connector's own API. No connector adapter is implemented yet, so a connector write-back records `writeback_failed` with the exact reason and the
  evidence row keeps `metadata.writeback.status = 'failed'`. It is shown on the mark and in history, never swallowed.
- `server/routes/renderBindings.js`, mounted at `/api/render-bindings` (`requireUser`; admin-only where noted):
  `GET /stream` (server-sent events), `GET /renderings`, `GET /renderings/:key`, `POST /renderings/member-board/subjects`,
  `GET /renderings/:key/subjects/:subjectKey` (Data map + editable fields), `GET .../history`, `POST /changes`, `GET /changes/pending`,
  `GET /changes/:id/impact` (computed fresh; the proposal-time snapshot is returned beside it), `POST /changes/:id/approve` (admin; `assertReadyToFinalize`),
  `POST /changes/:id/reject` (admin), `GET|PUT|DELETE /settings...` (admin: bindings, field roles, approval steps).
- No `server/lib/mcpToolRegistry.js` exists in the repository yet, so there is no MCP registration. Recorded as MCP_GAP-pending: when the platform MCP
  server lands, register one tool per route above calling the same `renderBindings.js` function (`viewRendering`, `viewSubject`, `submitChange`,
  `listPending`, `impactForChange`, `decideChange`, `subjectHistory`) with the same `user` argument, so permissions are identical. Assigned to the `platform-mcp` feature.

### Client

- `src/components/admin/RenderBindingsPanel.jsx`, tabs **Renderings**, **Pending changes (n)**, **Settings** (administrators only). Reachable from the World Shell
  Journeys list as the **Render Bindings** card (admin via `admin_nav` tab `render-bindings`; members via `memberTabs` entry `render-bindings`, merged at read time
  for existing members) and from Classic Tools. Data map per item, change form per editable field (live or "Propose"), ghost rendering (dashed translucent
  crystal), impact list, approve/reject (approve goes through `useToolCategoryGate().run`), time slider with event log, live updates over `EventSource`.
- 390px layout: single column, 44px controls, no horizontal scroll, dark-mode and reduced-motion styles.

## Behaviour changes to know

- A change to a field is live or needs approval according to the strictest policy of any enabled binding that reads the field (directly or through a calculation).
- Only one proposal per field and item may be pending; a second one is refused with 409 until the first is decided.
- A proposal moves through every active approval step in order; approving a non-final step records `change_approved` with `final: false` and applies nothing.
- A calculation with a missing input reports "Cannot be calculated: <inputs> not recorded"; it never counts a missing value as zero.
- A platform_table value that is changed outside this feature (for example by an importer) is shown as read; history reconstructs only changes made through bindings.
- Separation of duties (a proposer approving their own change) is not enforced because no business rule defines it; recorded in Known limitations.

## Verified (initial check)

See the build agent's report appended below once the walkthrough has run.

## Known limitations

- No MCP tool yet (no platform MCP server in the repository); see Server.
- Connector write-back has no adapter, so every connector write-back reports `writeback_failed` honestly. A real adapter per provider is future work.
- Impact analysis covers bindings, calculations and Tributary-linked / parent-child rods of the subject rod; cross-subject effects (one item feeding another) are not modelled.
- `approver` roles are the free-text `required_role_label` on each step; approval is administrator-only until an approver-role registry exists.
- Depth from settlement class (`journey_rod_settlement_states`) is not bound by default; the Depth channel is intentionally unmapped so "not mapped" can be shown and mapped from Settings.
- Business definition needed from the owner: may the person who proposed a change also approve it?

## Fix notes per round

(none yet)
