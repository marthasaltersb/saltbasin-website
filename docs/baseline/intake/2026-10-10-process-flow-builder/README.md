# Intake — Process Flow Builder prototype (2026-10-10)

Supplied by Betsy 2026-10-10 as the answer to DEC-SLT-01 of the Seven-Layer Theory build
(`docs/salt-basin-seven-layer-theory-progress.md`). Preserved verbatim; do not edit.

| File | What it is |
|---|---|
| `process-flow-builder.html` | Standalone HTML prototype (~3,300 lines). Partly carried into design, **not built into the platform**. |
| `process-flow-builder-spec.md` | Its data model, requirements (R1–R7) and coverage map, written when the prototype was built. Its own caveat applies: verification was static only, never driven in a browser. |

**Owner direction (2026-10-10):** this builder becomes the interface a **Composer** uses to compose a
product and its layers, and the whole system should be connected end to end — from normal language, raw
inputs and parsed text through to repeatable, variable, dynamically configurable personal and enterprise
operating systems.

## Facts about the prototype that the platform build must not carry over as-is

- **It calls the Anthropic API directly from the browser** (`fetch('https://api.anthropic.com/v1/messages')`,
  around lines 3163 and 3206). In the platform, agent drafting runs on the server through the existing agent
  path, with usage recorded; no API key ever reaches a browser.
- **It persists to `window.storage`** (artifact-local storage: one browser, one person). The platform
  version persists to the database so templates, client instances and vocabulary are shared and audited.
- **It has grown past its spec.** The HTML also contains L1 Industries (Classification Type × Role Type
  pairs, with entities and relationships), functional Domains, Business Goals (quarter, value drivers,
  KPIs), Clients with instanced copies of templates, spreadsheet template import, horizontal and vertical
  lanes with sizes, and edge weight/dash/routing. None of these are in `process-flow-builder-spec.md`.
- **Its L1 / L2 / L3 levels collide** with the Business Definition Tool's L0–L7
  (`docs/salt-basin-business-definition-tool-product-spec-v1.md`, where L2 = Scenario) and the theory
  layers L1–L7. See DEC-SLT-23.
