'use strict';
/* =============== GAME STATE =============== */
const G={mode:'menu',diff:'NORMAL',paused:false,time:0,phase:'intro',pt:0,round:1,wins:[0,0],timer:99*60,hitstop:0,freeze:0,shake:0,koBy:null,p1char:'vish',p2char:'vish'};
const CHARS={vish:{name:'VISH',ab:['KNIFE','RUSH','SLIDE','KICK'],desc:'1 Throwing knife · 2 Dash · 3 Slide (hold) · 4 Spike kick · Click Shotgun'},jacob:{name:'THE LASH',ab:['HOOK','SLAM','UPPER','KICK'],desc:'1 Grapple hook: then 1 again zip in, W launch above, S pull them · 2 Slam · 3 Uppercut · 4 Kick off · T taunt'},rift:{name:'RIFT',ab:['SLASH','BLINK','GRAB','LUNGE'],desc:'1 Big slash · 2 Teleport behind (2nd use pushes) · 3 Grab and hold, then S slam, A/D throw, W toss up · 4 Lunge grab'}};
const keys={};
function readPlayer(){p1.inp=readHeld();if(G.phase!=='fight'){p1.inp={l:0,r:0,u:0,d:0,q:0};p1.buf={};}}
function callout(f,txt,col){const el=$('#call'+(f.idx+1));el.innerHTML='<b style="color:'+col+'">'+txt+'</b>';el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),900);}
function splash(html,dur=1.2){const s=$('#splash');s.innerHTML=html;s.classList.remove('show');void s.offsetWidth;s.style.setProperty('--d',dur+'s');s.classList.add('show');}
function flash(a){const f=$('#flash');f.style.transition='none';f.style.opacity=a;void f.offsetWidth;f.style.transition='opacity .35s';f.style.opacity=0;}
function cutin(f){const c=$('#cutin');if(f&&f.char){c.querySelector('.cface').style.backgroundImage='url('+(HUDIMG['face_'+f.char]||'assets/face.webp')+')';c.querySelector('.cname').innerHTML='<small>ULTIMATE</small>'+((ULTS[f.char]||{}).name||'SUPER');}c.classList.remove('on');void c.offsetWidth;c.classList.add('on');const bar=c.querySelector('.cbar');bar.style.animation='none';void bar.offsetWidth;bar.style.animation='';flash(0.35);}
// combo counter: grows, shakes and heats up with each hit, shows the running damage total
function showCombo(a,n,dmg){if(n===undefined)n=a.combo;if(n<2)return;const el=$('#combo'+(a.idx+1));
  el.innerHTML='<b>'+n+'</b>HITS'+(dmg?'<em>'+dmg+' DMG</em>':'');el.style.setProperty('--s',Math.min(1.6,1+(n-2)*0.07));
  el.classList.toggle('hot',n>=5);el.classList.toggle('fire',n>=9);el.classList.add('on');el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1400);}
