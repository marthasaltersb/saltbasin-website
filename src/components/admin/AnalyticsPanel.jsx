import React, { useEffect, useState } from 'react';
import { styles } from './adminStyles.js';

const DAYS_OPTIONS = [7, 14, 30, 90];

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '1rem 1.25rem', minWidth: 140 }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPanel({ isAdmin = true }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const endpoint = isAdmin ? `/api/analytics/admin/summary?days=${days}` : `/api/analytics/member/summary?days=${days}`;

  useEffect(() => {
    setLoading(true);
    fetch(endpoint, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [endpoint]);

  const byType = data?.byType || [];
  const downloads = data?.downloads || [];
  const dailyTrend = data?.dailyTrend || [];
  const byMember = data?.byMember || [];

  const total = byType.reduce((s, r) => s + r.count, 0);
  const visits = byType.find(r => r.event_type === 'visit')?.count || 0;
  const pdfDownloads = byType.find(r => r.event_type === 'pdf-download')?.count || 0;
  const formSubmits = byType.find(r => r.event_type === 'form-submit')?.count || 0;

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)' }}>Platform Analytics Hub</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginTop: '0.25rem' }}>{isAdmin ? 'Platform Overview' : 'My Analytics'}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: 'var(--sb-font-label)',
              background: days === d ? 'var(--sb-gold)' : 'transparent',
              color: days === d ? 'var(--sb-ivory)' : 'var(--sb-dusty)',
              border: `0.5px solid ${days === d ? 'var(--sb-gold)' : 'rgba(139,155,174,0.3)'}`,
              borderRadius: 2, cursor: 'pointer'
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading analytics…</div>}
      {err && <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.85rem' }}>{err}</div>}

      {!loading && data && (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <StatCard label="Total Events" value={total.toLocaleString()} sub={`last ${days} days`} />
            <StatCard label="Page Visits" value={visits.toLocaleString()} />
            <StatCard label="PDF Downloads" value={pdfDownloads.toLocaleString()} />
            <StatCard label="Form Submits" value={formSubmits.toLocaleString()} />
          </div>

          {/* Event breakdown */}
          {byType.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>Events by Type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {byType.map(r => (
                  <div key={r.event_type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 180, fontSize: '0.8rem', color: 'var(--sb-cream)', fontFamily: 'var(--sb-font-label)' }}>{r.event_type}</div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, (r.count / total) * 100)}%`, background: 'var(--sb-gold)', borderRadius: 1 }} />
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: '0.8rem', color: 'var(--sb-dusty)' }}>{r.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin-only: by member */}
          {isAdmin && byMember.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>Top Members by Traffic</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {['Member','Events','Visits','Downloads'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.75rem', color: 'var(--sb-dusty)', fontWeight: 400, fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '0.5px solid rgba(196,132,58,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byMember.map(m => (
                    <tr key={m.member_user_id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--sb-cream)' }}>{m.display_name || m.email}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--sb-dusty)' }}>{m.events}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--sb-dusty)' }}>{m.visits}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--sb-dusty)' }}>{m.downloads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PDF Downloads log */}
          {downloads.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.75rem' }}>PDF Download Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {downloads.slice(0, 30).map(d => {
                  const meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata || '{}') : (d.metadata || {});
                  return (
                    <div key={d.id} style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 2, fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--sb-cream)' }}>{meta.visitor_email || 'Anonymous'}</span>
                        <span style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem' }}>{new Date(Number(d.occurred_at)).toLocaleDateString()}</span>
                      </div>
                      {meta.reason && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.75rem', fontStyle: 'italic' }}>"{meta.reason}"</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {downloads.length === 0 && byType.length === 0 && (
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem', padding: '2rem 0' }}>No events recorded yet for this period.</div>
          )}
        </>
      )}
    </div>
  );
}
