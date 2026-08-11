// Lead-to-Revenue Diagnostic API (2026-08-09, Definition Studio Phase 2).
// Admin-scoped (requireAdmin) for now, same reasoning as
// commercialOpportunities.js: Betsy's team runs these engagements for
// purchasing clients today — there's no self-service client portal for this
// yet. Extending to org-scoped client self-service is a later phase, not a
// rewrite (the underlying l2r_diagnostic rod already carries org_id).
import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { createDiagnostic, listDiagnostics, getDiagnostic, recordObservation, recordFinding, getLandscape } from '../lib/l2rDiagnosticEngagement.js';
import { listDomains, listCapabilitiesForDomain, getScenarioGates } from '../lib/l2rDiagnosticRegistry.js';

const router = Router();

router.get('/domains', requireAdmin, async (req, res) => {
  res.json({ domains: listDomains() });
});

router.get('/domains/:domainKey/capabilities', requireAdmin, async (req, res) => {
  try {
    const capabilities = await listCapabilitiesForDomain(req.params.domainKey);
    res.json({ capabilities });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/scenarios/:scenarioKey', requireAdmin, async (req, res) => {
  try {
    const result = await getScenarioGates(req.params.scenarioKey);
    if (!result) return res.status(404).json({ error: 'Scenario not found' });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const diagnostics = await listDiagnostics();
    res.json({ diagnostics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { companyName, arr, industry, segment, activeContracts, transactionValue, notes } = req.body || {};
    const diagnostic = await createDiagnostic({ companyName, arr, industry, segment, activeContracts, transactionValue, notes });
    res.status(201).json(diagnostic);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const diagnostic = await getDiagnostic(Number(req.params.id));
    if (!diagnostic) return res.status(404).json({ error: 'Diagnostic not found' });
    res.json(diagnostic);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/landscape', requireAdmin, async (req, res) => {
  try {
    const landscape = await getLandscape(Number(req.params.id));
    res.json(landscape);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/observations', requireAdmin, async (req, res) => {
  try {
    const rodId = Number(req.params.id);
    const { domainKey, capabilityMoleculeKey, linkedScenarioKey, linkedStageKey, title, description, submitterRole, submitterName, sourceType, riskLevel, hasControls, controlDescription, frequency, owner, quantifiedImpact } = req.body || {};
    const result = await recordObservation(rodId, { domainKey, capabilityMoleculeKey, linkedScenarioKey, linkedStageKey, title, description, submitterRole, submitterName, sourceType, riskLevel, hasControls, controlDescription, frequency, owner, quantifiedImpact });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/findings', requireAdmin, async (req, res) => {
  try {
    const rodId = Number(req.params.id);
    const { domainKey, capabilityMoleculeKey, linkedScenarioKey, findingType, title, description, recommendation, estimatedAnnualRecovery, priority, summary } = req.body || {};
    const result = await recordFinding(rodId, { domainKey, capabilityMoleculeKey, linkedScenarioKey, findingType, title, description, recommendation, estimatedAnnualRecovery, priority, summary });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
