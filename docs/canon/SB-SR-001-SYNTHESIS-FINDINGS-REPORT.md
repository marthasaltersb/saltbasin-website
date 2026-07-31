# SALT BASIN — SYNTHESIS FINDINGS REPORT
## SB-SR-001 | July 16, 2026 | Status: AWAITING BETSY DECISIONS
### Source Reviewed: SRC-021 (Salt_Basin_x_LoneTree_End_to_End_Thesis_Proposal_Extended.pdf)
### Files Not Yet Readable: SRC-022 through SRC-027 (bash workspace unavailable — binary files)

---

## Executive Summary

The LoneTree PDF (SRC-021) is a founding-level design-partner proposal to LoneTree Capital. It is the most comprehensive single source read to date outside of SRC-001. It answers or substantially informs **4 of 12 open items** and introduces **5 new canonical conflicts** requiring Betsy's decision before any artifacts are updated.

**Most critical finding:** The 6-level Evidence Maturity model in SRC-021 almost certainly resolves OI-001 (RLMM stage names) — but this interpretation requires Betsy's explicit confirmation before registration.

**Most critical correction:** The BOEM stage names in ART-16 (Ungoverned, Anecdotal, Documented, Governed, Auditable, Continuous) were synthesized without a primary source. SRC-021 provides actual stage names that supersede them. ART-16 must be corrected.

---

## Part 1 — Open Items Register: Findings

### OI-001 — RLMM™ Stage Names ⚠️ CRITICAL

**Status: LIKELY ANSWERED — PENDING BETSY CONFIRMATION**

SRC-021 (slide 14) presents a 6-level **Evidence Maturity** model:

| Level | Name | Description |
|---|---|---|
| 0 | ASSERTED | Someone reports it |
| 1 | DEFINED | Meaning agreed |
| 2 | REPRODUCIBLE | Formula + population known |
| 3 | RECONCILED | Cross-system consistency tested |
| 4 | EXPLAINABLE | Movement tied to business events |
| 5 | OUTCOME VALIDATED | Backtested against outcomes |

**SRC-021 language (verbatim):** "The unit of maturity is the business claim — not the company."

This is the claim-level maturity model built into the Q2R / Revenue Engine OS product architecture. The RLMM™ (Revenue Lifecycle Mechanics Maturity) is described as a diagnostic model for exactly this type of evidence/operational maturity.

**Two possible interpretations:**

| Interpretation | Implication |
|---|---|
| **A: These ARE the RLMM stage names** — RLMM uses the Evidence Maturity framework as its stages | Register as canonical RLMM stages 0–5; update ART-04, unlock ART-05, ART-09, RLMM app |
| **B: Evidence Maturity is a sub-model WITHIN RLMM** — RLMM has separate stage names; Evidence Maturity is how RLMM measures each stage | RLMM stage names remain open (OI-001 unresolved); Evidence Maturity stages are registered separately |

**Additional related model (SRC-021, slide-context):** A 5-stage "Underwriting Outcome" progression appears: DEFINED → REPRODUCIBLE → RECONCILED → EXPLAINABLE → DEFENSIBLE. This is a 5-stage compressed version without "Asserted" (stage 0) and with "Defensible" replacing "Outcome Validated."

**DECISION REQUIRED FROM BETSY:**
> Are the 6 Evidence Maturity stages (0 Asserted → 5 Outcome Validated) the named RLMM™ stages? Or does RLMM have a separate stage naming system?

---

### OI-001 Companion Finding — ART-16 BOEM Correction Required

**Status: CORRECTION NEEDED REGARDLESS OF OI-001 ANSWER**

ART-16 (Claims & Evidence Model) currently shows these BOEM level names:

| Level | Current ART-16 Name | SRC-021 Actual Name |
|---|---|---|
| 0 | Ungoverned | ASSERTED |
| 1 | Anecdotal | DEFINED |
| 2 | Documented | REPRODUCIBLE |
| 3 | Governed | RECONCILED |
| 4 | Auditable | EXPLAINABLE |
| 5 | Continuous | OUTCOME VALIDATED |

The ART-16 names were synthesized without a primary source. SRC-021 provides authoritative stage names from Betsy's own proposal. ART-16 must be updated regardless of how OI-001 is answered.

**DECISION REQUIRED FROM BETSY:**
> Confirm that the SRC-021 Evidence Maturity stage names (Asserted, Defined, Reproducible, Reconciled, Explainable, Outcome Validated) should replace the synthesized BOEM stage names in ART-16.

---

### OI-004 — HOS™ Domain

**Status: NO NEW INFORMATION**

SRC-021 uses "Revenue Engine OS" as the product label in the LoneTree context, but this appears to be a proposal-specific branding variant. No domain decision information found.

---

### OI-009, OI-010, OI-011 — Technical Architecture Items

