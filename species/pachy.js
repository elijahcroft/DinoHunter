import * as THREE from '../vendor/three.module.js';
import { hideSet, hideMaterial, hideBall, bulge, TUV,
         hornM, beakM, hoofM, eyeM, irisM } from '../core/hides.js';
import { loft, taper, chain, ball, box, leg } from '../core/loft.js';

/* ===== PACHYCEPHALOSAURUS — BEGIN =========================================
   Pachycephalosaurus wyomingensis, adult. Hell Creek, latest Maastrichtian —
   the same formation and the same few thousand years as the Triceratops, so
   he belongs on this floodplain.

   Built to ~4.4 m nose to tail, 1.56 m at the hip, head carried near 1.8 m,
   370-450 kg: the largest known pachycephalosaur, but still a fraction of the
   trike's mass. Bipedal, with a broad pelvis carrying a deep fermentation gut,
   very short arms, long hind limbs and a tail held stiff and horizontal.

   Limb proportions follow the skeleton rather than the eye: the tibia is
   LONGER than the femur, which is the cursorial signature of a small-bodied
   ornithischian and the main thing that keeps him from reading as a scaled
   down theropod.

   Depends only on the shared helper layer: loft / taper / chain / leg / ball /
   hideBall / bulge / hideSet, the hornM / beakM / hoofM / eyeM / irisM
   materials and TUV. Nothing here reaches into the hunt logic — he is ambient
   life on the floodplain, not the contract.

   Growth stages are deliberately left parameterised. "Dracorex hogwartsia" and
   "Stygimoloch spinifer" are now widely read as juveniles of this animal
   (Horner & Goodwin 2009): the dome inflates and the squamosal spikes resorb
   with age. Driving DOME/SPIKE from an age term would give that series
   without restructuring anything here.
   ========================================================================= */

const PACHY = {
  DOME : 1.00,   // 0 = flat "Dracorex" skull roof, 1 = full adult dome
  SPIKE: 0.28,   // 1 = long "Stygimoloch" squamosal horns, adult ≈ 0.3
  HIP  : 1.56,   // height of the body pivot above the ground
  // Standing pose of the hind limb. These three angles are what actually put
  // the foot on the ground: they must agree with HIP and the HIND segment
  // lengths or the animal sinks into the terrain. Solved so the sole lands at
  // y=0 with the femur only ~19 deg off vertical, which is the posture a
  // cursorial ornithischian stands in — not the deep bird-like crouch that
  // falls out of simply shortening the leg.
  FEMUR: -0.33, KNEE: 0.66, ANKLE: -0.34
};

/* His own hide. Two animals sharing one skin is the quickest way to make a
   scene look cheap, and hideSet() is fully parameterised, so a distinct
   palette costs nothing but the texture build: greyer, colder and darker than
   the trike's warm tan, which also helps him disappear into scrub the way a
   smaller prey animal should. */
const PHIDE = hideSet('#847c66','#453f30','#a2977c');
const pHideM = hideMaterial(PHIDE, 1.15);

const pLoft  = (s,m)=>loft(s, m, 40, TUV);
const pTaper = (len,r0,r1,m,sq,bow,n)=>taper(len,r0,r1,m,sq||1,bow||0,n||8,30,TUV);

