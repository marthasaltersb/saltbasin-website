# Gmail Memory Context First Pass - 2026-07-08

Purpose: first-pass recommended memory context list generated from connected Gmail using a governed, approval-gated approach.

Status: draft for Betsy review. No memory should be activated from this file until Betsy approves the candidate records.

## Run Summary

Source: connected Gmail account.

Run type: inventory plus targeted relevance pass.

Date run: 2026-07-08.

Scope reviewed:

- Gmail profile and label inventory.
- Recent non-spam/non-trash sample.
- Recent attachment-bearing sample.
- Targeted searches for Salt Basin, SaltTide, career portfolio, resume, HandoverOS, CardWise, and sent-to-Betsy context.
- Selected high-relevance threads only.

Not completed yet:

- Full mailbox read.
- Full attachment extraction.
- Full historic deduplication.
- Human approval of memory candidates.
- Activation of any memory into BestyStaff.

## Mailbox Inventory

| Area | Count / Observation |
|---|---:|
| Inbox messages | 321,930 |
| Inbox threads | 314,161 |
| Sent messages | 1,912 |
| Sent threads | 1,224 |
| Important messages | 9,809 |
| Draft messages | 30 |
| Spam messages | 456 |
| Trash messages | 1 |
| Category: Promotions | 231,180 messages |
| Category: Updates | 82,168 messages |
| Category: Personal | 7,209 messages |
| Notes label | 62 messages |

Initial implication: full ingestion should not start with "read everything." Most mailbox volume appears to be low-value promotions/updates. Recommended approach is staged ingestion with strict filtering, dedupe, and approval gates.

## First-Pass Memory Candidates

### Approved Candidate Pool For Review

These are recommended candidates, not activated memories.

| ID | Category | Candidate Memory | Suggested Use | Sensitivity | Confidence |
|---|---|---|---|---|---|
| GMC-001 | Identity and Positioning | Career portfolio documentation exists as a self-sent package with resume, career master database, and case study portfolio attachments. | Use as internal source inventory for Betsy's approved career positioning. | Internal | High |
| GMC-002 | Document and Attachment Index | The career portfolio package includes three PDFs: executive resumes package, career master database, and case study portfolio. | Track as approved career-context attachment set, pending Betsy approval for memory activation. | Internal | High |
| GMC-003 | Product Idea / SaltTide | SaltTide is framed in email context as a financial spend intelligence / credit health thesis with scenario testing, cost-basis validation, margin validation, and long-horizon thesis exploration. | Use as internal product-development context for SaltTide, not visitor-facing claims. | Restricted | Medium |
| GMC-004 | Product Idea / HandoverOS | HandoverOS materials were shared as illustrative but usable frameworks for revenue leakage, risk scenarios, AI/systems consolidation, IPO risk mitigation, and valuation improvement. | Use as internal product/service positioning context after review. | Restricted | Medium |
| GMC-005 | Product Idea / CardWise | CardWise appears as a credit-card/credit-health optimizer or investor/financial-advisory style product artifact with speaker notes and pitch deck attachments. | Use as product inventory context; route language through Investor Language Guard before external use. | Restricted | Medium |
| GMC-006 | Product Operations | Salt Basin website has uptime/deployment monitoring via Render and UptimeRobot; a 503 incident occurred and resolved within about 10 minutes on 2026-07-07. | Use as internal ops memory for website reliability and monitoring. | Internal | High |
| GMC-007 | Product Research / Patents | There is an expired patent archive spreadsheet sent to Betsy's Salt Basin email. | Use as internal research inventory; do not make claims from it without extraction and review. | Restricted | Medium |
| GMC-008 | Operating Preference | Betsy shares exploratory product strategy with trusted reviewers and seeks collaboration around technical architecture, AI build, and pilot/joint venture paths. | Use internally to shape follow-up and collaborator-intake agents. | Restricted | Medium |
| GMC-009 | Product Maturity Signal | Attachments and emails show multiple product/workflow concepts: SaltTide, HandoverOS, CardWise, expired patent archive, career portfolio, and website monitoring. | Use to seed product/agent roadmap taxonomy. | Internal | High |
| GMC-010 | Guardrail Signal | Several materials are pitch decks, frameworks, or career artifacts; before becoming public memory, each must be classified as public-safe, internal, restricted, confidential, or quarantine. | Use as governance rule for email-derived memory. | Global guardrail | High |

