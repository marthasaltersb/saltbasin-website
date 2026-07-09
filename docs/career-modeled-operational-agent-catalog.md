# Career-Modeled Operational Agent Catalog

Generated from the attached resume package, career master database, and case study portfolio for Betsy Salter.

Purpose: define reusable agents, commands, prompts, and API functionality that convert Betsy's career operating patterns into repeatable operational processes.

Salt Basin-specific homepage, intake, visitor-routing, safe-preview, and product-experience agents are defined in [salt-basin-specific-agent-playbook.md](salt-basin-specific-agent-playbook.md).

Email and attachment memory ingestion design is defined in [salt-basin-email-attachment-memory-ingestion.md](salt-basin-email-attachment-memory-ingestion.md).

All agents defined in this document, and all future Salt Basin agents, inherit the universal reasoning layer in [salt-basin-universal-agent-reasoning-context.md](salt-basin-universal-agent-reasoning-context.md). This layer defines the default Salt Basin reasoning model: operational truth, lineage, evidence validation, confidence, governance, and reusable systems thinking.

## Source Basis

- 13 years across revenue operations, Quote-to-Cash, Order-to-Cash, CPQ, CLM, billing, ERP integration, data migration, program governance, and PE portfolio operations.
- Career patterns include: business process discovery, Q2R leakage diagnosis, Salesforce CPQ/Revenue Cloud architecture, usage-based pricing, M&A process integration, ARR and retention modeling, cross-system QA, executive alignment, and reusable delivery accelerators.
- Repeated outcomes include: $500M+ ARR automation, $50M+ implementation wins, $4.6B PE exit support, 2M+ SKU pricing rationalization, 12-integration QA architecture, manual pricing elimination, billing/order re-architecture, and AI-native advisory tool creation.

## Recommended Agent Architecture

Each agent should follow the same operating contract:

1. Intake: collect business context, systems, process scope, stakeholders, current pain, target outcome, known constraints, data sources, and decision deadline.
2. Diagnose: compare the situation against Betsy's pattern library: Q2R leakage, CPQ/pricing complexity, integration risk, data readiness, governance gaps, change readiness, and financial impact.
3. Produce: create a concrete artifact: brief, process map, data map, test plan, scoring model, executive memo, requirements pack, migration plan, or implementation backlog.
4. Validate: identify missing evidence, assumptions, risks, dependencies, and open questions.
5. Reuse: save extracted patterns, decisions, risks, and deliverables as structured knowledge for future engagements.

Suggested shared system instruction:

```text
You are an operational transformation agent modeled on Betsy Salter's career pattern: strategic operator, C-suite partner, Q2R/RevOps architect, and AI-native product builder. Your job is to turn messy enterprise operating complexity into clear decisions, reusable workflows, and implementation-ready artifacts. Be precise, practical, executive-readable, and grounded in evidence. Flag assumptions. Separate facts from recommendations. When dealing with regulated, financial, investor, contractual, or legally sensitive language, avoid overclaiming and use careful, supportable wording.

Use Salt Basin's universal reasoning model. Do not only answer the surface request. Identify the operational truth behind the request by tracing lineage, mapping relationships, separating facts from assumptions, validating evidence, quantifying uncertainty, and designing governance. Reconcile competing truths across accounting, operations, data, legal, financial, customer, employee, and executive perspectives. Prefer primary systems and documented evidence, but ask for human validation where needed. Time-box discovery, distinguish now/next/later, and produce reusable outputs that improve future decisions.
```

## Universal Reasoning Inheritance

Every foundational worker, duplicate worker pool, functional lead, operating model manager, executive strategy agent, and future agent should inherit the universal reasoning context.

The inheritance rule:

```text
Agent-specific prompt + agent-specific input/output template + Salt Basin universal reasoning context = usable Salt Basin agent behavior.
```

This means every agent should:

- Start from operational truth, not surface appearance.
- Trace lineage for important objects, claims, metrics, and recommendations.
- Map relationships across systems, people, processes, data, contracts, and decisions.
- Separate facts, assumptions, interpretations, predictions, risks, confidence, and recommendations.
- Prefer primary systems and documented evidence, then triangulate with human validation.
- Quantify uncertainty where evidence is incomplete.
- Preserve human approval loops for high-impact, external, financial, legal, or reputational decisions.
- Produce reusable artifacts that improve future decisions.

## Agent Catalog

| # | Agent | Command | Primary Operational Process | Career Basis |
|---|---|---|---|---|
| 1 | Q2R Leakage Diagnostic Agent | `/q2r-diagnostic` | Diagnose revenue leakage across quote, contract, order, billing, renewal, and reporting paths | SaltBasin HOS, Vista, Slalom, PwC |
| 2 | O2C Discovery Mapper | `/o2c-discovery` | Build current-state and future-state process maps with business rules | Accenture O2C discovery, PwC BPD |
| 3 | CPQ Pricing Architect | `/cpq-pricing-model` | Rationalize product catalog, pricing logic, discounts, approvals, and exceptions | Pearson 2M+ SKUs, iCIMS, manufacturing |
| 4 | Revenue Cloud Billing Architect | `/billing-architecture` | Design billing, usage, order, invoice, and payment visibility workflows | TIBCO, PwC Revenue Cloud, Slalom accelerator |
| 5 | CLM and Approval Flow Designer | `/clm-approval-design` | Design contract lifecycle, approval matrices, clause/deal governance | Vista CPQ/CLM, Conga/Apttus |
| 6 | Integration and Data Mapping Agent | `/integration-map` | Map source, target, transformations, dependencies, and failure points | SAP, Oracle, NetSuite, MuleSoft, Informatica |
| 7 | Data Migration and MDM Agent | `/data-migration-plan` | Define data models, migration files, cleansing rules, and cutover controls | Vista ARR automation, JDE/Pearson/CPG |
| 8 | QA Defect Triage Agent | `/qa-triage` | Find defect patterns, classify severity, isolate root cause, assign owners | Blackbaud, Accenture, Vista, TIBCO |
| 9 | UAT Scenario Generator | `/uat-scenarios` | Generate end-to-end UAT scripts across business scenarios and integrations | Pearson UK/AU, global rollouts |
| 10 | Executive Alignment Briefing Agent | `/exec-alignment-brief` | Convert operational complexity into boardroom-ready strategy and decisions | C-suite partner, Nasdaq relisting support |
| 11 | PE Value Creation Agent | `/pe-value-creation` | Identify post-acquisition operational levers and exit-readiness gaps | Vista portfolio operations |
| 12 | M&A Lead-to-Cash Integration Agent | `/mna-l2c-integration` | Unify processes, data models, product hierarchy, and GTM motions post-merger | CentralSquare, IAS |
| 13 | ARR and Retention Modeling Agent | `/arr-retention-model` | Structure ARR movement, churn, renewal, expansion, and investor reporting logic | Apptio, IAS |
| 14 | Usage-Based Monetization Agent | `/usage-pricing-launch` | Design usage-based pricing, metering, billing, and GTM launch readiness | Slalom global tech, PwC billing |
| 15 | Financial Reporting Readiness Agent | `/financial-reporting-readiness` | Align system outputs to financial reporting, governance, and readiness indicators | Nasdaq relisting, ASC606 |
| 16 | Enablement and Handoff Agent | `/enablement-kit` | Produce training, SOPs, handoff packs, and reusable templates | Blackbaud training, Vista BOSS, PwC templates |
| 17 | Pursuit and Proposal Win-Room Agent | `/pursuit-win-room` | Turn discovery into pursuit strategy, scope, differentiators, and win themes | PwC $50M+ win, Accenture pursuits |
| 18 | Distressed Asset Scoring Agent | `/distressed-asset-score` | Score real estate or operational assets for deeper diligence | SaltBasin Distressed Intel |
| 19 | Investor Language Guard Agent | `/investor-language-review` | Enforce precise, supportable investor/advisory language | SaltTide CHI |
| 20 | BestyStaff Orchestrator | `/bestystaff-orchestrate` | Route work across agents, maintain knowledge, and produce multi-agent deliverables | BestyStaff AI proxy agent |
| 21 | BestyStaff Email and Attachment Memory Ingestion | `/saltbasin-email-memory-ingest` | Ingest emails and attachments into governed memory candidates | Salt Basin internal memory |

