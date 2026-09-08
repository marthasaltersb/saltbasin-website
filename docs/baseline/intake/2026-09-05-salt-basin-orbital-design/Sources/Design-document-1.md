::codex-realtime-inline{}
:::writing{variant="document" id="86421"}
# Salt Basin — Immersive Application Design Specification
**Working draft · Navigation, spatial interactions, reporting, and user continuity**

This document defines the intended experience for the immersive Salt Basin application. Requirements below capture the current direction. Menu labels, object forms, and screen layouts are proposed design choices for review, not claims about what the application already implements.

## 1. Experience model

Salt Basin presents an enterprise as a navigable crystalline world. A journey is a process embodied as a place: users enter its environment, move between meaningful objects, and open those objects to perform work.

The experience has three connected levels:

| Level | User experience | Main interaction |
|---|---|---|
| Basin | Explore available modules, journeys, and saved views | Select a destination or resume work |
| Journey environment | Travel through an actual 3D landscape representing a process | Move to and select process-step objects |
| Process-step workspace | Read and change the data associated with a selected step | Use a focused 2D interface, then return to the same place |

Reporting uses the same spatial language to explore information. Every report object represents a process, data element, or clearly identified aggregation that can be inspected.

**Initial design requirement:** process-step work uses 2D interfaces. Further immersive interactions can be specified later without changing the journey structure.

## 2. Proposed navigation menu

The expanded menu combines text labels with simple icons. Entering a spatial destination collapses it to a compact rail; users can reopen it at any time.

| Main menu | Destinations | Purpose |
|---|---|---|
| Home | Personalized home; resume last session | Orient the user and surface relevant work |
| Basin Map | Modules and journey destinations | Navigate the application spatially |
| Journeys | Revenue; Customer; Member | Enter a process environment |
| Reports & Views | My views; client views; view builder | Query, filter, and arrange spatial reports |
| Tasks & Approvals | My tasks; approvals; linked process steps | Find and complete actionable work |
| Definitions | Objects and processes; agents | Inspect and configure definitions where permitted |
| Personal Settings | Avatar; home configuration; preferences | Configure the individual experience |
| Administration | Users; roles and access; application configuration | Manage the application where permitted |

**Salt Basin terminology:** Revenue, Customer, and Member remain the three peer Journey Rods. Data Channels support them. Pricing is a domain. Neither is represented as an additional peer Journey Rod.

## 3. Screen, navigation, and asset mapping

“Procedural geometry” means shapes drawn by the application from underlying data. “Authored 3D” means designed model assets. Both may coexist.

| Screen or destination | Proposed visual representation / assets | Entry and navigation behavior | Work surface |
|---|---|---|---|
| Personalized Home | 2D cards; optional small 3D avatar and last-location preview | Expanded menu by default | Configurable tasks, approvals, saved views, and resume action |
| Basin Map | Procedural orbital arrangement; authored or procedural crystalline module bodies; text labels and icons | Menu collapses; compact destination and home controls remain | Select a module body to enter its environment |
| Journey entrance | Distinct planetary environment for Revenue, Customer, or Member | Transition into the destination; menu stays collapsed | Journey summary, current position, and available process routes |
| Journey landscape | 3D terrain, paths, step objects, and relationship indicators | Movement occurs inside the environment; persistent location cue and exit control | Select a step, related process, or data object |
| Process-step workspace | 2D forms, tables, evidence, status indicators, and actions | Opens over a paused journey; compact navigation remains available | Read or edit the step’s data; save or cancel; return to the same location |
| Data-object detail | Selected 3D object plus 2D detail panel | Preserve the originating journey or report position | Inspect meaning, values, source evidence, and relationships |
| Reports & Views | Procedural 3D report objects, labels, legends, and optional 2D charts | Menu collapses when a spatial view opens | Explore a saved report; select represented processes or data |
| Report / View Builder | Spatial preview plus 2D query, filter, and layout controls | Builder controls remain visible; main menu compact | Select data, filters, grouping, visual encodings, and saved-view settings |
| Tasks & Approvals | 2D work queue; linked 3D destination markers | Expanded menu in queue; collapsed after entering a journey | Inspect work, act where permitted, or travel to its process step |
| Object / Process Definitions | 2D definition editor; procedural object preview | Expanded menu; preview does not change user location | Define meaning, process relationships, and visual representation |
| Agent Definitions | 2D configuration; distinctive geometric agent symbol or preview | Expanded menu | Define agent purpose, allowed actions, scope, and presentation |
| User / Avatar Settings | Personal 3D geometric avatar preview; 2D controls | Expanded menu | Configure avatar appearance and personal preferences |
| Home Configuration | 2D layout editor with card previews | Expanded menu | Choose home content, ordering, and initial sign-in behavior |
| Administration | 2D management screens; consistent icons | Expanded menu; visible only where permitted | Manage users, roles, access, and application settings |

