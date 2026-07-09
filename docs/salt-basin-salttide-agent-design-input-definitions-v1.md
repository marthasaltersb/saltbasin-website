# Salt Basin + SaltTide Agent Design Input Definitions v1

Version: 2026-07-09
Status: Working architecture for real-time internal agent use
Scope: Salt Basin platform architecture, HandoverOS Interface Intelligence, SaltTide/EIDOS operating model, Contribution Intelligence, legacy Salesforce mapping, and executive/investor/reporting outputs.

## 1. Purpose

This document defines the input objects Salt Basin agents should use when turning messy source material into reusable outputs. It combines:

- Salt Basin Platform Lifecycle Management: requirements, backlog, lifecycle gates, release outputs, global standards, contribution evidence.
- HandoverOS Interface Intelligence: revenue, customer, member, contract, financial transaction, contribution, and confidence tokens.
- SaltTide/EIDOS: source artifacts, requirements, process flows, scenarios, decisions, open questions, work logs, value hypotheses, deterministic routing, source-ranked evidence, and outcome measurement.
- Contribution Intelligence: human/AI contribution attribution, cost basis, evidence quality, reuse potential, and ROI logic.

The immediate use case is Betsy's own architecture first: agents should ingest existing chats, files, Salesforce exports, Snowflake/reporting tables, financial files, and business notes, then produce proposal outputs, Snowball reporting analysis, executive-ready outputs, investment thesis documentation, quarterly reports, financial statements, reconciliation confidence, data reconciliation disclosures, risk registers, and reusable mapping templates.

## 2. Design Principles

| Principle | Definition |
|---|---|
| Source-first | Every input must link to a source artifact, transcript, file, system extract, table, field, user statement, or generated output. |
| Tokenized lineage | Every meaningful business object should attach to one or more tokens: revenue lifecycle, customer journey, member journey, contract obligation, financial transaction, resource contribution, confidence reconciliation. |
| Deterministic where possible | Routing, reconciliation, calculations, scoring, and financial statement tie-outs should use rules, equations, SQL, and repeatable transforms. Agents explain, classify, and recommend; they should not invent the calculation. |
| Dual completion | Each object carries data-definition completeness and methodology/readiness completion. Lifecycle stage should be computed from gates, with manual override only as an exception. |
| Public-use gating | Investor, financial, regulatory, market, benchmark, and SaltTide thesis language must stay internal or pending until source refresh and language guard review. |
| Reusable templates | Every mapping or output should become a reusable template when it repeats across systems, clients, reports, or proposals. |

## 3. Canonical Input Spine

Every agent run should be able to receive or generate the following core input spine.

| Input | Purpose | Required Fields |
|---|---|---|
| Source Artifact Input | Identifies the evidence object being used. | source_id, source_type, title, path_or_url, owner, captured_at, sensitivity, evidence_status |
| Operating Context Input | Defines the company, product, segment, initiative, or analysis context. | context_id, organization, business_model, industry, stage, audience, use_case, constraints |
| Object Definition Input | Defines the business object being mapped or analyzed. | object_id, object_type, canonical_name, source_system, source_object, owner, lifecycle_stage |
| Field Definition Input | Defines a source or target field. | field_id, object_id, api_name, label, data_type, required, nullable, source_of_truth, sensitivity |
| Mapping Rule Input | Maps one or more source fields to target fields. | mapping_id, source_fields, target_field, rule_type, transform_logic, confidence, owner |
| Transformation Rule Input | Defines calculation, standardization, enrichment, or derivation. | transform_id, inputs, formula_or_logic, outputs, dependency, test_case, exception_rule |
| Token Chain Input | Links the object to revenue/customer/member/contract/financial/contribution/confidence tokens. | token_chain_id, primary_tokens, supporting_tokens, token_edges, stage_gates |
| Stage Gate Input | Defines what must be true before a stage is complete. | stage_gate_id, stage_name, required_inputs, required_outputs, approvals, evidence, computed_status |
| Reconciliation Rule Input | Defines how two or more sources should tie out. | reconciliation_id, sources, comparison_grain, tolerance, expected_result, exception_handling |
| Confidence Input | Scores coverage, mapping quality, source quality, transformation quality, and reconciliation quality. | confidence_id, coverage_score, evidence_score, transform_score, reconciliation_score, reviewer |
| Output Request Input | Defines the requested deliverable. | output_request_id, output_type, audience, decision_needed, source_scope, template_id, approval_required |
| Contribution Event Input | Tracks human, AI, system, workflow, and technology contribution. | contribution_id, contributor_type, contributor, role, stage_gate_id, cost_basis, value_attribution |

