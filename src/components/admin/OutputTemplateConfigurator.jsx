// OutputTemplateConfigurator — the 4-layer output template editor. One
// component serves all 5 output types (resume, proposal, case-study,
// one-pager, build-summary) via the `outputType` prop. Persists to the
// existing `output_templates` table (config JSONB, schemaVersion 2) — see
// server/routes/outputTemplates.js. Suggestion chips for layers 2/3 come
// from GET /api/career/rollups (server/lib/rollupMetrics.js).
//
// Supports multiple named presets per output type (e.g. "VP Ops — SaaS",
// "Fractional CFO — PE") tagged by role/industry and optionally exposed
// publicly via the Resume Portfolio index (Output.jsx's
// ResumePortfolioOutput, /output/resume-portfolio). A live preview pane
// renders the in-progress (unsaved) config via postMessage into an /output/*
// iframe — see useOutputTemplateConfig's previewDraft branch in Output.jsx.
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

const TABS = ['Header / Footer', 'Stat Cards', 'Infographics', 'Sections'];

const INFOGRAPHIC_TYPES = [
  { type: 'capacity-gauge', label: 'Capacity Gauge', needsSource: 'key' },
  { type: 'bar-chart-h', label: 'Bar Chart (Horizontal)', needsSource: 'group' },
  { type: 'bar-chart-v', label: 'Bar Chart (Vertical)', needsSource: 'group' },
  { type: 'venn-overlap', label: 'Overlap (Venn)', needsSource: null },
  { type: 'cert-badges', label: 'Certification Badges', needsSource: null },
  { type: 'tool-usage-snapshot', label: 'Tool & Tech Snapshot', needsSource: null },
];

// Friendly labels for the grouped rollup-key prefixes computed server-side
// (server/lib/rollupMetrics.js computeStaticRollups) — covers all six
// Career Master objects (skills, jobs, tools, case studies, certifications,
// domains). Falls back to the raw prefix for any future grouping added
// there without a matching label here.
const ROLLUP_GROUP_LABELS = {
  skills_by_category: 'Skills — by Category',
  jobs_by_industry: 'Roles — by Industry',
  tools_by_bucket: 'Tools — by Wheel Bucket',
  engagements_by_industry: 'Case Studies — by Industry',
  engagements_by_employer: 'Case Studies — by Employer',
  certifications_by_category: 'Certifications — by Category',
  certifications_by_status: 'Certifications — by Status',
  domains_by_group: 'Domains — by Group',
};

// Bar charts (Layer 3) read a GROUP of rollup rows sharing a `prefix:value`
// key (e.g. every `skills_by_category:*` row) — one bar per value. Derived
// from whatever grouped keys are actually present in the live rollup
// catalog, so a member with no certifications simply won't see a
// "Certifications — by Category" option rather than an empty chart.
function rollupGroupOptions(rollupCatalog) {
  const seen = new Map();
  for (const r of rollupCatalog?.staticRollups || []) {
    if (!r.key.includes(':')) continue;
    const prefix = r.key.split(':')[0];
    if (!seen.has(prefix)) seen.set(prefix, ROLLUP_GROUP_LABELS[prefix] || prefix);
  }
  return [...seen.entries()].map(([value, label]) => ({ value, label }));
}

// Capacity Gauge (Layer 3) reads a SINGLE rollup value by exact key —
// offers every static + delta rollup key present in the catalog.
function rollupKeyOptions(rollupCatalog) {
  const statics = (rollupCatalog?.staticRollups || []).map((r) => ({ value: r.key, label: r.label }));
  const deltas = (rollupCatalog?.deltaRollups || []).map((r) => ({ value: r.key, label: r.label }));
  return [...statics, ...deltas];
}

// Where a preview iframe should point for a given output type. Resume /
// one-pager / build-summary need no extra path segment; proposal needs a
// stable representative type slug; case-study needs a real engagement id
// (resolved once `master` has loaded — see previewPath below).
function previewBasePath(outputType) {
  if (outputType === 'proposal') return '/output/proposal/embedded-operator';
  if (outputType === 'case-study') return null; // resolved dynamically, needs an engagement id
  return `/output/${outputType}`;
}

