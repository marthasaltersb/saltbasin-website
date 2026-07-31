# SALT BASIN — RELATIONSHIP REGISTER
## ART-10 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003, SRC-005, SRC-007

---

## Purpose

This document registers every canonical relationship between objects in the Salt Basin data model. It is the authoritative reference for cardinality, direction, lineage requirements, and governance rules for every cross-object dependency in the system.

Relationships here are structural — they define how objects must connect. Tributary relationships (the named lateral connections between Journey Rods) are a subset of this model; they are fully specified in ART-08 and ART-11 and summarized here for completeness.

---

## 1. Relationship Notation

```
A ──[REL_ID: label]──► B

Direction: from A to B
Cardinality: specified per relationship
Required: Y = relationship must exist for record to be valid
           N = optional relationship
```

---

## 2. Channel → Rod Relationships

### REL-001: Channel CONTAINS Rod

```
Channel ──[REL-001: contains]──► Channel Rod
Cardinality: 1 Channel → 1..* Rods
Direction: Channel is parent; Rod is child
Required: Y — every Rod must belong to exactly one Channel
Governance:
  - A rod may not exist without a parent channel
  - A rod may not span two channels
  - Channel code in Rod ID must match parent channel
Validation: rod.channel_id EXISTS IN channels.channel_id
```

### REL-002: Rod PARENT-OF Rod

```
Channel Rod ──[REL-002: parent-of]──► Channel Rod
Cardinality: 1 Rod → 0..* child Rods
             1 child Rod → 0..1 parent Rod (or null if root)
Direction: Parent rod is the commercial/structural superior
Required: Y for non-root rods; null only if root designation explicit
Governance:
  - Every non-root rod must have exactly one parent rod
  - Root rods must be explicitly designated (root_flag = TRUE)
  - Orphan rods (no parent, no root flag) are governance violations
Validation: rod.parent_rod_id EXISTS IN rods.rod_id OR rod.root_flag = TRUE
```

**Canonical parent-child rod pairs:**

| Parent Rod | Child Rod | Relationship Label |
|---|---|---|
| ROD-REV-001 | ROD-CUST-001 | Revenue → Health Plan customer |
| ROD-REV-001 | ROD-CUST-002 | Revenue → Education customer |
| ROD-CUST-001 | ROD-MEM-001 | Health Plan customer → Schools |
| ROD-MEM-001 | ROD-MEM-002 | Schools → Students |

---

## 3. Rod → Event Relationships

### REL-003: Rod HAS Events

```
Channel Rod ──[REL-003: has]──► Rod Event
Cardinality: 1 Rod → 1..* Events (a rod with zero events is never in any state)
Direction: Rod owns its event log
Required: Y — a rod must have at least one event (its creation/entry event)
Governance:
  - Events are immutable once written
  - Events are append-only — no updates, no deletes
  - Every event must produce a state transition (previous_state ≠ new_state)
Validation: COUNT(events WHERE rod_id = rod.rod_id) >= 1
```

### REL-004: Event TRACES-TO Contract

```
Rod Event ──[REL-004: traces-to]──► Contract
Cardinality: 1 Event → 0..1 Contract
             1 Contract → 0..* Events
Direction: Event references contract
Required: Y for all revenue-context events; N for pre-contract pipeline events
Governance:
  - All post-contract events on Revenue Rod must carry contract_id
  - Pre-contract events (LeadQualified, OpportunityCreated) may have null contract_id
  - Contract_id, once assigned to an event, is immutable
Validation: IF event.channel = 'CH-REV' AND event.event_type IN (post-contract types)
            THEN event.contract_id IS NOT NULL
```

---

## 4. Rod ↔ Tributary Relationships

### REL-005: Rod CONNECTS-VIA Tributary

```
Channel Rod ──[REL-005: connects-via]──► Tributary
Cardinality: 1 Rod → 0..* outbound Tributaries
             1 Rod → 0..* inbound Tributaries
Direction: Bidirectional — a tributary has a from_rod and a to_rod
Required: N — rods may exist without tributaries (simple single-entity scenarios)
Governance:
  - Tributary type must be Relationship or Change — untyped tributaries are invalid
  - A Relationship tributary connects two different rods
  - A Change tributary connects two states on the same rod
  - Tributary IDs are permanent once assigned
```

