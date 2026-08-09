// Career Pipeline bulk import (2026-08-09) — reads a member's own
// externally-maintained career pipeline spreadsheet (real, human-researched
// tracked roles, not agent output) and maps its "Career Pipeline" sheet into
// the shape createCareerOpportunity() already accepts. Distinct from
// careerSemanticImport.js: that module imports Career Master atoms (skills,
// jobs, tools — a member's own history); this imports career_opportunity_target
// rows (roles a member is tracking/applying to) — different rod_type,
// different sheet shape, so a separate, small parser rather than overloading
// that one's header-to-Atom matching logic.
import * as XLSX from 'xlsx';

const SHEET_NAME = 'Career Pipeline';

// Header text -> the field key it becomes. Matched case/whitespace-insensitive
// so minor spreadsheet formatting drift doesn't silently drop a column.
const HEADER_MAP = {
  'rank': 'rank',
  'company': 'companyName',
  'role': 'jobTitle',
  'job id': 'jobId',
  'function': 'function',
  'location': 'location',
  'observed': 'observed',
  'verification status': 'verificationStatus',
  'betsy score': 'betsyScore',
  'salt basin relevance': 'saltBasinRelevance',
  'priority': 'priority',
  'application stage': 'applicationStage',
  'company initiative': 'companyInitiative',
  'success kpis': 'successKpis',
  'match rationale': 'matchRationale',
  'official source': 'officialSource',
  'source workbook': 'sourceWorkbook',
  'next action': 'nextAction',
};

function isBlankRow(row) {
  return !row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}

function looksLikeUrl(v) {
  if (!v) return false;
  return /^https?:\/\//i.test(String(v).trim());
}

// Finds the real header row by scanning for one containing both "Company"
// and "Role" — more robust than a hardcoded row index if the sheet's title
// rows above the header shift.
function findHeaderRowIndex(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const normalized = row.map((c) => String(c || '').trim().toLowerCase());
    if (normalized.includes('company') && normalized.includes('role')) return i;
  }
  return -1;
}

/**
 * Parses the workbook's "Career Pipeline" sheet into an array of row objects
 * keyed by the HEADER_MAP field names. Never writes anything — pure parse,
 * same "parse then let the caller decide" shape as parseCareerSemanticWorkbook.
 */
export function parseCareerPipelineWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === SHEET_NAME.toLowerCase());
  if (!sheetName) {
    return { rows: [], error: `No "${SHEET_NAME}" sheet found. Sheets in this workbook: ${wb.SheetNames.join(', ')}` };
  }
  const ws = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null });
  const headerRowIndex = findHeaderRowIndex(rawRows);
  if (headerRowIndex === -1) {
    return { rows: [], error: `Could not find a header row with "Company" and "Role" columns in the "${SHEET_NAME}" sheet.` };
  }
  const headerRow = rawRows[headerRowIndex].map((h) => String(h || '').trim().toLowerCase());
  const fieldByCol = headerRow.map((h) => HEADER_MAP[h] || null);

  const rows = [];
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const raw = rawRows[i];
    if (isBlankRow(raw)) continue;
    const entry = {};
    fieldByCol.forEach((field, colIndex) => {
      if (!field) return;
      const value = raw[colIndex];
      if (value === null || value === undefined || String(value).trim() === '') return;
      entry[field] = typeof value === 'string' ? value.trim() : value;
    });
    if (!entry.companyName || !entry.jobTitle) continue; // not a usable row
    rows.push(entry);
  }
  return { rows, error: null };
}

/** Maps one parsed row into createCareerOpportunity()'s payload shape. */
export function rowToOpportunityPayload(row) {
  const url = looksLikeUrl(row.officialSource) ? row.officialSource : null;
  return {
    jobTitle: row.jobTitle,
    companyName: row.companyName,
    url,
    location: row.location || null,
    notes: row.matchRationale || null,
    proposedByAgent: false,
    agentRationale: null,
    extraMetadata: {
      rank: row.rank ?? null,
      jobId: row.jobId || null,
      function: row.function || null,
      observed: row.observed || null,
      verificationStatus: row.verificationStatus || null,
      betsyScore: row.betsyScore ?? null,
      saltBasinRelevance: row.saltBasinRelevance || null,
      priority: row.priority || null,
      applicationStage: row.applicationStage || 'Not Started',
      companyInitiative: row.companyInitiative || null,
      successKpis: row.successKpis || null,
      matchRationale: row.matchRationale || null,
      officialSource: row.officialSource || null,
      sourceWorkbook: row.sourceWorkbook || null,
      nextAction: row.nextAction || null,
      importedAt: Date.now(),
      importSource: 'career_pipeline_spreadsheet',
    },
  };
}
