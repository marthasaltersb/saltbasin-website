// Outbound email abstraction.
//
// If RESEND_API_KEY is set in env, sends real email via Resend.
// If not, logs to stdout — local dev works without an account.
//
// Every dispatch also writes a row to lead_emails so the email log is
// visible in the lead view AND admin lead detail. The "from" address is
// configurable via the Salt Basin config (defaults to env var, then to a
// reasonable hardcoded default).

import { db } from '../db.js';

const RESEND_API = 'https://api.resend.com/emails';

function isResendConfigured() {
  return !!process.env.RESEND_API_KEY;
}

async function configuredFrom() {
  // 1. Published Salt Basin config (admin-editable)
  try {
    const row = await db.prepare(`SELECT data FROM config_state WHERE id = $1`).get('published');
    const cfg = row ? JSON.parse(row.data) : null;
    if (cfg?.email?.fromName && cfg?.email?.fromAddress) {
      return `${cfg.email.fromName} <${cfg.email.fromAddress}>`;
    }
    if (cfg?.email?.fromAddress) return cfg.email.fromAddress;
  } catch {
    /* ignore */
  }
  // 2. Env var
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  // 3. Reasonable default
  return 'Salt Basin Net Works <noreply@saltbasin.net>';
}

async function logToDb({ leadId, to, from, subject, html, text, provider, status, providerId, error }) {
  if (!leadId) return;
  try {
    await db
      .prepare(
        `INSERT INTO lead_emails (lead_id, to_email, from_email, subject, body_text, body_html, provider, status, provider_id, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
      )
      .run(leadId, to, from, subject, text || null, html || null, provider, status, providerId || null, error || null);
  } catch (e) {
    console.error('[email] failed to write lead_emails row:', e.message);
  }
}

// Public: lets the admin "Test email" button verify Resend is wired without
// touching real lead records.
export async function dispatchRaw({ to, subject, html, text }) {
  return dispatch({ to, subject, html, text });
}

async function dispatch({ leadId, to, subject, html, text }) {
  const fromAddr = await configuredFrom();

  if (!isResendConfigured()) {
    console.log('───────────────────────────────────────────────');
    console.log('[email · DEV STUB · RESEND_API_KEY not set]');
    console.log(`  to:       ${to}`);
    console.log(`  from:     ${fromAddr}`);
    console.log(`  subject:  ${subject}`);
    console.log('  ── text ──');
    console.log((text || '').split('\n').map((l) => '  ' + l).join('\n'));
    console.log('───────────────────────────────────────────────');
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'console', status: 'stubbed' });
    return { ok: true, stub: true, from: fromAddr };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddr, to, subject, html, text }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errStr = body?.message || JSON.stringify(body);
      console.error('[email] Resend failed:', res.status, body);
      await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'resend', status: 'failed', error: errStr });
      return { ok: false, error: body };
    }
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'resend', status: 'sent', providerId: body.id });
    return { ok: true, id: body.id, from: fromAddr };
  } catch (e) {
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'resend', status: 'failed', error: e.message });
    return { ok: false, error: e.message };
  }
}

// ── Templates ──

export async function sendLeadConfirmation({ leadId, toEmail, toName, leadUrl, password, source }) {
  const greeting = toName ? `Hi ${toName.split(' ')[0]},` : 'Hi,';
  const fullUrl = `${publicBaseUrl()}${leadUrl}`;
  const text = `${greeting}

I received your submission via ${friendlySource(source)} on Salt Basin Net Works. Here is your private lead record:

  ${fullUrl}
  password: ${password}

Bookmark the URL and save the password somewhere safe — you can return any time to add more context or update what you have shared with me.

Real talk on data security: I am still hardening this platform's security. Treat anything you share here like a LinkedIn DM until I have certified more. Full notice: ${publicBaseUrl()}/data-notice

— Betsy
Salt Basin Net Works
`;
  const html = `
    <p>${greeting}</p>
    <p>I received your submission via <strong>${friendlySource(source)}</strong> on Salt Basin Net Works. Here is your private lead record:</p>
    <p style="background:#1B2A3B;color:#F5F0E8;padding:1rem 1.25rem;border-left:3px solid #C4843A;border-radius:2px;font-family:monospace;font-size:0.9rem;">
      <a href="${fullUrl}" style="color:#C4843A;text-decoration:underline;">${fullUrl}</a><br/>
      password: <strong>${password}</strong>
    </p>
    <p>Bookmark the URL and save the password somewhere safe — you can return any time to add more context or update what you have shared with me.</p>
    <hr style="border:none;border-top:0.5px solid #D4B896;margin:1.5rem 0;"/>
    <p style="font-size:0.85rem;color:#4A6670;">
      <strong>Real talk on data security:</strong> I am still hardening this platform's security. Treat anything you share here like a LinkedIn DM until I have certified more.
      <br/><a href="${publicBaseUrl()}/data-notice" style="color:#C4843A;">Full notice →</a>
    </p>
    <p>— Betsy<br/><em>Salt Basin Net Works</em></p>
  `;
  return dispatch({
    leadId,
    to: toEmail,
    subject: `Your Salt Basin lead record · #${publicIdFromUrl(leadUrl)}`,
    html, text,
  });
}

