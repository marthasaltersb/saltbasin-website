// The Lead -> Rod (and Molecule -> Master Data Rod) genesis rule engine.
//
// One generic matcher (`evaluateGenesisRules`) evaluates a rule set that is
// pure data — `{ id, match, plan }` objects, never `if origin === 'internal'`
// scattered through render code. Two entry points share it:
//   - fromLead(leadContext)              — your three concrete lead rules
//   - fromMoleculeProduction(...)        — a gate producing a master-detail
//                                           molecule spawns its own rod
// Both, plus the live "+ New Lead" HUD action, resolve to a RodGenesisPlan
// consumed by the single shared `buildRodFromPlan()` builder below — one
// code path for seeding the world, spawning rods live, and spawning a
// master-data rod from a produced molecule.

function matchesRule(context, match) {
  return Object.entries(match).every(([key, expected]) => {
    const actual = context[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    return actual === expected;
  });
}

export function evaluateGenesisRules(context, ruleSet) {
  const rule = ruleSet.find((candidate) => matchesRule(context, candidate.match));
  if (rule) return { ruleId: rule.id, label: rule.label, ...rule.plan };
  // Soft-guidance fallback: an unrecognized origin never hard-fails, it just
  // becomes an unrouted Member rod an admin can later reclassify.
  return { ruleId: 'unrouted', label: 'Unrouted lead', rootRodType: 'member', bypassesQualification: false, branches: [], unrouted: true };
}

// Seeded rule data. New origin categories are additions to this array —
// evaluateGenesisRules never changes.
export const LEAD_GENESIS_RULES = [
  {
    id: 'internal-sourced-deal',
    label: 'Internal-sourced deal',
    match: { origin: 'internal' },
    plan: {
      rootRodType: 'revenue',
      bypassesQualification: false,
      branches: [
        { rodType: 'customer', via: 'memberOrganizationBranch', originGateId: 'qualification' },
        { rodType: 'member', via: 'memberOrganizationBranch', originGateId: 'qualification' },
      ],
    },
  },
  {
    id: 'external-intake-org-buyer',
    label: 'External intake — work email, org buyer/influencer',
    match: { origin: 'externalIntake', emailKind: 'work', capacity: ['orgBuyer', 'orgInfluencer'] },
    plan: {
      rootRodType: 'member',
      bypassesQualification: true,
      branches: [
        { rodType: 'customer', via: 'memberOrganizationBranch', originGateId: null },
        { rodType: 'revenue', via: 'memberOrganizationBranch', originGateId: null },
      ],
    },
  },
  {
    id: 'external-intake-direct-consumer',
    label: 'External intake — personal email, direct B2C purchase',
    match: { origin: 'externalIntake', emailKind: 'personal', capacity: 'directConsumer' },
    plan: {
      rootRodType: 'member',
      bypassesQualification: true,
      // §25 DTC rule: no separate Customer Rod forms, but the paying Member
      // still holds Customer semantic meaning — convergedRoles is how that
      // role stays queryable (see rodHash.js triangulateEntity) without a
      // duplicate Customer record.
      convergedRoles: ['customer'],
      branches: [
        { rodType: 'revenue', via: null, originGateId: null },
      ],
    },
  },
];

export function fromLead(leadContext) {
  return evaluateGenesisRules(leadContext, LEAD_GENESIS_RULES);
}

// gate: the evaluateGate() result from maturity.js. Only fires when the gate
// actually produced a molecule (see maturity.js's `producesMolecule`).
export function fromMoleculeProduction({ moleculeId, gate, sourceRodId, mergeBackStageId }) {
  if (!gate?.producesMolecule) return null;
  return {
    ruleId: `molecule-production::${moleculeId}`,
    label: `Master data produced from ${moleculeId}`,
    rootRodType: 'masterData',
    sourceMoleculeId: moleculeId,
    sourceRodId,
    mergeBackStageId: mergeBackStageId || null,
    bypassesQualification: true,
    branches: [],
  };
}

let rodSequence = 0;
function nextRodId(prefix) {
  rodSequence += 1;
  return `${prefix}-${rodSequence}`;
}

function cloneStages(stages) {
  return stages.map((stage) => ({
    ...stage,
    atoms: stage.atoms.map((atomInstance) => ({ ...atomInstance })),
  }));
}

function cloneTemplate(rodTemplates, rodType) {
  const template = rodTemplates[rodType];
  if (!template) throw new Error(`Unknown rod type in genesis plan: ${rodType}`);
  return {
    ...template,
    stages: cloneStages(template.stages),
    tributary: template.tributary
      ? { ...template.tributary, status: 'active', stages: cloneStages(template.tributary.stages) }
      : undefined,
  };
}

// Instantiates real rod records from a genesis plan + the config's rod-type
// templates (rodTemplates: { revenue, customer, member }, passed in by the
// caller so this module never imports the config directly — the engine
// renders configuration, it doesn't own it). `entityLabel` ties every rod
// spawned from one genesis event to the same real-world entity (a deal, an
// org, or a person) for later Customer-360 triangulation (see rodHash.js).
export function buildRodFromPlan(plan, { rodTemplates, entityLabel }) {
  const rods = [];

  let rootRod;
  if (plan.rootRodType === 'masterData') {
    rootRod = {
      id: nextRodId('masterdata'),
      rodType: 'masterData',
      name: `Master Data Rod — ${plan.sourceMoleculeId}`,
      entityLabel,
      sourceMoleculeId: plan.sourceMoleculeId,
      sourceRodId: plan.sourceRodId,
      mergeBackStageId: plan.mergeBackStageId,
      status: 'pending',
      parentRodId: plan.sourceRodId,
      originGateId: plan.mergeBackStageId,
      branchAngleDeg: 200,
      branchElevation: 0.5,
      createdAt: Date.now(),
      stages: [{ id: nextRodId('mdstage'), name: 'Master Record', maturity: 1, atoms: [] }],
    };
  } else {
    rootRod = {
      ...cloneTemplate(rodTemplates, plan.rootRodType),
      id: nextRodId(plan.rootRodType),
      rodType: plan.rootRodType,
      entityLabel,
      parentRodId: null,
      originGateId: null,
      bypassesQualification: plan.bypassesQualification,
      convergedRoles: plan.convergedRoles || [],
      genesisRuleId: plan.ruleId,
      createdAt: Date.now(),
    };
  }
  rods.push(rootRod);

  (plan.branches || []).forEach((branch) => {
    const isCustomer = branch.rodType === 'customer';
    rods.push({
      ...cloneTemplate(rodTemplates, branch.rodType),
      id: nextRodId(branch.rodType),
      rodType: branch.rodType,
      entityLabel,
      parentRodId: rootRod.id,
      originGateId: branch.originGateId,
      relationshipType: branch.via,
      bypassesQualification: plan.bypassesQualification,
      branchAngleDeg: isCustomer ? 42 : -42,
      branchElevation: isCustomer ? 0.18 : -0.12,
      genesisRuleId: plan.ruleId,
      createdAt: Date.now(),
    });
  });

  return { rods, ruleId: plan.ruleId };
}

export function buildRodFromJourneyDefinition(definition, { entityLabel }) {
  const rod = {
    id: nextRodId('deal'),
    rodType: 'revenue',
    templateName: definition.templateName,
    name: entityLabel,
    entityLabel,
    createdAt: Date.now(),
    stages: definition.stages.map((stage) => ({
      id: `deal-${stage.key}`,
      name: stage.title,
      short: stage.short,
      description: stage.description,
      source: stage.source,
      maturity: stage.source === 'live' ? 0.85 : 0.05,
      dealStageKey: stage.key,
      atoms: [...stage.metrics.map((metric, index) => ({
        atomId: `${stage.key}-metric-${index}`,
        elementId: metric.elementId || definition.defaultElementId,
        name: metric.label,
        meaning: metric.label,
        maturity: stage.source === 'live' ? 0.85 : 0.05,
        magneticProperties: [stage.key],
        value: metric.value,
        risk: metric.flag === 'red' ? 0.8 : 0,
        security: { scope: 'org' },
      })), ...stage.fields.map((field, index) => ({
        atomId: `${stage.key}-field-${index}`,
        elementId: field.elementId || definition.defaultElementId,
        name: field.label,
        meaning: field.label,
        maturity: field.placeholder ? 0.05 : 0.85,
        magneticProperties: [stage.key],
        value: field.value,
        risk: 0,
        security: { scope: 'org' },
      }))],
    })),
  };
  return { plan: { ruleId: 'configured-deal-journey' }, rods: [rod] };
}
