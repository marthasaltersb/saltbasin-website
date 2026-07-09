# Salt Basin Business Definition Scenario Starter Catalog v1

Version: 2026-07-09
Status: Starter L2 scenario catalog for client discovery

## 1. Purpose

This catalog provides the first reusable L2 scenario families for the Salt Basin Business Definition Tool. It should seed the scenario discovery workspace so agents can compare a client's source material against known commercial, customer, member, product, billing, and financial patterns.

The catalog should not be treated as exhaustive. It is the first inheritance layer. Client-specific variations should extend these scenario families, not overwrite them.

## 2. Standard L1 Revenue Lifecycle Stages

| Stage ID | Stage | Default Weight |
|---|---|---:|
| rev.lead | Lead | 0.05 |
| rev.qualification | Qualification | 0.10 |
| rev.opportunity | Opportunity | 0.15 |
| rev.proposal | Proposal / Quote | 0.15 |
| rev.contract | Contract | 0.15 |
| rev.order | Order / Booking | 0.10 |
| rev.fulfillment | Fulfillment / Provisioning | 0.10 |
| rev.billing | Billing | 0.05 |
| rev.collection | Collection / Payment | 0.05 |
| rev.recognition | Revenue Recognition | 0.05 |
| rev.success | Customer Success / Support | 0.03 |
| rev.renewal | Renewal / Expansion / Termination | 0.02 |

Weights are starter values. They should be adjusted by client, product family, and scenario if certain stages drive more risk, value, or operational completeness.

## 3. Starter L2 Scenarios

### 3.1 Brand New Sale

Scenario ID: `l2.brand_new_sale`

Definition: A new commercial relationship where the sold-to party has not previously held a paying contract for the selected product or service.

Required journey outputs:

- Revenue Lifecycle: new pipeline, proposal, contract, order, bill, collect, recognize.
- Customer Journey: prospect becomes customer.
- Member Journey: member/site/user entitlement may be created if fulfillment party differs from contracting party.

Required metadata chips:

- Customer Identity Chip.
- Payer Identity Chip.
- Product Version Chip.
- Pricing Version Chip.
- Contract Obligation Chip.
- Billing Trigger Chip.
- Performance Obligation Chip.
- Revenue Recognition Chip.

Key business rules:

- Sold-to party must be the party signing a payment obligation.
- Bill-to may equal sold-to or may be a separate paying/admin party.
- End user/member/fulfill-to may equal sold-to or may be a child org, site, provider, employer group, health plan member, individual user, or free-tier user.
- First bill requires a defined Billing Activation milestone.
- Revenue recognition requires a defined obligation and recognition trigger.

### 3.2 Existing Customer Change

Scenario ID: `l2.existing_customer_change`

Definition: A commercial or operational change to an existing customer, member, entitlement, product, price, billing arrangement, or obligation.

Common variants:

- Add product.
- Remove product.
- Change quantity.
- Change site/member coverage.
- Change bill-to.
- Change payment method.
- Change support entitlement.
- Change term.
- Change price or discount.

Key distinction: this is not a new customer sale. The customer/member/product/obligation lineage must reference the prior active state.

### 3.3 Renewal

Scenario ID: `l2.renewal`

Definition: Continuation, replacement, or re-commitment of an existing commercial obligation at or near term end.

Required metadata:

- Current contract end date.
- Renewal notice window.
- Auto-renewal status.
- Uplift rule.
- Product/pricing version allowed at renewal.
- Renewal quote or order requirement.
- Churn/contraction/expansion classification.

Key rules:

- Renewal movement should classify revenue as retained, expanded, contracted, churned, or corrected.
- Renewal cannot be confidently reported if prior entitlement and contract obligation are not linked.

### 3.4 Expansion

Scenario ID: `l2.expansion`

Definition: Incremental commercial value added to an existing customer, member, site, or entitlement.

Common variants:

- Product upsell.
- Seat/member/site expansion.
- Usage tier increase.
- Support upgrade.
- Add-on module.
- Price increase.

Key rules:

- Expansion requires an existing customer or member token.
- Expansion must distinguish new product, new quantity, price effect, usage effect, and correction effect.

### 3.5 Cancellation / Churn

Scenario ID: `l2.cancellation`

Definition: Full or partial termination of a customer, member, entitlement, product, or obligation.

Required metadata:

- Cancellation effective date.
- Last service date.
- Final invoice status.
- Refund/credit status.
- Revenue recognition impact.
- Member access termination.
- Contract notice compliance.

Key rules:

- Churn reporting should separate logo churn, product churn, member churn, revenue churn, and entitlement cancellation.
- Cancellation may create financial transaction tokens for credits, refunds, write-offs, and revenue reversals.

### 3.6 Parent Pricing Agreement

Scenario ID: `l2.parent_pricing_agreement`

Definition: A parent organization signs or approves commercial terms that make child organizations, sites, members, or individuals eligible for defined pricing, but may not itself purchase or pay for the product.

Required metadata:

- Parent account.
- Eligible child/member population.
- Pricing version.
- Eligibility rules.
- Whether parent has payment obligation.
- Whether child orgs must purchase separately.
- Campaign or sales motion for eligible members.