## 4. Token Definitions

| Token | What It Follows | Examples |
|---|---|---|
| Revenue Lifecycle Token | Commercial and financial truth from pipeline through adjustment. | lead, opportunity, proposal, quote, contract, order, subscription, invoice, payment, revenue schedule, renewal |
| Customer Journey Token | Customer-adjacent truth from external lead through support/change/renewal. | prospect, buyer, customer, onboarding, support case, change request, renewal, churn |
| Member Journey Token | Entitled org, child org, site, provider, employer group, plan member, individual member, end user, or free-tier user. | district/site, health plan/employer population, licensed user, free-tier account, provider location |
| Contract Obligation Token | Performance obligations, payer responsibility, billing triggers, support terms, renewal notice, discounts, usage commitments, variable consideration. | ASC 606/IFRS 15 obligation, support addendum, renewal clause, usage tier |
| Financial Transaction Token | Every invoice, payment, remittance, collection, adjustment, refund, credit, revenue recognition event. | invoice line, cash receipt, unapplied cash, deferred revenue schedule |
| Resource Contribution Token | Human roles, teams, systems, AI agents, workflows, and technology resources contributing to an outcome. | AE, deal desk, revops, Salesforce flow, CPQ rule, Codex agent, Snowflake model |
| Confidence Reconciliation Token | Conflicting evidence, missing data, coverage score, tie-out score, and review status. | CRM vs billing mismatch, revrec tie-out exception, incomplete Salesforce field lineage |

## 5. Legacy Salesforce Mapping Inputs

Use these definitions when mapping old Salesforce orgs, CPQ implementations, managed-package fields, custom objects, or historical exports.

| Input | Definition |
|---|---|
| Salesforce Org Profile | org_id, instance_url, edition, clouds/packages, namespaces, record count, active users, integration users, sandbox/prod flag. |
| Salesforce Object Inventory | object_api_name, label, standard/custom, managed_package_namespace, record_count, owner_domain, lifecycle_mapping. |
| Salesforce Field Inventory | field_api_name, label, type, length, precision, scale, required, unique, external_id, default_value, formula, picklist_values, help_text. |
| Salesforce Field Usage Profile | null_rate, distinct_count, top_values, last_modified, created_by_source, populated_by_user_or_automation, sample_values_masked. |
| Salesforce Automation Inventory | flow, process builder, workflow rule, validation rule, trigger, apex class, managed-package automation, scheduled job. |
| Salesforce Security Profile | profile/permission-set access, field-level security, sharing model, integration user access, sensitive fields. |
| Salesforce Lineage Edge | source object/field, transform/automation, target object/field, integration endpoint, target system, confidence, evidence. |
| Salesforce Legacy Risk | stale field, duplicate field, unmanaged dependency, package lock-in, formula drift, automation conflict, ownership ambiguity. |

## 6. Standard Mapping Template Types

