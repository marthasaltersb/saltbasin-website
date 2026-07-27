import React, { useEffect, useState } from 'react';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import PortfolioRequestPrompt from './PortfolioRequestFlow.jsx';
import { api } from '../lib/api.js';

const ventures = [
  {
    tag: 'Individual member platform',
    title: 'Salt Basin Net Works',
    mark: 'founder',
    text:
      'A Member World for turning canonical career evidence into configurable portfolios, targeted resume outputs, and a personal brand site—plus governed access to enterprise product simulations and operating-method experiences.',
  },
  {
    tag: 'Flagship enterprise platform',
    title: 'Salt Basin MRS',
    mark: 'engine',
    text:
      'Measurement Rendering Systems designs, builds, and maintains a client-specific Enterprise Ecosystem—a Salt Basin Net Work—by turning distributed evidence into a governed, visible operating model.',
  },
  {
    tag: 'Consumer intelligence product',
    title: 'SaltTide™',
    mark: 'hourglass',
    text:
      'Credit-card and unsecured-debt routing intelligence that connects timing, obligations, interest, rewards, cash context, and outcome paths instead of optimizing one transaction in isolation.',
  },
  {
    tag: 'Governed agent product',
    title: 'BestyStaff',
    mark: 'rings',
    text:
      'A policy-bounded agent architecture that carries Betsy’s intake, questioning, context, and operating patterns into reusable Member Staff and Channel Rod Staff configurations.',
  },
];

const method = [
  ['01', 'Understanding', 'Find the root cause across people, process, systems, data, incentives, and financial exposure.'],
  ['02', 'Rendering', 'Turn the diagnosis into a visible operating model, architecture, scorecard, or board-ready decision artifact.'],
  ['03', 'Measuring', 'Measure the configured change with traceable evidence, clean ownership, and reusable infrastructure for the next decision.'],
];

const capabilities = [
  ['Q2R Intelligence', 'Quote, contract, order, billing, revenue, renewal, and reporting handoffs.'],
  ['Executive Artifacts', 'Board summaries, operating dashboards, case studies, resumes, proposals, and print outputs.'],
  ['Agentic Operations', 'BestyStaff, governed memory, lead routing, safe-preview logic, and reusable operating agents.'],
  ['Architecture Systems', 'L3/L4 process maps, capability cards, scenario libraries, lineage, and evidence controls.'],
];

const engagements = [
  ['38B+', 'Semiconductor usage-based billing design'],
  ['9B', 'Industrial automation quote-to-revenue transformation'],
  ['615M', 'Healthcare IT revenue recognition and relisting support'],
  ['12+', 'Years across enterprise systems, GTM, finance, and transformation'],
];

const audiencePathways = [
  {
    id: 'individuals', eyebrow: 'For individuals', title: 'Build your Member Career World',
    text: 'Organize career evidence once, then project it into a navigable portfolio, targeted resumes, case studies, and an approved personal brand site. Explore enterprise product simulations from the same Member identity.',
    features: ['Canonical career evidence', 'Portfolio and case-study outputs', 'Role-targeted resume generation', 'Personal brand publishing', 'Enterprise simulation access'],
    actions: [
      { label: 'Build My Career Portfolio', href: '/signup', primary: true },
      { label: 'Generate a Resume', href: '/output/resume' },
      { label: 'Enter My Member World', href: '/member' },
    ],
  },
  {
    id: 'organizations', eyebrow: 'For organizations', title: 'Render the enterprise you actually operate',
    text: 'Use Salt Basin MRS and the HOS™ methodology to connect source evidence, definitions, Channel Rods, handoffs, financial exposure, and governed agents into one navigable Enterprise Ecosystem.',
    features: ['Enterprise Ecosystem rendering', 'DataBasin evidence normalization', 'Channel and Channel Rod lineage', 'Q2R and financial simulations', 'Policy-bounded agent workforce'],
    actions: [
      { label: 'Explore Salt Basin MRS', href: '/output/methodology', primary: true },
      { label: 'Run a Product Simulation', href: '/output/business-definition-experience' },
      { label: 'Talk with BestyStaff', href: '#bestystaff' },
    ],
  },
];

