export const WEBSITE_SOURCE_TYPES = Object.freeze({
  PUBLIC_WEBSITE: 'PUBLIC_WEBSITE',
  ORGANIZATION_CONFIGURATION: 'ORGANIZATION_CONFIGURATION',
  MEMBER_CONFIGURATION: 'MEMBER_CONFIGURATION',
  BRAND_GUIDE: 'BRAND_GUIDE',
  DOCUMENT: 'DOCUMENT',
  PRODUCT_SPEC: 'PRODUCT_SPEC',
  SALES_CONTENT: 'SALES_CONTENT',
  CASE_STUDY: 'CASE_STUDY',
  STRUCTURED_DATA: 'STRUCTURED_DATA',
});

export function normalizePages(site) {
  const pages = site?.pages;
  if (Array.isArray(pages)) return pages;
  if (!pages || typeof pages !== 'object') return [];
  return Object.entries(pages).map(([key, page]) => ({ key, ...page }));
}

function textValues(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => textValues(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => textValues(item, output));
  return output;
}

export function createWebsitePageInventory(site, source = {}) {
  const observedAt = new Date().toISOString();
  return normalizePages(site).map((page, index) => {
    const sections = Array.isArray(page.sections) ? page.sections : [];
    const liveSections = sections.filter((section) => section.status === 'live');
    const words = textValues(liveSections.map((section) => section.fields || section.content || {}))
      .join(' ').trim().split(/\s+/).filter(Boolean).length;
    return {
      page_id: page.key || page.id || `page-${index + 1}`,
      source_url: page.slug ? `/${page.slug}` : '/',
      page_title: page.name || page.title || page.slug || 'Untitled page',
      page_type: page.type || 'standard',
      navigation_level: 0,
      heading_structure: liveSections.map((section) => section.fields?.heading).filter(Boolean),
      content_blocks: sections.map((section) => ({
        section_id: section.id,
        section_type: section.type,
        status: section.status,
        name: section.name || section.type,
      })),
      ctas: liveSections.flatMap((section) => Object.entries(section.fields || {})
        .filter(([key, value]) => /cta.*(label|link)?$/i.test(key) && value)
        .map(([field, value]) => ({ section_id: section.id, field, value }))),
      media_assets: liveSections.flatMap((section) => Object.entries(section.fields || {})
        .filter(([key, value]) => /(image|video|logo|asset|media)/i.test(key) && value)
        .map(([field, value]) => ({ section_id: section.id, field, value }))),
      seo_metadata: page.seo || null,
      inferred_page_purpose: liveSections[0]?.fields?.heading || page.name || 'Not yet explicit',
      content_depth: words,
      content_confidence: words > 0 ? 'OBSERVED' : 'MISSING',
      last_observed: observedAt,
      source_type: source.source_type || WEBSITE_SOURCE_TYPES.ORGANIZATION_CONFIGURATION,
      source_location: source.source_location || 'site_state:published',
      source_version: site?.version ?? null,
    };
  });
}

export function summarizeInventory(inventory) {
  const sections = inventory.reduce((sum, page) => sum + page.content_blocks.length, 0);
  const liveSections = inventory.reduce((sum, page) => sum + page.content_blocks.filter((block) => block.status === 'live').length, 0);
  const pagesWithoutSeo = inventory.filter((page) => !page.seo_metadata).length;
  const pagesWithoutCtas = inventory.filter((page) => page.ctas.length === 0).length;
  return { pages: inventory.length, sections, liveSections, pagesWithoutSeo, pagesWithoutCtas };
}
