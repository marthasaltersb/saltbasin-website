// Combined application package with a table of contents (2026-10-02).
//
// An application package is a set of outputs written for one opportunity (cover letter,
// resume variants, ...). Each stays its own output with its own lineage, view, PDF and QR.
// The COMBINED package is one more output (output_type 'application_package', preset id
// 'application_package:<packageKey>:combined') whose document_blocks content is assembled from
// the members' latest versions:
//
//   package header (name, role/company)  ->  "Contents" (numbered, page numbers + links in the PDF)
//   section 1: the cover letter  (always — it is filed first if the opportunity has none)
//   section 2..n: each resume / other output of the package
//
// Re-assembling files a new draft version in the combined output's lineage, so an approved
// combined package (and its QR) is never edited in place.
//
// INTEGRATION HOOK (opportunity link): membership of an opportunity's package is read in
// collectPackageSections() below (rows whose career_opportunity_rod_id matches, plus
// 'application_package:<key>:' siblings). Change only that query if the link moves.
import { db } from '../db.js';
import { createResumeOutputProjection } from './resumeProjection.js';
import { ensureCoverLetterForOpportunity, loadOpportunity, findOpportunityLetter } from './coverLetterAutoDraft.js';
import { toDocument } from './coverLetterAgent.js';

const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
export const combinedPresetId = (packageKey) => `application_package:${packageKey}:combined`;

/** Any stored output shape -> document blocks (headings/paragraphs/bullets). */
function blocksForSection(row) {
  const content = parseJson(row.generated_content) || {};
  if (content.format === 'document_blocks') return (content.blocks || []).filter((b) => b.type !== 'toc' && b.type !== 'section_start').map((b) => ({ ...b }));
  if (row.output_type === 'cover_letter' || content.openingHook) return toDocument(content).blocks;
  if (content.rawText) return toDocument(content).blocks;
  const blocks = [];
  if (content.professionalSummary) { blocks.push({ type: 'heading', text: 'SUMMARY' }, { type: 'paragraph', text: content.professionalSummary }); }
  for (const exp of content.selectedExperience || []) for (const b of exp.bullets || []) blocks.push({ type: 'bullet', text: b });
  if (content.emphasizedSkills?.length) blocks.push({ type: 'heading', text: 'SKILLS' }, { type: 'paragraph', text: content.emphasizedSkills.join(', ') });
  return blocks;
}

function latestPerLineage(rows) {
  const seen = new Set();
  const out = [];
  for (const r of [...rows].sort((a, b) => Number(b.id) - Number(a.id))) {
    const root = Number(r.lineage_root_id || r.id);
    if (seen.has(root)) continue;
    seen.add(root);
    out.push(r);
  }
  return out;
}

function sectionTitle(row) {
  if (row.output_type === 'cover_letter') return 'Cover letter';
  const name = (row.preset_name || '').replace(/^application_package:/, '').trim();
  return name || 'Resume';
}

/**
 * The member outputs a package is made of, cover letter first. `opportunityRodId` packages
 * always get a cover letter (filed from the template when missing); `packageKey` packages
 * (imported sets) must already contain one.
 */
export async function collectPackageSections(userId, { opportunityRodId = null, packageKey = null }) {
  let rows;
  let key;
  let opp = null;
  if (opportunityRodId != null) {
    opp = await loadOpportunity(userId, opportunityRodId);
    key = `opp-${opportunityRodId}`;
    if (!(await findOpportunityLetter(userId, opportunityRodId))) await ensureCoverLetterForOpportunity(userId, opportunityRodId);
    rows = await db.prepare(`
      SELECT * FROM resume_output_projections
       WHERE user_id=$1 AND career_opportunity_rod_id=$2 AND output_type IN ('cover_letter','resume')
         AND output_status<>'archived' AND generated_content IS NOT NULL
    `).all(userId, opportunityRodId);
  } else if (packageKey) {
    key = packageKey;
    rows = await db.prepare(`
      SELECT * FROM resume_output_projections
       WHERE user_id=$1 AND preset_id LIKE $2 AND preset_id<>$3 AND output_type IN ('cover_letter','resume')
         AND output_status<>'archived' AND generated_content IS NOT NULL
    `).all(userId, `application_package:${packageKey}:%`, combinedPresetId(packageKey));
  } else {
    throw new Error('Choose an opportunity or a package key to assemble.');
  }
  const members = latestPerLineage(rows);
  const letters = members.filter((r) => r.output_type === 'cover_letter');
  if (!letters.length) {
    throw new Error('This package has no cover letter. Every application package must include one — create it from the opportunity first.');
  }
  const ordered = [letters[0], ...members.filter((r) => r !== letters[0] && r.output_type !== 'cover_letter').sort((a, b) => Number(a.id) - Number(b.id))];
  return { key, opp, sections: ordered };
}

