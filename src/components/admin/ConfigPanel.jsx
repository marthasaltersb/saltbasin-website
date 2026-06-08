import React from 'react';
import { styles } from './adminStyles.js';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

export default function ConfigPanel({ config, onChange, scope = 'admin' }) {
  const isMember = scope === 'member';
  function patch(path, value) {
    const next = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      cur[keys[i]] = cur[keys[i]] || {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    onChange(next);
  }

  return (
    <div style={styles.editorPane}>
      <div style={styles.editorHeader}>
        <div>
          <div
            style={{
              fontFamily: 'var(--sb-font-label)',
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--sb-sage)',
            }}
          >
            Site Configuration
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sb-teal-deep)' }}>
            Changes go to draft. Publish to apply.
          </div>
        </div>
      </div>

      <div style={styles.editorBody}>
        {/* Intro: explains what the Config panel is. Member-scoped wording
            emphasizes it's about how their profile looks + links; admin-scoped
            wording emphasizes it's about the platform site itself. */}
        <div style={{
          ...styles.card,
          background: 'rgba(196,132,58,0.06)',
          borderLeft: '2px solid var(--sb-gold)',
          marginBottom: '1rem',
        }}>
          <div style={styles.cardTitle}>About Config</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--sb-cream)' }}>
            {isMember ? (
              <>
                Config is for <strong>how your profile looks and behaves</strong> — site name,
                brand colors that override the default palette on your <code>/u/:slug</code>{' '}
                page, and social links that appear in your footer. Changes go to draft and only
                affect the public view when you publish.
                <br /><br />
                <strong>What's NOT here:</strong> the content of your profile (jobs, domains,
                services, contact info) — that's in <strong>My Profile</strong>. Outputs like
                your resume are generated from My Profile data; you don't edit them directly here.
              </>
            ) : (
              <>
                Platform-level configuration for <strong>saltbasin.net itself</strong>: site
                identity, pre-launch landing gate, brand palette overrides for the public site
                (admin chrome stays locked), social media footer links, outbound email identity,
                feature flags, integration credentials, and notification preferences.
                <br /><br />
                Changes go to draft. Click <strong>Publish</strong> in the bar at the bottom to
                make them live.
              </>
            )}
          </div>
        </div>

        {/* Site identity */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Site Identity</div>
          <Field label="Site Name" value={config?.site?.name} onChange={(v) => patch('site.name', v)} />
          <Field label="Tagline" value={config?.site?.tagline} onChange={(v) => patch('site.tagline', v)} />
          <Field label="Domain" value={config?.site?.domain} onChange={(v) => patch('site.domain', v)} />
          <Field
            label="Footer Copyright Line"
            value={config?.site?.copyrightLine}
            onChange={(v) => patch('site.copyrightLine', v)}
          />
        </div>

        {/* Pre-launch — admin only (platform-level gate) */}
        {!isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Pre-launch Landing Gate</div>
          <Toggle
            label="Gate enabled"
            checked={!!config?.prelaunch?.enabled}
            onChange={(v) => patch('prelaunch.enabled', v)}
            help="When on, the public site is hidden behind a password page until visitors enter the password below."
          />
          <Field
            label="Password"
            value={config?.prelaunch?.password}
            onChange={(v) => patch('prelaunch.password', v)}
            type="text"
          />
          <Field
            label="Headline"
            value={config?.prelaunch?.headline}
            onChange={(v) => patch('prelaunch.headline', v)}
          />
          <Field
            label="Subhead"
            value={config?.prelaunch?.subhead}
            onChange={(v) => patch('prelaunch.subhead', v)}
            long
          />
        </div>
        )}

        {/* Brand colors — both admin and member.
            Admin scope: overrides --sb-* tokens on saltbasin.net public site.
            Member scope: overrides --sb-* tokens on /u/:slug member profile.
            Both write to the same `brand` JSON path in their respective config. */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Brand Colors</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            {isMember
              ? 'These colors apply to your profile pages only. Use hex codes (e.g. #1B2A3B).'
              : 'These colors override the Salt Basin palette on saltbasin.net public pages. Admin chrome stays locked.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <ColorField label="Primary (navy)"  value={config?.brand?.primary} onChange={(v) => patch('brand.primary', v)} />
            <ColorField label="Accent (gold)"   value={config?.brand?.accent}  onChange={(v) => patch('brand.accent', v)} />
            <ColorField label="Ink (text)"      value={config?.brand?.ink}     onChange={(v) => patch('brand.ink', v)} />
            <ColorField label="Paper (bg)"      value={config?.brand?.paper}   onChange={(v) => patch('brand.paper', v)} />
          </div>
          <button
            onClick={() => {
              patch('brand.primary', '#1B2A3B');
              patch('brand.accent',  '#C4843A');
              patch('brand.ink',     '#F5F0E8');
              patch('brand.paper',   '#FBF6F0');
            }}
            className="sb-btn sb-btn-outline"
            style={{ marginTop: 8, padding: '0.35rem 0.8rem', fontSize: '0.65rem' }}
          >
            Reset to Salt Basin defaults
          </button>
        </div>

        {/* Social */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Social Media Links (footer)</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Toggle a row on to show it in the footer. The presets cover the common platforms — use “+ Add custom link” for anything else (Bluesky, Threads, Mastodon, personal substack, etc.).
          </div>
          {Object.entries(config?.social || {}).map(([k, s]) => (
            <div
              key={k}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr auto auto',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              {s.custom ? (
                <input
                  className="sb-input"
                  value={s.label || ''}
                  onChange={(e) => patch(`social.${k}.label`, e.target.value)}
                  placeholder="Label (e.g. Bluesky)"
                  style={{ fontSize: '0.78rem' }}
                />
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>{s.label}</span>
              )}
              <input
                className="sb-input"
                value={s.url}
                onChange={(e) => patch(`social.${k}.url`, e.target.value)}
                placeholder="https://…"
              />
              <button
                onClick={() => patch(`social.${k}.on`, !s.on)}
                style={{
                  padding: '0.45rem 0.9rem',
                  border: '0.5px solid rgba(196,132,58,0.4)',
                  background: s.on ? 'var(--sb-gold)' : 'transparent',
                  color: s.on ? 'var(--sb-ivory)' : 'var(--sb-sage)',
                  borderRadius: 'var(--sb-radius)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'var(--sb-font-body)',
                  minWidth: 64,
                }}
              >
                {s.on ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => {
                  const next = { ...(config?.social || {}) };
                  delete next[k];
                  patch('social', next);
                }}
                title="Remove this link"
                style={{
                  width: 28, height: 28, padding: 0,
                  background: 'transparent',
                  border: '0.5px solid rgba(196,132,58,0.25)',
                  borderRadius: 'var(--sb-radius)',
                  color: 'var(--sb-risk-critical)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = { ...(config?.social || {}) };
              // Unique key — timestamp guarantees no collision with presets or
              // with a previously added custom link the user has since removed.
              const key = `custom_${Date.now()}`;
              next[key] = { label: '', url: '', color: '#C4843A', on: true, custom: true };
              patch('social', next);
            }}
            className="sb-btn sb-btn-outline"
            style={{ marginTop: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.7rem' }}
          >
            + Add custom link
          </button>
        </div>

        {/* Email identity — admin only (members don't yet have outbound) */}
        {!isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Outbound Email Identity</div>
          <Field
            label="From name (shown to recipients)"
            value={config?.email?.fromName}
            onChange={(v) => patch('email.fromName', v)}
          />
          <Field
            label="From address"
            value={config?.email?.fromAddress}
            onChange={(v) => patch('email.fromAddress', v)}
          />
          <Field
            label="Reply-to (optional, defaults to from address)"
            value={config?.email?.replyTo}
            onChange={(v) => patch('email.replyTo', v)}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: '0.5rem', lineHeight: 1.55 }}>
            Used on lead confirmation emails. Visible to leads in their lead record's email history.
            Until <code style={{ color: 'var(--sb-gold)' }}>BREVO_API_KEY</code> is set in Render env, emails are stubbed (logged to console + DB but not delivered).
          </div>
        </div>
        )}

        {/* New-lead notifications to admin */}
        {!isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>New-Lead Notifications</div>
          <Toggle
            label="Email me when a new lead lands"
            checked={config?.email?.notifyOnNewLead !== false}
            onChange={(v) => patch('email.notifyOnNewLead', v)}
            help="When on, every new lead (and every activity on an existing lead) fires an email to the address below."
          />
          <Field
            label="Notification recipient (defaults to ADMIN_EMAIL env var)"
            value={config?.email?.notifyTo}
            onChange={(v) => patch('email.notifyTo', v)}
            placeholder="betsysalter@saltbasin.net"
          />
          <SendTestEmail />
        </div>
        )}

        {/* JIRA integration — admin only */}
        {!isMember && <JiraCard />}

        {/* BestyStaff persona — admin only (it's Salt Basin's public agent) */}
        {!isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>BestyStaff Agent (Phase 5)</div>
          <Toggle
            label="Enabled on public site"
            checked={!!config?.bestystaff?.enabled}
            onChange={(v) => patch('bestystaff.enabled', v)}
            help="BestyStaff is wired in Phase 5. This config still saves, ready to go live."
          />
          <Field
            label="Public greeting"
            value={config?.bestystaff?.greeting}
            onChange={(v) => patch('bestystaff.greeting', v)}
            long
          />
          <Field
            label="About bio (used by both BestyStaff and the editor agent)"
            value={config?.bestystaff?.aboutBio}
            onChange={(v) => patch('bestystaff.aboutBio', v)}
            long
          />
          <Field
            label="Persona / system prompt"
            value={config?.bestystaff?.persona}
            onChange={(v) => patch('bestystaff.persona', v)}
            long
          />
        </div>
        )}

        {/* Net Works home-page banner opt-in — member only. When on, this
            member's logo + blurb shows in the rotating banner under Betsy's
            About section on saltbasin.net. */}
        {isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Salt Basin Net Works Banner</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Opt in to appear in the sliding cards under Betsy's About section on the Salt Basin home page.
            Your logo + a short blurb + a link to your profile show on rotation.
          </div>
          <Toggle
            label="Show me on the Salt Basin home page"
            checked={!!config?.featured?.displayOnHome}
            onChange={(v) => patch('featured.displayOnHome', v)}
            help="Takes effect when you publish."
          />
          <Field
            label="Company / brand name (shown under your logo)"
            value={config?.featured?.homeCompanyName}
            onChange={(v) => patch('featured.homeCompanyName', v)}
            placeholder="Acme Operations"
          />
          <Field
            label="Logo URL (use the Uploads panel or paste a public URL)"
            value={config?.featured?.homeLogoUrl}
            onChange={(v) => patch('featured.homeLogoUrl', v)}
            placeholder="https://…/logo.png"
          />
          <Field
            label="Short blurb (1–2 sentences)"
            value={config?.featured?.homeBlurb}
            onChange={(v) => patch('featured.homeBlurb', v)}
            long
          />
        </div>
        )}

        {/* Top nav — member only. Members define their nav as an ordered list
            of { label, href } entries. Empty = show all published pages. */}
        {isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Top Navigation</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Define the links that appear in your profile's top nav bar. Add your page links (e.g. <code>/u/yourslug/about</code>) and any external links. Leave empty to auto-show all your published pages.
          </div>
          {(config?.nav?.items || []).map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                className="sb-input"
                value={item.label || ''}
                onChange={(e) => {
                  const next = [...(config?.nav?.items || [])];
                  next[i] = { ...next[i], label: e.target.value };
                  patch('nav.items', next);
                }}
                placeholder="Label (e.g. About)"
              />
              <input
                className="sb-input"
                value={item.href || ''}
                onChange={(e) => {
                  const next = [...(config?.nav?.items || [])];
                  next[i] = { ...next[i], href: e.target.value };
                  patch('nav.items', next);
                }}
                placeholder="/u/yourslug/about"
              />
              <button
                onClick={() => {
                  const next = [...(config?.nav?.items || [])];
                  next.splice(i, 1);
                  patch('nav.items', next);
                }}
                title="Remove"
                style={{ width: 28, height: 28, padding: 0, background: 'transparent', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', color: 'var(--sb-risk-critical)', cursor: 'pointer', fontSize: '0.95rem', lineHeight: 1 }}
              >×</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch('nav.items', [...(config?.nav?.items || []), { label: '', href: '' }])}
            className="sb-btn sb-btn-outline"
            style={{ marginTop: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.7rem' }}
          >+ Add nav link</button>
        </div>
        )}

        {/* Resume sections — member only. Controls which blocks show on the
            About / resume page when someone views the member's profile. */}
        {isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Resume — Section Visibility</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Choose which sections appear on your About / resume page. Turning a section off hides it from visitors without deleting your content.
          </div>
          {[
            ['profile',    'Profile summary (About hero + intro)'],
            ['experience', 'Professional experience (roles / timeline)'],
            ['domains',    'Domains of expertise'],
            ['techStack',  'Tech stack / skills'],
            ['education',  'Education'],
          ].map(([key, label]) => (
            <Toggle
              key={key}
              label={label}
              checked={config?.resume?.sections?.[key] !== false}
              onChange={(v) => patch(`resume.sections.${key}`, v)}
            />
          ))}
        </div>
        )}

        {/* Email management — member only. Signup email always stays; members
            can add personal/work emails, each verified by a 6-digit code. */}
        {isMember && <EmailManager />}

        {/* BYO Claude — member only. The Config Agent ships next session;
            this slot is here so members can stash a key now and have it
            already wired when the agent goes live. */}
        {isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Config Agent · Bring Your Own Claude</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Paste an Anthropic API key to power your in-admin editor agent (rolling out next).
            Get one at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sb-gold)' }}>console.anthropic.com</a>.
            Stored server-side and never shown back to the client.
          </div>
          <Field
            label="Anthropic API key"
            value={config?.integrations?.anthropicKey}
            onChange={(v) => patch('integrations.anthropicKey', v)}
            placeholder="sk-ant-…"
            type="password"
          />
          <Field
            label="Model"
            value={config?.integrations?.anthropicModel}
            onChange={(v) => patch('integrations.anthropicModel', v)}
            placeholder="claude-sonnet-4-5"
          />
        </div>
        )}
      </div>
    </div>
  );
}