**Status: NO NEW INFORMATION**

SRC-021 does not address repo structure, Supabase instance sharing, or multi-tenant model.

---

### OI-012 — Mobile CI/CD

**Status: NO NEW INFORMATION**

---

## Part 2 — New Canonical Conflicts from SRC-021

The following items were not previously in the open items register. Each requires a decision before any canonical artifact is updated.

---

### CONF-NEW-001 — Fourth Rod: Data Channel Rod (Thesis)

**Source:** SRC-021 (multiple pages showing 4-rod system)
**Conflict with:** ART-08, ART-10, ART-11, ART-12 (all built on 3-rod model)

SRC-021 explicitly shows a **4th rod** not present in any prior source:

**Data Channel Rod (Thesis Rod):**
```
Thesis Defined
    → Initiative Planned
    → Changes Implemented
    → Movement Classified
    → Attribution Reconciled
    → Evidence Accumulated
    → Exit Defense
```

This rod is the **evidence governance tracking layer** — it connects a thesis (investment or operational hypothesis) through implementation to exit-ready evidence. It is conceptually distinct from the other three rods:

| Rod | Truth Domain |
|---|---|
| Revenue Lifecycle Rod | Commercial / Financial Truth |
| Customer Journey Rod | End-to-End Customer Truth |
| Member Journey Rod | People / Participant Truth |
| **Data Channel Rod (Thesis)** | **Thesis / Evidence Truth** |

**Impact if added:**
- ART-11 (Journey Rod & Scenario Model) — must add 4th rod section
- ART-12 (Journey Specifications) — must add Data Channel Rod state machine
- ART-10 (Relationship Register) — must add REL-020 or REL-019 extension for Data Channel Rod
- ART-08 (Data Model) — rod hierarchy update
- ART-13 (Agent Security) — new agent scope for Thesis/Diligence Bot may map to this rod

**DECISION REQUIRED FROM BETSY:**
> Is the Data Channel Rod (Thesis Rod) a canonical 4th rod that should be added to the canonical artifact set? The 7-stage sequence is confirmed in SRC-021.

---

### CONF-NEW-002 — Data Basin® — Deprecated or Active?

**Source:** SRC-021 (pages 30, 34+)
**Conflict with:** SRC-011 classification (deprecated); CONF-011 in prior session

SRC-021 uses "**Data Basin®**" — with the registered trademark ® symbol — as a live, named product:

> "Data Basin® — Governed semantic layer across distributed systems"

It appears alongside other named products (Journey Data Rods™, Evidence Chain Engine, Revenue Engine OS) as a current offering in the design-partner proposal.

**Prior status:** ART-04 Terminology Crosswalk and SRC-011 classified "Data Basin / DataBasin Bridge" as deprecated legacy terminology. This was based on April 2026 platform slides.

**SRC-021 is a more recent and more authoritative source** than the April 2026 slides — it is a direct client-facing proposal, not internal materials.

**DECISION REQUIRED FROM BETSY:**
> Is "Data Basin®" a currently active product name with a registered trademark? Should the deprecation in ART-04 be reversed? If so, what does Data Basin® do (governed semantic layer = the Salt Basin Layer / Data Bridge Layer from prior synthesis)?

---

### CONF-NEW-003 — Molecule Set: 4 Canonical or 6 Capability?

**Source:** SRC-021 (capability architecture section)
**Conflict with:** ART-08 (4 canonical molecules: Customer Identity, Pricing, Contract, Revenue Recognition)

SRC-021 shows a **6-molecule capability layer**:

| # | Molecule (SRC-021) | Possible ART-08 Equivalent |
|---|---|---|
| 1 | Customer 360 Molecule | MOL-001 Customer Identity (expanded?) |
| 2 | Commercial Molecule | MOL-002 Pricing + MOL-003 Contract (combined?) |
| 3 | Revenue Lifecycle Molecule | MOL-004 Revenue Recognition (expanded?) |
| 4 | Financial Molecule | NEW — accounting/GL layer |
| 5 | Debt & Capital Molecule | NEW — SaltTide / Salt Covenant domain |
| 6 | Evidence & Audit Molecule | NEW — claims/evidence layer |

**Two possible interpretations:**

| Interpretation | Implication |
|---|---|
| **A: The 4 ART-08 molecules are the core; the 6 SRC-021 molecules are higher-level capability groupings (clusters)** | No conflict — different levels of the hierarchy; both valid |
| **B: The canonical molecule set is 6, not 4 — ART-08 is incomplete** | ART-08 must be updated; 2 new molecules (Financial, Debt & Capital) and an Evidence & Audit molecule need atoms defined |

**DECISION REQUIRED FROM BETSY:**
> Are the 6 SRC-021 capability molecules the canonical molecule set, or are they a higher-level grouping (clusters) above the 4 ART-08 core molecules?

