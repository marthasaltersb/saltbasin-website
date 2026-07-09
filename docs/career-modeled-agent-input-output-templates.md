# Career-Modeled Agent Input and Output Templates

Companion to [career-modeled-operational-agent-catalog.md](career-modeled-operational-agent-catalog.md).

Purpose: provide the next level down for each proposed agent: reusable intake templates, output artifact templates, and implementation-ready field structures.

Salt Basin-specific homepage intake, safe-preview, consent, contact-routing, and visitor Q&A templates are defined in [salt-basin-specific-agent-playbook.md](salt-basin-specific-agent-playbook.md).

All templates in this document inherit the universal reasoning layer in [salt-basin-universal-agent-reasoning-context.md](salt-basin-universal-agent-reasoning-context.md). Add this context to every current and future agent at prompt assembly time.

Visitor-facing Salt Basin agents must also inherit the required question capture pattern:

```text
Relationship first: Do you already know Betsy? If so, what is the connection?
Opening: What are the top 5 questions you want to get answered today - if you don't have 5, start with 1
Closing: Did you get all of your questions answered? If not, can you provide any questions before leaving to give Betsy context?
```

## Shared Run Envelope

Use this wrapper for every agent run, regardless of command.

```json
{
  "runId": "",
  "agentId": "",
  "command": "",
  "requestedBy": "",
  "scope": "admin | member | organization | project",
  "audience": "",
  "objective": "",
  "deadline": "",
  "sourceDocuments": [],
  "sourceDataFiles": [],
  "systemsInScope": [],
  "stakeholders": [],
  "knownConstraints": [],
  "desiredOutputFormat": "markdown | json | docx | xlsx | dashboard_spec",
  "approvalRequired": true,
  "visitorQuestionCapture": {
    "requiredForVisitorFacingAgents": true,
    "relationshipQuestion": "Do you already know Betsy? If so, what is the connection?",
    "openingQuestion": "What are the top 5 questions you want to get answered today - if you don't have 5, start with 1",
    "closingQuestion": "Did you get all of your questions answered? If not, can you provide any questions before leaving to give Betsy context?",
    "knowsBetsy": "",
    "connectionToBetsy": "",
    "topQuestionsForToday": [],
    "unansweredExitQuestions": []
  },
  "universalReasoningContext": {
    "enabled": true,
    "contextRef": "docs/salt-basin-universal-agent-reasoning-context.md",
    "reasoningMode": "operational_truth_lineage_evidence_governance"
  },
  "memoryTags": []
}
```

## Shared Output Envelope

Every agent should return the same meta-structure so BestyStaff and the platform can assemble outputs consistently.

```json
{
  "runId": "",
  "agentId": "",
  "status": "draft | needs_input | ready_for_review | approved",
  "executiveSummary": "",
  "primaryArtifact": {},
  "supportingArtifacts": [],
  "reasoningTrace": {
    "facts": [],
    "assumptions": [],
    "interpretations": [],
    "predictions": [],
    "confidence": "",
    "lineageNotes": [],
    "competingTruths": [],
    "evidenceGaps": []
  },
  "assumptions": [],
  "openQuestions": [],
  "risks": [],
  "recommendedNextActions": [],
  "sourceTrace": [],
  "memoryToSave": []
}
```

## Shared Tables

### Universal Reasoning Trace

| Layer | Notes | Evidence | Confidence | Follow-Up Needed |
|---|---|---|---|---|
| Facts |  |  | High/Med/Low |  |
| Assumptions |  |  | High/Med/Low |  |
| Interpretations |  |  | High/Med/Low |  |
| Predictions |  |  | High/Med/Low |  |
| Risks |  |  | High/Med/Low |  |
| Recommendations |  |  | High/Med/Low |  |

### Lineage Record

| Object / Claim / Metric | Origin | Transformations | Current State | Owner | Evidence | Version | Confidence |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  | High/Med/Low |

### Competing Truth Reconciliation

| Topic | Accounting Truth | Operational Truth | Data Truth | Legal/Contract Truth | Executive Truth | Customer/Employee Truth | Reconciliation Needed |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

### Risk Register

| Risk ID | Risk | Area | Severity | Likelihood | Impact | Owner | Mitigation | Decision Needed |
|---|---|---|---|---|---|---|---|---|
| R-001 |  |  | High/Med/Low | High/Med/Low |  |  |  |  |

### Decision Log

| Decision ID | Decision | Options Considered | Recommendation | Owner | Due Date | Status | Rationale |
|---|---|---|---|---|---|---|---|
| D-001 |  |  |  |  |  | Open/Decided |  |

### Evidence Request List

| Request ID | Evidence Needed | Why It Matters | Source Owner | Priority | Due Date |
|---|---|---|---|---|---|
| E-001 |  |  |  | High/Med/Low |  |

## 1. Q2R Leakage Diagnostic Agent

Command: `/q2r-diagnostic`

### Input Template

