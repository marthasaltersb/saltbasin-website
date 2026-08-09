import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CRYSTAL_VARIANTS, addCrystalLights } from '../lib/crystalGeometry.js';
import { hasWebGL } from './SaltBasinCrystal.jsx';

export default function CrystalWorldCityScene({ world }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasWebGL()) return undefined;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02080d); scene.fog = new THREE.FogExp2(0x06131c, .019);
    const camera = new THREE.PerspectiveCamera(47, 1, .1, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
    renderer.domElement.className = 'mco-world-canvas'; renderer.domElement.style.touchAction = 'none'; host.appendChild(renderer.domElement);
    addCrystalLights(scene, THREE); scene.add(new THREE.AmbientLight(0x324d5e, .65));
    const city = new THREE.Group(); city.rotation.x = -.08; scene.add(city);
    const platforms = []; const positions = [[0,0,0],[-8,1,-5],[8,1,-6],[-10,-1,5],[10,-1,5],[0,-1,9]]; const recipes = ['signature','rings','hourglass','engine','token'];
    positions.forEach((position, index) => {
      const platform = new THREE.Group(); platform.position.set(...position);
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(3.25,2.5,1.2,9),new THREE.MeshStandardMaterial({color:0x102631,roughness:.82,metalness:.12})); rock.position.y=-.75; platform.add(rock);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.75,.07,10,80),new THREE.MeshBasicMaterial({color:index%3===0?0xc4843a:index%3===1?0x4a9cc0:0x9d61bf,transparent:true,opacity:.9})); rim.rotation.x=Math.PI/2; platform.add(rim);
      const crystal = new THREE.Group(); const handles=(CRYSTAL_VARIANTS[recipes[index%recipes.length]]||CRYSTAL_VARIANTS.signature)(crystal,THREE); crystal.scale.setScalar(index===0?1.55:.9+(index%2)*.18); crystal.position.y=.8; platform.add(crystal); city.add(platform);
      platforms.push({platform,crystal,handles,baseY:position[1],speed:.004+index*.0005});
    });
    [[0,1],[0,2],[0,3],[0,4],[0,5],[1,3],[2,4]].forEach(([a,b],index)=>{const start=new THREE.Vector3(...positions[a]),end=new THREE.Vector3(...positions[b]),mid=start.clone().lerp(end,.5);mid.y+=1.2+index%2;const curve=new THREE.CatmullRomCurve3([start,mid,end]);city.add(new THREE.Mesh(new THREE.TubeGeometry(curve,48,.055,7,false),new THREE.MeshBasicMaterial({color:index%2?0x4aa8d0:0xe0a044,transparent:true,opacity:.85})));});
    const water=new THREE.Mesh(new THREE.CircleGeometry(34,72),new THREE.MeshStandardMaterial({color:0x071b27,emissive:0x082b3c,emissiveIntensity:.45,roughness:.3,metalness:.5,transparent:true,opacity:.76}));water.rotation.x=-Math.PI/2;water.position.y=-2;city.add(water);
    const stars=new Float32Array(1200*3);for(let i=0;i<stars.length;i+=3){stars[i]=(Math.random()-.5)*110;stars[i+1]=Math.random()*42-5;stars[i+2]=(Math.random()-.5)*95;}const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xe8dcc4,size:.055,transparent:true,opacity:.65})));
    let azimuth=.12,elevation=.38,distance=31,drag=null,frame,time=0;const target=new THREE.Vector3(0,1,1);
    const resize=()=>{const w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const down=e=>{drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId);};const move=e=>{if(!drag||e.buttons===0)return;azimuth-=(e.clientX-drag.x)*.004;elevation=Math.max(.16,Math.min(.82,elevation+(e.clientY-drag.y)*.003));drag={x:e.clientX,y:e.clientY};};const up=()=>{drag=null;};const wheel=e=>{e.preventDefault();distance=Math.max(20,Math.min(44,distance+e.deltaY*.012));};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('wheel',wheel,{passive:false});
    const animate=()=>{time+=.012;platforms.forEach((item,index)=>{item.crystal.rotation.y+=item.speed;item.platform.position.y=item.baseY+Math.sin(time+index*.8)*.12;item.handles?.spin?.forEach((mesh,j)=>{mesh.rotation.z+=.003+j*.001;});});camera.position.set(Math.sin(azimuth)*distance,Math.sin(elevation)*distance*.68,Math.cos(azimuth)*distance);camera.lookAt(target);renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});renderer.dispose();renderer.domElement.remove();};
  },[world]);
  return <div className="mco-world-3d" ref={hostRef}><div className="mco-world-camera-hint">DRAG TO ORBIT / SCROLL TO TRAVEL</div></div>;
}
