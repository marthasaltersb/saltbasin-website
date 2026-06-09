import React from 'react';
import { styles } from './adminStyles.js';

// ── Personal profile integration categories ───────────────────────────────────
const PERSONAL_PROVIDERS = [
  { group: 'Social',          providers: [
    { id: 'linkedin',   label: 'LinkedIn',    icon: '🔗' },
    { id: 'twitter',    label: 'X / Twitter', icon: '𝕏' },
    { id: 'instagram',  label: 'Instagram',   icon: '📸' },
    { id: 'facebook',   label: 'Facebook',    icon: '👤' },
    { id: 'tiktok',     label: 'TikTok',      icon: '🎵' },
    { id: 'youtube',    label: 'YouTube',     icon: '▶️' },
  ]},
  { group: 'Finance',         providers: [
    { id: 'plaid',      label: 'Plaid (Bank Accounts)', icon: '🏦' },
    { id: 'stripe',     label: 'Stripe',       icon: '💳' },
    { id: 'paypal',     label: 'PayPal',       icon: '🅿️' },
  ]},
  { group: 'Email & Calendar', providers: [
    { id: 'google',     label: 'Google (Gmail + Calendar)', icon: '📧' },
    { id: 'microsoft',  label: 'Microsoft (Outlook + Calendar)', icon: '🪟' },
  ]},
  { group: 'Healthcare',      providers: [
    { id: 'epic',       label: 'Epic MyChart',  icon: '🏥' },
    { id: 'apple_health', label: 'Apple Health', icon: '❤️' },
  ]},
  { group: 'AI Accounts',     providers: [
    { id: 'openai',     label: 'OpenAI',        icon: '🤖' },
    { id: 'anthropic',  label: 'Anthropic',     icon: '🧠' },
    { id: 'gemini',     label: 'Google Gemini', icon: '✨' },
    { id: 'perplexity', label: 'Perplexity',    icon: '🔍' },
  ]},
  { group: 'Freelance & Storefronts', providers: [
    { id: 'indeed',     label: 'Indeed',        icon: '💼' },
    { id: 'upwork',     label: 'Upwork',        icon: '🟢' },
    { id: 'fiverr',     label: 'Fiverr',        icon: '🟩' },
    { id: 'etsy',       label: 'Etsy',          icon: '🛍️' },
    { id: 'amazon_seller', label: 'Amazon Seller', icon: '📦' },
    { id: 'shopify',    label: 'Shopify',       icon: '🛒' },
  ]},
];

const ORG_PROVIDERS = [
  { group: 'CRM',             providers: [
    { id: 'salesforce', label: 'Salesforce',   icon: '☁️' },
    { id: 'hubspot',    label: 'HubSpot',      icon: '🟠' },
  ]},
  { group: 'ERP & Finance',   providers: [
    { id: 'quickbooks', label: 'QuickBooks',   icon: '📊' },
    { id: 'zuora',      label: 'Zuora',        icon: '💳' },
    { id: 'sap',        label: 'SAP',          icon: '🔷' },
    { id: 'oracle',     label: 'Oracle',       icon: '🔴' },
    { id: 'netsuite',   label: 'NetSuite',     icon: '🟣' },
  ]},
  { group: 'HR & ATS',        providers: [
    { id: 'workday',    label: 'Workday',      icon: '🏢' },
    { id: 'greenhouse', label: 'Greenhouse',   icon: '🌿' },
    { id: 'lever',      label: 'Lever',        icon: '⚙️' },
  ]},
  { group: 'Data & Analytics', providers: [
    { id: 'snowflake',  label: 'Snowflake',    icon: '❄️' },
    { id: 'tableau',    label: 'Tableau',      icon: '📈' },
    { id: 'supabase',   label: 'Supabase',     icon: '⚡' },
  ]},
  { group: 'Marketing',       providers: [
    { id: 'marketo',    label: 'Marketo',      icon: '📣' },
  ]},
  { group: 'CPQ & Revenue',   providers: [
    { id: 'dealhub',    label: 'DealHub',      icon: '🤝' },
  ]},
  { group: 'Productivity',    providers: [
    { id: 'microsoft',  label: 'Microsoft 365 / SharePoint', icon: '🪟' },
    { id: 'google_workspace', label: 'Google Workspace', icon: '📁' },
  ]},
];

