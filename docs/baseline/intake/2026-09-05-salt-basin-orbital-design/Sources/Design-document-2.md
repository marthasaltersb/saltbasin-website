::codex-realtime-inline{}
:::writing{variant="document" id="93752"}
# Salt Basin — Module and Orbital Experience Mapping
**Addendum to the immersive application specification · Working draft**

This addendum makes the orbital Home screen the organizing model for modules, journeys, screens, and interactions. It captures the requested sun, planetary navigation, configurable illumination, environmental reporting, and process definitions.

**Confirmed direction:** modules are orbital planets; the crystal core is the sun; journeys are immersive environments; process-step data work initially uses 2D interfaces.

**Proposed details:** the specific module inventory, planet colors, moon assignments, sample sales stages, and environmental thresholds below remain design proposals.

## 1. Celestial object definitions

| Object | Product meaning | Rendering | Interaction and relationship |
|---|---|---|---|
| Crystal Sun | Central orientation point and activation of the user’s selected “shine dimensions” | 3D crystalline geometry with emitted light and controlled glow | Hover activates illumination of matching, authorized destinations; keyboard focus and touch provide equivalent activation |
| Planet | A module containing related capabilities and journeys | 3D sphere or authored planetary model; distinct base color and silhouette details | Select to identify; enter to transition into its module environment |
| Moon | Proposed: a subordinate capability, journey entrance, or saved view belonging to a planet | 3D object; multiple moons have distinguishable sizes, surfaces, or orbit positions | Opens its explicitly assigned destination; parent planet remains identifiable |
| Satellite | Proposed: a shortcut to a task queue, agent, tool, or pinned object | Distinct 3D geometry | Opens the linked capability or work item |
| Star | Proposed: distant landmark or background context | 3D point geometry or lightweight rendered star field | Decorative by default; navigable stars require labels and an explicit destination definition |
| Surface object | A process step, record, or meaningful group within a journey | 3D geometry tied to object type and state | Opens its configured workspace or detail view |
| Avatar | The individual user’s presence and saved location | Personal 3D geometric model | Anchors navigation and session continuity |

A moon’s size initially distinguishes identity; it must not imply business importance or performance unless that meaning is explicitly configured and explained.

Module identity and operational state use separate visual channels: a planet retains its identifying color while lighting, atmosphere, and labeled indicators communicate conditions.

## 2. Orbital Home and the sun

### Arrival

On opening orbital Home, the sun occupies the center of a dark scene. Authorized planets and associated objects remain discoverable through restrained silhouettes and readable labels.

This refines the earlier Home concept: personalized tasks, approvals, saved views, and resume controls belong within the orbital Home experience, with 2D configuration controls available when needed.

The preference to resume a previous session remains supported. Returning users may enter their saved location directly; users choosing Home arrive at the sun-centered view.

### Shine dimensions

“Shine dimensions” define which objects the sun illuminates. They are saved as part of personal Home configuration.

| Dimension | Example selection | Effect |
|---|---|---|
| Business capability | Sales or Service | Highlights matching modules and subordinate destinations |
| Application / service | A configured sales application or Service Cloud connection | Highlights associated objects |
| Client | Selected client | Restricts the view to permitted client context |
| Journey | Customer lifecycle or a configured sales process | Highlights related journey entrances |
| Work | My tasks or pending approvals | Highlights destinations containing matching work |
| Saved view | A personal reporting configuration | Applies that view’s configured selection |
| Period | Today, this week, or selected reporting period | Establishes the period for applicable data and environmental signals |

**Proposed selection rule:** selections within one dimension match any selected value; different dimensions combine to narrow results. The interface displays the resulting scope in plain language.

Only objects the user is authorized to access may appear. Filtering and lighting do not create permissions.

### Sun interaction states

| State | Visual behavior | Interface behavior |
|---|---|---|
| Resting | Dark scene; restrained sun glow | Selected shine dimensions remain visible |
| Activated | Sun emits directional light toward matching planets and associated objects | Show matching destinations and current scope |
| Scope pinned | Illumination remains active after pointer movement | Allows the user to move from the sun to a destination without losing the highlight |
| No matches | Neutral sun state | Explain that no accessible objects match; offer filter adjustment |
| Loading / unavailable | Neutral lighting with explicit status | Do not imply poor business performance |

**Proposed control:** hover previews illumination; selecting the sun pins it. Touch and keyboard activation provide the same pinned state. Leaving the sun must not make the destination disappear while the user tries to reach it.

## 3. Proposed module-to-journey mapping

Modules organize capabilities. Journey Rods describe business meaning and may cross modules. A Sales planet is therefore not an additional Journey Rod.

