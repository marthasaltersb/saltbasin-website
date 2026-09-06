// Variant Creation Studio API (salt-basin-world-variants Phase 8 slice, 2026-09-06).
// Admin-scoped (requireAdmin) — this is the "development Variant Creation Studio" §X/§XI describe
// for Betsy's own use, not a member-facing tool. It never writes to the frozen source-of-truth
// registries (worldVariantRegistry.js / worldVariantComponentProfiles.js) — it only proposes and
// validates a GenerativeSeedSpec for the client to preview; committing a spec into a real variant
// profile stays a reviewed code change a human makes.
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { interpretVariantPrompt } from '../lib/worldVariantSeedAgent.js';
import { validateGenerativeSeedSpec, DEFAULT_GENERATIVE_SEED_SPEC, describeGenerativeSeedSpec } from '../../src/config/visual/worldVariantGenerativeSeed.js';

const router = Router();

// POST /api/admin/world-variant-studio/generate  { prompt, hints? }
router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { prompt, hints } = req.body || {};
    const { seedSpec, rationale, suggestedWorldFamily } = await interpretVariantPrompt(req.user.id, prompt, hints || {});
    res.json({ seedSpec, rationale, suggestedWorldFamily, description: describeGenerativeSeedSpec(seedSpec) });
  } catch (e) {
    res.status(e.status || 400).json({ error: e.message });
  }
});

// POST /api/admin/world-variant-studio/validate  { seedSpec }
// Lets the client re-validate a hand-tuned spec (after the user drags a slider) without
// re-invoking the model — pure, deterministic, no Anthropic call.
router.post('/validate', requireAdmin, async (req, res) => {
  const { seedSpec } = req.body || {};
  const errors = validateGenerativeSeedSpec(seedSpec);
  if (errors.length) return res.status(400).json({ errors });
  res.json({ ok: true, description: describeGenerativeSeedSpec(seedSpec) });
});

router.get('/default-spec', requireAdmin, async (_req, res) => {
  res.json({ seedSpec: DEFAULT_GENERATIVE_SEED_SPEC, description: describeGenerativeSeedSpec(DEFAULT_GENERATIVE_SEED_SPEC) });
});

export default router;
