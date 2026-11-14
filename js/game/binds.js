'use strict';
/* =============== KEYBINDS ===============
   Every action has one rebindable key (keyboard code, or Mouse0/1/2 for mouse buttons).
   General actions are shared; each fighter has its own tab for their abilities.
   Arrow keys / Space / right Shift always work too as fixed alternates for movement. */
const BIND_DEF={
  general:{left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',melee:'KeyQ',parry:'KeyF',dodge:'ShiftLeft',ult:'KeyR',taunt:'KeyT'},
  vish:{a1:'Digit1',a2:'Digit2',a3:'Digit3',a4:'Digit4',shot:'Mouse0'},
  rift:{a1:'Digit1',a2:'Digit2',a3:'Digit3',a4:'Digit4'},
  jacob:{a1:'Digit1',a2:'Digit2',a3:'Digit3',a4:'Digit4'}};
const BIND_ALT={left:['ArrowLeft'],right:['ArrowRight'],jump:['ArrowUp','Space'],down:['ArrowDown'],dodge:['ShiftRight']};
// labels shown in the controls panel
const BIND_LBL={
  general:[['left','Move left'],['right','Move right'],['jump','Jump · again to double jump'],['down','Down (S + air melee = slam)'],
    ['melee','Melee · hold to charge · air: launcher'],['parry','Parry'],['dodge','Dodge roll'],['ult','Ultimate (aims at mouse)'],['taunt','Taunt']],
  vish:[['a1','Throwing Knife (aims at mouse)'],['a2','Dash'],['a3','Slide (hold)'],['a4','Spike Kick'],['shot','Shotgun (aims at mouse)']],
  rift:[['a1','Big Slash'],['a2','Blink'],['a3','Grab'],['a4','Lunge']],
  jacob:[['a1','Grapple Hook'],['a2','Slam'],['a3','Uppercut'],['a4','Kick Off (aims at mouse)']]};
const BIND_TABS=[['general','GENERAL'],['vish','VISH'],['rift','RIFT'],['jacob','THE LASH']];
const BINDS=JSON.parse(JSON.stringify(BIND_DEF));
try{const s=JSON.parse(localStorage.getItem('deadbrawl.binds')||'{}');for(const g in BINDS)Object.assign(BINDS[g],s[g]||{});}catch(e){}
function saveBinds(){try{localStorage.setItem('deadbrawl.binds',JSON.stringify(BINDS));}catch(e){}}

function myChar(){return (G.me||p1).char;}
function bindOf(act,ch=myChar()){return (BINDS[ch]&&BINDS[ch][act])||BINDS.general[act];}
function held(act,ch){const k=bindOf(act,ch);return !!(keys[k]||(BIND_ALT[act]||[]).some(a=>keys[a]));}
// what the local player is holding (sent to the host as the guest's input)
function readHeld(){return {l:+held('left'),r:+held('right'),u:+held('jump'),d:+held('down'),q:+held('melee'),s:+held('a3')};}
// actions bound to a key for the local player's fighter
function actionsFor(code,ch=myChar()){const out=[];
  for(const g of['general',ch])for(const a in BINDS[g]||{})if(BINDS[g][a]===code)out.push(a);
  for(const a in BIND_ALT)if(BIND_ALT[a].includes(code)&&!out.includes(a))out.push(a);
  return out;}
const AIMED=new Set(['a1','a2','a3','a4','ult','shot']);
// a key or mouse button went down during a fight
function fightPress(code){
  for(const a of actionsFor(code)){
    if(a==='left')pressMe('kL');else if(a==='right')pressMe('kR');else if(a==='down')pressMe('kD');
    else if(a==='jump'){pressMe('kU');pressMe('jump');}
    else if(a==='melee'){if(held('down'))pressMe('slam');else pressMe('melee');}
    else if(AIMED.has(a))pressMe(a,mouseWorld());
    else pressMe(a);}
}
function keyName(c){if(!c)return '—';
  const M={Mouse0:'M1',Mouse1:'M3',Mouse2:'M2',Space:'SPACE',ShiftLeft:'SHIFT',ShiftRight:'R-SHIFT',ControlLeft:'CTRL',ControlRight:'R-CTRL',AltLeft:'ALT',AltRight:'R-ALT',
    ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Tab:'TAB',CapsLock:'CAPS',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\'};
  return M[c]||c.replace(/^Key|^Digit/,'').replace(/^Numpad/,'NUM ').toUpperCase();}

/* ---- controls panel: tabs + click a key to rebind ---- */
let bindTab='general',bindWait=null;
function bindRender(){
  const P=$('#ctrlPanel');
  P.querySelector('.btabs').innerHTML=BIND_TABS.map(([id,n])=>`<button class="btab${id===bindTab?' on':''}" data-t="${id}">${n}</button>`).join('');
  P.querySelector('.bt').innerHTML=BIND_LBL[bindTab].map(([a,l])=>`<tr><td>${l}</td><td><button class="bkey${bindWait&&bindWait[0]===bindTab&&bindWait[1]===a?' wait':''}" data-a="${a}">${bindWait&&bindWait[0]===bindTab&&bindWait[1]===a?'PRESS A KEY…':keyName(BINDS[bindTab][a])}</button></td></tr>`).join('');
  P.querySelectorAll('.btab').forEach(b=>b.onclick=e=>{e.stopPropagation();bindTab=b.dataset.t;bindWait=null;bindRender();sfx.sel();});
  P.querySelectorAll('.bkey').forEach(b=>b.onclick=e=>{e.stopPropagation();bindWait=[bindTab,b.dataset.a];bindRender();sfx.sel();});
  hudKeys();
}
function bindSet(code){
  const [g,a]=bindWait;bindWait=null;
  // a key can only do one thing for a fighter: clear it from the other actions it would clash with
  const scopes=g==='general'?Object.keys(BINDS):['general',g];
  for(const s of scopes)for(const k in BINDS[s])if(BINDS[s][k]===code&&!(s===g&&k===a))BINDS[s][k]='';
  BINDS[g][a]=code;saveBinds();bindRender();sfx.ok();
}
function bindReset(){for(const g in BIND_DEF)Object.assign(BINDS[g],BIND_DEF[g]);bindWait=null;saveBinds();bindRender();sfx.sel();}
// capture the next key / mouse button while waiting for a rebind
addEventListener('keydown',e=>{if(!bindWait)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.code==='Escape'){bindWait=null;bindRender();return;}bindSet(e.code);},true);
addEventListener('mousedown',e=>{if(!bindWait||e.target.closest('.btab'))return;if(e.target.closest('.bkey')&&e.button===0&&!e.target.closest('.bkey.wait'))return;
  e.preventDefault();e.stopImmediatePropagation();bindSet('Mouse'+e.button);},true);
addEventListener('contextmenu',e=>{if(bindWait||G.mode==='fight')e.preventDefault();});
// mouse buttons act like keys during a fight
addEventListener('mousedown',e=>{const c='Mouse'+e.button;keys[c]=true;
  if(G.mode==='fight'&&G.phase==='fight'&&!G.paused&&e.target.tagName==='CANVAS')fightPress(c);});
addEventListener('mouseup',e=>{keys['Mouse'+e.button]=false;});
// ability bar shows the current keys
function hudKeys(){const ch=myChar(),k=(id,a)=>{const el=document.querySelector('#ab-'+id+' .k');if(el)el.textContent=keyName(bindOf(a,ch));};
  const s=document.querySelector('#ab-s .k');k('q','melee');k('f','parry');k('1','a1');k('2','a2');k('3','a3');k('4','a4');k('s','dodge');k('r','ult');k('m','shot');if(s&&s.textContent==='SHIFT')s.textContent='⇧';}
bindRender();
$('#bReset').addEventListener('click',e=>{e.stopPropagation();bindReset();});

/* ---- browser shortcuts vs the game ----
   1. During a fight, stop Ctrl/Alt/Cmd shortcuts and the browser's use of game keys (Ctrl+D bookmark, Space scroll...).
      Ctrl+W/T/N can't be stopped this way; only fullscreen keyboard lock (3) captures them.
   2. Leaving mid-match asks first.
   3. Fullscreen (F11 or the menu button) locks the keyboard in Chrome/Edge, so every key reaches the game.
      Hold Esc to leave fullscreen. */
addEventListener('keydown',e=>{
  if(e.code==='F11'){e.preventDefault();toggleFullscreen();return;}
  if(G.mode==='fight'&&(e.ctrlKey||e.metaKey||e.altKey||e.code==='Tab'||actionsFor(e.code).length))e.preventDefault();},true);
addEventListener('keyup',e=>{if(G.mode==='fight'&&(e.code.startsWith('Alt')||e.code.startsWith('Control')))e.preventDefault();},true);
addEventListener('beforeunload',e=>{if((G.mode==='fight'&&G.phase!=='done')||G.online){e.preventDefault();e.returnValue='';}});
function fsOn(){return !!document.fullscreenElement;}
function fsLabel(){$$('.fsLbl').forEach(el=>el.textContent=fsOn()?'ON':'OFF');}
async function toggleFullscreen(){
  try{if(fsOn())await document.exitFullscreen();
    else{await document.documentElement.requestFullscreen({navigationUI:'hide'});if(navigator.keyboard&&navigator.keyboard.lock)await navigator.keyboard.lock();}}
  catch(e){}fsLabel();}
document.addEventListener('fullscreenchange',()=>{if(!fsOn()&&navigator.keyboard&&navigator.keyboard.unlock)navigator.keyboard.unlock();fsLabel();});
fsLabel();
