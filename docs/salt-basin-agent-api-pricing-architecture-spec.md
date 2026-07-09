# Salt Basin Agent API Pricing And Architecture Spec

Version: 2026-07-09
Owner: Salt Basin
Status: Working commercial and technical architecture

## 1. Executive Intent

Salt Basin should package its agents as a metered Contribution Intelligence API, not as a hidden resale layer for Claude or any other model provider. The API price should be based on the operational value created for the client, adjusted by usage volume, risk, complexity, and required governance. Model costs, infrastructure costs, and support costs should be measured for margin control, but they should not be the primary pricing anchor.

The recommended commercial posture:

```text
Client pays Salt Basin for agent capability, orchestration, context architecture, connector governance,
methodology, decision quality, auditability, and measurable contribution to business outcomes.
Client can bring its own model provider, credentials, cloud tenant, or enterprise AI endpoint.
Salt Basin meters every billable capability call at time of request and records a durable usage event.
```

## 2. Product Packaging

### 2.1 Core Product

Product name:

```text
Salt Basin Contribution Intelligence API
```

Primary value:

```text
Turn enterprise operating evidence into governed agent-ready context, recommendations, decisions,
workflows, and measurable contribution intelligence.
```

### 2.2 Commercial Lines

| Line | Description | Billing Unit | Pricing Anchor |
|---|---|---:|---|
| Agent API | Self-service metered API access for client systems and workflows | Billable capability call | Value capture per successful call |
| Connector Overlay | Enterprise source-system validation, mapping, context packaging, and write-back governance | Connector call or monthly connector fee | Complexity and operational criticality |
| Advisory Services | High-touch scoping, workshops, operating model design, and implementation roadmap | Fixed fee plus 25% deposit | Client value pool and initiative scope |
| Enterprise Governance | SSO, audit, tenant controls, private deployment support, security review, advanced SLA | Monthly platform fee | Risk, assurance, and support burden |

## 3. API Surface

All public endpoints should be versioned under:

```http
/api/v1
```

### 3.1 Authentication And Client Access APIs

| Endpoint | Method | Purpose | Billable | Notes |
|---|---:|---|---:|---|
| `/api/v1/auth/signup` | POST | Create client organization and first admin user | No | Captures identity, company profile, terms acceptance |
| `/api/v1/auth/session` | POST | Login/session exchange for web checkout/admin | No | Cookie/session for portal only |
| `/api/v1/oauth/token` | POST | Client credentials token issuance for API use | No | Returns short-lived scoped access token |
| `/api/v1/api-keys` | POST | Create environment-scoped API key | No | Prefer OAuth client credentials for enterprise |
| `/api/v1/api-keys/:id/revoke` | POST | Revoke API key | No | Immediate revocation |
| `/api/v1/entitlements` | GET | Return allowed agents, connectors, limits, and scopes | No | Useful for client integration validation |

### 3.2 Checkout And Pricing APIs

| Endpoint | Method | Purpose | Billable | Notes |
|---|---:|---|---:|---|
| `/api/v1/checkout/intake` | POST | Save company, usage, dependency, and security intake | No | Creates pricing estimate input record |
| `/api/v1/pricing/estimate` | POST | Generate API and advisory price estimate | No | Uses value model, volume, complexity, and margin guardrails |
| `/api/v1/checkout/session` | POST | Create checkout/payment session | No | Supports deposit, monthly minimum, or usage commit |
| `/api/v1/contracts/acceptance` | POST | Record terms, DPA, acceptable use, and security acknowledgments | No | Required before production API keys |
| `/api/v1/billing/usage-summary` | GET | Client usage summary and projected invoice | No | Portal and invoice reconciliation |

### 3.3 Agent Execution APIs

| Endpoint | Method | Purpose | Billable | Billable Unit |
|---|---:|---|---:|---|
| `/api/v1/agent-runs` | POST | Start an agent capability run | Yes | One agent run request accepted |
| `/api/v1/agent-runs/:id` | GET | Poll run state and result metadata | No | Not billable if used within fair-use polling limits |
| `/api/v1/agent-runs/:id/events` | POST | Append client-side progress, evidence, approval, or model-execution event | Conditional | Billable only for premium orchestration event types |
| `/api/v1/agent-runs/:id/cancel` | POST | Cancel queued/in-progress run | No | May still record non-billable usage event |
| `/api/v1/agent-runs/:id/retry` | POST | Retry failed run | Conditional | Billable only if failure was client-side or due to changed payload |

