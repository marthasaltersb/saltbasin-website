import { useState } from 'react';
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

// Real, on-demand job research + resume generation (2026-08-07) — layered on
// top of the shared useOpportunityPipeline (add/select/score) rather than
// folded into it, since these two actions are career-specific and would
// have no meaning for the commercial pipeline that hook also serves.
export function useCareerPlacementAgents({ enabled = true } = {}) {
  const pipeline = useOpportunityPipeline({
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

  const [runningResearch, setRunningResearch] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [resumeReview, setResumeReview] = useState(null); // { content, jobDescriptionUsed } — pending human approval
  const [approvingResume, setApprovingResume] = useState(false);
  const [importingPipeline, setImportingPipeline] = useState(false);
  const [generatingQueue, setGeneratingQueue] = useState(false);

  async function generateQueue(limit = 10) {
    setGeneratingQueue(true);
    try {
      const result = await api.generateResumeQueue(limit);
      toast(`Generated ${result.generated} resume draft(s)${result.attempted > result.generated ? ` — see My Resume for details on the rest` : ''}. Review them in My Resume → Resume Output History.`);
      pipeline.reload();
      return result;
    } catch (e) {
      toast('Resume queue generation failed: ' + e.message);
      return null;
    } finally {
      setGeneratingQueue(false);
    }
  }

  async function importPipeline(file) {
    setImportingPipeline(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.importCareerPipelineWorkbook(formData);
      toast(`Imported ${result.imported} opportunit${result.imported === 1 ? 'y' : 'ies'}${result.skipped ? `, skipped ${result.skipped} already-tracked` : ''}.`);
      if (result.errors?.length) toast(`${result.errors.length} row(s) failed to import — see console.`);
      if (result.errors?.length) console.warn('[career pipeline import] row errors:', result.errors);
      pipeline.reload();
      return result;
    } catch (e) {
      toast('Pipeline import failed: ' + e.message);
      return null;
    } finally {
      setImportingPipeline(false);
    }
  }

  async function runResearch() {
    setRunningResearch(true);
    try {
      const { opportunities } = await api.runCareerResearch();
      if (opportunities.length) {
        toast(`Job research found ${opportunities.length} real posting(s) — review before treating as tracked.`);
        pipeline.reload();
      } else {
        toast('Job research found no new matching postings this run.');
      }
    } catch (e) {
      toast('Job research failed: ' + e.message);
    } finally {
      setRunningResearch(false);
    }
  }

  async function generateResume(opportunityId, jobDescription) {
    setGeneratingResume(true);
    setResumeReview(null);
    try {
      const result = await api.generateResumeForOpportunity(opportunityId, { jobDescription });
      setResumeReview(result);
    } catch (e) {
      toast('Resume generation failed: ' + e.message);
    } finally {
      setGeneratingResume(false);
    }
  }

  async function approveResume(opportunityId) {
    if (!resumeReview) return;
    setApprovingResume(true);
    try {
      await api.approveResumeForOpportunity(opportunityId, {
        generatedContent: resumeReview.content,
        targetJobDescription: resumeReview.jobDescriptionUsed,
      });
      toast('Resume approved and saved.');
      setResumeReview(null);
    } catch (e) {
      toast('Could not save approved resume: ' + e.message);
    } finally {
      setApprovingResume(false);
    }
  }

  function discardResumeReview() {
    setResumeReview(null);
  }

  return {
    ...pipeline,
    runningResearch, runResearch,
    generatingResume, resumeReview, generateResume, discardResumeReview,
    approvingResume, approveResume,
    importingPipeline, importPipeline,
    generatingQueue, generateQueue,
  };
}
