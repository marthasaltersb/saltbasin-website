from pathlib import Path
import json
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(".")
DOCS_DIR = ROOT / "docs"
OUT_DIR = ROOT / "output"
PDF_DIR = OUT_DIR / "pdf"
for path in (DOCS_DIR, OUT_DIR, PDF_DIR):
    path.mkdir(parents=True, exist_ok=True)

PDF_PATH = PDF_DIR / "Salt_Basin_Interface_Intelligence_Operating_Blueprint_v2.pdf"
MD_PATH = DOCS_DIR / "interface-intelligence-product-definition-v2.md"
TECH_MD_PATH = DOCS_DIR / "interface-intelligence-technical-blueprint-v1.md"
AGENT_MD_PATH = DOCS_DIR / "interface-intelligence-agent-operating-model-v1.md"
SCHEMA_PATH = DOCS_DIR / "interface-intelligence-ledger-schema-v1.json"

NAVY = colors.HexColor("#172A45")
MIDNIGHT = colors.HexColor("#0F1B2D")
GOLD = colors.HexColor("#C4843A")
SHELL = colors.HexColor("#F7F2E8")
MIST = colors.HexColor("#EEF2F6")
SLATE = colors.HexColor("#536173")
TEAL = colors.HexColor("#4A7C8E")
GREEN = colors.HexColor("#2D5A27")
PLUM = colors.HexColor("#7A174E")
GRAPHITE = colors.HexColor("#252A31")
WHITE = colors.white
LINE = colors.HexColor("#D7DBE2")


class GoldRule(Flowable):
    def __init__(self, width=6.6 * inch, height=7):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        self.canv.setStrokeColor(GOLD)
        self.canv.setLineWidth(1.1)
        self.canv.line(0, self.height / 2, self.width, self.height / 2)


