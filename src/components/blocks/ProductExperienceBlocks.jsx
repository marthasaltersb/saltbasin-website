// Salt Basin MRS "Product Experience" homepage blocks — config-driven
// replacements for the reference HTML mockup's sections. Every block reads
// exclusively from section.fields (no hardcoded copy) so content is editable
// in /admin the same way every other block is, per the block-registry
// contract in ./index.jsx.
import React, { useState, useEffect, useRef } from 'react';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';
import CrystalMark from '../CrystalMark.jsx';
import CrystalOfficeScene from '../CrystalOfficeScene.jsx';
import CrystalRoomScene from '../CrystalRoomScene.jsx';
import { RenderSection } from './index.jsx';
import { mergeCrystalExperience } from '../../data/crystalExperienceConfig.js';
import { scoreDestinationMaturity, maturityBandFor } from '../../lib/maturityScoring.js';
import { HOS_EDGE_CASES, compileHosScenarioInsights } from '../../data/handoverOsScenarioLibrary.js';

const SECTION_VARIANTS = ['hourglass', 'engine', 'rings', 'token', 'table', 'founder'];

// Labels for the six HOS metadata dimensions shown in the New World reveal.
// Their maturity values are never hand-picked — they're computed per focused
// destination from its actual captured content (see scoreDestinationMaturity
// + config.dataDensity.dimensionFieldMap), falling back to these
// placeholders only if a destination has no scorable content at all.
const METADATA_DIMENSIONS = [
  { id: 'identity', label: 'Identity', maturity: 0.15 },
  { id: 'intent', label: 'Intent', maturity: 0.32 },
  { id: 'evidence', label: 'Evidence', maturity: 0.48 },
  { id: 'definition', label: 'Definition', maturity: 0.64 },
  { id: 'lineage', label: 'Lineage', maturity: 0.8 },
  { id: 'outcome', label: 'Outcome', maturity: 0.95 },
];