const explorerObjects = [
  {
    id: 'salttide',
    variant: 'hourglass',
    label: 'SaltTide™',
    heading: 'Consumer credit routing intelligence',
    text: 'A decision layer for credit-card and unsecured-debt paths that evaluates timing, obligations, interest, rewards, cash context, and downstream financial outcomes together.',
    chips: ['Credit Cards', 'Unsecured Debt', 'Timing', 'Routing'],
    href: '#ventures',
    preview: 'The buoyant-hourglass product layer for consumer financial routing, timing, and outcome health.',
    stat: 'B2C',
    statLabel: 'Intelligence product',
    positionClass: 'explorer-hourglass',
  },
  {
    id: 'mrs',
    variant: 'token',
    label: 'Salt Basin MRS',
    heading: 'Measurement Rendering Systems',
    text: 'The flagship platform that applies the HOS™ methodology to measure and render a client’s Enterprise Ecosystem as a governed Salt Basin Net Work.',
    chips: ['Enterprise Ecosystem', 'HOS™', 'Channel Rods', 'DataBasin'],
    href: '/output/methodology',
    preview: 'The enterprise measurement and rendering layer that turns operating evidence into a navigable system.',
    stat: 'MRS',
    statLabel: 'Flagship platform',
    positionClass: 'explorer-token',
  },
  {
    id: 'bestystaff',
    variant: 'table',
    label: 'BestyStaff',
    heading: 'Policy-bounded operating agents',
    text: 'Reusable agent templates grounded in governed context, explicit authority, and the current Member, Organization, Channel, and security scope.',
    chips: ['Agent Boundaries', 'Member Staff', 'Channel Rod Staff', 'Context'],
    href: '#bestystaff',
    preview: 'The governed workforce layer for intake, definitions, questions, and operating action.',
    stat: 'Agentic',
    statLabel: 'Workforce layer',
    positionClass: 'explorer-table',
  },
  {
    id: 'career',
    variant: 'founder',
    label: 'Member Career World',
    heading: 'Career portfolio and resume generator',
    text: 'A Member-scoped experience that turns canonical career evidence into navigable portfolios, role-targeted resume outputs, case studies, and approved personal-brand content without duplicating the underlying career truth.',
    chips: ['Career Evidence', 'Resume Outputs', 'Portfolio', 'Product Simulations'],
    href: '#career-system',
    preview: 'The individual Member World for career projections, personal positioning, and governed simulation access.',
    stat: 'Member',
    statLabel: 'Personal operating world',
    positionClass: 'explorer-founder',
  },
];

const careerOrbitObjects = [
  {
    id: 'jobs',
    label: 'Job History',
    variant: 'token',
    stat: '12+ yrs',
    text: 'Accenture, Vista Equity Partners, TIBCO, PwC, Slalom, Streamforce, and Salt Basin founder work.',
    chips: ['Timeline', 'Roles', 'Operators'],
    href: '/output/full-portfolio',
  },
  {
    id: 'cases',
    label: 'Case Studies',
    variant: 'hourglass',
    stat: '24',
    text: 'A portfolio of outcome-led transformations across revenue, systems, data, finance, and executive risk.',
    chips: ['SAO', 'Outcomes', 'Proof'],
    href: '/output/case-study-portfolio',
  },
  {
    id: 'industries',
    label: 'Industry Coverage',
    variant: 'rings',
    stat: '12+',
    text: 'Cross-industry pattern recognition across SaaS, PE, healthtech, semiconductor, manufacturing, education, and more.',
    chips: ['Markets', 'Patterns', 'Coverage'],
    href: '/output/domains',
  },
  {
    id: 'skills',
    label: 'Skill Coverage',
    variant: 'signature',
    stat: 'AI+Ops',
    text: 'Strategic operation, financial modeling, Q2R, CPQ/billing, process design, architecture, and AI-native build work.',
    chips: ['Skills', 'Depth', 'Evidence'],
    href: '/output/career-master-database',
  },
  {
    id: 'capabilities',
    label: 'Capability Coverage',
    variant: 'table',
    stat: 'L3/L4',
    text: 'Reusable capability maps, maturity models, risk registers, executive dashboards, and operating frameworks.',
    chips: ['Capabilities', 'Maps', 'Models'],
    href: '/output/methodology',
  },
  {
    id: 'scale',
    label: 'Engagement Size',
    variant: 'token',
    stat: '$38B+',
    text: 'Large-enterprise scale with proof points from semiconductor, industrial automation, healthcare IT, and PE contexts.',
    chips: ['Scale', 'ARR', 'Risk'],
    href: '/output/portfolio',
  },
  {
    id: 'tools',
    label: 'Technology & Tools',
    variant: 'engine',
    stat: 'Stack',
    text: 'Salesforce, CPQ, billing, ERP, integration, data, BI, LLM tooling, and AI-assisted product development.',
    chips: ['CRM', 'Billing', 'AI', 'Data'],
    href: '/output/tech-stack',
  },
];