### 3.4 Context Package And Model Overlay APIs

| Endpoint | Method | Purpose | Billable | Notes |
|---|---:|---|---:|---|
| `/api/v1/context-packages` | POST | Generate structured prompt, schema, evidence map, tool plan, and governance instructions | Yes | Lower-priced than full reasoning call |
| `/api/v1/context-packages/:id` | GET | Retrieve a generated context package | No | Access-controlled by org and environment |
| `/api/v1/model-overlays/validate` | POST | Validate client-managed Claude, Bedrock, Azure, OpenAI, or private model endpoint configuration | No | Does not use Salt Basin model credentials |
| `/api/v1/model-overlays/execution-receipts` | POST | Client posts model execution metadata, token count, model used, and result reference | No | Used for audit and quality telemetry |

### 3.5 Connector And Enterprise System APIs

| Endpoint | Method | Purpose | Billable | Notes |
|---|---:|---|---:|---|
| `/api/v1/connectors` | GET | List supported connectors and required scopes | No | Public documentation plus tenant-specific availability |
| `/api/v1/connectors/:provider/config` | POST | Save connector configuration metadata | No | Credentials stored separately and encrypted |
| `/api/v1/connectors/:provider/validate` | POST | Validate OAuth scopes, endpoint, tenant URL, object access, and rate limits | Conditional | Free during setup; billable if used as continuous monitor |
| `/api/v1/connectors/:provider/object-profile` | POST | Profile source object volumes, fields, relationships, and freshness | Yes | Complexity-priced connector intelligence call |
| `/api/v1/connectors/:provider/sync-plan` | POST | Generate object-level sync and context ingestion plan | Yes | Often used during implementation |
| `/api/v1/connectors/:provider/writeback` | POST | Controlled write-back to enterprise system | Premium | Requires approval controls and stronger audit |

Supported providers should include Salesforce, Marketo, Snowflake, Salesforce Data Cloud, AWS, Microsoft Azure, PitchBook, Allvue, iLevel, Zuora, NetSuite, Oracle ERP, SAP, HubSpot, Supabase, Tableau, and Workday.

### 3.6 Metering And Audit APIs

| Endpoint | Method | Purpose | Billable | Notes |
|---|---:|---|---:|---|
| `/api/v1/usage-events` | POST | Internal-only durable usage event creation | No direct client call | Called by API middleware and workers |
| `/api/v1/usage-events/:id` | GET | Retrieve usage event detail | No | Client-visible audit record |
| `/api/v1/audit-log` | GET | Tenant audit trail | No | Available to admins and security reviewers |
| `/api/v1/webhooks` | POST | Register client webhook endpoint | No | Requires signature secret |
| `/api/v1/webhook-events/:id/replay` | POST | Replay a webhook delivery | Conditional | Free for Salt Basin failures, billable for client-side repeated replay above threshold |

## 4. Billable Call Types

| Call Type | Description | Suggested Base Price | Relative Complexity | Notes |
|---|---|---:|---:|---|
| `context_package` | Generate agent-ready prompt/context/tool/evidence package | $0.25-$1.25 | 1.0x | Good for client-managed model execution |
| `agent_reasoning` | Salt Basin agent performs structured analysis and returns governed result | $0.75-$4.00 | 2.0x | Higher if model execution is client-side but orchestration is deep |
| `connector_profile` | Analyze source system object, field, relationship, or lineage context | $0.50-$3.00 | 1.5x | Volume and connector complexity adjusted |
| `decision_recommendation` | Produce scored recommendation with assumptions, evidence, confidence, risks | $2.00-$10.00 | 4.0x | Use for high-value operating decisions |
| `workflow_orchestration` | Coordinate multi-system workflow or multi-agent sequence | $1.50-$8.00 | 3.0x | Often async and stateful |
| `writeback_action` | Governed write-back to CRM/ERP/CPQ/data system | $3.00-$15.00 | 5.0x | Requires approval, audit, rollback, and client policy gates |

## 5. Volume Pricing

Volume tiers should reward adoption while preserving gross margin. These are starting commercial ranges, not final list prices.

