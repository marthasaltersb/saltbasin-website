// Outbound email abstraction.
//
// Right now the only provider is Resend (https://resend.com). If
// RESEND_API_KEY is set in env, sends real email. If not, logs the rendered
// content to stdout — local dev works without an account, prod still warns
// loudly so we know we're not delivering.
//
// Adding a new email template = a new exported function below that calls
// `dispatch(...)`. Future templates: lead verification code, member welcome,
// admin daily-digest, etc.

const RESEND_API = 'https://api.resend.com/emails';

function isResendConfigured() {
  return !!process.env.RESEND_API_KEY;
}

async function dispatch({ to, subject, html, text, from }) {
  const fromAddr = from || process.env.EMAIL_FROM || 'Salt Basin <noreply@saltbasin.net>';
  if (!isResendConfigured()) {
    // Console fallback. Lets local dev test the full flow without a Resend
    // account, and surfaces clearly in prod logs if we forgot to wire it.
    console.log('───────────────────────────────────────────────');
    console.log('[email · DEV STUB · RESEND_API_KEY not set]');
    console.log(`  to:       ${to}`);
    console.log(`  from:     ${fromAddr}`);
    console.log(`  subject:  ${subject}`);
    console.log('  ── text ──');
    console.log((text || '').split('\n').map((l) => '  ' + l).join('\n'));
    console.log('───────────────────────────────────────────────');
    return { ok: true, stub: true };
  }

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
    console.error('[email] Resend failed:', res.status, body);
    return { ok: false, error: body };
  }
  return { ok: true, id: body.id };
}

// ── Templates ──

export async function sendLeadConfirmation({ toEmail, toName, leadUrl, password, source }) {
  const greeting = toName ? `Hi ${toName.split(' ')[0]},` : 'Hi,';
  const fullUrl = `${publicBaseUrl()}${leadUrl}`;
  const text = `${greeting}

I received your submission via ${friendlySource(source)} on Salt Basin Net Works. Here is your private lead record:

  ${fullUrl}
  password: ${password}

Bookmark the URL and save the password somewhere safe — you can return any time to add more context or update what you have shared with me. The more you tell me up front, the faster I can route.

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
    <p>Bookmark the URL and save the password somewhere safe — you can return any time to add more context or update what you have shared with me. The more you tell me up front, the faster I can route.</p>
    <hr style="border:none;border-top:0.5px solid #D4B896;margin:1.5rem 0;"/>
    <p style="font-size:0.85rem;color:#4A6670;">
      <strong>Real talk on data security:</strong> I am still hardening this platform's security. Treat anything you share here like a LinkedIn DM until I have certified more.
      <br/><a href="${publicBaseUrl()}/data-notice" style="color:#C4843A;">Full notice →</a>
    </p>
    <p>— Betsy<br/><em>Salt Basin Net Works</em></p>
  `;
  return dispatch({ to: toEmail, subject: `Your Salt Basin lead record · #${publicIdFromUrl(leadUrl)}`, html, text });
}

// ── Helpers ──
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
  };
  return map[s] || s;
}
