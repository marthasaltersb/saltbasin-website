# SALT BASIN — ATTRIBUTION AND COUNTERFACTUAL MODEL
## ART-18 | Version 1.0 | July 15, 2026 | Status: CANDIDATE
### Authority: SRC-000, SRC-001, SRC-003, SRC-007, SRC-008

---

## Purpose

A claim without attribution is assertion. Attribution without a counterfactual is incomplete reasoning. This document defines the framework for connecting outcomes to their causes, constructing counterfactuals, and maintaining the full evidence chain from claim through observed result.

> **Core constraint (SRC-000):** "Business claims must remain connected to definitions, evidence requirements, attribution, counterfactuals, confidence, limitations, and outcome observations." This document is the operational model for that constraint.

The Claims and Evidence Model (ART-16) defines the structure of a claim. This document defines the reasoning process for attributing outcomes to causes and constructing the counterfactual argument.

---

## 1. Attribution Defined

**Attribution** is the process of connecting an observed outcome to a specific cause, intervention, or condition — with a defined degree of confidence and a documented causal pathway.

Attribution is not correlation. Attribution requires:
1. A defined cause (what was done or applied)
2. A defined outcome (what was observed)
3. A causal pathway (the mechanism by which the cause produced the outcome)
4. A temporal relationship (the cause preceded the outcome)
5. A counterfactual (what would have happened without the cause)
6. A confidence level (how certain is the causal claim)

### Attribution vs. Correlation vs. Coincidence

| Level | Description | Example | Salt Basin Action |
|---|---|---|---|
| Attribution | Cause identified, pathway documented, counterfactual constructed | "Pre-bill review caused an 85% reduction in disputes — pathway: customers corrected errors before invoice, counterfactual: historical dispute rate without review" | Register as verified attribution |
| Correlation | Two things moved together; cause uncertain | "Companies with HOS™ have lower ARR leakage" | Register as candidate — pathway not yet established |
| Coincidence | Co-occurrence with no causal mechanism | "Revenue improved during the same quarter as onboarding" | Do not register as attribution |

---

## 2. Attribution Schema

Every attribution in the Salt Basin system must be registered with the following structure:

```
Attribution:
  attribution_id:       ATTR-{DOMAIN_CODE}-{SEQUENCE}
  claim_id:             [CLM-ID from ART-16]
  metric_id:            [MET-ID from ART-17, if quantified]
  
  cause:
    cause_description:  [What was done / applied / changed]
    cause_type:         Intervention | Condition | Event | Design Feature
    cause_start:        [When the cause was applied]
    cause_agent:        [Who or what applied the cause — product / feature / process]
  
  outcome:
    outcome_description: [What was observed]
    outcome_metric:      [Quantified outcome if available]
    outcome_period:      [When the outcome was measured]
    outcome_source:      [SRC-ID of the evidence source]
  
  causal_pathway:
    mechanism:          [How the cause produced the outcome — step by step]
    intermediaries:     [Any intermediate steps or conditions in the pathway]
    pathway_documented: Y | N | Partial
  
  temporal_relationship:
    cause_before_outcome: Y | N | Ambiguous
    lag_time:           [Time between cause and measurable outcome]
  
  counterfactual:
    counterfactual_id:  [CFT-ID]
    question:           [What would have happened without the cause?]
    alternate_scenario: [Most plausible alternate explanation]
    baseline_evidence:  [Evidence for what the baseline was before intervention]
    falsifiability:     [What would refute this attribution?]
  
  confidence:
    level:              High | Medium | Low | Directional
    rationale:          [Why this confidence level applies]
    confounders:        [Known factors that could partially explain the outcome]
  
  limitations:
    scope:              [What this attribution does and does not cover]
    conditions:         [Conditions required for this attribution to hold]
    generalizability:   [Can this attribution be generalized? To what population?]
  
  outcome_observation:
    actual_result:      [What was actually observed]
    delta_from_claim:   [Gap between attributed claim and observed result]
    observation_date:   [When the observation was made]
    updated_by:         [SRC-ID for the observation update]
  
  status:               Verified | Candidate | Hypothesis | Retired
```

---

## 3. Counterfactual Construction Standard

Every material attribution must include a counterfactual — a defined statement of what would have occurred in the absence of the cause.

### Counterfactual Schema

