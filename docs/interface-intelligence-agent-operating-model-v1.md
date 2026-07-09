# Interface Intelligence Agent Operating Model

Version: v1
Status: Recommended operating model

## Agent Loop

Observe -> Classify -> Trace -> Explain -> Detect -> Recommend -> Remember.

Each agent must separate facts, assumptions, interpretations, predictions, risks, confidence, and recommendations. Raw Gmail-derived context or client data cannot become active reusable memory until it passes classification and approval.

## Core Agent Pool

| Agent | Job | Recommended Max Volume Per Worker |
|---|---|---:|
| Interface Transaction Analyst | Inspect API calls, imports, exports, and sync events for missing values, errors, drift, retries, and mismatches. | 250 transactions or 50 error clusters |
| Integration Mapping Agent | Map source/target objects, fields, transformations, dependencies, and failure points. | 150 fields, 20 objects, or 10 sample payloads |
| Revenue Lifecycle Tracer | Follow the Revenue Lifecycle Token from prospect/pipeline through renew, expand, adjust. | 100 tokens or 500 related events |
| Customer Journey Tracer | Follow the customer-adjacent token from external lead through onboarding, payment, support, change, renewal, churn. | 100 tokens or 500 related events |
| Member Journey Tracer | Follow organizational members, child organizations, sites, individual members, end users, free-tier users, and entitlement coverage. | 100 tokens or 500 related events |
| Contract Obligation Mapper | Extract performance obligations, payer responsibility, billing triggers, renewal terms, support terms, payment method, discounts, usage commitments, and variable consideration. | 75 contracts or 250 clauses |
| Financial Transaction Reconciler | Trace every payment, remittance, invoice, adjustment, collection, and revenue recognition event back to the Revenue Lifecycle Token. | 250 financial events |
| Contribution Intelligence Agent | Attribute human, user-type, team, system, AI agent, workflow, and technology contributions to stage gates and outcomes. | 200 contribution events |
| Confidence Reconciliation Agent | Compare conflicting token evidence, score coverage/confidence, and decide whether an agent or human review is required. | 150 conflicts or 500 scored fields |
| Control Evidence Agent | Check whether required controls ran, passed, failed, or require human review. | 50 controls or 250 executions |
| Root Cause Pattern Agent | Cluster recurring failures into leakage patterns, data-governance causes, and process defects. | 300 anomalies or 25 clusters |
| Benchmark And Claims Guard | Prevent stale, unsupported, or external claims from entering public/client outputs. | 100 claims |
| Memory Steward | Classify reusable memory candidates as public-safe, internal, restricted, confidential, or quarantine. | 50 sensitive or 250 low-risk candidates |

## Token Chain Dimensional Model

The model should support a full chain from commercial promise to delivered value:

Deal Type -> Customer/Payer -> Contract Obligation -> Revenue Lifecycle Token -> Customer Journey Token -> Member Journey Token -> Stage Gate -> Interface Transaction -> Field Lineage -> Financial Transaction -> Contribution Event -> Confidence Reconciliation -> Memory Candidate.

Key dimensions:

- Deal contribution intelligence: deal type, valuation size, investment type, industry vertical, actively seeking criteria match, board member skills, sponsor priorities, and value-creation thesis.
- Contract economics: payer, bill-to, invoice destination, payment method, remittance method, annual recurrence, usage pricing, discounts, variable consideration, support terms, renewal notice, and performance obligations.
- Member coverage: parent organization, child organization, site, group, provider, employer population, plan member population, individual license, free tier, activation, utilization, support, and churn/renewal status.
- Resource contribution: human role, user type, team, system, AI agent, workflow, technology, cost basis, elapsed time, quality score, and ROI attribution.
- Confidence: input coverage, output coverage, transformation confidence, token match confidence, financial reconciliation confidence, and human/agent review status.

## Parallel Sizing Formula

worker_count = ceiling(total_units / max_units_per_worker)

functional_lead_count = ceiling(worker_count / 5)

management_agent_count = ceiling(functional_lead_count / 3)

## Volume Tiers

| Size | Practical Scope | Suggested Agent Shape |
|---|---|---|
| Small | Up to 100 pages, 1k rows, 50 defects, or one process tower. | 1-2 workers, 0-1 lead, 1 manager/orchestrator |
| Medium | 100-500 pages, 1k-25k rows, 50-300 defects, or 3-5 towers. | 3-6 workers, 1-2 leads, 1-2 managers |
| Large | 500-2000 pages, 25k-250k rows, 300-1500 defects, or 5-10 towers. | 8-20 workers, 3-5 leads, 2-4 managers |
| Portfolio | Multiple companies or 2000+ pages, 250k+ rows, 1500+ defects. | 20-60 workers, 5-12 leads, 4-8 managers |

## Salt Basin Outputs

| Output | Audience | Purpose |
|---|---|---|
| Executive Interface Intelligence Brief | Sponsor, CFO, CRO, COO, CTO, PortOps | Explain the hidden operating truth and recommended action. |
| Transaction Forensic Packet | RevOps, IT, Finance Ops, Data | Show what happened in a transaction, field by field and step by step. |
| Token Lineage Graph | Product, RevOps, Finance, CS | Trace revenue and customer truth across systems. |
| Member Entitlement Graph | Product, CS, Finance, Healthcare/Market Ops | Trace payer, parent org, child org, site, member, user, free-tier, and entitlement relationships. |
| Contract Obligation Matrix | Legal, Finance, RevOps, Product | Show performance obligations, billing triggers, payment responsibility, support terms, renewal terms, discounts, and variable consideration. |
| Contribution Chain Scorecard | Sponsors, PortOps, Transformation Office | Compare human and technology contribution cost basis, ROI, stage order, contributor combinations, and deal contribution intelligence. |
| Control Evidence Matrix | Finance, Audit, Security, Transformation Office | Show which controls ran and which gaps need review. |
| Root Cause Heatmap | Transformation leaders | Prioritize recurring failure patterns by impact, frequency, and confidence. |
| Source Delta Card | Research and product team | Convert new evidence into model updates without overclaiming. |
| Memory Candidate Register | Internal Salt Basin agents | Preserve reusable insight under classification rules. |
