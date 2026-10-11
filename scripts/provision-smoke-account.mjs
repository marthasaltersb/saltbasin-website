#!/usr/bin/env node
// Creates or readies the ONE fictional production smoke test account through the platform's own admin API
// (feature production-smoke-regression, owner decision 2026-10-10). Run by the "Provision smoke test account"
// workflow (workflow_dispatch). It never touches the production database, never prints a credential and
// reads every credential from the environment only (GitHub Actions secrets):
//
//   SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD   an administrator, used for this one call and then signed out
//   SMOKE_MEMBER_PASSWORD                      the password the test account is given (and later signs in with)
//   SMOKE_BASE_URL                             optional, default https://saltbasin.net
//
// Steps: sign in as the administrator -> GET /api/production-smoke/account -> POST the same path with the member
// password (idempotent: creates the account, or readies it: clears a forced password change, records current
// platform and Career Portfolio terms, restores the starter profile) -> verify ready -> sign out.
// Exit codes: 0 ready; 1 the platform refused or the account is not ready; 2 a secret is missing or the sign-in
// failed. Every failure prints what happened and what to do, in plain words.
const BASE = String(process.env.SMOKE_BASE_URL || 'https://saltbasin.net').replace(/\/$/, '');
const { SMOKE_ADMIN_EMAIL: ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD: ADMIN_PASSWORD, SMOKE_MEMBER_PASSWORD: MEMBER_PASSWORD } = process.env;

const fail = (code, msg) => { console.error(`FAILED: ${msg}`); process.exit(code); };

const missing = [['SMOKE_ADMIN_EMAIL', ADMIN_EMAIL], ['SMOKE_ADMIN_PASSWORD', ADMIN_PASSWORD], ['SMOKE_MEMBER_PASSWORD', MEMBER_PASSWORD]].filter(([, v]) => !v).map(([n]) => n);
if (missing.length) fail(2, `These repository Actions secrets are not set: ${missing.join(', ')}. Add them under Settings, Secrets and variables, Actions, then run this workflow again.`);

async function call(method, path, body, cookie) {
  let r;
  try {
    r = await fetch(`${BASE}${path}`, { method, redirect: 'manual', signal: AbortSignal.timeout(90_000), headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `sb_admin=${cookie}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch (e) { fail(2, `${BASE} could not be reached (${e.message}). Check the site is up and try again.`); }
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, json, text, setCookie: r.headers.get('set-cookie') || '' };
}

const login = await call('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
if (login.status === 202 && login.json?.challengeRequired) fail(2, 'The administrator account asks for an authenticator code, which this workflow cannot enter. Use an administrator without two-step sign-in for SMOKE_ADMIN_EMAIL, or create the test account by hand in World Shell > Journeys > Production smoke.');
if (login.status === 429) fail(2, 'The site is rate-limiting sign-ins from this address (HTTP 429, 10 attempts per 15 minutes). Wait 15 minutes and run this workflow again.');
if (login.status !== 200 || login.json?.user?.role !== 'admin') fail(2, `The administrator sign-in was refused (HTTP ${login.status}${login.json?.error ? `, ${login.json.error}` : ''}) or that account is not an administrator. Check SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD.`);
const cookie = /(?:^|[,\s])sb_admin=([^;]+)/.exec(login.setCookie)?.[1];
if (!cookie) fail(2, 'The sign-in answered 200 but set no session cookie.');

class Stop extends Error { constructor(code, msg) { super(msg); this.stopCode = code; } }
const stop = (code, msg) => { throw new Stop(code, msg); };
let exitCode = 0;
try {
  const before = await call('GET', '/api/production-smoke/account', null, cookie);
  if (before.status === 404) stop(1, 'This site does not have the production smoke account route yet (HTTP 404). Deploy the release that contains it, then run this workflow again.');
  if (before.status !== 200) stop(1, `Reading the test account status failed (HTTP ${before.status}${before.json?.error ? `, ${before.json.error}` : ''}).`);
  console.log(`Before: exists=${before.json.exists} ready=${before.json.ready}${before.json.problems?.length ? ` problems=${JSON.stringify(before.json.problems)}` : ''}`);

  const done = await call('POST', '/api/production-smoke/account', { password: MEMBER_PASSWORD }, cookie);
  if (done.status !== 200) {
    const d = Array.isArray(done.json?.details) && done.json.details.length ? ` ${done.json.details.join(' ')}` : '';
    stop(1, `The platform refused to ready the test account (HTTP ${done.status}, ${done.json?.code || 'error'}): ${done.json?.error || done.text.slice(0, 200)}${d}`);
  }
  const s = done.json;
  console.log(`After: created=${s.created} exists=${s.exists} ready=${s.ready} role=${s.role} platformTerms=${s.platformTermsCurrent} careerTerms=${s.careerTermsCurrent} mustChangePassword=${s.mustChangePassword} emailExcluded=${s.emailExcluded}`);
  if (!s.ready || !s.emailExcluded) { console.error(`FAILED: the test account is not ready: ${(s.problems || []).join(' ') || 'email is not excluded'}`); exitCode = 1; }
  else console.log(`OK: ${s.account.email} is ready. Run "Production smoke and regression" to use it.`);
} catch (e) {
  if (e.stopCode == null) throw e;
  console.error(`FAILED: ${e.message}`);
  exitCode = e.stopCode;
} finally {
  const out = await call('POST', '/api/auth/logout', {}, cookie);
  if (out.status !== 200) console.warn(`Warning: administrator sign-out answered HTTP ${out.status}; that session expires on its own.`);
}
process.exit(exitCode);
