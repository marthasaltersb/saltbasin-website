# SALT BASIN — CANONICAL DATA MODEL
## ART-08 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003, SRC-005, SRC-007

---

## Purpose

This document specifies the canonical object model for the Salt Basin data architecture. It defines every object type, its governance rules, its relationships to other objects, and the visual semantics assigned to it. All product implementations must conform to this model — the data model is the authority; the UI renders governed state derived from it.

---

## 1. Object Hierarchy

```
Enterprise
└── Channel  (CH-REV / CH-CUST / CH-MEM / CH-FIN)
    └── Channel Rod  (Journey Rod — named path within a Channel)
        ├── Rod State  (entry / in-progress / exit / exception)
        ├── Rod Event  (timestamped state-change trigger)
        └── Tributary  (lateral connection — Relationship or Change type)
            └── Confluence  (convergence point where tributaries meet)

Molecule  (governed grouping — 4 canonical)
└── Atom  (bounded governed metadata/evidence unit)
    └── Magnetic Field  (convergence rule pulling atoms into molecule)
```

Every object at every level carries: `object_id`, `created_at`, `lineage_source`, `lineage_event_id`, `version`, `status`.

> ⚠️ **Pending expansion (per SB-SR-001, DEC-005/DEC-006):** SRC-021 (LoneTree PDF) proposes a 5-level hierarchy (Atom → Molecule → Cluster → Rod → Orbit) and a 6-molecule capability set. Not yet incorporated — awaiting Betsy's decision before this model is revised.

---

## 2. Channel

### Canonical Definition

A **Channel** is the highest-level classification of a journey dimension. It is the parent container for all Channel Rods within that dimension.

### Canonical Channel Register

| Channel ID | Channel Name | Description | Color Semantic |
|---|---|---|---|
| CH-REV | Revenue (Commercial) | Commercial events from lead to renewal | — |
| CH-CUST | Customer | Customer lifecycle from first contact to retention | — |
| CH-MEM | Member | Member/end-user lifecycle from enrollment to outcome | — |
| CH-FIN | Financial | Accounting, recognition, and treasury events | — |

### Governance Rules

1. Channels are fixed — new channels may only be added by explicit enterprise architecture decision.
2. A Channel Rod must belong to exactly one Channel.
3. Channel must not be confused with **SaltChannels** (the product) — these are different namespaces.

---

## 3. Channel Rod (Journey Rod)

### Canonical Definition

A **Channel Rod** (also called a Journey Rod when referring to the three canonical named journeys) is a named, sequenced path within a Channel that carries the lineage of events from a defined entry state to a defined exit state.

Rods are never standalone — they exist in parallel interdependence with sibling rods across channels.

### Rod ID Schema

```
ROD-{CHANNEL_CODE}-{SEQUENCE}

Examples:
  ROD-REV-001     Revenue Lifecycle Rod — New Sale
  ROD-CUST-001    Customer Journey Rod — State Health Plan
  ROD-MEM-001     Member Journey Rod — Schools
```

### Canonical Rod Register

| Rod ID | Channel | Name | Parent Rod | Status |
|---|---|---|---|---|
| ROD-REV-001 | CH-REV | Revenue Lifecycle — New Sale | — (root) | Canonical |
| ROD-CUST-001 | CH-CUST | Customer Journey — State Health Plan | ROD-REV-001 | Canonical |
| ROD-CUST-002 | CH-CUST | Customer Journey — State Dept of Education | ROD-REV-001 | Canonical |
| ROD-MEM-001 | CH-MEM | Member Journey — Schools | ROD-CUST-001 | Canonical |
| ROD-MEM-002 | CH-MEM | Member Journey — Students | ROD-MEM-001 | Canonical |

### Rod Attributes (Required on Every Rod)

