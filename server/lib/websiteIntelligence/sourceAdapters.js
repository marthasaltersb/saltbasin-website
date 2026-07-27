// Website Intelligence Engine — Source Adapter layer (master prompt §III).
// Phase 2 of .claude/skills/salt-basin-website-intelligence. Every downstream
// model (page inventory, narrative model, architecture proposal) reads a
// website through one of these adapters rather than touching site_state /
// member_sites rows directly, so the source's authority and freshness travel
// with the content instead of being lost at the first transformation.
//
// Per the skill's non-negotiables: "crawling" this repo's own site means
// reading site_state/member_sites, not scraping HTTP. An HTTP-based
// PUBLIC_WEBSITE adapter is out of scope until an external (non-Salt-Basin)
// site actually needs analysis.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../../db.js';

export const SOURCE_TYPES = Object.freeze({
  PUBLIC_WEBSITE: 'PUBLIC_WEBSITE',
  CMS: 'CMS',
  DOCUMENT: 'DOCUMENT',
  BRAND_GUIDE: 'BRAND_GUIDE',
  PRODUCT_SPEC: 'PRODUCT_SPEC',
  SALES_CONTENT: 'SALES_CONTENT',
  CASE_STUDY: 'CASE_STUDY',
  STRUCTURED_DATA: 'STRUCTURED_DATA',
  ORGANIZATION_CONFIGURATION: 'ORGANIZATION_CONFIGURATION',
  MEMBER_CONFIGURATION: 'MEMBER_CONFIGURATION',
});

// SOURCE_AUTHORITY is this engine's own ranking, not part of the master
// prompt's literal field list — needed because §III says "do not treat all
// source content as equally authoritative" without specifying the scale.
// GOVERNED = the platform's own published record of itself (site_state,
// member_sites). DECLARED = organization/brand config the org explicitly
// set (foundation doc, brand.css). INFERRED is reserved for anything a
// future adapter derives rather than reads verbatim (e.g. an HTTP crawl of
// an external site) — nothing in this repo produces INFERRED yet.
export const SOURCE_AUTHORITY = Object.freeze({
  GOVERNED: 'GOVERNED',
  DECLARED: 'DECLARED',
  INFERRED: 'INFERRED',
});

function contentHash(value) {
  const json = typeof value === 'string' ? value : JSON.stringify(value);
  return crypto.createHash('sha256').update(json).digest('hex').slice(0, 16);
}

/**
 * Builds a WebsiteSourceAdapter record per master prompt §III's required
 * field list. `content` is the raw payload this record describes — kept
 * separate from any generated configuration per §III's closing rule.
 */
function makeSourceRecord({ sourceType, sourceLocation, organizationId = null, sourceAuthority, effectiveDate, content, visibilityClassification, evidenceReference = null, version = null }) {
  return {
    source_id: `${sourceType.toLowerCase()}:${sourceLocation}`,
    source_type: sourceType,
    source_location: sourceLocation,
    organization_id: organizationId,
    source_authority: sourceAuthority,
    effective_date: effectiveDate,
    observed_timestamp: Date.now(),
    content_hash: contentHash(content),
    version,
    evidence_reference: evidenceReference,
    visibility_classification: visibilityClassification,
    content,
  };
}

// Live admin API returns site_state.pages as a keyed object (versioned by
// page key); CLAUDE.md's documented shape is an array. Both are real —
// normalize here once so every downstream consumer (page inventory,
// narrative model) sees a flat array regardless of which shape a given row
// happens to hold. Confirmed against the real published row 2026-07-16:
// site_state.pages was a keyed object, not an array.
export function normalizePages(pagesValue) {
  if (Array.isArray(pagesValue)) return pagesValue;
  if (pagesValue && typeof pagesValue === 'object') return Object.values(pagesValue);
  return [];
}

/**
 * PUBLIC_WEBSITE adapter for Betsy's own admin site (saltbasin.net).
 * kind: 'draft' | 'published'. Reads server/db.js's site_state table
 * directly — this *is* the "existing website" per the skill's scoping
 * decision, not something to crawl over HTTP.
 */