// Row-level chip/tag sub-fields are stored as a comma-separated string in the
// admin editor (matches the existing `tags` convention in CaseListEditor) —
// this splits them back into a clean string[] for rendering.
function splitChips(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function Chips({ items, tone }) {
  if (!items || !items.length) return null;
  return (
    <div className="sbh-px-chips">
      {items.map((c, i) => (
        <span key={i} className={`sbh-px-chip${tone ? ` sbh-px-chip-${tone}` : ''}`}>{c}</span>
      ))}
    </div>
  );
}

function PXHead({ eyebrow, heading, intro, dark }) {
  if (!eyebrow && !heading && !intro) return null;
  return (
    <div className={`sbh-px-head${dark ? ' is-dark' : ''}`}>
      {eyebrow && <p className="sbh-eyebrow">{eyebrow}</p>}
      {heading && <h2>{heading}</h2>}
      {intro && <p className="sbh-px-intro">{intro}</p>}
    </div>
  );
}

export function ProductHeroBlock({ section, config, liveSlugs, memberSlug = '' }) {
  const f = section.fields || {};
  const bestyHome = config?.bestystaff?.homepage || {};
  const homepageSections = config?.homepageSections || [];
  const configuredPrimaryHref = f.cta1Link || '#home-marketing-hooks';
  const primaryTargetId = configuredPrimaryHref.startsWith('#') ? configuredPrimaryHref.slice(1) : null;
  const primaryHref = primaryTargetId && !homepageSections.some((item) => item.id === primaryTargetId && item.type === 'marketingHooks')
    ? '#home-marketing-hooks'
    : configuredPrimaryHref;
  const [explored, setExplored] = useState(false);
  const [activeExplorer, setActiveExplorer] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [focusedDestination, setFocusedDestination] = useState(null);
  const [walkTargetId, setWalkTargetId] = useState(null);
  const [newWorld, setNewWorld] = useState(false);
  const [showRealContent, setShowRealContent] = useState(false);
  const [activeContentId, setActiveContentId] = useState(null);
  const [showWalkHint, setShowWalkHint] = useState(false);
  useEffect(() => {
    if (!explored) { setShowWalkHint(false); return undefined; }
    setShowWalkHint(true);
    const timer = setTimeout(() => setShowWalkHint(false), 4500);
    return () => clearTimeout(timer);
  }, [explored]);
  const sections = (config?.homepageSections || []).filter((item) => item.id !== section.id && item.type !== 'marketingHooks' && item.status !== 'draft');
  const configuredDrops = config?.crystalExperience?.contentDrops;
  const sourceDrops = Array.isArray(configuredDrops) && configuredDrops.length ? configuredDrops : sections;
  const crystalConfig = mergeCrystalExperience(config?.crystalExperience || {});
  const [navReady, setNavReady] = useState(false);
  useEffect(() => {
    if (!explored) { setNavReady(false); return undefined; }
    // Destination hit-targets are positioned every frame from the camera's
    // real projected view — during the entry flight the camera is still
    // moving fast enough that two destinations' on-screen positions can
    // cross paths, so a click meant for one can land on whichever one is
    // actually under the cursor at that instant. Simplest fix: don't make
    // them clickable until the flight has settled.
    const timer = setTimeout(() => setNavReady(true), crystalConfig.camera.enterSeconds * 1000 + 150);
    return () => clearTimeout(timer);
  }, [explored]);
  const destinations = sourceDrops.map((item, index) => {
    const fields = item.fields || item;
    const destination = {
      id: item.id || `context-${index}`,
      label: fields.heading || fields.title || fields.label || fields.eyebrow || item.type || `Context ${index + 1}`,
      detail: fields.intro || fields.lede || fields.description || `Explore this capability context.`,
      variant: fields.variant || SECTION_VARIANTS[index % SECTION_VARIANTS.length],
      href: fields.href || (item.id ? `#${item.id}` : '#'),
      angle: (index / Math.max(1, sourceDrops.length)) * 360,
      sceneColor: fields.crystalColor || fields.sceneColor,
      sceneHeight: fields.crystalHeight || fields.sceneHeight,
      sceneSides: fields.crystalSides || fields.sceneSides,
      rawSection: item,
    };
    // Real, computed content density — never a hand-picked number. This is
    // what makes the crystal taller in the city and decides which content
    // gets first billing in the pre-explore picker below.
    const { overall, dimensions } = scoreDestinationMaturity(destination, crystalConfig.dataDensity);
    destination.maturity = overall;
    destination.dimensions = dimensions;
    return destination;
  });
  // The pre-explore orbit is the very first thing a visitor sees — surface
  // whichever destinations have the most complete, real content first rather
  // than whatever order they happen to sit in admin.
  // Kept deliberately small — 3 crystals reads as a considered, curated
  // first impression; anything more reads as clutter around the hero.
  const active = destinations.find((item) => item.id === activeExplorer);
  const focused = destinations.find((item) => item.id === focusedDestination);
  const activeContent = destinations.find((item) => item.id === activeContentId);
  // Real per-dimension scores for the focused destination, computed from its
  // actual captured fields — falls back to the placeholder curve only when a
  // destination has no scorable content at all (e.g. a bare stub section).
  const roomNodes = METADATA_DIMENSIONS.map((dimension) => ({
    ...dimension,
    maturity: focused?.dimensions?.find((d) => d.id === dimension.id)?.maturity ?? dimension.maturity,
  }));
  const destHitRefs = useRef(new Map());
  const handleDestLayout = useRef((layout) => {
    layout.forEach(({ id, x, y, visible }) => {
      const el = destHitRefs.current.get(id);
      if (!el) return;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      // Occluded by a nearer destination (see CrystalOfficeScene's
      // nearest-wins pass) — hide and disable rather than leave it
      // clickable-but-invisible-ly-stacked underneath another target.
      el.style.opacity = visible === false ? '0' : '';
      el.style.pointerEvents = visible === false ? 'none' : '';
    });
  }).current;

  function toggleExplore(event) {
    if (event.target.closest('a, button')) return;
    setExplored((value) => !value);
    setActiveExplorer(null);
  }

  function followPointer(event) {
    if (!explored) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--cms-x', `${((event.clientX - rect.left) / rect.width - .5) * 42}px`);
    event.currentTarget.style.setProperty('--cms-y', `${((event.clientY - rect.top) / rect.height - .5) * 30}px`);
  }

  return (
    <section id={section.id} className={`sbh-px-hero${explored ? ' is-explored' : ''}`} onClick={toggleExplore} onPointerMove={followPointer}>
      <div className="sbh-px-hero-canvas">
        <SaltBasinCrystal
          variant="signature"
          size="backdrop"
          interactive
          autoRotate={!explored}
        />
      </div>
      <div className={`sbh-px-hero-content${explored ? ' is-explored' : ''}${activeContent ? ' is-contextual' : ''}`} key={activeContent?.id || 'default'}>
        {(activeContent?.label || f.script) && <p className="sbh-script">{activeContent ? 'Selected capability context' : f.script}</p>}
        {(activeContent || f.heading || f.headingEmphasis) && (
          <h1>
            {activeContent ? activeContent.label : <>{f.heading}{f.heading && f.headingEmphasis ? ' ' : ''}{f.headingEmphasis && <em>{f.headingEmphasis}</em>}</>}
          </h1>
        )}
        {(activeContent?.detail || f.lede) && <p className="sbh-px-hero-lede">{activeContent?.detail || f.lede}</p>}
        <div className="sbh-cta-row sbh-hero-cta-row">
          {f.cta1Label && (
            <a className="sbh-btn sbh-btn-primary" href={primaryHref}>{/^see how salt basin mrs works$/i.test(f.cta1Label) ? "See what we're building" : f.cta1Label}</a>
          )}
          {f.cta2Label && (
            <a className="sbh-btn sbh-btn-secondary" href="#bestystaff">
              {bestyHome.contactCtaLabel || 'Get in touch'}
            </a>
          )}
        </div>
      </div>
      {explored && (
        <div className={`sbh-cms-explorer${focused ? ' is-focused' : ''}${newWorld ? ' is-new-world' : ''}`} aria-label="CrystalMovementSystems navigation">
          <CrystalOfficeScene
            active
            destinations={destinations}
            experience={config?.crystalExperience}
            hoveredId={activeExplorer}
            focusedId={focusedDestination}
            walkTargetId={walkTargetId}
            onLayout={handleDestLayout}
            onArrive={(id) => { setWalkTargetId(null); setFocusedDestination(id); setActiveExplorer(id); setLegendOpen(false); setNewWorld(false); setShowRealContent(false); }}
          />
          {showWalkHint && !focused && !walkTargetId && <span className="sbh-cms-walk-hint" aria-hidden="true">Click a crystal to walk to it — or click the ground to explore</span>}
          <div className={`sbh-crystal-office-hits${focused ? ' is-focused' : ''}`} aria-label="Crystal city destinations">
            {navReady && destinations.map((item) => (
              <button
                key={item.id}
                type="button"
                ref={(el) => { if (el) destHitRefs.current.set(item.id, el); else destHitRefs.current.delete(item.id); }}
                className={walkTargetId === item.id ? 'is-walking' : ''}
                onClick={(event) => { event.stopPropagation(); setWalkTargetId(item.id); }}
                onMouseEnter={() => setActiveExplorer(item.id)}
                onFocus={() => setActiveExplorer(item.id)}
                onMouseLeave={() => setActiveExplorer(null)}
                aria-label={`Walk to ${item.label}`}
              />
            ))}
          </div>
          <div className="sbh-cms-space" aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => <i key={index} style={{ '--star': index }} />)}
            <span className="sbh-cms-orbit-path path-a" /><span className="sbh-cms-orbit-path path-b" /><span className="sbh-cms-horizon" />
          </div>
          <div className="sbh-cms-city-ground" aria-hidden="true" />
          <div className="sbh-cms-outer-network" aria-label="Outer crystal network and exit points">
            {Array.from({ length: 8 }, (_, index) => (
              <button key={index} type="button" style={{ '--outer-index': index }} onClick={() => { setExplored(false); setFocusedDestination(null); setWalkTargetId(null); setNewWorld(false); setShowRealContent(false); }} aria-label="Exit through outer network crystal">
                <CrystalMark variant={SECTION_VARIANTS[index % SECTION_VARIANTS.length]} autoRotate />
              </button>
            ))}
            <span className="sbh-cms-network-rod rod-one" /><span className="sbh-cms-network-rod rod-two" /><span className="sbh-cms-network-rod rod-three" /><span className="sbh-cms-network-rod rod-four" />
          </div>
          <button className="sbh-cms-close" type="button" onClick={() => { if (showRealContent) { setShowRealContent(false); } else if (focused) { setFocusedDestination(null); setNewWorld(false); } else { setExplored(false); setActiveExplorer(null); setWalkTargetId(null); } }} aria-label="Close crystal navigation">×</button>
          <div className="sbh-cms-intelligence" aria-label="Journey data rod intelligence over time">
            <span className="sbh-cms-intelligence-label">Journey intelligence over time</span>
            <div className="sbh-cms-time-rod">{['Signal', 'Context', 'Definition', 'Decision', 'Outcome'].map((point, index) => <button type="button" key={point} style={{ '--time-index': index }} aria-label={point}><i /><span>{point}</span></button>)}</div>
            <div className="sbh-cms-cross-rods" aria-label="Cross-functional Channel Rods">{['Customer', 'Revenue', 'Product', 'Service'].map((rod, index) => <span key={rod} style={{ '--rod-index': index }}><i /><b>{rod}</b></span>)}</div>
          </div>
          <button className="sbh-cms-legend-crystal" type="button" aria-label="Open crystal navigation legend" aria-expanded={legendOpen} onClick={() => setLegendOpen((value) => !value)}>
            <CrystalMark variant="rings" autoRotate={false} />
          </button>
          {legendOpen && <aside className="sbh-cms-legend" aria-live="polite"><p className="sbh-explorer-kicker">Crystal navigation legend</p>{destinations.map((item) => <button type="button" key={item.id} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}><CrystalMark variant={item.variant} autoRotate={false} /><span><b>{item.label}</b><small>{item.detail}</small></span></button>)}</aside>}
          {active && !legendOpen && <span className="sbh-cms-orbit-callout">Open the legend crystal to identify this destination.</span>}
          {focused && <div className="sbh-cms-room" role="dialog" aria-label={`${focused.label} journey preview`}>
            <div className="sbh-cms-room-heading"><span>Entering</span><strong>{focused.label}</strong><small>{focused.detail}</small></div>
            {!newWorld ? <>
              <div className="sbh-cms-old-world" aria-label="Old world capability table teaser"><span>Old-world interface</span><div><b>System</b><b>Capability</b><b>State</b></div><div><em>CRM</em><em>Customer context</em><em>Fragmented</em></div><div><em>Billing</em><em>Revenue event</em><em>Delayed</em></div><div><em>Service</em><em>Outcome signal</em><em>Disconnected</em></div></div>
              <button type="button" className="sbh-cms-new-world-trigger" onClick={() => setNewWorld(true)} aria-label="Render the Salt Basin New World"><SaltBasinCrystal variant="signature" size="hero" interactive /><span>Click Salt Crystal to render the Salt Basin New World</span></button>
            </> : <div className="sbh-cms-new-world"><CrystalRoomScene active={newWorld} pulseActive nodes={roomNodes} /><div className="sbh-cms-maturity"><span>0 · {crystalConfig.maturity[0]?.label}</span><i><b style={{ left: `${Math.round((focused.maturity ?? 0) * 100)}%` }} /></i><span>{Math.round((focused.maturity ?? 0) * 100)}% · {maturityBandFor(focused.maturity ?? 0, crystalConfig.maturity)?.label}</span></div><button type="button" onClick={() => setShowRealContent(true)}>Continue into this journey</button></div>}
          </div>}
          {showRealContent && focused?.rawSection && (
            <div className="sbh-cms-content-overlay" role="region" aria-label={`${focused.label} content`}>
              <button type="button" className="sbh-cms-content-back" onClick={() => setShowRealContent(false)}>← Back to Salt Crystal navigation</button>
              <div className="sbh-cms-content-body">
                <RenderSection section={focused.rawSection} config={config} mode="public" memberSlug={memberSlug} liveSlugs={liveSlugs} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function RotatingHighlightsBlock({ section }) {
  const f = section.fields || {};
  const highlights = Array.isArray(f.highlights) ? f.highlights : [];
  const metrics = Array.isArray(f.metrics) ? f.metrics : [];
  const rotationMs = Number(f.rotationMs) || 5000;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef(null);

  function move(delta) {
    setIndex((current) => (current + delta + highlights.length) % highlights.length);
  }

  function onPointerDown(event) {
    pointerStartX.current = event.clientX;
    setPaused(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerUp(event) {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start != null && Math.abs(event.clientX - start) > 36) move(event.clientX < start ? 1 : -1);
    setPaused(false);
  }

  useEffect(() => {
    if (highlights.length < 2 || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % highlights.length), rotationMs);
    return () => clearInterval(id);
  }, [highlights.length, paused, rotationMs]);

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-promo-stage">
        <div
          className="sbh-px-highlight-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { pointerStartX.current = null; setPaused(false); }}
        >
          {highlights.map((highlight, highlightIndex) => {
            const active = highlightIndex === index;
            return (
              <div
                key={highlight.id || highlightIndex}
                className={`sbh-px-highlight-card${active ? ' active' : ''}`}
                aria-hidden={!active}
                tabIndex={active ? 0 : -1}
              >
                {highlight.eyebrow && <p className="sbh-eyebrow">{highlight.eyebrow}</p>}
                {highlight.title && <h3>{highlight.title}</h3>}
                {highlight.text && <p>{highlight.text}</p>}
                <Chips items={splitChips(highlight.chips)} tone="req" />
                {highlights.length > 1 && (
                  <div className="sbh-px-dots" aria-label={`Highlight ${highlightIndex + 1} of ${highlights.length}`}>
                    {highlights.map((_, dotIndex) => (
                      <button key={dotIndex} type="button" aria-label={`Show highlight ${dotIndex + 1}`} onClick={() => setIndex(dotIndex)} className={`sbh-px-dot${dotIndex === index ? ' active' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {metrics.length > 0 && (
          <div className="sbh-px-metric-grid">
            {metrics.map((m, i) => (
              <div className="sbh-px-metric" key={i}>
                <span>{m.label}</span>
                <strong>{m.value}</strong>
                {m.sublabel && <small>{m.sublabel}</small>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function BuildFlowBlock({ section }) {
  const f = section.fields || {};
  const momentum = [
    ['UNDERSTANDING', 'Find the root condition across people, process, systems, data, incentives, and financial exposure.'],
    ['RENDERING', 'Make the operating state visible through governed definitions, evidence, lineage, and spatial models.'],
    ['MEASURING', 'Measure the configured change, validate the outcome, and preserve what the organization learns.'],
  ];
  const acronyms = [
    ['SBNW', 'Salt Basin Net Works Platform', 'Member and Organization platform for configured worlds, products, outputs, simulations, and governed access.'],
    ['MRS', 'Measurement Rendering Systems', 'Flagship platform that designs and maintains the Enterprise Ecosystem.'],
    ['HOS™', 'Highway Operating System', 'Methodology MRS operationalizes across Quote-to-Revenue handoffs.'],
    ['RLMM™', 'Revenue Lifecycle Mechanics Maturity', 'Diagnostic for revenue lifecycle readiness and dependency risk.'],
    ['DataBasin', 'Governed evidence bridge', 'Normalizes and reconciles distributed source evidence.'],
    ['BestyStaff', 'Governed agent workforce', 'Policy-bounded Member Staff and Channel Rod Staff templates.'],
  ];
  const convergenceSection = {
    id: `${section.id}-channel-rod-convergence`,
    fields: {
      eyebrow: 'Channel Rod convergence',
      heading: 'See operating evidence converge across Channel Rods',
      intro: 'Advance one evidence event at a time. Each signal creates or strengthens a Channel Rod until revenue, customer, and member context resolve into one measurable operating state.',
      rods: [
        { key: 'revenue', label: 'Revenue Rod', color: 'var(--sbh-teal)', increment: 18 },
        { key: 'customer', label: 'Customer Rod', color: 'var(--sbh-mauve)', increment: 18 },
        { key: 'member', label: 'Member Rod', color: 'var(--sb-navy)', increment: 18 },
      ],
      channelEvents: [
        { id: 'lead-qualified', label: 'Lead Qualified', stage: 'Commercial intent qualified', createsRod: 'revenue', affects: ['revenue'], evidence: 'Identity, need, organization, and buying context establish a permissioned commercial signal.' },
        { id: 'proposal-won', label: 'Proposal Won', stage: 'Solution pathway accepted', createsRod: 'customer', affects: ['revenue', 'customer'], evidence: 'The accepted scope connects the revenue opportunity to the customer outcome and delivery boundary.' },
        { id: 'contract-signed', label: 'Contract Signed', stage: 'Commitment governed', createsRod: 'member', affects: ['revenue', 'customer', 'member'], evidence: 'Terms, obligations, owners, and end-user context become governed operating metadata.' },
        { id: 'fulfillment-delivered', label: 'Fulfillment Delivered', stage: 'Outcome delivered', affects: ['revenue', 'customer', 'member'], evidence: 'Delivery evidence reconciles what was sold, promised, configured, and received.' },
        { id: 'revenue-recognized', label: 'Revenue Recognized', stage: 'Pipeline-to-cash reconciled', affects: ['revenue', 'customer', 'member'], evidence: 'Commercial, contractual, fulfillment, and financial evidence converge into a measurable operating state.' },
      ],
      platformBehaviors: [
        { label: 'Capture', description: 'Collect governed signals from each interaction and source.' },
        { label: 'Normalize', description: 'Translate signals into shared definitions and metadata.' },
        { label: 'Reconcile', description: 'Connect evidence across owners, handoffs, and Channel Rods.' },
        { label: 'Render', description: 'Show the current operating state, exposure, and next action.' },
      ],
    },
  };

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-grid2">
        <div className="sbh-px-panel">
          <h3>The Salter Momentum</h3>
          <div className="sbh-px-path">
            {momentum.map(([label, desc], i) => (
              <div className="sbh-px-path-node" key={i}>
                <b>{label}</b><span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sbh-px-panel"><h3>From methodology to measurable operating state</h3><p>Detailed product architecture, acronym mapping, and implementation roadmaps live under Solutions &amp; Services.</p><a className="sbh-btn sbh-btn-secondary" href="/platform#architecture-map">View architecture &amp; roadmap</a></div>
      </div>
      <div className="sbh-px-convergence-embed">
        <JourneyRodsBlock section={convergenceSection} />
      </div>
    </section>
  );
}

export function JourneyRodsBlock({ section }) {
  const f = section.fields || {};
  const rods = Array.isArray(f.rods) ? f.rods : [];
  const legacySteps = splitChips(f.stepSequence);
  const events = Array.isArray(f.channelEvents) && f.channelEvents.length
    ? f.channelEvents
    : legacySteps.map((label, index) => ({ label, stage: label, createsRod: index < rods.length ? rods[index].key : null, affects: rods.slice(0, index + 1).map((rod) => rod.key), evidence: 'Configured metadata collected' }));
  const [stepCount, setStepCount] = useState(0);
  const revealedEvents = events.slice(0, stepCount);
  const currentEvent = revealedEvents[revealedEvents.length - 1] || null;
  const platformBehaviors = Array.isArray(f.platformBehaviors) ? f.platformBehaviors : [];

  const rodStates = rods.map((rod) => {
    const creationIndex = events.findIndex((event) => event.createsRod === rod.key);
    const exists = creationIndex >= 0 && stepCount > creationIndex;
    const affectingEvents = revealedEvents.filter((event) => (event.affects || []).includes(rod.key));
    const lastEvent = affectingEvents[affectingEvents.length - 1];
    const maturity = exists ? Math.min(100, 18 + affectingEvents.length * (Number(rod.increment) || 12)) : 0;
    return { ...rod, exists, maturity, stage: lastEvent?.stage || 'Awaiting genesis evidence', highlighted: currentEvent && ((currentEvent.affects || []).includes(rod.key) || currentEvent.createsRod === rod.key) };
  });

  function simulate() {
    setStepCount((count) => Math.min(events.length, count + 1));
  }
  function reset() {
    setStepCount(0);
  }

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-cta-row sbh-px-convergence-controls">
        <button type="button" className="sbh-btn sbh-btn-primary" onClick={simulate} disabled={stepCount >= events.length}>{stepCount === 0 ? 'Collect first metadata' : stepCount >= events.length ? 'Convergence complete' : 'Collect next metadata'}</button>
        <button type="button" className="sbh-btn sbh-btn-secondary" onClick={reset}>Reset</button>
      </div>
      <div className="sbh-px-signal-rail" aria-label="Lifecycle convergence signals">
        {events.map((event, index) => <div key={event.id || index} className={`${index < stepCount ? 'complete' : ''}${index === stepCount - 1 ? ' current' : ''}`}><span>{index + 1}</span><strong>{event.label}</strong></div>)}
      </div>
      <div className="sbh-px-channel-event" aria-live="polite">
        <span>{currentEvent ? `Metadata event ${stepCount} of ${events.length}` : 'No Channel Rods created yet'}</span>
        <strong>{currentEvent?.label || 'Collect the first identity signal to begin.'}</strong>
        {currentEvent?.evidence && <p>{currentEvent.evidence}</p>}
      </div>
      {platformBehaviors.length > 0 && <div className="sbh-px-platform-behaviors" aria-label="Platform behaviors">
        {platformBehaviors.map((behavior, index) => {
          const active = stepCount > 0;
          return <article key={behavior.label} className={active ? 'active' : ''}><span>{active ? currentEvent?.label : 'Waiting'}</span><strong>{behavior.label}</strong><p>{behavior.description}</p></article>;
        })}
      </div>}
      <div className="sbh-px-rods sbh-px-rods-converging">
        {rodStates.map((rod, i) => (
          <div className={`sbh-px-rod-row${rod.highlighted ? ' is-highlighted' : ''}${rod.exists ? ' exists' : ' pending'}`} key={rod.key || i}>
            <div className="sbh-px-rod-label" style={{ background: rod.exists ? (rod.color || 'var(--sbh-teal)') : '#aaa' }}>{rod.label}</div>
            <div className="sbh-px-rod-track">
              <div className="sbh-px-rod-fill" style={{ width: `${rod.maturity}%` }} />
            </div>
            <div className="sbh-px-rod-score">{rod.exists ? (rod.maturity / 100).toFixed(2) : '—'}</div>
            <div className="sbh-px-channel-stage"><small>Channel Stage</small><strong>{rod.stage}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCatalogBlock({ section }) {
  const f = section.fields || {};
  const products = Array.isArray(f.products) ? f.products : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-catalog">
        {products.map((p, i) => (
          <div className="sbh-px-product-card" key={p.id || i}>
            {p.tagline && <p className="sbh-eyebrow">{p.tagline}</p>}
            {p.name && <h3>{p.name}</h3>}
            {p.desc && <p>{p.desc}</p>}
            {p.priceLabel && <div className="sbh-px-price">{p.priceLabel}</div>}
            <Chips items={splitChips(p.outputs)} tone="req" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExposureCalculatorBlock({ section }) {
  const f = section.fields || {};
  const categories = Array.isArray(f.categories) ? f.categories : [];
  const [arr, setArr] = useState(() => {
    const init = {};
    categories.forEach((c) => { init[c.key] = Number(c.defaultArr) || 0; });
    return init;
  });
  const [edgeCases, setEdgeCases] = useState([]);
  const [showBesty, setShowBesty] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', consent: false });
  const [submitState, setSubmitState] = useState('idle');

  function updateArr(key, value) {
    setArr((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  const results = compileHosScenarioInsights(categories, arr, edgeCases);
  const total = results.reduce((sum, r) => sum + r.exposure, 0);

  function toggleEdge(id) {
    setEdgeCases((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handoffScenario(event) {
    event.preventDefault();
    if (!contact.email || !contact.consent) return;
    setSubmitState('sending');
    const context = {
      framework: 'HandoverOS', use: 'Context analysis and scenario compilation by Betsy Salter',
      inputValues: arr, selectedEdgeCases: HOS_EDGE_CASES.filter((edge) => edgeCases.includes(edge.id)),
      compiledInsights: results, estimatedExposure: total,
      consent: { contextualAnalysis: true, marketing: false },
    };
    try {
      const response = await fetch('/api/leads/', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'scenario_assessment', name: contact.name, email: contact.email,
          message: 'Homepage HandoverOS scenario assessment submitted for contextual analysis.',
          answers: context, ctaLocation: `${window.location.pathname}#${section.id}` }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Unable to submit');
      sessionStorage.setItem('sb_hos_scenario_context', JSON.stringify(context));
      setSubmitState('sent');
      setTimeout(() => {
        setShowBesty(false);
        window.location.hash = 'bestystaff';
        window.dispatchEvent(new Event('bestystaff:open'));
      }, 650);
    } catch (error) { setSubmitState(error.message || 'Unable to submit'); }
  }

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow || 'Where revenue leaks'} heading={f.heading} intro="Some of the biggest revenue leaks are found in reconciliation challenges from pipeline to cash and revenue, where the root usually lives in operational handovers. Our product solves for your problems: estimate your leakage by ARR below, then help compile scenario data by selecting your organization’s most likely leakage culprits." />
      <div className="sbh-px-formula-grid">
        {categories.map((c, i) => (
          <div key={c.key || i}>
            <label>{c.label} ARR ($)</label>
            <input
              type="number"
              value={arr[c.key] ?? ''}
              onChange={(e) => updateArr(c.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <fieldset className="sbh-px-edge-cases">
        <legend>Which edge-case exceptions apply?</legend>
        <p>Select everything that occurs at least occasionally. These choices refine the HandoverOS risk hypotheses.</p>
        <div className="sbh-px-edge-grid">
          {HOS_EDGE_CASES.map((edge) => (
            <label key={edge.id} className={edgeCases.includes(edge.id) ? 'active' : ''}>
              <input type="checkbox" checked={edgeCases.includes(edge.id)} onChange={() => toggleEdge(edge.id)} />
              <span>{edge.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {categories.length > 0 && (
        <div className="sbh-px-results-table-wrap"><table className="sbh-px-results-table"><thead><tr><th>Leakage area</th><th>Scenario rate</th><th>Estimated exposure</th></tr></thead><tbody>
          {results.map((r, i) => (
            <tr key={r.key || i}><td>{r.label}</td><td>{r.scenarioPct.toFixed(1)}%</td><td>${Math.round(r.exposure).toLocaleString()}</td></tr>
          ))}
          <tr className="sbh-px-result-total"><th colSpan="2">Total Estimated Exposure</th><th>${Math.round(total).toLocaleString()}</th></tr>
        </tbody></table></div>
      )}
      <div className="sbh-px-scenario-handoff">
        <p><strong>Want a contextual read?</strong> Hand these inputs to Betsy for scenario compilation.</p>
        <button type="button" className="sbh-btn sbh-btn-primary" onClick={() => setShowBesty(true)}>Ask BestyStaff to compile my scenarios</button>
      </div>
      {showBesty && <div className="sbh-px-besty-modal" role="dialog" aria-modal="true" aria-label="BestyStaff scenario handoff">
        <form onSubmit={handoffScenario}>
          <button type="button" className="sbh-px-modal-close" onClick={() => setShowBesty(false)} aria-label="Close">×</button>
          <p className="sbh-eyebrow">BestyStaff · Scenario handoff</p>
          <h3>I can hand this context to Betsy.</h3>
          <p>Your values, selected exceptions, and HandoverOS-derived risk hypotheses will be stored with your lead record. Betsy will use them for contextual analysis and scenario compilation—not as audited findings or guaranteed outcomes.</p>
          <label>Name <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></label>
          <label>Email <input type="email" required value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></label>
          <label className="sbh-px-consent"><input type="checkbox" required checked={contact.consent} onChange={(e) => setContact({ ...contact, consent: e.target.checked })} /> I agree to send this scenario data to Betsy for contextual analysis and follow-up.</label>
          <button className="sbh-btn sbh-btn-primary" disabled={submitState === 'sending'}>{submitState === 'sending' ? 'Sending…' : 'Send context and continue with BestyStaff'}</button>
          {submitState !== 'idle' && submitState !== 'sending' && <p aria-live="polite">{submitState === 'sent' ? 'Context received. Opening BestyStaff…' : submitState}</p>}
        </form>
      </div>}
      {f.disclaimer && <p className="sbh-px-disclaimer">{f.disclaimer}</p>}
    </section>
  );
}

export function ApiCatalogTableBlock({ section }) {
  const f = section.fields || {};
  const apis = Array.isArray(f.apis) ? f.apis : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-panel sbh-px-table-panel">
        <table className="sbh-px-table">
          <thead>
            <tr>
              <th>System</th><th>Purpose</th><th>Auth</th><th>Setup</th><th>Cost Model</th><th>Where it's used</th>
            </tr>
          </thead>
          <tbody>
            {apis.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td>{a.purpose}</td>
                <td>{a.auth}</td>
                <td>{a.setup}</td>
                <td className="sbh-px-mono">{a.costModel}</td>
                <td>{a.journeyUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StartEngagementBlock({ section }) {
  function startDemoIntake() {
    sessionStorage.setItem('sb_product_demo_intake', JSON.stringify({
      intent: 'product_demo',
      requestedFields: ['product', 'context', 'contact'],
      startedAt: Date.now(),
    }));
    window.location.hash = 'bestystaff';
    window.dispatchEvent(new CustomEvent('bestystaff:open', { detail: { intent: 'product_demo' } }));
  }

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead
        eyebrow="Product demo"
        heading="Interested in a product demo?"
        intro="BestyStaff will help you select a product, capture your use case and context, collect contact information, and create a lead for follow-up."
      />
      <div className="sbh-px-engage">
        <button type="button" className="sbh-btn sbh-btn-primary" onClick={startDemoIntake}>
          Start product demo intake
        </button>
      </div>
    </section>
  );
}

export function PlatformCadenceBlock({ section }) {
  const f = section.fields || {};
  const schedule = Array.isArray(f.schedule) ? f.schedule : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-panel">
        <div className="sbh-px-timeline">
          {schedule.map((item, i) => (
            <div className="sbh-px-schedule-item" key={i}>
              <b>{item.cadence}</b>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConversationalDemoBlock({ section }) {
  const f = section.fields || {};
  const seed = Array.isArray(f.seedMessages) ? f.seedMessages : [];
  const [messages, setMessages] = useState(seed);
  const [input, setInput] = useState('');
  const [chips, setChips] = useState(() => splitChips(f.chipUpdates));
  const [impact, setImpact] = useState('');

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: f.replyText || 'Noted — thank you for sharing that.' }]);
      setChips((prev) => [...prev, 'New context captured']);
      setImpact(f.journeyImpactText || '');
    }, 350);
  }

  return (
    <section id={section.id} className="sbh-px-band sbh-px-band-dark">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} dark />
      <div className="sbh-px-grid2">
        <div className="sbh-px-panel sbh-px-chat">
          <div className="sbh-px-messages">
            {messages.map((m, i) => (
              <div key={i} className={`sbh-px-message sbh-px-message-${m.role}`}>{m.text}</div>
            ))}
          </div>
          <div className="sbh-px-chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask BestyStaff a question..."
            />
            <button type="button" className="sbh-btn sbh-btn-primary" onClick={send}>Send</button>
          </div>
        </div>
        <div className="sbh-px-panel">
          <h3>Conversation-to-model updates</h3>
          <Chips items={chips} tone="req" />
          {impact && <p className="sbh-px-impact">{impact}</p>}
        </div>
      </div>
    </section>
  );
}

export function SalterMomentumMethodBlock({ section }) {
  const f = section.fields || {};
  const steps = Array.isArray(f.momentumSteps) ? f.momentumSteps : [];
  return (
    <section id={section.id} className="sbh-px-band sbh-px-band-dark">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} dark />
      <div className="sbh-px-method-rail">
        {steps.map((step, i) => (
          <div className="sbh-px-method-step" key={i}>
            <span className="sbh-px-method-phase">{step.phase}</span>
            <h3>{step.label}</h3>
            {step.subtitle && <p className="sbh-eyebrow">{step.subtitle}</p>}
            <ul>
              {splitChips(step.points).map((pt, j) => <li key={j}>{pt}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {f.footnote && <p className="sbh-px-footnote">{f.footnote}</p>}
    </section>
  );
}

// Deep technical breakdown: per-methodology equations, the unified table of
// institution-configurable constants those equations depend on, and the
// agent-execution flow that runs an institution's data through them. Reuses
// existing sbh-px-* primitives (panel, table, mono, path) rather than
// inventing new CSS — see .sbh-px-table / .sbh-px-mono / .sbh-px-path in
// brand.css, already shared with ApiCatalogTableBlock and BuildFlowBlock.
export function MethodologyMathBlock({ section }) {
  const f = section.fields || {};
  const methodologies = Array.isArray(f.methodologies) ? f.methodologies : [];
  const constants = Array.isArray(f.constants) ? f.constants : [];
  const agentSteps = Array.isArray(f.agentSteps) ? f.agentSteps : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />

      <div className="sbh-px-panel-stack" style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
        {methodologies.map((m, i) => (
          <div className="sbh-px-panel" key={i}>
            <span className="sbh-eyebrow">{m.kind}</span>
            <h3>{m.name}</h3>
            {m.summary && <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(43,42,40,0.72)', marginBottom: m.formula ? '1rem' : 0 }}>{m.summary}</p>}
            {m.formula && <pre className="sbh-px-mono" style={{ whiteSpace: 'pre-wrap', background: 'rgba(43,42,40,0.05)', border: '1px solid var(--sbh-line)', borderRadius: 10, padding: '0.9rem 1.1rem', margin: 0 }}>{m.formula}</pre>}
            {m.notes && <p style={{ fontSize: '0.78rem', color: 'rgba(43,42,40,0.55)', marginTop: '0.6rem', fontStyle: 'italic' }}>{m.notes}</p>}
          </div>
        ))}
      </div>

      {constants.length > 0 && (
        <div className="sbh-px-panel sbh-px-table-panel" style={{ marginBottom: '2.5rem' }}>
          {f.constantsHeading && <h3>{f.constantsHeading}</h3>}
          <table className="sbh-px-table">
            <thead>
              <tr><th>Constant</th><th>Symbol</th><th>Lives in</th><th>Institution configures</th></tr>
            </thead>
            <tbody>
              {constants.map((c, i) => (
                <tr key={i}>
                  <td>{c.constant}</td>
                  <td className="sbh-px-mono">{c.symbol}</td>
                  <td className="sbh-px-mono">{c.location}</td>
                  <td>{c.configurableBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {agentSteps.length > 0 && (
        <div className="sbh-px-panel">
          {f.agentHeading && <h3>{f.agentHeading}</h3>}
          <div className="sbh-px-path">
            {agentSteps.map((step, i) => (
              <div className="sbh-px-path-node" key={i}>
                <b>{step.label}</b>
                <span>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {f.footnote && <p className="sbh-px-footnote" style={{ color: 'rgba(43,42,40,0.55)' }}>{f.footnote}</p>}
    </section>
  );
}

// Flat-page "marketing hooks" navigator — sits between the hero and the
// BestyStaff contact section on the homepage. Deliberately click-driven, not
// timer-driven: RotatingHighlightsBlock already covers the auto-rotating
// carousel pattern, and a second one back-to-back on the homepage is exactly
// the "overcrowded / auto-resizing" clutter this block exists to avoid. Every
// hook shares one fixed-height stage (see .sbh-px-hooks-stage /
// .sbh-px-hooks-trail in brand.css) so switching hooks or stepping through a
// simulation never changes the section's height.
export function MarketingHooksBlock({ section }) {
  const f = section.fields || {};
  const hooks = Array.isArray(f.hooks) ? f.hooks : [];
  const [activeId, setActiveId] = useState(hooks[0]?.id || null);
  const [simIndex, setSimIndex] = useState(0);

  useEffect(() => { setSimIndex(0); }, [activeId]);

  if (!hooks.length) return null;
  const active = hooks.find((h) => h.id === activeId) || hooks[0];
  const legacySteps = splitChips(active.simSteps);
  const steps = Array.isArray(active.simComparisons) && active.simComparisons.length
    ? active.simComparisons
    : legacySteps.map((step) => ({ traditional: 'A consultant documents the current state and recommends a next action.', mrs: step, differentiated: 'Salt Basin MRS keeps the step connected to configured evidence, operating context, and the maintained system.' }));
  const currentStep = simIndex > 0 ? steps[simIndex - 1] : null;
  const done = simIndex >= steps.length && steps.length > 0;

  return (
    <section id={section.id} className="sbh-px-hooks">
      <PXHead eyebrow="Explore the family" heading="Pick a product, see the hook" />
      <div className="sbh-px-hooks-rail" role="tablist" aria-label="Product hooks">
        {hooks.map((h) => (
          <button
            key={h.id}
            type="button"
            role="tab"
            aria-selected={active.id === h.id}
            className={`sbh-px-hooks-tab${active.id === h.id ? ' active' : ''}`}
            onClick={() => setActiveId(h.id)}
          >
            <span className="sbh-px-hooks-tab-label">{h.productLabel}</span>
            <span className="sbh-px-hooks-tab-hook">{h.hookLine}</span>
          </button>
        ))}
      </div>

      <div className="sbh-px-hooks-stage" key={active.id}>
        <div className="sbh-px-hooks-pitch">
          <p className="sbh-eyebrow">{active.productLabel}</p>
          <h3>{active.hookLine}</h3>
          <p>{active.teaser}</p>
          <p className="sbh-px-hooks-source">{f.intelligenceSource || 'Product intelligence informed by 12+ years across 16 client and operating environments.'}</p>
          {active.ctaLabel && (
            <a className="sbh-btn sbh-btn-secondary sbh-px-hooks-cta" href={active.ctaLink || '#bestystaff'}>{active.ctaLabel}</a>
          )}
        </div>

        {false && <div className="sbh-px-hooks-sim">
          <div className="sbh-px-hooks-sim-head">
            <span>Simulation</span>
            {steps.length > 0 && (
              <div className="sbh-px-hooks-sim-actions">
                {simIndex > 1 && (
                  <button type="button" className="sbh-px-hooks-reset" onClick={() => setSimIndex((i) => Math.max(1, i - 1))}>Previous</button>
                )}
                <button
                  type="button"
                  className="sbh-btn sbh-btn-primary"
                  onClick={() => setSimIndex((i) => (i >= steps.length ? 1 : i + 1))}
                >
                  {simIndex === 0 ? 'Run simulation' : done ? 'Restart' : 'Next comparison'}
                </button>
                {simIndex > 0 && (
                  <button type="button" className="sbh-px-hooks-reset" onClick={() => setSimIndex(0)}>Reset</button>
                )}
              </div>
            )}
          </div>
          <div className="sbh-px-hooks-trail" aria-live="polite">
            {!currentStep && (
              <p className="sbh-px-hooks-trail-empty">Click Run simulation to walk through {active.productLabel}.</p>
            )}
            {currentStep && (
              <div key={simIndex} className="sbh-px-hooks-trail-step current">
                <span>{simIndex}</span>
                <div className="sbh-px-hooks-comparison">
                  <div>
                    <small>Traditional consulting</small>
                    <p>{currentStep.traditional}</p>
                  </div>
                  <div className="sbh-px-hooks-mrs-step">
                    <small>Salt Basin MRS</small>
                    <p>{currentStep.mrs}</p>
                    <strong>Why it is different</strong>
                    <p>{currentStep.differentiated}</p>
                  </div>
                </div>
              </div>
            )}
            {currentStep && <p className="sbh-px-hooks-progress">Comparison {simIndex} of {steps.length}</p>}
          </div>
        </div>}
      </div>
      <div className="sbh-px-hooks-pathway-cta">
        <a className="sbh-btn sbh-btn-primary" href="#pathways">
          Choose your path and start your Salt Basin convergence today
        </a>
      </div>
    </section>
  );
}
