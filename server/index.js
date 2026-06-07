import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ensureSeeded } from './data/seed.js';
import authRouter from './routes/auth.js';
import siteRouter from './routes/site.js';
import configRouter from './routes/config.js';
import leadsRouter from './routes/leads.js';
import membersRouter from './routes/members.js';
import memberSiteRouter from './routes/memberSite.js';
import memberConfigRouter from './routes/memberConfig.js';
import backlogRouter from './routes/backlog.js';
import qaRouter from './routes/qa.js';
import jiraRouter from './routes/jira.js';
import memberTemplatesRouter from './routes/memberTemplates.js';
import agentRouter from './routes/agent.js';
import uploadsRouter, { uploadsDir } from './routes/uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

await ensureSeeded();

const app = express();

// Behind Render / Netlify / any reverse proxy. Required so secure cookies and
// req.ip work correctly.
if (isProd) app.set('trust proxy', 1);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// In dev we run Vite on 5173 separately, so CORS must allow it. In prod the
// frontend is served from the same origin (this same server), so CORS is only
// needed if FRONTEND_ORIGIN is explicitly set to something else.
const allowedOrigins = isProd
  ? (process.env.FRONTEND_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.use('/api/auth', authRouter);
app.use('/api/site', siteRouter);
app.use('/api/config', configRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/members', membersRouter);
app.use('/api/member-site', memberSiteRouter);
app.use('/api/member-config', memberConfigRouter);
app.use('/api/backlog', backlogRouter);
app.use('/api/qa', qaRouter);
app.use('/api/jira', jiraRouter);
app.use('/api/member-templates', memberTemplatesRouter);
app.use('/api/agent', agentRouter);
app.use('/api/uploads', uploadsRouter);

// Uploaded files now live on Supabase Storage at <SUPABASE_URL>/storage/v1/object/public/uploads/<file>.
// The returned URL from POST /api/uploads is already absolute, so the browser
// fetches the file directly from Supabase's CDN — Express never proxies it.

app.get('/api/health', async (req, res) => {
  // Tiny SELECT 1 against Postgres so this endpoint keeps both Render and
  // Supabase active (the keepalive workflow pings here every 13 minutes).
  try {
    const { db } = await import('./db.js');
    await db.prepare('SELECT 1 AS ok').get();
    res.json({ ok: true, ts: Date.now(), db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, ts: Date.now(), db: 'err' });
  }
});

// Stub routes for later phases — keep them returning 501 so the front-end can
// feature-detect without crashing.
app.post('/api/agent/edit', (req, res) =>
  res.status(501).json({ error: 'editor agent not enabled yet (Phase 3)' })
);
app.post('/api/agent/bestystaff', (req, res) =>
  res.status(501).json({ error: 'BestyStaff not enabled yet (Phase 5)' })
);

// Serve the built React app in production. Single-origin = no CORS surprises.
if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { maxAge: '1h' }));
    // SPA fallback: any non-API GET that didn't match a static file returns
    // index.html so React Router can take over.
    app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn('[server] NODE_ENV=production but dist/ is missing — did you run `npm run build`?');
  }
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`[server] Salt Basin ${isProd ? '(prod)' : '(dev)'} listening on port ${port}`);
});
