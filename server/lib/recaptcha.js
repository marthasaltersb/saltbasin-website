// reCAPTCHA v3 server-side verification.
//
// Frontend calls grecaptcha.execute(SITE_KEY, {action}) to get an opaque token,
// posts it to a backend endpoint, and the endpoint calls verifyRecaptcha() here
// to check it against Google's siteverify API.
//
// **No-op when RECAPTCHA_SECRET_KEY is not set.** This is intentional — it
// lets the code ship and run before the operator has registered a reCAPTCHA
// site (https://www.google.com/recaptcha/admin). A console warning fires on
// the first skipped verification so it's obvious in logs that captcha is off.
//
// Threshold: v3 returns a 0.0-1.0 score (1.0 = very likely human). We require
// >= 0.5 by default. Google's docs suggest this as the default for most sites.
// Tune RECAPTCHA_MIN_SCORE in env if too strict.

const SECRET = process.env.RECAPTCHA_SECRET_KEY;
const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
let warnedOnce = false;

/**
 * @param {string|null|undefined} token - the grecaptcha.execute() result
 * @param {string} expectedAction - the action string used in grecaptcha.execute() — must match
 * @returns {Promise<{ok: boolean, skipped?: boolean, score?: number, error?: string}>}
 */
export async function verifyRecaptcha(token, expectedAction) {
  if (!SECRET) {
    if (!warnedOnce) {
      console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set — captcha verification skipped');
      warnedOnce = true;
    }
    return { ok: true, skipped: true };
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'captcha token missing' };
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    });
    const data = await res.json();
    if (!data.success) {
      return { ok: false, error: 'captcha verification failed' };
    }
    if (typeof data.score === 'number' && data.score < MIN_SCORE) {
      return { ok: false, error: 'captcha score too low', score: data.score };
    }
    if (expectedAction && data.action && data.action !== expectedAction) {
      return { ok: false, error: 'captcha action mismatch' };
    }
    return { ok: true, score: data.score };
  } catch (e) {
    console.error('[recaptcha] verify error:', e.message);
    // Fail closed — if verification can't run, reject. The no-op above
    // already handles the "not configured" case explicitly.
    return { ok: false, error: 'captcha verification error' };
  }
}
