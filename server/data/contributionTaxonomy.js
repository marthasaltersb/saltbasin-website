// Contribution Intelligence — Contributor Types & Classification Taxonomy
// (Phase 2 of the .claude/skills/salt-basin-contribution-intelligence build,
// §II/§III of reference/master-build-prompt.md).
//
// This is the CONFIGURABLE taxonomy §III asks for — a data structure, not
// hardcoded branching logic scattered across route files. New classes get
// added here; classifiers (scripts/classify-contribution-events.mjs) and any
// future reporting UI read from this module rather than each defining their
// own copy.
//
// Versioned: bump TAXONOMY_VERSION whenever a class is added, renamed, or
// reassigned between tiers. contribution_events.classification_version
// records which taxonomy version a given row was classified against, so
// reprocessing against a newer taxonomy is a deliberate, visible event —
// never a silent reinterpretation of old rows (§XX).

export const TAXONOMY_VERSION = '1.0';

// ── §II — Contributor Types ────────────────────────────────────────────────
export const CONTRIBUTOR_TYPES = [
  { id: 'HUMAN', label: 'Human', description: 'A person directly authoring input — a message, decision, or edit.' },
  { id: 'AI_MODEL', label: 'AI Model', description: 'A conversational model responding within a session (e.g. Claude in an interactive chat/agent turn).' },
  { id: 'AI_AGENT', label: 'AI Agent', description: 'An AI system operating with autonomy across a bounded task or sandbox, not just responding turn-by-turn (e.g. Codex executing in its own sandbox).' },
  { id: 'SYSTEM_PROCESS', label: 'System Process', description: 'Non-agentic automation: tool-result plumbing, hooks, scheduled jobs, build pipelines, compaction summaries.' },
  { id: 'EXTERNAL_CONTRIBUTOR', label: 'External Contributor', description: 'A person outside the primary human/AI pairing — a reviewer, stakeholder, or collaborator contributing evidence or a decision.' },
  { id: 'TEAM', label: 'Team', description: 'A contribution attributable to a group rather than a resolvable individual (reserved for Phase 7 multi-human channels).' },
  { id: 'HYBRID_CONTRIBUTION', label: 'Hybrid Contribution', description: 'Reserved for a genuinely inseparable joint action. Per §II: must NOT be used merely because a human prompted and AI answered — that case must be decomposed into separate Contribution Events instead. Expect this value to be rare.' },
];

// ── §III — Contribution Classification Taxonomy ────────────────────────────
// Three tiers: human-oriented, AI-oriented, and shared/context-dependent
// classes whose actual human-vs-AI split is determined per instance from
// lineage, not assumed from the tier.

export const HUMAN_ORIENTED_CLASSES = [
  'ORIGINAL_CONCEPT_INTRODUCTION', 'PROBLEM_RECOGNITION', 'PATTERN_RECOGNITION',
  'DOMAIN_JUDGMENT', 'STRATEGIC_DIRECTION', 'CONSTRAINT_DEFINITION',
  'BUSINESS_RULE_DEFINITION', 'RISK_IDENTIFICATION', 'ETHICAL_JUDGMENT',
  'PRIORITY_SELECTION', 'TRADEOFF_DECISION', 'ACCEPTANCE_DECISION',
  'REJECTION_DECISION', 'CORRECTION', 'REFRAMING', 'EXCEPTION_IDENTIFICATION',
  'CONTEXTUALIZATION', 'TACIT_KNOWLEDGE', 'CROSS_DOMAIN_CONNECTION',
  'NOVEL_SYNTHESIS', 'PRODUCT_VISION', 'OPERATING_MODEL_DESIGN',
  'ECONOMIC_JUDGMENT', 'ACCOUNTABILITY_OWNERSHIP', 'VALIDATION',
  'EVIDENCE_INTERPRETATION',
];

