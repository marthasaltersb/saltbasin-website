# Gmail HandoverOS Attachment Extraction - Batch 2A - 2026-07-08

## Run status

Status: controlled attachment extraction completed.

Memory activation status: candidates below are recommendations only. Betsy should approve, revise, or reject each record before it becomes active memory for any agent.

Gmail actions: no messages were sent, archived, labeled, deleted, or modified.

Source account visible to connector: `marthasalter@gmail.com`.

## Batch objective

Batch 2A extracted HandoverOS and QTR workbook attachments from Gmail and converted the findings into governed memory candidates for Salt Basin agents.

The pass focused on operational patterns, reusable agent context, and safe public-facing summaries. It did not attempt to publish proprietary workbook content, disclose client-specific detail, or independently verify external citations.

## Gmail search scope

Primary query:

```text
has:attachment (HandoverOS OR "Revenue Leakage" OR "Benchmark Regulatory Matrix" OR "Q2R" OR "QTR") -in:spam -in:trash -category:promotions
```

Canonical source cluster:

```text
Subject: resume and example foundational related frameworks
Date found in Gmail search: May 12, 2026
Attachment type: self-authored framework examples shared externally
```

Privacy note: individual recipient names from Gmail are not reproduced in this memory file because they are not needed for agent reasoning.

## Attachments extracted

| Attachment | Size | Extraction result | Recommended handling |
|---|---:|---|---|
| `Copy of HandoverOS_Revenue_Leakage_v2-2.xlsx` | 35,716 bytes | Parsed 7 workbook tabs | Internal restricted; use only public-safe abstractions |
| `Copy of HandoverOS_Q2R_Benchmark_Regulatory_Matrix-1.xlsx` | 32,165 bytes | Parsed 4 workbook tabs | Internal restricted; foundational QTR scenario model |
| `Copy of HandoverOS_Q2R_Benchmark_Regulatory_Matrix-1 (2).xlsx` | 67,685 bytes | Parsed 6 workbook tabs; appears to be expanded version | Internal restricted; preferred operational process overlay |

Unsupported attachment:

| Attachment | Reason |
|---|---|
| `QTR_V5_Foundation_Package.zip` | Gmail connector marked attachment reading unsupported for ZIP |

## Extracted workbook summaries

### 1. HandoverOS Revenue Leakage v2-2

Parsed tabs:

| Tab | Purpose |
|---|---|
| Executive Dashboard | Revenue leakage exposure framing by ARR size and leakage rate |
| Verified Source Detail | Source register for statistics, including sources to use and sources removed |
| MGI Industry Breakdown | Industry leakage mechanisms and HandoverOS resolution mappings |
| Portfolio Calculator | ARR leakage and platform recovery calculator |
| Decision Risk Framework | Migration, due diligence, and AI-first decision risk framing |
| Risk Dollar Calculator | Risk-adjusted decision calculator |
| Assumptions & Methodology | Separates verified statistics, modeled assumptions, confidence levels, and presentation guidance |

Key memory signals:

1. The workbook intentionally separates verified primary-source statistics from modeled assumptions.
2. It contains explicit "do not use" or removed statistics where support could not be verified.
3. It treats migration, due diligence, and AI-first builds as risk-amplification moments when source data is not validated first.
4. It defines several model assumptions, including recovery rate, platform cost, AI-on-dirty-data multiplier, contract issue rates, and valuation-risk assumptions.
5. It warns that the AI compounding multiplier should be removed from formal financial models and replaced with a qualitative risk statement.

Source freshness note:

The workbook states that sources were verified as of April 2026. Because this run occurred on July 8, 2026, any public or client-facing benchmark, market statistic, regulatory interpretation, or monetary claim should be refreshed before use.

### 2. HandoverOS Q2R Benchmark Regulatory Matrix - Smaller Version

Parsed tabs:

| Tab | Purpose |
|---|---|
| Benchmark Master | Six QTR scenarios with benchmark, source, regulatory, HandoverOS solution, metadata, impact, and benefit columns |
| Regulatory Crosswalk | Scenario-to-regulatory-standard mapping |
| Contract Metadata Master | Required contract fields at signature by scenario |
| Impact Quantification | Quantified impact model for revenue integrity solutions |

Six scenario families:

| Scenario | Theme |
|---|---|
| S1 | Close cycle compression |
| S2 | Usage-based billing accuracy |
| S3 | Continuous revenue recognition vs. billing |
| S4 | Pre-bill review and dispute management |
| S5 | Auto-pay and collections infrastructure |
| S6 | Professional services billing and revenue recognition |

