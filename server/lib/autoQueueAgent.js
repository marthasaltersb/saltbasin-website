// Auto-queue agent (2026-08-09) — "an automated queue to generate resumes
// and cover letters for any newly approved job roles from the research."
// Orchestrates existing pieces (never a parallel write path): finds
// approved career_opportunity_target rods lacking a resume and/or cover
// letter projection, generates each via the existing evidence-grounded
// generators, and persists straight into resume_output_projections (draft
// status) — same "queue for review, not synchronous approval click" model
// as the manual Generate Resume Queue, extended to also cover cover
// letters and to trigger off approval rather than priority ranking.
//
// On-demand (a human clicks it) or dispatcher-triggered (agentDispatcher.js,
// agent_key resume_generator, action_key auto_queue_on_approval) — same
// function either way.
import { listCareerOpportunities } from './careerOpportunityRollups.js';
import { generateResumeContent } from './resumeTargeting.js';
import { generateCoverLetterContent } from './coverLetterTargeting.js';
import { createResumeOutputProjection, listResumeOutputProjections } from './resumeProjection.js';

export async function autoQueueOutputsForNewlyApproved(userId) {
  const { opportunities } = await listCareerOpportunities(userId);
  const approved = opportunities.filter((o) => o.currentStage === 'approved');
  const existing = await listResumeOutputProjections(userId);
  const hasOutput = (rodId, outputType) => existing.some((p) => p.careerOpportunityRodId === rodId && p.outputType === outputType);

  const results = [];
  let stopped = false;

  for (const o of approved) {
    if (stopped) break;
    const jobDescription = o.metadata?.notes || o.metadata?.matchRationale || o.metadata?.jobTitle || '';
    const jobTitle = o.metadata?.jobTitle || 'Untitled role';

    if (!hasOutput(o.id, 'resume')) {
      try {
        const content = await generateResumeContent(userId, jobDescription);
        const projection = await createResumeOutputProjection(userId, {
          presetId: 'agent_generated_auto_queue',
          presetName: `Agent-Generated Resume — ${jobTitle}`,
          careerOpportunityRodId: o.id,
          generatedContent: content,
          targetJobDescription: jobDescription,
          outputType: 'resume',
        });
        results.push({ opportunityId: o.id, jobTitle, outputType: 'resume', status: 'generated', projectionId: projection.id });
      } catch (e) {
        results.push({ opportunityId: o.id, jobTitle, outputType: 'resume', status: 'failed', error: e.message });
        stopped = true;
        break;
      }
    }

    if (!hasOutput(o.id, 'cover_letter')) {
      try {
        const content = await generateCoverLetterContent(userId, jobDescription);
        const projection = await createResumeOutputProjection(userId, {
          presetId: 'agent_generated_auto_queue',
          presetName: `Agent-Generated Cover Letter — ${jobTitle}`,
          careerOpportunityRodId: o.id,
          generatedContent: content,
          targetJobDescription: jobDescription,
          outputType: 'cover_letter',
        });
        results.push({ opportunityId: o.id, jobTitle, outputType: 'cover_letter', status: 'generated', projectionId: projection.id });
      } catch (e) {
        results.push({ opportunityId: o.id, jobTitle, outputType: 'cover_letter', status: 'failed', error: e.message });
        stopped = true;
        break;
      }
    }
  }

  return {
    approvedCount: approved.length,
    generated: results.filter((r) => r.status === 'generated').length,
    results,
  };
}
