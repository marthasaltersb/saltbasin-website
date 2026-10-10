// Document header.contact may be a string or an array of entries; always render one string.
export function contactText(c) {
  return Array.isArray(c) ? c.filter(Boolean).join(' · ') : (c || '');
}
