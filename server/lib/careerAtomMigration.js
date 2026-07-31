// Career Master data migration (2026-07-16) — populates the Career Atom
// vocabulary seeded by careerAtomRegistry.js with real evidence rows,
// migrated from the legacy career_* tables into journey_rod_evidence
// attached to each user's career_master Channel Rod. Additive only: the
// legacy tables are never modified, dropped, or read as anything other than
// a migration source. Idempotent (ON CONFLICT DO NOTHING matches
// journey_rod_evidence's own UNIQUE(rod_id, molecule_key, source_reference)
// constraint) — re-running for a user who's already migrated is a no-op,
// not a duplicate or an overwrite.
import { db } from '../db.js';
import { CAREER_ENTRY_SOURCES, isJsonbSourceColumn, sourceForTable } from './careerAtomRegistry.js';

async function ensureCareerMasterRod(userId) {
  const existing = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
  if (existing) return existing;
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at)
    VALUES ('career_master',$1,'requested','{"backfilledFromLegacyCareerMaster":true}'::jsonb,$2,$2)
    RETURNING id
  `).run(userId, now);
  const rodId = Number(result.lastInsertRowid);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,'rod_created','requested','{}'::jsonb,$2)`)
    .run(rodId, now);
  return db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(rodId);
}

function atomKeyFor(entryType, column) {
  return `${entryType.replace(/_entry$/, '')}_${column}`;
}

// Migrates every career_* row belonging to one user into Career Atom
// evidence. Returns { rod, migratedEntries, migratedAtoms, skippedExisting }.
export async function migrateCareerDataForUser(userId) {
  const rod = await ensureCareerMasterRod(userId);
  let migratedEntries = 0;
  let migratedAtoms = 0;
  let skippedExisting = 0;

  for (const source of CAREER_ENTRY_SOURCES) {
    const rows = await db.prepare(`SELECT * FROM ${source.table} WHERE user_id=$1`).all(userId);
    for (const row of rows) {
      const sourceReference = `${source.table}:${row.id}`;
      const observedAt = Number(row.updated_at || row.created_at || Date.now());
      let touchedThisEntry = false;

      for (const [column] of source.columns) {
        let rawValue = row[column];
        if (rawValue === null || rawValue === undefined) continue;
        // The db adapter returns jsonb source columns as raw JSON-text
        // strings, not parsed values — parse once here so the real
        // array/object gets stored, not the JSON text treated as a string.
        if (isJsonbSourceColumn(column)) {
          try { rawValue = JSON.parse(rawValue); } catch { /* leave as-is if somehow not valid JSON */ }
        }
        const atomKey = atomKeyFor(source.entryType, column);
        // Tagged with its entryType as a magnetic property — the Semantic
        // Affinity Field bonding engine (server/lib/eidosBonding.js) uses
        // this to compute which atoms attract into the same Molecule,
        // rather than a static pre-declared membership list.
        const result = await db.prepare(`
          INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
          VALUES ($1,$2,$3::jsonb,'legacy_career_master_migration',$4,1,$5,$6::jsonb,$7::jsonb)
          ON CONFLICT (rod_id, molecule_key, source_reference) DO NOTHING
          RETURNING id
        `).run(rod.id, atomKey, rawValue, sourceReference, observedAt, { entryType: source.entryType, sourceTable: source.table, sourceRowId: Number(row.id) }, [source.entryType]);
        if (result.lastInsertRowid) { migratedAtoms += 1; touchedThisEntry = true; } else { skippedExisting += 1; }
      }
      if (touchedThisEntry) migratedEntries += 1;
    }
  }

  return { rod, migratedEntries, migratedAtoms, skippedExisting };
}

// Keeps one legacy row's Career Atom evidence in sync with a live create/
// update from the legacy CRUD routes (server/routes/careerMaster.js). Unlike
// the bulk backfill above (ON CONFLICT DO NOTHING — correct for a one-time
// migration, since it must never touch rows that already have evidence),
// this deletes-then-reinserts so an *edit* to an existing row actually
// updates its evidence instead of silently going stale.
export async function syncSingleEntry(userId, table, rowId) {
  const source = sourceForTable(table);
  if (!source) return null;
  const rod = await ensureCareerMasterRod(userId);
  const sourceReference = `${table}:${rowId}`;
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id=$1 AND user_id=$2`).get(rowId, userId);
  await db.prepare(`DELETE FROM journey_rod_evidence WHERE rod_id=$1 AND source_reference=$2`).run(rod.id, sourceReference);
  if (!row) return { rod, removed: true };

  const observedAt = Number(row.updated_at || row.created_at || Date.now());
  let migratedAtoms = 0;
  for (const [column] of source.columns) {
    let rawValue = row[column];
    if (rawValue === null || rawValue === undefined) continue;
    if (isJsonbSourceColumn(column)) {
      try { rawValue = JSON.parse(rawValue); } catch { /* leave as-is if somehow not valid JSON */ }
    }
    const atomKey = atomKeyFor(source.entryType, column);
    await db.prepare(`
      INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, confidence, observed_at, metadata, magnetic_properties)
      VALUES ($1,$2,$3::jsonb,'legacy_career_master_migration',$4,1,$5,$6::jsonb,$7::jsonb)
    `).run(rod.id, atomKey, rawValue, sourceReference, observedAt, { entryType: source.entryType, sourceTable: table, sourceRowId: Number(rowId) }, [source.entryType]);
    migratedAtoms += 1;
  }
  return { rod, migratedAtoms };
}

// Cleans up evidence for a legacy row that's been deleted — the bulk backfill
// never handles deletes since it only ever reads rows that still exist.
export async function removeEntryEvidence(userId, table, rowId) {
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='career_master'`).get(userId);
  if (!rod) return;
  await db.prepare(`DELETE FROM journey_rod_evidence WHERE rod_id=$1 AND source_reference=$2`).run(rod.id, `${table}:${rowId}`);
}

// Migrates every user who has any legacy career_* rows — the real backfill
// action, run once per the current data set (idempotent if run again).
export async function migrateCareerDataForAllUsers() {
  const userIdSet = new Set();
  for (const source of CAREER_ENTRY_SOURCES) {
    const rows = await db.prepare(`SELECT DISTINCT user_id FROM ${source.table} WHERE user_id IS NOT NULL`).all();
    rows.forEach((r) => userIdSet.add(Number(r.user_id)));
  }
  const results = [];
  for (const userId of userIdSet) {
    results.push({ userId, ...(await migrateCareerDataForUser(userId)) });
  }
  return results;
}
