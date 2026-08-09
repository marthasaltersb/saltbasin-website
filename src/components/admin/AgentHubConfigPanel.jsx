import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';

const list = (value) => String(value || '').split('\n').map((v) => v.trim()).filter(Boolean);
const text = (value) => Array.isArray(value) ? value.join('\n') : '';
const starterConfig = () => ({
  deployment: { saltBasinSite: false, memberSubpage: true, externalEmbed: false },
  identity: { name: 'Lead Intake Agent', organizationName: '', ownerName: '', disclosure: 'I am an AI agent acting on behalf of this organization.' },
  conversation: { deferredResponseMs: 650, loopBack: { enabled: true, afterTurns: 6, prompt: 'Before we wrap up, did you get all of your questions answered?' }, memory: { enabled: true, maxHistoryTurns: 24, capture: ['businessNeed', 'desiredOutcome', 'contact', 'consent', 'openQuestions'] } },
  llm: { mode: 'conditional', required: false, provider: 'anthropic', model: 'claude-sonnet-4-5', purpose: '', maxOutputTokensPerResponse: 4096, tokenCap: 500000, capPeriod: 'month', maxToolIterations: 5 },
  emailPolicy: { requirePersonalEmail: false, allowedDomains: [], blockedDomains: [], notifyScopeUsers: true },
  actions: { createLead: true, createRequest: true, sendNotifications: true },
  journey: { introQuestions: [], inferredPaths: [], alternativeQuestions: [] },
  guardrails: [], instructions: '',
});

const blank = { key: '', publicKey: '', label: '', description: '', kind: 'lead_intake', executionMode: 'interactive', scopeType: 'platform', scopeId: '', scheduleCron: '0 3 * * *', enabled: false, autoBranch: false, config: starterConfig() };
const box = { padding: '1rem 1.2rem', marginTop: '.8rem' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '.75rem' };
const check = { display: 'flex', alignItems: 'center', gap: '.4rem' };

function Field({ label, children }) { return <label style={{ display: 'grid', gap: '.3rem', fontSize: '.82rem' }}>{label}{children}</label>; }
function Checks({ value, onChange, items }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>{items.map(([key, label]) => <label key={key} style={check}><input type="checkbox" checked={!!value?.[key]} onChange={(e) => onChange({ ...value, [key]: e.target.checked })} />{label}</label>)}</div>;
}

function JourneyLane({ label, value = [], onChange, placeholder }) {
  function update(index, next) { onChange(value.map((item, i) => i === index ? next : item)); }
  return <section className="mco-setting-card" style={{ padding: '1rem', minWidth: 0 }}>
    <span style={{ fontSize: '.68rem', letterSpacing: '.12em', color: 'var(--sb-admin-text-soft)' }}>CONFIGURABLE JOURNEY</span>
    <h3 style={{ margin: '.25rem 0 .8rem' }}>{label}</h3>
    <div className="mco-journey-path" style={{ position: 'relative', inset: 'auto', width: '100%', transform: 'none', padding: '.7rem', overflowX: 'auto' }}><div>
      {value.map((stage, index) => <React.Fragment key={`${label}-${index}`}><div style={{ display: 'grid', gap: '.3rem', minWidth: 170 }}><button type="button" className={index === 0 ? 'current' : ''}><b>{index + 1}</b><span>{stage || `Stage ${index + 1}`}</span></button><input className="sb-input" aria-label={`${label} stage ${index + 1}`} value={stage} onChange={(e) => update(index, e.target.value)} /><button type="button" className="sb-btn-outline" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</button></div>{index < value.length - 1 && <i />}</React.Fragment>)}
      {!value.length && <p style={{ margin: 0, color: 'var(--sb-admin-text-soft)' }}>No stages yet. Add the first journey node.</p>}
    </div></div>
    <button type="button" className="sb-btn-outline" style={{ marginTop: '.65rem' }} onClick={() => onChange([...value, placeholder])}>+ Add journey node</button>
  </section>;
}