| Proposed planet / module | Purpose | Associated journeys or processes | Screens inside the module | Associated objects |
|---|---|---|---|---|
| Sales | Manage sales work and qualification | Configured sales process; relevant Customer and Revenue journey views | Module overview; journey landscape; stage workspace; sale detail; reports; process configuration | Journey moons, sale objects, stage objects, task satellites |
| Service | Manage service work and workload | Configured service process; relevant Customer journey and Member context where applicable | Overview; service journey; ticket workspace; queue; workload report; configuration | Queue moons, ticket objects, escalation and task markers |
| Customer | View and manage customer lifecycle context | Customer Journey Rod and configured lifecycle processes | Customer landscape; lifecycle stage; customer detail; related sales/service views | Customer objects, lifecycle entrances, relationship links |
| Revenue | View monetary progression and related work | Revenue Journey Rod and configured financial processes | Journey landscape; step workspace; transaction detail; reporting | Financial process objects, evidence objects, task markers |
| Member | View member or beneficiary progression | Member Journey Rod and configured entitlement processes | Journey landscape; member detail; step workspace; reports | Member objects, entitlement objects, process markers |
| Reports & Views | Build personal and client-specific spatial reports | References journeys without redefining them | Saved-view space; query builder; spatial report; object detail | Saved-view moons, aggregate objects, source-object links |
| Agents | Define and inspect agents | Agent configuration and linked work | Agent directory; definition editor; activity detail | Agent geometry, linked-task satellites |
| Administration | Configure access and shared definitions | User, role, module, and process configuration | User definition; role definition; module editor; process editor | Administrative destinations with clear labels |

**Inventory status:** these are candidate modules, not a claim that all are approved or implemented. Sales and Service illustrate the user’s examples. Tasks, personal settings, and definitions can be shared destinations rather than automatically becoming additional planets.

## 4. Required module definition record

Every module must have a completed record before implementation.

| Definition field | Required content |
|---|---|
| Identity | Stable reference, display name, purpose |
| Audience | User roles allowed to discover, enter, view, and configure it |
| Orbital representation | Planet geometry, identifying color, material, label, and asset source |
| Child objects | Each moon or satellite, its meaning, appearance, and destination |
| Entry points | Home planet, menu item, task, report object, direct link, or resume |
| Journey associations | Journey Rods and configured processes available inside |
| Screen inventory | Each screen type and its required components |
| Navigation behavior | Collapse rules, back destination, sun window, and exit behavior |
| Data associations | Objects read or edited by each screen |
| Environmental rules | Metrics, period, thresholds, and resulting lighting/weather |
| Continuity | Location and workspace context saved for resume |
| Access and fallback | Restricted, removed, unavailable, empty, and loading states |

A module cannot be defined only by a planet image. Its visual object, screens, processes, data, and entry behavior must be linked.

## 5. Screen and component contracts

| Screen type | Required components | 3D / 2D treatment | Navigation behavior |
|---|---|---|---|
| Orbital Home | Sun; planets; child objects; shine controls; avatar; resume; personal work | 3D world with 2D labels and controls | Expanded navigation available |
| Module interior | Environment; journey entrances; avatar; location label; sun window | 3D environment with compact 2D controls | Main menu collapses on entry |
| Journey interior | Traversable landscape; stage objects; connections; current work; sun window | 3D movement and objects | Preserve module context and return route |
| Stage workspace | Fields; evidence; entry/exit conditions; status; actions | 2D panel or full-screen workspace | Pause travel and preserve position |
| Record detail | Values; meaning; source; relationships; permitted actions | 2D detail attached to a selected 3D object | Return to original selection |
| Spatial report | Data geometry; legend; period; filters; freshness; selection detail | 3D results plus 2D inspection | Save and restore view context |
| Process configuration | Stages; fields; rules; sale types; journey associations; preview | 2D editor with optional 3D preview | Editing a definition does not move the avatar |
| Home configuration | Shine dimensions; pinned objects; work cards; arrival preference | 2D editor with orbital preview | Save personal settings |
| User / Agent / Admin definition | Relevant identity, scope, permissions, behavior, and visual preview | 2D editor; 3D identity preview where applicable | Standard navigation remains available |

### Sun window inside a planet

Place a compact sun-and-sky view in the top-right of module and journey environments.

It provides:

- A persistent orientation link to orbital Home.
- The current module’s environmental condition.
- The selected period.
- A readable explanation of the metric driving the condition.

Selecting its Home control returns to orbital Home while preserving the user’s place. When a workspace needs the available screen space, the sun window may reduce to a compact control.

## 6. Operational lighting and weather

The sun serves two related but distinct functions:

1. **Scope illumination:** which destinations match the user’s selections.
2. **Operational atmosphere:** what measured conditions are occurring in the current module.

A module can match a Sales filter and still show an unfavorable condition. Selection must not imply success.

| Context | Example condition | Proposed environmental expression | Required explanation |
|---|---|---|---|
| Sales | Performance exceeds a configured target for the selected period | Brighter sun and clearer atmosphere | Actual measure, target, period, and freshness |
| Sales | Performance is within an expected range | Balanced daylight | Measure and expected range |
| Service | Workload exceeds configured capacity or a backlog threshold | Clouds and rain | Ticket count, capacity or threshold, and period |
| Service | Workload is manageable | Clearer conditions | Workload relative to configured capacity |
| Any module | Missing or stale data | Neutral atmosphere with explicit unavailable/stale indicator | Why the condition cannot be evaluated |
| Any module | Multiple conflicting indicators | Mixed or neutral atmosphere with detail | The measures that disagree |

