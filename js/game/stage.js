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

/* ---------- arenas: the 3D colosseum plus the Blender-built arenas the fight can be knocked into ----------
   Each arena is a THREE.Group. During an ultimate's knock-off the next arena is placed beside the current one
   (arenaPlace), the fight travels across, then everything shifts back so the new arena sits at x=0 (arenaRecenter). */
const ARENA_GAP=72; // distance between arena centres during a transition
const colo=new THREE.Group();scene.add(colo);
for(const o of[...arena0,floorMesh]){scene.remove(o);colo.add(o);}
floorMesh.scale.x=80/120; // keep the colosseum floor clear of the arena next door
const ARENAS=[
  {name:'THE COLOSSEUM',grp:colo,glb:'assets/arena_colosseum.glb'},
  {name:'THE RING',glb:'assets/arena_ring.glb',img:'assets/bg_jacob.webp',beam:0x2a2214,fog:0x1e0c10,near:22,far:75,bg:0x120608},
  {name:'BACK ALLEY',glb:'assets/arena_alley.glb',img:'assets/bg_rift.webp',beam:0x22162c,fog:0x1c1026,near:22,far:80,bg:0x140a1c},
  {name:'THE SALOON',glb:'assets/arena_saloon.glb',img:'assets/bg_vish.webp',beam:0x2a1a0c,fog:0x24120a,near:24,far:70,bg:0x180c06}];
const ARENA0={fog:scene.fog.color.getHex(),near:scene.fog.near,far:scene.fog.far};
let arenaIdx=0,arenaNext=-1;
// painted fallback, only shown if an arena's .glb hasn't loaded
const ARENA_TEX={};
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(32,18),new THREE.MeshBasicMaterial({fog:false,depthWrite:false}));
backdrop.position.set(0,3.4,-10);backdrop.renderOrder=-1;backdrop.visible=false;scene.add(backdrop);
// Blender exports our colours as normalised ints in a second colour set; unpack them (dec: darken the palette to sit under the game's lights like the colosseum)
function arenaCol(at,dec){const n=at.count,o=new Float32Array(n*3),A=at.array,D=!at.normalized?1:A instanceof Uint16Array?65535:A instanceof Uint8Array?255:1,f=c=>(c/=D,dec?Math.pow(c,2.2):c);
  for(let i=0;i<n;i++){o[i*3]=f(at.getX(i));o[i*3+1]=f(at.getY(i));o[i*3+2]=f(at.getZ(i));}return new THREE.BufferAttribute(o,3);}
(function loadArenas(){
  if(!THREE.GLTFLoader)return;const L=new THREE.GLTFLoader();
  ARENAS.forEach((A,i)=>{if(!A.glb)return;
    const key=A.glb.replace(/^.*arena_|\.glb$/g,'');
    // arena geometry ships as base64 in js/data/arena_<key>.js (loaded in the background after the page starts)
    const sc=document.createElement('script');sc.src='js/data/arena_'+key+'.js';sc.async=true;
    sc.onload=()=>{const b=atob(ARENA_GLB[key]),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);delete ARENA_GLB[key];
    L.parse(u.buffer,'',gl=>{const g=A.grp||new THREE.Group();
      if(A.grp)for(const c of[...g.children])if(!(c.geometry&&c.geometry.type==='SphereGeometry'&&c.geometry.parameters.radius===150))c.visible=false; // colosseum: Blender model replaces the old blocks, keeps the sky
      const ms=[];gl.scene.traverse(o=>{if(o.isMesh)ms.push(o);});
      ms.forEach(o=>{const n=o.name||'',geo=o.geometry;if(geo.attributes.color_1){geo.setAttribute('color',arenaCol(geo.attributes.color_1,!n.startsWith('GLOW')));geo.deleteAttribute('color_1');}/* Blender exports a blank COLOR_0, then ours */let m;
        if(n.startsWith('GLOW'))m=new THREE.MeshBasicMaterial({vertexColors:true,fog:false});
        else if(n.startsWith('BEAM')){geo.deleteAttribute('color');m=new THREE.MeshBasicMaterial({color:A.beam||0x201810,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});} // light shafts
        else{m=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:gmap});o.add(new THREE.Mesh(prep(geo),outlineMat));}
        o.material=m;});
      g.add(gl.scene);if(g!==colo){g.visible=false;scene.add(g);}A.grp=g;
      if(arenaIdx===i)setArena(i);else if(arenaNext===i)arenaPlace(i,A.px||0);
    },()=>{});};document.head.appendChild(sc);});
})();
function arenaLook(A){ // fog + background for an arena
  scene.fog.color.setHex(A.fog??ARENA0.fog);scene.fog.near=A.near??ARENA0.near;scene.fog.far=A.far??ARENA0.far;
  scene.background=A.bg!==undefined?new THREE.Color(A.bg):null;}
function setArena(i){ // show one arena at the centre, everything else hidden
  arenaIdx=((i%ARENAS.length)+ARENAS.length)%ARENAS.length;arenaNext=-1;const A=ARENAS[arenaIdx];
  ARENAS.forEach(B=>{if(B.grp){B.grp.visible=B===A;B.grp.position.x=0;}});
  const fall=!A.grp&&A.img;backdrop.visible=!!fall;backdrop.position.x=0;
  if(fall){if(!ARENA_TEX[A.img]){const t=new THREE.TextureLoader().load(A.img);t.encoding=THREE.sRGBEncoding;ARENA_TEX[A.img]=t;}backdrop.material.map=ARENA_TEX[A.img];backdrop.material.needsUpdate=true;}
  arenaLook(A);G.camSnap=1;}
function arenaPlace(i,x){ // put the next arena beside this one, ready for the fight to travel into it
  arenaNext=((i%ARENAS.length)+ARENAS.length)%ARENAS.length;const A=ARENAS[arenaNext];A.px=x;
  if(A.grp){A.grp.position.x=x;A.grp.visible=true;}}
function arenaRecenter(x){ // the fight has arrived: shift the world back by x so the new arena is at the centre
  if(arenaNext<0)return;const old=ARENAS[arenaIdx],A=ARENAS[arenaNext];
  if(old.grp&&old!==A){old.grp.visible=false;old.grp.position.x=0;}
  arenaIdx=arenaNext;arenaNext=-1;if(A.grp)A.grp.position.x=0;
  const fall=!A.grp&&A.img;backdrop.visible=!!fall;
  if(fall){if(!ARENA_TEX[A.img]){const t=new THREE.TextureLoader().load(A.img);t.encoding=THREE.sRGBEncoding;ARENA_TEX[A.img]=t;}backdrop.material.map=ARENA_TEX[A.img];backdrop.material.needsUpdate=true;}
  arenaLook(A);camPos.x-=x;camLook.x-=x;cam.position.x-=x;}
// full-screen slash wipe that hides the arena swap
function arenaWipe(){const w=document.getElementById('wipe');w.classList.remove('go');void w.offsetWidth;w.classList.add('go');}