function emptyConfig(outputType) {
  return {
    schemaVersion: 2,
    outputType,
    meta: { roleLabel: '', industryLabel: '', portfolioVisible: false },
    layer1_header: { memberTagline: '', memberFooterLines: [], memberFooterLinks: [] },
    layer2_stats: { cards: [] },
    layer3_infographics: { items: [] },
    layer4_sections: { sections: [], densityMode: 'auto' },
  };
}

// Defends against schemaVersion-2 rows saved before `meta` (or any other
// top-level key) existed in this shape — shallow-merges saved config over
// fresh defaults so older presets don't crash the UI on a missing field.
function normalizeConfig(cfg, outputType) {
  const base = emptyConfig(outputType);
  return {
    ...base,
    ...cfg,
    meta: { ...base.meta, ...(cfg.meta || {}) },
    layer1_header: { ...base.layer1_header, ...(cfg.layer1_header || {}) },
    layer2_stats: { ...base.layer2_stats, ...(cfg.layer2_stats || {}) },
    layer3_infographics: { ...base.layer3_infographics, ...(cfg.layer3_infographics || {}) },
    layer4_sections: { ...base.layer4_sections, ...(cfg.layer4_sections || {}) },
  };
}

const S = {
  wrap: { padding: '1.5rem', fontFamily: 'var(--sb-font-body)' },
  shell: { display: 'grid', gridTemplateColumns: '220px 1fr 380px', gap: '1.25rem', alignItems: 'start' },
  h1: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--sb-navy, #1b2a3b)', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#666', marginBottom: '1.5rem', maxWidth: 760 },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  tab: (on) => ({
    padding: '0.4rem 0.9rem', borderRadius: 20, border: on ? 'none' : '0.5px solid rgba(0,0,0,0.15)',
    background: on ? 'var(--sb-navy, #1b2a3b)' : 'white', color: on ? 'white' : '#444',
    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sb-font-label)',
  }),
  card: { background: 'white', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '1.1rem', marginBottom: '0.9rem' },
  label: { fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' },
  chip: (on) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: 16, margin: '0.2rem',
    border: on ? '1.5px solid var(--sb-gold, #c4843a)' : '0.5px solid rgba(0,0,0,0.15)',
    background: on ? 'rgba(196,132,58,0.08)' : 'white', fontSize: '0.76rem', cursor: 'pointer', color: '#333',
  }),
  btn: (style) => ({
    padding: '0.5rem 1.15rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em',
    background: style === 'gold' ? 'var(--sb-gold, #c4843a)' : style === 'navy' ? 'var(--sb-navy, #1b2a3b)' : 'rgba(0,0,0,0.07)',
    color: style === 'gold' || style === 'navy' ? 'white' : '#333',
  }),
  smallBtn: { padding: '0.25rem 0.55rem', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.15)', background: 'white', fontSize: '0.66rem', cursor: 'pointer', color: '#444' },
  row: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' },
  presetItem: (on) => ({
    padding: '0.6rem 0.7rem', borderRadius: 8, marginBottom: '0.4rem', cursor: 'pointer',
    background: on ? 'rgba(196,132,58,0.1)' : 'white', border: on ? '1.5px solid var(--sb-gold, #c4843a)' : '0.5px solid rgba(0,0,0,0.1)',
  }),
  previewFrame: { width: '100%', height: 640, border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, background: 'white' },
};

const OUTPUT_TYPES = [
  { id: 'resume', label: 'Resume' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'case-study', label: 'Case Study' },
  { id: 'one-pager', label: 'One-Pager' },
  { id: 'build-summary', label: 'Build Summary' },
];

// Nav-level entry point — lets the admin/member pick which of the 5 output
// types to configure, then hands off to the single OutputTemplateConfigurator
// component (parameterized by outputType) for the actual 4-layer editor.
export function OutputTemplateConfiguratorHub({ scope = 'member' }) {
  const [outputType, setOutputType] = useState('resume');
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--sb-ivory, #faf8f4)' }}>
      <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {OUTPUT_TYPES.map((t) => (
          <button key={t.id} style={S.tab(outputType === t.id)} onClick={() => setOutputType(t.id)}>{t.label}</button>
        ))}
      </div>
      <OutputTemplateConfigurator outputType={outputType} scope={scope} />
    </div>
  );
}

