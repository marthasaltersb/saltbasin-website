// Self-service commerce for SMB deliverable packages.
//
// Mirrors the server/lib/email.js pattern: if STRIPE_SECRET_KEY is set,
// create a real Stripe Checkout Session via Stripe's REST API (no SDK
// dependency, matching how email.js calls Brevo's REST API directly). If
// not set, stub the purchase — grant access immediately and log to stdout —
// so local dev and the /verify workflow can exercise the whole flow without
// a Stripe account. commerce_payments.stub records which path was used.
//
// Mid-market/enterprise organizations never reach checkout — see
// isSmbEligible() below — they're routed to /request-custom-scoping instead,
// which creates a lead for Betsy to quote by hand and grant access through
// the existing admin-only license API in profiles.js.

import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireUser, requireAdmin } from '../auth.js';
import { audit } from '../lib/audit.js';
import { makeRateLimiter } from '../lib/rateLimit.js';

const router = Router();
const STRIPE_API = 'https://api.stripe.com/v1';

function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

const checkoutLimiter = makeRateLimiter({ windowMs: 15 * 60_000, max: 20, message: 'Too many checkout attempts — please try again in 15 minutes' });

// ── Segment gate ─────────────────────────────────────────────────────────
// Unset segment = treated as SMB-eligible by default (see db.js comment on
// organization_profiles.segment). Only an explicit 'mid_market' or
// 'enterprise' flag blocks self-service.
async function isSmbEligible(orgId) {
  if (!orgId) return true; // individual purchaser, no org context
  const org = await db.prepare('SELECT segment FROM organization_profiles WHERE id = $1').get(orgId);
  if (!org) return true;
  return org.segment !== 'mid_market' && org.segment !== 'enterprise';
}

function priceForKind(pkg, purchaseKind) {
  if (purchaseKind === 'self_service_view') return pkg.view_price_cents;
  if (purchaseKind === 'self_service_download') return pkg.flat_fee_price_cents;
  if (purchaseKind === 'annual_entitlement') return pkg.annual_price_cents;
  return null;
}

function accessModeForKind(purchaseKind) {
  if (purchaseKind === 'annual_entitlement') return 'annual_entitlement';
  if (purchaseKind === 'self_service_download') return 'self_service_download';
  return 'self_service_view';
}

// Grants product_licenses + data_entitlements for a completed purchase.
// Called from both the no-Stripe stub path and the real webhook handler so
// the two paths can never drift.
async function grantAccess({ userId, pkg, purchaseKind, paymentId }) {
  const now = Date.now();
  const accessMode = accessModeForKind(purchaseKind);
  const allowExport = purchaseKind !== 'self_service_view';
  let expiresAt = null;
  if (purchaseKind === 'self_service_view') {
    expiresAt = now + pkg.view_period_days * 86400000;
  } else if (purchaseKind === 'annual_entitlement') {
    expiresAt = now + 365 * 86400000;
  }
  // self_service_download is a one-time flat output — perpetual access to that artifact.

  const license = await db.prepare(`
    INSERT INTO product_licenses (user_id, org_id, product_id, tier, granted_by, expires_at, access_mode)
    VALUES ($1, NULL, $2, 'standard', NULL, $3, $4)
    RETURNING *
  `).get(userId, pkg.product_id, expiresAt, accessMode);

  await db.prepare(`
    INSERT INTO data_entitlements (license_id, scope)
    VALUES ($1, $2)
  `).run(license.id, JSON.stringify({ deliverablePackageId: pkg.id, allowExport }));

  if (purchaseKind === 'annual_entitlement') {
    await db.prepare(`
      INSERT INTO entitlement_renewals (license_id, period_start, period_end, quarterly_updates_included)
      VALUES ($1, $2, $3, 4)
    `).run(license.id, now, expiresAt);
  }

  await db.prepare(`UPDATE commerce_payments SET status = 'paid', license_id = $1, updated_at = $2 WHERE id = $3`)
    .run(license.id, now, paymentId);

  return license;
}