**Asset rule:** imagery may establish atmosphere, but meaningful navigation and report objects need explicit labels, selectable boundaries, and a connection to the represented object. Decorative scenery must be distinguishable from interactive objects.

## 4. Journey and process-step interaction

### Enter a journey

1. Select a journey from the menu or its spatial destination.
2. Transition into the journey’s 3D environment.
3. Collapse the main navigation.
4. Place the avatar at the saved valid location, or the journey entrance on a first visit.
5. Show the current journey, position, and next relevant work.

The landscape must communicate progression through a process. It must not simply place a flat process diagram over a planet background.

### Move through the process

Each selectable step object corresponds to a defined process step. Paths and connections convey valid relationships or available transitions.

Proposed visible states include available, in progress, waiting, blocked, and complete. State must be communicated with labels or symbols as well as color. Visual changes follow underlying process data.

### Open a step

Selecting a step pauses travel and opens a 2D workspace containing:

- Step name, journey context, and current status.
- Relevant data fields and related records.
- Tasks, required inputs, and evidence.
- Available actions and their consequences.
- Save, cancel, and return controls.

Opening a workspace does not advance the process. A successful action updates the relevant process state and its spatial representation.

Closing the workspace restores the same avatar position, camera orientation, and selection. Unsaved changes require an explicit save or discard choice before leaving.

### Navigate to a related object

A related item identifies whether it opens data detail, another process step, or another journey. Cross-journey travel preserves a return destination so the user can come back to the originating work.

## 5. Spatial reporting and personalized views

### Purpose

Reporting reuses Salt Basin’s spatial experience for querying objects, filtering information, and composing useful views. Its initial scope is data exploration and report configuration.

### View definition

Each saved view includes:

| Setting | What the user configures |
|---|---|
| Name and purpose | A recognizable label and what the view helps them understand |
| Client context | The client or permitted scope represented |
| Source objects | Processes, data elements, or related object collections |
| Query and filters | Conditions that determine included information |
| Grouping | How objects are organized into meaningful collections |
| Measures | Values, counts, totals, or other defined calculations |
| Spatial layout | How results are positioned and grouped |
| Visual encoding | What size, color, shape, and connections mean |
| Selection behavior | Whether selection opens a process, data detail, or aggregate breakdown |
| Task context | Related tasks and how they appear |
| Personal placement | Whether the view appears on Home or in saved navigation |

Client context remains visible while viewing and editing a report. Saved settings do not grant access to data the user cannot otherwise view.

### Proposed report composition flow

**Choose objects → Set client context → Query and filter → Group and measure → Configure spatial presentation → Preview → Save**

The builder pairs a 2D configuration panel with a live spatial preview.

### Report-object behavior

| Represented object | Selection result |
|---|---|
| Process or journey | Show a summary and an explicit action to enter its environment |
| Process step | Open its 2D workspace with a return link to the report |
| Data element or record | Open detail with source context and relationships |
| Aggregated group | Show its definition and constituent records |
| Task or approval | Open the work item and its linked process context |

