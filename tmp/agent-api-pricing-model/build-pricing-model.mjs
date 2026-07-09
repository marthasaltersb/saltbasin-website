import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspace = "C:/Users/mbets/saltbasin-website";
const outputDir = path.join(workspace, "outputs", "agent-api-pricing-architecture-2026-07-09");
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const assumptions = workbook.worksheets.add("Assumptions");
const catalog = workbook.worksheets.add("API Catalog");
const scenarios = workbook.worksheets.add("Scenarios");
const sensitivity = workbook.worksheets.add("Margin Sensitivity");
const tokenArch = workbook.worksheets.add("Token Architecture");
const advisory = workbook.worksheets.add("Advisory Services");
const checks = workbook.worksheets.add("Checks");

const colors = {
  navy: "#17324D",
  teal: "#1F7A76",
  paleTeal: "#DDEDEA",
  gold: "#C58B2B",
  paleGold: "#F6EBD8",
  slate: "#475569",
  lightSlate: "#E2E8F0",
  white: "#FFFFFF",
  green: "#166534",
  red: "#991B1B",
};

function title(sheet, range, text) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[text]];
  r.format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 15 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  r.format.rowHeightPx = 34;
}

function sectionHeader(range) {
  range.format = {
    fill: colors.teal,
    font: { bold: true, color: colors.white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: colors.teal },
  };
}

function inputStyle(range) {
  range.format = {
    fill: colors.paleGold,
    borders: { preset: "outside", style: "thin", color: "#E3C68D" },
  };
}

function outputStyle(range) {
  range.format = {
    fill: colors.paleTeal,
    borders: { preset: "outside", style: "thin", color: "#A6CFC9" },
  };
}

for (const sheet of [summary, assumptions, catalog, scenarios, sensitivity, tokenArch, advisory, checks]) {
  sheet.showGridLines = false;
}

title(summary, "A1:H1", "Salt Basin Agent API Pricing Model");
summary.getRange("A3:H3").values = [["Model purpose", "Compare value-based API pricing, cost floor, margin targets, and advisory deposits across multiple client scenarios.", null, null, null, null, null, null]];
summary.getRange("A3:H3").merge();
summary.getRange("A3:H3").format = { fill: "#F8FAFC", font: { color: colors.slate }, wrapText: true };

summary.getRange("A5:H5").values = [["Scenario", "ARR", "Annual Calls", "Recommended $/Call", "Annual API Revenue", "Gross Margin", "Advisory Fee", "Deposit"]];
sectionHeader(summary.getRange("A5:H5"));
summary.getRange("A6:H10").formulas = [
  ["='Scenarios'!A6", "='Scenarios'!B6", "='Scenarios'!E6", "='Scenarios'!P6", "='Scenarios'!Q6", "='Scenarios'!T6", "='Scenarios'!U6", "='Scenarios'!V6"],
  ["='Scenarios'!A7", "='Scenarios'!B7", "='Scenarios'!E7", "='Scenarios'!P7", "='Scenarios'!Q7", "='Scenarios'!T7", "='Scenarios'!U7", "='Scenarios'!V7"],
  ["='Scenarios'!A8", "='Scenarios'!B8", "='Scenarios'!E8", "='Scenarios'!P8", "='Scenarios'!Q8", "='Scenarios'!T8", "='Scenarios'!U8", "='Scenarios'!V8"],
  ["='Scenarios'!A9", "='Scenarios'!B9", "='Scenarios'!E9", "='Scenarios'!P9", "='Scenarios'!Q9", "='Scenarios'!T9", "='Scenarios'!U9", "='Scenarios'!V9"],
  ["='Scenarios'!A10", "='Scenarios'!B10", "='Scenarios'!E10", "='Scenarios'!P10", "='Scenarios'!Q10", "='Scenarios'!T10", "='Scenarios'!U10", "='Scenarios'!V10"],
];
outputStyle(summary.getRange("A6:H10"));
summary.getRange("A12:H12").values = [["Interpretation", "The recommended API call price is the greater of value-based price after volume discount and the margin-protected price floor. This keeps value as the anchor while preventing underpriced enterprise workloads.", null, null, null, null, null, null]];
summary.getRange("A12:H12").merge();
summary.getRange("A12:H12").format = { fill: colors.paleTeal, font: { color: colors.navy, bold: true }, wrapText: true };

