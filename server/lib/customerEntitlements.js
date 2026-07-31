// Auto-granted entitlement for a Customer Channel Journey (2026-07-27) — the
// counterpart to commerce.js's grantAccess(), which grants product_licenses
// + data_entitlements from a purchase event. This grants the same two-row
// shape from a *rod* event instead (a member's work email resolving to a
// customer organization) — see ensureCustomerOrgFromWorkEmail() in
// journeyRods.js. Idempotent: a second call for the same user+org is a no-op.
import { db } from '../db.js';

const PRODUCT_ID = 'customer_portal';

export async function grantCustomerViewEntitlement(userId, orgId) {
  const existing = await db.prepare(`
    SELECT id FROM product_licenses WHERE user_id=$1 AND org_id=$2 AND product_id=$3 AND is_active=true
  `).get(userId, orgId, PRODUCT_ID);
  if (existing) return existing;

  const now = Date.now();
  const license = await db.prepare(`
    INSERT INTO product_licenses (user_id, org_id, product_id, tier, granted_by, granted_at, expires_at, is_active)
    VALUES ($1,$2,$3,'standard',NULL,$4,NULL,TRUE)
    RETURNING *
  `).get(userId, orgId, PRODUCT_ID, now);

  await db.prepare(`
    INSERT INTO data_entitlements (license_id, scope)
    VALUES ($1,$2::jsonb)
  `).run(license.id, { capabilities: ['view_proposal', 'view_product_resources'], allowExport: false });

  return license;
}

// Read-side check used by gated document routes (server/routes/orgPortal.js)
// — true if this user has an active license for this org carrying the given
// capability in any of its data_entitlements scopes.
export async function hasCapability(userId, orgId, capability) {
  const rows = await db.prepare(`
    SELECT de.scope FROM data_entitlements de
    JOIN product_licenses pl ON pl.id = de.license_id
    WHERE pl.user_id=$1 AND pl.org_id=$2 AND pl.is_active=true
      AND (pl.expires_at IS NULL OR pl.expires_at > $3)
  `).all(userId, orgId, Date.now());
  return rows.some((row) => Array.isArray(row.scope?.capabilities) && row.scope.capabilities.includes(capability));
}