```
Rod:
  rod_id:           ROD-{CHANNEL_CODE}-{SEQUENCE}
  name:             [Human-readable name]
  channel:          CH-REV | CH-CUST | CH-MEM | CH-FIN
  parent_rod_id:    [Parent rod ID, or null if root]
  entry_state:      [Verifiable condition that initiates this rod]
  exit_state:       [Measurable condition that closes this rod]
  current_state:    entry | in_progress | exit | exception
  state_entered_at: [Timestamp]
  triggering_event: [Event ID that caused last state change]
  lineage_source:   [SRC reference or contract_id]
  scenario_id:      [EIDOS Scenario_ID if applicable]
  status:           canonical | active | archived | exception
```

### Rod Lineage Rules

1. Every rod must have a valid parent rod or be explicitly designated as a root rod.
2. Orphan rods are a data model violation — validation must reject any rod without a valid parent or root designation.
3. Every rod state transition must be traceable to a governing event.
4. Rod state (entry / in-progress / exit / exception) is a first-class attribute — it is not derivable from the absence of other attributes.
5. Temporal state must be preserved: when did the rod enter this state, what triggered it, what was the previous state.
6. Rod IDs are permanent — never repurposed, never reused.

### Visual Semantic

Path color is assigned by channel (see Section 9 — Visual Semantics). Rod paths visualize as directional flows within the Monetary River System™ graphic metaphor.

---

## 4. Rod Event

### Canonical Definition

A **Rod Event** is a timestamped, sourced trigger that causes a state change on a Channel Rod.

### Event Attributes

```
RodEvent:
  event_id:         EVT-{ROD_ID}-{SEQUENCE}
  rod_id:           [Parent rod]
  event_type:       [see Event Type Register below]
  previous_state:   [Rod state before this event]
  new_state:        [Rod state after this event]
  timestamp:        [Exact UTC timestamp]
  source_system:    [Originating system — e.g., Salesforce, Zuora, manual]
  source_record_id: [ID of originating record in source system]
  contract_id:      [Originating contract — always required if contract exists]
  agent_id:         [Agent that processed this event, if applicable]
  user_id:          [User who authorized, if applicable]
  lineage_hash:     [SHA-256 of event payload for immutability verification]
```

### Canonical Event Type Register

| Event Type | Channel | Description |
|---|---|---|
| LeadQualified | CH-REV | Pipeline entry — ICP-qualified lead |
| OpportunityCreated | CH-REV | Formal opportunity opened |
| ProposalIssued | CH-REV | Proposal delivered to counterparty |
| ContractSigned | CH-REV | Executed contract received |
| InvoiceIssued | CH-REV | Invoice generated and sent |
| PaymentReceived | CH-REV | Cash received |
| RevenueRecognized | CH-REV | ASC 606 recognition event |
| RenewalInitiated | CH-REV | Renewal motion started |
| FirstContact | CH-CUST | Initial customer engagement |
| CustomerActive | CH-CUST | Customer onboarding complete — active status |
| ValueDelivered | CH-CUST | Performance obligation fulfilled |
| CustomerChurn | CH-CUST | Customer exits — churn event |
| MemberEnrolled | CH-MEM | Member enrollment confirmed |
| MemberActivated | CH-MEM | Member reached active service state |
| ServiceDelivered | CH-MEM | Service event (visit / claim / interaction) |
| MemberDeparture | CH-MEM | Member exits program |
| ClaimSubmitted | CH-MEM | Financial claim generated from member event |
| ClaimPaid | CH-MEM | Claim settled — triggers cash event on CH-REV |

---

## 5. Tributary

### Canonical Definition

A **Tributary** is a lateral connection between rods — either a persistent cross-rod dependency (Relationship type) or a state transition within a rod (Change type).

Tributaries are NOT organizational hierarchy branches. Do not use "branch" as a synonym for tributary in the data model.

### Tributary ID Schema

```
TR-{SEQUENCE}

Examples:
  TR-001   Health Plan → Schools (Relationship — Funding)
  TR-002   Education → Schools (Relationship — Sponsor)
  TR-003   Proposal → Contract (Change — Negotiation)
```

### Tributary Attributes

