// Tailored application packages (2026-10-02) — a set of finished documents
// written for one opportunity (e.g. one company's package: Salt Basin-format
// resume, ATS resume, cover letter, combined package), filed as ordinary
// resume_output_projections rows so they share the existing view / PDF /
// ZIP / email / status pipeline instead of a parallel one.
//
// Each output (document) gets its own QR-gated URL (/r/:token). The token is
// minted the first time the owner explicitly approves a version for
// sharing, then follows whichever version of that document is approved
// last. It is unguessable (144 random bits) and resolves only while the
// row holding it is 'published' — it is never listed, linked, or indexed
// anywhere. Revoking clears it, so a printed QR stops working immediately.
//
// generated_content shape for these documents ("document_blocks", v1):
//   { format: 'document_blocks', version: 1,
//     header: { name, headline, contact },
//     blocks: [ { type: 'heading'|'paragraph'|'bullet', text, emphasis? }
//             | { type: 'role', title, dates }
//             | { type: 'table', rows: [[ [line, ...], ... ]] }
//             | { type: 'figure' } ] }
// produced from .docx files by scripts/extract-application-package.py.
import crypto from 'node:crypto';
import { db } from '../db.js';
import { createResumeOutputProjection, projectionMetadata } from './resumeProjection.js';

const OUTPUT_TYPES = new Set(['resume', 'cover_letter', 'application_package']);
const BLOCK_TYPES = new Set(['heading', 'paragraph', 'bullet', 'role', 'table', 'figure']);

export function presetIdFor(packageKey, variant) {
  return `application_package:${packageKey}:${variant}`;
}

function assertDocumentBlocks(content) {
  if (content?.format !== 'document_blocks' || Number(content.version) !== 1) {
    throw new Error('Output content must be document_blocks v1.');
  }
  if (!Array.isArray(content.blocks) || !content.blocks.every((b) => BLOCK_TYPES.has(b?.type))) {
    throw new Error('Output content has an unrecognized block type.');
  }
}

// JSONB stores object keys in its own order, so compare key-sorted forms.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  }
  return value;
}

function sameContent(a, b) {
  const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
  return JSON.stringify(canonical(parse(a))) === JSON.stringify(canonical(parse(b)));
}

/**
 * Files every output of a package for this member. Re-importing is safe:
 * an output whose content is unchanged is skipped, and a changed one becomes
 * a new draft version in the same lineage (the approved version and its QR
 * are left alone until the owner approves the new one).
 */
export async function importApplicationPackage(userId, pkg) {
  if (!pkg?.packageKey || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(pkg.packageKey)) throw new Error('packageKey must be a lowercase slug.');
  if (!Array.isArray(pkg.outputs) || !pkg.outputs.length) throw new Error('Package has no outputs.');
  const createdAt = pkg.createdAt ? Date.parse(pkg.createdAt) : null;
  if (pkg.createdAt && Number.isNaN(createdAt)) throw new Error('createdAt must be an ISO-8601 date.');
  const authors = Array.isArray(pkg.authors) ? pkg.authors.map((a) => String(a).trim()).filter(Boolean) : [];

  const results = [];
  for (const output of pkg.outputs) {
    if (!output?.variant || !/^[a-z0-9_]{1,40}$/.test(output.variant)) throw new Error('Each output needs a snake_case variant.');
    if (!OUTPUT_TYPES.has(output.outputType)) throw new Error(`Unsupported outputType: ${output.outputType}`);
    assertDocumentBlocks(output.content);

    const presetId = presetIdFor(pkg.packageKey, output.variant);
    const latest = await db.prepare(`
      SELECT * FROM resume_output_projections WHERE user_id=$1 AND preset_id=$2 ORDER BY created_at DESC, id DESC LIMIT 1
    `).get(userId, presetId);
    if (latest && sameContent(latest.generated_content, output.content)) {
      results.push({ variant: output.variant, id: Number(latest.id), status: 'unchanged' });
      continue;
    }
    const projection = await createResumeOutputProjection(userId, {
      presetId,
      presetName: output.name || output.variant,
      generatedContent: output.content,
      outputType: output.outputType,
      source: 'imported',
      regenerateFromId: latest ? Number(latest.id) : null,
      targetJobDescription: pkg.company ? `${pkg.company} application package` : null,
      authors,
      sourceCreatedAt: createdAt,
    });
    results.push({ variant: output.variant, id: Number(projection.id), status: latest ? 'new_version' : 'created' });
  }
  return results;
}

