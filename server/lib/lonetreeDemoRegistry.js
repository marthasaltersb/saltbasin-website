// Lonetree Fund MVP demo registry (2026-07-29). Betsy's Lonetree demo spec
// (Market Universe -> Exit Highway, PortCo commercial reconciliation) needs
// two new governed concepts — Signal and Business Hypothesis (OBJ-013/
// OBJ-014, Salt_Basin_Expanded_Semantic_Scenario_and_Business_Instance_
// Model_v0.2.xlsx) — plus a canonical event vocabulary for the scripted
// demonstration chain (usage decline -> ... -> fund economics).
//
// Per the registry's "Reuse-first architecture law"
// (docs/salt-basin-foundation-source-of-truth.registry.json,
// rule-reuse-first-architecture): Signal and Business Hypothesis are new
// Atom/Molecule definitions in the existing journey_metadata_molecules/
// journey_metadata_clusters substrate (same mechanism Career Atoms already
// use), not new bespoke tables. Instances are journey_rod_evidence rows
// against a rod's signal/business_hypothesis molecule_keys, exactly like
// every other governed Atom value. Events are journey_rod_events rows using
// the event_type strings below — journey_rod_events.event_type is already
// free TEXT, so no schema change, only a shared vocabulary so every writer
// (seed script, reconciliation engine, demo event-chain trigger) agrees on
// the same strings.

export const SIGNAL_ATOMS = Object.freeze([
  ['signal_type', 'Signal Type', 'text', 'The category of change or anomaly this Signal observes (e.g. usage_decline, invoice_dispute_risk, adoption_drop).'],
  ['signal_baseline', 'Signal Baseline', 'decimal', 'The expected/historical value the Signal is measured against.'],
  ['signal_variance', 'Signal Variance', 'decimal', 'The observed deviation from baseline that triggered the Signal.'],
  ['signal_confidence', 'Signal Confidence', 'percentage', 'Confidence that the observed variance is real and not noise.'],
  ['signal_status', 'Signal Status', 'enum', 'open | investigating | resolved.'],
  ['signal_affected_structures', 'Signal Affected Structures', 'json', 'References to the Channel Rods, Molecules, or metrics this Signal may implicate.'],
]);

export const BUSINESS_HYPOTHESIS_ATOMS = Object.freeze([
  ['hypothesis_statement', 'Hypothesis Statement', 'text', 'The proposed explanation linking one or more Signals to a possible cause.'],
  ['hypothesis_supporting_signals', 'Hypothesis Supporting Signals', 'json', 'References to the Signal evidence rows this hypothesis is built from.'],
  ['hypothesis_probable_causes', 'Hypothesis Probable Causes', 'text', 'Candidate root causes under evaluation.'],
  ['hypothesis_potential_impacts', 'Hypothesis Potential Impacts', 'text', 'What changes downstream if this hypothesis is confirmed.'],
  ['hypothesis_status', 'Hypothesis Status', 'enum', 'created | investigating | confirmed | rejected | inconclusive.'],
  ['hypothesis_confidence', 'Hypothesis Confidence', 'percentage', 'Confidence the hypothesis is correct, updated as evidence accumulates.'],
]);

export function generateSignalMoleculeDefinitions() {
  const now = Date.now();
  return {
    atoms: SIGNAL_ATOMS.map(([atomKey, label, dataType, canonicalDefinition]) => ({ atomKey, label, dataType, canonicalDefinition })),
    cluster: {
      clusterKey: 'signal',
      label: 'Signal',
      description: 'Evidence-backed observation of change or anomaly that may imply future business events. Per OBJ-013.',
      atomKeys: SIGNAL_ATOMS.map(([atomKey]) => atomKey),
    },
    now,
  };
}

export function generateBusinessHypothesisMoleculeDefinitions() {
  const now = Date.now();
  return {
    atoms: BUSINESS_HYPOTHESIS_ATOMS.map(([atomKey, label, dataType, canonicalDefinition]) => ({ atomKey, label, dataType, canonicalDefinition })),
    cluster: {
      clusterKey: 'business_hypothesis',
      label: 'Business Hypothesis',
      description: 'Governed hypothesis linking Signals to possible causes, impacts, and validation actions. Per OBJ-014.',
      atomKeys: BUSINESS_HYPOTHESIS_ATOMS.map(([atomKey]) => atomKey),
    },
    now,
  };
}