```json
{
  "companyProfile": {
    "companyName": "",
    "industry": "",
    "ownershipContext": "PE-backed | public | private | founder-led | other",
    "annualRevenueOrARR": "",
    "customerSegments": [],
    "products": [],
    "geographies": []
  },
  "revenueModel": {
    "modelTypes": ["subscription", "usage", "services", "one-time", "hybrid"],
    "contractTerms": "",
    "renewalMotion": "",
    "billingFrequency": "",
    "pricingComplexity": ""
  },
  "systemsLandscape": {
    "crm": "",
    "cpq": "",
    "clm": "",
    "billing": "",
    "erp": "",
    "dataWarehouse": "",
    "integrations": []
  },
  "knownPainPoints": [],
  "sampleTransactions": {
    "quotes": [],
    "contracts": [],
    "orders": [],
    "invoices": [],
    "renewals": [],
    "creditMemos": []
  },
  "metrics": {
    "arr": "",
    "renewalVolume": "",
    "invoiceVolume": "",
    "billingErrorRate": "",
    "manualAdjustmentVolume": "",
    "dsosOrCollectionsIssues": ""
  }
}
```

### Output Template

```markdown
# Q2R Leakage Diagnostic

## Executive Summary

## Leakage Heatmap
| Scenario | Process Area | Evidence | Severity | Estimated Impact | Confidence | Owner |
|---|---|---|---|---|---|---|

## Leakage Hypotheses
| Hypothesis | Why It May Be Happening | Data Needed | Fastest Validation Step |
|---|---|---|---|

## Process Risk Review
- Product/catalog:
- Pricing/discounting:
- Approvals:
- Contracting:
- Order handoff:
- Billing:
- Revenue recognition:
- Renewals:
- Reporting:

## Quick Wins
| Action | Expected Benefit | Effort | Owner | Timing |
|---|---|---|---|---|

## 30/60/90-Day Roadmap

## Evidence Request List

## Assumptions and Open Questions
```

## 2. O2C Discovery Mapper

Command: `/o2c-discovery`

### Input Template

```json
{
  "processScope": {
    "startPoint": "lead | quote | order | contract | invoice | other",
    "endPoint": "cash | collections | revenue recognition | reporting | other",
    "businessUnits": [],
    "geographies": [],
    "inScopeProcesses": [],
    "outOfScopeProcesses": []
  },
  "stakeholderInputs": [
    {
      "name": "",
      "role": "",
      "team": "",
      "painPoints": [],
      "requirements": [],
      "exceptions": []
    }
  ],
  "currentStateArtifacts": {
    "sops": [],
    "processMaps": [],
    "screenshots": [],
    "reports": [],
    "sampleTransactions": []
  },
  "targetOutcomes": [],
  "implementationContext": {
    "plannedPlatform": "",
    "timeline": "",
    "handoffTeam": "",
    "mustKeepControls": []
  }
}
```

### Output Template

```markdown
# O2C Discovery Package

## Discovery Summary

## Current-State Process Inventory
| L2 Process | L3 Step | Actor | System | Inputs | Outputs | Pain Point |
|---|---|---|---|---|---|---|

## Future-State Process Design
| L2 Process | L3 Step | Actor | System | Business Rule | Control |
|---|---|---|---|---|---|

## Business Scenario Catalog
| Scenario | Trigger | Happy Path | Exceptions | Data Needed | Systems |
|---|---|---|---|---|---|

## Business Rules Matrix
| Rule ID | Rule | Process Area | Applies To | Source | Build Implication |
|---|---|---|---|---|---|

## Open Decisions

## Implementation Handoff Checklist
```

## 3. CPQ Pricing Architect

Command: `/cpq-pricing-model`

### Input Template

```json
{
  "catalog": {
    "products": [],
    "bundles": [],
    "skus": [],
    "attributes": [],
    "legacyCatalogFiles": []
  },
  "pricing": {
    "priceBooks": [],
    "formulas": [],
    "discountRules": [],
    "approvalThresholds": [],
    "manualPricingWorkarounds": [],
    "commodityOrIndexBasedInputs": []
  },
  "quoteProcess": {
    "quoteTypes": [],
    "salesSegments": [],
    "dealDeskRole": "",
    "exceptionPaths": [],
    "requiredOutputs": []
  },
  "systems": {
    "crm": "",
    "cpq": "",
    "erp": "",
    "billing": "",
    "integrationTools": []
  }
}
```

### Output Template

```markdown
# CPQ Pricing Architecture

## Design Summary

## Product Model
| Product Family | Product | SKU/Code | Attributes | Configuration Rules | Notes |
|---|---|---|---|---|---|

## Pricing Logic
| Pricing Rule | Inputs | Formula/Logic | Applies To | Exceptions | System Owner |
|---|---|---|---|---|---|

## Discount and Approval Framework
| Condition | Threshold | Required Approval | Routing | Audit Requirement |
|---|---|---|---|---|

## Manual Workarounds To Eliminate
| Workaround | Current Owner | Risk | Replacement Design |
|---|---|---|---|

## CPQ Build Backlog
| Story | Priority | Dependency | Acceptance Criteria |
|---|---|---|---|

## UAT Scenarios
```

