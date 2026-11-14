'use strict';
/* =============== ULTIMATES =============== */
// R spends a full ULT meter. The meter fills from landing hits (+6) and taking them (+3).
const ULT_COST=100;
const ULTS={rift:{name:'PHANTOM RUSH'}}; // fighters without an entry show ULT as "SOON"

/* ---- Rift: PHANTOM RUSH ----
   Lunge grab (unblockable, dodgeable). On a hit: punch them up, blink to the other side, punch again,
   rising in a zig-zag (N hits), then blink above them and slam them into the floor. */
// N hits, L frames each; HIT_FREEZE / SLAM_FREEZE = impact freeze frames; SWAY = how far each punch knocks them sideways (zig-zag is 2x SWAY wide)
const RU={N:5,L:13,DMG:28,SLAM:70,KICK:30,HIT_FREEZE:10,SLAM_FREEZE:20,RISE:0.72,SWAY:2.25};
MOVES.rult={base:'stance',aim:1,startup:10,active:14,recovery:24,vx:0.34,dmg:1,reach:[0,0.75],y:[0,2.0],grab:1,shake:0.15,
  react:(a,d)=>riftUltStart(a,d)};

function tryUlt(f){
  if(!(f.buf.ult>0))return false;f.buf.ult=0;
  if(!ULTS[f.char]||f.tension<ULT_COST)return false;
  f.tension=0;if(f.char==='rift')startMove(f,'rult');else if(f.char==='vish')startMove(f,'vult');else lashFire(f,f===p1?p2:p1);
  cutin(f);G.freeze=40;sfx.super();return true;}

function riftUltStart(a,d){
  a.u2=0;a.ucOn=0;d.uPose='';
  a.state='rult';a.move=null;a.ut=0;a.ux0=clamp(d.x,BL+RU.SWAY+0.9,BR-RU.SWAY-0.9);a.uy0=Math.max(d.y,0.35);a.udir=a.facing;
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
  if(o.state!=='ultd'&&!(f.u2>=RF.KICK+KN.N)){ruEnd(f,o);return;} // KO'd mid-combo (once in the new arena they land on their own)
  if(f.u2){riftFinisher(f,o);return;}
  const t=f.ut-1,step=Math.floor(t/RU.L),k=t%RU.L;
  if(step<RU.N){
    const A=ruPoint(f,step),B=ruPoint(f,step+1),dir=Math.sign(B.x-A.x)||f.udir;
    if(k===0){f.facing=dir;o.facing=-dir;blinkTo(f,clamp(A.x-dir*0.75,BL,BR),Math.max(0,A.y-0.3));}
    if(k<=3){o.x=A.x;o.y=A.y;}
    if(k===3)ultHit(f,o,RU.DMG,o.x,o.y+1.1,false);
    if(k>3){const p=1-Math.pow(1-(k-3)/(RU.L-4),2);o.x=A.x+(B.x-A.x)*p;o.y=A.y+(B.y-A.y)*p;}
  }else{
    const k2=t-RU.N*RU.L,P=ruPoint(f,RU.N);
    if(k2===0){f.facing=f.udir;blinkTo(f,clamp(P.x-f.udir*0.25,BL,BR),P.y+0.95);}
    if(k2<8){o.x=P.x;o.y=P.y;}
    if(k2===8){ultHit(f,o,RU.SLAM,o.x,o.y+0.8,true);f.u2=1;f.uy1=o.y;o.uPose='fly';}
  }
}
function ruEnd(f,o){f.uFollow=1;f.u2=0;f.ucOn=0;f.hide=0;f.state='jump';f.vy=-0.05;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.state='airhit';o.vy=-0.3;}o.pass=false;}

// which sprite frame Rift shows during the cinematic
function riftUltFrame(f){const t=Math.max(0,(f.ut||1)-1),u=f.u2||0;
  if(u)return u<=RF.FALL?['rift_slam',2]:u<RF.KICK?['rift_heavy',0]:u<RF.KICK+22?['rift_throwf',0]:u<RF.ENTER?['rift_idle',0]:['rift_bin',u<RF.ENTER+5?0:1];
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
    if(!(f.hTipX>=BL-4&&f.hTipX<=BR+4&&f.hTipY<=16&&f.hTipY>=0)||f.ht>LU.WIND+80){ // off the stage (or flying too long): reel back
     f.hback=1;sfx.block();return;}
  }}

