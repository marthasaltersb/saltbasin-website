import React, { useEffect, useRef, useState } from 'react';
import { ensureThree, hasWebGL } from './SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights } from '../lib/crystalGeometry.js';

// Consolidates every small decorative "mark" crystal (outer-network exit
// icons, the legend-crystal button, the legend list's per-destination
// thumbnails — anywhere a tiny spinning crystal is just a visual accent, not
// a full scene) onto ONE shared WebGL context instead of one-canvas-per-icon.
// A page with the crystal city, the legend open, and the outer network all
// visible at once could previously mount 20+ simultaneous WebGLRenderers,
// which is well past what browsers reliably support — Chrome starts evicting
// (losing) older contexts, which is what the repeated
// "WebGLRenderer: Context Lost/Restored" churn was.
//
// One <canvas> covers the viewport; every registered mark gets its own tiny
// Scene + Camera, and each frame we use gl.scissor/gl.viewport to render each
// one into just its own placeholder element's screen rect. See CrystalMark.jsx
// for the per-instance placeholder component that registers here.
const registry = new Map();
let threeRef = null; // set once ensureThree() resolves inside the mounted field

function hydrateMark(mark, THREE) {
  if (mark.ready) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
  camera.position.set(0, 0, 5.3);
  addCrystalLights(scene, THREE);
  const group = new THREE.Group();
  group.rotation.x = 0.3;
  scene.add(group);
  const handles = (CRYSTAL_VARIANTS[mark.variant] || CRYSTAL_VARIANTS.signature)(group, THREE);
  mark.scene = scene;
  mark.camera = camera;
  mark.group = group;
  mark.handles = handles;
  mark.ready = true;
}

export function registerCrystalMark(el, { variant = 'signature', autoRotate = true } = {}) {
  if (!el) return () => {};
  const id = Symbol('crystal-mark');
  const mark = { el, variant, autoRotate, ready: false };
  registry.set(id, mark);
  if (threeRef) hydrateMark(mark, threeRef);
  return () => {
    registry.delete(id);
    mark.scene?.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  };
}

export default function CrystalMarkField() {
  const canvasRef = useRef(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()) return undefined;
    let disposed = false;
    let frame = 0;
    let renderer = null;

    ensureThree().then((THREE) => {
      if (disposed || !canvasRef.current) return;
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      // alpha:true only lets the canvas composite with transparency — the
      // renderer's own clear color still defaults to opaque black, which
      // would paint the full viewport solid black every frame since we
      // clear() the whole canvas before scissoring each mark's tiny rect.
      renderer.setClearColor(0x000000, 0);
      renderer.setScissorTest(true);
      threeRef = THREE;
      registry.forEach((mark) => hydrateMark(mark, THREE));
      forceRender((n) => n + 1);

      const resize = () => renderer.setSize(window.innerWidth, window.innerHeight, true);
      resize();
      window.addEventListener('resize', resize);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        renderer.setScissorTest(false);
        renderer.clear();
        renderer.setScissorTest(true);
        const dpr = renderer.getPixelRatio();
        const canvasHeight = renderer.domElement.height;

        registry.forEach((mark) => {
          if (!mark.ready) hydrateMark(mark, THREE);
          if (!mark.el?.isConnected) return;
          const rect = mark.el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return;
          if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return;

          const w = Math.max(1, Math.round(rect.width * dpr));
          const h = Math.max(1, Math.round(rect.height * dpr));
          const x = Math.round(rect.left * dpr);
          const y = Math.round(canvasHeight - rect.top * dpr - h);
          renderer.setScissor(x, y, w, h);
          renderer.setViewport(x, y, w, h);
          mark.camera.aspect = rect.width / rect.height;
          mark.camera.updateProjectionMatrix();

          if (mark.autoRotate) {
            mark.group.rotation.y = t * 0.35;
            mark.group.rotation.x = 0.3 + Math.sin(t * 0.4) * 0.05;
            mark.handles.spin.forEach((mesh, index) => {
              mesh.rotation.x += index % 2 ? -0.01 : 0.008;
              mesh.rotation.y += index % 2 ? -0.006 : 0.012;
            });
          }
          renderer.render(mark.scene, mark.camera);
        });
      };
      animate();

      return () => window.removeEventListener('resize', resize);
    }).catch(() => {});

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      threeRef = null;
      renderer?.dispose?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="sbh-crystal-mark-field" aria-hidden="true" />;
}