export async function adaptSaltBasinSiteState(kind = 'published') {
  const row = await db.prepare(`SELECT data, updated_at FROM site_state WHERE id = $1`).get(kind);
  if (!row) return null;
  const data = JSON.parse(row.data);
  const pages = normalizePages(data.pages);
  return {
    record: makeSourceRecord({
      sourceType: SOURCE_TYPES.PUBLIC_WEBSITE,
      sourceLocation: `site_state:${kind}`,
      sourceAuthority: SOURCE_AUTHORITY.GOVERNED,
      effectiveDate: row.updated_at,
      content: data,
      visibilityClassification: kind === 'published' ? 'public' : 'internal',
      version: data.version ?? null,
    }),
    pages,
  };
}

/**
 * MEMBER_CONFIGURATION adapter for a single member's personal-brand site
 * (member_sites, scoped by user_id). Returns null (not an empty inventory)
 * when the member has never published — callers must distinguish "no site"
 * from "empty site" rather than silently treating both the same way.
 */
export async function adaptMemberSiteState(userId, kind = 'published') {
  const row = await db.prepare(
    `SELECT data, updated_at FROM member_sites WHERE user_id = $1 AND kind = $2`
  ).get(userId, kind);
  if (!row) return null;
  const data = JSON.parse(row.data);
  const pages = normalizePages(data.pages);
  return {
    record: makeSourceRecord({
      sourceType: SOURCE_TYPES.MEMBER_CONFIGURATION,
      sourceLocation: `member_sites:${userId}:${kind}`,
      organizationId: userId,
      sourceAuthority: SOURCE_AUTHORITY.GOVERNED,
      effectiveDate: row.updated_at,
      content: data,
      visibilityClassification: kind === 'published' ? 'public' : 'internal',
      version: data.version ?? null,
    }),
    pages,
  };
}

/**
 * ORGANIZATION_CONFIGURATION adapter for the Foundation Source of Truth doc
 * — the authoritative record of what's real vs. aspirational for Salt
 * Basin. Every narrative/claim model downstream (Phase 3+) must reconcile
 * against this source, never contradict it.
 */
export function adaptFoundationSourceOfTruth(repoRoot = process.cwd()) {
  const filePath = path.join(repoRoot, 'docs', 'salt-basin-foundation-source-of-truth.md');
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const stat = fs.statSync(filePath);
  return makeSourceRecord({
    sourceType: SOURCE_TYPES.ORGANIZATION_CONFIGURATION,
    sourceLocation: 'docs/salt-basin-foundation-source-of-truth.md',
    sourceAuthority: SOURCE_AUTHORITY.DECLARED,
    effectiveDate: stat.mtimeMs,
    content,
    visibilityClassification: 'internal',
  });
}

/**
 * BRAND_GUIDE adapter for the approved brand token system. Extracts the
 * `--sb-*` custom property declarations from brand.css so the Visual
 * Direction Engine (Phase 7) can cite APPROVED BRAND VALUE against real
 * tokens instead of guessing at color names.
 */
export function adaptBrandGuide(repoRoot = process.cwd()) {
  const filePath = path.join(repoRoot, 'src', 'brand.css');
  if (!fs.existsSync(filePath)) return null;
  const css = fs.readFileSync(filePath, 'utf8');
  const stat = fs.statSync(filePath);
  const tokenPattern = /--sb-[a-z0-9-]+\s*:\s*[^;]+;/gi;
  const tokens = (css.match(tokenPattern) || []).map((decl) => {
    const [name, value] = decl.replace(/;$/, '').split(/:\s*/);
    return { name: name.trim(), value: value.trim() };
  });
  return {
    record: makeSourceRecord({
      sourceType: SOURCE_TYPES.BRAND_GUIDE,
      sourceLocation: 'src/brand.css',
      sourceAuthority: SOURCE_AUTHORITY.DECLARED,
      effectiveDate: stat.mtimeMs,
      content: tokens,
      visibilityClassification: 'internal',
    }),
    tokens,
  };
}
