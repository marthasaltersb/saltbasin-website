# SALT BASIN — JOURNEY SPECIFICATIONS
## ART-12 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003, SRC-005, SRC-007, SRC-008

---

## Purpose

This document provides the full per-rod journey specifications for the three canonical Salt Basin Journey Rods. Each specification defines: the entry condition, all states, state transitions, rod events, handovers, exit condition, interdependency rules with sibling rods, and the HOS™ Q2R overlay where applicable.

These specifications are the governing source for EIDOS L3 journey expansion. L2 scenarios map to exactly one parent rod. L3 expansions must conform to the state machine defined here.

> ⚠️ **Pending expansion (per SB-SR-001, DEC-003):** SRC-021 proposes a 4th rod (Data Channel / Thesis Rod) with its own state machine. Not yet specified here — awaiting Betsy's decision.

---

## 1. Journey Rod Interdependency Model

The three rods are **parallel and interdependent**. A state change on one rod creates an observable obligation or state change on one or more sibling rods.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROD 1 │ REVENUE LIFECYCLE ROD          (CH-REV)
      │ Lead → Opportunity → Proposal → Contract → Invoice → Cash → Recognized → Renewed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ↕ ContractSigned triggers CustomerActive
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROD 2 │ CUSTOMER JOURNEY ROD           (CH-CUST)
      │ FirstContact → Qualified → SolutionDefined → CustomerActive → ValueDelivered → Retained/Churned
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ↕ CustomerActive triggers MemberEnrollment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROD 3 │ MEMBER JOURNEY ROD             (CH-MEM)
      │ Enrollment → Onboarding → Activated → ServiceDelivered → ClaimGenerated → Retained/Departed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ↕ ClaimGenerated triggers PaymentReceived on Revenue Rod
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Cross-Rod Trigger Register

| Trigger Event | Source Rod | Target Rod | Effect on Target |
|---|---|---|---|
| ContractSigned | Revenue | Customer | CustomerActive state initiated |
| CustomerActive | Customer | Member | MemberEnrollment initiated |
| ClaimGenerated / ServiceDelivered | Member | Revenue | PaymentReceived / RevenueRecognized event |
| CustomerChurn | Customer | Revenue | RenewalLost event; ARR impact recorded |
| MemberDeparture | Member | Customer | Membership count decrement; retention metric updated |
| RenewalSigned | Revenue | Customer + Member | Continuation of existing rods; new term period initiated |

---

## 2. Revenue Lifecycle Rod Specification

**Rod ID:** ROD-REV-001 (canonical root)
**Channel:** CH-REV
**Parent Rod:** None (root)
**HOS™ Q2R Overlay:** All 11 Q2R steps map to states on this rod

### Entry Condition

A lead has been qualified as meeting the Ideal Customer Profile (ICP). Minimum required atoms at entry:
- ATM-CUST-003 (Customer Type) — ICP classification confirmed
- ATM-PRICE-012 (ACV) — probability-weighted ACV captured
- ATM-CUST-007 (Multi-Entity Flag) — assessed (TRUE or FALSE)
- ATM-PRICE-010 (Variable Consideration Method) — captured at pipeline entry (ASC 606 requirement)

### State Machine

