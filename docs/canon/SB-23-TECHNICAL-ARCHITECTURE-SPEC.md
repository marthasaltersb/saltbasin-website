# SALT BASIN — TECHNICAL ARCHITECTURE SPECIFICATION
## ART-23 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-001, SRC-003, SRC-010, SRC-011

---

## Purpose

This document specifies the technical architecture for all Salt Basin-deployed systems — current implementations and target architecture. It covers the deployment stack for each product, web infrastructure, integration layers, and implementation constraints.

**Critical distinction (from SRC-000):** The UI renders governed state; it must not become the ungoverned owner of commercial, accounting, evidence, or calculation logic. Architecture decisions must be evaluated against this constraint.

---

## 1. Current Implementation Status

### What Is Live

| System | Status | URL | Stack |
|---|---|---|---|
| saltbasin.net | Live | saltbasin.net | Vite + Supabase + Vercel |
| BestyStaff | Live | saltbasin.net (embedded) | Vite + Supabase + Vercel |
| HOS™ worksheets | Live — Google Sheets | Internal | Google Sheets (interim) |
| SaltTide™ | Design only | — | Not yet deployed |

### What Is Architecture Only (Not Yet Built)

| System | Architecture State |
|---|---|
| Salt Basin Highways™ (all 9 sub-engines) | Architecture — not built |
| HOS™ Intelligence Layer (AI bots) | Architecture — not built |
| SaltBridge | Undefined — name confirmed, function TBD |
| SaltChannels | Undefined — name confirmed, function TBD |
| Salt Covenant Solutions | Undefined beyond name |
| EIDOS execution engine | Scenario repository seeded (SRC-005); execution engine not built |
| RLMM interactive diagnostic app | Blocked on OI-001 (stage name finalization) |

---

## 2. Core Deployment Stack

### saltbasin.net and BestyStaff

**Runtime:** Vite (frontend build tool)
**Backend / BaaS:** Supabase
**Hosting / CDN:** Vercel

#### Vite (Frontend)

Vite provides:
- Fast dev server with hot module replacement
- Production build with tree-shaking and code splitting
- TypeScript support
- First-class React integration

**Constraint (from SRC-001):** Betsy codes only from her phone. The development environment and deployment pipeline must be operable from a mobile device.

#### Supabase (Backend as a Service)

Supabase provides:
- PostgreSQL database (managed)
- Row-level security (RLS) — agent-centric security model at the database layer
- Auth (Supabase Auth — email/magic link minimum)
- Realtime subscriptions
- Storage (file attachments)
- Edge functions (Deno runtime)

**Security mapping:** Supabase Row-Level Security policies are the implementation mechanism for the agent-centric permission model defined in ART-13. Every agent permission (read / suggest / stage / commit) must map to an RLS policy governing which rows that agent's session token can access, modify, or delete.

**BestyStaff data persistence:**
- User name memory: stored in Supabase user profile table
- Incomplete session state: stored in Supabase edge state or session table with status `in_progress`
- Permission before retention: Supabase RLS + application-layer gate — agent does not write to user data table until explicit user confirmation received
- 9-second response delay: implemented at application layer (setTimeout / async flow control), not at database layer

#### Vercel (Hosting)

Vercel provides:
- Edge network CDN
- Automatic HTTPS / TLS
- Preview deployments per branch
- Serverless functions (Node.js runtime) — used for any API routes that cannot be handled via Supabase Edge Functions

---

## 3. BestyStaff Technical Architecture

### Core Design Patterns

**Pattern 1: Intake Sequencing**
BestyStaff presents a full intake form before beginning any substantive response. The intake form captures:
- User identity (name — remembered on return)
- Session objective
- Decision or question type
- Any relevant context the user wishes to provide

The intake form state is stored in application memory during the session. If the session is incomplete, the state is persisted to Supabase for loop-back retrieval.

**Pattern 2: Delayed-Response Logic**
```
User submits intake form or message
  → Application begins processing
  → 9-second timer starts (setTimeout or equivalent)
  → Progress bar renders during delay
  → Response delivered at timer completion
```

Rationale from SRC-001: The delay encourages completeness of user input. A too-fast response limits how much the person shares. This is a deliberate UX feature — never optimize it away.

**Pattern 3: Loop-Back Architecture**
```
Session state = {
  session_id: UUID,
  user_id: UUID,
  status: 'in_progress' | 'complete' | 'abandoned',
  intake_data: { ... },
  decisions_tracker: [ ... ],
  questions_tracker: [ ... ],
  last_updated: timestamp
}
```

