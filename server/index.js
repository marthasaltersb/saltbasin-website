import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ensureSeeded } from './data/seed.js';
import { createSeoMiddleware } from './lib/seoMiddleware.js';
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
import memberAgentRouter from './routes/memberAgent.js';
import eventsRouter from './routes/events.js';
import oauthRouter from './routes/oauth.js';
import profilesRouter from './routes/profiles.js';
import uploadsRouter, { uploadsDir } from './routes/uploads.js';
import fieldAuditRouter from './routes/fieldAudit.js';
import analyticsRouter from './routes/analytics.js';
import nrmRouter from './routes/nrm.js';
import herqRouter from './routes/herq.js';
import servicesRouter from './routes/services.js';
import finbridgecoRouter from './routes/finbridgeco.js';
import globalStandardsRouter from './routes/globalStandards.js';
import governanceRouter from './routes/governance.js';
import resumeAccessRouter from './routes/resumeAccess.js';
import outputTemplatesRouter from './routes/outputTemplates.js';
import careerMasterRouter from './routes/careerMaster.js';
import careerPlacementAgentsRouter from './routes/careerPlacementAgents.js';
import portfolioRequestsRouter from './routes/portfolioRequests.js';
import bestyStaffRouter from './routes/bestyStaff.js';
import lineageRouter from './routes/lineage.js';
import methodologyStatsRouter from './routes/methodologyStats.js';
import leadIntegrationsRouter from './routes/leadIntegrations.js';
import journeyRodsRouter from './routes/journeyRods.js';
import eidosRouter from './routes/eidos.js';
import commerceRouter, { stripeWebhookHandler } from './routes/commerce.js';
import feedbackRouter from './routes/feedback.js';
import orgPortalRouter from './routes/orgPortal.js';
import dataSourcesRouter from './routes/dataSources.js';
import metricIntelligenceRouter from './routes/metricIntelligence.js';
import memberFinancialRouter from './routes/memberFinancial.js';
import presenceRouter from './routes/presence.js';
import memberEntitlementsRouter from './routes/memberEntitlements.js';
import resumeOutputsRouter from './routes/resumeOutputs.js';
import scenariosRouter from './routes/scenarios.js';
import configEnvelopesRouter from './routes/configEnvelopes.js';
import lonetreeMvpRouter from './routes/lonetreeMvp.js';
import proposalExperienceRouter from './routes/proposalExperience.js';

// Safety net: an unhandled promise rejection in any async route handler
// (e.g. a bad column reference in a PATCH) is fatal by default in Node —
// it crashes the whole process, taking every in-flight request down with
// it, even though Express normally isolates one route's error from the
// rest. This turned an unrelated Postgres error into a full-site outage
// (see CHANGELOG v0.18.3). Logging instead of crashing is a mitigation,
// not a fix — routes should still catch their own DB errors — but it
// stops this whole class of bug from taking production down.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

await ensureSeeded();

const app = express();

// Behind Render / Netlify / any reverse proxy. Required so secure cookies and
// req.ip work correctly.
if (isProd) app.set('trust proxy', 1);

// Stripe webhook signature verification needs the raw, unparsed request
// body. Registered as a complete route (not just body-parsing middleware)
// before the global express.json() parser below — once this handler sends
// a response, Express never falls through to json() for the same request,
// so the raw stream is never read twice. See server/routes/commerce.js.
app.post('/api/commerce/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

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
    // In prod: deny all cross-origin requests if FRONTEND_ORIGIN is unset rather
    // than falling through to the allow-all wildcard (which would permit any
    // origin to send credentialed requests).
    origin: allowedOrigins.length ? allowedOrigins : (isProd ? false : true),
    credentials: true,
  })
);

