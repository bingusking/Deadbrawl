'use strict';
/* =============== AI =============== */
const DIFF={EASY:{think:28,react:16,block:0.15,parry:0.08,dodge:0.1,combo:0.2,aggr:0.6,juggle:0.2},NORMAL:{think:15,react:8,block:0.35,parry:0.25,dodge:0.2,combo:0.6,aggr:1,juggle:0.55},HARD:{think:7,react:3,block:0.5,parry:0.45,dodge:0.25,combo:0.9,aggr:1.3,juggle:0.85}};
function aiThink(b,p){
  aiCore(b,p);
  if(b.char==='jacob'&&G.phase==='fight'&&!G.training){const dist=Math.abs(p.x-b.x);
    if(b.buf.a2>0&&dist>1.6){b.buf.a2=0;b.buf.a1=8;}
    if(b.buf.a4>0&&dist>1.5){b.buf.a4=0;b.buf.a1=8;}
    if(b.hookOn>0&&b.hookOn<48&&rnd()<0.08)press(b,['a1','kD','kD','kU'][rnd()*4|0]);
    if(p.state==='stun'&&dist<1.5&&rnd()<0.2)press(b,rnd()<0.5?'a3':'melee');
    if(b.tension>=ULT_COST&&dist<5&&!b.air()&&rnd()<0.03)press(b,'ult');}
  if(b.char==='rift'&&G.phase==='fight'&&!G.training){const dist=Math.abs(p.x-b.x);
    if(b.buf.a1>0&&dist>2.3){b.buf.a1=0;b.buf[dist<4?'a4':'a2']=8;}
    if(b.buf.a3>0){if(dist>1.5){b.buf.a3=0;b.buf.a4=8;}else b.grabDir=['down','up','fwd'][rnd()*3|0];}
    if(b.buf.a4>0&&dist>4.5){b.buf.a4=0;b.buf.a2=8;}
    if(b.tpWin>0&&b.tpWin<100&&rnd()<0.02)b.buf.a2=8;
    if(b.tension>=ULT_COST&&dist<2.4&&!b.air()&&rnd()<0.04)press(b,'ult');}
}
function aiCore(b,p){
  const A=b.ai,D=DIFF[G.diff];b.inp={l:0,r:0,u:0,d:0,q:0};
  if(G.phase!=='fight'||G.training)return;
  const dx=p.x-b.x,dist=Math.abs(dx),tw=Math.sign(dx)||1;
  const hold=d=>{if(d>0)b.inp.r=1;else if(d<0)b.inp.l=1;};
  if(A.holdQ>0){A.holdQ--;b.inp.q=1;}
  // defence: parry or dodge incoming melee (decided once per attack)
  const threat=(p.state==='attack'&&p.move&&p.move.melee&&p.mt<=p.move.startup&&dist<2.3)||(p.state==='charge'&&dist<3&&p.charge>TAP);
  const anyThreat=threat||threatOf(b,p);
  if(anyThreat){const id=p.atkId;if(A.tid!==id){A.tid=id;A.react=D.react+(rnd()*6|0);const r=rnd();
    A.def=threat&&r<D.parry?'parry':threat&&r<D.parry+D.dodge?'dodge':r<D.parry+D.dodge+D.block?'block':null;}}
  // blocking: keep holding away while the attack (or a blockstring) is coming
  if(A.def==='block'&&anyThreat&&!b.air()){A.react-=2;if(A.react<=0){A.blockT=24;A.def=null;}} // blocking reacts twice as fast as parry/dodge
  if(A.blockT>0&&['idle','walkf','walkb','guard','block'].includes(b.state)){A.blockT--;if(b.state==='block'||anyThreat)A.blockT=Math.max(A.blockT,10);hold(-tw);return;}
  if(A.def&&threat){if(A.react>0)A.react--;else if(A.def==='parry'&&p.state==='attack'&&b.cd.parry<=0){press(b,'parry');A.def=null;}else if(A.def==='dodge'&&b.cd.dodge<=0){hold(-tw);press(b,'dodge');A.def=null;return;}}
  // knives coming in: jump over sometimes
  const kn=projectiles.find(q=>q.owner===p&&Math.abs(q.x-b.x)<3.2&&Math.sign(b.x-q.x)===Math.sign(q.vx));
  if(kn&&A.kid!==kn){A.kid=kn;if(rnd()<D.dodge*1.4&&!b.air())press(b,'jump');}
  // punish a stunned (parried) player
  if(p.state==='stun'&&A.pun!==p.atkId){A.pun=p.atkId;if(dist>1.4&&b.cd.dash<=0)press(b,'a2');else{press(b,'melee');A.holdQ=60;}}
  // combo follow-ups on hit
  if(b.state==='attack'&&b.lastRes==='hit'&&A.cfor!==b.atkId){A.cfor=b.atkId;
    if(rnd()<D.combo){const nm=b.mname;
      if(nm==='light'&&b.lightChain<2)press(b,'melee');
      else if(nm==='light'){if(b.cd.shotgun<=0)press(b,'a3');else if(b.cd.dash<=0)press(b,'a2');}
      else if(nm==='air'&&b.cd.kick<=0)A.kickWait=14;
      else if(nm==='knife'&&dist<2.2){press(b,'jump');A.airAtk=true;}}}
  if(A.kickWait>0&&--A.kickWait===0)press(b,'a4');
  // juggle: chase a launched player
  if(p.state==='airhit'&&p.y>0.5&&dist<2&&!p.spiked){
    if(b.cd.kick<=0&&rnd()<D.juggle*0.06)press(b,'a4');
    else if(!b.air()&&rnd()<D.juggle*0.1){press(b,'jump');A.airAtk=true;}
  }
  if(b.state==='jump'&&A.airAtk&&dist<1.5&&Math.abs(p.y-b.y)<1.3){press(b,rnd()<0.3&&p.state==='airhit'?'slam':'melee');A.airAtk=false;}
  if(b.state==='jump'&&b.jumps<2&&A.dj&&b.vy<0.03){press(b,'jump');A.dj=false;}
  if(A.plan>0){A.plan--;hold(A.dir);if(A.dir===tw&&dist<1.0)A.plan=0;if(A.plan>0)return;}
  if(--A.think>0)return;
  A.think=D.think+(rnd()*10|0);
  if(!['idle','walkf','walkb','guard','jump'].includes(b.state))return;
  const r=rnd();
  if(p.air()&&p.state==='jump'&&dist<2.3&&r<0.4*D.aggr){if(b.cd.kick<=0&&p.y>0.8)press(b,'a4');else{press(b,'jump');A.airAtk=true;}return;}
  if(dist>4){
    if(r<0.35&&b.knives>0)press(b,'a1');
    else if(r<0.45&&b.cd.dash<=0&&dist<5.5)press(b,'a2');
    else if(r<0.55){press(b,'jump');A.dj=rnd()<0.5;A.plan=14;A.dir=tw;A.airAtk=true;}
    else{A.plan=18+(rnd()*20|0);A.dir=tw;}
  }else if(dist>1.6){
    if(r<0.18*D.aggr){press(b,'jump');A.plan=10;A.dir=tw;A.airAtk=true;A.dj=rnd()<0.3;}
    else if(r<0.3&&b.cd.dash<=0)press(b,'a2');
    else if(r<0.4&&b.knives>0)press(b,'a1');
    else if(r<0.5&&dist<2.3&&b.cd.shotgun<=0)press(b,'a3');
    else if(r<0.58&&b.cd.dodge<=0){hold(tw);press(b,'dodge');}
    else{A.plan=10+(rnd()*10|0);A.dir=tw;}
  }else{
    if(rnd()<D.block*0.45){A.blockT=20+(rnd()*30|0);return;} // up close: sometimes just hold back and wait (guarding ahead of time)
    if(r<0.34*D.aggr)press(b,'melee');
    else if(r<0.48){press(b,'melee');A.holdQ=20+(rnd()*45|0);}
    else if(r<0.6&&b.cd.shotgun<=0)press(b,'a3');
    else if(r<0.64&&b.knives>=2)press(b,'a1');
    else if(r<0.66&&b.cd.kick<=0)press(b,'a4');
    else if(r<0.76&&b.cd.dodge<=0){hold(-tw);press(b,'dodge');}
    else if(r<0.84&&b.cd.parry<=0)press(b,'parry');
    else{A.plan=16;A.dir=-tw;}
  }
}
