// Contribution Intelligence Methodology
// © 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · All rights reserved
//
// Master Enterprise Solution Best Bets™ — the practitioner's best perspectives on how to master
// your organization's measurements to produce returns on paper that exist, and are defensible.
//
// Contribution Intelligence Methodology is a core IP artifact under Master Enterprise Solution Best Bets™.
// Practitioner-derived, AI-augmented, practitioner-signed.
// "Where the practitioner meets AI augmentation to go from practitioner-derived,
//  AI augmented, to AI-derived, practitioner signed." — Betsy Salter, 2026
//
// This methodology was developed collaboratively between Martha Elizabeth Salter (Betsy Salter)
// and Claude (Anthropic). The framework, rate benchmarks, activity taxonomy, and oversight model
// are original intellectual property of Martha Elizabeth Salter aka Betsy Salter. AI was the
// structuring and execution tool; the practitioner is the author and authority.
//
// ── 2026-07-07 retroactive correction ────────────────────────────────────────
// The original "35.4 active hours / 3,880 turns / 7 files" figure below (June 2026) was an
// early-derivation estimate. On 2026-07-07 it was re-run as an actual JSONL burst analysis
// across all 11 session transcripts on file for this project (not 7), with one methodological
// fix: the Claude Code transcript format logs both real human-typed messages AND synthetic
// tool-result echoes under type:"user" — the original estimate appears to have counted both,
// which inflates turn density severalfold. This pass filters to messages with real text content.
// See RETROACTIVE_SESSION_ANALYSIS below for the full corrected numbers and per-session detail.
// The original figures are left in place (not deleted) for audit-trail purposes.

export const ARTIFACT = {
  id: 'contribution-intelligence-methodology-v1',
  type: 'methodology_widget',
  title: 'Contribution Intelligence Methodology',
  trademark: 'Contribution Intelligence Methodology™',
  parentBrand: 'Master Enterprise Solution Best Bets™',
  parentBrandDescriptor: "The practitioner's best perspectives on how to master your organization's measurements to produce returns on paper that exist, and are defensible.",
  author: 'Martha Elizabeth Salter aka Betsy Salter',
  organization: 'Salt Basin Net Works',
  copyright: '© 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · All rights reserved',
  tagline: 'Where the practitioner meets AI augmentation — practitioner-derived, AI-augmented, practitioner-signed.',
  version: '1.0',
  publishedAt: '2026-06-30',
  provenance: 'Developed through the build of Salt Basin Net Works platform (2026). Framework emerged from active build sessions — the platform itself is the proof of concept for the methodology. The original "35.4 hours / 3,880 turns" estimate (June 2026) was retroactively corrected on 2026-07-07 via real JSONL burst analysis across all 11 session transcripts on file: see RETROACTIVE_SESSION_ANALYSIS below for the corrected numbers, method, and disclosed gaps.',
  license: {
    public: 'teaser_only',
    member: 'read_only_framework',
    client: 'engagement_licensed',
  },
  watermarkTemplate: '© 2026 Martha Elizabeth Salter aka Betsy Salter · Salt Basin Net Works · Contribution Intelligence Methodology™ · Master Enterprise Solution Best Bets™ · Licensed to: {{licensee}} · {{date}}',
};

// ── How the methodology was derived ────────────────────────────────────────
// Transparent co-derivation record: what Betsy and Claude agreed on,
// why, and what evidence supports each decision.

