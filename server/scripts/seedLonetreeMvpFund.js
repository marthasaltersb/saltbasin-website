// Lonetree MVP demo seed (2026-07-29) — NOT part of server/data/seed.js and
// never runs automatically at boot, matching every other one-off demo seed
// in this directory (seedLoneTreeDemo.js, seedProductResourcePages.js).
// Populates the Fund -> Portfolio Company -> Commercial reconciliation
// dataset for Betsy's Lonetree MVP demonstration (MVP 1: Fund lifecycle,
// MVP 2: PortCo commercial + reconciliation), sourced verbatim from
// server/data/lonetreeMvpSeed/repository.json (converted from Betsy's real
// Salt_Basin_LoneTree_MVP_Executable_Repository_v1.0.xlsx — not invented
// data). Distinct from seedLoneTreeDemo.js, which seeds LoneTree as a Salt
// Basin CUSTOMER (prospect portal / gated proposal docs) — a different
// semantic meaning from this script's LoneTree-as-FUND demo entity.
//
// Usage: node server/scripts/seedLonetreeMvpFund.js [--userId=<id>]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db } from '../db.js';
import { createJourneyTributary } from '../lib/tributaryRegistry.js';
import { LONETREE_EVENT_TYPES, FUND_HIGHWAY_STAGES } from '../lib/lonetreeDemoRegistry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = JSON.parse(readFileSync(join(__dirname, '../data/lonetreeMvpSeed/repository.json'), 'utf-8'));

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));

async function upsertEvidence(rodId, moleculeKey, value, sourceReference, { confidence = null, observedAt = Date.now(), sourceType = 'seed_workbook', actorKey = null } = {}) {
  await db.prepare(`
    INSERT INTO journey_rod_evidence (rod_id, molecule_key, value, source_type, source_reference, actor_key, confidence, observed_at, metadata)
    VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,'{}'::jsonb)
    ON CONFLICT (rod_id, molecule_key, source_reference) DO UPDATE SET value=EXCLUDED.value, confidence=EXCLUDED.confidence, observed_at=EXCLUDED.observed_at
  `).run(rodId, moleculeKey, value, sourceType, sourceReference, actorKey, confidence, observedAt);
}

async function recordEvent(rodId, eventType, { fromStage = null, toStage = null, metadata = {} } = {}) {
  await db.prepare(`
    INSERT INTO journey_rod_events (rod_id, event_type, from_stage, to_stage, metadata, created_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,$6)
  `).run(rodId, eventType, fromStage, toStage, metadata, Date.now());
}

function dateToMs(dateStr) {
  if (!dateStr) return Date.now();
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? Date.now() : d.getTime();
}

