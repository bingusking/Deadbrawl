'use strict';
/* =============== FIGHTERS =============== */
const MAXHP=1000, STAGE=8.2, GRAV=0.0115, JUMPV=0.22, DJUMPV=0.2, RUNF=0.085, RUNB=0.068;
class Fighter{
  constructor(pal,idx){this.idx=idx;this.rig=buildRig(pal);scene.add(this.rig.root);
    const sh=new THREE.Mesh(new THREE.CircleGeometry(0.5,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.4,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=0.015;scene.add(sh);this.shadow=sh;
    this.char='vish';this.spr=makeSpriteMesh(3-idx);this.inp={l:0,r:0,u:0,d:0,q:0};this.buf={};this.tension=0;this.atkId=0;this.ai={think:20,plan:0,dir:0};this.reset(0);}
  reset(x){Object.assign(this,{x,y:0,vx:0,vy:0,hp:MAXHP,trailHp:MAXHP,state:'intro',t:0,stun:0,move:null,mname:'',mt:0,hasHit:false,lastRes:'',combo:0,comboTaken:0,invuln:0,
    facing:x<0?1:-1,jumps:0,flip:0,dodgeDir:0,charge:0,chargeLvl:0,parried:false,pass:false,lightChain:0,airUsed:false,airMove:false,soft:false,spiked:false,
    cd:{parry:0,dash:0,shotgun:0,kick:0,dodge:0,air:0,r1:0,r2:0,r3:0,r4:0,j2:0,j3:0,j4:0},hooks:2,hookT:0,hookOn:0,pulling:false,tpWin:0,grabDir:null,knives:3,knifeT:0});this.buf={};this.cur=ov(P.intro);}
  air(){return this.y>0.001||this.vy>0;}
}
const BUF=12; // frames an early press is remembered for
function press(f,b){f.buf[b]=BUF;}
function take(f,b){if(f.buf[b]>0){f.buf[b]=0;return true;}return false;}
const projectiles=[];
let p1,p2;
function startMove(f,name){
  const m=MOVES[name];f.state='attack';f.move=m;f.mname=name;f.mt=0;f.hasHit=false;f.lastRes='';f.atkId++;f.airMove=f.air();
  if(name==='dash'){f.cd.dash=CD.dash;f.pass=true;}
  if(name==='shotgun')f.cd.shotgun=CD.shotgun;
  if(name==='kick')f.cd.kick=CD.kick;
  if(name==='knife')f.knives--;
  if(name==='burst'){f.burstN=f.knives;f.knives=0;f.knifeT=0;}
  if(name==='air')f.airUsed=true;
  if(name==='air'||name==='slam')f.cd.air=26; // short gap between up attack and down attack
  return true;
}
function startDodge(f){
  const fwd=f.facing>0?f.inp.r:f.inp.l;
  f.state='dodge';f.mt=0;f.dodgeDir=fwd?f.facing:-f.facing;f.invuln=17;f.pass=true;f.atkId++;sfx.whoosh();if(!f.air())dust(f.x,6);
}
// abilities, parry and dodge (abilities + dodge also work in the air)
function tryAbility(f){
  const V=f.char==='vish';if(f.char==='rift'&&tryRift(f))return true;if(f.char==='jacob'&&tryJacob(f))return true;
  if(V&&f.buf.a1>0&&f.knives>0){f.buf.a1=0;const o=f===p1?p2:p1,d=(o.x-f.x)*f.facing;
    if(d>0&&d<1.7&&Math.abs(o.y-f.y)<1.4&&o.state!=='ko')return startMove(f,'burst'); // point-blank: throw every stored knife
    return startMove(f,'knife');}
  if(V&&f.buf.a2>0&&f.cd.dash<=0){f.buf.a2=0;return startMove(f,'dash');}
  if(V&&f.buf.a3>0&&f.cd.shotgun<=0){f.buf.a3=0;return startMove(f,'shotgun');}
  if(V&&f.buf.a4>0&&f.cd.kick<=0){f.buf.a4=0;return startMove(f,'kick');}
  if(f.buf.dodge>0&&f.cd.dodge<=0){f.buf.dodge=0;startDodge(f);return true;}
  if(!f.air()&&f.buf.parry>0&&f.cd.parry<=0){f.buf.parry=0;f.state='parry';f.mt=0;f.parried=false;f.vx=0;f.atkId++;sfx.sel();return true;}
  return false;
}
function tryMelee(f){
  if(f.buf.slam>0){
    if(!f.air()){f.buf.slam=0;f.buf.melee=8;}          // no down attack on the ground: it becomes a normal melee
    else if(f.cd.air>0)return false;
    else{f.buf.slam=0;f.buf.melee=0;return startMove(f,'slam');}
  }
  if(!(f.buf.melee>0))return false;
  if(f.air()){if(f.airUsed||f.cd.air>0)return false;f.buf.melee=0;return startMove(f,'air');}
  f.buf.melee=0;f.state='charge';f.charge=0;f.vx=0;f.atkId++;return true;
}
function overlap(a,d,m){
  if(d.invuln>0||d.state==='ko')return null;
  const x0=a.x+a.facing*m.reach[0],x1=a.x+a.facing*m.reach[1];
  const lo=Math.min(x0,x1),hi=Math.max(x0,x1);
  if(hi<d.x-0.34||lo>d.x+0.34)return null;
  const ay0=a.y+m.y[0],ay1=a.y+m.y[1];
  if(ay1<d.y||ay0>d.y+1.8)return null;
  return {x:clamp(d.x-a.facing*0.25,lo,hi),y:(Math.max(ay0,d.y)+Math.min(ay1,d.y+1.8))/2};
}
// something about to hit f? (used to stand still in guard instead of walking away)
function threatOf(f,o){const dx=Math.abs(o.x-f.x);
  if((o.state==='attack'&&o.move&&o.move.dmg&&dx<3.4)||(o.state==='charge'&&dx<3))return true;
  return projectiles.some(p=>p.owner===o&&Math.abs(p.x-f.x)<4&&Math.sign(f.x-p.x)===Math.sign(p.vx));}
// blocking: grounded, not busy, holding away from the attacker
function canBlock(d,a){
  if(d.air()||!['idle','walkf','walkb','guard','block'].includes(d.state))return false;
  const s=Math.sign(a.x-d.x)||d.facing;return s>0?(d.inp.l&&!d.inp.r):(d.inp.r&&!d.inp.l);}
function applyHit(a,d,m,px,py){
  // PARRY: only melee and charged heavies can be parried
  if(m.melee&&d.state==='parry'&&d.mt>=1&&d.mt<=PARRY_WIN){
    d.parried=true;d.cd.parry=0;
    a.state='stun';a.stun=130;a.move=null;a.pass=false;a.vx=-a.facing*0.07;if(a.vy>0)a.vy=0;a.lastRes='parried';
    G.hitstop=16;G.shake=0.18;spark(px,py,0x7ec8ff,22,0.18,0.14);sfx.parry();flash(0.35);callout(d,'PARRY!','#7ec8ff');
    return;
  }
  const real=a instanceof Fighter;
  // BLOCK: everything except grabs; abilities and knives do a little chip damage
  if(!m.grab&&canBlock(d,a)){
    const dir=Math.sign(d.x-a.x)||a.facing,chip=m.melee?0:Math.max(1,Math.round(m.dmg*0.12));
    d.hp=Math.max(G.training?1:0,d.hp-chip);if(chip)d.lastHitT=G.time;
    d.state='block';d.stun=Math.max(10,Math.round((m.hitstun||16)*0.7))+(m.impact?4:0);d.vx=dir*Math.max(0.06,(m.push||0.05)*0.8);
    d.move=null;d.charge=0;d.comboTaken=0;
    if(real){a.lastRes='block';if(!a.air())a.vx=-dir*0.04;if(m.react&&a.move)a.mt=Math.max(a.mt,a.move.startup+a.move.active);}
    a.tension=Math.min(100,a.tension+2);d.tension=Math.min(100,d.tension+4);
    G.hitstop=Math.max(G.hitstop,m.impact?8:5);G.shake=Math.max(G.shake,0.03);
    spark(px,py,0x8fd0ff,10,0.1,0.12);sfx.block();
    if(d.hp<=0)KO(a,d);
    return;
  }
  const lvl=m.heavy?(a.chargeLvl||0):0, full=false;
  // COUNTER: hit them while their own attack is starting up or out
  const counter=real&&((d.state==='attack'&&d.move&&d.mt<=d.move.startup+d.move.active)||d.state==='charge');
  const sc=Math.max(0.35,1-d.comboTaken*0.1); // damage scaling: 100%, 90%, 80%... down to 35%
  const dealt=Math.round(m.dmg*(1+lvl)*sc*(counter?1.25:1));
  if(d.comboTaken===0)d.comboDmg=0;
  d.hp-=dealt;d.comboDmg=(d.comboDmg||0)+dealt;d.comboTaken++;a.combo=d.comboTaken;showCombo(a,d.comboTaken,d.comboDmg);
  if(counter){callout(a,'COUNTER!','#ff4a3a');flash(0.1);}
  const dir=Math.sign(d.x-a.x)||a.facing, inAir=d.air()||d.state==='airhit';
  d.soft=false;
  if(m.react)m.react(a,d,dir,inAir);
  else if(m.spike&&inAir){d.state='airhit';d.vy=-0.45;d.vx=dir*0.01;d.spiked=true;d.bounceH=Math.max(0.8,d.y);d.hp-=20;callout(a,'SPIKE!','#ffcc33');}
  else if(m.slam){d.state='airhit';d.slammed=true;d.spiked=false;if(inAir){d.vy=-0.5;d.vx=dir*0.01;}else{d.y=0.02;d.vy=-0.2;d.vx=dir*0.02;}callout(a,'SLAM!','#ffcc33');}
  else if(m.juggle){d.state='airhit';d.vy=m.launch;d.vx=dir*m.kb;d.y=Math.max(d.y,0.02);if(a.air&&a.air())a.vy=Math.max(a.vy,0.14);}
  else if(m.soft){d.state='airhit';d.vy=m.launch;d.vx=dir*m.kb;d.y=Math.max(d.y,0.02);d.soft=!inAir;}
  else if(m.kd||full||inAir||d.hp<=0){d.state='airhit';d.vy=m.launch||(full?0.15:0.12);d.vx=dir*(m.kb||(full?0.17:0.07));d.y=Math.max(d.y,0.02);}
  else{d.state='hitstun';d.stun=m.hitstun+(counter?8:0);d.vx=dir*m.push*(1+lvl*0.5)*(real&&a.mname==='light'&&a.lightChain<2?0.12:1);} // chained jabs barely push, so the string stays in range
  d.move=null;d.charge=0;d.pass=false;a.lastRes='hit';a.airUsed=false;d.lastHitT=G.time;
  a.tension=Math.min(100,a.tension+6);d.tension=Math.min(100,d.tension+3);
  G.hitstop=Math.max(G.hitstop,(m.impact?15:(m.stop||7))+(counter?4:0));if(m.impact)flash(0.12);G.shake=Math.max(G.shake,(m.shake||0.05)+lvl*0.12);
  const big=m.dmg*(1+lvl)>=80;
  spark(px,py,big?0xffb347:0xfff0c0,big?18:11,big?0.16:0.11);
  (big?sfx.heavy:sfx.hit)();
  if(d.hp<=0){d.hp=0;KO(a,d);}
}
function stepFighter(f,o){
  for(const k in f.buf)if(f.buf[k]>0)f.buf[k]--;
  if(f.invuln>0)f.invuln--;
  for(const k in f.cd)if(f.cd[k]>0)f.cd[k]--;
  if(f.tpWin>0&&--f.tpWin===0)f.cd.r2=300;
  if(f.char==='jacob')jacobTick(f,o);else if(f.rope)f.rope.visible=false;
  if(f.knives<3){if(++f.knifeT>=CD.knifeRegen){f.knives++;f.knifeT=0;}}else f.knifeT=0;
  f.t++;
  const wasAir=f.air();
  const fwd=()=>f.facing>0?f.inp.r:f.inp.l, back=()=>f.facing>0?f.inp.l:f.inp.r;
  if(['idle','walkf','walkb','guard','jump','land'].includes(f.state))f.comboTaken=0;
  // always face the enemy, except mid-dash and mid-roll
  if(!(G.time-(f.heldT||-9)<=1)&&!(f.state==='attack'&&(f.mname==='dash'||f.mname==='jkick'||f.mname==='lunge'))&&f.state!=='dodge'&&f.state!=='ghold'&&f.state!=='hold'&&!['kd','ko','intro','victory'].includes(f.state)&&Math.abs(o.x-f.x)>0.08)f.facing=o.x>=f.x?1:-1;
  switch(f.state){
    case 'idle':case 'walkf':case 'walkb':case 'guard':{f.jumps=0;f.airUsed=false;f.lightChain=0;
      if(tryAbility(f)||tryMelee(f))break;
      if(take(f,'jump')){f.state='jump';f.vy=JUMPV;f.vx=(fwd()?1:back()?-0.85:0)*f.facing*0.085;f.jumps=1;f.flip=0;sfx.jump();dust(f.x,4);break;}
      if(fwd()){f.state='walkf';f.vx=f.facing*RUNF;}
      else if(back()){f.state='walkb';f.vx=-f.facing*RUNB;}
      else{f.state='idle';f.vx*=0.5;}
      if(f.state==='walkb'&&threatOf(f,o)){f.state='guard';f.vx=0;} // hold back near an attack = stand and block
      if((f.state==='walkf'||f.state==='walkb')&&G.time%12===0)dust(f.x-f.vx*4,1);
      break;}
    case 'jump':{
      const dir=(f.inp.r?1:0)-(f.inp.l?1:0);if(dir)f.vx+=(dir*0.085-f.vx)*0.06;
      if(f.flip>0)f.flip--;
      if(tryAbility(f)||tryMelee(f))break;
      if(f.jumps<2&&take(f,'jump')){f.vy=DJUMPV;f.jumps=2;f.flip=24;if(dir)f.vx=dir*0.08;sfx.jump();spark(f.x,f.y+0.2,0xffffff,6,0.06,0.08);}
      break;}
    case 'charge':
      f.charge++;f.vx*=0.5;
      if(f.charge<TAP&&!f.inp.q)startMove(f,'light');
      else if(f.charge>=CHARGE){f.chargeLvl=1;startMove(f,'heavy');sfx.ok();spark(f.x+f.facing*0.5,f.y+1.2,0xff6a3a,10,0.1,0.1);}
      else if(f.charge>=TAP&&G.time%3===0)spark(f.x+f.facing*0.6,f.y+1.15,0xffb347,2,0.05,0.06);
      break;
    case 'attack':runMove(f,o);break;
    case 'taunt':f.mt++;f.vx=0;if(f.mt>=54)f.state='idle';break;
    case 'ghold':{f.mt++;f.vx=0;
      if(o.state!=='stun'){f.state='idle';f.pass=o.pass=false;break;}
      holdThroat(f,o);
      const i=f.inp,dir=i.d?'down':i.u?'up':i.r?'R':i.l?'L':(f!==p1&&f.mt>=20?(f.grabDir||'fwd'):null);
      if((dir&&f.mt>=8)||f.mt>=60)doThrow(f,o,dir||'fwd');
      break;}
    case 'hold':f.mt++;f.vx=0;if(o.state==='stun'&&f.mt<30)holdThroat(f,o,true);
      if(f.mt>=30||o.state!=='stun'){
        if(o.state==='stun'){o.state='hitstun';o.stun=16;o.vx=-f.facing*0.32;o.hp=Math.max(G.training?1:0,o.hp-30);o.lastHitT=G.time;spark(o.x,o.y+1.1,0xc9a0ff,14,0.14);sfx.hit();G.hitstop=8;if(o.hp<=0)KO(f,o);}
        o.pass=false;f.state='jump';f.vy=0.21;f.vx=f.facing*0.13;f.jumps=1;f.pass=true;f.flip=0;sfx.jump();}
      break;
    case 'parry':f.mt++;f.vx*=0.5;if(f.mt>=PARRY_WIN+10){if(!f.parried)f.cd.parry=CD.parry;f.state='idle';}break;
    case 'dodge':
      f.mt++;f.vx=f.mt<=18?f.dodgeDir*0.13:f.vx*0.6;if(wasAir&&f.mt<=14)f.vy=Math.max(0,f.vy*0.5);
      if(f.mt>=24){f.state=f.air()?'jump':'idle';f.pass=false;f.cd.dodge=CD.dodge;f.flip=0;}
      break;
    case 'hitstun':f.stun--;f.vx*=0.9;if(f.stun<=0)f.state='idle';break;
    case 'block':f.stun--;f.vx*=0.85;if(f.stun<=0)f.state='idle';break;
    case 'stun':f.stun--;f.vx*=0.85;if(f.stun%16===0)stars(f);if(f.stun<=0)f.state='idle';break;
    case 'land':f.stun--;f.vx*=0.6;if(f.stun<=0)f.state='idle';break;
    case 'kd':f.stun--;f.vx*=0.8;if(f.stun<=0){f.state='wakeup';f.stun=14;}break;
    case 'wakeup':f.stun--;if(f.stun<=0)f.state='idle';break;
    default:f.vx*=0.88;
  }
  if(f.state==='attack'&&f.mname==='zip'&&f.mt<=27&&!f.hasHit){f.vy=clamp((o.y-f.y)*0.3,-0.3,0.3)+GRAV;if(f.y<=0&&f.vy<=GRAV)f.vy=0;}
  else if(f.state==='attack'&&f.mname==='jslam'){if(f.mt>f.move.startup)f.vy=-0.45;}
  else if(f.state==='attack'&&f.airMove&&f.mname==='slam'){if(f.mt<=f.move.startup)f.vy=Math.max(f.vy,0)*0.5;else f.vy=-0.38;}
  else if(f.state==='attack'&&f.airMove&&f.mname!=='air'&&f.mt<=f.move.startup+f.move.active)f.vy=0; // abilities hover briefly in the air
  // physics
  if(f.air())f.vy-=GRAV;
  f.x+=f.vx;f.y+=f.vy;
  if(f.y>0&&f.y<0.003&&f.vy<=0)f.y=0;
  const falling=wasAir||f.state==='airhit';
  if(f.y<=0&&(falling||f.vy<0)){
    f.y=0;
    if(falling){
      if(f.state==='attack'&&f.mname==='zip'&&f.mt<=27&&!f.hasHit){f.vy=clamp((o.y-f.y)*0.3,-0.3,0.3)+GRAV;if(f.y<=0&&f.vy<=GRAV)f.vy=0;}
  else if(f.state==='attack'&&f.mname==='jslam'){G.shake=Math.max(G.shake,0.22);dust(f.x,16);sfx.heavy();spark(f.x,0.2,0xffcc33,14,0.16,0.12);
        {const fc=f.facing,x0=f.x;for(let i=0;i<2;i++){const w=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:i?0xffcc66:0xfff2d0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
          w.userData.noBill=1;w.scale.set(0.5,0.9-i*0.3,1);addFx(w,16,(mm,k)=>{const t=1-k;mm.position.set(x0+fc*(0.6+t*3.4),0.35-i*0.1,0.4);mm.scale.x=0.4+t*0.9;mm.material.opacity=k*0.8;if(G.time%3===0)dust(mm.position.x,1);});}}
        const sdx=(o.x-f.x)*f.facing;
        if(!f.hasHit&&(Math.abs(o.x-f.x)<2.3||(sdx>0&&sdx<4.2))&&o.y<0.9&&o.invuln<=0&&o.state!=='ko')applyHit(f,o,{dmg:80,soft:1,launch:0.17,kb:0.02,impact:1,shake:0.2},o.x,o.y+0.5);}
      if(f.state==='jump'||(f.state==='attack'&&f.airMove)){f.move=null;f.pass=false;f.state='land';f.stun=5;f.vx*=0.4;dust(f.x,5);}
      else if(f.state==='airhit'){
        if(f.spiked&&f.hp>0){ // ground bounce back up to the height it was kicked from
          f.spiked=false;f.state='airhit';f.vy=Math.sqrt(2*GRAV*f.bounceH);f.vx*=0.3;f.y=0.01;f._bounce=true;
          G.shake=0.25;dust(f.x,16);sfx.heavy();spark(f.x,0.15,0xffcc33,16,0.16,0.12);
        }else{
        if(f.hp<=0)f.state='ko';
        else if(f.soft){f.state='land';f.stun=12;}
        else{f.state='kd';f.stun=f.slammed?50:36;}
        if(f.slammed){G.shake=0.25;dust(f.x,16);sfx.heavy();}
        f.spiked=false;f.slammed=false;f.soft=false;f.vx*=0.4;dust(f.x,10);
        }
      }
      if(!f._bounce){f.jumps=0;f.airUsed=false;}
    }
    if(f._bounce)f._bounce=false;else f.vy=0;
  }
  if(f.state==='airhit'){f.airT=(f.airT||0)+1;if(f.airT>300&&f.vy>-0.05)f.vy=-0.1;}else f.airT=0;
  if(f.invuln>40&&f.state!=='dodge')f.invuln=0;
  f.x=clamp(f.x,-STAGE,STAGE);
}
function runMove(f,o){
  const m=f.move;f.mt++;
  if(m.vx&&f.mt<=m.startup+m.active)f.vx=f.facing*m.vx*(f.mt>m.startup?1:0.3);
  else if(!f.air())f.vx*=0.55;
  if(f.mt===Math.max(1,m.startup-3)&&(m.trail||m.melee))sfx.whoosh();
  if(m.trail&&f.mt===m.startup+1)trail(f,f.mname==='dash'||(m.heavy&&f.chargeLvl>0.5));
  if(m.proj&&f.mt===m.startup)spawnKnife(f);
  if(f.mname==='tele'&&f.mt===m.startup)doTeleport(f,o);
  if(f.mname==='jupper'&&f.mt===m.startup&&!f.air()){f.y=0.01;f.vy=0.15;dust(f.x,5);}
  if(f.mname==='jhook'&&f.mt===m.startup&&o.state!=='ko'){f.hookOn=60;o.hp=Math.max(1,o.hp-15);o.lastHitT=G.time;spark(o.x,o.y+1.1,0xffffff,8,0.1);sfx.block();}
  if(m.burst){
    if(f.mt===m.startup){const o=f===p1?p2:p1,n=f.burstN||1;sfx.whoosh();
      for(let i=0;i<n;i++)burstKnife(f,o,i);
      const h=overlap(f,o,{reach:[-0.2,2.0],y:[-0.2,2.2]});
      if(h)applyHit(f,o,{dmg:35*n,hitstun:18+4*n,push:0.035,impact:1,shake:0.1+0.04*n},h.x,h.y);
      if(h)callout(f,n+'× KNIVES','#ffcc33');}
    if(f.mt===m.startup+2){f.move=null;f.state='jump';f.vy=0.17;f.vx=-f.facing*0.12;f.jumps=1;f.airUsed=false;f.flip=0;dust(f.x,6);sfx.jump();return;}
  }
  if(f.mname==='shotgun'&&f.mt===m.startup)shotgunFx(f);
  if(f.mname==='dash'&&f.mt>m.startup&&f.mt%2===0)afterimage(f);
  if(m.dmg&&!f.hasHit&&f.mt>m.startup&&f.mt<=m.startup+m.active){const h=overlap(f,o,m);if(h){f.hasHit=true;applyHit(f,o,m,h.x,h.y);}}
  if(f.state!=='attack'||f.move!==m)return;
  // cancels: once a move connects (hit or block), the next melee or an ability can interrupt its recovery
  if((f.lastRes==='hit'||f.lastRes==='block')&&f.mt>m.startup){
    if(f.mname==='light'&&f.buf.melee>0&&f.lightChain<2){f.buf.melee=0;f.lightChain++;startMove(f,'light');return;} // jab chain: up to 3
    if(tryAbility(f)){if(f.state==='attack')afterimage(f);return;}
    if(f.mname==='zip'&&tryMelee(f))return;
  }
  if(f.mt>=m.startup+m.active+m.recovery){f.move=null;f.pass=false;f.state=f.air()?'jump':'idle';}
}
function spawnKnife(f){
  const fr=SPR.knifeproj[0];
  const g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TEX[f.idx].knifeproj[0],transparent:true,depthWrite:false,fog:false}));
  g.renderOrder=5;g.scale.set(fr.w*SPRK*1.1*f.facing,fr.h*SPRK*1.1,1);
  const p={x:f.x+f.facing*0.9,y:f.y+1.25,vx:f.facing*0.33,owner:f,mesh:g,life:52,noSpin:1};
  g.position.set(p.x,p.y,0.2);scene.add(g);projectiles.push(p);sfx.whoosh();
}
function burstKnife(f,o,i){
  const fr=SPR.knifeproj[0];
  const g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TEX[f.idx].knifeproj[0],transparent:true,depthWrite:false,fog:false}));
  g.renderOrder=5;g.scale.set(fr.w*SPRK*0.9*f.facing,fr.h*SPRK*0.9,1);g.userData.noBill=1;
  const y0=f.y+1.25+(i-1)*0.22,x0=f.x+f.facing*0.6,x1=o.x-f.facing*0.15,y1=o.y+1.0+(i-1)*0.25;
  g.position.set(x0,y0,0.25);scene.add(g);fx.push(g);g.userData.life=7;g.userData.max=7;
  g.userData.upd=(mm,k)=>{const t=1-k;mm.position.x=x0+(x1-x0)*t;mm.position.y=y0+(y1-y0)*t;mm.material.opacity=k<0.2?k*5:1;};
}
function shotgunFx(f){
  sfx.shot();G.shake=Math.max(G.shake,0.12);
  for(let i=0;i<22;i++){const m=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:i%3?0xffc060:0xfff4d0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    const a=(rnd()-0.5)*0.7,s=0.12+rnd()*0.14;m.position.set(f.x+f.facing*1.5,f.y+1.15,0.4);m.scale.set(0.3,0.05,1);m.rotation.z=f.facing>0?a:Math.PI-a;
    const vx=Math.cos(a)*s*f.facing,vy=Math.sin(a)*s;addFx(m,12,(mm,k)=>{mm.position.x+=vx;mm.position.y+=vy;mm.material.opacity=k;});}
}
function afterimage(f){const sp=f.spr;if(!sp.material.map)return;
  const m=new THREE.Mesh(sp.geometry,new THREE.MeshBasicMaterial({map:sp.material.map,color:f.idx===0?0xff6a5a:0x6ab0ff,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  m.userData.shared=1;m.position.copy(sp.position);m.position.z=0.02;m.scale.copy(sp.scale);m.rotation.z=sp.rotation.z;m.renderOrder=1;
  scene.add(m);fx.push(m);m.userData.life=12;m.userData.max=12;m.userData.upd=(mm,k)=>{mm.material.opacity=k*0.5;};m.userData.noBill=1;}
function stars(f){for(let i=0;i<3;i++){const m=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:0xffdd55,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  const a0=i*2.1;m.scale.set(0.09,0.09,1);addFx(m,16,(mm,k)=>{const a=a0+G.time*0.15;mm.position.set(f.x+Math.cos(a)*0.3,f.y+2.05+Math.sin(a)*0.06,0.3+Math.sin(a)*0.3);mm.material.opacity=k;});}}
function updProj(){
  for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.x+=p.vx;p.life--;p.mesh.position.set(p.x,p.y,0.2);if(!p.noSpin)p.mesh.rotation.z-=0.55*Math.sign(p.vx);
    const o=p.owner===p1?p2:p1;let dead=p.life<=0||Math.abs(p.x)>STAGE+3;
    for(const q of projectiles)if(q!==p&&q.owner!==p.owner&&Math.abs(q.x-p.x)<0.4){dead=true;q.life=0;spark(p.x,p.y,0xffffff,14,0.12);sfx.block();}
    if(!dead&&Math.abs(p.x-o.x)<0.42&&p.y>o.y&&p.y<o.y+1.8&&o.invuln<=0&&o.state!=='ko'){
      if(p.hook){p.owner.hookOn=60;o.hp=Math.max(1,o.hp-15);o.lastHitT=G.time;spark(p.x,p.y,0xffffff,8,0.1);sfx.block();}
      else applyHit({x:p.x-p.vx*3,facing:Math.sign(p.vx),idx:p.owner.idx,tension:0,combo:0,lastRes:''},o,KNIFE_HIT,p.x,p.y);
      p.owner.tension=Math.min(100,p.owner.tension+5);dead=true;}
    if(dead){scene.remove(p.mesh);projectiles.splice(i,1);}
  }
}
function pushbox(){
  const a=p1,b=p2,dx=b.x-a.x;
  if(!a.pass&&!b.pass&&Math.abs(dx)<0.64&&Math.abs(a.y-b.y)<1.5&&!['kd','ko'].includes(a.state)&&!['kd','ko'].includes(b.state)){
    const s=dx!==0?Math.sign(dx):a.facing,o=(0.64-Math.abs(dx))/2;a.x-=s*o;b.x+=s*o;
    if(Math.abs(a.x)>STAGE){a.x=Math.sign(a.x)*STAGE;b.x=a.x+s*0.64;}
    if(Math.abs(b.x)>STAGE){b.x=Math.sign(b.x)*STAGE;a.x=b.x-s*0.64;}
  }
  const MAXSEP=11;if(Math.abs(b.x-a.x)>MAXSEP){const mid=(a.x+b.x)/2,s=Math.sign(b.x-a.x);a.x=mid-s*MAXSEP/2;b.x=mid+s*MAXSEP/2;}
  for(const f of[a,b])f.x=clamp(f.x,-STAGE,STAGE);
}
