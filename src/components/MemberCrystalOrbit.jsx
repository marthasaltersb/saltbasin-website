import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import CrystalSolarSystem from './CrystalSolarSystem.jsx';
import DefinitionStudioJourney from './DefinitionStudioJourney.jsx';
import CrystalWorldCityScene from './CrystalWorldCityScene.jsx';
import FlowingJourneyDeck from './FlowingJourneyDeck.jsx';
import { api } from '../lib/api.js';
import { DEFAULT_EDGE_CARDS, provisionMemberWorlds } from '../data/memberWorldRegistry.js';
import { toast } from '../lib/toast.js';

const STORAGE_KEY = 'sb_member_orbit_preferences_v1';

function loadPreferences() {
  try { return { cards: DEFAULT_EDGE_CARDS, shortcuts: [], ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { cards: DEFAULT_EDGE_CARDS, shortcuts: [] }; }
}

function HealthPill({ value = 82 }) {
  const tone = value >= 80 ? 'healthy' : value >= 55 ? 'watch' : 'risk';
  return <span className={`mco-health ${tone}`}>{value}% healthy</span>;
}

export default function MemberCrystalOrbit({ user, onOpenWorkspace }) {
  const navigate = useNavigate();
  const [entitlements, setEntitlements] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [emails, setEmails] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [activeWorldId, setActiveWorldId] = useState(null);
  const [activeJourney, setActiveJourney] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [preferences, setPreferences] = useState(loadPreferences);
  const [newEmail, setNewEmail] = useState('');
  const [emailType, setEmailType] = useState('personal');
  const [verification, setVerification] = useState({});

  useEffect(() => {
    Promise.allSettled([api.getMemberEntitlements(), api.getMyOrganizations(), api.getMemberEmails(), api.getMyLicenses()])
      .then(([e, o, m, l]) => {
        if (e.status === 'fulfilled') setEntitlements(e.value.entitlements || e.value || []);
        if (o.status === 'fulfilled') setOrganizations(o.value.organizations || o.value || []);
        if (m.status === 'fulfilled') setEmails(m.value.emails || []);
        if (l.status === 'fulfilled') setLicenses(l.value || []);
      });
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }, [preferences]);

  const worlds = useMemo(() => provisionMemberWorlds({ user, entitlements, organizations }), [user, entitlements, organizations]);
  const activeWorld = worlds.find((world) => world.id === activeWorldId) || null;

  function enterWorld(world) {
    if (world.id === 'account') { setAccountOpen(true); return; }
    setActiveJourney(null);
    setActiveVariant(null);
    setActiveWorldId(world.id);
  }

  function launchVariant(variant) {
    if (variant.action === 'account') { setAccountOpen(true); return; }
    const orgId = activeWorld?.organization?.id;
    const workspaceScope = activeWorld?.id === 'salt-basin' ? 'admin' : 'member';
    onOpenWorkspace(variant.tab || 'content', orgId, workspaceScope);
  }

  async function addEmail(event) {
    event.preventDefault();
    try {
      const result = await api.addMemberEmail(newEmail, emailType);
      setEmails((items) => [...items, result]); setNewEmail(''); toast.success('Verification code sent');
    } catch (error) { toast.error(error.message); }
  }

  async function verifyEmail(id) {
    try {
      await api.verifyMemberEmail(id, verification[id]);
      setEmails((items) => items.map((item) => item.id === id ? { ...item, verified: true } : item));
      toast.success('Email verified');
    } catch (error) { toast.error(error.message); }
  }

  const visibleCards = preferences.cards.filter((card) => card.enabled);
  return <main className="mco-shell">
    <header className="mco-topbar">
      <button type="button" className="mco-brand" onClick={() => { setActiveWorldId(null); setActiveJourney(null); }}>SALT BASIN <span>CRYSTAL ORBIT</span></button>
      <div className="mco-top-actions">
        <button type="button" onClick={() => setCustomizeOpen(true)}>Shape my home</button>
        <button type="button" onClick={() => setAccountOpen(true)}>{user?.displayName || user?.email || 'My account'}</button>
      </div>
    </header>

    {activeJourney?.id === 'definition-to-operation' ? <DefinitionStudioJourney onClose={() => setActiveJourney(null)} onOpenStudio={() => launchVariant(activeWorld.variants.find((variant) => variant.id === 'definition-studio'))} /> : !activeWorld ? <section className="mco-orbit-scene" aria-label="Member crystal worlds">
      <div className="mco-scene-copy"><span>YOUR PROVISIONED UNIVERSE</span><h1>Choose a world.</h1><p>Every crystal is one governed operating context. Its orbiting variants are the capabilities you can enter directly.</p></div>
      <CrystalSolarSystem worlds={worlds} memberLabel={user?.displayName?.split(' ')[0] || 'Member'} onEnterWorld={enterWorld} />
      <nav className="mco-accessible-worlds" aria-label="Available worlds">{worlds.map((world) => <button type="button" key={world.id} onClick={() => enterWorld(world)}>{world.label}</button>)}</nav>
      <div className="mco-edge-cards left">{visibleCards.slice(0, 2).map((card) => <EdgeCard key={card.id} card={card} collapsed={collapsed[card.id]} onToggle={() => setCollapsed((v) => ({ ...v, [card.id]: !v[card.id] }))} />)}</div>
      <div className="mco-edge-cards right">{visibleCards.slice(2).map((card) => <EdgeCard key={card.id} card={card} collapsed={collapsed[card.id]} onToggle={() => setCollapsed((v) => ({ ...v, [card.id]: !v[card.id] }))} />)}</div>
    </section> : <WorldCity world={activeWorld} activeJourney={activeJourney} setActiveJourney={setActiveJourney} activeVariant={activeVariant} setActiveVariant={setActiveVariant} onBack={() => { setActiveWorldId(null); setActiveJourney(null); setActiveVariant(null); }} onLaunch={launchVariant} />}

    <button type="button" className="mco-besty" onClick={() => setAgentOpen((v) => !v)} aria-expanded={agentOpen}><SaltBasinCrystal size="orbit" variant="engine" /><span>BestyStaff</span></button>
    {agentOpen && <aside className="mco-agent-panel"><button type="button" onClick={() => setAgentOpen(false)}>Close</button><span>CONTEXTUAL GUIDANCE</span><h2>BestyStaff is in this world with you.</h2><p>I can explain the selected capability, trace its definitions and evidence, prepare an agent action, or guide you through the next journey gate.</p><div className="mco-agent-prompts"><button>What needs my review?</button><button>Explain this worldâ€™s health</button><button>Continue my highest-priority journey</button></div></aside>}
    {accountOpen && <AccountDrawer user={user} emails={emails} licenses={licenses} organizations={organizations} newEmail={newEmail} setNewEmail={setNewEmail} emailType={emailType} setEmailType={setEmailType} verification={verification} setVerification={setVerification} addEmail={addEmail} verifyEmail={verifyEmail} onClose={() => setAccountOpen(false)} onCustomize={() => { setAccountOpen(false); setCustomizeOpen(true); }} />}
    {customizeOpen && <CustomizeDrawer worlds={worlds} preferences={preferences} setPreferences={setPreferences} onClose={() => setCustomizeOpen(false)} />}
  </main>;
}

function EdgeCard({ card, collapsed, onToggle }) {
  return <article className={`mco-edge-card${collapsed ? ' collapsed' : ''}`}><button type="button" onClick={onToggle} aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${card.label}`}>{collapsed ? '+' : 'âˆ’'}</button><span>{card.label}</span><strong>{card.value}</strong>{!collapsed && <p>{card.detail}</p>}</article>;
}

function WorldCity({ world, activeJourney, setActiveJourney, activeVariant, setActiveVariant, onBack, onLaunch }) {
  const [journeyStep, setJourneyStep] = useState(0);
  function selectVariant(variant) {
    const definitionJourney = world.journeys.find((journey) => journey.id === 'definition-to-operation');
    if (definitionJourney && (variant.id === 'definition-studio' || variant.id === 'org-definition')) {
      setJourneyStep(0); setActiveVariant(null); setActiveJourney(definitionJourney); return;
    }
    const careerJourney = variant.id === 'career' && world.journeys.find((journey) => journey.id === 'career-foundation');
    const resumeJourney = variant.id === 'outputs' && world.journeys.find((journey) => journey.id === 'resume-to-portfolio');
    const placementJourney = variant.id === 'career-agents' && world.journeys.find((journey) => journey.id === 'career-placement');
    if (careerJourney || resumeJourney || placementJourney) {
      setJourneyStep(0); setActiveVariant(null); setActiveJourney(careerJourney || resumeJourney || placementJourney); return;
    }
    setActiveVariant(variant);
  }
  return <section className={`mco-city-scene${activeJourney ? ' journey-active' : ''}`} style={{ '--accent': world.accent }}>
    <CrystalWorldCityScene world={world} />
    <div className="mco-city-sky" /><header><button type="button" onClick={onBack}>â† All worlds</button><div><span>{world.shortLabel} world</span><h1>{world.label}</h1><p>{world.description}</p></div><HealthPill /></header>
    <div className="mco-river river-one" /><div className="mco-river river-two" />
    <div className="mco-city-grid">{world.variants.map((variant, index) => <button type="button" key={variant.id} className={`mco-building${activeVariant?.id === variant.id ? ' active' : ''}`} style={{ '--h': `${100 + (index % 4) * 34}px`, '--delay': `${index * 60}ms` }} onClick={() => selectVariant(variant)}>
      <span className="mco-building-crystal"><SaltBasinCrystal size="orbit" variant={index % 2 ? 'rings' : 'engine'} /></span><i /><b>{variant.icon}</b><strong>{variant.label}</strong><small>{72 + ((index * 7) % 27)}% mature / {2 + index} agents</small>
    </button>)}</div>
    <aside className="mco-journey-dock"><span>FLOWING JOURNEYS</span>{world.journeys.map((journey) => <button key={journey.id} type="button" className={activeJourney?.id === journey.id ? 'active' : ''} onClick={() => { setJourneyStep(0); setActiveJourney(journey); }}>{journey.label}<small>{journey.stages.length} gates</small></button>)}</aside>
    {activeJourney && <FlowingJourneyDeck journey={activeJourney} world={world} onClose={() => setActiveJourney(null)} onOpenTools={() => onLaunch(world.variants.find((variant) => activeJourney.id === 'resume-to-portfolio' ? variant.id === 'outputs' : activeJourney.id === 'career-placement' || activeJourney.id === 'application-pipeline' ? variant.id === 'career-agents' : variant.id === 'career') || world.variants[0])} />}
    {activeVariant && !activeJourney && <SpatialWorkspace variant={activeVariant} journeys={world.journeys} onClose={() => setActiveVariant(null)} onLaunch={() => onLaunch(activeVariant)} onJourney={(journey) => { setJourneyStep(0); setActiveJourney(journey); }} />}
    {activeJourney && <div className="mco-journey-motion" style={{ '--journey-step': journeyStep, '--journey-count': Math.max(activeJourney.stages.length - 1, 1) }}><span /></div>}
    <aside className="mco-world-legend"><span>WORLD SYSTEMS</span><b>{world.variants.length} capability districts</b><b>{world.journeys.length} active rivers</b><b>{world.variants.length * 3} governed agents</b></aside>
    <footer className="mco-world-kpis"><article><span>MATURITY</span><strong>0.82</strong></article><article><span>DATA INTEGRITY</span><strong>98.7%</strong></article><article><span>LIVE DEFINITIONS</span><strong>{world.variants.length * 12}</strong></article><article><span>REVIEW QUEUE</span><strong>7</strong></article></footer>
  </section>;
}

function SpatialWorkspace({ variant, journeys, onClose, onLaunch, onJourney }) {
  const [collapsed, setCollapsed] = useState(false);
  return <section className={`mco-spatial-workspace${collapsed ? ' collapsed' : ''}`}>
    <header><div><span>SPATIAL WORKSPACE</span><h2>{variant.label}</h2>{!collapsed && <p>Live scene, operational intelligence, records, agents, and journeys remain connected.</p>}</div><div><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand workspace panel' : 'Collapse workspace panel'}>{collapsed ? '+' : '-'}</button><button type="button" onClick={onClose}>X</button></div></header>
    {!collapsed && <>
    <div className="mco-workspace-cards">{[['Health','84%'],['Maturity','3.8'],['Agents','4'],['Reviews','7']].map(([label,value]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>Live configured signal</small></article>)}</div>
    <div className="mco-workspace-body"><div><h3>Connected records</h3>{[['DEF-1042','Definition coverage'],['AGT-0087','Agent output'],['APR-0214','Approval convergence']].map(([id,label]) => <button type="button" key={id}><b>{id}</b><span>{label}</span><i>Open</i></button>)}</div><aside><h3>Spatial journeys</h3>{journeys.map((journey) => <button type="button" key={journey.id} onClick={() => onJourney(journey)}>{journey.label}<span>{journey.stages.length} animated gates</span></button>)}<button type="button" className="mco-detail-tools" onClick={onLaunch}>Open detailed tools in this context</button></aside></div>
    </>}
  </section>;
}

function AccountDrawer({ user, emails, licenses, organizations, newEmail, setNewEmail, emailType, setEmailType, verification, setVerification, addEmail, verifyEmail, onClose, onCustomize }) {
  return <aside className="mco-drawer wide"><header><div><span>ACCOUNT CRYSTAL</span><h2>Member account settings</h2></div><button type="button" onClick={onClose}>Close</button></header><div className="mco-account-grid">
    <section><h3>Identity & verified emails</h3><p className="mco-muted">{user?.displayName || 'Salt Basin Member'} / {user?.role || 'member'}</p>{emails.map((email) => <div className="mco-email-row" key={email.id}><div><strong>{email.email}</strong><span>{email.type} / {email.verified ? 'Verified' : 'Verification pending'}</span></div>{!email.verified && <div><input aria-label="Verification code" placeholder="6-digit code" value={verification[email.id] || ''} onChange={(e) => setVerification((v) => ({ ...v, [email.id]: e.target.value }))}/><button type="button" onClick={() => verifyEmail(email.id)}>Verify</button></div>}</div>)}<form onSubmit={addEmail} className="mco-inline-form"><input type="email" required placeholder="Add another email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}/><select value={emailType} onChange={(e) => setEmailType(e.target.value)}><option value="personal">Personal</option><option value="work">Work</option></select><button>Add & verify</button></form></section>
    <section><h3>Payment & sponsoring accounts</h3><div className="mco-setting-card"><strong>Direct purchase methods</strong><span>Managed through secure checkout when a paid plan is selected.</span><button type="button" disabled>Add payment method / coming next</button></div>{organizations.length ? organizations.map((org) => <div className="mco-setting-card" key={org.id}><strong>{org.name}</strong><span>Linked entitlement organization / organization-sponsored access</span></div>) : <p className="mco-muted">No sponsoring organization is linked yet.</p>}</section>
    <section><h3>Subscriptions & licensed modules</h3>{licenses.length ? licenses.map((license) => <div className="mco-license" key={license.id || license.license_id}><span>{license.product_id || license.productId || 'Salt Basin module'}</span><strong>{license.tier || license.access_mode || 'Active'}</strong></div>) : <div className="mco-setting-card"><strong>Career Foundation</strong><span>Provisioned member baseline / active</span></div>}<button type="button" className="mco-text-action" onClick={onCustomize}>Configure home shortcuts and cards</button></section>
    <section><h3>Security & approvals</h3><div className="mco-setting-card"><strong>Journey permissions</strong><span>Collaboration invitations and agent actions inherit world, organization, capability, and record-level permission checks.</span></div><button type="button" className="mco-text-action">Change password in security workspace â†’</button></section>
  </div></aside>;
}

function CustomizeDrawer({ worlds, preferences, setPreferences, onClose }) {
  function toggleCard(id) { setPreferences((p) => ({ ...p, cards: p.cards.map((card) => card.id === id ? { ...card, enabled: !card.enabled } : card) })); }
  function toggleShortcut(id) { setPreferences((p) => ({ ...p, shortcuts: p.shortcuts.includes(id) ? p.shortcuts.filter((item) => item !== id) : [...p.shortcuts, id] })); }
  return <aside className="mco-drawer"><header><div><span>HOME CONFIGURATION</span><h2>Shape your orbit</h2></div><button type="button" onClick={onClose}>Close</button></header><section><h3>Edge dashboard cards</h3>{preferences.cards.map((card) => <label className="mco-toggle-row" key={card.id}><div><strong>{card.label}</strong><span>{card.detail}</span></div><input type="checkbox" checked={card.enabled} onChange={() => toggleCard(card.id)} /></label>)}</section><section><h3>Shortcut crystals</h3>{worlds.flatMap((world) => world.variants.map((variant) => ({ ...variant, world: world.label }))).slice(0, 14).map((variant) => <label className="mco-toggle-row" key={`${variant.world}-${variant.id}`}><div><strong>{variant.label}</strong><span>{variant.world}</span></div><input type="checkbox" checked={preferences.shortcuts.includes(variant.id)} onChange={() => toggleShortcut(variant.id)} /></label>)}</section></aside>;
}
