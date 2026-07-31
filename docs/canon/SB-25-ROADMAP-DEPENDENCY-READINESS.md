# SALT BASIN — ROADMAP, DEPENDENCY, AND READINESS ASSESSMENT
## ART-25 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-000, SRC-001, SRC-003, SRC-010 + all canonical artifacts

---

## Purpose

This document provides the current-state readiness assessment for every Salt Basin product, artifact, and system — what is live, what is architecture, what is blocked, and what must be decided before build can proceed. It is the master dependency map for the Salt Basin enterprise.

---

## 1. Production Readiness Overview

### Status Definitions

| Status | Meaning |
|---|---|
| **LIVE** | Deployed and accessible in production |
| **ARCHITECTURE** | Fully specified; not yet built |
| **DESIGN** | Conceptually defined; not yet specified or built |
| **CANDIDATE** | Canonical artifact produced; pending review or user decision |
| **BLOCKED** | Cannot proceed until named dependency is resolved |
| **OPEN** | Named and confirmed; definition incomplete |

---

## 2. Product Readiness Register

### BestyStaff

| Attribute | Status | Detail |
|---|---|---|
| Live URL | **LIVE** | saltbasin.net |
| Core agent logic | **LIVE** | 9-second delay / intake form / loop-back / name memory |
| Revenue Rod integration | **LIVE** | BestyStaff Revenue (AGT-001) |
| Customer Rod integration | **LIVE** | BestyStaff Customer (AGT-002) |
| Agent security RLS policies | **ARCHITECTURE** | Defined in ART-13; not yet implemented in Supabase RLS |
| Permission-before-retention gate | **ARCHITECTURE** | Defined in ART-13; application layer implementation TBD |
| Session dashboard (admin) | **DESIGN** | Concept only |
| Decision/question tracker | **DESIGN** | Described in SRC-001; not yet built as governed component |

**Blockers:** None for core function. Agent security RLS policies needed before enterprise deployment.

---

### HOS™ (Salt Basin Operating Highway System)

| Attribute | Status | Detail |
|---|---|---|
| Google Sheets worksheets | **LIVE** | Interim delivery vehicle; Q2R tracking in Sheets |
| Q2R 11-step specification | **CANDIDATE** | Fully defined in ART-11 (SB-11) |
| Journey Rod implementation | **ARCHITECTURE** | Data model specified in ART-08, ART-12; not yet in Supabase |
| Contract Registry | **ARCHITECTURE** | Schema specified in ART-23; not yet deployed |
| Revenue Registry | **ARCHITECTURE** | Schema specified in ART-23; not yet deployed |
| Billing Registry | **ARCHITECTURE** | Connector inventory in ART-23; not yet deployed |
| Deal Readiness Bot (AGT-003) | **ARCHITECTURE** | Defined in ART-13; not yet built |
| Diligence Bot (AGT-004) | **ARCHITECTURE** | Defined in ART-13; not yet built |
| Portfolio Health Bot (AGT-005) | **ARCHITECTURE** | Defined in ART-13; not yet built |
| Fund Admin Upward Data Push | **ARCHITECTURE** | Connector architecture in ART-23; no connectors built |
| EIDOS execution engine | **ARCHITECTURE** | Scenario repository seeded (SRC-005); execution engine not built |
| HOS™ UI (Vite/Supabase/Vercel) | **ARCHITECTURE** | Stack specified; not yet scaffolded |
| CRM connectors (Salesforce, etc.) | **ARCHITECTURE** | Connector pattern defined in ART-23; not yet implemented |
| Fund admin connectors (Allvue, iLevel, PitchBook) | **ARCHITECTURE** | Connector inventory defined; not yet implemented |

**Blockers:**
- OI-004: HOS™ domain/subdomain decision needed before deployment scaffolding
- OI-011: Multi-tenant isolation model (portco as tenant vs. fund as tenant) decision needed
- All rail connectors require API credentials and vendor agreements before implementation

---

### SaltTide™

| Attribute | Status | Detail |
|---|---|---|
| Product concept | **CANDIDATE** | Fully defined in ART-00, ART-04 (terminology) |
| Seed round target | **CANDIDATE** | $3.5M (MET-TIDE-001) — fundraising in progress |
| Technical architecture | **ARCHITECTURE** | Defined in ART-23; nothing deployed |
| Credit data connectors (Experian/FICO) | **ARCHITECTURE** | Connector inventory defined; no agreements or implementation |
| Card routing algorithm | **ARCHITECTURE** | Concept defined; not specified or built |
| FCRA compliance layer | **ARCHITECTURE** | Regulatory requirements documented in ART-23 |
| PCI DSS compliance layer | **ARCHITECTURE** | Tokenization requirement documented; not implemented |
| UI | **DESIGN** | No wireframes or deployed UI |

