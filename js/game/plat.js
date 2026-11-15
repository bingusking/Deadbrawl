'use strict';
/* =============== PLATINUM ===============
   Bounty hunter with a shotgun and cuffs; her ultimate turns her into a wolf for 10 seconds.
   Human:  1 Slug (aimed shot: damage + launch)   2 Cuffs (aimed throw: short stun, no movement abilities for 3s)
           3 Pounce (aimed: kick off them, they fly where you aimed)   4 Stock Swing (slow, heavy, big knockback)
   Wolf:   faster, dodge has no cooldown.  1 Pounce (finisher: launches them into the next arena and ends the form)
           2 Bite (holds them in place, chewing)   3 Slam (lays them out for half a second)   no 4
   Art note: she only has one frame per form so far, so her moves are shown by leaning/tilting that frame. */
const PL={SHOT:70,CUFF:25,CUFF_T:180,POUNCE:50,SWING:130,WOLF:600,FIN:60,BITE:20,CHEW:8,WSLAM:60,RANGE:9};
CHARS.plat={name:'PLATINUM',ab:['SLUG','CUFFS','LEAP','SWING'],desc:'1 Slug shot · 2 Cuff throw · 3 Pounce · 4 Stock swing · R Wolf form (10s)'};
ULTS.plat={name:'FULL MOON'};
// movement abilities a cuffed fighter loses for 3 seconds (plus dodge, and Vish's slide)
const CUFF_BLOCK={vish:['a2'],rift:['a2','a4'],jacob:['a1','a4'],plat:['a3']};
for(const n of['pshot','pcuff','ppounce','wpounce'])AIM_MOVES.add(n);
Object.assign(MOVES,{
  pshot:{base:'stance',startup:9,active:2,recovery:18},
  pcuff:{base:'stance',startup:8,active:1,recovery:16},
  ppounce:{base:'stance',aim:1,impact:1,startup:5,active:13,recovery:14,vx:0.3,dmg:PL.POUNCE,reach:[0,1.3],y:[-0.3,2.0],shake:0.12,
    react:(a,d)=>{const ax=a.adx||a.facing,ay=a.ady||0; // they fly where you aimed, you spring back off them
      d.state='airhit';d.vx=ax*0.3;d.vy=Math.max(0.1,ay*0.3+0.1);d.y=Math.max(d.y,0.02);
      a.move=null;a.state='jump';a.vx=-ax*0.2;a.vy=0.17;a.jumps=Math.max(a.jumps,1);a.flip=0;}},
  pswing:{base:'stance',melee:1,impact:1,trail:1,startup:24,active:5,recovery:22,dmg:PL.SWING,reach:[0,2.0],y:[0,2.1],kd:1,launch:0.14,kb:0.3,stop:12,shake:0.25},
  wpounce:{base:'stance',aim:1,grab:1,startup:4,active:16,recovery:14,vx:0.36,dmg:1,reach:[0,1.4],y:[-0.3,2.0],shake:0.15,react:(a,d)=>platFinStart(a,d)},
  wbite:{base:'stance',grab:1,startup:5,active:8,recovery:10,vx:0.2,dmg:PL.BITE,reach:[0,1.2],y:[0,2.0],shake:0.1,
    react:(a,d)=>{d.state='stun';d.stun=85;d.vx=0;d.vy=0;a.biteT=80;callout(a,'BITE!','#ff5a4a');}},
  wslam:{base:'stance',impact:1,startup:10,active:5,recovery:16,dmg:PL.WSLAM,reach:[-0.3,1.6],y:[-0.3,2.2],shake:0.25,
    react:(a,d)=>{d.state='kd';d.stun=30;d.y=0;d.vx=0;d.vy=0;dust(d.x,16);callout(a,'SLAM!','#ffcc33');}},
});
function tryPlat(f){const c=f.cd,go=(b,cd,n,mv)=>{if(f.buf[b]>0&&!(c[cd]>0)){f.buf[b]=0;c[cd]=n;startMove(f,mv);return true;}return false;};
  if(f.wolf>0){f.buf.a4=0;return go('a1','w1',90,'wpounce')||go('a2','w2',150,'wbite')||go('a3','w3',150,'wslam');}
  return go('a1','p1',150,'pshot')||go('a2','p2',300,'pcuff')||go('a3','p3',210,'ppounce')||go('a4','p4',240,'pswing');}