Report geometry must be traceable to the displayed data. Legends explain encodings; numerical values remain available in readable detail. A corresponding 2D list or table supports precise comparison and accessibility.

Empty results, unavailable data, loading, and errors have distinct states. Missing values must not appear as zero.

## 6. Avatar and session continuity

**Requirement:** every user has an individual 3D geometric avatar. The avatar anchors the user’s location in the product, including where they left off.

The saved session context should include:

| Context | What resumes |
|---|---|
| Active destination | Module, journey, or saved reporting view |
| Client context | The client currently being viewed |
| Spatial location | Avatar position within that environment |
| Viewpoint | Camera orientation and zoom |
| Active selection | Selected process step or data object |
| Work context | Relevant task and open workspace |
| View configuration | Applied filters and selected saved view |

**Proposed persistence rule:** save resumable context to the user’s account, using local cache to support quick recovery. Local cache alone should not be the sole record of the user’s last location.

Save on meaningful navigation changes and during use, not only on logout. Restoring a session must recheck access and object availability.

If the last destination is unavailable, place the user at the nearest valid parent destination or Home and explain what could not be restored.

Location recovery does not imply that unsaved form edits were saved. Draft recovery is a separate behavior that must be visibly identified.

## 7. Home configuration and sign-in behavior

Users configure the content and ordering of their Home screen.

Proposed components:

- Resume last location.
- My tasks.
- Pending approvals.
- Pinned client views.
- Saved reports.
- Recent journeys and objects.

Provide two explicit sign-in preferences:

| Preference | Behavior |
|---|---|
| Resume where I left off | Restore the most recent valid destination |
| Open my Home | Show personalized Home with a prominent resume action |

**Proposed default:** resume where the user left off after the first session. Home remains directly accessible from every destination.

This preserves continuity while supporting users who prefer to start with tasks or approvals.

## 8. Visual language and interaction consistency

Retain the prior crystalline direction: dark spatial environments, parchment-toned typography, and teal, gold, and mauve accents.

Proposed conventions:

- Distinct silhouettes identify module and object types.
- Labels and symbols communicate state alongside color.
- Motion explains entering, exiting, selecting, and traveling.
- Reduced-motion settings replace extended travel animations with direct transitions.
- A persistent location cue answers: “Where am I, and what am I working on?”
- Every immersive destination provides Home, back, and reopen-navigation controls.
- Mobile process work uses a full-screen 2D workspace and restores the spatial scene on exit.
- Keyboard-accessible destination and object lists provide an alternative to spatial movement.

## 9. Validation checklist

The design is ready for implementation review when a walkthrough can demonstrate:

1. Entering each journey produces a navigable 3D environment.
2. The navigation collapses on spatial entry and can always be reopened.
3. Selecting a process step opens the correct 2D data interface.
4. Closing a step returns to the same spatial position.
5. A report object resolves to its represented process, data, or aggregation.
6. A user can save separate filtered views for different clients.
7. Saved views preserve their query, layout, and visual meanings.
8. Each user has an individual geometric avatar.
9. Returning after logout restores the last valid context.
10. Home configuration and resume preferences work together.
11. Restricted or removed destinations recover gracefully.
12. Report values remain understandable without relying solely on 3D geometry or color.

## 10. Next visual plates

The next design pass should illustrate these six connected screens:

1. **Basin Map:** expanded navigation and spatial module destinations.
2. **Journey Interior:** avatar, terrain, step objects, and collapsed navigation.
3. **Selected Process Step:** 2D workspace within preserved journey context.
4. **Spatial Reporting:** report objects, legend, filters, and selected-object detail.
5. **View Builder:** query controls beside the spatial preview.
6. **Personal Home and Avatar:** home configuration, resume destination, and avatar settings.

These plates should use one consistent sample journey and client context so the complete interaction can be followed across screens.
:::