export const DERIVATION_RECORD = {
  rateMethodology: {
    decision: 'Four contribution types, each with an activity-based rate. Rates benchmarked to 2026 market equivalents.',
    derivedBy: 'Betsy Salter + Claude (Anthropic), June 2026',
    rationale: 'A simple in-session vs prep split was rejected because the $25 rate difference is small and the session data only captures in-session time anyway. Activity type is more meaningful than location of work.',
    evidence: 'Session JSONL analysis across 7 files, 35.4 active hours, 3,880 turns.',
  },
  claudeQualityAdjustedRate: {
    decision: '$115/hr — offshore senior boutique equivalent',
    derivedBy: 'Betsy Salter, confirmed June 2026',
    rationale: 'Claude produces senior-level output: architecture-aware, security-by-default, multi-system design. Above offshore entry ($65/hr floor). Below onshore senior ($175/hr). Boutique offshore senior rate is the honest apples-to-apples comparison.',
    benchmarkFloor: '$65/hr — boutique offshore entry-level code generation (2026)',
    benchmarkCeiling: '$175/hr — US onshore senior engineer consulting rate (2026)',
  },
  oversightModel: {
    decision: 'Turn density (real human turns / active_hours) as the primary oversight intensity metric.',
    derivedBy: 'Betsy Salter + Claude, June 2026',
    rationale: 'Turn density is directly measurable from raw JSONL data. High density = frequent course corrections = high oversight. Low density = Claude operating with defined scope = lower oversight. This is rate-independent and always reproducible.',
    observed: 'June 2026 estimate: "41/hr to 180/hr, platform average 110/hr" — not reproduced by the 2026-07-07 corrected re-run. Corrected: 11 sessions ranged 7.1–53.8 real human turns/hr, platform average 12.1/hr (all but two sessions land in the "low" oversight band, <40/hr). See RETROACTIVE_SESSION_ANALYSIS.',
  },
  leverageMultiple: {
    decision: 'engineer_equiv_hours / session_active_hours = session leverage multiple',
    derivedBy: 'Betsy Salter + Claude, June 2026',
    rationale: 'Rate-independent. Survives market rate changes. The most defensible long-term metric for communicating AI-augmented productivity.',
    observed: 'June 2026 estimate: "1,002 engineer-equivalent hours / 35.4 active hours = 28× leverage" — could not be reproduced against the corrected active-hours figure. Corrected active hours across all 11 sessions to date: ~25.0 hrs (15-min idle-gap threshold; 25.0–32.7 hrs across a 15–60 min threshold range — see RETROACTIVE_SESSION_ANALYSIS). Engineer-equivalent hours is a per-requirement judgment estimate, not something derivable from timestamps alone, and has not been independently re-derived at platform scale as of this correction — treat the 28× figure as unverified pending that work.',
  },
};

