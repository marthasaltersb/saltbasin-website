from pathlib import Path
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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


OUT_DIR = Path("output/pdf")
MD_DIR = Path("output")
OUT_DIR.mkdir(parents=True, exist_ok=True)
MD_DIR.mkdir(parents=True, exist_ok=True)

PDF_PATH = OUT_DIR / "Salt_Basin_Interface_Intelligence_Definition_Pack_v1.pdf"
MD_PATH = MD_DIR / "Salt_Basin_Interface_Intelligence_Definition_Pack_v1.md"

NAVY = colors.HexColor("#172A45")
MIDNIGHT = colors.HexColor("#0F1B2D")
GOLD = colors.HexColor("#C4843A")
SHELL = colors.HexColor("#F7F2E8")
MIST = colors.HexColor("#EEF2F6")
SLATE = colors.HexColor("#536173")
TEAL = colors.HexColor("#4A7C8E")
GREEN = colors.HexColor("#2D5A27")
GRAPHITE = colors.HexColor("#252A31")
FOG = colors.HexColor("#6D7785")
WHITE = colors.white


class GoldRule(Flowable):
    def __init__(self, width=6.6 * inch, height=8, color=GOLD):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(1.1)
        self.canv.line(0, self.height / 2, self.width, self.height / 2)


class KpiBand(Flowable):
    def __init__(self, items):
        super().__init__()
        self.items = items
        self.width = 6.6 * inch
        self.height = 1.05 * inch

    def draw(self):
        card_w = self.width / len(self.items) - 6
        x = 0
        for metric, label in self.items:
            self.canv.setFillColor(WHITE)
            self.canv.setStrokeColor(colors.HexColor("#D7DBE2"))
            self.canv.roundRect(x, 0, card_w, self.height, 7, stroke=1, fill=1)
            self.canv.setFillColor(NAVY)
            self.canv.setFont("Helvetica-Bold", 18)
            self.canv.drawCentredString(x + card_w / 2, 0.58 * inch, metric)
            self.canv.setFillColor(SLATE)
            self.canv.setFont("Helvetica-Bold", 6.8)
            lines = wrap(label.upper(), 18)
            for idx, line in enumerate(lines[:2]):
                self.canv.drawCentredString(x + card_w / 2, 0.34 * inch - idx * 9, line)
            x += card_w + 6


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverKicker",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=GOLD,
        alignment=TA_CENTER,
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=32,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11.5,
        leading=16,
        textColor=GRAPHITE,
        alignment=TA_CENTER,
        spaceAfter=20,
    )
)
styles.add(
    ParagraphStyle(
        name="H1SB",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2SB",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySB",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.4,
        leading=13,
        textColor=GRAPHITE,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallSB",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.6,
        leading=10,
        textColor=SLATE,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="LabelSB",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=GOLD,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="TableCellSB",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.4,
        leading=9.2,
        textColor=GRAPHITE,
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHeaderSB",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.4,
        leading=9.2,
        textColor=WHITE,
        spaceAfter=0,
    )
)


def p(text, style="BodySB"):
    return Paragraph(text, styles[style])


def bullets(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=10) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=6,
    )


