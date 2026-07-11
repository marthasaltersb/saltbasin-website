import React, { useEffect, useMemo, useRef, useState } from 'react';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import { businessDefinitionExperienceConfig as defaultConfig } from '../data/businessDefinitionExperienceConfig.js';

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function pct(value) {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function useCanvasWorld(maturity, activeNodeId) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let disposed = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawOffice(t) {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      const split = width * 0.5;
      const glow = maturity * 0.85 + 0.1;
      const oldGradient = ctx.createLinearGradient(0, 0, split, height);
      oldGradient.addColorStop(0, '#172434');
      oldGradient.addColorStop(1, '#54402e');
      ctx.fillStyle = oldGradient;
      ctx.fillRect(0, 0, split, height);

      const newGradient = ctx.createLinearGradient(split, 0, width, height);
      newGradient.addColorStop(0, '#102636');
      newGradient.addColorStop(0.55, '#244e5c');
      newGradient.addColorStop(1, '#f1ddba');
      ctx.fillStyle = newGradient;
      ctx.fillRect(split, 0, split, height);

      ctx.strokeStyle = `rgba(196,132,58,${0.24 + glow * 0.36})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(split, 0);
      ctx.lineTo(split, height);
      ctx.stroke();

      drawOldWorld(ctx, width, height, t);
      drawNewWorld(ctx, width, height, t, maturity, activeNodeId);
    }

    function animate(now) {
      if (disposed) return;
      drawOffice(now / 1000);
      frame = requestAnimationFrame(animate);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [maturity, activeNodeId]);

  return ref;
}

function drawOldWorld(ctx, width, height, t) {
  const split = width * 0.5;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(245,240,232,0.12)';
  for (let i = 0; i < 6; i += 1) {
    const x = 28 + i * 62;
    const y = height * 0.62 + Math.sin(t + i) * 3;
    ctx.fillRect(x, y, 42, 78);
    ctx.fillStyle = i % 2 ? 'rgba(196,132,58,0.18)' : 'rgba(245,240,232,0.12)';
  }
  ctx.strokeStyle = 'rgba(245,240,232,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i += 1) {
    const y = 44 + i * 22;
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(split - 34, y + Math.sin(t * 0.6 + i) * 5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(17,25,40,0.55)';
  ctx.fillRect(34, height * 0.25, split - 92, 54);
  ctx.fillStyle = 'rgba(245,240,232,0.56)';
  ctx.font = '700 13px system-ui';
  ctx.fillText('Unstructured evidence', 50, height * 0.25 + 24);
  ctx.font = '11px system-ui';
  ctx.fillText('documents, screenshots, prior chats, edge cases', 50, height * 0.25 + 42);
  ctx.restore();
}

function drawNewWorld(ctx, width, height, t, maturity, activeNodeId) {
  const split = width * 0.5;
  const cx = split + (width - split) * 0.5;
  const cy = height * 0.48;
  const radius = 70 + maturity * 76;
  const labels = ['education', 'career', 'board', 'case-studies', 'skills'];

  ctx.save();
  ctx.globalAlpha = 0.22 + maturity * 0.44;
  ctx.strokeStyle = '#f8f4ec';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 4; r += 1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius + r * 28, (radius + r * 18) * 0.56, t * 0.05 + r, 0, Math.PI * 2);
    ctx.stroke();
  }

  labels.forEach((id, i) => {
    const angle = t * 0.18 + (i / labels.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * (radius + 28);
    const y = cy + Math.sin(angle) * (radius * 0.58);
    const active = activeNodeId === id;
    ctx.globalAlpha = active ? 1 : 0.68;
    ctx.fillStyle = active ? '#C4843A' : '#F8F4EC';
    ctx.beginPath();
    ctx.arc(x, y, active ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = active ? '#FFF2DD' : 'rgba(248,244,236,0.36)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(248,244,236,0.12)';
  ctx.fillRect(split + 40, height * 0.68, width - split - 80, 64);
  ctx.fillStyle = 'rgba(248,244,236,0.82)';
  ctx.font = '700 13px system-ui';
  ctx.fillText('Validated office state', split + 58, height * 0.68 + 25);
  ctx.font = '11px system-ui';
  ctx.fillText('journey rods, rule sign-off, source paths, crystal nodes', split + 58, height * 0.68 + 44);
  ctx.restore();
}

function MetricBar({ item, value, onChange }) {
  return (
    <label className="sbx-meter-row">
      <span>{item.label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(clamp01(value) * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <b>{pct(value)}</b>
    </label>
  );
}

function SourcePathList({ refs }) {
  return (
    <div className="sbx-source-paths">
      {refs.map((ref) => (
        <div key={`${ref.label}-${ref.path}`} className="sbx-source-path">
          <strong>{ref.label}</strong>
          <span>{ref.path}</span>
        </div>
      ))}
    </div>
  );
}

export default function BusinessDefinitionExperience({ config = defaultConfig }) {
  const [activeScenarioId, setActiveScenarioId] = useState(config.scenarioFamilies[0]?.id);
  const [activeNodeId, setActiveNodeId] = useState(config.careerCrystalNodes[1]?.id);
  const [activeRecId, setActiveRecId] = useState(config.metadataRecommendations[0]?.id);
  const [intake, setIntake] = useState(config.intakeDefaults);
  const [dimensions, setDimensions] = useState(config.maturityDimensions);
  const [acceptedRecIds, setAcceptedRecIds] = useState([]);
  const [runStarted, setRunStarted] = useState(false);

  const maturity = useMemo(() => {
    const base = dimensions.reduce((sum, item) => sum + clamp01(item.value), 0) / Math.max(1, dimensions.length);
    const contextBoost = Math.min(0.14, (Number(intake.documentCount) || 0) * 0.006 + (Number(intake.promptCount) || 0) * 0.003);
    const signoffBoost = acceptedRecIds.length * 0.025;
    return clamp01(base * 0.78 + contextBoost + signoffBoost);
  }, [acceptedRecIds.length, dimensions, intake.documentCount, intake.promptCount]);

  const canvasRef = useCanvasWorld(maturity, activeNodeId);
  const activeScenario = config.scenarioFamilies.find((item) => item.id === activeScenarioId) || config.scenarioFamilies[0];
  const activeNode = config.careerCrystalNodes.find((item) => item.id === activeNodeId) || config.careerCrystalNodes[0];
  const activeRec = config.metadataRecommendations.find((item) => item.id === activeRecId) || config.metadataRecommendations[0];

  function updateDimension(key, value) {
    setDimensions((current) => current.map((item) => (item.key === key ? { ...item, value } : item)));
  }

  function updateIntake(key, value) {
    setIntake((current) => ({ ...current, [key]: value }));
  }

  function toggleAccepted(id) {
    setAcceptedRecIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function runTenPassLoop() {
    setRunStarted(true);
    setDimensions((current) => current.map((item, index) => ({ ...item, value: clamp01(item.value + 0.04 + index * 0.01) })));
  }

  return (
    <div className="sbx-experience sb-home-redesign" data-theme="strategic">
      <section className="sbx-hero">
        <div className="sbx-hero-copy">
          <p className="sbh-eyebrow">{config.experience.eyebrow}</p>
          <h1>{config.experience.title}</h1>
          <p>{config.experience.lede}</p>
          <div className="sbx-hero-actions">
            <button type="button" className="sbh-btn sbh-btn-primary" onClick={runTenPassLoop}>
              Run 10-pass synthesis
            </button>
            <a className="sbh-btn sbh-btn-secondary" href="/output/business-definition-experience#metadata-review">
              Review metadata judgments
            </a>
          </div>
        </div>
        <div className="sbx-world-card">
          <canvas ref={canvasRef} aria-label="Parallel old-world and new-world office rendering" />
          <div className="sbx-world-label sbx-world-old">
            <strong>{config.experience.oldWorldLabel}</strong>
            <span>{config.experience.oldWorldText}</span>
          </div>
          <div className="sbx-world-label sbx-world-new">
            <strong>{config.experience.newWorldLabel}</strong>
            <span>{config.experience.newWorldText}</span>
          </div>
          <div className="sbx-maturity-orb">
            <strong>{pct(maturity)}</strong>
            <span>rendered maturity</span>
          </div>
        </div>
      </section>

      <section className="sbx-band sbx-intake-grid">
        <div className="sbx-panel">
          <p className="sbh-eyebrow">Member Intake Contract</p>
          <h2>Start by making context visible</h2>
          <p className="sbx-muted">
            The agent should expose how much context it has before making career metadata recommendations.
            The member is explicitly asked how many prior conversations may exist outside the current session.
          </p>
          <div className="sbx-field-grid">
            <label>
              Documents synthesized
              <input type="number" min="0" value={intake.documentCount} onChange={(e) => updateIntake('documentCount', e.target.value)} />
            </label>
            <label>
              Intake chat prompts gathered
              <input type="number" min="0" value={intake.promptCount} onChange={(e) => updateIntake('promptCount', e.target.value)} />
            </label>
            <label>
              How many prior conversations should I account for?
              <input type="number" min="0" value={intake.priorConversationEstimate} onChange={(e) => updateIntake('priorConversationEstimate', e.target.value)} />
            </label>
            <label>
              Analysis passes requested
              <input type="number" min="1" max="10" value={intake.requestedPasses} onChange={(e) => updateIntake('requestedPasses', e.target.value)} />
            </label>
          </div>
          <div className="sbx-run-card">
            <b>{runStarted ? 'Synthesis loop queued' : 'Synthesis loop ready'}</b>
            <span>
              {intake.requestedPasses} passes across {intake.documentCount || 0} document(s), {intake.promptCount || 0} prompt(s), and an estimated {intake.priorConversationEstimate || 0} prior conversation(s).
            </span>
          </div>
        </div>

        <div className="sbx-panel">
          <p className="sbh-eyebrow">Maturity Controls</p>
          <h2>Configuration drives the rendered world</h2>
          <p className="sbx-muted">
            As definitions move from draft to validated, tested, and signed off, the new-world office and Career Crystal become more complete.
          </p>
          <div className="sbx-meters">
            {dimensions.map((item) => (
              <MetricBar key={item.key} item={item} value={item.value} onChange={(value) => updateDimension(item.key, value)} />
            ))}
          </div>
        </div>
      </section>

      <section className="sbx-band sbx-career-crystal">
        <div className="sbx-crystal-copy">
          <p className="sbh-eyebrow">Career Journey Data Rod</p>
          <h2>Career Crystal Member Network</h2>
          <p>
            The Career Crystal turns a member&apos;s documents, research, prior context, and self-attested prompts into orbiting institution and case-study objects.
            Each object can carry source paths, confidence, maturity, public-output policy, and tagged job-role branches.
          </p>
          {activeNode && (
            <div className="sbx-node-detail">
              <span>{activeNode.category}</span>
              <h3>{activeNode.objectLabel}</h3>
              <p>{activeNode.label} confidence: {pct(activeNode.confidence)}</p>
              <div className="sbx-chip-row">
                {activeNode.roleBranches.map((branch) => <b key={branch}>{branch}</b>)}
              </div>
            </div>
          )}
        </div>
        <div className="sbx-crystal-stage">
          <div className="sbx-crystal-core">
            <SaltBasinCrystal variant="signature" size="hero" interactive orbitCount={12} />
            <span>Career Crystal</span>
          </div>
          {config.careerCrystalNodes.map((node, index) => {
            const angle = (index / config.careerCrystalNodes.length) * 360;
            return (
              <button
                key={node.id}
                type="button"
                className={`sbx-orbit-node${activeNodeId === node.id ? ' active' : ''}`}
                style={{ '--angle': `${angle}deg` }}
                onClick={() => setActiveNodeId(node.id)}
              >
                <SaltBasinCrystal variant={node.variant} size="orbit" />
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sbx-band sbx-scenario-grid">
        <div className="sbx-section-head">
          <p className="sbh-eyebrow">L2 Dimensions</p>
          <h2>Business definition scenarios become office infrastructure</h2>
          <p>Each scenario family has required metadata and a risk statement so the member can judge what must be defined before agents depend on it.</p>
        </div>
        <div className="sbx-scenario-list">
          {config.scenarioFamilies.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={`sbx-scenario-card${activeScenarioId === scenario.id ? ' active' : ''}`}
              onClick={() => setActiveScenarioId(scenario.id)}
            >
              <span>{scenario.priority}</span>
              <h3>{scenario.label}</h3>
              <p>{scenario.risk}</p>
            </button>
          ))}
        </div>
        {activeScenario && (
          <div className="sbx-panel sbx-scenario-detail">
            <h3>{activeScenario.label}</h3>
            <p>{activeScenario.risk}</p>
            <div className="sbx-chip-row">
              {activeScenario.requiredMetadata.map((item) => <b key={item}>{item}</b>)}
            </div>
          </div>
        )}
      </section>

      <section id="metadata-review" className="sbx-band sbx-review-grid">
        <div className="sbx-review-list">
          <p className="sbh-eyebrow">Reasoning Transparency</p>
          <h2>First-layer metadata recommendations</h2>
          {config.metadataRecommendations.map((rec) => (
            <button
              key={rec.id}
              type="button"
              className={`sbx-rec-card${activeRecId === rec.id ? ' active' : ''}${acceptedRecIds.includes(rec.id) ? ' accepted' : ''}`}
              onClick={() => setActiveRecId(rec.id)}
            >
              <span>{rec.priority}</span>
              <strong>{rec.recommendation}</strong>
              <small>{pct(rec.confidence)} confidence</small>
            </button>
          ))}
        </div>
        {activeRec && (
          <div className="sbx-panel sbx-rec-detail">
            <div className="sbx-rec-head">
              <span className="sbh-eyebrow">{activeRec.priority} Judgment</span>
              <button type="button" className="sbh-btn sbh-btn-primary" onClick={() => toggleAccepted(activeRec.id)}>
                {acceptedRecIds.includes(activeRec.id) ? 'Undo confirmation' : 'Confirm reasoning'}
              </button>
            </div>
            <h2>{activeRec.recommendation}</h2>
            <p className="sbx-definition">{activeRec.decidedDefinition}</p>
            <div className="sbx-detail-columns">
              <div>
                <h3>Alternate outcomes surfaced</h3>
                <ul>
                  {activeRec.alternateOutcomes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3>Missing context to raise confidence</h3>
                <ul>
                  {activeRec.missingElements.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <h3>Triangulated source paths</h3>
            <SourcePathList refs={activeRec.sourceRefs} />
          </div>
        )}
      </section>

      <section className="sbx-band sbx-spec-output">
        <div className="sbx-panel">
          <p className="sbh-eyebrow">Generated Spec Preview</p>
          <h2>Career Journey Data Rod rendering inputs</h2>
          <div className="sbx-spec-grid">
            {config.journeyStages.map((stage) => (
              <div key={stage.id} className="sbx-stage-card">
                <span>{stage.label}</span>
                <b>{pct(stage.score * 0.5 + maturity * 0.5)}</b>
              </div>
            ))}
          </div>
          <pre>{JSON.stringify({
            documentCount: Number(intake.documentCount) || 0,
            promptCount: Number(intake.promptCount) || 0,
            priorConversationEstimate: Number(intake.priorConversationEstimate) || 0,
            requestedPasses: Number(intake.requestedPasses) || 10,
            maturity: Number(maturity.toFixed(2)),
            activeScenario: activeScenario?.label,
            activeCareerCrystalNode: activeNode?.label,
            confirmedRecommendations: acceptedRecIds.length,
          }, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