// ── 2026-07-07 retroactive session-log analysis ──────────────────────────────
// Real numbers, not estimates: every .jsonl session transcript on file for this
// project run through burst analysis (consecutive timestamped events grouped
// into one "burst" when the gap between them is <= 15 minutes; larger gaps —
// e.g. the multi-day idle periods between visits in a resumed session — are
// excluded from active time). "Real human turns" filters type:"user" events to
// those with actual text content, excluding synthetic tool-result echoes.
export const RETROACTIVE_SESSION_ANALYSIS = {
  computedAt: '2026-07-07',
  method: {
    idleGapThresholdMin: 15,
    idleGapSensitivity: 'Total active hours: 25.0 @15min gap, 29.2 @30min, 32.7 @60min — presented range reflects this sensitivity rather than a single fragile point estimate.',
    realHumanTurnFilter: 'type:"user" events where message.content is a non-empty string, or an array containing a text block with non-empty text. Excludes tool_result-only content arrays (agentic-loop bookkeeping, not human input).',
    oversightWeight: {
      note: 'New formalization (2026-07-07) of the previously qualitative "turn density weight" language — operationalizes active_supervision hours as a fraction of session active hours, keyed to the existing OVERSIGHT_LEVELS bands.',
      critical: 0.90, high: 0.65, moderate: 0.40, low: 0.20,
    },
  },
  sessionsAnalyzed: 11,
  totals: {
    activeHours15min: 25.0,
    activeHours30min: 29.2,
    activeHours60min: 32.7,
    assistantTurns: 4828,
    realHumanTurns: 303,
    rawUserTypeEvents: 3044,
    burstCount: 49,
    overallTurnDensityPerHr: 12.1,
    overallOversightLevel: 'low',
  },
  perSession: [
    { file: 'abcc0d06-8e26-44ba-8290-18f2ac26230d', dateStart: '2026-06-07T11:25', dateEnd: '2026-06-09T18:05', activeHours: 0.66, assistantTurns: 118, realHumanTurns: 7, turnDensity: 10.6 },
    { file: '97254a80-feaa-4c85-80fb-f0938a553251', dateStart: '2026-06-08T18:24', dateEnd: '2026-06-09T21:28', activeHours: 5.47, assistantTurns: 1126, realHumanTurns: 67, turnDensity: 12.3 },
    { file: 'ddf4fb85-cda0-4758-9366-af02fa3c0c21', dateStart: '2026-06-09T03:10', dateEnd: '2026-06-09T14:14', activeHours: 2.48, assistantTurns: 136, realHumanTurns: 37, turnDensity: 14.9 },
    { file: '0caba5fc-e4bf-42aa-b1f6-a87618c9bed8', dateStart: '2026-06-09T17:54', dateEnd: '2026-06-09T21:19', activeHours: 1.15, assistantTurns: 148, realHumanTurns: 10, turnDensity: 8.7 },
    { file: 'de055505-dc52-499d-978f-44e5e9323502', dateStart: '2026-06-14T00:00', dateEnd: '2026-06-15T17:24', activeHours: 5.05, assistantTurns: 1213, realHumanTurns: 66, turnDensity: 13.1 },
    { file: 'dfd38e71-cf07-4532-9925-435227f2473f', dateStart: '2026-06-14T13:15', dateEnd: '2026-06-14T13:17', activeHours: 0.02, assistantTurns: 30, realHumanTurns: 1, turnDensity: 48.1, note: 'Automated scheduled-task run, not a human-driven session' },
    { file: '551b4cbf-3e51-4315-a936-732f68aa348d', dateStart: '2026-06-17T16:02', dateEnd: '2026-07-04T00:11', activeHours: 3.93, assistantTurns: 620, realHumanTurns: 65, turnDensity: 16.5, note: 'Covers v0.16 through v0.17.3 (lead pledge) — resumed over 17 calendar days, ends 8 seconds from the lead-pledge commit timestamp' },
    { file: '2d89e945-2078-4752-9dfa-ee561d78e6ce', dateStart: '2026-07-04T00:37', dateEnd: '2026-07-04T03:17', activeHours: 2.25, assistantTurns: 430, realHumanTurns: 16, turnDensity: 7.1, note: 'Spatial/3D visual design config exploration — not reflected in the site backlog' },
    { file: '50a9edca-f76e-4aad-aeb1-702e16c9b604', dateStart: '2026-07-04T00:55', dateEnd: '2026-07-04T02:02', activeHours: 1.12, assistantTurns: 137, realHumanTurns: 10, turnDensity: 8.9, note: 'Source session for FUNCTIONAL_DESIGN_SPEC.md / TECHNICAL_DESIGN_SPEC.md / FUNCTIONAL_TECHNICAL_MAPPING.md' },
    { file: '4b8bd63e-c41c-4de0-bda8-ebcfd212b7de', dateStart: '2026-07-04T03:10', dateEnd: '2026-07-04T03:12', activeHours: 0.04, assistantTurns: 23, realHumanTurns: 2, turnDensity: 53.8 },
    { file: 'e3c9236b-fa3f-40be-8418-a807e0c3a21a', dateStart: '2026-07-04T03:51', dateEnd: '2026-07-07T16:08', activeHours: 2.82, assistantTurns: 847, realHumanTurns: 22, turnDensity: 7.8, note: 'Home page restructure, data-driven nav, deployment, and this retroactive analysis itself' },
  ],
  knownGaps: [
    'Contribution-type split (Strategic Direction / Domain Authoring / Active Supervision) within a session\'s real human turns has not been individually classified per-turn — active_supervision hours use the oversight-weight formula above, not a verified per-type breakdown.',
    'engineer_equiv_hours (traditional-team-equivalent effort) is not derivable from timestamps and has not been re-estimated at platform scale against these corrected active hours.',
    'Only 9 of ~110 backlog_items (v0.17.1–v0.18, added 2026-07-06/07) have had their hoursClaude/hoursBetsy corrected against real session data. The remaining ~101 items carry pre-correction estimates, which — based on the ~4x overstatement found when correcting those 9 — likely also overstate real active time. A platform-wide reconciliation pass has not been run.',
    'The auth `sessions` table (server/db.js, used for login cookies) and the analytics session-tracking table added in v0.17 share the same name — the v0.17 CREATE TABLE was a silent no-op against the existing auth table, and its ALTER TABLE ADD COLUMN statements bolted jsonl_filename/active_hours/etc. onto the live auth sessions table instead of a dedicated table. This analysis was stored in config_state (id "contribution_session_analysis") to avoid writing synthetic rows into a security-relevant table. The naming collision itself is unresolved.',
  ],
};

