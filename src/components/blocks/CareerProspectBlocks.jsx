// Career Prospect layout blocks — config-driven, built from the "Salt Basin
// Career Member Prospect Experience" brand-kit reference (2026-07-16). Every
// block reads exclusively from section.fields, same contract as every other
// block in ./index.jsx. careerRollupShowcase is the one exception to "no
// hardcoded copy, no external data" — it's explicitly data-driven from the
// member's own Career Master (via the Career Channel Rod, see
// server/lib/careerAtomRollups.js), by design: zero manual typing required.
import React from 'react';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';

const BG_VAR = { ivory: 'var(--sb-ivory)', navy: 'var(--sb-navy)', linen: 'var(--sb-linen)', teal: 'var(--sb-teal)', cream: 'var(--sb-cream)' };

function resolveThemeColors() {
  if (typeof window === 'undefined') return null;
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => {
    const v = style.getPropertyValue(name).trim();
    return v || fallback;
  };
  // Same 4 hues the reference mockup's orbit uses, resolved from whichever
  // theme is currently active rather than hardcoded — theme-aware per the
  // regression-gate audit finding on SaltBasinCrystal's ORBIT_COLORS.
  return [read('--sb-teal', '#4A7C8E'), read('--sb-teal-deep', '#345A68'), read('--sb-gold', '#C4843A'), read('--sb-taupe', '#DAD3CE')]
    .map((hex) => parseInt(hex.replace('#', ''), 16));
}

export function CareerHeroOrbitBlock({ section }) {
  const f = section.fields || {};
  const bg = BG_VAR[section.bg] || 'var(--sb-cream)';
  const badges = Array.isArray(f.statBadges) ? f.statBadges : [];
  const [orbitColors, setOrbitColors] = React.useState(null);
  React.useEffect(() => { setOrbitColors(resolveThemeColors()); }, []);

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '3rem', alignItems: 'center' }}>
        <div>
          {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.75rem' }}>{f.eyebrow}</p>}
          {f.heading && <h1 className="sb-display" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', letterSpacing: '-0.02em', margin: '0 0 1rem', color: 'var(--sb-navy)' }}>{f.heading}</h1>}
          {f.lede && <p style={{ maxWidth: 640, fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--sb-teal-deep)' }}>{f.lede}</p>}
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', fontSize: '0.7rem', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--sb-teal-deep)' }}>
              {badges.map((b, i) => <span key={i}>{b.label}</span>)}
            </div>
          )}
        </div>
        <div style={{ height: 320, position: 'relative' }}>
          <SaltBasinCrystal size="hero" orbitCount={4} orbitColorOverride={orbitColors} autoRotate />
        </div>
      </div>
    </section>
  );
}

export function CareerLensTabsBlock({ section }) {
  const f = section.fields || {};
  const bg = BG_VAR[section.bg] || 'var(--sb-linen)';
  const tabs = Array.isArray(f.lensTabs) ? f.lensTabs : [];
  const [active, setActive] = React.useState(0);
  const current = tabs[active] || tabs[0] || {};

  if (!tabs.length) return null;

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.1rem', color: 'var(--sb-navy)', marginBottom: '1.5rem' }}>{f.heading}</h2>}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: '0.6rem 1.1rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                fontFamily: 'var(--sb-font-label)', border: `1px solid ${i === active ? 'var(--sb-gold)' : 'rgba(74,124,142,0.3)'}`,
                background: i === active ? 'var(--sb-gold)' : 'transparent',
                color: i === active ? 'var(--sb-ivory)' : 'var(--sb-teal-deep)',
              }}
            >
              {t.tabLabel || `Tab ${i + 1}`}
            </button>
          ))}
        </div>
        <div style={{ padding: '2rem', borderRadius: 18, background: 'var(--sb-ivory)', border: '1px solid rgba(74,124,142,0.18)' }}>
          {current.kicker && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{current.kicker}</p>}
          {current.title && <h3 className="sb-display" style={{ fontSize: '1.5rem', color: 'var(--sb-navy)', margin: '0 0 0.75rem' }}>{current.title}</h3>}
          {current.copy && <p style={{ color: '#555', lineHeight: 1.7, maxWidth: 760 }}>{current.copy}</p>}
        </div>
      </div>
    </section>
  );
}

const CHART_COLORS = ['var(--sb-teal)', 'var(--sb-gold)', 'var(--sb-teal-deep)', 'var(--sb-gold-warm)', 'var(--sb-dusty)'];

function BarChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {rows.map((r, i) => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 150, fontSize: '0.76rem', color: '#555', flexShrink: 0 }}>{r.label}</div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 3, height: 12, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((r.value / max) * 100)}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
          </div>
          <div style={{ width: 24, fontSize: '0.74rem', fontWeight: 700, color: 'var(--sb-navy)' }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function ListChart({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
      {rows.map((r) => (
        <div key={r.key} style={{ padding: '0.7rem 0.9rem', background: 'var(--sb-ivory)', border: '1px solid rgba(74,124,142,0.18)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sb-navy)' }}>{r.label}</div>
          <div style={{ fontSize: '0.7rem', color: '#777', marginTop: 2 }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function MeterChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
      {rows.map((r, i) => (
        <div key={r.key} style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 0.5rem', borderRadius: '50%', background: `conic-gradient(${CHART_COLORS[i % CHART_COLORS.length]} ${Math.round((r.value / max) * 360)}deg, rgba(0,0,0,0.08) 0)` }}>
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'var(--sb-ivory)', display: 'grid', placeItems: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'var(--sb-navy)' }}>{r.value}</div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#555' }}>{r.label}</div>
        </div>
      ))}
    </div>
  );
}

// dataSource-aware groupBy → catalog-key translation. `career` is exactly
// the pre-existing mapping (unchanged) so any section without a
// `dataSource` field (every section that predates this generalization)
// resolves identically to before. Mirrors server/lib/dataSourceRegistry.js's
// `groupKeys`/`defaultGroupBy` per data source.
const GROUP_KEYS_BY_SOURCE = {
  career: { skills: 'skills_by_category', industry: 'jobs_by_industry', tools: 'tools_by_wheel_bucket' },
  content_activity: { by_action: 'content_activity_by_action' },
};
const DEFAULT_GROUP_BY_SOURCE = { career: 'skills', content_activity: 'by_action' };
const CHART_RENDERERS = { bar: BarChart, list: ListChart, meter: MeterChart };

export function CareerRollupShowcaseBlock({ section, memberSlug }) {
  const f = section.fields || {};
  const bg = BG_VAR[section.bg] || 'var(--sb-ivory)';
  const dataSource = f.dataSource || 'career';
  const groupBy = f.groupBy || DEFAULT_GROUP_BY_SOURCE[dataSource] || 'skills';
  const chartType = f.chartType || 'bar';
  const [catalog, setCatalog] = React.useState(null);

  React.useEffect(() => {
    const ownerParam = memberSlug ? `?owner=${encodeURIComponent(memberSlug)}` : '';
    fetch(`/api/data-sources/${encodeURIComponent(dataSource)}/rollup${ownerParam}`).then((r) => r.json()).then(setCatalog).catch(() => setCatalog(null));
  }, [memberSlug, dataSource]);

  const catalogKey = (GROUP_KEYS_BY_SOURCE[dataSource] || {})[groupBy] || 'skills_by_category';
  const rows = catalog?.[catalogKey] || [];
  const ChartRenderer = CHART_RENDERERS[chartType] || BarChart;

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.1rem', color: 'var(--sb-navy)', marginBottom: '0.75rem' }}>{f.heading}</h2>}
        {f.intro && <p style={{ color: '#555', maxWidth: 700, marginBottom: '2rem' }}>{f.intro}</p>}

        {!catalog ? (
          <div style={{ fontSize: '0.85rem', color: '#777' }}>Loading career data…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#777', fontSize: '0.85rem', border: '1px dashed rgba(74,124,142,0.3)', borderRadius: 12 }}>
            No career data yet — add entries to your Career Master to populate this section.
          </div>
        ) : (
          <ChartRenderer rows={rows} />
        )}
      </div>
    </section>
  );
}

export function CareerJourneyStepperBlock({ section }) {
  const f = section.fields || {};
  const bg = BG_VAR[section.bg] || 'var(--sb-linen)';
  const stages = Array.isArray(f.stages) ? f.stages : [];
  if (!stages.length) return null;

  return (
    <section id={section.id} style={{ background: bg, padding: '5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {f.eyebrow && <p className="sb-eyebrow" style={{ marginBottom: '0.5rem' }}>{f.eyebrow}</p>}
        {f.heading && <h2 className="sb-display" style={{ fontSize: '2.1rem', color: 'var(--sb-navy)', marginBottom: '2rem' }}>{f.heading}</h2>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: '0.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '5%', right: '5%', top: 24, height: 2, background: 'var(--sb-teal)', zIndex: 0 }} />
          {stages.map((s, i) => (
            <div key={i} style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
              <div
                style={{
                  width: 48, height: 48, margin: '0 auto', clipPath: 'polygon(50% 0,92% 25%,86% 76%,50% 100%,14% 76%,8% 25%)',
                  background: `linear-gradient(135deg, var(--sb-teal), var(--sb-gold))`,
                  color: 'var(--sb-ivory)', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--sb-navy)' }}>{s.label}</div>
              {s.sublabel && <div style={{ fontSize: '0.68rem', color: '#777' }}>{s.sublabel}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
