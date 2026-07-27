// Career Semantic Template (2026-07-27, Phase 1 of the Career Configuration
// Overhaul) — generates a downloadable Excel workbook mapping directly onto
// real Career Atoms/Molecules/bonding rules (careerAtomRegistry.js's 79
// atoms across 7 entry types, journey_atom_affinity_rules' seeded bonding
// rows), mirroring the pattern of Betsy's org-level semantic kernel import
// workbook: reference sheets (what the vocabulary IS) plus fill-in sheets
// (where the member's own data goes).
//
// Design choice, not a literal single "Career_Entries" sheet: one fill-in
// sheet per Career Molecule (entry type) rather than one wide sheet with all
// 79 atom columns. Each entry-type sheet's headers are exact atom labels for
// only that entry type, so a well-behaved re-upload needs no fuzzy matching
// at all (server/lib/careerBondingEngine.js's tag-overlap matching is the
// fallback for renamed/reworded headers or AI-extracted resume fields, not
// the primary path). Far more usable in Excel than one 82-column sheet, and
// the parser in the semantic-import route can resolve headers deterministically.
import * as XLSX from 'xlsx';
import { generateCareerAtomDefinitions, generateCareerMoleculeDefinitions } from './careerAtomRegistry.js';
import { db } from '../db.js';

export const TEMPLATE_VERSION = '2026-07-27.1';

// Excel sheet names cap at 31 chars — short, human-readable per entry type.
const ENTRY_SHEET_NAMES = {
  career_job_entry: 'Entries - Job',
  career_skill_entry: 'Entries - Skill',
  career_tool_entry: 'Entries - Tool',
  career_engagement_entry: 'Entries - Engagement',
  career_domain_entry: 'Entries - Domain',
  career_certification_entry: 'Entries - Certification',
  career_deal_entry: 'Entries - Deal',
};

const EXAMPLE_ROWS = {
  career_job_entry: ['Acme Corp', 'VP of Revenue Operations', '2021-03', '2023-06', '2y 3mo', '', 'Revenue Operations', 'B2B SaaS', 'Grew pipeline conversion 18% via CPQ redesign'],
  career_skill_entry: ['CPQ Architecture', 'Revenue Operations', 'Expert', '8', '6', '2016', 'Designed and led CPQ/CLM implementations across 6 engagements'],
  career_tool_entry: ['Salesforce CPQ', 'Salesforce CPQ', 'Quote-to-Cash', 'Expert', '2016', '5', 'Primary Q2C platform across most engagements', 'Integration Design'],
  career_engagement_entry: ['Q2C Platform Redesign', 'Acme Corp', '', 'Global Manufacturer', 'Manufacturing', '2021-2022', '$50M+ ARR', 'Engagement Lead', 'Legacy quoting process causing 3-week deal cycles', 'Redesigned CPQ workflow, automated approval routing', 'Deal cycle reduced to 4 days, 22% quote accuracy improvement', '4x faster quote turnaround', '', '', '["revenue_operations","cpq"]', 'true', '', '', '', ''],
  career_domain_entry: ['Industry Focus', 'B2B SaaS & Manufacturing', 'Primary verticals of engagement experience', '["SaaS","Manufacturing","Private Equity"]'],
  career_certification_entry: ['Certified Scrum Product Owner', 'Scrum Alliance', 'Process/Delivery', '2019', '2023', '2025', 'Active', 'CSPO-12345', ''],
  career_deal_entry: ['Project Meridian', 'Meridian Data Co', 'Vista Equity Partners', 'Portfolio Operations Lead', 'Buyout', '$1.2B', '1200', '2019-01', '2021-06', '$1.94B', '1940', '61.7', '', '', 'Equity', 'Exited', 'false', '48', '52', '110', ''],
};

