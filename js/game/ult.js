'use strict';
/* =============== ULTIMATES =============== */
// R spends a full ULT meter. The meter fills from landing hits (+6) and taking them (+3).
const ULT_COST=100;
const ULTS={rift:{name:'PHANTOM RUSH'}}; // fighters without an entry show ULT as "SOON"

/* ---- Rift: PHANTOM RUSH ----
   Lunge grab (unblockable, dodgeable). On a hit: punch them up, blink to the other side, punch again,
   rising in a zig-zag (N hits), then blink above them and slam them into the floor. */
// N hits, L frames each; HIT_FREEZE / SLAM_FREEZE = impact freeze frames; SWAY = how far each punch knocks them sideways (zig-zag is 2x SWAY wide)
const RU={N:5,L:13,DMG:28,SLAM:70,HIT_FREEZE:10,SLAM_FREEZE:20,RISE:0.72,SWAY:2.25};
MOVES.rult={base:'stance',startup:10,active:14,recovery:24,vx:0.34,dmg:1,reach:[0,0.75],y:[0,2.0],grab:1,shake:0.15,
  react:(a,d)=>riftUltStart(a,d)};

function tryUlt(f){
  if(!(f.buf.ult>0))return false;f.buf.ult=0;
  if(!ULTS[f.char]||f.tension<ULT_COST)return false;
  f.tension=0;if(f.char==='rift')startMove(f,'rult');else lashFire(f,f===p1?p2:p1);
  cutin(f);G.freeze=40;sfx.super();return true;}

function riftUltStart(a,d){
  a.state='rult';a.move=null;a.ut=0;a.ux0=clamp(d.x,-STAGE+RU.SWAY+0.9,STAGE-RU.SWAY-0.9);a.uy0=Math.max(d.y,0.35);a.udir=a.facing;
  d.state='ultd';d.vx=d.vy=0;d.x=a.ux0;d.y=a.uy0;a.pass=d.pass=true;}

// where the victim is before hit i (i=0 is where they were grabbed); odd hits push one way, even the other
function ruPoint(f,i){return {x:f.ux0+(i===0?0:(i%2?1:-1)*f.udir*RU.SWAY),y:f.uy0+RU.RISE*i};}

function ultHit(a,d,dmg,px,py,big){
  d.hp=Math.max(G.training?1:0,d.hp-dmg);d.comboTaken=(d.comboTaken||0)+1;d.comboDmg=(d.comboDmg||0)+dmg;a.combo=d.comboTaken;
  showCombo(a,d.comboTaken,d.comboDmg);d.lastHitT=G.time;
  spark(px,py,big?0xffb347:0xc9a0ff,big?22:12,big?0.18:0.12);(big?sfx.heavy:sfx.hit)();
  G.hitstop=Math.max(G.hitstop,big?RU.SLAM_FREEZE:RU.HIT_FREEZE);G.shake=Math.max(G.shake,big?0.3:0.14);flash(big?0.3:0.1); // impact freeze on every hit
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
    if(k2===8){o.state='airhit';o.slammed=true;o.spiked=false;o.soft=false;o.vy=-0.6;o.pass=false;ultHit(f,o,RU.SLAM,o.x,o.y+0.8,true);}
  }
}
function ruEnd(f,o){f.uFollow=1;f.state='jump';f.vy=-0.05;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.state='airhit';o.vy=-0.3;}o.pass=false;}

// which sprite frame Rift shows during the cinematic
function riftUltFrame(f){const t=Math.max(0,(f.ut||1)-1);
  if(t<RU.N*RU.L){const k=t%RU.L;return k<3?['rift_air',1]:k<=7?['rift_air',2]:['rift_air',3];}
  return (t-RU.N*RU.L)<8?['rift_slam',1]:['rift_slam',2];}

/* ---- The Lash: HOOK, LINE & SINKER ----
   Grapple shot (long range, unblockable, dodgeable). On a hit:
   1. zip in along the rope and punch them high into the air
   2. hook them again and drag them back down to him, punch them up again
   3. ride the rope up with them, get above them
   4. body slam: drop together and crush them into the floor */
const LU={HOOK:10,P1:45,P2:45,SLAM:90,FIN:40,UP1:4.2,UP2:5.0,SPEED:1.4,WIND:9};
ULTS.jacob={name:'HOOK, LINE & SINKER'};

// R as The Lash: turn toward the aim point (mouse, or the opponent for the CPU) and fire the grapple.
// The hook flies until it hits the opponent or leaves the arena: no range limit. Unblockable; a dodge passes through it.
function lashFire(f,o){
  const aimed=f.uAimT!==undefined&&G.time-f.uAimT<30&&isFinite(f.uAX)&&isFinite(f.uAY)&&Math.hypot(f.uAX-f.x,f.uAY-f.y-1.25)>0.4;
  let ax=aimed?f.uAX:o.x,ay=aimed?f.uAY:o.y+1;
  f.facing=Math.sign(ax-f.x)||f.facing;
  const sx=f.x+f.facing*0.45,sy=f.y+1.25,L=Math.hypot(ax-sx,ay-sy)||1;
  f.state='jfire';f.ht=0;f.hback=0;f.hdx=(ax-sx)/L;f.hdy=(ay-sy)/L;f.hTipX=sx;f.hTipY=sy;f.vx=0;f.atkId++;}
