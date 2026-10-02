// Rollup-over-evidence builder for the public Career Prospect layout
// (server/routes/careerMaster.js's GET /atom-rollups). Reads a member's
// Career Atom evidence (populated by careerAtomMigration.js, kept live-synced
// with the legacy career_* CRUD) rather than the legacy tables directly —
// per explicit design decision: the legacy tables stay the editing surface,
// the Channel Rod is the read surface for anything member-facing/public.
//
// Two genuinely different mechanisms coexist here, deliberately, per the
// salt-basin-channel-journey-architecture skill:
//   - reconstructEntries() below groups evidence by *provenance*
//     (metadata.sourceRowId) — exact, deterministic, because we already know
//     definitively which atoms came from the same legacy row. This is the
//     right tool for "which fields belong to the same skill/job/tool entry."
//   - eidosBonding.js's real tag-based bonding is the right tool for a
//     genuinely different question bonding is actually suited to: computing
//     an overall Molecule maturity across ALL atoms sharing an entryType tag
//     (e.g. "how mature is this member's Skills Molecule as a whole"),
//     which is fuzzy/aggregate, not given directly by provenance. Forcing
//     tag-based bonding to also do row reconstruction would be strictly
//     worse than the provenance grouping already does for that job.
import { db } from '../db.js';
import { migrateCareerDataForUser } from './careerAtomMigration.js';
import { atomDefinitionsFromRows, resolveAtomGroupings, ATOM_LEGACY_KEYS } from './resumeRollups.js';
import { loadRodAtoms, loadMoleculeDefinition, assembleMolecule } from './eidosBonding.js';

async function getOrBackfillRod(userId) {
  let rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
  if (!rod) {
    // Lazy backfill for a member whose legacy career_* rows predate this
    // feature (or who has never triggered a live-sync write) — cheap
    // idempotent no-op if they have no legacy rows at all.
    const result = await migrateCareerDataForUser(userId);
    rod = result.rod;
  }
  return rod;
}

// Undoes the atom-flattening: groups evidence rows back into one entry
// object per legacy row, keyed by field name (recovered from the atom key by
// stripping the entryType prefix), not by atom key.
function reconstructEntries(evidenceRows) {
  const byEntry = new Map();
  for (const row of evidenceRows) {
    const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    if (!meta?.entryType) continue;
    const entryKey = `${meta.entryType}:${meta.sourceRowId}`;
    if (!byEntry.has(entryKey)) {
      byEntry.set(entryKey, { entryType: meta.entryType, sourceRowId: meta.sourceRowId, fields: {} });
    }
    const prefix = `${meta.entryType.replace(/_entry$/, '')}_`;
    const column = row.molecule_key.startsWith(prefix) ? row.molecule_key.slice(prefix.length) : row.molecule_key;
    // The postgres driver already unwraps JSONB columns into native JS
    // values, so a genuine string atom (e.g. a job title) arrives here as
    // a plain, already-unwrapped string — re-parsing it as JSON throws
    // (bare text isn't valid JSON). Only re-parse the rare double-encoded
    // case (a JSON-text string actually stored inside the column), falling
    // back to the raw string otherwise — same defensive pattern already
    // used for this exact class of issue in careerAtomMigration.js.
    let value = row.value;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { /* leave as the raw string */ }
    }
    byEntry.get(entryKey).fields[column] = value;
  }
  return [...byEntry.values()];
}

// Real bonding: assembles the Molecule for one entryType (all atoms tagged
// with that entryType as a magnetic property) and returns its maturity, or
// null if the member has no atoms of that type yet (the Molecule doesn't
// exist — never a fabricated zero).
async function computeEntryTypeMoleculeMaturity(rodAtoms, entryType) {
  const moleculeDef = await loadMoleculeDefinition(entryType);
  if (!moleculeDef) return null;
  const molecule = assembleMolecule(rodAtoms, moleculeDef);
  return molecule ? molecule.maturity : null;
}

// The member's configured atom_rollup definitions (career_experience_definitions,
// edited in Career Master -> Proficiency & Rollups -> "5 · Resume rollups").
// A member with no stored rows gets the in-memory defaults, which reproduce the
// three groupings this catalog has always returned. Read-only: never seeds.
async function loadAtomRollupDefinitions(userId) {
  const rows = await db.prepare(`SELECT definition_type, definition_key, label, definition, sort_order, is_active FROM career_experience_definitions WHERE user_id=$1 AND definition_type='atom_rollup'`).all(userId);
  return atomDefinitionsFromRows(rows.map((r) => ({
    type: r.definition_type, key: r.definition_key, label: r.label, definition: r.definition || {},
    sortOrder: Number(r.sort_order), isActive: r.is_active !== false,
  })));
}