---

### CONF-NEW-004 — Data Hierarchy: 3 Levels or 5 Levels?

**Source:** SRC-021 (data architecture diagram)
**Conflict with:** ART-08 (implicit 3-level model: Atom → Molecule → [Rod grouping])

SRC-021 defines a **5-level data hierarchy**:

```
ATOM        — Bounded, single-definition data point
    ↓
MOLECULE    — Related atoms grouped by magnetic field
    ↓
CLUSTER     — Domain/aggregate grouping above molecules
    ↓
ROD         — Full journey tracking object (state machine)
    ↓
ORBIT       — Cross-rod convergence into enterprise truth
```

**The two new levels:**

**CLUSTER** — sits between Molecule and Rod. Likely corresponds to the 6 capability molecules from SRC-021 (Customer 360, Commercial, Revenue Lifecycle, Financial, Debt & Capital, Evidence & Audit). A Cluster is a domain grouping above individual molecules.

**ORBIT** — sits above Rod. Represents cross-rod convergence — when data from all rods is unified into a single enterprise truth view. This is the "Operating Reality Lens" product concept in SRC-021.

**If added to ART-08:**
- Cluster becomes the level between Molecule and Rod, resolving CONF-NEW-003 (the 6 SRC-021 "molecules" are actually clusters)
- Orbit becomes a new concept in ART-08, ART-10, and eventually ART-07
- The hierarchy becomes: Atom → Molecule → Cluster → Rod → Orbit

**DECISION REQUIRED FROM BETSY:**
> Should the data hierarchy in ART-08 be updated to 5 levels: Atom → Molecule → Cluster → Rod → Orbit? The Cluster level would organize molecules into the 6 domain groupings shown in SRC-021.

---

### CONF-NEW-005 — New Product Names from SRC-021

**Source:** SRC-021
**Conflict with:** ART-00, ART-04 (product name register)

SRC-021 introduces product names not currently in the canonical artifact set:

| Product Name | Description | Trademark Status |
|---|---|---|
| Thesis Ledger System | Structured record of investment/operational theses | Not marked |
| Journey Data Rods™ | Named product wrapper for the Rod system | ™ marked |
| Evidence Chain Engine | Claim evidence chain automation tool | Not marked |
| Revenue Engine OS | HOS™ in LoneTree context? Or distinct product? | Not marked |
| Dynamic Journey Agents | Agent layer tied to Journey Rods | Not marked |
| Operating Reality Lens | Cross-rod unified view (Orbit layer?) | Not marked |
| Cost Basis & Data ROI Model | Tool for calculating data investment value | Not marked |
| Cost to Produce Truth™ | Trademarked metric/diagnostic concept | ™ marked |

**For "Cost to Produce Truth™" specifically — formula from SRC-021:**
```
Cost to Produce Truth™ =
  Manual Effort
  + Reconciliation Cost
  + Definition Debt
  + Data Remediation
  + Key-Person Risk
  + Evidence Gaps
```

**DECISION REQUIRED FROM BETSY:**
> Which of these product names are canonical for the Salt Basin product hierarchy? Is "Revenue Engine OS" an alias for HOS™ or a separate product? Should "Journey Data Rods™" be added to ART-04 as the product name for the Rod system?

---

## Part 3 — New Canonical Additions (No Conflict — Add Directly)

These items from SRC-021 have no conflict with existing artifacts and can be added to the canonical set once Betsy confirms SRC-021 as active authority.

### Addition 1 — Cost to Produce Truth™ Metric

| Field | Value |
|---|---|
| Name | Cost to Produce Truth™ |
| Type | Composite Diagnostic Metric |
| Formula | Manual Effort + Reconciliation + Definition Debt + Data Remediation + Key-Person Risk + Evidence Gaps |
| Domain | Evidence / Data Governance |
| Source | SRC-021 |
| Proposed Metric ID | MET-CPT-001 |
| Proposed Claim ID | CLM-CPT-001 |
| Trademark | ™ (in SRC-021) |

### Addition 2 — 9-Step Claim Evidence Chain (SRC-021, slide 16)

The following 9-step sequence is explicit in SRC-021 and fills the gap in ART-16's claim-to-evidence pathway:

```
1. THESIS          — Investment / operational hypothesis stated
2. DEFINITION      — Measurement definition agreed
3. MEASUREMENT     — Quantified data collected
4. SOURCE EVENT    — Raw event confirmed in source system
5. RECONCILIATION  — Cross-system consistency verified
6. EXPLANATION     — Movement explained by business event
7. ATTRIBUTION     — Cause-and-effect established with counterfactual
8. OUTCOME         — Business result observed
9. EXIT CLAIM      — Thesis supported to exit standard
```

