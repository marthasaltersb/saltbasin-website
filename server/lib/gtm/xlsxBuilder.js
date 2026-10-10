// Live-formula workbook generator, ported from
// agents/gtm-deliverable-agent/lib/xlsx_template.py using SheetJS (the
// `xlsx` package, already a platform dependency and already used elsewhere
// in this codebase for writing -- server/lib/careerSemanticTemplate.js).
//
// Styling note: the installed `xlsx` package is the free/community build.
// Cell fills/fonts/colors (SheetJS Pro only) are NOT written here -- values,
// formulas, number formats, column widths, and merged cells all ARE, so the
// workbook is structurally and numerically faithful to the Python version's
// live-formula design, just without the brand-color highlighting. Flagged in
// the implementation plan as a known tradeoff, not an oversight.
import * as XLSX from 'xlsx';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '../../db.js';

const BUCKET = 'gtm-deliverables';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

let bucketReady = null;
async function ensureBucket() {
  if (!supabase) return false;
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    try {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.error('[gtm xlsx] createBucket failed:', error.message);
      }
    } catch (e) {
      console.error('[gtm xlsx] bucket bootstrap error:', e.message);
    }
    return true;
  })();
  return bucketReady;
}

function addr(row, col) {
  return XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
}

// `value` for a formula cell must be the pre-computed cached numeric result
// (not null) -- SheetJS's writer silently drops a cell that has an `f` but
// no `v`/`t` (confirmed by direct write+read round-trip testing), so every
// formula call site below supplies the same arithmetic result JS-side that
// the formula computes spreadsheet-side. `fullCalcOnLoad` (set on the
// workbook in buildXlsxBuffer) makes Excel/Sheets recompute on open
// regardless, so a cached value only needs to be correct at generation time,
// not kept in sync forever.
function setCell(ws, row, col, value, opts = {}) {
  const cell = { v: value };
  if (typeof value === 'number') cell.t = 'n';
  else if (typeof value === 'boolean') cell.t = 'b';
  else cell.t = 's';
  if (opts.formula) {
    cell.f = opts.formula;
    cell.t = 'n';
  }
  if (opts.numFmt) cell.z = opts.numFmt;
  ws[addr(row, col)] = cell;
  const ref = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  ref.e.r = Math.max(ref.e.r, row - 1);
  ref.e.c = Math.max(ref.e.c, col - 1);
  ws['!ref'] = XLSX.utils.encode_range(ref);
}

function headerRow(ws, rowIdx, headers, widths) {
  headers.forEach((h, i) => setCell(ws, rowIdx, i + 1, h));
  if (widths) setColWidths(ws, widths);
}

