# Process Flow Builder — Data Model, Requirements Spec & Coverage Map

**Source:** full review of this conversation's requests for the process flow builder, cross-checked against `process-flow-builder.html` as it currently stands.

## Methodology & an honest caveat on "tested"

I read every turn in this conversation, pulled out each distinct requirement as it was stated, and checked it against the shipped code. For "built," that means I can point to the specific function, class, or data field that implements it.

For "tested," I want to be precise about what that word can honestly mean here: **I did not run this tool in a browser and click through it.** What I verified is static — the JavaScript parses without a syntax error, and every `getElementById` call resolves to an element that actually exists in the HTML. That catches wiring mistakes (a button calling a function that was never defined, a form field the JS never populates) but it does **not** confirm that dragging a node feels right, that the agent-draft call succeeds against the live API, that self-loop arcs render legibly in every position, or that storage read/writes behave correctly across a real browser session. Anywhere below marked "Verified: static only" should be treated as *should work, not confirmed working*.

---

## Part 1 — Requirements as they arrived, turn by turn

| # | What was asked |
|---|---|
| 1 | Build a process flow builder (open-ended starting request). |
| 2 | Add more BPMN shapes with a 3D shape effect; build out the processes described in the uploaded files. |
| 3 | Add the processes from the uploaded portfolio Word doc as well. |
| 4 | Make it configurable: each step needs metadata input, agent-assisted input, or label translation; capture properties and hierarchies, actors, inputs/outputs, decision parameters, architecture mappings, relationship-creation triggers, data model requirements, automation requirements, expected functionality, expected user interaction, and visual layout/components per user journey per product. |
| 5 | Each decision needs its own individual parameters; more than two branches must be possible (not just yes/no); the path label must be renameable. |
| 6 | Core principle: a flow is an end-to-end **L2** — the high-level steps consistent for a domain/channel. Different **scenarios** produce different configurable requirements, sometimes sub-process loops or extra steps, and different inputs/outputs for the same step. Make the template dropdown editable, and support saving new reusable seed templates. |
| 7 | Create shape variations with a different visual quality or icon/tag for: system automation, user activity, and parallel vs. sequential dependency. Separate a **Current State** process inventory — capturing pain points, configuring the data sources/attributes available to quantify pain, friction, and opportunity, and surfacing handover gaps and leakage scenarios — from a **Future State** mapping. |
| 8 | *(this request)* Review all of the above, produce a data model, a requirements spec, and a coverage map. |

*(Two earlier turns in this conversation — the multi-chart dashboard and its restyle — built a separate artifact, `salt-basin-command-center.html`, and are out of scope for this spec.)*

---

## Part 2 — Data model

```typescript
// ─── Application state ──────────────────────────────────────────────
interface AppState {
  flowStates: { current: FlowState; future: FlowState };  // two fully independent canvases
  activeView: 'current' | 'future';
  activeScenario: string;   // 'base' or one of flowStates[activeView].scenarios
}

// ─── One canvas (Current State OR Future State) ────────────────────
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  laneCount: number;        // visual swimlane band count only — see gaps
  scenarios: string[];      // named scenarios defined within this view
}

// ─── Step ────────────────────────────────────────────────────────────
type ShapeType   = 'step' | 'subprocess' | 'decision' | 'parallel' | 'event' | 'data' | 'terminal';
type ExecMode     = '' | 'manual' | 'automated' | 'hybrid';
type Concurrency  = 'sequential' | 'parallel';

interface Node {
  id: string;
  type: ShapeType;
  x: number; y: number;
  label: string;
  execMode: ExecMode;              // drives the automation badge
  concurrency: Concurrency;        // drives the parallel badge
  scenarioTags: string[];          // [] = base L2 step; populated = L3 scenario-specific variant
  metaByScenario: {
    base: FieldSpec;
    [scenarioName: string]: Partial<FieldSpec>;   // sparse overlay — only overridden keys stored
  };
}

interface FieldSpec {
  // Identity & hierarchy
  hierarchy: string; properties: string; product: string; translations: string;
  // Actors & data flow
  actors: string; inputs: string; outputs: string; decisionParams: string; relTriggers: string;
  // Architecture & data
  archMapping: string; dataModel: string; automation: string;   // free-text — distinct from execMode
  // Experience
  functionality: string; interaction: string; visualLayout: string;
  // Current-state diagnostics — only editable when activeView === 'current'
  painPoints: string; frictionOpportunity: string; dataSources: string;
  dataAttributes: string; handoverGap: string; leakageScenario: string;
}

// ─── Connector ───────────────────────────────────────────────────────
interface Edge {
  id: string;
  from: string; to: string;    // from === to → self-loop / sub-process cycle
  label: string;                // branch/path label — freely renameable, not Yes/No-locked
  params: string;                // decision condition specific to this branch
  notes: string;                 // owner / SLA / exception handling
  scenarioTags: string[];        // [] = base connector; populated = scenario-specific branch/loop
}

// ─── Template ────────────────────────────────────────────────────────
interface Template {
  key: string;      // built-ins are plain camelCase; custom keys are 'custom:<slug>-<timestamp>'
  name: string;
  builtin: boolean; // seed templates are code constants — not editable in place, not deletable
  content?: { flowStates: { current: FlowState; future: FlowState } };  // custom templates only
}
```

