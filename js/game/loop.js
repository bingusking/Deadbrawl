'use strict';
/* =============== LOOP =============== */
let acc=0,last=performance.now();const STEP=1000/60;
// if something does go wrong, show it in the corner so it can be reported (and keep the game running)
function reportErr(e){console.error('[Deadbrawl]',e);let el=document.getElementById('errbox');
  if(!el){el=document.createElement('div');el.id='errbox';el.style.cssText='position:fixed;left:8px;bottom:4px;z-index:99;font:12px monospace;color:#ff8a8a;background:#000a;padding:2px 6px;pointer-events:none;max-width:70vw';document.body.appendChild(el);}
  const where=((e&&e.stack)||'').split('\n')[1]||'';el.textContent='Bug caught (tell Claude): '+(e&&e.message||e)+' '+where.trim().replace(/^at /,'').replace(/https?:\/\/[^/]+\//,'');}
addEventListener('error',ev=>reportErr(ev.error||ev.message));
function loop(now){
  requestAnimationFrame(loop);
  acc+=Math.min(100,now-last);last=now;
  // one bad frame must never freeze the fight: log the error and carry on with the next frame
  try{while(acc>=STEP){acc-=STEP;if(G.mode==='fight'&&G.online){if(G.online.role==='host'){tick();netSnap();}else guestTick();}else if(G.mode==='fight'&&!G.paused)tick();else if(G.mode==='viewer')viewerTick();}}
  catch(e){acc=0;reportErr(e);}
  try{if(G.mode==='fight'){updCam(false);renderer.render(scene,cam);}
  else if(G.mode==='viewer')renderer.render(vscene,vcam);}catch(e){reportErr(e);}
}
canvas.style.visibility='hidden';
requestAnimationFrame(loop);
window.__G=G;window.__DIFF=DIFF;window.__p=()=>[p1,p2];window.__go=a=>act(a);
