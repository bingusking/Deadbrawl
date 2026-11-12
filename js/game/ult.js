'use strict';
/* =============== ULTIMATES =============== */
// R spends a full ULT meter. The meter fills from landing hits (+6) and taking them (+3).
const ULT_COST=100;
const ULTS={rift:{name:'PHANTOM RUSH'}}; // fighters without an entry show ULT as "SOON"

/* ---- Rift: PHANTOM RUSH ----
   Lunge grab (unblockable, dodgeable). On a hit: punch them up, blink to the other side, punch again,
   rising in a zig-zag (N hits), then blink above them and slam them into the floor. */
const RU={N:5,L:13,DMG:28,SLAM:70,RISE:0.72,SWAY:0.8};
MOVES.rult={base:'stance',startup:10,active:14,recovery:24,vx:0.34,dmg:1,reach:[0,0.75],y:[0,2.0],grab:1,shake:0.15,
  react:(a,d)=>riftUltStart(a,d)};

function tryUlt(f){
  if(!(f.buf.ult>0))return false;f.buf.ult=0;
  if(!ULTS[f.char]||f.tension<ULT_COST)return false;
  f.tension=0;startMove(f,'rult');
  cutin(f);G.freeze=40;sfx.super();return true;}

function riftUltStart(a,d){
  a.state='rult';a.move=null;a.ut=0;a.ux0=clamp(d.x,-STAGE+1.3,STAGE-1.3);a.uy0=Math.max(d.y,0.35);a.udir=a.facing;
  d.state='ultd';d.vx=d.vy=0;d.x=a.ux0;d.y=a.uy0;a.pass=d.pass=true;}

// where the victim is before hit i (i=0 is where they were grabbed); odd hits push one way, even the other
function ruPoint(f,i){return {x:f.ux0+(i===0?0:(i%2?1:-1)*f.udir*RU.SWAY),y:f.uy0+RU.RISE*i};}

function ultHit(a,d,dmg,px,py,big){
  d.hp=Math.max(G.training?1:0,d.hp-dmg);d.comboTaken=(d.comboTaken||0)+1;d.comboDmg=(d.comboDmg||0)+dmg;a.combo=d.comboTaken;
  showCombo(a,d.comboTaken,d.comboDmg);d.lastHitT=G.time;
  spark(px,py,big?0xffb347:0xc9a0ff,big?22:12,big?0.18:0.12);(big?sfx.heavy:sfx.hit)();
  G.hitstop=Math.max(G.hitstop,big?12:4);G.shake=Math.max(G.shake,big?0.28:0.08);
  if(d.hp<=0)KO(a,d);}

function blinkTo(f,x,y){afterimage(f);spark(f.x,f.y+1,0x8a3cff,8,0.1,0.1);f.x=x;f.y=y;spark(x,y+1,0x8a3cff,10,0.12,0.1);sfx.whoosh();}

function riftUltTick(f,o){
  f.ut++;f.uFollow=0;f.vx=f.vy=0;o.vx=o.vy=0;f.pass=o.pass=true;
  if(o.state!=='ultd'){ruEnd(f,o);return;} // KO'd mid-combo, or the slam has landed
  const t=f.ut-1,step=Math.floor(t/RU.L),k=t%RU.L;
  if(step<RU.N){
    const A=ruPoint(f,step),B=ruPoint(f,step+1),dir=Math.sign(B.x-A.x)||f.udir;
    if(k===0){f.facing=dir;o.facing=-dir;blinkTo(f,clamp(A.x-dir*0.75,-STAGE,STAGE),Math.max(0,A.y-0.3));}
    if(k<=3){o.x=A.x;o.y=A.y;}
    if(k===3)ultHit(f,o,RU.DMG,o.x,o.y+1.1,false);
    if(k>3){const p=1-Math.pow(1-(k-3)/(RU.L-4),2);o.x=A.x+(B.x-A.x)*p;o.y=A.y+(B.y-A.y)*p;}
  }else{
    const k2=t-RU.N*RU.L,P=ruPoint(f,RU.N);
    if(k2===0){f.facing=f.udir;blinkTo(f,clamp(P.x-f.udir*0.25,-STAGE,STAGE),P.y+0.95);}
    if(k2<8){o.x=P.x;o.y=P.y;}
    if(k2===8){o.state='airhit';o.slammed=true;o.spiked=false;o.soft=false;o.vy=-0.6;o.pass=false;flash(0.25);ultHit(f,o,RU.SLAM,o.x,o.y+0.8,true);}
  }
}
function ruEnd(f,o){f.uFollow=1;f.state='jump';f.vy=-0.05;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.state='airhit';o.vy=-0.3;}o.pass=false;}

// which sprite frame Rift shows during the cinematic
function riftUltFrame(f){const t=Math.max(0,(f.ut||1)-1);
  if(t<RU.N*RU.L){const k=t%RU.L;return k<3?['rift_air',1]:k<=7?['rift_air',2]:['rift_air',3];}
  return (t-RU.N*RU.L)<8?['rift_slam',1]:['rift_slam',2];}
