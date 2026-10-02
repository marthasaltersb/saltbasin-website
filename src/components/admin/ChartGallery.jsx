// ChartGallery — the Infographics tab body of the Output Template editor.
// A visual gallery of chart cards, each with a LIVE thumbnail rendered from
// the member's real Career Master data via renderBlockToHtml (the same
// renderer the preview iframe and printed output use). Selecting a card
// reveals its data-source chips + optional title; Add appends an item to
// config.layer3_infographics.items in the existing stored shape:
//   { id, blockType, sourceKey, params: { title, ...typeSpecific }, order, visible }
// (buildInfographicBlocksFromLayerConfig spreads item.params into block props.)
// Also renders the configured-infographics list (reorder / edit / remove).
// Legacy block types stay available in the "Classic charts" row — saved
// templates keep rendering because no block type is ever removed.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderBlockToHtml } from '../../lib/outputBlocks.js';
import { TREND_SOURCES, outcomeCandidates } from '../../lib/careerCharts.js';

const NAVY = 'var(--sb-navy, #1b2a3b)';
const GOLD = 'var(--sb-gold, #c4843a)';
const THUMB_W = 520; // logical px the chart is laid out at before scaling
const THUMB_H = 215; // logical height of the thumbnail window

const G = {
  label: { fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' },
  input: { padding: '0.45rem 0.7rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.85rem', marginBottom: '1.1rem' },
  classicGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.7rem', marginBottom: '1.1rem' },
  card: (on, small) => ({
    background: 'white', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
    border: on ? `2px solid ${GOLD}` : '0.5px solid rgba(0,0,0,0.14)',
    boxShadow: on ? '0 4px 14px rgba(196,132,58,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
    gridColumn: on ? '1 / -1' : undefined, display: 'flex', flexDirection: on ? 'row' : 'column',
  }),
  thumbBox: { position: 'relative', overflow: 'hidden', background: '#fff', pointerEvents: 'none', userSelect: 'none' },
  chip: (on) => ({
    display: 'inline-flex', alignItems: 'center', padding: '0.28rem 0.7rem', borderRadius: 16, margin: '0.15rem 0.3rem 0.15rem 0',
    border: on ? `1.5px solid ${GOLD}` : '0.5px solid rgba(0,0,0,0.18)',
    background: on ? 'rgba(196,132,58,0.12)' : 'white', fontSize: '0.74rem', cursor: 'pointer', color: '#333',
    fontWeight: on ? 600 : 400, fontFamily: 'inherit',
  }),
  btn: (kind, disabled) => ({
    padding: '0.42rem 1rem', borderRadius: 8, border: kind === 'ghost' ? '0.5px solid rgba(0,0,0,0.2)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.05em',
    background: kind === 'gold' ? GOLD : kind === 'navy' ? NAVY : 'white', color: kind === 'ghost' ? '#333' : 'white', opacity: disabled ? 0.45 : 1,
  }),
  small: { padding: '0.25rem 0.55rem', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', background: 'white', fontSize: '0.66rem', cursor: 'pointer', color: '#444' },
};

// ── Chart catalog. `family` decides which gallery row a card sits in. ─────────
export const CHART_CATALOG = [
  { type: 'career-proficiency-bars', family: 'career', name: 'Proficiency Tiers', bestFor: 'Showing how strong you are in each skill or tool, from Exposure up to Expert.', configure: 'proficiency' },
  { type: 'career-trend-bars', family: 'career', name: 'Trend Bars', bestFor: 'Showing growth over time: experience years, skills, tools or engagements per year.', configure: 'trend' },
  { type: 'career-outcome-tiles', family: 'career', name: 'Outcome Tiles', bestFor: 'Leading with headline results, like "$500M+ revenue automated".', configure: 'tiles' },
  { type: 'career-duration-timeline', family: 'career', name: 'Career Timeline', bestFor: 'Showing the span and overlap of every role at a glance.', configure: 'timeline' },
  { type: 'career-skill-years-dots', family: 'career', name: 'Skill Years Dots', bestFor: 'Showing depth: one dot for every year you have used each skill.', configure: 'topn', topN: { label: 'Top skills', def: 8 } },
  { type: 'career-industry-share', family: 'career', name: 'Industry Share Bars', bestFor: 'Showing what share of your career time sits in each industry.', configure: 'topn', topN: { label: 'Top industries', def: 5 } },
  { type: 'bar-chart-h', family: 'classic', name: 'Bar Chart (Horizontal)', bestFor: 'Comparing counts across categories with long labels.', configure: 'group' },
  { type: 'bar-chart-v', family: 'classic', name: 'Bar Chart (Vertical)', bestFor: 'Comparing the top 8 categories side by side.', configure: 'group' },
  { type: 'capacity-gauge', family: 'classic', name: 'Capacity Gauge', bestFor: 'Spotlighting one headline number against its maximum.', configure: 'key' },
  { type: 'venn-overlap', family: 'classic', name: 'Overlap (Venn)', bestFor: 'Where skill categories and industries intersect.', configure: null },
  { type: 'cert-badges', family: 'classic', name: 'Certification Badges', bestFor: 'Credentials at a glance, active and expired.', configure: null },
  { type: 'tool-usage-snapshot', family: 'classic', name: 'Tool & Tech Snapshot', bestFor: 'Which tools you actually used across roles.', configure: null },
];
const CATALOG_BY_TYPE = Object.fromEntries(CHART_CATALOG.map((c) => [c.type, c]));
export const chartDef = (type) => CATALOG_BY_TYPE[type];

const ROLLUP_GROUP_LABELS = {
  skills_by_category: 'Skills by category',
  jobs_by_industry: 'Roles by industry',
  tools_by_bucket: 'Tools by wheel bucket',
  engagements_by_industry: 'Case studies by industry',
  engagements_by_employer: 'Case studies by employer',
  certifications_by_category: 'Certifications by category',
  certifications_by_status: 'Certifications by status',
  domains_by_group: 'Domains by group',
};

export function rollupGroupOptions(rollupCatalog) {
  const seen = new Map();
  for (const r of rollupCatalog?.staticRollups || []) {
    if (!r.key.includes(':')) continue;
    const prefix = r.key.split(':')[0];
    if (!seen.has(prefix)) seen.set(prefix, ROLLUP_GROUP_LABELS[prefix] || prefix);
  }
  return [...seen.entries()].map(([value, label]) => ({ value, label }));
}

export function rollupKeyOptions(rollupCatalog) {
  const statics = (rollupCatalog?.staticRollups || []).map((r) => ({ value: r.key, label: r.label }));
  const deltas = (rollupCatalog?.deltaRollups || []).map((r) => ({ value: r.key, label: r.label }));
  return [...statics, ...deltas];
}

// Options a chart needs for its data-source chips.
function sourceOptionsFor(def, rollupCatalog) {
  if (def?.configure === 'group') return rollupGroupOptions(rollupCatalog);
  if (def?.configure === 'key') return rollupKeyOptions(rollupCatalog);
  if (def?.configure === 'trend') return Object.entries(TREND_SOURCES).map(([value, t]) => ({ value, label: t.label }));
  return [];
}

// Default {sourceKey, params} for a chart type given live data.
function defaultsFor(def, rollupCatalog) {
  const opts = sourceOptionsFor(def, rollupCatalog);
  switch (def.configure) {
    case 'proficiency': return { sourceKey: '', params: { title: '', entityType: 'all', groupBy: 'entity', maxItems: 10, showFootnote: true } };
    case 'timeline': return { sourceKey: '', params: { title: '', maxItems: 12 } };
    case 'topn': return { sourceKey: '', params: { title: '', maxItems: def.topN.def } };
    case 'trend': return { sourceKey: 'experience_years', params: { title: '' } };
    case 'tiles': return { sourceKey: '', params: { title: '', tiles: [], showFootnote: true } };
    case 'group':
    case 'key': return { sourceKey: opts[0]?.value || '', params: { title: '' } };
    default: return { sourceKey: '', params: { title: '' } };
  }
}

// Returns { html, error }. A renderer exception is reported to the caller
// (shown on the card) and logged — never turned into an empty thumbnail.
function renderChart(type, sourceKey, params, ctx) {
  try {
    const props = { sourceKey, ...params };
    if (!props.title) delete props.title;
    return { html: renderBlockToHtml({ id: `thumb-${type}`, type, visible: true, order: 0, props, style: { margin: '0' } }, ctx) || '', error: null };
  } catch (err) {
    console.error(`ChartGallery: render of ${type} failed`, err);
    return { html: '', error: err?.message || String(err) };
  }
}

// Which data feeds each chart, so a card can say "loading" or "failed to load"
// instead of showing a misleading empty chart.
function dataKindsFor(type) {
  if (type === 'career-proficiency-bars') return ['proficiency'];
  if (['career-trend-bars', 'career-outcome-tiles', 'career-duration-timeline', 'career-skill-years-dots', 'career-industry-share'].includes(type)) return ['master'];
  if (type === 'cert-badges' || type === 'tool-usage-snapshot' || type === 'venn-overlap') return ['rollups', 'master'];
  return ['rollups'];
}
const KIND_LABEL = { master: 'Career Master', rollups: 'Career rollups', proficiency: 'Proficiency levels' };
function statusFor(type, loading, loadErrors) {
  const kinds = dataKindsFor(type);
  const failed = kinds.filter((k) => loadErrors?.[k]);
  if (failed.length) return { error: failed.map((k) => `${KIND_LABEL[k]}: ${loadErrors[k]}`).join(' · ') };
  if (kinds.some((k) => loading?.[k])) return { loading: true };
  return {};
}

// Scaled, non-interactive live render of a chart.
function Thumb({ html, height = THUMB_H, emptyNote, error, loading }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.45);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const apply = () => { const w = el.clientWidth; if (w) setScale(w / THUMB_W); };
    apply();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} style={{ ...G.thumbBox, height: height * scale }} aria-hidden="true" data-testid="chart-thumb">
      {error ? (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 1rem', textAlign: 'center', fontSize: '0.74rem', color: '#8a3b12', background: '#FFF4E5', border: '1px solid #C98320', boxSizing: 'border-box' }}>
          Could not load data for this preview. {error}
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.74rem', color: '#667', background: '#f7f8fa' }}>Loading your Career Master data…</div>
      ) : html ? (
        <div style={{ width: THUMB_W, height, transform: `scale(${scale})`, transformOrigin: 'top left', padding: '14px 18px', boxSizing: 'border-box', overflow: 'hidden', background: '#fff', color: '#1b2a3b' }}
          dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 1rem', textAlign: 'center', fontSize: '0.72rem', color: '#9aa3ad', background: '#f7f8fa' }}>
          {emptyNote || 'No data for this chart yet'}
        </div>
      )}
    </div>
  );
}

