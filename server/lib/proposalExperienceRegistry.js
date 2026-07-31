// LoneTree "Member Experience Module" registry (2026-07-29) — the semantic
// delta from Salt_Basin_MVP_Proposal_Experience_Delta_Spec_v0.1.docx +
// Salt_Basin_MVP_Proposal_Semantic_Seed_Repository_v0.1.xlsx, resolved onto
// the existing Channel Journey substrate per the reuse-first audit run
// before this build (salt-basin-channel-journey-architecture skill):
//
//   - No new tables anywhere in this file.
//   - The bounded 9-stage guided journey (J01 Welcome -> J09 Workspace) is a
//     NEW rod_type ('proposal_experience'), added as a hierarchical Tributary
//     CHILD of the existing 'customer' rod (see tributaryRegistry.js's
//     'customer_proposal_experience' entry and server/scripts/
//     seedProposalExperience.js) — a sibling pattern to fund_deal ->
//     portfolio_company, not an overload of the customer rod's own
//     current_stage (which already carries a different, longer-lived
//     relationship-lifecycle vocabulary).
//   - The workbook's 15 "Molecule" types are record-level Atom definitions
//     here (one atom_key per molecule TYPE, dataType='json', value = the
//     full seeded row) — identical precedent to lonetreeDemoRegistry.js's
//     RECORD_ATOMS: "one atom per business-object TYPE (not per field)".
//     Definitions only; no journey_metadata_clusters row, since each is used
//     standalone against the proposal_experience rod, not as a
//     completion-gated group.
//   - The workbook's 15 "Atom Delta" candidates (presentation order, CTA
//     label, visibility rule, illustrative flag, ...) are registered as
//     their own vocabulary atoms (DELTA_ATOMS) purely for documentation/
//     discoverability of the field-level concepts every record molecule's
//     JSON blob carries — they are not separately-stored evidence rows.
//   - Proposal Decision (member selects proceed/discuss/revise/decline) and
//     View State (stage/scenario/evidence viewed) are genuinely temporal,
//     event-sourced state — NOT record atoms — see recordProposalDecision /
//     reconstructLatestDecision / recordProposalViewEvent below, mirroring
//     eidosBonding.js's recordCurrentArc/reconstructLatestCurrentArc.
//   - Experience Actions (the 11 CTAs/routes/transitions) are pure behavior
//     definitions with no per-instance history — static frozen config
//     (PROPOSAL_ACTIONS), not database rows, matching the existing
//     FUND_HIGHWAY_STAGES precedent (plain config, not schema).
import { db } from '../db.js';
import { createJourneyTributary } from './tributaryRegistry.js';