summary.getRange("A14:H14").values = [["Key decision ratios", "Recommended starting targets: 20%-30% Salt Basin attribution share, 65%-80% target gross margin, and 60%-85% confidence factor depending on evidence quality and implementation risk.", null, null, null, null, null, null]];
summary.getRange("A14:H14").merge();
summary.getRange("A14:H14").format = { fill: "#F8FAFC", font: { color: colors.slate }, wrapText: true };

title(assumptions, "A1:D1", "Editable Assumptions");
assumptions.getRange("A3:D3").values = [["Input", "Value", "Unit", "Notes"]];
sectionHeader(assumptions.getRange("A3:D3"));
assumptions.getRange("A4:D18").values = [
  ["Target Gross Margin", 0.75, "%", "Used to calculate margin-protected price floor."],
  ["Default Contribution Relevance", 0.8, "%", "How directly agent capability supports the client value pool."],
  ["Default Salt Basin Attribution", 0.25, "%", "Share of value reasonably attributed to Salt Basin."],
  ["Default Confidence Factor", 0.7, "%", "Discount for uncertainty and adoption risk."],
  ["Starter Volume Discount", 0, "%", "0-10k monthly calls."],
  ["Growth Volume Discount", 0.1, "%", "10k-50k monthly calls."],
  ["Scale Volume Discount", 0.2, "%", "50k-250k monthly calls."],
  ["Enterprise Volume Discount", 0.3, "%", "250k-1M monthly calls."],
  ["Portfolio Volume Discount", 0.4, "%", "1M+ monthly calls."],
  ["Deposit Rate", 0.25, "%", "Advisory deposit as share of fixed fee."],
  ["Storage Cost Per Call", 0.015, "$", "DB, logs, usage ledger, retention."],
  ["Queue Runtime Cost Per Call", 0.025, "$", "Worker, orchestration, retries."],
  ["Observability Cost Per Call", 0.01, "$", "Metrics, tracing, alerts."],
  ["Support Allocation Per Call", 0.04, "$", "Client support and operational overhead."],
  ["Security Allocation Per Call", 0.02, "$", "Audit, auth, compliance overhead."],
];
inputStyle(assumptions.getRange("B4:B18"));
assumptions.getRange("B4:B13").format.numberFormat = "0.0%";
assumptions.getRange("B14:B18").format.numberFormat = "$0.000";
assumptions.getRange("A3:D18").format.borders = { preset: "inside", style: "thin", color: colors.lightSlate };