Core design insight:

The workbook positions contract metadata captured at signature as the foundation for downstream billing, recognition, dispute, payment, collections, and audit workflows.

### 3. HandoverOS Q2R Benchmark Regulatory Matrix - Expanded Version

Parsed tabs visible in extraction:

| Tab | Purpose |
|---|---|
| Q2R Process Overlay | Sales-to-revenue-close process overlay across 11 lifecycle steps |
| Contract metadata sections | Expanded paying client, end user client, and master contract metadata definitions |
| Impact Quantification | Same benchmark-scale impact model structure as the smaller version |

Lifecycle steps captured:

| Step | QTR stage |
|---:|---|
| 1 | Prospect and pipeline |
| 2 | Qualify and discovery |
| 3 | Solution design and scope |
| 4 | Negotiate and legal review |
| 5 | Contract execution |
| 6 | Onboarding and activation |
| 7 | Service delivery and usage |
| 8 | Billing and invoicing |
| 9 | Collect |
| 10 | Revenue close |
| 11 | Renew |

Core design insight:

The expanded workbook turns QTR into a handoff architecture. Each process stage identifies the handoff, fields needed, ARR or revenue impact, risk, engine/control response, regulatory standard, and failure mode.

## Recommended memory candidate records

### HOS-MEM-001 - HandoverOS QTR operating thesis

Proposed memory:

HandoverOS frames quote-to-revenue as a lifecycle of operational handoffs from prospect and pipeline through renewal. The core thesis is that missing or unstructured contract, customer, product, pricing, usage, billing, payment, and recognition metadata creates downstream revenue leakage, audit risk, dispute risk, forecast risk, collections friction, and AI-readiness risk.

Recommended status: approve for internal memory.

Public use: allowed only as a general statement that Salt Basin works on quote-to-revenue handoffs, data integrity, and operating model design.

Restriction: do not expose workbook internals, worksheet names, detailed field lists, or proprietary engine names unless Betsy approves a public-safe preview.

Confidence: high.

### HOS-MEM-002 - Six foundational QTR scenario families

Proposed memory:

HandoverOS uses six foundational QTR scenario families: close cycle compression, usage-based billing accuracy, continuous revenue recognition vs. billing, pre-bill review and dispute management, auto-pay and collections infrastructure, and professional services billing and revenue recognition.

Recommended status: approve for internal memory; pending for public memory.

Public use: BestyStaff may offer a non-proprietary visual preview of the six scenario categories as a high-level maturity map, but should not reveal detailed benchmarks, calculations, or source tables.

Confidence: high.

### HOS-MEM-003 - Contract metadata as control foundation

Proposed memory:

HandoverOS treats contract metadata captured at or before signature as the control foundation for billing, revenue recognition, ARR reporting, customer disputes, auto-pay, collections, audit support, renewal execution, and AI reliability.

Recommended status: approve.

Public use: allowed as a safe concept. This is an appropriate BestyStaff explanation when a visitor asks what kinds of deliverables Salt Basin can preview.

Confidence: high.

### HOS-MEM-004 - Paying client, end user, and master contract distinction

Proposed memory:

HandoverOS distinguishes among paying client, end user client, and master contract records because billing responsibility, service consumption, legal entity structure, tax/e-invoicing requirements, master agreement terms, concentration risk, and account-level ARR may not live at the same entity level.

Recommended status: approve for internal memory.

Public use: allowed only as a general data-model concept. Avoid exposing the full field taxonomy.

Confidence: high.

### HOS-MEM-005 - QTR as two-track billing and recognition architecture

Proposed memory:

HandoverOS treats billing and revenue recognition as related but independent tracks. Billing follows invoice, payment, usage, and customer communication events, while revenue recognition follows contract terms, performance obligations, delivery evidence, and accounting methodology.

Recommended status: approve.

Public use: allowed as a conceptual explanation, with no legal or accounting advice framing.

Guardrail: agents must not provide accounting, audit, tax, or legal advice. They may explain operating-model implications and recommend professional review.

Confidence: high.

### HOS-MEM-006 - Data validation before migration, diligence, or AI automation

Proposed memory:

HandoverOS positions data validation as a risk-control step before system migration, due diligence, fundraising, IPO readiness, and AI automation. The internal thesis is that unvalidated data can encode existing errors into new systems, diligence materials, forecasts, or AI outputs.

Recommended status: approve.

Public use: allowed as a safe operating principle.

Restriction: do not use unsupported quantified multipliers for AI compounding. Use qualitative language unless a current verified source supports a specific figure.