// Canonical event_type vocabulary for the Lonetree demonstration chain.
// Matches Event_Registry (EVT-001..EVT-019) from the same workbook, scoped
// to the specific narrative Betsy's MVP spec calls for:
//   usage decline -> Signal -> Business Hypothesis -> Evidence ->
//   Customer Success Initiative -> Commercial Amendment Recommendation ->
//   Accounting Forecast Updated -> Revenue Projection Change ->
//   EBITDA Change -> Enterprise Value Change ->
//   Investment Thesis Confidence Change -> Fund Economics Change
export const LONETREE_EVENT_TYPES = Object.freeze({
  USAGE_ANOMALY_DETECTED: 'usage_anomaly_detected',
  SIGNAL_DETECTED: 'signal_detected',
  HYPOTHESIS_CREATED: 'hypothesis_created',
  EVIDENCE_COLLECTED: 'evidence_collected',
  HYPOTHESIS_VALIDATED: 'hypothesis_validated',
  CS_INITIATIVE_STARTED: 'cs_initiative_started',
  AMENDMENT_RECOMMENDED: 'amendment_recommended',
  ACCOUNTING_FORECAST_UPDATED: 'accounting_forecast_updated',
  REVENUE_PROJECTION_CHANGED: 'revenue_projection_changed',
  EBITDA_CHANGED: 'ebitda_changed',
  ENTERPRISE_VALUE_CHANGED: 'enterprise_value_changed',
  THESIS_CONFIDENCE_CHANGED: 'thesis_confidence_changed',
  FUND_ECONOMICS_CHANGED: 'fund_economics_changed',
});

// The Fund Highway's canonical Market Universe -> Exit stage sequence
// (Betsy's MVP 1 spec), used both to seed the demo Fund Rod's stage history
// and to drive the Orbit world's rendering order.
export const FUND_HIGHWAY_STAGES = Object.freeze([
  'market_universe', 'target_universe', 'investment_thesis', 'target_screening',
  'pipeline', 'due_diligence', 'investment_committee', 'acquisition',
  'integration', 'portfolio_company', 'commercial', 'revenue', 'finance',
  'value_creation', 'fund_economics', 'exit',
]);

// The seven Highways a Portfolio Company world exposes per MVP 2.
export const PORTCO_HIGHWAYS = Object.freeze([
  'commercial', 'customer', 'revenue', 'finance', 'operations', 'evidence', 'value_creation',
]);

// Record-level Atom definitions for the PortCo commercial/reconciliation
// chain and the Fund layer, sourced from Betsy's real seed workbook
// (Salt_Basin_LoneTree_MVP_Executable_Repository_v1.0.xlsx ->
// server/data/lonetreeMvpSeed/repository.json). Per the reuse-first law,
// these are new Atom definitions in the existing journey_metadata_molecules
// substrate (no new tables) — one atom per business-object TYPE (not per
// field): each instance is a journey_rod_evidence row with value=the full
// source row as JSON and source_reference=the workbook's own stable ID
// (e.g. "CTR-001"), so the exact row identity and every field survive for
// click-to-trace-backward, exactly like Career Atoms' multi-entry pattern.
export const RECORD_ATOMS = Object.freeze([
  ['market_target', 'Market Target', 'json', 'An acquisition target evaluated against LoneTree investment criteria (MVP_04_Targets).'],
  ['investment_thesis', 'Investment Thesis', 'json', 'A governed, evidence-backed value-creation thesis (MVP_05_Investment_Thesis).'],
  ['commercial_product', 'Commercial Product', 'json', 'A PortCo product/pricing definition (MVP_10_PortCo_Products).'],
  ['commercial_customer', 'Commercial Customer', 'json', 'A PortCo customer record (MVP_11_PortCo_Customers).'],
  ['commercial_contract', 'Commercial Contract', 'json', 'A PortCo customer contract (MVP_12_Contracts).'],
  ['commercial_usage_event', 'Commercial Usage Event', 'json', 'An authoritative operational usage event driving invoices/signals (MVP_13_Usage_Events).'],
  ['commercial_invoice', 'Commercial Invoice', 'json', 'An invoice/AR record derived from a usage event (MVP_14_Invoices_AR).'],
  ['commercial_revenue_schedule', 'Commercial Revenue Schedule', 'json', 'A recognized/scheduled revenue record linked to an invoice (MVP_15_Revenue_Schedules).'],
  ['commercial_gl_entry', 'Commercial GL Entry', 'json', 'A double-entry journal line reconciling invoice/revenue/cash to the GL (MVP_16_GL_Entries).'],
  ['fund_value_creation_initiative', 'Fund Value Creation Initiative', 'json', 'A governed value-creation initiative with expected EBITDA/EV impact (MVP_19_Value_Creation).'],
  ['fund_economics_input', 'Fund Economics Input', 'json', 'A fund-economics input or calculated output (purchase EV, debt, multiples, MOIC/IRR) (MVP_22_Fund_Economics).'],
]);

export function generateRecordAtomDefinitions() {
  const now = Date.now();
  return {
    atoms: RECORD_ATOMS.map(([atomKey, label, dataType, canonicalDefinition]) => ({ atomKey, label, dataType, canonicalDefinition })),
    now,
  };
}
