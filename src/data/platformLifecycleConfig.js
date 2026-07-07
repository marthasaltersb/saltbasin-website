export const PLATFORM_LIFECYCLE_CONFIG = {
  version: '0.2.0-salt-basin-merge',
  applications: [
    {
      appId: 'app.eidosOperatingModel',
      displayName: 'EIDOS Operating Model',
      purpose: 'Enterprise hierarchy, ledgers, governance controls, evidence-backed rollups, and definition of done.',
    },
    {
      appId: 'app.platformLifecycle',
      displayName: 'Platform Lifecycle Management',
      purpose: 'Backlog, requirements, features, deployments, release notes, version history, comparison notes, and full-picture outputs.',
    },
    {
      appId: 'app.contributionIntelligence',
      displayName: 'Contribution Intelligence',
      purpose: 'Human and AI contribution visibility, signoff, evidence quality, standards lineage, reuse, value, and risk reduction.',
    },
    {
      appId: 'app.globalStandards',
      displayName: 'Global Standards',
      purpose: 'Shared standards, pending-standard governance, application labels, and publish review controls.',
    },
  ],
  objectTypes: [
    'Enterprise',
    'Portfolio',
    'Thesis',
    'Tributary',
    'Capability',
    'Feature',
    'Component',
    'Task',
    'Deliverable',
    'Validation',
    'Production',
    'Measured Value',
    'Requirement',
    'Backlog Item',
    'Deployment',
    'Release Note',
    'Version History',
    'Comparison Note',
    'Full Picture Output',
    'Global Standard',
    'Pending Standard',
    'Contribution Record',
    'Signoff Gate',
    'AI QA Review',
  ],
  platformLifecycleObjects: [
    'Requirement',
    'Backlog Item',
    'Feature',
    'Deployment',
    'Release Note',
    'Version History',
    'Comparison Note',
    'Full Picture Output',
  ],
  releaseFlow: [
    'Backlog item created',
    'Requirement mapped to capability, domain, and system',
    'Feature linked to tech stack component',
    'Deployment created',
    'Stats snapshot captured',
    'Release output generated',
    'Comparison notes appended to prior release entry',
    'To-date full picture output refreshed',
  ],
  globalStandardTypes: [
    'domain',
    'capability',
    'industry',
    'audience',
    'system',
    'techStackComponent',
    'dataSlice',
    'userGroup',
    'status',
    'label',
    'metric',
    'outputType',
    'releaseType',
  ],
  governanceFlow: [
    'Global Standard',
    'User Override',
    'Pending Standard',
    'Published Output Required',
    'Human Review',
    'Approved/Merged or Rejected/Local Override',
  ],
  lifecycleStages: [
    { key: 'discovered', label: 'Discovered', progress: 0.05, gates: { dataDefinition: 0.1 } },
    { key: 'defined', label: 'Defined', progress: 0.14, gates: { dataDefinition: 0.35, businessDefinition: 0.35 } },
    { key: 'researching', label: 'Researching', progress: 0.22, gates: { dataDefinition: 0.45, businessDefinition: 0.55, sourceContribution: 0.35 } },
    { key: 'designed', label: 'Designed', progress: 0.34, gates: { dataDefinition: 0.6, functionalDesign: 0.6, technicalDesign: 0.45, dataArchitecture: 0.45 } },
    { key: 'approved', label: 'Approved', progress: 0.43, gates: { dataDefinition: 0.7, businessDefinition: 0.75, functionalDesign: 0.7, humanJudgment: 0.55 } },
    { key: 'architecting', label: 'Architecting', progress: 0.52, gates: { technicalDesign: 0.7, dataArchitecture: 0.65, standardsAlignment: 0.55 } },
    { key: 'building', label: 'Building', progress: 0.64, gates: { build: 0.15, technicalDesign: 0.65, dataArchitecture: 0.6 } },
    { key: 'testing', label: 'Testing', progress: 0.76, gates: { build: 0.65, testing: 0.2 } },
    { key: 'validated', label: 'Validated', progress: 0.86, gates: { build: 0.85, testing: 0.75, validation: 0.6, evidenceQuality: 0.65 } },
    { key: 'released', label: 'Released', progress: 0.92, gates: { build: 1, testing: 0.85, validation: 0.75, documentation: 0.65, humanJudgment: 0.75 } },
    { key: 'measured', label: 'Measured', progress: 0.98, gates: { validation: 0.85, documentation: 0.75, businessValue: 0.6 } },
    { key: 'optimized', label: 'Optimized', progress: 1, gates: { validation: 0.9, documentation: 0.85, reusePotential: 0.7, businessValue: 0.7 } },
    { key: 'retired', label: 'Retired', progress: 1, gates: { documentation: 0.75, humanJudgment: 0.7 } },
  ],
  lifecycleGateSources: {
    dataDefinition: 'Object data-definition completion',
    businessDefinition: 'Methodology dimension',
    functionalDesign: 'Methodology dimension',
    technicalDesign: 'Methodology dimension',
    dataArchitecture: 'Methodology dimension',
    build: 'Methodology dimension',
    testing: 'Methodology dimension',
    validation: 'Methodology dimension',
    documentation: 'Methodology dimension',
    humanJudgment: 'Contribution intelligence dimension',
    aiContribution: 'Contribution intelligence dimension',
    sourceContribution: 'Contribution intelligence dimension',
    standardsAlignment: 'Contribution intelligence dimension',
    evidenceQuality: 'Contribution intelligence dimension',
    reusePotential: 'Contribution intelligence dimension',
    businessValue: 'Contribution intelligence dimension',
    riskReduction: 'Contribution intelligence dimension',
  },
  methodologyDimensions: [
    { key: 'businessDefinition', label: 'Business Definition', weight: 0.05 },
    { key: 'functionalDesign', label: 'Functional Design', weight: 0.1 },
    { key: 'technicalDesign', label: 'Technical Design', weight: 0.1 },
    { key: 'dataArchitecture', label: 'Data Architecture', weight: 0.1 },
    { key: 'build', label: 'Build', weight: 0.3 },
    { key: 'testing', label: 'Testing', weight: 0.15 },
    { key: 'validation', label: 'Validation', weight: 0.1 },
    { key: 'documentation', label: 'Documentation', weight: 0.1 },
  ],
  contributionDimensions: [
    { key: 'humanJudgment', label: 'Human Judgment / Signoff', weight: 0.16 },
    { key: 'aiContribution', label: 'AI Contribution Clarity', weight: 0.12 },
    { key: 'sourceContribution', label: 'Source Contribution', weight: 0.14 },
    { key: 'standardsAlignment', label: 'Global Standards Alignment', weight: 0.14 },
    { key: 'evidenceQuality', label: 'Evidence Quality', weight: 0.16 },
    { key: 'reusePotential', label: 'Reuse Potential', weight: 0.1 },
    { key: 'businessValue', label: 'Business / Margin Value', weight: 0.1 },
    { key: 'riskReduction', label: 'Risk Reduction', weight: 0.08 },
  ],
  realProgressModel: [
    { key: 'dataDefinition', label: 'Data Definition', weight: 0.2 },
    { key: 'methodology', label: 'Methodology Completion', weight: 0.35 },
    { key: 'lifecycle', label: 'Lifecycle Position', weight: 0.15 },
    { key: 'contribution', label: 'Contribution Intelligence', weight: 0.2 },
    { key: 'budgetConfidence', label: 'Budget Confidence', weight: 0.1 },
  ],
  dataDefinitionRequirements: {
    default: ['Identity', 'Ownership', 'Source Lineage', 'Work Definition', 'Financial Definition', 'Governance', 'Measurement'],
    'Backlog Item': ['Identity', 'Requirement Link', 'Owner', 'Priority', 'Status', 'Dependency', 'Release Target', 'Evidence'],
    Requirement: ['Identity', 'Capability Map', 'Domain Map', 'System Map', 'Acceptance Criteria', 'Source', 'Priority', 'Release Target'],
    Feature: ['Identity', 'Owner', 'Functional Requirements', 'Acceptance Criteria', 'UX Surface', 'Technical Impact', 'Tests', 'Release Criteria'],
    Deployment: ['Identity', 'Feature Links', 'Environment', 'Deployment Date', 'Stats Snapshot', 'Release Output', 'Comparison Notes'],
    'Contribution Record': ['Identity', 'Contributor Type', 'Contributor', 'Object Link', 'Contribution Type', 'Evidence', 'Signoff Status'],
  },
  applicationObjectLabelMap: [
    { unifiedObject: 'unifiedContentItem', eidos: 'Work Object', platformLifecycle: 'Lifecycle Record', contributionIntelligence: 'Contribution Record', globalStandards: 'Standard Definition' },
    { unifiedObject: 'series', eidos: 'Portfolio / Tributary', platformLifecycle: 'Product Area', contributionIntelligence: 'Contribution Stream', globalStandards: 'Standard Category' },
    { unifiedObject: 'domain', eidos: 'Operating Domain', platformLifecycle: 'Architecture Domain', contributionIntelligence: 'Contribution Domain', globalStandards: 'Domain' },
    { unifiedObject: 'capability', eidos: 'Capability', platformLifecycle: 'Platform Capability', contributionIntelligence: 'Contribution Capability', globalStandards: 'Capability' },
    { unifiedObject: 'output', eidos: 'Deliverable', platformLifecycle: 'Lifecycle Output', contributionIntelligence: 'Contribution Evidence', globalStandards: 'Standards Explainer' },
    { unifiedObject: 'template', eidos: 'Report Template', platformLifecycle: 'Release / Roadmap Template', contributionIntelligence: 'Contribution Review Template', globalStandards: 'Standards Model Template' },
  ],
};

