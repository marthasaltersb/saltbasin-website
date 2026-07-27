import React, { useEffect, useRef, useState } from 'react';
import { ensureThree, hasWebGL } from './SaltBasinCrystal.jsx';
import { CRYSTAL_VARIANTS, addCrystalLights, buildGemMesh, projectToScreen } from '../lib/crystalGeometry.js';

// The "New World" reveal — a real signature crystal with real 3D metadata
// nodes orbiting it, color-graded along the maturity spectrum (dark → gold).
// Replaces the earlier CSS clip-path triangle nodes: every node here is an
// actual lit, shaded mesh from the shared crystal recipe, and its label is
// positioned each frame from the mesh's true projected screen position
// rather than a CSS rotation transform (which also fixes the earlier
// sideways-label readability issue at certain orbit angles).
const DARK = 0x3b2315;
const GOLD = 0xdca64c;

export default function CrystalRoomScene({ active = false, nodes = [], pulseActive = false, onLayout }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active || !hasWebGL()) return undefined;
    let disposed = false;
    let frame = 0;
    let renderer;
    let scene;
    let observer;

    ensureThree().then((THREE) => {
      if (disposed || !hostRef.current || !canvasRef.current) return;
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
      camera.position.set(0, 0, 7.2);

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

      const lights = addCrystalLights(scene, THREE);

      const core = new THREE.Group();
      core.rotation.x = 0.3;
      scene.add(core);
      CRYSTAL_VARIANTS.signature(core, THREE);

      const goldColor = new THREE.Color(GOLD);
      const darkColor = new THREE.Color(DARK);
      const nodeMeshes = nodes.map((node, index) => {
        const t = nodes.length > 1 ? index / (nodes.length - 1) : 0;
        const maturity = node.maturity ?? t;
        const color = darkColor.clone().lerp(goldColor, maturity);
        const mesh = buildGemMesh(THREE, { color, size: 0.24, metalness: 0.5, roughness: 0.28 });
        const angle = (index / nodes.length) * Math.PI * 2;
        mesh.userData.angle = angle;
        // Kept well inside the frame (not pushed to camera.z=7.2's edge)
        // since each node's label is centered on its projected point — a
        // node too near the frame edge clips its own label under the room's
        // rounded, overflow:hidden border.
        mesh.userData.radius = 2.35;
        mesh.userData.nodeId = node.id;
        mesh.userData.bornAt = index * 0.28;
        mesh.scale.setScalar(0.001);
        scene.add(mesh);
        return mesh;
      });

      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.35, 0.012, 8, 96),
        new THREE.MeshBasicMaterial({ color: 0xC4843A, transparent: true, opacity: 0.28 })
      );
      scene.add(orbitRing);

      const overlayEls = new Map();
      overlayRef.current?.querySelectorAll('[data-node-id]').forEach((el) => {
        overlayEls.set(el.getAttribute('data-node-id'), el);
      });

      function resize() {
        if (!hostRef.current || !renderer) return;
        const rect = hostRef.current.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      }
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(hostRef.current);
      setReady(true);

      const clock = new THREE.Clock();
      const projected = new THREE.Vector3();

      function animate() {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const speedMul = pulseActive ? 1.8 : 1;

        core.rotation.y = t * 0.3 * speedMul;
        lights.key.intensity = pulseActive ? 1.4 + Math.sin(t * 6) * 0.5 : 1.4;
        orbitRing.rotation.x = 0.15;
        orbitRing.rotation.y = t * 0.08;

        const rect = hostRef.current.getBoundingClientRect();
        const layout = [];
        nodeMeshes.forEach((mesh) => {
          const born = Math.max(0, Math.min(1, (t - mesh.userData.bornAt) / 0.6));
          const eased = 1 - Math.pow(1 - born, 3);
          const angle = mesh.userData.angle + t * 0.08;
          mesh.position.set(Math.cos(angle) * mesh.userData.radius, Math.sin(angle) * mesh.userData.radius * 0.62, Math.sin(angle * 0.6) * 0.8);
          mesh.scale.setScalar(0.001 + eased * 0.24);
          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.014;

          const el = overlayEls.get(mesh.userData.nodeId);
          if (!el) return;
          mesh.getWorldPosition(projected);
          const point = projectToScreen(THREE, projected, camera, rect.width, rect.height);
          if (!point || eased < 0.4) {
            el.style.opacity = '0';
          } else {
            // Clamp away from the frame edge — the room clips overflow, and
            // a centered label near the raw edge would clip its own text.
            const margin = 42;
            const x = Math.max(margin, Math.min(rect.width - margin, point.x));
            const y = Math.max(margin, Math.min(rect.height - margin, point.y));
            el.style.opacity = String(eased);
            el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          }
          layout.push({ id: mesh.userData.nodeId, x: point?.x ?? 0, y: point?.y ?? 0 });
        });
        onLayout?.(layout);

        renderer.render(scene, camera);
      }
      animate();
    }).catch(() => setReady(false));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      scene?.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer?.dispose?.();
    };
  }, [active, nodes.length, pulseActive]);

  return (
    <div ref={hostRef} className="sbh-crystal-room-scene" data-ready={ready}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="sbh-crystal-room-labels" ref={overlayRef}>
        {nodes.map((node) => (
          <b key={node.id} data-node-id={node.id}>{node.label}</b>
        ))}
      </div>
    </div>
  );
}
