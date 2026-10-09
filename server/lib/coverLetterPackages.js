// Shared by GET /api/cover-letters/opportunities and the cover_letter_opportunities_list MCP tool,
// so the website, API and MCP read the same letter/package state.
import { listCareerOpportunities } from './careerOpportunityRollups.js';
import { latestAutoDraftError } from './coverLetterAutoDraft.js';
import { peekOpportunityPackage } from './packageAssembly.js';

export const rowView = (r) => (r ? { id: Number(r.id), name: r.preset_name, status: r.output_status, outputType: r.output_type, createdAt: Number(r.created_at), approvedAt: r.approved_at != null ? Number(r.approved_at) : null } : null);

export async function listOpportunityPackages(userId) {
  const { opportunities } = await listCareerOpportunities(userId);
  const out = [];
  for (const o of opportunities) {
    const peek = await peekOpportunityPackage(userId, o.id);
    out.push({
      id: o.id, stage: o.currentStage, jobTitle: o.metadata?.jobTitle || '', company: o.entities?.[0]?.canonicalName || '',
      hasJobRecText: !!o.metadata?.notes, jobRecText: o.metadata?.notes || '',
      letter: rowView(peek.letter), resumes: peek.resumes.map(rowView),
      combined: rowView(peek.combined), combinedCurrent: peek.combinedCurrent,
      autoDraftError: peek.letter ? null : await latestAutoDraftError(o.id),
    });
  }
  return out;
}
