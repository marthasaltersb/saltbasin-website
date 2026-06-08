// Outbound email abstraction.
//
// If BREVO_API_KEY is set in env, sends real email via Brevo's transactional
// API (https://api.brevo.com/v3/smtp/email). If not, logs to stdout — local
// dev works without an account.
//
// We use Brevo (formerly Sendinblue) because Resend requires an MX record on
// a subdomain (e.g. `send.saltbasin.net`), which Wix DNS does not allow.
// Brevo only needs apex SPF + DKIM, both of which Wix supports.
//
// Every dispatch also writes a row to lead_emails so the email log is
// visible in the lead view AND admin lead detail. The "from" address is
// configurable via the Salt Basin config (defaults to env var, then to a
// reasonable hardcoded default).

import { db } from '../db.js';

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

function isBrevoConfigured() {
  return !!process.env.BREVO_API_KEY;
}

// Parse `Name <email@domain>` into Brevo's { name, email } shape. Brevo
// requires the sender object split out; passing a combined string fails
// validation. Accepts a bare email too.
function parseFrom(addr) {
  const m = (addr || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { email: (addr || '').trim() };
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

// Public: lets the admin "Test email" button verify Brevo is wired without
// touching real lead records.
export async function dispatchRaw({ to, subject, html, text }) {
  return dispatch({ to, subject, html, text });
}

async function dispatch({ leadId, to, subject, html, text }) {
  const fromAddr = await configuredFrom();

  if (!isBrevoConfigured()) {
    console.log('───────────────────────────────────────────────');
    console.log('[email · DEV STUB · BREVO_API_KEY not set]');
    console.log(`  to:       ${to}`);
    console.log(`  from:     ${fromAddr}`);
    console.log(`  subject:  ${subject}`);
    console.log('  ── text ──');
    console.log((text || '').split('\n').map((l) => '  ' + l).join('\n'));
    console.log('───────────────────────────────────────────────');
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'console', status: 'stubbed' });
    return { ok: true, stub: true, from: fromAddr };
  }

  const sender = parseFrom(fromAddr);
  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
    textContent: text || undefined,
  };

  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Brevo errors look like: { code: 'invalid_parameter', message: '...' }
      const errStr = body?.message || JSON.stringify(body);
      console.error('[email] Brevo failed:', res.status, body);
      await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'brevo', status: 'failed', error: errStr });
      return { ok: false, error: body };
    }
    // Brevo success: { messageId: '<token@smtp-relay.mailin.fr>' }
    const id = body.messageId || body.messageIds?.[0] || null;
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'brevo', status: 'sent', providerId: id });
    return { ok: true, id, from: fromAddr };
  } catch (e) {
    await logToDb({ leadId, to, from: fromAddr, subject, html, text, provider: 'brevo', status: 'failed', error: e.message });
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

export async function sendVerificationEmail({ toEmail, code }) {
  const text = `Your Salt Basin Net Works email verification code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, ignore this email.\n\n— Salt Basin Net Works`;
  const html = `
    <p>Your Salt Basin Net Works email verification code is:</p>
    <p style="font-size:2rem;font-weight:bold;letter-spacing:0.25em;color:#C4843A;font-family:monospace;">${code}</p>
    <p style="font-size:0.85rem;color:#4A6670;">This code expires in 15 minutes. If you did not request this, ignore this email.</p>
    <p style="font-size:0.75rem;color:#8B9BAE;margin-top:1.25rem;">— Salt Basin Net Works</p>
  `;
  return dispatch({ to: toEmail, subject: 'Salt Basin Net Works — email verification code', html, text });
}

export async function sendContactFormToMember({ toEmail, memberName, fromName, fromEmail, fromPhone, message }) {
  const greeting = memberName ? `Hi ${memberName.split(' ')[0]},` : 'Hi,';
  const text = [
    greeting,
    '',
    'Someone submitted a contact form on your Salt Basin Net Works profile.',
    '',
    `From:    ${fromName || fromEmail}`,
    `Email:   ${fromEmail}`,
    fromPhone ? `Phone:   ${fromPhone}` : null,
    message ? '' : null,
    message ? `Message:\n${message}` : null,
    '',
    '— Salt Basin Net Works',
  ].filter((l) => l !== null).join('\n');
  const html = `
    <p>${greeting}</p>
    <p>Someone submitted a contact form on your Salt Basin Net Works profile:</p>
    <table style="border-collapse:collapse;font-size:0.9rem;">
      <tr><td style="padding:4px 12px 4px 0;color:#4A6670;">From:</td><td>${fromName || fromEmail}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Email:</td><td><a href="mailto:${fromEmail}" style="color:#C4843A;">${fromEmail}</a></td></tr>
      ${fromPhone ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6670;">Phone:</td><td>${fromPhone}</td></tr>` : ''}
      ${message ? `<tr><td style="padding:4px 12px 4px 0;color:#4A6670;vertical-align:top;">Message:</td><td style="white-space:pre-wrap;">${message}</td></tr>` : ''}
    </table>
    <p style="font-size:0.75rem;color:#8B9BAE;margin-top:1.25rem;">— Salt Basin Net Works</p>
  `;
  return dispatch({ to: toEmail, subject: '[Salt Basin] New contact form submission on your profile', html, text });
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