On return visit:
- BestyStaff recognizes returning user (by name from stored profile)
- Checks for `in_progress` sessions
- Offers to resume incomplete session before starting new intake

**Pattern 4: Permission-Before-Retention Gate**
```
if (agentWantsToRetainData) {
  await requestUserPermission(dataDescription)
  if (permissionGranted) {
    await supabase.from('user_data').insert(payload)
  } else {
    // Do not persist — drop from state at session close
  }
}
```

### BestyStaff Component Architecture (Target)

```
saltbasin.net
├── /                       Landing page
├── /besty                  BestyStaff entry point
│   ├── IntakeForm          Full intake form component
│   ├── ProgressBar         9-second delay progress indicator
│   ├── ResponsePanel       Main response rendering
│   ├── DecisionTracker     Tracks decisions made in session
│   ├── QuestionTracker     Tracks unresolved questions
│   └── SessionResumeModal  Loop-back session resume dialog
└── /admin                  Internal admin (Betsy only)
    └── SessionDashboard    View/manage BestyStaff sessions
```

---

## 4. HOS™ Technical Architecture (Target)

### Current State

HOS™ currently operates primarily through Google Sheets worksheets. These are interim delivery vehicles — governed data lives outside the worksheets.

**Interim stack:**
- Google Sheets: client-facing worksheets for Q2R tracking
- HOS™ AI bots: architecture only — not yet implemented
- Fund Admin Upward Data Push: architecture only

### Target State

```
HOS™ Target Architecture

[Layer 0-2: Source Data]
  ├── CRM (Salesforce) ──────────┐
  ├── Billing (Zuora / Stripe) ──┼──► [Rail Connectors — Layer 1]
  ├── ERP (NetSuite / SAP) ──────┤       ↓
  ├── Contract system ────────────┘  [Contract Registry — Layer 2]
  └── Fund Admin (Allvue / iLevel / PitchBook)   [Revenue Registry]
                                                  [Billing Registry]
                                                       ↓
[Layer 3: Salt Basin Layer]
  Canonical schema projection
  Terminology governance
  Identity graph
  Temporal versioning
  Lineage tracking
       ↓
[Layer 5: Salt Basin Highways™ / Intelligence Layer]
  Route Intelligence Engine™
  Eligibility Engine
  Recommendation Engine
  Explainability Engine
       ↓
[Layer 6: EIDOS / Journey Rod Execution]
  L2/L3 scenario routing
  Q2R step state tracking
  Rod event sequencing
       ↓
[Layer 9: HOS™ AI Bots]
  ├── Deal Readiness Bot (AGT-003)
  ├── Diligence Bot (AGT-004)
  └── Portfolio Health Bot (AGT-005)
       ↓
[Layer 10: HOS™ UI]
  Q2R dashboard
  Fund Admin data push interface
  QoE evidence package generator
```

### Fund Admin Upward Data Push — Architecture

This is HOS™'s core differentiator. The architecture:

```
[Portco operational system]
      |
      | (HOS™ connector — read access)
      ↓
[HOS™ Salt Basin Layer]
  Normalization to canonical schema
  Lineage tagging
  Deal-anchor mapping (contract → revenue → ARR)
      |
      | (Fund Admin connector — write access)
      ↓
[Allvue / iLevel / PitchBook]
  Clean deal-anchored data
  Pushed automatically at configured cadence
  No manual export / import / spreadsheet relay
```

**Timing risk (from SRC-001):** Silver Lake / Zuora acquisition represents a potential competitive build-out risk in this space. Monitor quarterly.

### HOS™ Deployment Stack (Target)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vite + React | Consistent with saltbasin.net stack |
| Backend | Supabase | RLS policies for agent-centric security |
| Hosting | Vercel | Consistent with saltbasin.net |
| Data connectors | Supabase Edge Functions (Deno) or serverless functions | One Edge Function per source connector |
| Contract registry | Supabase PostgreSQL | Immutable on write; temporal versioning via insert-only pattern |
| Revenue registry | Supabase PostgreSQL | Partitioned by portco |
| AI bots | Anthropic API or equivalent LLM API | Bounded by ART-13 agent security standard |
| Fund admin push | Allvue API / iLevel API / PitchBook API | Connector architecture — REST or proprietary API per vendor |

---

## 5. SaltTide™ Technical Architecture (Target)

### Product Function Recap

SaltTide reads a user's financial DNA to route them to the optimal credit card and card strategy. It carries zero credit risk on its own balance sheet.

### Integration Layer

