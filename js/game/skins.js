'use strict';
/* =============== SKINS (recolours) ===============
   BLACK: unlocked for a fighter by beating that fighter in VS CPU on IMPOSSIBLE.
   GOLD : unlocked for a fighter by clearing ARCADE as that fighter.
   Frames are recoloured on the fly (once each, then cached): only each fighter's outfit colour changes,
   never skin; Platinum also gets streaks of the colour through her hair. */
const SKINS={black:{name:'BLACK',sw:'#1c1c22',how:c=>'Beat '+CHARS[c].name+' in VS CPU on IMPOSSIBLE'},gold:{name:'GOLD',sw:'linear-gradient(135deg,#7a4a0a,#e8b028 40%,#fff3ba 55%,#c88a18)',how:c=>'Clear ARCADE as '+CHARS[c].name}};
const UNL={black:{},gold:{}},SKINSEL={};
try{const s=JSON.parse(localStorage.getItem('deadbrawl.skins')||'{}');Object.assign(UNL.black,(s.u||{}).black);Object.assign(UNL.gold,(s.u||{}).gold);Object.assign(SKINSEL,s.sel);}catch(e){}
function skinSave(){try{localStorage.setItem('deadbrawl.skins',JSON.stringify({u:UNL,sel:SKINSEL}));}catch(e){}}
const skinHas=(c,s)=>!!(UNL[s]&&UNL[s][c]);
function skinUnlock(c,s){if(skinHas(c,s))return false;UNL[s][c]=1;skinSave();return true;}
function skinOf(c){const s=SKINSEL[c];return s&&skinHas(c,s)?s:'';}
// which pixels belong to the fighter's outfit colour (1) or Platinum's hair streaks (2); h in degrees, s/v 0-1, u/w = position in the frame 0-1
function skinMask(c,skin,h,s,v,u,w,anim){
  const near=(a,d)=>Math.abs(((h-a+540)%360)-180)<d;
  if(c==='vish')return (h>=330||h<=8)&&((s>=0.84&&v>0.28)||(s>=0.74&&v>0.42))?1:0; // the red trousers and trim; not the wooden arm, shirt, body or skin
  if(c==='rift')return near(355,20)&&s>0.5&&(skin!=='gold'||v>0.42)?1:0;                                   // gold leaves the dark blood alone
  if(c==='jacob')return (near(215,32)&&s>0.35)||(near(357,14)&&s>0.6&&v>0.25)?1:0;                          // shirt, plus the gauntlet arm and scarf
  if(c==='plat'){if(s>=0.75&&v>0.3&&(h<=18||h>=345))return 1;                                               // jacket / wolf mane
    // black: all of her hair goes black (hair shares its colours with her skin highlights, so it is picked out by where it sits in the frame)
    const hair=h>=9&&h<=32&&s>0.25&&s<0.66&&v>0.7,zone=w<0.085||(w<0.2&&!(u>0.43&&u<0.545&&w<0.175)&&!(u>0.3&&u<0.57&&w>=0.175))||(u<0.22&&w<0.75)||(u<0.3&&w>0.45&&w<0.73)||(u>0.57&&w>0.1&&w<0.22)||(u>0.39&&u<0.5&&w>0.56&&w<0.68);
    return skin==='black'&&anim==='plat_idle'&&hair&&zone?2:0;}
  return 0;}
