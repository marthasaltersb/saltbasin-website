// Release intelligence trend charts (2026-10-02). Pure functions returning
// SVG/HTML strings in the same styling as careerCharts.js (same tokens, the
// same validated categorical palette, 24px max bars with a rounded data end,
// 2px surface gaps, an SVG <title> on every mark). One value axis per chart.
//
// "Not recorded" is its own state: a release whose source recorded no tokens
// or time draws an "n/r" marker at the baseline, never a zero-height bar.
import { CHART_TOKENS, CATEGORICAL, OTHER, esc } from './careerCharts.js';

const FONT = "Helvetica, Arial, 'DejaVu Sans', sans-serif";

export function compact(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return '';
  const a = Math.abs(x);
  if (a >= 1e9) return `${+(x / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${+(x / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${+(x / 1e3).toFixed(0)}k`;
  if (a >= 1e3) return `${+(x / 1e3).toFixed(1)}k`;
  return `${+x.toFixed(2)}`;
}

function niceMax(max) {
  if (!(max > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const f = max / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

function topRounded(x, yBase, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  const top = yBase - h;
  return `M${x},${yBase} V${top + rr} Q${x},${top} ${x + rr},${top} H${x + w - rr} Q${x + w},${top} ${x + w},${top + rr} V${yBase} Z`;
}

export function seriesColor(index, key) {
  return key === 'other' ? OTHER : CATEGORICAL[index % CATEGORICAL.length];
}

/**
 * Fold a {key: value} breakdown into at most `max` series plus "other".
 * Rows: [{ key, values: [...] }]; the largest totals are kept.
 */
export function foldSeries(rows, max) {
  const total = (r) => r.values.reduce((s, v) => s + (v || 0), 0);
  const sorted = [...rows].sort((a, b) => total(b) - total(a));
  if (sorted.length <= max) return sorted;
  const keep = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1);
  const values = rest[0].values.map((_, i) => {
    const vals = rest.map((r) => r.values[i]).filter((v) => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) : null;
  });
  return [...keep, { key: 'other', label: `Other (${rest.length})`, values }];
}

/**
 * categories: [{ key, label, tip }]   (one per release, oldest first)
 * series:     [{ key, label, values: [number|null per category] }]
 * selectedIndex: highlights one category; axis label names the unit.
 */
export function stackedBarsHtml({ title, subtitle, categories, series, unit = '', axisLabel = '', selectedIndex = -1, emptyMessage = 'Nothing recorded yet.', formatValue = compact, valueDigits = 2 }) {
  const head = `<div style="margin-bottom:0.55rem;font-family:${FONT}">
    <div style="font-size:0.66rem;letter-spacing:0.12em;text-transform:uppercase;color:${CHART_TOKENS.ink};font-weight:700">${esc(title)}</div>
    ${subtitle ? `<div style="font-size:0.68rem;color:${CHART_TOKENS.secondary};margin-top:0.15rem">${esc(subtitle)}</div>` : ''}</div>`;
  const cats = categories || [];
  const ser = (series || []).filter((s) => s.values.some((v) => v != null));
  if (!cats.length || !ser.length) {
    return `<div style="font-family:${FONT}">${head}<div role="status" style="font-size:0.72rem;color:${CHART_TOKENS.muted};padding:0.75rem;border:1px dashed ${CHART_TOKENS.grid};border-radius:6px">${esc(emptyMessage)}</div></div>`;
  }
  const W = 560; const H = 250; const padL = 52; const padR = 10; const padT = 16; const padB = 74;
  const plotW = W - padL - padR; const plotH = H - padT - padB;
  const totals = cats.map((_, i) => {
    const vals = ser.map((s) => s.values[i]).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  });
  const max = niceMax(Math.max(...totals.map((t) => t || 0), 0));
  const band = plotW / cats.length; const barW = Math.min(24, band - 6);
  const yOf = (v) => padT + plotH - (v / max) * plotH;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = max * f; const y = yOf(v);
    return `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" stroke="${f === 0 ? CHART_TOKENS.muted : CHART_TOKENS.grid}" stroke-width="1"/>
      <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="10" fill="${CHART_TOKENS.secondary}" font-family="${FONT}">${esc(formatValue(v))}</text>`;
  }).join('');
  const marks = cats.map((c, i) => {
    const x = padL + i * band + (band - barW) / 2;
    const cx = padL + i * band + band / 2;
    const sel = i === selectedIndex;
    const bandBg = sel ? `<rect x="${padL + i * band}" y="${padT}" width="${band}" height="${plotH}" fill="${CHART_TOKENS.track}"/>` : '';
    let body = '';
    if (totals[i] == null) {
      body = `<text x="${cx}" y="${padT + plotH - 4}" text-anchor="middle" font-size="9" fill="${CHART_TOKENS.muted}" font-family="${FONT}">n/r</text>`;
    } else {
      let acc = 0;
      const segs = ser.map((s, si) => ({ s, si, v: s.values[i] })).filter((x2) => x2.v != null && x2.v > 0);
      body = segs.map((seg, k) => {
        const h = (seg.v / max) * plotH; const yBase = padT + plotH - (acc / max) * plotH; acc += seg.v;
        const fill = ser.length === 1 ? CATEGORICAL[0] : seriesColor(seg.si, seg.s.key);
        const isTop = k === segs.length - 1;
        const gap = k > 0 ? 2 : 0;
        const hh = Math.max(h - gap, 0.5);
        const tip = `${c.tip || c.label} — ${ser.length > 1 ? `${seg.s.label}: ` : ''}${Number(seg.v).toLocaleString('en-US', { maximumFractionDigits: valueDigits })}${unit ? ` ${Number(seg.v) === 1 && unit.endsWith('s') ? unit.slice(0, -1) : unit}` : ''}`;
        return isTop
          ? `<path d="${topRounded(x, yBase - gap, barW, hh)}" fill="${fill}"><title>${esc(tip)}</title></path>`
          : `<rect x="${x}" y="${yBase - gap - hh}" width="${barW}" height="${hh}" fill="${fill}"><title>${esc(tip)}</title></rect>`;
      }).join('');
      if (!segs.length) body = `<text x="${cx}" y="${padT + plotH - 4}" text-anchor="middle" font-size="9" fill="${CHART_TOKENS.muted}" font-family="${FONT}">0</text>`;
    }
    const label = c.label.length > 12 ? c.label.slice(0, 11) + '…' : c.label;
    return `<g>${bandBg}<title>${esc(c.tip || c.label)}</title>${body}
      <text transform="translate(${cx},${padT + plotH + 12}) rotate(-35)" text-anchor="end" font-size="10" font-family="${FONT}" fill="${sel ? CHART_TOKENS.ink : CHART_TOKENS.secondary}" ${sel ? 'font-weight="700"' : ''}>${esc(label)}</text></g>`;
  }).join('');
  const axisTitle = axisLabel ? `<text x="${padL}" y="10" font-size="10" fill="${CHART_TOKENS.secondary}" font-family="${FONT}">${esc(axisLabel)}</text>` : '';
  const legend = ser.length > 1
    ? `<div style="font-size:0.62rem;color:${CHART_TOKENS.secondary};margin-top:0.35rem">${ser.map((s, si) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${seriesColor(si, s.key)}"></span>${esc(s.label)}</span>`).join('')}</div>`
    : '';
  const hasNr = totals.some((t) => t == null);
  const note = hasNr ? `<div style="font-size:0.6rem;color:${CHART_TOKENS.secondary};margin-top:0.3rem;font-style:italic">n/r = nothing recorded for that release (shown as a gap, never as zero).</div>` : '';
  return `<div style="font-family:${FONT};break-inside:avoid">${head}
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(title)}" style="display:block;max-width:100%">${axisTitle}${grid}${marks}</svg>
    ${legend}${note}</div>`;
}
