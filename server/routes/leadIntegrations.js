import { Router } from 'express';
import crypto from 'node:crypto';
import { db, getJSON } from '../db.js';

const router = Router();
const PROVIDERS = new Set(['pitchbook', 'dnb', 'salesforce', 'hubspot', 'marketo', 'marketing', 'generic']);

function authorized(req) {
  const expected = process.env.LEAD_INTEGRATION_API_KEY || '';
  const provided = String(req.get('x-saltbasin-api-key') || '').trim();
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireIntegrationKey(req, res, next) {
  if (!authorized(req)) return res.status(401).json({ error: 'invalid integration API key' });
  next();
}

function first(...values) {
  return values.find((v) => v !== undefined && v !== null && String(v).trim() !== '') ?? null;
}

function normalize(provider, payload) {
  const p = payload || {};
  const contact = p.contact || p.person || p.lead || {};
  const company = p.company || p.organization || p.account || {};
  const email = first(p.email, p.Email, contact.email, contact.Email, p.emailAddress);
  return {
    source: `external_${provider}`,
    email,
    phone: first(p.phone, p.Phone, contact.phone, contact.Phone, contact.mobilePhone),
    name: first(p.name, p.Name, contact.name, contact.Name, [contact.firstName, contact.lastName].filter(Boolean).join(' ')),
    message: first(p.message, p.description, p.notes, p.comments, p.activityDescription, `Lead ingested from ${provider}`),
    ctaLocation: `integration:${provider}`,
    answers: {
      provider,
      externalId: first(p.id, p.Id, p.externalId, p.recordId, contact.id, contact.Id),
      companyName: first(p.companyName, p.Company, company.name, company.Name),
      companyDomain: first(p.domain, p.website, company.domain, company.website),
      duns: first(p.duns, p.dunsNumber, company.duns, company.dunsNumber),
      pitchbookId: first(p.pitchbookId, p.pitchBookId, company.pitchbookId),
      salesforceId: first(p.salesforceId, provider === 'salesforce' ? first(p.Id, p.id) : null),
      campaign: first(p.campaign, p.campaignName, p.utm_campaign),
      leadStatus: first(p.status, p.Status, p.leadStatus),
      leadScore: first(p.score, p.leadScore, p.rating),
      businessNeed: first(p.businessNeed, p.useCase, p.intent, p.description),
      urgency: first(p.urgency, p.timeline),
      decisionRole: first(p.decisionRole, p.title, contact.title),
      rawProviderData: p,
    },
  };
}

function safeOutboundUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:') return null;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.use(requireIntegrationKey);

// Provider-neutral inbound API. Provider adapters map common CRM/data-vendor
// field names into the same canonical /api/leads contract used by BestyStaff.
router.post('/ingest/:provider', async (req, res) => {
  try {
    const provider = String(req.params.provider || '').toLowerCase();
    if (!PROVIDERS.has(provider)) return res.status(400).json({ error: 'unsupported provider' });
    const lead = normalize(provider, req.body);
    if (!lead.email) return res.status(400).json({ error: 'provider payload must include an email' });
    const base = `${req.protocol}://${req.get('host')}`;
    const response = await fetch(`${base}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-saltbasin-integration-key': process.env.LEAD_INTEGRATION_API_KEY,
      },
      body: JSON.stringify(lead),
    });
    const result = await response.json().catch(() => ({}));
    res.status(response.status).json({ ...result, provider, normalized: lead.answers });
  } catch (e) {
    console.error('[lead-integrations] ingest failed:', e.message);
    res.status(500).json({ error: 'lead ingestion failed' });
  }
});

// Canonical outbound representation for external pull-based integrations.
router.get('/leads/:publicId', async (req, res) => {
  try {
    const lead = await db.prepare(`
      SELECT id, public_id, source, email, phone, name, message, answers, created_at, updated_at
      FROM leads WHERE public_id = $1 AND merged_into_id IS NULL
    `).get(req.params.publicId);
    if (!lead) return res.status(404).json({ error: 'lead not found' });
    const activity = await db.prepare(`
      SELECT source, cta_location, message, created_at
      FROM lead_activity WHERE lead_id = $1 ORDER BY created_at ASC
    `).all(lead.id);
    let answers = {};
    try { answers = lead.answers ? JSON.parse(lead.answers) : {}; } catch { answers = {}; }
    res.json({
      id: lead.public_id,
      source: lead.source,
      contact: { name: lead.name, email: lead.email, phone: lead.phone },
      context: answers,
      transcript: lead.message,
      activity: activity.map((a) => ({ source: a.source, location: a.cta_location, message: a.message, at: Number(a.created_at) })),
      createdAt: Number(lead.created_at),
      updatedAt: Number(lead.updated_at),
    });
  } catch (e) {
    console.error('[lead-integrations] export failed:', e.message);
    res.status(500).json({ error: 'lead export failed' });
  }
});

// Push a canonical lead to a configured provider webhook. URLs live in the
// private published config; bearer tokens stay in environment variables.
router.post('/sync/:provider/:publicId', async (req, res) => {
  try {
    const provider = String(req.params.provider || '').toLowerCase();
    if (!PROVIDERS.has(provider)) return res.status(400).json({ error: 'unsupported provider' });
    const config = (await getJSON('config_state', 'published')) || {};
    const providerConfig = config.bestystaff?.integrations?.providers?.[provider] || {};
    if (!providerConfig.enabled) return res.status(409).json({ error: `${provider} outbound sync is disabled` });
    const outboundUrl = safeOutboundUrl(providerConfig.outboundUrl);
    if (!outboundUrl) return res.status(409).json({ error: `no valid HTTPS outbound URL configured for ${provider}` });
    const lead = await db.prepare(`SELECT public_id, source, email, phone, name, message, answers, updated_at FROM leads WHERE public_id = $1 AND merged_into_id IS NULL`).get(req.params.publicId);
    if (!lead) return res.status(404).json({ error: 'lead not found' });
    const token = process.env[`${provider.toUpperCase()}_LEAD_WEBHOOK_TOKEN`];
    const response = await fetch(outboundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        id: lead.public_id,
        source: lead.source,
        contact: { name: lead.name, email: lead.email, phone: lead.phone },
        context: lead.answers ? JSON.parse(lead.answers) : {},
        transcript: lead.message,
        updatedAt: Number(lead.updated_at),
      }),
    });
    const body = await response.text();
    res.status(response.ok ? 200 : 502).json({ ok: response.ok, provider, status: response.status, response: body.slice(0, 2000) });
  } catch (e) {
    console.error('[lead-integrations] sync failed:', e.message);
    res.status(500).json({ error: 'lead sync failed' });
  }
});

export default router;
