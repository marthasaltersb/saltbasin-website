# API — server/routes/feedback.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-POST-api-feedback | POST | `/api/feedback` | `server/routes/feedback.js:59` | inline: requireUser |  |
| TE-API-GET-api-feedback-mine | GET | `/api/feedback/mine` | `server/routes/feedback.js:82` | inline: requireUser |  |
| TE-API-POST-api-feedback-id-upvote | POST | `/api/feedback/:id/upvote` | `server/routes/feedback.js:91` | inline: requireUser |  |
| TE-API-GET-api-feedback | GET | `/api/feedback` | `server/routes/feedback.js:108` | inline: requireAdmin |  |
| TE-API-PATCH-api-feedback-id | PATCH | `/api/feedback/:id` | `server/routes/feedback.js:121` | inline: requireAdmin |  |
| TE-API-POST-api-feedback-id-route | POST | `/api/feedback/:id/route` | `server/routes/feedback.js:139` | inline: requireAdmin |  |
| TE-API-GET-api-feedback-category-weights | GET | `/api/feedback/category-weights` | `server/routes/feedback.js:154` | inline: requireUser,requireAdminOrAdvisor |  |
| TE-API-PATCH-api-feedback-category-weights-category | PATCH | `/api/feedback/category-weights/:category` | `server/routes/feedback.js:163` | inline: requireUser,requireAdminOrAdvisor |  |
| TE-API-GET-api-feedback-advisors | GET | `/api/feedback/advisors` | `server/routes/feedback.js:182` | inline: requireAdmin |  |
| TE-API-POST-api-feedback-advisors | POST | `/api/feedback/advisors` | `server/routes/feedback.js:195` | inline: requireAdmin |  |
| TE-API-DELETE-api-feedback-advisors-userId | DELETE | `/api/feedback/advisors/:userId` | `server/routes/feedback.js:213` | inline: requireAdmin |  |
