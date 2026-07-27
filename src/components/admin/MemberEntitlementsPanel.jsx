// MemberEntitlementsPanel — member-facing view of the Member Entitlement
// Provisioning pipeline (2026-07-16). Shows which modules (Personal Brand
// Website, Resume/Career) are provisioned, their stage-gate progress, and
// usage — all driven by provisioningPolicyRegistry.js's configured stage
// list, not hardcoded here, so a different org template changes what
// renders without a code change.
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const card = { border: '1px solid rgba(196,132,58,.24)', borderRadius: 12, padding: '1.25rem', background: 'rgba(255,255,255,.72)' };

const STAGE_TONE = {
  requested: '#8B9BAE',
  credentials_prepared: '#8B9BAE',
  welcome_email_sending: '#C4843A',
  provisioned: '#4A7C8E',
  onboarding: '#C4843A',
  active: '#2E7D4F',
};

function StageProgress({ stages, currentStage }) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage);
  return (
    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', margin: '.5rem 0' }}>
      {stages.map((stage, index) => {
        const reached = currentIndex >= 0 && index <= currentIndex;
        return (
          <div key={stage.key} style={{
            padding: '.25rem .6rem', borderRadius: 999, fontSize: '.72rem',
            background: reached ? (STAGE_TONE[stage.key] || '#4A7C8E') : 'rgba(0,0,0,.06)',
            color: reached ? '#fff' : 'rgba(20,35,58,.5)',
            fontWeight: index === currentIndex ? 700 : 400,
          }}>
            {stage.label}
          </div>
        );
      })}
    </div>
  );
}

function EmailStatusBadge({ status }) {
  const copy = {
    sent: { label: 'Welcome email sent ✓', color: '#2E7D4F' },
    pending: { label: 'Sending welcome email…', color: '#C4843A' },
    failed: { label: 'Welcome email failed — will retry', color: '#B0413E' },
    not_applicable: { label: '', color: 'transparent' },
  }[status] || { label: status, color: '#8B9BAE' };
  if (!copy.label) return null;
  return <span style={{ fontSize: '.78rem', color: copy.color, fontWeight: 600 }}>{copy.label}</span>;
}

export default function MemberEntitlementsPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getMemberEntitlements().then(setData).catch((error) => toast.error(error.message));
  }, []);

  if (!data) return <div style={{ padding: '1.5rem' }}>Loading…</div>;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', color: 'var(--sb-navy)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header>
          <div className="sb-kicker">Your Salt Basin Access</div>
          <h1 className="sb-display" style={{ margin: '.25rem 0' }}>Provisioned Modules</h1>
          <p style={{ maxWidth: 700, color: 'rgba(20,35,58,.7)' }}>
            {data.memberRod
              ? `Member since ${new Date(data.memberRod.createdAt).toLocaleDateString()} · status: ${data.memberRod.currentStage.replace('_', ' ')}`
              : 'No Member Channel Rod found yet.'}
          </p>
        </header>

        {data.entitlements.length === 0 && (
          <div style={card}>No modules provisioned yet.</div>
        )}

        {data.entitlements.map((ent) => (
          <section key={ent.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '.5rem' }}>
              <h2 style={{ margin: 0 }}>{ent.moduleLabel}</h2>
              <span style={{ fontSize: '.72rem', color: 'rgba(20,35,58,.55)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {ent.provisioningOrigin === 'direct_to_consumer' ? 'Direct-to-consumer' : ent.provisioningOrigin || ''}
              </span>
            </div>

            <StageProgress stages={data.stages} currentStage={ent.currentStage} />
            <EmailStatusBadge status={ent.onboardingEmailStatus} />

            {ent.contentRod && (
              <div style={{ fontSize: '.85rem', color: 'rgba(20,35,58,.65)', marginTop: '.5rem' }}>
                Linked {ent.contentRod.rodType === 'public_site' ? 'Public Site' : 'Career Master'} Channel Rod — {ent.contentRod.currentStage.replace('_', ' ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '.75rem', fontSize: '.85rem', color: 'rgba(20,35,58,.7)' }}>
              <div><strong>{ent.usage.loginCount}</strong> login{ent.usage.loginCount === 1 ? '' : 's'}</div>
              {ent.firstLoginAt && <div>First login {new Date(ent.firstLoginAt).toLocaleDateString()}</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
