# API — server/routes/journeyRods.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-journey-rods-scenario-library-apply | POST | `/api/journey-rods/scenario-library/apply` | `server/routes/journeyRods.js:15` | inline: requireAdmin; handler: requireRodOwnerOrAdmin |  |
| TE-API-GET-api-journey-rods-me | GET | `/api/journey-rods/me` | `server/routes/journeyRods.js:29` | inline: requireUser |  |
| TE-API-GET-api-journey-rods-catalog | GET | `/api/journey-rods/catalog` | `server/routes/journeyRods.js:37` | inline: requireUser |  |
| TE-API-POST-api-journey-rods | POST | `/api/journey-rods` | `server/routes/journeyRods.js:47` | inline: requireUser |  |
| TE-API-GET-api-journey-rods-lead-leadId | GET | `/api/journey-rods/lead/:leadId` | `server/routes/journeyRods.js:71` | inline: requireAdmin |  |
| TE-API-GET-api-journey-rods-stage-gates | GET | `/api/journey-rods/stage-gates` | `server/routes/journeyRods.js:77` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-stage-gates-rodType-stageKey | PUT | `/api/journey-rods/stage-gates/:rodType/:stageKey` | `server/routes/journeyRods.js:81` | inline: requireAdmin |  |
| TE-API-GET-api-journey-rods-path | GET | `/api/journey-rods/${path}` | `server/routes/journeyRods.js:95` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-molecules-key | PUT | `/api/journey-rods/molecules/:key` | `server/routes/journeyRods.js:97` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-clusters-key | PUT | `/api/journey-rods/clusters/:key` | `server/routes/journeyRods.js:105` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-scenarios-key | PUT | `/api/journey-rods/scenarios/:key` | `server/routes/journeyRods.js:107` | inline: requireAdmin |  |
| TE-API-GET-api-journey-rods-currents | GET | `/api/journey-rods/currents` | `server/routes/journeyRods.js:112` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-currents-key | PUT | `/api/journey-rods/currents/:key` | `server/routes/journeyRods.js:119` | inline: requireAdmin |  |
| TE-API-GET-api-journey-rods-scenarios-generate-preview | GET | `/api/journey-rods/scenarios/generate/preview` | `server/routes/journeyRods.js:144` | inline: requireAdmin |  |
| TE-API-POST-api-journey-rods-scenarios-generate | POST | `/api/journey-rods/scenarios/generate` | `server/routes/journeyRods.js:149` | inline: requireAdmin |  |
| TE-API-PUT-api-journey-rods-scenarios-key-gates-stageKey | PUT | `/api/journey-rods/scenarios/:key/gates/:stageKey` | `server/routes/journeyRods.js:164` | inline: requireAdmin,required_clusters,required_molecules,required_dimensions,required_actor_roles,requiredClusters,requiredMolecules,requiredDimensions,requiredActorRoles |  |
| TE-API-POST-api-journey-rods-rodId-actors | POST | `/api/journey-rods/:rodId/actors` | `server/routes/journeyRods.js:166` | inline: requireAdmin,required,required_from_stage,requiredFromStage; handler: requireRodOwnerOrAdmin |  |
| TE-API-GET-api-journey-rods-rodId-threshold-profile | GET | `/api/journey-rods/:rodId/threshold-profile` | `server/routes/journeyRods.js:168` | inline: requireUser,requireRodOwnerOrAdmin; handler: requireRodOwnerOrAdmin |  |
| TE-API-PUT-api-journey-rods-rodId-threshold-profile | PUT | `/api/journey-rods/:rodId/threshold-profile` | `server/routes/journeyRods.js:169` | inline: requireUser,requireRodOwnerOrAdmin; handler: requireRodOwnerOrAdmin |  |
| TE-API-POST-api-journey-rods-rodId-evidence | POST | `/api/journey-rods/:rodId/evidence` | `server/routes/journeyRods.js:171` | inline: requireUser; handler: requireRodOwnerOrAdmin |  |
| TE-API-POST-api-journey-rods-rodId-evaluate | POST | `/api/journey-rods/:rodId/evaluate` | `server/routes/journeyRods.js:175` | inline: requireUser; handler: requireRodOwnerOrAdmin |  |
| TE-API-GET-api-journey-rods-decisions-pending | GET | `/api/journey-rods/decisions/pending` | `server/routes/journeyRods.js:179` | inline: requireAdmin; handler: requireRodOwnerOrAdmin |  |
| TE-API-GET-api-journey-rods-rodId | GET | `/api/journey-rods/:rodId` | `server/routes/journeyRods.js:180` | inline: requireUser; handler: requireRodOwnerOrAdmin |  |
| TE-API-POST-api-journey-rods-decisions-id-resolve | POST | `/api/journey-rods/decisions/:id/resolve` | `server/routes/journeyRods.js:194` | inline: requireAdmin |  |
