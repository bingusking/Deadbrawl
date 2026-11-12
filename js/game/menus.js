'use strict';
/* =============== SCREENS / MENUS =============== */
p1=new Fighter(PAL1,0);p2=new Fighter(PAL2,1);
$('#ccard0').style.backgroundImage='url('+HUDIMG.face_vish+')';$$('.cib .art').forEach(e=>e.style.backgroundImage='url('+HUDIMG.intro+')');let cPick=null,cCur=0,cT=0;const CIDS=['vish','rift','jacob'];$('#ccard2').style.backgroundImage='url('+HUDIMG.face_jacob+')';$('#ccard1').style.backgroundImage='url('+HUDIMG.face_rift+')';$('#ccard1').textContent='';$('#ccard2').addEventListener('click',()=>cChoose(2));
function cReset(keep){if(!keep){G.selStage=0;$('#ctitle').textContent='CHOOSE YOUR FIGHTER';}cPick=null;cCur=0;$('#cidle').style.display='none';$('#cname2').innerHTML='&nbsp;';$('#cdesc').textContent='';$('#cgo').style.visibility='hidden';$$('.ccard').forEach(c=>c.classList.remove('sel'));$('#chint').textContent='PICK A CHARACTER (A / D) · ESC TO GO BACK';}
function cChoose(i){if(i===undefined)i=cCur;const id=CIDS[i];if(cPick===id){if(G.selStage===1){G.p2char=id;act('fight');return;}G.p1char=id;if(G.training){act('fight');return;}sfx.ok();G.selStage=1;cReset(true);$('#ctitle').textContent='CHOOSE YOUR OPPONENT';return;}sfx.ok();cPick=id;cCur=i;
  const im=$('#cidle');im.style.display='block';im.style.filter='';im.removeAttribute('src');
  $('#cname2').textContent=CHARS[id].name;$('#cdesc').textContent=CHARS[id].desc;$('#cgo').style.visibility='visible';
  $$('.ccard').forEach((c,k)=>c.classList.toggle('sel',k===i));$('#chint').textContent='SELECT AGAIN OR ENTER TO CONFIRM · ESC TO GO BACK';}
setInterval(()=>{if(G.mode==='select'&&cPick){cT++;const fr=SPR[cPick==='vish'?'vish_menu':cPick+'_idle'];$('#cidle').src=fr[(fr.length>10?cT*2:cT)%fr.length].src;}},150);
$('#ccard0').addEventListener('click',()=>cChoose(0));$('#ccard1').addEventListener('click',()=>cChoose(1));$('#cgo').addEventListener('click',()=>cChoose());
$$('.ink').forEach((el,n)=>{let r=n*7+3;const R=()=>{r=(r*9301+49297)%233280;return r/233280;};const pts=[],N=26;
  const slant=el.classList.contains('plate')?6:el.classList.contains('splash')?14:4;
  for(let i=0;i<=N;i++)pts.push([i/N*100,(R()*16)]);for(let i=N;i>=0;i--)pts.push([i/N*100-(i===N?slant:0),100-R()*18]);
  if(el.classList.contains('splash')){pts.length=0;for(let i=0;i<40;i++){const a=i/40*Math.PI*2,rr=38+R()*14+(i%3==0?R()*10:0);pts.push([50+Math.cos(a)*rr*1.1,55+Math.sin(a)*rr]);}}
  el.style.clipPath='polygon('+pts.map(p=>p[0].toFixed(1)+'% '+p[1].toFixed(1)+'%').join(',')+')';});

