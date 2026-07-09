# HandoverOS Interface Intelligence Layer

Version: v2
Status: Recommended product definition and operating blueprint
Owner: Salt Basin Net Works

## Recommended Definition

HandoverOS Interface Intelligence is a governed transaction-lineage layer that sits above client integrations, APIs, imports, exports, and system-to-system connectors. It turns every interface event into an agent-readable evidence record: source and target systems, object identity, payload values, transformations, waterfall steps, validation results, revenue lifecycle token placement, customer journey token placement, member journey token placement, contribution attribution, confidence reconciliation, exceptions, and recommended follow-up.

## Product One-Liner

HandoverOS Interface Intelligence traces every revenue, customer, and member lifecycle data transaction across systems, then uses Salt Basin agents to explain lineage, detect mismatches, identify hidden operational risk, reconcile contribution, and preserve reusable institutional memory.

## Product Doctrine

Most revenue leakage and customer-friction issues are not created where they become visible. They are created upstream in a field, rule, approval, transform, stale source, missing handoff, missing token, or control gap that no one can see later.

The product makes those hidden moments visible. It does not only ask whether data moved. It asks what changed, why it changed, which lifecycle object it affected, which downstream processes now depend on it, which control should have caught it, and whether the business can trust the result.

## Three Primary Token Model

| Token | Purpose | Lifecycle |
|---|---|---|
| Revenue Lifecycle Token | Follows commercial and financial truth from demand creation through revenue operations. | Prospect -> Pipeline -> Proposal -> Contract -> Order -> Subscription -> Bill -> Invoice -> Collect -> Recognize -> Renew/Expand -> Adjust |
| Customer Journey Token | Follows the customer-adjacent truth from external signal through service and expansion. | External Lead -> Qualified Prospect -> Negotiation -> Signature -> Onboarding -> Active Customer -> Payment -> Support/Change -> Renewal/Expansion/Churn |
| Member Journey Token | Follows the entitled organization, child organization, site, individual member, end user, or free-tier user who receives, accesses, or consumes the product. | Eligible Population -> Invited Member -> Entitled Member -> Activated User/Site -> Licensed Use -> Support/Utilization -> Expansion/Change -> Renewal/Termination |

The three tokens are linked but not identical. A customer can agree to pay at the contract level while onboarding, fulfillment, utilization, support, and renewal happen at a child organization, related organization, site, provider group, district, employer population, health plan member group, individual member, or end user level. Interface Intelligence preserves revenue truth, customer truth, and member/entitlement truth without flattening them into one account record.

## Supporting Agent Tokens

Primary tokens should be reconciled by supporting agent tokens:

| Token | Purpose |
|---|---|
| Contract Obligation Token | Tracks performance obligations, payment responsibility, billing triggers, support terms, renewal notice dates, variable consideration, discounts, and usage commitments. |
| Financial Transaction Token | Tracks each payment, invoice, remittance choice, auto-pay/manual payment status, collections event, adjustment, and revenue recognition event back to the Revenue Lifecycle Token. |
| Resource Contribution Token | Tracks human roles, user types, teams, systems, AI agents, workflows, and technology contributions to the outcome. |
| Confidence Reconciliation Token | Compares conflicting token evidence, scores coverage and confidence, and records which agent or human resolved the conflict. |

## Member Token Examples

Member tokens are required when the contract customer, fulfillment organization, licensed entity, and end user are not the same. Examples include district-level contracts with site-level fulfillment and end-user coverage, shared server license agreements, enterprise end user license agreements, health plan or employer-sponsored telehealth access, provider-first healthcare models, independently paid individual users, and free-tier users who later convert or influence utilization.

## Where It Fits In Salt Basin

Interface Intelligence becomes the evidence layer under HandoverOS, the governed context layer for BestyStaff, and a high-value use case for the Salt Basin Contribution Intelligence API. It extends the current site lineage capability from field-level content change history into enterprise transaction forensics across revenue and customer systems.

## Public-Safe Positioning

Public-facing outputs can show maps, scorecards, governance checklists, lineage diagrams, capability taxonomies, and example schemas. Public outputs should not expose raw Gmail-derived materials, proprietary workbook internals, client/employer artifacts, private formulas, or full field taxonomies without approval.
