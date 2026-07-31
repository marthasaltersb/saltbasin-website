# SALT BASIN HOLDINGS — LAYER ARCHITECTURE SPECIFICATION
## ART-07 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: Synthesized from SRC-001, SRC-003, SRC-006, SRC-007, SRC-009, SRC-011, SRC-012

---

## Purpose

This specification defines the Salt Basin platform architecture as a layered stack from raw distributed sources through governed intelligence to the user-facing interface. It distinguishes between current implemented state and target architecture. It governs how all products, agents, data objects, and services relate to one another structurally.

**Key architectural principle (from SRC-001):** Salt Basin orchestrates existing rails and distributed systems rather than assuming all data must be centralized. The Salt Basin Layer operates as a governed aggregation, normalization, and semantic-projection layer across distributed sources.

---

## Layer Map Overview

```
┌──────────────────────────────────────────────────────────┐
│  LAYER 10 — UI / EXPERIENCE / 3D WORLD                   │
│  BestyStaff · saltbasin.net · HOS™ UI · SaltTide UX     │
├──────────────────────────────────────────────────────────┤
│  LAYER 9 — AGENT ORCHESTRATION                           │
│  BestyStaff · BestyStaff Revenue · BestyStaff Customer  │
├──────────────────────────────────────────────────────────┤
│  LAYER 8 — CLAIMS, EVIDENCE & METRIC GOVERNANCE          │
│  Business Outcome Evidence Maturity · Attribution Model  │
├──────────────────────────────────────────────────────────┤
│  LAYER 7 — VISUALIZATION & SEMANTIC PROJECTION           │
│  Path-Color Registry · Crystal/Molecule Visual Layer     │
├──────────────────────────────────────────────────────────┤
│  LAYER 6 — JOURNEY ROD EXECUTION ENGINE (EIDOS)          │
│  L2/L3 Scenarios · Rod Events · Tributary Routing        │
├──────────────────────────────────────────────────────────┤
│  LAYER 5 — SALT BASIN INTELLIGENCE LAYER (SB-IL)         │
│  Highway Vision™ · Route Intelligence Engine™            │
│  Eligibility Engine · Override / Recommendation /        │
│  Explainability Engines · Knowledge Graph · Cache        │
├──────────────────────────────────────────────────────────┤
│  LAYER 4 — MOLECULE / ATOM GOVERNANCE                    │
│  Governed Molecules · Crystal Atoms · Magnetic Fields    │
├──────────────────────────────────────────────────────────┤
│  LAYER 3 — SEMANTIC NORMALIZATION (SALT BASIN LAYER)     │
│  Canonical Schema Projection · Terminology Governance    │
│  Identity Graph · Temporal Versioning · Lineage          │
├──────────────────────────────────────────────────────────┤
│  LAYER 2 — TRUSTED DATA REGISTRIES                       │
│  Contract Registry · Ownership Registry · Debt Registry  │
│  Revenue Registry · ASC 606 Ledger · Covenant Layer      │
├──────────────────────────────────────────────────────────┤
│  LAYER 1 — INTEGRATION / RAIL CONNECTORS                 │
│  Salesforce · Zuora · NetSuite · QuickBooks · SAP        │
│  Oracle · Workday · Allvue · iLevel · PitchBook          │
│  Blockchain · Public Court Records · Property Appraiser  │
├──────────────────────────────────────────────────────────┤
│  LAYER 0 — RAW DISTRIBUTED SOURCES                       │
│  CRM Events · Contract Docs · Billing Transactions       │
│  Metering Streams · Payment Records · Property Data      │
│  Credit Data · Bankruptcy Records · Card Transactions    │
└──────────────────────────────────────────────────────────┘
```

---

## Layer Specifications

### LAYER 0 — Raw Distributed Sources

**Definition:** The original, ungoverned data at its point of origin. Salt Basin does not own, store, or centralize these unless contractually required. They are accessed at query time through Layer 1 connectors.

**Principle:** These sources remain distributed. Salt Basin reads, does not replicate unless caching is required for performance.

**Source categories:**