```
Counterfactual:
  counterfactual_id:    CFT-{SEQUENCE}
  attribution_id:       [Parent ATTR-ID]
  
  question:             [The counterfactual question — "What would have happened if..."]
  baseline:             [The pre-intervention state — what was true before]
  baseline_source:      [SRC-ID or CLM-ID for baseline evidence]
  alternate_scenario:   [Most plausible world without the cause]
  
  falsifier:
    condition:          [What would need to be true for the attribution to be false?]
    evidence_needed:    [What evidence would refute the attribution?]
    current_evidence_against: [Any existing evidence that weakens the attribution]
  
  alternate_explanations:
    - explanation:      [Other factor that could explain the outcome]
      likelihood:       High | Medium | Low
      evidence:         [Source or reasoning for assessing this likelihood]
  
  robustness:
    result_if_baseline_different: [How does the conclusion change if baseline is 20% better?]
    result_if_effect_halved:      [How does the conclusion change if the effect is 50% of claimed?]
    minimum_effect_to_justify:    [What is the smallest real effect that still supports the claim?]
```

### Counterfactual Requirement by Claim Type

| Claim Type | Counterfactual Required | Standard |
|---|---|---|
| Market claims | Y | What if TAM is 50% smaller? Does the business case hold? |
| Performance claims | Y | What conditions must be absent for the claimed outcome NOT to occur? |
| Benchmark claims | Y | What if the industry benchmark is directionally correct but the magnitude is half? |
| Capability claims | Y (if outcome-oriented) | What happens if this capability is absent? What workaround exists? |
| Risk claims | Y — required | A risk claim IS a counterfactual — "without X, Y occurs" |

---

## 4. Canonical Attribution Register

### ATTR-HOS-001 — Pre-Bill Review → Dispute Reduction

```
attribution_id:     ATTR-HOS-001
claim_id:           CLM-HOS-005
metric_id:          MET-HOS-005

cause:
  description:      Customer receives bill preview and review window before invoice is finalized
  type:             Intervention (product feature)
  agent:            HOS™ Step 9 — Pre-Bill Notification System

outcome:
  description:      Post-invoice dispute rate reduces by up to 85%
  metric:           85% reduction in disputes (CLM-HOS-005)
  source:           SRC-008

causal_pathway:
  mechanism:        >
    1. Customer receives pre-bill preview 5–10 days before invoice finalization
    2. Customer identifies billing discrepancies before invoice is issued
    3. Disputes are resolved in preview stage — invoice is corrected before issuance
    4. Issued invoice reflects agreed amounts — customer has no basis to dispute
  pathway_documented: Partial — mechanism is logical; primary study needed

temporal_relationship:
  cause_before_outcome: Y
  lag_time: Same billing cycle

counterfactual_id:  CFT-001
  question:         What would happen if pre-bill review were absent?
  baseline:         Industry dispute rate without pre-bill review (estimated 5–15% of invoices)
  alternate_scenario: Customer receives final invoice; errors discovered post-issuance; dispute process initiated; 30–60 day resolution cycle
  falsifier:
    condition:      Customers do not engage with pre-bill previews (low open rate)
    evidence_needed: Pre-bill preview open/engagement rate data from implementation
  alternate_explanations:
    - explanation:  Dispute reduction could be partly attributable to improved contract clarity, not just pre-bill review
      likelihood:   Medium
    - explanation:  Customers with lower billing complexity would have lower dispute rates regardless
      likelihood:   Medium

confidence:
  level:            Directional
  rationale:        Mechanism is logical and well-supported; 85% specific magnitude requires primary study
  confounders:      Pricing model complexity, customer sophistication, billing system accuracy

limitations:
  scope:            Claim applies to complex enterprise SaaS billing; may not hold for simple flat-fee models
  conditions:       Customers must engage with pre-bill preview for the mechanism to work

outcome_observation:
  actual_result:    Not yet observed at scale — HOS™ Step 9 is architecture
  delta_from_claim: N/A — not yet implemented

status:             Candidate
```

---

### ATTR-HOS-002 — HOS™ Fund Admin Push → PE Data Quality