## 4. Revenue Cloud Billing Architect

Command: `/billing-architecture`

### Input Template

```json
{
  "billingModel": {
    "billingTypes": ["subscription", "usage", "milestone", "services", "one-time"],
    "billingFrequency": "",
    "invoiceGrouping": "",
    "taxHandling": "",
    "creditAndRebillRules": "",
    "revenueRecognitionDependencies": []
  },
  "orderFlow": {
    "orderSources": [],
    "orderObjects": [],
    "activationRules": [],
    "amendmentRules": [],
    "cancellationRules": []
  },
  "usageData": {
    "usageEvents": [],
    "meteringSource": "",
    "ratingLogic": "",
    "lateUsageHandling": ""
  },
  "errorPatterns": [],
  "systems": {
    "cpq": "",
    "billing": "",
    "erp": "",
    "payments": "",
    "integrationTools": []
  }
}
```

### Output Template

```markdown
# Billing Architecture

## Executive Summary

## Target Billing Flow
| Step | Trigger | Source System | Target System | Data Created/Updated | Control |
|---|---|---|---|---|---|

## Billing Rules
| Rule ID | Rule | Applies To | Exception Handling | Revenue/Finance Impact |
|---|---|---|---|---|

## Usage Billing Design
| Usage Event | Metering Source | Rating Logic | Billing Treatment | Validation |
|---|---|---|---|---|

## Error Handling and Reprocessing
| Error Type | Root Cause | Auto-Reprocess Logic | Manual Owner | SLA |
|---|---|---|---|---|

## Integration Points

## Billing UAT Pack
```

## 5. CLM and Approval Flow Designer

Command: `/clm-approval-design`

### Input Template

```json
{
  "contractTypes": [],
  "clauseLibrary": [],
  "approvalPolicy": {
    "commercialThresholds": [],
    "legalThresholds": [],
    "financeThresholds": [],
    "securityPrivacyThresholds": []
  },
  "dealMetadata": {
    "requiredFields": [],
    "conditionalFields": [],
    "sourceSystems": []
  },
  "teams": {
    "sales": [],
    "legal": [],
    "finance": [],
    "operations": [],
    "executives": []
  },
  "knownIssues": []
}
```

### Output Template

```markdown
# CLM and Approval Flow Design

## Design Summary

## Contract Lifecycle Workflow
| Stage | Actor | System | Entry Criteria | Exit Criteria | SLA |
|---|---|---|---|---|---|

## Approval Matrix
| Condition | Threshold | Approval Role | Routing Logic | Evidence Required |
|---|---|---|---|---|

## Clause and Risk Controls
| Clause/Risk | Risk Level | Approved Language | Escalation Rule | Owner |
|---|---|---|---|---|

## Required Contract Metadata

## Test Scenarios

## Open Decisions
```

## 6. Integration and Data Mapping Agent

Command: `/integration-map`

### Input Template

```json
{
  "systems": [
    {
      "name": "",
      "type": "crm | cpq | clm | billing | erp | mdm | marketing | data warehouse | other",
      "owner": "",
      "apiAvailable": true,
      "objectsInScope": []
    }
  ],
  "sourceSchemas": [],
  "targetSchemas": [],
  "samplePayloads": [],
  "businessRules": [],
  "timingAndVolume": {
    "batchOrRealtime": "",
    "frequency": "",
    "expectedVolume": "",
    "peakPeriods": ""
  },
  "knownFailures": []
}
```

### Output Template

```markdown
# Integration and Data Mapping

## Integration Summary

## System Context
| System | Role | Owner | Objects In Scope | Source Of Truth |
|---|---|---|---|---|

## Source-to-Target Mapping
| Source System | Source Object.Field | Transformation | Target System | Target Object.Field | Required | Validation |
|---|---|---|---|---|---|---|

## Integration Sequence
| Sequence | Trigger | Action | Dependency | Failure Handling |
|---|---|---|---|---|

## Reconciliation Controls

## Integration Risk Register

## QA Validation Plan
```

## 7. Data Migration and MDM Agent

Command: `/data-migration-plan`

### Input Template

```json
{
  "entities": ["account", "contact", "product", "price", "contract", "subscription", "asset", "order", "invoice"],
  "sourceData": [],
  "targetSchema": [],
  "masterDataOwnership": {
    "account": "",
    "product": "",
    "customer": "",
    "contract": "",
    "subscription": ""
  },
  "dataQualityKnownIssues": [],
  "migrationConstraints": {
    "cutoverWindow": "",
    "freezePeriod": "",
    "rollbackRequirement": "",
    "auditRequirement": ""
  },
  "downstreamDependencies": []
}
```

### Output Template