// ── Public catalog ──────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT id, product_id, title, description, version,
             view_price_cents, view_period_days, flat_fee_price_cents, annual_price_cents
      FROM deliverable_packages
      WHERE is_active = TRUE AND smb_eligible = TRUE
      ORDER BY product_id, title
    `).all();
    res.json({ packages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── My active commerce-granted access (for the member deliverable viewer) ─
router.get('/my-access', requireUser, async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT pl.id AS license_id, pl.product_id, pl.access_mode, pl.expires_at, pl.granted_at,
             de.scope,
             dp.id AS deliverable_id, dp.title, dp.description, dp.html_storage_key
      FROM product_licenses pl
      JOIN data_entitlements de ON de.license_id = pl.id
      JOIN deliverable_packages dp ON dp.id = (de.scope->>'deliverablePackageId')
      WHERE pl.user_id = $1 AND pl.is_active = TRUE
        AND (pl.expires_at IS NULL OR pl.expires_at > $2)
      ORDER BY pl.granted_at DESC
    `).all(req.user.id, Date.now());
    res.json({
      access: rows.map((r) => ({ ...r, allowExport: !!r.scope?.allowExport })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Checkout ─────────────────────────────────────────────────────────────
router.post('/checkout', requireUser, checkoutLimiter, async (req, res) => {
  const { deliverablePackageId, purchaseKind, orgId } = req.body || {};
  if (!deliverablePackageId || !purchaseKind) {
    return res.status(400).json({ error: 'deliverablePackageId and purchaseKind required' });
  }
  if (!['self_service_view', 'self_service_download', 'annual_entitlement'].includes(purchaseKind)) {
    return res.status(400).json({ error: 'invalid purchaseKind' });
  }

  try {
    const eligible = await isSmbEligible(orgId || null);
    if (!eligible) {
      return res.status(403).json({
        error: 'Self-service checkout is available for small and medium businesses. Your organization requires custom scoping.',
        requiresCustomScoping: true,
      });
    }

    const pkg = await db.prepare('SELECT * FROM deliverable_packages WHERE id = $1 AND is_active = TRUE').get(deliverablePackageId);
    if (!pkg) return res.status(404).json({ error: 'deliverable package not found' });

    const amountCents = priceForKind(pkg, purchaseKind);
    if (amountCents == null) return res.status(400).json({ error: `this package is not offered as ${purchaseKind}` });

    const payment = await db.prepare(`
      INSERT INTO commerce_payments (user_id, deliverable_id, purchase_kind, amount_cents, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `).get(req.user.id, pkg.id, purchaseKind, amountCents);

    if (!isStripeConfigured()) {
      // ── Dev stub — mirrors server/lib/email.js's no-BREVO_API_KEY path ──
      console.log('───────────────────────────────────────────────');
      console.log('[commerce · DEV STUB · STRIPE_SECRET_KEY not set]');
      console.log(`  user:      ${req.user.email}`);
      console.log(`  package:   ${pkg.title} (${pkg.id})`);
      console.log(`  kind:      ${purchaseKind}`);
      console.log(`  amount:    $${(amountCents / 100).toFixed(2)}`);
      console.log('  → granting access immediately, no real payment taken');
      console.log('───────────────────────────────────────────────');
      await db.prepare(`UPDATE commerce_payments SET stub = TRUE WHERE id = $1`).run(payment.id);
      const license = await grantAccess({ userId: req.user.id, pkg, purchaseKind, paymentId: payment.id });
      await audit({ req, actor: req.user, action: 'commerce.checkout.stub', entityType: 'product_license', entityId: license.id,
        summary: `Stub-granted ${pkg.title} (${purchaseKind}) — no Stripe key configured` });
      return res.json({ ok: true, stub: true, licenseId: Number(license.id), message: 'Access granted (Stripe not configured in this environment — no payment was taken).' });
    }

    // ── Real Stripe Checkout Session ──
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const params = new URLSearchParams({
      mode: purchaseKind === 'annual_entitlement' ? 'payment' : 'payment', // one-time charge either way; recurring billing is a later phase
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `${pkg.title} — ${purchaseKind.replace(/_/g, ' ')}`,
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][quantity]': '1',
      success_url: `${baseUrl}/member?commerce=success&payment=${payment.id}`,
      cancel_url: `${baseUrl}/member?commerce=cancelled&payment=${payment.id}`,
      client_reference_id: String(payment.id),
      'metadata[paymentId]': String(payment.id),
    });

    const stripeRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await stripeRes.json().catch(() => ({}));
    if (!stripeRes.ok) {
      await db.prepare(`UPDATE commerce_payments SET status = 'failed', updated_at = $1 WHERE id = $2`).run(Date.now(), payment.id);
      console.error('[commerce] Stripe checkout session create failed:', session);
      return res.status(502).json({ error: session?.error?.message || 'payment provider error' });
    }

    await db.prepare(`UPDATE commerce_payments SET stripe_session_id = $1, updated_at = $2 WHERE id = $3`)
      .run(session.id, Date.now(), payment.id);

    res.json({ ok: true, stub: false, checkoutUrl: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stripe webhook ───────────────────────────────────────────────────────
// Mounted with express.raw() in server/index.js (must run before the global
// express.json() parser) so the signature can be verified against the exact
// raw bytes Stripe sent.
router.post('/webhook', async (req, res) => {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = verifyStripeSignature(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[commerce] webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'invalid signature' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = Number(session.client_reference_id || session.metadata?.paymentId);
      if (paymentId) {
        const payment = await db.prepare('SELECT * FROM commerce_payments WHERE id = $1').get(paymentId);
        if (payment && payment.status !== 'paid') {
          const pkg = await db.prepare('SELECT * FROM deliverable_packages WHERE id = $1').get(payment.deliverable_id);
          if (pkg) {
            await grantAccess({ userId: payment.user_id, pkg, purchaseKind: payment.purchase_kind, paymentId: payment.id });
          }
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[commerce] webhook handling failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Minimal Stripe webhook signature check (HMAC-SHA256 over "timestamp.payload"),
// implemented directly rather than pulling in the stripe SDK for one function —
// matches this codebase's existing preference for calling provider REST APIs
// directly (see server/lib/email.js for Brevo).
function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) throw new Error('missing stripe-signature header');
  const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ''))) {
    throw new Error('signature mismatch');
  }
  return JSON.parse(rawBody);
}

// ── Custom scoping request (mid-market / enterprise) ────────────────────
router.post('/request-custom-scoping', requireUser, async (req, res) => {
  const { deliverablePackageId, notes } = req.body || {};
  try {
    const pkg = deliverablePackageId
      ? await db.prepare('SELECT title FROM deliverable_packages WHERE id = $1').get(deliverablePackageId)
      : null;
    const message = [
      pkg ? `Interested in: ${pkg.title}` : 'Requesting custom scoping',
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean).join('\n');

    const lead = await db.prepare(`
      INSERT INTO leads (source, email, name, message, lead_type)
      VALUES ('commerce-custom-scoping', $1, $2, $3, 'commerce')
      RETURNING id
    `).get(req.user.email, req.user.displayName || null, message);

    await audit({ req, actor: req.user, action: 'commerce.custom_scoping.request', entityType: 'lead', entityId: lead.id,
      summary: `Requested custom scoping${pkg ? ` for ${pkg.title}` : ''}` });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: manage the deliverable catalog ────────────────────────────────
router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM deliverable_packages ORDER BY product_id, title').all();
    res.json({ packages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
