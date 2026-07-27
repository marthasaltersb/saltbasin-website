import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { InlineDataNotice } from './DataNotice.jsx';
import { getRecaptchaToken } from '../lib/recaptcha.js';

export default function SignupPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const fromLeadPublicId = searchParams.get('fromLead');
  const fromLeadToken = searchParams.get('t');

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    workEmail: '',
    password: '',
    requestedSlug: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      setErr('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('signup');
      const res = await fetch('/api/members/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fromLeadPublicId: fromLeadPublicId || undefined,
          fromLeadToken: fromLeadToken || undefined,
          recaptchaToken,
          agreedToTerms,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Signup failed');

      // Signup email is the personal login — capture a work email too if
      // given, so members onboarding into a Member Organization already have
      // both on file. Best-effort: a failure here shouldn't block signup.
      if (form.workEmail && form.workEmail !== form.email) {
        fetch('/api/members/me/emails', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.workEmail, type: 'work' }),
        }).catch(() => {});
      }

      nav('/member', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!fromLeadPublicId || !fromLeadToken) {
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
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--sb-navy-deep)',
            padding: '2rem',
            border: '0.5px solid rgba(196,132,58,0.25)',
            borderTop: '3px solid var(--sb-gold)',
            borderRadius: 'var(--sb-radius)',
            textAlign: 'center',
          }}
        >
          <div className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>
            Salt Basin Net Works
          </div>
          <h2 className="sb-display" style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: 'var(--sb-cream)' }}>
            Member creation is invite-only
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--sb-dusty)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            Public profile creation is currently locked down. Existing approved members can sign in.
          </p>
          <Link to="/login" className="sb-btn sb-btn-gold" style={{ display: 'inline-flex', padding: '0.55rem 1.25rem', fontSize: '0.75rem' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
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

        <InlineDataNotice dark style={{ marginBottom: '1.25rem' }} />

        <Field label="Display Name" value={form.displayName} onChange={(v) => update('displayName', v)} placeholder="Full name as you want it shown" />
        <Field label="Personal Email (recommended for login)" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@personal-email.com" required />
        <Field label="Work Email (optional, for org onboarding)" type="email" value={form.workEmail} onChange={(v) => update('workEmail', v)} placeholder="you@company.com" />
        <Field label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="8+ characters" required />
        <Field label="Preferred URL slug (optional)" value={form.requestedSlug} onChange={(v) => update('requestedSlug', v)} placeholder="e.g. jane-doe (lowercase, no spaces)" />

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--sb-dusty)',
            lineHeight: 1.5,
            marginBottom: '1rem',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: 3 }}
            required
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--sb-gold)' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--sb-gold)' }}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {err && (
          <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>
        )}

        <button
          type="submit"
          className="sb-btn sb-btn-gold"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={submitting || !agreedToTerms}
        >
          {submitting ? 'Creating…' : 'Create Profile ↗'}
        </button>

        <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--sb-dusty)', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--sb-gold)' }}>Sign in</Link>
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
