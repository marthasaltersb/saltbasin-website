// Member Entitlement Provisioning (2026-07-13) — the direct-to-consumer
// slice of the global provisioning process defined in
// provisioningPolicyRegistry.js. Hooks into the EXISTING lead->member
// conversion flow (server/routes/leads.js POST /public/:publicId/convert,
// which already reuses the lead's password_hash verbatim and calls
// ensureMemberJourneyRods) rather than rebuilding conversion — this module
// only adds what happens *after* a Member Channel Rod exists: entitlement
// rod formation, the linked content rod (Public Site / Career Master),
// welcome email, and first-login stage transitions.
import crypto from 'node:crypto';
import { db } from '../db.js';
import { resolveProvisioningTemplate, PROVISIONING_ORIGINS, isKnownModule } from './provisioningPolicyRegistry.js';
import { sendMemberEntitlementWelcome } from './email.js';
import { createJourneyTributary } from './tributaryRegistry.js';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
const PASSWORD_SET_TOKEN_TTL_MS = 60 * 60 * 1000; // matches auth.js RESET_TTL_MS

async function advanceStage(rodId, toStage, eventType, metadata = {}) {
  const now = Date.now();
  await db.prepare(`UPDATE journey_data_rods SET current_stage=$1, updated_at=$2 WHERE id=$3`).run(toStage, now, rodId);
  await db.prepare(`INSERT INTO journey_rod_events (rod_id,event_type,to_stage,metadata,created_at) VALUES ($1,$2,$3,$4::jsonb,$5)`)
    .run(rodId, eventType, toStage, JSON.stringify(metadata), now);
}

// Does this user's account already have working login credentials that
// predate this provisioning action? True whenever the user originated from
// lead conversion (leads.js already copied the lead's password_hash at
// account-creation time — see leads.js POST /public/:publicId/convert) or
// already has any prior member_entitlement rod (meaning they've logged in
// or been onboarded before). False only for a brand-new account with no
// lead history and no prior entitlement — the "generate a new password"
// case the spec describes.
async function hasExistingCredentials(userId) {
  const fromLead = await db.prepare(`SELECT 1 FROM leads WHERE converted_user_id=$1 AND merged_into_id IS NULL LIMIT 1`).get(userId);
  if (fromLead) return true;
  const priorEntitlement = await db.prepare(`SELECT 1 FROM journey_data_rods WHERE user_id=$1 AND rod_type='member_entitlement' LIMIT 1`).get(userId);
  return !!priorEntitlement;
}

// Issues a password_reset_tokens row and returns the same /reset/<token>
// link the existing forgot-password flow uses — never generates or emails a
// plaintext password. "Top of the level security practices" per Betsy's
// explicit ask: reuse the one, already-reviewed password-set mechanism
// rather than inventing a second one for onboarding.
async function issuePasswordSetLink(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + PASSWORD_SET_TOKEN_TTL_MS;
  await db.prepare(`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)`).run(token, userId, expiresAt);
  return `${PUBLIC_BASE_URL}/reset/${token}`;
}

/**
 * Provision one module's entitlement for an already-existing Member Channel
 * Rod. Idempotent — calling twice for the same (userId, moduleKey) is a
 * no-op on the second call (returns the existing rod, does not re-send the
 * welcome email or re-provision the content rod).
 */
