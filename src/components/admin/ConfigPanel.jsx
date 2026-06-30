import React from 'react';
import { styles } from './adminStyles.js';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { RenderSection } from '../blocks/index.jsx';

export default function ConfigPanel({ config, onChange, scope = 'admin', site = null }) {
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

        {/* Resume presets — member only. Each named preset is a curated
            selection of sections from any page, used to generate different
            resume outputs (Executive, Technical, etc.). */}
        {isMember && <ResumePresetsCard config={config} patch={patch} site={site} />}

        {/* Resume generator — member only. Pick a preset or build a custom
            section list, then render + print to PDF without leaving the admin. */}
        {isMember && <ResumeGeneratorCard config={config} site={site} />}

        {/* Email management — member only. Signup email always stays; members
            can add personal/work emails, each verified by a 6-digit code. */}
        {isMember && <EmailManager />}

        {/* BYO Claude — member only. Powers the profile agent chat. */}
        {isMember && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Profile Agent · Bring Your Own Claude</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
            Paste an Anthropic API key to power the AI agent in your admin. The agent can read and update your site draft and config via chat. Get a key at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sb-gold)' }}>console.anthropic.com</a>.
            Stored server-side, never shown back to the client.
          </div>
          <Field
            label="Anthropic API key"
            value={config?.integrations?.anthropicKey}
            onChange={(v) => patch('integrations.anthropicKey', v)}
            placeholder="sk-ant-…"
            type="password"
          />
          <Field
            label="Model (default: claude-sonnet-4-5)"
            value={config?.integrations?.anthropicModel}
            onChange={(v) => patch('integrations.anthropicModel', v)}
            placeholder="claude-sonnet-4-5"
          />
        </div>
        )}

        {/* Third-party integrations are not yet available to members.
            Shown as roadmap R&D until the Salt Basin Connector launches. */}
        {isMember && <IntegrationsRoadmapNotice />}
      </div>
    </div>
  );
}

