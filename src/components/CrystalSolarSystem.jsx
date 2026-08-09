import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CRYSTAL_VARIANTS, addCrystalLights, buildRiverParticles, advanceRiverParticles } from '../lib/crystalGeometry.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';

const GOLD = 0xc4843a;
const TEAL = 0x4a7c8e;
const CREAM = 0xf5f0e8;

function hex(value, fallback = GOLD) {
  const parsed = Number.parseInt(String(value || '').replace('#', ''), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textSprite(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 190;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(4,13,20,.78)';
  ctx.roundRect(10, 10, 748, 170, 34);
  ctx.fill();
  ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5f0e8';
  ctx.font = '600 47px Jost, sans-serif';
  ctx.fillText(title, 384, 82);
  ctx.fillStyle = 'rgba(245,240,232,.65)';
  ctx.font = '28px Jost, sans-serif';
  ctx.fillText(subtitle, 384, 132);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(5.1, 1.25, 1);
  sprite.renderOrder = 30;
  return sprite;
}

function orbitLine(radius, color, opacity = .28) {
  const points = [];
  for (let i = 0; i <= 160; i += 1) {
    const a = (i / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

export default function CrystalSolarSystem({ worlds, memberLabel, onEnterWorld }) {
  const hostRef = useRef(null);
  const callbackRef = useRef(onEnterWorld);
  const [ready, setReady] = useState(false);
  callbackRef.current = onEnterWorld;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !worlds.length || !hasWebGL()) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030a10);
    scene.fog = new THREE.FogExp2(0x030a10, 0.018);
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 240);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    renderer.domElement.className = 'mco-solar-canvas';
    renderer.domElement.style.touchAction = 'none';

    addCrystalLights(scene, THREE);
    scene.add(new THREE.AmbientLight(0x314755, .38));

    const starGeo = new THREE.BufferGeometry();
    const stars = new Float32Array(1500 * 3);
    for (let i = 0; i < stars.length; i += 3) {
      const r = 35 + Math.random() * 80;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - .5) * 55;
      stars[i] = Math.cos(a) * r; stars[i + 1] = y; stars[i + 2] = Math.sin(a) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: CREAM, size: .08, transparent: true, opacity: .65 })));

    const system = new THREE.Group();
    system.rotation.x = -.08;
    scene.add(system);

    const core = new THREE.Group();
    const coreHandles = CRYSTAL_VARIANTS.signature(core, THREE);
    core.scale.set(1.8, 1.8, 1.8);
    system.add(core);
    const coreHalo = new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 20), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: .05, side: THREE.BackSide }));
    core.add(coreHalo);
    const coreLabel = textSprite(memberLabel || 'Member', 'CRYSTAL CORE', GOLD);
    coreLabel.position.y = -3.2;
    core.add(coreLabel);

    const pickables = [];
    const planetSystems = [];
    const rivers = [];
    const variantNames = ['rings', 'engine', 'hourglass', 'signature'];
    worlds.forEach((world, index) => {
      const radius = 7.5 + index * 4.15;
      const color = hex(world.accent, index % 2 ? TEAL : GOLD);
      const track = orbitLine(radius, color, .24);
      track.rotation.x = .18 + (index % 2) * .14;
      track.rotation.z = index % 2 ? -.11 : .08;
      system.add(track);

      const pivot = new THREE.Group();
      pivot.rotation.y = (index / Math.max(worlds.length, 1)) * Math.PI * 2 + .45;
      pivot.rotation.z = index % 2 ? -.08 : .06;
      system.add(pivot);

      const planet = new THREE.Group();
      planet.position.x = radius;
      planet.userData.worldId = world.id;
      pivot.add(planet);
      const crystal = new THREE.Group();
      const handles = (CRYSTAL_VARIANTS[variantNames[index % variantNames.length]] || CRYSTAL_VARIANTS.signature)(crystal, THREE);
      const scale = 1.05 + Math.min(world.variants.length, 8) * .025;
      crystal.scale.set(scale, scale, scale);
      planet.add(crystal);
      pickables.push({ object: crystal, world });

      const planetRing = orbitLine(2.15, color, .42);
      planetRing.rotation.x = Math.PI / 2.6;
      planet.add(planetRing);
      const label = textSprite(world.label, `${world.variants.length} CAPABILITY ORBITS`, color);
      label.position.y = 2.8;
      planet.add(label);

      world.variants.slice(0, 10).forEach((variant, moonIndex) => {
        const angle = (moonIndex / Math.max(world.variants.length, 1)) * Math.PI * 2;
        const moonRadius = 2.15 + (moonIndex % 2) * .5;
        const moon = new THREE.Mesh(
          new THREE.OctahedronGeometry(.16 + (moonIndex % 3) * .035, 0),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .55, roughness: .28, metalness: .42 })
        );
        moon.position.set(Math.cos(angle) * moonRadius, Math.sin(angle * 2) * .3, Math.sin(angle) * moonRadius);
        moon.userData.baseAngle = angle;
        moon.userData.radius = moonRadius;
        moon.userData.speed = .16 + moonIndex * .013;
        planet.add(moon);
      });

      const river = buildRiverParticles(THREE, { from: new THREE.Vector3(), to: new THREE.Vector3(radius, 0, 0), color, count: 40 });
      pivot.add(river);
      rivers.push(river);
      planetSystems.push({ pivot, planet, handles, speed: .025 / Math.sqrt(index + 1), moons: planet.children.filter((item) => item.userData?.radius) });
    });

    let azimuth = .72;
    let elevation = .38;
    let distance = 34;
    let targetDistance = 34;
    const target = new THREE.Vector3(0, .3, 0);
    let drag = null;
    let dragged = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function resize() {
      const width = host.clientWidth || 900;
      const height = host.clientHeight || 650;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    function down(event) { drag = { x: event.clientX, y: event.clientY }; dragged = false; renderer.domElement.setPointerCapture?.(event.pointerId); }
    function move(event) {
      if (!drag || event.buttons === 0) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      azimuth -= dx * .005;
      elevation = Math.max(.08, Math.min(1.05, elevation + dy * .0035));
      drag = { x: event.clientX, y: event.clientY };
    }
    function up(event) {
      if (!dragged) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(pickables.map((item) => item.object), true)[0];
        if (hit) {
          const picked = pickables.find((item) => {
            let node = hit.object;
            while (node) {
              if (node === item.object) return true;
              node = node.parent;
            }
            return false;
          });
          if (picked) callbackRef.current?.(picked.world);
        }
      }
      drag = null;
    }
    function wheel(event) { event.preventDefault(); targetDistance = Math.max(15, Math.min(62, targetDistance + event.deltaY * .025)); }
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    renderer.domElement.addEventListener('wheel', wheel, { passive: false });

    const clock = new THREE.Clock();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), .04);
      distance += (targetDistance - distance) * .08;
      camera.position.set(Math.cos(azimuth) * Math.cos(elevation) * distance, Math.sin(elevation) * distance + 3, Math.sin(azimuth) * Math.cos(elevation) * distance);
      camera.lookAt(target);
      core.rotation.y += dt * .12;
      coreHandles.spin.forEach((mesh, index) => { mesh.rotation.z += dt * (index % 2 ? -.16 : .2); });
      planetSystems.forEach(({ pivot, planet, handles, speed, moons }) => {
        pivot.rotation.y += dt * speed;
        planet.rotation.y -= dt * .14;
        handles.spin.forEach((mesh, index) => { mesh.rotation.y += dt * (index % 2 ? -.22 : .25); });
        moons.forEach((moon) => {
          moon.userData.baseAngle += dt * moon.userData.speed;
          const a = moon.userData.baseAngle;
          moon.position.x = Math.cos(a) * moon.userData.radius;
          moon.position.z = Math.sin(a) * moon.userData.radius;
          moon.rotation.x += dt * .8; moon.rotation.y += dt;
        });
      });
      rivers.forEach((river) => advanceRiverParticles(river, dt));
      renderer.render(scene, camera);
    }
    animate();
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', up);
      renderer.domElement.removeEventListener('wheel', wheel);
      scene.traverse((object) => { object.geometry?.dispose?.(); if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.()); else object.material?.dispose?.(); });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [worlds, memberLabel]);

  if (!hasWebGL()) return <div className="mco-solar-fallback">3D navigation requires WebGL. Use the accessible world controls below.</div>;
  return <div ref={hostRef} className="mco-solar-system" data-ready={ready}><div className="mco-solar-loading">Entering crystal space...</div><div className="mco-solar-hint">Drag to orbit camera · scroll to travel · select a crystal planet</div></div>;
}
