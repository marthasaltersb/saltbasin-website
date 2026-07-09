# Salt Basin + SaltTide Mapping Template Catalog v1

Version: 2026-07-09
Status: Starter catalog for reusable internal agent workflows

## 1. Template Naming Convention

Use this pattern:

`sbmap.{source_system}.{source_domain}.{target_output}.{version}`

Examples:

- `sbmap.salesforce.q2r.proposal.v1`
- `sbmap.salesforce.arr.snowball.v1`
- `sbmap.salesforce.billing.reconciliation_confidence.v1`
- `sbmap.snowflake.reporting.quarterly_report.v1`

Every template should include:

- Source object and field inventory.
- Target output object and field inventory.
- Direct mappings.
- Derived mappings.
- Transformation rules.
- Required evidence.
- Exception rules.
- Confidence scoring.
- Public/internal use status.

## 2. Salesforce Legacy Object Starter Map

| Salesforce Object | Canonical Domain | Primary Token | Typical Target Outputs |
|---|---|---|---|
| Lead | Demand / external ingestion | Customer Journey Token | lead source analysis, proposal context, CAC attribution |
| Campaign / CampaignMember | Demand attribution | Customer Journey Token | CAC, campaign ROI, quarterly report, investment thesis |
| Account | Customer / payer / parent org | Customer Journey Token, Member Journey Token | proposal, executive brief, member entitlement graph |
| Contact | Buyer / user / member / decision maker | Customer Journey Token, Member Journey Token | proposal, onboarding, stakeholder map |
| Opportunity | Pipeline / deal | Revenue Lifecycle Token | proposal, pipeline report, Snowball analysis, thesis |
| OpportunityHistory / FieldHistory | Movement evidence | Revenue Lifecycle Token, Confidence Token | Snowball, forecast variance, reconciliation disclosure |
| Quote | Commercial offer | Revenue Lifecycle Token, Contract Obligation Token | proposal, pricing matrix, approval evidence |
| QuoteLine / CPQ Quote Line | Product/pricing line | Revenue Lifecycle Token, Contract Obligation Token | proposal, billing trigger, revrec support |
| Product2 | Product catalog | Contract Obligation Token | proposal, pricing architecture, performance obligation support |
| PricebookEntry | Price/rate source | Contract Obligation Token | proposal, discount/ramp validation |
| Contract | Executed agreement | Contract Obligation Token | financial support, renewal report, disclosure |
| Order | Booked commercial event | Revenue Lifecycle Token | order-to-book, fulfillment, billing support |
| OrderItem | Fulfillment/billing line | Revenue Lifecycle Token, Financial Transaction Token | invoice support, revenue schedule support |
| Asset / Subscription / Entitlement | Licensed product/access | Member Journey Token, Contract Obligation Token | member entitlement graph, renewal, usage support |
| Case | Support/service/change | Customer Journey Token, Member Journey Token | customer journey report, renewal risk |
| User / Owner | Contributor | Resource Contribution Token | contribution scorecard, sales comp analysis |
| Task / Event | Activity evidence | Resource Contribution Token | CAC, sales comp, contribution analysis |
| Territory / AccountTeam / OpportunityTeam | GTM ownership | Resource Contribution Token | comp attribution, contribution model |

## 3. Required Salesforce Field Inventory Template

| Field | Purpose |
|---|---|
| source_system | Salesforce org name or instance. |
| org_id | Salesforce org id. |
| object_api_name | API object name. |
| field_api_name | API field name. |
| field_label | User-facing field label. |
| namespace | Managed package namespace, if any. |
| data_type | Salesforce type. |
| length_precision_scale | Length/precision/scale where applicable. |
| required | Whether Salesforce requires it. |
| nullable_in_sample | Whether sample data is null. |
| null_rate | Percent null in sample/export. |
| distinct_count | Approximate cardinality. |
| top_values | Top values for picklists or text categories. |
| formula_or_default | Formula/default value. |
| external_id | Whether it is external id/unique. |
| source_of_truth_candidate | Whether this field appears to be authoritative. |
| automation_dependencies | Flow/trigger/rule/package dependencies. |
| downstream_dependencies | Reports, integrations, objects, or outputs depending on it. |
| sensitivity | public_safe/internal/restricted/confidential/quarantine. |
| confidence | 0-1 mapping confidence. |