**Blockers:**
- Seed capital needed before infrastructure build can begin
- Experian/FICO and card network agreements needed before connector implementation
- SaltTide visual mark (ART-06 — not yet built) needed for UI design

**Risk:** Silver Lake / Zuora acquisition represents a potential timing risk in the adjacent PE fintech space — monitor quarterly.

---

### Salt Basin Highways™

| Attribute | Status | Detail |
|---|---|---|
| Highway Vision™ | **ARCHITECTURE** | Concept defined; not built |
| Monetary River System™ | **ARCHITECTURE** | Graphic metaphor defined; not implemented as data layer |
| Route Intelligence Engine™ | **ARCHITECTURE** | Named; function conceptual only |
| Eligibility Engine | **ARCHITECTURE** | Named; function conceptual only |
| Override Engine | **ARCHITECTURE** | Named; function conceptual only |
| Recommendation Engine | **ARCHITECTURE** | Named; function conceptual only |
| Explainability Engine | **ARCHITECTURE** | Named; function conceptual only |
| Knowledge Graph | **ARCHITECTURE** | Named; function conceptual only |
| Learning & Cache | **ARCHITECTURE** | Named; function conceptual only |

**Note:** Salt Basin Highways™ is a methodology and trademark layer — NOT a legal entity. All 9 sub-engines are named architecture, none implemented.

---

### RLMM™ (Revenue Lifecycle Mechanics Maturity)

| Attribute | Status | Detail |
|---|---|---|
| Diagnostic concept | **CANDIDATE** | Defined in ART-04 (terminology) |
| Stage names | **BLOCKED** | OI-001 — stage names not yet finalized; blocking interactive app build |
| Interactive diagnostic app | **BLOCKED** | Cannot build until OI-001 resolved |
| Validation alignment | **CANDIDATE** | Validated against APQC / CMMI / ASQ/ISO / ASC 606 (concept) |

**Blockers:** OI-001 (RLMM stage names) — **highest-priority open item affecting buildable product.**
> ⚠️ SB-SR-001 (LoneTree synthesis) proposes the 6-level Evidence Maturity model as the likely resolution — pending Betsy confirmation (DEC-001).

---

### SaltBridge

| Attribute | Status | Detail |
|---|---|---|
| Name | **CANONICAL** | Confirmed MES Solutions product |
| Function | **OPEN** | OI-006 — function undefined |

---

### SaltChannels

| Attribute | Status | Detail |
|---|---|---|
| Name | **CANONICAL** | Confirmed MES Solutions product |
| Function | **OPEN** | OI-007 — function undefined |

---

### Salt Covenant Solutions

| Attribute | Status | Detail |
|---|---|---|
| Name | **CANONICAL** | Confirmed MES Solutions product — debt/credit extending covenant-of-salt lore |
| Function | **OPEN** | OI-008 — function undefined beyond name and thematic framing |

---

## 3. Canonical Artifact Build Status

| ART ID | Artifact Name | File | Status |
|---|---|---|---|
| ART-00 | Master Canonical Synthesis | SB-00-MASTER-CANONICAL-SYNTHESIS.md | COMPLETE |
| ART-04 | Terminology Crosswalk | SB-04-TERMINOLOGY-CROSSWALK.csv | COMPLETE |
| ART-07 | Layer Architecture Specification | SB-07-LAYER-ARCHITECTURE-SPEC.md | COMPLETE |
| ART-08 | Canonical Data Model | SB-08-CANONICAL-DATA-MODEL.md | COMPLETE |
| ART-11 | Journey Rod & Scenario Model | SB-11-JOURNEY-ROD-SCENARIO-MODEL.md | COMPLETE |
| ART-12 | Journey Specifications | SB-12-JOURNEY-SPECIFICATIONS.md | COMPLETE |
| ART-13 | Agent Architecture & Security Standard | SB-13-AGENT-SECURITY-STANDARD.md | COMPLETE |
| ART-16 | Claims & Evidence Model | SB-16-CLAIMS-EVIDENCE-MODEL.md | COMPLETE |
| ART-17 | Metric Registry | SB-17-METRIC-REGISTRY.csv | COMPLETE |
| ART-23 | Technical Architecture Specification | SB-23-TECHNICAL-ARCHITECTURE-SPEC.md | COMPLETE |
| ART-25 | Roadmap, Dependency & Readiness | SB-25-ROADMAP-DEPENDENCY-READINESS.md | COMPLETE |
| ART-05 | Enterprise Capability Hierarchy | SB-05 | **BLOCKED — OI-001** |
| ART-06 | Visual Identity & Brand Spec | SB-06 | **BLOCKED — brand skill refresh needed** |
| ART-09 | Atom Register (full) | SB-09 | BLOCKED — OI-001, OI-006, OI-007 |
| ART-10 | Relationship Register | SB-10 | COMPLETE |
| ART-14 | Distributed Source Standard | SB-14 | COMPLETE |
| ART-15 | Temporal Standard | SB-15 | COMPLETE |
| ART-18 | Attribution & Counterfactual Model | SB-18 | COMPLETE |
| ART-19 | Scenario Repository (full) | SB-19 | Pending — requires L3 expansion |
| ART-20 | Requirements Traceability Matrix | SB-20 | Pending |
| ART-21 | Test & Validation Repository | SB-21 | Pending |

