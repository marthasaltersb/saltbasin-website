// Curated starter templates for member operators.
//
// Each template is a complete starting point: brand kit (colors), suggested
// tagline, and a full pages_preset that matches member_sites.draft shape.
// Members apply a template, then edit anything. Templates are "starting
// points" per Betsy's choice — nothing is locked after apply.
//
// Adding a new template: append to TEMPLATES with a unique slug. The seeder
// (server/routes/memberTemplates.js POST /seed) is idempotent — slugs
// already present are skipped.

export function memberTemplatesSeed() {
  return TEMPLATES;
}

const TEMPLATES = [
  // ────────────────────────── Operator Profile ──────────────────────────
  {
    slug: 'operator-profile',
    name: 'Operator Profile',
    archetype: 'operator',
    tagline: 'Strategic Operator · For senior consultants between chapters',
    description:
      'The Salt Basin default shape, tuned for a senior lead-to-cash, RevOps, or finance-systems operator. Founder-first hero, domains of expertise, services, contact. Polished, navy + gold palette.',
    previewImageUrl: '',
    brandKit: {
      primary: '#1B2A3B',
      accent:  '#C4843A',
      ink:     '#F5F0E8',
      paper:   '#FBF6F0',
    },
    sortOrder: 10,
    pagesPreset: {
      version: 1,
      pages: {
        home: {
          key: 'home', name: 'Home', slug: '', type: 'standard', status: 'live', order: 0,
          sections: [
            { id: 'home-hero', type: 'hero', name: 'Hero', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Salt Basin Net Works · Operator Profile',
              heading: '{NAME}',
              subtitle: 'Strategic Operator',
              concept: 'Senior {DOMAIN} operator. {N} years building {OUTCOME} for {INDUSTRY} companies. Currently {STATUS}.',
              cta1: 'View Resume', cta1Link: '/u/{SLUG}/about',
              cta2: 'Get in Touch', cta2Link: '#home-contact',
              platformLine: 'This profile is hosted on Salt Basin Net Works.',
            }},
            { id: 'home-domains', type: 'domains', name: 'Domains of Expertise', status: 'live', bg: 'ivory', fields: {
              eyebrow: 'How I work',
              heading: 'Domains of Expertise',
              intro: 'The capability areas I sell into.',
              d1Title: 'Quote-to-Revenue (Q2R)', d1Desc: 'CPQ design, billing architecture, revenue recognition.',
              d2Title: 'RevOps Transformation', d2Desc: 'Pipeline, forecasting, GTM tech stack alignment.',
              d3Title: 'Finance Systems', d3Desc: 'NetSuite, Adaptive Insights, financial close architecture.',
            }},
            { id: 'home-services', type: 'cards', name: 'How I Help', status: 'live', bg: 'linen', fields: {
              eyebrow: 'Engagement shapes',
              heading: 'How I Help',
              intro: 'Three common shapes I run.',
              card1Title: 'Diagnostic Sprint', card1Desc: '2-week assessment with a phased roadmap.',
              card2Title: 'Embedded Operator', card2Desc: 'Hands-on execution against a defined transformation.',
              card3Title: 'Advisory Retainer', card3Desc: 'Senior advisor on call for executive decisions.',
            }},
            { id: 'home-contact', type: 'contact', name: 'Contact', status: 'live', bg: 'cream', fields: {
              eyebrow: 'Contact', heading: 'Reach out', intro: 'Best ways to get in touch.',
              location: 'City, State',
            }},
          ],
        },
        about: {
          key: 'about', name: 'About', slug: 'about', type: 'standard', status: 'live', order: 1,
          sections: [
            { id: 'about-hero', type: 'hero', name: 'About Hero', status: 'live', bg: 'navy', fields: {
              eyebrow: 'About', heading: 'About {NAME}', subtitle: 'Background and approach',
              concept: 'A short narrative paragraph about your career arc and what drives you.',
            }},
            { id: 'about-resume', type: 'resume', name: 'Resume', status: 'live', bg: 'ivory', fields: {
              heading: 'Professional Background',
              intro: 'A short framing paragraph for your career.',
              role1: 'Most recent role — Title (dates)', role1Desc: 'One-paragraph summary of the work and outcomes.',
              role2: 'Previous role — Title (dates)', role2Desc: 'One-paragraph summary.',
              role3: 'Earlier role — Title (dates)', role3Desc: 'One-paragraph summary.',
            }},
          ],
        },
        contact: {
          key: 'contact', name: 'Contact', slug: 'contact', type: 'standard', status: 'live', order: 2,
          sections: [
            { id: 'contact-hero', type: 'hero', name: 'Contact Hero', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Contact', heading: "Let's talk", subtitle: 'How to reach me',
            }},
            { id: 'contact-form', type: 'contact', name: 'Contact Form', status: 'live', bg: 'linen', fields: {
              eyebrow: 'Contact', heading: 'Reach out', intro: 'Best ways to get in touch.',
              location: 'City, State',
            }},
          ],
        },
      },
    },
  },

  // ────────────────────────── Consulting Practice ──────────────────────────
  {
    slug: 'consulting-practice',
    name: 'Consulting Practice',
    archetype: 'consulting',
    tagline: 'For independent consultants with a named practice + services menu',
    description:
      'Service-led layout. Heroes the practice name and clear engagement shapes. Adds Case Studies and References pages. Slightly warmer palette (teal accent).',
    previewImageUrl: '',
    brandKit: {
      primary: '#1B2A3B',
      accent:  '#4A6670',
      ink:     '#F5F0E8',
      paper:   '#FBF6F0',
    },
    sortOrder: 20,
    pagesPreset: {
      version: 1,
      pages: {
        home: {
          key: 'home', name: 'Home', slug: '', type: 'standard', status: 'live', order: 0,
          sections: [
            { id: 'home-hero', type: 'hero', name: 'Practice Hero', status: 'live', bg: 'navy', fields: {
              eyebrow: '{PRACTICE_NAME}',
              heading: 'Senior consulting for {AUDIENCE}',
              subtitle: 'Trusted by founders and operators',
              concept: 'A focused practice helping {AUDIENCE} solve {PROBLEM}. {N} engagements delivered over {YEARS}.',
              cta1: 'See Services', cta1Link: '#home-services',
              cta2: 'Talk to me', cta2Link: '#home-contact',
            }},
            { id: 'home-services', type: 'services', name: 'Services', status: 'live', bg: 'ivory', fields: {
              eyebrow: 'How we engage',
              heading: 'Services',
              intro: 'Three engagement shapes, sized to fit.',
              s1Title: 'Diagnostic Sprint', s1Tag: '2 weeks · fixed fee', s1Desc: 'Rapid assessment + roadmap.', s1Cta: 'Inquire',
              s2Title: 'Embedded Operator', s2Tag: '8-12 weeks · monthly', s2Desc: 'Hands-on execution.', s2Cta: 'Inquire',
              s3Title: 'Advisory Retainer', s3Tag: 'Monthly · ongoing', s3Desc: 'Senior advisor on call.', s3Cta: 'Inquire',
            }},
            { id: 'home-cases', type: 'caseStudies', name: 'Case Studies', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Selected Work',
              heading: 'Case Studies',
              intro: 'Three engagements, told as situation → action → outcome.',
            }},
            { id: 'home-contact', type: 'contact', name: 'Contact', status: 'live', bg: 'cream', fields: {
              eyebrow: 'Contact', heading: "Let's talk",
              intro: 'I respond within 48 hours.', location: 'City, State',
            }},
          ],
        },
        about: {
          key: 'about', name: 'About', slug: 'about', type: 'standard', status: 'live', order: 1,
          sections: [
            { id: 'about-hero', type: 'aboutIntro', name: 'About / Intro', status: 'live', bg: 'navy', fields: {
              leftEyebrow: 'About', heading: '{NAME}', title: 'Principal',
              leftBlurb: 'A short narrative on what you do, who you do it for, and why.',
              cta1: 'View Resume', cta1Link: '/u/{SLUG}/resume',
              rightEyebrow: 'Practice Mission',
              missionHeading: 'How I work',
              missionBody: 'Two paragraphs on your philosophy and the kinds of engagements that fit.',
              bullet1: 'Senior expertise', bullet2: 'Outcome-led', bullet3: 'Practical',
            }},
            { id: 'about-timeline', type: 'timeline', name: 'Timeline', status: 'live', bg: 'ivory', fields: {
              heading: 'Career arc',
              intro: 'Click any role to expand.',
            }},
          ],
        },
        references: {
          key: 'references', name: 'References', slug: 'references', type: 'standard', status: 'live', order: 2,
          sections: [
            { id: 'ref-request', type: 'referencesRequest', name: 'References request', status: 'live', bg: 'cream', fields: {
              eyebrow: 'References',
              heading: 'Request to contact my references',
              intro: 'I protect references\' time. Tell me who you are and what perspective you\'re looking for.',
            }},
          ],
        },
        contact: {
          key: 'contact', name: 'Contact', slug: 'contact', type: 'standard', status: 'live', order: 3,
          sections: [
            { id: 'contact-form', type: 'contact', name: 'Contact', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Contact', heading: 'Get in touch',
              intro: 'Drop a note. I respond within 48 hours.', location: 'City, State',
            }},
          ],
        },
      },
    },
  },

  // ────────────────────────── Coach / Speaker ──────────────────────────
  {
    slug: 'coach-speaker',
    name: 'Coach / Speaker',
    archetype: 'coach',
    tagline: 'For coaches, advisors, and speakers building a personal brand',
    description:
      'Warmer, more personal layout. Heroes the human first. Includes testimonials, signature talks, and a booking-style contact form. Sage + gold palette.',
    previewImageUrl: '',
    brandKit: {
      primary: '#3D5A6C',
      accent:  '#C4843A',
      ink:     '#F5F0E8',
      paper:   '#FBF6F0',
    },
    sortOrder: 30,
    pagesPreset: {
      version: 1,
      pages: {
        home: {
          key: 'home', name: 'Home', slug: '', type: 'standard', status: 'live', order: 0,
          sections: [
            { id: 'home-hero', type: 'hero', name: 'Hero', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Coach · Speaker · Advisor',
              heading: '{NAME}',
              subtitle: 'Helping {AUDIENCE} {OUTCOME}',
              concept: 'One sentence on who you serve and the transformation they get.',
              cta1: 'Book a session', cta1Link: '#home-contact',
              cta2: 'See signature talks', cta2Link: '#home-talks',
            }},
            { id: 'home-talks', type: 'cards', name: 'Signature Talks', status: 'live', bg: 'ivory', fields: {
              eyebrow: 'Speaking',
              heading: 'Signature Talks',
              intro: 'The three keynotes I am known for.',
              card1Title: 'Talk one', card1Desc: 'Short framing.',
              card2Title: 'Talk two', card2Desc: 'Short framing.',
              card3Title: 'Talk three', card3Desc: 'Short framing.',
            }},
            { id: 'home-testimonials', type: 'twoCol', name: 'Testimonials', status: 'live', bg: 'linen', fields: {
              eyebrow: 'What people say',
              heading: 'Praise from past clients',
              subheading: 'Selected, not exhaustive',
              p1: '"A quote from a happy client about what shifted for them after our work." — Client name, role.',
              p2: '"Another quote, ideally specific and outcome-oriented." — Client name, role.',
            }},
            { id: 'home-contact', type: 'contact', name: 'Book a session', status: 'live', bg: 'cream', fields: {
              eyebrow: 'Booking', heading: "Let's talk",
              intro: 'Tell me a bit about what you are working on and I will reach out to set up a call.',
              location: 'Virtual + select cities',
            }},
          ],
        },
        about: {
          key: 'about', name: 'About', slug: 'about', type: 'standard', status: 'live', order: 1,
          sections: [
            { id: 'about-hero', type: 'aboutIntro', name: 'About / Intro', status: 'live', bg: 'navy', fields: {
              leftEyebrow: 'About', heading: '{NAME}', title: 'Coach · Speaker',
              leftBlurb: 'Your personal arc — what brought you here, who you serve, and what makes your perspective different.',
              cta1: 'Book a session', cta1Link: '/u/{SLUG}/contact',
              rightEyebrow: 'My Approach',
              missionHeading: 'How I work',
              missionBody: 'The philosophy underneath your practice. Two paragraphs.',
              bullet1: 'Client outcome 1', bullet2: 'Client outcome 2', bullet3: 'Client outcome 3',
            }},
          ],
        },
        contact: {
          key: 'contact', name: 'Contact', slug: 'contact', type: 'standard', status: 'live', order: 2,
          sections: [
            { id: 'contact-form', type: 'contact', name: 'Contact', status: 'live', bg: 'navy', fields: {
              eyebrow: 'Contact', heading: 'Reach out',
              intro: 'A few sentences inviting them to be specific.', location: 'Virtual + select cities',
            }},
          ],
        },
      },
    },
  },
];