Confidence: high.

### HOS-MEM-007 - Benchmark and source refresh rule for HandoverOS

Proposed memory:

All HandoverOS benchmark claims, monetary figures, market statistics, regulatory references, and quantified ROI assumptions require current-source refresh before public, client-facing, investor-facing, or sales use.

Recommended status: approve immediately as governance memory.

Public use: not customer-facing content; this is an internal agent rule.

Confidence: high.

### HOS-MEM-008 - Modeled assumptions must remain labeled

Proposed memory:

HandoverOS workbooks include modeled assumptions such as recovery rates, platform cost estimates, AI compounding logic, valuation impacts, contract issue rates, and deal-risk expected value framing. Agents must keep these labeled as assumptions unless replaced with verified customer data or current authoritative sources.

Recommended status: approve immediately as governance memory.

Public use: not customer-facing content; this is an internal agent rule.

Confidence: high.

### HOS-MEM-009 - Deprecated or removed statistics must not be reused

Proposed memory:

Some statistics in the workbook were explicitly removed or marked not verifiable. Agents must not reuse removed figures, including unsupported billing mismatch, contract failure, or CFO-systematic-revenue-leakage claims, unless Betsy later approves updated evidence from a reliable source.

Recommended status: approve immediately as governance memory.

Public use: not customer-facing content.

Confidence: high.

### HOS-MEM-010 - Public-safe deliverable previews

Proposed memory:

For website visitors, BestyStaff can preview HandoverOS-style deliverables as visual structures such as a QTR lifecycle map, contract metadata checklist, maturity scorecard, benchmark refresh plan, operating risk register, handoff map, or control evidence matrix. It must not give away proprietary workbook content, full field taxonomies, private formulas, source files, or employer/client-specific examples.

Recommended status: approve.

Public use: allowed.

Confidence: high.

### HOS-MEM-011 - No employer/client/project overclaiming

Proposed memory:

When using HandoverOS or QTR context, agents must not imply that Betsy owns contracts, source documents, or deliverables created under prior employers; must not disclose client names; and must not claim Betsy was the deal broker, operating principal, fund manager, or transaction owner for Vista portfolio company work.

Recommended status: approve immediately as universal guardrail.

Public use: internal rule only.

Confidence: high.

### HOS-MEM-012 - HandoverOS engine language requires approval

Proposed memory:

The workbooks use engine names such as contract-to-billing reconciliation, usage reconciliation, discount governance, entity resolution, amendment-billing audit, pre-bill, collections, MDM, and recognition evidence concepts. Agents may use these internally for routing and design, but public-facing naming and positioning should be approved by Betsy before publication.

Recommended status: pending.

Public use: not yet approved, except as broad capability categories.

Confidence: medium-high.

## Recommended rejected or blocked memory

### HOS-BLOCK-001 - AI-on-dirty-data numeric multiplier

Blocked memory:

Do not activate a specific AI-on-dirty-data compounding multiplier as factual memory.

Reason:

The workbook itself labels this as a constructed assumption and recommends replacing it in formal models with a qualitative risk statement.

Recommended status: reject as factual memory; retain only as a draft modeling hypothesis.

### HOS-BLOCK-002 - Placeholder HandoverOS platform pricing

Blocked memory:

Do not activate placeholder HandoverOS platform cost or pricing estimates as actual product pricing.

Reason:

The workbook labels pricing as a constructed estimate and notes that actual HandoverOS pricing has not been set.

Recommended status: reject as product pricing; retain only as historical model assumption.

### HOS-BLOCK-003 - Unrefreshed benchmark claims for public use

Blocked memory:

Do not allow agents to quote benchmark values, market statistics, source URLs, regulatory interpretations, or dollar impact figures externally without current verification.

Reason:

The extraction read workbook contents but did not independently verify external sources. Some sources may have changed since April 2026.

Recommended status: block for public use until refreshed.

## Agent design updates

### BestyStaff for Salt Basin Intake

Add HandoverOS-safe answer behavior:

1. If a visitor asks what Salt Basin can help with, BestyStaff may say:
   `Salt Basin can help map quote-to-revenue handoffs, identify where data or contract metadata breaks downstream workflows, and preview non-proprietary structures such as maturity maps, operating risk registers, or handoff diagrams.`

2. If a visitor asks for examples, BestyStaff may offer:
   `I can show a visual-style preview of a QTR lifecycle map or contract metadata checklist without exposing proprietary workbook content.`

