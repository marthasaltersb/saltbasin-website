// Variant Creation Studio (salt-basin-world-variants Phase 8 slice, 2026-09-06) — Betsy asked for
// "a standalone generator that can create new [world] variants through a prompt and different
// geometric specifications... like generative art... model the seed randomness dimensions" for
// "the elevated 3d objects."
//
// This panel is a real, working preview studio, not a mockup: the prompt box calls
// server/lib/worldVariantSeedAgent.js (forced-tool-choice Anthropic call, bounded to
// atomGeometry.js's real geometry vocabulary and the real brand accent tokens); the structured
// controls edit the same GenerativeSeedSpec directly; the canvas renders the seeded cluster with
// the ACTUAL atomGeometry.js builders (getBipyramidParts/getConfiguredAtomParts/buildAtomMaterial —
// the same functions Crystal Basin's live Atom Profile uses) so visual quality matches the shipped
// 3D world, not a lookalike reimplementation.
//
// What this Studio deliberately does NOT do: it never writes into WORLD_VARIANT_REGISTRY or
// worldVariantComponentProfiles.js. Those stay reviewed, human-committed source files — this panel
// only proposes/previews a GenerativeSeedSpec and lets Betsy copy its JSON into a real variant
// profile herself. See worldVariantGenerativeSeed.js's header for the full non-semantic boundary
// this file must never cross.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { api } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { getBipyramidParts, getConfiguredAtomParts, buildAtomMaterial } from '../../lib/journeyEngine/atomGeometry.js';
import {
  GENERATIVE_PRIMITIVE_FAMILY,
  GENERATIVE_ACCENT_TOKEN,
  DEFAULT_GENERATIVE_SEED_SPEC,
  resolveGenerativeCluster,
  describeGenerativeSeedSpec,
} from '../../config/visual/worldVariantGenerativeSeed.js';

const S = {
  wrap: { background: '#0d1417', color: '#f5f0e8', minHeight: '100%', padding: '1.5rem' },
  header: { marginBottom: '1rem' },
  eyebrow: { fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c4843a', marginBottom: '0.3rem' },
  title: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 500 },
  sub: { fontSize: '0.8rem', color: '#a9a49a', marginTop: '0.4rem', maxWidth: 720, lineHeight: 1.5 },
  boundary: {
    marginTop: '0.75rem', fontSize: '0.72rem', color: '#d9c9a3', background: 'rgba(196,132,58,0.08)',
    border: '0.5px solid rgba(196,132,58,0.3)', borderRadius: 8, padding: '0.6rem 0.8rem', maxWidth: 720, lineHeight: 1.5,
  },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(300px,1fr)', gap: '1rem', marginTop: '1.25rem', alignItems: 'start' },
  canvasCard: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.6rem' },
  panel: { background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', fontSize: '0.82rem', marginBottom: '1rem' },
  panelTitle: { fontFamily: 'Fraunces, serif', fontSize: '1rem', marginBottom: '0.6rem' },
  field: { marginBottom: '0.8rem' },
  fieldLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4843a', marginBottom: '0.3rem' },
  fieldMapping: { fontSize: '0.66rem', color: '#8b877c', marginTop: '0.25rem', lineHeight: 1.4 },
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.5rem 0.6rem', color: '#f5f0e8', fontSize: '0.8rem' },
  textarea: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.6rem 0.7rem', color: '#f5f0e8', fontSize: '0.82rem', minHeight: 72, resize: 'vertical', fontFamily: 'inherit' },
  range: { width: '100%' },
  row: { display: 'flex', gap: '0.6rem' },
  btn: (tone) => ({
    padding: '0.55rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
    background: tone === 'gold' ? '#c4843a' : 'transparent', color: tone === 'gold' ? '#1c1410' : '#f5f0e8',
    borderColor: tone === 'ghost' ? 'rgba(255,255,255,0.2)' : 'transparent', borderWidth: tone === 'ghost' ? '0.5px' : 0, borderStyle: 'solid',
    opacity: 1,
  }),
  rationale: { fontSize: '0.78rem', color: '#d9c9a3', marginTop: '0.6rem', lineHeight: 1.5, fontStyle: 'italic' },
  pre: { fontSize: '0.72rem', background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '0.75rem', overflowX: 'auto', color: '#c9e8d4', maxHeight: 220, overflowY: 'auto' },
};

function hexToNum(cssColorString, fallback) {
  if (typeof document === 'undefined') return fallback;
  const trimmed = (cssColorString || '').trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('#')) return parseInt(trimmed.slice(1), 16);
  const probe = document.createElement('div');
  probe.style.color = trimmed;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = rgb.match(/\d+/g);
  if (!m) return fallback;
  return (parseInt(m[0], 10) << 16) + (parseInt(m[1], 10) << 8) + parseInt(m[2], 10);
}

