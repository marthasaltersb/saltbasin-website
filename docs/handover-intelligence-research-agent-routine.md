# Handover Intelligence Research Agent Routine

Purpose: run a governed research agent that continuously expands the HandoverOS decision and risk heatmap model with new leakage scenarios, benchmark updates, source changes, assumption impacts, accounting principle impacts, sector patterns, venture-stage implications, and technology signals.

Status: routine design ready for implementation.

Primary source backbone:

| Local source | Use |
|---|---|
| `docs/active-universal-salt-basin-agent-memory-register.md` | Canonical approved universal guardrails and blocked claims |
| `docs/active-universal-salt-basin-agent-memory-register-2026-07-08.md` | Dated audit snapshot for the initial approval event |
| `docs/gmail-handoveros-attachment-extraction-batch-2a-2026-07-08.md` | HandoverOS workbook extraction and current scenario spine |
| `docs/gmail-memory-context-batch-1-2-run-2026-07-08.md` | QTR workbook summaries and Batch 1/2 candidate memory |
| `docs/memory-approval-table-batches-1-2-2a-2026-07-08.md` | Approval status and pending records |
| `src/brand.css` | Salt Basin brand tokens |
| `src/lib/outputBlocks.js` | Output block structure and document-rendering conventions |
| `tmp/salt_basin_visual_design_system.txt` | Executive visual design rules |
| `tmp/betsy_visual_metadata_iconography.txt` | Metadata, icon, chip, and evidence-badge guidance |

## Routine name

Handover Intelligence Research Loop

Command:

```text
/handover-intelligence-research-refresh
```

Recommended run cadence:

| Run type | Cadence | Scope |
|---|---|---|
| Quick source pulse | Weekly | 10-25 sources; no public claims activated |
| Benchmark refresh | Monthly | 25-75 source claims; update stale claims and assumptions |
| Heatmap rebuild | Monthly or before a pitch | Re-score scenario risk heatmap using approved evidence |
| Deep sector scan | Quarterly | One sector, one venture stage, or one technology category |
| Event-triggered scan | On major report, regulatory change, IPO filing, restatement, or product launch | Focused source review |

## Existing HandoverOS scenario spine

The routine must start from the scenarios already found in the Gmail extraction. New research should extend, modify, or challenge this spine rather than inventing a disconnected model.

### Six QTR scenario families

| ID | Scenario family | Current meaning |
|---|---|---|
| S1 | Close cycle compression | Sales, legal, security, forecast, and contract metadata handoffs that affect close timing and recognition readiness |
| S2 | Usage-based billing accuracy | Metering, tiering, overage, consumption, and invoice configuration issues |
| S3 | Continuous revenue recognition vs. billing | Independent billing and recognition tracks, performance obligations, delivery evidence, and recognition timing |
| S4 | Pre-bill review and dispute management | Customer invoice preview, dispute prevention, e-invoicing, approval routing, and AR quality |
| S5 | Auto-pay and collections infrastructure | Payment authorization, tokenization, collection timing, payment method routing, and DSO risk |
| S6 | Professional services billing and revenue recognition | Milestones, change orders, POC estimates, unbilled work, bundled vs. distinct obligations |

### Eleven lifecycle steps

| Step | Lifecycle stage |
|---:|---|
| 1 | Prospect and pipeline |
| 2 | Qualify and discovery |
| 3 | Solution design and scope |
| 4 | Negotiate and legal review |
| 5 | Contract execution |
| 6 | Onboarding and activation |
| 7 | Service delivery and usage |
| 8 | Billing and invoicing |
| 9 | Collect |
| 10 | Revenue close |
| 11 | Renew |

### Existing model anchors

| Anchor | Use in research loop |
|---|---|
| Canonical QTR entities | Customer, Opportunity, Quote, Contract, Subscription, Invoice, RevenueSchedule, ARR, NRR, Product |
| Operating heuristics | Product catalog issues become billing issues; reporting issues originate upstream; leakage often starts as governance; spreadsheet dependency signals missing capability; AI outputs need operational validation |
| HandoverOS thesis | Missing or unstructured metadata creates downstream revenue leakage, audit risk, dispute risk, forecast risk, collections friction, and AI-readiness risk |
| Blocked claims | No unsupported AI compounding multiplier, no placeholder pricing, no unrefreshed external benchmark claims |