function KO(a,d){if(G.training){d.hp=1;return;}if(G.phase!=='fight')return;G.phase='ko';G.pt=0;G.koBy=a;G.wins[a.idx]++;d.state='airhit';sfx.ko();flash(0.6);splash('K.O.<span class="u"></span>',2.2);G.hitstop=20;}
function hudSetup(){const me=G.me||p1;hudKeys();$('#ab-m').style.display=me.char==='vish'?'':'none';CHARS[me.char].ab.forEach((n,i)=>$('#ab-'+(i+1)+' .n').textContent=n);$('#ab-1 .pips').style.display=me.char==='rift'?'none':'';$('#ab-2').classList.remove('charging');}
function startMatch(){setArena(0);p1.char=G.p1char;p2.char=G.p2char;hudSetup();G.wins=[0,0];G.round=1;p1.tension=p2.tension=0;startRound();}
function startRound(){
  $('#cutin').classList.remove('on');
  for(const p of projectiles)scene.remove(p.mesh);projectiles.length=0;clearFx();
  for(const f of[p1,p2])Object.assign(f,{um:'',ut:0,u2:0,ucOn:0,hide:0,uRope:0,uSl:0,uSh:0,uPose:'',uFollow:0,udT:0,uLong:0});if(arenaNext>=0)setArena(arenaIdx);
  p1.reset(-2.2);p2.reset(2.2);G.timer=99*60;G.phase='intro';G.pt=0;G.hitstop=0;G.freeze=0;
  p2.ai={think:30,plan:0,dir:0};
  const final=G.wins[0]===1&&G.wins[1]===1;
  if(G.introHold>0)G.pendSplash=()=>{splash('<span class="s1">'+(G.training?'TRAINING':final?'FINAL ROUND':'ROUND '+G.round)+'</span>READY?<span class="u"></span>',1.5);};else{splash('<span class="s1">'+(G.training?'TRAINING':final?'FINAL ROUND':'ROUND '+G.round)+'</span>READY?<span class="u"></span>',1.5);}
  updHud(true);
}
function phaseLogic(){
  if(G.introHold>0){if(--G.introHold===0){$('#cintro').classList.remove('on');if(G.pendSplash){G.pendSplash();G.pendSplash=null;}}return;}
  G.pt++;
  if(G.phase==='intro'){
    if(G.pt===95){splash('FIGHT!<span class="u"></span>',0.9);sfx.ok();for(const f of[p1,p2])f.state='idle';G.phase='fight';}
  }else if(G.phase==='fight'){
    if(G.training&&!['rult','vult','attack'].includes(p1.state))p1.tension=100; // training: ULT always ready
    if(G.training){for(const f of[p1,p2])if(G.time-(f.lastHitT||-999)>110&&f.hp<MAXHP&&!['airhit','kd','hitstun','stun'].includes(f.state)){f.hp=MAXHP;f.trailHp=MAXHP;}}
    else if(G.freeze<=0&&G.hitstop<=0)G.timer--;
    if(G.timer<=0){G.timer=0;G.phase='ko';G.pt=0;const w=p1.hp===p2.hp?null:(p1.hp>p2.hp?p1:p2);G.koBy=w;if(w)G.wins[w.idx]++;splash('TIME!<span class="u"></span>',2);}
  }else if(G.phase==='ko'){
    if(G.pt===150&&G.koBy&&G.koBy.hp>0){G.koBy.state='victory';G.koBy.vx=0;}
    if(G.pt===150&&G.koBy){splash((G.koBy===p1?'P1':'CPU')+'<span class="s1" style="transform:none;display:inline;margin-left:.3em">WINS</span><span class="u"></span>',1.8);}
    if(G.pt===260){
      if(G.wins[0]>=2||G.wins[1]>=2)endMatch();
      else{G.round++;startRound();}
    }
  }
}
function endMatch(){G.phase='done';const mi=G.me?G.me.idx:0,win=G.wins[mi]>G.wins[1-mi];const t=$('#rtitle');t.textContent=win?'YOU WIN':'YOU LOSE';t.className=win?'win':'lose';$('#rsub').textContent=G.online?`${G.wins[mi]} – ${G.wins[1-mi]}  ·  ONLINE`:`${G.wins[0]} – ${G.wins[1]}  ·  ${G.diff}`;openOvl('result');if(G.online)setSel($$('#result .mbtn'),1);}
let lastHud={};
function updHud(force){
  for(const f of[p1,p2]){const i=f.idx+1;
    if(f.trailHp>f.hp){if(f.state!=='hitstun'&&f.state!=='airhit'||f.trailHp-f.hp>400)f.trailHp=Math.max(f.hp,f.trailHp-6);}else f.trailHp=f.hp;
    const hp=f.hp/MAXHP*100,tr=f.trailHp/MAXHP*100;
    $('#hp'+i).style.width=hp+'%';$('#tr'+i).style.width=tr+'%';
    $('#hp'+i).classList.toggle('low',hp<25);
    const tn=$('#tn'+i);tn.style.width=f.tension+'%';tn.classList.toggle('full',f.tension>=ULT_COST);$('#tv'+i).textContent=Math.floor(f.tension);
    $$('#rw'+i+' .rd').forEach((d,k)=>d.classList.toggle('w',G.wins[f.idx]>k));
  }
  $('#timer').textContent=G.training?'∞':Math.ceil(G.timer/60);
  for(const g of[p1,p2]){const want=G.training&&g.idx===1?'pf_dummy':'pf_'+g.char+'_'+(g.state==='victory'?'won':g.hp<MAXHP*0.3?'low':'default');if(g._face!==want){g._face=want;$('#pt'+(g.idx+1)).style.backgroundImage='url('+HUDIMG[want]+')';}}
  vultPromptUpd();
  const f=G.me||p1,set=(id,cd,max)=>{const el=$('#ab-'+id);el.querySelector('i').style.height=(cd>0?cd/max*100:0)+'%';el.querySelector('b').textContent=cd>0?Math.ceil(cd/60):'';el.classList.toggle('ready',cd<=0);};
  set('f',f.cd.parry,CD.parry);set('2',f.cd.dash,CD.dash);set('3',0,1);$('#ab-3').classList.toggle('charging',f.char==='vish'&&f.state==='slide');set('4',f.cd.kick,CD.kick);set('s',f.cd.dodge,CD.dodge);
  const k=$('#ab-1');k.querySelectorAll('.pips u').forEach((u,i)=>u.classList.toggle('on',i<f.knives));
  k.querySelector('i').style.height=f.knives>0?'0%':(100-f.knifeT/CD.knifeRegen*100)+'%';k.querySelector('b').textContent=f.knives>0?'':Math.ceil((CD.knifeRegen-f.knifeT)/60);k.classList.toggle('ready',f.knives>0);
  $('#ab-1 .pips u:last-child').style.display=f.char==='jacob'?'none':'';
  if(f.char==='vish'){const g=$('#ab-m');g.querySelectorAll('.pips u').forEach((u,i)=>u.classList.toggle('on',i<f.ammo));g.classList.toggle('ready',f.ammo>0);
    g.querySelector('i').style.height=f.ammo>0?'0%':(100-Math.max(0,f.ammoT-SHOT.RELOAD_DELAY)/SHOT.RELOAD*100)+'%';g.querySelector('b').textContent='';}
  if(f.char==='jacob'){set('2',f.cd.j2,240);set('3',f.cd.j3,210);set('4',f.cd.j4,180);const k1=$('#ab-1');k1.querySelectorAll('.pips u').forEach((u,i)=>u.classList.toggle('on',i<f.hooks));
    k1.querySelector('i').style.height=f.hooks>0?'0%':(100-f.hookT/JHOOK_REGEN*100)+'%';k1.querySelector('b').textContent=f.hooks>0?'':Math.ceil((JHOOK_REGEN-f.hookT)/60);k1.classList.toggle('ready',f.hooks>0);k1.classList.toggle('charging',f.hookOn>0);}
  else $('#ab-1').classList.remove('charging');
  if(f.char==='rift'){set('1',f.cd.r1,150);set('2',f.tpWin>0?0:f.cd.r2,300);set('3',f.cd.r3,240);set('4',f.cd.r4,240);$('#ab-2').classList.toggle('charging',f.tpWin>0);}
  {const r=$('#ab-r'),has=!!ULTS[f.char];r.classList.toggle('lock',!has);r.querySelector('.soon').style.display=has?'none':'';
   r.querySelector('i').style.height=has?(100-Math.min(100,f.tension/ULT_COST*100))+'%':'0%';r.classList.toggle('ultready',has&&f.tension>=ULT_COST);}
  const q=$('#ab-q');q.classList.toggle('charging',f.state==='charge'&&f.charge>=TAP);q.classList.add('ready');
  q.querySelector('i').style.height=f.state==='charge'?(100-Math.min(1,f.charge/CHARGE)*100)+'%':'0%';
}

