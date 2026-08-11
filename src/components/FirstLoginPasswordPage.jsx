import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function FirstLoginPasswordPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.me().then(({ user }) => {
      if (!user) nav('/login', { replace: true });
      else if (!user.mustChangePassword) nav('/world', { replace: true });
    }).catch(() => nav('/login', { replace: true }));
  }, [nav]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirm) return setError('The new passwords do not match.');
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      const next = params.get('next');
      nav(next?.startsWith('/') && !next.startsWith('//') ? next : '/world', { replace: true });
    } catch (err) {
      setError(err.body?.details?.join(' ') || err.message || 'Password change failed.');
    } finally { setSaving(false); }
  }

  return <main style={S.page}>
    <form onSubmit={submit} style={S.card}>
      <div style={S.agent}>BestyStaff · required first step</div>
      <h1 style={S.title}>Set your own password</h1>
      <p style={S.copy}>Before you can use any member or admin capability, replace the temporary password used to provision your account.</p>
      <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} />
      <Field label="New password" value={newPassword} onChange={setNewPassword} />
      <Field label="Confirm new password" value={confirm} onChange={setConfirm} />
      <p style={S.hint}>At least 12 characters, including one capital letter, one number, and one special character. Previous passwords cannot be reused.</p>
      {error && <div role="alert" style={S.error}>{error}</div>}
      <button className="sb-btn sb-btn-gold" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>{saving ? 'Securing account…' : 'Save password and continue'}</button>
    </form>
  </main>;
}

function Field({ label, value, onChange }) {
  return <label style={S.label}>{label}<input className="sb-input" type="password" required minLength={label === 'Current password' ? undefined : 12} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

const S = {
  page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: 'var(--sb-navy-deep, #0b1724)' },
  card: { width: 'min(440px, 100%)', padding: '2rem', borderRadius: 14, background: '#fff', boxShadow: '0 22px 70px rgba(0,0,0,.28)' },
  agent: { color: '#a3631d', textTransform: 'uppercase', letterSpacing: '.13em', fontSize: '.7rem', fontWeight: 700 },
  title: { color: '#17283a', margin: '.55rem 0' }, copy: { color: '#596675', lineHeight: 1.55, marginBottom: '1.4rem' },
  label: { display: 'grid', gap: '.35rem', color: '#26384a', fontSize: '.8rem', fontWeight: 650, marginBottom: '1rem' },
  hint: { color: '#64717d', fontSize: '.75rem', lineHeight: 1.5 }, error: { color: '#9d2424', background: '#fff0f0', padding: '.7rem', borderRadius: 7, marginBottom: '1rem', fontSize: '.8rem' },
};