| Category | Examples | Product Relevance |
|---|---|---|
| CRM Events | Salesforce opportunities, lead records, pipeline stages | HOS™ (Q2R Layer 1 — Prospect & Pipeline) |
| Contract Documents | MSAs, SOWs, order forms, amendments | HOS™ (Q2R Layer 5 — Contract Execute) |
| Billing Transactions | Zuora, Stripe, usage events, metering logs | HOS™ (Q2R Layers 7–8 — Bill & Collect) |
| Metering Streams | CPQ consumption, API call logs, usage APIs | HOS™ (Q2R Layer 3 — Solution Design through Metering) |
| Payment / AR Records | NetSuite, QuickBooks, ACH confirmations | HOS™ (Q2R Layer 9 — Collect) |
| Revenue Recognition Entries | ERP journals, ASC 606 schedules | HOS™ (Q2R Layer 10 — Rev Close) |
| Consumer Card Transactions | Card network transaction data | SaltTide™ (routing intelligence inputs) |
| Consumer Credit Data | FICO, behavioral signals, CFPB-regulated data | SaltTide™ (financial DNA engine) |
| Property Records | County property appraiser, tax rolls | Salt Basin Asset Intelligence (early phase) |
| Court Records | Clerk of Court filings (foreclosure, eviction) | Salt Basin Asset Intelligence (early phase) |
| Blockchain Transactions | Wallet activity, mining data | Salt Basin Asset Intelligence (future) |

---

### LAYER 1 — Integration / Rail Connectors

**Definition:** The adapter layer connecting Salt Basin to the existing rails. Salt Basin orchestrates existing systems rather than replacing them. Connectors read from (and in governed cases write back to) operational systems.

**Principle (from SRC-001):** "We leverage existing rails. We reveal better routes."

**HOS™ connector targets (operational systems — portco-level):**

| System | Category | Q2R Handover Points |
|---|---|---|
| Salesforce | CRM / Pipeline | Prospect, Qualify, Solution Design, Negotiate |
| Zuora | Billing / Subscription | Contract Execute, Metering, Bill |
| NetSuite | ERP / AR | Bill, Collect, Rev Close |
| QuickBooks | Accounting (SMB) | Bill, Collect, Rev Close |
| SAP | ERP (Enterprise) | Contract Execute through Rev Close |
| Oracle | ERP (Enterprise) | Contract Execute through Rev Close |
| Workday | HCM / PS Management | PS Management |

**HOS™ connector targets (fund admin — upward push):**

| System | Category | Data Flow Direction |
|---|---|---|
| Allvue | Fund Admin | ← HOS™ pushes clean deal-anchored data upward |
| iLevel | Portfolio Monitoring | ← HOS™ pushes ARR, EBITDA, pipeline data |
| PitchBook | Deal Data | ← HOS™ pushes portfolio company metrics |

⚠️ **Risk flag:** Silver Lake's 2025 acquisition of Zuora ($1.7B) — potential changes to Zuora API access / partnership terms. Monitor.

**SaltTide™ connector targets:**

| System | Category | Purpose |
|---|---|---|
| Card Networks | Transaction data | Routing intelligence inputs |
| CFPB Data | Regulatory | Compliance monitoring (Circular 2024-07) |
| Experian / FICO | Credit bureau | Financial DNA scoring |
| Rewards platforms | Issuer APIs | Rewards forfeiture detection |

---

### LAYER 2 — Trusted Data Registries

**Definition:** Governed, validated reference registries that give Layer 3 and above a single authoritative view of key business objects. Not raw transactional data — curated, validated, and versioned.

| Registry | Purpose | HOS™ / SaltTide™ Relevance |
|---|---|---|
| Contract Registry | Master contract record — immutable originating record layer | HOS™ core — executed contract is single source of truth every downstream event traces to |
| Revenue Registry | ASC 606-compliant revenue recognition schedules | HOS™ Rev Close layer |
| Billing Registry | Invoice-of-record with metering lineage | HOS™ Bill layer |
| Customer / Counterparty Registry | Identity-resolved account hierarchy | Both products |
| Debt Registry | Outstanding obligations, payment history, settlement terms | SaltTide™, Salt Covenant Solutions |
| Ownership Registry | Property ownership, corporate entity graph | Salt Basin Asset Intelligence |
| Covenant Layer | Debt covenants, credit terms, repayment conditions | HOS™ PE Deal Lifecycle, Salt Covenant Solutions |
| ABS / Cash Flow Registry | Securitization reports, portfolio cash flow validation | Salt Basin Asset Intelligence (future) |

**Architectural note:** The Contract Registry is architecturally separate from the operational performance layer. The immutable originating record does not change when billing runs, disputes occur, or amendments are filed — amendments create new versioned records that trace back to the original.

