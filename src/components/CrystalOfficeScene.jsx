import React, { useEffect, useRef, useState } from 'react';
import { ensureThree, hasWebGL } from './SaltBasinCrystal.jsx';
import { mergeCrystalExperience } from '../data/crystalExperienceConfig.js';
import { CRYSTAL_VARIANTS, addCrystalLights, projectToScreen } from '../lib/crystalGeometry.js';

// Every destination inside the crystal city is a real CRYSTAL_VARIANTS mesh —
// the exact same geometry/material recipe as the signature homepage crystal —
// never a flat CSS marker. Their hit-targets are rendered by the caller (see
// onLayout below) as a sibling of the hero copy with an explicit z-index —
// nesting them in here, inside the canvas's own lower-z-index box, let page
// copy silently steal their clicks regardless of the hit-target's own
// z-index, so positioning data is reported outward instead.
//
// Navigation is click-to-walk, not click-to-teleport: the camera is a real
// player position that travels through the city at a fixed speed (tunable
// via config.movement — see crystalExperienceConfig.js). Clicking a
// destination's hit-target sets `walkTargetId`; this component walks the
// player there and only calls `onArrive` once actually in range. Clicking
// open ground (anywhere the click isn't intercepted by a hit-target button)
// walks the player to that spot with no arrival callback — free wandering.
//
// Each destination's real content-density score (destination.maturity, 0-1 —
// computed by src/lib/maturityScoring.js from its actual captured fields,
// never hand-picked) makes richer, more complete content physically stand
// taller in the city, so the most marketable destinations are the ones that
// visually pull focus first.
export default function CrystalOfficeScene({ active = false, destinations = [], experience = null, hoveredId = null, focusedId = null, walkTargetId = null, onLayout, onArrive }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const config = mergeCrystalExperience(experience || {});
  const hoveredIdRef = useRef(hoveredId);
  hoveredIdRef.current = hoveredId;
  const focusedIdRef = useRef(focusedId);
  focusedIdRef.current = focusedId;
  const walkTargetIdRef = useRef(walkTargetId);
  walkTargetIdRef.current = walkTargetId;

  useEffect(() => {
    if (!active || !hasWebGL()) return undefined;
    let disposed = false;
    let frame = 0;
    let renderer;
    let scene;
    let observer;
    let canvasClickHandler = null;

    ensureThree().then((THREE) => {
      if (disposed || !hostRef.current || !canvasRef.current) return;
      scene = new THREE.Scene();
      const hex = (value) => new THREE.Color(value);
      scene.background = hex(config.theme.void);
      scene.fog = new THREE.FogExp2(hex(config.theme.fog), config.atmosphere.fogDensity);

      const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 120);
      camera.position.fromArray(config.camera.start);
      const cameraTarget = new THREE.Vector3(...config.camera.target);

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.outputEncoding = THREE.sRGBEncoding;

      const { eyeHeight, walkSpeed, arriveThreshold, stopDistance, bobAmplitude, bobSpeed, lookEase } = config.movement;

      addCrystalLights(scene, THREE);
      const entryLight = new THREE.PointLight(config.theme.gold, config.lighting.entry, 34);
      entryLight.position.set(0, 6, 8);
      scene.add(entryLight);
      const cityLight = new THREE.PointLight(config.theme.teal, config.lighting.city, 42);
      cityLight.position.set(0, 9, -12);
      scene.add(cityLight);

      const starPositions = [];
      for (let i = 0; i < config.atmosphere.starCount; i += 1) {
        const seed = i + 1;
        starPositions.push(Math.sin(seed * 12.9898) * 26, 3 + Math.abs(Math.sin(seed * 4.1414)) * 18, -4 - Math.abs(Math.cos(seed * 8.731)) * 54);
      }
      const starsGeometry = new THREE.BufferGeometry();
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: config.theme.cream, size: .075, transparent: true, opacity: .7 }));
      scene.add(stars);

      const portal = new THREE.Group();
      const portalMaterial = new THREE.MeshBasicMaterial({ color: config.theme.teal, transparent: true, opacity: .34 });
      const portalGold = new THREE.MeshBasicMaterial({ color: config.theme.gold, transparent: true, opacity: .48 });
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(.08, 7.2, .08), portalMaterial);
      const rightPillar = leftPillar.clone();
      leftPillar.position.set(-4.2, 3.4, -1.5); rightPillar.position.set(4.2, 3.4, -1.5);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(8.5, .08, .08), portalGold);
      lintel.position.set(0, 7, -1.5);
      const innerLintel = new THREE.Mesh(new THREE.BoxGeometry(6.5, .04, .04), portalMaterial);
      innerLintel.position.set(0, 5.8, -1.45);
      portal.add(leftPillar, rightPillar, lintel, innerLintel);
      scene.add(portal);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(46, 72, 22, 34),
        new THREE.MeshStandardMaterial({ color: config.theme.floor, metalness: 0.62, roughness: 0.28, wireframe: true, transparent: true, opacity: 0.34 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, -0.2, -16);
      scene.add(floor);

      const shellMaterial = new THREE.MeshPhysicalMaterial({ color: config.theme.teal, metalness: 0.18, roughness: 0.08, transmission: 0.72, transparent: true, opacity: config.atmosphere.shellOpacity, side: THREE.DoubleSide });
      const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(config.atmosphere.shellRadius, 1), shellMaterial);
      shell.scale.set(1.25, 0.72, 1.6);
      shell.position.z = -8;
      scene.add(shell);
      const shellWire = new THREE.Mesh(new THREE.IcosahedronGeometry(config.atmosphere.shellRadius + .15, 1), new THREE.MeshBasicMaterial({ color: config.theme.teal, wireframe: true, transparent: true, opacity: 0.12 }));
      shellWire.scale.copy(shell.scale); shellWire.position.copy(shell.position); scene.add(shellWire);

      // City destinations — each one is the same CRYSTAL_VARIANTS mesh used
      // for the signature homepage crystal, sized up and set on a pedestal,
      // never a generic cylinder building.
      const city = new THREE.Group();
      const destinationMeshes = [];
      const count = destinations.length || config.layout.minBuildings;
      for (let i = 0; i < count; i += 1) {
        const side = i % 2 ? 1 : -1;
        const lane = Math.floor(i / 2);
        // x grows monotonically with lane (not just alternating +/-0.8) so
        // two same-side destinations at different depths never line up
        // behind each other from the spawn viewpoint — when they did, their
        // flat HTML hit-circles overlapped on screen and the later-in-DOM
        // one always won the click, regardless of which crystal the player
        // actually clicked.
        const x = side * (4.5 + lane * 1.8);
        const z = -5 - lane * config.layout.laneSpacing;
        const destination = destinations[i] || {};
        const density = Math.max(0, Math.min(1, Number(destination.maturity ?? 0.5)));
        const scaleBase = (0.62 + (i % 4) * 0.12 + Number(destination.sceneHeight || 0) * 0.1) * (0.85 + density * 0.3);

        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.5, 0.4, Number(destination.sceneSides || 6)),
          new THREE.MeshStandardMaterial({ color: config.theme.floor, metalness: 0.4, roughness: 0.4, transparent: true, opacity: 0.6 })
        );
        pedestal.position.set(x, 0.2, z);
        city.add(pedestal);

        const holder = new THREE.Group();
        const variantFn = CRYSTAL_VARIANTS[destination.variant] || CRYSTAL_VARIANTS.signature;
        const handles = variantFn(holder, THREE);
        holder.scale.setScalar(scaleBase);
        holder.position.set(x, 2.1 + scaleBase * 0.5, z);
        holder.userData.destId = destination.id;
        holder.userData.baseScale = scaleBase;
        holder.userData.spin = handles.spin;
        city.add(holder);
        destinationMeshes.push(holder);
      }
      scene.add(city);

      const road = new THREE.Mesh(new THREE.PlaneGeometry(config.layout.roadWidth, config.layout.roadLength), new THREE.MeshStandardMaterial({ color: config.theme.fog, metalness: 0.8, roughness: 0.2 }));
      road.rotation.x = -Math.PI / 2; road.position.set(0, -0.14, -17); scene.add(road);
      for (let i = 0; i < 18; i += 1) {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 1.35), new THREE.MeshBasicMaterial({ color: i % 3 ? config.theme.tealDeep : config.theme.gold, transparent: true }));
        marker.position.set(0, -0.11, 7 - i * 3.2); marker.userData.routeIndex = i; scene.add(marker);
      }

      // Click-to-walk state. playerPos is the ground-plane position the
      // camera actually occupies once the entry flight hands off control;
      // walkOrder holds the current destination (or null for a free-wander
      // ground click) the player is walking toward.
      const playerPos = new THREE.Vector3(config.camera.start[0], eyeHeight, config.camera.start[2]);
      const lookDir = new THREE.Vector3(0, 0, -1);
      let entryDone = false;
      let walkOrder = null; // { target: Vector3, destId: string|null }
      let lastArrivedWalkId = null; // guards against re-triggering onArrive every frame after arrival until walkTargetId prop changes again

      const raycaster = new THREE.Raycaster();
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const ndc = new THREE.Vector2();
      const groundHit = new THREE.Vector3();

      function walkToGroundPoint(clientX, clientY) {
        if (!entryDone) return;
        const rect = canvasRef.current.getBoundingClientRect();
        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        if (!raycaster.ray.intersectPlane(groundPlane, groundHit)) return;
        walkOrder = { target: new THREE.Vector3(groundHit.x, eyeHeight, groundHit.z), destId: null };
      }
      canvasClickHandler = (event) => { event.stopPropagation(); walkToGroundPoint(event.clientX, event.clientY); };
      canvasRef.current.addEventListener('click', canvasClickHandler);

      const clock = new THREE.Clock();
      const projected = new THREE.Vector3();
      let lastElapsed = 0;
      const resize = () => { const r = hostRef.current.getBoundingClientRect(); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); renderer.setSize(r.width, r.height, false); };
      resize(); observer = new ResizeObserver(resize); observer.observe(hostRef.current); setReady(true);
      const animate = () => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const delta = Math.min(0.1, elapsed - lastElapsed);
        lastElapsed = elapsed;

        shell.rotation.y = elapsed * config.motion.shellRotation;
        shellWire.rotation.y = shell.rotation.y;
        stars.rotation.y = elapsed * -.004;
        portal.rotation.y = Math.sin(elapsed * .45) * .08;
        scene.traverse((object) => { if (object.userData.routeIndex !== undefined) object.material.opacity = .45 + Math.max(0, Math.sin(elapsed * config.motion.markerFlowSpeed - object.userData.routeIndex * .55)) * .55; });
        entryLight.intensity = config.lighting.entry * .75 + Math.sin(elapsed * 2.4) * config.lighting.pulse;

        if (!entryDone) {
          // Fly-through-the-portal intro. Player-controlled walking takes
          // over the instant it settles, picking up exactly where it left
          // off (no jump cut).
          const enter = Math.min(1, elapsed / config.camera.enterSeconds);
          const eased = 1 - Math.pow(1 - enter, 3);
          camera.position.set(
            config.camera.start[0],
            config.camera.start[1] + (eyeHeight - config.camera.start[1]) * eased,
            config.camera.start[2] + (config.camera.endZ - config.camera.start[2]) * eased
          );
          camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
          if (enter >= 1) {
            entryDone = true;
            playerPos.set(camera.position.x, eyeHeight, camera.position.z);
          }
        } else {
          // A newly requested destination walk (from the caller's
          // walkTargetId prop) always wins over an in-progress ground
          // wander — pick a stop point a fixed distance short of the
          // crystal so the player arrives facing it, not standing inside it.
          const requestedId = walkTargetIdRef.current;
          if (requestedId && requestedId !== walkOrder?.destId && requestedId !== lastArrivedWalkId) {
            const destHolder = destinationMeshes.find((m) => m.userData.destId === requestedId);
            if (destHolder) {
              const destPos = destHolder.position;
              const away = new THREE.Vector3().subVectors(playerPos, destPos).setY(0);
              if (away.lengthSq() < 0.0001) away.set(0, 0, 1);
              away.normalize();
              const stop = destPos.clone().addScaledVector(away, stopDistance);
              stop.y = eyeHeight;
              walkOrder = { target: stop, destId: requestedId };
            }
          } else if (!requestedId) {
            lastArrivedWalkId = null;
          }

          let isMoving = false;
          if (walkOrder) {
            const toTarget = new THREE.Vector3().subVectors(walkOrder.target, playerPos);
            toTarget.y = 0;
            const dist = toTarget.length();
            if (dist > arriveThreshold) {
              toTarget.normalize();
              playerPos.addScaledVector(toTarget, Math.min(dist, walkSpeed * delta));
              lookDir.lerp(toTarget, lookEase);
              if (lookDir.lengthSq() > 0.0001) lookDir.normalize();
              isMoving = true;
            } else {
              const arrivedDestId = walkOrder.destId;
              walkOrder = null;
              if (arrivedDestId) {
                lastArrivedWalkId = arrivedDestId;
                onArrive?.(arrivedDestId);
              }
            }
          }

          const bob = isMoving ? Math.sin(elapsed * bobSpeed) * bobAmplitude : 0;
          camera.position.set(playerPos.x, eyeHeight + bob, playerPos.z);
          camera.lookAt(camera.position.x + lookDir.x, camera.position.y + lookDir.y, camera.position.z + lookDir.z);
        }

        const hoveredNow = hoveredIdRef.current;
        const focusedNow = focusedIdRef.current;
        const walkingNow = walkOrder?.destId;
        const rect = hostRef.current.getBoundingClientRect();
        const rawLayout = [];
        destinationMeshes.forEach((holder) => {
          holder.rotation.y = elapsed * 0.25;
          (holder.userData.spin || []).forEach((mesh, index) => {
            mesh.rotation.x += index % 2 ? -0.01 : 0.008;
            mesh.rotation.y += index % 2 ? -0.006 : 0.012;
          });
          const isHovered = holder.userData.destId === hoveredNow || holder.userData.destId === focusedNow || holder.userData.destId === walkingNow;
          const target = holder.userData.baseScale * (isHovered ? 1.3 : 1);
          holder.scale.x += (target - holder.scale.x) * 0.15;
          holder.scale.y = holder.scale.z = holder.scale.x;

          holder.getWorldPosition(projected);
          const point = projectToScreen(THREE, projected, camera, rect.width, rect.height);
          if (point) rawLayout.push({ id: holder.userData.destId, x: point.x, y: point.y, distSq: camera.position.distanceToSquared(projected) });
        });
        // Nearest-wins occlusion: in a wide establishing shot, distant
        // destinations converge toward the vanishing point and their flat
        // hit-circles can overlap regardless of world-space spacing. Instead
        // of an arbitrary DOM-order tie-break (which could silently steal a
        // click meant for the crystal actually in front), only the
        // destination physically closest to the camera stays clickable
        // wherever circles overlap; the rest re-enable once they separate.
        rawLayout.sort((a, b) => a.distSq - b.distSq);
        const accepted = [];
        const layout = rawLayout.map((entry) => {
          const occluded = accepted.some((other) => Math.hypot(other.x - entry.x, other.y - entry.y) < 46);
          if (!occluded) accepted.push(entry);
          return { ...entry, visible: !occluded };
        });
        onLayout?.(layout);

        renderer.render(scene, camera);
      };
      animate();
    }).catch(() => setReady(false));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (canvasClickHandler) canvasRef.current?.removeEventListener('click', canvasClickHandler);
      observer?.disconnect();
      scene?.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer?.dispose?.();
    };
  }, [active, destinations.length, experience]);

  return (
    <div ref={hostRef} className="sbh-crystal-office-scene" data-ready={ready}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