**L1 / L2 / L3 mapping**, per the vocabulary introduced in turn 6:
- **L1** (domain/channel) = which `FlowState`/template a step lives in (e.g., "Revenue Lifecycle").
- **L2** (consistent high-level steps) = any `Node`/`Edge` with `scenarioTags: []` — always visible, forms the shared skeleton.
- **L3** (scenario-specific path) = any `Node`/`Edge` with `scenarioTags` populated — only shows, and can carry overridden content, when that scenario is active.

---

## Part 3 — Consolidated requirements spec

| ID | Requirement | Source turn |
|---|---|---|
| R1.1 | Multiple BPMN-style shapes: step, sub-process, decision, parallel gate, event, data object, start/end | 2 |
| R1.2 | Shapes rendered with a layered "3D" extrusion effect | 2 |
| R1.3 | Shape/canvas styling matches the uploaded Salt Basin design system tokens | 2 |
| R1.4 | Distinct visual treatment per node for automation type (system / manual / hybrid) | 7 |
| R1.5 | Distinct visual treatment per node for parallel vs. sequential dependency | 7 |
| R2.1–R2.5 | Add, move, rename, delete shapes; connect two shapes with a directional arrow | 1 |
| R2.6 | Support self-loops / sub-process cycles | 6 |
| R2.7 | Swimlanes with editable labels | 1 |
| R3.1 | A decision/parallel gate can have more than two outgoing branches | 5 |
| R3.2 | Each branch has its own freely-relabelable path label | 5 |
| R3.3 | Each branch has its own decision parameters | 5 |
| R3.4 | Each branch can carry ownership/SLA/exception notes | 5 (extended) |
| R4.1–R4.4 | Step spec fields: properties/hierarchy/product/translations; actors/inputs/outputs/decision params/relationship triggers; architecture mapping/data model/automation requirements; expected functionality/interaction/visual layout | 4 |
| R4.5 | Spec fields fillable manually or via AI agent draft | 4 |
| R4.6 | Visible indicator for steps with a saved spec | 4 |
| R4.7 | Full spec exportable as structured JSON | 4 |
| R5.1 | A flow's untagged steps form a consistent L2 base | 6 |
| R5.2 | Named scenarios definable per flow | 6 |
| R5.3 | Steps/connectors taggable as scenario-specific (L3) | 6 |
| R5.4 | Canvas view filters/dims by active scenario | 6 |
| R5.5 | A step's spec fields overridable per scenario without duplicating the step | 6 |
| R5.6 | A scenario override copyable from base, or clearable back to inheriting base | 6 |
| R6.1 | Built-in seed templates sourced from the uploaded materials | 2, 3 |
| R6.2 | Save the current canvas as a new named, reusable template | 6 |
| R6.3 | Edit and re-save (overwrite) an existing custom template | 6 |
| R6.4 | Delete a custom template | 6 |
| R6.5 | Seed templates are not deletable/overwritable in place | 6 (implied) |
| R6.6 | Templates persist across sessions | 6 |
| R7.1 | Current State and Future State are separate, independently editable canvases | 7 |
| R7.2–R7.6 | Current State steps capture pain points, quantified friction/opportunity, available data sources, data attributes, handover gaps, leakage scenarios | 7 |
| R7.7 | Visual indicator distinguishes steps with documented pain/gaps | 7 (extension) |
| R7.8 | Switching views doesn't affect the other view's data | 7 |

