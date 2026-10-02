// Career chart renderers (2026-10-02) — the chart family offered in the
// Output Template editor's chart gallery. Pure functions returning
// print-safe HTML/SVG strings, so the same chart renders in the gallery
// thumbnail, the live preview iframe, and the printed/PDF output
// (src/lib/outputBlocks.js wires them in as career-* block types).
//
// Colour follows the dataviz method: categorical slots validated with the
// palette validator (light surface: lightness band, chroma floor, CVD and
// normal-vision separation, ≥3:1 contrast — all pass); proficiency tiers are
// one sequential teal ramp, light→dark; text always wears text tokens, never
// a series colour. Single-series charts carry no legend (the title names
// them); multi-series charts always do. Marks: bars ≤24px with a 4px rounded
// data end, 2px lines, 2px surface gaps. Every mark carries an SVG <title>
// for hover on screen.

export const CHART_TOKENS = Object.freeze({
  ink: '#1B2A3B',
  secondary: '#536173',
  muted: '#8B95A1',
  grid: '#E6E9EC',
  surface: '#FFFFFF',
  track: '#EEF3F6',
  accent: '#C98320',
});

// Validated categorical order (fixed, never cycled). A 6th+ category folds
// into OTHER rather than getting a generated hue.
export const CATEGORICAL = Object.freeze(['#1A8DC4', '#C98320', '#7058B8', '#2F9A68', '#B04E2A']);
export const OTHER = '#9AA3AD';

// Sequential teal ramp for proficiency tiers (light → dark).
export const TIER_RAMP = Object.freeze(['#CFE6EE', '#9CCBDC', '#5FA9C2', '#2E7F9C', '#1B4F66']);

const FONT = "Helvetica, Arial, 'DejaVu Sans', sans-serif";

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function titleHtml(title, subtitle) {
  if (!title && !subtitle) return '';
  return `<div style="margin-bottom:0.55rem;font-family:${FONT}">
    ${title ? `<div style="font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;color:${CHART_TOKENS.ink};font-weight:700">${esc(title)}</div>` : ''}
    ${subtitle ? `<div style="font-size:0.68rem;color:${CHART_TOKENS.secondary};margin-top:0.15rem">${esc(subtitle)}</div>` : ''}
  </div>`;
}

function emptyHtml(title, message) {
  return `<div style="font-family:${FONT}">${titleHtml(title)}<div style="font-size:0.72rem;color:${CHART_TOKENS.muted};padding:0.75rem;border:1px dashed ${CHART_TOKENS.grid};border-radius:6px">${esc(message)}</div></div>`;
}

// Rounded data-end, square baseline: a path for a horizontal bar from x0.
function hBarPath(x, y, w, h, r = 4) {
  if (w <= 0) return '';
  const rr = Math.min(r, w, h / 2);
  return `M${x},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x} Z`;
}

function vBarPath(x, yBase, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  const top = yBase - h;
  return `M${x},${yBase} V${top + rr} Q${x},${top} ${x + rr},${top} H${x + w - rr} Q${x + w},${top} ${x + w},${top + rr} V${yBase} Z`;
}

