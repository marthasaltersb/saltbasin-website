// Every job opportunity gets a cover letter (2026-10-02).
//
// When a career_opportunity_target rod is created, a deterministic template draft is filed
// into the member's outputs as a resume_output_projections row (output_type 'cover_letter',
// source 'generated', document_blocks v1). Lineage is per opportunity: preset_id
// 'cover_letter:opp-<rodId>', so every later version (regenerate, agent edit) joins the same
// lineage and the approved version is never edited in place.
//
// INTEGRATION HOOK (opportunity link): the link between an output and its opportunity is
// resolved in exactly two helpers here — `findOpportunityLetter()` (read) and the
// `careerOpportunityRodId` argument to createResumeOutputProjection() in
// `ensureCoverLetterForOpportunity()` (write). If the World Shell branch replaces
// career_opportunity_rod_id with a link table, change only those two spots (plus
// packageMemberRows() in packageSearch.js and collectPackageSections() in packageAssembly.js).
import { db } from '../db.js';
import { createResumeOutputProjection } from './resumeProjection.js';
import { getLinkedEntities } from './tributaryRegistry.js';
import { onOpportunityCreated } from './opportunityHooks.js';
import { getSettings, buildCoverLetterContent, loadLetterInputs } from './coverLetterTemplate.js';

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

export function letterPresetId(rodId) { return `cover_letter:opp-${rodId}`; }

/** Owned opportunity rod + its job-rec fields. Throws if the rod is not this member's. */
export async function loadOpportunity(userId, rodId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1 AND rod_type='career_opportunity_target'`).get(rodId);
  if (!rod) throw new Error('Career opportunity not found.');
  const careerRod = await db.prepare(`SELECT user_id FROM journey_data_rods WHERE id=$1`).get(rod.parent_rod_id);
  if (!careerRod || Number(careerRod.user_id) !== Number(userId)) throw new Error('Not your career opportunity.');
  const md = parseJson(rod.metadata) || {};
  const entities = await getLinkedEntities(rodId);
  return {
    rodId: Number(rodId), stage: rod.current_stage,
    jobTitle: md.jobTitle || '', notes: md.notes || '', url: md.url || '', location: md.location || '',
    company: entities[0]?.canonical_name || md.companyName || '',
  };
}

/** Attaches (or clears) the job-rec text — the posting — on the opportunity; later drafts and the agent's search use it. */
export async function setJobRecText(userId, rodId, text) {
  await loadOpportunity(userId, rodId); // ownership
  const value = String(text ?? '').trim();
  if (value.length > 20000) throw new Error('Job rec text is limited to 20,000 characters.');
  await db.prepare(`UPDATE journey_data_rods SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb, updated_at=$2 WHERE id=$3`)
    .run({ notes: value || null }, Date.now(), rodId);
  await recordEvent(rodId, 'job_rec_text_updated', { characters: value.length });
  return { characters: value.length };
}

/** READ side of the opportunity link: the newest cover-letter version for this opportunity. */
export async function findOpportunityLetter(userId, rodId) {
  return db.prepare(`
    SELECT * FROM resume_output_projections
     WHERE user_id=$1 AND career_opportunity_rod_id=$2 AND output_type='cover_letter' AND output_status<>'archived'
     ORDER BY id DESC LIMIT 1
  `).get(userId, rodId);
}

async function recordEvent(rodId, eventType, metadata) {
  await db.prepare(`INSERT INTO journey_rod_events (rod_id, event_type, metadata, created_at) VALUES ($1,$2,$3::jsonb,$4)`)
    .run(rodId, eventType, metadata, Date.now());
}

/**
 * Files (or, with force, re-files as a new draft version) the template cover letter for an
 * opportunity. Without force an existing letter is returned untouched.
 */
export async function ensureCoverLetterForOpportunity(userId, rodId, { force = false } = {}) {
  const opp = await loadOpportunity(userId, rodId);
  const existing = await findOpportunityLetter(userId, rodId);
  if (existing && !force) return { created: false, row: existing };
  const [settings, inputs] = await Promise.all([getSettings(userId), loadLetterInputs(userId)]);
  const content = buildCoverLetterContent({ member: inputs.member, opportunity: opp, career: inputs.career, settings });
  const rec = [opp.jobTitle, opp.notes].filter(Boolean).join('\n\n');
  const row = await createResumeOutputProjection(userId, {
    presetId: letterPresetId(rodId),
    presetName: `Cover Letter — ${opp.jobTitle || 'Role'}${opp.company ? ` at ${opp.company}` : ''}`,
    careerOpportunityRodId: Number(rodId),
    generatedContent: content,
    outputType: 'cover_letter',
    source: 'generated',
    authors: [inputs.member.name].filter(Boolean),
    regenerateFromId: existing ? Number(existing.id) : null,
  });
  // Stored directly (not via createResumeOutputProjection's targetJobDescription) so filing
  // a draft never triggers the LLM-backed resume targeting pass.
  await db.prepare(`UPDATE resume_output_projections SET target_job_description=$1 WHERE id=$2`).run(rec || null, row.id);
  await recordEvent(rodId, 'cover_letter_drafted', { projectionId: Number(row.id), method: 'template', force, jobRecThin: !opp.notes });
  return { created: true, row: { ...row, target_job_description: rec || null } };
}

/** Failure of the automatic draft, visible to the member — never swallowed. */
export async function latestAutoDraftError(rodId) {
  const ev = await db.prepare(`
    SELECT event_type, metadata, created_at FROM journey_rod_events
     WHERE rod_id=$1 AND event_type IN ('cover_letter_drafted','cover_letter_autodraft_failed') ORDER BY id DESC LIMIT 1
  `).get(rodId);
  if (ev?.event_type !== 'cover_letter_autodraft_failed') return null;
  return { message: parseJson(ev.metadata)?.error || 'unknown error', at: Number(ev.created_at) };
}

onOpportunityCreated(async ({ userId, rodId }) => {
  try {
    const settings = await getSettings(userId);
    if (!settings.autoDraft) return;
    await ensureCoverLetterForOpportunity(userId, rodId);
  } catch (e) {
    console.error('[coverLetterAutoDraft] automatic draft failed:', e.message);
    await recordEvent(rodId, 'cover_letter_autodraft_failed', { error: e.message }).catch((err) => console.error('[coverLetterAutoDraft] could not record failure:', err.message));
  }
});
