// Resume density / white-space engine (layer 4, resume-type outputs only).
// Deterministic line-estimation so a rendered resume never has dead
// whitespace: sections marked `expandable` in the layer4 config pull in more
// Career Master detail (extra job bullets, extra skill rows) when the page
// has room, and collapse toward their floor when it doesn't. Fixed
// (non-expandable) layer1/layer4 content is never touched.

// Matches the resume output's `0.6in` margin / 14px base (see
// outputBlocks.js renderTemplateToHtml + Output.jsx ResumeOutput). Letter
// page = 11in tall; 0.6in top+bottom margin leaves 9.8in of content at
// ~14px * 1.4 line-height (~19.6px/line, 96dpi) => ~48 lines per page.
export const CHARS_PER_LINE = 95; // Georgia serif at resume body width (~6.7in)
const PAGE_HEIGHT_IN = 11 - 2 * 0.6;
const LINE_HEIGHT_PX = 14 * 1.4;
export const LINES_PER_PAGE = Math.floor((PAGE_HEIGHT_IN * 96) / LINE_HEIGHT_PX);

// Rough per-block-type line cost, calibrated against outputBlocks.js's
// renderBlockToHtml output for each type.
const FIXED_LINE_COST = {
  'page-header': 3,
  'color-band': 0.3,
  'section-label': 1.5,
  hr: 0.5,
  spacer: 0.5,
  'contact-line': 1,
  'key-value': 1,
  'stat-cards': 3,
  'capacity-gauge': 4,
  'bar-chart-h': 0,   // computed from row count, see below
  'bar-chart-v': 4,
  'venn-overlap': 0,  // computed from row count
  'cert-badges': 0,   // computed from item count
  'tool-usage-snapshot': 0, // computed from row count
};

function wrapLines(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(String(text).length / CHARS_PER_LINE));
}

export function estimateBlockLines(block, ctx = {}) {
  const type = block.type;
  const p = block.props || {};

  if (type === 'body' || type === 'heading' || type === 'callout' || type === 'herq-question') {
    return wrapLines(p.text);
  }
  if (type === 'bullet-list') {
    return (p.items || []).reduce((sum, item) => sum + wrapLines(item), 0);
  }
  if (type === 'experience-block') {
    return 2 + (p.bullets || []).reduce((sum, b) => sum + wrapLines(b), 0);
  }
  if (type === 'two-column') {
    return Math.max(wrapLines(p.leftText), wrapLines(p.rightText)) + 1;
  }
  if (type === 'exec-kpi-dashboard') {
    return 3 + Math.ceil((ctx.capabilityMeters?.length || 0) * 0.6);
  }
  if (type === 'bar-chart-h' || type === 'venn-overlap' || type === 'tool-usage-snapshot') {
    const catalog = ctx.rollupCatalog || {};
    const rowCount = type === 'bar-chart-h'
      ? (catalog.staticRollups || []).filter((r) => !p.sourceKey || r.key.startsWith(p.sourceKey)).length
      : type === 'venn-overlap'
        ? Math.min(6, (catalog.overlaps || []).length)
        : (catalog.toolUsage || []).filter((t) => t.roleCount > 0).slice(0, 12).length;
    return 1 + rowCount * 0.6;
  }
  if (type === 'cert-badges') {
    const count = (ctx.rollupCatalog?.certBadges || []).reduce((s, g) => s + g.items.length, 0);
    return 1 + Math.ceil(count / 3);
  }
  return FIXED_LINE_COST[type] ?? 1;
}

function totalLines(sections, master, ctx) {
  return sections.reduce((sum, s) => sum + estimateBlockLines(s.block || s, ctx), 0);
}

// Given the assembled layer4 blocks (already expanded to `density.minLines`)
// and the target page capacity, expand `expandable` sections toward
// `density.maxLines` (pulling more career_jobs.keyMetrics / career_skills
// rows in) if there's room, or collapse toward `minLines` — dropping the
// lowest-priority layer3 items first — if the content overflows. Returns the
// same sections array with each block's content volume adjusted in place.
export function fitSectionsToPage(sections, targetLines = LINES_PER_PAGE, master = {}, ctx = {}) {
  let estimated = totalLines(sections, master, ctx);
  const expandable = sections.filter((s) => s.density?.expandable);

  // Underfilled: pull additional detail into expandable sections until we
  // approach capacity or every expandable section hits its maxLines ceiling.
  let guard = 0;
  while (estimated < targetLines - 2 && expandable.some((s) => !s._atMax) && guard++ < 200) {
    for (const s of expandable) {
      const min = s.density?.minLines ?? 0;
      const max = s.density?.maxLines ?? min + 6;
      const current = estimateBlockLines(s.block || s, ctx);
      if (current >= max) { s._atMax = true; continue; }
      s.expansionLevel = (s.expansionLevel || 0) + 1;
      estimated += 1;
      if (estimated >= targetLines - 2) break;
    }
  }

  // Overfilled: collapse expandable sections toward their floor before
  // touching anything fixed.
  guard = 0;
  while (estimated > targetLines + 2 && expandable.some((s) => (s.expansionLevel || 0) > 0) && guard++ < 200) {
    for (const s of expandable) {
      if ((s.expansionLevel || 0) <= 0) continue;
      s.expansionLevel -= 1;
      estimated -= 1;
      if (estimated <= targetLines + 2) break;
    }
  }

  return { sections, estimatedLines: estimated, targetLines };
}
