import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { resolveExperience, STAGE_ORDER, STAGE_DEFS, STAGE_METRICS, METRIC_DEFS } from '../../lib/experienceEngine/lonetreeExperience.js';

// Lonetree MVP — Interaction Layer v1 (2026-07-29, per Betsy's "20% of the
// way there" feedback): every semantic object shares one click/inspect model
// resolved by the Experience Engine (src/lib/experienceEngine/
// lonetreeExperience.js); highway segments flow with particles; a click
// re-contextualizes the whole screen (highlight/dim) instead of opening an
// isolated drawer; the docked Inspector renders every object through the same
// section order (Purpose / Definition / Current State / Confidence / Evidence
// / Dependencies / Related Journeys / Actions / Open Orbit). All traces are
// prefetched so focus changes never load — they re-contextualize.

const fmtPct = (n) => (n === null || n === undefined ? '—' : `${(Number(n) * 100).toFixed(1)}%`);

const SB_GOLD = '#C4843A', SB_GOLD_300 = '#DDAA66', SB_GOLD_700 = '#9C6329';
const SB_TEAL = '#4A7C8E', SB_TEAL_300 = '#8FADB6';

const STAGE_GLOW = {
  commercial: SB_GOLD,
  operational: SB_TEAL,
  financial: SB_TEAL_300,
  'enterprise-value': SB_GOLD_300,
  recommendations: SB_GOLD_700,
};

// Node centers as % of highway width — used by both the nodes and the
// flowing segments so they always align.
const STAGE_X = STAGE_ORDER.map((_, i) => 8 + (84 / (STAGE_ORDER.length - 1)) * i);

function GlobalStyle() {
  return (
    <style>{`
      @keyframes sb-lt-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes sb-lt-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes sb-lt-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
      @keyframes sb-lt-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes sb-lt-flow {
        0% { left: var(--from); opacity: 0; }
        12% { opacity: var(--peak, 0.9); }
        88% { opacity: var(--peak, 0.9); }
        100% { left: var(--to); opacity: 0; }
      }
      .sb-lt-node { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, opacity 0.3s ease; cursor: pointer; }
      .sb-lt-node:hover { transform: translateY(-4px) scale(1.03); }
      .sb-lt-node.active { transform: translateY(-6px) scale(1.06); }
      .sb-lt-fadein { animation: sb-lt-fadein 0.35s ease both; }
      .sb-lt-glow-dot { animation: sb-lt-pulse 2.4s ease-in-out infinite; }
      .sb-lt-panel-enter { animation: sb-lt-fadein 0.3s ease both; }
      .sb-lt-breathe { animation: sb-lt-breathe 4.5s ease-in-out infinite; }
      .sb-lt-chip { transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.3s ease, border-color 0.3s ease; cursor: pointer; }
      .sb-lt-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(196,132,58,0.25); }
      .sb-lt-dim { opacity: 0.3; }
      .sb-lt-particle { position: absolute; border-radius: 50%; pointer-events: none; animation: sb-lt-flow var(--dur, 3.2s) linear infinite; }
      .sb-lt-crumb { cursor: pointer; transition: color 0.2s ease; }
      .sb-lt-crumb:hover { color: var(--sb-gold); }
      .sb-lt-ev-row { cursor: default; transition: background 0.15s ease; }
      .sb-lt-ev-row.focusable { cursor: pointer; }
      .sb-lt-ev-row.focusable:hover { background: rgba(196,132,58,0.08); }
    `}</style>
  );
}