3. If a visitor asks for benchmarks or ROI:
   `Betsy can discuss directional examples, but any benchmark, monetary estimate, or regulatory claim should be refreshed against current sources before it is used for a decision.`

4. If a visitor asks whether Betsy built this for a specific employer or client:
   `I cannot share client names or claim ownership of employer-created contracts or source documents. Betsy can discuss the operating patterns and the type of work she has experience with at a high level.`

Required conversation pattern remains:

1. Ask:
   `Do you already know Betsy? If so, what is the connection?`
2. Ask:
   `What are the top 5 questions you want to get answered today - if you don't have 5, start with 1`
3. Ask consent before retaining chat context.
4. Ask for email or phone at the appropriate moment.
5. Close with:
   `Did you get all of your questions answered? If not, can you provide any questions before leaving to give Betsy context?`

### HandoverOS Memory Steward

Role:

Approve, reject, and classify HandoverOS memory records by public safety, source freshness, proprietary risk, and legal/accounting-advice risk.

Max volume:

| Data type | Max per worker per run |
|---|---:|
| Memory candidates | 50 |
| Workbook tabs | 5 |
| Benchmark claims | 25 |
| Public-facing claims | 15 |

Recommended staffing:

| Batch size | Agents |
|---|---:|
| 1-50 candidates | 1 steward |
| 51-150 candidates | 3 stewards plus 1 reviewer |
| 151-500 candidates | 5 stewards plus 1 governance manager |

### QTR Process Mapper Agent

Role:

Convert QTR lifecycle steps into safe operating model diagrams, handoff maps, field dependencies, risk registers, and workflow automation candidates.

Max volume:

| Data type | Max per worker per run |
|---|---:|
| Lifecycle steps | 3 |
| Handoff definitions | 25 |
| Field dependencies | 50 |
| Risk/control pairs | 25 |

### Benchmark Refresh Agent

Role:

Refresh external benchmark claims and classify each as verified, stale, secondary, unsupported, modeled, or rejected.

Max volume:

| Data type | Max per worker per run |
|---|---:|
| Benchmark claims | 25 |
| Source URLs | 15 |
| Regulatory references | 10 |
| Monetary claims | 10 |

### Public Preview Generator

Role:

Create non-proprietary website preview assets from approved concepts, such as high-level diagrams, intake checklists, or sample maturity scorecards.

Max volume:

| Data type | Max per worker per run |
|---|---:|
| Preview components | 5 |
| Public-safe copy blocks | 10 |
| Visual diagrams | 3 |

Guardrail:

This agent must never export source workbook content, internal formulas, full metadata taxonomies, or confidential client/employer examples.

## Suggested workflow automations

### Automation 1 - HandoverOS Memory Approval Queue

Trigger:

New HandoverOS memory candidate file is created.

Steps:

1. Parse candidate IDs and recommended statuses.
2. Route governance records to HandoverOS Memory Steward.
3. Route benchmark records to Benchmark Refresh Agent.
4. Route public-preview records to Public Preview Generator only after approval.
5. Write approved memory to the active memory registry.

Output:

`approved_memory_records`, `pending_records`, `rejected_records`, `refresh_required_records`.

### Automation 2 - Benchmark Claim Refresh

Trigger:

Any HandoverOS agent attempts to use a benchmark, monetary figure, regulatory citation, or ROI claim externally.

Steps:

1. Check claim freshness.
2. Check whether the claim is verified, modeled, secondary, or unsupported.
3. Require current source verification if stale or unverified.
4. Replace unsupported numbers with qualitative language.

Output:

`claim_status`, `approved_language`, `blocked_language`, `source_refresh_notes`.

### Automation 3 - BestyStaff Public-Safe Preview

Trigger:

Website visitor asks for examples, deliverables, templates, or proof of work.

Steps:

1. Ask relationship-first question.
2. Ask top 5 questions prompt.
3. Ask consent to retain chat context.
4. Offer public-safe preview categories.
5. Ask for email or phone if visitor wants a follow-up or deliverable preview.
6. Close with required unanswered-question prompt.

Output:

`visitor_context`, `approved_preview_type`, `follow_up_needed`, `contact_information`, `unanswered_questions`.

## Recommended next commands

```text
Create the memory approval table from Batch 1, Batch 2, and Batch 2A.
```

```text
Run Benchmark Refresh Agent on HOS-MEM-007, HOS-BLOCK-003, and all HandoverOS monetary claims.
```

```text
Create public-safe BestyStaff HandoverOS preview copy for the Salt Basin homepage.
```

```text
Run Batch 3 - SaltTide Platform Materials.
```
