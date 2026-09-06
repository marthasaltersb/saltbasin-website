// Source Document Intelligence — Atom/rod-type registry (2026-09-06).
//
// Reuse-first audit (salt-basin-channel-journey-architecture skill) result:
// ZERO new tables. A source document is a journey_data_rods row (rod_type
// 'source_document'); every structural unit inside it (input classification,
// the raw file pointer, title, subtitle, heading, paragraph, sentence, word)
// is a journey_rod_evidence row against that rod — the exact same "legacy
// table -> Career Atom" shape careerAtomRegistry.js/careerAtomMigration.js
// already established, just with a deterministic parser instead of a legacy
// CRUD table as the evidence source. Copyright/attribution rides in the
// rod's existing `metadata` JSONB (additive, no schema change) rather than a
// new column, matching journey_data_rods.metadata's existing free-form use
// elsewhere (e.g. career_master's `backfilledFromLegacyCareerMaster` flag).
//
// Deliberate scope line: individual letters are NOT persisted as their own
// evidence rows. A `document_word` atom's `value` is the word's own text, so
// every letter in it is trivially derivable by string indexing — one evidence
// row per letter would be pure data-volume waste with no query anyone would
// ever run ("show me letter 4 of word 12" is not a real need). Word is the
// finest persisted granularity.
//
// Ordered containment (document > page > paragraph > sentence > word) is
// deliberately NOT modeled as a journey_metadata_clusters Atom Cluster / the
// eidosBonding.js bonding engine — computeBonds() clusters atoms by dynamic
// tag-overlap affinity across an unordered pool, which is the wrong tool for
// a fixed, ordered, positional containment tree. Instead each evidence row's
// `source_reference` encodes its exact position in the tree (see
// sourceReferenceFor/parseSourceReference below), and the tree is
// reconstructed on read by parent-prefix matching — the same "assemble a
// document-shaped structure entirely from journey_rod_evidence rows, never a
// separate stored document table" pattern server/lib/proposalDocumentProjection.js
// already uses for Proposal Experience rods.

export const SOURCE_DOCUMENT_ROD_TYPE = 'source_document';

// "Record type" / input classification values — deliberately a flat enum
// here (config, not schema) rather than a free-text column, so every
// consumer shares one vocabulary. Extend this array, never rename/remove an
// existing key once a real document has been classified with it (same
// append-only discipline as the block REGISTRY in
// src/components/blocks/index.jsx).
export const DOCUMENT_RECORD_TYPES = Object.freeze({
  plain_text: { label: 'Plain Text', deterministicExtraction: true },
  markdown: { label: 'Markdown', deterministicExtraction: true },
  word_document: { label: 'Word Document', deterministicExtraction: true },
  pdf: { label: 'PDF', deterministicExtraction: true },
  svg: { label: 'SVG', deterministicExtraction: false },
  image: { label: 'Image', deterministicExtraction: false },
  handwritten_scan: { label: 'Image of Handwritten Text', deterministicExtraction: false },
});

// Deterministic classification from mime type / filename extension only.
// Cannot distinguish a plain photograph from a scan of handwriting — that
// distinction has no signal in the file bytes' mime type, so it defaults to
// 'image' with needsLlmAssist:true; a human or an LLM vision pass reclassifies
// it to 'handwritten_scan' when applicable. Never silently guesses a record
// type it can't actually determine.
export function classifyInputType(mimeType, originalName = '') {
  const ext = (String(originalName).split('.').pop() || '').toLowerCase();
  if (mimeType === 'text/markdown' || ext === 'md' || ext === 'markdown') {
    return { recordType: 'markdown', needsLlmAssist: false };
  }
  if (mimeType === 'text/plain' || ext === 'txt') {
    return { recordType: 'plain_text', needsLlmAssist: false };
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
    return { recordType: 'word_document', needsLlmAssist: false };
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return { recordType: 'pdf', needsLlmAssist: false };
  }
  if (mimeType === 'image/svg+xml' || ext === 'svg') {
    return { recordType: 'svg', needsLlmAssist: false };
  }
  if (/^image\//.test(mimeType || '') || ['png', 'jpg', 'jpeg', 'webp', 'heic', 'tiff', 'gif'].includes(ext)) {
    return { recordType: 'image', needsLlmAssist: true, reason: 'image mime type does not indicate printed vs. handwritten content — an LLM vision pass or human confirmation resolves this.' };
  }
  return { recordType: null, needsLlmAssist: true, reason: `unrecognized mime type "${mimeType}" / extension "${ext}" — cannot classify input type deterministically.` };
}