// ── Email Manager (member-only) ──
// Shows all verified + pending emails for the current member with add / verify / remove actions.
function EmailManager() {
  const [emails, setEmails] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newType, setNewType] = React.useState('personal');
  const [verifyId, setVerifyId] = React.useState(null);
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  function load() {
    fetch('/api/members/me/emails', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setEmails(d.emails || []))
      .catch(() => setEmails([]));
  }
  React.useEffect(load, []);

  async function addEmail() {
    if (!newEmail) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/members/me/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, type: newType }),
        credentials: 'same-origin',
      });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || 'Failed'); return; }
      setAdding(false); setNewEmail(''); setNewType('personal');
      setMsg('Verification code sent — check your inbox.');
      setVerifyId(d.id);
      load();
    } finally { setBusy(false); }
  }

  async function verify(id) {
    if (!code) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetch(`/api/members/me/emails/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'same-origin',
      });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || 'Failed'); return; }
      setVerifyId(null); setCode(''); setMsg('Email verified!');
      load();
    } finally { setBusy(false); }
  }

  async function resend(id) {
    setBusy(true); setMsg('');
    try {
      await fetch(`/api/members/me/emails/${id}/resend`, { method: 'POST', credentials: 'same-origin' });
      setMsg('New code sent — check your inbox.');
    } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Remove this email address?')) return;
    setBusy(true);
    try {
      await fetch(`/api/members/me/emails/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      load();
    } finally { setBusy(false); }
  }

  const labelStyle = { fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-dusty)' };

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Email Addresses</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
        Add personal or work emails. Any verified email can be used to log in. Contact forms submitted on your profile will notify all verified addresses.
      </div>
      {emails === null ? (
        <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>Loading…</div>
      ) : emails.map((e) => (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', flex: 1 }}>{e.email}</span>
          <span style={{ ...labelStyle, color: e.verified ? 'var(--sb-sage)' : 'var(--sb-gold)' }}>
            {e.verified ? e.type : 'pending'}
          </span>
          {!e.verified && (
            <>
              <button onClick={() => { setVerifyId(e.id); setMsg(''); }} className="sb-btn sb-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem' }}>Enter code</button>
              <button onClick={() => resend(e.id)} disabled={busy} className="sb-btn sb-btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem' }}>Resend</button>
            </>
          )}
          {e.type !== 'primary' && (
            <button onClick={() => remove(e.id)} disabled={busy} title="Remove" style={{ width: 24, height: 24, padding: 0, background: 'transparent', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', color: 'var(--sb-risk-critical)', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}>×</button>
          )}
        </div>
      ))}

      {verifyId && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <input
            className="sb-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            style={{ width: 120, fontFamily: 'monospace', letterSpacing: '0.15em' }}
          />
          <button onClick={() => verify(verifyId)} disabled={busy} className="sb-btn sb-btn-gold" style={{ padding: '0.35rem 0.8rem', fontSize: '0.7rem' }}>Verify</button>
          <button onClick={() => { setVerifyId(null); setCode(''); }} className="sb-btn sb-btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.7rem' }}>Cancel</button>
        </div>
      )}

      {adding ? (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input className="sb-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['personal', 'work'].map((t) => (
              <button key={t} onClick={() => setNewType(t)} className="sb-btn sb-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem', background: newType === t ? 'var(--sb-gold)' : 'transparent', color: newType === t ? 'var(--sb-ivory)' : 'var(--sb-sage)' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={addEmail} disabled={busy} className="sb-btn sb-btn-gold" style={{ padding: '0.35rem 0.8rem', fontSize: '0.7rem' }}>Send verification code</button>
            <button onClick={() => { setAdding(false); setNewEmail(''); }} className="sb-btn sb-btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.7rem' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setAdding(true); setMsg(''); }} className="sb-btn sb-btn-outline" style={{ marginTop: '0.5rem', padding: '0.45rem 0.9rem', fontSize: '0.7rem' }}>
          + Add email address
        </button>
      )}

      {msg && <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)', marginTop: '0.5rem' }}>{msg}</div>}
    </div>
  );
}

