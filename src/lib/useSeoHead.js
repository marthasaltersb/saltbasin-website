import { useEffect } from 'react';
import { buildSeoTags } from '../../server/lib/seo.js';

// Same cross-import pattern as src/components/PublicSite.jsx importing
// server/data/defaultSite.js — server/lib/seo.js has no Node-specific
// dependencies, so it bundles fine into the client too.

function upsertTag(tagName, matchAttrs, setAttrs) {
  const selector = `${tagName}[data-seo-managed="true"]${Object.entries(matchAttrs)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join('')}`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    el.setAttribute('data-seo-managed', 'true');
    Object.entries(matchAttrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  Object.entries(setAttrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Client-side counterpart to server/lib/seoMiddleware.js. Updates the tab
// title and <head> tags on route change so the client-rendered app stays in
// sync with what the server injected on first load (search-engine crawlers
// that execute JS see this; link-unfurling bots rely on the server-rendered
// version instead — see server/lib/seoMiddleware.js).
export function useSeoHead(page, { siteName } = {}) {
  useEffect(() => {
    if (!page) return;
    const tags = buildSeoTags(page, {
      baseUrl: window.location.origin,
      pathname: window.location.pathname,
      siteName,
    });

    document.title = tags.title;

    if (tags.description) {
      upsertTag('meta', { name: 'description' }, { content: tags.description });
    }
    if (tags.noIndex) {
      upsertTag('meta', { name: 'robots' }, { content: 'noindex,nofollow' });
    }
    upsertTag('link', { rel: 'canonical' }, { href: tags.canonical });
    upsertTag('meta', { property: 'og:title' }, { content: tags.title });
    if (tags.description) {
      upsertTag('meta', { property: 'og:description' }, { content: tags.description });
    }
    upsertTag('meta', { property: 'og:url' }, { content: tags.canonical });
    if (tags.ogImage) {
      upsertTag('meta', { property: 'og:image' }, { content: tags.ogImage });
    }

    const script = upsertTag('script', { type: 'application/ld+json' }, {});
    script.textContent = JSON.stringify(tags.jsonLd);
  }, [page, siteName]);
}