```markdown
# Data Migration and MDM Plan

## Migration Summary

## Entity Scope
| Entity | Source | Target | Owner | Migration Wave | Criticality |
|---|---|---|---|---|---|

## Data Quality Profile
| Issue | Entity | Severity | Count/Scope | Business Impact | Remediation |
|---|---|---|---|---|---|

## Cleansing and Transformation Rules
| Rule ID | Entity | Rule | Owner | Validation |
|---|---|---|---|---|

## Load Sequence

## Cutover Plan

## Validation and Signoff Checklist

## Rollback Plan
```

## 8. QA Defect Triage Agent

Command: `/qa-triage`

### Input Template

```json
{
  "defects": [
    {
      "defectId": "",
      "title": "",
      "description": "",
      "stepsToReproduce": [],
      "expectedResult": "",
      "actualResult": "",
      "screenshotsOrLogs": [],
      "system": "",
      "processArea": "",
      "reportedBy": "",
      "blocking": false
    }
  ],
  "releaseContext": {
    "releaseName": "",
    "environment": "",
    "deploymentDate": "",
    "recentChanges": []
  },
  "testContext": {
    "testScript": "",
    "testData": "",
    "relatedRequirements": []
  }
}
```

### Output Template

```markdown
# QA Defect Triage

## Triage Summary

## Defect Clusters
| Cluster | Pattern | Related Defects | Likely Root Cause | Business Impact |
|---|---|---|---|---|

## Defect Board
| Defect ID | Severity | Priority | Process Area | System Layer | Owner | Next Step |
|---|---|---|---|---|---|---|

## Root-Cause Hypotheses

## Hidden Defects To Check

## Fix Sequencing Plan

## Executive Risk Summary
```

## 9. UAT Scenario Generator

Command: `/uat-scenarios`

### Input Template

```json
{
  "requirements": [],
  "processMaps": [],
  "businessRules": [],
  "personas": [],
  "systems": [],
  "dataModel": [],
  "integrations": [],
  "inScopeScenarioTypes": ["happy path", "edge case", "exception", "approval", "integration", "reporting"],
  "goLiveCriteria": []
}
```

### Output Template

```markdown
# UAT Scenario Pack

## Test Strategy Summary

## Scenario Inventory
| Scenario ID | Scenario | Persona | Process Area | Priority | Requirement Trace |
|---|---|---|---|---|---|

## Test Scripts
| Step | Action | Test Data | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|---|

## Test Data Matrix
| Data Set | Scenario IDs | Required Fields | Source | Owner |
|---|---|---|---|---|

## Requirement Traceability

## Go/No-Go Criteria
```

## 10. Executive Alignment Briefing Agent

Command: `/exec-alignment-brief`

### Input Template

```json
{
  "businessContext": {
    "initiative": "",
    "strategicObjective": "",
    "financialOrOperationalStakes": "",
    "deadlineOrEvent": ""
  },
  "audience": {
    "primaryAudience": "",
    "decisionMakers": [],
    "stakeholders": [],
    "knownConcerns": []
  },
  "currentStatus": {
    "progress": "",
    "risks": [],
    "blockers": [],
    "metrics": [],
    "recentDecisions": []
  },
  "decisionNeeded": []
}
```

### Output Template

```markdown
# Executive Alignment Brief

## Bottom Line

## Why This Matters Now

## Current State

## Decision Points
| Decision | Options | Recommendation | Impact | Timing |
|---|---|---|---|---|

## Risks and Mitigations

## Recommended Path

## Next 5 Actions

## Appendix: Supporting Detail
```

## 11. PE Value Creation Agent

Command: `/pe-value-creation`

### Input Template

```json
{
  "portfolioCompany": {
    "name": "",
    "industry": "",
    "ownershipDate": "",
    "investmentThesis": "",
    "growthPlan": "",
    "exitTimeline": ""
  },
  "operatingContext": {
    "arrOrRevenue": "",
    "customerCount": "",
    "products": [],
    "systems": [],
    "knownOperationalIssues": []
  },
  "valueAreas": {
    "pricing": "",
    "renewals": "",
    "billing": "",
    "dataQuality": "",
    "reporting": "",
    "salesProcess": "",
    "customerRetention": ""
  },
  "diligenceMaterials": []
}
```

### Output Template

```markdown
# PE Value Creation Assessment

## Investment Context

## Value Creation Thesis

## Operational Lever Backlog
| Lever | Area | Value Hypothesis | Evidence | Effort | Timeframe | Owner |
|---|---|---|---|---|---|---|

## Exit-Readiness Risks

## 100-Day Plan
| Phase | Actions | Outcomes | Dependencies |
|---|---|---|---|

## Evidence Request List

## Operating Partner Summary
```

## 12. M&A Lead-to-Cash Integration Agent

Command: `/mna-l2c-integration`

### Input Template