## Needs Betsy Review

| ID | Review Reason | Suggested Decision |
|---|---|---|
| GMC-003 | SaltTide email contains strategic thesis language and financial-market ideas that could be sensitive or speculative. | Approve only as internal product context; require Investor Language Guard for public use. |
| GMC-004 | HandoverOS attachments may contain proprietary Salt Basin frameworks and revenue-leakage logic. | Approve as internal product context; create safe public summary separately. |
| GMC-005 | CardWise materials may involve financial/investor language and legal precision risks. | Keep restricted until language guard review. |
| GMC-007 | Patent archive contents were not extracted yet and may require source validation. | Keep restricted until attachment extraction and review. |
| Relationship/contact context from targeted threads | Contains personal contacts and relationship context. | Keep restricted; do not expose in visitor-facing agents. |

## Quarantined / Excluded From This Pass

| Content Type | Reason |
|---|---|
| Promotions and retail emails | High volume, low relevance to Salt Basin memory. |
| Financial account alerts and credit-related personal notices | Sensitive personal/financial context; exclude unless Betsy explicitly requests a personal finance memory domain. |
| USPS informed delivery images | Personal/private mailstream data; exclude by default. |
| Raw personal contact details | Restricted; only store if Betsy approves a relationship memory. |
| Unsupported invoice PDFs and payment receipts | Sensitive finance/admin context; do not ingest into general memory. |

## Attachment Index From First Pass

| Attachment | Source Topic | Type | Suggested Handling | Sensitivity |
|---|---|---|---|---|
| Betsy_Salter_Career_Master_Database__Final.pdf | Career portfolio | PDF | Already available locally from prior source; use as career context after approval. | Internal |
| Betsy_Salter_Case_Study_Portfolio_Canva_Source_Final.pdf | Career portfolio | PDF | Already available locally from prior source; use as career context after approval. | Internal |
| Betsy Salter Executive Resumes Package (1).pdf | Career portfolio | PDF | Already available locally from prior source; use as career context after approval. | Internal |
| SaltTide Speaker Notes_V4.docx | SaltTide | DOCX | Extract in next pass; classify for investor-language risk. | Restricted |
| SaltTide Investor Pitch v4.pptx | SaltTide | PPTX | Extract/render in next pass; classify claims and safe-preview potential. | Restricted |
| BetsySalterCV2026 (1).pdf | Career positioning | PDF | Compare to latest approved career docs; dedupe. | Internal |
| Copy of HandoverOS_Revenue_Leakage_v2-2.xlsx | HandoverOS | XLSX | Profile schema; do not memorize raw rows until reviewed. | Restricted |
| Copy of HandoverOS_Q2R_Benchmark_Regulatory_Matrix-1.xlsx | HandoverOS | XLSX | Profile schema; validate source/benchmark assumptions. | Restricted |
| Copy of HandoverOS_Q2R_Benchmark_Regulatory_Matrix-1 (2).xlsx | HandoverOS | XLSX | Dedupe with other version before extracting memory. | Restricted |
| CardWise_Speaker_Notes.docx | CardWise | DOCX | Extract in next pass; route through Investor Language Guard. | Restricted |
| CardWise_Final_Pitch.pptx | CardWise | PPTX | Extract/render in next pass; classify safe-preview potential. | Restricted |
| updated_expired_patent_archive.xlsx | Patent research | XLSX | Profile schema; validate external/public-source status before use. | Restricted |

## Product and Agent Improvement Signals

