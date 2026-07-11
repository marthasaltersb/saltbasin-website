// Shared personal-vs-custom email domain classification. Used by
// leads.js (/actor-context) and bestyStaff.js (the convert_lead_to_member
// conversation flow) so both surfaces agree on what counts as a personal
// domain — previously each had its own inline copy of this Set.
const CONSUMER_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

// Returns 'consumer' | 'custom' | null (null when no email/domain is given).
export function classifyEmailDomain(email) {
  const domain = email?.split('@')[1]?.toLowerCase() || null;
  if (!domain) return null;
  return CONSUMER_DOMAINS.has(domain) ? 'consumer' : 'custom';
}

export function emailDomainOf(email) {
  return email?.split('@')[1]?.toLowerCase() || null;
}
