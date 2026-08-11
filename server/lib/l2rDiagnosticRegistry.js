// Lead-to-Revenue Definition Studio Registry (2026-08-09, Phase 1) — reuse-
// first classification for the whole build, audited via the
// salt-basin-channel-journey-architecture skill before landing:
//
//   REUSES EXISTING SUBSTRATE
//     - Diagnostic engagement / Future-State Definition   -> new rod_type
//       rows ('l2r_diagnostic', 'l2r_future_state', server/db.js).
//     - Value Creation Initiative                          -> the ALREADY-
//       RESERVED 'value_creation' rod_type (seeded inactive since before
//       this build; activated here for the first time — not a new id).
//     - Diagnostic -> Future-State / Diagnostic -> Value
//       Creation Initiative                                -> new
//       hierarchical TRIBUTARY_TYPES entries
//       (diagnostic_future_state_provisioning,
//       diagnostic_value_initiative_provisioning), tributaryRegistry.js.
//     - Future-State <-> Value Creation Initiative link     -> new peer
//       TRIBUTARY_TYPES entry (future_state_initiative_link).
//     - The 945-row L2R capability taxonomy (Level 4)       -> Atom
//       definitions in journey_metadata_molecules (molecule_kind=
//       'capability'). Level 3 sub-capabilities (189)      -> Cluster
//       definitions in journey_metadata_clusters (domain_key tags Level 2).
//       Level 2 domains (18)                                -> not a table;
//       expressed as the l2r_diagnostic_scope Current's port_stages.
//     - QTR reference library (root cause/impact/control/KPI/leakage
//       pattern/entity/handover pattern/AI validation/heuristic, 400 rows)
//       -> more journey_metadata_molecules rows, distinguished by
//       molecule_kind — one reused table, not eight new ones.
//     - QTR scenarios (681 records / 227 unique names)       -> journey_
//       scenarios + journey_gate_definitions (one gate per Detection/
//       Prevention/Escalation stage — QTR's own 3-stage shape IS
//       journey_gate_definitions.stage_key, the strongest reuse fit found).
//     - Observation capture (who submitted it, current-state input)
//       -> journey_rod_evidence via the EXISTING upsertJourneyEvidence()
//       in server/lib/journeyRods.js (actorKey = submitter role,
//       sourceType = user_input | agent_synthesis | data_extract_import).
//     - Per-capability maturity/leakage score                -> journey_
//       rod_settlement_states (already exists for exactly this shape).
//     - Quarterly QBR cadence                                -> journey_
//       current_definitions {cadenceModel:'touch_sequence'} + agent_
//       schedules (cadence='quarterly'), Phase 3.
//     - Config-generation approval gate (Phase 4)             -> journey_
//       rod_decisions (proposed_action/human_prompt/status already exists).
//
//   NEW TABLE, NOT NEEDED — none. Everything above maps onto existing
//   substrate plus additive columns (molecule_kind, domain_key,
//   l2r_stage_ref, and a generic metadata JSONB on journey_metadata_
//   molecules/_clusters/journey_scenarios/journey_gate_definitions, none of
//   which previously had a catch-all column).
//
//   AGENT BOUNDARY GAP — Phase 3's "agent deployment" gate (mirroring
//   DefinitionStudioJourney.jsx's 5-gate UX) will need a real agent_
//   definitions-backed run. agent_boundary_ref stays reserved/unenforced.
//
//   HONEST LIMITATION — TRIBUTARY_TYPES and the block REGISTRY are frozen JS
//   objects, not DB-backed tables. Phase 4's automation-config-generation
//   can fully automate anything that's a row (journey_rod_types/journey_
//   current_definitions/agent_definitions/additive config_state entries);
//   a genuinely new Tributary type or block type requires a code change and
//   must be surfaced as a flagged "requires a code change" journey_rod_
//   decision, never silently auto-applied.
//
// This file: the small, legitimately-frozen Benchmark/Source citation
// registers (55 rows total — well within "small enough to hardcode as
// governed config," same shape as opportunityPipelineRegistry.js's
// SOURCE_TIERS/EXPANSION_RINGS) plus read-only lookup helpers over the bulk
// seed data in server/data/l2rCapabilityHierarchySeed.js. No persistence
// logic lives here beyond plain SELECTs — writes go through journeyRods.js.
import { db } from '../db.js';
import { L2R_DOMAINS } from '../data/l2rCapabilityHierarchySeed.js';

