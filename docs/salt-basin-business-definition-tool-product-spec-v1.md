# Salt Basin Business Definition Tool Product Spec v1

Version: 2026-07-09
Status: Foundational product design for real-time scenario mapping

## 1. Product Intent

The Salt Basin Business Definition Tool is a real-time business architecture workbench that helps a company synthesize its existing business scenarios, data models, pricing models, process variants, exception scenarios, and output templates into a governed Business Definition and Business Rule Design Spec.

The tool should be used at the beginning of every new client architecture engagement. It is not only a discovery tool. It becomes the client-specific operating ontology that future agents use to map legacy systems, identify relevant L2 scenarios, define metadata variations, produce outputs, and govern rule changes over time.

## 2. Core Methodology

The product uses a process ontology rather than a traditional process map.

| Level | Name | Definition | Example |
|---|---|---|---|
| L0 | Enterprise Domain | Broad operating domain. | Revenue Lifecycle, Customer Lifecycle, Member Lifecycle, Product Lifecycle, Financial Lifecycle |
| L1 | Journey | Foundational business journey token. | Revenue Lifecycle Journey |
| L2 | Scenario | Business scenario that changes metadata, rules, stages, outputs, or obligations. | New Sale, Existing Customer Change, Renewal, Parent Pricing Agreement |
| L3 | Journey Stage | Standard lifecycle phase inherited by scenarios. | Lead, Qualification, Opportunity, Proposal, Contract, Order, Fulfillment, Billing |
| L4 | Stage Gate | Governance checkpoint inside a stage. | Pricing Approved, Contract Executed, Provisioning Complete |
| L5 | Metadata Mutation | Change to metadata at a gate. | billing trigger added, discount approved, member entitlement created |
| L6 | Business Rule | Rule that governs behavior, validation, routing, calculation, or exception handling. | first bill requires billing activation trigger |
| L7 | Data Element | Field-level input, output, or derived value. | Account.BillingCity, QuoteLine.NetPrice, Contract.RenewalNoticeDate |

The core event chain is:

`Journey -> Scenario -> Stage -> Stage Gate -> Metadata Mutation -> Business Rule -> Data Element -> Token Update -> Audit Ledger`

## 3. Real-Time User Experience

The user should experience the tool as an editable scenario canvas with structured side panels.

### 3.1 Scenario Discovery Workspace

Purpose: ingest client context and propose relevant L2 scenarios.

Inputs:

- Business notes and interviews.
- Existing process documents.
- Salesforce, CPQ, CLM, billing, ERP, warehouse, and spreadsheet metadata.
- Proposal, contract, order, invoice, reporting, renewal, and finance output templates.
- Pricing models and exception logs.

Agent actions:

- Cluster discovered scenarios by L0 domain and L1 journey.
- Recommend relevant L2 scenario families.
- Identify missing customer, member, product, obligation, billing, and financial metadata.
- Propose inheritance from standard Salt Basin templates.
- Flag scenarios that require human confirmation.

User actions:

- Accept, reject, merge, split, or rename scenarios.
- Set scenario priority and client relevance.
- Add missing scenario variants.
- Attach evidence and owners.

### 3.2 L2 Scenario Mapper

Purpose: define the actual scenario and its inherited journey behavior.

Each L2 scenario should include:

- Scenario ID.
- Scenario title.
- Parent L0 domain.
- Parent L1 journey token.
- Scenario family.
- Trigger event.
- Entry criteria.
- Exit criteria.
- Happy path.
- Exceptions.
- Required parties.
- Required systems.
- Required products.
- Required pricing model.
- Required contract/billing/performance obligation rules.
- Output templates impacted.
- Token updates required.
- Confidence score.

### 3.3 Interactive Flow Builder

Purpose: map L3 stages and L4 gates for each L2 scenario.

Capabilities:

