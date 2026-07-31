# SALT BASIN — JOURNEY ROD & SCENARIO MODEL
## ART-11 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003, SRC-005, SRC-007, SRC-008

---

## Purpose

This document specifies the structure, relationships, and governance rules for Salt Basin's Journey Rod system — the core architectural framework that sequences business events from entry to outcome across three parallel interdependent rods. It also describes the EIDOS scenario repository structure and the L2/L3 scenario model.

> ⚠️ **Pending expansion (per SB-SR-001, DEC-003):** SRC-021 (LoneTree PDF) proposes a 4th rod — the Data Channel Rod (Thesis): Thesis Defined → Initiative Planned → Changes Implemented → Movement Classified → Attribution Reconciled → Evidence Accumulated → Exit Defense. Not yet incorporated — awaiting Betsy's decision.

---

## 1. Journey Rod System Overview

### Canonical Definition

A **Journey Rod** is a named, sequenced path within a Channel that carries lineage of events from a defined entry state to a defined exit state. Rods are never standalone — they exist in parallel interdependence with sibling rods across channels.

### The Three Canonical Journey Rods

These three rods are **parallel and interdependent**. A state change on one rod drives observable state changes on the others.

```
REVENUE LIFECYCLE ROD          CUSTOMER JOURNEY ROD         MEMBER JOURNEY ROD
(Commercial Channel)           (Customer Channel)            (Member Channel)
─────────────────────          ───────────────────           ──────────────────
Lead Qualified                 First Contact                 Enrollment
     │                              │                             │
Opportunity                    Qualification                 Onboarding
     │                              │                             │
Proposal                       Solution Design               Activation
     │                              │                             │
Contract Signed ◄══════════════ Customer Active ◄══════════ Member Active
     │                              │                             │
Onboarding                     Delivery / Value               Service Delivery
     │                              │                             │
Invoice Issued                 Adoption                      Claim / Visit
     │                              │                             │
Cash Collected                 Renewal / Expansion           Outcome
     │                              │                             │
Recognition Closed             Retention / Churn             Retention / Departure
```

**Tributary connections between rods (examples from SRC-003):**

| Tributary ID | Type | From | To | Purpose |
|---|---|---|---|---|
| TR-001 | Relationship | Health Plan (Revenue Rod) | Schools (Member Rod) | Funding |
| TR-002 | Relationship | Education (Customer Rod) | Schools (Member Rod) | Sponsor |
| TR-003 | Change | Proposal (Revenue Rod) | Contract (Revenue Rod) | Negotiation state transition |

---

## 2. Rod Structure Governance

### Rod ID Schema

```
ROD-{CHANNEL_CODE}-{SEQUENCE}

Channel codes:
  REV    = Revenue (Commercial)
  CUST   = Customer (Lifecycle)
  MEM    = Member (Organizations/Students)
  FIN    = Financial (Accounting)
```

### Canonical Rod Register (Healthcare Scenario — from SRC-003)

| Rod ID | Channel | Name | Parent Rod | Status |
|---|---|---|---|---|
| ROD-REV-001 | Revenue | New Sale | — (root) | Canonical |
| ROD-CUST-001 | Customer | State Health Plan | ROD-REV-001 | Canonical |
| ROD-CUST-002 | Customer | State Department of Education | ROD-REV-001 | Canonical |
| ROD-MEM-001 | Member | Schools | ROD-CUST-001 | Canonical |
| ROD-MEM-002 | Member | Students | ROD-MEM-001 | Canonical |

### Rod Lineage Rules
1. Every rod must have a valid parent rod or be explicitly designated as a root rod
2. Orphan rods are a data model violation — validation checklist item: "No orphan rods"
3. Every rod transition must be traceable to a governing event
4. Rod state (entry / in-progress / exit / exception) is a first-class attribute
5. Temporal state must be preserved: when did the rod enter this state? What triggered it? What was the previous state?

---

## 3. Tributary Governance

### Canonical Definition

A **Tributary** is a lateral connection between rods or within a rod. Two valid tributary types:

| Type | Description | Example |
|---|---|---|
| Relationship | A persistent cross-rod dependency (funding, sponsorship, ownership) | Health Plan → Schools: Funding |
| Change | A state transition within a rod (proposal → contract negotiation) | Proposal → Contract: Negotiation |

### Tributary vs. Other Terms (Resolved — CONF-010)

| Term | Context Where Correct | Context Where Wrong |
|---|---|---|
| Tributary | Lateral connection between rods in the Salt Basin data model | Do NOT use for organizational hierarchy branches |
| Branch | Organizational splitting in entity structure (Net Works / Creative Works are Tier 3 "branches") | Do NOT use as a synonym for tributary in the data model |
| Confluence | The point where tributaries converge / where journey outcomes merge | Do NOT map to "merge" unless convergence semantics are accurate |

---

## 4. EIDOS Scenario Repository

### What EIDOS Is

EIDOS is the Salt Basin scenario execution framework — it houses the L2 and L3 scenario definitions that govern how journey rods traverse from beginning state to ending state.