```
[ENTRY]
LeadQualified
    │ EVT: LeadQualified
    │ Trigger: ICP criteria met; ACV estimated
    │ Handover: Marketing → Sales
    ▼
Opportunity
    │ EVT: OpportunityCreated
    │ Trigger: Formal opportunity record created in CRM
    │ Handover: SDR → Account Executive
    │ Required atoms: ATM-CUST-005 (NAICS), compliance flags assessed
    ▼
ProposalIssued
    │ EVT: ProposalIssued
    │ Trigger: Formal proposal / quote delivered to counterparty
    │ Handover: AE → Solutions Engineer (scoping)
    │ Required atoms: ATM-PRICE-001 through ATM-PRICE-013 (pricing atoms complete)
    ▼
Negotiation
    │ EVT: NegotiationInitiated (TR-003 Change tributary)
    │ Trigger: Counterparty returns redlines or requests modification
    │ Handover: AE + Legal → Counterparty
    │ Risk: Non-standard terms → ATM-CONT-013 (Non-Standard Term Flag) set TRUE
    ▼
ContractExecuted
    │ EVT: ContractSigned
    │ Trigger: Fully executed contract received with all signatures
    │ Handover: Legal/Finance → Delivery/CS
    │ *** IMMUTABLE RECORD CREATED — all downstream events trace to this ***
    │ Required atoms: ALL MOL-003 atoms; ATM-REV-001 (Recognition Method)
    │ Cross-rod trigger: → CustomerActive on ROD-CUST-{N}
    ▼
Onboarding
    │ EVT: OnboardingStarted
    │ Trigger: CS/Implementation engaged post-contract
    │ Handover: Sales/CS → Implementation
    │ Risk: Onboarding delay → revenue timing impact (MET-HOS-006: 87% miss forecast)
    ▼
Delivering
    │ EVT: DeliveryStarted
    │ Trigger: Service delivery / access provisioned
    │ Handover: Implementation → Ongoing CS
    │ Metering: Usage metering begins (CPT / API / seat counts)
    ▼
InvoiceIssued
    │ EVT: InvoiceIssued
    │ Trigger: Invoice generated per contract billing terms
    │ Handover: Delivery confirmation → Finance/AR
    │ Risk: MET-HOS-001 (39% of invoices contain errors)
    │ Required atoms: ATM-PRICE-001–013 validated against contract
    ▼
Collecting
    │ EVT: PaymentDue
    │ Trigger: Invoice due date reached
    │ Handover: AR → Cash application
    │ Risk: MET-HOS-003 (61% of late payments from admin/compliance issues)
    ▼
CashReceived
    │ EVT: PaymentReceived
    │ Trigger: Cash applied against invoice
    ▼
RevenueRecognized
    │ EVT: RevenueRecognized
    │ Trigger: Performance obligation satisfied per ASC 606
    │ Required atoms: ALL MOL-004 atoms
    │ Regulatory: ASC 606; SOX 404(b)
    ▼
[RENEWAL BRANCH]
RenewalInitiated ─────────────────────────────────────────────────►[EXIT: RenewalSigned → new contract term]
    │                                                               [EXIT: RenewalLost → ChurnRecorded]
    │ EVT: RenewalInitiated
    │ Trigger: CS/AE begins renewal motion
    │ Handover: CS → AE
    │ Anchor: Renewal contract must link to originating master contract
[EXIT: RevenueRecognitionComplete]
```

### Exit Conditions

| Exit Type | Condition | Next State |
|---|---|---|
| Successful close | Revenue fully recognized; renewal initiated or contract expired naturally | RenewalInitiated → new rod term |
| Renewal won | New contract executed for next term | ROD-REV-001 continues with new term |
| Churn | Customer does not renew; ChurnRecorded event | Rod archived; ARR impact recorded |
| Contract terminated early | Early termination clause invoked | Rod exits to TerminationRecorded; partial recognition calculated |

### Exception States

| Exception | Trigger | Required Action |
|---|---|---|
| InvoiceDisputed | Customer disputes invoice content | Pre-bill review process initiated; rod held in Collecting state |
| RecognitionException | ASC 606 criteria not met at period close | Manual review; rod held in RevenueRecognized-Pending |
| ContractModification | Post-execution contract change | New ATM-CONT-002 (version increment); modification accounting applied per ATM-REV-011 |

---

## 3. Customer Journey Rod Specification

**Rod ID:** ROD-CUST-{N} (one per customer entity)
**Channel:** CH-CUST
**Parent Rod:** ROD-REV-{N} (parent Revenue Rod)

### Entry Condition

First qualified contact with a counterparty that maps to an open Revenue Lifecycle Rod. Minimum required atoms at entry:
- ATM-CUST-001 (Bill-To Party) — counterparty identified
- ATM-CUST-003 (Customer Type) — classification applied
- ATM-CUST-009 (Counterparty ID) — internal identity key assigned

### State Machine