class KpiBand(Flowable):
    def __init__(self, items):
        super().__init__()
        self.items = items
        self.width = 6.6 * inch
        self.height = 0.95 * inch

    def draw(self):
        card_w = self.width / len(self.items) - 6
        x = 0
        for metric, label in self.items:
            self.canv.setFillColor(WHITE)
            self.canv.setStrokeColor(LINE)
            self.canv.roundRect(x, 0, card_w, self.height, 7, stroke=1, fill=1)
            self.canv.setFillColor(NAVY)
            self.canv.setFont("Helvetica-Bold", 17)
            self.canv.drawCentredString(x + card_w / 2, 0.52 * inch, metric)
            self.canv.setFillColor(SLATE)
            self.canv.setFont("Helvetica-Bold", 6.6)
            lines = wrap(label.upper(), 18)
            for idx, line in enumerate(lines[:2]):
                self.canv.drawCentredString(x + card_w / 2, 0.31 * inch - idx * 8, line)
            x += card_w + 6


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=GOLD, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=NAVY, alignment=TA_CENTER, spaceAfter=9))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=11.2, leading=15, textColor=GRAPHITE, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name="H1SB", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=NAVY, spaceBefore=10, spaceAfter=7))
styles.add(ParagraphStyle(name="H2SB", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="BodySB", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.0, leading=12.3, textColor=GRAPHITE, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallSB", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.2, leading=9.2, textColor=SLATE, spaceAfter=3))
styles.add(ParagraphStyle(name="LabelSB", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=7.0, leading=9, textColor=GOLD, spaceAfter=3))
styles.add(ParagraphStyle(name="TableCellSB", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.9, leading=8.6, textColor=GRAPHITE, spaceAfter=0))
styles.add(ParagraphStyle(name="TableHeaderSB", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=6.9, leading=8.6, textColor=WHITE, spaceAfter=0))
styles.add(ParagraphStyle(name="QuoteSB", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10.2, leading=13.5, textColor=NAVY, alignment=TA_CENTER, spaceAfter=5))


def p(text, style="BodySB"):
    return Paragraph(text, styles[style])


def bullets(items):
    return ListFlowable(
        [ListItem(p(item, "BodySB"), leftIndent=8) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=13,
        bulletFontName="Helvetica",
        bulletFontSize=5.5,
    )


def table(data, widths, header=True):
    wrapped = []
    for row_index, row in enumerate(data):
        wrapped_row = []
        for value in row:
            style = "TableHeaderSB" if header and row_index == 0 else "TableCellSB"
            wrapped_row.append(value if isinstance(value, Flowable) else Paragraph(str(value), styles[style]))
        wrapped.append(wrapped_row)
    tbl = Table(wrapped, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    tbl_style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        tbl_style += [("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE)]
    for row in range(1, len(data)):
        if row % 2 == 0:
            tbl_style.append(("BACKGROUND", (0, row), (-1, row), colors.HexColor("#F8FAFC")))
    tbl.setStyle(TableStyle(tbl_style))
    return tbl


def callout(title, body, accent=TEAL):
    tbl = Table([[p(title, "LabelSB"), p(body, "BodySB")]], colWidths=[1.35 * inch, 5.05 * inch], hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), MIST),
                ("BOX", (0, 0), (-1, -1), 0.55, LINE),
                ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return tbl


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(SLATE)
    canvas.setFont("Helvetica", 6.8)
    canvas.drawString(doc.leftMargin, 0.36 * inch, "Salt Basin Net Works | HandoverOS Interface Intelligence | Internal product blueprint")
    canvas.drawRightString(letter[0] - doc.rightMargin, 0.36 * inch, f"Page {doc.page}")
    canvas.restoreState()


product_definition = """# HandoverOS Interface Intelligence Layer

Version: v2
Status: Recommended product definition and operating blueprint
Owner: Salt Basin Net Works

## Recommended Definition

HandoverOS Interface Intelligence is a governed transaction-lineage layer that sits above client integrations, APIs, imports, exports, and system-to-system connectors. It turns every interface event into an agent-readable evidence record: source and target systems, object identity, payload values, transformations, waterfall steps, validation results, revenue lifecycle token placement, customer journey token placement, member journey token placement, contribution attribution, confidence reconciliation, exceptions, and recommended follow-up.

## Product One-Liner

HandoverOS Interface Intelligence traces every revenue, customer, and member lifecycle data transaction across systems, then uses Salt Basin agents to explain lineage, detect mismatches, identify hidden operational risk, reconcile contribution, and preserve reusable institutional memory.

## Product Doctrine

Most revenue leakage and customer-friction issues are not created where they become visible. They are created upstream in a field, rule, approval, transform, stale source, missing handoff, missing token, or control gap that no one can see later.

The product makes those hidden moments visible. It does not only ask whether data moved. It asks what changed, why it changed, which lifecycle object it affected, which downstream processes now depend on it, which control should have caught it, and whether the business can trust the result.

## Three Primary Token Model

| Token | Purpose | Lifecycle |
|---|---|---|
| Revenue Lifecycle Token | Follows commercial and financial truth from demand creation through revenue operations. | Prospect -> Pipeline -> Proposal -> Contract -> Order -> Subscription -> Bill -> Invoice -> Collect -> Recognize -> Renew/Expand -> Adjust |
| Customer Journey Token | Follows the customer-adjacent truth from external signal through service and expansion. | External Lead -> Qualified Prospect -> Negotiation -> Signature -> Onboarding -> Active Customer -> Payment -> Support/Change -> Renewal/Expansion/Churn |
| Member Journey Token | Follows the entitled organization, child organization, site, individual member, end user, or free-tier user who receives, accesses, or consumes the product. | Eligible Population -> Invited Member -> Entitled Member -> Activated User/Site -> Licensed Use -> Support/Utilization -> Expansion/Change -> Renewal/Termination |

The three tokens are linked but not identical. A customer can agree to pay at the contract level while onboarding, fulfillment, utilization, support, and renewal happen at a child organization, related organization, site, provider group, district, employer population, health plan member group, individual member, or end user level. Interface Intelligence preserves revenue truth, customer truth, and member/entitlement truth without flattening them into one account record.

## Supporting Agent Tokens

Primary tokens should be reconciled by supporting agent tokens:

| Token | Purpose |
|---|---|
| Contract Obligation Token | Tracks performance obligations, payment responsibility, billing triggers, support terms, renewal notice dates, variable consideration, discounts, and usage commitments. |
| Financial Transaction Token | Tracks each payment, invoice, remittance choice, auto-pay/manual payment status, collections event, adjustment, and revenue recognition event back to the Revenue Lifecycle Token. |
| Resource Contribution Token | Tracks human roles, user types, teams, systems, AI agents, workflows, and technology contributions to the outcome. |
| Confidence Reconciliation Token | Compares conflicting token evidence, scores coverage and confidence, and records which agent or human resolved the conflict. |

## Member Token Examples

Member tokens are required when the contract customer, fulfillment organization, licensed entity, and end user are not the same. Examples include district-level contracts with site-level fulfillment and end-user coverage, shared server license agreements, enterprise end user license agreements, health plan or employer-sponsored telehealth access, provider-first healthcare models, independently paid individual users, and free-tier users who later convert or influence utilization.

## Where It Fits In Salt Basin

Interface Intelligence becomes the evidence layer under HandoverOS, the governed context layer for BestyStaff, and a high-value use case for the Salt Basin Contribution Intelligence API. It extends the current site lineage capability from field-level content change history into enterprise transaction forensics across revenue and customer systems.

## Public-Safe Positioning

Public-facing outputs can show maps, scorecards, governance checklists, lineage diagrams, capability taxonomies, and example schemas. Public outputs should not expose raw Gmail-derived materials, proprietary workbook internals, client/employer artifacts, private formulas, or full field taxonomies without approval.
"""


technical_blueprint = """# Interface Intelligence Technical Blueprint

Version: v1
Status: Implementation-ready architecture draft

## Architecture Recommendation

Build this as an extension of the existing Salt Basin lineage foundation, not as a separate black-box product. The current code already captures field-level deltas, context hashes, snapshots, source types, source refs, authors, and timestamps. Interface Intelligence should add transaction identity, connector identity, lifecycle tokens, waterfall steps, control evidence, agent analyses, usage metering, and memory governance.

## Core Tables

| Table | Purpose |
|---|---|
| interface_connectors | Registered source/target systems, provider, tenant, auth scope, environment, owner, status. |
| interface_transactions | One durable interface event across API call, webhook, import, export, sync, job, or manual upload. |
| interface_transaction_steps | Ordered waterfall steps inside a transaction: extract, map, transform, validate, enrich, write, acknowledge, retry. |
| interface_field_lineage | Field-level value movement, previous value, transformed value, rule id, confidence, hash, and masking policy. |
| lineage_tokens | Revenue Lifecycle Token, Customer Journey Token, Member Journey Token, and supporting agent-token records. |
| token_edges | Relationships among lead, account, payer, employer, plan, site, member, user, opportunity, quote, contract, order, subscription, invoice, payment, revenue schedule, case, and change request. |
| member_identity_links | Links payer, customer, parent org, child org, site, provider, employer group, plan, member, end user, and free-tier identity records. |
| member_entitlements | Captures covered population, license type, eligibility, activation, utilization, support coverage, access tier, and renewal/change status. |
| token_stage_gates | Stores required inputs, outputs, decisions, approvals, and evidence for each token stage gate. |
| contribution_events | Tracks human, user-type, team, system, AI agent, workflow, and technology contributions to each transaction or token outcome. |
| confidence_reconciliations | Records conflicting evidence, coverage scores, confidence scores, agent review, human review, and final resolution. |
| interface_controls | Required controls and policies for a connector, object, lifecycle stage, or field class. |
| control_executions | Evidence that a control ran, passed, failed, was skipped, or required human review. |
| agent_transaction_analyses | Agent-produced explanations, risks, root-cause hypotheses, confidence, and recommendations. |
| memory_candidates | Governed reusable knowledge candidates created from transaction patterns. |
| usage_meter_events | Salt Basin API metering event at the moment of billable capability consumption. |

## Event Capture Contract

Each captured interface transaction should include:

- Identity: transaction id, correlation id, idempotency key, connector id, environment, tenant, timestamp.
- Direction: source system, target system, source object, target object, operation, trigger.
- Payload: raw payload reference, masked payload summary, before/after values, schema version.
- Transformation: rule id, mapping version, formula, enrichment source, fallback/default logic.
- Waterfall: ordered steps, duration, status, retry count, actor, system response.
- Lifecycle: revenue lifecycle token, customer journey token, member journey token, supporting agent tokens, stage, canonical entity ids.
- Contract and entitlement: payer, bill-to, sold-to, ship-to/fulfill-to, covered organization, covered member population, performance obligations, renewal notice, support terms, pricing model, usage model, discounts, variable consideration, payment method, remittance method, and invoice destination.
- Stage gates: required inputs, outputs, approvals, blockers, decision owner, resource contributors, technology contributors, and output artifacts.
- Contribution: people, user types, teams, systems, AI agents, workflows, and technology resources that contributed to the transaction, plus cost basis and ROI attribution where supportable.
- Governance: evidence status, control policy, sensitivity level, retention policy, approval state.
- Agent output: summary, anomaly flags, root-cause hypothesis, confidence, recommended action.

## API Surface

| Endpoint | Purpose | Billable |
|---|---|---|
| POST /api/v1/interface-intelligence/events | Capture one transaction event. | Conditional |
| POST /api/v1/interface-intelligence/events/batch | Capture batch imports, ETL jobs, or sync windows. | Conditional |
| GET /api/v1/interface-intelligence/transactions/:id | Retrieve transaction forensic record. | No |
| GET /api/v1/interface-intelligence/tokens/:tokenId/graph | Retrieve revenue, customer, member, and supporting-token graph. | No or premium by depth |
| POST /api/v1/interface-intelligence/analyze/transaction | Run agent analysis on one transaction. | Yes |
| POST /api/v1/interface-intelligence/analyze/token | Run cross-system analysis for a token. | Yes |
| POST /api/v1/interface-intelligence/connectors/validate | Validate connector access, object visibility, scope, rate limits. | Conditional |
| POST /api/v1/pricing/estimate | Estimate contribution-intelligence usage, volume, and advisory scope. | No |

## Security And Governance

Do not rely on client system tokens as Salt Basin's security model. Salt Basin needs its own tenant auth, scoped API keys or OAuth client credentials, RBAC, object-level authorization, audit log, webhook signatures, rate limits, idempotency keys, encrypted credentials, retention controls, redaction policy, and production/sandbox separation.

## MVP Implementation Path

1. Extend the current lineage service with transaction id, connector id, lifecycle stage, token id, member token id, stage-gate id, and sensitivity fields.
2. Add interface transaction and step tables through idempotent database migrations.
3. Add API capture endpoints with strict schema validation and idempotency.
4. Add a transaction forensic view in the admin lineage panel.
5. Add first agent analyses: anomaly explanation, token trace, member entitlement trace, contract obligation trace, contribution breakdown, and control evidence summary.
6. Add usage meter events for billable agent and connector intelligence calls.
7. Add public-safe output templates for executive briefs, heatmaps, and evidence matrices.
"""


agent_model = """# Interface Intelligence Agent Operating Model

Version: v1
Status: Recommended operating model

## Agent Loop

Observe -> Classify -> Trace -> Explain -> Detect -> Recommend -> Remember.

Each agent must separate facts, assumptions, interpretations, predictions, risks, confidence, and recommendations. Raw Gmail-derived context or client data cannot become active reusable memory until it passes classification and approval.

## Core Agent Pool

| Agent | Job | Recommended Max Volume Per Worker |
|---|---|---:|
| Interface Transaction Analyst | Inspect API calls, imports, exports, and sync events for missing values, errors, drift, retries, and mismatches. | 250 transactions or 50 error clusters |
| Integration Mapping Agent | Map source/target objects, fields, transformations, dependencies, and failure points. | 150 fields, 20 objects, or 10 sample payloads |
| Revenue Lifecycle Tracer | Follow the Revenue Lifecycle Token from prospect/pipeline through renew, expand, adjust. | 100 tokens or 500 related events |
| Customer Journey Tracer | Follow the customer-adjacent token from external lead through onboarding, payment, support, change, renewal, churn. | 100 tokens or 500 related events |
| Member Journey Tracer | Follow organizational members, child organizations, sites, individual members, end users, free-tier users, and entitlement coverage. | 100 tokens or 500 related events |
| Contract Obligation Mapper | Extract performance obligations, payer responsibility, billing triggers, renewal terms, support terms, payment method, discounts, usage commitments, and variable consideration. | 75 contracts or 250 clauses |
| Financial Transaction Reconciler | Trace every payment, remittance, invoice, adjustment, collection, and revenue recognition event back to the Revenue Lifecycle Token. | 250 financial events |
| Contribution Intelligence Agent | Attribute human, user-type, team, system, AI agent, workflow, and technology contributions to stage gates and outcomes. | 200 contribution events |
| Confidence Reconciliation Agent | Compare conflicting token evidence, score coverage/confidence, and decide whether an agent or human review is required. | 150 conflicts or 500 scored fields |
| Control Evidence Agent | Check whether required controls ran, passed, failed, or require human review. | 50 controls or 250 executions |
| Root Cause Pattern Agent | Cluster recurring failures into leakage patterns, data-governance causes, and process defects. | 300 anomalies or 25 clusters |
| Benchmark And Claims Guard | Prevent stale, unsupported, or external claims from entering public/client outputs. | 100 claims |
| Memory Steward | Classify reusable memory candidates as public-safe, internal, restricted, confidential, or quarantine. | 50 sensitive or 250 low-risk candidates |

## Token Chain Dimensional Model

The model should support a full chain from commercial promise to delivered value:

Deal Type -> Customer/Payer -> Contract Obligation -> Revenue Lifecycle Token -> Customer Journey Token -> Member Journey Token -> Stage Gate -> Interface Transaction -> Field Lineage -> Financial Transaction -> Contribution Event -> Confidence Reconciliation -> Memory Candidate.

Key dimensions:

- Deal contribution intelligence: deal type, valuation size, investment type, industry vertical, actively seeking criteria match, board member skills, sponsor priorities, and value-creation thesis.
- Contract economics: payer, bill-to, invoice destination, payment method, remittance method, annual recurrence, usage pricing, discounts, variable consideration, support terms, renewal notice, and performance obligations.
- Member coverage: parent organization, child organization, site, group, provider, employer population, plan member population, individual license, free tier, activation, utilization, support, and churn/renewal status.
- Resource contribution: human role, user type, team, system, AI agent, workflow, technology, cost basis, elapsed time, quality score, and ROI attribution.
- Confidence: input coverage, output coverage, transformation confidence, token match confidence, financial reconciliation confidence, and human/agent review status.

## Parallel Sizing Formula

worker_count = ceiling(total_units / max_units_per_worker)

functional_lead_count = ceiling(worker_count / 5)

management_agent_count = ceiling(functional_lead_count / 3)

## Volume Tiers

| Size | Practical Scope | Suggested Agent Shape |
|---|---|---|
| Small | Up to 100 pages, 1k rows, 50 defects, or one process tower. | 1-2 workers, 0-1 lead, 1 manager/orchestrator |
| Medium | 100-500 pages, 1k-25k rows, 50-300 defects, or 3-5 towers. | 3-6 workers, 1-2 leads, 1-2 managers |
| Large | 500-2000 pages, 25k-250k rows, 300-1500 defects, or 5-10 towers. | 8-20 workers, 3-5 leads, 2-4 managers |
| Portfolio | Multiple companies or 2000+ pages, 250k+ rows, 1500+ defects. | 20-60 workers, 5-12 leads, 4-8 managers |

## Salt Basin Outputs

| Output | Audience | Purpose |
|---|---|---|
| Executive Interface Intelligence Brief | Sponsor, CFO, CRO, COO, CTO, PortOps | Explain the hidden operating truth and recommended action. |
| Transaction Forensic Packet | RevOps, IT, Finance Ops, Data | Show what happened in a transaction, field by field and step by step. |
| Token Lineage Graph | Product, RevOps, Finance, CS | Trace revenue and customer truth across systems. |
| Member Entitlement Graph | Product, CS, Finance, Healthcare/Market Ops | Trace payer, parent org, child org, site, member, user, free-tier, and entitlement relationships. |
| Contract Obligation Matrix | Legal, Finance, RevOps, Product | Show performance obligations, billing triggers, payment responsibility, support terms, renewal terms, discounts, and variable consideration. |
| Contribution Chain Scorecard | Sponsors, PortOps, Transformation Office | Compare human and technology contribution cost basis, ROI, stage order, contributor combinations, and deal contribution intelligence. |
| Control Evidence Matrix | Finance, Audit, Security, Transformation Office | Show which controls ran and which gaps need review. |
| Root Cause Heatmap | Transformation leaders | Prioritize recurring failure patterns by impact, frequency, and confidence. |
| Source Delta Card | Research and product team | Convert new evidence into model updates without overclaiming. |
| Memory Candidate Register | Internal Salt Basin agents | Preserve reusable insight under classification rules. |
"""


ledger_schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Salt Basin Interface Intelligence Ledger Event",
    "type": "object",
    "required": ["transactionId", "capturedAt", "connector", "operation", "systems", "objects", "governance"],
    "properties": {
        "transactionId": {"type": "string"},
        "correlationId": {"type": ["string", "null"]},
        "idempotencyKey": {"type": ["string", "null"]},
        "capturedAt": {"type": "integer", "description": "Epoch milliseconds."},
        "connector": {
            "type": "object",
            "required": ["connectorId", "provider", "environment"],
            "properties": {
                "connectorId": {"type": "string"},
                "provider": {"type": "string"},
                "environment": {"enum": ["sandbox", "production", "test", "development"]},
                "tenantRef": {"type": ["string", "null"]},
                "profileScope": {"type": ["string", "null"]},
                "profileId": {"type": ["string", "null"]},
            },
        },
        "operation": {
            "type": "object",
            "required": ["type", "trigger"],
            "properties": {
                "type": {"enum": ["api_call", "webhook", "import", "export", "sync_job", "manual_upload", "writeback"]},
                "trigger": {"type": "string"},
                "direction": {"enum": ["inbound", "outbound", "bidirectional", "internal"]},
            },
        },
        "systems": {
            "type": "object",
            "required": ["source", "target"],
            "properties": {
                "source": {"type": "string"},
                "target": {"type": "string"},
            },
        },
        "objects": {
            "type": "object",
            "properties": {
                "sourceObject": {"type": "string"},
                "targetObject": {"type": "string"},
                "canonicalEntityType": {"type": ["string", "null"]},
                "canonicalEntityId": {"type": ["string", "null"]},
                "payerEntityId": {"type": ["string", "null"]},
                "billToEntityId": {"type": ["string", "null"]},
                "fulfillmentEntityId": {"type": ["string", "null"]},
                "memberEntityId": {"type": ["string", "null"]},
                "endUserEntityId": {"type": ["string", "null"]},
            },
        },
        "tokens": {
            "type": "object",
            "properties": {
                "revenueLifecycleToken": {"type": ["string", "null"]},
                "customerJourneyToken": {"type": ["string", "null"]},
                "memberJourneyToken": {"type": ["string", "null"]},
                "contractObligationToken": {"type": ["string", "null"]},
                "financialTransactionToken": {"type": ["string", "null"]},
                "resourceContributionToken": {"type": ["string", "null"]},
                "confidenceReconciliationToken": {"type": ["string", "null"]},
                "lifecycleStage": {"type": ["string", "null"]},
                "customerJourneyStage": {"type": ["string", "null"]},
                "memberJourneyStage": {"type": ["string", "null"]},
            },
        },
        "contractObligations": {
            "type": "object",
            "properties": {
                "payerResponsibility": {"type": ["string", "null"]},
                "performanceObligations": {"type": "array", "items": {"type": "string"}},
                "billingTriggers": {"type": "array", "items": {"type": "string"}},
                "renewalTerms": {"type": ["string", "null"]},
                "firstRenewalNoticeAt": {"type": ["integer", "null"]},
                "supportTerms": {"type": ["string", "null"]},
                "pricingModel": {"type": ["string", "null"]},
                "usageModel": {"type": ["string", "null"]},
                "discounts": {"type": "array", "items": {"type": "string"}},
                "variableConsiderations": {"type": "array", "items": {"type": "string"}},
                "paymentMethodsAccepted": {"type": "array", "items": {"type": "string"}},
                "selectedPaymentMethod": {"type": ["string", "null"]},
                "remittanceMethod": {"type": ["string", "null"]},
                "invoiceDestination": {"type": ["string", "null"]},
            },
        },
        "memberEntitlement": {
            "type": "object",
            "properties": {
                "memberType": {"enum": ["organizational_member", "individual_member", "end_user", "site", "provider", "employer_group", "plan_member", "free_tier", "unknown"]},
                "parentOrganizationId": {"type": ["string", "null"]},
                "childOrganizationId": {"type": ["string", "null"]},
                "siteId": {"type": ["string", "null"]},
                "coveredPopulationRef": {"type": ["string", "null"]},
                "licenseType": {"type": ["string", "null"]},
                "accessTier": {"type": ["string", "null"]},
                "eligibilityStatus": {"type": ["string", "null"]},
                "activationStatus": {"type": ["string", "null"]},
                "utilizationSignals": {"type": "array", "items": {"type": "string"}},
            },
        },
        "stageGateIO": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["stageGateId", "stageName"],
                "properties": {
                    "stageGateId": {"type": "string"},
                    "stageName": {"type": "string"},
                    "inputs": {"type": "array", "items": {"type": "string"}},
                    "outputs": {"type": "array", "items": {"type": "string"}},
                    "approvals": {"type": "array", "items": {"type": "string"}},
                    "decisionOwner": {"type": ["string", "null"]},
                    "outputArtifacts": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "fieldLineage": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["fieldPath", "sourceValue", "targetValue"],
                "properties": {
                    "fieldPath": {"type": "string"},
                    "sourceValue": {},
                    "targetValue": {},
                    "previousValue": {},
                    "transformRuleId": {"type": ["string", "null"]},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "contextHash": {"type": ["string", "null"]},
                    "maskingPolicy": {"type": ["string", "null"]},
                },
            },
        },
        "waterfallSteps": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["stepName", "status"],
                "properties": {
                    "stepName": {"type": "string"},
                    "status": {"enum": ["passed", "failed", "skipped", "warning", "requires_review"]},
                    "startedAt": {"type": ["integer", "null"]},
                    "endedAt": {"type": ["integer", "null"]},
                    "durationMs": {"type": ["integer", "null"]},
                    "message": {"type": ["string", "null"]},
                },
            },
        },
        "financialTransactions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "financialTransactionId": {"type": "string"},
                    "type": {"enum": ["invoice", "payment", "remittance", "collection", "adjustment", "revenue_recognition", "refund", "credit"]},
                    "amount": {"type": ["number", "null"]},
                    "currency": {"type": ["string", "null"]},
                    "method": {"type": ["string", "null"]},
                    "revenueLifecycleToken": {"type": ["string", "null"]},
                    "recognitionStatus": {"type": ["string", "null"]},
                },
            },
        },
        "contributionBreakdown": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "contributorId": {"type": ["string", "null"]},
                    "contributorType": {"enum": ["person", "team", "user_type", "system", "ai_agent", "workflow", "technology", "partner"]},
                    "role": {"type": ["string", "null"]},
                    "stageGateId": {"type": ["string", "null"]},
                    "contributionSummary": {"type": ["string", "null"]},
                    "costBasis": {"type": ["number", "null"]},
                    "roiAttribution": {"type": ["number", "null"]},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                },
            },
        },
        "governance": {
            "type": "object",
            "required": ["sensitivityLevel", "evidenceStatus"],
            "properties": {
                "sensitivityLevel": {"enum": ["public_safe", "internal", "restricted", "confidential", "quarantine"]},
                "evidenceStatus": {"enum": ["verified_current", "verified_historical", "methodology_disclosed", "vendor_directional", "practitioner_signal", "modeled_assumption", "unsupported", "deprecated"]},
                "retentionPolicy": {"type": ["string", "null"]},
                "approvalState": {"enum": ["not_required", "pending", "approved", "rejected"]},
            },
        },
        "agentAnalysis": {
            "type": "object",
            "properties": {
                "summary": {"type": ["string", "null"]},
                "anomalyFlags": {"type": "array", "items": {"type": "string"}},
                "rootCauseHypotheses": {"type": "array", "items": {"type": "string"}},
                "recommendedActions": {"type": "array", "items": {"type": "string"}},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "coverageScore": {"type": "number", "minimum": 0, "maximum": 1},
                "confidenceReconciliation": {
                    "type": "object",
                    "properties": {
                        "conflictingEvidence": {"type": "array", "items": {"type": "string"}},
                        "reconciledBy": {"type": ["string", "null"]},
                        "reviewStatus": {"enum": ["agent_resolved", "human_required", "human_resolved", "unresolved"]},
                        "resolutionSummary": {"type": ["string", "null"]},
                    },
                },
            },
        },
    },
}