title(catalog, "A1:J1", "API Catalog And Pricing Roles");
catalog.getRange("A3:J3").values = [["Endpoint", "Method", "Category", "Billable", "Call Type", "Base Price Low", "Base Price High", "Complexity Weight", "Typical Latency Pattern", "Notes"]];
sectionHeader(catalog.getRange("A3:J3"));
catalog.getRange("A4:J23").values = [
  ["/api/v1/auth/signup", "POST", "Access", "No", "non_billable", 0, 0, 0, "Sync", "Client organization and admin creation."],
  ["/api/v1/oauth/token", "POST", "Access", "No", "non_billable", 0, 0, 0, "Sync", "Short-lived scoped access token."],
  ["/api/v1/api-keys", "POST", "Access", "No", "non_billable", 0, 0, 0, "Sync", "Environment-scoped API key creation."],
  ["/api/v1/checkout/intake", "POST", "Checkout", "No", "non_billable", 0, 0, 0, "Sync", "Commercial intake and usage estimate."],
  ["/api/v1/pricing/estimate", "POST", "Checkout", "No", "non_billable", 0, 0, 0, "Sync", "Value-based and margin-floor quote estimate."],
  ["/api/v1/agent-runs", "POST", "Execution", "Yes", "agent_reasoning", 0.75, 4, 2, "Async", "Starts governed agent run."],
  ["/api/v1/agent-runs/:id", "GET", "Execution", "No", "non_billable", 0, 0, 0, "Sync", "Poll result within fair-use limits."],
  ["/api/v1/agent-runs/:id/events", "POST", "Execution", "Conditional", "workflow_orchestration", 1.5, 8, 3, "Async", "Premium event types may be billable."],
  ["/api/v1/context-packages", "POST", "Context", "Yes", "context_package", 0.25, 1.25, 1, "Sync/Async", "Client-managed model overlay ready."],
  ["/api/v1/model-overlays/validate", "POST", "Model Overlay", "No", "non_billable", 0, 0, 0, "Sync", "Validates client-managed model endpoint."],
  ["/api/v1/model-overlays/execution-receipts", "POST", "Model Overlay", "No", "non_billable", 0, 0, 0, "Sync", "Captures client-reported model usage metadata."],
  ["/api/v1/connectors/:provider/validate", "POST", "Connector", "Conditional", "connector_validation", 0, 1, 0.5, "Sync", "Free setup validation, billable monitor later."],
  ["/api/v1/connectors/:provider/object-profile", "POST", "Connector", "Yes", "connector_profile", 0.5, 3, 1.5, "Async", "Profiles object volume, fields, relationships."],
  ["/api/v1/connectors/:provider/sync-plan", "POST", "Connector", "Yes", "workflow_orchestration", 1.5, 8, 3, "Async", "Generates ingestion and context plan."],
  ["/api/v1/connectors/:provider/writeback", "POST", "Connector", "Yes", "writeback_action", 3, 15, 5, "Async", "Governed enterprise write-back action."],
  ["/api/v1/usage-events/:id", "GET", "Metering", "No", "non_billable", 0, 0, 0, "Sync", "Usage event audit detail."],
  ["/api/v1/audit-log", "GET", "Audit", "No", "non_billable", 0, 0, 0, "Sync", "Tenant audit trail."],
  ["/api/v1/webhooks", "POST", "Integration", "No", "non_billable", 0, 0, 0, "Sync", "Register signed webhook endpoint."],
  ["/api/v1/webhook-events/:id/replay", "POST", "Integration", "Conditional", "workflow_orchestration", 0, 1, 0.5, "Async", "Billable only above fair-use or client-side failure threshold."],
  ["/api/v1/entitlements", "GET", "Access", "No", "non_billable", 0, 0, 0, "Sync", "Allowed agents, connectors, limits, and scopes."],
];
catalog.getRange("F4:G23").format.numberFormat = "$0.00";
catalog.getRange("A3:J23").format.borders = { preset: "inside", style: "thin", color: colors.lightSlate };