function buildPachy(){
  const M = pHideM;
  const root = new THREE.Group();
  const body = new THREE.Group(); body.position.y = PACHY.HIP; root.add(body);

  /* ---- torso. The signature ornithischian shape: a deep, barrel-sided gut
     slung between wide hips. Pachycephalosaurs had one of the broadest pelves
     of any dinosaur — a big fermentation chamber for low-grade plant food —
     so the widest point sits well behind the ribcage, not at the shoulder.
     The belly is carried slightly low and the back is nearly level: a gut that
     size does not tuck up the way a predator's does. */
  /* Muscle masses are put in as section MODIFIERS rather than as separate
     ellipsoids stuck on the flank. A ball that protrudes through the hide
     leaves a hard intersection ring and reads as a growth; bulge() deforms
     the torso surface itself, so the swelling is part of the same continuous
     skin and there is no seam to see. */
  const HIPB = bulge(0.090, 0.02, 0.90);            // ilium + thigh mass, lateral
  const CAUD = bulge(0.075, 0.30, 0.85);            // caudofemoralis, at the tail base
  const PECT = bulge(0.070, 0.92, 0.85);            // scapular mass, upper flank
  body.add(pLoft([
    {z:-0.95, rx:.27, ry:.32, y: .05, mod:CAUD},
    {z:-0.72, rx:.38, ry:.45, y: .01, mod:CAUD},
    {z:-0.46, rx:.46, ry:.55, y:-.03, mod:HIPB},
    {z:-0.16, rx:.48, ry:.57, y:-.05, mod:HIPB},    // widest: the gut
    {z: 0.14, rx:.46, ry:.55, y:-.05},
    {z: 0.44, rx:.41, ry:.49, y:-.01, mod:PECT},
    {z: 0.70, rx:.35, ry:.42, y: .03, mod:PECT},
    {z: 0.92, rx:.28, ry:.34, y: .05}
  ], M));

  /* ---- tail. Pachycephalosaur tails carried a basketwork of ossified
     myorhabdoid tendons — a feature otherwise almost unknown in dinosaurs.
     The tail was a rigid counterbalance, not a whip: update() below holds it
     nearly straight and lets it sway only slightly.

     The base is deliberately heavy. The caudofemoralis, the main retractor
     that pulls the femur back on every stride, anchors here, and a tail that
     tapers straight off the hip makes a biped look like it is running on
     nothing. */
  const tailLinks = [{len:.46,r0:.32,r1:.25},{len:.44,r0:.25,r1:.18},
                     {len:.40,r0:.18,r1:.12},{len:.34,r0:.12,r1:.055}];
  const tail = chain(tailLinks, M, .94, 30, TUV);
  tail.root.rotation.y = Math.PI;                    // run it backwards
  tail.root.position.set(0, .06, -0.92);
  body.add(tail.root);
  // A restrained hint of the tendon bundles running back along the tail. These
  // sit along a narrow tail rather than protruding through a fat torso, so a
  // slim ellipsoid reads as a ridge here instead of as a lump.
  for(const s of [-1,1]){
    const t = hideBall(.042, M, .50, .62, 4.6);
    t.position.set(s*.16, .09, -.40); tail.joints[0].add(t);
  }

  /* ---- neck. Genuinely short and thick — barely longer than the skull is
     deep. The dome is heavy and cantilevered forward of the shoulders, so
     whatever it was used for, this neck had to carry it. Keeping it short is
     also what stops the animal reading as a small hadrosaur. */
  const neck = new THREE.Group();
  neck.position.set(0, .05, 0.90); neck.rotation.x = -0.34; body.add(neck);
  // The nuchal musculature that holds that heavy head up is built into the
  // cross-sections — deep at the base, tapering forward — rather than added as
  // a lump on top of a tube.
  neck.add(pLoft([
    {z:-.05, rx:.280, ry:.345, y: .02},
    {z: .10, rx:.266, ry:.312, y: .04},
    {z: .24, rx:.248, ry:.272, y: .05},
    {z: .36, rx:.230, ry:.242, y: .06}
  ], M));

  /* ---- skull. 60 cm occiput to snout tip. The dome is not an ornament sat
     on top of the head — it IS the back half of the skull, up to 25 cm of
     solid bone. So the loft itself carries the domed profile: deep and tall
     over the braincase, falling away sharply to a short, narrow face.
     Rendered in hide rather than keratin: there is no evidence either way for
     a horny cover, and skin over bone is the conservative reading. */
  const D = PACHY.DOME;
  const skull = new THREE.Group();
  skull.position.set(0, .06, .36); skull.rotation.x = 0.22; neck.add(skull);

  skull.add(pLoft([
    {z:-0.15, rx:.150, ry:.135 + .022*D, y: .026 + .014*D},   // occiput
    {z:-0.04, rx:.170, ry:.148 + .030*D, y: .038 + .022*D},   // dome, rear
    {z: 0.08, rx:.172, ry:.148 + .030*D, y: .038 + .022*D},   // dome, crown
    {z: 0.19, rx:.150, ry:.138,          y: .018},            // brow and orbits
    {z: 0.29, rx:.115, ry:.110,          y: .002},            // maxilla
    {z: 0.38, rx:.082, ry:.084,          y:-.015},            // premaxilla
    {z: 0.45, rx:.052, ry:.058,          y:-.025}             // tip
  ], M));

  /* The dome proper. It has to stand visibly PROUD of the skull roof rather
     than blending into a long hump — that abrupt rounded boss behind the eyes
     is the one silhouette that identifies the animal at any distance. The
     loft above is kept deliberately shallow so this cap reads as relief; it
     still overlaps far enough to merge into a single mass. */
  const dome = hideBall(.150*(0.62+0.38*D), M, 1.04, 0.92+0.38*D, 1.18);
  dome.position.set(0, .075 + .045*D, .010); skull.add(dome);

  /* A ring of bony knobs runs round the back and sides of the dome, with a
     second cluster of nasal bosses on the snout. These are modest tubercles
     in an adult, not the horns of a juvenile. */
  for(let i=0;i<13;i++){
    const a = -1.05 + i*(2.10/12);                   // arc across the rear margin
    const r = .174, k = .019 + .008*Math.cos(a);
    const n = ball(k, hornM);
    n.position.set(Math.sin(a)*r*0.98,
                   .045 + .050*D + Math.cos(a)*.052,
                   -.128 - Math.cos(a)*.042);
    skull.add(n);
  }
  for(const s of [-1,1]){
    // Squamosal spikes. Long and sharp in "Stygimoloch"; in a full adult they
    // have largely resorbed into blunt bosses, which is what SPIKE≈0.3 gives.
    for(let i=0;i<2;i++){
      const len = (.052 + i*.020) * (0.45 + 1.55*PACHY.SPIKE);
      const sp = pTaper(len, .028, .015 + .009*(1-PACHY.SPIKE), hornM, 1, 0, 4);
      sp.position.set(s*.140, .030 - i*.042, -.155);
      sp.rotation.set(-0.35 + i*0.22, s*0.50, 0);
      skull.add(sp);
    }
    // Nasal bosses along the top of the snout.
    for(let i=0;i<3;i++){
      const nb = ball(.016 - i*.003, hornM);
      nb.position.set(s*(.042 - i*.009), .088 - i*.014, .258 + i*.058);
      skull.add(nb);
    }
    // A heavy brow over the orbit. This is what makes the eye read as set
    // into a skull rather than stuck onto a surface.
    const brow = hideBall(.058, M, .62, .52, 1.55);
    brow.position.set(s*.120, .080, .190); skull.add(brow);
    // Eyes: small, set forward and high, shaded by the dome's overhang.
    const e = ball(.028, eyeM);
    e.position.set(s*.132, .040, .195); skull.add(e);
    const ir = ball(.015, irisM);
    ir.position.set(s*.146, .042, .206); skull.add(ir);
    // Nostril, set well back from the tip as in the skull.
    const nos = ball(.013, eyeM);
    nos.position.set(s*.050, .016, .372); skull.add(nos);
    // Cheek / jaw muscle mass, and the tooth row it covers.
    const ck = hideBall(.062, M, .58, .82, 1.30);
    ck.position.set(s*.098, -.038, .215); skull.add(ck);
  }

  /* Jaw and beak. Pachycephalosaurs were heterodont — small pointed teeth at
     the front of the premaxilla and leaf-shaped, coarsely serrated cheek
     teeth behind. That combination reads as an omnivore rather than a
     dedicated browser, so the face keeps a narrow nipping tip. */
  const jaw = pLoft([
    {z:-.02, rx:.098, ry:.046},{z: .14, rx:.100, ry:.050},
    {z: .28, rx:.082, ry:.042},{z: .39, rx:.054, ry:.031},
    {z: .45, rx:.033, ry:.021}
  ], M);
  jaw.position.set(0, -.092, .006); skull.add(jaw);
  const beak = pTaper(.062, .036, .010, beakM, .86, 0, 4);
  beak.position.set(0, -.032, .418); beak.rotation.x = 0.32; skull.add(beak);

  /* ---- limbs. Tibia longer than femur: he is built to run, and the whole
     animal balances over the hips. The forelimbs are genuinely tiny — barely
     a third the length of the hind — and are carried folded against the
     chest, taking no part in the gait. */
  const legs = [];
  const HIND = [{len:.58,r0:.27,r1:.185},{len:.62,r0:.185,r1:.125},{len:.32,r0:.125,r1:.095}];
  const FORE = [{len:.21,r0:.062,r1:.048},{len:.19,r0:.048,r1:.037},{len:.09,r0:.039,r1:.031}];
  for(const s of [-1,1]){
    // The thigh mass has to blend into that wide pelvis or the leg reads as a
    // rod stuck on the side of a barrel.
    const th = hideBall(.26, M, .76, 1.02, 1.00);
    th.position.set(s*.33, -.09, -.52); body.add(th);
    // Three weight-bearing toes; the first digit is small and clear of the ground.
    const L = leg(M, HIND, .34, .30, 3, 28, TUV, hoofM);
    L.hip.position.set(s*.28, -.10, -.50);
    // Gastrocnemius and ankle pads, so the shank is a muscled limb rather
    // than two cones meeting at a point.
    const calf = hideBall(.155, M, .88, .82, 1.40);
    calf.position.set(0, 0, .26); L.j[1].add(calf);
    const ank = hideBall(.095, M, .92, .86, 1.15);
    ank.position.set(0, 0, .22); L.j[2].add(ank);
    body.add(L.hip); legs.push({L, s, fore:false, base:0});
  }
  for(const s of [-1,1]){
    const L = leg(M, FORE, .11, .11, 5, 20, TUV, hoofM);
    L.hip.position.set(s*.25, -.04, .58);
    L.hip.rotation.set(1.05, 0, s*0.24);              // held folded against the chest
    body.add(L.hip); legs.push({L, s, fore:true, base:0});
  }

  root.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
  dressAnimal(root, 1.85, 0.55);

  /* ---- animation. sp is 0..1 of a flat-out run. Ambient behaviour only:
     browse, walk, and a bounding flee. stride (0..1, default 1) scales the
     leg swing, so a caller can stand him still: at sp = 0 the full stride is
     still a slow browsing walk. */
  let ph = 0;
  function update(dt, t, sp, stride){
    sp = Math.max(0, Math.min(1, sp||0));
    stride = stride === undefined ? 1 : Math.max(0, Math.min(1, stride));
    ph += dt * (2.4 + sp*5.4);

    legs.forEach(g=>{
      const j = g.L.j, lead = g.s>0 ? 0 : Math.PI;
      const sw = Math.sin(ph + lead), li = Math.cos(ph + lead);
      if(g.fore){
        // The arms barely move: they are too short to contribute to the gait.
        g.L.hip.rotation.x = 1.05 + sw*0.08*sp*stride;
        j[1].rotation.x = -0.85 - li*0.06*sp*stride;
      } else {
        j[0].rotation.x = PACHY.FEMUR + sw*(0.16 + 0.42*sp)*stride;
        j[1].rotation.x = PACHY.KNEE  - li*(0.12 + 0.40*sp)*stride;
        j[2].rotation.x = PACHY.ANKLE + sw*(0.10 + 0.26*sp)*stride;
      }
    });

    // Bipedal bob: the whole body rises and falls twice per stride.
    body.position.y = PACHY.HIP + Math.sin(ph*2)*(0.010 + 0.050*sp)*stride;
    // Pitched forward at speed so the tail counterbalances the head.
    body.rotation.x = 0.06*sp + Math.sin(ph*2)*0.012;

    // The stiffened tail sways as one piece rather than rippling.
    tail.joints.forEach((j,i)=>{
      j.rotation.y = Math.sin(ph*0.5 - i*0.16) * (0.020 + 0.045*sp);
      j.rotation.x = i===0 ? -0.10 - 0.16*sp : -0.012;
    });

    // Browsing when still; head up and level when running.
    const browse = (1-sp) * (0.5 + 0.5*Math.sin(t*0.31));
    neck.rotation.x = -0.34 + browse*0.50 - sp*0.14;
    neck.rotation.y = (1-sp) * Math.sin(t*0.23) * 0.22;
    skull.rotation.x = 0.22 - browse*0.18 + sp*0.10;
  }

  return {root, body, neck, skull, tail, legs, update};
}

