'use strict';
/* =============== STAGE =============== */
function skyMat(top,mid,hor,sun){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{top:{value:new THREE.Color(top)},mid:{value:new THREE.Color(mid)},hor:{value:new THREE.Color(hor)},sun:{value:sun}},
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top,mid,hor;uniform float sun;varying vec3 vP;void main(){float h=vP.y;vec3 c=mix(hor,mid,smoothstep(-0.05,0.2,h));c=mix(c,top,smoothstep(0.2,0.65,h));float s=pow(max(0.0,dot(vP,normalize(vec3(-0.25,0.06,-1.0)))),10.0);c+=vec3(1.0,0.55,0.25)*s*sun;float cl=sin(vP.x*14.0+sin(vP.z*9.0))*0.5+0.5;c=mix(c,c*vec3(0.75,0.6,0.7),smoothstep(0.08,0.3,h)*smoothstep(0.55,0.3,h)*cl*0.5);gl_FragColor=vec4(c,1.0);}'});}
let embers,floorMesh,arena0=[];
function buildStage(){
  const before=new Set(scene.children);
  scene.fog=new THREE.Fog(0x5e3346,16,80);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(150,32,16),skyMat(0x2c2340,0x7a3a52,0xf08a4a,0.9)));
  scene.add(new THREE.HemisphereLight(0x9a7aa0,0x3a2228,0.55));
  const key=new THREE.DirectionalLight(0xffc49a,0.95);key.position.set(-5,8,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff6a3a,0.7);rim.position.set(4,5,-8);scene.add(rim);
  scene.add(new THREE.AmbientLight(0x4a3a50,0.35));
  // floor (stone tiles)
  const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
  x.fillStyle='#3a2c33';x.fillRect(0,0,256,256);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=48+((i*7+j*13)%5)*4;x.fillStyle=`rgb(${v+6},${v-6},${v})`;x.fillRect(i*64+2,j*64+2,60,60);}
  const ft=new THREE.CanvasTexture(cv);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(30,20);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,80),new THREE.MeshStandardMaterial({map:ft,roughness:0.55,metalness:0.25,color:0xa08a96}));
  floor.rotation.x=-Math.PI/2;scene.add(floor);floorMesh=floor;
  const stone=toon(0x3d2c3a),stoneD=toon(0x2a1f2b),win=new THREE.MeshBasicMaterial({color:0xffa04a}),ban=toon(0x7a1822,{side:THREE.DoubleSide});
  // central gothic tower
  const T=grp(scene,0,0,-30);
  const tiers=[[7,12,7,6],[5.4,9,5.4,16.5],[3.8,7,3.8,24.5],[2.6,4,2.6,30]];
  for(const t of tiers){part(T,BOX(t[0],t[1],t[2]),stone,[0,t[3],0]);
    for(let r=0;r<Math.floor(t[1]/2.4);r++)for(let c=-1;c<=1;c++)if(rnd()<0.8)part(T,BOX(t[0]*0.09,0.8,0.1),win,[c*t[0]*0.28,t[3]-t[1]/2+1.4+r*2.3,t[2]/2+0.06],[0,0,0],[1,1,1],false);}
  part(T,new THREE.ConeGeometry(2.2,9,4),stoneD,[0,36.5,0],[0,Math.PI/4,0]);
  for(const sx of[-1,1])for(const sz of[-1,1]){part(T,new THREE.ConeGeometry(0.7,5,4),stoneD,[sx*3.2,15.5,sz*3.2]);part(T,new THREE.ConeGeometry(0.5,4,4),stoneD,[sx*2.3,25,sz*2.3]);}
  // side arcades with banners
  for(const sd of[-1,1]){
    const A=grp(scene,sd*5,0,-21);
    for(let i=0;i<7;i++){part(A,BOX(0.9,8,0.9),stone,[sd*(i*3.4+2),4,0]);
      if(i<6){part(A,new THREE.TorusGeometry(1.25,0.35,6,12,Math.PI),stone,[sd*(i*3.4+3.7),7.2,0]);
        if(i%2===0)part(A,new THREE.PlaneGeometry(1.1,3.2),ban,[sd*(i*3.4+3.7),5.4,0.5],[0,0,0],[1,1,1],false);
        part(A,BOX(0.7,1.1,0.05),win,[sd*(i*3.4+3.7),2.0,-1.5],[0,0,0],[1,1,1],false);}}
    part(A,BOX(24,1.6,1.4),stone,[sd*12,9.2,0]);
  }
  // distant skyline
  for(let i=0;i<26;i++){const w=2+rnd()*4,h=6+rnd()*18,xx=(i-13)*5+rnd()*2;if(Math.abs(xx)<6)continue;
    const b=part(scene,BOX(w,h,w),stoneD,[xx,h/2,-48-rnd()*16],[0,0,0],[1,1,1],false);
    if(rnd()<0.6)part(scene,new THREE.ConeGeometry(w*0.5,h*0.4,4),stoneD,[xx,h+h*0.2,b.position.z],[0,Math.PI/4,0],[1,1,1],false);}
  // floating embers
  const N=260,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=(rnd()-0.5)*40;pos[i*3+1]=rnd()*14;pos[i*3+2]=-rnd()*22+3;}
  const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  embers=new THREE.Points(eg,new THREE.PointsMaterial({color:0xff9a4a,size:0.09,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(embers);
  arena0=scene.children.filter(o=>!before.has(o)&&!o.isLight&&o!==floorMesh&&o!==embers);
}
buildStage();

/* ---------- arenas: the 3D colosseum, plus painted backdrops the fight can be knocked into ---------- */
const ARENAS=[
  {name:'THE COLOSSEUM'},
  {name:'THE RING',img:'assets/bg_jacob.webp',floor:0x9a6250,fog:0x3a1a1c},
  {name:'BACK ALLEY',img:'assets/bg_rift.webp',floor:0x6a587a,fog:0x24142e},
  {name:'THE SALOON',img:'assets/bg_vish.webp',floor:0xa87050,fog:0x3a2014}];
let arenaIdx=0;const ARENA_TEX={};
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(32,18),new THREE.MeshBasicMaterial({fog:false,depthWrite:false}));
backdrop.position.set(0,3.4,-10);backdrop.renderOrder=-1;backdrop.visible=false;scene.add(backdrop);
const ARENA0={fog:scene.fog.color.getHex(),near:scene.fog.near,far:scene.fog.far,floor:floorMesh.material.color.getHex()};
function setArena(i){
  arenaIdx=i%ARENAS.length;const A=ARENAS[arenaIdx],painted=!!A.img;
  for(const o of arena0)o.visible=!painted;embers.visible=true;backdrop.visible=painted;
  if(painted){if(!ARENA_TEX[A.img]){const t=new THREE.TextureLoader().load(A.img);t.encoding=THREE.sRGBEncoding;ARENA_TEX[A.img]=t;}
    backdrop.material.map=ARENA_TEX[A.img];backdrop.material.needsUpdate=true;}
  floorMesh.material.color.setHex(painted?A.floor:ARENA0.floor);
  G.camSnap=1;scene.fog.color.setHex(painted?A.fog:ARENA0.fog);scene.fog.near=painted?24:ARENA0.near;scene.fog.far=painted?60:ARENA0.far;}
// full-screen slash wipe that hides the arena swap
function arenaWipe(){const w=document.getElementById('wipe');w.classList.remove('go');void w.offsetWidth;w.classList.add('go');}
