
# ═══════════════════════════════════════════════════════════════════════
# SHEET 2: SCENARIO INDEX
# ═══════════════════════════════════════════════════════════════════════
ws_scen = wb.create_sheet("Scenario Index")
ws_scen.sheet_view.showGridLines = False

add_section_header(ws_scen, 2, "SCENARIO INDEX — All Defined Business Scenarios", 2, 9)
ws_scen.row_dimensions[2].height = 32

# Headers
hdr_row = 4
headers = ["Scenario ID", "Scenario Name", "Scope", "Trigger Event", "Primary Highways", "Secondary Highways", "Output / Outcome", "Maturity Model", "Status"]
for i, h in enumerate(headers, 2):
    cell = ws_scen.cell(row=hdr_row, column=i, value=h)
    cell.font = F_HEADER
    cell.fill = FIL_HEADER
    cell.alignment = A_CENTER
    cell.border = B_THIN
ws_scen.row_dimensions[hdr_row].height = 28

scenarios = [
    ("SC-001", "LoneTree Client Scope", "Client", "Customer onboarding", "Usage, Commercial, Revenue", "Billing, Collections, Support", "Fully governed client data model with amendment tracking", "5-stage", "Defined"),
    ("SC-002", "Salt Basin Prospect (LoneTree)", "Prospect", "Prospect enters pipeline", "Commercial, Revenue, Forecast", "Customer Success, Implementation", "Prospect-to-client conversion with nested configuration", "5-stage", "Defined"),
    ("SC-003", "Career River DTC Member", "Member", "Member profile activation", "Career, Skills, Orbit", "Placement, Resume, Output", "Member public site, orbits, resume outputs, placement streams", "7-stage", "Defined"),
    ("SC-004", "Usage Decline → Churn Risk", "Signal", "Usage drops >20% outside seasonal pattern", "Usage", "Customer Success, Billing, Revenue, Commercial, Forecast, Accounting", "Customer Health Review, retention initiative, amendment proposal", "4-stage", "Defined"),
    ("SC-005", "Invoice Dispute Cascade", "Signal", "Invoice disputed", "Billing", "Collections, Revenue, Commercial, Customer Success, Usage", "Dispute resolution, delayed payment risk mitigation, renewal preservation", "5-stage", "Defined"),
    ("SC-006", "Workforce Reduction Amendment", "Hypothesis", "Customer confirms headcount reduction", "Commercial", "Usage, Revenue, Billing, Forecast, Accounting", "Nested Amendment Configuration Stream, license reduction, retention strategy", "5-stage", "Defined"),
    ("SC-007", "Executive Sponsor Change", "Signal", "Executive sponsor departs", "Customer Success", "Commercial, Revenue, Forecast, Implementation", "Relationship risk assessment, executive re-engagement initiative", "4-stage", "Defined"),
    ("SC-008", "Professional Services Delay", "Signal", "Implementation milestone missed", "Implementation", "Customer Success, Usage, Revenue, Commercial", "Recovery plan, adoption workshop, timeline renegotiation", "4-stage", "Defined"),
    ("SC-009", "Support Escalation Pattern", "Signal", "Repeated support escalation", "Support", "Customer Success, Usage, Revenue, Commercial", "Health review, product feedback loop, retention initiative", "4-stage", "Defined"),
    ("SC-010", "License Underutilization", "Signal", "Licenses used <60% of entitlement", "Usage", "Commercial, Billing, Revenue, Forecast", "Right-sizing proposal, expansion opportunity identification", "4-stage", "Defined"),
    ("SC-011", "Delayed Collections Signal", "Signal", "Payment overdue >30 days", "Collections", "Billing, Revenue, Commercial, Customer Success, Forecast", "Collections workflow, credit risk assessment, commercial review", "4-stage", "Defined"),
    ("SC-012", "Expansion Opportunity Signal", "Signal", "Usage growth >30% above entitlement", "Usage", "Commercial, Revenue, Forecast, Customer Success", "Expansion proposal, upsell initiative, nested expansion stream", "4-stage", "Defined"),
    ("SC-013", "Seasonal Usage Anomaly", "Signal", "Usage outside predicted seasonal band", "Usage", "Forecast, Revenue, Commercial, Accounting", "Pattern validation, forecast adjustment, accrual review", "3-stage", "Defined"),
    ("SC-014", "Cross-Highway Correlation Discovery", "Agent", "Multiple correlated signals detected", "All Highways", "All Highways", "Hypothesis generation, confidence-weighted reasoning, mitigation initiative", "5-stage", "Defined"),
    ("SC-015", "Anticipatory Accounting Trigger", "Agent", "Signal confidence >70% on revenue-impacting event", "Accounting", "Forecast, Revenue, Commercial, Usage", "Accrual adjustment proposal, forward-looking estimate update", "4-stage", "Defined"),
    ("SC-016", "Value Recovery Initiative", "Initiative", "Hypothesis validated with >65% confidence", "Value Creation", "All Highways", "Governed initiative with projected ARR/EBITDA/LTV impact", "5-stage", "Defined"),
    ("SC-017", "Closed-Loop Learning Cycle", "Agent", "Initiative outcome recorded after 12 months", "All Highways", "All Highways", "Strategy effectiveness evidence, future recommendation weighting update", "3-stage", "Defined"),
    ("SC-018", "Member Resume Output Generation", "Output", "Member requests resume build", "Career", "Skills, Orbit, Placement", "Print-isolated resume document from profile data", "3-stage", "Defined"),
    ("SC-019", "Member Orbit Activation", "Orbit", "Member defines target career orbit", "Career", "Skills, Placement, Output", "Public orbit profile with milestone tracking", "4-stage", "Defined"),
    ("SC-020", "Placement Stream Match", "Placement", "Member profile matches opportunity", "Placement", "Career, Skills, Orbit", "Interview pipeline, offer tracking, placement outcome", "5-stage", "Defined"),
]