// ── Contribution Types ──────────────────────────────────────────────────────

export const CONTRIBUTION_TYPES = [
  {
    id: 'strategic_direction',
    name: 'Strategic Direction',
    contributor: 'Betsy Salter',
    rate2026: 225,
    rateBasis: 'Principal Consultant / Director of Engineering (US market, 2026)',
    reducible: false,
    reducibleNote: 'This is the IP. Platform vision, architecture decisions, product design, external artifacts (specs, decks, briefs). These turns ARE the work, not inefficiency.',
    measuredBy: 'Per-requirement tag; inferred from turn content and scope decisions',
    examples: [
      'Platform vision and product architecture',
      'L2R model design and stage definition',
      'Revenue model and pricing strategy decisions',
      'External artifacts: specs, presentations, frameworks',
      'Technology and vendor selection',
    ],
  },
  {
    id: 'domain_authoring',
    name: 'Domain Authoring',
    contributor: 'Betsy Salter',
    rate2026: 225,
    rateBasis: 'Principal Consultant / Director of Engineering (US market, 2026)',
    reducible: false,
    reducibleNote: 'Partially reducible with better templates. Better requirement templates and pre-approved patterns reduce authoring turns over time. But the domain knowledge itself is irreducible.',
    measuredBy: 'Per-requirement tag; prep artifacts (specs, briefs, business rules)',
    examples: [
      'Requirements writing and business rule definition',
      'Industry-specific content (career case studies, domain definitions)',
      'Methodology frameworks and IP artifacts',
      'User stories grounded in practitioner experience',
      'Control point and risk taxonomy definitions',
    ],
  },
  {
    id: 'active_supervision',
    name: 'Active Supervision',
    contributor: 'Betsy Salter',
    rate2026: 225,
    rateBasis: 'Principal Consultant / Director of Engineering (US market, 2026)',
    reducible: true,
    reducibleNote: 'Reducible through better upfront specifications, pre-approved patterns, and automated testing that reduces debugging turns. Investment in spec quality here frees director time.',
    measuredBy: 'Session active hours × turn density weight; co-present by definition during all Claude sessions',
    examples: [
      'Real-time course correction during build sessions',
      'UX and design decisions made in-session',
      'Triage between what is understood vs what needs clarification',
      'Quality validation of Claude outputs',
      'Architectural pivots mid-session',
    ],
  },
  {
    id: 'code_generation',
    name: 'Code Generation',
    contributor: 'Claude (Anthropic)',
    rate2026: 115,
    rateBasis: 'Offshore senior engineer equivalent, quality-adjusted (boutique rate, 2026)',
    reducible: true,
    reducibleNote: 'Execution efficiency improves with better specs, runbooks for known patterns, and automated testing. Quality-adjusted rate reflects senior-level output above offshore entry floor.',
    measuredBy: 'Session active hours from JSONL burst analysis — wall-clock time Claude was actively generating',
    examples: [
      'React component implementation',
      'Express route and middleware development',
      'Database schema and migration writing',
      'API integration and OAuth flows',
      'Bug diagnosis and fix implementation',
    ],
  },
];

