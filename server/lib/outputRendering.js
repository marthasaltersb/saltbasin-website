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
import PDFDocument from 'pdfkit';

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
  };
}

function writeParagraphs(doc, text) {
  String(text || '').split(/\n{2,}/).forEach((para) => {
    if (para.trim()) doc.fontSize(11).font('Helvetica').text(para.trim(), { align: 'left' }).moveDown(0.6);
  });
}

/** Generates a real PDF buffer from a projection's frozen content — never persisted, only ever returned to the caller. */
export function renderProjectionToPdfBuffer(projection) {
  const content = parseContent(projection);
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