### REL-006: Tributary CONVERGES-AT Confluence

```
Tributary ──[REL-006: converges-at]──► Confluence
Cardinality: 2..* Tributaries → 1 Confluence
             1 Confluence → 2..* Tributaries
Direction: Multiple tributaries flow into one confluence
Required: N — only when tributaries actually converge
Governance:
  - A Confluence requires a minimum of two incoming tributaries
  - A single tributary with no convergence partner is not a confluence
  - Confluence ID is permanent once assigned
```

---

## 5. Molecule → Atom Relationships

### REL-007: Molecule CONTAINS Atom

```
Molecule ──[REL-007: contains]──► Atom
Cardinality: 1 Molecule → 1..* Atoms
             1 Atom → exactly 1 Molecule (strict — no sharing)
Direction: Molecule is parent; Atom is child
Required: Y — every atom must belong to exactly one molecule
Governance:
  - An atom cannot belong to more than one molecule
  - An atom without a molecule assignment is invalid (orphan atom)
  - Molecule assignment is governed by the Magnetic Field (REL-008)
  - Atoms may not be reassigned to a different molecule once governed
Validation: atom.molecule_id IS NOT NULL
            AND atom.molecule_id EXISTS IN molecules.molecule_id
            AND COUNT(molecules WHERE atom.molecule_id = molecule_id) = 1
```

### REL-008: Magnetic Field GOVERNS Atom Assignment

```
Magnetic Field ──[REL-008: governs]──► Atom → Molecule
Cardinality: 1 Magnetic Field → 1 Molecule (each MF governs one molecule)
             1 Atom → governed by exactly 1 Magnetic Field
Direction: Magnetic Field determines which molecule an atom belongs to
Required: Y — every atom must be traceable to a governing magnetic field
Governance:
  - An atom matching multiple magnetic fields is a governance conflict — must be resolved
  - Magnetic field assignment must be documented at atom type definition, not per-instance
  - No new magnetic fields without a corresponding new canonical molecule
```

**Magnetic Field to Molecule mapping:**

| MF ID | Governs | Molecule |
|---|---|---|
| MF-001 | WHO atoms (counterparty identity, classification, status) | MOL-001 Customer Identity |
| MF-002 | HOW MUCH atoms (rates, fees, tiers, currency, ACV, TCV) | MOL-002 Pricing |
| MF-003 | WHAT atoms (contract terms, dates, obligations, modifications) | MOL-003 Contract |
| MF-004 | WHEN/HOW atoms (recognition method, timing, recognized amounts, ASC 606) | MOL-004 Revenue Recognition |

---

## 6. Atom → Event and Contract Relationships

### REL-009: Atom TRACES-TO Rod Event

```
Atom ──[REL-009: traces-to]──► Rod Event
Cardinality: 1 Atom instance → 1 Rod Event (the event that captured this atom value)
             1 Rod Event → 0..* Atoms
Direction: Atom references its capturing event
Required: Y — every atom instance must carry lineage to a specific event
Governance:
  - The lineage_event_id on every atom is immutable once set
  - An atom instance with no lineage_event_id is an ungoverned atom — governance violation
Validation: atom.lineage_event_id IS NOT NULL
            AND atom.lineage_event_id EXISTS IN rod_events.event_id
```

### REL-010: Atom TRACES-TO Contract

```
Atom ──[REL-010: traces-to]──► Contract
Cardinality: 1 Atom → 0..1 Contract
             1 Contract → 0..* Atoms
Direction: Atom references originating contract
Required: Y for all revenue-context atoms; N for pre-contract atoms
Governance:
  - All Pricing atoms (MOL-002) and Contract atoms (MOL-003) must carry contract_id
  - All Revenue Recognition atoms (MOL-004) must carry contract_id
  - Customer Identity atoms (MOL-001) may have null contract_id at lead stage
Validation: IF atom.molecule_id IN ('MOL-002','MOL-003','MOL-004')
            THEN atom.contract_id IS NOT NULL
```

---

## 7. Contract → Registry Relationships

### REL-011: Contract REGISTERS-IN Contract Registry

