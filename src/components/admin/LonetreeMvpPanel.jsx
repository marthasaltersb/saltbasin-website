import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { resolveExperience, STAGE_ORDER, STAGE_DEFS, STAGE_METRICS, METRIC_DEFS } from '../../lib/experienceEngine/lonetreeExperience.js';
import { LONETREE_PROSPECT_EXPERIENCE } from '../../config/visual/lonetreeProspectExperience.js';
import SpatialJourneyWorld from '../SpatialJourneyWorld.jsx';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';

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

// Stored envelopes can outlive a deployment. Merge them onto the current
// schema so a previously saved theme/navigation override cannot erase a new
// required block such as proposalNarrative. Arrays remain intentional
// replacements; nested objects inherit newly introduced defaults.
function mergeProspectConfig(defaultValue, storedValue) {
  if (!storedValue || typeof storedValue !== 'object' || Array.isArray(storedValue)) return defaultValue;
  if (defaultValue?.schemaVersion && storedValue?.schemaVersion && storedValue.schemaVersion < defaultValue.schemaVersion) return defaultValue;
  return Object.fromEntries(Object.entries(defaultValue).map(([key, fallback]) => {
    const stored = storedValue[key];
    if (stored === undefined) return [key, fallback];
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) return [key, mergeProspectConfig(fallback, stored)];
    return [key, stored];
  }));
}

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
      @keyframes sb-lt-highlight-pop { 0% { transform: translateY(8px) scale(.98); box-shadow: 0 0 0 rgba(74,124,142,0); } 55% { transform: translateY(-5px) scale(1.025); box-shadow: 0 18px 38px var(--lt-highlight-glow); } 100% { transform: translateY(-2px) scale(1.01); box-shadow: 0 12px 30px var(--lt-highlight-glow); } }
      @keyframes sb-lt-reveal { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
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
      .sb-lt-experience { background: var(--lt-page); color: var(--lt-text); font-family: var(--lt-font-body); }
      .sb-lt-crystal { transition: transform 0.22s ease, filter 0.22s ease; }
      .sb-lt-crystal:hover, .sb-lt-crystal:focus-visible { transform: translate(-50%, -50%) scale(1.08); filter: drop-shadow(0 8px 12px rgba(52,90,104,0.24)); }
      .sb-lt-proposal-highlight { animation: sb-lt-highlight-pop .8s ease both; }
      .sb-lt-proposal-reveal { animation: sb-lt-reveal .55s cubic-bezier(.2,.8,.2,1) both; }
      .sb-lt-proposal-crystal { position: absolute !important; left: 50%; top: 50%; width: min(140px, 78%) !important; height: min(140px, 78%) !important; transform: translate(-50%, -50%); }
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

function Landing({ config, onBegin }) {
  const { narrative } = config;
  return (
    <div className="sb-lt-fadein sbh-hero-grid" style={{ minHeight: '70vh', alignItems: 'center' }}>
      <div className="sbh-hero-copy" style={{ textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--sb-font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sb-gold)' }}>
          {narrative.eyebrow}
        </div>
        <h1 style={{ fontFamily: 'var(--sb-font-display, serif)', fontSize: '2.2rem', color: 'var(--sb-cream)', margin: '0.7rem 0', maxWidth: 560 }}>
          {narrative.landingTitle}
        </h1>
        <div style={{ color: 'var(--lt-teal-deep)', maxWidth: 610, fontFamily: 'var(--sb-font-display)', fontSize: '1.22rem', fontWeight: 700, lineHeight: 1.35, marginTop: '1rem' }}>{narrative.landingBlurbLead}</div>
        <p style={{ color: 'var(--sb-cream)', maxWidth: 610, fontSize: '1rem', lineHeight: 1.65, marginTop: '0.4rem' }}>{narrative.landingBlurb}</p>
        <p style={{ color: 'var(--sb-dusty)', maxWidth: 480 }}>{narrative.landingBody}</p>
        <div
          className="sb-lt-node"
          onClick={onBegin}
          style={{
            display: 'inline-flex', border: '1px solid var(--sb-gold)', borderRadius: 999, padding: '1rem 2.5rem',
            color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', letterSpacing: '0.1em', textTransform: 'uppercase',
            fontSize: '0.85rem', background: 'rgba(196,132,58,0.08)',
          }}
        >
          {narrative.companyAction}
        </div>
      </div>
      <div className="sbh-orbit-stage" aria-label="Animated Salt Basin crystal orbit">
        <SaltBasinCrystal variant="signature" size="hero" interactive />
        <div className="sbh-orbit-line sbh-orbit-line-a" />
        <div className="sbh-orbit-line sbh-orbit-line-b" />
      </div>
    </div>
  );
}

function CrystalNavigation({ config, onBack, onSelect }) {
  const { narrative, navigation } = config;
  return (
    <div className="sb-lt-fadein" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ color: 'var(--sb-gold)', fontFamily: 'var(--sb-font-label)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{narrative.navigationEyebrow}</div>
      <h1 style={{ color: 'var(--sb-cream)', fontFamily: 'var(--sb-font-display)', fontSize: '2rem', margin: '0.65rem 0 0.45rem', textAlign: 'center' }}>{narrative.navigationTitle}</h1>
      <p style={{ color: 'var(--sb-dusty)', maxWidth: 590, textAlign: 'center', margin: 0 }}>{narrative.navigationBody}</p>
      <div style={{ position: 'relative', width: 'min(620px, 82vw)', height: 400, marginTop: '1.25rem' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 330, height: 220, transform: 'translate(-50%, -50%)', border: '1px solid var(--lt-border)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 210, height: 140, transform: 'translate(-50%, -50%)', border: '1px solid var(--lt-border)', borderRadius: '50%' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 92, height: 112, transform: 'translate(-50%, -50%)', clipPath: 'polygon(50% 0, 92% 24%, 82% 78%, 50% 100%, 18% 78%, 8% 24%)', background: 'linear-gradient(145deg, var(--lt-surface) 5%, var(--lt-rose) 48%, var(--lt-gold) 100%)', border: '2px solid var(--lt-teal-deep)', filter: 'drop-shadow(0 10px 16px rgba(52,90,104,0.2))' }} />
        {navigation.nodes.map((node) => {
          const radians = (node.angle * Math.PI) / 180;
          const left = 50 + Math.cos(radians) * 38;
          const top = 50 + Math.sin(radians) * 39;
          return (
            <button key={node.destination} className="sb-lt-crystal" onClick={() => onSelect(node.destination)} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)', width: 138, minHeight: 88, padding: '0.7rem 0.75rem', border: '1px solid var(--lt-teal-deep)', clipPath: 'polygon(12% 18%, 50% 0, 88% 18%, 100% 70%, 50% 100%, 0 70%)', background: 'var(--lt-surface)', color: 'var(--lt-text)', fontFamily: 'var(--sb-font-label)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}>{node.label}</button>
          );
        })}
      </div>
      <button onClick={onBack} style={{ border: 0, background: 'transparent', color: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontWeight: 700, cursor: 'pointer' }}>← {narrative.navigationBackLabel}</button>
    </div>
  );
}

function ProspectReturn({ onReturn, label = 'Prospect Experience' }) {
  return <button onClick={onReturn} style={{ marginBottom: '1rem', border: 0, background: 'transparent', color: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontWeight: 700, cursor: 'pointer' }}>← {label}</button>;
}

function ProspectNarrativeExperience({ config, canSave, saveBlockedMessage, onSave }) {
  const viewRef = useRef(null);
  const presentationRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config);
  const [saveState, setSaveState] = useState('');
  const effectiveConfig = editing ? draft : config;
  const narrative = effectiveConfig.proposalNarrative;
  const sections = narrative.sections;
  const activeSection = sections[index];
  const primaryCards = activeSection.cards || activeSection.rail || [];
  const totalRevealSteps = 2 + primaryCards.length + (activeSection.panels?.length || 0) + (activeSection.rows ? 1 : 0) + (activeSection.banner ? 1 : 0);

  const activate = (nextIndex) => setIndex(Math.max(0, Math.min(nextIndex, sections.length - 1)));

  useEffect(() => {
    if (!playing) return undefined;
    if (index >= sections.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const sectionDuration = Math.max(narrative.playback.intervalMs, (totalRevealSteps + 2) * (narrative.visual.revealIntervalMs || 1100));
    const timer = setTimeout(() => setIndex((current) => Math.min(current + 1, sections.length - 1)), sectionDuration);
    return () => clearTimeout(timer);
  }, [playing, index, narrative.playback.intervalMs, narrative.visual.revealIntervalMs, sections.length, totalRevealSteps]);

  useEffect(() => {
    setRevealStep(0);
    requestAnimationFrame(() => presentationRef.current?.scrollIntoView({ behavior: narrative.visual.motionEnabled ? 'smooth' : 'auto', block: 'center' }));
    const timer = setInterval(() => setRevealStep((current) => {
      if (current >= totalRevealSteps) {
        clearInterval(timer);
        return current;
      }
      return current + 1;
    }), narrative.visual.revealIntervalMs || 420);
    return () => clearInterval(timer);
  }, [index, replayKey, narrative.visual.motionEnabled, narrative.visual.revealIntervalMs, totalRevealSteps]);

  const save = async () => {
    if (!canSave) {
      setSaveState(saveBlockedMessage);
      return;
    }
    setSaveState('Saving…');
    try {
      await onSave(draft);
      setEditing(false);
      setSaveState('Draft saved. Publish from the admin prospect toolbar when it is ready for the member.');
    } catch (error) {
      setSaveState(error.message);
    }
  };

  return (
    <div ref={viewRef} style={{ '--lt-highlight-glow': narrative.visual.highlightGlow, scrollMarginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.65rem 0 0.9rem' }}>
        <div><div style={{ color: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{narrative.breadcrumbLabel}</div><div style={{ color: 'var(--lt-text-muted)', fontSize: '0.72rem' }}>{narrative.headerLabel}</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '.4rem' }}><a href={narrative.completeDownload.url} download style={{ border: '1px solid var(--lt-teal-deep)', borderRadius: 999, padding: '0.55rem 0.85rem', color: 'white', background: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}>{narrative.completeDownload.label}</a><a href={narrative.archiveDownload.url} download style={{ border: '1px solid var(--lt-border)', borderRadius: 999, padding: '0.45rem 0.75rem', color: 'var(--lt-teal-deep)', background: 'var(--lt-surface)', fontFamily: 'var(--sb-font-label)', fontSize: '0.62rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>{narrative.archiveDownload.label}</a></div>
      </div>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(220px,.65fr)', gap: '1.25rem', alignItems: 'center', minHeight: 190, maxHeight: 230, overflow: 'hidden', border: '1px solid var(--lt-border)', borderRadius: 18, background: 'var(--lt-surface)', padding: '1rem 1.25rem', marginBottom: '0.8rem' }}>
        <div>
          <div style={{ color: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>{narrative.cover.eyebrow}</div>
          <h1 style={{ color: 'var(--lt-text)', fontFamily: 'var(--sb-font-display)', fontSize: 'clamp(1.65rem,3vw,2.7rem)', lineHeight: 1.02, letterSpacing: '-.03em', margin: '.35rem 0' }}>{narrative.cover.title}</h1>
          <p style={{ color: 'var(--lt-text-muted)', fontSize: '.78rem', lineHeight: 1.45, margin: 0, maxWidth: 760 }}>{narrative.cover.body}</p>
        </div>
        <div style={{ position: 'relative', height: 180, minWidth: 0, overflow: 'hidden', borderRadius: 15, background: 'radial-gradient(circle at center, rgba(74,124,142,.24), rgba(20,40,63,.98) 68%)' }} aria-label="Salt Basin truth convergence orbit">
          <SaltBasinCrystal variant="signature" size="orbit" className="sb-lt-proposal-crystal" interactive />
        </div>
      </section>
      <nav aria-label={narrative.breadcrumbLabel} style={{ display: 'grid', gridTemplateColumns: `repeat(${sections.length}, minmax(110px, 1fr))`, overflowX: 'auto', borderBlock: '1px solid var(--lt-border)', background: 'var(--lt-page)', marginBottom: '0.75rem' }}>
        {sections.map((section, sectionIndex) => { const isNextPrompt = revealStep >= totalRevealSteps && sectionIndex === index + 1; return <button key={section.id} className={isNextPrompt ? 'sb-lt-proposal-highlight' : ''} onClick={() => activate(sectionIndex)} style={{ border: 0, borderLeft: '1px solid var(--lt-border)', borderBottom: sectionIndex === index ? '4px solid var(--lt-teal)' : isNextPrompt ? '4px solid var(--lt-gold)' : '4px solid transparent', padding: '0.75rem 0.45rem', background: sectionIndex === index ? 'var(--lt-surface)' : isNextPrompt ? 'rgba(196,132,58,.12)' : 'transparent', color: sectionIndex === index ? 'var(--lt-teal-deep)' : isNextPrompt ? 'var(--lt-gold)' : 'var(--lt-text-muted)', fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}>{String(sectionIndex + 1).padStart(2, '0')} {section.label}</button>; })}
      </nav>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <button onClick={() => activate(index - 1)} disabled={index === 0}>← Previous</button>
          <button onClick={() => {
            if (playing) {
              setPlaying(false);
              return;
            }
            setRevealStep(0);
            setReplayKey((value) => value + 1);
            setPlaying(true);
          }} aria-pressed={playing}>{playing ? '❚❚ Pause narrative' : revealStep >= totalRevealSteps ? '↻ Replay this tab' : '▶ Play narrative'}</button>
          <button onClick={() => activate(index + 1)} disabled={index === sections.length - 1}>Next →</button>
        </div>
        <button onClick={() => { setDraft(config); setEditing((value) => !value); }} style={{ color: 'var(--lt-teal-deep)', background: 'transparent', border: '1px solid var(--lt-border)', borderRadius: 8, padding: '0.45rem 0.7rem', cursor: 'pointer' }}>Configure narrative</button>
      </div>
      <div ref={presentationRef} key={activeSection.id} className="sb-lt-fadein" style={{ padding: '0.9rem 0 1.2rem', scrollMarginBlock: '2rem' }}>
        <div className="sb-lt-proposal-reveal" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(280px,.85fr)', gap: '1.4rem', alignItems: 'end', marginBottom: '1.2rem' }}><div><div style={{ color: 'var(--lt-teal-deep)', fontFamily: 'var(--sb-font-label)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase' }}>{activeSection.eyebrow}</div><h1 style={{ color: 'var(--lt-text)', fontFamily: 'var(--sb-font-display)', fontSize: 'clamp(2rem,4vw,3.6rem)', lineHeight: 1.02, letterSpacing: '-0.03em', margin: '0.35rem 0 0' }}>{activeSection.title}</h1></div>{revealStep >= 1 && <p className="sb-lt-proposal-reveal" style={{ color: 'var(--lt-text-muted)', lineHeight: 1.6, margin: 0 }}>{activeSection.narrative}</p>}</div>
        {activeSection.heading && revealStep >= 2 && <h2 className="sb-lt-proposal-reveal" style={{ color: 'var(--lt-text)', fontFamily: 'var(--sb-font-display)', fontSize: '1.8rem' }}>{activeSection.heading}</h2>}
        {primaryCards.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: `repeat(${primaryCards.length}, minmax(145px, 1fr))`, gap: '0.8rem', overflowX: 'auto', padding: activeSection.rail ? '1.15rem' : '0.25rem 0 1rem', borderRadius: 18, background: activeSection.rail ? 'var(--lt-teal-deep)' : 'transparent' }}>{primaryCards.map((card, cardIndex) => revealStep >= cardIndex + 2 ? <article key={`${card.marker}-${card.title}`} className={`${narrative.visual.motionEnabled && cardIndex === activeSection.highlightIndex ? 'sb-lt-proposal-highlight ' : ''}sb-lt-proposal-reveal`} style={{ minWidth: 145, background: activeSection.rail ? 'rgba(255,255,255,.09)' : 'var(--lt-surface)', border: '1px solid var(--lt-border)', borderTop: `5px solid ${['var(--lt-teal)','var(--lt-gold)','var(--lt-rose)','var(--lt-teal-deep)'][cardIndex % 4]}`, borderRadius: 16, padding: '1.15rem', color: activeSection.rail ? 'white' : 'var(--lt-text)' }}><span style={{ color: 'var(--lt-gold)', fontFamily: 'var(--sb-font-display)', fontWeight: 800 }}>{card.marker}</span><h3 style={{ fontFamily: 'var(--sb-font-display)', fontSize: '1.15rem', margin: '.35rem 0' }}>{card.title}</h3><p style={{ color: activeSection.rail ? 'rgba(255,255,255,.76)' : 'var(--lt-text-muted)', fontSize: '.78rem', margin: 0 }}>{card.body}</p></article> : <div key={`${card.marker}-placeholder`} style={{ minWidth: 145 }} />)}</div>}
        {activeSection.panels && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '1rem', marginTop: '1rem' }}>{activeSection.panels.map((panel, panelIndex) => revealStep >= 2 + primaryCards.length + panelIndex ? <article key={panel.title} className="sb-lt-proposal-reveal" style={{ borderRadius: 18, padding: '1.5rem', background: panel.dark ? 'var(--lt-teal-deep)' : 'var(--lt-surface)', color: panel.dark ? 'white' : 'var(--lt-text)', border: '1px solid var(--lt-border)' }}><div style={{ color: 'var(--lt-gold)', fontSize: '.66rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>{panel.eyebrow}</div><h2 style={{ fontFamily: 'var(--sb-font-display)', margin: '.4rem 0' }}>{panel.title}</h2>{panel.body && <p>{panel.body}</p>}{panel.items && <ul>{panel.items.map((item) => <li key={item}>{item}</li>)}</ul>}</article> : <div key={`${panel.title}-placeholder`} />)}</div>}
        {activeSection.rows && revealStep >= 2 + primaryCards.length && <div className="sb-lt-proposal-reveal" style={{ overflowX: 'auto', border: '1px solid var(--lt-border)', borderRadius: 16, background: 'var(--lt-surface)' }}><div style={{ minWidth: 980 }}>{[activeSection.columns, ...activeSection.rows].map((row, rowIndex) => <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.35fr 1fr .9fr 1.35fr', gap: 14, padding: '0.9rem 1rem', borderTop: rowIndex ? '1px solid var(--lt-border)' : 0, background: rowIndex ? 'transparent' : 'var(--lt-teal-deep)', color: rowIndex ? 'var(--lt-text)' : 'white', fontSize: '.76rem', fontWeight: rowIndex ? 400 : 800 }}>{row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}</div>)}</div></div>}
        {activeSection.banner && revealStep >= totalRevealSteps && <div className="sb-lt-proposal-highlight" style={{ marginTop: '1rem', padding: '1rem 1.2rem', borderRadius: 14, background: 'var(--lt-teal-deep)', color: 'white' }}>{activeSection.banner}</div>}
        {revealStep >= totalRevealSteps && index < sections.length - 1 && <div className="sb-lt-proposal-reveal" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '.75rem', marginTop: '1.1rem', paddingTop: '.9rem', borderTop: '1px solid var(--lt-border)' }}><span style={{ color: 'var(--lt-text-muted)', fontSize: '.78rem' }}>This view is complete.</span><button className="sb-lt-proposal-highlight" onClick={() => activate(index + 1)} style={{ border: 0, borderRadius: 999, background: 'var(--lt-teal-deep)', color: 'white', padding: '.7rem 1rem', fontWeight: 800, cursor: 'pointer' }}>Continue to {sections[index + 1].label} →</button></div>}
      </div>
      {editing && <div style={{ background: 'var(--lt-surface-muted)', border: '1px solid var(--lt-border)', borderRadius: 10, padding: '1rem', marginBottom: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.7rem' }}>
           <label>Playback interval (ms)<input type="number" min="1000" value={draft.proposalNarrative.playback.intervalMs} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, playback: { ...draft.proposalNarrative.playback, intervalMs: Number(event.target.value) } } })} style={{ display: 'block', width: '100%' }} /></label>
           <label>Content reveal interval (ms)<input type="number" min="100" value={draft.proposalNarrative.visual.revealIntervalMs} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, visual: { ...draft.proposalNarrative.visual, revealIntervalMs: Number(event.target.value) } } })} style={{ display: 'block', width: '100%' }} /></label>
           <label>Content reveal interval (ms)<input type="number" min="100" value={draft.proposalNarrative.visual.revealIntervalMs} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, visual: { ...draft.proposalNarrative.visual, revealIntervalMs: Number(event.target.value) } } })} style={{ display: 'block', width: '100%' }} /></label>
           <label>Highlight glow<input value={draft.proposalNarrative.visual.highlightGlow} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, visual: { ...draft.proposalNarrative.visual, highlightGlow: event.target.value } } })} style={{ display: 'block', width: '100%' }} /></label>
           <label>Archive button label<input value={draft.proposalNarrative.archiveDownload.label} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, archiveDownload: { ...draft.proposalNarrative.archiveDownload, label: event.target.value } } })} style={{ display: 'block', width: '100%' }} /></label>
           <label>Complete download label<input value={draft.proposalNarrative.completeDownload.label} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, completeDownload: { ...draft.proposalNarrative.completeDownload, label: event.target.value } } })} style={{ display: 'block', width: '100%' }} /></label>
           {['eyebrow', 'title', 'body'].map((field) => <label key={field}>Header {field}<textarea rows={field === 'body' ? 3 : 2} value={draft.proposalNarrative.cover[field]} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, cover: { ...draft.proposalNarrative.cover, [field]: event.target.value } } })} style={{ display: 'block', width: '100%' }} /></label>)}
          {draft.proposalNarrative.sections.map((section, sectionIndex) => <div key={section.id} style={{ gridColumn: '1 / -1', background: 'var(--lt-surface)', border: '1px solid var(--lt-border)', borderRadius: 8, padding: '0.75rem' }}><strong>Section {sectionIndex + 1}</strong>{['label', 'eyebrow', 'title', 'narrative'].map((field) => <label key={field} style={{ display: 'block', marginTop: '0.45rem', textTransform: 'capitalize' }}>{field}{field === 'narrative' ? <textarea rows="3" value={section[field]} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, sections: draft.proposalNarrative.sections.map((item, itemIndex) => itemIndex === sectionIndex ? { ...item, [field]: event.target.value } : item) } })} style={{ display: 'block', width: '100%' }} /> : <input value={section[field]} onChange={(event) => setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, sections: draft.proposalNarrative.sections.map((item, itemIndex) => itemIndex === sectionIndex ? { ...item, [field]: event.target.value } : item) } })} style={{ display: 'block', width: '100%' }} />}</label>)}<label style={{ display: 'block', marginTop: '.65rem' }}>Structured cards, panels, table, and banner configuration<textarea key={`${section.id}-${editing}`} rows="8" defaultValue={JSON.stringify(section, null, 2)} onBlur={(event) => { try { const parsed = JSON.parse(event.target.value); setDraft({ ...draft, proposalNarrative: { ...draft.proposalNarrative, sections: draft.proposalNarrative.sections.map((item, itemIndex) => itemIndex === sectionIndex ? parsed : item) } }); setSaveState(''); } catch { setSaveState(`Section ${sectionIndex + 1} configuration must be valid JSON.`); } }} style={{ display: 'block', width: '100%', fontFamily: 'monospace', fontSize: '.72rem' }} /></label></div>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '0.8rem' }}><button onClick={save}>Save configuration</button><span>{saveState}</span></div>
      </div>}
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

