// Shared, framework-free SEO tag builder. Imported directly by both the
// server (Express meta-injection middleware) and the client (useSeoHead
// hook) — same cross-import pattern already used for
// src/components/PublicSite.jsx importing server/data/defaultSite.js.
//
// `page.seo` is an optional, additive key on page objects
// (`{ title, description, canonical, ogImage, noIndex }`). Every field is
// optional — pages that never set it (i.e. every page that exists today)
// get plain, sane fallback tags computed here.

const DEFAULT_SITE_NAME = 'Salt Basin Net Works';

export function buildSeoTags(page, { baseUrl = '', pathname = '/', siteName = DEFAULT_SITE_NAME } = {}) {
  const isHome = !page?.slug;
  const seo = page?.seo || {};
  const title = seo.title || (isHome ? siteName : `${page?.name || 'Page'} | ${siteName}`);
  const description = seo.description || '';
  const canonical = seo.canonical || `${baseUrl}${pathname}`;
  const ogImage = seo.ogImage || '';
  const noIndex = !!seo.noIndex;

  const jsonLd = isHome
    ? { '@context': 'https://schema.org', '@type': 'Organization', name: siteName, url: baseUrl || canonical }
    : { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: canonical };

  return { title, description, canonical, ogImage, noIndex, jsonLd, isHome };
}

function escapeHtmlAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Builds the <meta>/<link>/<script> block this feature owns, each tagged
// data-seo-managed so it's unambiguous which head tags came from this system.
function buildHeadFragment(tags) {
  const lines = [`<title>${escapeHtmlAttr(tags.title)}</title>`];
  if (tags.description) lines.push(`<meta name="description" content="${escapeHtmlAttr(tags.description)}" data-seo-managed="true">`);
  if (tags.noIndex) lines.push(`<meta name="robots" content="noindex,nofollow" data-seo-managed="true">`);
  lines.push(`<link rel="canonical" href="${escapeHtmlAttr(tags.canonical)}" data-seo-managed="true">`);
  lines.push(`<meta property="og:title" content="${escapeHtmlAttr(tags.title)}" data-seo-managed="true">`);
  if (tags.description) lines.push(`<meta property="og:description" content="${escapeHtmlAttr(tags.description)}" data-seo-managed="true">`);
  lines.push(`<meta property="og:url" content="${escapeHtmlAttr(tags.canonical)}" data-seo-managed="true">`);
  lines.push(`<meta property="og:type" content="website" data-seo-managed="true">`);
  if (tags.ogImage) {
    lines.push(`<meta property="og:image" content="${escapeHtmlAttr(tags.ogImage)}" data-seo-managed="true">`);
    lines.push(`<meta name="twitter:card" content="summary_large_image" data-seo-managed="true">`);
  } else {
    lines.push(`<meta name="twitter:card" content="summary" data-seo-managed="true">`);
  }
  lines.push(`<script type="application/ld+json" data-seo-managed="true">${JSON.stringify(tags.jsonLd)}</script>`);
  return lines.join('\n    ');
}

// Replaces the static <title>...</title> in the built index.html with the
// per-page title, and inserts the rest of the managed tags right after it.
// Only ever called against the pristine build output (re-read fresh from
// disk per request path is avoided via the caller's own cache), so there is
// never a previous data-seo-managed block to remove first.
export function injectSeoIntoHtml(html, tags) {
  const fragment = buildHeadFragment(tags);
  if (/<title>[\s\S]*?<\/title>/.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/, fragment);
  }
  return html.replace('</head>', `    ${fragment}\n  </head>`);
}

export { DEFAULT_SITE_NAME };
