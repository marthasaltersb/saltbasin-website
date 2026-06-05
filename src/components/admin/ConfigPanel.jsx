import React from 'react';
import { styles } from './adminStyles.js';

export default function ConfigPanel({ config, onChange }) {
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

        {/* Pre-launch */}
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

        {/* Social */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Social Media Links (footer)</div>
          {Object.entries(config?.social || {}).map(([k, s]) => (
            <div
              key={k}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr auto',
                gap: '0.5rem',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>{s.label}</span>
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
            </div>
          ))}
        </div>

        {/* Email identity */}
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
            Until <code style={{ color: 'var(--sb-gold)' }}>RESEND_API_KEY</code> is set in Render env, emails are stubbed (logged to console + DB but not delivered).
          </div>
        </div>

        {/* BestyStaff persona */}
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
      </div>
    </div>
  );
}

function Field({ label, value, onChange, long, type = 'text' }) {
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