## 4. Template: Salesforce to Proposal Output

Template ID: `sbmap.salesforce.q2r.proposal.v1`

### Required Inputs

| Input | Source |
|---|---|
| Customer/payer identity | Account |
| Parent/child/member/site structure | Account hierarchy, custom relationship objects, Entitlement, Asset |
| Opportunity scope | Opportunity |
| Products and pricing | Quote, QuoteLine, Product2, PricebookEntry |
| Discounts and approvals | CPQ approval objects, Opportunity fields, Quote fields |
| Contract terms | Contract, CLM export, manual contract extract |
| Renewal and payment terms | Contract, Quote, Order, billing system |
| Support terms | Entitlement, Contract, Product, support package |

### Target Output Sections

| Section | Required Mapped Fields |
|---|---|
| Executive Summary | customer, opportunity, value proposition, current stage, decision deadline |
| Scope | products, quantities, sites/members/users, implementation scope |
| Commercial Terms | pricing model, discounts, payment terms, renewal, usage, ramp |
| Contract Obligations | performance obligations, billing triggers, support terms, acceptance criteria |
| Risks / Open Questions | missing fields, approval gaps, payer/member mismatch, unsupported assumptions |
| Evidence Appendix | source objects, field lineage, confidence score |

### Confidence Rules

| Rule | Confidence Impact |
|---|---|
| Quote and opportunity values agree | increase |
| Contract terms missing or manual-only | decrease |
| Customer payer differs from fulfillment/member org and no member token exists | decrease |
| Discount approval source exists and matches quote | increase |
| Renewal/payment/support terms are missing | decrease |

## 5. Template: Salesforce to Snowball Reporting

Template ID: `sbmap.salesforce.arr.snowball.v1`

### Movement Categories

| Category | Definition | Typical Source |
|---|---|---|
| Opening ARR/MRR | Starting balance for period. | prior report, subscription snapshot, ARR table |
| New | New customer/revenue added in period. | opportunity close, order, subscription |
| Expansion | Incremental revenue from existing customer/member/site. | amendment, renewal, upsell opportunity |
| Contraction | Revenue decrease without full churn. | amendment, downgrade, usage decrease |
| Churn | Lost customer/subscription/member access. | closed-lost renewal, cancellation |
| Price / FX / Correction | Non-operating or correction movement. | manual adjustment, finance table |
| Ending ARR/MRR | Opening plus all movements. | calculated |

### Required Reconciliation

| Check | Rule |
|---|---|
| Movement bridge | opening + movements = ending |
| CRM to billing | closed/booked movement reconciles to billing/subscription source |
| Customer/member split | expansion/churn maps to customer token and member token where applicable |
| Contract obligation check | recurring/usage/discount terms support the movement classification |
| Manual adjustment disclosure | all manual corrections carry source, owner, reason, and confidence |

## 6. Template: Salesforce to Executive Ready Output

Template ID: `sbmap.salesforce.executive.brief.v1`

| Input | Target Narrative |
|---|---|
| Pipeline and bookings | What changed commercially |
| Renewal and expansion | What is compounding or decaying |
| Billing/collection/revrec exceptions | What may distort reported performance |
| Customer/member activity | What the customer/member reality says beneath bookings |
| Contribution events | What people/systems/agents drove the outcome |
| Confidence reconciliation | What is trusted, uncertain, or blocked |

Output should include: bottom line, decision needed, evidence table, confidence score, top risks, next actions, and appendix.

## 7. Template: Salesforce to Investment Thesis

Template ID: `sbmap.salesforce.investment.thesis.v1`

| Dimension | Inputs |
|---|---|
| Deal profile | valuation size, investment type, industry vertical, stage, sponsor criteria |
| GTM health | lead quality, pipeline coverage, conversion, sales cycle, CAC signals |
| Revenue quality | recurring mix, usage exposure, churn/expansion, discounting, concentration |
| Operating leverage | automation, manual work, system fragmentation, contribution cost |
| Data reliability | lineage coverage, source-of-truth clarity, reconciliation confidence |
| Value creation levers | pricing, packaging, renewals, collections, product attribution, support |
| Board/operator match | board member skills, operating partner criteria, known gaps |

