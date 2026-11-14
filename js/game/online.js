'use strict';
/* =============== ONLINE =============== */
const NET={ws:null,role:null,matched:false,locked:null};let PID=0;const GPR=new Map();
function netSend(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o));}
function netGame(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send('~'+JSON.stringify(o));}
function netClose(){if(NET.ws){netSend({t:'leave'});const w=NET.ws;NET.ws=null;try{w.close();}catch(e){}}NET.matched=false;NET.locked=null;G.online=null;G.me=null;G.snap=null;G.remIn=null;
  for(const m of GPR.values())scene.remove(m);GPR.clear();}
function onSt(t){$('#onst').textContent=t;}
function onCards(){$$('#ongrid .ccard').forEach(c=>{c.style.backgroundImage='url('+HUDIMG['face_'+c.dataset.c]+')';c.className='ccard off';});}
function goOnline(){
  netClose();closeOvl();G.mode='onl';show('onl');$('#hud').classList.remove('on');canvas.style.visibility='hidden';onCards();onSt('CONNECTING…');$('#onhint').textContent='ESC TO CANCEL';
  let ws;try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);}catch(e){onSt('ONLINE ONLY WORKS ON THE DEADBRAWL WEBSITE');return;}
  NET.ws=ws;
  ws.onopen=()=>netSend({t:'queue'});
  ws.onerror=()=>{if(G.mode==='onl'&&!NET.matched)onSt('COULD NOT CONNECT. ONLINE ONLY WORKS ON THE DEADBRAWL WEBSITE');};
  ws.onclose=()=>{if(NET.ws===ws){NET.ws=null;if(G.online||NET.matched)netLost('CONNECTION LOST');}};
  ws.onmessage=e=>netMsg(e.data);
}
function netLost(msg){
  const inFight=G.mode==='fight';netClose();
  if(!inFight){onSt(msg);onCards();$('#onhint').textContent='ESC TO GO BACK';return;}
  G.phase='done';const t=$('#rtitle');t.textContent=msg;t.className='lose';$('#rsub').textContent='';
  $('[data-a=rematch]').style.display='none';$('#rnext').style.display='';openOvl('result');setSel($$('#result .mbtn'),1);
}
function netMsg(d){
  if(d[0]==='~'){const o=JSON.parse(d.slice(1));
    if(o.s)G.snap=o;else if(o.i)G.remIn=o.i;else if(o.p&&G.online&&G.online.role==='host'&&G.phase==='fight'){if(o.a){p2.uAX=o.a[0];p2.uAY=o.a[1];p2.uAimT=G.time;}press(p2,o.p);}
    return;}
  const m=JSON.parse(d);
  switch(m.t){
    case 'queued':onSt('SEARCHING FOR AN OPPONENT…');break;
    case 'match':NET.role=m.role;NET.matched=true;sfx.ok();onSt('OPPONENT FOUND: PICK YOUR FIGHTER');$$('#ongrid .ccard').forEach(c=>c.classList.remove('off'));break;
    case 'opp':{const c=$('#ongrid .ccard[data-c='+m.c+']');if(c){c.classList.add('taken');}break;}
    case 'denied':onSt('ALREADY TAKEN, PICK ANOTHER');break;
    case 'locked':NET.locked=m.c;$('#ongrid .ccard[data-c='+m.c+']').classList.add('mine');onSt('WAITING FOR OPPONENT TO PICK…');break;
    case 'start':startOnline(m);break;
    case 'oppLeft':netLost('OPPONENT LEFT');break;
  }
}
function startOnline(m){
  G.online={role:NET.role};G.training=false;G.p1char=m.host;G.p2char=m.guest;G.me=NET.role==='host'?p1:p2;G.snap=null;G.lastSnap=null;G.remIn=null;G.lastIn='';G.netEv=[];
  G.mode='fight';G.paused=false;closeOvl();show('');$('#hud').classList.add('on');canvas.style.visibility='visible';
  $('[data-a=rematch]').style.display='none';$('#rnext').style.display='';
  charIntro();
  if(NET.role==='host')startMatch();else{setArena(0);p1.char=m.host;p2.char=m.guest;hudSetup();for(const f of[p1,p2])f.reset(f.idx?2.2:-2.2);G.phase='intro';}
  updCam(true);
}
$$('#ongrid .ccard').forEach(c=>c.addEventListener('click',()=>{if(!NET.matched||NET.locked||c.classList.contains('taken'))return;sfx.sel();netSend({t:'lock',c:c.dataset.c});}));
function pressMe(b,a){if(G.online&&G.online.role==='guest')netGame(a?{p:b,a}:{p:b});else{if(a){const f=G.me||p1;f.uAX=a[0];f.uAY=a[1];f.uAimT=G.time;}press(G.me||p1,b);}}
// host: record visual/sound events so the guest can replay them
const ORIG={};
function netEnc(v){return v instanceof Fighter?{__f:v.idx}:v;}
function netDec(v){return v&&typeof v==='object'&&v.__f!==undefined?[p1,p2][v.__f]:v;}
function netWrap(name,fn){ORIG[name]=fn;return function(...a){if(G.online&&G.online.role==='host')G.netEv.push([name,a.map(netEnc)]);return fn.apply(this,a);};}
spark=netWrap('spark',spark);trail=netWrap('trail',trail);dust=netWrap('dust',dust);flash=netWrap('flash',flash);splash=netWrap('splash',splash);
callout=netWrap('callout',callout);showCombo=netWrap('showCombo',showCombo);cutin=netWrap('cutin',cutin);shotgunFx=netWrap('shotgunFx',shotgunFx);shotFx=netWrap('shotFx',shotFx);
afterimage=netWrap('afterimage',afterimage);burstKnife=netWrap('burstKnife',burstKnife);muzzleFlash=netWrap('muzzleFlash',muzzleFlash);stars=netWrap('stars',stars);endMatch=netWrap('endMatch',endMatch);
setArena=netWrap('setArena',setArena);arenaWipe=netWrap('arenaWipe',arenaWipe);
for(const k in sfx){const fn=sfx[k];ORIG['sfx.'+k]=fn;sfx[k]=function(...a){if(G.online&&G.online.role==='host')G.netEv.push(['sfx.'+k,a]);return fn.apply(this,a);};}
function netSer(f){const o={};for(const k in f){if(k==='_face')continue;const v=f[k],t=typeof v;if(t==='number')o[k]=Math.round(v*1000)/1000;else if(t==='string'||t==='boolean')o[k]=v;}o.cd=f.cd;return o;}
function netSnap(){
  for(const p of projectiles)if(!p.id)p.id=++PID;
  netGame({s:1,g:{time:G.time,timer:G.timer,phase:G.phase,pt:G.pt,wins:G.wins,round:G.round,introHold:G.introHold||0,freeze:G.freeze,hitstop:G.hitstop,shake:G.shake,arena:arenaIdx},
    f:[netSer(p1),netSer(p2)],pr:projectiles.map(p=>({id:p.id,x:Math.round(p.x*1000)/1000,y:Math.round(p.y*1000)/1000,vx:p.vx,o:p.owner.idx})),ev:G.netEv});
  G.netEv=[];
}
function guestProj(list){const seen=new Set();
  for(const q of list){seen.add(q.id);let m=GPR.get(q.id);
    if(!m){const fr=SPR.knifeproj[0];m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TEX[q.o].knifeproj[0],transparent:true,depthWrite:false,fog:false}));m.renderOrder=5;m.scale.set(fr.w*SPRK*1.1*(Math.sign(q.vx)||1),fr.h*SPRK*1.1,1);scene.add(m);GPR.set(q.id,m);}
    m.position.set(q.x,q.y,0.2);}
  for(const[id,m]of GPR)if(!seen.has(id)){scene.remove(m);GPR.delete(id);}}