/* Countershading, sun-bleach and dried silt, keyed to the animal's own height
   so it works for a 1.9 m biped as well as a 3 m ceratopsian. This is
   dressTrike() with the hard-coded 3.1 and 0.80 lifted out as arguments;
   at integration the two should collapse into this one function. */
function dressAnimal(root, spineH, mudH){
  spineH = spineH || 3.1; mudH = mudH || 0.80;
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
      const hgt = THREE.MathUtils.clamp(v.y/spineH, 0, 1);
      const up = n.y*0.5+0.5;
      let k = 0.90 + hgt*0.20 - up*0.05;
      k -= (1-hgt)*(1-hgt)*0.14;
      const bleach = Math.max(0, up-0.72)*0.40*hgt;
      let r = k*(1+bleach*0.16), gg = k*(1+bleach*0.12), b = k*(1-bleach*0.04);
      const mud = Math.max(0, 1 - v.y/mudH) * 0.34;
      r += (0.98-r)*mud; gg += (0.88-gg)*mud; b += (0.70-b)*mud;
      col[i*3]=r; col[i*3+1]=gg; col[i*3+2]=b;
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  });
}

/* Promote the ambient animal to licensed quarry, the same way
   buildHuntThescelo() does: the shared hunt code drives legs, neck, skull and
   tail through one interface and reads raycast-only boxes for the vitals.

   Two differences from the thescelo wrapper. The hind limb does not stand
   straight, so each leg carries its standing pose in `rest` and the gait is
   laid over that rather than over zero. And the leg boxes ride the femur and
   tibia pivots, so they follow the stride instead of hanging where the leg
   was when the animal was built. The folded forelimbs are left out of the
   gait entirely. */
