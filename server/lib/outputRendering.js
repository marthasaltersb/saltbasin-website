// Output rendering (2026-08-09) — turns a resume_output_projections row's
// durable, structured generated_content into (a) a read-only "digital view"
// JSON shape for the private view page, and (b) a real PDF buffer, on
// demand, every time. Nothing here ever writes a file to disk or object
// storage — "instead of saving the files themselves, the digital view
// equivalent should be accessible... downloaded again if necessary" means
// generated_content (already durable) is the only thing persisted; every
// PDF is regenerated fresh from it for a single download, inside a ZIP, or
// as an email attachment.
//
// No headless-browser/Chromium dependency — pdfkit is pure JS, safe on any
// standard Node host, unlike puppeteer/playwright (which this codebase has
// no production-verified support for). Handles three generated_content
// shapes: an AI-generated resume (professionalSummary/selectedExperience/
// emphasizedSkills), an AI-generated cover letter (openingHook/
// bodyParagraphs/closing), and an imported document (rawText) — the same
// shape a member-uploaded PDF/DOCX becomes after extraction (see
// careerPipelineImport.js's file-type branch).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { projectionMetadata } from './resumeProjection.js';

function parseContent(projection) {
  const c = projection.generated_content;
  if (c == null) return {};
  return typeof c === 'string' ? JSON.parse(c) : c;
}

function titleFor(projection) {
  return projection.preset_name || (projection.output_type === 'cover_letter' ? 'Cover Letter' : 'Resume');
}

/** Read-only JSON shape for the private digital-view page — never includes anything editable. */
export function summarizeProjectionForView(projection) {
  const content = parseContent(projection);
  return {
    id: Number(projection.id),
    title: titleFor(projection),
    outputType: projection.output_type || 'resume',
    source: projection.source || 'ai_generated',
    outputStatus: projection.output_status,
    generatedAt: Number(projection.generated_at),
    targetJobDescription: projection.target_job_description || null,
    careerOpportunityRodId: projection.career_opportunity_rod_id != null ? Number(projection.career_opportunity_rod_id) : null,
    content,
    metadata: projectionMetadata(projection),
  };
}

function writeParagraphs(doc, text) {
  String(text || '').split(/\n{2,}/).forEach((para) => {
    if (para.trim()) doc.fontSize(11).font('Helvetica').text(para.trim(), { align: 'left' }).moveDown(0.6);
  });
}

