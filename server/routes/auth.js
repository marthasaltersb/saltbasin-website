import { Router } from 'express';
import {
  login,
  createSession,
  destroySession,
  setAdminCookie,
  clearAdminCookie,
  getUserFromCookie,
  changePassword,
  unlockLanding,
  isLandingUnlocked,
  ADMIN_COOKIE,
  requireAdmin,
} from '../auth.js';
import { getJSON } from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await login(email, password);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const { token } = await createSession(user.id);
  setAdminCookie(res, token);
  res.json({ ok: true, user: { id: user.id, role: user.role, email } });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[ADMIN_COOKIE];
  await destroySession(token);
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  const user = await getUserFromCookie(req);
  res.json({ user });
});

router.post('/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'newPassword must be at least 8 chars' });
  }
  const ok = await changePassword(req.user.id, currentPassword, newPassword);
  if (!ok) return res.status(401).json({ error: 'current password incorrect' });
  res.json({ ok: true });
});

router.get('/landing-gate/status', async (req, res) => {
  const config = (await getJSON('config_state', 'published')) || {};
  res.json({
    enabled: !!config?.prelaunch?.enabled,
    unlocked: await isLandingUnlocked(req),
    headline: config?.prelaunch?.headline || 'Coming Soon',
    subhead: config?.prelaunch?.subhead || '',
  });
});

router.post('/landing-gate/unlock', async (req, res) => {
  const { password } = req.body || {};
  const ok = await unlockLanding(res, password);
  if (!ok) return res.status(401).json({ error: 'invalid password' });
  res.json({ ok: true });
});

export default router;