```
[User Financial Data Input]
      |
      ↓
[SaltTide Intelligence Layer]
  ├── Card eligibility engine (reads user profile)
  ├── Card product database (cards, rates, rewards)
  ├── Routing algorithm (match user to optimal card)
  └── Strategy recommendation engine
      |
      ↓
[Card Networks / Partner APIs]
  ├── Experian / FICO (credit data)
  ├── CFPB data (regulatory)
  ├── Rewards platforms (partner data)
  └── Card issuer APIs (application routing)
      |
      ↓
[User Output: Recommendation + Application]
```

### Regulatory Architecture

| Regulatory Standard | Where Applied | Technical Implementation |
|---|---|---|
| FCRA | Credit data access | Permissioned credit pull; consent capture at data ingestion |
| CFPB Circular 2024-07 | Data handling | Data minimization; retention rules enforced at DB layer |
| PCI DSS | Payment card data | Card numbers never stored; tokenization mandatory |
| State consumer protection | User disclosures | Disclosure templates stored as governed content, not hardcoded |

### SaltTide Deployment Stack (Target)

| Component | Technology | Notes |
|---|---|---|
| Frontend | Vite + React | Consistent with enterprise stack |
| Backend | Supabase | RLS for user data; FCRA-compliant access controls |
| Hosting | Vercel | |
| Credit data | Experian / FICO API | Permissioned pull; logged for FCRA compliance |
| Card product database | Internal (Supabase) + partner feeds | Governed content — not hardcoded in UI |
| Rewards optimization | Internal engine | Salt Basin Highways™ Route Intelligence Engine (architecture) |
| Card application routing | Partner API per issuer | SaltTide routes, partner issuer processes |

---

## 6. Web Infrastructure

### saltbasin.net

**Current live stack:** Vite + Supabase + Vercel (confirmed in SRC-001)

**Domain:** saltbasin.net

**Architecture principle:** saltbasin.net is the primary live property. BestyStaff is embedded within saltbasin.net. HOS™ will ultimately be at a subdomain or separate property (TBD — see OI-004).

### Key Web Infrastructure Decisions

| Decision | Status | Notes |
|---|---|---|
| Monorepo vs. separate repos | TBD | If BestyStaff, HOS™, and SaltTide share Supabase instance, a monorepo approach simplifies RLS and auth management |
| Subdomain vs. separate domain for HOS™ | Open (OI-004) | hos.saltbasin.net vs. saltbasinhighways.com vs. dedicated domain |
| Multi-tenant vs. single-tenant for HOS™ | Target: multi-tenant (one instance, portco isolation via RLS) | Each PE portco is a tenant; fund admin is the tenant parent |
| Mobile-first development | Required | Betsy develops from phone — all tooling and CI/CD must support mobile-initiated deploys |

---

## 7. Data Model Technical Implementation

### Immutable Contract Registry

The executed contract is the single source of truth every downstream event traces back to. Technical implementation requirements:

```sql
-- Contracts table: insert-only (no updates, no deletes)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL UNIQUE,          -- business key
  portco_id UUID NOT NULL,
  counterparty_id UUID NOT NULL,
  contract_version INTEGER NOT NULL DEFAULT 1,
  executed_at TIMESTAMPTZ NOT NULL,
  contract_data JSONB NOT NULL,              -- machine-readable terms
  lineage_hash TEXT NOT NULL,                -- sha256 of contract_data
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: No UPDATE or DELETE — insert-only via policy
-- Modifications are new versions (contract_version increments)
-- Originating record is immutable
```

**Temporal versioning:** Contract modifications are new records (contract_version + 1) pointing to the originating contract_id. The original record is never modified.

### Lineage Tracking

Every derived record must carry lineage back to its originating contract:

```sql
-- Example: Revenue recognition record
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL REFERENCES contracts(contract_id),
  rod_id TEXT NOT NULL,                      -- Journey Rod
  scenario_id TEXT,                          -- EIDOS Scenario_ID
  event_type TEXT NOT NULL,
  amount NUMERIC(18,4),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  agent_id TEXT,                             -- which agent created this
  user_id UUID,                              -- which user authorized this
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
);
```

### Row-Level Security (Agent-Centric Permissions)

```sql
-- Example RLS policy for BestyStaff Customer (Read + Suggest only)
CREATE POLICY "agent_besty_customer_read"
ON customer_data
FOR SELECT
USING (
  auth.jwt() ->> 'agent_id' = 'AGT-002'   -- BestyStaff Customer
  AND auth.jwt() ->> 'scope' = 'CH-CUST'  -- Customer channel only
);

-- No INSERT/UPDATE/DELETE policy for AGT-002 — agent is read-only
```