// Structural Atom (Molecule definition) vocabulary. `level` orders the
// hierarchy for read-side reconstruction; it is not itself persisted as a
// column anywhere — it documents the intended containment depth.
export const STRUCTURE_ATOM_TYPES = Object.freeze([
  { atomKey: 'document_source_file', label: 'Source File Pointer', dataType: 'jsonb', level: 0, canonicalDefinition: 'The uploaded file itself — storage bucket/key, mime type, original filename, byte size. One per source_document rod.' },
  { atomKey: 'document_input_type', label: 'Input Classification', dataType: 'text', level: 0, valueDomain: Object.keys(DOCUMENT_RECORD_TYPES).join('|'), canonicalDefinition: 'The classified record type of the source file (plain_text, markdown, word_document, pdf, svg, image, handwritten_scan).' },
  { atomKey: 'document_title', label: 'Document Title', dataType: 'text', level: 1, canonicalDefinition: 'The top-level title of the source document.' },
  { atomKey: 'document_subtitle', label: 'Document Subtitle', dataType: 'text', level: 1, canonicalDefinition: 'A subtitle directly subordinate to the document title.' },
  { atomKey: 'document_heading', label: 'Section Heading', dataType: 'text', level: 2, canonicalDefinition: 'A section/subsection heading below the title level (markdown ##/###, or a Word heading style below Heading 1).' },
  { atomKey: 'document_paragraph', label: 'Paragraph', dataType: 'text', level: 3, canonicalDefinition: 'One paragraph of body text, as delimited by the source format’s own paragraph boundaries.' },
  { atomKey: 'document_sentence', label: 'Sentence', dataType: 'text', level: 4, canonicalDefinition: 'One sentence within a paragraph, segmented via Unicode sentence-boundary rules (Intl.Segmenter).' },
  { atomKey: 'document_word', label: 'Word', dataType: 'text', level: 5, canonicalDefinition: 'One word within a sentence, segmented via Unicode word-boundary rules (Intl.Segmenter). Finest persisted granularity — letters are read directly off this value, never stored as their own rows.' },
]);

export function generateDocumentAtomDefinitions() {
  return STRUCTURE_ATOM_TYPES.map((a) => ({
    atomKey: a.atomKey,
    label: a.label,
    dataType: a.dataType,
    canonicalDefinition: a.canonicalDefinition,
    valueDomain: a.valueDomain || null,
  }));
}

export function structureAtomLevel(atomKey) {
  return STRUCTURE_ATOM_TYPES.find((a) => a.atomKey === atomKey)?.level ?? null;
}

// source_reference encodes exact tree position, e.g.:
//   "page:1"
//   "page:1/para:2"
//   "page:1/para:2/sentence:3"
//   "page:1/para:2/sentence:3/word:5"
// A document with no page concept (markdown, plain text) uses "page:1" for
// everything — one implicit page — so the address shape stays uniform across
// every input type.
export function sourceReferenceFor(pathSegments) {
  return pathSegments.map(([kind, ordinal]) => `${kind}:${ordinal}`).join('/');
}

export function parentSourceReference(sourceReference) {
  const parts = sourceReference.split('/');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
}

export function parseSourceReference(sourceReference) {
  return sourceReference.split('/').map((segment) => {
    const [kind, ordinal] = segment.split(':');
    return { kind, ordinal: Number(ordinal) };
  });
}
