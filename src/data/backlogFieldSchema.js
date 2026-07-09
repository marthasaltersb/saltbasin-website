// The literal field catalog that backs the "Data Definition" stage gate and
// the definition-shaped methodology dimensions (businessDefinition,
// functionalDesign, technicalDesign, dataArchitecture, documentation) in
// platformLifecycleConfig.js.
//
// Transcribed from:
//   TECHNICAL_DESIGN_SPEC.md §10.1 — backlog_items column list
//   FUNCTIONAL_DESIGN_SPEC.md §4.12 — Backlog / Requirements Management business rules
// When those docs change shape, update this list to match — it is the single
// place the gates read field names/types from, so the score stays traceable
// to a literal, named source instead of an opaque heuristic.
//
// requirementCategory values reuse PLATFORM_LIFECYCLE_CONFIG.dataDefinitionRequirements
// ['Backlog Item'] in platformLifecycleConfig.js. 'Owner' has no backing field
// today (the system has no assignee/owner column) — that's a genuine, honest
// gap: its category score stays 0 until an owner field is actually added.
export const BACKLOG_FIELD_SCHEMA = [
  { key: 'title', label: 'Title', type: 'text',
    requirementCategory: 'Identity',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'capabilityId', label: 'Capability Group', type: 'reference',
    requirementCategory: 'Identity', methodologyDimension: 'dataArchitecture',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'summary', label: 'Summary', type: 'text',
    requirementCategory: 'Requirement Link', methodologyDimension: 'documentation',
    sourceDoc: 'FUNCTIONAL_DESIGN_SPEC.md', sourceSection: '4.12' },
  { key: 'userStory', label: 'User Story', type: 'text',
    requirementCategory: 'Requirement Link', methodologyDimension: 'businessDefinition',
    sourceDoc: 'FUNCTIONAL_DESIGN_SPEC.md', sourceSection: '4.12' },
  { key: 'requirementDetail', label: 'Requirement Detail', type: 'text',
    requirementCategory: 'Requirement Link', methodologyDimension: 'functionalDesign',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'businessRules', label: 'Business Rules', type: 'text',
    requirementCategory: 'Requirement Link', methodologyDimension: 'businessDefinition',
    sourceDoc: 'FUNCTIONAL_DESIGN_SPEC.md', sourceSection: '4.12' },
  { key: 'designSpec', label: 'Design Spec', type: 'text',
    requirementCategory: 'Evidence', methodologyDimension: 'technicalDesign',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'acceptanceCriteria', label: 'Acceptance Criteria', type: 'text',
    requirementCategory: 'Evidence', methodologyDimension: 'functionalDesign',
    sourceDoc: 'FUNCTIONAL_DESIGN_SPEC.md', sourceSection: '4.12' },
  { key: 'processSteps', label: 'Process Steps', type: 'text',
    requirementCategory: 'Dependency', methodologyDimension: 'documentation',
    sourceDoc: 'FUNCTIONAL_DESIGN_SPEC.md', sourceSection: '4.12' },
  { key: 'priority', label: 'Priority', type: 'enum',
    requirementCategory: 'Priority',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'status', label: 'Status', type: 'enum',
    requirementCategory: 'Status',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'parentId', label: 'Parent Item', type: 'reference',
    requirementCategory: 'Dependency',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'techStack', label: 'Tech Stack', type: 'array',
    requirementCategory: 'Evidence', methodologyDimension: 'technicalDesign',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'tags', label: 'Tags', type: 'array',
    requirementCategory: 'Evidence',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'externalRef', label: 'External Ref / Jira Key', type: 'text',
    requirementCategory: 'Release Target',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'hoursBetsy', label: 'Hours (Betsy)', type: 'number',
    requirementCategory: 'Evidence',
    sourceDoc: 'FUNCTIONAL_TECHNICAL_MAPPING.md', sourceSection: '4.12' },
  { key: 'hoursClaude', label: 'Hours (Claude)', type: 'number',
    requirementCategory: 'Evidence',
    sourceDoc: 'FUNCTIONAL_TECHNICAL_MAPPING.md', sourceSection: '4.12' },
  { key: 'deployedGithub', label: 'Deployed — GitHub', type: 'boolean',
    requirementCategory: 'Release Target', methodologyDimension: 'build',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'deployedRender', label: 'Deployed — Render', type: 'boolean',
    requirementCategory: 'Release Target', methodologyDimension: 'build',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
  { key: 'deployedNetlify', label: 'Deployed — Netlify', type: 'boolean',
    requirementCategory: 'Release Target', methodologyDimension: 'build',
    sourceDoc: 'TECHNICAL_DESIGN_SPEC.md', sourceSection: '10.1' },
];

export function fieldPresent(item, field) {
  const value = item?.[field.key];
  if (field.type === 'array') return Array.isArray(value) && value.length > 0;
  if (field.type === 'boolean') return value === true;
  if (field.type === 'number') return value != null && Number.isFinite(Number(value));
  if (typeof value === 'string') return value.trim().length > 0;
  return value != null;
}

export function fieldsForCategory(category) {
  return BACKLOG_FIELD_SCHEMA.filter((f) => f.requirementCategory === category);
}

export function fieldsForDimension(dimension) {
  return BACKLOG_FIELD_SCHEMA.filter((f) => f.methodologyDimension === dimension);
}

export function categoryScore(item, category) {
  const fields = fieldsForCategory(category);
  if (!fields.length) return 0;
  return fields.filter((f) => fieldPresent(item, f)).length / fields.length;
}

export function dimensionScore(item, dimension) {
  const fields = fieldsForDimension(dimension);
  if (!fields.length) return 0;
  return fields.filter((f) => fieldPresent(item, f)).length / fields.length;
}

export function missingFields(item, category) {
  return fieldsForCategory(category).filter((f) => !fieldPresent(item, f));
}

export function missingDimensionFields(item, dimension) {
  return fieldsForDimension(dimension).filter((f) => !fieldPresent(item, f));
}

// Per-field coverage across a set of items — the "rolled up ... into different
// formats" view: for each schema field, what % of the given items have it
// populated, plus its type and doc provenance for a mapping-documentation output.
export function fieldCoverage(items) {
  return BACKLOG_FIELD_SCHEMA.map((field) => ({
    field,
    coveragePct: items.length ? items.filter((item) => fieldPresent(item, field)).length / items.length : 0,
  }));
}
