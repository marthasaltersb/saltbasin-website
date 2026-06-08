// Default member-level config. Includes brand colors they can override on
// their own profile, social handles, opt-in for the Salt Basin home page Net
// Works banner, and a placeholder for their BYO Anthropic API key (used by
// the Config Agent once that ships).

export function defaultMemberConfig({ displayName, email }) {
  return {
    site: {
      tagline: 'Strategic Operator',
      domain: '',
      ownerName: displayName || (email || '').split('@')[0] || 'Operator',
    },
    // Brand colors override the Salt Basin defaults on this member's profile
    // pages only. Keys map 1:1 to the --sb-* CSS vars so we can apply them via
    // an inline <style> block at the top of the profile route.
    brand: {
      primary: '#1B2A3B',   // --sb-navy
      accent:  '#C4843A',   // --sb-gold
      ink:     '#F5F0E8',   // --sb-cream
      paper:   '#FBF6F0',   // --sb-ivory
    },
    social: {
      linkedin: { label: 'LinkedIn', on: false, url: '', color: '#0A66C2' },
      x:        { label: 'X',        on: false, url: '', color: '#000000' },
      github:   { label: 'GitHub',   on: false, url: '', color: '#181717' },
      email:    { label: 'Email',    on: false, url: '', color: '#C4843A' },
    },
    // Salt Basin home page banner opt-in. When `displayOnHome` is true, this
    // member shows up in the Net Works sliding banner under Betsy's About
    // section with `homeLogoUrl` + `homeBlurb`.
    featured: {
      displayOnHome: false,
      homeLogoUrl: '',     // upload-friendly URL; falls back to initials chip
      homeBlurb: '',       // 1–2 sentences shown on the card
      homeCompanyName: '', // optional org / brand name displayed under the logo
    },
    // Named resume presets. Each preset is { id, name, isDefault, sections[] }
    // where sections is an array of { pageKey, sectionId, sectionName }.
    // The preset marked isDefault controls what shows on the public About page.
    // Members create as many named versions as they need (Executive, Technical, etc.)
    resumePresets: [],
    // BYO Anthropic key for the Config Agent (the in-admin Claude-powered
    // editor). Stored encrypted in production; for now plain TEXT so the
    // local dev flow works. Never returned in publicConfig().
    integrations: {
      anthropicKey: '',
      anthropicModel: 'claude-sonnet-4-5',
    },
  };
}
