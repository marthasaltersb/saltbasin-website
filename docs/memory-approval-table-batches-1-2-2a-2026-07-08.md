# Memory Approval Table - Gmail Batches 1, 2, and 2A - 2026-07-08

## Purpose

This file consolidates memory candidates from the first Gmail discovery pass, Batch 1/2, and Batch 2A HandoverOS attachment extraction.

No memory is active until Betsy explicitly approves it. The "Recommended decision" column is a system recommendation only. Blank "Betsy decision" cells remain pending review.

Approval event:

| Date | Approval scope |
|---|---|
| 2026-07-08 | Betsy approved the recommended immediate approvals and blocked-claim guardrails. |

Active register created from this approval:

| Register | File |
|---|---|
| Canonical universal Salt Basin agent memory register | `docs/active-universal-salt-basin-agent-memory-register.md` |
| Universal Salt Basin agent memory register | `docs/active-universal-salt-basin-agent-memory-register-2026-07-08.md` |

## Source files

| Batch | Source file |
|---|---|
| First pass | `docs/gmail-memory-context-first-pass-2026-07-08.md` |
| Batch 1/2 | `docs/gmail-memory-context-batch-1-2-run-2026-07-08.md` |
| Batch 2A | `docs/gmail-handoveros-attachment-extraction-batch-2a-2026-07-08.md` |

## Decision legend

| Decision | Meaning |
|---|---|
| Approve - guardrail | Safe to activate as a universal rule across agents. |
| Approve - internal | Safe to activate for internal agents, not public-facing claims. |
| Approve - public-safe | Safe to activate for public-facing agents within the stated boundary. |
| Pending review | Useful candidate, but Betsy should review wording, sensitivity, source freshness, or product positioning first. |
| Block / reject | Do not activate as factual or public-facing memory. Retain only as an exclusion, caution, or historical modeling note. |

## Master approval table