Guardrail: investment thesis outputs stay internal/restricted unless Investor Language Guard approves public or prospect-facing language.

## 8. Template: Salesforce to Quarterly Report

Template ID: `sbmap.salesforce.operating.quarterly_report.v1`

| Section | Inputs |
|---|---|
| Quarter Snapshot | bookings, ARR/MRR, pipeline, renewals, collections, usage, support |
| Movement Bridge | Snowball movement categories and reconciliation |
| Lifecycle Health | revenue/customer/member token stage-gate progress |
| Risk Register | exceptions, open decisions, data confidence, operational blockers |
| Contribution Intelligence | human/AI/system contribution, cost basis, ROI attribution |
| Next Quarter Actions | decisions, owners, dependencies, target outputs |

## 9. Template: Salesforce to Financial Statement Support

Template ID: `sbmap.salesforce.finance.statement_support.v1`

| Statement Area | Required Inputs |
|---|---|
| Revenue | contract, performance obligation, transaction price, allocation, recognition trigger |
| AR | invoice, bill-to, payment terms, collections, cash application |
| Deferred Revenue | billed/not recognized, performance status, schedule |
| Cash | payment, remittance, auto-pay/manual method, bank/processor reference |
| Contract Asset/Liability | timing difference between performance, billing, collection |
| Disclosures | assumptions, variable consideration, estimate changes, material exceptions |

Confidence must be split by statement area. A high revenue confidence score does not automatically mean high AR or cash confidence.

## 10. Template: Reconciliation Confidence Scorecard

Template ID: `sbmap.multi_system.reconciliation_confidence.v1`

### Score Dimensions

| Dimension | Weight | Definition |
|---|---:|---|
| Population Coverage | 20% | Are all expected records included? |
| Field Completeness | 15% | Are required fields populated? |
| Source Authority | 15% | Is the source authoritative for this value? |
| Transformation Traceability | 15% | Are mappings and transformations replayable? |
| Tie-Out Quality | 20% | Do sources reconcile within tolerance? |
| Review Evidence | 15% | Is there human/agent review and exception resolution? |

### Exception Categories

| Category | Examples |
|---|---|
| Missing record | CRM opportunity without order; invoice without contract |
| Duplicate record | duplicate account/opportunity/invoice |
| Timing difference | close date vs booking date vs invoice date |
| Mapping error | wrong account hierarchy, product, segment, member/site |
| Financial mismatch | amount, currency, discount, tax, payment mismatch |
| Manual adjustment | unsupported spreadsheet override |
| Token mismatch | revenue token, customer token, or member token does not align |

## 11. Reusable Agent Prompts

### Salesforce Legacy Mapper

```text
You are the Salt Basin Salesforce Legacy Mapper. Use the provided Salesforce object inventory, field inventory, automation inventory, sample data profile, and source artifacts. Map each field to the canonical Salt Basin/SaltTide design-input model. Separate direct mappings, derived mappings, unknown mappings, duplicates, stale fields, and risky fields. Produce a mapping table, transformation rules, missing metadata list, reconciliation risks, and reusable template candidates.
```

### Output Package Builder

```text
You are the Salt Basin Output Package Builder. Use the approved design-input package and selected output template. Produce the requested deliverable in executive-ready Salt Basin language. Separate facts, assumptions, risks, confidence, open questions, and recommendations. Do not use external benchmark or investor/financial claims unless they are verified current or explicitly approved for internal draft use.
```

### Reconciliation Confidence Agent

```text
You are the Salt Basin Reconciliation Confidence Agent. Compare the source systems at the specified grain and period. Score population coverage, field completeness, source authority, transformation traceability, tie-out quality, and review evidence. Classify exceptions, identify disclosure needs, and recommend remediation steps. Never collapse unresolved exceptions into a high confidence score.
```