```
Tributary:
  tributary_id:     TR-{SEQUENCE}
  type:             Relationship | Change
  from_rod_id:      [Source rod]
  from_state:       [State on source rod at connection point]
  to_rod_id:        [Target rod, or same rod for Change type]
  to_state:         [State on target rod at connection point]
  label:            [Human-readable relationship label]
  created_at:       [Timestamp]
  governing_event:  [EVT-ID that established this tributary]
  status:           active | resolved | exception
```

### Canonical Tributary Register (from SRC-003 — Healthcare Scenario)

| Tributary ID | Type | From | To | Label |
|---|---|---|---|---|
| TR-001 | Relationship | ROD-CUST-001 (Health Plan) | ROD-MEM-001 (Schools) | Funding |
| TR-002 | Relationship | ROD-CUST-002 (Education) | ROD-MEM-001 (Schools) | Sponsor |
| TR-003 | Change | ROD-REV-001 (Proposal state) | ROD-REV-001 (Contract state) | Negotiation |

### Tributary Governance Rules

1. Every tributary must connect two valid rod IDs (or two valid states on the same rod for Change type).
2. Relationship tributaries persist as long as the cross-rod dependency exists.
3. Change tributaries are resolved when the state transition is complete.
4. "Branch" maps to "tributary" only where the lateral-connection semantic is correct. In organizational hierarchy context, "branch" refers to entity splits (Net Works / Creative Works are Tier 3 branches).
5. "Merge" maps to "confluence" only where the convergence semantic is correct (see Section 6).

---

## 6. Confluence

### Canonical Definition

A **Confluence** is the point where two or more tributaries converge — where parallel journey outcomes merge into a unified state.

### Confluence Attributes

```
Confluence:
  confluence_id:    CONF-{SEQUENCE}
  tributary_ids:    [List of tributary IDs converging here]
  rod_id:           [Rod where convergence occurs]
  converge_state:   [Unified state after convergence]
  timestamp:        [When convergence occurred]
  governing_event:  [Event that triggered convergence]
```

### Disambiguation (CONF-010 Resolution)

| Term | Use When | Do Not Use When |
|---|---|---|
| Confluence | Two or more tributaries converge into a unified journey state | Describing a single rod's linear state transition |
| Tributary | Lateral connection (cross-rod or within-rod change) | Describing the main rod path itself |
| Branch | Organizational entity hierarchy split | Describing any data model lateral connection |

---

## 7. Molecule

### Canonical Definition

A **Molecule** is a governed composition grouping of atoms. Every atom belongs to exactly one molecule.

### Canonical Molecule Register (from SRC-001, SRC-003)

| Molecule ID | Molecule Name | Description | Atom Domain |
|---|---|---|---|
| MOL-001 | Customer Identity | Governed identity and classification data for every counterparty | WHO |
| MOL-002 | Pricing | Governed pricing structures, rates, tiers, and overages for every contract | HOW MUCH |
| MOL-003 | Contract | Governed contract terms, obligations, and modification history | WHAT |
| MOL-004 | Revenue Recognition | Governed recognition schedules, performance obligations, and timing rules | WHEN / HOW |

### Molecule Governance Rules

1. Four canonical molecules — this register is closed until an explicit enterprise architecture decision adds a fifth.
2. Every atom must belong to exactly one molecule.
3. A molecule cannot be deleted while it contains active atoms.
4. Molecule composition (which atoms belong) is governed — ad hoc atom assignment is a governance violation.

---

## 8. Atom

### Canonical Definition

An **Atom** is a bounded, governed metadata or evidence unit. Every atom belongs to exactly one molecule. Atoms are the most granular governed data objects in the Salt Basin model.

### Atom ID Schema

```
ATM-{MOL_CODE}-{SEQUENCE}

Molecule codes:
  CUST   = Customer Identity (MOL-001)
  PRICE  = Pricing (MOL-002)
  CONT   = Contract (MOL-003)
  REV    = Revenue Recognition (MOL-004)
```

### Atom Attributes