---

## 4. Open Items Register

All open items that are actively blocking work. Sorted by priority.

### OI-001 — RLMM™ Stage Names ⚠️ CRITICAL

**Description:** The RLMM™ diagnostic model requires named maturity stages to be defined. Stage names are not yet confirmed.

**Blocks:**
- ART-05 (Enterprise Capability Hierarchy)
- ART-09 (Atom Register — RLMM atoms cannot be assigned without stages)
- RLMM interactive diagnostic app (cannot be built without stages)
- SB-04 Terminology Crosswalk (RLMM row is marked Candidate — stage names field empty)

**Decision needed from:** Betsy
**Format:** How many stages? What are their names? (Reference: CMMI uses 5 levels; APQC uses maturity bands; ASQ/ISO uses compliance tiers)
**Candidate answer (SB-SR-001):** 6-level Evidence Maturity model from SRC-021 — 0 Asserted, 1 Defined, 2 Reproducible, 3 Reconciled, 4 Explainable, 5 Outcome Validated.

---

### OI-002 — MESS Dual-Use Naming

**Description:** "MESS" appears at both Tier 2 (MES Subsidiaries LLC) and Tier 4 (MESS Platforms product suite). This creates potential confusion in legal, brand, and sales contexts.

**Options:**
1. Accept dual use — MESS is context-disambiguated
2. Rename MESS Platforms to a distinct sub-brand
3. Confirm MESS Platforms is a colloquial internal reference only, not used externally

**Decision needed from:** Betsy

---

### OI-003 — MES Solutions LLC Acronym Expansion

**Description:** MES Solutions' "S" is confirmed as "Solutions." However, one of the four MESS acronym meanings uses "Scaling" (Measured Enterprise Scaling Solutions) while MES Solutions uses "Success" (Measured Enterprise Success Solutions). These are internally inconsistent if Betsy intends them to share a root expansion.

**Decision needed from:** Betsy — is "MES" consistently "Measured Enterprise S___" across the hierarchy, and if so, what does the S stand for?

---

### OI-004 — HOS™ Domain / Subdomain

**Description:** Where does HOS™ live? Options:
1. hos.saltbasin.net (subdomain)
2. saltbasinhighways.com or saltbasinhos.com (separate domain)
3. saltbasin.net/hos (path-based)

**Impacts:** Supabase project structure, Vercel project configuration, branding consistency

**Decision needed from:** Betsy

---

### OI-005 — HERQ Series

**Description:** HERQ (Hot Elephant Resident Question) is a content framework and series format. Status: test run of format/visual language completed. Decision pending on whether to continue HERQ as its own series or fold into the Salt Basin thought leadership structure.

**Decision needed from:** Betsy

---

### OI-006 — SaltBridge Function Definition

**Description:** SaltBridge is a confirmed MES Solutions product by name. Function, target customer, and value proposition have not been defined.

**Decision needed from:** Betsy

---

### OI-007 — SaltChannels Function Definition

**Description:** SaltChannels is a confirmed MES Solutions product by name. Function, target customer, and value proposition have not been defined. Name suggests channel/distribution relevance — but this must not be assumed.

**Decision needed from:** Betsy

---

### OI-008 — Salt Covenant Solutions Function Definition

**Description:** Salt Covenant Solutions is confirmed as extending the covenant-of-salt lore from SaltTide into debt/credit solutions. Function, target customer, and product structure beyond this thematic framing have not been defined.

**Decision needed from:** Betsy

---

### OI-009 — Monorepo vs. Multi-Repo

