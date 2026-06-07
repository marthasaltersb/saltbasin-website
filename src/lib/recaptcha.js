// reCAPTCHA v3 client.
//
// Loads the Google reCAPTCHA script lazily on first use, then exposes
// getRecaptchaToken(action) which returns the token to send to the server.
//
// **No-op when VITE_RECAPTCHA_SITE_KEY is unset** — returns null so the server
// no-op path also kicks in. This lets the code ship before the operator
// registers a site at https://www.google.com/recaptcha/admin.

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
let scriptPromise = null;
let warnedOnce = false;

function loadScript() {
  if (scriptPromise) return scriptPromise;
  if (!SITE_KEY) {
    if (!warnedOnce) {
      // eslint-disable-next-line no-console
      console.warn('[recaptcha] VITE_RECAPTCHA_SITE_KEY not set — captcha disabled');
      warnedOnce = true;
    }
    return Promise.resolve();
  }
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(); // SSR safety, though we're SPA-only today
    }
    if (window.grecaptcha) return resolve();
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('reCAPTCHA script failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Get a fresh reCAPTCHA token for a given action.
 * Returns null if reCAPTCHA isn't configured (server-side will accept).
 * Returns null if the script fails to load (silent — don't block form submit).
 *
 * @param {string} action - matches the action expected server-side, e.g.
 *   'login', 'signup', 'lead_capture', 'forgot_password', 'forgot_email',
 *   'convert_to_member'.
 * @returns {Promise<string|null>}
 */
export async function getRecaptchaToken(action) {
  if (!SITE_KEY) return null;
  try {
    await loadScript();
    if (typeof window === 'undefined' || !window.grecaptcha) return null;
    return await new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action })
          .then((token) => resolve(token))
          .catch(() => resolve(null));
      });
    });
  } catch {
    return null;
  }
}