export const AI_ORIENTED_CLASSES = [
  'STRUCTURING', 'FORMAT_TRANSFORMATION', 'CLASSIFICATION', 'LARGE_SCALE_COMPARISON',
  'SEARCH', 'RETRIEVAL', 'SUMMARIZATION', 'CODE_GENERATION', 'SCHEMA_GENERATION',
  'DOCUMENT_GENERATION', 'CONTENT_EXPANSION', 'PATTERN_ENUMERATION',
  'CONSISTENCY_ANALYSIS', 'DATA_TRANSFORMATION', 'CALCULATION', 'SIMULATION',
  'TEST_GENERATION', 'EXECUTION', 'REPETITIVE_PROCESSING', 'NORMALIZATION',
  'VARIANT_GENERATION',
];

export const SHARED_CONTEXT_DEPENDENT_CLASSES = [
  'REASONING', 'SYNTHESIS', 'DESIGN', 'ANALYSIS', 'HYPOTHESIS_CREATION',
  'ROOT_CAUSE_ANALYSIS', 'ARCHITECTURE', 'VALIDATION', 'PROBLEM_SOLVING', 'INNOVATION',
];

export const CONTRIBUTION_TAXONOMY = {
  version: TAXONOMY_VERSION,
  tiers: {
    HUMAN_ORIENTED: HUMAN_ORIENTED_CLASSES,
    AI_ORIENTED: AI_ORIENTED_CLASSES,
    SHARED_CONTEXT_DEPENDENT: SHARED_CONTEXT_DEPENDENT_CLASSES,
  },
};

export function tierForClass(contributionClass) {
  if (HUMAN_ORIENTED_CLASSES.includes(contributionClass)) return 'HUMAN_ORIENTED';
  if (AI_ORIENTED_CLASSES.includes(contributionClass)) return 'AI_ORIENTED';
  if (SHARED_CONTEXT_DEPENDENT_CLASSES.includes(contributionClass)) return 'SHARED_CONTEXT_DEPENDENT';
  return null;
}

// ── Heuristic-v1 tool-name → AI-oriented class map ─────────────────────────
// Deterministic, observable-signal-only mapping used by the Phase 2
// heuristic classifier for AI_MODEL/AI_AGENT tool-use events. This is NOT a
// semantic classifier — it maps a tool NAME to the class of work that tool
// mechanically represents. It cannot and does not attempt to classify human
// turns or AI free-text reasoning into the human-oriented or shared-tier
// classes above; those require actual content understanding, which a future
// phase (a real classifier, not a lookup table) should add. Leaving those
// unclassified (contribution_class = null, low confidence) is the honest
// choice — see §IV's "do not flatter, must be defensible from observed
// behavior" non-negotiable.
export const TOOL_CLASS_MAP = {
  Write: 'CODE_GENERATION',
  Edit: 'CODE_GENERATION',
  NotebookEdit: 'CODE_GENERATION',
  Bash: 'EXECUTION',
  BashOutput: 'EXECUTION',
  KillShell: 'EXECUTION',
  Read: 'RETRIEVAL',
  Grep: 'SEARCH',
  Glob: 'SEARCH',
  WebFetch: 'RETRIEVAL',
  WebSearch: 'SEARCH',
  TodoWrite: 'STRUCTURING',
  Task: 'EXECUTION',
  AskUserQuestion: 'STRUCTURING',
};

// Codex adapter's own coarse eventType (assigned at ingestion from log-line
// regex matching — see scripts/run-codex-contribution-intelligence.mjs) →
// AI-oriented class. Same honesty rule: TOOL_ACTIVITY is Codex's own catch-
// all bucket and gets no class, not a guessed one.
export const CODEX_EVENT_TYPE_CLASS_MAP = {
  FILE_UPDATE: 'CODE_GENERATION',
  COMMAND_EXECUTION: 'EXECUTION',
  TEST_EXECUTION: 'EXECUTION',
};

export default {
  TAXONOMY_VERSION,
  CONTRIBUTOR_TYPES,
  CONTRIBUTION_TAXONOMY,
  HUMAN_ORIENTED_CLASSES,
  AI_ORIENTED_CLASSES,
  SHARED_CONTEXT_DEPENDENT_CLASSES,
  tierForClass,
  TOOL_CLASS_MAP,
  CODEX_EVENT_TYPE_CLASS_MAP,
};