```
attribution_id:     ATTR-HOS-002
claim_id:           CLM-HOS-010
metric_id:          N/A (capability claim)

cause:
  description:      HOS™ sits inside portco operational systems and automatically pushes clean deal-anchored data upward to fund admin (Allvue / iLevel / PitchBook)
  type:             Design Feature
  agent:            HOS™ Fund Admin Upward Data Push (CONN-008, CONN-009, CONN-010)

outcome:
  description:      Fund admin receives clean, deal-anchored, automatically-reconciled portfolio data — eliminating manual export/import cycle
  metric:           Time-to-data reduced from weeks (manual) to hours (automated)

causal_pathway:
  mechanism:        >
    1. Contract data is governed at portco level (Contract Registry)
    2. Revenue events flow through Salt Basin Layer (normalized, lineage-tagged)
    3. HOS™ push connector maps governed data to fund admin schema
    4. Push occurs at configured cadence (daily/real-time) without human intervention
    5. Fund admin receives clean data without spreadsheet relay or manual reconciliation
  pathway_documented: Y (architecture)

counterfactual_id:  CFT-002
  question:         What happens to fund admin data quality without HOS™ push?
  baseline:         Manual export from portco systems → spreadsheet → import to fund admin; weekly or monthly cadence; high error rate from manual reconciliation
  alternate_scenario: Fund uses existing manual process; data lag = days to weeks; errors persist until quarterly QoE review
  falsifier:
    condition:      Fund admin vendor builds native portco integration (Silver Lake/Zuora risk)
    evidence_needed: Fund admin vendor product roadmap monitoring

confidence:
  level:            High (for mechanism); Low (for competitive uniqueness claim — no primary competitive audit)
  confounders:      Partial workarounds exist (manual data rooms, spreadsheet-based reconciliation)

limitations:
  scope:            Claim applies to HOS™ as designed; product is architecture-only as of July 2026
  conditions:       Portco must run on a supported source system (CONN-001 through CONN-007)

outcome_observation:
  actual_result:    Not yet observed — HOS™ fund admin push is architecture
  delta_from_claim: N/A

status:             Hypothesis (mechanism specified; implementation not yet built)
```

---

### ATTR-HOS-003 — Invoice Error → Revenue Leakage Causal Chain

```
attribution_id:     ATTR-HOS-003
claim_id:           CLM-HOS-001 + CLM-HOS-002
metric_id:          MET-HOS-001 + MET-HOS-002

cause:
  description:      39% of enterprise invoices contain errors; errors in tier/overage application produce 3-7% revenue leakage
  type:             Condition (absence of billing governance)
  agent:            N/A — this is the absence of a solution

outcome:
  description:      Revenue leakage of 3-7% of billed revenue from misapplied pricing

causal_pathway:
  mechanism:        >
    1. Contract pricing terms are complex (tiered, usage-based, overage)
    2. Billing system applies pricing from a non-machine-readable source (spreadsheet, tribal knowledge)
    3. Tier boundaries or overage rates are applied incorrectly
    4. Invoice is issued with wrong amount
    5. Customer pays invoice without dispute (may not notice or may not care)
    6. Revenue leakage is never recovered
  pathway_documented: Y

counterfactual_id:  CFT-003
  question:         If machine-readable pricing terms governed billing directly, what would leakage be?
  baseline:         Current estimated leakage: 3-7% of billed revenue
  alternate_scenario: Machine-readable contract terms govern billing calculation; tier/overage applied per governed pricing atom; leakage theoretically approaches zero (implementation errors remain possible)
  falsifier:
    condition:      Billing errors are not systematically directional (i.e., errors benefit customer as often as vendor)
    evidence_needed: Distribution of billing error direction (under-billing vs. over-billing)

alternate_explanations:
  - explanation:    Revenue leakage could be from scope creep / scope reduction that is not billed correctly — not purely a pricing tier error
    likelihood:     Medium

confidence:
  level:            Medium
  rationale:        Direction of claim (billing errors cause leakage) is well-supported; exact percentage requires primary study

outcome_observation:
  actual_result:    Not yet measured — HOS™ billing governance is architecture

status:             Candidate
```

---

## 5. Attribution Governance Rules

1. **Attribution requires a counterfactual.** An attribution registered without a counterfactual record is incomplete — must not be used in pitch or client-facing material at Verified status.
2. **Correlation is not attribution.** Two correlated metrics may share a cause or one may cause the other or neither — the attribution must establish the causal pathway explicitly.
3. **Causal pathways must be documented.** A pathway labeled "logical" without documented steps is Candidate status at best, Hypothesis at worst.
4. **Alternate explanations must be assessed.** Every attribution must consider at least one alternate explanation and assess its likelihood.
5. **Confidence levels govern use.** Hypothesis attributions must be labeled as such in any external document — never presented as verified.
6. **Outcome observations update the record.** When HOS™ is implemented and dispute rates are measured, ATTR-HOS-001 must be updated with actual results. Delta from claim must be documented.
7. **Robustness testing is required for material claims.** Any attribution used to justify a $1M+ ROI claim must pass the "halved effect" test — if the true effect is half the claimed effect, does the claim still support the product's value proposition?
8. **Attribution IDs are permanent.** An ATTR-ID once assigned belongs to that attribution. Retired attributions are archived, not deleted.
9. **The UI must not present attribution confidence levels higher than registered.** A Candidate attribution may not be labeled "Proven" or "Verified" in any user-facing interface.
10. **Competitive claims require additional scrutiny.** CLM-HOS-010 (no competitor does fund admin push) is a competitive landscape claim — requires quarterly re-verification and must be labeled as "as of [date]" in all uses.
