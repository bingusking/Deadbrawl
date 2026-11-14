'use strict';
/* =============== SCREENS / MENUS =============== */
p1=new Fighter(PAL1,0);p2=new Fighter(PAL2,1);
$('#ccard0').style.backgroundImage='url('+HUDIMG.face_vish+')';$$('.cib .art').forEach(e=>e.style.backgroundImage='url('+HUDIMG.intro+')');let cPick=null,cCur=0,cT=0;const CIDS=['vish','rift','jacob'];$('#ccard2').style.backgroundImage='url('+HUDIMG.face_jacob+')';$('#ccard1').style.backgroundImage='url('+HUDIMG.face_rift+')';$('#ccard1').textContent='';$('#ccard2').addEventListener('click',()=>cChoose(2));$('#ccard3').addEventListener('click',()=>cChoose(3));
function cReset(keep){if(!keep){G.selStage=0;$('#ctitle').textContent='CHOOSE YOUR FIGHTER';}cPick=null;cCur=-1;$('#cidle').style.display='none';$('#cname2').innerHTML='&nbsp;';$('#cdesc').textContent='';$('#cgo').style.visibility='hidden';
  // vs CPU: the opponent can't be the fighter you picked
  $$('#csel .ccard').forEach((c,k)=>{c.classList.remove('sel');c.classList.toggle('taken',G.selStage===1&&!G.training&&CIDS[k]===G.p1char);});
  $('#chint').textContent='PICK A CHARACTER (A / D) · ESC TO GO BACK';}
const cTaken=i=>i<3&&G.selStage===1&&!G.training&&CIDS[i]===G.p1char;
function cNav(d){let i=cCur;for(let n=0;n<4;n++){i=(i+d+4)%4;if(!cTaken(i))return cChoose(i);}}
function cChoose(i){if(i===undefined){if(cCur<0)return cNav(1);i=cCur;}if(cTaken(i)){sfx.block();return;}
  const rand=i===3,id=rand?'random':CIDS[i];
  if(cPick===id){ // second press confirms; RANDOM rolls from whoever is allowed
    const pool=CIDS.filter((c,k)=>!cTaken(k)),real=rand?pool[rnd()*pool.length|0]:id;
    if(G.selStage===1){G.p2char=real;act('fight');return;}G.p1char=real;if(G.training){act('fight');return;}sfx.ok();G.selStage=1;cReset(true);$('#ctitle').textContent='CHOOSE YOUR OPPONENT';return;}
  sfx.ok();cPick=id;cCur=i;
  const im=$('#cidle');im.style.display='block';im.style.filter=rand?'brightness(0) drop-shadow(0 0 .4vw #d8232f)':'';im.removeAttribute('src');
  $('#cname2').textContent=rand?'RANDOM':CHARS[id].name;$('#cdesc').textContent=rand?(G.selStage===1?'A surprise opponent':'A surprise fighter'):CHARS[id].desc;$('#cgo').style.visibility='visible';
  $$('#csel .ccard').forEach((c,k)=>c.classList.toggle('sel',k===i));$('#chint').textContent='SELECT AGAIN OR ENTER TO CONFIRM · ESC TO GO BACK';}
setInterval(()=>{if(G.mode==='select'&&cPick){cT++;const pk=cPick==='random'?CIDS.filter((c,k)=>!cTaken(k))[Math.floor(cT/4)%CIDS.filter((c,k)=>!cTaken(k)).length]:cPick;const fr=SPR[pk==='vish'?'vish_menu':pk+'_idle'];$('#cidle').src=fr[(fr.length>10?cT*2:cT)%fr.length].src;}},150);
$('#ccard0').addEventListener('click',()=>cChoose(0));$('#ccard1').addEventListener('click',()=>cChoose(1));$('#cgo').addEventListener('click',()=>cChoose());
$$('.ink').forEach((el,n)=>{let r=n*7+3;const R=()=>{r=(r*9301+49297)%233280;return r/233280;};const pts=[],N=26;
  const slant=el.classList.contains('plate')?6:el.classList.contains('splash')?14:4;
  for(let i=0;i<=N;i++)pts.push([i/N*100,(R()*16)]);for(let i=N;i>=0;i--)pts.push([i/N*100-(i===N?slant:0),100-R()*18]);
  if(el.classList.contains('splash')){pts.length=0;for(let i=0;i<40;i++){const a=i/40*Math.PI*2,rr=38+R()*14+(i%3==0?R()*10:0);pts.push([50+Math.cos(a)*rr*1.1,55+Math.sin(a)*rr]);}}
  el.style.clipPath='polygon('+pts.map(p=>p[0].toFixed(1)+'% '+p[1].toFixed(1)+'%').join(',')+')';});

