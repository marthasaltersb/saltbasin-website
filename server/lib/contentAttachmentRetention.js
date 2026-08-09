// Deletes content_attachments past their 30-day retention window — only
// ever applies to non-admin (member/client) uploads, since admin uploads
// get retention_expires_at = NULL at insert time (see
// server/routes/contentAttachments.js) and are never selected here.
// Unlike careerFileRetention.js, there is no archive-email step — that
// wasn't requested for this table; straightforward deletion after 30 days.
import { createClient } from '@supabase/supabase-js';
import { db } from '../db.js';

export async function runContentAttachmentRetention() {
  if (process.env.CONTENT_ATTACHMENT_RETENTION_WORKER_ENABLED !== 'true') return { skipped: 'disabled' };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: 'storage_not_configured' };
  const storage = createClient(url, key, { auth: { persistSession: false } });
  const now = Date.now();

  const rows = await db.prepare(`
    SELECT * FROM content_attachments
    WHERE retention_expires_at IS NOT NULL AND retention_expires_at <= $1 AND deleted_at IS NULL
    ORDER BY id
  `).all(now);

  const results = [];
  for (const row of rows) {
    try {
      const { error } = await storage.storage.from(row.storage_bucket).remove([row.storage_key]);
      if (error) throw new Error(error.message);
      await db.prepare(`UPDATE content_attachments SET deleted_at=$1, retention_error=NULL WHERE id=$2`).run(now, row.id);
      results.push({ id: row.id, deleted: true });
    } catch (error) {
      await db.prepare(`UPDATE content_attachments SET retention_error=$1 WHERE id=$2`).run(error.message, row.id);
      results.push({ id: row.id, error: error.message });
    }
  }
  return { processed: rows.length, results };
}