/* =============== CAMERA =============== */
const camPos=new THREE.Vector3(0,1.7,9),camLook=new THREE.Vector3(0,1.2,0);
function updCam(snap){
  doorUpd();
  {const A=ARENAS[arenaIdx]; // The Saloon: walk out through the doors onto Main Street (and back)
   if(A.door!==undefined&&G.phase==='fight'&&arenaNext<0&&!(G.online&&G.online.role==='guest')){const z=(p1.x+p2.x)/2>A.door?1:0;
     if(G.zone===undefined)G.zone=z;else if(z!==G.zone){G.zone=z;splash('<b>'+(z?'MAIN STREET':A.name)+'</b>',1.2);sfx.whoosh();}}}
  const mid=(p1.x+p2.x)/2,d=Math.abs(p1.x-p2.x),hy=Math.max(p1.y,p2.y);
  const tx=clamp(mid,BL+3.6,BR-3.6),tz=7.7+d*0.45,ty=1.95+hy*0.35; // wider shot so you can see more of the stage
  const lo=Math.min(p1.y,p2.y)*0.5;
  const want=new THREE.Vector3(tx,ty+lo,tz),look=new THREE.Vector3(tx,1.15+hy*0.3+lo,0);
  for(const f of[p1,p2])if(f.uFollow&&!f.air()&&!(f===p1?p2:p1).air())f.uFollow=0;
  {const U=[p1,p2].find(f=>f.state==='rult'||f.state==='jult'||f.state==='vult'||(f.uFollow&&(f.air()||(f===p1?p2:p1).air()))),V=U&&(U===p1?p2:p1); // ultimate: frame both fighters as the combo climbs
   if(U&&U.ucOn){const L=G.me||p1;want.set(L.x,Math.max(1.9,L.y*0.6+1.9),10.2);look.set(L.x,L.y*0.55+1.2,0);G.ultCam=30;G.camFollow=1;} // knocked into the next arena: ride along with your fighter
   else if(U){const top=Math.max(U.y,V.y)+2.3,bot=Math.min(U.y,V.y),cy=(top+bot)/2;want.set(clamp((U.x+V.x)/2,BL+3.2,BR-3.2),cy+0.2,6.6+(top-bot)*1.15);look.set(want.x,cy,0);G.ultCam=30;}else if(G.ultCam>0)G.ultCam--;}
  if(G.phase==='intro'&&G.pt<70){const k=1-G.pt/70;want.z-=k*2.2;want.y-=k*0.6;} // intro: start close, pull back, centred between both fighters
  if(G.phase==='ko'&&G.pt<130&&G.koBy){const w=G.koBy===p1?p2:p1;want.set(w.x*0.6+tx*0.4,1.6,6.5);look.set(w.x*0.6+tx*0.4,0.8,0);}
  if(G.camSnap){G.camSnap=0;snap=true;} // arena change: cut straight to the new shot
  if(snap){camPos.copy(want);camLook.copy(look);}else{const r=G.camFollow?0.34:G.ultCam?0.16:0.08;G.camFollow=0;camPos.lerp(want,r);camLook.lerp(look,r*1.25);}
  cam.position.copy(camPos);
  if(G.shake>0.002){cam.position.x+=(rnd()-0.5)*G.shake*SET.shake;cam.position.y+=(rnd()-0.5)*G.shake*SET.shake;G.shake*=0.85;}else G.shake=0;
  cam.lookAt(camLook);
}

