// Minimal .docx renderer for document_blocks outputs (qr-gated-outputs fix r3, F2-8). Built with JSZip so no
// new dependency: real core properties (authors, the document's true created/modified dates - never a
// library placeholder) and, once a version is approved, the slug QR placed in the page header as a CLICKABLE
// image whose hyperlink target is exactly the /r/<slug> URL.
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { contactText } from '../../src/lib/headerContact.js';
import { metadataLine } from './outputRendering.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (ms) => new Date(Number(ms) || Date.now()).toISOString().replace(/\.\d+Z$/, 'Z');
const run = (t, { b = false, i = false, sz = 21, color = '' } = {}) =>
  `<w:r><w:rPr>${b ? '<w:b/>' : ''}${i ? '<w:i/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}<w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
const para = (inner, { before = 0, after = 80, ind = 0, pageBreak = false } = {}) =>
  `<w:p><w:pPr>${pageBreak ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="${before}" w:after="${after}"/>${ind ? `<w:ind w:left="${ind}"/>` : ''}</w:pPr>${inner}</w:p>`;

function bodyXml(content, metadata, shareUrl) {
  const h = content.header || {};
  const out = [];
  out.push(para(run(h.name || '', { b: true, sz: 38 }), { after: 40 }));
  if (h.headline) out.push(para(run(h.headline, { b: true, sz: 14, color: '0F6E6E' }), { after: 40 }));
  if (contactText(h.contact)) out.push(para(run(contactText(h.contact), { sz: 16, color: '666666' }), { after: 120 }));
  for (const b of content.blocks || []) {
    if (b.type === 'heading') out.push(para(run(b.text, { b: true, sz: 17, color: 'B07A2A' }), { before: 160 }));
    else if (b.type === 'paragraph') out.push(para(run(b.text, { i: b.emphasis === 'italic', b: b.emphasis === 'bold' })));
    else if (b.type === 'bullet') out.push(para(run(`•  ${b.text}`), { ind: 200, after: 40 }));
    else if (b.type === 'role') out.push(para(run(b.title || '', { b: true, sz: 22 }) + (b.dates ? run(`   ${b.dates}`, { sz: 18, color: '0F6E6E' }) : ''), { before: 80, after: 40 }));
    else if (b.type === 'table') for (const row of b.rows || []) out.push(para(run((Array.isArray(row) ? row : Object.values(row)).join('   |   '), { sz: 18 }), { after: 20 }));
    else if (b.type === 'section_start') out.push(para(run(`SECTION ${b.number ?? ''}  ${b.title || ''}`, { b: true, sz: 28 }), { pageBreak: true }));
    else if (b.type === 'toc') out.push(para(run('Contents', { b: true, sz: 24 })));
  }
  out.push(para(run(metadataLine(metadata), { sz: 13, color: '666666' }), { before: 240 }));
  if (shareUrl) out.push(`<w:p><w:hyperlink r:id="rIdQrLink"><w:r><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/><w:sz w:val="13"/></w:rPr><w:t xml:space="preserve">Verified copy: ${esc(shareUrl)}</w:t></w:r></w:hyperlink></w:p>`);
  return out.join('');
}

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

function headerXml() {
  const emu = 640080; // 0.7in
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${emu}" cy="${emu}"/><wp:docPr id="1" name="Verified copy QR" descr="QR code linking to the current approved version"><a:hlinkClick r:id="rIdQrLink"/></wp:docPr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="qr.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdQrImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu}" cy="${emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p></w:hdr>`;
}

/** content must already be resolved document_blocks content. shareUrl only when the version is approved. */
export async function renderDocumentBlocksToDocxBuffer({ title, content, metadata, shareUrl }) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>${shareUrl ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ''}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>${esc((metadata.authors || []).join('; '))}</dc:creator>${metadata.approvedBy ? `<cp:lastModifiedBy>${esc(metadata.approvedBy)}</cp:lastModifiedBy>` : ''}<dcterms:created xsi:type="dcterms:W3CDTF">${iso(metadata.createdAt)}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso(metadata.modifiedAt)}</dcterms:modified></cp:coreProperties>`);
  const rels = [];
  let sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr>';
  if (shareUrl) {
    zip.file('word/header1.xml', headerXml());
    zip.file('word/media/qr.png', await QRCode.toBuffer(shareUrl, { type: 'png', margin: 1, width: 400, errorCorrectionLevel: 'M' }));
    zip.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdQrImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qr.png"/><Relationship Id="rIdQrLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(shareUrl)}" TargetMode="External"/></Relationships>`);
    rels.push('<Relationship Id="rIdHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>');
    rels.push(`<Relationship Id="rIdQrLink" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(shareUrl)}" TargetMode="External"/>`);
    sect = sect.replace('<w:pgSz', '<w:headerReference w:type="default" r:id="rIdHdr"/><w:pgSz');
  }
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${bodyXml(content, metadata, shareUrl)}${sect}</w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
