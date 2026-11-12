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

$$('.vtabs .vb').forEach(b=>b.addEventListener('click',()=>{sfx.sel();vChar=b.dataset.c;$$('.vtabs .vb').forEach(x=>x.classList.toggle('on',x===b));$('#vnm').textContent=CHARS[vChar].name;CIDS.forEach(c=>$('#abl-'+c).style.display=vChar===c?'':'none');}));
$('#vback').addEventListener('click',()=>{sfx.sel();toMenu();});
