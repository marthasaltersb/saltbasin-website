// One-off, manually-run real conversion (2026-07-27) — converts lead id 15
// (Breck Golden, saltbasin-networks@breckgolden.com) to a real member,
// mirroring server/routes/leads.js POST /public/:publicId/convert's core
// logic exactly (same password_hash reuse, same rod/provisioning calls),
// minus the recaptcha/password-reentry/lead-session checks that route
// requires for a public self-service call — this is an admin-direct
// operation instead. Then adds Breck to the existing LoneTree Capital org
// (org_id resolved by email_domain) so he can see the already-seeded
// proposal, per Betsy's explicit choice to scope this to the existing org
// rather than spin up a new one for breckgolden.com.
import 'dotenv/config';
import { db } from '../db.js';
import { ensureMemberJourneyRods, upsertAccountRecord, ensureMemberOrganizationRods } from '../lib/journeyRods.js';
import { provisionDefaultModulesForNewMember } from '../lib/memberProvisioning.js';
import { recordConsent } from '../lib/consentRegistry.js';
import { grantCustomerViewEntitlement } from '../lib/customerEntitlements.js';
import { defaultMemberProfile } from '../data/defaultMemberProfile.js';

async function uniqueSlug(base) {
  const slug = (base || 'operator').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'operator';
  let candidate = slug;
  let n = 1;
  while (await db.prepare(`SELECT 1 FROM member_profiles WHERE slug=$1`).get(candidate)) {
    candidate = `${slug}-${++n}`;
  }
  return candidate;
}

async function main() {
  const lead = await db.prepare(`SELECT id, email, name, password_hash, converted_user_id, merged_into_id FROM leads WHERE id=15`).get();
  if (!lead) throw new Error('Lead 15 not found.');
  if (lead.merged_into_id) throw new Error('Lead has been merged into a newer record.');
  if (lead.converted_user_id) {
    console.log(`[convert-breck] Already converted — user ${lead.converted_user_id}.`);
    process.exit(0);
  }
  if (!lead.password_hash) throw new Error('Lead has no password set.');

  const lowerEmail = lead.email.toLowerCase().trim();
  const existing = await db.prepare(`SELECT id FROM users WHERE email=$1`).get(lowerEmail);
  if (existing) throw new Error(`An account with ${lowerEmail} already exists (user ${existing.id}).`);

  const userInsert = await db.prepare(`INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'member') RETURNING id`)
    .run(lowerEmail, lead.password_hash);
  const userId = Number(userInsert.lastInsertRowid);
  await recordConsent(userId, 'platform_terms', true, { ip: null, userAgent: 'convertBreckGolden.mjs (admin-direct)' });

  const displayName = lead.name || lowerEmail.split('@')[0];
  const slug = await uniqueSlug(displayName);
  const profile = defaultMemberProfile({ displayName, email: lowerEmail });
  await db.prepare(`INSERT INTO member_profiles (user_id, slug, draft, published) VALUES ($1,$2,$3,NULL)`)
    .run(userId, slug, JSON.stringify(profile));

  await db.prepare(`UPDATE leads SET converted_user_id=$1, updated_at=$2 WHERE id=$3`).run(userId, Date.now(), lead.id);
  const memberRod = await ensureMemberJourneyRods(userId, lead.id);
  await upsertAccountRecord({ accountType: 'member', userId, leadId: lead.id, displayName: lead.name || null });
  await provisionDefaultModulesForNewMember(memberRod, userId).catch((e) => console.error('[convert-breck] provisionDefaultModulesForNewMember failed:', e.message));

  await db.prepare(`INSERT INTO user_emails (user_id, email, type, verified) VALUES ($1,$2,'primary',true) ON CONFLICT (email) DO NOTHING`)
    .run(userId, lowerEmail);

  console.log(`[convert-breck] Converted lead 15 -> user ${userId} (${lowerEmail}), slug=${slug}.`);

  const org = await db.prepare(`SELECT id, name FROM organization_profiles WHERE email_domain='lonetreecapital.com'`).get();
  if (!org) throw new Error('LoneTree Capital org not found — run seedLoneTreeDemo.js first.');
  await db.prepare(`INSERT INTO org_memberships (user_id, org_id, role) VALUES ($1,$2,'member') ON CONFLICT (user_id, org_id) DO NOTHING`)
    .run(userId, org.id);
  await ensureMemberOrganizationRods(userId, Number(org.id));
  await grantCustomerViewEntitlement(userId, Number(org.id));

  console.log(`[convert-breck] Added user ${userId} to org ${org.id} (${org.name}) with view_proposal/view_product_resources entitlement.`);
  console.log(`[convert-breck] Done. Log in as ${lowerEmail} (their existing lead password) and visit /org/${org.id}.`);
  process.exit(0);
}

main().catch((e) => { console.error('[convert-breck] failed:', e); process.exit(1); });
