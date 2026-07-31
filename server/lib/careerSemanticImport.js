// Career Semantic Import parser (2026-07-27, Phase 1) — the reverse
// operation of careerSemanticTemplate.js: reads an uploaded workbook (either
// the generated template, filled in, or a member's own reworked copy) and
// maps each "Entries - ..." sheet's rows to real Career Atoms. Does NOT
// write to journey_rod_evidence — returns a proposal shaped identically to
// careerResumeExtraction.js's bonded proposal, so both paths (Excel import
// and AI resume extraction) can share one preview UI
// (CareerMappingPreview.jsx) and one commit route.
import * as XLSX from 'xlsx';
import { generateCareerAtomDefinitions } from './careerAtomRegistry.js';
import { matchTextToCareerAtom } from './careerBondingEngine.js';
import { entryTypeForSheetName, allEntrySheetNames } from './careerSemanticTemplate.js';

function isBlankRow(row) {
  return !row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}

// Resolves one sheet's header row to Career Atoms for its entry type: exact
// label match first (the expected case for an unmodified template), falling
// back to bonding-engine fuzzy match for a renamed/reworded header. A header
// that matches nothing above the bonding floor is reported, not dropped
// silently, so the preview can show the member exactly what didn't map.
function resolveHeaders(headers, entryType, atomsByEntryType) {
  const scoped = atomsByEntryType.get(entryType) || [];
  return headers.map((header, colIndex) => {
    const trimmed = String(header || '').trim();
    if (!trimmed) return { colIndex, header: trimmed, atomMatch: null, matchType: null };
    const exact = scoped.find((a) => a.label.toLowerCase() === trimmed.toLowerCase());
    if (exact) return { colIndex, header: trimmed, atomMatch: { atomKey: exact.atomKey, label: exact.label, entryType, dataType: exact.dataType, affinity: 1 }, matchType: 'exact' };
    const candidates = matchTextToCareerAtom(trimmed, { entryType });
    return { colIndex, header: trimmed, atomMatch: candidates[0] || null, matchType: candidates[0] ? 'fuzzy' : null };
  });
}

// Parses every recognized "Entries - ..." sheet in the workbook into a
// proposal: { [entryType]: [{ entryType, rowIndex, fieldBonds: { atomKey: { value, header, matchType, affinity } }, unresolvedHeaders: [...] }] }
// Mirrors careerResumeExtraction.js's bondProposedMappings() output shape
// (fieldBonds keyed by resolved atomKey rather than the AI's own field
// names) so both feed the same preview/commit path.
export function parseCareerSemanticWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const atoms = generateCareerAtomDefinitions();
  const atomsByEntryType = new Map();
  for (const atom of atoms) {
    if (!atomsByEntryType.has(atom.entryType)) atomsByEntryType.set(atom.entryType, []);
    atomsByEntryType.get(atom.entryType).push(atom);
  }

  const recognizedSheets = allEntrySheetNames().filter((name) => wb.SheetNames.includes(name));
  const proposal = {};
  const sheetWarnings = [];

  for (const sheetName of recognizedSheets) {
    const entryType = entryTypeForSheetName(sheetName);
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null });
    if (!rows.length) continue;
    const [headerRow, ...dataRows] = rows;
    const resolvedHeaders = resolveHeaders(headerRow, entryType, atomsByEntryType);

    const entries = [];
    dataRows.forEach((row, idx) => {
      if (isBlankRow(row)) return;
      const fieldBonds = {};
      const unresolvedHeaders = [];
      resolvedHeaders.forEach((h) => {
        const value = row[h.colIndex];
        if (value === null || value === undefined || String(value).trim() === '') return;
        if (h.atomMatch) {
          fieldBonds[h.atomMatch.atomKey] = { value, header: h.header, matchType: h.matchType, affinity: h.atomMatch.affinity, label: h.atomMatch.label, sourceLocation: `${sheetName}, row ${idx + 2}, column “${h.header}”` };
        } else {
          unresolvedHeaders.push({ header: h.header, value });
        }
      });
      if (!Object.keys(fieldBonds).length && !unresolvedHeaders.length) return;
      entries.push({ entryType, sourceSheet: sheetName, sourceRow: idx + 2, fieldBonds, unresolvedHeaders });
    });

    if (entries.length) proposal[entryType] = entries;
    const unresolvedCount = resolvedHeaders.filter((h) => h.header && !h.atomMatch).length;
    if (unresolvedCount > 0) {
      sheetWarnings.push({ sheetName, entryType, unresolvedHeaderCount: unresolvedCount, unresolvedHeaders: resolvedHeaders.filter((h) => h.header && !h.atomMatch).map((h) => h.header) });
    }
  }

  const missingSheets = allEntrySheetNames().filter((name) => !wb.SheetNames.includes(name));
  return { proposal, sheetWarnings, missingSheets, recognizedSheets };
}