---

### LAYER 3 — Semantic Normalization (The Salt Basin Layer)

**Definition:** The governed aggregation, normalization, and semantic-projection layer. This is the core architectural differentiator — it sits above the distributed sources and imposes canonical schema without forcing centralization of the underlying data.

**Functions:**

| Function | Description |
|---|---|
| Canonical Schema Projection | Maps raw source fields to canonical terminology (Crosswalk ART-04) |
| Terminology Governance | Enforces canonical term usage; flags legacy/deprecated terms at ingestion |
| Identity Graph | Resolves the same real-world entity across multiple source systems (Bill-To Party in NetSuite = Account in Salesforce = Customer in Zuora) |
| Temporal Versioning | Every governed object carries: created timestamp, effective date, expiry date, superseded-by pointer, version chain |
| Lineage Tracking | Every derived value traces to its source event, generation rule, and version |
| Source Authority Enforcement | Applies the authority hierarchy (SRC-001, explicit user decisions > approved artifacts > implementation evidence) |

**Canonical schema rules:**
- Branch maps to Tributary only where lateral-connection semantics are correct
- Merge maps to Confluence only where convergence semantics are correct
- No permanent identifier (Scenario_ID, Rod ID, Molecule name) is ever repurposed
- Generated transactions retain: source event / generation rule / version lineage

---

### LAYER 4 — Molecule / Atom Governance

**Definition:** The governed metadata unit layer. Atoms are the smallest bounded governed evidence units. Molecules are governed compositions. Magnetic Fields are the convergence rules.

**Object hierarchy:**

```
Molecule
  ├── Atom (1..n per molecule — each atom belongs to EXACTLY ONE molecule)
  ├── Magnetic Field (convergence rule pulling atoms into this molecule)
  └── Visual Semantic (crystal pillar / path-color assignment)
```

**Canonical molecules (from SRC-003):**

| Molecule | Purpose | Atoms (examples) |
|---|---|---|
| Customer Identity | Master data | Bill-To Party, District Code, Account Hierarchy |
| Pricing | Commercial terms | Subscription Fee, Visit CPT Rate, Tier Threshold, Overage Rate |
| Contract | Agreement | Contract Start Date, ACV/TCV, Signatory Authority, Governing Law |
| Revenue Recognition | Accounting | Recognition Method, Performance Obligation, Transaction Price |

**Validation rule:** Every atom must be assigned to exactly one molecule. Orphan atoms = data model violation.

**Crystal atom visual semantics:** Each atom is rendered as a bounded crystal (confetti-shaped, irregular, hue-graded per path-color registry). Molecules are crystal clusters with a governing path color.

---

### LAYER 5 — Salt Basin Intelligence Layer (SB-IL)

**Definition:** The intelligence and routing layer. This is where Salt Basin Highways™ technology lives — it reads the canonical governed data from Layers 3–4 and produces routing decisions, recommendations, eligibility determinations, and explanations.

**Components of Salt Basin Highways™ (all are architecture — not yet implemented):**

| Component | Function | Product Application |
|---|---|---|
| Highway Vision™ | End-state routing visualization — shows the "desired world" view of where every dollar/customer/risk should flow | HOS™ reporting layer; SaltTide™ routing output |
| Monetary River System™ | Cash flow modeling and routing across channels | HOS™ Rev Close; SaltTide™ balance optimization |
| Route Intelligence Engine™ | Core routing logic — evaluates paths, constraints, and cost of waiting | SaltTide™ card routing; HOS™ pipeline risk scoring |
| Eligibility Engine | Reads financial DNA / contract terms to determine eligibility for each route | SaltTide™ (card eligibility); HOS™ (recognition eligibility) |
| Override Engine | Governed exception handling — allows human or agent override with full audit trail | Both products |
| Recommendation Engine | Surfaces the optimal next action with confidence score | BestyStaff; HOS™ Deal Readiness Bot; SaltTide™ UX |
| Explainability Engine | Produces human-readable rationale for every routing decision | All products — required for regulatory contexts (CFPB, ASC 606) |
| Knowledge Graph | Semantic network of entities, relationships, and historical patterns | Underlying all engines |
| Learning & Cache | Session state, pattern learning, incomplete session persistence | BestyStaff (loop-back logic); RLMM™ diagnostic app |

