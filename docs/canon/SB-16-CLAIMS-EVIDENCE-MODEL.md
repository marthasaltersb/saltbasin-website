# SALT BASIN — CLAIMS AND EVIDENCE MODEL
## ART-16 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-000, SRC-001, SRC-003, SRC-007, SRC-008

---

## Purpose

Business claims within the Salt Basin ecosystem must remain permanently connected to their definitions, evidence requirements, source attribution, counterfactual analysis, confidence levels, limitations, and outcome observations. This document establishes the canonical model for that connection.

> **Principle (from SRC-000):** "Business claims must remain connected to definitions, evidence requirements, attribution, counterfactuals, confidence, limitations, and outcome observations." A claim without evidence anchoring is a hypothesis. A hypothesis presented as a claim is a liability.

---

## 1. Claim Structure

### Canonical Claim Schema

Every Salt Basin business claim must be registered with the following fields:

```
Claim:
  claim_id:           CLM-{DOMAIN_CODE}-{SEQUENCE}
  claim_text:         [Verbatim claim statement]
  claim_type:         [Market / Performance / Benchmark / Capability / Risk]
  domain:             [HOS / SaltTide / RLMM / Methodology / Market]
  status:             [Verified / Candidate / Hypothesis / Retired]
  
  source:
    primary_source_id:      [SRC-XXX or pub citation]
    source_date:            [Date of source]
    source_credibility:     [Primary / Secondary / Inferred / Model Output]
    original_quote:         [Verbatim text from source, if applicable]
  
  evidence:
    evidence_type:          [Statistical / Case Study / Benchmark / Survey / Regulatory Text / Audit Finding]
    evidence_strength:      [High / Medium / Low]
    evidence_dimensions_met: [List of dimensions from Section 3]
  
  attribution:
    org_publisher:          [Publishing organization]
    author:                 [Author or team name if available]
    methodology:            [How this was produced — survey, audit, model, etc.]
    sample_size:            [N= or population scope]
    geography:              [Geographic scope of claim]
    time_period:            [Period covered]
  
  confidence:
    level:                  [High / Medium / Low / Directional]
    rationale:              [Why this confidence level is assigned]
    decay_rule:             [When this claim should be re-verified — e.g., "re-verify if >24 months old"]
  
  counterfactual:
    question:               [What would be true if this claim were false?]
    alternate_explanation:  [What else could explain the data?]
    falsifiability:         [Is there a condition under which this claim would be refuted?]
  
  limitations:
    scope_limits:           [What this claim does NOT cover]
    known_exceptions:       [Groups, conditions, or contexts where claim may not hold]
    dependency_conditions:  [Conditions that must be true for claim to apply]
  
  outcome_observations:
    observed_result:        [Actual outcome when claim has been tested or applied]
    delta_from_claim:       [Difference between claimed and observed, if known]
    updated_by:             [SRC reference for any outcome update]
```

---

## 2. Business Outcome Evidence Maturity

The preferred framing for evaluating operational and data maturity in the Salt Basin context is **Business Outcome Evidence Maturity (BOEM)** — not generic "data maturity assessment" language.

### BOEM Definition

Business Outcome Evidence Maturity measures how well an organization can produce governed, traceable, auditable evidence in support of specific claimed business outcomes.

> This is NOT a technology maturity assessment. It is NOT a data quality maturity assessment. It IS an assessment of whether the business can substantiate what it says it has achieved.

### BOEM Maturity Levels

> ⚠️ **CORRECTION PENDING (per SB-SR-001, DEC-002):** The level names below (Ungoverned, Anecdotal, Documented, Governed, Auditable, Continuous) were synthesized without a primary source. SRC-021 (LoneTree PDF) provides authoritative Evidence Maturity stage names that should replace them: **0 Asserted, 1 Defined, 2 Reproducible, 3 Reconciled, 4 Explainable, 5 Outcome Validated.** Do not treat the names below as final until Betsy confirms.

| Level | Label | Description | Evidence Characteristics |
|---|---|---|---|
| 0 | Ungoverned | No evidence governance. Claims are asserted without audit trail. | No source attribution; no repeatable method; no version control |
| 1 | Anecdotal | Evidence exists but is informal, episodic, and not systematically collected. | Point-in-time case studies; verbal accounts; one-off extracts |
| 2 | Documented | Evidence is systematically captured but may be siloed, inconsistently formatted, or missing lineage. | Spreadsheet extracts; PDF reports; partial audit trails |
| 3 | Governed | Evidence is captured in a governed system with defined rules for source, format, lineage, and timing. | Registry-backed; defined schema; lineage tracked to originating contract/event |
| 4 | Auditable | Evidence is independently verifiable. Lineage is complete end-to-end. | Can withstand external audit; ASC 606 / SOX-compliant trail; revenue recognition defensible |
| 5 | Continuous | Evidence is generated automatically as operations run. No manual extraction required. | Real-time; event-driven; QoE-ready at any moment without sprint effort |

