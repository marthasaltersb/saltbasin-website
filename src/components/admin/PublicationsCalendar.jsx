import React, { useMemo, useState } from 'react';
import { toast } from '../../lib/toast.js';

// Month-grid editorial calendar over the same /api/content-publications data
// PublicationsPanel's list view already loads — no separate calendar
// endpoint, just a different projection of the same rows onto a month grid.
// Also surfaces the "due now" queue: scheduled publications whose
// scheduled_at has passed, each with a one-click manual publish
// confirmation (Release 1 scope is manual confirmation, not automated
// posting — no live platform publish call exists yet).
const STATUS_COLORS = {
  draft: '#FFE08A', awaiting_approval: '#FFD6A5', approved: '#BDE4FF', scheduled: '#C7B7FF',
  publishing: '#BDE4FF', published: '#CDEEDC', partially_published: '#CDEEDC', failed: '#F5A3A3',
  cancelled: '#ddd', removed: '#ddd',
};
const CHANNEL_DOT = {
  linkedin: '#0A66C2', website: '#4A7C8E', newsletter: '#C4843A', x: '#1A1A1A',
  instagram: '#D6249F', facebook: '#1877F2', print: '#8B4056',
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

export default function PublicationsCalendar({ publications, onEdit, onRefresh }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const byDay = useMemo(() => {
    const map = {};
    for (const p of publications) {
      if (!p.scheduled_at) continue;
      const d = new Date(Number(p.scheduled_at));
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) continue;
      const key = d.getDate();
      (map[key] = map[key] || []).push(p);
    }
    return map;
  }, [publications, cursor]);

  const dueNow = useMemo(() => {
    const now = Date.now();
    return publications.filter((p) => p.status === 'scheduled' && p.scheduled_at && Number(p.scheduled_at) <= now);
  }, [publications]);

  async function confirmPublished(p) {
    const res = await fetch(`/api/content-publications/${p.id}`, {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published', actual_published_at: Date.now() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.missingApprovals?.length) {
        toast.error(`Missing approvals: ${data.missingApprovals.join(', ')}`);
      } else {
        toast.error(data.error || 'Failed to confirm');
      }
      return;
    }
    toast.success('Marked as published');
    onRefresh();
  }

  const totalDays = daysInMonth(cursor);
  const leadBlank = startOfMonth(cursor).getDay(); // 0=Sun
  const cells = [...Array(leadBlank).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div>
      {dueNow.length > 0 && (
        <div style={{ background: 'rgba(232,64,122,0.08)', border: '0.5px dashed var(--sb-admin-gold-warm, #E8407A)', borderRadius: 4, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-admin-gold-warm, #E8407A)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>
            Due Now — {dueNow.length} publication{dueNow.length === 1 ? '' : 's'} past scheduled time
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {dueNow.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>{p.entry_ref || '(no entry linked)'} · <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)' }}>{p.channel}</span></span>
                <button onClick={() => confirmPublished(p)} style={{ padding: '0.25rem 0.7rem', background: 'var(--sb-admin-gold-warm, #C4843A)', color: '#1A1A1A', border: 'none', borderRadius: 2, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)' }}>
                  Confirm Published
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} style={{ background: 'none', border: '0.5px solid var(--sb-admin-border)', borderRadius: 2, cursor: 'pointer', padding: '0.2rem 0.6rem' }}>‹</button>
        <div style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{monthLabel}</div>
        <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} style={{ background: 'none', border: '0.5px solid var(--sb-admin-border)', borderRadius: 2, cursor: 'pointer', padding: '0.2rem 0.6rem' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sb-admin-text-soft)', textAlign: 'center', padding: '0.25rem 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => (
          <div key={i} style={{
            minHeight: 84, border: '0.5px solid var(--sb-admin-border)', borderRadius: 3, padding: '0.3rem',
            background: day ? 'var(--sb-admin-surface)' : 'transparent', opacity: day ? 1 : 0.3,
          }}>
            {day && (
              <>
                <div style={{ fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)', marginBottom: '0.25rem' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(byDay[day] || []).slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onEdit(p.id)}
                      title={`${p.channel} · ${p.status}`}
                      style={{
                        fontSize: '0.6rem', padding: '1px 5px', borderRadius: 8, cursor: 'pointer',
                        background: STATUS_COLORS[p.status] || '#eee', color: '#1A1A1A',
                        display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: CHANNEL_DOT[p.channel] || '#999', flexShrink: 0 }} />
                      {p.entry_ref || p.channel}
                    </div>
                  ))}
                  {(byDay[day] || []).length > 4 && (
                    <div style={{ fontSize: '0.58rem', color: 'var(--sb-admin-text-soft)' }}>+{(byDay[day] || []).length - 4} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