// ── Rate Configuration (2026 benchmarks) ───────────────────────────────────

export const RATE_CONFIGS_2026 = [
  {
    id: 'betsy_director',
    rateType: 'director',
    contributor: 'Betsy Salter',
    ratePerHour: 225,
    effectiveYear: 2026,
    basis: 'Principal Consultant / Director of Engineering — US market, 2026',
    appliesTo: ['strategic_direction', 'domain_authoring', 'active_supervision'],
    note: 'Single rate for all Betsy contribution types. The $25 in-session vs prep distinction was retired — activity type is more meaningful than location of work.',
  },
  {
    id: 'claude_quality_adjusted',
    rateType: 'ai_senior',
    contributor: 'Claude (Anthropic)',
    ratePerHour: 115,
    effectiveYear: 2026,
    basis: 'Offshore senior engineer equivalent, quality-adjusted — boutique firm, 2026',
    appliesTo: ['code_generation'],
    note: 'Above offshore entry floor ($65). Below onshore senior ($175). Reflects senior-level output: architecture-aware, security-by-default, multi-system design capability.',
  },
  {
    id: 'benchmark_offshore_entry',
    rateType: 'benchmark',
    contributor: null,
    ratePerHour: 65,
    effectiveYear: 2026,
    basis: 'Boutique offshore entry-level code generation — 2026 market rate',
    appliesTo: [],
    note: 'Comparison benchmark only. Never used in actual cost calculations. Floor reference for Claude quality-adjusted rate.',
  },
  {
    id: 'benchmark_onshore_senior',
    rateType: 'benchmark',
    contributor: null,
    ratePerHour: 175,
    effectiveYear: 2026,
    basis: 'US senior engineer consulting rate — 2026 market rate',
    appliesTo: [],
    note: 'Comparison benchmark only. Traditional team replacement cost comparison.',
  },
];

// ── Oversight Intensity Scale ───────────────────────────────────────────────

export const OVERSIGHT_LEVELS = [
  {
    id: 'critical',
    label: 'Critical',
    turnDensityThreshold: '>120/hr',
    minDensity: 120,
    color: '#ff4444',
    description: 'Every output reviewed, constant course-correction. Characteristic of novel architecture, domain-heavy content, or unclear requirements.',
    reducePath: 'Better upfront specs and requirement templates. Reduction requires investment in spec quality first.',
    automationPotential: 'low',
  },
  {
    id: 'high',
    label: 'High',
    turnDensityThreshold: '80–120/hr',
    minDensity: 80,
    maxDensity: 120,
    color: '#ff9944',
    description: 'Active collaboration with frequent pivots. Understood domain but decisions still made in-session.',
    reducePath: 'Standard runbooks for known patterns. Prebuilt prompts for recurring requirement types.',
    automationPotential: 'moderate',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    turnDensityThreshold: '40–80/hr',
    minDensity: 40,
    maxDensity: 80,
    color: '#6699ff',
    description: 'Direction set upfront; Claude executes with periodic check-ins. Well-understood scope.',
    reducePath: 'Automated testing reduces debugging turns. Pre-approved patterns for execution work.',
    automationPotential: 'high',
  },
  {
    id: 'low',
    label: 'Low',
    turnDensityThreshold: '<40/hr',
    maxDensity: 40,
    color: '#4caf50',
    description: 'Review-on-completion. Claude operates near-autonomously within well-defined constraints.',
    reducePath: 'Near target state for execution work. Monitor for quality drift.',
    automationPotential: 'very_high',
  },
];

// ── Irreducible vs Reducible ────────────────────────────────────────────────