function newShareToken() {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * The explicit human approval step: publishes this version and records who
 * approved it. Each document (one version lineage — e.g. a cover
 * letter) has ONE QR slug that follows its approved version: approving a
 * newer version moves the slug to it, so every QR already printed keeps
 * working and always opens the version approved last.
 */
export async function approveOutputForSharing(projectionId, approver) {
  const row = await db.prepare(`SELECT * FROM resume_output_projections WHERE id=$1 AND user_id=$2`).get(projectionId, approver.id);
  if (!row) return null;
  const lineageRoot = Number(row.lineage_root_id || row.id);
  const holder = row.share_token ? row : await db.prepare(`
    SELECT id, share_token FROM resume_output_projections
     WHERE user_id=$1 AND COALESCE(lineage_root_id, id)=$2 AND share_token IS NOT NULL LIMIT 1
  `).get(approver.id, lineageRoot);
  const token = holder?.share_token || newShareToken();
  if (holder && Number(holder.id) !== Number(projectionId)) {
    // Retire the previously approved version first (share_token is unique).
    await db.prepare(`
      UPDATE resume_output_projections
         SET share_token=NULL, output_status=CASE WHEN output_status='published' THEN 'approved' ELSE output_status END
       WHERE id=$1 AND user_id=$2
    `).run(holder.id, approver.id);
  }
  await db.prepare(`
    UPDATE resume_output_projections
       SET share_token=$1, output_status='published', approved_by=$2, approved_at=$3
     WHERE id=$4 AND user_id=$2
  `).run(token, approver.id, Date.now(), projectionId);
  return { id: Number(projectionId), token, movedFrom: holder && Number(holder.id) !== Number(projectionId) ? Number(holder.id) : null };
}

/** Stops the QR from resolving — the slug is discarded, never reissued. */
export async function revokeOutputSharing(projectionId, userId) {
  const result = await db.prepare(`
    UPDATE resume_output_projections
       SET share_token=NULL, output_status=CASE WHEN output_status='published' THEN 'approved' ELSE output_status END
     WHERE id=$1 AND user_id=$2
  `).run(projectionId, userId);
  return result.changes > 0;
}

/** Public resolution of a QR slug — only an approved, still-published version. */
export async function getSharedOutputByToken(token) {
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  return db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.share_token=$1 AND p.output_status='published' AND p.approved_by IS NOT NULL
     LIMIT 1
  `).get(token);
}

/** Owner fetch with the approver's name joined, for owner-side PDF/QR routes. */
export async function getOwnedOutputWithApprover(projectionId, userId) {
  return db.prepare(`
    SELECT p.*, COALESCE(NULLIF(u.display_name, ''), u.email) AS approved_by_name
      FROM resume_output_projections p
      LEFT JOIN users u ON u.id = p.approved_by
     WHERE p.id=$1 AND p.user_id=$2
  `).get(projectionId, userId);
}

export function shareUrlFor(token, req) {
  const base = (process.env.APP_BASE_URL || (req ? `${req.protocol}://${req.get('host')}` : '')).replace(/\/+$/, '');
  return `${base}/r/${token}`;
}

/** What a QR visitor sees — the document and its metadata, nothing internal. */
export function publicSharedView(row) {
  const content = typeof row.generated_content === 'string' ? JSON.parse(row.generated_content) : row.generated_content;
  return {
    title: row.preset_name || 'Resume',
    outputType: row.output_type || 'resume',
    content: content || {},
    metadata: projectionMetadata(row),
  };
}
