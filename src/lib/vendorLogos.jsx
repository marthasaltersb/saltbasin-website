import React from 'react';

// Vendor logo registry — one chip per vendor system, keyed by the same `id`
// used in server/lib/oauthProviders.js. Chips use each vendor's real public
// brand color as a monogram, not recreated logo artwork — safer to maintain
// and avoids reproducing trademarked assets pixel-for-pixel.
//
// Any component that renders a vendor by id (integration lists, integration
// pointer diagrams, "connect a system" pickers) should look it up here
// instead of hardcoding a color/initial inline.
export const VENDOR_LOGOS = {
  microsoft:  { label: 'Microsoft',  color: '#00A4EF', mono: 'M' },
  salesforce: { label: 'Salesforce', color: '#00A1E0', mono: 'S' },
  quickbooks: { label: 'QuickBooks', color: '#2CA01C', mono: 'Q' },
  linkedin:   { label: 'LinkedIn',   color: '#0A66C2', mono: 'in' },
  hubspot:    { label: 'HubSpot',    color: '#FF7A59', mono: 'H' },
  supabase:   { label: 'Supabase',   color: '#3ECF8E', mono: 'sb' },
  snowflake:  { label: 'Snowflake',  color: '#29B5E8', mono: '❄' },
  tableau:    { label: 'Tableau',    color: '#E62B1E', mono: 'T' },
  zuora:      { label: 'Zuora',      color: '#4A2E82', mono: 'Z' },
  dealhub:    { label: 'DealHub',    color: '#00B2A9', mono: 'D' },
  marketo:    { label: 'Marketo',    color: '#5C4C9F', mono: 'M' },
  sap:        { label: 'SAP',        color: '#0FAAFF', mono: 'SAP' },
  oracle:     { label: 'Oracle',     color: '#F80000', mono: 'O' },
  workday:    { label: 'Workday',    color: '#0875E1', mono: 'W' },
};

export function getVendorLogo(id) {
  return VENDOR_LOGOS[id] || null;
}

// <VendorLogo id="salesforce" size={28} /> — monogram chip. Pass
// `fallbackIcon`/`fallbackLabel` to degrade gracefully for vendors not yet in
// the registry (e.g. personal-account providers like Plaid, OpenAI) instead
// of rendering nothing.
export function VendorLogo({ id, size = 28, fallbackIcon, fallbackLabel }) {
  const vendor = getVendorLogo(id);
  if (!vendor) {
    return fallbackIcon ? (
      <span style={{ fontSize: size * 0.6, width: size, textAlign: 'center', display: 'inline-block' }} title={fallbackLabel}>
        {fallbackIcon}
      </span>
    ) : null;
  }
  return (
    <span
      title={vendor.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: vendor.color,
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.4,
        fontFamily: 'Georgia, serif',
        flexShrink: 0,
      }}
    >
      {vendor.mono}
    </span>
  );
}
