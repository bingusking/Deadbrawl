'use strict';
/* =============== AUDIO =============== */
let AC=null,muted=false,VOL=1;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC;}
function noise(dur,f,q,g,type='bandpass',f2){const a=ac();if(!a||muted||VOL<=0)return;g*=VOL;const n=a.createBuffer(1,a.sampleRate*dur,a.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(rnd()*2-1)*(1-i/d.length);const s=a.createBufferSource();s.buffer=n;const fl=a.createBiquadFilter();fl.type=type;fl.frequency.value=f;if(f2)fl.frequency.exponentialRampToValueAtTime(f2,a.currentTime+dur);fl.Q.value=q;const gn=a.createGain();gn.gain.value=g;s.connect(fl);fl.connect(gn);gn.connect(a.destination);s.start();}
function tone(f0,f1,dur,g,type='sine'){const a=ac();if(!a||muted||VOL<=0)return;g*=VOL;const o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f0,a.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),a.currentTime+dur);gn.gain.setValueAtTime(g,a.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);o.connect(gn);gn.connect(a.destination);o.start();o.stop(a.currentTime+dur);}
const sfx={
  hit:()=>{noise(0.12,1400,0.8,0.5);tone(160,50,0.14,0.45);},
  heavy:()=>{noise(0.22,900,0.6,0.7);tone(120,35,0.25,0.6);},
  block:()=>{noise(0.07,3200,3,0.35);tone(1100,800,0.05,0.12,'square');},
  whoosh:()=>noise(0.16,500,1.2,0.25,'bandpass',2200),
  shot:()=>{noise(0.25,2400,0.5,0.55,'lowpass',300);tone(260,55,0.22,0.35,'sawtooth');},
  jump:()=>noise(0.08,700,1,0.12),
  sel:()=>{tone(620,880,0.06,0.12,'square');noise(0.06,2600,1.4,0.08,'highpass');}, // menu move: blip + small slash
  ok:()=>{tone(440,880,0.12,0.15,'square');},
  super:()=>{tone(80,600,0.6,0.35,'sawtooth');noise(0.6,400,0.7,0.3,'bandpass',3000);},
  parry:()=>{tone(1500,2600,0.12,0.25,'square');noise(0.15,4000,2,0.35);tone(300,900,0.2,0.2,'triangle');},
  ko:()=>{tone(200,40,0.9,0.5,'sawtooth');noise(0.8,600,0.5,0.6,'lowpass',80);}
};
