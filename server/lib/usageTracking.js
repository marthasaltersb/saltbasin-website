// Member Entitlement usage tracking (2026-07-13) — "capture number of logins
// and interactions at every feature module so usage is tracked." Reuses the
// existing analytics_events table (event_type/object_type/object_id/
// member_user_id/metadata) rather than a new table — it already has exactly
// the shape needed (object_type='member_entitlement_rod', object_id=<rod
// id>), and this keeps one place in the codebase that answers "what
// happened and when" instead of a second, competing events table.
import { db } from '../db.js';
import { resolveProvisioningTemplate } from './provisioningPolicyRegistry.js';
import { handleFirstLogin } from './memberProvisioning.js';

// Called on every successful member login. Idempotent first-login stage
// transitions happen here (handleFirstLogin no-ops after the first call per
// rod); the login *count* itself is not idempotent — every login records a
// new event, by design, so "number of logins" is a real count.
export async function recordLogin(userId) {
  await handleFirstLogin(userId);
  const entitlementRods = await db.prepare(`SELECT id, module_key FROM journey_data_rods WHERE user_id=$1 AND rod_type='member_entitlement'`).all(userId);
  const now = Date.now();
  for (const rod of entitlementRods) {
    await db.prepare(`
      INSERT INTO analytics_events (event_type, object_type, object_id, member_user_id, metadata, occurred_at)
      VALUES ('login','member_entitlement_rod',$1,$2,$3::jsonb,$4)
    `).run(String(rod.id), userId, { moduleKey: rod.module_key }, now);
  }
}

// Called from feature-module UI/routes as they're built (e.g. site editor
// save, resume output generation). `interactionType` must be one of the
// module's configured SALT_BASIN_TRACKED_INTERACTIONS — an unconfigured
// type is rejected rather than silently recorded, so the tracked-interaction
// list stays the single source of truth an org can reconfigure.
export async function recordInteraction({ userId, moduleKey, interactionType, metadata = {} }) {
  const template = resolveProvisioningTemplate(null);
  const allowed = template.trackedInteractions[moduleKey] || [];
  if (!allowed.includes(interactionType)) {
    throw new Error(`"${interactionType}" is not a configured tracked interaction for module "${moduleKey}"`);
  }
  const rod = await db.prepare(`SELECT id FROM journey_data_rods WHERE user_id=$1 AND rod_type='member_entitlement' AND module_key=$2`).get(userId, moduleKey);
  if (!rod) throw new Error(`No member_entitlement rod for user ${userId} / module ${moduleKey} — cannot record interaction`);
  await db.prepare(`
    INSERT INTO analytics_events (event_type, object_type, object_id, member_user_id, metadata, occurred_at)
    VALUES ($1,'member_entitlement_rod',$2,$3,$4::jsonb,$5)
  `).run(interactionType, String(rod.id), userId, metadata, Date.now());
}

// Rollup for admin/member-facing display — real counts computed on demand
// from analytics_events, not a duplicated counter column.
export async function getEntitlementUsageSummary(entitlementRodId) {
  const rows = await db.prepare(`
    SELECT event_type, COUNT(*)::int AS cnt, MAX(occurred_at) AS last_at
    FROM analytics_events WHERE object_type='member_entitlement_rod' AND object_id=$1
    GROUP BY event_type
  `).all(String(entitlementRodId));
  const byType = Object.fromEntries(rows.map((r) => [r.event_type, { count: r.cnt, lastAt: Number(r.last_at) }]));
  return {
    loginCount: byType.login?.count || 0,
    lastLoginAt: byType.login?.lastAt || null,
    interactions: byType,
  };
}
