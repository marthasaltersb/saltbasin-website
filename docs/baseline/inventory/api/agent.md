# API — server/routes/agent.js

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


[← API index](../api-endpoints.md)

| Element ID | Method | Path | Location | Guard evidence | Notes |
|---|---|---|---|---|---|
| TE-API-GET-api-agent-threads | GET | `/api/agent/threads` | `server/routes/agent.js:113` | router: requireAdmin |  |
| TE-API-POST-api-agent-threads | POST | `/api/agent/threads` | `server/routes/agent.js:120` | router: requireAdmin |  |
| TE-API-GET-api-agent-context-profiles | GET | `/api/agent/context-profiles` | `server/routes/agent.js:133` | router: requireAdmin |  |
| TE-API-POST-api-agent-context-profiles | POST | `/api/agent/context-profiles` | `server/routes/agent.js:139` | router: requireAdmin |  |
| TE-API-GET-api-agent-knowledge | GET | `/api/agent/knowledge` | `server/routes/agent.js:148` | router: requireAdmin |  |
| TE-API-PATCH-api-agent-knowledge-id | PATCH | `/api/agent/knowledge/:id` | `server/routes/agent.js:153` | router: requireAdmin |  |
| TE-API-GET-api-agent-code-runs | GET | `/api/agent/code-runs` | `server/routes/agent.js:164` | router: requireAdmin |  |
| TE-API-POST-api-agent-code-runs | POST | `/api/agent/code-runs` | `server/routes/agent.js:172` | router: requireAdmin |  |
| TE-API-POST-api-agent-code-runs-id-approve | POST | `/api/agent/code-runs/:id/approve` | `server/routes/agent.js:183` | router: requireAdmin |  |
| TE-API-POST-api-agent-code-runs-id-reject | POST | `/api/agent/code-runs/:id/reject` | `server/routes/agent.js:193` | router: requireAdmin |  |
| TE-API-GET-api-agent-code-runs-id-events | GET | `/api/agent/code-runs/:id/events` | `server/routes/agent.js:201` | router: requireAdmin |  |
| TE-API-GET-api-agent-backlog-reconciliation | GET | `/api/agent/backlog-reconciliation` | `server/routes/agent.js:209` | router: requireAdmin |  |
| TE-API-POST-api-agent-backlog-reconciliation | POST | `/api/agent/backlog-reconciliation` | `server/routes/agent.js:215` | router: requireAdmin |  |
| TE-API-GET-api-agent-threads-id-messages | GET | `/api/agent/threads/:id/messages` | `server/routes/agent.js:234` | router: requireAdmin |  |
| TE-API-DELETE-api-agent-threads-id | DELETE | `/api/agent/threads/:id` | `server/routes/agent.js:245` | router: requireAdmin |  |
| TE-API-POST-api-agent-chat | POST | `/api/agent/chat` | `server/routes/agent.js:252` | router: requireAdmin |  |