const DIFFS=['EASY','NORMAL','HARD'];
/* ---------- settings (saved in this browser) ---------- */
const SET={sound:1,vol:1,shake:1};
try{Object.assign(SET,JSON.parse(localStorage.getItem('deadbrawl.set')||'{}'));}catch(e){}
function saveSet(){try{localStorage.setItem('deadbrawl.set',JSON.stringify(SET));}catch(e){}}
function applySet(){muted=!SET.sound;VOL=SET.vol;$('#sSnd').textContent=SET.sound?'ON':'OFF';$('#sVol').textContent=Math.round(SET.vol*100)+'%';$('#sShk').textContent=SET.shake?'ON':'OFF';$('#mute').textContent='SOUND: '+(muted?'OFF':'ON')+' (M)';}

/* ---------- main menu scene: three fighters, embers, intro ---------- */
const MF={front:'vish',t:0};
const mfAnim=id=>SPR[id==='vish'?'vish_menu':id+'_idle'];
function mfBuild(){if($('#menu').classList.contains('art'))return;const box=$('#mfs');box.innerHTML='';const others=CIDS.filter(c=>c!==MF.front);
  // [char, x position (vw), height (vh), back?]
  [[others[0],60,46,1],[others[1],88,46,1],[MF.front,74,64,0]].forEach(([id,x,h,bk],n)=>{
    const sh=document.createElement('div');sh.className='mshad';sh.style.cssText+=`left:${x-6}vw;width:12vw;${bk?'bottom:11.5vh;opacity:.6':''}`;box.appendChild(sh);
    const im=document.createElement('img');im.className='mf '+(bk?'back':'front');im.dataset.c=id;im.dataset.x=x;im.dataset.h=h;im.style.animationDelay=(0.25+n*0.15)+'s';sh.style.animationDelay=im.style.animationDelay;box.appendChild(im);});
  mfStep(true);}
function mfStep(force){if(G.mode!=='menu'&&!force)return;MF.t++;
  $$('#mfs .mf').forEach((im,n)=>{const fr=mfAnim(im.dataset.c),f=fr[(MF.t+n*4)%fr.length],k=f.k||SPRK,hv=(+im.dataset.h)*(f.h*k/1.92),wv=hv*f.w/f.h;
    im.src=f.src;im.style.height=hv+'vh';im.style.left=`calc(${im.dataset.x}vw - ${(f.ax/f.w)*wv}vh)`;
    im.style.transformOrigin=(f.ax/f.w*100)+'% 100%';im.style.transform=(f.flip?'':'scaleX(-1)');});} // face left, toward the menu
