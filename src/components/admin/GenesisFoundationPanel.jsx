import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';
import OverlapResolutionJourney from './OverlapResolutionJourney.jsx';

const S = {
  page: { height: '100%', overflowY: 'auto', padding: '1.5rem', color: 'var(--sb-cream)' },
  eyebrow: { font: '600 .62rem var(--sb-font-label)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--sb-gold)' },
  title: { margin: '.3rem 0 .45rem', font: '300 1.6rem var(--sb-font-display)' },
  intro: { maxWidth: 900, color: 'var(--sb-dusty)', fontSize: '.78rem', lineHeight: 1.55 },
  chain: { position: 'relative', height: 320, margin: '1.1rem 0', overflow: 'hidden', border: '1px solid rgba(139,155,174,.16)', borderRadius: 18, background: 'radial-gradient(circle at 50% 48%,rgba(46,106,126,.38),rgba(8,24,34,.92) 44%,rgba(5,15,24,.98) 76%)' },
  node: (active, index) => ({ position: 'absolute', zIndex: 4, left: `${[9,27,50,73,91][index]}%`, top: `${[25,69,78,69,25][index]}%`, width: 150, minHeight: 100, padding: '.75rem .9rem', border: `1px solid ${active ? 'var(--sb-gold)' : 'rgba(139,155,174,.32)'}`, clipPath: 'polygon(12% 18%,50% 0,88% 18%,100% 72%,50% 100%,0 72%)', transform: 'translate(-50%,-50%)', background: active ? 'linear-gradient(145deg,rgba(196,132,58,.28),rgba(17,46,59,.96))' : 'linear-gradient(145deg,rgba(50,93,111,.42),rgba(8,26,37,.96))', boxShadow: active ? '0 0 30px rgba(196,132,58,.22)' : '0 14px 34px rgba(0,0,0,.25)', cursor: 'pointer', textAlign: 'center', color: 'inherit' }),
  nodeId: { font: '600 .58rem var(--sb-font-label)', letterSpacing: '.14em', color: 'var(--sb-gold)' },
  nodeLabel: { display: 'block', marginTop: '.25rem', font: '400 .9rem var(--sb-font-display)' },
  nodeNote: { display: 'block', marginTop: '.25rem', color: 'var(--sb-dusty)', fontSize: '.64rem', lineHeight: 1.35 },
  grid: { display: 'grid', gridTemplateColumns: '245px minmax(0,1fr)', gap: '.8rem', minHeight: 460 },
  panel: { border: '1px solid rgba(139,155,174,.18)', background: 'rgba(255,255,255,.02)', padding: '.8rem' },
  tableButton: (active) => ({ width: '100%', padding: '.5rem .55rem', marginBottom: '.25rem', textAlign: 'left', border: 0, borderLeft: `2px solid ${active ? 'var(--sb-gold)' : 'transparent'}`, background: active ? 'rgba(196,132,58,.09)' : 'transparent', color: active ? 'var(--sb-cream)' : 'var(--sb-dusty)', cursor: 'pointer', fontSize: '.68rem' }),
  input: { width: '100%', padding: '.48rem .55rem', boxSizing: 'border-box', background: 'rgba(0,0,0,.22)', border: '1px solid rgba(139,155,174,.25)', color: 'var(--sb-cream)', fontSize: '.7rem' },
  record: { padding: '.65rem .75rem', marginTop: '.45rem', border: '1px solid rgba(139,155,174,.14)', background: 'rgba(0,0,0,.12)' },
  recordHead: { display: 'flex', gap: '.5rem', alignItems: 'baseline', marginBottom: '.35rem', color: 'var(--sb-gold)', font: '600 .68rem var(--sb-font-label)' },
  fields: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '.25rem .8rem' },
  field: { fontSize: '.66rem', color: 'var(--sb-dusty)', lineHeight: 1.4, overflowWrap: 'anywhere' },
  key: { color: '#9eabb8', marginRight: '.3rem' },
  textarea: { width: '100%', minHeight: 410, boxSizing: 'border-box', padding: '.7rem', background: 'rgba(0,0,0,.25)', border: '1px solid rgba(139,155,174,.25)', color: 'var(--sb-cream)', font: '.68rem/1.5 var(--sb-font-mono, monospace)' },
  button: { marginTop: '.55rem', padding: '.45rem .9rem', border: '1px solid var(--sb-gold)', background: 'var(--sb-gold)', color: 'var(--sb-ivory)', cursor: 'pointer', fontSize: '.7rem' },
  status: { color: 'var(--sb-dusty)', fontSize: '.68rem', marginBottom: '.55rem' },
  orbit: { position: 'absolute', left: '50%', top: '50%', border: '1px solid rgba(139,155,174,.2)', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
  center: { position: 'absolute', zIndex: 2, left: '50%', top: '47%', width: 150, height: 150, transform: 'translate(-50%,-50%)', display: 'grid', placeItems: 'center' },
};

