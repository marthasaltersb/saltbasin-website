// Source Document Intelligence — persistence layer (2026-09-06). Mirrors
// server/lib/careerAtomMigration.js's exact shape (ensure-rod / persist-
// evidence / event-source-the-lifecycle), with a deterministic parser
// (documentStructureParser.js) standing in for career's legacy CRUD tables
// as the evidence source.
//
// Multiple documents per user: journey_data_rods' partial unique index
// (idx_rods_user_type) already exempts any rod carrying `scenarioKey` in its
// metadata from the one-rod-per-(user,rod_type) constraint (see db.js line
// ~429) — the same generic mechanism deal-scenario rods already use. Tagging
// every source_document rod with a unique scenarioKey gets "many documents
// per member" for free, with zero index/migration changes.
//
// Deterministic-parse-before-LLM caching: journey_rod_evidence's own
// UNIQUE(rod_id, molecule_key, source_reference) constraint is the cache key.
// Re-running the deterministic parser for the same document is a pure no-op
// (ON CONFLICT DO NOTHING) — the parse never re-executes, and an LLM is never
// re-invoked, for a position that already has evidence. An LLM-assisted
// result is written through the exact same evidence row shape (source_type
// distinguishes it), so once a call is made its answer is durably cached the
// same way a deterministic one is — never re-asked for the same position.
import { db } from '../db.js';
import { SOURCE_DOCUMENT_ROD_TYPE, structureAtomLevel, parentSourceReference } from './documentAtomRegistry.js';

function newScenarioKey() {
  return `source_document:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

// Always creates a new rod — one per uploaded document, never reused across
// uploads (unlike career_master, a document has no natural per-user
// singleton identity). `copyright` rides in the rod's existing free-form
// `metadata` JSONB — additive, no schema change — e.g.
// { holder, licenseType, attributionText, sourceUrl, capturedAt }.
export async function createSourceDocumentRod({ ownerUserId, originalFilename, copyright = null }) {
  const now = Date.now();
  const metadata = { scenarioKey: newScenarioKey(), originalFilename, copyright };
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at)
    VALUES ($1,$2,'requested',$3::jsonb,$4,$4)
    RETURNING id
  `).run(SOURCE_DOCUMENT_ROD_TYPE, ownerUserId, metadata, now);
  const rodId = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created','requested','{}'::jsonb,$2)`)
    .run(rodId, now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
}

// Records the raw file pointer + input classification as evidence — the two
// level-0 Atoms every source_document rod carries exactly once.
export async function recordSourceFileAtoms(rod, { storageBucket, storageKey, mimeType, fileSizeBytes, originalFilename, recordType }) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
    VALUES ($1,'document_source_file',$2::jsonb,'file_upload','file:1',1,$3,'{}'::jsonb,'["document_source_file"]'::jsonb)
    ON CONFLICT (rod_id, molecule_key, source_reference) DO NOTHING
  `).run(rod.id, { storageBucket, storageKey, mimeType, fileSizeBytes, originalFilename }, now);
  await db.prepare(`
    INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
    VALUES ($1,'document_input_type',$2::jsonb,'deterministic_classification','file:1',1,$3,'{}'::jsonb,'["document_input_type"]'::jsonb)
    ON CONFLICT (rod_id, molecule_key, source_reference) DO NOTHING
  `).run(rod.id, recordType, now);
}

// Bulk-writes every node from documentStructureParser.parseDocumentStructure()
// as evidence. ON CONFLICT DO NOTHING — a re-parse of the same document is a
// no-op for positions already recorded, matching migrateCareerDataForUser's
// bulk-backfill convention (never careerAtomMigration's delete-then-reinsert
// sync, since a source document's deterministic parse doesn't get "edited"
// the way a legacy CRUD row does — a correction goes through
// recordHumanValidation below instead, which does need delete-then-reinsert).
export async function persistParsedStructure(rod, parseResult) {
  const now = Date.now();
  let written = 0;
  let skippedExisting = 0;
  for (const node of parseResult.nodes) {
    const metadata = {
      ...node.metadata,
      level: structureAtomLevel(node.atomKey),
      order: node.order,
      pageNumber: node.pageNumber,
      parentReference: node.parentReference,
    };
    const result = await db.prepare(`
      INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
      VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8::jsonb,$9::jsonb)
      ON CONFLICT (rod_id, molecule_key, source_reference) DO NOTHING
      RETURNING id
    `).run(rod.id, node.atomKey, node.value, node.sourceType, node.sourceReference, node.confidence, now, metadata, [node.atomKey]);
    if (result.lastInsertRowid) written += 1; else skippedExisting += 1;
  }
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at)
    VALUES ($1,'structure_parsed',NULL,$2::jsonb,$3)
  `).run(rod.id, {
    recordType: parseResult.recordType,
    nodeCount: parseResult.nodes.length,
    written,
    skippedExisting,
    needsLlmAssist: !!parseResult.needsLlmAssist,
    llmAssistReason: parseResult.llmAssistReason || null,
    pageBoundariesUncertain: !!parseResult.pageBoundariesUncertain,
  }, now);
  return { written, skippedExisting };
}

