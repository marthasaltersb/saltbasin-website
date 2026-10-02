// One chart, several views (2026-10-02) — used on the public QR page
// (/r/:token). Chart (static SVG from src/lib/careerCharts.js), Salt
// particles (SaltParticleChart, first rendition), and Table (the
// accessible view of the same rows). All three read the same frozen rows,
// so switching views never changes a number.
import React, { useMemo, useState } from 'react';
import { proficiencyBarsHtml, trendBarsHtml, durationTimelineHtml, CATEGORICAL } from '../lib/careerCharts.js';
import SaltParticleChart, { categoryColors } from './SaltParticleChart.jsx';

const VIEWS = [
  { key: 'chart', label: 'Chart' },
  { key: 'particles', label: 'Salt particles' },
  { key: 'table', label: 'Table' },
];

function shape(chart, currentYear) {
  if (chart.kind === 'timeline') {
    const colorOf = categoryColors(chart.rows);
    const rows = chart.rows.map((r) => ({
      rawLabel: r.label,
      label: r.label,
      sublabel: r.sublabel,
      value: Math.max(1, (r.end || currentYear) - r.start + 1),
      color: colorOf(r),
      cells: [r.label, r.sublabel || '', `${r.start}–${r.end || 'present'}`, r.category || '—'],
    }));
    return {
      columns: rows,
      staticHtml: durationTimelineHtml({ rows: chart.rows, currentYear }),
      headers: ['Organization', 'Role', 'Years', 'Industry'],
      unit: 'yrs',
    };
  }
  if (chart.kind === 'trend') {
    const rows = chart.series.map((p) => ({ rawLabel: p.label, label: p.label, value: Number(p.value), color: CATEGORICAL[0], display: `${p.value}${chart.unit || ''}`, cells: [p.label, `${p.value}${chart.unit || ''}`] }));
    return { columns: rows, staticHtml: trendBarsHtml({ series: chart.series, unit: chart.unit || '' }), headers: ['Year', 'Value'], unit: '' };
  }
  if (chart.kind === 'proficiency') {
    const rows = chart.rows.map((r) => ({
      rawLabel: r.label,
      label: `${r.label}${r.userDefined ? ' †' : ''}`,
      value: Number(r.ordinal),
      color: CATEGORICAL[0],
      display: r.levelLabel,
      cells: [`${r.label}${r.userDefined ? ' †' : ''}`, r.levelLabel || '', r.userDefined ? 'User-defined' : 'Salt Basin methodology'],
    }));
    return { columns: rows, staticHtml: proficiencyBarsHtml({ rows: chart.rows, levels: chart.levels, footnote: chart.footnote }), headers: ['Skill / tool', 'Level', 'Basis'], unit: '' };
  }
  return null;
}

export default function ChartViews({ chart, changedLabels = null }) {
  const [view, setView] = useState('chart');
  const currentYear = new Date().getFullYear();
  const shaped = useMemo(() => shape(chart, currentYear), [chart, currentYear]);
  if (!shaped) return null;
  return (
    <section style={{ border: '1px solid #E3D8C9', borderRadius: 10, padding: '1rem', marginBottom: '1rem', background: '#FFFFFF', breakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1B2A3B', fontWeight: 700 }}>{chart.title}</div>
          {chart.subtitle && <div style={{ fontSize: '0.72rem', color: '#536173', marginTop: 2 }}>{chart.subtitle}</div>}
        </div>
        <div role="group" aria-label={`${chart.title} view`} className="sb-chart-views-switch" style={{ display: 'inline-flex', background: '#F3EEE6', borderRadius: 999, padding: 3 }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              onClick={() => setView(v.key)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: 999, padding: '0.3rem 0.75rem', fontSize: '0.7rem',
                background: view === v.key ? '#1B2A3B' : 'transparent', color: view === v.key ? '#FFFFFF' : '#1B2A3B', fontWeight: view === v.key ? 700 : 500,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {view === 'chart' && <><div style={{ overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: shaped.staticHtml }} /><div className="sb-chart-swipe-hint" style={{ fontSize: '0.62rem', color: '#536173', marginTop: '0.25rem' }}>Swipe sideways on a narrow screen to see the whole chart.</div></>}
      {view === 'particles' && (
        <>
          <SaltParticleChart columns={shaped.columns} unit={shaped.unit} ariaLabel={`${chart.title} — salt particle view`} />
          {chart.footnote && <div style={{ fontSize: '0.62rem', color: '#536173', fontStyle: 'italic', marginTop: '0.4rem' }}><span style={{ color: '#C98320', fontWeight: 700 }}>†</span> {chart.footnote.replace(/^Proficiency levels marked † are /, 'Levels marked † are ')}</div>}
        </>
      )}
      {view === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr>{[...shaped.headers, ...(changedLabels ? ['Since printed'] : [])].map((h) => <th key={h} style={{ textAlign: 'left', padding: '0.35rem 0.5rem', borderBottom: '2px solid #1B2A3B', color: '#1B2A3B' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {shaped.columns.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #EEE7DC' }}>
                  {r.cells.map((c, j) => <td key={j} style={{ padding: '0.3rem 0.5rem', color: '#1B2A3B' }}>{c}</td>)}
                  {changedLabels && <td style={{ padding: '0.3rem 0.5rem', fontWeight: 700, color: changedLabels.has(`${chart.key}|${r.rawLabel}`) ? '#C98320' : '#8B95A1' }}>{changedLabels.has(`${chart.key}|${r.rawLabel}`) ? 'Changed' : 'Same'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {chart.footnote && <div style={{ fontSize: '0.62rem', color: '#536173', fontStyle: 'italic', marginTop: '0.4rem' }}>† {chart.footnote.replace(/^Proficiency levels marked † are /, 'Levels marked † are ')}</div>}
        </div>
      )}
    </section>
  );
}
