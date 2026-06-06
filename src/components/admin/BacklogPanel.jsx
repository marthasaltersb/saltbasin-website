// Backlog dashboard.
//
// Admin-only. Left rail: capability groups with item counts. Right pane:
// card grid filtered by the active group. Click a card → side drawer with
// the full requirement detail editable inline.
//
// On first load, if the backlog is empty, we auto-call the seed endpoint
// so the admin lands on a populated dashboard the very first time.

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import BacklogDrawer from './BacklogDrawer.jsx';
import ScrumAgentPanel from './ScrumAgentPanel.jsx';

const STATUS_META = {
  pending:     { label: 'Pending',     color: 'var(--sb-dusty)' },
  in_progress: { label: 'In Progress', color: 'var(--sb-gold)'  },
  completed:   { label: 'Completed',   color: 'var(--sb-sage)'  },
  deployed:    { label: 'Deployed',    color: 'var(--sb-green)' },
  blocked:     { label: 'Blocked',     color: 'var(--sb-risk-critical)' },
  archived:    { label: 'Archived',    color: 'var(--sb-taupe)' },
};

const KIND_META = {
  feature: { label: 'Feature', glyph: '◆' },
  defect:  { label: 'Defect',  glyph: '⚠' },
  chore:   { label: 'Chore',   glyph: '◇' },
  spike:   { label: 'Spike',   glyph: '↗' },
};

