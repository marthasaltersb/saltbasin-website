import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, getJSON, setJSON } from '../db.js';
import { defaultSite, defaultConfig } from './defaultSite.js';

export async function ensureSeeded() {
  // Seed draft + published site state.
  if (!(await getJSON('site_state', 'draft'))) {
    await setJSON('site_state', 'draft', defaultSite);
  }
  if (!(await getJSON('site_state', 'published'))) {
    await setJSON('site_state', 'published', defaultSite);
  }
  if (!(await getJSON('config_state', 'draft'))) {
    await setJSON('config_state', 'draft', defaultConfig);
  }
  if (!(await getJSON('config_state', 'published'))) {
    await setJSON('config_state', 'published', defaultConfig);
  }

  // Seed admin user from env if no users exist yet.
  const userRow = await db.prepare('SELECT COUNT(*) AS n FROM users').get();
  const userCount = Number(userRow?.n ?? 0);
  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@saltbasin.net';
    const password = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMeOnFirstLogin';
    const hash = await bcrypt.hash(password, 10);
    await db
      .prepare('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)')
      .run(email.toLowerCase(), hash, 'admin');
    console.log(`[seed] Created admin user: ${email}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await ensureSeeded();
  console.log('[seed] Done.');
  process.exit(0);
}
