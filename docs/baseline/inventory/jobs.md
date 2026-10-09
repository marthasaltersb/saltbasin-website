# Background jobs and timers (server)

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


9 scheduling call sites. Static extraction only — whether a job is actually started depends on its caller being reached at boot (see module specs).

| Element ID | Kind | Schedule | Location |
|---|---|---|---|
| TE-JOB-index-L285 | node-cron | `0 2 * * *` | `server/index.js:285` |
| TE-JOB-index-L299 | node-cron | `* * * * *` | `server/index.js:299` |
| TE-JOB-index-L275 | setInterval | `every 60 * 60 * 1000 ms` | `server/index.js:275` |
| TE-JOB-index-L279 | setInterval | `every 60 * 60 * 1000 ms` | `server/index.js:279` |
| TE-JOB-index-L284 | setInterval | `every 60 * 60 * 1000 ms` | `server/index.js:284` |
| TE-JOB-index-L289 | setInterval | `every 6 * 60 * 60 * 1000 ms` | `server/index.js:289` |
| TE-JOB-index-L330 | setInterval | `every 24 * 60 * 60 * 1000 ms` | `server/index.js:330` |
| TE-JOB-lib-agentDispatcher-L96 | setInterval | `see source` | `server/lib/agentDispatcher.js:96` |
| TE-JOB-routes-portfolioRequests-L110 | setInterval | `every 60 * 60 * 1000 ms` | `server/routes/portfolioRequests.js:110` |
