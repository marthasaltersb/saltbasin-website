# Change spec: Guided training agent (the in-app guide)

Feature key: `guided-training-agent` · Release: next release, after 0.2.0 passes · Version 1 (design) · 2026-10-10
Status: design. The owner direction is recorded below; open owner questions are at the end. Nothing is built yet.

## Owner direction (2026-10-10)

> Use the training guides and test agents to build out a real-time guided training avatar agent who provides
> training and help text and content views, can answer questions in real time, helps the user use the system,
> and can even make config or code changes when relevant.

## What the guide does

The guide is a person figure that sits beside World Shell (and in Classic Tools). It has five modes:

| Mode | What the member sees | Where the content comes from |
| --- | --- | --- |
| **Help** | Short help text for the screen they are on, and for each field when they focus it | The training spec for that feature (`docs/training/<feature>.md`) and its frozen baseline (`docs/training/baselines/<feature>/v<N>.json`), matched by the current World Shell layer |
| **Train** | A step-by-step lesson: "Do [J3.2] next." It highlights the control, waits for the member to do it, then checks the expected result and moves on | Baseline journeys, step by step, using their stable step ids. A lesson can only use steps that exist in a pinned baseline |
| **Show me** | The guide does the journey itself, slowly, on fictional demo data, while the member watches | The same journeys the browser validators run, replayed with the fixture adapter. It never runs on the member's real records |
| **Ask** | Answers to questions typed (or spoken, see Q1) in real time, with links to the screen or the step that answers it | Search over the training specs, change specs and CLAUDE.md-style docs first, then deterministic rules, then the model (the same order the cover-letter agent uses). Every answer cites the spec and step it came from |
| **Do it for me** | The guide proposes an action, shows exactly what will change, and runs it only after the member confirms | Platform MCP tools, with the member's own permissions (see "Changes" below) |

## Reuse first

Nothing here needs a second copy of the training material, a second navigation model or a second agent
runtime.

- **Curriculum = training specs and baselines.** Lessons are generated from the pinned baseline, not written
  separately. When a spec changes through an approved amendment, the lessons change with it. A screen with
  no training spec shows "No guide for this screen yet", never invented steps.
- **Where am I = World Shell layers.** The layer stack in the URL (`useWorldLayers`, `worldLayers.js`) tells
  the guide which screen and object the member is on. A lesson step moves the member by pushing a layer,
  never by its own routing. Each spec step gets a `layer` hint in its baseline so steps map to screens
  (an additive baseline field, added by amendment).
- **Show me = test agents.** The validator journeys and the fixture adapter (`agentRunnerAdapters.js`) already
  replay a journey on fictional data. "Show me" plays the same recording in a demo layer.
- **Actions = platform MCP tools.** Every action the guide can take is an existing tool in
  `mcpToolRegistry.js`, called with the member's own session and scopes, re-checked on every call
  (`getAccountGateBlock`). The guide never gets more access than the person using it.
- **Model loop = `interactiveAgentLoop.js`**, with usage recorded through `recordAgentLlmUsage` (Sessions
  screen). The guide is a platform-default `agent_definitions` row (`pipeline='guide'`) so an org can
  override its prompt.
- **Avatar = crystal design system.** The guide is a person figure from `crystalGeometry.js` (agents are
  actors and render as people). No bespoke geometry.

## Changes the guide may make

| Kind | Example | How it happens |
| --- | --- | --- |
| **Navigate / fill in** | Open the Career Placement Agents screen; fill a form the member is on | Directly, after the member says yes. Nothing is saved until the member presses the screen's own Save |
| **Config change** | Change a scoring weight, a theme, a template preset, a Release Intelligence rule | Shown as a before/after card. Applied through the same settings API the screen uses, after the member confirms. Recorded as an event with who, when and "via guide". Settings with an approval path (render bindings, data changes) go through that path, never around it |
| **Code change** | "Add a column to this table" | Never made directly. The guide drafts a **work order** for the platform agent runner (items, intent, files, size, forbidden paths, done-when). It waits for a person to approve it, then runs through the release loop like any other change. Admin only |

The guide never approves its own proposals, never edits a frozen spec or an approved output, and never calls a
tool the member could not call themselves.

## Honest answers

- If the docs do not answer a question, the guide says so and offers to file it as a question for the owner.
  It never invents a step, a setting or a number.
- If an action fails, the guide shows the plain-language error in the right colour (red for a failure or
  rejected input, amber for a caution), as everywhere else.
- Questions the guide could not answer are logged (metrics and the question text only, no other transcript),
  so missing training content shows up as backlog seeds.

## Interface parity

Every mode works on the website on desktop and as a 390px phone walkthrough (the guide becomes a bottom
sheet), in the API (`/api/guide/*`), and as MCP tools (`guide_help`, `guide_lesson_*`, `guide_ask`,
`guide_propose_action`). Parity rows go in `capabilityParity.js`.

## Data (additive only)

- `guide_sessions` / `guide_events` (lesson progress, questions asked, actions proposed and confirmed), created
  lazily, never in bootstrap.
- Lesson progress per member and per baseline version, so a member who finished v3 of a lesson is told when
  v4 changes a step.
- No change to member site, config or profile rows.

## Owner questions

1. **Voice or text?** Text first (recommended), with voice later; or voice in and out from the start.
2. **Who may make config changes through the guide?** Recommended: anyone, for settings they could already
   change themselves, always with confirmation.
3. **Code changes**: admin only (recommended), always as a work order that a person approves?
4. **Members or admins first?** Recommended: members, starting with the career journey (Career Master,
   pipeline, application outputs), since those specs are the most complete.
5. **Billing**: answers use the Anthropic API key, like the other in-app agents. Is that acceptable?
