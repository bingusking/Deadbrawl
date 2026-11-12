'use strict';
/* =============== 2D SPRITES (from the VISH sprite sheet) =============== */
const SPRK=0.0188, SRC_SCALE=2.5;
const TEX=[{},{}];
function recolorBlue(img){return img;
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,c.width,c.height),p=d.data;
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    if(mx===r&&mx-mn>40&&g<r*0.62&&b<r*0.62){const v=r;p[i]=Math.round(v*0.3+g*0.2);p[i+1]=Math.round(v*0.45+g*0.2);p[i+2]=Math.round(v*0.95);}}
  x.putImageData(d,0,0);return c;
}
for(const anim in SPR){TEX[0][anim]=[];TEX[1][anim]=[];
  SPR[anim].forEach((fr,i)=>{const img=new Image();const t0=new THREE.Texture(),t1=new THREE.Texture();
    for(const t of[t0,t1]){t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;}
    TEX[0][anim][i]=t0;TEX[1][anim][i]=t1;
    img.onload=()=>{t0.image=img;t0.needsUpdate=true;t1.image=anim.startsWith('face')||anim==='title'?img:recolorBlue(img);t1.needsUpdate=true;};
    img.src=fr.src;});}
function makeSpriteMesh(order){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,alphaTest:0.05,depthWrite:false,fog:false}));
  m.renderOrder=order;scene.add(m);return m;
}
function spriteFrame(f){
  const t=G.time,st=f.st||0;
  switch(f.state){
    case 'intro':case 'idle':return ['idle',Math.floor(t/7+f.idx*3)%SPR.idle.length];
    case 'victory':return ['vish_win',Math.min(4,Math.floor(st/12))]; // plays once, holds the last pose
    case 'walkf':return ['run',Math.floor(st/5)%SPR.run.length];
    case 'walkb':return ['runb',Math.floor(st/10)%SPR.runb.length];
    case 'jump':{const J='vish_jump2';
      if(f.flip>0)return [J,3,'flip'];
      if(st<6&&f.vy>0.12)return [J,1];
      return [J,f.vy>0.05?2:f.vy>-0.07?3:4];}
    case 'land':return ['vish_jump2',0];
    case 'wakeup':return st<7?['vish_jump2',0]:['idle',0];
    case 'dodge':return [f.dodgeDir===f.facing?'roll':'dodgeb',1+Math.min(4,Math.floor(f.mt/5))];
    case 'charge':return ['vish_heavy2',0];
    case 'parry':return ['parry',f.mt<3?1:f.mt<5?2:f.mt<7?3:f.mt<=PARRY_WIN?4:5];
    case 'hold':case 'ghold':return ['knife',3];
    case 'guard':case 'block':return ['parry',1];
    case 'hitstun':case 'stun':case 'ultd':return ['hit',0];
    case 'airhit':return ['hit',0,'tumble'];
    case 'kd':case 'ko':return ['hit',0,'down'];
    case 'attack':{const m=f.move,k=f.mt,s=m?m.startup:0,a=m?m.active:0;
      switch(f.mname){
        case 'light':return ['light',k<=2?1:k<=s?2:k<=s+a+5?3:2];
        case 'heavy':return ['vish_heavy2',k<=s?0:k<=s+5?1:k<=s+a+8?2:0]; // wind-up, thrust, follow-through
        case 'air':return k<=s?['vish_jump2',2]:['vish_airup',0];
        case 'rslash':return k<=s?['heavy',3]:['light',3];
        case 'tele':return ['dash',1];
        case 'grab':return ['knife',k<=s?3:4];
        case 'lunge':return ['dash',k<=s?1:3];
        case 'burst':return ['knife',k<3?2:3];
        case 'knife':return ['knife',k<4?1:k<=s?2:k<=s+4?3:k<=s+9?4:5];
        case 'dash':return ['dash',k<=2?0:k<=s?1:k<=s+a?2+Math.min(2,Math.floor((k-s-1)/5)):5];
        case 'shotgun':return ['shotgun',k<4?0:k<s?1:k<=s+a+5?2:3];
        case 'slam':return k<=s?['vish_airup',0]:f.airMove&&k<=s+a?['kick',3]:['vish_jump2',4];
        case 'kick':return ['kick',k<4?1:k<=s?2:k<=s+a?3:4]; // rise, chamber, axe kick, recover
      }}
  }
  return ['idle',0];
}
function drawSprite(f){
  if(f.state!==f._ls){f._ls=f.state;f.st=0;}else f.st=(f.st||0)+1;
  let [anim,idx,mode]=spriteFrame(f);
  const dummy=G.training&&f.idx===1;
  if(dummy){anim='dummy';const hit=['hitstun','stun','airhit','ultd'].includes(f.state);
    idx=hit?(Math.floor(f.st/3)%8):0;mode=['kd','ko'].includes(f.state)?'down':f.state==='airhit'?'tumble':undefined;}
  const rift=f.char==='rift'&&!dummy;let own=false;
  if(rift){[anim,idx,mode]=riftFrame(f);own=true;}
  if(f.char==='jacob'&&!dummy)[anim,idx,mode]=jacobFrame(f);
  const fr=SPR[anim][idx],tex=TEX[dummy||rift?0:f.idx][anim][idx],m=f.spr;
  m.material.color.setHex(rift&&!own?0xc09cff:0xffffff);
  if(!tex.image){m.visible=false;return;}
  m.visible=!(f.invuln>0&&f.state==='wakeup'&&G.time%4<2);
  if(m.material.map!==tex){m.material.map=tex;m.material.needsUpdate=true;}
  const K=fr.k||SPRK,w=fr.w*K,h=fr.h*K,fc=f.facing*(fr.flip?-1:1);
  m.scale.set(w*fc,h,1);
  let rot=0,px=f.x+(fr.w/2-fr.ax)*K*fc,py=f.y+(fr.ay-fr.h/2)*K;
  if(mode==='down'){rot=fc*Math.PI/2*0.96;px=f.x-fc*h*0.15;py=f.y+w*0.5-0.08;}
  else if(mode==='tumble'){rot=fc*clamp(0.5-f.vy*4,-0.2,1.3);py=f.y+h*0.5;}
  else if(mode==='flip'){rot=-fc*Math.PI*2*(1-f.flip/24);py=f.y+h*0.5;px=f.x;}
  else if(f.state==='stun'&&!(G.time-(f.heldT||-9)<=1))rot=Math.sin(G.time*0.15)*0.06;
  m.rotation.z=rot;m.position.set(px,py,0.05+f.idx*0.01);
  if(fr.hx!==undefined){f.neckRx=(fr.hx-fr.ax)*K*(fr.flip?-1:1);f.neckDy=(fr.ay-fr.hy)*K;}
  f.rig.root.visible=false;
}
function spriteURL(anim,i=0){return SPR[anim][i].src;}