title(scenarios, "A1:V1", "Scenario Pricing Model");
scenarios.getRange("A3:V3").values = [["Inputs", null, null, null, null, null, null, null, null, null, "Cost Build", null, null, null, "Pricing", null, null, null, null, "Outcome", null, null]];
scenarios.getRange("A3:J3").merge();
scenarios.getRange("K3:N3").merge();
scenarios.getRange("O3:S3").merge();
scenarios.getRange("T3:V3").merge();
sectionHeader(scenarios.getRange("A3:V3"));
scenarios.getRange("A5:V5").values = [[
  "Scenario", "ARR", "Annual Value Pool", "Agents Needed", "Annual Calls", "Monthly Calls", "Call Mix", "Relevance", "Attribution", "Confidence",
  "Model Cost/Call", "Infra Cost/Call", "Support+Security/Call", "Fully Loaded Cost/Call",
  "Volume Discount", "Recommended $/Call", "Annual API Revenue", "Annual Cost", "Gross Profit",
  "Gross Margin", "Advisory Fee", "Deposit"
]];
sectionHeader(scenarios.getRange("A5:V5"));
scenarios.getRange("A6:M10").values = [
  ["Self-Service RevOps Pilot", 12000000, 250000, 2, 60000, null, "65% context / 35% reasoning", 0.65, 0.18, 0.6, 0.05, null, null],
  ["Growth PE-Backed SaaS", 85000000, 1800000, 6, 250000, null, "40% context / 40% reasoning / 20% workflow", 0.8, 0.25, 0.7, 0.09, null, null],
  ["Enterprise Revenue Intelligence", 350000000, 7500000, 18, 1200000, null, "25% context / 45% reasoning / 20% workflow / 10% writeback", 0.85, 0.22, 0.65, 0.14, null, null],
  ["PE Portfolio Rollout", 1200000000, 25000000, 40, 6000000, null, "30% context / 35% reasoning / 25% workflow / 10% decision", 0.9, 0.18, 0.7, 0.11, null, null],
  ["High-Governance ERP Writeback", 600000000, 12000000, 25, 1800000, null, "20% context / 30% reasoning / 20% workflow / 30% writeback", 0.9, 0.24, 0.6, 0.22, null, null],
];
inputStyle(scenarios.getRange("B6:K10"));
scenarios.getRange("F6:F10").formulas = [["=E6/12"], ["=E7/12"], ["=E8/12"], ["=E9/12"], ["=E10/12"]];
scenarios.getRange("L6:L10").formulas = [["='Assumptions'!B14+'Assumptions'!B15+'Assumptions'!B16"], ["='Assumptions'!B14+'Assumptions'!B15+'Assumptions'!B16"], ["='Assumptions'!B14+'Assumptions'!B15+'Assumptions'!B16"], ["='Assumptions'!B14+'Assumptions'!B15+'Assumptions'!B16"], ["='Assumptions'!B14+'Assumptions'!B15+'Assumptions'!B16"]];
scenarios.getRange("M6:M10").formulas = [["='Assumptions'!B17+'Assumptions'!B18"], ["='Assumptions'!B17+'Assumptions'!B18"], ["='Assumptions'!B17+'Assumptions'!B18"], ["='Assumptions'!B17+'Assumptions'!B18"], ["='Assumptions'!B17+'Assumptions'!B18"]];
scenarios.getRange("N6:N10").formulas = [["=K6+L6+M6"], ["=K7+L7+M7"], ["=K8+L8+M8"], ["=K9+L9+M9"], ["=K10+L10+M10"]];
scenarios.getRange("O6:O10").formulas = [
  ["=IF(F6>1000000,'Assumptions'!B12,IF(F6>250000,'Assumptions'!B11,IF(F6>50000,'Assumptions'!B10,IF(F6>10000,'Assumptions'!B9,'Assumptions'!B8))))"],
  ["=IF(F7>1000000,'Assumptions'!B12,IF(F7>250000,'Assumptions'!B11,IF(F7>50000,'Assumptions'!B10,IF(F7>10000,'Assumptions'!B9,'Assumptions'!B8))))"],
  ["=IF(F8>1000000,'Assumptions'!B12,IF(F8>250000,'Assumptions'!B11,IF(F8>50000,'Assumptions'!B10,IF(F8>10000,'Assumptions'!B9,'Assumptions'!B8))))"],
  ["=IF(F9>1000000,'Assumptions'!B12,IF(F9>250000,'Assumptions'!B11,IF(F9>50000,'Assumptions'!B10,IF(F9>10000,'Assumptions'!B9,'Assumptions'!B8))))"],
  ["=IF(F10>1000000,'Assumptions'!B12,IF(F10>250000,'Assumptions'!B11,IF(F10>50000,'Assumptions'!B10,IF(F10>10000,'Assumptions'!B9,'Assumptions'!B8))))"],
];
scenarios.getRange("P6:P10").formulas = [
  ["=MAX((C6*H6*I6*J6/E6)*(1-O6),N6/(1-'Assumptions'!B4))"],
  ["=MAX((C7*H7*I7*J7/E7)*(1-O7),N7/(1-'Assumptions'!B4))"],
  ["=MAX((C8*H8*I8*J8/E8)*(1-O8),N8/(1-'Assumptions'!B4))"],
  ["=MAX((C9*H9*I9*J9/E9)*(1-O9),N9/(1-'Assumptions'!B4))"],
  ["=MAX((C10*H10*I10*J10/E10)*(1-O10),N10/(1-'Assumptions'!B4))"],
];
scenarios.getRange("Q6:Q10").formulas = [["=P6*E6"], ["=P7*E7"], ["=P8*E8"], ["=P9*E9"], ["=P10*E10"]];
scenarios.getRange("R6:R10").formulas = [["=N6*E6"], ["=N7*E7"], ["=N8*E8"], ["=N9*E9"], ["=N10*E10"]];
scenarios.getRange("S6:S10").formulas = [["=Q6-R6"], ["=Q7-R7"], ["=Q8-R8"], ["=Q9-R9"], ["=Q10-R10"]];
scenarios.getRange("T6:T10").formulas = [["=S6/Q6"], ["=S7/Q7"], ["=S8/Q8"], ["=S9/Q9"], ["=S10/Q10"]];
scenarios.getRange("U6:U10").values = [[40000], [125000], [250000], [500000], [300000]];
scenarios.getRange("V6:V10").formulas = [["=U6*'Assumptions'!B13"], ["=U7*'Assumptions'!B13"], ["=U8*'Assumptions'!B13"], ["=U9*'Assumptions'!B13"], ["=U10*'Assumptions'!B13"]];
inputStyle(scenarios.getRange("U6:U10"));
outputStyle(scenarios.getRange("L6:T10"));
outputStyle(scenarios.getRange("V6:V10"));
scenarios.getRange("B6:C10").format.numberFormat = "$#,##0";
scenarios.getRange("E6:F10").format.numberFormat = "#,##0";
scenarios.getRange("H6:J10").format.numberFormat = "0.0%";
scenarios.getRange("K6:N10").format.numberFormat = "$0.000";
scenarios.getRange("O6:O10").format.numberFormat = "0.0%";
scenarios.getRange("P6:P10").format.numberFormat = "$0.00";
scenarios.getRange("Q6:S10").format.numberFormat = "$#,##0";
scenarios.getRange("T6:T10").format.numberFormat = "0.0%";
scenarios.getRange("U6:V10").format.numberFormat = "$#,##0";
scenarios.getRange("A5:V10").format.borders = { preset: "inside", style: "thin", color: colors.lightSlate };