export const REDUCTION_MAP = {
  irreducible: {
    label: "Betsy's IP — Cannot Be Reduced",
    note: 'These turns ARE the work, not inefficiency. Attempting to reduce them reduces the quality and authenticity of the output.',
    items: [
      'Career domain content — industries, case studies, practitioner voice',
      'Product vision and platform strategy decisions',
      'Lead to Revenue model architecture and definitions',
      'Contribution Intelligence methodology design',
      'Client-specific requirements authoring',
      'Business rule definition from domain expertise',
      'HERQ / NRM architecture decisions',
    ],
  },
  reducible: {
    label: 'Execution Efficiency — Can Improve Over Time',
    note: 'Investment in specs and tooling here frees Betsy time without reducing output quality.',
    items: [
      'Debugging turns → automated testing investment',
      'Code direction for known patterns → runbooks and prompt templates',
      'Deployment and infra turns → better playbooks',
      'Repeated UX decisions → design system documentation',
      'Route and schema patterns → code templates',
      'Repeated auth/security patterns → pre-approved scaffolding',
    ],
  },
};

// ── The Three Loops ─────────────────────────────────────────────────────────

export const THREE_LOOPS = [
  {
    id: 'loop_1',
    name: 'Loop 1 — Estimation Accuracy',
    description: 'Requirement created → estimates logged → build happens → session data produces actuals → variance calculated → feeds future estimates. Over time: estimation accuracy improves, oversight need decreases for known patterns.',
    inputs: ['Requirement type', 'Historical similar requirements', 'Contributor rates', 'Oversight intensity category'],
    outputs: ['Build estimate (hours by contribution type)', 'Cost estimate at 3 rate scenarios', 'Oversight intensity prediction'],
  },
  {
    id: 'loop_2',
    name: 'Loop 2 — Cost Ledger',
    description: 'Actuals roll up from requirement → release → capability group → platform total. Each level shows cost at 3 rate scenarios. Benchmarks are rate-independent (hours locked). Leverage multiple is the defensible long-term metric.',
    inputs: ['Session actuals', 'Contribution type attribution', 'Rate configs (locked at build date)', 'Engineer equivalent hours'],
    outputs: ['Cost by release', 'Cost by capability', 'Leverage multiple', 'T&M comparison'],
  },
  {
    id: 'loop_3',
    name: 'Loop 3 — Business Value / ROI',
    description: 'Capabilities linked to L2R stages and business functions. Spend inputs tracked. Initiative targets connected. ROI = value enabled / actual build cost.',
    inputs: ['Capability group → L2R stage mapping', 'Spend inputs (tech licenses, human hours)', 'Initiative targets (revenue, savings, risk)', 'Business function alignment'],
    outputs: ['ROI multiple', 'Payback period', 'Value by L2R stage', 'Leverage IRR'],
  },
];

// ── Cost calculation helpers ────────────────────────────────────────────────

export function calcActualCost({ betsyHours = 0, claudeHours = 0, claudeRate = 115, betsyRate = 225 } = {}) {
  return (betsyHours * betsyRate) + (claudeHours * claudeRate);
}

export function calcEngineerEquivCost(engineerEquivHours, onshoreRate = 175) {
  return engineerEquivHours * onshoreRate;
}

export function calcLeverageMultiple(engineerEquivHours, sessionActiveHours) {
  if (!sessionActiveHours) return null;
  return Math.round((engineerEquivHours / sessionActiveHours) * 10) / 10;
}

export function calcCostLeverage(engineerEquivCost, actualCost) {
  if (!actualCost) return null;
  return Math.round((engineerEquivCost / actualCost) * 10) / 10;
}

export function getOversightLevel(turnDensity) {
  if (turnDensity > 120) return OVERSIGHT_LEVELS[0];
  if (turnDensity > 80)  return OVERSIGHT_LEVELS[1];
  if (turnDensity > 40)  return OVERSIGHT_LEVELS[2];
  return OVERSIGHT_LEVELS[3];
}

export default {
  ARTIFACT,
  DERIVATION_RECORD,
  RETROACTIVE_SESSION_ANALYSIS,
  CONTRIBUTION_TYPES,
  RATE_CONFIGS_2026,
  OVERSIGHT_LEVELS,
  REDUCTION_MAP,
  THREE_LOOPS,
  calcActualCost,
  calcEngineerEquivCost,
  calcLeverageMultiple,
  calcCostLeverage,
  getOversightLevel,
};
