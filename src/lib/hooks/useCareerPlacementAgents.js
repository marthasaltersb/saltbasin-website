import { api } from '../api.js';
import { toast } from '../toast.js';
import { useOpportunityPipeline } from './useOpportunityPipeline.js';

export const CAREER_DIMENSION_FIELDS = [
  { key: 'scope_altitude', label: 'Role scope & altitude' },
  { key: 'strategic_ops_transformation', label: 'Strategic ops & transformation' },
  { key: 'revenue_systems_q2r', label: 'Revenue systems / Q2R' },
  { key: 'ai_validation_data_intel', label: 'AI validation & data intelligence' },
  { key: 'pe_value_creation_finance', label: 'PE / value creation / finance' },
  { key: 'leadership_stakeholder_fit', label: 'Leadership & stakeholder fit' },
  { key: 'transferable_industry_fit', label: 'Transferable industry fit' },
  { key: 'practical_fit', label: 'Practical fit' },
];

const INITIAL_ADD_FORM = { jobTitle: '', companyName: '', url: '', location: '' };

function buildCreatePayload(addForm) {
  if (!addForm.jobTitle.trim()) { toast('Job title is required.'); return null; }
  return {
    jobTitle: addForm.jobTitle.trim(),
    companyName: addForm.companyName.trim() || null,
    url: addForm.url.trim() || null,
    location: addForm.location.trim() || null,
  };
}

export function useCareerPlacementAgents({ enabled = true } = {}) {
  return useOpportunityPipeline({
    getHub: api.getCareerAgentHub,
    listOpportunities: api.listCareerOpportunities,
    createOpportunity: api.createCareerOpportunity,
    scoreOpportunity: api.scoreCareerOpportunity,
    buildCreatePayload,
    initialAddForm: INITIAL_ADD_FORM,
    dimensionFields: CAREER_DIMENSION_FIELDS,
    itemLabel: (o) => o.metadata.jobTitle,
    pipelineLabel: 'Career Placement Agents',
    enabled,
  });
}