/** Configured atom groupings for a member, optionally against draft (unsaved) definitions. */
export async function resolveCareerAtomGroupings(userId, definitions = null) {
  const defs = definitions || await loadAtomRollupDefinitions(userId);
  return resolveAtomGroupings(defs, await getCareerAtomEntries(userId));
}

// { skills_by_category, jobs_by_industry, tools_by_wheel_bucket, groupings, atomCount,
//   moleculeMaturity: { skills, jobs, tools } }
// The three legacy keys are driven by the member's atom_rollup definitions with
// those keys (hidden or removed -> []), `groupings` lists every configured
// grouping in the member's order. Each grouping is a chart-ready array of
// { key, label, value }. Empty arrays (not fabricated placeholder data) when
// the member has no evidence yet — callers render an honest empty state instead.
export async function buildCareerAtomRollupCatalog(userId) {
  const rod = await getOrBackfillRod(userId);
  if (!rod) return { skills_by_category: [], jobs_by_industry: [], tools_by_wheel_bucket: [], groupings: [], atomCount: 0, moleculeMaturity: {} };

  const evidenceRows = await db
    .prepare(`SELECT molecule_key, value, metadata FROM journey_rod_evidence WHERE rod_id=$1`)
    .all(rod.id);
  const entries = reconstructEntries(evidenceRows);

  const skills = entries.filter((e) => e.entryType === 'career_skill_entry').map((e) => e.fields);
  const jobs = entries.filter((e) => e.entryType === 'career_job_entry').map((e) => e.fields);
  const tools = entries.filter((e) => e.entryType === 'career_tool_entry').map((e) => e.fields);
  const groupings = resolveAtomGroupings(await loadAtomRollupDefinitions(userId), { skills, jobs, tools });
  const legacy = (k) => groupings.find((g) => g.key === k)?.entries || [];

  // Real Semantic Affinity Field bonding — see the module header for why
  // this coexists with (rather than replaces) reconstructEntries() above.
  const rodAtoms = await loadRodAtoms(rod.id);
  const [skillsMaturity, jobsMaturity, toolsMaturity] = await Promise.all([
    computeEntryTypeMoleculeMaturity(rodAtoms, 'career_skill_entry'),
    computeEntryTypeMoleculeMaturity(rodAtoms, 'career_job_entry'),
    computeEntryTypeMoleculeMaturity(rodAtoms, 'career_tool_entry'),
  ]);

  return {
    skills_by_category: legacy(ATOM_LEGACY_KEYS[0]),
    jobs_by_industry: legacy(ATOM_LEGACY_KEYS[1]),
    tools_by_wheel_bucket: legacy(ATOM_LEGACY_KEYS[2]),
    groupings,
    atomCount: evidenceRows.length,
    moleculeMaturity: { skills: skillsMaturity, jobs: jobsMaturity, tools: toolsMaturity },
  };
}

/**
 * The raw, full-field entries (2026-08-07, real resume generation) —
 * `buildCareerAtomRollupCatalog()` above only returns aggregated category
 * counts, not enough detail to write an actual resume bullet from. Reuses
 * the exact same evidence fetch + reconstructEntries() this file already
 * does, just returns the unreduced entries instead of chart-ready groups.
 */
export async function getCareerAtomEntries(userId) {
  const rod = await getOrBackfillRod(userId);
  if (!rod) return { jobs: [], skills: [], tools: [] };
  const evidenceRows = await db
    .prepare(`SELECT molecule_key, value, metadata FROM journey_rod_evidence WHERE rod_id=$1`)
    .all(rod.id);
  const entries = reconstructEntries(evidenceRows);
  return {
    jobs: entries.filter((e) => e.entryType === 'career_job_entry').map((e) => ({ sourceRowId: e.sourceRowId, ...e.fields })),
    skills: entries.filter((e) => e.entryType === 'career_skill_entry').map((e) => ({ sourceRowId: e.sourceRowId, ...e.fields })),
    tools: entries.filter((e) => e.entryType === 'career_tool_entry').map((e) => ({ sourceRowId: e.sourceRowId, ...e.fields })),
  };
}

// Rollout gate (2026-07-30): a member's public profile should never go live
// before their Career Master data exists — reuses the same atomCount signal
// this module already computes for the public rollup display, rather than a
// second, possibly-drifting "has content" check against the legacy tables
// directly. Called from memberSite.js's and memberConfig.js's /publish routes.
export async function hasCareerPortfolioContent(userId) {
  const rod = await getOrBackfillRod(userId);
  if (!rod) return false;
  const row = await db.prepare(`SELECT COUNT(*)::int AS n FROM journey_rod_evidence WHERE rod_id=$1`).get(rod.id);
  return (row?.n || 0) > 0;
}