// ── document_blocks (tailored application packages) ─────────────────────────
// See server/lib/applicationPackages.js for the shape. Brand palette from
// src/brand.css (Strategic Operator): navy ink, gold section labels, teal.
const INK = '#1B2A3B';
const GOLD = '#C4843A';
const TEAL = '#4A7C8E';
const MUTED = '#5F6B78';
// Bundled DejaVu Sans (server/assets/fonts, Bitstream Vera license) — the
// built-in PDF Helvetica is WinAnsi-only and drops characters these
// documents use (→, ⁴), and production hosts can't be assumed to have
// system fonts.
const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts');
function registerDocumentFonts(doc) {
  doc.registerFont('SB-Regular', path.join(FONT_DIR, 'DejaVuSans.ttf'));
  doc.registerFont('SB-Bold', path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'));
  doc.registerFont('SB-Oblique', path.join(FONT_DIR, 'DejaVuSans-Oblique.ttf'));
  doc.registerFont('SB-BoldOblique', path.join(FONT_DIR, 'DejaVuSans-BoldOblique.ttf'));
}
const EMPHASIS_FONT = { bold: 'SB-Bold', italic: 'SB-Oblique', 'bold-italic': 'SB-BoldOblique' };

function formatDate(ms) {
  return ms ? new Date(Number(ms)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
}

/** One-line provenance shown on every rendered document. */
export function metadataLine(metadata) {
  return [
    metadata.authors?.length ? `Authors: ${metadata.authors.join('; ')}` : '',
    metadata.createdAt ? `Created ${formatDate(metadata.createdAt)}` : '',
    metadata.modifiedAt ? `Modified ${formatDate(metadata.modifiedAt)}` : '',
    metadata.approvedBy ? `Approved by ${metadata.approvedBy}${metadata.approvedAt ? ` on ${formatDate(metadata.approvedAt)}` : ''}` : 'Not yet approved',
  ].filter(Boolean).join('  ·  ');
}

function ensureRoom(doc, height) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function renderTable(doc, rows) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const isGrid = rows.length > 1; // header row + data rows → plain table; one row → metric tiles
  rows.forEach((cells, rowIndex) => {
    const colWidth = width / Math.max(cells.length, 1);
    const pad = 4;
    const heights = cells.map((lines, i) => {
      const [first = '', ...rest] = lines;
      const firstFont = isGrid ? (rowIndex === 0 ? 'SB-Bold' : 'SB-Regular') : 'SB-Bold';
      const firstSize = isGrid ? 8 : 10.5;
      let h = doc.font(firstFont).fontSize(firstSize).heightOfString(first, { width: colWidth - pad * 2 });
      if (rest.length) h += doc.font('SB-Regular').fontSize(7.5).heightOfString(rest.join('\n'), { width: colWidth - pad * 2 }) + 2;
      return h + pad * 2;
    });
    const rowHeight = Math.max(...heights, 0);
    ensureRoom(doc, rowHeight);
    const top = doc.y;
    cells.forEach((lines, i) => {
      const [first = '', ...rest] = lines;
      const x = left + i * colWidth + pad;
      if (!isGrid) doc.save().rect(left + i * colWidth + 2, top, colWidth - 4, rowHeight).fill('#F7F1E8').restore();
      doc.fillColor(isGrid ? INK : GOLD)
        .font(isGrid ? (rowIndex === 0 ? 'SB-Bold' : 'SB-Regular') : 'SB-Bold')
        .fontSize(isGrid ? 8 : 10.5)
        .text(first, x, top + pad, { width: colWidth - pad * 2 });
      if (rest.length) doc.fillColor(MUTED).font('SB-Regular').fontSize(7.5).text(rest.join('\n'), x, doc.y + 2, { width: colWidth - pad * 2 });
    });
    doc.x = left;
    doc.y = top + rowHeight + (isGrid ? 0 : 4);
    if (isGrid) doc.save().moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(0.4).stroke('#D8CDBE').restore();
  });
  doc.fillColor(INK).moveDown(0.4);
}

async function renderDocumentBlocks(doc, content, { metadata, shareUrl }) {
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const header = content.header || {};
  const qrSize = 64;
  const textWidth = shareUrl ? width - qrSize - 14 : width;
  const top = doc.y;

  if (shareUrl) {
    const png = await QRCode.toBuffer(shareUrl, { type: 'png', margin: 1, width: 256, errorCorrectionLevel: 'M' });
    doc.image(png, left + width - qrSize, top, { width: qrSize, height: qrSize });
    // Clickable too — most copies are read on screen, not scanned.
    doc.link(left + width - qrSize, top, qrSize, qrSize, shareUrl);
    doc.fillColor(MUTED).font('SB-Regular').fontSize(5.5)
      .text('Scan or click for current version', left + width - qrSize - 14, top + qrSize + 2, { width: qrSize + 28, align: 'center', link: shareUrl });
    doc.x = left;
    doc.y = top;
  }
  doc.fillColor(INK).font('SB-Bold').fontSize(19).text(header.name || '', left, top, { width: textWidth });
  if (header.headline) doc.moveDown(0.15).fillColor(TEAL).font('SB-Bold').fontSize(7).text(header.headline, { width: textWidth, characterSpacing: 0.15 });
  if (header.contact) doc.moveDown(0.2).fillColor(MUTED).font('SB-Regular').fontSize(8).text(header.contact, { width: textWidth });
  doc.y = Math.max(doc.y, shareUrl ? top + qrSize + 12 : doc.y) + 4;
  doc.save().moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(1.2).stroke(GOLD).restore();
  doc.moveDown(0.5);

  for (const block of content.blocks || []) {
    doc.x = left;
    if (block.type === 'heading') {
      ensureRoom(doc, 40);
      doc.moveDown(0.5).fillColor(GOLD).font('SB-Bold').fontSize(8.5).text(block.text, { characterSpacing: 0.8 });
      doc.save().moveTo(left, doc.y + 1).lineTo(left + width, doc.y + 1).lineWidth(0.4).stroke('#E3D3BE').restore();
      doc.moveDown(0.35);
    } else if (block.type === 'paragraph') {
      doc.fillColor(INK).font(EMPHASIS_FONT[block.emphasis] || 'SB-Regular').fontSize(8.5).text(block.text, { width, lineGap: 1.2 }).moveDown(0.35);
    } else if (block.type === 'bullet') {
      doc.fillColor(INK).font('SB-Regular').fontSize(8.5).text(`•  ${block.text}`, left + 8, doc.y, { width: width - 8, lineGap: 1.2, indent: 0 }).moveDown(0.2);
    } else if (block.type === 'role') {
      ensureRoom(doc, 30);
      doc.moveDown(0.25);
      const y = doc.y;
      doc.fillColor(INK).font('SB-Bold').fontSize(9).text(block.title, left, y, { width: width - 120 });
      const after = doc.y;
      doc.fillColor(TEAL).font('SB-Regular').fontSize(8.5).text(block.dates || '', left + width - 118, y + 1, { width: 118, align: 'right' });
      doc.x = left;
      doc.y = Math.max(after, doc.y) + 2;
    } else if (block.type === 'table') {
      renderTable(doc, block.rows || []);
    }
  }

  doc.moveDown(1);
  ensureRoom(doc, 30);
  doc.save().moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(0.4).stroke('#D8CDBE').restore();
  doc.moveDown(0.3).fillColor(MUTED).font('SB-Regular').fontSize(6.5).text(metadataLine(metadata), left, doc.y, { width });
  if (shareUrl) doc.text(`Verified copy: ${shareUrl}`, { width, link: shareUrl });
}

/**
 * Generates a real PDF buffer from a projection's frozen content — never
 * persisted, only ever returned to the caller. `shareUrl` (set when the
 * version is approved for QR sharing) embeds that version's QR code.
 */
export async function renderProjectionToPdfBuffer(projection, { shareUrl = null } = {}) {
  const content = parseContent(projection);
  const metadata = projectionMetadata(projection);
  const qrUrl = projection.output_status === 'published' && projection.share_token ? shareUrl : null;
  if (content.format === 'document_blocks') {
    const doc = new PDFDocument({
      margin: 42,
      size: 'LETTER',
      info: {
        Title: titleFor(projection),
        Author: metadata.authors.join('; '),
        Subject: projection.target_job_description || titleFor(projection),
        Keywords: [projection.output_type, metadata.approvedBy ? `approved-by:${metadata.approvedBy}` : 'unapproved'].filter(Boolean).join(', '),
        CreationDate: new Date(metadata.createdAt),
        ModDate: new Date(metadata.modifiedAt),
        ...(metadata.approvedBy ? { ApprovedBy: metadata.approvedBy } : {}),
      },
    });
    const chunks = [];
    const done = new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    registerDocumentFonts(doc);
    await renderDocumentBlocks(doc, content, { metadata, shareUrl: qrUrl });
    doc.end();
    return done;
  }
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(titleFor(projection)).moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#666').text(`Generated ${new Date(Number(projection.generated_at)).toLocaleDateString()}`).fillColor('#000').moveDown(1);

    if (content.rawText) {
      writeParagraphs(doc, content.rawText);
    } else if (projection.output_type === 'cover_letter') {
      writeParagraphs(doc, content.openingHook);
      (content.bodyParagraphs || []).forEach((p) => writeParagraphs(doc, p.text));
      writeParagraphs(doc, content.closing);
    } else {
      if (content.professionalSummary) writeParagraphs(doc, content.professionalSummary);
      (content.selectedExperience || []).forEach((exp) => {
        (exp.bullets || []).forEach((b) => doc.fontSize(11).font('Helvetica').text(`•  ${b}`, { indent: 12 }).moveDown(0.2));
        doc.moveDown(0.4);
      });
      if (content.emphasizedSkills?.length) {
        doc.moveDown(0.4).fontSize(10).font('Helvetica-Bold').text('Emphasized skills: ', { continued: true })
          .font('Helvetica').text(content.emphasizedSkills.join(', '));
      }
    }

    doc.end();
  });
}

/** Safe filename for a download/ZIP entry — no path separators, stable across re-downloads of the same projection. */
export function filenameFor(projection) {
  const base = titleFor(projection).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'output';
  return `${base}-${projection.id}.pdf`;
}