## Agent hierarchy

### 1. Research Run Manager

Purpose: orchestrate the full run, assign source batches, enforce guardrails, and produce the final Salt Basin output.

Max volume per run:

| Item | Max |
|---|---:|
| Source URLs | 75 |
| Reddit threads | 50 |
| Benchmark claims | 100 |
| Scenario candidates | 75 |
| Final heatmap changes | 50 |

### 2. Handover Memory Loader

Purpose: load approved memory, blocked claims, pending records, and current scenario spine before any external research starts.

Inputs:

```json
{
  "activeMemoryRegister": "docs/active-universal-salt-basin-agent-memory-register.md",
  "handoverExtraction": "docs/gmail-handoveros-attachment-extraction-batch-2a-2026-07-08.md",
  "batch12Run": "docs/gmail-memory-context-batch-1-2-run-2026-07-08.md",
  "approvalTable": "docs/memory-approval-table-batches-1-2-2a-2026-07-08.md"
}
```

Output:

```json
{
  "approvedGuardrails": [],
  "blockedClaims": [],
  "scenarioSpine": [],
  "pendingRecords": [],
  "publicUseRules": []
}
```

### 3. Primary Source Scout

Purpose: search authoritative sources for new reports, enforcement signals, accounting updates, benchmark changes, filings, and sector-level evidence.

Primary-source tiers:

| Tier | Source type | Examples | Use |
|---|---|---|---|
| A | Regulatory and standards | SEC, PCAOB, FASB, IASB/IFRS, AICPA, IRS, NACHA, PCI SSC | Accounting, audit, payment, compliance, disclosure, control claims |
| A | Public filings | 10-K, 10-Q, S-1, restatement filings, material weakness disclosures, IPO filings | Real-world risk examples and sector patterns |
| B | Original research | Big 4 reports, BCG, McKinsey, Gartner, Forrester, APQC, SaaS Capital, OpenView, RevOps vendors with published methodology | Benchmark candidates, market context, operating metrics |
| B | Product/vendor primary data | Salesforce, Zuora, NetSuite, Stripe, Chargebee, Maxio, Workday, ServiceNow, Snowflake, Databricks | Technology and process-change signals |
| C | Academic and nonprofit research | SSRN, NBER, journals, industry institutes | Model validation and longitudinal risk evidence |

Rule: Tier A can influence external claims after source refresh. Tier B can influence benchmarks only if methodology is documented. Tier C can influence model logic but must be translated carefully.

### 4. Reddit Signal Scout

Purpose: scrape Reddit for practitioner pain signals, scenario language, and emerging workflow issues.

Reddit status:

Reddit is never a primary source for benchmarks, monetary claims, regulatory claims, or accounting interpretations. It is a weak-signal source for operational pain, workflow vocabulary, failure patterns, and buyer/user language.

Recommended subreddits:

| Subreddit/category | Signal to extract |
|---|---|
| `r/revops` | QTR, CRM, handoff, forecasting, billing, routing pain |
| `r/SaaS` | Pricing, usage billing, churn, customer disputes, GTM handoff issues |
| `r/accounting` | Rev rec, audit, month-end close, control pain |
| `r/FPandA` | Forecasting, ARR, metrics, budget, planning issues |
| `r/salesforce` | CRM object, CPQ, quote, account, integration, admin pain |
| `r/Netsuite` | ERP, revenue, billing, integration, close issues |
| `r/SAP` and `r/ERP` | Migration, master data, order-to-cash, billing failures |
| `r/consulting` | Enterprise transformation and operating model failure language |
| `r/startups` | Founder-stage billing, pricing, finance ops, collections issues |

Reddit output limitations:

1. Do not store usernames unless Betsy explicitly approves relationship memory.
2. Do not quote private or personal details.
3. Do not treat anecdotes as facts.
4. Do not cite Reddit alone for any heatmap score above medium.
5. Convert Reddit findings into "signals to validate" and route them to Primary Source Scout.