// Writes through an LLM-produced value for a position the deterministic
// parser could not resolve (image/handwritten OCR, a PDF heading
// classification, a plain-text title guess). Same evidence shape as a
// deterministic node — source_type is what distinguishes it — so once
// written it is cached exactly like a deterministic result: re-requesting
// this same position never re-invokes the LLM (the UNIQUE(rod_id,
// molecule_key, source_reference) constraint is the cache key). Never
// auto-applied without a caller opting in — see documentStructureParser.js's
// header comment for the trigger points this exists for.
export async function recordLlmAssistedAtom(rod, { atomKey, sourceReference, parentReference, value, confidence, pageNumber = 1, order = 1, model, promptSummary }) {
  const now = Date.now();
  const metadata = { level: structureAtomLevel(atomKey), order, pageNumber, parentReference, llmModel: model, llmPromptSummary: promptSummary };
  const result = await db.prepare(`
    INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
    VALUES ($1,$2,$3::jsonb,'llm_structure_inference',$4,$5,$6,$7::jsonb,$8::jsonb)
    ON CONFLICT (rod_id, molecule_key, source_reference) DO NOTHING
    RETURNING id
  `).run(rod.id, atomKey, value, sourceReference, confidence, now, metadata, [atomKey]);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'llm_assist_applied',NULL,$2::jsonb,$3)`)
    .run(rod.id, { atomKey, sourceReference, model, cached: !result.lastInsertRowid }, now);
  return { inserted: !!result.lastInsertRowid };
}

// Human validation — the "immutable foundation" step. Approving a value
// never rewrites it, only records that a human confirmed it (event-sourced,
// journey_rod_events). Correcting a value delete-then-reinserts the evidence
// row (careerAtomMigration.syncSingleEntry's exact pattern) but chains
// lineage_parent_id to the row being replaced, so the original
// deterministic/LLM hypothesis is never actually lost — it's superseded, not
// deleted from history.
export async function recordHumanValidation(rod, { sourceReference, atomKey, validatedByUserId, approved, correctedValue = null }) {
  const now = Date.now();
  const existing = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 AND molecule_key=$2 AND source_reference=$3`)
    .get(rod.id, atomKey, sourceReference);

  if (approved) {
    await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'structure_validated',NULL,$2::jsonb,$3)`)
      .run(rod.id, { atomKey, sourceReference, validatedByUserId }, now);
    return { status: 'validated', evidenceId: existing?.id ?? null };
  }

  if (!existing) throw new Error(`No evidence found at ${sourceReference} (${atomKey}) to correct.`);
  const metadata = { ...(existing.metadata || {}) };
  await db.prepare(`DELETE FROM journey_rod_evidence WHERE id=$1`).run(existing.id);
  const result = await db.prepare(`
    INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties, lineage_parent_id)
    VALUES ($1,$2,$3::jsonb,'human_correction',$4,1,$5,$6::jsonb,$7::jsonb,$8)
    RETURNING id
  `).run(rod.id, atomKey, correctedValue, sourceReference, now, metadata, [atomKey], existing.id);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'structure_corrected',NULL,$2::jsonb,$3)`)
    .run(rod.id, { atomKey, sourceReference, validatedByUserId, priorEvidenceId: existing.id }, now);
  return { status: 'corrected', evidenceId: Number(result.lastInsertRowid) };
}

// Read-side reconstruction — assembles the full nested tree entirely from
// journey_rod_evidence rows (server/lib/proposalDocumentProjection.js's
// existing "no separate stored document table" pattern), by parent-prefix
// matching on source_reference.
export async function reconstructDocumentTree(rodId) {
  const rows = await db.prepare(`SELECT * FROM journey_rod_evidence WHERE rod_id=$1 ORDER BY source_reference`).all(rodId);
  const bySourceReference = new Map();
  const roots = [];
  for (const row of rows) {
    if (row.molecule_key === 'document_source_file' || row.molecule_key === 'document_input_type') continue;
    bySourceReference.set(row.source_reference, {
      sourceReference: row.source_reference,
      atomKey: row.molecule_key,
      value: row.value,
      confidence: row.confidence,
      sourceType: row.source_type,
      metadata: row.metadata,
      children: [],
    });
  }
  for (const node of bySourceReference.values()) {
    const parentRef = node.metadata?.parentReference || parentSourceReference(node.sourceReference);
    const parent = parentRef ? bySourceReference.get(parentRef) : null;
    if (parent) parent.children.push(node); else roots.push(node);
  }
  return roots;
}