```
[ENTRY]
FirstContact
    │ EVT: FirstContact
    │ Trigger: Initial outreach or inbound engagement with qualified counterparty
    │ Handover: Marketing / SDR → AE
    ▼
Qualified
    │ EVT: CustomerQualified
    │ Trigger: Counterparty confirmed as matching ICP
    │ Required: ATM-CUST-003, ATM-CUST-007 (multi-entity assessment)
    ▼
SolutionDefined
    │ EVT: SolutionScopeAgreed
    │ Trigger: Solution design and scope agreed with counterparty
    │ Handover: AE → Solutions Engineer / CS
    ▼
[CROSS-ROD GATE: ContractSigned on Revenue Rod]
    │ This state cannot advance until EVT: ContractSigned fires on parent Revenue Rod
    │ Tributary: TR-{N} (Relationship — Customer to Revenue Rod)
    ▼
CustomerActive
    │ EVT: CustomerActive
    │ Trigger: Contract executed on parent Revenue Rod
    │ *** Primary cross-rod trigger state ***
    │ Cross-rod trigger: → MemberEnrollment on ROD-MEM-{N}
    ▼
Onboarding
    │ EVT: CustomerOnboardingStarted
    │ Trigger: CS/Implementation engaged
    ▼
ValueDelivered
    │ EVT: ValueDelivered
    │ Trigger: First delivery milestone achieved; performance obligation fulfilled
    │ Handover: Implementation → Ongoing CS
    ▼
Adopted
    │ EVT: AdoptionConfirmed
    │ Trigger: Customer actively using product at expected engagement level
    ▼
[RENEWAL BRANCH]
RenewalEligible ──────────────────────────────────────────────────►[EXIT: Retained → new term]
    │                                                               [EXIT: Churned → ChurnRecorded]
    │ EVT: RenewalEligible
    │ Trigger: Renewal window opens per contract notice period
    │ Handover: CS → AE
[EXIT: CustomerRetained / CustomerChurned]
```

### Exit Conditions

| Exit Type | Condition |
|---|---|
| Retained | Renewal executed on parent Revenue Rod; Customer Rod continues into new term |
| Churned | Non-renewal; EVT: CustomerChurn fires; ARR impact recorded on Revenue Rod |
| Migrated | Customer transferred to different product/entity; new Customer Rod created |

### Exception States

| Exception | Trigger |
|---|---|
| ContactLost | No response from counterparty for >60 days during active state |
| DisputeOpen | Commercial dispute under resolution; value delivery paused |
| ScopeExpansion | Additional services added; contract modification initiated on Revenue Rod |

---

## 4. Member Journey Rod Specification

**Rod ID:** ROD-MEM-{N} (one per member entity or cohort)
**Channel:** CH-MEM
**Parent Rod:** ROD-CUST-{N} (parent Customer Rod)

### Entry Condition

A member entity (organization or individual) has been associated with an active Customer Rod. Minimum required atoms at entry:
- ATM-CUST-002 (Ship-To Party) — service delivery recipient identified
- ATM-CUST-004 (District Code or equivalent) — geographic/organizational ID
- ATM-CUST-009 (Counterparty ID) — internal identity key assigned
- Cross-rod prerequisite: Parent Customer Rod must be in CustomerActive state

### State Machine

```
[ENTRY — triggered by CustomerActive on parent Customer Rod]
Enrollment
    │ EVT: MemberEnrolled
    │ Trigger: Member entity confirmed as participant in the program
    │ Required: ATM-CUST-002, ATM-CUST-004
    ▼
Onboarding
    │ EVT: MemberOnboardingStarted
    │ Trigger: Onboarding process initiated for this member
    ▼
Activated
    │ EVT: MemberActivated
    │ Trigger: Member has completed onboarding and is receiving service
    ▼
ServiceDelivery (recurring state)
    │ EVT: ServiceDelivered
    │ Trigger: Each service event (visit / claim / API call / interaction)
    │ Metering: Usage data captured per ATM-PRICE-003 (CPT rate) or equivalent
    │ Each ServiceDelivered event may trigger:
    │   → ClaimGenerated (healthcare scenario)
    │   → UsageRecorded (SaaS scenario)
    ▼
ClaimGenerated / UsageRecorded
    │ EVT: ClaimGenerated or UsageRecorded
    │ Trigger: Service delivery produces a billable event
    │ Cross-rod trigger: → PaymentReceived / InvoiceAdjusted on Revenue Rod
    ▼
OutcomeRecorded
    │ EVT: OutcomeRecorded
    │ Trigger: Defined program outcome achieved (student health outcome / SaaS adoption metric)
    ▼
[RENEWAL / RETENTION BRANCH]
RetentionEligible ────────────────────────────────────────────────►[EXIT: MemberRetained → new term]
    │                                                               [EXIT: MemberDeparture → DepartureRecorded]
    │ EVT: RetentionWindowOpen
    │ Trigger: Renewal window opens; member re-enrollment evaluated
[EXIT: MemberRetained / MemberDeparture]
```

