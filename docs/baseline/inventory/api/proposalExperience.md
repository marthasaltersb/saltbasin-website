# API — server/routes/proposalExperience.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-proposal-experience-state | GET | `/api/proposal-experience/state` | `server/routes/proposalExperience.js:33` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-versions | GET | `/api/proposal-experience/versions` | `server/routes/proposalExperience.js:58` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-admin-userId-versions | GET | `/api/proposal-experience/admin/:userId/versions` | `server/routes/proposalExperience.js:65` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-feedback | GET | `/api/proposal-experience/feedback` | `server/routes/proposalExperience.js:73` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-feedback | POST | `/api/proposal-experience/feedback` | `server/routes/proposalExperience.js:80` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-feedback-publish | POST | `/api/proposal-experience/feedback/publish` | `server/routes/proposalExperience.js:90` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-admin-userId-versions | POST | `/api/proposal-experience/admin/:userId/versions` | `server/routes/proposalExperience.js:99` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-admin-userId-compile | POST | `/api/proposal-experience/admin/:userId/compile` | `server/routes/proposalExperience.js:109` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-deliver | POST | `/api/proposal-experience/admin/:userId/versions/:versionId/deliver` | `server/routes/proposalExperience.js:125` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-approve | POST | `/api/proposal-experience/admin/:userId/versions/:versionId/approve` | `server/routes/proposalExperience.js:161` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-admin-userId-versions-versionId-contract | POST | `/api/proposal-experience/admin/:userId/versions/:versionId/contract` | `server/routes/proposalExperience.js:172` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-highways | GET | `/api/proposal-experience/highways` | `server/routes/proposalExperience.js:184` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-sections | GET | `/api/proposal-experience/sections` | `server/routes/proposalExperience.js:190` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-diagnostic | GET | `/api/proposal-experience/diagnostic` | `server/routes/proposalExperience.js:197` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-opportunity | GET | `/api/proposal-experience/opportunity` | `server/routes/proposalExperience.js:204` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-evidence | GET | `/api/proposal-experience/evidence` | `server/routes/proposalExperience.js:214` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-events-stage-viewed | POST | `/api/proposal-experience/events/stage-viewed` | `server/routes/proposalExperience.js:220` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-events-scenario-expanded | POST | `/api/proposal-experience/events/scenario-expanded` | `server/routes/proposalExperience.js:231` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-events-evidence-opened | POST | `/api/proposal-experience/events/evidence-opened` | `server/routes/proposalExperience.js:240` | router: requireUser |  |
| TE-API-GET-api-proposal-experience-document | GET | `/api/proposal-experience/document` | `server/routes/proposalExperience.js:251` | router: requireUser |  |
| TE-API-POST-api-proposal-experience-decision | POST | `/api/proposal-experience/decision` | `server/routes/proposalExperience.js:258` | router: requireUser |  |
