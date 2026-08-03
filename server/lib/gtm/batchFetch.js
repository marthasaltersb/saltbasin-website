// Polls in-flight Batch API jobs and lands finished results as draft
// deliverables. Ported from
// agents/gtm-deliverable-agent/lib/batch_jobs.py's fetch_batch_results.
import { db } from '../../db.js';
import { requireAnthropicClient } from './anthropicClient.js';
import { buildXlsxForDeliverable } from './xlsxBuilder.js';

// Finds every distinct in-flight batch, checks whether it's finished, and if
// so parses each request's result back onto its own gtm_deliverables row
// (correlated via batch_custom_id). Safe to call repeatedly -- rows already
// resolved out of 'generating' are simply not selected again.
export async function pollAndFetchPendingBatches() {
  const client = requireAnthropicClient();
  const pendingRows = await db
    .prepare(
      `SELECT DISTINCT batch_id FROM gtm_deliverables WHERE status = 'generating' AND batch_id IS NOT NULL`
    )
    .all();

  const summary = { batchesChecked: 0, deliverablesResolved: 0, deliverablesFailed: 0 };

  for (const { batch_id: batchId } of pendingRows) {
    summary.batchesChecked += 1;
    let batch;
    try {
      batch = await client.messages.batches.retrieve(batchId);
    } catch (e) {
      console.warn(`[gtm] batch ${batchId} retrieve failed:`, e.message);
      continue;
    }
    if (batch.processing_status !== 'ended') continue;

    const rows = await db
      .prepare(`SELECT * FROM gtm_deliverables WHERE batch_id = $1 AND status = 'generating'`)
      .all(batchId);
    const rowByCustomId = new Map(rows.map((r) => [r.batch_custom_id, r]));

    for await (const result of await client.messages.batches.results(batchId)) {
      const row = rowByCustomId.get(result.custom_id);
      if (!row) continue;

      if (result.result.type === 'succeeded') {
        try {
          const textBlock = result.result.message.content.find((b) => b.type === 'text');
          const deliverable = JSON.parse(textBlock.text);
          await db
            .prepare(
              `UPDATE gtm_deliverables SET deliverable_json = $1, status = 'draft', updated_at = $2 WHERE id = $3`
            )
            .run(deliverable, Date.now(), row.id);
          await buildXlsxForDeliverable(row.id).catch((e) =>
            console.warn(`[gtm] xlsx build failed for deliverable ${row.id}:`, e.message)
          );
          summary.deliverablesResolved += 1;
        } catch (e) {
          await db
            .prepare(
              `UPDATE gtm_deliverables SET status = 'failed', generation_error = $1, updated_at = $2 WHERE id = $3`
            )
            .run(`Parse error: ${e.message}`, Date.now(), row.id);
          summary.deliverablesFailed += 1;
        }
      } else {
        const errorDetail = result.result.error ? JSON.stringify(result.result.error) : result.result.type;
        await db
          .prepare(
            `UPDATE gtm_deliverables SET status = 'failed', generation_error = $1, updated_at = $2 WHERE id = $3`
          )
          .run(errorDetail, Date.now(), row.id);
        summary.deliverablesFailed += 1;
      }
    }
  }

  return summary;
}
