::codex-realtime-inline{}
:::writing{variant="document" id="58319"}
# Salt Basin — Additional Requirements and Discussion Bookmark

## Where the discussion left off

**The topic immediately before platform configuration was agent debugging and validation.** You wanted to inspect how source values pass through connector calls, translations, rules, and formulas to produce a final result.

That led to the idea of a **Builder module** that stores those definitions and lets you use Salt Basin to build Salt Basin.

Before debugging, you described **voice and text agents** that navigate the experience and help collect or update data.

## Additions to the design specification

| Area | Requirement | Proposed design treatment |
|---|---|---|
| Device support | Support mobile, tablet, and laptop | Preserve the same modules, permissions, and data across devices; adapt controls, panel layout, and scene complexity |
| Mobile | Retain immersive navigation and 2D data interaction | Touch navigation; tap instead of hover; full-screen step workspaces; compact sun control |
| Tablet | Support spatial exploration alongside work | Touch-first controls; landscape split view where space permits; expandable workspace |
| Laptop | Support detailed configuration and exploration | Keyboard and pointer navigation; resizable panels; larger spatial view |
| Provisioning | Associate each provisioned license with a user profile through the existing provisioning application | Map the existing provisioned entitlement to available sun configuration, planets, orbits, and capabilities; verify the current integration before implementation |
| User preferences | Personalize the licensed experience | Shine dimensions select among authorized destinations; preferences cannot enable unlicensed capabilities |
| Journey camera | Show the avatar ahead of the viewer with the next one or two steps visible | Third-person, over-the-shoulder camera; immersive depth without requiring a VR headset |
| Journey setting | Define the environment for each journey | Configurable scene types: outdoor hike, salt-flat crossing, river travel, or underwater exploration |
| Connecting objects | Represent process connections spatially | Define paths, channels, bridges, or other 3D connectors and their process meaning |
| Goal mountain | Represent progress toward a defined goal | Position authorized participants’ avatars according to a specified progress measure |
| Peer comparison | Compare relevant users against a goal | Define participating actors, territory or team, period, target, and comparison permissions |
| Event animation | Show meaningful changes as scene events | Associate events such as ticket or lead inflows with defined animation rules |
| Basin water | Represent a selected measure through water behavior | Define the measure, unit, period, and calculation before mapping it to water level or evaporation |
| Sun and sky | Remain visible within journeys | Preserve the sun in the scene or compact sky window, with an explanation of its current meaning |
| Moon phases | Represent journey or renewal progression | Configure the mapping between business state and phase; distinguish active-cycle progress from completed history |
| Completed moons | Preserve completed renewal milestones | Count completed cycles; interpret them as years only when each cycle is explicitly annual |
| Agent interaction | Accept voice and typed requests | Provide visible navigation, data collection, action status, and results |
| Agent identity | Give each agent a geometric avatar | Distinguish agents from human users and display their role and scope |
| Data identity | Give data elements a visual representation | Define a 3D representation for each element type; render instances at an appropriate level of detail |
| Agent Hub | Provide a place to discover and configure agents | Orbital destination with agent avatars, hierarchy, definitions, activity, and diagnostics |
| Builder module | Persist the definitions used to construct the product | Configuration journeys for modules, scenes, screens, processes, data, rules, agents, and use cases |

**License integration boundary:** the existing provisioning application is user-reported and has not yet been inspected. This document requires its reuse; it does not assume its current fields or behavior.

## Agent debugging: proposed design contract

An authorized builder needs a visible execution record showing **what ran, what data it used, which rule version applied, what it returned, and what happened next**.

| Diagnostic item | Information to record |
|---|---|
| Request context | User, agent, permitted scope, client context, request time |
| Execution step | Operation, parent step, sequence, start/end time, status |
| External lookup | Connector, query scope, source timestamp, response status |
| Input evidence | Values actually used, subject to access and retention rules |
| Translation | Mapping version, incoming value, translated value, validation result |
| Rule or formula | Version, named inputs, output, expected conditions |
| Model operation | Model/configuration reference, supplied context, returned output, validation result |
| Downstream use | Which subsequent step consumed the output |
| Data change | Intended change, authorization outcome, committed result |
| Failure or mismatch | Failed condition, affected value, responsible step, next diagnostic action |

The diagnostic screen should let a builder select a final value and follow its dependencies backward to the source. It should also show where an expected mapping or validation first failed.

This is an execution and data-lineage record; it does not depend on exposing a model’s private internal reasoning.

### External data and replay

Where permitted, preserve the minimum source values needed to explain a transformation, together with their provenance and retention policy. If values cannot be retained, keep references and clearly identify the resulting replay limitation.

Persisting external values is a deliberate cache or evidence snapshot, even when the connector otherwise uses a zero-copy approach. The configuration must make that distinction explicit.

Separate:

- **Recorded inspection:** examine the inputs and outputs of the original run.
- **Rule replay:** rerun a versioned deterministic transformation against captured inputs.
- **Fresh execution:** query current sources or call the model again; results may differ.

A tightly scoped dataset and deterministic rules constrain an agent, but do not by themselves make its language-model output deterministic.

## Builder module: persisted definition map

| Definition | Relationships it must preserve |
|---|---|
| Module | License entitlements, planet, child objects, screens, journeys |
| Screen | Components, data bindings, device layouts, navigation behavior |
| Journey | Actor, subject, stages, scene type, camera, connections |
| Stage | Fields, entry/exit conditions, evidence, actions, workspace |
| Visual object | Represented entity, geometry, material, interaction, state encoding |
| Metric / event | Calculation, scope, period, thresholds, animation or environmental effect |
| Agent | Avatar, hierarchy, dataset scope, tools, rules, diagnostics |
| Translation / rule | Inputs, outputs, version, validations, execution evidence |
| User profile | Provisioned entitlements, avatar, preferences, saved location |
| Use case | Applicable modules, actors, processes, views, and configuration variants |

**Proposed configuration lifecycle:** draft → validate → preview → publish a version. Existing journeys and execution records retain the definition version needed to explain their behavior.
:::

