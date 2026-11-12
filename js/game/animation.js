'use strict';
/* =============== ANIMATION =============== */
function targetPose(f,o){
  const t=G.time;let p;
  switch(f.state){
    case 'intro':p=ov(P.intro,{chest:[Math.sin(t*0.05)*0.02,-0.1,0]});break;
    case 'idle':p=ov(P.stance,{h:-0.12+Math.sin(t*0.09)*0.015,spine:[0.12+Math.sin(t*0.09)*0.03,-0.1,0]});break;
    case 'walkf':case 'walkb':{const bk=f.state==='walkb',ph=t*(bk?0.24:0.3)*(bk?-1:1),s=Math.sin(ph),c=Math.cos(ph);
      p=ov(P.stance,{h:-0.14+Math.abs(c)*0.05,spine:[bk?0.02:0.32,-0.1,0],head:[bk?0:-0.2,0.32,0],
        lgW:[-0.35+s*0.75,0,0.1],knW:[0.5+Math.max(0,-c)*1.0],lgF:[0.1-s*0.75,0,0.1],knF:[0.4+Math.max(0,c)*1.0],
        shF:[-0.6+s*0.5,0.2,0.25],elF:[-1.5],shW:[-0.3-s*0.35,0,0.22],elW:[-0.9]});break;}
    case 'jump':p=f.flip>0?ov(P.tuck):ov(P.jump,{cape:0.4+f.vy*3});break;
    case 'dodge':p=ov(P.tuck);break;
    case 'land':case 'wakeup':p=ov(P.crouch);break;
    case 'charge':{const k=Math.min(1,f.charge/CHARGE),tr=f.charge>10?Math.sin(t*1.7)*0.03*k:0;p=ov(P.charge,{h:-0.24-k*0.08,spine:[-0.05-k*0.1+tr,0,0],chest:[-0.1,-0.75-k*0.2,0]});break;}
    case 'parry':p=ov(P.parry);break;
    case 'attack':{const m=f.move;if(!m){p=ov(P.stance);break;}
      const base=f.airMove?P.jump:P[m.base];
      p=f.mt<=m.startup?ov(base,m.wind):ov(base,m.hit);
      if(f.mt>m.startup+m.active+m.recovery*0.5)p=ov(base,{});break;}
    case 'hitstun':p=ov(P.hurt);break;
    case 'stun':p=ov(P.hurt,{head:[-0.3+Math.sin(t*0.12)*0.2,Math.sin(t*0.09)*0.4,Math.sin(t*0.1)*0.3],spine:[-0.2+Math.sin(t*0.08)*0.1,0,Math.sin(t*0.07)*0.15],shW:[0.1,0,0.4],shF:[0.15,0,0.45]});break;
    case 'airhit':p=ov(P.airhit);break;
    case 'kd':case 'ko':p=ov(P.down);break;
    case 'victory':p=ov(P.victory,{head:[-0.25+Math.sin(t*0.05)*0.03,0.4,0]});break;
    default:p=ov(P.stance);
  }
  if(!['kd','ko','airhit','victory','intro'].includes(f.state)){p.cape=(p.cape||0.12)+clamp(f.vx*f.facing*4,-0.3,0.7)+Math.sin(t*0.06+f.idx)*0.04;}
  return p;
}
function blendPose(cur,tg,a){for(const k in tg){const v=tg[k];if(Array.isArray(v)){const c=cur[k];for(let i=0;i<3;i++)c[i]+=(v[i]-c[i])*a;}else cur[k]+=(v-cur[k])*a;}}
function applyPose(rig,c){
  const s=(g,v,m=1)=>g.rotation.set(v[0],v[1]*m,v[2]*m);
  rig.hips.position.y=1.0+c.h;s(rig.hips,c.hips);s(rig.spine,c.spine);s(rig.chest,c.chest);s(rig.neck,c.neck);s(rig.head,c.head);
  s(rig.shW,c.shW,-1);s(rig.elW,c.elW,-1);s(rig.shF,c.shF);s(rig.elF,c.elF);
  s(rig.lgW,c.lgW,-1);s(rig.knW,c.knW,-1);s(rig.lgF,c.lgF);s(rig.knF,c.knF);
  rig.cape.rotation.x=c.cape;
}
function animFighter(f,o){
  const tg=targetPose(f,o);
  const a=['attack','hitstun','airhit','dodge','parry'].includes(f.state)?0.5:(f.state==='jump'&&f.flip>0)?0.4:['kd','ko'].includes(f.state)?0.18:0.24;
  blendPose(f.cur,tg,a);
  applyPose(f.rig,f.cur);
  const r=f.rig;
  let spin=0;
  if(f.state==='dodge')spin=-f.dodgeDir*Math.PI*2*Math.min(1,f.mt/20);
  else if(f.state==='jump'&&f.flip>0)spin=-(Math.sign(f.vx)||f.facing)*Math.PI*2*(1-f.flip/24);
  const piv=0.62;
  r.root.position.set(f.x+piv*Math.sin(spin),f.y+piv-piv*Math.cos(spin),0);r.root.rotation.z=spin;
  r.body.scale.x=f.facing>0?1:-1;
  r.body.rotation.y=(f.facing>0?1.02:-1.02)+(f.cur.yaw||0)*f.facing*-1;
  r.root.visible=!(f.invuln>0&&f.state==='wakeup'&&G.time%4<2);
  f.shadow.position.x=f.x;const ss=Math.max(0.4,1-f.y*0.25);f.shadow.scale.set(ss*1.3,ss,1);
  drawSprite(f);
}