export function buildCombinedContent({ member, opp, sections, key, now = Date.now() }) {
  const roleLine = [opp?.jobTitle, opp?.company].filter(Boolean).join(' — ');
  const blocks = [
    { type: 'paragraph', text: roleLine ? `Application package: ${roleLine}` : 'Application package', emphasis: 'bold' },
    { type: 'paragraph', text: `Prepared ${new Date(now).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`, emphasis: 'italic' },
    { type: 'heading', text: 'CONTENTS' },
    { type: 'toc' },
  ];
  const meta = [];
  sections.forEach((row, i) => {
    const anchor = `sec-${i + 1}`;
    const title = sectionTitle(row);
    blocks.push({ type: 'section_start', title, anchor, number: i + 1, sourceOutputId: Number(row.id) });
    blocks.push(...blocksForSection(row));
    meta.push({ number: i + 1, anchor, title, outputId: Number(row.id), lineageRootId: Number(row.lineage_root_id || row.id), outputType: row.output_type, status: row.output_status });
  });
  return {
    format: 'document_blocks', version: 1,
    header: { name: member.name, headline: roleLine ? `APPLICATION PACKAGE — ${roleLine.toUpperCase()}` : 'APPLICATION PACKAGE', contact: member.email },
    package: { kind: 'application_package', packageKey: key, title: roleLine || 'Application package', sections: meta },
    blocks,
  };
}

/** The combined output for a package, newest version. */
export async function findCombined(userId, key) {
  return db.prepare(`
    SELECT * FROM resume_output_projections
     WHERE user_id=$1 AND preset_id=$2 AND output_status<>'archived' ORDER BY id DESC LIMIT 1
  `).get(userId, combinedPresetId(key));
}

/** Does the filed combined package still reflect its members' latest versions? */
export function combinedIsCurrent(combinedRow, sections) {
  const content = parseJson(combinedRow.generated_content);
  const filed = (content?.package?.sections || []).map((s) => s.outputId);
  const now = sections.map((r) => Number(r.id));
  return filed.length === now.length && filed.every((id, i) => id === now[i]);
}

/** Assembles (or re-assembles) the combined package; unchanged members file nothing new. */
export async function assembleApplicationPackage(userId, { opportunityRodId = null, packageKey = null }) {
  const { key, opp, sections } = await collectPackageSections(userId, { opportunityRodId, packageKey });
  const existing = await findCombined(userId, key);
  if (existing && combinedIsCurrent(existing, sections)) return { status: 'unchanged', row: existing, sections: sections.length };
  const user = await db.prepare(`SELECT display_name, email FROM users WHERE id=$1`).get(userId);
  const member = { name: (user?.display_name || '').trim() || String(user?.email || '').split('@')[0], email: user?.email || '' };
  const content = buildCombinedContent({ member, opp, sections, key });
  const cover = sections[0];
  const row = await createResumeOutputProjection(userId, {
    presetId: combinedPresetId(key),
    presetName: `Application Package — ${opp?.jobTitle || 'Package'}${opp?.company ? ` at ${opp.company}` : ''}`,
    careerOpportunityRodId: opportunityRodId != null ? Number(opportunityRodId) : (cover.career_opportunity_rod_id != null ? Number(cover.career_opportunity_rod_id) : null),
    generatedContent: content, outputType: 'application_package', source: 'generated',
    authors: [member.name].filter(Boolean), regenerateFromId: existing ? Number(existing.id) : null,
  });
  return { status: existing ? 'new_version' : 'created', row, sections: sections.length };
}

/** Read-only view of an opportunity's package for list screens (never files anything). */
export async function peekOpportunityPackage(userId, opportunityRodId) {
  const rows = await db.prepare(`
    SELECT * FROM resume_output_projections
     WHERE user_id=$1 AND career_opportunity_rod_id=$2 AND output_type IN ('cover_letter','resume')
       AND output_status<>'archived' AND generated_content IS NOT NULL
  `).all(userId, opportunityRodId);
  const members = latestPerLineage(rows);
  const letter = members.find((r) => r.output_type === 'cover_letter') || null;
  const resumes = members.filter((r) => r.output_type !== 'cover_letter').sort((a, b) => Number(a.id) - Number(b.id));
  const combined = await findCombined(userId, `opp-${opportunityRodId}`);
  const ordered = letter ? [letter, ...resumes] : resumes;
  return { letter, resumes, combined, combinedCurrent: combined && letter ? combinedIsCurrent(combined, ordered) : null };
}