### Exit Conditions

| Exit Type | Condition |
|---|---|
| Retained | Member re-enrolled for subsequent term; Rod continues |
| Departed | Member exits program; DepartureRecorded; membership count decremented on Customer Rod |
| Graduated | Member completes a defined program (e.g., student cohort completes school year) |
| Transferred | Member moves to different program/entity; new Member Rod created |

### Exception States

| Exception | Trigger |
|---|---|
| ClaimDisputed | Service claim disputed; resolution required before PaymentReceived |
| ServiceSuspended | Member access suspended; service delivery paused |
| EnrollmentFailed | Member onboarding could not be completed; rod exits to EnrollmentFailed |

---

## 5. Healthcare Scenario — Worked Rod Interdependency Example

This is the canonical worked example demonstrating all three rods in operation simultaneously. Source: SRC-003.

### Scenario Setup

| Role | Entity | Rod |
|---|---|---|
| Revenue deal driver | State Department of Education | ROD-REV-001 |
| Revenue financing party | State Health Plan | ROD-CUST-001 |
| Deal co-buyer | State Department of Education | ROD-CUST-002 |
| Member organization | FL School District 014 | ROD-MEM-001 |
| End users | Students | ROD-MEM-002 |

### Event Sequence with Cross-Rod Triggers

| Step | Event | Rod | Cross-Rod Effect |
|---|---|---|---|
| 1 | LeadQualified | ROD-REV-001 | — |
| 2 | FirstContact | ROD-CUST-001 + ROD-CUST-002 | Parallel customer rods open |
| 3 | SolutionScopeAgreed | ROD-CUST-001 + ROD-CUST-002 | — |
| 4 | ContractSigned | ROD-REV-001 | → CustomerActive on ROD-CUST-001 + ROD-CUST-002 |
| 5 | CustomerActive | ROD-CUST-001 | → MemberEnrolled on ROD-MEM-001 (Schools) |
| 6 | MemberEnrolled | ROD-MEM-001 | → MemberEnrolled on ROD-MEM-002 (Students) |
| 7 | MemberActivated | ROD-MEM-001 + ROD-MEM-002 | — |
| 8 | ServiceDelivered (student visit) | ROD-MEM-002 | → ClaimGenerated on ROD-MEM-001 |
| 9 | ClaimGenerated | ROD-MEM-001 | → InvoiceIssued or PaymentReceived on ROD-REV-001 |
| 10 | PaymentReceived | ROD-REV-001 | → RevenueRecognized event scheduled |
| 11 | RevenueRecognized | ROD-REV-001 | — |
| 12 | RenewalInitiated | ROD-REV-001 | → RetentionEligible on ROD-CUST-001/002 + ROD-MEM-001/002 |

### Tributary Map for This Scenario

```
ROD-CUST-001 (Health Plan)
       │
       │ TR-001: Relationship / Funding
       ▼
ROD-MEM-001 (Schools)
       │
       │ (parent-child, not tributary)
       ▼
ROD-MEM-002 (Students)

ROD-CUST-002 (Education)
       │
       │ TR-002: Relationship / Sponsor
       ▼
ROD-MEM-001 (Schools)

ROD-REV-001 (Contract/Proposal states)
       │
       │ TR-003: Change / Negotiation
       ▼
ROD-REV-001 (Contract state)
```

---

## 6. Journey Specification Governance Rules

1. **Entry conditions are requirements, not suggestions.** A rod may not advance to its first active state without all minimum required atoms present.
2. **Cross-rod triggers are mandatory.** A state change that has a documented cross-rod trigger must fire that trigger — it is not optional.
3. **Rod state machine is exhaustive.** Every possible state transition must be documented. An undocumented state transition is a governance exception.
4. **Exception states must be handled.** Rods in exception states must either resolve to a valid state or exit. Rods may not remain permanently in exception.
5. **Renewal continuity.** Renewal events link the new contract term to the originating master record — history is preserved; the rod is not restarted from scratch.
6. **Churn is permanent until reversal.** A ChurnRecorded exit state closes the rod. A win-back creates a new rod — it does not reopen the closed rod.
7. **Every L3 expansion must map to this specification.** L3 scenarios that introduce states not in this model must be reviewed as potential additions to the specification — not treated as ad-hoc exceptions.
