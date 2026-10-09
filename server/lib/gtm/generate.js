// Request-building and Anthropic call logic, ported from
// agents/gtm-deliverable-agent/lib/batch_jobs.py. No DB writes happen here --
// callers (scheduler.js for the recurring mode, the route handler for
// engagement mode) own persistence.
import { buildCachedSystem } from './context.js';
import { OUTPUT_FORMAT } from './deliverableSchema.js';
import { DRAFT_MODEL, WEB_SEARCH_TOOL, requireAnthropicClient } from './anthropicClient.js';

export const EXEC_STYLES = ['financial_first', 'narrative_first', 'dashboard'];

const RESEARCH_INSTRUCTIONS = (topic, execStyle) =>
  `Research current developments (last 12 months unless the topic is inherently evergreen) on: ${topic}. ` +
  'Follow the deliverable structure, citation standard, and Assumptions & Methodology three-section pattern ' +
  'specified in your system context exactly. Search for primary-sourced benchmarks before drafting -- do not ' +
  `draft from memory alone. Write the executive_summary in the '${execStyle}' style as defined in your system context.`;

const CLIENT_MAPPING_INSTRUCTIONS = (clientSummary) =>
  `\n\nThis run includes client data for ${clientSummary.client_name} ` +
  `(source file: ${clientSummary.source_file}, ${clientSummary.row_count} rows). A deterministic pass ` +
  'already matched these raw columns to the schema with high confidence:\n' +
  `${JSON.stringify(clientSummary.matched_fields, null, 2)}\n\n` +
  'These columns did NOT match confidently and need your judgment -- map each to a schema field if ' +
  "you're confident, or mark it unmapped with why (sample values shown, values may be incomplete):\n" +
  `${JSON.stringify(clientSummary.unmatched_columns_with_samples, null, 2)}\n\n` +
  'Numeric aggregates for the matched fields (sum/mean/missing count, computed from the full dataset ' +
  `locally -- row-level data was not sent):\n${JSON.stringify(clientSummary.field_aggregates, null, 2)}\n\n` +
  `Guessed target schema for this export: ${clientSummary.target_schema_guess} (one of ` +
  'capability_taxonomy_fields / contract_revenue_fields / mixed / unclear -- confirm or correct this in ' +
  "your response's client_mapping.target_schema).\n\n" +
  'Populate client_mapping and client_actuals_vs_benchmark using this data. Populate data_quality_gaps ' +
  'for anything incomplete, ambiguous, or inconsistent -- this is a real deliverable finding, not overhead.';

function assertExecStyle(execStyle) {
  if (!EXEC_STYLES.includes(execStyle)) {
    throw new Error(`exec_style must be one of ${EXEC_STYLES.join(', ')}, got ${execStyle}`);
  }
}

function buildRequestParams(topic, execStyle, clientSummary) {
  assertExecStyle(execStyle);
  let userText = RESEARCH_INSTRUCTIONS(topic, execStyle);
  if (clientSummary) {
    userText += CLIENT_MAPPING_INSTRUCTIONS(clientSummary);
  }
  return {
    model: DRAFT_MODEL,
    max_tokens: 16000,
    system: buildCachedSystem(),
    tools: [WEB_SEARCH_TOOL],
    output_config: { format: OUTPUT_FORMAT },
    messages: [{ role: 'user', content: userText }],
  };
}

// Recurring, no-client-data mode -- Batch API (50% off, non-time-sensitive),
// matching the original cost-lever design. One request per topic.
export async function submitBenchmarkRefreshBatch(topics, execStyle = 'financial_first') {
  const client = requireAnthropicClient();
  const requests = topics.map((topic, i) => ({
    custom_id: `benchmark-${i}`,
    params: buildRequestParams(topic, execStyle, null),
  }));
  const batch = await client.messages.batches.create({ requests });
  return { batchId: batch.id, topics };
}

// On-demand engagement mode -- synchronous, not batched. User-initiated
// inside an admin session expecting a prompt result; batching would just add
// polling UI for a low-volume path. See plan §2 for the rationale.
export async function generateEngagementSync(topic, clientSummary, execStyle = 'financial_first') {
  const client = requireAnthropicClient();
  const params = buildRequestParams(topic, execStyle, clientSummary);
  const response = await client.messages.create(params);
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('Anthropic response contained no text block to parse as the deliverable JSON.');
  }
  return {
    deliverable: JSON.parse(textBlock.text),
    usage: response.usage,
  };
}
