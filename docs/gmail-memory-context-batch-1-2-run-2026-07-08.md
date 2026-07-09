# Gmail Memory Context Batch 1-2 Run - 2026-07-08

## Run status

This file records the first controlled Gmail-based memory ingestion run for Salt Basin agent context.

Status: completed controlled discovery pass for Batch 1 and Batch 2.

Memory activation status: no memory should be treated as approved or live until Betsy reviews and approves the candidates below.

Destructive actions: none. No emails were sent, archived, labeled, deleted, or modified.

Related detailed extraction:

| Batch | File |
|---|---|
| Batch 2A - HandoverOS Attachment Extraction | `docs/gmail-handoveros-attachment-extraction-batch-2a-2026-07-08.md` |

## Scope

Batch 1 focused on Salt Basin, career portfolio, website, and core operating context.

Batch 2 focused on HandoverOS, quote-to-revenue, revenue leakage, operational intelligence, benchmark, and regulatory framework materials.

The run intentionally avoided raw full-mailbox ingestion. The mailbox is too large for a safe first pass, and the right operating pattern is staged ingestion with consent, deduplication, privacy review, and memory approval.

## Source inventory used

The Gmail account profile available to the connector is Martha Salter at `marthasalter@gmail.com`.

Mailbox inventory at first pass:

| Label | Count |
|---|---:|
| Inbox messages | 321,930 |
| Inbox threads | 314,161 |
| Sent messages | 1,912 |
| Important messages | 9,809 |
| Draft messages | 30 |
| Spam messages | 456 |
| Trash messages | 1 |
| Promotions | 231,180 |
| Updates | 82,168 |
| Personal | 7,209 |
| Notes | 62 |

## Queries run

```text
("Salt Basin" OR saltbasin OR saltbasin.net OR "Career Portfolio Documentation") -in:spam -in:trash -category:promotions
```

```text
(HandoverOS OR "Revenue Leakage" OR Q2R OR "Benchmark Regulatory Matrix" OR "revenue leakage") -in:spam -in:trash -category:promotions
```

```text
has:attachment ("Salt Basin" OR saltbasin OR HandoverOS OR Q2R OR "Revenue Leakage" OR "Career Portfolio") -in:spam -in:trash -category:promotions
```

## Relevant source clusters found

| Cluster | What was found | Recommended memory handling |
|---|---|---|
| Career portfolio documentation | Resume package, career master database, case study portfolio, and related PDF source files | Treat as approved only when matched to current published resume and portfolio artifacts |
| Salt Basin website operations | Render deployment issues, uptime monitoring, domain and email setup, and site operations messages | Use as internal product operations memory only |
| SaltTide platform materials | Pitch deck and speaker notes references for spend intelligence platform work | Stage for separate SaltTide ingestion batch |
| HandoverOS and QTR frameworks | Workbooks, benchmark matrix files, revenue leakage frameworks, QTR operating system files | Treat as restricted internal product IP unless Betsy approves public-safe abstractions |
| CardWise product materials | Product roadmap and backlog references | Stage for separate product-specific ingestion batch |
| Patent and portfolio material | Expired patent spreadsheet and invention-related archive references | Stage for separate IP archive ingestion batch |

## Attachments inspected in this run

### Quote_to_Revenue_Operational_Intelligence_Mature_v1.xlsx

Parsed workbook tabs:

| Sheet | Signal |
|---|---|
| Scenario_Library | Scenario patterns across operating domains such as CRM, CPQ, billing, collections, revenue accounting, forecasting, and governance |
| Entity_Library | Canonical QTR entities including Customer, Opportunity, Quote, Contract, Subscription, Invoice, RevenueSchedule, ARR, NRR, and Product |
| Benchmark_Register | Benchmark placeholders and research anchors that require continuous refresh before external use |
| Operator_Heuristics | Practical operating heuristics for revenue leakage, upstream reporting failures, governance, spreadsheet dependency, and AI validation |
| Research_Backlog | Topics requiring current-source refresh before public or client-facing use |

