# SALT BASIN — DISTRIBUTED SOURCE STANDARD
## ART-14 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-000, SRC-001, SRC-003, SRC-007

---

## Purpose

Salt Basin operates across distributed, heterogeneous source systems. This standard defines how raw sources are classified, trusted, connected, normalized, and governed before their data enters the Salt Basin layer. It enforces the principle that every piece of data in the governed layer must have a traceable, trustworthy source.

> **Constraint from SRC-000:** "Do not claim to have reviewed a source unless you actually accessed it." The same principle applies to data: do not claim to have received a source record unless it was actually ingested through a governed connector.

---

## 1. Source Tier Definitions

Every data source in the Salt Basin ecosystem is classified into one of four tiers based on its relationship to the originating business event and its governance level.

| Tier | Name | Description | Trust Level | Examples |
|---|---|---|---|---|
| T0 | Originating Record | The legal or contractual document that created the business event. The single most authoritative source. | Highest | Executed contract (PDF/DocuSign), ACH authorization, payment receipt |
| T1 | System of Record | The operational system designated as the authoritative source for a specific data domain. Directly connected via Rail Connector. | High | Salesforce (pipeline), Zuora (billing), NetSuite (GL/ERP), Allvue (fund admin) |
| T2 | System of Reference | A secondary system that holds useful reference data but is not the primary authority for any domain. May corroborate T1 data. | Medium | HubSpot (marketing), Slack (communication), spreadsheets, HOS™ Google Sheets |
| T3 | Derived / Computed | Data produced by a calculation, transformation, or inference over T0–T2 data. Never a raw source — always traceable back to its inputs. | Medium — requires lineage | Revenue recognition schedules, ARR calculations, portfolio metrics, agent outputs |
| T4 | External Reference | Third-party data feeds used for enrichment or validation. Not an internal system of record. | Low — requires corroboration | Experian/FICO (credit), CFPB data, PitchBook (market comps), news/public filings |

### Tier Assignment Rules

1. Every source used in the Salt Basin system must be explicitly assigned a tier.
2. A source's tier is fixed at registration — it may be promoted (e.g., T2 → T1) by explicit governance decision, but not demoted informally.
3. T3 data must always expose its computation path — a derived field without lineage to T0–T2 inputs is ungoverned.
4. T4 data must never be treated as authoritative without T0–T2 corroboration.

---

## 2. Source Authority Hierarchy

When two sources conflict on the same data point, the Source Authority Hierarchy determines which value is authoritative.

**Hierarchy (highest to lowest):**

1. **User explicit corrections and decisions** — Betsy's direct statement supersedes all
2. **Approved canonical definitions** — definitions locked in the canonical artifact set (ART-00 through ART-25)
3. **Repeated user requirements** — consistently stated requirements across multiple sessions
4. **Verified implementation evidence** — confirmed live system behavior (saltbasin.net, BestyStaff)
5. **Latest artifact version** — most recently produced canonical artifact
6. **Earlier artifacts** — prior artifact versions (superseded but preserved)
7. **Assistant recommendations** — suggestions from AI session; lowest authority

**Data-layer equivalent hierarchy:**

1. T0 Originating Record (executed contract, payment authorization)
2. T1 System of Record (designated source per domain)
3. T2 System of Reference (corroborating system)
4. T3 Derived/Computed (traceable derivation)
5. T4 External Reference (enrichment only)

### Conflict Resolution Protocol

When T1 and T2 disagree:
1. Log the conflict as a Source Conflict Record (SCR-{SEQUENCE})
2. Hold the downstream data in provisional state — do not promote to governed
3. Resolve by referring to T0 (originating record) if available
4. If T0 unavailable, escalate to designated domain owner for manual resolution
5. Record resolution outcome in SCR with timestamp and authority applied

---

## 3. Rail Connector Standard

A **Rail Connector** is a governed integration between an external source system and the Salt Basin Layer. Every T1 source must be connected via a Rail Connector that meets this standard.

### Rail Connector Required Attributes

