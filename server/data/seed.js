import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, getJSON, setJSON } from '../db.js';
import { defaultSite, defaultConfig } from './defaultSite.js';

export function ensureSeeded() {
  // Seed site state — draft & published start identical so the public site has
  // something to render on first boot.
  if (!getJSON('site_state', 'draft')) {
    setJSON('site_state', 'draft', defaultSite);
  }
  if (!getJSON('site_state', 'published')) {
    setJSON('site_state', 'published', defaultSite);
  }
  if (!getJSON('config_state', 'draft')) {
    setJSON('config_state', 'draft', defaultConfig);
  }
  if (!getJSON('config_state', 'published')) {
    setJSON('config_state', 'published', defaultConfig);
  }

  // Seed admin user from env if no users exist yet.
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@saltbasin.net';
    const password = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMeOnFirstLogin';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(
      email.toLowerCase(),
      hash,
      'admin'
    );
    console.log(`[seed] Created admin user: ${email}`);
    console.log(`[seed] Initial password: ${password} (change it on first login)`);
  }
}

// Allow running directly: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureSeeded();
  console.log('[seed] Done.');
  process.exit(0);
}
