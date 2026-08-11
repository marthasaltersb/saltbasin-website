// Canonical member experience topology. This is intentionally data-first: the
// visual orbit, city, journey paths, entitlement gates, and workspace routes
// all consume the same definitions instead of maintaining parallel menus.
export const MEMBER_WORLD_REGISTRY = [
  {
    id: 'account', label: 'My Account', shortLabel: 'Account', accent: '#E8DCC4', alwaysAvailable: true,
    description: 'Identity, verification, payment sponsorship, plans, licenses, shortcuts, and dashboard cards.',
    variants: [
      { id: 'account-agents', label: 'Account Agent Orbit', icon: 'AI', tab: 'agent-hub-config' },
      { id: 'identity', label: 'Identity & Email', icon: 'ID', action: 'account' },
      { id: 'commerce', label: 'Payments & Plans', icon: '$', action: 'account' },
      { id: 'access', label: 'Licenses & Entitlements', icon: 'KEY', action: 'account' },
      { id: 'home-design', label: 'Home Configuration', icon: 'UI', action: 'account' },
    ],
    journeys: [{ id: 'account-ready', label: 'Account readiness', stages: ['Verify identity', 'Connect payer', 'Confirm licenses', 'Shape home'] }],
  },
  {
    id: 'salt-basin', label: 'Salt Basin', shortLabel: 'Platform', accent: '#C4843A', adminOnly: true,
    description: 'The Salt Basin organization control plane, definitions, intelligence domains, and platform operations.',
    variants: [
      { id: 'platform-agents', label: 'Platform Agent Orbit', icon: 'AI', tab: 'agent-hub-config' },
      { id: 'definition-studio', label: 'Definition Studio', icon: 'DEF', tab: 'methodology-config' },
      { id: 'platform-settings', label: 'Platform Settings', icon: 'CFG', tab: 'config' },
      { id: 'executive', label: 'Executive Intelligence', icon: 'EXE', tab: 'analytics' },
      { id: 'business-unit', label: 'Business Unit Intelligence', icon: 'BU', tab: 'eidos' },
      { id: 'marketing', label: 'Marketing Intelligence', icon: 'MKT', tab: 'leads' },
      { id: 'sales', label: 'Sales Intelligence', icon: 'SLS', tab: 'metric-intelligence' },
      { id: 'customer', label: 'Customer Intelligence', icon: 'CX', tab: 'networks' },
      { id: 'member', label: 'Member Intelligence', icon: 'MEM', tab: 'networks' },
      { id: 'contract', label: 'Contract Intelligence', icon: 'CLM', tab: 'governance' },
      { id: 'finance', label: 'Finance Intelligence', icon: 'FIN', tab: 'finbridgeco' },
    ],
    journeys: [
      { id: 'definition-to-operation', label: 'Definition to operation', stages: ['Semantic definition', 'Configuration rules', 'Agent deployment', 'Evidence review', 'Approval convergence'] },
      { id: 'lead-to-revenue', label: 'Lead to revenue', stages: ['Lead', 'Pipeline', 'Pricing', 'Contract', 'Billing', 'Revenue', 'Board'] },
    ],
  },
  {
    id: 'member', label: 'Salt Basin Member', shortLabel: 'Member', accent: '#785D69', featureKeys: ['career_core', 'member_site'],
    description: 'Personal brand, member connections, intake, career evidence, opportunity pipelines, and portfolio outputs.',
    variants: [
      { id: 'member-agent-orbit', label: 'Member Agent Orbit', icon: 'AI', tab: 'agent-hub-config' },
      { id: 'profile-site', label: 'Profile Site', icon: 'WEB', featureKey: 'member_site', tab: 'content' },
      { id: 'networking', label: 'Networking Intelligence', icon: 'NET', tab: 'networks' },
      { id: 'career', label: 'Career Intelligence', icon: 'CAR', featureKey: 'career_core', tab: 'careerMaster' },
      { id: 'outputs', label: 'Resume & Portfolio Studio', icon: 'OUT', featureKey: 'career_core', tab: 'outputTemplates' },
      { id: 'career-agents', label: 'Career Agents', icon: 'AI', featureKey: 'career_agents', tab: 'agent' },
    ],
    journeys: [
      { id: 'career-foundation', label: 'Career foundation', stages: ['Upload source documents', 'Parse and map evidence', 'Review recommended mappings', 'Define jobs and roles', 'Link skills, tools, and projects', 'Approve Career Master'] },
      { id: 'career-placement', label: 'Career placement', stages: ['Configure research agents', 'Research jobs and market signals', 'Review recommendations', 'Validate active postings', 'Approve target opportunities'] },
      { id: 'resume-to-portfolio', label: 'Resume output review', stages: ['Select target opportunity', 'Configure resume output', 'Generate evidence-backed draft', 'Edit and review resume', 'Approve output'] },
      { id: 'application-pipeline', label: 'Job application pipeline', stages: ['Apply for role', 'Update pipeline record', 'Track interviews', 'Record offer or outcome', 'Capture learning'] },
      { id: 'opportunity-pipeline', label: 'Career opportunity pipeline', stages: ['Discover', 'Qualify', 'Tailor', 'Engage', 'Interview', 'Convert'] },
      { id: 'member-connection', label: 'Member connection', stages: ['Discover member', 'Permission check', 'Request', 'Collaborate', 'Close loop'] },
    ],
  },
  {
    id: 'client', label: 'Organization Salt Basin', shortLabel: 'Organization', accent: '#4A7C8E', organizationScoped: true,
    description: 'A client-scoped Salt Basin environment with its own site, definitions, permissions, templates, agents, and intelligence.',
    variants: [
      { id: 'definition-studio', label: 'Definition Studio', icon: 'DEF', tab: 'methodology-config' },
      { id: 'org-definition', label: 'Organization Definition', icon: 'ORG', tab: 'profiles' },
      { id: 'org-site', label: 'Public Site & Routing', icon: 'WEB', tab: 'content' },
      { id: 'org-access', label: 'Members & Permissions', icon: 'ACL', tab: 'access' },
      { id: 'org-intelligence', label: 'Deployed Intelligence', icon: 'INT', tab: 'analytics' },
      { id: 'org-agents', label: 'Organization Agent Orbit', icon: 'AI', tab: 'agent-hub-config' },
    ],
    journeys: [
      { id: 'definition-to-operation', label: 'Definition to operation', stages: ['Semantic definition', 'Configuration rules', 'Agent deployment', 'Evidence review', 'Approval convergence'] },
      { id: 'org-provisioning', label: 'Organization provisioning', stages: ['Select template', 'Define semantics', 'Map systems', 'Provision modules', 'Invite members', 'Publish'] },
      { id: 'interface-intelligence', label: 'Interface intelligence', stages: ['Observe', 'Classify', 'Trace', 'Explain', 'Detect', 'Recommend', 'Remember'] },
    ],
  },
];