function writeRow(ws, rowIdx, values) {
  values.forEach((v, i) => setCell(ws, rowIdx, i + 1, v ?? ''));
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

const MONEY_FMT = '$#,##0;($#,##0);-';

function newSheet() {
  const ws = {};
  ws['!ref'] = 'A1:A1';
  return ws;
}

function buildExecutiveDashboard(wb, deliverable) {
  const ws = newSheet();
  setCell(ws, 1, 1, 'Salt Basin Net Works | HandoverOS GTM Deliverable');
  setCell(ws, 2, 1, `Topic: ${deliverable.topic}`);
  if (deliverable.engagement_client_name) {
    setCell(ws, 3, 1, `Client: ${deliverable.engagement_client_name}`);
  }
  setCell(ws, 4, 1, 'DRAFT — HUMAN REVIEW REQUIRED BEFORE CLIENT USE. Nothing in this workbook has been sent or published.');
  setCell(ws, 6, 1, 'EXECUTIVE SUMMARY');
  setCell(ws, 7, 1, deliverable.executive_summary);
  ws['!merges'] = [{ s: { r: 6, c: 0 }, e: { r: 6, c: 5 } }];
  ws['!rows'] = ws['!rows'] || [];
  ws['!rows'][6] = { hpx: 90 };
  setColWidths(ws, [60]);
  XLSX.utils.book_append_sheet(wb, ws, 'Executive Dashboard');
}

function buildBenchmarkMaster(wb, deliverable) {
  const ws = newSheet();
  setCell(ws, 1, 1, 'Benchmark Master — Verified Primary Source Statistics');
  headerRow(ws, 3, ['Metric', 'Value', 'Source', 'Year', 'Sample Size', 'URL', 'Relevance', 'Secondary?'], [26, 16, 22, 10, 20, 30, 34, 12]);
  let row = 4;
  for (const item of deliverable.benchmark_master || []) {
    writeRow(ws, row, [
      item.metric,
      item.value,
      item.source,
      item.year,
      item.sample_size,
      item.url,
      item.relevance_note,
      item.is_secondary_source ? 'SECONDARY' : '',
    ]);
    row += 1;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Verified Source Detail');
}

function buildIndustryBreakdown(wb, deliverable) {
  const rows = deliverable.industry_breakdown || [];
  if (!rows.length) return;
  const ws = newSheet();
  setCell(ws, 1, 1, 'Benchmark by Industry');
  headerRow(
    ws,
    3,
    ['Industry', 'Observed Mechanism', 'Root Cause', 'Rate Estimate', 'Source', 'Program Resolution', 'Q2R Stage Affected'],
    [18, 34, 30, 18, 20, 34, 22]
  );
  let row = 4;
  for (const item of rows) {
    writeRow(ws, row, [
      item.industry,
      item.leakage_or_risk_mechanism,
      item.root_cause,
      item.rate_estimate,
      item.rate_source,
      item.program_resolution,
      item.q2r_stage_affected,
    ]);
    row += 1;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Industry Breakdown');
}

function buildAssumptionsMethodology(wb, deliverable) {
  const ws = newSheet();
  setCell(ws, 1, 1, 'Assumptions & Methodology Register');
  const am = deliverable.assumptions_methodology;
  let row = 3;

  setCell(ws, row, 1, 'SECTION 1 — Verified Primary-Source Statistics (Used As-Is)');
  row += 1;
  headerRow(ws, row, ['Statistic', 'Value Used', 'Primary Source', 'Publication Date', 'Sample Size', 'URL', 'How Applied'], [24, 16, 22, 16, 20, 30, 30]);
  row += 1;
  for (const item of am.verified_statistics || []) {
    writeRow(ws, row, [item.statistic_name, item.value_used, item.primary_source, item.publication_date, item.sample_size, item.url, item.how_applied]);
    row += 1;
  }

  row += 1;
  setCell(ws, row, 1, 'SECTION 2 — Modeled Assumptions (Disclose in Presentations)');
  row += 1;
  headerRow(ws, row, ['Assumption', 'Value Used', 'Conservative', 'Base', 'Optimistic', 'Rationale', 'Recommendation'], [24, 14, 12, 12, 12, 34, 30]);
  row += 1;
  for (const item of am.modeled_assumptions || []) {
    writeRow(ws, row, [item.assumption_name, item.value_used, item.conservative, item.base, item.optimistic, item.rationale, item.recommendation]);
    row += 1;
  }

  row += 1;
  setCell(ws, row, 1, 'SECTION 3 — Scenario-to-Source Mapping');
  row += 1;
  headerRow(ws, row, ['Scenario', 'Mapped Source Category', 'Direct Citation', 'Inference / Gap', 'Confidence', 'Note'], [26, 26, 30, 30, 14, 30]);
  row += 1;
  for (const item of am.scenario_source_mapping || []) {
    writeRow(ws, row, [item.scenario, item.mapped_source_category, item.direct_citation, item.inference_gap, item.confidence_level, item.note]);
    row += 1;
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Assumptions & Methodology');
}

function buildImpactQuantification(wb, deliverable, clientArr) {
  const ws = newSheet();
  const iq = deliverable.impact_quantification;
  setCell(ws, 1, 1, 'Impact Quantification — ROI Calculator');
  setCell(ws, 2, 1, 'Enter ARR in the blue cell. Every other value recalculates live.');

  const arrRow = 4;
  const arrValue = clientArr ?? 0;
  setCell(ws, arrRow, 1, 'Annual Recurring Revenue (ARR)');
  setCell(ws, arrRow, 2, arrValue);
  const arrRef = `$B$${arrRow}`;

  const recoveryRow = 5;
  const recoveryRate = iq.recovery_rate_pct / 100;
  setCell(ws, recoveryRow, 1, 'Recovery Rate');
  setCell(ws, recoveryRow, 2, recoveryRate, { numFmt: '0.0%' });
  setCell(ws, recoveryRow, 3, iq.recovery_rate_source_note);
  const recoveryRef = `$B$${recoveryRow}`;

  const headerRowIdx = 7;
  headerRow(ws, headerRowIdx, ['Scenario', 'Conservative', 'Base', 'High', '3-Yr Cumulative (Base)', 'Recovery Value (3-Yr)', 'Confidence'], [30, 14, 14, 14, 18, 18, 14]);

  let row = headerRowIdx + 1;
  const firstDataRow = row;
  // Column sums (E and F don't need their own accumulator -- they're
  // deterministic functions of the base/cumulative columns per row).
  const colTotals = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const scenario of iq.scenarios || []) {
    const conservative = (scenario.conservative_rate_pct / 100) * arrValue;
    const base = (scenario.base_rate_pct / 100) * arrValue;
    const high = (scenario.high_rate_pct / 100) * arrValue;
    const cumulative3yr = base * 3;
    const recoveryValue = cumulative3yr * recoveryRate;

    setCell(ws, row, 1, scenario.scenario);
    setCell(ws, row, 2, conservative, { formula: `${scenario.conservative_rate_pct / 100}*${arrRef}`, numFmt: MONEY_FMT });
    setCell(ws, row, 3, base, { formula: `${scenario.base_rate_pct / 100}*${arrRef}`, numFmt: MONEY_FMT });
    setCell(ws, row, 4, high, { formula: `${scenario.high_rate_pct / 100}*${arrRef}`, numFmt: MONEY_FMT });
    setCell(ws, row, 5, cumulative3yr, { formula: `C${row}*3`, numFmt: MONEY_FMT });
    setCell(ws, row, 6, recoveryValue, { formula: `E${row}*${recoveryRef}`, numFmt: MONEY_FMT });
    setCell(ws, row, 7, scenario.confidence_level);

    colTotals[2] += conservative;
    colTotals[3] += base;
    colTotals[4] += high;
    colTotals[5] += cumulative3yr;
    colTotals[6] += recoveryValue;
    row += 1;
  }
  const lastDataRow = row - 1;

  const totalRow = row;
  setCell(ws, totalRow, 1, 'TOTAL PORTFOLIO EXPOSURE');
  for (let col = 2; col <= 6; col++) {
    const letter = XLSX.utils.encode_col(col - 1);
    setCell(ws, totalRow, col, colTotals[col], { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, numFmt: MONEY_FMT });
  }

  const totalRecoveryValue = colTotals[6];
  const roiRow = totalRow + 2;
  setCell(ws, roiRow, 1, 'ROI SUMMARY');
  setCell(ws, roiRow + 1, 1, 'Total 3-Year Recovery Value');
  setCell(ws, roiRow + 1, 2, totalRecoveryValue, { formula: `F${totalRow}`, numFmt: MONEY_FMT });

  const programCost = iq.program_three_year_cost_usd;
  if (programCost !== null && programCost !== undefined) {
    setCell(ws, roiRow + 2, 1, 'Program Cost (3 Yrs)');
    setCell(ws, roiRow + 2, 2, programCost, { numFmt: MONEY_FMT });
    setCell(ws, roiRow + 3, 1, 'Net ROI');
    setCell(ws, roiRow + 3, 2, totalRecoveryValue - programCost, { formula: `B${roiRow + 1}-B${roiRow + 2}`, numFmt: MONEY_FMT });
  }

  const multiple = iq.valuation_multiple;
  if (multiple !== null && multiple !== undefined) {
    const valRow = programCost !== null && programCost !== undefined ? roiRow + 4 : roiRow + 2;
    setCell(ws, valRow, 1, `Valuation Impact at ${multiple}x EV`);
    setCell(ws, valRow, 2, (totalRecoveryValue / 3) * multiple, { formula: `(B${roiRow + 1}/3)*${multiple}`, numFmt: MONEY_FMT });
    setCell(ws, valRow, 3, iq.valuation_multiple_source_note || '');
  }

  setColWidths(ws, [30]);
  XLSX.utils.book_append_sheet(wb, ws, 'Impact Quantification');
}

function buildClientMapping(wb, deliverable) {
  const mapping = deliverable.client_mapping;
  if (!mapping) return;
  const ws = newSheet();
  setCell(ws, 1, 1, `Client Data Mapping — ${mapping.client_name}`);
  setCell(ws, 2, 1, `Target schema: ${mapping.target_schema}`);

  let row = 4;
  setCell(ws, row, 1, 'FIELD MAPPING');
  row += 1;
  headerRow(ws, row, ['Raw Column', 'Mapped Field', 'Status', 'Note'], [26, 26, 14, 40]);
  row += 1;
  for (const item of mapping.field_mappings || []) {
    writeRow(ws, row, [item.raw_column, item.mapped_field || '—', item.mapping_status, item.note]);
    row += 1;
  }

  row += 2;
  setCell(ws, row, 1, 'CLIENT ACTUALS VS. BENCHMARK');
  row += 1;
  headerRow(ws, row, ['Metric', 'Client Value', 'Benchmark Value', 'Delta', 'Confidence'], [26, 18, 20, 34, 14]);
  row += 1;
  for (const item of mapping.client_actuals_vs_benchmark || []) {
    writeRow(ws, row, [
      item.metric,
      item.client_value !== null && item.client_value !== undefined ? item.client_value : '—',
      item.benchmark_value,
      item.delta_description,
      item.confidence_level,
    ]);
    row += 1;
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Client Actuals vs Benchmark');
}

function buildDataQualityGaps(wb, deliverable) {
  const gaps = deliverable.data_quality_gaps || [];
  if (!gaps.length) return;
  const ws = newSheet();
  setCell(ws, 1, 1, 'Data Quality Gaps');
  headerRow(ws, 3, ['Description', 'Severity', 'Variance %', 'Threshold Action', 'Exception Class'], [50, 14, 12, 20, 18]);
  let row = 4;
  for (const item of gaps) {
    const variance = item.variance_pct;
    writeRow(ws, row, [
      item.description,
      item.severity,
      variance !== null && variance !== undefined ? `${variance}%` : '—',
      (item.threshold_action || '—').replace(/_/g, ' '),
      (item.exception_class || '—').replace(/_/g, ' '),
    ]);
    row += 1;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Data Quality Gaps');
}

function buildUnverifiedFlags(wb, deliverable) {
  const flags = deliverable.unverified_flags || [];
  if (!flags.length) return;
  const ws = newSheet();
  setCell(ws, 1, 1, 'Unverified Claims — Excluded From Deliverable');
  setCell(ws, 2, 1, 'These did not verify to a primary source and were left out of every other tab.');
  headerRow(ws, 4, ['Claim', 'Reason Unverified'], [50, 50]);
  let row = 5;
  for (const item of flags) {
    writeRow(ws, row, [item.claim, item.reason_unverified]);
    row += 1;
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Unverified — Removed');
}

export function buildXlsxBuffer(deliverable, clientArr = null) {
  const wb = XLSX.utils.book_new();
  buildExecutiveDashboard(wb, deliverable);
  buildBenchmarkMaster(wb, deliverable);
  buildIndustryBreakdown(wb, deliverable);
  buildAssumptionsMethodology(wb, deliverable);
  buildImpactQuantification(wb, deliverable, clientArr);
  buildClientMapping(wb, deliverable);
  buildDataQualityGaps(wb, deliverable);
  buildUnverifiedFlags(wb, deliverable);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Builds the xlsx for a gtm_deliverables row, uploads it to Supabase
// Storage (Render's disk is ephemeral -- never write to local disk here,
// mirroring server/routes/uploads.js's exact bucket/upload pattern), and
// writes the resulting URL back onto the row. Runs automatically once a
// deliverable reaches status='draft' so the download is ready before the
// review queue is opened.
export async function buildXlsxForDeliverable(deliverableId) {
  const row = await db.prepare(`SELECT * FROM gtm_deliverables WHERE id = $1`).get(deliverableId);
  if (!row) throw new Error(`gtm_deliverables row ${deliverableId} not found`);
  const deliverable = typeof row.deliverable_json === 'string' ? JSON.parse(row.deliverable_json) : row.deliverable_json;
  if (!deliverable) throw new Error(`gtm_deliverables row ${deliverableId} has no deliverable_json yet`);

  const clientDataSummary =
    typeof row.client_data_summary === 'string' ? JSON.parse(row.client_data_summary) : row.client_data_summary;
  const clientArr = clientDataSummary?.field_aggregates?.arr?.sum ?? null;

  const buffer = buildXlsxBuffer(deliverable, clientArr);

  if (!supabase) {
    console.warn('[gtm xlsx] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set -- skipping upload, xlsx not persisted.');
    return null;
  }
  await ensureBucket();

  const filename = `${randomBytes(12).toString('hex')}.xlsx`;
  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    upsert: false,
  });
  if (uploadErr) throw new Error(`Supabase upload failed: ${uploadErr.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  await db
    .prepare(`UPDATE gtm_deliverables SET xlsx_storage_url = $1, xlsx_storage_path = $2, updated_at = $3 WHERE id = $4`)
    .run(data.publicUrl, filename, Date.now(), deliverableId);

  return { url: data.publicUrl, path: filename };
}