---

## Part 4 — Coverage map

Legend: ✅ Built · 🟡 Built but partial/limited · ⬜ Not covered. "Verified" states how I confirmed it.

| ID | Status | Verified | Notes |
|---|---|---|---|
| R1.1 | ✅ | Static: `SIZES` object defines all 7 types, each with add-button + shape CSS | |
| R1.2 | ✅ | Static: layered `box-shadow` per shape class | |
| R1.3 | ✅ | Static: CSS custom properties match uploaded token names/values | |
| R1.4 | ✅ | Static: `execMode` field, `badge-auto` classes, Configure dropdown | |
| R1.5 | ✅ | Static: `concurrency` field, `badge-parallel` triangle | |
| R2.1–R2.5 | ✅ | Static: `addNode`, drag handlers, `dblclick` rename, delete-mode click, connect-mode click | |
| R2.6 | 🟡 | Static: `isLoop` branch draws an arc | Arc can clip if the looping step sits near the very top of the canvas — a known, disclosed rendering limitation, not a missing feature |
| R2.7 | 🟡 | Static: lane bands render with a `contentEditable` label | **Real gap, not previously flagged this precisely:** lane labels are never written into a data field. `render()` regenerates each label as `'Lane ' + (i+1)` on every re-render — since render() fires on nearly every interaction, a custom lane name is likely to be overwritten almost immediately, and is never included in save/template/export payloads. Only the lane *count* persists. Functionally, lanes are a visual guide, not a working swimlane structure |
| R3.1–R3.4 | ✅ | Static: `edges` carry independent `label`/`params`/`notes`; connect mode permits unlimited edges from one node | |
| R4.1–R4.4 | ✅ | Static: `FIELD_DEFS` covers all named fields across 4 sections | |
| R4.5 | 🟡 | Static: `inspAgentBtn` calls the Anthropic API client-side for both node and edge specs | Depends on a live network call from the browser; unverified end-to-end (would need a real API response to confirm the JSON contract holds) |
| R4.6 | ✅ | Static: gold `meta-dot` shown when any field is non-empty | |
| R4.7 | ✅ | Static: `exportJsonBtn` serializes steps + connections | |
| R5.1–R5.6 | ✅ | Static: `scenarioTags`, `metaByScenario`, `renderScenarioBanner` (copy/clear), `isDimmed` | |
| R6.1 | ✅ | Static: 16 built-in `PRESETS` entries sourced from the uploaded HTML/docx content | |
| R6.2–R6.4 | ✅ | Static: `saveTemplateBtn`/`deleteTemplateBtn` against `window.storage`, guarded to `custom:` keys | |
| R6.5 | ✅ | Static: delete handler explicitly rejects non-`custom:` keys | |
| R6.6 | 🟡 | Static: uses `window.storage` with `shared:false` | Persists across the *same browser*, not shared across users/devices — worth naming plainly if "reusable" was meant to include teammates |
| R7.1–R7.8 | ✅ | Static: `flowStates`, `switchView`, view-scoped `FIELD_DEFS` filtering, red pain-dot | |

---

## Part 5 — Gaps and things not covered at all

These were implied or adjacent to what was asked, but nothing in the conversation explicitly requested them, and nothing was built:

- **No link between Current State and Future State steps.** A future step can't reference which current-state pain point or leakage scenario it resolves — the two canvases are siblings, not a diff/transformation map.
- **No scenario-level content overlay on connectors.** Nodes support per-scenario field overrides (`metaByScenario`); edges only support scenario *visibility* tagging, not overridden label/params/notes per scenario.
- **No true multi-user template sharing.** Templates are private to one browser via local storage, not a shared team library.
- **No undo/redo**, no multi-select/bulk edit, and no structural validation (orphaned nodes, a decision gate with only one branch, unreachable steps) — nothing catches an incomplete flow.
- **"Architecture mapping" and "data model requirements" are free text**, not a real link to any component/data registry — there's no reconciliation between what a step claims and an actual system inventory.
- **No automated test coverage** of any kind (unit, integration, or browser) exists in the file itself, consistent with it being a single self-contained HTML artifact rather than an application with a build/test pipeline.

If any of these should have been in scope, that's the punch list I'd start from.