export default function OutputTemplateConfigurator({ outputType, scope = 'member' }) {
  const [presets, setPresets] = useState(null); // [{id, name, is_primary, config}]
  const [templateId, setTemplateId] = useState(null);
  const [config, setConfig] = useState(null);
  const [rollupCatalog, setRollupCatalog] = useState(null);
  const [sitePages, setSitePages] = useState(null);
  const [master, setMaster] = useState(null);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [newInfographic, setNewInfographic] = useState({ type: 'bar-chart-v', source: '', title: '' });
  const iframeRef = useRef(null);
  const postTimer = useRef(null);

  const ownerParam = scope === 'member' ? '?owner=me' : '';
  const memberOwnerQS = scope === 'member' ? '&owner=me' : '';

  function loadPresets(selectId) {
    fetch(`/api/output-templates?output_type=${encodeURIComponent(outputType)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.templates || []).map((t) => ({
          ...t,
          config: typeof t.config === 'string' ? JSON.parse(t.config) : t.config,
        }));
        setPresets(list);
        const pick = selectId
          ? list.find((t) => t.id === selectId)
          : list.find((t) => t.is_primary) || list[0];
        if (pick && Number(pick.config?.schemaVersion) === 2) {
          setTemplateId(pick.id);
          setConfig(normalizeConfig(pick.config, outputType));
        } else {
          setTemplateId(null);
          setConfig(emptyConfig(outputType));
        }
      })
      .catch(() => { setPresets([]); setTemplateId(null); setConfig(emptyConfig(outputType)); });
  }

  useEffect(() => {
    loadPresets();
    fetch(`/api/career/rollups${ownerParam}`, { credentials: 'include' }).then((r) => r.json()).then(setRollupCatalog).catch(() => setRollupCatalog(null));
    fetch(`/api/career/master${ownerParam}`, { credentials: 'include' }).then((r) => r.json()).then(setMaster).catch(() => setMaster(null));
    const getSite = scope === 'admin' ? api.getDraftSite : api.getMemberDraftSite;
    getSite().then((s) => setSitePages(s?.pages || null)).catch(() => setSitePages(null));
  }, [outputType, scope]);

  // ── Live preview: postMessage the in-progress config into the iframe
  // whenever it changes (debounced), so toggling a section/stat/infographic
  // shows up without saving. See Output.jsx useOutputTemplateConfig's
  // `previewDraft` branch for the receiving side.
  useEffect(() => {
    if (!config) return;
    clearTimeout(postTimer.current);
    postTimer.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ source: 'sb-output-preview', config }, window.location.origin);
    }, 300);
    return () => clearTimeout(postTimer.current);
  }, [config]);

  useEffect(() => {
    function onMessage(e) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.source === 'sb-output-preview-ready' && config) {
        iframeRef.current?.contentWindow?.postMessage({ source: 'sb-output-preview', config }, window.location.origin);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [config]);

  const basePath = previewBasePath(outputType) || (master?.engagements?.[0] ? `/output/case-study/engagement-${master.engagements[0].id}` : null);
  const previewSrc = basePath ? `${basePath}?previewDraft=1${memberOwnerQS}` : null;

  async function saveAs(makePrimary) {
    if (!config) return;
    setSaving(true);
    try {
      const name = config.meta.roleLabel || config.meta.industryLabel
        ? [config.meta.roleLabel, config.meta.industryLabel].filter(Boolean).join(' — ')
        : `${outputType} — Default`;
      const body = { output_type: outputType, name, config, is_primary: makePrimary };
      const url = templateId ? `/api/output-templates/${templateId}` : '/api/output-templates';
      const method = templateId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
      const d = await r.json();
      toast.success('Output template saved — now available to select as a preset');
      loadPresets(d.id || templateId);
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  function newPreset() {
    setTemplateId(null);
    setConfig(emptyConfig(outputType));
    setTab(0);
  }

  function duplicatePreset() {
    if (!config) return;
    setTemplateId(null);
    setConfig({ ...structuredClone(config), meta: { ...config.meta, roleLabel: config.meta.roleLabel ? `${config.meta.roleLabel} (copy)` : '' } });
  }

  async function deletePreset() {
    if (!templateId) return;
    if (!confirm('Delete this preset? This cannot be undone.')) return;
    await fetch(`/api/output-templates/${templateId}`, { method: 'DELETE', credentials: 'include' });
    toast.success('Preset deleted');
    loadPresets();
  }

  if (!config || !presets) return <div style={S.wrap}>Loading…</div>;

  const update = (path, value) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      let obj = next;
      const parts = path.split('.');
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const allSections = [];
  if (sitePages) {
    for (const [pageKey, page] of Object.entries(sitePages)) {
      if (pageKey === '_placeholders') continue;
      (page.sections || []).forEach((sec) => {
        allSections.push({ pageKey, pageName: page.name || pageKey, sectionId: sec.id, sectionName: sec.name || sec.type });
      });
    }
  }
  const placeholderSections = (sitePages?.['_placeholders']?.sections || []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--sb-ivory, #faf8f4)' }}>
      <div style={S.wrap}>
        <div style={S.h1}>Output Template — {outputType}</div>
        <div style={S.sub}>
          Pick which Career Master data feeds this output's header/footer, stat cards, infographics, and content sections.
          The Salt Basin copyright footer always renders and can never be changed here — your own footer is added below it.
          Changes preview live on the right; Save makes the preset selectable.
        </div>

        <div style={S.shell}>
          {/* ── Preset list ── */}
          <div>
            <div style={S.label}>Presets</div>
            <button style={{ ...S.btn('outline'), width: '100%', marginBottom: '0.6rem' }} onClick={newPreset}>+ New Preset</button>
            {presets.map((p) => (
              <div key={p.id} style={S.presetItem(p.id === templateId)} onClick={() => loadPresets(p.id)}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1b2a3b' }}>{p.name}</div>
                <div style={{ fontSize: '0.66rem', color: '#888', marginTop: 2 }}>
                  {p.is_primary ? 'Primary' : ''}
                  {p.config?.meta?.portfolioVisible ? ' · Portfolio' : ''}
                </div>
              </div>
            ))}
            {presets.length === 0 && <div style={{ fontSize: '0.76rem', color: '#aaa' }}>No presets yet — configure below and save.</div>}
          </div>

          {/* ── Editor ── */}
          <div>
            <div style={S.card}>
              <div style={S.label}>Preset Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input style={S.input} placeholder="Role (e.g. VP Revenue Ops)" value={config.meta.roleLabel}
                  onChange={(e) => update('meta.roleLabel', e.target.value)} />
                <input style={S.input} placeholder="Industry (e.g. SaaS, Manufacturing)" value={config.meta.industryLabel}
                  onChange={(e) => update('meta.industryLabel', e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#333', cursor: 'pointer' }}>
                <input type="checkbox" checked={config.meta.portfolioVisible} onChange={(e) => update('meta.portfolioVisible', e.target.checked)} />
                Show in public Resume Portfolio (View Portfolio page)
              </label>
            </div>

            <div style={S.tabs}>
              {TABS.map((t, i) => (
                <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
              ))}
            </div>

            {tab === 0 && (
              <div style={S.card}>
                <div style={S.label}>Header Tagline (suggested from Career Master job history)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {(master?.jobs || []).map((j) => j.jobFunction).filter((v, i, a) => v && a.indexOf(v) === i).map((tagline) => (
                    <span key={tagline} style={S.chip(config.layer1_header.memberTagline === tagline)}
                      onClick={() => update('layer1_header.memberTagline', tagline)}>
                      {tagline}
                    </span>
                  ))}
                </div>
                <input style={S.input} value={config.layer1_header.memberTagline}
                  onChange={(e) => update('layer1_header.memberTagline', e.target.value)}
                  placeholder="Custom tagline…" />

                <div style={{ ...S.label, marginTop: '1.25rem' }}>
                  Your Footer (appended below the locked Salt Basin copyright footer — never replaces it)
                </div>
                <textarea
                  style={{ ...S.input, minHeight: 70, resize: 'vertical' }}
                  value={(config.layer1_header.memberFooterLines || []).join('\n')}
                  onChange={(e) => update('layer1_header.memberFooterLines', e.target.value.split('\n'))}
                  placeholder="One line per row — e.g. your firm name, license number, contact line"
                />
              </div>
            )}

            {tab === 1 && (
              <div style={S.card}>
                <div style={S.label}>Suggested Rollup Counts</div>
                {(rollupCatalog?.staticRollups || []).map((r) => {
                  const selected = config.layer2_stats.cards.some((c) => c.metricKey === r.key && c.kind === 'rollup');
                  return (
                    <span key={r.key} style={S.chip(selected)} onClick={() => {
                      const cards = selected
                        ? config.layer2_stats.cards.filter((c) => !(c.metricKey === r.key && c.kind === 'rollup'))
                        : [...config.layer2_stats.cards, { id: `stat-${r.key}`, kind: 'rollup', metricKey: r.key, label: r.label, order: config.layer2_stats.cards.length, visible: true }];
                      update('layer2_stats.cards', cards);
                    }}>
                      {r.label} · {r.value}
                    </span>
                  );
                })}
                <div style={{ ...S.label, marginTop: '1.25rem' }}>Suggested Change-Over-Time Metrics</div>
                {(rollupCatalog?.deltaRollups || []).map((r) => {
                  const selected = config.layer2_stats.cards.some((c) => c.metricKey === r.key && c.kind === 'delta');
                  return (
                    <span key={r.key} style={S.chip(selected)} onClick={() => {
                      const cards = selected
                        ? config.layer2_stats.cards.filter((c) => !(c.metricKey === r.key && c.kind === 'delta'))
                        : [...config.layer2_stats.cards, { id: `delta-${r.key}`, kind: 'delta', metricKey: r.key, label: r.label, order: config.layer2_stats.cards.length, visible: true }];
                      update('layer2_stats.cards', cards);
                    }}>
                      {r.label} {r.change ? `(${r.change})` : ''}
                    </span>
                  );
                })}
                {!rollupCatalog && <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Loading Career Master rollups…</div>}
              </div>
            )}

            {tab === 2 && (
              <div style={S.card}>
                <div style={S.label}>+ Add Infographic</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <select
                    value={newInfographic.type}
                    onChange={(e) => setNewInfographic((p) => ({ ...p, type: e.target.value, source: '' }))}
                    style={{ padding: '0.5rem 0.7rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem' }}
                  >
                    {INFOGRAPHIC_TYPES.map((it) => <option key={it.type} value={it.type}>{it.label}</option>)}
                  </select>
                  <input
                    style={S.input}
                    placeholder="Title (optional)"
                    value={newInfographic.title}
                    onChange={(e) => setNewInfographic((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                {(() => {
                  const typeDef = INFOGRAPHIC_TYPES.find((it) => it.type === newInfographic.type);
                  if (!typeDef?.needsSource) return null;
                  const options = typeDef.needsSource === 'group' ? rollupGroupOptions(rollupCatalog) : rollupKeyOptions(rollupCatalog);
                  return (
                    <select
                      value={newInfographic.source}
                      onChange={(e) => setNewInfographic((p) => ({ ...p, source: e.target.value }))}
                      style={{ padding: '0.5rem 0.7rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem', width: '100%', marginBottom: '0.6rem' }}
                    >
                      <option value="">— Select which Career Master data rolls up into this infographic —</option>
                      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  );
                })()}
                <button
                  style={S.btn('outline')}
                  disabled={!!INFOGRAPHIC_TYPES.find((it) => it.type === newInfographic.type)?.needsSource && !newInfographic.source}
                  onClick={() => {
                    const typeDef = INFOGRAPHIC_TYPES.find((it) => it.type === newInfographic.type);
                    const item = {
                      id: `infographic-${newInfographic.type}-${Date.now()}`,
                      blockType: newInfographic.type,
                      sourceKey: newInfographic.source || '',
                      params: { title: newInfographic.title || typeDef.label },
                      order: config.layer3_infographics.items.length,
                      visible: true,
                    };
                    update('layer3_infographics.items', [...config.layer3_infographics.items, item]);
                    setNewInfographic({ type: 'bar-chart-v', source: '', title: '' });
                  }}
                >
                  + Add
                </button>

                <div style={{ fontSize: '0.75rem', color: '#888', margin: '0.9rem 0', lineHeight: 1.6 }}>
                  Bar charts and the capacity gauge read from a Career Master rollup you pick — skills, roles, tools, case studies, certifications, or domains. Certification badges pull finance/banking/accounting/investing certs marked in Career Master. Tool & Tech Snapshot reflects actual engagement usage. Overlap (Venn), Certification Badges, and Tool & Tech Snapshot always read their own fixed rollup — no source to pick.
                </div>
                {!rollupCatalog && <div style={{ fontSize: '0.76rem', color: '#aaa', marginBottom: '0.75rem' }}>Loading Career Master rollups…</div>}

                {config.layer3_infographics.items.length > 0 ? (
                  <>
                    <div style={S.label}>
                      Configured Infographics — render first, before Site Sections / Case Studies / Job Experience; sequence controls order among infographics only
                    </div>
                    {[...config.layer3_infographics.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((item, idx, sorted) => {
                      const typeDef = INFOGRAPHIC_TYPES.find((t) => t.type === item.blockType);
                      const sourceOptions = typeDef?.needsSource === 'group' ? rollupGroupOptions(rollupCatalog) : typeDef?.needsSource === 'key' ? rollupKeyOptions(rollupCatalog) : [];
                      const sourceLabel = item.sourceKey ? (sourceOptions.find((o) => o.value === item.sourceKey)?.label || item.sourceKey) : null;
                      const reorder = (from, to) => {
                        const next = [...sorted];
                        const [moved] = next.splice(from, 1);
                        next.splice(to, 0, moved);
                        update('layer3_infographics.items', next.map((it, i) => ({ ...it, order: i })));
                      };
                      const remove = () => update('layer3_infographics.items', config.layer3_infographics.items.filter((i) => i.id !== item.id));
                      return (
                        <div key={item.id} style={S.row}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: '#1b2a3b' }}>{idx + 1}. {item.params?.title || typeDef?.label}</div>
                            <div style={{ fontSize: '0.68rem', color: '#aaa' }}>{typeDef?.label}{sourceLabel ? ` · ${sourceLabel}` : ''}</div>
                          </div>
                          <button style={S.smallBtn} disabled={idx === 0} onClick={() => reorder(idx, idx - 1)}>▲</button>
                          <button style={S.smallBtn} disabled={idx === sorted.length - 1} onClick={() => reorder(idx, idx + 1)}>▼</button>
                          <button style={S.smallBtn} onClick={remove}>✕</button>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: '#aaa' }}>No infographics added yet.</div>
                )}
              </div>
            )}

            {tab === 3 && (
              <div style={S.card}>
                <div style={S.label}>Site Sections</div>
                {allSections.map((sec) => {
                  const key = `site:${sec.pageKey}:${sec.sectionId}`;
                  const selected = config.layer4_sections.sections.some((s) => s.sourceType === 'site_section' && s.pageKey === sec.pageKey && s.sectionId === sec.sectionId);
                  return (
                    <div key={key} style={S.row}>
                      <input type="checkbox" checked={selected} onChange={() => {
                        const sections = selected
                          ? config.layer4_sections.sections.filter((s) => !(s.sourceType === 'site_section' && s.pageKey === sec.pageKey && s.sectionId === sec.sectionId))
                          : [...config.layer4_sections.sections, { id: key, sourceType: 'site_section', pageKey: sec.pageKey, sectionId: sec.sectionId, order: config.layer4_sections.sections.length, visible: true }];
                        update('layer4_sections.sections', sections);
                      }} />
                      <span>{sec.sectionName} <span style={{ color: '#aaa', fontSize: '0.7rem' }}>({sec.pageName})</span></span>
                    </div>
                  );
                })}

                <div style={{ ...S.label, marginTop: '1.25rem' }}>Case Studies (Career Master — Case Study Registry)</div>
                {(master?.engagements || []).map((eng) => {
                  const key = `case:${eng.id}`;
                  const selected = config.layer4_sections.sections.some((s) => s.sourceType === 'case_study_engagement' && String(s.engagementId) === String(eng.id));
                  return (
                    <div key={key} style={S.row}>
                      <input type="checkbox" checked={selected} onChange={() => {
                        const sections = selected
                          ? config.layer4_sections.sections.filter((s) => !(s.sourceType === 'case_study_engagement' && String(s.engagementId) === String(eng.id)))
                          : [...config.layer4_sections.sections, { id: key, sourceType: 'case_study_engagement', engagementId: eng.id, order: config.layer4_sections.sections.length, visible: true }];
                        update('layer4_sections.sections', sections);
                      }} />
                      <span>{eng.clientDisplayName || eng.name} <span style={{ color: '#aaa', fontSize: '0.7rem' }}>({[eng.employer, eng.industry].filter(Boolean).join(' · ')})</span></span>
                    </div>
                  );
                })}
                {(!master?.engagements || master.engagements.length === 0) && (
                  <div style={{ fontSize: '0.76rem', color: '#aaa' }}>No case studies published yet — mark an engagement "Publish as Case Study" in Career Master.</div>
                )}

                <div style={{ ...S.label, marginTop: '1.25rem' }}>Job Experience — proficiency qualifiers + activities per role</div>
                {(master?.jobs || []).map((job) => {
                  const key = `job:${job.id}`;
                  const selected = config.layer4_sections.sections.some((s) => s.sourceType === 'job_experience' && String(s.jobId) === String(job.id));
                  return (
                    <div key={key} style={S.row}>
                      <input type="checkbox" checked={selected} onChange={() => {
                        const sections = selected
                          ? config.layer4_sections.sections.filter((s) => !(s.sourceType === 'job_experience' && String(s.jobId) === String(job.id)))
                          : [...config.layer4_sections.sections, { id: key, sourceType: 'job_experience', jobId: job.id, order: config.layer4_sections.sections.length, visible: true, density: { minLines: 3, maxLines: 8, expandable: true } }];
                        update('layer4_sections.sections', sections);
                      }} />
                      <span>{job.title} <span style={{ color: '#aaa', fontSize: '0.7rem' }}>({job.company})</span></span>
                    </div>
                  );
                })}

                {placeholderSections.length > 0 && (
                  <>
                    <div style={{ ...S.label, marginTop: '1.25rem' }}>Custom Sections (not on any public page)</div>
                    {placeholderSections.map((sec) => {
                      const key = `custom:${sec.id}`;
                      const selected = config.layer4_sections.sections.some((s) => s.sourceType === 'custom_placeholder' && s.customSectionId === sec.id);
                      return (
                        <div key={key} style={S.row}>
                          <input type="checkbox" checked={selected} onChange={() => {
                            const sections = selected
                              ? config.layer4_sections.sections.filter((s) => !(s.sourceType === 'custom_placeholder' && s.customSectionId === sec.id))
                              : [...config.layer4_sections.sections, { id: key, sourceType: 'custom_placeholder', customSectionId: sec.id, order: config.layer4_sections.sections.length, visible: true }];
                            update('layer4_sections.sections', sections);
                          }} />
                          <span>{sec.name || sec.fields?.heading || 'Untitled custom section'}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.3rem' }}>
                    {outputType === 'resume' ? 'Density mode — auto-fills the page so it never has dead white space' : 'Density mode'}
                  </label>
                  <select value={config.layer4_sections.densityMode} onChange={(e) => update('layer4_sections.densityMode', e.target.value)}
                    style={{ padding: '0.4rem 0.7rem', borderRadius: 7, border: '0.5px solid rgba(0,0,0,0.18)', fontSize: '0.8rem' }}>
                    <option value="auto">Auto (expand/collapse to fill page)</option>
                    <option value="fixed">Fixed (render exactly as selected)</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button style={S.btn('navy')} onClick={() => saveAs(true)} disabled={saving}>{saving ? 'Saving…' : 'Save & Set Primary'}</button>
              <button style={S.btn('outline')} onClick={() => saveAs(false)} disabled={saving}>Save as Named Preset</button>
              <button style={S.smallBtn} onClick={duplicatePreset}>Duplicate</button>
              {templateId && <button style={S.smallBtn} onClick={deletePreset}>Delete</button>}
            </div>
          </div>

          {/* ── Live preview ── */}
          <div>
            <div style={S.label}>Live Preview</div>
            {previewSrc ? (
              <iframe ref={iframeRef} src={previewSrc} style={S.previewFrame} title="Output preview" />
            ) : (
              <div style={{ ...S.previewFrame, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>
                Preview unavailable — no case study to preview against yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
