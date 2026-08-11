import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import AdminShell from './admin/AdminShell.jsx';
import CareerConsentGate from './admin/CareerConsentGate.jsx';

export default function OrgPortal() {
  return <CareerConsentGate><OrgPortalInner /></CareerConsentGate>;
}

function OrgPortalInner() {
  const { orgId } = useParams();
  const [ctx, setCtx] = useState(undefined); // undefined=loading, null=denied, object=ok
  const [needsConsent, setNeedsConsent] = useState(false);

  function load() {
    setCtx(undefined);
    setNeedsConsent(false);
    api.getOrgPortalContext(orgId)
      .then(setCtx)
      .catch((err) => {
        if (err.status === 403 && err.body?.error === 'org_consent_required') {
          setNeedsConsent(true);
        } else {
          setCtx(null);
        }
      });
  }
  useEffect(load, [orgId]);

  if (needsConsent) return <OrgConsentGate orgId={orgId} onGranted={load} />;
  if (ctx === undefined) return null;
  if (!ctx) return <Navigate to="/member" replace />;
  return <><OrgSecurityPolicy orgId={orgId} canEdit={ctx.canEdit} /><AdminShell scope={ctx.canEdit ? 'org-admin' : 'org-user'} orgId={orgId} /></>;
}

function OrgSecurityPolicy({ orgId, canEdit }) {
  const [policy, setPolicy] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { api.getOrgAuthenticationPolicy(orgId).then(setPolicy).catch(() => {}); }, [orgId]);
  if (!policy) return null;
  const routes = policy.allowed_routes || policy.allowedRoutes || ['password','totp'];
  const toggle = (route) => setPolicy((current) => ({ ...current, allowed_routes: routes.includes(route) ? routes.filter((item) => item !== route) : [...routes, route] }));
  async function save() { const result = await api.saveOrgAuthenticationPolicy(orgId, { allowedRoutes: policy.allowed_routes, preferredRoute: policy.preferred_route, ssoProviderKey: policy.sso_provider_key, authenticatorLabel: policy.authenticator_label }); setPolicy((current) => ({ ...current, allowed_routes: result.allowedRoutes, preferred_route: result.preferredRoute })); toast.success('Organization authentication policy saved'); }
  return <div style={{ padding: '.55rem 1rem', background: '#122338', color: 'white', fontSize: '.76rem' }}><button className="sb-btn" onClick={() => setOpen((value) => !value)}>Authentication routes: {routes.join(', ')}</button>{open && <div style={{ padding: '1rem 0', display: 'grid', gap: '.75rem', maxWidth: 720 }}><p style={{ margin: 0 }}>Members may have several routes configured. One successful configured route is required at login.</p>{canEdit && <><div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>{['password','totp','sso','organization_authenticator'].map((route) => <label key={route}><input type="checkbox" checked={routes.includes(route)} onChange={() => toggle(route)} /> {route.replaceAll('_',' ')}</label>)}</div><label>Preferred route <select value={policy.preferred_route || routes[0]} onChange={(e) => setPolicy((current) => ({ ...current, preferred_route: e.target.value }))}>{routes.map((route) => <option key={route}>{route}</option>)}</select></label><label>SSO provider key <input value={policy.sso_provider_key || ''} onChange={(e) => setPolicy((current) => ({ ...current, sso_provider_key: e.target.value }))} /></label><label>Organization authenticator label <input value={policy.authenticator_label || ''} onChange={(e) => setPolicy((current) => ({ ...current, authenticator_label: e.target.value }))} /></label><button className="sb-btn sb-btn-gold" onClick={save} disabled={!routes.length}>Save authentication policy</button></>}</div>}</div>;
}

// Blocks org data access until the member confirms which of their VERIFIED
// emails represents their identity in this organization's context — see
// server/routes/orgPortal.js's hasOrgConsent()/access(). Acknowledgement
// wording is server-sourced (server/lib/consentRegistry.js), same pattern
// as CareerConsentGate.jsx, so wording changes there don't need a client
// change.
function OrgConsentGate({ orgId, onGranted }) {
  const [status, setStatus] = useState(null); // null = loading
  const [emails, setEmails] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getOrgConsentStatus(orgId).then(setStatus).catch((e) => setErr(e.message));
    api.getMemberEmails().then((d) => {
      const verified = (d.emails || []).filter((e) => e.verified);
      setEmails(verified);
      const work = verified.find((e) => e.type === 'work');
      setSelectedEmail((work || verified[0])?.email || '');
    }).catch((e) => setErr(e.message));
  }, [orgId]);

  if (status === null || emails === null) {
    return <div style={S.wrap}><div style={{ color: '#888', fontSize: '0.85rem' }}>Loading…</div></div>;
  }

  const noVerifiedEmails = emails.length === 0;
  const canSubmit = checked && !!selectedEmail && !noVerifiedEmails;

  async function submit() {
    setSubmitting(true);
    setErr('');
    try {
      await api.recordOrgConsent(orgId, { granted: true, designatedEmail: selectedEmail });
      toast.success('Consent recorded');
      onGranted();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>Confirm Your Organization Data Identity</div>
      <div style={S.sub}>
        Before you can view or edit this organization's data, confirm which of your verified email
        addresses represents you in this organization's context. You're seeing consent version {status.consentVersion}.
      </div>

      {noVerifiedEmails ? (
        <div style={{ fontSize: '0.82rem', color: '#a34', marginBottom: '1rem' }}>
          You don't have any verified email addresses yet. Add and verify one from your Personal Profile
          before continuing.
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>
            Your organization identity for this org
          </label>
          <select
            className="sb-input"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            {emails.map((e) => (
              <option key={e.id} value={e.email}>{e.email} ({e.type})</option>
            ))}
          </select>
        </div>
      )}

      {status.acknowledgements.map((ack) => (
        <label key={ack.key} style={S.check}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--sb-gold, #c4843a)' }}
          />
          <span>{ack.text}</span>
        </label>
      ))}

      {err && <div style={{ fontSize: '0.8rem', color: '#a34', marginBottom: '0.75rem' }}>{err}</div>}

      <button style={S.btn(canSubmit && !submitting)} disabled={!canSubmit || submitting} onClick={submit}>
        {submitting ? 'Recording…' : 'I Confirm — Continue'}
      </button>
    </div>
  );
}

const S = {
  wrap: { maxWidth: 640, margin: '3rem auto', padding: '2rem', background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12 },
  title: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.5rem' },
  sub: { fontSize: '0.85rem', color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' },
  check: { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.82rem', color: '#333', lineHeight: 1.5, marginBottom: '1rem' },
  btn: (enabled) => ({
    padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '0.85rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.05em',
    background: enabled ? 'var(--sb-gold, #c4843a)' : 'rgba(0,0,0,0.12)', color: enabled ? 'white' : '#999',
  }),
};
