// Net Works panel — admin view of every member who has signed up to the Salt
// Basin platform. Renamed from "members list" to match the brand framing:
// Salt Basin Net Works is the consultancy, the members are the network it
// holds. Future phases will add invitations, role assignment, and the
// Person + Institution dual-role model (#88, #89).

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { styles } from './adminStyles.js';

function fmtDate(ms) {
  if (!ms) return '—';
  const d = new Date(Number(ms));
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtRelative(ms) {
  if (!ms) return '—';
  const diff = Date.now() - Number(ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function NetWorksPanel() {
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    api
      .listMembers()
      .then((r) => setMembers(r.members || []))
      .catch((e) => toast('Failed to load members: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = query.trim().toLowerCase();
    let list = q
      ? members.filter(
          (m) =>
            (m.email || '').toLowerCase().includes(q) ||
            (m.slug || '').toLowerCase().includes(q)
        )
      : [...members];
    if (sort === 'newest') list.sort((a, b) => b.created_at - a.created_at);
    if (sort === 'oldest') list.sort((a, b) => a.created_at - b.created_at);
    if (sort === 'recent-activity')
      list.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    if (sort === 'email') list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    return list;
  }, [members, query, sort]);

  const published = members ? members.filter((m) => m.published).length : 0;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 1.75rem', background: 'var(--sb-navy-deep)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          className="sb-display"
          style={{
            fontSize: '1.6rem',
            color: 'var(--sb-cream)',
            letterSpacing: '0.08em',
            marginBottom: '0.35rem',
          }}
        >
          Net Works
        </div>
        <div
          style={{
            fontSize: '0.74rem',
            color: 'var(--sb-dusty)',
            letterSpacing: '0.04em',
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          Every operator, advisor, and institution that has signed up to the platform.
          Members get a profile page at <code style={{ color: 'var(--sb-gold)' }}>/u/{'{slug}'}</code> once
          they publish.
        </div>
      </div>

      {/* Counters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <StatChip label="Total members" value={members?.length ?? '…'} />
        <StatChip label="Published profiles" value={loading ? '…' : published} />
        <StatChip
          label="Joined this month"
          value={
            loading
              ? '…'
              : members.filter((m) => Date.now() - m.created_at < 30 * 86400000).length
          }
        />
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          className="sb-input"
          placeholder="Search by email or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: '1 1 240px', maxWidth: 360, fontSize: '0.8rem' }}
        />
        <select
          className="sb-input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ flex: '0 0 auto', fontSize: '0.78rem' }}
        >
          <option value="newest">Newest joined</option>
          <option value="oldest">Oldest joined</option>
          <option value="recent-activity">Most recent activity</option>
          <option value="email">Email A→Z</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.85rem' }}>Loading members…</div>
      ) : filtered.length === 0 ? (
        <EmptyState query={query} totalCount={members?.length ?? 0} />
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '0.65rem',
          }}
        >
          {filtered.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div
      style={{
        padding: '0.6rem 0.95rem',
        background: 'rgba(196,132,58,0.06)',
        border: '0.5px solid rgba(196,132,58,0.3)',
        borderRadius: 'var(--sb-radius)',
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: '0.55rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--sb-gold)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="sb-display"
        style={{ fontSize: '1.45rem', color: 'var(--sb-cream)', lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}

function MemberRow({ member }) {
  const profileUrl = member.published ? `/u/${member.slug}` : null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '1rem',
        padding: '0.85rem 1.1rem',
        background: 'rgba(245,240,232,0.03)',
        border: '0.5px solid rgba(181,196,193,0.15)',
        borderRadius: 'var(--sb-radius)',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 4,
          }}
        >
          <span
            className="sb-display"
            style={{
              fontSize: '1rem',
              color: 'var(--sb-cream)',
              letterSpacing: '0.04em',
            }}
          >
            {member.email}
          </span>
          {member.published ? (
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sb-green)',
                padding: '2px 7px',
                border: '0.5px solid var(--sb-green)',
                borderRadius: '2px',
              }}
            >
              Published
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sb-dusty)',
                padding: '2px 7px',
                border: '0.5px solid var(--sb-dusty)',
                borderRadius: '2px',
              }}
            >
              Draft only
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--sb-dusty)',
            letterSpacing: '0.04em',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {member.slug && (
            <span>
              slug:{' '}
              <code style={{ color: 'var(--sb-gold)' }}>{member.slug}</code>
            </span>
          )}
          <span>joined {fmtDate(member.created_at)}</span>
          <span>last activity {fmtRelative(member.updated_at)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="sb-btn sb-btn-outline"
            style={{ fontSize: '0.65rem', padding: '0.35rem 0.8rem' }}
          >
            View profile ↗
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyState({ query, totalCount }) {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        border: '0.5px dashed rgba(196,132,58,0.3)',
        borderRadius: 'var(--sb-radius)',
        color: 'var(--sb-dusty)',
      }}
    >
      {totalCount === 0 ? (
        <>
          <div className="sb-display" style={{ fontSize: '1.1rem', color: 'var(--sb-cream)', marginBottom: 8 }}>
            No members yet
          </div>
          <div style={{ fontSize: '0.78rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.55 }}>
            When operators sign up via{' '}
            <code style={{ color: 'var(--sb-gold)' }}>/signup</code>, they'll show up here. Leads who
            convert through their secure lead URL also become members.
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
            No members match "{query}".
          </div>
          <div style={{ fontSize: '0.75rem' }}>Try clearing the filter.</div>
        </>
      )}
    </div>
  );
}