// Idempotently ensures a member's proposal_experience Channel Rod exists —
// called from journeyRods.js's ensureMemberJourneyRods() right after the
// 'member' rod itself, so every member gets exactly one, created once, never
// duplicated on re-login. Content (sections/diagnostic modules/scenarios/
// evidence) is seeded separately per server/scripts/seedProposalExperience.js
// — a member with no seeded content simply sees an honest empty state, never
// fabricated demo numbers.
export async function ensureProposalExperienceRod(memberRod) {
  const existing = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='proposal_experience' AND parent_rod_id=$1`).get(memberRod.id);
  if (existing) return existing;
  return createJourneyTributary({
    parentJourney: memberRod,
    tributaryType: 'member_proposal_experience',
    stage: 'J01',
    metadata: {},
  });
}

// ── Journey stage sequence (workbook sheet 02_JOURNEY_STAGES) ──────────────
export const PROPOSAL_JOURNEY_STAGES = Object.freeze([
  { stageId: 'J01', sequence: 1, name: 'Welcome', purpose: 'Orient the member and establish proposal context.', primaryCtaActionId: 'ACT-CONTINUE', completionSignal: 'member_context_acknowledged', defaultRoute: '/demo', availableByDefault: true },
  { stageId: 'J02', sequence: 2, name: 'MVP Demonstration', purpose: 'Show how Salt Basin reconstructs and renders a governed Monetary River System.', primaryCtaActionId: 'ACT-EXPLORE-RIVER', completionSignal: 'demo_scene_viewed', defaultRoute: '/demo', availableByDefault: true },
  { stageId: 'J03', sequence: 3, name: 'Diagnostic Preview', purpose: 'Explain the Phase 1 diagnostic scope, inputs, tests, and outputs.', primaryCtaActionId: 'ACT-VIEW-DIAGNOSTIC', completionSignal: 'diagnostic_modules_reviewed', defaultRoute: '/diagnostic', availableByDefault: true },
  { stageId: 'J04', sequence: 4, name: 'Opportunity Landscape', purpose: 'Present benchmark-informed, clearly illustrative opportunity categories.', primaryCtaActionId: 'ACT-COMPARE', completionSignal: 'scenario_expanded', defaultRoute: '/opportunity', availableByDefault: true },
  { stageId: 'J05', sequence: 5, name: 'Evidence Review', purpose: 'Connect claims to benchmarks, scenarios, assumptions, and source evidence.', primaryCtaActionId: 'ACT-EVIDENCE', completionSignal: 'evidence_confidence_viewed', defaultRoute: '/evidence', availableByDefault: true },
  { stageId: 'J06', sequence: 6, name: 'Proposal', purpose: 'Present scope, deliverables, roles, timing, and commercial placeholders.', primaryCtaActionId: 'ACT-REVIEW-PROPOSAL', completionSignal: 'proposal_sections_viewed', defaultRoute: '/proposal', availableByDefault: true },
  { stageId: 'J07', sequence: 7, name: 'Implementation', purpose: 'Show the path from diagnostic to recovery and prevention.', primaryCtaActionId: 'ACT-VIEW-ROADMAP', completionSignal: 'roadmap_expanded', defaultRoute: '/implementation', availableByDefault: true },
  { stageId: 'J08', sequence: 8, name: 'Decision', purpose: 'Capture proceed, revise, discuss, or decline intent.', primaryCtaActionId: 'ACT-REQUEST', completionSignal: 'decision_saved', defaultRoute: '/decision', availableByDefault: true },
  { stageId: 'J09', sequence: 9, name: 'Workspace', purpose: 'Provide persistent access to proposal artifacts and later diagnostic outputs.', primaryCtaActionId: 'ACT-OPEN-WORKSPACE', completionSignal: 'workspace_opened', defaultRoute: '/workspace', availableByDefault: false },
]);

// ── Experience Actions (workbook sheet 10_ACTIONS_ROUTES) — static config,
// not DB rows: pure CTA/permission/transition/route behavior definitions
// with no per-instance history to reconstruct. ──────────────────────────────
export const PROPOSAL_ACTIONS = Object.freeze([
  { actionId: 'ACT-CONTINUE', label: 'Continue', fromStageId: 'J01', permission: 'proposal.read', eventName: 'proposal.continue', stateMutation: 'complete J01', transitionType: 'fade', nextRoute: '/demo', componentTarget: 'NarrativeScene' },
  { actionId: 'ACT-EXPLORE-RIVER', label: 'Explore the River', fromStageId: 'J02', permission: 'proposal.read', eventName: 'proposal.explore_river', stateMutation: 'demoViewed=true', transitionType: 'river-follow', nextRoute: '/demo/river', componentTarget: 'MRSViewport' },
  { actionId: 'ACT-VIEW-DIAGNOSTIC', label: 'View Diagnostic', fromStageId: 'J03', permission: 'proposal.read', eventName: 'proposal.view_diagnostic', stateMutation: 'diagnosticViewed=true', transitionType: 'slide', nextRoute: '/diagnostic', componentTarget: 'DiagnosticModuleGrid' },
  { actionId: 'ACT-COMPARE', label: 'Compare Scenarios', fromStageId: 'J04', permission: 'proposal.read', eventName: 'proposal.compare', stateMutation: 'selectedScenario={id}', transitionType: 'expand', nextRoute: '/opportunity', componentTarget: 'OpportunityScenarioPanel' },
  { actionId: 'ACT-EVIDENCE', label: 'Inspect Evidence', fromStageId: 'J05', permission: 'proposal.read', eventName: 'proposal.open_evidence', stateMutation: 'evidenceDrawer={id}', transitionType: 'orbit-focus', nextRoute: 'SAME_ROUTE', componentTarget: 'EvidenceDrawer' },
  { actionId: 'ACT-REVIEW-PROPOSAL', label: 'Review Proposal', fromStageId: 'J06', permission: 'proposal.read', eventName: 'proposal.review', stateMutation: 'proposalViewed=true', transitionType: 'slide', nextRoute: '/proposal', componentTarget: 'ProposalSection' },
  { actionId: 'ACT-VIEW-ROADMAP', label: 'View Roadmap', fromStageId: 'J07', permission: 'proposal.read', eventName: 'proposal.view_roadmap', stateMutation: 'roadmapViewed=true', transitionType: 'river-follow', nextRoute: '/implementation', componentTarget: 'ImplementationTimeline' },
  { actionId: 'ACT-REQUEST', label: 'Request Phase 1', fromStageId: 'J08', permission: 'proposal.decide', eventName: 'proposal.request_phase1', stateMutation: 'decision=proceed', transitionType: 'fade', nextRoute: '/workspace', componentTarget: 'DecisionRoom' },
  { actionId: 'ACT-DISCUSS', label: 'Schedule Discussion', fromStageId: 'J08', permission: 'proposal.decide', eventName: 'proposal.request_discussion', stateMutation: 'decision=discuss', transitionType: 'fade', nextRoute: '/workspace', componentTarget: 'DecisionRoom' },
  { actionId: 'ACT-REVISE', label: 'Request Revision', fromStageId: 'J08', permission: 'proposal.decide', eventName: 'proposal.request_revision', stateMutation: 'decision=revise', transitionType: 'fade', nextRoute: '/workspace', componentTarget: 'DecisionRoom' },
  { actionId: 'ACT-OPEN-WORKSPACE', label: 'Open Workspace', fromStageId: 'J09', permission: 'proposal.read', eventName: 'proposal.open_workspace', stateMutation: 'workspaceOpened=true', transitionType: 'expand', nextRoute: '/workspace', componentTarget: 'MemberWorkspace' },
]);

// ── 15 delta Atom vocabulary definitions (workbook sheet 05_ATOM_DELTA_REGISTRY)
// — registered for documentation/discoverability of the field-level concepts
// the record molecules below carry inside their JSON value. Not separately
// stored per-instance; see the RECORD_MOLECULE_ATOMS block below for what
// actually gets a journey_rod_evidence row. ─────────────────────────────────
export const DELTA_ATOMS = Object.freeze([
  ['presentation_order', 'Presentation Order', 'integer', 'Controls sequence inside a projection. Applied to Proposal Section; Sales Narrative Scene.'],
  ['presentation_group', 'Presentation Group', 'text', 'Groups content into a navigable chapter. Applied to Proposal Section.'],
  ['story_sequence', 'Story Sequence', 'integer', 'Orders guided narrative scenes. Applied to Sales Narrative Scene.'],
  ['scene_type', 'Scene Type', 'enum', 'Sets the rendering treatment. Applied to Sales Narrative Scene.'],
  ['visual_cue', 'Visual Cue', 'text', 'Points to an existing visual, orbit, river, chart, or panel. Applied to Sales Narrative Scene.'],
  ['cta_label', 'CTA Label', 'text', 'Member-facing action label. Applied to Proposal Section; Experience Action.'],
  ['cta_action_ref', 'CTA Action Reference', 'reference', 'Links content to a configured Experience Action. Applied to Proposal Section.'],
  ['default_expansion', 'Default Expansion', 'enum', 'Collapsed, summary, expanded, immersive. Applied to View State.'],
  ['default_projection', 'Default Projection', 'reference', 'Initial projection for the record. Applied to Business Instance; Proposal Section.'],
  ['visibility_rule', 'Visibility Rule', 'text', 'Controls role/state-based visibility. Applied to all proposal molecules.'],
  ['narrative_template', 'Narrative Template', 'text', 'Reusable narrative syntax with molecule references. Applied to Sales Narrative Scene; Proposal Section.'],
  ['evidence_display_mode', 'Evidence Display Mode', 'enum', 'Badge, drawer, inline, room, hidden. Applied to Evidence Item; Proposal Finding.'],
  ['transition_type', 'Transition Type', 'enum', 'None, fade, slide, orbit-focus, river-follow, expand. Applied to Experience Action.'],
  ['next_route', 'Next Route', 'text', 'Route activated after action completion. Applied to Experience Action; Proposal Decision.'],
  ['illustrative_flag', 'Illustrative Flag', 'boolean', 'Forces illustrative labeling and disclaimer display. Applied to Opportunity Scenario; Proposal Outcome; Proposal Finding.'],
]);

export function generateDeltaAtomDefinitions() {
  const now = Date.now();
  return {
    atoms: DELTA_ATOMS.map(([atomKey, label, dataType, canonicalDefinition]) => ({ atomKey, label, dataType, canonicalDefinition })),
    now,
  };
}

// ── Record-level Atom definitions, one per Molecule TYPE (workbook sheet
// 04_MOLECULE_REGISTRY) — same shape as lonetreeDemoRegistry.js's
// RECORD_ATOMS: each instance is a journey_rod_evidence row against the
// proposal_experience rod with value = the full seeded record as JSON and
// source_reference = the workbook's own stable ID (SEC-01, D01, SCN-01,
// EVD-BCG-01, SCENE-01, HW-PRESENT, ...). ───────────────────────────────────
export const RECORD_MOLECULE_ATOMS = Object.freeze([
  ['proposal_section', 'Proposal Section', 'json', 'A governed unit of proposal content and navigation (workbook 06_PROPOSAL_EXPERIENCE).'],
  ['sales_narrative_scene', 'Sales Narrative Scene', 'json', 'A guided story beat rendered within a journey stage (workbook 12_SALES_NARRATIVE).'],
  ['diagnostic_module', 'Diagnostic Module', 'json', 'A bounded Phase 1 diagnostic workstream (workbook 07_DIAGNOSTIC_MODULES).'],
  ['proposal_finding', 'Proposal Finding', 'json', 'A seeded or later-validated observation.'],
  ['opportunity_scenario', 'Opportunity Scenario', 'json', 'A leakage or value opportunity linked to evidence and diagnostics (workbook 09_OPPORTUNITY_SCENARIOS).'],
  ['evidence_item', 'Evidence Item', 'json', 'A benchmark, source, assumption, or client evidence reference (workbook 08_EVIDENCE_AND_ASSUMPTIONS).'],
  ['recommendation', 'Recommendation', 'json', 'A proposed action tied to a finding or scenario.'],
  ['proposal_outcome', 'Proposal Outcome', 'json', 'A target business effect.'],
  ['proposal_deliverable', 'Proposal Deliverable', 'json', 'A promised output of the MVP or Phase 1.'],
  ['implementation_phase', 'Implementation Phase', 'json', 'A bounded delivery stage.'],
  ['implementation_milestone', 'Implementation Milestone', 'json', 'A time-bound implementation checkpoint.'],
  ['proposal_assumption', 'Proposal Assumption', 'json', 'A declared input or limitation (workbook 08_EVIDENCE_AND_ASSUMPTIONS, ASM- rows).'],
  ['highway', 'Highway', 'json', 'Configured flow connecting journey stages and molecules — descriptive grouping metadata only, no gating behavior (workbook 03_HIGHWAYS).'],
]);

export function generateRecordMoleculeAtomDefinitions() {
  const now = Date.now();
  return {
    atoms: RECORD_MOLECULE_ATOMS.map(([atomKey, label, dataType, canonicalDefinition]) => ({ atomKey, label, dataType, canonicalDefinition })),
    now,
  };
}

// ── Proposal Decision — event-sourced, never a mutable "current decision"
// row. Mirrors eidosBonding.js's recordCurrentArc/reconstructLatestCurrentArc
// exactly, scoped to the proposal_experience rod. ───────────────────────────
export async function recordProposalDecision(rodId, { option, rationale = null, actorUserId = null, nextRoute = null }) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, to_stage, metadata, created_at)
    VALUES ($1, 'proposal_decision_selected', 'J08', $2::jsonb, $3)
  `).run(rodId, { option, rationale, actorUserId, nextRoute }, now);
  return { rodId, option, rationale, actorUserId, nextRoute, decidedAt: now };
}