function DefinitionEditor({ definition, onSaved }) {
  const [draft, setDraft] = useState(definition);
  const cfg = { ...starterConfig(), ...(draft.config || {}) };
  const setCfg = (key, value) => setDraft({ ...draft, config: { ...cfg, [key]: value } });
  async function save() {
    try { await api.updateAgentHubDefinition(draft.id, draft); toast.success(`${draft.label} saved`); onSaved(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove() {
    if (!window.confirm(`Delete agent "${draft.label}"?`)) return;
    try { await api.deleteAgentHubDefinition(draft.id); onSaved(); } catch (e) { toast.error(e.message); }
  }
  return <details className="sb-card" style={box} open={definition.publicKey === 'bestystaff'}>
    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{definition.label} <span style={{ fontWeight: 400, color: 'var(--sb-admin-text-soft)' }}>· {definition.executionMode} · {definition.scopeType}</span></summary>
    <div style={{ ...grid, marginTop: '1rem' }}>
      <Field label="Name"><input className="sb-input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></Field>
      <Field label="Public deployment key"><input className="sb-input" value={draft.publicKey || ''} onChange={(e) => setDraft({ ...draft, publicKey: e.target.value })} placeholder="acme-lead-agent" /></Field>
      <Field label="Execution mode"><select className="sb-input" value={draft.executionMode} onChange={(e) => setDraft({ ...draft, executionMode: e.target.value })}><option value="interactive">User-facing chat</option><option value="internal_chat">Internal configuration chat</option><option value="scheduled">Scheduled autonomous</option></select></Field>
      <Field label="Scope"><select className="sb-input" value={draft.scopeType} disabled><option value="platform">Salt Basin platform</option><option value="organization">Member organization</option><option value="member">Member</option></select></Field>
    </div>
    {draft.executionMode === 'scheduled' && <div style={{ ...grid, marginTop: '.75rem' }}><Field label="Schedule (cron)"><input className="sb-input" value={draft.scheduleCron || ''} onChange={(e) => setDraft({ ...draft, scheduleCron: e.target.value })} /></Field></div>}
    {draft.executionMode !== 'interactive' && <><h3>LLM governance</h3><div className="mco-account-grid">
      <section className="mco-setting-card"><span>LLM POSTURE</span><strong>{cfg.llm?.mode === 'none' ? 'Deterministic · no LLM' : cfg.llm?.mode === 'conditional' ? 'Static first · conditional LLM' : 'LLM required'}</strong><Field label="LLM use"><select className="sb-input" value={cfg.llm?.mode || 'none'} onChange={(e) => setCfg('llm', { ...cfg.llm, mode: e.target.value, required: e.target.value !== 'none' })}><option value="none">Never · deterministic only</option><option value="conditional">Conditional escalation</option><option value="required">Required</option></select></Field></section>
      <section className="mco-setting-card"><span>CURRENT MODEL</span><strong>{cfg.llm?.mode === 'none' ? 'No model' : `${cfg.llm?.provider || 'anthropic'} · ${cfg.llm?.model || 'not selected'}`}</strong><Field label="Provider"><select className="sb-input" disabled={cfg.llm?.mode === 'none'} value={cfg.llm?.provider || 'anthropic'} onChange={(e) => setCfg('llm', { ...cfg.llm, provider: e.target.value })}><option value="anthropic">Anthropic</option><option value="openai">OpenAI · connection required</option></select></Field><Field label="Model ID"><input className="sb-input" disabled={cfg.llm?.mode === 'none'} value={cfg.llm?.model || ''} onChange={(e) => setCfg('llm', { ...cfg.llm, model: e.target.value })} /></Field></section>
      <section className="mco-setting-card"><span>PERIOD USAGE</span><strong>{Number(definition.llmUsage?.totalTokens || 0).toLocaleString()} / {Number(cfg.llm?.tokenCap || 0).toLocaleString()} tokens</strong><p>{definition.llmUsage?.requestCount || 0} calls · {definition.llmUsage?.periodKey || 'current period'}</p><Field label="Token cap"><input className="sb-input" type="number" min="0" value={cfg.llm?.tokenCap || 0} onChange={(e) => setCfg('llm', { ...cfg.llm, tokenCap: Number(e.target.value) })} /></Field><Field label="Period"><select className="sb-input" value={cfg.llm?.capPeriod || 'month'} onChange={(e) => setCfg('llm', { ...cfg.llm, capPeriod: e.target.value })}><option value="day">Daily</option><option value="month">Monthly</option><option value="year">Yearly</option></select></Field></section>
      <section className="mco-setting-card"><span>CALL BOUNDARY</span><strong>{Number(cfg.llm?.maxOutputTokensPerResponse || 0).toLocaleString()} output tokens</strong><Field label="Max output per call"><input className="sb-input" type="number" min="256" max="16384" value={cfg.llm?.maxOutputTokensPerResponse || 4096} onChange={(e) => setCfg('llm', { ...cfg.llm, maxOutputTokensPerResponse: Number(e.target.value) })} /></Field></section>
    </div><div className="mco-setting-card" style={{ padding: '1rem', marginTop: '.8rem' }}><Field label="Why this agent may use an LLM"><textarea className="sb-input" rows="3" value={cfg.llm?.purpose || ''} onChange={(e) => setCfg('llm', { ...cfg.llm, purpose: e.target.value })} /></Field></div></>}
    {draft.executionMode === 'interactive' && <>
      <h3>Identity and deployment</h3>
      <div style={grid}>
        <Field label="Agent display name"><input className="sb-input" value={cfg.identity?.name || ''} onChange={(e) => setCfg('identity', { ...cfg.identity, name: e.target.value })} /></Field>
        <Field label="Organization name"><input className="sb-input" value={cfg.identity?.organizationName || ''} onChange={(e) => setCfg('identity', { ...cfg.identity, organizationName: e.target.value })} /></Field>
        <Field label="Human / team owner"><input className="sb-input" value={cfg.identity?.ownerName || ''} onChange={(e) => setCfg('identity', { ...cfg.identity, ownerName: e.target.value })} /></Field>
        <Field label="AI disclosure"><input className="sb-input" value={cfg.identity?.disclosure || ''} onChange={(e) => setCfg('identity', { ...cfg.identity, disclosure: e.target.value })} /></Field>
      </div>
      <div style={{ marginTop: '.75rem' }}><Checks value={cfg.deployment} onChange={(v) => setCfg('deployment', v)} items={[["saltBasinSite","Salt Basin site"],["memberSubpage","Member sub-page"],["externalEmbed","External ecommerce embed"]]} /></div>
      <h3>LLM governance</h3>
      <div className="mco-account-grid" style={{ marginBottom: '1rem' }}>
        <section className="mco-setting-card"><span>LLM POSTURE</span><strong>{cfg.llm?.mode === 'none' ? 'Deterministic · no LLM' : cfg.llm?.mode === 'conditional' ? 'Static first · conditional LLM' : 'LLM required'}</strong><Field label="When may this agent call an LLM?"><select className="sb-input" value={cfg.llm?.mode || (cfg.llm?.required === false ? 'none' : 'required')} onChange={(e) => setCfg('llm', { ...cfg.llm, mode: e.target.value, required: e.target.value !== 'none' })}><option value="none">Never · deterministic only</option><option value="conditional">Only after static/rule checks require escalation</option><option value="required">Required for responses or actions</option></select></Field></section>
        <section className="mco-setting-card"><span>CURRENT MODEL</span><strong>{cfg.llm?.mode === 'none' ? 'No model' : `${cfg.llm?.provider || 'anthropic'} · ${cfg.llm?.model || 'not selected'}`}</strong><Field label="Provider"><select className="sb-input" disabled={cfg.llm?.mode === 'none'} value={cfg.llm?.provider || 'anthropic'} onChange={(e) => setCfg('llm', { ...cfg.llm, provider: e.target.value })}><option value="anthropic">Anthropic</option><option value="openai">OpenAI · runtime connection required</option></select></Field><Field label="Model ID"><input className="sb-input" disabled={cfg.llm?.mode === 'none'} value={cfg.llm?.model || ''} onChange={(e) => setCfg('llm', { ...cfg.llm, model: e.target.value })} /></Field></section>
        <section className="mco-setting-card"><span>PERIOD USAGE</span><strong>{Number(definition.llmUsage?.totalTokens || 0).toLocaleString()} / {Number(cfg.llm?.tokenCap || 0).toLocaleString() || 'Unlimited'} tokens</strong><p>{definition.llmUsage?.requestCount || 0} calls in {definition.llmUsage?.periodKey || 'this period'}</p><Field label="Token cap"><input className="sb-input" type="number" min="0" value={cfg.llm?.tokenCap || 0} onChange={(e) => setCfg('llm', { ...cfg.llm, tokenCap: Number(e.target.value) })} /></Field><Field label="Cap period"><select className="sb-input" value={cfg.llm?.capPeriod || 'month'} onChange={(e) => setCfg('llm', { ...cfg.llm, capPeriod: e.target.value })}><option value="day">Daily</option><option value="month">Monthly</option><option value="year">Yearly</option></select></Field></section>
        <section className="mco-setting-card"><span>RESPONSE BOUNDARY</span><strong>{Number(cfg.llm?.maxOutputTokensPerResponse || 0).toLocaleString()} max output tokens</strong><Field label="Max output tokens per response"><input className="sb-input" type="number" min="256" max="16384" value={cfg.llm?.maxOutputTokensPerResponse || 4096} onChange={(e) => setCfg('llm', { ...cfg.llm, maxOutputTokensPerResponse: Number(e.target.value) })} /></Field><Field label="Max tool iterations"><input className="sb-input" type="number" min="1" max="20" value={cfg.llm?.maxToolIterations || 5} onChange={(e) => setCfg('llm', { ...cfg.llm, maxToolIterations: Number(e.target.value) })} /></Field></section>
      </div>
      <div className="mco-setting-card" style={{ padding: '1rem' }}><Field label="Why this agent is allowed to use an LLM"><textarea className="sb-input" rows="3" value={cfg.llm?.purpose || ''} onChange={(e) => setCfg('llm', { ...cfg.llm, purpose: e.target.value })} /></Field></div>
      <h3>Journey map</h3>
      <div style={{ display: 'grid', gap: '.8rem' }}>
        <JourneyLane label="Opening and intro questions" value={cfg.journey?.introQuestions || []} placeholder="Ask the next opening question" onChange={(v) => setCfg('journey', { ...cfg.journey, introQuestions: v })} />
        <JourneyLane label="Inferred visitor paths" value={cfg.journey?.inferredPaths || []} placeholder="When signal → enter path" onChange={(v) => setCfg('journey', { ...cfg.journey, inferredPaths: v })} />
        <JourneyLane label="Alternative and loop-back questions" value={cfg.journey?.alternativeQuestions || []} placeholder="Ask an alternative question" onChange={(v) => setCfg('journey', { ...cfg.journey, alternativeQuestions: v })} />
      </div>
      <div className="mco-setting-card" style={{ padding: '1rem', marginTop: '.8rem' }}><Field label="Guardrail cards · one rule per line"><textarea className="sb-input" rows="5" value={text(cfg.guardrails)} onChange={(e) => setCfg('guardrails', list(e.target.value))} /></Field></div>
      <Field label="Additional operating instructions"><textarea className="sb-input" rows="4" value={cfg.instructions || ''} onChange={(e) => setCfg('instructions', e.target.value)} /></Field>
      <h3>Conversation behavior</h3>
      <div style={grid}>
        <Field label="Deferred response window (ms)"><input className="sb-input" type="number" min="0" max="10000" value={cfg.conversation?.deferredResponseMs ?? 650} onChange={(e) => setCfg('conversation', { ...cfg.conversation, deferredResponseMs: Number(e.target.value) })} /></Field>
        <Field label="Loop back after turns"><input className="sb-input" type="number" min="1" value={cfg.conversation?.loopBack?.afterTurns ?? 6} onChange={(e) => setCfg('conversation', { ...cfg.conversation, loopBack: { ...cfg.conversation?.loopBack, afterTurns: Number(e.target.value) } })} /></Field>
        <Field label="Memory history turns"><input className="sb-input" type="number" min="0" max="100" value={cfg.conversation?.memory?.maxHistoryTurns ?? 24} onChange={(e) => setCfg('conversation', { ...cfg.conversation, memory: { ...cfg.conversation?.memory, maxHistoryTurns: Number(e.target.value) } })} /></Field>
        <Field label="Memory capture keys · one per line"><textarea className="sb-input" rows="3" value={text(cfg.conversation?.memory?.capture)} onChange={(e) => setCfg('conversation', { ...cfg.conversation, memory: { ...cfg.conversation?.memory, capture: list(e.target.value) } })} /></Field>
      </div>
      <Field label="Loop-back prompt"><input className="sb-input" value={cfg.conversation?.loopBack?.prompt || ''} onChange={(e) => setCfg('conversation', { ...cfg.conversation, loopBack: { ...cfg.conversation?.loopBack, prompt: e.target.value } })} /></Field>
      <div style={{ marginTop: '.75rem' }}><Checks value={{ loopBack: cfg.conversation?.loopBack?.enabled, memory: cfg.conversation?.memory?.enabled }} onChange={(v) => setCfg('conversation', { ...cfg.conversation, loopBack: { ...cfg.conversation?.loopBack, enabled: v.loopBack }, memory: { ...cfg.conversation?.memory, enabled: v.memory } })} items={[["loopBack","Loop-back enabled"],["memory","Memory enabled"]]} /></div>
      <h3>Lead routing and email policy</h3>
      <div style={grid}>
        <Field label="Allowed email domains · blank means any"><textarea className="sb-input" rows="3" value={text(cfg.emailPolicy?.allowedDomains)} onChange={(e) => setCfg('emailPolicy', { ...cfg.emailPolicy, allowedDomains: list(e.target.value) })} /></Field>
        <Field label="Blocked email domains"><textarea className="sb-input" rows="3" value={text(cfg.emailPolicy?.blockedDomains)} onChange={(e) => setCfg('emailPolicy', { ...cfg.emailPolicy, blockedDomains: list(e.target.value) })} /></Field>
      </div>
      <div style={{ marginTop: '.75rem' }}><Checks value={{ ...cfg.emailPolicy, ...cfg.actions }} onChange={(v) => { setCfg('emailPolicy', { ...cfg.emailPolicy, requirePersonalEmail: v.requirePersonalEmail, notifyScopeUsers: v.notifyScopeUsers }); setDraft((d) => ({ ...d, config: { ...d.config, actions: { ...cfg.actions, createLead: v.createLead, createRequest: v.createRequest, sendNotifications: v.sendNotifications } } })); }} items={[["requirePersonalEmail","Require personal email"],["notifyScopeUsers","Notify scoped users"],["createLead","Create lead"],["createRequest","Create request"],["sendNotifications","Send email actions"]]} /></div>
    </>}
    <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}><button className="sb-btn sb-btn-gold" onClick={save}>Save agent</button><button className="sb-btn-outline" onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}>{draft.enabled ? 'Enabled' : 'Disabled'}</button><button className="sb-btn-outline" onClick={remove}>Delete</button></div>
  </details>;
}

export default function AgentHubConfigPanel({ scope = 'admin', orgId = null }) {
  const [definitions, setDefinitions] = useState(null);
  const [form, setForm] = useState(blank);
  const [selectedId, setSelectedId] = useState(null);
  const scopeType = scope === 'org-admin' ? 'organization' : scope === 'member' ? 'member' : 'platform';
  const load = () => api.getAgentHubDefinitions(scopeType, orgId).then((d) => setDefinitions(d.definitions)).catch((e) => toast.error(e.message));
  useEffect(load, [scopeType, orgId]);
  async function create(e) { e.preventDefault(); try { await api.createAgentHubDefinition({ ...form, scopeType, scopeId: scopeType === 'organization' ? Number(orgId) : (form.scopeId ? Number(form.scopeId) : null) }); toast.success('Agent created'); setForm({ ...blank, scopeType }); load(); } catch (err) { toast.error(err.message); } }
  if (!definitions) return <div style={{ padding: '2rem' }}>Loading agents…</div>;
  const selected = definitions.find((d) => d.id === selectedId) || definitions[0] || null;
  return <div style={{ padding: '2rem', overflowY: 'auto', width: '100%' }}>
    <h1 style={{ marginTop: 0 }}>Agent configuration</h1>
    <p style={{ color: 'var(--sb-admin-text-soft)', maxWidth: 850 }}>Configure user-facing chat agents, internal configuration assistants, and scheduled autonomous agents in one place. Interactive agents are event-driven by chat and never inherit a schedule.</p>
    <section className="mco-orbit-scene" style={{ minHeight: 470, borderRadius: 18, overflow: 'hidden' }} aria-label="Configured agent worlds">
      <div className="mco-scene-copy"><span>AGENT UNIVERSE</span><h1>Choose an agent world.</h1><p>Each crystal is a governed scope. Enter it to shape journeys, actions, memory, timing, and deployment variants.</p></div>
      <div className="mco-world-system" style={{ '--world-count': Math.max(definitions.length, 1) }}><div className="mco-orbit-ring ring-a" /><div className="mco-orbit-ring ring-b" />
        {definitions.map((agent, index) => <button key={agent.id} type="button" className={`mco-world-node world-${index % 6}`} style={{ '--i': index, '--accent': agent.executionMode === 'interactive' ? '#C4843A' : agent.executionMode === 'internal_chat' ? '#785D69' : '#4A7C8E' }} onClick={() => setSelectedId(agent.id)}><SaltBasinCrystal size="orbit" variant={agent.executionMode === 'interactive' ? 'engine' : agent.executionMode === 'internal_chat' ? 'rings' : 'hourglass'} /><strong>{agent.label}</strong><span>{agent.executionMode === 'interactive' ? 'Live conversation' : agent.executionMode === 'internal_chat' ? 'Internal guide' : 'Autonomous schedule'}</span></button>)}
        {selected && <button type="button" className="mco-center-crystal" onClick={() => setSelectedId(selected.id)}><SaltBasinCrystal size="hero" variant={selected.executionMode === 'scheduled' ? 'hourglass' : 'rings'} /><b>{selected.label}</b><span>Enter agent world</span></button>}
      </div>
      <div className="mco-edge-cards left"><article className="mco-edge-card"><span>Interactive agents</span><strong>{definitions.filter((d) => d.executionMode === 'interactive').length}</strong><p>Respond to live visitor messages</p></article></div>
      <div className="mco-edge-cards right"><article className="mco-edge-card"><span>Autonomous agents</span><strong>{definitions.filter((d) => d.executionMode === 'scheduled').length}</strong><p>Run by governed schedule</p></article></div>
    </section>
    <section className="sb-card" style={box}><h2 style={{ marginTop: 0 }}>Provision a new agent world</h2><form onSubmit={create} style={grid}>
      <Field label="Key"><input className="sb-input" required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></Field>
      <Field label="Name"><input className="sb-input" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
      <Field label="Agent type"><select className="sb-input" value={form.executionMode} onChange={(e) => setForm({ ...form, executionMode: e.target.value, kind: e.target.value === 'interactive' ? 'lead_intake' : e.target.value === 'internal_chat' ? 'internal_chat' : 'workflow' })}><option value="interactive">User-facing chat</option><option value="internal_chat">Internal configuration chat</option><option value="scheduled">Scheduled autonomous</option></select></Field>
      <Field label="World scope"><select className="sb-input" value={scopeType} disabled><option value="platform">Salt Basin platform</option><option value="organization">Member organization</option><option value="member">Member</option></select></Field>
      {form.executionMode === 'interactive' && <Field label="Public deployment key"><input className="sb-input" value={form.publicKey} onChange={(e) => setForm({ ...form, publicKey: e.target.value })} /></Field>}
      <div style={{ alignSelf: 'end' }}><button className="sb-btn sb-btn-gold" type="submit">Create agent</button></div>
    </form></section>
    {selected && <><h2>Entered world · {selected.label}</h2><DefinitionEditor key={`${selected.id}-${selected.updatedAt}`} definition={selected} onSaved={load} /></>}
  </div>;
}