function lashFireTick(f,o){
  f.ht++;f.vx*=0.6;f.vy=0; // hangs in the air until the hook connects or comes back
  const sx=f.x+f.facing*0.45,sy=f.y+1.25;
  if(f.ht<=LU.WIND){f.hTipX=sx;f.hTipY=sy;return;}               // wind-up
  if(f.hback){                                                     // missed: reel the hook back in
    f.hTipX+=(sx-f.hTipX)*0.35;f.hTipY+=(sy-f.hTipY)*0.35;
    if(Math.hypot(f.hTipX-sx,f.hTipY-sy)<0.3||f.ht>LU.WIND+120){f.state=f.air()?'jump':'idle';f.hTipX=undefined;}
    return;}
  if(f.ht===LU.WIND+1)sfx.whoosh();
  for(let i=0;i<4;i++){                                            // fly (sub-steps so it can't skip past them)
    f.hTipX+=f.hdx*LU.SPEED/4;f.hTipY+=f.hdy*LU.SPEED/4;
    if(o.invuln<=0&&o.state!=='ko'&&Math.abs(f.hTipX-o.x)<0.45&&f.hTipY>=o.y-0.1&&f.hTipY<=o.y+1.9){
      f.facing=Math.sign(o.x-f.x)||f.facing;f.hTipX=undefined;lashUltStart(f,o);return;}
    if(!(Math.abs(f.hTipX)<=STAGE+4&&f.hTipY<=16&&f.hTipY>=0)||f.ht>LU.WIND+80){ // off the stage (or flying too long): reel back
     f.hback=1;sfx.block();return;}
  }}

function lashUltStart(a,d){d.uPose='';a.u2=0;a.ucOn=0;
  a.facing=Math.sign(d.x-a.x)||a.facing;a.state='jult';a.move=null;a.ut=0;a.udir=a.facing;a.ux0=a.x;a.uy0=a.y;a.uRope=1;
  d.state='ultd';d.vx=d.vy=0;a.pass=d.pass=true;ultHit(a,d,LU.HOOK,d.x,d.y+1.1,false);}

function lashUltTick(f,o){
  f.ut++;f.uFollow=0;f.vx=f.vy=0;o.vx=o.vy=0;f.pass=o.pass=true;
  if(o.state!=='ultd'&&!(f.u2>LF.SWAP)){luEnd(f,o);return;} // KO'd mid-combo (after the swap they land on their own)
  const t=f.ut,d=f.udir,ease=p=>1-Math.pow(1-clamp(p,0,1),2),cx=x=>clamp(x,-STAGE,STAGE);
  f.facing=d;o.facing=-d;
  if(t<=14){ // 1. zip in along the rope
    if(t===1)sfx.whoosh();f.uRope=1;const p=ease(t/14);
    f.x=cx(f.ux0+(o.x-d*0.85-f.ux0)*p);f.y=f.uy0+(o.y-f.uy0)*p;
  }else if(t<=42){ // ...and punch them high
    f.uRope=0;if(t===15){ultHit(f,o,LU.P1,o.x,o.y+1.1,true);f.lx=o.x;f.ly=o.y;}
    const p=ease((t-15)/25);o.y=f.ly+LU.UP1*p;o.x=cx(f.lx+d*0.6*p);f.y=Math.max(0,f.y-0.15);
  }else if(t<=62){ // 2. hook them again and drag them back down to him
    f.uRope=1;f.y=Math.max(0,f.y-0.15);if(t===43){sfx.whoosh();f.lx=o.x;f.ly=o.y;}
    const p=ease((t-43)/19);o.x=cx(f.lx+(f.x+d*0.85-f.lx)*p);o.y=f.ly+(Math.max(0.2,f.y+0.2)-f.ly)*p;
  }else if(t<=96){ // ...punch them up again, then 3. ride the rope up with them and get above
    if(t===63){f.uRope=0;ultHit(f,o,LU.P2,o.x,o.y+1.1,true);f.lx=o.x;f.ly=o.y;f.sx=f.x;f.sy=f.y;}
    const p=ease((t-63)/30);o.y=f.ly+LU.UP2*p;o.x=cx(f.lx+d*0.4*p);
    if(t===68)sfx.whoosh();
    if(t>=68){f.uRope=1;const q=ease((t-68)/26);f.x=cx(f.sx+(o.x-f.sx)*q);f.y=f.sy+(o.y+1.3-f.sy)*q;}
  }else if(!f.u2){ // 4. body slam: fall together and crush them into the floor
    f.uRope=0;o.y=Math.max(0,o.y-(0.15+(t-97)*0.035));f.x=o.x;f.y=o.y+1.0;
    if(o.y<=0.05){o.y=0;o.uPose='down';ultHit(f,o,LU.SLAM,o.x,0.4,true);dust(o.x,24);f.u2=1;f.bx=f.x;}
  }else lashFinisher(f,o);
}

