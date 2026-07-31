// Output block system — machine-readable block configs that drive all rendered outputs.
// Blocks are stored as JSON in the DB and rendered to HTML via renderTemplateToHtml().
// The same system drives HERQ outputs, resume, case study, one-pagers, and future outputs.
import { ICONS, ICON_VIEWBOX } from './brandIconData.js';

// Static (non-interactive) inline SVG for the output-doc renderer — same
// geometry as src/lib/brandIcons.jsx, but a plain string since output docs
// are print-safe static HTML, not React. No hover/sketch-filter variant here.
function iconSvg(name, color, size = 22) {
  const icon = ICONS[name];
  if (!icon) return '';
  const paths = icon.paths.map((d) => `<path d="${d}" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`).join('');
  const circles = (icon.circles || []).map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" stroke="${color}" stroke-width="1.75" fill="none"/>`).join('');
  return `<svg viewBox="${ICON_VIEWBOX}" width="${size}" height="${size}" fill="none">${paths}${circles}</svg>`;
}

const OUTPUT_ACCENT_SWATCH = { gold: '#C4843A', teal: '#4A7C8E', pink: '#E8407A', sage: '#B5C4C1' };

export const BLOCK_DEFS = {
  'exec-kpi-dashboard': {
    label: 'Executive Summary (KPI Dashboard)', icon: '◫',
    defaultProps: {},
    defaultStyle: {},
    // No editable fields — this block pulls its 6 KPI tiles and capability
    // confidence bars live from Career Master (ctx.execKpis /
    // ctx.capabilityMeters), computed the same way as the live resume
    // layouts. Add/remove/reorder it like any other block; the numbers
    // always reflect current Career Master data.
    fields: [],
  },
  'page-header': {
    label: 'Page Header', icon: '⬛',
    defaultProps: { eyebrow: '', title: 'Document Title', subtitle: '' },
    defaultStyle: { background: '#1B2A3B', color: '#F5EDD8', padding: '3rem 2.5rem 2.5rem', textAlign: 'center' },
    fields: [
      { key: 'props.eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'props.title', label: 'Title', type: 'text' },
      { key: 'props.subtitle', label: 'Subtitle', type: 'text' },
      { key: 'style.background', label: 'Background', type: 'color' },
      { key: 'style.color', label: 'Text Color', type: 'color' },
      { key: 'style.textAlign', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
    ],
  },
  'color-band': {
    label: 'Color Band', icon: '▬',
    defaultProps: {},
    defaultStyle: { background: '#C4843A', height: '4px', margin: '0' },
    fields: [
      { key: 'style.background', label: 'Color', type: 'color' },
      { key: 'style.height', label: 'Height', type: 'text' },
    ],
  },
  'section-label': {
    label: 'Section Label', icon: '◈',
    defaultProps: { text: 'SECTION' },
    defaultStyle: { fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4843A', fontFamily: 'sans-serif', paddingTop: '2rem', paddingBottom: '0.4rem', borderBottom: '0.5px solid rgba(196,132,58,0.3)', marginBottom: '0.75rem' },
    fields: [
      { key: 'props.text', label: 'Label Text', type: 'text' },
      { key: 'style.color', label: 'Color', type: 'color' },
      { key: 'style.letterSpacing', label: 'Letter Spacing', type: 'text' },
    ],
  },
  'heading': {
    label: 'Heading', icon: 'H',
    defaultProps: { text: 'Heading', level: 1 },
    defaultStyle: { fontSize: '1.35rem', color: '#1B2A3B', fontFamily: 'Georgia, serif', fontWeight: 700, padding: '0.5rem 0 0.2rem', margin: '0' },
    fields: [
      { key: 'props.text', label: 'Text', type: 'textarea' },
      { key: 'props.level', label: 'Level', type: 'select', options: [1, 2, 3] },
      { key: 'style.fontSize', label: 'Font Size', type: 'text' },
      { key: 'style.color', label: 'Color', type: 'color' },
      { key: 'style.fontFamily', label: 'Font', type: 'select', options: ['Georgia, serif', 'sans-serif', 'monospace'] },
    ],
  },
  'body': {
    label: 'Body Text', icon: '¶',
    defaultProps: { text: 'Body text here.' },
    defaultStyle: { fontSize: '0.88rem', color: '#2d3748', lineHeight: '1.75', padding: '0.2rem 0', margin: '0' },
    fields: [
      { key: 'props.text', label: 'Text', type: 'textarea' },
      { key: 'style.fontSize', label: 'Font Size', type: 'text' },
      { key: 'style.color', label: 'Color', type: 'color' },
      { key: 'style.lineHeight', label: 'Line Height', type: 'text' },
      { key: 'style.fontFamily', label: 'Font', type: 'select', options: ['Georgia, serif', 'sans-serif', 'monospace'] },
    ],
  },
  'callout': {
    label: 'Callout Box', icon: '◎',
    defaultProps: { text: 'Key insight or callout text.' },
    defaultStyle: { background: 'rgba(196,132,58,0.07)', border: '0.5px solid rgba(196,132,58,0.35)', borderLeft: '3px solid #C4843A', borderRadius: '2px', padding: '1rem 1.25rem', margin: '0.75rem 0', fontSize: '0.9rem', color: '#1B2A3B', lineHeight: '1.65', fontStyle: 'italic' },
    fields: [
      { key: 'props.text', label: 'Text', type: 'textarea' },
      { key: 'style.background', label: 'Background', type: 'color' },
      { key: 'style.borderLeft', label: 'Left Border', type: 'text' },
      { key: 'style.color', label: 'Text Color', type: 'color' },
      { key: 'style.fontStyle', label: 'Style', type: 'select', options: ['italic', 'normal'] },
    ],
  },
  'bullet-list': {
    label: 'Bullet List', icon: '·',
    defaultProps: { items: ['Item one', 'Item two', 'Item three'] },
    defaultStyle: { fontSize: '0.88rem', color: '#2d3748', lineHeight: '1.7', paddingLeft: '1.5rem', margin: '0.25rem 0' },
    fields: [
      { key: 'props.items', label: 'Items (one per line)', type: 'items' },
      { key: 'style.fontSize', label: 'Font Size', type: 'text' },
      { key: 'style.color', label: 'Color', type: 'color' },
    ],
  },
  'experience-block': {
    label: 'Experience Block', icon: '◷',
    defaultProps: { company: 'Company Name', title: 'Job Title', dates: 'Jan 2020 – Present', bullets: ['Achievement or responsibility one.', 'Achievement or responsibility two.'] },
    defaultStyle: { marginBottom: '1.5rem' },
    fields: [
      { key: 'props.company', label: 'Company', type: 'text' },
      { key: 'props.title', label: 'Job Title', type: 'text' },
      { key: 'props.dates', label: 'Dates', type: 'text' },
      { key: 'props.bullets', label: 'Bullets (one per line)', type: 'items' },
    ],
  },
  'key-value': {
    label: 'Key / Value Pairs', icon: '::',
    defaultProps: { pairs: [{ key: 'Label', value: 'Value' }] },
    defaultStyle: { fontSize: '0.82rem', color: '#2d3748', lineHeight: '1.6' },
    fields: [
      { key: 'props.pairs', label: 'Pairs', type: 'pairs' },
      { key: 'style.fontSize', label: 'Font Size', type: 'text' },
      { key: 'style.color', label: 'Color', type: 'color' },
    ],
  },
  'two-column': {
    label: 'Two Column', icon: '⊞',
    defaultProps: { leftLabel: 'Left', rightLabel: 'Right', leftText: '', rightText: '' },
    defaultStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', padding: '0.5rem 0', alignItems: 'start' },
    fields: [
      { key: 'props.leftLabel', label: 'Left Label', type: 'text' },
      { key: 'props.leftText', label: 'Left Content', type: 'textarea' },
      { key: 'props.rightLabel', label: 'Right Label', type: 'text' },
      { key: 'props.rightText', label: 'Right Content', type: 'textarea' },
      { key: 'style.gap', label: 'Column Gap', type: 'text' },
    ],
  },
  'hr': {
    label: 'Divider', icon: '—',
    defaultProps: {},
    defaultStyle: { border: 'none', borderTop: '0.5px solid rgba(196,132,58,0.25)', margin: '1.25rem 0' },
    fields: [
      { key: 'style.borderTop', label: 'Border Style', type: 'text' },
      { key: 'style.margin', label: 'Margin', type: 'text' },
    ],
  },
  'spacer': {
    label: 'Spacer', icon: '↕',
    defaultProps: { height: '1.5rem' },
    defaultStyle: {},
    fields: [
      { key: 'props.height', label: 'Height', type: 'text' },
    ],
  },
  'herq-question': {
    label: 'HERQ Question', icon: '❓',
    defaultProps: { question: 'What is the real question in the room?', series: 'HERQ', context: '' },
    defaultStyle: { background: '#F5F0E8', borderLeft: '3px solid #E8407A', borderRadius: '2px', padding: '1.25rem 1.5rem', margin: '1rem 0', fontSize: '1rem', color: '#1B2A3B', lineHeight: '1.65', fontFamily: 'Georgia, serif' },
    fields: [
      { key: 'props.question', label: 'Question', type: 'textarea' },
      { key: 'props.series', label: 'Series Label', type: 'text' },
      { key: 'props.context', label: 'Context Note', type: 'textarea' },
      { key: 'style.borderLeft', label: 'Accent Border', type: 'text' },
      { key: 'style.background', label: 'Background', type: 'color' },
    ],
  },
  'contact-line': {
    label: 'Contact Line', icon: '@',
    defaultProps: { items: ['email@example.com', 'City, State', 'linkedin.com/in/handle'] },
    defaultStyle: { fontSize: '0.8rem', color: '#8b9bae', fontFamily: 'sans-serif', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0' },
    fields: [
      { key: 'props.items', label: 'Items (one per line)', type: 'items' },
      { key: 'style.color', label: 'Color', type: 'color' },
      { key: 'style.fontSize', label: 'Font Size', type: 'text' },
    ],
  },

  // ── Layer 2 stat/metric cards — resolved by buildBlocksFromLayerConfig()
  // before render (props.cards is a pre-resolved array, not raw catalog
  // lookups, since which cards + labels/order came from the member's config).
  'stat-cards': {
    label: 'Stat Cards', icon: '▣',
    defaultProps: { cards: [] },
    defaultStyle: {},
    fields: [],
  },

  // ── Layer 3 infographics — data-driven from ctx.rollupCatalog, no editable
  // fields (mirrors 'exec-kpi-dashboard'). See server/lib/rollupMetrics.js
  // for the shapes these read (staticRollups/deltaRollups/toolUsage/
  // certBadges/overlaps). props.sourceKey selects which catalog entry (or
  // entries) a given block instance renders.
  'capacity-gauge': {
    label: 'Capacity Gauge', icon: '◐',
    defaultProps: { sourceKey: '' },
    defaultStyle: {},
    fields: [{ key: 'props.sourceKey', label: 'Metric Key', type: 'text' }],
  },
  'bar-chart-h': {
    label: 'Bar Chart (Horizontal)', icon: '▤',
    defaultProps: { sourceKey: '', title: '' },
    defaultStyle: {},
    fields: [
      { key: 'props.sourceKey', label: 'Rollup Group Prefix', type: 'text' },
      { key: 'props.title', label: 'Title', type: 'text' },
    ],
  },
  'bar-chart-v': {
    label: 'Bar Chart (Vertical)', icon: '▥',
    defaultProps: { sourceKey: '', title: '' },
    defaultStyle: {},
    fields: [
      { key: 'props.sourceKey', label: 'Rollup Group Prefix', type: 'text' },
      { key: 'props.title', label: 'Title', type: 'text' },
    ],
  },
  'venn-overlap': {
    label: 'Overlap (Venn)', icon: '◍',
    defaultProps: { title: 'Capability Overlap' },
    defaultStyle: {},
    fields: [{ key: 'props.title', label: 'Title', type: 'text' }],
  },
  'cert-badges': {
    label: 'Certification Badges', icon: '◆',
    defaultProps: { title: 'Certifications' },
    defaultStyle: {},
    fields: [{ key: 'props.title', label: 'Title', type: 'text' }],
  },
  'tool-usage-snapshot': {
    label: 'Tool & Tech Snapshot', icon: '▦',
    defaultProps: { title: 'Tools & Technology' },
    defaultStyle: {},
    fields: [{ key: 'props.title', label: 'Title', type: 'text' }],
  },

  // ── Smart-art graphics — same data shape and icon set as the website's
  // cascadeFlow / accentStatCards / architectureSteps blocks
  // (src/components/blocks/index.jsx REGISTRY), rendered here as static
  // print-safe HTML instead of interactive React (no hover/click state —
  // output docs are printed/exported, not browsed).
  'accent-stat-cards': {
    label: 'Accent Stat Cards', icon: '▣',
    defaultProps: {
      statCards: [
        { icon: 'exit', value: '$4.6B', label: 'Exit Value', caption: 'One-line context for this stat.', source: 'Source, Year', accent: 'gold' },
        { icon: 'pipeline', value: '$500M+', label: 'Revenue Automated', caption: 'One-line context for this stat.', source: 'Source, Year', accent: 'teal' },
        { icon: 'portfolio', value: '4', label: 'Portfolio Transformations', caption: 'One-line context for this stat.', source: 'Source, Year', accent: 'pink' },
      ],
    },
    defaultStyle: { margin: '0.75rem 0' },
    fields: [{
      key: 'props.statCards', label: 'Stat Cards', type: 'cardList', itemLabel: 'Stat Card',
      itemFields: [
        { key: 'icon', label: 'Icon', placeholder: 'e.g. exit, graph, shield', half: true },
        { key: 'accent', label: 'Accent', placeholder: 'gold / teal / pink / sage', half: true },
        { key: 'value', label: 'Value', placeholder: 'e.g. $4.6B, 142%' },
        { key: 'label', label: 'Label', placeholder: 'Label' },
        { key: 'caption', label: 'Caption', placeholder: 'One-line context', long: true },
        { key: 'source', label: 'Source', placeholder: 'Citation (optional)' },
      ],
    }],
  },
  'cascade-flow': {
    label: 'Cascade Flow', icon: '➡️',
    defaultProps: {
      cascadeSteps: [
        { icon: 'magnifier', title: 'Step one', description: 'What happens first.', accent: 'teal' },
        { icon: 'graph', title: 'Step two', description: 'What happens next.', accent: 'gold' },
        { icon: 'shield', title: 'Step three', description: 'The consequence.', accent: 'pink' },
      ],
      summary: 'We intervene at step one — before the cascade starts.',
      summaryIcon: 'compass',
    },
    defaultStyle: { margin: '0.75rem 0' },
    fields: [
      {
        key: 'props.cascadeSteps', label: 'Cascade Steps', type: 'cardList', itemLabel: 'Step',
        itemFields: [
          { key: 'icon', label: 'Icon', placeholder: 'e.g. magnifier, graph', half: true },
          { key: 'accent', label: 'Accent', placeholder: 'gold / teal / pink / sage', half: true },
          { key: 'title', label: 'Title', placeholder: 'Step title' },
          { key: 'description', label: 'Description', placeholder: 'What happens in this step', long: true },
        ],
      },
      { key: 'props.summary', label: 'Summary Callout', type: 'textarea' },
      { key: 'props.summaryIcon', label: 'Summary Icon', type: 'text' },
    ],
  },
  'architecture-steps': {
    label: 'Architecture Steps', icon: '🔢',
    defaultProps: {
      steps: [
        { title: 'Step one title', description: 'What happens in this step.' },
        { title: 'Step two title', description: 'What happens in this step.' },
        { title: 'Step three title', description: 'What happens in this step.' },
      ],
    },
    defaultStyle: { margin: '0.75rem 0' },
    fields: [{
      key: 'props.steps', label: 'Steps', type: 'cardList', itemLabel: 'Step',
      itemFields: [
        { key: 'title', label: 'Title', placeholder: 'Step title' },
        { key: 'description', label: 'Description', placeholder: 'What happens in this step', long: true },
      ],
    }],
  },
};

// ── Renderer ──────────────────────────────────────────────────────────────────

function styleStr(obj) {
  return Object.entries(obj || {})
    .map(([k, v]) => `${k.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

// Simple {{key}} template substitution against a flat or nested context
function interpolate(text, ctx) {
  if (!text || !ctx) return text || '';
  return String(text).replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const val = path.trim().split('.').reduce((o, k) => (o != null ? o[k] : ''), ctx);
    return val != null ? val : '';
  });
}

export function renderBlockToHtml(block, ctx = {}) {
  if (block.visible === false) return '';
  const def = BLOCK_DEFS[block.type];
  const s = { ...(def?.defaultStyle || {}), ...(block.style || {}) };
  const p = { ...(def?.defaultProps || {}), ...(block.props || {}) };

  const ip = (v) => interpolate(v, ctx); // interpolate a prop value

  switch (block.type) {
    case 'exec-kpi-dashboard': {
      const kpis = Array.isArray(ctx.execKpis) ? ctx.execKpis : [];
      const meters = Array.isArray(ctx.capabilityMeters) ? ctx.capabilityMeters : [];
      if (!kpis.length) return '';
      const tileHtml = kpis.map((k) => `
        <div style="background:#EEF2F6;border-radius:10px;padding:1rem 0.9rem;text-align:center">
          <div style="font-size:1.7rem;font-weight:700;color:#172A45;font-family:Georgia,serif;line-height:1.15">${ip(k.value)}</div>
          <div style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:${k.accent || '#C4843A'};font-weight:700;margin-top:0.4rem;font-family:sans-serif">${ip(k.label)}</div>
          ${k.note ? `<div style="font-size:0.66rem;color:#536173;margin-top:0.2rem;line-height:1.4">${ip(k.note)}</div>` : ''}
        </div>`).join('');
      const meterHtml = meters.map((c) => `
        <div style="margin-bottom:0.8rem">
          <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:0.76rem;margin-bottom:0.25rem">
            <span style="font-weight:700;color:#172A45">${ip(c.name)}</span>
            <span style="color:#536173;font-size:0.66rem">${ip(c.evidence)}</span>
          </div>
          <div style="height:6px;background:#EEF2F6;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${c.pct}%;background:${c.color || '#4A7C8E'};border-radius:3px"></div>
          </div>
        </div>`).join('');
      return `<div style="${styleStr(s)}">
  <div style="font-size:0.6rem;letter-spacing:0.24em;text-transform:uppercase;color:#172A45;font-family:Georgia,serif;font-weight:700;margin-bottom:0.75rem;padding-bottom:0.25rem;border-bottom:1px solid #C4843A">Executive Summary</div>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0.6rem;margin-bottom:1.25rem">${tileHtml}</div>
  ${meters.length ? `<div style="background:#F7F2E8;border-radius:10px;padding:1rem 1.1rem">
    <div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:#536173;margin-bottom:0.6rem;font-family:sans-serif">Capability Confidence</div>
    ${meterHtml}
  </div>` : ''}
</div>`;
    }

    case 'page-header':
      return `<div style="${styleStr(s)}">
  ${p.eyebrow ? `<div style="font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#C4843A;font-family:sans-serif;margin-bottom:0.6rem">${ip(p.eyebrow)}</div>` : ''}
  <div style="font-size:2rem;font-family:Georgia,serif;font-weight:300;margin-bottom:0.4rem;line-height:1.2">${ip(p.title)}</div>
  ${p.subtitle ? `<div style="font-size:0.9rem;opacity:0.8;margin-top:0.25rem;font-family:sans-serif;font-weight:300">${ip(p.subtitle)}</div>` : ''}
</div>`;

    case 'color-band':
      return `<div style="${styleStr(s)}"></div>`;

    case 'section-label':
      return `<div style="${styleStr(s)}">${ip(p.text)}</div>`;

    case 'heading': {
      const lvl = p.level || 1;
      const fallbackSize = lvl === 1 ? '1.4rem' : lvl === 2 ? '1.05rem' : '0.9rem';
      const ms = { fontSize: fallbackSize, fontWeight: lvl === 1 ? 700 : 600, ...s };
      return `<h${lvl} style="${styleStr(ms)}">${ip(p.text)}</h${lvl}>`;
    }

    case 'body':
      return `<p style="${styleStr(s)}">${ip(p.text)}</p>`;

    case 'callout':
      return `<div style="${styleStr(s)}">${ip(p.text)}</div>`;

    case 'bullet-list': {
      const items = Array.isArray(p.items) ? p.items : [];
      return `<ul style="${styleStr(s)}">${items.map(item => `<li style="margin-bottom:0.25rem">${ip(item)}</li>`).join('')}</ul>`;
    }

    case 'experience-block': {
      const bullets = Array.isArray(p.bullets) ? p.bullets : [];
      return `<div style="${styleStr(s)}">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.2rem">
    <strong style="font-size:0.95rem;color:#1B2A3B;font-family:Georgia,serif">${ip(p.company)}</strong>
    <span style="font-size:0.72rem;color:#8b9bae;font-family:sans-serif;flex-shrink:0;margin-left:1rem">${ip(p.dates)}</span>
  </div>
  <div style="font-size:0.78rem;color:#8b9bae;font-family:sans-serif;margin-bottom:0.6rem;letter-spacing:0.04em">${ip(p.title)}</div>
  <ul style="list-style:none;padding:0;margin:0">${bullets.map(b => `<li style="font-size:0.85rem;color:#2d3748;line-height:1.65;padding:0.1rem 0;padding-left:0.9rem;position:relative"><span style="position:absolute;left:0;color:#C4843A">·</span>${ip(b)}</li>`).join('')}</ul>
</div>`;
    }

    case 'key-value': {
      const pairs = Array.isArray(p.pairs) ? p.pairs : [];
      return `<div style="${styleStr(s)}">${pairs.map(({ key, value }) =>
        `<div style="display:flex;gap:1rem;padding:0.18rem 0"><span style="color:#8b9bae;min-width:130px;flex-shrink:0;font-family:sans-serif;font-size:0.75rem">${ip(key)}</span><span>${ip(value)}</span></div>`
      ).join('')}</div>`;
    }

    case 'two-column':
      return `<div style="${styleStr(s)}">
  <div>
    ${p.leftLabel ? `<div style="font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#C4843A;font-family:sans-serif;margin-bottom:0.5rem">${ip(p.leftLabel)}</div>` : ''}
    <div style="font-size:0.85rem;color:#2d3748;line-height:1.7">${ip(p.leftText)}</div>
  </div>
  <div>
    ${p.rightLabel ? `<div style="font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#C4843A;font-family:sans-serif;margin-bottom:0.5rem">${ip(p.rightLabel)}</div>` : ''}
    <div style="font-size:0.85rem;color:#2d3748;line-height:1.7">${ip(p.rightText)}</div>
  </div>
</div>`;

    case 'hr':
      return `<hr style="${styleStr(s)}" />`;

    case 'spacer':
      return `<div style="height:${p.height || '1.5rem'}"></div>`;

    case 'herq-question':
      return `<div style="${styleStr(s)}">
  ${p.series ? `<div style="font-size:0.58rem;letter-spacing:0.2em;text-transform:uppercase;color:#E8407A;font-family:sans-serif;margin-bottom:0.5rem">${ip(p.series)}</div>` : ''}
  <div style="font-size:1rem;font-family:Georgia,serif;color:#1B2A3B;line-height:1.65;font-style:italic">"${ip(p.question)}"</div>
  ${p.context ? `<div style="font-size:0.8rem;color:#8b9bae;margin-top:0.6rem;font-style:normal;font-family:sans-serif">${ip(p.context)}</div>` : ''}
</div>`;

    case 'contact-line': {
      const items = Array.isArray(p.items) ? p.items : [];
      const itemsHtml = items.map(item => `<span>${ip(item)}</span>`).join('<span style="color:#C4843A;opacity:0.5"> · </span>');
      return `<div style="${styleStr(s)}">${itemsHtml}</div>`;
    }

    case 'stat-cards': {
      const cards = Array.isArray(p.cards) ? p.cards : [];
      if (!cards.length) return '';
      const cols = Math.min(Math.max(cards.length, 2), 4);
      const cardsHtml = cards.map((c) => `
        <div style="text-align:center;padding:0.9rem 0.6rem;background:#F7F2E8;border-radius:8px">
          <div style="font-size:1.5rem;font-weight:700;color:#1B2A3B;font-family:Georgia,serif;line-height:1.1">${ip(c.value)}</div>
          <div style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:#C4843A;font-weight:700;margin-top:0.3rem;font-family:sans-serif">${ip(c.label)}</div>
          ${c.change ? `<div style="font-size:0.68rem;margin-top:0.2rem;color:${String(c.change).startsWith('-') ? '#c02010' : '#1a8a5a'};font-weight:600">${String(c.change).startsWith('-') ? '▼' : '▲'} ${ip(c.change)}</div>` : ''}
          ${c.sublabel ? `<div style="font-size:0.62rem;color:#536173;margin-top:0.2rem">${ip(c.sublabel)}</div>` : ''}
        </div>`).join('');
      return `<div style="${styleStr(s)};display:grid;grid-template-columns:repeat(${cols},1fr);gap:0.6rem">${cardsHtml}</div>`;
    }

    case 'capacity-gauge': {
      const catalog = ctx.rollupCatalog || {};
      const rollup = [...(catalog.staticRollups || []), ...(catalog.deltaRollups || [])].find((r) => r.key === p.sourceKey);
      if (!rollup) return '';
      const max = Number(rollup.max) || Math.max(Number(rollup.value) || 0, 100);
      const pct = Math.min(100, Math.round((Number(rollup.value) / max) * 100));
      return `<div style="${styleStr(s)};text-align:center;padding:0.75rem 0">
  <svg viewBox="0 0 120 70" width="140" height="82">
    <path d="M10,65 A50,50 0 0 1 110,65" fill="none" stroke="#EEF2F6" stroke-width="10" />
    <path d="M10,65 A50,50 0 0 1 110,65" fill="none" stroke="#C4843A" stroke-width="10"
      stroke-dasharray="${(pct / 100) * 157},157" />
  </svg>
  <div style="font-size:1.3rem;font-weight:700;color:#1B2A3B;font-family:Georgia,serif">${ip(rollup.value)}</div>
  <div style="font-size:0.66rem;letter-spacing:0.1em;text-transform:uppercase;color:#536173;font-family:sans-serif">${ip(rollup.label)}</div>
</div>`;
    }

    case 'bar-chart-h':
    case 'bar-chart-v': {
      const catalog = ctx.rollupCatalog || {};
      const prefix = p.sourceKey || '';
      const horizontal = block.type === 'bar-chart-h';
      let rows = (catalog.staticRollups || []).filter((r) => !prefix || r.key.startsWith(prefix));
      if (!rows.length) return '';
      // Vertical bars sit side-by-side in a fixed-height row — with no
      // responsive constraint, a fixed per-bar width (52px) times a large
      // category count (e.g. 15 skill categories) overflowed the container
      // width instead of fitting it. Sorting + capping to the top 8 by
      // value keeps the chart readable at any container width; horizontal
      // bars stack vertically instead so they don't have this problem and
      // are left uncapped.
      rows = [...rows].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
      if (!horizontal && rows.length > 8) rows = rows.slice(0, 8);
      const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
      const barsHtml = rows.map((r) => {
        const pct = Math.round(((Number(r.value) || 0) / max) * 100);
        return horizontal
          ? `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">
              <div style="width:110px;font-size:0.7rem;color:#2d3748;flex-shrink:0">${ip(r.label)}</div>
              <div style="flex:1;background:#EEF2F6;border-radius:3px;height:12px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:#4A9EBF"></div>
              </div>
              <div style="width:28px;font-size:0.7rem;color:#1B2A3B;font-weight:700;text-align:right">${r.value}</div>
            </div>`
          : `<div style="display:flex;flex-direction:column;align-items:center;min-width:0;width:100%">
              <div style="font-size:0.62rem;color:#1B2A3B;font-weight:700">${r.value}</div>
              <div style="width:70%;max-width:26px;height:${Math.max(pct, 4)}px;background:#4A9EBF;border-radius:2px 2px 0 0;margin-top:2px"></div>
              <div style="font-size:0.54rem;color:#536173;text-align:center;margin-top:0.25rem;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word">${ip(r.label)}</div>
            </div>`;
      }).join('');
      const wrapStyle = horizontal
        ? ''
        : `display:grid;grid-template-columns:repeat(${rows.length},minmax(0,1fr));align-items:end;gap:0.3rem;height:110px;width:100%`;
      return `<div style="${styleStr(s)};max-width:100%;overflow:hidden">
  ${p.title ? `<div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:#536173;margin-bottom:0.5rem;font-family:sans-serif">${ip(p.title)}</div>` : ''}
  <div style="${wrapStyle}">${barsHtml}</div>
</div>`;
    }

    case 'venn-overlap': {
      const overlaps = (ctx.rollupCatalog?.overlaps || []).slice(0, 6);
      if (!overlaps.length) return '';
      const rowsHtml = overlaps.map((o) => `
        <div style="display:flex;justify-content:space-between;font-size:0.76rem;padding:0.3rem 0;border-bottom:0.5px solid #EEF2F6">
          <span style="color:#1B2A3B">${ip(o.category)} × ${ip(o.industry)}</span>
          <span style="color:#C4843A;font-weight:700">${o.overlapCount}</span>
        </div>`).join('');
      return `<div style="${styleStr(s)}">
  ${p.title ? `<div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:#536173;margin-bottom:0.5rem;font-family:sans-serif">${ip(p.title)}</div>` : ''}
  ${rowsHtml}
</div>`;
    }

    case 'cert-badges': {
      const groups = ctx.rollupCatalog?.certBadges || [];
      const items = groups.flatMap((g) => g.items.map((it) => ({ ...it, status: g.status })));
      if (!items.length) return '';
      const badgesHtml = items.map((it) => `
        <span style="display:inline-flex;flex-direction:column;padding:0.4rem 0.7rem;margin:0.2rem;border-radius:6px;border:0.5px solid ${it.status === 'active' ? '#C4843A' : '#8b9bae'};background:${it.status === 'active' ? 'rgba(196,132,58,0.07)' : 'rgba(139,155,174,0.07)'}">
          <span style="font-size:0.74rem;font-weight:700;color:#1B2A3B">${ip(it.name)}</span>
          <span style="font-size:0.6rem;color:#536173">${ip(it.issuer || '')}${it.expires ? ` · exp ${ip(it.expires)}` : ''}</span>
        </span>`).join('');
      return `<div style="${styleStr(s)}">
  ${p.title ? `<div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:#536173;margin-bottom:0.5rem;font-family:sans-serif">${ip(p.title)}</div>` : ''}
  <div>${badgesHtml}</div>
</div>`;
    }

    case 'tool-usage-snapshot': {
      const tools = (ctx.rollupCatalog?.toolUsage || []).filter((t) => t.roleCount > 0).slice(0, 12);
      if (!tools.length) return '';
      const rowsHtml = tools.map((t) => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.76rem;padding:0.3rem 0;border-bottom:0.5px solid #EEF2F6">
          <span style="color:#1B2A3B;font-weight:600">${ip(t.tool)}</span>
          <span style="color:#536173;font-size:0.66rem">${ip(t.category || '')} · ${t.roleCount} role${t.roleCount === 1 ? '' : 's'}${t.industries.length ? ` · ${ip(t.industries.join(', '))}` : ''}</span>
        </div>`).join('');
      return `<div style="${styleStr(s)}">
  ${p.title ? `<div style="font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:#536173;margin-bottom:0.5rem;font-family:sans-serif">${ip(p.title)}</div>` : ''}
  ${rowsHtml}
</div>`;
    }

    case 'accent-stat-cards': {
      const cards = Array.isArray(p.statCards) ? p.statCards : [];
      if (!cards.length) return '';
      const cols = Math.min(Math.max(cards.length, 2), 4);
      const cardsHtml = cards.map((c) => {
        const accent = OUTPUT_ACCENT_SWATCH[c.accent] || OUTPUT_ACCENT_SWATCH.gold;
        return `
        <div style="border:0.5px solid rgba(27,42,59,0.14);border-radius:4px;overflow:hidden;background:#fff">
          <div style="height:4px;background:${accent}"></div>
          <div style="padding:0.9rem 0.85rem">
            ${c.icon ? `<div style="margin-bottom:0.5rem">${iconSvg(c.icon, accent, 22)}</div>` : ''}
            <div style="font-size:1.4rem;font-family:Georgia,serif;color:#1B2A3B;line-height:1">${ip(c.value)}</div>
            <div style="font-size:0.6rem;letter-spacing:0.08em;color:#1B2A3B;margin-top:0.4rem;font-family:sans-serif;text-transform:uppercase">${ip(c.label)}</div>
            ${c.caption ? `<div style="font-size:0.66rem;color:#536173;margin-top:0.35rem;line-height:1.4">${ip(c.caption)}</div>` : ''}
            ${c.source ? `<div style="font-size:0.56rem;color:#999;margin-top:0.4rem;font-style:italic">${ip(c.source)}</div>` : ''}
          </div>
        </div>`;
      }).join('');
      return `<div style="${styleStr(s)};display:grid;grid-template-columns:repeat(${cols},1fr);gap:0.75rem">${cardsHtml}</div>`;
    }

    case 'cascade-flow': {
      const steps = Array.isArray(p.cascadeSteps) ? p.cascadeSteps : [];
      if (!steps.length) return '';
      const stepsHtml = steps.map((step, i) => {
        const accent = OUTPUT_ACCENT_SWATCH[step.accent] || OUTPUT_ACCENT_SWATCH.teal;
        const arrow = i < steps.length - 1 ? `<div style="display:flex;align-items:center;justify-content:center;width:20px;flex-shrink:0;color:#C4843A;font-size:1rem">→</div>` : '';
        return `
        <div style="flex:1;min-width:110px;border:0.5px solid rgba(27,42,59,0.14);border-radius:4px;overflow:hidden;background:#fff">
          <div style="height:3px;background:${accent}"></div>
          <div style="padding:0.7rem 0.6rem">
            ${step.icon ? `<div style="margin-bottom:0.4rem">${iconSvg(step.icon, accent, 18)}</div>` : ''}
            <div style="font-size:0.72rem;font-weight:700;color:#1B2A3B;margin-bottom:0.25rem">${ip(step.title)}</div>
            <div style="font-size:0.64rem;color:#536173;line-height:1.4">${ip(step.description)}</div>
          </div>
        </div>${arrow}`;
      }).join('');
      const summaryHtml = p.summary ? `
      <div style="margin-top:0.85rem;background:#EAF1F3;border-left:3px solid #4A7C8E;border-radius:2px;padding:0.6rem 0.85rem;display:flex;align-items:center;gap:0.6rem">
        ${p.summaryIcon ? iconSvg(p.summaryIcon, '#1B2A3B', 18) : ''}
        <div style="font-size:0.72rem;color:#1B2A3B;line-height:1.5">${ip(p.summary)}</div>
      </div>` : '';
      return `<div style="${styleStr(s)}">
  <div style="display:flex;align-items:stretch;gap:0.4rem;flex-wrap:wrap">${stepsHtml}</div>
  ${summaryHtml}
</div>`;
    }

    case 'architecture-steps': {
      const steps = Array.isArray(p.steps) ? p.steps : [];
      if (!steps.length) return '';
      const stepsHtml = steps.map((step, i) => `
        <div style="display:flex;gap:0.75rem">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
            <div style="width:22px;height:22px;border-radius:50%;background:#4A7C8E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.66rem;font-weight:700;font-family:sans-serif;flex-shrink:0">${i + 1}</div>
            ${i < steps.length - 1 ? `<div style="width:1px;flex:1;min-height:20px;background:rgba(74,124,142,0.35);margin:2px 0"></div>` : ''}
          </div>
          <div style="padding-bottom:${i < steps.length - 1 ? '0.85rem' : 0}">
            <div style="font-size:0.78rem;font-weight:700;color:#1B2A3B;margin-bottom:0.2rem">${ip(step.title)}</div>
            ${step.description ? `<div style="font-size:0.7rem;color:#536173;line-height:1.55">${ip(step.description)}</div>` : ''}
          </div>
        </div>`).join('');
      return `<div style="${styleStr(s)};display:flex;flex-direction:column">${stepsHtml}</div>`;
    }

    default:
      return `<div style="padding:0.5rem;background:#f5f5f5;font-size:0.75rem;color:#999;border:1px dashed #ccc">[Unknown block: ${block.type}]</div>`;
  }
}

export function renderTemplateToHtml(blocks = [], ctx = {}, options = {}) {
  const { pageMargin = '0.75in', fontBase = 'Georgia, serif' } = options;
  const sorted = [...blocks]
    .filter(b => b.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const body = sorted.map(b => renderBlockToHtml(b, ctx)).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:letter;margin:${pageMargin}}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{font-family:${fontBase};color:#1B2A3B;background:white;font-size:14px}
.page{max-width:8.5in;margin:0 auto;padding:${pageMargin}}
@media print{.page{padding:0}}
</style>
</head>
<body>
<div class="page">
${body}
</div>
</body>
</html>`;
}

// ── Member footer (layer 1) — deliberately standalone, never merged into
// renderTemplateToHtml's block loop or the locked AUTHORSHIP footer in
// Output.jsx. Renders the member/org's own footer lines, APPENDED below the
// locked Salt Basin footer — never in place of it.
export function renderMemberFooterHtml(config) {
  const layer1 = config?.layer1_header || {};
  const lines = Array.isArray(layer1.memberFooterLines) ? layer1.memberFooterLines.filter(Boolean) : [];
  const links = Array.isArray(layer1.memberFooterLinks) ? layer1.memberFooterLinks.filter((l) => l?.label) : [];
  if (layer1.contactEmail) links.unshift({ label: layer1.contactEmail, url: `mailto:${layer1.contactEmail}` });
  if (layer1.websiteUrl) links.push({ label: layer1.websiteUrl.replace(/^https?:\/\//, ''), url: /^https?:\/\//.test(layer1.websiteUrl) ? layer1.websiteUrl : `https://${layer1.websiteUrl}` });
  if (!lines.length && !links.length) return '';
  const linesHtml = lines.map((l) => `<div>${l}</div>`).join('');
  const linksHtml = links.length
    ? `<div style="margin-top:0.3rem">${links.map((l) => `<a href="${l.url || '#'}" style="color:inherit">${l.label}</a>`).join(' · ')}</div>`
    : '';
  return `<div style="margin-top:0.75rem;padding-top:0.6rem;border-top:0.5px solid rgba(139,155,174,0.3);font-size:0.68rem;color:#8b9bae;line-height:1.6">
  ${linesHtml}${linksHtml}
</div>`;
}

// ── Layer config adapter — turns a v2 output_templates.config object into
// the flat blocks[] array renderBlockToHtml()/renderTemplateToHtml() already
// consume. Layer 2 (stat cards) is resolved here against ctx.rollupCatalog
// since block selection/order/labels live in config, not in the catalog.
//
// Stats and infographics are built by separate functions (not one combined
// list) so a caller can place infographics ahead of other content — a
// portfolio-style dashboard read before the detail sections — while stat
// cards stay wherever the caller puts them. Each infographic item carries
// its own `order` field (set in the Infographics tab's sequence control),
// respected here via an explicit sort rather than array-push order.
export function buildStatBlocksFromLayerConfig(config, ctx = {}) {
  const blocks = [];
  const catalog = ctx.rollupCatalog || {};
  const layer2 = config?.layer2_stats?.cards || [];
  const visibleCards = layer2.filter((c) => c.visible !== false);
  if (visibleCards.length) {
    const resolvedCards = visibleCards.map((c) => {
      const pool = c.kind === 'delta' ? catalog.deltaRollups : catalog.staticRollups;
      const rollup = (pool || []).find((r) => r.key === c.metricKey);
      return {
        label: c.label || rollup?.label || c.metricKey,
        value: rollup ? (c.kind === 'delta' ? (rollup.series?.[rollup.series.length - 1]?.value ?? rollup.change) : rollup.value) : '—',
        change: c.kind === 'delta' ? rollup?.change : null,
        sublabel: c.sublabel || rollup?.sublabel,
      };
    });
    blocks.push({ id: `l2-stats`, type: 'stat-cards', visible: true, order: 1, props: { cards: resolvedCards }, style: { margin: '0.75rem 0' } });
  }
  return blocks;
}

export function buildInfographicBlocksFromLayerConfig(config) {
  const layer3 = config?.layer3_infographics?.items || [];
  return layer3
    .filter((i) => i.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item, i) => ({
      id: item.id || `l3-${item.blockType}-${i}`,
      type: item.blockType,
      visible: true,
      order: item.order ?? i,
      props: { sourceKey: item.sourceKey, title: item.params?.title || '', ...(item.params || {}) },
      style: { margin: '0.75rem 0' },
    }));
}

// Back-compat combined builder (stats then infographics) for any caller
// that doesn't need the two interleaved with other content.
export function buildBlocksFromLayerConfig(config, ctx = {}) {
  return [...buildStatBlocksFromLayerConfig(config, ctx), ...buildInfographicBlocksFromLayerConfig(config)];
}

// ── Default template configs ──────────────────────────────────────────────────

export const DEFAULT_TEMPLATES = {
  HERQFramework: {
    name: 'HERQ Framework Overview',
    outputType: 'HERQFramework',
    pageMargin: '0.75in',
    blocks: [
      { id: 'b1', type: 'page-header', visible: true, order: 1, props: { eyebrow: 'HERQ · Salter Momentum™', title: 'Hot Elephant Resident Question', subtitle: 'A framework for asking the questions that change how enterprise platforms get built.' }, style: {} },
      { id: 'b2', type: 'color-band', visible: true, order: 2, props: {}, style: { background: '#E8407A', height: '4px' } },
      { id: 'b3', type: 'section-label', visible: true, order: 3, props: { text: 'THE FRAMEWORK' }, style: {} },
      { id: 'b4', type: 'body', visible: true, order: 4, props: { text: 'HERQ stands for Hot Elephant Resident Question — the question that is always in the room but never on the agenda. Every enterprise platform initiative has one. Naming it is the first act of clarity.' }, style: {} },
      { id: 'b5', type: 'callout', visible: true, order: 5, props: { text: 'The HERQ isn\'t the loudest question. It\'s the one that, if answered honestly, changes the entire direction of the project.' }, style: {} },
      { id: 'b6', type: 'section-label', visible: true, order: 6, props: { text: 'HOW TO USE THIS FRAMEWORK' }, style: {} },
      { id: 'b7', type: 'bullet-list', visible: true, order: 7, props: { items: ['Identify the HERQ before scoping a platform engagement', 'Name it explicitly in the discovery phase — don\'t let it stay implicit', 'Track whether the answer changes as the engagement progresses', 'Use the series tracker to log questions across contexts and clients'] }, style: {} },
      { id: 'b8', type: 'hr', visible: true, order: 8, props: {}, style: {} },
      { id: 'b9', type: 'two-column', visible: true, order: 9, props: { leftLabel: 'WHAT A HERQ IS', leftText: 'A strategic inflection point disguised as an operational question. Usually lives in the room where decisions get made — and gets avoided precisely because it\'s the most important thing to answer.', rightLabel: 'WHAT A HERQ IS NOT', rightText: 'A project status question. A scope clarification. A technical requirement. Those are legitimate — but they\'re not the HERQ.' }, style: {} },
      { id: 'b10', type: 'spacer', visible: true, order: 10, props: { height: '2rem' }, style: {} },
      { id: 'b11', type: 'color-band', visible: true, order: 11, props: {}, style: { background: '#1B2A3B', height: '2px' } },
      { id: 'b12', type: 'body', visible: true, order: 12, props: { text: 'Salt Basin Net Works · Salter Momentum™ · saltbasin.net' }, style: { fontSize: '0.7rem', color: '#8b9bae', fontFamily: 'sans-serif', paddingTop: '0.75rem', textAlign: 'center' } },
    ],
  },
  HERQSeriesTracker: {
    name: 'HERQ Series Tracker',
    outputType: 'HERQSeriesTracker',
    pageMargin: '0.75in',
    blocks: [
      { id: 'b1', type: 'page-header', visible: true, order: 1, props: { eyebrow: 'HERQ · Series Reference', title: 'Series Tracker', subtitle: 'Active question series and their current status.' }, style: {} },
      { id: 'b2', type: 'color-band', visible: true, order: 2, props: {}, style: { background: '#E8407A', height: '4px' } },
      { id: 'b3', type: 'section-label', visible: true, order: 3, props: { text: 'ACTIVE SERIES' }, style: {} },
      { id: 'b4', type: 'body', visible: true, order: 4, props: { text: 'Each series represents a named question arc. Series are distinguished by target audience and the type of enterprise reality they surface.' }, style: {} },
      { id: 'b5', type: 'spacer', visible: true, order: 5, props: { height: '1rem' }, style: {} },
      { id: 'b6', type: 'section-label', visible: true, order: 6, props: { text: 'POST TRACKER SUMMARY' }, style: {} },
      { id: 'b7', type: 'body', visible: true, order: 7, props: { text: 'Posts are logged here by series. Zero.Post is the pinned framework reference — all other posts reference it.' }, style: {} },
    ],
  },
  HERQSeriesPostOnePager: {
    name: 'HERQ One-Pager',
    outputType: 'HERQSeriesPostOnePager',
    pageMargin: '0.75in',
    blocks: [
      { id: 'b1', type: 'page-header', visible: true, order: 1, props: { eyebrow: 'HERQ', title: 'Series One-Pager', subtitle: '' }, style: { background: '#1B2A3B' } },
      { id: 'b2', type: 'color-band', visible: true, order: 2, props: {}, style: { background: '#E8407A', height: '4px' } },
      { id: 'b3', type: 'herq-question', visible: true, order: 3, props: { question: 'What is the real question in the room?', series: 'HERQ', context: '' }, style: {} },
      { id: 'b4', type: 'section-label', visible: true, order: 4, props: { text: 'CONTEXT' }, style: {} },
      { id: 'b5', type: 'body', visible: true, order: 5, props: { text: 'Add context for this question here.' }, style: {} },
      { id: 'b6', type: 'section-label', visible: true, order: 6, props: { text: 'WHY THIS QUESTION MATTERS' }, style: {} },
      { id: 'b7', type: 'body', visible: true, order: 7, props: { text: 'Explain the significance of this question in the enterprise context.' }, style: {} },
      { id: 'b8', type: 'hr', visible: true, order: 8, props: {}, style: {} },
      { id: 'b9', type: 'callout', visible: true, order: 9, props: { text: 'The answer to this question is never what the org thought it would be.' }, style: {} },
      { id: 'b10', type: 'color-band', visible: true, order: 10, props: {}, style: { background: '#1B2A3B', height: '2px', marginTop: '2rem' } },
      { id: 'b11', type: 'body', visible: true, order: 11, props: { text: 'Salt Basin Net Works · Salter Momentum™ · saltbasin.net' }, style: { fontSize: '0.7rem', color: '#8b9bae', fontFamily: 'sans-serif', paddingTop: '0.75rem', textAlign: 'center' } },
    ],
  },
  resume: {
    name: 'Professional Resume',
    outputType: 'resume',
    pageMargin: '0.6in',
    blocks: [
      { id: 'r1', type: 'page-header', visible: true, order: 1, props: { eyebrow: 'RESUME', title: '{{about.name}}', subtitle: '{{about.title}}' }, style: { background: '#1B2A3B', color: '#F5EDD8', padding: '2.25rem 2.5rem 2rem', textAlign: 'left' } },
      { id: 'r2', type: 'color-band', visible: true, order: 2, props: {}, style: { background: '#C4843A', height: '3px' } },
      { id: 'r2b', type: 'contact-line', visible: true, order: 3, props: { items: ['{{about.email}}', '{{about.location}}', '{{about.website}}'] }, style: { padding: '0.75rem 0 0.5rem' } },
      { id: 'r2c', type: 'exec-kpi-dashboard', visible: true, order: 3.5, props: {}, style: { padding: '0.5rem 0 0.75rem' } },
      { id: 'r3', type: 'section-label', visible: true, order: 4, props: { text: 'PROFESSIONAL SUMMARY' }, style: {} },
      { id: 'r4', type: 'body', visible: true, order: 5, props: { text: '{{about.p1}}' }, style: {} },
      { id: 'r5', type: 'section-label', visible: true, order: 6, props: { text: 'PROFESSIONAL EXPERIENCE' }, style: {} },
      { id: 'r6', type: 'experience-block', visible: true, order: 7, props: { company: '{{jobs.0.company}}', title: '{{jobs.0.title}}', dates: '{{jobs.0.dates}}', bullets: [] }, style: {}, _dynamic: 'jobs' },
      { id: 'r7', type: 'section-label', visible: true, order: 8, props: { text: 'EDUCATION' }, style: {} },
      { id: 'r8', type: 'key-value', visible: true, order: 9, props: { pairs: [{ key: 'Degree', value: '{{about.education}}' }, { key: 'Institution', value: '{{about.institution}}' }] }, style: {} },
      { id: 'r9', type: 'hr', visible: true, order: 10, props: {}, style: {} },
      { id: 'r10', type: 'section-label', visible: true, order: 11, props: { text: 'CORE CAPABILITIES' }, style: {} },
      { id: 'r11', type: 'bullet-list', visible: true, order: 12, props: { items: ['{{about.capability1}}', '{{about.capability2}}', '{{about.capability3}}'] }, style: {} },
    ],
  },
};

// New block scaffolds for the "Add Block" palette
export function newBlock(type) {
  const def = BLOCK_DEFS[type];
  if (!def) return null;
  return {
    id: `b-${Math.random().toString(36).slice(2, 9)}`,
    type,
    visible: true,
    order: 9999,
    props: { ...(def.defaultProps || {}) },
    style: {},
  };
}
