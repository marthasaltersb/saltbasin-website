# Interface Intelligence Technical Blueprint

Version: v1
Status: Implementation-ready architecture draft

## Architecture Recommendation

Build this as an extension of the existing Salt Basin lineage foundation, not as a separate black-box product. The current code already captures field-level deltas, context hashes, snapshots, source types, source refs, authors, and timestamps. Interface Intelligence should add transaction identity, connector identity, lifecycle tokens, waterfall steps, control evidence, agent analyses, usage metering, and memory governance.

## Core Tables

| Table | Purpose |
|---|---|
| interface_connectors | Registered source/target systems, provider, tenant, auth scope, environment, owner, status. |
| interface_transactions | One durable interface event across API call, webhook, import, export, sync, job, or manual upload. |
| interface_transaction_steps | Ordered waterfall steps inside a transaction: extract, map, transform, validate, enrich, write, acknowledge, retry. |
| interface_field_lineage | Field-level value movement, previous value, transformed value, rule id, confidence, hash, and masking policy. |
| lineage_tokens | Revenue Lifecycle Token, Customer Journey Token, Member Journey Token, and supporting agent-token records. |
| token_edges | Relationships among lead, account, payer, employer, plan, site, member, user, opportunity, quote, contract, order, subscription, invoice, payment, revenue schedule, case, and change request. |
| member_identity_links | Links payer, customer, parent org, child org, site, provider, employer group, plan, member, end user, and free-tier identity records. |
| member_entitlements | Captures covered population, license type, eligibility, activation, utilization, support coverage, access tier, and renewal/change status. |
| token_stage_gates | Stores required inputs, outputs, decisions, approvals, and evidence for each token stage gate. |
| contribution_events | Tracks human, user-type, team, system, AI agent, workflow, and technology contributions to each transaction or token outcome. |
| confidence_reconciliations | Records conflicting evidence, coverage scores, confidence scores, agent review, human review, and final resolution. |
| interface_controls | Required controls and policies for a connector, object, lifecycle stage, or field class. |
| control_executions | Evidence that a control ran, passed, failed, was skipped, or required human review. |
| agent_transaction_analyses | Agent-produced explanations, risks, root-cause hypotheses, confidence, and recommendations. |
| memory_candidates | Governed reusable knowledge candidates created from transaction patterns. |
| usage_meter_events | Salt Basin API metering event at the moment of billable capability consumption. |

## Event Capture Contract

Each captured interface transaction should include:

- Identity: transaction id, correlation id, idempotency key, connector id, environment, tenant, timestamp.
- Direction: source system, target system, source object, target object, operation, trigger.
- Payload: raw payload reference, masked payload summary, before/after values, schema version.
- Transformation: rule id, mapping version, formula, enrichment source, fallback/default logic.
- Waterfall: ordered steps, duration, status, retry count, actor, system response.
- Lifecycle: revenue lifecycle token, customer journey token, member journey token, supporting agent tokens, stage, canonical entity ids.
- Contract and entitlement: payer, bill-to, sold-to, ship-to/fulfill-to, covered organization, covered member population, performance obligations, renewal notice, support terms, pricing model, usage model, discounts, variable consideration, payment method, remittance method, and invoice destination.
- Stage gates: required inputs, outputs, approvals, blockers, decision owner, resource contributors, technology contributors, and output artifacts.
- Contribution: people, user types, teams, systems, AI agents, workflows, and technology resources that contributed to the transaction, plus cost basis and ROI attribution where supportable.
- Governance: evidence status, control policy, sensitivity level, retention policy, approval state.
- Agent output: summary, anomaly flags, root-cause hypothesis, confidence, recommended action.

## API Surface

| Endpoint | Purpose | Billable |
|---|---|---|
| POST /api/v1/interface-intelligence/events | Capture one transaction event. | Conditional |
| POST /api/v1/interface-intelligence/events/batch | Capture batch imports, ETL jobs, or sync windows. | Conditional |
| GET /api/v1/interface-intelligence/transactions/:id | Retrieve transaction forensic record. | No |
| GET /api/v1/interface-intelligence/tokens/:tokenId/graph | Retrieve revenue, customer, member, and supporting-token graph. | No or premium by depth |
| POST /api/v1/interface-intelligence/analyze/transaction | Run agent analysis on one transaction. | Yes |
| POST /api/v1/interface-intelligence/analyze/token | Run cross-system analysis for a token. | Yes |
| POST /api/v1/interface-intelligence/connectors/validate | Validate connector access, object visibility, scope, rate limits. | Conditional |
| POST /api/v1/pricing/estimate | Estimate contribution-intelligence usage, volume, and advisory scope. | No |

## Security And Governance

Do not rely on client system tokens as Salt Basin's security model. Salt Basin needs its own tenant auth, scoped API keys or OAuth client credentials, RBAC, object-level authorization, audit log, webhook signatures, rate limits, idempotency keys, encrypted credentials, retention controls, redaction policy, and production/sandbox separation.

## MVP Implementation Path

1. Extend the current lineage service with transaction id, connector id, lifecycle stage, token id, member token id, stage-gate id, and sensitivity fields.
2. Add interface transaction and step tables through idempotent database migrations.
3. Add API capture endpoints with strict schema validation and idempotency.
4. Add a transaction forensic view in the admin lineage panel.
5. Add first agent analyses: anomaly explanation, token trace, member entitlement trace, contract obligation trace, contribution breakdown, and control evidence summary.
6. Add usage meter events for billable agent and connector intelligence calls.
7. Add public-safe output templates for executive briefs, heatmaps, and evidence matrices.
