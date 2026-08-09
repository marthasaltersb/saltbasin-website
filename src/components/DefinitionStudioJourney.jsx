import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CRYSTAL_VARIANTS, addCrystalLights } from '../lib/crystalGeometry.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';

const STORAGE_KEY = 'sb_definition_studio_journey_v1';
const GATES = [
  { id: 'semantic', label: 'Semantic definition', question: 'What business concept are we defining?', placeholder: 'Example: Qualified revenue opportunity', agent: 'Semantic Architect', deliverable: 'Canonical term, meaning, owner, and relationships', action: 'Save definition' },
  { id: 'rules', label: 'Configuration rules', question: 'What rule determines when this concept is valid?', placeholder: 'Example: Buyer, need, timing, and value are evidenced', agent: 'Configuration Engineer', deliverable: 'Executable validation and routing rules', action: 'Confirm rules' },
  { id: 'agent', label: 'Agent deployment', question: 'What should the agent observe and produce?', placeholder: 'Example: Observe CRM changes and prepare qualification evidence', agent: 'Deployment Steward', deliverable: 'Bounded inputs, schedule, actions, and output contract', action: 'Deploy agent' },
  { id: 'evidence', label: 'Evidence review', question: 'What evidence proves this definition is operating correctly?', placeholder: 'Example: CRM activity, buyer response, and approved pricing record', agent: 'Evidence Curator', deliverable: 'Traceable evidence packet and review findings', action: 'Submit review' },
  { id: 'approval', label: 'Approval convergence', question: 'Who owns final approval and the downstream handoff?', placeholder: 'Example: Revenue Operations approves, then routes to Contract Intelligence', agent: 'Convergence Steward', deliverable: 'Approved definition version and next-process event', action: 'Approve convergence' },
];

function loadState() {
  try { return { current: 0, answers: {}, completed: [], agentRuns: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { current: 0, answers: {}, completed: [], agentRuns: {} }; }
}

function JourneyScene({ current, completed }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL()) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030a10);
    scene.fog = new THREE.FogExp2(0x030a10, .026);
    const camera = new THREE.PerspectiveCamera(52, 1, .1, 160);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.className = 'dsj-canvas';
    host.appendChild(renderer.domElement);
    addCrystalLights(scene, THREE);
    scene.add(new THREE.AmbientLight(0x426374, .55));

    const path = new THREE.CatmullRomCurve3(GATES.map((_, i) => new THREE.Vector3((i - 2) * 7.5, Math.sin(i * 1.4) * 1.1, -i * 2.2)));
    const river = new THREE.Mesh(new THREE.TubeGeometry(path, 120, .18, 10, false), new THREE.MeshStandardMaterial({ color: 0x4a7c8e, emissive: 0x295a70, emissiveIntensity: 1.4, transparent: true, opacity: .82 }));
    scene.add(river);
    const gates = [];
    const crystalBuilders = Object.values(CRYSTAL_VARIANTS);
    GATES.forEach((gate, i) => {
      const point = path.points[i];
      const group = new THREE.Group();
      group.position.copy(point);
      const crystal = crystalBuilders[i % crystalBuilders.length](THREE, i % 2 ? 0x4a7c8e : 0xc4843a);
      crystal.scale.setScalar(i === current ? 1.35 : .92);
      group.add(crystal);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, .035, 8, 72), new THREE.MeshBasicMaterial({ color: completed.includes(gate.id) ? 0x8dbf9f : 0xc4843a, transparent: true, opacity: .8 }));
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      scene.add(group);
      gates.push(group);
    });
    const stars = new Float32Array(900 * 3);
    for (let i = 0; i < stars.length; i += 3) { stars[i] = (Math.random() - .5) * 100; stars[i + 1] = (Math.random() - .5) * 45; stars[i + 2] = (Math.random() - .5) * 80; }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8dcc4, size: .055, transparent: true, opacity: .7 })));

    let frame; let time = 0;
    const resize = () => { const w = host.clientWidth || 1; const h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const animate = () => {
      time += .012;
      gates.forEach((gate, i) => { gate.rotation.y += .005 + i * .0005; gate.position.y = path.points[i].y + Math.sin(time * 1.4 + i) * .18; });
      const focus = path.points[current];
      const target = new THREE.Vector3(focus.x, focus.y + 4.6, focus.z + 11.5);
      camera.position.lerp(target, .045);
      camera.lookAt(focus.x, focus.y, focus.z);
      renderer.render(scene, camera); frame = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); renderer.dispose(); renderer.domElement.remove(); };
  }, [current, completed]);
  return <div className="dsj-scene" ref={hostRef}><div className="dsj-camera-label">CAMERA LOCK / GATE {current + 1}</div></div>;
}

