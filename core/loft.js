import * as THREE from '../vendor/three.module.js';

/* ============================================================
   GEOMETRY BUILDERS
   sections run along local +Z; cross-sections are ellipses.
   ============================================================ */
const RAD = 20;
/* Cross-sections are authored roughly every 35 cm of animal. Drawn as given
   that is a piecewise-linear hull, and the flat bands were plainly visible
   along the back and rump at stalking range. LOFT_SUB inserts smooth rings
   between the authored ones, so the silhouette curves instead of stepping.
   Shading was already smooth via computeVertexNormals; this fixes the outline,
   which no amount of shading could hide. */
const LOFT_SUB = 4;
/* Catmull-Rom through the authored radii, with a small overshoot allowance so
   the widest part of a barrel still reads as a curve rather than a flat spot,
   but a pathological spike can never form. */
function refineSections(src){
  if(src.length < 2 || LOFT_SUB <= 1) return src;
  const at = i => src[Math.max(0, Math.min(src.length-1, i))];
  const cr = (p0,p1,p2,p3,t) => {
    const t2=t*t, t3=t2*t;
    return .5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2
                      + (-p0+3*p1-3*p2+p3)*t3);
  };
  const lim = (v,a,b) => {
    const lo=Math.min(a,b), hi=Math.max(a,b), m=(hi-lo)*.25 + Math.abs(hi)*.06;
    return Math.max(lo-m, Math.min(hi+m, v));
  };
  const out=[];
  for(let i=0;i<src.length-1;i++){
    const p0=at(i-1), p1=at(i), p2=at(i+1), p3=at(i+2);
    for(let k=0;k<LOFT_SUB;k++){
      const t=k/LOFT_SUB, u=t*t*(3-2*t);
      const sec={
        z : p1.z + (p2.z-p1.z)*t,
        y : lim(cr(p0.y||0,p1.y||0,p2.y||0,p3.y||0,t), p1.y||0, p2.y||0),
        rx: lim(cr(p0.rx,p1.rx,p2.rx,p3.rx,t), p1.rx, p2.rx),
        ry: lim(cr(p0.ry,p1.ry,p2.ry,p3.ry,t), p1.ry, p2.ry)
      };
      // Blend the shoulder/hip swelling functions across the span too, or the
      // bulges would switch on at a single ring and crease the flank.
      const ma=p1.mod, mb=p2.mod;
      if(ma||mb) sec.mod = a => {
        const va = ma?ma(a):1, vb = mb?mb(a):1;
        return va + (vb-va)*u;
      };
      out.push(sec);
    }
  }
  out.push(src[src.length-1]);
  return out;
}
/* rad  : radial subdivisions (silhouette smoothness)
   uvk  : if set, UVs are measured in world units * uvk instead of 0..1 per
          part, so hide texel density stays constant across a whole animal. */
function loft(sections, mat, rad, uvk){
  const R = rad||RAD;
  sections = refineSections(sections);
  const pos=[], uv=[], idx=[];
  sections.forEach((s,i)=>{
    const circ = Math.PI*(s.rx+s.ry);              // ellipse perimeter, near enough
    for(let j=0;j<=R;j++){
      const a = j/R*Math.PI*2;
      const k = s.mod ? s.mod(a) : 1;               // shoulder / hip swellings
      pos.push(Math.cos(a)*s.rx*k, (s.y||0)+Math.sin(a)*s.ry*k, s.z);
      if(uvk) uv.push(j/R*circ*uvk, s.z*uvk);
      else    uv.push(j/R, i/(sections.length-1));
    }
  });
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<R;j++){
    const a=i*(R+1)+j, b=a+1, c=a+R+1, d=c+1;
    idx.push(a,b,c, b,d,c);   // outward winding: hell-creek had these inside-out
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
}
// smooth taper between two radii over n sub-sections, with an optional arc
function taper(len, r0, r1, mat, squash, bow, n, rad, uvk){
  n = n||5; const s=[];
  for(let i=0;i<=n;i++){
    const t=i/n, r=r0+(r1-r0)*t;
    s.push({z:len*t, y:bow?Math.sin(t*Math.PI)*bow:0, rx:r, ry:r*(squash||1)});
  }
  return loft(s, mat, rad, uvk);
}
// articulated chain: each link is a pivot whose child cone runs +Z
function chain(links, mat, squash, rad, uvk){
  const root=new THREE.Object3D(); const joints=[], meshes=[]; let cur=root;
  links.forEach(l=>{
    const j=new THREE.Object3D(); cur.add(j); joints.push(j);
    // Slight overlap closes the gaps that otherwise appear when a joint bends.
    const mesh=taper(l.len*1.22, l.r0, l.r1, mat, squash||1, 0, 5, rad, uvk);
    j.add(mesh); meshes.push(mesh);
    const nxt=new THREE.Object3D(); nxt.position.z=l.len; j.add(nxt); cur=nxt;
  });
  // `meshes` lets a caller hide the segmented cones and drape one continuous
  // skin envelope over the same articulated pivots.
  return {root, joints, meshes, tip:cur};
}
function ball(r, mat, sx, sy, sz){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,26,18), mat);
  m.scale.set(sx||1, sy||1, sz||1); m.castShadow=true; return m;
}
function box(w,h,d,mat){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.castShadow=true; return m;
}
/* a limb: femur → tibia → metatarsus → foot, hanging downward.
   returns pivots so a walk cycle can drive flexion about X. */