// A living circle: breathing body, confidence progress ring, orbiting
// evidence dots, status pulse. "Tiny motion. Nothing distracting."
function LivingCircle({ size = 54, glow, confidence, evidenceDots = 0, focused, children }) {
  const r = size / 2 - 3;
  const C = 2 * Math.PI * r;
  const conf = confidence === null || confidence === undefined ? null : Math.max(0, Math.min(1, confidence));
  const dots = Math.min(evidenceDots, 6);
  return (
    <div className="sb-lt-breathe" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${glow}33`} strokeWidth="2" />
        {conf !== null && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={glow} strokeWidth="2.5"
            strokeDasharray={`${conf * C} ${C}`} strokeLinecap="round" />
        )}
      </svg>
      <div className={focused ? 'sb-lt-glow-dot' : ''} style={{
        position: 'absolute', inset: 5, borderRadius: '50%',
        background: `radial-gradient(circle, ${glow}${focused ? '4d' : '2b'}, transparent 72%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: glow, fontFamily: 'var(--sb-font-label)', fontSize: size > 44 ? '0.82rem' : '0.7rem',
        boxShadow: focused ? `0 0 22px ${glow}88` : 'none', transition: 'box-shadow 0.3s ease',
      }}>
        {children}
      </div>
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', inset: -4, pointerEvents: 'none',
          animation: `sb-lt-orbit ${9 + i * 2.4}s linear infinite`,
          animationDelay: `${-(9 + i * 2.4) * (i / dots)}s`,
        }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: 4, marginLeft: -2, borderRadius: '50%', background: glow, opacity: 0.8 }} />
        </div>
      ))}
    </div>
  );
}