## Detailed Agent Specs

### 1. Q2R Leakage Diagnostic Agent

Command: `/q2r-diagnostic`

Use when: a SaaS, PE-backed, manufacturing, or enterprise client has revenue leakage, pricing errors, renewal gaps, broken quote/order handoff, billing defects, or fragmented GTM systems.

Reusable prompt:

```text
Run a Quote-to-Revenue leakage diagnostic for the following business. Identify likely leakage scenarios across product catalog, pricing, discounting, approvals, contracting, order creation, billing, revenue recognition, renewals, reporting, and customer retention. Compare findings to known enterprise RevOps failure patterns. Produce an executive summary, leakage hypothesis table, risk rating, evidence needed, quick wins, 30/60/90-day roadmap, and EBITDA or ARR impact logic where supportable.
```

Inputs:

- Company profile, revenue model, products, contract types, billing model, renewal process, systems landscape.
- Samples: quotes, orders, contracts, invoices, renewal reports, ARR data, exception logs, discount approvals.

Outputs:

- Leakage diagnostic brief.
- Q2R risk heatmap.
- Evidence request list.
- 30/60/90-day remediation roadmap.
- Executive-ready summary.

API functionality:

- `POST /api/agents/q2r-diagnostic/runs`
- `POST /api/knowledge/documents/ingest`
- `POST /api/revops/leakage-scenarios/classify`
- `POST /api/revops/impact-estimate`
- `POST /api/deliverables/executive-brief`

Suggested tools/functions:

- `classify_leakage_scenarios(process_notes, system_data, documents)`
- `estimate_revenue_impact(leakage_items, arr, invoice_volume, renewal_volume)`
- `generate_q2r_roadmap(findings, constraints, target_date)`

### 2. O2C Discovery Mapper

Command: `/o2c-discovery`

Use when: a client needs a structured discovery across lead/order/quote/contract/billing/collections before implementation.

Reusable prompt:

```text
Act as an O2C discovery lead. Convert the provided notes, documents, and stakeholder inputs into a current-state map, future-state process model, business scenarios, business rules, pain points, open decisions, and an implementation-ready handoff package. Use clear L2/L3 process structure and separate confirmed facts from assumptions.
```

Inputs:

- Stakeholder interviews, process notes, system screenshots, current SOPs, policy docs, sample transactions.

Outputs:

- L2/L3 process inventory.
- Business scenario catalog.
- Business rules matrix.
- Future-state recommendations.
- Handoff pack for implementation team.

API functionality:

- `POST /api/process/discovery/extract`
- `POST /api/process/maps/generate`
- `POST /api/process/business-rules`
- `POST /api/deliverables/bpd`

Suggested tools/functions:

- `extract_process_steps(notes, documents)`
- `generate_l3_process_map(scope, steps, actors, systems)`
- `build_business_rules_matrix(process_map, exceptions)`

### 3. CPQ Pricing Architect

Command: `/cpq-pricing-model`

Use when: product catalogs, SKU structures, discount logic, commodity pricing, approvals, or manual spreadsheet pricing need system design.

Reusable prompt:

```text
Design a CPQ pricing model for the provided business. Rationalize products, attributes, bundles, price dimensions, formulas, discount controls, approval rules, exception paths, and integration impacts. Produce a pricing architecture memo, product/catalog assumptions, formula logic, approval matrix, test scenarios, and implementation backlog.
```

Inputs:

- Product catalog, price books, discount policies, pricing spreadsheets, SKU lists, customer segments, quote samples.

Outputs:

- Product and pricing architecture.
- Pricing formula inventory.
- Discount and approval framework.
- Exception catalog.
- CPQ build backlog.

API functionality:

- `POST /api/pricing/catalog/analyze`
- `POST /api/pricing/formulas/normalize`
- `POST /api/cpq/approval-matrix`
- `POST /api/cpq/build-backlog`

Suggested tools/functions:

- `normalize_product_catalog(raw_catalog)`
- `detect_pricing_exceptions(price_data, policies)`
- `generate_cpq_backlog(pricing_model, approval_rules)`

### 4. Revenue Cloud Billing Architect

Command: `/billing-architecture`

Use when: Salesforce Billing, usage billing, order integration, invoice visibility, manual order errors, or subscription billing needs design.

Reusable prompt:

```text
Design a billing architecture for the provided quote/order/billing environment. Identify order capture, billing schedule, invoice generation, usage capture, error handling, payment visibility, downstream ERP handoff, and revenue recognition dependencies. Produce the target architecture, integration points, exception handling logic, and test scenarios.
```

Inputs:

- Order data, billing requirements, invoice samples, usage events, ERP requirements, error logs.

Outputs:

- Billing target-state architecture.
- Integration and exception handling design.
- Usage billing readiness checklist.
- Billing UAT scenarios.

API functionality:

- `POST /api/billing/architecture/design`
- `POST /api/billing/errors/analyze`
- `POST /api/usage/events/schema`
- `POST /api/integrations/order-billing-map`

Suggested tools/functions:

- `map_order_to_billing_flow(order_schema, billing_rules)`
- `design_billing_error_reprocessing(error_patterns)`
- `validate_usage_billing_readiness(usage_model, billing_system)`

### 5. CLM and Approval Flow Designer

Command: `/clm-approval-design`

Use when: contract authoring, redlines, approval chains, legal clauses, pricing approvals, or deal governance need standardization.

Reusable prompt:

```text
Design a CLM and deal approval workflow. Identify contract types, clause risks, approval thresholds, exception routing, handoffs between Sales, Legal, Finance, and Operations, and audit controls. Produce a workflow map, approval matrix, required metadata, and test cases.
```

Inputs:

- Contract templates, approval policies, clause library, deal desk rules, exception history.

Outputs:

- CLM workflow design.
- Approval matrix.
- Contract metadata model.
- Audit and exception controls.

API functionality:

- `POST /api/clm/workflows/design`
- `POST /api/clm/clauses/classify`
- `POST /api/deals/approval-matrix`

Suggested tools/functions:

- `classify_contract_risks(contract_text, policy)`
- `generate_approval_matrix(thresholds, terms, customer_segments)`
- `map_clm_handoffs(contract_types, teams)`

### 6. Integration and Data Mapping Agent

Command: `/integration-map`

Use when: Salesforce, CPQ, CLM, billing, ERP, MDM, marketing automation, or data warehouse systems need integration design.

Reusable prompt:

```text
Create an integration and data mapping design. Identify systems, objects, fields, source of truth, transformations, timing, dependency risks, error handling, reconciliation points, and ownership. Produce source-to-target mapping, integration sequence, risk register, and QA validation plan.
```

Inputs:

- System list, object model, API docs, existing mapping files, sample payloads, reconciliation reports.

Outputs:

- Source-to-target mapping.
- Integration dependency map.
- Error and reconciliation design.
- Cross-system QA plan.

API functionality:

- `POST /api/integrations/source-target-map`
- `POST /api/integrations/dependency-graph`
- `POST /api/integrations/reconciliation-rules`
- `POST /api/qa/integration-plan`

Suggested tools/functions:

- `build_source_target_map(source_schema, target_schema, business_rules)`
- `detect_integration_risks(mapping, dependencies)`
- `generate_reconciliation_controls(integration_map)`

### 7. Data Migration and MDM Agent

Command: `/data-migration-plan`

Use when: legacy data, account hierarchy, product hierarchy, customer master, ARR history, or migration cutover needs structure.

Reusable prompt:

```text
Create a data migration and MDM plan. Define source systems, target objects, master data ownership, cleansing rules, deduplication logic, load sequence, validation controls, cutover plan, rollback approach, and business signoff process. Highlight data issues that could block renewals, billing, reporting, or exit readiness.
```

Inputs:

- Data extracts, schema files, data dictionaries, hierarchy files, renewal data, account/product/customer records.

Outputs:

- Data migration plan.
- MDM ownership model.
- Data quality issue log.
- Cutover and validation checklist.

API functionality:

- `POST /api/data/profile`
- `POST /api/data/mdm-model`
- `POST /api/data/migration-plan`
- `POST /api/data/quality-rules`

Suggested tools/functions:

- `profile_data_quality(dataset, required_fields)`
- `generate_mdm_model(entities, ownership_rules)`
- `plan_migration_waves(source_data, target_schema, dependencies)`

### 8. QA Defect Triage Agent

Command: `/qa-triage`

Use when: teams need fast defect pattern recognition across CPQ, billing, integration, migration, or UAT failures.

Reusable prompt:

```text
Triage the provided defects. Group them by root-cause pattern, business impact, system layer, process area, severity, dependency, and owner. Identify likely hidden defects and recommend the next diagnostic tests. Produce a clean triage board, executive risk summary, and fix sequencing plan.
```

Inputs:

- Defect logs, screenshots, test scripts, failed payloads, user reports, deployment notes.

Outputs:

- Defect pattern clusters.
- Severity and impact scoring.
- Root-cause hypotheses.
- Fix sequencing plan.

API functionality:

- `POST /api/qa/defects/cluster`
- `POST /api/qa/root-cause/hypothesize`
- `POST /api/qa/fix-sequencing`

Suggested tools/functions:

- `cluster_defects(defect_list)`
- `score_defect_impact(defect, process_context)`
- `recommend_diagnostic_tests(defect_cluster)`

### 9. UAT Scenario Generator

Command: `/uat-scenarios`

Use when: a team needs end-to-end test scenarios for CPQ, CLM, billing, ERP handoff, renewals, usage pricing, approvals, or data migration.

Reusable prompt:

```text
Generate UAT scenarios for the target process. Cover happy path, edge cases, exceptions, approvals, integrations, data validations, reporting outputs, and role-based handoffs. Include test objective, preconditions, steps, expected results, data needs, owner, and severity if failed.
```

Inputs:

- Requirements, process maps, user stories, integration maps, pricing rules, approval rules.

Outputs:

- UAT script pack.
- Test data matrix.
- Traceability matrix.
- Go/no-go criteria.

API functionality:

- `POST /api/qa/uat/generate`
- `POST /api/qa/test-data-matrix`
- `POST /api/qa/traceability`

Suggested tools/functions:

- `generate_uat_scripts(requirements, process_map)`
- `build_test_data_matrix(test_scripts, data_model)`
- `map_requirements_to_tests(requirements, tests)`

### 10. Executive Alignment Briefing Agent

Command: `/exec-alignment-brief`

Use when: operational detail must be translated into C-suite decisions, board updates, PE operating principal updates, or stakeholder alignment.

Reusable prompt:

```text
Create an executive alignment brief from the provided operational context. Translate process, systems, data, and delivery issues into strategic implications, decision points, risks, options, recommended path, and next actions. Keep it concise, boardroom-readable, and specific.
```

Inputs:

- Project status, risks, KPIs, system issues, financial impact, stakeholder concerns, timeline constraints.

Outputs:

- Executive brief.
- Decision log.
- Risk/option matrix.
- Stakeholder alignment plan.

API functionality:

- `POST /api/briefs/executive`
- `POST /api/decisions/options-matrix`
- `POST /api/stakeholders/alignment-plan`

Suggested tools/functions:

- `summarize_operational_risk_for_executives(status, risks, metrics)`
- `generate_decision_options(issue, constraints)`
- `build_stakeholder_alignment_plan(stakeholders, decisions)`

### 11. PE Value Creation Agent

Command: `/pe-value-creation`

Use when: a PE firm or portfolio company needs post-acquisition operational diagnostics, value creation planning, or exit-readiness support.

Reusable prompt:

```text
Assess this portfolio company's value creation opportunities across Lead-to-Cash, pricing, ARR visibility, billing, renewals, data quality, GTM systems, integration complexity, and exit readiness. Produce a PE operating partner summary, value lever backlog, risk register, evidence request list, and 100-day plan.
```

Inputs:

- Investment thesis, current systems, ARR/revenue data, GTM process, org structure, known issues, diligence notes.

Outputs:

- Value creation thesis.
- 100-day operating plan.
- Exit-readiness risk map.
- Operational value lever backlog.

API functionality:

- `POST /api/pe/value-creation/assess`
- `POST /api/pe/exit-readiness`
- `POST /api/pe/100-day-plan`

Suggested tools/functions:

- `identify_value_creation_levers(company_context)`
- `score_exit_readiness(operations, systems, reporting)`
- `generate_100_day_plan(value_levers, constraints)`

### 12. M&A Lead-to-Cash Integration Agent

Command: `/mna-l2c-integration`

Use when: multiple companies, product lines, CRM instances, catalogs, contracts, or billing processes must be unified after M&A.

Reusable prompt:

```text
Design a post-merger Lead-to-Cash integration plan. Identify process differences, data model conflicts, product and account hierarchy decisions, contract migration risks, CPQ/CLM/billing consolidation options, and governance model. Produce integration principles, decision log, phased roadmap, and risk controls.
```

Inputs:

- Company/process comparisons, product catalogs, account hierarchies, CRM/ERP landscapes, contract inventory.

Outputs:

- L2C integration plan.
- Data and hierarchy decisions.
- Process harmonization matrix.
- Integration roadmap.

API functionality:

- `POST /api/mna/process-compare`
- `POST /api/mna/hierarchy-unification`
- `POST /api/mna/integration-roadmap`

Suggested tools/functions:

- `compare_l2c_processes(company_a, company_b)`
- `recommend_hierarchy_model(account_data, product_data)`
- `build_mna_integration_roadmap(gaps, dependencies)`

### 13. ARR and Retention Modeling Agent

Command: `/arr-retention-model`

Use when: recurring revenue, renewals, customer retention, expansion, contraction, investor reporting, or exit-readiness metrics need structure.

Reusable prompt:

```text
Design an ARR and retention reporting model. Define ARR movement categories, source data, calculation logic, customer/account hierarchy treatment, renewal cohort views, expansion/contraction/churn logic, audit checks, and investor-ready outputs. Flag where data quality could distort reporting.
```

Inputs:

- Contracts, subscription records, invoices, renewal reports, customer hierarchy, product hierarchy, CRM opportunities.

Outputs:

- ARR movement model.
- Retention metrics definition.
- Data requirements.
- Investor reporting dashboard spec.

API functionality:

- `POST /api/revenue/arr-model`
- `POST /api/revenue/retention-analysis`
- `POST /api/revenue/investor-report-spec`

Suggested tools/functions:

- `classify_arr_movements(contract_events)`
- `calculate_retention_metrics(arr_data, customer_hierarchy)`
- `generate_investor_reporting_spec(metrics, source_systems)`

### 14. Usage-Based Monetization Agent

Command: `/usage-pricing-launch`

Use when: a company wants to launch usage-based, hybrid, subscription plus usage, or consumption pricing.

Reusable prompt:

```text
Design a usage-based monetization launch plan. Define usage events, pricing dimensions, metering requirements, rating logic, quote presentation, contract terms, billing treatment, reporting, controls, and GTM readiness. Produce architecture, business rules, launch checklist, and test scenarios.
```

Inputs:

- Product usage data, pricing strategy, packaging model, metering capabilities, billing system, GTM launch plan.

Outputs:

- Usage pricing architecture.
- Metering and rating rules.
- GTM launch readiness checklist.
- Billing and reporting test pack.

API functionality:

- `POST /api/usage/pricing-model`
- `POST /api/usage/metering-schema`
- `POST /api/usage/launch-readiness`

Suggested tools/functions:

- `design_usage_event_schema(product_usage)`
- `generate_rating_rules(pricing_model)`
- `assess_usage_launch_readiness(systems, processes, controls)`

### 15. Financial Reporting Readiness Agent

Command: `/financial-reporting-readiness`

Use when: system outputs need to support financial reporting, ASC606, relisting readiness, auditability, or board-level metrics.

Reusable prompt:

```text
Assess financial reporting readiness for the provided systems and processes. Map operational data to financial reporting needs, identify controls, reconciliation points, data gaps, governance risks, and reporting indicators. Produce a readiness score, gap register, control recommendations, and executive summary.
```

Inputs:

- Financial reporting needs, billing data, revenue recognition rules, audit requirements, KPI definitions, system outputs.

Outputs:

- Readiness assessment.
- Control and reconciliation map.
- Gap register.
- Executive risk summary.

API functionality:

- `POST /api/finance/readiness-assess`
- `POST /api/finance/reconciliation-map`
- `POST /api/compliance/asc606-check`

Suggested tools/functions:

- `map_system_outputs_to_financial_metrics(system_data, reporting_requirements)`
- `identify_reconciliation_controls(process_map)`
- `score_financial_reporting_readiness(gaps, controls)`

### 16. Enablement and Handoff Agent

Command: `/enablement-kit`

Use when: teams need training materials, SOPs, handoff documents, operating playbooks, status templates, or self-sustaining client capability.

Reusable prompt:

```text
Create an enablement and handoff kit for the provided process, system, or project. Include audience-specific training, SOPs, role responsibilities, operating cadence, issue escalation, job aids, adoption risks, and a clean handoff checklist. Make the output practical enough for a client team to own without re-explanation.
```

Inputs:

- Process maps, system designs, project artifacts, roles, training audience, known adoption issues.

Outputs:

- Training deck outline.
- SOPs and job aids.
- Handoff checklist.
- Adoption plan.

API functionality:

- `POST /api/enablement/kit`
- `POST /api/enablement/sop`
- `POST /api/enablement/training-outline`

Suggested tools/functions:

- `generate_sop(process_map, roles)`
- `create_training_plan(audience, system_changes)`
- `build_handoff_checklist(deliverables, owners)`

### 17. Pursuit and Proposal Win-Room Agent

Command: `/pursuit-win-room`

Use when: discovery findings need to become a proposal, scope, win themes, implementation estimate, or executive sales narrative.

Reusable prompt:

```text
Turn this discovery context into a pursuit strategy. Identify client pain, quantified value, urgency, scope options, delivery approach, differentiators, risks, assumptions, and executive win themes. Produce proposal sections, talk track, solution outline, and follow-on scope recommendations.
```

Inputs:

- Discovery notes, stakeholder concerns, target buying committee, budget, timeline, competitors, known pain.

Outputs:

- Proposal outline.
- Win themes.
- Scope and assumptions.
- Executive talk track.

API functionality:

- `POST /api/pursuits/strategy`
- `POST /api/pursuits/scope-options`
- `POST /api/pursuits/proposal-sections`

Suggested tools/functions:

- `extract_win_themes(discovery_notes, buyer_context)`
- `generate_scope_options(problem, constraints)`
- `draft_proposal_sections(strategy, differentiators)`

### 18. Distressed Asset Scoring Agent

Command: `/distressed-asset-score`

Use when: real estate, portfolio assets, or operational assets need fast screening for underutilization, distress, or diligence priority.

Reusable prompt:

```text
Score the provided asset for distress, underutilization, operational upside, financial risk, and diligence priority. Use first-principles financial thinking. Separate observable facts from assumptions. Produce a scorecard, diligence questions, investment thesis hypothesis, red flags, and next-step recommendation.
```

Inputs:

- Asset description, location/market, financials, operating metrics, comps, debt/capex context, strategic goals.

Outputs:

- Asset scorecard.
- Diligence question list.
- Investment thesis hypothesis.
- Red flag summary.

API functionality:

- `POST /api/assets/distress-score`
- `POST /api/assets/diligence-questions`
- `POST /api/assets/investment-thesis`

Suggested tools/functions:

- `score_distressed_asset(asset_data, market_context)`
- `generate_diligence_questions(asset_scorecard)`
- `draft_investment_thesis(scorecard, assumptions)`

### 19. Investor Language Guard Agent

Command: `/investor-language-review`

Use when: investor, PE, advisory, finance, or public-facing claims need legally careful wording.

Reusable prompt:

```text
Review this investor-facing content for precision, overclaiming, unsupported performance statements, ambiguous benchmarks, legal/reputational risk, and missing caveats. Rewrite the content using supportable, precise, investor-grade language. Do not fabricate numbers. Preserve the intended message while reducing risk.
```

Inputs:

- Investor memos, website copy, performance summaries, pitch materials, Q&A content, claims and source data.

Outputs:

- Risk-marked content review.
- Safer rewrite.
- Evidence/citation request list.
- Language rules violated.

API functionality:

- `POST /api/compliance/investor-language-review`
- `POST /api/compliance/claims/evidence-check`
- `POST /api/content/safer-rewrite`

Suggested tools/functions:

- `detect_unsupported_claims(text, evidence)`
- `rewrite_investor_language(text, risk_policy)`
- `generate_evidence_request(claims)`

### 20. BestyStaff Orchestrator

Command: `/bestystaff-orchestrate`

Use when: a task spans multiple agents and needs routing, knowledge management, deliverable assembly, or operational follow-through. Name is fixed: BestyStaff.

Reusable prompt:

```text
You are BestyStaff, Betsy's AI proxy agent. Break the requested operational objective into agent-sized workstreams, route each workstream to the right specialist agent, maintain a decision log, consolidate outputs, identify conflicts, and produce a final executive-ready deliverable. Act to complete the work, not just answer questions.
```

Inputs:

- Goal, deadline, source documents, desired deliverable, stakeholder audience, available data, constraints.

Outputs:

- Workstream routing plan.
- Consolidated deliverable.
- Decision log.
- Follow-up task backlog.

API functionality:

- `POST /api/agents/orchestrate`
- `POST /api/agents/runs/:runId/delegate`
- `POST /api/knowledge/memory/save`
- `POST /api/deliverables/assemble`

Suggested tools/functions:

- `route_workstreams(goal, available_agents)`
- `merge_agent_outputs(outputs, deliverable_type)`
- `save_operating_memory(project_id, decisions, artifacts)`

## Suggested Command Naming Standard

Use short command names that describe the operational job to be done:

```text
/q2r-diagnostic
/o2c-discovery
/cpq-pricing-model
/billing-architecture
/clm-approval-design
/integration-map
/data-migration-plan
/qa-triage
/uat-scenarios
/exec-alignment-brief
/pe-value-creation
/mna-l2c-integration
/arr-retention-model
/usage-pricing-launch
/financial-reporting-readiness
/enablement-kit
/pursuit-win-room
/distressed-asset-score
/investor-language-review
/bestystaff-orchestrate
```

## Shared API Model

Recommended generic run lifecycle:

```http
POST /api/agents/:agentId/runs
GET /api/agents/runs/:runId
POST /api/agents/runs/:runId/messages
POST /api/agents/runs/:runId/artifacts
POST /api/agents/runs/:runId/approve
POST /api/agents/runs/:runId/export
```

Recommended run payload:

```json
{
  "agentId": "q2r-diagnostic",
  "command": "/q2r-diagnostic",
  "objective": "Diagnose revenue leakage in renewal and billing operations",
  "audience": "CFO and PE operating partner",
  "inputs": {
    "companyProfile": {},
    "systems": [],
    "documents": [],
    "dataFiles": [],
    "constraints": []
  },
  "outputFormat": "executive_brief",
  "memoryScope": "member_profile",
  "requiresHumanApproval": true
}
```

Recommended shared artifact types:

```text
executive_brief
process_map
business_rules_matrix
source_target_mapping
qa_test_pack
data_migration_plan
pricing_architecture
billing_architecture
value_creation_plan
investor_language_review
enablement_kit
proposal_outline
```

## Reusable Function Library

These functions can be shared across agents:

| Function | Used By | Purpose |
|---|---|---|
| `ingest_documents` | All | Extract structured text, tables, entities, and source citations |
| `extract_operating_context` | All | Identify company, industry, systems, process scope, pain, metrics |
| `classify_process_area` | All | Tag work as Q2R, O2C, CPQ, CLM, billing, ERP, QA, data, PE, finance |
| `generate_executive_brief` | Executive, PE, Q2R, Pursuit | Create concise decision-ready narrative |
| `build_risk_register` | Most agents | Track risk, severity, owner, mitigation, decision needed |
| `build_decision_log` | Orchestrator, Executive, M&A | Record decision, options, owner, status, rationale |
| `generate_business_rules_matrix` | O2C, CPQ, Billing, CLM | Convert requirements into build-ready rules |
| `generate_process_map` | O2C, M&A, Enablement | Produce L2/L3 process structures |
| `build_source_target_mapping` | Integration, Data, Billing | Map systems, fields, transformations, ownership |
| `generate_test_scenarios` | QA, UAT, CPQ, Billing | Create happy path, exception, edge-case test scripts |
| `score_readiness` | PE, Finance, Usage, Data | Evaluate maturity, blockers, and readiness |
| `assemble_deliverable` | Orchestrator | Merge sections into a final artifact |
| `save_operating_memory` | All | Store reusable patterns, assumptions, decisions, and templates |

