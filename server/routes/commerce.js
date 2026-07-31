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
import { ensureUserRevenueRod, recordRodEvent, promoteLeadToOrganizationLead, upsertJourneyEvidence } from '../lib/journeyRods.js';

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
  `).run(license.id, { deliverablePackageId: pkg.id, allowExport });

  if (purchaseKind === 'annual_entitlement') {
    await db.prepare(`
      INSERT INTO entitlement_renewals (license_id, period_start, period_end, quarterly_updates_included)
      VALUES ($1, $2, $3, 4)
    `).run(license.id, now, expiresAt);
  }

  await db.prepare(`UPDATE commerce_payments SET status = 'paid', license_id = $1, updated_at = $2 WHERE id = $3`)
    .run(license.id, now, paymentId);

  // Feed the real Journey Data Rod engine (server/lib/journeyRods.js) so a
  // commerce purchase is reflected in the buyer's revenue_lifecycle rod, not
  // just the commerce tables. Best-effort — a rod hiccup should never block
  // an already-completed purchase. Creates the revenue rod lazily, right
  // here at the moment of a real purchase — not pre-created at signup.
  try {
    const rod = await ensureUserRevenueRod(userId);
    if (rod) {
      await recordRodEvent(rod.id, {
        eventType: 'commerce_purchase',
        potentialRevenueDeltaCents: 0,
        scoreDelta: purchaseKind === 'annual_entitlement' ? 15 : 5,
        metadata: { productId: pkg.product_id, deliverablePackageId: pkg.id, purchaseKind },
      });
    }
  } catch (e) {
    console.warn('[commerce] journey rod event skipped:', e.message);
  }

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
// NOT mounted on `router` — Express only stops walking later middleware
// once a response is sent, so if this lived on the router it would still
// pass back through the global express.json() parser first (which would
// try to read the already-consumed raw stream a second time). Instead
// server/index.js registers this handler directly, with express.raw(),
// as its own complete route BEFORE app.use(express.json()) — the response
// it sends ends the cycle for that request before json() ever runs.
export async function stripeWebhookHandler(req, res) {
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
}

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
// Uses the Member Organization Lead mechanic (server/lib/journeyRods.js)
// rather than a bare `leads` row: a member signaling they represent an
// organization that needs custom scoping gets its own revenue_lifecycle
// rod, which matures on real evidence and — per evaluateJourneyRod — is
// promoted into a real organization_profiles record + rod ownership
// transition once it clears the 'qualified_opportunity' gate. This is the
// same lazy, evidence-driven creation principle ensureUserRevenueRod uses
// for purchases; a scoping request is exactly this scenario, not a plain
// contact-form submission.
router.post('/request-custom-scoping', requireUser, async (req, res) => {
  const { deliverablePackageId, notes } = req.body || {};
  try {
    const pkg = deliverablePackageId
      ? await db.prepare('SELECT title FROM deliverable_packages WHERE id = $1').get(deliverablePackageId)
      : null;
    const emailDomain = (req.user.email || '').split('@')[1] || null;

    const { leadId, rod } = await promoteLeadToOrganizationLead(req.user.id, {
      orgSignalSource: 'commerce-custom-scoping',
      emailDomain,
    });

    if (rod) {
      const interestNote = [
        pkg ? `Interested in: ${pkg.title}` : 'Requesting custom scoping',
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join('\n');
      await upsertJourneyEvidence(rod.id, {
        moleculeKey: 'custom_scoping_interest',
        value: interestNote,
        sourceType: 'commerce_request',
        actorKey: `user:${req.user.id}`,
        confidence: 1,
        metadata: { deliverablePackageId: deliverablePackageId || null },
      });
    }

    await audit({ req, actor: req.user, action: 'commerce.custom_scoping.request', entityType: 'lead', entityId: leadId,
      summary: `Requested custom scoping${pkg ? ` for ${pkg.title}` : ''}` });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sample onboarding journey (5 questions per product) ─────────────────
// The wizard collects answers client-side and submits the whole run once
// completed — generalization of career_intake_runs (server/db.js) to any
// product. Saved context is available to Betsy for future work but isn't
// otherwise gated behind a purchase.
router.post('/onboarding-runs', requireUser, async (req, res) => {
  const { productId, answers } = req.body || {};
  if (!productId || !Array.isArray(answers) || !answers.length) {
    return res.status(400).json({ error: 'productId and a non-empty answers array are required' });
  }
  try {
    const now = Date.now();
    const run = await db.prepare(`
      INSERT INTO product_onboarding_runs (user_id, product_id, answers, status, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, 'completed', $4, $4)
      RETURNING *
    `).get(req.user.id, productId, answers.slice(0, 5), now);

    // Best-effort: a completed sample journey is meaningful commercial
    // signal — record it against the member's revenue_lifecycle rod exactly
    // like a commerce purchase does in grantAccess() above.
    try {
      const rod = await ensureUserRevenueRod(req.user.id);
      if (rod) {
        await recordRodEvent(rod.id, {
          eventType: 'sample_onboarding_completed',
          scoreDelta: 3,
          metadata: { productId },
        });
      }
    } catch (e) {
      console.warn('[commerce] journey rod event skipped:', e.message);
    }

    await audit({ req, actor: req.user, action: 'commerce.onboarding.completed', entityType: 'product_onboarding_run', entityId: run.id,
      summary: `Completed sample onboarding for ${productId}` });

    res.json({ ok: true, run });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/onboarding-runs', requireUser, async (req, res) => {
  try {
    const rows = await db.prepare(
      `SELECT * FROM product_onboarding_runs WHERE user_id = $1 ORDER BY created_at DESC`
    ).all(req.user.id);
    res.json({ runs: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Message Betsy ─────────────────────────────────────────────────────────
// member_messages requires an accepted member_connections row (see
// server/routes/members.js POST /me/messages) — that's the right model for
// member-to-member messaging, but too much friction for "message Betsy
// directly" from a product page. This auto-establishes (or reuses) an
// accepted connection with the platform's admin account, then the existing
// InboxPanel/messages endpoints work unmodified.
router.post('/message-betsy/start', requireUser, async (req, res) => {
  try {
    const betsy = await db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`).get();
    if (!betsy) return res.status(503).json({ error: 'no admin account configured' });
    if (Number(betsy.id) === Number(req.user.id)) return res.status(400).json({ error: 'cannot message yourself' });

    const existing = await db.prepare(
      `SELECT id FROM member_connections WHERE status = 'accepted'
         AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))`
    ).get(req.user.id, betsy.id);

    if (!existing) {
      await db.prepare(`
        INSERT INTO member_connections (requester_id, recipient_id, status, message)
        VALUES ($1, $2, 'accepted', 'Auto-connected via Message Betsy')
        ON CONFLICT (requester_id, recipient_id) DO UPDATE SET status = 'accepted', updated_at = EXCLUDED.updated_at
      `).run(req.user.id, betsy.id);
    }

    res.json({ ok: true, recipientId: Number(betsy.id) });
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