// Scripted demonstration playback (usage decline -> fund economics). The
// steps come entirely from /api/lonetree-mvp/demonstration — the UI owns no
// scenario math. Each step simply sets focus, so the same Experience Engine
// that handles manual clicks drives the guided tour: the pulse "travels"
// because focus moves stage by stage.
function DemonstrationRibbon({ demo, onExit }) {
  const step = demo.steps[demo.idx];
  const glow = STAGE_GLOW[step.stage] || SB_GOLD;
  return (
    <div className="sb-lt-panel-enter" style={{
      position: 'sticky', bottom: 0, marginTop: '1.5rem',
      background: 'var(--sb-navy-deep)', border: `0.5px solid ${glow}66`, borderRadius: 12,
      boxShadow: `0 -4px 24px rgba(0,0,0,0.35), 0 0 18px ${glow}22`, padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <div className="sb-lt-glow-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: glow, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: glow }}>
            {STAGE_DEFS[step.stage]?.label || step.stage} · step {demo.idx + 1}/{demo.steps.length}
          </span>
          <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.9rem', color: 'var(--sb-cream)' }}>{step.title}</span>
          {step.delta && <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.85rem', color: glow }}>{step.delta}</span>}
        </div>
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.78rem', lineHeight: 1.45 }}>{step.narration}</div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
        {[
          { label: '‹', action: 'prev', disabled: demo.idx === 0 },
          { label: demo.playing ? '⏸' : '▶', action: 'toggle' },
          { label: '›', action: 'next', disabled: demo.idx >= demo.steps.length - 1 },
          { label: '✕', action: 'exit' },
        ].map((b) => (
          <button key={b.action}
            onClick={() => onExit(b.action)}
            disabled={b.disabled}
            style={{
              background: 'none', border: `0.5px solid ${b.disabled ? 'rgba(196,132,58,0.2)' : glow + '88'}`,
              borderRadius: 6, color: b.disabled ? 'var(--sb-dusty)' : 'var(--sb-cream)',
              cursor: b.disabled ? 'default' : 'pointer', padding: '0.3rem 0.65rem', fontSize: '0.8rem',
            }}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Breadcrumb({ crumbs, onFocus }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'rgba(196,132,58,0.5)' }}>›</span>}
          <span
            className="sb-lt-crumb"
            style={{ color: i === crumbs.length - 1 ? 'var(--sb-gold)' : 'var(--sb-dusty)' }}
            onClick={() => onFocus(c.focus)}
          >
            {c.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function Landing({ onBegin }) {
  return (
    <div className="sb-lt-fadein" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', gap: '1.5rem' }}>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
        Salt Basin — Operational Intelligence
      </div>
      <h1 style={{ fontFamily: 'var(--sb-font-display, serif)', fontSize: '2.2rem', color: 'var(--sb-cream)', margin: 0, maxWidth: 560 }}>
        Welcome to the LoneTree Operational Intelligence Demo
      </h1>
      <p style={{ color: 'var(--sb-dusty)', maxWidth: 480 }}>Select a portfolio company to begin the diagnostic — watch the business come alive.</p>
      <div
        className="sb-lt-node"
        onClick={onBegin}
        style={{
          border: '1px solid var(--sb-gold)', borderRadius: 999, padding: '1rem 2.5rem',
          color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase',
          fontSize: '0.85rem', background: 'rgba(196,132,58,0.08)',
        }}
      >
        ○ Veradigm — Explore
      </div>
      <div style={{ color: 'var(--sb-dusty)', fontSize: '0.75rem' }}>Begin Diagnostic → Watch the Business Come Alive</div>
    </div>
  );
}

// The highway is a river: every segment carries continuously flowing
// particles; highlighted segments run brighter and faster, so a focus change
// visibly propagates downstream (Commercial -> Operational -> Financial ...).
function FlowingHighway({ highlightStages, expandedStage, onSelect, hoveredStage, setHoveredStage }) {
  return (
    <div style={{ position: 'relative', height: 96, margin: '0.5rem 0 1.5rem' }}>
      {STAGE_ORDER.slice(0, -1).map((key, i) => {
        const from = STAGE_X[i], to = STAGE_X[i + 1];
        const active = highlightStages.has(key) || highlightStages.has(STAGE_ORDER[i + 1]);
        const glow = STAGE_GLOW[STAGE_ORDER[i + 1]];
        return (
          <React.Fragment key={key}>
            <div style={{
              position: 'absolute', top: 13, left: `${from}%`, width: `${to - from}%`, height: 2,
              background: active ? `linear-gradient(90deg, ${STAGE_GLOW[key]}66, ${glow}99)` : 'rgba(196,132,58,0.18)',
              boxShadow: active ? `0 0 8px ${glow}55` : 'none', transition: 'background 0.4s ease, box-shadow 0.4s ease',
            }} />
            {[0, 1, 2].map((p) => (
              <div key={p} className="sb-lt-particle" style={{
                top: 12, width: active ? 5 : 3, height: active ? 5 : 3, background: glow,
                '--from': `${from}%`, '--to': `${to}%`,
                '--dur': active ? '2.1s' : '4.2s', '--peak': active ? 1 : 0.45,
                animationDelay: `${-(p * (active ? 0.7 : 1.4))}s`,
                boxShadow: active ? `0 0 6px ${glow}` : 'none',
              }} />
            ))}
          </React.Fragment>
        );
      })}
      {STAGE_ORDER.map((key, i) => {
        const stage = STAGE_DEFS[key];
        const glow = STAGE_GLOW[key];
        const isExpanded = expandedStage === key;
        const isLit = highlightStages.has(key);
        const isHovered = hoveredStage === key;
        return (
          <div
            key={key}
            className={`sb-lt-node${isExpanded ? ' active' : ''}`}
            onMouseEnter={() => setHoveredStage(key)}
            onMouseLeave={() => setHoveredStage(null)}
            onClick={() => onSelect({ kind: 'stage', id: key })}
            style={{
              position: 'absolute', top: 0, left: `${STAGE_X[i]}%`, transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem', width: 120,
            }}
          >
            <div
              className={isLit || isExpanded ? 'sb-lt-glow-dot' : ''}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isLit || isExpanded || isHovered ? glow : 'var(--sb-navy-deep)',
                border: `2px solid ${glow}`,
                boxShadow: isLit || isExpanded ? `0 0 18px ${glow}` : 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
              }}
            />
            <div style={{
              fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isLit || isExpanded ? glow : 'var(--sb-cream)', textAlign: 'center', transition: 'color 0.3s ease',
            }}>
              {stage.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricChip({ metricKey, data, focused, dimmed, glow, onFocus }) {
  const def = METRIC_DEFS[metricKey];
  const conf = def.confidence(data);
  return (
    <div
      className={`sb-lt-chip${dimmed ? ' sb-lt-dim' : ''}`}
      onClick={() => onFocus({ kind: 'metric', id: metricKey })}
      style={{
        background: 'var(--sb-navy-deep)',
        border: `0.5px solid ${focused ? glow : glow + '55'}`,
        boxShadow: focused ? `0 0 18px ${glow}44` : 'none',
        borderRadius: 10, padding: '0.9rem 1.1rem', minWidth: 190,
        display: 'flex', alignItems: 'center', gap: '0.9rem',
      }}
    >
      <LivingCircle size={44} glow={glow} confidence={conf} evidenceDots={Math.min(def.evidence(data).length, 4)} focused={focused}>
        <span style={{ fontSize: '0.6rem' }}>{conf === null ? '·' : `${Math.round(conf * 100)}`}</span>
      </LivingCircle>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: '0.3rem' }}>{def.label}</div>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '1.3rem', color: glow }}>{String(def.value(data))}</div>
      </div>
    </div>
  );
}

// Every semantic object renders through the same Inspector contract:
// Selected Object -> Purpose -> Definition -> Current State -> Confidence ->
// Evidence -> Dependencies -> Related Journeys -> Actions -> Open Orbit.
function InspectorPanel({ inspector, onFocus, onClear }) {
  const Section = ({ label, children }) => (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: '0.4rem' }}>{label}</div>
      {children}
    </div>
  );

  // Clicking a nested evidence/dependency/related-journey link swaps the
  // whole inspector to a different object, but this container's scroll
  // position otherwise stays wherever it was — so a click made after
  // scrolling down lands the user mid-way through the NEW object's content
  // instead of at its top, looking like "the data I need is at the bottom."
  // Reset to top on every focus change (Betsy 2026-07-30).
  const scrollRef = React.useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [inspector?.kind, inspector?.title]);

  return (
    <div ref={scrollRef} style={{
      width: 340, flexShrink: 0, borderLeft: '0.5px solid rgba(196,132,58,0.25)',
      padding: '1.25rem 1.25rem 2rem', overflowY: 'auto', background: 'rgba(0,0,0,0.15)',
    }}>
      {!inspector ? (
        <div style={{ color: 'var(--sb-dusty)', fontSize: '0.82rem', lineHeight: 1.6, paddingTop: '1rem' }}>
          <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)', marginBottom: '0.75rem' }}>Inspector</div>
          Click any object — a highway stage, a metric, a thesis, a signal — and it opens here.
          Every object answers the same questions: what it is, where its number comes from, what evidence supports it, and what it depends on.
        </div>
      ) : (
        <div className="sb-lt-panel-enter" key={`${inspector.kind}-${inspector.title}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>{inspector.kind}</div>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '1.15rem', color: 'var(--sb-cream)', lineHeight: 1.25 }}>{inspector.title}</div>
            </div>
            <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--sb-dusty)', cursor: 'pointer', fontSize: '1.05rem', padding: 0 }}>✕</button>
          </div>

          {inspector.value !== undefined && (
            <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '1.9rem', color: 'var(--sb-cream)', marginBottom: '0.4rem' }}>{inspector.value}</div>
          )}

          {/* Data first (per Betsy's 2026-07-29 UX feedback): the parts that
              CHANGE with each click — state, confidence, evidence — lead;
              the static Purpose/Definition prose is collapsed at the bottom
              so a click shows fresh context without scrolling. */}
          <Section label="Current State">
            <div style={{ color: 'var(--sb-cream)', fontSize: '0.8rem', lineHeight: 1.5 }}>{inspector.currentState}</div>
          </Section>

          {inspector.confidence !== null && inspector.confidence !== undefined && (
            <Section label="Confidence">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(196,132,58,0.15)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(inspector.confidence * 100)}%`, height: '100%', background: 'var(--sb-gold)', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.8rem', color: 'var(--sb-gold)' }}>{fmtPct(inspector.confidence)}</div>
              </div>
            </Section>
          )}

          {inspector.evidence?.length > 0 && (
            <Section label={`Evidence · ${inspector.evidence.length}`}>
              {inspector.evidenceIsChain ? (
                inspector.evidence.map((step, i) => (
                  <div key={i} className="sb-lt-fadein" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', gap: '0.7rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sb-gold)', flexShrink: 0, marginTop: 4 }} />
                      {i < inspector.evidence.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(196,132,58,0.3)', minHeight: 12 }} />}
                    </div>
                    <div style={{ paddingBottom: '0.35rem' }}>
                      <div style={{ color: 'var(--sb-cream)', fontSize: '0.78rem', fontWeight: 600 }}>{step.label}</div>
                      {step.detail && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem' }}>{step.detail}</div>}
                    </div>
                  </div>
                ))
              ) : (
                inspector.evidence.slice(0, 10).map((item, i) => (
                  <div key={i}
                    className={`sb-lt-ev-row${item.focus ? ' focusable' : ''}`}
                    onClick={() => item.focus && onFocus(item.focus)}
                    style={{ padding: '0.45rem 0.35rem', borderBottom: '0.5px solid rgba(196,132,58,0.1)', borderRadius: 4 }}>
                    <div style={{ color: 'var(--sb-cream)', fontSize: '0.78rem' }}>{item.label}{item.focus && <span style={{ color: 'var(--sb-gold)', marginLeft: 6 }}>→</span>}</div>
                    {item.detail && <div style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem' }}>{item.detail}</div>}
                  </div>
                ))
              )}
              {!inspector.evidenceIsChain && inspector.evidence.length > 10 && (
                <div style={{ color: 'var(--sb-dusty)', fontSize: '0.72rem', paddingTop: '0.4rem' }}>+ {inspector.evidence.length - 10} more</div>
              )}
            </Section>
          )}

          {inspector.dependencies?.length > 0 && (
            <Section label="Dependencies">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {inspector.dependencies.map((dep, i) => (
                  <span key={i}
                    className="sb-lt-crumb"
                    onClick={() => dep.focus && onFocus(dep.focus)}
                    style={{
                      border: '0.5px solid rgba(196,132,58,0.4)', borderRadius: 999, padding: '0.25rem 0.7rem',
                      fontSize: '0.72rem', color: 'var(--sb-cream)',
                    }}>
                    {dep.label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {inspector.relatedJourneys?.length > 0 && (
            <Section label="Related Journeys">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {inspector.relatedJourneys.map((key) => (
                  <span key={key}
                    className="sb-lt-crumb"
                    onClick={() => onFocus({ kind: 'stage', id: key })}
                    style={{
                      border: `0.5px solid ${STAGE_GLOW[key]}77`, borderRadius: 999, padding: '0.25rem 0.7rem',
                      fontSize: '0.72rem', color: STAGE_GLOW[key], fontFamily: 'var(--sb-font-label)', letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                    {STAGE_DEFS[key].label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <details style={{ marginBottom: '1.1rem' }}>
            <summary style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)', cursor: 'pointer', marginBottom: '0.4rem' }}>
              What is this? · Purpose &amp; Definition
            </summary>
            <div style={{ color: 'var(--sb-cream)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>{inspector.purpose}</div>
            <div style={{ color: 'var(--sb-dusty)', fontSize: '0.76rem', lineHeight: 1.5 }}>{inspector.definition}</div>
          </details>

          <Section label="Actions">
            <div
              className="sb-lt-node"
              onClick={() => window.open('/output/business-definition-experience', '_blank')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid var(--sb-gold)', borderRadius: 999, padding: '0.5rem 1.2rem',
                color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(196,132,58,0.08)',
              }}
            >
              ◉ Open Orbit
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function ThesisOrbit({ theses, related, hasFocus, onFocus }) {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', padding: '1rem 0' }}>
      {theses.map((t) => {
        const glow = t.confidence >= 0.72 ? SB_TEAL_300 : t.confidence >= 0.65 ? SB_GOLD_300 : SB_GOLD_700;
        const focused = related.thesisIds.has(t.thesisId);
        const dimmed = hasFocus && !focused;
        const evidenceCount = t.linkedDiligence.length + t.linkedInitiatives.length;
        return (
          <div key={t.thesisId}
            className={`sb-lt-node sb-lt-fadein${dimmed ? ' sb-lt-dim' : ''}`}
            onClick={() => onFocus({ kind: 'thesis', id: t.thesisId })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: 132 }}>
            <LivingCircle size={58} glow={glow} confidence={t.confidence} evidenceDots={Math.min(evidenceCount, 5)} focused={focused}>
              {fmtPct(t.confidence)}
            </LivingCircle>
            <div style={{ color: 'var(--sb-cream)', fontSize: '0.72rem', textAlign: 'center' }}>{t.name}</div>
            {focused && (
              <div className="sb-lt-fadein" style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', color: glow, letterSpacing: '0.08em' }}>
                {evidenceCount} evidence links
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignalOrbit({ signals, related, hasFocus, onFocus }) {
  return (
    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
      {signals.map((s) => {
        const negative = s.magnitude < 0;
        const glow = negative ? SB_GOLD : SB_TEAL_300; // gold = needs attention, teal = healthy — brand's two-hue system, not red/green
        const focused = related.signalIds.has(s.signalId);
        const dimmed = hasFocus && !focused;
        return (
          <div key={s.signalId}
            className={`sb-lt-chip sb-lt-fadein${dimmed ? ' sb-lt-dim' : ''}`}
            onClick={() => onFocus({ kind: 'signal', id: s.signalId })}
            style={{
              border: `0.5px solid ${focused ? glow : glow + '55'}`, borderRadius: 10, padding: '0.85rem 1rem', minWidth: 220,
              background: 'var(--sb-navy-deep)', boxShadow: focused ? `0 0 16px ${glow}44` : 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="sb-lt-glow-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: glow, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: glow }}>{s.type}</span>
            </div>
            <div style={{ color: 'var(--sb-cream)', fontSize: '0.8rem' }}>{s.observation}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function LonetreeMvpPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('landing'); // landing | highway
  const [focus, setFocus] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [demo, setDemo] = useState(null); // { steps, idx, playing }

  useEffect(() => {
    (async () => {
      try {
        // Everything — including both traces — is prefetched so that a focus
        // change is synchronous: nothing loads, everything re-contextualizes.
        const [summary, recon, fundEconomics, signals, hypotheses, initiatives, theses, revenueTrace, evDrivers] = await Promise.all([
          api.getLonetreeMvpSummary(), api.getLonetreeMvpReconciliation(), api.getLonetreeMvpFundEconomics(),
          api.getLonetreeMvpSignals(), api.getLonetreeMvpHypotheses(), api.getLonetreeMvpValueCreation(), api.getLonetreeMvpTheses(),
          api.getLonetreeMvpTraceMetric('revenue'), api.getLonetreeMvpTraceEvDrivers(),
        ]);
        setData({ summary, recon, fundEconomics, signals, hypotheses, initiatives, theses, revenueTrace, evDrivers });
      } catch (e) {
        setError(e.body?.error || e.message);
      }
    })();
  }, []);

  const experience = useMemo(() => (data ? resolveExperience(focus, data) : null), [focus, data]);

  // Demonstration playback: each step just moves focus, so the ordinary
  // Experience Engine produces the traveling highlight/inspector changes.
  useEffect(() => {
    if (!demo) return;
    setFocus(demo.steps[demo.idx].focus);
    if (!demo.playing) return;
    if (demo.idx >= demo.steps.length - 1) return;
    const t = setTimeout(() => setDemo((d) => (d ? { ...d, idx: Math.min(d.idx + 1, d.steps.length - 1) } : d)), 4200);
    return () => clearTimeout(t);
  }, [demo]);

  const startDemo = async () => {
    try {
      const result = await api.getLonetreeMvpDemonstration();
      if (result.steps?.length) setDemo({ steps: result.steps, idx: 0, playing: true });
    } catch (e) {
      setError(e.body?.error || e.message);
    }
  };

  const demoControl = (action) => {
    if (action === 'exit') { setDemo(null); setFocus(null); return; }
    setDemo((d) => {
      if (!d) return d;
      if (action === 'toggle') return { ...d, playing: !d.playing };
      if (action === 'prev') return { ...d, idx: Math.max(0, d.idx - 1), playing: false };
      if (action === 'next') return { ...d, idx: Math.min(d.steps.length - 1, d.idx + 1), playing: false };
      return d;
    });
  };

  if (error) return (
    <div style={{ padding: '2rem', color: 'var(--sb-dusty)' }}>
      <GlobalStyle />
      <p>{error}</p>
      <p style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>node server/scripts/seedLonetreeMvpFund.js --userId=1</p>
    </div>
  );
  if (!data) return <div style={{ padding: '2rem', color: 'var(--sb-dusty)' }}><GlobalStyle />Loading…</div>;

  const { breadcrumb, highlightStages, expandedStage, related, inspector } = experience;
  const hasFocus = focus !== null && focus.kind !== 'stage';
  const stageGlow = STAGE_GLOW[expandedStage];

  return (
    <div style={{ flex: 1, width: '100%', minWidth: 0, display: 'flex', overflow: 'hidden' }}>
      <GlobalStyle />
      {view === 'landing' ? (
        <div style={{ flex: 1, minWidth: 0, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <Landing onBegin={() => { setView('highway'); setFocus({ kind: 'stage', id: 'commercial' }); }} />
        </div>
      ) : (
        <>
          <div className="sb-lt-fadein" style={{ flex: 1, minWidth: 0, padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <Breadcrumb crumbs={breadcrumb} onFocus={setFocus} />
              {!demo && (
                <div
                  className="sb-lt-node"
                  onClick={startDemo}
                  style={{
                    flexShrink: 0, border: '1px solid var(--sb-gold)', borderRadius: 999, padding: '0.45rem 1.1rem',
                    color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(196,132,58,0.08)',
                  }}
                >
                  ▶ Run Demonstration
                </div>
              )}
            </div>
            <FlowingHighway
              highlightStages={highlightStages}
              expandedStage={expandedStage}
              onSelect={setFocus}
              hoveredStage={hoveredStage}
              setHoveredStage={setHoveredStage}
            />

            {STAGE_METRICS[expandedStage].length > 0 && (
              <div key={expandedStage} className="sb-lt-fadein" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {STAGE_METRICS[expandedStage].map((mk) => (
                  <MetricChip
                    key={mk}
                    metricKey={mk}
                    data={data}
                    glow={stageGlow}
                    focused={related.metricKeys.has(mk) && hasFocus}
                    dimmed={hasFocus && !related.metricKeys.has(mk)}
                    onFocus={setFocus}
                  />
                ))}
              </div>
            )}

            {expandedStage === 'recommendations' && (
              <div className="sb-lt-fadein">
                <SignalOrbit signals={data.signals} related={related} hasFocus={hasFocus} onFocus={setFocus} />
              </div>
            )}

            <div style={{ marginTop: '2.25rem' }}>
              <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: '0.5rem' }}>Investment Thesis</div>
              <ThesisOrbit theses={data.theses} related={related} hasFocus={hasFocus} onFocus={setFocus} />
            </div>

            {expandedStage !== 'recommendations' && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sb-dusty)', marginBottom: '0.5rem' }}>Open Signals</div>
                <SignalOrbit signals={data.signals} related={related} hasFocus={hasFocus} onFocus={setFocus} />
              </div>
            )}

            <div style={{ flex: 1 }} />
            {demo && <DemonstrationRibbon demo={demo} onExit={demoControl} />}
          </div>

          <InspectorPanel inspector={inspector} onFocus={setFocus} onClear={() => setFocus(null)} />
        </>
      )}
    </div>
  );
}