### HOS™ Design Target

HOS™ is designed to move PE-backed mid-market SaaS portcos from BOEM Level 0–2 (pre-acquisition state) to BOEM Level 4–5 (exit-ready state).

---

## 3. Evidence Dimensions

Every piece of evidence attached to a claim must be assessed across eight dimensions:

| Dimension | Description | Failing Condition |
|---|---|---|
| Traceability | Can the evidence be traced back to its originating event? | Evidence cannot be linked to a specific contract, transaction, or rod event |
| Temporality | Is the evidence bound to a specific time period? | Evidence is undated or period-ambiguous |
| Attribution | Is the producing source identified? | Evidence has no named producer, methodology, or population |
| Repeatability | Can the evidence be reproduced with the same method? | One-time extract from a system no longer accessible |
| Completeness | Does the evidence cover the full scope of the claim? | Evidence covers a subset without disclosure |
| Independence | Was the evidence produced by a party independent of the claim maker? | Self-attested evidence with no third-party validation |
| Materiality | Is the magnitude of the evidence sufficient to support the claim? | n=3 used to support a broad market claim |
| Auditability | Could a qualified third party reach the same conclusion? | Methodology is proprietary, undisclosed, or unreproducible |

---

## 4. Claim Type Definitions

### Market Claims

Assertions about the size, growth rate, or characteristics of an addressable market.

**Governance note:** Market claims have the highest decay risk — re-verify within 24 months or upon major regulatory or macro shift.

**Examples in the Salt Basin ecosystem:**
- SaltTide total addressable market
- PE deal flow volume
- Mid-market SaaS ARR range
- Invoice error rate prevalence (39% figure — SRC-008)

### Performance Claims

Assertions about what the product does or has done — outcomes, metrics, win rates.

**Governance note:** Performance claims require at minimum a case study with defined conditions, or statistical evidence with n≥30 for quantitative claims.

### Benchmark Claims

Assertions based on industry standards, peer comparisons, or analyst benchmarks.

**Governance note:** Benchmark claims must identify the benchmarking body, methodology, and year. Benchmarks older than 36 months should be flagged for re-verification.

### Capability Claims

Assertions about what the product or system is capable of doing (not has done).

**Governance note:** Capability claims must distinguish architecture-only ("designed to...") from implemented ("currently does..."). Never conflate design intent with production capability.

### Risk Claims

Assertions about what happens when something is NOT implemented (the cost of inaction).

**Governance note:** Risk claims must include counterfactual framing — what specific harm, in what population, under what conditions.

---

## 5. Verified Claim Register

The following claims have been extracted from source materials (SRC-007, SRC-008) and registered under this model.

### CLM-HOS-001
```
claim_text:         "39% of enterprise invoices contain errors"
claim_type:         Benchmark
domain:             HOS — Step 8 (Bill)
status:             Candidate (source cited but methodology not fully verified)
primary_source_id:  SRC-008 (citing RecVue/IOFM 2025)
source_credibility: Secondary — trade publication citing vendor-sponsored research
evidence_type:      Survey
evidence_strength:  Medium
confidence:         Medium — direction is well-supported; exact percentage requires primary source verification
counterfactual:     If false → billing error rates are lower → the HOS™ billing error reduction ROI estimate is overstated
limitations:        Vendor-sponsored research may reflect worst-case sample; "enterprise" scope not defined in available source excerpt
decay_rule:         Re-verify within 24 months or when RecVue/IOFM publishes update
```