function buildHuntPachy(){
  const m = buildPachy();
  const zones = [];
  const ZM = new THREE.MeshBasicMaterial({visible:false});
  function zone(name, w,h,d, x,y,z, parent){
    const q = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), ZM);
    q.position.set(x,y,z); q.userData.zone = name;
    parent.add(q); zones.push(q); return q;
  }
  // Body frame: origin at the hip pivot, +Z forward. Boxes overlap on purpose;
  // pickZone() takes the most vital structure the round passed through.
  zone('spine', .30,.18,1.70, 0, .40, -.05, m.body);
  zone('lung',  .80,.62,.62,  0, .04,  .44, m.body);
  zone('heart', .42,.34,.32,  0,-.24,  .54, m.body);
  // the fermentation chamber sits forward of the hip joint, clear of the thigh
  zone('gut',   .92,.90,.92,  0,-.02, -.10, m.body);
  zone('neck',  .46,.50,.32,  0, .04,  .12, m.neck);    // stops short of the skull
  // The brain sits low in the skull, under the dome rather than inside it.
  zone('brain', .18,.14,.20,  0, .02,  .02, m.skull);
  // Up to 25 cm of solid bone. A round that meets it first stops there.
  zone('dome',  .32,.14,.36,  0, .165, .00, m.skull);

  const hind = m.legs.filter(g=>!g.fore);
  for(const g of hind){
    // leg frame: the chain runs along local +Z, down the bone
    zone('leg', .30,.34,.62, 0,0,.30, g.L.j[0]);
    zone('leg', .22,.24,.64, 0,0,.32, g.L.j[1]);
    g.rest = [PACHY.FEMUR, PACHY.KNEE, PACHY.ANKLE];
    g.base = PACHY.FEMUR;
    g.rest.forEach((r,i)=>{ g.L.j[i].rotation.x = r; });   // stand from the first frame
  }
  return {root:m.root, body:m.body, neck:m.neck, skull:m.skull,
          tail:m.tail, legs:hind, zones};
}

export { buildPachy, buildHuntPachy, PACHY };
