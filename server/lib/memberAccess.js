import { db } from '../db.js';

export const MEMBER_FEATURES = Object.freeze({
  CAREER_CORE: 'career_core',
  MEMBER_SITE: 'member_site',
  CAREER_BESTYSTAFF: 'career_bestystaff',
  CAREER_AGENTS: 'career_agents',
  CAREER_PIPELINE: 'career_pipeline',
});

const DAY_MS = 86_400_000;

export async function ensureCareerFoundationTrial(userId) {
  const existing = await db.prepare(`
    SELECT id FROM member_subscriptions
    WHERE user_id=$1 AND offering_id='member_career_foundation'
    ORDER BY created_at DESC LIMIT 1
  `).get(userId);
  if (existing) return existing;

  const now = Date.now();
  return db.prepare(`
    INSERT INTO member_subscriptions
      (user_id, offering_id, status, trial_started_at, trial_ends_at, current_period_starts_at, current_period_ends_at, created_at, updated_at)
    VALUES ($1, 'member_career_foundation', 'trialing', $2, $3, $2, $3, $2, $2)
    ON CONFLICT (user_id, offering_id) WHERE user_id IS NOT NULL AND sponsor_org_id IS NULL
    DO UPDATE SET updated_at=member_subscriptions.updated_at
    RETURNING id
  `).get(userId, now, now + (90 * DAY_MS));
}

function isCurrentSubscription(row, now) {
  if (!row) return false;
  if (row.status === 'trialing') return Number(row.trial_ends_at || 0) > now;
  return ['active', 'past_due'].includes(row.status) && (!row.current_period_ends_at || Number(row.current_period_ends_at) > now);
}

export async function getMemberAccessSummary(user) {
  if (user.role !== 'admin') await ensureCareerFoundationTrial(user.id);
  const now = Date.now();
  const subscriptions = await db.prepare(`
    SELECT DISTINCT ms.*, co.name AS offering_name, co.price_cents, co.currency,
           co.billing_interval, co.trial_days, co.storage_limit_bytes
    FROM member_subscriptions ms
    JOIN commerce_offerings co ON co.id=ms.offering_id
    LEFT JOIN member_subscription_seats seat ON seat.subscription_id=ms.id
    WHERE ms.user_id=$1 OR seat.user_id=$1
    ORDER BY ms.created_at DESC
  `).all(user.id);
  const activeSubscriptions = subscriptions.filter((row) => isCurrentSubscription(row, now));
  const subscriptionIds = activeSubscriptions.map((row) => row.id);

  let featureRows = [];
  if (subscriptionIds.length) {
    featureRows = await db.prepare(`
      SELECT DISTINCT ofe.feature_key
      FROM offering_features ofe
      JOIN member_subscriptions ms ON ms.offering_id=ofe.offering_id
      LEFT JOIN member_subscription_seats seat ON seat.subscription_id=ms.id
      WHERE ofe.enabled=TRUE AND (ms.user_id=$1 OR seat.user_id=$1)
        AND ms.id = ANY($2::bigint[])
    `).all(user.id, subscriptionIds);
  }
  const grants = await db.prepare(`
    SELECT feature_key FROM member_feature_grants
    WHERE user_id=$1 AND is_active=TRUE AND (expires_at IS NULL OR expires_at>$2)
  `).all(user.id, now);
  const featureSet = new Set([...featureRows, ...grants].map((row) => row.feature_key));

  // Internal Salt Basin users still need a Member identity, but their personal
  // workspace is provisioned by Salt Basin rather than billed through checkout.
  if (user.role === 'admin') Object.values(MEMBER_FEATURES).forEach((key) => featureSet.add(key));

  const storage = await getMemberStorageUsage(user.id);
  const limits = activeSubscriptions.map((row) => Number(row.storage_limit_bytes || 0)).filter(Boolean);
  const limitBytes = limits.length ? Math.max(...limits) : 0;
  return {
    subscriptions: subscriptions.map((row) => ({
      id: Number(row.id), offeringId: row.offering_id, offeringName: row.offering_name,
      status: row.status, priceCents: row.price_cents, currency: row.currency,
      billingInterval: row.billing_interval, trialEndsAt: row.trial_ends_at,
      currentPeriodEndsAt: row.current_period_ends_at, sponsoredByOrgId: row.sponsor_org_id,
      current: isCurrentSubscription(row, now),
    })),
    features: Object.fromEntries(Object.values(MEMBER_FEATURES).map((key) => [key, featureSet.has(key)])),
    storage: { ...storage, limitBytes, remainingBytes: limitBytes ? Math.max(0, limitBytes - storage.usedBytes) : null },
  };
}

export async function hasMemberFeature(user, featureKey) {
  const summary = await getMemberAccessSummary(user);
  return { allowed: !!summary.features[featureKey], summary };
}

export function requireMemberFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const access = await hasMemberFeature(req.user, featureKey);
      if (!access.allowed) {
        return res.status(402).json({
          error: 'This member feature requires an active subscription or organization-sponsored seat.',
          code: 'subscription_required', feature: featureKey, access: access.summary,
        });
      }
      req.memberAccess = access.summary;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export async function getMemberStorageUsage(userId) {
  const row = await db.prepare(`
    SELECT
      COALESCE((SELECT SUM(OCTET_LENGTH(data)) FROM member_sites WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(OCTET_LENGTH(data)) FROM member_configs WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(OCTET_LENGTH(data)) FROM member_json_store WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_jobs t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_skills t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_tools t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_engagements t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_domains t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_certifications t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_deals t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_experience_definitions t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(pg_column_size(t)) FROM career_proficiency_assertions t WHERE user_id=$1),0) +
      COALESCE((SELECT SUM(file_size) FROM career_intake_documents WHERE user_id=$1),0) AS used_bytes,
      COALESCE((SELECT COUNT(*) FROM career_intake_documents WHERE user_id=$1),0) AS source_documents
  `).get(userId);
  return { usedBytes: Number(row?.used_bytes || 0), sourceDocuments: Number(row?.source_documents || 0) };
}