export const BENCHMARK_REGISTER = Object.freeze({
  "BCG-RA-001": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "Consulting article / survey",
    "sourceUrl": "https://www.bcg.com/capabilities/pricing-revenue-management/achieving-rapid-topline-growth-with-revenue-assurance",
    "finding": "Revenue assurance can contribute as much as 10% to a company’s total revenue without the need to sell additional products or services.",
    "quantifiedValue": "Up to 10% of total revenue",
    "metricType": "Revenue recovery potential",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "verificationStatus": "Verified 2020+; newer BCG revenue assurance replacement not found in current search",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Upside recovery potential for leakage cases",
    "scenarioDomains": "Revenue Leakage; Contract-to-Bill; Usage Billing; PE Value Creation",
    "useCaveat": "Use as upside case, not guaranteed base case."
  },
  "BCG-RA-002": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "Consulting article / survey",
    "sourceUrl": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "finding": "Revenue assurance programs typically generate financial returns within the first one to three months.",
    "quantifiedValue": "1-3 months",
    "metricType": "Payback period",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "verificationStatus": "Verified 2020+; needs periodic refresh",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Time-to-value benchmark",
    "scenarioDomains": "Revenue Leakage; Billing; Finance Automation",
    "useCaveat": "Directional only."
  },
  "BCG-RA-003": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "International survey",
    "sourceUrl": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "finding": "In an international survey of 2,000+ business leaders, 45% said revenue leakage is systemic.",
    "quantifiedValue": "45%",
    "metricType": "Market prevalence",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+; needs periodic refresh",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Market problem evidence",
    "scenarioDomains": "Revenue Leakage; Human Behavior; Reporting Handoffs",
    "useCaveat": "2020 source; keep searching for newer survey updates."
  },
  "BCG-RA-004": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "International survey",
    "sourceUrl": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "finding": "Almost three-quarters of companies do not have automated revenue assurance processes.",
    "quantifiedValue": "~73%",
    "metricType": "Automation maturity gap",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+; needs periodic refresh",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Automation gap for AI validation / controls",
    "scenarioDomains": "Revenue Leakage; AI Validation; Finance Automation",
    "useCaveat": "Broad market indicator."
  },
  "BCG-RA-005": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "International survey",
    "sourceUrl": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "finding": "64% of companies lack standardized revenue assurance tools as part of enterprise data systems.",
    "quantifiedValue": "64%",
    "metricType": "Tooling maturity gap",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+; needs periodic refresh",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Standardization gap for repository thesis",
    "scenarioDomains": "Systems; Revenue Leakage; AI Data Readiness",
    "useCaveat": "Broad market indicator."
  },
  "BCG-RA-006": {
    "publicationDate": "2020-07-23",
    "sourceOrganization": "BCG",
    "sourceTitle": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "International survey",
    "sourceUrl": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "finding": "59% of companies lack full-time staff dedicated to revenue assurance.",
    "quantifiedValue": "59%",
    "metricType": "Operating model maturity gap",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+; needs periodic refresh",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Ownership and knowledge concentration evidence",
    "scenarioDomains": "Human Behavior; Governance; Revenue Leakage",
    "useCaveat": "Broad market indicator."
  },
  "BCG-VL-001": {
    "publicationDate": "2025-09-29",
    "sourceOrganization": "BCG",
    "sourceTitle": "Cost of Inattention: How Boards Can Stop Value Leakage",
    "sourceType": "Consulting article",
    "sourceUrl": "https://www.bcg.com/publications/2025/cost-inattention-how-boards-can-stop-value-leakage",
    "finding": "Internal factors can erode 10% to 20% of anticipated gains before external market factors.",
    "quantifiedValue": "10%-20% of anticipated gains",
    "metricType": "Value leakage / benefits erosion",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "PE value creation and transformation value protection",
    "scenarioDomains": "PE Value Creation; Transformation; Board Distortion",
    "useCaveat": "Broader value leakage, not Q2R-specific."
  },
  "MGI-RL-001": {
    "publicationDate": "2025-12-19",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Revenue Leakage Series Part 1: From Hidden Risk to Asymmetric Opportunity",
    "sourceType": "Research note",
    "sourceUrl": "https://mgiresearch.com/research/revenue-leakage-series-part-1-from-hidden-risk-to-asymmetric-opportunity/",
    "finding": "MGI frames revenue leakage as a problem representing at least 3% to 5% of every company’s revenue.",
    "quantifiedValue": "3%-5% of revenue",
    "metricType": "Revenue risk potential",
    "sourceQualityTier": "Tier 2 - Research firm",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Base leakage sensitivity assumption",
    "scenarioDomains": "Revenue Leakage; Billing; Contract-to-Bill",
    "useCaveat": "Use directionally; validate with company data."
  },
  "MGI-RL-002": {
    "publicationDate": "2025-12-19",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Revenue Leakage Series Part 2: Why Does Revenue Leakage Happen?",
    "sourceType": "Research note",
    "sourceUrl": "https://mgiresearch.com/research/revenue-leakage-series-part-2-why-does-revenue-leakage-happen/",
    "finding": "MGI describes revenue leakage as a pervasive control deficiency and material misstatement risk if it exceeds materiality thresholds.",
    "quantifiedValue": "3%-5% revenue framing; materiality references",
    "metricType": "Risk framing",
    "sourceQualityTier": "Tier 2 - Research firm",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Restatement/SOX risk framing",
    "scenarioDomains": "Revenue Leakage; RevRec; SOX; IPO Readiness",
    "useCaveat": "Accounting/legal interpretation should be validated by auditors/counsel."
  },
  "MGI-RL-003": {
    "publicationDate": "2025-12-19",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Revenue Leakage Series Part 3: The Geography and Mechanics of Revenue Leakage",
    "sourceType": "Research note",
    "sourceUrl": "https://mgiresearch.com/research/revenue-leakage-series-part-3-the-geography-and-mechanics-of-revenue-leakage/",
    "finding": "MGI breaks down where ASC 606 revenue leakage occurs and how verticals classify/recognize revenue.",
    "quantifiedValue": "Qualitative ASC 606 leakage mechanics",
    "metricType": "Leakage taxonomy",
    "sourceQualityTier": "Tier 2 - Research firm",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "RevRec and leakage scenario taxonomy",
    "scenarioDomains": "Revenue Leakage; RevRec; Usage Billing",
    "useCaveat": "Qualitative, not a statistical benchmark."
  },
  "MGI-RL-004": {
    "publicationDate": "2025-12-19",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Revenue Leakage Series Part 4: The Real Impact of Revenue Leakage",
    "sourceType": "Research note",
    "sourceUrl": "https://mgiresearch.com/research/revenue-leakage-series-part-4-the-real-impact-of-revenue-leakage/",
    "finding": "Billing leakage and contract asset growth can reduce operating cash flow as a percentage of net income.",
    "quantifiedValue": "Qualitative cash conversion impact",
    "metricType": "Cash flow risk",
    "sourceQualityTier": "Tier 2 - Research firm",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Cash flow / working capital impact",
    "scenarioDomains": "Billing; Usage Billing; PE Value Creation",
    "useCaveat": "Qualitative scenario support."
  },
  "MGI-RL-005": {
    "publicationDate": "2025-12-19",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Revenue Leakage Series Part 5: From Revenue Leakage to Monetization Excellence",
    "sourceType": "Research note",
    "sourceUrl": "https://mgiresearch.com/research/revenue-leakage-series-part-5-from-revenue-leakage-to-monetization-excellence/",
    "finding": "Revenue leakage is positioned as a monetization architecture problem, especially as industries move to outcome-based models.",
    "quantifiedValue": "Qualitative monetization maturity gap",
    "metricType": "Monetization architecture",
    "sourceQualityTier": "Tier 2 - Research firm",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Monetization / architecture thesis",
    "scenarioDomains": "Usage Billing; Pricing; AI Monetization",
    "useCaveat": "Qualitative scenario support."
  },
  "MGI-CPQ-001": {
    "publicationDate": "2025",
    "sourceOrganization": "MGI Research",
    "sourceTitle": "Return of the Tech IPO? + Smarter Services CPQ",
    "sourceType": "Research newsletter / buyer guide preview",
    "sourceUrl": "https://mgiresearch.com/the-margin/return-of-the-tech-ipo-smarter-services-cpq/",
    "finding": "MGI states nearly 40% of first-time Services CPQ implementations fail, often due to vendor fit or underestimated complexity.",
    "quantifiedValue": "Nearly 40%",
    "metricType": "Implementation failure risk",
    "sourceQualityTier": "Tier 3 - Research preview",
    "verificationStatus": "Partially verified; full guide should be obtained",
    "lastChecked": "2026-06-03",
    "repositoryUse": "CPQ transformation risk benchmark",
    "scenarioDomains": "CPQ; Services Quoting; Transformation Scars",
    "useCaveat": "Use directionally until full report is obtained."
  },
  "KPMG-IPO-001": {
    "publicationDate": "2025-05",
    "sourceOrganization": "KPMG",
    "sourceTitle": "2024 IPO Material Weakness Study",
    "sourceType": "Audit firm study based on filings",
    "sourceUrl": "https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/2025/ipo-material-weakness-study.pdf",
    "finding": "Of 122 traditional IPOs closing in 2023, 54 noted material weaknesses in initial registration filings.",
    "quantifiedValue": "54 of 122 / 44%",
    "metricType": "IPO material weakness prevalence",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "IPO readiness risk benchmark",
    "scenarioDomains": "IPO Readiness; Reporting; Controls",
    "useCaveat": "Traditional IPOs only."
  },
  "KPMG-IPO-002": {
    "publicationDate": "2025-05",
    "sourceOrganization": "KPMG",
    "sourceTitle": "2024 IPO Material Weakness Study",
    "sourceType": "Audit firm study based on filings",
    "sourceUrl": "https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/2025/ipo-material-weakness-study.pdf",
    "finding": "Of 122 traditional IPOs closing in 2023, 51 noted material weaknesses in subsequent 10-K/10-Q filings.",
    "quantifiedValue": "51 of 122 / 42%",
    "metricType": "Post-IPO material weakness prevalence",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Post-IPO readiness benchmark",
    "scenarioDomains": "IPO Readiness; SOX; Reporting",
    "useCaveat": "Traditional IPOs only."
  },
  "KPMG-IPO-003": {
    "publicationDate": "2025-05",
    "sourceOrganization": "KPMG",
    "sourceTitle": "2024 IPO Material Weakness Study",
    "sourceType": "Audit firm study based on filings",
    "sourceUrl": "https://kpmg.com/us/en/articles/2025/2024-ipo-material-weakness-study.html",
    "finding": "Root causes included lack of accounting resources/expertise, control design/lack of control, formal policies/procedures, systems/technology/ITGC, and segregation of duties.",
    "quantifiedValue": "68%; 42%; 34%; 42%; 32%",
    "metricType": "Material weakness root-cause distribution",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Root-cause library mapping",
    "scenarioDomains": "IPO Readiness; Human Behavior; Systems; Controls",
    "useCaveat": "Categories overlap and do not sum to 100%."
  },
  "KPMG-NONIPO-001": {
    "publicationDate": "2024-12-31",
    "sourceOrganization": "KPMG",
    "sourceTitle": "Trends in Material Weaknesses for Non-IPO Companies",
    "sourceType": "Audit firm study",
    "sourceUrl": "https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/2025/trends-material-weaknesses-non-ipo-companies.pdf",
    "finding": "Study analyzed annual filings released by SEC-registered public companies for FY2024 and summarized material weakness themes/process areas.",
    "quantifiedValue": "FY2024 filing population",
    "metricType": "Public company material weakness dataset",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Public-company control risk benchmark",
    "scenarioDomains": "Public Company Controls; SOX; Reporting",
    "useCaveat": "Use PDF for exact process/root-cause percentages."
  },
  "PWC-IPO-001": {
    "publicationDate": "2025",
    "sourceOrganization": "PwC",
    "sourceTitle": "Material Weakness Disclosures in an IPO",
    "sourceType": "Audit firm analysis",
    "sourceUrl": "https://www.pwc.com/us/en/services/consulting/deals/library/ipo-material-weakness.html",
    "finding": "PwC states an average of 46% of companies disclosed at least one material weakness while going public; 2024 rate cited at 43% for industrial products page segment.",
    "quantifiedValue": "46% average; 43% 2024 IP segment",
    "metricType": "IPO material weakness prevalence",
    "sourceQualityTier": "Tier 1/2 - Filing-based analysis",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Corroborates IPO readiness risk",
    "scenarioDomains": "IPO Readiness; SOX; Controls",
    "useCaveat": "Exact source page segments vary by industry view."
  },
  "PCAOB-REST-001": {
    "publicationDate": "2025-10",
    "sourceOrganization": "PCAOB",
    "sourceTitle": "Data Points: Financial Restatements and Auditor Turnover",
    "sourceType": "Regulator / audit oversight analysis",
    "sourceUrl": "https://pcaobus.org/resources/staff-publications/data-points/data-points--financial-restatements-and-auditor-turnover",
    "finding": "Big R restatements occurred at a rate of around 3% per year from 2005–2024.",
    "quantifiedValue": "~3% per year",
    "metricType": "Restatement prevalence",
    "sourceQualityTier": "Tier 1 - Regulator",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Restatement risk benchmark",
    "scenarioDomains": "Restatements; Audit Risk; Public Company Reporting",
    "useCaveat": "Big R only; not all revisions/restatements."
  },
  "PCAOB-REST-002": {
    "publicationDate": "2025-10",
    "sourceOrganization": "PCAOB",
    "sourceTitle": "Data Points: Financial Restatements and Auditor Turnover",
    "sourceType": "Regulator / audit oversight analysis",
    "sourceUrl": "https://pcaobus.org/resources/staff-publications/data-points/data-points--financial-restatements-and-auditor-turnover",
    "finding": "29% of Big R restatements followed an auditor change in the prior year vs 11% broader auditor-change rate.",
    "quantifiedValue": "29% vs 11%",
    "metricType": "Restatement / auditor turnover relationship",
    "sourceQualityTier": "Tier 1 - Regulator",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Audit disruption risk benchmark",
    "scenarioDomains": "Restatements; Audit Risk; Controls",
    "useCaveat": "Correlation, not causation."
  },
  "BCG-AI-001": {
    "publicationDate": "2026-01-15",
    "sourceOrganization": "BCG",
    "sourceTitle": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "sourceUrl": "https://www.bcg.com/publications/2026/as-ai-investments-surge-ceos-take-the-lead",
    "finding": "Corporations expect to double AI spending in 2026 from 0.8% to about 1.7% of revenues.",
    "quantifiedValue": "0.8% to 1.7% of revenue",
    "metricType": "AI investment intensity",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified current",
    "lastChecked": "2026-06-03",
    "repositoryUse": "AI readiness and budget pressure",
    "scenarioDomains": "AI Validation; Data Readiness; CFO AI",
    "useCaveat": "Investment appetite does not equal operational readiness."
  },
  "BCG-AI-002": {
    "publicationDate": "2026-01-15",
    "sourceOrganization": "BCG",
    "sourceTitle": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "sourceUrl": "https://www.bcg.com/press/15january2026-as-ai-investments-surge-ceos-take-lead",
    "finding": "94% of companies plan to continue investing in AI even if it does not drive immediate returns.",
    "quantifiedValue": "94%",
    "metricType": "AI investment persistence",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified current",
    "lastChecked": "2026-06-03",
    "repositoryUse": "AI governance and validation demand signal",
    "scenarioDomains": "AI Validation; Executive Decision Distortion",
    "useCaveat": "Use to show AI budget pressure and validation need."
  },
  "BCG-AI-003": {
    "publicationDate": "2026-01-15",
    "sourceOrganization": "BCG",
    "sourceTitle": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "sourceUrl": "https://web-assets.bcg.com/73/8e/cc44cbc14a3b81695f8a3de28ff1/ai-radar-2026-web-jan-2026-edit.pdf",
    "finding": "72% of CEOs say they are the main decision maker on AI; 50% believe their job depends on getting AI right; 90% believe AI agents will enable measurable ROI this year.",
    "quantifiedValue": "72%; 50%; 90%",
    "metricType": "AI executive ownership / ROI expectation",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified current",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Executive AI ownership and pressure",
    "scenarioDomains": "AI Validation; Executive Decision Distortion",
    "useCaveat": "Survey expectations should be separated from realized outcomes."
  },
  "MCK-AI-001": {
    "publicationDate": "2025-11-05",
    "sourceOrganization": "McKinsey",
    "sourceTitle": "The State of AI in 2025: Agents, Innovation, and Transformation",
    "sourceType": "Global survey",
    "sourceUrl": "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    "finding": "88% report regular AI use in at least one business function, but approximately one-third report scaling AI programs.",
    "quantifiedValue": "88%; approximately one-third scaling",
    "metricType": "AI adoption/scaling maturity",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "AI adoption vs value scaling gap",
    "scenarioDomains": "AI Validation; Workflow Design; Data Readiness",
    "useCaveat": "Not Q2R-specific."
  },
  "MCK-AI-002": {
    "publicationDate": "2025-11-05",
    "sourceOrganization": "McKinsey",
    "sourceTitle": "The State of AI in 2025: Agents, Innovation, and Transformation",
    "sourceType": "Global survey",
    "sourceUrl": "https://www.mckinsey.com/~/media/mckinsey/business%20functions/quantumblack/our%20insights/the%20state%20of%20ai/november%202025/the-state-of-ai-2025-agents-innovation_cmyk-v1.pdf",
    "finding": "23% of respondents report scaling agentic AI, while 39% are experimenting with AI agents.",
    "quantifiedValue": "23%; 39%",
    "metricType": "Agentic AI adoption maturity",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Agentic AI maturity and control roadmap",
    "scenarioDomains": "AI Validation; Agentic Workflows",
    "useCaveat": "Use to justify agent controls."
  },
  "MCK-AI-003": {
    "publicationDate": "2025-11-05",
    "sourceOrganization": "McKinsey",
    "sourceTitle": "The State of AI in 2025: Agents, Innovation, and Transformation",
    "sourceType": "Global survey",
    "sourceUrl": "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    "finding": "39% report enterprise-level EBIT impact from AI.",
    "quantifiedValue": "39%",
    "metricType": "Enterprise financial impact",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "AI value realization gap",
    "scenarioDomains": "AI Validation; CFO AI; ROI Tracking",
    "useCaveat": "Financial impact definition varies by respondent."
  },
  "MCK-TRUST-001": {
    "publicationDate": "2026-03-25",
    "sourceOrganization": "McKinsey",
    "sourceTitle": "State of AI Trust in 2026: Shifting to the Agentic Era",
    "sourceType": "AI trust / risk survey",
    "sourceUrl": "https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/tech-forward/state-of-ai-trust-in-2026-shifting-to-the-agentic-era",
    "finding": "Inaccuracy and cybersecurity are highly relevant AI risks.",
    "quantifiedValue": "74% inaccuracy; 72% cybersecurity",
    "metricType": "AI risk relevance",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "verificationStatus": "Verified current",
    "lastChecked": "2026-06-03",
    "repositoryUse": "AI risk register and validation controls",
    "scenarioDomains": "AI Validation; Cybersecurity; Agentic AI",
    "useCaveat": "Use for AI risk taxonomy."
  },
  "KEYBANC-SaaS-001": {
    "publicationDate": "2025-11-13",
    "sourceOrganization": "KeyBanc Capital Markets / Sapphire Ventures",
    "sourceTitle": "2025 Private SaaS Company Survey",
    "sourceType": "Industry survey",
    "sourceUrl": "https://investor.key.com/press-releases/news-details/2025/PRIVATE-SAAS-COMPANY-SURVEY-REVEALS-AI-DRIVEN-TRANSFORMATION-AND-SUSTAINED-OPERATIONAL-EXCELLENCE/default.aspx",
    "finding": "YoY ARR growth expected to accelerate from 15% in 2024 to 20% in 2025; gross retention expected to approach 90%; net retention remained above 100%.",
    "quantifiedValue": "15% to 20% ARR growth; GRR ~90%; NRR >100%",
    "metricType": "SaaS growth/retention benchmark",
    "sourceQualityTier": "Tier 2 - Industry survey",
    "verificationStatus": "Verified 2020+",
    "lastChecked": "2026-06-03",
    "repositoryUse": "ARR/NRR reporting context",
    "scenarioDomains": "SaaS Metrics; Reporting; Board Distortion",
    "useCaveat": "Survey sample and segment should be reviewed for applicability."
  },
  "SAAS-CAP-001": {
    "publicationDate": "2025-09-18",
    "sourceOrganization": "SaaS Capital",
    "sourceTitle": "What is a Good Retention Rate for a Private SaaS Company?",
    "sourceType": "Industry benchmark article",
    "sourceUrl": "https://www.saas-capital.com/blog-posts/what-is-a-good-retention-rate-for-a-private-saas-company/",
    "finding": "2025 median NRR and GRR are shown by ACV bands.",
    "quantifiedValue": "ACV-band-specific NRR/GRR",
    "metricType": "SaaS retention benchmark",
    "sourceQualityTier": "Tier 2 - Industry benchmark",
    "verificationStatus": "Source identified; values need extraction from chart",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Retention metric dictionary and ARR/NRR distortion context",
    "scenarioDomains": "SaaS Metrics; Reporting",
    "useCaveat": "Needs extraction from source chart."
  },
  "APQC-O2C-001": {
    "publicationDate": "Current page / date not listed",
    "sourceOrganization": "APQC",
    "sourceTitle": "Total cost to perform the order-to-cash processes per $1,000 revenue",
    "sourceType": "Benchmark metric definition",
    "sourceUrl": "https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/total-cost-perform-order-cash",
    "finding": "APQC defines total cost per $1,000 revenue to perform order-to-cash processes.",
    "quantifiedValue": "Metric definition",
    "metricType": "O2C cost benchmark definition",
    "sourceQualityTier": "Tier 1 - Benchmark body",
    "verificationStatus": "Source identified; publication date not listed",
    "lastChecked": "2026-06-03",
    "repositoryUse": "O2C process-cost metric definition",
    "scenarioDomains": "Billing; Collections; O2C",
    "useCaveat": "Exact benchmark percentiles may require APQC access."
  },
  "APQC-INV-001": {
    "publicationDate": "Current page / date not listed",
    "sourceOrganization": "APQC",
    "sourceTitle": "Percentage of invoices processed error free the first time",
    "sourceType": "Benchmark metric definition",
    "sourceUrl": "https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/percentage-invoices-processed-error",
    "finding": "APQC defines first-time error-free invoice processing as finalized with no follow-up effort for adjustments or corrections.",
    "quantifiedValue": "Metric definition",
    "metricType": "Invoice quality definition",
    "sourceQualityTier": "Tier 1 - Benchmark body",
    "verificationStatus": "Source identified; publication date not listed",
    "lastChecked": "2026-06-03",
    "repositoryUse": "Invoice quality KPI definition",
    "scenarioDomains": "Billing; Revenue Leakage; Customer Escalation",
    "useCaveat": "Exact percentiles may require APQC access."
  }
});

