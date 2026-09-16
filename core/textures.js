import * as THREE from '../vendor/three.module.js';
import { MAXANISO } from './renderer.js';

/* ============================================================
   PROCEDURAL TEXTURES  (no external assets — CSP-safe)
   ============================================================ */
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c,rx,ry){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  if(rx)t.repeat.set(rx,ry||rx); t.anisotropy=4; t.encoding=THREE.sRGBEncoding; return t;}

function noiseInto(ctx,w,h,a){
  const d=ctx.getImageData(0,0,w,h);
  for(let i=0;i<d.data.length;i+=4){
    const n=(Math.random()-.5)*a;
    d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n;
  }
  ctx.putImageData(d,0,0);
}
// mottled floodplain silt with scattered plant litter
function groundTex(){
  const c=cv(512,512), x=c.getContext('2d');
  x.fillStyle='#6d5a3c'; x.fillRect(0,0,512,512);
  for(let i=0;i<900;i++){
    const r=6+Math.random()*46;
    x.fillStyle=['rgba(92,105,64,.30)','rgba(120,98,60,.35)','rgba(58,66,42,.28)','rgba(146,126,86,.22)'][i%4];
    x.beginPath(); x.ellipse(Math.random()*512,Math.random()*512,r,r*(.4+Math.random()*.8),Math.random()*3,0,6.3); x.fill();
  }
  for(let i=0;i<260;i++){ // leaf litter
    x.strokeStyle='rgba(74,58,34,.5)'; x.lineWidth=1+Math.random()*2;
    const px=Math.random()*512,py=Math.random()*512,a=Math.random()*6.3,l=4+Math.random()*13;
    x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l); x.stroke();
  }
  noiseInto(x,512,512,26);
  return tex(c,46,46);
}
// reptilian pebbled scales
function scaleTex(base,dark){
  const c=cv(256,256), x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,256,256);
  for(let row=0;row<32;row++)for(let col=0;col<32;col++){
    const px=col*8+(row%2?4:0), py=row*8, r=2.4+Math.random()*1.5;
    x.fillStyle=Math.random()<.5?dark:base;
    x.globalAlpha=.35+Math.random()*.4;
    x.beginPath(); x.ellipse(px,py,r,r*.82,0,0,6.3); x.fill();
  }
  x.globalAlpha=1; noiseInto(x,256,256,16);
  return tex(c,7,7);
}
// downy plumage: fine directional barbs
function plumeTex(base,tip){
  const c=cv(256,256), x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){
    const px=Math.random()*256, py=Math.random()*256, l=7+Math.random()*13;
    x.strokeStyle=Math.random()<.45?tip:base;
    x.globalAlpha=.16+Math.random()*.3; x.lineWidth=1+Math.random();
    x.beginPath(); x.moveTo(px,py);
    x.quadraticCurveTo(px+3,py+l*.5,px+1.5,py+l); x.stroke();
  }
  x.globalAlpha=1; noiseInto(x,256,256,12);
  return tex(c,5,5);
}
// a single pennaceous feather on transparent ground (alpha-tested card)
function featherTex(shaft,vane,vane2){
  const c=cv(128,256), x=c.getContext('2d');
  x.clearRect(0,0,128,256);
  for(let s=0;s<2;s++){
    for(let i=0;i<150;i++){
      const t=i/150, y=24+t*220;
      const w=Math.sin(t*Math.PI*.92)*(s?40:30)*(1-t*.28);
      x.strokeStyle=(i%7<3)?vane2:vane; x.lineWidth=2.2; x.globalAlpha=.85;
      x.beginPath(); x.moveTo(64,y);
      x.lineTo(64+(s?w:-w), y+11+w*.12); x.stroke();
    }
  }
  x.globalAlpha=1; x.strokeStyle=shaft; x.lineWidth=3.4;
  x.beginPath(); x.moveTo(64,14); x.lineTo(64,250); x.stroke();
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; t.encoding=THREE.sRGBEncoding; return t;
}
// fern / palm frond card
function frondTex(a,b,pinnate){
  const c=cv(128,256), x=c.getContext('2d');
  x.clearRect(0,0,128,256);
  x.strokeStyle=a; x.lineWidth=4;
  x.beginPath(); x.moveTo(64,256); x.quadraticCurveTo(64,120,64,10); x.stroke();
  const n=pinnate?26:15;
  for(let i=0;i<n;i++){
    const t=i/n, y=250-t*236, w=Math.sin((t+.06)*Math.PI*.95)*58*(pinnate?1:1.1);
    x.strokeStyle=i%3===0?b:a; x.lineWidth=pinnate?4.5:9;
    x.lineCap='round';
    for(const s of [-1,1]){
      x.beginPath(); x.moveTo(64,y);
      x.quadraticCurveTo(64+s*w*.6,y-4,64+s*w,y-16-w*.16); x.stroke();
    }
  }
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; t.encoding=THREE.sRGBEncoding; return t;
}
function barkTex(){
  const c=cv(128,256), x=c.getContext('2d');
  x.fillStyle='#5d4630'; x.fillRect(0,0,128,256);
  for(let i=0;i<170;i++){
    x.strokeStyle=['#4a3624','#6d5439','#3d2d1e'][i%3]; x.lineWidth=1+Math.random()*4;
    const px=Math.random()*128;
    x.beginPath(); x.moveTo(px,0);
    x.bezierCurveTo(px+8,85,px-8,170,px+Math.random()*10-5,256); x.stroke();
  }
  noiseInto(x,128,256,20);
  return tex(c,3,1);
}