// Compact color input + hex text field side-by-side. Picker drives the text
// field and vice versa, so members can either visually tweak or paste a brand
// palette code straight in.
function ColorField({ label, value, onChange }) {
  const safe = (value && /^#[0-9a-fA-F]{6}$/.test(value)) ? value : '#1B2A3B';
  return (
    <div>
      <label
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.6rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sb-dusty)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32, height: 32, padding: 0,
            border: '0.5px solid rgba(196,132,58,0.3)',
            borderRadius: 'var(--sb-radius)',
            background: 'transparent', cursor: 'pointer',
          }}
        />
        <input
          className="sb-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
        />
      </div>
    </div>
  );
}

function JiraCard() {
  const [cfg, setCfg] = React.useState(null);
  const [editing, setEditing] = React.useState({ baseUrl: '', email: '', apiToken: '', projectKey: '' });
  const [busy, setBusy] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [importResult, setImportResult] = React.useState(null);

  React.useEffect(() => {
    api.getJiraConfig().then((c) => {
      setCfg(c);
      setEditing({
        baseUrl: c?.baseUrl || '',
        email: c?.email || '',
        apiToken: '',  // never prefill — server doesn't return it
        projectKey: c?.projectKey || '',
      });
    }).catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    try {
      const payload = {
        baseUrl: editing.baseUrl,
        email: editing.email,
        projectKey: editing.projectKey,
      };
      // Only send apiToken if the user typed something new
      if (editing.apiToken) payload.apiToken = editing.apiToken;
      const r = await api.saveJiraConfig(payload);
      setCfg(r.config);
      setEditing((e) => ({ ...e, apiToken: '' })); // clear token field after save
      toast('JIRA config saved');
    } catch (e) {
      toast('Save failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true); setTestResult(null);
    try {
      const r = await api.testJiraConnection();
      setTestResult(r);
    } catch (e) {
      setTestResult({ ok: false, error: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!confirm('Pull all issues from JIRA into the backlog? Creates a "JIRA Mirror" capability group; existing imports get updated by issue key.')) return;
    setBusy(true); setImportResult(null);
    try {
      const r = await api.importFromJira();
      setImportResult(r);
      toast(`Imported: ${r.created} new, ${r.updated} updated`);
    } catch (e) {
      setImportResult({ ok: false, error: e.message });
      toast('Import failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>JIRA Integration (Phase A · read-only pull)</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
        Connect a JIRA Cloud project. Phase A pulls issues into a "JIRA Mirror" capability group inside the Backlog tab. Phase 2 (next session) wires up bidirectional sync.
        <br/>
        Get an API token at{' '}
        <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" style={{ color: 'var(--sb-gold)' }}>
          id.atlassian.com → API tokens
        </a>.
      </div>
      <Field
        label="Base URL (your atlassian.net subdomain)"
        value={editing.baseUrl}
        onChange={(v) => setEditing((e) => ({ ...e, baseUrl: v }))}
        placeholder="https://salt-basin.atlassian.net"
      />
      <Field
        label="Atlassian email"
        value={editing.email}
        onChange={(v) => setEditing((e) => ({ ...e, email: v }))}
        placeholder="betsysalter@saltbasin.net"
      />
      <Field
        label="API token"
        value={editing.apiToken}
        onChange={(v) => setEditing((e) => ({ ...e, apiToken: v }))}
        placeholder={cfg?.apiTokenSet ? `Saved: ${cfg.apiTokenPreview} (leave blank to keep)` : 'Paste your API token'}
        type="password"
      />
      <Field
        label="Project key (e.g. SBN, OPS, etc.)"
        value={editing.projectKey}
        onChange={(v) => setEditing((e) => ({ ...e, projectKey: v }))}
        placeholder="SBN"
      />

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy} className="sb-btn sb-btn-gold" style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
          {busy ? '…' : 'Save'}
        </button>
        <button onClick={test} disabled={busy || !cfg?.apiTokenSet} className="sb-btn sb-btn-outline" style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
          Test connection
        </button>
        <button onClick={runImport} disabled={busy || !cfg?.apiTokenSet || !cfg?.projectKey} className="sb-btn sb-btn-outline" style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
          Import issues →
        </button>
      </div>

      {testResult && (
        <div
          style={{
            marginTop: '0.6rem', padding: '0.55rem 0.75rem',
            background: testResult.ok ? 'rgba(168,184,154,0.12)' : 'rgba(196,75,75,0.12)',
            border: `0.5px solid ${testResult.ok ? 'var(--sb-green)' : 'var(--sb-risk-critical)'}`,
            borderRadius: 'var(--sb-radius)',
            fontSize: '0.75rem',
            color: testResult.ok ? 'var(--sb-green)' : 'var(--sb-risk-critical)',
          }}
        >
          {testResult.ok ? (
            <>
              ✓ Authenticated as <strong>{testResult.me?.displayName}</strong> ({testResult.me?.email}).
              {testResult.project?.name && <> Project <strong>{testResult.project.key} · {testResult.project.name}</strong> reachable.</>}
              {testResult.project?.error && <> Project lookup failed: {testResult.project.error}</>}
            </>
          ) : (
            <>✗ {testResult.error}</>
          )}
        </div>
      )}

      {importResult && (
        <div
          style={{
            marginTop: '0.5rem', padding: '0.55rem 0.75rem',
            background: importResult.ok === false ? 'rgba(196,75,75,0.12)' : 'rgba(196,132,58,0.1)',
            border: `0.5px solid ${importResult.ok === false ? 'var(--sb-risk-critical)' : 'var(--sb-gold)'}`,
            borderRadius: 'var(--sb-radius)',
            fontSize: '0.75rem',
            color: importResult.ok === false ? 'var(--sb-risk-critical)' : 'var(--sb-gold)',
          }}
        >
          {importResult.ok === false ? (
            <>✗ {importResult.error}</>
          ) : (
            <>✓ Imported {importResult.totalFromJira} issues from JIRA · {importResult.created} new · {importResult.updated} updated</>
          )}
        </div>
      )}

      {cfg?.lastPullAt && (
        <div style={{ fontSize: '0.65rem', color: 'var(--sb-dusty)', marginTop: '0.5rem' }}>
          Last import: {new Date(cfg.lastPullAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function SendTestEmail() {
  const [to, setTo] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState(null);
  async function send() {
    if (!to.includes('@')) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/config/test-email', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const body = await res.json();
      setResult({ ok: res.ok, body });
    } catch (e) {
      setResult({ ok: false, body: { error: e.message } });
    } finally {
      setSending(false);
    }
  }
  return (
    <div style={{ marginTop: '0.75rem', padding: '0.75rem 0.85rem', background: 'rgba(196,132,58,0.06)', border: '0.5px dashed rgba(196,132,58,0.3)', borderRadius: 'var(--sb-radius)' }}>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 6 }}>
        Send test email
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          className="sb-input"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="your.email@domain.com"
          style={{ flex: 1, fontSize: '0.8rem' }}
        />
        <button onClick={send} disabled={sending || !to.includes('@')} className="sb-btn sb-btn-gold" style={{ fontSize: '0.7rem', padding: '0.45rem 0.95rem' }}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {result && (
        <div style={{
          marginTop: '0.5rem', padding: '0.5rem 0.7rem',
          background: result.ok ? 'rgba(168,184,154,0.15)' : 'rgba(196,75,75,0.12)',
          borderRadius: 'var(--sb-radius)',
          fontSize: '0.78rem', color: result.ok ? 'var(--sb-green)' : 'var(--sb-risk-critical)',
        }}>
          {result.ok ? (
            result.body?.stub
              ? '✓ Stubbed (BREVO_API_KEY not set) — content logged to server console + DB. Set the key in Render env to deliver for real.'
              : `✓ Sent via Brevo (id: ${result.body?.id || '?'})`
          ) : (
            '✗ ' + (result.body?.error || 'failed')
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, long, type = 'text', placeholder }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.fieldLabel}>{label}</label>
      {long ? (
        <textarea
          className="sb-input sb-textarea"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="sb-input"
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, help }) {
  return (
    <div style={{ ...styles.fieldGroup, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <button
        onClick={() => onChange(!checked)}
        style={{
          marginTop: 2,
          padding: '0.35rem 0.9rem',
          background: checked ? 'var(--sb-gold)' : 'transparent',
          border: '0.5px solid rgba(196,132,58,0.4)',
          borderRadius: 'var(--sb-radius)',
          color: checked ? 'var(--sb-ivory)' : 'var(--sb-sage)',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'var(--sb-font-body)',
          minWidth: 56,
        }}
      >
        {checked ? 'On' : 'Off'}
      </button>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--sb-cream)' }}>{label}</div>
        {help && <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: 2 }}>{help}</div>}
      </div>
    </div>
  );
}
