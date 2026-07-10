import React, { useEffect, useState } from 'react';
import PublicNav from './PublicNav.jsx';
import PublicFooter from './PublicFooter.jsx';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import PortfolioRequestPrompt from './PortfolioRequestFlow.jsx';
import { api } from '../lib/api.js';

const ventures = [
  {
    tag: 'Flagship product',
    title: 'SaltTide',
    mark: 'hourglass',
    text:
      'Credit Health Infrastructure that follows financial context, timing, obligations, rewards, debt signals, and outcome paths as a connected customer network.',
  },
  {
    tag: 'Operating engine',
    title: 'HandoverOS',
    mark: 'engine',
    text:
      'Salt Basin Highway Operating System for journey data rods, SaltBridge lineage, SaltTide routing, and every handoff that determines whether a customer stays.',
  },
  {
    tag: 'Advisory layer',
    title: 'MESA',
    mark: 'rings',
    text:
      'Management, execution, strategy, and assessment services for companies that need senior operating judgment without a slow consulting machine.',
  },
];

const method = [
  ['01', 'Understanding', 'Find the root cause across people, process, systems, data, incentives, and financial exposure.'],
  ['02', 'Rendering', 'Turn the diagnosis into a visible operating model, architecture, scorecard, or board-ready decision artifact.'],
  ['03', 'Manifesting', 'Execute the change with traceable metrics, clean ownership, and reusable infrastructure for the next decision.'],
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
  ['15+', 'Years across enterprise systems, GTM, finance, and transformation'],
];

const explorerObjects = [
  {
    id: 'salttide',
    variant: 'hourglass',
    label: 'SaltTide',
    heading: 'Credit Health Infrastructure',
    text: 'A customer financial network layer for timing, obligations, card paths, reward rules, debt signals, and outcome health.',
    chips: ['Credit Health', 'Timing', 'Routing', 'Network'],
    href: '#ventures',
    preview: 'Hourglass layer for consumer financial routing, timing, and health.',
    stat: 'Flagship',
    statLabel: 'Product venture',
    positionClass: 'explorer-hourglass',
  },
  {
    id: 'handoveros',
    variant: 'token',
    label: 'HandoverOS',
    heading: 'Salt Basin Highway Operating System',
    text: 'The network operating layer for journey data rods in SaltBridge, SaltTide flows, customer handoffs, lineage, and portfolio evidence.',
    chips: ['Journey Data Rods', 'SaltBridge', 'SaltTide', 'Network'],
    href: '/output/methodology',
    preview: 'Crystal token for following the network, not the object model.',
    stat: 'Q2R',
    statLabel: 'Operating layer',
    positionClass: 'explorer-token',
  },
  {
    id: 'mesa',
    variant: 'table',
    label: 'MESA',
    heading: 'Advisory worktable',
    text: 'Management, execution, strategy, and assessment services for companies that need senior operators and reusable executive outputs.',
    chips: ['Advisory', 'Strategy', 'Assessment', 'Delivery'],
    href: '/consulting/services',
    preview: 'Round-top crystal table for board-ready decisions and executive artifacts.',
    stat: 'MESA',
    statLabel: 'Services layer',
    positionClass: 'explorer-table',
  },
  {
    id: 'career',
    variant: 'founder',
    label: 'Career Portfolio',
    heading: 'Founder career solar system',
    text: 'A 3D portfolio journey through job history, case studies, industries, skills, capabilities, engagement scale, and technology coverage.',
    chips: ['24 Engagements', '12+ Industries', '12+ Years', 'Portfolio Outputs'],
    href: '#career-system',
    preview: 'Metallic pink founder object that opens the career narrative experience.',
    stat: '24',
    statLabel: 'Engagement objects',
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
            title="Two product layers, one operating method"
            intro="We build for the customer you keep, not just the deal you close. Salt Basin follows the network across customer outcomes, product paths, operating evidence, and reusable institutional memory."
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