```
Connector:
  connector_id:       CONN-{SEQUENCE}
  source_system:      [System name]
  source_tier:        T1 | T2 | T4
  source_domain:      [What data domain this connector owns: CRM / Billing / ERP / FundAdmin / Credit / Card]
  direction:          Read | Write | Read+Write
  auth_method:        OAuth2 | API Key | SFTP | Webhook
  credential_store:   Supabase Vault (REQUIRED — never in code or env vars)
  pull_frequency:     [Cadence: realtime / hourly / daily / weekly / on-demand]
  schema_version:     [Version of source schema this connector targets]
  canonical_mapping:  [Reference to the field mapping document]
  lineage_tagging:    Y — every record tagged with: source_system, pull_timestamp, source_record_id
  error_handling:     [What happens on failed pull: retry / alert / quarantine]
  status:             Live | Architecture | Deprecated
```

### Canonical Connector Register

| CONN ID | System | Domain | Tier | Direction | Status |
|---|---|---|---|---|---|
| CONN-001 | Salesforce | CRM / Pipeline | T1 | Read | Architecture |
| CONN-002 | Zuora | Billing / Subscription | T1 | Read | Architecture |
| CONN-003 | NetSuite | GL / ERP | T1 | Read | Architecture |
| CONN-004 | QuickBooks | Accounting | T1 | Read | Architecture |
| CONN-005 | SAP | ERP | T1 | Read | Architecture |
| CONN-006 | Oracle Fusion | ERP | T1 | Read | Architecture |
| CONN-007 | Workday | HCM / Finance | T1 | Read | Architecture |
| CONN-008 | Allvue | Fund Admin | T1 | Read + Write | Architecture |
| CONN-009 | iLevel | Fund Admin | T1 | Read + Write | Architecture |
| CONN-010 | PitchBook | Portfolio / Market | T1 + T4 | Read + Write | Architecture |
| CONN-011 | Experian | Credit Data | T4 | Read | Architecture |
| CONN-012 | FICO | Credit Scoring | T4 | Read | Architecture |
| CONN-013 | CFPB Data | Regulatory | T4 | Read | Architecture |
| CONN-014 | Card Networks | Card Transaction | T1 (SaltTide) | Read | Architecture |
| CONN-015 | Rewards Platforms | Partner Data | T4 | Read | Architecture |

### Connector Governance Rules

1. Every T1 source must have a registered connector before its data may enter the governed layer.
2. API credentials must be stored in Supabase Vault — never in environment variables, code, or configuration files accessible to the client.
3. Every pulled record must be tagged with: `source_system`, `pull_timestamp`, `source_record_id` before entering the Salt Basin Layer.
4. Connectors that fail must quarantine affected records — they may not silently fail and allow stale data to persist as current.
5. Schema changes in the source system must be detected and handled — connectors must not silently break on schema drift.

---

## 4. Source Registry

Every source that contributes data to the Salt Basin system must be registered. The Source Registry is the authoritative list of all data origins.

### Source Registry Schema

```
Source:
  source_id:          SRC-{SEQUENCE}
  source_name:        [Human-readable name]
  source_tier:        T0 | T1 | T2 | T3 | T4
  source_type:        [Contract / CRM / ERP / Billing / FundAdmin / Credit / Card / Spreadsheet / Internal / External]
  connector_id:       [CONN-ID if T1/T4; null if T0/T3]
  domain_owner:       [Person or role responsible for this source's accuracy]
  data_domains:       [List of data domains this source owns or contributes to]
  last_reviewed:      [Date of last governance review]
  trust_limitations:  [Known limitations, gaps, or quality issues]
  status:             Active | Inactive | Deprecated
  notes:              [Additional governance context]
```

### Canonical Source Register (from prior synthesis — SRC-001 through SRC-015)

