import * as THREE from '../vendor/three.module.js';
import { cv, dataTex, colTex, normalFromHeight, cellField, smoothstep } from './textures.js';

/* ============================================================
   HIDES & KERATIN — the shared skin layer
   hideSet() and keratinSet() are fully parameterised, so every animal
   carries its own palette off one build. Two animals sharing one skin
   is the quickest way to make a scene look cheap.
   ============================================================ */

/* ---- hide ---------------------------------------------------------------
   Built to the Triceratops skin impressions ("Lane" and the Houston bull):
   a dense bed of small polygonal tubercles, with much larger round feature
   scales scattered through it, each raised into a low nipple at the centre. */
function hideSet(baseHex, darkHex, warmHex, S){
  S = S||512;
  const bed  = cellField(S, 40, 0.72);              // ~1.4 cm tubercles
  const feat = cellField(S, 9,  0.55);              // ~6 cm feature scales
  const col = cv(S,S), cx = col.getContext('2d');
  const hgt = cv(S,S), hx = hgt.getContext('2d');
  const rgh = cv(S,S), rx = rgh.getContext('2d');
  const ci = cx.createImageData(S,S), hi = hx.createImageData(S,S), ri = rx.createImageData(S,S);
  const hex = h=>[parseInt(h.substr(1,2),16), parseInt(h.substr(3,2),16), parseInt(h.substr(5,2),16)];
  const B = hex(baseHex), D = hex(darkHex), W = hex(warmHex);

  // low-frequency mottle so the animal isn't one flat colour
  const mot = cellField(S, 5, 0.9);

  for(let p=0; p<S*S; p++){
    // tubercle bed: domed cells, dark in the creases
    const dome = smoothstep(0.0, 0.55, bed.edge[p]);
    // feature scales sit on maybe a quarter of the large cells
    const isFeat = feat.tint[p] < 0.22 ? 1 : 0;
    const fdome  = isFeat * smoothstep(0.02, 0.70, feat.edge[p]);
    const fcore  = isFeat * (1 - smoothstep(0.0, 0.34, feat.core[p]));   // raised centre

    let h = 0.46 + dome*0.16 + fdome*0.26 + fcore*0.14;
    const grain = (Math.random()-.5)*0.045;
    h += grain;

    // colour: creases dark, scale tops catch the warm tone, feature scales paler
    const mottle = (mot.tint[p]-0.5)*0.16 + (mot.edge[p]-0.5)*0.05;
    let mix = dome*0.72 + fdome*0.13 + mottle;
    mix = Math.max(0, Math.min(1, mix));
    const cellVar = (bed.tint[p]-0.5)*0.13;
    let r = D[0] + (B[0]-D[0])*mix, g = D[1] + (B[1]-D[1])*mix, b = D[2] + (B[2]-D[2])*mix;
    const warm = fcore*0.20 + Math.max(0, dome-0.80)*0.26;
    r += (W[0]-r)*warm; g += (W[1]-g)*warm; b += (W[2]-b)*warm;
    r *= 1+cellVar; g *= 1+cellVar; b *= 1+cellVar;
    const n = (Math.random()-.5)*13; r+=n; g+=n; b+=n;

    const i = p*4;
    ci.data[i]=r; ci.data[i+1]=g; ci.data[i+2]=b; ci.data[i+3]=255;
    const hv = Math.max(0, Math.min(255, h*255));
    hi.data[i]=hi.data[i+1]=hi.data[i+2]=hv; hi.data[i+3]=255;
    // creases hold moisture and read glossier; scale tops are dusty and matte
    const ro = 255*(0.99 - (1-dome)*0.20 - fcore*0.10 + (Math.random()-.5)*0.05);
    ri.data[i]=ri.data[i+1]=ri.data[i+2]=Math.max(0,Math.min(255,ro)); ri.data[i+3]=255;
  }
  cx.putImageData(ci,0,0); hx.putImageData(hi,0,0); rx.putImageData(ri,0,0);

  // wrinkles / skin folds drawn over the top of everything
  for(let i=0;i<26;i++){
    const y0 = Math.random()*S, x0 = Math.random()*S, len = 60+Math.random()*220;
    const a = (Math.random()-.5)*1.2 + (Math.random()<.5?0:Math.PI/2);
    const seg = 14; let px = x0, py = y0, aa = a;
    cx.lineCap = hx.lineCap = 'round';
    for(let k=0;k<seg;k++){
      aa += (Math.random()-.5)*0.35;
      const nx2 = px + Math.cos(aa)*len/seg, ny2 = py + Math.sin(aa)*len/seg;
      cx.strokeStyle = 'rgba(26,21,14,.30)'; cx.lineWidth = 1.4+Math.random()*2.4;
      cx.beginPath(); cx.moveTo(px,py); cx.lineTo(nx2,ny2); cx.stroke();
      hx.strokeStyle = 'rgba(0,0,0,.30)';  hx.lineWidth = 1.6+Math.random()*2.6;
      hx.beginPath(); hx.moveTo(px,py); hx.lineTo(nx2,ny2); hx.stroke();
      px = nx2; py = ny2;
    }
  }
  return {
    map:  colTex(col),
    norm: dataTex(normalFromHeight(hgt, 2.6)),
    rough: dataTex(rgh)
  };
}

