// The starter content a brand-new member sees when they sign up. Same block
// shape as the main site so the public profile renderer can re-use the block
// library.

export function defaultMemberProfile({ displayName, email }) {
  const name = displayName || email.split('@')[0];
  return {
    version: 1,
    profile: {
      displayName: name,
      title: 'Strategic Operator',
      tagline: 'Add your one-line positioning here.',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          name: 'Hero',
          status: 'live',
          bg: 'navy',
          fields: {
            eyebrow: 'Salt Basin Net Works · Operator Profile',
            heading: name,
            subtitle: 'Add your one-line positioning',
            concept:
              'A short paragraph about what you do, who you do it for, and the outcomes you create. Edit this in your member dashboard.',
            cta1: 'Get in Touch',
            cta1Link: '#contact',
            platformLine: 'This profile is hosted on Salt Basin Net Works.',
          },
        },
        {
          id: 'domains',
          type: 'domains',
          name: 'Domains of Expertise',
          status: 'live',
          bg: 'ivory',
          fields: {
            eyebrow: 'How I work',
            heading: 'Domains of Expertise',
            intro: 'List the 3–8 capability areas you sell into.',
            d1Title: 'Domain 1',
            d1Desc: 'Short description of how you create value here.',
            d2Title: 'Domain 2',
            d2Desc: 'Short description of how you create value here.',
            d3Title: 'Domain 3',
            d3Desc: 'Short description of how you create value here.',
          },
        },
        {
          id: 'resume',
          type: 'resume',
          name: 'Resume',
          status: 'live',
          bg: 'ivory',
          fields: {
            heading: 'Professional Background',
            intro: 'A short framing paragraph for your career.',
            role1: 'Most recent role — Title (dates)',
            role1Desc: 'One-paragraph summary of the work and outcomes.',
            role2: 'Previous role — Title (dates)',
            role2Desc: 'One-paragraph summary.',
          },
        },
        {
          id: 'contact',
          type: 'contact',
          name: 'Contact',
          status: 'live',
          bg: 'linen',
          fields: {
            eyebrow: 'Contact',
            heading: 'Reach out',
            intro: 'Best ways to get in touch.',
            location: 'City, State',
          },
        },
      ],
    },
  };
}