| SRC ID | Source Name | Tier | Type | Status | Notes |
|---|---|---|---|---|---|
| SRC-000 | Build Directive (Canonical Synthesis Prompt) | T0 | Internal | Active | Betsy's master synthesis directive — highest authority for artifact set |
| SRC-001 | Foundation Source of Truth (July 7, 2026) | T0 | Internal | Active | Betsy's explicit canonical SOT document; supersedes earlier session outputs |
| SRC-002 | Session Transcripts / Prior AI Sessions | T2 | Internal | Active | Useful for extraction; lower authority; subject to AI errors |
| SRC-003 | Salt Basin Q2R Journey Workbook | T1 | Internal | Active | Primary source for Journey Rod structure, scenario data, security policies |
| SRC-004 | Brand Skill (salt-basin-brand SKILL.md) | T2 | Internal | Active — needs refresh | Contains outdated palette entries; refresh needed (read-only in session) |
| SRC-005 | EIDOS L2 Scenario Repository (Excel) | T1 | Internal | Active | 500+ L2 scenarios seeded; row count pending |
| SRC-006 | HandoverOS/HOS™ Deal Workbook | T1 | Internal | Active | PE deal context, portco scenarios; legacy HandoverOS naming still present |
| SRC-007 | HOS™ Architecture / Strategy Documents | T1 | Internal | Active | Layer architecture, Q2R spec, regulatory standards |
| SRC-008 | HOS™ Pitch / Benchmark Data | T2 | Internal | Active | Benchmark claims; see ART-16/ART-17 for evidence registrations |
| SRC-009 | BestyStaff Session Data | T2 | Internal | Active | User intake patterns, session history |
| SRC-010 | saltbasin.net Live Code / Supabase | T1 | Internal | Active | Live production system — confirmed stack: Vite + Supabase + Vercel |
| SRC-011 | April 2026 Platform Slides | T2 | Internal | Superseded | Early architecture material; Data Basin / DataBasin Bridge terminology now deprecated |
| SRC-012 | Canva Brand Kits | T2 | Internal | Active | Two kits: Salt Basin Net Works, The Salter Influence (deprecated brand) |
| SRC-013 | LinkedIn Content Archive | T2 | Internal | Active | Thought leadership content; not architectural authority |
| SRC-014 | Drive File Index (list_recent_files) | T3 | Internal | Active | 129K character result; used for source inventory; not primary source |
| SRC-015 | Google Drive Search Results | T2 | Internal | Active | Secondary search results from HandoverOS/BestyStaff/SaltTide/RLMM Drive search |

> ⚠️ **Pending addition (per SB-SR-001, DEC-008):** SRC-021 (Salt Basin × LoneTree Capital End-to-End Thesis Proposal) to be registered as T1 Internal once confirmed. SRC-022 through SRC-027 pending read.

---

## 5. Source Trust and Validation Requirements

### T0 — Originating Records

- Must be retained in immutable storage
- Must never be modified — corrections are addenda or new versions, not replacements
- Digital documents (DocuSign, e-signature) must retain the signed PDF and metadata hash
- Physical documents must be scanned and stored with chain-of-custody record

### T1 — Systems of Record

- Must be connected via a registered Rail Connector
- Pull cadence must match the business event frequency (e.g., daily billing pulls; real-time payment events)
- Schema version must be tracked — connector must handle schema drift gracefully
- Domain ownership must be designated — no T1 source without a named owner

### T2 — Systems of Reference

- May be used for corroboration and context; never as sole authority
- Must be clearly labeled as T2 in any output that references them
- Should not be used for ASC 606, SOX, or QoE-adjacent evidence without T0/T1 corroboration

### T3 — Derived/Computed

- Every derived field must expose its formula, inputs, and computation timestamp
- Derived data may not be used as evidence for a claim without disclosing its derived nature
- Derived data that is cached must carry a staleness flag after its cache expiration

### T4 — External Reference

- Must be clearly labeled as external reference data in any output
- Credit data (Experian/FICO) must carry FCRA consent and permissioned pull record
- External data used in any pitch or client-facing output must carry source citation, date, and credibility level

---

## 6. Source Governance Rules

1. **No ungoverned sources.** Any data entering the Salt Basin Layer from an unregistered source is a governance violation — must be quarantined until the source is registered.
2. **Source claims require source evidence.** "This data came from Salesforce" requires a connector pull record with timestamp and source_record_id — not a verbal assertion.
3. **Deprecated sources must be flagged.** Data from a deprecated source (e.g., SRC-011 April 2026 platform slides) may be retained for historical context but must be labeled as superseded and may not be used as current authority.
4. **Source conflicts must be logged.** When two sources disagree, the conflict must be recorded in a Source Conflict Record — not silently resolved by picking one.
5. **Domain ownership is mandatory.** Every T1 source must have a named domain owner responsible for its accuracy, pull cadence, and schema maintenance.
6. **External data has an expiration.** T4 data (credit data, market data, benchmarks) has a defined freshness window — data beyond its window must be re-pulled or flagged as stale.
7. **Consent is tracked.** Any source that requires user consent (credit data, PII) must carry the consent record alongside the data record — consent is not assumed.
