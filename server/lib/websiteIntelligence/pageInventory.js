// Website Intelligence Engine — WebsiteAnalysisAgent / WebsitePageInventory
// (master prompt §IV). Phase 2 of .claude/skills/salt-basin-website-intelligence.
//
// For a Salt-Basin-owned source (adaptSaltBasinSiteState /
// adaptMemberSiteState) there is no HTTP crawl to run — the "current-state
// page inventory" is built directly from the real site_state/member_sites
// row. Every section's real `fields` object is inspected; nothing here is
// synthesized. Note the live field name is `section.fields`, not the
// `section.content` name CLAUDE.md documents — confirmed against the real
// published row 2026-07-16 (src/components/blocks/index.jsx reads
// `section.fields` in every block, 51 occurrences).

import crypto from 'node:crypto';

const CTA_FIELD_PATTERN = /^cta\d*(label|link)?$/i;
const HEADING_FIELD_KEYS = ['heading', 'headingEmphasis', 'headline', 'title', 'lede', 'subheading'];

function contentHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

function extractHeadings(fields) {
  return HEADING_FIELD_KEYS
    .filter((key) => typeof fields?.[key] === 'string' && fields[key].trim())
    .map((key) => ({ field: key, text: fields[key] }));
}

function extractCTAs(fields) {
  if (!fields) return [];
  const ctas = [];
  const labelKeys = Object.keys(fields).filter((k) => /^cta\d*Label$/i.test(k));
  for (const labelKey of labelKeys) {
    const index = labelKey.match(/\d+/)?.[0] ?? '';
    const linkKey = `cta${index}Link`;
    if (fields[labelKey]) {
      ctas.push({ label: fields[labelKey], link: fields[linkKey] ?? null });
    }
  }
  return ctas;
}

// content_depth is a text-volume proxy only (character count across string
// fields) — it says nothing about content *quality*, which Phase 3's
// Content Quality analysis dimension covers separately. Do not conflate the
// two the way the master prompt explicitly warns against in §V.
function measureContentDepth(fields) {
  if (!fields) return 0;
  return Object.values(fields)
    .filter((v) => typeof v === 'string')
    .reduce((sum, v) => sum + v.length, 0);
}

// content_confidence here measures *structural completeness* (are the
// section's own fields populated) — it is not the same as Phase 3's
// evidence-based claim confidence, and must not be relabeled as such
// downstream.
function measureFieldFillRate(fields) {
  if (!fields) return 0;
  const values = Object.values(fields);
  if (!values.length) return 0;
  const filled = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
  return Number((filled / values.length).toFixed(2));
}

/**
 * Builds one WebsitePageInventory row per page in a normalized pages[]
 * array (see sourceAdapters.normalizePages). audienceHint/purposeHint are
 * intentionally left null here — inferring audience/purpose from evidence
 * is Phase 3's Narrative Clarity + Audience Journey analysis, not this
 * phase's job. A page inventory that pre-guesses those fields would let
 * Phase 3 skip doing the actual analysis.
 */
export function buildPageInventory(pages, { canonicalBase = '', sourceHash = null } = {}) {
  const flatSections = [];
  for (const page of pages) {
    for (const section of page.sections || []) flatSections.push({ page, section });
  }

  // duplication_score: how many *other* sections on the whole site share
  // this page's exact multiset of section.type values. 0 = unique
  // composition, 1.0 = another page has an identical section-type
  // sequence. This is a structural signal only (never content similarity)
  // — deliberately cheap and explainable rather than a semantic-similarity
  // model this phase has no evidence base to justify yet.
  const typeSignatures = pages.map((p) => (p.sections || []).map((s) => s.type).join('>'));

  return pages.map((page, idx) => {
    const sections = page.sections || [];
    const signature = typeSignatures[idx];
    const duplicateCount = typeSignatures.filter((sig, i) => i !== idx && sig === signature).length;

    const headingStructure = sections.flatMap(({ fields, id, type }) =>
      extractHeadings(fields).map((h) => ({ sectionId: id, sectionType: type, ...h }))
    );
    const ctas = sections.flatMap((s) => extractCTAs(s.fields).map((c) => ({ sectionId: s.id, ...c })));
    const fillRates = sections.map((s) => measureFieldFillRate(s.fields));
    const avgFillRate = fillRates.length ? Number((fillRates.reduce((a, b) => a + b, 0) / fillRates.length).toFixed(2)) : 0;

    return {
      page_id: page.key || page.slug || `page-${idx}`,
      source_url: null, // Salt-Basin-owned source; no HTTP origin to record
      canonical_url: canonicalBase ? `${canonicalBase}/${page.slug || ''}`.replace(/\/+$/, '') || canonicalBase : (page.slug ?? ''),
      page_title: page.name || page.title || page.slug || page.key || '(untitled)',
      page_type: null, // assigned in Phase 5 (Page Intelligence), not inferred here
      navigation_level: null, // requires the real nav config (config_state admin_nav), out of this adapter's scope
      parent_page_id: null,
      child_page_ids: [],
      heading_structure: headingStructure,
      content_blocks: sections.map((s) => ({
        section_id: s.id,
        section_type: s.type,
        status: s.status ?? null,
        field_keys: s.fields ? Object.keys(s.fields) : [],
        has_field_meta: Boolean(s.fieldMeta && Object.keys(s.fieldMeta).length),
      })),
      CTAs: ctas,
      media_assets: [], // no dedicated media-field convention found yet; revisit once Phase 6 inspects block-by-block asset bindings
      structured_data: null, // no page-level SEO/structured-data config surface found in Phase 1 inspection
      SEO_metadata: null,
      inferred_audiences: null,
      inferred_page_purpose: null,
      inferred_primary_message: null,
      inferred_secondary_messages: null,
      duplication_score: sections.length ? Number((duplicateCount / Math.max(pages.length - 1, 1)).toFixed(2)) : 0,
      content_depth: sections.reduce((sum, s) => sum + measureContentDepth(s.fields), 0),
      content_confidence: avgFillRate,
      last_observed: Date.now(),
      source_hash: sourceHash ?? contentHash(page),
    };
  });
}
