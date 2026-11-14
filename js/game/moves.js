'use strict';
/* =============== MOVES =============== */
// Universal kit: Q tap = quick melee, Q hold = charged heavy, Q in the air = launcher, F = parry, Shift = dodge roll.
// Vargas: 1 knife throw (3 charges), 2 dash-through, 3 shotgun blast, 4 spike kick.
const MOVES={
  light:{base:'stance',startup:5,active:3,recovery:10,dmg:45,reach:[0.15,1.1],y:[0.8,1.7],hitstun:17,push:0.07,melee:1,
    wind:{chest:[0.05,-0.55,0],shF:[-0.9,0.2,0.3],elF:[-2.0]},hit:{spine:[0.2,0,0],chest:[0.05,0.45,0],shF:[-1.55,0,0.05],elF:[-0.05],head:[-0.05,0,0]}},
  heavy:{base:'stance',impact:1,startup:2,active:10,recovery:18,dmg:60,reach:[0,1.55],y:[0.4,1.95],hitstun:13,push:0.3,vx:0.27,trail:1,stop:10,shake:0.12,melee:1,heavy:1,
    wind:{chest:[-0.1,-0.75,0],spine:[-0.05,0,0],shW:[-2.75,0,0.5],elW:[-0.6]},hit:{h:-0.2,spine:[0.35,0,0],chest:[0.25,0.55,0],shW:[-0.75,0,-0.2],elW:[-0.05],lgW:[-0.8,0,0.12],knW:[0.9]}},
  air:{base:'jump',startup:6,active:8,recovery:8,dmg:55,reach:[-0.2,1.35],y:[-0.5,1.7],launch:0.2,kb:0.025,juggle:1,trail:1,stop:8,shake:0.08,melee:1,
    wind:{shW:[0.6,0,0.3],elW:[-0.3],chest:[0.2,-0.4,0],spine:[0.3,0,0]},hit:{shW:[-2.7,0,0.25],elW:[-0.1],spine:[-0.25,0,0],chest:[-0.1,0.4,0]}},
  burst:{base:'stance',startup:6,active:1,recovery:4,burst:1,
    wind:{chest:[0,-0.6,0],shF:[-2.7,0,0.5],elF:[-1.4]},hit:{chest:[0.1,0.5,0],spine:[0.15,0,0],shF:[-1.35,0,0],elF:[-0.1]}},
  knife:{base:'stance',startup:7,active:1,recovery:13,proj:1,
    wind:{chest:[0,-0.6,0],shF:[-2.7,0,0.5],elF:[-1.4]},hit:{chest:[0.1,0.5,0],spine:[0.15,0,0],shF:[-1.35,0,0],elF:[-0.1]}},
  dash:{base:'stance',impact:1,startup:5,active:13,recovery:14,dmg:80,reach:[-0.4,0.9],y:[0.1,1.9],hitstun:26,push:0.03,vx:0.3,trail:1,stop:8,shake:0.14,
    wind:{h:-0.25,spine:[0.5,0,0],shW:[0.7,0,0.4],elW:[-0.2],lgW:[-1.0,0,0.1],knW:[1.1],lgF:[0.6,0,0.1],knF:[0.4],cape:0.9},hit:{h:-0.28,spine:[0.45,0,0],chest:[0.2,0.6,0],shW:[-1.6,0,-0.1],elW:[0],lgW:[-1.1,0,0.1],knW:[1.0],lgF:[0.7,0,0.1],knF:[0.2],cape:1.3}},
  shotgun:{base:'stance',impact:1,startup:10,active:2,recovery:20,dmg:95,reach:[0.2,2.4],y:[0.1,2.2],kd:1,launch:0.1,kb:0.21,stop:11,shake:0.22,
    wind:{chest:[0,0.75,0],head:[0,-0.4,0],shW:[-1.52,0,0.05],elW:[-0.1],shF:[-1.2,0,-0.3],elF:[-1.4]},hit:{chest:[0,0.75,0],head:[0,-0.4,0],spine:[-0.15,0,0],shW:[-2.0,0,0.05],elW:[-0.7],shF:[-1.2,0,-0.3],elF:[-1.4]}},
  slam:{base:'stance',impact:1,startup:7,active:10,recovery:16,dmg:65,reach:[-0.1,1.35],y:[-0.7,2.0],slam:1,melee:1,hitstun:18,push:0.05,trail:1,stop:11,shake:0.2,
    wind:{shW:[-2.8,0,0.3],elW:[-0.4],shF:[-2.6,0,-0.2],elF:[-0.6],spine:[-0.2,0,0]},hit:{shW:[-0.6,0,0.2],elW:[0],shF:[-0.7,0,0],elF:[0],spine:[0.6,0,0],h:-0.2}},
  kick:{base:'stance',impact:1,startup:8,active:6,recovery:16,dmg:55,reach:[0,1.45],y:[-0.4,2.7],spike:1,hitstun:18,push:0.08,stop:10,shake:0.12,
    wind:{lgF:[-1.3,0,0.1],knF:[1.9],spine:[-0.15,0,0],shF:[-0.6,0,0.6],shW:[-0.4,0,0.6]},hit:{lgF:[-2.1,0,0.1],knF:[0.1],spine:[-0.35,0,0],hips:[0.2,0.3,0],shF:[-0.4,0,0.9],shW:[-0.2,0,0.8]}}
};
Object.assign(MOVES,{
  rslash:{base:'stance',impact:1,startup:12,active:5,recovery:20,dmg:85,reach:[-0.2,2.1],y:[-0.2,2.8],hitstun:22,push:0.4,shake:0.18},
  tele:{base:'stance',startup:7,active:1,recovery:8}, // startup long enough to show the smoke dissolve
  grab:{grab:1,base:'stance',impact:1,startup:7,active:4,recovery:18,dmg:60,reach:[0,1.3],y:[-0.3,2.0],shake:0.15,react:grabReact},
  lunge:{grab:1,base:'stance',impact:1,startup:6,active:18,recovery:16,dmg:40,vx:0.3,reach:[0,0.4],y:[0.1,1.9],shake:0.1,react:lungeReact}
});
function grabReact(a,d){d.state='stun';d.stun=80;d.vx=0;d.vy=0;a.state='ghold';a.mt=0;a.move=null;a.vx=0;callout(a,'GRAB!','#c9a0ff');}
function holdThroat(f,o,stay){ // held up by the throat: enemy's neck sits at Rift's raised fist
  o.facing=-f.facing;o.heldT=G.time;
  const ndx=(o.neckRx||0)*o.facing,ndy=o.neckDy!==undefined?o.neckDy:1.55;
  f.pass=o.pass=true;if(stay)f.x=clamp(o.x-f.facing*0.2+ndx,BL,BR);else o.x=clamp(f.x+f.facing*0.2-ndx,BL,BR);o.y=Math.max(0,f.y+2.12-ndy);o.vy=GRAV;o.vx=0;
}
function doThrow(a,d,mode){
  d.state='airhit';d.soft=false;d.spiked=false;d.slammed=false;let extra=0;
  if(mode==='down'){a.slamT=G.time;d.x=clamp(a.x-a.facing*0.9,BL,BR);d.y=0.9;d.vy=-0.5;d.vx=0;d.slammed=true;extra=30;callout(a,'SLAM!','#c9a0ff');}
  else if(mode==='up'){a.upT=G.time;d.x=a.x+a.facing*0.2;d.y=1.2;d.vy=0.3;d.vx=0;callout(a,'TOSS!','#c9a0ff');}
  else{const sd=mode==='R'?1:mode==='L'?-1:a.facing;if(sd!==a.facing)a.throwBackT=G.time;else a.throwFwdT=G.time;d.x=clamp(a.x+sd*0.75,BL,BR);d.y=Math.max(d.y,0.6);d.vy=0.13;d.vx=sd*0.3;extra=10;callout(a,'THROW!','#c9a0ff');}
  a.pass=false;d.pass=false;if(mode!=='down'&&mode!=='up')d.y=Math.max(d.y,0.6);
  d.hp=Math.max(G.training?1:0,d.hp-extra);d.lastHitT=G.time;a.grabDir=null;a.buf.jump=0;a.state='land';a.stun=(a.throwBackT===G.time||a.throwFwdT===G.time||a.slamT===G.time||a.upT===G.time)?18:14;
  G.hitstop=15;G.shake=Math.max(G.shake,0.18);flash(0.12);if(mode!=='down')sfx.heavy();spark(d.x,d.y+1,0xc9a0ff,16,0.16);
  if(d.hp<=0)KO(a,d);
}
function lungeReact(a,d){d.state='stun';d.stun=40;d.vx=0;a.state='hold';a.mt=0;a.move=null;a.vx=0;callout(a,'GOTCHA!','#c9a0ff');}
function doTeleport(f,o){
  afterimage(f);spark(f.x,f.y+1,0xb48cff,10,0.12,0.1);
  const side=Math.sign(o.x-f.x)||f.facing;let nx=o.x+side*0.8;
  if(nx<BL||nx>BR)nx=o.x-side*0.8;
  f.x=nx;f.vx=0;f.y=o.y;if(o.y>0.05){f.vy=Math.max(o.vy,0.04);f.airMove=true;f.jumps=Math.max(f.jumps,1);}else{f.y=0;f.vy=0;f.airMove=false;}
  f.facing=Math.sign(o.x-f.x)||-side;spark(f.x,f.y+1,0xb48cff,10,0.12,0.1);sfx.whoosh();
  if(f.tpPush&&o.invuln<=0&&o.state!=='ko'&&Math.abs(o.y-f.y)<1.8)applyHit(f,o,{dmg:15,hitstun:14,push:0.45,stop:4},o.x,o.y+1);
}
function tryRift(f){
  if(f.buf.a1>0&&f.cd.r1<=0){f.buf.a1=0;f.cd.r1=150;return startMove(f,'rslash');}
  if(f.buf.a2>0&&(f.tpWin>0||f.cd.r2<=0)){f.buf.a2=0;if(f.tpWin>0){f.tpWin=0;f.cd.r2=300;f.tpPush=true;}else{f.tpWin=150;f.tpPush=false;}return startMove(f,'tele');}
  if(f.buf.a3>0&&f.cd.r3<=0){f.buf.a3=0;f.cd.r3=240;const i=f.inp;f.grabDir=i.d?'down':i.u?'up':i.r?'R':i.l?'L':(f===p1?null:f.grabDir);return startMove(f,'grab');}
  if(f.buf.a4>0&&f.cd.r4<=0){f.buf.a4=0;f.cd.r4=240;return startMove(f,'lunge');}
  return false;
}
Object.assign(MOVES,{
  jhook:{base:'stance',startup:7,active:1,recovery:10},
  zip:{base:'stance',impact:1,startup:1,active:26,recovery:20,dmg:70,vx:0.42,reach:[-0.1,1.0],y:[-0.6,2.2],shake:0.16,react:(a,d,dir)=>{d.state=d.air()?'airhit':'hitstun';d.stun=24;d.vx=dir*0.14;if(d.air())d.vy=0.1;a.vx=0;a.vy=0;a.mt=27;}},
  jslam:{base:'stance',impact:1,startup:10,active:60,recovery:8,dmg:80,reach:[-1.1,1.1],y:[-0.9,1.2],soft:1,launch:0.17,kb:0.02,shake:0.2},
  jupper:{base:'stance',impact:1,startup:9,active:5,recovery:22,dmg:90,reach:[0,1.35],y:[0,2.5],kd:1,launch:0.27,kb:0.13,shake:0.2},
  jkick:{base:'stance',impact:1,startup:5,active:10,recovery:14,vx:0.24,dmg:50,reach:[0,1.35],y:[-0.2,2.0],shake:0.12,react:(a,d,dir)=>{d.state='hitstun';d.stun=14;d.vx=dir*0.4;a.move=null;a.state='jump';a.vy=0.13;a.vx=-dir*0.22;a.jumps=Math.max(a.jumps,1);a.flip=0;}}
});
const JHOOK_REGEN=240;
function tryJacob(f){
  if(f.buf.a1>0&&f.hookOn>0&&!f.pulling){f.buf.a1=0;f.hookOn=0;return startMove(f,'zip');}   // recast: pull yourself in
  if(f.buf.a1>0&&f.hooks>0&&f.hookOn<=0){f.buf.a1=0;f.hooks--;return startMove(f,'jhook');}
  if(f.buf.a2>0&&f.cd.j2<=0){f.buf.a2=0;f.cd.j2=240;const g=!f.air();startMove(f,'jslam');if(g){f.y=0.01;f.vy=0.25;f.airMove=true;f.jumps=1;dust(f.x,6);}return true;}
  if(f.buf.a3>0&&f.cd.j3<=0){f.buf.a3=0;f.cd.j3=210;return startMove(f,'jupper');}
  if(f.buf.a4>0&&f.cd.j4<=0){f.buf.a4=0;f.cd.j4=180;return startMove(f,'jkick');}
  return false;
}
function spawnHook(f){
  const g=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.2,0.1),new THREE.MeshBasicMaterial({color:0x8a1f1f,fog:false}));g.renderOrder=5;
  const p={x:f.x+f.facing*0.8,y:f.y+1.25,vx:f.facing*0.5,owner:f,mesh:g,life:20,noSpin:1,hook:1};g.position.set(p.x,p.y,0.2);scene.add(g);projectiles.push(p);sfx.whoosh();
}
function jacobTick(f,o){
  if(f.hooks<2){if(++f.hookT>=JHOOK_REGEN){f.hooks++;f.hookT=0;}}else f.hookT=0;
  const free=['idle','walkf','walkb','guard','jump','land'].includes(f.state);
  if(free&&!f.air()&&f.state!=='land'&&take(f,'taunt')){f.state='taunt';f.mt=0;f.vx=0;}
  if(f.flyT>0&&--f.flyT===0&&f.state==='jump')f.vx=0;
  if(f.pulling){ // S: drag the enemy in
    const tx=f.x+f.facing*0.9,dx=tx-o.x,dy=f.y-o.y;o.state='stun';o.stun=18;o.vx=0;o.vy=0;
    o.x+=clamp(dx,-0.45,0.45);o.y=Math.max(0,o.y+clamp(dy,-0.3,0.3));
    if(Math.abs(dx)<0.46||o.hp<=0||++f.pullT>40){f.pulling=false;f.hookOn=0;}
  }else if(f.hookOn>0){
    f.hookOn--;
    if(['hitstun','stun','airhit','kd','ko'].includes(f.state)||o.state==='ko')f.hookOn=0;
    else if(free){
      const tw=o.x>=f.x?'kR':'kL';
      if(f.buf.kU>0){f.buf.kU=0;f.buf.jump=0;f.hookOn=0;f.state='jump';f.y=Math.max(f.y,0.01);f.vy=Math.max(0.27,Math.sqrt(2*GRAV*Math.max(0.5,o.y+2.8-f.y)));f.flyT=Math.round(f.vy/GRAV);f.vx=clamp((o.x-f.x)/f.flyT,-0.35,0.35);f.jumps=1;f.flip=0;sfx.jump();dust(f.x,8);}
      else if(f.buf.kD>0){f.buf.kD=0;f.pulling=true;f.pullT=0;sfx.whoosh();}
    }
  }
  jacobRope(f,o);
}
function jacobRope(f,o){
  if(!f.rope){f.rope=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xd8d2c4,fog:false}));f.rope.renderOrder=4;scene.add(f.rope);}
  const pr=projectiles.find(p=>p.owner===f&&p.hook);let tx,ty;
  if(pr){tx=pr.x;ty=pr.y;}else if(f.state==='jult'&&f.uRope===2){tx=f.sAX;ty=f.sAY;} // swinging in from a point above
  else if(f.hookOn>0||f.pulling||(f.state==='jult'&&f.uRope)){tx=o.x;ty=o.y+1.1;}
  else if(f.state==='jfire'&&f.hTipX!==undefined&&f.ht>LU.WIND){tx=f.hTipX;ty=f.hTipY;} // ult grapple in flight
  if(tx===undefined)f.rope.visible=false;
  else{const sx=f.x+f.facing*0.45,sy=f.y+1.25,dx=tx-sx,dy=ty-sy,L=Math.hypot(dx,dy)||0.01;
    f.rope.visible=true;f.rope.position.set(sx+dx/2,sy+dy/2,0.12);f.rope.rotation.z=Math.atan2(dy,dx);f.rope.scale.set(L,0.05,1);}
}
function riftFrame(f){
  const st=f.st||0,I='rift_idle',R='rift_run',J='rift_jump',H='rift_heavy';
  const jf=()=>f.flip>0?[J,4,'flip']:(st<6&&f.vy>0.12)?[J,2]:f.vy>0.05?[J,3]:f.vy>-0.07?[J,4]:f.vy>-0.17?[J,5]:[J,6];
  switch(f.state){
    case 'walkf':return [R,Math.floor(st/6)%SPR[R].length];
    case 'walkb':return ['rift_runb',Math.floor(st/10)%SPR.rift_runb.length];
    case 'jump':return jf();
    case 'land':return G.time-(f.throwBackT||-99)<18?['rift_throwb',0]:G.time-(f.throwFwdT||-99)<18?['rift_throwf',0]:G.time-(f.slamT||-99)<18?['rift_slamd',0]:G.time-(f.upT||-99)<18?['rift_throwu',0]:[J,7];
    case 'wakeup':return [J,1];
    case 'dodge':return f.dodgeDir===f.facing?['rift_roll',Math.min(4,Math.floor(f.mt/5))]:['rift_dodgeb',Math.min(3,Math.floor(f.mt/6))];
    case 'victory':return ['rift_win',Math.min(4,Math.floor(st/12))];
    case 'charge':return [H,f.charge<TAP?0:0];
    case 'ghold':return ['rift_grab',2];
    case 'hold':return ['rift_grab',2];
    case 'parry':return [H,0];
    case 'guard':case 'block':return ['rift_block',f.state==='block'?1:0];
    case 'rult':return riftUltFrame(f);
    case 'ultd':return f.uPose==='down'?['rift_hit',0,'down']:f.uPose==='fly'?['rift_hit',0,'tumble']:['rift_hit',0];
    case 'hitstun':case 'stun':return ['rift_hit',0];
    case 'airhit':return ['rift_hit',0,'tumble'];
    case 'kd':case 'ko':return ['rift_hit',0,'down'];
    case 'attack':{const m=f.move,s=m?m.startup:0,a=m?m.active:0,k=f.mt;
      if(f.mname==='heavy')return [H,k<=s?1:k<=s+a+10?2:1];
      if(f.mname==='rslash'){const e=s+a+6,r=m.recovery-6,q=(k-e)/r;return ['rift_slash',k<=4?0:k<=8?1:k<=s?2:k<=e?4:q<0.34?2:q<0.67?1:0];}
      if(f.mname==='grab')return ['rift_grab',0];
      if(f.mname==='light')return k<=s?[H,0]:['rift_jab',0];
      if(f.mname==='air')return k<=s?['rift_air',1]:k<=s+4?['rift_air',2]:k<=s+m.active?['rift_air',3]:[J,4];
      if(f.mname==='slam')return ['rift_slam',k<=s?1:2];
      if(f.mname==='tele'&&f.tpPush)return k<=s?[H,0]:['rift_jab',0];
      if(f.mname==='tele')return k<=2?['rift_bout',0]:k<=4?['rift_bout',1]:k<=s?['rift_bout',2]:k<=s+4?['rift_bin',0]:['rift_bin',1]; // dissolve, then re-form
      if(f.mname==='lunge'||f.mname==='rult')return ['rift_lunge',k<=s?0:1];
      if(f.mname==='tele'||f.mname==='dash')return [R,3];
      return f.mt<=s?[H,0]:[H,2];}
  }
  return [I,Math.floor(G.time/5+f.idx*3)%SPR.rift_idle.length];
}
function jacobFrame(f){
  const st=f.st||0,t=G.time,I='jacob_idle',R='jacob_run',T='jacob_taunt';
  switch(f.state){
    case 'walkf':return [R,Math.floor(st/5)%6];
    case 'walkb':return ['jacob_runb',Math.floor(st/9)%6];
    case 'taunt':return [T,Math.min(5,Math.floor(f.mt/9))];
    case 'jump':{const J='jacob_jump';if(f.flip>0)return [J,3,'flip'];if(st<6&&f.vy>0.12)return [J,1];return [J,f.vy>0.05?2:f.vy>-0.07?3:4];}
    case 'dodge':return [R,3];
    case 'land':return ['jacob_jump',0];
    case 'wakeup':return [I,0];
    case 'victory':return ['jacob_win',Math.min(4,Math.floor(st/12))];
    case 'charge':return ['jacob_heavy',f.charge<TAP?0:1];
    case 'parry':return [T,2];
    case 'guard':case 'block':return [T,0];
    case 'jult':return lashUltFrame(f);
    case 'jfire':return ['jacob_heavy',(f.ht||0)<=LU.WIND?1:3];
    case 'ultd':return f.uPose==='down'?['jacob_hit',0,'down']:f.uPose==='fly'?['jacob_hit',0,'tumble']:['jacob_hit',0];
    case 'hitstun':case 'stun':return ['jacob_hit',0];
    case 'airhit':return ['jacob_hit',0,'tumble'];
    case 'kd':case 'ko':return ['jacob_hit',0,'down'];
    case 'attack':{const m=f.move,k=f.mt,s=m?m.startup:0;
      if(f.mname==='heavy')return ['jacob_heavy',k<=s?2:k<=s+m.active+6?3:4];
      if(f.mname==='light')return ['jacob_jab',k<=s?0:k<=s+m.active+2?1:0];
      if(f.mname==='jslam')return k<=s?[T,3]:[R,3];
      if(f.mname==='jupper')return [T,k<=s?1:3];
      if(f.mname==='zip')return [R,3];
      return k<=s?[T,1]:[R,2];}
  }
  return [I,Math.floor(t/9+f.idx*3)%SPR.jacob_idle.length];
}
const KNIFE_HIT={impact:1,dmg:45,soft:1,launch:0.11,kb:0.02,stop:5,shake:0.05};
const PARRY_WIN=36,TAP=8,CHARGE=30;
const CD={parry:300,dash:240,shotgun:90,kick:180,dodge:40,knifeRegen:210};
P.tuck=ov(Z,{h:-0.32,spine:[0.6,0,0],head:[0.4,0,0],shW:[-1.2,0,0.3],elW:[-1.8],shF:[-1.2,0,0.3],elF:[-1.9],lgW:[-1.9,0,0.15],knW:[2.3],lgF:[-1.8,0,0.15],knF:[2.4],cape:1.2});
P.parry=ov(P.stance,{h:-0.16,spine:[-0.08,0,0],chest:[0,0.35,0],shW:[-1.75,0,-0.4],elW:[-0.55],shF:[-1.25,0,0.25],elF:[-1.7]});
P.charge=ov(P.stance,Object.assign({},MOVES.heavy.wind,{h:-0.24,lgW:[-0.75,0,0.15],knW:[1.0],lgF:[0.5,0,0.15],knF:[0.4]}));