| Monthly Billable Calls | Suggested Discount | Effective Price Guidance | Packaging Note |
|---:|---:|---|---|
| 0-10,000 | 0% | Base price | Self-service pilot or low-volume advisory client |
| 10,001-50,000 | 10% | Base x 0.90 | Starter production |
| 50,001-250,000 | 20% | Base x 0.80 | Growth usage commitment |
| 250,001-1,000,000 | 30% | Base x 0.70 | Enterprise production |
| 1,000,001-5,000,000 | 40% | Base x 0.60 | Large enterprise or portfolio deployment |
| 5,000,001+ | Custom | Value-based enterprise agreement | Requires capacity and security review |

Recommended monthly minimums:

| Package | Monthly Minimum | Included Calls | Overage Logic |
|---|---:|---:|---|
| Developer | $1,500 | 2,500 | List price |
| Growth | $7,500 | 15,000 | Tiered discount |
| Enterprise | $25,000 | 75,000 | Committed usage with SLA |
| Strategic / PE | $75,000+ | Custom | Portfolio or multi-org model |

## 6. Value-Based Pricing Formula

The pricing estimate should calculate both a value-based target and a margin-protected floor.

### 6.1 Value-Based Target

```text
Annual Client Value Pool
x Contribution Intelligence Relevance Score
x Salt Basin Attribution Share
x Confidence Factor
/ Annual Billable Calls
= Value-Based Price Per Call
```

Inputs:

| Input | Meaning |
|---|---|
| Annual Client Value Pool | Estimated ARR expansion, churn reduction, margin lift, labor leverage, forecast accuracy value, risk avoidance, or operating improvement |
| Contribution Intelligence Relevance Score | How directly the agent supports the value pool |
| Salt Basin Attribution Share | Portion of value reasonably attributable to Salt Basin agent system |
| Confidence Factor | Discount for uncertainty, evidence quality, implementation risk, and adoption risk |
| Annual Billable Calls | Forecasted metered agent capability calls |

### 6.2 Margin-Protected Floor

```text
Fully Loaded Cost Per Call / (1 - Target Gross Margin)
= Margin-Protected Minimum Price Per Call
```

Fully loaded cost should include:

- Model execution cost, if Salt Basin executes any model steps.
- Context retrieval and embedding cost, if used.
- Connector API cost.
- Database read/write cost.
- Queue/worker/runtime cost.
- Observability, logs, and usage ledger cost.
- Security overhead.
- Support cost allocated per call.
- Expected retry/failure cost.

### 6.3 Recommended Price

```text
Recommended Price Per Call =
max(Value-Based Price Per Call after volume discount, Margin-Protected Minimum Price Per Call)
```

The checkout should show a range, not a false-precision quote, until the client completes scoping:

```text
Estimated API price: $0.80-$1.25 per billable agent call
Estimated monthly usage commitment: $15,000-$25,000
Advisory scoping deposit: $25,000
Estimated advisory fixed fee: $100,000
```

## 7. Token Architecture For Usage Measurement

Salt Basin needs two different meanings of "token":

1. Access token: proves the caller is allowed to use the API.
2. Usage token / metering event: records what was consumed at time of call.

Do not rely on client system tokens as Salt Basin's billing or security model. Client OAuth tokens authorize access to Salesforce, Snowflake, Azure, SAP, and similar systems. Salt Basin still needs its own auth, authorization, metering, and audit controls.

### 7.1 Access Token Model

Recommended enterprise pattern:

```text
OAuth 2.0 client credentials
short-lived JWT access token
organization-scoped
environment-scoped
agent-scoped
connector-scoped
rate-limit scoped
```

JWT claims:

```json
{
  "iss": "https://saltbasin.net",
  "sub": "client_app_123",
  "org_id": "org_123",
  "environment": "production",
  "scopes": [
    "agent:run",
    "context:create",
    "connector:salesforce:read",
    "usage:read"
  ],
  "entitlements": {
    "agents": ["contribution-intelligence-v1", "revops-reconciliation-v1"],
    "monthly_call_limit": 250000,
    "max_concurrent_runs": 25
  },
  "iat": 1783555200,
  "exp": 1783558800,
  "jti": "jwt_unique_id"
}
```

### 7.2 Idempotency Token

Every billable POST should require:

```http
Idempotency-Key: client-generated-unique-key
```

Purpose:

- Prevent duplicate billing if the client retries.
- Tie request, usage event, run record, and invoice line together.
- Let Salt Basin safely return the same result for duplicate requests.

### 7.3 Metering Event Token

At request acceptance, create a durable usage event:

```json
{
  "usage_event_id": "use_123",
  "usage_token": "signed_usage_token",
  "org_id": "org_123",
  "environment": "production",
  "client_app_id": "client_app_123",
  "idempotency_key": "client-key-abc",
  "request_hash": "sha256_payload_hash",
  "agent_id": "contribution-intelligence-v1",
  "agent_version": "1.4.0",
  "call_type": "agent_reasoning",
  "billable_status": "pending",
  "unit_price_estimate": 1.25,
  "metered_at": 1783555200123
}
```

The `usage_token` should be a server-signed compact token or opaque ID. It should not be client-editable. It should be passed through internal queues, workers, connector actions, and webhook results.

### 7.4 Billing Finalization

Usage event lifecycle:

| State | Meaning | Billable |
|---|---|---:|
| `accepted` | Request authenticated and accepted | Pending |
| `metered_pending` | Usage event created before execution | Pending |
| `completed_billable` | Client received successful result or actionable context package | Yes |
| `completed_non_billable` | Health check, entitlement read, free setup validation, or Salt Basin-waived retry | No |
| `failed_client` | Client payload, credentials, endpoint, or rate-limit issue | Maybe |
| `failed_salt_basin` | Salt Basin system failure | No |
| `disputed` | Client disputes event | Paused |
| `invoiced` | Included in invoice or usage summary | Yes |

### 7.5 Database Tables

Minimum tables:

```text
client_organizations
client_users
client_applications
client_api_keys
client_oauth_clients
client_entitlements
agent_catalog
agent_versions
api_usage_events
api_usage_event_steps
agent_runs
context_packages
connector_configurations
connector_credentials
connector_object_profiles
billing_accounts
billing_usage_summaries
advisory_estimates
security_audit_log
webhook_endpoints
webhook_deliveries
```

`api_usage_events` fields:

| Field | Purpose |
|---|---|
| `id` | Usage event ID |
| `org_id` | Tenant boundary |
| `environment` | `sandbox` or `production` |
| `client_application_id` | Calling app |
| `idempotency_key` | Retry and duplicate protection |
| `request_hash` | Tamper and dispute support |
| `agent_id` | Agent catalog ID |
| `agent_version` | Version used |
| `call_type` | Pricing category |
| `source_systems` | JSON list of systems touched |
| `estimated_input_tokens` | If model execution is involved or client reports it |
| `estimated_output_tokens` | If model execution is involved or client reports it |
| `client_reported_model_provider` | Anthropic, Azure, Bedrock, OpenAI, private, none |
| `salt_basin_model_used` | Boolean |
| `internal_cost_estimate_cents` | Margin control |
| `unit_price_cents` | Price locked at time of call |
| `billable_units` | Usually 1; can support weighted units |
| `billable_status` | Lifecycle state |
| `created_at_ms` | BIGINT milliseconds |
| `completed_at_ms` | BIGINT milliseconds |

## 8. Checkout Intake Requirements

Checkout should ask enough to produce a meaningful price estimate without forcing a sales call.

### 8.1 Company

- Company legal name.
- Domain.
- Billing contact.
- Technical admin.
- Security contact.
- ARR range.
- Employee count.
- Industry.
- PE-backed, enterprise, founder-led, advisory, or portfolio operator.
- Country/data residency.

### 8.2 Usage

- Agents needed.
- Use cases.
- Estimated monthly calls.
- Peak call rate.
- Critical workflows.
- Decision impact.
- Output consumers.
- Sandbox vs production date.

### 8.3 Source System Volumes

For each source system:

- Provider.
- Environment.
- Object names.
- Estimated object count.
- Historical lookback period.
- Refresh frequency.
- Write-back required.
- Required scopes.
- System owner.

### 8.4 Model Overlay

Ask whether the client wants:

| Option | Description | Pricing Impact |
|---|---|---|
| Client-managed Claude | Client runs Claude using own Anthropic, Bedrock, or approved endpoint | Lower Salt Basin cost, strong enterprise fit |
| Client-managed Azure/OpenAI | Client runs model in Microsoft tenant | Lower Salt Basin model cost, enterprise governance alignment |
| Client-managed private model | Client runs approved private model endpoint | Requires validation, may reduce quality confidence |
| Salt Basin execution | Salt Basin runs model step | Higher price, higher security burden, margin floor must include model cost |
| No model execution | Salt Basin returns context package, scoring, schemas, and workflow plan only | Lowest cost, useful for embedding in client AI workflows |

## 9. Advisory Services Model

Advisory services should be sold as fixed-fee value-based packages with a 25% deposit due at checkout.

| Package | Estimated Fee | Deposit | Best Fit |
|---|---:|---:|---|
| API Readiness Sprint | $40,000 | $10,000 | Self-service client needing scoped architecture and setup |
| Enterprise Agent Design | $125,000 | $31,250 | Mid-market or enterprise client launching production agent workflows |
| Contribution Intelligence Operating Model | $250,000 | $62,500 | Cross-functional implementation with multiple systems |
| PE Portfolio Intelligence Rollout | $500,000+ | $125,000+ | Sponsor or portfolio operator applying agents across companies |

### 9.1 Advisory Timeline

| Week | Activities | Deliverables |
|---:|---|---|
| 1 | Executive outcome framing, ARR/value pool definition, stakeholder map | Outcome brief, value hypothesis, success metrics |
| 2 | Source-system discovery, dependency mapping, object-volume review | Source-system dependency matrix, object-volume model |
| 3 | Contribution Intelligence methodology design, evidence model, risk model | Agent capability map, evidence and confidence framework |
| 4 | API architecture, connector design, security and access review | API integration blueprint, connector configuration guide |
| 5 | Pricing model, usage forecast, governance model, exception handling | Usage/pricing model, governance and approval workflow |
| 6 | Pilot design, implementation roadmap, executive readout | Pilot roadmap, implementation plan, executive value case |

## 10. Security Position

Salt Basin cannot inherit all security from client connections. Client OAuth scopes authorize Salt Basin or the client workflow to access a client system. They do not secure Salt Basin's API, database, usage ledger, webhook deliveries, or admin portal.

Required controls:

- Organization tenancy.
- MFA for portal admins.
- OAuth client credentials or scoped API keys for programmatic access.
- Environment separation between sandbox and production.
- IP allowlisting for enterprise clients.
- Rate limits and quota enforcement.
- Per-agent and per-connector entitlements.
- Encrypted credential storage.
- Signed webhooks.
- Idempotency keys.
- Usage-event audit ledger.
- Object-level authorization checks.
- Data retention controls.
- Security audit logs.
- DPA and acceptable use acceptance.
- Incident response process.

## 11. Operating Requirements

### 11.1 Performance

- Return `202 Accepted` and `run_id` for async agent runs.
- Keep synchronous context package calls under an agreed latency target.
- Use queues for connector profiling, long-running workflows, and write-back actions.
- Support webhooks for completed runs.
- Cache stable context package components by agent version, connector schema, and object profile.
- Track p50, p95, p99 latency by endpoint, org, agent, and connector.

### 11.2 Storage

Store:

- Usage events.
- Run metadata.
- Context package metadata.
- Request hashes.
- Result references.
- Evidence lineage.
- Connector profile summaries.
- Billing state.
- Audit logs.

Avoid storing raw client payloads by default. If raw payload storage is required, make retention explicit and configurable.

### 11.3 Long-Term Maintenance

- Version all public APIs.
- Version every agent.
- Version every context package schema.
- Version connector object mappings.
- Maintain deprecation policy.
- Maintain client-visible changelog.
- Maintain usage reconciliation and dispute workflow.
- Keep sandbox environments available.
- Build internal admin tools for entitlements, usage adjustments, failed runs, and connector health.

## 12. Recommended Implementation Phases

| Phase | Scope | Outcome |
|---:|---|---|
| 1 | Intake, pricing estimate, account signup, static agent catalog | Self-service demand capture |
| 2 | API auth, entitlements, idempotency, usage ledger | Metered API foundation |
| 3 | Context package endpoint and client-managed model overlay | Low-risk enterprise-ready API product |
| 4 | Agent run orchestration and connector validation | Production agent workflow support |
| 5 | Billing reconciliation, usage portal, checkout deposits | Commercial scale |
| 6 | Enterprise governance, SSO, advanced connectors, write-back | Larger client readiness |