const ORG_TYPES = [
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'llc',             label: 'LLC' },
  { value: 'corporation',     label: 'Corporation' },
  { value: 'partnership',     label: 'Partnership' },
  { value: 'nonprofit',       label: 'Nonprofit' },
  { value: 'freelance_platform', label: 'Freelance / Platform' },
  { value: 'client_org',      label: 'Client Organization (access only)' },
];

const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'];

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '0.5px solid rgba(200,193,183,0.15)',
  borderRadius: 'var(--sb-radius)',
  padding: '1.25rem',
  marginBottom: '1rem',
};
const cardTitle = {
  fontFamily: 'var(--sb-font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--sb-sage)',
  marginBottom: '0.85rem',
};
const pill = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem',
  background: active ? 'rgba(168,184,154,0.2)' : 'rgba(200,193,183,0.08)',
  border: `0.5px solid ${active ? 'var(--sb-sage)' : 'rgba(200,193,183,0.2)'}`,
  color: active ? 'var(--sb-sage)' : 'var(--sb-dusty)',
  cursor: 'pointer', userSelect: 'none',
});
const btnPrimary = {
  padding: '5px 14px', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer',
  background: 'var(--sb-gold)', border: 'none', color: '#fff', fontFamily: 'var(--sb-font-body)',
};
const btnGhost = {
  padding: '4px 12px', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer',
  background: 'transparent', border: '0.5px solid rgba(200,193,183,0.3)', color: 'var(--sb-dusty)',
};
const inputStyle = { width: '100%', marginBottom: '0.5rem' };
const row = { display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '0.5px solid rgba(200,193,183,0.08)' };

// ── Personal profile panel ────────────────────────────────────────────────────
function PersonalProfilePanel() {
  const [profile, setProfile] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/profiles/me/personal', { credentials: 'same-origin' })
      .then((r) => r.json()).then((d) => { setProfile(d); setDraft(d); }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/profiles/me/personal', {
      method: 'PATCH', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    setProfile(draft);
    setEditing(false);
  }

  if (!profile) return <div style={{ padding: '2rem', color: 'var(--sb-dusty)', fontSize: '0.8rem' }}>Loading…</div>;

  return (
    <div>
      <div style={card}>
        <div style={cardTitle}>Personal Profile</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(168,184,154,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <>
                <input className="sb-input" style={inputStyle} placeholder="Display name" value={draft.display_name || ''} onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))} />
                <input className="sb-input" style={inputStyle} placeholder="Avatar URL" value={draft.avatar_url || ''} onChange={(e) => setDraft((d) => ({ ...d, avatar_url: e.target.value }))} />
                <input className="sb-input" style={inputStyle} placeholder="Location" value={draft.location || ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} />
                <input className="sb-input" style={inputStyle} placeholder="Pronouns (e.g. she/her)" value={draft.pronouns || ''} onChange={(e) => setDraft((d) => ({ ...d, pronouns: e.target.value }))} />
                <textarea className="sb-input sb-textarea" placeholder="Bio" value={draft.bio || ''} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} style={{ width: '100%', minHeight: 72 }} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => { setEditing(false); setDraft(profile); }} style={btnGhost}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--sb-cream)', marginBottom: 2 }}>{profile.display_name || '—'}</div>
                {profile.location && <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)' }}>📍 {profile.location}</div>}
                {profile.pronouns && <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)' }}>{profile.pronouns}</div>}
                {profile.bio && <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)', marginTop: '0.4rem', lineHeight: 1.55 }}>{profile.bio}</div>}
                <button onClick={() => setEditing(true)} style={{ ...btnGhost, marginTop: '0.75rem' }}>Edit</button>
              </>
            )}
          </div>
        </div>
      </div>

      <IntegrationHub scope="personal" profileId={profile.id} providerGroups={PERSONAL_PROVIDERS} />
    </div>
  );
}