// ── 1. Proficiency tier bars ────────────────────────────────────────────────
// One row per skill/tool (or per category average): a 5-step track whose
// filled steps wear the tier ramp. † marks a member-defined level; the
// footnote travels with the chart so any output using it carries it.
export function proficiencyBarsHtml({ rows, levels, title, subtitle, footnote, maxItems = 10 }) {
  const ordered = [...(levels || [])].sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));
  const steps = Math.max(ordered.length, 1);
  const shown = (rows || []).filter((r) => r.ordinal > 0).slice(0, maxItems);
  if (!shown.length) return emptyHtml(title, 'No proficiency levels yet — add skills or tools in Career Master, or set levels in Proficiency & Rollups.');
  const rowH = 22;
  const labelW = 170;
  const trackW = 300;
  const gap = 2;
  const segW = (trackW - gap * (steps - 1)) / steps;
  const height = shown.length * rowH + 4;
  const rowsSvg = shown.map((r, i) => {
    const y = i * rowH + 4;
    const filled = Math.min(Math.round(r.ordinal), steps);
    const segs = Array.from({ length: steps }, (_, s) => {
      const x = labelW + s * (segW + gap);
      const fill = s < filled ? TIER_RAMP[Math.min(filled - 1, TIER_RAMP.length - 1)] : CHART_TOKENS.track;
      const isEnd = s === steps - 1 || s === filled - 1;
      return isEnd && s < filled
        ? `<path d="${hBarPath(x, y, segW, 12)}" fill="${fill}"/>`
        : `<rect x="${x}" y="${y}" width="${segW}" height="12" fill="${fill}"/>`;
    }).join('');
    const mark = r.userDefined ? '†' : '';
    const tip = `${r.label}: ${r.levelLabel || '—'}${r.userDefined ? ' (user-defined)' : ''}${r.points != null ? ` · ${r.points} pts` : ''}`;
    return `<g><title>${esc(tip)}</title>
      <text x="0" y="${y + 10}" font-size="11" fill="${CHART_TOKENS.ink}" font-family="${FONT}">${esc(r.label.length > 26 ? `${r.label.slice(0, 25)}…` : r.label)}${mark ? `<tspan fill="${CHART_TOKENS.accent}" font-weight="700"> ${mark}</tspan>` : ''}</text>
      ${segs}
      <text x="${labelW + trackW + 8}" y="${y + 10}" font-size="10.5" fill="${CHART_TOKENS.secondary}" font-family="${FONT}">${esc(r.levelLabel || '')}</text>
    </g>`;
  }).join('');
  const legend = ordered.map((l, i) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${TIER_RAMP[Math.min(i, TIER_RAMP.length - 1)]}"></span>${esc(l.label)}</span>`).join('');
  return `<div style="font-family:${FONT};break-inside:avoid">
    ${titleHtml(title, subtitle)}
    <svg viewBox="0 0 ${labelW + trackW + (shown.some((r) => String(r.levelLabel || '').includes('·')) ? 170 : 90)} ${height}" width="100%" role="img" aria-label="${esc(title || 'Proficiency levels')}" style="display:block;max-width:100%">${rowsSvg}</svg>
    <div style="font-size:0.62rem;color:${CHART_TOKENS.secondary};margin-top:0.35rem">${legend}</div>
    ${footnote ? `<div style="font-size:0.6rem;color:${CHART_TOKENS.secondary};margin-top:0.35rem;font-style:italic"><span style="color:${CHART_TOKENS.accent};font-weight:700">†</span> ${esc(footnote.replace(/^Proficiency levels marked † are /, 'Levels marked † are '))}</div>` : ''}
  </div>`;
}

// ── 2. Trend bars (columns + dashed least-squares trend line) ──────────────
export function trendBarsHtml({ series, title, subtitle, unit = '' }) {
  const pts = (series || []).filter((p) => Number.isFinite(Number(p.value)));
  if (pts.length < 2) return emptyHtml(title, 'Not enough dated Career Master records to show a trend yet.');
  const W = 520, H = 170, padL = 30, padB = 22, padT = 14;
  const plotW = W - padL - 8, plotH = H - padB - padT;
  const max = Math.max(...pts.map((p) => Number(p.value)), 1);
  const niceMax = Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)));
  const band = plotW / pts.length;
  const barW = Math.min(24, band - 2);
  const yOf = (v) => padT + plotH - (v / niceMax) * plotH;
  const bars = pts.map((p, i) => {
    const x = padL + i * band + (band - barW) / 2;
    const h = (Number(p.value) / niceMax) * plotH;
    return `<g><title>${esc(`${p.label}: ${p.value}${unit}`)}</title><rect x="${padL + i * band}" y="${padT}" width="${band}" height="${plotH}" fill="transparent"/><path d="${vBarPath(x, padT + plotH, barW, h)}" fill="${CATEGORICAL[0]}"/></g>`;
  }).join('');
  // least squares over index
  const n = pts.length;
  const xs = pts.map((_, i) => i);
  const ys = pts.map((p) => Number(p.value));
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
  const icpt = my - slope * mx;
  const cx = (i) => padL + i * band + band / 2;
  const t0 = Math.max(0, icpt), t1 = Math.max(0, icpt + slope * (n - 1));
  const trend = `<line x1="${cx(0)}" y1="${yOf(t0)}" x2="${cx(n - 1)}" y2="${yOf(t1)}" stroke="${CHART_TOKENS.accent}" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"><title>Trend</title></line>`;
  const grid = [0, 0.5, 1].map((f) => `<line x1="${padL}" x2="${W - 8}" y1="${yOf(niceMax * f)}" y2="${yOf(niceMax * f)}" stroke="${CHART_TOKENS.grid}" stroke-width="1"/><text x="${padL - 5}" y="${yOf(niceMax * f) + 3}" font-size="9" text-anchor="end" fill="${CHART_TOKENS.muted}" font-family="${FONT}">${Math.round(niceMax * f)}</text>`).join('');
  const every = Math.ceil(n / 10);
  const xlabels = pts.map((p, i) => (i % every === 0 || i === n - 1) ? `<text x="${cx(i)}" y="${H - 6}" font-size="9" text-anchor="middle" fill="${CHART_TOKENS.muted}" font-family="${FONT}">${esc(p.label)}</text>` : '').join('');
  const last = pts[n - 1];
  const endLabel = `<text x="${cx(n - 1)}" y="${yOf(Number(last.value)) - 5}" font-size="10" text-anchor="middle" fill="${CHART_TOKENS.ink}" font-weight="700" font-family="${FONT}">${esc(last.value)}${esc(unit)}</text>`;
  const legend = `<span style="display:inline-flex;align-items:center;gap:4px"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="${CHART_TOKENS.accent}" stroke-width="2" stroke-dasharray="5 4"/></svg>Trend</span>`;
  return `<div style="font-family:${FONT};break-inside:avoid">
    ${titleHtml(title, subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(title || 'Trend')}" style="display:block;max-width:100%">${grid}${bars}${trend}${endLabel}${xlabels}</svg>
    <div style="font-size:0.62rem;color:${CHART_TOKENS.secondary};margin-top:0.2rem">${legend}</div>
  </div>`;
}