| ID | Source batch | Candidate memory / rule | Recommended decision | Sensitivity | Public use boundary | Next action | Betsy decision |
|---|---|---|---|---|---|---|---|
| GMC-001 | First pass | Career portfolio documentation exists as a self-sent package with resume, career master database, and case study portfolio attachments. | Approve - internal | Internal | Do not expose source-file inventory publicly. | Compare against latest approved career docs. |  |
| GMC-002 | First pass | Career portfolio package includes three PDFs: executive resumes package, career master database, and case study portfolio. | Approve - internal | Internal | BestyStaff may rely only on approved career facts, not raw attachment contents. | Add to career-source inventory. |  |
| GMC-003 | First pass | SaltTide is framed as financial spend intelligence / credit health with scenario testing, cost-basis validation, margin validation, and long-horizon thesis exploration. | Pending review | Restricted | Not visitor-facing until investor/financial-language review. | Run Batch 3 SaltTide extraction and classify claims. |  |
| GMC-004 | First pass | HandoverOS materials were shared as illustrative frameworks for revenue leakage, risk scenarios, AI/systems consolidation, IPO risk mitigation, and valuation improvement. | Approve - internal | Restricted | Public agents may use only high-level QTR/revenue-operations language. | Supersede with Batch 2A HOS-MEM records where more specific. |  |
| GMC-005 | First pass | CardWise appears as a credit-card/credit-health optimizer or investor/financial-advisory style product artifact. | Pending review | Restricted | Not visitor-facing until financial/investor-language guard review. | Run CardWise extraction batch. |  |
| GMC-006 | First pass | Salt Basin website has uptime/deployment monitoring via Render and UptimeRobot; a 503 incident resolved quickly on 2026-07-07. | Approve - internal | Internal | Do not disclose operational incident history to visitors unless needed for support. | Add to website operations memory. |  |
| GMC-007 | First pass | Expired patent archive spreadsheet exists in email context. | Pending review | Restricted | Do not make patent/IP claims without extraction and source review. | Run patent archive schema/profile pass. |  |
| GMC-008 | First pass | Betsy shares exploratory product strategy with trusted reviewers and seeks collaboration around technical architecture, AI build, and pilot/joint venture paths. | Pending review | Restricted | Do not expose relationship or recipient context. | Convert into collaborator-intake preference after review. |  |
| GMC-009 | First pass | Product/workflow concepts include SaltTide, HandoverOS, CardWise, patent archive, career portfolio, and website monitoring. | Approve - internal | Internal | Public agents may mention only approved product names and categories. | Seed product/agent roadmap taxonomy. |  |
| GMC-010 | First pass | Email-derived materials must be classified as public-safe, internal, restricted, confidential, or quarantine before becoming memory. | Approve - guardrail | Global guardrail | Internal governance rule only. | Activate across all memory-ingestion agents. | Approved by Betsy 2026-07-08 |
| GMC-B12-001 | Batch 1/2 | QTR materials use canonical entities including Customer, Opportunity, Quote, Contract, Subscription, Invoice, RevenueSchedule, ARR, NRR, and Product. | Pending review | Internal restricted | BestyStaff may say Salt Basin understands upstream/downstream QTR objects, without listing full schema. | Approve wording for internal QTR memory. |  |
| GMC-B12-002 | Batch 1/2 | QTR scenario libraries connect CRM, CPQ, billing, revenue accounting, collections, forecasting, and governance to business impacts. | Pending review | Internal restricted | Only public-safe abstraction: cross-functional revenue operations diagnostics and maturity mapping. | Review for proprietary scope before public use. |  |
| GMC-B12-003 | Batch 1/2 | Core QTR heuristics include product catalog to billing issues, upstream reporting roots, governance-driven leakage, spreadsheet dependency, and AI validation. | Pending review | Internal | May be used as general diagnostic themes after restatement. | Convert to public-safe diagnostic language. |  |
| GMC-B12-004 | Batch 1/2 | Monetary figures, benchmarks, market statistics, regulatory interpretations, and external-source claims must be refreshed before public/client/sales use. | Approve - guardrail | Universal governance | Internal rule only. | Activate across all agents. | Approved by Betsy 2026-07-08 |
| GMC-B12-005 | Batch 1/2 | QTR V5 workbook signals a mature operating intelligence asset with scenario, root-cause, control, KPI, revenue leakage, AI validation, IPO, PE, and research registries. | Approve - internal | Internal restricted | Public agents may say Salt Basin can show non-proprietary operating model previews. | Add to management-agent routing memory. |  |
| GMC-B12-006 | Batch 1/2 | Salt Basin can show visual or structural previews while avoiding proprietary content, client examples, workbook internals, employer-owned materials, and source artifacts. | Approve - guardrail | Universal public-facing guardrail | BestyStaff may use preview categories only. | Activate across visitor agents. | Approved by Betsy 2026-07-08 |
| GMC-B12-007 | Batch 1/2 | Salt Basin website operations include deployment monitoring, uptime monitoring, domain setup, and business email setup. | Approve - internal | Internal operations | Do not share internal ops details with visitors. | Add to website operations agent memory. |  |
| GMC-B12-008 | Batch 1/2 | Multiple resume, portfolio, and career-source variants exist; career-memory agents should dedupe against latest approved published package. | Approve - guardrail | Career governance | Public agents may use only approved career claims. | Activate across career and BestyStaff agents. | Approved by Betsy 2026-07-08 |
| HOS-MEM-001 | Batch 2A | HandoverOS frames QTR as operational handoffs from prospect through renewal; missing structured metadata creates leakage, audit, dispute, forecast, collections, and AI-readiness risk. | Approve - internal | Restricted | General public-safe statement only: Salt Basin works on QTR handoffs, data integrity, and operating model design. | Activate internally; create short public copy separately. |  |
| HOS-MEM-002 | Batch 2A | HandoverOS uses six QTR scenario families: close cycle, usage billing, revenue recognition vs. billing, pre-bill/disputes, auto-pay/collections, and PS billing/rev rec. | Pending review | Restricted | BestyStaff may show high-level maturity map only after Betsy approves categories. | Approve or rename public categories. |  |
| HOS-MEM-003 | Batch 2A | Contract metadata captured at or before signature is the control foundation for billing, rev rec, ARR reporting, disputes, auto-pay, collections, audit support, renewals, and AI reliability. | Approve - public-safe | Internal/public-safe | Safe as a concept; do not expose full field taxonomy. | Activate for BestyStaff and QTR agents. |  |
| HOS-MEM-004 | Batch 2A | HandoverOS distinguishes paying client, end user client, and master contract records because legal, billing, service, tax, contract, concentration, and ARR levels may differ. | Approve - internal | Restricted | Public use only as a general data-model concept. | Keep full detail internal. |  |
| HOS-MEM-005 | Batch 2A | Billing and revenue recognition are related but independent tracks; billing follows invoice/payment/usage/customer events, while rev rec follows contract/performance/delivery/accounting logic. | Approve - public-safe | Internal/public-safe | Explain operating model only; do not provide accounting, audit, tax, or legal advice. | Activate with professional-review disclaimer. |  |
| HOS-MEM-006 | Batch 2A | Data validation is a risk-control step before migration, diligence, fundraising, IPO readiness, and AI automation. | Approve - public-safe | Internal/public-safe | Use qualitative language; no unsupported multipliers. | Activate with benchmark-refresh guardrail. |  |
| HOS-MEM-007 | Batch 2A | HandoverOS benchmark claims, monetary figures, market statistics, regulatory references, and ROI assumptions require current-source refresh before external use. | Approve - guardrail | Governance | Internal rule only. | Activate across all HandoverOS/QTR agents. | Approved by Betsy 2026-07-08 |
| HOS-MEM-008 | Batch 2A | Modeled assumptions such as recovery rates, platform cost estimates, AI compounding logic, valuation impacts, contract issue rates, and deal-risk expected values must stay labeled as assumptions. | Approve - guardrail | Governance | Internal rule only. | Activate across benchmark and pitch agents. | Approved by Betsy 2026-07-08 |
| HOS-MEM-009 | Batch 2A | Deprecated or removed statistics must not be reused unless Betsy approves updated evidence. | Approve - guardrail | Governance | Internal rule only. | Activate as blocked-claim memory. | Approved by Betsy 2026-07-08 |
| HOS-MEM-010 | Batch 2A | BestyStaff may preview HandoverOS-style deliverables as visual structures such as QTR lifecycle maps, contract metadata checklists, maturity scorecards, risk registers, handoff maps, or control evidence matrices. | Approve - public-safe | Public-safe with restrictions | Do not give away workbook content, formulas, full taxonomies, private examples, or source files. | Activate for public-preview flow. |  |
| HOS-MEM-011 | Batch 2A | Agents must not imply Betsy owns prior-employer contracts/source documents, disclose client names, or claim she was deal broker, operating principal, fund manager, or transaction owner for Vista portfolio company work. | Approve - guardrail | Universal guardrail | Internal rule only. | Activate across all public-facing agents. | Approved by Betsy 2026-07-08 |
| HOS-MEM-012 | Batch 2A | Engine names may be used internally for routing and design, but public-facing naming and positioning require Betsy's approval. | Pending review | Restricted | Broad capability categories only until approved. | Betsy to approve product naming vocabulary. |  |
| HOS-BLOCK-001 | Batch 2A | Do not activate a specific AI-on-dirty-data numeric compounding multiplier as factual memory. | Block / reject | Blocked claim | Replace with qualitative risk statement. | Add to blocked-claims register. | Approved as blocked by Betsy 2026-07-08 |
| HOS-BLOCK-002 | Batch 2A | Do not activate placeholder HandoverOS platform pricing as actual product pricing. | Block / reject | Blocked claim | No pricing claims until pricing is approved. | Add to blocked-claims register. | Approved as blocked by Betsy 2026-07-08 |
| HOS-BLOCK-003 | Batch 2A | Do not quote unrefreshed benchmark values, market statistics, source URLs, regulatory interpretations, or dollar impact figures externally. | Block / reject for public use | Blocked public claim | Requires current-source verification before external use. | Route through Benchmark Refresh Agent. | Approved as blocked by Betsy 2026-07-08 |