```json
{
  "entitiesToIntegrate": [
    {
      "companyName": "",
      "products": [],
      "systems": [],
      "processes": [],
      "dataModels": []
    }
  ],
  "integrationObjective": "",
  "dealContext": {
    "transactionType": "",
    "closeDate": "",
    "integrationDeadline": "",
    "mustPreserveCapabilities": []
  },
  "l2cAreas": {
    "lead": [],
    "opportunity": [],
    "quote": [],
    "contract": [],
    "order": [],
    "billing": [],
    "renewal": []
  },
  "knownConflicts": []
}
```

### Output Template

```markdown
# M&A Lead-to-Cash Integration Plan

## Integration Principles

## Process Comparison
| Area | Company A | Company B | Conflict | Recommendation |
|---|---|---|---|---|

## Data and Hierarchy Decisions
| Decision Area | Current Conflict | Recommended Model | Owner | Timing |
|---|---|---|---|---|

## Systems Consolidation Options

## Phased Roadmap

## Risk Controls

## Open Decisions
```

## 13. ARR and Retention Modeling Agent

Command: `/arr-retention-model`

### Input Template

```json
{
  "revenueData": {
    "contracts": [],
    "subscriptions": [],
    "invoices": [],
    "opportunities": [],
    "renewalRecords": [],
    "customerHierarchy": []
  },
  "metricDefinitions": {
    "arrDefinition": "",
    "newBusiness": "",
    "expansion": "",
    "contraction": "",
    "churn": "",
    "reactivation": "",
    "fxTreatment": ""
  },
  "reportingNeeds": {
    "audience": "",
    "cadence": "",
    "investorFormat": "",
    "cohortViews": []
  },
  "knownDataIssues": []
}
```

### Output Template

```markdown
# ARR and Retention Model

## Model Summary

## ARR Movement Definitions
| Movement Type | Definition | Source Data | Calculation Logic | Caveats |
|---|---|---|---|---|

## Data Requirements
| Field | Source | Required | Purpose | Quality Risk |
|---|---|---|---|---|

## Retention Metrics
| Metric | Formula | Use Case | Reporting Cadence |
|---|---|---|---|

## Customer Hierarchy Treatment

## Investor Reporting Spec

## Data Quality Risks
```

## 14. Usage-Based Monetization Agent

Command: `/usage-pricing-launch`

### Input Template

```json
{
  "productContext": {
    "products": [],
    "usageEvents": [],
    "customerSegments": [],
    "launchDate": "",
    "gtmMotion": ""
  },
  "pricingStrategy": {
    "pricingDimensions": [],
    "includedUsage": "",
    "overageRules": "",
    "tiers": [],
    "minimums": "",
    "commitments": ""
  },
  "meteringAndBilling": {
    "meteringSource": "",
    "ratingSystem": "",
    "billingSystem": "",
    "invoicePresentation": "",
    "lateUsagePolicy": ""
  },
  "readinessConcerns": []
}
```

### Output Template

```markdown
# Usage-Based Monetization Launch Plan

## Launch Summary

## Usage Event Model
| Event | Source | Unit Of Measure | Required Fields | Validation |
|---|---|---|---|---|

## Pricing and Rating Rules
| Rule | Input | Logic | Output | Exception |
|---|---|---|---|---|

## Quote-to-Bill Flow

## GTM Readiness Checklist
| Area | Requirement | Status | Owner | Gap |
|---|---|---|---|---|

## Billing and Reporting Test Scenarios

## Launch Risks
```

## 15. Financial Reporting Readiness Agent

Command: `/financial-reporting-readiness`

### Input Template

```json
{
  "reportingObjective": {
    "objective": "",
    "audience": "CFO | board | audit | public markets | investors | other",
    "deadline": "",
    "regulatoryContext": []
  },
  "metricsAndOutputs": [],
  "systemOutputs": {
    "crm": [],
    "cpq": [],
    "billing": [],
    "erp": [],
    "dataWarehouse": []
  },
  "controls": [],
  "reconciliationProcesses": [],
  "knownGaps": []
}
```

### Output Template

```markdown
# Financial Reporting Readiness Assessment

## Readiness Summary

## System Output To Metric Map
| Metric | Source System | Source Field/Report | Transformation | Control |
|---|---|---|---|---|

## Control and Reconciliation Map
| Control | Process Area | Owner | Frequency | Evidence |
|---|---|---|---|---|

## Gap Register
| Gap | Reporting Impact | Severity | Remediation | Owner |
|---|---|---|---|---|

## Readiness Score

## Executive Risk Summary
```

## 16. Enablement and Handoff Agent

Command: `/enablement-kit`

### Input Template

```json
{
  "enablementScope": {
    "processOrSystem": "",
    "audiences": [],
    "goLiveDate": "",
    "supportModel": ""
  },
  "sourceArtifacts": {
    "processMaps": [],
    "requirements": [],
    "systemDesigns": [],
    "testScripts": [],
    "knownIssues": []
  },
  "rolesAndResponsibilities": [],
  "adoptionRisks": [],
  "desiredAssets": ["training outline", "sop", "job aid", "handoff checklist", "operating cadence"]
}
```