// ── Org profile list + create ─────────────────────────────────────────────────
function OrgProfilesPanel() {
  const [orgs, setOrgs] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: '', org_type: 'llc', description: '', website: '', industry: '' });
  const [saving, setSaving] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState(null);

  function load() {
    fetch('/api/profiles/me/orgs', { credentials: 'same-origin' })
      .then((r) => r.json()).then(setOrgs).catch(() => setOrgs([]));
  }
  React.useEffect(load, []);

  async function create() {
    if (!draft.name) return;
    setSaving(true);
    const r = await fetch('/api/profiles/me/orgs', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (r.ok) { setCreating(false); setDraft({ name: '', org_type: 'llc', description: '', website: '', industry: '' }); load(); }
  }

  if (selectedOrg) {
    return <OrgDetailPanel org={selectedOrg} onBack={() => { setSelectedOrg(null); load(); }} />;
  }

  return (
    <div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={cardTitle}>Organization Profiles</div>
          <button onClick={() => setCreating(true)} style={btnPrimary}>+ New Org</button>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.85rem', lineHeight: 1.6 }}>
          Create an org profile for your LLC, corporation, or any business entity. Self-employed? You can link a sole proprietor org to your personal profile. Each org has its own integrations, members, and data access.
        </div>

        {!orgs && <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)' }}>Loading…</div>}
        {orgs && orgs.length === 0 && !creating && (
          <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)' }}>No organization profiles yet.</div>
        )}
        {orgs && orgs.map((org) => (
          <div key={org.id} onClick={() => setSelectedOrg(org)} style={{ ...row, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(196,132,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--sb-cream)' }}>{org.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)' }}>{ORG_TYPES.find((t) => t.value === org.org_type)?.label || org.org_type} · {org.role}</div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>›</span>
          </div>
        ))}

        {creating && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(196,132,58,0.05)', border: '0.5px dashed rgba(196,132,58,0.3)', borderRadius: 6 }}>
            <div style={{ ...cardTitle, marginBottom: '0.6rem' }}>New Organization</div>
            <input className="sb-input" style={inputStyle} placeholder="Organization name *" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <select className="sb-input" style={inputStyle} value={draft.org_type} onChange={(e) => setDraft((d) => ({ ...d, org_type: e.target.value }))}>
              {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className="sb-input" style={inputStyle} placeholder="Industry (e.g. SaaS, Healthcare, Finance)" value={draft.industry} onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))} />
            <input className="sb-input" style={inputStyle} placeholder="Website" value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} />
            <textarea className="sb-input sb-textarea" placeholder="Description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} style={{ width: '100%', minHeight: 60, marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={create} disabled={saving} style={btnPrimary}>{saving ? 'Creating…' : 'Create'}</button>
              <button onClick={() => setCreating(false)} style={btnGhost}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Org detail: settings, members, integrations ───────────────────────────────