export default function BacklogPanel() {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState('all'); // 'all' or group id
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [view, setView] = useState('requirements'); // 'requirements' | 'outputs'
  const [agentOpen, setAgentOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      let snapshot = await api.getBacklog();
      // Empty tables on first run — seed and re-fetch.
      if ((snapshot.groups || []).length === 0 && (snapshot.items || []).length === 0) {
        const seed = await api.seedBacklog();
        if (seed.seededItems) toast(`Seeded ${seed.seededGroups} groups · ${seed.seededItems} items`);
        snapshot = await api.getBacklog();
      }
      setGroups(snapshot.groups || []);
      setItems(snapshot.items || []);
    } catch (e) {
      toast('Failed to load backlog: ' + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const selectedItem = items.find((it) => it.id === selectedItemId) || null;
  const groupById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const counts = useMemo(() => {
    const c = { all: 0 };
    for (const it of items) {
      if (it.status === 'archived') continue;
      c.all++;
      c[it.capabilityId] = (c[it.capabilityId] || 0) + 1;
    }
    return c;
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (it.status === 'archived') return false;
      if (activeGroupId !== 'all' && it.capabilityId !== activeGroupId) return false;
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (q) {
        const hay = `${it.title} ${it.summary || ''} ${(it.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeGroupId, statusFilter, search]);

  // Aggregate metrics for the dashboard hero strip — rolls up only items
  // visible under the active capability filter (so when you click a group
  // in the left rail, the chips above the cards reflect THAT capability).
  const metrics = useMemo(() => {
    const scope = items.filter((it) => {
      if (it.status === 'archived') return false;
      if (activeGroupId !== 'all' && it.capabilityId !== activeGroupId) return false;
      return true;
    });
    function itemHoursClaude(it) {
      if (it.hoursClaude != null) return Number(it.hoursClaude);
      return (it.timeMinutes || 0) / 60 * (it.workSplitClaude ?? 0) / 100;
    }
    function itemHoursBetsy(it) {
      if (it.hoursBetsy != null) return Number(it.hoursBetsy);
      return (it.timeMinutes || 0) / 60 * (100 - (it.workSplitClaude ?? 0)) / 100;
    }
    const hoursClaude = scope.reduce((s, it) => s + itemHoursClaude(it), 0);
    const hoursBetsy  = scope.reduce((s, it) => s + itemHoursBetsy(it), 0);
    const actClaude   = scope.reduce((s, it) => s + (it.activitiesClaude || 0), 0);
    const actBetsy    = scope.reduce((s, it) => s + (it.activitiesBetsy  || 0), 0);
    const costClaude  = scope.reduce((s, it) => s + (it.costUsdClaude    || 0), 0);
    const total = scope.length;
    const deployedCount = scope.filter((it) => it.status === 'deployed').length;
    const pendingCount  = scope.filter((it) => it.status === 'pending' || it.status === 'in_progress').length;
    return {
      total,
      deployed: deployedCount,
      pending: pendingCount,
      hoursClaude: Math.round(hoursClaude * 10) / 10,
      hoursBetsy:  Math.round(hoursBetsy  * 10) / 10,
      hoursTotal:  Math.round((hoursClaude + hoursBetsy) * 10) / 10,
      activitiesClaude: actClaude,
      activitiesBetsy:  actBetsy,
      claudePct: (hoursClaude + hoursBetsy) ? Math.round(hoursClaude / (hoursClaude + hoursBetsy) * 100) : 0,
      costClaude: Math.round(costClaude * 100) / 100,
    };
  }, [items, activeGroupId]);

  async function patchItem(id, patch) {
    try {
      await api.updateBacklogItem(id, patch);
      setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    } catch (e) {
      toast('Save failed: ' + e.message);
      throw e;
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, background: 'var(--sb-navy-deep)', position: 'relative' }}>
      {/* ── Left rail: capability groups ── */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--sb-navy)',
          borderRight: '0.5px solid rgba(196,132,58,0.18)',
          padding: '1.25rem 0.75rem',
          overflowY: 'auto',
        }}
      >
        <div
          className="sb-eyebrow"
          style={{ padding: '0 0.5rem 0.5rem', color: 'var(--sb-gold)' }}
        >
          Capability Groups
        </div>
        <GroupRow
          label="All requirements"
          color="var(--sb-gold)"
          count={counts.all}
          active={activeGroupId === 'all'}
          onClick={() => setActiveGroupId('all')}
        />
        {groups.map((g) => (
          <GroupRow
            key={g.id}
            label={g.name}
            color={g.color}
            count={counts[g.id] || 0}
            active={activeGroupId === g.id}
            onClick={() => setActiveGroupId(g.id)}
          />
        ))}
      </aside>

      {/* ── Center: cards + filters + metrics ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '1.5rem 1.75rem 0.75rem' }}>
          <div className="sb-display" style={{ fontSize: '1.6rem', color: 'var(--sb-cream)', letterSpacing: '0.06em' }}>
            {activeGroupId === 'all' ? 'Backlog · All Requirements' : groupById[activeGroupId]?.name || 'Backlog'}
          </div>
          {activeGroupId !== 'all' && groupById[activeGroupId]?.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', marginTop: 4, maxWidth: 720, lineHeight: 1.55 }}>
              {groupById[activeGroupId].description}
            </div>
          )}

          {/* Rollup dashboard — rolls up from items in the active filter.
              Auto-updates as edits land via the drawer. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
            <Chip label="Requirements" value={metrics.total} />
            <Chip label="Deployed" value={metrics.deployed} accent />
            <SplitChip label="Hours" claude={metrics.hoursClaude} betsy={metrics.hoursBetsy} total={metrics.hoursTotal} suffix="h" />
            <SplitChip label="Activities" claude={metrics.activitiesClaude} betsy={metrics.activitiesBetsy} total={metrics.activitiesClaude + metrics.activitiesBetsy} />
            <Chip label="Claude %" value={`${metrics.claudePct}%`} />
            <Chip label="$ Claude" value={`$${metrics.costClaude.toFixed(2)}`} />
          </div>

          {/* Sub-tab: Requirements vs Outputs */}
          <div style={{ display: 'flex', gap: 0, marginTop: '1rem', borderBottom: '0.5px solid rgba(196,132,58,0.18)' }}>
            <SubTab label="Requirements" active={view === 'requirements'} onClick={() => setView('requirements')} />
            <SubTab label="Outputs" active={view === 'outputs'} onClick={() => setView('outputs')} />
          </div>

          {/* Filters (only when in requirements view) */}
          {view === 'requirements' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                className="sb-input"
                placeholder="Search title, summary, tag…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 220px', maxWidth: 380, fontSize: '0.8rem' }}
              />
              <select
                className="sb-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ flex: '0 0 auto', fontSize: '0.78rem' }}
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_META).filter(([k]) => k !== 'archived').map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cards / Outputs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.75rem 1.75rem' }}>
          {view === 'outputs' ? (
            <OutputsCatalog />
          ) : loading ? (
            <div style={{ padding: '2rem', color: 'var(--sb-dusty)' }}>Loading backlog…</div>
          ) : visibleItems.length === 0 ? (
            <div style={{ padding: '2rem', color: 'var(--sb-dusty)', fontStyle: 'italic', fontSize: '0.85rem' }}>
              No requirements match your filter.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {visibleItems.map((it) => (
                <BacklogCard
                  key={it.id}
                  item={it}
                  group={groupById[it.capabilityId]}
                  onClick={() => setSelectedItemId(it.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrum Agent panel ── */}
      <ScrumAgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />

      {/* Floating "Open Scrum Agent" toggle — bottom-right */}
      {!agentOpen && (
        <button
          onClick={() => setAgentOpen(true)}
          style={{
            position: 'absolute',
            bottom: 24, right: 24,
            background: 'var(--sb-gold)',
            color: 'var(--sb-ivory)',
            border: 'none',
            borderRadius: 999,
            padding: '0.7rem 1.15rem',
            fontFamily: 'var(--sb-font-label)',
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            zIndex: 30,
          }}
        >
          ✦ Scrum Agent
        </button>
      )}

      {/* ── Right drawer (item detail) ── */}
      {selectedItem && (
        <BacklogDrawer
          item={selectedItem}
          groups={groups}
          onClose={() => setSelectedItemId(null)}
          onPatch={(patch) => patchItem(selectedItem.id, patch)}
        />
      )}
    </div>
  );
}

function GroupRow({ label, color, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        width: '100%',
        padding: '0.55rem 0.65rem',
        background: active ? 'rgba(196,132,58,0.12)' : 'transparent',
        border: active ? '0.5px solid rgba(196,132,58,0.3)' : '0.5px solid transparent',
        borderRadius: 'var(--sb-radius)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--sb-font-body)',
        marginBottom: 2,
      }}
    >
      <span
        style={{
          width: 4, height: 22, borderRadius: 2,
          background: color || 'var(--sb-sage)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '0.78rem',
          color: active ? 'var(--sb-cream)' : 'var(--sb-sage)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.62rem',
          color: 'var(--sb-dusty)',
          background: 'rgba(0,0,0,0.2)',
          padding: '1px 7px',
          borderRadius: 10,
          minWidth: 22,
          textAlign: 'center',
        }}
      >
        {count}
      </span>
    </button>
  );
}

function Chip({ label, value, accent }) {
  return (
    <div
      style={{
        padding: '0.4rem 0.8rem',
        background: accent ? 'rgba(168,184,154,0.12)' : 'rgba(196,132,58,0.06)',
        border: accent ? '0.5px solid rgba(168,184,154,0.35)' : '0.5px solid rgba(196,132,58,0.3)',
        borderRadius: 'var(--sb-radius)',
        minWidth: 110,
      }}
    >
      <div
        style={{
          fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: accent ? 'var(--sb-green)' : 'var(--sb-gold)',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        className="sb-display"
        style={{ fontSize: '1.2rem', color: 'var(--sb-cream)', lineHeight: 1 }}
      >
        {value}
      </div>
    </div>
  );
}

function BacklogCard({ item, group, onClick }) {
  const status = STATUS_META[item.status] || STATUS_META.pending;
  const kind = KIND_META[item.kind] || KIND_META.feature;
  const groupColor = group?.color || 'var(--sb-sage)';
  const deployChips = [];
  const rel = item.deployRelevance || { github: true, render: true, netlify: true };
  if (rel.github)  deployChips.push({ label: 'GH', live: item.deployedGithub });
  if (rel.render)  deployChips.push({ label: 'Render', live: item.deployedRender });
  if (rel.netlify) deployChips.push({ label: 'Netlify', live: item.deployedNetlify });

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        background: 'rgba(245,240,232,0.03)',
        border: '0.5px solid rgba(181,196,193,0.15)',
        borderLeft: `3px solid ${groupColor}`,
        borderRadius: 'var(--sb-radius)',
        padding: '0.85rem 0.95rem',
        cursor: 'pointer',
        fontFamily: 'var(--sb-font-body)',
        color: 'var(--sb-sage)',
        gap: '0.5rem',
        minHeight: 140,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: groupColor, fontWeight: 500,
          }}
        >
          {group?.name || '—'}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: status.color, border: `0.5px solid ${status.color}`,
            padding: '1px 6px', borderRadius: 2,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Title */}
      <div
        className="sb-display"
        style={{ fontSize: '1rem', color: 'var(--sb-cream)', lineHeight: 1.3, letterSpacing: '0.01em' }}
      >
        <span style={{ color: groupColor, marginRight: 6, fontFamily: 'var(--sb-font-body)' }}>{kind.glyph}</span>
        {item.title}
      </div>

      {/* Summary */}
      {item.summary && (
        <div style={{ fontSize: '0.78rem', color: 'var(--sb-dusty)', lineHeight: 1.5, flex: 1 }}>
          {truncate(item.summary, 160)}
        </div>
      )}

      {/* Footer: per-person split / deploy chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
        {(item.hoursClaude != null || item.hoursBetsy != null) ? (
          <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>
            <span style={{ color: 'var(--sb-gold)' }}>C {Number(item.hoursClaude || 0).toFixed(1)}h</span>
            {' · '}
            <span style={{ color: 'var(--sb-sage)' }}>B {Number(item.hoursBetsy || 0).toFixed(1)}h</span>
          </span>
        ) : item.workSplitClaude != null && (
          <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>
            Claude {item.workSplitClaude}%
          </span>
        )}
        {(item.activitiesClaude != null || item.activitiesBetsy != null) && (
          <span style={{ fontSize: '0.62rem', color: 'var(--sb-dusty)' }}>
            · {item.activitiesClaude || 0}+{item.activitiesBetsy || 0} acts
          </span>
        )}
        <div style={{ flex: 1 }} />
        {deployChips.map((c) => (
          <span
            key={c.label}
            title={`${c.label}: ${c.live ? 'live' : 'not deployed'}`}
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '1px 6px',
              borderRadius: 2,
              color: c.live ? 'var(--sb-green)' : 'var(--sb-dusty)',
              border: c.live ? '0.5px solid var(--sb-green)' : '0.5px solid var(--sb-dusty)',
              opacity: c.live ? 1 : 0.6,
            }}
          >
            {c.label} {c.live ? '✓' : '○'}
          </span>
        ))}
      </div>
    </button>
  );
}

function truncate(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

// Compact dual-source chip: shows total prominently, with a Claude/Betsy
// breakdown bar underneath. Used for Hours and Activities.
function SplitChip({ label, claude, betsy, total, suffix }) {
  const t = total || (claude + betsy) || 0;
  const pct = t ? Math.round((claude / t) * 100) : 0;
  return (
    <div
      style={{
        padding: '0.4rem 0.8rem',
        background: 'rgba(196,132,58,0.06)',
        border: '0.5px solid rgba(196,132,58,0.3)',
        borderRadius: 'var(--sb-radius)',
        minWidth: 130,
      }}
    >
      <div
        style={{
          fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--sb-gold)', marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div className="sb-display" style={{ fontSize: '1.2rem', color: 'var(--sb-cream)', lineHeight: 1, marginBottom: 4 }}>
        {t}{suffix || ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.58rem', color: 'var(--sb-dusty)' }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${pct}%`, background: 'var(--sb-gold)' }} />
          <div style={{ flex: 1, background: 'var(--sb-sage)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.56rem', color: 'var(--sb-dusty)', marginTop: 2 }}>
        <span>C {claude}{suffix || ''}</span>
        <span>B {betsy}{suffix || ''}</span>
      </div>
    </div>
  );
}

function SubTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--sb-gold)' : '2px solid transparent',
        color: active ? 'var(--sb-cream)' : 'var(--sb-sage)',
        fontFamily: 'var(--sb-font-label)',
        fontSize: '0.7rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

// Outputs catalog — admin clicks a card, opens the generated output in a
// new tab. Each output is auth-gated to admin.
function OutputsCatalog() {
  const outputs = [
    {
      slug: 'tech-stack',
      title: 'Tech Stack Architecture',
      summary: 'Layered architecture diagram + full inventory of tools, libraries, and services by capability. Useful for technical due diligence.',
      icon: '◇',
      color: 'var(--sb-teal-deep)',
      audience: 'Technical reviewers',
      path: '/output/tech-stack',
    },
    {
      slug: 'product-one-pager',
      title: 'Marketing Product One-Pager',
      summary: 'Public-facing intro to what Salt Basin Net Works is and the product features it offers. Suitable for sharing with prospects or partners.',
      icon: '✦',
      color: 'var(--sb-gold)',
      audience: 'Prospects, partners, advisors',
      path: '/output/product-one-pager',
    },
    {
      slug: 'build-progress',
      title: 'To-Date Build Progress Report',
      summary: 'Days elapsed, requirements per capability, timeline of delivery, cost breakdown, tier-cost workarounds, and pre-AI cost comparison.',
      icon: '◆',
      color: 'var(--sb-green)',
      audience: 'Internal · portfolio piece · investors',
      path: '/output/build-summary',
    },
  ];
  return (
    <div>
      <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--sb-dusty)', lineHeight: 1.5, maxWidth: 720 }}>
        Generate a print-ready output from the live backlog. Each output reads
        directly from the requirements and tier workarounds you have edited —
        what you see is what comes out.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
        {outputs.map((o) => (
          <a
            key={o.slug}
            href={o.path}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
              padding: '1rem 1.1rem',
              background: 'rgba(245,240,232,0.04)',
              border: '0.5px solid rgba(181,196,193,0.18)',
              borderLeft: `3px solid ${o.color}`,
              borderRadius: 'var(--sb-radius)',
              textDecoration: 'none',
              color: 'inherit',
              minHeight: 160,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.5rem', color: o.color, lineHeight: 1 }}>{o.icon}</span>
              <span
                className="sb-display"
                style={{ fontSize: '1.1rem', color: 'var(--sb-cream)', letterSpacing: '0.02em' }}
              >
                {o.title}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sb-sage)', lineHeight: 1.55, flex: 1 }}>
              {o.summary}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6, borderTop: '0.5px solid rgba(181,196,193,0.1)' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--sb-dusty)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {o.audience}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--sb-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Open ↗
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