- Show inherited L1 stages as a default sequence.
- Let users enable, disable, reorder, or branch stages by scenario.
- Let users define gates inside each stage.
- Attach metadata mutations to each gate.
- Attach business rules and data elements to each mutation.
- Show synchronized Revenue, Customer, and Member journey outputs for every gate.
- Surface required write-back systems and DataBasin persistence targets.

The flow builder should not be only a diagram. Every node should be backed by structured definitions that can generate output specs, mappings, test cases, and reconciliation rules.

### 3.4 Metadata Chip Editor

Purpose: track how business metadata accumulates, transforms, splits, and combines.

Metadata chips are persistent typed metadata objects that travel through the journey.

Examples:

- Customer Identity Chip.
- Payer Identity Chip.
- Member Eligibility Chip.
- Product Version Chip.
- Pricing Version Chip.
- Contract Obligation Chip.
- Billing Trigger Chip.
- Performance Obligation Chip.
- Revenue Recognition Chip.
- Payment Credential Chip.
- Renewal Notice Chip.
- Support Entitlement Chip.
- Reconciliation Confidence Chip.

Each chip should track:

- Chip ID.
- Chip type.
- Owner.
- Source object.
- Source field(s).
- Current value/state.
- Journey stage.
- Stage gate.
- Parent chip(s).
- Child chip(s).
- Transformation rule.
- Validation status.
- Confidence score.
- Token links.

### 3.5 Business Rule Designer

Purpose: turn scenario behavior into explicit, reusable rules.

Rule categories:

- Eligibility rule.
- Customer/member/payer identity rule.
- Pricing rule.
- Discount rule.
- Approval rule.
- Contract obligation rule.
- Billing trigger rule.
- Performance obligation rule.
- Revenue recognition rule.
- Renewal rule.
- Payment rule.
- Entitlement rule.
- Reconciliation rule.
- Disclosure rule.
- Exception routing rule.

Every rule should include:

- Rule ID.
- Plain-language rule.
- Deterministic logic.
- Source fields.
- Target fields.
- Applicable scenario(s).
- Exceptions.
- Approval owner.
- Test cases.
- Confidence score.
- Version history.

## 4. Journey Token Design

Every L3 output must emit at least three synchronized journey perspectives.

| Perspective | Purpose | Example at Contract Signed |
|---|---|---|
| Revenue Lifecycle Token | Internal operational and financial lineage. | contract activated, order can be generated |
| Customer Journey Token | Buying/customer relationship lineage. | customer purchased solution |
| Member Journey Token | Entitled user/site/member lineage. | site/member coverage activated |

Supporting tokens may also be updated:

- Product Definition Token.
- Pricing Version Token.
- Contract Obligation Token.
- Financial Transaction Token.
- Resource Contribution Token.
- Confidence Reconciliation Token.

## 5. Product Definition Data Rod

The Product Definition Journey is a parallel L1 journey that defines what is commercially possible before a contract selects what is actually chosen.

Principle:

`Product defines allowable configuration. Contract selects configuration. Invoice executes billing. Revenue schedule recognizes performance.`

The Product Definition Data Rod should own:

- Product lifecycle and versions.
- Pricing version lineage.
- Allowed contract structures.
- Allowed billing dimensions.
- Allowed payment methods.
- Allowed collection methods.
- Allowed performance obligation templates.
- Allowed allocation methods.
- Revenue recognition trigger templates.
- Renewal behavior.
- Uplift rules.
- Notification defaults.
- Migration rules.
- Product compatibility rules.

## 6. Billing and Obligation Separation

Billing events and performance obligations must be independent objects. They may map one-to-one, one-to-many, many-to-one, or many-to-many.

Required bridge:

`Billing Event -> Allocation Matrix -> Performance Obligation -> Revenue Recognition Schedule`

Example:

An annual invoice may cover license, hosting, support, and training obligations. Three milestone invoices may support one implementation obligation. The tool must force the business to define that allocation instead of assuming invoice lines equal obligations.