function lashUltStart(a,d){d.uPose='';a.u2=0;a.ucOn=0;
  a.facing=Math.sign(d.x-a.x)||a.facing;a.state='jult';a.move=null;a.ut=0;a.udir=a.facing;a.ux0=a.x;a.uy0=a.y;a.uRope=1;
  d.state='ultd';d.vx=d.vy=0;a.pass=d.pass=true;ultHit(a,d,LU.HOOK,d.x,d.y+1.1,false);}

function lashUltTick(f,o){
  f.ut++;f.uFollow=0;f.vx=f.vy=0;o.vx=o.vy=0;f.pass=o.pass=true;
  if(o.state!=='ultd'&&!(f.u2>=LF.SWAP)){luEnd(f,o);return;} // KO'd mid-combo (after the swap they land on their own)
  const t=f.ut,d=f.udir,ease=p=>1-Math.pow(1-clamp(p,0,1),2),cx=x=>clamp(x,BL,BR);
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

/* ---- shared: knocked off the screen into the next arena ----
   r = frames since the knock-off hit, d = direction they were sent. The next arena is placed ARENA_GAP away
   (arenaPlace), they fly across in an arc while the camera follows YOUR fighter, and when they crash down
   the whole world shifts back so the new arena sits at the centre (worldShift + arenaRecenter): no cut. */
const KN={N:66,H:3.6,LAND_X:1.5};
const SHIFT_KEYS=['x','bX','vlx','ux0','lx0','sAX'];
function worldShift(dx){ // host: move everything by dx (fighters, stored targets, projectiles)
  for(const g of[p1,p2])for(const k of SHIFT_KEYS)if(typeof g[k]==='number')g[k]+=dx;
  for(const q of projectiles){q.x+=dx;q.mesh.position.x+=dx;}}
function arenaKnock(f,o,r,d){
  f.ucOn=1; // camera: follow the local player's fighter (game.js updCam)
  if(r===1){f.bX=d*ARENA_GAP;arenaPlace(arenaIdx+1+Math.floor(rnd()*(ARENAS.length-1)),f.bX); // a random other arena
   o.ux0=o.x;o.uy0=o.y;o.vlx=f.bX+d*KN.LAND_X;o.uPose='fly';}
  if(r>=1&&r<KN.N&&o.state==='ultd'){const p=r/KN.N,e=p*0.55+0.45*(1-(1-p)*(1-p));
    o.x=o.ux0+(o.vlx-o.ux0)*e;o.y=Math.max(0,o.uy0*(1-p)+KN.H*4*p*(1-p));
    if(r%3===0)spark(o.x-d*0.6,o.y+1,0xfff0d0,2,0.03,0.04);}
  if(r===KN.N&&o.state==='ultd'){ // crash down in the new arena, then recentre the world on it
    o.x=o.vlx;o.y=0.02;o.uPose='';o.state='airhit';o.slammed=true;o.spiked=false;o.soft=false;o.vy=-0.3;o.vx=d*0.05;o.pass=false;
    dust(o.x,20);G.shake=Math.max(G.shake,0.3);flash(0.2);
    const X=f.bX;worldShift(-X);arenaRecenter(X);splash('<b>'+ARENAS[arenaIdx].name+'</b>',1.4);}
}

/* Rift finisher: the slam drives them into the floor, they bounce, he blinks beside them and kicks them
   across into the next arena, dissolving into a phantom that streaks after them, then re-forms beside them */
const RF={FALL:10,BLINK:12,KICK:28,OUT:8,IN:12};RF.ENTER=RF.KICK+KN.N+RF.IN;RF.END=RF.ENTER+10;
function riftFinisher(f,o){
  const u=++f.u2,d=f.udir;
  if(u<=RF.FALL){const p=u/RF.FALL;o.y=f.uy1*(1-p*p);f.y=o.y+0.95;
    if(u===RF.FALL){o.y=0;dust(o.x,22);G.shake=Math.max(G.shake,0.3);o.uvy=0.135;f.y=o.y+0.95;}}
  else if(u<RF.KICK){o.uvy-=0.008;o.y=Math.max(0,o.y+o.uvy);} // ground bounce
  if(u===RF.BLINK){f.facing=d;o.facing=-d;blinkTo(f,clamp(o.x-d*0.95,BL,BR),0);}
  if(u>RF.BLINK&&u<RF.KICK&&u%4===0)spark(f.x+d*0.3,f.y+0.5,0x8a3cff,3,0.05,0.05);
  if(u===RF.KICK){ultHit(f,o,RU.KICK,o.x-d*0.2,o.y+0.9,true);flash(0.35);}
  if(u<RF.KICK)return;
  const r=u-RF.KICK;arenaKnock(f,o,r,d);
  if(r===RF.OUT){afterimage(f);spark(f.x,f.y+1,0x8a3cff,14,0.12,0.1);sfx.whoosh();f.hide=1;}
  if(f.hide&&r>RF.OUT){ // phantom: a purple streak riding just behind them
    const tx=r<KN.N?o.x-d*2.2:f.bX-d*2.6,ty=r<KN.N?o.y+0.4:1.2;f.x+=(tx-f.x)*0.35;f.y+=(ty-f.y)*0.35;
    if(r%2===0)spark(f.x,f.y+1,0x8a3cff,3,0.06,0.05);}
  if(u===RF.ENTER){f.hide=0;f.facing=d;blinkTo(f,f.bX-d*2.6,1.2);}
  if(u>=RF.END){f.u2=0;f.ucOn=0;f.hide=0;f.state='jump';f.vy=0;f.vx=0;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;f.uFollow=1;}
}

/* 5. finisher: they stagger up dizzy, he flexes, winds up and punches them off the screen,
   6. then the fight is knocked into the next arena: they fly in, he swings in on his grapple */
const LF={BOUNCE:24,UP:50,FLEX:60,WIND:118,PUNCH:150,CHASE:12,LAND:18};LF.SWAP=LF.PUNCH+KN.N;LF.END=LF.SWAP+LF.LAND;
function lashFinisher(f,o){
  const u=++f.u2,d=f.udir;
  if(u<=LF.BOUNCE){const p=u/LF.BOUNCE;f.x=clamp(f.bx-d*1.4*p,BL,BR);f.y=Math.max(0,(1-p)*1.0+Math.sin(p*Math.PI)*1.1);if(u===LF.BOUNCE)dust(f.x,6);}
  if(u===LF.UP){o.uPose='stun';stars(o);}
  if(u>LF.UP&&u<LF.PUNCH&&u%22===0)stars(o);
  if(u===LF.FLEX){callout(f,'FLEX!','#ffcc33');sfx.super();}
  if(u>LF.WIND&&u<LF.PUNCH&&u%3===0){spark(f.x-d*0.35,f.y+1.35,0xffb347,3,0.06,0.06);G.shake=Math.max(G.shake,0.02+(u-LF.WIND)*0.002);}
  if(u===LF.PUNCH){ultHit(f,o,LU.FIN,o.x-d*0.2,o.y+1.1,true);o.uPose='fly';o.uvx=d*0.75;o.uvy=0.1;flash(0.35);}
  if(u<LF.PUNCH)return;
  const r=u-LF.PUNCH;arenaKnock(f,o,r,d);
  if(r>=LF.CHASE&&r<KN.N+LF.LAND){ // grapple onto them and get dragged after them, landing behind them
    if(r===LF.CHASE){f.lx0=f.x;f.ly0=f.y;sfx.whoosh();}
    const p=(r-LF.CHASE)/(KN.N+LF.LAND-LF.CHASE),e=p*0.6+0.4*(1-(1-p)*(1-p)),tx=f.bX-d*2.5;
    f.x=f.lx0+(tx-f.lx0)*e;f.y=Math.max(0,f.ly0*(1-p)+4.6*4*p*(1-p));f.uRope=r<KN.N?1:0;f.facing=d;}
  if(r>=KN.N+LF.LAND){f.uRope=0;f.u2=0;f.ucOn=0;f.state='jump';f.vy=0;f.vx=d*0.02;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;f.uFollow=1;dust(f.x,8);}
}
function luEnd(f,o){f.uFollow=1;f.uRope=0;f.u2=0;f.ucOn=0;f.state='jump';f.vy=0.18;f.vx=-f.udir*0.04;f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.state='airhit';o.vy=-0.3;}o.pass=false;}

