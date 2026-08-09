import { describe, test, expect } from '@jest/globals';
import { buildSeoTags } from './seo.js';

describe('buildSeoTags', () => {
  test('falls back to the site name for the home page with no seo block', () => {
    const tags = buildSeoTags(null, { baseUrl: 'https://saltbasin.net' });
    expect(tags.title).toBe('Salt Basin Net Works');
    expect(tags.isHome).toBe(true);
    expect(tags.jsonLd['@type']).toBe('Organization');
  });

  test('falls back to "<page name> | <site name>" for a non-home page with no seo block', () => {
    const page = { name: 'Services', slug: 'services' };
    const tags = buildSeoTags(page, { baseUrl: 'https://saltbasin.net', pathname: '/services' });
    expect(tags.title).toBe('Services | Salt Basin Net Works');
    expect(tags.isHome).toBe(false);
    expect(tags.canonical).toBe('https://saltbasin.net/services');
    expect(tags.jsonLd['@type']).toBe('WebPage');
  });

  test('an explicit page.seo block overrides every fallback', () => {
    const page = {
      name: 'Services',
      slug: 'services',
      seo: { title: 'Custom Title', description: 'Custom description', noIndex: true, ogImage: 'https://x/img.png' },
    };
    const tags = buildSeoTags(page, { baseUrl: 'https://saltbasin.net', pathname: '/services' });
    expect(tags.title).toBe('Custom Title');
    expect(tags.description).toBe('Custom description');
    expect(tags.noIndex).toBe(true);
    expect(tags.ogImage).toBe('https://x/img.png');
  });
});