function resolveAccentHex(accentToken) {
  if (typeof window === 'undefined') return 0xc4843a;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(accentToken);
  return hexToNum(raw, 0xc4843a);
}

const FAMILY_LABEL = {
  [GENERATIVE_PRIMITIVE_FAMILY.BIPYRAMID]: 'Bipyramid (atom — facet-count variable)',
  [GENERATIVE_PRIMITIVE_FAMILY.OCTAHEDRON]: 'Octahedron',
  [GENERATIVE_PRIMITIVE_FAMILY.ICOSAHEDRON]: 'Icosahedron',
  [GENERATIVE_PRIMITIVE_FAMILY.TETRAHEDRON]: 'Tetrahedron',
  [GENERATIVE_PRIMITIVE_FAMILY.HEX_CRYSTAL]: 'Hex Crystal',
  [GENERATIVE_PRIMITIVE_FAMILY.PRISM]: 'Prism',
};
const ACCENT_LABEL = {
  [GENERATIVE_ACCENT_TOKEN.GOLD]: 'Gold',
  [GENERATIVE_ACCENT_TOKEN.TEAL]: 'Teal',
  [GENERATIVE_ACCENT_TOKEN.MAUVE]: 'Mauve',
  [GENERATIVE_ACCENT_TOKEN.CHAMPAGNE]: 'Champagne',
  [GENERATIVE_ACCENT_TOKEN.GREIGE]: 'Greige',
};

function buildInstanceMesh(instance, accentHex) {
  const visual = {
    colorHex: accentHex,
    metalness: instance.metalness,
    roughness: instance.roughness,
    opacity: instance.opacity,
    emissiveColor: accentHex,
    emissiveIntensity: 0.12 + instance.metalness * 0.18,
  };
  const material = buildAtomMaterial(THREE, visual);
  const group = new THREE.Group();
  if (instance.geometryKey === GENERATIVE_PRIMITIVE_FAMILY.BIPYRAMID) {
    const { top, bottom } = getBipyramidParts(THREE, instance.radialSegments);
    group.add(new THREE.Mesh(top, material));
    group.add(new THREE.Mesh(bottom, material.clone()));
  } else {
    const { primary } = getConfiguredAtomParts(THREE, instance.geometryKey, instance.radialSegments);
    group.add(new THREE.Mesh(primary, material));
  }
  group.position.set(instance.position.x, instance.position.y, instance.position.z);
  group.rotation.y = instance.rotationY;
  group.scale.setScalar(instance.scaleJitter);
  return group;
}

