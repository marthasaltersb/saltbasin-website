// Salt particles — a first rendition of the Salt Basin "salt particle" chart
// view (2026-10-02; expected to evolve). One basin column per row; the value
// falls as grains of salt that settle into a heap. Every chart uses one
// grains-per-unit scale, so heap height stays proportional to value — the
// particles are decoration on an honest bar, never a different number.
//
// Accessibility: prefers-reduced-motion renders the settled state with no
// animation; hover/focus shows the exact value; the parent view switcher
// always offers a Table view of the same rows.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORICAL, OTHER } from '../lib/careerCharts.js';

const BASIN_TOP = '#0E1A26';
const BASIN_BOTTOM = '#1B2A3B';
const BRINE = '#C98320';
const LABEL = '#EAE4D6';
const LABEL_MUTED = '#9FB1C1';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Deterministic PRNG so a chart settles the same way every time it's viewed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * columns: [{ label, value, color?, display? }] — value in one unit family.
 */
export default function SaltParticleChart({ columns, unit = '', height = 280, ariaLabel = 'Salt particle chart' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  const hoverRef = useRef(null);
  const drawRef = useRef(null); // redraws the settled frame (hover changes never restart the fall)
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const cols = (columns || []).filter((c) => Number(c.value) > 0);
    const n = Math.max(cols.length, 1);
    const padX = 16;
    const labelH = 34;
    const topPad = 22;
    const basinH = height - labelH - topPad;
    const slot = (width - padX * 2) / n;
    const colW = Math.min(46, slot * 0.62);
    const grain = Math.max(2.2, Math.min(3.4, colW / 11));
    const perRow = Math.max(3, Math.floor(colW / (grain * 1.15)));
    const maxValue = Math.max(...cols.map((c) => Number(c.value)), 1);
    // grains per unit chosen so the tallest heap fills ~92% of the basin
    const rowsAvailable = Math.floor((basinH * 0.92) / (grain * 1.05));
    const grainsPerUnit = Math.max(1, Math.floor((rowsAvailable * perRow) / maxValue));
    const rand = mulberry32(cols.length * 7919 + Math.round(maxValue * 31));
    const grains = [];
    cols.forEach((c, ci) => {
      const cx = padX + slot * ci + (slot - colW) / 2;
      const count = Math.round(Number(c.value) * grainsPerUnit);
      const rgb = hexToRgb(c.color || CATEGORICAL[ci % CATEGORICAL.length]);
      for (let g = 0; g < count; g += 1) {
        const row = Math.floor(g / perRow);
        const col = g % perRow;
        const tx = cx + col * (colW / perRow) + (rand() - 0.5) * grain * 0.6 + grain / 2;
        const ty = topPad + basinH - row * grain * 1.05 - grain / 2 + (rand() - 0.5) * grain * 0.4;
        const tint = 0.25 + rand() * 0.35; // crystalline white tinted toward the category hue
        const color = `rgb(${Math.round(255 - (255 - rgb[0]) * tint)},${Math.round(255 - (255 - rgb[1]) * tint)},${Math.round(255 - (255 - rgb[2]) * tint)})`;
        grains.push({
          tx, ty, color,
          size: grain * (0.75 + rand() * 0.45),
          sx: tx + (rand() - 0.5) * colW * 1.4,
          delay: row * 18 + rand() * 260 + ci * 40,
          sparkle: rand() < 0.08,
        });
      }
    });
    const heaps = cols.map((c, ci) => {
      const cx = padX + slot * ci + (slot - colW) / 2;
      const rowsUsed = Math.ceil((Number(c.value) * grainsPerUnit) / perRow);
      return { ...c, x: cx, w: colW, top: topPad + basinH - rowsUsed * grain * 1.05, slotX: padX + slot * ci, slotW: slot };
    });
    return { grains, heaps, topPad, basinH, labelH };
  }, [columns, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let frame = 0;
    let start = null;
    const duration = 2600;

    function drawStatic() {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, BASIN_TOP);
      g.addColorStop(1, BASIN_BOTTOM);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      // basin floor
      ctx.strokeStyle = 'rgba(234,228,214,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, layout.topPad + layout.basinH + 1);
      ctx.lineTo(width - 10, layout.topPad + layout.basinH + 1);
      ctx.stroke();
    }

    function drawLabels(progress) {
      ctx.textAlign = 'center';
      layout.heaps.forEach((h, i) => {
        const cx = h.x + h.w / 2;
        const active = hoverRef.current === i;
        ctx.fillStyle = active ? '#FFFFFF' : LABEL;
        ctx.font = `${active ? 700 : 500} 10.5px Helvetica, Arial, sans-serif`;
        const label = h.label.length > 16 ? `${h.label.slice(0, 15)}…` : h.label;
        ctx.fillText(label, cx, layout.topPad + layout.basinH + 15);
        if (h.sublabel) {
          ctx.fillStyle = LABEL_MUTED;
          ctx.font = '9px Helvetica, Arial, sans-serif';
          ctx.fillText(h.sublabel.length > 18 ? `${h.sublabel.slice(0, 17)}…` : h.sublabel, cx, layout.topPad + layout.basinH + 27);
        }
        if (progress >= 1) {
          // brine line + value on the settled heap
          ctx.strokeStyle = BRINE;
          ctx.globalAlpha = active ? 1 : 0.7;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(h.x - 2, h.top - 2);
          ctx.lineTo(h.x + h.w + 2, h.top - 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = active ? '#FFFFFF' : LABEL;
          ctx.font = '700 11px Helvetica, Arial, sans-serif';
          ctx.fillText(h.display ?? `${h.value}${unit ? ` ${unit}` : ''}`, cx, h.top - 7);
        }
      });
    }

    function render(ts) {
      if (start == null) start = ts;
      const elapsed = reduceMotion || ts === Number.POSITIVE_INFINITY ? Infinity : ts - start;
      drawStatic();
      for (const p of layout.grains) {
        const t = Math.max(0, Math.min(1, (elapsed - p.delay) / 900));
        if (t <= 0) continue;
        const ease = 1 - Math.pow(1 - t, 3);
        const x = p.sx + (p.tx - p.sx) * ease;
        const y = -6 + (p.ty + 6) * ease;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.55 + 0.45 * t;
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
        if (p.sparkle && t >= 1) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x - p.size / 4, y - p.size / 4, p.size / 2, p.size / 2);
        }
      }
      ctx.globalAlpha = 1;
      const maxDelay = layout.grains.reduce((m, p) => Math.max(m, p.delay), 0);
      const progress = elapsed === Infinity ? 1 : Math.min(1, elapsed / (maxDelay + 900 || duration));
      drawLabels(progress);
      if (progress < 1) frame = requestAnimationFrame(render);
      else drawRef.current = () => { start = null; render(Number.POSITIVE_INFINITY); };
    }
    drawRef.current = null;
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [layout, width, height, reduceMotion, unit]);

  useEffect(() => {
    hoverRef.current = hover;
    drawRef.current?.();
  }, [hover]);

  function onMove(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = layout.heaps.findIndex((h) => x >= h.slotX && x < h.slotX + h.slotW);
    setHover(idx >= 0 ? idx : null);
  }

  const hovered = hover != null ? layout.heaps[hover] : null;
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height, display: 'block', borderRadius: 8, cursor: 'crosshair' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      {hovered && (
        <div style={{ position: 'absolute', left: Math.min(Math.max(hovered.x + hovered.w / 2 - 70, 4), width - 144), top: Math.max(hovered.top - 52, 4), width: 140, background: 'rgba(255,255,255,0.97)', color: '#1B2A3B', borderRadius: 6, padding: '0.35rem 0.5rem', fontSize: '0.7rem', boxShadow: '0 6px 18px rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700 }}>{hovered.label}</div>
          {hovered.sublabel && <div style={{ color: '#536173' }}>{hovered.sublabel}</div>}
          <div>{hovered.display ?? `${hovered.value}${unit ? ` ${unit}` : ''}`}</div>
        </div>
      )}
    </div>
  );
}

/** Category colours for particle columns, matching the static chart's slots. */
export function categoryColors(rows) {
  const cats = [];
  for (const r of rows) if (!cats.includes(r.category || 'Other')) cats.push(r.category || 'Other');
  return (r) => {
    const c = r.category || 'Other';
    const i = cats.indexOf(c);
    return c === 'Other' || i >= CATEGORICAL.length ? OTHER : CATEGORICAL[i];
  };
}
