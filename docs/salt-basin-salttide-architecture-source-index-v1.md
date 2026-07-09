# Salt Basin + SaltTide Architecture Source Index v1

Last updated: 2026-07-09

This index records the architecture sources used to produce the first Salt Basin + SaltTide agent design-input definition pack. It is intended to keep future agent runs source-aware, version-aware, and honest about what has and has not been incorporated.

## Latest Source Set Considered

### Salt Basin Repository Sources

- `docs/interface-intelligence-product-definition-v2.md`
  - Current product definition for HandoverOS Interface Intelligence and tokenized interface lineage.
- `docs/interface-intelligence-technical-blueprint-v1.md`
  - Current event contract, ledger objects, and token schema direction for interface transactions.
- `docs/interface-intelligence-agent-operating-model-v1.md`
  - Agent loop definitions for ingestion, mapping, transformation, reconciliation, and output production.
- `docs/interface-intelligence-ledger-schema-v1.json`
  - Structured schema basis for lineage ledger and token event capture.
- `docs/salt-basin-agent-api-pricing-architecture-spec.md`
  - Usage-based API and agent-call pricing architecture for bringing external clients onto Salt Basin intelligence services.
- `docs/active-universal-salt-basin-agent-memory-register.md`
  - Active memory register for reusable Salt Basin agent context.
- `docs/research-runs/handover-intelligence-refresh-2026-07-09.md`
  - July 9 research refresh for usage billing, revenue recognition, payments, fraud, compliance, and data quality control themes.
- `src/data/platformLifecycleConfig.js`
  - Current PLM lifecycle stage, gate, methodology, contribution, readiness, and progress model.
- `server/data/leadToRevenueModel.js`
  - Current lead-to-revenue and GTM lifecycle model used by Salt Basin platform architecture.
- `server/data/contributionMethodology.js`
  - Contribution Intelligence methodology, contribution-rate categories, cost ledger logic, and ROI loops.

### SaltTide Architecture Sources

- `C:\Users\mbets\SaltTide\SaltTide_Core_Learnings_and_Infrastructure_Dependencies_v1.md`
  - Core architectural lessons, infrastructure dependencies, agreement lineage moat, PostgreSQL-first system of record, and deterministic routing guidance.
- `C:\Users\mbets\SaltTide\SaltTide_Complete_Data_Schema_and_Outcome_Measurement_v1.md`
  - SaltTide object model, outcome measurement logic, routing objects, agreement lineage, savings equations, and impact attribution layers.
- `C:\Users\mbets\SaltTide\SaltTide_Delivery_Operating_Model_and_Agent_Loops_v1.md`
  - Delivery operating model, core operating objects, daily/weekly loops, completion scoring, budget burn, and ROI measurement.
- `C:\Users\mbets\SaltTide\SaltTide_Functional_Requirements_Spec_v4.md`
  - Current functional requirements baseline for SaltTide.
- `C:\Users\mbets\SaltTide\SaltTide_Routing_Decision_Waterfall_v1.md`
  - Deterministic routing waterfall and decision structure.

### Recent Project Threads Considered

- Build data lineage agent
  - Current conversation defining revenue lifecycle, customer journey, member journey, contribution, and confidence tokens.
- Create reusable agent skills
  - Handover Intelligence research refresh, reusable agent routine, and universal memory register.
- Design usage-based API pricing
  - Salt Basin Contribution Intelligence API packaging, bring-your-own-model posture, and usage event model.
- Create project management spec
  - SaltTide project management model, EIDOS hierarchy, object completion gates, and hybrid completion score.
- Merge lifecycle tool
  - Operating Model Merge Dashboard, lifecycle progress, methodology scores, contribution intelligence, gate gaps, and need for explicit OpenAI/Codex contribution provider typing.
- Merge HERQ and Salt Basin unified architecture
  - Unified platform direction across configurable CMS, member network, profiles, NRM/CRM, PLM, Contribution Intelligence, global standards, and output generators.

### Added Process Design Context

- `C:\Users\mbets\.codex\attachments\513e53c1-420a-4e7e-9db0-722d4839cdfd\pasted-text.txt`
  - Process Design Documentation hierarchy defining L0-L7 enterprise process ontology, L1 journey tokens, L2 scenarios, L3 flows, L4 gates, metadata chips, Product Definition Data Rod, pricing version lineage, billing/performance obligation separation, commercial milestones, and DataBasin Data Bridge migration posture.