function leg(mat, seg, footL, footW, digits, rad, uvk, hoofMat){
  const hip = new THREE.Object3D();
  hip.rotation.x = Math.PI/2;                      // point the chain down
  const c = chain(seg, mat, 0.86, rad, uvk);
  hip.add(c.root);
  // inside a leg frame, local +Y points forward and local +Z points down
  const foot = new THREE.Object3D(); c.tip.add(foot);
  const f = box(footW, footL*0.85, footL*0.26, mat);
  f.position.set(0, footL*0.38, footL*0.10); foot.add(f);
  if(digits) for(let i=0;i<digits;i++){
    const off = (i-(digits-1)/2);
    const spread = digits>3 ? 0.30 : 0.34;
    const shrink = 1 - Math.abs(off)/digits*0.55;  // outer digits are shorter
    const d = taper(footL*0.55*shrink, footW*0.21*shrink, footW*0.09*shrink,
                    mat, 1, 0, 3, rad, uvk);
    d.rotation.set(-Math.PI/2, off*spread, 0);
    d.position.set(off*footW*0.24, footL*0.52, footL*0.13); foot.add(d);
    if(hoofMat){                                   // blunt keratin ungual
      const u = new THREE.Mesh(new THREE.SphereGeometry(footW*0.16*shrink,12,8), hoofMat);
      u.scale.set(1.1,.55,.8);
      // at the digit tip: the digit runs along local +Y (forward), not +Z (down)
      u.position.set(off*footW*0.24 + Math.sin(off*spread)*footL*0.52*shrink,
                     footL*0.52 + Math.cos(off*spread)*footL*0.52*shrink, footL*0.13);
      u.castShadow = true; foot.add(u);
    }
  }
  return {hip, j:c.joints, foot};
}
/* feather card: alpha-tested plane, doubled */
function feather(len, wid, t){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wid,len),
    new THREE.MeshStandardMaterial({map:t, transparent:true, alphaTest:.42,
      side:THREE.DoubleSide, roughness:.9}));
  m.geometry.translate(0, len/2, 0);
  return m;
}

/* ---- low-poly helpers, for ambient animals seen at distance -------------- */
function sRGB(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }

/* cylinder running +Z from the origin, for necks, bills and tails */
function fsegZ(r0,r1,len,mat){
  const g = new THREE.CylinderGeometry(r0,r1,len,8);
  g.rotateX(Math.PI/2); g.translate(0,0,len/2);
  return new THREE.Mesh(g,mat);
}
/* cylinder hanging -Y from the origin, for limbs */
function fsegY(r0,r1,len,mat){
  const g = new THREE.CylinderGeometry(r0,r1,len,8);
  g.translate(0,-len/2,0);
  return new THREE.Mesh(g,mat);
}

export { RAD, LOFT_SUB, refineSections, loft, taper, chain, ball, box, leg, feather, sRGB, fsegZ, fsegY };
