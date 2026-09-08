// Source Document Intelligence — deterministic structural parser (2026-09-06).
//
// Runs entirely rule-based, zero LLM calls, for every format this codebase
// can already extract text from (mammoth for .docx, pdf-parse for .pdf —
// both already installed and used by careerResumeExtraction.js; plain
// read for .txt/.md). Sentence/word segmentation uses Node's built-in
// Intl.Segmenter (Unicode boundary rules), not a dependency or an LLM call.
//
// What is NOT deterministic, and therefore never attempted here:
//   - image / svg / handwritten_scan: no OCR library exists anywhere in this
//     repo (audited directly — zero matches for tesseract/ocr in server/).
//     These always return needsLlmAssist:true with zero nodes; a vision LLM
//     call is the only way to get any text at all.
//   - Plain-text title/subtitle: with no markup convention to anchor on,
//     guessing "line 1 is the title" would be fabrication, not parsing — so
//     plain text produces paragraph/sentence/word nodes only, never a
//     document_title/document_subtitle guess.
//   - PDF heading/title levels: pdf-parse returns flat text with no font-size
//     or style metadata, so a heading can't be told from body text
//     deterministically — PDF produces paragraph/sentence/word nodes only.
//     Page boundaries from pdf-parse's own page-break markers are used when
//     present; when they aren't, the whole document is one synthetic page
//     and `pageBoundariesUncertain: true` is set rather than asserting a
//     page count we don't actually have.
// Both of the above are legitimate, flagged LLM-assist trigger points a
// caller can opt into — never applied silently.
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { classifyInputType, sourceReferenceFor } from './documentAtomRegistry.js';

const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

export function segmentSentences(text) {
  return Array.from(sentenceSegmenter.segment(text))
    .map((s) => s.segment.trim())
    .filter(Boolean);
}

export function segmentWords(text) {
  return Array.from(wordSegmenter.segment(text))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment);
}

function paragraphBlocks(text) {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.replace(/\r?\n/g, ' ').trim())
    .filter(Boolean);
}

// Attaches sentence/word child nodes under a paragraph-level node. Shared by
// every format so segmentation behavior is identical regardless of source.
function expandParagraphChildren(nodes, parentRef, pageNumber, paragraphText, baseMetadata) {
  const sentences = segmentSentences(paragraphText);
  sentences.forEach((sentenceText, sIdx) => {
    const sentenceRef = `${parentRef}/sentence:${sIdx + 1}`;
    nodes.push({
      sourceReference: sentenceRef, parentReference: parentRef, atomKey: 'document_sentence',
      value: sentenceText, pageNumber, order: sIdx + 1, confidence: 1,
      sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { ...baseMetadata },
    });
    const words = segmentWords(sentenceText);
    words.forEach((wordText, wIdx) => {
      nodes.push({
        sourceReference: `${sentenceRef}/word:${wIdx + 1}`, parentReference: sentenceRef, atomKey: 'document_word',
        value: wordText, pageNumber, order: wIdx + 1, confidence: 1,
        sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { ...baseMetadata },
      });
    });
  });
}

// --- Markdown -----------------------------------------------------------