## Design Conclusions Captured

- The canonical unit should be a reusable design input package, not a one-off document prompt.
- Every agent output should trace to source artifacts, object definitions, field definitions, mapping rules, transformation rules, token stage gates, confidence rules, and contribution events.
- The model needs three primary parallel journey tokens:
  - Revenue Lifecycle Token
  - Customer Journey Token
  - Member Journey Token
- The model also needs supporting tokens:
  - Contract Obligation Token
  - Financial Transaction Token
  - Resource Contribution Token
  - Confidence Reconciliation Token
- Salesforce legacy mapping should be the first adoption path because it can bridge existing GTM and revenue data into proposal, reporting, executive, investment, quarterly, financial, reconciliation, and risk outputs.
- SaltTide's deterministic routing and outcome measurement patterns should influence Salt Basin reconciliation, confidence scoring, and public-use disclosure gates.
- Salt Basin PLM should govern readiness: an input is not simply drafted or done; it has source, methodology, lifecycle, contribution, budget, and confidence dimensions.
- Human, AI, source, standards, and technology contribution should be captured as first-class events so downstream ROI analysis can separate human cost, AI/tool contribution, and platform reuse value.
- The business definition product surface should be an editable scenario workbench, not a static BPM diagram: users accept/reject scenario candidates, inherit L1 stages into L2 scenarios, edit L3/L4 flow behavior, attach metadata chips, author business rules, map data elements, and generate a Business Definition and Business Rule Design Spec.
- Product Definition should become its own journey/data rod. Products define allowable pricing, billing, contract, performance obligation, recognition, renewal, and migration behavior; contracts select from that allowed configuration space.
- DataBasin should act as a bridge/reservoir during transition: ingest and normalize historical data, support agentic workflow and write-back to existing systems, preserve new transactional/master data during migration, and produce reconciliation confidence and disclosure outputs.

## Explicit Gaps

- This pass did not connect to a live Salesforce org or inspect live field metadata.
- This pass did not re-scrape Gmail. It uses the latest available local docs and relevant recent project thread context available in this workspace/session.
- This pass did not implement runtime agent orchestration inside the app.
- This pass did not implement the interactive scenario workbench UI inside the app.
- This pass did not generate PDF/Canva-style branded outputs; it produced the structured design-input foundation that those outputs should consume.
- Public benchmark, financial, payment, and compliance references should continue to be refreshed before external publication or client-facing claims.

## Produced Definition Pack

- `docs/salt-basin-salttide-agent-design-input-definitions-v1.md`
- `docs/salt-basin-salttide-design-input-schema-v1.json`
- `docs/salt-basin-salttide-mapping-template-catalog-v1.md`
- `docs/salesforce-legacy-field-inventory-template.csv`
- `docs/salt-basin-salttide-design-input-example-salesforce-proposal-v1.json`
- `docs/salt-basin-business-definition-tool-product-spec-v1.md`
- `docs/salt-basin-business-definition-ontology-schema-v1.json`
- `docs/salt-basin-business-definition-scenario-starter-catalog-v1.md`
- `docs/business-definition-l2-scenario-intake-template.csv`
- `docs/salt-basin-business-definition-example-parent-pricing-v1.json`

## Recommended Next Build Order

1. Create a Salesforce metadata extraction routine that fills the field inventory template from object metadata, sample usage, automation dependencies, and downstream dependencies.
2. Add a local design-input package builder that converts field inventory rows into the JSON schema.
3. Add a first internal agent run for proposal output generation from Salesforce opportunity, account, quote, contract, product, and order data.
4. Add reconciliation confidence scoring across pipeline amount, quote amount, contract value, order amount, invoice amount, cash collected, and recognized revenue.
5. Add branded Salt Basin output generators for executive brief, proposal output, Snowball reporting analysis, and reconciliation disclosure.
6. Add reusable mapping-template versioning and approval gates to the PLM dashboard.
7. Build a Business Definition Workbench for L0-L7 ontology editing, L2 scenario selection, L3/L4 flow mapping, metadata chip authoring, business rule design, system-of-record mapping, DataBasin target mapping, and spec generation.