app.use('/api/auth', authRouter);
app.use('/api/site', siteRouter);
app.use('/api/config', configRouter);
app.use('/api/config-envelopes', configEnvelopesRouter);
app.use('/api/lonetree-mvp', lonetreeMvpRouter);
app.use('/api/proposal-experience', proposalExperienceRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/lead-integrations', leadIntegrationsRouter);
app.use('/api/journey-rods', journeyRodsRouter);
app.use('/api/eidos', eidosRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/members', membersRouter);
app.use('/api/member-site', memberSiteRouter);
app.use('/api/member-config', memberConfigRouter);
app.use('/api/org-portal', orgPortalRouter);
app.use('/api/data-sources', dataSourcesRouter);
app.use('/api/backlog', backlogRouter);
app.use('/api/methodology-stats', methodologyStatsRouter);
app.use('/api/qa', qaRouter);
app.use('/api/jira', jiraRouter);
app.use('/api/member-templates', memberTemplatesRouter);
// BestyStaff intake agent is PUBLIC (anonymous teaser visitors) — must mount
// before /api/agent, whose router is admin-gated at the top.
app.use('/api/agent/bestystaff', bestyStaffRouter);
app.use('/api/agent', agentRouter);
app.use('/api/members/me/agent', memberAgentRouter);
app.use('/api/events', eventsRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/field-audit', fieldAuditRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/nrm', nrmRouter);
app.use('/api/herq', herqRouter);
app.use('/api/services', servicesRouter);
app.use('/api/finbridgeco', finbridgecoRouter);
app.use('/api/standards', globalStandardsRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/resume', resumeAccessRouter);
app.use('/api/output-templates', outputTemplatesRouter);
app.use('/api/career', careerMasterRouter);
app.use('/api/career-agents', careerPlacementAgentsRouter);
app.use('/api/portfolio-requests', portfolioRequestsRouter);
app.use('/api/lineage', lineageRouter);
app.use('/api/commerce', commerceRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/metric-intelligence', metricIntelligenceRouter);
app.use('/api/member-financial', memberFinancialRouter);
app.use('/api/member-entitlements', memberEntitlementsRouter);
app.use('/api/resume-outputs', resumeOutputsRouter);
app.use('/api/scenarios', scenariosRouter);

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
// /api/agent/bestystaff is live — mounted above, before the admin-gated
// /api/agent router (former Phase 5 stub).

// Serve the built React app in production. Single-origin = no CORS surprises.
if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    // Must run before express.static: rewrites the HTML response's <head>
    // with per-page SEO tags for real routes, and falls through (next()) for
    // static assets and anything it can't resolve.
    app.use(createSeoMiddleware(distDir));
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
app.listen(port, async () => {
  console.log(`[server] Salt Basin ${isProd ? '(prod)' : '(dev)'} listening on port ${port}`);

  // One-shot baseline snapshot on first deploy after the build_progress_snapshots
  // table is introduced. captureBaselineIfEmpty is auth-agnostic (no HTTP cycle,
  // direct DB INSERT) so we don't have to wire a self-cookie. Subsequent days are
  // covered by the lazy capture in /api/backlog/summary. Errors are non-fatal.
  setTimeout(async () => {
    try {
      const { captureBaselineIfEmpty } = await import('./lib/snapshot.js');
      const result = await captureBaselineIfEmpty();
      if (result?.captured) {
        console.log(`[server] baseline snapshot captured (id ${result.id})`);
      }
    } catch (e) {
      console.warn('[server] baseline snapshot skipped:', e.message);
    }
  }, 3000);

  // Daily digest email — fires once per day at 07:00 local server time.
  // Uses a setInterval aligned to the next 07:00 crossing.
  scheduleDailyDigest();
});

function scheduleDailyDigest() {
  const adminEmail = process.env.ADMIN_EMAIL || 'marthasalter@gmail.com';
  async function runDigest() {
    try {
      const { sendDailyDigest } = await import('./lib/email.js');
      const { db } = await import('./db.js');
      await sendDailyDigest({ db, adminEmail });
      console.log('[server] daily digest sent');
    } catch (e) {
      console.warn('[server] daily digest failed:', e.message);
    }
  }
  // Calculate ms until next 07:00
  const now = new Date();
  const next7 = new Date(now);
  next7.setHours(7, 0, 0, 0);
  if (next7 <= now) next7.setDate(next7.getDate() + 1);
  const msUntil = next7 - now;
  setTimeout(() => {
    runDigest();
    setInterval(runDigest, 24 * 60 * 60 * 1000);
  }, msUntil);
  console.log(`[server] daily digest scheduled — next run in ${Math.round(msUntil / 3600000)}h`);
}