export default function LonetreeMvpPanel({ scope = 'member' }) {
  const [data, setData] = useState(null);
  const [prospectConfig, setProspectConfig] = useState(LONETREE_PROSPECT_EXPERIENCE);
  const [error, setError] = useState(null);
  const [view, setView] = useState('landing'); // landing | navigation | proposal | demo | spatial
  const [focus, setFocus] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [demo, setDemo] = useState(null); // { steps, idx, playing }
  const [prospects, setProspects] = useState([]);
  const [selectedProspectId, setSelectedProspectId] = useState(null);
  const [configKind, setConfigKind] = useState('draft');
  const [publishState, setPublishState] = useState('');

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

  useEffect(() => {
    if (scope === 'admin') {
      api.listLonetreeProposalProspects().then(({ prospects: rows }) => {
        setProspects(rows || []);
        const preferred = (rows || []).find((row) => row.email === 'saltbasin-networks@breckgolden.com') || rows?.[0];
        if (preferred) setSelectedProspectId(preferred.id);
      }).catch((e) => setError(e.body?.error || e.message));
    } else {
      api.getMyLonetreeProposalConfig().then((result) => setProspectConfig(mergeProspectConfig(LONETREE_PROSPECT_EXPERIENCE, result.value))).catch((e) => setError(e.body?.error || e.message));
    }
  }, [scope]);

  useEffect(() => {
    if (scope !== 'admin' || !selectedProspectId) return;
    api.getLonetreeProspectConfig(selectedProspectId, configKind)
      .then((result) => setProspectConfig(mergeProspectConfig(LONETREE_PROSPECT_EXPERIENCE, result.value)))
      .catch((e) => setError(e.body?.error || e.message));
  }, [scope, selectedProspectId, configKind]);

  const saveProspectDraft = async (value) => {
    const result = await api.saveLonetreeProspectDraft(selectedProspectId, value);
    setProspectConfig(mergeProspectConfig(LONETREE_PROSPECT_EXPERIENCE, result.value));
    setConfigKind('draft');
  };

  const publishProspect = async () => {
    setPublishState('Publishing…');
    try {
      const result = await api.publishLonetreeProspectConfig(selectedProspectId);
      setProspectConfig(mergeProspectConfig(LONETREE_PROSPECT_EXPERIENCE, result.value));
      setPublishState('Published to the prospect.');
    } catch (e) {
      setPublishState(e.body?.error || e.message);
    }
  };

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
  const theme = prospectConfig.theme;
  const experienceStyle = {
    '--lt-page': theme.page, '--lt-surface': theme.surface, '--lt-surface-muted': theme.surfaceMuted,
    '--lt-text': theme.text, '--lt-text-muted': theme.textMuted, '--lt-teal': theme.teal,
    '--lt-teal-deep': theme.tealDeep, '--lt-gold': theme.gold, '--lt-rose': theme.rose, '--lt-border': theme.border,
    '--lt-font-body': theme.fontBody, '--sb-font-body': theme.fontBody, '--sb-font-display': theme.fontDisplay, '--sb-font-label': theme.fontLabel,
    '--sb-navy-deep': theme.surface, '--sb-cream': theme.text, '--sb-dusty': theme.textMuted,
    '--sb-gold': theme.gold, '--sb-teal': theme.teal,
  };

  return (
    <div className="sb-lt-experience" style={{ ...experienceStyle, flex: 1, width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <GlobalStyle />
      {scope === 'admin' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', padding: '0.7rem 1rem', background: 'var(--lt-surface)', borderBottom: '1px solid var(--lt-border)' }}>
        <strong style={{ color: 'var(--lt-teal-deep)' }}>Proposal administration</strong>
        <label>Prospect <select value={selectedProspectId || ''} onChange={(event) => setSelectedProspectId(Number(event.target.value))}>{prospects.map((prospect) => <option key={prospect.id} value={prospect.id}>{prospect.displayName} · {prospect.email}</option>)}</select></label>
        <button onClick={() => setConfigKind('draft')} disabled={configKind === 'draft'}>Edit draft</button>
        <button onClick={() => setConfigKind('published')} disabled={configKind === 'published'}>View published replica</button>
        <button onClick={publishProspect} disabled={!selectedProspectId}>Publish draft to prospect</button>
        <span style={{ color: 'var(--lt-text-muted)', fontSize: '0.75rem' }}>{publishState}</span>
      </div>}
      {view === 'landing' ? (
        <div style={{ flex: 1, minWidth: 0, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <Landing config={prospectConfig} onBegin={() => setView('navigation')} />
        </div>
      ) : view === 'navigation' ? (
        <div style={{ flex: 1, minWidth: 0, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          <CrystalNavigation config={prospectConfig} onBack={() => setView('landing')} onSelect={(destination) => { setView(destination); if (destination === 'demo') setFocus({ kind: 'stage', id: 'commercial' }); }} />
        </div>
      ) : view === 'proposal' ? (
        <div style={{ flex: 1, minWidth: 0, padding: '1.25rem 1.75rem', overflowY: 'auto' }}>
          <ProspectReturn onReturn={() => setView('navigation')} />
          <ProspectNarrativeExperience
            config={prospectConfig}
            canSave={scope === 'admin' && configKind === 'draft'}
            saveBlockedMessage={scope === 'member'
              ? 'Member users are not able to save proposal configuration changes directly. Your edits remain available as a local preview until you leave this screen.'
              : 'Published replicas are read-only. Switch to Edit draft to save configuration changes.'}
            onSave={saveProspectDraft}
          />
        </div>
      ) : view === 'spatial' ? (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ProspectReturn onReturn={() => setView('navigation')} />
          <SpatialJourneyWorld />
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          <div className="sb-lt-fadein" style={{ flex: 1, minWidth: 0, padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <ProspectReturn onReturn={() => setView('navigation')} label={prospectConfig.narrative.proposalHomeBackLabel} />
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
        </div>
      )}
    </div>
  );
}