title(sensitivity, "A1:H1", "Margin And Pricing Sensitivity");
sensitivity.getRange("A3:H3").values = [["Scenario", "Fully Loaded Cost", "Price @ 60% GM", "Price @ 70% GM", "Price @ 75% GM", "Price @ 80% GM", "Price @ 85% GM", "Price @ 90% GM"]];
sectionHeader(sensitivity.getRange("A3:H3"));
sensitivity.getRange("A4:A8").formulas = [["='Scenarios'!A6"], ["='Scenarios'!A7"], ["='Scenarios'!A8"], ["='Scenarios'!A9"], ["='Scenarios'!A10"]];
sensitivity.getRange("B4:B8").formulas = [["='Scenarios'!N6"], ["='Scenarios'!N7"], ["='Scenarios'!N8"], ["='Scenarios'!N9"], ["='Scenarios'!N10"]];
sensitivity.getRange("C4:H8").formulas = [
  ["=$B4/(1-60%)", "=$B4/(1-70%)", "=$B4/(1-75%)", "=$B4/(1-80%)", "=$B4/(1-85%)", "=$B4/(1-90%)"],
  ["=$B5/(1-60%)", "=$B5/(1-70%)", "=$B5/(1-75%)", "=$B5/(1-80%)", "=$B5/(1-85%)", "=$B5/(1-90%)"],
  ["=$B6/(1-60%)", "=$B6/(1-70%)", "=$B6/(1-75%)", "=$B6/(1-80%)", "=$B6/(1-85%)", "=$B6/(1-90%)"],
  ["=$B7/(1-60%)", "=$B7/(1-70%)", "=$B7/(1-75%)", "=$B7/(1-80%)", "=$B7/(1-85%)", "=$B7/(1-90%)"],
  ["=$B8/(1-60%)", "=$B8/(1-70%)", "=$B8/(1-75%)", "=$B8/(1-80%)", "=$B8/(1-85%)", "=$B8/(1-90%)"],
];
outputStyle(sensitivity.getRange("A4:H8"));
sensitivity.getRange("B4:H8").format.numberFormat = "$0.00";

sensitivity.getRange("A11:H11").values = [["Attribution Share Sensitivity For Growth Scenario", null, null, null, null, null, null, null]];
sensitivity.getRange("A11:H11").merge();
sectionHeader(sensitivity.getRange("A11:H11"));
sensitivity.getRange("A13:H13").values = [["Attribution", "10%", "15%", "20%", "25%", "30%", "35%", "40%"]];
sectionHeader(sensitivity.getRange("A13:H13"));
sensitivity.getRange("A14:A14").values = [["Recommended $/Call"]];
sensitivity.getRange("B14:H14").formulas = [["=MAX(('Scenarios'!C7*'Scenarios'!H7*10%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*15%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*20%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*25%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*30%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*35%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))", "=MAX(('Scenarios'!C7*'Scenarios'!H7*40%*'Scenarios'!J7/'Scenarios'!E7)*(1-'Scenarios'!O7),'Scenarios'!N7/(1-'Assumptions'!B4))"]];
sensitivity.getRange("B14:H14").format.numberFormat = "$0.00";
outputStyle(sensitivity.getRange("A14:H14"));

