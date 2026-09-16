import * as THREE from '../vendor/three.module.js';
import { cv, dataTex, colTex, normalFromHeight, cellField, smoothstep } from '../core/textures.js';
import { hideSet, hideMaterial, hideBall, bulge, TUV,
         hornM, beakM, hoofM, eyeM, irisM } from '../core/hides.js';
import { loft, taper, chain, ball, box, leg } from '../core/loft.js';

/* ============================================================
   TRICERATOPS PRORSUS
   local +Z is forward. Built to the record: 8 m, 2.9 m at the shoulder.
   ============================================================ */
function frillSet(S){
  S = S||512;
  const col = cv(S,S), x = col.getContext('2d');
  const hgt = cv(S,S), h = hgt.getContext('2d');
  h.fillStyle = '#7a7a7a'; h.fillRect(0,0,S,S);

  const gr = x.createLinearGradient(0,S,0,0);
  gr.addColorStop(0.00,'#5d5039');  gr.addColorStop(0.35,'#6d5d41');
  gr.addColorStop(0.72,'#7c6644');  gr.addColorStop(1.00,'#8d7350');
  x.fillStyle = gr; x.fillRect(0,0,S,S);

  // the vascular grooves that channel out across the parietal in life
  for(let i=0;i<190;i++){
    const u0 = 0.5 + (Math.random()-.5)*0.16, ang = (Math.random()-.5)*2.5;
    let px = u0*S, py = S, aa = -Math.PI/2 + ang*0.55;
    const steps = 16 + (Math.random()*14|0);
    x.lineCap = h.lineCap = 'round';
    for(let k=0;k<steps;k++){
      aa += (Math.random()-.5)*0.28 + ang*0.03;
      const l = 9+Math.random()*13;
      const nx2 = px+Math.cos(aa)*l, ny2 = py+Math.sin(aa)*l;
      const w = 3.2*(1-k/steps)+0.7;
      x.strokeStyle = 'rgba(48,39,26,.26)'; x.lineWidth = w;
      x.beginPath(); x.moveTo(px,py); x.lineTo(nx2,ny2); x.stroke();
      h.strokeStyle = 'rgba(0,0,0,.22)'; h.lineWidth = w;
      h.beginPath(); h.moveTo(px,py); h.lineTo(nx2,ny2); h.stroke();
      px = nx2; py = ny2;
      if(py < S*0.06) break;
    }
  }
  // the two parietal fenestrae read as broad soft hollows under the skin
  for(const u of [0.315, 0.685]){
    const g2 = x.createRadialGradient(u*S, S*0.44, 4, u*S, S*0.44, S*0.20);
    g2.addColorStop(0,'rgba(40,32,21,.42)'); g2.addColorStop(1,'rgba(40,32,21,0)');
    x.fillStyle = g2; x.beginPath(); x.ellipse(u*S,S*0.44,S*0.16,S*0.21,0,0,6.3); x.fill();
    const g3 = h.createRadialGradient(u*S, S*0.44, 4, u*S, S*0.44, S*0.20);
    g3.addColorStop(0,'rgba(0,0,0,.35)'); g3.addColorStop(1,'rgba(0,0,0,0)');
    h.fillStyle = g3; h.beginPath(); h.ellipse(u*S,S*0.44,S*0.16,S*0.21,0,0,6.3); h.fill();
  }
  // display flush along the upper shield — restrained, but bulls advertise
  const fl = x.createLinearGradient(0,S*0.45,0,0);
  fl.addColorStop(0,'rgba(126,58,38,0)'); fl.addColorStop(1,'rgba(126,58,38,.30)');
  x.fillStyle = fl; x.fillRect(0,0,S,S*0.45);
  // fused epoccipitals: pale bony bosses riding the margin
  for(let i=0;i<15;i++){
    const u = (i+0.5)/15, px = u*S, py = S*0.055;
    const g4 = x.createRadialGradient(px,py,2,px,py,S*0.052);
    g4.addColorStop(0,'rgba(196,178,142,.55)'); g4.addColorStop(1,'rgba(196,178,142,0)');
    x.fillStyle = g4; x.beginPath(); x.ellipse(px,py,S*0.036,S*0.05,0,0,6.3); x.fill();
    const g5 = h.createRadialGradient(px,py,2,px,py,S*0.052);
    g5.addColorStop(0,'rgba(255,255,255,.85)'); g5.addColorStop(1,'rgba(255,255,255,0)');
    h.fillStyle = g5; h.beginPath(); h.ellipse(px,py,S*0.036,S*0.05,0,0,6.3); h.fill();
  }
  // pebbled skin over the whole plate
  const px2 = x.getImageData(0,0,S,S), hx2 = h.getImageData(0,0,S,S);
  const bed = cellField(S, 46, 0.7);
  for(let p=0;p<S*S;p++){
    const dome = smoothstep(0,0.5,bed.edge[p]), i = p*4;
    const k = 0.80 + dome*0.26 + (Math.random()-.5)*0.05;
    px2.data[i]*=k; px2.data[i+1]*=k; px2.data[i+2]*=k;
    hx2.data[i] = Math.max(0,Math.min(255, hx2.data[i] + (dome-0.5)*46));
    hx2.data[i+1]=hx2.data[i+2]=hx2.data[i];
  }
  x.putImageData(px2,0,0); h.putImageData(hx2,0,0);
  return { map: colTex(col,0,0,true), norm: dataTex(normalFromHeight(hgt, 2.2)) };
}

