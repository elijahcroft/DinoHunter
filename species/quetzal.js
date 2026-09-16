import * as THREE from '../vendor/three.module.js';
import { taper, ball, sRGB } from '../core/loft.js';
import { cv } from '../core/textures.js';

/* ============================================================
   QUETZALCOATLUS NORTHROPI — azhdarchid pterosaur, ~10 m span
   Latest Maastrichtian, Javelina Fm. (Texas). Not a dinosaur, and not a
   Hell Creek animal by name — but azhdarchids of this grade are known
   from Hell Creek, so a giant belongs over this floodplain.

   Built to ~10 m wingspan, ~2.2 m at the shoulder standing, head carried
   near 4.5 m, skull ~2 m. Standing, it is a quadruped: the huge wing
   finger folds up and back along the forearm, and it walks on the hand
   (digits I-III) and a plantigrade foot.

   The rig is point-based rather than Euler chains. Every bone has a
   direction in a ground pose and in a flight pose; `fly` blends between
   them, and lengths are re-imposed down the chain, so one model covers
   standing, walking, launching and soaring. The standing limbs are
   placed with two-bone IK against foot/hand targets, which is what lets
   the walk cycle plant them. The wing membrane is rebuilt every frame
   between the arm and the shank, so it bunches when folded and draws
   tight when spread without any extra authoring.

   Usage:
     const q = buildQuetzal();
     scene.add(q.root);
     q.update(dt, {fly:0..1, speed:m/s, flap:0..1});
   Ground poses put the soles at root y = 0. At fly = 1 the root sits at
   the body's centre, so an ambient flyer can be positioned and banked
   directly, e.g. in place of buildPtero() in hunt.html:
     const p = buildQuetzal(); p.state.fly = 1;
     ... each frame: p.update(dt, {fly:1, flap:p.flap>0 ? 1 : 0});
   ============================================================ */

const Q = {
  BODY_Y : 1.85,                // pivot (mid-torso) above the ground, standing
  HUM:.60, ULNA:.92, MC:1.25,   // forelimb
  PH:[.87,.60,.35,.18],         // wing-finger phalanges 1-4
  FEM:.70, TIB:.95, PES:.30,    // hindlimb; the pes is plantigrade
  NECK:[.52,.52,.50,.48,.44],   // ~2.5 m of neck
  STRIDE:1.05
};