**Current state (from SRC-005):** 500+ L2 scenarios seeded. File: `Salt_Basin_EIDOS_L2_Scenario_Repository_Initial_500.xlsx`.

### Scenario Level Definitions

| Level | Name | Description |
|---|---|---|
| L1 | Journey | The top-level rod category (Revenue Lifecycle, Customer Journey, Member Journey) |
| L2 | Scenario | A named journey with defined beginning state, ending state, complexity, and primary actors |
| L3 | End-to-End Journey | The fully expanded, step-by-step traversal of one L2 scenario with all decision points, handovers, and outcomes |

### L2 Scenario Schema

Each L2 scenario record contains:

| Field | Description | Governance Rule |
|---|---|---|
| Scenario_ID | Permanent unique identifier (e.g., L2-0001) | NEVER repurpose — once assigned, the ID belongs to that scenario permanently |
| Journey | Parent L1 (Revenue Lifecycle / Customer Journey / Member Journey) | Must map to a canonical journey rod |
| Domain | Sub-domain (Commercial / Healthcare / Financial / etc.) | Must match a governed domain classification |
| L2 Scenario Name | Human-readable scenario label | Should be unambiguous at the L2 level |
| Beginning State | The entry condition for this scenario | Must be verifiable (not aspirational) |
| Ending State | The defined completion condition | Must be measurable |
| Typical Complexity | Complexity tier (Configurable / Fixed / Complex) | Drives implementation estimation |
| Primary Actors | Who drives this scenario | Maps to agent scope |
| Notes | Expansion instructions and L3 build guidance | Usually "Expand into one complete L3 end-to-end journey" |

### L2 Scenario Sample (from SRC-005 — Revenue Lifecycle / Commercial)

| Scenario_ID | Journey | Domain | L2 Scenario Name | Notes |
|---|---|---|---|---|
| L2-0001 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale | Expand into one complete L3 end-to-end journey |
| L2-0002 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — Standard | Sub-variant of L2-0001 |
| L2-0003 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — High Touch | Sub-variant of L2-0001 |
| L2-0004 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — Low Touch | Sub-variant of L2-0001 |
| L2-0005 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — Enterprise | Sub-variant |
| L2-0006 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — SMB | Sub-variant |
| L2-0007 | Revenue Lifecycle | Commercial | Brand New Enterprise Sale — Regulated | Sub-variant |
| L2-0008 | Revenue Lifecycle | Commercial | Brand New SMB Sale | Separate L2 parent |
| L2-0015 | Revenue Lifecycle | Commercial | Brand New Mid-Market Sale | Separate L2 parent |
| L2-0022 | Revenue Lifecycle | Commercial | Self-Service Purchase | Distinct motion |
| … | … | … | … | 500+ total seeded |

---

## 5. HOS™ Revenue Lifecycle Rod — Q2R Implementation (11 Steps)

The HOS™ Q2R process is the canonical implementation of the Revenue Lifecycle Journey Rod for PE-backed mid-market SaaS. All 11 steps map to a handover, a set of key benchmarks, required contract metadata, ARR impact, handover risk, engine solution, and regulatory standard.

### Q2R Step Map

```
STEP 1         STEP 2         STEP 3            STEP 4       STEP 5
Prospect &     Qualify &      Solution          Negotiate    Contract
Pipeline  ──►  Discovery ──►  Design & Scope ──► ─────────►  Execute
   │               │               │                             │
(Mktg→Sales) (SDR→AE)       (AE→Solutions Eng)            (Legal→Finance)


STEP 6         STEP 7         STEP 8       STEP 9      STEP 10     STEP 11
Onboard ──►  Deliver ──►   Bill ──►    Collect ──►  Rev Close ──►  Renew
   │              │            │            │             │
(CS→Delivery) (Delivery)  (Finance→AR) (AR→Cash)   (Finance→     (CS→AE)
                                                     Accounting)
```

### Step Specifications (condensed — full detail in SRC-008)

**Step 1 — Prospect & Pipeline**
- Handover: Marketing → Sales
- Key risk: Incomplete ICP data → wrong sales motion. Multi-entity deal not flagged → master contract never initiated.
- Engine: AI pipeline risk scoring; variable consideration method captured at pipeline stage
- Regulatory: ASC 606 §606-10-25-1 (probability of collection); SOX (pipeline data integrity)
- Contract fields required: ICP classification, probability-weighted ACV, expected close date, multi-entity flag, variable consideration method

**Step 2 — Qualify & Discovery**
- Handover: SDR → Account Executive
- Key risk: Security requirements not surfaced → close stalls 2–4 weeks. Multi-entity scope not discovered → modification accounting triggered.
- Engine: Automated compliance package generated when SOC 2/ISO/GDPR flag raised; discovery completeness score gates deal advance
- Regulatory: SOC 2 Type II CC6.1/CC9.2; ASC 606 §606-10-25-1(e) (collectability)
- Benchmark: SOC 2 review adds 2–4 weeks (Optifai 2025); CFO involvement in purchases up 40%

**Step 3 — Solution Design & Scope**
- Handover: AE → Solutions Engineer / Pre-Sales
- Key risk: Custom pricing not documented → contract executed without billable parameters → systematic billing errors from Day 1.
- Engine: Machine-readable contract term translation; CPQ integration with structured pricing blocks