function OrgDetailPanel({ org, onBack }) {
  const [detail, setDetail] = React.useState(null);
  const [tab, setTab] = React.useState('integrations');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('member');
  const [inviting, setInviting] = React.useState(false);

  function load() {
    fetch(`/api/profiles/orgs/${org.id}`, { credentials: 'same-origin' })
      .then((r) => r.json()).then(setDetail).catch(() => {});
  }
  React.useEffect(load, [org.id]);

  async function invite() {
    if (!inviteEmail) return;
    setInviting(true);
    await fetch(`/api/profiles/orgs/${org.id}/members`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setInviting(false);
    setInviteEmail('');
    load();
  }

  async function changeRole(userId, role) {
    await fetch(`/api/profiles/orgs/${org.id}/members/${userId}`, {
      method: 'PATCH', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function removeMember(userId) {
    if (!window.confirm('Remove this member?')) return;
    await fetch(`/api/profiles/orgs/${org.id}/members/${userId}`, { method: 'DELETE', credentials: 'same-origin' });
    load();
  }

  const canManage = detail && ['owner', 'admin'].includes(detail.myRole);

  return (
    <div>
      <button onClick={onBack} style={{ ...btnGhost, marginBottom: '0.75rem' }}>← Back to orgs</button>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🏢</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sb-cream)' }}>{org.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>
              {ORG_TYPES.find((t) => t.value === org.org_type)?.label} · {org.industry || 'No industry set'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
          {['integrations', 'members', 'settings'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={pill(tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'integrations' && (
          <IntegrationHub scope="org" profileId={org.id} providerGroups={ORG_PROVIDERS} />
        )}

        {tab === 'members' && detail && (
          <div>
            {detail.members.map((m) => (
              <div key={m.id} style={row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.83rem', color: 'var(--sb-cream)', fontWeight: 500 }}>{m.display_name || m.email}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>{m.email}</div>
                </div>
                {canManage ? (
                  <select className="sb-input" style={{ fontSize: '0.72rem', width: 100 }} value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}>
                    {ORG_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <span style={{ ...pill(false), cursor: 'default' }}>{m.role}</span>
                )}
                {canManage && m.role !== 'owner' && (
                  <button onClick={() => removeMember(m.id)} style={{ ...btnGhost, color: 'var(--sb-risk-critical)', borderColor: 'rgba(220,80,80,0.3)', fontSize: '0.68rem' }}>Remove</button>
                )}
              </div>
            ))}
            {canManage && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input className="sb-input" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1, fontSize: '0.78rem' }} />
                <select className="sb-input" style={{ fontSize: '0.72rem', width: 90 }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {ORG_ROLES.filter((r) => r !== 'owner').map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={invite} disabled={inviting} style={btnPrimary}>{inviting ? '…' : 'Invite'}</button>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && <OrgSettingsPanel org={detail || org} onSaved={load} />}
      </div>
    </div>
  );
}

function OrgSettingsPanel({ org, onSaved }) {
  const [draft, setDraft] = React.useState({ name: org.name, org_type: org.org_type, description: org.description || '', website: org.website || '', industry: org.industry || '' });
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/profiles/orgs/${org.id}`, {
      method: 'PATCH', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div>
      <input className="sb-input" style={inputStyle} placeholder="Organization name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
      <select className="sb-input" style={inputStyle} value={draft.org_type} onChange={(e) => setDraft((d) => ({ ...d, org_type: e.target.value }))}>
        {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input className="sb-input" style={inputStyle} placeholder="Industry" value={draft.industry} onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))} />
      <input className="sb-input" style={inputStyle} placeholder="Website" value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} />
      <textarea className="sb-input sb-textarea" placeholder="Description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} style={{ width: '100%', minHeight: 72, marginBottom: '0.5rem' }} />
      <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : 'Save Changes'}</button>
    </div>
  );
}

// ── Integration hub (used by both personal and org panels) ───────────────────
function IntegrationHub({ scope, profileId, providerGroups }) {
  const [expandedGroup, setExpandedGroup] = React.useState(null);

  return (
    <div style={card}>
      <div style={cardTitle}>
        {scope === 'personal' ? 'Personal Integrations' : 'Organization Integrations'}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.85rem', lineHeight: 1.6 }}>
        {scope === 'personal'
          ? 'Connect your personal accounts. Data stays private to you and feeds your personal profile and agent.'
          : 'Connect organization data sources. Members with access can use connected data within their licensed products.'}
      </div>
      {providerGroups.map((group) => (
        <div key={group.group} style={{ marginBottom: '0.5rem' }}>
          <button
            onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
            style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(200,193,183,0.12)', borderRadius: 4, padding: '0.45rem 0.7rem', cursor: 'pointer', color: 'var(--sb-cream)', fontSize: '0.78rem', fontWeight: 500 }}>
            <span>{group.group}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>{expandedGroup === group.group ? '▲' : '▼'} {group.providers.length} providers</span>
          </button>
          {expandedGroup === group.group && (
            <div style={{ padding: '0.5rem 0 0.25rem 0' }}>
              {group.providers.map((p) => (
                <ProviderRow key={p.id} provider={p} scope={scope} profileId={profileId} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProviderRow({ provider, scope, profileId }) {
  const [status, setStatus] = React.useState(null); // null=loading, false=disconnected, object=connected

  React.useEffect(() => {
    fetch(`/api/oauth/connections?scope=${scope}&profileId=${profileId}&provider=${provider.id}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        const match = d.connections?.find((c) => c.provider === provider.id);
        setStatus(match || false);
      })
      .catch(() => setStatus(false));
  }, [provider.id, scope, profileId]);

  function connect() {
    window.location.href = `/api/oauth/${provider.id}/connect?scope=${scope}&profileId=${profileId}`;
  }

  async function disconnect() {
    if (!window.confirm(`Disconnect ${provider.label}?`)) return;
    await fetch(`/api/oauth/connections/${provider.id}?scope=${scope}&profileId=${profileId}`, { method: 'DELETE', credentials: 'same-origin' });
    setStatus(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.5rem', borderRadius: 4 }}>
      <span style={{ fontSize: '1rem', width: 22, textAlign: 'center' }}>{provider.icon}</span>
      <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--sb-cream)' }}>{provider.label}</span>
      {status === null && <span style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>…</span>}
      {status === false && <button onClick={connect} style={{ ...btnPrimary, padding: '3px 10px', fontSize: '0.68rem', background: 'var(--sb-gold)' }}>Connect</button>}
      {status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--sb-sage)' }}>✓ {status.connectedAs || 'Connected'}</span>
          <button onClick={disconnect} style={{ ...btnGhost, fontSize: '0.65rem', padding: '2px 8px', color: 'var(--sb-risk-critical)', borderColor: 'rgba(220,80,80,0.25)' }}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function ProfileHub({ isAdmin = false }) {
  const [tab, setTab] = React.useState('personal');

  return (
    <div style={{ ...styles.editorPane, overflowY: 'auto' }}>
      <div style={styles.editorHeader}>
        <div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-sage)' }}>
            Profile Hub
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)' }}>
            Personal profile · Organization profiles · Integrations
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.25rem', paddingTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
          <button onClick={() => setTab('personal')} style={pill(tab === 'personal')}>Personal</button>
          <button onClick={() => setTab('orgs')} style={pill(tab === 'orgs')}>Organizations</button>
          {isAdmin && <button onClick={() => setTab('licenses')} style={pill(tab === 'licenses')}>Licenses</button>}
        </div>

        {tab === 'personal' && <PersonalProfilePanel />}
        {tab === 'orgs' && <OrgProfilesPanel />}
        {tab === 'licenses' && isAdmin && <LicensesPanel />}
      </div>
    </div>
  );
}

// ── Admin: licenses panel ─────────────────────────────────────────────────────
function LicensesPanel() {
  const [licenses, setLicenses] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/profiles/admin/licenses', { credentials: 'same-origin' })
      .then((r) => r.json()).then(setLicenses).catch(() => setLicenses([]));
  }, []);

  const PRODUCTS = ['finbridgeco', 'handoveros', 'saltbasin_pro'];
  const TIERS = ['standard', 'professional', 'enterprise'];

  return (
    <div style={card}>
      <div style={cardTitle}>Product Licenses</div>
      {!licenses && <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)' }}>Loading…</div>}
      {licenses && licenses.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--sb-dusty)' }}>No active licenses.</div>}
      {licenses && licenses.map((l) => (
        <div key={l.id} style={row}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.83rem', color: 'var(--sb-cream)', fontWeight: 500 }}>
              {l.display_name || l.email}
              {l.org_name && <span style={{ color: 'var(--sb-dusty)', fontWeight: 400 }}> · {l.org_name}</span>}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)', marginTop: 1 }}>
              {l.product_id} · {l.tier} · {l.expires_at ? `Expires ${new Date(l.expires_at).toLocaleDateString()}` : 'Perpetual'}
            </div>
          </div>
          <span style={pill(true)}>{l.tier}</span>
        </div>
      ))}
    </div>
  );
}
