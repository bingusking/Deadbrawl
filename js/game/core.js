'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v, rnd=Math.random;

/* =============== RENDERER / SCENES =============== */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(36,1,0.1,300);
const vscene=new THREE.Scene();
const vcam=new THREE.PerspectiveCamera(32,1,0.1,200);
function resize(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=vcam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();vcam.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

/* =============== TOON MATERIALS + OUTLINES =============== */
const gmap=(()=>{const d=new Uint8Array([80,80,80,255,165,165,165,255,255,255,255,255]);const t=new THREE.DataTexture(d,3,1,THREE.RGBAFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
const mcache={};
function toon(c,o={}){const k=c+JSON.stringify(o);if(!mcache[k])mcache[k]=new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gmap},o));return mcache[k];}
const outlineMat=new THREE.ShaderMaterial({
  uniforms:{w:{value:0.0024},col:{value:new THREE.Color(0x140a0c)}},
  vertexShader:'attribute vec3 onormal;uniform float w;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*onormal);mv.xyz+=n*w*max(-mv.z,1.5);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 col;void main(){gl_FragColor=vec4(col,1.0);}',
  side:THREE.BackSide});
function prep(g){
  if(g.attributes.onormal)return g;
  const p=g.attributes.position,n=g.attributes.normal,acc=new Map(),keys=[];
  for(let i=0;i<p.count;i++){const k=Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4);keys.push(k);let a=acc.get(k);if(!a){a=new THREE.Vector3();acc.set(k,a);}a.x+=n.getX(i);a.y+=n.getY(i);a.z+=n.getZ(i);}
  const arr=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const a=acc.get(keys[i]).clone().normalize();arr[i*3]=a.x;arr[i*3+1]=a.y;arr[i*3+2]=a.z;}
  g.setAttribute('onormal',new THREE.BufferAttribute(arr,3));return g;
}
const UP=new THREE.Vector3(0,1,0);
function part(parent,g,mat,p=[0,0,0],r=[0,0,0],s=[1,1,1],outline=true){
  const m=new THREE.Mesh(prep(g),mat);m.position.set(p[0],p[1],p[2]);
  if(r.isQuaternion)m.quaternion.copy(r);else m.rotation.set(r[0],r[1],r[2]);
  m.scale.set(s[0],s[1],s[2]);
  if(outline){const o=new THREE.Mesh(g,outlineMat);m.add(o);}
  parent.add(m);return m;
}
function grp(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
const BOX=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const SPH=(r,a=16,b=12)=>new THREE.SphereGeometry(r,a,b);
const CYL=(t,b,h,s=12)=>new THREE.CylinderGeometry(t,b,h,s);
function LIMB(len,rt,rb,s=12){const g=new THREE.CylinderGeometry(rt,rb,len,s);g.translate(0,-len/2,0);return g;}
const dirQ=(x,y,z)=>new THREE.Quaternion().setFromUnitVectors(UP,new THREE.Vector3(x,y,z).normalize());

/* =============== CHARACTER MODEL (from reference image) =============== */
const PAL1={skin:0xb5764c,hair:0x2a1914,shirt:0xebe5da,coat:0xc39462,coatD:0x8f5d37,pants:0xb3282e,collar:0xa21e2c,leather:0x4f3324,metal:0xaab0b8,metalD:0x5d636c,boot:0xe7d1a8,gold:0xcfa452,glove:0x3a2a22,eye:0xffa53a};
const PAL2=Object.assign({},PAL1,{coat:0x77707f,coatD:0x4c4655,pants:0x25356a,collar:0x223468,boot:0xd2cabd,gold:0xb9c3d0,eye:0x7fd0ff,hair:0x1c1418});

function buildRig(P){
  const root=new THREE.Group();
  const body=grp(root);
  const M=k=>toon(P[k]);
  const hips=grp(body,0,1.0,0);
  part(hips,BOX(0.34,0.2,0.22),M('pants'),[0,-0.02,0]);
  part(hips,BOX(0.36,0.07,0.245),M('leather'),[0,0.07,0]);
  part(hips,BOX(0.07,0.06,0.03),M('gold'),[0,0.07,0.125]);
  part(hips,new THREE.TorusGeometry(0.07,0.009,6,16,Math.PI),M('gold'),[0.1,0.02,0.13],[0,0,Math.PI],[1,1,1],false);
  part(hips,new THREE.TorusGeometry(0.05,0.008,6,16,Math.PI),M('gold'),[0.13,0.0,0.12],[0,0.3,Math.PI],[1,1,1],false);
  const spine=grp(hips,0,0.08,0);
  part(spine,LIMB(0.3,0.15,0.16).translate(0,0.3,0),M('shirt'));
  const chest=grp(spine,0,0.3,0);
  part(chest,SPH(0.2),M('shirt'),[0,0.06,0.0],[0,0,0],[1.25,1.0,0.78]);
  // harness straps + fang necklace
  part(chest,BOX(0.05,0.44,0.03),M('leather'),[0.02,0.04,0.15],[0,0,0.62]);
  part(chest,BOX(0.05,0.44,0.03),M('leather'),[-0.02,0.04,0.15],[0,0,-0.62]);
  for(let i=0;i<5;i++){const a=(i-2)*0.32;part(chest,new THREE.ConeGeometry(0.014,0.06,5),M('shirt'),[Math.sin(a)*0.09,0.13-Math.cos(a)*0.03,0.16],[Math.PI,0,0],[1,1,1],false);}
  // draped coat mantle over shoulders
  part(chest,SPH(0.24),M('coat'),[0,0.16,-0.06],[0,0,0],[1.38,0.52,0.9]);
  part(chest,BOX(0.13,0.36,0.08),M('coat'),[0.22,0.05,0.07],[0.1,0,-0.12]);
  part(chest,BOX(0.13,0.36,0.08),M('coat'),[-0.22,0.05,0.07],[0.1,0,0.12]);
  // high red collar (open at front)
  const colG=new THREE.CylinderGeometry(0.175,0.135,0.17,18,1,true,0.95,Math.PI*2-1.9);
  part(chest,colG,toon(P.collar,{side:THREE.DoubleSide}),[0,0.27,-0.035]);
  const colG2=new THREE.CylinderGeometry(0.187,0.18,0.045,18,1,true,0.95,Math.PI*2-1.9);
  part(chest,colG2,toon(0xf2ece2,{side:THREE.DoubleSide}),[0,0.355,-0.035],[0,0,0],[1,1,1],false);
  // cape / coat back
  const cape=grp(chest,0,0.22,-0.19);
  part(cape,BOX(0.62,1.08,0.035).translate(0,-0.54,0),M('coat'));
  part(cape,BOX(0.5,0.95,0.03).translate(0,-0.5,0),M('coatD'),[0,-0.04,-0.02]);
  // neck/head
  const neck=grp(chest,0,0.24,0);
  part(neck,CYL(0.062,0.075,0.14),M('skin'),[0,0.03,0]);
  const head=grp(neck,0,0.1,0.015);head.scale.setScalar(1.13);
  part(head,SPH(0.115),M('skin'),[0,0.1,0],[0,0,0],[0.95,1.12,1.05]);
  part(head,BOX(0.165,0.085,0.15),M('skin'),[0,0.015,0.02]);
  part(head,BOX(0.026,0.05,0.035),M('skin'),[0,0.08,0.125],[-0.2,0,0]);
  const eyeM=new THREE.MeshBasicMaterial({color:P.eye});
  for(const s of [-1,1]){
    part(head,BOX(0.036,0.013,0.012),eyeM,[s*0.043,0.112,0.113],[0,s*0.25,0],[1,1,1],false);
    part(head,BOX(0.056,0.02,0.025),M('hair'),[s*0.045,0.137,0.113],[0,s*0.2,s*0.28]);
    part(head,BOX(0.036,0.17,0.09),M('hair'),[s*0.1,0.04,0.0],[0,0,-s*0.08]);
    part(head,BOX(0.06,0.035,0.06),M('hair'),[s*0.068,-0.02,0.07],[0,s*0.5,s*0.3]);
  }
  part(head,BOX(0.05,0.045,0.035),M('hair'),[0,-0.035,0.1]);
  part(head,BOX(0.05,0.007,0.01),new THREE.MeshBasicMaterial({color:0x3a1a14}),[0,0.034,0.118],[0,0,0],[1,1,1],false);
  // big swept-back hair
  part(head,SPH(0.15),M('hair'),[0,0.18,-0.05],[0,0,0],[1.05,0.82,1.28]);
  part(head,SPH(0.12),M('hair'),[0,0.23,0.035],[-0.35,0,0],[1.12,0.62,1.0]);
  const strands=[[0,0.35,-1,0.11],[0.45,0.15,-1,0.1],[-0.45,0.15,-1,0.1],[0.8,-0.25,-0.8,0.085],[-0.8,-0.25,-0.8,0.085],[0.25,-0.4,-1,0.09],[-0.25,-0.45,-1,0.09],[0.1,0.7,-0.8,0.08],[1,0.2,-0.3,0.07],[-1,0.2,-0.3,0.07]];
  for(const s of strands){const d=new THREE.Vector3(s[0],s[1],s[2]).normalize();part(head,new THREE.ConeGeometry(s[3],0.36,7),M('hair'),[d.x*0.12,0.17+d.y*0.1,-0.08+d.z*0.12],dirQ(s[0],s[1],s[2]));}
  // arms: W = weapon side (-x), F = free side (+x)
  const arm=(sx)=>{
    const sh=grp(chest,sx*0.3,0.12,0);
    part(sh,SPH(0.09),M('coat'),[0,0.01,0]);
    part(sh,LIMB(0.29,0.07,0.06),M('shirt'));
    const el=grp(sh,0,-0.29,0);
    part(el,SPH(0.06),M('shirt'));
    part(el,LIMB(0.26,0.07,0.06),M('metal'));
    part(el,CYL(0.076,0.076,0.05),M('leather'),[0,-0.05,0]);
    part(el,CYL(0.07,0.07,0.04),M('leather'),[0,-0.19,0]);
    part(el,BOX(0.02,0.16,0.08),M('metalD'),[sx*0.06,-0.12,0]);
    const hand=grp(el,0,-0.27,0);
    part(hand,BOX(0.09,0.1,0.095),M('glove'),[0,-0.04,0.005]);
    return {sh,el,hand};
  };
  const W=arm(-1),F=arm(1);
  // gunblade in weapon hand
  const gun=grp(W.hand,0,-0.04,0.02);
  part(gun,BOX(0.045,0.1,0.06),M('leather'),[0,0,-0.01]);
  part(gun,BOX(0.08,0.56,0.13),M('metal'),[0,-0.25,0.07]);
  part(gun,BOX(0.085,0.5,0.035),M('metalD'),[0,-0.25,0.15]);
  part(gun,BOX(0.03,0.3,0.135),toon(P.pants),[0,-0.18,0.07],[0,0,0],[1.02,1,1.02],false);
  part(gun,BOX(0.014,0.62,0.07),toon(0xe9eef5,{emissive:0x334455}),[0,-0.28,-0.03]);
  part(gun,CYL(0.03,0.03,0.04,10),M('metalD'),[0,-0.55,0.09]);
  const muzzle=grp(gun,0,-0.6,0.09);
  // legs
  const leg=(sx)=>{
    const lg=grp(hips,sx*0.105,-0.05,0);
    part(lg,LIMB(0.44,0.095,0.082),M('pants'));
    const kn=grp(lg,0,-0.44,0);
    part(kn,LIMB(0.42,0.08,0.108),M('pants'));
    part(kn,BOX(0.13,0.11,0.26),M('boot'),[0,-0.44,0.045]);
    part(kn,BOX(0.135,0.03,0.27),M('leather'),[0,-0.49,0.045],[0,0,0],[1,1,1],false);
    return {lg,kn};
  };
  const LW=leg(-1),LF=leg(1);
  return {root,body,hips,spine,chest,neck,head,cape,shW:W.sh,elW:W.el,shF:F.sh,elF:F.el,lgW:LW.lg,knW:LW.kn,lgF:LF.lg,knF:LF.kn,muzzle,gun};
}

/* =============== POSES =============== */
const Z={h:0,yaw:0,cape:0.12,hips:[0,0,0],spine:[0,0,0],chest:[0,0,0],neck:[0,0,0],head:[0,0,0],shW:[0,0,0.12],elW:[0,0,0],shF:[0,0,0.12],elF:[0,0,0],lgW:[0,0,0.04],knW:[0,0,0],lgF:[0,0,0.04],knF:[0,0,0]};
function norm(v){return Array.isArray(v)?(v.length===1?[v[0],0,0]:v.slice()):v;}
function ov(base,o){const p={};for(const k in base)p[k]=norm(base[k]);if(o)for(const k in o)p[k]=norm(o[k]);return p;}
const P={};
P.stance=ov(Z,{h:-0.12,hips:[0,0.25,0],spine:[0.12,-0.1,0],chest:[0.05,-0.25,0],head:[-0.05,0.32,0],shW:[-0.35,0,0.22],elW:[-1.0],shF:[-0.7,0.2,0.25],elF:[-1.75],lgW:[-0.55,0,0.12],knW:[0.75],lgF:[0.35,0,0.12],knF:[0.22]});
P.intro=ov(Z,{hips:[0,0.35,0],spine:[-0.05,0,0],chest:[0,-0.1,0],head:[0.05,0.25,0],shW:[0.05,0,0.2],elW:[-0.25],shF:[0.1,0,0.16],elF:[-0.3],lgW:[-0.14,0,0.13],knW:[0.06],lgF:[0.14,0,0.1],knF:[0.08]});
P.crouch=ov(Z,{h:-0.38,hips:[0,0.2,0],spine:[0.35,0,0],chest:[0.1,-0.2,0],head:[-0.35,0.25,0],shW:[-0.3,0,0.25],elW:[-0.9],shF:[-0.55,0,0.35],elF:[-1.2],lgW:[-1.25,0,0.2],knW:[1.35],lgF:[-0.25,0,0.25],knF:[1.75]});
P.jump=ov(Z,{spine:[0.1,0,0],chest:[0,-0.2,0],head:[-0.1,0.3,0],shW:[-0.6,0,0.4],elW:[-1.0],shF:[-0.9,0,0.5],elF:[-1.4],lgW:[-1.1,0,0.15],knW:[1.7],lgF:[-0.4,0,0.15],knF:[1.4],cape:0.6});
P.hurt=ov(Z,{h:-0.1,spine:[-0.35,0,0],chest:[-0.2,0.2,0],head:[-0.4,0,0],shW:[0.3,0,0.5],elW:[-0.6],shF:[0.4,0,0.6],elF:[-0.5],lgW:[-0.3,0,0.12],knW:[0.5],lgF:[0.3,0,0.12],knF:[0.3],cape:0.5});
P.churt=ov(P.crouch,{spine:[-0.05,0,0],head:[-0.4,0,0],shW:[0.3,0,0.5],shF:[0.4,0,0.6]});
const BLOCKARMS={spine:[0.05,0,0],chest:[0,0,0],head:[0.1,0.1,0],shW:[-1.25,0,-0.25],elW:[-1.6],shF:[-1.35,0,-0.15],elF:[-1.95]};
P.block=ov(P.stance,BLOCKARMS);
P.cblock=ov(P.crouch,Object.assign({},BLOCKARMS,{spine:[0.3,0,0]}));
P.airhit=ov(Z,{hips:[-0.6,0,0],spine:[-0.4,0,0],head:[-0.4,0,0],shW:[-2.2,0,0.6],elW:[-0.3],shF:[-2.4,0,0.5],elF:[-0.4],lgW:[-0.6,0,0.2],knW:[0.8],lgF:[-0.2,0,0.2],knF:[0.5],cape:0.9});
P.down=ov(Z,{h:-0.83,hips:[-1.5,0,0],spine:[-0.05,0,0],head:[0.3,0.5,0],shW:[-0.2,0,0.9],elW:[-0.3],shF:[-0.3,0,1.0],elF:[-0.4],lgW:[0.1,0,0.15],knW:[0.02],lgF:[-0.5,0,0.1],knF:[1.0],cape:-1.2});
P.victory=ov(Z,{yaw:0.6,hips:[0,0.5,0],spine:[-0.1,0,0],chest:[-0.05,0.2,0],head:[-0.25,0.4,0],shW:[-2.85,0,0.25],elW:[-0.25],shF:[0.15,0,0.45],elF:[-1.3],lgW:[-0.15,0,0.16],lgF:[0.18,0,0.12],knF:[0.1]});
