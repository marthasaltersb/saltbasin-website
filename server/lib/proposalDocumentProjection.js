// Proposal Document Projection (2026-07-29) — compiles one member's
// proposal_experience Channel Rod into an executive/PDF-ready document object.
//
// Unlike resumeProjection.js and orgDocumentProjection.js (which write rows to
// their own satellite tables), this is a PURE read-side projection: it adds no
// table and persists nothing. Everything it returns is reconstructed from
// journey_rod_evidence (the record molecules) plus the journey_rod_events log
// (decision + view state), so the document can never drift from the rod.
import { db } from '../db.js';
import { PROPOSAL_JOURNEY_STAGES, reconstructLatestDecision, reconstructViewState } from './proposalExperienceRegistry.js';

export const ILLUSTRATIVE_DISCLAIMER =
  'Rates and opportunity categories shown here are illustrative, benchmark-informed ranges — not a scored result or a measurement of your own operations. A Phase 1 diagnostic validates exposure against your data before any number is used in a decision.';

export async function readRecordAtoms(rodId, moleculeKey) {
  const rows = await db.prepare(`SELECT source_reference, value, confidence, observed_at FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2 ORDER BY observed_at ASC`).all(rodId, moleculeKey);
  return rows.map((r) => {
    const record = (typeof r.value === 'string' ? JSON.parse(r.value) : r.value) || {};
    return {
      // Row-level ingest confidence goes first so a record's OWN field of the
      // same name wins: an Evidence Item's `confidence` is the benchmark's
      // "High"/"Medium"/"Low" rating, which is what the member is shown. The
      // journey_rod_evidence column is a separate numeric ingest confidence
      // (seeded rows are 1) and was previously clobbering it, rendering
      // "Confidence: 1" in the opportunity drawer.
      rowConfidence: r.confidence === null ? null : Number(r.confidence),
      ...record,
      // source_reference is the workbook's stable ID and stays authoritative
      // over anything inside the JSON blob (AC13).
      id: r.source_reference,
      observedAt: Number(r.observed_at),
    };
  });
}

const bySequence = (key) => (a, b) => (a[key] || 0) - (b[key] || 0);

export async function compileProposalDocument(rodId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='proposal_experience'`).get(rodId);
  if (!rod) throw new Error(`proposal_experience rod ${rodId} not found`);

  const [sections, scenes, modules, scenarios, evidence, highways, decision, viewState] = await Promise.all([
    readRecordAtoms(rodId, 'proposal_section'),
    readRecordAtoms(rodId, 'sales_narrative_scene'),
    readRecordAtoms(rodId, 'diagnostic_module'),
    readRecordAtoms(rodId, 'opportunity_scenario'),
    readRecordAtoms(rodId, 'evidence_item'),
    readRecordAtoms(rodId, 'highway'),
    reconstructLatestDecision(rodId),
    reconstructViewState(rodId),
  ]);

  const evidenceById = new Map(evidence.map((e) => [e.id, e]));
  const moduleById = new Map(modules.map((m) => [m.id, m]));

  sections.sort(bySequence('presentationOrder'));
  scenes.sort(bySequence('sequence'));
  modules.sort(bySequence('sequence'));

  const chapters = PROPOSAL_JOURNEY_STAGES.map((stage) => ({
    stageId: stage.stageId,
    sequence: stage.sequence,
    name: stage.name,
    purpose: stage.purpose,
    sections: sections.filter((s) => s.stageId === stage.stageId),
    scenes: scenes.filter((s) => s.stageId === stage.stageId),
  })).filter((c) => c.sections.length || c.scenes.length);

  // Scenarios carry rate ranges against a named exposure BASIS ("Renewable
  // ARR"), never the basis amount itself — so there is deliberately no dollar
  // figure computed here. Multiplying these rates by an assumed revenue number
  // would fabricate a LoneTree-specific leakage claim the evidence does not
  // support; the document presents the rate band and the basis label instead.
  const opportunityScenarios = scenarios.map((s) => ({
    ...s,
    rateBand: { low: s.lowRate ?? null, base: s.baseRate ?? null, high: s.highRate ?? null },
    evidence: (s.evidenceIds || []).map((id) => evidenceById.get(id)).filter(Boolean),
    diagnosticModules: (s.diagnosticModuleIds || []).map((id) => moduleById.get(id)).filter(Boolean),
  }));

  const records = [...sections, ...scenes, ...modules, ...scenarios, ...evidence];
  const illustrative = records.some((r) => r.illustrativeFlag === true);
  const durationDays = modules.reduce((sum, m) => sum + (Number(m.durationDays) || 0), 0);

  return {
    rodId: rod.id,
    currentStage: rod.current_stage,
    compiledAt: Date.now(),
    isEmpty: records.length === 0,
    illustrative,
    disclaimer: illustrative ? ILLUSTRATIVE_DISCLAIMER : null,
    chapters,
    diagnostic: { modules, totalDurationDays: durationDays },
    opportunity: { scenarios: opportunityScenarios },
    evidenceAppendix: evidence,
    highways,
    decision,
    viewState,
    counts: {
      sections: sections.length,
      scenes: scenes.length,
      diagnosticModules: modules.length,
      opportunityScenarios: scenarios.length,
      evidenceItems: evidence.length,
      highways: highways.length,
    },
  };
}