function Chips({ options, value, onPick, emptyText }) {
  if (!options.length) return <div style={{ fontSize: '0.74rem', color: '#9aa3ad' }}>{emptyText}</div>;
  return <div role="radiogroup">{options.map((o) => (
    <button type="button" key={o.value} role="radio" aria-checked={value === o.value} style={G.chip(value === o.value)} onClick={() => onPick(o.value)}>{o.label}</button>
  ))}</div>;
}

const ENTITY_OPTS = [{ value: 'all', label: 'Skills + tools' }, { value: 'skill', label: 'Skills only' }, { value: 'tool', label: 'Tools only' }];
const GROUP_OPTS = [{ value: 'entity', label: 'By individual' }, { value: 'category', label: 'By category' }, { value: 'proficiencyCategory', label: 'By how it was used' }];

// Inline tile editor for career-outcome-tiles. Empty tiles = live defaults.
function TilesEditor({ tiles, master, onChange }) {
  const live = useMemo(() => outcomeCandidates(master).slice(0, 4), [master]);
  const custom = Array.isArray(tiles) && tiles.length > 0;
  const set = (i, key, v) => onChange(tiles.map((t, j) => (j === i ? { ...t, [key]: v } : t)));
  if (!custom) {
    return (
      <div style={{ fontSize: '0.74rem', color: '#555', lineHeight: 1.5 }}>
        {live.length ? `Showing ${live.length} figure${live.length === 1 ? '' : 's'} found in your Career Master case-study metrics.` : 'No quantified metrics found in Career Master — type your own tiles.'}
        <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
          <button type="button" style={G.small} onClick={() => onChange(live.length ? live : [{ value: '', caption: '', source: '' }])}>
            {live.length ? 'Customize tiles' : '+ Add a tile'}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div>
      {tiles.map((t, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr auto', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
          <input style={G.input} placeholder="Figure e.g. $500M+" value={t.value || ''} onChange={(e) => set(i, 'value', e.target.value)} aria-label={`Tile ${i + 1} figure`} />
          <input style={G.input} placeholder="Caption" value={t.caption || ''} onChange={(e) => set(i, 'caption', e.target.value)} aria-label={`Tile ${i + 1} caption`} />
          <input style={G.input} placeholder="Footnote source" value={t.source || ''} onChange={(e) => set(i, 'source', e.target.value)} aria-label={`Tile ${i + 1} footnote source`} />
          <button type="button" style={G.small} onClick={() => onChange(tiles.filter((_, j) => j !== i))} aria-label={`Remove tile ${i + 1}`}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {tiles.length < 6 && <button type="button" style={G.small} onClick={() => onChange([...tiles, { value: '', caption: '', source: '' }])}>+ Add tile</button>}
        <button type="button" style={G.small} onClick={() => onChange([])}>Reset to live values</button>
      </div>
    </div>
  );
}

// Shared by the selected gallery card and the configured-list "Edit" panel.
function ParamEditor({ def, value, onChange, rollupCatalog, master, loadErrors, showTitle = true }) {
  const { sourceKey, params } = value;
  const setParams = (patch) => onChange({ sourceKey, params: { ...params, ...patch } });
  const options = sourceOptionsFor(def, rollupCatalog);
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'grid', gap: '0.7rem' }}>
      {(def.configure === 'proficiency' || def.configure === 'timeline' || def.configure === 'topn') && (
        <div><div style={G.label}>{def.configure === 'proficiency' ? 'Top rows' : def.configure === 'timeline' ? 'Top roles' : def.topN.label}</div>
          <input type="number" min="1" max="30" style={{ ...G.input, width: 90 }} aria-label="Top N"
            value={params.maxItems ?? ''} onChange={(e) => setParams({ maxItems: e.target.value === '' ? '' : Math.max(1, Math.min(30, Number(e.target.value))) })} /></div>
      )}
      {(def.configure === 'proficiency' || def.configure === 'tiles') && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: '#333', cursor: 'pointer' }}>
          <input type="checkbox" aria-label="Show footnote" checked={params.showFootnote !== false && params.showFootnote !== 'false'}
            onChange={(e) => setParams({ showFootnote: e.target.checked })} />
          Show footnote
        </label>
      )}
      {def.configure === 'proficiency' && (
        <>
          <div><div style={G.label}>Show</div><Chips options={ENTITY_OPTS} value={params.entityType || 'all'} onPick={(v) => setParams({ entityType: v })} /></div>
          <div><div style={G.label}>Group</div><Chips options={GROUP_OPTS} value={params.groupBy || 'entity'} onPick={(v) => setParams({ groupBy: v })} /></div>
        </>
      )}
      {def.configure === 'trend' && (
        <div><div style={G.label}>Series</div><Chips options={options} value={sourceKey || 'experience_years'} onPick={(v) => onChange({ sourceKey: v, params })} /></div>
      )}
      {def.configure === 'group' && (
        <div><div style={G.label}>Roll up</div>
          <Chips options={options} value={sourceKey} onPick={(v) => onChange({ sourceKey: v, params })} emptyText={loadErrors?.rollups ? `Could not load rollups: ${loadErrors.rollups}` : "No grouped rollups yet — add skills, roles, tools or certifications in Career Master."} /></div>
      )}
      {def.configure === 'key' && (
        <div><div style={G.label}>Headline number</div>
          <Chips options={options} value={sourceKey} onPick={(v) => onChange({ sourceKey: v, params })} emptyText={loadErrors?.rollups ? `Could not load rollups: ${loadErrors.rollups}` : "No rollup numbers yet — add Career Master data first."} /></div>
      )}
      {def.configure === 'tiles' && (
        <div><div style={G.label}>Tiles</div><TilesEditor tiles={params.tiles} master={master} onChange={(tiles) => setParams({ tiles })} /></div>
      )}
      {showTitle && (
        <div><div style={G.label}>Title (optional)</div>
          <input style={G.input} placeholder={`Default: ${def.name}`} value={params.title || ''} onChange={(e) => setParams({ title: e.target.value })} aria-label="Chart title" /></div>
      )}
    </div>
  );
}