| Signal | Evidence Pattern | Product Opportunity | Priority |
|---|---|---|---|
| Career portfolio is now a core memory source | Self-sent career package and local PDFs | Create approved career-memory bundle for BestyStaff and homepage Q&A. | High |
| HandoverOS is productizing Q2R/revenue-leakage reasoning | Shared framework attachments and outreach language | Build HandoverOS memory namespace with public-safe, internal, and restricted layers. | High |
| SaltTide needs strict investor-language controls | Pitch and speaker notes with financial thesis language | Apply Investor Language Guard before any public or prospect-facing use. | High |
| CardWise/SaltTide share financial advisory precision needs | Pitch artifacts and prior guardrail docs | Create shared "financial/investor claims" review workflow. | High |
| Website reliability monitoring is present | Render and UptimeRobot incident emails | Add ops memory for monitoring, incident response, and status-page automation. | Medium |
| Gmail volume is newsletter-heavy | Label inventory shows 231k promotions and 82k updates | Build filters before any full mailbox ingestion. | High |

## Recommended Next Ingestion Batches

Batch 1: Career and Salt Basin Core

- Query: `("Salt Basin" OR saltbasin OR saltbasin.net OR "Career Portfolio Documentation") -in:spam -in:trash`
- Include attachments.
- Goal: approved career memory, Salt Basin identity, product inventory, website ops.

Batch 2: HandoverOS / Q2R

- Query: `(HandoverOS OR "Revenue Leakage" OR Q2R OR "Benchmark Regulatory Matrix") -in:spam -in:trash`
- Include spreadsheet schema profiling.
- Goal: product memory and safe-preview inventory.

Batch 3: SaltTide / Financial Advisory

- Query: `(SaltTide OR "Credit Health" OR "Financial Spend Intelligence" OR "Investor Pitch") -in:spam -in:trash`
- Include DOCX/PPTX extraction.
- Goal: internal product memory; all claims restricted pending language review.

Batch 4: CardWise

- Query: `(CardWise OR "cc optimizer" OR "credit optimizer") -in:spam -in:trash`
- Include DOCX/PPTX extraction.
- Goal: product concept inventory and investor-language review.

Batch 5: Relationship and Prospect Context

- Query: sent mail to known prospect/referral domains, excluding promotions/updates.
- Goal: relationship memory, contact preferences, follow-up opportunities.
- Default sensitivity: restricted.

Batch 6: Website/Product Operations

- Query: `(Render OR UptimeRobot OR Netlify OR Supabase OR Anthropic OR OpenAI) (saltbasin OR SaltBasin OR "saltbasin-website") -in:spam -in:trash`
- Goal: ops runbook, billing/admin inventory, incident memory.
- Default sensitivity: internal or restricted.

## Recommended Gmail Filters For Ingestion

Do not start with all mail. Use exclusion-first filtering:

```text
-in:spam -in:trash -category:promotions
```

For likely memory value:

```text
(from:marthasalter@gmail.com OR to:betsysalter@saltbasin.net OR saltbasin OR SaltTide OR HandoverOS OR CardWise OR "Career Portfolio")
```

For attachments:

```text
has:attachment -in:spam -in:trash -category:promotions
```

For sensitive exclusion/quarantine:

```text
(bank OR password OR receipt OR invoice OR "charge off" OR medical OR tax OR legal)
```

## Recommended Memory Activation Rules

- Activate `GMC-001`, `GMC-002`, `GMC-006`, `GMC-009`, and `GMC-010` only after Betsy approval.
- Keep `GMC-003`, `GMC-004`, `GMC-005`, `GMC-007`, and relationship context restricted until deeper extraction and review.
- Do not activate any raw message body as memory.
- Do not activate contact details into visitor-facing agents.
- Do not activate financial/personal account notices.
- Do not use any attachment externally until classified as public-safe.

## Proposed Memory Namespaces

```text
memory/career/approved
memory/saltbasin/identity
memory/saltbasin/products/handoveros/internal
memory/saltbasin/products/salttide/restricted
memory/saltbasin/products/cardwise/restricted
memory/saltbasin/website-ops/internal
memory/relationships/restricted
memory/guardrails/global
memory/product-learning/internal
```

## Next Step

Recommended next action: run Batch 1 and Batch 2 in controlled chunks, then produce a second-pass memory candidate list with attachment-derived summaries. Betsy should approve or reject candidates before any are activated for BestyStaff.
