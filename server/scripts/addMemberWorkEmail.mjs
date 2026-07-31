// Adds a secondary (work) email to an existing lead AND the user that lead
// converted into — one person, two addresses. Written 2026-07-29 for Breck
// Golden (lead 15 -> user 17), but parameterised because this is the normal
// shape of the problem, not a Breck-specific one.
//
// Deliberately NOT a second user record. Both tables already model multiple
// addresses per identity (lead_email_addresses.email_type, user_emails.type),
// so a work address is an addition to the existing person rather than a
// duplicate human across leads / users / member_profiles.
//
// Verification: the new address is written UNVERIFIED by default. Marking an
// address verified without the owner proving control of it would let it be used
// for sign-in and password reset, so --verified is opt-in and should only be
// used for an address you control or have confirmed out of band.
//
// Safe to rerun — both writes are keyed on the address and upsert.
//
// Usage:
//   node server/scripts/addMemberWorkEmail.mjs --leadId=15 --email=breck@example.com [--type=work] [--orgName="LoneTree Capital"] [--verified] [--dry-run]
import 'dotenv/config';
import { db } from '../db.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));

const dryRun = !!args['dry-run'];
const emailType = args.type || 'work';

async function main() {
  const leadId = Number(args.leadId);
  const email = String(args.email || '').toLowerCase().trim();
  if (!leadId || !email) throw new Error('Both --leadId and --email are required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(`"${email}" is not a valid email address.`);

  const lead = await db.prepare('SELECT id, email, name, converted_user_id, merged_into_id FROM leads WHERE id=$1').get(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found.`);
  if (lead.merged_into_id) throw new Error(`Lead ${leadId} was merged into lead ${lead.merged_into_id} — add the address there instead.`);

  // Refuse to attach an address that already belongs to a different person.
  const ownedElsewhere = await db.prepare('SELECT user_id FROM user_emails WHERE lower(email)=$1').get(email);
  if (ownedElsewhere && Number(ownedElsewhere.user_id) !== Number(lead.converted_user_id)) {
    throw new Error(`${email} is already attached to user ${ownedElsewhere.user_id}. Refusing to move an address between people.`);
  }
  const otherUser = await db.prepare('SELECT id FROM users WHERE lower(email)=$1').get(email);
  if (otherUser && Number(otherUser.id) !== Number(lead.converted_user_id)) {
    throw new Error(`${email} is the primary address of user ${otherUser.id}. Refusing to duplicate it.`);
  }

  console.log(`[work-email] lead ${lead.id} (${lead.name || 'unnamed'}, ${lead.email}) -> user ${lead.converted_user_id ?? 'NOT CONVERTED'}`);
  console.log(`[work-email] adding ${email} as type "${emailType}", verified=${!!args.verified}${dryRun ? ' (dry run)' : ''}`);
  if (dryRun) { console.log('[work-email] dry run — nothing written.'); process.exit(0); }

  const now = Date.now();

  await db.prepare(`
    INSERT INTO lead_email_addresses (lead_id, email, email_type, org_name, is_primary, subscribed, created_at)
    VALUES ($1,$2,$3,$4,false,true,$5)
    ON CONFLICT (lead_id, email) DO UPDATE SET email_type=EXCLUDED.email_type, org_name=EXCLUDED.org_name
  `).run(lead.id, email, emailType, args.orgName || null, now);
  console.log('[work-email] lead_email_addresses upserted.');

  if (lead.converted_user_id) {
    await db.prepare(`
      INSERT INTO user_emails (user_id, email, type, verified, created_at)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (email) DO UPDATE SET type=EXCLUDED.type
    `).run(lead.converted_user_id, email, emailType, !!args.verified, now);
    console.log(`[work-email] user_emails upserted for user ${lead.converted_user_id}.`);
    const all = await db.prepare('SELECT email, type, verified FROM user_emails WHERE user_id=$1 ORDER BY id').all(lead.converted_user_id);
    all.forEach((e) => console.log(`   - ${e.email} (${e.type}${e.verified ? ', verified' : ', unverified'})`));
  } else {
    console.log('[work-email] lead is not converted yet — address recorded on the lead only.');
  }

  process.exit(0);
}

main().catch((e) => { console.error('[work-email] failed:', e.message); process.exit(1); });