## 7. Canonical Commercial Milestones

The tool should define commercial dates and triggers as first-class milestone objects.

| Milestone | Definition | Example Triggers |
|---|---|---|
| Commercial Activation | Event that makes the agreement legally effective. | customer signature, countersignature, effective date, board approval |
| Operational Activation | Event that allows fulfillment to begin. | payment received, provisioning approved, customer kickoff |
| Billing Activation | Event that permits the first bill. | contract active, provisioning complete, shipment, go-live, milestone accepted |
| Revenue Recognition Start | Event that starts recognition for one or more obligations. | service available, delivery, acceptance, usage begins, time elapsed |
| Renewal Notice Start | Event that starts renewal notice or cancellation windows. | contract start, contract end minus notice period, anniversary date |

Products define allowable triggers. Contracts select from those allowable triggers.

## 8. DataBasin Data Bridge

The tool should map traditional systems of record first, then define a go-forward bridge architecture.

### 8.1 Traditional Systems Map

For each process step and metadata mutation, capture:

- Current system of record.
- Current object/table.
- Current field.
- Current integration source.
- Current integration target.
- Current reporting dependency.
- Current manual spreadsheet dependency.
- Write-back requirement.
- Read-only requirement.
- Decommission/migration status.

### 8.2 DataBasin Reservoir Model

DataBasin acts as a temporary watershed/reservoir during transition.

It should:

- Persist historical data from existing systems.
- Normalize and cleanse metadata.
- Preserve source snapshots.
- Store scenario definitions and rule versions.
- Support agentic workflows through Slack, custom UI, API, and batch ingestion.
- Write back to existing systems during transition.
- Re-ingest new transactional and configured master data so no new activity is lost.
- Produce migration confidence, reporting confidence, and reconciliation disclosures.

The recommended migration posture is:

`Existing Systems -> DataBasin Bridge -> Agentic Definition Workflow -> Existing System Write-Back + DataBasin Persisted Truth -> Go-Forward Unified Hub`

## 9. Business Definition and Business Rule Design Spec Output

The tool should generate a client-specific spec with these sections:

1. Executive Summary.
2. L0 Domain Inventory.
3. L1 Journey Inventory.
4. Relevant L2 Scenario Catalog.
5. Scenario Priority and Relevance Scores.
6. L3 Process Flows by Scenario.
7. L4 Stage Gate Library.
8. L5 Metadata Mutation Catalog.
9. L6 Business Rule Matrix.
10. L7 Data Element Dictionary.
11. Metadata Chip Lineage.
12. Revenue, Customer, and Member Journey Interdependency Map.
13. Product Definition and Pricing Version Dependencies.
14. Billing Event to Performance Obligation Allocation Matrix.
15. Current System of Record Map.
16. DataBasin Bridge Map.
17. Write-Back and Persistence Requirements.
18. Output Template Requirements.
19. Reconciliation Confidence Scorecard.
20. Exception and Disclosure Register.
21. Open Decisions.
22. Approval and Version History.

## 10. First Build Slice

The first usable internal build should support:

- Create/edit L0 domains.
- Create/edit L1 journey tokens.
- Create/edit L2 scenarios.
- Add inherited L3 stages from a standard L1 template.
- Add L4 gates to stages.
- Add metadata chips to gates.
- Add business rules to chips/gates.
- Link data elements to existing Salesforce fields.
- Mark current system of record and future DataBasin persistence target.
- Generate a markdown Business Definition and Business Rule Design Spec.

The first scenario families should be:

- Brand New Sale.
- Existing Customer Change.
- Renewal.
- Expansion.
- Cancellation.
- Parent Pricing Agreement.
- Child Organization Purchase Under Parent Terms.
- Member Direct Purchase Under Group Eligibility.
- Free Tier to Paid Conversion.
- Usage-Based Billing Activation.
- Contract Amendment.
- Product Migration.