### CLM-HOS-002
```
claim_text:         "3–7% revenue leakage from misapplied pricing tiers"
claim_type:         Benchmark
domain:             HOS — Step 8 (Bill)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_type:      Benchmark
evidence_strength:  Medium
confidence:         Medium — directionally consistent with industry range; no primary study attached
counterfactual:     If false → HOS™ billing optimization value is lower
limitations:        Range is broad (3-7%) — specific figure will depend on customer pricing complexity
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-003
```
claim_text:         "61% of late payments stem from compliance and administrative issues"
claim_type:         Benchmark
domain:             HOS — Step 9 (Collect)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Medium
counterfactual:     If false → pre-bill notification automation produces lower dispute reduction than modeled
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-004
```
claim_text:         "9% of enterprise invoices are written off as uncollectible"
claim_type:         Benchmark
domain:             HOS — Step 9 (Collect)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Medium — consistent with AR industry norms for complex billing environments
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-005
```
claim_text:         "Pre-bill customer notification and review reduces post-invoice disputes by 85%"
claim_type:         Performance
domain:             HOS — Step 9 (Collect)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Directional — specific percentage requires primary study citation
counterfactual:     If false → pre-bill notification has lower ROI than modeled
limitations:        85% figure may reflect specific implementation type; conditions not fully specified
decay_rule:         Re-verify when primary study is identified
```

### CLM-HOS-006
```
claim_text:         "5–7% of public companies report material weaknesses; revenue recognition is the #1 cited area"
claim_type:         Regulatory/Benchmark
domain:             HOS — Step 10 (Rev Close)
status:             Candidate
primary_source_id:  SRC-008 (citing PCAOB/SEC)
source_credibility: Secondary (regulatory body data cited via HOS pitch)
evidence_strength:  High (regulatory source)
confidence:         High — PCAOB and SEC data are authoritative for public companies; applies directionally to PE-backed companies subject to quality-of-earnings scrutiny
limitations:        Applies to public companies; PE portcos not subject to SOX 404(b) unless preparing for public exit or in upper-market PE with PCAOB-aligned QoE standards
decay_rule:         Annual re-check against PCAOB annual report
```

### CLM-HOS-007
```
claim_text:         "87% of enterprises miss revenue forecasts partly due to onboarding delays"
claim_type:         Benchmark
domain:             HOS — Step 6 (Onboard)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Directional
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-008
```
claim_text:         "SOC 2 review adds 2–4 weeks to a SaaS enterprise sales cycle"
claim_type:         Benchmark
domain:             HOS — Step 2 (Qualify)
status:             Candidate
primary_source_id:  SRC-008 (citing Optifai 2025)
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Medium — directionally consistent with enterprise SaaS experience
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-009
```
claim_text:         "CFO involvement in enterprise software purchase decisions has increased 40%"
claim_type:         Market
domain:             HOS — Step 2 (Qualify)
status:             Candidate
primary_source_id:  SRC-008
source_credibility: Secondary
evidence_strength:  Medium
confidence:         Directional — consistent with documented finance-led procurement trends
limitations:        "40% increase" from unspecified baseline; source and methodology need primary verification
decay_rule:         Re-verify within 24 months
```

### CLM-HOS-010
```
claim_text:         "No existing competitor automates the upward push of clean deal-anchored data from portco operational systems to fund admin systems (Allvue, iLevel, PitchBook)"
claim_type:         Capability / Competitive
domain:             HOS — Fund Admin Upward Data Push differentiator
status:             Candidate
primary_source_id:  SRC-001 (Betsy explicit assertion)
source_credibility: Primary (founder knowledge of market)
evidence_strength:  Low (unverified competitive landscape audit)
confidence:         Medium — consistent with known PE tech stack fragmentation; no public product performs this exact function as of knowledge cutoff
counterfactual:     If false → HOS™ faces direct substitution risk that must be addressed in pitch material
limitations:        Competitive landscape may have changed; Silver Lake / Zuora acquisition flagged as timing risk
decay_rule:         Re-verify quarterly against fund admin vendor announcements and PE tech stack surveys
```

### CLM-TIDE-001
```
claim_text:         "SaltTide seed round target: $3.5M"
claim_type:         Capability
domain:             SaltTide
status:             Canonical — internal target (not a public market claim)
primary_source_id:  SRC-001
source_credibility: Primary
evidence_strength:  N/A — internal planning figure
confidence:         High as stated intent; not a forecast
decay_rule:         Update upon close of seed or material revision
```

---

## 6. Counterfactual Requirements

For every material claim used in a pitch, proposal, or QoE-adjacent context, a counterfactual analysis must be documented:

| Claim Category | Counterfactual Requirement | Example |
|---|---|---|
| Market size | What if the market is 50% smaller? How does TAM/SAM/SOM hold? | SaltTide TAM at 50% → still viable? |
| Benchmark efficiency | What if the effect is 50% of claimed? Does ROI still work? | Invoice error rate at 20% instead of 39% — does HOS™ billing ROI still hold? |
| Competitive differentiation | What if a competitor enters this space within 12 months? | Fund admin push: what if Allvue builds natively? |
| Performance claims | What are the conditions under which the outcome would NOT have occurred? | Pre-bill notification at 85% reduction: what onboarding and contract complexity conditions are required? |

---

## 7. Evidence Governance Rules

1. **A claim without a registered CLM-ID must not be used in any pitch, proposal, or QoE-adjacent document produced by Salt Basin or any subsidiary.**
2. **Candidate claims may be used in pitch material** only if labeled with confidence level and source attribution — never as if verified.
3. **Retired claims must not be resurfaced** without re-registration and evidence re-review.
4. **Lineage is mandatory:** every metric used in a deliverable must trace to a CLM-ID, which traces to a SRC-ID, which traces to an originating event or publication.
5. **The UI renders governed state.** No Salt Basin UI may display a metric, benchmark, or outcome figure that is not registered in this claims model. The UI must not become the ungoverned owner of business claims.
6. **Outcome observations must update the claim record.** If a claim is tested in practice and the observed outcome differs from the claim, the delta must be recorded and the confidence level updated.
7. **Confidence level decay:** Claims older than their stated decay_rule threshold must be re-verified before use in new material — their confidence level automatically degrades one tier (e.g., High → Medium) upon expiration.