Key rules:

- Parent agreement signature does not necessarily equal closed-won revenue.
- Child purchase journeys may inherit pricing terms while creating their own revenue lifecycle tokens.

### 3.7 Child Organization Purchase Under Parent Terms

Scenario ID: `l2.child_org_purchase_under_parent_terms`

Definition: A child organization, site, district, employer group, provider location, or related entity purchases under pricing or eligibility terms negotiated at a parent level.

Required metadata:

- Parent agreement reference.
- Child sold-to.
- Child bill-to.
- Child fulfill-to/member population.
- Pricing inheritance.
- Contract and billing responsibility.

Key rules:

- The child organization must have its own customer/member token relationship.
- Pricing source may trace to the parent agreement while payment obligation traces to the child.

### 3.8 Member Direct Purchase Under Group Eligibility

Scenario ID: `l2.member_direct_purchase_under_group_eligibility`

Definition: An individual member or user purchases directly because a group, employer, plan, or parent organization has made them eligible for a price, benefit, or product.

Required metadata:

- Eligibility source.
- Member identity.
- Individual payment responsibility.
- Payment method.
- Product entitlement.
- Member privacy/sensitivity classification.

Key rules:

- Member token may be the commercial payer even when eligibility derives from another organization.
- Contract/customer language must distinguish eligibility sponsor from paying member.

### 3.9 Free Tier to Paid Conversion

Scenario ID: `l2.free_tier_to_paid_conversion`

Definition: A free user, member, site, or organization converts to a paid product or service.

Required metadata:

- Free-tier entitlement.
- Conversion trigger.
- Converted product version.
- Pricing version.
- Payment method.
- Billing activation milestone.
- Revenue recognition start.

Key rules:

- Free-tier activity may contribute to customer/member journey but not paid revenue until payment obligation exists.

### 3.10 Usage-Based Billing Activation

Scenario ID: `l2.usage_based_billing_activation`

Definition: Billing amount depends on metered events, usage tiers, claims, consumption, transactions, API calls, seats, members, or other variable quantities.

Required metadata:

- Usage event definition.
- Meter source.
- Idempotency rule.
- Timestamp/window rule.
- Usage aggregation rule.
- Pricing tier.
- Invoice trigger.
- Revenue estimate/true-up rule.

Key rules:

- Usage-event controls must be deterministic and replayable.
- Billing and revenue recognition may require separate reconciliation paths.

### 3.11 Contract Amendment

Scenario ID: `l2.contract_amendment`

Definition: Existing contract is changed by amendment, addendum, order form, change order, or other legally effective modification.

Required metadata:

- Prior contract version.
- Amendment effective date.
- Changed terms.
- Changed products/prices/obligations.
- Whether modification is prospective or retrospective.
- Revenue/financial impact.

Key rules:

- Amendment must preserve lineage to prior contract obligation tokens.
- Amendment outputs should show before/after metadata mutations.

### 3.12 Product Migration

Scenario ID: `l2.product_migration`

Definition: Customer/member moves from one product, SKU, version, platform, package, or pricing model to another.

Required metadata:

- Source product/version.
- Target product/version.
- Migration date.
- Pricing bridge.
- Entitlement bridge.
- Billing transition.
- Revenue recognition transition.
- Customer/member impact.

Key rules:

- Migration should not be misclassified as churn plus new sale unless business rules explicitly require that view.
- Reporting outputs may need alternate classifications for operations, finance, and investor narratives.

## 4. Scenario Discovery Questions

Use these questions during client discovery:

1. Who can sign a payment obligation?
2. Who receives the invoice?
3. Who pays?
4. Who is entitled to use or receive the product?
5. Can the end user/member differ from the contracting customer?
6. Can pricing be negotiated by one party and consumed by another?
7. What event makes the contract active?
8. What event allows fulfillment to begin?
9. What event permits the first bill?
10. What event starts revenue recognition?
11. Can billing events differ from performance obligations?
12. Can there be usage, claims, member, site, or API-based variable consideration?
13. What output templates depend on this scenario?
14. Which system writes the current value?
15. Which system should write the future value?
16. Which fields are trusted, stale, duplicated, or manually adjusted?
17. What would break if this scenario were migrated to a unified hub?

## 5. Scenario Relevance Scoring

Starter score:

`relevance_score = client_evidence_score * 0.35 + revenue_materiality_score * 0.25 + operational_frequency_score * 0.20 + reporting_dependency_score * 0.10 + migration_risk_score * 0.10`

Where each component is scored 0-1.

Suggested interpretation:

| Score | Meaning |
|---:|---|
| 0.80-1.00 | Required in first business definition spec |
| 0.60-0.79 | Include in initial design, may defer deep flow |
| 0.40-0.59 | Track as candidate scenario |
| 0.00-0.39 | Park unless evidence grows |

## 6. Scenario Output Template

Every approved L2 scenario should produce:

- Scenario definition.
- Journey inheritance.
- Stage and gate flow.
- Metadata chip inventory.
- Business rule matrix.
- Data element dictionary.
- Current system of record map.
- DataBasin bridge target.
- Token updates.
- Output template impacts.
- Reconciliation confidence score.
- Open questions and decisions.
