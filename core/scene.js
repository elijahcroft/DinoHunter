import * as THREE from '../vendor/three.module.js';
import { renderer } from './renderer.js';
import { groundTex } from './textures.js';

/* ============================================================
   SCENE — the floodplain itself
   The terrain is the same landform in both apps: one meandering
   channel cut through low relief. Only the light differs, so the
   mood is passed in as a LOOK preset rather than forked in code.
   ============================================================ */

/* ---------- terrain: floodplain cut by a meandering channel ---------- */
const RIVER = x => Math.sin(x*0.021)*22 + Math.cos(x*0.047)*7;   // channel centre-line in z
function channel(x,z){
  const d = Math.abs(z - RIVER(x));
  return Math.max(0, 1 - d/15);
}
function ground(x,z){
  const g = Math.sin(x*0.031)*1.5 + Math.cos(z*0.027)*1.25
          + Math.sin((x*0.7+z)*0.013)*2.4 + Math.cos((x-z*0.8)*0.008)*3.1;
  const c = channel(x,z);
  return g*(1-c*0.85) - Math.pow(c,1.5)*4.6;
}
const SIZE = 440, SEG = 190;

/* ---------- light presets ---------- */
const LOOK = {
  // hazy subtropical light: strong low sun + green bounce from the canopy
  hunt: {
    background:0x9aa791, fog:0x93a189, fogDensity:0.0062, exposure:0.86,
    sun:0xffe4b5, sunI:2.5, hemiSky:0x9fb3c4, hemiGround:0x3c4a2a, hemiI:0.85,
    fill:0x8fa9c4, fillI:0.30,
    groundColor:0x9a8a67, groundBump:0,
    water:0x3f4a3c, waterRough:.42, waterMetal:.10, waterOpacity:.90
  },
  // cooler, flatter overcast: reads better for looking at animals up close
  fieldStation: {
    background:0x7f9384, fog:0x82917c, fogDensity:0.0056, exposure:0.76,
    sun:0xffddb0, sunI:1.75, hemiSky:0xa9bdc1, hemiGround:0x27331f, hemiI:0.56,
    fill:0x91a7b5, fillI:0.18,
    groundColor:0xb2ad8a, groundBump:.16,
    water:0x5c6b57, waterRough:.14, waterMetal:.35, waterOpacity:.86
  }
};

function createWorld(look){
  const L = typeof look === 'string' ? LOOK[look] : look;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(L.background);
  scene.fog = new THREE.FogExp2(L.fog, L.fogDensity);
  renderer.toneMappingExposure = L.exposure;

  const sun = new THREE.DirectionalLight(L.sun, L.sunI);
  sun.position.set(-52, 64, 34); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  const sc = sun.shadow.camera;
  sc.left=-46; sc.right=46; sc.top=46; sc.bottom=-46; sc.near=1; sc.far=200;
  sun.shadow.bias = -0.0016;
  scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemiI));
  const fill = new THREE.DirectionalLight(L.fill, L.fillI);
  fill.position.set(40,26,-40); scene.add(fill);

  const tGeo = new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);
  tGeo.rotateX(-Math.PI/2);
  {
    const p = tGeo.attributes.position;
    for(let i=0;i<p.count;i++) p.setY(i, ground(p.getX(i), p.getZ(i)));
    tGeo.computeVertexNormals();
  }
  const groundMap = groundTex();
  const tMat = new THREE.MeshStandardMaterial({
    map:groundMap, color:L.groundColor, roughness:.99, metalness:0
  });
  if(L.groundBump){ tMat.bumpMap = groundMap; tMat.bumpScale = L.groundBump; }
  const terrain = new THREE.Mesh(tGeo, tMat);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // river surface
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE, 1, 1),
    new THREE.MeshStandardMaterial({color:L.water, roughness:L.waterRough,
      metalness:L.waterMetal, transparent:true, opacity:L.waterOpacity})
  );
  water.rotation.x = -Math.PI/2; water.position.y = -1.55;
  scene.add(water);

  return { scene, sun, fill, terrain, water };
}

export { createWorld, LOOK, RIVER, channel, ground, SIZE, SEG };
