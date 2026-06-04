import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import PublicFooter from './PublicFooter.jsx';
import { InlineDataNotice } from './DataNotice.jsx';
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

  useEffect(() => {
    if (!token) {
      setError('This link is missing its access token. Use the original URL from your confirmation.');
      return;
    }
    fetchLead();
    api.getPublicConfig().then(setConfig).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, token]);

  function fetchLead() {
    return fetch(`/api/leads/public/${publicId}?t=${encodeURIComponent(token)}`)
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
  }

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
      // Refetch so the activity + summary panels reflect the latest server state.
      await fetchLead();
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

  const answeredKeys = Object.entries(answers).filter(([, v]) => v && String(v).trim());
  const convertUrl = `/signup?fromLead=${lead.publicId}&t=${encodeURIComponent(token)}`;

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
        {/* Header */}
        <div style={{ maxWidth: 1100, margin: '0 auto 2.5rem' }}>
          <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
            You're in. Here's your record.
          </div>
          <h1 className="sb-display" style={{ fontSize: '2.8rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            Lead #{lead.publicId}
          </h1>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <SummaryRow label="Email" value={lead.email} />
            <SummaryRow label="First source" value={sourceLabel(lead.source)} />
            <SummaryRow label="Created" value={new Date(lead.createdAt).toLocaleString()} />
            <SummaryRow label="Last update" value={new Date(lead.updatedAt).toLocaleString()} />
          </div>
        </div>

        {/* Main grid: summary + activity (left) | intake form (right) */}
        <div style={pageGrid}>
          {/* LEFT — Activity timeline + answers summary + bookmark + convert CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Activity timeline */}
            <PanelCard title={`Activity · ${lead.activity?.length || 0} submission${lead.activity?.length === 1 ? '' : 's'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(lead.activity || []).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      gap: '0.65rem',
                      alignItems: 'flex-start',
                      paddingBottom: '0.6rem',
                      borderBottom: '0.5px dashed rgba(196,132,58,0.18)',
                    }}
                  >
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: '50%', background: 'var(--sb-gold)',
                        marginTop: 6, flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>
                        {sourceLabel(a.source)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                      {a.message && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', marginTop: 4, lineHeight: 1.5 }}>
                          “{a.message}”
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!lead.activity || lead.activity.length === 0) && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
                    No activity logged yet.
                  </div>
                )}
              </div>
            </PanelCard>

            {/* Captured answers summary */}
            <PanelCard
              title={`Captured Context · ${answeredKeys.length}/${INTAKE_QUESTIONS.length} answered`}
            >
              {answeredKeys.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
                  Nothing saved yet. Fill in the form on the right and click Save — your answers will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {INTAKE_QUESTIONS.map((q) => {
                    const v = answers[q.key];
                    if (!v || !String(v).trim()) return null;
                    return (
                      <div
                        key={q.key}
                        style={{
                          background: 'var(--sb-navy-deep)',
                          border: '0.5px solid rgba(196,132,58,0.18)',
                          borderRadius: 'var(--sb-radius)',
                          padding: '0.7rem 0.9rem',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--sb-font-label)',
                            fontSize: '0.6rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--sb-gold)',
                            marginBottom: 3,
                          }}
                        >
                          {q.label}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', whiteSpace: 'pre-wrap' }}>
                          {String(v)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PanelCard>

            {/* Convert to member */}
            {!lead.convertedUserId ? (
              <PanelCard title="Become a Salt Basin member">
                <p style={{ fontSize: '0.85rem', color: 'var(--sb-sage)', lineHeight: 1.65, marginBottom: '1rem' }}>
                  Turn this lead into a full Salt Basin operator profile. You keep everything you've shared here, plus get your own profile site at <code style={{ color: 'var(--sb-gold)' }}>/u/your-slug</code> that companies can discover.
                </p>
                <Link to={convertUrl} className="sb-btn sb-btn-gold" style={{ padding: '0.55rem 1.25rem', fontSize: '0.72rem' }}>
                  ✦ Become a Member
                </Link>
              </PanelCard>
            ) : (
              <PanelCard title="Already a member">
                <p style={{ fontSize: '0.85rem', color: 'var(--sb-sage)', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                  This lead has been converted into a member account.
                </p>
                <Link to="/member" className="sb-btn sb-btn-outline" style={{ padding: '0.55rem 1.25rem', fontSize: '0.72rem' }}>
                  Go to Member Dashboard
                </Link>
              </PanelCard>
            )}

            {/* Bookmark */}
            <PanelCard title="Bookmark this page · come back anytime">
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--sb-sage)', marginBottom: '0.75rem' }}>
                Save this URL. You can return later to add details or update what you've shared with me.
              </p>
              <button onClick={copyUrl} className="sb-btn sb-btn-outline" style={{ fontSize: '0.72rem', padding: '0.5rem 1rem' }}>
                {copied ? '✓ Copied' : 'Copy this URL'}
              </button>
            </PanelCard>

            {/* Agent teaser */}
            <div style={agentTeaser}>
              <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
                ✦ BestyStaff agent · coming soon
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--sb-sage)' }}>
                Next phase: an AI agent (built on Claude) will live here and ask follow-up questions tailored to your context. Same record, more depth.
              </p>
            </div>
          </div>

          {/* RIGHT — Intake form */}
          <div style={formCard}>
            <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
              Tell me more about your situation
            </div>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', marginBottom: '1rem', letterSpacing: '0.02em' }}>
              The faster I know, the better I can route.
            </h2>
            <InlineDataNotice dark style={{ marginBottom: '1.5rem' }} />

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
                  ✓ Saved — see your summary on the left.
                </span>
              )}
            </div>

            <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--sb-dusty)', lineHeight: 1.6 }}>
              All answers stay attached to lead <code style={{ color: 'var(--sb-gold)' }}>{lead.publicId}</code>. You can come back to this URL anytime to update them.
            </p>

            {/* Secondary convert CTA at the bottom of the form */}
            {!lead.convertedUserId && (
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '0.5px dashed rgba(196,132,58,0.25)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginBottom: '0.6rem' }}>
                  Want a permanent home for your profile?
                </p>
                <Link to={convertUrl} className="sb-btn sb-btn-outline" style={{ padding: '0.5rem 1.15rem', fontSize: '0.7rem' }}>
                  ✦ Become a Salt Basin Member
                </Link>
              </div>
            )}
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
    <div>
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
      <div style={{ fontSize: '0.92rem', color: 'var(--sb-cream)', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(196,132,58,0.25)',
        borderTop: '2px solid var(--sb-gold)',
        borderRadius: 'var(--sb-radius)',
        padding: '1.25rem 1.4rem',
      }}
    >
      <div
        className="sb-label"
        style={{
          color: 'var(--sb-gold)',
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          marginBottom: '0.75rem',
          paddingBottom: '0.45rem',
          borderBottom: '0.5px solid rgba(196,132,58,0.2)',
        }}
      >
        {title}
      </div>
      {children}
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
  gap: '2.5rem',
  alignItems: 'start',
};
const formCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(196,132,58,0.4)',
  borderTop: '3px solid var(--sb-gold)',
  borderRadius: 'var(--sb-radius)',
  padding: '2rem',
};
const agentTeaser = {
  padding: '1.25rem 1.4rem',
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