function parseMarkdown(text) {
  const nodes = [];
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let titleAssigned = false;
  let subtitleEligible = false; // true only for the heading immediately after the title, before any paragraph
  let paragraphBuffer = [];
  let headingOrder = 0;
  let paragraphOrder = 0;
  const page = 1;

  function flushParagraph() {
    if (!paragraphBuffer.length) return;
    const paragraphText = paragraphBuffer.join(' ').trim();
    paragraphBuffer = [];
    if (!paragraphText) return;
    paragraphOrder += 1;
    subtitleEligible = false;
    const ref = sourceReferenceFor([['page', page], ['para', paragraphOrder]]);
    nodes.push({
      sourceReference: ref, parentReference: `page:${page}`, atomKey: 'document_paragraph',
      value: paragraphText, pageNumber: page, order: paragraphOrder, confidence: 1,
      sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: {},
    });
    expandParagraphChildren(nodes, ref, page, paragraphText, {});
  }

  function flushCodeFence(codeLines) {
    paragraphOrder += 1;
    subtitleEligible = false;
    const ref = sourceReferenceFor([['page', page], ['para', paragraphOrder]]);
    nodes.push({
      sourceReference: ref, parentReference: `page:${page}`, atomKey: 'document_paragraph',
      value: codeLines.join('\n'), pageNumber: page, order: paragraphOrder, confidence: 1,
      sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { isCode: true },
    });
    // Code is not natural-language sentence/word content — no children.
  }

  let codeBuffer = null;
  for (const rawLine of lines) {
    const fenceMatch = /^\s*```/.test(rawLine);
    if (fenceMatch) {
      if (!inFence) { flushParagraph(); inFence = true; codeBuffer = []; }
      else { inFence = false; flushCodeFence(codeBuffer); codeBuffer = null; }
      continue;
    }
    if (inFence) { codeBuffer.push(rawLine); continue; }

    const headingMatch = /^(#{1,6})\s+(.*\S)\s*$/.exec(rawLine);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (!titleAssigned && level === 1) {
        nodes.push({
          sourceReference: `page:${page}/title:1`, parentReference: `page:${page}`, atomKey: 'document_title',
          value: headingText, pageNumber: page, order: 1, confidence: 1,
          sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { markdownLevel: level },
        });
        titleAssigned = true;
        subtitleEligible = true;
        continue;
      }
      if (subtitleEligible) {
        nodes.push({
          sourceReference: `page:${page}/subtitle:1`, parentReference: `page:${page}`, atomKey: 'document_subtitle',
          value: headingText, pageNumber: page, order: 1, confidence: 1,
          sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { markdownLevel: level },
        });
        subtitleEligible = false;
        continue;
      }
      headingOrder += 1;
      subtitleEligible = false;
      nodes.push({
        sourceReference: sourceReferenceFor([['page', page], ['heading', headingOrder]]), parentReference: `page:${page}`,
        atomKey: 'document_heading', value: headingText, pageNumber: page, order: headingOrder, confidence: 1,
        sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { markdownLevel: level },
      });
      continue;
    }

    if (rawLine.trim() === '') { flushParagraph(); continue; }
    paragraphBuffer.push(rawLine.trim());
  }
  flushParagraph();
  return { nodes, pageCount: 1, pageBoundariesUncertain: false };
}

// --- Plain text -----------------------------------------------------------

function parsePlainText(text) {
  const nodes = [];
  const page = 1;
  paragraphBlocks(text).forEach((paragraphText, idx) => {
    const order = idx + 1;
    const ref = sourceReferenceFor([['page', page], ['para', order]]);
    nodes.push({
      sourceReference: ref, parentReference: `page:${page}`, atomKey: 'document_paragraph',
      value: paragraphText, pageNumber: page, order, confidence: 1,
      sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: {},
    });
    expandParagraphChildren(nodes, ref, page, paragraphText, {});
  });
  return { nodes, pageCount: 1, pageBoundariesUncertain: false };
}

// --- Word document (.docx via mammoth HTML, so heading STYLES survive) ----

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function parseDocxHtml(html) {
  const nodes = [];
  const page = 1;
  let titleAssigned = false;
  let subtitleEligible = false;
  let headingOrder = 0;
  let paragraphOrder = 0;
  const blockRegex = /<(h[1-6]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripTags(match[2]);
    if (!text) continue;
    if (tag === 'h1' && !titleAssigned) {
      nodes.push({
        sourceReference: `page:${page}/title:1`, parentReference: `page:${page}`, atomKey: 'document_title',
        value: text, pageNumber: page, order: 1, confidence: 1,
        sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { wordHeadingStyle: tag },
      });
      titleAssigned = true;
      subtitleEligible = true;
      continue;
    }
    if (/^h[1-6]$/.test(tag)) {
      if (subtitleEligible) {
        nodes.push({
          sourceReference: `page:${page}/subtitle:1`, parentReference: `page:${page}`, atomKey: 'document_subtitle',
          value: text, pageNumber: page, order: 1, confidence: 1,
          sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { wordHeadingStyle: tag },
        });
        subtitleEligible = false;
        continue;
      }
      headingOrder += 1;
      nodes.push({
        sourceReference: sourceReferenceFor([['page', page], ['heading', headingOrder]]), parentReference: `page:${page}`,
        atomKey: 'document_heading', value: text, pageNumber: page, order: headingOrder, confidence: 1,
        sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { wordHeadingStyle: tag },
      });
      subtitleEligible = false;
      continue;
    }
    // tag === 'p'
    subtitleEligible = false;
    paragraphOrder += 1;
    const ref = sourceReferenceFor([['page', page], ['para', paragraphOrder]]);
    nodes.push({
      sourceReference: ref, parentReference: `page:${page}`, atomKey: 'document_paragraph',
      value: text, pageNumber: page, order: paragraphOrder, confidence: 1,
      sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: {},
    });
    expandParagraphChildren(nodes, ref, page, text, {});
  }
  return { nodes, pageCount: 1, pageBoundariesUncertain: false };
}

// --- PDF (text + best-effort page breaks; no heading/title detection) -----

function parsePdfText(rawText) {
  const nodes = [];
  const pages = rawText.includes('\f') ? rawText.split('\f') : [rawText];
  const pageBoundariesUncertain = pages.length === 1;
  pages.forEach((pageText, pageIdx) => {
    const page = pageIdx + 1;
    paragraphBlocks(pageText).forEach((paragraphText, idx) => {
      const order = idx + 1;
      const ref = sourceReferenceFor([['page', page], ['para', order]]);
      nodes.push({
        sourceReference: ref, parentReference: `page:${page}`, atomKey: 'document_paragraph',
        value: paragraphText, pageNumber: page, order, confidence: 1,
        sourceType: 'deterministic_parse', needsLlmAssist: false, metadata: { pageBoundariesUncertain },
      });
      expandParagraphChildren(nodes, ref, page, paragraphText, { pageBoundariesUncertain });
    });
  });
  return { nodes, pageCount: pages.length, pageBoundariesUncertain };
}

// --- Top-level entry point -------------------------------------------------

export async function parseDocumentStructure({ buffer, mimeType, originalName = '' }) {
  const classification = classifyInputType(mimeType, originalName);
  const { recordType } = classification;

  if (!recordType || !['plain_text', 'markdown', 'word_document', 'pdf'].includes(recordType)) {
    return {
      recordType: recordType || null,
      needsLlmAssist: true,
      llmAssistReason: classification.reason || 'no deterministic text extraction path exists for this input type — requires an LLM vision call to produce any text.',
      nodes: [],
      pageCount: 0,
    };
  }

  if (recordType === 'markdown') {
    const text = buffer.toString('utf-8');
    const parsed = parseMarkdown(text);
    return { recordType, needsLlmAssist: false, nodes: parsed.nodes, pageCount: parsed.pageCount, pageBoundariesUncertain: false };
  }
  if (recordType === 'plain_text') {
    const text = buffer.toString('utf-8');
    const parsed = parsePlainText(text);
    return {
      recordType, needsLlmAssist: false, nodes: parsed.nodes, pageCount: parsed.pageCount, pageBoundariesUncertain: false,
      note: 'No title/subtitle nodes: plain text carries no structural markup to anchor a title guess on. Available on request as an opt-in LLM-assist pass.',
    };
  }
  if (recordType === 'word_document') {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const parsed = parseDocxHtml(html);
    return { recordType, needsLlmAssist: false, nodes: parsed.nodes, pageCount: parsed.pageCount, pageBoundariesUncertain: false };
  }
  if (recordType === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const parsed = parsePdfText(result.text || '');
    return {
      recordType, needsLlmAssist: false, nodes: parsed.nodes, pageCount: parsed.pageCount,
      pageBoundariesUncertain: parsed.pageBoundariesUncertain,
      note: 'No title/subtitle/heading nodes: pdf-parse exposes no font-size/style metadata to distinguish a heading from body text deterministically. Available on request as an opt-in LLM-assist pass.',
    };
  }
  throw new Error(`Unreachable record type: ${recordType}`);
}