// things that happen on a particular frame of her moves (called from runMove)
function platMove(f,o,m){
  if(f.mname==='pshot'&&f.mt===m.startup){ // the slug: a thin, long shot along the aim
    const dx=f.adx??f.facing,dy=f.ady??0,ox=f.x+dx*0.5,oy=f.y+1.2;shotFx(ox+dx*0.6,oy+dy*0.6,dx,dy);if(!f.air())f.vx-=dx*0.05;
    for(let i=1;i<PL.RANGE;i++)spark(ox+dx*i,oy+dy*i,0xfff0b0,1,0.02,0.03);
    const cx=o.x-ox,cy=o.y+1.0-oy,t=cx*dx+cy*dy,perp=Math.abs(cx*dy-cy*dx);
    if(o.invuln<=0&&o.state!=='ko'&&t>-0.4&&t<PL.RANGE&&perp<0.75)applyHit(f,o,{dmg:PL.SHOT,juggle:1,launch:0.2,kb:0.04,impact:1,shake:0.2},o.x,o.y+1);}
  if(f.mname==='pcuff'&&f.mt===m.startup)spawnCuff(f);
  if(f.mname==='wslam'&&f.mt===m.startup+1){dust(f.x+f.facing*0.8,14);G.shake=Math.max(G.shake,0.2);sfx.heavy();}
}
function spawnCuff(f){
  const dx=f.adx??f.facing,dy=f.ady??0,g=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.045,6,14),new THREE.MeshBasicMaterial({color:0xcfd6de,fog:false}));
  const p={x:f.x+dx*0.8,y:f.y+1.2+dy*0.8,vx:dx*0.36,vy:dy*0.36,owner:f,mesh:g,life:60,cuff:1};
  g.position.set(p.x,p.y,0.2);scene.add(g);projectiles.push(p);sfx.whoosh();}
function cuffHit(a,o,p){
  const hp=o.hp;applyHit({x:p.x-p.vx*3,facing:Math.sign(p.vx)||1,idx:a.idx,tension:0,combo:0,lastRes:''},o,{dmg:PL.CUFF,hitstun:30,push:0.02,stop:8},p.x,p.y);
  if(o.hp<hp-5&&o.hp>0&&o.state!=='block'){o.cuffT=PL.CUFF_T;if(o.state==='hitstun'){o.state='stun';o.stun=30;}callout(a,'CUFFED!','#cfd6de');}}
// per-frame upkeep (called for every fighter): cuffs wearing off, wolf timer, the bite hold
function platTick(f,o){
  if(f.cuffT>0){f.cuffT--;f.inp.s=0;if(f.cuffT%14===0)spark(f.x,f.y+1.0,0xcfd6de,2,0.04,0.05);}
  if(f.char!=='plat')return;
  if(f.wolf>0&&f.state!=='pult'){f.tension=0;if(--f.wolf===0)platShift(f,0);}
  if(f.biteT>0){f.biteT--;
    if(o.state!=='stun'||f.wolf<=0||['hitstun','airhit','kd','stun','ko'].includes(f.state))f.biteT=0;
    else{o.x=clamp(f.x+f.facing*0.75,BL,BR);o.vx=0;
      if(f.biteT%16===0){o.hp=Math.max(1,o.hp-PL.CHEW);o.lastHitT=G.time;spark(o.x,o.y+1.2,0xff5a4a,6,0.08,0.08);sfx.hit();}}}
}
// shapeshift flash (on = into the wolf)
function platShift(f,on){afterimage(f);spark(f.x,f.y+1,on?0xfff0d0:0xcfd6de,22,0.16,0.14);dust(f.x,10);sfx.super();flash(on?0.25:0.1);
  callout(f,on?'FULL MOON':'...','#fff0d0');if(!on){f.biteT=0;f.cd.w1=f.cd.w2=f.cd.w3=0;}}
