'use strict';
/* =============== SKINS (recolours) ===============
   BLACK: unlocked for a fighter by beating that fighter in VS CPU on IMPOSSIBLE.
   GOLD : unlocked for a fighter by clearing ARCADE as that fighter.
   Frames are recoloured on the fly (once each, then cached): only each fighter's outfit colour changes,
   never skin; Platinum also gets streaks of the colour through her hair. */
const SKINS={black:{name:'BLACK',sw:'#1c1c22',how:c=>'Beat '+CHARS[c].name+' in VS CPU on IMPOSSIBLE'},gold:{name:'GOLD',sw:'#d8a62a',how:c=>'Clear ARCADE as '+CHARS[c].name}};
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
    const hair=h>=17&&h<=30&&s>0.28&&s<0.46&&v>0.9,zone=anim==='plat_wolf'?w<0.42:(w<0.11||(u<0.4&&w<0.74));
    return hair&&zone&&((u*520+w*300)%64)<13?2:0;}
  return 0;}
function skinPix(skin,h,s,v){ // -> [h,s,v]
  if(skin==='black')return [h,s*0.12,v*0.42];
  return [27+8*v,Math.min(1,0.82+0.12*(1-v)),Math.min(1,0.22+v*0.82)]; // gold: bronze in the shadows, rich gold in the light (not yellow)
}
function skinCanvas(c,skin,img,anim){
  const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const x=cv.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,cv.width,cv.height),p=d.data,W=cv.width,H=cv.height;
  for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),dl=mx-mn;if(mx<0.12)continue;
    let h=0;if(dl>1e-5){h=mx===r?((g-b)/dl)%6:mx===g?(b-r)/dl+2:(r-g)/dl+4;h*=60;if(h<0)h+=360;}
    const s=mx?dl/mx:0,k=i/4,m=skinMask(c,skin,h,s,mx,(k%W)/W,Math.floor(k/W)/H,anim);if(!m)continue;
    let [nh,ns,nv]=skinPix(skin,h,s,mx);if(m===2){if(skin==='black'){ns=0.1;nv=0.3;}else{nv=Math.min(1,nv*0.95);}}
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