```
Atom:
  atom_id:          ATM-{MOL_CODE}-{SEQUENCE}
  name:             [Human-readable atom name]
  molecule_id:      [Parent molecule — required, exactly one]
  data_type:        [String / Numeric / Date / Enum / Boolean / JSONB]
  governed_values:  [Enumerated valid values, if applicable]
  source_system:    [Originating system]
  source_field:     [Source field name in originating system]
  lineage_rod_id:   [Rod this atom was captured from]
  lineage_event_id: [Event that captured this atom's value]
  contract_id:      [Contract this atom traces to, if applicable]
  captured_at:      [Timestamp]
  version:          [Monotonic integer — increments on governed update]
  confidence:       [High / Medium / Low — per ART-16 evidence dimensions]
  status:           active | superseded | retired
```

### Canonical Atom Register

#### MOL-001 — Customer Identity Atoms

| Atom ID | Atom Name | Data Type | Example Value | Notes |
|---|---|---|---|---|
| ATM-CUST-001 | Bill-To Party | String | "State Health Plan" | Legal name of invoice recipient |
| ATM-CUST-002 | Ship-To Party | String | "FL School District 014" | Physical/service delivery recipient |
| ATM-CUST-003 | Customer Type | Enum | "Health Plan \| Education \| SMB \| Enterprise" | ICP classification |
| ATM-CUST-004 | District Code | String | "FL-D014" | Geographic/organizational identifier |
| ATM-CUST-005 | NAICS Code | String | "621111" | Industry classification |
| ATM-CUST-006 | Customer Status | Enum | "Active \| Churned \| Prospect \| Suspended" | Current lifecycle status |
| ATM-CUST-007 | Multi-Entity Flag | Boolean | TRUE | Does this customer span multiple legal entities? |
| ATM-CUST-008 | Parent Account ID | String | — | If subsidiary of a larger account |
| ATM-CUST-009 | Counterparty ID | UUID | — | Salt Basin internal identity key |
| ATM-CUST-010 | First Active Date | Date | 2025-09-01 | Date customer reached active status |

#### MOL-002 — Pricing Atoms

| Atom ID | Atom Name | Data Type | Example Value | Notes |
|---|---|---|---|---|
| ATM-PRICE-001 | Subscription Fee | Numeric | 25000.00 | Monthly recurring base fee (USD) |
| ATM-PRICE-002 | Billing Frequency | Enum | "Monthly \| Quarterly \| Annual" | Invoice cadence |
| ATM-PRICE-003 | Visit CPT Rate | Numeric | 85.00 | Per-visit CPT code rate |
| ATM-PRICE-004 | Pricing Model | Enum | "Flat \| Per-Seat \| Usage-Based \| Tiered \| Hybrid" | Pricing structure type |
| ATM-PRICE-005 | Tier Threshold 1 | Numeric | 1000 | Unit count at first tier break |
| ATM-PRICE-006 | Tier Rate 1 | Numeric | 10.00 | Price per unit in tier 1 |
| ATM-PRICE-007 | Tier Threshold 2 | Numeric | 5000 | Unit count at second tier break |
| ATM-PRICE-008 | Tier Rate 2 | Numeric | 8.50 | Price per unit in tier 2 |
| ATM-PRICE-009 | Overage Rate | Numeric | 12.00 | Per-unit rate for above-contract usage |
| ATM-PRICE-010 | Variable Consideration Method | Enum | "Expected Value \| Most Likely Amount" | ASC 606 method (required at pipeline entry) |
| ATM-PRICE-011 | Contract Currency | String | "USD" | ISO 4217 currency code |
| ATM-PRICE-012 | ACV | Numeric | 300000.00 | Annual Contract Value (USD) |
| ATM-PRICE-013 | TCV | Numeric | 900000.00 | Total Contract Value (USD) |

#### MOL-003 — Contract Atoms