const LAYERS = [
  { key: 'scientific', id: 'R1', label: 'Scientific foundation', note: 'Evidence-backed classifications, properties, equations, laws and variables.' },
  { key: 'translation', id: 'R3', label: 'Translation compiler', note: 'Mechanism tests, counterexamples, bindings and authority boundaries.' },
  { key: 'enterprise', id: 'R2', label: 'Enterprise foundation', note: 'Reusable definitions, objects, equations, controls and journeys.' },
  { key: 'configuration', id: 'R4', label: 'Organization configuration', note: 'Namespaced aliases, variable bindings, workflows, policies and evidence.' },
  { key: 'overlap', id: 'XREF', label: 'Object overlap', note: 'Live implementation bindings, duplicates, migration actions and review state.' },
];

function recordIdentity(record) {
  const entry = Object.entries(record).find(([key]) => key.endsWith('_ID') || key === 'Layer' || key === 'Phase_ID');
  return entry || Object.entries(record)[0] || ['', 'Record'];
}

export default function GenesisFoundationPanel() {
  const [summary, setSummary] = useState(null);
  const [layer, setLayer] = useState('scientific');
  const [tables, setTables] = useState([]);
  const [table, setTable] = useState(null);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [configText, setConfigText] = useState('');
  const [persisted, setPersisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overlapSummary, setOverlapSummary] = useState(null);
  const [overlaps, setOverlaps] = useState([]);
  const [overlapFilters, setOverlapFilters] = useState({ domain: '', status: '', reviewStatus: '', q: '' });
  const [resolutionItem, setResolutionItem] = useState(null);

  useEffect(() => {
    Promise.all([api.getGenesisSummary(), api.getGenesisConfigurations(), api.getGenesisOverlapSummary()]).then(([nextSummary, configs, nextOverlapSummary]) => {
      setSummary(nextSummary);
      setOverlapSummary(nextOverlapSummary);
      setPersisted(configs.persisted);
      setConfigText(JSON.stringify(configs.configurations[0], null, 2));
    }).catch(() => toast.error('Failed to load Genesis foundation'));
  }, []);

  useEffect(() => {
    if (layer === 'configuration' || layer === 'overlap') return;
    setLoading(true);
    api.getGenesisLayer(layer).then((result) => {
      setTables(result.tables || []);
      setTable((current) => result.tables?.some((item) => item.name === current) ? current : result.tables?.[0]?.name || null);
    }).catch(() => toast.error('Failed to load repository layer')).finally(() => setLoading(false));
  }, [layer]);

  useEffect(() => {
    if (layer === 'configuration' || layer === 'overlap' || !table) return;
    setLoading(true);
    api.getGenesisTable(layer, table, query).then((result) => setRecords(result.records || []))
      .catch(() => toast.error('Failed to load catalog records')).finally(() => setLoading(false));
  }, [layer, table, query]);

  useEffect(() => {
    if (layer !== 'overlap') return;
    setLoading(true);
    api.getGenesisOverlaps(overlapFilters).then((result) => setOverlaps(result.overlaps || []))
      .catch(() => toast.error('Failed to load object overlap registry')).finally(() => setLoading(false));
  }, [layer, overlapFilters]);

  const counts = useMemo(() => Object.fromEntries((summary?.layers || []).map((item) => [item.key, item])), [summary]);

  async function saveConfiguration() {
    try {
      const value = JSON.parse(configText);
      await api.saveGenesisConfiguration(value);
      setPersisted(true);
      toast.success('Versioned Genesis configuration saved');
    } catch (error) {
      toast.error(error.body?.details?.join(' · ') || error.message || 'Configuration save failed');
    }
  }

  async function reviewOverlap(item, reviewStatus) {
    try {
      await api.updateGenesisOverlap(item.overlap_id, { reviewStatus });
      const [list, nextSummary] = await Promise.all([api.getGenesisOverlaps(overlapFilters), api.getGenesisOverlapSummary()]);
      setOverlaps(list.overlaps || []); setOverlapSummary(nextSummary);
      toast.success(`${item.source_key} marked ${reviewStatus}`);
    } catch (error) { toast.error(error.message || 'Overlap review failed'); }
  }

  async function refreshOverlaps() {
    const [list, nextSummary] = await Promise.all([api.getGenesisOverlaps(overlapFilters), api.getGenesisOverlapSummary()]);
    setOverlaps(list.overlaps || []);
    setOverlapSummary(nextSummary);
  }

  return (
    <div style={S.page}>
      <div style={S.eyebrow}>Salt Basin · Genesis</div>
      <div style={S.title}>Foundational Classification &amp; Operating Logic</div>
      <div style={S.intro}>Canonical science stays immutable. Mappings extract testable mechanisms without granting execution authority. Enterprise definitions establish reusable meaning; organization configuration binds those definitions to local fields, equations, predicates, evidence and workflows.</div>
      <div style={S.chain}>
        <div style={{ ...S.orbit, width: '76%', height: '72%' }} /><div style={{ ...S.orbit, width: '48%', height: '48%' }} />
        <div style={S.center}><SaltBasinCrystal variant="engine" size="orbit" orbitCount={4} /><div style={{ position: 'absolute', bottom: -4, font: '600 .58rem var(--sb-font-label)', letterSpacing: '.16em', color: 'var(--sb-gold)' }}>GENESIS KERNEL</div></div>
        {LAYERS.map((item, index) => <button key={item.key} style={S.node(layer === item.key, index)} onClick={() => setLayer(item.key)}>
          <span style={S.nodeId}>{item.id}{counts[item.key] ? ` · ${counts[item.key].recordCount} records` : ''}</span>
          <span style={S.nodeLabel}>{item.label}</span><span style={S.nodeNote}>{item.note}</span>
        </button>)}
      </div>

      <div className="mco-workspace-cards">
        {[
          ...(layer === 'overlap' ? [
            ['Bound objects', overlapSummary?.totals?.total || 0, 'Priority implementation inventory'],
            ['Reviewed', overlapSummary?.totals?.reviewed || 0, 'Human-governed decisions'],
            ['Duplicates', overlapSummary?.totals?.duplicates || 0, 'Consolidation candidates'],
            ['Confidence', `${Math.round(Number(overlapSummary?.totals?.average_confidence || 0) * 100)}%`, 'Average binding confidence'],
          ] : [
            ['Scientific records', counts.scientific?.recordCount || 0, 'R1 canonical evidence'],
            ['Enterprise records', counts.enterprise?.recordCount || 0, 'R2 reusable meaning'],
            ['Mapping controls', counts.translation?.recordCount || 0, 'R3 governed compiler'],
            ['Configuration', persisted ? 'Versioned' : 'Draft', 'R4 executable bindings'],
          ]),
        ].map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
      </div>

      {layer === 'overlap' ? resolutionItem
        ? <OverlapResolutionJourney item={resolutionItem} onClose={() => setResolutionItem(null)} onCompleted={refreshOverlaps} />
        : <OverlapDashboard overlaps={overlaps} filters={overlapFilters} setFilters={setOverlapFilters} loading={loading} onReview={reviewOverlap} onResolve={setResolutionItem} />
        : layer === 'configuration' ? <div className="mco-workspace-body"><div style={S.panel}>
        <div style={S.status}>{persisted ? 'Persisted, versioned R4 record' : 'Starter R4 manifest · save to persist'} · lifecycle: {summary?.meta?.recordLifecycle?.join(' → ')}</div>
        <textarea style={S.textarea} value={configText} onChange={(event) => setConfigText(event.target.value)} spellCheck={false} />
        <button style={S.button} onClick={saveConfiguration}>Save configuration version</button>
      </div><aside><h3>Configuration journey</h3>{['Namespace & authority', 'Enterprise aliases', 'Equation variables', 'Policy predicates', 'Journey transitions', 'Evidence & simulation', 'Approval & activation'].map((stage, index) => <button type="button" key={stage}><b>{String(index + 1).padStart(2, '0')}</b><span>{stage}</span></button>)}</aside></div> : <div style={S.grid}>
        <div style={S.panel}>
          <input style={S.input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search IDs, symbols, equations…" />
          <div style={{ marginTop: '.65rem' }}>{tables.map((item) => <button key={item.name} style={S.tableButton(table === item.name)} onClick={() => setTable(item.name)}>{item.name.replace(/^\d+_/, '').replaceAll('_', ' ')} <span style={{ opacity: .55 }}>({item.recordCount})</span></button>)}</div>
        </div>
        <div style={S.panel}>
          <div style={S.status}>{table || 'Select a registry'} · {loading ? 'loading…' : `${records.length} shown`}</div>
          {records.map((record, index) => {
            const [idKey, idValue] = recordIdentity(record);
            return <div style={S.record} key={`${idValue}-${index}`}><div style={S.recordHead}><span>{idValue}</span><span style={{ color: '#9eabb8', fontWeight: 400 }}>{idKey}</span></div><div style={S.fields}>{Object.entries(record).filter(([key]) => key !== idKey).map(([key, value]) => <div style={S.field} key={key}><span style={S.key}>{key}:</span>{String(value)}</div>)}</div></div>;
          })}
        </div>
      </div>}
    </div>
  );
}

function OverlapDashboard({ overlaps, filters, setFilters, loading, onReview, onResolve }) {
  const domains = ['journey', 'metrics', 'identity', 'agents_security', 'configuration'];
  const statuses = ['canonical-match', 'implementation-of', 'configuration-of', 'projection-of', 'duplicate-definition', 'context-bound', 'unmapped', 'category-error'];
  const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  return <div className="mco-workspace-body">
    <div style={S.panel}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .8fr .8fr', gap: '.45rem', marginBottom: '.65rem' }}>
        <input style={S.input} value={filters.q} onChange={set('q')} placeholder="Search table, component, ID or migration…" />
        <select style={S.input} value={filters.domain} onChange={set('domain')}><option value="">All domains</option>{domains.map((value) => <option value={value} key={value}>{value.replaceAll('_', ' ')}</option>)}</select>
        <select style={S.input} value={filters.status} onChange={set('status')}><option value="">All overlap states</option>{statuses.map((value) => <option value={value} key={value}>{value.replaceAll('-', ' ')}</option>)}</select>
      </div>
      <div style={S.status}>{loading ? 'Resolving live bindings…' : `${overlaps.length} implementation bindings`}</div>
      {overlaps.map((item) => <article style={S.record} key={item.overlap_id}>
        <div style={{ ...S.recordHead, justifyContent: 'space-between' }}><span>{item.source_key}</span><span style={{ color: item.overlap_status === 'duplicate-definition' ? '#e2a86f' : '#8db9ae' }}>{item.overlap_status}</span></div>
        <div style={S.fields}>
          <div style={S.field}><span style={S.key}>Source:</span>{item.source_kind} · {item.source_path}</div>
          <div style={S.field}><span style={S.key}>Canonical:</span>{item.canonical_repository} · {item.canonical_id} · {item.mapping_relation}</div>
          <div style={S.field}><span style={S.key}>Rationale:</span>{item.rationale}</div>
          <div style={S.field}><span style={S.key}>Migration:</span>{item.migration_action}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginTop: '.5rem' }}>
          <span style={{ ...S.status, margin: 0 }}>{Math.round(Number(item.confidence) * 100)}% confidence · {item.review_status}</span>
          <button style={{ ...S.button, margin: 0, marginLeft: 'auto', background: 'transparent', color: 'var(--sb-gold)' }} onClick={() => onResolve(item)}>Resolve recommendation</button>
          <button style={{ ...S.button, margin: 0, background: 'transparent', color: 'var(--sb-gold)' }} onClick={() => onReview(item, 'reviewed')}>Mark reviewed</button>
          <button style={{ ...S.button, margin: 0 }} onClick={() => onReview(item, 'approved')}>Approve binding</button>
        </div>
      </article>)}
    </div>
    <aside><h3>Overlap review journey</h3>{['Inventory source', 'Resolve canonical ID', 'Test mapping relation', 'Identify duplicates', 'Define migration action', 'Review authority', 'Approve binding'].map((stage, index) => <button type="button" key={stage}><b>{String(index + 1).padStart(2, '0')}</b><span>{stage}</span></button>)}</aside>
  </div>;
}