/* 5. finisher: they stagger up dizzy, he flexes, winds up and punches them off the screen,
   6. then the fight is knocked into the next arena: they fly in, he swings in on his grapple */
const LF={BOUNCE:24,UP:50,FLEX:60,WIND:118,PUNCH:150,WIPE:176,SWAP:190,SWING:200,SWING_LEN:38};
function lashFinisher(f,o){
  const u=++f.u2,d=f.udir;
  if(u<=LF.BOUNCE){const p=u/LF.BOUNCE;f.x=clamp(f.bx-d*1.4*p,-STAGE,STAGE);f.y=Math.max(0,(1-p)*1.0+Math.sin(p*Math.PI)*1.1);if(u===LF.BOUNCE)dust(f.x,6);}
  if(u===LF.UP){o.uPose='stun';stars(o);}
  if(u>LF.UP&&u<LF.PUNCH&&u%22===0)stars(o);
  if(u===LF.FLEX){callout(f,'FLEX!','#ffcc33');sfx.super();}
  if(u>LF.WIND&&u<LF.PUNCH&&u%3===0){spark(f.x-d*0.35,f.y+1.35,0xffb347,3,0.06,0.06);G.shake=Math.max(G.shake,0.02+(u-LF.WIND)*0.002);}
  if(u===LF.PUNCH){ultHit(f,o,LU.FIN,o.x-d*0.2,o.y+1.1,true);o.uPose='fly';o.uvx=d*0.75;o.uvy=0.1;flash(0.35);}
  if(u>LF.PUNCH&&u<LF.SWAP){o.x+=o.uvx;o.y=Math.max(0.3,o.y+o.uvy);o.uvy-=0.002;} // flies off the screen
  // camera: stay on The Lash while they fly away, then frame the landing spot in the new arena
  f.ucOn=1;f.ucx=u<LF.SWAP?clamp(f.x+d*2,-5,5):-d*0.5;f.ucy=u<LF.SWAP?1.5:1.6;
  if(u===LF.WIPE)arenaWipe();
  if(u===LF.SWAP){ // screen is covered: move to the next arena and set up the entrances
    setArena(arenaIdx+1);splash('<b>'+ARENAS[arenaIdx].name+'</b>',1.4);
    f.lx=-d*2.5;o.vlx=d*1.5;                       // where each of them lands
    o.x=-d*(STAGE+3);o.y=3.5;o.uvx=(o.vlx-o.x)/30;o.uvy=(0.5*GRAV*900-3.5)/30;  // lands at vlx after ~30 frames
    f.sAX=f.lx-d*7*Math.sin(0.25);f.sAY=7.5;f.x=f.sAX+d*7*Math.sin(-1.25);f.y=f.sAY-7*Math.cos(-1.25);f.uRope=0;}
  if(u>LF.SWAP&&o.state==='ultd'){ // they fly in from the edge and crash down
    o.x+=o.uvx;o.uvy-=GRAV;o.y+=o.uvy;
    if(o.y<=0){o.y=0.02;o.x=o.vlx;o.uPose='';o.state='airhit';o.slammed=true;o.spiked=false;o.soft=false;o.vy=-0.3;o.vx=d*0.05;o.pass=false;}}
  if(u>=LF.SWING&&u<LF.SWING+LF.SWING_LEN){ // he swings in on the grapple
    const p=(u-LF.SWING)/LF.SWING_LEN,th=-1.25+1.5*p;f.uRope=2;f.x=f.sAX+d*7*Math.sin(th);f.y=Math.max(0,f.sAY-7*Math.cos(th));if(u===LF.SWING)sfx.whoosh();}
  if(u>=LF.SWING+LF.SWING_LEN){f.uRope=0;f.u2=0;f.ucOn=0;f.state='jump';f.vy=0.05;f.vx=d*0.04;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;f.uFollow=1;}
}
function luEnd(f,o){f.uFollow=1;f.uRope=0;f.u2=0;f.ucOn=0;f.state='jump';f.vy=0.18;f.vx=-f.udir*0.04;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.state='airhit';o.vy=-0.3;}o.pass=false;}

// which sprite frame The Lash shows during the cinematic
function lashUltFrame(f){const t=f.ut||0,u=f.u2||0;
  if(u)return u<LF.BOUNCE?['jacob_jump',3]:u<LF.BOUNCE+8?['jacob_jump',0]:u<LF.FLEX?[('jacob_idle'),Math.floor(u/7)%SPR.jacob_idle.length]
    :u<LF.WIND?['jacob_win',2]:u<LF.PUNCH?['jacob_heavy',1]:u<LF.PUNCH+26?['jacob_heavy',3]:u<LF.SWAP?['jacob_heavy',4]:u<LF.SWING+LF.SWING_LEN?['jacob_jump',2]:['jacob_jump',3];
  return t<=14?['jacob_heavy',2]:t<=26?['jacob_heavy',3]:t<=42?['jacob_heavy',4]:t<=62?['jacob_heavy',1]:t<=72?['jacob_heavy',3]:t<=96?['jacob_jump',2]:['jacob_jump',3];}
