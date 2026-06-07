// Default site a brand-new member sees when they sign up. Mirrors the shape
// of defaultSite.js (multi-page, sections with type/status/bg/fields) so the
// same admin shell and the same block library can render it.
//
// Members start with three pages — Home, About, Contact — each with a small
// set of editable sections. They can add/remove/reorder freely.

export function defaultMemberSite({ displayName, email }) {
  const name = displayName || (email || '').split('@')[0] || 'Operator';
  return {
    version: 1,
    pages: {
      home: {
        key: 'home',
        name: 'Home',
        slug: '',
        type: 'standard',
        status: 'live',
        order: 0,
        sections: [
          {
            id: 'home-hero',
            type: 'hero',
            name: 'Hero',
            status: 'live',
            bg: 'navy',
            fields: {
              eyebrow: 'Salt Basin Net Works · Operator Profile',
              heading: name,
              subtitle: 'Strategic Operator',
              concept:
                'A short paragraph about what you do, who you do it for, and the outcomes you create. Edit this in your admin dashboard.',
              cta1: 'Get in Touch',
              cta1Link: '#home-contact',
              cta2: 'View Resume',
              cta2Link: '/u/__slug__/about',
              platformLine: 'This profile is hosted on Salt Basin Net Works.',
            },
          },
          {
            id: 'home-domains',
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
            id: 'home-services',
            type: 'cards',
            name: 'How I Help',
            status: 'live',
            bg: 'linen',
            fields: {
              eyebrow: 'Engagement shapes',
              heading: 'How I Help',
              intro: 'Common engagement shapes I run.',
              card1Title: 'Diagnostic Sprint',
              card1Desc: '2-week assessment of your current state with a phased roadmap.',
              card2Title: 'Embedded Operator',
              card2Desc: 'Hands-on execution against a defined transformation.',
              card3Title: 'Advisory Retainer',
              card3Desc: 'Senior advisor on call for executive decisions.',
            },
          },
          {
            id: 'home-contact',
            type: 'contact',
            name: 'Contact',
            status: 'live',
            bg: 'cream',
            fields: {
              eyebrow: 'Contact',
              heading: 'Reach out',
              intro: 'Best ways to get in touch.',
              location: 'City, State',
            },
          },
        ],
      },
      about: {
        key: 'about',
        name: 'About',
        slug: 'about',
        type: 'standard',
        status: 'live',
        order: 1,
        sections: [
          {
            id: 'about-hero',
            type: 'hero',
            name: 'About Hero',
            status: 'live',
            bg: 'navy',
            fields: {
              eyebrow: 'About',
              heading: `About ${name}`,
              subtitle: 'Background and approach',
              concept: 'A short narrative paragraph about your career arc and what drives you.',
            },
          },
          {
            id: 'about-resume',
            type: 'resume',
            name: 'Resume',
            status: 'live',
            bg: 'ivory',
            fields: {
              heading: 'Professional Background',
              intro: 'A short framing paragraph for your career.',
              // roles is a dynamic add/remove list. Each entry: title, company,
              // start (YYYY-MM-DD or freeform like "Jun 2022"), end (or current=true),
              // description (one paragraph). Add as many as your career needs.
              roles: [
                {
                  title: 'Most recent role',
                  company: 'Company name',
                  start: '',
                  end: '',
                  current: true,
                  description: 'One-paragraph summary of the work and outcomes. Edit this in your admin.',
                },
                {
                  title: 'Previous role',
                  company: 'Company name',
                  start: '',
                  end: '',
                  current: false,
                  description: 'One-paragraph summary.',
                },
              ],
            },
          },
        ],
      },
      contact: {
        key: 'contact',
        name: 'Contact',
        slug: 'contact',
        type: 'standard',
        status: 'live',
        order: 2,
        sections: [
          {
            id: 'contact-hero',
            type: 'hero',
            name: 'Contact Hero',
            status: 'live',
            bg: 'navy',
            fields: {
              eyebrow: 'Contact',
              heading: "Let's talk",
              subtitle: 'How to reach me',
            },
          },
          {
            id: 'contact-form',
            type: 'contact',
            name: 'Contact Form',
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
    },
  };
}