/* =============== MAIN TICK =============== */
function tick(){
  G.time++;
  readPlayer();if(G.online){p2.inp=G.phase==='fight'?Object.assign({l:0,r:0,u:0,d:0,q:0},G.remIn||{}):{l:0,r:0,u:0,d:0,q:0};if(G.phase!=='fight')p2.buf={};}else aiThink(p2,p1);
  // embers
  const ep=embers.geometry.attributes.position;for(let i=0;i<ep.count;i++){let y=ep.getY(i)+0.012;if(y>14)y=0;ep.setY(i,y);ep.setX(i,ep.getX(i)+Math.sin(G.time*0.01+i)*0.004);}ep.needsUpdate=true;
  updFx();
  if(G.phase==='done'){animFighter(p1,p2);animFighter(p2,p1);return;}
  if(G.freeze>0){if(--G.freeze<=0)$('#cutin').classList.remove('on');animFighter(p1,p2);animFighter(p2,p1);updHud();return;}
  if(G.hitstop>0){G.hitstop--;return;}
  phaseLogic();
  if(G.phase==='ko'&&G.pt<70&&G.time%2)return;
  stepFighter(p1,p2);stepFighter(p2,p1);ultWatchdog();doorCheck();pushbox();updProj();
  animFighter(p1,p2);animFighter(p2,p1);
  updHud();
}