export const DEFAULT_EDGE_CARDS = [
  { id: 'health', label: 'World Health', value: '82%', detail: 'Definition coverage and evidence maturity', enabled: true },
  { id: 'reviews', label: 'Review Queue', value: '7', detail: 'Agent outputs awaiting member approval', enabled: true },
  { id: 'journeys', label: 'Active Journeys', value: '3', detail: 'Cross-capability flows currently in motion', enabled: true },
  { id: 'agents', label: 'Agents Working', value: '12', detail: 'Scheduled and event-driven workers', enabled: true },
];

export function provisionMemberWorlds({ user, entitlements = [], organizations = [] }) {
  const features = new Set();
  for (const item of entitlements) {
    if (item.featureKey) features.add(item.featureKey);
    if (item.moduleKey) features.add(item.moduleKey);
    if (item.module_key) features.add(item.module_key);
  }
  // Career is the existing member baseline. API grants progressively reveal
  // additional variants without leaving a newly-created member with no world.
  features.add('career_core');
  return MEMBER_WORLD_REGISTRY.flatMap((world) => {
    if (world.adminOnly && user?.role !== 'admin') return [];
    if (world.organizationScoped && !organizations.length) return [];
    const instances = world.organizationScoped
      ? organizations.map((org) => ({ ...world, id: `client-${org.id}`, label: `${org.name || 'Organization'} Salt Basin`, organization: org }))
      : [{ ...world }];
    return instances.map((instance) => ({
      ...instance,
      variants: instance.variants.filter((variant) => !variant.featureKey || features.has(variant.featureKey)),
    }));
  });
}