---

### LAYER 6 — Journey Rod Execution Engine (EIDOS)

**Definition:** The scenario execution layer. EIDOS (Salt Basin Enterprise Intelligent Data Orchestration System — expansion unconfirmed) manages the traversal of Journey Rods through L2 and L3 scenarios, routing events through tributaries, and tracking state transitions.

**Three canonical journey rods (parallel and interdependent):**

| Rod | Domain | Entry Point | Exit Point |
|---|---|---|---|
| Revenue Lifecycle Rod | Commercial | Lead Qualified | Cash Collected + Renewal |
| Customer Journey Rod | Lifecycle | First Contact | Retention / Expansion / Churn |
| Member Journey Rod | Organizations/Students | Enrollment / Onboarding | Active Member / Outcome |

**Q2R 11-step process (HOS™ — Revenue Lifecycle Rod implementation):**

1. Prospect & Pipeline → 2. Qualify & Discovery → 3. Solution Design & Scope → 4. Negotiate → 5. Contract Execute → 6. Onboard → 7. Deliver → 8. Bill → 9. Collect → 10. Rev Close → 11. Renew

**EIDOS Scenario Repository (from SRC-005):** 500+ initial L2 scenarios seeded across Revenue Lifecycle, Customer Journey, and Member Journey rods. Each L2 scenario expands into one complete L3 end-to-end journey.

---

### LAYER 7 — Visualization & Semantic Projection

**Definition:** The rendering layer. Transforms governed data into visual representations using the canonical visual semantics. The UI renders governed state — it does not own commercial, accounting, evidence, or calculation logic.

**Six named graphic metaphors (canonical):**

| Metaphor | Use Case | Visual Description |
|---|---|---|
| River Flow | Payments, cash flow, revenue streams | Flowing continuous lines |
| Tributaries | Cross-rod connections, data ingestion from side sources | Branching laterals feeding main channel |
| Confluence | System architecture, where tributaries merge | Converging flows at a point |
| Crystal Pillars | Metadata chips, evidence units, atom visualization | Faceted columns with hue-gradient |
| Blueprint Grid | Technical specs, process flow architecture | Structured grid with precise connectors |
| Constellation | Relationship maps, knowledge graphs, multi-entity networks | Connected nodes on dark field |

**Path-color rules:**
- Every unique classification path receives a persistent global path color
- Path colors do not change once assigned
- Visual representations must always use the governed path color for that rod/domain

---

### LAYER 8 — Claims, Evidence & Metric Governance

**Definition:** The accountability layer. Every business claim is connected to: definitions / evidence requirements / attribution / counterfactuals / confidence / limitations / outcome observations.

**Business Outcome Evidence Maturity framework:** The preferred framing for data/operational maturity assessment across all Salt Basin products. Do not revert to generic "data maturity assessment" language.

**Evidence maturity dimensions (HOS™ Data Readiness Scorecard):**
1. Data Infrastructure
2. Chart of Accounts Integrity
3. Reporting Capability
4. Operational Metric Alignment
5. Deal Economics Readiness
6. Exit Readiness

**Claims governance rules:**
- No statistical claim may be stated without its primary source, year, and exact figure
- Never conflate separate statistics (e.g., unredeemed rewards ≠ rewards forfeited ≠ interest paid)
- Percentage exposure figures are flagged as industry estimates requiring primary-source validation before use in PE-facing deliverables
- All figures in investor materials are 2026-dated from primary sources only

---

### LAYER 9 — Agent Orchestration

**Definition:** The agent execution layer. Agents are bounded actors with defined scope, source access, transformation permissions, retention rules, exposure rules, and action permissions.

**Agent-centric security principle:** Security is agent-centric as well as user-aware. User identity and permissions determine what an agent may expose, query, propose, stage, or commit.

**Canonical agents (from SRC-003):**

| Agent | Scope | Parent | Read | Write |
|---|---|---|---|---|
| BestyStaff Revenue | Revenue Rod | Enterprise | Y | Stage/Commit |
| BestyStaff Customer | Customer Rod | Revenue | Y | Suggest |

**HOS™ AI bots (from SRC-001, Revenue Engine OS v2):**

| Bot | Function |
|---|---|
| Deal Readiness Bot | Pre-acquisition diligence readiness scoring |
| Diligence Bot | QoE data extraction and gap flagging |
| Portfolio Health Bot | Hold-period monitoring and alert generation |

