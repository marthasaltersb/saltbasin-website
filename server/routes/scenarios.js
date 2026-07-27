import { Router } from 'express';
import { requireUser } from '../auth.js';
import { ScenarioRegistry } from '../../src/scenarios/scenarioRegistry.js';

const router = Router();
const registry = ScenarioRegistry.fromFile();

router.use(requireUser);

router.get('/summary', (_req, res) => {
  res.json({ scenarioCount: registry.scenarios.length, uniqueSignatures: registry.bySignature.size });
});

router.get('/:scenarioId', (req, res) => {
  const scenario = registry.get(req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: 'scenario not found' });
  res.json({ scenario });
});

router.post('/resolve/atoms', (req, res) => {
  const atoms = req.body?.atoms;
  if (!Array.isArray(atoms) || atoms.length === 0) return res.status(400).json({ error: 'atoms must be a non-empty array' });
  try {
    const limit = Math.min(Math.max(Number(req.body?.limit) || 5, 1), 25);
    res.json(registry.resolveFromAtoms(atoms, { limit }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:scenarioId/dependencies', (req, res) => {
  const scenario = registry.get(req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: 'scenario not found' });
  res.json({
    scenarioId: scenario.scenarioId,
    sourceEvent: scenario.sourceEvent,
    controls: scenario.expectations.reconciliationControls,
    metrics: scenario.expectations.metricDependencies,
    propagationTargets: scenario.expectations.propagationTargets,
  });
});

export default router;
