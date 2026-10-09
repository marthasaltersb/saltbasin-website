# API — server/routes/agentHub.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-agent-hub-definitions | GET | `/api/agent-hub/definitions` | `server/routes/agentHub.js:129` | router: requireUser |  |
| TE-API-POST-api-agent-hub-definitions | POST | `/api/agent-hub/definitions` | `server/routes/agentHub.js:145` | router: requireUser |  |
| TE-API-PATCH-api-agent-hub-definitions-id | PATCH | `/api/agent-hub/definitions/:id` | `server/routes/agentHub.js:177` | router: requireUser; handler: requireManageableDefinition |  |
| TE-API-DELETE-api-agent-hub-definitions-id | DELETE | `/api/agent-hub/definitions/:id` | `server/routes/agentHub.js:208` | router: requireUser; handler: requireManageableDefinition |  |
| TE-API-POST-api-agent-hub-definitions-id-run-now | POST | `/api/agent-hub/definitions/:id/run-now` | `server/routes/agentHub.js:215` | router: requireUser; handler: requireManageableDefinition |  |
| TE-API-GET-api-agent-hub-runs | GET | `/api/agent-hub/runs` | `server/routes/agentHub.js:232` | router: requireUser |  |
| TE-API-GET-api-agent-hub-runs-id | GET | `/api/agent-hub/runs/:id` | `server/routes/agentHub.js:248` | router: requireUser |  |
| TE-API-PATCH-api-agent-hub-findings-id | PATCH | `/api/agent-hub/findings/:id` | `server/routes/agentHub.js:259` | router: requireUser |  |