// which sprite frame The Lash shows during the cinematic
function lashUltFrame(f){const t=f.ut||0,u=f.u2||0;
  if(u)return u<LF.BOUNCE?['jacob_jump',3]:u<LF.BOUNCE+8?['jacob_jump',0]:u<LF.FLEX?[('jacob_idle'),Math.floor(u/7)%SPR.jacob_idle.length]
    :u<LF.WIND?['jacob_win',2]:u<LF.PUNCH?['jacob_heavy',1]:u<LF.PUNCH+LF.CHASE?['jacob_heavy',3]:u<LF.END-6?['jacob_jump',2]:['jacob_jump',3];
  return t<=14?['jacob_heavy',2]:t<=26?['jacob_heavy',3]:t<=42?['jacob_heavy',4]:t<=62?['jacob_heavy',1]:t<=72?['jacob_heavy',3]:t<=96?['jacob_jump',2]:['jacob_jump',3];}

/* ---- Vish: LAST ROUND ----
   Close-range grab (unblockable, dodgeable). On a hit you pick a direction:
     A / D  rushdown : point-blank blast, knife, dash through them, blast back the other way (x3), final blast toward the side you picked
     S      pound    : slam them down, seven blasts into the floor (impact frame on each), lift them, blast them away
     W      juggle   : toss them up, slide-blast one way, slide back under them, blast them back up, keep sliding, blast again, final blast as they drop
   Every route ends by blasting them into the next arena, and Vish dashes in after them. */