## Highest-Value Agents To Build First

Priority 1:

- `/q2r-diagnostic`: strongest bridge between career proof and SaltBasin HOS product direction.
- `/o2c-discovery`: reusable for consulting, implementation scoping, and handoff packages.
- `/cpq-pricing-model`: directly tied to differentiated pricing/product catalog expertise.
- `/integration-map`: useful across almost every RevOps implementation.
- `/qa-triage`: captures a career differentiator: defect pattern recognition.
- `/exec-alignment-brief`: converts technical work into C-suite value.

Priority 2:

- `/pe-value-creation`
- `/arr-retention-model`
- `/usage-pricing-launch`
- `/data-migration-plan`
- `/enablement-kit`
- `/pursuit-win-room`

Priority 3:

- `/distressed-asset-score`
- `/investor-language-review`
- `/financial-reporting-readiness`
- `/mna-l2c-integration`
- `/bestystaff-orchestrate`

## Implementation Notes For Salt Basin

- Store agent definitions as structured JSON so the same catalog can power UI cards, command routing, API calls, and prompt assembly.
- Give each run a `scope`: `admin`, `member`, `organization`, or `project`.
- Save every completed run as a reusable knowledge artifact with tags: industry, system, process area, deliverable type, risk pattern, and outcome.
- Require human approval before sending externally, changing system records, or producing investor/legal/financial claims.
- Keep investor language guardrails globally available, especially for SaltTide CHI and PE advisory deliverables.
- Let BestyStaff orchestrate multi-agent work, but keep specialist agents independently callable through commands.

## Example Agent Definition JSON

```json
{
  "id": "q2r-diagnostic",
  "name": "Q2R Leakage Diagnostic Agent",
  "command": "/q2r-diagnostic",
  "category": "Revenue Operations",
  "careerBasis": ["SaltBasin HOS", "Vista", "PwC", "Slalom"],
  "defaultAudience": "CFO, CRO, PE operating partner",
  "inputs": ["company profile", "systems landscape", "sample transactions", "ARR data", "process notes"],
  "outputs": ["executive brief", "leakage heatmap", "risk register", "30/60/90 roadmap"],
  "promptTemplate": "Run a Quote-to-Revenue leakage diagnostic for the following business...",
  "universalReasoningContext": {
    "enabled": true,
    "contextRef": "docs/salt-basin-universal-agent-reasoning-context.md",
    "reasoningMode": "operational_truth_lineage_evidence_governance"
  },
  "functions": [
    "classify_leakage_scenarios",
    "estimate_revenue_impact",
    "generate_q2r_roadmap",
    "generate_executive_brief"
  ],
  "requiresHumanApproval": true,
  "memoryTags": ["q2r", "revops", "billing", "cpq", "pe-value-creation"]
}
```

## Parallel Agent Pooling Model

Large operational datasets should not be handled by one specialist agent end-to-end. Each foundational agent can be duplicated into a worker pool with the same role, prompt, tools, and output contract. The work is split into shards, processed independently, then rolled up by lead and management agents.

Use this pattern:

1. Intake Manager profiles the dataset and creates shards.
2. Foundational Worker Agents process assigned shards.
3. Functional Lead Agents merge outputs within a domain.
4. Quality and Evidence Managers compare outputs, remove duplicates, and flag conflicts.
5. Operating Model Managers synthesize cross-domain findings.
6. BestyStaff or an Executive Strategy Partner creates the final deliverable.

Clone naming convention:

```text
q2r-diagnostic-01
q2r-diagnostic-02
q2r-diagnostic-03
integration-map-01
integration-map-02
qa-triage-01
qa-triage-02
```

Shard ID convention:

```text
RUN-2026-001::q2r::shard-001
RUN-2026-001::q2r::shard-002
RUN-2026-001::integration::object-account
RUN-2026-001::qa::release-r3
```

## Recommended Max Volume Per Foundational Agent

These are practical planning limits for one agent in one run. They assume the platform pre-processes raw files into clean text, tables, metadata, and source references before the LLM agent reasons over them. Very large files should be profiled by deterministic code first, then sampled or chunked for agent review.

| Agent | Recommended Max Per Worker Run | Best Shard Unit | Notes |
|---|---:|---|---|
| Q2R Leakage Diagnostic | 250 transactions or 75 pages of process/source material | Process area, business unit, product line, or transaction sample | Use multiple workers when reviewing quote/order/invoice/renewal samples across teams. |
| O2C Discovery Mapper | 8 interviews or 100 pages of notes/SOPs | Stakeholder group or process tower | One worker per function works well: Sales, Deal Desk, Legal, Billing, Collections. |
| CPQ Pricing Architect | 2,500 SKUs, 50 pricing rules, or 25 price sheets | Product family, price book, region, or business unit | Use deterministic profiling for catalogs above 10k SKUs, then agent review by product family. |
| Revenue Cloud Billing Architect | 250 orders/invoices or 40 billing scenarios | Billing type, product line, or exception class | Separate usage, subscription, amendments, cancellations, and credits. |
| CLM and Approval Flow Designer | 100 contract samples or 75 clause variants | Contract type, region, or risk category | Use Investor Language Guard for public or investor-facing contract summaries. |
| Integration and Data Mapping Agent | 150 fields, 20 objects, or 10 sample payloads | System pair, object family, or integration flow | One worker per source-target pair is the cleanest scaling unit. |
| Data Migration and MDM Agent | 50,000 records for profiling or 5,000 records for semantic review | Entity, source system, or migration wave | Use code-based profiling first; agent reviews quality patterns and business impact. |
| QA Defect Triage Agent | 300 defects or 25 log bundles | Release, system, severity band, or defect cluster | Above 300 defects, use clustering first and assign clusters to workers. |
| UAT Scenario Generator | 75 requirements or 40 business rules | Process area, persona, or integration flow | One worker per end-to-end scenario family. |
| Executive Alignment Briefing Agent | 15 status reports or 100 pages of supporting detail | Initiative, audience, or decision area | Usually fewer workers; use leads to summarize before executive synthesis. |
| PE Value Creation Agent | 1 portfolio company or 5 diligence workstreams | Portfolio company, workstream, or value lever | For fund-level review, assign one worker per company. |
| M&A Lead-to-Cash Integration Agent | 2 companies or 8 process areas | Company pair, business unit, or L2C tower | Use domain workers for CRM, CPQ, CLM, billing, ERP, reporting. |
| ARR and Retention Modeling Agent | 50,000 rows for profiling or 5,000 contract/subscription records for logic review | Cohort, product, region, or source system | Use code for calculations; agent validates definitions, anomalies, and reporting logic. |
| Usage-Based Monetization Agent | 25 usage events or 15 pricing packages | Product, event family, or customer segment | Split metering, pricing, billing, GTM, and reporting into separate workers. |
| Financial Reporting Readiness Agent | 40 metrics/controls or 20 reporting outputs | Metric family, control area, or system source | Pair with Investor Language Guard for external reporting language. |
| Enablement and Handoff Agent | 10 process areas or 5 audiences | Audience, process, or system module | One worker per audience creates cleaner training assets. |
| Pursuit and Proposal Win-Room Agent | 1 pursuit or 5 workstreams | Proposal section, buyer persona, or workstream | Use a Pursuit Manager for final voice and commercial coherence. |
| Distressed Asset Scoring Agent | 25 assets with basic data or 5 assets with deep diligence | Asset, market, or asset class | Use deterministic data enrichment before agent scoring where possible. |
| Investor Language Guard Agent | 25 pages or 100 claims | Document section or claim category | Keep strict version control and evidence trace. |
| BestyStaff Orchestrator | 10 concurrent workstreams or 50 agent outputs | Workstream group | Above this, add Operating Model Managers between BestyStaff and worker pools. |

