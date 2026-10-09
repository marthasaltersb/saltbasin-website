// Deterministic client CSV/XLSX column-matching, ported from
// agents/gtm-deliverable-agent/lib/client_data.py. Never guesses -- only
// column names, numeric aggregates for confidently-matched fields, and small
// samples of *unmatched* columns ever leave this function. Row-level client
// data is read into memory to compute the summary and then discarded; it is
// never persisted or sent to Anthropic.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(
  __dirname,
  '../../../agents/gtm-deliverable-agent/schema/capability_mapping_schema.json'
);

const NUMERIC_LIKE_FIELDS = new Set([
  'arr',
  'mrr',
  'cancellation_arr_impact',
  'nrr',
  'grr',
  'ebitda_margin_pct',
  'churn_rate_pct',
  'expansion_arr',
  'contraction_arr',
  'moic',
  'irr',
  'tvpi',
  'dpi',
  'leakage_exposure_usd',
  'confidence_score',
]);

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
}

// Parses a CSV or XLSX buffer into an array of row objects keyed by header.
// SheetJS auto-detects CSV vs. binary XLSX content from the buffer itself.
export function readClientExport(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function scoreSchema(columns, schemaFields) {
  const aliasToKey = new Map();
  for (const field of schemaFields) {
    aliasToKey.set(normalize(field.label), field.key);
    for (const alias of field.aliases) {
      aliasToKey.set(normalize(alias), field.key);
    }
  }
  const matched = {};
  for (const col of columns) {
    const key = aliasToKey.get(normalize(col));
    if (key) matched[col] = key;
  }
  return { score: Object.keys(matched).length, matched };
}

export function normalizeAgainstSchema(columns) {
  const schema = loadSchema();
  const capability = scoreSchema(columns, schema.capability_taxonomy_fields.fields);
  const contract = scoreSchema(columns, schema.contract_revenue_fields.fields);

  let targetSchema;
  let matched;
  if (capability.score === 0 && contract.score === 0) {
    targetSchema = 'unclear';
    matched = {};
  } else if (capability.score >= contract.score * 2) {
    targetSchema = 'capability_taxonomy_fields';
    matched = capability.matched;
  } else if (contract.score >= capability.score * 2) {
    targetSchema = 'contract_revenue_fields';
    matched = contract.matched;
  } else {
    targetSchema = 'mixed';
    matched = { ...capability.matched, ...contract.matched };
  }

  const unmatchedColumns = columns.filter((c) => !(c in matched));
  return { targetSchemaGuess: targetSchema, matchedFields: matched, unmatchedColumns };
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = typeof value === 'string' ? value.replace(/[,$%\s]/g, '') : value;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function buildClientDataSummary(buffer, filename, clientName) {
  const rows = readClientExport(buffer);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const normalization = normalizeAgainstSchema(columns);

  const aggregates = {};
  for (const [rawCol, fieldKey] of Object.entries(normalization.matchedFields)) {
    if (!NUMERIC_LIKE_FIELDS.has(fieldKey)) continue;
    const numericValues = rows.map((r) => toNumber(r[rawCol])).filter((n) => n !== null);
    const missingCount = rows.length - numericValues.length;
    aggregates[fieldKey] = {
      sum: numericValues.length ? numericValues.reduce((a, b) => a + b, 0) : null,
      mean: numericValues.length ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : null,
      missing_count: missingCount,
    };
  }

  const unmatchedSamples = {};
  for (const col of normalization.unmatchedColumns) {
    const samples = rows
      .map((r) => r[col])
      .filter((v) => v !== null && v !== undefined && v !== '')
      .slice(0, 3)
      .map((v) => String(v));
    unmatchedSamples[col] = samples;
  }

  return {
    client_name: clientName,
    source_file: filename,
    row_count: rows.length,
    target_schema_guess: normalization.targetSchemaGuess,
    matched_fields: normalization.matchedFields,
    field_aggregates: aggregates,
    unmatched_columns_with_samples: unmatchedSamples,
  };
}
