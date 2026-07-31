// Organization Document Projection (2026-07-27) — creates/reads
// org_document_projections rows, the satellite table for the
// 'customer_document_delivery' Tributary (server/lib/tributaryRegistry.js).
// Mirrors resumeProjection.js's module shape for the same reason: a
// satellite child still goes through validateTributary() as its one
// required gate, but the actual INSERT stays here, with the satellite
// table's own typed columns.
import { db } from '../db.js';
import { validateTributary } from './tributaryRegistry.js';

export async function createOrgDocumentProjection({ orgId, customerRod, documentType, title, summary = null, content = {}, status = 'draft', createdBy = null }) {
  validateTributary('customer_document_delivery', customerRod);
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO org_document_projections
      (org_id, parent_rod_id, rod_relationship_type, document_type, title, summary, content, status, created_by, created_at, updated_at)
    VALUES ($1,$2,'customer_document_delivery',$3,$4,$5,$6::jsonb,$7,$8,$9,$9)
    RETURNING id
  `).run(orgId, customerRod.id, documentType, title, summary, content, status, createdBy, now);
  const id = Number(result.lastInsertRowid);
  return db.prepare(`SELECT * FROM org_document_projections WHERE id=$1`).get(id);
}

export async function listOrgDocuments(orgId, documentType = null) {
  if (documentType) {
    return db.prepare(`
      SELECT id, org_id, document_type, title, summary, status, created_at, updated_at
      FROM org_document_projections WHERE org_id=$1 AND document_type=$2 AND status != 'archived'
      ORDER BY created_at DESC
    `).all(orgId, documentType);
  }
  return db.prepare(`
    SELECT id, org_id, document_type, title, summary, status, created_at, updated_at
    FROM org_document_projections WHERE org_id=$1 AND status != 'archived'
    ORDER BY document_type, created_at DESC
  `).all(orgId);
}

export async function getOrgDocument(orgId, id) {
  return db.prepare(`SELECT * FROM org_document_projections WHERE org_id=$1 AND id=$2`).get(orgId, Number(id));
}