/* ---- keratin: horn sheath and beak -------------------------------------- */

/* ---- materials ---------------------------------------------------------- */
const HIDE  = hideSet('#7e6f53','#453a29','#9c8865');
const hideM = hideMaterial(HIDE, 1.15);

const FR = frillSet();
const frillM = new THREE.MeshStandardMaterial({
  map:FR.map, normalMap:FR.norm, roughness:.90, metalness:0,
  side:THREE.DoubleSide, vertexColors:true
});
frillM.normalScale.set(1.0, 1.0);

const quillM = new THREE.MeshStandardMaterial({color:0x2e2417, roughness:.86, vertexColors:true});

const SKS  = 1.30;                                  // the skull is built at 1/1.30
const SUV  = TUV*SKS;                               // …so its hide texels still match
const tLoft  = (s,m)=>loft(s, m, 40, TUV);
const tTaper = (len,r0,r1,m,sq,bow,n)=>taper(len,r0,r1,m,sq||1,bow||0,n||8,32,TUV);
const sLoft  = (s,m)=>loft(s, m, 40, SUV);
const sTaper = (len,r0,r1,m,sq,bow,n)=>taper(len,r0,r1,m,sq||1,bow||0,n||8,30,SUV);
const quillG = new THREE.ConeGeometry(.018, 1, 6);
quillG.translate(0, .5, 0);                         // pivot each bristle at the skin
quillG.userData.dressed = true;
{ const n = quillG.attributes.position.count, c = new Float32Array(n*3).fill(1);
  quillG.setAttribute('color', new THREE.Float32BufferAttribute(c,3)); }

// Psittacosaurus-inspired display bristles. Parenting them to individual
// joints keeps the new silhouette locked to the existing tail animation.
function addTrikeTailQuills(tail, links){
  const quills = [];
  const counts = [6,5,4];
  const total = links.reduce((sum,link)=>sum+link.len, 0);
  let before = 0;
  links.forEach((link,segment)=>{
    const count = counts[segment] || 4;
    for(let i=0;i<count;i++){
      const u = (i+.45)/(count+.15);
      const progress = (before+u*link.len)/total;
      const radius = THREE.MathUtils.lerp(link.r0, link.r1, u);
      const length = .17 + Math.sin(progress*Math.PI)*.19;
      const stagger = ((i+segment)%3-1)*.042*(1-progress*.35);
      const q = new THREE.Mesh(quillG, quillM);
      q.position.set(stagger, radius*.92*.98, u*link.len);
      q.rotation.set(.62+progress*.30, -stagger*.8, stagger*.75);
      q.scale.set(1+(i%2)*.12, length, 1+(i%2)*.12);
      q.castShadow = true;
      tail.joints[segment].add(q);
      quills.push(q);
    }
    before += link.len;
  });
  return quills;
}

/* The frill as a real shell rather than an extruded card: a parametric shield
   arched over the neck, thinning to a wavy margin of fused epoccipitals, with
   its own unwrapped UVs so the vascular grooves land where they belong. */