### Output Template

```markdown
# Enablement and Handoff Kit

## Audience Plan
| Audience | What They Need To Know | Format | Owner | Timing |
|---|---|---|---|---|

## SOP
| Step | Role | Action | System | Expected Outcome | Exception |
|---|---|---|---|---|---|

## Job Aids

## Operating Cadence
| Meeting/Activity | Purpose | Owner | Cadence | Inputs | Outputs |
|---|---|---|---|---|---|

## Handoff Checklist

## Adoption Risks and Mitigations
```

## 17. Pursuit and Proposal Win-Room Agent

Command: `/pursuit-win-room`

### Input Template

```json
{
  "pursuitContext": {
    "client": "",
    "opportunity": "",
    "buyer": "",
    "budget": "",
    "timeline": "",
    "competitors": []
  },
  "discoveryFindings": [],
  "clientPain": [],
  "proofPoints": [],
  "proposedScope": [],
  "constraintsAndAssumptions": [],
  "differentiators": [],
  "commercialModel": ""
}
```

### Output Template

```markdown
# Pursuit Win-Room Package

## Win Strategy

## Client Pain To Value Map
| Pain | Business Impact | Proposed Response | Proof Point |
|---|---|---|---|

## Scope Options
| Option | Description | Pros | Cons | Estimate | Recommendation |
|---|---|---|---|---|---|

## Proposal Sections

## Executive Talk Track

## Risks, Assumptions, and Dependencies

## Follow-On Scope Opportunities
```

## 18. Distressed Asset Scoring Agent

Command: `/distressed-asset-score`

### Input Template

```json
{
  "asset": {
    "nameOrAddress": "",
    "assetType": "",
    "market": "",
    "currentUse": "",
    "ownershipContext": "",
    "askingPriceOrBookValue": "",
    "debtContext": ""
  },
  "financials": {
    "revenue": "",
    "noi": "",
    "occupancy": "",
    "capexNeeds": "",
    "operatingCosts": "",
    "comps": []
  },
  "distressSignals": [],
  "investmentCriteria": [],
  "availableDocuments": []
}
```

### Output Template

```markdown
# Distressed Asset Scorecard

## Asset Summary

## Scorecard
| Dimension | Score | Evidence | Assumptions | Notes |
|---|---|---|---|---|

## Investment Thesis Hypothesis

## Red Flags

## Diligence Questions
| Question | Why It Matters | Source To Confirm | Priority |
|---|---|---|---|

## Recommended Next Step
```

## 19. Investor Language Guard Agent

Command: `/investor-language-review`

### Input Template

```json
{
  "content": "",
  "contentType": "memo | pitch | website | q-and-a | performance-summary | email | other",
  "audience": "",
  "claims": [],
  "supportingEvidence": [],
  "riskTolerance": "strict | moderate | light",
  "termsToAvoid": [],
  "requiredDisclaimers": []
}
```

### Output Template

```markdown
# Investor Language Review

## Review Summary

## Claim Risk Table
| Claim | Risk | Why It Is Risky | Evidence Available | Safer Treatment |
|---|---|---|---|---|

## Language Rules Violated

## Safer Rewrite

## Evidence Needed Before Publication

## Final Approval Notes
```

## 20. BestyStaff Orchestrator

Command: `/bestystaff-orchestrate`

### Input Template

```json
{
  "objective": "",
  "finalDeliverable": "",
  "audience": "",
  "deadline": "",
  "availableAgents": [],
  "sourceMaterials": [],
  "knownConstraints": [],
  "approvalCheckpoints": [],
  "memoryScope": "personal | member | organization | project",
  "successCriteria": []
}
```

### Output Template

```markdown
# BestyStaff Orchestration Plan and Deliverable

## Objective

## Workstream Routing
| Workstream | Agent | Task | Inputs Needed | Output Expected | Status |
|---|---|---|---|---|---|

## Consolidated Findings

## Conflicts or Gaps Between Agent Outputs

## Decision Log

## Final Deliverable

## Follow-Up Backlog
| Task | Owner | Priority | Due Date | Dependency |
|---|---|---|---|---|

## Memory To Save
```

## Platform Storage Templates

### Agent Definition

```json
{
  "id": "",
  "name": "",
  "command": "",
  "category": "",
  "description": "",
  "careerBasis": [],
  "inputTemplateId": "",
  "outputTemplateId": "",
  "promptTemplate": "",
  "universalReasoningContext": {
    "enabled": true,
    "contextRef": "docs/salt-basin-universal-agent-reasoning-context.md",
    "reasoningMode": "operational_truth_lineage_evidence_governance"
  },
  "requiredInputs": [],
  "optionalInputs": [],
  "artifactTypes": [],
  "functions": [],
  "approvalPolicy": {
    "humanApprovalRequired": true,
    "restrictedActions": ["external_send", "system_update", "legal_financial_claim"]
  },
  "memoryTags": []
}
```

