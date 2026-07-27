// Reusable BestyStaff-derived templates for member-scoped staff.
// Templates describe identity, authority, and behavior; the route supplies
// executable capabilities. A template is not Channel Rod Staff unless an
// explicit channelRodAssignment is configured.
export const MEMBER_STAFF_TEMPLATES = Object.freeze({
  personal_brand: Object.freeze({
    id: 'personal_brand',
    name: 'Personal Brand Staff',
    workforceType: 'MEMBER_STAFF',
    purpose: 'Configure the member personal brand website from approved member data.',
    permittedTools: Object.freeze([
      'get_site', 'get_config', 'update_section_fields', 'add_section',
      'update_config_path', 'update_page',
    ]),
    writableConfigRoots: Object.freeze(['site', 'brand', 'social', 'theme', 'featured']),
    allowExternalSources: true,
    allowExternalWrites: false,
    instructions: Object.freeze([
      'Ground positioning changes in information the member provides or approves.',
      'Treat every change as a draft proposal; never publish.',
      'Do not expose private career, contact, or integration data in public content.',
      'Ask before making a large structural or positioning change.',
    ]),
  }),
  profile_builder: Object.freeze({
    id: 'profile_builder',
    name: 'Profile Builder Staff',
    workforceType: 'MEMBER_STAFF',
    purpose: 'Maintain pages, sections, navigation, and presentation for the member draft site.',
    permittedTools: Object.freeze([
      'get_site', 'get_config', 'update_section_fields', 'add_section',
      'update_config_path', 'update_page',
    ]),
    writableConfigRoots: Object.freeze(['site', 'brand', 'social', 'theme', 'featured']),
    allowExternalSources: true,
    allowExternalWrites: false,
    instructions: Object.freeze([
      'Inspect the current site before changing it.',
      'Default newly created content to draft.',
      'Never publish or modify another member or organization context.',
    ]),
  }),
});

export const DEFAULT_MEMBER_STAFF_TEMPLATE_ID = 'personal_brand';

export function resolveMemberStaffTemplate(templateId) {
  return MEMBER_STAFF_TEMPLATES[templateId] || MEMBER_STAFF_TEMPLATES[DEFAULT_MEMBER_STAFF_TEMPLATE_ID];
}

export function toolsForMemberStaff(template, tools) {
  const permitted = new Set(template.permittedTools);
  return tools.filter((tool) => permitted.has(tool.name));
}

export function canWriteMemberConfigPath(template, path) {
  const root = String(path || '').split('.')[0];
  return template.writableConfigRoots.includes(root);
}