ULTS.vish={name:'LAST ROUND'};
const VU={PICK:75,SHOT:35,KNIFE:20,FIN:60,SLAM:20,POUND:22,AIR:40,AIRFIN:70,C:30};
MOVES.vult={base:'stance',startup:8,active:7,recovery:22,vx:0.2,dmg:1,reach:[0,1.3],y:[0,2.0],grab:1,shake:0.15,react:(a,d)=>vishUltStart(a,d)};
// the W/A/S/D prompt, shown only to the player who landed the grab
function vultPrompt(){} // (the prompt follows the fighter's state: see vultPromptUpd, called from the HUD update)
function vultPromptUpd(){const el=$('#vpick'),me=G.me||p1,on=G.mode==='fight'&&me.state==='vult'&&me.um==='pick';if(!el||el.classList.contains('on')===on)return;
  if(on)el.querySelectorAll('i').forEach(i=>i.textContent=keyName(bindOf(i.dataset.a)));el.classList.toggle('on',on);}
// impact frame: the whole picture snaps to stark black and white for an instant (inv = negative)
function impactFrame(inv){const c=$('#c');c.classList.remove('impact','impact2');void c.offsetWidth;c.classList.add(inv?'impact2':'impact');
  clearTimeout(impactFrame.t);impactFrame.t=setTimeout(()=>c.classList.remove('impact','impact2'),110);}
function vishUltStart(a,d){
  a.state='vult';a.move=null;a.um='pick';a.ut=0;a.u2=0;a.ucOn=0;a.uSh=0;a.uSl=0;a.udir=a.facing;a.vx=a.vy=0;a.y=0;
  d.state='ultd';d.uPose='';d.vx=d.vy=0;d.x=clamp(a.x+a.facing*0.75,BL,BR);d.y=0.25;a.pass=d.pass=true;
  for(const k of['kU','kD','kL','kR'])a.buf[k]=0;vultPrompt(a.idx,1);}
