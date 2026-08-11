import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const FEATURE_LABELS = {
  career_core: 'Career Master, document mapping, and resume outputs',
  member_site: 'Member Profile Site configuration and publishing',
  career_bestystaff: 'Member-context BestyStaff intake',
  career_agents: 'Autonomous career placement agents',
  career_pipeline: 'Application, outreach, interview, and conversion pipeline',
};

export default function MemberAccessPanel() {
  const [access, setAccess] = useState(null);
  const [consents, setConsents] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.getMemberAccess(), api.getMyConsentHistory()])
      .then(([nextAccess, history]) => { setAccess(nextAccess); setConsents(history.items || []); })
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <div style={{ padding: '2rem', color: 'var(--sb-risk-critical)' }}>Account access could not be loaded: {error}</div>;
  if (!access) return <div style={{ padding: '2rem', color: 'var(--sb-dusty)' }}>Loading account access…</div>;
  const current = access.subscriptions?.find((item) => item.current);
  const pct = access.storage?.limitBytes ? Math.min(100, (access.storage.usedBytes / access.storage.limitBytes) * 100) : 0;
  return <div style={{ padding: '2rem', overflowY: 'auto', width: '100%', color: 'var(--sb-cream)' }}>
    <h1 style={{ marginTop: 0 }}>Member Account &amp; Access</h1>
    <p style={{ color: 'var(--sb-dusty)', maxWidth: 760 }}>Your personal Member identity stays constant. Subscriptions and organization-sponsored seats determine which profile, website, automation, and data capabilities are provisioned into that identity.</p>
    <section className="sb-card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
      <h2 style={{ marginTop: 0 }}>{current?.offeringName || 'Career Foundation'}</h2>
      <div>{current?.status === 'trialing' ? `Free trial through ${new Date(Number(current.trialEndsAt)).toLocaleDateString()}` : current?.status || 'Not active'}</div>
      <div style={{ color: 'var(--sb-dusty)', marginTop: '.35rem' }}>$5.99/month after the 90-day trial. Recurring checkout remains unavailable until Salt Basin activates this offering.</div>
    </section>
    <section className="sb-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Provisioned capabilities</h2>
      {Object.entries(FEATURE_LABELS).map(([key, label]) => <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '.65rem 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}><span>{label}</span><strong style={{ color: access.features?.[key] ? 'var(--sb-sage)' : 'var(--sb-dusty)' }}>{access.features?.[key] ? 'Available' : 'Upgrade required'}</strong></div>)}
    </section>
    <SecuritySettings />
    <section className="sb-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Career storage</h2>
      <div>{(access.storage.usedBytes / 1048576).toFixed(2)} MB used{access.storage.limitBytes ? ` of ${(access.storage.limitBytes / 1048576).toFixed(0)} MB` : ''}</div>
      <div style={{ height: 8, background: 'rgba(255,255,255,.1)', borderRadius: 8, marginTop: '.75rem' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--sb-gold)', borderRadius: 8 }} /></div>
      <div style={{ color: 'var(--sb-dusty)', marginTop: '.5rem' }}>{access.storage.sourceDocuments} source document{access.storage.sourceDocuments === 1 ? '' : 's'} tracked.</div>
    </section>
    <section className="sb-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Terms &amp; agreement history</h2>
      <p style={{ color: 'var(--sb-dusty)' }}>Every agreement is retained as an immutable profile record with its version, date, login IP, device signature, and provisioning context.</p>
      {consents.length === 0 && <div style={{ color: 'var(--sb-dusty)' }}>No agreement records found.</div>}
      {consents.map((item) => <div key={item.id} style={{ padding: '.7rem 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <strong>{item.consent_type.replaceAll('_', ' ')}</strong> · {item.action} · version {item.consent_version}
        <div style={{ color: 'var(--sb-dusty)', fontSize: '.76rem', marginTop: '.25rem' }}>{new Date(item.created_at).toLocaleString()} · IP {item.ip || 'not recorded'}</div>
      </div>)}
    </section>
  </div>;
}

function SecuritySettings() {
  const [routes, setRoutes] = useState([]);
  const [preferences, setPreferences] = useState({ default_destinations: ['primary'], ip_rules: [] });
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [ip, setIp] = useState('');
  const [message, setMessage] = useState('');
  const load = () => Promise.all([api.getAuthenticationRoutes(), api.getPasswordResetPreferences()]).then(([auth, reset]) => { setRoutes(auth.routes || []); setPreferences(reset); });
  useEffect(() => { load().catch((e) => setMessage(e.message)); }, []);
  const toggleDestination = (value) => setPreferences((current) => ({ ...current, default_destinations: current.default_destinations.includes(value) ? current.default_destinations.filter((item) => item !== value) : [...current.default_destinations, value] }));
  async function saveReset() { await api.savePasswordResetPreferences(preferences.default_destinations, preferences.ip_rules); setMessage('Password reset routing saved.'); await load(); }
  async function addIpRule() { if (!ip.trim()) return; setPreferences((current) => ({ ...current, ip_rules: [...current.ip_rules, { ip: ip.trim(), destinations: current.default_destinations }] })); setIp(''); }
  async function startTotp() { try { setSetup(await api.startTotpSetup()); setMessage('Add the key or URI to your authenticator, then enter its current code.'); } catch (e) { setMessage(e.message); } }
  async function enableTotp() { try { await api.enableTotp(code); setSetup(null); setCode(''); setMessage('Authenticator enabled.'); await load(); } catch (e) { setMessage(e.message); } }
  async function disableTotp() { await api.disableTotp(); setMessage('Authenticator disabled.'); await load(); }
  const enabled = routes.some((route) => route.route_type === 'totp' && route.enabled);
  return <section className="sb-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
    <h2 style={{ marginTop: 0 }}>Security &amp; password recovery</h2>
    <h3>Authenticator app</h3>
    <p style={{ color: 'var(--sb-dusty)' }}>You may configure multiple authentication routes. Login requires one configured challenge, never all routes.</p>
    {enabled ? <button className="sb-btn" onClick={disableTotp}>Disable personal authenticator</button> : <button className="sb-btn sb-btn-gold" onClick={startTotp}>Configure authenticator app</button>}
    {setup && <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,.15)' }}><div style={{ overflowWrap: 'anywhere', fontFamily: 'monospace' }}>{setup.secret}</div><div style={{ overflowWrap: 'anywhere', color: 'var(--sb-dusty)', fontSize: '.72rem', margin: '.5rem 0' }}>{setup.uri}</div><input className="sb-input" aria-label="Authenticator verification code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" /><button className="sb-btn sb-btn-gold" onClick={enableTotp} disabled={code.length !== 6}>Verify and enable</button></div>}
    <h3 style={{ marginTop: '1.5rem' }}>Password reset destinations</h3>
    <p style={{ color: 'var(--sb-dusty)' }}>Only verified addresses in the selected roles receive reset links. Primary is the safe fallback.</p>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>{['primary','personal','work','organization'].map((value) => <label key={value}><input type="checkbox" checked={preferences.default_destinations.includes(value)} onChange={() => toggleDestination(value)} /> {value}</label>)}</div>
    <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}><input className="sb-input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP or prefix ending in *" /><button className="sb-btn" onClick={addIpRule}>Add IP rule</button></div>
    {(preferences.ip_rules || []).map((rule, index) => <div key={`${rule.ip}-${index}`} style={{ fontSize: '.76rem', marginTop: '.5rem' }}>{rule.ip} → {rule.destinations.join(', ')} <button onClick={() => setPreferences((current) => ({ ...current, ip_rules: current.ip_rules.filter((_, i) => i !== index) }))}>Remove</button></div>)}
    <button className="sb-btn sb-btn-gold" style={{ marginTop: '1rem' }} onClick={saveReset}>Save reset routing</button>
    {message && <div style={{ marginTop: '.75rem', color: 'var(--sb-sage)' }}>{message}</div>}
  </section>;
}