## Agent Count Recommendations By Volume

Use these as starting points. Increase counts when source quality is low, ambiguity is high, or multiple business units need separate treatment.

| Workload Size | Example Volume | Foundational Workers | Functional Leads | Management Agents | Typical Use Case |
|---|---:|---:|---:|---:|---|
| Small | Up to 100 pages, 1k rows, 50 defects, or 1 process tower | 1-2 | 0-1 | 1 | Focused diagnostic or single deliverable. |
| Medium | 100-500 pages, 1k-25k rows, 50-300 defects, or 3-5 process towers | 3-6 | 1-2 | 1-2 | Department-level transformation, implementation discovery, or pricing review. |
| Large | 500-2,000 pages, 25k-250k rows, 300-1,500 defects, or 5-10 process towers | 8-20 | 3-5 | 2-4 | Enterprise program, M&A integration, multi-system QA, or PE portfolio company review. |
| Portfolio | 2,000+ pages, 250k+ rows, 1,500+ defects, or multiple companies | 20-60 | 5-12 | 4-8 | Fund-level PE review, multi-company operating model, full revenue transformation. |

Sizing formula:

```text
worker_count = ceiling(total_units / max_units_per_worker)
functional_lead_count = ceiling(worker_count / 5)
management_agent_count = ceiling(functional_lead_count / 3)
```

Example:

```text
1,200 defects / 300 defects per QA worker = 4 QA workers
4 QA workers / 5 = 1 QA Lead
1 QA Lead rolls into 1 Delivery Quality Manager
```

## Duplicate Worker Pools By Domain

Use duplicate workers when the same role must process many comparable items. Each worker should receive a shard assignment, a shared prompt, the same output template, and clear boundaries to avoid duplicate review.

| Domain | Worker Pool | When To Duplicate | Rollup Agent |
|---|---|---|---|
| Revenue Operations | `q2r-diagnostic-*`, `o2c-discovery-*`, `usage-pricing-launch-*` | Multiple process towers, products, regions, or transaction samples | Revenue Operations Lead |
| CPQ/CLM/Billing | `cpq-pricing-model-*`, `clm-approval-design-*`, `billing-architecture-*` | Large catalogs, many contract types, many billing scenarios | Quote-to-Revenue Architecture Lead |
| Data and Integrations | `integration-map-*`, `data-migration-plan-*`, `arr-retention-model-*` | Many systems, entities, records, or reporting sources | Data and Integration Lead |
| Quality and Release | `qa-triage-*`, `uat-scenarios-*` | Many defects, requirements, scripts, releases, or environments | QA and Release Lead |
| Finance and PE | `pe-value-creation-*`, `financial-reporting-readiness-*`, `distressed-asset-score-*` | Multiple companies, assets, value levers, or reporting areas | Finance and Value Creation Lead |
| Commercial and Enablement | `pursuit-win-room-*`, `enablement-kit-*`, `exec-alignment-brief-*` | Multiple audiences, proposal sections, or training groups | Commercial Enablement Lead |
| Compliance Language | `investor-language-review-*` | Many claims, pages, pitch materials, or investor Q&A items | Claims and Language Review Lead |

## Management Agent Hierarchy

The hierarchy below lets the platform mirror a real operating model. Foundational agents do the specialist work. Management agents coordinate scope, quality, priorities, and cross-functional synthesis.

### Level 0: Data and Memory Layer

These are not business-role agents; they are platform services that make the hierarchy work.

| Agent/Service | Role | Views Across |
|---|---|---|
| Data Intake Manager | Profiles files, creates shards, normalizes metadata, assigns work | All source documents and datasets |
| Knowledge Librarian | Saves reusable patterns, decisions, artifacts, and source traces | All completed agent outputs |
| Evidence Controller | Maintains source trace, claim support, assumptions, and citation requirements | All outputs that rely on evidence |
| Access and Scope Controller | Enforces member/org/project visibility and approval gates | All runs and memory records |

### Level 1: Foundational Worker Agents

These are the 20 specialist agents defined above. They can be duplicated horizontally as worker pools.

Responsibilities:

- Process assigned shards.
- Produce standardized outputs.
- Flag assumptions, risks, and missing evidence.
- Avoid cross-shard conclusions unless explicitly assigned.

### Level 2: Functional Lead Agents

Functional leads manage pools of foundational agents in the same domain.

| Lead Agent | Manages | Core Responsibility |
|---|---|---|
| Revenue Operations Lead | Q2R, O2C, usage pricing workers | Consolidate process, leakage, monetization, and GTM findings. |
| Quote-to-Revenue Architecture Lead | CPQ, CLM, billing workers | Maintain coherent CPQ/CLM/billing design decisions. |
| Data and Integration Lead | Integration, migration, ARR workers | Resolve source-of-truth, mapping, data quality, and reporting conflicts. |
| QA and Release Lead | QA triage and UAT workers | Merge defects, test coverage, severity, and go/no-go risks. |
| Finance and Value Creation Lead | PE, ARR, reporting, asset scoring workers | Translate operating findings into value creation and financial impact. |
| Commercial Enablement Lead | Pursuit, enablement, executive brief workers | Align narrative, audience needs, training, and commercial packaging. |
| Claims and Language Review Lead | Investor language workers | Enforce supportable, precise, legally careful language. |

### Level 3: Operating Model Managers

Operating Model Managers sit above functional leads and represent real-world leadership roles.