title(tokenArch, "A1:H1", "Token And Metering Architecture");
tokenArch.getRange("A3:H3").values = [["Layer", "Token / Identifier", "Created By", "Required At", "Purpose", "Stored", "Expires", "Billing Role"]];
sectionHeader(tokenArch.getRange("A3:H3"));
tokenArch.getRange("A4:H13").values = [
  ["Portal session", "sb_admin / client session cookie", "Salt Basin auth", "Portal use", "Web login and checkout state", "sessions", "Short lived", "Non-billing"],
  ["Client API access", "OAuth client credentials token or scoped API key", "Salt Basin auth", "Every API request", "Authenticate calling app and scopes", "client_oauth_clients / client_api_keys", "Minutes to days", "Eligibility"],
  ["Idempotency", "Idempotency-Key", "Client", "Every billable POST", "Prevent duplicate execution and billing", "api_usage_events", "Client defined", "Duplicate protection"],
  ["Request fingerprint", "request_hash", "Salt Basin API", "At request acceptance", "Tamper/dispute support without storing raw payload by default", "api_usage_events", "Permanent per retention", "Audit"],
  ["Usage event", "usage_event_id", "Salt Basin API", "Before queued execution", "Durable meter record", "api_usage_events", "Permanent per retention", "Primary billing ID"],
  ["Usage token", "signed_usage_token", "Salt Basin API", "Internal queue/workers", "Propagate billing context through async steps", "api_usage_event_steps", "Until finalization", "Step attribution"],
  ["Agent run", "run_id", "Salt Basin API", "Client polling/webhooks", "Execution state and result reference", "agent_runs", "Retention policy", "Client traceability"],
  ["Context package", "context_package_id", "Salt Basin worker", "Model overlay or result retrieval", "Prompt/context/schema/evidence package", "context_packages", "Versioned retention", "Billable output"],
  ["Connector credential", "encrypted credential reference", "Client and Salt Basin vault", "Connector execution", "Access external enterprise system", "connector_credentials", "Until revoked", "Not billing token"],
  ["Webhook delivery", "webhook_event_id + signature", "Salt Basin", "Completion callback", "Secure async result delivery", "webhook_deliveries", "Retention policy", "Audit only"],
];
tokenArch.getRange("A3:H13").format.borders = { preset: "inside", style: "thin", color: colors.lightSlate };

title(advisory, "A1:G1", "Advisory Services Pricing");
advisory.getRange("A3:G3").values = [["Package", "Estimated Fee", "Deposit Rate", "Deposit", "Timeline", "Best Fit", "Primary Deliverables"]];
sectionHeader(advisory.getRange("A3:G3"));
advisory.getRange("A4:G7").values = [
  ["API Readiness Sprint", 40000, null, null, "3-4 weeks", "Self-service client needing scoped architecture", "Outcome brief; API setup plan; source-system dependency matrix; pricing estimate"],
  ["Enterprise Agent Design", 125000, null, null, "6 weeks", "Production workflow across CRM/data warehouse/marketing tools", "Agent capability map; context schema; connector guide; pilot roadmap"],
  ["Contribution Intelligence Operating Model", 250000, null, null, "8-10 weeks", "Cross-functional operating intelligence initiative", "Governance model; evidence framework; value case; implementation plan"],
  ["PE Portfolio Intelligence Rollout", 500000, null, null, "10-14 weeks", "Sponsor or portfolio-wide deployment", "Portfolio playbook; common data contracts; rollout roadmap; executive scorecard"],
];
advisory.getRange("C4:C7").formulas = [["='Assumptions'!B13"], ["='Assumptions'!B13"], ["='Assumptions'!B13"], ["='Assumptions'!B13"]];
advisory.getRange("D4:D7").formulas = [["=B4*C4"], ["=B5*C5"], ["=B6*C6"], ["=B7*C7"]];
advisory.getRange("B4:B7").format.numberFormat = "$#,##0";
advisory.getRange("C4:C7").format.numberFormat = "0.0%";
advisory.getRange("D4:D7").format.numberFormat = "$#,##0";
inputStyle(advisory.getRange("B4:B7"));
outputStyle(advisory.getRange("C4:D7"));
advisory.getRange("A3:G7").format.borders = { preset: "inside", style: "thin", color: colors.lightSlate };

