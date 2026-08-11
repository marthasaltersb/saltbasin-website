import React, { useEffect, useState } from 'react';
import { toast } from '../../lib/toast.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' },
  card: { background: 'var(--sb-admin-surface)', border: '0.5px solid var(--sb-admin-border)', borderRadius: 4, padding: '1rem' },
  cardTitle: { fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-admin-text-soft)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.6rem' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' },
};

// Basic performance dashboard — read-only rollups over content_publications +
// content_interactions (server/routes/contentPublications.js's /dashboard).
// Computed on demand, no new storage. Correlation, not causation — see the
// note rendered at the bottom, matching the spec's attribution-confidence
// distinction (byDayOfWeek is time_window_correlated, not a causal claim).
export default function PublicationsDashboard({ appFilter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = appFilter && appFilter !== 'all' ? `?app_id=${encodeURIComponent(appFilter)}` : '';
    fetch(`/api/content-publications/dashboard${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [appFilter]);

  if (loading) return <div style={{ fontSize: '0.85rem', color: 'var(--sb-admin-text-soft)' }}>Loading…</div>;
  if (!data) return null;

  const totalPubs = (data.byStatus || []).reduce((sum, r) => sum + r.count, 0);
  const totalInteractions = (data.byInteractionType || []).reduce((sum, r) => sum + r.count, 0);
  const bestDay = (data.byDayOfWeek || []).find(d => d.interaction_count > 0);

  return (
    <div>
      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardTitle}>Publications by Status ({totalPubs} total)</div>
          {(data.byStatus || []).map(r => (
            <div key={r.status} style={s.row}><span>{r.status}</span><span style={{ fontWeight: 700 }}>{r.count}</span></div>
          ))}
          {!data.byStatus?.length && <div style={{ fontSize: '0.78rem', color: 'var(--sb-admin-text-soft)' }}>No publications yet.</div>}
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Interactions by Type ({totalInteractions} total)</div>
          {(data.byInteractionType || []).map(r => (
            <div key={r.interaction_type} style={s.row}><span>{r.interaction_type}</span><span style={{ fontWeight: 700 }}>{r.count}</span></div>
          ))}
          {!data.byInteractionType?.length && <div style={{ fontSize: '0.78rem', color: 'var(--sb-admin-text-soft)' }}>No interactions logged yet.</div>}
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Engagement by Channel</div>
          {(data.byChannel || []).map(r => (
            <div key={r.channel} style={s.row}>
              <span style={{ textTransform: 'uppercase' }}>{r.channel}</span>
              <span>{r.interaction_count} interaction{r.interaction_count === 1 ? '' : 's'} · {r.publication_count} pub{r.publication_count === 1 ? '' : 's'}</span>
            </div>
          ))}
          {!data.byChannel?.length && <div style={{ fontSize: '0.78rem', color: 'var(--sb-admin-text-soft)' }}>No channels yet.</div>}
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Best Posting Day {bestDay ? `— ${DAY_NAMES[bestDay.day_of_week]}` : ''}</div>
          {(data.byDayOfWeek || []).map(r => (
            <div key={r.day_of_week} style={s.row}><span>{DAY_NAMES[r.day_of_week]}</span><span style={{ fontWeight: 700 }}>{r.interaction_count}</span></div>
          ))}
          {!data.byDayOfWeek?.length && <div style={{ fontSize: '0.78rem', color: 'var(--sb-admin-text-soft)' }}>Not enough published + logged data yet.</div>}
        </div>
      </div>

      <div style={{ ...s.card, marginTop: '1rem' }}>
        <div style={s.cardTitle}>Top Performing Entries</div>
        {(data.topEntries || []).length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--sb-admin-text-soft)' }}>No entries with interactions yet.</div>}
        {(data.topEntries || []).map((r, i) => (
          <div key={r.id} style={s.row}>
            <span>{i + 1}. {r.entry_ref} <span style={{ color: 'var(--sb-admin-text-soft)', textTransform: 'uppercase', fontSize: '0.68rem' }}>· {r.channel} · {r.status}</span></span>
            <span style={{ fontWeight: 700 }}>{r.interaction_count}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--sb-admin-text-soft)', marginTop: '0.75rem', fontStyle: 'italic' }}>
        Correlation, not causation: "Best Posting Day" reflects when engagement occurred relative to publish time, not that publishing on that day caused the engagement. Attribution confidence: time-window correlated.
      </div>
    </div>
  );
}