| Template | Source | Target | Primary Output |
|---|---|---|---|
| Salesforce-to-Revenue Lifecycle Map | Salesforce Lead, Account, Contact, Opportunity, Quote, Contract, Order, Asset/Subscription, Case | Revenue, customer, member, contract, and financial tokens | Q2R lineage map and transaction forensic packet |
| Salesforce-to-Proposal Map | Account, Opportunity, Quote/QuoteLine, Product2, PricebookEntry, Contract, content blocks | Proposal output model | Proposal package, pricing assumptions, scope and terms matrix |
| Salesforce-to-Snowball Reporting Map | Opportunity history, ARR/NRR fields, renewal objects, bookings, churn/expansion fields | Snowball metric model | Snowball roll-forward, movement bridge, forecast and variance pack |
| Salesforce-to-Investment Thesis Map | Accounts, opportunities, pipeline, renewals, product/segment tags, customer health | Thesis evidence model | Investment thesis memo, value creation plan, diligence questions |
| Salesforce-to-Quarterly Report Map | Pipeline, bookings, renewals, cases, product adoption, finance tie-outs | Quarterly operating report | Board/quarterly reporting package |
| Salesforce-to-Financial Statement Support Map | Contract, order, invoice, revrec schedule, payment, adjustment | Financial statement support model | Revenue support, AR support, deferred revenue support, disclosure support |
| Salesforce-to-Reconciliation Confidence Map | CRM, CPQ, billing, ERP, warehouse, spreadsheets | Confidence reconciliation model | Reconciliation confidence score, exceptions, disclosures, remediation plan |

## 7. Output Input Definitions

### 7.1 Proposal Output Input

| Field | Definition |
|---|---|
| proposal_context | customer, opportunity, use case, scope, products, pricing model, stakeholders, decision deadline |
| commercial_terms | term length, start date, end date, renewal, payment terms, discounts, usage terms, ramp, support |
| source_evidence | Salesforce opportunity, quote, contract, product catalog, discovery notes, pricing approvals |
| mapping_requirements | fields required to populate proposal blocks and pricing assumptions |
| risk_questions | missing metadata, approval gaps, pricing ambiguity, customer/member/payer mismatch |
| output_artifacts | proposal brief, scope matrix, commercial term sheet, risk appendix |

### 7.2 Snowball Reporting Input

| Field | Definition |
|---|---|
| reporting_period | period start/end, fiscal calendar, segment, cohort, currency |
| opening_balance | ARR/MRR/bookings/customer count at start of period |
| movement_events | new, expansion, contraction, churn, reactivation, price increase, usage uplift, correction |
| token_links | revenue lifecycle token, customer token, member token, contract obligation token |
| source_systems | Salesforce, billing, ERP, Snowflake, spreadsheets |
| reconciliation_rules | source precedence, tie-out tolerance, exception categories |
| output_artifacts | ARR bridge, waterfall/snowball report, variance explanation, confidence disclosure |

### 7.3 Executive Ready Output Input

| Field | Definition |
|---|---|
| audience | CEO, CFO, CRO, COO, CTO, board, PE sponsor, operating partner |
| decision_needed | approve, investigate, invest, remediate, defer, escalate |
| executive_thesis | concise claim supported by evidence and confidence |
| evidence_pack | source artifacts, metric rollups, scenario findings, exceptions |
| risk_posture | high/medium/low risks, uncertainty, required validation |
| output_artifacts | executive memo, board slide content, decision brief, action register |

### 7.4 Investment Thesis Input

| Field | Definition |
|---|---|
| thesis_scope | target company, vertical, investment type, stage, valuation size, sponsor goals |
| operating_evidence | revenue lifecycle maturity, systems, process gaps, customer/member dynamics |
| value_creation_levers | pricing, packaging, renewals, billing, collections, product adoption, automation |
| diligence_questions | missing evidence, source refresh, management questions, data requests |
| confidence | source confidence, model confidence, benchmark confidence, assumption confidence |
| output_artifacts | thesis memo, diligence checklist, value creation plan, board skill/criteria match |

### 7.5 Quarterly Report Input

| Field | Definition |
|---|---|
| quarter_context | period, operating goals, prior-quarter commitments, audience |
| metrics | pipeline, bookings, ARR, NRR, churn, expansion, gross margin, collections, usage, support |
| stage_gate_progress | lifecycle objects, completed gates, blocked gates, evidence quality |
| narrative | what changed, why it changed, what matters next |
| output_artifacts | quarterly report, operating scorecard, risk/decision register |

### 7.6 Financial Statement Support Input

| Field | Definition |
|---|---|
| statement_area | revenue, AR, deferred revenue, cash, contract assets/liabilities, expense, margin |
| source_records | contract, order, invoice, payment, revrec schedule, adjustment, journal support |
| accounting_logic | performance obligation, transaction price, allocation, recognition trigger, variable consideration |
| reconciliation | source-to-ledger tie-out, exception, tolerance, reviewer, resolution |
| output_artifacts | support schedule, reconciliation memo, disclosure draft, exception rollforward |