### 5. Source Verifier

Purpose: classify evidence quality and prevent stale, unsupported, or removed claims from entering the model.

Evidence statuses:

| Status | Meaning |
|---|---|
| Verified current | Source is current, authoritative, and directly supports the claim |
| Verified historical | Source is authoritative but old; useful as historical context |
| Methodology disclosed | Source includes sample, date, method, or limitation |
| Vendor directional | Useful but may carry commercial bias |
| Practitioner signal | Reddit/forum/user signal; requires validation |
| Modeled assumption | Built by Salt Basin or inferred from evidence |
| Unsupported | Do not use |
| Deprecated | Explicitly removed or superseded |

### 6. Scenario Synthesizer

Purpose: convert source findings into new or modified leakage scenarios.

Scenario candidate schema:

```json
{
  "scenarioId": "HOS-SCEN-YYYYMMDD-001",
  "scenarioFamily": "S1|S2|S3|S4|S5|S6|NEW",
  "lifecycleStep": 1,
  "scenarioTitle": "",
  "triggerEvent": "",
  "failureMode": "",
  "operationalMechanism": "",
  "evidenceSummary": "",
  "sourceIds": [],
  "evidenceClass": "verified_current|verified_historical|vendor_directional|practitioner_signal|modeled_assumption",
  "affectedEntities": [],
  "accountingPrinciples": [],
  "sectorTags": [],
  "ventureStageTags": [],
  "technologyTags": [],
  "riskHeatmapDelta": {},
  "recommendedModelChange": "",
  "publicUseStatus": "blocked|internal|public_safe_after_refresh|approved_public"
}
```

### 7. Benchmark Diff Analyst

Purpose: compare new source claims against existing model assumptions and decide whether assumptions should be increased, decreased, split by sector, marked stale, or blocked.

Benchmark diff schema:

```json
{
  "claimId": "BENCH-YYYYMMDD-001",
  "existingAssumption": "",
  "newEvidence": "",
  "direction": "increase|decrease|no_change|split_by_segment|replace|block",
  "sourceStrength": "A|B|C|weak_signal",
  "dateOfSource": "",
  "effectiveDate": "",
  "confidence": "high|medium|low",
  "modelImpact": "",
  "publicLanguage": "",
  "blockedLanguage": ""
}
```

### 8. Accounting Principle Mapper

Purpose: connect scenario changes to relevant accounting, audit, payment, and control principles without giving legal, tax, accounting, or audit advice.

Mapping categories:

| Category | Examples to map |
|---|---|
| Revenue recognition | ASC 606 / IFRS 15 five-step model, contract existence, performance obligations, transaction price, variable consideration, recognition timing |
| Contract modification | Amendments, change orders, scope changes, renewals, SSP reallocation, prospective vs. cumulative catch-up logic |
| Collectability | Payment terms, customer credit profile, disputes, late payments, cancellation rights |
| Internal controls | SOX 302/404, control evidence, audit trail, approval workflow, system-of-record governance |
| Audit evidence | PCAOB inspection themes, transaction-level lineage, manual reconciliation, IT general controls |
| Disclosures | Material weakness, restatement, risk factors, significant customer concentration, revenue policy |
| Payment compliance | NACHA, PCI DSS, e-invoicing, tax invoice requirements |

Output rule:

Always phrase accounting implications as operating-model impacts and review triggers, not professional advice.

### 9. Heatmap Impact Modeler

Purpose: translate research into scenario and decision heatmap changes.

Scoring scale:

| Score | Meaning |
|---:|---|
| 1 | Low or speculative |
| 2 | Emerging / low-to-medium |
| 3 | Material but bounded |
| 4 | High impact or common |
| 5 | Critical / systemic / board-level |

Heatmap dimensions:

| Dimension | Meaning |
|---|---|
| Probability | How often the pattern appears or is supported |
| Revenue exposure | Potential ARR, revenue, margin, EBITDA, or cash impact |
| Recognition risk | Potential impact to revenue timing, performance obligations, variable consideration, or contract modification logic |
| Control risk | SOX, audit, evidence, ICFR, or manual-control implications |
| Customer risk | Disputes, trust, churn, onboarding delay, collection friction |
| Migration risk | Risk amplified during ERP, billing, CRM, RevRec, data, or AI migration |
| AI-readiness risk | Risk that AI agents, forecasts, or automation encode bad data or missing controls |
| Evidence strength | Confidence and source quality |

Composite score:

```text
compositeRisk =
  (Probability * 0.15) +
  (Revenue exposure * 0.18) +
  (Recognition risk * 0.16) +
  (Control risk * 0.16) +
  (Customer risk * 0.10) +
  (Migration risk * 0.10) +
  (AI-readiness risk * 0.10) +
  (Evidence strength * 0.05)
```

Risk band:

| Composite | Band | Salt Basin color |
|---:|---|---|
| 4.25-5.00 | Critical | `--sb-risk-critical` / #C44A4A |
| 3.50-4.24 | High | `--sb-risk-high` / #C4843A |
| 2.50-3.49 | Medium | `--sb-teal` / #4A7C8E |
| 1.50-2.49 | Watch | `--sb-dusty` / #8B9BAE |
| 1.00-1.49 | Low | `--sb-risk-low` / #A8B89A |

### 10. Salt Basin Output Composer

Purpose: produce outputs in Salt Basin's premium operating-intelligence style.

Brand rules:

1. Use navy for authority and structure.
2. Use gold sparingly for section labels, thin accents, and priority emphasis.
3. Use teal for AI/data/network/product visuals.
4. Use green only for outcomes, value creation, savings, completion, or success.
5. Use plum only for selected strategic emphasis.
6. Keep the tone premium, executive, precise, and non-decorative.
7. Use cards, metadata chips, KPI tiles, lifecycle flows, heatmaps, and validation checklists.
8. Avoid emoji in final executive outputs.
9. Use consistent thin-line or rounded-outline icons if exporting to Canva/PDF.
10. Do not use more than 6 KPI cards on a page.

Approved icon vocabulary:

| Icon label | Meaning |
|---|---|
| Revenue / Q2C | Revenue lifecycle, CPQ, CLM, billing, leakage |
| AI / Agent | HandoverOS, BestyStaff, AI-enabled work |
| Private Equity | Portfolio operations, value creation, exit readiness |
| Architecture | Systems design, stack, integration model |
| Finance | ARR, EBITDA, DSO, margin, forecast, ledger |
| Operations | Process design, governance, controls |
| Data / MDM | Migration, lineage, master data, analytics |
| Quality | QA, UAT, validation, dependency management |

Recommended output blocks:

| Block | Source pattern |
|---|---|
| Page Header | `page-header` block |
| Gold Rule | `color-band` block |
| Section Label | `section-label` block |
| KPI Tile | Visual design system KPI tile |
| Source Delta Card | Outcome card pattern |
| Heatmap | Status heatmap / capability heat map pattern |
| Metadata Chips | Employer/industry/scenario/role/metric chip pattern |
| Validation Checklist | Defined / Designed / Validated / Built / Tested / Deployed / Measured pattern |
| River Flow Diagram | Fragmented input to structured operating value |

## Per-source output required after each scrape

Every source processed must produce a Source Delta Card before the agent moves to the next source.

### Source Delta Card template