/* wolf Pounce finisher: knocks them into the next arena; she runs in after them and changes back on arrival */
function platFinStart(a,d){a.state='pult';a.move=null;a.u2=0;a.ucOn=0;a.udir=Math.sign(a.adx||a.facing)||a.facing;a.biteT=0;
  d.state='ultd';d.uPose='';d.vx=d.vy=0;a.pass=d.pass=true;}
function platFinEnd(f,o){f.u2=0;f.ucOn=0;f.uFollow=1;f.state=f.y>0?'jump':'idle';f.jumps=1;f.flip=0;f.pass=false;
  if(f.wolf>0){f.wolf=0;platShift(f,0);}
  if(o.state==='ultd'){o.uPose='';o.state='airhit';o.vy=-0.3;}o.pass=false;}
function platFinTick(f,o){
  f.vx=f.vy=0;o.vx=o.vy=0;f.pass=o.pass=true;f.uFollow=0;const d=f.udir,u=++f.u2,ease=p=>1-Math.pow(1-clamp(p,0,1),2);
  if(u===1){f.facing=d;o.facing=-d;ultHit(f,o,PL.FIN,o.x,o.y+1,true);flash(0.35);impactFrame(0);callout(f,'GET OUT!','#ff5a4a');return;}
  if(o.state!=='ultd'&&u<=KN.N+1){platFinEnd(f,o);return;}
  const r=u-1;arenaKnock(f,o,r,d);
  if(r>=8){if(r===8){f.lx0=f.x;f.ly0=f.y;sfx.whoosh();}
    const p=(r-8)/(KN.N+6);f.x=f.lx0+(f.bX-d*2.5-f.lx0)*(p*0.6+0.4*ease(p));f.y=Math.max(0,f.ly0*(1-p*4));f.facing=d;if(r%4===0)dust(f.x-d*0.5,2);}
  if(r>=KN.N+14)platFinEnd(f,o);
}
// which frame + tilt she shows (a number in the third slot = lean forward by that many radians)
function platFrame(f){const A=f.wolf>0?'plat_wolf':'plat_idle',t=G.time,st=f.st||0;let m=0;
  switch(f.state){
    case 'idle':case 'intro':m=Math.sin(t*0.07+f.idx)*0.012;break;
    case 'walkf':m=(f.wolf>0?0.2:0.1)+Math.sin(t*0.45)*0.04;break;
    case 'walkb':m=-0.07+Math.sin(t*0.3)*0.02;break;
    case 'jump':if(f.flip>0)return [A,0,'flip'];m=clamp(0.1-f.vy*0.8,-0.15,0.35);break;
    case 'dodge':m=f.dodgeDir===f.facing?0.55:-0.35;break;
    case 'hitstun':case 'stun':m=-0.24;break;
    case 'guard':case 'block':case 'parry':m=-0.1;break;
    case 'charge':m=-0.16;break;
    case 'airhit':return [A,0,'tumble'];
    case 'kd':case 'ko':return [A,0,'down'];
    case 'ultd':return f.uPose==='down'?[A,0,'down']:f.uPose==='fly'?[A,0,'tumble']:[A,0,-0.2];
    case 'pult':m=(f.u2||0)<9?0.5:0.3+Math.sin(t*0.6)*0.06;break;
    case 'victory':m=Math.sin(st*0.15)*0.05;break;
    case 'attack':{const mv=f.move,k=f.mt,s=mv?mv.startup:0,n=f.mname;
      m=n==='ppounce'||n==='wpounce'?(k<=s?-0.2:0.75):n==='pswing'?(k<=s?-0.38:0.5):n==='wslam'?(k<=s?-0.45:0.65):n==='wbite'?(k<=s?-0.1:0.4):k<=s?-0.12:0.24;}
  }
  return [A,0,m];}