export async function reconstructLatestDecision(rodId) {
  const row = await db.prepare(`
    SELECT * FROM journey_rod_events
    WHERE rod_id=$1 AND event_type='proposal_decision_selected'
    ORDER BY created_at DESC LIMIT 1
  `).get(rodId);
  if (!row) return null;
  const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
  return { ...meta, decidedAt: Number(row.created_at) };
}

// ── View State / completion signals — event-sourced (stage_viewed,
// scenario_expanded, evidence_opened). Reconstructed into a summary rather
// than stored as a second mutable "current view" row. ──────────────────────
const VIEW_EVENT_TYPES = Object.freeze(['stage_viewed', 'scenario_expanded', 'evidence_opened']);

export async function recordProposalViewEvent(rodId, eventType, { stageId = null, metadata = {} } = {}) {
  if (!VIEW_EVENT_TYPES.includes(eventType)) throw new Error(`Unknown proposal view event_type "${eventType}"`);
  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, to_stage, metadata, created_at)
    VALUES ($1, $2, $3, $4::jsonb, $5)
  `).run(rodId, eventType, stageId, metadata, now);
  return { rodId, eventType, stageId, metadata, recordedAt: now };
}

// Reconstructs { completedSignals: [...], lastStageViewed, expandedScenarios: [...], openedEvidence: [...] }
// from the event log — never a separately maintained "current state" row.
export async function reconstructViewState(rodId) {
  const rows = await db.prepare(`
    SELECT event_type, to_stage, metadata, created_at FROM journey_rod_events
    WHERE rod_id=$1 AND event_type = ANY($2::text[])
    ORDER BY created_at ASC
  `).all(rodId, VIEW_EVENT_TYPES);

  const stagesViewed = [];
  const expandedScenarios = new Set();
  const openedEvidence = new Set();
  let lastStageViewed = null;

  for (const row of rows) {
    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    if (row.event_type === 'stage_viewed') {
      lastStageViewed = row.to_stage;
      if (!stagesViewed.includes(row.to_stage)) stagesViewed.push(row.to_stage);
    } else if (row.event_type === 'scenario_expanded' && meta?.scenarioId) {
      expandedScenarios.add(meta.scenarioId);
    } else if (row.event_type === 'evidence_opened' && meta?.evidenceId) {
      openedEvidence.add(meta.evidenceId);
    }
  }

  return {
    stagesViewed,
    lastStageViewed,
    expandedScenarios: [...expandedScenarios],
    openedEvidence: [...openedEvidence],
  };
}