function GalleryCard({ def, selected, onSelect, ctx, rollupCatalog, master, onAdd, loading, loadErrors }) {
  const small = def.family === 'classic';
  const [draft, setDraft] = useState(() => defaultsFor(def, rollupCatalog));
  // Classic charts need a data source; when the catalog arrives after mount,
  // fill in the first option so the thumbnail isn't blank.
  useEffect(() => {
    if ((def.configure === 'group' || def.configure === 'key') && !draft.sourceKey) {
      const first = sourceOptionsFor(def, rollupCatalog)[0]?.value;
      if (first) setDraft((d) => ({ ...d, sourceKey: first }));
    }
  }, [rollupCatalog]); // eslint-disable-line react-hooks/exhaustive-deps
  const rendered = useMemo(() => renderChart(def.type, draft.sourceKey, draft.params, ctx), [def.type, draft, ctx]);
  const status = statusFor(def.type, loading, loadErrors);
  const thumbError = status.error || (rendered.error ? `Chart failed to render: ${rendered.error}` : null);
  const needsSource = def.configure === 'group' || def.configure === 'key';
  const canAdd = !needsSource || !!draft.sourceKey;
  return (
    <div style={G.card(selected, small)} data-testid={`chart-card-${def.type}`} data-selected={selected ? 'true' : 'false'}
      role="button" tabIndex={0} aria-label={`${def.name} chart`}
      onClick={() => onSelect(def.type)} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onSelect(def.type); }}>
      <div style={selected ? { width: '46%', flexShrink: 0, borderRight: '0.5px solid rgba(0,0,0,0.08)' } : undefined}>
        <Thumb html={rendered.html} error={thumbError} loading={status.loading} height={small ? 230 : THUMB_H} emptyNote={needsSource && !draft.sourceKey ? 'Needs Career Master data to preview' : undefined} />
      </div>
      <div style={{ padding: '0.7rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: NAVY }}>{def.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#667', lineHeight: 1.45, marginTop: '0.15rem' }}>Best for: {def.bestFor}</div>
        </div>
        {selected && (
          <ParamEditor def={def} value={draft} onChange={setDraft} rollupCatalog={rollupCatalog} master={master} loadErrors={loadErrors} />
        )}
        <div style={{ marginTop: 'auto' }}>
          <button type="button" style={G.btn('gold', !canAdd)} disabled={!canAdd}
            onClick={(e) => { e.stopPropagation(); onAdd(def, draft); setDraft(defaultsFor(def, rollupCatalog)); }}
            aria-label={`Add ${def.name}`}>
            + Add
          </button>
          {!selected && <span style={{ fontSize: '0.68rem', color: '#9aa3ad', marginLeft: '0.6rem' }}>Click card to customize</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChartGallery({ items, onChange, master, rollupCatalog, proficiency, loading, loadErrors, onRefreshData }) {
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const ctx = useMemo(() => ({ master, rollupCatalog, proficiency, loadErrors: loadErrors || {} }), [master, rollupCatalog, proficiency, loadErrors]);
  const toggle = (type) => setSelected((s) => (s === type ? null : type));

  function add(def, draft) {
    const params = { ...draft.params };
    if (!params.title) params.title = def.name;
    // Outcome tiles start from the member's real quantified metrics so they
    // can be edited inline; none found => [] (renders the honest empty state).
    if (def.configure === 'tiles' && !(params.tiles || []).length) params.tiles = outcomeCandidates(master).slice(0, 4);
    const item = {
      id: `infographic-${def.type}-${Date.now()}`,
      blockType: def.type,
      sourceKey: draft.sourceKey || '',
      params,
      order: items.length,
      visible: true,
    };
    onChange([...items, item]);
    setSelected(null);
  }

  const career = CHART_CATALOG.filter((c) => c.family === 'career');
  const classic = CHART_CATALOG.filter((c) => c.family === 'classic');
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const cardProps = { ctx, rollupCatalog, master, onAdd: add, onSelect: toggle, loading, loadErrors };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={G.label}>Career charts — previews use your real Career Master data</div>
        <button type="button" style={G.small} onClick={onRefreshData} title="Re-read Career Master, rollups and proficiency">↻ Refresh data</button>
      </div>
      <div style={G.grid} data-testid="chart-gallery-career">
        {career.map((def) => <GalleryCard key={def.type} def={def} selected={selected === def.type} {...cardProps} />)}
      </div>

      <div style={G.label}>Classic charts</div>
      <div style={G.classicGrid} data-testid="chart-gallery-classic">
        {classic.map((def) => <GalleryCard key={def.type} def={def} selected={selected === def.type} {...cardProps} />)}
      </div>

      {sorted.length > 0 ? (
        <>
          <div style={G.label}>Configured Infographics — render first, before Site Sections / Case Studies / Job Experience; sequence controls order among infographics only</div>
          {sorted.map((item, idx) => {
            const def = chartDef(item.blockType);
            const reorder = (from, to) => {
              const next = [...sorted];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              onChange(next.map((it, i) => ({ ...it, order: i })));
            };
            const patch = ({ sourceKey, params }) => onChange(items.map((it) => (it.id === item.id ? { ...it, sourceKey, params } : it)));
            const opts = sourceOptionsFor(def, rollupCatalog);
            const srcLabel = item.sourceKey ? (opts.find((o) => o.value === item.sourceKey)?.label || item.sourceKey) : null;
            const editing = editingId === item.id;
            return (
              <div key={item.id} data-testid="configured-infographic" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)', padding: '0.45rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#1b2a3b' }}>{idx + 1}. {item.params?.title || def?.name || item.blockType}</div>
                    <div style={{ fontSize: '0.68rem', color: '#aaa' }}>{def?.name || item.blockType}{srcLabel ? ` · ${srcLabel}` : ''}</div>
                  </div>
                  <button type="button" style={G.small} onClick={() => setEditingId(editing ? null : item.id)} aria-label={`Edit ${item.params?.title || def?.name}`}>{editing ? 'Done' : 'Edit'}</button>
                  <button type="button" style={G.small} disabled={idx === 0} onClick={() => reorder(idx, idx - 1)} aria-label="Move up">▲</button>
                  <button type="button" style={G.small} disabled={idx === sorted.length - 1} onClick={() => reorder(idx, idx + 1)} aria-label="Move down">▼</button>
                  <button type="button" style={G.small} onClick={() => onChange(items.filter((i) => i.id !== item.id))} aria-label="Remove">✕</button>
                </div>
                {editing && (
                  <div style={{ margin: '0.6rem 0 0.3rem', padding: '0.7rem', background: '#faf8f4', borderRadius: 8 }}>
                    {def ? (
                      <ParamEditor def={def} value={{ sourceKey: item.sourceKey || '', params: item.params || {} }} onChange={patch} rollupCatalog={rollupCatalog} master={master} loadErrors={loadErrors} />
                    ) : (
                      <div style={{ fontSize: '0.74rem', color: '#888' }}>This chart type ({item.blockType}) has no editable options.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ fontSize: '0.76rem', color: '#aaa' }}>No infographics added yet. Pick a chart above and press Add.</div>
      )}
    </div>
  );
}