```markdown
## Source Delta Card: {{source_title}}

| Field | Value |
|---|---|
| Source ID | {{source_id}} |
| Source type | {{tier_a_b_c_or_reddit_signal}} |
| Publisher / community | {{publisher}} |
| Publication date | {{date}} |
| Retrieved date | {{retrieved_date}} |
| Link | {{url}} |
| Evidence status | {{verified_current_or_other}} |
| Confidence | {{high_medium_low}} |

### What changed

{{summary_of_new_or_changed_information}}

### New leakage scenarios

| Scenario | Family | Lifecycle step | Failure mode | Evidence strength |
|---|---|---:|---|---|

### Changed benchmarks

| Existing assumption | New evidence | Direction | Model impact | Public-use status |
|---|---|---|---|---|

### Changed assumptions

| Assumption | Change | Reason | Confidence |
|---|---|---|---|

### Decision insights

| Decision | New insight | Recommended action |
|---|---|---|

### Risk heatmap impact

| Scenario | Probability | Revenue | Recognition | Control | Customer | Migration | AI | Evidence | Band |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|

### Accounting / control implications

| Principle area | Impact | Review trigger |
|---|---|---|

### Sector, venture, and technology tags

| Sector | Venture category | Technology impact |
|---|---|---|

### Agent decision

| Decision | Meaning |
|---|---|
| Add scenario | {{yes_no}} |
| Change benchmark | {{yes_no}} |
| Change assumption | {{yes_no}} |
| Update heatmap | {{yes_no}} |
| Needs source refresh | {{yes_no}} |
| Public use allowed | {{blocked_internal_public_safe_after_refresh_approved_public}} |
```

## Consolidated run output

Every full run creates:

```text
docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.md
docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.source-deltas.jsonl
docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.scenario-candidates.jsonl
docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.benchmark-diffs.jsonl
docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.heatmap-delta.csv
```

Final run document sections:

1. Executive summary.
2. Sources processed.
3. New scenarios.
4. Benchmark changes.
5. Assumption changes.
6. Heatmap changes.
7. Accounting/control impacts.
8. Sector, venture, and technology impacts.
9. Public-safe language candidates.
10. Blocked or quarantined claims.
11. Recommended follow-up research.

## API functionality

### Start research run

Endpoint:

```text
POST /api/agent-runs/handover-intelligence-research
```

Request:

```json
{
  "runMode": "quick_pulse|benchmark_refresh|heatmap_rebuild|sector_scan|event_triggered",
  "sourceScope": {
    "primarySources": true,
    "redditSignals": true,
    "vendorReports": true,
    "publicFilings": true
  },
  "focus": {
    "scenarioFamilies": ["S1", "S2", "S3", "S4", "S5", "S6"],
    "sectors": ["SaaS", "FinTech", "Healthcare", "Manufacturing", "GovTech"],
    "ventureStages": ["Seed", "Series A", "Growth", "PE-backed", "Pre-IPO", "Public"],
    "technologies": ["CRM", "CPQ", "CLM", "Billing", "RevRec", "ERP", "MDM", "AI Agents"]
  },
  "maxSources": 75,
  "requirePrimaryValidationForPublicUse": true,
  "outputFormat": ["markdown", "jsonl", "csv"]
}
```

Response:

```json
{
  "runId": "hirr_YYYYMMDD_001",
  "status": "queued",
  "artifactTargets": {
    "runDocument": "docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.md",
    "sourceDeltas": "docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.source-deltas.jsonl",
    "scenarioCandidates": "docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.scenario-candidates.jsonl",
    "benchmarkDiffs": "docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.benchmark-diffs.jsonl",
    "heatmapDelta": "docs/research-runs/handover-intelligence-refresh-YYYY-MM-DD.heatmap-delta.csv"
  }
}
```

### Record source delta

```text
POST /api/handover-intelligence/source-deltas
```

### Record scenario candidate

```text
POST /api/handover-intelligence/scenario-candidates
```

### Record benchmark diff

```text
POST /api/handover-intelligence/benchmark-diffs
```

### Submit approval decision

```text
POST /api/handover-intelligence/approval-decisions
```

## Agent prompt