### Agent Run Artifact

```json
{
  "artifactId": "",
  "runId": "",
  "agentId": "",
  "artifactType": "",
  "title": "",
  "format": "markdown | json | csv | xlsx | docx | pdf",
  "content": {},
  "sourceTrace": [],
  "createdAt": "",
  "approvedAt": "",
  "approvedBy": ""
}
```

### Memory Record

```json
{
  "memoryId": "",
  "scope": "personal | member | organization | project",
  "sourceRunId": "",
  "tags": [],
  "summary": "",
  "reusablePattern": "",
  "decision": "",
  "riskPattern": "",
  "artifactRefs": [],
  "createdAt": ""
}
```

## Parallel Agent Pool Templates

Use these templates when a single foundational agent role is duplicated across many shards.

### Workload Profile Input

```json
{
  "workloadId": "",
  "objective": "",
  "sourceInventory": [
    {
      "sourceId": "",
      "name": "",
      "type": "pdf | docx | xlsx | csv | json | transcript | system_export | other",
      "pageCount": 0,
      "rowCount": 0,
      "recordCount": 0,
      "wordCount": 0,
      "objects": [],
      "fields": [],
      "processAreas": [],
      "businessUnits": [],
      "systems": []
    }
  ],
  "qualitySignals": {
    "duplicatesExpected": false,
    "missingFieldsExpected": false,
    "ocrOrExtractionRisk": false,
    "ambiguousOwnership": false,
    "sensitiveClaims": false
  },
  "targetAgentTypes": [],
  "deadline": "",
  "approvalRequired": true
}
```

### Workload Profile Output

```json
{
  "workloadId": "",
  "totalPages": 0,
  "totalRows": 0,
  "totalRecords": 0,
  "totalObjects": 0,
  "totalFields": 0,
  "totalDefects": 0,
  "totalRequirements": 0,
  "recommendedScale": "small | medium | large | portfolio",
  "recommendedPools": [
    {
      "agentId": "",
      "workerCount": 0,
      "leadAgentId": "",
      "managerAgentId": "",
      "reason": ""
    }
  ],
  "shardingStrategy": "",
  "risks": [],
  "humanApprovalCheckpoints": []
}
```

### Agent Pool Definition

```json
{
  "poolId": "",
  "runId": "",
  "baseAgentId": "",
  "baseCommand": "",
  "workerCount": 0,
  "leadAgentId": "",
  "managerAgentId": "",
  "maxUnitsPerWorker": 0,
  "unitType": "pages | rows | records | defects | requirements | objects | fields | assets | claims",
  "sharedPrompt": "",
  "sharedOutputTemplateId": "",
  "sharedGlossary": [],
  "sharedBusinessRules": [],
  "sourceAccessPolicy": "shard_only | domain_outputs | all_rollups",
  "approvalPolicy": {
    "requiresLeadReview": true,
    "requiresManagerReview": true,
    "requiresExecutiveReview": false
  }
}
```

### Work Shard Assignment

```json
{
  "shardId": "",
  "poolId": "",
  "assignedWorkerAgentId": "",
  "sequence": 0,
  "unitType": "",
  "unitCount": 0,
  "scope": {
    "businessUnit": "",
    "region": "",
    "productFamily": "",
    "processArea": "",
    "system": "",
    "entity": ""
  },
  "sourceRefs": [],
  "includedRecords": [],
  "excludedRecords": [],
  "instructions": "",
  "knownContext": [],
  "expectedOutputArtifactType": ""
}
```

### Worker Shard Output Packet

```json
{
  "packetId": "",
  "shardId": "",
  "workerAgentId": "",
  "baseAgentId": "",
  "status": "complete | needs_input | blocked",
  "coverage": {
    "unitsAssigned": 0,
    "unitsProcessed": 0,
    "sourceRefsReviewed": []
  },
  "findings": [
    {
      "findingId": "",
      "title": "",
      "description": "",
      "processArea": "",
      "severity": "high | medium | low",
      "confidence": "high | medium | low",
      "evidenceRefs": [],
      "recommendedAction": ""
    }
  ],
  "risks": [],
  "decisionsNeeded": [],
  "openQuestions": [],
  "assumptions": [],
  "duplicatesOrOverlap": [],
  "memoryCandidates": []
}
```

### Functional Lead Rollup Template

```markdown
# Functional Lead Rollup

## Domain

## Worker Coverage
| Worker | Shard | Units Assigned | Units Processed | Status | Notes |
|---|---|---:|---:|---|---|

## Consolidated Findings
| Finding | Shards | Severity | Confidence | Evidence | Recommendation |
|---|---|---|---|---|---|

## Duplicates Removed

## Conflicts Between Workers
| Conflict | Worker A | Worker B | Resolution | Escalate? |
|---|---|---|---|---|

## Domain Risks

## Decisions Needed

## Recommended Management Escalations
```