function readmeSheet() {
  const rows = [
    ['Salt Basin — Career Semantic Import Template'],
    [`Template version: ${TEMPLATE_VERSION}`],
    [''],
    ['What this is'],
    ['This workbook maps directly onto your real Career Atoms and Career Molecules — the same governed vocabulary your Career Master already uses (see the Career_Atom_Definitions and Career_Molecule_Definitions sheets for reference, and Career_Bonding_Rules for how atoms attach to molecules).'],
    [''],
    ['How to fill it out'],
    ['1. Each "Entries - ..." sheet corresponds to one Career Molecule (an entry type — Job, Skill, Tool, Engagement, Domain, Certification, or Deal).'],
    ['2. Add one row per real entry. The first data row in each sheet is an example — replace it or add new rows below it (delete the example row before uploading if you don\'t want it imported).'],
    ['3. Column headers are the exact Career Atom labels — do not rename them if you want an exact match on upload. If you do rename a header, the upload will try to bond it to the closest real atom automatically and show you the proposed match to confirm before anything is saved.'],
    ['4. Leave a cell blank if that atom does not apply to a given entry.'],
    ['5. Upload the completed workbook via "Upload Data" → "Upload an Existing Resume or Template" in your Career Master. You will see a preview of exactly what will be created — nothing is saved to your Career Master until you confirm it.'],
    [''],
    ['Reference sheets (do not edit — for your information only)'],
    ['- Career_Atom_Definitions: every governed Career Atom, its entry type, and data type.'],
    ['- Career_Molecule_Definitions: every Career Molecule (entry type) and the atoms that compose it.'],
    ['- Career_Bonding_Rules: the governed atom-to-molecule membership rules used to validate your import.'],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function importManifestSheet() {
  const rows = [
    ['key', 'value'],
    ['templateVersion', TEMPLATE_VERSION],
    ['generatedAt', new Date().toISOString()],
    ['entrySheetCount', Object.keys(ENTRY_SHEET_NAMES).length],
    ...Object.entries(ENTRY_SHEET_NAMES).map(([entryType, sheetName]) => [`sheet:${sheetName}`, entryType]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function atomDefinitionsSheet(atoms) {
  const rows = [['Atom Key', 'Label', 'Entry Type', 'Source Column', 'Data Type']];
  for (const atom of atoms) rows.push([atom.atomKey, atom.label, atom.entryType, atom.sourceColumn, atom.dataType]);
  return XLSX.utils.aoa_to_sheet(rows);
}

function moleculeDefinitionsSheet(molecules) {
  const rows = [['Entry Type', 'Label', 'Atom Keys']];
  for (const m of molecules) rows.push([m.entryType, m.label, m.atomKeys.join(', ')]);
  return XLSX.utils.aoa_to_sheet(rows);
}

function bondingRulesSheet(rules) {
  const rows = [['Cluster Key (Entry Type)', 'Molecule Key (Atom)', 'Minimum Affinity']];
  for (const r of rules) rows.push([r.cluster_key, r.molecule_key, Number(r.minimum_affinity)]);
  return XLSX.utils.aoa_to_sheet(rows);
}

function entrySheet(entryType, atoms) {
  const scoped = atoms.filter((a) => a.entryType === entryType);
  const rows = [scoped.map((a) => a.label)];
  if (EXAMPLE_ROWS[entryType]) rows.push(EXAMPLE_ROWS[entryType]);
  return XLSX.utils.aoa_to_sheet(rows);
}

export async function buildCareerSemanticTemplateWorkbook() {
  const atoms = generateCareerAtomDefinitions();
  const molecules = generateCareerMoleculeDefinitions();
  const bondingRules = await db.prepare(
    `SELECT cluster_key, molecule_key, minimum_affinity FROM journey_atom_affinity_rules WHERE org_id IS NULL ORDER BY cluster_key, molecule_key`
  ).all();

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, readmeSheet(), 'README');
  XLSX.utils.book_append_sheet(wb, importManifestSheet(), 'Import_Manifest');
  XLSX.utils.book_append_sheet(wb, atomDefinitionsSheet(atoms), 'Career_Atom_Definitions');
  XLSX.utils.book_append_sheet(wb, moleculeDefinitionsSheet(molecules), 'Career_Molecule_Definitions');
  XLSX.utils.book_append_sheet(wb, bondingRulesSheet(bondingRules), 'Career_Bonding_Rules');
  for (const [entryType, sheetName] of Object.entries(ENTRY_SHEET_NAMES)) {
    XLSX.utils.book_append_sheet(wb, entrySheet(entryType, atoms), sheetName);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function entrySheetNameForType(entryType) {
  return ENTRY_SHEET_NAMES[entryType] || null;
}

export function entryTypeForSheetName(sheetName) {
  return Object.entries(ENTRY_SHEET_NAMES).find(([, name]) => name === sheetName)?.[0] || null;
}

export function allEntrySheetNames() {
  return Object.values(ENTRY_SHEET_NAMES);
}
