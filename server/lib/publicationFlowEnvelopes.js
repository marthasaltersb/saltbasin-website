// Registers the Publication journey's per-pipeline flow config (criteria,
// stages, output destination, observation-gating) as Config Envelopes (see
// configEnvelope.js) rather than forcing it into journey_current_definitions
// — that table's entry_criteria shape is a real, reusable pattern for
// scoring/cadence Currents, but its `rod_type` column is a hard FK into
// journey_rod_types, and HERQ/marketing-ads/research-reports content lives
// in unified_content_items/unified_outputs, not journey_data_rods. Forcing a
// rod_type registration just to satisfy that FK would be a fit discovered
// too late, not real reuse — the Config Envelope engine is the actual match:
// same "admin-editable at runtime without an engineer" goal, no Channel Rod
// coupling. Import this module once for its registration side effects (see
// server/routes/configEnvelopes.js, same convention as methodologyEnvelopes.js).
//
// Only 'herq' is registered so far (2026-08-07) — 'marketing_ads' and
// 'research_reports' are real, described pipelines (Betsy's spec: on-brand
// hook/CTA generation with AI images published to LinkedIn on a calendar;
// public-search/forum/private-connection/upload/survey-campaign research
// scopes) but have no content model or admin workflow behind them yet
// (confirmed by direct search — genuinely greenfield). Registering their
// envelopes ahead of any real surface to attach them to would be exactly the
// orphaned-schema problem this codebase's own docs warn against — add them
// when their island is actually built, following this identical pattern.

import { defineConfigEnvelope } from './configEnvelope.js';

const OUTPUT_DESTINATION_TYPES = ['salt_basin_site', 'linkedin', 'external'];

function validatePublicationFlow(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return ['must be an object'];
  if (!Array.isArray(value.criteria) || value.criteria.some((c) => typeof c !== 'string')) {
    errors.push('criteria must be an array of strings');
  }
  if (!Array.isArray(value.stages) || value.stages.some((s) => typeof s !== 'string')) {
    errors.push('stages must be an array of strings');
  }
  if (!value.outputDestination || typeof value.outputDestination !== 'object') {
    errors.push('outputDestination must be an object');
  } else if (!OUTPUT_DESTINATION_TYPES.includes(value.outputDestination.type)) {
    errors.push(`outputDestination.type must be one of ${OUTPUT_DESTINATION_TYPES.join(', ')}`);
  }
  if (!value.observation || typeof value.observation !== 'object' || typeof value.observation.required !== 'boolean') {
    errors.push('observation.required must be a boolean');
  }
  return errors;
}

defineConfigEnvelope({
  id: 'herq_publication_flow',
  label: 'HERQ Publication Flow',
  description: 'Research criteria, pipeline stages, output destination, and whether the HERQ Content & Publication Agent requires a triggering observation (e.g. a recorded Signal) before it acts, versus running on a plain schedule.',
  defaultValue: {
    criteria: [],
    // Mirrors unified_content_items.export_status's real observed values
    // (HerqPanel.jsx's STATUS_OPTIONS) — not a new taxonomy.
    stages: ['idea', 'drafting', 'scheduled', 'published', 'referenced', 'paused'],
    outputDestination: { type: 'salt_basin_site', detail: '' },
    observation: { required: false, moleculeKey: null },
  },
  validate: validatePublicationFlow,
});
