import { createClient } from '@supabase/supabase-js';
import { db } from '../db.js';
import { dispatchRaw } from './email.js';
import { createZip } from './zipStore.js';

export async function runCareerFileRetention() {
  if (process.env.CAREER_RETENTION_WORKER_ENABLED !== 'true') return { skipped: 'disabled' };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { skipped: 'storage_not_configured' };
  const storage = createClient(url, key, { auth: { persistSession: false } });
  const now = Date.now();
  const rows = await db.prepare(`
    SELECT d.*, u.email FROM career_intake_documents d JOIN users u ON u.id=d.user_id
    WHERE d.retention_expires_at <= $1 AND d.deleted_at IS NULL
    ORDER BY d.user_id, d.created_at
  `).all(now);
  const grouped = Map.groupBy(rows, (row) => String(row.user_id));
  const results = [];
  for (const docs of grouped.values()) {
    const files = [];
    try {
      for (const doc of docs) {
        const { data, error } = await storage.storage.from(doc.storage_bucket).download(doc.storage_key);
        if (error) throw new Error(error.message);
        files.push({ name: `${doc.id}-${doc.original_filename}`, data: Buffer.from(await data.arrayBuffer()) });
      }
      const zip = createZip(files);
      const delivery = await dispatchRaw({
        to: docs[0].email,
        subject: 'Your Salt Basin Career Master source-document archive',
        text: 'Attached is your archive of source documents retained during the prior 30-day Career Master mapping period. Salt Basin deletes these stored source copies only after this delivery succeeds.',
        attachments: [{ name: `salt-basin-career-sources-${new Date(now).toISOString().slice(0, 10)}.zip`, content: zip }],
      });
      if (!delivery.ok || delivery.stub) throw new Error(delivery.stub ? 'Email provider is in stub mode; deletion withheld' : 'Archive email failed');
      for (const doc of docs) {
        const { error } = await storage.storage.from(doc.storage_bucket).remove([doc.storage_key]);
        if (error) throw new Error(error.message);
        await db.prepare(`UPDATE career_intake_documents SET archive_sent_at=$1, deleted_at=$1, status='retention_deleted', retention_error=NULL, updated_at=$1 WHERE id=$2`).run(now, doc.id);
      }
      results.push({ userId: Number(docs[0].user_id), archived: docs.length });
    } catch (error) {
      await db.prepare(`UPDATE career_intake_documents SET retention_error=$1, updated_at=$2 WHERE user_id=$3 AND retention_expires_at <= $2 AND deleted_at IS NULL`).run(error.message, now, docs[0].user_id);
      results.push({ userId: Number(docs[0].user_id), error: error.message });
    }
  }
  return { processed: rows.length, results };
}