### Functional Lead Rollup JSON

```json
{
  "rollupId": "",
  "runId": "",
  "leadAgentId": "",
  "domain": "",
  "workerPacketsReviewed": [],
  "coverageSummary": {
    "workers": 0,
    "shards": 0,
    "unitsAssigned": 0,
    "unitsProcessed": 0,
    "coveragePercent": 0
  },
  "consolidatedFindings": [],
  "deduplicatedItems": [],
  "conflicts": [],
  "domainRisks": [],
  "decisionsNeeded": [],
  "escalations": [],
  "recommendedNextActions": []
}
```

## Management Agent Templates

### Operating Model Manager Input

```json
{
  "managerAgentId": "",
  "runId": "",
  "managementScope": "program | revenue_transformation | data_governance | value_creation | delivery_quality | change_enablement",
  "functionalRollups": [],
  "decisionLogs": [],
  "riskRegisters": [],
  "dependencyMaps": [],
  "valueEstimates": [],
  "timelineConstraints": [],
  "executiveQuestions": []
}
```

### Operating Model Manager Output

```markdown
# Operating Model Management View

## Management Summary

## Cross-Domain Findings
| Finding | Domains Affected | Business Impact | Recommendation | Owner |
|---|---|---|---|---|

## Integrated Roadmap
| Phase | Workstream | Action | Dependency | Owner | Target Date |
|---|---|---|---|---|---|

## Cross-Domain Risks
| Risk | Domains | Severity | Mitigation | Escalation |
|---|---|---|---|---|

## Dependency Map

## Decisions For Executive Review
| Decision | Options | Recommendation | Deadline | Impact |
|---|---|---|---|---|

## Resource and Agent Pool Recommendations

## Follow-Up Backlog
```

### Executive Strategy Agent Input

```json
{
  "executiveAgentId": "",
  "runId": "",
  "audience": "",
  "managementViews": [],
  "unresolvedDecisions": [],
  "highSeverityRisks": [],
  "valueCreationEstimates": [],
  "languageReviewRequired": true,
  "desiredFinalArtifact": "executive_brief | board_update | operating_plan | value_creation_plan | implementation_roadmap"
}
```

### Executive Strategy Agent Output

```markdown
# Executive Strategy Deliverable

## Bottom Line

## Strategic Context

## What The Agent Hierarchy Found

## Recommended Path

## Decisions Required
| Decision | Recommendation | Rationale | Risk If Delayed |
|---|---|---|---|

## Value And Impact View

## Operating Roadmap

## Risks To Watch

## Approval Notes
```

## Hierarchy Configuration Template

Use this to define a complete multi-level agent hierarchy for a run.

```json
{
  "hierarchyRunId": "",
  "objective": "",
  "scale": "small | medium | large | portfolio",
  "levels": [
    {
      "level": 0,
      "name": "Data and Memory Layer",
      "agents": ["data-intake-manager", "knowledge-librarian", "evidence-controller", "access-scope-controller"]
    },
    {
      "level": 1,
      "name": "Foundational Workers",
      "pools": []
    },
    {
      "level": 2,
      "name": "Functional Leads",
      "agents": []
    },
    {
      "level": 3,
      "name": "Operating Model Managers",
      "agents": []
    },
    {
      "level": 4,
      "name": "Executive and Strategy Agents",
      "agents": []
    }
  ],
  "visibilityRules": {
    "foundationalWorker": "assigned_shard_only",
    "functionalLead": "domain_worker_outputs",
    "manager": "functional_rollups_and_exceptions",
    "executive": "management_views_and_final_artifacts",
    "evidenceController": "all_source_traces",
    "accessScopeController": "all_scope_metadata"
  },
  "rollupCadence": {
    "workerToLead": "on_shard_completion",
    "leadToManager": "on_domain_completion_or_escalation",
    "managerToExecutive": "daily_or_final",
    "executiveToUser": "on_approval_checkpoint"
  }
}
```

## Pool Sizing Template

```json
{
  "baseAgentId": "",
  "totalUnits": 0,
  "unitType": "",
  "maxUnitsPerWorker": 0,
  "calculatedWorkerCount": 0,
  "recommendedWorkerCount": 0,
  "functionalLeadCount": 0,
  "managementAgentCount": 0,
  "rationale": "",
  "adjustments": [
    {
      "factor": "low_source_quality | high_ambiguity | tight_deadline | high_compliance_risk | many_business_units",
      "adjustment": "",
      "reason": ""
    }
  ]
}
```

## Conflict Resolution Template

```markdown
# Cross-Agent Conflict Resolution

## Conflict Summary

## Conflicting Outputs
| Agent | Shard/Domain | Finding | Evidence | Confidence |
|---|---|---|---|---|

## Resolution Options
| Option | Pros | Cons | Evidence Needed |
|---|---|---|---|

## Recommended Resolution

## Escalation Required

## Memory Update
```
