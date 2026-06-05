import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin, isLandingUnlocked } from '../auth.js';
import { dispatchRaw } from '../lib/email.js';

const router = Router();

function publicConfig(config) {
  if (!config) return null;
  return {
    site: config.site,
    social: config.social,
    bestystaff: config.bestystaff
      ? {
          enabled: config.bestystaff.enabled,
          greeting: config.bestystaff.greeting,
        }
      : null,
  };
}

router.get('/public', async (req, res) => {
  if (!(await isLandingUnlocked(req))) {
    return res.status(403).json({ error: 'landing gate locked' });
  }
  const config = (await getJSON('config_state', 'published')) || {};
  res.json(publicConfig(config));
});

router.get('/draft', requireAdmin, async (req, res) => {
  const config = (await getJSON('config_state', 'draft')) || {};
  res.json(config);
});

router.put('/draft', requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'expected config object' });
  }
  await setJSON('config_state', 'draft', incoming);
  res.json({ ok: true, updatedAt: Date.now() });
});

// Admin diagnostic: send a test email to a specified address. If
// RESEND_API_KEY isn't set, returns the stub log so admin can see what would
// have been sent.
router.post('/test-email', requireAdmin, async (req, res) => {
  const { to, subject, body } = req.body || {};
  if (!to || !to.includes('@')) return res.status(400).json({ error: 'to address required' });
  const result = await dispatchRaw({
    to,
    subject: subject || 'Salt Basin · Test email',
    text: body || 'This is a test email from your Salt Basin admin. If you received this, Resend (or the console stub) is wired correctly.',
    html: `<p>${body || 'This is a test email from your Salt Basin admin. If you received this, Resend (or the console stub) is wired correctly.'}</p><p style="font-size:0.75rem;color:#8B9BAE;">— Salt Basin email diagnostic</p>`,
  });
  res.json({
    ...result,
    resendConfigured: !!process.env.RESEND_API_KEY,
  });
});

export default router;