// ── Template: Notify Betsy when a new lead lands ──
export async function sendNewLeadAlert({ leadId, source, leadEmail, leadName, leadPhone, leadMessage, leadUrl, isExisting, ctaLocation }) {
  // Pull config to determine whether to send + where.
  let cfg = {};
  try {
    const row = await db.prepare(`SELECT data FROM config_state WHERE id = $1`).get('published');
    cfg = row ? JSON.parse(row.data) : {};
  } catch { /* ignore */ }

  const enabled = cfg?.email?.notifyOnNewLead !== false;  // default: enabled
  if (!enabled) return { ok: true, skipped: 'disabled' };

  const recipient = cfg?.email?.notifyTo || process.env.ADMIN_EMAIL;
  if (!recipient) return { ok: false, error: 'no notification recipient configured' };

  const verb = isExisting ? 'New activity on existing lead' : 'New lead submitted';
  const subjLine = `[Salt Basin] ${verb} via ${friendlySource(source)} — ${leadEmail}`;
  const fullUrl = `${publicBaseUrl()}${leadUrl}`;

  const lines = [
    verb + ':',
    '',
    `  Email:    ${leadEmail}`,
    leadName  ? `  Name:     ${leadName}` : null,
    leadPhone ? `  Phone:    ${leadPhone}` : null,
    `  Source:   ${friendlySource(source)}${ctaLocation ? ' (' + ctaLocation + ')' : ''}`,
    leadMessage ? '' : null,
    leadMessage ? `  Message:  ${leadMessage}` : null,
    '',
    `  Lead URL: ${fullUrl}`,
    '',
    '— Salt Basin lead notifier',
  ].filter((l) => l !== null);

  const text = lines.join('\n');
  const html = `
    <p><strong>${verb}</strong></p>
    <table style="border-collapse:collapse;font-size:0.9rem;">
      <tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Email:</td><td><a href="mailto:${leadEmail}" style="color:#C4843A;">${leadEmail}</a></td></tr>
      ${leadName  ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Name:</td><td>${leadName}</td></tr>` : ''}
      ${leadPhone ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Phone:</td><td>${leadPhone}</td></tr>` : ''}
      <tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Source:</td><td>${friendlySource(source)}${ctaLocation ? ` <span style="color:#8B9BAE;">(${ctaLocation})</span>` : ''}</td></tr>
      ${leadMessage ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6670;vertical-align:top;">Message:</td><td style="white-space:pre-wrap;">${leadMessage}</td></tr>` : ''}
    </table>
    <p style="margin-top:1rem;">
      <a href="${fullUrl}" style="display:inline-block;padding:0.5rem 1.1rem;background:#C4843A;color:#FBF6F0;text-decoration:none;border-radius:2px;font-size:0.85rem;">View lead →</a>
    </p>
    <p style="font-size:0.75rem;color:#8B9BAE;margin-top:1.25rem;">— Salt Basin lead notifier</p>
  `;
  return dispatch({ leadId, to: recipient, subject: subjLine, html, text });
}

function publicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || 'https://saltbasin.net';
}
function publicIdFromUrl(leadUrl) {
  const m = leadUrl.match(/\/lead\/([A-Z0-9]+)/);
  return m ? m[1] : '';
}
function friendlySource(s) {
  const map = {
    joinNetwork: 'Join the Network',
    forCompanies: 'For Companies',
    assessments: 'Assessments notification',
    contact: 'Contact form',
    references: 'References request',
  };
  return map[s] || s;
}