async function main() {
  const userId = args.userId
    ? Number(args.userId)
    : (await db.prepare(`SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1`).get())?.id;
  if (!userId) throw new Error('No admin user found — pass --userId=<id>.');

  // 1. Activate the rod types this demo needs — an explicit, deliberate
  // one-time action (per Loop 1's 2026-07-16 "seeded inactive until an
  // admin turns them on" design), not a silent bootstrap default.
  await db.prepare(`UPDATE journey_rod_types SET is_active=true, updated_at=$1 WHERE id IN ('fund_deal','portfolio_company','value_creation')`).run(Date.now());
  console.log('[seed-lonetree-mvp] Activated fund_deal / portfolio_company / value_creation rod types.');

  // 2. Fund Rod — "LoneTree Inaugural Fund I" (ORG-0003).
  const fundOrg = repo.MVP_02_Enterprise_Structure.find((o) => o.Organization_Name === 'LoneTree Inaugural Fund I');
  let fundRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='fund_deal' AND metadata->>'sourceOrgId'=$1`).get(fundOrg.Organization_ID);
  const fundRodIsNew = !fundRod;
  if (!fundRod) {
    const now = Date.now();
    const result = await db.prepare(`
      INSERT INTO journey_data_rods (rod_type, user_id, current_stage, metadata, created_at, updated_at)
      VALUES ('fund_deal',$1,'portfolio_company',$2::jsonb,$3,$3) RETURNING id
    `).run(userId, {
      entityName: fundOrg.Organization_Name,
      sourceOrgId: fundOrg.Organization_ID,
      firmName: 'LoneTree Capital',
      lifecycleStatus: fundOrg.Lifecycle_Status,
      dataStatus: fundOrg.Data_Status,
    }, now);
    fundRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(Number(result.lastInsertRowid));
    console.log(`[seed-lonetree-mvp] Created Fund Rod ${fundRod.id} (${fundOrg.Organization_Name}).`);
  } else {
    console.log(`[seed-lonetree-mvp] Fund Rod ${fundRod.id} already exists — reusing.`);
  }

  // Fund Highway stage history — a compressed event trail through
  // FUND_HIGHWAY_STAGES so the Orbit world / timeline has real movement to
  // render, not just an end-state snapshot.
  if (fundRodIsNew) {
    for (let i = 0; i < FUND_HIGHWAY_STAGES.length; i++) {
      const stage = FUND_HIGHWAY_STAGES[i];
      const prev = i > 0 ? FUND_HIGHWAY_STAGES[i - 1] : null;
      await recordEvent(fundRod.id, 'stage_advanced', { fromStage: prev, toStage: stage, metadata: { seeded: true, highwayId: 'HW-01..HW-09' } });
    }
  }

  // 3. Market Targets + Investment Theses as Fund Rod evidence.
  for (const target of repo.MVP_04_Targets) {
    await upsertEvidence(fundRod.id, 'market_target', target, target.Target_ID, { confidence: target.Composite_Score ? target.Composite_Score / 100 : null, observedAt: dateToMs('2026-08-03') });
  }
  for (const thesis of repo.MVP_05_Investment_Thesis) {
    await upsertEvidence(fundRod.id, 'investment_thesis', thesis, thesis.Thesis_ID, { confidence: thesis.Initial_Confidence, observedAt: dateToMs('2026-08-03') });
  }
  for (const dd of repo.MVP_09_Diligence) {
    await upsertEvidence(fundRod.id, 'investment_thesis', dd, `diligence-${dd.Diligence_ID}`, { confidence: dd.Confidence });
  }
  console.log(`[seed-lonetree-mvp] Seeded ${repo.MVP_04_Targets.length} targets, ${repo.MVP_05_Investment_Thesis.length} theses, ${repo.MVP_09_Diligence.length} diligence items on Fund Rod.`);

  for (const input of repo.MVP_22_Fund_Economics) {
    await upsertEvidence(fundRod.id, 'fund_economics_input', input, `fe-${input.Input.replace(/\s+/g, '_')}`, {});
  }
  console.log(`[seed-lonetree-mvp] Seeded ${repo.MVP_22_Fund_Economics.length} fund economics inputs on Fund Rod.`);

  // 4. Portfolio Company Rod — "HealthCare Portco Example" (ORG-0006), a Tributary child of the Fund Rod.
  let portcoRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE rod_type='portfolio_company' AND parent_rod_id=$1`).get(fundRod.id);
  const portcoRodIsNew = !portcoRod;
  if (!portcoRod) {
    const healthcarePortcoOrg = repo.MVP_02_Enterprise_Structure.find((o) => o.Organization_Name === 'HealthCare Portco Example');
    portcoRod = await createJourneyTributary({
      parentJourney: fundRod,
      tributaryType: 'fund_portfolio_company_provisioning',
      stage: 'commercial',
      metadata: { entityName: healthcarePortcoOrg.Organization_Name, sourceOrgId: healthcarePortcoOrg.Organization_ID, sector: 'Healthcare IT / Software' },
    });
    console.log(`[seed-lonetree-mvp] Created Portfolio Company Rod ${portcoRod.id} (HealthCare Portco Example), child of Fund Rod ${fundRod.id}.`);
  } else {
    console.log(`[seed-lonetree-mvp] Portfolio Company Rod ${portcoRod.id} already exists — reusing.`);
  }

  // 5. Commercial reconciliation chain: Products -> Customers -> Contracts -> Usage -> Invoices -> Revenue -> GL.
  const chainSheets = [
    ['MVP_10_PortCo_Products', 'commercial_product', 'Product_ID'],
    ['MVP_11_PortCo_Customers', 'commercial_customer', 'Customer_ID'],
    ['MVP_12_Contracts', 'commercial_contract', 'Contract_ID'],
    ['MVP_13_Usage_Events', 'commercial_usage_event', 'Usage_Event_ID'],
    ['MVP_14_Invoices_AR', 'commercial_invoice', 'Invoice_ID'],
    ['MVP_15_Revenue_Schedules', 'commercial_revenue_schedule', 'Revenue_Schedule_ID'],
    ['MVP_16_GL_Entries', 'commercial_gl_entry', 'Journal_Line_ID'],
  ];
  for (const [sheet, moleculeKey, idField] of chainSheets) {
    const rows = repo[sheet] || [];
    for (const row of rows) {
      const monthField = row.Usage_Month || row.Invoice_Month || row.Revenue_Month || row.Accounting_Month;
      const observedAt = monthField ? dateToMs(`${monthField}-01`) : Date.now();
      await upsertEvidence(portcoRod.id, moleculeKey, row, String(row[idField]), { observedAt });
    }
    console.log(`[seed-lonetree-mvp] Seeded ${rows.length} ${moleculeKey} evidence rows on Portfolio Company Rod.`);
  }

  // 6. Signals + Business Hypotheses (real Atom fields per lonetreeDemoRegistry.js) + Value Creation Initiatives.
  for (const sig of repo.MVP_17_Signals) {
    const observedAt = dateToMs(sig.Observed_Date);
    await upsertEvidence(portcoRod.id, 'signal_type', sig.Signal_Type, sig.Signal_ID, { observedAt });
    await upsertEvidence(portcoRod.id, 'signal_variance', sig.Magnitude, sig.Signal_ID, { observedAt });
    await upsertEvidence(portcoRod.id, 'signal_confidence', sig.Confidence, sig.Signal_ID, { confidence: sig.Confidence, observedAt });
    await upsertEvidence(portcoRod.id, 'signal_status', sig.Status, sig.Signal_ID, { observedAt });
    await upsertEvidence(portcoRod.id, 'signal_affected_structures', { observation: sig.Observation, originHighway: sig.Origin_Highway, affectedHighways: sig.Affected_Highways, evidenceReference: sig.Evidence_Reference, primarySubjectId: sig.Primary_Subject_ID }, sig.Signal_ID, { observedAt });
    if (portcoRodIsNew) await recordEvent(portcoRod.id, LONETREE_EVENT_TYPES.SIGNAL_DETECTED, { metadata: { signalId: sig.Signal_ID, signalType: sig.Signal_Type, magnitude: sig.Magnitude, confidence: sig.Confidence } });
  }
  for (const hyp of repo.MVP_18_Hypotheses) {
    await upsertEvidence(portcoRod.id, 'hypothesis_statement', hyp.Hypothesis_Statement, hyp.Hypothesis_ID, {});
    await upsertEvidence(portcoRod.id, 'hypothesis_supporting_signals', hyp.Signal_IDs, hyp.Hypothesis_ID, {});
    await upsertEvidence(portcoRod.id, 'hypothesis_probable_causes', hyp.Alternative_Explanations, hyp.Hypothesis_ID, {});
    await upsertEvidence(portcoRod.id, 'hypothesis_status', hyp.Validation_Status, hyp.Hypothesis_ID, {});
    await upsertEvidence(portcoRod.id, 'hypothesis_confidence', hyp.Confidence, hyp.Hypothesis_ID, { confidence: hyp.Confidence });
    if (portcoRodIsNew) await recordEvent(portcoRod.id, LONETREE_EVENT_TYPES.HYPOTHESIS_CREATED, { metadata: { hypothesisId: hyp.Hypothesis_ID, linkedThesisId: hyp.Linked_Thesis_ID, confidence: hyp.Confidence } });
  }
  for (const vci of repo.MVP_19_Value_Creation) {
    await upsertEvidence(portcoRod.id, 'fund_value_creation_initiative', vci, vci.Initiative_ID, { confidence: vci.Confidence, observedAt: dateToMs(vci.Start_Date) });
    if (portcoRodIsNew) await recordEvent(portcoRod.id, LONETREE_EVENT_TYPES.CS_INITIATIVE_STARTED, { metadata: { initiativeId: vci.Initiative_ID, expectedEbitdaImpact: vci.Expected_Annual_EBITDA_Impact_$, expectedEvImpact: vci.Expected_Enterprise_Value_Impact_$ } });
  }
  console.log(`[seed-lonetree-mvp] Seeded ${repo.MVP_17_Signals.length} signals, ${repo.MVP_18_Hypotheses.length} hypotheses, ${repo.MVP_19_Value_Creation.length} value creation initiatives on Portfolio Company Rod.`);

  console.log(`[seed-lonetree-mvp] Done. Fund Rod ${fundRod.id}, Portfolio Company Rod ${portcoRod.id}.`);
  process.exit(0);
}

main().catch((e) => { console.error('[seed-lonetree-mvp] failed:', e); process.exit(1); });
