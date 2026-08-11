import fs from 'node:fs';

const catalogUrl = new URL('../data/genesisCatalog.json', import.meta.url);
export const genesisCatalog = JSON.parse(fs.readFileSync(catalogUrl, 'utf8'));

export const defaultGenesisConfiguration = {
  namespace: 'salt-basin',
  version: 'draft-1',
  status: 'proposed',
  sourceVersions: genesisCatalog.meta.sourceVersions,
  enterpriseAliases: [
    { alias: 'Deal Executed', enterpriseId: 'OBJ0036', localDefinition: 'A commercial agreement whose execution predicates and assent evidence have passed.' },
  ],
  equationBindings: [
    { enterpriseEquationId: 'EQ0001', localName: 'Weighted pipeline value', expression: 'EV = A × P', variables: [
      { variableId: 'VAR0001', localField: 'opportunity.expected_value', unitId: 'UNT0003' },
      { variableId: 'VAR0002', localField: 'opportunity.amount', unitId: 'UNT0003' },
      { variableId: 'VAR0003', localField: 'opportunity.probability', unitId: 'UNT0001' },
    ], missingDataBehavior: 'unknown', reconciliationRequired: true },
  ],
  workflowBindings: [
    { journey: 'Lead-to-Revenue', stateModel: '45_STATE_TRANSITIONS', transitionIds: ['STX0001', 'STX0002', 'STX0003', 'STX0004', 'STX0005', 'STX0006'], activationMode: 'simulation' },
  ],
  policyBindings: [
    { policyVersion: 'ExecutionPolicy-v1', predicateIds: ['PRD0001', 'PRD0002', 'PRD0003', 'PRD0004', 'PRD0005', 'PRD0006', 'PRD0007', 'PRD0008', 'PRD0009', 'PRD0010', 'PRD0011', 'PRD0012'], authority: 'Enterprise policy + delegated human authority' },
  ],
  evidenceRequirements: [
    { predicateId: 'PRD0007', required: ['signed envelope', 'completion certificate', 'signer identity', 'signature timestamp', 'document hash'], blocking: true },
  ],
  renderProfile: { worldVariant: 'crystalline', journeyVisual: 'rod-and-gates', dashboardMode: 'combined', traceCanonicalIds: true },
};

export function findTable(layer, tableName) {
  return genesisCatalog[layer]?.tables?.find((table) => table.name === tableName) || null;
}

export function configurationErrors(value) {
  const errors = [];
  if (!value || typeof value !== 'object') return ['configuration must be an object'];
  if (!value.namespace || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(value.namespace)) errors.push('namespace must be a lowercase slug');
  if (!value.version || typeof value.version !== 'string') errors.push('version is required');
  if (!genesisCatalog.meta.recordLifecycle.includes(value.status)) errors.push('status is not in the governed record lifecycle');
  for (const key of ['enterpriseAliases', 'equationBindings', 'workflowBindings', 'policyBindings', 'evidenceRequirements']) {
    if (!Array.isArray(value[key])) errors.push(`${key} must be an array`);
  }
  return errors;
}