/* ---- materials ------------------------------------------------------- */
function fuzzTex(){                        // pycnofibre fuzz: short streaks
  const c = cv(256,256), x = c.getContext('2d');
  x.fillStyle = '#9a9384'; x.fillRect(0,0,256,256);
  for(let i=0;i<5200;i++){
    const px = Math.random()*256, py = Math.random()*256, l = 2+Math.random()*5;
    x.strokeStyle = Math.random()<.5 ? 'rgba(40,36,30,.30)' : 'rgba(190,180,160,.22)';
    x.beginPath(); x.moveTo(px,py); x.lineTo(px+(Math.random()-.5)*1.5, py+l); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3,3); t.encoding = THREE.sRGBEncoding;
  return t;
}
function membraneTex(){                    // actinofibrils: fine, near-spanwise stiffeners
  const c = cv(512,256), x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#5e4a3a'); g.addColorStop(.7,'#6f5644'); g.addColorStop(1,'#83684f');
  x.fillStyle = g; x.fillRect(0,0,512,256);
  x.lineWidth = 1;
  for(let i=-260;i<520;i+=5){
    x.strokeStyle = 'rgba(30,20,14,'+(.10+Math.random()*.10)+')';
    x.beginPath(); x.moveTo(i,0); x.quadraticCurveTo(i+60,128,i+150,256); x.stroke();
  }
  x.strokeStyle = 'rgba(20,12,8,.35)'; x.lineWidth = 3;   // dark trailing-edge band
  x.beginPath(); x.moveTo(0,252); x.lineTo(512,252); x.stroke();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

/* ---- small vector helpers ------------------------------------------- */
const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const _m = new THREE.Matrix4(), _up = V(0,1,0), _o = V(), _q = new THREE.Quaternion();
const UPZ = V(0,0,1);

// place a +Z-authored mesh at `a`, pointing along unit `d`
function aim(obj, a, d, up){
  obj.position.copy(a);
  const u = up || _up;
  if(Math.abs(d.dot(u)) > .98) _q.setFromUnitVectors(UPZ, d);
  else { _m.lookAt(_o, d, u); _q.setFromRotationMatrix(_m); }
  // Matrix4.lookAt points -Z at the target for cameras; flip for +Z meshes
  obj.quaternion.copy(_q);
  if(Math.abs(d.dot(u)) <= .98) obj.rotateY(Math.PI);
}
// two-bone IK: returns the middle joint, bending toward `pole`
function ik2(a, c, l1, l2, pole){
  const ac = c.clone().sub(a);
  let d = ac.length();
  d = Math.min(Math.max(d, Math.abs(l1-l2)+1e-3), l1+l2-1e-3);
  ac.normalize();
  const x = (l1*l1 - l2*l2 + d*d)/(2*d);
  const h = Math.sqrt(Math.max(0, l1*l1 - x*x));
  const p = pole.clone().sub(a); p.sub(ac.clone().multiplyScalar(p.dot(ac))).normalize();
  return a.clone().add(ac.multiplyScalar(x)).add(p.multiplyScalar(h));
}
// blend two directions and re-normalise
function mixDir(a, b, t){
  const v = a.clone().lerp(b, t);
  if(v.lengthSq() < 1e-6) v.set(0,1,0);
  return v.normalize();
}
const rotZ = (v, ang)=>v.clone().applyAxisAngle(UPZ, ang);

/* ---- the animal ------------------------------------------------------ */
function buildQuetzal(){
  const fur   = new THREE.MeshStandardMaterial({map:fuzzTex(), color:sRGB(0xd8d0c0), roughness:.97});
  const pale  = new THREE.MeshStandardMaterial({map:fur.map, color:sRGB(0xf2ece0), roughness:.97});
  const skin  = new THREE.MeshStandardMaterial({color:sRGB(0x6b5d4c), roughness:.88});
  const beak  = new THREE.MeshStandardMaterial({color:sRGB(0xb9ab8c), roughness:.55});
  const crestM= new THREE.MeshStandardMaterial({color:sRGB(0xa2482a), roughness:.6, side:THREE.DoubleSide});
  const claw  = new THREE.MeshStandardMaterial({color:sRGB(0x2a231c), roughness:.45});
  const memb  = new THREE.MeshStandardMaterial({map:membraneTex(), roughness:.82,
                  side:THREE.DoubleSide});

  const root  = new THREE.Group();
  const pivot = new THREE.Group(); root.add(pivot);

  // torso: a short, deep barrel; oriented hip→shoulder each frame
  const torso = new THREE.Group(); pivot.add(torso);
  const barrel = ball(.5, fur, .48, .52, 1.05); barrel.position.z = .02; torso.add(barrel);
  const chest  = ball(.36, pale, .40, .40, .9); chest.position.set(0,-.07,.12); torso.add(chest);
  const tail   = taper(.18,.05,.01, fur, 1, 0, 3, 8); tail.rotation.y = Math.PI;
  tail.position.z = -.45; torso.add(tail);

  const bone = (len, r0, r1, m)=>{ const g = new THREE.Group();
    const t = taper(len*1.06, r0, r1, m, 1, 0, 4, 10); g.add(t); pivot.add(g); return g; };

  // neck: long, stiff cervicals, thickest at the base
  const neckR = [.13,.105,.09,.08,.075,.07];
  const neck = Q.NECK.map((l,i)=>bone(l, neckR[i], neckR[i+1], fur));

  // skull: a narrow, deep-ish head tapering into a long toothless beak
  const head = new THREE.Group(); pivot.add(head);
  {
    const secs = [[-.18,.07,.09,.02],[0,.10,.15,.03],[.25,.085,.17,.01],[.6,.07,.14,-.01],[1.0,.055,.10,-.02]];
    const bk   = [[.95,.056,.10,-.02],[1.4,.036,.065,-.03],[1.8,.018,.03,-.035],[2.05,.003,.004,-.04]];
    const lo = s => s.map(([z,rx,ry,y])=>({z, rx, ry, y}));
    head.add(loftMesh(lo(secs), skin));
    head.add(loftMesh(lo(bk), beak));
    // low premaxillary crest, as in Q. lawsoni
    const cs = new THREE.Shape();
    cs.moveTo(0,0); cs.quadraticCurveTo(.25,.30,.75,.10); cs.lineTo(.95,0); cs.closePath();
    const cg = new THREE.ExtrudeGeometry(cs, {depth:.02, bevelEnabled:false});
    cg.translate(0,0,-.01); cg.rotateY(-Math.PI/2);
    const crest = new THREE.Mesh(cg, crestM); crest.position.set(0,.14,.05); head.add(crest);
    const eyeM = new THREE.MeshStandardMaterial({color:0x100b07, roughness:.1});
    for(const sx of [-1,1]){
      const e = ball(.028, eyeM); e.position.set(sx*.085,.05,.02); head.add(e);
    }
  }

  // limbs
  const side = sx => {
    const w = {sx,
      hum: bone(Q.HUM,.075,.06,fur), uln: bone(Q.ULNA,.055,.045,skin),
      mc:  bone(Q.MC,.045,.035,skin), ph: Q.PH.map((l,i)=>bone(l,.03-i*.006,.02-i*.004,skin)),
      fem: bone(Q.FEM,.09,.06,fur), tib: bone(Q.TIB,.055,.035,skin),
      pes: bone(Q.PES,.04,.03,skin), hand: new THREE.Group()};
    pivot.add(w.hand);
    for(let i=0;i<3;i++){                        // digits I-III, clawed
      const d = taper(.14,.018,.006,claw,1,0,2,6);
      d.rotation.y = sx*(1.1 + i*.35); w.hand.add(d);
    }
    for(let i=0;i<4;i++){                        // pes digits
      const d = taper(.13,.02,.006,claw,1,0,2,6);
      d.position.set((i-1.5)*.03,0,Q.PES); d.rotation.y = (i-1.5)*.18;
      w.pes.add(d);
    }
    // brachiopatagium (arm→shank) and propatagium (shoulder→wrist)
    w.mem  = strip(12, 6, memb); pivot.add(w.mem);
    w.pro  = strip(4, 2, memb);  pivot.add(w.pro);
    w.phase = sx<0 ? 0 : .5;                      // lateral-sequence walk
    return w;
  };
  const L = [side(-1), side(1)];

  root.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });

  const state = {fly:0, speed:0, flap:0, t:0, cyc:0, flapAmp:0};

  /* --- pose ----------------------------------------------------------- */
  const G = { // standing, mid-torso origin, +Z forward
    sh:V(0,.35,.35), hip:V(0,-.35,-.35), ground:-Q.BODY_Y
  };
  const F = { // flight: body level
    sh:V(0,.04,.35), hip:V(0,-.02,-.42)
  };
  const neckG = [V(0,.75,.66),V(0,.9,.43),V(0,.93,.36),V(0,.9,.43),V(0,.8,.6)];
  const neckF = [V(0,.30,.95),V(0,.12,.99),V(0,.02,1),V(0,-.04,1),V(0,-.08,1)];

  function update(dt, o){
    o = o || {};
    const S = state;
    S.t += dt;
    if(o.fly   !== undefined) S.fly   += (o.fly   - S.fly)  * Math.min(1, dt*2.2);
    if(o.speed !== undefined) S.speed  = o.speed;
    if(o.flap  !== undefined) S.flapAmp += (o.flap - S.flapAmp) * Math.min(1, dt*3);
    const f = S.fly, g = 1-f;
    const ease = f*f*(3-2*f);
    S.cyc += dt * S.speed / Q.STRIDE * g;
    S.flap += dt * (1.6 + S.flapAmp*1.4);
    const walk = Math.min(1, S.speed/1.5) * g;

    pivot.position.y = Q.BODY_Y * g + Math.sin(S.cyc*Math.PI*4)*.03*walk;

    // torso
    const sh = G.sh.clone().lerp(F.sh, ease), hp = G.hip.clone().lerp(F.hip, ease);
    const td = sh.clone().sub(hp).normalize();
    aim(torso, sh.clone().add(hp).multiplyScalar(.5), td);

    // neck and head
    let p = sh.clone().add(td.clone().multiplyScalar(.1)).add(V(0,.08,0));
    const bob = Math.sin(S.cyc*Math.PI*2)*.05*walk + Math.sin(S.t*.7)*.02;
    neck.forEach((n,i)=>{
      const d = mixDir(neckG[i], neckF[i], ease);
      d.y += bob*(i/4);  d.normalize();
      aim(n, p, d); p = p.clone().add(d.multiplyScalar(Q.NECK[i]));
    });
    const hd = mixDir(V(0,-.35,1), V(0,-.12,1), ease);
    hd.y += Math.sin(S.t*.9)*.04*g; hd.normalize();
    aim(head, p, hd);

    // flap angle: positive raises the wing
    const fa = Math.sin(S.flap*Math.PI) * (.12 + .55*S.flapAmp) * ease;
    const groundY = G.ground + (pivot.position.y - Q.BODY_Y);   // ground in pivot space

    for(const w of L){
      const sx = w.sx, ph = (S.cyc + w.phase) % 1;
      const shJ = sh.clone().add(V(sx*.17,0,0));
      const hpJ = hp.clone().add(V(sx*.13,0,0));

      /* ---- forelimb */
      // standing targets: hand planted lateral and forward of the shoulder
      const fph = (ph + .25) % 1;
      const hand = gait(V(sx*.62, groundY+.04, .80), fph, walk);
      const wristG = hand.clone().add(V(sx*.10, Q.MC*.97, -Q.MC*.22));
      const elbG = ik2(shJ, wristG, Q.HUM, Q.ULNA, shJ.clone().add(V(sx*.6,.2,-1)));
      const dHG = elbG.clone().sub(shJ).normalize();
      const dUG = wristG.clone().sub(elbG).normalize();
      const dMG = hand.clone().sub(wristG).normalize();
      // folded wing finger: up and back along the forearm
      const dPG = [dUG.clone().negate().add(V(sx*.12,0,-.1)), V(sx*.06,-.30,-1), V(sx*.03,-.75,-1), V(0,-1,-.3)]
                    .map(v=>v.normalize());

      const flapD = (v, k, lag)=>rotZ(v, sx * (fa*k + Math.sin((S.flap-lag)*Math.PI)*.08*ease*S.flapAmp));
      const dHF = flapD(V(sx,.10,-.10).normalize(), 1, 0);
      const dUF = flapD(V(sx,.02,.20).normalize(), 1.05, .1);
      const dMF = flapD(V(sx,0,-.05).normalize(), 1.1, .2);
      const dPF = [V(sx,0,-.12),V(sx,0,-.22),V(sx,0,-.38),V(sx,0,-.55)]
                    .map((v,i)=>flapD(v.normalize(), 1.15+i*.05, .3+i*.1));

      let a = shJ;
      const lead = [a.clone()];
      const put = (b, d, len)=>{ aim(b, a, d); a = a.clone().add(d.clone().multiplyScalar(len)); lead.push(a.clone()); };
      put(w.hum, mixDir(dHG, dHF, ease), Q.HUM);
      put(w.uln, mixDir(dUG, dUF, ease), Q.ULNA);
      const wrist = a.clone();
      put(w.mc,  mixDir(dMG, dMF, ease), Q.MC);
      w.hand.position.copy(a); w.hand.visible = true;
      w.ph.forEach((b,i)=>put(b, mixDir(dPG[i], dPF[i], ease), Q.PH[i]));

      /* ---- hindlimb */
      const foot = gait(V(sx*.30, groundY+.05, -.30), ph, walk);
      const kneeG = ik2(hpJ, foot, Q.FEM, Q.TIB, hpJ.clone().add(V(sx*.5,0,1)));
      const dFF = V(sx*.15,-.25,-1).normalize(), dTF = V(sx*.10,-.12,-1).normalize();
      const dF = mixDir(kneeG.clone().sub(hpJ).normalize(), dFF, ease);
      aim(w.fem, hpJ, dF);
      const knee = hpJ.clone().add(dF.multiplyScalar(Q.FEM));
      const dT = mixDir(foot.clone().sub(kneeG).normalize(), dTF, ease);
      aim(w.tib, knee, dT);
      const ankle = knee.clone().add(dT.clone().multiplyScalar(Q.TIB));
      aim(w.pes, ankle, mixDir(V(sx*.1,0,1).normalize(), V(sx*.05,-.4,-1).normalize(), ease));

      /* ---- membranes */
      const legA = knee.clone().lerp(ankle, .6);
      const tip = lead[lead.length-1];
      // trailing edge: from the shank out to the wingtip, cut in toward the arm
      fillStrip(w.mem, t => leadAt(lead, t), (t, l) => {
        const tr = legA.clone().lerp(tip, Math.pow(t, .85));
        tr.lerp(l, .25*Math.sin(t*Math.PI)*ease + .8*g*(1-t*.3));   // loose when folded
        return tr;
      }, (t, s) => -Math.sin(s*Math.PI)*Math.sin(t*Math.PI)*.10*ease);  // camber
      const fwd = td.clone().multiplyScalar(.26);
      fillStrip(w.pro, t => shJ.clone().lerp(wrist, t),
                (t, l) => l.clone().add(fwd.clone().multiplyScalar(Math.sin(t*Math.PI))), ()=>0);
    }
  }

  // plant, lift and swing a foot target through one stride
  function gait(base, ph, k){
    if(k <= 0) return base;
    const st = .7;                      // stance fraction
    let dz, up = 0;
    if(ph < st){ dz = .5 - ph/st; }
    else { const s = (ph-st)/(1-st); dz = -.5 + s; up = Math.sin(s*Math.PI)*.16; }
    return base.clone().add(V(0, up*k, dz*Q.STRIDE*.6*k));
  }

  update(0, {});
  return {root, pivot, torso, head, neck, state, update, legs:L};
}