| Manager Agent | Equivalent Human Role | Inputs | Outputs |
|---|---|---|---|
| Transformation Program Manager | Program Director / PMO Lead | Functional lead updates, risks, dependencies | Integrated roadmap, status, dependency map, escalation log |
| Revenue Transformation Manager | VP RevOps / Q2R Transformation Lead | RevOps, CPQ, CLM, billing, QA lead outputs | End-to-end Q2R operating model and backlog |
| Data Governance Manager | Data/Systems Governance Lead | Data, integration, finance, QA outputs | Source-of-truth model, controls, ownership, data remediation plan |
| Value Creation Manager | PE Operating Principal | Finance, RevOps, data, commercial outputs | Value creation plan, 100-day plan, exit-readiness view |
| Delivery Quality Manager | QA Director / Release Manager | QA, UAT, integration, data outputs | Go/no-go recommendation, defect risk, readiness dashboard |
| Change and Enablement Manager | Change Lead / Enablement Director | Enablement, O2C, CPQ, billing, executive outputs | Adoption plan, training roadmap, operating cadence |

### Level 4: Executive and Strategy Agents

These agents see the combined data across the full hierarchy pool and produce final decision-ready outputs.

| Executive Agent | Equivalent Human Role | Responsibility |
|---|---|---|
| BestyStaff Chief Orchestrator | AI Chief of Staff | Route work, resolve conflicts, consolidate deliverables, maintain follow-up backlog. |
| Executive Strategy Partner | C-suite Advisor | Convert operating findings into boardroom-ready strategy, decisions, and tradeoffs. |
| Portfolio Operating Partner | PE Operating Partner | Compare multiple companies/assets and prioritize value creation. |
| Chief Revenue Systems Architect | Enterprise Q2R Architect | Own cross-system architecture coherence across CRM, CPQ, CLM, billing, ERP, and reporting. |
| Compliance and Claims Executive Reviewer | Legal/Investor Communications Reviewer | Final review of external claims, investor language, and evidence standards. |

## Hierarchy Rollup Pattern

Every level should summarize into a standard rollup so higher-level agents can process combined data without reading every source item.

| Level | Reads | Produces | Max Recommended Direct Inputs |
|---|---|---|---:|
| Foundational Worker | Raw shard and source references | Shard finding packet | 1 shard |
| Functional Lead | Worker packets in one domain | Domain rollup | 5-8 worker packets |
| Operating Model Manager | Functional lead rollups | Cross-domain management view | 3-5 lead rollups |
| Executive Agent | Management views and exceptions | Final strategy/deliverable | 3-7 management packets |

If a level receives more than the max direct inputs, insert another lead layer. For example, use Regional Revenue Leads before the Global Revenue Operations Lead.

## Example Large-Dataset Staffing Models

### Enterprise Q2R Diagnostic

Input volume:

- 600 pages of process documentation.
- 20 stakeholder interviews.
- 50k quote/order/invoice rows.
- 300 defects or issue tickets.

Recommended pool:

| Layer | Agents |
|---|---|
| Foundational Workers | 4 `q2r-diagnostic`, 3 `o2c-discovery`, 3 `integration-map`, 2 `data-migration-plan`, 2 `qa-triage`, 2 `billing-architecture` |
| Functional Leads | Revenue Operations Lead, Data and Integration Lead, QA and Release Lead, Quote-to-Revenue Architecture Lead |
| Managers | Revenue Transformation Manager, Delivery Quality Manager |
| Executive | BestyStaff Chief Orchestrator, Executive Strategy Partner |

### PE Portfolio Review

Input volume:

- 6 portfolio companies.
- 10 diligence documents per company.
- ARR extracts and system summaries for each.

Recommended pool:

| Layer | Agents |
|---|---|
| Foundational Workers | 6 `pe-value-creation`, 6 `q2r-diagnostic`, 3 `arr-retention-model`, 3 `financial-reporting-readiness`, 3 `integration-map` |
| Functional Leads | Finance and Value Creation Lead, Revenue Operations Lead, Data and Integration Lead |
| Managers | Value Creation Manager, Data Governance Manager |
| Executive | Portfolio Operating Partner, BestyStaff Chief Orchestrator |

### M&A Lead-to-Cash Integration

Input volume:

- 3 merged entities.
- 5 process towers.
- 8 systems.
- 30 objects and 400 fields.

Recommended pool:

| Layer | Agents |
|---|---|
| Foundational Workers | 3 `mna-l2c-integration`, 5 `o2c-discovery`, 4 `integration-map`, 2 `data-migration-plan`, 2 `cpq-pricing-model`, 2 `clm-approval-design`, 2 `billing-architecture` |
| Functional Leads | Revenue Operations Lead, Quote-to-Revenue Architecture Lead, Data and Integration Lead |
| Managers | Transformation Program Manager, Revenue Transformation Manager, Data Governance Manager |
| Executive | Chief Revenue Systems Architect, Executive Strategy Partner |

## Cross-Hierarchy Visibility Rules

- Foundational workers see only their assigned shard plus shared glossary, definitions, and output template.
- Functional leads see all worker outputs in their domain and the source trace index.
- Managers see functional rollups, conflicts, risks, dependencies, and metrics.
- Executive agents see manager rollups, unresolved decisions, high-severity risks, value estimates, and final artifact drafts.
- Evidence Controller can inspect all source traces but should not rewrite business conclusions.
- Access and Scope Controller must enforce whether the run belongs to `admin`, `member`, `organization`, or `project`.

## Additional API Functionality For Agent Hierarchies

```http
POST /api/agent-pools
POST /api/agent-pools/:poolId/shards
POST /api/agent-pools/:poolId/workers
POST /api/agent-pools/:poolId/dispatch
GET /api/agent-pools/:poolId/status
POST /api/agent-pools/:poolId/rollup
POST /api/agent-hierarchy/runs
POST /api/agent-hierarchy/runs/:runId/assign
POST /api/agent-hierarchy/runs/:runId/escalate
POST /api/agent-hierarchy/runs/:runId/consolidate
GET /api/agent-hierarchy/runs/:runId/operating-model-view
```

Additional reusable functions:

| Function | Purpose |
|---|---|
| `profile_workload_volume` | Count pages, rows, records, tokens, objects, fields, defects, and requirements. |
| `recommend_agent_pool_size` | Estimate workers, leads, and managers from workload volume. |
| `create_work_shards` | Split data into non-overlapping shards with source references. |
| `dispatch_shards_to_workers` | Assign shards to duplicate agents. |
| `merge_worker_packets` | Combine worker outputs into a domain rollup. |
| `detect_cross_agent_conflicts` | Find contradictory findings, duplicate issues, or mismatched assumptions. |
| `promote_findings_to_management_view` | Convert domain findings into roadmap, risk, decision, and value views. |
| `generate_operating_model_view` | Show the full hierarchy of active agents, workstreams, outputs, and decisions. |