function trikeFrill(){
  const NU = 72, NV = 20, HW = 1.04, HH = 0.92, T = 0.085;
  const pos = [], uv = [], idx = [];
  function P(iu, iv, back){
    const u = iu/NU*2-1, v = iv/NV;
    const a = u*Math.PI*0.5, t = Math.abs(u);
    let R = 1.0 + 0.11*Math.sin(t*Math.PI) - 0.30*Math.pow(t,5);
    R *= 1 + Math.sin(u*Math.PI*5.5)*0.030;         // fused epoccipital wave
    const base = 0.36;
    const w = v*v*(3-2*v);
    const r = base + (R-base)*w;
    const x = Math.sin(a)*r*HW, y = Math.cos(a)*r*HH;
    // arched outward, with the squamosal corners sweeping back
    let z = 0.17*Math.sin(w*Math.PI) - 0.20*t*t*w;
    const th = T*(1-w*0.82)*0.5*(back?-1:1);
    return [x, y, z+th, (u+1)/2, v];
  }
  const grid = [[],[]];
  for(let b=0;b<2;b++) for(let iv=0; iv<=NV; iv++){
    grid[b][iv] = [];
    for(let iu=0; iu<=NU; iu++){
      const q = P(iu,iv,b);
      grid[b][iv][iu] = pos.length/3;
      pos.push(q[0],q[1],q[2]); uv.push(q[3],q[4]);
    }
  }
  for(let iv=0; iv<NV; iv++) for(let iu=0; iu<NU; iu++){
    const a=grid[0][iv][iu], b=grid[0][iv][iu+1], c=grid[0][iv+1][iu], d=grid[0][iv+1][iu+1];
    idx.push(a,b,c, b,d,c);
    const e=grid[1][iv][iu], f=grid[1][iv][iu+1], g=grid[1][iv+1][iu], h=grid[1][iv+1][iu+1];
    idx.push(e,g,f, f,g,h);
  }
  for(let iu=0; iu<NU; iu++){                        // margin rim
    const a=grid[0][NV][iu], b=grid[0][NV][iu+1], c=grid[1][NV][iu], d=grid[1][NV][iu+1];
    idx.push(a,c,b, b,c,d);
  }
  for(let iv=0; iv<NV; iv++){                        // squamosal edges
    let a=grid[0][iv][0], b=grid[0][iv+1][0], c=grid[1][iv][0], d=grid[1][iv+1][0];
    idx.push(a,c,b, b,c,d);
    a=grid[0][iv][NU]; b=grid[0][iv+1][NU]; c=grid[1][iv][NU]; d=grid[1][iv+1][NU];
    idx.push(a,b,c, b,d,c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, frillM); m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* countershading, dust and mud, painted into vertex colours: dark over the
   spine, pale under the belly, silt up the legs. Costs nothing at runtime. */
function dressTrike(root){
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const mm = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  root.traverse(o=>{
    if(!o.isMesh || !o.material.vertexColors) return;
    const g = o.geometry;
    if(g.userData.dressed) return;
    g.userData.dressed = true;
    mm.multiplyMatrices(inv, o.matrixWorld);
    nm.getNormalMatrix(mm);
    const p = g.attributes.position, nrm = g.attributes.normal;
    const col = new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i).applyMatrix4(mm);
      n.set(0,1,0);
      if(nrm){ n.fromBufferAttribute(nrm,i).applyMatrix3(nm).normalize(); }
      // height through the animal: hooves ≈ 0, spine ≈ 3.1
      const hgt = THREE.MathUtils.clamp(v.y/3.1, 0, 1);
      // countershade on the surface normal, not just height, so it wraps
      const up = n.y*0.5+0.5;
      let k = 0.90 + hgt*0.20 - up*0.05;
      k -= (1-hgt)*(1-hgt)*0.14;                     // belly stays in its own shade
      // sun-bleached dorsum
      const bleach = Math.max(0, up-0.72)*0.40*hgt;
      let r = k*(1+bleach*0.16), gg = k*(1+bleach*0.12), b = k*(1-bleach*0.04);
      // dried floodplain silt up the legs and along the underside
      const mud = Math.max(0, 1 - v.y/0.80) * 0.34;
      r += (0.98-r)*mud; gg += (0.88-gg)*mud; b += (0.70-b)*mud;
      col[i*3]=r; col[i*3+1]=gg; col[i*3+2]=b;
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  });
}

function buildTrike(){
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 1.86; root.add(body);

  // ---- barrel: the "big belly" ceratopsian torso, with the scapular mass
  const HIP = bulge(0.040, 1.05, 1.05), SCAP = bulge(0.055, 0.95, 0.95);
  body.add(tLoft([
    {z:-2.20, rx:.46, ry:.52, y: .04}, {z:-1.85, rx:.70, ry:.78, y: .01},
    {z:-1.45, rx:.93, ry:1.01, mod:HIP}, {z:-1.10, rx:1.06, ry:1.12, y:-.02, mod:HIP},
    {z:-0.75, rx:1.14, ry:1.16, y:-.03, mod:HIP},
    {z:-0.35, rx:1.18, ry:1.17, y:-.04},{z: 0.10, rx:1.20, ry:1.19, y:-.04},
    {z: 0.55, rx:1.19, ry:1.22, y:-.01, mod:SCAP},{z: 0.95, rx:1.16, ry:1.26, y: .03, mod:SCAP},
    {z: 1.32, rx:1.08, ry:1.24, y: .06, mod:SCAP},{z: 1.66, rx:.94, ry:1.10, y: .06},
    {z: 1.94, rx:.78, ry:.92, y: .06},  {z: 2.14, rx:.66, ry:.76, y: .08}
  ], hideM));

  // ---- tail: short, held clear of the ground
  const tailLinks = [{len:.72,r0:.50,r1:.38},{len:.62,r0:.38,r1:.26},{len:.52,r0:.26,r1:.10}];
  const tail = chain(tailLinks, hideM, .92, 32, TUV);
  tail.root.rotation.y = Math.PI;                    // run it backwards
  tail.root.position.z = -2.15;
  body.add(tail.root);
  addTrikeTailQuills(tail, tailLinks);

  // ---- neck: short, deep, and buried under the frill
  const neck = new THREE.Group();
  neck.position.set(0, .14, 2.02); body.add(neck);
  neck.add(tLoft([
    {z:-.34, rx:.74, ry:.82, y:.04}, {z:-.06, rx:.72, ry:.78, y:.02},
    {z: .22, rx:.70, ry:.72, y:-.02}, {z: .48, rx:.66, ry:.64, y:-.07},
    {z: .70, rx:.60, ry:.57, y:-.12}
  ], hideM));

  /* ---- skull. Built at true scale: 1.5 m from occiput to the beak tip,
     2.3 m once the frill is counted, on an 8 m animal. Long brow horns
     sweeping forward, short nasal horn, epijugal bosses at the cheeks. */
  const skull = new THREE.Group(); skull.scale.setScalar(SKS);
  skull.position.set(0, -.02, 0.66); neck.add(skull);

  skull.add(sLoft([
    {z:-0.40, rx:.44, ry:.46, y: .12},   // occiput, under the frill base
    {z:-0.16, rx:.47, ry:.47, y: .12},
    {z: 0.08, rx:.48, ry:.45, y: .09},   // braincase and orbits
    {z: 0.32, rx:.50, ry:.41, y: .03},   // jugals — the widest point
    {z: 0.56, rx:.44, ry:.36, y:-.04},
    {z: 0.80, rx:.35, ry:.33, y:-.11},
    {z: 1.02, rx:.27, ry:.31, y:-.19},
    {z: 1.20, rx:.21, ry:.27, y:-.28},   // rostrum narrowing and dropping
    {z: 1.32, rx:.17, ry:.22, y:-.35}
  ], hideM));

  // the frill, laid back over the neck
  const frill = trikeFrill();
  frill.position.set(0, .40, -.22);
  frill.rotation.x = -0.52;
  skull.add(frill);

  // rostral beak: hooked down, and the predentary meeting it from below
  const beak = sTaper(.30, .155, .028, beakM, .92, 0, 5);
  beak.position.set(0, -.36, 1.28); beak.rotation.x = 0.62; skull.add(beak);
  const pred = sTaper(.20, .115, .035, beakM, .78, 0, 4);
  pred.position.set(0, -.50, 1.16); pred.rotation.x = -0.38; skull.add(pred);
  // the mouth line — a real crease rather than a painted one
  for(const s of [-1,1]){
    const lip = sTaper(.62, .045, .022, beakM, .55, 0, 4);
    lip.position.set(s*.24, -.40, .66);
    lip.rotation.set(-.30, -s*.20, 0); skull.add(lip);
  }

  // brow horns — a metre of core bone each, sweeping forward over the beak
  for(const s of [-1,1]){
    const h = sTaper(1.02, .112, .011, hornM, 1, .10, 9);
    h.position.set(s*.34, .30, .30);
    h.rotation.set(-1.24, s*.20, s*.06);
    skull.add(h);
    const boss = hideBall(.13, hideM, 1, .8, 1, SUV);         // the skin swelling at the base
    boss.position.set(s*.34, .28, .30); skull.add(boss);
  }
  // nasal horn: short and blunt on prorsus
  const nose = sTaper(.28, .105, .022, hornM, 1, .02, 5);
  nose.position.set(0, -.02, .96); nose.rotation.x = -1.02; skull.add(nose);
  // epijugals — the cheek horns
  for(const s of [-1,1]){
    const ej = sTaper(.26, .085, .016, hornM, 1, 0, 4);
    ej.position.set(s*.46, -.02, .34);
    ej.rotation.set(.45, s*1.32, 0); skull.add(ej);
  }
  // nostrils
  for(const s of [-1,1]){
    const nb = hideBall(.075, new THREE.MeshStandardMaterial({color:0x1c150d, roughness:.55, vertexColors:true}));
    nb.scale.set(.55,1,1.25);
    nb.position.set(s*.20, -.13, .96); skull.add(nb);
  }
  // eyes: dark globe, ring of iris, and a lid of skin sitting over it
  for(const s of [-1,1]){
    const e = hideBall(.070, eyeM, 1,1,1, SUV); e.position.set(s*.455, .10, .50); skull.add(e);
    const ir = new THREE.Mesh(new THREE.TorusGeometry(.048,.016,8,16), irisM);
    ir.position.set(s*.478, .10, .505); ir.rotation.y = s*Math.PI/2; skull.add(ir);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(.098,.036,8,18), hideM);
    lid.position.set(s*.44, .10, .50); lid.rotation.y = s*Math.PI/2;
    lid.scale.set(1,.85,1); lid.castShadow = true; skull.add(lid);
    const brow = hideBall(.11, hideM, .55, .9, 1.5, SUV);     // bony rim above the orbit
    brow.position.set(s*.44, .25, .48); skull.add(brow);
  }
  // ear opening behind the jaw
  for(const s of [-1,1]){
    const ea = hideBall(.045, new THREE.MeshStandardMaterial({color:0x1a140d, roughness:.7, vertexColors:true}));
    ea.scale.set(.5,1.2,1); ea.position.set(s*.44, -.02, .02); skull.add(ea);
  }

  // ---- limbs. hind columnar, fore semi-erect with the elbow bowed out.
  // Five digits on the forefoot, four on the hind, as the trackways show.
  const HIND = [{len:.80,r0:.52,r1:.40},{len:.66,r0:.43,r1:.32},{len:.32,r0:.34,r1:.29}];
  const FORE = [{len:.70,r0:.48,r1:.37},{len:.62,r0:.40,r1:.30},{len:.30,r0:.32,r1:.27}];
  const legs = [];
  for(const s of [-1,1]){
    const L = leg(hideM, HIND, .46, .52, 4, 28, TUV, hoofM);
    L.hip.position.set(s*.82, .02, -1.18);
    body.add(L.hip); legs.push({L, s, fore:false, base:0});
  }
  for(const s of [-1,1]){
    const L = leg(hideM, FORE, .44, .50, 5, 28, TUV, hoofM);
    L.hip.position.set(s*.80, -.16, 1.24);
    L.hip.rotation.z = s*0.13;                       // elbows bow outward
    body.add(L.hip); legs.push({L, s, fore:true, base:0});
  }

  // ---- hit zones (invisible, raycast targets)
  const zones = [];
  const ZM = new THREE.MeshBasicMaterial({visible:false});
  function zone(name, w,h,d, x,y,z, parent){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), ZM);
    m.position.set(x,y,z); m.userData.zone = name;
    (parent||body).add(m); zones.push(m); return m;
  }
  zone('spine', 1.30,.46,3.20,  0, .82,  .05);
  zone('lung',  2.05,1.05,1.55, 0, .10, 1.00);
  zone('heart', 1.35,.70,.80,   0,-.62,  .95);
  zone('gut',   2.10,1.55,2.20, 0,-.18, -.85);
  zone('neck',  1.05,.95,.90,   0, .16, 2.30);
  zone('brain', .48,.40,.48,    0, .10,  .10, skull);
  const fz = zone('frill', 2.10,1.75,.34, 0, .96, -.52, skull);
  fz.rotation.x = -0.52;
  for(const g of legs){
    zone('leg', .52,1.70,.55, g.L.hip.position.x, g.L.hip.position.y-.85, g.L.hip.position.z);
  }

  root.traverse(o=>{ if(o.isMesh && o.material!==ZM){ o.castShadow = true; o.receiveShadow = true; } });
  dressTrike(root);
  return {root, body, neck, skull, tail, legs, zones};
}

// Keep the historic variable name as an adapter: all shared ballistics and
// tracking code can address either quarry through the same shape contract.

export { buildTrike, hideM as trikeHideM, HIDE as TRIKE_HIDE };