row = 5
for sid, name, scope, trigger, primary, secondary, outcome, maturity, status in scenarios:
    vals = [sid, name, scope, trigger, primary, secondary, outcome, maturity, status]
    for i, v in enumerate(vals, 2):
        cell = ws_scen.cell(row=row, column=i, value=v)
        style_data_cell(cell, bold=(i == 2))
        if i in (4, 5, 6, 7):
            cell.alignment = A_WRAP
    ws_scen.row_dimensions[row].height = 36
    row += 1

# Column widths
ws_scen.column_dimensions["A"].width = 3
ws_scen.column_dimensions["B"].width = 12
ws_scen.column_dimensions["C"].width = 28
ws_scen.column_dimensions["D"].width = 14
ws_scen.column_dimensions["E"].width = 26
ws_scen.column_dimensions["F"].width = 26
ws_scen.column_dimensions["G"].width = 26
ws_scen.column_dimensions["H"].width = 34
ws_scen.column_dimensions["I"].width = 10
ws_scen.column_dimensions["J"].width = 10

wb.save(WB_PATH)
print("Scenario Index sheet created.")

# ═══════════════════════════════════════════════════════════════════════
# SHEET 3: ELEMENT REGISTRY
# ═══════════════════════════════════════════════════════════════════════
ws_elem = wb.create_sheet("Element Registry")
ws_elem.sheet_view.showGridLines = False

add_section_header(ws_elem, 2, "CANONICAL ELEMENT REGISTRY", 2, 10)
ws_elem.row_dimensions[2].height = 32

hdr_row = 4
headers = ["Element ID", "Element Name", "Primitive Storage Type", "Allowed Value Structure", "Display Type", "Atom-Level Fields", "Normalization Basis", "Computed Decimal Scale", "Controlled Value Set", "Version"]
for i, h in enumerate(headers, 2):
    cell = ws_elem.cell(row=hdr_row, column=i, value=h)
    cell.font = F_HEADER
    cell.fill = FIL_HEADER
    cell.alignment = A_CENTER
    cell.border = B_THIN