function skinPix(skin,h,s,v){ // -> [h,s,v]
  if(skin==='black')return [h,s*0.12,v*0.42];
  return [27+8*v,Math.min(1,0.82+0.12*(1-v)),Math.min(1,0.22+v*0.82)]; // gold: bronze in the shadows, rich gold in the light (not yellow)
}
// polished gold: [brightness, r, g, b] from deep shadow to highlight
const GOLD_RAMP=[[0,26,13,3],[0.22,96,54,8],[0.45,176,116,18],[0.65,232,176,40],[0.82,255,220,104],[0.94,255,243,186],[1,255,252,232]];
const GOLD_GAIN={vish:1.2,rift:1.7,jacob:1.08,plat:0.88}; // darker outfits are lifted so they still read as gold, not bronze
function skinCanvas(c,skin,img,anim){
  const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const x=cv.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,cv.width,cv.height),p=d.data,W=cv.width,H=cv.height;
  if(skin==='gold'){ // the whole fighter cast in polished gold: brightness -> a metal ramp, with a soft diagonal sheen
    const G_=GOLD_GAIN[c]||1.15,R=GOLD_RAMP;
    for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const k=i/4,u=(k%W)/W,w=Math.floor(k/W)/H;
      let L=(0.3*p[i]+0.59*p[i+1]+0.11*p[i+2])/255;L=Math.min(1,L*G_);L=L*L*(3-2*L);                 // more contrast = more metallic
      L=Math.min(1,L+0.16*Math.pow(Math.max(0,Math.sin((u*1.6+w*2.4)*Math.PI*2)),8)*(L>0.25?1:0)); // sheen bands on the lit parts only
      let j=0;while(j<R.length-2&&L>R[j+1][0])j++;const a=R[j],b=R[j+1],t=Math.min(1,Math.max(0,(L-a[0])/(b[0]-a[0])));
      p[i]=a[1]+(b[1]-a[1])*t;p[i+1]=a[2]+(b[2]-a[2])*t;p[i+2]=a[3]+(b[3]-a[3])*t;}
    x.putImageData(d,0,0);return cv;}
  if(skin==='black'&&anim==='plat_wolf'){ // the wolf: black fur all over, red eyes; teeth and the moon pendant stay pale
    for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0;
      if(r>0.75&&g>0.6&&b<0.35){p[i]=255;p[i+1]=26;p[i+2]=20;continue;}  // yellow eyes -> red
      if(s<0.14&&mx>0.8)continue;
      const L=0.3*r+0.59*g+0.11*b,v=0.03+L*0.24;p[i]=v*255;p[i+1]=v*0.96*255;p[i+2]=v*1.08*255;}
    x.putImageData(d,0,0);return cv;}
  for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),dl=mx-mn;if(mx<0.12)continue;
    let h=0;if(dl>1e-5){h=mx===r?((g-b)/dl)%6:mx===g?(b-r)/dl+2:(r-g)/dl+4;h*=60;if(h<0)h+=360;}
    const s=mx?dl/mx:0,k=i/4,m=skinMask(c,skin,h,s,mx,(k%W)/W,Math.floor(k/W)/H,anim);if(!m)continue;
    let [nh,ns,nv]=skinPix(skin,h,s,mx);if(m===2){ns=0.12;nv=Math.max(0.05,0.08+(mx-0.8)*0.75);} // black hair, keeping a little of its shine
    const hh=((nh%360)+360)%360/60,ii=Math.floor(hh),f=hh-ii,P=nv*(1-ns),Q=nv*(1-f*ns),T=nv*(1-(1-f)*ns);
    const o=[[nv,T,P],[Q,nv,P],[P,nv,T],[P,Q,nv],[T,P,nv],[nv,P,Q]][ii%6];p[i]=o[0]*255;p[i+1]=o[1]*255;p[i+2]=o[2]*255;}
  x.putImageData(d,0,0);return cv;}
const SKC=new Map();
function skinTex(c,skin,anim,idx){const base=TEX[0][anim][idx];if(!skin||!base.image)return base;
  const key=c+skin+anim+idx;let t=SKC.get(key);
  if(!t){t=new THREE.Texture(skinCanvas(c,skin,base.image,anim));t.minFilter=base.minFilter;t.magFilter=base.magFilter;t.generateMipmaps=false;t.needsUpdate=true;SKC.set(key,t);}
  return t;}
const SKU=new Map();
function skinSrc(c,skin,anim,idx){const fr=SPR[anim][idx],base=TEX[0][anim][idx];if(!skin||!base.image)return fr.src;
  const key=c+skin+anim+idx;let u=SKU.get(key);if(!u){u=skinCanvas(c,skin,base.image,anim).toDataURL();SKU.set(key,u);}return u;}
