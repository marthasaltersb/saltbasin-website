# API — server/routes/careerPlacementAgents.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-career-agents-agent-hub | GET | `/api/career-agents/agent-hub` | `server/routes/careerPlacementAgents.js:52` | inline: requireUser |  |
| TE-API-GET-api-career-agents-opportunities | GET | `/api/career-agents/opportunities` | `server/routes/careerPlacementAgents.js:61` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities | POST | `/api/career-agents/opportunities` | `server/routes/careerPlacementAgents.js:70` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-scores | POST | `/api/career-agents/opportunities/:id/scores` | `server/routes/careerPlacementAgents.js:80` | inline: requireUser |  |
| TE-API-POST-api-career-agents-import | POST | `/api/career-agents/import` | `server/routes/careerPlacementAgents.js:98` | inline: requireUser |  |
| TE-API-POST-api-career-agents-research | POST | `/api/career-agents/research` | `server/routes/careerPlacementAgents.js:138` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-import-output | POST | `/api/career-agents/opportunities/:id/import-output` | `server/routes/careerPlacementAgents.js:158` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-POST-api-career-agents-opportunities-id-generate-resume | POST | `/api/career-agents/opportunities/:id/generate-resume` | `server/routes/careerPlacementAgents.js:187` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-POST-api-career-agents-opportunities-id-resume-outputs | POST | `/api/career-agents/opportunities/:id/resume-outputs` | `server/routes/careerPlacementAgents.js:201` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-GET-api-career-agents-opportunities-id-resume-outputs | GET | `/api/career-agents/opportunities/:id/resume-outputs` | `server/routes/careerPlacementAgents.js:218` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-GET-api-career-agents-resume-outputs-id-view | GET | `/api/career-agents/resume-outputs/:id/view` | `server/routes/careerPlacementAgents.js:235` | inline: requireUser |  |
| TE-API-GET-api-career-agents-resume-outputs-id-download-pdf | GET | `/api/career-agents/resume-outputs/:id/download.pdf` | `server/routes/careerPlacementAgents.js:245` | inline: requireUser |  |
| TE-API-POST-api-career-agents-resume-outputs-export-zip | POST | `/api/career-agents/resume-outputs/export-zip` | `server/routes/careerPlacementAgents.js:261` | inline: requireUser |  |
| TE-API-POST-api-career-agents-resume-outputs-email | POST | `/api/career-agents/resume-outputs/email` | `server/routes/careerPlacementAgents.js:291` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-approve | POST | `/api/career-agents/opportunities/:id/approve` | `server/routes/careerPlacementAgents.js:324` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-advance-stage | POST | `/api/career-agents/opportunities/:id/advance-stage` | `server/routes/careerPlacementAgents.js:336` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-generate-cover-letter | POST | `/api/career-agents/opportunities/:id/generate-cover-letter` | `server/routes/careerPlacementAgents.js:350` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-POST-api-career-agents-opportunities-id-cover-letter-outputs | POST | `/api/career-agents/opportunities/:id/cover-letter-outputs` | `server/routes/careerPlacementAgents.js:362` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-POST-api-career-agents-verify-pipeline | POST | `/api/career-agents/verify-pipeline` | `server/routes/careerPlacementAgents.js:383` | inline: requireUser |  |
| TE-API-POST-api-career-agents-auto-queue-outputs | POST | `/api/career-agents/auto-queue-outputs` | `server/routes/careerPlacementAgents.js:392` | inline: requireUser |  |
| TE-API-POST-api-career-agents-generate-resume-queue | POST | `/api/career-agents/generate-resume-queue` | `server/routes/careerPlacementAgents.js:418` | inline: requireUser |  |
| TE-API-GET-api-career-agents-schedule | GET | `/api/career-agents/schedule` | `server/routes/careerPlacementAgents.js:472` | inline: requireUser |  |
| TE-API-POST-api-career-agents-schedule | POST | `/api/career-agents/schedule` | `server/routes/careerPlacementAgents.js:498` | inline: requireUser |  |
| TE-API-GET-api-career-agents-verification-current | GET | `/api/career-agents/verification-current` | `server/routes/careerPlacementAgents.js:530` | inline: requireUser |  |
| TE-API-PUT-api-career-agents-verification-current | PUT | `/api/career-agents/verification-current` | `server/routes/careerPlacementAgents.js:540` | inline: requireAdmin |  |
| TE-API-GET-api-career-agents-opportunities-id-outreach | GET | `/api/career-agents/opportunities/:id/outreach` | `server/routes/careerPlacementAgents.js:567` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-outreach-start | POST | `/api/career-agents/opportunities/:id/outreach/start` | `server/routes/careerPlacementAgents.js:576` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-outreach-research-contacts | POST | `/api/career-agents/opportunities/:id/outreach/research-contacts` | `server/routes/careerPlacementAgents.js:585` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-outreach-draft-message | POST | `/api/career-agents/opportunities/:id/outreach/draft-message` | `server/routes/careerPlacementAgents.js:597` | inline: requireUser |  |
| TE-API-POST-api-career-agents-opportunities-id-outreach-messages | POST | `/api/career-agents/opportunities/:id/outreach/messages` | `server/routes/careerPlacementAgents.js:610` | inline: requireUser; handler: requireOwnedOpportunity |  |
| TE-API-POST-api-career-agents-outreach-id-merge-outcome | POST | `/api/career-agents/outreach/:id/merge-outcome` | `server/routes/careerPlacementAgents.js:627` | inline: requireUser |  |