Important handling note: benchmark references should not be quoted externally until refreshed against current authoritative sources.

### QTR_Operational_Intelligence_OS_V5_Prepopulated.xlsx

Parsed workbook profile:

| Registry | Count |
|---|---:|
| Scenario records | 681 |
| Benchmarks | 31 |
| Sources | 24 |
| Root causes | 108 |
| Impacts | 62 |
| Controls | 47 |
| KPIs | 18 |
| Revenue leakage patterns | 20 |
| AI validation tests | 20 |
| IPO readiness controls | 10 |
| PE value creation plays | 10 |
| Research backlog items | 15 |

This workbook appears to be a mature operating intelligence model. It should be treated as restricted internal product and methods context, not public website content.

### HandoverOS benchmark and revenue leakage files

The HandoverOS workbook attachments were identified as high relevance, but full extraction should be run as a separate controlled attachment pass because the files are large and dense.

Recommended next pass:

```text
Batch 2A - HandoverOS Attachment Extraction
```

## Candidate memory records

These records are recommended candidates only. They require human approval before being used as persistent memory by BestyStaff, Salt Basin product agents, or any public-facing workflow.

### GMC-B12-001 - QTR canonical entity model

Proposed memory:

Salt Basin's quote-to-revenue operating intelligence materials use a canonical entity model that includes Customer, Opportunity, Quote, Contract, Subscription, Invoice, RevenueSchedule, ARR, NRR, and Product.

Use level: internal restricted.

Agent use:

BestyStaff may use this only as a broad explanation that Salt Basin understands quote-to-revenue operating models across upstream and downstream objects. BestyStaff should not expose workbook names, worksheet names, or detailed model structure to website visitors.

Confidence: high.

Approval status: pending.

### GMC-B12-002 - QTR scenario operating model

Proposed memory:

Salt Basin has developed quote-to-revenue scenario libraries that connect operating domains such as CRM, CPQ, billing, revenue accounting, collections, forecasting, and governance to business impacts including revenue leakage, ARR distortion, audit risk, customer impact, EBITDA impact, forecast risk, IPO readiness, and AI risk.

Use level: internal restricted with public-safe abstraction.

Agent use:

BestyStaff may describe this as experience with cross-functional revenue operations diagnostics and maturity mapping. It must not disclose full scenario counts, workbook structure, or proprietary lists unless Betsy approves a public-safe preview.

Confidence: high.

Approval status: pending.

### GMC-B12-003 - Operator heuristics for revenue operations

Proposed memory:

Core QTR heuristics include: product catalog problems often create billing problems; many reporting issues originate upstream; revenue leakage frequently starts as a governance issue; spreadsheet dependency can signal missing operational capability; AI outputs require operational validation.

Use level: internal with approved public-safe restatement.

Agent use:

BestyStaff may use these as conversational diagnostic themes, phrased generally and without claiming proprietary source documents.

Confidence: high.

Approval status: pending.

### GMC-B12-004 - Benchmark and source refresh rule

Proposed memory:

Any monetary figure, benchmark, market statistic, regulatory interpretation, or external-source claim must be refreshed from current authoritative sources before public, client-facing, or sales use.

Use level: universal governance memory.

Agent use:

All agents should apply this rule. If current sourcing is unavailable, agents should qualify figures as approximate, internal, draft, or requiring validation.

Confidence: high.

Approval status: recommended for approval.

### GMC-B12-005 - QTR V5 maturity signal

Proposed memory:

Salt Basin has structured QTR operating intelligence assets with hundreds of scenario records and supporting registries for root causes, controls, KPIs, revenue leakage patterns, AI validation tests, IPO readiness controls, private equity value creation plays, and research backlog items.

Use level: internal restricted.

Agent use:

Management agents may use this to route work to product, diagnostic, benchmark, governance, and AI-validation agents. Public-facing agents should say only that Salt Basin can show non-proprietary previews of operating model templates.

Confidence: high.

Approval status: pending.

### GMC-B12-006 - Public-facing preview boundary

Proposed memory:

Salt Basin may show visual or structural previews of deliverables, but should avoid exposing proprietary content, client-specific examples, workbook internals, employer-owned materials, or source artifacts from past employer projects.

Use level: universal public-facing guardrail.

Agent use:

BestyStaff should offer preview categories such as sample intake maps, maturity scorecards, operating model diagrams, KPI taxonomies, governance checklists, and roadmap structures without giving away proprietary detail.

Confidence: high.

Approval status: recommended for approval.

### GMC-B12-007 - Salt Basin website operations memory

Proposed memory:

Salt Basin's website operating environment includes deployment monitoring, uptime monitoring, domain setup, and business email setup. Operational agents should treat website reliability, DNS/email configuration, and deploy incident follow-up as part of product operations.

Use level: internal operations.

Agent use:

Website operations agents may use this to triage deploy failures, uptime alerts, domain/email setup, and visitor intake continuity.

Confidence: medium.

Approval status: pending.

### GMC-B12-008 - Resume and career artifact deduplication rule

Proposed memory:

Multiple resume, portfolio, and career-source variants exist across Gmail and local files. Career-memory agents should deduplicate against the latest approved published resume package before activating facts for public-facing use.

Use level: universal career-memory governance.

Agent use:

BestyStaff may use only approved career claims and should avoid overstating licenses, transaction ownership, client identities, contract ownership, or source-document possession.

Confidence: high.

Approval status: recommended for approval.

## Recommended agent updates from this run

### BestyStaff for Salt Basin Intake

Add memory access behavior:

1. Start relationship-first:
   `Do you already know Betsy? If so, what is the connection?`

2. Ask the required top-questions prompt:
   `What are the top 5 questions you want to get answered today - if you don't have 5, start with 1`

3. Ask consent before retaining context:
   `Is it okay if Betsy uses the context from this chat to improve your intake experience and follow up more effectively?`

4. Ask for contact information at a natural point:
   `What is the best email or phone number for Betsy to use if this should turn into a follow-up?`

5. Close with the required exit prompt:
   `Did you get all of your questions answered? If not, can you provide any questions before leaving to give Betsy context?`

### BestyStaff Memory Steward

Recommended role:

Review Gmail-derived memory candidates, classify sensitivity, approve or reject activation, and maintain lineage back to source clusters without exposing private emails or attachments.

Suggested maximum batch:

250 candidate records per steward pass, or 50 if attachments include sensitive financial, legal, employer, or client context.

### QTR Operating Intelligence Analyst

Recommended role:

Convert QTR workbook structures into safe internal operating model components, public-safe preview concepts, and client-specific diagnostic templates.

Suggested maximum batch:

100 scenarios, 25 controls, or 25 KPIs per worker agent per run.

### Benchmark Refresh Agent

Recommended role:

Refresh stale benchmark placeholders, validate source credibility, identify date/version risk, and prevent unsourced figures from entering public-facing agent responses.

Suggested maximum batch:

25 benchmark claims per worker agent per run.

## How to continue running this

Recommended next command to give Codex:

```text
Run Batch 2A - HandoverOS Attachment Extraction and create approved/pending memory candidates.
```

Alternative next commands:

```text
Run Batch 3 - SaltTide Platform Materials.
```

```text
Run Batch 4 - CardWise Product Materials.
```

```text
Run Batch 5 - Visitor Intake and Prospect Follow-Up Patterns.
```

```text
Create a memory approval table from all Gmail memory candidate files.
```

## Operating rule for future Gmail ingestion

Do not ingest the whole mailbox as active memory. Use staged batches, extract candidate records, classify sensitivity, preserve provenance, and require Betsy's approval before memory activation.