**Description:** Should BestyStaff, HOS™, and SaltTide™ share a single repository (monorepo) or live in separate repos? Monorepo simplifies shared Supabase types and RLS policy management.

**Decision needed from:** Betsy (with technical input from development partner)

---

### OI-010 — Supabase Instance Sharing

**Description:** Should all three products (BestyStaff, HOS™, SaltTide™) share one Supabase instance with RLS-based isolation, or have separate instances?

**Trade-off:** Shared = lower cost, simpler auth management; Separate = stronger tenant isolation, cleaner compliance posture for SaltTide (FCRA/PCI)

**Decision needed from:** Betsy

---

### OI-011 — HOS™ Multi-Tenant Model

**Description:** In HOS™, who is the tenant? Options:
1. PE fund is the root tenant; portcos are sub-tenants within the fund
2. Portco is the root tenant; fund admin has read access upward
3. Hybrid: portco is operational tenant; fund admin push is a separate integration layer

**Impacts:** Supabase schema structure, RLS policy design, Fund Admin Upward Data Push architecture

**Decision needed from:** Betsy + architecture review

---

### OI-012 — Mobile-First CI/CD Pipeline

**Description:** Betsy develops from her phone. The CI/CD pipeline (Vercel deployments, Supabase migrations) must be operable from a mobile device. What tooling supports this? (Options: Vercel mobile dashboard, GitHub Actions triggered via mobile, etc.)

**Decision needed from:** Implementation review with development partner

---

## 5. Dependency Graph

```
OI-001 (RLMM stages)
    ├──► ART-05 (Enterprise Capability Hierarchy)
    ├──► ART-09 (Atom Register — RLMM atoms)
    └──► RLMM interactive app

OI-004 (HOS domain)
    └──► ART-23 deployment / Vercel config

OI-006 + OI-007 + OI-008
    └──► ART-09 (Atom Register — SaltBridge, SaltChannels, Covenant atoms)

Seed Capital (SaltTide)
    ├──► Experian/FICO agreements
    ├──► Card network agreements
    └──► SaltTide technical build

OI-011 (HOS multi-tenant model)
    ├──► Supabase schema design
    └──► Fund Admin connector implementation

RLMM stages + Brand Skill Refresh
    └──► ART-06 (Visual Identity spec)

All ART-1X artifacts (14, 15, 18)
    └──► ART-20 (Requirements Traceability Matrix)

ART-20 (RTM)
    └──► ART-21 (Test & Validation Repository)
```

---

## 6. Recommended Sequencing

### Immediate — No Blockers

These items can be executed now without waiting for any open item:

| Priority | Item | Why Now |
|---|---|---|
| 1 | Resolve OI-001 (RLMM stage names) | Single decision unlocks RLMM app + ART-05 + ART-09 |
| 2 | Scaffold BestyStaff agent security RLS policies | Stack is live; policies just need to be written |
| 3 | Build ART-14 (Distributed Source Standard) | No open item blockers |
| 4 | Build ART-15 (Temporal Standard) | No open item blockers |
| 5 | Build ART-10 (Relationship Register) | No open item blockers |
| 6 | Resolve OI-002 (MESS dual-use) | Low-effort decision; clears naming ambiguity |
| 7 | Resolve OI-003 (MES Solutions acronym S) | Low-effort decision; clears terminology inconsistency |

### Near-Term — Single Decision Required

| Priority | Item | Blocker |
|---|---|---|
| 1 | RLMM interactive app | OI-001 |
| 2 | ART-05 (Enterprise Capability Hierarchy) | OI-001 |
| 3 | ART-06 (Visual Identity spec / brand skill refresh) | Brand skill is read-only in session — user must apply |
| 4 | HOS™ deployment scaffold (Vite + Supabase + Vercel) | OI-004 |
| 5 | SaltBridge / SaltChannels definition | OI-006, OI-007 |

### Blocked — Multiple Dependencies

| Priority | Item | Blockers |
|---|---|---|
| 1 | SaltTide technical build | Seed capital + vendor agreements |
| 2 | HOS™ rail connectors | Vendor API agreements + OI-011 |
| 3 | ART-20 (Requirements Traceability Matrix) | ART-14, ART-15, ART-18 must complete first |
| 4 | ART-21 (Test & Validation Repository) | ART-20 must complete first |

---

## 7. Change Log

| Version | Date | Change | Authority |
|---|---|---|---|
| 1.0 | July 15, 2026 | Initial creation — Tier 2 canonical artifact build | SRC-000 canonical synthesis directive |
