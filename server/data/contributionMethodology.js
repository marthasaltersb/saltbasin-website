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
// and Claude (Anthropic) through 35.4 active session hours across the Salt Basin platform build.
// The framework, rate benchmarks, activity taxonomy, and oversight model are
// original intellectual property of Martha Elizabeth Salter aka Betsy Salter. AI was the
// structuring and execution tool; the practitioner is the author and authority.

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
  provenance: 'Developed through the build of Salt Basin Net Works platform (2026). Framework emerged from 35.4 active build hours across 3,880 session turns — the platform itself is the proof of concept for the methodology.',
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
    decision: 'Turn density (user_turns / active_hours) as the primary oversight intensity metric.',
    derivedBy: 'Betsy Salter + Claude, June 2026',
    rationale: 'Turn density is directly measurable from raw JSONL data. High density = frequent course corrections = high oversight. Low density = Claude operating with defined scope = lower oversight. This is rate-independent and always reproducible.',
    observed: 'Salt Basin sessions ranged from 41/hr (low, well-scoped) to 180/hr (critical, novel architecture). Platform average: 110/hr.',
  },
  leverageMultiple: {
    decision: 'engineer_equiv_hours / session_active_hours = session leverage multiple',
    derivedBy: 'Betsy Salter + Claude, June 2026',
    rationale: 'Rate-independent. Survives market rate changes. The most defensible long-term metric for communicating AI-augmented productivity.',
    observed: '1,002 engineer-equivalent hours delivered across 35.4 active session hours = 28× leverage on the Salt Basin platform build.',
  },
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