```text
You are the Handover Intelligence Research Loop for Salt Basin.

Your job is to expand the HandoverOS decision and risk heatmap model using governed research. Start by loading the approved Salt Basin universal memory register, the Gmail-derived HandoverOS extraction, and the current approval table.

Use the existing HandoverOS scenario spine: six QTR scenario families, eleven lifecycle stages, canonical QTR entities, operator heuristics, and active blocked-claim rules.

Research across primary sources, public filings, regulatory materials, vendor reports with disclosed methodology, academic sources, and Reddit/practitioner signals. Treat Reddit as weak signal only. Do not turn Reddit anecdotes into benchmark claims.

For every source, produce a Source Delta Card before moving to the next source. Identify new scenarios, changed benchmarks, changed assumptions, decision insights, heatmap impact, accounting/control implications, sector tags, venture-stage tags, and technology tags.

Never use unrefreshed monetary figures, stale benchmarks, unsupported regulatory interpretations, placeholder HandoverOS pricing, unsupported AI compounding multipliers, client names, employer-owned source documents, or proprietary workbook internals in public-facing output.

Write in Salt Basin style: executive, precise, analytical, calm, premium, non-decorative. Use navy/gold/teal/green semantics, metadata chips, KPI tiles, heatmaps, source cards, and validation checklists. Avoid emoji in final executive outputs.

Outputs must separate:
- verified facts
- source-backed benchmarks
- modeled assumptions
- Reddit/practitioner signals
- public-safe language
- internal-only findings
- blocked or quarantined claims
```

## Search query library

### Primary-source query families

```text
"revenue recognition" "material weakness" "2026" "SEC"
"ASC 606" "variable consideration" SaaS billing
"usage-based billing" "invoice errors" "SaaS" benchmark
"quote-to-cash" "revenue leakage" benchmark
"billing system migration" revenue recognition risk
"contract modification" "ASC 606" SaaS
"standalone selling price" "software" "revenue recognition"
"SOX 404" "revenue recognition" "material weakness"
"PCAOB" "revenue recognition" "inspection" "software"
"IPO" "material weakness" "revenue recognition" "SaaS"
"AI" "finance data" "revenue recognition" "controls"
"e-invoicing" "B2B" "invoice disputes" benchmark
"NACHA" "ACH authorization" recurring billing controls
"PCI DSS" "tokenization" recurring billing
```

### Reddit signal query families

```text
site:reddit.com/r/revops "billing" "Salesforce" "CPQ"
site:reddit.com/r/SaaS "usage based billing" "overage"
site:reddit.com/r/accounting "ASC 606" "software"
site:reddit.com/r/FPandA "ARR" "forecast" "billing"
site:reddit.com/r/salesforce "CPQ" "billing" "contract"
site:reddit.com/r/Netsuite "revenue recognition" "billing"
site:reddit.com/r/ERP "migration" "billing" "master data"
site:reddit.com/r/startups "Stripe" "usage billing" "invoice"
```

## Source volume and parallel agents

| Run size | Sources | Recommended agents |
|---|---:|---:|
| Small | 1-25 | 1 Research Run Manager, 1 Primary Source Scout, 1 Verifier |
| Medium | 26-75 | 1 Manager, 3 Source Scouts, 1 Reddit Scout, 2 Verifiers, 1 Heatmap Modeler |
| Large | 76-200 | 1 Manager, 6 Source Scouts, 2 Reddit Scouts, 3 Verifiers, 2 Scenario Synthesizers, 1 Accounting Mapper, 1 Heatmap Modeler |
| Deep portfolio | 200+ | Split into sector-specific runs; do not run as one memory update |

## Approval gates

| Output | Approval required before activation |
|---|---|
| New public-facing benchmark | Yes, Betsy + Source Verifier |
| New monetary figure | Yes, Betsy + Benchmark Refresh Agent |
| New accounting/control claim | Yes, accounting/control review recommended |
| New Reddit-derived scenario | Yes, after primary-source validation |
| New internal scenario | Betsy approval recommended |
| New public-safe website language | Betsy approval required |
| Blocked claim | Can activate as negative memory after Betsy approval |

## Immediate next run

Recommended first active run:

```text
/handover-intelligence-research-refresh runMode=quick_pulse maxSources=25 focus=S2,S3,S4 technologies=Billing,RevRec,ERP,AI
```

Goal:

1. Validate whether usage-based billing, continuous rev rec vs. billing, and pre-bill dispute workflows have newer evidence.
2. Identify 5-10 new scenario candidates.
3. Produce source delta cards after every source.
4. Leave all external claims pending until source refresh and Betsy approval.