setInterval(()=>mfStep(),110);
function mfCycle(){MF.front=CIDS[(CIDS.indexOf(MF.front)+1)%CIDS.length];const fl=$('#mflash');fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');mfBuild();}
const EMB=[];
(function embers(){const c=$('#membr');requestAnimationFrame(embers);if(G.mode!=='menu')return;
  const W=c.clientWidth,H=c.clientHeight;if(c.width!==W||c.height!==H){c.width=W;c.height=H;}const x=c.getContext('2d');x.clearRect(0,0,W,H);
  if(EMB.length<70&&rnd()<0.5)EMB.push({x:W*(0.35+rnd()*0.65),y:H+5,vx:(rnd()-0.5)*0.4,vy:-(0.4+rnd()*1.1),r:1+rnd()*2.2,l:1});
  for(let i=EMB.length-1;i>=0;i--){const e=EMB[i];e.x+=e.vx+Math.sin((e.y+i*40)*0.01)*0.3;e.y+=e.vy;e.l-=0.0025;
    if(e.y<-10||e.l<=0){EMB.splice(i,1);continue;}x.globalAlpha=Math.min(1,e.l*1.5)*0.85;x.fillStyle=e.r>2?'#ffb347':'#ff5a2a';x.fillRect(e.x,e.y,e.r,e.r);}
  x.globalAlpha=1;})();
setTimeout(()=>$('#menu').classList.remove('intro'),1800); // the opening slam only plays once
function show(id){$$('.screen').forEach(s=>s.classList.toggle('on',s.id===id));}
function toSelect(){cReset();G.mode='select';closeOvl();show('csel');$('#hud').classList.remove('on');canvas.style.visibility='hidden';$('#cmode').textContent=G.training?'TRAINING':'VS CPU';$('#cdiffrow').style.display=G.training?'none':'';$('#dlabel').textContent=G.diff;}
function toMenu(){if(CIDS.includes(G.p1char)&&MF.front!==G.p1char){MF.front=G.p1char;mfBuild();}netClose();$('[data-a=rematch]').style.display='';$('#rnext').style.display='none';$('#cintro').classList.remove('on');G.mode='menu';G.paused=false;closeOvl();show('menu');$('#hud').classList.remove('on');canvas.style.visibility='hidden';}
function toFight(){G.mode='fight';G.paused=false;closeOvl();show('');$('#hud').classList.add('on');canvas.style.visibility='visible';if(G.training)G.p2char='vish';charIntro();startMatch();updCam(true);}
function charIntro(){const c=$('#cintro'),A=c.querySelector('.a'),B=c.querySelector('.b');c.classList.add('on');
  [[A,G.p1char,G.online?(G.online.role==='host'?'YOU':'P1'):'P1'],[B,G.p2char,G.online?(G.online.role==='guest'?'YOU':'P2'):'CPU']].forEach(([e,id,lab])=>{e.querySelector('.art').style.backgroundImage='url('+HUDIMG[id==='vish'?'intro':'intro_'+id]+')';e.querySelector('.nm').innerHTML='<small>'+lab+'</small>'+CHARS[id].name;});
  for(const e of[A,B]){e.classList.remove('go');e.style.animationDelay='';}void c.offsetWidth;
  A.classList.add('go');G.introHold=88;
  if(!G.training){B.style.animationDelay='1.4s';B.classList.add('go');G.introHold=172;}}
function toViewer(){G.mode='viewer';show('viewer');$('#hud').classList.remove('on');canvas.style.visibility='hidden';cvShow(CIDS.includes(G.p1char)?G.p1char:'vish');}
let ovl=null;
function openOvl(id){ovl=id;$$('.ovl').forEach(o=>o.classList.toggle('on',o.id===id));setSel($$('#'+id+' .mbtn'),0);}
function closeOvl(){ovl=null;$$('.ovl').forEach(o=>o.classList.remove('on'));}
function setSel(list,i){const was=list.findIndex(b=>b.classList.contains('sel'));list.forEach((b,k)=>b.classList.toggle('sel',k===i));
  if(G.mode==='menu'&&!ovl&&was!==i&&list[i]&&list[i].dataset.a==='char'&&!$('#menu').classList.contains('art'))mfCycle();} // landing on Characters swaps who stands in front
function curList(){if(ovl)return $$('#'+ovl+' .mbtn');if(G.mode==='menu')return $$('#menu .mbtn');return [];}
function act(a){
  sfx.ok();
  switch(a){
    case 'play':G.training=false;toSelect();break;
    case 'online':goOnline();break;
    case 'train':G.training=true;toSelect();break;
    case 'fight':toFight();break;
    case 'diff':{const i=(DIFFS.indexOf(G.diff)+1)%3;G.diff=DIFFS[i];$('#dlabel').textContent=G.diff;break;}
    case 'char':$('#ctrlPanel').classList.remove('on');toViewer();break;
    case 'set':applySet();openOvl('settings');break;
    case 'snd':SET.sound=SET.sound?0:1;applySet();saveSet();break;
    case 'vol':SET.vol=[1,0.75,0.5,0.25][([1,0.75,0.5,0.25].indexOf(SET.vol)+1)%4];applySet();saveSet();break;
    case 'shk':SET.shake=SET.shake?0:1;applySet();saveSet();break;
    case 'sback':$('#ctrlPanel').classList.remove('on');closeOvl();setSel($$('#menu .mbtn'),4);break;
    case 'ctrl':$('#ctrlPanel').classList.toggle('on');break;
    case 'resume':G.paused=false;closeOvl();break;
    case 'restart':if(G.online){closeOvl();break;}G.paused=false;closeOvl();startMatch();break;
    case 'rematch':closeOvl();startMatch();break;
    case 'quit':toMenu();break;
  }
}
$$('.mbtn[data-a]').forEach(b=>{b.addEventListener('click',()=>act(b.dataset.a));b.addEventListener('mouseenter',()=>{const l=curList();const i=l.indexOf(b);if(i>=0&&!b.classList.contains('sel')){setSel(l,i);sfx.sel();}});});
addEventListener('keydown',e=>{
  ac();
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='KeyM'){toggleMute();return;}
  const list=curList();
  if(list.length){
    const i=list.findIndex(b=>b.classList.contains('sel'));
    if(e.code==='KeyW'||e.code==='ArrowUp'){setSel(list,(i-1+list.length)%list.length);sfx.sel();}
    else if(e.code==='KeyS'||e.code==='ArrowDown'){setSel(list,(i+1)%list.length);sfx.sel();}
    else if((e.code==='Enter'||e.code==='KeyJ'||e.code==='Space')&&!e.repeat){act(list[Math.max(0,i)].dataset.a);}
    else if(e.code==='Escape'&&ovl==='pause'){act('resume');}
    else if(e.code==='Escape'&&ovl==='settings'){if($('#ctrlPanel').classList.contains('on'))$('#ctrlPanel').classList.remove('on');else act('sback');}
    else if(e.code==='Escape'&&G.mode==='menu'){$('#ctrlPanel').classList.remove('on');}
    return;
  }
  if(G.mode==='onl'){if(e.code==='Escape'||e.code==='Backspace'){sfx.sel();toMenu();}return;}
  if(G.mode==='select'&&!G.training&&['KeyW','ArrowUp','KeyS','ArrowDown'].includes(e.code)){const d=e.code==='KeyW'||e.code==='ArrowUp'?-1:1;G.diff=DIFFS[(DIFFS.indexOf(G.diff)+d+3)%3];$('#dlabel').textContent=G.diff;sfx.sel();return;}
  if(G.mode==='select'){if(e.code==='Escape'||e.code==='Backspace'){sfx.sel();if(G.selStage===1)cReset();else toMenu();}else if(['Enter','Space','KeyJ'].includes(e.code)&&!e.repeat)cChoose();else if(['KeyA','ArrowLeft'].includes(e.code))cNav(-1);else if(['KeyD','ArrowRight'].includes(e.code))cNav(1);return;}
  if(G.mode==='viewer'){if(e.code==='Escape'||e.code==='Backspace')toMenu();else if(e.code==='KeyA'||e.code==='ArrowLeft')cvNav(-1);else if(e.code==='KeyD'||e.code==='ArrowRight')cvNav(1);return;}
  if(G.mode==='fight'){
    if(e.code==='Escape'){if(G.phase!=='done'){if(!G.online)G.paused=true;openOvl('pause');}return;}
    keys[e.code]=true;
    if(e.repeat||G.phase!=='fight')return;
    const dk={KeyW:'kU',ArrowUp:'kU',KeyS:'kD',ArrowDown:'kD',KeyA:'kL',ArrowLeft:'kL',KeyD:'kR',ArrowRight:'kR',KeyT:'taunt'}[e.code];if(dk)pressMe(dk);
    const m={KeyR:'ult',KeyQ:'melee',KeyF:'parry',Digit1:'a1',Digit2:'a2',Digit3:'a3',Digit4:'a4',ShiftLeft:'dodge',ShiftRight:'dodge',KeyW:'jump',ArrowUp:'jump',Space:'jump',Numpad1:'a1',Numpad2:'a2',Numpad3:'a3',Numpad4:'a4'}[e.code];
    if(e.code==='KeyE')pressMe('shot',mouseWorld());
    if(m==='melee'&&(keys.KeyS||keys.ArrowDown))pressMe('slam');else if(m==='ult')pressMe(m,mouseWorld());else if(m)pressMe(m);
  }
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function toggleMute(){SET.sound=SET.sound?0:1;applySet();saveSet();}
$('#dlabel').addEventListener('click',()=>{G.diff=DIFFS[(DIFFS.indexOf(G.diff)+1)%3];$('#dlabel').textContent=G.diff;sfx.sel();});
applySet();mfBuild();
$('#mute').addEventListener('click',toggleMute);
document.addEventListener('pointerdown',()=>ac(),{once:true});

/* mouse aim (The Lash's ultimate fires toward the cursor): cursor position -> point on the fight plane (z=0) */
const MOUSE={nx:null,ny:null};
addEventListener('mousedown',e=>{if(e.button===0&&G.mode==='fight'&&G.phase==='fight'&&!G.paused&&e.target.tagName==='CANVAS')pressMe('shot',mouseWorld());}); // Vish's shotgun
addEventListener('mousemove',e=>{MOUSE.nx=e.clientX/innerWidth*2-1;MOUSE.ny=-(e.clientY/innerHeight)*2+1;});
function mouseWorld(){if(MOUSE.nx===null)return null;cam.updateMatrixWorld();
  const v=new THREE.Vector3(MOUSE.nx,MOUSE.ny,0.5).unproject(cam).sub(cam.position).normalize(),t=-cam.position.z/v.z;
  return [Math.round((cam.position.x+v.x*t)*100)/100,Math.round((cam.position.y+v.y*t)*100)/100];}