/* ---- dynamic membrane strips ---------------------------------------- */
function strip(nu, nv, mat){
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((nu+1)*(nv+1)*3), uv = [], idx = [];
  for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++) uv.push(i/nu, 1-j/nv);
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){
    const a=j*(nu+1)+i, b=a+1, c=a+nu+1, d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false; m.userData.nu = nu; m.userData.nv = nv;
  return m;
}
function fillStrip(m, leadFn, trailFn, bellyFn){
  const {nu, nv} = m.userData, p = m.geometry.attributes.position;
  let k = 0;
  for(let j=0;j<=nv;j++){
    const s = j/nv;
    for(let i=0;i<=nu;i++){
      const t = i/nu, l = leadFn(t), tr = trailFn(t, l);
      const v = l.lerp(tr, s); v.y += bellyFn(t, s);
      p.array[k++] = v.x; p.array[k++] = v.y; p.array[k++] = v.z;
    }
  }
  p.needsUpdate = true;
  m.geometry.computeVertexNormals();
  m.geometry.computeBoundingSphere();
}
// point at arc-length fraction t along a polyline
function leadAt(pts, t){
  let total = 0; const seg = [];
  for(let i=1;i<pts.length;i++){ const d = pts[i].distanceTo(pts[i-1]); seg.push(d); total += d; }
  let r = t*total;
  for(let i=0;i<seg.length;i++){
    if(r <= seg[i] || i === seg.length-1) return pts[i].clone().lerp(pts[i+1], Math.min(1, r/seg[i]));
    r -= seg[i];
  }
  return pts[pts.length-1].clone();
}
// elliptical loft with a vertical offset, for the skull and beak
function loftMesh(secs, mat){
  const R = 16, pos = [], idx = [];
  secs.forEach(s=>{
    for(let j=0;j<=R;j++){
      const a = j/R*Math.PI*2;
      pos.push(Math.cos(a)*s.rx, s.y + Math.sin(a)*s.ry, s.z);
    }
  });
  for(let i=0;i<secs.length-1;i++) for(let j=0;j<R;j++){
    const a=i*(R+1)+j, b=a+1, c=a+R+1, d=c+1;
    idx.push(a,b,c, b,d,c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

export { buildQuetzal, Q as QUETZAL };