export async function provisionEntitlement({ memberRod, userId, moduleKey, provisioningOrigin = PROVISIONING_ORIGINS.DIRECT_TO_CONSUMER }) {
  if (!isKnownModule(moduleKey)) throw new Error(`Unknown provisioning module: ${moduleKey}`);
  const template = resolveProvisioningTemplate(memberRod.org_id || null);
  const moduleDef = template.modules[moduleKey];

  const existing = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='member_entitlement' AND module_key=$2`).get(userId, moduleKey);
  if (existing) return { entitlementRod: existing, created: false };

  const entitlementRod = await createJourneyTributary({
    parentJourney: memberRod,
    tributaryType: 'member_entitlement_provisioning',
    moduleKey,
    provisioningOrigin,
    stage: 'requested',
  });

  let contentRod = null;
  if (moduleDef.contentRodType) {
    const tributaryType = moduleDef.contentRodType === 'public_site' ? 'member_public_site_provisioning' : 'member_career_provisioning';
    contentRod = await createJourneyTributary({
      parentJourney: entitlementRod,
      tributaryType,
      stage: 'requested',
    });
  }

  await advanceStage(entitlementRod.id, 'credentials_prepared', 'credentials_resolved', {});

  const user = await db.prepare(`SELECT email, display_name FROM users WHERE id=$1`).get(userId);
  const alreadyCredentialed = await hasExistingCredentials(userId);
  const setPasswordUrl = alreadyCredentialed ? null : await issuePasswordSetLink(userId);

  await advanceStage(entitlementRod.id, 'welcome_email_sending', 'welcome_email_dispatch_attempted', {});
  await db.prepare(`UPDATE journey_data_rods SET onboarding_email_status='pending' WHERE id=$1`).run(entitlementRod.id);

  const sendResult = await sendMemberEntitlementWelcome({
    toEmail: user.email,
    toName: user.display_name,
    moduleLabel: moduleDef.label,
    loginUrl: `${PUBLIC_BASE_URL}/member`,
    setPasswordUrl,
  });

  if (sendResult.ok) {
    await db.prepare(`UPDATE journey_data_rods SET onboarding_email_status='sent' WHERE id=$1`).run(entitlementRod.id);
    // Only once we can confirm the welcome email sent without failure does
    // the entitlement visually/structurally show as provisioned — matches
    // Betsy's explicit ask, not a generic "row exists = done" status.
    await advanceStage(entitlementRod.id, 'provisioned', 'welcome_email_confirmed_sent', { emailStub: !!sendResult.stub });
  } else {
    await db.prepare(`UPDATE journey_data_rods SET onboarding_email_status='failed' WHERE id=$1`).run(entitlementRod.id);
    // Stays at 'welcome_email_sending' — not provisioned — until retried.
  }

  const refreshed = await db.prepare(`SELECT * FROM journey_data_rods WHERE id=$1`).get(entitlementRod.id);
  return { entitlementRod: refreshed, contentRod, created: true, emailSent: sendResult.ok };
}

// Provisions every DTC-default module for a freshly-converted Member
// Channel Rod. Called right after ensureMemberJourneyRods in the lead
// conversion route — "onboard a user and give him the personal brand
// website configuration and resume outputs creator" in one action.
export async function provisionDefaultModulesForNewMember(memberRod, userId) {
  const template = resolveProvisioningTemplate(memberRod.org_id || null);
  const results = [];
  for (const moduleKey of Object.keys(template.modules)) {
    results.push(await provisionEntitlement({ memberRod, userId, moduleKey, provisioningOrigin: PROVISIONING_ORIGINS.DIRECT_TO_CONSUMER }));
  }
  return results;
}

/**
 * First-login state transitions (master build ask: "when the user first
 * logs in, now the member channel rod should show an active user, and the
 * entitlement channel rod should show as onboarding"). Idempotent per rod —
 * only advances a rod that hasn't already recorded a first login.
 */
export async function handleFirstLogin(userId) {
  const now = Date.now();
  const rods = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type IN ('member','member_entitlement')`).all(userId);

  for (const rod of rods) {
    if (rod.first_login_at) continue; // already handled
    await db.prepare(`UPDATE journey_data_rods SET first_login_at=$1 WHERE id=$2`).run(now, rod.id);
    if (rod.rod_type === 'member') {
      await advanceStage(rod.id, 'member_active', 'member_channel_rod_active', {});
    } else if (rod.rod_type === 'member_entitlement' && rod.current_stage === 'provisioned') {
      await advanceStage(rod.id, 'onboarding', 'first_login', {});
    }
  }
}