export default function DefinitionStudioJourney({ onClose, onOpenStudio }) {
  const [state, setState] = useState(loadState);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const gate = GATES[state.current];
  const health = useMemo(() => Math.round(28 + (state.completed.length / GATES.length) * 72), [state.completed]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  function runAgent() {
    setState((s) => ({ ...s, agentRuns: { ...s.agentRuns, [gate.id]: 'ready' } }));
  }
  function completeGate() {
    if (!(state.answers[gate.id] || '').trim()) return;
    setState((s) => {
      const completed = s.completed.includes(gate.id) ? s.completed : [...s.completed, gate.id];
      return { ...s, completed, current: Math.min(s.current + 1, GATES.length - 1) };
    });
  }

  return <section className="dsj-shell" style={{ '--journey-health': `${health}%` }}>
    <JourneyScene current={state.current} completed={state.completed} />
    <header className="dsj-topbar"><button type="button" onClick={onClose}>Back to Salt Basin world</button><div><span>DEFINITION STUDIO JOURNEY</span><strong>Definition to operation</strong></div><div className="dsj-health"><b>{health}%</b><span>operational health</span></div></header>
    <nav className="dsj-gates" aria-label="Journey gates">{GATES.map((item, index) => <button type="button" key={item.id} className={`${index === state.current ? 'active' : ''} ${state.completed.includes(item.id) ? 'complete' : ''}`} onClick={() => setState((s) => ({ ...s, current: index }))}><i>{state.completed.includes(item.id) ? 'OK' : index + 1}</i><span>{item.label}</span></button>)}</nav>
    <aside className={`dsj-panel${panelCollapsed ? ' collapsed' : ''}`}>
      <header><div><span>GATE {state.current + 1} OF {GATES.length}</span><h2>{gate.label}</h2></div><button type="button" onClick={() => setPanelCollapsed((v) => !v)}>{panelCollapsed ? 'Expand' : 'Collapse'}</button></header>
      {!panelCollapsed && <div className="dsj-panel-body">
        <label>{gate.question}<textarea value={state.answers[gate.id] || ''} placeholder={gate.placeholder} onChange={(event) => setState((s) => ({ ...s, answers: { ...s.answers, [gate.id]: event.target.value } }))} /></label>
        <article className="dsj-agent"><span>ASSIGNED AGENT</span><strong>{gate.agent}</strong><p>{gate.deliverable}</p><button type="button" onClick={runAgent}>{state.agentRuns[gate.id] === 'ready' ? 'Output ready for review' : 'Run bounded agent'}</button></article>
        <div className="dsj-records"><span>CONNECTED RECORDS</span><button><b>DEF-1042</b> Business semantic</button><button><b>RULE-021</b> Configuration envelope</button><button><b>APR-214</b> Approval record</button></div>
        <button type="button" className="dsj-primary" disabled={!(state.answers[gate.id] || '').trim()} onClick={completeGate}>{state.completed.includes(gate.id) ? 'Update and continue' : gate.action}</button>
        <button type="button" className="dsj-secondary" onClick={onOpenStudio}>Open Definition Studio tools</button>
      </div>}
    </aside>
    <div className="dsj-progress"><i /><span>{state.completed.length} of {GATES.length} gates approved</span></div>
  </section>;
}