export default function SaltBasinHome({ config, pages }) {
  const [members, setMembers] = useState([]);
  const [activeExplorer, setActiveExplorer] = useState(null);
  const [activeCareerObject, setActiveCareerObject] = useState(careerOrbitObjects[0]);
  const intake = config?.bestystaff?.homepage || {};

  useEffect(() => {
    api
      .listFeaturedMembers()
      .then((data) => setMembers(data.members || []))
      .catch(() => setMembers([]));
  }, []);

  return (
    <div className="sb-public-site-root sb-home-redesign" data-theme={config?.theme || 'strategic'}>
      <PublicNav site={config?.site} pages={pages} />

      <main>
        <section className="sbh-hero" aria-labelledby="salt-basin-home-title">
          <div className="sbh-hero-grid">
            <div className="sbh-hero-copy">
              <p className="sbh-script">hi, I&apos;m Betsy</p>
              <p className="sbh-eyebrow">Salt Basin Net Works</p>
              <h1 id="salt-basin-home-title">
                Build for the customer you keep.
              </h1>
              <p className="sbh-hero-lede">
                A living operating-intelligence portfolio, product studio, and senior-operator network
                for the revenue, systems, and data handoffs that decide whether growth actually holds.
              </p>
              <div className="sbh-cta-row sbh-hero-cta-row">
                <a className="sbh-btn sbh-btn-primary" href="#ventures">
                  {intake.primaryCtaLabel || 'Explore the work'}
                </a>
                <a className="sbh-btn sbh-btn-secondary" href="#bestystaff">
                  {intake.contactCtaLabel || 'Get in touch'}
                </a>
              </div>
            </div>

            <div className="sbh-orbit-stage" onMouseLeave={() => setActiveExplorer(null)}>
              <div className="sbh-crystal-tagline">
                We build for the customer you keep, not just the deal you close
              </div>
              <SaltBasinCrystal variant="signature" size="hero" interactive />
              <div className="sbh-orbit-line sbh-orbit-line-a" />
              <div className="sbh-orbit-line sbh-orbit-line-b" />
              {explorerObjects.map((item) => (
                <button
                  key={item.id}
                  className={`sbh-explorer-object ${item.positionClass}${activeExplorer?.id === item.id ? ' active' : ''}`}
                  type="button"
                  onMouseEnter={() => setActiveExplorer(item)}
                  onFocus={() => setActiveExplorer(item)}
                  onClick={() => setActiveExplorer(item)}
                  aria-label={`Explore ${item.label}`}
                >
                  <SaltBasinCrystal variant={item.variant} size="orbit" />
                  <span>{item.label}</span>
                </button>
              ))}
              {activeExplorer && (
                <div className="sbh-explorer-panel" key={activeExplorer.id}>
                  <p className="sbh-explorer-kicker">{activeExplorer.label}</p>
                  <h2>{activeExplorer.heading}</h2>
                  <p>{activeExplorer.text}</p>
                  <div className="sbh-explorer-preview">
                    <strong>{activeExplorer.stat}</strong>
                    <span>{activeExplorer.statLabel}</span>
                    <p>{activeExplorer.preview}</p>
                  </div>
                  <div className="sbh-explorer-chips">
                    {activeExplorer.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                  <a href={activeExplorer.href}>Open pathway</a>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="sbh-band sbh-band-light" id="ventures">
          <SectionHead
            eyebrow="What Salt Basin builds"
            title="One semantic architecture for individual and enterprise outcomes"
            intro="Individual Members use Salt Basin Net Works to build career portfolios, generate targeted resume outputs, publish an approved personal brand, and explore enterprise product simulations. Salt Basin MRS renders enterprise ecosystems, SaltTide™ routes consumer financial decisions, and BestyStaff supplies governed agent capacity across those contexts."
          />
          <div className="sbh-venture-grid">
            {ventures.map((item) => (
              <article className="sbh-venture-card" key={item.title}>
                <div className="sbh-card-mark">
                  <SaltBasinCrystal variant={item.mark} size="mark" />
                </div>
                <p className="sbh-card-tag">{item.tag}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sbh-band sbh-audience-band" id="pathways">
          <SectionHead eyebrow="Choose your operating context" title="Start with your career world or your enterprise world" intro="One canonical Member identity can move between personal and authorized organization contexts. Data scope, agent authority, and available simulations change with the context—not your identity." />
          <div className="sbh-audience-grid">
            {audiencePathways.map((pathway) => (
              <article className={`sbh-audience-card sbh-audience-${pathway.id}`} key={pathway.id}>
                <p className="sbh-card-tag">{pathway.eyebrow}</p>
                <h3>{pathway.title}</h3>
                <p className="sbh-audience-copy">{pathway.text}</p>
                <ul>{pathway.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <div className="sbh-audience-actions">
                  {pathway.actions.map((action) => <a key={action.label} className={`sbh-btn ${action.primary ? 'sbh-btn-primary' : 'sbh-btn-secondary'}`} href={action.href}>{action.label}</a>)}
                </div>
              </article>
            ))}
          </div>
          <p className="sbh-simulation-note">Simulation access is governed by context: public demonstrations introduce the method, Member simulations support individual exploration, and organization-authorized simulations may use scoped enterprise evidence.</p>
        </section>

        <section className="sbh-band sbh-method-band" id="method">
          <SectionHead
            eyebrow="The method"
            title="The Salter Momentum"
            intro="Transformation over manifestation: understand the real system, render the plan, then execute with evidence."
            dark
          />
          <div className="sbh-method-rail">
            {method.map(([num, title, text]) => (
              <article className="sbh-method-step" key={title}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sbh-band sbh-band-light" id="capabilities">
          <div className="sbh-split">
            <div>
              <p className="sbh-eyebrow">Operating intelligence</p>
              <h2>Reusable outputs, not one-off consulting theater.</h2>
              <p>
                Salt Basin converts messy operating reality into tools people can keep using:
                process hierarchies, capability maps, maturity models, executive summaries,
                lineage views, and safe public previews.
              </p>
            </div>
            <div className="sbh-capability-grid">
              {capabilities.map(([title, text]) => (
                <article className="sbh-capability-card" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sbh-band sbh-proof-band" id="proof">
          <div className="sbh-proof-grid">
            <div>
              <p className="sbh-eyebrow">Career signal</p>
              <h2>Enterprise work, translated into a living source of truth.</h2>
              <p>
                Betsy&apos;s background spans Accenture, Vista Equity Partners, TIBCO, PwC,
                Slalom, and Streamforce: financial modeling depth, GTM execution, CPQ and
                billing architecture, revenue operations, and executive-level operating trust.
              </p>
              <a className="sbh-inline-link" href="#bestystaff">
                {intake.contactCtaLabel || 'Get in touch'}
              </a>
            </div>
            <div className="sbh-metric-grid">
              {engagements.map(([value, label]) => (
                <div className="sbh-metric" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sbh-band sbh-career-system" id="career-system">
          <div className="sbh-career-system-grid">
            <div className="sbh-career-copy">
              <p className="sbh-eyebrow">Career Portfolio</p>
              <h2>A 3D solar system of outcomes and transformations.</h2>
              <p>
                Explore Betsy&apos;s career narrative as connected objects: job history, case
                study portfolio, industry coverage, skill coverage, capability coverage,
                engagement size, and technology/tool coverage. Each orbit is a doorway into
                a portfolio output powered by the Career Master database.
              </p>
              <div className="sbh-career-proof-row">
                <span>12+ years</span>
                <span>24 engagements</span>
                <span>12+ industries</span>
              </div>
            </div>

            <div className="sbh-career-orbit" aria-label="Interactive career portfolio solar system">
              <div className="sbh-career-orbit-ring ring-one" />
              <div className="sbh-career-orbit-ring ring-two" />
              <div className="sbh-career-orbit-ring ring-three" />
              <div className="sbh-career-core">
                <SaltBasinCrystal variant="founder" size="hero" interactive />
                <span>Career Narrative</span>
              </div>

              {careerOrbitObjects.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={`sbh-career-planet planet-${index + 1}${activeCareerObject.id === item.id ? ' active' : ''}`}
                  onMouseEnter={() => setActiveCareerObject(item)}
                  onFocus={() => setActiveCareerObject(item)}
                  onClick={() => setActiveCareerObject(item)}
                >
                  <SaltBasinCrystal variant={item.variant} size="orbit" />
                  <span>{item.label}</span>
                </button>
              ))}

              <article className="sbh-career-card" key={activeCareerObject.id}>
                <p>{activeCareerObject.label}</p>
                <h3>{activeCareerObject.stat}</h3>
                <span>{activeCareerObject.text}</span>
                <div>
                  {activeCareerObject.chips.map((chip) => (
                    <small key={chip}>{chip}</small>
                  ))}
                </div>
                <a href={activeCareerObject.href}>View output</a>
              </article>
            </div>
          </div>
        </section>

        <section className="sbh-band sbh-band-light" id="network">
          <SectionHead
            eyebrow="Net Works"
            title="A shoreline for senior operators"
            intro="Salt Basin is also an opt-in network: independent operators keep a profile they control, while companies get a cleaner path to proven expertise."
          />
          {members.length > 0 ? (
            <div className="sbh-member-grid">
              {members.slice(0, 4).map((member) => (
                <a className="sbh-member-card" href={`/u/${member.slug}`} key={member.slug}>
                  <div className="sbh-member-logo">
                    {member.logo_url ? <img src={member.logo_url} alt="" /> : initials(member.name || member.slug)}
                  </div>
                  <div>
                    <h3>{member.name || member.slug}</h3>
                    <p>{member.network_blurb || 'Senior operator in the Salt Basin network.'}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="sbh-network-empty">
              <p>Operator profiles are opt-in. The network surface is ready as members publish.</p>
              <a className="sbh-btn sbh-btn-primary" href="/signup">
                Claim a profile
              </a>
            </div>
          )}
        </section>

        <section className="sbh-band sbh-besty-section" id="bestystaff">
          <div className="sbh-besty-section-inner">
            <button
              type="button"
              className="sbh-besty-crystal-trigger"
              aria-label="Open BestyStaff chat"
              onClick={() => {
                if (window.location.hash !== '#bestystaff') window.location.hash = 'bestystaff';
                else window.dispatchEvent(new Event('bestystaff:open'));
              }}
            >
              <SaltBasinCrystal variant="signature" size="hero" interactive />
            </button>
            <div>
              <p className="sbh-eyebrow">{intake.eyebrow || 'Get in touch'}</p>
              <h2>{intake.heading || 'Start with BestyStaff.'}</h2>
              <p>
                {intake.description || 'Share what brought you here. BestyStaff will gather the useful context for Betsy, answer what it can, and create a lead record so the conversation can continue.'}
              </p>
            </div>
          </div>
          <PortfolioRequestPrompt
            sourceOutput="homepage-contact"
            autoOpen={false}
            openOnHash="#bestystaff"
            intakeConfig={config?.bestystaff?.intake}
          />
        </section>

        <section className="sbh-connect" id="connect">
          <SaltBasinCrystal variant="signature" size="mark" />
          <p className="sbh-eyebrow">Matthew 5:13</p>
          <h2>Build work that carries flavor and does not lose it.</h2>
          <p>
            Bring the underused asset pipeline, the revenue handoff, the operating model, or the
            next product surface. Salt Basin will help make the root system visible.
          </p>
          <div className="sbh-cta-row">
            <a className="sbh-btn sbh-btn-primary" href="#contact">
              Start a conversation
            </a>
            <a className="sbh-btn sbh-btn-secondary" href="https://pop3decor.com">
              POP 3D Decor
            </a>
          </div>
        </section>
      </main>

      <PublicFooter config={config} />
    </div>
  );
}

function SectionHead({ eyebrow, title, intro, dark = false }) {
  return (
    <div className={`sbh-section-head${dark ? ' is-dark' : ''}`}>
      <p className="sbh-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{intro}</p>
    </div>
  );
}

function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
