import * as THREE from '../vendor/three.module.js';
import { sRGB, fsegZ, fsegY } from '../core/loft.js';

/* ============================================================
   THESCELOSAURUS NEGLECTUS — 3.5 m, 1 m at the hip
   A small, heavy-bodied runner and one of the last non-avian dinosaurs.
   The tail is laced with ossified tendons, so it is carried as a rigid
   balance beam rather than allowed to swing.

   buildThescelo() is the ambient animal. buildHuntThescelo() wraps it in
   the hit-zone contract the ballistics code expects, so the same model
   serves as scenery and as licensed quarry.
   ============================================================ */
/* ---- Thescelosaurus neglectus: 3.5 m, 1 m at the hip -------------------- */
function buildThescelo(){
  const g = new THREE.Group();
  const hide = new THREE.MeshStandardMaterial({color:sRGB(0x7b6d47), roughness:.94});
  const dark = new THREE.MeshStandardMaterial({color:sRGB(0x4c4229), roughness:.95});
  const pale = new THREE.MeshStandardMaterial({color:sRGB(0xa39167), roughness:.92});

  const body = new THREE.Mesh(new THREE.SphereGeometry(.5,14,10), hide);
  body.scale.set(.74,.82,1.50); body.position.set(0,1.12,0); g.add(body);
  const back = new THREE.Mesh(new THREE.SphereGeometry(.5,12,9), dark);
  back.scale.set(.50,.46,1.42); back.position.set(0,1.36,-.05); g.add(back);
  const belly= new THREE.Mesh(new THREE.SphereGeometry(.42,12,9), pale);
  belly.scale.set(.62,.50,1.32); belly.position.set(0,.92,.02); g.add(belly);

  const neck = new THREE.Group(); neck.position.set(0,1.32,.58); g.add(neck);
  neck.add(fsegZ(.15,.11,.60,hide));
  const head = new THREE.Group(); head.position.set(0,.05,.58); neck.add(head);
  const skull= new THREE.Mesh(new THREE.SphereGeometry(.15,10,8), hide);
  skull.scale.set(.88,.95,1.45); head.add(skull);
  const snout= fsegZ(.10,.055,.30,hide); snout.position.set(0,-.03,.13); head.add(snout);
  const beak = fsegZ(.055,.02,.10,pale); beak.position.set(0,-.03,.42); head.add(beak);
  const eyeM = new THREE.MeshStandardMaterial({color:sRGB(0x14100a), roughness:.35});
  for(const sx of [-1,1]){
    const e = new THREE.Mesh(new THREE.SphereGeometry(.028,6,5), eyeM);
    e.position.set(sx*.115,.05,.09); head.add(e);
  }

  // the tail is a rigid balance beam - ossified tendons, so barely any droop
  const tail = new THREE.Group(); tail.position.set(0,1.16,-.70); tail.rotation.y = Math.PI; g.add(tail);
  tail.add(fsegZ(.21,.12,1.05,hide));
  const tail2 = new THREE.Group(); tail2.position.set(0,0,1.05); tail.add(tail2);
  tail2.add(fsegZ(.12,.03,.95,dark));

  const legs = [];
  for(const sx of [-1,1]){
    const hip = new THREE.Group(); hip.position.set(sx*.28,1.06,-.08); g.add(hip);
    hip.add(fsegY(.17,.12,.40,hide));
    const knee = new THREE.Group(); knee.position.y=-.40; hip.add(knee);
    knee.add(fsegY(.10,.065,.38,hide));
    const ankle = new THREE.Group(); ankle.position.y=-.38; knee.add(ankle);
    ankle.add(fsegY(.055,.045,.18,dark));
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.17,.07,.34), dark);
    foot.position.set(0,-.20,.08); ankle.add(foot);
    legs.push({hip,knee,ankle,sx});
  }
  for(const sx of [-1,1]){                      // short forelimbs, palms inward
    const sh = new THREE.Group(); sh.position.set(sx*.26,1.18,.34); g.add(sh);
    sh.rotation.set(.55,0,sx*.22); sh.add(fsegY(.07,.045,.32,hide));
    const el = new THREE.Group(); el.position.y=-.32; sh.add(el);
    el.rotation.x = -1.05; el.add(fsegY(.045,.028,.24,hide));
  }
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  return {root:g, neck, head, tail, tail2, legs};
}

/* raycast-only hit boxes, hung on the model's own parts. Shared by the hunt
   quarry and the ambient band, so both are shot the same way. */
function thesceloZones(m){
  const zones = [];
  const ZM = new THREE.MeshBasicMaterial({visible:false});
  function zone(name,w,h,d,x,y,z,parent){
    const q = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),ZM);
    q.position.set(x,y,z); q.userData.zone=name;
    (parent||m.root).add(q); zones.push(q); return q;
  }
  // Local +Z is forward. Boxes deliberately overlap: pickZone() resolves the
  // most vital structure crossed by the bullet instead of the first box face.
  zone('spine', .56,.18,1.18, 0,1.36,-.02);
  zone('lung',  .58,.48,.62, 0,1.13, .34);
  zone('heart', .42,.32,.32, 0, .91, .42);
  zone('gut',   .66,.54,.78, 0,1.02,-.24);
  zone('neck',  .30,.34,.44, 0,1.37, .76);
  zone('brain', .19,.17,.22, 0, .04, .02,m.head);
  for(const l of m.legs) zone('leg',.24,.76,.28,l.hip.position.x,.59,l.hip.position.z);
  return zones;
}

/* Promote the field-guide/ambient animal to a full hunt quarry. The wrapper
   supplies the same articulated interface as buildTrike(), plus raycast-only
   vital boxes. That lets the shared stalk, ballistics and tracking systems run
   unchanged while the silhouette and anatomy stay Thescelosaurus-sized. */
function buildHuntThescelo(){
  const m = buildThescelo();
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body); body.add(m.root);
  const zones = thesceloZones(m);

  const legs = m.legs.map(l=>({
    L:{hip:l.hip,j:[l.hip,l.knee,l.ankle]}, s:l.sx, fore:false, base:0
  }));
  return {
    root,body,neck:m.neck,skull:m.head,
    tail:{joints:[m.tail,m.tail2]},legs,zones
  };
}

export { buildThescelo, buildHuntThescelo, thesceloZones };
