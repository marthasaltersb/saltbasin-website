import express from 'express';
import { db } from '../db.js';
import { getUserFromCookie } from '../auth.js';
import {
  FINANCIAL_CONNECTION_POLICIES,
  FINANCIAL_PROVIDERS,
  FINANCIAL_SHARE_OUTPUT_TYPES,
  classifyLiability,
  resolveFinancialProvider,
} from '../lib/financialPolicyRegistry.js';

const router = express.Router();
const policy = FINANCIAL_CONNECTION_POLICIES.member_private_v1;

router.use(async (req, res, next) => {
  const user = await getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
});

router.get('/providers', (_req, res) => {
  res.json({
    providers: Object.values(FINANCIAL_PROVIDERS).sort((a, b) => a.sortOrder - b.sortOrder),
    shareOutputTypes: FINANCIAL_SHARE_OUTPUT_TYPES,
    policy,
  });
});

router.delete('/connections/:connectionId', async (req, res) => {
  const connection = await db.prepare(`SELECT id,consent_id FROM external_financial_connections WHERE id=$1 AND user_id=$2`).get(req.params.connectionId, req.user.id);
  if (!connection) return res.status(404).json({ error: 'Connection not found' });
  const now = Date.now();
  await db.prepare(`UPDATE external_financial_connections SET status='revoked',updated_at=$1 WHERE id=$2 AND user_id=$3`).run(now, connection.id, req.user.id);
  await db.prepare(`UPDATE financial_consents SET status='revoked',revoked_at=$1 WHERE id=$2 AND user_id=$3`).run(now, connection.consent_id, req.user.id);
  res.json({ ok: true });
});

router.get('/connections', async (req, res) => {
  const connections = await db.prepare(`SELECT * FROM external_financial_connections WHERE user_id=$1 ORDER BY created_at DESC`).all(req.user.id);
  const accounts = await db.prepare(`SELECT * FROM financial_account_definitions WHERE user_id=$1 AND effective_to IS NULL ORDER BY institution_name, account_display_name`).all(req.user.id);
  res.json({ connections, accounts });
});

router.post('/connections', async (req, res) => {
  const provider = resolveFinancialProvider(req.body.providerId);
  if (!provider) return res.status(400).json({ error: 'Unsupported financial provider' });
  const requested = Array.isArray(req.body.permittedAccountClasses) ? req.body.permittedAccountClasses : [];
  if (!requested.length || requested.some((value) => !provider.supportedAccountClasses.includes(value))) {
    return res.status(400).json({ error: 'Invalid permitted account classes' });
  }
  const now = Date.now();
  const consent = await db.prepare(`INSERT INTO financial_consents (user_id,provider_id,permitted_account_classes,granted_at) VALUES ($1,$2,$3,$4) RETURNING id`).get(req.user.id, provider.providerId, requested, now);
  const connection = await db.prepare(`INSERT INTO external_financial_connections (user_id,provider_id,provider_connection_ref,connection_type,consent_id,permitted_account_classes,security_policy_id,retention_policy_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`).get(req.user.id, provider.providerId, req.body.providerConnectionRef ?? null, provider.connectionType, consent.id, requested, policy.securityPolicyId, policy.retentionPolicyId, now);
  res.status(201).json({ connection });
});

router.post('/connections/:connectionId/accounts', async (req, res) => {
  const connection = await db.prepare(`SELECT * FROM external_financial_connections WHERE id=$1 AND user_id=$2`).get(req.params.connectionId, req.user.id);
  if (!connection) return res.status(404).json({ error: 'Connection not found' });
  if (!connection.permitted_account_classes.includes(req.body.accountClass)) return res.status(403).json({ error: 'Account class not consented' });
  const liabilityClass = classifyLiability(req.body.accountClass, req.body.liabilityClass);
  if (!liabilityClass) return res.status(400).json({ error: 'Invalid account class' });
  const now = Date.now();
  const account = await db.prepare(`INSERT INTO financial_account_definitions (user_id,connection_id,provider_account_ref,account_class,liability_class,institution_name,account_display_name,masked_account_reference,currency,semantic_atom_refs,security_policy_id,effective_from) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`).get(req.user.id, connection.id, req.body.providerAccountRef ?? null, req.body.accountClass, liabilityClass, req.body.institutionName, req.body.accountDisplayName, req.body.maskedAccountReference ?? null, req.body.currency || 'USD', req.body.semanticAtomRefs || {}, policy.securityPolicyId, now);
  res.status(201).json({ account });
});

router.post('/shares', async (req, res) => {
  const membership = await db.prepare(`SELECT 1 AS allowed FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(req.user.id, req.body.orgId);
  if (!membership) return res.status(403).json({ error: 'Organization membership required' });
  if (!req.body.consentStatement || !FINANCIAL_SHARE_OUTPUT_TYPES[req.body.outputType] || !req.body.outputPayload) return res.status(400).json({ error: 'Explicit consent statement and a permitted derived output are required' });
  const sourceIds = Array.isArray(req.body.sourceAccountIds) ? req.body.sourceAccountIds : [];
  const owned = sourceIds.length ? await db.prepare(`SELECT id FROM financial_account_definitions WHERE user_id=$1 AND id = ANY($2::bigint[])`).all(req.user.id, sourceIds) : [];
  if (owned.length !== sourceIds.length) return res.status(403).json({ error: 'Source account ownership mismatch' });
  const now = Date.now();
  const share = await db.prepare(`INSERT INTO financial_output_shares (user_id,org_id,output_type,output_payload,source_account_ids,consent_statement,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`).get(req.user.id, req.body.orgId, req.body.outputType, req.body.outputPayload, sourceIds, req.body.consentStatement, now);
  res.status(201).json({ share });
});

router.get('/organizations/:orgId/shares', async (req, res) => {
  const membership = await db.prepare(`SELECT 1 AS allowed FROM org_memberships WHERE user_id=$1 AND org_id=$2`).get(req.user.id, req.params.orgId);
  if (!membership) return res.status(403).json({ error: 'Organization membership required' });
  const shares = await db.prepare(`SELECT id,org_id,output_type,output_payload,data_scope,consent_statement,created_at,updated_at FROM financial_output_shares WHERE org_id=$1 AND revoked_at IS NULL ORDER BY created_at DESC`).all(req.params.orgId);
  res.json({ shares });
});

router.delete('/shares/:shareId', async (req, res) => {
  const result = await db.prepare(`UPDATE financial_output_shares SET revoked_at=$1,updated_at=$1 WHERE id=$2 AND user_id=$3 AND revoked_at IS NULL`).run(Date.now(), req.params.shareId, req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Share not found' });
  res.json({ ok: true });
});

export default router;
