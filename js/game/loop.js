'use strict';
/* =============== LOOP =============== */
let acc=0,last=performance.now();const STEP=1000/60;
function loop(now){
  requestAnimationFrame(loop);
  acc+=Math.min(100,now-last);last=now;
  // one bad frame must never freeze the fight: log the error and carry on with the next frame
  try{while(acc>=STEP){acc-=STEP;if(G.mode==='fight'&&G.online){if(G.online.role==='host'){tick();netSnap();}else guestTick();}else if(G.mode==='fight'&&!G.paused)tick();else if(G.mode==='viewer')viewerTick();}}
  catch(e){acc=0;console.error('[Deadbrawl] frame error',e);}
  if(G.mode==='fight'){updCam(false);renderer.render(scene,cam);}
  else if(G.mode==='viewer')renderer.render(vscene,vcam);
}
canvas.style.visibility='hidden';
requestAnimationFrame(loop);
window.__G=G;window.__DIFF=DIFF;window.__p=()=>[p1,p2];window.__go=a=>act(a);