function guestTick(){
  const S=G.snap;
  if(S&&S!==G.lastSnap){G.lastSnap=S;const g=S.g;
    G.time=g.time;G.timer=g.timer;G.phase=g.phase;G.pt=g.pt;G.wins=g.wins;G.round=g.round;G.introHold=g.introHold;G.freeze=g.freeze;G.hitstop=g.hitstop;G.shake=Math.max(G.shake,g.shake||0);
    [p1,p2].forEach((f,i)=>{const s=S.f[i];for(const k in s){if(k==='cd')Object.assign(f.cd,s[k]);else f[k]=s[k];}f.move=f.state==='attack'&&MOVES[f.mname]||null;});
    guestProj(S.pr);
    for(const[n,a]of S.ev){try{ORIG[n](...a.map(netDec));}catch(e){}}
    if(g.arena!==undefined&&g.arena!==arenaIdx)ORIG.setArena(g.arena); // in case the arena-change event was in a skipped snapshot
  }else G.time++;
  if(!(G.introHold>0))$('#cintro').classList.remove('on');
  const inp={l:+!!(keys.KeyA||keys.ArrowLeft),r:+!!(keys.KeyD||keys.ArrowRight),u:+!!(keys.KeyW||keys.ArrowUp),d:+!!(keys.KeyS||keys.ArrowDown),q:+!!keys.KeyQ,s:+!!(keys.Digit3||keys.Numpad3)};
  const js=JSON.stringify(inp);if(js!==G.lastIn){G.lastIn=js;netGame({i:inp});}
  const ep=embers.geometry.attributes.position;for(let i=0;i<ep.count;i++){let y=ep.getY(i)+0.012;if(y>14)y=0;ep.setY(i,y);}ep.needsUpdate=true;
  updFx();animFighter(p1,p2);animFighter(p2,p1);
  for(const f of[p1,p2]){if(f.char==='jacob')jacobRope(f,f===p1?p2:p1);else if(f.rope)f.rope.visible=false;}
  updHud();
}