ws_elem.row_dimensions[hdr_row].height = 28

elements = [
    ("EL-001", "Ratio", "Composite", "Composite (numerator + denominator)", "Fraction", "numerator_binding, denominator_binding, numerator_unit, denominator_unit, normalization_basis, display_format", "Common denominator or unit-normalized basis", "Determined by display_format (e.g., 4 decimal places)", "RATIONAL_NUMBER_SET", "v1.1"),
    ("EL-002", "Fraction", "Composite", "Composite (whole + numerator + denominator)", "Fraction", "whole_part, numerator, denominator, unit, simplification_rule", "Lowest common denominator", "Determined by denominator magnitude", "FRACTION_SET", "v1.0"),
    ("EL-003", "Rate", "Composite", "Composite (value + time_unit + basis)", "Rate", "value, time_unit, basis_quantity, basis_unit, annualization_factor", "Per-unit-time normalized", "Determined by basis magnitude", "RATE_SET", "v1.0"),
    ("EL-004", "Multiple", "Scalar", "Decimal multiplier", "Decimal", "base_value, multiplier, floor, ceiling, rounding_rule", "Unit basis (e.g., per share, per unit)", "2-4 decimal places per convention", "MULTIPLE_SET", "v1.0"),
    ("EL-005", "Decimal Number", "Scalar", "IEEE 754 decimal", "Decimal", "precision, scale, rounding_mode, trailing_zero_display", "None (absolute value)", "Explicit per instance", "DECIMAL_SET", "v1.0"),
    ("EL-006", "Exchange Rate", "Composite", "Composite (rate semantics: value + from_currency + to_currency + timestamp)", "Rate", "value, from_currency, to_currency, timestamp, source, validity_window", "Cross-currency normalized to base currency", "6+ decimal places (pip precision)", "CURRENCY_PAIR_SET", "v1.1"),
    ("EL-007", "Signal", "Composite", "Composite (observation + confidence + lineage)", "Structured Object", "signal_type, observed_change, magnitude, confidence, origin_highway, affected_highways, evidence, probable_causes, predicted_impacts, mitigation_opportunities, status", "Evidence-weighted normalized confidence (0-1)", "N/A (confidence is scalar 0-1)", "SIGNAL_TYPE_SET", "v1.0"),
    ("EL-008", "Business Hypothesis", "Composite", "Composite (signals + evidence + alternatives + confidence)", "Structured Object", "observed_signals, supporting_evidence, alternative_explanations, confidence, potential_financial_impact, potential_commercial_impact, potential_accounting_impact, potential_customer_impact, recommended_validation_steps, validation_status, validated_root_cause, linked_initiatives, outcome", "Confidence-weighted evidence score (0-1)", "N/A", "HYPOTHESIS_STATUS_SET", "v1.0"),
    ("EL-009", "Value Creation Initiative", "Composite", "Composite (hypothesis + actions + projections + outcomes)", "Structured Object", "linked_hypothesis, signal, objective, expected_arr_preserved, expected_ebitda_impact, expected_ltv, evidence, owner, success_criteria, projected_arr, projected_margin, projected_renewal_probability, actual_outcome, closed_loop_evidence", "Enterprise value optimization (multi-objective)", "Currency- and percentage-scaled", "INITIATIVE_STATUS_SET", "v1.0"),
    ("EL-010", "Customer Health", "Composite (Molecule)", "Composite (8+ dimension scores + aggregate)", "Scorecard", "usage_trend, user_adoption, support_experience, implementation_progress, invoice_disputes, executive_engagement, renewal_risk, expansion_opportunity, financial_risk, overall_confidence", "Normalized 0-100 per dimension", "1 decimal place per dimension", "HEALTH_DIMENSION_SET", "v1.0"),
    ("EL-011", "String", "Scalar", "UTF-8 encoded text", "Text", "max_length, regex_pattern, controlled_vocabulary_ref, case_sensitivity", "None", "N/A", "STRING_CONSTRAINT_SET", "v1.0"),
    ("EL-012", "Boolean", "Scalar", "TRUE / FALSE / UNKNOWN", "Checkbox / Toggle", "tristate_allowed, default_value", "None", "N/A", "BOOLEAN_SET", "v1.0"),
    ("EL-013", "DateTime", "Scalar", "ISO 8601 timestamp", "Date/Time Picker", "timezone_policy, precision (ms/s/m/h/d)", "UTC normalized", "N/A", "DATETIME_SET", "v1.0"),
    ("EL-014", "Monetary Amount", "Composite", "Composite (value + currency + precision)", "Currency", "value, currency_code, precision, rounding_mode, display_symbol", "Base currency normalized for aggregation", "Smallest currency unit", "CURRENCY_SET", "v1.0"),
    ("EL-015", "Party Journey", "Composite", "Composite (party + stage + timeline + events)", "Timeline", "party_ref, current_stage, stage_history, entry_timestamp, exit_timestamp, events, tributary_branches", "Stage-normalized (0-100% journey progress)", "N/A", "JOURNEY_STAGE_SET", "v1.0"),
    ("EL-016", "Tributary Branch", "Composite", "Composite (parent_highway + branch_type + status + nested_streams)", "Tree / Branch", "parent_highway, branch_type, trigger_event, status, nested_streams, merge_point, evidence", "Branch-type normalized", "N/A", "BRANCH_TYPE_SET", "v1.0"),
    ("EL-017", "Molecule", "Composite", "Composite (atoms + relationships + provenance)", "Object Graph", "atom_refs, relationship_map, provenance_chain, version, lineage", "Schema-normalized per molecule type", "N/A", "MOLECULE_TYPE_SET", "v1.0"),
    ("EL-018", "Atom", "Composite", "Composite (element + value + source + lineage + fieldMeta)", "Field", "element_ref, value, source_type, merged_from, sources, capability_tags, description, fieldMeta", "Element-type normalized", "Per Element definition", "ATOM_TYPE_SET", "v1.0"),
    ("EL-019", "Integer", "Scalar", "64-bit signed integer", "Number", "min_value, max_value, step, display_format", "None", "N/A", "INTEGER_SET", "v1.0"),
    ("EL-020", "Enumerated Value", "Scalar", "Controlled vocabulary member", "Dropdown", "vocabulary_ref, allow_multiple, default_value, display_order", "None", "N/A", "CONTROLLED_VOCABULARY_SET", "v1.0"),
]

row = 5
for eid, name, storage, structure, display, atom_fields, norm, scale, cvs, version in elements:
    vals = [eid, name, storage, structure, display, atom_fields, norm, scale, cvs, version]
    for i, v in enumerate(vals, 2):
        cell = ws_elem.cell(row=row, column=i, value=v)
        style_data_cell(cell, bold=(i == 2), wrap=True)
    ws_elem.row_dimensions[row].height = 48
    row += 1

ws_elem.column_dimensions["A"].width = 3
ws_elem.column_dimensions["B"].width = 12
ws_elem.column_dimensions["C"].width = 20
ws_elem.column_dimensions["D"].width = 18
ws_elem.column_dimensions["E"].width = 22
ws_elem.column_dimensions["F"].width = 14
ws_elem.column_dimensions["G"].width = 38
ws_elem.column_dimensions["H"].width = 28
ws_elem.column_dimensions["I"].width = 24
ws_elem.column_dimensions["J"].width = 24
ws_elem.column_dimensions["K"].width = 10

wb.save(WB_PATH)
print("Element Registry sheet created.")