/* ---- frill: its own unwrapped map, u across the shield, v base -> margin -- */

function keratinSet(baseHex, tipHex, S){
  S = S||256;
  const col = cv(S,S), x = col.getContext('2d');
  const hgt = cv(S,S), h = hgt.getContext('2d');
  h.fillStyle = '#808080'; h.fillRect(0,0,S,S);
  // v runs base(0) -> tip(1) along the horn
  const g = x.createLinearGradient(0,S,0,0);
  g.addColorStop(0, baseHex); g.addColorStop(0.62,'#6d6250'); g.addColorStop(1, tipHex);
  x.fillStyle = g; x.fillRect(0,0,S,S);
  // longitudinal grain
  for(let i=0;i<300;i++){
    const px = Math.random()*S;
    x.strokeStyle = Math.random()<.5 ? 'rgba(38,32,22,.16)' : 'rgba(216,204,176,.13)';
    x.lineWidth = 0.7+Math.random()*2.2;
    x.beginPath(); x.moveTo(px,0); x.bezierCurveTo(px+5,S*.4,px-5,S*.7,px+(Math.random()-.5)*8,S); x.stroke();
    h.strokeStyle = 'rgba(0,0,0,.10)'; h.lineWidth = x.lineWidth;
    h.beginPath(); h.moveTo(px,0); h.bezierCurveTo(px+5,S*.4,px-5,S*.7,px+(Math.random()-.5)*8,S); h.stroke();
  }
  // annual growth rings, crowded toward the base
  for(let i=0;i<34;i++){
    const t = Math.pow(i/34, 1.5), y = S - t*S;
    x.strokeStyle = 'rgba(44,36,24,.20)'; x.lineWidth = 1+Math.random()*2.4;
    x.beginPath(); x.moveTo(0,y); x.lineTo(S,y); x.stroke();
    h.strokeStyle = 'rgba(0,0,0,.26)'; h.lineWidth = x.lineWidth;
    h.beginPath(); h.moveTo(0,y); h.lineTo(S,y); h.stroke();
  }
  // scars and chips: a mature bull's horns are worn
  for(let i=0;i<16;i++){
    const px = Math.random()*S, py = Math.random()*S*0.8;
    x.strokeStyle = 'rgba(232,222,196,.30)'; x.lineWidth = 0.8+Math.random()*1.6;
    x.beginPath(); x.moveTo(px,py); x.lineTo(px+(Math.random()-.5)*26, py+(Math.random()-.5)*16); x.stroke();
  }
  return { map: colTex(col,1,1), norm: dataTex(normalFromHeight(hgt, 1.5),1,1) };
}

/* ---- shared materials ---------------------------------------------------
   Keratin, hoof and eye are common to every animal on the floodplain; an
   individual species supplies only its own hide palette. */
const TUV  = 1.9;                                   // hide UVs: one tile ≈ 53 cm

const KH = keratinSet('#4e4534','#c9bda0');
const hornM = new THREE.MeshStandardMaterial({
  map:KH.map, normalMap:KH.norm, roughness:.44, metalness:0, vertexColors:true
});
const KB = keratinSet('#3f3a2c','#9d9078');
const beakM = new THREE.MeshStandardMaterial({
  map:KB.map, normalMap:KB.norm, roughness:.36, metalness:0, vertexColors:true
});
const hoofM = new THREE.MeshStandardMaterial({color:0x4a4335, roughness:.88, vertexColors:true});
const eyeM  = new THREE.MeshStandardMaterial({color:0x120c07, roughness:.06, metalness:.15, vertexColors:true});
const irisM = new THREE.MeshStandardMaterial({color:0x8a6a2c, roughness:.10, vertexColors:true});

/* Build a MeshStandardMaterial off a hideSet() result. */
function hideMaterial(set, normalScale){
  const m = new THREE.MeshStandardMaterial({
    map:set.map, normalMap:set.norm, roughnessMap:set.rough,
    roughness:1.0, metalness:0, vertexColors:true
  });
  const n = normalScale || 1.15;
  m.normalScale.set(n, n);
  return m;
}

// a sphere whose UVs are measured in world units, so it can wear the hide
function hideBall(r, mat, sx, sy, sz, uvk){
  const g = new THREE.SphereGeometry(r, 34, 24);
  const uv = g.attributes.uv, k = 2*Math.PI*r*(uvk||TUV);
  for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*k, uv.getY(i)*k*0.5);
  const m = new THREE.Mesh(g, mat);
  m.scale.set(sx||1, sy||1, sz||1); m.castShadow = true; return m;
}

// a gaussian swelling on both flanks at angle `at` around the section
function bulge(amp, at, w){
  const wrap = d => Math.atan2(Math.sin(d), Math.cos(d));
  return a => 1 + amp*(Math.exp(-Math.pow(wrap(a-at)/w,2))
                     + Math.exp(-Math.pow(wrap(a-(Math.PI-at))/w,2)));
}

export { hideSet, keratinSet, hideMaterial, hideBall, bulge, TUV,
         hornM, beakM, hoofM, eyeM, irisM };