```
Contract ──[REL-011: registers-in]──► Contract Registry
Cardinality: 1 Contract → 1 Registry record (immutable originating record)
Direction: Contract record is written to Registry; Registry is the authoritative copy
Required: Y — every executed contract must have a Contract Registry record
Governance:
  - Contract Registry records are insert-only — no updates, no deletes
  - Modifications create new version records (contract_version + 1)
  - The original record (version 1) is the immutable originating record
  - All downstream events reference the contract_id, not the version_id
Validation: contract.contract_id EXISTS IN contract_registry.contract_id
            AND contract_registry.version = 1 (originating record exists)
```

### REL-012: Contract GENERATES Revenue Registry Records

```
Contract ──[REL-012: generates]──► Revenue Registry
Cardinality: 1 Contract → 1..* Revenue Registry records (one per recognition period)
Direction: Contract drives the recognition schedule
Required: Y — every executed contract must produce a recognition schedule
Governance:
  - Recognition schedule is generated at contract execution
  - Each recognition period is a separate Revenue Registry record
  - Schedule adjustments (modifications) create new records — old records are not deleted
```

### REL-013: Contract GENERATES Billing Registry Records

```
Contract ──[REL-013: generates]──► Billing Registry
Cardinality: 1 Contract → 1..* Billing Registry records (one per billing event)
Direction: Contract billing terms drive invoice generation
Required: Y — every executed contract must produce billing records
Governance:
  - Billing Registry records trace to Contract Registry via contract_id
  - Invoice errors do not modify the contract record — they create exception records
```

---

## 8. Agent → Rod Relationships

### REL-014: Agent BOUNDED-TO Rod(s)

```
Agent ──[REL-014: bounded-to]──► Channel Rod(s)
Cardinality: 1 Agent → 1..* Rods (agents may be multi-rod with explicit grant)
             1 Rod → 0..* Agents
Direction: Agent permission is scoped to its bound rods
Required: Y — every agent must have at least one bound rod or explicit enterprise scope
Governance:
  - An agent may not access data on a rod it is not bound to
  - Multi-rod agents require explicit permission escalation documentation
  - Rod binding is defined at agent registration — not inherited from user
```

**Canonical agent-to-rod bindings:**

| Agent | Bound Rods | Access Level |
|---|---|---|
| AGT-001 BestyStaff Revenue | ROD-REV-{N} | Read + Stage/Commit |
| AGT-002 BestyStaff Customer | ROD-CUST-{N} | Read + Suggest |
| AGT-003 Deal Readiness Bot | ROD-REV-{N}, ROD-CUST-{N} | Read + Suggest |
| AGT-004 Diligence Bot | ROD-REV-{N}, CH-FIN | Read + Suggest |
| AGT-005 Portfolio Health Bot | All rods (monitoring) | Read only |

### REL-015: Agent ACTION-REQUIRES User Identity Gate

```
Agent Action ──[REL-015: requires]──► User Identity Verification
Cardinality: 1 Action → 1 Identity Gate check (at or above Stage level)
Direction: Action requires identity verification before execution
Required: Y for all Stage / Commit / Publish level actions
Governance:
  - Read and Suggest actions do not require identity gate
  - Stage, Commit, Publish always require identity verification
  - Identity verification result is logged with the action audit record
```

---

## 9. Claim → Evidence Relationships

### REL-016: Claim REQUIRES Evidence

```
Claim ──[REL-016: requires]──► Evidence Record
Cardinality: 1 Claim → 1..* Evidence records
             1 Evidence record → 1..* Claims (evidence may support multiple claims)
Direction: Claim references evidence
Required: Y — a claim with no evidence record is a hypothesis, not a registered claim
Governance:
  - Every CLM-ID must have at least one evidence record before status = Verified
  - Candidate claims may exist with evidence under review
  - Evidence records carry: source, methodology, sample size, date, confidence
Validation: COUNT(evidence WHERE claim_id = clm.claim_id) >= 1
```

### REL-017: Claim PRODUCES Metric

```
Claim ──[REL-017: produces]──► Metric
Cardinality: 1 Claim → 0..* Metrics
             1 Metric → 1..* Claims (a metric may derive from multiple claims)
Direction: Claim is the source assertion; metric is the quantified expression
Required: N — not all claims produce a metric; some are qualitative
Governance:
  - Every metric in the Metric Registry (ART-17) must trace to at least one CLM-ID
  - A metric without a claim source is an ungoverned number — governance violation
Validation: metric.claim_id IS NOT NULL OR metric.claim_ids IS NOT EMPTY
```