const DIFFS=['EASY','NORMAL','HARD'];
function show(id){$$('.screen').forEach(s=>s.classList.toggle('on',s.id===id));}
function toSelect(){cReset();G.mode='select';closeOvl();show('csel');$('#hud').classList.remove('on');canvas.style.visibility='hidden';$('#cmode').textContent=G.training?'TRAINING':'VS CPU';}
function toMenu(){netClose();$('[data-a=rematch]').style.display='';$('#rnext').style.display='none';$('#cintro').classList.remove('on');G.mode='menu';G.paused=false;closeOvl();show('menu');$('#hud').classList.remove('on');canvas.style.visibility='hidden';}
function toFight(){G.mode='fight';G.paused=false;closeOvl();show('');$('#hud').classList.add('on');canvas.style.visibility='visible';if(G.training)G.p2char='vish';charIntro();startMatch();updCam(true);}
function charIntro(){const c=$('#cintro'),A=c.querySelector('.a'),B=c.querySelector('.b');c.classList.add('on');
  [[A,G.p1char,G.online?(G.online.role==='host'?'YOU':'P1'):'P1'],[B,G.p2char,G.online?(G.online.role==='guest'?'YOU':'P2'):'CPU']].forEach(([e,id,lab])=>{e.querySelector('.art').style.backgroundImage='url('+HUDIMG[id==='vish'?'intro':'intro_'+id]+')';e.querySelector('.nm').innerHTML='<small>'+lab+'</small>'+CHARS[id].name;});
  for(const e of[A,B]){e.classList.remove('go');e.style.animationDelay='';}void c.offsetWidth;
  A.classList.add('go');G.introHold=88;
  if(!G.training){B.style.animationDelay='1.4s';B.classList.add('go');G.introHold=172;}}
function toViewer(){G.mode='viewer';show('viewer');$('#hud').classList.remove('on');canvas.style.visibility='visible';}
let ovl=null;
function openOvl(id){ovl=id;$$('.ovl').forEach(o=>o.classList.toggle('on',o.id===id));setSel($$('#'+id+' .mbtn'),0);}
function closeOvl(){ovl=null;$$('.ovl').forEach(o=>o.classList.remove('on'));}
function setSel(list,i){list.forEach((b,k)=>b.classList.toggle('sel',k===i));}
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
    else if(e.code==='Escape'&&G.mode==='menu'){$('#ctrlPanel').classList.remove('on');}
    return;
  }
  if(G.mode==='onl'){if(e.code==='Escape'||e.code==='Backspace'){sfx.sel();toMenu();}return;}
  if(G.mode==='select'){if(e.code==='Escape'||e.code==='Backspace'){sfx.sel();if(G.selStage===1)cReset();else toMenu();}else if(['Enter','Space','KeyJ'].includes(e.code)&&!e.repeat)cChoose();else if(['KeyA','ArrowLeft','KeyD','ArrowRight'].includes(e.code))cChoose((cCur+(cPick?1:0))%CIDS.length);return;}
  if(G.mode==='viewer'){if(e.code==='Escape'||e.code==='Backspace')toMenu();return;}
  if(G.mode==='fight'){
    if(e.code==='Escape'){if(G.phase!=='done'){if(!G.online)G.paused=true;openOvl('pause');}return;}
    keys[e.code]=true;
    if(e.repeat||G.phase!=='fight')return;
    const dk={KeyW:'kU',ArrowUp:'kU',KeyS:'kD',ArrowDown:'kD',KeyA:'kL',ArrowLeft:'kL',KeyD:'kR',ArrowRight:'kR',KeyT:'taunt'}[e.code];if(dk)pressMe(dk);
    const m={KeyQ:'melee',KeyF:'parry',Digit1:'a1',Digit2:'a2',Digit3:'a3',Digit4:'a4',ShiftLeft:'dodge',ShiftRight:'dodge',KeyW:'jump',ArrowUp:'jump',Space:'jump',Numpad1:'a1',Numpad2:'a2',Numpad3:'a3',Numpad4:'a4'}[e.code];
    if(m==='melee'&&(keys.KeyS||keys.ArrowDown))pressMe('slam');else if(m)pressMe(m);
  }
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function toggleMute(){muted=!muted;$('#mute').textContent='SOUND: '+(muted?'OFF':'ON')+' (M)';}
$('#mute').addEventListener('click',toggleMute);
document.addEventListener('pointerdown',()=>ac(),{once:true});