## Recommended immediate approvals

These are the lowest-risk rows to approve first because they are governance rules or public-safety boundaries rather than factual marketing claims:

| ID | Reason |
|---|---|
| GMC-010 | Establishes classification gates for all email-derived memory. |
| GMC-B12-004 | Prevents stale or unsourced external claims. |
| GMC-B12-006 | Protects proprietary, client, employer, and source-document boundaries. |
| GMC-B12-008 | Prevents stale or conflicting resume/career facts. |
| HOS-MEM-007 | Forces current-source refresh for HandoverOS claims. |
| HOS-MEM-008 | Keeps assumptions labeled as assumptions. |
| HOS-MEM-009 | Blocks deprecated or removed statistics. |
| HOS-MEM-011 | Prevents employer/client/project overclaiming. |
| HOS-BLOCK-001 | Blocks unsupported AI multiplier. |
| HOS-BLOCK-002 | Blocks placeholder pricing. |
| HOS-BLOCK-003 | Blocks unrefreshed external benchmark claims. |

## Records that need Betsy's judgment

| ID | Why it needs review |
|---|---|
| GMC-003 | SaltTide contains financial/investor thesis language. |
| GMC-005 | CardWise may involve financial advisory or investor-language precision risk. |
| GMC-008 | Relationship/collaborator preference memory may expose private context if not narrowed. |
| GMC-B12-001 | QTR entity model may reveal too much structure if used publicly. |
| GMC-B12-002 | Scenario operating model should be abstracted before public use. |
| GMC-B12-003 | Heuristics should be restated in public-safe language. |
| HOS-MEM-002 | Six scenario names may need product-positioning approval before public preview. |
| HOS-MEM-012 | HandoverOS engine names require naming and positioning approval. |

## Approval workflow

1. Betsy reviews the "Recommended immediate approvals" table first.
2. Approved guardrails become universal context for all current and future Salt Basin agents.
3. Internal memories become available to management, product, ingestion, and operations agents only.
4. Public-safe memories become available to BestyStaff only within the public-use boundary.
5. Pending records stay out of active memory until rewritten, refreshed, or approved.
6. Blocked records become negative memory: agents should remember not to use them as claims.

## Suggested next command

```text
Activate the recommended immediate approvals as a universal Salt Basin agent memory register.
```