---

## 8. Integration Architecture

### Connector Pattern

Every external system integration follows the Salt Basin connector pattern:

```
External System API
      |
      ↓ (Supabase Edge Function or Vercel serverless)
[Connector Layer]
  ├── Auth: API key or OAuth (stored in Supabase Vault — never in code)
  ├── Transform: Map external schema → Salt Basin canonical schema
  ├── Validate: Enforce canonical data types and required fields
  ├── Lineage: Tag every record with source_system, pull_timestamp, source_id
  └── Registry write: Insert into appropriate Salt Basin registry
      |
      ↓
[Salt Basin Registry (Supabase PostgreSQL)]
```

**Secret management:** API keys for all external connectors (Salesforce, Zuora, Allvue, Experian, etc.) stored in Supabase Vault. Never in environment variables in code. Never in client-accessible code.

### Target Connector Inventory

| Connector ID | System | Type | Direction | Status |
|---|---|---|---|---|
| CONN-001 | Salesforce | CRM | Read | Architecture |
| CONN-002 | Zuora | Billing/Subscription | Read | Architecture |
| CONN-003 | NetSuite | ERP | Read | Architecture |
| CONN-004 | QuickBooks | Accounting | Read | Architecture |
| CONN-005 | SAP | ERP | Read | Architecture |
| CONN-006 | Oracle Fusion | ERP | Read | Architecture |
| CONN-007 | Workday | HCM/Finance | Read | Architecture |
| CONN-008 | Allvue | Fund Admin | Read + Write (push) | Architecture |
| CONN-009 | iLevel | Fund Admin | Read + Write (push) | Architecture |
| CONN-010 | PitchBook | Portfolio Data | Read + Write (push) | Architecture |
| CONN-011 | Experian | Credit Data | Read | Architecture |
| CONN-012 | FICO | Credit Scoring | Read | Architecture |
| CONN-013 | CFPB Data | Regulatory | Read | Architecture |
| CONN-014 | Card Networks | Card Data | Read | Architecture |
| CONN-015 | Rewards Platforms | Partner Data | Read | Architecture |

---

## 9. Architectural Constraints (from SRC-000 Build Prompt)

All 15 architectural constraints from the original build directive are carried forward here:

1. The UI renders governed state — it must not become the ungoverned owner of commercial, accounting, evidence, or calculation logic.
2. Business claims must remain connected to definitions, evidence requirements, attribution, counterfactuals, confidence, limitations, and outcome observations.
3. Existing permanent identifiers (Scenario_IDs and all other permanent IDs) must never be repurposed.
4. Do not claim a system is built when it is architecture — never conflate design intent with production capability.
5. Agents are bounded actors — every agent has defined source access, transformation permissions, retention rules, exposure rules, and action permissions.
6. Tributary vs. branch semantics must be respected — do not blindly rename every legacy use.
7. The executed contract is the immutable originating record — all downstream state traces back to it.
8. Lineage is mandatory — every derived record must carry lineage to its source event and generation rule.
9. Agent lineage must be preserved — who invoked, what inputs, what time, what output.
10. No agent executes a financial transaction autonomously.
11. BestyStaff 9-second delay must not be optimized away — it is a deliberate UX feature.
12. Capital/financing partner pipelines must remain distinct from investment-banking/CIM/exit-partner pipelines.
13. API keys and secrets must never appear in client-accessible code or environment variables outside Supabase Vault.
14. The salt rendering and SaltTide™ visual mark specifications are non-negotiable — 4-sided confetti-shaped salt flakes; choppy disconnected wave segments; neck twist = DNA double helix.
15. Salt Basin Highways™ is a methodology and trademark layer — not a legal entity. Never present it as an entity in technical or legal contexts.

---

## 10. Open Technical Items

| OI_ID | Item | Blocked On | Priority |
|---|---|---|---|
| OI-004 | HOS™ domain/subdomain decision (hos.saltbasin.net vs. dedicated) | Betsy decision | High |
| OI-009 | Monorepo vs. multi-repo for BestyStaff + HOS™ + SaltTide™ | Betsy decision | Medium |
| OI-010 | Supabase instance: shared vs. separate per product | Betsy decision + cost model | Medium |
| OI-011 | HOS™ multi-tenant isolation model (portco as tenant vs. fund as tenant) | Architecture decision | High |
| OI-012 | Mobile-first CI/CD pipeline design for phone-based development | Implementation | High |
| OI-001 | RLMM stage names — blocks RLMM interactive app build | Betsy decision | High |
```

