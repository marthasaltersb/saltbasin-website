import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function SignupPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const fromLeadPublicId = searchParams.get('fromLead');
  const fromLeadToken = searchParams.get('t');

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    requestedSlug: '',
  });
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leadInfo, setLeadInfo] = useState(null); // {publicId, email, name?}

  // If arriving via a lead-conversion link, prefill the form from the lead.
  useEffect(() => {
    if (!fromLeadPublicId || !fromLeadToken) return;
    fetch(`/api/leads/public/${fromLeadPublicId}?t=${encodeURIComponent(fromLeadToken)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('lead not reachable');
        return r.json();
      })
      .then((lead) => {
        setLeadInfo({ publicId: lead.publicId, email: lead.email, name: lead.name });
        setForm((f) => ({
          ...f,
          email: lead.email || f.email,
          displayName: lead.name || f.displayName,
        }));
      })
      .catch(() => {});
  }, [fromLeadPublicId, fromLeadToken]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/members/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fromLeadPublicId: fromLeadPublicId || undefined,
          fromLeadToken: fromLeadToken || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Signup failed');
      nav('/member', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--sb-navy)',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--sb-navy-deep)',
          padding: '2rem',
          border: '0.5px solid rgba(196,132,58,0.25)',
          borderTop: '3px solid var(--sb-gold)',
          borderRadius: 'var(--sb-radius)',
        }}
      >
        <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Salt Basin Net Works · Operator Signup
        </div>
        <h2 className="sb-display" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--sb-cream)' }}>
          Claim your profile
        </h2>
        {leadInfo ? (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(196,132,58,0.12)',
              border: '0.5px solid rgba(196,132,58,0.35)',
              borderLeft: '3px solid var(--sb-gold)',
              borderRadius: 'var(--sb-radius)',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: 'var(--sb-cream)',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--sb-gold)', marginBottom: 4 }}>
              ✦ Converting lead #{leadInfo.publicId}
            </div>
            Your existing intake info will be linked to this new account. Pick a password to finish.
          </div>
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--sb-dusty)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Sign up to claim a Salt Basin operator profile. You'll be auto-logged in and taken to your dashboard.
          </p>
        )}

        <Field label="Display Name" value={form.displayName} onChange={(v) => update('displayName', v)} placeholder="Full name as you want it shown" />
        <Field label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@email.com" required />
        <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="8+ characters" required />
        <Field label="Preferred URL slug (optional)" value={form.requestedSlug} onChange={(v) => update('requestedSlug', v)} placeholder="e.g. jane-doe (lowercase, no spaces)" />

        {err && (
          <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>
        )}

        <button
          type="submit"
          className="sb-btn sb-btn-gold"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={submitting}
        >
          {submitting ? 'Creating…' : 'Create Profile ↗'}
        </button>

        <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--sb-dusty)', textAlign: 'center' }}>
          Already have an account? <Link to="/admin/login" style={{ color: 'var(--sb-gold)' }}>Sign in</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label
        style={{
          fontFamily: 'var(--sb-font-label)',
          fontSize: '0.68rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--sb-dusty)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        className="sb-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