**BestyStaff architecture (canonical):**
- Intake sequencing → delayed-response logic (9-second deliberate delay) → loop-back architecture → persistent state management → returning-user recognition
- Never claims licensure · Always asks permission before retaining information

---

### LAYER 10 — UI / Experience / 3D World

**Definition:** The user-facing layer. Renders governed state from Layers 3–9. Does not own or recalculate commercial, accounting, evidence, or business logic.

**Current implementations:**

| Surface | Status | Tech Stack |
|---|---|---|
| saltbasin.net | Live | Custom-built, Netlify/Render hosted |
| BestyStaff intake agent | Live | Deployed on saltbasin.net |
| Admin CMS | Live | Live split-screen preview, page/section management, draft/live controls |
| HOS™ UI artifacts | Working material | Vite + Supabase + Vercel; USE_LIVE_DATA config toggle |
| SaltTide™ UX | Design/pitch only | Not implemented |

**UI design constraints (from SRC-001):**
- Strategic Operator palette for all enterprise/PE-facing surfaces
- Card components: dark background, gold top-border accent, cream text
- Status/risk badges: pill-shaped, color-coded (red/gold/green)
- Data tables: sortable, left-side color indicator per row
- Motion: subtle fade-ins only — no bounce or playful animations in enterprise surfaces
- Command center layout: sidebar nav (dark) + main content (slightly lighter navy)

---

## Architecture Constraints (Preserved from Build Prompt)

1. Salt Basin orchestrates existing rails — does not assume centralization
2. Salt Basin Layer operates as governed aggregation/normalization/semantic-projection across distributed sources
3. Security is agent-centric AND user-aware
4. Each agent has bounded: source access / transformation permissions / retention rules / exposure rules / action permissions
5. Journey Rods, tributaries, agents, evidence, definitions, validations, and temporal states must preserve lineage
6. Revenue Lifecycle, Customer Journey, and Member Journey Rods are parallel and interdependent
7. Crystal atoms = bounded governed metadata/evidence units
8. Molecules = governed compositions or capability groupings
9. Every unique classification path receives a persistent global path color
10. Business claims remain connected to definitions, evidence requirements, attribution, counterfactuals, confidence, limitations, and outcome observations
11. Business Outcome Evidence Maturity = preferred framing (not generic data maturity)
12. Capital/financing partner pipelines remain distinct from investment-banking/CIM/exit-partner pipelines
13. Permanent identifiers (Scenario_IDs) are never repurposed
14. Generated transactions retain source event, generation rule, and version lineage
15. The UI renders governed state — it does not become the ungoverned owner of commercial, accounting, evidence, or calculation logic

---

## Current State vs. Target Architecture

| Component | Current State | Target State | Gap |
|---|---|---|---|
| Layer 0 Sources | Real estate (Pinellas/Hillsborough) + consumer credit data mapped | All source categories in scope | Consumer debt, corporate financials, card network connections not yet connected |
| Layer 1 Connectors | Conceptual mappings in worksheets | Live API connectors to Salesforce, Zuora, NetSuite, Allvue | None built |
| Layer 2 Registries | Contract registry concept defined in HOS™ specs | Operational registries with versioning | None built |
| Layer 3 Salt Basin Layer | Schema projection standard documented in crosswalk | Running normalization service | Not built |
| Layer 4 Molecules/Atoms | Defined in Workbook 001A | Full atom register with validation engine | Partially defined |
| Layer 5 SB-IL Engines | Named and functionally described | Running eligibility/routing/explainability engines | Architecture only |
| Layer 6 EIDOS | 500 L2 scenarios seeded | Full L3 scenario execution with real-time traversal | Scenarios seeded; execution engine not built |
| Layer 7 Visualization | Visual semantics defined; React artifacts built | Full path-color governed render layer | Design done; no production render engine |
| Layer 8 Claims/Evidence | Business Outcome Evidence Maturity defined; data readiness scorecard exists | Automated evidence collection and maturity scoring | Framework only |
| Layer 9 Agents | BestyStaff live (intake agent); HOS™ bots designed | Full agent registry with permission enforcement | BestyStaff only live |
| Layer 10 UI | saltbasin.net live; BestyStaff live; HOS™ worksheets | Full product UIs for HOS™ and SaltTide™ | Only marketing/intake layer live |