/* ---- texture plumbing -------------------------------------------------- */
function dataTex(c, rx, ry){                        // linear-space (normal/rough)
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if(rx) t.repeat.set(rx, ry||rx);
  t.anisotropy = MAXANISO; return t;
}
function colTex(c, rx, ry, clamp){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if(rx) t.repeat.set(rx, ry||rx);
  t.anisotropy = MAXANISO; t.encoding = THREE.sRGBEncoding; return t;
}
// sobel a height canvas into a tangent-space normal map
function normalFromHeight(src, strength){
  const w = src.width, h = src.height;
  const sd = src.getContext('2d').getImageData(0,0,w,h).data;
  const out = cv(w,h), oc = out.getContext('2d'), od = oc.createImageData(w,h);
  const H = (x,y)=>sd[((((y%h)+h)%h)*w + (((x%w)+w)%w))*4]/255;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const dx = (H(x-1,y-1)+2*H(x-1,y)+H(x-1,y+1)) - (H(x+1,y-1)+2*H(x+1,y)+H(x+1,y+1));
    const dy = (H(x-1,y-1)+2*H(x,y-1)+H(x+1,y-1)) - (H(x-1,y+1)+2*H(x,y+1)+H(x+1,y+1));
    let nx = dx*strength, ny = dy*strength, nz = 1;
    const l = Math.hypot(nx,ny,nz); nx/=l; ny/=l; nz/=l;
    const i = (y*w+x)*4;
    od.data[i]   = (nx*.5+.5)*255;
    od.data[i+1] = (ny*.5+.5)*255;
    od.data[i+2] = (nz*.5+.5)*255;
    od.data[i+3] = 255;
  }
  oc.putImageData(od,0,0); return out;
}
/* Worley/cellular field, tiling. f2-f1 gives the crease between cells, which is
   exactly how a bed of polygonal reptile tubercles reads. */
function cellField(S, g, jitter){
  const cw = S/g, sx = new Float32Array(g*g), sy = new Float32Array(g*g), rnd = new Float32Array(g*g);
  for(let j=0;j<g;j++) for(let i=0;i<g;i++){
    const k = j*g+i;
    sx[k] = (i+.5+(Math.random()-.5)*jitter)*cw;
    sy[k] = (j+.5+(Math.random()-.5)*jitter)*cw;
    rnd[k] = Math.random();
  }
  const edge = new Float32Array(S*S), tint = new Float32Array(S*S), core = new Float32Array(S*S);
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    const ci = (x/cw)|0, cj = (y/cw)|0;
    let d1=1e18, d2=1e18, id=0;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
      let ii=ci+di, jj=cj+dj, ox=0, oy=0;
      if(ii<0){ii+=g; ox=-S;} else if(ii>=g){ii-=g; ox=S;}
      if(jj<0){jj+=g; oy=-S;} else if(jj>=g){jj-=g; oy=S;}
      const k = jj*g+ii, ddx = sx[k]+ox-x, ddy = sy[k]+oy-y, d = ddx*ddx+ddy*ddy;
      if(d<d1){ d2=d1; d1=d; id=k; } else if(d<d2) d2=d;
    }
    const p = y*S+x, r1 = Math.sqrt(d1), r2 = Math.sqrt(d2);
    edge[p] = Math.min(1, (r2-r1)/(cw*0.62));      // 0 on a crease, 1 mid-cell
    core[p] = Math.min(1, r1/(cw*0.75));           // 0 at the cell centre
    tint[p] = rnd[id];
  }
  return {edge, core, tint};
}
const smoothstep = (e0,e1,x)=>{ const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0))); return t*t*(3-2*t); };

export { cv, tex, noiseInto, groundTex, scaleTex, plumeTex, featherTex,
         frondTex, barkTex, dataTex, colTex, normalFromHeight, cellField,
         smoothstep };
