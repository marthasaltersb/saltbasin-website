import React, { useEffect, useMemo, useRef, useState } from 'react';
import SaltBasinCrystal from './SaltBasinCrystal.jsx';
import { businessDefinitionExperienceConfig as defaultConfig } from '../data/businessDefinitionExperienceConfig.js';
import SpatialJourneyWorld from './SpatialJourneyWorld.jsx';

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
  ctx.fillText('Channel Rods, rule sign-off, source paths, crystal nodes', split + 58, height * 0.68 + 44);
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

function ArtifactChips({ label, items }) {
  return (
    <div className="sbx-artifact-chip-group">
      <span>{label}</span>
      <div className="sbx-chip-row">
        {items.map((item) => <b key={item}>{item}</b>)}
      </div>
    </div>
  );
}

function ContextLogicRows({ rows, qualified }) {
  return (
    <div className="sbx-context-logic-rows">
      {rows.map((row) => {
        const redacted = row.restricted && !qualified;
        return (
          <div key={row.label} className={`sbx-context-logic-row${redacted ? ' redacted' : ''}`}>
            <span>{row.label}</span>
            <p>{redacted ? 'Redacted until this member journey is qualified.' : row.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function BestyStaffDropPanel({
  activeArtifact,
  activeLens,
  dimensions,
  focusedArtifacts,
  metadataModel,
  recommendations,
  acceptedRecIds,
  qualified,
  activeDropId,
  onSelectDrop,
}) {
  const drops = [
    {
      id: 'journey-dimensions',
      label: 'Channel Rod Dimensions',
      prompt: `What dimensions exist for ${activeArtifact.label}?`,
      answer: [
        `${activeArtifact.label} belongs to the ${activeArtifact.layer} layer and is interpreted through the ${activeLens.label} lens.`,
        `The current dimension state is ${dimensions.map((item) => `${item.label}: ${pct(item.value)}`).join(', ')}.`,
        `Focused render artifacts: ${focusedArtifacts.map((item) => item.label).join(', ')}.`,
      ],
    },
    {
      id: 'metadata-definitions',
      label: 'Metadata Definitions',
      prompt: 'What metadata definitions exist here?',
      answer: metadataModel.map((item) => `${item.tier}: ${item.definition}`),
    },
    {
      id: 'governance-rules',
      label: 'Governance Rules',
      prompt: 'What governance rules apply before BestyStaff can act?',
      answer: (activeArtifact.contextLogic || []).map((row) => (
        row.restricted && !qualified
          ? `${row.label}: REDACTED until member journey is qualified.`
          : `${row.label}: ${row.value}`
      )),
    },
    {
      id: 'approvals',
      label: 'Approvals',
      prompt: 'What approvals exist or remain open?',
      answer: [
        `${acceptedRecIds.length} reasoning recommendation(s) confirmed in this session.`,
        qualified ? 'Qualified journey: restricted rod paths and context logic can be exposed.' : 'Non-qualified journey: restricted context stays masked while architecture patterns remain inspectable.',
        `${recommendations.filter((item) => !acceptedRecIds.includes(item.id)).length} recommendation(s) still need human confirmation.`,
      ],
    },
    {
      id: 'visual-summary',
      label: 'Real-Time Visual Summary',
      prompt: 'Can you summarize what changed without generating an output?',
      answer: [
        `The spatial view is currently emphasizing ${focusedArtifacts.length} artifact(s): ${focusedArtifacts.map((item) => item.label).join(', ')}.`,
        `The active artifact is ${activeArtifact.label}, which resolves ${activeArtifact.inputs.join(', ')} into ${activeArtifact.outputs.join(', ')}.`,
        'BestyStaff can answer from contextual metadata and update the visual summary without generating a separate artifact, chart, or report.',
      ],
    },
  ];
  const activeDrop = drops.find((drop) => drop.id === activeDropId) || drops[0];

  return (
    <aside className="sbx-bestystaff-panel" aria-label="BestyStaff contextual chat section drops">
      <div className="sbx-bestystaff-header">
        <SaltBasinCrystal variant="founder" size="orbit" orbitCount={4} />
        <div>
          <p className="sbh-eyebrow">BestyStaff Context Chat</p>
          <h3>Ask the spatial model</h3>
          <span>{qualified ? 'Qualified journey logic view' : 'Non-qualified member view with redactions'}</span>
        </div>
      </div>

      <div className="sbx-bestystaff-message">
        <span>BestyStaff</span>
        <p>
          I can answer from the active Channel Rod context and update this visual summary in place.
          Choose a section drop instead of generating a separate output.
        </p>
      </div>

      <div className="sbx-selected-artifact-drop">
        <span>Selected 3D artifact</span>
        <h4>{activeArtifact.label}</h4>
        <p>{activeArtifact.architectureDefinition}</p>
        <code>{qualified ? activeArtifact.rodPath : 'rod path redacted until qualified'}</code>
      </div>

      <div className="sbx-drop-tabs" aria-label="BestyStaff section drops">
        {drops.map((drop) => (
          <button
            key={drop.id}
            type="button"
            className={activeDrop.id === drop.id ? 'active' : ''}
            onClick={() => onSelectDrop(drop.id)}
          >
            {drop.label}
          </button>
        ))}
      </div>

      <div className="sbx-bestystaff-drop">
        <span>You asked</span>
        <h4>{activeDrop.prompt}</h4>
        <div className="sbx-bestystaff-answer">
          {activeDrop.answer.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ProductArtifactScene({ artifacts, activeArtifactId, activeLens, dimensions, onSelectArtifact }) {
  const dimensionByKey = useMemo(
    () => Object.fromEntries(dimensions.map((item) => [item.key, clamp01(item.value)])),
    [dimensions]
  );

  return (
    <div className="sbx-product-renderer" aria-label="3D contextual logic artifact workspace">
      <div className="sbx-renderer-floor" aria-hidden="true" />
      <div className="sbx-renderer-axis sbx-renderer-axis-x" aria-hidden="true" />
      <div className="sbx-renderer-axis sbx-renderer-axis-y" aria-hidden="true" />
      {artifacts.map((artifact, index) => {
        const isActive = activeArtifactId === artifact.id;
        const isFocused = activeLens.focusArtifacts.includes(artifact.id);
        const maturityValue = dimensionByKey[artifact.maturityKey] ?? 0.5;
        const lensIndex = activeLens.focusArtifacts.indexOf(artifact.id);
        const displayIndex = isFocused ? lensIndex : index;
        const total = isFocused ? activeLens.focusArtifacts.length : artifacts.length;
        const angle = ((displayIndex / Math.max(1, total)) * Math.PI * 2) - Math.PI / 2;
        const radiusX = isFocused ? 248 : 326;
        const radiusY = isFocused ? 126 : 178;
        const lift = Math.round((maturityValue - 0.5) * 34);
        const computedX = Math.round(Math.cos(angle) * radiusX);
        const computedY = Math.round(Math.sin(angle) * radiusY + (isFocused ? -8 : 22) - lift);
        const computedZ = isFocused ? 80 + Math.round(maturityValue * 56) : -96;
        return (
          <button
            key={artifact.id}
            type="button"
            className={`sbx-artifact-object${isActive ? ' active' : ''}${isFocused ? ' focused' : ''}`}
            style={{
              '--artifact-x': `${computedX}px`,
              '--artifact-y': `${computedY}px`,
              '--artifact-z': `${computedZ}px`,
              '--artifact-rotate': `${artifact.position.rotate || 0}deg`,
              '--artifact-delay': `${index * 0.08}s`,
              '--artifact-maturity': maturityValue,
            }}
            onClick={() => onSelectArtifact(artifact.id)}
          >
            <span className="sbx-artifact-beam" aria-hidden="true" />
            <span className="sbx-artifact-orb">
              <SaltBasinCrystal variant={artifact.variant} size="orbit" orbitCount={isFocused ? 5 : 2} />
            </span>
            <span className="sbx-artifact-label">
              <b>{artifact.label}</b>
              <em>{artifact.artifactType}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RevenueLifecycleWorld({ lifecycle, actorId, onActorChange }) {
  const [activeStageId, setActiveStageId] = useState(lifecycle.stages[0].id);
  const [originId, setOriginId] = useState(lifecycle.creationPaths[0].id);
  const [zoom, setZoom] = useState(0.84);
  const [agentReply, setAgentReply] = useState('I am watching authority, handoffs, and rod creation rules. Ask me before changing lifecycle data.');
  const activeStage = lifecycle.stages.find((stage) => stage.id === activeStageId);
  const actor = lifecycle.actors.find((item) => item.id === actorId) || lifecycle.actors[0];
  const requestUpdate = () => {
    const allowed = actor.canUpdate.some((scope) => activeStage.id.includes(scope));
    setAgentReply(allowed
      ? `Approved for ${actor.label}: I can validate and stage this ${activeStage.label} update, then show the writeback lineage before persistence.`
      : `I can show you ${activeStage.label}, but I cannot make that update for ${actor.label}. ${actor.denied}`);
  };
  return (
    <div className="sbx-revenue-experience">
      <div className="sbx-revenue-toolbar">
        <label>Interacting as<select value={actorId} onChange={(e) => onActorChange(e.target.value)}>{lifecycle.actors.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Lead origin<select value={originId} onChange={(e) => setOriginId(e.target.value)}>{lifecycle.creationPaths.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="sbx-zoom-controls"><button type="button" onClick={() => setZoom((z) => Math.max(.58, z - .12))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((z) => Math.min(1.2, z + .12))}>+</button></div>
      </div>
      <div className="sbx-origin-rule">{lifecycle.creationPaths.find((item) => item.id === originId)?.path}</div>
      <div className="sbx-lifecycle-world">
        <div className="sbx-lifecycle-track" style={{ '--journey-zoom': zoom }}>
          {lifecycle.stages.map((stage, index) => (
            <button key={stage.id} type="button" className={`sbx-lifecycle-node ${stage.kind} ${stage.id === activeStageId ? 'active' : ''}`} onClick={() => setActiveStageId(stage.id)}>
              <i>{index + 1}</i><b>{stage.label}</b><span>{stage.owner}</span>{stage.kind === 'handoff' && <em>Collaborative handoff</em>}
            </button>
          ))}
        </div>
      </div>
      <aside className="sbx-lifecycle-agent">
        <div><span>Journey Agent · authority aware</span><h3>{activeStage.label}</h3><p>{agentReply}</p></div>
        <div className="sbx-agent-actions"><button type="button" onClick={() => setAgentReply(`${actor.label} may view: ${actor.canView}.`)}>Ask what I can see</button><button type="button" onClick={requestUpdate}>Ask agent to update</button></div>
        {activeStage.details && <div className="sbx-stage-details">{activeStage.details.map((item) => <span key={item}>{item}</span>)}</div>}
      </aside>
    </div>
  );
}

export default function BusinessDefinitionExperience({ config = defaultConfig }) {
  const [experienceView, setExperienceView] = useState('definition');
  const [actorId, setActorId] = useState('ae');
  const [activeScenarioId, setActiveScenarioId] = useState(config.scenarioFamilies[0]?.id);
  const [activeNodeId, setActiveNodeId] = useState(config.careerCrystalNodes[1]?.id);
  const [activeRecId, setActiveRecId] = useState(config.metadataRecommendations[0]?.id);
  const [activePromptId, setActivePromptId] = useState(config.enrichmentPrompts[0]?.id);
  const [activeLensId, setActiveLensId] = useState(config.contextualLogicLenses[0]?.id);
  const [activeArtifactId, setActiveArtifactId] = useState(config.productDefinitionArtifacts[0]?.id);
  const [isQualifiedJourney, setIsQualifiedJourney] = useState(false);
  const [activeDropId, setActiveDropId] = useState('journey-dimensions');
  const [intake, setIntake] = useState(config.intakeDefaults);
  const [dimensions, setDimensions] = useState(config.maturityDimensions);
  const [acceptedRecIds, setAcceptedRecIds] = useState([]);
  const [runStarted, setRunStarted] = useState(false);
  const [freeJourneysUsed, setFreeJourneysUsed] = useState(config.validationJourneyExamples.length);
  const [satisfaction, setSatisfaction] = useState(0.76);
  const [desiredChanges, setDesiredChanges] = useState('More specific board contribution context, richer client initiative branches, and clearer visual differences between role-based and case-study-based evidence.');
  const [memberMetadataDefinition, setMemberMetadataDefinition] = useState('Board contribution context, committee role, investment thesis contribution, advisory influence');

  const maturity = useMemo(() => {
    const base = dimensions.reduce((sum, item) => sum + clamp01(item.value), 0) / Math.max(1, dimensions.length);
    const contextBoost = Math.min(0.14, (Number(intake.documentCount) || 0) * 0.006 + (Number(intake.promptCount) || 0) * 0.003);
    const signoffBoost = acceptedRecIds.length * 0.025;
    return clamp01(base * 0.78 + contextBoost + signoffBoost);
  }, [acceptedRecIds.length, dimensions, intake.documentCount, intake.promptCount]);

  const canvasRef = useCanvasWorld(maturity, activeNodeId);
  const activeScenario = config.scenarioFamilies.find((item) => item.id === activeScenarioId) || config.scenarioFamilies[0];
  const activeNode = config.careerCrystalNodes.find((item) => item.id === activeNodeId) || config.careerCrystalNodes[0];
  const activeRod = config.journeyDataRods.find((item) => item.id === activeNode?.rodId);
  const activeRec = config.metadataRecommendations.find((item) => item.id === activeRecId) || config.metadataRecommendations[0];
  const activePrompt = config.enrichmentPrompts.find((item) => item.id === activePromptId) || config.enrichmentPrompts[0];
  const activeLens = config.contextualLogicLenses.find((item) => item.id === activeLensId) || config.contextualLogicLenses[0];
  const activeArtifact = config.productDefinitionArtifacts.find((item) => item.id === activeArtifactId) || config.productDefinitionArtifacts[0];
  const focusedArtifacts = config.productDefinitionArtifacts.filter((item) => activeLens.focusArtifacts.includes(item.id));
  const latestValidation = config.validationJourneyExamples[config.validationJourneyExamples.length - 1];
  const validationAllowanceRemaining = Math.max(0, config.validationJourneyPolicy.freeJourneyAllowance - freeJourneysUsed);
  const shouldBranchLead = freeJourneysUsed >= config.validationJourneyPolicy.freeJourneyAllowance;
  const enrichmentDelta = latestValidation
    ? latestValidation.enrichmentFields - latestValidation.originalSynthesisFields
    : 0;

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

  // The unified WebGL journey world replaces the legacy multi-canvas prototype.
  // Legacy implementation remains below for reference while migration completes,
  // but is intentionally not mounted to avoid exhausting browser WebGL contexts.
  return <SpatialJourneyWorld />;

  /* c8 ignore start */
  return (
    <div className="sbx-experience sbx-spatial-only sb-home-redesign" data-theme="strategic">
      <SpatialJourneyWorld />
      <section className="sbx-hero">
        <div className="sbx-hero-copy">
          <p className="sbh-eyebrow">{config.experience.eyebrow}</p>
          <h1>{config.experience.title}</h1>
          <p>{config.experience.lede}</p>
          <div className="sbx-hero-actions">
            <button type="button" className="sbh-btn sbh-btn-primary" onClick={runTenPassLoop}>
              {config.validationStart.ctaLabel}
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

      <section className="sbx-band sbx-product-demo">
        <div className="sbx-view-switcher" aria-label="Experience view">
          {config.experienceViews.map((view) => <button key={view.id} type="button" className={experienceView === view.id ? 'active' : ''} onClick={() => setExperienceView(view.id)}><b>{view.label}</b><span>{view.description}</span></button>)}
        </div>
        {experienceView === 'revenue' ? <RevenueLifecycleWorld lifecycle={config.revenueLifecycle} actorId={actorId} onActorChange={setActorId} /> : <>
        <div className="sbx-product-demo-copy">
          <p className="sbh-eyebrow">{config.productExperience.eyebrow}</p>
          <h2>{config.productExperience.title}</h2>
          <p>{config.productExperience.lede}</p>
          <div className="sbx-qualification-toggle" aria-label="Member journey qualification state">
            <span>Journey access</span>
            <div>
              <button
                type="button"
                className={!isQualifiedJourney ? 'active' : ''}
                onClick={() => setIsQualifiedJourney(false)}
              >
                Non-qualified
              </button>
              <button
                type="button"
                className={isQualifiedJourney ? 'active' : ''}
                onClick={() => setIsQualifiedJourney(true)}
              >
                Qualified
              </button>
            </div>
            <p>{isQualifiedJourney ? 'Full architecture logic exposed for this demo journey.' : config.productExperience.redactionPolicy}</p>
          </div>
          <div className="sbx-lens-switcher" aria-label="Contextual logic lens selector">
            {config.contextualLogicLenses.map((lens) => (
              <button
                key={lens.id}
                type="button"
                className={activeLensId === lens.id ? 'active' : ''}
                onClick={() => {
                  setActiveLensId(lens.id);
                  setActiveArtifactId(lens.focusArtifacts[0]);
                }}
              >
                <span>{lens.label}</span>
                <em>{lens.action}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="sbx-product-demo-stage">
          <ProductArtifactScene
            artifacts={config.productDefinitionArtifacts}
            activeArtifactId={activeArtifactId}
            activeLens={activeLens}
            dimensions={dimensions}
            onSelectArtifact={setActiveArtifactId}
          />
          {activeArtifact && (
            <BestyStaffDropPanel
              activeArtifact={activeArtifact}
              activeLens={activeLens}
              dimensions={dimensions}
              focusedArtifacts={focusedArtifacts}
              metadataModel={config.contextualMetadataModel}
              recommendations={config.metadataRecommendations}
              acceptedRecIds={acceptedRecIds}
              qualified={isQualifiedJourney}
              activeDropId={activeDropId}
              onSelectDrop={setActiveDropId}
            />
          )}
        </div>

        <div className="sbx-product-demo-footer" aria-label="Live spatial summary">
          <div>
            <span>Active logic lens</span>
            <b>{activeLens.label}</b>
            <p>{activeLens.action}</p>
          </div>
          <div>
            <span>BestyStaff operation</span>
            <b>Mapped context writeback only</b>
            <p>{config.productExperience.operatorPrompt}</p>
          </div>
          <div>
            <span>Focused artifacts</span>
            <b>{focusedArtifacts.length} rendered objects</b>
            <p>{focusedArtifacts.map((item) => item.label).join(' -> ')}</p>
          </div>
        </div>
        </>}
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
            <b>{runStarted ? 'Validation journey started' : 'Ready to validate and enrich'}</b>
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

      <section className="sbx-band sbx-validation-start">
        <div className="sbx-panel sbx-earliest-event">
          <p className="sbh-eyebrow">{config.validationStart.firstStopLabel}</p>
          <h2>{config.validationStart.earliestEvent.label}</h2>
          <p>{config.validationStart.instruction}</p>
          <div className="sbx-rod-path">{config.validationStart.earliestEvent.rodPath}</div>
          <div className="sbx-detail-columns">
            <div>
              <h3>Why this is the first stop</h3>
              <p className="sbx-muted">{config.validationStart.earliestEvent.reason}</p>
            </div>
            <div>
              <h3>Source paths used</h3>
              <SourcePathList refs={config.validationStart.earliestEvent.sourceRefs} />
            </div>
          </div>
        </div>
        <div className="sbx-panel sbx-prompt-panel">
          <p className="sbh-eyebrow">BestyStaff Enrichment Prompts</p>
          <h2>Ask only what improves the rod</h2>
          <p className="sbx-muted">
            Each prompt attaches new context to a specific Career Journey Data Rod branch and raises confidence for a defined metadata area.
          </p>
          <div className="sbx-prompt-list">
            {config.enrichmentPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                className={`sbx-prompt-card${activePromptId === prompt.id ? ' active' : ''}`}
                onClick={() => setActivePromptId(prompt.id)}
              >
                <span>{prompt.category}</span>
                <strong>{prompt.prompt}</strong>
              </button>
            ))}
          </div>
          {activePrompt && (
            <div className="sbx-active-prompt">
              <h3>{activePrompt.category}</h3>
              <p>{activePrompt.prompt}</p>
              <div className="sbx-rod-path">{activePrompt.attachesTo}</div>
              <div className="sbx-chip-row">
                {activePrompt.raisesConfidenceFor.map((item) => <b key={item}>{item}</b>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="sbx-band sbx-validation-journeys">
        <div className="sbx-section-head">
          <p className="sbh-eyebrow">{config.validationJourneyPolicy.label}</p>
          <h2>Every validation becomes its own rod</h2>
          <p>{config.validationJourneyPolicy.definition}</p>
          <div className="sbx-rod-path">{config.validationJourneyPolicy.rodPath}</div>
        </div>
        <div className="sbx-validation-layout">
          <div className="sbx-panel">
            <h3>Free validation journey allowance</h3>
            <p className="sbx-muted">
              Members receive {config.validationJourneyPolicy.freeJourneyAllowance} free validation journeys before BestyStaff branches a lead for additional work.
            </p>
            <label className="sbx-journey-count">
              Free validation journeys used
              <input
                type="range"
                min="0"
                max="7"
                value={freeJourneysUsed}
                onChange={(e) => setFreeJourneysUsed(Number(e.target.value))}
              />
              <b>{freeJourneysUsed} used / {validationAllowanceRemaining} remaining</b>
            </label>
            {shouldBranchLead ? (
              <div className="sbx-lead-branch">
                <span>Lead branch triggered</span>
                <strong>{config.validationJourneyPolicy.leadBranchPath}</strong>
                <p>{config.validationJourneyPolicy.overAllowanceRule}</p>
              </div>
            ) : (
              <div className="sbx-run-card">
                <b>Validation journey available</b>
                <span>BestyStaff can continue enrichment without creating a commercial lead branch yet.</span>
              </div>
            )}
          </div>
          <div className="sbx-panel">
            <h3>Journey-to-journey comparison</h3>
            <div className="sbx-validation-table">
              {config.validationJourneyExamples.map((journey) => (
                <div key={journey.id} className="sbx-validation-row">
                  <span>{journey.label}</span>
                  <b>{journey.elapsedMinutes}m</b>
                  <em>{journey.enrichmentFields} enrichments</em>
                  <strong>{journey.metadataShapeChanges} shape changes</strong>
                </div>
              ))}
            </div>
            {latestValidation && (
              <div className="sbx-run-card">
                <b>Latest enrichment delta</b>
                <span>
                  {enrichmentDelta >= 0 ? '+' : ''}{enrichmentDelta} fields vs original synthesis, impacting {latestValidation.outputVersionsImpacted} output version(s).
                </span>
              </div>
            )}
          </div>
        </div>
        {shouldBranchLead && (
          <div className="sbx-panel sbx-satisfaction-panel">
            <p className="sbh-eyebrow">BestyStaff Satisfaction Gate</p>
            <h3>{config.validationJourneyPolicy.satisfactionPrompt}</h3>
            <label className="sbx-journey-count">
              Satisfaction level so far
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(satisfaction * 100)}
                onChange={(e) => setSatisfaction(Number(e.target.value) / 100)}
              />
              <b>{pct(satisfaction)}</b>
            </label>
            <label className="sbx-member-definition">
              Additional visual or metadata changes requested
              <textarea value={desiredChanges} onChange={(e) => setDesiredChanges(e.target.value)} />
            </label>
            <div className="sbx-lead-branch">
              <span>Payment-fit recommendation</span>
              <p>{config.validationJourneyPolicy.paymentFitRule}</p>
            </div>
          </div>
        )}
      </section>

      <section className="sbx-band sbx-rod-section">
        <div className="sbx-section-head">
          <p className="sbh-eyebrow">Rendering Source of Truth</p>
          <h2>Minimal Journey Data Rod graph</h2>
          <p>
            The Career Crystal should render from connected Data Rods and branch relationships. Persisted tables can store evidence and events,
            but the visual state is derived from the rod graph alone.
          </p>
        </div>
        <div className="sbx-principle-grid">
          {config.renderingPrinciples.map((principle) => (
            <div key={principle} className="sbx-principle-card">{principle}</div>
          ))}
        </div>
        <div className="sbx-panel sbx-context-layer">
          <p className="sbh-eyebrow">{config.memberContextLayer.label}</p>
          <h3>{config.memberContextLayer.purpose}</h3>
          <div className="sbx-rod-path">{config.memberContextLayer.rodPath}</div>
          <div className="sbx-detail-columns">
            <div>
              <h3>Context layer stores</h3>
              <ul>
                {config.memberContextLayer.stores.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3>Writeback boundary</h3>
              <p className="sbx-muted">{config.memberContextLayer.writebackBoundary}</p>
              <label className="sbx-member-definition">
                Additional member-defined metadata enrichment
                <textarea value={memberMetadataDefinition} onChange={(e) => setMemberMetadataDefinition(e.target.value)} />
              </label>
            </div>
          </div>
        </div>
        <div className="sbx-metadata-model-grid">
          {config.contextualMetadataModel.map((item) => (
            <div key={item.tier} className="sbx-metadata-tier">
              <span>{item.tier}</span>
              <h3>{item.label}</h3>
              <p>{item.definition}</p>
              <div className="sbx-chip-row">
                {item.examples.map((example) => <b key={example}>{example}</b>)}
              </div>
            </div>
          ))}
        </div>
        <div className="sbx-panel sbx-impact-panel">
          <p className="sbh-eyebrow">Real-Time Metadata Shape Impact</p>
          <h3>Contextual changes update metadata models and prior output versions</h3>
          <div className="sbx-impact-list">
            {config.contextImpactExamples.map((item) => (
              <div key={item.change} className="sbx-impact-item">
                <b>{item.change}</b>
                <span>{item.metadataShapeImpact}</span>
                <em>{item.outputImpact}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="sbx-rod-graph">
          {config.journeyDataRods.map((rod) => (
            <div key={rod.id} className={`sbx-rod-card sbx-rod-${rod.type}`}>
              <span>{rod.type.replaceAll('_', ' ')}</span>
              <h3>{rod.label}</h3>
              <p>{rod.historicalContext}</p>
              <div className="sbx-rod-path">{rod.path}</div>
              <div className="sbx-rod-meta">
                <b>Branch from</b>
                <em>{rod.branchFrom || 'root'}</em>
              </div>
              <div className="sbx-rod-meta">
                <b>Render role</b>
                <em>{rod.renderRole}</em>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sbx-band sbx-career-crystal">
        <div className="sbx-crystal-copy">
          <p className="sbh-eyebrow">Career Journey Data Rod</p>
          <h2>Career Crystal Member Network</h2>
          <p>
            The Career Crystal renders from a Career Journey Data Rod that branches from the existing Member Journey Data Rod.
            Institution and case-study visuals are orbiting render outputs from historical branch relationships, not primary database objects.
          </p>
          {activeNode && (
            <div className="sbx-node-detail">
              <span>{activeNode.category}</span>
              <h3>{activeNode.objectLabel}</h3>
              <p>{activeNode.label} confidence: {pct(activeNode.confidence)}</p>
              <div className="sbx-rod-path">{activeNode.branchRelationship}</div>
              <p className="sbx-muted">{activeNode.historicalWindow}</p>
              {activeRod && (
                <div className="sbx-rod-meta">
                  <b>Rendered from rod</b>
                  <em>{activeRod.path}</em>
                </div>
              )}
              <div className="sbx-chip-row">
                {activeNode.roleBranches.map((branch) => <b key={branch}>{branch}</b>)}
              </div>
            </div>
          )}
        </div>
        <div className="sbx-crystal-stage">
          <div className="sbx-crystal-core">
            <SaltBasinCrystal variant="signature" size="hero" interactive orbitCount={12} />
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
                aria-label={`Select ${node.label} crystal`}
              >
                <SaltBasinCrystal variant={node.variant} size="orbit" />
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
            renderingSource: 'journey_data_rods_only',
            rootRod: 'memberJourneyRod/{memberId}',
            branchRod: 'memberJourneyRod/{memberId}/branches/careerJourneyRod',
            activeRenderBranch: activeNode?.branchRelationship,
            validationStart: config.validationStart.earliestEvent.rodPath,
            validationJourneyRod: config.validationJourneyPolicy.rodPath,
            freeValidationJourneysUsed: freeJourneysUsed,
            freeValidationJourneysRemaining: validationAllowanceRemaining,
            leadBranchTriggered: shouldBranchLead,
            leadBranchPath: shouldBranchLead ? config.validationJourneyPolicy.leadBranchPath : null,
            satisfaction,
            desiredChanges,
            latestValidationComparison: latestValidation ? {
              elapsedMinutes: latestValidation.elapsedMinutes,
              originalSynthesisFields: latestValidation.originalSynthesisFields,
              enrichmentFields: latestValidation.enrichmentFields,
              enrichmentDelta,
              metadataShapeChanges: latestValidation.metadataShapeChanges,
              outputVersionsImpacted: latestValidation.outputVersionsImpacted,
            } : null,
            activeEnrichmentPrompt: activePrompt?.attachesTo,
            activeLogicLens: activeLens?.label,
            activeProductArtifact: activeArtifact ? {
              id: activeArtifact.id,
              type: activeArtifact.artifactType,
              architectureDefinition: activeArtifact.architectureDefinition,
              rodPath: isQualifiedJourney ? activeArtifact.rodPath : 'REDACTED_NON_QUALIFIED_MEMBER_JOURNEY',
              redactionPolicyApplied: !isQualifiedJourney,
              contextLogic: (activeArtifact.contextLogic || []).map((row) => ({
                label: row.label,
                value: row.restricted && !isQualifiedJourney ? 'REDACTED_NON_QUALIFIED_MEMBER_JOURNEY' : row.value,
              })),
              userAction: activeArtifact.userAction,
              inputs: activeArtifact.inputs,
              outputs: activeArtifact.outputs,
            } : null,
            focusedProductArtifacts: focusedArtifacts.map((artifact) => artifact.id),
            memberContextLayer: config.memberContextLayer.rodPath,
            memberDefinedMetadataDefinition: memberMetadataDefinition,
            bestyStaffWritebackPolicy: config.memberContextLayer.writebackBoundary,
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
  /* c8 ignore stop */
}