---

## 10. EIDOS Scenario → Rod Relationships

### REL-018: L2 Scenario MAPS-TO Rod

```
L2 Scenario ──[REL-018: maps-to]──► Channel Rod
Cardinality: 1 L2 Scenario → exactly 1 parent Rod
             1 Rod → 0..* L2 Scenarios
Direction: Scenario is a named traversal of a Rod
Required: Y — every L2 scenario must map to a parent rod
Governance:
  - Scenario_ID is permanent — never repurposed
  - Scenario must map to a rod that exists in the canonical rod register
  - A scenario cannot span channels without a corresponding multi-rod parent structure
Validation: scenario.parent_rod_id EXISTS IN rods.rod_id
```

### REL-019: L3 Journey EXPANDS L2 Scenario

```
L3 Journey ──[REL-019: expands]──► L2 Scenario
Cardinality: 1 L3 Journey → exactly 1 L2 Scenario
             1 L2 Scenario → 0..1 L3 Journey (each L2 expands into one complete L3)
Direction: L3 is the full expansion of the L2 scenario
Required: N until L3 build is initiated; Y before scenario is considered fully defined
Governance:
  - L3 must not introduce states not present in the parent rod's state machine (ART-12)
  - L3 must reference the same Scenario_ID as its parent L2
  - New states discovered during L3 expansion must be reviewed for addition to ART-12
```

---

## 11. Full Relationship Summary Table

| REL ID | From | Relationship | To | Cardinality | Required |
|---|---|---|---|---|---|
| REL-001 | Channel | contains | Rod | 1→1..* | Y |
| REL-002 | Rod | parent-of | Rod | 1→0..* | Y (for non-root) |
| REL-003 | Rod | has | Rod Event | 1→1..* | Y |
| REL-004 | Rod Event | traces-to | Contract | 1→0..1 | Y (post-contract) |
| REL-005 | Rod | connects-via | Tributary | 1→0..* | N |
| REL-006 | Tributary | converges-at | Confluence | 2..*→1 | N |
| REL-007 | Molecule | contains | Atom | 1→1..* | Y |
| REL-008 | Magnetic Field | governs | Atom→Molecule | 1→1..* | Y |
| REL-009 | Atom | traces-to | Rod Event | 1→1 | Y |
| REL-010 | Atom | traces-to | Contract | 1→0..1 | Y (revenue context) |
| REL-011 | Contract | registers-in | Contract Registry | 1→1 | Y |
| REL-012 | Contract | generates | Revenue Registry | 1→1..* | Y |
| REL-013 | Contract | generates | Billing Registry | 1→1..* | Y |
| REL-014 | Agent | bounded-to | Rod | 1→1..* | Y |
| REL-015 | Agent Action | requires | Identity Gate | 1→1 | Y (Stage+) |
| REL-016 | Claim | requires | Evidence | 1→1..* | Y |
| REL-017 | Claim | produces | Metric | 1→0..* | N |
| REL-018 | L2 Scenario | maps-to | Rod | 1→1 | Y |
| REL-019 | L3 Journey | expands | L2 Scenario | 1→1 | Y (when built) |

---

## 12. Relationship Governance Rules

1. **Relationship IDs are permanent.** REL-IDs may not be repurposed. If a relationship is retired, the ID is archived with a retirement record.
2. **All required relationships must be satisfied before a record is considered governed.** An object with an unsatisfied required relationship is in provisional state.
3. **Cardinality violations are governance exceptions.** An atom in two molecules, a rod with no channel, a claim with no evidence — all are exceptions that must be flagged and resolved.
4. **Direction is enforced.** A child object references its parent — not the reverse. The parent holds no list of children; children hold parent references. (Exception: Molecules may maintain an atom manifest as a denormalized performance cache — but the atom's molecule_id is authoritative.)
5. **Relationship changes must be logged.** If a relationship changes (e.g., a scenario is reassigned to a different rod), the change must be recorded with timestamp, reason, and authorizing user.
6. **Cross-channel relationships require explicit approval.** An agent or atom relationship that crosses channel boundaries is a governance exception — must be explicitly approved and documented.
