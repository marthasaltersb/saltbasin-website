import { api } from '../api.js';
import { toast } from '../toast.js';
import { useOpportunityPipeline } from './useOpportunityPipeline.js';

export const COMMERCIAL_DIMENSION_FIELDS = [
  { key: 'trigger_strength', label: 'Trigger strength' },
  { key: 'solution_fit', label: 'Salt Basin problem/solution fit' },
  { key: 'economic_materiality', label: 'Economic materiality' },
  { key: 'timing_urgency', label: 'Timing & urgency' },
  { key: 'access_relationship_path', label: 'Access & relationship path' },
  { key: 'evidence_gap_plausibility', label: 'Evidence gap plausibility' },
  { key: 'serviceability', label: 'Serviceability' },
];

export const EXPANSION_RING_OPTIONS = [
  { value: '', label: '— none (Ring 0, canonical target) —' },
  { value: 'ring_1', label: 'Ring 1 — Ownership graph' },
  { value: 'ring_2', label: 'Ring 2 — Business-model peers' },
  { value: 'ring_3', label: 'Ring 3 — Event peers' },
  { value: 'ring_4', label: 'Ring 4 — Talent peers' },
  { value: 'ring_5', label: 'Ring 5 — Ecosystem routes' },
];

const INITIAL_ADD_FORM = { companyName: '', eventTrigger: '', hypothesis: '', expansionRing: '', parentEntityName: '', reason: '' };

function buildCreatePayload(addForm) {
  if (!addForm.companyName.trim()) { toast('Company name is required.'); return null; }
  return {
    companyName: addForm.companyName.trim(),
    eventTrigger: addForm.eventTrigger.trim() || null,
    hypothesis: addForm.hypothesis.trim() || null,
    expansionRing: addForm.expansionRing || null,
    parentEntityName: addForm.parentEntityName.trim() || null,
    reason: addForm.reason.trim() || null,
  };
}

export function useCommercialOpportunities({ enabled = true } = {}) {
  return useOpportunityPipeline({
    getHub: api.getCommercialAgentHub,
    listOpportunities: api.listCommercialOpportunities,
    createOpportunity: api.createCommercialOpportunity,
    scoreOpportunity: api.scoreCommercialOpportunity,
    buildCreatePayload,
    initialAddForm: INITIAL_ADD_FORM,
    dimensionFields: COMMERCIAL_DIMENSION_FIELDS,
    itemLabel: (o) => o.metadata.companyName,
    pipelineLabel: 'Commercial Opportunity Pipeline',
    enabled,
  });
}