// ── 3. Outcome tiles (headline figures with footnote markers) ──────────────
export function outcomeTilesHtml({ tiles, title, subtitle }) {
  const shown = (tiles || []).filter((t) => t && String(t.value || '').trim()).slice(0, 4);
  if (!shown.length) return emptyHtml(title, 'No outcomes yet — add quantified metrics to engagements in Career Master, or type them here.');
  const notes = [];
  const marks = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'];
  const tileHtml = shown.map((t) => {
    let mark = '';
    if (t.source) {
      let idx = notes.indexOf(t.source);
      if (idx === -1) { notes.push(t.source); idx = notes.length - 1; }
      mark = marks[idx] || `(${idx + 1})`;
    }
    return `<div style="flex:1;min-width:0;padding:0.7rem 0.75rem;border-top:3px solid ${CHART_TOKENS.accent};background:#FAF6EF">
      <div style="font-size:1.35rem;font-weight:700;color:${CHART_TOKENS.ink};line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(t.value)}">${esc(t.value)}</div>
      <div style="font-size:0.66rem;color:${CHART_TOKENS.secondary};line-height:1.4;margin-top:0.3rem">${esc(t.caption || '')}${mark ? `<span style="color:${CHART_TOKENS.ink}">${mark}</span>` : ''}</div>
    </div>`;
  }).join('<div style="width:2px"></div>');
  return `<div style="font-family:${FONT};break-inside:avoid">
    ${titleHtml(title, subtitle)}
    <div style="display:flex;gap:6px">${tileHtml}</div>
    ${notes.length ? `<div style="font-size:0.58rem;color:${CHART_TOKENS.muted};margin-top:0.35rem;line-height:1.5">${notes.map((n, i) => `${marks[i] || `(${i + 1})`} ${esc(n)}`).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>` : ''}
  </div>`;
}

// ── 4. Duration timeline (one bar per role, coloured by industry) ──────────
export function durationTimelineHtml({ rows, title, subtitle, currentYear = new Date().getFullYear() }) {
  const items = (rows || []).filter((r) => r.start);
  if (!items.length) return emptyHtml(title, 'No dated roles in Career Master yet.');
  const minY = Math.min(...items.map((r) => r.start));
  const maxY = Math.max(...items.map((r) => r.end || currentYear), currentYear);
  const cats = [];
  for (const r of items) if (!cats.includes(r.category || 'Other')) cats.push(r.category || 'Other');
  const colorOf = (c) => {
    const i = cats.indexOf(c);
    return c === 'Other' || i >= CATEGORICAL.length ? OTHER : CATEGORICAL[i];
  };
  const W = 560, labelW = 150, rowH = 20, padT = 4, axisH = 18;
  const plotW = W - labelW - 10;
  const span = Math.max(1, maxY - minY + 1);
  const xOf = (y) => labelW + ((y - minY) / span) * plotW;
  const H = items.length * rowH + padT + axisH;
  const bars = items.map((r, i) => {
    const y = padT + i * rowH;
    const x0 = xOf(r.start);
    const x1 = xOf((r.end || currentYear) + 1);
    const label = r.label.length > 24 ? `${r.label.slice(0, 23)}…` : r.label;
    return `<g><title>${esc(`${r.label}${r.sublabel ? ` — ${r.sublabel}` : ''}: ${r.start}–${r.end || 'present'}${r.category ? ` · ${r.category}` : ''}`)}</title>
      <text x="0" y="${y + 11}" font-size="10.5" fill="${CHART_TOKENS.ink}" font-family="${FONT}">${esc(label)}</text>
      <path d="${hBarPath(x0, y + 2, Math.max(4, x1 - x0 - 2), 12)}" fill="${colorOf(r.category || 'Other')}"/></g>`;
  }).join('');
  const ticks = [];
  const step = span > 12 ? 4 : span > 6 ? 2 : 1;
  for (let yr = minY; yr <= maxY; yr += step) ticks.push(yr);
  const axis = ticks.map((yr) => `<line x1="${xOf(yr)}" x2="${xOf(yr)}" y1="${padT}" y2="${H - axisH}" stroke="${CHART_TOKENS.grid}" stroke-width="1"/><text x="${xOf(yr)}" y="${H - 5}" font-size="9" text-anchor="middle" fill="${CHART_TOKENS.muted}" font-family="${FONT}">${yr}</text>`).join('');
  const legendCats = cats.length > CATEGORICAL.length ? [...cats.slice(0, CATEGORICAL.length), 'Other'] : cats;
  const legend = legendCats.length > 1
    ? `<div style="font-size:0.62rem;color:${CHART_TOKENS.secondary};margin-top:0.3rem">${[...new Set(legendCats)].map((c) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${colorOf(c)}"></span>${esc(c)}</span>`).join('')}</div>`
    : '';
  return `<div style="font-family:${FONT};break-inside:avoid">
    ${titleHtml(title, subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(title || 'Career timeline')}" style="display:block;max-width:100%">${axis}${bars}</svg>
    ${legend}
  </div>`;
}

// ── Data shaping from Career Master (client + server safe) ─────────────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Aug 2013" → year*12+7; a bare year → that year's `defaultMonth`. */
export function monthIndex(value, defaultMonth = 0) {
  const y = yearOf(value);
  if (!y) return null;
  const m = MONTHS.indexOf(String(value).trim().slice(0, 3).toLowerCase());
  return y * 12 + (m >= 0 ? m : defaultMonth);
}

export function yearOf(value) {
  const m = String(value || '').match(/(?:19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

/** Trend series sources the gallery offers, each computed from Career Master rows. */
export const TREND_SOURCES = Object.freeze({
  experience_years: { label: 'Cumulative years of experience', unit: ' yrs' },
  skills_added: { label: 'Skills first used, per year', unit: '' },
  tools_adopted: { label: 'Tools adopted, per year', unit: '' },
  engagements_started: { label: 'Engagements started, per year', unit: '' },
});

export function trendSeries(master, sourceKey, currentYear = new Date().getFullYear()) {
  const jobs = master?.jobs || [];
  if (sourceKey === 'experience_years') {
    // Month precision with overlapping roles merged, so concurrent roles
    // never double-count and a partial first year isn't a whole year.
    const now = new Date();
    const nowIdx = now.getFullYear() * 12 + now.getMonth();
    const intervals = jobs.map((j) => {
      const s0 = monthIndex(j.startDate, 0);
      const e0 = /present|current/i.test(String(j.endDate || '')) ? nowIdx : monthIndex(j.endDate, 11);
      return s0 != null ? [s0, Math.min(e0 ?? s0, nowIdx)] : null;
    }).filter(Boolean).sort((a, b) => a[0] - b[0]);
    if (!intervals.length) return [];
    const merged = [];
    for (const [s0, e0] of intervals) {
      const last = merged[merged.length - 1];
      if (last && s0 <= last[1] + 1) last[1] = Math.max(last[1], e0);
      else merged.push([s0, e0]);
    }
    const firstYear = Math.floor(merged[0][0] / 12);
    const out = [];
    for (let y = firstYear; y <= currentYear; y += 1) {
      const cutoff = Math.min(y * 12 + 11, nowIdx);
      const months = merged.reduce((sum, [s0, e0]) => sum + Math.max(0, Math.min(e0, cutoff) - s0 + 1), 0);
      out.push({ label: String(y), value: Math.round((months / 12) * 10) / 10 });
    }
    return out;
  }
  const perYear = (years) => {
    const counts = new Map();
    for (const y of years.filter(Boolean)) counts.set(y, (counts.get(y) || 0) + 1);
    if (!counts.size) return [];
    const ys = [...counts.keys()];
    const out = [];
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1) out.push({ label: String(y), value: counts.get(y) || 0 });
    return out;
  };
  if (sourceKey === 'skills_added') return perYear((master?.skills || []).map((s) => Number(s.firstUsed) || null));
  if (sourceKey === 'tools_adopted') return perYear((master?.tools || []).map((t) => Number(t.firstUsed) || null));
  if (sourceKey === 'engagements_started') return perYear((master?.engagements || []).map((e) => yearOf(e.period)));
  return [];
}

/** Candidate outcome tiles from engagement metrics ("$500M+ recurring revenue automated"). */
export function outcomeCandidates(master) {
  const out = [];
  for (const e of master?.engagements || []) {
    for (const m of e.metrics || []) {
      const text = String(m || '');
      const match = text.match(/(<?\$?\d[\d,.]*\s?(?:%|[KMB]\b|[KMB]\+|\+|x)?(?:\s?(?:→|->|to)\s?\$?\d[\d,.]*\s?(?:%|[KMB])?\+?)?)/i);
      if (!match) continue;
      const value = match[1].trim();
      const caption = text.replace(match[1], '').replace(/^[\s:–—-]+/, '').trim();
      out.push({ value, caption: caption || e.name, source: [e.employer, e.clientDisplayName].filter(Boolean).join(' · ') });
    }
  }
  return out;
}

export function timelineRows(master) {
  return (master?.jobs || []).map((j) => ({
    label: j.company,
    sublabel: j.title,
    start: yearOf(j.startDate),
    end: /present|current/i.test(String(j.endDate || '')) ? null : yearOf(j.endDate),
    category: j.industry || null,
  })).sort((a, b) => (a.start || 0) - (b.start || 0));
}

/** Rows for proficiencyBarsHtml from a /api/career/proficiency resolution. */
export function proficiencyRows(resolution, { entityType = 'all', groupBy = 'entity', sort = 'level' } = {}) {
  const list = (resolution?.proficiencies || []).filter((p) => entityType === 'all' || p.entityType === entityType);
  const userDefined = (b) => b === 'member_override' || b === 'member_formula';
  if (groupBy === 'category') {
    const groups = new Map();
    for (const p of list) {
      const k = p.category || 'Uncategorized';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    return [...groups.entries()].map(([label, ps]) => {
      const avg = ps.reduce((s, p) => s + p.ordinal, 0) / ps.length;
      return { label, ordinal: avg, levelLabel: `${avg.toFixed(1)} avg · ${ps.length}`, userDefined: ps.some((p) => userDefined(p.basis)), points: null };
    }).sort((a, b) => b.ordinal - a.ordinal);
  }
  if (groupBy === 'proficiencyCategory') {
    // Tools grouped by how they were used (hands-on / integration design /
    // adjacent), each group's average level.
    const groups = new Map();
    for (const p of list.filter((x) => x.proficiencyCategoryLabel)) {
      if (!groups.has(p.proficiencyCategoryLabel)) groups.set(p.proficiencyCategoryLabel, []);
      groups.get(p.proficiencyCategoryLabel).push(p);
    }
    return [...groups.entries()].map(([label, ps]) => {
      const avg = ps.reduce((s, p) => s + p.ordinal, 0) / ps.length;
      return { label, ordinal: avg, levelLabel: `${avg.toFixed(1)} avg · ${ps.length} tools`, userDefined: ps.some((p) => userDefined(p.basis)), points: null };
    }).sort((a, b) => b.ordinal - a.ordinal);
  }
  const rows = list.map((p) => ({
    label: p.label,
    ordinal: p.ordinal,
    // "Advanced · Integration design" — level, then how the tool was used.
    levelLabel: p.proficiencyCategoryLabel ? `${p.levelLabel} · ${p.proficiencyCategoryLabel}` : p.levelLabel,
    proficiencyCategory: p.proficiencyCategoryLabel || null,
    userDefined: userDefined(p.basis),
    points: p.points,
  }));
  return sort === 'alpha' ? rows.sort((a, b) => a.label.localeCompare(b.label)) : rows.sort((a, b) => b.ordinal - a.ordinal || a.label.localeCompare(b.label));
}

/** Footnote for exactly the rows a chart shows. */
export function footnoteForRows(rows) {
  const n = (rows || []).filter((r) => r.userDefined).length;
  return n ? `Proficiency levels marked † are user-defined by the member (own formula or set directly), not Salt Basin methodology-driven.` : null;
}