This should be incorporated into ART-16 Section 2 (Evidence Chain) and into ART-18 (Attribution Model) at the attribution → outcome → exit claim junction.

### Addition 3 — SRC-021 as New Source Registration

| Field | Value |
|---|---|
| Source ID | SRC-021 |
| Source Name | Salt Basin × LoneTree Capital — End-to-End Thesis Proposal (Extended) |
| Tier | T1 (Internal — direct client-facing proposal authored by Betsy) |
| Type | Internal Strategic Document |
| Status | Active |
| Domain | All (data model, products, evidence, rods, molecules) |
| Note | Most comprehensive single architectural document read to date; introduces Data Channel Rod, 5-level hierarchy, Cost to Produce Truth™, Evidence Maturity stages |

ART-14 (Distributed Source Standard) must be updated to add SRC-021.

---

## Part 4 — Files Not Yet Read

The following uploaded files could not be read due to binary format restrictions (bash workspace unavailable):

| File | Candidate SRC ID | Priority | Likely Content |
|---|---|---|---|
| Finbridgeco Enterprise Data Architecture And Mapping Framework.docx | SRC-022 | Medium | External framework — may inform connector/mapping standards |
| Salt_Basin_Thesis_Evidence_Orbit_Annotated_Notes.docx | SRC-023 | HIGH | Annotated notes on Thesis, Evidence, Orbit — likely directly answers CONF-NEW-001 and CONF-NEW-004 |
| Salt_Basin_Thesis_Evidence_Chain_Examples.xlsx | SRC-024 | HIGH | Evidence chain examples — confirms 9-step sequence, may have RLMM content |
| Salt_Basin_Workbook_001A_Enterprise_Foundation_v4.xlsx | SRC-025 | HIGH | v4 of canonical workbook (SRC-003) — may contain updated rod structures, molecule definitions |
| Salt_Basin_LoneTree_Capital_Proposal (1).pptx | SRC-026 | Medium | LoneTree pitch deck — likely overlaps with PDF; visual framing |
| Salt_Basin_x_LoneTree_Prospect_Experience_v1.0.zip | SRC-027 | Low | Prospect experience package — design/UX content |

**To read these files:** Bash workspace must be available (requires disk space on Claude's end). When workspace is restored, priority order is SRC-025 → SRC-023 → SRC-024 → SRC-026 → SRC-022 → SRC-027.

---

## Part 5 — Decision Queue Summary

All decisions needed from Betsy before any canonical artifact updates proceed:

| Decision ID | Question | Unlocks |
|---|---|---|
| DEC-001 | Are the 6 Evidence Maturity stages (0 Asserted → 5 Outcome Validated) the RLMM™ stage names? | OI-001 resolution → ART-05, ART-09, RLMM app |
| DEC-002 | Confirm ART-16 BOEM stage names should be updated to Asserted/Defined/Reproducible/Reconciled/Explainable/Outcome Validated | ART-16 correction |
| DEC-003 | Is Data Channel Rod a canonical 4th rod? | ART-11, ART-12, ART-10 updates |
| DEC-004 | Is Data Basin® active and trademarked? What is its current function? | ART-04 deprecation reversal |
| DEC-005 | Is the canonical molecule count 6 (expanded) or 4 (core)? | ART-08 update |
| DEC-006 | Does the data hierarchy expand to 5 levels (Atom → Molecule → Cluster → Rod → Orbit)? | ART-08, ART-07 updates |
| DEC-007 | Which SRC-021 product names are canonical? Is Revenue Engine OS = HOS™? | ART-00, ART-04 updates |
| DEC-008 | Confirm SRC-021 (LoneTree PDF) as T1 Internal authority source | ART-14 update |

---

## Part 6 — Recommended Update Sequence (After Decisions)

Once decisions are received:

1. **ART-16 update** (BOEM stage names) — independent of all other decisions (DEC-002 only)
2. **ART-04 Crosswalk update** — add Evidence Maturity rows, RLMM resolution (DEC-001), Data Basin® status (DEC-004), new product names (DEC-007)
3. **ART-14 update** — register SRC-021 as SRC-021 (DEC-008)
4. **ART-08 update** — add Cluster + Orbit levels (DEC-006), expand molecule set if confirmed (DEC-005)
5. **ART-11 + ART-12 update** — add 4th rod (DEC-003)
6. **ART-10 update** — add 4th rod relationships (DEC-003)
7. **ART-16 + ART-18 update** — incorporate 9-step Claim Evidence Chain (no decision required)
8. **ART-17 update** — add MET-CPT-001 Cost to Produce Truth™ (no decision required after DEC-008)

---

## Change Log

| Version | Date | Change |
|---|---|---|
| 1.0 | July 16, 2026 | Initial synthesis findings — SRC-021 only; 6 files pending bash workspace restoration |