**Step 4 — Negotiate**
- Handover: AE + Legal → Counterparty
- Key risk: Late redlines introduce non-standard terms → downstream billing/recognition exceptions
- Engine: Redline tracking with contract risk scoring; non-standard term flagging

**Step 5 — Contract Execute**
- Handover: Legal/Finance → Customer (executed signature)
- The executed contract is the **single source of truth** every downstream event traces back to
- Engine: Immutable contract record creation; recognition schedule auto-generation; billing rule extraction
- Regulatory: ASC 606 §606-10-25 (five-step model); SOX 404(b) (contract approval controls)

**Step 6 — Onboard**
- Handover: Sales/CS → Delivery/Implementation
- Key risk: Onboarding not tied to contract terms → misaligned SLA tracking → disputed performance obligations
- Benchmark: 87% of enterprises miss forecasts partly due to onboarding delays affecting revenue timing

**Step 7 — Deliver**
- Handover: Implementation → Ongoing CS/Delivery
- Engine: Usage metering begins; CPT/visit/API logs normalized against contract terms

**Step 8 — Bill**
- Handover: Delivery confirmation → Finance/AR
- Key risk: 39% of enterprise invoices contain errors (RecVue/IOFM 2025). 3–7% revenue leakage from misapplied tiers.
- Engine: Unified metering layer; machine-readable tier/overage logic; real-time customer usage dashboard
- Regulatory: SOX 404(b) (billing system controls); ASC 606 §606-10-32-11 (variable consideration)

**Step 9 — Collect**
- Handover: AR → Cash application
- Key risk: 61% of late payments from compliance/admin issues; 9% written off as uncollectible
- Benchmark: Pre-bill review reduces post-invoice disputes by 85%
- Engine: Pre-bill notification system; dispute workflow with contract lineage

**Step 10 — Rev Close**
- Handover: AR/Cash → Accounting/Rev Rec
- Key risk: Manual RevRec = SOX material weakness. 5–7% of public companies report material weaknesses (RevRec is #1 cited area).
- Engine: ASC 606 recognition schedule execution; performance obligation tracking; contract modification accounting
- Regulatory: ASC 606 (five-step), SOX 404(b), PCAOB

**Step 11 — Renew**
- Handover: CS → AE (renewal motion)
- Key risk: Renewal not anchored to original contract → new deal treated as greenfield → historical ARR context lost
- Engine: Renewal contract linked to originating master record; ARR delta calculation; expansion/contraction tracking

---

## 6. Healthcare Scenario (Canonical Example — from SRC-003)

This is the primary worked canonical scenario demonstrating rod relationships.

**Scenario context:** State health plan finances student health coverage across school districts. Two revenue buyers (Health Plan + Department of Education) drive a cascading member structure.

| Object Role | Example | Rod |
|---|---|---|
| Deal Driver | State Department of Education | Revenue Rod |
| Financing Party | State Health Plan | Revenue Rod |
| Schools | District schools (e.g., FL-D014) | Member Rod |
| End Users | Students | Member Rod |

**Rod relationships:**
- ROD-REV-001 (New Sale) anchors the commercial motion
- ROD-CUST-001 (State Health Plan) and ROD-CUST-002 (State Dept of Education) are parallel customer rods both reporting to the Revenue Rod
- ROD-MEM-001 (Schools) reports to ROD-CUST-001 — the Health Plan funds the school coverage
- ROD-MEM-002 (Students) reports to ROD-MEM-001 — students are the end members served within schools
- TR-001 (Relationship): Health Plan → Schools (Funding tributary)
- TR-002 (Relationship): Education → Schools (Sponsor tributary)

**Atom examples in this scenario:**

| Atom | Molecule | Value in Scenario |
|---|---|---|
| Bill-To Party | Customer Identity | State Health Plan |
| District Code | Customer Identity | FL-D014 |
| Subscription Fee | Pricing | $25,000/month |
| Visit CPT Rate | Pricing | 85 (CPT code rate) |

**Event sequence:**

| Event | Outcome | Rod Affected |
|---|---|---|
| LeadQualified | Opportunity created | Revenue Rod |
| ContractSigned | Customer Active status | Revenue + Customer Rod |
| VisitCompleted | Claim generated | Member Rod |
| ClaimPaid | Cash recorded | Revenue Rod |

---

## 7. Scenario Governance Rules

1. **Scenario_ID permanence:** Once assigned, a Scenario_ID belongs to that scenario in perpetuity. Never repurpose.
2. **Beginning and ending states** must be verifiable real-world conditions, not aspirational descriptions.
3. **Every L2 scenario** must map to exactly one parent Journey Rod.
4. **L3 expansion** is required before a scenario is considered fully defined.
5. **Temporal applicability:** Scenarios should note if they are time-bounded (e.g., specific to a regulatory environment, product version, or market segment).
6. **Lineage:** Every L3 step must trace back to the L2 scenario and the governing Journey Rod.
7. **Actor mapping:** Primary actors in each scenario must map to agents (Layer 9) or human roles with defined permissions.
