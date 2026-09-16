import * as THREE from '../vendor/three.module.js';

/* ============================================================
   RENDERER + CAMERA
   Split out from SCENE so the texture layer can read the real
   max anisotropy without importing the whole scene graph —
   textures.js needs the GL context, not the floodplain.
   ============================================================ */
const camera = new THREE.PerspectiveCamera(66, innerWidth/innerHeight, 0.1, 900);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.86;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const MAXANISO = renderer.capabilities.getMaxAnisotropy();

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

export { camera, renderer, MAXANISO };
