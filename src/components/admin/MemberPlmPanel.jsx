import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import {
  PLATFORM_LIFECYCLE_CONFIG,
  average,
  backlogItemToLifecycleRecord,
  gateLabel,
  pct,
} from '../../data/platformLifecycleConfig.js';
import { PLATFORM_MODULES, UNASSIGNED_MODULE, moduleForGroupSlug } from '../../data/platformModules.js';
import { fieldCoverage } from '../../data/backlogFieldSchema.js';

const s = {
  page: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--sb-navy-deep)' },
  scroll: { flex: 1, overflowY: 'auto', padding: '1.5rem' },
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' },
  title: { fontSize: '1.45rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '0.25rem' },
  sub: { fontSize: '0.82rem', color: 'var(--sb-dusty)', marginBottom: '1.25rem', lineHeight: 1.55, maxWidth: 900 },
  card: { background: 'rgba(255,255,255,0.035)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 4 },
  muted: { color: 'var(--sb-dusty)' },
};

const STATUS_LABELS = {
  all: 'All',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  deployed: 'Deployed',
  blocked: 'Blocked',
};

const ALL_MODULES = [...PLATFORM_MODULES, UNASSIGNED_MODULE];

export default function MemberPlmPanel({ scope = 'admin' }) {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [backlog, snapshotPayload] = await Promise.all([
          api.getBacklog(),
          api.getSnapshots().catch(() => ({ snapshots: [] })),
        ]);
        if (cancelled) return;
        setItems(backlog.items || []);
        setGroups(backlog.groups || []);
        setSnapshots(snapshotPayload.snapshots || []);
      } catch (e) {
        if (!cancelled) setError(e.status === 401 || e.status === 403 ? 'Platform lifecycle data is admin-only right now.' : e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const groupById = useMemo(() => Object.fromEntries(groups.map((group) => [group.id, group])), [groups]);

  const records = useMemo(() => {
    return items
      .filter((item) => item.status !== 'archived')
      .map((item) => {
        const group = groupById[item.capabilityId];
        const record = backlogItemToLifecycleRecord(item, group);
        record.module = moduleForGroupSlug(group?.slug);
        return record;
      })
      .sort((a, b) => a.realProgressScore - b.realProgressScore);
  }, [items, groupById]);

  const moduleSummaries = useMemo(() => {
    return ALL_MODULES.map((module) => {
      const moduleRecords = records.filter((record) => record.module.id === module.id);
      const stageCounts = {};
      for (const record of moduleRecords) {
        const key = record.computedStage?.key || 'discovered';
        stageCounts[key] = (stageCounts[key] || 0) + 1;
      }
      return {
        module,
        count: moduleRecords.length,
        realProgressPct: average(moduleRecords.map((r) => r.realProgressScore)),
        gateGapCount: moduleRecords.filter((r) => r.gateGaps.length > 0).length,
        stageCounts,
      };
    });
  }, [records]);

  const selectedModule = ALL_MODULES.find((m) => m.id === selectedModuleId) || null;
  const moduleRecords = useMemo(
    () => (selectedModuleId ? records.filter((record) => record.module.id === selectedModuleId) : []),
    [records, selectedModuleId]
  );

  const visibleRecords = filter === 'all'
    ? moduleRecords
    : moduleRecords.filter((record) => record.sourceItem.status === filter);

  const selected = moduleRecords.find((record) => record.id === selectedId) || visibleRecords[0] || null;

  const metrics = useMemo(() => {
    const deployed = records.filter((record) => record.sourceItem.status === 'deployed' || record.sourceItem.status === 'completed').length;
    const blockedAhead = records.filter((record) => record.gateGaps.length > 0).length;
    return {
      total: records.length,
      deliveredPct: records.length ? deployed / records.length : 0,
      dataPct: average(records.map((record) => record.dataDefinitionPct)),
      methodologyPct: average(records.map((record) => record.methodologyScore)),
      contributionPct: average(records.map((record) => record.contributionScore)),
      realProgressPct: average(records.map((record) => record.realProgressScore)),
      blockedAhead,
    };
  }, [records]);

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const record of moduleRecords) {
      const key = record.computedStage?.key || 'discovered';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [moduleRecords]);

  function openModule(moduleId) {
    setSelectedModuleId(moduleId);
    setSelectedId(null);
    setFilter('all');
  }

  if (scope === 'member' && error) {
    return (
      <div style={s.page}>
        <div style={s.scroll}>
          <div style={s.eyebrow}>Platform Lifecycle Management</div>
          <div style={s.title}>Platform Roadmap</div>
          <div style={s.sub}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.scroll}>
        <div style={s.eyebrow}>Platform Lifecycle Management</div>
        <div style={s.title}>Operating Model Dashboard</div>
        <div style={s.sub}>
          Every platform module — Network Relationship Management, Platform Lifecycle Management,
          Customer Relationship Management, and the rest of the Application Map — projected through
          configurable lifecycle gates, weighted methodology dimensions driven by literal field
          definitions, contribution intelligence, and global-standard governance concepts.
        </div>

        <ModelStrip />

        {error && (
          <div style={{ ...s.card, padding: '0.9rem 1rem', color: 'var(--sb-risk-critical)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.55rem', marginBottom: '1.25rem' }}>
          <Metric label="Lifecycle Records" value={loading ? '...' : metrics.total} />
          <Metric label="Real Progress" value={pct(metrics.realProgressPct)} accent />
          <Metric label="Data Definition" value={pct(metrics.dataPct)} />
          <Metric label="Methodology" value={pct(metrics.methodologyPct)} />
          <Metric label="Contribution" value={pct(metrics.contributionPct)} />
          <Metric label="Selected Ahead" value={metrics.blockedAhead} warn={metrics.blockedAhead > 0} />
        </div>

        {loading ? (
          <div style={{ ...s.card, padding: '1rem', ...s.muted }}>Loading platform lifecycle records...</div>
        ) : !selectedModule ? (
          <ModuleGrid summaries={moduleSummaries} onSelect={openModule} />
        ) : (
          <>
            <Breadcrumb module={selectedModule} onBack={() => setSelectedModuleId(null)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '0.85rem', alignItems: 'start' }}>
              <div style={{ minWidth: 0 }}>
                <StageRail counts={stageCounts} total={moduleRecords.length} />
                <Filters active={filter} onChange={setFilter} />
                {visibleRecords.length === 0 ? (
                  <div style={{ ...s.card, padding: '1rem', ...s.muted }}>No records in this module / status.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.65rem' }}>
                    {visibleRecords.map((record) => (
                      <RecordCard
                        key={record.id}
                        record={record}
                        active={selected?.id === record.id}
                        onClick={() => setSelectedId(record.id)}
                      />
                    ))}
                  </div>
                )}
                <FieldCoveragePanel items={moduleRecords.map((r) => r.sourceItem)} />
              </div>

              <DetailPanel record={selected} latestSnapshot={snapshots[snapshots.length - 1]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModelStrip() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.55rem', marginBottom: '1rem' }}>
      {PLATFORM_LIFECYCLE_CONFIG.applications.map((app) => (
        <div key={app.appId} style={{ ...s.card, padding: '0.75rem 0.85rem' }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>{app.displayName}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--sb-dusty)', lineHeight: 1.45 }}>{app.purpose}</div>
        </div>
      ))}
    </div>
  );
}

function Breadcrumb({ module, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: '0.5px solid rgba(196,132,58,0.35)', color: 'var(--sb-gold)',
          borderRadius: 3, padding: '0.3rem 0.65rem', fontSize: '0.68rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--sb-font-label)',
        }}
      >
        ← All Modules
      </button>
      <div style={{ fontSize: '0.95rem', color: 'var(--sb-cream)', fontFamily: 'var(--sb-font-display)' }}>{module.label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)' }}>{module.description}</div>
    </div>
  );
}

function ModuleGrid({ summaries, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.7rem' }}>
      {summaries.map(({ module, count, realProgressPct, gateGapCount, stageCounts }) => (
        <button
          key={module.id}
          onClick={() => onSelect(module.id)}
          style={{
            ...s.card, textAlign: 'left', padding: '0.9rem', cursor: 'pointer',
            fontFamily: 'var(--sb-font-body)', color: 'inherit',
            borderColor: gateGapCount > 0 ? 'rgba(196,74,74,0.3)' : 'rgba(196,132,58,0.18)',
          }}
        >
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
            {module.shortLabel}
          </div>
          <div style={{ fontSize: '0.98rem', color: 'var(--sb-cream)', lineHeight: 1.3, marginBottom: 6 }}>{module.label}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sb-dusty)', lineHeight: 1.45, marginBottom: '0.7rem', minHeight: '2.2em' }}>{module.description}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <SmallStat label="Backlog Items" value={count} />
            <SmallStat label="Real Progress" value={pct(realProgressPct)} warn={gateGapCount > 0} />
          </div>
          <MiniStageBar stageCounts={stageCounts} />
        </button>
      ))}
    </div>
  );
}

function MiniStageBar({ stageCounts }) {
  const stages = PLATFORM_LIFECYCLE_CONFIG.lifecycleStages.filter((stage) => stage.key !== 'retired');
  return (
    <div style={{ display: 'flex', gap: 2, marginTop: '0.6rem', height: 4 }}>
      {stages.map((stage) => {
        const count = stageCounts[stage.key] || 0;
        return (
          <div
            key={stage.key}
            title={`${stage.label}: ${count}`}
            style={{
              flex: count || 0.001,
              minWidth: count ? 2 : 0,
              background: count ? 'var(--sb-gold)' : 'transparent',
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}

function FieldCoveragePanel({ items }) {
  const coverage = useMemo(() => fieldCoverage(items), [items]);
  if (!items.length) return null;
  return (
    <div style={{ ...s.card, padding: '0.85rem', marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.6rem' }}>
        Field Definition Coverage
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {coverage.map(({ field, coveragePct }) => (
          <div key={field.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--sb-dusty)', marginBottom: 2 }}>
              <span>{field.label} <span style={{ opacity: 0.6 }}>({field.type})</span></span>
              <span>{pct(coveragePct)} · {field.sourceDoc} §{field.sourceSection}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct(coveragePct), background: 'var(--sb-sage)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, accent, warn }) {
  return (
    <div style={{ ...s.card, padding: '0.7rem 0.85rem', borderColor: warn ? 'rgba(196,74,74,0.45)' : accent ? 'rgba(168,184,154,0.35)' : 'rgba(196,132,58,0.18)' }}>
      <div style={{ fontSize: '0.55rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: warn ? 'var(--sb-risk-critical)' : accent ? 'var(--sb-green)' : 'var(--sb-gold)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.45rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300 }}>{value}</div>
    </div>
  );
}

function StageRail({ counts, total }) {
  return (
    <div style={{ ...s.card, padding: '0.75rem 0.85rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.55rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>Computed Lifecycle Stage Gates</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--sb-dusty)' }}>Config v{PLATFORM_LIFECYCLE_CONFIG.version}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: 4 }}>
        {PLATFORM_LIFECYCLE_CONFIG.lifecycleStages.filter((stage) => stage.key !== 'retired').map((stage) => {
          const count = counts[stage.key] || 0;
          const width = total ? `${Math.max(5, Math.round((count / total) * 100))}%` : '5%';
          return (
            <div key={stage.key} title={`${stage.label}: ${count}`} style={{ minWidth: 0 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width, background: count ? 'var(--sb-gold)' : 'rgba(139,155,174,0.25)' }} />
              </div>
              <div style={{ fontSize: '0.56rem', color: count ? 'var(--sb-cream)' : 'var(--sb-dusty)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.label}</div>
              <div style={{ fontSize: '0.56rem', color: 'var(--sb-dusty)' }}>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Filters({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          style={{
            padding: '0.28rem 0.7rem',
            fontSize: '0.64rem',
            fontFamily: 'var(--sb-font-label)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: active === value ? 'var(--sb-gold)' : 'transparent',
            color: active === value ? 'var(--sb-ivory)' : 'var(--sb-dusty)',
            border: `0.5px solid ${active === value ? 'var(--sb-gold)' : 'rgba(139,155,174,0.3)'}`,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RecordCard({ record, active, onClick }) {
  const item = record.sourceItem;
  const selectedAhead = record.gateGaps.length > 0;
  return (
    <button
      onClick={onClick}
      style={{
        ...s.card,
        textAlign: 'left',
        padding: '0.85rem',
        cursor: 'pointer',
        borderColor: active ? 'var(--sb-gold)' : selectedAhead ? 'rgba(196,74,74,0.35)' : 'rgba(196,132,58,0.18)',
        fontFamily: 'var(--sb-font-body)',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.56rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>
            {record.code} / {record.capability?.name || 'Unmapped Capability'}
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--sb-cream)', lineHeight: 1.3 }}>{record.name}</div>
        </div>
        <StatusPill status={item.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.7rem' }}>
        <SmallStat label="Computed" value={record.computedStage.label} />
        <SmallStat label="Selected" value={record.selectedStage.label} warn={selectedAhead} />
      </div>
      <ProgressRow label="Real Progress" value={record.realProgressScore} />
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <MiniChip label={`Data ${pct(record.dataDefinitionPct)}`} />
        <MiniChip label={`Method ${pct(record.methodologyScore)}`} />
        <MiniChip label={`CIM ${pct(record.contributionScore)}`} />
        {selectedAhead && <MiniChip label={`${record.gateGaps.length} gate gaps`} warn />}
      </div>
    </button>
  );
}

function DetailPanel({ record, latestSnapshot }) {
  if (!record) {
    return <div style={{ ...s.card, padding: '1rem', color: 'var(--sb-dusty)' }}>Select a lifecycle record to inspect gate gaps.</div>;
  }

  return (
    <aside style={{ ...s.card, padding: '1rem', position: 'sticky', top: 0 }}>
      <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: 4 }}>Object Detail</div>
      <div style={{ fontSize: '1.05rem', color: 'var(--sb-cream)', fontFamily: 'var(--sb-font-display)', lineHeight: 1.25 }}>{record.name}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--sb-dusty)', marginTop: 4 }}>{record.code} / {record.type}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.9rem' }}>
        <SmallStat label="Real Progress" value={pct(record.realProgressScore)} />
        <SmallStat label="Budget Confidence" value={pct(record.budgetConfidence)} />
        <SmallStat label="Computed Stage" value={record.computedStage.label} />
        <SmallStat label="Selected Stage" value={record.selectedStage.label} warn={record.gateGaps.length > 0} />
      </div>

      <SectionTitle>Lifecycle Gate Gaps</SectionTitle>
      {record.gateGaps.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {record.gateGaps.map((gap) => (
            <div key={gap.key} style={{ border: '0.5px solid rgba(196,74,74,0.3)', borderRadius: 3, padding: '0.55rem', background: 'rgba(196,74,74,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--sb-cream)', fontSize: '0.76rem' }}>{gateLabel(gap.key)}</strong>
                <span style={{ color: 'var(--sb-risk-critical)', fontSize: '0.72rem' }}>{pct(gap.actual)} / {pct(gap.required)}</span>
              </div>
              <div style={{ color: 'var(--sb-dusty)', fontSize: '0.68rem', marginTop: 3 }}>{gap.source}</div>
              {gap.missingFields?.length > 0 && (
                <div style={{ color: 'var(--sb-risk-critical)', fontSize: '0.68rem', marginTop: 4, lineHeight: 1.45 }}>
                  Missing: {gap.missingFields.map((f) => f.label).join(', ')}
                  {' — see '}
                  {[...new Set(gap.missingFields.map((f) => `${f.sourceDoc} §${f.sourceSection}`))].join('; ')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--sb-green)', fontSize: '0.78rem' }}>Selected lifecycle stage is earned by the configured gates.</div>
      )}

      <SectionTitle>Weighted Methodology</SectionTitle>
      <DimensionList values={record.methodology} dimensions={PLATFORM_LIFECYCLE_CONFIG.methodologyDimensions} />

      <SectionTitle>Contribution Intelligence</SectionTitle>
      <DimensionList values={record.contribution} dimensions={PLATFORM_LIFECYCLE_CONFIG.contributionDimensions} />

      <SectionTitle>Release Flow</SectionTitle>
      <ol style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--sb-dusty)', fontSize: '0.72rem', lineHeight: 1.55 }}>
        {PLATFORM_LIFECYCLE_CONFIG.releaseFlow.map((step) => <li key={step}>{step}</li>)}
      </ol>

      {latestSnapshot && (
        <>
          <SectionTitle>Latest Snapshot</SectionTitle>
          <div style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem', lineHeight: 1.5 }}>
            {latestSnapshot.capturedDate || new Date(Number(latestSnapshot.capturedAt)).toLocaleDateString()} / {latestSnapshot.requirementsDelivered} delivered of {latestSnapshot.requirementsTotal} requirements.
          </div>
        </>
      )}
    </aside>
  );
}

function DimensionList({ values, dimensions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {dimensions.map((dimension) => (
        <div key={dimension.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--sb-dusty)', marginBottom: 2 }}>
            <span>{dimension.label}</span>
            <span>{pct(values[dimension.key])} / {pct(dimension.weight)} wt</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct(values[dimension.key]), background: 'var(--sb-sage)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginTop: '1rem', marginBottom: '0.45rem' }}>
      {children}
    </div>
  );
}

function SmallStat({ label, value, warn }) {
  return (
    <div style={{ background: warn ? 'rgba(196,74,74,0.08)' : 'rgba(255,255,255,0.035)', border: `0.5px solid ${warn ? 'rgba(196,74,74,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 3, padding: '0.45rem' }}>
      <div style={{ fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: warn ? 'var(--sb-risk-critical)' : 'var(--sb-dusty)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--sb-cream)' }}>{value}</div>
    </div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div style={{ marginTop: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--sb-dusty)', marginBottom: 3 }}>
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: pct(value), height: '100%', background: 'linear-gradient(90deg, var(--sb-gold), var(--sb-sage))' }} />
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const color = status === 'deployed' ? 'var(--sb-green)' : status === 'completed' ? 'var(--sb-sage)' : status === 'blocked' ? 'var(--sb-risk-critical)' : 'var(--sb-gold)';
  return (
    <span style={{ border: `0.5px solid ${color}`, color, borderRadius: 99, padding: '2px 7px', fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function MiniChip({ label, warn }) {
  return (
    <span style={{ fontSize: '0.58rem', color: warn ? 'var(--sb-risk-critical)' : 'var(--sb-dusty)', border: `0.5px solid ${warn ? 'rgba(196,74,74,0.35)' : 'rgba(139,155,174,0.25)'}`, borderRadius: 99, padding: '1px 7px' }}>
      {label}
    </span>
  );
}