| Atom ID | Atom Name | Data Type | Example Value | Notes |
|---|---|---|---|---|
| ATM-CONT-001 | Contract ID | String | "CONT-2025-0042" | Business key — immutable |
| ATM-CONT-002 | Contract Version | Integer | 1 | Increments on modification — original never altered |
| ATM-CONT-003 | Contract Type | Enum | "Master \| Order Form \| Amendment \| SOW" | Contract document type |
| ATM-CONT-004 | Executed Date | Date | 2025-08-15 | Date of final executed signature |
| ATM-CONT-005 | Effective Date | Date | 2025-09-01 | Contract performance start date |
| ATM-CONT-006 | Term Start | Date | 2025-09-01 | Service delivery start date |
| ATM-CONT-007 | Term End | Date | 2026-08-31 | Service delivery end date |
| ATM-CONT-008 | Auto-Renew | Boolean | TRUE | Does contract auto-renew? |
| ATM-CONT-009 | Notice Period (Days) | Integer | 60 | Days required for non-renewal notice |
| ATM-CONT-010 | Multi-Entity Flag | Boolean | TRUE | Master contract spanning multiple entities |
| ATM-CONT-011 | Performance Obligation Count | Integer | 3 | ASC 606 distinct performance obligations |
| ATM-CONT-012 | Standalone Selling Price | Numeric | 100000.00 | SSP for allocation (per obligation) |
| ATM-CONT-013 | Non-Standard Term Flag | Boolean | FALSE | Any non-standard terms introduced in negotiation? |
| ATM-CONT-014 | Governing Law | String | "Florida" | State/jurisdiction of contract |
| ATM-CONT-015 | Contract Status | Enum | "Draft \| Executed \| Modified \| Expired \| Terminated" | Current contract lifecycle state |

#### MOL-004 — Revenue Recognition Atoms

| Atom ID | Atom Name | Data Type | Example Value | Notes |
|---|---|---|---|---|
| ATM-REV-001 | Recognition Method | Enum | "Ratable \| Milestone \| Usage-Based \| Point-in-Time" | ASC 606 recognition pattern |
| ATM-REV-002 | Recognition Start Date | Date | 2025-09-01 | When recognition begins |
| ATM-REV-003 | Recognition End Date | Date | 2026-08-31 | When recognition ends (ratable) |
| ATM-REV-004 | Monthly Recognized Amount | Numeric | 25000.00 | USD amount recognized per month (ratable) |
| ATM-REV-005 | Cumulative Recognized | Numeric | 75000.00 | Total recognized to date |
| ATM-REV-006 | Deferred Revenue Balance | Numeric | 225000.00 | Billed but not yet recognized |
| ATM-REV-007 | Unbilled AR | Numeric | 0.00 | Earned but not yet invoiced |
| ATM-REV-008 | ARR | Numeric | 300000.00 | Annual Recurring Revenue |
| ATM-REV-009 | MRR | Numeric | 25000.00 | Monthly Recurring Revenue |
| ATM-REV-010 | Modification Flag | Boolean | FALSE | Has contract been modified post-execution? |
| ATM-REV-011 | Modification Type | Enum | "Prospective \| Cumulative Catch-Up \| \—" | ASC 606 modification accounting method |
| ATM-REV-012 | Revenue Recognition Status | Enum | "Not Started \| In Progress \| Complete \| Exception" | Current recognition state |
| ATM-REV-013 | SOX Control Reference | String | "SOX-REV-042" | Internal SOX control ID governing this rec stream |

---

## 9. Magnetic Field

### Canonical Definition

A **Magnetic Field** is a convergence rule that pulls related atoms into their governing molecule. It defines the conditions under which a raw data attribute is recognized as belonging to a specific molecule.

### Canonical Magnetic Field Register