function vuEnd(f,o){vultPrompt(f.idx,0);f.um='';f.u2=0;f.ucOn=0;f.uSl=0;f.uSh=0;f.uFollow=1;f.state=f.y>0?'jump':'idle';f.jumps=1;f.flip=0;f.pass=false;f.ut=0;
  if(o.state==='ultd'){o.uPose='';o.state='airhit';o.vy=-0.3;}o.pass=false;}
// fire the shotgun from where he is toward (tx,ty), hitting the victim
function vuShot(f,o,dmg,big,tx,ty){
  const ox=f.x,oy=f.y+(f.uSl?0.75:1.2);let dx=tx-ox,dy=ty-oy;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  if(Math.abs(dx)>0.2)f.facing=Math.sign(dx);f.shotA=clamp(Math.atan2(dy,Math.abs(dx)),-1.25,1.25);f.uSh=9;
  shotFx(ox+dx*0.9,oy+dy*0.9,dx,dy);ultHit(f,o,dmg,o.x,o.y+1,big);}
function vuFinal(f,o,d){f.um='fin';f.u2=0;f.udir=d;f.facing=d;f.uSl=0;o.facing=-d;}
function vishUltTick(f,o){
  f.vx=f.vy=0;o.vx=o.vy=0;f.pass=o.pass=true;f.uFollow=0;if(f.uSh>0)f.uSh--;
  const ease=p=>1-Math.pow(1-clamp(p,0,1),2),lim=x=>clamp(x,BL+0.2,BR-0.2);
  if(f.um==='fin'){ // final blast into the next arena, then dash in after them
    const d=f.udir,u=++f.u2;
    if(u===1){vuShot(f,o,f.ufin||VU.FIN,true,o.x,o.y+1);flash(0.35);impactFrame(0);return;}
    if(o.state!=='ultd'&&u<=KN.N+1){vuEnd(f,o);return;}
    const r=u-1;arenaKnock(f,o,r,d);
    if(r>=10){if(r===10){f.lx0=f.x;sfx.whoosh();}
      const p=(r-10)/(KN.N+4);f.x=f.lx0+(f.bX-d*2.5-f.lx0)*(p*0.6+0.4*ease(p));f.y=0;f.facing=d;if(r%3===0)afterimage(f);if(r%4===0)dust(f.x-d*0.4,2);}
    if(r>=KN.N+14)vuEnd(f,o);
    return;}
  if(o.state!=='ultd'){vuEnd(f,o);return;}
  const t=f.ut++;
  if(f.um==='pick'){ // holding them by the collar, waiting for a direction
    o.x=f.x+f.udir*0.75;o.y=0.25;
    let c=f.buf.kU>0?'up':f.buf.kD>0?'down':f.buf.kL>0?'L':f.buf.kR>0?'R':null;
    if(!c&&f===p2&&!G.online&&t>18)c=['up','down','L','R'][rnd()*4|0]; // CPU picks at random
    if(!c&&t>=VU.PICK)c=f.udir>0?'R':'L';
    if(c&&t>=6){vultPrompt(f.idx,0);f.ut=0;f.um=c==='up'?'up':c==='down'?'down':'side';f.us=c==='L'?-1:c==='R'?1:f.udir;f.ux0=o.x;
      callout(f,c==='up'?'JUGGLE!':c==='down'?'POUND!':'RUSHDOWN!','#ffb347');}
    return;}
  if(f.um==='side'){ // blast, knife, dash through, blast back... three times, ending toward the side picked
    const C=VU.C,i=Math.floor(t/C),k=t%C,s=f.us,dir=i%2?-s:s;
    if(i>=3){vuFinal(f,o,s);return;}
    if(k===0){if(Math.sign(o.x-f.x)!==dir){afterimage(f);f.x=lim(o.x-dir*0.8);} // picked the far side: step through them first
      f.kA=o.x;f.kB=clamp(o.x+dir*4.2,BL+1.2,BR-1.2);vuShot(f,o,VU.SHOT,false,o.x,o.y+1);o.facing=-dir;}
    if(k>=1&&k<=12){const p=k/12;o.x=f.kA+(f.kB-f.kA)*ease(p);o.y=0.25+Math.sin(p*Math.PI)*0.7;}
    if(k===8){f.facing=dir;burstKnife(f,o,1);sfx.whoosh();}
    if(k===15)ultHit(f,o,VU.KNIFE,o.x,o.y+1.1,false);
    if(k===10)f.kF=f.x;
    if(k>=10&&k<=22){const dest=lim(f.kB+(i<2?dir:-dir)*0.9),p=(k-10)/12;f.x=f.kF+(dest-f.kF)*ease(p);f.facing=k<22?dir:Math.sign(o.x-f.x)||dir;if(k%3===0)afterimage(f);if(k===10)trail(f,true);}
    return;}
  if(f.um==='down'){ // slam, seven blasts into the floor, lift, blast away
    const d=f.udir;
    if(t<8){o.x=f.x+d*0.75;o.y=0.25+t/8*0.9;}
    if(t===8){o.y=0;o.uPose='down';ultHit(f,o,VU.SLAM,o.x,0.4,true);dust(o.x,20);f.x=lim(o.x-d*0.55);}
    const j=(t-18)/9;
    if(t>=18&&t<=72&&Number.isInteger(j)){f.facing=d;vuShot(f,o,VU.POUND,false,o.x+d*0.05,0.15);impactFrame(j%2);dust(o.x,10);G.shake=Math.max(G.shake,0.26);f.kB=0.16;}
    if(t>8&&t<82){f.kB=(f.kB||0)-0.03;o.y=Math.max(0,o.y+f.kB);}
    if(t>=82&&t<96){o.uPose='';const p=(t-82)/12;o.x=f.x+d*0.75;o.y=Math.min(0.5,p*0.5);}
    if(t>=100){f.ufin=VU.FIN;vuFinal(f,o,d);}
    return;}
  if(f.um==='up'){ // toss them up and juggle with slide blasts from both sides
    const s=f.udir,X=f.ux0,T=54;
    if(t===0)f.kF=f.x;
    const ph=t<T?t/T:(t-T)/T;o.x=X;o.y=0.4+(t<T?4.0:4.5)*4*ph*(1-ph);o.uPose=t>2?'fly':'';
    let vx=f.kF;f.uSl=0;
    if(t>=4&&t<22){vx=f.kF+(X+s*3.4-f.kF)*ease((t-4)/18);f.uSl=1;f.facing=s;}
    else if(t>=22&&t<26){vx=X+s*3.4;f.facing=-s;}
    else if(t>=26&&t<T){vx=X+s*3.4*(1-(t-26)/(T-26));f.uSl=1;f.facing=-s;}
    else if(t>=T&&t<80){vx=X-s*3.4*ease((t-T)/26);f.uSl=1;f.facing=-s;}
    else if(t>=80){vx=X-s*(3.4-2.3*ease((t-80)/18));f.facing=s;}
    if(t>=4)f.x=lim(vx);
    if(f.uSl&&t%3===0)dust(f.x,1);
    if(t===12||t===36||t===68)vuShot(f,o,VU.AIR,false,o.x,o.y+1);
    if(t===T){vuShot(f,o,VU.AIR,true,o.x,o.y+1);callout(f,'PULL!','#ffcc33');}
    if(t>=104){f.ufin=VU.AIRFIN;vuFinal(f,o,s);}
    return;}
}
// which sprite frame Vish shows during the cinematic
function vishUltFrame(f){const t=f.ut||0;
  if(f.uSh>0)return ['shotgun',f.uSh>4?2:3,'aim'];
  if(f.um==='fin')return (f.u2||0)<11?['shotgun',3]:['dash',2+Math.floor(f.u2/4)%3];
  if(f.uSl)return ['dash',5];
  if(f.um==='side'){const k=(t-1+VU.C)%VU.C;return k>=10&&k<=22?['dash',2+Math.floor(k/4)%3]:k>=7&&k<10?['knife',3]:['shotgun',1];}
  if(f.um==='down')return t<9||(t>82&&t<100)?['knife',3]:['shotgun',1];
  if(f.um==='up')return t<5?['knife',4]:['shotgun',1];
  return ['knife',3];}