export const SOURCE_REGISTER = Object.freeze({
  "SRC-0001": {
    "publicationDate": "2020-07-23",
    "organization": "BCG",
    "title": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "Consulting article / survey",
    "url": "https://www.bcg.com/capabilities/pricing-revenue-management/achieving-rapid-topline-growth-with-revenue-assurance",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "includedBenchmarkIds": "BCG-RA-001",
    "refreshCadence": "Semi-annual",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0002": {
    "publicationDate": "2020-07-23",
    "organization": "BCG",
    "title": "Achieving Rapid Topline Growth with Revenue Assurance",
    "sourceType": "Consulting article / survey",
    "url": "https://web-assets.bcg.com/37/de/22e7339f4cf99e36a30e75be1cd6/bcg-achieving-rapid-topline-growth-with-revenue-assurance-july-2020.pdf",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "includedBenchmarkIds": "BCG-RA-002; BCG-RA-003; BCG-RA-004; BCG-RA-005; BCG-RA-006",
    "refreshCadence": "Semi-annual",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0003": {
    "publicationDate": "2025-09-29",
    "organization": "BCG",
    "title": "Cost of Inattention: How Boards Can Stop Value Leakage",
    "sourceType": "Consulting article",
    "url": "https://www.bcg.com/publications/2025/cost-inattention-how-boards-can-stop-value-leakage",
    "sourceQualityTier": "Tier 2 - Consulting benchmark",
    "includedBenchmarkIds": "BCG-VL-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0004": {
    "publicationDate": "2025-12-19",
    "organization": "MGI Research",
    "title": "Revenue Leakage Series Part 1: From Hidden Risk to Asymmetric Opportunity",
    "sourceType": "Research note",
    "url": "https://mgiresearch.com/research/revenue-leakage-series-part-1-from-hidden-risk-to-asymmetric-opportunity/",
    "sourceQualityTier": "Tier 2 - Research firm",
    "includedBenchmarkIds": "MGI-RL-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0005": {
    "publicationDate": "2025-12-19",
    "organization": "MGI Research",
    "title": "Revenue Leakage Series Part 2: Why Does Revenue Leakage Happen?",
    "sourceType": "Research note",
    "url": "https://mgiresearch.com/research/revenue-leakage-series-part-2-why-does-revenue-leakage-happen/",
    "sourceQualityTier": "Tier 2 - Research firm",
    "includedBenchmarkIds": "MGI-RL-002",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0006": {
    "publicationDate": "2025-12-19",
    "organization": "MGI Research",
    "title": "Revenue Leakage Series Part 3: The Geography and Mechanics of Revenue Leakage",
    "sourceType": "Research note",
    "url": "https://mgiresearch.com/research/revenue-leakage-series-part-3-the-geography-and-mechanics-of-revenue-leakage/",
    "sourceQualityTier": "Tier 2 - Research firm",
    "includedBenchmarkIds": "MGI-RL-003",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0007": {
    "publicationDate": "2025-12-19",
    "organization": "MGI Research",
    "title": "Revenue Leakage Series Part 4: The Real Impact of Revenue Leakage",
    "sourceType": "Research note",
    "url": "https://mgiresearch.com/research/revenue-leakage-series-part-4-the-real-impact-of-revenue-leakage/",
    "sourceQualityTier": "Tier 2 - Research firm",
    "includedBenchmarkIds": "MGI-RL-004",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0008": {
    "publicationDate": "2025-12-19",
    "organization": "MGI Research",
    "title": "Revenue Leakage Series Part 5: From Revenue Leakage to Monetization Excellence",
    "sourceType": "Research note",
    "url": "https://mgiresearch.com/research/revenue-leakage-series-part-5-from-revenue-leakage-to-monetization-excellence/",
    "sourceQualityTier": "Tier 2 - Research firm",
    "includedBenchmarkIds": "MGI-RL-005",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0009": {
    "publicationDate": "2025",
    "organization": "MGI Research",
    "title": "Return of the Tech IPO? + Smarter Services CPQ",
    "sourceType": "Research newsletter / buyer guide preview",
    "url": "https://mgiresearch.com/the-margin/return-of-the-tech-ipo-smarter-services-cpq/",
    "sourceQualityTier": "Tier 3 - Research preview",
    "includedBenchmarkIds": "MGI-CPQ-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0010": {
    "publicationDate": "2025-05",
    "organization": "KPMG",
    "title": "2024 IPO Material Weakness Study",
    "sourceType": "Audit firm study based on filings",
    "url": "https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/2025/ipo-material-weakness-study.pdf",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "includedBenchmarkIds": "KPMG-IPO-001; KPMG-IPO-002",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0011": {
    "publicationDate": "2025-05",
    "organization": "KPMG",
    "title": "2024 IPO Material Weakness Study",
    "sourceType": "Audit firm study based on filings",
    "url": "https://kpmg.com/us/en/articles/2025/2024-ipo-material-weakness-study.html",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "includedBenchmarkIds": "KPMG-IPO-003",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0012": {
    "publicationDate": "2024-12-31",
    "organization": "KPMG",
    "title": "Trends in Material Weaknesses for Non-IPO Companies",
    "sourceType": "Audit firm study",
    "url": "https://kpmg.com/kpmg-us/content/dam/kpmg/pdf/2025/trends-material-weaknesses-non-ipo-companies.pdf",
    "sourceQualityTier": "Tier 1/2 - Filing-based study",
    "includedBenchmarkIds": "KPMG-NONIPO-001",
    "refreshCadence": "Semi-annual",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0013": {
    "publicationDate": "2025",
    "organization": "PwC",
    "title": "Material Weakness Disclosures in an IPO",
    "sourceType": "Audit firm analysis",
    "url": "https://www.pwc.com/us/en/services/consulting/deals/library/ipo-material-weakness.html",
    "sourceQualityTier": "Tier 1/2 - Filing-based analysis",
    "includedBenchmarkIds": "PWC-IPO-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0014": {
    "publicationDate": "2025-10",
    "organization": "PCAOB",
    "title": "Data Points: Financial Restatements and Auditor Turnover",
    "sourceType": "Regulator / audit oversight analysis",
    "url": "https://pcaobus.org/resources/staff-publications/data-points/data-points--financial-restatements-and-auditor-turnover",
    "sourceQualityTier": "Tier 1 - Regulator",
    "includedBenchmarkIds": "PCAOB-REST-001; PCAOB-REST-002",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0015": {
    "publicationDate": "2026-01-15",
    "organization": "BCG",
    "title": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "url": "https://www.bcg.com/publications/2026/as-ai-investments-surge-ceos-take-the-lead",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "BCG-AI-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0016": {
    "publicationDate": "2026-01-15",
    "organization": "BCG",
    "title": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "url": "https://www.bcg.com/press/15january2026-as-ai-investments-surge-ceos-take-lead",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "BCG-AI-002",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0017": {
    "publicationDate": "2026-01-15",
    "organization": "BCG",
    "title": "As AI Investments Surge, CEOs Take the Lead",
    "sourceType": "Consulting survey / AI Radar 2026",
    "url": "https://web-assets.bcg.com/73/8e/cc44cbc14a3b81695f8a3de28ff1/ai-radar-2026-web-jan-2026-edit.pdf",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "BCG-AI-003",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0018": {
    "publicationDate": "2025-11-05",
    "organization": "McKinsey",
    "title": "The State of AI in 2025: Agents, Innovation, and Transformation",
    "sourceType": "Global survey",
    "url": "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "MCK-AI-001; MCK-AI-003",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0019": {
    "publicationDate": "2025-11-05",
    "organization": "McKinsey",
    "title": "The State of AI in 2025: Agents, Innovation, and Transformation",
    "sourceType": "Global survey",
    "url": "https://www.mckinsey.com/~/media/mckinsey/business%20functions/quantumblack/our%20insights/the%20state%20of%20ai/november%202025/the-state-of-ai-2025-agents-innovation_cmyk-v1.pdf",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "MCK-AI-002",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0020": {
    "publicationDate": "2026-03-25",
    "organization": "McKinsey",
    "title": "State of AI Trust in 2026: Shifting to the Agentic Era",
    "sourceType": "AI trust / risk survey",
    "url": "https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/tech-forward/state-of-ai-trust-in-2026-shifting-to-the-agentic-era",
    "sourceQualityTier": "Tier 2 - Consulting survey",
    "includedBenchmarkIds": "MCK-TRUST-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0021": {
    "publicationDate": "2025-11-13",
    "organization": "KeyBanc Capital Markets / Sapphire Ventures",
    "title": "2025 Private SaaS Company Survey",
    "sourceType": "Industry survey",
    "url": "https://investor.key.com/press-releases/news-details/2025/PRIVATE-SAAS-COMPANY-SURVEY-REVEALS-AI-DRIVEN-TRANSFORMATION-AND-SUSTAINED-OPERATIONAL-EXCELLENCE/default.aspx",
    "sourceQualityTier": "Tier 2 - Industry survey",
    "includedBenchmarkIds": "KEYBANC-SaaS-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0022": {
    "publicationDate": "2025-09-18",
    "organization": "SaaS Capital",
    "title": "What is a Good Retention Rate for a Private SaaS Company?",
    "sourceType": "Industry benchmark article",
    "url": "https://www.saas-capital.com/blog-posts/what-is-a-good-retention-rate-for-a-private-saas-company/",
    "sourceQualityTier": "Tier 2 - Industry benchmark",
    "includedBenchmarkIds": "SAAS-CAP-001",
    "refreshCadence": "Quarterly",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0023": {
    "publicationDate": "Current page / date not listed",
    "organization": "APQC",
    "title": "Total cost to perform the order-to-cash processes per $1,000 revenue",
    "sourceType": "Benchmark metric definition",
    "url": "https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/total-cost-perform-order-cash",
    "sourceQualityTier": "Tier 1 - Benchmark body",
    "includedBenchmarkIds": "APQC-O2C-001",
    "refreshCadence": "Semi-annual",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  },
  "SRC-0024": {
    "publicationDate": "Current page / date not listed",
    "organization": "APQC",
    "title": "Percentage of invoices processed error free the first time",
    "sourceType": "Benchmark metric definition",
    "url": "https://www.apqc.org/what-we-do/benchmarking/open-standards-benchmarking/measures/percentage-invoices-processed-error",
    "sourceQualityTier": "Tier 1 - Benchmark body",
    "includedBenchmarkIds": "APQC-INV-001",
    "refreshCadence": "Semi-annual",
    "lastChecked": "2026-06-03",
    "notes": "2020+ active source"
  }
});

// ── Read-only lookup helpers over the seeded Atoms/Clusters/Scenarios ──
// (writes — recording an observation, advancing a rod — go through
// server/lib/journeyRods.js's upsertJourneyEvidence()/evaluateJourneyRod(),
// never through this file.)

/** The 18 Level-2 capability domains in source order, as seeded onto the l2r_diagnostic_scope Current's port_stages. */
export function listDomains() {
  return L2R_DOMAINS;
}

/** One capability Atom (Level 4) by its LTR-XXXX molecule_key. */
export async function getCapabilityAtom(ltrId) {
  return db.prepare(`SELECT * FROM journey_metadata_molecules WHERE molecule_key=$1 AND molecule_kind='capability'`).get(ltrId);
}

/** Every Level-3 sub-capability cluster under a given Level-2 domain_key, with its Level-4 capability Atoms attached. */
export async function listCapabilitiesForDomain(domainKey) {
  const clusters = await db.prepare(`SELECT * FROM journey_metadata_clusters WHERE domain_key=$1 ORDER BY cluster_key`).all(domainKey);
  const out = [];
  for (const cluster of clusters) {
    const atoms = await db.prepare(`
      SELECT m.* FROM journey_metadata_molecules m
      JOIN journey_atom_affinity_rules r ON r.molecule_key = m.molecule_key
      WHERE r.cluster_key=$1 AND m.molecule_kind='capability'
      ORDER BY m.molecule_key
    `).all(cluster.cluster_key);
    out.push({ cluster, capabilities: atoms });
  }
  return out;
}

/** A QTR reference Atom (root cause, impact, control, KPI, ...) by its own id (RC-/IMP-/CTL-/KPI-/... prefix). */
export async function getReferenceAtom(referenceId) {
  return db.prepare(`SELECT * FROM journey_metadata_molecules WHERE molecule_key=$1 AND molecule_kind IS NOT NULL AND molecule_kind != 'capability'`).get(referenceId);
}

/** A QTR scenario (by scenario_key) with its ordered Detection/Prevention/Escalation gates and their linked reference Atoms resolved. */
export async function getScenarioGates(scenarioKey) {
  const scenario = await db.prepare(`SELECT * FROM journey_scenarios WHERE scenario_key=$1`).get(scenarioKey);
  if (!scenario) return null;
  const gates = await db.prepare(`SELECT * FROM journey_gate_definitions WHERE scenario_id=$1 ORDER BY sort_order`).all(scenario.id);
  return { scenario, gates };
}

/** Every scenario in a given QTR system-domain (CRM, CPQ, CLM, Billing, ...) — read from journey_scenarios.metadata.domain, not the L2R capability domain_key (a related but distinct axis; see this file's header). */
export async function listScenariosByQtrDomain(qtrDomain) {
  return db.prepare(`SELECT * FROM journey_scenarios WHERE metadata->>'domain' = $1 ORDER BY scenario_key`).all(qtrDomain);
}
