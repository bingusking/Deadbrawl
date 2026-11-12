'use strict';
/* =============== FX =============== */
const fx=[];
const sparkGeo=new THREE.PlaneGeometry(1,1);
function addFx(mesh,life,upd){mesh.userData.life=life;mesh.userData.max=life;mesh.userData.upd=upd;scene.add(mesh);fx.push(mesh);return mesh;}
function spark(x,y,col,n=12,spd=0.12,size=0.12){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(sparkGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    const a=rnd()*Math.PI*2,s=spd*(0.4+rnd());m.position.set(x,y,0.4);m.scale.set(size*(1+rnd()*2.5),size*0.35,1);m.rotation.z=a;
    const vx=Math.cos(a)*s,vy=Math.sin(a)*s;
    addFx(m,14+rnd()*8|0,(m,k)=>{m.position.x+=vx*k*1.2;m.position.y+=vy*k*1.2;m.material.opacity=k;});}
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.2,0.3,24),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  ring.position.set(x,y,0.45);addFx(ring,12,(m,k)=>{const s=1+(1-k)*3;m.scale.set(s,s,1);m.material.opacity=k;});
}
function trail(f,big){
  const r0=big?1.0:0.75,r1=big?1.55:1.25;
  const g=new THREE.RingGeometry(r0,r1,32,1,-0.9,2.4);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xfff4e8,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(f.x+f.facing*0.15,f.y+1.15,0.3);m.scale.x=f.facing;m.rotation.z=f.facing>0?-0.35:0.35;
  addFx(m,11,(mm,k)=>{mm.material.opacity=k*0.9;mm.rotation.z+=f.facing*-0.05;});
  const m2=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xd8232f,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  m2.position.copy(m.position);m2.position.z=0.25;m2.scale.set(f.facing*0.92,0.92,1);m2.rotation.z=m.rotation.z;
  addFx(m2,9,(mm,k)=>{mm.material.opacity=k*0.6;});
}
const dustGeo=new THREE.CircleGeometry(0.5,14);
function dust(x,n=6){for(let i=0;i<n;i++){const m=new THREE.Mesh(dustGeo,new THREE.MeshBasicMaterial({color:0xc9a89a,transparent:true,opacity:0.5,depthWrite:false}));
  m.position.set(x+(rnd()-0.5)*0.5,0.08,0.3);const vx=(rnd()-0.5)*0.06;m.scale.set(0.2,0.2,1);
  addFx(m,22,(mm,k)=>{mm.position.x+=vx;mm.position.y+=0.008;const s=0.12+(1-k)*0.3;mm.scale.set(s*1.4,s,1);mm.material.opacity=k*0.22;});}}
function muzzleFlash(f){const p=new THREE.Vector3();f.rig.muzzle.getWorldPosition(p);spark(p.x,p.y,0xffc060,8,0.08,0.1);}
function updFx(){for(let i=fx.length-1;i>=0;i--){const m=fx[i];m.userData.life--;const k=m.userData.life/m.userData.max;m.userData.upd(m,k);if(!m.userData.noBill)m.quaternion.copy(cam.quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),m.rotation.z));
  if(m.userData.life<=0){scene.remove(m);m.material.dispose();if(m.geometry!==sparkGeo&&m.geometry!==dustGeo&&!m.userData.shared)m.geometry.dispose();fx.splice(i,1);}}}
function clearFx(){for(const m of fx){scene.remove(m);}fx.length=0;}