| MF ID | Name | Governed Molecule | Rule Description |
|---|---|---|---|
| MF-001 | Customer Identity Convergence | MOL-001 — Customer Identity | Any atom classifying WHO the counterparty is (name, ID, type, status, geography) converges to Customer Identity |
| MF-002 | Pricing Convergence | MOL-002 — Pricing | Any atom defining HOW MUCH is charged, at what rate, under what structure, in what currency converges to Pricing |
| MF-003 | Contract Convergence | MOL-003 — Contract | Any atom defining the governing WHAT of the commercial relationship (terms, dates, obligations, modifications) converges to Contract |
| MF-004 | Revenue Recognition Convergence | MOL-004 — Revenue Recognition | Any atom defining WHEN and HOW revenue is earned and recorded (recognition method, timing, amounts, ASC 606 compliance) converges to Revenue Recognition |

### Magnetic Field Governance

1. An atom that matches more than one magnetic field indicates a governance conflict — must be resolved before the atom is assigned.
2. Magnetic fields are not UI filters — they are governance rules enforced at data ingestion.
3. New magnetic fields may only be created alongside a new canonical molecule — never independently.

---

## 10. Object Relationship Diagram

```
CHANNEL (CH-REV / CH-CUST / CH-MEM / CH-FIN)
    │
    │ contains 1..*
    ▼
CHANNEL ROD (ROD-{CH}-{SEQ})
    │                          │
    │ has 1..*                 │ connects via
    ▼                          ▼
ROD EVENT                  TRIBUTARY (TR-{SEQ})
(EVT-{ROD}-{SEQ})              │
                               │ converges at
                               ▼
                           CONFLUENCE (CONF-{SEQ})


MOLECULE (MOL-{SEQ})
    │
    │ governed by
    │─────────────► MAGNETIC FIELD (MF-{SEQ})
    │
    │ contains 1..*
    ▼
ATOM (ATM-{MOL}-{SEQ})
    │
    │ traces to
    ▼
ROD EVENT  →  CHANNEL ROD  →  CONTRACT


Every ATOM traces to:
  ├── One MOLECULE (parent)
  ├── One ROD EVENT (lineage source)
  ├── One CHANNEL ROD (journey context)
  └── One CONTRACT (originating agreement, where applicable)
```

---

## 11. Data Model Governance Rules

1. **Molecule closure:** The four canonical molecules are the complete set until a formal architecture decision adds a fifth. No product team may create an informal fifth molecule.
2. **Atom assignment:** Every atom must be assigned to exactly one molecule via a magnetic field — never assigned by convention or naming similarity alone.
3. **Rod closure:** Rod IDs are permanent. A rod may be archived but never repurposed or deleted from the registry.
4. **Event immutability:** Rod events are immutable once written. Corrections create a new event with a reference to the corrected event.
5. **Contract primacy:** Every revenue-related atom and event that can be traced to a contract must be. Atoms without contract lineage in a revenue context are a data quality exception.
6. **No orphan atoms:** An atom without a valid molecule assignment is a governance violation — rejected at ingestion.
7. **No orphan rods:** A rod without a valid parent (or explicit root designation) is a governance violation — rejected at ingestion.
8. **Tributary type enforcement:** Every tributary must be typed as Relationship or Change — untyped lateral connections are governance violations.
9. **Temporal preservation:** For every object, the full temporal history must be preserved — current state is never the only state.
10. **Lineage completeness:** No object may be surfaced in a UI, report, or agent output without complete lineage back to its originating source event.

---

## 12. Validation Checklist

The following validations must pass before any data model snapshot is considered governed:

- [ ] No orphan atoms (every atom has a valid molecule_id)
- [ ] No orphan rods (every rod has a valid parent_rod_id or root designation)
- [ ] No untyped tributaries (every tributary has type = Relationship or Change)
- [ ] No atoms without lineage (every atom has lineage_rod_id and lineage_event_id)
- [ ] No revenue atoms without contract_id (every revenue-context atom traces to a contract)
- [ ] No rod events without state transition (previous_state ≠ new_state on every event)
- [ ] No Scenario_IDs repurposed (EIDOS Scenario_IDs are permanent)
- [ ] All molecules match canonical register (no informal 5th molecule exists)
- [ ] Magnetic field assignment is documented for every atom type
- [ ] All atom versions are monotonically increasing (no version gaps or resets)
