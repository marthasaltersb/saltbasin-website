// Idempotent seed for the Member Experience Module (2026-07-29) — upserts
// server/data/proposalExperienceSeed/repository.json (ported from
// Salt_Basin_MVP_Proposal_Semantic_Seed_Repository_v0.1.xlsx) as
// journey_rod_evidence rows against one member's proposal_experience Channel
// Rod, using the record-atom vocabulary from
// server/lib/proposalExperienceRegistry.js. Safe to rerun — every row is
// keyed by (rod_id, molecule_key, source_reference), so a second run updates
// in place rather than duplicating (AC13).
//
// Usage: node server/scripts/seedProposalExperience.js [--userId=<id>] [--email=<login-email>]
import 'dotenv/config';
import { db } from '../db.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ensureMemberJourneyRods, upsertJourneyEvidence } from '../lib/journeyRods.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = JSON.parse(readFileSync(path.join(__dirname, '../data/proposalExperienceSeed/repository.json'), 'utf8'));

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));

async function main() {
  const user = args.userId
    ? await db.prepare('SELECT id, email FROM users WHERE id=$1').get(Number(args.userId))
    : args.email
      ? await db.prepare('SELECT id, email FROM users WHERE email=$1').get(args.email.toLowerCase())
      : await db.prepare(`SELECT id, email FROM users WHERE email='saltbasin-networks@breckgolden.com'`).get();
  if (!user) throw new Error('No matching user found — pass --userId=<id> or --email=<login-email>.');

  const memberRod = await ensureMemberJourneyRods(user.id);
  const rod = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='proposal_experience' AND parent_rod_id=$1`).get(memberRod.id);
  if (!rod) throw new Error(`proposal_experience rod not found for member rod ${memberRod.id} — ensureMemberJourneyRods should have created it.`);

  let count = 0;
  const upsert = async (moleculeKey, sourceReference, value) => {
    await upsertJourneyEvidence(rod.id, { moleculeKey, value, sourceType: 'seed', sourceReference, confidence: 1 });
    count += 1;
  };

  for (const h of repo.highways) await upsert('highway', h.id, h);
  for (const s of repo.proposalSections) await upsert('proposal_section', s.id, s);
  for (const s of repo.salesNarrativeScenes) await upsert('sales_narrative_scene', s.id, s);
  for (const d of repo.diagnosticModules) await upsert('diagnostic_module', d.id, d);
  for (const e of repo.evidenceItems) await upsert('evidence_item', e.id, e);
  for (const s of repo.opportunityScenarios) await upsert('opportunity_scenario', s.id, s);

  console.log(`[seed-proposal-experience] Upserted ${count} evidence rows on proposal_experience rod ${rod.id} (member ${user.id}, ${user.email}).`);
  console.log(`[seed-proposal-experience] Done. Log in as ${user.email} and visit /member.`);
  process.exit(0);
}

main().catch((e) => { console.error('[seed-proposal-experience] failed:', e); process.exit(1); });