const methodologyWeights = Object.fromEntries(PLATFORM_LIFECYCLE_CONFIG.methodologyDimensions.map((dimension) => [dimension.key, dimension.weight]));
const contributionWeights = Object.fromEntries(PLATFORM_LIFECYCLE_CONFIG.contributionDimensions.map((dimension) => [dimension.key, dimension.weight]));

export function pct(value) {
  return `${Math.round(clamp01(value) * 100)}%`;
}

export function clamp01(value) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(1, Number(value)));
}

export function average(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

export function backlogItemToLifecycleRecord(item, group) {
  const dataDefinitionPct = dataDefinitionScore(item);
  const methodology = methodologyScores(item, group);
  const contribution = contributionScores(item, group);
  const selectedStage = selectedStageFromStatus(item.status);
  const budgetConfidence = budgetConfidenceScore(item);
  const record = {
    id: item.id,
    code: `BLG-${String(item.id).padStart(3, '0')}`,
    name: item.title,
    type: item.kind === 'defect' ? 'Validation' : 'Backlog Item',
    sourceItem: item,
    capability: group || null,
    dataDefinitionPct,
    methodology,
    contribution,
    selectedStage,
    budgetConfidence,
  };
  record.computedStage = computedLifecycleStage(record);
  record.gateGaps = lifecycleGateGaps(record, record.selectedStage);
  record.methodologyScore = weightedScore(record.methodology, methodologyWeights);
  record.contributionScore = weightedScore(record.contribution, contributionWeights);
  record.lifecycleProgress = record.computedStage?.progress || 0;
  record.realProgressScore = realProgressScore(record);
  return record;
}

export function computedLifecycleStage(record) {
  let eligible = PLATFORM_LIFECYCLE_CONFIG.lifecycleStages[0];
  for (const stage of PLATFORM_LIFECYCLE_CONFIG.lifecycleStages) {
    if (stageGateResult(record, stage).passed) eligible = stage;
    else break;
  }
  return eligible;
}

export function lifecycleGateGaps(record, stage) {
  return stageGateResult(record, stage).gaps;
}

export function gateLabel(key) {
  if (key === 'dataDefinition') return 'Data Definition';
  return (
    PLATFORM_LIFECYCLE_CONFIG.methodologyDimensions.find((dimension) => dimension.key === key)?.label ||
    PLATFORM_LIFECYCLE_CONFIG.contributionDimensions.find((dimension) => dimension.key === key)?.label ||
    key
  );
}

function stageGateResult(record, stage) {
  const gaps = Object.entries(stage?.gates || {})
    .map(([key, required]) => ({
      key,
      required,
      actual: gateValue(record, key),
      source: PLATFORM_LIFECYCLE_CONFIG.lifecycleGateSources[key] || 'Configured gate',
    }))
    .filter((gate) => gate.actual + 0.0001 < gate.required);
  return { passed: gaps.length === 0, gaps };
}

function gateValue(record, key) {
  if (key === 'dataDefinition') return record.dataDefinitionPct || 0;
  if (record.methodology?.[key] !== undefined) return record.methodology[key] || 0;
  if (record.contribution?.[key] !== undefined) return record.contribution[key] || 0;
  return 0;
}

function weightedScore(values, weights) {
  return Object.entries(weights).reduce((sum, [key, weight]) => sum + clamp01(values?.[key]) * weight, 0);
}

function realProgressScore(record) {
  const inputs = {
    dataDefinition: record.dataDefinitionPct || 0,
    methodology: record.methodologyScore || 0,
    lifecycle: record.lifecycleProgress || 0,
    contribution: record.contributionScore || 0,
    budgetConfidence: record.budgetConfidence || 0,
  };
  return PLATFORM_LIFECYCLE_CONFIG.realProgressModel.reduce((sum, item) => sum + inputs[item.key] * item.weight, 0);
}

function selectedStageFromStatus(status) {
  const map = {
    pending: 'defined',
    in_progress: 'building',
    completed: 'validated',
    deployed: 'released',
    blocked: 'defined',
    archived: 'retired',
  };
  const key = map[status] || 'defined';
  return PLATFORM_LIFECYCLE_CONFIG.lifecycleStages.find((stage) => stage.key === key) || PLATFORM_LIFECYCLE_CONFIG.lifecycleStages[0];
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function ratio(parts) {
  if (!parts.length) return 0;
  return parts.reduce((sum, value) => sum + clamp01(value), 0) / parts.length;
}

function boolScore(value) {
  return value ? 1 : 0;
}

function dataDefinitionScore(item) {
  return ratio([
    boolScore(hasText(item.title)),
    boolScore(item.capabilityId != null),
    boolScore(hasText(item.summary)),
    boolScore(hasText(item.requirementDetail) || hasText(item.userStory)),
    boolScore(hasText(item.acceptanceCriteria)),
    boolScore(hasText(item.priority)),
    boolScore(hasArray(item.tags) || hasText(item.externalRef)),
    boolScore(item.timeMinutes != null || item.hoursBetsy != null || item.hoursClaude != null || item.costUsdClaude != null),
  ]);
}

function methodologyScores(item, group) {
  const isDelivered = item.status === 'completed' || item.status === 'deployed';
  const isDeployed = item.status === 'deployed' || item.deployedGithub || item.deployedRender || item.deployedNetlify;
  const isBuilding = item.status === 'in_progress' || isDelivered;
  return {
    businessDefinition: ratio([boolScore(hasText(item.userStory)), boolScore(hasText(item.businessRules)), boolScore(hasText(item.priority))]),
    functionalDesign: ratio([boolScore(hasText(item.requirementDetail)), boolScore(hasText(item.acceptanceCriteria)), boolScore(hasText(item.processSteps))]),
    technicalDesign: ratio([boolScore(hasText(item.designSpec)), boolScore(hasArray(item.techStack) || hasArray(group?.techStack)), boolScore(hasText(item.externalRef))]),
    dataArchitecture: ratio([boolScore(item.capabilityId != null), boolScore(hasArray(item.tags)), boolScore(item.deployRelevance != null)]),
    build: isDeployed ? 1 : isDelivered ? 0.85 : isBuilding ? 0.35 : 0,
    testing: isDeployed ? 0.9 : isDelivered ? 0.75 : hasText(item.acceptanceCriteria) ? 0.25 : 0,
    validation: isDeployed ? 0.85 : isDelivered ? 0.65 : item.status === 'blocked' ? 0.1 : 0,
    documentation: ratio([boolScore(hasText(item.summary)), boolScore(hasText(item.designSpec)), boolScore(hasText(item.acceptanceCriteria)), boolScore(hasText(item.processSteps))]),
  };
}

function contributionScores(item, group) {
  const hoursBetsy = Number(item.hoursBetsy || 0);
  const hoursClaude = Number(item.hoursClaude || 0);
  const hasHuman = hoursBetsy > 0 || item.status === 'completed' || item.status === 'deployed';
  const hasAi = hoursClaude > 0 || Number(item.workSplitClaude || 0) > 0 || Number(item.activitiesClaude || 0) > 0;
  const evidence = ratio([boolScore(hasText(item.acceptanceCriteria)), boolScore(hasText(item.externalRef)), boolScore(item.deployedGithub || item.deployedRender || item.deployedNetlify)]);
  return {
    humanJudgment: hasHuman ? (item.status === 'deployed' ? 0.85 : 0.65) : 0.25,
    aiContribution: hasAi ? clamp01((Number(item.workSplitClaude || 50) / 100 + boolScore(Number(item.activitiesClaude || 0) > 0)) / 2) : 0,
    sourceContribution: ratio([boolScore(hasText(item.externalRef)), boolScore(hasArray(item.tags)), boolScore(hasText(item.requirementDetail))]),
    standardsAlignment: ratio([boolScore(item.capabilityId != null), boolScore(hasText(group?.name)), boolScore(hasArray(item.techStack) || hasArray(group?.techStack))]),
    evidenceQuality: evidence,
    reusePotential: ratio([boolScore(item.kind === 'feature' || item.kind === 'chore'), boolScore(hasArray(item.techStack) || hasArray(group?.techStack)), boolScore(hasText(item.designSpec))]),
    businessValue: item.priority === 'p0' ? 0.9 : item.priority === 'p1' ? 0.75 : item.priority === 'p2' ? 0.55 : 0.35,
    riskReduction: item.kind === 'defect' ? 0.85 : item.status === 'blocked' ? 0.35 : hasText(item.businessRules) ? 0.6 : 0.35,
  };
}

function budgetConfidenceScore(item) {
  const hasActualHours = item.hoursBetsy != null || item.hoursClaude != null;
  const hasLegacyHours = item.timeMinutes != null;
  const hasCost = item.costUsdClaude != null || item.traditionalCostUsd != null;
  return ratio([boolScore(hasActualHours), boolScore(hasLegacyHours), boolScore(hasCost)]);
}
