import React from 'react';

// Emotional Weather — Phase 3 placeholder.
// Concept: a qualitative signal layer for platform/org health that maps
// "invisible organizational weather" — the human conditions under which
// platforms fail or thrive. Future build will allow operators to log
// weather conditions, track patterns, and correlate with output quality.

const WEATHER_CONDITIONS = [
  { emoji: '🌤', label: 'Clearing', description: 'Momentum is building. Resistance present but decreasing.' },
  { emoji: '⛅', label: 'Partly Cloudy', description: 'Mixed signals. Some clarity, some ambiguity in motion.' },
  { emoji: '🌧', label: 'Heavy Rain', description: 'High friction. Progress is slow; people are under pressure.' },
  { emoji: '🌪', label: 'Turbulent', description: 'Unstable conditions. Decisions are being made under duress.' },
  { emoji: '☀️', label: 'Clear Skies', description: 'High alignment. Energy is focused and motion is easy.' },
  { emoji: '🌫', label: 'Fog', description: 'Low visibility. Strategic direction is unclear or contested.' },
  { emoji: '⚡', label: 'Lightning', description: 'A forcing event. Something is about to change fast.' },
  { emoji: '🌈', label: 'After the Storm', description: 'Post-disruption clarity. New ground is being established.' },
];

export default function EmotionalWeatherPanel() {
  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.25rem' }}>HERQ · Unified Foundational Layer</div>
        <div style={{ fontSize: '1.6rem', fontFamily: 'var(--sb-font-display)', color: 'var(--sb-cream)', fontWeight: 300, marginBottom: '0.35rem' }}>Emotional Weather</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--sb-dusty)', lineHeight: 1.7, maxWidth: 640 }}>
          The qualitative signal layer beneath platform metrics. Emotional Weather tracks the human conditions under which enterprise platforms succeed or fail — not in dashboards, but in the room where decisions happen.
        </div>
      </div>

      {/* Phase note */}
      <div style={{ padding: '1rem 1.25rem', background: 'rgba(196,132,58,0.06)', border: '0.5px dashed rgba(196,132,58,0.3)', borderRadius: 2, marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>Phase 4 Build</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--sb-dusty)', lineHeight: 1.65 }}>
          Full implementation will allow operators to log a weather condition with a timestamp, context note, and linked platform event. Patterns will be surfaced in the analytics hub and correlated with output velocity and governance escalations.
        </div>
      </div>

      {/* Weather condition reference grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.85rem' }}>Condition Reference</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {WEATHER_CONDITIONS.map(w => (
            <div key={w.label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(196,132,58,0.18)', borderRadius: 2, padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{w.emoji}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sb-cream)', marginBottom: '0.2rem' }}>{w.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sb-dusty)', lineHeight: 1.5 }}>{w.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HERQ Connection */}
      <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(196,132,58,0.12)', borderRadius: 2 }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', marginBottom: '0.5rem' }}>The HERQ Connection</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--sb-dusty)', lineHeight: 1.7 }}>
          Every HERQ question is asked in a weather condition. A <em style={{ color: 'var(--sb-cream)' }}>Hot Elephant Resident Question</em> lands differently in fog than in clear skies. Emotional Weather gives context to why some questions get answered and others get buried — and makes the pattern visible across time.
        </div>
      </div>
    </div>
  );
}