### 7.7 Reconciliation Confidence Input

| Field | Definition |
|---|---|
| reconciliation_scope | source A, source B, grain, period, population, owner |
| expected_tie_out | exact match, tolerance match, derived match, reasonableness test |
| exception_types | missing record, duplicate, timing difference, mapping error, currency issue, manual adjustment |
| confidence_scores | coverage, completeness, accuracy, timeliness, transformation, reviewer confidence |
| disclosure_status | no disclosure needed, internal disclosure, management disclosure, audit/client disclosure |
| output_artifacts | confidence scorecard, exception register, remediation plan, disclosure memo |

## 8. Agent Design Input Packages

| Agent | Required Input Package | Output |
|---|---|---|
| Architecture Memory Loader | source artifacts, active memory register, platform lifecycle config, SaltTide schema | current architecture context pack |
| Salesforce Legacy Mapper | Salesforce org profile, object inventory, field inventory, automation inventory, sample data | mapping templates and lineage risks |
| Proposal Output Agent | proposal output input, Salesforce-to-proposal mapping, approved language library | proposal package |
| Snowball Reporting Agent | Snowball reporting input, movement events, reconciliation rules | ARR/MRR bridge and variance narrative |
| Executive Briefing Agent | executive output input, evidence pack, risk posture | executive-ready memo or board content |
| Investment Thesis Agent | thesis scope, operating evidence, value levers, diligence questions | thesis memo and value creation plan |
| Quarterly Report Agent | quarterly context, metrics, stage gates, narrative | quarterly operating report |
| Financial Statement Support Agent | statement area, source records, accounting logic, reconciliation | support schedule and disclosure draft |
| Reconciliation Confidence Agent | reconciliation scope, exception types, confidence scores | confidence scorecard and remediation plan |
| Contribution Intelligence Agent | contribution events, cost basis, value attribution, source lineage | contribution/ROI breakdown |

## 9. First Internal MVP Sequence

1. Create a `source_artifact` registry for current Salt Basin docs, SaltTide docs, Codex thread summaries, and key generated outputs.
2. Build a Salesforce legacy field inventory template that can be filled from exported metadata or a connected org.
3. Map Salesforce objects to revenue/customer/member tokens for one sample lifecycle.
4. Produce one Snowball reporting template and one proposal template from the same mapped inputs.
5. Add reconciliation confidence scoring between Salesforce, billing/ERP, Snowflake/reporting tables, and spreadsheet/manual sources.
6. Generate an executive-ready output pack using only approved/internal-safe facts.
7. Promote repeated mappings into reusable templates with version, owner, sensitivity, and evidence status.

## 10. Business Definition Workbench Extension

The next product layer is a real-time Business Definition Tool that turns the design-input package into an editable scenario workbench.

The workbench should help a client move from raw source material to an approved Business Definition and Business Rule Design Spec by defining:

- L0 enterprise domains.
- L1 journey tokens.
- L2 business scenarios.
- L3 journey stages.
- L4 stage gates.
- L5 metadata mutations.
- L6 business rules.
- L7 data elements.

The workbench should also maintain:

- Metadata chips that accumulate and transform through the journey.
- Product Definition Data Rods that define allowable pricing, billing, contract, obligation, recognition, renewal, and migration behavior.
- Billing-event to performance-obligation allocation matrices.
- Traditional system-of-record maps.
- DataBasin bridge/reservoir persistence targets.
- Write-back requirements to existing operating systems.
- Output specs for proposal, Snowball reporting, executive, investment, quarterly, financial statement, reconciliation, disclosure, and risk outputs.

Supporting documents:

- `docs/salt-basin-business-definition-tool-product-spec-v1.md`
- `docs/salt-basin-business-definition-ontology-schema-v1.json`
- `docs/salt-basin-business-definition-scenario-starter-catalog-v1.md`
- `docs/business-definition-l2-scenario-intake-template.csv`
- `docs/salt-basin-business-definition-example-parent-pricing-v1.json`
