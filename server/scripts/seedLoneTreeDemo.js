// One-off, manually-run demo seed (2026-07-27) — NOT part of server/data/seed.js
// and never runs automatically at boot, per that file's own invariant that
// seed.js must never write member-specific rows. This proves the work-email
// -> Customer Channel Rod -> entitlement -> gated document pipeline end to
// end using the real production code paths (ensureCustomerOrgFromWorkEmail,
// createOrgDocumentProjection), seeded from the LoneTree Capital prospect
// package (Salt_Basin_LoneTree_Prospect_Experience_v5_ORIGINAL_DESIGN).
//
// Usage: node server/scripts/seedLoneTreeDemo.js (--userId=<id>|--targetUserEmail=<primary-email>) [--email=<work-email>]
import 'dotenv/config';
import { db } from '../db.js';
import { ensureCustomerOrgFromWorkEmail } from '../lib/journeyRods.js';
import { createOrgDocumentProjection } from '../lib/orgDocumentProjection.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const workEmail = args.email || 'demo@lonetreecapital.com';

const PROPOSAL_CONTENT = {
  sections: [
    {
      heading: 'The Experience Narrative',
      body: 'Prove the thesis. Build the evidence for what comes next.\n\nPhase 1 asks whether LoneTree can reconstruct, reconcile and defend its fund thesis and selected PortCo value-creation claims using evidence already produced through underwriting, quarterly reporting and operating history. If the backtest succeeds, the same governed proof base can support stronger GP decisions, future LP outreach, Evidence Chain Managed Services and PortCo lead-to-cash optimization.',
    },
    {
      heading: 'Phase 1 Options',
      items: [
        '$25,000 — fund + one PortCo backtest',
        '$35,000 — fund + three PortCo backtests',
        'Pricing is fixed, based on a $2,000 senior-delivery day rate — not fund size, capital raised, transactions, or investment performance.',
      ],
    },
    {
      heading: 'What LoneTree Can Prepare',
      body: 'Using the agreed proposal data-request categories: pipeline exports and stage definitions; the last two PortCo reporting cycles and iLEVEL mappings; COA, trial balance, JE detail, revenue accounts, AR, cash and debt activity; lead-to-cash customer, contract, pricing, invoice, credit, payment, renewal, churn and expansion records; and governance owners, cadence, approvals, definitions, permissions, infrastructure constraints and reporting recipients.',
    },
    {
      heading: 'What Can Follow Phase 1',
      items: [
        'LP Outreach Program tailored to existing/re-up LPs, new institutional LPs, or co-invest/strategic LPs',
        'Evidence Chain Managed Services',
        'Portfolio Company lead-to-cash optimization and revenue-leakage recovery',
      ],
    },
    {
      heading: 'Follow-On Discount',
      body: 'LoneTree receives a 10% first-90-day professional-fee discount when it engages Salt Basin for LP outreach plus either managed evidence-chain support or lead-to-cash advisory within 60 days of Phase 1 delivery. Selecting all three qualifies for 15% for the first 90 days, capped at $15,000. No discount or fee is transaction-contingent.',
    },
  ],
};

async function main() {
  if (!args.userId && !args.targetUserEmail) {
    throw new Error('Explicit --userId or --targetUserEmail is required; refusing to attach demo data to an inferred user.');
  }
  const user = args.userId
    ? await db.prepare('SELECT id, email FROM users WHERE id=$1').get(Number(args.userId))
    : await db.prepare('SELECT id, email FROM users WHERE lower(email)=lower($1)').get(args.targetUserEmail);
  if (!user) throw new Error('No users found — create a member/admin user first.');

  const existingEmail = await db.prepare('SELECT id FROM user_emails WHERE user_id=$1 AND email=$2').get(user.id, workEmail);
  if (!existingEmail) {
    await db.prepare(`
      INSERT INTO user_emails (user_id, email, type, verified) VALUES ($1,$2,'work',true)
    `).run(user.id, workEmail);
    console.log(`[seed-lonetree] Added verified work email ${workEmail} for user ${user.id}`);
  }

  const result = await ensureCustomerOrgFromWorkEmail(user.id, workEmail);
  if (!result) throw new Error(`ensureCustomerOrgFromWorkEmail returned null — is "${workEmail}" a free-mail domain?`);
  const { orgId, customerRod } = result;
  console.log(`[seed-lonetree] Customer org ${orgId}, Customer rod ${customerRod.id}`);

  await db.prepare(`UPDATE organization_profiles SET name='LoneTree Capital' WHERE id=$1 AND name=$2`).run(orgId, workEmail.split('@')[1]);

  const existingDoc = await db.prepare(`SELECT id FROM org_document_projections WHERE org_id=$1 AND document_type='proposal'`).get(orgId);
  if (existingDoc) {
    console.log(`[seed-lonetree] Proposal document already exists (id ${existingDoc.id}) — skipping.`);
  } else {
    const doc = await createOrgDocumentProjection({
      orgId,
      customerRod,
      documentType: 'proposal',
      title: 'Salt Basin × LoneTree Capital — Prospect Operating Thesis',
      summary: 'Prepared exclusively for LoneTree Capital: a Phase 1 fund-and-portfolio backtest, and what can follow it.',
      content: PROPOSAL_CONTENT,
      status: 'published',
      createdBy: user.id,
    });
    console.log(`[seed-lonetree] Created proposal document ${doc.id}`);
  }

  const resourceLinks = [
    { title: 'Evidence Chain & Cost to Produce Truth™', anchor: 'resource-library-evidence-chain', summary: 'How a claim stays defensible from underwriting through exit.' },
    { title: 'Crystal Atom → Molecule → Rod → Orbit', anchor: 'resource-library-orbit-model', summary: 'The governed data model behind every Salt Basin claim.' },
  ];
  for (const resource of resourceLinks) {
    const existingResource = await db.prepare(`SELECT id FROM org_document_projections WHERE org_id=$1 AND title=$2`).get(orgId, resource.title);
    if (existingResource) continue;
    const doc = await createOrgDocumentProjection({
      orgId,
      customerRod,
      documentType: 'product_resource',
      title: resource.title,
      summary: resource.summary,
      content: { sections: [{ body: resource.summary, link: `/resources/product-library#${resource.anchor}`, linkLabel: 'View full resource →' }] },
      status: 'published',
      createdBy: user.id,
    });
    console.log(`[seed-lonetree] Created product resource document ${doc.id} (${resource.title})`);
  }

  console.log(`[seed-lonetree] Done. Visit /org/${orgId} as user ${user.id} (${user.email}) to view it.`);
  process.exit(0);
}

main().catch((e) => { console.error('[seed-lonetree] failed:', e); process.exit(1); });
