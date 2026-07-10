// Salt Basin MRS "Product Experience" homepage blocks — config-driven
// replacements for the reference HTML mockup's sections. Every block reads
// exclusively from section.fields (no hardcoded copy) so content is editable
// in /admin the same way every other block is, per the block-registry
// contract in ./index.jsx.
import React, { useState, useEffect } from 'react';
import SaltBasinCrystal from '../SaltBasinCrystal.jsx';

// Row-level chip/tag sub-fields are stored as a comma-separated string in the
// admin editor (matches the existing `tags` convention in CaseListEditor) —
// this splits them back into a clean string[] for rendering.
function splitChips(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function Chips({ items, tone }) {
  if (!items || !items.length) return null;
  return (
    <div className="sbh-px-chips">
      {items.map((c, i) => (
        <span key={i} className={`sbh-px-chip${tone ? ` sbh-px-chip-${tone}` : ''}`}>{c}</span>
      ))}
    </div>
  );
}

function PXHead({ eyebrow, heading, intro, dark }) {
  if (!eyebrow && !heading && !intro) return null;
  return (
    <div className={`sbh-px-head${dark ? ' is-dark' : ''}`}>
      {eyebrow && <p className="sbh-eyebrow">{eyebrow}</p>}
      {heading && <h2>{heading}</h2>}
      {intro && <p className="sbh-px-intro">{intro}</p>}
    </div>
  );
}

export function ProductHeroBlock({ section }) {
  const f = section.fields || {};
  return (
    <section id={section.id} className="sbh-px-hero">
      <div className="sbh-px-hero-canvas" aria-hidden="true">
        <SaltBasinCrystal variant="signature" size="backdrop" interactive orbitCount={14} />
      </div>
      <div className="sbh-px-hero-content">
        {f.script && <p className="sbh-script">{f.script}</p>}
        {(f.heading || f.headingEmphasis) && (
          <h1>
            {f.heading}{f.heading && f.headingEmphasis ? ' ' : ''}
            {f.headingEmphasis && <em>{f.headingEmphasis}</em>}
          </h1>
        )}
        {f.lede && <p className="sbh-px-hero-lede">{f.lede}</p>}
        <div className="sbh-cta-row">
          {f.cta1Label && (
            <a className="sbh-btn sbh-btn-primary" href={f.cta1Link || '#'}>{f.cta1Label}</a>
          )}
          {f.cta2Label && (
            <a className="sbh-btn sbh-btn-secondary" href={f.cta2Link || '#'}>{f.cta2Label}</a>
          )}
        </div>
      </div>
    </section>
  );
}

export function RotatingHighlightsBlock({ section }) {
  const f = section.fields || {};
  const highlights = Array.isArray(f.highlights) ? f.highlights : [];
  const metrics = Array.isArray(f.metrics) ? f.metrics : [];
  const rotationMs = Number(f.rotationMs) || 5000;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (highlights.length < 2 || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % highlights.length), rotationMs);
    return () => clearInterval(id);
  }, [highlights.length, paused, rotationMs]);

  const current = highlights[index] || {};

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-promo-stage">
        <div
          className="sbh-px-highlight-card"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          tabIndex={0}
        >
          {current.eyebrow && <p className="sbh-eyebrow">{current.eyebrow}</p>}
          {current.title && <h3>{current.title}</h3>}
          {current.text && <p>{current.text}</p>}
          <Chips items={splitChips(current.chips)} tone="req" />
          {highlights.length > 1 && (
            <div className="sbh-px-dots">
              {highlights.map((_, i) => (
                <span key={i} className={`sbh-px-dot${i === index ? ' active' : ''}`} />
              ))}
            </div>
          )}
        </div>
        {metrics.length > 0 && (
          <div className="sbh-px-metric-grid">
            {metrics.map((m, i) => (
              <div className="sbh-px-metric" key={i}>
                <span>{m.label}</span>
                <strong>{m.value}</strong>
                {m.sublabel && <small>{m.sublabel}</small>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function BuildFlowBlock({ section }) {
  const f = section.fields || {};
  const path = Array.isArray(f.path) ? f.path : [];
  const tabs = Array.isArray(f.tabs) ? f.tabs : [];
  const [activeTab, setActiveTab] = useState(0);
  const current = tabs[activeTab];

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-grid2">
        <div className="sbh-px-panel">
          <h3>How Salt Basin MRS builds your ecosystem</h3>
          <div className="sbh-px-path">
            {path.map((step, i) => (
              <div className="sbh-px-path-node" key={i}>
                <b>{step.label}</b>
                <span>{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sbh-px-panel">
          <h3>Betsy's operating roles</h3>
          <div className="sbh-px-tabs">
            {tabs.map((tab, i) => (
              <button
                key={i}
                type="button"
                className={`sbh-px-tab${i === activeTab ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {current && (
            <div className="sbh-px-tab-view">
              {current.desc && <p>{current.desc}</p>}
              <Chips items={splitChips(current.chips)} tone="warn" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function JourneyRodsBlock({ section }) {
  const f = section.fields || {};
  const rods = Array.isArray(f.rods) ? f.rods : [];
  const steps = splitChips(f.stepSequence);
  const [state, setState] = useState(() => rods.map((r) => Number(r.start) || 0));
  const [stepCount, setStepCount] = useState(0);

  function simulate() {
    setStepCount((c) => Math.min(steps.length, c + 1));
    setState((prev) => prev.map((v, i) => Math.min(100, v + (Number(rods[i]?.increment) || 5))));
  }
  function reset() {
    setState(rods.map((r) => Number(r.start) || 0));
    setStepCount(0);
  }

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-rods">
        {rods.map((rod, i) => (
          <div className="sbh-px-rod-row" key={rod.key || i}>
            <div className="sbh-px-rod-label" style={{ background: rod.color || 'var(--sbh-teal)' }}>{rod.label}</div>
            <div className="sbh-px-rod-track">
              <div className="sbh-px-rod-fill" style={{ width: `${state[i] || 0}%` }} />
            </div>
            <div className="sbh-px-rod-score">{((state[i] || 0) / 100).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="sbh-cta-row" style={{ marginTop: '1.2rem' }}>
        <button type="button" className="sbh-btn sbh-btn-primary" onClick={simulate}>Simulate Product Interaction</button>
        <button type="button" className="sbh-btn sbh-btn-secondary" onClick={reset}>Reset</button>
      </div>
      <Chips items={steps.slice(0, stepCount)} tone="req" />
    </section>
  );
}

export function ProductCatalogBlock({ section }) {
  const f = section.fields || {};
  const products = Array.isArray(f.products) ? f.products : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-catalog">
        {products.map((p, i) => (
          <div className="sbh-px-product-card" key={p.id || i}>
            {p.tagline && <p className="sbh-eyebrow">{p.tagline}</p>}
            {p.name && <h3>{p.name}</h3>}
            {p.desc && <p>{p.desc}</p>}
            {p.priceLabel && <div className="sbh-px-price">{p.priceLabel}</div>}
            <Chips items={splitChips(p.outputs)} tone="req" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExposureCalculatorBlock({ section }) {
  const f = section.fields || {};
  const categories = Array.isArray(f.categories) ? f.categories : [];
  const [arr, setArr] = useState(() => {
    const init = {};
    categories.forEach((c) => { init[c.key] = Number(c.defaultArr) || 0; });
    return init;
  });

  function updateArr(key, value) {
    setArr((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  const results = categories.map((c) => {
    const base = arr[c.key] ?? (Number(c.defaultArr) || 0);
    const pct = Number(c.defaultExposurePct) || 0;
    return { ...c, exposure: base * (pct / 100) };
  });
  const total = results.reduce((sum, r) => sum + r.exposure, 0);

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-formula-grid">
        {categories.map((c, i) => (
          <div key={c.key || i}>
            <label>{c.label} ARR ($)</label>
            <input
              type="number"
              value={arr[c.key] ?? ''}
              onChange={(e) => updateArr(c.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      {categories.length > 0 && (
        <div className="sbh-px-results">
          {results.map((r, i) => (
            <div className="sbh-px-result" key={r.key || i}>
              <span className="sbh-eyebrow">{r.label}</span>
              <strong>${Math.round(r.exposure).toLocaleString()}</strong>
              <small>{r.defaultExposurePct}% estimated exposure</small>
            </div>
          ))}
          <div className="sbh-px-result sbh-px-result-total">
            <span className="sbh-eyebrow">Total Estimated Exposure</span>
            <strong>${Math.round(total).toLocaleString()}</strong>
          </div>
        </div>
      )}
      {f.disclaimer && <p className="sbh-px-disclaimer">{f.disclaimer}</p>}
    </section>
  );
}

export function ApiCatalogTableBlock({ section }) {
  const f = section.fields || {};
  const apis = Array.isArray(f.apis) ? f.apis : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-panel sbh-px-table-panel">
        <table className="sbh-px-table">
          <thead>
            <tr>
              <th>System</th><th>Purpose</th><th>Auth</th><th>Setup</th><th>Cost Model</th><th>Where it's used</th>
            </tr>
          </thead>
          <tbody>
            {apis.map((a, i) => (
              <tr key={i}>
                <td>{a.name}</td>
                <td>{a.purpose}</td>
                <td>{a.auth}</td>
                <td>{a.setup}</td>
                <td className="sbh-px-mono">{a.costModel}</td>
                <td>{a.journeyUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StartEngagementBlock({ section }) {
  const f = section.fields || {};
  const products = Array.isArray(f.engageProducts) ? f.engageProducts : [];
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  function toggle(id) {
    setSubmitted(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function submit() {
    if (!selected.length) return;
    setSubmitted(true);
  }

  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-engage">
        <div className="sbh-px-engage-products">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`sbh-px-engage-chip${selected.includes(p.id) ? ' active' : ''}`}
              onClick={() => toggle(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button type="button" className="sbh-btn sbh-btn-primary" onClick={submit} disabled={!selected.length}>
          {f.submitLabel || 'Start a Conversation'}
        </button>
        {submitted && (
          <p className="sbh-px-engage-confirm">
            Noted — Betsy will follow up about {selected.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean).join(', ')}.
          </p>
        )}
      </div>
    </section>
  );
}

export function PlatformCadenceBlock({ section }) {
  const f = section.fields || {};
  const schedule = Array.isArray(f.schedule) ? f.schedule : [];
  return (
    <section id={section.id} className="sbh-px-band">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} />
      <div className="sbh-px-panel">
        <div className="sbh-px-timeline">
          {schedule.map((item, i) => (
            <div className="sbh-px-schedule-item" key={i}>
              <b>{item.cadence}</b>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConversationalDemoBlock({ section }) {
  const f = section.fields || {};
  const seed = Array.isArray(f.seedMessages) ? f.seedMessages : [];
  const [messages, setMessages] = useState(seed);
  const [input, setInput] = useState('');
  const [chips, setChips] = useState(() => splitChips(f.chipUpdates));
  const [impact, setImpact] = useState('');

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'agent', text: f.replyText || 'Noted — thank you for sharing that.' }]);
      setChips((prev) => [...prev, 'New context captured']);
      setImpact(f.journeyImpactText || '');
    }, 350);
  }

  return (
    <section id={section.id} className="sbh-px-band sbh-px-band-dark">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} intro={f.intro} dark />
      <div className="sbh-px-grid2">
        <div className="sbh-px-panel sbh-px-chat">
          <div className="sbh-px-messages">
            {messages.map((m, i) => (
              <div key={i} className={`sbh-px-message sbh-px-message-${m.role}`}>{m.text}</div>
            ))}
          </div>
          <div className="sbh-px-chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask BestyStaff a question..."
            />
            <button type="button" className="sbh-btn sbh-btn-primary" onClick={send}>Send</button>
          </div>
        </div>
        <div className="sbh-px-panel">
          <h3>Conversation-to-model updates</h3>
          <Chips items={chips} tone="req" />
          {impact && <p className="sbh-px-impact">{impact}</p>}
        </div>
      </div>
    </section>
  );
}

export function SalterMomentumMethodBlock({ section }) {
  const f = section.fields || {};
  const steps = Array.isArray(f.momentumSteps) ? f.momentumSteps : [];
  return (
    <section id={section.id} className="sbh-px-band sbh-px-band-dark">
      <PXHead eyebrow={f.eyebrow} heading={f.heading} dark />
      <div className="sbh-px-method-rail">
        {steps.map((step, i) => (
          <div className="sbh-px-method-step" key={i}>
            <span className="sbh-px-method-phase">{step.phase}</span>
            <h3>{step.label}</h3>
            {step.subtitle && <p className="sbh-eyebrow">{step.subtitle}</p>}
            <ul>
              {splitChips(step.points).map((pt, j) => <li key={j}>{pt}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {f.footnote && <p className="sbh-px-footnote">{f.footnote}</p>}
    </section>
  );
}