def table(data, widths, header=True):
    wrapped = []
    for row_index, row in enumerate(data):
        wrapped_row = []
        for value in row:
            if isinstance(value, Flowable):
                wrapped_row.append(value)
            else:
                style = "TableHeaderSB" if header and row_index == 0 else "TableCellSB"
                wrapped_row.append(Paragraph(str(value), styles[style]))
        wrapped.append(wrapped_row)
    tbl = Table(wrapped, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.6),
        ("LEADING", (0, 0), (-1, -1), 9.6),
        ("TEXTCOLOR", (0, 0), (-1, -1), GRAPHITE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7DBE2")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    for row in range(1, len(data)):
        if row % 2 == 0:
            style.append(("BACKGROUND", (0, row), (-1, row), colors.HexColor("#F8FAFC")))
    tbl.setStyle(TableStyle(style))
    return tbl


def callout(title, body, accent=TEAL):
    data = [[p(title, "LabelSB"), p(body, "BodySB")]]
    tbl = Table(data, colWidths=[1.45 * inch, 4.95 * inch], hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), MIST),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D7DBE2")),
                ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return tbl


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D7DBE2"))
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 0.52 * inch, letter[0] - doc.rightMargin, 0.52 * inch)
    canvas.setFont("Helvetica", 7.4)
    canvas.setFillColor(FOG)
    canvas.drawString(doc.leftMargin, 0.35 * inch, "Salt Basin Net Works | Interface Intelligence Definition Pack v1")
    canvas.drawRightString(letter[0] - doc.rightMargin, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


story = []
story += [
    Spacer(1, 0.45 * inch),
    p("SALT BASIN NET WORKS", "CoverKicker"),
    p("Interface Intelligence Definition Pack", "CoverTitle"),
    p(
        "A recommended product definition for an agentic transaction lineage layer across every client integration, API call, and system-to-system handoff in the revenue and customer lifecycle.",
        "CoverSub",
    ),
    KpiBand(
        [
            ("681", "QTR scenario records"),
            ("47", "controls"),
            ("20", "AI validation tests"),
            ("2", "lineage tokens"),
            ("1", "interface ledger"),
        ]
    ),
    Spacer(1, 0.25 * inch),
    callout(
        "Recommended name",
        "<b>HandoverOS Interface Intelligence Layer</b> - the observable transaction ledger and agent analysis system that turns invisible cross-system movement into explainable operational truth.",
        GOLD,
    ),
    Spacer(1, 0.18 * inch),
    callout(
        "Definition",
        "Every interface transaction becomes a source-traced event with field values, transformations, waterfall steps, validation results, lifecycle tokens, customer-journey tokens, evidence status, and agent-readable lineage.",
        TEAL,
    ),
    Spacer(1, 0.2 * inch),
    p(
        "Prepared July 2026 from Gmail connector analysis, HandoverOS/QTR workbook evidence, Salt Basin agent memory files, current website lineage code, and attached Salt Basin visual design standards.",
        "SmallSB",
    ),
    PageBreak(),
]

story += [
    p("1. Executive Definition", "H1SB"),
    GoldRule(),
    p(
        "The product should be defined as an agentic interface intelligence layer, not a generic integration monitor. Its job is to capture the factual movement of data between systems, preserve the transformation logic, and make the business meaning of every handoff explainable.",
    ),
    callout(
        "Product thesis",
        "Most revenue leakage and customer-friction issues are not created at the point where they become visible. They are created upstream in a field, rule, approval, transform, missing token, stale source, or handoff that no one can see later.",
        GREEN,
    ),
    p("Recommended one-line definition", "H2SB"),
    p(
        "<b>HandoverOS Interface Intelligence</b> traces every revenue and customer lifecycle data transaction across systems, then uses agents to explain lineage, detect mismatches, identify hidden operational risk, and create reusable institutional memory.",
    ),
    p("What this product is", "H2SB"),
    bullets(
        [
            "A transaction ledger for every interface, API call, integration job, webhook, batch file, connector, and system-to-system handoff.",
            "A field-level lineage model that stores source values, transformed values, validation steps, business rules, and downstream object links.",
            "An agent analysis layer that can answer why a value changed, where a mismatch started, what controls failed, and which lifecycle outcome is at risk.",
            "A governance layer that separates verified facts, modeled assumptions, stale benchmarks, proprietary context, and public-safe summaries.",
        ]
    ),
    p("What this product is not", "H2SB"),
    bullets(
        [
            "Not only logging. Logging says what happened technically; interface intelligence explains operational meaning.",
            "Not only data lineage. Classic lineage traces tables and fields; this traces revenue promises, customer state, controls, exceptions, and evidence.",
            "Not only an AI copilot. The agent is useful because the ledger gives it durable, governed context.",
        ]
    ),
]

story += [
    PageBreak(),
    p("2. Token Model", "H1SB"),
    GoldRule(),
    p(
        "The design should use two persistent tokens that travel across systems and attach to every transaction where possible. These tokens are the product's organizing spine.",
    ),
    table(
        [
            ["Token", "Purpose", "Lifecycle"],
            [
                "Revenue Lifecycle Token",
                "Traces the commercial object as it becomes a financial obligation and revenue stream.",
                "prospect -> pipeline -> proposal -> contract -> order -> subscription -> bill -> invoice -> collect -> recognize -> renew/expand -> adjust",
            ],
            [
                "Customer Journey Token",
                "Traces the adjacent customer/account/person experience through acquisition, onboarding, payment, service, and change.",
                "external lead -> qualified prospect -> negotiation -> signature -> onboarding -> active customer -> payment -> support/change -> renewal/expansion/churn",
            ],
        ],
        [1.55 * inch, 2.2 * inch, 2.65 * inch],
    ),
    Spacer(1, 0.1 * inch),
    callout(
        "Why both tokens matter",
        "The revenue token answers 'what happened to the money, obligation, and measurement.' The customer token answers 'what happened to the relationship, experience, and promise.' Many failures only become clear when both are viewed together.",
        TEAL,
    ),
    p("Primary questions the tokens should answer", "H2SB"),
    bullets(
        [
            "Where did this ARR, invoice amount, term date, discount, tax treatment, entitlement, or renewal value originate?",
            "Which interface or transformation changed it?",
            "Did the contract, order, billing, recognition, and customer-success records preserve the same business promise?",
            "Which customer-facing event was adjacent to the financial error: onboarding, usage, dispute, service request, change request, renewal, or cancellation?",
            "Is the mismatch an isolated defect, a recurring handoff pattern, or a governance/control weakness?",
        ]
    ),
]

story += [
    PageBreak(),
    p("3. Transaction Ledger Schema", "H1SB"),
    GoldRule(),
    p(
        "The ledger should be event-first. Every connector reports a normalized transaction event, even when the underlying systems use different object names, payload shapes, or lifecycle labels.",
    ),
    table(
        [
            ["Schema area", "Recommended fields"],
            ["Identity", "transaction_id, correlation_id, source_event_id, idempotency_key, tenant_id, profile_scope, profile_id"],
            ["Systems", "interface_id, connector_id, source_system, target_system, environment, api_endpoint, job_name"],
            ["Objects", "source_object, source_record_id, target_object, target_record_id, parent_record_id, external_reference_ids"],
            ["Tokens", "revenue_lifecycle_token, customer_journey_token, account_token, contract_token, subscription_token"],
            ["Payloads", "payload_before_hash, payload_after_hash, redacted_payload_sample, changed_field_count"],
            ["Field lineage", "field_path, source_value, transformed_value, target_value, transform_rule, confidence, required_flag"],
            ["Waterfall", "step_number, step_name, actor_type, validation_result, control_result, error_code, retry_count"],
            ["Business context", "lifecycle_stage, customer_stage, revenue_model, contract_type, billing_model, process_area"],
            ["Evidence and governance", "source_refs, sensitivity, approval_status, benchmark_status, assumption_flag, retention_policy"],
            ["Agent analysis", "risk_score, anomaly_type, root_cause_hypothesis, recommended_action, human_review_required"],
        ],
        [1.55 * inch, 4.85 * inch],
    ),
    Spacer(1, 0.1 * inch),
    callout(
        "MVP rule",
        "Start with hashes, diffs, mappings, and IDs. Do not require storing every raw payload forever. Preserve enough evidence to replay the lineage and enough redaction to make the layer safe.",
        GOLD,
    ),
]

story += [
    PageBreak(),
    p("4. Agent Analysis Loop", "H1SB"),
    GoldRule(),
    p(
        "The agent layer should be a controlled reasoning loop over the ledger. It should use Salt Basin's universal reasoning pattern: observe, question assumptions, map relationships, validate evidence, quantify uncertainty, create visibility, design governance, and produce reusable systems.",
    ),
    table(
        [
            ["Loop step", "What the agent does", "Output"],
            ["Observe", "Reads transaction, field diffs, step sequence, linked records, and source trace.", "Transaction brief"],
            ["Classify", "Maps event to lifecycle stage, customer stage, failure family, control type, and risk area.", "Classification tags"],
            ["Trace", "Walks upstream and downstream through tokens and correlation IDs.", "Lineage path"],
            ["Explain", "Separates facts, assumptions, interpretations, and likely root causes.", "Explainability summary"],
            ["Detect", "Compares against QTR scenarios, controls, KPIs, and recurring leakage patterns.", "Risk/anomaly finding"],
            ["Recommend", "Suggests validation, remediation, owner, control, or next evidence request.", "Action packet"],
            ["Remember", "Stores approved reusable pattern without exposing raw sensitive data.", "Memory candidate"],
        ],
        [1.1 * inch, 3.55 * inch, 1.75 * inch],
    ),
    p("Core specialist agents", "H2SB"),
    bullets(
        [
            "Interface Transaction Analyst: summarizes one event and its field-level changes.",
            "Revenue Lifecycle Tracer: follows the token from pipeline through proposal, contract, order, billing, recognition, renewal, and adjustment.",
            "Customer Journey Tracer: follows lead, onboarding, support, change, payment, and renewal context.",
            "Control Evidence Agent: checks whether required controls, validations, and approvals occurred.",
            "Root Cause Pattern Agent: maps failures to QTR scenario families and recurring handoff patterns.",
            "Benchmark and Claims Guard: blocks stale or unsupported external figures from public/client-facing use.",
            "Memory Steward: classifies new insight as public-safe, internal, restricted, confidential, or quarantine.",
        ]
    ),
]

story += [
    PageBreak(),
    p("5. Parallel Agent Sizing", "H1SB"),
    GoldRule(),
    p(
        "The product should not send every transaction to one giant agent. It should profile the workload, shard it by stable boundaries, run duplicate workers in parallel, and roll findings up through leads and managers.",
    ),
    table(
        [
            ["Workload", "Example volume", "Recommended pool"],
            ["Small", "Up to 1,000 transactions, 150 fields, or one process tower", "1-2 workers, optional lead, 1 orchestrator"],
            ["Medium", "1,000-25,000 transactions, 3-5 process towers, or 10 integrations", "3-6 workers, 1-2 leads, 1 manager"],
            ["Large", "25,000-250,000 transactions, 5-10 towers, or many systems", "8-20 workers, 3-5 leads, 2-4 managers"],
            ["Portfolio", "250,000+ transactions, multiple companies, or fund-level review", "20-60 workers, 5-12 leads, 4-8 managers"],
        ],
        [1.05 * inch, 2.5 * inch, 2.85 * inch],
    ),
    Spacer(1, 0.1 * inch),
    table(
        [
            ["Agent type", "Recommended max per worker run", "Best shard unit"],
            ["Interface Transaction Analyst", "250 transactions or 50 error clusters", "Interface, endpoint, batch, object pair"],
            ["Integration Data Mapper", "150 fields, 20 objects, or 10 sample payloads", "System pair or object family"],
            ["Revenue Lifecycle Tracer", "100 lifecycle tokens or 500 related events", "Lifecycle token, customer segment, product line"],
            ["Customer Journey Tracer", "100 journey tokens or 40 account histories", "Account, customer stage, journey phase"],
            ["Control Evidence Agent", "50 controls or 250 control executions", "Control family, lifecycle stage"],
            ["Root Cause Pattern Agent", "300 defects/events or 25 anomaly clusters", "Failure family, release, process area"],
            ["Memory Steward", "50 sensitive candidates or 250 low-risk candidates", "Sensitivity class, product domain"],
        ],
        [1.65 * inch, 2.35 * inch, 2.4 * inch],
    ),
    p("Sizing formula", "H2SB"),
    callout(
        "Formula",
        "worker_count = ceiling(total_units / max_units_per_worker). functional_lead_count = ceiling(worker_count / 5). management_agent_count = ceiling(functional_lead_count / 3). Add one Evidence Controller for external, legal, financial, investor, or audit-sensitive work.",
        GREEN,
    ),
]

story += [
    PageBreak(),
    p("6. MVP Build Path", "H1SB"),
    GoldRule(),
    table(
        [
            ["Phase", "Build", "Why it matters"],
            ["MVP 1", "interface_transactions, interface_steps, interface_field_lineage, lineage_tokens tables plus ingestion API", "Creates durable operational truth before advanced AI."],
            ["MVP 2", "Admin Lineage view for searching by customer, deal, quote, contract, subscription, invoice, or token", "Makes debugging valuable immediately."],
            ["MVP 3", "Agent summarize/explain endpoints for transaction, token, and lifecycle views", "Turns ledger data into usable answers."],
            ["MVP 4", "Connector adapters for Salesforce/CPQ/CLM/billing/ERP style events", "Moves from demo to client-facing diagnostic."],
            ["MVP 5", "Memory approval queue and public-safe preview generator", "Protects proprietary methods and creates reusable product intelligence."],
        ],
        [0.9 * inch, 3.1 * inch, 2.4 * inch],
    ),
    p("Recommended current-repo fit", "H2SB"),
    bullets(
        [
            "Extend the existing field_lineage and data_snapshots model rather than replacing it.",
            "Reuse the admin Lineage panel pattern but add transaction, token, and journey views.",
            "Map the product to the existing Lead to Revenue Capability Model and HandoverOS/QTR memory files.",
            "Keep raw Gmail-derived and workbook-derived knowledge behind approval gates.",
        ]
    ),
]

story += [
    PageBreak(),
    p("7. Source Context and Confidence", "H1SB"),
    GoldRule(),
    table(
        [
            ["Source", "What it contributed", "Confidence"],
            ["Gmail connector live search/read", "Confirmed HandoverOS/QTR attachments, outreach context, career portfolio source cluster, and QTR workbook structure.", "High for source existence; medium for public claims."],
            ["QTR V5 workbook attachment", "681 scenarios, 47 controls, 18 KPIs, 20 revenue leakage patterns, 20 AI validation tests, relationship mapping.", "High for internal product shape."],
            ["HandoverOS attachment extraction docs", "Contract metadata foundation, QTR lifecycle steps, billing/recognition separation, governance rules.", "High for internal definition."],
            ["Salt Basin memory register", "Guardrails for email-derived memory, benchmarks, assumptions, overclaiming, public previews.", "High for agent behavior."],
            ["Current repo lineage code", "Existing field-level lineage capture, snapshots, hashes, and admin API foundation.", "High for implementation fit."],
            ["Visual design system PDFs/PNG", "Premium executive design tokens: navy/gold palette, KPI tiles, cards, metadata chips, icon meanings.", "High for output styling."],
        ],
        [1.55 * inch, 3.45 * inch, 1.4 * inch],
    ),
    Spacer(1, 0.1 * inch),
    callout(
        "Guardrail",
        "Benchmark values, market statistics, regulatory interpretations, monetary ROI claims, and external-source claims should be refreshed from current authoritative sources before public, client-facing, investor-facing, or decision-support use.",
        GOLD,
    ),
]


markdown = """# Salt Basin Interface Intelligence Definition Pack v1

## Recommended Definition

HandoverOS Interface Intelligence traces every revenue and customer lifecycle data transaction across systems, then uses agents to explain lineage, detect mismatches, identify hidden operational risk, and create reusable institutional memory.

## Product Thesis

Most revenue leakage and customer-friction issues are not created at the point where they become visible. They are created upstream in a field, rule, approval, transform, missing token, stale source, or handoff that no one can see later.

## Core Tokens

| Token | Lifecycle |
|---|---|
| Revenue Lifecycle Token | prospect -> pipeline -> proposal -> contract -> order -> subscription -> bill -> invoice -> collect -> recognize -> renew/expand -> adjust |
| Customer Journey Token | external lead -> qualified prospect -> negotiation -> signature -> onboarding -> active customer -> payment -> support/change -> renewal/expansion/churn |

## Core Ledger Tables

- interface_transactions
- interface_steps
- interface_field_lineage
- lineage_tokens
- token_relationships
- agent_transaction_analyses
- memory_candidates

## Core Agent Pool

- Interface Transaction Analyst
- Revenue Lifecycle Tracer
- Customer Journey Tracer
- Control Evidence Agent
- Root Cause Pattern Agent
- Benchmark and Claims Guard
- Memory Steward

## Sizing Formula

worker_count = ceiling(total_units / max_units_per_worker)

functional_lead_count = ceiling(worker_count / 5)

management_agent_count = ceiling(functional_lead_count / 3)

## Confidence Note

High confidence for the internal HandoverOS/QTR product shape because Gmail connector research, workbook attachment reads, repo memory documents, and current lineage code converge. Medium confidence for external benchmark or monetary claims until refreshed against current authoritative sources.
"""

MD_PATH.write_text(markdown, encoding="utf-8")

doc = SimpleDocTemplate(
    str(PDF_PATH),
    pagesize=letter,
    leftMargin=0.72 * inch,
    rightMargin=0.72 * inch,
    topMargin=0.72 * inch,
    bottomMargin=0.72 * inch,
)
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(PDF_PATH)
print(MD_PATH)
