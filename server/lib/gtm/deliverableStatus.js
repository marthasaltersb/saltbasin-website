// Guarded status transitions for gtm_deliverables, mirroring
// resumeProjection.js's ALLOWED_STATUSES / updateProjectionStatus pattern.
import { db } from '../../db.js';

export const ALLOWED_STATUSES = ['generating', 'draft', 'reviewed', 'approved', 'sent', 'failed'];

export async function updateDeliverableStatus(deliverableId, status) {
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error(`Invalid deliverable status: ${status}`);
  }
  const result = await db
    .prepare('UPDATE gtm_deliverables SET status = $1, updated_at = $2 WHERE id = $3')
    .run(status, Date.now(), deliverableId);
  if (!result.changes) {
    throw new Error(`gtm_deliverables row ${deliverableId} not found`);
  }
}