title(checks, "A1:D1", "Model Checks");
checks.getRange("A3:D3").values = [["Check", "Result", "Delta / Detail", "Where To Fix"]];
sectionHeader(checks.getRange("A3:D3"));
checks.getRange("A4:D8").values = [
  ["No negative recommended prices", null, null, "Scenarios!P6:P10"],
  ["Gross margins meet target floor", null, null, "Assumptions!B4 / Scenarios!T6:T10"],
  ["Deposits equal 25% assumption", null, null, "Assumptions!B13 / Advisory Services"],
  ["Annual calls are positive", null, null, "Scenarios!E6:E10"],
  ["Model status", null, null, "Fix failed checks above"],
];
checks.getRange("B4:B8").formulas = [
  ["=IF(MIN('Scenarios'!P6:P10)>0,\"PASS\",\"FAIL\")"],
  ["=IF(MIN('Scenarios'!T6:T10)>='Assumptions'!B4-0.0001,\"PASS\",\"FAIL\")"],
  ["=IF(ABS('Advisory Services'!D5-'Advisory Services'!B5*'Assumptions'!B13)<0.01,\"PASS\",\"FAIL\")"],
  ["=IF(MIN('Scenarios'!E6:E10)>0,\"PASS\",\"FAIL\")"],
  ["=IF(COUNTIF(B4:B7,\"FAIL\")=0,\"PASS\",\"FAIL\")"],
];
checks.getRange("C4:C8").formulas = [
  ["=MIN('Scenarios'!P6:P10)"],
  ["=MIN('Scenarios'!T6:T10)-'Assumptions'!B4"],
  ["='Advisory Services'!D5-'Advisory Services'!B5*'Assumptions'!B13"],
  ["=MIN('Scenarios'!E6:E10)"],
  ["=COUNTIF(B4:B7,\"FAIL\")"],
];
checks.getRange("C4").format.numberFormat = "$0.00";
checks.getRange("C5").format.numberFormat = "0.0%";
checks.getRange("C6").format.numberFormat = "$0.00";
checks.getRange("C7:C8").format.numberFormat = "#,##0";
outputStyle(checks.getRange("A4:D8"));

for (const sheet of [summary, assumptions, catalog, scenarios, sensitivity, tokenArch, advisory, checks]) {
  const used = sheet.getUsedRange();
  used.format.wrapText = true;
  used.format.verticalAlignment = "top";
  used.format.autofitColumns();
  used.format.autofitRows();
}

summary.freezePanes.freezeRows(5);
assumptions.freezePanes.freezeRows(3);
catalog.freezePanes.freezeRows(3);
scenarios.freezePanes.freezeRows(5);
sensitivity.freezePanes.freezeRows(3);
tokenArch.freezePanes.freezeRows(3);
advisory.freezePanes.freezeRows(3);
checks.freezePanes.freezeRows(3);

summary.getRange("B6:C10").format.numberFormat = "$#,##0";
summary.getRange("D6:D10").format.numberFormat = "$0.00";
summary.getRange("E6:E10").format.numberFormat = "$#,##0";
summary.getRange("F6:F10").format.numberFormat = "0.0%";
summary.getRange("G6:H10").format.numberFormat = "$#,##0";

const summaryPreview = await workbook.render({ sheetName: "Summary", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "summary-preview.png"), new Uint8Array(await summaryPreview.arrayBuffer()));
const scenariosPreview = await workbook.render({ sheetName: "Scenarios", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "scenarios-preview.png"), new Uint8Array(await scenariosPreview.arrayBuffer()));

const inspectScenarios = await workbook.inspect({
  kind: "table",
  range: "Scenarios!A5:V10",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 24,
  maxChars: 12000,
});
console.log(inspectScenarios.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
  maxChars: 4000,
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
const xlsxPath = path.join(outputDir, "Salt_Basin_Agent_API_Pricing_Model.xlsx");
await output.save(xlsxPath);
console.log(`saved ${xlsxPath}`);
