// Member-facing Entitlement dashboard (2026-07-16) — "the admin configurable
// UI ... that's what the members are going to use." Surfaces the Member
// Entitlement Provisioning pipeline (server/lib/memberProvisioning.js) to
// the member themselves: which modules they have, what stage each is at,
// and their usage. Stage list/labels are read from
// provisioningPolicyRegistry.js, not hardcoded here, so an org's own
// configured template (once one exists) changes what members see without a
// code change.
import express from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import { resolveProvisioningTemplate } from '../lib/provisioningPolicyRegistry.js';
import { getEntitlementUsageSummary } from '../lib/usageTracking.js';

const router = express.Router();

router.use(async (req, res, next) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
});

router.get('/', async (req, res) => {
  const memberRod = await db.prepare(`SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='member'`).get(req.user.id);
  const template = resolveProvisioningTemplate(memberRod?.org_id || null);

  const entitlementRods = await db.prepare(`
    SELECT * FROM journey_data_rods WHERE user_id=$1 AND rod_type='member_entitlement' ORDER BY created_at ASC
  `).all(req.user.id);

  const entitlements = [];
  for (const rod of entitlementRods) {
    const moduleDef = template.modules[rod.module_key] || null;
    const contentRod = rod.id
      ? await db.prepare(`SELECT rod_type, current_stage FROM journey_data_rods WHERE parent_rod_id=$1`).get(rod.id)
      : null;
    const usage = await getEntitlementUsageSummary(rod.id);
    entitlements.push({
      id: Number(rod.id),
      moduleKey: rod.module_key,
      moduleLabel: moduleDef?.label || rod.module_key,
      currentStage: rod.current_stage,
      provisioningOrigin: rod.provisioning_origin,
      onboardingEmailStatus: rod.onboarding_email_status,
      firstLoginAt: rod.first_login_at ? Number(rod.first_login_at) : null,
      createdAt: Number(rod.created_at),
      contentRod: contentRod ? { rodType: contentRod.rod_type, currentStage: contentRod.current_stage } : null,
      usage,
    });
  }

  res.json({
    memberRod: memberRod ? { id: Number(memberRod.id), currentStage: memberRod.current_stage, createdAt: Number(memberRod.created_at), firstLoginAt: memberRod.first_login_at ? Number(memberRod.first_login_at) : null } : null,
    stages: template.stages,
    entitlements,
  });
});

export default router;