def write_text_outputs():
    MD_PATH.write_text(product_definition, encoding="utf-8")
    TECH_MD_PATH.write_text(technical_blueprint, encoding="utf-8")
    AGENT_MD_PATH.write_text(agent_model, encoding="utf-8")
    SCHEMA_PATH.write_text(json.dumps(ledger_schema, indent=2), encoding="utf-8")


def build_pdf():
    story = []
    story.extend(
        [
            Spacer(1, 0.26 * inch),
            p("SALT BASIN NET WORKS | HANDOVEROS", "CoverKicker"),
            p("Interface Intelligence Operating Blueprint", "CoverTitle"),
            p(
                "Recommended product definition, transaction-lineage model, agent operating system, API surface, and branded output architecture for revenue, customer, and member lifecycle evidence.",
                "CoverSub",
            ),
            GoldRule(),
            Spacer(1, 0.18 * inch),
            KpiBand(
                [
                    ("681", "QTR scenario records reviewed"),
                    ("47", "control patterns in source workbook"),
                    ("3", "primary lifecycle tokens"),
                    ("13", "core agent roles"),
                    ("1", "interface evidence ledger"),
                ]
            ),
            Spacer(1, 0.28 * inch),
            callout(
                "Recommended Name",
                "HandoverOS Interface Intelligence Layer",
                GOLD,
            ),
            Spacer(1, 0.12 * inch),
            callout(
                "Definition",
                "A governed transaction-lineage layer that sits above client integrations, APIs, imports, exports, and system-to-system connectors. It turns every interface event into an agent-readable evidence record with values, transformations, waterfall steps, revenue/customer/member tokens, controls, confidence, contribution attribution, and recommended action.",
                TEAL,
            ),
            Spacer(1, 0.18 * inch),
            p("Prepared from Gmail connector analysis, attached Salt Basin design references, existing repo lineage code, and relevant Salt Basin Website thread context.", "SmallSB"),
        ]
    )
    story.append(PageBreak())

    story += [
        p("1. Product Doctrine", "H1SB"),
        p("Most revenue leakage and customer-friction issues are not created where they become visible. They are created upstream in a field, rule, approval, transform, stale source, missing handoff, missing token, or control gap that no one can see later.", "BodySB"),
        p("Interface Intelligence makes those hidden moments visible. It does not only ask whether data moved. It asks what changed, why it changed, which lifecycle object it affected, which downstream processes now depend on it, which control should have caught it, and whether the business can trust the result.", "BodySB"),
        callout("Product One-Liner", "HandoverOS Interface Intelligence traces every revenue, customer, and member lifecycle data transaction across systems, then uses Salt Basin agents to explain lineage, detect mismatches, identify hidden operational risk, reconcile contribution, and preserve reusable institutional memory.", GREEN),
        p("Strategic Fit", "H2SB"),
        bullets([
            "Evidence layer under HandoverOS Q2R diagnostics.",
            "Governed context layer for BestyStaff and future Salt Basin agents.",
            "High-value use case for the Salt Basin Contribution Intelligence API.",
            "Natural extension of the current repo's field-level lineage and snapshot capability.",
        ]),
        p("Public-Safe Boundary", "H2SB"),
        p("Public outputs can show maps, scorecards, governance checklists, lineage diagrams, capability taxonomies, and example schemas. They should not expose raw Gmail-derived materials, proprietary workbook internals, client/employer artifacts, private formulas, or full field taxonomies without approval.", "BodySB"),
    ]
    story.append(PageBreak())

    story += [
        p("2. Three Primary Token Model", "H1SB"),
        p("The product needs three linked primary tokens because revenue truth, customer truth, and member/entitlement truth travel together but are not the same thing.", "BodySB"),
        table(
            [
                ["Token", "Primary Question", "Lifecycle"],
                ["Revenue Lifecycle Token", "What commercial or financial object is this event changing, and where will it land downstream?", "Prospect -> Pipeline -> Proposal -> Contract -> Order -> Subscription -> Bill -> Invoice -> Collect -> Recognize -> Renew/Expand -> Adjust"],
                ["Customer Journey Token", "What customer-adjacent moment is this event changing, and what experience or retention consequence follows?", "External Lead -> Qualified Prospect -> Negotiation -> Signature -> Onboarding -> Active Customer -> Payment -> Support/Change -> Renewal/Expansion/Churn"],
                ["Member Journey Token", "Which organization, site, member, end user, covered population, or free-tier user is entitled, activated, supported, billed, renewed, or changed?", "Eligible Population -> Invited Member -> Entitled Member -> Activated User/Site -> Licensed Use -> Support/Utilization -> Expansion/Change -> Renewal/Termination"],
            ],
            [1.35 * inch, 1.75 * inch, 3.3 * inch],
        ),
        Spacer(1, 0.1 * inch),
        callout("Design Rule", "The tokens are linked but not collapsed. A payer can sign the contract while onboarding, fulfillment, utilization, support, and renewal happen at a child organization, related organization, site, provider group, employer population, plan member group, individual member, or end-user level.", PLUM),
        p("Canonical Entities", "H2SB"),
        table(
            [
                ["Domain", "Entities"],
                ["GTM", "Lead, Account, Contact, Opportunity, Quote, Proposal"],
                ["Commercial", "Contract, Performance Obligation, Order, Subscription, Product, Price, Discount, Approval"],
                ["Finance", "Invoice, Payment, Collection, Revenue Schedule, ARR, NRR, Adjustment"],
                ["Customer", "Onboarding, Entitlement, Usage, Case, Service Request, Change Request, Renewal, Churn"],
                ["Member", "Parent Org, Child Org, Site, Provider, Employer Group, Plan Member, Individual Member, End User, Free Tier"],
            ],
            [1.2 * inch, 5.2 * inch],
        ),
    ]
    story.append(PageBreak())

    story += [
        p("3. Token Chain Dimensional Model", "H1SB"),
        p("The expanded model links commercial promise, member entitlement, financial execution, and resource contribution into one chain that can be traced, scored, and remembered.", "BodySB"),
        table(
            [
                ["Layer", "What It Captures"],
                ["Deal Contribution Intelligence", "deal type, valuation size, investment type, industry vertical, actively seeking criteria match, board skills, sponsor priorities, value-creation thesis"],
                ["Contract Economics", "payer, bill-to, invoice destination, payment method, remittance method, annual recurrence, usage pricing, discounts, variable consideration, support terms, renewal notice"],
                ["Member Coverage", "parent organization, child organization, site, provider, employer population, plan member population, individual license, free tier, activation, utilization, support, churn/renewal status"],
                ["Stage Gate IO", "required inputs, outputs, approvals, blockers, decision owner, output artifacts, resource contributors, and technology contributors"],
                ["Resource Contribution", "human role, user type, team, system, AI agent, workflow, technology, cost basis, elapsed time, quality score, and ROI attribution"],
                ["Confidence", "input coverage, output coverage, transformation confidence, token match confidence, financial reconciliation confidence, and human/agent review status"],
            ],
            [1.55 * inch, 4.85 * inch],
        ),
        Spacer(1, 0.1 * inch),
        callout("Chain", "Deal Type -> Customer/Payer -> Contract Obligation -> Revenue Lifecycle Token -> Customer Journey Token -> Member Journey Token -> Stage Gate -> Interface Transaction -> Field Lineage -> Financial Transaction -> Contribution Event -> Confidence Reconciliation -> Memory Candidate.", GOLD),
    ]
    story.append(PageBreak())

    story += [
        p("4. Interface Evidence Ledger", "H1SB"),
        p("Every interface transaction should become a durable evidence record that a human or agent can query later. The ledger should support both real-time API capture and batch ingestion from exports, imports, ETL jobs, and historical files.", "BodySB"),
        table(
            [
                ["Area", "Captured Data"],
                ["Identity", "transaction id, correlation id, idempotency key, connector id, environment, tenant, timestamp"],
                ["Direction", "source system, target system, source object, target object, operation, trigger"],
                ["Payload", "raw payload reference, masked payload summary, before/after values, schema version"],
                ["Transformation", "rule id, mapping version, formula, enrichment source, fallback/default logic"],
                ["Waterfall", "ordered steps, duration, status, retry count, actor, system response"],
                ["Lifecycle", "revenue lifecycle token, customer journey token, member journey token, supporting agent tokens, stages, canonical entity ids"],
                ["Contract/Entitlement", "payer, bill-to, fulfill-to, covered organization/population, performance obligations, pricing, support, renewal, usage, payment, remittance, invoice destination"],
                ["Governance", "evidence status, control policy, sensitivity level, retention policy, approval state"],
                ["Agent Output", "summary, anomaly flags, root-cause hypothesis, contribution breakdown, confidence reconciliation, recommended action"],
            ],
            [1.35 * inch, 5.05 * inch],
        ),
        Spacer(1, 0.09 * inch),
        callout("Implementation Note", "The repo already has field_lineage and data_snapshots. Interface Intelligence should extend that foundation with transaction identity, connector identity, lifecycle tokens, control evidence, and agent analysis.", TEAL),
    ]
    story.append(PageBreak())

    story += [
        p("5. Data Model", "H1SB"),
        table(
            [
                ["Table", "Purpose"],
                ["interface_connectors", "Registered systems, provider, tenant, auth scope, environment, owner, and status."],
                ["interface_transactions", "One durable API call, webhook, import, export, sync job, or manual upload event."],
                ["interface_transaction_steps", "Ordered waterfall steps: extract, map, transform, validate, enrich, write, acknowledge, retry."],
                ["interface_field_lineage", "Field movement, prior value, transformed value, rule id, confidence, hash, and masking policy."],
                ["lineage_tokens", "Revenue Lifecycle, Customer Journey, Member Journey, and supporting agent-token records."],
                ["token_edges", "Relationships among lead, account, payer, employer, plan, site, member, user, quote, contract, order, subscription, invoice, payment, case, and change request."],
                ["member_identity_links", "Links payer, customer, parent org, child org, site, provider, employer group, plan, member, end user, and free-tier identity records."],
                ["member_entitlements", "Covered population, license type, eligibility, activation, utilization, support coverage, access tier, and renewal/change status."],
                ["token_stage_gates", "Required inputs, outputs, decisions, approvals, and evidence for each token stage gate."],
                ["contribution_events", "Human, user-type, team, system, AI agent, workflow, and technology contribution records."],
                ["confidence_reconciliations", "Conflicting evidence, coverage scores, confidence scores, review status, and final resolution."],
                ["interface_controls", "Required controls and policies by connector, object, lifecycle stage, or field class."],
                ["control_executions", "Evidence that a control ran, passed, failed, was skipped, or required human review."],
                ["agent_transaction_analyses", "Agent explanations, risks, root-cause hypotheses, confidence, and recommendations."],
                ["memory_candidates", "Reusable insight candidates awaiting classification and approval."],
                ["usage_meter_events", "Salt Basin metering event at the moment of billable capability consumption."],
            ],
            [1.65 * inch, 4.75 * inch],
        ),
    ]
    story.append(PageBreak())

    story += [
        p("6. API Surface", "H1SB"),
        p("The API should align with the existing Contribution Intelligence API architecture: versioned endpoints, metered billable capability calls, connector validation, client-managed model options, and durable usage events.", "BodySB"),
        table(
            [
                ["Endpoint", "Purpose", "Billable"],
                ["POST /api/v1/interface-intelligence/events", "Capture one transaction event.", "Conditional"],
                ["POST /api/v1/interface-intelligence/events/batch", "Capture batch imports, ETL jobs, or sync windows.", "Conditional"],
                ["GET /api/v1/interface-intelligence/transactions/:id", "Retrieve transaction forensic record.", "No"],
                ["GET /api/v1/interface-intelligence/tokens/:tokenId/graph", "Retrieve revenue, customer, member, and supporting-token graph.", "No or premium by depth"],
                ["POST /api/v1/interface-intelligence/analyze/transaction", "Run agent analysis on one transaction.", "Yes"],
                ["POST /api/v1/interface-intelligence/analyze/token", "Run cross-system analysis for a token.", "Yes"],
                ["POST /api/v1/interface-intelligence/connectors/validate", "Validate connector access, objects, scopes, and rate limits.", "Conditional"],
                ["POST /api/v1/pricing/estimate", "Estimate usage, volume, and advisory scope.", "No"],
            ],
            [2.35 * inch, 3.25 * inch, 0.8 * inch],
        ),
        Spacer(1, 0.1 * inch),
        callout("Security Rule", "Do not inherit client system security as Salt Basin's security model. Salt Basin needs tenant auth, scoped API keys or OAuth client credentials, RBAC, object-level authorization, audit logs, webhook signatures, rate limits, idempotency keys, encryption, retention controls, and sandbox/production separation.", PLUM),
    ]
    story.append(PageBreak())

    story += [
        p("7. Agent Operating Model", "H1SB"),
        p("Agent loop: Observe -> Classify -> Trace -> Explain -> Detect -> Recommend -> Remember.", "QuoteSB"),
        table(
            [
                ["Agent", "Job", "Max Volume Per Worker"],
                ["Interface Transaction Analyst", "Inspect API calls, imports, exports, and sync events for missing values, errors, drift, retries, and mismatches.", "250 transactions or 50 error clusters"],
                ["Integration Mapping Agent", "Map source/target objects, fields, transformations, dependencies, and failure points.", "150 fields, 20 objects, or 10 payloads"],
                ["Revenue Lifecycle Tracer", "Follow the Revenue Lifecycle Token across the commercial and financial lifecycle.", "100 tokens or 500 related events"],
                ["Customer Journey Tracer", "Follow the customer-adjacent token from lead through service, change, renewal, churn.", "100 tokens or 500 related events"],
                ["Member Journey Tracer", "Follow org members, child orgs, sites, individual members, end users, free-tier users, and entitlement coverage.", "100 tokens or 500 related events"],
                ["Contract Obligation Mapper", "Extract performance obligations, payer responsibility, billing triggers, renewal terms, support, discounts, usage, payment, and variable consideration.", "75 contracts or 250 clauses"],
                ["Financial Transaction Reconciler", "Trace payment, remittance, invoice, adjustment, collection, and revenue recognition events to the Revenue Lifecycle Token.", "250 financial events"],
                ["Contribution Intelligence Agent", "Attribute human, user-type, team, system, AI agent, workflow, and technology contributions to stage gates and outcomes.", "200 contribution events"],
                ["Confidence Reconciliation Agent", "Compare conflicting token evidence, score coverage/confidence, and route human review.", "150 conflicts or 500 scored fields"],
                ["Control Evidence Agent", "Check whether required controls ran, passed, failed, or require human review.", "50 controls or 250 executions"],
                ["Root Cause Pattern Agent", "Cluster recurring failures into leakage patterns, governance causes, and process defects.", "300 anomalies or 25 clusters"],
                ["Benchmark And Claims Guard", "Prevent stale, unsupported, or external claims from entering public/client outputs.", "100 claims"],
                ["Memory Steward", "Classify reusable memory candidates as public-safe, internal, restricted, confidential, or quarantine.", "50 sensitive or 250 low-risk"],
            ],
            [1.65 * inch, 3.55 * inch, 1.2 * inch],
        ),
    ]
    story.append(PageBreak())

    story += [
        p("8. Parallel Agent Sizing", "H1SB"),
        callout("Sizing Formula", "worker_count = ceiling(total_units / max_units_per_worker). functional_lead_count = ceiling(worker_count / 5). management_agent_count = ceiling(functional_lead_count / 3).", GOLD),
        table(
            [
                ["Size", "Practical Scope", "Suggested Agent Shape"],
                ["Small", "Up to 100 pages, 1k rows, 50 defects, or one process tower.", "1-2 workers, 0-1 lead, 1 manager/orchestrator"],
                ["Medium", "100-500 pages, 1k-25k rows, 50-300 defects, or 3-5 towers.", "3-6 workers, 1-2 leads, 1-2 managers"],
                ["Large", "500-2000 pages, 25k-250k rows, 300-1500 defects, or 5-10 towers.", "8-20 workers, 3-5 leads, 2-4 managers"],
                ["Portfolio", "Multiple companies or 2000+ pages, 250k+ rows, 1500+ defects.", "20-60 workers, 5-12 leads, 4-8 managers"],
            ],
            [1.0 * inch, 3.1 * inch, 2.3 * inch],
        ),
        Spacer(1, 0.1 * inch),
        p("Recommended default for first production client: one manager/orchestrator, one integration lead, one revenue lifecycle lead, one member journey tracer, two transaction analysts, one contract obligation mapper, one contribution intelligence agent, one control evidence agent, one memory steward, and one claims guard on call for any external-facing output.", "BodySB"),
    ]
    story.append(PageBreak())

    story += [
        p("9. Salt Basin Branded Outputs", "H1SB"),
        table(
            [
                ["Output", "Audience", "Purpose"],
                ["Executive Interface Intelligence Brief", "Sponsor, CFO, CRO, COO, CTO, PortOps", "Explain the hidden operating truth and recommended action."],
                ["Transaction Forensic Packet", "RevOps, IT, Finance Ops, Data", "Show what happened in a transaction, field by field and step by step."],
                ["Token Lineage Graph", "Product, RevOps, Finance, CS", "Trace revenue and customer truth across systems."],
                ["Member Entitlement Graph", "Product, CS, Finance, Healthcare/Market Ops", "Trace payer, parent org, child org, site, member, user, free-tier, and entitlement relationships."],
                ["Contract Obligation Matrix", "Legal, Finance, RevOps, Product", "Show obligations, billing triggers, payment responsibility, support terms, renewal terms, discounts, and variable consideration."],
                ["Contribution Chain Scorecard", "Sponsors, PortOps, Transformation Office", "Compare human and technology contribution cost basis, ROI, stage order, contributor combinations, and deal intelligence."],
                ["Control Evidence Matrix", "Finance, Audit, Security, Transformation Office", "Show controls run, gaps, skips, and review items."],
                ["Root Cause Heatmap", "Transformation leaders", "Prioritize recurring failure patterns by impact, frequency, and confidence."],
                ["Source Delta Card", "Research and product team", "Convert new evidence into model updates without overclaiming."],
                ["Memory Candidate Register", "Internal Salt Basin agents", "Preserve reusable insight under classification rules."],
            ],
            [1.85 * inch, 1.85 * inch, 2.7 * inch],
        ),
        Spacer(1, 0.1 * inch),
        callout("Design System Fit", "Use navy for authority, gold for executive emphasis, teal for data and AI, green for outcomes, plum for risk or strategic emphasis. Favor KPI tiles, outcome cards, metadata chips, lineage rivers, evidence matrices, and validation checklists.", TEAL),
    ]
    story.append(PageBreak())

    story += [
        p("10. Build Path", "H1SB"),
        table(
            [
                ["Phase", "Build"],
                ["Now", "Define schema, add transaction tables, capture API events, render forensic view, attach revenue/customer/member tokens."],
                ["Next", "Run agent analyses for transaction anomalies, token trace, member entitlement trace, contract obligation trace, contribution breakdown, and control evidence."],
                ["Then", "Add connector profiling, pricing estimate, usage metering, public-safe output templates, and client portal views."],
                ["Later", "Add continuous research refresh, benchmark diffing, source delta cards, and portfolio-level intelligence views."],
            ],
            [1.0 * inch, 5.4 * inch],
        ),
        p("Current Confidence", "H2SB"),
        table(
            [
                ["Area", "Confidence", "Reason"],
                ["Internal HandoverOS/QTR shape", "High", "Gmail connector research, workbook attachment reads, repo memory docs, and current lineage code converge."],
                ["Technical feasibility in repo", "High", "Existing field lineage and snapshots provide a base to extend."],
                ["External benchmark claims", "Medium until refreshed", "Active memory requires current authoritative refresh before public/client use."],
                ["Exact public naming", "Medium", "Recommended name is strong but can be refined with Betsy's positioning preference."],
            ],
            [1.85 * inch, 1.25 * inch, 3.3 * inch],
        ),
    ]

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.58 * inch,
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    write_text_outputs()
    build_pdf()
    print(f"Wrote {PDF_PATH}")
    print(f"Wrote {MD_PATH}")
    print(f"Wrote {TECH_MD_PATH}")
    print(f"Wrote {AGENT_MD_PATH}")
    print(f"Wrote {SCHEMA_PATH}")
