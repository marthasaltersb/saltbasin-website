// Output block system — machine-readable block configs that drive all rendered outputs.
// Blocks are stored as JSON in the DB and rendered to HTML via renderTemplateToHtml().
// The same system drives HERQ outputs, resume, case study, one-pagers, and future outputs.

export const BLOCK_DEFS = {
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
