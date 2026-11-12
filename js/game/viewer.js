'use strict';
/* =============== VIEWER (sprite animation viewer) =============== */
const VANIMS={idle:['idle',8],run:['run',5],runb:['runb',8],jump:['jump',9],djump:['jump',7],crouch:['crouch',9],roll:['roll',6],dodgeb:['dodgeb',9],
  light:['light',8],heavy:['heavy',10],air:['air',8],parry:['parry',14],hit:['hit',10],kick:['kick',9],knife:['knife',10],dash:['dash',12],shotgun:['shotgun',10]};
let vChar='vish',vAnim='idle',vAlt=0,vSpr,vT=0;
function buildViewer(){
  vscene.add(new THREE.Mesh(new THREE.SphereGeometry(80,32,16),skyMat(0x0d0a12,0x2a1420,0x5a1a24,0.35)));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,0.02,8,60),new THREE.MeshBasicMaterial({color:0xd8232f}));ring.rotation.x=Math.PI/2;ring.position.y=0.005;vscene.add(ring);
  const fl=new THREE.Mesh(new THREE.CircleGeometry(1.25,40),new THREE.MeshBasicMaterial({color:0x1c1219}));fl.rotation.x=-Math.PI/2;vscene.add(fl);
  vSpr=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,alphaTest:0.05,depthWrite:false}));vSpr.renderOrder=3;vscene.add(vSpr);
}
buildViewer();
function viewerTick(){
  G.time++;vT++;
  const anim=vChar==='vish'?'vish_menu':vChar+'_idle',n=SPR[anim].length,spd=n>10?5:9,i=Math.floor(vT/spd)%n;
  const idx=Math.min(n-1,i),fr=SPR[anim][idx],tex=TEX[vAlt][anim][idx];
  if(tex.image){if(vSpr.material.map!==tex){vSpr.material.map=tex;vSpr.material.needsUpdate=true;}}
  const k=(fr.k||SPRK)*1.25,fl=fr.flip?-1:1;vSpr.scale.set(fr.w*k*fl,fr.h*k,1);
  vSpr.position.set((fr.w/2-fr.ax)*k*fl,(fr.ay-fr.h/2)*k+(['jump','djump','air','kick','hit'].includes(anim)&&idx>0&&idx<n-1?0.5:0),0.3);
  vcam.position.set(2.6,1.15,8.2);vcam.lookAt(2.6,1.1,0);
}

/* ---------- characters page (HTML profile; the 3D viewer scene is no longer shown) ---------- */
// play style, summary and stat bars (1-5) per fighter
const CVMETA={
  vish:{splash:'assets/splash_vish.webp',bg:'assets/bg_vish.webp',tag:'ALL-ROUNDER · ZONER',bio:'Keeps you at range with knives and a shotgun, then dashes through to start a combo. Strong at every distance.',st:{POWER:3,SPEED:4,RANGE:5,DIFFICULTY:2}},
  rift:{tag:'MIX-UPS · GRAPPLER',bio:'Teleports behind you and grabs through your guard. Hard to read, punishing up close, weak if you keep him guessing wrong.',st:{POWER:4,SPEED:3,RANGE:3,DIFFICULTY:4}},
  jacob:{tag:'POWERHOUSE · HOOK',bio:'Drags you in with the grapple hook and flattens you with slams. Slow on foot, huge damage once he connects.',st:{POWER:5,SPEED:2,RANGE:3,DIFFICULTY:3}},
};
const CVDATA={};
function cvInit(){if(cvInit.done)return;cvInit.done=1; // runs on first open (the fighter list is defined in menus.js, which loads after this file)
  CIDS.forEach(c=>{CVDATA[c]=[...document.querySelectorAll('#abl-'+c+' tr:not(.hd)')].map(r=>[...r.cells].map(td=>td.textContent.trim()));});
  $('#cvroster').innerHTML=CIDS.map(c=>'<div class="rp" data-c="'+c+'" style="background-image:url('+HUDIMG['face_'+c]+')"><b>'+CHARS[c].name+'</b></div>').join('');
  $$('#cvroster .rp').forEach(e=>e.addEventListener('click',()=>{if(e.dataset.c!==vChar){sfx.sel();cvShow(e.dataset.c);}}));}
let cvT=0;
function cvShow(c){cvInit();vChar=c;const M=CVMETA[c],rows=CVDATA[c];
  $('#cvnm').textContent=CHARS[c].name;$('#cvname').textContent=CHARS[c].name;$('#cvtag').textContent=M.tag;$('#cvbio').textContent=M.bio;
  $('#cvstats').innerHTML=Object.entries(M.st).map(([k,n])=>'<div>'+k+'<i>'+[1,2,3,4,5].map(x=>'<u'+(x<=n?' class="on"':'')+'></u>').join('')+'</i></div>').join('');
  $('#cvabl').innerHTML=rows.filter(r=>/^[1-4]$/.test(r[0])).map(r=>'<div class="cvcard"><div class="ky">'+r[0]+'</div><span class="dm">'+(r[2]==='—'?'':r[2])+'</span><div class="an">'+r[1].toUpperCase()+'</div><div class="ds">'+r[3]+'</div></div>').join('');
  const kit=rows.filter(r=>!/^[1-4]$/.test(r[0]));kit.splice(kit.findIndex(r=>r[0]==='SHIFT')+1,0,['HOLD BACK','Block','—','Block on the ground. Grabs go through it.']);
  $('#cvkit').innerHTML=kit.map(r=>'<div title="'+r[3].replace(/"/g,'&quot;')+'"><b>'+r[0]+'</b>'+r[1]+'</div>').join('');
  $$('#cvroster .rp').forEach(e=>e.classList.toggle('on',e.dataset.c===c));
  const v=$('#viewer');v.classList.toggle('hasSplash',!!M.splash);if(M.splash)$('#cvsplash').src=M.splash;
  v.style.setProperty('--cvbg',M.bg?'url('+M.bg+')':'url(assets/arena_bg.webp)');v.classList.remove('swap');void v.offsetWidth;v.classList.add('swap');cvT=0;cvStep(true);}
function cvStep(force){if(G.mode!=='viewer'&&!force)return;cvT++;
  const fr=SPR[vChar==='vish'?'vish_menu':vChar+'_idle'],f=fr[cvT%fr.length],k=f.k||SPRK,hv=68*(f.h*k/1.92),wv=hv*f.w/f.h,im=$('#cvimg');
  im.src=f.src;im.style.height=hv+'vh';im.style.left=`calc(23vw - ${(f.ax/f.w)*wv}vh)`;im.style.transformOrigin=(f.ax/f.w*100)+'% 100%';im.style.transform=f.flip?'scaleX(-1)':'';}
setInterval(()=>cvStep(),110);
function cvNav(d){sfx.sel();cvShow(CIDS[(CIDS.indexOf(vChar)+d+CIDS.length)%CIDS.length]);}
$('#vback').addEventListener('click',()=>{sfx.sel();toMenu();});