export default function WorldVariantStudioPanel() {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const [seedSpec, setSeedSpec] = useState(DEFAULT_GENERATIVE_SEED_SPEC);
  const [rationale, setRationale] = useState('');
  const [suggestedWorldFamily, setSuggestedWorldFamily] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Mount the scene once — same lighting shape (ambient + directional + point) SpatialJourneyWorld.jsx
  // uses, so this preview reads at the same visual quality bar as the live 3D world, not a dimmer copy.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const width = host.clientWidth || 480;
    const height = 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a121c);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir1 = new THREE.DirectionalLight(0xfff2df, 0.9);
    dir1.position.set(6, 8, 4);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x8fb8c9, 0.35);
    dir2.position.set(-6, -2, -4);
    scene.add(dir2);
    const point = new THREE.PointLight(0xc4843a, 0.4, 20);
    point.position.set(0, 4, 6);
    scene.add(point);

    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);

    sceneRef.current = scene;
    clusterGroupRef.current = clusterGroup;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    let angle = 0;
    const animate = () => {
      angle += 0.0035;
      camera.position.x = Math.sin(angle) * 11;
      camera.position.z = Math.cos(angle) * 11;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, []);

  // Rebuild only the cluster instances whenever the spec changes — the scene/camera/lights persist.
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;
    while (clusterGroup.children.length) {
      const child = clusterGroup.children.pop();
      child.traverse((node) => {
        if (node.geometry) node.geometry.dispose?.();
        if (node.material) node.material.dispose?.();
      });
    }
    let instances;
    try {
      instances = resolveGenerativeCluster(seedSpec);
    } catch (e) {
      toast(e.message);
      return;
    }
    const accentHex = resolveAccentHex(seedSpec.accentToken);
    for (const instance of instances) clusterGroup.add(buildInstanceMesh(instance, accentHex));
  }, [seedSpec]);

  const patchSpec = useCallback((patch) => {
    setSeedSpec((prev) => ({ ...prev, ...patch }));
  }, []);

  const randomizeSeed = () => patchSpec({ seed: Math.floor(Math.random() * 2147483647) + 1 });

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast('Describe what you want first.'); return; }
    setGenerating(true);
    try {
      const hints = { primitiveFamily: seedSpec.primitiveFamily, accentToken: seedSpec.accentToken };
      const result = await api.generateVariantSeed(prompt, hints);
      setSeedSpec(result.seedSpec);
      setRationale(result.rationale || '');
      setSuggestedWorldFamily(result.suggestedWorldFamily);
      toast('Generated a new seed spec from your prompt.');
    } catch (e) {
      toast(e.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(seedSpec, null, 2));
      toast('Seed spec JSON copied — paste into a variant profile for a reviewed code change.');
    } catch {
      setShowJson(true);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.eyebrow}>3D World Variant Engine · Variant Creation Studio</div>
        <div style={S.title}>Generative Seed Studio</div>
        <div style={S.sub}>
          Describe a look, or tune the dials directly, and preview a small cluster of elevated 3D objects built from
          the same crystal geometry Crystal Basin renders with today. A seed is reproducible generative art — the
          same seed number always regenerates the identical cluster.
        </div>
        <div style={S.boundary}>
          Aesthetic only. These dials (shape, facets, twist, spread, one brand accent, clarity, count) can never
          encode Query Relevance, Confidence, Stability, Maturity, or any other governed metric — that boundary is
          enforced in code (worldVariantGenerativeSeed.js), not just by convention. Nothing here writes into the
          real variant registry; copy the JSON below into a reviewed profile change when you're happy with it.
        </div>
      </div>

      <div style={S.layout}>
        <div>
          <div style={S.canvasCard}>
            <div ref={hostRef} style={{ width: '100%', height: 360, borderRadius: 8, overflow: 'hidden' }} />
          </div>

          <div style={{ ...S.panel, marginTop: '1rem' }}>
            <div style={S.panelTitle}>Prompt</div>
            <textarea
              style={S.textarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'a warm, densely faceted geode cluster' or 'sparse, cool, sharply twisted shards'"
            />
            <div style={{ ...S.row, marginTop: '0.6rem' }}>
              <button type="button" style={S.btn('gold')} onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate from Prompt'}
              </button>
              <button type="button" style={S.btn('ghost')} onClick={randomizeSeed}>Randomize Seed</button>
            </div>
            {rationale && (
              <div style={S.rationale}>
                “{rationale}”{suggestedWorldFamily ? ` — closest existing family: ${suggestedWorldFamily}.` : ''}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={S.panel}>
            <div style={S.panelTitle}>Geometric Specification</div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Primitive Family</span></label>
              <select style={S.input} value={seedSpec.primitiveFamily} onChange={(e) => patchSpec({ primitiveFamily: e.target.value })}>
                {Object.values(GENERATIVE_PRIMITIVE_FAMILY).map((key) => (
                  <option key={key} value={key}>{FAMILY_LABEL[key]}</option>
                ))}
              </select>
              <div style={S.fieldMapping}>Real atomGeometry.js geometry key — the shape Crystal Basin's own atoms render with.</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Facet Density</span><span>{seedSpec.facetAmount.toFixed(2)}</span></label>
              <input style={S.range} type="range" min={0} max={1} step={0.01} value={seedSpec.facetAmount} onChange={(e) => patchSpec({ facetAmount: Number(e.target.value) })} />
              <div style={S.fieldMapping}>radialSegments = round(5 + facetAmount × 9) — atomGeometry.js's real bipyramid range. Only affects the Bipyramid family.</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Twist</span><span>{seedSpec.twist.toFixed(2)}</span></label>
              <input style={S.range} type="range" min={0} max={1} step={0.01} value={seedSpec.twist} onChange={(e) => patchSpec({ twist: Number(e.target.value) })} />
              <div style={S.fieldMapping}>Per-instance seeded Y-rotation jitter, as a fraction of a full turn.</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Cluster Spread</span><span>{seedSpec.clusterSpread.toFixed(2)}</span></label>
              <input style={S.range} type="range" min={0} max={1} step={0.01} value={seedSpec.clusterSpread} onChange={(e) => patchSpec({ clusterSpread: Number(e.target.value) })} />
              <div style={S.fieldMapping}>Seeded scatter radius/height of the preview cluster — presentation only, not a layout algorithm.</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Clarity</span><span>{seedSpec.clarity.toFixed(2)}</span></label>
              <input style={S.range} type="range" min={0} max={1} step={0.01} value={seedSpec.clarity} onChange={(e) => patchSpec({ clarity: Number(e.target.value) })} />
              <div style={S.fieldMapping}>Maps into buildAtomMaterial's existing metalness/roughness/opacity domain — the same material system every live atom uses.</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}><span>Accent</span></label>
              <select style={S.input} value={seedSpec.accentToken} onChange={(e) => patchSpec({ accentToken: e.target.value })}>
                {Object.values(GENERATIVE_ACCENT_TOKEN).map((key) => (
                  <option key={key} value={key}>{ACCENT_LABEL[key]}</option>
                ))}
              </select>
              <div style={S.fieldMapping}>A real brand --sb-* token, resolved live from the current theme — never a one-off hex.</div>
            </div>

            <div style={S.row}>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}><span>Count</span></label>
                <input style={S.input} type="number" min={3} max={24} value={seedSpec.count} onChange={(e) => patchSpec({ count: Math.max(3, Math.min(24, Number(e.target.value) || 3)) })} />
              </div>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}><span>Seed</span></label>
                <input style={S.input} type="number" value={seedSpec.seed} onChange={(e) => patchSpec({ seed: Number(e.target.value) || 1 })} />
              </div>
            </div>
          </div>

          <div style={S.panel}>
            <div style={S.panelTitle}>Export</div>
            <div style={{ fontSize: '0.76rem', color: '#a9a49a', marginBottom: '0.6rem' }}>{describeGenerativeSeedSpec(seedSpec)}</div>
            <div style={S.row}>
              <button type="button" style={S.btn('gold')} onClick={copyJson}>Copy Seed Spec JSON</button>
              <button type="button" style={S.btn('ghost')} onClick={() => setShowJson((v) => !v)}>{showJson ? 'Hide JSON' : 'Show JSON'}</button>
            </div>
            {showJson && <pre style={{ ...S.pre, marginTop: '0.6rem' }}>{JSON.stringify(seedSpec, null, 2)}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
}
