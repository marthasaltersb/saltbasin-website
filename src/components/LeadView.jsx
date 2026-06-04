import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import PublicFooter from './PublicFooter.jsx';
import { api } from '../lib/api.js';

const SOURCE_LABELS = {
  joinNetwork: 'Join the Network · Operator interest',
  forCompanies: 'For Companies · Hiring interest',
  assessments: 'Assessments · Launch notification',
  contact: 'Contact form',
};
function sourceLabel(src) {
  return SOURCE_LABELS[src] || src;
}

// Structured questions the lead can answer at any time. Each writes to a
// stable key in the `answers` JSON blob on the lead record so the agent
// (Slice 2) can read the same data.
const INTAKE_QUESTIONS = [
  {
    key: 'role',
    label: 'What is your current role?',
    placeholder: 'e.g. CFO, Head of RevOps, VP Sales',
    type: 'text',
  },
  {
    key: 'company',
    label: 'Company name + size (revenue or headcount, optional)',
    placeholder: 'e.g. ACME SaaS · $40M ARR',
    type: 'text',
  },
  {
    key: 'timeline',
    label: 'When are you hoping to engage?',
    placeholder: 'choose one',
    type: 'select',
    options: [
      '',
      'Immediately',
      'Within 30 days',
      '1–3 months',
      '3–6 months',
      'Just exploring',
    ],
  },
  {
    key: 'context',
    label: 'Anything specific you want me to know?',
    placeholder: 'Operating context, urgency, the problem in your own words…',
    type: 'textarea',
  },
];

export default function LeadView() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const [lead, setLead] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(null);

  // The lead-facing URL includes the token. If it's missing, we can't proceed.
  useEffect(() => {
    if (!token) {
      setError('This link is missing its access token. Use the original URL from your confirmation.');
      return;
    }
    fetch(`/api/leads/public/${publicId}?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `Error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLead(data);
        setAnswers(data.answers || {});
        setName(data.name || '');
      })
      .catch((e) => setError(e.message));

    api.getPublicConfig().then(setConfig).catch(() => {});
  }, [publicId, token]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/public/${publicId}?t=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, answers }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function copyUrl() {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) {
    return (
      <div style={errorWrap}>
        <h1 className="sb-display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Lead Not Available
        </h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="sb-btn sb-btn-outline">← Back to Salt Basin</Link>
      </div>
    );
  }
  if (!lead) return null;

  return (
    <div>
      {/* Slim nav */}
      <nav style={topbarStyle}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="sb-display" style={{ fontSize: '1.05rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-cream)' }}>
            ← Salt Basin Net Works
          </div>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
            Lead Intake
          </div>
        </Link>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sb-dusty)' }}>
          Lead · {lead.publicId}
        </div>
      </nav>

      <div style={containerStyle}>
        <div style={pageGrid}>
          {/* LEFT — Lead summary + bookmark */}
          <div>
            <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
              You're in. Here's your record.
            </div>
            <h1 className="sb-display" style={{ fontSize: '2.6rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              Lead #{lead.publicId}
            </h1>
            <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
            <SummaryRow label="Email" value={lead.email} />
            <SummaryRow label="Source" value={sourceLabel(lead.source)} />
            {lead.message && <SummaryRow label="Original message" value={lead.message} />}
            <SummaryRow label="Created" value={new Date(lead.createdAt).toLocaleString()} />

            {/* Bookmark / share back */}
            <div style={bookmarkBox}>
              <div className="sb-label" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem', fontSize: '0.62rem', letterSpacing: '0.16em' }}>
                Save this page · come back anytime
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--sb-sage)', marginBottom: '0.75rem' }}>
                Bookmark this URL. You can return later to add details or update what you've shared with me.
              </p>
              <button onClick={copyUrl} className="sb-btn sb-btn-outline" style={{ fontSize: '0.72rem', padding: '0.5rem 1rem' }}>
                {copied ? '✓ Copied' : 'Copy this URL'}
              </button>
            </div>

            {/* Agent placeholder — Slice 2 will render BestyStaff chat here */}
            <div style={agentTeaser}>
              <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
                ✦ BestyStaff agent · coming soon
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--sb-sage)' }}>
                In the next phase, an AI agent (built on Claude) will live right here and ask follow-up questions to help us scope your situation properly. For now, use the form on the right.
              </p>
            </div>
          </div>

          {/* RIGHT — Intake form */}
          <div style={formCard}>
            <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
              Tell me more about your situation
            </div>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', marginBottom: '1.5rem', letterSpacing: '0.02em' }}>
              The faster I know, the better I can route.
            </h2>

            <Field
              label="Your name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="What should I call you?"
            />

            {INTAKE_QUESTIONS.map((q) => (
              <Field
                key={q.key}
                label={q.label}
                type={q.type}
                value={answers[q.key] || ''}
                onChange={(v) => setAnswers({ ...answers, [q.key]: v })}
                placeholder={q.placeholder}
                options={q.options}
              />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={save} className="sb-btn sb-btn-gold" disabled={saving} style={{ padding: '0.65rem 1.5rem' }}>
                {saving ? 'Saving…' : 'Save Updates'}
              </button>
              {saved && (
                <span style={{ fontSize: '0.85rem', color: 'var(--sb-green)' }}>
                  ✓ Saved
                </span>
              )}
            </div>

            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
              All answers stay attached to lead <code style={{ color: 'var(--sb-gold)' }}>{lead.publicId}</code>. You can come back to this URL anytime to update them.
            </p>
          </div>
        </div>
      </div>
      <PublicFooter config={config} />
    </div>
  );
}

// ── Sub-components ──
function SummaryRow({ label, value }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.6rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', color: 'var(--sb-cream)', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, options }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--sb-dusty)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="sb-input sb-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : type === 'select' ? (
        <select
          className="sb-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o || placeholder}</option>
          ))}
        </select>
      ) : (
        <input
          className="sb-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// ── Inline styles ──
const topbarStyle = {
  position: 'sticky',
  top: 0,
  background: 'rgba(27,42,59,0.97)',
  backdropFilter: 'blur(8px)',
  padding: '1rem 1.5rem',
  borderBottom: '0.5px solid rgba(232,221,208,0.12)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 100,
};
const containerStyle = {
  minHeight: '70vh',
  padding: '4rem 1.5rem',
  background: 'var(--sb-navy)',
};
const pageGrid = {
  maxWidth: 1100,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1fr 1.1fr',
  gap: '3rem',
  alignItems: 'start',
};
const formCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(196,132,58,0.4)',
  borderTop: '3px solid var(--sb-gold)',
  borderRadius: 'var(--sb-radius)',
  padding: '2rem',
};
const bookmarkBox = {
  marginTop: '2rem',
  padding: '1.25rem 1.5rem',
  background: 'rgba(196,132,58,0.08)',
  border: '0.5px solid rgba(196,132,58,0.25)',
  borderRadius: 'var(--sb-radius)',
};
const agentTeaser = {
  marginTop: '1.5rem',
  padding: '1.25rem 1.5rem',
  background: 'var(--sb-navy-deep)',
  border: '0.5px dashed rgba(196,132,58,0.35)',
  borderRadius: 'var(--sb-radius)',
};
const errorWrap = {
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  color: 'var(--sb-cream)',
  textAlign: 'center',
  padding: '4rem 2rem',
  background: 'var(--sb-navy)',
};
