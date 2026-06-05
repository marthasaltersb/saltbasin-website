import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import PublicFooter from './PublicFooter.jsx';
import { InlineDataNotice } from './DataNotice.jsx';
import BackLink from './BackLink.jsx';
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

const INTAKE_QUESTIONS = [
  { key: 'role', label: 'What is your current role?', placeholder: 'e.g. CFO, Head of RevOps, VP Sales', type: 'text' },
  { key: 'company', label: 'Company name + size (revenue or headcount, optional)', placeholder: 'e.g. ACME SaaS · $40M ARR', type: 'text' },
  { key: 'timeline', label: 'When are you hoping to engage?', placeholder: 'choose one', type: 'select',
    options: ['', 'Immediately', 'Within 30 days', '1–3 months', '3–6 months', 'Just exploring'] },
  { key: 'context', label: 'Anything specific you want me to know?', placeholder: 'Operating context, urgency, the problem…', type: 'textarea' },
];

export default function LeadView() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const legacyToken = searchParams.get('t');

  // Auth state for this lead.
  const [authState, setAuthState] = useState('checking'); // checking | needsPassword | authed | error
  const [authError, setAuthError] = useState(null);
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [lead, setLead] = useState(null);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState(null);

  function loadLead() {
    const qs = legacyToken ? `?t=${encodeURIComponent(legacyToken)}` : '';
    return fetch(`/api/leads/public/${publicId}${qs}`, { credentials: 'include' })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok) {
          setLead(body);
          setAnswers(body.answers || {});
          setName(body.name || '');
          setPhone(body.phone || '');
          setAuthState('authed');
          return;
        }
        if (r.status === 401 && body.needsPassword) {
          setAuthState('needsPassword');
          return;
        }
        if (r.status === 410) {
          setAuthError('This lead has been merged into a newer record.');
          setAuthState('error');
          return;
        }
        if (r.status === 404) {
          setAuthError('That lead record does not exist.');
          setAuthState('error');
          return;
        }
        setAuthError(body.error || `Error ${r.status}`);
        setAuthState('error');
      })
      .catch((e) => {
        setAuthError(e.message);
        setAuthState('error');
      });
  }

  useEffect(() => {
    loadLead();
    api.getPublicConfig().then(setConfig).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, legacyToken]);

  async function unlock(e) {
    e.preventDefault();
    const password = e.target.password.value.trim();
    if (!password) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      const res = await fetch(`/api/leads/public/${publicId}/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Incorrect password');
      await loadLead();
    } catch (err) {
      setUnlockError(err.message);
    } finally {
      setUnlocking(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/public/${publicId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, answers }),
      });
      if (!res.ok) throw new Error('Save failed');
      await loadLead();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Render branches ──
  if (authState === 'checking') return null;
  if (authState === 'error') {
    return (
      <div style={errorWrap}>
        <h1 className="sb-display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Lead Not Available</h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '2rem' }}>{authError}</p>
        <BackLink>← Back to Salt Basin</BackLink>
      </div>
    );
  }
  if (authState === 'needsPassword') {
    return (
      <div style={errorWrap}>
        <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>Salt Basin · Lead #{publicId}</p>
        <h1 className="sb-display" style={{ fontSize: '2.2rem', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
          Private lead record
        </h1>
        <p style={{ color: 'var(--sb-sage)', marginBottom: '1.5rem', maxWidth: 400 }}>
          Enter the password you received when you submitted. Lost it? Submit again with the same email and a new password will be issued.
        </p>
        <form onSubmit={unlock} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 320 }}>
          <input
            name="password"
            type="password"
            placeholder="Lead password"
            className="sb-input"
            required
            autoFocus
          />
          <button type="submit" className="sb-btn sb-btn-gold" disabled={unlocking} style={{ justifyContent: 'center' }}>
            {unlocking ? 'Unlocking…' : 'Unlock record'}
          </button>
          {unlockError && (
            <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', textAlign: 'center' }}>{unlockError}</div>
          )}
        </form>
      </div>
    );
  }

  // ── Authed view ──
  if (!lead) return null;
  const answeredKeys = Object.entries(answers).filter(([, v]) => v && String(v).trim());

  return (
    <div>
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
        <div style={{ maxWidth: 1100, margin: '0 auto 2.5rem' }}>
          <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>You're in. Here's your record.</div>
          <h1 className="sb-display" style={{ fontSize: '2.8rem', color: 'var(--sb-cream)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            Lead #{lead.publicId}
          </h1>
          <div className="sb-gold-rule" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <SummaryRow label="Email" value={lead.email} />
            <SummaryRow label="Phone" value={lead.phone || '—'} />
            <SummaryRow label="First source" value={sourceLabel(lead.source)} />
            <SummaryRow label="Created" value={new Date(lead.createdAt).toLocaleString()} />
            <SummaryRow label="Last update" value={new Date(lead.updatedAt).toLocaleString()} />
            {lead.mergedFromCount > 0 && (
              <SummaryRow label="Merged from" value={`${lead.mergedFromCount} prior submission${lead.mergedFromCount === 1 ? '' : 's'}`} />
            )}
          </div>
        </div>

        <div style={pageGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <PanelCard title={`Activity · ${lead.activity?.length || 0} submission${lead.activity?.length === 1 ? '' : 's'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(lead.activity || []).map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', paddingBottom: '0.6rem', borderBottom: '0.5px dashed rgba(196,132,58,0.18)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sb-gold)', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>
                        {sourceLabel(a.source)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>
                        {new Date(Number(a.created_at)).toLocaleString()}
                        {a.cta_location && <span style={{ opacity: 0.6, marginLeft: 6 }}>· {a.cta_location}</span>}
                      </div>
                      {a.message && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', marginTop: 4, lineHeight: 1.5 }}>
                          “{a.message}”
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>

            {lead.priorNotes?.length > 0 && (
              <PanelCard title={`Prior inquiries · ${lead.priorNotes.length} merged record${lead.priorNotes.length === 1 ? '' : 's'}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {lead.priorNotes.map((n, i) => (
                    <div key={i} style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 'var(--sb-radius)', padding: '0.75rem 0.9rem' }}>
                      <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
                        Lead #{n.publicId} · {sourceLabel(n.source)} · {new Date(n.at).toLocaleDateString()}
                      </div>
                      {n.message && <div style={{ fontSize: '0.82rem', color: 'var(--sb-cream)', marginBottom: 4 }}>“{n.message}”</div>}
                      {Object.keys(n.answers || {}).length > 0 && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--sb-sage)' }}>
                          {Object.entries(n.answers).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </PanelCard>
            )}

            <PanelCard title={`Captured Context · ${answeredKeys.length}/${INTAKE_QUESTIONS.length} answered`}>
              {answeredKeys.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', fontStyle: 'italic' }}>
                  Nothing saved yet. Fill in the form on the right and click Save.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {INTAKE_QUESTIONS.map((q) => {
                    const v = answers[q.key];
                    if (!v || !String(v).trim()) return null;
                    return (
                      <div key={q.key} style={{ background: 'var(--sb-navy-deep)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 'var(--sb-radius)', padding: '0.7rem 0.9rem' }}>
                        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 3 }}>
                          {q.label}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--sb-cream)', whiteSpace: 'pre-wrap' }}>{String(v)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PanelCard>
          </div>

          <div style={formCard}>
            <div className="sb-eyebrow" style={{ color: 'var(--sb-gold)', marginBottom: '0.4rem' }}>
              Tell me more about your situation
            </div>
            <h2 className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', marginBottom: '1rem', letterSpacing: '0.02em' }}>
              The faster I know, the better I can route.
            </h2>
            <InlineDataNotice dark style={{ marginBottom: '1.5rem' }} />

            <Field label="Your name" type="text" value={name} onChange={setName} placeholder="What should I call you?" />
            <Field label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="555-555-5555" />
            {INTAKE_QUESTIONS.map((q) => (
              <Field key={q.key} label={q.label} type={q.type} value={answers[q.key] || ''}
                onChange={(v) => setAnswers({ ...answers, [q.key]: v })}
                placeholder={q.placeholder} options={q.options}
              />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={save} className="sb-btn sb-btn-gold" disabled={saving} style={{ padding: '0.65rem 1.5rem' }}>
                {saving ? 'Saving…' : 'Save Updates'}
              </button>
              {saved && <span style={{ fontSize: '0.85rem', color: 'var(--sb-green)' }}>✓ Saved</span>}
            </div>
          </div>
        </div>
      </div>
      <PublicFooter config={config} />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.92rem', color: 'var(--sb-cream)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.25)', borderTop: '2px solid var(--sb-gold)', borderRadius: 'var(--sb-radius)', padding: '1.25rem 1.4rem' }}>
      <div className="sb-label" style={{ color: 'var(--sb-gold)', fontSize: '0.62rem', letterSpacing: '0.16em', marginBottom: '0.75rem', paddingBottom: '0.45rem', borderBottom: '0.5px solid rgba(196,132,58,0.2)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, options }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sb-dusty)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea className="sb-input sb-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : type === 'select' ? (
        <select className="sb-input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (<option key={o} value={o}>{o || placeholder}</option>))}
        </select>
      ) : (
        <input className="sb-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

const topbarStyle = {
  position: 'sticky', top: 0,
  background: 'rgba(27,42,59,0.97)', backdropFilter: 'blur(8px)',
  padding: '1rem 1.5rem',
  borderBottom: '0.5px solid rgba(232,221,208,0.12)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  zIndex: 100,
};
const containerStyle = { minHeight: '70vh', padding: '4rem 1.5rem', background: 'var(--sb-navy)' };
const pageGrid = {
  maxWidth: 1100, margin: '0 auto',
  display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '2.5rem', alignItems: 'start',
};
const formCard = {
  background: 'rgba(255,255,255,0.04)',
  border: '0.5px solid rgba(196,132,58,0.4)',
  borderTop: '3px solid var(--sb-gold)',
  borderRadius: 'var(--sb-radius)',
  padding: '2rem',
};
const errorWrap = {
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
  color: 'var(--sb-cream)', textAlign: 'center',
  padding: '4rem 2rem', background: 'var(--sb-navy)',
};