**The example of 75 service tickets does not establish a universal “rain” threshold.** Whether that workload is adverse depends on capacity, age, urgency, and the selected rule.

Calendar time or season may provide an ambient theme. Operational weather must remain separately defined so users can tell whether darkness means time of day or a business condition.

Each environmental rule records the metric, source, aggregation, scope, period, threshold, visual result, and explanatory label. Weather does not obscure controls or prevent work.

## 7. Journey and stage definition

A journey configuration must connect business process meaning to the exact interaction shown on screen.

| Definition | Required mapping |
|---|---|
| Journey identity | Name, purpose, owning module, related Journey Rods |
| Actor | Internal user, external customer, administrator, or agent |
| Subject | The customer, sale, member, or other entity the journey concerns |
| Process variants | Applicable sale or service types and their differences |
| Stages | Ordered or branching stages and valid connections |
| Collected data | Fields or objects presented at each stage |
| Entry conditions | Data and state required to enter |
| Exit conditions | Data, evidence, or approvals required to complete or leave |
| Qualification | Combination of evidence and data that supports the displayed assessment |
| Spatial representation | Landscape region, step object, state appearance, and connections |
| Work interface | 2D workspace components and available actions |
| Entry points | Which task, report, menu, object, or direct link opens the step |
| Result | Data updated, state transition, and visual feedback |
| Return behavior | Where the user returns after closing or completing work |

**Actor and subject are separate.** An internal sales user can work on a customer lifecycle without becoming the customer. Any external customer view needs its own screen and access mapping.

## 8. Illustrative Sales process mapping

The following stages and data are examples for defining the structure, not finalized Salt Basin sales policy.

| Example stage | Data collected | Example entry / exit requirements | Spatial object and workspace | Typical entry point |
|---|---|---|---|---|
| Identify | Organization, contact, source, sale type | Enter: permission to create; exit: required identity and ownership captured | Entry landmark → 2D identification form | Sales planet or create action |
| Qualify | Need, fit, stakeholders, timing, supporting evidence | Enter: identified sale; exit: configured qualification conditions satisfied or exception recorded | Qualification structure → evidence and assessment workspace | Journey path or assigned task |
| Shape solution | Products, scope, quantities, constraints | Enter: applicable qualification state; exit: required solution configuration complete | Configuration structure → 2D solution editor | Stage object |
| Propose | Proposed terms, price, documents, approvals | Enter: valid solution; exit: proposal and required approvals recorded | Proposal structure → terms and approval workspace | Journey or approval queue |
| Agree | Accepted terms, agreement evidence, effective dates | Enter: applicable proposal state; exit: configured agreement evidence validated | Agreement structure → agreement workspace | Task or sale detail |
| Handoff | Delivery owner, commitments, linked downstream work | Enter: agreed state; exit: required handoff information and ownership complete | Confluence / destination link → handoff workspace | Journey completion action |

Sale types—such as new business, renewal, or expansion—can select different requirements and paths. Their actual definitions remain to be specified.

Qualification should show its supporting evidence and missing conditions. Any score must have a defined calculation; no unexplained numerical confidence is assumed.

## 9. Interaction mapping required for implementation

For every interactive object, complete this row:

| Module | Screen | Actor | Entry source | Selected object | Action | Destination | Data read / changed | Conditions | Return / resume | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| Sales | Journey interior | Internal salesperson | Sales planet | Qualification stage | Open | 2D qualification workspace | Sale and qualification evidence | Authorized access; configured stage rules | Same stage and camera | Procedural 3D structure + 2D workspace |
| Service | Module interior | Service user | Home filtered to Service | Work queue moon | Enter | Queue and linked process objects | Permitted service work | Client and role scope | Service environment | 3D moon + 2D queue |
| Reports | Spatial report | Authorized user | Saved client view | Sales aggregate | Inspect | Aggregate breakdown | Records behind the measure | Same report permissions and filters | Same report position | Data-driven 3D geometry + 2D detail |
| Home | Orbital view | Signed-in user | Login | Crystal Sun | Activate | Illuminated matching destinations | Personal shine configuration | Access filtering | Remain on Home | 3D sun, light, and glow |

This mapping is the implementation contract for Claude or Codex: it relates each visual object to its module, screen, data, rules, and resulting user interaction.

## 10. Remaining definition work

The structure is now specified. A complete implementation handoff still needs populated, approved values for:

- Final module inventory and child-object assignments.
- Exact planet colors, geometries, and asset references.
- Journey variants and stage definitions per module.
- Field definitions, entry/exit rules, and qualification logic.
- Operational metrics and environmental thresholds.
- Internal and external user permissions and screen differences.

These values should be added to the tables without treating illustrative examples as established business rules.
:::