// ── Resume Presets (member-only) ──
// Members create named presets (e.g. "Executive", "Technical") and check
// which sections from their site to include. One preset is marked default
// and controls what shows on the public About / resume page.
function ResumePresetsCard({ config, patch, site }) {
  const presets = config?.resumePresets || [];
  const [selectedPresetId, setSelectedPresetId] = React.useState(null);

  // Flatten all pages + sections from the live site draft.
  const allSections = React.useMemo(() => {
    if (!site?.pages) return [];
    return Object.entries(site.pages).flatMap(([pageKey, page]) =>
      (page.sections || []).map((sec) => ({
        pageKey,
        pageName: page.name || pageKey,
        sectionId: sec.id,
        sectionName: sec.name || sec.type,
      }))
    );
  }, [site]);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || null;

  function updatePresets(next) {
    patch('resumePresets', next);
  }

  function addPreset() {
    const id = `preset-${Date.now()}`;
    const name = `Resume ${presets.length + 1}`;
    updatePresets([...presets, { id, name, isDefault: presets.length === 0, sections: [] }]);
    setSelectedPresetId(id);
  }

  function deletePreset(id) {
    const next = presets.filter((p) => p.id !== id);
    if (next.length > 0 && !next.some((p) => p.isDefault)) next[0].isDefault = true;
    updatePresets(next);
    if (selectedPresetId === id) setSelectedPresetId(null);
  }

  function renamePreset(id, name) {
    updatePresets(presets.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function setDefault(id) {
    updatePresets(presets.map((p) => ({ ...p, isDefault: p.id === id })));
  }

  function toggleSection(presetId, sec) {
    updatePresets(presets.map((p) => {
      if (p.id !== presetId) return p;
      const already = p.sections.some((s) => s.sectionId === sec.sectionId);
      const sections = already
        ? p.sections.filter((s) => s.sectionId !== sec.sectionId)
        : [...p.sections, sec];
      return { ...p, sections };
    }));
  }

  const labelStyle = { fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-dusty)' };

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Resume Presets</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
        Create named resume versions (e.g. Executive, Technical). For each preset, choose which sections from your pages to include. The <strong>default</strong> preset controls what visitors see on your public profile.
      </div>

      {/* Preset list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {presets.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: selectedPresetId === p.id ? 'rgba(196,132,58,0.1)' : 'transparent', borderRadius: 'var(--sb-radius)', border: '0.5px solid rgba(196,132,58,0.2)', cursor: 'pointer' }} onClick={() => setSelectedPresetId(p.id === selectedPresetId ? null : p.id)}>
            <input
              className="sb-input"
              value={p.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => renamePreset(p.id, e.target.value)}
              style={{ flex: 1, fontSize: '0.82rem', background: 'transparent', border: 'none', padding: 0, color: 'var(--sb-cream)' }}
            />
            {p.isDefault ? (
              <span style={{ ...labelStyle, color: 'var(--sb-gold)' }}>Default</span>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setDefault(p.id); }} className="sb-btn sb-btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}>Set default</button>
            )}
            <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete preset "${p.name}"?`)) deletePreset(p.id); }} title="Delete preset" style={{ width: 22, height: 22, padding: 0, background: 'transparent', border: 'none', color: 'var(--sb-risk-critical)', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}>×</button>
          </div>
        ))}
        <button type="button" onClick={addPreset} className="sb-btn sb-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.68rem', alignSelf: 'flex-start' }}>+ New preset</button>
      </div>

      {/* Section selector for selected preset */}
      {selectedPreset && (
        <div style={{ borderTop: '0.5px solid rgba(196,132,58,0.15)', paddingTop: '0.75rem' }}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Sections in "{selectedPreset.name}"</div>
          {allSections.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)' }}>No sections found — add pages and sections to your site first.</div>
          ) : (
            Object.entries(
              allSections.reduce((acc, sec) => {
                if (!acc[sec.pageName]) acc[sec.pageName] = [];
                acc[sec.pageName].push(sec);
                return acc;
              }, {})
            ).map(([pageName, secs]) => (
              <div key={pageName} style={{ marginBottom: '0.6rem' }}>
                <div style={{ ...labelStyle, color: 'var(--sb-sage)', marginBottom: '0.3rem' }}>{pageName}</div>
                {secs.map((sec) => {
                  const checked = selectedPreset.sections.some((s) => s.sectionId === sec.sectionId);
                  return (
                    <label key={sec.sectionId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.25rem' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSection(selectedPreset.id, sec)} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--sb-cream)' }}>{sec.sectionName}</span>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Resume Generator (member-only) ──
// Pick a saved preset or build an ad-hoc section list, then render a
// full-screen print-ready view. window.print() → "Save as PDF" in browser.
function ResumeGeneratorCard({ config, site }) {
  const presets = config?.resumePresets || [];
  const [mode, setMode] = React.useState('preset');
  const [activePresetId, setActivePresetId] = React.useState(
    () => presets.find((p) => p.isDefault)?.id || presets[0]?.id || null
  );
  const [adhocIds, setAdhocIds] = React.useState(new Set());
  const [generating, setGenerating] = React.useState(false);

  const allSections = React.useMemo(() => {
    if (!site?.pages) return [];
    return Object.entries(site.pages)
      .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
      .flatMap(([pageKey, page]) =>
        (page.sections || []).map((sec) => ({
          pageKey,
          pageName: page.name || pageKey,
          section: sec,
        }))
      );
  }, [site]);

  const renderSections = React.useMemo(() => {
    if (mode === 'preset') {
      const preset = presets.find((p) => p.id === activePresetId);
      if (!preset?.sections?.length) return [];
      return allSections
        .filter(({ section, pageKey }) =>
          preset.sections.some((s) => s.sectionId === section.id && s.pageKey === pageKey)
        )
        .map(({ section }) => section);
    }
    return allSections
      .filter(({ section }) => adhocIds.has(section.id))
      .map(({ section }) => section);
  }, [mode, activePresetId, adhocIds, presets, allSections]);

  function toggleAdhoc(id) {
    setAdhocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Inject print isolation CSS while overlay is open.
  React.useEffect(() => {
    if (!generating) return;
    const el = document.createElement('style');
    el.id = 'sb-resume-print-style';
    el.textContent = `@media print {
      body > * { visibility: hidden !important; }
      #sb-resume-print-root { visibility: visible !important; position: fixed; top: 0; left: 0; width: 100%; background: white; }
      #sb-resume-print-root * { visibility: visible !important; }
      .sb-resume-no-print { display: none !important; }
    }`;
    document.head.appendChild(el);
    return () => document.getElementById('sb-resume-print-style')?.remove();
  }, [generating]);

  const labelStyle = { fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-dusty)' };
  const tabBtn = (active) => ({
    flex: 1, padding: '0.45rem', fontSize: '0.68rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase',
    background: active ? 'var(--sb-navy)' : 'transparent',
    color: active ? 'var(--sb-cream)' : 'var(--sb-sage)',
    border: '0.5px solid rgba(196,132,58,0.3)', cursor: 'pointer',
    borderRadius: active ? 'calc(var(--sb-radius) - 2px)' : 0,
  });

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Generate Resume Output</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
        Select a saved preset or build a one-off section list, then generate a print-ready output you can save as PDF — without leaving the admin.
      </div>

      <div style={{ display: 'flex', gap: 2, background: 'rgba(27,42,59,0.06)', borderRadius: 'var(--sb-radius)', padding: 3, marginBottom: '1rem' }}>
        <button style={tabBtn(mode === 'preset')} onClick={() => setMode('preset')}>From Preset</button>
        <button style={tabBtn(mode === 'adhoc')} onClick={() => setMode('adhoc')}>Custom Selection</button>
      </div>

      {mode === 'preset' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
          {presets.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)' }}>No presets yet — create one in Resume Presets above.</div>
          ) : presets.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: 'var(--sb-radius)', background: activePresetId === p.id ? 'rgba(196,132,58,0.1)' : 'transparent', border: `0.5px solid ${activePresetId === p.id ? 'rgba(196,132,58,0.4)' : 'rgba(196,132,58,0.12)'}` }}>
              <input type="radio" name="resume-gen-preset" value={p.id} checked={activePresetId === p.id} onChange={() => setActivePresetId(p.id)} />
              <span style={{ fontSize: '0.84rem', color: 'var(--sb-cream)', flex: 1 }}>{p.name}</span>
              {p.isDefault && <span style={{ ...labelStyle, color: 'var(--sb-gold)' }}>Default</span>}
              <span style={{ ...labelStyle }}>{p.sections?.length || 0} sections</span>
            </label>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '0.75rem' }}>
          {allSections.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)' }}>No sections found — add pages and sections first.</div>
          ) : Object.entries(
            allSections.reduce((acc, { pageName, section }) => {
              if (!acc[pageName]) acc[pageName] = [];
              acc[pageName].push(section);
              return acc;
            }, {})
          ).map(([pageName, secs]) => (
            <div key={pageName} style={{ marginBottom: '0.6rem' }}>
              <div style={{ ...labelStyle, color: 'var(--sb-sage)', marginBottom: '0.3rem' }}>{pageName}</div>
              {secs.map((sec) => (
                <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.2rem' }}>
                  <input type="checkbox" checked={adhocIds.has(sec.id)} onChange={() => toggleAdhoc(sec.id)} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--sb-cream)' }}>{sec.name || sec.type}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => renderSections.length > 0 && setGenerating(true)}
        disabled={renderSections.length === 0}
        className="sb-btn sb-btn-gold"
        style={{ padding: '0.55rem 1.25rem', fontSize: '0.75rem', opacity: renderSections.length === 0 ? 0.45 : 1 }}
      >
        Generate ({renderSections.length} section{renderSections.length !== 1 ? 's' : ''})
      </button>

      {generating && (
        <ResumeGenerateOverlay
          sections={renderSections}
          config={config}
          title={mode === 'preset' ? (presets.find((p) => p.id === activePresetId)?.name || 'Resume') : 'Custom Resume'}
          onClose={() => setGenerating(false)}
        />
      )}
    </div>
  );
}

function ResumeGenerateOverlay({ sections, config, title, onClose }) {
  return (
    <div
      id="sb-resume-print-root"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#f8f4ee', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        className="sb-resume-no-print"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.5rem', background: 'var(--sb-navy)', borderBottom: '0.5px solid rgba(196,132,58,0.2)', flexShrink: 0 }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>Resume Output</div>
          <div style={{ fontSize: '0.92rem', color: 'var(--sb-cream)', marginTop: 2 }}>{title}</div>
        </div>
        <button onClick={() => window.print()} className="sb-btn sb-btn-gold" style={{ fontSize: '0.75rem', padding: '0.5rem 1.1rem' }}>
          Print / Save PDF
        </button>
        <button onClick={onClose} style={{ background: 'transparent', border: '0.5px solid rgba(232,221,208,0.2)', borderRadius: 'var(--sb-radius)', color: 'var(--sb-sage)', cursor: 'pointer', padding: '0.45rem 0.9rem', fontSize: '0.75rem', fontFamily: 'var(--sb-font-body)' }}>
          ✕ Close
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f4ee' }}>
        {sections.map((sec) => (
          <RenderSection key={sec.id} section={sec} config={config} mode="public" />
        ))}
      </div>

      <style>{`@media print { .sb-resume-no-print { display: none !important; } #sb-resume-print-root > div:last-child { overflow: visible !important; } }`}</style>
    </div>
  );
}

// ── Multi-source Database Connector (member-only) ──
function IntegrationsRoadmapNotice() {
  return (
    <div style={{ background: 'rgba(201,168,76,0.04)', border: '0.5px solid rgba(201,168,76,0.18)', borderRadius: 6, padding: '1rem 1.1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1rem' }}>🔬</span>
        <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>Integrations — Under Research</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--sb-cream)', lineHeight: 1.65, marginBottom: '0.4rem' }}>
        Third-party app connections are not available to members at this time. Salt Basin Net Works does not currently hold official partnerships or registered app status with any external platform.
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', lineHeight: 1.55 }}>
        Integration possibilities are actively being researched as the platform evolves. Which connections get built — and when — will depend on where the platform goes. Nothing is committed.
      </div>
    </div>
  );
}

// Members can add multiple named Postgres/Supabase connections. Each is
// independently named, described, and access-controlled. The profile agent
// gains query tools scoped to each connected source.
function MemberDbsCard({ config, patch }) {
  const dbs = config?.integrations?.memberDbs || [];
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: '', description: '', url: '', allowWrite: false });

  function updateDbs(next) {
    patch('integrations.memberDbs', next);
  }

  function addDb() {
    if (!draft.name || !draft.url) return;
    const id = `db-${Date.now()}`;
    updateDbs([...dbs, { id, ...draft }]);
    setDraft({ name: '', description: '', url: '', allowWrite: false });
    setAdding(false);
  }

  function removeDb(id) {
    if (!window.confirm('Remove this database source?')) return;
    updateDbs(dbs.filter((d) => d.id !== id));
  }

  function updateDb(id, field, value) {
    updateDbs(dbs.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }

  const lbl = { fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-dusty)' };

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>External Data Sources</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem', lineHeight: 1.55 }}>
        Connect your own Postgres or Supabase databases. Each source is named and independently controlled.
        The profile agent gains a <code style={{ color: 'var(--sb-gold)' }}>query_member_db</code> tool per source — your data stays separate from Salt Basin's schema.
        Connection strings are stored server-side and never returned to the browser.
      </div>

      {dbs.length === 0 && !adding && (
        <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginBottom: '0.75rem' }}>No external sources connected yet.</div>
      )}

      {dbs.map((db) => (
        <div key={db.id} style={{ padding: '0.75rem', background: 'rgba(196,132,58,0.05)', border: '0.5px solid rgba(196,132,58,0.2)', borderRadius: 'var(--sb-radius)', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              className="sb-input"
              value={db.name}
              onChange={(e) => updateDb(db.id, 'name', e.target.value)}
              placeholder="Source name (e.g. My CRM)"
              style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500, marginRight: '0.5rem' }}
            />
            <button onClick={() => removeDb(db.id)} style={{ width: 26, height: 26, padding: 0, background: 'transparent', border: '0.5px solid rgba(196,132,58,0.25)', borderRadius: 'var(--sb-radius)', color: 'var(--sb-risk-critical)', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
          <input
            className="sb-input"
            value={db.description || ''}
            onChange={(e) => updateDb(db.id, 'description', e.target.value)}
            placeholder="Description (e.g. Salesforce CRM export, analytics DB)"
            style={{ fontSize: '0.78rem', marginBottom: '0.4rem', width: '100%' }}
          />
          <div style={{ ...lbl, marginBottom: '0.25rem' }}>Connection string</div>
          <input
            className="sb-input"
            type="password"
            value={db.url || ''}
            onChange={(e) => updateDb(db.id, 'url', e.target.value)}
            placeholder="postgres://user:pass@host:5432/dbname"
            style={{ fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '0.5rem', width: '100%' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!db.allowWrite} onChange={(e) => updateDb(db.id, 'allowWrite', e.target.checked)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--sb-sage)' }}>Allow agent write access (INSERT / UPDATE / DELETE) — off by default</span>
          </label>
        </div>
      ))}

      {adding ? (
        <div style={{ padding: '0.75rem', background: 'rgba(196,132,58,0.05)', border: '0.5px dashed rgba(196,132,58,0.3)', borderRadius: 'var(--sb-radius)', marginBottom: '0.6rem' }}>
          <div style={{ ...lbl, marginBottom: '0.4rem' }}>New source</div>
          <input className="sb-input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Source name (e.g. My CRM)" style={{ marginBottom: '0.4rem', width: '100%' }} />
          <input className="sb-input" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description" style={{ fontSize: '0.78rem', marginBottom: '0.4rem', width: '100%' }} />
          <input className="sb-input" type="password" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="postgres://…" style={{ fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '0.5rem', width: '100%' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={draft.allowWrite} onChange={(e) => setDraft((d) => ({ ...d, allowWrite: e.target.checked }))} />
            <span style={{ fontSize: '0.75rem', color: 'var(--sb-sage)' }}>Allow agent write access</span>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={addDb} disabled={!draft.name || !draft.url} className="sb-btn sb-btn-gold" style={{ fontSize: '0.7rem', padding: '0.4rem 0.9rem', opacity: (!draft.name || !draft.url) ? 0.45 : 1 }}>Add source</button>
            <button onClick={() => setAdding(false)} className="sb-btn sb-btn-outline" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="sb-btn sb-btn-outline" style={{ fontSize: '0.7rem', padding: '0.45rem 0.9rem' }}>+ Add data source</button>
      )}
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

// ── Connected Apps (OAuth) ────────────────────────────────────────────────────
function ConnectedAppsCard() {
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(null); // provider id being acted on
  const [supabasePat, setSupabasePat] = React.useState('');
  const [showPat, setShowPat] = React.useState(false);
  const [patBusy, setPatBusy] = React.useState(false);

  function load() {
    fetch('/api/oauth/connections', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }
  React.useEffect(load, []);

  function connect(provider) {
    window.location.href = `/api/oauth/${provider}/connect`;
  }

  async function disconnect(provider) {
    if (!window.confirm(`Disconnect ${provider}? This will remove all saved tokens.`)) return;
    setBusy(provider);
    await fetch(`/api/oauth/connections/${provider}`, { method: 'DELETE', credentials: 'same-origin' });
    setBusy(null);
    load();
  }

  async function toggleWrite(provider, current) {
    await fetch(`/api/oauth/connections/${provider}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ allowWrite: !current }),
    });
    load();
  }

  async function saveSupabasePat() {
    if (!supabasePat) return;
    setPatBusy(true);
    const r = await fetch('/api/oauth/supabase/pat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ pat: supabasePat }),
    });
    setPatBusy(false);
    if (r.ok) { setShowPat(false); setSupabasePat(''); load(); }
    else { const d = await r.json(); alert(d.error || 'Failed'); }
  }

  const cardRow = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '0.5px solid rgba(200,193,183,0.15)' };
  const iconStyle = { fontSize: '1.25rem', width: 28, textAlign: 'center', flexShrink: 0 };
  const providerName = { fontWeight: 600, fontSize: '0.84rem', color: 'var(--sb-cream)', flex: 1 };
  const subtext = { fontSize: '0.68rem', color: 'var(--sb-dusty)', marginTop: 1 };
  const btnSm = (active) => ({
    padding: '3px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--sb-teal)' : 'rgba(200,193,183,0.3)'}`,
    background: active ? 'var(--sb-teal)' : 'transparent',
    color: active ? '#fff' : 'var(--sb-dusty)',
  });

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Connected Apps</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', marginBottom: '0.9rem', lineHeight: 1.55 }}>
        Connect external systems so your profile agent can read (and optionally write) real data. Tokens are encrypted at rest and never exposed in the browser.
      </div>

      {!data && <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)' }}>Loading…</div>}

      {data && (
        <>
          {/* Active connections */}
          {data.connections.map((c) => (
            <div key={c.provider} style={cardRow}>
              <span style={iconStyle}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={providerName}>{c.label}</div>
                <div style={subtext}>Connected as: {c.connectedAs || '—'}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: '0.68rem', color: 'var(--sb-dusty)', flexShrink: 0 }}>
                <input type="checkbox" checked={!!c.allowWrite} onChange={() => toggleWrite(c.provider, c.allowWrite)} />
                Write
              </label>
              <button onClick={() => disconnect(c.provider)} disabled={busy === c.provider}
                style={{ ...btnSm(false), color: 'var(--sb-risk-critical)', borderColor: 'rgba(220,80,80,0.3)', flexShrink: 0 }}>
                {busy === c.provider ? '…' : 'Disconnect'}
              </button>
            </div>
          ))}

          {/* Available providers */}
          {data.available.map((p) => (
            <div key={p.provider} style={cardRow}>
              <span style={iconStyle}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={providerName}>{p.label}</div>
                <div style={subtext}>{p.description}</div>
                {p.provider === 'supabase' && showPat && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="password"
                      className="sb-input"
                      placeholder="Paste personal access token"
                      value={supabasePat}
                      onChange={(e) => setSupabasePat(e.target.value)}
                      style={{ fontSize: '0.72rem', flex: 1 }}
                    />
                    <button onClick={saveSupabasePat} disabled={patBusy} style={{ ...btnSm(true), background: 'var(--sb-sage)' }}>
                      {patBusy ? '…' : 'Save'}
                    </button>
                    <button onClick={() => setShowPat(false)} style={btnSm(false)}>Cancel</button>
                  </div>
                )}
              </div>
              <button
                onClick={() => p.provider === 'supabase' ? setShowPat(true) : connect(p.provider)}
                style={{ ...btnSm(true), background: 'var(--sb-gold)', borderColor: 'var(--sb-gold)', color: '#fff', flexShrink: 0 }}>
                Connect
              </button>
            </div>
          ))}

          {data.connections.length === 0 && data.available.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)' }}>No providers configured in .env.</div>
          )}
        </>
      )}

      <div style={{ marginTop: '0.75rem', fontSize: '0.68rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
        To register Salt Basin as an app with each provider, see the integration setup guide. Credentials go in your <code>.env</code> as <code>PROVIDER_CLIENT_ID</code> and <code>PROVIDER_CLIENT_SECRET</code>.
      </div>
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
