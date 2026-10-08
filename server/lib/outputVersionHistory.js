// Output version history (2026-10-02, release output-version-history).
//
// An output's versions are the resume_output_projections rows that share a
// lineage_root_id (a new row is filed whenever an approved/published version
// is edited, an imported package is re-imported with changes, or an output is
// regenerated). This module READS that lineage and presents each version as
// document blocks with its dates and approval record, so the screen can show
// a timeline slider and tracked changes between any two versions. It writes
// nothing and adds no table: the lineage is the history.
//
// Content shapes it understands (each is turned into document_blocks form):
//   document_blocks v1   used as stored
//   career_bound v1      an approved/published version uses the wording frozen
//                        at approval (shared_snapshot.document) when present;
//                        otherwise it is resolved against the CURRENT Career
//                        Master and labelled as such
//   anything else        agent-generated resume / cover letter / imported text
//                        is flattened to headings, paragraphs and bullets
import { db } from '../db.js';
import { isCareerBound, resolveCareerBound, publicBlocks } from './careerBound.js';
import { diffVersions, summarizeDiff } from '../../src/lib/outputVersionDiff.js';

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
  return v;
}

const humanize = (key) => String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// Flattens arbitrary generated content into blocks without inventing text:
// every string the content holds is shown once, under its key as a heading.
function flattenToBlocks(value, blocks, depth = 0) {
  if (value == null || value === '') return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    blocks.push({ type: 'paragraph', text: String(value) });
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') blocks.push({ type: 'bullet', text: item });
      else flattenToBlocks(item, blocks, depth + 1);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
      if (/id$/i.test(k) && typeof v !== 'object') continue; // citation ids are not reader text
      blocks.push({ type: depth === 0 ? 'heading' : 'paragraph', text: depth === 0 ? humanize(k).toUpperCase() : humanize(k), ...(depth === 0 ? {} : { emphasis: 'bold' }) });
      flattenToBlocks(v, blocks, depth + 1);
    }
  }
}

/** { header, blocks, basis, warnings } for one projection row. Throws on a content it cannot read. */
export async function versionBody(row) {
  const content = parseJson(row.generated_content);
  if (!content) return { header: {}, blocks: [], basis: 'empty', warnings: ['This version has no stored content.'] };
  if (content.format === 'document_blocks') {
    return { header: content.header || {}, blocks: content.blocks || [], basis: 'stored', warnings: [] };
  }
  if (isCareerBound(content)) {
    const frozen = parseJson(row.shared_snapshot)?.document;
    if (Array.isArray(frozen) && frozen.length && row.approved_by != null) {
      return { header: content.header || {}, blocks: frozen, basis: 'frozen_at_approval', warnings: [] };
    }
    const { content: resolved, warnings } = await resolveCareerBound(Number(row.user_id), content);
    return { header: resolved.header || {}, blocks: publicBlocks(resolved).blocks, basis: 'current_career_master', warnings: warnings.map((w) => w.message) };
  }
  const blocks = [];
  if (typeof content.rawText === 'string') {
    for (const para of content.rawText.split(/\n{2,}/)) if (para.trim()) blocks.push({ type: 'paragraph', text: para.trim() });
  } else {
    flattenToBlocks(content, blocks);
  }
  return { header: {}, blocks, basis: 'flattened', warnings: [] };
}

const ms = (v) => (v == null ? null : Number(v));

/**
 * Full version history of the lineage that contains `projectionId`, oldest
 * first. Returns null when the output is not this member's. A version whose
 * content cannot be read is still listed, with `error` set (never dropped).
 */
export async function getOutputVersionHistory(userId, projectionId) {
  const anchor = await db.prepare(`SELECT id, lineage_root_id FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, userId);
  if (!anchor) return null;
  const root = Number(anchor.lineage_root_id || anchor.id);
  const rows = await db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.user_id=$1 AND COALESCE(p.lineage_root_id, p.id)=$2
     ORDER BY p.created_at ASC, p.id ASC
  `).all(userId, root);

  const versions = [];
  let prev = null;
  for (const [i, row] of rows.entries()) {
    const version = {
      id: Number(row.id),
      versionNo: i + 1,
      title: row.preset_name || row.preset_id,
      status: row.output_status,
      current: i === rows.length - 1,
      createdAt: ms(row.source_created_at) || ms(row.created_at),
      filedAt: ms(row.created_at),
      modifiedAt: ms(row.updated_at) || ms(row.generated_at) || ms(row.created_at),
      approvedAt: ms(row.approved_at),
      approvedBy: row.approved_by_name || null,
      qrLive: !!row.share_token && row.output_status === 'published',
      outputType: row.output_type || 'resume',
      source: row.source || 'ai_generated',
      header: {}, blocks: [], basis: 'empty', warnings: [], error: null, changeSummary: null,
    };
    try {
      Object.assign(version, await versionBody(row));
    } catch (e) {
      console.error(`[outputVersionHistory] could not read version ${row.id}:`, e);
      version.error = `This version's content could not be read: ${e.message}`;
    }
    version.changeSummary = prev ? (version.error || prev.error ? 'Cannot compare (a version could not be read)' : summarizeDiff(diffVersions(prev, version))) : 'First version';
    versions.push(version);
    prev = version;
  }
  return { lineageRootId: root, title: versions[versions.length - 1]?.title || '', versions };
}
