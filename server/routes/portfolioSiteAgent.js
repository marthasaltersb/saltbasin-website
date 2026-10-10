// Portfolio-First Site Agent API (2026-10-01) — admin-only. Drives the
// "Portfolio-First Site Agent" tab (src/components/admin/
// PortfolioSiteAgentPanel.jsx): review → foundation → narrative → compose →
// stage. Staging writes ONLY site_state 'draft' (and, if asked, the theme on
// config_state 'draft'); publishing stays on the existing POST /api/site/
// publish button, so nothing reaches the public site without Betsy's click.
import { Router } from 'express';
import { getJSON, setJSON } from '../db.js';
import { requireAdmin } from '../auth.js';
import { captureLineage } from '../lib/lineage.js';
import { loadPublicCareerMaster, resolveOwnerUserId } from './careerMaster.js';
import { defaultPortfolioFirstNarrative, PORTFOLIO_FIRST_NARRATIVE_SOURCE } from '../data/portfolioFirstNarrative.js';
import {
  AGENT_KEY, reviewCurrentSite, summarizeFoundation, verifyProofs,
  composePortfolioFirstSite, defaultEnabledSectionIds, blueprintCatalog,
} from '../lib/websiteIntelligence/portfolioFirstAgent.js';
import { draftPortfolioNarrative } from '../lib/websiteIntelligence/portfolioFirstNarrativeAgent.js';

// The named [data-theme] palettes in src/brand.css (same set ConfigPanel.jsx's
// THEME_OPTIONS offers). Validated here so staging can't write an unknown
// theme into config_state.
const THEME_KEYS = ['strategic', 'glow-light', 'glow-dark', 'momentum-warm', 'lagoon', 'prospect'];

const router = Router();
router.use(requireAdmin);

// The agent's last-staged inputs, so a re-run starts from Betsy's edits
// rather than the defaults. Platform-wide admin config (not a member row).
const AGENT_STATE_ID = 'portfolio_first_site_agent';

async function loadContext(req) {
  // No owner param → the site owner (platform admin), the same Career Master
  // the public homepage blocks read with no memberSlug.
  const ownerUserId = await resolveOwnerUserId(undefined, req);
  const [draft, master, saved] = await Promise.all([
    getJSON('site_state', 'draft'),
    loadPublicCareerMaster(ownerUserId),
    getJSON('config_state', AGENT_STATE_ID),
  ]);
  const foundation = summarizeFoundation(master);
  return { draft: draft || { version: 3, pages: {} }, master, foundation, saved };
}

function readInputs(body, foundation) {
  const narrative = body?.narrative && typeof body.narrative === 'object' ? body.narrative : defaultPortfolioFirstNarrative();
  const enabledSectionIds = Array.isArray(body?.enabledSectionIds) ? body.enabledSectionIds.map(String) : defaultEnabledSectionIds(foundation);
  const navKeepPageKeys = Array.isArray(body?.navKeepPageKeys) ? body.navKeepPageKeys.map(String) : [];
  const theme = typeof body?.theme === 'string' && THEME_KEYS.includes(body.theme) ? body.theme : null;
  return { narrative, enabledSectionIds, navKeepPageKeys, theme };
}

router.get('/state', async (req, res) => {
  try {
    const { draft, master, foundation, saved } = await loadContext(req);
    const narrative = saved?.narrative || defaultPortfolioFirstNarrative();
    const config = await getJSON('config_state', 'draft');
    res.json({
      review: reviewCurrentSite(draft),
      foundation,
      narrative,
      narrativeSource: saved?.narrative ? { label: `Your last staged edit (${new Date(saved.stagedAt).toISOString().slice(0, 10)})` } : PORTFOLIO_FIRST_NARRATIVE_SOURCE,
      proofs: verifyProofs(master, narrative.proofs),
      catalog: blueprintCatalog(foundation),
      enabledSectionIds: saved?.enabledSectionIds || defaultEnabledSectionIds(foundation),
      navKeepPageKeys: saved?.navKeepPageKeys || [],
      currentTheme: config?.theme || 'strategic',
      themes: THEME_KEYS,
      lastStagedAt: saved?.stagedAt || null,
    });
  } catch (e) {
    console.error('[site-agent] state failed:', e.message);
    res.status(500).json({ error: 'Failed to load the site agent state' });
  }
});

router.post('/verify-proofs', async (req, res) => {
  try {
    const { master } = await loadContext(req);
    res.json({ proofs: verifyProofs(master, Array.isArray(req.body?.proofs) ? req.body.proofs : []) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to verify proofs' });
  }
});

router.post('/narrative-draft', async (req, res) => {
  try {
    const { master } = await loadContext(req);
    const result = await draftPortfolioNarrative({
      userId: req.user.id, master, narrative: req.body?.narrative, brief: String(req.body?.brief || ''),
    });
    res.json(result);
  } catch (e) {
    // Allowance/key/data errors are user-actionable messages by design.
    res.status(400).json({ error: e.message });
  }
});

router.post('/preview', async (req, res) => {
  try {
    const { draft, foundation } = await loadContext(req);
    const inputs = readInputs(req.body, foundation);
    const { site, diff } = composePortfolioFirstSite(draft, { ...inputs, foundation });
    res.json({ diff, home: site.pages?.[diff.homeKey] || null, theme: inputs.theme });
  } catch (e) {
    console.error('[site-agent] preview failed:', e.message);
    res.status(500).json({ error: 'Failed to compose the preview' });
  }
});

router.post('/stage', async (req, res) => {
  try {
    const { draft, foundation } = await loadContext(req);
    const inputs = readInputs(req.body, foundation);
    const now = Date.now();
    const { site, diff } = composePortfolioFirstSite(draft, { ...inputs, foundation, now });

    await setJSON('site_state', 'draft', site);
    captureLineage({
      entityType: 'site_state', entityId: 'draft', prevData: draft, nextData: site,
      sourceType: 'agent', sourceRef: AGENT_KEY, authorId: req.user.id, authorEmail: req.user.email || null,
    }).catch(() => {});

    if (inputs.theme) {
      const prevConfig = (await getJSON('config_state', 'draft')) || {};
      if (prevConfig.theme !== inputs.theme) {
        const nextConfig = { ...prevConfig, theme: inputs.theme };
        await setJSON('config_state', 'draft', nextConfig);
        captureLineage({
          entityType: 'config_state', entityId: 'draft', prevData: prevConfig, nextData: nextConfig,
          sourceType: 'agent', sourceRef: AGENT_KEY, authorId: req.user.id, authorEmail: req.user.email || null,
        }).catch(() => {});
      }
    }

    await setJSON('config_state', AGENT_STATE_ID, {
      narrative: inputs.narrative, enabledSectionIds: inputs.enabledSectionIds,
      navKeepPageKeys: inputs.navKeepPageKeys, theme: inputs.theme, stagedAt: now, stagedBy: req.user.id,
    });

    res.json({ ok: true, stagedAt: now, diff });
  } catch (e) {
    console.error('[site-agent] stage failed:', e.message);
    res.status(500).json({ error: 'Failed to stage the draft' });
  }
});

export default router;
