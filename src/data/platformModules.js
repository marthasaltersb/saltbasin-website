// The 11-app Application Map from PLATFORM_MERGE_SPEC.md §9 — the canonical
// list of modules the Operating Model Dashboard breaks its backlog down by.
// This is deliberately a *different* list than PLATFORM_LIFECYCLE_CONFIG.applications
// in platformLifecycleConfig.js, which covers the 4 underlying unify-layer apps
// (EIDOS/PLM/Contribution Intelligence/Global Standards) from the merge spec's
// architecture section, not the 11 product-facing modules from the application map.
export const PLATFORM_MODULES = [
  { id: 'app.nrm', label: 'Network Relationship Management', shortLabel: 'NRM',
    description: 'Betsy’s profile, the member network roster, and contact/reference-request tracking.' },
  { id: 'app.crm', label: 'Customer Relationship Management', shortLabel: 'CRM',
    description: 'Leads, organizations, and pipeline for org-level customer relationships.' },
  { id: 'app.plm', label: 'Platform Lifecycle Management', shortLabel: 'PLM',
    description: 'Backlog, requirements, QA, release notes, and version history for the platform itself.' },
  { id: 'app.herq', label: 'HERQ Content Manager', shortLabel: 'HERQ',
    description: 'Salter Momentum™ / HERQ framework, series, and post tracker.' },
  { id: 'app.services', label: 'Services Proposal Manager', shortLabel: 'Services',
    description: 'Service proposal authoring, access requests, and published proposal outputs.' },
  { id: 'app.globalStandards', label: 'Global Standard Content Manager', shortLabel: 'Standards',
    description: 'Shared standards, pending-standard governance, and published definitions.' },
  { id: 'app.finbridgeco', label: 'FinBridgeCo Manager', shortLabel: 'FinBridgeCo',
    description: 'FinBridgeCo configuration and status (placeholder module).' },
  { id: 'app.resume', label: 'Resume Output Generator', shortLabel: 'Resume',
    description: 'Print-friendly resume, proposal, case-study, and one-pager outputs.' },
  { id: 'app.analytics', label: 'Platform Analytics Hub', shortLabel: 'Analytics',
    description: 'Cross-platform usage and performance analytics for admin and members.' },
  { id: 'app.memberSite', label: 'Member Website CMS', shortLabel: 'Member Sites',
    description: 'The multi-tenant member admin shell — every operator’s own site editor.' },
  { id: 'app.publicSite', label: 'Salt Basin Public Site CMS', shortLabel: 'Public Site',
    description: 'saltbasin.net itself: public content, admin shell infrastructure, deployment, and security.' },
];

export const UNASSIGNED_MODULE = {
  id: 'unassigned', label: 'Unassigned', shortLabel: 'Unassigned',
  description: 'Backlog items whose capability group doesn’t map to a module yet.',
};

// Capability-group slug (server/data/backlog/seed.js `groups[].slug`) → module id.
// First-pass mapping — deliberately kept in one place so it's trivial to retune
// as modules are actually built out. Groups not listed here fall into
// UNASSIGNED_MODULE rather than silently vanishing from the dashboard.
const GROUP_TO_MODULE = {
  'net-works-network': 'app.nrm',
  'lead-capture': 'app.crm',
  'requirements-mgmt': 'app.plm',
  'observability': 'app.plm',
  'multi-tenant-cms': 'app.memberSite',
  'output-pages': 'app.resume',
  'platform-foundation': 'app.publicSite',
  'public-site-content': 'app.publicSite',
  'admin-experience': 'app.publicSite',
  'deployment-infrastructure': 'app.publicSite',
  'security-and-data': 'app.publicSite',
  'email-infrastructure': 'app.publicSite',
};

export function moduleForGroupSlug(slug) {
  const moduleId = slug ? GROUP_TO_MODULE[slug] : null;
  return PLATFORM_MODULES.find((m) => m.id === moduleId) || UNASSIGNED_MODULE;
}
